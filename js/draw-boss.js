function drawBossStem(id, r) {
  if (id === "tomato") {
    if (bossHasPhoto(id)) return;
    ctx.save();
    ctx.fillStyle = "#3f7a22";
    ctx.strokeStyle = "#2a5416";
    ctx.lineWidth = Math.max(1.2, r * 0.012);
    /* листья и черешок помидора выходят за кромку бревна, как и рисовались
       всегда: самый дальний лист на 0.99 r, кончик черешка — на 1.2 r, поверх
       кромки. В круг бревна помидор не впихивать: стебель — часть рисунка */
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i / 5) * TWO_PI;
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * r * 0.18, -r * 0.9 + Math.sin(a) * r * 0.07, r * 0.13, r * 0.05, a, 0, TWO_PI);
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = "#4a8a28";
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-r * 0.038, -r * 1.2, r * 0.076, r * 0.3, r * 0.03);
    else ctx.rect(-r * 0.038, -r * 1.2, r * 0.076, r * 0.3);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  } else if (id === "pumpkin") {
    /* на фото тыквы черешок уже нарисован — свой поверх не рисуем */
    if (bossHasPhoto(id)) return;
    ctx.save();
    ctx.fillStyle = "#4a7a22";
    ctx.strokeStyle = "#2e5414";
    ctx.lineWidth = Math.max(1.2, r * 0.012);
    ctx.beginPath();
    /* черешок тыквы торчит за кромку, как и рисовался всегда: кончик на 1.18 r */
    if (ctx.roundRect) ctx.roundRect(-r * 0.08, -r * 1.18, r * 0.16, r * 0.3, r * 0.05);
    else ctx.rect(-r * 0.08, -r * 1.18, r * 0.16, r * 0.3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#3a5c18";
    ctx.fillRect(-r * 0.022, -r * 1.14, r * 0.044, r * 0.24);
    ctx.restore();
  } else if (id === "balloon") {
    /* шейка, узел и нитка. Тело кончается на собранном дне силуэта, оттуда
       выходит короткая стянутая шейка, её перетягивает узел, а из узла свисает
       нитка. Дальше спрайта всё равно не видно, поэтому завиток короткий.
       Цвета берём у текущего оттенка латекса (BALLOON_SKINS), чтобы шейка
       совпадала с телом и на красном, и на синем, и на зелёном */
    const skin = balloonSkin(game.log.balloonN | 0);
    const tip = r * BALLOON_NECK_TIP;
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    /* шейка: узкий валик, чуть расширенный кверху — так он читается стянутым.
       Верх валика спрятан в теле шарика, поэтому стыка не видно */
    ctx.fillStyle = skin.knot[1];
    ctx.strokeStyle = skin.outline;
    ctx.lineWidth = Math.max(1.3, r * 0.013);
    ctx.beginPath();
    ctx.moveTo(-r * 0.06, tip - r * 0.07);
    ctx.quadraticCurveTo(-r * 0.052, tip + r * 0.04, -r * 0.033, tip + r * 0.1);
    ctx.lineTo(r * 0.033, tip + r * 0.1);
    ctx.quadraticCurveTo(r * 0.052, tip + r * 0.04, r * 0.06, tip - r * 0.07);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = skin.knotEdge;
    ctx.lineWidth = Math.max(0.8, r * 0.008);
    ctx.beginPath();
    ctx.moveTo(-r * 0.046, tip - r * 0.05);
    ctx.lineTo(-r * 0.028, tip + r * 0.08);
    ctx.stroke();
    /* узел: шарик, перетягивающий шейку */
    ctx.fillStyle = skin.knot[0];
    ctx.strokeStyle = skin.outline;
    ctx.lineWidth = Math.max(1.2, r * 0.012);
    ctx.beginPath();
    ctx.ellipse(0, tip + r * 0.135, r * 0.056, r * 0.044, 0, 0, TWO_PI);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = skin.knot[2];
    ctx.beginPath();
    ctx.ellipse(r * 0.014, tip + r * 0.148, r * 0.023, r * 0.016, 0.3, 0, TWO_PI);
    ctx.fill();
    /* нитка: завиток из узла свисает за кромку бревна, как и рисовался всегда —
       самый хвост доходит до 1.27 r (цвета берутся у текущего оттенка латекса) */
    ctx.strokeStyle = skin.thread;
    ctx.lineWidth = Math.max(1.3, r * 0.014);
    ctx.beginPath();
    ctx.moveTo(0, tip + r * 0.17);
    ctx.quadraticCurveTo(r * 0.09, tip + r * 0.25, r * 0.015, tip + r * 0.31);
    ctx.quadraticCurveTo(-r * 0.055, tip + r * 0.36, r * 0.03, tip + r * 0.42);
    ctx.stroke();
    ctx.strokeStyle = skin.threadShade;
    ctx.lineWidth = Math.max(0.7, r * 0.006);
    ctx.beginPath();
    ctx.moveTo(r * 0.006, tip + r * 0.185);
    ctx.quadraticCurveTo(r * 0.1, tip + r * 0.26, r * 0.024, tip + r * 0.32);
    ctx.stroke();
    ctx.restore();
  }
}

function paintBall(g, r) {
  g.save();
  g.beginPath();
  g.arc(0, 0, r, 0, TWO_PI);
  g.clip();
  const skin = g.createRadialGradient(-r * 0.22, -r * 0.26, r * 0.04, r * 0.08, r * 0.06, r);
  skin.addColorStop(0, "#3a3a3a");
  skin.addColorStop(0.28, "#161616");
  skin.addColorStop(0.72, "#0c0c0c");
  skin.addColorStop(1, "#050505");
  g.fillStyle = skin;
  g.fillRect(-r, -r, r * 2, r * 2);
  const nx = r * 0.16;
  const ny = -r * 0.04;
  const nr = r * 0.32;
  g.fillStyle = "rgba(0,0,0,0.35)";
  g.beginPath();
  g.ellipse(nx + r * 0.02, ny + r * 0.045, nr, nr * 0.94, 0, 0, TWO_PI);
  g.fill();
  g.fillStyle = "#f4f1ea";
  g.beginPath();
  g.arc(nx, ny, nr, 0, TWO_PI);
  g.fill();
  g.lineWidth = Math.max(1.4, r * 0.016);
  g.strokeStyle = "rgba(0,0,0,0.28)";
  g.stroke();
  g.fillStyle = "#111111";
  g.font = "800 " + Math.round(r * 0.4) + "px Unbounded, Manrope, sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("8", nx, ny + r * 0.02);
  g.restore();
}

