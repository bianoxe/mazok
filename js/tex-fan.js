function fanRound(g, x, y, w, h, rad) {
  g.beginPath();
  if (g.roundRect) g.roundRect(x, y, w, h, rad);
  else g.rect(x, y, w, h);
}

function makeFanTex() {
  const size = BOSS_TEX;
  const R = BOSS_TEX_R;
  const [c, g] = makeCanvas(size, size);
  const img = bossImages.fan;
  if (img) {
    paintBossPhotoDisc(g, img, size, R - 0.5);
    return c;
  }
  g.translate(R, R);
  g.beginPath();
  g.arc(0, 0, R - 0.5, 0, TWO_PI);
  g.clip();
  g.lineJoin = "round";
  g.lineCap = "round";

  const shell = g.createRadialGradient(-R * 0.28, -R * 0.34, R * 0.08, R * 0.08, R * 0.12, R * 1.05);
  shell.addColorStop(0, "#8a8176");
  shell.addColorStop(0.45, "#5c564e");
  shell.addColorStop(0.78, "#3e3a34");
  shell.addColorStop(1, "#241f1c");
  g.fillStyle = shell;
  g.fillRect(-R, -R, size, size);

  const hx = R * FAN_CX;
  const hy = R * FAN_CY;
  const headR = R * 0.99;
  g.fillStyle = "rgba(0,0,0,0.28)";
  g.beginPath();
  g.arc(hx + R * 0.02, hy + R * 0.03, headR, 0, TWO_PI);
  g.fill();
  const head = g.createRadialGradient(hx - headR * 0.38, hy - headR * 0.42, headR * 0.08, hx + headR * 0.05, hy + headR * 0.08, headR * 1.08);
  head.addColorStop(0, "#f7f3ec");
  head.addColorStop(0.28, "#e3dbd0");
  head.addColorStop(0.62, "#c9c0b3");
  head.addColorStop(0.86, "#8f867a");
  head.addColorStop(1, "#5a534b");
  g.fillStyle = head;
  g.beginPath();
  g.arc(hx, hy, headR, 0, TWO_PI);
  g.fill();
  g.lineWidth = Math.max(3, R * 0.02);
  g.strokeStyle = "#2a2622";
  g.stroke();
  g.lineWidth = Math.max(1.6, R * 0.01);
  g.strokeStyle = "rgba(255,255,255,0.28)";
  g.beginPath();
  g.arc(hx, hy, headR - R * 0.03, -2.5, -0.45);
  g.stroke();

  const hole = R * FAN_HOLE;
  const lip = hole + R * 0.055;
  g.beginPath();
  g.arc(hx, hy, lip, 0, TWO_PI);
  g.arc(hx, hy, hole, 0, TWO_PI, true);
  const lipG = g.createLinearGradient(hx - lip, hy - lip, hx + lip, hy + lip);
  lipG.addColorStop(0, "#f4f0e8");
  lipG.addColorStop(0.35, "#b7aea2");
  lipG.addColorStop(0.7, "#6a6258");
  lipG.addColorStop(1, "#2c2824");
  g.fillStyle = lipG;
  g.fill();
  g.lineWidth = Math.max(2.2, R * 0.014);
  g.strokeStyle = "#1c1916";
  g.beginPath();
  g.arc(hx, hy, hole + R * 0.006, 0, TWO_PI);
  g.stroke();
  g.lineWidth = Math.max(1.4, R * 0.008);
  g.strokeStyle = "rgba(255,255,255,0.22)";
  g.beginPath();
  g.arc(hx, hy, lip - R * 0.012, -2.4, -0.5);
  g.stroke();

  const well = g.createRadialGradient(hx - hole * 0.2, hy - hole * 0.28, hole * 0.05, hx, hy, hole);
  well.addColorStop(0, "#3c4450");
  well.addColorStop(0.55, "#1a1e24");
  well.addColorStop(1, "#0c0e12");
  g.fillStyle = well;
  g.beginPath();
  g.arc(hx, hy, hole - R * 0.004, 0, TWO_PI);
  g.fill();

  const ventR = hole + R * 0.125;
  for (let i = 0; i < FAN_VENTS.length; i++) {
    const a = FAN_VENTS[i];
    const x = hx + Math.cos(a) * ventR;
    const y = hy + Math.sin(a) * ventR;
    g.save();
    g.translate(x, y);
    g.rotate(a);
    g.fillStyle = "rgba(0,0,0,0.35)";
    fanRound(g, -R * 0.03, -R * 0.07, R * 0.07, R * 0.15, R * 0.03);
    g.fill();
    g.fillStyle = "#141210";
    fanRound(g, -R * 0.026, -R * 0.062, R * 0.052, R * 0.124, R * 0.024);
    g.fill();
    g.strokeStyle = "rgba(255,255,255,0.16)";
    g.lineWidth = Math.max(1, R * 0.006);
    g.stroke();
    g.restore();
  }

  const nzY = hy;
  const nz0 = R * 0.62;
  const nz1 = R * 0.995;
  const nh0 = R * 0.44;
  const nh1 = R * 0.3;
  g.fillStyle = "rgba(0,0,0,0.25)";
  g.beginPath();
  g.moveTo(nz0, nzY - nh0 * 0.5 + R * 0.02);
  g.lineTo(nz1, nzY - nh1 * 0.5 + R * 0.02);
  g.quadraticCurveTo(nz1 + R * 0.04, nzY + R * 0.02, nz1, nzY + nh1 * 0.5 + R * 0.02);
  g.lineTo(nz0, nzY + nh0 * 0.5 + R * 0.02);
  g.closePath();
  g.fill();
  g.beginPath();
  g.moveTo(nz0, nzY - nh0 * 0.5);
  g.lineTo(nz1 - R * 0.02, nzY - nh1 * 0.5);
  g.quadraticCurveTo(nz1 + R * 0.03, nzY, nz1 - R * 0.02, nzY + nh1 * 0.5);
  g.lineTo(nz0, nzY + nh0 * 0.5);
  g.closePath();
  const nz = g.createLinearGradient(nz0, nzY - nh0, nz1, nzY + nh0);
  nz.addColorStop(0, "#d9d1c6");
  nz.addColorStop(0.35, "#f6f2eb");
  nz.addColorStop(0.72, "#b3aa9e");
  nz.addColorStop(1, "#6d655c");
  g.fillStyle = nz;
  g.fill();
  g.lineWidth = Math.max(2.2, R * 0.014);
  g.strokeStyle = "#2a2622";
  g.stroke();
  g.strokeStyle = "rgba(255,255,255,0.35)";
  g.lineWidth = Math.max(1.2, R * 0.008);
  g.beginPath();
  g.moveTo(nz0 + R * 0.04, nzY - nh0 * 0.32);
  g.lineTo(nz1 - R * 0.08, nzY - nh1 * 0.28);
  g.stroke();
  g.fillStyle = "#161412";
  g.beginPath();
  g.ellipse(nz1 - R * 0.07, nzY, R * 0.055, nh1 * 0.34, 0, 0, TWO_PI);
  g.fill();
  g.strokeStyle = "#3a342e";
  g.lineWidth = Math.max(1.4, R * 0.01);
  g.stroke();

  g.fillStyle = "rgba(18, 14, 12, 0.45)";
  g.beginPath();
  g.ellipse(-R * 0.42, R * 0.72, R * 0.16, R * 0.16, 0.4, 0, TWO_PI);
  g.fill();
  g.beginPath();
  g.ellipse(R * 0.22, R * 0.74, R * 0.12, R * 0.14, -0.2, 0, TWO_PI);
  g.fill();

  paintFanHandle(g, R);

  g.fillStyle = "#1a1816";
  g.beginPath();
  g.arc(-R * 0.7, R * 0.16, R * 0.03, 0, TWO_PI);
  g.fill();
  g.fillStyle = "#8fd0ea";
  g.beginPath();
  g.arc(-R * 0.7, R * 0.16, R * 0.016, 0, TWO_PI);
  g.fill();

  const screws = [-2.15, -0.55, 2.35, 3.35];
  for (let i = 0; i < screws.length; i++) {
    const a = screws[i];
    const x = Math.cos(a) * R * 0.9;
    const y = Math.sin(a) * R * 0.9;
    g.fillStyle = "#2a2622";
    g.beginPath();
    g.arc(x, y, R * 0.028, 0, TWO_PI);
    g.fill();
    const bolt = g.createRadialGradient(x - R * 0.008, y - R * 0.008, R * 0.004, x, y, R * 0.026);
    bolt.addColorStop(0, "#f2f4f6");
    bolt.addColorStop(0.55, "#9aa3ab");
    bolt.addColorStop(1, "#3a4046");
    g.fillStyle = bolt;
    g.beginPath();
    g.arc(x, y, R * 0.02, 0, TWO_PI);
    g.fill();
    g.strokeStyle = "#1a1e22";
    g.lineWidth = Math.max(1, R * 0.006);
    g.beginPath();
    g.moveTo(x - R * 0.01, y);
    g.lineTo(x + R * 0.01, y);
    g.stroke();
  }

  g.strokeStyle = "rgba(42, 38, 34, 0.55)";
  g.lineWidth = Math.max(1.5, R * 0.01);
  g.beginPath();
  g.arc(hx, hy, headR * 0.92, 0.4, 2.3);
  g.stroke();

  g.fillStyle = "rgba(255,255,255,0.16)";
  g.beginPath();
  g.ellipse(hx - headR * 0.32, hy - headR * 0.36, headR * 0.28, headR * 0.12, -0.6, 0, TWO_PI);
  g.fill();

  g.strokeStyle = "rgba(255,255,255,0.14)";
  g.lineWidth = Math.max(1, R * 0.006);
  for (let i = 0; i < 8; i++) {
    const a = hash(860, i) * TWO_PI;
    const d = R * (0.2 + hash(861, i) * 0.68);
    const x = Math.cos(a) * d;
    const y = Math.sin(a) * d;
    if (Math.hypot(x - hx, y - hy) < hole * 1.05) continue;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + (hash(862, i) - 0.5) * R * 0.14, y + (hash(863, i) - 0.5) * R * 0.05);
    g.stroke();
  }
  g.strokeStyle = "rgba(30, 24, 18, 0.28)";
  for (let i = 0; i < 5; i++) {
    const a = hash(870, i) * TWO_PI;
    const d = R * (0.55 + hash(871, i) * 0.32);
    g.beginPath();
    g.moveTo(Math.cos(a) * d, Math.sin(a) * d);
    g.lineTo(Math.cos(a + 0.08) * (d + R * 0.08), Math.sin(a + 0.08) * (d + R * 0.06));
    g.stroke();
  }

  return c;
}

