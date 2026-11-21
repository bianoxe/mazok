function drawPepperoni(g, x, y, rad) {
  g.save();
  g.translate(x, y);
  g.fillStyle = "rgba(70, 16, 8, 0.28)";
  g.beginPath();
  g.ellipse(rad * 0.12, rad * 0.22, rad * 0.92, rad * 0.78, 0.2, 0, TWO_PI);
  g.fill();
  const disk = g.createRadialGradient(-rad * 0.3, -rad * 0.35, rad * 0.08, 0, 0, rad);
  disk.addColorStop(0, "#e85a42");
  disk.addColorStop(0.45, "#c43222");
  disk.addColorStop(1, "#7a1c12");
  g.fillStyle = disk;
  g.beginPath();
  g.arc(0, 0, rad, 0, TWO_PI);
  g.fill();
  g.fillStyle = "rgba(255, 196, 150, 0.4)";
  g.beginPath();
  g.arc(rad * 0.16, rad * 0.08, rad * 0.22, 0, TWO_PI);
  g.arc(-rad * 0.28, rad * 0.22, rad * 0.12, 0, TWO_PI);
  g.fill();
  g.fillStyle = "rgba(255,255,255,0.28)";
  g.beginPath();
  g.ellipse(-rad * 0.28, -rad * 0.32, rad * 0.22, rad * 0.12, -0.6, 0, TWO_PI);
  g.fill();
  g.strokeStyle = "rgba(70, 12, 8, 0.55)";
  g.lineWidth = Math.max(1, rad * 0.08);
  g.beginPath();
  g.arc(0, 0, rad * 0.96, 0, TWO_PI);
  g.stroke();
  g.restore();
}

function drawBasil(g, x, y, s, rot) {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.fillStyle = "#245818";
  g.beginPath();
  g.ellipse(s * 0.08, s * 0.12, s * 0.5, s * 0.95, 0.15, 0, TWO_PI);
  g.fill();
  g.fillStyle = "#3f8a2c";
  g.beginPath();
  g.ellipse(0, 0, s * 0.42, s * 0.92, -0.1, 0, TWO_PI);
  g.fill();
  g.fillStyle = "#68b044";
  g.beginPath();
  g.ellipse(-s * 0.08, -s * 0.12, s * 0.22, s * 0.55, -0.25, 0, TWO_PI);
  g.fill();
  g.strokeStyle = "rgba(16, 40, 8, 0.65)";
  g.lineWidth = Math.max(0.7, s * 0.08);
  g.beginPath();
  g.moveTo(0, s * 0.72);
  g.lineTo(0, -s * 0.7);
  g.stroke();
  g.restore();
}

function drawMushroom(g, x, y, s, rot) {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.fillStyle = "#f4ead8";
  g.beginPath();
  g.ellipse(0, s * 0.2, s * 0.28, s * 0.48, 0, 0, TWO_PI);
  g.fill();
  g.fillStyle = "#d8c2a4";
  g.strokeStyle = "rgba(90, 60, 36, 0.45)";
  g.lineWidth = Math.max(0.8, s * 0.06);
  g.beginPath();
  g.ellipse(0, -s * 0.12, s * 0.95, s * 0.58, 0, 0, TWO_PI);
  g.fill();
  g.stroke();
  g.fillStyle = "#8d6844";
  g.beginPath();
  g.ellipse(-s * 0.32, -s * 0.16, s * 0.12, s * 0.09, 0.2, 0, TWO_PI);
  g.ellipse(s * 0.28, -s * 0.02, s * 0.1, s * 0.08, -0.4, 0, TWO_PI);
  g.fill();
  g.restore();
}

