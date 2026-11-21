function paintDonutStick(g, a, d, len, th, rot, col) {
  g.save();
  g.translate(Math.cos(a) * d, Math.sin(a) * d);
  g.rotate(rot);
  g.fillStyle = col;
  g.beginPath();
  if (g.roundRect) g.roundRect(-len * 0.5, -th * 0.5, len, th, th * 0.45);
  else g.rect(-len * 0.5, -th * 0.5, len, th);
  g.fill();
  g.restore();
}

function makeDonutTex() {
  const size = BOSS_TEX, cx = size * 0.5;
  const R = BOSS_TEX_R - 1;
  const hole = R * DONUT_HOLE;
  const gOut = R * 0.9;
  const gIn = hole * 1.42;
  const [c, g] = makeCanvas(size, size);
  const img = bossImages.donut;
  if (img) {
    g.save();
    g.beginPath();
    g.arc(cx, cx, R, 0, TWO_PI);
    g.arc(cx, cx, hole, 0, TWO_PI, true);
    g.clip("evenodd");
    paintBossPhotoCover(g, img, size);
    g.restore();
    return c;
  }
  g.translate(cx, cx);
  g.beginPath();
  g.arc(0, 0, R, 0, TWO_PI);
  g.arc(0, 0, hole, 0, TWO_PI, true);
  const dough = g.createRadialGradient(-R * 0.12, -R * 0.2, hole * 0.3, 0, 0, R);
  dough.addColorStop(0, "#ffe6b0");
  dough.addColorStop(0.34, "#E4A853");
  dough.addColorStop(0.7, "#d4893a");
  dough.addColorStop(1, "#a85a22");
  g.fillStyle = dough;
  g.fill("evenodd");
  g.save();
  g.beginPath();
  g.arc(0, 0, R * 0.98, 0, TWO_PI);
  g.arc(0, 0, hole * 1.05, 0, TWO_PI, true);
  g.clip("evenodd");
  g.fillStyle = "rgba(255, 214, 140, 0.35)";
  for (let i = 0; i < 26; i++) {
    const a = hash(11, i) * TWO_PI;
    const d = hole * 1.25 + hash(12, i) * (R * 0.82 - hole);
    g.beginPath();
    g.ellipse(Math.cos(a) * d, Math.sin(a) * d, R * (0.04 + hash(13, i) * 0.05), R * (0.02 + hash(14, i) * 0.02), a, 0, TWO_PI);
    g.fill();
  }
  g.restore();
  g.strokeStyle = "rgba(110, 52, 16, 0.7)";
  g.lineWidth = Math.max(7, R * 0.04);
  g.beginPath();
  g.arc(0, 0, R - g.lineWidth * 0.45, 0, TWO_PI);
  g.stroke();
  g.beginPath();
  g.arc(0, 0, hole + g.lineWidth * 0.4, 0, TWO_PI);
  g.stroke();
  g.save();
  g.beginPath();
  g.arc(0, 0, R * 0.99, 0, TWO_PI);
  g.arc(0, 0, hole * 1.02, 0, TWO_PI, true);
  g.clip("evenodd");
  const glaze = g.createRadialGradient(-R * 0.22, -R * 0.3, R * 0.04, 0, 0, R);
  glaze.addColorStop(0, "#ffd4ea");
  glaze.addColorStop(0.22, "#FF69B4");
  glaze.addColorStop(0.62, "#ff3d8e");
  glaze.addColorStop(1, "#d41468");
  g.fillStyle = glaze;
  g.beginPath();
  const steps = 80;
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * TWO_PI;
    const wob = Math.sin(a * 5) * R * 0.04 + Math.sin(a * 9 + 0.6) * R * 0.02;
    const x = Math.cos(a) * (gOut + wob);
    const y = Math.sin(a) * (gOut + wob);
    if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
  }
  g.closePath();
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * TWO_PI;
    const wob = Math.sin(a * 6 + 1.1) * R * 0.032 + Math.sin(a * 11) * R * 0.016;
    const x = Math.cos(a) * (gIn + wob);
    const y = Math.sin(a) * (gIn + wob);
    if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
  }
  g.closePath();
  g.fill("evenodd");
  g.fillStyle = "#FF69B4";
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * TWO_PI + hash(70, i) * 0.08;
    const rad = gOut + (hash(71, i) - 0.4) * R * 0.07;
    g.beginPath();
    g.arc(Math.cos(a) * rad, Math.sin(a) * rad, R * (0.03 + hash(72, i) * 0.028), 0, TWO_PI);
    g.fill();
  }
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * TWO_PI + 0.2;
    const rad = gIn - hash(73, i) * R * 0.04;
    g.beginPath();
    g.arc(Math.cos(a) * rad, Math.sin(a) * rad, R * (0.024 + hash(74, i) * 0.02), 0, TWO_PI);
    g.fill();
  }
  const band0 = gIn + R * 0.04;
  const band1 = gOut - R * 0.04;
  for (let i = 0; i < 72; i++) {
    const a = hash(80, i) * TWO_PI;
    const d = band0 + hash(81, i) * Math.max(8, band1 - band0);
    const len = 11 + hash(82, i) * 16;
    const th = 3.4 + hash(83, i) * 2.6;
    paintDonutStick(g, a, d, len, th, a + (hash(84, i) - 0.5) * 1.7, DONUT_SPRINKLES[i % DONUT_SPRINKLES.length]);
  }
  g.strokeStyle = "rgba(255,255,255,0.4)";
  g.lineWidth = Math.max(7, R * 0.055);
  g.lineCap = "round";
  g.beginPath();
  g.arc(-R * 0.02, -R * 0.06, R * 0.58, Math.PI * 1.18, Math.PI * 1.82);
  g.stroke();
  g.strokeStyle = "rgba(255,255,255,0.22)";
  g.lineWidth = Math.max(3, R * 0.02);
  g.beginPath();
  g.arc(R * 0.04, R * 0.1, R * 0.5, Math.PI * 0.15, Math.PI * 0.55);
  g.stroke();
  g.fillStyle = "rgba(255,255,255,0.75)";
  for (let i = 0; i < 28; i++) {
    const a = hash(90, i) * TWO_PI;
    const d = band0 + hash(91, i) * Math.max(6, band1 - band0);
    g.beginPath();
    g.arc(Math.cos(a) * d, Math.sin(a) * d, 1.1 + hash(92, i) * 1.5, 0, TWO_PI);
    g.fill();
  }
  g.restore();
  const paintDrip = (a, from, to, thick, col) => {
    const dir = to >= from ? 1 : -1;
    const len = Math.abs(to - from);
    g.save();
    g.rotate(a);
    g.fillStyle = col;
    g.beginPath();
    g.moveTo(from, -thick * 0.35);
    g.quadraticCurveTo(from + dir * len * 0.45, -thick * 1.15, to, 0);
    g.quadraticCurveTo(from + dir * len * 0.45, thick * 1.15, from, thick * 0.35);
    g.closePath();
    g.fill();
    g.beginPath();
    g.arc(to, 0, thick * 0.72, 0, TWO_PI);
    g.fill();
    g.restore();
  };
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * TWO_PI + (hash(60, i) - 0.5) * 0.2;
    const len = R * (0.055 + hash(62, i) * 0.05);
    const thick = R * (0.028 + hash(63, i) * 0.016);
    paintDrip(a, gOut - len * 0.2, Math.min(R * 0.97, gOut + len), thick, i % 2 ? "#ff5c9e" : "#FF69B4");
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TWO_PI + 0.3 + (hash(64, i) - 0.5) * 0.18;
    const len = R * (0.04 + hash(65, i) * 0.03);
    const thick = R * (0.022 + hash(66, i) * 0.012);
    paintDrip(a, gIn + len * 0.15, Math.max(hole * 1.2, gIn - len), thick, "#ff3f8e");
  }
  g.globalCompositeOperation = "destination-out";
  g.beginPath();
  g.arc(0, 0, hole, 0, TWO_PI);
  g.fill();
  g.globalCompositeOperation = "source-over";
  return c;
}

