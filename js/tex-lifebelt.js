function makeLifebeltTex() {
  /* фото: спасательный круг сверху — диском; дырку рисует сам рисунок */
  const photo = bossPhotoTex("lifebelt");
  if (photo) return photo;
  const size = BOSS_TEX;
  const R = BOSS_TEX_R - 1;
  const hole = R * LIFEBELT_DRAW_HOLE;
  const outer = R;
  const thick = outer - hole;
  const crest = hole + thick * 0.5;
  const [c, g] = makeCanvas(size, size);
  g.translate(size * 0.5, size * 0.5);
  g.lineJoin = "round";
  g.lineCap = "round";

  const n = 8;
  const slot = TWO_PI / n;

  function sector(r0, r1, a0, a1) {
    g.beginPath();
    g.arc(0, 0, r1, a0, a1);
    g.arc(0, 0, r0, a1, a0, true);
    g.closePath();
  }

  function tubePaint(red) {
    const grd = g.createRadialGradient(0, 0, hole, 0, 0, outer);
    if (red) {
      grd.addColorStop(0, "#3a0812");
      grd.addColorStop(0.05, "#7a1224");
      grd.addColorStop(0.13, "#ff7d88");
      grd.addColorStop(0.22, "#c41230");
      grd.addColorStop(0.4, "#ff3652");
      grd.addColorStop(0.52, "#ff6a78");
      grd.addColorStop(0.66, "#e1062c");
      grd.addColorStop(0.8, "#a01024");
      grd.addColorStop(0.92, "#6a1020");
      grd.addColorStop(1, "#2e0610");
    } else {
      grd.addColorStop(0, "#5e656e");
      grd.addColorStop(0.05, "#a4aab2");
      grd.addColorStop(0.13, "#ffffff");
      grd.addColorStop(0.22, "#e7ebf0");
      grd.addColorStop(0.4, "#ffffff");
      grd.addColorStop(0.52, "#ffffff");
      grd.addColorStop(0.66, "#f4f6f8");
      grd.addColorStop(0.8, "#d0d5dc");
      grd.addColorStop(0.92, "#9aa1aa");
      grd.addColorStop(1, "#4e555e");
    }
    return grd;
  }

  g.save();
  g.beginPath();
  g.arc(0, 0, outer, 0, TWO_PI);
  g.arc(0, 0, hole, 0, TWO_PI, true);
  g.clip("evenodd");

  for (let i = 0; i < n; i++) {
    const a0 = -Math.PI / 2 + i * slot;
    sector(hole - 2, outer + 2, a0 - 0.01, a0 + slot + 0.01);
    g.fillStyle = tubePaint(i % 2 === 0);
    g.fill();
  }

  const sky = g.createLinearGradient(0, -outer, 0, outer);
  sky.addColorStop(0, "rgba(255,255,255,0.5)");
  sky.addColorStop(0.22, "rgba(255,255,255,0.16)");
  sky.addColorStop(0.48, "rgba(255,255,255,0)");
  sky.addColorStop(0.74, "rgba(28, 8, 14, 0.16)");
  sky.addColorStop(1, "rgba(16, 4, 8, 0.4)");
  g.fillStyle = sky;
  g.fillRect(-outer, -outer, outer * 2, outer * 2);

  const side = g.createLinearGradient(-outer, 0, outer, 0);
  side.addColorStop(0, "rgba(20, 6, 12, 0.2)");
  side.addColorStop(0.18, "rgba(255,255,255,0.05)");
  side.addColorStop(0.5, "rgba(255,255,255,0)");
  side.addColorStop(0.82, "rgba(255,255,255,0.04)");
  side.addColorStop(1, "rgba(12, 4, 8, 0.22)");
  g.fillStyle = side;
  g.fillRect(-outer, -outer, outer * 2, outer * 2);

  for (let i = 0; i < n; i++) {
    const a0 = -Math.PI / 2 + i * slot;
    const mid = a0 + slot * 0.5;
    const red = i % 2 === 0;
    const px = Math.cos(mid) * crest;
    const py = Math.sin(mid) * crest;
    g.save();
    sector(hole, outer, a0, a0 + slot);
    g.clip();
    const puff = g.createRadialGradient(px, py, thick * 0.04, px, py, thick * 0.62);
    puff.addColorStop(0, red ? "rgba(255, 214, 220, 0.55)" : "rgba(255,255,255,0.72)");
    puff.addColorStop(0.45, red ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.16)");
    puff.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = puff;
    g.beginPath();
    g.arc(px, py, thick * 0.66, 0, TWO_PI);
    g.fill();
    g.restore();
  }

  function groove(rad) {
    g.strokeStyle = "rgba(24, 8, 14, 0.38)";
    g.lineWidth = Math.max(6, R * 0.028);
    g.beginPath();
    g.arc(0, 0, rad, 0, TWO_PI);
    g.stroke();
    g.strokeStyle = "rgba(255,255,255,0.42)";
    g.lineWidth = Math.max(2.5, R * 0.012);
    g.beginPath();
    g.arc(0, 0, rad - R * 0.012, -2.7, -0.4);
    g.stroke();
  }
  groove(hole + thick * 0.34);
  groove(hole + thick * 0.7);

  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + i * slot;
    g.save();
    g.rotate(a);
    const w = Math.max(8, R * 0.034);
    g.fillStyle = "rgba(20, 6, 12, 0.28)";
    g.fillRect(hole, -w * 0.85, thick, w * 1.7);
    g.fillStyle = i % 2 === 0 ? "#fffdfb" : "#e1062c";
    g.fillRect(hole + thick * 0.08, w * 0.15, thick * 0.84, Math.max(3, R * 0.012));
    g.fillStyle = "#2a0610";
    g.fillRect(hole, -w * 0.5, thick, w);
    g.strokeStyle = "rgba(255,255,255,0.55)";
    g.lineWidth = Math.max(2, R * 0.01);
    for (let s = 0; s < 4; s++) {
      const x = hole + thick * (0.18 + s * 0.2);
      g.beginPath();
      g.moveTo(x, -w * 0.95);
      g.lineTo(x, w * 0.95);
      g.stroke();
    }
    g.restore();
  }

  const innerW = thick * 0.16;
  const innerRim = g.createLinearGradient(0, -outer, 0, outer);
  innerRim.addColorStop(0, "rgba(255,255,255,0.92)");
  innerRim.addColorStop(0.28, "rgba(255,255,255,0.28)");
  innerRim.addColorStop(0.55, "rgba(40, 10, 16, 0.15)");
  innerRim.addColorStop(0.78, "rgba(24, 6, 12, 0.45)");
  innerRim.addColorStop(1, "rgba(10, 2, 6, 0.72)");
  g.strokeStyle = innerRim;
  g.lineWidth = innerW;
  g.beginPath();
  g.arc(0, 0, hole + innerW * 0.48, 0, TWO_PI);
  g.stroke();

  g.strokeStyle = "rgba(8, 2, 6, 0.55)";
  g.lineWidth = Math.max(8, R * 0.04);
  g.beginPath();
  g.arc(0, 0, hole + g.lineWidth * 0.35, 0, TWO_PI);
  g.stroke();

  g.strokeStyle = "rgba(255,255,255,0.78)";
  g.lineWidth = Math.max(3.5, R * 0.016);
  g.beginPath();
  g.arc(0, 0, hole + thick * 0.1, -2.85, -0.28);
  g.stroke();

  const outerW = thick * 0.075;
  const outerRim = g.createLinearGradient(0, -outer, 0, outer);
  outerRim.addColorStop(0, "rgba(255,255,255,0.75)");
  outerRim.addColorStop(0.4, "rgba(255,255,255,0.12)");
  outerRim.addColorStop(1, "rgba(12, 4, 8, 0.55)");
  g.strokeStyle = outerRim;
  g.lineWidth = outerW;
  g.beginPath();
  g.arc(0, 0, outer - outerW * 0.55, 0, TWO_PI);
  g.stroke();

  g.strokeStyle = "rgba(255,255,255,0.82)";
  g.lineWidth = Math.max(7, thick * 0.07);
  g.beginPath();
  g.arc(0, 0, crest + thick * 0.02, -2.45, -0.7);
  g.stroke();
  g.strokeStyle = "rgba(255,255,255,0.95)";
  g.lineWidth = Math.max(3, thick * 0.028);
  g.beginPath();
  g.arc(0, 0, crest, -2.15, -1.05);
  g.stroke();

  for (let i = 0; i < n; i++) {
    const mid = -Math.PI / 2 + (i + 0.5) * slot;
    const red = i % 2 === 0;
    g.save();
    g.rotate(mid);
    if (red) {
      const rad = hole + thick * 0.56;
      g.translate(rad, 0);
      const pw = thick * 0.5;
      const ph = thick * 0.4;
      const rr = thick * 0.08;
      g.fillStyle = "rgba(40, 6, 12, 0.4)";
      g.beginPath();
      if (g.roundRect) g.roundRect(-pw * 0.5 + 3, -ph * 0.5 + 4, pw, ph, rr);
      else g.rect(-pw * 0.5 + 3, -ph * 0.5 + 4, pw, ph);
      g.fill();
      const plate = g.createLinearGradient(0, -ph, 0, ph);
      plate.addColorStop(0, "#ff8b96");
      plate.addColorStop(0.35, "#ff2f4a");
      plate.addColorStop(0.72, "#c0102c");
      plate.addColorStop(1, "#6e0c1a");
      g.fillStyle = plate;
      g.beginPath();
      if (g.roundRect) g.roundRect(-pw * 0.5, -ph * 0.5, pw, ph, rr);
      else g.rect(-pw * 0.5, -ph * 0.5, pw, ph);
      g.fill();
      g.strokeStyle = "rgba(255, 230, 232, 0.7)";
      g.lineWidth = Math.max(2, R * 0.01);
      g.stroke();
      g.strokeStyle = "rgba(48, 6, 14, 0.55)";
      g.lineWidth = Math.max(3, R * 0.016);
      g.beginPath();
      g.moveTo(-pw * 0.28, -ph * 0.16);
      g.lineTo(pw * 0.22, -ph * 0.16);
      g.moveTo(-pw * 0.28, ph * 0.16);
      g.lineTo(pw * 0.22, ph * 0.16);
      g.stroke();
      const reach = outer - rad - R * 0.03;
      const spike = g.createLinearGradient(reach, 0, pw * 0.1, 0);
      spike.addColorStop(0, "#ffe4e8");
      spike.addColorStop(0.35, "#ff4d62");
      spike.addColorStop(1, "#8a1022");
      g.fillStyle = spike;
      g.beginPath();
      g.moveTo(reach, 0);
      g.lineTo(pw * 0.42, ph * 0.46);
      g.lineTo(pw * 0.16, ph * 0.18);
      g.lineTo(pw * 0.16, -ph * 0.18);
      g.lineTo(pw * 0.42, -ph * 0.46);
      g.closePath();
      g.fill();
      g.strokeStyle = "#3a0812";
      g.lineWidth = Math.max(2.4, R * 0.012);
      g.stroke();
      g.strokeStyle = "rgba(255,255,255,0.7)";
      g.lineWidth = Math.max(1.6, R * 0.008);
      g.beginPath();
      g.moveTo(reach - R * 0.02, -R * 0.012);
      g.lineTo(pw * 0.28, -ph * 0.28);
      g.stroke();
    } else {
      const rad = outer - thick * 0.22;
      g.translate(rad, 0);
      const reach = outer - rad - R * 0.034;
      const spike = g.createLinearGradient(reach, 0, -thick * 0.02, 0);
      spike.addColorStop(0, "#ffffff");
      spike.addColorStop(0.4, "#f2f4f7");
      spike.addColorStop(1, "#b7bec6");
      g.fillStyle = spike;
      g.beginPath();
      g.moveTo(reach, 0);
      g.lineTo(thick * 0.02, thick * 0.13);
      g.lineTo(-thick * 0.06, thick * 0.05);
      g.lineTo(-thick * 0.06, -thick * 0.05);
      g.lineTo(thick * 0.02, -thick * 0.13);
      g.closePath();
      g.fill();
      g.strokeStyle = "#6e1020";
      g.lineWidth = Math.max(2.2, R * 0.011);
      g.stroke();
      const bx = -thick * 0.34;
      const br = Math.max(11, R * 0.07);
      g.fillStyle = "rgba(30, 8, 14, 0.28)";
      g.beginPath();
      g.arc(bx + br * 0.15, br * 0.18, br, 0, TWO_PI);
      g.fill();
      const riv = g.createRadialGradient(bx - br * 0.35, -br * 0.4, br * 0.1, bx, 0, br);
      riv.addColorStop(0, "#ffffff");
      riv.addColorStop(0.45, "#e6eaef");
      riv.addColorStop(1, "#8e969f");
      g.fillStyle = riv;
      g.beginPath();
      g.arc(bx, 0, br, 0, TWO_PI);
      g.fill();
      g.strokeStyle = "#5c0814";
      g.lineWidth = Math.max(2, br * 0.16);
      g.stroke();
      g.strokeStyle = "rgba(70, 18, 28, 0.75)";
      g.lineWidth = Math.max(2, br * 0.18);
      g.beginPath();
      g.moveTo(bx - br * 0.42, 0);
      g.lineTo(bx + br * 0.42, 0);
      g.stroke();
    }
    g.restore();
  }

  g.restore();

  g.strokeStyle = "#4a0814";
  g.lineWidth = Math.max(5, R * 0.02);
  g.beginPath();
  g.arc(0, 0, outer - g.lineWidth * 0.35, 0, TWO_PI);
  g.stroke();
  g.strokeStyle = "#2a060e";
  g.lineWidth = Math.max(6, R * 0.026);
  g.beginPath();
  g.arc(0, 0, hole + g.lineWidth * 0.45, 0, TWO_PI);
  g.stroke();

  return c;
}
