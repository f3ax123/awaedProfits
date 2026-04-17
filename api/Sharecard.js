// ══════════════════════════════════════════════════════
// shareCard.js — مكوّن تصدير صورة الصفقة لتطبيق رِبحي
// الاستخدام: استدعِ showShareCard(result) بعد تحليل الصورة
// ══════════════════════════════════════════════════════

// ── 1. حقن CSS ──────────────────────────────────────
(function injectStyles() {
  if (document.getElementById('ribhi-share-styles')) return;
  const style = document.createElement('style');
  style.id = 'ribhi-share-styles';
  style.textContent = `
    .ribhi-share-overlay {
      position: fixed; inset: 0; z-index: 900;
      background: rgba(0,0,0,0.85);
      display: flex; align-items: center; justify-content: center;
      padding: 20px;
      animation: ribhiFadeIn .2s ease;
      backdrop-filter: blur(4px);
    }
    @keyframes ribhiFadeIn { from { opacity:0 } to { opacity:1 } }
    .ribhi-share-modal {
      display: flex; flex-direction: column; align-items: center; gap: 20px;
      max-width: 360px; width: 100%;
    }
    .ribhi-share-card {
      width: 320px; height: 480px; position: relative;
      border-radius: 20px; overflow: hidden;
      box-shadow: 0 24px 80px rgba(0,0,0,0.7);
    }
    .ribhi-share-card canvas {
      position: absolute; inset: 0; width: 100%; height: 100%;
    }
    .ribhi-share-card-content {
      position: absolute; inset: 0; z-index: 2;
      display: flex; flex-direction: column;
      align-items: center; justify-content: space-between;
      padding: 36px 24px 32px;
      font-family: 'IBM Plex Sans Arabic', sans-serif;
      direction: rtl;
    }
    .ribhi-share-logo {
      font-size: 22px; font-weight: 700; color: #fff; letter-spacing: -0.5px;
    }
    .ribhi-share-pct {
      font-size: clamp(52px, 18vw, 80px); font-weight: 700;
      letter-spacing: -3px; line-height: 1; text-align: center;
    }
    .ribhi-share-pct.profit { color: #c8a96e; }
    .ribhi-share-pct.loss   { color: #d4574a; }
    .ribhi-share-bottom { text-align: center; }
    .ribhi-share-symbols {
      font-size: 22px; font-weight: 600; color: #fff;
      letter-spacing: 3px; margin-bottom: 6px;
    }
    .ribhi-share-amount {
      font-size: 13px; color: rgba(255,255,255,0.5);
    }
    .ribhi-share-date {
      font-size: 11px; color: rgba(255,255,255,0.3);
      margin-top: 4px; letter-spacing: 1px;
    }
    .ribhi-share-actions {
      display: flex; gap: 10px;
    }
    .ribhi-share-btn {
      border: none; border-radius: 12px;
      padding: 12px 22px; font-size: 14px; font-weight: 700;
      cursor: pointer; transition: all .2s;
      font-family: 'IBM Plex Sans Arabic', sans-serif;
    }
    .ribhi-share-btn.close {
      background: rgba(255,255,255,0.1); color: #fff;
      border: 1px solid rgba(255,255,255,0.15);
    }
    .ribhi-share-btn.close:hover { background: rgba(255,255,255,0.2); }
    .ribhi-share-btn.download {
      background: #c8a96e; color: #0a0a0a;
      display: flex; align-items: center; gap: 8px;
    }
    .ribhi-share-btn.download:hover { opacity: .88; transform: translateY(-1px); }
    .ribhi-share-btn.download:disabled { opacity: .5; cursor: not-allowed; transform: none; }
  `;
  document.head.appendChild(style);
})();

