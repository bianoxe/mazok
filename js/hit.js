function dummyRayFar(ang) {
  const cs = Math.cos(ang);
  const sn = Math.sin(ang);
  let far = 0;
  const dc = DUMMY_DOME_C;
  const dr = DUMMY_DOME_R;
  const disc = dc * dc * sn * sn - (dc * dc - dr * dr);
  if (disc >= 0) {
    const s = Math.sqrt(disc);
    const b = dc * sn;
    const t1 = -b + s;
    const t2 = -b - s;
    if (t1 > far) far = t1;
    if (t2 > far) far = t2;
  }
  const bc = DUMMY_BRIM_C;
  const rx = DUMMY_BRIM_RX;
  const ry = DUMMY_BRIM_RY;
  const A = (cs * cs) / (rx * rx) + (sn * sn) / (ry * ry);
  const B = (2 * bc * sn) / (ry * ry);
  const C = (bc * bc) / (ry * ry) - 1;
  const discE = B * B - 4 * A * C;
  if (A > 1e-8 && discE >= 0) {
    const s = Math.sqrt(discE);
    const t1 = (-B + s) / (2 * A);
    const t2 = (-B - s) / (2 * A);
    if (t1 > far) far = t1;
    if (t2 > far) far = t2;
  }
  return far;
}

function dummyMetalMul(ang) {
  const t = dummyRayFar(ang);
  return t > 1 ? t : 1;
}

function dummyCapHit(ang) {
  return angAbs(ang, DUMMY_CAP_ANG) <= DUMMY_CAP_HALF;
}

function surfaceRadius(id, ang, r) {
  r = r || game.log.r;
  /* Фото-спрайт: силуэт задаёт файл, из кода его не померить, поэтому кромка под
     ножом — идеальный круг, как у бревна. Так нож всегда входит на одну глубину,
     с какого бы угла босс ни подставился и как бы ни был повёрнут.
     Раньше правило было только у щита, и тыква с помидором жили по силуэту
     процедурного рисунка: тыква уходила по долькам (0.9 + 0.08·cos8a), хотя
     на экране её фото — нож садился то глубже, то мельче на каждом броске. */
  if (bossHasPhoto(id)) return r;
  /* чучело: шапка торчит за кромку и держит нож на своей высоте — но только
     пока цела. Снесли шапку (dummyHatOn в boss-spin.js) — верх открыт, и кромка
     там обычная, как у бревна: нож входит на ту же глубину */
  if (id === "dummy") {
    const hatOn = typeof dummyHatOn === "function" ? dummyHatOn() : true;
    return hatOn ? r * dummyMetalMul(ang) : r;
  }
  if (id === "heart" || id === "egg" || id === "aegis") {
    const lut = id === "egg" ? EGG_FIT.lut : id === "aegis" ? AEGIS_FIT.lut : HEART_FIT.lut;
    const N = lut.length;
    let a = ((ang % TWO_PI) + TWO_PI) % TWO_PI;
    const f = a / TWO_PI * N;
    const i = Math.floor(f) % N;
    const t = f - Math.floor(f);
    return r * (lut[i] * (1 - t) + lut[(i + 1) % N] * t);
  }
  /* Тыква без файла рисуется процедурно (pathPumpkin) — там кромка идёт по
     долькам, поэтому хитбокс повторяет рисунок, иначе нож висел бы мимо корки. */
  if (id === "pumpkin") {
    const wr = r * (0.9 + 0.08 * Math.cos(ang * 8) + 0.02 * Math.sin(ang * 3));
    return Math.hypot(Math.cos(ang) * wr, Math.sin(ang) * wr * 0.96);
  }
  /* кокос: где кусок скорлупы отвалился, кромка ушла вглубь ровно на её толщину —
     там мякоть, и нож входит в неё; где скорлупа цела, кромка общая с диском.
     Пока кусков нет (кокос ещё не заведён), кромка тоже общая */
  if (id === "coconut") {
    const plate = coconutPlateAt(ang);
    return plate && plate.hp <= 0 ? r * (1 - COCONUT_SHELL) : r;
  }
  /* шарик: силуэт описан полярно, поэтому кромка берётся ровно, без таблицы */
  if (id === "balloon") return r * balloonRadiusMul(ang);
  /* шестерёнка: хитбокс — идеальный круг, как у бревна и большинства боссов.
     Зубья только в рисунке (pathGear), к ножу не лезут. */
  return r;
}