function drawOliveAt(g, x, y, rx, ry, rot) {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.fillStyle = "rgba(24, 16, 8, 0.32)";
  g.beginPath();
  g.ellipse(rx * 0.12, ry * 0.55, rx * 0.95, ry * 0.8, 0.1, 0, TWO_PI);
  g.fill();
  const body = g.createRadialGradient(-rx * 0.35, -ry * 0.45, rx * 0.08, rx * 0.05, 0, Math.max(rx, ry));
  body.addColorStop(0, "#9aba58");
  body.addColorStop(0.32, "#4e7a28");
  body.addColorStop(0.72, "#2a4c16");
  body.addColorStop(1, "#14240c");
  g.fillStyle = body;
  g.beginPath();
  g.ellipse(0, 0, rx, ry, 0, 0, TWO_PI);
  g.fill();
  g.strokeStyle = "#101c08";
  g.lineWidth = Math.max(1, rx * 0.07);
  g.stroke();
  g.fillStyle = "#c43828";
  g.beginPath();
  g.ellipse(rx * 0.02, ry * 0.02, rx * 0.26, ry * 0.28, 0.5, 0, TWO_PI);
  g.fill();
  g.fillStyle = "rgba(255, 220, 190, 0.55)";
  g.beginPath();
  g.ellipse(-rx * 0.08, -ry * 0.02, rx * 0.08, ry * 0.07, 0.4, 0, TWO_PI);
  g.fill();
  g.fillStyle = "rgba(255,255,255,0.5)";
  g.beginPath();
  g.ellipse(-rx * 0.32, -ry * 0.38, rx * 0.2, ry * 0.14, -0.7, 0, TWO_PI);
  g.fill();
  g.restore();
}

function forkMetal(g, r) {
  const metal = g.createLinearGradient(-r * 0.22, 0, r * 0.22, 0);
  metal.addColorStop(0, "#3e4852");
  metal.addColorStop(0.32, "#f7f9fb");
  metal.addColorStop(0.58, "#c5ced6");
  metal.addColorStop(1, "#2a3138");
  g.fillStyle = metal;
  g.strokeStyle = "#1a2026";
  g.lineWidth = Math.max(1.25, r * 0.014);
  g.lineJoin = "round";
  g.lineCap = "round";
  return metal;
}

function drawStuckFork(g, r) {
  forkMetal(g, r);
  const xs = [-0.11, -0.037, 0.037, 0.11];
  for (let i = 0; i < xs.length; i++) {
    const x = xs[i] * r;
    g.beginPath();
    if (g.roundRect) g.roundRect(x - r * 0.016, -r * 0.55, r * 0.032, r * 0.5, r * 0.012);
    else g.rect(x - r * 0.016, -r * 0.55, r * 0.032, r * 0.5);
    g.fill();
    g.stroke();
  }
  g.beginPath();
  if (g.roundRect) g.roundRect(-r * 0.15, -r * 0.08, r * 0.3, r * 0.1, r * 0.03);
  else g.rect(-r * 0.15, -r * 0.08, r * 0.3, r * 0.1);
  g.fill();
  g.stroke();
  g.beginPath();
  if (g.roundRect) g.roundRect(-r * 0.07, 0, r * 0.14, r * 0.78, r * 0.05);
  else g.rect(-r * 0.07, 0, r * 0.14, r * 0.78);
  g.fill();
  g.stroke();
  g.strokeStyle = "rgba(255,255,255,0.55)";
  g.lineWidth = Math.max(1, r * 0.01);
  g.beginPath();
  g.moveTo(-r * 0.028, r * 0.08);
  g.lineTo(-r * 0.028, r * 0.7);
  g.stroke();
  forkMetal(g, r);
  g.beginPath();
  g.arc(0, r * 0.82, r * 0.09, 0, TWO_PI);
  g.fill();
  g.stroke();
}

function drawStuckOlives(g, r) {
  g.strokeStyle = "#c5ced6";
  g.lineWidth = Math.max(3, r * 0.045);
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(0, -r * 0.5);
  g.lineTo(0, r * 0.95);
  g.stroke();
  g.strokeStyle = "rgba(255,255,255,0.45)";
  g.lineWidth = Math.max(1, r * 0.012);
  g.beginPath();
  g.moveTo(-r * 0.012, -r * 0.2);
  g.lineTo(-r * 0.012, r * 0.88);
  g.stroke();
  drawOliveAt(g, 0, r * 0.22, r * 0.18, r * 0.125, 0.4);
  drawOliveAt(g, 0, r * 0.55, r * 0.16, r * 0.11, -0.25);
  g.fillStyle = "#f4f7fa";
  g.strokeStyle = "#1a2026";
  g.lineWidth = Math.max(1.2, r * 0.012);
  g.beginPath();
  g.arc(0, r * 0.96, r * 0.045, 0, TWO_PI);
  g.fill();
  g.stroke();
}