function drawBossDegrade(boss, r, t) {
  const id = boss.id;
  if (id === "disco") {
    /* Диск-шар гаснет: зеркала мутнеют, часть плитки выбита в темноту.
       Свет уходит к кромке — шар ещё висит, но уже не играет */
    ctx.fillStyle = `rgba(10, 14, 24, ${t * 0.36})`;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TWO_PI);
    ctx.fill();
    if (t > 0.18) {
      ctx.fillStyle = `rgba(4, 6, 12, ${(t - 0.14) * 0.62})`;
      for (let i = 0; i < 5; i++) {
        const a = hash(140, i) * TWO_PI;
        const rr = r * (0.16 + hash(141, i) * 0.66);
        ctx.beginPath();
        ctx.arc(Math.cos(a) * rr, Math.sin(a) * rr, r * (0.06 + hash(142, i) * 0.06), 0, TWO_PI);
        ctx.fill();
      }
    }
  } else if (id === "tomato") {
    if (bossHasPhoto(id)) return;
    ctx.fillStyle = `rgba(72, 12, 8, ${t * 0.14})`;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TWO_PI);
    ctx.fill();
  } else if (id === "heart") {
    ctx.fillStyle = `rgba(40, 0, 8, ${t * 0.38})`;
    fillShape("heart", r);
    ctx.fillStyle = `rgba(90, 4, 16, ${0.18 + t * 0.52})`;
    ctx.beginPath();
    ctx.ellipse(0, r * 0.1, r * (0.055 + t * 0.11), r * (0.04 + t * 0.09), 0, 0, TWO_PI);
    ctx.fill();
    if (t > 0.28) {
      ctx.strokeStyle = `rgba(70, 6, 14, ${(t - 0.2) * 0.7})`;
      ctx.lineWidth = Math.max(1.4, r * 0.018 * t);
      ctx.lineCap = "round";
      for (let i = 0; i < 6; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const y0 = -r * 0.28 + i * r * 0.1;
        ctx.beginPath();
        ctx.moveTo(side * r * 0.04, y0);
        ctx.bezierCurveTo(side * r * 0.22, y0 + r * 0.04, side * r * 0.38, y0 - r * 0.03, side * r * 0.5, y0 + r * 0.08);
        ctx.stroke();
      }
    }
  } else if (id === "marmalade") {
    ctx.fillStyle = `rgba(255,255,255,${t * 0.2})`;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TWO_PI);
    ctx.fill();
    const bites = Math.min(6, Math.floor(t * 7));
    for (let i = 0; i < bites; i++) {
      const a = hash(70, i) * TWO_PI;
      ctx.fillStyle = `rgba(255, 236, 242, ${0.45 + t * 0.4})`;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9, r * (0.07 + hash(71, i) * 0.05), 0, TWO_PI);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.75)";
      ctx.lineWidth = Math.max(1.2, r * 0.012);
      ctx.stroke();
    }
    if (t > 0.28) {
      ctx.fillStyle = `rgba(255, 90, 140, ${(t - 0.22) * 0.7})`;
      for (let i = 0; i < 3; i++) {
        const a = 0.85 + i * 0.38;
        ctx.beginPath();
        ctx.ellipse(Math.cos(a) * r * 0.68, Math.sin(a) * r * 0.68, r * 0.034, r * (0.09 + t * 0.12), a, 0, TWO_PI);
        ctx.fill();
      }
    }
  } else if (id === "pumpkin") {
    ctx.fillStyle = `rgba(40, 12, 4, ${t * 0.42})`;
    ctx.beginPath();
    ctx.arc(0, 0, r * (0.09 + t * 0.17), 0, TWO_PI);
    ctx.fill();
    if (t > 0.22) {
      ctx.strokeStyle = `rgba(240, 176, 72, ${t * 0.42})`;
      ctx.lineWidth = Math.max(1.1, r * 0.01);
      ctx.lineCap = "round";
      for (let i = 0; i < 10; i++) {
        const a = hash(90, i) * TWO_PI;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r * 0.08, Math.sin(a) * r * 0.08);
        ctx.quadraticCurveTo(Math.cos(a + 0.45) * r * 0.28, Math.sin(a + 0.45) * r * 0.28, Math.cos(a) * r * 0.52, Math.sin(a) * r * 0.52);
        ctx.stroke();
      }
    }
    if (t > 0.38) {
      for (let i = 0; i < 8; i++) {
        const a = -Math.PI / 2 + (i / 8) * TWO_PI;
        const d = r * (0.32 + (t - 0.38) * 0.22);
        ctx.fillStyle = `rgba(248, 216, 130, ${Math.min(1, (t - 0.38) * 1.6)})`;
        ctx.beginPath();
        ctx.ellipse(Math.cos(a) * d, Math.sin(a) * d, r * 0.038, r * 0.068, a, 0, TWO_PI);
        ctx.fill();
        ctx.strokeStyle = "rgba(90, 40, 10, 0.45)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  } else if (id === "saw") {
    ctx.strokeStyle = `rgba(40, 46, 54, ${0.15 + t * 0.45})`;
    ctx.lineWidth = Math.max(1, r * 0.012);
    ctx.lineCap = "round";
    for (let i = 0; i < 8; i++) {
      if (t < i * 0.1) continue;
      const a = hash(120, i) * TWO_PI;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.2, Math.sin(a) * r * 0.2);
      ctx.lineTo(Math.cos(a + 0.2) * r * 0.7, Math.sin(a + 0.2) * r * 0.7);
      ctx.stroke();
    }
    const chips = Math.min(SAW_TEETH, Math.floor(t * SAW_TEETH));
    for (let i = 0; i < chips; i++) {
      const a = (i + 0.5) * (TWO_PI / SAW_TEETH);
      ctx.fillStyle = `rgba(28, 32, 38, ${0.35 + t * 0.45})`;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.82, Math.sin(a) * r * 0.82);
      ctx.lineTo(Math.cos(a - 0.08) * r, Math.sin(a - 0.08) * r);
      ctx.lineTo(Math.cos(a + 0.08) * r, Math.sin(a + 0.08) * r);
      ctx.closePath();
      ctx.fill();
    }
    if (t > 0.35) {
      ctx.strokeStyle = `rgba(255, 150, 60, ${(t - 0.35) * 0.7})`;
      ctx.lineWidth = Math.max(1.4, r * 0.02);
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.72, 0, TWO_PI);
      ctx.stroke();
    }
  } else if (id === "ball") {
    const scuffs = Math.min(8, Math.floor(t * 9));
    for (let i = 0; i < scuffs; i++) {
      const a = hash(160, i) * TWO_PI;
      const d = (0.12 + hash(161, i) * 0.74) * r;
      ctx.fillStyle = `rgba(248, 244, 236, ${0.16 + t * 0.5})`;
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * d, Math.sin(a) * d, r * (0.045 + hash(162, i) * 0.07), r * 0.026, a + 0.5, 0, TWO_PI);
      ctx.fill();
    }
    if (t > 0.3) {
      ctx.strokeStyle = `rgba(255, 255, 255, ${(t - 0.28) * 0.65})`;
      ctx.lineWidth = Math.max(1, r * 0.011);
      ctx.lineCap = "round";
      for (let i = 0; i < 5; i++) {
        if (t < 0.3 + i * 0.1) continue;
        const a = hash(170, i) * TWO_PI;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r * 0.1, Math.sin(a) * r * 0.1);
        ctx.lineTo(Math.cos(a + 0.2) * r * 0.8, Math.sin(a + 0.2) * r * 0.8);
        ctx.stroke();
      }
    }
  } else if (id === "valve") {
    const pits = Math.min(7, Math.floor(t * 8));
    for (let i = 0; i < pits; i++) {
      const a = hash(240, i) * TWO_PI;
      const d = (0.2 + hash(241, i) * 0.66) * r;
      ctx.fillStyle = `rgba(8, 10, 12, ${0.16 + t * 0.42})`;
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * d, Math.sin(a) * d, r * (0.03 + hash(242, i) * 0.045), r * 0.02, a, 0, TWO_PI);
      ctx.fill();
    }
    if (t > 0.18) {
      ctx.strokeStyle = `rgba(232, 236, 240, ${(t - 0.14) * 0.5})`;
      ctx.lineWidth = Math.max(1, r * 0.01);
      ctx.lineCap = "round";
      for (let i = 0; i < 6; i++) {
        if (t < 0.18 + i * 0.08) continue;
        const a = -Math.PI / 2 + i * (TWO_PI / 6) + 0.06;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r * 0.28, Math.sin(a) * r * 0.28);
        ctx.lineTo(Math.cos(a + 0.04) * r * 0.78, Math.sin(a + 0.04) * r * 0.78);
        ctx.stroke();
      }
    }
    if (t > 0.46) {
      ctx.strokeStyle = `rgba(8, 10, 12, ${(t - 0.4) * 0.9})`;
      ctx.lineWidth = Math.max(2.2, r * 0.04);
      ctx.lineCap = "butt";
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.9, 0.35, 0.35 + (t - 0.4) * 1.5);
      ctx.stroke();
    }
  } else if (id === "fan") {
    const scuffs = Math.min(6, Math.floor(t * 7));
    for (let i = 0; i < scuffs; i++) {
      const a = hash(880, i) * TWO_PI;
      const d = (0.62 + hash(881, i) * 0.3) * r;
      ctx.fillStyle = `rgba(28, 24, 20, ${0.12 + t * 0.32})`;
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * d, Math.sin(a) * d, r * (0.028 + hash(882, i) * 0.03), r * 0.014, a, 0, TWO_PI);
      ctx.fill();
    }
    if (t > 0.34) {
      ctx.strokeStyle = `rgba(255, 236, 220, ${(t - 0.28) * 0.4})`;
      ctx.lineWidth = Math.max(1, r * 0.008);
      ctx.lineCap = "round";
      for (let i = 0; i < 4; i++) {
        if (t < 0.34 + i * 0.1) continue;
        const a = hash(890, i) * TWO_PI;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62);
        ctx.lineTo(Math.cos(a + 0.08) * r * 0.9, Math.sin(a + 0.08) * r * 0.9);
        ctx.stroke();
      }
    }
  } else if (id === "lifebelt") {
    const nips = Math.min(5, Math.floor(t * 6));
    const mid = r * (LIFEBELT_DRAW_HOLE + 1) * 0.5;
    for (let i = 0; i < nips; i++) {
      const a = hash(960, i) * TWO_PI;
      ctx.fillStyle = `rgba(90, 8, 18, ${0.16 + t * 0.4})`;
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * mid, Math.sin(a) * mid, r * 0.04, r * 0.02, a, 0, TWO_PI);
      ctx.fill();
    }
    if (t > 0.4) {
      ctx.strokeStyle = `rgba(90, 8, 18, ${(t - 0.32) * 0.7})`;
      ctx.lineWidth = Math.max(1.2, r * 0.012);
      ctx.lineCap = "round";
      const a = hash(970, 1) * TWO_PI;
      ctx.beginPath();
      ctx.arc(0, 0, mid, a, a + (t - 0.32) * 1.2);
      ctx.stroke();
    }
  } else if (id === "candy") {
    const nips = Math.min(5, Math.floor(t * 6));
    for (let i = 0; i < nips; i++) {
      const a = hash(940, i) * TWO_PI;
      const d = (0.55 + hash(941, i) * 0.36) * r;
      ctx.fillStyle = `rgba(255, 248, 246, ${0.35 + t * 0.45})`;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * d, Math.sin(a) * d, r * (0.03 + hash(942, i) * 0.03), 0, TWO_PI);
      ctx.fill();
    }
  } else if (id === "aegis") {
    const gouges = Math.min(6, Math.floor(t * 7));
    for (let i = 0; i < gouges; i++) {
      const x = (hash(510, i) - 0.5) * r * 1.05;
      const y = (hash(511, i) - 0.42) * r * 1.25;
      ctx.fillStyle = `rgba(48, 26, 10, ${0.2 + t * 0.45})`;
      ctx.beginPath();
      ctx.ellipse(x, y, r * (0.028 + hash(512, i) * 0.03), r * 0.085, 0.08, 0, TWO_PI);
      ctx.fill();
    }
    if (t > 0.2) {
      ctx.strokeStyle = `rgba(92, 52, 24, ${(t - 0.16) * 0.85})`;
      ctx.lineWidth = Math.max(1, r * 0.012);
      ctx.lineCap = "round";
      const n = Math.min(4, Math.floor((t - 0.16) * 6));
      for (let i = 0; i < n; i++) {
        const x = (hash(520, i) - 0.5) * r * 0.7;
        ctx.beginPath();
        ctx.moveTo(x, -r * 0.32);
        ctx.lineTo(x + r * 0.035, r * 0.42);
        ctx.stroke();
      }
    }
    const popped = Math.min(AEGIS_RIVETS.length, Math.floor(t * AEGIS_RIVETS.length));
    for (let i = 0; i < popped; i++) {
      const p = AEGIS_RIVETS[i];
      ctx.fillStyle = `rgba(20, 12, 8, ${0.45 + t * 0.4})`;
      ctx.beginPath();
      ctx.arc(p.x * r, p.y * r, r * 0.03, 0, TWO_PI);
      ctx.fill();
    }
  } else if (id === "egg") {
    if (t > 0.12) {
      ctx.strokeStyle = `rgba(90, 70, 48, ${(t - 0.08) * 0.85})`;
      ctx.lineWidth = Math.max(1.1, r * 0.012);
      ctx.lineCap = "round";
      const n = Math.min(7, Math.floor(t * 8));
      for (let i = 0; i < n; i++) {
        const a = hash(80, i) * TWO_PI;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r * 0.06, Math.sin(a) * r * 0.08);
        ctx.quadraticCurveTo(Math.cos(a + 0.4) * r * 0.32, Math.sin(a + 0.3) * r * 0.38, Math.cos(a + 0.12) * r * 0.7, Math.sin(a + 0.08) * r * 0.58);
        ctx.stroke();
      }
    }
    if (t > 0.45) {
      ctx.fillStyle = `rgba(242, 196, 64, ${(t - 0.4) * 0.6})`;
      ctx.beginPath();
      ctx.ellipse(0, r * 0.06, r * (0.07 + t * 0.1), r * (0.09 + t * 0.12), 0, 0, TWO_PI);
      ctx.fill();
    }
  } else if (id === "pizza") {
    ctx.fillStyle = `rgba(80, 28, 12, ${t * 0.32})`;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.82, 0, TWO_PI);
    ctx.fill();
    const burns = Math.min(10, Math.floor(t * 11));
    for (let i = 0; i < burns; i++) {
      const a = hash(310, i) * TWO_PI;
      const d = r * (0.84 + hash(311, i) * 0.1);
      ctx.fillStyle = `rgba(42, 16, 8, ${0.28 + t * 0.5})`;
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * d, Math.sin(a) * d, r * (0.035 + hash(312, i) * 0.04), r * 0.022, a, 0, TWO_PI);
      ctx.fill();
    }
    if (t > 0.28) {
      ctx.strokeStyle = `rgba(140, 36, 18, ${(t - 0.22) * 0.75})`;
      ctx.lineWidth = Math.max(1.1, r * 0.012);
      ctx.lineCap = "round";
      for (let i = 0; i < PIZZA_SLICES; i++) {
        if (t < 0.28 + i * 0.06) continue;
        const a = i * (TWO_PI / PIZZA_SLICES);
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r * 0.14, Math.sin(a) * r * 0.14);
        ctx.lineTo(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8);
        ctx.stroke();
      }
    }
  } else if (id === "donut") {
    if (bossHasPhoto(id)) return;
    const bites = Math.min(12, Math.floor(t * 14));
    for (let i = 0; i < bites; i++) {
      const a = hash(510, i) * TWO_PI;
      const d = r * (DONUT_HOLE + 0.07 + hash(511, i) * (0.86 - DONUT_HOLE));
      ctx.fillStyle = `rgba(255, 236, 244, ${0.32 + t * 0.4})`;
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * d, Math.sin(a) * d, r * (0.028 + hash(512, i) * 0.028), r * 0.015, a + 0.4, 0, TWO_PI);
      ctx.fill();
    }
    if (t > 0.18) {
      ctx.strokeStyle = `rgba(160, 36, 78, ${(t - 0.14) * 0.75})`;
      ctx.lineWidth = Math.max(1.1, r * 0.012);
      ctx.lineCap = "round";
      const n = Math.min(8, Math.floor(t * 9));
      for (let i = 0; i < n; i++) {
        const a = hash(520, i) * TWO_PI;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r * (DONUT_HOLE + 0.04), Math.sin(a) * r * (DONUT_HOLE + 0.04));
        ctx.lineTo(Math.cos(a + 0.08) * r * 0.92, Math.sin(a + 0.08) * r * 0.92);
        ctx.stroke();
      }
    }
  } else if (id === "dummy") {
    const n = Math.min(10, Math.floor(t * 12));
    ctx.strokeStyle = `rgba(92, 60, 28, ${0.25 + t * 0.6})`;
    ctx.lineWidth = Math.max(1.2, r * 0.014);
    ctx.lineCap = "round";
    for (let i = 0; i < n; i++) {
      const a = hash(80, i) * TWO_PI;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.2, Math.sin(a) * r * 0.2);
      ctx.lineTo(Math.cos(a + 0.2) * r * (0.55 + t * 0.3), Math.sin(a + 0.2) * r * (0.55 + t * 0.3));
      ctx.stroke();
    }
    if (t > 0.25) {
      ctx.fillStyle = `rgba(230, 200, 130, ${(t - 0.2) * 0.8})`;
      for (let i = 0; i < 7; i++) {
        const a = hash(90, i) * TWO_PI;
        const d = r * (0.4 + hash(91, i) * 0.45);
        ctx.save();
        ctx.translate(Math.cos(a) * d, Math.sin(a) * d);
        ctx.rotate(a);
        ctx.fillRect(-r * 0.01, 0, r * 0.09, r * 0.018);
        ctx.restore();
      }
    }
  } else if (id === "pepsi") {
    const dents = Math.min(9, Math.floor(t * 10));
    for (let i = 0; i < dents; i++) {
      const a = hash(1500, i) * TWO_PI;
      const d = (0.14 + hash(1501, i) * 0.7) * r;
      const px = Math.cos(a) * d;
      const py = Math.sin(a) * d;
      const rr = r * (0.05 + hash(1502, i) * 0.06);
      ctx.fillStyle = `rgba(24, 34, 54, ${0.16 + t * 0.4})`;
      ctx.beginPath();
      ctx.ellipse(px, py, rr, rr * 0.72, a, 0, TWO_PI);
      ctx.fill();
      ctx.strokeStyle = `rgba(226, 236, 250, ${0.18 + t * 0.4})`;
      ctx.lineWidth = Math.max(1, r * 0.008);
      ctx.beginPath();
      ctx.arc(px - rr * 0.2, py - rr * 0.3, rr * 1.02, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    }
    if (t > 0.22) {
      ctx.strokeStyle = `rgba(232, 240, 252, ${(t - 0.18) * 0.6})`;
      ctx.lineWidth = Math.max(1, r * 0.009);
      ctx.lineCap = "round";
      const n = Math.min(8, Math.floor(t * 9));
      for (let i = 0; i < n; i++) {
        const a = hash(1510, i) * TWO_PI;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r * 0.08, Math.sin(a) * r * 0.08);
        ctx.lineTo(Math.cos(a + 0.18) * r * 0.52, Math.sin(a + 0.18) * r * 0.52);
        ctx.lineTo(Math.cos(a + 0.4) * r * 0.86, Math.sin(a + 0.4) * r * 0.86);
        ctx.stroke();
      }
    }
    if (t > 0.5) {
      ctx.fillStyle = `rgba(182, 198, 216, ${(t - 0.44) * 0.3})`;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.99, 0, TWO_PI);
      ctx.fill();
    }
  } else if (id === "tire") {
    const cuts = Math.min(10, Math.floor(t * 11));
    ctx.lineCap = "round";
    for (let i = 0; i < cuts; i++) {
      const a = hash(2500, i) * TWO_PI;
      const d0 = (0.2 + hash(2501, i) * 0.6) * r;
      const d1 = d0 + r * (0.08 + hash(2502, i) * 0.14);
      ctx.strokeStyle = `rgba(4, 6, 8, ${0.3 + t * 0.5})`;
      ctx.lineWidth = Math.max(1.4, r * 0.012);
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * d0, Math.sin(a) * d0);
      ctx.lineTo(Math.cos(a + 0.2) * d1, Math.sin(a + 0.2) * d1);
      ctx.stroke();
    }
    if (t > 0.3) {
      const a = hash(2510, 1) * TWO_PI;
      ctx.fillStyle = `rgba(6, 8, 10, ${(t - 0.24) * 0.8})`;
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5, r * 0.09, r * 0.06, a, 0, TWO_PI);
      ctx.fill();
    }
    if (t > 0.55) {
      ctx.strokeStyle = `rgba(160, 168, 178, ${(t - 0.5) * 0.7})`;
      ctx.lineWidth = Math.max(1.2, r * 0.008);
      for (let i = 0; i < 5; i++) {
        const a = hash(2520, i) * TWO_PI;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r * 0.3, Math.sin(a) * r * 0.3);
        ctx.lineTo(Math.cos(a + 0.6) * r * 0.9, Math.sin(a + 0.6) * r * 0.9);
        ctx.stroke();
      }
    }
  } else if (id === "coin") {
    const scratches = Math.min(12, Math.floor(t * 13));
    ctx.lineCap = "round";
    for (let i = 0; i < scratches; i++) {
      const a = hash(2700, i) * TWO_PI;
      const d0 = r * (0.08 + hash(2701, i) * 0.78);
      const d1 = d0 + r * (0.06 + hash(2702, i) * 0.2);
      ctx.strokeStyle = hash(2703, i) > 0.45
        ? `rgba(255, 250, 226, ${0.3 + t * 0.4})`
        : `rgba(96, 62, 8, ${0.24 + t * 0.34})`;
      ctx.lineWidth = Math.max(1, r * 0.006);
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * d0, Math.sin(a) * d0);
      ctx.lineTo(Math.cos(a + 0.1) * d1, Math.sin(a + 0.1) * d1);
      ctx.stroke();
    }
    if (t > 0.3) {
      ctx.strokeStyle = `rgba(84, 54, 6, ${(t - 0.24) * 0.8})`;
      ctx.lineWidth = Math.max(1.6, r * 0.02);
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.9, 0.3, 0.3 + (t - 0.24) * 2.4);
      ctx.stroke();
    }
    if (t > 0.5) {
      ctx.fillStyle = `rgba(70, 44, 6, ${(t - 0.44) * 0.32})`;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, TWO_PI);
      ctx.fill();
    }
  } else if (id === "pie") {
    const splits = Math.min(10, Math.floor(t * 11));
    for (let i = 0; i < splits; i++) {
      const a = hash(3100, i) * TWO_PI;
      const d = r * (0.2 + hash(3101, i) * 0.66);
      ctx.strokeStyle = `rgba(86, 54, 18, ${0.26 + t * 0.5})`;
      ctx.lineWidth = Math.max(1.3, r * 0.011);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * d * 0.7, Math.sin(a) * d * 0.7);
      ctx.lineTo(Math.cos(a + 0.16) * d * 1.1, Math.sin(a + 0.16) * d * 1.1);
      ctx.lineTo(Math.cos(a + 0.06) * d * 1.5, Math.sin(a + 0.06) * d * 1.5);
      ctx.stroke();
      ctx.strokeStyle = `rgba(255, 236, 194, ${0.18 + t * 0.3})`;
      ctx.lineWidth = Math.max(1, r * 0.005);
      ctx.stroke();
    }
    if (t > 0.3) {
      ctx.fillStyle = `rgba(196, 120, 30, ${(t - 0.24) * 0.5})`;
      const n = Math.min(6, Math.floor((t - 0.24) * 9));
      for (let i = 0; i < n; i++) {
        const a = hash(3120, i) * TWO_PI;
        const d = r * (0.5 + hash(3121, i) * 0.44);
        ctx.beginPath();
        ctx.ellipse(Math.cos(a) * d, Math.sin(a) * d, r * 0.05, r * 0.028, a, 0, TWO_PI);
        ctx.fill();
      }
    }
    if (t > 0.5) {
      ctx.fillStyle = `rgba(72, 40, 8, ${(t - 0.44) * 0.4})`;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, TWO_PI);
      ctx.fill();
    }
  } else if (id === "cog") {
    /* сталь: не трещины, а задиры и стёртая кромка зубьев — деталь работала */
    const dents = Math.min(9, Math.floor(t * 10));
    ctx.lineCap = "round";
    for (let i = 0; i < dents; i++) {
      const a = hash(3300, i) * TWO_PI;
      const d0 = r * (0.3 + hash(3301, i) * 0.62);
      const d1 = d0 + r * (0.05 + hash(3302, i) * 0.16);
      ctx.strokeStyle = hash(3303, i) > 0.5
        ? `rgba(255,255,255,${0.18 + t * 0.32})`
        : `rgba(16, 20, 26, ${0.24 + t * 0.4})`;
      ctx.lineWidth = Math.max(1.2, r * 0.009);
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * d0, Math.sin(a) * d0);
      ctx.lineTo(Math.cos(a + 0.3) * d1, Math.sin(a + 0.3) * d1);
      ctx.stroke();
    }
    if (t > 0.3) {
      /* стёртые зубья: площадки слизываются — венец идёт волной */
      ctx.fillStyle = `rgba(52, 60, 70, ${(t - 0.24) * 0.6})`;
      const n = Math.min(4, Math.floor((t - 0.24) * 6));
      for (let i = 0; i < n; i++) {
        const a = hash(3310, i) * TWO_PI;
        ctx.beginPath();
        ctx.ellipse(Math.cos(a) * r * 0.94, Math.sin(a) * r * 0.94, r * 0.07, r * 0.035, a, 0, TWO_PI);
        ctx.fill();
      }
    }
    if (t > 0.5) {
      ctx.fillStyle = `rgba(38, 46, 56, ${(t - 0.44) * 0.34})`;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, TWO_PI);
      ctx.fill();
    }
  } else if (id === "tennis") {
    if (bossHasPhoto(id)) return;
    /* войлок: проплешины и расползающийся шов — мяч отработал своё */
    const bald = Math.min(7, Math.floor(t * 8));
    for (let i = 0; i < bald; i++) {
      const a = hash(3400, i) * TWO_PI;
      const d = r * (0.15 + hash(3401, i) * 0.75);
      ctx.fillStyle = hash(3402, i) > 0.5
        ? `rgba(126, 110, 78, ${0.14 + t * 0.4})`
        : `rgba(48, 60, 20, ${0.18 + t * 0.4})`;
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * d, Math.sin(a) * d, r * (0.05 + hash(3403, i) * 0.09), r * (0.03 + hash(3404, i) * 0.06), a, 0, TWO_PI);
      ctx.fill();
    }
    if (t > 0.34) {
      ctx.strokeStyle = `rgba(255, 255, 248, ${(t - 0.3) * 0.5})`;
      ctx.lineWidth = Math.max(1.2, r * 0.01);
      for (let i = 0; i < 4; i++) {
        const a = -0.6 + i * 0.42 + hash(3410, i) * 0.24;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r * 0.46, Math.sin(a) * r * 0.46);
        ctx.lineTo(Math.cos(a + 0.22) * r * 0.86, Math.sin(a + 0.22) * r * 0.86);
        ctx.stroke();
      }
    }
    if (t > 0.5) {
      ctx.fillStyle = `rgba(58, 74, 10, ${(t - 0.44) * 0.3})`;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, TWO_PI);
      ctx.fill();
    }
  }
}

