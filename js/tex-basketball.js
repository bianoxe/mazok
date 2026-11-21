/* БАСКЕТБОЛЬНЫЙ МЯЧ — оранжевая пупырчатая кожа и четыре чёрных шва.
   Мяч читается ШАРОМ, а не оранжевым кругом: свет ложится сверху слева, к кромке
   уходит тень, а швы идут по сфере дугами — поэтому объём виден и без блика.

   Швы живут в самой текстуре: она крутится вместе с боссом (у мяча самый ровный
   ход в игре — beginSmoothSpin("basketball")), поэтому швы едут по мячу, а не
   стоят на месте. Единственный неподвижный блик — drawShineGlint поверх готового
   диска (js/draw-log.js): свет в игре не крутится вместе с боссом.

   Пупырчатая кожа — мелкая крапина: без неё мяч выглядит пластмассовым шариком. */
function makeBasketballTex() {
  const size = BOSS_TEX;
  const R = BOSS_TEX_R;
  const [c, g] = makeCanvas(size, size);
  const img = bossImages.basketball;
  if (img) {
    paintBossPhotoDisc(g, img, size, R - 0.5);
    return c;
  }
  g.translate(R, R);
  g.lineJoin = "round";
  g.lineCap = "round";
  g.save();
  g.beginPath();
  g.arc(0, 0, R - 0.5, 0, TWO_PI);
  g.clip();

  /* основа: тёплая оранжевая кожа, свет сверху слева, к кромке — коричневая тень */
  const skin = g.createRadialGradient(-R * 0.3, -R * 0.34, R * 0.05, R * 0.05, R * 0.08, R * 1.02);
  skin.addColorStop(0, "#ffc47c");
  skin.addColorStop(0.22, "#f79a2e");
  skin.addColorStop(0.52, "#e2710f");
  skin.addColorStop(0.8, "#b34a07");
  skin.addColorStop(1, "#742c04");
  g.fillStyle = skin;
  g.fillRect(-R, -R, size, size);

  /* пупырчатая кожа: бугорки светлее и темнее основы, крупных пятен нет */
  for (let i = 0; i < 420; i++) {
    const a = hash(5200, i) * TWO_PI;
    const d = R * (0.05 + hash(5201, i) * 0.94);
    const x = Math.cos(a) * d;
    const y = Math.sin(a) * d;
    const r = R * (0.006 + hash(5202, i) * 0.014);
    g.fillStyle = hash(5203, i) > 0.5
      ? "rgba(255, 214, 160," + (0.1 + hash(5204, i) * 0.18).toFixed(3) + ")"
      : "rgba(96, 32, 4," + (0.09 + hash(5205, i) * 0.15).toFixed(3) + ")";
    g.beginPath();
    g.ellipse(x, y, r, r * 0.7, a, 0, TWO_PI);
    g.fill();
  }

  /* швы: меридиан, экватор и две дуги по бокам. Каждый шов идёт тремя полосами —
     тень под ним, сама чёрная нитка и тонкий свет сверху, поэтому шов кажется
     накладным, а не нарисованным поверх краски */
  const seam = (trace) => {
    trace();
    g.strokeStyle = "rgba(58, 20, 4, 0.34)";
    g.lineWidth = R * 0.075;
    g.stroke();
    trace();
    g.strokeStyle = "rgba(14, 10, 8, 0.92)";
    g.lineWidth = R * 0.05;
    g.stroke();
    trace();
    g.strokeStyle = "rgba(255, 214, 168, 0.26)";
    g.lineWidth = R * 0.014;
    g.stroke();
  };
  /* меридиан: сверху вниз, чуть выпуклый вправо */
  seam(() => {
    g.beginPath();
    g.moveTo(0, -R * 0.998);
    g.bezierCurveTo(R * 0.1, -R * 0.45, R * 0.1, R * 0.45, 0, R * 0.998);
  });
  /* экватор: поперёк, с мягким прогибом вниз — так линия лежит на сфере */
  seam(() => {
    g.beginPath();
    g.moveTo(-R * 0.995, 0);
    g.quadraticCurveTo(0, R * 0.105, R * 0.995, 0);
  });
  /* боковые дуги: от макушки к низу, каждая со своим изгибом */
  for (const m of [-1, 1]) {
    seam(() => {
      g.beginPath();
      g.moveTo(m * R * 0.06, -R * 0.998);
      g.bezierCurveTo(m * R * 0.86, -R * 0.6, m * R * 0.86, R * 0.6, m * R * 0.06, R * 0.998);
    });
  }

  /* тень по краю: без неё шар сливается с фоном */
  const rim = g.createRadialGradient(0, 0, R * 0.55, 0, 0, R);
  rim.addColorStop(0, "rgba(0,0,0,0)");
  rim.addColorStop(0.72, "rgba(72, 24, 2, 0.16)");
  rim.addColorStop(1, "rgba(36, 12, 2, 0.46)");
  g.fillStyle = rim;
  g.beginPath();
  g.arc(0, 0, R, 0, TWO_PI);
  g.fill();

  /* блик: широкое тёплое пятно и маленькое ядро — лаковая кожа блестит мягко */
  const glow = g.createRadialGradient(-R * 0.34, -R * 0.4, R * 0.03, -R * 0.3, -R * 0.35, R * 0.5);
  glow.addColorStop(0, "rgba(255, 246, 230, 0.62)");
  glow.addColorStop(0.44, "rgba(255, 238, 214, 0.16)");
  glow.addColorStop(1, "rgba(255, 238, 214, 0)");
  g.fillStyle = glow;
  g.beginPath();
  g.arc(-R * 0.3, -R * 0.35, R * 0.5, 0, TWO_PI);
  g.fill();
  g.save();
  g.translate(-R * 0.3, -R * 0.34);
  g.rotate(-0.42);
  g.fillStyle = "rgba(255, 250, 240, 0.46)";
  g.beginPath();
  g.ellipse(0, 0, R * 0.12, R * 0.066, 0, 0, TWO_PI);
  g.fill();
  g.restore();
  g.restore();

  /* кант: узкая тёмная кромка, чтобы мяч отделялся от неба */
  g.strokeStyle = "rgba(58, 22, 6, 0.55)";
  g.lineWidth = Math.max(2.4, R * 0.018);
  g.beginPath();
  g.arc(0, 0, R - 1, 0, TWO_PI);
  g.stroke();
  return c;
}
