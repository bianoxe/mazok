/* ---------- статистика игрока ----------
   Копим всё, что видно в листе «Статистика» (кнопка 📊 в доке меню): яблоки
   за всю игру, боссы по редкости, броски ножей, попадания в рукоять, потери
   жизней, смерти и забеги. Живёт отдельным ключом localStorage, поэтому сброс
   прогресса (js/input.js: resetProgress) обнуляет и её, а сейв яблок и ножей
   от неё не зависит. */
const STATS_KEY = "bh_stats";
/* Сколько кликов по полю новичок делает с подсказкой «Нажмите, чтобы играть».
   Дальше подсказка молчит: игрок уже понял, что играть — это тап по экрану. */
const HINT_CLICKS = 5;

function statInt(v) {
  const n = Math.floor(+v);
  return n > 0 ? n : 0;
}

/* Демка проигрывается настоящим движком на том же профиле админа. Любые
   записи статистики на это время запрещены, иначе просмотр демки испортил бы
   статистику и рекорд владельца админки. */
function statsFrozen() {
  return typeof window !== "undefined" && !!window.__BH_REPLAY_ACTIVE;
}

function statDefaults() {
  return {
    apples: 0,
    bosses: 0,
    tiers: { common: 0, rare: 0, legend: 0, secret: 0 },
    bossesById: {},
    knives: 0,
    sticks: 0,
    handles: 0,
    livesLost: 0,
    deaths: 0,
    runs: 0,
    clicks: 0
  };
}

function loadStats() {
  const out = statDefaults();
  let raw = null;
  try {
    raw = JSON.parse(localStorage.getItem(STATS_KEY) || "null");
  } catch (err) {
    raw = null;
  }
  if (!raw || typeof raw !== "object") return out;
  out.apples = statInt(raw.apples);
  out.bosses = statInt(raw.bosses);
  out.knives = statInt(raw.knives);
  out.sticks = statInt(raw.sticks);
  out.handles = statInt(raw.handles);
  out.livesLost = statInt(raw.livesLost);
  out.deaths = statInt(raw.deaths);
  out.runs = statInt(raw.runs);
  out.clicks = statInt(raw.clicks);
  const tiers = raw.tiers && typeof raw.tiers === "object" ? raw.tiers : {};
  for (const id in out.tiers) out.tiers[id] = statInt(tiers[id]);
  const byId = raw.bossesById && typeof raw.bossesById === "object" ? raw.bossesById : {};
  for (const id in byId) out.bossesById[id] = statInt(byId[id]);
  return out;
}

const stats = loadStats();
/* Кто уже играл до появления статистики, новичком не считается: подсказку
   «Нажмите, чтобы играть» второй раз ему не показываем */
if (!stats.clicks && (save.best > 0 || (game.apples | 0) > 0)) stats.clicks = HINT_CLICKS;
let statsTimer = 0;
let statLastJson = "";

function persistStats() {
  if (statsFrozen()) return;
  if (statsTimer) {
    clearTimeout(statsTimer);
    statsTimer = 0;
  }
  try {
    const json = JSON.stringify(stats);
    /* localStorage — синхронная запись на диск. На телефоне она бывает
       несколько миллисекунд, поэтому не пишем одно и то же и не пишем на
       каждый бросок: одинаковый JSON пропускаем. */
    if (json === statLastJson) return;
    statLastJson = json;
    localStorage.setItem(STATS_KEY, json);
    if (typeof yxDirtyMark === "function") yxDirtyMark();
  } catch (err) {}
}

/* Пишем не на каждый бросок: localStorage дёргаем пачкой (js/layout.js: persist
   зовёт persistStats напрямую перед закрытием страницы). Раз в ~2.5 с, и НЕ во
   время боя: синхронная запись на диск в случайном кадре — источник «рандомных»
   микрофризов. В бою только копим; сохраним на смерти/в меню/при сворачивании. */
function persistStatsSoon() {
  if (typeof state !== "undefined" && state === "play") return;
  if (statsTimer) return;
  statsTimer = setTimeout(() => {
    statsTimer = 0;
    persistStats();
  }, 2500);
}

