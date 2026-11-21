/* ---------- textures ---------- */
function shadeHex(hex, amt) {
  const h = String(hex || "#8a8f96").replace("#", "");
  let r = parseInt(h.slice(0, 2), 16);
  let g = parseInt(h.slice(2, 4), 16);
  let b = parseInt(h.slice(4, 6), 16);
  if (amt < 0) {
    const k = 1 + amt;
    r = (r * k) | 0;
    g = (g * k) | 0;
    b = (b * k) | 0;
  } else {
    r = (r + (255 - r) * amt) | 0;
    g = (g + (255 - g) * amt) | 0;
    b = (b + (255 - b) * amt) | 0;
  }
  return "rgb(" + r + "," + g + "," + b + ")";
}

/* ---------- рукоять короче ----------
   Рукоять у всех ножей выходила длиннее клинка. Правится одним числом: полосу
   рисунка от KNIFE_HANDLE_EDGE и ниже сжимаем к этой линии в KNIFE_HANDLE_KEEP
   раз, а клинок и гарду (выше линии) оставляем как есть — поэтому и точка
   удара (KNIFE_BLADE_END в js/hit.js: под кромку уходит KNIFE_SINK клинка) не
   сдвигается, и хитбокс трогать не надо. Размер рисунка (180x500) и посадка
   ножа в бревно тоже не меняются: рукоять просто кончается ближе к кромке.
   У ракетки (paintTennis, js/knife-paint.js) рисунок перевёрнут: рукоять с
   мячом сверху, головка со струнами снизу. Ей сжимаем верхнюю полосу — до
   KNIFE_HANDLE_EDGE_FLIP, так обод ракетки остаётся круглым.
   KNIFE_HANDLE_KEEP = 1 — прежняя длина и прежний код отрисовки. */
const KNIFE_HANDLE_KEEP = 0.66;
const KNIFE_HANDLE_EDGE = 274;
const KNIFE_HANDLE_EDGE_FLIP = { tennis: 196 };

/* Какая полоса рисунка считается рукоятью: { edge, flip }. flip — полоса
   СВЕРХУ (у перевёрнутого рисунка), edge — линия, на которой она кончается. */
function knifeHandleBand(skin) {
  const id = skin && skin.id;
  const shape = skin && skin.shape;
  const v = (id && KNIFE_HANDLE_EDGE_FLIP[id] !== undefined) ? KNIFE_HANDLE_EDGE_FLIP[id]
    : (shape ? KNIFE_HANDLE_EDGE_FLIP[shape] : undefined);
  return { edge: v === undefined ? KNIFE_HANDLE_EDGE : v, flip: v !== undefined };
}

/* Картинка скина: один файл. Холст/экран — KNIFE_SRC → knifeW×knifeH.
   Классика задаёт эталон: где остриё и какая длина контента. Остальные фото
   кладём в тот же tip+span — втыкаются и торчат как обычный нож, без раздувания слота. */
const knifeImages = Object.create(null);
let knifeRefTip = 0;
let knifeRefSpan = 0;

function loadKnifeImages(done) {
  const pending = [];
  for (let i = 0; i < KNIFE_SKINS.length; i++) {
    if (KNIFE_SKINS[i].src) pending.push(KNIFE_SKINS[i]);
  }
  if (!pending.length) {
    done();
    return;
  }
  let left = pending.length;
  for (let i = 0; i < pending.length; i++) {
    const skin = pending[i];
    const img = new Image();
    const finish = (ok) => {
      if (ok) {
        img.__fitId = "knife:" + skin.id;
        knifeImages[skin.id] = img;
      }
      if (window.GameLoader) window.GameLoader.imgDone();
      if (--left === 0) done();
    };
    img.decoding = "async";
    /* onload с decoding="async" не гарантирует, что картинка уже
       декодирована: drawImage в этот момент может дать пустое полотно, и
       тогда рамка контента закэшируется нулевой (все ножи растянутся на весь
       холст). decode() дожидается готовности — сборка атласов стабильна. */
    img.onload = () => {
      /* decode() ждёт готовности пикселей. В редких браузерах/встроенных
         webview его промис может не разрешиться вовсе — тогда загрузка игры
         висела бы на 0% навсегда. Даём декодированию конечное время и в любом
         случае засчитываем файл: сам img уже onload, атлас соберётся. */
      let settled = false;
      const ok = () => {
        if (settled) return;
        settled = true;
        finish(true);
      };
      if (img.decode) {
        let p = null;
        try { p = img.decode(); } catch (e) { p = null; }
        if (p) {
          p.then(ok, ok);
          setTimeout(ok, 2500);
        } else {
          ok();
        }
      } else {
        ok();
      }
    };
    img.onerror = () => finish(false);
    img.src = skin.src;
  }
}

