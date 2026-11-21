/* ЩИТ — рыцарский «heater»: толстое деревянное полотно (пять вертикальных
   досок, слегка выпуклое) и стальная окантовка ровно по всему краю силуэта с
   мелкими заклёпками. Вид строго спереди, острие вниз. */
function makeAegisTex() {
  const size = BOSS_TEX, cx = size * 0.5;
  const R = BOSS_TEX_R - 1;
  const [c, g] = makeCanvas(size, size);
  const img = bossImages.aegis;
  if (img) {
    /* Викингский щит на картинке круглый — cover в диск, как теннис/мишень.
       Процедурный heater остаётся запасным, если файла нет. */
    paintBossPhotoDisc(g, img, size, R);
    return c;
  }
  g.translate(cx, cx);
  g.lineJoin = "round";
  g.lineCap = "round";

  const WOOD = 0.855;                    /* внутренний край окантовки */
  const RIM = R * WOOD;
  const rivetRad = R * 0.03;

  /* ---- 1. Стальная окантовка: металл по всему силуэту ---- */
  const steel = g.createLinearGradient(-R * 0.72, -R, R * 0.6, R);
  steel.addColorStop(0, "#f7fafc");
  steel.addColorStop(0.2, "#ccd5dd");
  steel.addColorStop(0.5, "#88929d");
  steel.addColorStop(0.8, "#4a545e");
  steel.addColorStop(1, "#1f262c");
  g.fillStyle = steel;
  pathAegis(g, R);
  g.fill();

  /* блик по металлу сверху слева, тень снизу справа */
  const sheen = g.createLinearGradient(-R * 0.7, -R * 0.85, R * 0.5, R * 0.75);
  sheen.addColorStop(0, "rgba(255,255,255,0.5)");
  sheen.addColorStop(0.35, "rgba(255,255,255,0)");
  sheen.addColorStop(0.72, "rgba(0,0,0,0.2)");
  sheen.addColorStop(1, "rgba(0,0,0,0.4)");
  g.fillStyle = sheen;
  pathAegis(g, R);
  g.fill();

  /* ---- 2. Деревянное полотно ---- */
  g.save();
  pathAegis(g, RIM);
  g.clip();

  const wood = g.createLinearGradient(-R * 0.32, -R * 0.7, R * 0.42, R);
  wood.addColorStop(0, "#f4dbaa");
  wood.addColorStop(0.34, "#d19c55");
  wood.addColorStop(0.7, "#a06a34");
  wood.addColorStop(1, "#6c451f");
  g.fillStyle = wood;
  g.fillRect(-R, -R, R * 2, R * 2);

  /* доски: пять вертикальных полос с швами */
  const planks = 5;
  const left = -R;
  const pw = (R * 2) / planks;
  for (let i = 0; i < planks; i++) {
    g.fillStyle = i % 2 ? "rgba(64, 34, 12, 0.13)" : "rgba(255, 230, 176, 0.07)";
    g.fillRect(left + i * pw, -R, pw + 1, R * 2);
  }
  for (let i = 1; i < planks; i++) {
    const x = left + i * pw;
    g.strokeStyle = "rgba(46, 24, 8, 0.5)";
    g.lineWidth = Math.max(2.4, R * 0.014);
    g.beginPath(); g.moveTo(x, -R); g.lineTo(x + R * 0.01, R); g.stroke();
    g.strokeStyle = "rgba(255, 224, 168, 0.14)";
    g.lineWidth = Math.max(1.2, R * 0.006);
    g.beginPath(); g.moveTo(x + R * 0.014, -R); g.lineTo(x + R * 0.024, R); g.stroke();
  }

  /* продольные волокна */
  g.lineWidth = Math.max(1, R * 0.005);
  for (let i = 0; i < 30; i++) {
    const x = -R * 0.82 + hash(80, i) * R * 1.64;
    const y0 = -R;
    g.strokeStyle = hash(85, i) > 0.55 ? "rgba(70, 36, 14, 0.2)" : "rgba(255, 216, 154, 0.12)";
    g.beginPath();
    g.moveTo(x, y0);
    g.bezierCurveTo(
      x + (hash(81, i) - 0.5) * R * 0.05, y0 + R * 0.42,
      x + (hash(82, i) - 0.5) * R * 0.06, y0 + R * 0.9,
      x + (hash(83, i) - 0.5) * R * 0.04, y0 + R * 1.9
    );
    g.stroke();
  }

  function knot(x, y, rad) {
    g.fillStyle = "rgba(92, 52, 22, 0.26)";
    g.beginPath();
    g.ellipse(x, y, rad * 1.9, rad * 1.25, 0.3, 0, TWO_PI);
    g.fill();
    g.fillStyle = "rgba(56, 28, 10, 0.72)";
    g.beginPath();
    g.ellipse(x, y, rad, rad * 0.72, 0.25, 0, TWO_PI);
    g.fill();
    g.strokeStyle = "rgba(34, 16, 6, 0.55)";
    g.lineWidth = Math.max(1.4, R * 0.006);
    g.stroke();
  }
  knot(-R * 0.2, -R * 0.1, R * 0.04);
  knot(R * 0.22, R * 0.18, R * 0.03);

  /* объём: тёплый блик сверху слева и затемнение к кромке */
  const vig = g.createRadialGradient(-R * 0.14, -R * 0.3, R * 0.06, -R * 0.02, R * 0.02, R * 0.95);
  vig.addColorStop(0, "rgba(255, 234, 190, 0.26)");
  vig.addColorStop(0.5, "rgba(255, 236, 200, 0.04)");
  vig.addColorStop(1, "rgba(32, 14, 4, 0.42)");
  g.fillStyle = vig;
  g.fillRect(-R, -R, R * 2, R * 2);

  /* дерево «уходит» вглубь у самой окантовки */
  g.strokeStyle = "rgba(30, 14, 4, 0.5)";
  g.lineWidth = Math.max(3, R * 0.05);
  pathAegis(g, RIM);
  g.stroke();
  g.strokeStyle = "rgba(255, 228, 178, 0.16)";
  g.lineWidth = Math.max(1.4, R * 0.012);
  pathAegis(g, RIM * 0.96);
  g.stroke();
  g.restore();

  /* ---- 3. Шов между деревом и металлом ---- */
  g.strokeStyle = "rgba(22, 12, 5, 0.9)";
  g.lineWidth = Math.max(2.4, R * 0.014);
  pathAegis(g, RIM);
  g.stroke();
  g.strokeStyle = "rgba(255, 244, 216, 0.3)";
  g.lineWidth = Math.max(1.2, R * 0.007);
  pathAegis(g, RIM * 1.035);
  g.stroke();

  /* ---- 4. Заклёпки по окантовке ---- */
  function rivet(x, y, rad) {
    g.fillStyle = "rgba(0,0,0,0.38)";
    g.beginPath();
    g.arc(x + rad * 0.14, y + rad * 0.2, rad * 1.04, 0, TWO_PI);
    g.fill();
    const rg = g.createRadialGradient(x - rad * 0.36, y - rad * 0.4, rad * 0.06, x, y, rad * 1.05);
    rg.addColorStop(0, "#ffffff");
    rg.addColorStop(0.42, "#c9d3db");
    rg.addColorStop(0.82, "#67717c");
    rg.addColorStop(1, "#262d33");
    g.fillStyle = rg;
    g.beginPath();
    g.arc(x, y, rad, 0, TWO_PI);
    g.fill();
    g.strokeStyle = "rgba(14, 16, 20, 0.82)";
    g.lineWidth = Math.max(1, rad * 0.17);
    g.stroke();
  }
  for (let i = 0; i < AEGIS_RIVETS.length; i++) {
    const p = AEGIS_RIVETS[i];
    rivet(p.x * R, p.y * R, rivetRad);
  }

  /* ---- 5. Внешний контур силуэта ---- */
  g.strokeStyle = "rgba(16, 12, 8, 0.9)";
  g.lineWidth = Math.max(2.6, R * 0.022);
  pathAegis(g, R * 0.99);
  g.stroke();

  return c;
}
