/* Картинки боссов: один файл на босса (images/boss, 512×512, вырезаны по альфе).
   Раскладка у файлов разная: предмет занимает то больше, то меньше места и стоит
   не по центру холста. Размер и положение считает bossPhotoContent по альфе
   (центр масс + радиус тела r85), поэтому все боссы встают ровно и одного роста.
   Нет файла — босс рисуется процедурно (make*Tex). */
const BOSS_IMAGE_SRC = {
  tomato: "images/boss/01_Tomato_Boss.webp?v=2",
  cheese: "images/boss/02_Cheese_Moon_Boss.webp?v=2",
  pumpkin: "images/boss/03_Pumpkin_Boss.webp?v=2",
  marmalade: "images/boss/04_Pink_Slime_Boss.webp?v=2",
  /* файл назван «пончиком», но на нём дартс — это МИШЕНЬ */
  target: "images/boss/05_Donut_Boss.webp?v=2",
  aegis: "images/boss/06_Royal_Shield_Boss.webp?v=2",
  dummy: "images/boss/07_Scarecrow_Boss.webp?v=2",
  tire: "images/boss/08_Tire_Boss.webp?v=2",
  donut: "images/boss/09_Sprinkle_Donut_Boss.webp?v=2",
  pizza: "images/boss/10_Pepperoni_Pizza_Boss.webp?v=2",
  cog: "images/boss/11_Gear_Boss.webp?v=2",
  pie: "images/boss/Apple_Pie.webp?v=2",
  basketball: "images/boss/Basketball.webp?v=2",
  camera: "images/boss/camera.webp?v=2",
  saw: "images/boss/Circular_Saw_Blade.webp?v=2",
  coconut: "images/boss/Coconut.webp?v=2",
  compass: "images/boss/Compass.webp?v=2",
  fan: "images/boss/Cooling_Fan.webp?v=2",
  disco: "images/boss/Disco_Ball.webp?v=2",
  egg: "images/boss/Egg.webp?v=2",
  coin: "images/boss/Gold_Star_Coin.webp?v=2",
  yarn: "images/boss/Green_Yarn_Ball.webp?v=2",
  lifebelt: "images/boss/Lifebuoy.webp?v=2",
  candy: "images/boss/Peppermint_Candy.webp?v=2",
  plate: "images/boss/Porcelain_Plate.webp?v=2",
  helm: "images/boss/Ship_Wheel.webp?v=2",
  /* ВЕНТИЛЬ: красное колесо с шестью спицами и гайкой по центру —
     файл называется «Red_Ship_Wheel», но на нём именно вентиль, не штурвал. */
  valve: "images/boss/Red_Ship_Wheel.webp?v=2",
  pepsi: "images/boss/Soda_Can.webp?v=2",
  tape: "images/boss/Tape_Roll.webp?v=2",
  tennis: "images/boss/Tennis_Ball.webp?v=2",
  /* шарик — три цвета латекса, поэтому три файла (js/tex-balloon.js) */
  balloon: "images/boss/Red_Balloon.webp?v=2",
  balloonGreen: "images/boss/Green_Balloon.webp?v=2",
  balloonBlue: "images/boss/Blue_Balloon.webp?v=2"
  /* helm (ШТУРВАЛ): фото есть — Ship_Wheel, рисуется диском.
     valve (ВЕНТИЛЬ): фото есть — Red_Ship_Wheel (красное колесо), тоже диском.
     У target файл 05_Donut_Boss — дартс (см. выше).
     White_Ball.webp в игре не нужен: бильярд — это Eight_Ball. */
};
const bossImages = Object.create(null);

function bossHasPhoto(id) {
  return !!(id && bossImages[id]);
}

/* Фон с краёв (прозрачный / почти чёрный) вычищаем flood-fill — иначе чёрное
   поле вокруг съезжает центр и размер. Внутренние чёрные сектора (мишень) не
   трогаем: до них flood не доходит через цветную кромку. */
