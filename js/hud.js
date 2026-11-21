function itemCount(id) {
  return Math.max(0, (save.items && save.items[id]) | 0);
}

/* Ножи, открытые всем игрокам сразу (флаг unlocked в самом скине). Сейчас таких
   нет: классические ножи выдаёт кнопка «Открыть» (js/knife-book.js:
   randomUnlockKnife), боссовы падают с боссов, остальные покупаются. Механизм
   оставлен на будущее: акционному ножу достаточно unlocked: true, и он не
   потребует ни покупки, ни записи в сейв. */
const UNLOCKED_KNIFE_IDS = new Set(KNIFE_SKINS.filter(k => k.unlocked).map(k => k.id));

function ownsKnife(id) {
  return save.owned.includes(id) || UNLOCKED_KNIFE_IDS.has(id);
}

function knifeSkin(id) {
  return KNIFE_SKINS.find(k => k.id === (id || save.knife)) || KNIFE_SKINS[0];
}

function knifeDamage() {
  return 1;
}

/* Сколько снимет один этот нож. У всех боссов — единица. У кокоса единица
   только если под ножом уже белая мякоть: в неё нож входит и снимает одну
   (COCONUT_FLESH_HIT). По целой скорлупе нож отскакивает и запас не трогает.
   Отсюда же урон броска (throwKnife). */
function knifeHitDamage() {
  if (game.log.boss && game.log.boss.id === "coconut") {
    const plate = coconutPlateAt(hitRel());
    if (plate && plate.hp <= 0) return COCONUT_FLESH_HIT;
  }
  return knifeDamage();
}

function pendingDamage() {
  let n = 0;
  for (const k of game.flying) n += k.dmg || knifeDamage();
  return n;
}

function syncHud() {
  /* В бою обновляем ТОЛЬКО боевой HUD. Меню (бейджи, счётчики, чип игрока,
     лоадаут) скрыто за display/visibility и всё равно не видно, а его DOM-
     правки на каждом ноже — лишняя работа и лишние перерисовки на слабых
     телефонах. При входе в меню hudSnap сбрасывается (js/flow.js: enterMenu),
     поэтому меню синхронизируется целиком. */
  const inMenu = state === "menu";
  if (inMenu) renderMenuBadges();
  /* Лента нового рекорда живёт своим снимком: она обязана обновиться, даже
     когда остальные числа не изменились (js/hud.js: syncRecordHud) */
  syncRecordHud();
  /* Подписи под числом уровня больше нет: слева просто счёт ножей текущего
     забега без слова «ТЕКУЩИЙ». Имя босса стоит над его полоской HP
     (js/draw-hud.js: paintHpName). */
  const snap = (game.apples | 0) + ":" + (save.inf ? 1 : 0) + ":" + game.level + ":" + (game.recordNum | 0) + ":" + save.best + ":" + (game.lives | 0) + ":" + save.knife + ":" + (save.loadout.shield ? 1 : 0) + (save.loadout.slow ? 1 : 0) + (save.loadout.double ? 1 : 0) + ":" + (game.buffs.shield ? 1 : 0) + (game.buffs.slow ? 1 : 0) + (game.buffs.double ? 1 : 0) + ":" + (save.rubles | 0);
  if (snap === hudSnap) return;
  hudSnap = snap;
  /* Счёт — это НОЖИ, воткнутые за этот забег (game.recordNum): прибавка идёт в
     том же кадре, когда нож сел в кромку (js/flow.js: stickKnife). Рекорд —
     лучший такой счёт за всё время. Все числа HUD меняются «поездом» цифр
     сверху — см. setCounter ниже. С чит-кнопкой (бесконечные яблоки) числа не
     показываем: девять цифр в пилюлю не влезают, а точное значение ничего не
     значит. */
  if (globalAppleVal) setCounter(globalAppleVal, save.inf ? "∞" : (game.apples | 0));
  if (globalRubleVal) setCounter(globalRubleVal, save.rubles | 0);
  setCounter(lvlVal, game.recordNum | 0);
  setCounter(bestVal, save.best | 0);
  if (inMenu) {
    if (menuBestVal) setCounter(menuBestVal, save.best | 0);
    if (typeof renderRewardChip === "function") renderRewardChip();
    renderLoadout();
  }
  renderLives();
  renderHudBuffs();
}

