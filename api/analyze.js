export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { imageBase64, imageMime } = req.body;

  if (!imageBase64 || !imageMime) {
    return res.status(400).json({ error: 'Missing image data' });
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
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              inline_data: {
                mime_type: imageMime,
                data: imageBase64
              }
            },
            { text: prompt }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1000
        }
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return res.status(200).json({ rawText });

  } catch (err) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
