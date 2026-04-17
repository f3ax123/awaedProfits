// ── Share Card ────────────────────────────────────────
window.closeShareModal = () => document.getElementById('shareModal').classList.remove('open');

window.downloadShareCard = function () {
  const canvas = document.getElementById('shareCanvas');
  const link = document.createElement('a');
  link.download = 'ribhi-trade-' + Date.now() + '.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
};

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

window.showShareCard = function (result) {
  if (!result) return;

  const modal  = document.getElementById('shareModal');
  const canvas = document.getElementById('shareCanvas');
  modal.classList.add('open');

  const W = 1620, H = 1080;
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  const isLight  = document.body.classList.contains('light');
  const isProfit = (result.totalProfit || 0) >= 0;

  // ── Palette ──────────────────────────────────────────
  const BG     = isLight ? '#fff4e6' : '#1a1210';
  const CARD   = isLight ? '#fffaf3' : '#231816';
  const CARD2  = isLight ? '#f5ece0' : '#2c201d';
  const BORDER = isLight ? '#e0d0bc' : '#3a2820';
  const TEXT   = isLight ? '#2a1a1a' : '#fff4e6';
  const MUTED  = '#8a6e62';
  const GREEN  = '#6db88a';
  const RED    = '#d4574a';
  const GOLD   = '#c8a96e';
  const ACCENT = isProfit ? GREEN : RED;

  // ── Background ───────────────────────────────────────
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = isLight ? 'rgba(75,46,46,0.04)' : 'rgba(255,244,230,0.025)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 48) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  // Radial glow
  const glow = ctx.createRadialGradient(W * 0.72, H * 0.28, 0, W * 0.72, H * 0.28, 560);
  glow.addColorStop(0, isProfit ? 'rgba(109,184,138,0.09)' : 'rgba(212,87,74,0.09)');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // ── Left accent bar ───────────────────────────────────
  ctx.fillStyle = ACCENT;
  roundRect(ctx, 60, 80, 7, H - 160, 4);
  ctx.fill();

  // ── Brand ─────────────────────────────────────────────
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 32px serif';
  ctx.textAlign = 'right';
  ctx.fillText('رِبحي', W - 80, 136);

  ctx.fillStyle = MUTED;
  ctx.font = '18px sans-serif';
  ctx.fillText('ribhi.app', W - 80, 165);

  // ── P&L Label ─────────────────────────────────────────
  ctx.fillStyle = MUTED;
  ctx.font = '24px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('إجمالي الربح / الخسارة', 100, 166);

  // ── Big number ────────────────────────────────────────
  const profitStr =
    (isProfit ? '+' : '') +
    Number(result.totalProfit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) +
    ' ريال';

  ctx.fillStyle = ACCENT;
  ctx.font = 'bold 100px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(profitStr, 100, 310);

  // ── Percent pill ──────────────────────────────────────
  const pct    = result.overallPct || 0;
  const pctStr = (pct >= 0 ? '▲ ' : '▼ ') + Math.abs(pct).toFixed(2) + '%';

  ctx.font = 'bold 28px sans-serif';
  const pctW = ctx.measureText(pctStr).width + 48;
  ctx.fillStyle = isProfit ? 'rgba(109,184,138,0.15)' : 'rgba(212,87,74,0.15)';
  roundRect(ctx, 100, 338, pctW, 54, 27);
  ctx.fill();
  ctx.fillStyle = ACCENT;
  ctx.fillText(pctStr, 124, 374);

  // ── Divider ───────────────────────────────────────────
  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(100, 442); ctx.lineTo(W - 100, 442); ctx.stroke();

  // ── Stats cards ───────────────────────────────────────
  const stats = [
    { label: 'رأس المال',  value: Number(result.totalInvested).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ريال', color: GOLD },
    { label: 'الصفقات',   value: String((result.trades || []).length),   color: TEXT },
    { label: 'الأسهم',    value: String((result.symbols || []).length),   color: TEXT },
    { label: 'العائد',    value: (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%', color: ACCENT },
  ];

  const colW = (W - 200) / stats.length;

  stats.forEach((s, i) => {
    const cx = 100 + i * colW;
    ctx.fillStyle = CARD;
    roundRect(ctx, cx + 10, 462, colW - 20, 148, 16);
    ctx.fill();
    ctx.strokeStyle = BORDER; ctx.lineWidth = 1;
    roundRect(ctx, cx + 10, 462, colW - 20, 148, 16);
    ctx.stroke();

    ctx.fillStyle = MUTED;
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(s.label, cx + colW / 2, 516);

    ctx.fillStyle = s.color;
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText(s.value, cx + colW / 2, 566);
  });

  // ── Trade rows ────────────────────────────────────────
  const rows = (result.rows || []).filter(r => r.profit !== null).slice(0, 4);
  const ROW_Y0 = 666;
  const ROW_H  = 82;
  const COL_X  = [100, 400, 680, 980, 1360];
  const HEADS  = ['الرمز', 'الشراء (ريال)', 'البيع (ريال)', 'الربح / الخسارة', 'النسبة'];

  // Header row
  ctx.fillStyle = MUTED;
  ctx.font = '19px sans-serif';
  ctx.textAlign = 'left';
  HEADS.forEach((h, i) => ctx.fillText(h, COL_X[i], ROW_Y0 - 12));

  // Separator
  ctx.strokeStyle = BORDER; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(100, ROW_Y0); ctx.lineTo(W - 100, ROW_Y0); ctx.stroke();

  rows.forEach((r, idx) => {
    const y = ROW_Y0 + idx * ROW_H;

    // Zebra stripe
    if (idx % 2 === 0) {
      ctx.fillStyle = isLight ? 'rgba(75,46,46,0.025)' : 'rgba(255,244,230,0.018)';
      ctx.fillRect(92, y + 4, W - 184, ROW_H - 4);
    }

    const ip  = (r.profit || 0) >= 0;
    const fmt = v => Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Symbol + name
    ctx.fillStyle = TEXT;
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(r.sym, COL_X[0], y + 44);
    ctx.fillStyle = MUTED;
    ctx.font = '17px sans-serif';
    ctx.fillText(r.name || '', COL_X[0], y + 66);

    // Buy
    ctx.fillStyle = TEXT;
    ctx.font = '20px sans-serif';
    ctx.fillText(r.buyTotal != null ? fmt(r.buyTotal) : '—', COL_X[1], y + 52);

    // Sell
    ctx.fillText(r.sellTotal != null ? fmt(r.sellTotal) : '—', COL_X[2], y + 52);

    // P&L
    ctx.fillStyle = ip ? GREEN : RED;
    ctx.font = 'bold 21px sans-serif';
    ctx.fillText((ip ? '+' : '') + fmt(r.profit), COL_X[3], y + 52);

    // Pct
    ctx.fillText((r.pct >= 0 ? '+' : '') + r.pct.toFixed(2) + '%', COL_X[4], y + 52);
  });

  // ── Footer ────────────────────────────────────────────
  ctx.fillStyle = BORDER;
  ctx.fillRect(0, H - 64, W, 1);

  ctx.fillStyle = MUTED;
  ctx.font = '19px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ribhi.app  •  تحليل الصفقات بالذكاء الاصطناعي', W / 2, H - 22);
};