// ── 2. رسم الموجات على Canvas ───────────────────────
function drawWavesOnCanvas(canvas, isProfit, phase) {
  const W = canvas.width, H = canvas.height;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, W, H);

  const colorBase = isProfit ? '200,169,110' : '212,87,74';
  const scaleX = W / 320, scaleY = H / 480;

  // طبقات ملوّنة
  for (let layer = 0; layer < 6; layer++) {
    ctx.beginPath();
    const baseY = (220 + layer * 18) * scaleY;
    const amp   = (35  - layer * 4)  * scaleY;
    const freq  = (0.012 + layer * 0.003) / scaleX;
    const phs   = phase + layer * 0.7;
    const alpha = Math.max(0, 0.09 - layer * 0.013).toFixed(3);

    ctx.moveTo(0, baseY);
    for (let x = 0; x <= W; x += 2) {
      const y = baseY
        + Math.sin(x * freq + phs) * amp
        + Math.sin(x * freq * 1.7 + phs * 1.3) * (amp * 0.5)
        + Math.sin(x * freq * 0.5 + phs * 0.6) * (amp * 0.3);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
    ctx.fillStyle = `rgba(${colorBase},${alpha})`;
    ctx.fill();
  }

  // خطوط نعمة
  for (let layer = 0; layer < 8; layer++) {
    const baseY = (150 + layer * 22) * scaleY;
    const amp   = (20  + layer * 5)  * scaleY;
    const freq  = (0.015 + layer * 0.004) / scaleX;
    const phs   = phase * 0.8 + layer * 0.5 + 1.2;
    const opacity = Math.max(0, 0.05 - layer * 0.005).toFixed(3);
    if (opacity <= 0) continue;

    ctx.beginPath();
    ctx.moveTo(0, baseY);
    for (let x = 0; x <= W; x += 2) {
      const y = baseY
        + Math.sin(x * freq + phs) * amp
        + Math.cos(x * freq * 2.1 + phs) * (amp * 0.4);
      ctx.lineTo(x, y);
    }
    ctx.strokeStyle = `rgba(${colorBase},${opacity})`;
    ctx.lineWidth = 0.7;
    ctx.stroke();
  }

  // تدرجات الحواف
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0,   'rgba(10,10,10,0.65)');
  grad.addColorStop(0.3, 'rgba(10,10,10,0)');
  grad.addColorStop(0.7, 'rgba(10,10,10,0)');
  grad.addColorStop(1,   'rgba(10,10,10,0.75)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  [[W, 0], [0, H]].forEach(([cx, cy]) => {
    const r = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.55);
    r.addColorStop(0, `rgba(${colorBase},0.06)`);
    r.addColorStop(1, 'rgba(10,10,10,0)');
    ctx.fillStyle = r;
    ctx.fillRect(0, 0, W, H);
  });
}

