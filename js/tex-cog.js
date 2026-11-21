/* ШЕСТЕРЁНКА — литая стальная шестерня: зубья по обводу, ступица со шпонкой.
   Текстура печётся ПРЯМО ПО СИЛУЭТУ (pathGear): зубья — часть картинки, а не
   накладка поверх диска. Поэтому кромка силуэта и кромка, по которой считает
   нож (gearRadiusMul), — одна и та же кривая, и нож во впадину садится глубже,
   чем в площадку зуба.

   Объём держат скошенные грани: у площадки каждого зуба светлая кромка, между
   зубьями по корню идёт тень — видно, что зубья вырезаны в толстой детали, а не
   нарисованы линией на круге. Остальное — стальной градиент, пояс болтов и
   тёмная ось, как у настоящей шестерни передачи. */
function makeCogTex() {
  /* фото: литая шестерня с зубьями — силуэтом, чтобы зубья не срезало кругом */
  const photo = bossPhotoTex("cog");
  if (photo) return photo;
  const size = BOSS_TEX;
  const R = BOSS_TEX_R;
  const [c, g] = makeCanvas(size, size);
  g.translate(R, R);
  g.lineJoin = "round";
  g.lineCap = "butt";
  g.save();
  pathGear(g, R - 1);
  g.clip();

  /* тело: холодная сталь, блик сверху слева, тень к кромке */
  const steel = g.createRadialGradient(-R * 0.3, -R * 0.34, R * 0.04, R * 0.05, R * 0.08, R * 1.04);
  steel.addColorStop(0, "#f4f7fa");
  steel.addColorStop(0.26, "#ccd4de");
  steel.addColorStop(0.58, "#98a2af");
  steel.addColorStop(0.84, "#69737f");
  steel.addColorStop(1, "#3d4650");
  g.fillStyle = steel;
  g.fillRect(-R, -R, size, size);

  const slot = TWO_PI / GEAR_TEETH;
  const tip = R * 0.995;
  const root = R * (1 - GEAR_TOOTH_H);
  for (let i = 0; i < GEAR_TEETH; i++) {
    const a = (i + 0.5) * slot;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    /* впадина: тень по корневой окружности — зубья «утоплены» в тело */
    g.strokeStyle = "rgba(16, 22, 30, 0.42)";
    g.lineWidth = Math.max(2.4, R * 0.022);
    g.beginPath();
    g.arc(0, 0, root + R * 0.008, a - slot * 0.5 + slot * 0.06, a + slot * 0.5 - slot * 0.06);
    g.stroke();
    /* скошенная грань зуба: светлая со стороны блика, тёмная с другой */
    g.strokeStyle = "rgba(255,255,255,0.34)";
    g.lineWidth = Math.max(2.2, R * 0.017);
    g.beginPath();
    g.moveTo(Math.cos(a - slot * 0.13) * root * 0.99, Math.sin(a - slot * 0.13) * root * 0.99);
    g.lineTo(Math.cos(a - slot * 0.13) * tip, Math.sin(a - slot * 0.13) * tip);
    g.stroke();
    g.strokeStyle = "rgba(22, 30, 40, 0.34)";
    g.beginPath();
    g.moveTo(Math.cos(a + slot * 0.13) * root * 0.99, Math.sin(a + slot * 0.13) * root * 0.99);
    g.lineTo(Math.cos(a + slot * 0.13) * tip, Math.sin(a + slot * 0.13) * tip);
    g.stroke();
    /* площадка зуба: мягкий блик по самой кромке */
    g.strokeStyle = "rgba(255,255,255,0.5)";
    g.lineWidth = Math.max(1.6, R * 0.013);
    g.beginPath();
    g.arc(0, 0, tip - R * 0.012, a - slot * 0.16, a + slot * 0.16);
    g.stroke();
    g.fillStyle = "rgba(20, 26, 34, 0.16)";
    g.beginPath();
    g.ellipse(ca * root * 0.86, sa * root * 0.86, R * 0.05, R * 0.018, a, 0, TWO_PI);
    g.fill();
  }

  /* обод: по корню зубьев идёт светлая дорожка — граница зубчатого венца */
  g.strokeStyle = "rgba(255,255,255,0.18)";
  g.lineWidth = Math.max(3, R * 0.026);
  g.beginPath();
  g.arc(0, 0, root * 0.92, 0, TWO_PI);
  g.stroke();
  g.strokeStyle = "rgba(18, 24, 32, 0.3)";
  g.lineWidth = Math.max(2.6, R * 0.02);
  g.beginPath();
  g.arc(0, 0, root * 0.85, 0, TWO_PI);
  g.stroke();

  /* пояс болтов: шесть головок, каждая со своим бликом — деталь собрана */
  const boltR = R * 0.62;
  for (let i = 0; i < 6; i++) {
    const a = i * (TWO_PI / 6) + 0.26;
    const bx = Math.cos(a) * boltR;
    const by = Math.sin(a) * boltR;
    const br = R * 0.062;
    g.fillStyle = "rgba(18, 24, 32, 0.34)";
    g.beginPath();
    g.arc(bx, by + br * 0.22, br * 1.04, 0, TWO_PI);
    g.fill();
    const head = g.createRadialGradient(bx - br * 0.4, by - br * 0.45, br * 0.1, bx, by, br);
    head.addColorStop(0, "#eef3f8");
    head.addColorStop(0.55, "#b6c0cb");
    head.addColorStop(1, "#6b7683");
    g.fillStyle = head;
    g.beginPath();
    g.arc(bx, by, br, 0, TWO_PI);
    g.fill();
    g.strokeStyle = "rgba(16, 22, 30, 0.5)";
    g.lineWidth = Math.max(1.4, R * 0.009);
    g.stroke();
  }

  /* ступица и ось: тёмный стакан с ключом (шпонкой) под вал */
  const hub = g.createRadialGradient(-R * 0.06, -R * 0.08, R * 0.02, 0, 0, R * 0.36);
  hub.addColorStop(0, "#dfe6ee");
  hub.addColorStop(0.6, "#98a3b0");
  hub.addColorStop(1, "#5a6470");
  g.fillStyle = hub;
  g.beginPath();
  g.arc(0, 0, R * 0.36, 0, TWO_PI);
  g.fill();
  g.strokeStyle = "rgba(14, 20, 28, 0.55)";
  g.lineWidth = Math.max(2.4, R * 0.018);
  g.stroke();
  g.fillStyle = "#1b222a";
  g.beginPath();
  g.arc(0, 0, R * 0.17, 0, TWO_PI);
  g.fill();
  g.strokeStyle = "rgba(230, 238, 246, 0.5)";
  g.lineWidth = Math.max(1.8, R * 0.013);
  g.stroke();
  g.fillStyle = "#1b222a";
  g.beginPath();
  g.rect(-R * 0.035, -R * 0.26, R * 0.07, R * 0.11);
  g.fill();
  g.strokeStyle = "rgba(0,0,0,0.35)";
  g.lineWidth = Math.max(1.2, R * 0.008);
  g.stroke();

  /* масляный отблеск по венцу: без него сталь выглядит крашеной */
  g.fillStyle = "rgba(255,255,255,0.16)";
  g.beginPath();
  g.ellipse(-R * 0.34, -R * 0.42, R * 0.3, R * 0.1, -0.62, 0, TWO_PI);
  g.fill();
  g.restore();

  /* кант по силуэту: зубья должны читаться на фоне неба */
  g.strokeStyle = "#111820";
  g.lineWidth = Math.max(3.2, R * 0.024);
  pathGear(g, R - 1.5);
  g.stroke();
  return c;
}
