/* ---------- редактор боссов (JSON) ----------
   Экран в нижнем листе (как «Уровни»): настройка редкости, окна стадий, запаса
   и цветов боссов. Значения по умолчанию — ровно то, что лежит в js/bosses.js;
   правки применяются в игру сразу, а снизу лежит код (JSON) с кнопкой
   «СКОПИРОВАТЬ»: его отдают тому, кто закрепляет настройки в файлах.

   Как это работает в памяти. Карточки боссов живут в BOSSES, редкости — в
   BOSS_TIERS (weight — шанс в процентах от всех боссов), окна — в BOSS_WINDOWS.
   Редактор читает и пишет ровно их, поэтому игра берёт настройки оттуда же,
   откуда брала: maxHpFor читает BOSSES[].hp, pickBossFor — BOSS_TIERS и
   BOSS_WINDOWS, полоска запаса — bossHpColors. */

/* ЗАКРЕПЛЁННЫЕ настройки: этот конфиг применяется ВСЕГДА и для всех, поверх
   js/bosses.js. Локальный черновик редактора (localStorage) его перекрывает
   только своими правками — «навсегда» значит навсегда.

   Это основной (утверждённый) баланс игры. Числа ниже повторены ещё и в
   BOSS_BASE (js/bosses.js) — там таблица-запасной вариант на случай, если
   карточки в BOSSES нет. Править оба места сразу. */
