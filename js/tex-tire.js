/* ШИНА — толстое автомобильное колесо сверху: широкая почти чёрная покрышка
   с протектором «ёлочкой», боковина с рёбрами и маркировкой и маленький
   стальной штампованный диск с окнами. Объём держат блики на шашках и
   светлый диск — серого «блина» больше нет, резина по-настоящему чёрная. */
function makeTireTex() {
  /* фото: толстое колесо сверху — кладём диском, как остальные круглые боссы */
  const photo = bossPhotoTex("tire");
  if (photo) return photo;
  const size = BOSS_TEX;
  const R = BOSS_TEX_R;
  const [c, g] = makeCanvas(size, size);
  g.translate(R, R);
  g.lineJoin = "round";
  g.lineCap = "round";
  g.beginPath();
  g.arc(0, 0, R - 0.5, 0, TWO_PI);
  g.clip();

  /* геометрия: покрышка толстая — протектор занимает почти половину
     радиуса, а стальной диск маленький */
  const treadIn = R * 0.56;
  const shoulder = R * 0.5;
  const wallIn = R * 0.315;
  const rimOut = R * 0.31;
  const rimIn = R * 0.255;
  const hub = rimOut * 0.32;

  /* резина: почти чёрная, свет только у верхней левой кромки */
  const rubber = g.createRadialGradient(-R * 0.46, -R * 0.54, R * 0.08, R * 0.26, R * 0.4, R * 1.06);
  rubber.addColorStop(0, "#2b2f33");
  rubber.addColorStop(0.34, "#191c1f");
  rubber.addColorStop(0.72, "#0e1013");
  rubber.addColorStop(1, "#050607");
  g.fillStyle = rubber;
  g.fillRect(-R, -R, size, size);

  const annulus = (r0, r1, fill) => {
    g.beginPath();
    g.arc(0, 0, r1, 0, TWO_PI);
    g.arc(0, 0, r0, 0, TWO_PI, true);
    g.fillStyle = fill;
    g.fill("evenodd");
  };

  /* протектор: чёрный, объём держат мягкие блики по шашкам */
  const tread = g.createRadialGradient(-R * 0.32, -R * 0.38, R * 0.16, R * 0.2, R * 0.34, R * 1.02);
  tread.addColorStop(0, "#282c31");
  tread.addColorStop(0.4, "#171b1e");
  tread.addColorStop(0.78, "#0e1114");
  tread.addColorStop(1, "#060809");
  annulus(treadIn, R - 0.5, tread);

  /* продольные канавки держат колесо на дороге */
  const channels = [0.635, 0.725, 0.815, 0.9];
  for (let i = 0; i < channels.length; i++) {
    const rc = R * channels[i];
    g.strokeStyle = "rgba(2, 3, 4, 0.9)";
    g.lineWidth = R * 0.026;
    g.beginPath();
    g.arc(0, 0, rc, 0, TWO_PI);
    g.stroke();
    g.strokeStyle = "rgba(172, 182, 192, 0.2)";
    g.lineWidth = R * 0.008;
    g.beginPath();
    g.arc(0, 0, rc + R * 0.018, 0, TWO_PI);
    g.stroke();
    g.strokeStyle = "rgba(2, 3, 4, 0.55)";
    g.lineWidth = R * 0.007;
    g.beginPath();
    g.arc(0, 0, rc - R * 0.02, 0, TWO_PI);
    g.stroke();
  }

  /* поперечные канавки: соседние наклонены в разные стороны — выходит ёлочка */
  const blockN = 22;
  const slot = TWO_PI / blockN;
  const groovePath = (a, lean, wid) => {
    const r0 = treadIn - R * 0.008;
    const steps = 6;
    g.beginPath();
    for (let k = 0; k <= steps; k++) {
      const u = k / steps;
      const rr = r0 + (R - r0) * u;
      const ac = a + lean * (u - 0.5) * 0.24;
      const hw = (R * wid) / rr;
      const px = Math.cos(ac - hw) * rr;
      const py = Math.sin(ac - hw) * rr;
      if (k === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    for (let k = steps; k >= 0; k--) {
      const u = k / steps;
      const rr = r0 + (R - r0) * u;
      const ac = a + lean * (u - 0.5) * 0.24;
      const hw = (R * wid) / rr;
      g.lineTo(Math.cos(ac + hw) * rr, Math.sin(ac + hw) * rr);
    }
    g.closePath();
  };
  for (let i = 0; i < blockN; i++) {
    const a = i * slot;
    const lean = i % 2 ? 1 : -1;
    const rm = (treadIn + R) * 0.5;
    const hwm = (R * 0.03) / rm;
    const grd = g.createLinearGradient(Math.cos(a - hwm) * rm, Math.sin(a - hwm) * rm, Math.cos(a + hwm) * rm, Math.sin(a + hwm) * rm);
    grd.addColorStop(0, "rgba(150, 160, 172, 0.18)");
    grd.addColorStop(0.12, "#060809");
    grd.addColorStop(0.5, "#010203");
    grd.addColorStop(0.84, "#0a0d10");
    grd.addColorStop(1, "rgba(110, 120, 132, 0.09)");
    groovePath(a, lean, 0.03);
    g.fillStyle = grd;
    g.fill();
    g.strokeStyle = "rgba(0, 0, 0, 0.75)";
    g.lineWidth = Math.max(1, R * 0.004);
    g.stroke();

    /* блик на шашке: чёрная резина ловит свет, но мягко */
    g.strokeStyle = "rgba(190, 200, 212, 0.09)";
    g.lineWidth = Math.max(1.4, R * 0.011);
    g.beginPath();
    g.arc(0, 0, R * 0.965, a + slot * 0.06, a + slot * 0.44);
    g.stroke();
    g.strokeStyle = "rgba(200, 210, 222, 0.05)";
    g.lineWidth = Math.max(1.2, R * 0.008);
    g.beginPath();
    g.arc(0, 0, R * 0.63, a + slot * 0.08, a + slot * 0.42);
    g.stroke();

    /* прорези в шашке — как у зимней резины */
    for (let s = 0; s < 3; s++) {
      const sa = a + slot * (0.34 + s * 0.19);
      const rr = R * (0.63 + s * 0.085);
      g.strokeStyle = "rgba(170, 180, 192, 0.08)";
      g.lineWidth = Math.max(1.2, R * 0.006);
      g.beginPath();
      g.arc(0, 0, rr, sa, sa + slot * 0.1);
      g.stroke();
      g.strokeStyle = "rgba(0, 0, 0, 0.6)";
      g.lineWidth = Math.max(1, R * 0.0035);
      g.beginPath();
      g.arc(0, 0, rr + R * 0.004, sa, sa + slot * 0.1);
      g.stroke();
    }
  }

  /* светотень по протектору: сверху слева свет, снизу справа тень */
  const treadLight = g.createLinearGradient(-R * 0.6, -R * 0.66, R * 0.5, R * 0.6);
  treadLight.addColorStop(0, "rgba(255,255,255,0.13)");
  treadLight.addColorStop(0.36, "rgba(255,255,255,0.02)");
  treadLight.addColorStop(0.7, "rgba(0,0,0,0.3)");
  treadLight.addColorStop(1, "rgba(0,0,0,0.46)");
  annulus(treadIn, R - 0.5, treadLight);

  /* поднутрение у плеча: шашки кажутся выше кромки */
  const treadDock = g.createRadialGradient(0, 0, treadIn, 0, 0, treadIn + R * 0.1);
  treadDock.addColorStop(0, "rgba(0, 0, 0, 0.7)");
  treadDock.addColorStop(0.55, "rgba(0, 0, 0, 0.26)");
  treadDock.addColorStop(1, "rgba(0, 0, 0, 0)");
  annulus(treadIn, treadIn + R * 0.1, treadDock);

  /* кромка протектора: блик сверху слева, тень снизу справа */
  g.strokeStyle = "rgba(216, 224, 234, 0.26)";
  g.lineWidth = R * 0.03;
  g.beginPath();
  g.arc(0, 0, R - 2, Math.PI * 1.12, Math.PI * 1.9);
  g.stroke();
  g.strokeStyle = "rgba(255, 255, 255, 0.14)";
  g.lineWidth = R * 0.008;
  g.beginPath();
  g.arc(0, 0, R - 2, Math.PI * 1.1, Math.PI * 1.88);
  g.stroke();
  g.strokeStyle = "rgba(0, 0, 0, 0.72)";
  g.lineWidth = R * 0.028;
  g.beginPath();
  g.arc(0, 0, R - 2, Math.PI * 0.12, Math.PI * 0.9);
  g.stroke();
  /* плечо: поднутрение под протектором и мелкие рёбра */
  const shoulderG = g.createRadialGradient(0, 0, shoulder, 0, 0, treadIn);
  shoulderG.addColorStop(0, "rgba(6, 8, 10, 0)");
  shoulderG.addColorStop(0.45, "rgba(4, 6, 8, 0.5)");
  shoulderG.addColorStop(1, "rgba(0, 0, 0, 0.86)");
  annulus(shoulder, treadIn, shoulderG);
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * TWO_PI + 0.03;
    g.strokeStyle = i % 2 ? "rgba(150, 158, 170, 0.06)" : "rgba(0, 0, 0, 0.4)";
    g.lineWidth = Math.max(1.2, R * 0.007);
    g.beginPath();
    g.moveTo(Math.cos(a) * (shoulder + R * 0.004), Math.sin(a) * (shoulder + R * 0.004));
    g.lineTo(Math.cos(a + 0.014) * (treadIn - R * 0.008), Math.sin(a + 0.014) * (treadIn - R * 0.008));
    g.stroke();
  }

  /* боковина: чёрная, выпуклая, с рёбрами жёсткости */
  const wall = g.createRadialGradient(-R * 0.36, -R * 0.44, R * 0.05, R * 0.12, R * 0.2, shoulder);
  wall.addColorStop(0, "#23262a");
  wall.addColorStop(0.38, "#15181b");
  wall.addColorStop(0.74, "#0c0e10");
  wall.addColorStop(1, "#070809");
  g.beginPath();
  g.arc(0, 0, shoulder, 0, TWO_PI);
  g.fillStyle = wall;
  g.fill();
  /* подкова-блик сверху слева: боковина выпуклая */
  const wallHi = g.createRadialGradient(-R * 0.28, -R * 0.34, R * 0.04, -R * 0.06, -R * 0.1, R * 0.56);
  wallHi.addColorStop(0, "rgba(255, 255, 255, 0.14)");
  wallHi.addColorStop(0.5, "rgba(255, 255, 255, 0.035)");
  wallHi.addColorStop(1, "rgba(255, 255, 255, 0)");
  g.fillStyle = wallHi;
  g.beginPath();
  g.arc(0, 0, shoulder, 0, TWO_PI);
  g.fill();
  /* мелкая фактура резины */
  for (let i = 0; i < 150; i++) {
    const a = hash(2200, i) * TWO_PI;
    const d0 = R * (0.32 + hash(2201, i) * 0.17);
    const d1 = d0 + R * (0.012 + hash(2202, i) * 0.04);
    g.strokeStyle = hash(2203, i) > 0.5 ? "rgba(0, 0, 0, 0.32)" : "rgba(160, 168, 178, 0.07)";
    g.lineWidth = Math.max(1, R * 0.004);
    g.beginPath();
    g.moveTo(Math.cos(a) * d0, Math.sin(a) * d0);
    g.lineTo(Math.cos(a + 0.04) * d1, Math.sin(a + 0.04) * d1);
    g.stroke();
  }
  const ribs = [0.345, 0.4, 0.455];
  for (let i = 0; i < ribs.length; i++) {
    const rr = R * ribs[i];
    g.strokeStyle = "rgba(0, 0, 0, 0.62)";
    g.lineWidth = Math.max(2, R * 0.011);
    g.beginPath();
    g.arc(0, 0, rr, 0, TWO_PI);
    g.stroke();
    g.strokeStyle = "rgba(176, 184, 194, 0.16)";
    g.lineWidth = Math.max(1.2, R * 0.006);
    g.beginPath();
    g.arc(0, 0, rr + R * 0.014, Math.PI * 0.92, Math.PI * 1.72);
    g.stroke();
  }
  arcRingText(g, "215/65 R16 98H", R * 0.42, -Math.PI / 2, R * 0.036, "rgba(198, 206, 216, 0.62)", "rgba(0, 0, 0, 0.78)");
  arcRingText(g, "RADIAL TUBELESS", R * 0.365, Math.PI / 2, R * 0.028, "rgba(170, 178, 188, 0.5)", "rgba(0, 0, 0, 0.72)");
  /* посадка на диск: тёмное кольцо борта */
  g.strokeStyle = "rgba(0, 0, 0, 0.88)";
  g.lineWidth = Math.max(2, R * 0.014);
  g.beginPath();
  g.arc(0, 0, wallIn, 0, TWO_PI);
  g.stroke();
  g.strokeStyle = "rgba(186, 194, 204, 0.2)";
  g.lineWidth = Math.max(1.2, R * 0.008);
  g.beginPath();
  g.arc(0, 0, wallIn + R * 0.014, Math.PI * 0.9, Math.PI * 1.7);
  g.stroke();

  /* диск: сталь, закраина, колодец — светлый на чёрной резине */
  const steel = g.createRadialGradient(-rimOut * 0.42, -rimOut * 0.48, rimOut * 0.06, rimOut * 0.12, rimOut * 0.16, rimOut);
  steel.addColorStop(0, "#fbfdff");
  steel.addColorStop(0.32, "#dee5ec");
  steel.addColorStop(0.68, "#a3acb7");
  steel.addColorStop(1, "#727a84");
  g.beginPath();
  g.arc(0, 0, rimOut, 0, TWO_PI);
  g.fillStyle = steel;
  g.fill();
  g.strokeStyle = "rgba(18, 22, 28, 0.72)";
  g.lineWidth = Math.max(2, R * 0.011);
  g.beginPath();
  g.arc(0, 0, rimOut - R * 0.005, 0, TWO_PI);
  g.stroke();
  const well = g.createRadialGradient(-rimIn * 0.32, -rimIn * 0.36, rimIn * 0.1, 0, 0, rimIn);
  well.addColorStop(0, "#5f6772");
  well.addColorStop(0.55, "#3d434b");
  well.addColorStop(1, "#20242a");
  g.beginPath();
  g.arc(0, 0, rimIn, 0, TWO_PI);
  g.fillStyle = well;
  g.fill();
  g.strokeStyle = "rgba(232, 238, 246, 0.46)";
  g.lineWidth = Math.max(1.6, R * 0.009);
  g.beginPath();
  g.arc(0, 0, rimIn, Math.PI * 1.1, Math.PI * 1.9);
  g.stroke();

  /* окна охлаждения */
  const holeR = rimOut * 0.19;
  const holeD = rimOut * 0.7;
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i / 5) * TWO_PI + 0.62;
    const hx = Math.cos(a) * holeD;
    const hy = Math.sin(a) * holeD;
    g.fillStyle = "#05070a";
    g.beginPath();
    g.arc(hx, hy, holeR * 1.06, 0, TWO_PI);
    g.fill();
    const hole = g.createRadialGradient(hx - holeR * 0.35, hy - holeR * 0.4, holeR * 0.08, hx, hy, holeR);
    hole.addColorStop(0, "#20252b");
    hole.addColorStop(1, "#040608");
    g.fillStyle = hole;
    g.beginPath();
    g.arc(hx, hy, holeR * 0.92, 0, TWO_PI);
    g.fill();
    g.strokeStyle = "rgba(240, 246, 252, 0.4)";
    g.lineWidth = Math.max(1.2, R * 0.007);
    g.beginPath();
    g.arc(hx, hy, holeR, Math.PI * 1.08, Math.PI * 1.92);
    g.stroke();
    g.strokeStyle = "rgba(6, 8, 11, 0.8)";
    g.lineWidth = Math.max(1.4, R * 0.009);
    g.beginPath();
    g.arc(hx, hy, holeR, Math.PI * 0.12, Math.PI * 0.88);
    g.stroke();
  }

  /* гайки крепления */
  const nutD = rimOut * 0.44;
  const nutR = rimOut * 0.13;
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i / 5) * TWO_PI;
    const nx = Math.cos(a) * nutD;
    const ny = Math.sin(a) * nutD;
    g.fillStyle = "rgba(10, 14, 18, 0.55)";
    g.beginPath();
    g.arc(nx, ny + nutR * 0.16, nutR * 1.08, 0, TWO_PI);
    g.fill();
    g.beginPath();
    for (let k = 0; k < 6; k++) {
      const ha = a + (k / 6) * TWO_PI;
      const px = nx + Math.cos(ha) * nutR;
      const py = ny + Math.sin(ha) * nutR;
      if (k === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.closePath();
    const nut = g.createRadialGradient(nx - nutR * 0.42, ny - nutR * 0.46, nutR * 0.08, nx, ny, nutR);
    nut.addColorStop(0, "#ffffff");
    nut.addColorStop(0.4, "#dde3ea");
    nut.addColorStop(0.78, "#a7b0bb");
    nut.addColorStop(1, "#767f89");
    g.fillStyle = nut;
    g.fill();
    g.strokeStyle = "rgba(38, 46, 56, 0.72)";
    g.lineWidth = Math.max(1.2, R * 0.007);
    g.stroke();
    g.fillStyle = "rgba(44, 52, 62, 0.45)";
    g.beginPath();
    g.arc(nx, ny, nutR * 0.32, 0, TWO_PI);
    g.fill();
  }

  /* ступица: штампованный колпак */
  const cap = g.createRadialGradient(-hub * 0.4, -hub * 0.46, hub * 0.1, hub * 0.1, hub * 0.14, hub);
  cap.addColorStop(0, "#ffffff");
  cap.addColorStop(0.36, "#e7ecf2");
  cap.addColorStop(0.72, "#b2bbc5");
  cap.addColorStop(1, "#7e8792");
  g.beginPath();
  g.arc(0, 0, hub, 0, TWO_PI);
  g.fillStyle = cap;
  g.fill();
  g.strokeStyle = "rgba(40, 48, 58, 0.6)";
  g.lineWidth = Math.max(1.6, R * 0.009);
  g.stroke();
  g.strokeStyle = "rgba(255, 255, 255, 0.42)";
  g.lineWidth = Math.max(1.2, R * 0.006);
  g.beginPath();
  g.arc(0, 0, hub * 0.78, Math.PI * 0.92, Math.PI * 1.82);
  g.stroke();
  g.strokeStyle = "rgba(96, 106, 118, 0.55)";
  g.lineWidth = Math.max(1.2, R * 0.007);
  g.beginPath();
  g.arc(0, 0, hub * 0.5, 0, TWO_PI);
  g.stroke();
  g.fillStyle = "rgba(104, 114, 126, 0.7)";
  g.beginPath();
  g.arc(0, 0, hub * 0.16, 0, TWO_PI);
  g.fill();

  /* сосок с колпачком */
  g.save();
  g.rotate(-Math.PI / 2 + 2.05);
  g.translate(rimOut + R * 0.03, 0);
  g.fillStyle = "#0a0c0f";
  g.beginPath();
  g.ellipse(0, 0, R * 0.036, R * 0.022, 0, 0, TWO_PI);
  g.fill();
  const valve = g.createRadialGradient(-R * 0.008, -R * 0.008, R * 0.002, 0, 0, R * 0.02);
  valve.addColorStop(0, "#ff6a6a");
  valve.addColorStop(0.6, "#c4122c");
  valve.addColorStop(1, "#7c0618");
  g.fillStyle = valve;
  g.beginPath();
  g.arc(R * 0.026, 0, R * 0.02, 0, TWO_PI);
  g.fill();
  g.strokeStyle = "rgba(30, 6, 10, 0.6)";
  g.lineWidth = Math.max(1, R * 0.004);
  g.stroke();
  g.restore();

  /* пыль и потёртости: на чёрном читается пыль, а не серые пятна */
  for (let i = 0; i < 90; i++) {
    const a = hash(2300, i) * TWO_PI;
    const d = R * (0.34 + hash(2301, i) * 0.64);
    const light = hash(2302, i) > 0.5;
    g.fillStyle = light ? "rgba(214, 220, 228, " + (0.03 + hash(2303, i) * 0.07).toFixed(2) + ")" : "rgba(0, 0, 0, " + (0.14 + hash(2304, i) * 0.2).toFixed(2) + ")";
    g.beginPath();
    g.ellipse(Math.cos(a) * d, Math.sin(a) * d, R * (0.012 + hash(2305, i) * 0.03), R * (0.005 + hash(2306, i) * 0.01), a, 0, TWO_PI);
    g.fill();
  }

  /* общий глянец и тонкая кромка */
  const gloss = g.createLinearGradient(-R * 0.75, -R * 0.7, R * 0.5, R * 0.75);
  gloss.addColorStop(0, "rgba(255,255,255,0)");
  gloss.addColorStop(0.2, "rgba(255,255,255,0.12)");
  gloss.addColorStop(0.34, "rgba(255,255,255,0.015)");
  gloss.addColorStop(0.6, "rgba(255,255,255,0.05)");
  gloss.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gloss;
  g.fillRect(-R, -R, size, size);
  g.strokeStyle = "#040506";
  g.lineWidth = Math.max(3, R * 0.022);
  g.beginPath();
  g.arc(0, 0, R - g.lineWidth * 0.3, 0, TWO_PI);
  g.stroke();
  return c;
}