function bossPhotoIsBg(data, o, alphaOnly) {
  if (data[o + 3] < 40) return true;
  /* У вырезанных картинок фон уже в альфе — чёрное внутри (кольца мишени,
     контур) это рисунок, а не фон. */
  if (alphaOnly) return false;
  return data[o] <= 18 && data[o + 1] <= 18 && data[o + 2] <= 18;
}

function bossPhotoContent(img) {
  if (!img) return null;
  if (img.__bossFit) return img.__bossFit;
  /* Готовая рамка из js/image-fit.js: числа сняты с этих же файлов один раз
     (tools/_gen_image_fit.js). Разбор альфы на старте — самый долгий шаг
     загрузки (сотни картинок), а результат для одного файла не меняется.
     Нет записи (новая картинка) — считаем как раньше, ниже. */
  const pre = typeof IMAGE_FIT !== "undefined" && img.__fitId ? IMAGE_FIT[img.__fitId] : null;
  if (pre) {
    img.__bossFit = { x: pre[0], y: pre[1], w: pre[2], h: pre[3], cx: pre[4], cy: pre[5], r85: pre[6] };
    return img.__bossFit;
  }
  const iw = img.naturalWidth || img.width || 1;
  const ih = img.naturalHeight || img.height || 1;
  const [c, g] = makeCanvas(iw, ih);
  g.drawImage(img, 0, 0);
  let data;
  try {
    data = g.getImageData(0, 0, iw, ih).data;
  } catch (e) {
    img.__bossFit = { x: 0, y: 0, w: iw, h: ih, cx: iw * 0.5, cy: ih * 0.5 };
    return img.__bossFit;
  }
  const N = iw * ih;
  /* Если все четыре угла прозрачные — фон вырезан альфой, и режем только по
     ней. Иначе (непрозрачное фото с чёрным полем) чистим ещё и чёрное. */
  let alphaOnly = true;
  for (let k = 0; k < 4; k++) {
    const px = (k & 1) ? iw - 1 : 0;
    const py = (k & 2) ? ih - 1 : 0;
    if (data[(py * iw + px) * 4 + 3] >= 40) alphaOnly = false;
  }
  const bg = new Uint8Array(N);
  const q = new Int32Array(N);
  let qh = 0;
  let qt = 0;
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= iw || y >= ih) return;
    const i = y * iw + x;
    if (bg[i]) return;
    if (!bossPhotoIsBg(data, i * 4, alphaOnly)) return;
    bg[i] = 1;
    q[qt++] = i;
  };
  for (let x = 0; x < iw; x++) {
    push(x, 0);
    push(x, ih - 1);
  }
  for (let y = 0; y < ih; y++) {
    push(0, y);
    push(iw - 1, y);
  }
  while (qh < qt) {
    const i = q[qh++];
    const x = i % iw;
    const y = (i / iw) | 0;
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }
  let minX = iw, minY = ih, maxX = -1, maxY = -1;
  let sumX = 0, sumY = 0, sumA = 0;
  for (let y = 0; y < ih; y++) {
    for (let x = 0; x < iw; x++) {
      const i = y * iw + x;
      if (bg[i]) continue;
      const o = i * 4;
      const a = data[o + 3];
      if (a < 40) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      sumX += x * a;
      sumY += y * a;
      sumA += a;
    }
  }
  if (maxX < 0 || !(sumA > 0)) {
    img.__bossFit = { x: 0, y: 0, w: iw, h: ih, cx: iw * 0.5, cy: ih * 0.5, r85: Math.min(iw, ih) * 0.5 };
  } else {
    const cx = sumX / sumA;
    const cy = sumY / sumA;
    img.__bossFit = {
      x: minX,
      y: minY,
      w: maxX - minX + 1,
      h: maxY - minY + 1,
      cx,
      cy,
      /* r85 — радиус от центра масс, внутри которого лежит 85% веса картинки.
         Это «тело» босса: тонкий стебель, клин сыра или криво вырезанный край
         весят мало и радиус почти не двигают. По нему считается размер
         (paintBossPhotoSprite), а центр ставится по центру масс, а не по
         рамке файла — поэтому съехавшая картинка всё равно встаёт ровно. */
      r85: bossPhotoR85(data, iw, ih, bg, cx, cy)
    };
  }
  return img.__bossFit;
}

