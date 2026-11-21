/* Яндекс Игры — обвес SDK. Вне площадки (локально) модуль молчит:
   вызовы становятся безопасными заглушками. Дев-инструменты в доке (редактор
   боссов и рандомизатор) видны всегда; только FPS-чип прячется без ?dev=1. */
let YxSdk = null, YxPlayer = null, YxReady = false, YxStarted = false;
let YxNoAds = false, YxLastFull = 0, YxLastReward = 0;
const YX_FULL_GAP = 62000;     /* площадка: не чаще ~раза в минуту */
const YX_REWARD_GAP = 62000;
/* Страховки: пауза без причины не должна держать игру вечно (см. yxPauseWatchdog),
   а ролик, который не прислал onClose/onError, — тоже */
const YX_PAUSE_MAX = 1600;
const YX_AD_MAX = 25000;
let yxPauseAt = 0;
let yxAdBusy = false;
const YX_SAVE_KEYS = ["bh_apples", "bh_rubles", "bh_apple_spent", "bh_rub_spent", "bh_nick", "bh_free_apple_at",
  "bh_best", "bh_best_knives", "bh_best_level", "bh_pxp", "bh_owned", "bh_knife",
  "bh_items", "bh_loadout", "bh_seq_on", "bh_seq", "bh_bp_claimed", "bh_stats", "bh_boss_bag", "bh_rand_buys", "bh_premium"];
const YX_DEV = /[?&]dev=1(?:&|$)/.test(location.search);

/* Правка боссов и рандомизатор — штатные инструменты разработки, поэтому их
   кнопки в доке видны всегда (и на площадке). Прячем только FPS-чип: он выдаёт
   отладочный билд; вне площадки и при ?dev=1 видно всё. */
function yxApplyDevUi() {
  /* FPS-чип — часть игрового интерфейса по требованию заказчика (виден и на
     площадке): он не выдаёт отладочный билд, а показывает, что кадр просел. */
  if (YX_DEV) return;
  const ids = [];
  for (let i = 0; i < ids.length; i++) {
    const el = document.getElementById(ids[i]);
    if (el) el.style.display = "none";
  }
}

/* Пауза площадки: звук вне игры (треб. 1.3) — глушим за 2 секунды */
function yxPause() {
  if (!GamePause.on) yxPauseAt = performance.now();
  GamePause.on = true;
  Sfx.suspend();
}
function yxResume() {
  yxPauseAt = 0;
  GamePause.on = false;
  lastT = 0;            /* без рывка времени после возобновления */
  prevPace = 0;
  Sfx.resume();
  /* пауза кончилась: нажатия, сделанные «в паузу», не должны вылетать в уже
     повёрнутое бревно — очередь броска чистим. Блинда-окна на ввод больше нет:
     прицельность клика проверяется по повороту бревна (js/flow.js) */
  if (typeof clearThrowBuffer === "function") clearThrowBuffer();
}
/* Страховка от зависшей паузы: окно на виду и в фокусе, рекламы нет, а пауза
   висит дольше YX_PAUSE_MAX — значит площадка/focus не прислали resume (или
   событие потерялось). Возвращаем игру сами, иначе поле намертво немеет:
   ни броска, ни анимации — снаружи это выглядит как зависание. */
function yxPauseWatchdog(now) {
  if (!GamePause.on || yxAdBusy) return false;
  if (document.hidden || (document.hasFocus && !document.hasFocus())) {
    yxPauseAt = 0;
    return false;
  }
  if (!yxPauseAt) {
    yxPauseAt = now;
    return false;
  }
  if (now - yxPauseAt < YX_PAUSE_MAX) return false;
  yxResume();
  return true;
}

/* Страховка, если площадка не прислала события.
   BLUR БОЛЬШЕ НЕ СТАВИТ ИГРУ НА ПАУЗУ. Раньше любое случайное перехватывание
   фокуса — уведомление, другое окно, панель задач, дев-инструменты — глушило
   бой целиком до YX_PAUSE_MAX (1.6 с): игрок видел зависание, клики за это
   время копились, а после возврата вылетали разом, и нож садился в чужой.
   Видимая страница играет дальше — глушим только звук (треб. 1.3: звук вне
   игры молчит), мир и ввод не трогаем.
   Полная пауза остаётся за документом, который реально скрыт (свернули окно,
   ушли на вкладку), и за событиями площадки (game_api_pause, реклама). */
function yxBindDom() {
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) yxPause(); else yxResume();
  });
  window.addEventListener("blur", function () {
    if (!GamePause.on) Sfx.suspend();
  });
  window.addEventListener("focus", function () {
    if (!GamePause.on) Sfx.resume();
  });
}

/* Облачные сейвы (треб. 1.6, 1.13.3) */
let yxDirty = true;
function yxDirtyMark() { yxDirty = true; }

function yxSnapshot() {
  const data = {};
  for (let i = 0; i < YX_SAVE_KEYS.length; i++) {
    const v = localStorage.getItem(YX_SAVE_KEYS[i]);
    if (v != null) data[YX_SAVE_KEYS[i]] = v;
  }
  return data;
}
function yxCloudPush() {
  if (!YxPlayer || !yxDirty) return;
  try {
    const p = YxPlayer.setData(yxSnapshot(), false);
    yxDirty = false;
    if (p && p.catch) p.catch(function () { yxDirty = true; });
  } catch (err) {}
}
/* Периодическую отправку не делаем во время боя: SDK-вызов может дать
   заметный кадр. Отправим в меню/на паузе/при скрытии страницы. */
