function usingSeq() {
  return !!(save.seqOn && save.seq && save.seq.length);
}

function stepAt(level) {
  if (!usingSeq()) return null;
  const seq = save.seq;
  let i = ((level | 0) - 1) % seq.length;
  if (i < 0) i += seq.length;
  return seq[i];
}

/* ---------- бревно по стадиям ----------
   Стадия — отрезок уровней до очередного босса (босс каждый 5-й уровень):
   1-я стадия — уровни 1-5, 2-я — 6-10 и так далее. Первые пять стадий заданы
   жёстко (дуб, берёза, ель, тёмный дуб, оливковое), шестая — разноцветное
   дерево: там на КАЖДОЕ бревно выпадает свой случайный вариант из шести
   (подряд один и тот же не повторяется). Дальше бревно выпадает случайно и
   держится стадию, но если выпало разноцветное — оно тоже меняется на каждом
   бревне. Вернуться бревно может не раньше, чем через 2 стадии: выпало на 7-й —
   8-ю пропускает, снова самое раннее на 9-й. */
const STAGE_LEN = 5;
const STAGE_WOOD_ORDER = [0, 1, 2, 3, 4];   // ДУБ, БЕРЁЗА, ЕЛЬ, ТЁМНЫЙ ДУБ, ОЛИВКОВОЕ
const RAINBOW_WOOD_IDS = [5, 6, 7, 8, 9, 10];
/* Породы бревна для выбора стадии: пять обычных + ОДНО разноцветное.
   Раньше в пул попадали все шесть вариаций разноцветного (id 5..10) как
   отдельные породы — и оно выпадало в 6 раз чаще любой другой. Теперь это одна
   порода: конкретная вариация картинки выбирается на КАЖДОЕ бревно
   (rainbowWoodAt), а шанс у всех пород равный. */
const RAINBOW_KIND = RAINBOW_WOOD_IDS[0];
const WOOD_KINDS = [0, 1, 2, 3, 4, RAINBOW_KIND];
const RAINBOW_STAGE = STAGE_WOOD_ORDER.length + 1;
const STAGE_WOOD_GAP = 2;
const stageWoodPicks = [];
const rainbowPicks = [];

function stageFor(level) {
  const l = Math.max(1, level | 0);
  return Math.floor((l - 1) / STAGE_LEN) + 1;
}

/* Выбираем бревно для стадии: из общего списка минус те, что выпадали на
   ближайших (GAP - 1) стадиях, — так бревно не возвращается раньше срока. */
function rollStageWood(stage) {
  const pool = [];
  for (let i = 0; i < WOOD_KINDS.length; i++) {
    const kind = WOOD_KINDS[i];
    const was = stageWoodPicks.lastIndexOf(kind);
    if (was >= 0 && stage - (was + 1) < STAGE_WOOD_GAP) continue;
    pool.push(kind);
  }
  if (!pool.length) return WOOD_KINDS[(Math.random() * WOOD_KINDS.length) | 0];
  return pool[(Math.random() * pool.length) | 0];
}

/* Бревно стадии. Выборы копятся по порядку, поэтому для любого уровня
   ответ всегда один и тот же — бревно держится всю стадию. */
function stageWoodAt(stage) {
  const s0 = Math.max(1, stage | 0);
  for (let s = stageWoodPicks.length + 1; s <= s0; s++) {
    const fixed = STAGE_WOOD_ORDER[s - 1];
    if (fixed != null) {
      stageWoodPicks.push(fixed);
    } else if (s === RAINBOW_STAGE) {
      /* разноцветное: в пуле стадий это ОДНА порода, вид в кадре выбирается
         на каждое бревно (themeIndexFor → rainbowWoodAt) */
      stageWoodPicks.push(RAINBOW_KIND);
    } else {
      stageWoodPicks.push(rollStageWood(s));
    }
  }
  const id = stageWoodPicks[s0 - 1];
  return id >= 0 && id < THEMES.length ? id : 0;
}

function resetStageWoods() {
  stageWoodPicks.length = 0;
  rainbowPicks.length = 0;
}

/* Разноцветное бревно: свой случайный вариант на КАЖДОЕ бревно, подряд один и
   тот же не выпадает. Выбор помним по уровню — текстура, щепки и осколки
   одного бревна берут один цвет, и возврат на тот же уровень даёт тот же вид. */
function rainbowWoodAt(level) {
  const l = Math.max(1, level | 0);
  const was = rainbowPicks[l];
  if (was != null) return was;
  const ids = RAINBOW_WOOD_IDS;
  const prev = rainbowPicks[l - 1];
  const pool = prev != null ? ids.filter(id => id !== prev) : ids;
  const pick = pool[(Math.random() * pool.length) | 0];
  rainbowPicks[l] = pick;
  return pick;
}

function isRainbowWood(id) {
  return RAINBOW_WOOD_IDS.indexOf(id) >= 0;
}

/* ---------- узор вращения бревна ----------
   Узор не привязан к бревну: он выдаётся по уровню, комплектами. Пока
   комплект не разобран, ни один узор в нём не повторяется, а первый узор
   нового комплекта не совпадает с прошлым — поэтому на соседних уровнях
   вращение всегда разное. Ровное вращение попадается чаще обманок: три уровня
   из четырёх идут ровно, обманка достаётся четвёртому, — а на первых трёх
   стадиях (уровни 1-15, до третьего босса) обманок нет вовсе, там бревно
   только ровно и плавно крутится, чтобы и вращение, и попадание читались
   спокойно.

   Первое бревно (1-й уровень) из мешка не тянется вовсе: у него ВСЕГДА один
   и тот же узор — ровное кручение без разгонов, торможений и остановок
   (WOOD_FIRST_PATTERN). Меняется только скорость: она выбирается случайно
   один раз на забег, поэтому забеги не похожи друг на друга, а перезапуск
   1-го уровня внутри забега крутится с той же скоростью. */
const patternPicks = [];
const patternBags = { plain: [], surprise: [] };

/* Ровные узоры (индексы WOOD_SCRIPTS): ни разворотов, ни резких заходов.
   7 — ровное кручение без разгонов и торможений (см. WOOD_CRUISE_MS) */
const WOOD_PLAIN = [0, 1, 2, 3, 7];
/* Индекс узора первого бревна: 7 — ровное кручение (WOOD_SCRIPTS[7]) */
const WOOD_FIRST_PATTERN = 7;
/* Период оборота первого бревна на текущий забег (0 — ещё не выбран) */
let woodFirstPeriodMs = 0;
/* Обманки с разворотом — они достаются реже: одна на каждые четыре уровня,
   место внутри четвёрки случайное, поэтому подряд они не идут */
const WOOD_SURPRISE = [4, 5, 6];
const WOOD_SURPRISE_EVERY = 4;
const WOOD_CALM_STAGES = 3;
let surpriseSlots = [];

/* Из какого комплекта тянуть узор этому уровню */
function patternPoolFor(level) {
  if (stageFor(level) <= WOOD_CALM_STAGES) return "plain";
  return wantSurprise() ? "surprise" : "plain";
}

/* Раскладка обманок: в каждой четвёрке уровней ровно одна обманка, место в
   четвёрке выбирается заново — так обманки не идут ни подряд, ни слишком часто */
function wantSurprise() {
  if (!surpriseSlots.length) {
    const slots = [];
    for (let i = 0; i < WOOD_SURPRISE_EVERY; i++) slots.push(i === 0);
    for (let i = slots.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      const t = slots[i]; slots[i] = slots[j]; slots[j] = t;
    }
    surpriseSlots = slots;
  }
  return surpriseSlots.pop();
}

/* Комплект узоров: пока он не разобран, ни один узор в нём не повторится,
   а порядок внутри комплекта каждый раз новый, поэтому заучить нельзя. */