/* Радиус, внутри которого 85% веса (альфы) вокруг центра масс. */
function bossPhotoR85(data, iw, ih, bg, cx, cy) {
  const span = Math.hypot(iw, ih) || 1;
  const hist = new Int32Array(1025);
  let total = 0;
  for (let y = 0; y < ih; y++) {
    for (let x = 0; x < iw; x++) {
      const i = y * iw + x;
      if (bg[i]) continue;
      const a = data[i * 4 + 3];
      if (a < 40) continue;
      const dx = x - cx;
      const dy = y - cy;
      const bi = Math.min(1024, ((Math.sqrt(dx * dx + dy * dy) / span) * 1024) | 0);
      hist[bi] += a;
      total += a;
    }
  }
  if (!(total > 0)) return Math.min(iw, ih) * 0.5;
  const need = total * 0.85;
  let acc = 0;
  for (let i = 0; i <= 1024; i++) {
    acc += hist[i];
    if (acc >= need) return Math.max(1, ((i + 1) / 1024) * span);
  }
  return Math.max(1, span);
}

/* Фото босса один раз пересобираем в плотный offscreen-канвас и дальше рисуем
   только из него. Иначе каждый кадр шёл drawImage прямо из webp: во время
   анимации (поворот, зум, вспышка) масштаб считается заново, браузер заново
   пересэмплирует полноразмерный исходник с "high" — кадр не успевает, и спрайт
   на мгновение пропадает. Кэш обрезан по контенту: w/h — его размер,
   cx/cy — центр масс внутри кэша (в пикселях кэша). */
const BOSS_PHOTO_CACHE_MAX = 1024;
function bossPhotoSprite(img) {
  if (img.__bossSpr) return img.__bossSpr;
  const fit = bossPhotoContent(img);
  const src = Math.max(1, Math.max(fit.w, fit.h));
  const s = src > BOSS_PHOTO_CACHE_MAX ? BOSS_PHOTO_CACHE_MAX / src : 1;
  const w = Math.max(1, Math.round(fit.w * s));
  const h = Math.max(1, Math.round(fit.h * s));
  const [c, g] = makeCanvas(w, h);
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = "high";
  g.drawImage(img, fit.x, fit.y, fit.w, fit.h, 0, 0, w, h);
  img.__bossSpr = {
    c,
    w,
    h,
    cx: ((fit.cx != null ? fit.cx : fit.x + fit.w * 0.5) - fit.x) * s,
    cy: ((fit.cy != null ? fit.cy : fit.y + fit.h * 0.5) - fit.y) * s
  };
  return img.__bossSpr;
}

/* Cover по контенту: один размер у всех, центр масс спрайта → центр холста. */
function paintBossPhotoCover(g, img, size) {
  const spr = bossPhotoSprite(img);
  const scale = Math.max(size / spr.w, size / spr.h);
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = "medium";
  g.drawImage(spr.c, size * 0.5 - spr.cx * scale, size * 0.5 - spr.cy * scale, spr.w * scale, spr.h * scale);
}

/* Cover в круг size — босс того же визуального размера, что и остальные. */
function paintBossPhotoDisc(g, img, size, clipR) {
  const R = clipR == null ? size * 0.5 - 0.5 : clipR;
  g.save();
  g.beginPath();
  g.arc(size * 0.5, size * 0.5, R, 0, TWO_PI);
  g.clip();
  paintBossPhotoCover(g, img, size);
  g.restore();
}