function resetStats() {
  const fresh = statDefaults();
  for (const k in fresh) stats[k] = fresh[k];
  persistStats();
  /* после сброса игрок снова новичок: подсказка возвращается, док снова прячется */
  syncPlayHint();
  uiStageShown = -1;
  applyUiGate();
}

function statRun() {
  if (statsFrozen()) return;
  runBegin();
  stats.runs++;
  persistStatsSoon();
}

function statThrow() {
  if (statsFrozen()) return;
  stats.knives++;
  if (run.on) run.knives++;
  persistStatsSoon();
}

function statStick() {
  if (statsFrozen()) return;
  stats.sticks++;
  if (run.on) run.sticks++;
  persistStatsSoon();
}

function statHandle() {
  if (statsFrozen()) return;
  stats.handles++;
  persistStatsSoon();
}

function statLife() {
  if (statsFrozen()) return;
  stats.livesLost++;
  persistStatsSoon();
}

function statDeath() {
  if (statsFrozen()) return;
  runEnd();
  if (typeof Analytics !== "undefined") Analytics.runEnd("death");
  stats.deaths++;
  /* не пишем localStorage в кадр открытия окна: сохранится через 2.5 с/в меню */
  persistStatsSoon();
}

function statBoss(boss) {
  if (statsFrozen()) return;
  if (!boss) return;
  stats.bosses++;
  if (run.on) run.bosses++;
  const tier = bossTierOf(boss);
  if (stats.tiers[tier] != null) stats.tiers[tier]++;
  const id = boss.id || "";
  if (id) stats.bossesById[id] = (stats.bossesById[id] | 0) + 1;
  /* не пишем в кадр победы: сохранится на смерти/в меню/при сворачивании */
  persistStatsSoon();
}

function statApples(n) {
  if (statsFrozen()) return;
  const v = Math.round(+n);
  if (!(v > 0)) return;
  stats.apples += v;
  if (run.on) run.apples += v;
  persistStatsSoon();
}

/* Клик по полю в меню: считаем попытки, чтобы понять, новичок это или нет */
function statClick() {
  if (statsFrozen()) return;
  stats.clicks++;
  persistStatsSoon();
  syncPlayHint();
}


/* ---------- забег: итог на окне смерти ----------
   Считаем не за всё время, а за один забег: до какого уровня дошёл, сколько
   ножей воткнул, сколько яблок забрал, сколько это заняло и сколько боссов
   добил. Счётчики двигаются в тех же хуках выше (statThrow / statStick /
   statApples / statBoss), старт — statRun, финиш — statDeath. */
const run = { on: false, start: 0, ms: 0, level: 1, knives: 0, sticks: 0, apples: 0, bosses: 0 };

function runBegin() {
  run.on = true;
  run.start = performance.now();
  run.ms = 0;
  run.level = 1;
  run.knives = 0;
  run.sticks = 0;
  run.apples = 0;
  run.bosses = 0;
}

/* Финиш фиксируем ровно в момент смерти: плашка «ПРОИГРЫШ» выезжает позже,
   и её задержка в зачёт времени забега попасть не должна */
function runEnd() {
  if (!run.on) return;
  run.on = false;
  run.ms = Math.max(0, performance.now() - run.start);
  run.level = game.level | 0 || 1;
}

/* Строка на окне смерти — только два числа: сколько ножей набито за этот забег
   и текущий рекорд. Яблоки, время, боссы и уровень со смерти убраны нарочно:
   там остаются только итог раунда и рекорд (index.html: #runStats). */
function runStatsHtml() {
  const knives = game.recordNum | 0;
  const best = save.best | 0;
  const base = game.bestBase | 0;
  const beaten = !!game.bestKnown && best > base;
  /* Рекорд побит — числа «за раунд» и «рекорд» одинаковые: вместо двух плашек
     одно золотое окно с новым рекордом и зачёркнутым старым */
  if (beaten) {
    return '<div class="rs-cell rs-record"><span class="rs-ico">🏆</span>' +
      '<span class="rs-col"><span class="rs-val">' + statNum(knives) +
      '<s class="rs-old">' + statNum(base) + '</s></span>' +
      '<span class="rs-lbl">НОВЫЙ РЕКОРД</span></span></div>';
  }
  return '<div class="rs-cell"><span class="rs-ico">🔪</span>' +
      '<span class="rs-col"><span class="rs-val">' + statNum(knives) + '</span>' +
      '<span class="rs-lbl">НОЖЕЙ ЗА РАУНД</span></span></div>' +
    '<div class="rs-cell"><span class="rs-ico">🏆</span>' +
      '<span class="rs-col"><span class="rs-val">' + statNum(best) + '</span>' +
      '<span class="rs-lbl">РЕКОРД</span></span></div>';
}

