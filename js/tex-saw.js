function makeSawTex() {
  const size = BOSS_TEX, cx = BOSS_TEX_R;
  const [c, g] = makeCanvas(size, size);
  const img = bossImages.saw;
  if (img) {
    /* Зубья пилы — края из альфы, без обрезки кругом. */
    paintBossPhotoSprite(g, img, size);
    return c;
  }
  g.translate(cx, cx);
  pathSaw(g, BOSS_TEX_R - 1);
  g.clip();
  const steel = g.createRadialGradient(-30, -40, 12, 0, 0, cx);
  steel.addColorStop(0, "#f4f7fa");
  steel.addColorStop(0.28, "#d5dbe3");
  steel.addColorStop(0.62, "#9aa3ae");
  steel.addColorStop(1, "#5c6672");
  g.fillStyle = steel;
  g.fillRect(-cx, -cx, size, size);
  g.strokeStyle = "rgba(255,255,255,0.28)";
  g.lineWidth = 3;
  for (let i = 0; i < SAW_TEETH; i++) {
    const a = (i + 0.5) * (TWO_PI / SAW_TEETH);
    g.beginPath();
    g.moveTo(Math.cos(a) * cx * 0.34, Math.sin(a) * cx * 0.34);
    g.lineTo(Math.cos(a) * cx * 0.9, Math.sin(a) * cx * 0.9);
    g.stroke();
  }
  g.strokeStyle = "rgba(40, 46, 54, 0.45)";
  g.lineWidth = 10;
  g.beginPath();
  g.arc(0, 0, cx * 0.72, 0, TWO_PI);
  g.stroke();
  g.lineWidth = 5;
  g.beginPath();
  g.arc(0, 0, cx * 0.46, 0, TWO_PI);
  g.stroke();
  g.fillStyle = "#1c2128";
  g.beginPath();
  g.arc(0, 0, cx * 0.16, 0, TWO_PI);
  g.fill();
  g.strokeStyle = "#3a424c";
  g.lineWidth = 8;
  g.stroke();
  g.fillStyle = "rgba(255,255,255,0.35)";
  g.beginPath();
  g.ellipse(-70, -78, 46, 18, -0.55, 0, TWO_PI);
  g.fill();
  return c;
}

