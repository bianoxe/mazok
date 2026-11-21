/* ЯБЛОЧНЫЙ ПИРОГ — сверху: выпуклый купол начинки, плетёная решётка с тенями,
   пышный волнистый бортик с румяной корочкой. */
function makePieTex() {
  /* фото: пирог сверху — силуэтом, чтобы не срезать волнистый бортик */
  const photo = bossPhotoTex("pie");
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

  /* геометрия: бортик доходит до 2/3 радиуса — пирог толстый и пышный */
  const crustIn = R * 0.7;
  const weave = R * 0.668;
  const bandOut = R - 1;

  /* начинка: купол, свет сверху слева */
  const fill = g.createRadialGradient(-R * 0.16, -R * 0.2, R * 0.04, R * 0.1, R * 0.14, crustIn * 1.04);
  fill.addColorStop(0, "#dfa544");
  fill.addColorStop(0.3, "#b9741c");
  fill.addColorStop(0.62, "#8d4c0c");
  fill.addColorStop(0.85, "#683306");
  fill.addColorStop(1, "#452004");
  g.beginPath();
  g.arc(0, 0, crustIn, 0, TWO_PI);
  g.fillStyle = fill;
  g.fill();

  /* мягкие бугры начинки: тесто поднялось и начинка пузырится */
  for (let i = 0; i < 8; i++) {
    const a = hash(3300, i) * TWO_PI;
    const d = crustIn * (0.16 + hash(3301, i) * 0.54);
    const mx = Math.cos(a) * d;
    const my = Math.sin(a) * d;
    const mr = crustIn * (0.2 + hash(3302, i) * 0.2);
    const mound = g.createRadialGradient(mx - mr * 0.3, my - mr * 0.34, mr * 0.08, mx, my, mr);
    mound.addColorStop(0, "rgba(255, 216, 146, 0.3)");
    mound.addColorStop(0.58, "rgba(210, 144, 50, 0.13)");
    mound.addColorStop(1, "rgba(118, 58, 10, 0)");
    g.fillStyle = mound;
    g.beginPath();
    g.ellipse(mx, my, mr, mr * 0.86, a, 0, TWO_PI);
    g.fill();
  }

  /* горячая начинка: глянцевые пузыри с бликами */
  for (let i = 0; i < 24; i++) {
    const a = hash(3310, i) * TWO_PI;
    const d = crustIn * (0.08 + hash(3311, i) * 0.86);
    const bx = Math.cos(a) * d;
    const by = Math.sin(a) * d;
    const br = R * (0.028 + hash(3312, i) * 0.052);
    const jam = g.createRadialGradient(bx - br * 0.3, by - br * 0.36, br * 0.08, bx, by, br);
    jam.addColorStop(0, "rgba(255, 220, 146, 0.5)");
    jam.addColorStop(0.5, "rgba(200, 124, 30, 0.34)");
    jam.addColorStop(1, "rgba(110, 50, 8, 0.24)");
    g.fillStyle = jam;
    g.beginPath();
    g.ellipse(bx, by, br, br * 0.9, a, 0, TWO_PI);
    g.fill();
    g.strokeStyle = "rgba(88, 42, 6, 0.28)";
    g.lineWidth = Math.max(1, R * 0.004);
    g.stroke();
    if (hash(3313, i) > 0.42) {
      g.fillStyle = "rgba(255, 250, 226, 0.6)";
      g.beginPath();
      g.ellipse(bx - br * 0.3, by - br * 0.34, br * 0.24, br * 0.15, a, 0, TWO_PI);
      g.fill();
    }
  }

  /* поры и запечённые точки начинки */
  for (let i = 0; i < 130; i++) {
    const a = hash(3320, i) * TWO_PI;
    const d = crustIn * (0.04 + hash(3321, i) * 0.92);
    g.fillStyle = hash(3322, i) > 0.4 ? "rgba(255, 228, 172, 0.1)" : "rgba(74, 34, 6, 0.2)";
    g.beginPath();
    g.arc(Math.cos(a) * d, Math.sin(a) * d, R * (0.0035 + hash(3323, i) * 0.009), 0, TWO_PI);
    g.fill();
  }

  /* бортик нависает над начинкой — мягкая тень по кругу */
  const innerShade = g.createRadialGradient(0, 0, crustIn * 0.7, 0, 0, crustIn);
  innerShade.addColorStop(0, "rgba(70, 30, 4, 0)");
  innerShade.addColorStop(0.7, "rgba(64, 28, 4, 0.26)");
  innerShade.addColorStop(1, "rgba(42, 16, 2, 0.72)");
  g.fillStyle = innerShade;
  g.beginPath();
  g.arc(0, 0, crustIn, 0, TWO_PI);
  g.fill();
  /* решётка: полоски теста лежат поверх купола, мягко провисают и переплетаются */
  const nBands = 5;
  const pitch = R * 0.295;
  const sw = R * 0.136;
  const half = sw * 0.5;
  const span = R * 1.12;
  const sag = sw * 0.11;
  const at = (k) => (k - (nBands - 1) / 2) * pitch;
  const wAt = (x) => half * (1 - 0.09 * (x / span) * (x / span) + 0.05 * Math.sin(x * 0.117) + 0.03 * Math.sin(x * 0.041));
  const cAt = (off, x) => off + Math.sin((TWO_PI * x) / pitch) * sag;

  const bandPathTo = (off, vert, x0, x1) => {
    const steps = 26;
    g.beginPath();
    for (let i = 0; i <= steps; i++) {
      const x = x0 + ((x1 - x0) * i) / steps;
      const c0 = cAt(off, x);
      const w = wAt(x);
      if (vert) {
        if (i === 0) g.moveTo(c0 - w, x);
        else g.lineTo(c0 - w, x);
      } else if (i === 0) g.moveTo(x, c0 - w);
      else g.lineTo(x, c0 - w);
    }
    for (let i = steps; i >= 0; i--) {
      const x = x0 + ((x1 - x0) * i) / steps;
      const c0 = cAt(off, x);
      const w = wAt(x);
      if (vert) g.lineTo(c0 + w, x);
      else g.lineTo(x, c0 + w);
    }
    g.closePath();
  };

  const bandFill = (off, vert, baked) => {
    const gx = vert ? off - half : 0;
    const gy = vert ? 0 : off - half;
    const grd = vert
      ? g.createLinearGradient(gx, gy, off + half, 0)
      : g.createLinearGradient(0, gy, 0, off + half);
    grd.addColorStop(0, "rgba(84, 46, 10, 0.94)");
    grd.addColorStop(0.16, baked ? "#9c6a22" : "#ad7a2c");
    grd.addColorStop(0.38, baked ? "#d3a55c" : "#eccb8c");
    grd.addColorStop(0.56, baked ? "#c7964a" : "#dcae5c");
    grd.addColorStop(0.84, "#96601f");
    grd.addColorStop(1, "rgba(78, 40, 8, 0.94)");
    return grd;
  };

  const latticeBand = (off, vert, x0, x1, baked) => {
    bandPathTo(off, vert, x0, x1);
    g.fillStyle = bandFill(off, vert, baked);
    g.fill();
    g.strokeStyle = "rgba(108, 64, 18, 0.5)";
    g.lineWidth = Math.max(1, R * 0.005);
    g.stroke();
    /* светлый гребень по середине полоски */
    g.beginPath();
    const steps = 26;
    for (let i = 0; i <= steps; i++) {
      const x = x0 + ((x1 - x0) * i) / steps;
      const c0 = cAt(off, x) - wAt(x) * 0.3;
      if (vert) {
        if (i === 0) g.moveTo(c0, x);
        else g.lineTo(c0, x);
      } else if (i === 0) g.moveTo(x, c0);
      else g.lineTo(x, c0);
    }
    g.strokeStyle = baked ? "rgba(255, 240, 200, 0.16)" : "rgba(255, 244, 208, 0.2)";
    g.lineWidth = Math.max(1, R * 0.014);
    g.stroke();
  };

  const latticeShadow = (off, vert, x0, x1, dx, dy) => {
    g.save();
    g.translate(dx, dy);
    bandPathTo(off, vert, x0, x1);
    g.fillStyle = "rgba(64, 28, 4, 0.2)";
    g.fill();
    g.restore();
    g.save();
    g.translate(dx * 1.9, dy * 1.9);
    bandPathTo(off, vert, x0, x1);
    g.fillStyle = "rgba(58, 24, 2, 0.14)";
    g.fill();
    g.restore();
  };

  g.save();
  g.beginPath();
  g.arc(0, 0, weave, 0, TWO_PI);
  g.clip();
  for (let i = 0; i < nBands; i++) latticeShadow(at(i), false, -span, span, 2.2, 3.4);
  for (let i = 0; i < nBands; i++) latticeBand(at(i), false, -span, span, i % 3 === 1);
  for (let j = 0; j < nBands; j++) latticeShadow(at(j), true, -span, span, 2.2, 3.4);
  for (let j = 0; j < nBands; j++) latticeBand(at(j), true, -span, span, j % 2 === 0);
  /* переплетение: попеременно полоска проходит то сверху, то снизу */
  for (let i = 0; i < nBands; i++) {
    for (let j = 0; j < nBands; j++) {
      if ((i + j) % 2) continue;
      const xc = at(j);
      latticeShadow(at(i), false, xc - half * 1.5, xc + half * 1.5, 2.4, 3.6);
      latticeBand(at(i), false, xc - half * 1.35, xc + half * 1.35, false);
    }
  }
  g.restore();
  /* матовая присыпка мукой по решётке */
  g.save();
  g.beginPath();
  g.arc(0, 0, weave, 0, TWO_PI);
  g.clip();
  for (let i = 0; i < 220; i++) {
    const a = hash(3440, i) * TWO_PI;
    const d = weave * Math.sqrt(hash(3441, i));
    g.fillStyle = hash(3442, i) > 0.44 ? "rgba(255, 244, 214, 0.16)" : "rgba(96, 52, 12, 0.2)";
    g.beginPath();
    g.arc(Math.cos(a) * d, Math.sin(a) * d, R * (0.0035 + hash(3443, i) * 0.008), 0, TWO_PI);
    g.fill();
  }
  g.restore();
  /* бортик: пышный вал с волнистыми ложбинками и румяным гребнем */
  const crust = g.createRadialGradient(-R * 0.32, -R * 0.38, R * 0.05, R * 0.1, R * 0.12, R);
  crust.addColorStop(0, "#f0d192");
  crust.addColorStop(0.36, "#d5a154");
  crust.addColorStop(0.68, "#ab7328");
  crust.addColorStop(0.88, "#8a5616");
  crust.addColorStop(1, "#5c390e");
  g.beginPath();
  g.arc(0, 0, bandOut, 0, TWO_PI);
  g.arc(0, 0, crustIn, 0, TWO_PI, true);
  g.fillStyle = crust;
  g.fill("evenodd");

  const flutes = 26;
  const slot = TWO_PI / flutes;
  const lightA = Math.PI * 1.25;
  const crimpIn = crustIn + (bandOut - crustIn) * 0.42;
  for (let i = 0; i < flutes; i++) {
    const a = i * slot;
    const mid = a + slot * 0.5;
    const wob = (hash(3400, i) - 0.5) * R * 0.016;
    const mr = (crustIn + bandOut) * 0.5 + wob;
    const px = Math.cos(mid) * mr;
    const py = Math.sin(mid) * mr;
    const pr = slot * mr * 1.2;
    const lit = 0.42 + 0.58 * Math.cos(mid - lightA);
    /* ложбинка защипа: узкая у гребня, широкая у кромки */
    const groove = g.createRadialGradient(0, 0, crimpIn, 0, 0, bandOut);
    groove.addColorStop(0, "rgba(48, 22, 2, 0)");
    groove.addColorStop(0.6, "rgba(40, 18, 2, 0.46)");
    groove.addColorStop(1, "rgba(26, 10, 0, 0.8)");
    g.beginPath();
    g.arc(0, 0, bandOut + 1, a - slot * 0.086, a + slot * 0.086);
    g.arc(0, 0, crimpIn, a + slot * 0.028, a - slot * 0.028, true);
    g.closePath();
    g.fillStyle = groove;
    g.fill();
    /* выпуклый жгут теста: тень снизу, блик сверху */
    const fold = g.createRadialGradient(px + pr * 0.1, py + pr * 0.36, pr * 0.1, px, py, pr);
    fold.addColorStop(0, "rgba(52, 24, 4, 0.34)");
    fold.addColorStop(1, "rgba(52, 24, 4, 0)");
    g.fillStyle = fold;
    g.beginPath();
    g.ellipse(px + pr * 0.08, py + pr * 0.3, pr * 1.28, pr * 0.62, mid + Math.PI / 2, 0, TWO_PI);
    g.fill();
    const puff = g.createRadialGradient(px - pr * 0.16, py - pr * 0.3, R * 0.008, px, py, pr);
    puff.addColorStop(0, "rgba(255, 238, 190, " + (0.12 + 0.3 * lit).toFixed(2) + ")");
    puff.addColorStop(0.5, "rgba(255, 230, 176, " + (0.12 * lit).toFixed(2) + ")");
    puff.addColorStop(1, "rgba(255, 226, 168, 0)");
    g.fillStyle = puff;
    g.beginPath();
    g.ellipse(px, py, pr * 1.22, pr * 0.66, mid + Math.PI / 2, 0, TWO_PI);
    g.fill();
  }

  /* румяные пятна и присыпка на корочке */
  for (let i = 0; i < 28; i++) {
    const a = hash(3410, i) * TWO_PI;
    const d = R * (0.7 + hash(3411, i) * 0.26);
    const bx = Math.cos(a) * d;
    const by = Math.sin(a) * d;
    const br = R * (0.024 + hash(3412, i) * 0.055);
    const blot = g.createRadialGradient(bx, by, br * 0.12, bx, by, br);
    blot.addColorStop(0, "rgba(122, 66, 16, 0.38)");
    blot.addColorStop(1, "rgba(122, 66, 16, 0)");
    g.fillStyle = blot;
    g.beginPath();
    g.ellipse(bx, by, br, br * 0.82, a, 0, TWO_PI);
    g.fill();
  }
  for (let i = 0; i < 90; i++) {
    const a = hash(3420, i) * TWO_PI;
    const d = R * (0.68 + hash(3421, i) * 0.3);
    g.fillStyle = "rgba(255, 252, 240, " + (0.2 + hash(3422, i) * 0.5).toFixed(2) + ")";
    g.beginPath();
    g.arc(Math.cos(a) * d, Math.sin(a) * d, R * (0.003 + hash(3423, i) * 0.007), 0, TWO_PI);
    g.fill();
  }

  /* кромки бортика: наружная подвёрнута вниз, внутренняя нависает над начинкой */
  g.strokeStyle = "rgba(48, 22, 4, 0.5)";
  g.lineWidth = Math.max(3, R * 0.024);
  g.beginPath();
  g.arc(0, 0, bandOut - R * 0.012, 0, TWO_PI);
  g.stroke();
  g.strokeStyle = "rgba(255, 240, 196, 0.3)";
  g.lineWidth = Math.max(1.6, R * 0.009);
  g.beginPath();
  g.arc(0, 0, R * 0.9, Math.PI * 1.02, Math.PI * 1.72);
  g.stroke();
  g.strokeStyle = "rgba(255, 244, 210, 0.18)";
  g.lineWidth = Math.max(3, R * 0.03);
  g.beginPath();
  g.arc(0, 0, R * 0.905, Math.PI * 1.05, Math.PI * 1.66);
  g.stroke();
  g.strokeStyle = "rgba(40, 16, 2, 0.22)";
  g.lineWidth = Math.max(3, R * 0.032);
  g.beginPath();
  g.arc(0, 0, R * 0.9, Math.PI * 0.12, Math.PI * 0.86);
  g.stroke();
  g.strokeStyle = "rgba(70, 34, 6, 0.55)";
  g.lineWidth = Math.max(2, R * 0.012);
  g.beginPath();
  g.arc(0, 0, crustIn + R * 0.006, 0, TWO_PI);
  g.stroke();
  g.strokeStyle = "rgba(255, 238, 194, 0.28)";
  g.lineWidth = Math.max(1.4, R * 0.007);
  g.beginPath();
  g.arc(0, 0, crustIn - R * 0.016, 0, TWO_PI);
  g.stroke();

  /* яичная смазка и круговое затемнение */
  const sheen = g.createLinearGradient(-R * 0.8, -R * 0.8, R * 0.3, R * 0.6);
  sheen.addColorStop(0, "rgba(255, 246, 218, 0.18)");
  sheen.addColorStop(0.4, "rgba(255, 242, 210, 0.05)");
  sheen.addColorStop(1, "rgba(255, 238, 204, 0)");
  g.fillStyle = sheen;
  g.fillRect(-R, -R, size, size);
  const vign = g.createRadialGradient(0, 0, R * 0.58, 0, 0, R);
  vign.addColorStop(0, "rgba(60, 26, 4, 0)");
  vign.addColorStop(1, "rgba(44, 18, 2, 0.32)");
  g.fillStyle = vign;
  g.beginPath();
  g.arc(0, 0, R, 0, TWO_PI);
  g.fill();
  g.strokeStyle = "#5c3a13";
  g.lineWidth = Math.max(3, R * 0.02);
  g.beginPath();
  g.arc(0, 0, R - g.lineWidth * 0.3, 0, TWO_PI);
  g.stroke();
  return c;
}
