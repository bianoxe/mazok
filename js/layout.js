/* ---------- layout / ui ---------- */
function knifeSize() {
  return [knifeW, knifeH];
}

/* Отступ от низа кадра до ножа в руке. На ПК нож висит чуть ниже (заказчик:
   «на пк нож висел чуть ниже»), на телефоне оставляем прежний. Бревно от этого
   не двигается: его радиус считается по эталонному ножу (PC_KNIFE_LOG_REF). */
const READY_GAP_PHONE = 168;
const READY_GAP_PC = 110;

function readyY() {
  const [, kh] = knifeSize();
  /* Кромка считается по видимой части кадра (на телефоне полотно обрезано по
     бокам), чтобы отступ был ровно от того, что видит игрок */
  const bottom = visH > 0 ? cropY + visH : H;
  const gap = (typeof phone !== "undefined" && phone) ? READY_GAP_PHONE : READY_GAP_PC;
  return bottom - kh - gap;
}

function handY() {
  /* Нож игрока висит снизу, остриём вверх. База — readyY(), прячется рука ниже
     неё, у нижней кромки кадра */
  const [, kh] = knifeSize();
  const base = readyY();
  const hidden = base + Math.min(kh * 0.58, 124);
  const t = easeOutCubic(clamp(game.handT, 0, 1));
  let y = hidden + (base - hidden) * t;
  if ((state === "play" || state === "menu") && game.intro <= 0) {
    y += Math.sin(game.time * 0.0032) * 2.1 * t * t;
  }
  return y;
}

/* Радиус бревна: доля от короткой стороны полотна, не крупнее 153. Бревно
   ставится на 158 ниже верхней кромки КАДРА (cropY), а не полотна — если кадр
   обрезан сверху, оно не уедет под обрез вместе с полосой запаса. Под бревном
   должен остаться нож в руке: если не влезает — бревно ужимается */
/* Общий ужим бревна — и обычного, и любого босса (заказчик: «все брёвна чуть
   поменьше»). Размер бревна задан ТОЛЬКО здесь, в log.r, а от него считаются
   кромка удара (js/hit.js: surfaceRadius/hitSurfR), посадка ножа (bladeEmbed) и
   запас слотов под ножи, — поэтому рисунок и хитбокс уменьшаются вместе. */
const LOG_SCALE = 0.955;
/* Бревно с яблоками не имеет права упираться в бока кадра: яблоки висят за
   кромкой, самое дальнее — ~1.30 r (js/progress.js:
   APPLE_R_OUT + APPLE_BODY · APPLE_SPR_OUT). Потолок радиуса по видимой ширине
   кадра (на телефоне полотно обрезано по бокам — считаем по visW). */
const LOG_ART_R = 1.3;
const LOG_SIDE_MARGIN = 12;

function logFitR(w) {
  const frameW = visW > 0 ? visW : (w || 0);
  const frameH = visH > 0 ? visH : 0;
  const baseY = cropY > 0 ? cropY : 0;
  /* по бокам: бревно + яблоки за кромкой */
  const byW = (frameW * 0.5 - LOG_SIDE_MARGIN) / LOG_ART_R;
  /* и по низу: бревно ставится на cropY + 158, а низ кадра — cropY + visH.
     На низком окне (браузер в пол-экрана, ландшафт телефона) старое «не меньше
     78» всё равно выпихивало бревно за кромку — теперь радиус режется по месту */
  const top = baseY + 158;
  const bottom = baseY + frameH - LOG_SIDE_MARGIN;
  const byH = frameH > 0 ? (bottom - top) / 2 : 0;
  const r = byH > 0 ? Math.min(byW, byH) : byW;
  return Math.max(48, r);
}

function bossRadius(w, h, knifeY) {
  const top = cropY + 158;
  let r = clamp(Math.min(w, h) * 0.164, 95, 153);
  if (knifeY - (top + r + r) < 150) r = clamp((knifeY - 150 - top) / 2, 78, 153);
  return Math.min(r * LOG_SCALE, logFitR(w));
}

