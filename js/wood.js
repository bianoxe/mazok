/* ---------- ВИДЫ ЯБЛОК ----------
   Обычное, золотое и алмазное рисуются ОДНОЙ геометрией — отличается только
   палитра, поэтому в кадре они читаются одинаково, а цвет сразу говорит, сколько
   дадут. Золотое спавнится вместо обычного с шансом 5 %, алмазное — 1 %
   (js/progress.js: APPLE_GOLD_ODDS, APPLE_DIAMOND_ODDS, APPLE_KIND_MUL). */
const APPLE_KINDS = {
  plain: {
    rim: "#7a0d0a",
    hollow: "#8e100c",
    body: ["#ff7a66", "#e0342c", "#9c1410"],
    flesh: ["#fffdf6", "#fdf1d8", "#e7d4ac"],
    seed: "#6b4222",
    stem: "#6b4423",
    leaf: "#3fa845"
  },
  gold: {
    rim: "#7a5a08",
    hollow: "#8a6a08",
    body: ["#fff3a6", "#f5c02a", "#a87408"],
    flesh: ["#fffdf2", "#fdf0c4", "#e8d089"],
    seed: "#7a5a1a",
    stem: "#6b4423",
    leaf: "#4fb44a"
  },
  diamond: {
    rim: "#0d3d5a",
    hollow: "#0f4a63",
    body: ["#e8feff", "#7fe0f7", "#2a86b8"],
    flesh: ["#fbffff", "#dcf6ff", "#a9dff2"],
    seed: "#2f5f74",
    stem: "#5a6b7a",
    leaf: "#8fe0ff"
  }
};

function appleKindPal(kind) {
  return APPLE_KINDS[kind] || APPLE_KINDS.plain;
}

/* ЯБЛОКО — валюта забега: красный бок, ямка, черенок с листом. На бревне
   торчит из кромки как нож (drawLogApples), в полёте — к счётчику (frame.js).

   Геометрия спрайта, px. Тело — две доли, разведённые от оси APPLE_SPR_CX (она
   же линия разреза). Самая внутренняя точка рисунка — низ долей,
   APPLE_SPR_CY + APPLE_SPR_RIM: из неё считаются APPLE_SPR_FIT и APPLE_R_OUT
   (js/progress.js), поэтому яблоко садится на кромку впритык, без зазора.

   Половины (makeAppleHalf) — то же яблоко, разрезанное ножом: тело остаётся
   целым, а вдоль линии разреза ложится светлая лунка среза с семечками.
   Нож всегда входит в кромку радиально, поэтому разрез идёт по оси спрайта,
   а половины разлетаются в стороны (js/fx.js: spawnAppleHalves,
   js/draw-stuck.js: drawAppleHalves). */
const APPLE_SPR = 64;         /* сторона спрайта */
const APPLE_SPR_CX = 32;      /* ось долей — она же линия разреза (середина) */
const APPLE_SPR_CY = 34;      /* центр тела: чуть ниже центра спрайта */
const APPLE_SPR_R = 17;       /* радиус доли: заливка */
const APPLE_SPR_RIM = 19;     /* он же с тёмным кантом */
const APPLE_SPR_LOBE = 8;     /* насколько доли разведены от оси */
const APPLE_FLESH = 4.4;      /* мякоть настолько меньше тела: столько кожицы */
const APPLE_SPR_CUT = 6.6;    /* полуширина лунки среза у половин: по ней семечки */
/* доля полуразмера, которой рисунок достаёт внутрь, к бревну */
const APPLE_SPR_FIT = (APPLE_SPR_CY + APPLE_SPR_RIM - APPLE_SPR_CX) / (APPLE_SPR * 0.5);
/* доля полуразмера до самого внешнего края тела (без черенка) */
const APPLE_SPR_OUT = (APPLE_SPR_CX - (APPLE_SPR_CY - APPLE_SPR_RIM)) / (APPLE_SPR * 0.5);
/* доля полуразмера до боков тела: по ней мерят ширину рисунка */
const APPLE_SPR_SIDE = (APPLE_SPR_LOBE + APPLE_SPR_RIM) / (APPLE_SPR * 0.5);

/* обе доли одной фигурой: шва посередине нет */
function appleBodyPath(g, r) {
  g.beginPath();
  g.arc(APPLE_SPR_CX - APPLE_SPR_LOBE, APPLE_SPR_CY, r, 0, TWO_PI);
  g.arc(APPLE_SPR_CX + APPLE_SPR_LOBE, APPLE_SPR_CY, r, 0, TWO_PI);
}