const BOSS_CONFIG = {
  tiers: [
    { id: "common", name: "ОБЫЧНЫЙ", weight: 92, xp: 50, color: "#cdc6b8" },
    /* Внутри группы 2 — 6,2 : 1,5 : 0,3, то есть примерно 77,5 : 18,75 : 3,75 %. */
    { id: "rare", name: "РЕДКИЙ", weight: 6.2, xp: 150, color: "#ffd23f" },
    { id: "legend", name: "ЛЕГЕНДАРНЫЙ", weight: 1.5, xp: 350, color: "#c07cff" },
    { id: "secret", name: "ТАЙНЫЙ", weight: 0.3, xp: 700, color: "#ff4444" }
  ],
  bosses: [
    { id: "target", name: "МИШЕНЬ", hp: 13, tier: "common", from: 2, to: 2, fill: "#f4f1ea", dark: "#1a1a1a", outline: "#3a2414", glow: "214, 58, 48" },
    { id: "valve", name: "ВЕНТИЛЬ", hp: 26, tier: "rare", from: 3, to: 0, fill: "#8b949e", dark: "#2c343c", outline: "#101418", glow: "156, 166, 176" },
    { id: "tomato", name: "ПОМИДОР", hp: 14, tier: "common", from: 1, to: 1, fill: "#d44532", dark: "#8a1e16", outline: "#5a1810", glow: "210, 56, 40" },
    { id: "heart", name: "СЕРДЦЕ", hp: 14, tier: "common", from: 2, to: 2, fill: "#c41e36", dark: "#7a0c1c", outline: "#4a0810", glow: "196, 24, 48" },
    { id: "marmalade", name: "ЖЕВАЧКА", hp: 14, tier: "common", from: 2, to: 2, fill: "#ff6a9c", dark: "#e03870", outline: "#c43a68", glow: "255, 110, 160" },
    { id: "pumpkin", name: "ТЫКВА", hp: 12, tier: "common", from: 1, to: 1, fill: "#e07018", dark: "#b0400c", outline: "#6a2808", glow: "232, 112, 24" },
    { id: "basketball", name: "БАСКЕТБОЛ", hp: 19, tier: "common", from: 6, to: 0, fill: "#e2710f", dark: "#8f3d06", outline: "#3a1606", glow: "236, 126, 28" },
    { id: "plate", name: "ТАРЕЛКА", hp: 13, tier: "common", from: 6, to: 0, fill: "#f4f9ff", dark: "#c9d8ea", outline: "#4a709e", glow: "120, 176, 235" },
    { id: "tape", name: "СКОТЧ", hp: 13, tier: "common", from: 6, to: 0, fill: "#c9d8e2", dark: "#8aa2b2", outline: "#4a5e6a", glow: "150, 200, 225" },
    { id: "yarn", name: "КЛУБОК", hp: 12, tier: "common", from: 10, to: 0, fill: "#8fc93a", dark: "#4a7318", outline: "#2e4a10", glow: "150, 210, 80" },
    { id: "saw", name: "ПИЛА", hp: 22, tier: "rare", from: 3, to: 0, fill: "#b7c0ca", dark: "#5c6670", outline: "#2a3038", glow: "176, 186, 196" },
    { id: "ball", name: "БИЛЬЯРД", hp: 17, tier: "secret", from: 6, to: 0, fill: "#161616", dark: "#0a0a0a", outline: "#0e0e0e", glow: "232, 210, 160" },
    { id: "pizza", name: "ПИЦЦА", hp: 12, tier: "common", from: 3, to: 3, fill: "#e8b45a", dark: "#8a2818", outline: "#6a3418", glow: "232, 148, 56" },
    { id: "aegis", name: "ЩИТ", hp: 11, tier: "common", from: 3, to: 0, fill: "#a87440", dark: "#3a2414", outline: "#1a140e", glow: "196, 154, 90" },
    { id: "donut", name: "ПОНЧИК", hp: 15, tier: "common", from: 3, to: 3, fill: "#ff4d8d", dark: "#e0943c", outline: "#b86a32", glow: "255, 90, 150" },
    { id: "cheese", name: "СЫР", hp: 10, tier: "common", from: 1, to: 1, fill: "#f7c948", dark: "#c9921f", outline: "#b5811c", glow: "255, 205, 70" },
    { id: "helm", name: "ШТУРВАЛ", hp: 14, tier: "legend", from: 4, to: 0, fill: "#b6834a", dark: "#5c3818", outline: "#3a2412", glow: "184, 132, 72" },
    { id: "coconut", name: "КОКОС", hp: 20, tier: "secret", from: 3, to: 0, fill: "#8a5a32", dark: "#4a2c18", outline: "#2a180e", glow: "196, 140, 72" },
    { id: "egg", name: "ЯЙЦО", hp: 16, tier: "common", from: 5, to: 0, fill: "#f3ead8", dark: "#d7c6a6", outline: "#6e5840", glow: "236, 214, 176" },
    { id: "dummy", name: "ЧУЧЕЛО", hp: 17, tier: "common", from: 3, to: 0, fill: "#c4a36a", dark: "#6b4e32", outline: "#3a2818", glow: "176, 140, 78" },
    { id: "fan", name: "ФЕН", hp: 20, tier: "legend", from: 4, to: 0, fill: "#c9c1b4", dark: "#5c564e", outline: "#2a2622", glow: "214, 148, 86" },
    { id: "candy", name: "КОНФЕТА", hp: 8, tier: "rare", from: 1, to: 1, fill: "#f6e4e0", dark: "#c43a48", outline: "#6e1018", glow: "225, 40, 56" },
    { id: "lifebelt", name: "СПАСАТЕЛЬНЫЙ КРУГ", hp: 16, tier: "rare", from: 3, to: 0, fill: "#e1062c", dark: "#f3eeea", outline: "#6e1020", glow: "225, 36, 52" },
    { id: "pepsi", name: "ПЭПСИ", hp: 15, tier: "rare", from: 1, to: 2, fill: "#1e5ed0", dark: "#0e2c66", outline: "#0a2a6a", glow: "58, 124, 226" },
    { id: "reverse", name: "РЕВЕРС", hp: 16, tier: "rare", from: 3, to: 0, fill: "#3a4048", dark: "#14171b", outline: "#0b0e12", glow: "255, 138, 60" },
    { id: "tire", name: "ШИНА", hp: 12, tier: "common", from: 4, to: 0, fill: "#232628", dark: "#101214", outline: "#0c0e10", glow: "120, 128, 136" },
    { id: "coin", name: "МОНЕТА", hp: 11, tier: "rare", from: 2, to: 2, fill: "#e8b62e", dark: "#8a6410", outline: "#6a4a08", glow: "245, 190, 60" },
    { id: "balloon", name: "ШАРИК", hp: 1, tier: "legend", from: 1, to: 1, fill: "#e02338", dark: "#9c0a22", outline: "#6a0818", glow: "230, 44, 66" },
    { id: "pie", name: "ЯБЛОЧНЫЙ ПИРОГ", hp: 8, tier: "legend", from: 1, to: 1, fill: "#d9a04e", dark: "#8a5a20", outline: "#6a4418", glow: "232, 168, 72" },
    { id: "cog", name: "ШЕСТЕРЁНКА", hp: 15, tier: "common", from: 4, to: 0, fill: "#8f99a5", dark: "#2b323a", outline: "#111820", glow: "150, 162, 176" },
    { id: "tennis", name: "ТЕННИСНЫЙ МЯЧ", hp: 20, tier: "secret", from: 5, to: 0, fill: "#c8e034", dark: "#7a9618", outline: "#3f5408", glow: "202, 224, 60" },
    { id: "compass", name: "КОМПАС", hp: 14, tier: "common", from: 5, to: 0, fill: "#e7dcc4", dark: "#8a7352", outline: "#2a241c", glow: "196, 148, 72" },
    { id: "camera", name: "КАМЕРА", hp: 20, tier: "legend", from: 5, to: 0, fill: "#3a78c8", dark: "#161412", outline: "#0a0806", glow: "64, 168, 220" },
    { id: "disco", name: "ДИСКО ШАР", hp: 21, tier: "legend", from: 5, to: 0, fill: "#a8b2c4", dark: "#2c3240", outline: "#10131a", glow: "150, 140, 255" }
  ]
};

