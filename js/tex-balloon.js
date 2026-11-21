/* ШАРИК — надувной латекс: три цвета подряд (красный, синий, зелёный), блик,
   прожилки от шейки и мягкая просвечивающая кромка. Узел с ниткой рисуются
   поверх силуэта (drawBossStem): тело сходится к шейке, а узел остаётся
   снаружи, поэтому силуэт его не касается и шарик читается настоящим. */
const BALLOON_SKINS = [
  {
    id: "red",
    body: ["#ff8f96", "#f0394c", "#d01730", "#9c0a22", "#650714"],
    halo: "rgba(255, 96, 112, 0.12)",
    rim: "rgba(255, 150, 160, 0.5)",
    seam: "rgba(90, 6, 18, 0.2)",
    seamHi: "rgba(255, 152, 162, 0.12)",
    spec: "255, 214, 220",
    dotHi: "rgba(255, 190, 196, 0.14)",
    dotLo: "rgba(88, 6, 18, 0.2)",
    knot: ["#ff6a76", "#c4122c", "#7a0a1a"],
    knotEdge: "rgba(255, 156, 166, 0.45)",
    thread: "rgba(246, 244, 238, 0.9)",
    threadShade: "rgba(120, 116, 108, 0.32)",
    outline: "#6a0818",
    fill: "#e02338",
    shade: { hi: "rgba(255,255,255,0.2)", edge: "rgba(70, 24, 40, 0.14)" },
    chips: ["#ff5a6e", "#c4122c", "#ffd0d8", "#8a0c20", "#ff9aa8"],
    glow: "230, 44, 66"
  },
  {
    id: "blue",
    body: ["#a8dcff", "#3f96e8", "#1a62b8", "#0c3c80", "#052046"],
    halo: "rgba(96, 156, 255, 0.12)",
    rim: "rgba(170, 216, 255, 0.5)",
    seam: "rgba(6, 26, 62, 0.2)",
    seamHi: "rgba(168, 214, 255, 0.12)",
    spec: "214, 236, 255",
    dotHi: "rgba(190, 224, 255, 0.14)",
    dotLo: "rgba(6, 26, 62, 0.2)",
    knot: ["#7cc0f0", "#1c5fa8", "#0a2c58"],
    knotEdge: "rgba(158, 208, 250, 0.45)",
    thread: "rgba(240, 246, 252, 0.9)",
    threadShade: "rgba(108, 118, 130, 0.32)",
    outline: "#062a58",
    fill: "#1a62b8",
    shade: { hi: "rgba(255,255,255,0.22)", edge: "rgba(18, 40, 74, 0.16)" },
    chips: ["#3f9ce0", "#0a2a58", "#cfe8ff", "#08203c", "#8fc8f0"],
    glow: "52, 132, 220"
  },
  {
    id: "green",
    body: ["#c8f0b0", "#5cb64a", "#268a28", "#12601c", "#07330f"],
    halo: "rgba(120, 210, 110, 0.12)",
    rim: "rgba(190, 240, 170, 0.5)",
    seam: "rgba(10, 40, 12, 0.2)",
    seamHi: "rgba(200, 244, 184, 0.12)",
    spec: "226, 248, 214",
    dotHi: "rgba(210, 246, 194, 0.14)",
    dotLo: "rgba(10, 42, 14, 0.2)",
    knot: ["#8ed47a", "#248c2c", "#0b3c12"],
    knotEdge: "rgba(180, 232, 160, 0.45)",
    thread: "rgba(244, 250, 240, 0.9)",
    threadShade: "rgba(116, 122, 108, 0.32)",
    outline: "#0b3c12",
    fill: "#268a28",
    shade: { hi: "rgba(255,255,255,0.22)", edge: "rgba(20, 54, 22, 0.16)" },
    chips: ["#4fbf48", "#08380f", "#dcffd0", "#0a3a12", "#9ee88f"],
    glow: "72, 190, 76"
  }
];

/* стадия шарика = сколько уже лопнуло (0, 1, 2) — по числу полученного урона */
function balloonSkin(stage) {
  return BALLOON_SKINS[clamp(stage | 0, 0, BALLOON_SKINS.length - 1)];
}

function balloonStages() {
  return BALLOON_SKINS.length;
}