/* ---------- счёт: цифры приезжают сверху ----------
   Любое число в HUD меняется не «перескоком»: каждая цифра живёт в своём окне,
   и при прибавлении новая цифра приезжает СВЕРХУ, а старая уезжает вниз
   (16 → 17: «1» стоит, а над «6» сверху приезжает «7» и они меняются).
   Работает для уровня, рекорда, яблок, меню и ленты нового рекорда.
   Анимация — Web Animations, окна цифр — инлайн-стили: счёт крутится даже
   если CSS ещё не перезагрузился из кэша. */
const counterStates = new WeakMap();
const COUNTER_MS = 460;
const COUNTER_EASE = "cubic-bezier(.2,.86,.24,1)";
const COUNTER_LINE = 1.16;

function counterState(el) {
  let st = counterStates.get(el);
  if (!st) {
    st = { digits: [], cells: [] };
    counterStates.set(el, st);
  }
  return st;
}

function counterDigit(value, extra) {
  const s = document.createElement("span");
  /* Без will-change: на каждый изменённый разряд раньше создавался отдельный
     слой композитора, а цифры меняются на каждом воткнутом ноже. Анимация и
     так короткая и мелкая — слой ей не нужен. */
  s.style.cssText = "display:block;line-height:" + COUNTER_LINE + ";" + (extra || "");
  s.textContent = value;
  return s;
}

/* окно одной цифры: всё лишнее обрезано, поэтому цифра «въезжает» как в слоте */
function counterCell(value) {
  const cell = document.createElement("span");
  cell.style.cssText = "position:relative;display:inline-block;overflow:hidden;height:" +
    COUNTER_LINE + "em;line-height:" + COUNTER_LINE + ";text-align:center;vertical-align:top;";
  cell.appendChild(counterDigit(value));
  return cell;
}

function buildCounter(el, st, parts) {
  el.textContent = "";
  st.cells = [];
  st.digits = [];
  for (let i = 0; i < parts.length; i++) {
    const cell = counterCell(parts[i]);
    st.cells.push(cell);
    st.digits.push(parts[i]);
    el.appendChild(cell);
  }
}

/* одна цифра: новая приезжает сверху, старая уезжает вниз. Через COUNTER_MS в
   окне остаётся только новая цифра — без накопления слоёв */
function rollCounterCell(cell, digit) {
  if (!cell) return;
  while (cell.children.length > 1) cell.removeChild(cell.lastChild);
  const cur = cell.firstChild;
  const next = counterDigit(digit, "position:absolute;left:0;top:0;width:100%;");
  cell.appendChild(next);
  if (cell._rollT) clearTimeout(cell._rollT);
  if (cur && cur.animate && next.animate) {
    cur.animate(
      [{ transform: "translateY(0)" }, { transform: "translateY(100%)" }],
      { duration: COUNTER_MS, easing: COUNTER_EASE, fill: "forwards" }
    );
    next.animate(
      [{ transform: "translateY(-100%)" }, { transform: "translateY(0)" }],
      { duration: COUNTER_MS, easing: COUNTER_EASE, fill: "forwards" }
    );
    cell._rollT = setTimeout(() => {
      cell._rollT = 0;
      cell.textContent = "";
      cell.appendChild(counterDigit(digit));
    }, COUNTER_MS + 30);
  } else {
    cell.textContent = "";
    cell.appendChild(counterDigit(digit));
  }
}

/* value — число или строка («∞» у чит-кнопки) */
function setCounter(el, value) {
  if (!el) return;
  const parts = String(value).split("");
  const st = counterState(el);
  if (!parts.length || st.cells.length !== parts.length || !el.firstChild) {
    /* разрядность сменилась (9 → 10, «∞» ↔ число) — собираем заново */
    buildCounter(el, st, parts);
    return;
  }
  for (let i = 0; i < parts.length; i++) {
    if (st.digits[i] === parts[i]) continue;
    st.digits[i] = parts[i];
    rollCounterCell(st.cells[i], parts[i]);
  }
}