function bossEditorFind(id) {
  for (let i = 0; i < BOSSES.length; i++) if (BOSSES[i].id === id) return BOSSES[i];
  return null;
}

function bossEditorTier(id) {
  for (let i = 0; i < BOSS_TIERS.length; i++) if (BOSS_TIERS[i].id === id) return BOSS_TIERS[i];
  return null;
}

/* Эффективный запас: у кого в карточке своего нет, тот берёт общий BOSS_HP */
function bossEditorHp(boss) {
  return Math.max(1, Math.round(boss.hp == null ? BOSS_HP : boss.hp) || BOSS_HP);
}

function bossEditorRound(v) {
  return Math.round((+v || 0) * 100) / 100;
}

/* Снимок настроек: и для кода, и для черновика, и для «сбросить» */
function bossEditorSnapshot() {
  const tiers = [];
  for (const t of BOSS_TIERS) {
    tiers.push({ id: t.id, name: t.name, weight: bossEditorRound(t.weight), xp: t.xp | 0, color: t.color });
  }
  const bosses = [];
  for (const b of BOSSES) {
    const w = bossWindowOf(b);
    bosses.push({
      id: b.id,
      name: b.name,
      hp: bossEditorHp(b),
      tier: w[0],
      from: Math.max(1, w[1] | 0),
      to: Math.max(0, w[2] | 0),
      fill: b.fill || "#888888",
      dark: b.dark || "#555555",
      outline: b.outline || "#222222",
      glow: b.glow || "196, 92, 62"
    });
  }
  return { tiers: tiers, bosses: bosses };
}

/* Применить настройки к данным игры. Без игровых эффектов: так закреплённый код
   и черновик ложатся ДО buildAssets (кэш цветов полоски пересчитается сам). */