function refillPatternBag(pool) {
  const bag = (pool === "surprise" ? WOOD_SURPRISE : WOOD_PLAIN).slice();
  for (let i = bag.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    const t = bag[i]; bag[i] = bag[j]; bag[j] = t;
  }
  patternBags[pool] = bag;
}

/* Узор уровня. Если комплект подсунул тот же узор, что был на прошлом бревне,
   берём из комплекта следующий — на соседних уровнях вращение всегда разное. */
function rollPattern(level) {
  const pool = patternPoolFor(level);
  if (!patternBags[pool].length) refillPatternBag(pool);
  const bag = patternBags[pool];
  let idx = bag.pop();
  const avoid = lastWoodPattern();
  if (idx === avoid && bag.length) {
    bag.unshift(idx);
    idx = bag.pop();
  }
  return idx;
}

/* Последний выданный узор: у босса узора нет, поэтому его пропускаем —
   иначе на стыке комплектов мог бы повториться узор «через босса». */
function lastWoodPattern() {
  for (let i = patternPicks.length - 1; i >= 0; i--) if (patternPicks[i] >= 0) return patternPicks[i];
  return -1;
}

/* Узор закрепляется за уровнем: перезапуск уровня (после проигрыша) начнёт
   с тем же узором, а следующий уровень — уже с другим. */
function woodPatternAt(level) {
  const l = Math.max(1, level | 0);
  for (let i = patternPicks.length + 1; i <= l; i++) {
    if (isBoss(i)) patternPicks.push(-1);
    /* первое бревно получает свой узор всегда, а не из мешка */
    else if (i === 1) patternPicks.push(WOOD_FIRST_PATTERN);
    else patternPicks.push(rollPattern(i));
  }
  const n = WOOD_SCRIPTS.length;
  if (!n) return 0;
  const idx = patternPicks[l - 1] | 0;
  if (idx < 0) return 0;
  return ((idx % n) + n) % n;
}

function resetWoodPatterns() {
  patternPicks.length = 0;
  patternBags.plain = [];
  patternBags.surprise = [];
  surpriseSlots = [];
  /* новый забег — новая скорость у первого бревна, узор при этом тот же */
  woodFirstPeriodMs = 0;
}

/* Скорость оборота первого бревна: случайная на забег и одна на весь забег.
   Внутри уровня она не меняется вовсе — это и есть ровное кручение. Берём из
   того же набора WOOD_CRUISE_MS (boss-spin.js), что и остальные ровные брёвна:
   быстрее игрок не увидит, медленнее — тоже. */
function woodFirstPeriodMsNow() {
  if (!woodFirstPeriodMs) {
    const n = WOOD_CRUISE_MS.length;
    woodFirstPeriodMs = WOOD_CRUISE_MS[(Math.random() * n) | 0] || WOOD_CRUISE_MS[0];
  }
  return woodFirstPeriodMs;
}

/* ---------- раскладка ножей в бревне ----------
   Бревно приходит не с пустым полем: часть кромки занята ножами ещё до
   броска. Раскладку выбирает уровень — тем же порядком, что и узоры: пока
   комплект раскладок не разобран, одна и та же не повторится, а выбор
   закрепляется за уровнем, поэтому перезапуск начнёт с той же раскладки.
   Босс раскладку не занимает — у него своя кучка (bossKnifeRels, js/hit.js).

   Первые два уровня — по одному ножу, чтобы понять игру (и первый вовсе без
   ножей: учим бросать в голое бревно). Дальше берётся набор из WOOD_KNIVES
   (bosses.js) без пустого бревна и одиночки — те только на обучении. Форму
   раскладки (углы) задаёт woodKnifeRels (js/hit.js). */
const WOOD_KNIFE_LEARN = 2;
const woodKnifePicks = [];
let woodKnifeBag = [];

function refillWoodKnifeBag() {
  const bag = [];
  for (let i = 0; i < WOOD_KNIVES.length; i++) {
    const id = WOOD_KNIVES[i].id;
    if (id === "empty" || id === "single") continue;
    bag.push(i);
  }
  for (let i = bag.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    const t = bag[i]; bag[i] = bag[j]; bag[j] = t;
  }
  woodKnifeBag = bag;
}

/* индекс раскладки в WOOD_KNIVES; -1 — уровень босса (ножи не наши) */
function woodKnifePickAt(level) {
  const l = Math.max(1, level | 0);
  for (let i = woodKnifePicks.length + 1; i <= l; i++) {
    if (i <= WOOD_KNIFE_LEARN) {
      woodKnifePicks.push(i - 1);
      continue;
    }
    if (isBoss(i)) {
      woodKnifePicks.push(-1);
      continue;
    }
    if (!woodKnifeBag.length) refillWoodKnifeBag();
    woodKnifePicks.push(woodKnifeBag.pop());
  }
  const i = woodKnifePicks[l - 1];
  return i == null ? -1 : i;
}

function woodKnifeAt(level) {
  const i = woodKnifePickAt(level);
  if (i < 0 || i >= WOOD_KNIVES.length) return WOOD_KNIVES[0];
  return WOOD_KNIVES[i];
}

/* сколько ножей торчит в бревне на этом уровне */
function knifeCountAt(level) {
  return woodKnifeAt(level).count | 0;
}

/* Раскладка ножей больше не режет запас бревна — поле hp в WOOD_KNIVES
   оставлено для совместимости, в woodHpFor не входит. */
function woodKnifeHp(level) {
  return 0;
}

function resetWoodKnives() {
  woodKnifePicks.length = 0;
  woodKnifeBag = [];
}

/* ---------- яблоки на бревне ----------
   Яблоки — валюта забега. Снаружи кромки, впритык к бревну (внутренний край
   на видимой кромке). Общий случай — центр на (1 + APPLE_BODY · APPLE_TOUCH) · r,
   но у фото-спилов и фото-боссов радиус уточняет appleRrAt по профилю рисунка:
   иначе яблоко висело в воздухе над прозрачным полем файла. Угол — appleRelsAt;
   не в ноже. За одно подобранное в кошелёк — APPLE_VALUE. */
const APPLE_VALUE = 2;                       /* столько яблок в кошелёк за обычное */
/* ---------- золотое и алмазное яблоки ----------
   Спавнятся ВМЕСТО обычного: золотое с шансом 5 %, алмазное — 1 %. Дают больше
   в кошелёк: золотое ×5 (10 яблок), алмазное ×10 (20 яблок) от обычного.
   Шанс бросается на каждое яблоко отдельно, при раскладке (appleRelsAt). */
const APPLE_GOLD_ODDS = 5;                   /* % на золотое вместо обычного */
const APPLE_DIAMOND_ODDS = 1;                /* % на алмазное вместо обычного */
const APPLE_KIND_MUL = { plain: 1, gold: 5, diamond: 10 };

function rollAppleKind() {
  const r = Math.random() * 100;
  if (r < APPLE_DIAMOND_ODDS) return "diamond";
  if (r < APPLE_DIAMOND_ODDS + APPLE_GOLD_ODDS) return "gold";
  return "plain";
}
const APPLE_ODDS = [0.44, 0.29, 0.2, 0.07];  /* доли для 0, 1, 2 и 3 яблок */
const APPLE_BODY = 0.25;                     /* полуразмер спрайта, доля радиуса бревна */
/* APPLE_SPR_FIT (js/wood.js) — доля полуразмера, которой рисунок достаёт внутрь.
   Раньше тут стояло 0.78 «на глаз», и яблоко висело с зазором в 4-6 px: теперь
   число берётся из самой геометрии спрайта, и низ долей ложится ровно на
   кромку — яблоко прижато к бревну. */
const APPLE_TOUCH = APPLE_SPR_FIT;
const APPLE_R_OUT = 1 + APPLE_BODY * APPLE_TOUCH;
const APPLE_CLEAR = 0;
/* Пределы радиуса для проверок раскладки. Верхний предел выше APPLE_R_OUT:
   у фото-боссов видимая кромка (мишень, пирог) выходит за круг r, и appleRrAt
   сажает яблоко на неё. */