/* Запас текстуры под выступы. Тело фото-босса — круг r, но картинке нужно
   место ещё и на черешок тыквы/помидора и на пупырки жевачки: самый дальний
   из замеренных выступов — 1.25 r (тыква). Поэтому в текстуре тело занимает
   половину холста, поделённую на этот запас, а сама текстура при отрисовке
   растягивается на r * BOSS_PHOTO_OVER (bossPhotoHalf). Тело в игре всё
   равно выходит ровно r, как у процедурных боссов, а выступы целые. */
const BOSS_PHOTO_OVER = 1.26;
/* Насколько фото-босс крупнее эталонного размера: чуть подрос, чтобы тело
   плотнее заполняло бревно (у процедурных боссов тело идёт до самой кромки). */
const BOSS_PHOTO_GROW = 1.05;
function bossPhotoHalf(r) {
  return r * BOSS_PHOTO_OVER;
}
/* Как фото ложится на босса: sprite — силуэт целиком (contain, без клипа),
   cover — заполнить квадрат без клипа (пончик с дыркой), disc — круг с обрезкой
   по кромке. Список ОДИН на всех: по нему же решает draw-log/draw-stuck, какой
   спрайт рисовать (bossPhotoIsSprite). */
const BOSS_PHOTO_KIND = {
  tomato: "sprite", cheese: "sprite", pumpkin: "sprite", marmalade: "sprite",
  target: "sprite", saw: "sprite", dummy: "sprite", pie: "sprite",
  coconut: "sprite", egg: "sprite", cog: "sprite", balloon: "sprite",
  /* синий и зелёный латекс шарика — те же фото, что и красный (три стадии
     подряд); без этих двух строк они уходили в «disc» и выходили крупнее:
     круг с обрезкой по кромке вместо силуэта целиком (tex-balloon: skins) */
  balloonBlue: "sprite", balloonGreen: "sprite",
  donut: "cover",
  pizza: "disc", basketball: "disc", plate: "disc", tape: "disc", yarn: "disc",
  tennis: "disc", coin: "disc", camera: "disc", fan: "disc", compass: "sprite",
  helm: "disc", tire: "disc", candy: "disc", lifebelt: "disc", disco: "disc",
  pepsi: "disc", aegis: "disc"
  /* ball (БИЛЬЯРД) фото не берёт: шар рисуется своим кодом (draw-stuck.js:
     paintBall), и текстура ему не нужна — Eight_Ball.webp остаётся запасным. */
};
function bossPhotoKind(id) {
  return BOSS_PHOTO_KIND[id] || "disc";
}
function bossPhotoIsSprite(id) {
  return bossPhotoKind(id) === "sprite";
}
/* Готовая текстура босса из фото или null, если файла нет. Один вход для всех
   tex-*.js: каждый файл начинается с этой проверки и возвращает текстуру. */
function bossPhotoTex(id) {
  const img = bossImages[id];
  if (!img) return null;
  const size = BOSS_TEX;
  const [c, g] = makeCanvas(size, size);
  const kind = bossPhotoKind(id);
  if (kind === "sprite") paintBossPhotoSprite(g, img, size);
  else if (kind === "cover") paintBossPhotoCover(g, img, size);
  else paintBossPhotoDisc(g, img, size, BOSS_TEX_R - 0.5);
  return c;
}
function bossPhotoBodyR(fit) {
  if (fit && fit.r85 > 0) return fit.r85;
  return Math.max(1, Math.min(fit.w || 1, fit.h || 1) * 0.5);
}

/* Contain в квадрат size — без кругового клипа и без обрезки краёв
   (помидор, жевачка, тыква, мишень, сыр, пила). Масштаб — по телу (r85), а
   не по рамке файла: кривой вырез и торчащий кусок больше не уменьшают
   босса. Центр масс → центр холста. */
