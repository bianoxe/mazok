const LOG_HP = 8;
/* запас босса: один и тот же на любой стадии. У кого в карточке свой (BOSSES[].hp),
   тот берёт свой, остальным ровно столько ножей — см. maxHpFor в progress.js */
const BOSS_HP = 16;
const PLAYER_LIVES = 3;
/* ---------- алмазы (новая валюта бета-теста) ----------
   Каждому игроку при первом запуске выдаётся 350 алмазов. Заработать их больше
   нельзя: только потратить — на Premium и VIP-ножи. Счётчик живёт в сейве,
   покупки пишутся в статистику (js/analytics.js). */
const RUBLES_START = 350;

/* Premium (js/premium.js): подписка добавляет три ЗОЛОТЫЕ жизни сверх обычных
   трёх. Это не лечение и не бонус предмета — запас на весь забег, поэтому
   максимум считается одной функцией playerMaxLives(). */
const PREMIUM_LIVES_BONUS = 3;
/* Чит-кнопка в доке меню (index.html: cheatBtn, js/shop.js: cheatUnlockAll):
   сколько яблок она высыпает в кошелёк и сколько предметов кладёт в запас.
   Флаг save.inf — «бесконечные деньги»: покупки больше не списывают кошелёк
   (js/shop.js: spendApples), а в HUD вместо числа показывается «∞». */
const CHEAT_APPLES = 999999999;
const CHEAT_ITEMS = 9;
const N_RAYS = 8;
const TWO_PI = Math.PI * 2;

let W = 0, H = 0, dpr = 1;
let stageScale = 1, pixelScale = 1, viewSx = 1, viewSy = 1, prevPace = 0;
let viewW = 0, viewH = 0, cropX = 0, cropY = 0;
let phone = false;
let persistTimer = 0;
let state = "menu";
let sheetMode = null;
/* Меню предметов (shop.js): открытая страница и выбранная вещь.
   Страницы и плитки держим вне DOM, чтобы выбор не слетал при перерисовке. */
let itemsSel = "";
let itemsPage = "junk";
let itemsFlipDir = 0;   /* 1 / −1: с какой стороны влетела страница витрин */
let lastT = 0;
let lastThrowAt = 0;
let muted = false;
/* Пауза площадки: ставится событиями SDK (js/yandex.js) — замораживает геймплей */
const GamePause = { on: false };
let fpsCap = 0;
let fpsRedUntil = 0;
let fpsHot = false;
let fpsHitchOn = false;
let fpsUiAt = 0;
const fpsSamples = new Float64Array(90);
const fpsBins = new Uint16Array(241);
let fpsSampleN = 0;
let fpsSampleI = 0;
/* Счётчик FPS в HUD: текущий, средний за сессию и худший за последние 5 с.
   Времена кадров лежат в списке не длиннее окна — по нему считаем и текущий
   кадр (последние 500 мс), и худшую секунду внутри пятисекундного окна. */
const FPS_WIN_MS = 5000;
const fpsLog = [];
let fpsFrames = 0;     /* кадров за сессию */
let fpsSumDt = 0;      /* суммарное время кадров, с — знаменатель среднего */
let fpsAvgVal = 0;
let fpsMinVal = 0;
let knifeW = 180, knifeH = 500;
const KNIFE_SRC_W = 180;
const KNIFE_SRC_H = 500;
const KNIFE_BLADE_END = 242;
/* Размер ножа на экране: доля короткой стороны кадра и пределы. Это значения
   телефона (js/mobile.js); ПК-версия чуть крупнее — свои PC_* в js/layout.js.
   Ужаты на ~6 % (заказчик: «ножи чуть поменьше, с их хитбоксом»): хитбокс ножа
   считается от этого же размера (js/hit.js: hitLim/knifeWidth), поэтому полоса
   удара уменьшается вместе с рисунком. */
const KNIFE_SIZE_K = 0.278;
const KNIFE_SIZE_MIN = 216;
const KNIFE_SIZE_MAX = 288;
/* Ещё чуть-чуть меньше (заказчик: «ножи в игре чуть-чуть поменьше»). Один
   множитель на обе раскладки — телефон и ПК (js/layout.js, js/mobile.js).
   Бревно и его эталон (KNIFE_LOG_REF) не трогаем: уменьшается только нож,
   а вместе с рисунком — и его хитбокс (js/hit.js: hitLim/knifeWidth). */
