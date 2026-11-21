/* ПЭПСИ — вид на банку сверху: триколор по кромке, металлическая крышка, кольцо-таб. */
function arcRingText(g, text, rad, center, size, fill, stroke) {
  g.save();
  g.font = "800 " + Math.round(size) + "px Manrope, Unbounded, sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  const step = (size * 0.86) / rad;
  for (let i = 0; i < text.length; i++) {
    const a = center + (i - (text.length - 1) * 0.5) * step;
    g.save();
    g.translate(Math.cos(a) * rad, Math.sin(a) * rad);
    g.rotate(a + Math.PI / 2);
    if (stroke) {
      g.lineWidth = Math.max(1, size * 0.24);
      g.strokeStyle = stroke;
      g.strokeText(text[i], 0, 0);
    }
    g.fillStyle = fill;
    g.fillText(text[i], 0, 0);
    g.restore();
  }
  g.restore();
}

function makePepsiTex() {
  /* фото: банка сверху — диском, кромка банки ложится на круг бревна */
  const photo = bossPhotoTex("pepsi");
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

  const lid = R * 0.8;
  const crimp = R * 0.9;
  const waveY = -R * 0.02;
  const wave = (dy) => {
    g.bezierCurveTo(-R * 0.46, -R * 0.36 + dy, -R * 0.08, dy, R * 0.26, R * 0.09 + dy);
    g.bezierCurveTo(R * 0.52, R * 0.15 + dy, R * 0.78, R * 0.03 + dy, R, -R * 0.12 + dy);
  };
  const waveEdge = (dy) => {
    g.beginPath();
    g.moveTo(-R, -R * 0.14 + dy);
    wave(dy);
  };

  const red = g.createLinearGradient(-R * 0.5, -R * 0.4, R * 0.5, R);
  red.addColorStop(0, "#ff6250");
  red.addColorStop(0.42, "#e0231f");
  red.addColorStop(0.8, "#b5141c");
  red.addColorStop(1, "#7c0c14");
  g.fillStyle = red;
  g.fillRect(-R, -R, size, size);

  const blue = g.createLinearGradient(-R * 0.45, -R, R * 0.55, R * 0.1);
  blue.addColorStop(0, "#5f9bf5");
  blue.addColorStop(0.32, "#1e5ed0");
  blue.addColorStop(0.78, "#0d3a94");
  blue.addColorStop(1, "#062058");
  g.beginPath();
  g.moveTo(-R, -R);
  g.lineTo(-R, -R * 0.14 + waveY);
  wave(waveY);
  g.lineTo(R, -R);
  g.closePath();
  g.fillStyle = blue;
  g.fill();

  waveEdge(waveY);
  g.strokeStyle = "rgba(16, 10, 26, 0.24)";
  g.lineWidth = R * 0.14;
  g.stroke();
  waveEdge(waveY);
  g.strokeStyle = "rgba(255, 255, 255, 0.95)";
  g.lineWidth = R * 0.095;
  g.stroke();
  waveEdge(waveY - R * 0.058);
  g.strokeStyle = "rgba(255, 255, 255, 0.45)";
  g.lineWidth = R * 0.012;
  g.stroke();

  const crimpG = g.createLinearGradient(-R * 0.6, -R, R * 0.6, R);
  crimpG.addColorStop(0, "#f8fafd");
  crimpG.addColorStop(0.35, "#d4dbe4");
  crimpG.addColorStop(0.68, "#a9b3c0");
  crimpG.addColorStop(1, "#7c8693");
  g.beginPath();
  g.arc(0, 0, R - 1, 0, TWO_PI);
  g.arc(0, 0, crimp, 0, TWO_PI, true);
  g.fillStyle = crimpG;
  g.fill("evenodd");
  const notches = 96;
  for (let i = 0; i < notches; i++) {
    const a = (i / notches) * TWO_PI;
    g.strokeStyle = i % 2 ? "rgba(255,255,255,0.55)" : "rgba(58, 72, 90, 0.34)";
    g.lineWidth = Math.max(1, R * 0.008);
    g.beginPath();
    g.moveTo(Math.cos(a) * (crimp + R * 0.005), Math.sin(a) * (crimp + R * 0.005));
    g.lineTo(Math.cos(a) * (R - 2), Math.sin(a) * (R - 2));
    g.stroke();
  }

  const alum = g.createRadialGradient(-R * 0.32, -R * 0.36, R * 0.05, R * 0.05, R * 0.06, lid);
  alum.addColorStop(0, "#ffffff");
  alum.addColorStop(0.3, "#e9edf3");
  alum.addColorStop(0.62, "#c5cdd9");
  alum.addColorStop(0.86, "#9aa5b3");
  alum.addColorStop(1, "#727e8c");
  g.beginPath();
  g.arc(0, 0, lid, 0, TWO_PI);
  g.fillStyle = alum;
  g.fill();

  for (let i = 0; i < 2; i++) {
    g.strokeStyle = i ? "rgba(255,255,255,0.55)" : "rgba(62, 76, 94, 0.5)";
    g.lineWidth = R * (i ? 0.012 : 0.02);
    g.beginPath();
    g.arc(0, 0, lid * (i ? 0.986 : 0.955), 0, TWO_PI);
    g.stroke();
  }
  const shine = g.createLinearGradient(-lid, -lid, lid, lid);
  shine.addColorStop(0, "rgba(255,255,255,0)");
  shine.addColorStop(0.26, "rgba(255,255,255,0.5)");
  shine.addColorStop(0.4, "rgba(255,255,255,0.04)");
  shine.addColorStop(0.62, "rgba(255,255,255,0.32)");
  shine.addColorStop(1, "rgba(255,255,255,0)");
  g.beginPath();
  g.arc(0, 0, lid, 0, TWO_PI);
  g.fillStyle = shine;
  g.fill();
  g.save();
  g.translate(-R * 0.05, -R * 0.06);
  g.rotate(-0.4);
  const tw = R * 0.105;
  const th = R * 0.24;
  g.fillStyle = "rgba(56, 68, 86, 0.3)";
  g.beginPath();
  g.ellipse(R * 0.012, R * 0.022, tw * 1.06, th * 1.03, 0, 0, TWO_PI);
  g.fill();
  const tab = g.createLinearGradient(-tw, -th, tw, th);
  tab.addColorStop(0, "#fbfcfe");
  tab.addColorStop(0.4, "#dde3ea");
  tab.addColorStop(0.75, "#aeb8c4");
  tab.addColorStop(1, "#8d98a5");
  g.beginPath();
  g.ellipse(0, 0, tw, th, 0, 0, TWO_PI);
  g.fillStyle = tab;
  g.fill();
  g.strokeStyle = "rgba(46, 58, 74, 0.75)";
  g.lineWidth = Math.max(1.6, R * 0.011);
  g.stroke();
  g.beginPath();
  g.ellipse(0, -th * 0.34, tw * 0.42, th * 0.26, 0, 0, TWO_PI);
  g.fillStyle = "rgba(44, 54, 70, 0.85)";
  g.fill();
  const riv = g.createRadialGradient(-R * 0.02, th * 0.52, R * 0.004, 0, th * 0.58, R * 0.05);
  riv.addColorStop(0, "#ffffff");
  riv.addColorStop(0.5, "#cfd7e0");
  riv.addColorStop(1, "#7f8a97");
  g.beginPath();
  g.arc(0, th * 0.58, R * 0.05, 0, TWO_PI);
  g.fillStyle = riv;
  g.fill();
  g.strokeStyle = "rgba(48, 60, 76, 0.7)";
  g.lineWidth = Math.max(1.4, R * 0.009);
  g.stroke();
  g.restore();

  arcRingText(g, "ГАЗИРОВАННЫЙ НАПИТОК", lid * 0.79, -Math.PI / 2, R * 0.05, "rgba(96, 108, 124, 0.9)", "rgba(255,255,255,0.5)");
  arcRingText(g, "ПЭПСИ · 0,5 Л", lid * 0.5, Math.PI / 2, R * 0.06, "#0d3a94", "rgba(255,255,255,0.62)");

  for (let i = 0; i < 26; i++) {
    const a = hash(1400, i) * TWO_PI;
    const d = R * (0.06 + hash(1401, i) * 0.86);
    g.fillStyle = hash(1402, i) > 0.55 ? "rgba(255,255,255,0.45)" : "rgba(74, 86, 104, 0.26)";
    g.beginPath();
    g.ellipse(Math.cos(a) * d, Math.sin(a) * d, R * (0.006 + hash(1403, i) * 0.02), R * 0.0035, a, 0, TWO_PI);
    g.fill();
  }

  g.strokeStyle = "#0a2a6a";
  g.lineWidth = Math.max(3, R * 0.02);
  g.beginPath();
  g.arc(0, 0, R - g.lineWidth * 0.3, 0, TWO_PI);
  g.stroke();
  return c;
}
