/* ---------- ДОРОЖКА НАГРАД ----------
   Прямоугольное окно с 20 ячейками: все видны сразу, без прокрутки и свайпов.
   Каждые 4 часа открывается следующая награда. Каждая 4-я ячейка — новый нож,
   остальные — яблоки. Время идёт от последнего получения: вернулся через
   12 часов — готовы сразу три награды, их можно забрать подряд. */

const RT_CELLS = 20;
const RT_STEP_MS = 4 * 60 * 60 * 1000;
const RT_KNIFE_EVERY = 5;
const RT_APPLES_BASE = 50;
const RT_APPLES_STAGE = 25;
const RT_ALL_KNIVES_APPLES = 500;

let rewardWindowOpen = false;
let rwStateSnap = "";
let rwTimerSnap = "";

/* Награда в ячейке i (0…19). Каждая пятая — нож, остальные — яблоки. */
function rewardCell(i) {
  const n = Math.max(0, Math.min(RT_CELLS - 1, i | 0));
  if ((n + 1) % RT_KNIFE_EVERY === 0) return { kind: "knife" };
  const stage = Math.floor(n / RT_KNIFE_EVERY);
  const apples = RT_APPLES_BASE + stage * RT_APPLES_STAGE + (n % RT_KNIFE_EVERY) * 10;
  return { kind: "apples", apples: apples };
}

function rewardNow() {
  return Date.now();
}

function rewardNextAt() {
  /* Внимание: отметка времени больше 32 бит, поэтому без | 0 — побитовые
     операторы обрезали бы её до отрицательного числа. */
  return Math.max(0, Math.floor(+save.rtNextAt || 0));
}

/* Сколько наград уже готово к получению. Если игрок отсутствовал долго,
   готовых ячеек может быть несколько. */
function rewardReadyCount(now) {
  const t = now == null ? rewardNow() : now;
  const ni = rewardNextAt();
  const left = RT_CELLS - Math.max(0, Math.min(RT_CELLS, save.rtIdx | 0));
  if (!left) return 0;
  if (ni <= 0) return 1;
  if (t < ni) return 0;
  return Math.min(left, 1 + Math.floor((t - ni) / RT_STEP_MS));
}

function rewardIsReady(now) {
  return rewardReadyCount(now) > 0;
}

function rewardTimeLeft(now) {
  const t = now == null ? rewardNow() : now;
  const ni = rewardNextAt();
  return ni > 0 ? Math.max(0, ni - t) : 0;
}

function rewardPad2(n) {
  return n < 10 ? "0" + n : String(n);
}

/* Полный таймер в окне: 3:59:59 */
function rewardTimeFull(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return Math.floor(total / 3600) + ":" + rewardPad2(Math.floor((total % 3600) / 60)) + ":" + rewardPad2(total % 60);
}

/* Компактный таймер на кнопке в меню: 3ч 59м, а в последний час — 59м 30с */
function rewardTimeShort(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  if (total >= 3600) return Math.floor(total / 3600) + "ч " + rewardPad2(Math.floor((total % 3600) / 60)) + "м";
  return Math.floor(total / 60) + "м " + rewardPad2(total % 60) + "с";
}

/* ---------- выдача ---------- */

function rewardKnifePool() {
  const owned = save.owned || [];
  const has = typeof ownsKnife === "function"
    ? (id) => ownsKnife(id)
    : (id) => owned.indexOf(id) >= 0;
  return KNIFE_SKINS.filter(k => k.id !== "classic" && !has(k.id));
}

/* Новый нож: берём только ещё не открытый. Если открыты все — честно даём
   яблоки, чтобы ячейка не оказалась пустой. */
