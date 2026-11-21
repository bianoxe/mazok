function makeValveTex() {
  /* ВЕНТИЛЬ — фото-босс: картинка лежит в images/boss (assets.js:
     BOSS_IMAGE_SRC.valve). Процедурный рисунок ниже остаётся запасным —
     на случай, если файла нет. */
  const photo = bossPhotoTex("valve");
  if (photo) return photo;
  const size = BOSS_TEX;
  const cx = size * 0.5;
  const R = BOSS_TEX_R;
  const [c, g] = makeCanvas(size, size);
  g.translate(cx, cx);
  g.beginPath();
  g.arc(0, 0, R - 0.5, 0, TWO_PI);
  g.clip();
  g.lineCap = "round";
  g.lineJoin = "round";

  const floor = g.createRadialGradient(-R * 0.16, -R * 0.22, R * 0.04, R * 0.02, R * 0.06, R);
  floor.addColorStop(0, "#323a42");
  floor.addColorStop(0.45, "#1c2228");
  floor.addColorStop(0.78, "#12161a");
  floor.addColorStop(1, "#0b0e11");
  g.fillStyle = floor;
  g.fillRect(-cx, -cx, size, size);

  for (let i = 0; i < 14; i++) {
    const a = hash(240, i) * TWO_PI;
    const d = R * (0.18 + hash(241, i) * 0.62);
    g.globalAlpha = 0.14 + hash(242, i) * 0.22;
    g.fillStyle = hash(243, i) > 0.62 ? "#3a2c22" : "#07090c";
    g.beginPath();
    g.ellipse(
      Math.cos(a) * d, Math.sin(a) * d,
      R * (0.045 + hash(244, i) * 0.08),
      R * (0.02 + hash(245, i) * 0.03),
      a + hash(246, i), 0, TWO_PI
    );
    g.fill();
  }
  g.globalAlpha = 1;

  const n = 6;
  const slot = TWO_PI / n;
  const spokeW = R * 0.186;
  const yRoot = -R * 0.18;
  const yTip = -R * 0.86;

  const bar = (x, y, w, h, rad) => {
    g.beginPath();
    if (g.roundRect) g.roundRect(x, y, w, h, rad);
    else g.rect(x, y, w, h);
  };

  const steel = (x0, x1) => {
    const grd = g.createLinearGradient(x0, 0, x1, 0);
    grd.addColorStop(0, "#14181c");
    grd.addColorStop(0.14, "#5c666e");
    grd.addColorStop(0.24, "#d5dce2");
    grd.addColorStop(0.4, "#8e98a0");
    grd.addColorStop(0.68, "#3a434b");
    grd.addColorStop(1, "#12171b");
    return grd;
  };

  for (let i = 0; i < n; i++) {
    g.save();
    g.rotate(i * slot);
    g.fillStyle = "rgba(0, 0, 0, 0.45)";
    bar(-spokeW * 0.5 + R * 0.016, yTip + R * 0.03, spokeW, yRoot - yTip, R * 0.03);
    g.fill();
    g.fillStyle = steel(-spokeW * 0.5, spokeW * 0.5);
    bar(-spokeW * 0.5, yTip, spokeW, yRoot - yTip, R * 0.028);
    g.fill();
    g.strokeStyle = "rgba(8, 10, 12, 0.9)";
    g.lineWidth = Math.max(2.2, R * 0.014);
    g.stroke();
    g.strokeStyle = "rgba(236, 240, 244, 0.28)";
    g.lineWidth = Math.max(1.4, R * 0.009);
    g.beginPath();
    g.moveTo(-spokeW * 0.28, yRoot - R * 0.05);
    g.lineTo(-spokeW * 0.28, yTip + R * 0.08);
    g.stroke();
    g.strokeStyle = "rgba(12, 14, 16, 0.55)";
    g.lineWidth = Math.max(1.2, R * 0.007);
    for (let k = 0; k < 2; k++) {
      const yy = yTip + (yRoot - yTip) * (0.25 + hash(250 + i, k) * 0.5);
      g.beginPath();
      g.moveTo(-spokeW * 0.22, yy);
      g.lineTo(spokeW * 0.18, yy + (hash(260 + i, k) - 0.5) * R * 0.04);
      g.stroke();
    }
    g.restore();
  }

  const rimOut = R * 0.985;
  const rimIn = R * 0.735;
  g.beginPath();
  g.arc(R * 0.012, R * 0.016, rimOut, 0, TWO_PI);
  g.arc(R * 0.012, R * 0.016, rimIn, 0, TWO_PI, true);
  g.fillStyle = "rgba(0, 0, 0, 0.38)";
  g.fill();
  const rim = g.createLinearGradient(-R, -R * 0.2, R * 0.85, R * 0.9);
  rim.addColorStop(0, "#c5ced4");
  rim.addColorStop(0.32, "#8d979f");
  rim.addColorStop(0.58, "#4e585f");
  rim.addColorStop(0.82, "#2a3138");
  rim.addColorStop(1, "#15191d");
  g.beginPath();
  g.arc(0, 0, rimOut, 0, TWO_PI);
  g.arc(0, 0, rimIn, 0, TWO_PI, true);
  g.fillStyle = rim;
  g.fill();
  g.lineWidth = Math.max(3, R * 0.028);
  g.strokeStyle = "rgba(6, 8, 10, 0.82)";
  g.beginPath();
  g.arc(0, 0, rimIn + R * 0.01, 0, TWO_PI);
  g.stroke();
  g.lineWidth = Math.max(2.4, R * 0.016);
  g.strokeStyle = "rgba(8, 10, 12, 0.9)";
  g.beginPath();
  g.arc(0, 0, rimOut - R * 0.008, 0, TWO_PI);
  g.stroke();
  g.lineWidth = Math.max(2, R * 0.014);
  g.strokeStyle = "rgba(244, 247, 250, 0.42)";
  g.beginPath();
  g.arc(0, 0, rimOut - R * 0.03, -2.5, -0.55);
  g.stroke();
  g.strokeStyle = "rgba(255, 255, 255, 0.16)";
  g.lineWidth = Math.max(1.4, R * 0.008);
  g.beginPath();
  g.arc(0, 0, rimIn + R * 0.045, -2.2, -0.7);
  g.stroke();
  g.strokeStyle = "rgba(10, 12, 14, 0.45)";
  g.lineWidth = Math.max(1.6, R * 0.01);
  g.beginPath();
  g.arc(0, 0, (rimIn + rimOut) * 0.5, 0.4, 2.5);
  g.stroke();

  for (let i = 0; i < n; i++) {
    g.save();
    g.rotate(i * slot);
    const y = -R * 0.84;
    const w = R * 0.3;
    const h = R * 0.132;
    g.fillStyle = "rgba(0, 0, 0, 0.4)";
    bar(-w * 0.5 + R * 0.012, y - h * 0.5 + R * 0.014, w, h, h * 0.38);
    g.fill();
    g.fillStyle = steel(-w * 0.5, w * 0.5);
    bar(-w * 0.5, y - h * 0.5, w, h, h * 0.38);
    g.fill();
    g.strokeStyle = "rgba(8, 10, 12, 0.88)";
    g.lineWidth = Math.max(2, R * 0.012);
    g.stroke();
    g.restore();
  }

  const hubR = R * 0.312;
  g.fillStyle = "rgba(0, 0, 0, 0.5)";
  g.beginPath();
  g.arc(R * 0.018, R * 0.024, hubR, 0, TWO_PI);
  g.fill();
  const hub = g.createRadialGradient(-hubR * 0.42, -hubR * 0.48, hubR * 0.05, hubR * 0.06, hubR * 0.08, hubR * 1.15);
  hub.addColorStop(0, "#d4dae0");
  hub.addColorStop(0.28, "#a8b2ba");
  hub.addColorStop(0.58, "#5d676f");
  hub.addColorStop(0.84, "#2c343c");
  hub.addColorStop(1, "#14181c");
  g.fillStyle = hub;
  g.beginPath();
  g.arc(0, 0, hubR, 0, TWO_PI);
  g.fill();
  g.lineWidth = Math.max(2.6, R * 0.018);
  g.strokeStyle = "#0e1216";
  g.stroke();
  g.beginPath();
  g.arc(0, 0, hubR * 0.72, 0, TWO_PI);
  g.lineWidth = Math.max(3, R * 0.026);
  g.strokeStyle = "rgba(6, 8, 10, 0.72)";
  g.stroke();
  g.beginPath();
  g.arc(0, 0, hubR * 0.78, -2.3, -0.45);
  g.lineWidth = Math.max(1.4, R * 0.008);
  g.strokeStyle = "rgba(255, 255, 255, 0.22)";
  g.stroke();

  const boltR = R * 0.148;
  const bolt = g.createRadialGradient(-boltR * 0.32, -boltR * 0.38, boltR * 0.06, 0, boltR * 0.04, boltR);
  bolt.addColorStop(0, "#dfe5ea");
  bolt.addColorStop(0.4, "#a3adb6");
  bolt.addColorStop(0.75, "#515b63");
  bolt.addColorStop(1, "#1a2026");
  g.fillStyle = bolt;
  g.beginPath();
  g.arc(0, 0, boltR, 0, TWO_PI);
  g.fill();
  g.lineWidth = Math.max(2, R * 0.012);
  g.strokeStyle = "#101418";
  g.stroke();

  g.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + i * slot;
    const x = Math.cos(a) * boltR * 0.72;
    const y = Math.sin(a) * boltR * 0.72;
    if (i) g.lineTo(x, y);
    else g.moveTo(x, y);
  }
  g.closePath();
  const nut = g.createLinearGradient(-boltR, -boltR, boltR * 0.8, boltR);
  nut.addColorStop(0, "#d5dce2");
  nut.addColorStop(0.45, "#8b959d");
  nut.addColorStop(1, "#1c242b");
  g.fillStyle = nut;
  g.fill();
  g.strokeStyle = "#0c1014";
  g.lineWidth = Math.max(1.8, R * 0.011);
  g.stroke();

  const bore = g.createRadialGradient(-R * 0.01, -R * 0.012, R * 0.008, 0, 0, R * 0.055);
  bore.addColorStop(0, "#3a424a");
  bore.addColorStop(0.55, "#14181c");
  bore.addColorStop(1, "#07090b");
  g.fillStyle = bore;
  g.beginPath();
  g.arc(0, 0, R * 0.046, 0, TWO_PI);
  g.fill();
  g.strokeStyle = "rgba(230, 236, 240, 0.28)";
  g.lineWidth = Math.max(1.2, R * 0.007);
  g.beginPath();
  g.arc(0, 0, R * 0.034, -2.35, -0.65);
  g.stroke();

  for (let i = 0; i < 12; i++) {
    const a0 = hash(280, i) * TWO_PI;
    const span = 0.18 + hash(281, i) * 0.7;
    const rad = R * (0.76 + hash(282, i) * 0.2);
    g.globalAlpha = 0.22 + hash(283, i) * 0.28;
    g.strokeStyle = hash(284, i) > 0.45 ? "rgba(236,240,244,0.85)" : "rgba(8,10,12,0.9)";
    g.lineWidth = 1.6 + hash(285, i) * 2.8;
    g.beginPath();
    g.arc(0, 0, rad, a0, a0 + span);
    g.stroke();
  }
  g.globalAlpha = 1;
  for (let i = 0; i < 7; i++) {
    const a = hash(310, i) * TWO_PI;
    const d = R * (0.42 + hash(311, i) * 0.5);
    g.globalAlpha = 0.22 + hash(312, i) * 0.2;
    g.fillStyle = hash(313, i) > 0.5 ? "#2a2118" : "#101418";
    g.beginPath();
    g.ellipse(Math.cos(a) * d, Math.sin(a) * d, R * (0.05 + hash(314, i) * 0.06), R * 0.022, a, 0, TWO_PI);
    g.fill();
  }
  g.globalAlpha = 1;

  const sheen = g.createRadialGradient(-R * 0.38, -R * 0.42, R * 0.02, -R * 0.05, -R * 0.08, R);
  sheen.addColorStop(0, "rgba(255,255,255,0.1)");
  sheen.addColorStop(0.4, "rgba(255,255,255,0.03)");
  sheen.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = sheen;
  g.fillRect(-cx, -cx, size, size);

  return c;
}
