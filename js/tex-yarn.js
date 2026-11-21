/* КЛУБОК НИТОК — зелёная пряжа, смотанная в шар: витки идут дугами по сфере,
   у каждой нити тёмный низ и светлый верх, по нитям — мелкая крутка, плюс ворс
   и выпущенный кончик.

   Витки живут в текстуре и крутятся вместе с боссом (он ходит общими
   проворотами), поэтому шар читается смотанным, а не крашеным кругом.
   Пряжа матовая, поэтому живого блика сверху (drawShineGlint) у клубка нет:
   свет запечён в текстуру. */
function makeYarnTex() {
  const size = BOSS_TEX;
  const R = BOSS_TEX_R;
  const [c, g] = makeCanvas(size, size);
  const img = bossImages.yarn;
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

  /* основа: травяная зелёная пряжа, свет сверху слева */
  const base = g.createRadialGradient(-R * 0.3, -R * 0.34, R * 0.04, R * 0.05, R * 0.08, R * 1.02);
  base.addColorStop(0, "#e8ffb4");
  base.addColorStop(0.28, "#c2e76c");
  base.addColorStop(0.6, "#7fae33");
  base.addColorStop(0.84, "#4a7318");
  base.addColorStop(1, "#28420c");
  g.fillStyle = base;
  g.fillRect(-R, -R, size, size);

  /* витки: каждая нить идёт дугой через шар, под ней тень, сверху — крутка,
     поэтому пряжа читается смотанной, а не нарисованными полосками */
  const STRAND = ["#3f6a12", "#6c9c28", "#9ac944", "#c6e878"];
  for (let i = 0; i < 34; i++) {
    const a = hash(8100, i) * TWO_PI;
    const bend = (hash(8101, i) - 0.5) * R * 1.3;
    const w = R * (0.022 + hash(8102, i) * 0.018);
    const p0x = Math.cos(a) * R * 1.05;
    const p0y = Math.sin(a) * R * 1.05;
    const p1x = -p0x;
    const p1y = -p0y;
    const cx = Math.cos(a + Math.PI / 2) * bend;
    const cy = Math.sin(a + Math.PI / 2) * bend;
    /* тень под нитью */
    g.strokeStyle = "rgba(30, 52, 8, 0.26)";
    g.lineWidth = w * 1.5;
    g.beginPath();
    g.moveTo(p0x, p0y);
    g.quadraticCurveTo(cx, cy, p1x, p1y);
    g.stroke();
    /* сама нить */
    g.strokeStyle = STRAND[(i * 3) % STRAND.length];
    g.lineWidth = w;
    g.beginPath();
    g.moveTo(p0x, p0y);
    g.quadraticCurveTo(cx, cy, p1x, p1y);
    g.stroke();
    /* крутка: короткие косые штрихи по нити */
    g.strokeStyle = "rgba(255, 255, 214, 0.16)";
    g.lineWidth = Math.max(1, w * 0.26);
    for (let k = 1; k < 9; k++) {
      const t = k / 9;
      const bx = (1 - t) * (1 - t) * p0x + 2 * (1 - t) * t * cx + t * t * p1x;
      const by = (1 - t) * (1 - t) * p0y + 2 * (1 - t) * t * cy + t * t * p1y;
      const d = Math.hypot(bx, by) || 1;
      const nx = -by / d;
      const ny = bx / d;
      g.beginPath();
      g.moveTo(bx - nx * w * 0.55 + ny * w * 0.42, by - ny * w * 0.55 - nx * w * 0.42);
      g.lineTo(bx + nx * w * 0.55 - ny * w * 0.42, by + ny * w * 0.55 + nx * w * 0.42);
      g.stroke();
    }
  }

  /* ворс: короткие светлые и тёмные волоски по всей пряже */
  for (let i = 0; i < 130; i++) {
    const a = hash(8110, i) * TWO_PI;
    const d = R * (0.08 + hash(8111, i) * 0.9);
    const x = Math.cos(a) * d;
    const y = Math.sin(a) * d;
    const len = R * (0.01 + hash(8112, i) * 0.026);
    const ang = a + (hash(8113, i) - 0.5) * 2.6;
    g.strokeStyle = hash(8114, i) > 0.5
      ? "rgba(255, 255, 210, " + (0.12 + hash(8115, i) * 0.2).toFixed(3) + ")"
      : "rgba(44, 70, 10, " + (0.1 + hash(8116, i) * 0.16).toFixed(3) + ")";
    g.lineWidth = Math.max(0.8, R * 0.004);
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    g.stroke();
  }

  /* выпущенный кончик: нить сходит с клубка и закручивается завитком */
  g.strokeStyle = "rgba(46, 74, 12, 0.35)";
  g.lineWidth = R * 0.042;
  g.beginPath();
  g.moveTo(-R * 0.84, -R * 0.26);
  g.bezierCurveTo(-R * 0.58, R * 0.02, -R * 0.88, R * 0.3, -R * 0.62, R * 0.46);
  g.stroke();
  g.strokeStyle = "#a8d44a";
  g.lineWidth = R * 0.03;
  g.beginPath();
  g.moveTo(-R * 0.84, -R * 0.26);
  g.bezierCurveTo(-R * 0.58, R * 0.02, -R * 0.88, R * 0.3, -R * 0.62, R * 0.46);
  g.stroke();

  /* тень по краю: без неё шар сливается с фоном */
  const rim = g.createRadialGradient(0, 0, R * 0.55, 0, 0, R);
  rim.addColorStop(0, "rgba(0,0,0,0)");
  rim.addColorStop(0.7, "rgba(30, 48, 6, 0.14)");
  rim.addColorStop(1, "rgba(16, 28, 4, 0.46)");
  g.fillStyle = rim;
  g.beginPath();
  g.arc(0, 0, R, 0, TWO_PI);
  g.fill();

  /* блик: мягкое пятно сверху слева — пряжа матовая, ядро не рисуем */
  const glow = g.createRadialGradient(-R * 0.34, -R * 0.4, R * 0.04, -R * 0.3, -R * 0.35, R * 0.54);
  glow.addColorStop(0, "rgba(255, 255, 230, 0.46)");
  glow.addColorStop(0.5, "rgba(255, 255, 220, 0.12)");
  glow.addColorStop(1, "rgba(255, 255, 220, 0)");
  g.fillStyle = glow;
  g.beginPath();
  g.arc(-R * 0.3, -R * 0.35, R * 0.54, 0, TWO_PI);
  g.fill();
  g.restore();

  /* кант: узкая тёмная кромка, чтобы клубок отделялся от неба */
  g.strokeStyle = "rgba(34, 54, 10, 0.6)";
  g.lineWidth = Math.max(2.4, R * 0.018);
  g.beginPath();
  g.arc(0, 0, R - 1, 0, TWO_PI);
  g.stroke();
  return c;
}