const KNIFE_VIEW_SCALE = 0.94;
let visW = 0, visH = 0;
let hudSnap = "";
let loadoutSnap = "";
let livesSnap = "";
let buffSnap = "";
const particlePool = [];
const trailPool = [];
const applePool = [];
const appleHalfPool = [];
const canvasPool = [];
const flyPool = [];
const stuckPool = [];
const polyLX = [];
const polyLY = [];
const polyRX = [];
const polyRY = [];
const colorPair = ["#000", "#000"];
const DUST_WOOD = ["#e8d2ae", "#f7f3ec"];
const SPARK_WOOD = ["#f7f3ec", "#e8d2ae", "#fff6e8"];
const SPARK_MARM = ["#ffffff", "#ffd0e0", "#ffe8a0"];
const DONUT_SPRINKLES = ["#e4453a", "#3d7dff", "#ffd23f", "#3dcc6a", "#ff5a3c", "#2f6bff", "#ffe56a", "#2ebd62"];
const DONUT_GLAZE = ["#ff4d8d", "#ff7eb3", "#ffd0e6"];
/* яблоко (новая валюта): мякоть и кожица — для щепок от подбора, лист — для
   зелёных искр рядом */
const APPLE_CHIPS = ["#f6efe2", "#e0342c", "#ff8a72"];
/* щепки золотого и алмазного яблок: сразу видно, что попалось не обычное */
const APPLE_CHIPS_GOLD = ["#fff6c8", "#f5c02a", "#a87408"];
const APPLE_CHIPS_DIAMOND = ["#ffffff", "#7fe0f7", "#2a86b8"];
const APPLE_LEAF = ["#3fa845", "#8ad46a", "#2f7a34"];
const SPARK_FAIL = ["#d8eef4", "#9ad0d8", "#ffffff"];
const SPARK_CLASH = ["#fff0c8", "#ffd078", "#f0e6d4"];
/* белый «взрыв» на отскоке от рукояти: искры и вспышка в месте удара */
const SPARK_POP = ["#ffffff", "#ffffff", "#eaf6ff"];
const CHIP_CLASH = ["#e8e0d4", "#c8c0b4"];
const SPARK_IRON = ["#f7fafc", "#d5dee8", "#fff4c8", "#9aa6b2"];
let logBake = null;
let logAhead = null;
let bakeSkip = 0;
let shatterSpr = null;
const sfxLater = [];
const shardPool = [];
/* Предварительно испечённые спрайты клиньев для следующего разлома (js/draw-hud.js) */
let shardWarmCache = null;
const mainsScratch = [];
let haloSpr = null;
let haloKey = "";
let hpBarSpr = null;
let hpBarKey = "";
/* множитель запекания полоски HP (пиксели экрана / мир) */
let hpBarK = 0;
/* телефон: не чаще одного запекания бревна за этот интервал (мс) — иначе
   серия ударов даёт серию подвисаний */
let phoneBakeAt = 0;
let hpFontHook = false;
let shapePathId = "";
let shapePathR = -1;
let shapePathObj = null;

const reportedHz = Math.round(Number(window.screen && screen.refreshRate) || 0);
if (reportedHz >= 30 && reportedHz <= 360) fpsCap = reportedHz;

const assets = {};
const particles = [];
const flyApples = [];
/* половины разрезанных яблок: разлетаются от бревна и тают (js/fx.js:
   spawnAppleHalves, js/draw-stuck.js: drawAppleHalves) */
const appleHalves = [];
const trails = [];
const flyOrder = [];

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    return fallback;
  }
}

