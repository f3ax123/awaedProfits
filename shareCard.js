// ── Share Card — Canva-style vertical dark card ──────────────────────────────
window.closeShareModal = () => document.getElementById('shareModal').classList.remove('open');

window.downloadShareCard = function () {
  const canvas = document.getElementById('shareCanvas');
  const link   = document.createElement('a');
  link.download = 'ribhi-trade-' + Date.now() + '.png';
  link.href     = canvas.toDataURL('image/png');
  link.click();
};

// ── Wave helper (draws one sine wave path) ───────────────────────────────────
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

// ── Draw the full wave mesh (like Canva background) ──────────────────────────
function drawWaveMesh(ctx, W, H) {
  // Top-right wave cluster
  for (let i = 0; i < 28; i++) {
    const baseY = -60 + i * 11;
    drawWave(ctx, W, H, baseY, 38 + i * 1.5, 1.4, i * 0.22, 0.055 + i * 0.003);
  }
  // Middle main wave cluster
  for (let i = 0; i < 40; i++) {
    const baseY = H * 0.28 + i * 10;
    drawWave(ctx, W, H, baseY, 55 + Math.sin(i * 0.4) * 30, 1.2, i * 0.18, 0.07 + i * 0.002);
  }
  // Bottom-left wave cluster
  for (let i = 0; i < 24; i++) {
    const baseY = H * 0.83 + i * 13;
    drawWave(ctx, W, H, baseY, 32 + i * 2, 1.6, i * 0.25, 0.045 + i * 0.003);
  }
}

// ── Main render function ──────────────────────────────────────────────────────
window.showShareCard = function (result) {
  if (!result) return;

  const modal  = document.getElementById('shareModal');
  const canvas = document.getElementById('shareCanvas');
  modal.classList.add('open');

  // A4 portrait (794 × 1123 pt @ 2x)
  const W = 794, H = 1123;
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // ── Build display data ────────────────────────────────────────────────────
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
  const ACCENT = isProfit ? GREEN : RED;

  // ── 1. Background — pure black ────────────────────────────────────────────
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, W, H);

  // ── 2. Wave mesh ──────────────────────────────────────────────────────────
  drawWaveMesh(ctx, W, H);

  // ── 3. Subtle color glow in wave area ────────────────────────────────────
  const glow = ctx.createRadialGradient(W * 0.5, H * 0.48, 0, W * 0.5, H * 0.48, W * 0.55);
  glow.addColorStop(0, isProfit ? 'rgba(93,190,128,0.07)' : 'rgba(217,80,74,0.07)');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // ── 4. Brand name — top center ────────────────────────────────────────────
  ctx.save();
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.font         = '500 22px serif';
  ctx.fillStyle    = 'rgba(255,255,255,0.88)';
  ctx.fillText('رِبـحـي', W / 2, 68);
  ctx.restore();

  // ── 5. Thin separator below brand ────────────────────────────────────────
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth   = 0.5;
  ctx.beginPath(); ctx.moveTo(W * 0.35, 86); ctx.lineTo(W * 0.65, 86); ctx.stroke();

  // ── 6. Big percentage — center of card ────────────────────────────────────
  // Backdrop pill behind number
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
  ctx.shadowBlur   = 0;
  ctx.fillText(pctStr, W / 2, pillY + pillH / 2 + 6);
  ctx.restore();

  // ── 7. Profit/loss amount — below percentage ──────────────────────────────
  ctx.save();
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.font         = '400 20px "Helvetica Neue", Helvetica, Arial, sans-serif';
  ctx.fillStyle    = isProfit ? 'rgba(93,190,128,0.85)' : 'rgba(217,80,74,0.85)';
  ctx.fillText(profitStr, W / 2, pillY + pillH + 34);
  ctx.restore();

  // ── 8. Divider strip ─────────────────────────────────────────────────────
  const divY = H * 0.72;
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth   = 0.5;
  ctx.beginPath(); ctx.moveTo(60, divY); ctx.lineTo(W - 60, divY); ctx.stroke();

  // ── 9. Symbol(s) — below divider ─────────────────────────────────────────
  ctx.save();
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.font         = `500 ${symbolsStr.length > 10 ? '22' : '28'}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
  ctx.fillStyle    = 'rgba(255,255,255,0.75)';
  ctx.letterSpacing = '0.15em';
  ctx.fillText(symbolsStr || '—', W / 2, divY + 56);
  ctx.restore();

  // Stats row — capital & trades count
  const statsY = divY + 110;
  const statItems = [
    { label: 'رأس المال', value: Number(result.totalInvested || 0).toLocaleString('en-US', { maximumFractionDigits: 0 }) + ' ﷼' },
    { label: 'الصفقات',  value: String((result.trades || []).length) },
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

  // ── 10. Date — bottom ────────────────────────────────────────────────────
  ctx.save();
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.font         = '300 13px "Helvetica Neue", Helvetica, Arial, sans-serif';
  ctx.fillStyle    = 'rgba(255,255,255,0.28)';
  ctx.letterSpacing = '0.12em';
  ctx.fillText(today, W / 2, H - 52);
  ctx.restore();

  // ── 11. Bottom watermark ─────────────────────────────────────────────────
  ctx.save();
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.font         = '300 11px "Helvetica Neue", Helvetica, Arial, sans-serif';
  ctx.fillStyle    = 'rgba(255,255,255,0.15)';
  ctx.fillText('ribhi.app', W / 2, H - 28);
  ctx.restore();
};