/* ПК-версия: нож и бревно чуть крупнее, чем на телефоне (js/mobile.js:
   mxLayout со своими KNIFE_SIZE_*). Телефонные значения не трогаем.
   Ужато на ~6 % вместе с телефонными (js/state.js: KNIFE_SIZE_*): нож меньше —
   и его хитбокс меньше (js/hit.js: hitLim считается от ширины ножа). */
const PC_KNIFE_SIZE_K = 0.294;
const PC_KNIFE_SIZE_MIN = 232;
const PC_KNIFE_SIZE_MAX = 312;
/* Радиус бревна считается по ЭТАЛОННОМУ размеру ножа (каким он был до
   увеличения): нож стал крупнее, а бревно из-за этого ужиматься не должно. */
const PC_KNIFE_LOG_REF = 256;
const PC_LOG_SCALE = 1.1;   /* бревно на 10% крупнее телефонного */

function layout() {
  /* Нож на экране. Хитбокс ножа (hit.js) считается от этого же размера, поэтому
     клинок видно так же, как он бьёт. Размер один на все ножи: клинки разные,
     удар общий. */
  knifeH = Math.round(clamp(Math.min(W, H) * PC_KNIFE_SIZE_K, PC_KNIFE_SIZE_MIN, PC_KNIFE_SIZE_MAX) * KNIFE_VIEW_SCALE);
  knifeW = Math.round(knifeH * (KNIFE_SRC_W / KNIFE_SRC_H));
  const log = game.log;
  const prevR = log.r;
  log.x = W * 0.5;
  /* Бревно сверху: чуть крупнее телефонного, но между ним и ножом в руке
     обязан остаться зазор — иначе ужимаем под доступное место */
  const knifeY = readyY();
  /* бревно — по эталонному ножу: крупный нож его больше не ужимает */
  const logY = (visH > 0 ? cropY + visH : H) - PC_KNIFE_LOG_REF - 168;
  const top = cropY + 158;
  let r = bossRadius(W, H, logY) * PC_LOG_SCALE;
  if (logY - (top + r + r) < 150) {
    r = Math.max(78, Math.min(r, (logY - 150 - top) / 2));
  }
  /* по бокам кадра бревно (вместе с яблоками за кромкой) обязано влезть */
  r = Math.min(r, logFitR(W));
  log.r = r;
  log.y = top + log.r;
  game.knife.x = W * 0.5;
  game.knife.y = knifeY;
  if (prevR !== log.r) {
    invalidateLogBakes();
  }
}

function viewSize() {
  const vv = window.visualViewport;
  if (vv && vv.width && vv.height) return [Math.round(vv.width), Math.round(vv.height)];
  return [innerWidth, innerHeight];
}

const PC_W = 1920;
const PC_H = 1080;

let resizeQueued = false;
function requestResize() {
  if (resizeQueued) return;
  resizeQueued = true;
  requestAnimationFrame(() => {
    resizeQueued = false;
    resize();
  });
}

function screenDpr(vw, vh, phoneMode) {
  const raw = window.devicePixelRatio || 1;
  if (!phoneMode) return Math.min(2, Math.max(1, raw));
  const longCss = Math.max(vw, vh, 1);
  let d = raw;
  const room = 2048 / longCss;
  if (d > room) d = room;
  if (d < 1) d = 1;
  let q = Math.round(d * 4) / 4;
  if (q < 1) q = 1;
  if (q * longCss > 2048) q = Math.floor(d * 4) / 4;
  if (q < 1) q = 1;
  return q;
}