function makeApple(kind) {
  const pal = appleKindPal(kind);
  const [c, g] = makeCanvas(APPLE_SPR, APPLE_SPR);
  /* тёмный кант: те же доли чуть крупнее — яблоко читается на любой коре,
     а шва посередине нет (доли заливаются одной фигурой) */
  g.fillStyle = pal.rim;
  appleBodyPath(g, APPLE_SPR_RIM);
  g.fill();
  /* доли: слева и справа от ямки, снизу сливаются в круглый бок */
  const body = g.createRadialGradient(APPLE_SPR_CX - 9, APPLE_SPR_CY - 8, 3, APPLE_SPR_CX, APPLE_SPR_CY + 2, 26);
  body.addColorStop(0, pal.body[0]);
  body.addColorStop(0.5, pal.body[1]);
  body.addColorStop(1, pal.body[2]);
  g.fillStyle = body;
  appleBodyPath(g, APPLE_SPR_R);
  g.fill();
  /* ямка между долями */
  g.fillStyle = pal.hollow;
  g.beginPath();
  g.ellipse(APPLE_SPR_CX, APPLE_SPR_CY - 14.5, 5.2, 3, 0, 0, TWO_PI);
  g.fill();
  /* блик */
  g.fillStyle = "rgba(255,255,255,0.42)";
  g.beginPath();
  g.ellipse(APPLE_SPR_CX - 10.5, APPLE_SPR_CY - 7, 6.6, 4.2, -0.6, 0, TWO_PI);
  g.fill();
  /* черенок и лист */
  g.strokeStyle = pal.stem;
  g.lineWidth = 3.4;
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(APPLE_SPR_CX, APPLE_SPR_CY - 14);
  g.quadraticCurveTo(APPLE_SPR_CX + 1, APPLE_SPR_CY - 22, APPLE_SPR_CX + 4, APPLE_SPR_CY - 27);
  g.stroke();
  g.fillStyle = pal.leaf;
  g.beginPath();
  g.moveTo(APPLE_SPR_CX + 3, APPLE_SPR_CY - 22);
  g.quadraticCurveTo(APPLE_SPR_CX + 13, APPLE_SPR_CY - 30.5, APPLE_SPR_CX + 20, APPLE_SPR_CY - 26);
  g.quadraticCurveTo(APPLE_SPR_CX + 13, APPLE_SPR_CY - 17, APPLE_SPR_CX + 3, APPLE_SPR_CY - 22);
  g.fill();
  return c;
}

/* Половина яблока: side < 0 — левая (срез смотрит вправо), side > 0 — правая.
   Срез идёт по оси спрайта: там во весь рост доли ложится мякоть с семечками,
   а по кругу остаётся кожица дужкой и тёмный кант — ровно как на целом яблоке,
   поэтому в кадре разреза рисунок не меняется, яблоко просто расходится
   надвое (js/flow.js: takeLogApple). */