function tomatoBelly(t) {
  const u = Math.min(1, Math.max(0, (t - 0.02) / 0.9));
  const bulge = Math.sin(Math.PI * Math.pow(u, 0.8));
  return 0.2 + 0.8 * Math.pow(bulge, 0.65);
}

function ringBelly(t) {
  return Math.pow(Math.sin(Math.PI * t), 0.42);
}

function fillProfilePoly(pts, last, r, widthAt) {
  if (last < 2) return false;
  ctx.beginPath();
  for (let i = 0; i < last; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(last - 1, i + 1)];
    let nx = b.y - a.y, ny = a.x - b.x;
    const len = Math.hypot(nx, ny) || 1;
    nx /= len;
    ny /= len;
    const w = widthAt(i / (last - 1), i);
    polyLX[i] = pts[i].x * r + nx * w;
    polyLY[i] = pts[i].y * r + ny * w;
    polyRX[i] = pts[i].x * r - nx * w;
    polyRY[i] = pts[i].y * r - ny * w;
  }
  ctx.moveTo(polyLX[0], polyLY[0]);
  for (let i = 1; i < last; i++) ctx.lineTo(polyLX[i], polyLY[i]);
  for (let i = last - 1; i >= 0; i--) ctx.lineTo(polyRX[i], polyRY[i]);
  ctx.closePath();
  return true;
}