function drawPizzaStakes(r, bossId, a0, span) {
  if (bossId !== "pizza") return;
  const g = ctx;
  const slot = TWO_PI / PIZZA_SLICES;
  for (let i = 0; i < PIZZA_HAZ.length; i++) {
    const hz = PIZZA_HAZ[i];
    for (let u = 0; u < PIZZA_STAKE_AT.length; u++) {
      const ang = (hz.slice + PIZZA_STAKE_AT[u]) * slot;
      if (span != null && !angInSpan(ang, a0, span)) continue;
      g.save();
      /* КОЛ ВОТКНУТ В ЛОМОТЬ, А РУКОЯТЬ ТОРЧИТ НАРУЖУ — и так он рисовался
         всегда. Метка стоит на своём угле (hz.slice + PIZZA_STAKE_AT) и
         рисуется во всю величину: зубцы вилки лежат на сыре в глубине ломтя
         (0.4 r от центра), перекладина садится на корку, а рукоять с
         набалдашником уходит за кромку на целый радиус (до 1.9 r).
         Ложится она ПОД рисунок пиццы (js/draw-log.js рисует колья до текстуры),
         поэтому воткнутая часть прячется под сыром и коркой, а наружу видно
         рукоять — ровно то, обо что разбивается нож. Ужать кол в круг бревна
         нельзя: торчать станет нечему, а нож всё равно ломается — смерть без
         рисунка (жалоба заказчика: «засунул шампуры внутрь пиццы, чтобы игрок не
         видел, обо что умирает»). Зона удара меряется ВИДИМОЙ шириной кола на
         кромке (js/bosses.js: pizzaStakeHalf) */
      g.rotate(ang - Math.PI / 2);
      g.translate(0, r);
      if (hz.kind === "olive") drawStuckOlives(g, r);
      else drawStuckFork(g, r);
      g.restore();
    }
  }
}