function paintFanHandle(g, R) {
  const top = R * 0.5;
  const bot = R * 0.98;
  const neck = R * 0.56;
  const grip = R * 0.34;
  g.fillStyle = "rgba(0,0,0,0.3)";
  g.beginPath();
  g.moveTo(-neck * 0.46 + R * 0.02, top + R * 0.03);
  g.quadraticCurveTo(-grip * 0.62, top + R * 0.16, -grip * 0.55, top + R * 0.28);
  g.lineTo(-grip * 0.5, bot - R * 0.06);
  g.quadraticCurveTo(R * 0.02, bot + R * 0.05, grip * 0.52, bot - R * 0.06);
  g.lineTo(grip * 0.58, top + R * 0.28);
  g.quadraticCurveTo(grip * 0.66, top + R * 0.14, neck * 0.5, top + R * 0.02);
  g.closePath();
  g.fill();
  g.beginPath();
  g.moveTo(-neck * 0.5, top);
  g.quadraticCurveTo(-grip * 0.7, top + R * 0.14, -grip * 0.52, top + R * 0.26);
  g.lineTo(-grip * 0.48, bot - R * 0.08);
  g.quadraticCurveTo(0, bot + R * 0.02, grip * 0.48, bot - R * 0.08);
  g.lineTo(grip * 0.52, top + R * 0.26);
  g.quadraticCurveTo(grip * 0.68, top + R * 0.12, neck * 0.5, top);
  g.closePath();
  const grd = g.createLinearGradient(-neck, 0, neck, 0);
  grd.addColorStop(0, "#3a342e");
  grd.addColorStop(0.16, "#8f877c");
  grd.addColorStop(0.38, "#d9d2c6");
  grd.addColorStop(0.62, "#a3988c");
  grd.addColorStop(1, "#2c2824");
  g.fillStyle = grd;
  g.fill();
  g.lineWidth = Math.max(2.4, R * 0.015);
  g.strokeStyle = "#241f1c";
  g.stroke();
  const gy = top + (bot - top) * 0.34;
  const gripG = g.createLinearGradient(-grip, 0, grip, 0);
  gripG.addColorStop(0, "#2a2622");
  gripG.addColorStop(0.22, "#6a6258");
  gripG.addColorStop(0.48, "#8a8278");
  gripG.addColorStop(0.78, "#4a453f");
  gripG.addColorStop(1, "#1c1916");
  g.fillStyle = gripG;
  fanRound(g, -grip * 0.5, gy, grip, bot - gy + R * 0.01, R * 0.07);
  g.fill();
  g.strokeStyle = "#1c1916";
  g.lineWidth = Math.max(1.6, R * 0.01);
  g.stroke();
  g.strokeStyle = "rgba(255,255,255,0.2)";
  g.lineWidth = Math.max(1.1, R * 0.007);
  g.beginPath();
  g.moveTo(-grip * 0.18, gy + R * 0.04);
  g.lineTo(-grip * 0.14, bot - R * 0.06);
  g.stroke();
  g.strokeStyle = "rgba(28, 22, 18, 0.72)";
  g.lineWidth = Math.max(1.8, R * 0.012);
  for (let i = 0; i < 5; i++) {
    const y = top + R * 0.34 + i * R * 0.08;
    g.beginPath();
    g.moveTo(-grip * 0.36, y);
    g.lineTo(grip * 0.36, y + R * 0.008);
    g.stroke();
  }
  g.fillStyle = "#2c4f62";
  fanRound(g, -R * 0.05, top + R * 0.12, R * 0.1, R * 0.055, R * 0.02);
  g.fill();
  g.fillStyle = "#d4543c";
  g.beginPath();
  g.arc(R * 0.08, top + R * 0.28, R * 0.028, 0, TWO_PI);
  g.fill();
  g.strokeStyle = "#2a1814";
  g.lineWidth = Math.max(1, R * 0.006);
  g.stroke();
  g.fillStyle = "#2a2622";
  g.beginPath();
  g.ellipse(0, bot - R * 0.02, grip * 0.28, R * 0.028, 0, 0, TWO_PI);
  g.fill();
}