function yxCloudTick() {
  if (typeof state !== "undefined" && state === "play") return;
  yxCloudPush();
}
function yxCloudPull() {
  if (!YxPlayer) return;
  YxPlayer.getData(YX_SAVE_KEYS).then(function (data) {
    if (!data) return;
    const localBest = +(localStorage.getItem("bh_best") || 0);
    const cloudBest = +(data.bh_best || 0);
    /* Кто дальше прошёл — тот и главный, иначе облако затирает свежий прогресс */
    if (cloudBest > localBest) {
      for (let i = 0; i < YX_SAVE_KEYS.length; i++) {
        const k = YX_SAVE_KEYS[i];
        if (data[k] != null) localStorage.setItem(k, data[k]);
      }
      location.reload();
      return;
    }
    yxCloudPush();
  }).catch(function () {});
}

/* Полноэкранный блок: только в логической паузе, не чаще YX_FULL_GAP,
   не на старте сессии. Перед показом игра замирает, звук молчит (треб. 4.4) */
function yxShowFullscreen(onDone) {
  const done = typeof onDone === "function" ? onDone : function () {};
  if (!YxReady || YxNoAds || GamePause.on) { done(); return; }
  const now = Date.now();
  if (now - YxLastFull < YX_FULL_GAP) { done(); return; }
  YxLastFull = now;
  let closed = false;
  const finish = function () {
    if (closed) return;
    closed = true;
    yxAdBusy = false;
    clearTimeout(guard);
    GamePause.on = false;
    Sfx.resume();
    if (typeof Analytics !== "undefined") Analytics.ad("interstitial", "platform");
    done();
  };
  const guard = setTimeout(finish, YX_AD_MAX);
  yxAdBusy = true;
  GamePause.on = true;
  Sfx.suspend();
  YxSdk.adv.showFullscreenAdv({ callbacks: { onClose: finish, onError: finish } });
}

/* Ролик с вознаграждением: доступен и после покупки «без рекламы» */
function yxShowRewarded(onReward, onFail) {
  const fail = typeof onFail === "function" ? onFail : function () {};
  if (!YxReady || GamePause.on) { fail(); return; }
  const now = Date.now();
  if (now - YxLastReward < YX_REWARD_GAP) { fail(); return; }
  YxLastReward = now;
  let closed = false;
  const finish = function (ok) {
    if (closed) return;
    closed = true;
    yxAdBusy = false;
    clearTimeout(guard);
    GamePause.on = false;
    Sfx.resume();
    if (typeof Analytics !== "undefined") Analytics.ad(ok ? "rewarded" : "rewarded_fail", "other");
    if (ok && typeof onReward === "function") onReward(); else fail();
  };
  const guard = setTimeout(function () { finish(false); }, YX_AD_MAX);
  yxAdBusy = true;
  GamePause.on = true;
  Sfx.suspend();
  YxSdk.adv.showRewardedVideo({ callbacks: {
    onRewarded: function () { finish(true); },
    onClose: function () { finish(false); },
    onError: function () { finish(false); },
  }});
}

/* Стики-баннер: в меню и на паузе; в геймплее его быть не должно */
function yxShowBanner() {
  if (YxReady && !YxNoAds) YxSdk.adv.showBannerAdv();
}
function yxHideBanner() { if (YxReady) YxSdk.adv.hideBannerAdv(); }

function yxGameReady() {
  if (!YxSdk || YxStarted) return;
  YxStarted = true;
  if (YxSdk.features && YxSdk.features.LoadingAPI) YxSdk.features.LoadingAPI.ready();
}
function yxGameplay(on) {
  if (!YxReady) return;
  const api = YxSdk.features && YxSdk.features.GameplayAPI;
  if (!api) return;
  if (on) api.start(); else api.stop();
}

/* SDK подключён с async (index.html): он больше не тормозит первую отрисовку,
   поэтому window.YaGames может появиться уже после остальных скриптов. Ждём
   его до 10 с; вне площадки (локально) просто не дождёмся — это норма. */
function yxWhenSdk(cb) {
  if (window.YaGames) { cb(); return; }
  let tries = 0;
  (function step() {
    if (window.YaGames) { cb(); return; }
    if (++tries > 100) return;
    setTimeout(step, 100);
  })();
}

function yxInit() {
  yxApplyDevUi();
  yxBindDom();
  yxWhenSdk(yxSdkRun);
}

function yxSdkRun() {
  YaGames.init().then(function (sdk) {
    YxSdk = sdk;
    YxReady = true;
    sdk.on("game_api_pause", function () { yxPause(); yxCloudPush(); yxGameplay(false); });
    sdk.on("game_api_resume", function () { yxResume(); yxGameplay(true); });
    if (sdk.getPlayer) {
      sdk.getPlayer({ scopes: false }).then(function (p) {
        YxPlayer = p;
        yxCloudPull();
      }).catch(function () {});
    }
    setInterval(yxCloudTick, 30000);
    /* Игра готова для площадки только когда ушла заставка загрузки: пока она
       на виду, ready() соврал бы (в доке — «нет экранов загрузки» в момент
       вызова). Порядок гарантирует js/loader.js */
    if (window.GameLoader) window.GameLoader.whenReady(yxGameReady);
    else requestAnimationFrame(function () { requestAnimationFrame(yxGameReady); });
  }).catch(function () {});
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", yxInit);
else yxInit();