function makePizzaTex() {
  const size = BOSS_TEX, cx = BOSS_TEX_R;
  const R = BOSS_TEX_R - 1;
  const [c, g] = makeCanvas(size, size);
  const img = bossImages.pizza;
  if (img) {
    paintBossPhotoDisc(g, img, size, R);
    return c;
  }
  g.translate(cx, cx);
  g.beginPath();
  g.arc(0, 0, R, 0, TWO_PI);
  g.clip();
  const sauce = g.createRadialGradient(-20, -30, 10, 0, 10, R);
  sauce.addColorStop(0, "#e05038");
  sauce.addColorStop(0.55, "#c43828");
  sauce.addColorStop(1, "#8a2018");
  g.fillStyle = sauce;
  g.fillRect(-cx, -cx, size, size);
  const slot = TWO_PI / PIZZA_SLICES;
  const cheeseCols = ["#f6d48a", "#f0c56e", "#f8dc9a", "#e8b85c", "#f3c878", "#ffe0a4", "#eab45a", "#f7d090"];
  for (let i = 0; i < PIZZA_SLICES; i++) {
    const a0 = i * slot + 0.045;
    const a1 = (i + 1) * slot - 0.045;
    const mid = (i + 0.5) * slot;
    g.fillStyle = cheeseCols[i];
    g.beginPath();
    g.moveTo(Math.cos(a0) * R * 0.1, Math.sin(a0) * R * 0.1);
    g.arc(0, 0, R * 0.84, a0, a1);
    g.lineTo(Math.cos(a1) * R * 0.1, Math.sin(a1) * R * 0.1);
    g.closePath();
    g.fill();
    g.fillStyle = "rgba(255, 236, 190, 0.28)";
    g.beginPath();
    g.moveTo(Math.cos(mid) * R * 0.16, Math.sin(mid) * R * 0.16);
    g.arc(0, 0, R * 0.5, a0 + 0.04, a1 - 0.04);
    g.closePath();
    g.fill();
    if (!pizzaHazardKind(i)) {
      const px = Math.cos(mid);
      const py = Math.sin(mid);
      const qx = -py;
      const qy = px;
      if (i % 2 === 0) {
        drawPepperoni(g, px * R * 0.46 + qx * R * 0.1, py * R * 0.46 + qy * R * 0.1, R * 0.09);
        drawPepperoni(g, px * R * 0.68 - qx * R * 0.08, py * R * 0.68 - qy * R * 0.08, R * 0.072);
        drawBasil(g, px * R * 0.56 + qx * R * 0.16, py * R * 0.56 + qy * R * 0.16, R * 0.055, mid + 0.7);
      } else {
        drawBasil(g, px * R * 0.48, py * R * 0.48, R * 0.07, mid + 0.2);
        drawBasil(g, px * R * 0.7 + qx * R * 0.06, py * R * 0.7 + qy * R * 0.06, R * 0.048, mid - 0.8);
        drawPepperoni(g, px * R * 0.6 - qx * R * 0.12, py * R * 0.6 - qy * R * 0.12, R * 0.068);
        drawMushroom(g, px * R * 0.36 + qx * R * 0.12, py * R * 0.36 + qy * R * 0.12, R * 0.055, mid + 1.1);
      }
    }
  }
  g.fillStyle = "rgba(255, 220, 140, 0.55)";
  for (let i = 0; i < 36; i++) {
    const a = hash(420, i) * TWO_PI;
    const d = 30 + hash(421, i) * R * 0.7;
    const slice = Math.floor(((a % TWO_PI) + TWO_PI) % TWO_PI / slot) % PIZZA_SLICES;
    if (pizzaHazardKind(slice) && hash(422, i) > 0.35) continue;
    g.beginPath();
    g.ellipse(Math.cos(a) * d, Math.sin(a) * d, 4 + hash(423, i) * 9, 3 + hash(424, i) * 5, a, 0, TWO_PI);
    g.fill();
  }
  g.strokeStyle = "rgba(120, 28, 16, 0.55)";
  g.lineWidth = 5;
  g.lineCap = "round";
  for (let i = 0; i < PIZZA_SLICES; i++) {
    const a = i * slot;
    g.beginPath();
    g.moveTo(Math.cos(a) * R * 0.08, Math.sin(a) * R * 0.08);
    g.lineTo(Math.cos(a) * R * 0.9, Math.sin(a) * R * 0.9);
    g.stroke();
  }
  g.lineWidth = R * 0.2;
  const crust = g.createLinearGradient(-R, -R, R, R);
  crust.addColorStop(0, "#f0c07a");
  crust.addColorStop(0.45, "#e09448");
  crust.addColorStop(1, "#b46830");
  g.strokeStyle = crust;
  g.beginPath();
  g.arc(0, 0, R * 0.9, 0, TWO_PI);
  g.stroke();
  g.lineWidth = R * 0.045;
  g.strokeStyle = "rgba(90, 40, 16, 0.45)";
  g.beginPath();
  g.arc(0, 0, R * 0.98, 0, TWO_PI);
  g.stroke();
  for (let i = 0; i < 34; i++) {
    const a = hash(430, i) * TWO_PI;
    const d = R * (0.9 + (hash(431, i) - 0.5) * 0.08);
    g.fillStyle = hash(432, i) > 0.62 ? "rgba(50, 22, 10, 0.62)" : "rgba(255, 228, 180, 0.55)";
    g.beginPath();
    g.ellipse(Math.cos(a) * d, Math.sin(a) * d, 5 + hash(433, i) * 16, 3.5 + hash(434, i) * 7, a, 0, TWO_PI);
    g.fill();
  }
  const pool = g.createRadialGradient(0, 0, 4, 0, 0, R * 0.16);
  pool.addColorStop(0, "#fff1c8");
  pool.addColorStop(0.6, "#f0c56a");
  pool.addColorStop(1, "rgba(240, 180, 70, 0)");
  g.fillStyle = pool;
  g.beginPath();
  g.arc(0, 0, R * 0.16, 0, TWO_PI);
  g.fill();
  g.fillStyle = "rgba(255,255,255,0.22)";
  g.beginPath();
  g.ellipse(-R * 0.28, -R * 0.34, R * 0.22, R * 0.09, -0.6, 0, TWO_PI);
  g.fill();
  return c;
}