function applyBossConfig(cfg) {
  if (!cfg || typeof cfg !== "object") return false;
  if (Array.isArray(cfg.tiers)) {
    for (const c of cfg.tiers) {
      const t = bossEditorTier(c && c.id);
      if (!t) continue;
      if (c.name) t.name = String(c.name);
      if (c.color) t.color = String(c.color);
      if (isFinite(c.xp)) t.xp = Math.max(0, c.xp | 0);
      if (isFinite(c.weight)) t.weight = Math.max(0, +c.weight);
    }
  }
  if (Array.isArray(cfg.bosses)) {
    for (const c of cfg.bosses) {
      const b = bossEditorFind(c && c.id);
      if (!b) continue;
      if (c.name) b.name = String(c.name);
      if (isFinite(c.hp)) b.hp = Math.max(1, c.hp | 0);
      if (c.fill) b.fill = String(c.fill);
      if (c.dark) b.dark = String(c.dark);
      if (c.outline) b.outline = String(c.outline);
      if (c.glow) b.glow = String(c.glow);
      const w = BOSS_WINDOWS[b.id] || (BOSS_WINDOWS[b.id] = ["common", 1, 0]);
      if (c.tier && bossEditorTier(c.tier)) w[0] = c.tier;
      if (isFinite(c.from)) w[1] = Math.max(1, c.from | 0);
      if (isFinite(c.to)) w[2] = Math.max(0, c.to | 0);
    }
  }
  return true;
}

/* «Как в коде» — точка возврата для кнопки «СБРОСИТЬ». Снимается уже после
   закреплённого кода, поэтому сброс возвращает именно закреплённое состояние. */
if (BOSS_CONFIG) applyBossConfig(BOSS_CONFIG);
const BOSS_EDITOR_BASE = bossEditorSnapshot();

/* ---------- черновик ----------
   Правки переживают перезагрузку страницы: без этого настройку пришлось бы
   повторять после каждого обновления. «СБРОСИТЬ» чистит черновик.
   v2: старый черновик (bh_boss_cfg) содержал окна, из-за которых легендарные
   и тайные боссы почти не выпадали (disco/camera — только с 5-го босса,
   coconut вообще был тайным). Он не применяется и удаляется при старте: иначе
   игрок продолжает жить со старым балансом и не видит ни одного легендарного.
   v3: в v2 остались старые веса редкостей (6,2 / 1,5 / 0,3). Теперь баланс
   другой — 4 : 2 : 1, и старый черновик перекрыл бы его собой. Поэтому он
   тоже удаляется: игра стартует с закреплённых шансов.
   v4: баланс снова сменился — 92 / 6,2 / 1,5 / 0,3 и новые окна с запасом.
   Черновик v3 с прежними числами удаляется при старте, иначе он перекрывал бы
   новый основной конфиг и выглядел бы как «настройки не применились». С этого
   места правки редактора (черновик v4 + boss-config.json на сервере) больше
   ничего не стирает. */
const BOSS_EDITOR_KEY = "bh_boss_cfg";
const BOSS_EDITOR_KEY_V2 = "bh_boss_cfg2";
const BOSS_EDITOR_KEY_V3 = "bh_boss_cfg3";
const BOSS_EDITOR_KEY_DRAFT = "bh_boss_cfg4";
try {
  localStorage.removeItem(BOSS_EDITOR_KEY);
  localStorage.removeItem(BOSS_EDITOR_KEY_V2);
  localStorage.removeItem(BOSS_EDITOR_KEY_V3);
} catch (err) {}

function bossEditorDraftRead() {
  try {
    const raw = localStorage.getItem(BOSS_EDITOR_KEY_DRAFT);
    if (!raw) return null;
    const cfg = JSON.parse(raw);
    return cfg && typeof cfg === "object" ? cfg : null;
  } catch (err) {
    return null;
  }
}

function bossEditorDraftSave() {
  try {
    localStorage.setItem(BOSS_EDITOR_KEY_DRAFT, JSON.stringify(bossEditorSnapshot()));
  } catch (err) {}
}

function bossEditorDraftClear() {
  try {
    localStorage.removeItem(BOSS_EDITOR_KEY_DRAFT);
  } catch (err) {}
}

/* Черновик редактора ложится ПОВЕРХ закреплённого конфига — всегда, иначе
   правки (ХП, редкость, окно стадий) откатывались бы при каждом обновлении
   страницы. BOSS_EDITOR_BASE снят до этой строки, поэтому «СБРОСИТЬ»
   по-прежнему возвращает именно закреплённое состояние. */
const bossEditorSaved = bossEditorDraftRead();
if (bossEditorSaved) applyBossConfig(bossEditorSaved);