const APPLE_R_LO = 0.7;
const APPLE_R_HI = 1.3;
const APPLE_HIT = 1.55;                      /* хитбокс шире рисунка */
/* Полуширина яблока в радианах — та же формула, что в подборе (js/hit.js:
   appleHalf). Зазоры раскладки меряются ею, поэтому при уменьшении яблока
   (APPLE_BODY 0.25 вместо 0.30) они ужимаются сами: жёсткие числа пришлось бы
   сводить вручную, а несведённые мерили старое яблоко и оставляли на кромке
   лишние щели. */
const APPLE_HALF = Math.atan2(APPLE_BODY * APPLE_HIT, 1);
const APPLE_KNIFE_GAP = APPLE_HALF * 1.75;   /* мин. угол до ножа (нож+яблоко+запас) */
const APPLE_SELF_GAP = APPLE_HALF * 2.2;     /* мин. угол между яблоками (две ширины) */
/* Запас раскладки идёт чуть плотнее основного шага, но НЕ ближе двух полуширин:
   иначе два яблока сходятся теснее, чем видно хитбокс (плохо читается и ловит
   два яблока одним ножом) */
const APPLE_SELF_FALLBACK = APPLE_HALF * 2.02;
const APPLE_SPOT_STEPS = 256;                /* шаг обхода круга в запасе раскладки */

/* сколько яблок висит на бревне этого уровня */
function appleCountAt(level) {
  const l = Math.max(1, level | 0);
  if (isBoss(l)) return 0;
  const r = hash(l * 7.13, 3.7);
  let acc = 0;
  for (let i = 0; i < APPLE_ODDS.length; i++) {
    acc += APPLE_ODDS[i];
    if (r < acc) return i;
  }
  return APPLE_ODDS.length - 1;
}

/* ---------- яблоки на боссах ----------
   Раскладка нарисована руками: она одинаковая при каждой встрече с боссом, без
   случайных проб. Яблоки есть только там, где кромка ровная и это читается по
   смыслу: сердце, мишень, чучело, конфета, яблочный пирог, помидор и тарелка.
   У остальных яблок нет вовсе — щит, кокос, пила, пончик, шина, монета, пицца
   со своими колышками и прочие кольца/шипы съедают кромку, и яблоко на них
   висело бы в воздухе или поверх шипа.

   Углы — в тех же rel, что у ножей: 0 — вправо, -PI/2 — вверх.
     heart  — два яблока на верхних долях, между двумя ножами (см. ниже);
     target — восемь яблок по кругу через 45°, как призовые кольца мишени;
     egg    — пять яблок на нижней половине: правый бок, низ, левый бок;
     dummy  — два яблока на шляпе, между тремя ножами, торчащими из макушки;
     candy  — шесть яблок по кругу через 60°;
     pie    — три яблока-начинки через равные промежутки по кромке;
     tomato — четыре штуки одной кучкой над зелёной шапкой (см. ниже).

   Пункт плана — либо просто угол, либо объект:
     rel — угол;
     rr  — насколько далеко от центра (доля радиуса бревна, по умолчанию
           APPLE_R_OUT — впритык к кромке);
     gap — свой минимальный шаг до соседнего яблока (по умолчанию
           APPLE_SELF_GAP), нужен только тесным кучкам. */
/* Помидор: плодоножка и листья лежат в photo-спрайте сверху (-PI/2). Четыре
   яблока стоят венком над зелёной шапкой на радиусе APPLE_R_OUT — том же, что
   у обычных яблок на бревне: внутренний край ложится ровно на кромку, в тело
   помидора яблоки не утопают. Ровный ряд (общая высота при разном выносе)
   пробовали — на повороте бревна он читался косой ниткой яблок; дуга на одном
   радиусе повторяет кромку и при любом угле поворота остаётся сверху.
   Ножей у помидора нет (BOSS_KNIVES в bosses.js), так что венок ничего не
   сбивает: все четыре стоят всегда. */
const TOMATO_APPLE_R = APPLE_R_OUT;
/* Сдвиги по дуге: внутренние яблоки ближе к плодоножке, крайние — к плечам.
   Шаг 0.44 рад при ширине яблока ~0.36 рад: между соседями видимый зазор,
   впритык они не сходятся. */
const TOMATO_APPLE_NEAR = 0.22;
const TOMATO_APPLE_FAR = 0.66;
/* Зазор проверки: меньше шага (0.44), но больше ширины яблока (0.36), чтобы
   раскладка не могла снова слить соседей. */
const TOMATO_APPLE_GAP = 0.40;
const TOMATO_APPLES = [
  { rel: -Math.PI / 2 - TOMATO_APPLE_FAR, rr: TOMATO_APPLE_R, gap: TOMATO_APPLE_GAP },
  { rel: -Math.PI / 2 - TOMATO_APPLE_NEAR, rr: TOMATO_APPLE_R, gap: TOMATO_APPLE_GAP },
  { rel: -Math.PI / 2 + TOMATO_APPLE_NEAR, rr: TOMATO_APPLE_R, gap: TOMATO_APPLE_GAP },
  { rel: -Math.PI / 2 + TOMATO_APPLE_FAR, rr: TOMATO_APPLE_R, gap: TOMATO_APPLE_GAP }
];

/* Мишень: восемь яблок по кругу — по одному на каждые 45°.
   Шаг ровно PI/4, а свой gap берём чуть меньше шага: общий APPLE_SELF_GAP
   (0.81 радиана) ШИРЕ 45° (0.785) и выкинул бы половину яблок. Тела при этом
   не липнут: центры соседей на кольце радиуса APPLE_R_OUT разведены почти на
   радиус бревна (2 · rr · sin 22.5° ≈ 0.94), а полуширина яблока — 0.25.
   Ножей у мишени нет (BOSS_KNIVES в bosses.js), поэтому проверка на нож
   ничего не срезает: все восемь стоят всегда. */
const TARGET_APPLE_STEP = Math.PI / 4;
const TARGET_APPLE_GAP = TARGET_APPLE_STEP * 0.98;
const TARGET_APPLES = [
  { rel: 0, gap: TARGET_APPLE_GAP },
  { rel: TARGET_APPLE_STEP, gap: TARGET_APPLE_GAP },
  { rel: TARGET_APPLE_STEP * 2, gap: TARGET_APPLE_GAP },
  { rel: TARGET_APPLE_STEP * 3, gap: TARGET_APPLE_GAP },
  { rel: TARGET_APPLE_STEP * 4, gap: TARGET_APPLE_GAP },
  { rel: TARGET_APPLE_STEP * 5, gap: TARGET_APPLE_GAP },
  { rel: TARGET_APPLE_STEP * 6, gap: TARGET_APPLE_GAP },
  { rel: TARGET_APPLE_STEP * 7, gap: TARGET_APPLE_GAP }
];

/* Яйцо: пять яблок на НИЖНЕЙ половине — от правого бока через низ к левому.
   Шаг 36°, поэтому gap свой, чуть меньше шага: общий APPLE_SELF_GAP (0.81) шире
   36° и оставил бы через одно. Тела при этом не липнут: центры соседей на
   кольце радиуса APPLE_R_OUT разведены на 2 · rr · sin 18° ≈ 0.75 радиуса при
   полуширине яблока 0.25. Ножей у яйца нет (BOSS_KNIVES в bosses.js), так что
   все пять стоят всегда. */
const EGG_APPLE_STEP = Math.PI / 5;          /* 36° между соседними яблоками */
const EGG_APPLE_GAP = EGG_APPLE_STEP * 0.95;
const EGG_APPLES = [];
for (let i = 0; i < 5; i++) {
  /* 18° правый бок, 54°, 90° низ, 126°, 162° левый бок */
  EGG_APPLES.push({ rel: EGG_APPLE_STEP * (i + 0.5), gap: EGG_APPLE_GAP });
}

