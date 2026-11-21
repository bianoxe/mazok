function makeHelmTex() {
  const size = BOSS_TEX, cx = BOSS_TEX_R;
  const R = BOSS_TEX_R;
  const rim = R * HELM_RIM;
  const rimIn = R * 0.575;
  const pegW = R * HELM_PEG_W;
  const [c, g] = makeCanvas(size, size);
  const img = bossImages.helm;
  if (img) {
    paintBossPhotoDisc(g, img, size, R - 0.5);
    return c;
  }
  g.translate(cx, cx);
  const slot = TWO_PI / HELM_N;

  const spokePath = (y0, y1, x0, x1) => {
    g.beginPath();
    g.moveTo(x0, -y0);
    g.lineTo(x1, -y1);
    g.quadraticCurveTo(x1 + y1 * 0.35, 0, x1, y1);
    g.lineTo(x0, y0);
    g.quadraticCurveTo(x0 - y0 * 0.2, 0, x0, -y0);
    g.closePath();
  };

  for (let i = 0; i < HELM_N; i++) {
    g.save();
    g.rotate(i * slot);
    const y0 = R * 0.084;
    const y1 = R * 0.046;
    const x0 = R * 0.055;
    const x1 = rim - R * 0.012;
    const face = 0.35 + 0.65 * (0.5 + 0.5 * Math.cos(i * slot - 0.9));
    const grd = g.createLinearGradient(0, -y0, 0, y0);
    grd.addColorStop(0, face > 0.62 ? "#6a4120" : "#4a2c14");
    grd.addColorStop(0.22, face > 0.45 ? "#efd7ae" : "#d7b888");
    grd.addColorStop(0.5, face > 0.5 ? "#c49258" : "#a87440");
    grd.addColorStop(0.78, "#7a4e28");
    grd.addColorStop(1, "#3c2410");
    g.fillStyle = grd;
    spokePath(y0, y1, x0, x1);
    g.fill();
    g.save();
    spokePath(y0, y1, x0, x1);
    g.clip();
    g.strokeStyle = "rgba(58, 32, 14, 0.55)";
    g.lineWidth = 1.8;
    for (let k = -1; k <= 1; k++) {
      if (k === 0) continue;
      const yy = k * y0 * 0.42;
      g.beginPath();
      g.moveTo(x0 + 10, yy);
      g.lineTo(x1 - 8, yy * (y1 / y0));
      g.stroke();
    }
    g.strokeStyle = "rgba(240, 220, 180, 0.62)";
    g.lineWidth = 2.4;
    for (let k = 0; k < 5; k++) {
      const xx = x0 + 16 + k * (x1 - x0 - 28) / 4;
      const flick = (hash(i + 3, k + 1) - 0.5) * y1 * 0.5;
      g.beginPath();
      g.moveTo(xx, flick - y1 * 0.08);
      g.lineTo(xx + 9, flick + y1 * 0.42);
      g.stroke();
    }
    g.fillStyle = "rgba(62, 36, 16, 0.4)";
    for (let k = 0; k < 7; k++) {
      const xx = x0 + 18 + hash(i + 9, k) * (x1 - x0 - 36);
      const yy = (hash(i + 11, k) - 0.5) * y1 * 1.1;
      g.beginPath();
      g.ellipse(xx, yy, 2.4 + hash(i, k) * 2.2, 1.15, 0.15, 0, TWO_PI);
      g.fill();
    }
    g.restore();
    g.strokeStyle = "rgba(42, 24, 10, 0.85)";
    g.lineWidth = 2.2;
    spokePath(y0, y1, x0, x1);
    g.stroke();
    g.restore();
  }

  g.beginPath();
  g.arc(0, 0, rim, 0, TWO_PI);
  g.arc(0, 0, rimIn, 0, TWO_PI, true);
  g.fillStyle = "#a87440";
  g.fill("evenodd");

  g.save();
  g.beginPath();
  g.arc(0, 0, rim, 0, TWO_PI);
  g.arc(0, 0, rimIn, 0, TWO_PI, true);
  g.clip("evenodd");
  const bands = 11;
  for (let i = 0; i < bands; i++) {
    const t = i / (bands - 1);
    const rad = rimIn + 3 + (rim - rimIn - 6) * t;
    const pore = i % 3 === 1;
    g.strokeStyle = pore ? "rgba(58, 32, 14, 0.42)" : "rgba(236, 214, 168, 0.3)";
    g.lineWidth = pore ? 3.1 : 2;
    g.beginPath();
    g.arc(0, 0, rad, 0, TWO_PI);
    g.stroke();
  }
  g.strokeStyle = "rgba(244, 226, 186, 0.7)";
  g.lineWidth = 2.6;
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * TWO_PI + hash(4, i) * 0.04;
    const r0 = rimIn + 8 + hash(5, i) * (rim - rimIn - 20);
    const r1 = Math.min(rim - 5, r0 + 7 + hash(6, i) * 8);
    g.beginPath();
    g.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
    g.lineTo(Math.cos(a + 0.01) * r1, Math.sin(a + 0.01) * r1);
    g.stroke();
  }
  g.fillStyle = "rgba(48, 26, 12, 0.38)";
  for (let i = 0; i < 64; i++) {
    const a = hash(12, i) * TWO_PI;
    const rad = rimIn + 7 + hash(13, i) * (rim - rimIn - 14);
    g.beginPath();
    g.ellipse(Math.cos(a) * rad, Math.sin(a) * rad, 2.2 + hash(14, i) * 2.4, 1.15, a + Math.PI / 2, 0, TWO_PI);
    g.fill();
  }
  const knotA = 0.55;
  const knotR = (rim + rimIn) * 0.5;
  const kx = Math.cos(knotA) * knotR;
  const ky = Math.sin(knotA) * knotR;
  const knot = g.createRadialGradient(kx, ky, 1, kx, ky, R * 0.034);
  knot.addColorStop(0, "#4a2c14");
  knot.addColorStop(0.45, "#8a5a30");
  knot.addColorStop(1, "rgba(168, 116, 64, 0)");
  g.fillStyle = knot;
  g.beginPath();
  g.arc(kx, ky, R * 0.034, 0, TWO_PI);
  g.fill();
  g.strokeStyle = "rgba(255, 232, 196, 0.28)";
  g.lineWidth = (rim - rimIn) * 0.42;
  g.beginPath();
  g.arc(0, 0, (rim + rimIn) * 0.5, Math.PI * 1.08, Math.PI * 1.72);
  g.stroke();
  g.strokeStyle = "rgba(36, 18, 8, 0.28)";
  g.beginPath();
  g.arc(0, 0, (rim + rimIn) * 0.5, 0.15, Math.PI * 0.92);
  g.stroke();
  g.restore();

  g.lineCap = "butt";
  for (let i = 0; i < HELM_N; i++) {
    const a = (i + 0.5) * slot;
    g.strokeStyle = "rgba(36, 20, 8, 0.8)";
    g.lineWidth = 3.2;
    g.beginPath();
    g.moveTo(Math.cos(a) * (rimIn + 3), Math.sin(a) * (rimIn + 3));
    g.lineTo(Math.cos(a) * (rim - 3), Math.sin(a) * (rim - 3));
    g.stroke();
    g.strokeStyle = "rgba(236, 214, 170, 0.35)";
    g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(Math.cos(a + 0.012) * (rimIn + 5), Math.sin(a + 0.012) * (rimIn + 5));
    g.lineTo(Math.cos(a + 0.012) * (rim - 5), Math.sin(a + 0.012) * (rim - 5));
    g.stroke();
  }

  g.strokeStyle = "rgba(32, 16, 8, 0.75)";
  g.lineWidth = 4;
  g.beginPath();
  g.arc(0, 0, rim - 1.4, 0, TWO_PI);
  g.stroke();
  g.strokeStyle = "rgba(255, 236, 206, 0.55)";
  g.lineWidth = 3;
  g.beginPath();
  g.arc(0, 0, rim - 5.5, Math.PI * 1.02, Math.PI * 1.78);
  g.stroke();
  g.strokeStyle = "rgba(32, 16, 8, 0.65)";
  g.lineWidth = 3.4;
  g.beginPath();
  g.arc(0, 0, rimIn + 1.6, 0, TWO_PI);
  g.stroke();
  g.strokeStyle = "rgba(236, 214, 170, 0.4)";
  g.lineWidth = 2.4;
  g.beginPath();
  g.arc(0, 0, rimIn + 5, 0.25, Math.PI * 0.85);
  g.stroke();

  const groove = (rim + rimIn) * 0.5;
  g.strokeStyle = "rgba(54, 30, 14, 0.55)";
  g.lineWidth = 2.2;
  g.beginPath();
  g.arc(0, 0, groove - R * 0.02, 0, TWO_PI);
  g.stroke();
  g.beginPath();
  g.arc(0, 0, groove + R * 0.02, 0, TWO_PI);
  g.stroke();

  for (let i = 0; i < HELM_N; i++) {
    g.save();
    g.rotate(i * slot);
    const grd = g.createLinearGradient(0, -pegW, 0, pegW);
    grd.addColorStop(0, "#7a4e28");
    grd.addColorStop(0.16, "#f0d8b0");
    grd.addColorStop(0.42, "#c99558");
    grd.addColorStop(0.78, "#a06e3c");
    grd.addColorStop(1, "#6a4324");
    g.fillStyle = grd;
    g.beginPath();
    const half = 0.115;
    const steps = 36;
    for (let s = 0; s <= steps; s++) {
      const a = -half + (2 * half) * (s / steps);
      const rad = R * helmShapeMul(a);
      const x = Math.cos(a) * rad;
      const y = Math.sin(a) * rad;
      if (s === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.closePath();
    g.fill();
    g.save();
    g.clip();
    const capC = R * (HELM_TIP - HELM_PEG_W);
    g.strokeStyle = "rgba(54, 30, 12, 0.55)";
    g.lineWidth = 2.3;
    const rings = [0.28, 0.46, 0.66];
    for (let k = 0; k < rings.length; k++) {
      const x = rim + (capC - rim) * rings[k];
      g.beginPath();
      g.moveTo(x, -pegW);
      g.lineTo(x, pegW);
      g.stroke();
    }
    g.strokeStyle = "rgba(255, 240, 214, 0.55)";
    g.lineWidth = 2.2;
    g.beginPath();
    g.moveTo(rim + 4, -pegW * 0.38);
    g.lineTo(capC - 2, -pegW * 0.34);
    g.stroke();
    g.strokeStyle = "rgba(74, 44, 18, 0.4)";
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(rim + 6, pegW * 0.22);
    g.lineTo(capC - 4, pegW * 0.28);
    g.stroke();
    const capG = g.createRadialGradient(capC - pegW * 0.32, -pegW * 0.34, 1.5, capC, 0, pegW * 0.96);
    capG.addColorStop(0, "rgba(255, 246, 224, 0.92)");
    capG.addColorStop(0.42, "rgba(214, 164, 102, 0.18)");
    capG.addColorStop(1, "rgba(48, 26, 12, 0.42)");
    g.fillStyle = capG;
    g.beginPath();
    g.arc(capC, 0, pegW * 0.98, -Math.PI * 0.55, Math.PI * 0.72);
    g.fill();
    g.restore();
    const ferG = g.createLinearGradient(0, -pegW, 0, pegW);
    ferG.addColorStop(0, "#5c4818");
    ferG.addColorStop(0.32, "#f3e2a6");
    ferG.addColorStop(0.68, "#b89040");
    ferG.addColorStop(1, "#4a3814");
    g.fillStyle = ferG;
    g.beginPath();
    const ferW = R * 0.02;
    const ferH = pegW * 1.28;
    if (g.roundRect) g.roundRect(rim - ferW * 0.35, -ferH * 0.5, ferW, ferH, 2.5);
    else g.rect(rim - ferW * 0.35, -ferH * 0.5, ferW, ferH);
    g.fill();
    g.strokeStyle = "#3a2c10";
    g.lineWidth = 1.4;
    g.stroke();
    g.restore();
  }

  const band = (rim + rimIn) * 0.5;
  for (let i = 0; i < HELM_N; i++) {
    const a = i * slot;
    const x = Math.cos(a) * band;
    const y = Math.sin(a) * band;
    g.fillStyle = "#3a2412";
    g.beginPath();
    g.arc(x, y, R * 0.02, 0, TWO_PI);
    g.fill();
    g.strokeStyle = "#2a180c";
    g.lineWidth = 1.5;
    g.stroke();
    g.fillStyle = "rgba(240, 220, 176, 0.55)";
    g.beginPath();
    g.arc(x - 1.4, y - 1.5, R * 0.007, 0, TWO_PI);
    g.fill();
  }

  const nave = R * 0.168;
  const naveG = g.createRadialGradient(-nave * 0.32, -nave * 0.38, nave * 0.08, nave * 0.05, nave * 0.08, nave);
  naveG.addColorStop(0, "#efd7ae");
  naveG.addColorStop(0.5, "#b6834a");
  naveG.addColorStop(1, "#5c3818");
  g.fillStyle = naveG;
  g.beginPath();
  g.arc(0, 0, nave, 0, TWO_PI);
  g.fill();
  g.strokeStyle = "#3a2412";
  g.lineWidth = 3.2;
  g.stroke();
  g.strokeStyle = "rgba(255, 236, 206, 0.4)";
  g.lineWidth = 2.2;
  g.beginPath();
  g.arc(-nave * 0.08, -nave * 0.1, nave * 0.62, Math.PI * 1.15, Math.PI * 1.85);
  g.stroke();

  for (let i = 0; i < HELM_N; i++) {
    const a = i * slot;
    const rad = R * 0.132;
    const x = Math.cos(a) * rad;
    const y = Math.sin(a) * rad;
    g.fillStyle = "#3e3014";
    g.beginPath();
    g.arc(x, y, R * 0.018, 0, TWO_PI);
    g.fill();
    const bolt = g.createRadialGradient(x - 1.5, y - 1.6, 0.5, x, y, R * 0.016);
    bolt.addColorStop(0, "#fff0c0");
    bolt.addColorStop(0.55, "#d4b15e");
    bolt.addColorStop(1, "#6a5018");
    g.fillStyle = bolt;
    g.beginPath();
    g.arc(x, y, R * 0.014, 0, TWO_PI);
    g.fill();
  }

  const hub = R * 0.092;
  const hubG = g.createRadialGradient(-hub * 0.38, -hub * 0.42, hub * 0.05, hub * 0.12, hub * 0.16, hub);
  hubG.addColorStop(0, "#fff3c8");
  hubG.addColorStop(0.32, "#e6c56e");
  hubG.addColorStop(0.7, "#a67c32");
  hubG.addColorStop(1, "#5a4014");
  g.fillStyle = hubG;
  g.beginPath();
  g.arc(0, 0, hub, 0, TWO_PI);
  g.fill();
  g.strokeStyle = "#3a2c10";
  g.lineWidth = 3;
  g.stroke();
  g.strokeStyle = "rgba(74, 52, 16, 0.75)";
  g.lineWidth = 2.6;
  g.beginPath();
  g.arc(0, 0, hub * 0.58, 0, TWO_PI);
  g.stroke();
  g.fillStyle = "#6a501c";
  g.beginPath();
  g.arc(0, 0, hub * 0.26, 0, TWO_PI);
  g.fill();
  g.fillStyle = "#f6e6b0";
  g.beginPath();
  g.arc(-hub * 0.07, -hub * 0.08, hub * 0.09, 0, TWO_PI);
  g.fill();
  return c;
}