function strokeStoredSide(xs, ys, last) {
  ctx.beginPath();
  ctx.moveTo(xs[0], ys[0]);
  for (let i = 1; i < last; i++) ctx.lineTo(xs[i], ys[i]);
  ctx.stroke();
}

function crackSample(pts, last, t) {
  const f = Math.min(last - 1.001, Math.max(0, t * (pts.length - 1)));
  const i = Math.floor(f);
  const u = f - i;
  const a = pts[i];
  const b = pts[Math.min(last - 1, i + 1)];
  let nx = b.y - a.y, ny = a.x - b.x;
  const len = Math.hypot(nx, ny) || 1;
  return {
    x: a.x + (b.x - a.x) * u,
    y: a.y + (b.y - a.y) * u,
    nx: nx / len,
    ny: ny / len
  };
}

function drawTomatoSeed(x, y, r, sc, rot) {
  const rx = r * 0.022 * sc;
  const ry = r * 0.012 * sc;
  ctx.fillStyle = "#f2d78a";
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, TWO_PI);
  ctx.fill();
  ctx.fillStyle = "rgba(122, 62, 16, 0.5)";
  ctx.beginPath();
  ctx.ellipse(x + Math.cos(rot) * rx * 0.15, y + Math.sin(rot) * rx * 0.15, rx * 0.26, ry * 0.34, rot, 0, TWO_PI);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.beginPath();
  ctx.ellipse(x - rx * 0.28, y - ry * 0.25, rx * 0.2, ry * 0.16, rot, 0, TWO_PI);
  ctx.fill();
}