/* ---------- конфиг боссов ----------
   Релизная версия использует только вшитый конфиг из js/boss-config-fixed.js.
   Сетевых запросов за настройками боссов нет. */
let bossRemoteTimer = 0;

function bossRemoteNote(text, ok) {
  const el = document.getElementById("bedSaveNote");
  if (!el) return;
  el.textContent = text || "";
  el.classList.toggle("ok", !!ok);
  el.classList.toggle("bad", ok === false);
}

function bossRemoteSaveNow() {
  bossRemoteTimer = 0;
  bossRemoteNote("Конфиг боссов зафиксирован в игре.", true);
}

function bossRemoteSave() {
  if (bossRemoteTimer) return;
  bossRemoteTimer = setTimeout(bossRemoteSaveNow, 350);
}

function bossRemoteClear() {
  if (bossRemoteTimer) {
    clearTimeout(bossRemoteTimer);
    bossRemoteTimer = 0;
  }
  bossRemoteNote("", null);
}

/* Серверный файл главнее: применяем его до первого кадра игры. Возвращает
   true, только если настройки реально изменились, — иначе лишний раз не
   трогаем уже запущенный босс. */
function bossRemoteApply(cfg) {
  if (!cfg || typeof cfg !== "object") return false;
  if (!Array.isArray(cfg.tiers) && !Array.isArray(cfg.bosses)) return false;
  const before = JSON.stringify(bossEditorSnapshot());
  applyBossConfig(cfg);
  bossEditorDraftSave();
  return JSON.stringify(bossEditorSnapshot()) !== before;
}

function bossRemoteLoadApplied(cfg, note) {
  if (!bossRemoteApply(cfg)) return false;
  bossEditorRefresh();
  if (sheetMode === "bosses") renderSheet();
  bossRemoteNote(note, true);
  return true;
}

function bossRemoteLoad() {
  /* Релиз: конфиг вшит в js/boss-config-fixed.js. Никаких fetch/API. */
  if (window.BH_BOSS_CONFIG) {
    bossRemoteLoadApplied(window.BH_BOSS_CONFIG, "Настройки боссов встроены в игру.");
  }
}

/* ---------- живое применение ----------
   Настройки уже в данных; здесь их видно в игре: пересчитываем цвет полоски,
   сбрасываем выбор босса на текущем уровне и перезапускаем его ход, чтобы
   новый босс/запас встали в кадр сразу же. */
function bossEditorRefresh() {
  for (const b of BOSSES) bossHpColors(b, b.glow);
  resetBossPick();
  hudSnap = "";
  if (state === "play") {
    game.log.boss = bossFor(game.level);
    game.log.maxHp = maxHpFor(game.level);
    game.log.hp = game.log.maxHp;
    game.log.dmg = 0;
    if (typeof resetHpTrail === "function") resetHpTrail();
    invalidateLogBakes();
    startLogSpin(game.level);
  } else if (state === "menu" && typeof armFirstLog === "function") {
    armFirstLog();
  }
  syncHud();
}

function bossEditorApplyLive() {
  bossEditorDraftSave();
  bossRemoteSave();
  bossEditorRefresh();
}

/* ---------- интерфейс ---------- */
function bossEditorTierRow(t) {
  return `<div class="bed-tier">
    <span class="bed-tier-name" style="color:${t.color}">${t.name}</span>
    <label class="bed-num">ШАНС %<input type="number" min="0" max="100" step="0.5" data-tier-w="${t.id}" value="${bossEditorRound(t.weight)}"></label>
  </div>`;
}

function bossEditorRow(b) {
  const w = bossWindowOf(b);
  const opts = [];
  for (const t of BOSS_TIERS) {
    opts.push(`<option value="${t.id}"${t.id === w[0] ? " selected" : ""}>${t.name}</option>`);
  }
  return `<div class="bed-row">
    <span class="bed-name"><i style="background:${b.fill || "#888888"}"></i>${b.name}</span>
    <select class="lvl-select bed-pick" data-boss-tier="${b.id}" aria-label="Редкость ${b.name}">${opts.join("")}</select>
    <label class="bed-num">С БОССА<input type="number" min="1" max="999" data-boss-from="${b.id}" value="${Math.max(1, w[1] | 0)}"></label>
    <label class="bed-num">ПО<input type="number" min="0" max="999" data-boss-to="${b.id}" value="${Math.max(0, w[2] | 0)}"></label>
    <label class="bed-num">ХП<input type="number" min="1" max="99" data-boss-hp="${b.id}" value="${bossEditorHp(b)}"></label>
  </div>`;
}