function makeFanBladeTex() {
  const size = 384;
  const [c, g] = makeCanvas(size, size);
  const R = size * 0.46;
  g.translate(size * 0.5, size * 0.5);
  g.lineJoin = "round";
  g.lineCap = "round";
  const slot = TWO_PI / FAN_N;
  for (let i = 0; i < FAN_N; i++) {
    g.save();
    g.rotate(i * slot);
    const metal = g.createLinearGradient(-R * 0.08, -R * 0.2, R * 0.22, -R * 0.85);
    metal.addColorStop(0, "#3e4650");
    metal.addColorStop(0.28, "#d5dee6");
    metal.addColorStop(0.55, "#f4f7fa");
    metal.addColorStop(0.78, "#8e98a2");
    metal.addColorStop(1, "#2a3138");
    g.fillStyle = metal;
    g.beginPath();
    g.moveTo(R * 0.045, -R * 0.17);
    g.bezierCurveTo(R * 0.24, -R * 0.28, R * 0.36, -R * 0.5, R * 0.07, -R * 0.97);
    g.bezierCurveTo(-R * 0.07, -R * 0.72, -R * 0.1, -R * 0.4, -R * 0.035, -R * 0.17);
    g.closePath();
    g.fill();
    g.lineWidth = Math.max(2, R * 0.022);
    g.strokeStyle = "rgba(12, 14, 18, 0.88)";
    g.stroke();
    g.lineWidth = Math.max(1.2, R * 0.012);
    g.strokeStyle = "rgba(255,255,255,0.45)";
    g.beginPath();
    g.moveTo(R * 0.06, -R * 0.26);
    g.bezierCurveTo(R * 0.2, -R * 0.38, R * 0.26, -R * 0.55, R * 0.06, -R * 0.84);
    g.stroke();
    g.restore();
  }
  const hubR = R * 0.2;
  g.fillStyle = "rgba(0,0,0,0.45)";
  g.beginPath();
  g.arc(R * 0.012, R * 0.016, hubR, 0, TWO_PI);
  g.fill();
  const hub = g.createRadialGradient(-hubR * 0.35, -hubR * 0.4, hubR * 0.08, hubR * 0.04, hubR * 0.06, hubR);
  hub.addColorStop(0, "#e7edf2");
  hub.addColorStop(0.4, "#8b949e");
  hub.addColorStop(0.78, "#3a424a");
  hub.addColorStop(1, "#14181c");
  g.fillStyle = hub;
  g.beginPath();
  g.arc(0, 0, hubR, 0, TWO_PI);
  g.fill();
  g.lineWidth = Math.max(2, R * 0.02);
  g.strokeStyle = "#101418";
  g.stroke();
  const nut = R * 0.09;
  const nutG = g.createRadialGradient(-nut * 0.3, -nut * 0.35, nut * 0.05, 0, 0, nut);
  nutG.addColorStop(0, "#d5dbe2");
  nutG.addColorStop(0.6, "#5c656e");
  nutG.addColorStop(1, "#1a1e24");
  g.fillStyle = nutG;
  g.beginPath();
  g.arc(0, 0, nut, 0, TWO_PI);
  g.fill();
  g.strokeStyle = "#0e1216";
  g.lineWidth = Math.max(1.4, R * 0.016);
  g.beginPath();
  g.moveTo(-nut * 0.55, 0);
  g.lineTo(nut * 0.55, 0);
  g.moveTo(0, -nut * 0.55);
  g.lineTo(0, nut * 0.55);
  g.stroke();
  return c;
}

