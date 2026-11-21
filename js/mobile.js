/* ---------- ТЕЛЕФОНЫ: НОВЫЙ РЕНДЕР ----------
   1) Разрешение полотна. Старый screenDpr (js/layout.js) резал DPR по 2048 px
      и округлял его до 1/4: на iPhone (DPR 3) канва рисовалась в 2.25x, а
      показывалась в 3x, на Android (DPR 2.75) — в 2.0x. Отсюда «мыло» на всём
      экране. Теперь полотно всегда в реальных пикселях устройства, а если
      телефон не тянет — DPR опускает адаптивный контроллер, а не жёсткий кап.
   2) Адаптивное разрешение: держим 60 fps, при устойчивой просадке шагами
      снижаем DPR (до 0.62) и возвращаем обратно, когда кадры снова лёгкие.
   3) Фон печётся один раз в пиксель экрана (js/frame.js: drawBackdropLayer),
      а не растягивается из 960x1600 в каждый кадр. Резче и дешевле.
   4) Пропорции ножа и бревна как на ПК, с жёстким потолком «нож не больше
      бревна» (js/layout.js считал их независимо, и на телефоне клинок выходил
      ростом с бревно).
   5) Блик по боссу печётся в спрайт, а не собирается clip+градиентом каждый
      кадр (на телефоне это самый дорогой фрагмент кадра после бревна). */
