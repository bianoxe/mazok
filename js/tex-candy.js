function candyRibbon(g, R, phase) {
  const steps = 64;
  const turns = 1.25;
  const outer = [];
  const inner = [];
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    const rad = R * (0.02 + Math.pow(u, 0.9) * 0.96);
    const a = phase + u * turns * TWO_PI;
    const w = R * (0.09 + u * 0.2);
    const px = Math.cos(a);
    const py = Math.sin(a);
    const tx = -py;
    const ty = px;
    outer.push([px * rad + tx * w, py * rad + ty * w]);
    inner.push([px * Math.max(0, rad - w * 0.15) - tx * w * 0.15, py * Math.max(0, rad - w * 0.15) - ty * w * 0.15]);
  }
  g.beginPath();
  g.moveTo(outer[0][0], outer[0][1]);
  for (let i = 1; i < outer.length; i++) g.lineTo(outer[i][0], outer[i][1]);
  for (let i = inner.length - 1; i >= 0; i--) g.lineTo(inner[i][0], inner[i][1]);
  g.closePath();
}

function makeCandyTex() {
  /* фото: леденец сверху — диском (круглый) */
  const photo = bossPhotoTex("candy");
  if (photo) return photo;
  const size = BOSS_TEX;
  const R = BOSS_TEX_R;
  const [c, g] = makeCanvas(size, size);
  g.translate(R, R);
  g.beginPath();
  g.arc(0, 0, R - 0.5, 0, TWO_PI);
  g.clip();
  g.lineJoin = "round";
  g.lineCap = "round";

  const base = g.createRadialGradient(-R * 0.28, -R * 0.32, R * 0.05, R * 0.04, R * 0.06, R);
  base.addColorStop(0, "#ffffff");
  base.addColorStop(0.55, "#fff8f6");
  base.addColorStop(0.82, "#ffe4e2");
  base.addColorStop(1, "#f0b8b8");
  g.fillStyle = base;
  g.fillRect(-R, -R, size, size);

  const arms = 4;
  for (let i = 0; i < arms; i++) {
    candyRibbon(g, R, (i / arms) * TWO_PI);
    const grd = g.createLinearGradient(-R * 0.2, -R, R * 0.4, R);
    grd.addColorStop(0, "#ff8d8a");
    grd.addColorStop(0.35, "#e1062c");
    grd.addColorStop(0.7, "#b10d24");
    grd.addColorStop(1, "#7a0c18");
    g.fillStyle = grd;
    g.fill();
    g.lineWidth = Math.max(1.4, R * 0.01);
    g.strokeStyle = "rgba(90, 8, 16, 0.35)";
    g.stroke();
  }

  const rim = g.createRadialGradient(0, 0, R * 0.72, 0, 0, R);
  rim.addColorStop(0, "rgba(255,255,255,0)");
  rim.addColorStop(0.72, "rgba(255,255,255,0)");
  rim.addColorStop(0.88, "rgba(255, 186, 120, 0.18)");
  rim.addColorStop(1, "rgba(120, 24, 28, 0.45)");
  g.fillStyle = rim;
  g.beginPath();
  g.arc(0, 0, R, 0, TWO_PI);
  g.fill();

  g.strokeStyle = "#6e1018";
  g.lineWidth = Math.max(3, R * 0.02);
  g.beginPath();
  g.arc(0, 0, R * 0.985, 0, TWO_PI);
  g.stroke();
  g.strokeStyle = "rgba(255,255,255,0.55)";
  g.lineWidth = Math.max(1.6, R * 0.01);
  g.beginPath();
  g.arc(0, 0, R * 0.9, -2.4, -0.45);
  g.stroke();

  g.fillStyle = "rgba(255,255,255,0.55)";
  g.beginPath();
  g.ellipse(-R * 0.24, -R * 0.3, R * 0.32, R * 0.12, -0.65, 0, TWO_PI);
  g.fill();
  g.fillStyle = "rgba(255,255,255,0.18)";
  g.beginPath();
  g.ellipse(R * 0.28, R * 0.22, R * 0.14, R * 0.06, 0.5, 0, TWO_PI);
  g.fill();

  for (let i = 0; i < 18; i++) {
    const a = hash(910, i) * TWO_PI;
    const d = R * (0.15 + hash(911, i) * 0.72);
    g.fillStyle = hash(912, i) > 0.5 ? "rgba(255,255,255,0.45)" : "rgba(255, 220, 210, 0.35)";
    g.beginPath();
    g.arc(Math.cos(a) * d, Math.sin(a) * d, R * (0.008 + hash(913, i) * 0.012), 0, TWO_PI);
    g.fill();
  }

  return c;
}

function drawCandyGlint(r) {
  const log = game.log;
  const cx = snap(log.x);
  const cy = snap(log.y);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.94, 0, TWO_PI);
  ctx.clip();
  ctx.fillStyle = "rgba(255,255,255,0.38)";
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.2, cy - r * 0.28, r * 0.26, r * 0.09, -0.6, 0, TWO_PI);
  ctx.fill();
  ctx.restore();
}
