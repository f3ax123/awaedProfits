export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not set in environment variables' });
  }

  const { imageBase64, imageMime } = req.body || {};
  if (!imageBase64 || !imageMime) {
    return res.status(400).json({ error: 'Missing imageBase64 or imageMime' });
  }

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

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: imageMime, data: imageBase64 }
            },
            { type: 'text', text: prompt }
          ]
        }]
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: `Claude error: ${data.error.message}` });
    }

    const rawText = data.content?.[0]?.text || '';
    return res.status(200).json({ rawText });

  } catch (err) {
    return res.status(500).json({ error: err.message || 'Unknown server error' });
  }
}
