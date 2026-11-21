function makeEggTex() {
  /* фото: яйцо — силуэтом (оно не круглое, диск срезал бы бока) */
  const photo = bossPhotoTex("egg");
  if (photo) return photo;
  const size = 512, cx = 256;
  const [c, g] = makeCanvas(size, size);
  g.translate(cx, cx);
  pathEgg(g, BOSS_TEX_R - 1);
  g.clip();
  const shell = g.createRadialGradient(-36, -78, 16, 10, 36, cx);
  shell.addColorStop(0, "#fffaf3");
  shell.addColorStop(0.3, "#f4ead8");
  shell.addColorStop(0.66, "#e4d0b0");
  shell.addColorStop(1, "#c2a784");
  g.fillStyle = shell;
  g.fillRect(-cx, -cx, size, size);
  for (let i = 0; i < 80; i++) {
    const a = hash(30, i) * TWO_PI;
    const d = 16 + hash(31, i) * 200;
    g.fillStyle = hash(35, i) > 0.45 ? "rgba(140, 108, 70, 0.34)" : "rgba(255, 248, 236, 0.45)";
    g.globalAlpha = 0.25 + hash(32, i) * 0.55;
    g.beginPath();
    g.ellipse(Math.cos(a) * d * 0.7, Math.sin(a) * d, 1.1 + hash(33, i) * 2.2, 0.7 + hash(34, i) * 1.2, a, 0, TWO_PI);
    g.fill();
  }
  g.globalAlpha = 1;
  g.fillStyle = "rgba(255,255,255,0.62)";
  g.beginPath();
  g.ellipse(-42, -86, 40, 16, -0.65, 0, TWO_PI);
  g.fill();
  g.fillStyle = "rgba(255,255,255,0.16)";
  g.beginPath();
  g.ellipse(28, 18, 20, 9, 0.45, 0, TWO_PI);
  g.fill();
  return c;
}