/* Исходный экранный размер слота — один на все ножи. */
function knifeViewSize() {
  return [knifeW, knifeH];
}

function knifeContentSpan(c) {
  const w = c.width | 0;
  const h = c.height | 0;
  if (!(w > 0 && h > 0)) return { tip: 0, end: 0, span: 1 };
  let data;
  try {
    data = c.getContext("2d").getImageData(0, 0, w, h).data;
  } catch (e) {
    return { tip: 0, end: h - 1, span: h };
  }
  let tip = -1;
  let end = -1;
  for (let y = 0; y < h; y++) {
    const row = y * w * 4;
    for (let x = 0; x < w; x++) {
      if (data[row + x * 4 + 3] < 40) continue;
      if (tip < 0) tip = y;
      end = y;
      break;
    }
  }
  if (tip < 0) return { tip: 0, end: 0, span: 1 };
  return { tip, end, span: Math.max(1, end - tip + 1) };
}

function knifeMarkTip(c) {
  const b = knifeContentSpan(c);
  c.__tipY = b.tip;
  c.__endY = b.end;
  return b.tip;
}

/* Сдвиг посадки, если остриё всё ещё не на эталоне (процедурные / сбой запекания). */
function knifeTipAlign(img) {
  const src = img || knifeImg();
  const raw = src && src.__tipY;
  const tip = typeof raw === "number" && isFinite(raw) ? raw : 0;
  const base = knifeRefSpan > 0
    ? knifeRefTip
    : ((assets.knives && assets.knives.classic && assets.knives.classic.__tipY) || 0);
  return knifeH * ((tip - base) / KNIFE_SRC_H);
}

/* Насколько ВИДИМОЕ остриё ниже точки привязки drawKnifeImg/drawSpinKnife.
   drawKnifeImg выравнивает все скины по классике (knifeTipAlign), поэтому у
   любого ножа кончик лезвия стоит на одном и том же прозрачном запасе
   классического спрайта. Полёт и посадка считаются по привязке (k.y — верх
   спрайта), а касание игрок видит по острию; отскоку от рукояти нужно именно
   видимое остриё (js/flow.js: simulateFlight). */
function knifeTipPad() {
  return knifeH * ((knifeRefTip || 0) / KNIFE_SRC_H);
}

/* Насколько низко от привязки (верх спрайта) лежит ВИДИМЫЙ конец рукояти.
   У фото-классики рукоять не сжимается KNIFE_HANDLE_KEEP (сжатие живёт только
   в процедурной отрисовке), поэтому её настоящий конец ниже, чем прежние
   0.84·kh. По этому запасу считается полоса рукояти и точка отскока
   (js/hit.js: knifeMetrics). */
function knifeButtPad() {
  const classic = assets.knives && assets.knives.classic;
  let pad = knifeEndPad(classic);
  /* Спрайт ещё не собран / пиксели не прочитались — держим прежний ориентир
     сжатой рукояти. Он ниже острия и не обнуляет полосу отскока. */
  if (!(pad > 0)) pad = knifeH * 0.84;
  return pad;
}

/* То же для конкретного спрайта: у процедурных скинов рукоять сжата сильнее,
   чем у фото-классики, поэтому у воткнутого ножа свой видимый конец. */
function knifeEndPad(img) {
  const src = img || knifeImg();
  const end = src && src.__endY;
  if (!(typeof end === "number" && isFinite(end) && end > 0)) return 0;
  return knifeH * (Math.min(end, KNIFE_SRC_H) / KNIFE_SRC_H);
}