function makeFanGrilleTex() {
  const size = 384;
  const [c, g] = makeCanvas(size, size);
  const R = size * 0.48;
  g.translate(size * 0.5, size * 0.5);
  g.lineCap = "round";
  g.strokeStyle = "rgba(28, 24, 20, 0.82)";
  g.lineWidth = Math.max(2.4, R * 0.028);
  g.beginPath();
  g.arc(0, 0, R * 0.96, 0, TWO_PI);
  g.stroke();
  g.lineWidth = Math.max(1.6, R * 0.016);
  g.strokeStyle = "rgba(232, 226, 216, 0.35)";
  g.beginPath();
  g.arc(0, 0, R * 0.9, -2.4, -0.4);
  g.stroke();
  g.strokeStyle = "rgba(22, 18, 16, 0.72)";
  g.lineWidth = Math.max(1.5, R * 0.014);
  g.beginPath();
  g.arc(0, 0, R * 0.58, 0, TWO_PI);
  g.stroke();
  const n = 8;
  g.lineWidth = Math.max(1.7, R * 0.016);
  for (let i = 0; i < n; i++) {
    const a = -0.2 + i * (TWO_PI / n);
    g.beginPath();
    g.moveTo(Math.cos(a) * R * 0.2, Math.sin(a) * R * 0.2);
    g.lineTo(Math.cos(a) * R * 0.94, Math.sin(a) * R * 0.94);
    g.stroke();
  }
  return c;
}