/* Чучело: два яблока на шляпе, ровно между тремя ножами, которые торчат из
   макушки (bossKnifeRels в js/hit.js: -PI/2 ± 0.60). Свой gap: яблоки стоят
   через 0.60 рад, а общий APPLE_SELF_GAP (0.81) выкинул бы одно. Свой kgap:
   до ближайшего ножа 0.30 рад, общий APPLE_KNIFE_GAP (0.65) тоже не пустил бы. */
const DUMMY_APPLES = [
  { rel: -Math.PI / 2 - 0.30, gap: 0.50, kgap: 0.25 },
  { rel: -Math.PI / 2 + 0.30, gap: 0.50, kgap: 0.25 }
];

/* Тарелка: восемь ножей через 45°, яблоки — ровно между ними, по одному в
   каждый зазор. Общие APPLE_KNIFE_GAP (37°) и APPLE_SELF_GAP (47°) тут шире
   самих зазоров, поэтому у плана свои: до ножа 20.25° (а до него ровно 22.5°),
   между яблоками 40.5° (а стоят они через 45°). */
const PLATE_KNIFE_PITCH = TWO_PI / 8;
const PLATE_APPLES = [];
for (let i = 0; i < 8; i++) {
  PLATE_APPLES.push({
    rel: PLATE_KNIFE_PITCH * (i + 0.5),
    gap: PLATE_KNIFE_PITCH * 0.9,
    kgap: PLATE_KNIFE_PITCH * 0.45
  });
}

/* Сердце: чужих ножей ровно два, и стоят они строго друг напротив друга — на 0
   и PI (BOSS_KNIVES.heart в bosses.js), то есть на самых широких плечах. Яблоки
   поэтому встают на верхние доли: rel = -PI/2 ± 0.55, по 31.5° от макушки.
   Сердце процедурное, силуэт задаёт HEART_FIT (js/wood.js): на этих углах
   кромка проходит примерно на 0.82 r, а на макушке — всего на 0.30 r (там
   выемка, и яблоко по общему APPLE_R_OUT висело бы в воздухе). Поэтому
   rr = 1.00 вместо APPLE_R_OUT: внутренний край яблока садится ровно на долю.
   До ножей от яблока ~58°, а общие APPLE_KNIFE_GAP (37°) и APPLE_SELF_GAP (47°)
   такие углы держат и без своего gap — оба яблока стоят всегда. */
const HEART_APPLE_OFF = 0.55;                 /* 31.5° от макушки — верхние доли */
const HEART_APPLE_R = 1.0;                    /* кромка доли 0.82 r + полтела яблока */
const HEART_APPLES = [
  { rel: -Math.PI / 2 - HEART_APPLE_OFF, rr: HEART_APPLE_R },
  { rel: -Math.PI / 2 + HEART_APPLE_OFF, rr: HEART_APPLE_R }
];

/* Карамель: шесть яблок ровным кольцом через 60°, начиная с правой верхней
   четверти. Ножей у неё нет (BOSS_KNIVES в bosses.js), поэтому стоят все шесть. */
const CANDY_APPLES = [];
for (let i = 0; i < 6; i++) CANDY_APPLES.push(Math.PI * 0.15 + i * Math.PI / 3);

const BOSS_APPLES = {
  heart: HEART_APPLES,
  target: TARGET_APPLES,
  egg: EGG_APPLES,
  dummy: DUMMY_APPLES,
  candy: CANDY_APPLES,
  pie: [Math.PI / 2, Math.PI / 2 + (2 * Math.PI) / 3, Math.PI / 2 + (4 * Math.PI) / 3],
  tomato: TOMATO_APPLES,
  plate: PLATE_APPLES
};

/* Углы ножей из раскладки (без случайного сдвига). Для тестов / превью.
   В игре placeLogApples передаёт реальные game.stuck — у ножей ещё off. */
function appleKnifeBlocks(level) {
  const out = [];
  if (typeof woodKnifeAt !== "function" || typeof woodKnifeRels !== "function") return out;
  const layout = woodKnifeAt(level);
  if (!layout) return out;
  const rels = woodKnifeRels(layout.id);
  if (!rels) return out;
  for (let i = 0; i < rels.length; i++) out.push(rels[i]);
  return out;
}

function appleTooClose(rel, list, gap) {
  for (let i = 0; i < list.length; i++) {
    const other = typeof list[i] === "number" ? list[i] : list[i].rel;
    if (angAbs(rel, other) < gap) return true;
  }
  return false;
}

function appleMinDist(rel, list) {
  let best = 99;
  for (let i = 0; i < list.length; i++) {
    const other = typeof list[i] === "number" ? list[i] : list[i].rel;
    const d = angAbs(rel, other);
    if (d < best) best = d;
  }
  return best;
}

/* Яблоко на яйце: силуэт не круг, поэтому радиус берём из EGG_FIT по углу —
   иначе яблоки на узких боках висят в воздухе. Внутренний край ложится на
   кромку яйца, как у обычного яблока на кромке бревна. */
function eggAppleR(rel) {
  if (typeof EGG_FIT !== "object" || !EGG_FIT.lut) return APPLE_R_OUT;
  const N = EGG_FIT.lut.length;
  let a = ((rel % TWO_PI) + TWO_PI) % TWO_PI;
  const q = EGG_FIT.lut[Math.floor((a / TWO_PI) * N) % N] || 1;
  return q + APPLE_BODY * APPLE_SPR_FIT;
}

/* ---------- яблоко садится на ВИДИМУЮ кромку ----------
   APPLE_R_OUT считает кромку идеальным кругом радиуса r. Но фото-спилы и
   фото-боссы вписаны в квадрат с прозрачными полями, а силуэты (яйцо, сердце,
   помидорные листья) вообще не круг. Из-за этого яблоко по общему радиусу
   висело в воздухе на 2–12 px: заказчик увидел «яблоки немного в воздухе».
   Здесь снимаем с готовой текстуры профиль кромки — 360 лучей из центра — и
   для каждого угла ставим яблоко впритык к рисунку. Профиль кэшируется на сам
   канвас, поэтому чтение пикселей идёт один раз за игру. Нечитаемый канвас
   (например, в тестах без картинок) просто оставляет прежний радиус. */
const APPLE_RIM_RAYS = 360;
const APPLE_RIM_STEP = 0.5;
const APPLE_RIM_ALPHA = 40;   /* та же граница альфы, что у сборки спрайтов */
const APPLE_RIM_GAP = 3;      /* усик/блик через прозрачную щель — не кромка */
const appleRimCache = new WeakMap();
/* Служебное полотно для чтения пикселей: CPU-полотно (willReadFrequently) —
   getImageData с него дешёвый, а с обычного (GPU) полотна это синхронная
   выгрузка, на телефоне десятки миллисекунд на текстуру. */
let appleRimScan = null;

/* Прогрев профилей кромки для ВСЕХ брёвен за заставкой: первый appleRelsAt на
   новой породе читает пиксели текстуры (getImageData + обход лучей) — на
   телефоне это заметный рывок ровно в старте уровня. Считаем один раз на
   старте, дальше значения берутся из кэша. */
function prewarmAppleRims() {
  const woods = typeof assets !== "undefined" && assets && assets.woods;
  if (!woods) return;
  for (let i = 0; i < woods.length; i++) {
    if (woods[i]) appleRimProfile(woods[i]);
  }
}