function bossEditorSumText() {
  let sum = 0;
  for (const t of BOSS_TIERS) sum += t.weight;
  const bits = [];
  for (const t of BOSS_TIERS) bits.push(t.name.toLowerCase() + " " + bossTierPct(t.id) + "%");
  return "Сумма шансов " + bossEditorRound(sum) + " % · по боссам выходит: " + bits.join(", ") +
    " · «ПО = 0» значит без предела. Правки применяются сразу и видны в игре.";
}

function bossEditorCode() {
  return JSON.stringify(bossEditorSnapshot(), null, 2);
}

function renderBossEditor() {
  const bits = [];
  bits.push('<div class="bed">');
  bits.push('<div class="sheet-note">Редкость, окно и запас. «С БОССА» / «ПО» — номер босса в забеге (1 = 5-й уровень, 2 = 10-й, 6 = 30-й). Окно жёсткое: «1…1» значит только 1-й босс, на 6-м он не выпадет. «ПО = 0» — без верхнего предела. Кто долго не выпадал внутри своего окна — получает больший вес (умный рандом). Ниже JSON для закрепления в коде.</div>');
  bits.push('<div class="bed-tiers">');
  for (const t of BOSS_TIERS) bits.push(bossEditorTierRow(t));
  bits.push(`<div class="bed-sum" id="bedSum">${bossEditorSumText()}</div>`);
  bits.push("</div>");
  bits.push('<div class="bed-list">');
  for (const b of BOSSES) bits.push(bossEditorRow(b));
  bits.push("</div>");
  bits.push('<div class="bed-code-head">КОД НАСТРОЕК · JSON</div>');
  bits.push(`<pre class="bed-code" id="bedCode">${bossEditorCode()}</pre>`);
  bits.push('<div class="bed-actions">');
  bits.push('<button class="card-btn" type="button" data-boss-copy>СКОПИРОВАТЬ КОД</button>');
  bits.push('<button class="card-btn ghost" type="button" data-boss-reset>СБРОСИТЬ</button>');
  bits.push("</div>");
  bits.push('<div class="bed-code-head">ВСТАВИТЬ КОД · JSON</div>');
  bits.push('<textarea class="bed-paste" id="bedPaste" spellcheck="false" autocomplete="off" autocapitalize="off" placeholder="Вставьте сюда JSON настроек (из «СКОПИРОВАТЬ КОД» или от заказчика) и нажмите «ПРИМЕНИТЬ» — игра возьмёт его сразу"></textarea>');
  bits.push('<div class="bed-actions">');
  bits.push('<button class="card-btn" type="button" data-boss-apply>ПРИМЕНИТЬ</button>');
  bits.push('<button class="card-btn ghost" type="button" data-boss-paste>ВСТАВИТЬ ИЗ БУФЕРА</button>');
  bits.push("</div>");
  bits.push('<div class="bed-msg" id="bedPasteMsg" role="status" aria-live="polite"></div>');
  bits.push('<div class="bed-msg" id="bedSaveNote" role="status" aria-live="polite"></div>');
  bits.push('<div class="sheet-note">Тот же JSON можно вставить обратно: редкости, окна и запас встанут в игру сразу, без перезагрузки. Ctrl+Enter в поле — применить. Понимает и чистый JSON, и код в ```-блоках, и строку «const BOSS_CONFIG = {…};». Правки сохраняются в браузере и в boss-config.json на сервере, поэтому перезагрузка страницы и переход на телефон их не сбрасывают.</div>');
  bits.push("</div>");
  return bits.join("");
}