/* ---------- «НОВЫЙ РЕКОРД» справа сверху ----------
   Пока забег идёт дальше прежнего рекорда (флаг game.bestBeaten ставит
   js/flow.js: levelCleared — в самый кадр победы над боссом), правая колонка
   HUD исчезает ЦЕЛИКОМ: и текущий счёт, и рекорд с подписью.
   На её месте — ОДНО крупное светящееся число с подписью «НОВЫЙ РЕКОРД».
   Рекорда ещё нет (первый забег, game.bestKnown = false) — этого не будет
   вовсе: справа остаётся одно число счёта без колонки рекорда.
   Пока рекорд держится, число чуть покачивается; на каждом новом очке оно на
   мгновение раздувается и вспыхивает. Всё на Web Animations. */
let recordSnap = "";
let recordShown = 0;
let recordSway = null;

/* покачивание: число живое, а не нарисованное */
function startRecordSway() {
  if (recordSway || !recordVal || !recordVal.animate) return;
  recordSway = recordVal.animate(
    [
      { transform: "translateY(0) rotate(-1.7deg)" },
      { transform: "translateY(-5px) rotate(1.7deg)" },
      { transform: "translateY(0) rotate(-1.7deg)" }
    ],
    { duration: 2900, iterations: Infinity, easing: "ease-in-out" }
  );
}

function stopRecordSway() {
  if (!recordSway) return;
  try { recordSway.cancel(); } catch (err) {}
  recordSway = null;
}

/* свечение вокруг числа: вспыхивает на новом очке и в момент появления */
function flashRecordMark(power) {
  const glow = recordMark && recordMark.querySelector(".record-mark-glow");
  if (!glow || !glow.animate) return;
  const top = Math.min(1, 0.55 * (power || 1));
  glow.animate(
    [{ opacity: top, transform: "scale(1.55)" }, { opacity: 0.4, transform: "scale(1)" }],
    { duration: 640, easing: "ease-out" }
  );
}

/* новое очко: число на мгновение раздувается и возвращается */
function bumpRecordMark() {
  const box = recordMark && recordMark.querySelector(".record-mark-box");
  if (box && box.animate) {
    box.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(1.42)", offset: 0.34 },
        { transform: "scale(0.93)", offset: 0.68 },
        { transform: "scale(1)" }
      ],
      { duration: 440, easing: "cubic-bezier(.18,1.5,.32,1)" }
    );
  }
  flashRecordMark(1.5);
}

/* появление: число влетает из угла, раздувается, вспыхивает и начинает
   покачиваться */
function revealRecordMark() {
  if (!recordMark) return;
  if (recordMark.animate) {
    /* Без filter: blur/brightness в кадре заставляют перерисовывать всю плашку
       каждый кадр анимации (на телефоне это рывок ровно в момент рекорда).
       Вспышка и раздувание читаются и на transform/opacity. */
    recordMark.animate(
      [
        { opacity: 0, transform: "translate(64px, -24px) scale(0.25)" },
        { opacity: 1, transform: "translate(-7px, 5px) scale(1.16)", offset: 0.52 },
        { opacity: 1, transform: "translate(4px, -1px) scale(0.97)", offset: 0.78 },
        { opacity: 1, transform: "none" }
      ],
      { duration: 860, easing: "cubic-bezier(.16,1.2,.3,1)" }
    );
  }
  flashRecordMark(1.8);
  startRecordSway();
  if (typeof Sfx !== "undefined" && Sfx.recordReveal) Sfx.recordReveal();
}

function syncRecordHud() {
  if (!hudRight) return;
  const beaten = !!game.bestBeaten;
  const hasBest = !!game.bestKnown;
  const num = game.recordNum | 0;
  /* Пока рекорд не перебит, число в скрытой плашке не показываем и НЕ
     пересобираем: раньше на каждом воткнутом ноже сюда уходил setCounter с
     анимацией цифр в невидимом элементе. */
  const snap = (beaten ? 1 : 0) + ":" + (hasBest ? 1 : 0) + ":" + (beaten ? num : 0);
  if (snap === recordSnap) return;
  recordSnap = snap;
  hudRight.classList.toggle("record-on", beaten);
  hudRight.classList.toggle("no-best", !beaten && !hasBest);
  if (!beaten) {
    /* рекорд ещё не перебит (или забег кончился): числа нет */
    recordShown = 0;
    stopRecordSway();
    return;
  }
  const grew = recordShown && num > recordShown;
  setCounter(recordVal, num);
  const reveal = !recordShown;
  recordShown = num;
  if (reveal) revealRecordMark();
  else if (grew) bumpRecordMark();
}

