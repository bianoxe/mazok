/* КОМПАС — циферблат, рубленый кант и стрелка на север. Крутится вместе с боссом. */
function makeCompassTex() {
  const size = BOSS_TEX;
  const R = BOSS_TEX_R;
  const [c, g] = makeCanvas(size, size);
  const img = bossImages.compass;
  if (img) {
    /* без клипа диском: у компаса сверху ушко, оно не должно обрезаться */
    paintBossPhotoSprite(g, img, size);
    return c;
  }
  g.translate(R, R);
  g.lineJoin = "round";
  g.lineCap = "round";
  g.beginPath();
  g.arc(0, 0, R - 0.5, 0, TWO_PI);
  g.clip();

  const rim = g.createLinearGradient(-R * 0.4, -R, R * 0.5, R);
  rim.addColorStop(0, "#f3e6c4");
  rim.addColorStop(0.35, "#c4a46a");
  rim.addColorStop(0.72, "#8a6840");
  rim.addColorStop(1, "#4a3420");
  g.fillStyle = rim;
  g.fillRect(-R, -R, size, size);

  g.beginPath();
  g.arc(0, 0, R * 0.86, 0, TWO_PI);
  const face = g.createRadialGradient(-R * 0.2, -R * 0.28, R * 0.1, 0, 0, R * 0.9);
  face.addColorStop(0, "#fffaf0");
  face.addColorStop(0.55, "#f4ead4");
  face.addColorStop(1, "#e4d3b0");
  g.fillStyle = face;
  g.fill();

  g.strokeStyle = "rgba(90, 62, 36, 0.35)";
  g.lineWidth = Math.max(1, R * 0.012);
  g.beginPath();
  g.arc(0, 0, R * 0.72, 0, TWO_PI);
  g.stroke();

  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * TWO_PI - Math.PI / 2;
    const card = i % 9 === 0;
    const mid = i % 3 === 0;
    const inner = R * (card ? 0.58 : mid ? 0.66 : 0.7);
    g.strokeStyle = card ? "#1c1a17" : "rgba(42, 36, 28, 0.72)";
    g.lineWidth = Math.max(1, R * (card ? 0.028 : mid ? 0.016 : 0.008));
    g.beginPath();
    g.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
    g.lineTo(Math.cos(a) * R * 0.8, Math.sin(a) * R * 0.8);
    g.stroke();
  }

  g.fillStyle = "#1c1a17";
  g.font = "700 " + (R * 0.16 | 0) + "px sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("N", 0, -R * 0.46);

  g.beginPath();
  g.moveTo(0, -R * 0.62);
  g.lineTo(R * 0.055, R * 0.08);
  g.lineTo(0, R * 0.02);
  g.closePath();
  g.fillStyle = "#e23b2f";
  g.fill();
  g.beginPath();
  g.moveTo(0, R * 0.5);
  g.lineTo(-R * 0.05, R * 0.02);
  g.lineTo(0, R * 0.08);
  g.closePath();
  g.fillStyle = "#f7f4ee";
  g.fill();
  g.strokeStyle = "#1c1a17";
  g.lineWidth = Math.max(1, R * 0.012);
  g.stroke();

  g.beginPath();
  g.arc(0, 0, R * 0.06, 0, TWO_PI);
  g.fillStyle = "#c4a46a";
  g.fill();
  g.strokeStyle = "#3a2c1c";
  g.stroke();

  return c;
}