/* Перерисовка без сброса полей: меняются только сводка и код */
function bossEditorPaint() {
  const sum = document.getElementById("bedSum");
  if (sum) sum.textContent = bossEditorSumText();
  const code = document.getElementById("bedCode");
  if (code) code.textContent = bossEditorCode();
}

function bossEditorInput(e) {
  if (sheetMode !== "bosses") return;
  const d = (e.target && e.target.dataset) || {};
  if (d.tierW != null) {
    const t = bossEditorTier(d.tierW);
    if (t) t.weight = Math.max(0, bossEditorRound(e.target.value));
  } else if (d.bossTier != null) {
    const w = BOSS_WINDOWS[d.bossTier];
    if (w && bossEditorTier(e.target.value)) w[0] = e.target.value;
  } else if (d.bossFrom != null) {
    const w = BOSS_WINDOWS[d.bossFrom];
    if (w) w[1] = Math.max(1, (+e.target.value || 1) | 0);
  } else if (d.bossTo != null) {
    const w = BOSS_WINDOWS[d.bossTo];
    if (w) w[2] = Math.max(0, (+e.target.value || 0) | 0);
  } else if (d.bossHp != null) {
    const b = bossEditorFind(d.bossHp);
    if (b) b.hp = Math.max(1, (+e.target.value || 1) | 0);
  } else {
    return;
  }
  bossEditorApplyLive();
  bossEditorPaint();
}

function bossEditorCopyFallback(text, done) {
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    if (done) done();
  } catch (err) {}
}

function bossEditorCopy(btn) {
  const text = bossEditorCode();
  const done = () => {
    btn.textContent = "СКОПИРОВАНО";
    setTimeout(() => { btn.textContent = "СКОПИРОВАТЬ КОД"; }, 1400);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done, () => bossEditorCopyFallback(text, done));
    return;
  }
  bossEditorCopyFallback(text, done);
}

/* ---------- вставка кода обратно ----------
   Тот же JSON, что копирует кнопка выше, можно вставить в поле и применить.
   Разбираем терпимо: чистый JSON, JSON в ```-блоке и строку с объявлением
   const BOSS_CONFIG = {...}; — так удобнее переносить настройки из документа
   или из чужого файла, не вычищая обёртку руками. */
function bossEditorParseJson(text) {
  let raw = String(text == null ? "" : text).trim();
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1).trim();
  if (!raw) return { error: "Поле пустое: вставьте JSON настроек." };
  const fence = raw.match(/^```[a-zA-Z0-9_-]*\s*([\s\S]*?)\s*```$/);
  if (fence) raw = fence[1].trim();
  raw = raw.replace(/^(?:const|let|var)\s+[A-Za-z_$][\w$]*\s*=\s*/, "").replace(/;\s*$/, "").trim();
  let cfg;
  try {
    cfg = JSON.parse(raw);
  } catch (err) {
    return { error: "Это не JSON: " + ((err && err.message) || "не удалось разобрать") + ". Проверьте кавычки и запятые." };
  }
  if (!cfg || typeof cfg !== "object" || Array.isArray(cfg)) {
    return { error: "Нужен объект настроек: { tiers: [...], bosses: [...] }." };
  }
  if (!Array.isArray(cfg.tiers) && !Array.isArray(cfg.bosses)) {
    return { error: "В JSON нет ни tiers, ни bosses — применять нечего." };
  }
  return { cfg: cfg };
}

/* Сколько записей из кода реально ляжет в игру: незнакомые id пропускаем,
   но говорим о них, чтобы опечатка не осталась незамеченной. */
function bossEditorJsonReport(cfg) {
  const rep = { tiers: 0, bosses: 0, unknown: [] };
  if (Array.isArray(cfg.tiers)) {
    for (const c of cfg.tiers) {
      const id = c && c.id;
      if (id != null && bossEditorTier(id)) rep.tiers++;
      else rep.unknown.push(id == null ? "редкость без id" : String(id));
    }
  }
  if (Array.isArray(cfg.bosses)) {
    for (const c of cfg.bosses) {
      const id = c && c.id;
      if (id != null && bossEditorFind(id)) rep.bosses++;
      else rep.unknown.push(id == null ? "босс без id" : String(id));
    }
  }
  return rep;
}

