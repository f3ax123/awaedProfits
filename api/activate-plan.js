const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const crypto = require('crypto');

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n').replace(/^"|"$/g, ''),
    }),
  });
}

const adminAuth = getAuth();
const adminDb   = getFirestore();

const PADDLE_WEBHOOK_SECRET = process.env.PADDLE_WEBHOOK_SECRET;
const VALID_PLANS = ['pro', 'max'];
const PADDLE_PRICES = {
  'pri_01knfqy0rs94ttgnh8qrf5fjey': 'pro',
  'pri_01knfr0vh8p01bc73jvxa98cq0': 'max',
};

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Paddle-Signature');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' });

  const paddleSignature = req.headers['paddle-signature'];
  if (paddleSignature) {
    return handlePaddleWebhook(req, res, paddleSignature);
  }

  const authHeader = req.headers['authorization'] || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization' });
  }

  let decodedToken;
  try {
    decodedToken = await adminAuth.verifyIdToken(authHeader.slice(7), true);
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const { transactionId, plan } = req.body || {};

  if (!transactionId || typeof transactionId !== 'string' || !VALID_PLANS.includes(plan)) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const txRef  = adminDb.collection('payment_transactions').doc(transactionId);
  const txSnap = await txRef.get();
  if (txSnap.exists) {
    return res.status(200).json({ success: true, message: 'Already activated' });
  }

  const isValid = await verifyPaddleTransaction(transactionId, plan);
  if (!isValid) {
    await logSecurityEvent('FAKE_PAYMENT_ATTEMPT', {
      uid: decodedToken.uid,
      transactionId,
      plan,
    });
    return res.status(403).json({ error: 'Payment verification failed' });
  }

  await activatePlanInDB(decodedToken.uid, plan, transactionId);
  return res.status(200).json({ success: true, plan });
};

async function handlePaddleWebhook(req, res, signature) {
  const rawBody = JSON.stringify(req.body);

  const parts = signature.split(';');
  const ts = parts[0]?.replace('ts=', '');
  const h1 = parts[1]?.replace('h1=', '');

  if (!ts || !h1) return res.status(400).json({ error: 'Invalid signature format' });

  const age = Date.now() - parseInt(ts, 10) * 1000;
  if (age > 5 * 60 * 1000) {
    return res.status(400).json({ error: 'Webhook too old (possible replay attack)' });
  }

  const payload  = `${ts}:${rawBody}`;
  const expected = crypto
    .createHmac('sha256', PADDLE_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  const hBuf = Buffer.from(h1,       'hex');
  const eBuf = Buffer.from(expected, 'hex');
  if (hBuf.length !== eBuf.length || !crypto.timingSafeEqual(hBuf, eBuf)) {
    await logSecurityEvent('INVALID_PADDLE_WEBHOOK', { ts });
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  const event = req.body;

  if (event.event_type === 'transaction.completed') {
    const txId    = event.data?.id;
    const uid     = event.data?.custom_data?.userId;
    const priceId = event.data?.items?.[0]?.price?.id;
    const plan    = PADDLE_PRICES[priceId];

    if (!uid || !plan || !txId) {
      return res.status(400).json({ error: 'Missing required fields in webhook' });
    }

    const txRef  = adminDb.collection('payment_transactions').doc(txId);
    const txSnap = await txRef.get();
    if (!txSnap.exists) {
      await activatePlanInDB(uid, plan, txId);
    }
  }

  return res.status(200).json({ received: true });
}

async function activatePlanInDB(uid, plan, transactionId) {
  const now   = new Date();
  const batch = adminDb.batch();

  batch.set(adminDb.collection('users').doc(uid), {
    plan,
    usageCount:       0,
    usageMonth:       `${now.getFullYear()}-${now.getMonth()}`,
    planActivatedAt:  FieldValue.serverTimestamp(),
  }, { merge: true });

  batch.set(adminDb.collection('payment_transactions').doc(transactionId), {
    uid,
    plan,
    transactionId,
    processedAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();
}

async function verifyPaddleTransaction(transactionId, expectedPlan) {
  try {
    const r = await fetch(
      `https://api.paddle.com/transactions/${transactionId}`,
      { headers: { Authorization: `Bearer ${process.env.PADDLE_API_KEY}` } }
    );
    if (!r.ok) return false;
    const data    = await r.json();
    const status  = data?.data?.status;
    const priceId = data?.data?.items?.[0]?.price?.id;
    return status === 'completed' && PADDLE_PRICES[priceId] === expectedPlan;
  } catch {
    return false;
  }
}

async function logSecurityEvent(type, data) {
  try {
    await adminDb.collection('security_logs').add({
      type, ...data,
      timestamp: FieldValue.serverTimestamp(),
    });
  } catch (e) {
    console.error('Security log failed:', e);
  }
}
