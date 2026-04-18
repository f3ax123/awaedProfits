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

// ── موجة واحدة ───────────────────────────────────────────────────────────────
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

// ── شبكة الموجات — مطابقة لكانفا ────────────────────────────────────────────
function drawWaveMesh(ctx, W, H) {
  // أعلى اليمين
  for (let i = 0; i < 28; i++) {
    drawWave(ctx, W, H, -60 + i * 11, 38 + i * 1.5, 1.4, i * 0.22, 0.055 + i * 0.003);
  }
  // الوسط الرئيسي
  for (let i = 0; i < 40; i++) {
    drawWave(ctx, W, H, H * 0.28 + i * 10, 55 + Math.sin(i * 0.4) * 30, 1.2, i * 0.18, 0.07 + i * 0.002);
  }
  // أسفل اليسار
  for (let i = 0; i < 24; i++) {
    drawWave(ctx, W, H, H * 0.83 + i * 13, 32 + i * 2, 1.6, i * 0.25, 0.045 + i * 0.003);
  }
}

// ── الدالة الرئيسية ────────────────────────────────────────────────────────────
window.showShareCard = async function (result) {
  if (!result) return;

  await ensureFonts();

  const modal  = document.getElementById('shareModal');
  const canvas = document.getElementById('shareCanvas');
  modal.classList.add('open');

  // أبعاد كانفا الأصلية: 794 × 1123
  const W = 794, H = 1123;
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // ── البيانات ──────────────────────────────────────────────────────────────
  const pct       = result.overallPct || 0;
  const pctStr    = (pct >= 0 ? '+' : '') + Math.abs(pct).toFixed(2) + '%';
  const symbolsStr = (result.symbols || []).slice(0, 4).join('  ·  ') || '—';

  // التاريخ بنفس تنسيق كانفا: YYYY/M/D
  const now   = new Date();
  const today = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()}`;

  const GOLD = '#C8A84B';

  // ── 1. خلفية سوداء ────────────────────────────────────────────────────────
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, W, H);

  // ── 2. شبكة الموجات ───────────────────────────────────────────────────────
  drawWaveMesh(ctx, W, H);

  // ── 3. "رِبـحـي" — أعلى المنتصف ─────────────────────────────────────────
  // Foda Naskh | حجم 20 | أبيض
  // الموضع من كانفا: top ≈ 63px من المنتصف العلوي
  ctx.save();
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.font         = '400 20px "FodaNaskh", serif';
  ctx.fillStyle    = '#FFFFFF';
  ctx.fillText('رِبـحـي', W / 2, 63);
  ctx.restore();

  // ── 4. نسبة الربح — وسط الموجات ─────────────────────────────────────────
  // Poppins Bold | حجم 83.4 | ذهبي
  // الموضع من كانفا: top ≈ 467px → مركز النص ≈ 467 + (ارتفاع الخط/2) ≈ 515px
  ctx.save();
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font         = '700 83.4px "Poppins", sans-serif';
  ctx.fillStyle    = GOLD;
  ctx.fillText(pctStr, W / 2, 550);
  ctx.restore();

  // ── 5. رمز السهم — تحت الموجات ──────────────────────────────────────────
  // Kenao | حجم 26 | أبيض
  // الموضع من كانفا: top ≈ 882px → مركز ≈ 903px
  ctx.save();
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.font         = '400 26px "Kenao", serif';
  ctx.fillStyle    = '#FFFFFF';
  ctx.fillText(symbolsStr, W / 2, 903);
  ctx.restore();

  // ── 6. التاريخ — أسفل البطاقة ────────────────────────────────────────────
  // Open Sans | حجم 12.9 | أبيض opacity 50%
  // الموضع من كانفا: top ≈ 1033px → مركز ≈ 1040px
  ctx.save();
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.font         = '400 12.9px "OpenSans", sans-serif';
  ctx.fillStyle    = 'rgba(255,255,255,0.5)';
  ctx.fillText(today, W / 2, 1040);
  ctx.restore();
};
