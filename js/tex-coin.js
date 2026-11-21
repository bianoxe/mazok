/* МОНЕТА — золотой дублон сверху: рубчатый кант, гравировка, блик. */
function makeCoinBossTex() {
  const size = BOSS_TEX;
  const R = BOSS_TEX_R;
  const [c, g] = makeCanvas(size, size);
  const img = bossImages.coin;
  if (img) {
    paintBossPhotoDisc(g, img, size, R - 0.5);
    return c;
  }
  g.translate(R, R);
  g.lineJoin = "round";
  g.lineCap = "round";
  g.beginPath();
  g.arc(0, 0, R - 0.5, 0, TWO_PI);
  g.clip();

  const rim = R * 0.9;
  const ringIn = R * 0.82;
  const face = R * 0.78;

  const edge = g.createLinearGradient(-R * 0.5, -R, R * 0.5, R);
  edge.addColorStop(0, "#fff4c6");
  edge.addColorStop(0.38, "#e8b62e");
  edge.addColorStop(0.74, "#a87414");
  edge.addColorStop(1, "#66460a");
  g.fillStyle = edge;
  g.fillRect(-R, -R, size, size);
  const reeds = 120;
  for (let i = 0; i < reeds; i++) {
    const a = (i / reeds) * TWO_PI;
    g.strokeStyle = i % 2 ? "rgba(255, 248, 206, 0.5)" : "rgba(92, 62, 8, 0.46)";
    g.lineWidth = Math.max(1, R * 0.008);
    g.beginPath();
    g.moveTo(Math.cos(a) * rim, Math.sin(a) * rim);
    g.lineTo(Math.cos(a) * (R - 1), Math.sin(a) * (R - 1));
    g.stroke();
  }

  const ring = g.createLinearGradient(-R * 0.5, -R * 0.62, R * 0.5, R * 0.62);
  ring.addColorStop(0, "#fff9d8");
  ring.addColorStop(0.42, "#f3cc46");
  ring.addColorStop(0.8, "#b8820e");
  ring.addColorStop(1, "#7c5608");
  g.beginPath();
  g.arc(0, 0, rim, 0, TWO_PI);
  g.fillStyle = ring;
  g.fill();
  g.strokeStyle = "rgba(255, 252, 224, 0.7)";
  g.lineWidth = Math.max(1.8, R * 0.014);
  g.beginPath();
  g.arc(0, 0, rim - R * 0.008, Math.PI * 0.92, Math.PI * 1.86);
  g.stroke();
  g.strokeStyle = "rgba(88, 58, 6, 0.72)";
  g.lineWidth = Math.max(2, R * 0.016);
  g.beginPath();
  g.arc(0, 0, rim - R * 0.008, Math.PI * 1.9, Math.PI * 2.82);
  g.stroke();

  const field = g.createRadialGradient(-R * 0.28, -R * 0.32, R * 0.06, R * 0.12, R * 0.14, face);
  field.addColorStop(0, "#ffeeb0");
  field.addColorStop(0.38, "#f2c63c");
  field.addColorStop(0.76, "#cd9110");
  field.addColorStop(1, "#8f620c");
  g.beginPath();
  g.arc(0, 0, ringIn, 0, TWO_PI);
  g.fillStyle = field;
  g.fill();

  g.strokeStyle = "rgba(118, 80, 8, 0.5)";
  g.lineWidth = Math.max(1.4, R * 0.01);
  g.beginPath();
  g.arc(0, 0, face * 0.9, 0, TWO_PI);
  g.stroke();
  g.strokeStyle = "rgba(255, 246, 200, 0.3)";
  g.lineWidth = Math.max(1, R * 0.005);
  g.beginPath();
  g.arc(0, 0, face * 0.9 - R * 0.008, 0, TWO_PI);
  g.stroke();

  const rays = 36;
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * TWO_PI;
    g.strokeStyle = i % 2 ? "rgba(255, 242, 186, 0.2)" : "rgba(118, 80, 8, 0.24)";
    g.lineWidth = Math.max(1, R * 0.007);
    g.beginPath();
    g.moveTo(Math.cos(a) * face * 0.24, Math.sin(a) * face * 0.24);
    g.lineTo(Math.cos(a) * face * 0.88, Math.sin(a) * face * 0.88);
    g.stroke();
  }
  arcRingText(g, "МОНЕТА", R * 0.858, -Math.PI / 2, R * 0.052, "#7c4e06", "rgba(255, 250, 224, 0.5)");
  arcRingText(g, "★ 2026 ★", R * 0.858, Math.PI / 2, R * 0.05, "#7c4e06", "rgba(255, 250, 224, 0.5)");

  const med = face * 0.5;
  const metal = g.createRadialGradient(-med * 0.45, -med * 0.5, med * 0.12, med * 0.12, med * 0.14, med);
  metal.addColorStop(0, "#fffbd8");
  metal.addColorStop(0.4, "#f6d456");
  metal.addColorStop(0.78, "#d9a01a");
  metal.addColorStop(1, "#a3720a");
  g.beginPath();
  g.arc(0, 0, med, 0, TWO_PI);
  g.fillStyle = metal;
  g.fill();
  g.strokeStyle = "rgba(255, 252, 226, 0.72)";
  g.lineWidth = Math.max(1.6, R * 0.012);
  g.beginPath();
  g.arc(0, 0, med * 0.94, Math.PI * 0.9, Math.PI * 1.85);
  g.stroke();
  g.strokeStyle = "rgba(96, 62, 6, 0.6)";
  g.lineWidth = Math.max(1.8, R * 0.014);
  g.beginPath();
  g.arc(0, 0, med * 0.94, Math.PI * 1.9, Math.PI * 2.85);
  g.stroke();

  g.font = "800 " + Math.round(face * 0.66) + "px Unbounded, Manrope, sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillStyle = "rgba(255, 252, 226, 0.85)";
  g.fillText("1", -face * 0.012, face * 0.028);
  g.fillStyle = "rgba(92, 58, 6, 0.92)";
  g.fillText("1", face * 0.012, face * 0.018);

  for (let s = 0; s < 3; s++) {
    const sa = -Math.PI / 2 + (s - 1) * 2.2;
    g.save();
    g.rotate(sa);
    g.translate(0, -face * 0.62);
    g.fillStyle = "rgba(110, 74, 8, 0.75)";
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i / 10) * TWO_PI;
      const rad = i % 2 ? face * 0.028 : face * 0.062;
      const px = Math.cos(a) * rad;
      const py = Math.sin(a) * rad;
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.closePath();
    g.fill();
    g.restore();
  }

  for (let i = 0; i < 14; i++) {
    const a = hash(2600, i) * TWO_PI;
    const d = R * (0.2 + hash(2601, i) * 0.62);
    g.fillStyle = "rgba(255,255,255,0.2)";
    g.beginPath();
    g.ellipse(Math.cos(a) * d, Math.sin(a) * d, R * (0.01 + hash(2602, i) * 0.02), R * 0.004, a, 0, TWO_PI);
    g.fill();
  }

  const gloss = g.createLinearGradient(-R * 0.7, -R * 0.66, R * 0.4, R * 0.7);
  gloss.addColorStop(0, "rgba(255,255,255,0)");
  gloss.addColorStop(0.24, "rgba(255,255,255,0.42)");
  gloss.addColorStop(0.4, "rgba(255,255,255,0.06)");
  gloss.addColorStop(0.68, "rgba(255,255,255,0.24)");
  gloss.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gloss;
  g.fillRect(-R, -R, size, size);

  g.strokeStyle = "rgba(70, 46, 4, 0.55)";
  g.lineWidth = Math.max(1.4, R * 0.01);
  for (let i = 0; i < 5; i++) {
    const a = hash(2620, i) * TWO_PI;
    const d0 = R * (0.2 + hash(2621, i) * 0.45);
    const d1 = d0 + R * (0.08 + hash(2622, i) * 0.16);
    g.beginPath();
    g.moveTo(Math.cos(a) * d0, Math.sin(a) * d0);
    g.lineTo(Math.cos(a + 0.12) * d1, Math.sin(a + 0.12) * d1);
    g.stroke();
  }

  g.strokeStyle = "#6a4a08";
  g.lineWidth = Math.max(3, R * 0.02);
  g.beginPath();
  g.arc(0, 0, R - g.lineWidth * 0.3, 0, TWO_PI);
  g.stroke();
  return c;
}

/* металлический блик поверх готового диска: живёт поверх любого металла */
function drawShineGlint(r, alpha) {
  const log = game.log;
  const cx = snap(log.x);
  const cy = snap(log.y);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.985, 0, TWO_PI);
  ctx.clip();
  ctx.globalAlpha = alpha;
  const sweep = ctx.createLinearGradient(cx - r, cy - r, cx + r * 0.55, cy + r);
  sweep.addColorStop(0, "rgba(255,255,255,0)");
  sweep.addColorStop(0.32, "rgba(255,255,255,0.4)");
  sweep.addColorStop(0.44, "rgba(255,255,255,0.05)");
  sweep.addColorStop(0.66, "rgba(255,255,255,0.24)");
  sweep.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = sweep;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.globalAlpha = 1;
  ctx.restore();
}