function makeAppleHalf(side, kind) {
  const pal = appleKindPal(kind);
  const [c, g] = makeCanvas(APPLE_SPR, APPLE_SPR);
  const dir = side < 0 ? -1 : 1;
  const cut = APPLE_SPR_CX;
  g.save();
  /* полспрайта: всё, что за линией разреза, не рисуем */
  g.beginPath();
  if (dir < 0) g.rect(0, 0, cut, APPLE_SPR);
  else g.rect(cut, 0, APPLE_SPR - cut, APPLE_SPR);
  g.clip();
  /* кожица: тело целиком, как у целого яблока (тот же блик и тот же тон) */
  g.fillStyle = pal.rim;
  appleBodyPath(g, APPLE_SPR_RIM);
  g.fill();
  const skin = g.createRadialGradient(cut - 9, APPLE_SPR_CY - 8, 3, cut, APPLE_SPR_CY + 2, 26);
  skin.addColorStop(0, pal.body[0]);
  skin.addColorStop(0.5, pal.body[1]);
  skin.addColorStop(1, pal.body[2]);
  g.fillStyle = skin;
  appleBodyPath(g, APPLE_SPR_R);
  g.fill();
  /* мякоть: лунка среза вдоль линии разреза — тело остаётся цветным, поэтому
     сложенные половины читаются как целое яблоко с тонкой линией разреза,
     а в разлёте видно светлую плоскость среза с семечками */
  const flesh = g.createLinearGradient(cut, 0, cut - dir * 22, 0);
  flesh.addColorStop(0, pal.flesh[0]);
  flesh.addColorStop(0.55, pal.flesh[1]);
  flesh.addColorStop(1, pal.flesh[2]);
  g.fillStyle = flesh;
  g.beginPath();
  g.ellipse(cut + dir * 0.6, APPLE_SPR_CY, APPLE_SPR_CUT, APPLE_SPR_R - APPLE_FLESH, 0, 0, TWO_PI);
  g.fill();
  /* сердцевина: светлое пятно внутри лунки */
  g.fillStyle = "rgba(255,255,255,0.42)";
  g.beginPath();
  g.ellipse(cut - dir * 2.6, APPLE_SPR_CY, APPLE_SPR_CUT - 2.4, APPLE_SPR_R - APPLE_FLESH - 3.4, 0, 0, TWO_PI);
  g.fill();
  /* семечки: пара внутри лунки, верхняя чуть наклонена вбок */
  g.fillStyle = pal.seed;
  for (let i = 0; i < 2; i++) {
    g.beginPath();
    g.ellipse(cut - dir * 4.1, APPLE_SPR_CY + (i ? 5 : -5), 1.9, 3.4, dir * (i ? -0.5 : 0.5), 0, TWO_PI);
    g.fill();
  }
  g.restore();
  return c;
}

/* ЯБЛОКО В РАЗРЕЗЕ — срез смотрит НА НАС, но силуэт остаётся яблоком: две доли
   с выемкой сверху, кожица по краю, мякоть, сердцевина с семечками и хвостик с
   листом. Это иконка валюты в интерфейсе (js/assets.js: appleIconHtml). */
function makeAppleSlice() {
  const [c, g] = makeCanvas(APPLE_SPR, APPLE_SPR);
  const cx = APPLE_SPR_CX;
  const cy = APPLE_SPR_CY + 2;
  const R = APPLE_SPR_R;
  const LOBE = APPLE_SPR_LOBE;
  const skin = Math.max(3, R * 0.18);

  /* кожица: силуэт из двух долей — как у целого яблока, с ямкой сверху */
  g.fillStyle = "#c11f18";
  g.beginPath();
  g.arc(cx - LOBE, cy, R, 0, TWO_PI);
  g.arc(cx + LOBE, cy, R, 0, TWO_PI);
  g.fill();

  /* мякоть: тот же силуэт, но меньше на толщину кожицы */
  const flesh = g.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R * 1.1);
  flesh.addColorStop(0, "#fffdf3");
  flesh.addColorStop(0.6, "#fdf1d2");
  flesh.addColorStop(1, "#edd9a8");
  g.fillStyle = flesh;
  g.beginPath();
  g.arc(cx - LOBE, cy, R - skin, 0, TWO_PI);
  g.arc(cx + LOBE, cy, R - skin, 0, TWO_PI);
  g.fill();

  /* сердцевина между долями и семечки */
  g.strokeStyle = "rgba(214, 190, 140, 0.7)";
  g.lineWidth = 1.3;
  g.beginPath();
  g.ellipse(cx, cy, R * 0.26, R * 0.42, 0, 0, TWO_PI);
  g.stroke();
  g.fillStyle = "#6b4222";
  for (let i = 0; i < 2; i++) {
    const dy = i ? -R * 0.14 : R * 0.14;
    g.beginPath();
    g.ellipse(cx + (i ? 1.2 : -1.2), cy + dy, R * 0.05, R * 0.1, i ? 0.5 : -0.5, 0, TWO_PI);
    g.fill();
  }

  /* блик по мякоти */
  g.fillStyle = "rgba(255,255,255,0.4)";
  g.beginPath();
  g.ellipse(cx - R * 0.45, cy - R * 0.4, R * 0.28, R * 0.16, -0.6, 0, TWO_PI);
  g.fill();

  /* хвостик с листом: чтобы срез читался именно яблоком */
  g.strokeStyle = "#6b4423";
  g.lineWidth = Math.max(2.2, R * 0.15);
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(cx, cy - R + 1);
  g.quadraticCurveTo(cx + 1, cy - R - 6, cx + 4, cy - R - 11);
  g.stroke();
  g.fillStyle = "#3fa845";
  g.beginPath();
  g.moveTo(cx + 3, cy - R - 7);
  g.quadraticCurveTo(cx + 11, cy - R - 14, cx + 16, cy - R - 10);
  g.quadraticCurveTo(cx + 11, cy - R - 3, cx + 3, cy - R - 7);
  g.fill();
  return c;
}

