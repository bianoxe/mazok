function makeMarmaladeTex() {
  const size = BOSS_TEX, cx = BOSS_TEX_R;
  const [c, g] = makeCanvas(size, size);
  const img = bossImages.marmalade;
  if (img) {
    /* Пузырчатый силуэт — края из альфы, без обрезки кругом (как помидор). */
    paintBossPhotoSprite(g, img, size);
    return c;
  }
  g.translate(cx, cx);
  g.beginPath();
  g.arc(0, 0, BOSS_TEX_R - 1, 0, TWO_PI);
  g.clip();
  const jelly = g.createRadialGradient(-20, -30, 10, 0, 0, cx);
  jelly.addColorStop(0, "#ffd0e4");
  jelly.addColorStop(0.22, "#ff86b4");
  jelly.addColorStop(0.55, "#ff5a96");
  jelly.addColorStop(1, "#d03070");
  g.fillStyle = jelly;
  g.fillRect(-cx, -cx, size, size);
  g.strokeStyle = "rgba(255, 255, 255, 0.28)";
  g.lineWidth = 5;
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i / 10) * TWO_PI;
    g.beginPath();
    g.moveTo(Math.cos(a) * 28, Math.sin(a) * 28);
    g.lineTo(Math.cos(a) * (cx - 48), Math.sin(a) * (cx - 48));
    g.stroke();
  }
  g.fillStyle = "rgba(255,255,255,0.22)";
  g.beginPath();
  g.arc(0, 0, 34, 0, TWO_PI);
  g.fill();
  g.globalAlpha = 1;
  const rind = g.createRadialGradient(0, 0, BOSS_TEX_R - 43, 0, 0, BOSS_TEX_R - 1);
  rind.addColorStop(0, "rgba(255,255,255,0)");
  rind.addColorStop(0.55, "rgba(255,244,248,0.15)");
  rind.addColorStop(0.78, "#fff6f8");
  rind.addColorStop(1, "#f0d0dc");
  g.fillStyle = rind;
  g.beginPath();
  g.arc(0, 0, BOSS_TEX_R - 1, 0, TWO_PI);
  g.fill();
  g.fillStyle = "#fff";
  for (let i = 0; i < 90; i++) {
    const a = hash(11, i) * TWO_PI;
    const d = BOSS_TEX_R - 27 + hash(12, i) * 22;
    const rr = 1.4 + hash(13, i) * 3.2;
    g.globalAlpha = 0.45 + hash(14, i) * 0.5;
    g.beginPath();
    g.arc(Math.cos(a) * d, Math.sin(a) * d, rr, 0, TWO_PI);
    g.fill();
  }
  g.globalAlpha = 1;
  g.fillStyle = "rgba(255,255,255,0.35)";
  g.beginPath();
  g.ellipse(-64, -72, 48, 20, -0.55, 0, TWO_PI);
  g.fill();
  return c;
}

