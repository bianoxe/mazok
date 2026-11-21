/* КАМЕРА — фронт объектива: хромовый фильтр, чёрный обод с рифлением,
   цветное просветление стекла (циан / пурпур / янтарь), золотое кольцо фокуса
   со шкалой и лепестки диафрагмы вокруг зрачка. */
function makeCameraTex() {
  const size = BOSS_TEX;
  const R = BOSS_TEX_R;
  const [c, g] = makeCanvas(size, size);
  const img = bossImages.camera;
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

  const annulus = (r0, r1, fill) => {
    g.beginPath();
    g.arc(0, 0, r1, 0, TWO_PI);
    g.arc(0, 0, r0, 0, TWO_PI, true);
    g.fillStyle = fill;
    g.fill("evenodd");
  };

  /* внешний корпус — тёплый графит, не плоский серый */
  const body = g.createRadialGradient(-R * 0.42, -R * 0.5, R * 0.06, R * 0.18, R * 0.26, R * 1.05);
  body.addColorStop(0, "#5a5048");
  body.addColorStop(0.22, "#2e2a28");
  body.addColorStop(0.55, "#161412");
  body.addColorStop(0.82, "#0a0908");
  body.addColorStop(1, "#040302");
  g.fillStyle = body;
  g.fillRect(-R, -R, size, size);

  /* хромовый фильтровый кант */
  const chrome = g.createLinearGradient(-R, -R * 0.35, R * 0.85, R * 0.9);
  chrome.addColorStop(0, "#f4f7fa");
  chrome.addColorStop(0.18, "#c5ced6");
  chrome.addColorStop(0.4, "#7a848e");
  chrome.addColorStop(0.62, "#dfe6ec");
  chrome.addColorStop(0.82, "#4a545e");
  chrome.addColorStop(1, "#1c2228");
  annulus(R * 0.9, R - 0.5, chrome);
  g.strokeStyle = "rgba(255, 255, 255, 0.55)";
  g.lineWidth = Math.max(1.6, R * 0.01);
  g.beginPath();
  g.arc(0, 0, R * 0.955, Math.PI * 1.05, Math.PI * 1.85);
  g.stroke();
  g.strokeStyle = "rgba(20, 24, 28, 0.65)";
  g.lineWidth = Math.max(1.8, R * 0.012);
  g.beginPath();
  g.arc(0, 0, R * 0.955, Math.PI * -0.2, Math.PI * 0.65);
  g.stroke();

  /* рифлёное кольцо фокуса — чёрный пластик с тёплым бликом */
  const focus = g.createRadialGradient(-R * 0.3, -R * 0.34, R * 0.1, R * 0.15, R * 0.2, R * 0.92);
  focus.addColorStop(0, "#3a3430");
  focus.addColorStop(0.4, "#1a1614");
  focus.addColorStop(1, "#080604");
  annulus(R * 0.74, R * 0.9, focus);

  const knurls = 88;
  for (let i = 0; i < knurls; i++) {
    const a = (i / knurls) * TWO_PI;
    const hi = i % 3 === 0;
    g.strokeStyle = hi ? "rgba(210, 196, 172, 0.38)" : "rgba(8, 6, 4, 0.72)";
    g.lineWidth = Math.max(1, R * (hi ? 0.01 : 0.007));
    g.beginPath();
    g.moveTo(Math.cos(a) * R * 0.755, Math.sin(a) * R * 0.755);
    g.lineTo(Math.cos(a) * R * 0.888, Math.sin(a) * R * 0.888);
    g.stroke();
  }

  /* золотое кольцо со шкалой фокуса */
  const gold = g.createLinearGradient(-R * 0.6, -R * 0.5, R * 0.7, R * 0.65);
  gold.addColorStop(0, "#fff0c4");
  gold.addColorStop(0.28, "#e8b84a");
  gold.addColorStop(0.55, "#b87818");
  gold.addColorStop(0.8, "#f0d078");
  gold.addColorStop(1, "#7a4e0c");
  annulus(R * 0.675, R * 0.74, gold);
  g.strokeStyle = "rgba(255, 244, 200, 0.55)";
  g.lineWidth = Math.max(1.2, R * 0.008);
  g.beginPath();
  g.arc(0, 0, R * 0.708, Math.PI * 1.1, Math.PI * 1.9);
  g.stroke();
  g.strokeStyle = "rgba(80, 48, 8, 0.55)";
  g.beginPath();
  g.arc(0, 0, R * 0.708, Math.PI * -0.15, Math.PI * 0.7);
  g.stroke();

  /* риски и цифры шкалы */
  const marks = [
    { a: -Math.PI / 2, lab: "∞" },
    { a: -Math.PI / 2 + 0.55, lab: "10" },
    { a: -Math.PI / 2 + 1.1, lab: "4" },
    { a: -Math.PI / 2 + 1.65, lab: "2" },
    { a: -Math.PI / 2 + 2.2, lab: "1.2" },
    { a: -Math.PI / 2 - 0.55, lab: "20" },
    { a: -Math.PI / 2 - 1.1, lab: "50" }
  ];
  for (let i = 0; i < 48; i++) {
    const a = -Math.PI / 2 + (i / 48) * TWO_PI;
    const long = i % 4 === 0;
    g.strokeStyle = long ? "rgba(40, 24, 6, 0.85)" : "rgba(60, 36, 8, 0.45)";
    g.lineWidth = Math.max(1, R * (long ? 0.008 : 0.004));
    g.beginPath();
    g.moveTo(Math.cos(a) * R * (long ? 0.69 : 0.7), Math.sin(a) * R * (long ? 0.69 : 0.7));
    g.lineTo(Math.cos(a) * R * 0.728, Math.sin(a) * R * 0.728);
    g.stroke();
  }
  g.fillStyle = "#2a1806";
  g.font = "700 " + Math.round(R * 0.048) + "px Unbounded, Manrope, sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  for (let i = 0; i < marks.length; i++) {
    const m = marks[i];
    const rr = R * 0.705;
    g.save();
    g.translate(Math.cos(m.a) * rr, Math.sin(m.a) * rr);
    g.rotate(m.a + Math.PI / 2);
    g.fillText(m.lab, 0, 0);
    g.restore();
  }

  /* оранжевый индекс */
  g.fillStyle = "#ff6a18";
  g.beginPath();
  g.moveTo(0, -R * 0.742);
  g.lineTo(-R * 0.018, -R * 0.668);
  g.lineTo(R * 0.018, -R * 0.668);
  g.closePath();
  g.fill();
  g.strokeStyle = "rgba(120, 40, 0, 0.55)";
  g.lineWidth = 1;
  g.stroke();

  /* внутренняя чёрная маска перед стеклом */
  const mask = g.createRadialGradient(-R * 0.2, -R * 0.22, R * 0.05, 0, 0, R * 0.68);
  mask.addColorStop(0, "#2a2624");
  mask.addColorStop(0.55, "#12100e");
  mask.addColorStop(1, "#060504");
  annulus(R * 0.585, R * 0.675, mask);

  /* тонкое серебряное кольцо крепления */
  const silver = g.createLinearGradient(-R * 0.4, -R * 0.35, R * 0.5, R * 0.45);
  silver.addColorStop(0, "#eef2f6");
  silver.addColorStop(0.35, "#9aa4ae");
  silver.addColorStop(0.7, "#d8dee4");
  silver.addColorStop(1, "#3a424a");
  annulus(R * 0.565, R * 0.585, silver);

  /* стекло с цветным просветлением */
  const glassR = R * 0.56;
  const glass = g.createRadialGradient(-glassR * 0.38, -glassR * 0.42, glassR * 0.04, glassR * 0.12, glassR * 0.18, glassR);
  glass.addColorStop(0, "#dff6ff");
  glass.addColorStop(0.12, "#7ad0f0");
  glass.addColorStop(0.28, "#3a78c8");
  glass.addColorStop(0.42, "#7a3ab0");
  glass.addColorStop(0.58, "#c84878");
  glass.addColorStop(0.72, "#d87828");
  glass.addColorStop(0.86, "#1a3868");
  glass.addColorStop(1, "#060c18");
  g.beginPath();
  g.arc(0, 0, glassR, 0, TWO_PI);
  g.fillStyle = glass;
  g.fill();

  /* второй слой покрытия — конический блик */
  const coat = g.createConicGradient
    ? g.createConicGradient(-0.4, 0, 0)
    : null;
  if (coat) {
    coat.addColorStop(0, "rgba(120, 220, 255, 0.28)");
    coat.addColorStop(0.18, "rgba(180, 80, 220, 0.22)");
    coat.addColorStop(0.36, "rgba(255, 140, 60, 0.18)");
    coat.addColorStop(0.55, "rgba(40, 120, 220, 0.12)");
    coat.addColorStop(0.72, "rgba(220, 60, 140, 0.2)");
    coat.addColorStop(0.9, "rgba(80, 200, 240, 0.16)");
    coat.addColorStop(1, "rgba(120, 220, 255, 0.28)");
    g.save();
    g.globalCompositeOperation = "lighter";
    g.beginPath();
    g.arc(0, 0, glassR * 0.98, 0, TWO_PI);
    g.fillStyle = coat;
    g.fill();
    g.restore();
  }

  /* внутренние кольца линз */
  for (let i = 0; i < 4; i++) {
    const rr = glassR * (0.88 - i * 0.1);
    g.strokeStyle = i % 2 ? "rgba(220, 240, 255, 0.18)" : "rgba(20, 30, 50, 0.35)";
    g.lineWidth = Math.max(1, R * 0.006);
    g.beginPath();
    g.arc(0, 0, rr, 0, TWO_PI);
    g.stroke();
  }

  /* лепестки диафрагмы */
  const irisR = R * 0.3;
  const blades = 9;
  g.save();
  g.beginPath();
  g.arc(0, 0, irisR * 1.28, 0, TWO_PI);
  g.clip();
  for (let i = 0; i < blades; i++) {
    const a = (i / blades) * TWO_PI + 0.08;
    g.save();
    g.rotate(a);
    g.beginPath();
    g.moveTo(irisR * 0.08, 0);
    g.bezierCurveTo(
      irisR * 0.55, -irisR * 0.08,
      irisR * 1.05, -irisR * 0.48,
      irisR * 1.22, -irisR * 0.72
    );
    g.bezierCurveTo(
      irisR * 0.95, -irisR * 0.05,
      irisR * 0.55, irisR * 0.28,
      irisR * 0.12, irisR * 0.22
    );
    g.closePath();
    const blade = g.createLinearGradient(0, -irisR, irisR * 1.1, irisR * 0.4);
    blade.addColorStop(0, "#6a7480");
    blade.addColorStop(0.28, "#3a444e");
    blade.addColorStop(0.58, "#1a2028");
    blade.addColorStop(1, "#080a0e");
    g.fillStyle = blade;
    g.fill();
    g.strokeStyle = "rgba(210, 220, 230, 0.35)";
    g.lineWidth = Math.max(1, R * 0.005);
    g.beginPath();
    g.moveTo(irisR * 0.2, -irisR * 0.02);
    g.bezierCurveTo(
      irisR * 0.55, -irisR * 0.1,
      irisR * 0.95, -irisR * 0.42,
      irisR * 1.12, -irisR * 0.62
    );
    g.stroke();
    g.strokeStyle = "rgba(8, 10, 14, 0.55)";
    g.lineWidth = Math.max(1, R * 0.004);
    g.stroke();
    g.restore();
  }
  g.restore();

  /* зрачок */
  g.beginPath();
  g.arc(0, 0, irisR * 0.38, 0, TWO_PI);
  const pupil = g.createRadialGradient(-irisR * 0.1, -irisR * 0.12, 1, 0, 0, irisR * 0.38);
  pupil.addColorStop(0, "#1a3048");
  pupil.addColorStop(0.45, "#080e18");
  pupil.addColorStop(1, "#000104");
  g.fillStyle = pupil;
  g.fill();
  g.strokeStyle = "rgba(120, 160, 200, 0.35)";
  g.lineWidth = Math.max(1.2, R * 0.008);
  g.beginPath();
  g.arc(0, 0, irisR * 0.38, 0, TWO_PI);
  g.stroke();

  /* блики на стекле */
  g.beginPath();
  g.ellipse(-glassR * 0.32, -glassR * 0.38, glassR * 0.26, glassR * 0.11, -0.6, 0, TWO_PI);
  const hi1 = g.createRadialGradient(-glassR * 0.32, -glassR * 0.38, 1, -glassR * 0.28, -glassR * 0.34, glassR * 0.28);
  hi1.addColorStop(0, "rgba(255, 255, 255, 0.55)");
  hi1.addColorStop(0.45, "rgba(180, 230, 255, 0.22)");
  hi1.addColorStop(1, "rgba(255, 255, 255, 0)");
  g.fillStyle = hi1;
  g.fill();

  g.beginPath();
  g.ellipse(glassR * 0.28, glassR * 0.22, glassR * 0.16, glassR * 0.06, 0.45, 0, TWO_PI);
  g.fillStyle = "rgba(255, 160, 90, 0.22)";
  g.fill();

  g.beginPath();
  g.ellipse(glassR * 0.05, -glassR * 0.08, glassR * 0.08, glassR * 0.035, -0.2, 0, TWO_PI);
  g.fillStyle = "rgba(220, 120, 255, 0.18)";
  g.fill();

  /* пылинки / микроблики на стекле */
  for (let i = 0; i < 18; i++) {
    const a = hash(3100, i) * TWO_PI;
    const d = glassR * (0.2 + hash(3101, i) * 0.72);
    g.fillStyle = hash(3102, i) > 0.55
      ? "rgba(255, 240, 200, 0.22)"
      : "rgba(160, 220, 255, 0.18)";
    g.beginPath();
    g.arc(Math.cos(a) * d, Math.sin(a) * d, R * (0.004 + hash(3103, i) * 0.008), 0, TWO_PI);
    g.fill();
  }

  /* фирменная надпись на чёрном кольце */
  if (typeof arcRingText === "function") {
    arcRingText(g, "LENS 50mm", R * 0.63, -Math.PI / 2, R * 0.038, "#e8dcc4", "rgba(20, 14, 8, 0.5)");
    arcRingText(g, "f/1.4", R * 0.63, Math.PI / 2, R * 0.036, "#ff8a3a", "rgba(40, 16, 0, 0.45)");
  }

  /* общий глянец поверх */
  const gloss = g.createLinearGradient(-R * 0.7, -R * 0.7, R * 0.55, R * 0.75);
  gloss.addColorStop(0, "rgba(255,255,255,0)");
  gloss.addColorStop(0.22, "rgba(255,255,255,0.28)");
  gloss.addColorStop(0.38, "rgba(255,255,255,0.04)");
  gloss.addColorStop(0.62, "rgba(180, 220, 255, 0.12)");
  gloss.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gloss;
  g.beginPath();
  g.arc(0, 0, R - 1, 0, TWO_PI);
  g.fill();

  g.strokeStyle = "rgba(12, 10, 8, 0.85)";
  g.lineWidth = Math.max(2.4, R * 0.016);
  g.beginPath();
  g.arc(0, 0, R - g.lineWidth * 0.35, 0, TWO_PI);
  g.stroke();

  return c;
}