/* Угол, под которым нож входит в бревно: снизу (π/2) — нож летит из руки
   вверх. */
function hitRel() {
  return Math.PI / 2 - game.log.angle;
}

function hitSurfR() {
  return surfaceRadius(game.log.boss && game.log.boss.id, hitRel(), game.log.r);
}

function minGap() {
  return hitLim() * 2 + 0.03;
}

/* ---------- как глубоко нож садится в босса ----------
   Под кромку уходит KNIFE_SINK длины клинка, а над кромкой остаётся видно
   1 − KNIFE_SINK клинка (10%): лезвие из тела лишь чуть выглядывает.
   Прежде под кромку уходил ВЕСЬ клинок (KNIFE_BLADE_END): нож стоял по самую
   гарду, и над кромкой торчала одна рукоять — лезвия не было видно вовсе.
   Заказчик: «сделай так, чтобы они втыкались не целиком лезвием, а чтобы лезвие
   немного было видно». Промежуточная посадка 0.55 (лезвие видно 45%) ему не
   понравилась — «пусть меньше выпирает», поэтому клинок сидит в теле глубже.
   Потом попросили ещё чуть глубже: 0.93. Теперь — чуть менее глубоко: 0.90.
   Острие и теперь держится в теле босса: KNIFE_SINK · KNIFE_BLADE_END вглубь —
   даже с самым тесным запасом (cap ниже) до центра диска ему далеко.
   Число одно на все ножи и на всех боссов, поэтому посадка видна всем одинаково
   (проверка — tools/_knife_sink_check.js). */
const KNIFE_SINK = 0.90;

function bladeEmbed(rad, id) {
  const depth = knifeH * (KNIFE_BLADE_END / KNIFE_SRC_H) * KNIFE_SINK;
  if (!(rad > 0)) return depth;
  let cap = rad * 0.9;
  /* пончик: нож входит ровно так же, как в бревно, — на KNIFE_SINK клинка
     (жалоба: «в пончик ножи не до конца втыкаются, надо как в бревне»). Если
     острие уходит в дырку глубже толщины кольца, в самой дырке нож не рисуется:
     при посадке ножей дырка вырезается (draw-knife.js: clipPunchHole — всё
     полотно минус дырка), поэтому над кромкой видно ровно то же, что у бревна, —
     лезвие да рукоять. Раньше здесь стояла урезка до 0.7 кольца, и нож сидел
     мельче бревна. */
  /* Тело у всех боссов одинаковое для посадки ножа: раньше шина, пирог и
     спасательный круг резали глубину своим «толстым телом», и клинок в шине
     торчал заметно выше, чем в бревне. Теперь посадка одна на всех (просьба
     заказчика), общий предел 0.9 радиуса остаётся — острие не выходит насквозь */
  return Math.min(depth, cap);
}

function knifeMetrics(surfR) {
  const [kw, kh] = knifeSize();
  const base = game.log.r * (game.log.scale || 1);
  const r = surfR != null ? surfR : base;
  const embed = bladeEmbed(r, game.log.boss && game.log.boss.id);
  return { kw, kh, r, embed, inner: r - embed, outer: r - embed + kh * 0.84, half: Math.max(5, kw * 0.46) };
}