function rewardGrantKnife() {
  const pool = rewardKnifePool();
  if (!pool.length) {
    game.apples = (game.apples | 0) + RT_ALL_KNIVES_APPLES;
    return { kind: "apples", apples: RT_ALL_KNIVES_APPLES, allOwned: true };
  }
  const skin = pool[(Math.random() * pool.length) | 0];
  save.owned.push(skin.id);
  loadoutSnap = "";
  if (typeof knifeBookRefresh === "function") knifeBookRefresh();
  return { kind: "knife", skin: skin };
}

function claimReward() {
  const now = rewardNow();
  if (!rewardIsReady(now)) return false;
  const i = Math.max(0, Math.min(RT_CELLS - 1, save.rtIdx | 0));
  const cell = rewardCell(i);
  let got = null;

  if (cell.kind === "knife") {
    got = rewardGrantKnife();
  } else {
    game.apples = (game.apples | 0) + cell.apples;
    got = { kind: "apples", apples: cell.apples };
  }

  save.rtIdx = (i + 1) % RT_CELLS;
  const ni = rewardNextAt();
  /* Конец круга всегда начинает новый с чистых 4 часов, даже если игрок
     отсутствовал неделю: иначе накопленный запас времени крутил бы круги
     бесконечно. Внутри круга накопленные ячейки забираются подряд. */
  save.rtNextAt = i === RT_CELLS - 1
    ? now + RT_STEP_MS
    : (ni > 0 ? ni + RT_STEP_MS : now + RT_STEP_MS);

  persist();
  syncHud();
  try { Sfx.pick(); } catch (err) {}
  if (typeof Analytics !== "undefined") {
    Analytics.purchase({
      kind: "reward",
      id: String(i),
      name: got.kind === "knife" ? ("Нож: " + got.skin.name) : ("Яблоки: " + got.apples),
      cost: 0,
      currency: "free"
    });
  }
  if (got.kind === "knife") {
    toast("НОВЫЙ НОЖ · " + got.skin.name);
  } else if (got.allOwned) {
    toast("ВСЕ НОЖИ СОБРАНЫ · +" + got.apples + " ЯБЛОК");
  } else {
    toast("+" + got.apples + " ЯБЛОК");
  }
  rwStateSnap = "";
  renderRewardWindow();
  renderRewardChip();
  return true;
}

/* ---------- окно ---------- */

function buildRewardGrid() {
  if (!rwGrid || rwGrid.children.length === RT_CELLS) return;
  const bits = [];
  for (let i = 0; i < RT_CELLS; i++) {
    const c = rewardCell(i);
    const knife = c.kind === "knife";
    bits.push(
      '<div class="rw-cell ' + (knife ? "rw-cell-knife" : "rw-cell-apple") + '" data-rw="' + i + '">' +
        '<span class="rw-cell-num">' + (i + 1) + '</span>' +
        '<span class="rw-cell-ico" aria-hidden="true">' + (knife ? "🔪" : "🍎") + '</span>' +
        '<span class="rw-cell-val">' + (knife ? "НОЖ" : "+" + c.apples) + '</span>' +
        '<span class="rw-cell-check" aria-hidden="true">✓</span>' +
        '<span class="rw-cell-lock" aria-hidden="true">🔒</span>' +
      '</div>'
    );
  }
  rwGrid.innerHTML = bits.join("");
}

function paintRewardGrid(now) {
  if (!rwGrid) return;
  const idx = Math.max(0, Math.min(RT_CELLS - 1, save.rtIdx | 0));
  const ready = rewardIsReady(now);
  const snap = idx + ":" + (ready ? 1 : 0);
  if (snap === rwStateSnap) return;
  rwStateSnap = snap;
  const cells = rwGrid.children;
  for (let i = 0; i < cells.length; i++) {
    const el = cells[i];
    const done = i < idx;
    const isNext = i === idx;
    const can = isNext && ready;
    el.classList.toggle("rw-done", done);
    el.classList.toggle("rw-next", isNext && !ready);
    el.classList.toggle("rw-ready", can);
    el.classList.toggle("rw-locked", i > idx);
    el.title = done ? "Награда получена"
      : can ? "Заберите награду кнопкой ниже"
      : isNext ? "Откроется через " + rewardTimeFull(rewardTimeLeft(now))
      : "Награда закрыта";
  }
}

