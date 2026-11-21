/* ТАРЕЛКА — белый фарфор с синей росписью (гжель) и волнистым краем.
   Край волнистый ТОЛЬКО в рисунке: хитбокс у тарелки — идеальный круг
   (js/hit.js: surfaceRadius не знает про "plate" и отдаёт ровно r). Поэтому
   волны идут внутрь круга: гребень волны доходит ровно до r, а впадина уходит
   на пару процентов глубже, — нож всегда садится в кромку и никогда не висит
   в воздухе.

   Роспись живёт в текстуре и крутится вместе с боссом: кольцо точек, лепестки
   в середине и двойная волнистая линия у края. Блик — неподвижный, его кладёт
   drawShineGlint поверх готового диска (js/draw-log.js): свет в игре не
   крутится вместе с тарелкой. */
function plateRimPath(g, rBase, amp, lobes, phase) {
  const N = 240;
  g.beginPath();
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * TWO_PI;
    const rr = rBase + amp * Math.cos(lobes * a + phase);
    const x = Math.cos(a) * rr;
    const y = Math.sin(a) * rr;
    if (i === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.closePath();
}

function makePlateTex() {
  const size = BOSS_TEX;
  const R = BOSS_TEX_R;
  const [c, g] = makeCanvas(size, size);
  const img = bossImages.plate;
  if (img) {
    paintBossPhotoDisc(g, img, size, R - 0.5);
    return c;
  }
  /* гребень волны — ровно на кромке круга: R*0.973 + R*0.027 = R */
  const RIM_BASE = R * 0.973;
  const RIM_AMP = R * 0.027;
  const RIM_LOBES = 12;
  const BLUE = "#2f6fd0";
  const BLUE_DEEP = "#1b4a96";

  g.translate(R, R);
  g.lineJoin = "round";
  g.lineCap = "round";
  g.save();
  plateRimPath(g, RIM_BASE, RIM_AMP, RIM_LOBES, 0);
  g.clip();

  /* фарфор: белое тело, к краю — холодная тень */
  const body = g.createRadialGradient(-R * 0.3, -R * 0.34, R * 0.05, R * 0.04, R * 0.06, R * 1.02);
  body.addColorStop(0, "#ffffff");
  body.addColorStop(0.42, "#f8fbff");
  body.addColorStop(0.78, "#e9f2fb");
  body.addColorStop(1, "#cfdcEC");
  g.fillStyle = body;
  g.fillRect(-R, -R, size, size);

  /* лунка тарелки: мягкая тень к середине, чтобы фарфор читался вогнутым */
  const well = g.createRadialGradient(0, 0, R * 0.42, 0, 0, R * 0.92);
  well.addColorStop(0, "rgba(150, 182, 218, 0.16)");
  well.addColorStop(0.6, "rgba(150, 182, 218, 0.05)");
  well.addColorStop(1, "rgba(150, 182, 218, 0)");
  g.fillStyle = well;
  g.beginPath();
  g.arc(0, 0, R, 0, TWO_PI);
  g.fill();

  /* двойная волнистая линия по борту: та же волна, что у кромки, только уже */
  for (const band of [[0.845, 0.024, 0.019], [0.795, 0.02, 0.012]]) {
    g.strokeStyle = band[2] > 0.015 ? BLUE : "rgba(47, 111, 208, 0.62)";
    g.lineWidth = R * band[2];
    plateRimPath(g, R * band[0], R * band[1], RIM_LOBES, 0);
    g.stroke();
  }

  /* кольцо ягод и листиков между бортом и лункой */
  const RING = 0.68;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TWO_PI + 0.26;
    const x = Math.cos(a) * R * RING;
    const y = Math.sin(a) * R * RING;
    g.fillStyle = i % 2 ? BLUE : BLUE_DEEP;
    g.beginPath();
    g.ellipse(x, y, R * 0.026, R * 0.019, a, 0, TWO_PI);
    g.fill();
    /* мазок-травинка между ягодами: два тонких изгиба наружу */
    const b = a + Math.PI / 12;
    for (const side of [-0.16, 0.16]) {
      g.strokeStyle = "rgba(47, 111, 208, 0.72)";
      g.lineWidth = Math.max(1.2, R * 0.008);
      g.beginPath();
      const bx = Math.cos(b) * R * (RING - 0.03);
      const by = Math.sin(b) * R * (RING - 0.03);
      g.moveTo(bx, by);
      g.quadraticCurveTo(
        Math.cos(b + side) * R * (RING + 0.06),
        Math.sin(b + side) * R * (RING + 0.06),
        Math.cos(b + side * 2) * R * (RING + 0.02),
        Math.sin(b + side * 2) * R * (RING + 0.02)
      );
      g.stroke();
    }
  }

  /* лепестки в середине: восемь штук вокруг ядра, у каждого светлая прожилка */
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TWO_PI;
    const x = Math.cos(a) * R * 0.17;
    const y = Math.sin(a) * R * 0.17;
    g.save();
    g.translate(x, y);
    g.rotate(a);
    g.fillStyle = i % 2 ? BLUE : BLUE_DEEP;
    g.beginPath();
    g.ellipse(0, 0, R * 0.085, R * 0.042, 0, 0, TWO_PI);
    g.fill();
    g.strokeStyle = "rgba(255, 255, 255, 0.55)";
    g.lineWidth = Math.max(1, R * 0.006);
    g.beginPath();
    g.moveTo(-R * 0.045, 0);
    g.lineTo(R * 0.045, 0);
    g.stroke();
    g.restore();
  }
  /* ядро розетки и тонкий ободок вокруг неё */
  g.fillStyle = BLUE_DEEP;
  g.beginPath();
  g.arc(0, 0, R * 0.062, 0, TWO_PI);
  g.fill();
  g.fillStyle = "rgba(255, 255, 255, 0.8)";
  g.beginPath();
  g.arc(-R * 0.012, -R * 0.014, R * 0.022, 0, TWO_PI);
  g.fill();
  g.strokeStyle = "rgba(47, 111, 208, 0.5)";
  g.lineWidth = Math.max(1.2, R * 0.007);
  g.beginPath();
  g.arc(0, 0, R * 0.265, 0, TWO_PI);
  g.stroke();

  /* край: тень внутрь от кромки и узкий светлый кант — фарфор тонкий и глянцевый */
  const rim = g.createRadialGradient(0, 0, R * 0.86, 0, 0, R);
  rim.addColorStop(0, "rgba(78, 116, 164, 0)");
  rim.addColorStop(0.55, "rgba(78, 116, 164, 0.12)");
  rim.addColorStop(1, "rgba(56, 92, 140, 0.38)");
  g.fillStyle = rim;
  g.beginPath();
  g.arc(0, 0, R, 0, TWO_PI);
  g.fill();
  g.strokeStyle = "rgba(255, 255, 255, 0.72)";
  g.lineWidth = Math.max(1.6, R * 0.012);
  plateRimPath(g, R * 0.93, R * 0.012, RIM_LOBES, 0);
  g.stroke();

  /* блик: широкое холодное пятно сверху слева */
  const glow = g.createRadialGradient(-R * 0.34, -R * 0.4, R * 0.03, -R * 0.3, -R * 0.35, R * 0.52);
  glow.addColorStop(0, "rgba(255,255,255,0.8)");
  glow.addColorStop(0.44, "rgba(255,255,255,0.2)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = glow;
  g.beginPath();
  g.arc(-R * 0.3, -R * 0.35, R * 0.52, 0, TWO_PI);
  g.fill();
  g.restore();

  /* кант по волнистой кромке: тарелка отделяется от неба */
  g.strokeStyle = "rgba(74, 112, 158, 0.55)";
  g.lineWidth = Math.max(2, R * 0.014);
  plateRimPath(g, RIM_BASE, RIM_AMP, RIM_LOBES, 0);
  g.stroke();
  return c;
}