/* ---------- хитбокс ножа ----------
   Он один на все ножи: и у классического, и у мачете — одна и та же полоса.
   Ширина взята от размера ножа на экране (knifeSize), а не от рисунка клинка:
   клинки разной формы, а удар у всех одинаковый (про это и спрашивал заказчик).
   Сверху — предел по запасу боссов: у мишени и кокоса по двадцать ножей, и круг
   обязан вмещать хотя бы KNIFE_SLOTS_MIN из них, иначе последний нож в круг не
   влезет и босса не добить. Предел: atan2(half, r) <= π / слотов.
   hitLim(true) — та же полуширина, но без урезки: ею меряется кучка пончика
   (knifeWidth ниже), потому что гарду с рукоятью видно вдвое шире острия. */
const KNIFE_HIT = 46;                  /* полуширина острия, в пикселях сходника */
const KNIFE_SLOTS_MIN = 21;            /* столько ножей обязано влезать в круг */

function hitLim(raw) {
  const [kw] = knifeSize();
  const r = Math.max(24, game.log.r);
  let half = Math.max(3, kw * (KNIFE_HIT / KNIFE_SRC_W));
  if (!raw) {
    const cap = r * Math.tan(Math.PI / KNIFE_SLOTS_MIN);
    if (half > cap) half = cap;
  }
  return Math.atan2(half, r);
}

/* ---------- видимая ширина ножа ----------
   Нож виден шире, чем бьёт: по бокам торчат рожки гарды (±48 пикселей сходника,
   makeKnife в knife.js), да ещё и у самой кромки — нож садится в босса на
   KNIFE_SINK клинка (bladeEmbed), так что над кромкой стоят и лезвие, и гарда.
   Полуширина этой видимой части — та же
   полоса острия, но без урезки под запас боссов (hitLim(true)): урезка нужна
   двадцатке у мишени и кокоса, а видимой рукояти дела нет.
   Выйдет в пределах процента от нарисованной гарды: рожки на 48 сходника, а
   полоса — на 46, зато гарда сидит чуть дальше от оси и дуга выходит та же.
   ЭТО ПОЛНАЯ ШИРИНА — вдвое больше полосы удара. Ею меряется ЗАЗОР кучки
   пончика (bossKnifeRels): между рукоятями соседних ножей кучки на глаз должны
   лечь ровно два таких ножа. А полоса удара у чужого ножа кучки — видимая
   ПОЛОВИНА (hitLim(true), см. handleHitAt): взять за полосу всю ширину значит
   отбивать нож игрока там, где на глаз ещё чисто. */
function knifeWidth() {
  return hitLim(true) * 2;
}

function pizzaHazardAt(ang) {
  if (!game.log.boss || game.log.boss.id !== "pizza") return null;
  const slot = TWO_PI / PIZZA_SLICES;
  for (let i = 0; i < PIZZA_HAZ.length; i++) {
    const hz = PIZZA_HAZ[i];
    /* Полуширина зоны — по ширине самого кола НА КРОМКЕ (bosses.js:
       pizzaStakeHalf), а не долей ломтя: иначе нож ломался в конце ломтя, где
       на пицце чисто. Воткнутая часть метки спрятана под рисунком пиццы
       (js/draw-log.js: колья ложатся до текстуры), поэтому зона меряется ровно
       тем, что торчит из-под корки */
    const half = pizzaStakeHalf(hz.kind);
    for (let u = 0; u < PIZZA_STAKE_AT.length; u++) {
      if (angAbs(ang, (hz.slice + PIZZA_STAKE_AT[u]) * slot) < half) return hz;
    }
  }
  return null;
}

function targetHazardAt(ang) {
  if (!game.log.boss || game.log.boss.id !== "target") return null;
  if (angAbs(ang, TARGET_ARROW) < TARGET_ARROW_HALF) return { kind: "arrow" };
  return null;
}

function pizzaBreakLine(hz) {
  return hz && hz.kind === "olive" ? "нож сломался об оливку" : "нож сломался о вилку";
}