/* ---------- лист «Статистика» ----------
   Разметка — те же классы, что у остальных листов (lvl-player), плюс собственные
   stat-* для сетки чисел и строк редкости (css/style.css). */
function statNum(n) {
  return String(Math.max(0, n | 0)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function statKd() {
  const lost = stats.livesLost | 0;
  if (!lost) return stats.sticks ? statNum(stats.sticks) + " : 0" : "—";
  return (Math.round((stats.sticks / lost) * 10) / 10).toFixed(1).replace(".", ",");
}

function statTopBoss() {
  let id = "", best = 0;
  for (const k in stats.bossesById) {
    const c = stats.bossesById[k] | 0;
    if (c > best) {
      best = c;
      id = k;
    }
  }
  if (!id) return null;
  const boss = typeof BOSSES !== "undefined" && BOSSES.length ? BOSSES.find(b => b.id === id) : null;
  return { name: boss ? boss.name : id, n: best };
}

function statCell(val, lbl) {
  return '<div class="stat-cell"><div class="stat-val">' + val + '</div><div class="stat-lbl">' + lbl + '</div></div>';
}

function renderPlayerStats() {
  const acc = stats.knives ? Math.round((stats.sticks / stats.knives) * 100) : 0;
  const top = statTopBoss();
  const bits = [];
  bits.push('<div class="stats-wrap">');
  bits.push('<div class="stats-grid">');
  bits.push(statCell(statNum(stats.apples), "яблок заработано"));
  bits.push(statCell(statNum(stats.runs), "игр сыграно"));
  bits.push(statCell(statNum(stats.bosses), "боссов побеждено"));
  bits.push(statCell(save.best, "рекорд · ножей"));
  bits.push(statCell(statNum(stats.deaths), "смертей"));
  bits.push(statCell(statNum(stats.knives), "ножей брошено"));
  bits.push(statCell(statNum(stats.sticks), "ножей в бревне"));
  bits.push(statCell(statNum(stats.handles), "попаданий в рукоять"));
  bits.push(statCell(statNum(stats.livesLost), "жизней потеряно"));
  bits.push(statCell(statKd(), "к/д"));
  bits.push(statCell(acc + "%", "точность"));
  bits.push(statCell(save.inf ? "∞" : statNum(game.apples), "яблок в кошельке"));
  bits.push(statCell(statNum(save.rubles), "алмазов в кошельке"));
  bits.push("</div>");
  /* Боссы по редкости: цвета те же, что у карточек боссов (js/bosses.js) */
  bits.push('<div class="stats-rows">');
  for (const tier of BOSS_TIERS) {
    bits.push(
      '<div class="stat-row">' +
        '<span class="stat-tier"><i style="background:' + tier.color + '"></i>' + tier.name + '</span>' +
        '<b>' + statNum(stats.tiers[tier.id] | 0) + '</b>' +
      '</div>'
    );
  }
  if (top) {
    bits.push('<div class="stat-row"><span class="stat-tier">ЧАЩЕ ВСЕГО БИЛ</span><b>' + top.name + ' · ' + top.n + '</b></div>');
  }
  bits.push("</div>");
  bits.push('<div class="sheet-note">К/Д — сколько ножей воткнулось в бревно на каждую потерянную жизнь. Жизнь снимает бросок в рукоять (или в опасность на бревне: стрела, олива). Точность — доля бросков, которые сели в бревно. «Яблок заработано» — всё, что упало в кошелёк за всё время, без чит-кнопки.</div>');
  bits.push("</div>");
  return bits.join("");
}

/* Подпись под кнопкой «Играть» живёт только у новичка: как только кликов
   по полю набралось HINT_CLICKS, надпись больше не показываем — остаётся
   сама кнопка, и она всегда понятна */
function syncPlayHint() {
  if (typeof knifeBookTourArm === "function") knifeBookTourArm();
  if (!playHint) return;
  const show = (stats.clicks | 0) < HINT_CLICKS;
  if (playHint.hidden !== !show) playHint.hidden = !show;
}

/* ---------- раскрытие интерфейса ----------
   Гейта по прогрессу больше нет (по требованию заказчика): новичок с первого
   запуска видит ВЕСЬ интерфейс — шапку с яблоками/рекордом/стадией, док с
   ножами, уровнями, боссами, статистикой и генератором, кнопку батлпасса.
   Ступени uiStageNow остались только как справка о прогрессе — по ним больше
   ничего не прячется и тостов «открылось» нет.

   🎁 чит на площадке не показываем никогда: он обнуляет прогрессию. Локально
   и по ?dev=1 виден всегда. ↺ сброс виден всем — это кнопка самого игрока. */
let uiStageShown = -1;

function devUiOn() {
  const host = location.hostname || "";
  if (!host) return true;
  if (host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0" || host === "::1") return true;
  /* ?dev=1 на чужом устройстве больше не открывает чит: сначала нужно получить
     админ-доступ секретным кодом. Иначе любой тестер дописывал ?dev=1 и
     бесплатно открывал VIP-ножи, ломая экономику алмазов. */
  if (/[?&]dev=1(?:&|$)/.test(location.search)) {
    return !!(typeof Analytics !== "undefined" && Analytics.isAdmin && Analytics.isAdmin());
  }
  return false;
}

/* Прогресс для ступеней. Старый сейв без статистики не запираем заново: рекорд
   за 5-м уровнем значит, что первый босс уже пройден, а раз рекорд выше первого
   уровня — игрок точно играл. */
function uiProgress() {
  /* Рекорд теперь в ножах, поэтому старые пороги не годятся: «играл» — любой
     воткнутый нож, «дошёл до босса» — счёт, который на первом уровне столько
     не набрать (15 ножей — это уже бой с боссом за плечами) */
  const best = save.best | 0;
  return {
    runs: Math.max(stats.runs | 0, best > 0 ? 2 : 0),
    bosses: Math.max(stats.bosses | 0, best >= 15 ? 1 : 0)
  };
}

function uiStageNow() {
  const p = uiProgress();
  if (p.bosses >= 1 && p.runs >= 5) return 4;
  if (p.bosses >= 1 && p.runs >= 3) return 3;
  if (p.bosses >= 1 && p.runs >= 2) return 2;
  if (p.runs >= 2) return 1;
  return 0;
}

function uiShow(el, on) {
  if (!el) return;
  const hide = !on;
  if (el.hidden !== hide) el.hidden = hide;
}

function applyUiGate() {
  /* Гейта больше нет: новичок с первого запуска видит весь интерфейс — яблоки,
     рекорд и стадию в шапке, ножи, уровни, боссов, статистику и генератор.
     Прячем только 🎁 чит (он обнуляет прогрессию — вне площадки и по ?dev=1
     виден, как и раньше) и счётчик FPS: игроку он не нужен, это прибор
     разработчика. ↺ сброс виден всем: это кнопка самого игрока. */
  uiStageShown = uiStageNow();
  uiShow(menuStats, true);
  uiShow(loadoutBar, true);
  uiShow(itemsBtn, true);
  uiShow(levelBtn, true);
  uiShow(rewardsBtn, true);
  uiShow(bossesBtn, true);
  uiShow(statsBtn, true);
  uiShow(genBtn, true);
  uiShow(cheatBtn, devUiOn() || (typeof Analytics !== "undefined" && Analytics.isAdmin && Analytics.isAdmin()));
  uiShow(resetBtn, true);
  /* Счётчик FPS виден всегда: сверху текущий кадр, снизу средний за сессию и
     худший за последние 5 секунд (js/frame.js: tickFps). */
  uiShow(fpsChip, true);
}