function drawFanWash(r, heat, pulse) {
  const k = heat + pulse * 0.4;
  if (k < 0.03) return;
  const cx = r * FAN_CX;
  const cy = r * FAN_CY;
  ctx.save();
  const grd = ctx.createRadialGradient(cx, cy, r * FAN_HOLE * 0.2, cx, cy, r);
  grd.addColorStop(0, "rgba(255, 128, 48, " + (0.05 + k * 0.22) + ")");
  grd.addColorStop(0.55, "rgba(255, 96, 32, " + (k * 0.08) + ")");
  grd.addColorStop(1, "rgba(255, 70, 20, 0)");
  ctx.fillStyle = grd;
  /* заливка кругом вплотную к кромке: тот же вид, что был у clip + прямоугольника,
     но граница заливки видна и проверке размера (tools/_boss_size_check.js) */
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.99, 0, TWO_PI);
  ctx.fill();
  ctx.restore();
}

function drawFanVents(r, heat) {
  if (heat < 0.05) return;
  const cx = r * FAN_CX;
  const cy = r * FAN_CY;
  const rad = r * (FAN_HOLE + 0.125);
  ctx.save();
  for (let i = 0; i < FAN_VENTS.length; i++) {
    const a = FAN_VENTS[i];
    const x = cx + Math.cos(a) * rad;
    const y = cy + Math.sin(a) * rad;
    ctx.fillStyle = "rgba(255, 120, 42, " + (0.12 + heat * 0.5) + ")";
    ctx.beginPath();
    ctx.ellipse(x, y, r * 0.028, r * 0.062, a, 0, TWO_PI);
    ctx.fill();
  }
  ctx.restore();
}

