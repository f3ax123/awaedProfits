const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

// ── تهيئة Firebase Admin (مرة واحدة فقط) ──────────────
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

const PLAN_LIMITS = { free: 5, pro: 100, max: Infinity };

const ipRateMap  = new Map();
const uidRateMap = new Map();

function checkRateLimit(key, map, maxRequests = 10, windowMs = 60_000) {
  const now   = Date.now();
  const entry = map.get(key) || { count: 0, resetAt: now + windowMs };
  if (now > entry.resetAt) { entry.count = 0; entry.resetAt = now + windowMs; }
  entry.count++;
  map.set(key, entry);
  return entry.count <= maxRequests;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' });

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
           || req.socket?.remoteAddress
           || 'unknown';

  if (!checkRateLimit(ip, ipRateMap, 20, 60_000)) {
    await logSecurityEvent('IP_RATE_LIMIT', { ip });
    return res.status(429).json({ error: 'Too many requests. Try again later.' });
  }

  const authHeader = req.headers['authorization'] || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  const idToken = authHeader.slice(7);
  let decodedToken;

  try {
    decodedToken = await adminAuth.verifyIdToken(idToken, true);
  } catch (err) {
    await logSecurityEvent('INVALID_TOKEN', { ip, errorCode: err.code });
    const msg = err.code === 'auth/id-token-revoked'
      ? 'Session revoked. Please sign in again.'
      : 'Invalid or expired token';
    return res.status(401).json({ error: msg });
  }

  const uid = decodedToken.uid;

  if (!checkRateLimit(uid, uidRateMap, 5, 60_000)) {
    await logSecurityEvent('USER_RATE_LIMIT', { uid, ip });
    return res.status(429).json({ error: 'Too many requests per user. Slow down.' });
  }

  const userRef  = adminDb.collection('users').doc(uid);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    await userRef.set({
      plan:       'free',
      usageCount: 0,
      usageMonth: '',
      createdAt:  FieldValue.serverTimestamp(),
    });
  }

  const snapData = userSnap.exists ? userSnap.data() : { plan: 'free', usageCount: 0 };
  const plan     = snapData.plan || 'free';
  const limit    = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;

  const now      = new Date();
  const monthKey = `${now.getFullYear()}-${now.getMonth()}`;
  let usageCount = snapData.usageCount || 0;

  if (snapData.usageMonth !== monthKey) usageCount = 0;

  if (plan !== 'max' && usageCount >= limit) {
    await logSecurityEvent('LIMIT_EXCEEDED', { uid, plan, usageCount, limit });
    return res.status(403).json({ error: 'Plan limit reached', plan, usageCount, limit });
  }

  const { imageBase64, imageMime } = req.body || {};

  if (!imageBase64 || typeof imageBase64 !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid imageBase64' });
  }

  const ALLOWED_MIMES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
  if (!imageMime || !ALLOWED_MIMES.includes(imageMime)) {
    return res.status(400).json({ error: 'Invalid image type' });
  }

  const approxBytes = (imageBase64.length * 3) / 4;
  if (approxBytes > 10 * 1024 * 1024) {
    return res.status(400).json({ error: 'Image too large (max 10MB)' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Server configuration error' });

  const prompt = `أنت محلل صفقات تداول محترف. استخرج بيانات الصفقات من الصورة وأعد JSON فقط بهذا الشكل بدون أي نص خارجه:

{
  "trades": [
    {
      "symbol": "رمز السهم",
      "name": "اسم الشركة",
      "type": "buy أو sell",
      "shares": عدد_الأسهم_رقم,
      "total": المبلغ_الإجمالي_رقم
    }
  ],
  "notes": "ملاحظات اختيارية"
}

قواعد:
- type يجب أن يكون "buy" (شراء) أو "sell" (بيع) فقط
- total و shares يجب أن تكون أرقام وليس نصوص
- لا تضف backticks أو markdown، JSON فقط`;

  let rawText;
  try {
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: imageMime, data: imageBase64 } },
            { type: 'text',  text: prompt },
          ],
        }],
      }),
    });

    const claudeData = await claudeRes.json();
    if (claudeData.error) throw new Error(claudeData.error.message);
    rawText = claudeData.content?.[0]?.text || '';

  } catch (err) {
    console.error('Claude API error:', err);
    return res.status(502).json({ error: 'Analysis service unavailable' });
  }

  let newUsageCount = usageCount;
  try {
    await adminDb.runTransaction(async (tx) => {
      const freshSnap = await tx.get(userRef);
      const freshData = freshSnap.exists ? freshSnap.data() : { plan: 'free', usageCount: 0 };
      let freshCount  = freshData.usageCount || 0;

      if (freshData.usageMonth !== monthKey) freshCount = 0;

      if (plan !== 'max' && freshCount >= limit) {
        throw new Error('LIMIT_EXCEEDED_IN_TRANSACTION');
      }

      newUsageCount = freshCount + 1;
      tx.set(userRef, {
        usageCount:     newUsageCount,
        usageMonth:     monthKey,
        lastAnalysisAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    });
  } catch (err) {
    if (err.message === 'LIMIT_EXCEEDED_IN_TRANSACTION') {
      return res.status(403).json({ error: 'Plan limit reached (concurrent check)' });
    }
    console.error('Firestore transaction error:', err);
  }

  return res.status(200).json({
    rawText,
    usageCount: newUsageCount,
    usageMonth: monthKey,
  });
};

async function logSecurityEvent(type, data) {
  try {
    await adminDb.collection('security_logs').add({
      type,
      ...data,
      timestamp: FieldValue.serverTimestamp(),
    });
  } catch (e) {
    console.error('Security log failed:', e);
  }
}