function paintBossPhotoSprite(g, img, size) {
  const fit = bossPhotoContent(img);
  const cx = fit.cx != null ? fit.cx : fit.x + fit.w * 0.5;
  const cy = fit.cy != null ? fit.cy : fit.y + fit.h * 0.5;
  /* Размер: тело ≈ 0.922 половины текстуры, рамка файла как упор, плюс общий
     прирост BOSS_PHOTO_GROW. Делим на BOSS_PHOTO_OVER только потому, что
     текстура рисуется крупнее (bossPhotoHalf): босс остаётся прежнего роста,
     а выступы целы. */
  const bodyScale = (size * 0.5 * 0.922) / bossPhotoBodyR(fit);
  const fitScale = (size - 2) / Math.max(1, fit.w, fit.h);
  let scale = (Math.min(bodyScale, fitScale) / BOSS_PHOTO_OVER) * BOSS_PHOTO_GROW;
  /* Страховка от обрезки краем канваса: сколько места от центра масс до
     каждой из четырёх сторон, таков и упор. Центр масс остаётся в центре
     холста — картинка не съезжает. */
  const lim = size * 0.5 - 1;
  scale = Math.min(
    scale,
    lim / Math.max(1, cy - fit.y),
    lim / Math.max(1, fit.y + fit.h - cy),
    lim / Math.max(1, cx - fit.x),
    lim / Math.max(1, fit.x + fit.w - cx)
  );
  const ox = size * 0.5 - (cx - fit.x) * scale;
  const oy = size * 0.5 - (cy - fit.y) * scale;
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = "high";
  g.drawImage(img, fit.x, fit.y, fit.w, fit.h, ox, oy, fit.w * scale, fit.h * scale);
}
/* Фон игры. Картинка — «Минималистичный бирюзовый фон с дугами.png» из images/,
   запечённая в webp 960×1600 (портретная раскладка мира, js/wood.js: makeBg) и
   повёрнутая на 90°: так дуги остаются во всех четырёх углах кадра, а не
   обрезаются по бокам. Прозрачность/аспект прежние — остальной код не трогаем. */
const BG_IMAGE_SRC = "images/bg.webp?v=2";
let bgPhoto = null;

/* Картинки брёвен: индекс темы THEMES → файл. Нет файла — makeWood на канвасе.
   Порядок совпадает с THEMES (js/themes.js): дуб, берёза, ель, тёмный дуб,
   оливковое, дальше шесть вариантов разноцветного. Оранжевого дерева в игре
   нет — его файл 01_Orange_Wood_Slice.webp больше не грузим (был третьим).
   ЕЛЬ — ровно тот файл, что лежит в images/wood: «Срез елового ствола с кольцами
   и сучками.webp», без переделок и без копий. */
const WOOD_IMAGE_SRC = {
  0: "images/wood/oak.webp?v=1",
  1: "images/wood/bereza.webp?v=1",
  2: "images/wood/Срез елового ствола с кольцами и сучками.webp?v=3",
  3: "images/wood/temny dub.webp?v=1",
  4: "images/wood/05_Olive_Wood_Slice.webp?v=1",
  5: "images/wood/rainbow/01_Rainbow_Splash_Wood.webp?v=1",
  6: "images/wood/rainbow/02_Solar_Wave_Wood.webp?v=1",
  7: "images/wood/rainbow/03_Aurora_Burst_Wood.webp?v=1",
  8: "images/wood/rainbow/04_Tropical_Tide_Wood.webp?v=1",
  9: "images/wood/rainbow/05_Fire_Ice_Wood.webp?v=1",
  10: "images/wood/rainbow/06_Neon_Prism_Wood.webp?v=1"
};
const woodImages = Object.create(null);

function loadImageSrc(src, onOk, onFail) {
  const img = new Image();
  const step = () => { if (window.GameLoader) window.GameLoader.imgDone(); };
  img.decoding = "async";
  img.onload = () => { step(); onOk(img); };
  /* провал файла — не повод висеть на 99%: шаг всё равно засчитан */
  img.onerror = () => { step(); onFail && onFail(); };
  img.src = src;
}

function loadBossImages(done) {
  const ids = Object.keys(BOSS_IMAGE_SRC);
  if (!ids.length) {
    done();
    return;
  }
  let left = ids.length;
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    loadImageSrc(BOSS_IMAGE_SRC[id], (img) => {
      img.__fitId = "boss:" + id;
      bossImages[id] = img;
      if (--left === 0) done();
    }, () => {
      if (--left === 0) done();
    });
  }
}