function drawFanRotor(r) {
  const log = game.log;
  const tex = assets.fanBlades;
  if (!tex) return;
  const cx = r * FAN_CX;
  const cy = r * FAN_CY;
  const hole = r * FAN_HOLE;
  const st = log.fanStage || FAN_STAGE_1;
  const heat = log.fanHeat || 0;
  const ang = log.fanAng || 0;
  const smear = Math.min(0.16, (log.fanOmega || FAN_W1) * 0.009);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, hole * 0.99, 0, TWO_PI);
  ctx.clip();
  if (heat > 0.03) {
    const glow = ctx.createRadialGradient(cx, cy, hole * 0.06, cx, cy, hole);
    const a = 0.06 + heat * (st >= FAN_STAGE_3 ? 0.55 : 0.28);
    glow.addColorStop(0, "rgba(255, 156, 64, " + a + ")");
    glow.addColorStop(0.62, "rgba(255, 72, 24, " + (a * 0.42) + ")");
    glow.addColorStop(1, "rgba(255, 40, 12, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, hole * 0.99, 0, TWO_PI);
    ctx.fill();
  }
  ctx.translate(cx, cy);
  const d = hole * 1.92;
  const blit = (rot, alpha) => {
    if (alpha < 0.02) return;
    ctx.save();
    ctx.rotate(rot);
    ctx.globalAlpha = alpha;
    ctx.drawImage(tex, -d * 0.5, -d * 0.5, d, d);
    ctx.restore();
  };
  if (!phone && st >= FAN_STAGE_3) blit(ang - smear * 1.7, 0.14);
  if (!phone || st >= FAN_STAGE_2) blit(ang - smear, st >= FAN_STAGE_3 ? 0.22 : 0.16);
  blit(ang, 1);
  if (!phone && st >= FAN_STAGE_3) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    blit(ang, 0.12);
    ctx.restore();
  }
  ctx.restore();
  const grille = assets.fanGrille;
  if (grille) {
    const gd = hole * 2.04;
    ctx.drawImage(grille, cx - gd * 0.5, cy - gd * 0.5, gd, gd);
  }
  const fanFlash = logHitFlashAlpha();
  if (fanFlash > 0.004) {
    ctx.save();
    ctx.globalAlpha = Math.min(0.26, fanFlash * 0.32);
    ctx.fillStyle = heat > 0.2 ? "#ffe4c8" : "#fff";
    ctx.beginPath();
    ctx.arc(cx - hole * 0.18, cy - hole * 0.2, hole * 0.22, 0, TWO_PI);
    ctx.fill();
    ctx.restore();
  }
}

function drawFanNozzleLip(r) {
  const cy = r * FAN_CY;
  const x0 = r * 0.88;
  const x1 = r * 1.07;   /* сопло торчит за кромку бревна — как и рисовалось всегда */
  const h0 = r * 0.32;
  const h1 = r * 0.22;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x0, cy - h0 * 0.5);
  ctx.lineTo(x1, cy - h1 * 0.5);
  ctx.quadraticCurveTo(x1 + r * 0.028, cy, x1, cy + h1 * 0.5);
  ctx.lineTo(x0, cy + h0 * 0.5);
  ctx.closePath();
  const grd = ctx.createLinearGradient(x0, cy - h0, x1, cy + h0);
  grd.addColorStop(0, "#d7cfc2");
  grd.addColorStop(0.4, "#f7f3ec");
  grd.addColorStop(1, "#7a7268");
  ctx.fillStyle = grd;
  ctx.fill();
  ctx.strokeStyle = "#2a2622";
  ctx.lineWidth = Math.max(2, r * 0.013);
  ctx.stroke();
  ctx.fillStyle = "#161412";
  ctx.beginPath();
  ctx.ellipse(x1 - r * 0.012, cy, r * 0.034, h1 * 0.32, 0, 0, TWO_PI);
  ctx.fill();
  ctx.restore();
}