function resize() {
  const [vw, vh] = viewSize();
  viewW = vw;
  viewH = vh;
  phone = vw < 900 && vw / Math.max(1, vh) < 0.72;

  /* Одно полотно на все экраны: сцена PC_W×PC_H (1920×1080), масштаб задаёт высота
     окна. Поэтому при ресайзе раскладка не пересобирается — бревно, нож и HUD просто
     уменьшаются или растут вместе с окном, как обычная страница. Если окно шире
     полотна (21:9), полотно растягивается по ширине: кадр по высоте не обрезается
     никогда, и вертикальные отступы (158 сверху, 168 снизу) остаются прежними.
     Раньше на десктопе полотном было само окно (W = vw, scale = 1), поэтому на
     каждом пикселе ресайза бревно и нож переезжали по формулам от краёв. */
  W = PC_W;
  H = PC_H;
  /* свернули окно — высота 0: масштаб не считаем, оставляем как есть */
  const scale = vh > 0 ? vh / H : 1;
  if (vw / scale > W) W = vw / scale;

  const visWorldW = vw / scale;
  const visWorldH = vh / scale;
  cropX = Math.max(0, (W - visWorldW) / 2);
  cropY = Math.max(0, (H - visWorldH) / 2);
  visW = Math.max(1, W - cropX * 2);
  visH = Math.max(1, H - cropY * 2);
  stageScale = scale;
  dpr = screenDpr(vw, vh, phone);
  const nextPx = stageScale * dpr;
  const pxChanged = Math.abs(nextPx - pixelScale) > 0.02;
  pixelScale = nextPx;

  const bw = Math.max(1, Math.round(visW * pixelScale));
  const bh = Math.max(1, Math.round(visH * pixelScale));
  viewSx = visW > 0 ? bw / visW : pixelScale;
  viewSy = visH > 0 ? bh / visH : pixelScale;
  const sizeChanged = canvas.width !== bw || canvas.height !== bh;
  if (sizeChanged) {
    canvas.width = bw;
    canvas.height = bh;
  }
  canvas.style.position = "absolute";
  canvas.style.left = cropX + "px";
  canvas.style.top = cropY + "px";
  canvas.style.width = visW + "px";
  canvas.style.height = visH + "px";
  if (stage) {
    stage.style.width = W + "px";
    stage.style.height = H + "px";
    stage.style.transformOrigin = "50% 50%";
    stage.style.transform = "translate(-50%, -50%) scale(" + scale + ")";
  }
  document.documentElement.style.setProperty("--crop-x", cropX + "px");
  document.documentElement.style.setProperty("--crop-y", cropY + "px");
  document.documentElement.style.setProperty("--px-to-stage", String(1 / scale));
  beginDraw();
  if (pxChanged) invalidateLogBakes();
  hpBarKey = "";
  layout();
  /* resize чистит полотно, а следующий кадр придёт только со следующим rAF: если
     между ними экран показать успевают (а на телефоне visualViewport шлёт resize и
     scroll на каждом движении адресной строки, см. js/input.js), сцена «БОСС» и
     «ПОВЕРЖЕН» мигала пустотой прямо посреди анимации. Перерисовываем сразу. */
  if (typeof draw === "function" && typeof game !== "undefined" && game && game.log) draw();
}

function snap(v) {
  const s = viewSx > 0 ? viewSx : 1;
  return Math.round(v * s) / s;
}

function snapLen(v) {
  const s = viewSx > 0 ? viewSx : 1;
  if (!(v > 0)) return v;
  const n = Math.round(v * s);
  return (n > 0 ? n : 1) / s;
}

function beginDraw() {
  const sx = viewSx > 0 ? viewSx : 1;
  const sy = viewSy > 0 ? viewSy : 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(sx, 0, 0, sy, -cropX * sx, -cropY * sy);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "low";
}

function fillDeviceRect(x, y, w, h) {
  const s = viewSx > 0 ? viewSx : 1;
  const x0 = Math.round(x * s);
  const y0 = Math.round(y * s);
  let x1 = Math.round((x + w) * s);
  let y1 = Math.round((y + h) * s);
  if (x1 === x0) x1 = x0 + (w < 0 ? -1 : 1);
  if (y1 === y0) y1 = y0 + (h < 0 ? -1 : 1);
  ctx.fillRect(x0 / s, y0 / s, (x1 - x0) / s, (y1 - y0) / s);
}

