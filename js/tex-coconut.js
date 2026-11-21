function makeCoconutTex() {
  /* фото: кокос —силуэтом (волокна по краю не срезаем) */
  const photo = bossPhotoTex("coconut");
  if (photo) return photo;
  const size = BOSS_TEX, cx = size * 0.5;
  const [c, g] = makeCanvas(size, size);
  g.translate(cx, cx);
  g.beginPath();
  g.arc(0, 0, BOSS_TEX_R - 1, 0, TWO_PI);
  g.clip();
  const husk = g.createRadialGradient(-46, -58, 18, 12, 18, cx);
  husk.addColorStop(0, "#d7b07a");
  husk.addColorStop(0.28, "#a56b3c");
  husk.addColorStop(0.62, "#6d4324");
  husk.addColorStop(1, "#2c180e");
  g.fillStyle = husk;
  g.fillRect(-cx, -cx, size, size);
  g.strokeStyle = "rgba(42, 22, 12, 0.45)";
  g.lineWidth = 2.4;
  g.lineCap = "round";
  for (let i = 0; i < 160; i++) {
    const a = hash(i, 3.1) * TWO_PI;
    const rad = 18 + hash(i, 7.4) * (cx * 0.92);
    const len = 8 + hash(i, 9.2) * 26;
    const x = Math.cos(a) * rad;
    const y = Math.sin(a) * rad * 0.94;
    g.globalAlpha = 0.28 + hash(i, 4.4) * 0.55;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + Math.cos(a + 0.4) * len, y + Math.sin(a + 0.4) * len);
    g.stroke();
  }
  g.globalAlpha = 1;
  g.strokeStyle = "rgba(232, 196, 140, 0.28)";
  g.lineWidth = 1.4;
  for (let i = 0; i < 46; i++) {
    const a = hash(i, 12.2) * TWO_PI;
    const rad = 30 + hash(i, 15) * (cx * 0.7);
    g.beginPath();
    g.moveTo(Math.cos(a) * rad, Math.sin(a) * rad * 0.94);
    g.lineTo(Math.cos(a) * (rad + 14), Math.sin(a) * (rad + 14) * 0.94);
    g.stroke();
  }
  const eyes = [
    { x: -46, y: -8, rx: 24, ry: 17 },
    { x: 6, y: -52, rx: 20, ry: 15 },
    { x: 22, y: 14, rx: 17, ry: 13 }
  ];
  for (let i = 0; i < eyes.length; i++) {
    const e = eyes[i];
    g.fillStyle = "#1a0e08";
    g.beginPath();
    g.ellipse(e.x, e.y, e.rx, e.ry, -0.3 + i * 0.35, 0, TWO_PI);
    g.fill();
    g.fillStyle = "#3a2416";
    g.beginPath();
    g.ellipse(e.x, e.y, e.rx * 0.62, e.ry * 0.55, -0.2, 0, TWO_PI);
    g.fill();
    g.fillStyle = "rgba(243, 230, 200, 0.55)";
    g.beginPath();
    g.ellipse(e.x - e.rx * 0.22, e.y - e.ry * 0.28, e.rx * 0.18, e.ry * 0.14, -0.5, 0, TWO_PI);
    g.fill();
  }
  g.fillStyle = "rgba(255, 220, 160, 0.16)";
  g.beginPath();
  g.ellipse(-70, -88, 54, 26, -0.6, 0, TWO_PI);
  g.fill();
  return c;
}

