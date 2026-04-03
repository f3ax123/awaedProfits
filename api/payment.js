export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const secretKey = process.env.MOYASAR_SECRET_KEY;
  if (!secretKey) return res.status(500).json({ error: 'MOYASAR_SECRET_KEY not set' });

  const { amount, currency, description, token, plan, userId, userEmail } = req.body || {};
  if (!amount || !token || !plan || !userId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const response = await fetch('https://api.moyasar.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(secretKey + ':').toString('base64')
      },
      body: JSON.stringify({
        amount: amount, // in halalas (1 SAR = 100 halalas)
        currency: currency || 'SAR',
        description: description || `Awaed Profits - ${plan}`,
        source: { type: 'token', token },
        metadata: { plan, userId, userEmail: userEmail || '' }
      })
    });

    const data = await response.json();

    if (data.status === 'paid') {
      return res.status(200).json({ success: true, paymentId: data.id, plan });
    } else {
      return res.status(400).json({ error: data.message || 'Payment failed', details: data });
    }

  } catch (err) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