function drawJuiceBead(x, y, rad) {
  ctx.fillStyle = "rgba(188, 24, 16, 0.9)";
  ctx.beginPath();
  ctx.arc(x, y, rad, 0, TWO_PI);
  ctx.fill();
  ctx.fillStyle = "rgba(255, 196, 160, 0.75)";
  ctx.beginPath();
  ctx.arc(x - rad * 0.28, y - rad * 0.32, rad * 0.28, 0, TWO_PI);
  ctx.fill();
}

function drawTomatoCore(r, t) {
  if (t < 0.08) return;
  const rad = r * (0.07 + t * 0.09);
  const g = ctx.createRadialGradient(-r * 0.01, -r * 0.015, r * 0.01, 0, 0, rad);
  g.addColorStop(0, `rgba(255, 214, 160, ${0.35 + t * 0.55})`);
  g.addColorStop(0.5, `rgba(226, 58, 32, ${0.2 + t * 0.4})`);
  g.addColorStop(1, "rgba(226, 58, 32, 0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, rad, 0, TWO_PI);
  ctx.fill();
}

function drawTomatoRing(c, r, dmg, maxHp) {
  const p = crackGrow(c, dmg, maxHp);
  if (p <= 0.02 || c.pts.length < 2) return;
  const last = c.pts.length;
  const gape = r * (c.gape || 0.012) * (0.4 + p * 0.7);
  if (!fillProfilePoly(c.pts, last, r, t => ringBelly(t) * gape)) return;
  ctx.fillStyle = `rgba(232, 198, 154, ${0.5 + p * 0.4})`;
  ctx.fill();
  ctx.strokeStyle = `rgba(110, 28, 16, ${0.35 + p * 0.35})`;
  ctx.lineWidth = Math.max(0.7, r * 0.0035);
  strokeStoredSide(polyLX, polyLY, last);
  strokeStoredSide(polyRX, polyRY, last);
  if (fillProfilePoly(c.pts, last, r, t => ringBelly(t) * gape * 0.4)) {
    ctx.fillStyle = `rgba(255, 228, 196, ${0.18 + p * 0.28})`;
    ctx.fill();
  }
}

function drawTomatoWrinkle(c, r, dmg, maxHp) {
  const p = crackGrow(c, dmg, maxHp);
  if (p <= 0.02 || c.pts.length < 2) return;
  const last = Math.max(2, Math.floor((c.pts.length - 1) * p) + 1);
  strokeCrackPts(c.pts, last, r, 0, 0);
  ctx.strokeStyle = `rgba(118, 26, 16, ${0.22 + p * 0.42})`;
  ctx.lineWidth = Math.max(0.7, r * 0.005);
  ctx.stroke();
}

function drawTomatoGash(c, r, dmg, maxHp) {
  const p = crackGrow(c, dmg, maxHp);
  if (p <= 0.02 || c.pts.length < 2) return;
  const full = c.pts.length;
  const last = Math.max(2, Math.floor((full - 1) * p) + 1);
  const open = 0.34 + p * 0.72;
  const gape = r * (c.gape || 0.04) * open;
  const deep = !!c.deep;
  const prof = (t, i) => {
    const along = i / Math.max(1, full - 1);
    let w = tomatoBelly(along) * gape * (0.78 + 0.22 * Math.sin(along * 9 + c.ang * 3));
    const tail = (last - 1) - i;
    if (tail < 2.2) {
      const end = p > 0.84 ? 0.55 + (p - 0.84) * 2.2 : 0;
      w *= Math.max(end, tail / 2.2);
    }
    return w;
  };
  if (fillProfilePoly(c.pts, last, r, (t, i) => prof(t, i) * 1.28)) {
    ctx.fillStyle = `rgba(120, 28, 18, ${0.16 + p * 0.2})`;
    ctx.fill();
  }
  if (fillProfilePoly(c.pts, last, r, prof)) {
    ctx.fillStyle = deep
      ? `rgba(78, 14, 10, ${0.78 + p * 0.16})`
      : `rgba(140, 32, 20, ${0.4 + p * 0.3})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(70, 12, 8, ${deep ? 0.45 : 0.3})`;
    ctx.lineWidth = Math.max(0.8, r * 0.004);
    ctx.stroke();
  }
  if (fillProfilePoly(c.pts, last, r, (t, i) => prof(t, i) * 0.72)) {
    ctx.fillStyle = deep
      ? "rgba(232, 52, 32, 0.96)"
      : `rgba(214, 58, 36, ${0.5 + p * 0.35})`;
    ctx.fill();
  }
  if (deep && p > 0.3 && fillProfilePoly(c.pts, last, r, (t, i) => {
    const along = i / Math.max(1, full - 1);
    const band = Math.sin(Math.PI * Math.min(1, Math.max(0, (along - 0.18) / 0.64)));
    return prof(t, i) * 0.46 * band;
  })) {
    ctx.fillStyle = `rgba(246, 188, 62, ${Math.min(0.96, (p - 0.3) * 1.45)})`;
    ctx.fill();
  }
  if (p > 0.22) {
    const lip = Math.max(r * 0.006, gape * 0.55);
    const ox = Math.cos(c.ang + Math.PI / 2) * lip;
    const oy = Math.sin(c.ang + Math.PI / 2) * lip;
    strokeCrackPts(c.pts, last, r, ox * 0.3, oy * 0.3);
    ctx.strokeStyle = `rgba(255, 236, 214, ${0.07 + p * 0.18})`;
    ctx.lineWidth = Math.max(0.6, r * 0.0032);
    ctx.stroke();
  }
  if (deep && c.seeds && p > 0.38) {
    for (let s = 0; s < c.seeds.length; s++) {
      const seed = c.seeds[s];
      if (seed.t < 0.22 || seed.t > 0.78 || seed.t > p * 0.98) continue;
      const q = crackSample(c.pts, last, seed.t);
      const w = tomatoBelly(seed.t) * gape * 0.14;
      drawTomatoSeed(q.x * r + q.nx * seed.side * w, q.y * r + q.ny * seed.side * w, r, seed.sc * 1.3, seed.rot);
    }
  }
  if (c.beads && p > 0.48) {
    for (let b = 0; b < c.beads.length; b++) {
      const bead = c.beads[b];
      if (bead.t > p) continue;
      const q = crackSample(c.pts, last, bead.t);
      const w = tomatoBelly(bead.t) * gape * 1.02;
      drawJuiceBead(
        q.x * r + q.nx * bead.side * w,
        q.y * r + q.ny * bead.side * w,
        r * 0.018 * bead.sc * (0.7 + p * 0.45)
      );
    }
  }
}

function drawTomatoWounds(r, dmg, cracks, maxHp) {
  const t = dmg / (maxHp || LOG_HP);
  drawTomatoCore(r, t);
  for (let i = 0; i < cracks.length; i++) if (cracks[i].kind === "ring") drawTomatoRing(cracks[i], r, dmg, maxHp);
  for (let i = 0; i < cracks.length; i++) if (cracks[i].kind === "wrinkle") drawTomatoWrinkle(cracks[i], r, dmg, maxHp);
  for (let i = 0; i < cracks.length; i++) if (cracks[i].kind === "pulp") drawTomatoGash(cracks[i], r, dmg, maxHp);
  for (let i = 0; i < cracks.length; i++) if (cracks[i].kind === "main" && !cracks[i].primary) drawTomatoGash(cracks[i], r, dmg, maxHp);
  for (let i = 0; i < cracks.length; i++) if (cracks[i].kind === "main" && cracks[i].primary) drawTomatoGash(cracks[i], r, dmg, maxHp);
}

function drawCracks(r, dmg, cracks, look) {
  look = look || {};
  cracks = cracks || game.cracks;
  if (dmg <= 0 || !cracks.length) return;
  const maxHp = look.maxHp || game.log.maxHp || LOG_HP;
  const boss = look.boss;
  const dark = boss ? boss.crackDark : "20, 11, 6";
  const inner = boss ? boss.crackInner : "216, 180, 136";
  const candy = boss && boss.id === "marmalade";
  ctx.save();
  clipShape(boss && boss.id, r * 0.992);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (boss && boss.id === "tomato") {
    if (!bossHasPhoto(boss.id)) drawTomatoWounds(r, dmg, cracks, maxHp);
    ctx.restore();
    return;
  }
  for (const c of cracks) {
    if (phone && c.kind === "hair") continue;
    const p = crackGrow(c, dmg, maxHp);
    if (p <= 0.02 || c.pts.length < 2) continue;
    const last = Math.max(2, Math.floor((c.pts.length - 1) * p) + 1);
    const wMul = c.width * (0.68 + p * 0.9) * (candy ? 0.78 : 1);
    const base = c.primary ? 0.01 : c.kind === "hair" ? 0.0038 : 0.007;
    const w0 = r * base * (0.32 + p * 0.4) * wMul;
    const w1 = r * base * 0.9 * p * wMul;
    if (fillCrackPoly(c.pts, last, r, w0, w1)) {
      ctx.fillStyle = candy
        ? `rgba(${dark}, ${0.55 + p * 0.4})`
        : `rgba(${dark}, ${0.4 + p * 0.52})`;
      ctx.fill();
    }
    if ((c.kind === "main" || (!phone && c.kind === "cross" && p > 0.35)) && p > 0.14) {
      const innerW = c.primary ? 0.0072 : 0.0036;
      const i0 = r * innerW * p * wMul;
      const i1 = r * innerW * 1.25 * p * wMul;
      if (fillCrackPoly(c.pts, last, r, i0, i1)) {
        ctx.fillStyle = `rgba(${inner}, ${candy ? 0.35 + p * 0.45 : 0.1 + p * 0.24})`;
        ctx.fill();
      }
    }
    strokeCrackPts(c.pts, last, r, 0, 0);
    ctx.strokeStyle = candy
      ? `rgba(255, 255, 255, ${0.45 + p * 0.45})`
      : `rgba(${dark}, ${0.32 + p * 0.52})`;
    ctx.lineWidth = Math.max(0.75, r * (c.primary ? 0.013 : 0.0062) * wMul);
    ctx.stroke();
    if (!phone && p > 0.38 && c.kind !== "hair") {
      const dx = c.pts[last - 1].x - c.pts[0].x;
      const dy = c.pts[last - 1].y - c.pts[0].y;
      const len = Math.hypot(dx, dy) || 1;
      const hx = (-dy / len) * r * 0.006;
      const hy = (dx / len) * r * 0.006;
      strokeCrackPts(c.pts, last, r, hx, hy);
      ctx.strokeStyle = candy
        ? `rgba(${inner}, ${0.2 + p * 0.3})`
        : `rgba(236, 220, 192, ${0.08 + p * 0.17})`;
      ctx.lineWidth = Math.max(0.5, r * 0.0036 * wMul);
      ctx.stroke();
    }
  }
  ctx.restore();
}