/* Ключ "что нарисовано в плашке" (размер/скин/бесконечность) — по нему решаем,
   пересобирать ли картинки. Число жизней меняется отдельно, классами. */
/* Горит ли сердце i при запасе n. Золотые (Premium) — ПЕРВЫЕ в очереди:
   они гаснут раньше обычных, а когда золотые кончатся, тратятся три обычные.
   Без Premium bonus = 0, и всё ведёт себя как раньше. */
function lifeHeartLit(i, n) {
  return i < Math.max(0, n);
}

let livesBuild = "";
function renderLives() {
  if (!livesEl) return;
  const max = game.maxLives || PLAYER_LIVES;
  /* Бесконечные жизни (галочка «❤️» в доке меню): сердца всегда полные, в
     конце плашки горит знак ∞ — иначе непонятно, почему промахи не считаются */
  const inf = !!save.infLives;
  const n = inf ? max : Math.max(0, game.lives | 0);
  const src = assets.lifeHeartUrl || assets.lifeKnifeUrl || "";
  const goldSrc = assets.lifeHeartGoldUrl || src;
  const snap = max + ":" + n + ":" + src + ":" + goldSrc + (inf ? ":inf" : "");
  if (snap === livesSnap) return;
  livesSnap = snap;
  const build = max + ":" + src + ":" + goldSrc + (inf ? ":inf" : "");
  if (build !== livesBuild) {
    livesBuild = build;
    const bits = [];
    for (let i = 0; i < max; i++) {
      const gold = i >= PLAYER_LIVES ? " gold" : "";
      const heartSrc = i >= PLAYER_LIVES ? goldSrc : src;
      bits.push(`<img class="life-heart${gold}${lifeHeartLit(i, n) ? "" : " gone"}" src="${heartSrc}" alt="">`);
    }
    if (inf) bits.push('<span class="life-inf" aria-label="бесконечные жизни">∞</span>');
    livesEl.innerHTML = bits.join("");
    return;
  }
  /* Меняется только число жизней: сердца уже стоят — гасим/зажигаем классами.
     Пересборка innerHTML — это три новых <img> с data-URL (декодирование PNG и
     раскладка), и она давала рывок ровно в кадр промаха на телефоне. */
  const hearts = livesEl.children;
  for (let i = 0; i < hearts.length && i < max; i++) {
    hearts[i].classList.toggle("gone", !lifeHeartLit(i, n));
  }
}

/* Жизнь потеряна (js/flow.js: fail): плашка с ножиками вздрагивает и вспыхивает
   — потеря видна даже боковым зрением. Класс снимаем сами, чтобы анимация не
   крутилась фоном, а перезапуск делаем через чтение offsetWidth. */
const LIVES_HURT_MS = 640;
let livesHurtTimer = 0;
let livesHurtAlt = false;

function flashLives() {
  if (!livesBox) return;
  /* Две одинаковые анимации: переключаем класс, чтобы анимация началась заново
     БЕЗ чтения offsetWidth. Это чтение заставляло браузер синхронно
     пересчитывать раскладку HUD прямо в кадр промаха. */
  livesBox.classList.remove("hurt", "hurt2");
  livesHurtAlt = !livesHurtAlt;
  livesBox.classList.add(livesHurtAlt ? "hurt" : "hurt2");
  if (livesHurtTimer) clearTimeout(livesHurtTimer);
  livesHurtTimer = setTimeout(() => {
    livesHurtTimer = 0;
    if (livesBox) livesBox.classList.remove("hurt", "hurt2");
  }, LIVES_HURT_MS);
}

/* Первый забег: новичок узнаёт, что три сердца внизу — его запас, а не декор.
   Подсказка одноразовая (флаг в localStorage). Подписи «МОИ ЖИЗНИ» в плашке
   больше нет, поэтому слова остались только здесь. */