function loadWoodImages(done) {
  const keys = Object.keys(WOOD_IMAGE_SRC);
  if (!keys.length) {
    done();
    return;
  }
  let left = keys.length;
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    loadImageSrc(WOOD_IMAGE_SRC[key], (img) => {
      woodImages[key] = img;
      if (--left === 0) done();
    }, () => {
      if (--left === 0) done();
    });
  }
}

function loadBgImage(done) {
  loadImageSrc(BG_IMAGE_SRC, (img) => {
    bgPhoto = img;
    done();
  }, () => {
    bgPhoto = null;
    done();
  });
}

/* Все картинки стартуют ОДНОВРЕМЕННО: клинки, боссы, брёвна и фон не зависят
   друг от друга, а последовательные волны добавляли к загрузке лишние
   «круги» сети — каждая волна ждала, пока доедет предыдущая. Подписи этапов
   остались: они просто переключаются, когда группа доехала. */
function loadGameImages(done) {
  /* сколько всего файлов — от этого считается шкала загрузки (js/loader.js) */
  const L = window.GameLoader;
  let n = 1;
  for (let i = 0; i < KNIFE_SKINS.length; i++) if (KNIFE_SKINS[i].src) n++;
  n += Object.keys(BOSS_IMAGE_SRC).length + Object.keys(WOOD_IMAGE_SRC).length;
  if (L) L.expect(n);
  if (L) L.stage("ТОЧИМ НОЖИ");
  let left = 4;
  const step = () => { if (--left === 0) done(); };
  loadKnifeImages(() => {
    if (L) L.stage("ГРУЗИМ БОССОВ");
    step();
  });
  loadBossImages(() => {
    if (L) L.stage("ПИЛИМ БРЁВНА");
    step();
  });
  loadWoodImages(() => {
    if (L) L.stage("РИСУЕМ НЕБО");
    step();
  });
  loadBgImage(step);
}

/* Сердце для плашки жизней. Запас показывает сердце, а не ножик: новичок
   читает «три сердца» без объяснений (js/hud.js: renderLives). Форму берём
   общую (js/shapes.js: pathHeart), краску — «кровь с бликом». */
function makeLifeHeart(kind) {
  const size = 128;
  const gold = kind === "gold";
  const [c, g] = makeCanvas(size, size);
  g.translate(size * 0.5, size * 0.5);
  g.lineJoin = "round";
  pathHeart(g, size * 0.5 - 6);
  const paint = g.createLinearGradient(0, -size * 0.5, 0, size * 0.5);
  if (gold) {
    paint.addColorStop(0, "#fff3b8");
    paint.addColorStop(0.42, "#f2c34a");
    paint.addColorStop(1, "#a86a12");
  } else {
    paint.addColorStop(0, "#ff7585");
    paint.addColorStop(0.42, "#e8233f");
    paint.addColorStop(1, "#960c22");
  }
  g.fillStyle = paint;
  g.fill();
  g.lineWidth = 7;
  g.strokeStyle = gold ? "rgba(92, 58, 8, 0.9)" : "rgba(70, 8, 18, 0.9)";
  g.stroke();
  g.fillStyle = gold ? "rgba(255, 255, 255, 0.62)" : "rgba(255, 255, 255, 0.5)";
  g.beginPath();
  g.ellipse(-19, -21, 11, 7, -0.5, 0, TWO_PI);
  g.fill();
  return c;
}