/* Полоса рукояти застрявшего ножа. Чужой нож пончика меряется видимой
   ПОЛОВИНОЙ (hitLim(true)), а не всей видимой шириной (knifeWidth): нож видно
   вдвое шире, чем он бьёт, и брать за полосу всю ширину — значит отбивать нож
   игрока в двух полосах острия от рукояти, то есть там, где на глаз чисто
   (жалоба: «хитбокс этих ножей больше, чем нарисовано»). Половинка видимой
   ширины — ровно рисунок: рожки гарды на 48 пикселей сходника, полоса — на 46,
   дуга выходит та же. Свои ножи у игрока везде по одной полосе острия, и нож
   бота в дуэли (js/mode1v1.js) — ровно такой же нож, значит и полоса у него та
   же; k.scale остаётся запасом на случай, если его когда-нибудь уменьшат. */
function stuckHalf(k) {
  const log = game.log;
  const lim = hitLim();
  const boss = log.boss && (log.boss.id === "donut" || log.boss.id === "cheese") ? hitLim(true) : lim;
  const scale = k.scale > 0 ? k.scale : 1;
  const own = !!k.player;
  return (own ? lim : boss) * scale;
}

function handleHitAt(tipY) {
  const log = game.log;
  const surf = hitSurfR();
  const m = knifeMetrics(surf);
  const far = tipY - log.y;
  if (far > m.outer + 10 || far < m.inner - 16) return false;
  for (const k of game.stuck) {
    if (angAbs(k.rel + log.angle, Math.PI / 2) < stuckHalf(k)) return true;
  }
  return false;
}

/* Число из bosses.js; нет его (файл приехал из кэша старым) — берём запасное.
   Запасные ровно те, что стоят в bosses.js: кучка пончика обязана собраться
   при любом раскладе файлов. */
function donutNum(v, def) {
  return typeof v === "number" && isFinite(v) ? v : def;
}

/* ---------- яблоко под ножом ----------
   Яблоки снаружи кромки (APPLE_R_OUT). Подбор по углу hitRel: нож проходит
   под яблоком на кромке. Полуширина от тела × APPLE_HIT у радиуса 1. */
function appleHalf(a) {
  const body = APPLE_BODY * (typeof APPLE_HIT === "number" ? APPLE_HIT : 1);
  return Math.atan2(body, 1);
}

/* Яблоко под лезвием. Берём БЛИЖАЙШЕЕ, а не первое по списку: когда яблок
   много (у мишени восемь, у яйца пять), в допуск ±appleHalf попадают сразу два
   соседних, и «первое в списке» сбивало не то яблоко, которое под ножом. */
function logAppleAt(rel) {
  const list = game.logApples;
  if (!list || !list.length) return null;
  let best = null;
  let bestD = 1e9;
  for (let i = 0; i < list.length; i++) {
    const a = list[i];
    if (a.taken) continue;
    const d = angAbs(a.rel, rel);
    if (d >= appleHalf(a)) continue;
    if (d < bestD) {
      bestD = d;
      best = a;
    }
  }
  return best;
}

/* ВСЕ яблоки под лезвием. Один нож может пересечь сразу несколько яблок —
   у помидора они лежат кучкой вплотную, у мишени и яйца соседи тоже попадают
   в общий допуск, — и каждое из них обязано попасть в кошелёк. Раньше брали
   только ближайшее (logAppleAt), и остальные висели под тем же ножом, будто
   удар их не заметил. */
function logApplesAt(rel) {
  /* в демке яблоки снимаются по записанным событиям, а не физикой полёта:
     иначе из-за округления угла одно яблоко могло сняться дважды */
  if (typeof window !== "undefined" && window.__BH_REPLAY_ACTIVE) return [];
  const list = game.logApples;
  const out = [];
  if (!list || !list.length) return out;
  for (let i = 0; i < list.length; i++) {
    const a = list[i];
    if (a.taken) continue;
    if (angAbs(a.rel, rel) >= appleHalf(a)) continue;
    out.push(a);
  }
  return out;
}

