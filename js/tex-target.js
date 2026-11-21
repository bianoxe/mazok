function makeTargetTex() {
  const size = BOSS_TEX, cx = size * 0.5;
  const R = BOSS_TEX_R - 1;
  const [c, g] = makeCanvas(size, size);
  const img = bossImages.target;
  if (img) {
    /* Фото мишени: края и чёрные кольца — из альфы файла, без кругового
       клипа (картинка вырезана неровно, клип срезал бы кольцо). Размер
       общий для всех фото-боссов — paintBossPhotoSprite. */
    paintBossPhotoSprite(g, img, size);
    return c;
  }
  g.translate(cx, cx);
  const wood = g.createRadialGradient(-R * 0.2, -R * 0.24, R * 0.08, 0, 0, R);
  wood.addColorStop(0, "#e0b56a");
  wood.addColorStop(0.45, "#c48a42");
  wood.addColorStop(0.78, "#8a5a2c");
  wood.addColorStop(1, "#4a2c14");
  g.fillStyle = wood;
  g.beginPath();
  g.arc(0, 0, R, 0, TWO_PI);
  g.fill();
  g.strokeStyle = "rgba(74, 42, 18, 0.35)";
  g.lineWidth = Math.max(2, R * 0.012);
  for (let i = 0; i < 18; i++) {
    const a0 = hash(30, i) * TWO_PI;
    const rad = R * (0.88 + hash(31, i) * 0.1);
    g.beginPath();
    g.arc(0, 0, rad, a0, a0 + 0.4 + hash(32, i) * 0.7);
    g.stroke();
  }
  const paintRing = (inner, outer, c0, c1) => {
    const grd = g.createRadialGradient(0, 0, Math.max(1, inner), 0, 0, outer);
    grd.addColorStop(0, c0);
    grd.addColorStop(1, c1);
    g.fillStyle = grd;
    g.beginPath();
    g.arc(0, 0, outer, 0, TWO_PI);
    if (inner > 1) g.arc(0, 0, inner, 0, TWO_PI, true);
    g.fill(inner > 1 ? "evenodd" : "nonzero");
  };
  paintRing(R * 0.64, R * 0.9, "#2a2a2a", "#0c0c0c");
  paintRing(R * 0.4, R * 0.64, "#fffdf8", "#d8d2c6");
  paintRing(R * 0.18, R * 0.4, "#ff4a3c", "#a01814");
  const gold = g.createRadialGradient(-R * 0.04, -R * 0.05, R * 0.02, 0, 0, R * 0.18);
  gold.addColorStop(0, "#fff6b0");
  gold.addColorStop(0.55, "#f0c430");
  gold.addColorStop(1, "#c48a10");
  g.fillStyle = gold;
  g.beginPath();
  g.arc(0, 0, R * 0.18, 0, TWO_PI);
  g.fill();
  g.fillStyle = "#fff3c4";
  g.beginPath();
  g.arc(-R * 0.03, -R * 0.03, R * 0.045, 0, TWO_PI);
  g.fill();
  g.lineCap = "butt";
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    g.strokeStyle = "rgba(20, 12, 8, 0.72)";
    g.lineWidth = Math.max(2.2, R * 0.009);
    g.beginPath();
    g.moveTo(Math.cos(a) * R * 0.05, Math.sin(a) * R * 0.05);
    g.lineTo(Math.cos(a) * R * 0.9, Math.sin(a) * R * 0.9);
    g.stroke();
    g.strokeStyle = "rgba(255, 248, 230, 0.7)";
    g.lineWidth = Math.max(1.1, R * 0.004);
    const b = a + 0.012;
    g.beginPath();
    g.moveTo(Math.cos(b) * R * 0.05, Math.sin(b) * R * 0.05);
    g.lineTo(Math.cos(b) * R * 0.9, Math.sin(b) * R * 0.9);
    g.stroke();
  }
  g.fillStyle = "#3a2414";
  for (let i = 0; i < 8; i++) {
    const a = (i + 0.5) * Math.PI / 4;
    g.beginPath();
    g.arc(Math.cos(a) * R * 0.95, Math.sin(a) * R * 0.95, R * 0.018, 0, TWO_PI);
    g.fill();
  }
  g.strokeStyle = "rgba(42, 24, 12, 0.85)";
  g.lineWidth = Math.max(6, R * 0.028);
  g.beginPath();
  g.arc(0, 0, R - g.lineWidth * 0.4, 0, TWO_PI);
  g.stroke();
  return c;
}

function drawTargetArrow(g, r) {
  const w = r * 0.026;
  g.fillStyle = "#6b4a28";
  g.strokeStyle = "#2a180c";
  g.lineWidth = Math.max(1, r * 0.008);
  g.beginPath();
  if (g.roundRect) g.roundRect(-w, -r * 0.62, w * 2, r * 0.9, w);
  else g.rect(-w, -r * 0.62, w * 2, r * 0.9);
  g.fill();
  g.stroke();
  g.strokeStyle = "#3a2414";
  g.lineWidth = Math.max(1.2, r * 0.01);
  g.beginPath();
  g.moveTo(-w * 0.3, r * 0.22);
  g.lineTo(w * 1.5, r * 0.34);
  g.moveTo(w * 0.2, r * 0.2);
  g.lineTo(-w * 1.2, r * 0.36);
  g.stroke();
  const feather = (x, y0, y1, col) => {
    g.fillStyle = col;
    g.beginPath();
    g.moveTo(0, y0);
    g.quadraticCurveTo(x, (y0 + y1) * 0.5, x * 0.72, y1);
    g.quadraticCurveTo(x * 0.28, y1 - r * 0.02, 0, y1 - r * 0.03);
    g.closePath();
    g.fill();
  };
  feather(-r * 0.16, r * 0.06, r * 0.46, "#8e3030");
  feather(r * 0.15, r * 0.08, r * 0.44, "#f3efe4");
  feather(-r * 0.06, r * 0.14, r * 0.28, "#6a2424");
  g.strokeStyle = "#2a180c";
  g.lineWidth = Math.max(1.5, r * 0.012);
  g.beginPath();
  g.moveTo(-w * 1.4, r * 0.5);
  g.lineTo(0, r * 0.42);
  g.lineTo(w * 1.4, r * 0.51);
  g.stroke();
}

function drawTargetMark(r, a0, span) {
  /* Стрелка на мишени убрана: это была та самая «пимпочка» со смертельным
     хитбоксом. Без неё на мишени нет ни рисунка стрелы, ни смертельной зоны. */
  return;
}