(function () {
  const BASE_RESIZE = window.resize;
  const BASE_LAYOUT = window.layout;
  const BASE_BAKE = window.bakeScale;
  const BASE_GLINT = window.drawShineGlint;
  const BASE_BEGIN = window.beginDraw;
  const BASE_TICK = window.tickFps;

  /* ---- класс устройства ----
     Слабые/старые телефоны (2 ГБ и меньше, 4 ядра и меньше) не должны рисовать
     столько же пикселей, сколько свежий флагман: им режем потолок арта и пол
     разрешения. Логика та же, что в pickStartRs ниже. */
  const LOW_END = (function () {
    const mem = navigator.deviceMemory || 0;
    const cores = navigator.hardwareConcurrency || 0;
    const weak = (mem > 0 && mem <= 3) || (cores > 0 && cores <= 4);
    /* Только телефон: на ПК кадр тянет любой ноутбук, и резать арт там незачем. */
    return weak && wantPhone(window.innerWidth || 0, window.innerHeight || 0);
  })();
  /* Другим модулям (редкие эффекты вроде свечения и лучей сцены босса) нужно
     знать, что телефон слабый: там можно сэкономить без потери читаемости. */
  try { window.GAME_LOW_END = LOW_END; } catch (err) {}

  const PIXEL_BUDGET = LOW_END ? 1.5e6 : 2.4e6;   /* потолок полотна: с запасом на 6.7" (3.6 Мп) */
  const MAX_DPR = 3;
  /* Сколько device-пикселей на мировой пиксель МАКСИМУМ нужно игре. Диск бревна
     и боссы — это текстуры 512 на 292 мировых пикселя (≈1.75), нож — 180×500 на
     104×288. Выше ~1.7 игра рисует больше пикселей, чем есть в картинках: кадр
     дорожает, а деталей не прибавляется. Раньше стояло 1.8 — на телефоне это
     лишние ~12% заливки в каждом кадре без единой новой детали. На старых
     телефонах 1.45: минус ~28% пикселей кадра, разницу в резкости там не видно. */
  const ART_SCALE = LOW_END ? 1.45 : 1.7;
  /* Ниже этого разрешение не опускаем. На экранах с высоким DPR пол «мягче»
     только по числу: ~1.6 device px на CSS px — картинка не мылится, а кадр
     дешевеет почти вдвое. Слабому телефону можно ещё ниже. */
  const MIN_RS = LOW_END ? 0.45 : 0.55;
  const KNIFE_OF_LOG = 1.0;     /* как на ПК: 325 / 328 */
  const KNIFE_OF_LOG_PHONE = 1.0;
  /* Бревно считается по эталонному размеру ножа (до увеличения): крупный нож
     больше не ужимает бревно. Телефон 242, ПК 256 — прежние размеры ножа. */
  const KNIFE_LOG_REF = 256;
  const KNIFE_LOG_REF_PHONE = 242;
  const BACK_MARGIN = 20;       /* запас фона под тряску кадра, в мировых px */

  let rs = 1;                   /* адаптивный множитель разрешения */
  /* ПК: тоже адаптивное разрешение — на 4K/HiDPI и на старых видеокартах
     полный кадр 2×DPR стоит дорого. pcRs опускается при устойчивых просадках
     и возвращается наверх, как на телефоне. */
  let pcRs = (function () {
    const mem = navigator.deviceMemory || 0;
    const cores = navigator.hardwareConcurrency || 0;
    return ((mem > 0 && mem <= 4) || (cores > 0 && cores <= 4)) ? 0.9 : 1;
  })();
  let pcEma = 16.7, pcSlowN = 0, pcFastN = 0, pcDownAt = 0, pcResTimer = 0;
  const PC_MAX_PIXELS = (function () {
    const mem = navigator.deviceMemory || 0;
    const cores = navigator.hardwareConcurrency || 0;
    return ((mem > 0 && mem <= 4) || (cores > 0 && cores <= 4)) ? 1.8e6 : 3.2e6;
  })();
  let emaMs = 16.7, slowN = 0, fastN = 0, coolUntil = 0;
  let lastDownAt = (typeof performance !== "undefined" ? performance.now() : 0);
  let lastKey = "";
  let back = null, backKey = "", backGen = 0, backBakedGen = -1;
  let backGeom = "";
  let backBakedSy = 0;
  let glintSpr = null, glintKey = "";

  function touchDevice() {
    return (navigator.maxTouchPoints || 0) > 0 || "ontouchstart" in window;
  }

  /* ---- классы телефонного интерфейса ----
     Вся аккуратная раскладка для телефона в css/style.css включается ТОЛЬКО
     через html.is-phone (-p = портрет), поэтому ПК-версия не меняется.
     В ландшафте сцена масштабируется по высоте иначе — там остаются прежние
     правила, чтобы ничего не поехало. */
  function setPhoneUi(vw, vh) {
    const cl = document.documentElement && document.documentElement.classList;
    if (!cl) return;
    cl.add("is-phone");
    /* -p только для настоящего телефона в портрете: на планшете (шире 600)
       остаются прежние размеры, иначе две огромные карточки ножей на весь экран */
    if (vw < 600 && vw < vh) cl.add("is-phone-p");
    else cl.remove("is-phone-p");
    /* Кнопки «чистый HUD» на телефоне больше нет — если режим остался с ПК,
       возвращаем верхние счётчики, иначе игрок не увидит уровень и рекорд. */
    const hudEl = document.getElementById("hud");
    if (hudEl && hudEl.classList.contains("clean")) hudEl.classList.remove("clean");
  }

  function clearPhoneUi() {
    const cl = document.documentElement && document.documentElement.classList;
    if (!cl) return;
    cl.remove("is-phone", "is-phone-p");
    if (document.body) document.body.classList.remove("boss-cine");
  }

  /* Босс на телефоне — это кино: на время вступления и победы убираем HUD,
     кнопки и тосты, чтобы в кадре остались только лента «БОСС» / «ПОВЕРЖЕН»
     и награда. Возвращаем интерфейс, как только сцена закончилась. */
  let cineOn = false;
  window.syncPhoneScene = function () {
    if (!phone) {
      if (cineOn) {
        cineOn = false;
        if (document.body) document.body.classList.remove("boss-cine");
      }
      return;
    }
    const on = !!(typeof game !== "undefined" && game && (game.sting > 0 || game.victory > 0));
    if (on === cineOn) return;
    cineOn = on;
    document.body.classList.toggle("boss-cine", on);
    if (typeof premiumSync === "function") premiumSync();
  };

  /* Телефон — это не только портрет: боком у телефона та же слабая наливка
     кадра, поэтому лёгкий режим включаем и там (phone гейтит эффекты) */
  function wantPhone(vw, vh) {
    if (!(vw > 0) || !(vh > 0)) return false;
    if (vw < 900 && vw / vh < 0.72) return true;
    return touchDevice() && Math.min(vw, vh) <= 700 && vw < 1500;
  }

  function pickStartRs() {
    /* Стартуем в полном разрешении — картинка по умолчанию должна быть резкой.
       Но у заведомо слабых телефонов (мало памяти/ядер) старт сразу чуть ниже:
       ждать 6–8 секунд, пока адаптив сползёт шагами, незачем. */
    if (LOW_END) return 0.72;
    const mem = navigator.deviceMemory || 0;
    const cores = navigator.hardwareConcurrency || 0;
    if ((mem > 0 && mem <= 3) || (cores > 0 && cores <= 4)) return 0.82;
    return 1;
  }

  /* ---- полотно: ровно пиксель в пиксель, без обрезки DPR по 2048 ---- */
  function realDpr() {
    return Math.min(MAX_DPR, Math.max(1, window.devicePixelRatio || 1));
  }

  function canvasSize() {
    const base = realDpr();
    let d = base * rs;
    /* потолок по разрешению арта: выше него кадр только дороже (см. ART_SCALE) */
    const artCap = stageScale > 0 ? ART_SCALE / stageScale : d;
    if (d > artCap) d = artCap;
    let bw = Math.max(1, Math.round(viewW * d));
    let bh = Math.max(1, Math.round(viewH * d));
    if (bw * bh > PIXEL_BUDGET) {
      const k = Math.sqrt(PIXEL_BUDGET / (bw * bh));
      d *= k;
      bw = Math.max(1, Math.round(bw * k));
      bh = Math.max(1, Math.round(bh * k));
    }
    return [bw, bh, d];
  }

  /* Ставим полотно в его собственный слой. CSS-размер считается из битмапа и
     масштаба, которым он нарисован (bw / d), поэтому при rs = 1 CSS→устройство
     ровно 1:1. Дробный масштаб/сдвиг заставил бы компоновщик пересэмплировать
     кадр — именно из-за этого игра мылила. */
  function placeCanvas(bw, bh, d) {
    const rd = realDpr();
    /* d совпадает с настоящим DPR — размер CSS берём из битмапа, тогда
       CSS→устройство ровно 1:1 (ни одного лишнего пересэмплирования).
       Адаптив опустил разрешение — тянем битмап на весь экран, иначе справа и
       снизу осталась бы полоса без мира. */
    const exact = Math.abs(d - rd) < 1e-6;
    canvas.style.position = "fixed";
    canvas.style.left = "0px";
    canvas.style.top = "0px";
    canvas.style.transform = "none";
    canvas.style.width = (exact ? bw / rd : viewW) + "px";
    canvas.style.height = (exact ? bh / rd : viewH) + "px";
  }

  function applyCanvas() {
    const [bw, bh, d] = canvasSize();
    const prevPx = pixelScale;
    /* Фон перепекаем только при смене ГЕОМЕТРИИ кадра (поворот/ресайз), а не
       при каждом шаге адаптивного разрешения: полноэкранный бейк фона — это
       заметный рывок, и раньше он случался на каждом шаге вниз/вверх. */
    const geom = W + "|" + H + "|" + cropX + "|" + cropY + "|" + visW + "|" + visH;
    if (geom !== backGeom) {
      backGeom = geom;
      backGen++;
    }
    viewSx = visW > 0 ? bw / visW : d;
    viewSy = visH > 0 ? bh / visH : d;
    pixelScale = Math.max(viewSx, viewSy);
    dpr = d;
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
    placeCanvas(bw, bh, d);
    /* HUD остаётся в масштабируемой сцене — его геометрия не меняется */
    if (stage) {
      stage.style.width = W + "px";
      stage.style.height = H + "px";
      stage.style.transformOrigin = "50% 50%";
      stage.style.transform = "translate(-50%, -50%) scale(" + stageScale + ")";
    }
    /* запечённое бревно нарисовано под старое разрешение — перепекаем только
       при БОЛЬШОЙ разнице: адаптив шагает по 15%, и перепекание на каждом шаге
       само давало микрофризы (дёрганье качества по кругу) */
    if (prevPx > 0 && Math.abs(pixelScale - prevPx) > prevPx * 0.45) invalidateLogBakes();
  }

  function mxResize() {
    const vv = window.visualViewport;
    const vw = Math.round(vv && vv.width ? vv.width : innerWidth);
    const vh = Math.round(vv && vv.height ? vv.height : innerHeight);
    if (!wantPhone(vw, vh)) {
      phone = false;
      rs = 1;
      lastKey = "";
      backKey = "";
      clearPhoneUi();
      BASE_RESIZE();
      syncDesktopCanvas();
      return;
    }
    if (!vw || !vh) return;
    phone = true;
    setPhoneUi(vw, vh);
    /* visualViewport шлёт resize/scroll на каждом движении адресной строки:
       размер не изменился — ничего не пересобираем (раньше это был лишний
       layout + полная перерисовка + сброс бейков) */
    const key = vw + "x" + vh;
    if (key === lastKey && canvas.width > 1) return;
    lastKey = key;

    viewW = vw;
    viewH = vh;
    W = PC_W;
    H = PC_H;
    const scale = vh / H;
    if (vw / scale > W) W = vw / scale;
    stageScale = scale;
    const wvw = vw / scale;
    const wvh = vh / scale;
    cropX = Math.max(0, (W - wvw) * 0.5);
    cropY = Math.max(0, (H - wvh) * 0.5);
    visW = Math.max(1, W - cropX * 2);
    visH = Math.max(1, H - cropY * 2);
    applyCanvas();

    const root = document.documentElement.style;
    root.setProperty("--crop-x", cropX + "px");
    root.setProperty("--crop-y", cropY + "px");
    root.setProperty("--px-to-stage", String(1 / stageScale));
    hpBarKey = "";
    layout();
    beginDraw();
    if (typeof draw === "function" && typeof game !== "undefined" && game && game.log) draw();
  }

  /* ПК: раскладку и камеру оставляем прежними (js/layout.js), но полотно тоже
     уводим в свой слой и считаем его в пикселях экрана. Иначе дробный scale
     сцены (900/1080 = 0.833) мылил кадр и на мониторе. */
  function syncDesktopCanvas() {
    if (!(viewW > 0) || !(viewH > 0) || !(visW > 0) || !(visH > 0)) return;
    const baseDpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
    /* Потолок по пикселям + адаптивный множитель: 4K-монитор не обязан
       рисовать 8 Мп, если картинка всё равно из низкополигональных текстур. */
    const capD = Math.sqrt(PC_MAX_PIXELS / Math.max(1, viewW * viewH));
    const d = Math.max(0.5, Math.min(baseDpr, capD) * pcRs);
    let bw = Math.max(1, Math.round(viewW * d));
    let bh = Math.max(1, Math.round(viewH * d));
    if (bw * bh > PC_MAX_PIXELS) {
      const k = Math.sqrt(PC_MAX_PIXELS / (bw * bh));
      bw = Math.max(1, Math.round(bw * k));
      bh = Math.max(1, Math.round(bh * k));
    }
    const prevPx = pixelScale;
    viewSx = bw / visW;
    viewSy = bh / visH;
    pixelScale = Math.max(viewSx, viewSy);
    dpr = d;
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
    placeCanvas(bw, bh, d);
    if (prevPx > 0 && Math.abs(pixelScale - prevPx) > prevPx * 0.45) invalidateLogBakes();
    hpBarKey = "";
    beginDraw();
    draw();
  }

  let rsQueued = false;
  function setRs(v) {
    const next = Math.min(1, Math.max(MIN_RS, v));
    if (Math.abs(next - rs) < 0.01) return;
    rs = next;
    /* Не пересобираем полотно прямо посреди кадра (это лишняя перерисовка и
       переаллокация битмапа). Следующий beginDraw применит новый размер сам. */
    rsQueued = true;
  }

  /* ---- пропорции: нож не больше бревна ---- */
  function mxLayout() {
    if (!game || !game.log) return BASE_LAYOUT();
    const minSide = Math.min(W, H);
    const log = game.log;
    const bottom = visH > 0 ? cropY + visH : H;
    const top = cropY + 158;
    const cap = phone ? KNIFE_OF_LOG_PHONE : KNIFE_OF_LOG;
    /* ПК: нож и бревно чуть крупнее телефонных (layout.js: PC_*), телефон
       остаётся на прежних значениях */
    const sizeK = phone ? KNIFE_SIZE_K : PC_KNIFE_SIZE_K;
    const sizeMin = phone ? KNIFE_SIZE_MIN : PC_KNIFE_SIZE_MIN;
    const sizeMax = phone ? KNIFE_SIZE_MAX : PC_KNIFE_SIZE_MAX;
    const logScale = phone ? 1 : PC_LOG_SCALE;
    /* радиус бревна — по эталонному ножу, а сам нож растёт как задан */
    const refKh = phone ? KNIFE_LOG_REF_PHONE : KNIFE_LOG_REF;
    let kh = clamp(minSide * sizeK, sizeMin, sizeMax);
    let r = bossRadius(W, H, bottom - refKh - 168) * logScale;
    /* два прохода: ужали клинок под бревно — пересчитали бревно под новый
       нож — ужали клинок ещё раз, если бревно всё же не влезло */
    kh = Math.min(kh, r * 2 * cap);
    r = bossRadius(W, H, bottom - refKh - 168) * logScale;
    kh = Math.min(kh, r * 2 * cap);
    /* зазор между бревном и ножом в руке не меньше 150 px */
    const knifeY = bottom - refKh - 168;
    if (knifeY - (top + r + r) < 150) {
      r = Math.max(78, Math.min(r, (knifeY - 150 - top) / 2));
    }
    /* по бокам кадра бревно (с яблоками за кромкой) обязано влезть */
    const fit = logFitR(W);
    if (r > fit) {
      r = fit;
      kh = Math.min(kh, r * 2 * cap);
    }
    knifeH = Math.round(kh * KNIFE_VIEW_SCALE);
    knifeW = Math.round(knifeH * (KNIFE_SRC_W / KNIFE_SRC_H));
    const prevR = log.r;
    log.x = W * 0.5;
    log.r = r;
    log.y = top + r;
    game.knife.x = W * 0.5;
    game.knife.y = readyY();
    if (prevR !== log.r) invalidateLogBakes();
  }

  /* ---- бейк бревна: на телефоне 1.35 давал мыло; 2.2 — уже пиксель в пиксель ---- */
  function mxBakeScale() {
    const s = pixelScale > 0 ? pixelScale : 1;
    if (phone) return Math.min(2.2, Math.max(0.75, s));
    return BASE_BAKE();
  }

  /* ---- фон: один blit в пиксель экрана ---- */
  /* Ключ фона — не строка на каждый кадр (5 × toFixed + склейка), а счётчик
     раскладки: он меняется только в applyCanvas (ресайз/смена разрешения). */
  function backKeyNow() {
    return backGen;
  }

  function bakeBack() {
    const M = BACK_MARGIN;
    const wx = cropX - M;
    const wy = cropY - M;
    const ww = visW + M * 2;
    const wh = visH + M * 2;
    const bw = Math.max(8, Math.round(ww * viewSx));
    const bh = Math.max(8, Math.round(wh * viewSy));
    const pair = makeCanvas(bw, bh);
    const g = pair[1];
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = "high";
    /* Рисуем в МИРОВЫХ координатах: канва кэша сама обрежет всё, что вышло за
       кадр. Иначе (если считать исходный прямоугольник вручную) отрицательные
       края фото по спецификации обрезаются вместе с переносом полотна — фон
       уезжал и слегка масштабировался. */
    g.setTransform(bw / ww, 0, 0, bh / wh, -wx * (bw / ww), -wy * (bh / wh));
    let ok = false;
    const photo = typeof bgPhoto !== "undefined" ? bgPhoto : null;
    if (photo) {
      const iw = photo.naturalWidth || photo.width || 0;
      const ih = photo.naturalHeight || photo.height || 0;
      if (iw > 0 && ih > 0) {
        /* та же раскладка, что в makeBg(960,1600) (js/wood.js): фото уложено
           «cover» в 960x1600 и растянуто на мир W×H. Считаем, где фото лежит в
           мире, и рисуем его один раз в пиксель экрана. */
        const s = Math.max(960 / iw, 1600 / ih);
        const kx = W / 960;
        const ky = H / 1600;
        const x0 = (960 - iw * s) * 0.5 * kx;
        const y0 = (1600 - ih * s) * 0.5 * ky;
        g.drawImage(photo, x0, y0, iw * s * kx, ih * s * ky);
        ok = true;
      }
    }
    if (!ok && assets.bg) {
      const bg = assets.bg;
      g.drawImage(bg, 0, 0, W, H);
      ok = true;
    }
    if (!ok) return false;
    if (back) releaseCanvas(back);
    back = pair[0];
    backKey = backKeyNow();
    backBakedSy = viewSy;
    return true;
  }

  function backReady() {
    return phone && !!back && backKey === backKeyNow();
  }

  /* Вызывается из draw() (js/frame.js) вместо растягивания фона:
     true — фон уже лёг, кадру остался только мир */
  window.drawBackdropLayer = function () {
    if (!phone || !(visW > 0) || !(viewSx > 0)) return false;
    if (!backReady() && !bakeBack()) return false;
    const M = BACK_MARGIN;
    /* Кэш фона обычно испечён ровно в пикселях экрана — это копия 1:1, и
       фильтрация только тратит заливку. После шага адаптивного разрешения
       масштаб меняется, и тогда включаем сглаживание, чтобы фото не рябило. */
    const sm = ctx.imageSmoothingEnabled;
    const exact = Math.abs(viewSy - backBakedSy) <= 0.01;
    if (exact) ctx.imageSmoothingEnabled = false;
    ctx.drawImage(back, cropX - M, cropY - M, visW + M * 2, visH + M * 2);
    ctx.imageSmoothingEnabled = sm;
    return true;
  };

  function mxBeginDraw() {
    if (rsQueued) {
      rsQueued = false;
      applyCanvas();
    }
    /* фон закрывает кадр целиком — полную очистку можно не делать */
    if (!backReady()) return BASE_BEGIN();
    const sx = viewSx > 0 ? viewSx : 1;
    const sy = viewSy > 0 ? viewSy : 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.setTransform(sx, 0, 0, sy, -cropX * sx, -cropY * sy);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "low";
  }

  /* ---- блик по боссу: печём один раз на радиус ---- */
  function mxShineGlint(r, alpha) {
    if (!phone || !(r > 0)) return BASE_GLINT(r, alpha);
    /* ключ — шаг 4 px: радиус живёт в анимациях, и попиксельный кэш пёк бы
       спрайт каждый кадр */
    const q = Math.max(8, Math.round(r / 4) * 4);
    const key = q + "";
    if (glintKey !== key || !glintSpr) {
      const size = Math.max(8, Math.ceil(q * 2));
      if (glintSpr) releaseCanvas(glintSpr);
      const pair = makeCanvas(size, size);
      const g = pair[1];
      g.translate(size * 0.5, size * 0.5);
      g.beginPath();
      g.arc(0, 0, q * 0.985, 0, TWO_PI);
      g.clip();
      const sweep = g.createLinearGradient(-q, -q, q * 0.55, q);
      sweep.addColorStop(0, "rgba(255,255,255,0)");
      sweep.addColorStop(0.32, "rgba(255,255,255,0.4)");
      sweep.addColorStop(0.44, "rgba(255,255,255,0.05)");
      sweep.addColorStop(0.66, "rgba(255,255,255,0.24)");
      sweep.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = sweep;
      g.fillRect(-q, -q, q * 2, q * 2);
      glintSpr = pair[0];
      glintKey = key;
    }
    const log = game.log;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(glintSpr, snap(log.x - r), snap(log.y - r), r * 2, r * 2);
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  /* ---- адаптивное разрешение: 60 fps важнее лишних пикселей ----
     Но реагируем ТОЛЬКО на устойчивую просадку: одиночные провалы (бейк,
     сцена босса, сборка мусора) не должны навсегда превращать картинку в
     мыло. Поэтому порог выше, счётчик длиннее, шаг мягче, а возврат назад —
     быстрый. */
  function minRsNow() {
    return realDpr() >= 2 ? (LOW_END ? 0.5 : 0.58) : MIN_RS;
  }

  function mxTickFps(rawDt, ts) {
    if (BASE_TICK) BASE_TICK(rawDt, ts);
    if (!(rawDt > 0) || rawDt > 0.3) return;
    const ms = rawDt * 1000;
    if (ms > 42) return;               /* фриз/бейк — не показатель */
    if (!phone) {
      /* ПК-адаптив: при устойчивой просадке опускаем внутреннее разрешение
         (и поднимаем обратно после стабильных кадров). Одиночные фризы бейков
         игнорируем. */
      pcEma += (ms - pcEma) * (ms > pcEma ? 0.08 : 0.04);
      if (pcEma > 19.0) {
        pcSlowN++;
        pcFastN = 0;
        if (pcSlowN >= 45 && pcRs > 0.55) {
          pcRs = Math.max(0.55, pcRs * (pcEma > 24 ? 0.82 : 0.9));
          pcSlowN = 0;
          pcDownAt = ts;
          if (!pcResTimer) pcResTimer = setTimeout(function () { pcResTimer = 0; syncDesktopCanvas(); }, 0);
        }
      } else if (pcEma < 16.4 && pcRs < 1) {
        pcFastN++;
        pcSlowN = 0;
        if (pcFastN >= 220 && ts - pcDownAt > 8000) {
          pcRs = Math.min(1, pcRs * 1.05);
          pcFastN = 0;
          if (!pcResTimer) pcResTimer = setTimeout(function () { pcResTimer = 0; syncDesktopCanvas(); }, 0);
        }
      } else {
        pcSlowN = 0;
        pcFastN = 0;
      }
      return;
    }
    emaMs += (ms - emaMs) * (ms > emaMs ? 0.08 : 0.04);
    if (ts < coolUntil) return;
    if (emaMs > 19.0) {
      slowN++;
      fastN = 0;
      /* Слайд вниз быстрее, чем раньше: 45 кадров (~0,75 с) вместо 90, а при
         совсем тяжёлом кадре — сразу крупный шаг. Просадка не должна длиться
         секундами, пока «докатится» адаптив. */
      const heavy = emaMs > 24;
      if (slowN >= (heavy ? 18 : 45) && rs > minRsNow()) {
        slowN = 0;
        coolUntil = ts + 700;
        lastDownAt = ts;
        setRs(Math.max(minRsNow(), rs * (heavy ? 0.78 : 0.88)));
      }
    } else if (emaMs < 16.4 && rs < 1) {
      fastN++;
      slowN = 0;
      /* Наверх — только если вниз не спускались последние 12 с: иначе
         разрешение «дышит» туда-сюда, а каждый шаг — это переаллокация
         полотна и заметный кадр. */
      if (fastN >= 220 && ts - lastDownAt > 8000) {
        fastN = 0;
        coolUntil = ts + 2500;
        setRs(Math.min(1, rs * 1.05));
      }
    } else {
      slowN = 0;
      fastN = 0;
    }
  }

  window.screenDpr = function (vw, vh, phoneMode) {
    if (!phoneMode) return Math.min(2, Math.max(1, window.devicePixelRatio || 1));
    return Math.min(MAX_DPR, Math.max(1, (window.devicePixelRatio || 1) * rs));
  };
  window.resize = mxResize;
  window.layout = mxLayout;
  window.bakeScale = mxBakeScale;
  window.drawShineGlint = mxShineGlint;
  window.beginDraw = mxBeginDraw;
  window.tickFps = mxTickFps;

  rs = pickStartRs();
})();