function appleRimProfile(canvas) {
  if (!canvas || !(canvas.width > 0) || !(canvas.height > 0)) return null;
  const cached = appleRimCache.get(canvas);
  if (cached !== undefined) return cached;
  /* Читаем УМЕНЬШЕННУЮ копию: getImageData с полноразмерного полотна — это
     синхронная выгрузка из GPU, на телефоне она стоит десятки миллисекунд
     (первый уровень на новой породе заметно дёргался). Кромке хватает
     256 px: точность профиля — доли пикселя радиуса. */
  const sw = canvas.width | 0;
  const sh = canvas.height | 0;
  const N = 256;
  const k = N / Math.max(sw, sh);
  const w = Math.max(8, Math.round(sw * k));
  const h = Math.max(8, Math.round(sh * k));
  let data = null;
  if (!appleRimScan) appleRimScan = document.createElement("canvas");
  if (appleRimScan.width !== w || appleRimScan.height !== h) {
    appleRimScan.width = w;
    appleRimScan.height = h;
  }
  try {
    const sg = appleRimScan.getContext("2d", { willReadFrequently: true });
    sg.setTransform(1, 0, 0, 1, 0, 0);
    sg.globalAlpha = 1;
    sg.globalCompositeOperation = "source-over";
    sg.clearRect(0, 0, w, h);
    sg.imageSmoothingEnabled = true;
    sg.imageSmoothingQuality = "low";
    sg.drawImage(canvas, 0, 0, w, h);
    data = sg.getImageData(0, 0, w, h).data;
  } catch (e) {
    data = null;
  }
  if (!data || !data.length) {
    appleRimCache.set(canvas, null);
    return null;
  }
  const cx = (w - 1) * 0.5;
  const cy = (h - 1) * 0.5;
  const half = w * 0.5;
  const maxR = Math.hypot(w, h) * 0.5;
  const prof = new Float32Array(APPLE_RIM_RAYS);
  let good = 0;
  for (let i = 0; i < APPLE_RIM_RAYS; i++) {
    const a = (i / APPLE_RIM_RAYS) * TWO_PI;
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    let edge = 0;
    let gap = 0;
    for (let d = 0; d <= maxR; d += APPLE_RIM_STEP) {
      const x = Math.round(cx + dx * d);
      const y = Math.round(cy + dy * d);
      if (x < 0 || y < 0 || x >= w || y >= h) break;
      if (data[(y * w + x) * 4 + 3] >= APPLE_RIM_ALPHA) {
        edge = d;
        gap = 0;
      } else {
        gap += APPLE_RIM_STEP;
        if (gap > APPLE_RIM_GAP) break;
      }
    }
    prof[i] = edge / half;
    if (edge > 0) good++;
  }
  if (!good) {
    appleRimCache.set(canvas, null);
    return null;
  }
  appleRimCache.set(canvas, prof);
  return prof;
}

function appleRimAt(prof, rel) {
  if (!prof) return 0;
  const a = ((rel % TWO_PI) + TWO_PI) % TWO_PI;
  const f = (a / TWO_PI) * APPLE_RIM_RAYS;
  const i0 = Math.floor(f) % APPLE_RIM_RAYS;
  const i1 = (i0 + 1) % APPLE_RIM_RAYS;
  const t = f - Math.floor(f);
  return prof[i0] * (1 - t) + prof[i1] * t;
}

/* Во сколько раз текстура шире радиуса бревна при отрисовке (draw-stuck.js:
   drawLogContents / draw-log.js: drawLog). */
function appleTexScale(boss) {
  if (!boss) return 1;
  if (boss.id === "helm") return 1 / HELM_RIM;
  if (typeof bossPhotoIsSprite === "function" && bossPhotoIsSprite(boss.id) &&
      typeof bossHasPhoto === "function" && bossHasPhoto(boss.id)) return BOSS_PHOTO_OVER;
  return 1;
}

/* Радиус центра яблока, при котором его внутренний край лежит на видимой
   кромке. fallback — прежний радиус, если текстуру измерить не удалось. */
function appleRrAt(rel, fallback) {
  const log = typeof game !== "undefined" ? game.log : null;
  let prof = null;
  let scale = 1;
  if (log && log.boss) {
    const tex = typeof bossTex === "function" ? bossTex(log.boss.id) : null;
    if (tex) {
      prof = appleRimProfile(tex);
      scale = appleTexScale(log.boss);
    }
  } else if (log) {
    const wood = typeof assets !== "undefined" && assets.woods ? assets.woods[game.theme] : null;
    if (wood) prof = appleRimProfile(wood);
  }
  const rim = appleRimAt(prof, rel) * scale;
  if (!(rim > 0.2 && rim < 2)) return fallback;
  return rim + APPLE_BODY * APPLE_TOUCH;
}

/* Раскладка: снаружи кромки, не в ноже и не друг на друге.
   knifeRels — фактические углы ножей (после off). Нет — берём схему раскладки. */
function appleRelsAt(level, knifeRels) {
  const l = Math.max(1, level | 0);
  const rels = [];
  /* Босс: рисунок из BOSS_APPLES, случайных проб нет вовсе. Яблоко, которому
     не хватило места из-за реально торчащего ножа, просто не ставим — рисунок
     важнее количества, а на кромке босса ножи стоят кучно. Схему ножей
     (appleKnifeBlocks) тут не подмешиваем: она про брёвна, у босса сдвиг свой. */
  if (isBoss(l)) {
    const log = game.log;
    const boss = (log && log.boss) || (typeof bossFor === "function" ? bossFor(l) : null);
    const plan = boss ? BOSS_APPLES[boss.id] : null;
    if (!plan) return rels;
    const blocked = knifeRels && knifeRels.length ? knifeRels : [];
    for (let i = 0; i < plan.length; i++) {
      /* пункт плана — угол или объект {rel, rr, gap} (тесная кучка помидора) */
      const item = plan[i];
      const angle = typeof item === "number" ? item : item.rel;
      const rel = (((isFinite(angle) ? angle : 0) % TWO_PI) + TWO_PI) % TWO_PI;
      let rr = typeof item !== "number" && item.rr > 0 ? item.rr : APPLE_R_OUT;
      if (boss && boss.id === "egg") rr = eggAppleR(rel);
      const gap = typeof item !== "number" && item.gap > 0 ? item.gap : APPLE_SELF_GAP;
      /* у тесных планов (яблоки тарелки между ножами) свой зазор до ножа */
      const kgap = typeof item !== "number" && item.kgap > 0 ? item.kgap : APPLE_KNIFE_GAP;
      if (appleTooClose(rel, blocked, kgap)) continue;
      if (appleTooClose(rel, rels, gap)) continue;
      /* сажаем на видимый силуэт босса, а не на идеальный круг r */
      rr = appleRrAt(rel, rr);
      rels.push({ rel: rel, rr: rr, kind: rollAppleKind() });
    }
    return rels;
  }
  const n = appleCountAt(l);
  if (n <= 0) return rels;
  const blocked = knifeRels && knifeRels.length ? knifeRels : appleKnifeBlocks(l);
  const knifeGap = APPLE_KNIFE_GAP;
  for (let i = 0; i < n; i++) {
    let placed = false;
    for (let attempt = 0; attempt < 48; attempt++) {
      const rel = (hash(l * 3.31 + i * 17.9 + attempt * 5.7, 11.2) * TWO_PI) % TWO_PI;
      if (appleTooClose(rel, blocked, knifeGap)) continue;
      if (appleTooClose(rel, rels, APPLE_SELF_GAP)) continue;
      rels.push({ rel: rel, rr: appleRrAt(rel, APPLE_R_OUT), kind: rollAppleKind() });
      placed = true;
      break;
    }
    /* запас: место под яблоко есть, а случайные пробы его пропустили (ножей
       на кромке много) — идём по кругу мелким шагом и берём самое свободное
       место. Шаг 1/APPLE_SPOT_STEPS круга мельче любого зазора, поэтому если
       место есть, оно найдётся: прежде на трёх брёвнах из четырёхсот третье
       яблоко не вставало вовсе. */
    if (!placed) {
      let best = null;
      let bestScore = -1;
      const step = TWO_PI / APPLE_SPOT_STEPS;
      const phase = hash(l * 9.1 + i * 13.3, 4.4) * TWO_PI;
      for (let k = 0; k < APPLE_SPOT_STEPS; k++) {
        const rel = (phase + k * step) % TWO_PI;
        if (appleTooClose(rel, rels, APPLE_SELF_FALLBACK)) continue;
        const score = blocked.length ? appleMinDist(rel, blocked) : 99;
        if (score < knifeGap) continue;
        if (score > bestScore) {
          bestScore = score;
          best = rel;
        }
      }
      if (best != null) rels.push({ rel: best, rr: appleRrAt(best, APPLE_R_OUT), kind: rollAppleKind() });
    }
  }
  return rels;
}