const save = {
  apples: +localStorage.getItem("bh_apples") || 0,
  /* Алмазы: при первом запуске — 350. Старые сейвы, где ключа ещё нет,
     получают стартовые 350 один раз. Больше никак не зарабатываются. */
  rubles: (function () {
    const raw = localStorage.getItem("bh_rubles");
    if (raw == null || raw === "") return RUBLES_START;
    return Math.max(0, Math.floor(+raw) || 0);
  })(),
  /* сколько яблок и алмазов потрачено за всё время — для профиля админа */
  appleSpent: Math.max(0, Math.floor(+localStorage.getItem("bh_apple_spent") || 0)),
  rubSpent: Math.max(0, Math.floor(+localStorage.getItem("bh_rub_spent") || 0)),
  /* Ник обязателен: без него игра не пускает в забег (js/analytics.js) */
  nick: (function () {
    const raw = localStorage.getItem("bh_nick");
    return raw ? String(raw).slice(0, 20) : "";
  })(),
  /* когда снова можно взять яблоки за рекламу (мс, 0 — можно сразу) */
  freeAppleAt: Math.max(0, Math.floor(+localStorage.getItem("bh_free_apple_at") || 0)),

  /* Сколько раз игрок открывал случайный нож за яблоки: цена растёт на 25
     за каждое открытие (js/knife-book.js: randomUnlockPrice) */
  randBuys: Math.max(0, Math.floor(+localStorage.getItem("bh_rand_buys") || 0)),
  /* Рекорд — больше всего ножей, воткнутых за один забег (раньше здесь был
     уровень). Старые сейвы хранят уровни, поэтому без отметки bh_best_knives
     рекорд начинается с нуля: старое число нельзя выдавать за ножи. */
  best: (function () {
    if (!localStorage.getItem("bh_best_knives")) return 0;
    return Math.max(0, Math.floor(+localStorage.getItem("bh_best") || 0));
  })(),
  /* ---------- дорожка наград (js/rewards.js) ----------
     rtIdx — номер следующей ячейки (0…19), rtNextAt — когда она откроется
     (мс, 0 — можно забрать сразу). Время идёт только от последнего получения:
     если игрок отсутствовал 12 часов, готовы сразу три награды. */
  rtIdx: Math.max(0, Math.min(19, Math.floor(+localStorage.getItem("bh_rt_idx") || 0))),
  rtNextAt: Math.max(0, Math.floor(+localStorage.getItem("bh_rt_next") || 0)),
  /* До какого уровня игрок доходил вообще (не за забег) — число нужно только
     для внутренней раскладки стадий, в интерфейсе уровней больше нет. */
  bestLevel: Math.max(0, Math.floor(+localStorage.getItem("bh_best_level") || 0)),
  owned: readJson("bh_owned", ["classic"]),
  knife: localStorage.getItem("bh_knife") || "classic",
  items: readJson("bh_items", {}),
  loadout: readJson("bh_loadout", {}),
  seqOn: localStorage.getItem("bh_seq_on") === "1",
  seq: readJson("bh_seq", []),
  /* Рандомизатор ножей в коллекции (js/knife-book.js: knifeRndNext): каждый
     бросок меняет нож в руке на случайный из открытых. rndOwn/rndPool —
     поля старой «своей очереди»; интерфейса у них больше нет, но сейвы
     продолжают читаться без ошибок. */
  rnd: localStorage.getItem("bh_rnd") === "1",
  rndOwn: localStorage.getItem("bh_rnd_own") === "1",
  rndPool: readJson("bh_rnd_pool", []),
  /* Бесконечные яблоки от чит-кнопки: живёт в localStorage, сбрасывается
     кнопкой сброса прогресса (js/input.js: resetProgress) */
  inf: localStorage.getItem("bh_inf") === "1",
  /* Бесконечные жизни: переключателя в интерфейсе больше нет, режим всегда
     выключен. Старое значение из localStorage не читаем. */
  infLives: false,
  /* Premium (js/premium.js): отключает межстраничную рекламу и баннеры,
     добавляет три золотые жизни. Реклама за возрождение остаётся. */
  premium: localStorage.getItem("bh_premium") === "1"
};
if (!Array.isArray(save.owned) || !save.owned.length) save.owned = ["classic"];
if (!save.owned.includes("classic")) save.owned.unshift("classic");
if (!save.items || typeof save.items !== "object") save.items = {};
if (!save.loadout || typeof save.loadout !== "object") save.loadout = {};

/* Полный запас жизней забега: три обычных + три золотые у Premium. Одна
   функция на весь код, чтобы запас не разъезжался между стартом, возрождением
   и HUD (js/flow.js, js/hud.js, js/input.js). */
function playerMaxLives() {
  return PLAYER_LIVES + (save.premium ? PREMIUM_LIVES_BONUS : 0);
}

/* Ник игрока: пока не введён — нейтральное «Игрок» (форма ника блокирует игру,
   но таблица лидеров и отзывы не должны показывать пустоту) */
function playerNick() {
  return save.nick || "Игрок";
}

/* Единственное место списания алмазов: баланс и «потрачено» меняются вместе,
   отрицательным баланс стать не может. */
function spendRubles(n) {
  const cost = Math.max(0, Math.floor(+n) || 0);
  if (!cost) return true;
  if ((save.rubles | 0) < cost) return false;
  save.rubles = (save.rubles | 0) - cost;
  save.rubSpent = (save.rubSpent | 0) + cost;
  return true;
}


/* Надет ли ИМЕННО этот нож. Рандомизатор ведёт себя как отдельный нож
   (js/knife-book.js: save.rnd): пока он выбран, ни у одного ножа нет отметки
   «надет», а снять рандомизатор можно только выбрав другой нож
   (js/shop.js: equipKnife). */
function knifeEquipped(id) {
  return !save.rnd && save.knife === id;
}

/* Первый забег новичка: один раз подсказываем, где живут его жизни
   (js/hud.js: livesHint). Дальше флаг лежит в localStorage и подсказка молчит. */