/* ---------- где стоит чужой нож ----------
   У шины, пирога и щита — ровная сетка (BOSS_KNIVES): шесть, восемь и пять
   ножей через равные промежутки; у пирога линии этой сетки ещё и место
   остановки, см. knifeGridPitch в boss-spin.js. Пончик в сетку не входит: его
   три ножа стоят кучкой, а ход у него и так ровный — вставать под ножом
   ему не надо.

   Зазор кучки меряется ВИДИМОЙ шириной ножа (knifeWidth), а не полосой острия:
   между рукоятями соседних ножей кучки на глаз должен остаться зазор МЕНЬШЕ
   одного ножа игрока — тогда кучка читается одним местом, а не полкой на два
   ножа. Зазор = DONUT_KNIFE_GAP видимых ножей плюс DONUT_KNIFE_SLACK полос
   острия; прежние числа (два видимых ножа и 1.8 полосы) оставляли между
   соседними видимый зазор почти в два ножа игрока. Нож игрока между соседними
   всё равно встаёт — удар чужого ножа меряется углом, а не полосой, — но встаёт
   впритык, заходя картиной на рукояти. Полоса удара у чужого ножа кучки при этом
   остаётся видимой ПОЛОВИНОЙ (hitLim(true), см. handleHitAt): движок принимает
   всё, чему на глаз есть место. */
/* Зазор кучки: им собирается и кучка пончика, и кучки на бревне (ниже), —
   кучка на бревне обязана читаться так же, как на пончике. */
function knifeClusterRels(n, phase) {
  const vis = donutNum(DONUT_KNIFE_GAP, 1.2);
  const slack = donutNum(DONUT_KNIFE_SLACK, 1.1);
  let gap = knifeWidth() * vis + hitLim() * slack;
  if (!isFinite(gap) || gap <= 0) gap = knifeWidth() * 2 + hitLim() * 1.8;
  const first = phase - ((n - 1) * gap) / 2;
  const rels = [];
  for (let i = 0; i < n; i++) rels.push(first + i * gap);
  return rels;
}

function bossKnifeRels(id) {
  /* сыр носит ту же кучку, что пончик: три ножа, тот же зазор и та же фаза
     (DONUT_KNIVES в bosses.js) — «паттерн ножей как у пончика» */
  if (id === "donut" || id === "cheese") {
    /* Числа кучки лежат в bosses.js. Браузер иногда отдаёт файлы вразнобой (половина
       из кэша), и тогда здесь вместо числа окажется undefined: зазор уедет в NaN,
       и на пончике не останется ни одного ножа. Поэтому каждое число берём с
       запасом — тем самым, что стоит в bosses.js. */
    const n = donutNum(DONUT_KNIVES, 3);
    const phase = donutNum(DONUT_KNIVES_PHASE, Math.PI);
    return knifeClusterRels(n, phase);
  }
  /* тыква: три ножа через 90° (как trioQuarter у бревна), не ровно по кругу */
  if (id === "pumpkin") return [0, Math.PI / 2, Math.PI];
  /* чучело: три ножа из шляпы, тесной группой на макушке; между ними — яблоки */
  if (id === "dummy") return [-Math.PI / 2 - 0.60, -Math.PI / 2, -Math.PI / 2 + 0.60];
  /* скотч: четыре ножа, но НЕ по кругу. Две пары, в каждой зазор ровно 36°
     (это был шаг тарелки, когда у неё было десять ножей; теперь у тарелки восемь
     и шаг 45°, а у скотча зазор остаётся прежним — он задан своим числом), а сами
     пары стоят друг напротив друга — через 180° */
  if (id === "tape") {
    const step = 36 * Math.PI / 180;
    return [0, step, Math.PI, Math.PI + step];
  }
  const n = BOSS_KNIVES[id] | 0;
  if (n <= 0) return null;
  const step = TWO_PI / n;
  const rels = [];
  for (let i = 0; i < n; i++) rels.push(i * step);
  return rels;
}

