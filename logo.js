function updateLogos() {
  const isLight = document.body.classList.contains('light');
  const b64 = isLight ? _LOGO_LIGHT_B64 : _LOGO_DARK_B64;
  const src = `data:image/jpeg;base64,${b64}`;
  document.querySelectorAll('img[alt="رِبحي"]').forEach(img => {
    img.src = src;
  });
}