function livesHint() {
  if (livesHintSeen) return;
  livesHintSeen = true;
  try {
    localStorage.setItem("bh_lives_hint", "1");
  } catch (err) {}
}

function renderLoadout() {
  if (!loadoutBar) return;
  const skin = knifeSkin();
  let snap = skin.id;
  for (const it of SHOP_ITEMS) {
    if (save.loadout[it.id]) snap += ":" + it.id;
  }
  if (snap === loadoutSnap) return;
  loadoutSnap = snap;
  const bits = [];
  for (const it of SHOP_ITEMS) {
    if (save.loadout[it.id]) bits.push(`<div class="loadout-chip" title="${it.name}">${it.icon}</div>`);
  }
  loadoutBar.innerHTML = bits.join("");
}

function renderHudBuffs() {
  if (!hudBuffs) return;
  const snap = (game.buffs.shield ? "1" : "0") + (game.buffs.slow ? "1" : "0") + (game.buffs.double ? "1" : "0");
  if (snap === buffSnap) return;
  buffSnap = snap;
  const bits = [];
  if (game.buffs.shield) bits.push('<div class="chip buff-pill">🛡️ ЩИТ</div>');
  if (game.buffs.slow) bits.push('<div class="chip buff-pill">❄️ МЕДЛЕННО</div>');
  if (game.buffs.double) bits.push('<div class="chip buff-pill">✨ x2</div>');
  hudBuffs.innerHTML = bits.join("");
}

/* Двойной счёт за забег («x2 яблоки» из магазина): удваивает всё, что попадает
   в кошелёк, — и награду за бой, и яблоки с бревна */
function appleGain(n) {
  return game.buffs.double ? n * 2 : n;
}

/* ---------- тосты: сообщения по очереди в одном плашке ---------- */
const TOAST_SHOW = 1900;
const toastQueue = [];
let toastTimer = 0;

function nextToast() {
  toastTimer = 0;
  if (!unlockToast) return;
  const txt = toastQueue.shift();
  if (txt == null) {
    unlockToast.classList.remove("on");
    return;
  }
  unlockToast.textContent = txt;
  unlockToast.classList.add("on");
  toastTimer = setTimeout(() => {
    unlockToast.classList.remove("on");
    toastTimer = setTimeout(nextToast, 240);
  }, TOAST_SHOW);
}

function toast(text) {
  if (!unlockToast || !text) return;
  toastQueue.push(text);
  if (!toastTimer) nextToast();
}

function clearToasts() {
  toastQueue.length = 0;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = 0;
  if (unlockToast) unlockToast.classList.remove("on");
}

/* ---------- menu: badges ---------- */
let menuBadgeSnap = "";

function setDockBadge(el, txt, tip) {
  if (!el) return;
  if (txt) {
    if (el.hidden) el.hidden = false;
    if (el.textContent !== txt) el.textContent = txt;
    el.title = tip || "";
    return;
  }
  if (!el.hidden) {
    el.hidden = true;
    el.textContent = "";
    el.title = "";
  }
}

/* Плашки на кнопках нижней панели: у «Ножей» — запас бонусов (🎒), у
   «Наград» — сколько наград уже готово к получению (js/rewards.js). */
function renderMenuBadges() {
  if (!itemsBadge) return;
  let bag = 0;
  for (const it of SHOP_ITEMS) bag += itemCount(it.id);
  const snap = String(bag);
  if (snap === menuBadgeSnap) return;
  menuBadgeSnap = snap;
  setDockBadge(itemsBadge, bag > 0 ? (bag > 9 ? "9+" : String(bag)) : "", "Предметов в запасе: " + bag);
}

function resetMenuTip() {}

function stepMenuTips() {}

/* Кнопки дорожки наград слушают сами себя в js/rewards.js. */

/* ---------- HUD всегда полный ----------
   Переключателя «убрать интерфейс» больше нет: рекорд, бафы и жизни видны
   постоянно. Старый флаг из localStorage не читаем — иначе у игроков,
   которые когда-то скрывали HUD, интерфейс остался бы пустым. */
hud.classList.remove("clean");
try { localStorage.removeItem("bh_hud_clean"); } catch (err) {}