/* Текущий шанс группы 2 (редкий / легендарный / тайный). Живёт на game,
   между забегами не сбрасывается — как чёрный список боссов. */
function bossGroup2Chance() {
  const v = game.bossGroup2Pct;
  if (typeof v === "number" && isFinite(v)) return Math.max(0, Math.min(100, v));
  return BOSS_GROUP2_BASE;
}

function setBossGroup2Chance(pct) {
  game.bossGroup2Pct = Math.max(0, Math.min(100, pct));
}

function bossGroup2Dry() {
  const v = game.bossGroup2Dry;
  return typeof v === "number" && isFinite(v) && v > 0 ? (v | 0) : 0;
}

function setBossGroup2Dry(n) {
  game.bossGroup2Dry = Math.max(0, n | 0);
}

function bumpBossGroup2Chance() {
  const lo = BOSS_GROUP2_BUMP_MIN;
  const hi = BOSS_GROUP2_BUMP_MAX;
  const bump = lo + Math.random() * (hi - lo);
  setBossGroup2Chance(bossGroup2Chance() + bump);
}

/* ---------- гарантия верхних полос ----------
   Веса — лотерея: за десятки боссов подряд легендарка могла не выпасть ни
   разу, и игрок честно считал, что их нет. Поэтому ведутся две сухие серии — по
   легендарным и по тайным. Дошла до порога — полоса приходит принудительно,
   веса уже ничего не решают. Если на этом номере босса в окне нет такой
   полосы, долг НЕ обнуляется: ждём ближайшего номера, где она есть.
   Счётчики живут в game и переживают смерть, а не обнуляются каждым забегом. */
/* Пороги гарантии подняты вместе с редкостью полос: при делении 4 : 2 : 1
   редкий выпадает примерно раз в 11 боссов, легендарный — раз в 22, тайный —
   раз в 44. Порог стоит примерно втрое дальше среднего ожидания: он ловит
   только затяжную засуху (около 4 % случаев) и не подменяет базовое 2 : 1. */
const BOSS_LEGEND_DRY_MAX = 64;
const BOSS_SECRET_DRY_MAX = 128;

function bossDryOf(field) {
  const v = game[field];
  return typeof v === "number" && isFinite(v) && v > 0 ? (v | 0) : 0;
}

function setBossDry(field, n) {
  game[field] = Math.max(0, n | 0);
}

function bossTopDry() { return bossDryOf("bossLegendDry"); }
function setBossTopDry(n) { setBossDry("bossLegendDry", n); }
function bossSecretDry() { return bossDryOf("bossSecretDry"); }
function setBossSecretDry(n) { setBossDry("bossSecretDry", n); }

/* Полосы группы 2, у которых на этом номере есть босс в окне. */
function group2TiersFor(ord) {
  const out = [];
  for (let i = 0; i < BOSS_TIERS.length; i++) {
    const t = BOSS_TIERS[i];
    if (t.id === "common") continue;
    if (bossPoolFor(t.id, ord).length) out.push(t);
  }
  return out;
}

/* Сначала группа 1 vs группа 2; внутри группы 2 — только полосы с боссами в окне. */
function rollBossGroup2Tier(ord) {
  const tiers = group2TiersFor(ord);
  if (!tiers.length) return null;
  let total = 0;
  for (let i = 0; i < tiers.length; i++) total += tiers[i].weight;
  if (!(total > 0)) return tiers[0].id;
  let r = Math.random() * total;
  for (let i = 0; i < tiers.length; i++) {
    r -= tiers[i].weight;
    if (r < 0) return tiers[i].id;
  }
  return tiers[tiers.length - 1].id;
}

function rollBossTier(ord) {
  /* новичку — только обычные: редкие, легендарные и тайные открываются после
     BOSS_GROUP2_UNLOCK побед над боссами (bossGroup2Unlocked) */
  if (!bossGroup2Unlocked()) return "common";
  const g2 = group2TiersFor(ord);
  if (!g2.length) return "common";
  /* Гарантии верхних полос: слишком долго без легендарного/тайного — полоса
     приходит принудительно, веса её уже не могут «замотать» */
  if (bossTopDry() >= BOSS_LEGEND_DRY_MAX) {
    if (bossPoolFor("legend", ord).length) return "legend";
    if (bossPoolFor("secret", ord).length) return "secret";
  }
  if (bossSecretDry() >= BOSS_SECRET_DRY_MAX) {
    if (bossPoolFor("secret", ord).length) return "secret";
    if (bossPoolFor("legend", ord).length) return "legend";
  }
  let chance = bossGroup2Chance();
  /* Засуха: после долгой серии обычных шанс резко растёт, но гарантии нет.
     Раньше здесь стоял жёсткий 100 % — из-за него группа 2 падала строго на
     9-м, 18-м, 27-м боссе. Теперь каждый бросок — рандом. */
  const dry = bossGroup2Dry();
  if (dry >= BOSS_GROUP2_FORCE_AFTER) {
    const steps = dry - BOSS_GROUP2_FORCE_AFTER + 1;
    const surge = BOSS_GROUP2_SURGE_MIN +
      Math.random() * (BOSS_GROUP2_SURGE_MAX - BOSS_GROUP2_SURGE_MIN);
    chance = Math.min(BOSS_GROUP2_SURGE_CAP, chance + steps * surge);
  }
  /* Первые BOSS_RARE_FROM_RUN − 1 забегов — только обычные боссы. Гейт по
     забегам работает ТОЛЬКО до открытия группы 2 по победам: иначе игрок,
     который в первом же забеге дошёл до 300-го уровня (60 побед над боссами),
     до конца забега видел одних обычных — редкости уже открыты победами, а
     счётчик забегов их всё ещё блокировал. */
  if ((stats.runs | 0) < BOSS_RARE_FROM_RUN && (stats.bosses | 0) < BOSS_GROUP2_UNLOCK) return "common";
  if (Math.random() * 100 >= (bossRareHunt() ? Math.min(100, chance * 2) : chance)) return "common";
  return rollBossGroup2Tier(ord) || "common";
}

/* После выбора: обычный — pity вверх; группа 2 — сброс шанса и сухого стрика. */
function noteBossGroupRoll(boss) {
  if (!boss) return;
  if (!bossGroup2Unlocked()) {
    /* до открытия группы 2 pity не копим: иначе к десятой победе шанс уже стоял
       бы под потолком и первый же босс после открытия был бы редким */
    setBossGroup2Chance(BOSS_GROUP2_BASE);
    setBossGroup2Dry(0);
    return;
  }
  if (bossTierOf(boss) === "common") {
    bumpBossGroup2Chance();
    setBossGroup2Dry(bossGroup2Dry() + 1);
  } else {
    setBossGroup2Chance(BOSS_GROUP2_BASE);
    setBossGroup2Dry(0);
  }
  /* Сухие серии по полосам: редкий не сбрасывает ни одну из них */
  const tier = bossTierOf(boss);
  if (tier === "legend") setBossTopDry(0); else setBossTopDry(bossTopDry() + 1);
  if (tier === "secret") setBossSecretDry(0); else setBossSecretDry(bossSecretDry() + 1);
}

