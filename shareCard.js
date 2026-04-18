// ── Share Card — مطابق لتصميم كانفا بالضبط ──────────────────────────────────
// الخطوط: Foda Naskh (ربحي) | Poppins Bold (النسبة) | Kanao Sans Serif (السهم) | Open Sans (التاريخ)

window.closeShareModal = () => document.getElementById('shareModal').classList.remove('open');

window.downloadShareCard = function () {
  const canvas = document.getElementById('shareCanvas');
  const link   = document.createElement('a');
  link.download = 'ribhi-trade-' + Date.now() + '.png';
  link.href     = canvas.toDataURL('image/png');
  link.click();
};

// ── تحميل الخطوط من Google Fonts ─────────────────────────────────────────────
function loadFonts() {
  return new Promise((resolve) => {
    // Poppins و Open Sans متاحة من Google Fonts
    // Foda Naskh و Kanao — نستخدم بديل مقبول إذا لم تكن متاحة
    const fontsToLoad = [
      new FontFace('Poppins', 'url(https://fonts.gstatic.com/s/poppins/v21/pxiByp8kv8JHgFVrLCz7Z1xlFQ.woff2)', { weight: '700' }),
      new FontFace('Open Sans', 'url(https://fonts.gstatic.com/s/opensans/v40/memvYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0C4n.woff2)', { weight: '400' }),
    ];

    Promise.all(fontsToLoad.map(f => f.load().then(loaded => {
      document.fonts.add(loaded);
      return loaded;
    }))).then(() => resolve()).catch(() => resolve()); // resolve حتى لو فشل التحميل
  });
}

// ── Wave helper ───────────────────────────────────────────────────────────────
function drawWave(ctx, W, H, offsetY, amplitude, frequency, phase, alpha, lineWidth = 0.7) {
  ctx.beginPath();
  ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
  ctx.lineWidth   = lineWidth;
  for (let x = 0; x <= W; x += 2) {
    const y = offsetY + Math.sin((x / W) * Math.PI * 2 * frequency + phase) * amplitude;
    x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();
}

// ── موجات الخلفية — مطابقة لكانفا ────────────────────────────────────────────
function drawWaveMesh(ctx, W, H) {
  // Top-right cluster
  for (let i = 0; i < 28; i++) {
    const baseY = -60 + i * 11;
    drawWave(ctx, W, H, baseY, 38 + i * 1.5, 1.4, i * 0.22, 0.055 + i * 0.003);
  }
  // Middle main cluster
  for (let i = 0; i < 40; i++) {
    const baseY = H * 0.28 + i * 10;
    drawWave(ctx, W, H, baseY, 55 + Math.sin(i * 0.4) * 30, 1.2, i * 0.18, 0.07 + i * 0.002);
  }
  // Bottom-left cluster
  for (let i = 0; i < 24; i++) {
    const baseY = H * 0.83 + i * 13;
    drawWave(ctx, W, H, baseY, 32 + i * 2, 1.6, i * 0.25, 0.045 + i * 0.003);
  }
}

// ── الدالة الرئيسية ────────────────────────────────────────────────────────────
window.showShareCard = async function (result) {
  if (!result) return;

  // تحميل الخطوط أولاً
  await loadFonts();

  const modal  = document.getElementById('shareModal');
  const canvas = document.getElementById('shareCanvas');
  modal.classList.add('open');

  // أبعاد كانفا: 794 × 1123
  const W = 794, H = 1123;
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // ── البيانات ──────────────────────────────────────────────────────────────
  const pct    = result.overallPct || 0;
  const pctStr = (pct >= 0 ? '+' : '') + Math.abs(pct).toFixed(2) + '%';
  const symbolsStr = (result.symbols || []).slice(0, 4).join('  ·  ') || '—';
  const today  = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'numeric', day: 'numeric'
  });

  const GOLD = '#C8A84B';

  // ── 1. خلفية سوداء ────────────────────────────────────────────────────────
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, W, H);

  // ── 2. موجات الخلفية ──────────────────────────────────────────────────────
  drawWaveMesh(ctx, W, H);

  // ── 3. اسم التطبيق "ربحي" — أعلى المنتصف ────────────────────────────────
  // Foda Naskh حجم 20 — نستخدم serif كـ fallback لو الخط ما اتحمّل
  ctx.save();
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.font         = '400 20px "Foda Naskh", "Amiri", "Scheherazade New", serif';
  ctx.fillStyle    = 'rgba(255,255,255,0.88)';
  ctx.fillText('رِبـحـي', W / 2, 63);
  ctx.restore();

  // ── 4. نسبة الربح — وسط البطاقة ──────────────────────────────────────────
  // Poppins Bold حجم 83.4 — مركز عمودي تقريباً H*0.45
  ctx.save();
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.font         = '700 83.4px "Poppins", "Helvetica Neue", Helvetica, sans-serif';
  ctx.fillStyle    = GOLD;
  ctx.fillText(pctStr, W / 2, H * 0.458);
  ctx.restore();

  // ── 5. رمز السهم — أسفل النسبة ───────────────────────────────────────────
  // Kanao Sans Serif حجم 26 — fallback: sans-serif
  ctx.save();
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.font         = '400 26px "Kanao", "Kanao Sans Serif", "Tenor Sans", "Cormorant Garamond", serif';
  ctx.fillStyle    = 'rgba(255,255,255,0.88)';
  ctx.fillText(symbolsStr, W / 2, H * 0.788);
  ctx.restore();

  // ── 6. التاريخ — أسفل البطاقة ────────────────────────────────────────────
  // Open Sans حجم 12.9 opacity 50%
  ctx.save();
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.font         = '400 12.9px "Open Sans", sans-serif';
  ctx.fillStyle    = 'rgba(255,255,255,0.50)';
  ctx.fillText(today, W / 2, H * 0.926);
  ctx.restore();
};