function buildAssets() {
  assets.knives = {};
  if (typeof knifeRefTip !== "undefined") {
    knifeRefTip = 0;
    knifeRefSpan = 0;
  }
  for (const skin of KNIFE_SKINS) assets.knives[skin.id] = makeKnife(skin);
  assets.knife = assets.knives.classic;
  assets.lifeKnife = makeKnife({
    blade: "#f4f1ea",
    edge: "#8e8880",
    hi: "rgba(255,255,255,0.55)",
    guard: "#c4a06a",
    handle: "#6b4a32",
    stripe: "#8a6344",
    pommel: "#c4a06a"
  });
  assets.lifeKnifeUrl = assets.lifeKnife.toDataURL("image/png");
  /* сердце для плашки жизней — то, что видит игрок (js/hud.js: renderLives) */
  assets.lifeHeart = makeLifeHeart();
  assets.lifeHeartUrl = assets.lifeHeart.toDataURL("image/png");
  /* золотое сердце (бонусные жизни): раньше его красили CSS-фильтрами
     sepia/hue-rotate, а фильтр на каждом обновлении HUD — дорого; теперь это
     отдельная маленькая картинка. */
  assets.lifeHeartGold = makeLifeHeart("gold");
  assets.lifeHeartGoldUrl = assets.lifeHeartGold.toDataURL("image/png");
  assets.apple = makeApple();
  /* золотое и алмазное: та же геометрия, другая палитра (js/wood.js) */
  assets.appleGold = makeApple("gold");
  assets.appleDiamond = makeApple("diamond");
  /* половины разрезанного яблока: в игре они появляются вместо исчезнувшего
     яблока (js/flow.js: takeLogApple) */
  assets.appleHalfL = makeAppleHalf(-1);
  assets.appleHalfR = makeAppleHalf(1);
  assets.appleGoldHalfL = makeAppleHalf(-1, "gold");
  assets.appleGoldHalfR = makeAppleHalf(1, "gold");
  assets.appleDiamondHalfL = makeAppleHalf(-1, "diamond");
  assets.appleDiamondHalfR = makeAppleHalf(1, "diamond");
  /* яблоко в разрезе — иконка валюты в интерфейсе */
  assets.appleSlice = makeAppleSlice();
  assets.bg = makeBg(960, 1600);
  assets.woods = THEMES.map((th, i) => makeWood(th, 17 + i * 91, i));
  assets.bosses = {
    tomato: makeTomatoTex(),
    heart: makeHeartTex(),
    marmalade: makeMarmaladeTex(),
    pumpkin: makePumpkinTex(),
    saw: makeSawTex(),
    valve: makeValveTex(),
    pizza: makePizzaTex(),
    aegis: makeAegisTex(),
    donut: makeDonutTex(),
    cheese: makeCheeseTex(),
    helm: makeHelmTex(),
    target: makeTargetTex(),
    coconut: makeCoconutTex(),
    egg: makeEggTex(),
    dummy: makeDummyTex(),
    fan: makeFanTex(),
    candy: makeCandyTex(),
    lifebelt: makeLifebeltTex(),
    pepsi: makePepsiTex(),
    reverse: makeReverseTex(),
    tire: makeTireTex(),
    coin: makeCoinBossTex(),
    balloon: makeBalloonTexes(),
    pie: makePieTex(),
    cog: makeCogTex(),
    tennis: makeTennisTex(),
    basketball: makeBasketballTex(),
    plate: makePlateTex(),
    tape: makeTapeTex(),
    yarn: makeYarnTex(),
    compass: makeCompassTex(),
    camera: makeCameraTex(),
    disco: makeDiscoTex()
  };
  assets.fanBlades = makeFanBladeTex();
  assets.fanGrille = makeFanGrilleTex();
  for (let i = 0; i < BOSSES.length; i++) bossHpColors(BOSSES[i], BOSSES[i].glow);
  prewarmPools();
  paintAppleIcons();
  releaseKnifeSources();
  releaseBossSprites();
}

/* Спрайты фото-боссов (до 1024×1024 каждый) нужны только на время сборки
   текстур: дальше рисуются готовые 512×512 текстуры. Держать ещё полсотни
   мегабайт в памяти телефона незачем — отдаём их сборщику мусора; если спрайт
   когда-нибудь понадобится снова, он соберётся из исходной картинки. */