function paintRewardTimer(now) {
  if (!rwTimer) return;
  const ready = rewardIsReady(now);
  const left = rewardTimeLeft(now);
  const txt = ready ? "ГОТОВО" : rewardTimeFull(left);
  const cap = ready ? "награда ждёт вас" : "до следующей награды";
  const snap = txt + "|" + cap;
  if (snap === rwTimerSnap) return;
  rwTimerSnap = snap;
  rwTimer.textContent = txt;
  if (rwTimerCap) rwTimerCap.textContent = cap;
  if (rwTimerIco) rwTimerIco.textContent = ready ? "🎁" : "⏳";
  if (rwTimerBox) rwTimerBox.classList.toggle("is-ready", ready);
}

function renderRewardWindow(now) {
  if (!rewardWindowOpen) return;
  const t = now == null ? rewardNow() : now;
  const ready = rewardIsReady(t);
  buildRewardGrid();
  paintRewardTimer(t);
  paintRewardGrid(t);
  if (rwClaim) rwClaim.hidden = !ready;
  if (rwFoot) rwFoot.hidden = !ready;
}

function rewardWindowOpened() {
  return !!(rewardWindowOpen && rewardWin && !rewardWin.classList.contains("hidden"));
}

function openRewardWindow() {
  if (!rewardWin) return;
  try { Sfx.ensure(); } catch (err) {}
  rewardWindowOpen = true;
  rwStateSnap = "";
  rwTimerSnap = "";
  buildRewardGrid();
  rewardWin.classList.remove("hidden");
  rewardWin.setAttribute("aria-hidden", "false");
  rewardWin.inert = false;
  renderRewardWindow();
}

function closeRewardWindow() {
  if (!rewardWin || !rewardWindowOpen) return;
  rewardWindowOpen = false;
  rewardWin.classList.add("hidden");
  rewardWin.setAttribute("aria-hidden", "true");
  rewardWin.inert = true;
}

/* ---------- кнопка в меню и плашка в доке ---------- */

function renderRewardChip(now) {
  const t = now == null ? rewardNow() : now;
  const n = rewardReadyCount(t);
  if (rewardsBadge) {
    const txt = n > 0 ? "!" : "";
    if (txt) {
      if (rewardsBadge.hidden) rewardsBadge.hidden = false;
      if (rewardsBadge.textContent !== txt) rewardsBadge.textContent = txt;
      rewardsBadge.title = "Есть готовые награды";
    } else if (!rewardsBadge.hidden) {
      rewardsBadge.hidden = true;
      rewardsBadge.textContent = "";
      rewardsBadge.title = "";
    }
  }
}

/* Раз в секунду: обновляем таймер и, если награда стала доступна, состояние.
   Дорогих перерисовок нет — только текст и классы. */
function rewardTick() {
  const now = rewardNow();
  if (state === "menu") renderRewardChip(now);
  if (rewardWindowOpened()) renderRewardWindow(now);
}

/* ---------- события ---------- */

if (rewardWin) {
  /* Поле игры не должно начинать забег «сквозь» окно */
  rewardWin.addEventListener("pointerdown", e => e.stopPropagation());
  rewardWin.addEventListener("click", e => {
    e.stopPropagation();
    if (e.target === rewardWin) closeRewardWindow();
  });
  rewardWin.inert = true;
}
if (rwClose) {
  rwClose.addEventListener("click", e => {
    e.stopPropagation();
    closeRewardWindow();
  });
}
if (rwClaim) {
  rwClaim.addEventListener("click", e => {
    e.stopPropagation();
    claimReward();
  });
}
setInterval(rewardTick, 1000);
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) rewardTick();
  });
}