let livesHintSeen = localStorage.getItem("bh_lives_hint") === "1";
/* Список id всех ножей выводим из самих скинов: js/knife-skins.js грузится
   раньше этого файла (index.html). Захардкоженный список отставал от
   коллекции — СЕРП и новые ножи боссов в нём забывали, поэтому кнопка «🎁» их
   не открывала, а фильтр ниже вычищал их из сейва при загрузке. */
const KNIFE_IDS = KNIFE_SKINS.map(skin => skin.id);
save.owned = save.owned.filter(id => KNIFE_IDS.includes(id));
if (!save.owned.includes("classic")) save.owned.unshift("classic");
/* Свой список рандомизатора (галочка «своя очередь», js/knife-book.js) чистим
   от несуществующих id: после правок коллекции в сейве иначе оставались бы
   призраки, и пул выпадения оказался бы пустым */
if (!Array.isArray(save.rndPool)) save.rndPool = [];
save.rndPool = save.rndPool.filter(id => KNIFE_IDS.includes(id));
/* Ножи с флагом unlocked открыты всем и в save.owned не лежат — их нельзя
   сбрасывать на классику после перезагрузки. Сейчас таких ножей нет (ножи без
   редкости выдаёт кнопка «Открыть»), но проверка остаётся: флаг может вернуться. */
const savedKnifeSkin = KNIFE_SKINS.find(skin => skin.id === save.knife) || KNIFE_SKINS[0];
if (!savedKnifeSkin || (!save.owned.includes(save.knife) && !savedKnifeSkin.unlocked)) save.knife = "classic";

const game = {
  level: 1,
  /* забег уже перебил прежний рекорд: справа сверху вместо колонки чисел и
     подписей горит красная лента «НОВЫЙ РЕКОРД» (js/flow.js: levelCleared,
     js/hud.js: syncRecordHud) */
  bestBeaten: false,
  /* счётчик справа: сколько ножей воткнуто за забег. Прибавляется в том же
     кадре, когда нож сел в кромку (js/flow.js: stickKnife) */
  recordNum: 0,
  /* лучший результат ДО этого забега — с ним сравниваем (js/flow.js:
     startRun). bestKnown: сравнивать уже есть с чем — то есть это не первый
     забег игрока. Первый забег рекорда не даёт вовсе */
  bestBase: 0,
  bestKnown: false,
  apples: save.apples,
  stuck: [],
  /* яблоки, что висят на бревне прямо сейчас (раскладка уровня, см. js/flow.js:
     placeLogApples). Это не кошелёк: кошелёк — game.apples выше */
  logApples: [],
  thrown: 0,
  log: { x: 0, y: 0, r: 120, angle: 0, speed: 0, vel: 0, dir: 1, from: 0, delta: 0, t: 0, dur: 1, mode: "tween", cruise: false, cruisePeriod: 0, pauseT: 0, burst: 0, ph: 0, pt: 0, spinT: 0, scale: 1, hp: 5, maxHp: 5, dmg: 0, hitFlash: 0, hitFlashT: 0, hpTrail: 1, hpTrailHold: 0, hpNip: 0, balloonN: 0, balloonT: 0, plates: null, shellFly: null, pepsiStep: 0, gearPhase: 0, boss: null },
  knife: { ready: true, flying: false, x: 0, y: 0, vy: 0, bob: 0 },
  flying: [],
  handT: 1,
  lives: playerMaxLives(),
  maxLives: playerMaxLives(),
  fail: null,
  failT: 0,
  deathT: 0,
  deathDone: false,
  deathTick: 0,
  deathBeats: 0,
  skipShown: false,
  reviveShown: false,
  drop: null,
  clash: null,
  /* белый «взрыв» в точке отскока (js/flow.js: bounceOffHandle, js/draw-hud.js:
     drawPop): t тикает 1 -> 0 за ~0.13 с */
  pop: null,
  hitStop: 0,
  shake: 0,
  shakeX: 0,
  shakeY: 0,
  shakeT: 0,
  shakeDur: 0,
  shakeMag: 0,
  shakePh: 0,
  viewY: 0,
  viewV: 0,
  uiDip: 0,
  uiDipV: 0,
  flash: 0,
  flashCol: "255,255,255",
  theme: 0,
  time: 0,
  intro: 0,
  sting: 0,
  stingT: 0,
  stingHit: 0,
  stingWhoosh: 0,
  victory: 0,
  victoryT: 0,
  victoryReward: null,
  buffs: { shield: false, slow: false, double: false },
  shatterT: 0,
  shockT: 0,
  shockX: 0,
  shockY: 0,
  shockR: 120,
  cracks: [],
  shards: [],
  bakeId: 0
};

