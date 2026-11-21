function makeDummyTex() {
  /* фото: чучело в шляпе — силуэтом (шляпа и солома по краю остаются) */
  const photo = bossPhotoTex("dummy");
  if (photo) return photo;
  const size = BOSS_TEX, cx = size * 0.5;
  const R = BOSS_TEX_R - 1;
  const [c, g] = makeCanvas(size, size);
  g.translate(cx, cx);
  g.beginPath();
  g.arc(0, 0, R, 0, TWO_PI);
  g.clip();
  const sack = g.createRadialGradient(-R * 0.16, R * 0.02, R * 0.08, 0, R * 0.08, R);
  sack.addColorStop(0, "#f3ddb0");
  sack.addColorStop(0.32, "#e0c088");
  sack.addColorStop(0.68, "#c49658");
  sack.addColorStop(1, "#6a4528");
  g.fillStyle = sack;
  g.fillRect(-R, -R, R * 2, R * 2);
  g.save();
  g.globalAlpha = 0.16;
  g.strokeStyle = "#7a5230";
  g.lineWidth = 2;
  for (let i = -18; i <= 18; i++) {
    g.beginPath();
    g.moveTo(-R, i * 14);
    g.lineTo(R, i * 14 + 36);
    g.stroke();
    g.beginPath();
    g.moveTo(-R, i * 14 + 8);
    g.lineTo(R, i * 14 - 28);
    g.stroke();
  }
  g.restore();
  g.fillStyle = "rgba(92, 58, 28, 0.18)";
  g.beginPath();
  g.ellipse(R * 0.22, R * 0.18, R * 0.28, R * 0.2, 0.4, 0, TWO_PI);
  g.fill();
  g.strokeStyle = "#5a3a22";
  g.lineWidth = 3.2;
  g.setLineDash([8, 7]);
  g.beginPath();
  g.moveTo(0, -R * 0.42);
  g.lineTo(0, R * 0.62);
  g.moveTo(-R * 0.46, R * 0.16);
  g.lineTo(R * 0.5, R * 0.16);
  g.stroke();
  g.setLineDash([]);
  g.strokeStyle = "#3a2416";
  g.lineWidth = 2;
  for (let i = 0; i < 7; i++) {
    const y = -R * 0.28 + i * R * 0.13;
    g.beginPath();
    g.moveTo(-6, y);
    g.lineTo(6, y + 7);
    g.moveTo(6, y);
    g.lineTo(-6, y + 7);
    g.stroke();
  }
  const eye = (x, y) => {
    g.fillStyle = "#2a1c12";
    g.beginPath();
    g.arc(x, y, R * 0.075, 0, TWO_PI);
    g.fill();
    g.strokeStyle = "#6b4a2c";
    g.lineWidth = 3;
    g.beginPath();
    g.arc(x, y, R * 0.09, 0, TWO_PI);
    g.stroke();
    g.fillStyle = "rgba(255,255,255,0.7)";
    g.beginPath();
    g.arc(x - R * 0.02, y - R * 0.022, R * 0.02, 0, TWO_PI);
    g.fill();
  };
  eye(-R * 0.2, -R * 0.22);
  eye(R * 0.2, -R * 0.22);
  g.strokeStyle = "#4a301c";
  g.lineWidth = 3.4;
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(-R * 0.22, R * 0.02);
  g.quadraticCurveTo(0, R * 0.16, R * 0.22, R * 0.02);
  g.stroke();
  g.setLineDash([5, 5]);
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(-R * 0.16, R * 0.08);
  g.quadraticCurveTo(0, R * 0.18, R * 0.16, R * 0.08);
  g.stroke();
  g.setLineDash([]);
  g.strokeStyle = "#5c3c24";
  g.lineWidth = R * 0.045;
  g.beginPath();
  g.arc(0, R * 0.42, R * 0.55, 0.35, Math.PI - 0.35);
  g.stroke();
  g.strokeStyle = "#e8d2a4";
  g.lineWidth = R * 0.012;
  g.beginPath();
  g.arc(0, R * 0.42, R * 0.55, 0.55, Math.PI - 0.55);
  g.stroke();
  g.strokeStyle = "#8a6238";
  g.lineWidth = 2.2;
  for (let i = 0; i < 16; i++) {
    const a = Math.PI * 0.15 + (i / 15) * Math.PI * 0.7;
    const inner = R * (0.9 + hash(40, i) * 0.04);
    const outer = R * (0.99);
    g.beginPath();
    g.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
    g.lineTo(Math.cos(a + (hash(41, i) - 0.5) * 0.12) * outer, Math.sin(a) * outer);
    g.stroke();
  }
  g.fillStyle = "rgba(255, 244, 220, 0.28)";
  g.beginPath();
  g.ellipse(-R * 0.28, -R * 0.08, R * 0.16, R * 0.07, -0.5, 0, TWO_PI);
  g.fill();
  return c;
}