function makeKnife(skin) {
  skin = skin || KNIFE_SKINS[0];
  const photo = knifeImages[skin.id];
  if (photo) {
    const iw = Math.max(1, photo.naturalWidth || photo.width || KNIFE_SRC_W);
    const ih = Math.max(1, photo.naturalHeight || photo.height || KNIFE_SRC_H);
    const fit = (typeof bossPhotoContent === "function" && bossPhotoContent(photo))
      || { x: 0, y: 0, w: iw, h: ih };
    const [c, g] = makeCanvas(KNIFE_SRC_W, KNIFE_SRC_H);
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = "high";
    if (skin.id === "classic" || !(knifeRefSpan > 0)) {
      /* классика: файл целиком в высоту слота — эталон длины и острия.
         Опорные tip/span берём из рамки контента, а не из пикселей канваса:
         чтение пикселей на загрузке может сорваться (canvas ещё не готов),
         и тогда эталон 0/500 растягивал бы все остальные ножи на весь холст. */
      const scale = KNIFE_SRC_H / ih;
      const dw = iw * scale;
      g.drawImage(photo, (KNIFE_SRC_W - dw) * 0.5, 0, dw, KNIFE_SRC_H);
      knifeRefTip = Math.round(fit.y * scale);
      knifeRefSpan = Math.max(1, Math.round(fit.h * scale));
      c.__tipY = knifeRefTip;
      c.__endY = Math.round((fit.y + fit.h) * scale);
      if (!(c.__endY > c.__tipY)) c.__endY = knifeRefTip + knifeRefSpan;
      return c;
    }
    /* остальные: тот же tip и та же длина контента, что у классики. Широкие
       спрайты (морская коллекция — почти квадратные) в узкий холст 180×500
       не влезают: ограничиваем и по ширине, иначе крестовина и гарда режутся
       краями канвы. */
    const scale = Math.min(knifeRefSpan / Math.max(1, fit.h), KNIFE_SRC_W / Math.max(1, fit.w));
    const dw = fit.w * scale;
    g.drawImage(photo, fit.x, fit.y, fit.w, fit.h,
      (KNIFE_SRC_W - dw) * 0.5, knifeRefTip, dw, knifeRefSpan);
    c.__tipY = knifeRefTip;
    c.__endY = knifeRefTip + knifeRefSpan;
    return c;
  }
  const [c, g] = makeCanvas(KNIFE_SRC_W, KNIFE_SRC_H);
  g.lineJoin = "round";
  g.lineCap = "round";
  g.translate(KNIFE_SRC_W * 0.5, 0);
  const keep = KNIFE_HANDLE_KEEP;
  const band = knifeHandleBand(skin);
  const edge = band.edge;
  if (!(keep > 0 && keep < 1)) {
    paintKnife(g, skin);
    knifeMarkTip(c);
    return c;
  }
  /* Рисунок идёт двумя проходами с обрезкой по линии рукояти: одна полоса —
     под сжатием (у обычного ножа нижняя), другая — как есть. Обрезка нужна
     потому, что нож рисуется одним вызовом — и классика, и ножи боссов из
     js/knife-paint.js. На самой линии сжатие равно единице, поэтому полосы
     стыкуются без шва. */
  const y0 = band.flip ? 0 : edge;
  const h0 = band.flip ? edge : KNIFE_SRC_H - edge;
  const y1 = band.flip ? edge : 0;
  const h1 = band.flip ? KNIFE_SRC_H - edge : edge;
  g.save();
  g.beginPath();
  g.rect(-KNIFE_SRC_W, y0, KNIFE_SRC_W * 2, h0);
  g.clip();
  g.translate(0, edge);
  g.scale(1, keep);
  g.translate(0, -edge);
  paintKnife(g, skin);
  g.restore();
  g.save();
  g.beginPath();
  g.rect(-KNIFE_SRC_W, y1, KNIFE_SRC_W * 2, h1);
  g.clip();
  paintKnife(g, skin);
  g.restore();
  knifeMarkTip(c);
  return c;
}

/* Рисунок ножа целиком — и классика со своими формами, и ножи боссов
   (js/knife-paint.js). Вынесен из makeKnife отдельной функцией: рукоять
   рисуется вторым проходом, под сжатием. */