function releaseBossSprites() {
  for (const id in bossImages) {
    const img = bossImages[id];
    if (!img || !img.__bossSpr) continue;
    const c = img.__bossSpr.c;
    if (c) {
      c.width = 2;
      c.height = 2;
    }
    img.__bossSpr = null;
  }
}

/* Исходники клинков (143 файла 512×512) нужны только один раз — собрать спрайты
   180×500 в makeKnife. Держать их дальше в памяти телефона незачем: это больше
   сотни мегабайт декодированных картинок. После сборки отдаём их браузеру —
   игра рисует готовые спрайты (assets.knives), они остаются. */
function releaseKnifeSources() {
  for (const id in knifeImages) {
    const img = knifeImages[id];
    if (img) {
      try {
        img.onload = null;
        img.onerror = null;
        img.removeAttribute("src");
      } catch (err) {}
    }
    delete knifeImages[id];
  }
}

/* Полоска HP красится по свечению босса. У шарика свечение меняется вместе с
   цветом латекса (applyBalloonSkin), поэтому считаем это одной функцией. */
function bossHpColors(b, glow) {
  const g = (glow || "196, 92, 62").split(",").map(s => +s.trim());
  b.hpC0 = "rgb(" + Math.min(255, g[0] + 48) + ", " + Math.min(255, g[1] + 36) + ", " + Math.min(255, g[2] + 24) + ")";
  b.hpC1 = "rgb(" + g[0] + ", " + g[1] + ", " + g[2] + ")";
  b.hpC2 = "rgb(" + ((g[0] * 0.52) | 0) + ", " + ((g[1] * 0.52) | 0) + ", " + ((g[2] * 0.52) | 0) + ")";
}

/* Текстура босса на холсте. У шарика их три подряд (красный, синий, зелёный),
   поэтому assets.bosses.balloon — массив, и номер берётся у числа лопнувших. */
/* ---------- спрайты яблок по виду ----------
   Обычное / золотое / алмазное. В игре везде спрашиваем через эти функции,
   чтобы вид яблока не разъезжался по файлам. */
function appleImg(kind) {
  if (kind === "gold" && assets.appleGold) return assets.appleGold;
  if (kind === "diamond" && assets.appleDiamond) return assets.appleDiamond;
  return assets.apple;
}

function appleHalfImg(kind, side) {
  const left = side < 0;
  if (kind === "gold" && assets.appleGoldHalfL) return left ? assets.appleGoldHalfL : assets.appleGoldHalfR;
  if (kind === "diamond" && assets.appleDiamondHalfL) return left ? assets.appleDiamondHalfL : assets.appleDiamondHalfR;
  return left ? assets.appleHalfL : assets.appleHalfR;
}

/* Яблоко-валюта в интерфейсе: РАЗРЕЗАННОЕ яблоко, срез смотрит на игрока.
   Картинку берём из отдельного спрайта (js/wood.js: makeAppleSlice) — половина
   «в профиль» для иконки не годилась. Название валюты при этом не меняется. */
function appleIconUrl() {
  const img = assets && assets.appleSlice;
  return img && img.toDataURL ? img.toDataURL("image/png") : "";
}

function appleIconHtml() {
  const src = appleIconUrl();
  return src ? '<img class="apple-ico" src="' + src + '" alt="">' : "🍎";
}

function paintAppleIcons() {
  const ico = document.getElementById("globalAppleIco");
  if (ico) ico.innerHTML = appleIconHtml();
}

function bossTex(id) {
  const t = assets.bosses && assets.bosses[id];
  if (!t) return null;
  if (t.length) return t[clamp(game.log.balloonN | 0, 0, t.length - 1)];
  return t;
}

/* dummy hat: image stays, bounce hitbox disabled */
function __killDummyHatHitbox() { try { window.dummyCapHit = function () { return false; }; } catch (e) {} }
__killDummyHatHitbox();
if (window.addEventListener) window.addEventListener('load', __killDummyHatHitbox);