function makeBg(w, h) {
  const [c, g] = makeCanvas(w, h);
  if (bgPhoto) {
    const iw = bgPhoto.naturalWidth || bgPhoto.width || w;
    const ih = bgPhoto.naturalHeight || bgPhoto.height || h;
    const scale = Math.max(w / iw, h / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = "high";
    g.drawImage(bgPhoto, (w - dw) * 0.5, (h - dh) * 0.5, dw, dh);
    return c;
  }
  const bg = g.createLinearGradient(0, 0, 0, h);
  /* запасной фон, если картинка не загрузилась: небо, как в images/bg.webp */
  bg.addColorStop(0, "#5ea3a6");
  bg.addColorStop(0.45, "#7fc4c2");
  bg.addColorStop(1, "#c8ebe6");
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.fillStyle = "rgba(255,255,255,0.16)";
  g.beginPath(); g.arc(w * 0.2, h * 0.18, Math.min(w, h) * 0.24, 0, TWO_PI); g.fill();
  g.fillStyle = "rgba(255,255,255,0.12)";
  g.beginPath(); g.arc(w * 0.82, h * 0.72, Math.min(w, h) * 0.2, 0, TWO_PI); g.fill();
  return c;
}

/* ---------- укладка фото спила ----------
   Файл не трогаем: в игру идёт ровно та картинка, что лежит в images/wood, —
   только масштаб и центровка. Раньше спил вписывался «cover» и вдобавок резался
   по окружности: у ели край упирался в канвас, и бревно выходило с плоскими
   обрезанными боками. Теперь «contain»: рисунок целиком входит в спрайт (по
   длинной стороне — впритык), ничего не срезается, не маскируется и не
   дорисовывается. Пиксели рисунка не переписываются вообще — значит в кадре
   картинка один в один как в файле. */
const woodTrimCache = new WeakMap();

/* Рамка видимого рисунка (по альфе) в долях файла: 0..1. Берём с запасом в
   один семпл, чтобы сглаженная кромка не оказалась за рамкой. */
function woodTrimRect(photo) {
  if (woodTrimCache.has(photo)) return woodTrimCache.get(photo);
  const N = 256;
  const [cv, g] = makeCanvas(N, N);
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = "low";
  g.drawImage(photo, 0, 0, N, N);
  let rect = null;
  try {
    const d = g.getImageData(0, 0, N, N).data;
    let x0 = N, y0 = N, x1 = -1, y1 = -1;
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        if (d[(y * N + x) * 4 + 3] < 40) continue;
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
    if (x1 > x0 && y1 > y0) {
      x0 = Math.max(0, x0 - 1);
      y0 = Math.max(0, y0 - 1);
      x1 = Math.min(N - 1, x1 + 1);
      y1 = Math.min(N - 1, y1 + 1);
      rect = { x: x0 / N, y: y0 / N, w: (x1 - x0 + 1) / N, h: (y1 - y0 + 1) / N };
    }
  } catch (e) {
    rect = null;
  }
  woodTrimCache.set(photo, rect);
  return rect;
}

/* Спил в спрайт: contain по рамке рисунка, центр — в центр холста. */
function fitWoodPhoto(g, photo, size) {
  const iw = photo.naturalWidth || photo.width || size;
  const ih = photo.naturalHeight || photo.height || size;
  const t = woodTrimRect(photo);
  const sx = t ? t.x * iw : 0;
  const sy = t ? t.y * ih : 0;
  const sw = t ? t.w * iw : iw;
  const sh = t ? t.h * ih : ih;
  const k = Math.min(size / sw, size / sh);
  const dw = sw * k;
  const dh = sh * k;
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = "high";
  g.drawImage(photo, sx, sy, sw, sh, (size - dw) * 0.5, (size - dh) * 0.5, dw, dh);
}

function makeWood(th, seed, themeIdx) {
  const size = 512;
  const [c, g] = makeCanvas(size, size);
  const photo = woodImages[themeIdx];
  if (photo) {
    /* Фото спила целиком, только масштаб и центровка — без обрезки, масок и
       дорисовки (см. fitWoodPhoto) */
    fitWoodPhoto(g, photo, size);
    c.__photo = true;
    return c;
  }
  const img = g.createImageData(size, size);
  const data = img.data;
  const R = size * 0.5;
  const cx = (size - 1) * 0.5;
  const fill = hexRgb(th.fill);
  const dark = hexRgb(th.dark);
  const mid = hexRgb(th.ring);
  const pith = hexRgb(th.pith);
  const bark = hexRgb(th.outline);
  const grain = th.grain || "";
  const oak = grain === "oak";
  const spruce = grain === "spruce";
  const ringGap = spruce ? 27 : oak ? 17.5 : 20;
  const pithR = size * (spruce ? 0.052 : 0.064);
  const sigma = spruce ? 0.13 : oak ? 0.22 : 0.18;
  const offX = (hash(seed, 3) - 0.5) * size * 0.02;
  const offY = (hash(seed, 4) - 0.45) * size * 0.016;
  const ell = 1 + (hash(seed, 6) - 0.5) * 0.045;
  const ellA = hash(seed, 7) * Math.PI;
  const cA = Math.cos(ellA);
  const sA = Math.sin(ellA);
  const AN = 360;
  const wob = new Float32Array(AN);
  for (let i = 0; i < AN; i++) {
    const a = (i / AN) * TWO_PI;
    wob[i] = Math.sin(a * 2 + seed * 0.17) * 0.018
      + Math.sin(a * 3 + seed * 0.41) * 0.01
      + Math.sin(a * 5 + seed * 0.08) * 0.005;
  }
  const knots = [];
  const knotCount = spruce ? 1 : 2;
  for (let k = 0; k < knotCount; k++) {
    for (let attempt = 0; attempt < 6; attempt++) {
      const a = hash(seed, 20 + k * 7 + attempt) * TWO_PI;
      const d = (0.34 + hash(seed, 40 + k * 7 + attempt) * 0.28) * R;
      const x = Math.cos(a) * d;
      const y = Math.sin(a) * d;
      let ok = true;
      for (let j = 0; j < knots.length; j++) {
        if (Math.hypot(x - knots[j].x, y - knots[j].y) < R * 0.36) ok = false;
      }
      const angK = Math.atan2(y, x);
      for (let j = 0; j < knots.length; j++) {
        let da = Math.abs(angK - knots[j].ang);
        if (da > Math.PI) da = TWO_PI - da;
        if (da < 1.15) ok = false;
      }
      if (!ok) continue;
      knots.push({ x, y, ang: angK, rad: (0.026 + hash(seed, 60 + k) * 0.012) * size });
      break;
    }
  }
  const rayN = oak ? 16 : spruce ? 6 : 10;
  const rayPow = oak ? 16 : 36;
  const rayAmp = oak ? 0.28 : spruce ? 0.045 : 0.08;
  const rayCol = oak ? pith : dark;
  const col = [0, 0, 0];
  const mix = (cr, cg, cb, t) => {
    if (t <= 0) return;
    if (t > 1) t = 1;
    col[0] += (cr - col[0]) * t;
    col[1] += (cg - col[1]) * t;
    col[2] += (cb - col[2]) * t;
  };
  const ss = (e0, e1, x) => {
    const t = x <= e0 ? 0 : x >= e1 ? 1 : (x - e0) / (e1 - e0);
    return t * t * (3 - 2 * t);
  };

  for (let y = 0; y < size; y++) {
    const py = y - cx;
    const row = y * size;
    for (let x = 0; x < size; x++) {
      const px = x - cx;
      const dist = Math.hypot(px, py);
      if (dist > R) continue;

      let dx = px - offX;
      let dy = py - offY;
      const rx = dx * cA + dy * sA;
      const ry = -dx * sA + dy * cA;
      dx = rx / ell;
      dy = ry;
      let rd = Math.hypot(dx, dy);
      let ang = Math.atan2(dy, dx);
      if (ang < 0) ang += TWO_PI;
      const ai = ang / TWO_PI * AN;
      const i0 = ai | 0;
      const ft = ai - i0;
      rd *= 1 + wob[i0 % AN] * (1 - ft) + wob[(i0 + 1) % AN] * ft;

      let knotEye = 0;
      for (let k = 0; k < knots.length; k++) {
        const kn = knots[k];
        const kd = Math.hypot(px - kn.x, py - kn.y);
        const reach = kn.rad * 4.4;
        if (kd >= reach) continue;
        const inf = Math.exp(-(kd * kd) / (kn.rad * kn.rad * 4.8)) * (1 - ss(reach * 0.45, reach, kd));
        rd = rd * (1 - inf * 0.66) + (kd * 0.9 + kn.rad * 0.22) * (inf * 0.66);
        const eye = 1 - ss(kn.rad * 0.12, kn.rad * 0.95, kd);
        if (eye > knotEye) knotEye = eye;
      }

      const grow = rd
        + Math.sin(rd * 0.021 + seed * 0.23) * ringGap * 0.42
        + Math.sin(rd * 0.009 + 1.3) * ringGap * 0.85;
      const phase = grow > 0 ? grow / ringGap : 0;
      const year = phase | 0;
      const f = phase - year;
      const sig = sigma * (0.9 + 0.16 * Math.sin(ang * 2 + year * 1.7));
      const late = Math.exp(-((f - 0.78) / sig) * ((f - 0.78) / sig));
      const hi = Math.exp(-((f - 0.6) / 0.11) * ((f - 0.6) / 0.11));
      const amp = 0.58 + hash(seed, year + 11) * 0.38;

      col[0] = fill[0];
      col[1] = fill[1];
      col[2] = fill[2];
      mix(mid[0], mid[1], mid[2], 0.16 + hi * 0.1);
      const yt = (hash(seed, year + 3) - 0.5) * 0.08;
      if (yt >= 0) mix(pith[0], pith[1], pith[2], yt);
      else mix(dark[0], dark[1], dark[2], -yt);
      mix(pith[0], pith[1], pith[2], hi * 0.16);
      const tLate = late * amp;
      mix(dark[0], dark[1], dark[2], tLate * (oak ? 0.92 : 0.78));
      if (!oak) mix(bark[0], bark[1], bark[2], tLate * 0.12);

      const pd = Math.hypot(px - offX, py - offY);
      const u = pd / pithR;
      if (u < 1.4) {
        const pin = 1 - ss(0.38, 1.22, u);
        mix(pith[0], pith[1], pith[2], pin * 0.92);
        const pf = u * 3.2;
        const ff = pf - Math.floor(pf);
        const pring = Math.exp(-((ff - 0.7) / 0.15) * ((ff - 0.7) / 0.15));
        mix(dark[0], dark[1], dark[2], pin * pring * 0.32);
        mix(pith[0], pith[1], pith[2], (1 - ss(0, 0.26, u)) * 0.4);
        const rim = Math.exp(-((u - 1) / 0.16) * ((u - 1) / 0.16));
        mix(dark[0], dark[1], dark[2], rim * 0.42);
      }

      if (dist > pithR && dist < R * 0.92) {
        const wobA = ang + Math.sin(dist * 0.05 + seed) * 0.04;
        let ray = Math.sin(wobA * rayN);
        if (ray < 0) ray = 0;
        ray = Math.pow(ray, rayPow);
        const gate = 0.5 + 0.5 * Math.sin(dist * 0.09 + wobA * 2.2);
        ray *= ss(0.28, 0.75, gate);
        ray *= ss(pithR * 1.15, pithR * 2.6, dist) * (1 - ss(R * 0.7, R * 0.9, dist));
        mix(rayCol[0], rayCol[1], rayCol[2], ray * rayAmp);
      }

      if (knotEye > 0) {
        mix(dark[0], dark[1], dark[2], knotEye * 0.62);
        mix(bark[0], bark[1], bark[2], Math.max(0, knotEye - 0.72) * 0.55);
      }

      const barkT = (R - dist) / (R * (spruce ? 0.055 : 0.068));
      if (barkT < 1) {
        const rough = 0.78 + 0.16 * Math.sin(ang * 11 + seed) + 0.08 * Math.sin(ang * 23 + 2);
        mix(bark[0], bark[1], bark[2], (1 - ss(0.02, 0.88, barkT)) * rough);
        const sap = Math.exp(-((barkT - 0.86) / 0.11) * ((barkT - 0.86) / 0.11));
        mix(pith[0], pith[1], pith[2], sap * 0.3);
      }

      const gn = (hash((x * 3 + seed * 17) | 0, (y * 5 + seed) | 0) - 0.5) * 3.4;
      const o = (row + x) * 4;
      const edge = R - dist;
      data[o] = col[0] + gn;
      data[o + 1] = col[1] + gn * 0.88;
      data[o + 2] = col[2] + gn * 0.7;
      data[o + 3] = edge >= 1.15 ? 255 : edge <= 0 ? 0 : (edge / 1.15) * 255;
    }
  }

  g.putImageData(img, 0, 0);
  return c;
}

const HEART_FIT = (() => {
  let maxR = 0;
  for (let i = 0; i <= 720; i++) {
    const t = (i / 720) * TWO_PI;
    const s = Math.sin(t);
    const x = 16 * s * s * s;
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    maxR = Math.max(maxR, Math.hypot(x, y));
  }
  const N = 256;
  const lut = new Float64Array(N);
  const acc = new Float64Array(N);
  const w = new Float64Array(N);
  for (let i = 0; i <= 2880; i++) {
    const t = (i / 2880) * TWO_PI;
    const s = Math.sin(t);
    const x = 16 * s * s * s;
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    const rr = Math.hypot(x, y) / maxR;
    let a = Math.atan2(y, x);
    if (a < 0) a += TWO_PI;
    const b = Math.floor(a / TWO_PI * N) % N;
    acc[b] += rr;
    w[b] += 1;
  }
  for (let i = 0; i < N; i++) lut[i] = w[i] ? acc[i] / w[i] : 0;
  for (let i = 0; i < N; i++) {
    if (lut[i] > 0) continue;
    let p = 1, q = 1;
    while (lut[(i - p + N) % N] <= 0 && p < N) p++;
    while (lut[(i + q) % N] <= 0 && q < N) q++;
    const a = lut[(i - p + N) % N];
    const b = lut[(i + q) % N];
    lut[i] = a + (b - a) * (p / (p + q));
  }
  return { maxR, lut };
})();

const EGG_FIT = (() => {
  const rawSegs = [
    [[0, -1.08], [0.38, -1.08], [0.86, -0.48], [0.86, 0.08]],
    [[0.86, 0.08], [0.86, 0.70], [0.46, 1.06], [0, 1.06]],
    [[0, 1.06], [-0.46, 1.06], [-0.86, 0.70], [-0.86, 0.08]],
    [[-0.86, 0.08], [-0.86, -0.48], [-0.38, -1.08], [0, -1.08]]
  ];
  function at(seg, t) {
    const p0 = seg[0], p1 = seg[1], p2 = seg[2], p3 = seg[3];
    const u = 1 - t;
    return {
      x: u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
      y: u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]
    };
  }
  const pts = [];
  for (let s = 0; s < rawSegs.length; s++) {
    for (let i = 0; i < 80; i++) pts.push(at(rawSegs[s], i / 80));
  }
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const cx = (minX + maxX) * 0.5;
  const cy = (minY + maxY) * 0.5;
  let maxR = 0;
  for (let i = 0; i < pts.length; i++) {
    maxR = Math.max(maxR, Math.hypot(pts[i].x - cx, pts[i].y - cy));
  }
  const segs = rawSegs.map(seg => seg.map(p => [(p[0] - cx) / maxR, (p[1] - cy) / maxR]));
  const N = 256;
  const lut = new Float64Array(N);
  const acc = new Float64Array(N);
  const w = new Float64Array(N);
  for (let s = 0; s < rawSegs.length; s++) {
    for (let i = 0; i < 180; i++) {
      const p = at(rawSegs[s], i / 180);
      const x = (p.x - cx) / maxR;
      const y = (p.y - cy) / maxR;
      const rr = Math.hypot(x, y);
      let a = Math.atan2(y, x);
      if (a < 0) a += TWO_PI;
      const b = Math.floor(a / TWO_PI * N) % N;
      acc[b] += rr;
      w[b] += 1;
    }
  }
  for (let i = 0; i < N; i++) lut[i] = w[i] ? acc[i] / w[i] : 0;
  for (let i = 0; i < N; i++) {
    if (lut[i] > 0) continue;
    let p = 1, q = 1;
    while (lut[(i - p + N) % N] <= 0 && p < N) p++;
    while (lut[(i + q) % N] <= 0 && q < N) q++;
    const a = lut[(i - p + N) % N];
    const bv = lut[(i + q) % N];
    lut[i] = a + (bv - a) * (p / (p + q));
  }
  return { segs, lut };
})();

