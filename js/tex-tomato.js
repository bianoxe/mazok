/* Текстура помидора: images/boss/tomato.webp как есть — края и альфа из файла,
   без обрезки кругом. Нет файла — процедурная заливка. */
function makeTomatoTex() {
  const size = BOSS_TEX;
  const [c, g] = makeCanvas(size, size);
  const img = bossImages.tomato;
  if (img) {
    paintBossPhotoSprite(g, img, size);
    return c;
  }
  const cx = BOSS_TEX_R;
  g.translate(cx, cx);
  g.beginPath();
  g.arc(0, 0, BOSS_TEX_R - 1, 0, TWO_PI);
  g.clip();
  const skin = g.createRadialGradient(-50, -70, 20, 12, 18, cx);
  skin.addColorStop(0, "#f07058");
  skin.addColorStop(0.28, "#e04a36");
  skin.addColorStop(0.62, "#c43228");
  skin.addColorStop(1, "#8a1c16");
  g.fillStyle = skin;
  g.fillRect(-cx, -cx, size, size);
  g.globalAlpha = 0.18;
  for (let i = 0; i < 18; i++) {
    const a = hash(3, i) * TWO_PI;
    const d = 40 + hash(4, i) * 160;
    g.fillStyle = hash(5, i) > 0.5 ? "#8a2018" : "#f09070";
    g.beginPath();
    g.ellipse(Math.cos(a) * d, Math.sin(a) * d, 18 + hash(6, i) * 30, 10 + hash(7, i) * 16, a, 0, TWO_PI);
    g.fill();
  }
  g.globalAlpha = 1;
  g.fillStyle = "rgba(255, 228, 200, 0.42)";
  for (let i = 0; i < 46; i++) {
    const a = hash(20, i) * TWO_PI;
    const d = 28 + hash(21, i) * 188;
    g.beginPath();
    g.ellipse(Math.cos(a) * d, Math.sin(a) * d, 1.1 + hash(22, i) * 1.5, 0.65, a + 0.4, 0, TWO_PI);
    g.fill();
  }
  g.fillStyle = "rgba(255,255,255,0.28)";
  g.beginPath();
  g.ellipse(-70, -80, 46, 22, -0.6, 0, TWO_PI);
  g.fill();
  g.fillStyle = "rgba(255,255,255,0.14)";
  g.beginPath();
  g.ellipse(80, 40, 28, 14, 0.4, 0, TWO_PI);
  g.fill();
  return c;
}
