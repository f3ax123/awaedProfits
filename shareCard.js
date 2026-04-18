// ── Share Card — Canva-style vertical dark card ──────────────────────────────
window.closeShareModal = () => document.getElementById('shareModal').classList.remove('open');

window.downloadShareCard = function () {
  const canvas = document.getElementById('shareCanvas');
  const link   = document.createElement('a');
  link.download = 'ribhi-trade-' + Date.now() + '.png';
  link.href     = canvas.toDataURL('image/png');
  link.click();
};

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

function drawWaveMesh(ctx, W, H) {
  for (let i = 0; i < 28; i++) {
    const baseY = -60 + i * 11;
    drawWave(ctx, W, H, baseY, 38 + i * 1.5, 1.4, i * 0.22, 0.055 + i * 0.003);
  }
  for (let i = 0; i < 40; i++) {
    const baseY = H * 0.28 + i * 10;
    drawWave(ctx, W, H, baseY, 55 + Math.sin(i * 0.4) * 30, 1.2, i * 0.18, 0.07 + i * 0.002);
  }
  for (let i = 0; i < 24; i++) {
    const baseY = H * 0.83 + i * 13;
    drawWave(ctx, W, H, baseY, 32 + i * 2, 1.6, i * 0.25, 0.045 + i * 0.003);
  }
}

// ── Logo data ─────────────────────────────────────────────────────────────────
const _LOGO_PNG_B64 = "data:image/png;base64,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";

function _loadLogoImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// ── Main render function ──────────────────────────────────────────────────────
window.showShareCard = async function (result) {
  if (!result) return;

  const modal  = document.getElementById('shareModal');
  const canvas = document.getElementById('shareCanvas');
  modal.classList.add('open');

  const W = 794, H = 1123;
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  const isProfit  = (result.totalProfit || 0) >= 0;
  const pct       = result.overallPct || 0;
  const pctStr    = (pct >= 0 ? '+' : '') + Math.abs(pct).toFixed(2) + '%';
  const profitStr = (isProfit ? '+' : '') +
    Number(result.totalProfit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) +
    ' ريال';
  const symbolsStr = (result.symbols || []).slice(0, 4).join('  ·  ');
  const today      = new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'numeric', day: 'numeric' });

  const GOLD  = '#C8A84B';
  const GREEN = '#5DBE80';
  const RED   = '#D9504A';

  // 1. Background
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, W, H);

  // 2. Wave mesh
  drawWaveMesh(ctx, W, H);

  // 3. Color glow
  const glow = ctx.createRadialGradient(W * 0.5, H * 0.48, 0, W * 0.5, H * 0.48, W * 0.55);
  glow.addColorStop(0, isProfit ? 'rgba(93,190,128,0.07)' : 'rgba(217,80,74,0.07)');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // 4. Real logo (PNG with transparent background)
  const logoImg = await _loadLogoImage(_LOGO_PNG_B64);
  if (logoImg) {
    const logoH = 56;
    const logoW = Math.round(logoImg.naturalWidth * logoH / logoImg.naturalHeight);
    const lx = (W - logoW) / 2;
    const ly = 28;
    ctx.drawImage(logoImg, lx, ly, logoW, logoH);
  } else {
    ctx.save();
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.font         = '500 22px serif';
    ctx.fillStyle    = 'rgba(255,255,255,0.88)';
    ctx.fillText('رِبـحـي', W / 2, 68);
    ctx.restore();
  }

  // 5. Thin separator below logo
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth   = 0.5;
  ctx.beginPath(); ctx.moveTo(W * 0.35, 98); ctx.lineTo(W * 0.65, 98); ctx.stroke();

  // 6. Big percentage pill
  const pillW = 320, pillH = 120, pillX = (W - pillW) / 2, pillY = H * 0.34;
  ctx.save();
  ctx.shadowBlur  = 60;
  ctx.shadowColor = isProfit ? 'rgba(93,190,128,0.35)' : 'rgba(217,80,74,0.35)';
  ctx.fillStyle   = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.roundRect(pillX, pillY - 10, pillW, pillH, 20);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.font         = `bold ${pct.toFixed(0).length >= 3 ? '88' : '108'}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
  ctx.fillStyle    = GOLD;
  ctx.fillText(pctStr, W / 2, pillY + pillH / 2 + 6);
  ctx.restore();

  // 7. Profit/loss amount
  ctx.save();
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.font         = '400 20px "Helvetica Neue", Helvetica, Arial, sans-serif';
  ctx.fillStyle    = isProfit ? 'rgba(93,190,128,0.85)' : 'rgba(217,80,74,0.85)';
  ctx.fillText(profitStr, W / 2, pillY + pillH + 34);
  ctx.restore();

  // 8. Divider
  const divY = H * 0.72;
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth   = 0.5;
  ctx.beginPath(); ctx.moveTo(60, divY); ctx.lineTo(W - 60, divY); ctx.stroke();

  // 9. Symbols
  ctx.save();
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.font         = `500 ${symbolsStr.length > 10 ? '22' : '28'}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
  ctx.fillStyle    = 'rgba(255,255,255,0.75)';
  ctx.fillText(symbolsStr || '—', W / 2, divY + 56);
  ctx.restore();

  // 10. Stats row
  const statsY = divY + 110;
  const statItems = [
    { label: 'رأس المال', value: Number(result.totalInvested || 0).toLocaleString('en-US', { maximumFractionDigits: 0 }) + ' ﷼' },
    { label: 'الصفقات',  value: String((result.trades || result.rows || []).length) },
    { label: 'الأسهم',   value: String((result.symbols || []).length) },
  ];
  const colW = W / statItems.length;
  statItems.forEach((s, i) => {
    const cx = colW * i + colW / 2;
    ctx.save();
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.font         = 'bold 18px "Helvetica Neue", Helvetica, Arial, sans-serif';
    ctx.fillStyle    = 'rgba(255,255,255,0.85)';
    ctx.fillText(s.value, cx, statsY);
    ctx.font         = '400 12px "Helvetica Neue", Helvetica, Arial, sans-serif';
    ctx.fillStyle    = 'rgba(255,255,255,0.35)';
    ctx.fillText(s.label, cx, statsY + 24);
    ctx.restore();
  });

  // 11. Date
  ctx.save();
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.font         = '300 13px "Helvetica Neue", Helvetica, Arial, sans-serif';
  ctx.fillStyle    = 'rgba(255,255,255,0.28)';
  ctx.fillText(today, W / 2, H - 52);
  ctx.restore();

  // 12. Watermark
  ctx.save();
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.font         = '300 11px "Helvetica Neue", Helvetica, Arial, sans-serif';
  ctx.fillStyle    = 'rgba(255,255,255,0.15)';
  ctx.fillText('ribhi.app', W / 2, H - 28);
  ctx.restore();
};

// ── Share from history record ─────────────────────────────────────────────────
window.showShareCardFromHistory = function(historyData) {
  if (!historyData) return;
  const result = {
    totalProfit:   historyData.totalProfit   || 0,
    totalInvested: historyData.totalInvested || 0,
    overallPct:    historyData.overallPct    || 0,
    symbols:       historyData.symbols       || [],
    trades:        [],
    rows:          historyData.rows          || [],
  };
  if (historyData.tradesCount) {
    while (result.rows.length < historyData.tradesCount) result.rows.push({});
  }
  window.showShareCard(result);
};