/* Что уже записано в localStorage: persist() зовётся часто (уровень, покупка,
   яблоко), а каждая запись — синхронная работа с диском. Пишем только
   изменившиеся ключи: после первого раза это 1–2 ключа вместо двадцати. */
const persistCache = Object.create(null);
function persistPut(key, value) {
  if (persistCache[key] === value) return;
  persistCache[key] = value;
  try { localStorage.setItem(key, value); } catch (err) {}
  if (typeof yxDirtyMark === "function") yxDirtyMark();
}

function persist() {
  /* демка: настоящий движок играет на профиле админа, но сохранять его
     прогресс/кошелёк/рекорд во время просмотра нельзя */
  if (typeof window !== "undefined" && window.__BH_REPLAY_ACTIVE) return;
  persistPut("bh_apples", String(game.apples | 0));
  /* новая валюта бета-теста: рубли, потраченное и ник игрока */
  persistPut("bh_rubles", String(Math.max(0, save.rubles | 0)));
  persistPut("bh_apple_spent", String(Math.max(0, save.appleSpent | 0)));
  persistPut("bh_rub_spent", String(Math.max(0, save.rubSpent | 0)));
  persistPut("bh_nick", save.nick || "");
  persistPut("bh_free_apple_at", String(Math.max(0, Math.floor(+save.freeAppleAt || 0))));
  /* счётчик открытий случайного ножа: от него растёт цена (js/knife-book.js) */
  persistPut("bh_rand_buys", String(Math.max(0, save.randBuys | 0)));
  persistPut("bh_best", String(save.best | 0));
  /* отметка «рекорд считается в ножах»: по ней state.js отличает новый сейв от
     старого, где в bh_best лежали уровни (js/state.js: save.best) */
  persistPut("bh_best_knives", "1");
  /* дорожка наград: номер следующей ячейки и время её открытия (js/rewards.js) */
  persistPut("bh_rt_idx", String(Math.max(0, save.rtIdx | 0)));
  persistPut("bh_rt_next", String(Math.max(0, Math.floor(+save.rtNextAt || 0))));
  persistPut("bh_best_level", String(Math.max(0, save.bestLevel | 0)));
  persistPut("bh_owned", JSON.stringify(save.owned));
  persistPut("bh_knife", save.knife || "classic");
  persistPut("bh_items", JSON.stringify(save.items || {}));
  persistPut("bh_loadout", JSON.stringify(save.loadout || {}));
  persistPut("bh_seq_on", save.seqOn ? "1" : "0");
  persistPut("bh_seq", JSON.stringify(save.seq || []));
  /* рандомизатор ножей из альманаха (js/knife-book.js): сам флаг, галочка
     «своя очередь» и отмеченный игроком список ножей */
  persistPut("bh_rnd", save.rnd ? "1" : "0");
  persistPut("bh_rnd_own", save.rndOwn ? "1" : "0");
  persistPut("bh_rnd_pool", JSON.stringify(save.rndPool || []));
  persistPut("bh_inf", save.inf ? "1" : "0");
  /* галочка «бесконечные жизни» из дока меню (js/input.js: infLivesBtn) */
  persistPut("bh_inf_lives", save.infLives ? "1" : "0");
  /* статистика игрока (js/stats.js): пишется тем же моментом, что и прогресс —
     перед закрытием страницы и при сворачивании ничего не теряется. В бою
     откладываем: синхронный localStorage в случайном кадре — это фриз. */
  if (typeof persistStats === "function") {
    const leaving = typeof document !== "undefined" &&
      (document.visibilityState === "hidden" || document.hidden);
    if (leaving || typeof state === "undefined" || state !== "play") persistStats();
    else if (typeof persistStatsSoon === "function") persistStatsSoon();
  }
}

function persistSoon() {
  if (typeof window !== "undefined" && window.__BH_REPLAY_ACTIVE) return;
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = 0;
    persist();
  }, phone ? 420 : 160);
}