/* ---------- раскладка ножей в бревне ----------
   Уровень выбирает раскладку (woodKnifeAt, js/progress.js), а форму задаёт она
   здесь, как и у боссов. Сама раскладка — в bosses.js (WOOD_KNIVES): там только
   число ножей и добавка к запасу, здесь — углы, поэтому кучки на бревне собраны
   тем же зазором, что и кучка пончика (knifeClusterRels).

   Раскладки:
     empty        — вовсе без ножей;
     single       — один нож;
     donut        — три ножа кучкой (как пончик);
     row3         — три ножа ровно по кругу, через 120°;
     cluster2     — два ножа кучкой;
     cluster2x2   — две кучки по два, друг напротив друга (четыре ножа);
     pairQuarter  — два ножа через четверть круга (90°);
     pairOpposite — два ножа друг напротив друга (180°);
     trioQuarter  — три ножа через четверть круга (90°).
   Незнакомая раскладка (файл приехал из кэша старым) — без ножей. */
function woodKnifeRels(id) {
  const phase = donutNum(DONUT_KNIVES_PHASE, Math.PI);
  if (id === "empty") return [];
  if (id === "single") return [Math.PI * 0.5];
  if (id === "donut") return knifeClusterRels(3, phase);
  if (id === "cluster2") return knifeClusterRels(2, phase);
  if (id === "cluster2x2") return knifeClusterRels(2, phase).concat(knifeClusterRels(2, phase + Math.PI));
  if (id === "row3") return [0, TWO_PI / 3, TWO_PI * 2 / 3];
  if (id === "pairQuarter") return [0, Math.PI / 2];
  if (id === "pairOpposite") return [0, Math.PI];
  if (id === "trioQuarter") return [0, Math.PI / 2, Math.PI];
  return null;
}

/* босс со своими ножами: втыкаем их до боя по его раскладке */
function placeBossKnives(boss) {
  const rels = bossKnifeRels(boss.id);
  if (!rels) return false;
  for (let i = 0; i < rels.length; i++) {
    const sk = takeStuck();
    sk.rel = rels[i];
    sk.player = false;
    sk.rad = 1;
    game.stuck.push(sk);
  }
  return true;
}

function placeStartKnives(level) {
  clearStuck();
  const boss = bossFor(level);
  if (boss) {
    placeBossKnives(boss);
    return;
  }
  /* Раскладку ножей задаёт уровень (woodKnifeAt, js/progress.js), а форму —
     woodKnifeRels (выше): три кучкой как у пончика, две друг напротив друга,
     три через четверть круга и так далее. */
  const rels = woodKnifeRels(woodKnifeAt(level).id);
  if (!rels || !rels.length) return;
  /* на всякий случай — прежний запас места: если раскладка не оставит кромки
     под нужные попадания, лучше прийти с пустым бревном, чем с недобиваемым.
     Сейчас так не бывает: ножей в раскладке не больше четырёх, а места хватает
     с запасом. */
  const gap = minGap();
  const slots = Math.max(6, Math.floor(TWO_PI / gap) - 1);
  const hitsNeeded = Math.max(1, Math.ceil((game.log.maxHp || LOG_HP) / knifeDamage()));
  if (rels.length > Math.max(0, slots - hitsNeeded)) return;
  /* всю раскладку чуть поворачиваем, чтобы уровни не были близнецами */
  const off = rand(0, TWO_PI);
  for (let i = 0; i < rels.length; i++) {
    const sk = takeStuck();
    sk.rel = off + rels[i];
    sk.player = false;
    sk.rad = 1;
    game.stuck.push(sk);
  }
}