/* Окно «С БОССА»…«ПО»: номер босса в забеге (1 = 5-й уровень, 2 = 10-й…).
   ПО = 0 — без верхнего предела. Жёсткий фильтр для всех боссов одинаково:
   босс с окном 1–1 на 6-м боссе не выпадает никогда. */
function bossInWindow(boss, ord) {
  const w = bossWindowOf(boss);
  const from = Math.max(1, w[1] | 0);
  const to = Math.max(0, w[2] | 0);
  if (ord < from) return false;
  if (to && ord > to) return false;
  return true;
}

function bossPoolFor(tier, ord) {
  const out = [];
  for (let i = 0; i < BOSSES.length; i++) {
    const b = BOSSES[i];
    if (bossTierOf(b) !== tier) continue;
    if (!bossInWindow(b, ord)) continue;
    out.push(b);
  }
  return out;
}

function bossesInWindow(ord) {
  const out = [];
  for (let i = 0; i < BOSSES.length; i++) {
    if (bossInWindow(BOSSES[i], ord)) out.push(BOSSES[i]);
  }
  return out;
}

/* Если у выпавшей редкости на этом номере нет ни одного босса
   (например, легендарных ещё не открыли) — опускаемся на ступень ниже:
   тайный -> легендарный -> редкий -> обычный. */
/* ---------- мешок боссов: без повторов на одном месте ----------
   У каждого номера босса (1-й, 2-й, …) и каждой редкости свой мешок. Выпавший
   босс из мешка вынимается и вернётся только когда мешок опустеет: сыграл
   столько забегов, сколько обычных боссов доступно на 1-м месте — все они
   были разными, следующий забег начнёт круг заново. Мешок лежит в
   localStorage: смерть, новый забег и перезагрузка страницы его не сбрасывают. */
const BOSS_BAG_KEY = "bh_boss_bag";
let bossBagCache = null;
/* Генератор боссов крутит свой временный мешок и не должен писать его в сейв */
let bossBagMute = false;

function bossBagAll() {
  if (bossBagCache) return bossBagCache;
  let raw = null;
  try {
    raw = JSON.parse(localStorage.getItem(BOSS_BAG_KEY) || "null");
  } catch (err) {
    raw = null;
  }
  bossBagCache = raw && typeof raw === "object" ? raw : {};
  return bossBagCache;
}

function bossBagKey(tier, ord) {
  return tier + "@" + (ord | 0);
}

function bossBagList(tier, ord) {
  const all = bossBagAll();
  const k = bossBagKey(tier, ord);
  if (!Array.isArray(all[k])) all[k] = [];
  return all[k];
}

function bossBagFlush() {
  if (bossBagMute) return;
  try {
    localStorage.setItem(BOSS_BAG_KEY, JSON.stringify(bossBagAll()));
  } catch (err) {}
}

/* Запоминаем выпавшего; когда в мешке побывали все боссы пула этого места —
   мешок пустеет, и следующий забег начнёт круг заново */
function bossBagTake(boss, ord) {
  if (!boss) return;
  const tier = bossTierOf(boss);
  const bag = bossBagList(tier, ord);
  if (bag.indexOf(boss.id) < 0) bag.push(boss.id);
  const pool = bossPoolFor(tier, ord);
  let full = pool.length > 0;
  for (let i = 0; i < pool.length && full; i++) {
    if (bag.indexOf(pool[i].id) < 0) full = false;
  }
  if (full) bag.length = 0;
  bossBagFlush();
}

function bossBlocked(boss, ord) {
  if (!boss) return false;
  return bossBagList(bossTierOf(boss), ord).indexOf(boss.id) >= 0;
}

/* Полный сброс мешка: кнопка «с нуля» и генератор боссов */
function bossBagReset() {
  bossBagCache = {};
  bossBagFlush();
  /* вместе с мешком сбрасываем и «охоту за редкостью» */
  bossRareReset();
}

/* ---------- охота за редкостью ----------
   Первые 4 забега игрок видит только обычных боссов. Дальше редкие,
   легендарные и тайные уже могут падать, и до первого такого босса их шанс
   вдвое выше базового: охота заканчивается на первой же редкости. Флаг лежит
   в localStorage, поэтому смерть и перезагрузка его не сбрасывают. */
const BOSS_RARE_SEEN_KEY = "bh_boss_rare_seen";
const BOSS_RARE_FROM_RUN = 5;

function bossRareSeen() {
  try { return localStorage.getItem(BOSS_RARE_SEEN_KEY) === "1"; } catch (err) { return false; }
}

function bossRareHunt() {
  return !bossRareSeen();
}

function bossRareFound() {
  try { localStorage.setItem(BOSS_RARE_SEEN_KEY, "1"); } catch (err) {}
}

function bossRareReset() {
  try { localStorage.removeItem(BOSS_RARE_SEEN_KEY); } catch (err) {}
}

/* Редкого босса надо именно ПОБЕДИТЬ: пока он лишь выпал и убил игрока, охота
   продолжается и шанс остаётся удвоенным. Зовётся из js/flow.js: levelCleared */
function bossRareWin() {
  /* демка: победа в просмотре не должна открывать охоту за редкостью */
  if (typeof window !== "undefined" && window.__BH_REPLAY_ACTIVE) return;
  const boss = game.log && game.log.boss;
  if (!boss) return;
  if (bossTierOf(boss) === "common") return;
  bossRareFound();
}

/* Сколько бросков босса прошло без этого id. Чем дольше не падал —
   тем тяжелее его вес в пуле (умный рандом). Окно всё равно жёсткое. */
function bossMissMap() {
  if (!game.bossMiss) game.bossMiss = {};
  return game.bossMiss;
}

function bossMissOf(id) {
  const v = bossMissMap()[id];
  return typeof v === "number" && isFinite(v) && v > 0 ? v : 0;
}

function bossSmartWeight(boss) {
  const m = bossMissOf(boss.id);
  /* Чем дольше не падал — тем сильнее тянет. Квадрат растёт быстро. */
  return 1 + m * (m + 1) * 0.2;
}

function noteBossMiss(picked) {
  const map = bossMissMap();
  for (let i = 0; i < BOSSES.length; i++) {
    const id = BOSSES[i].id;
    map[id] = (bossMissOf(id) | 0) + 1;
  }
  if (picked) map[picked.id] = 0;
}

function pickOpen(pool, ord) {
  const open = [];
  for (let i = 0; i < pool.length; i++) if (!bossBlocked(pool[i], ord)) open.push(pool[i]);
  return open;
}

function pickWeightedBoss(pool) {
  if (!pool || !pool.length) return null;
  let total = 0;
  for (let i = 0; i < pool.length; i++) total += bossSmartWeight(pool[i]);
  if (!(total > 0)) return pool[(Math.random() * pool.length) | 0];
  let r = Math.random() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= bossSmartWeight(pool[i]);
    if (r < 0) return pool[i];
  }
  return pool[pool.length - 1];
}

function finishBossPick(boss, ord) {
  bossBagTake(boss, ord);
  noteBossMiss(boss);
  noteBossGroupRoll(boss);
  return boss;
}

function pickFromTierPool(tier, ord) {
  const pool = bossPoolFor(tier, ord);
  if (!pool.length) return null;
  const open = pickOpen(pool, ord);
  return pickWeightedBoss(open.length ? open : pool);
}