function drawFanHandleTip(r) {
  const w = r * 0.34;
  const y0 = r * 0.84;
  const y1 = r * 1.36;   /* пятка рукояти торчит за кромку — как и рисовалось всегда */
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  fanRound(ctx, -w * 0.5 + r * 0.012, y0 + r * 0.018, w, y1 - y0, r * 0.08);
  ctx.fill();
  const grd = ctx.createLinearGradient(-w, 0, w, 0);
  grd.addColorStop(0, "#2a2622");
  grd.addColorStop(0.22, "#6a6258");
  grd.addColorStop(0.5, "#8a8278");
  grd.addColorStop(0.78, "#4a453f");
  grd.addColorStop(1, "#1c1916");
  ctx.fillStyle = grd;
  fanRound(ctx, -w * 0.5, y0, w, y1 - y0, r * 0.09);
  ctx.fill();
  ctx.strokeStyle = "#241f1c";
  ctx.lineWidth = Math.max(2, r * 0.014);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = Math.max(1, r * 0.007);
  ctx.beginPath();
  ctx.moveTo(-w * 0.16, y0 + r * 0.04);
  ctx.lineTo(-w * 0.12, y1 - r * 0.08);
  ctx.stroke();
  ctx.strokeStyle = "rgba(20, 16, 12, 0.55)";
  ctx.lineWidth = Math.max(1.2, r * 0.01);
  for (let i = 0; i < 3; i++) {
    const y = y0 + r * 0.08 + i * r * 0.09;
    ctx.beginPath();
    ctx.moveTo(-w * 0.32, y);
    ctx.lineTo(w * 0.32, y);
    ctx.stroke();
  }
  ctx.fillStyle = "#2a2622";
  ctx.beginPath();
  ctx.ellipse(0, y1 - r * 0.035, w * 0.32, r * 0.04, 0, 0, TWO_PI);
  ctx.fill();
  ctx.restore();
}

function drawFanLed(r, st, heat) {
  const x = -r * 0.7;
  const y = r * 0.16;
  const col = st >= FAN_STAGE_3 ? "#ff5424" : st >= FAN_STAGE_2 ? "#ff9a3a" : "#8fd0ea";
  ctx.save();
  ctx.fillStyle = col;
  ctx.globalAlpha = 0.85 + Math.min(0.15, heat * 0.2);
  ctx.beginPath();
  ctx.arc(x, y, r * 0.016, 0, TWO_PI);
  ctx.fill();
  if (st >= FAN_STAGE_2) {
    ctx.globalAlpha = 0.12 + heat * 0.18;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.04, 0, TWO_PI);
    ctx.fill();
  }
  ctx.restore();
}

function drawFanAir(r, st) {
  if (st < FAN_STAGE_2) return;
  const hot = st >= FAN_STAGE_3;
  const n = hot ? 6 : 4;
  const t = game.time * (hot ? 0.0036 : 0.0022);
  const y0 = r * FAN_CY;
  const reach = r * (hot ? 0.26 : 0.14);   /* струйки вылетают из сопла за кромку бревна */
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineWidth = Math.max(1, r * 0.007);
  ctx.strokeStyle = hot ? "rgba(255, 214, 180, 0.9)" : "rgba(255,255,255,0.8)";
  for (let i = 0; i < n; i++) {
    const u = (t + i / n) % 1;
    const y = y0 + (i - (n - 1) * 0.5) * r * 0.026;
    const x = r * 1.02 + u * reach;
    ctx.globalAlpha = (1 - u) * (hot ? 0.36 : 0.2);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + r * (0.035 + u * 0.05), y);
    ctx.stroke();
  }
  if (hot) {
    ctx.strokeStyle = "rgba(255, 186, 130, 0.85)";
    const rad = r * (FAN_HOLE + 0.15);
    for (let i = 0; i < 3; i++) {
      const u = (t * 1.15 + i * 0.31) % 1;
      const a = FAN_VENTS[i];
      const x = r * FAN_CX + Math.cos(a) * rad;
      const y = r * FAN_CY + Math.sin(a) * rad;
      ctx.globalAlpha = (1 - u) * 0.26;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * r * 0.07 * (0.35 + u), y + Math.sin(a) * r * 0.07 * (0.35 + u));
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawFanLive(r) {
  const log = game.log;
  const st = log.fanStage || FAN_STAGE_1;
  const heat = log.fanHeat || 0;
  const pulse = log.fanPulse || 0;
  drawFanWash(r, heat, pulse);
  drawFanVents(r, heat);
  drawFanRotor(r);
  drawFanNozzleLip(r);
  drawFanHandleTip(r);
  drawFanLed(r, st, heat);
  drawFanAir(r, st);
}
