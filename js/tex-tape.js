/* СКОТЧ — рулон прозрачной ленты: холодная плёнка с витками и картонный
   сердечник в середине. Рулон читается ШАРОМ, а не серым кругом: свет ложится
   сверху слева, к кромке уходит тень, витки идут кольцами, а сердечник утоплен
   в тень ленты.

   Витки и свободный конец ленты живут в самой текстуре: она крутится вместе с
   боссом (у скотча бешеная раскрутка, резкий стоп и медленный выкат —
   beginTapeSpin/stepTapeSpin в boss-spin.js), поэтому витки едут по рулону,
   а не стоят на месте. Единственный неподвижный блик — drawShineGlint поверх
   готового диска (js/draw-log.js): свет в игре не крутится вместе с боссом. */
function makeTapeTex() {
  const size = BOSS_TEX;
  const R = BOSS_TEX_R;
  const [c, g] = makeCanvas(size, size);
  const img = bossImages.tape;
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

  /* плёнка: холодная полупрозрачная лента, свет сверху слева */
  const film = g.createRadialGradient(-R * 0.32, -R * 0.36, R * 0.04, R * 0.05, R * 0.08, R * 1.02);
  film.addColorStop(0, "#fbfdff");
  film.addColorStop(0.3, "#e5eff6");
  film.addColorStop(0.62, "#c8d8e4");
  film.addColorStop(0.86, "#a4b9c9");
  film.addColorStop(1, "#7d95a6");
  g.fillStyle = film;
  g.fillRect(-R, -R, size, size);

  /* витки намотанной плёнки: кольца чуть светлее и чуть темнее основы —
     именно они дают «рулон», а не диск */
  for (let i = 0; i < 22; i++) {
    const rr = R * (0.36 + (i / 22) * 0.6);
    g.strokeStyle = i % 2
      ? "rgba(255, 255, 255, " + (0.16 + hash(6100, i) * 0.16).toFixed(3) + ")"
      : "rgba(96, 120, 138, " + (0.08 + hash(6101, i) * 0.1).toFixed(3) + ")";
    g.lineWidth = R * (0.008 + hash(6102, i) * 0.012);
    g.beginPath();
    g.arc(0, 0, rr, 0, TWO_PI);
    g.stroke();
  }

  /* крапина плёнки: без неё лента выглядит крашеным пластиком */
  for (let i = 0; i < 150; i++) {
    const a = hash(6110, i) * TWO_PI;
    const d = R * (0.12 + hash(6111, i) * 0.86);
    const x = Math.cos(a) * d;
    const y = Math.sin(a) * d;
    const r = R * (0.004 + hash(6112, i) * 0.01);
    g.fillStyle = hash(6113, i) > 0.5
      ? "rgba(255, 255, 255, " + (0.1 + hash(6114, i) * 0.18).toFixed(3) + ")"
      : "rgba(88, 112, 130, " + (0.06 + hash(6115, i) * 0.12).toFixed(3) + ")";
    g.beginPath();
    g.ellipse(x, y, r * 1.6, r, a, 0, TWO_PI);
    g.fill();
  }

  /* свободный конец ленты: светлая полоса от сердечника к кромке с отгибом —
     видно, что плёнку где-то оторвали */
  g.strokeStyle = "rgba(255, 255, 255, 0.34)";
  g.lineWidth = R * 0.028;
  g.beginPath();
  g.moveTo(R * 0.2, -R * 0.26);
  g.quadraticCurveTo(R * 0.62, -R * 0.5, R * 0.88, -R * 0.34);
  g.stroke();
  g.strokeStyle = "rgba(96, 122, 140, 0.28)";
  g.lineWidth = R * 0.01;
  g.beginPath();
  g.moveTo(R * 0.2, -R * 0.22);
  g.quadraticCurveTo(R * 0.62, -R * 0.46, R * 0.88, -R * 0.3);
  g.stroke();

  /* картонный сердечник, утопленный в тень ленты */
  const coreR = R * 0.34;
  const core = g.createRadialGradient(-coreR * 0.3, -coreR * 0.34, coreR * 0.08, 0, 0, coreR);
  core.addColorStop(0, "#ead9b4");
  core.addColorStop(0.6, "#cfb488");
  core.addColorStop(1, "#a5875c");
  g.fillStyle = core;
  g.beginPath();
  g.arc(0, 0, coreR, 0, TWO_PI);
  g.fill();
  /* внутренняя втулка: тёмное кольцо, за ним — тень от намотанной ленты */
  g.fillStyle = "#8a6f49";
  g.beginPath();
  g.arc(0, 0, coreR * 0.72, 0, TWO_PI);
  g.fill();
  g.fillStyle = "#6b5436";
  g.beginPath();
  g.arc(0, 0, coreR * 0.5, 0, TWO_PI);
  g.fill();
  /* тень ленты на сердечнике: узкое тёмное кольцо у самого края */
  g.strokeStyle = "rgba(70, 92, 108, 0.32)";
  g.lineWidth = R * 0.02;
  g.beginPath();
  g.arc(0, 0, coreR + R * 0.012, 0, TWO_PI);
  g.stroke();
  /* картон: мелкие волокна по кольцу */
  for (let i = 0; i < 46; i++) {
    const a = hash(6120, i) * TWO_PI;
    const d = coreR * (0.78 + hash(6121, i) * 0.18);
    g.strokeStyle = hash(6122, i) > 0.5
      ? "rgba(255, 244, 214, 0.3)"
      : "rgba(104, 80, 48, 0.26)";
    g.lineWidth = Math.max(1, R * 0.005);
    g.beginPath();
    g.moveTo(Math.cos(a) * d, Math.sin(a) * d);
    g.lineTo(Math.cos(a + 0.16) * (d + R * 0.02), Math.sin(a + 0.16) * (d + R * 0.02));
    g.stroke();
  }

  /* тень по краю: без неё рулон сливается с фоном */
  const rim = g.createRadialGradient(0, 0, R * 0.55, 0, 0, R);
  rim.addColorStop(0, "rgba(0,0,0,0)");
  rim.addColorStop(0.7, "rgba(52, 76, 92, 0.12)");
  rim.addColorStop(1, "rgba(28, 44, 56, 0.42)");
  g.fillStyle = rim;
  g.beginPath();
  g.arc(0, 0, R, 0, TWO_PI);
  g.fill();

  /* блик: широкое холодное пятно и маленькое ядро — плёнка глянцевая */
  const glow = g.createRadialGradient(-R * 0.34, -R * 0.4, R * 0.03, -R * 0.3, -R * 0.35, R * 0.5);
  glow.addColorStop(0, "rgba(255,255,255,0.66)");
  glow.addColorStop(0.44, "rgba(255,255,255,0.16)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = glow;
  g.beginPath();
  g.arc(-R * 0.3, -R * 0.35, R * 0.5, 0, TWO_PI);
  g.fill();
  g.save();
  g.translate(-R * 0.3, -R * 0.34);
  g.rotate(-0.42);
  g.fillStyle = "rgba(255, 255, 255, 0.5)";
  g.beginPath();
  g.ellipse(0, 0, R * 0.13, R * 0.07, 0, 0, TWO_PI);
  g.fill();
  g.restore();
  g.restore();

  /* кант: узкая тёмная кромка, чтобы рулон отделялся от неба */
  g.strokeStyle = "rgba(58, 78, 92, 0.55)";
  g.lineWidth = Math.max(2.4, R * 0.018);
  g.beginPath();
  g.arc(0, 0, R - 1, 0, TWO_PI);
  g.stroke();
  return c;
}