function pickBossFor(ord) {
  ord = Math.max(1, ord | 0);
  const rolled = rollBossTier(ord);
  const wantGroup2 = rolled !== "common";

  if (wantGroup2) {
    /* Группа 2: падаем только по редкий → легенда → тайный? Нет — от
       выпавшей полосы вниз по группе 2, без обычных. */
    let i = BOSS_TIERS.findIndex(t => t.id === rolled);
    if (i < 0) i = BOSS_TIERS.length - 1;
    for (; i >= 0; i--) {
      if (BOSS_TIERS[i].id === "common") continue;
      const boss = pickFromTierPool(BOSS_TIERS[i].id, ord);
      if (boss) return finishBossPick(boss, ord);
    }
  }

  /* Обычный (или группа 2 пуста — не должно, но на всякий). */
  let boss = pickFromTierPool("common", ord);
  if (boss) return finishBossPick(boss, ord);

  /* Запас: любой босс в окне, с умным весом. */
  const any = bossesInWindow(ord);
  const open = pickOpen(any.length ? any : BOSSES, ord);
  boss = pickWeightedBoss(open.length ? open : (any.length ? any : BOSSES));
  return finishBossPick(boss, ord);
}

let bossPick = { level: -1, boss: null };

function resetBossPick() {
  bossPick.level = -1;
  bossPick.boss = null;
  /* мешок не трогаем: он живёт в localStorage, и после смерти тот же босс
     на том же месте не должен выпасть снова, пока в пуле есть кого взять */
  game.compassPat = null;
}

function defaultStep(level) {
  if (level > 0 && level % STAGE_LEN === 0) {
    const b = bossFor(level);
    return { t: "boss", id: (b || BOSSES[0]).id };
  }
  return { t: "wood", id: stageWoodAt(stageFor(level)) };
}

function isBoss(level) {
  const step = stepAt(level);
  if (step) return step.t === "boss";
  return level > 0 && level % STAGE_LEN === 0;
}

function bossFor(level) {
  const step = stepAt(level);
  if (step) {
    if (step.t !== "boss") return null;
    return BOSSES.find(b => b.id === step.id) || null;
  }
  if (!(level > 0 && level % STAGE_LEN === 0)) return null;
  if (bossPick.level === level) return bossPick.boss;
  bossPick.boss = pickBossFor(Math.floor(level / STAGE_LEN));
  bossPick.level = level;
  if (bossPick.boss && bossPick.boss.id === "compass") sealCompass(level);
  return bossPick.boss;
}

function bossesCleared(level) {
  const n = Math.max(0, ((level || 1) - 1) | 0);
  if (!usingSeq()) return Math.floor(n / STAGE_LEN);
  const seq = save.seq;
  let per = 0;
  for (let i = 0; i < seq.length; i++) if (seq[i].t === "boss") per++;
  const full = Math.floor(n / seq.length);
  let count = full * per;
  const rem = n % seq.length;
  for (let i = 0; i < rem; i++) if (seq[i].t === "boss") count++;
  return count;
}

function themeIndexFor(level) {
  const step = stepAt(level);
  if (step && step.t === "wood") {
    const id = step.id | 0;
    /* разноцветное и в своей ленте меняет вид на каждом бревне */
    return isRainbowWood(id) ? rainbowWoodAt(level) : id;
  }
  if (usingSeq()) {
    /* своя лента: породы идут по кругу ТОЖЕ по шести (а не по одиннадцати,
       иначе разноцветное снова выпадало бы в 6 раз чаще) */
    const kind = WOOD_KINDS[((level | 0) - 1) % WOOD_KINDS.length];
    return isRainbowWood(kind) ? rainbowWoodAt(level) : kind;
  }
  const stage = stageFor(level);
  /* Разноцветное дерево стадией не держится: на каждое бревно свой вариант */
  if (isRainbowWood(stageWoodAt(stage))) return rainbowWoodAt(level);
  return stageWoodAt(stage);
}

/* Ножи, которые выбиваются с босса: его собственный (id совпадает с id босса),
   дополнительные из карточки — knifeExtra в js/bosses.js — и ВСЕ ножи, у которых
   в скине записан boss: "<id>" (мечи боссов из images/knifes/bosses,
   js/knife-skins.js: BOSS_SWORD_ROWS). Список без повторов. */
function bossKnifeIds(boss) {
  const out = [boss.id];
  const extra = boss.knifeExtra;
  if (extra && extra.length) {
    for (let i = 0; i < extra.length; i++) if (out.indexOf(extra[i]) < 0) out.push(extra[i]);
  }
  for (let i = 0; i < KNIFE_SKINS.length; i++) {
    const skin = KNIFE_SKINS[i];
    if (skin.boss === boss.id && out.indexOf(skin.id) < 0) out.push(skin.id);
  }
  return out;
}

function grantBossKnife(boss) {
  /* демка: победа над боссом в просмотре не выдаёт нож админу */
  if (typeof window !== "undefined" && window.__BH_REPLAY_ACTIVE) return false;
  if (!boss || boss.knife === false) return false;
  const ids = bossKnifeIds(boss);
  let got = false;
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    if (save.owned.includes(id)) continue;
    /* нож выбивают только те боссы, у которых он есть: у СЫРА (cheese) скина нет,
       и раньше ему выдавалась пустая карточка «НОВЫЙ НОЖ» без картинки */
    if (!KNIFE_SKINS.some(s => s.id === id)) continue;
    save.owned.push(id);
    /* тоста сверху больше нет: нож встаёт в очередь и покажется окном только на
       итоге забега, когда игрок проиграет (js/knife-unlock.js) */
    queueKnifeUnlock(boss, id);
    got = true;
  }
  if (!got) return false;
  persist();
  loadoutSnap = "";
  syncHud();
  return true;
}

/* ---------- запас уровня ----------
   Бревно стартует с LOG_HP (8) и растёт +1 за каждого побеждённого босса,
   но не больше WOOD_HP_GROW — потолок базы 16, с узором выходит около 15–17.
   Узор уровня добавляет от −1 до +1 ножа (WOOD_HP_BONUS ниже).
   Раскладка ножей в бревне на запас НЕ влияет — только картинка кромки.
   Босс от стадии не зависит вовсе: запас у него свой, из карточки
   (BOSSES[].hp), а у кого не записан — BOSS_HP. Ни ножей, ни хода, ни размера
   стадия боссу не добавляет. */
/* Запас бревна зависит ещё и от узора: чем проще кручение (бревно идёт неспешно,
   ровно и без разворотов), тем больше ножей оно держит — по такому бревну
   попадать легко, и запаса на нём больше; чем злее кручение (быстрые ходы и
   обманки с разворотом), тем меньше ножей — сложный ход сам наказывает за
   промах, добирать ножи на нём незачем. Порядок узоров — WOOD_SCRIPTS
   (boss-spin.js), стадия задаёт общую рамку. */
const WOOD_HP_GROW = 8;
const WOOD_HP_BONUS = [
   1,   /* 0: оборот с остановкой — самое простое: один неспешный ход и пауза на прицел */
   0,   /* 1: короткий и длинный ход в одну сторону — ровно, но без паузы */
   1,   /* 2: долгий неспешный оборот — самое простое ровное кручение */
  -1,   /* 3: короткий ход и длинный на полной — быстрое, злое кручение */
  -1,   /* 4: обманка: оборот туда, пауза, такой же назад */
  -1,   /* 5: обманка: два коротких хода и длинный */
  -1,   /* 6: обманка: короткий ход против часовой и длинный обратно */
   0    /* 7: ровное кручение — ход ровный, но бодрый: обычная середина */
];

function woodHpFor(level) {
  const n = bossesCleared(level);
  return LOG_HP + Math.min(WOOD_HP_GROW, n) + woodHpBonus(level);
}

/* добавка за узор уровня: узор закреплён за уровнем (woodPatternAt), поэтому
   перезапуск уровня идёт с тем же запасом, а следующий уровень — уже со своим */
function woodHpBonus(level) {
  const b = WOOD_HP_BONUS[woodPatternAt(level)];
  return typeof b === "number" ? b : 0;
}

function maxHpFor(level) {
  const boss = bossFor(level);
  if (boss) return boss.hp || BOSS_HP;
  return woodHpFor(level);
}