function paintKnife(g, skin) {
  if (paintBossKnife(g, skin)) return;

  const blade = skin.blade || "#cfd6dc";
  const edge = skin.edge || "#5a626a";
  const wood = skin.handle || "#6b4a32";
  const metal = skin.guard || "#c4a06a";
  const butt = skin.pommel || "#c4a06a";
  const wrap = skin.stripe || "#8a6344";
  const shape = skin.shape || "classic";

  function bladePath() {
    g.beginPath();
    if (shape === "tomato") {
      g.moveTo(0, 22);
      g.bezierCurveTo(-10, 48, -24, 70, -32, 104);
      g.bezierCurveTo(-40, 142, -22, 164, -34, 198);
      g.bezierCurveTo(-42, 232, -22, 252, -16, 258);
      g.lineTo(16, 258);
      g.bezierCurveTo(22, 252, 42, 232, 34, 198);
      g.bezierCurveTo(22, 164, 40, 142, 32, 104);
      g.bezierCurveTo(24, 70, 10, 48, 0, 22);
    } else if (shape === "helm") {
      g.moveTo(0, 14);
      g.lineTo(-5, 40);
      g.lineTo(-16, 130);
      g.bezierCurveTo(-19, 186, -17, 230, -14, 258);
      g.lineTo(13, 258);
      g.lineTo(16, 228);
      g.bezierCurveTo(14, 150, 9, 78, 4, 40);
    } else if (shape === "machete") {
      g.moveTo(2, 14);
      g.lineTo(-6, 40);
      g.bezierCurveTo(-20, 86, -36, 148, -38, 206);
      g.bezierCurveTo(-36, 236, -24, 254, -14, 258);
      g.lineTo(18, 258);
      g.lineTo(20, 240);
      g.bezierCurveTo(24, 188, 16, 112, 10, 48);
      g.lineTo(2, 14);
    } else if (shape === "donut") {
      g.moveTo(0, 16);
      g.bezierCurveTo(-3, 48, -10, 92, -13, 142);
      g.bezierCurveTo(-16, 192, -14, 232, -12, 258);
      g.lineTo(8, 258);
      g.lineTo(10, 242);
      g.quadraticCurveTo(28, 224, 11, 206);
      g.quadraticCurveTo(30, 184, 12, 164);
      g.quadraticCurveTo(26, 142, 11, 122);
      g.bezierCurveTo(14, 84, 8, 46, 0, 16);
    } else {
      g.moveTo(0, 16);
      g.bezierCurveTo(-3, 42, -10, 78, -16, 128);
      g.bezierCurveTo(-24, 186, -28, 220, -24, 246);
      g.lineTo(-16, 258);
      g.lineTo(16, 258);
      g.lineTo(24, 246);
      g.bezierCurveTo(28, 220, 24, 186, 16, 128);
      g.bezierCurveTo(10, 78, 3, 42, 0, 16);
    }
    g.closePath();
  }

  bladePath();
  const steel = g.createLinearGradient(-30, 0, 30, 0);
  steel.addColorStop(0, shadeHex(edge, 0.08));
  steel.addColorStop(0.16, shadeHex(blade, 0.42));
  steel.addColorStop(0.38, blade);
  steel.addColorStop(0.62, shadeHex(blade, -0.06));
  steel.addColorStop(1, shadeHex(blade, -0.32));
  g.fillStyle = steel;
  g.fill();

  g.save();
  bladePath();
  g.clip();
  const falloff = g.createLinearGradient(0, 16, 0, 258);
  falloff.addColorStop(0, "rgba(255,255,255,0.34)");
  falloff.addColorStop(0.22, "rgba(255,255,255,0.06)");
  falloff.addColorStop(1, "rgba(0,0,0,0.16)");
  g.fillStyle = falloff;
  g.fillRect(-40, 0, 80, 270);
  g.beginPath();
  g.moveTo(0, 64);
  g.bezierCurveTo(-3.4, 108, -3.8, 168, -2.4, 226);
  g.bezierCurveTo(-1.2, 236, 1.2, 236, 2.4, 226);
  g.bezierCurveTo(3.8, 168, 3.4, 108, 0, 64);
  g.closePath();
  g.fillStyle = shadeHex(blade, -0.34);
  g.globalAlpha = 0.8;
  g.fill();
  g.globalAlpha = 1;
  g.beginPath();
  g.moveTo(-1.5, 74);
  g.bezierCurveTo(-2.4, 120, -2.5, 175, -1.4, 220);
  g.strokeStyle = shadeHex(blade, 0.72);
  g.lineWidth = 1.5;
  g.stroke();
  g.beginPath();
  g.moveTo(8, 56);
  g.bezierCurveTo(14, 120, 18, 180, 15, 232);
  g.strokeStyle = shadeHex(edge, 0.05);
  g.globalAlpha = 0.45;
  g.lineWidth = 2.2;
  g.stroke();
  g.globalAlpha = 1;
  if (shape === "tomato") {
    const blush = g.createRadialGradient(-4, 130, 10, 0, 150, 100);
    blush.addColorStop(0, "rgba(210, 64, 48, 0.2)");
    blush.addColorStop(1, "rgba(210, 64, 48, 0)");
    g.fillStyle = blush;
    g.fillRect(-50, 20, 100, 240);
    g.fillStyle = "rgba(255, 228, 186, 0.9)";
    const seeds = [[-8, 108, 0.5], [7, 132, -0.4], [-4, 158, 0.7], [8, 186, 0.15], [-7, 210, -0.55], [2, 228, 0.3]];
    for (let i = 0; i < seeds.length; i++) {
      const s = seeds[i];
      g.save();
      g.translate(s[0], s[1]);
      g.rotate(s[2]);
      g.beginPath();
      g.ellipse(0, 0, 3.4, 1.7, 0, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }
  } else if (shape === "helm") {
    g.strokeStyle = "rgba(168, 112, 58, 0.45)";
    g.lineWidth = 1.3;
    g.beginPath();
    g.moveTo(-2.2, 48);
    g.lineTo(-2.2, 236);
    g.moveTo(2.2, 48);
    g.lineTo(2.2, 236);
    g.stroke();
  } else if (shape === "donut") {
    g.fillStyle = "rgba(255, 126, 164, 0.38)";
    g.beginPath();
    g.moveTo(2, 64);
    g.bezierCurveTo(10, 110, 12, 170, 8, 230);
    g.lineTo(1, 236);
    g.bezierCurveTo(4, 170, 3, 110, -2, 68);
    g.closePath();
    g.fill();
    const spr = ["#e4453a", "#3d7dff", "#ffd23f", "#3dcc6a", "#ff8c3a"];
    const dots = [[-4, 96, 0.4], [6, 124, 1.1], [-2, 156, 0.2], [5, 188, 2.1], [-5, 214, 0.8]];
    for (let i = 0; i < dots.length; i++) {
      g.save();
      g.translate(dots[i][0], dots[i][1]);
      g.rotate(dots[i][2]);
      g.fillStyle = spr[i];
      g.fillRect(-3.2, -1.15, 6.4, 2.3);
      g.restore();
    }
  }
  g.restore();

  bladePath();
  g.strokeStyle = edge;
  g.lineWidth = 2.4;
  g.stroke();

  g.save();
  bladePath();
  g.clip();
  g.beginPath();
  g.moveTo(-5, 46);
  g.bezierCurveTo(-10, 100, -16, 160, -15, 214);
  g.strokeStyle = skin.hi;
  g.lineWidth = 3.2;
  g.stroke();
  g.beginPath();
  g.moveTo(-2, 28);
  g.lineTo(-4, 58);
  g.strokeStyle = "rgba(255,255,255,0.72)";
  g.lineWidth = 1.6;
  g.stroke();
  g.restore();

  if (shape === "tomato" || shape === "helm" || shape === "donut") {
    if (shape === "tomato") {
      g.beginPath();
      g.moveTo(-12, 258);
      g.bezierCurveTo(-22, 318, -4, 352, -16, 410);
      g.bezierCurveTo(-22, 452, -6, 486, 2, 496);
      g.bezierCurveTo(14, 484, 20, 446, 14, 404);
      g.bezierCurveTo(8, 348, 22, 312, 12, 258);
      g.closePath();
      const stalk = g.createLinearGradient(-20, 0, 18, 0);
      stalk.addColorStop(0, "#245012");
      stalk.addColorStop(0.38, "#78b84a");
      stalk.addColorStop(0.72, "#3f7a22");
      stalk.addColorStop(1, "#1c400e");
      g.fillStyle = stalk;
      g.fill();
      g.strokeStyle = "#1a3c10";
      g.lineWidth = 1.8;
      g.stroke();
      g.strokeStyle = "rgba(214, 232, 150, 0.55)";
      g.lineWidth = 1.4;
      g.beginPath();
      g.moveTo(-4, 276);
      g.bezierCurveTo(-8, 340, -2, 400, -6, 470);
      g.stroke();
      for (let i = 0; i < 3; i++) {
        g.fillStyle = i === 1 ? "#2f6218" : "#4e9228";
        g.beginPath();
        g.ellipse(-2 + i * 2, 312 + i * 62, 15, 5.5, 0.15 * (i - 1), 0, Math.PI * 2);
        g.fill();
      }
      g.save();
      g.translate(-6, 338);
      g.rotate(-0.55);
      g.beginPath();
      g.moveTo(4, 2);
      g.bezierCurveTo(-18, -22, -62, -10, -70, 8);
      g.bezierCurveTo(-46, 22, -14, 16, 4, 4);
      g.closePath();
      g.fillStyle = "#4c9628";
      g.fill();
      g.strokeStyle = "#214812";
      g.lineWidth = 1.5;
      g.stroke();
      g.beginPath();
      g.moveTo(0, 3);
      g.quadraticCurveTo(-34, 2, -58, 8);
      g.strokeStyle = "#2a5416";
      g.lineWidth = 1.2;
      g.stroke();
      g.restore();
      g.save();
      g.translate(8, 424);
      g.rotate(0.85);
      g.beginPath();
      g.moveTo(-2, 0);
      g.bezierCurveTo(16, -18, 54, -4, 60, 12);
      g.bezierCurveTo(36, 22, 10, 14, -2, 3);
      g.closePath();
      g.fillStyle = "#3d7c20";
      g.fill();
      g.strokeStyle = "#214812";
      g.lineWidth = 1.5;
      g.stroke();
      g.beginPath();
      g.moveTo(0, 2);
      g.quadraticCurveTo(28, 4, 48, 12);
      g.strokeStyle = "#2a5416";
      g.lineWidth = 1.2;
      g.stroke();
      g.restore();
      g.fillStyle = "#d5e2a4";
      g.beginPath();
      g.ellipse(2, 494, 11, 4.2, 0.1, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = "#6a8a32";
      g.lineWidth = 1.2;
      g.stroke();
    } else if (shape === "helm") {
      g.save();
      bladePath();
      g.clip();
      const fade = g.createLinearGradient(0, 170, 0, 258);
      fade.addColorStop(0, "rgba(196, 146, 88, 0)");
      fade.addColorStop(1, "rgba(168, 112, 58, 0.75)");
      g.fillStyle = fade;
      g.fillRect(-30, 160, 60, 110);
      g.restore();
      const wood = g.createLinearGradient(-28, 0, 28, 0);
      wood.addColorStop(0, "#4a2c14");
      wood.addColorStop(0.22, "#c49258");
      wood.addColorStop(0.48, "#f3e2b4");
      wood.addColorStop(0.74, "#b07a40");
      wood.addColorStop(1, "#3c2410");
      function helmGrip() {
        g.beginPath();
        g.moveTo(-15, 272);
        g.bezierCurveTo(-22, 318, -24, 390, -20, 442);
        g.bezierCurveTo(-17, 468, -10, 484, 0, 492);
        g.bezierCurveTo(10, 484, 17, 468, 20, 442);
        g.bezierCurveTo(24, 390, 22, 318, 15, 272);
        g.closePath();
      }
      g.fillStyle = wood;
      helmGrip();
      g.fill();
      g.strokeStyle = "#3a2412";
      g.lineWidth = 1.7;
      g.stroke();
      g.save();
      helmGrip();
      g.clip();
      g.strokeStyle = "rgba(90, 48, 18, 0.28)";
      g.lineWidth = 1;
      for (let i = 0; i < 9; i++) {
        const y = 318 + i * 18;
        g.beginPath();
        g.moveTo(-18, y);
        g.quadraticCurveTo(0, y + 4, 18, y + 1);
        g.stroke();
      }
      g.strokeStyle = "rgba(255, 244, 220, 0.55)";
      g.lineWidth = 2.4;
      g.beginPath();
      g.moveTo(-6, 314);
      g.bezierCurveTo(-7, 360, -6, 420, -4, 468);
      g.stroke();
      g.restore();
      g.fillStyle = wood;
      g.strokeStyle = "#3a2412";
      g.lineWidth = 1.6;
      g.beginPath();
      g.roundRect(-54, 252, 108, 34, 17);
      g.fill();
      g.stroke();
      g.beginPath();
      g.roundRect(-72, 248, 26, 42, 13);
      g.fill();
      g.stroke();
      g.beginPath();
      g.roundRect(46, 248, 26, 42, 13);
      g.fill();
      g.stroke();
      g.save();
      g.beginPath();
      g.roundRect(-72, 248, 144, 42, 16);
      g.clip();
      g.strokeStyle = "rgba(255, 236, 200, 0.45)";
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(-60, 258);
      g.quadraticCurveTo(0, 252, 60, 258);
      g.stroke();
      g.restore();
      const brass = g.createLinearGradient(-16, 0, 16, 0);
      brass.addColorStop(0, "#6a4420");
      brass.addColorStop(0.4, "#f0dc9a");
      brass.addColorStop(1, "#7a4e28");
      g.fillStyle = brass;
      g.strokeStyle = "#3a2412";
      g.lineWidth = 1.2;
      g.beginPath();
      g.roundRect(-17, 278, 34, 14, 4);
      g.fill();
      g.stroke();
    } else {
      const lobes = [
        { y: 296, rx: 40, ry: 44 },
        { y: 348, rx: 42, ry: 46 },
        { y: 404, rx: 43, ry: 48 },
        { y: 460, rx: 40, ry: 42 }
      ];
      const dough = g.createLinearGradient(-44, 0, 44, 0);
      dough.addColorStop(0, "#a86a38");
      dough.addColorStop(0.34, "#f6dcb0");
      dough.addColorStop(0.68, "#e2b06a");
      dough.addColorStop(1, "#8a542c");
      g.fillStyle = dough;
      g.beginPath();
      for (let i = 0; i < lobes.length; i++) {
        g.moveTo(lobes[i].rx, lobes[i].y);
        g.ellipse(0, lobes[i].y, lobes[i].rx, lobes[i].ry, 0, 0, Math.PI * 2);
      }
      g.fill();
      g.save();
      g.beginPath();
      for (let i = 0; i < lobes.length; i++) {
        g.moveTo(lobes[i].rx, lobes[i].y);
        g.ellipse(0, lobes[i].y, lobes[i].rx, lobes[i].ry, 0, 0, Math.PI * 2);
      }
      g.clip();
      g.fillStyle = "rgba(255, 126, 168, 0.5)";
      g.fillRect(-50, 250, 100, 120);
      g.fillStyle = "rgba(255,255,255,0.42)";
      g.beginPath();
      g.ellipse(-12, 278, 14, 6, -0.5, 0, Math.PI * 2);
      g.fill();
      const spr = ["#e4453a", "#3d7dff", "#ffd23f", "#3dcc6a", "#ff8c3a"];
      const dots = [[-14, 292, 0.3], [16, 318, 1.1], [-10, 346, -0.4], [18, 378, 0.7], [-16, 408, 1.5], [12, 436, 0.2], [-8, 468, 2.1], [14, 488, 0.9]];
      for (let i = 0; i < dots.length; i++) {
        g.save();
        g.translate(dots[i][0], dots[i][1]);
        g.rotate(dots[i][2]);
        g.fillStyle = spr[i % spr.length];
        g.fillRect(-4.2, -1.4, 8.4, 2.8);
        g.restore();
      }
      g.restore();
      g.globalCompositeOperation = "destination-out";
      for (let i = 0; i < lobes.length; i++) {
        g.beginPath();
        g.ellipse(0, lobes[i].y, 11, 15, 0, 0, Math.PI * 2);
        g.fill();
      }
      g.globalCompositeOperation = "source-over";
      g.strokeStyle = "#8a542c";
      g.lineWidth = 1.8;
      for (let i = 0; i < lobes.length; i++) {
        const lobe = lobes[i];
        g.beginPath();
        g.ellipse(0, lobe.y, lobe.rx, lobe.ry, 0, -0.62, 0.62);
        g.stroke();
        g.beginPath();
        g.ellipse(0, lobe.y, lobe.rx, lobe.ry, 0, Math.PI - 0.62, Math.PI + 0.62);
        g.stroke();
      }
      g.beginPath();
      g.ellipse(0, lobes[0].y, lobes[0].rx, lobes[0].ry, 0, -Math.PI + 0.7, -0.7);
      g.stroke();
      const last = lobes[lobes.length - 1];
      g.beginPath();
      g.ellipse(0, last.y, last.rx, last.ry, 0, 0.7, Math.PI - 0.7);
      g.stroke();
      g.strokeStyle = "#c9a070";
      g.lineWidth = 1.5;
      for (let i = 0; i < lobes.length; i++) {
        g.beginPath();
        g.ellipse(0, lobes[i].y, 11, 15, 0, 0, Math.PI * 2);
        g.stroke();
      }
    }
    /* рукоять этой формы нарисована целиком выше: общий набор пластин,
       обмотки и навершия ниже ей не нужен */
    return;
  }

  const brass = g.createLinearGradient(0, 236, 0, 276);
  brass.addColorStop(0, shadeHex(metal, 0.42));
  brass.addColorStop(0.42, metal);
  brass.addColorStop(1, shadeHex(metal, -0.38));
  if (shape !== "helm") {
    g.fillStyle = brass;
    g.beginPath();
    g.moveTo(-10, 244);
    g.quadraticCurveTo(-34, 236, -48, 252);
    g.quadraticCurveTo(-40, 266, -18, 272);
    g.quadraticCurveTo(-12, 268, -8, 258);
    g.closePath();
    g.fill();
    g.beginPath();
    g.moveTo(10, 244);
    g.quadraticCurveTo(34, 236, 48, 252);
    g.quadraticCurveTo(40, 266, 18, 272);
    g.quadraticCurveTo(12, 268, 8, 258);
    g.closePath();
    g.fill();
    g.beginPath();
    g.moveTo(-16, 248);
    g.lineTo(16, 248);
    g.quadraticCurveTo(14, 274, 12, 278);
    g.lineTo(-12, 278);
    g.quadraticCurveTo(-14, 274, -16, 248);
    g.closePath();
    g.fill();
    g.fillStyle = shadeHex(metal, 0.5);
    g.fillRect(-7, 250, 4, 22);
    g.strokeStyle = shadeHex(metal, -0.45);
    g.lineWidth = 1.4;
    g.beginPath();
    g.moveTo(-10, 244);
    g.quadraticCurveTo(-34, 236, -48, 252);
    g.quadraticCurveTo(-40, 266, -18, 272);
    g.moveTo(10, 244);
    g.quadraticCurveTo(34, 236, 48, 252);
    g.quadraticCurveTo(40, 266, 18, 272);
    g.stroke();
  }

  function gripPath() {
    g.beginPath();
    g.moveTo(-14, 278);
    g.bezierCurveTo(-18, 312, -19, 360, -16, 408);
    g.bezierCurveTo(-15, 428, -13, 442, -12, 450);
    g.lineTo(12, 450);
    g.bezierCurveTo(13, 442, 15, 428, 16, 408);
    g.bezierCurveTo(19, 360, 18, 312, 14, 278);
    g.closePath();
  }

  gripPath();
  const grip = g.createLinearGradient(-20, 0, 20, 0);
  grip.addColorStop(0, shadeHex(wood, -0.42));
  grip.addColorStop(0.28, shadeHex(wood, 0.16));
  grip.addColorStop(0.62, wood);
  grip.addColorStop(1, shadeHex(wood, -0.3));
  g.fillStyle = grip;
  g.fill();

  g.save();
  gripPath();
  g.clip();
  g.strokeStyle = shadeHex(wrap, -0.22);
  g.lineWidth = 5.5;
  for (let i = 0; i < 8; i++) {
    const y = 296 + i * 18;
    g.beginPath();
    g.moveTo(-22, y);
    g.lineTo(22, y + 11);
    g.stroke();
  }
  g.strokeStyle = shadeHex(wrap, 0.38);
  g.lineWidth = 1.6;
  for (let i = 0; i < 8; i++) {
    const y = 293 + i * 18;
    g.beginPath();
    g.moveTo(-22, y);
    g.lineTo(22, y + 11);
    g.stroke();
  }
  g.globalAlpha = 0.35;
  g.fillStyle = shadeHex(wood, 0.45);
  g.fillRect(-3, 286, 2.2, 156);
  g.globalAlpha = 1;
  g.restore();

  g.fillStyle = brass;
  g.beginPath();
  g.roundRect(-15, 274, 30, 12, 4);
  g.fill();
  g.beginPath();
  g.roundRect(-14, 442, 28, 12, 4);
  g.fill();
  g.fillStyle = shadeHex(metal, 0.48);
  g.fillRect(-8, 276, 3.5, 8);
  g.fillRect(-8, 444, 3.5, 8);

  g.beginPath();
  g.moveTo(-11, 454);
  g.bezierCurveTo(-20, 464, -18, 486, 0, 492);
  g.bezierCurveTo(18, 486, 20, 464, 11, 454);
  g.closePath();
  const pom = g.createLinearGradient(-18, 454, 18, 500);
  pom.addColorStop(0, shadeHex(butt, 0.38));
  pom.addColorStop(0.5, butt);
  pom.addColorStop(1, shadeHex(butt, -0.4));
  g.fillStyle = pom;
  g.fill();
  g.strokeStyle = shadeHex(butt, -0.45);
  g.lineWidth = 1.5;
  g.stroke();
  g.beginPath();
  g.arc(0, 478, 4.2, 0, Math.PI * 2);
  g.fillStyle = shadeHex(butt, -0.35);
  g.fill();
  g.beginPath();
  g.arc(-1.1, 476.6, 1.5, 0, Math.PI * 2);
  g.fillStyle = shadeHex(butt, 0.55);
  g.fill();
}

function knifeImg() {
  return (assets.knives && assets.knives[save.knife]) || (assets.knives && assets.knives.classic) || assets.knife;
}

/* Картинка ножа для отрисовки воткнутого: если у скина нет ни своей картинки,
   ни скина игрока (например, босс без ножа — СЫР), берём классику. Иначе
   draw-stuck.js падал: knifeDispImg получал undefined и читал у него __tipY. */
function knifeDrawImg(skinId) {
  const id = skinId || save.knife || "classic";
  return (assets.knives && assets.knives[id]) || knifeImg() || (assets.knives && assets.knives.classic) || null;
}

