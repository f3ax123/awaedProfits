// ── Share Card — مطابق لتصميم كانفا بالضبط ──────────────────────────────────

window.closeShareModal = () => document.getElementById('shareModal').classList.remove('open');

window.downloadShareCard = function () {
  const canvas = document.getElementById('shareCanvas');
  const link   = document.createElement('a');
  link.download = 'ribhi-trade-' + Date.now() + '.png';
  link.href     = canvas.toDataURL('image/png');
  link.click();
};

// ── تحميل الخطوط ─────────────────────────────────────────────────────────────
let fontsLoaded = false;

async function ensureFonts() {
  if (fontsLoaded) return;
  try {
    const fodaFace = new FontFace(
      'FodaNaskh',
      'url(/fonts/foda-free-font.ttf) format("truetype")'
    );
    const kenaoFace = new FontFace(
      'Kenao',
      'url(/fonts/Kenao.otf) format("opentype")'
    );
    const poppinsFace = new FontFace(
      'Poppins',
      'url(https://fonts.gstatic.com/s/poppins/v21/pxiByp8kv8JHgFVrLCz7Z1xlFQ.woff2) format("woff2")',
      { weight: '700' }
    );
    const openSansFace = new FontFace(
      'OpenSans',
      'url(https://fonts.gstatic.com/s/opensans/v40/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0B4gaVI.woff2) format("woff2")',
      { weight: '400' }
    );

    const loaded = await Promise.allSettled([
      fodaFace.load(),
      kenaoFace.load(),
      poppinsFace.load(),
      openSansFace.load(),
    ]);

    loaded.forEach(r => {
      if (r.status === 'fulfilled') document.fonts.add(r.value);
    });

    await document.fonts.ready;
    fontsLoaded = true;
  } catch (e) {
    console.warn('Font load warning:', e);
    fontsLoaded = true;
  }
}

// ── تحميل صورة ───────────────────────────────────────────────────────────────
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = reject;
    img.src     = src;
  });
}

// ── الدالة الرئيسية ────────────────────────────────────────────────────────────
window.showShareCard = async function (result) {
  if (!result) return;

  await ensureFonts();

  const modal  = document.getElementById('shareModal');
  const canvas = document.getElementById('shareCanvas');
  modal.classList.add('open');

  // أبعاد كانفا: 794 × 1123 — نرسم بـ 3x لجودة عالية
  const SCALE = 3;
  const W = 794, H = 1123;
  canvas.width        = W * SCALE;
  canvas.height       = H * SCALE;
  canvas.style.width  = W + 'px';
  canvas.style.height = H + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(SCALE, SCALE);

  // ── البيانات ──────────────────────────────────────────────────────────────
  const pct        = result.overallPct || 0;
  const pctStr     = (pct >= 0 ? '+' : '') + Math.abs(pct).toFixed(2) + '%';
  const symbolsStr = (result.symbols || []).slice(0, 4).join('  ·  ') || '—';
  const now        = new Date();
  const today      = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()}`;
  const GOLD       = '#C8A84B';

  // ── 1. صورة الخلفية ───────────────────────────────────────────────────────
  try {
    const bgImg = await loadImage('/images/share-bg.png');
    ctx.drawImage(bgImg, 0, 0, W, H);
  } catch (e) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, W, H);
    console.warn('Background image not found, using black fallback');
  }

  // ── 2. "رِبـحـي" — أعلى المنتصف ─────────────────────────────────────────
  ctx.save();
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.font         = '400 20px "FodaNaskh", serif';
  ctx.fillStyle    = '#FFFFFF';
  ctx.fillText('رِبـحـي', W / 2, 63);
  ctx.restore();

  // ── 3. نسبة الربح — وسط الموجات ─────────────────────────────────────────
  ctx.save();
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font         = '700 83.4px "Poppins", sans-serif';
  ctx.fillStyle    = GOLD;
  ctx.fillText(pctStr, W / 2, 550);
  ctx.restore();

  // ── 4. رمز السهم — تحت الموجات ──────────────────────────────────────────
  ctx.save();
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.font         = '400 26px "Kenao", serif';
  ctx.fillStyle    = '#FFFFFF';
  ctx.fillText(symbolsStr, W / 2, 903);
  ctx.restore();

  // ── 5. التاريخ — أسفل البطاقة ────────────────────────────────────────────
  ctx.save();
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.font         = '400 12.9px "OpenSans", sans-serif';
  ctx.fillStyle    = 'rgba(255,255,255,0.5)';
  ctx.fillText(today, W / 2, 1040);
  ctx.restore();
};
window.showShareCardFromHistory = function(historyData) {
  const result = {
    overallPct:    historyData.overallPct    || 0,
    symbols:       historyData.symbols       || [],
    totalProfit:   historyData.totalProfit   || 0,
    totalInvested: historyData.totalInvested || 0,
    rows:          historyData.rows          || [],
    trades:        historyData.rows          || [],
  };
  window.showShareCard(result);
};