function bossEditorPasteMsg(text, ok) {
  const el = document.getElementById("bedPasteMsg");
  if (!el) return;
  el.textContent = text || "";
  el.classList.toggle("ok", !!ok);
  el.classList.toggle("bad", !ok && !!text);
}

function bossEditorApplyJson() {
  const ta = document.getElementById("bedPaste");
  const text = ta ? ta.value : "";
  const parsed = bossEditorParseJson(text);
  if (parsed.error) {
    bossEditorPasteMsg(parsed.error, false);
    return;
  }
  const rep = bossEditorJsonReport(parsed.cfg);
  if (!rep.tiers && !rep.bosses) {
    bossEditorPasteMsg("Ни одна запись не совпала с боссами игры — проверьте id: " + (rep.unknown.slice(0, 6).join(", ") || "пусто") + ".", false);
    return;
  }
  applyBossConfig(parsed.cfg);
  bossEditorApplyLive();
  /* Перерисовываем лист, чтобы поля и код показали новые значения. Вставленный
     текст оставляем в поле: его удобно поправить и применить ещё раз. */
  const keep = ta ? ta.value : "";
  renderSheet();
  const ta2 = document.getElementById("bedPaste");
  if (ta2) ta2.value = keep;
  let msg = "ПРИМЕНЕНО: редкостей " + rep.tiers + ", боссов " + rep.bosses + ".";
  if (rep.unknown.length) {
    msg += " Пропущено: " + rep.unknown.slice(0, 6).join(", ") + (rep.unknown.length > 6 ? "…" : "") + ".";
  }
  bossEditorPasteMsg(msg, true);
  if (typeof toast === "function") toast("НАСТРОЙКИ БОССОВ ПРИМЕНЕНЫ");
}

function bossEditorPasteFromClipboard() {
  const ta = document.getElementById("bedPaste");
  const fail = () => {
    bossEditorPasteMsg("Браузер не дал прочитать буфер обмена. Нажмите в поле и вставьте вручную: Ctrl+V (на телефоне — «Вставить» в меню поля).", false);
    if (ta) ta.focus();
  };
  if (!navigator.clipboard || !navigator.clipboard.readText) {
    fail();
    return;
  }
  navigator.clipboard.readText().then(text => {
    if (!ta) return;
    ta.value = text || "";
    bossEditorPasteMsg(text ? "Код вставлен. Нажмите «ПРИМЕНИТЬ»." : "В буфере обмена пусто.", !!text);
    ta.focus();
  }, fail);
}

/* Обработчики вешаются ПОСЛЕ готовности документа: скрипт может грузиться и из
   <head>, а тогда sheetBody ещё нет. Так же подстраховываются остальные панели. */
function bossEditorBind() {
  sheetBody.addEventListener("input", bossEditorInput);
  sheetBody.addEventListener("change", bossEditorInput);
  sheetBody.addEventListener("click", e => {
    const btn = e.target.closest ? e.target.closest("button") : null;
    if (!btn) return;
    if (btn.dataset.bossCopy != null) {
      bossEditorCopy(btn);
      return;
    }
    if (btn.dataset.bossApply != null) {
      bossEditorApplyJson();
      return;
    }
    if (btn.dataset.bossPaste != null) {
      bossEditorPasteFromClipboard();
      return;
    }
    if (btn.dataset.bossReset != null) {
      applyBossConfig(BOSS_EDITOR_BASE);
      bossEditorDraftClear();
      bossRemoteClear();
      bossEditorRefresh();
      renderSheet();
    }
  });
  sheetBody.addEventListener("keydown", e => {
    if (sheetMode !== "bosses") return;
    if (!e.target || e.target.id !== "bedPaste") return;
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      bossEditorApplyJson();
    }
  });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bossEditorBind);
else bossEditorBind();

/* Читаем серверный файл, когда все скрипты на месте: правки в boss-config.json
   должны встать в игру до того, как игрок начнёт забег. */
if (document.readyState === "complete") bossRemoteLoad();
else window.addEventListener("load", bossRemoteLoad);