// ── 3. الدالة الرئيسية ───────────────────────────────
window.showShareCard = function(result) {
  // result = { totalProfit, totalInvested, overallPct, symbols, rows }
  const isProfit = (result.totalProfit || 0) >= 0;
  const pct      = (result.overallPct || 0);
  const pctText  = (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%';
  const amtText  = (isProfit ? '+' : '') +
    Number(result.totalProfit || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2, maximumFractionDigits: 2
    }) + ' ريال';
  const symsText = (result.symbols || []).slice(0, 3).join(' · ') || '—';
  const today    = new Date();
  const dateText = `${today.getFullYear()}/${today.getMonth()+1}/${today.getDate()}`;

  // ── إنشاء DOM ──
  const overlay = document.createElement('div');
  overlay.className = 'ribhi-share-overlay';
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };

  overlay.innerHTML = `
    <div class="ribhi-share-modal">
      <div class="ribhi-share-card" id="ribhi-card-wrap">
        <canvas id="ribhi-wave-canvas" width="320" height="480"></canvas>
        <div class="ribhi-share-card-content">
          <div class="ribhi-share-logo">رِبحي</div>
          <div class="ribhi-share-pct ${isProfit ? 'profit' : 'loss'}">${pctText}</div>
          <div class="ribhi-share-bottom">
            <div class="ribhi-share-symbols">${symsText}</div>
            <div class="ribhi-share-amount">${amtText}</div>
            <div class="ribhi-share-date">${dateText}</div>
          </div>
        </div>
      </div>
      <div class="ribhi-share-actions">
        <button class="ribhi-share-btn close" id="ribhi-close-btn">إغلاق</button>
        <button class="ribhi-share-btn download" id="ribhi-dl-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          حفظ الصورة
        </button>
      </div>
    </div>`;

  document.body.appendChild(overlay);

  // ── رسم الموجات ──
  const waveCanvas = document.getElementById('ribhi-wave-canvas');
  const randomPhase = Math.random() * Math.PI * 6;
  let animId, phase = 0;

  function animLoop() {
    phase += 0.008;
    drawWavesOnCanvas(waveCanvas, isProfit, randomPhase + phase);
    animId = requestAnimationFrame(animLoop);
  }
  animLoop();

  // ── أحداث الأزرار ──
  document.getElementById('ribhi-close-btn').onclick = () => {
    cancelAnimationFrame(animId);
    overlay.remove();
  };

  document.getElementById('ribhi-dl-btn').onclick = async function() {
    const btn = this;
    btn.disabled = true;
    btn.textContent = 'جاري الحفظ...';
    cancelAnimationFrame(animId);

    // ارسم نسخة عالية الدقة (1080×1620)
    const hiCanvas = document.createElement('canvas');
    hiCanvas.width = 1080; hiCanvas.height = 1620;
    drawWavesOnCanvas(hiCanvas, isProfit, randomPhase + phase);

    const hc = hiCanvas.getContext('2d');
    const scX = 1080 / 320, scY = 1620 / 480;

    hc.textAlign  = 'center';
    hc.textBaseline = 'middle';

    // شعار
    hc.font       = `700 ${Math.round(72 * scX)}px 'IBM Plex Sans Arabic', sans-serif`;
    hc.fillStyle  = '#ffffff';
    hc.fillText('رِبحي', 540, 150 * scY);

    // نسبة الربح/الخسارة
    hc.font       = `700 ${Math.round(220 * scX / 3.4)}px 'IBM Plex Sans Arabic', sans-serif`;
    hc.fillStyle  = isProfit ? '#c8a96e' : '#d4574a';
    hc.fillText(pctText, 540, 500 * scY / 2.0);

    // الرمز
    hc.font       = `600 ${Math.round(86 * scX / 3.4)}px 'IBM Plex Sans Arabic', sans-serif`;
    hc.fillStyle  = '#ffffff';
    hc.fillText(symsText, 540, 820 * scY / 1.72);

    // المبلغ
    hc.font       = `400 ${Math.round(50 * scX / 3.4)}px 'IBM Plex Sans Arabic', sans-serif`;
    hc.fillStyle  = 'rgba(255,255,255,0.5)';
    hc.fillText(amtText, 540, 890 * scY / 1.72);

    // التاريخ
    hc.font       = `300 ${Math.round(40 * scX / 3.4)}px 'IBM Plex Sans Arabic', sans-serif`;
    hc.fillStyle  = 'rgba(255,255,255,0.3)';
    hc.fillText(dateText, 540, 950 * scY / 1.72);

    // تحميل
    const link = document.createElement('a');
    link.download = `ribhi-${symsText.replace(/[^a-zA-Z0-9]/g, '_')}-${dateText.replace(/\//g, '-')}.png`;
    link.href = hiCanvas.toDataURL('image/png', 1.0);
    link.click();

    // استأنف الأنيميشن
    animLoop();
    btn.disabled = false;
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> تم الحفظ ✓`;
    btn.style.background = '#6db88a';
    setTimeout(() => {
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> حفظ الصورة`;
      btn.style.background = '#c8a96e';
    }, 2500);
  };
};