function makeBalloonTex(skin) {
  skin = skin || BALLOON_SKINS[0];
  /* фото: три цвета латекса — три файла (assets.js: BOSS_IMAGE_SRC) */
  const photoKey = skin.id === "green" ? "balloonGreen" : skin.id === "blue" ? "balloonBlue" : "balloon";
  const photo = bossPhotoTex(photoKey);
  if (photo) return photo;
  const size = BOSS_TEX;
  const R = BOSS_TEX_R;
  const [c, g] = makeCanvas(size, size);
  g.translate(R, R);
  g.lineJoin = "round";
  g.lineCap = "round";
  g.save();
  pathBalloon(g, R - 0.5);
  g.clip();

  const body = g.createRadialGradient(-R * 0.3, -R * 0.34, R * 0.05, R * 0.08, R * 0.1, R * 1.02);
  body.addColorStop(0, skin.body[0]);
  body.addColorStop(0.28, skin.body[1]);
  body.addColorStop(0.58, skin.body[2]);
  body.addColorStop(0.82, skin.body[3]);
  body.addColorStop(1, skin.body[4]);
  g.fillStyle = body;
  g.fillRect(-R, -R, size, size);

  /* латекс просвечивает у самой кромки: светлое кольцо изнутри */
  const through = g.createRadialGradient(0, 0, R * 0.5, 0, 0, R);
  through.addColorStop(0, "rgba(0,0,0,0)");
  through.addColorStop(0.62, "rgba(0,0,0,0)");
  through.addColorStop(0.86, skin.halo);
  through.addColorStop(1, skin.rim);
  g.fillStyle = through;
  g.beginPath();
  g.arc(0, 0, R, 0, TWO_PI);
  g.fill();

  /* прожилки расходятся веером от шейки вверх по куполу: у настоящего шарика
     латекс натянут от узла к макушке. Крайние ложатся почти горизонтально,
     поэтому веер идёт от -176° до -4° */
  const seamPath = (a) => {
    g.beginPath();
    g.moveTo(0, R * 0.78);
    g.quadraticCurveTo(Math.cos(a) * R * 0.5, Math.sin(a) * R * 0.5, Math.cos(a) * R * 1.02, Math.sin(a) * R * 1.02);
  };
  for (let i = 0; i < 7; i++) {
    const a = Math.PI * (-0.5 + (i - 3) * 0.16);
    seamPath(a - 0.03);
    g.strokeStyle = skin.seam;
    g.lineWidth = Math.max(1.2, R * 0.008);
    g.stroke();
    seamPath(a + 0.03);
    g.strokeStyle = skin.seamHi;
    g.lineWidth = Math.max(1, R * 0.004);
    g.stroke();
  }

  const glow = g.createRadialGradient(-R * 0.34, -R * 0.4, R * 0.04, -R * 0.3, -R * 0.34, R * 0.46);
  glow.addColorStop(0, "rgba(255,255,255,0.85)");
  glow.addColorStop(0.42, "rgba(" + skin.spec + ", 0.32)");
  glow.addColorStop(1, "rgba(" + skin.spec + ", 0)");
  g.fillStyle = glow;
  g.beginPath();
  g.arc(-R * 0.3, -R * 0.34, R * 0.46, 0, TWO_PI);
  g.fill();
  g.save();
  g.translate(-R * 0.27, -R * 0.3);
  g.rotate(-0.42);
  /* блик у латекса размазанный, с маленьким ярким ядром посередине */
  const spec = g.createRadialGradient(0, 0, 0, 0, 0, R * 0.17);
  spec.addColorStop(0, "rgba(255,255,255,0.4)");
  spec.addColorStop(0.55, "rgba(" + skin.spec + ", 0.15)");
  spec.addColorStop(1, "rgba(" + skin.spec + ", 0)");
  g.fillStyle = spec;
  g.beginPath();
  g.ellipse(0, 0, R * 0.17, R * 0.1, 0, 0, TWO_PI);
  g.fill();
  const core = g.createRadialGradient(0, 0, 0, 0, 0, R * 0.05);
  core.addColorStop(0, "rgba(255,255,255,0.5)");
  core.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = core;
  g.beginPath();
  g.ellipse(0, 0, R * 0.05, R * 0.032, 0, 0, TWO_PI);
  g.fill();
  g.restore();
  for (let i = 0; i < 20; i++) {
    const a = hash(2800, i) * TWO_PI;
    const d = R * (0.2 + hash(2801, i) * 0.72);
    g.fillStyle = hash(2802, i) > 0.5 ? skin.dotHi : skin.dotLo;
    g.beginPath();
    g.arc(Math.cos(a) * d, Math.sin(a) * d, R * (0.005 + hash(2803, i) * 0.012), 0, TWO_PI);
    g.fill();
  }

  /* кромка по всему силуэту, включая шейку: половина штриха срежется клипом,
     оставшаяся половина ложится ровным светлым кантом на самом краю */
  pathBalloon(g, R - 0.5);
  g.lineWidth = R * 0.08;
  g.strokeStyle = skin.rim;
  g.stroke();
  g.restore();
  return c;
}

/* Три шарика подряд: красный, синий, зелёный. Текстуры пекутся сразу,
   а на бревне показывается та, чей номер равен числу лопнувших. */
function makeBalloonTexes() {
  const out = [];
  for (let i = 0; i < BALLOON_SKINS.length; i++) out.push(makeBalloonTex(BALLOON_SKINS[i]));
  return out;
}

/* Палитра босса под текущий оттенок латекса: тело рисуется текстурой, а вот
   вспышки, дым, осколки, свечение и полоска HP берут цвета у самого босса.
   Зовётся при запуске уровня и при каждом новом шарике (nextBalloon). */
function applyBalloonSkin(boss, n) {
  const skin = balloonSkin(n);
  if (!boss) return skin;
  boss.fill = skin.fill;
  boss.outline = skin.outline;
  boss.chips = skin.chips;
  boss.pith = skin.chips[2];
  boss.dark = skin.body[3];
  boss.glow = skin.glow;
  boss.shade = skin.shade;
  bossHpColors(boss, skin.glow);
  return skin;
}
