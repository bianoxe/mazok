/* ---------- выбитые ножи: окно на итоге забега ----------
   Тост «НОВЫЙ НОЖ» сверху убран. Нож, выбитый с босса, встаёт в очередь и
   показывается окном только когда игрок проиграл: на экране «ПРОИГРЫШ», по
   одному ножу за раз, ОК — следующий (js/flow.js: showFailOverlay). Мир под
   окном живёт своей жизнью, ввод по полю заблокирован (js/input.js), а играть
   можно сразу после последнего ОК. */
const knifeUnlockQueue = [];
let knifeUnlockTotal = 0;
let knifeUnlockOpen = false;
/* Что сделать, когда очередь ножей закончится: окно смерти показывает таблицу
   лидеров только после ножей, иначе карточка закрывает её (js/flow.js) */
let knifeUnlockAfter = null;

function knifeUnlockThen(cb) {
  knifeUnlockAfter = typeof cb === "function" ? cb : null;
}

function runKnifeUnlockAfter() {
  const cb = knifeUnlockAfter;
  knifeUnlockAfter = null;
  if (!cb) return;
  try { cb(); } catch (err) {}
}

const kuEl = document.getElementById("knifeUnlock");
const kuArt = document.getElementById("kuArt");
const kuName = document.getElementById("kuName");
const kuApply = document.getElementById("kuApply");
const kuClose = document.getElementById("kuClose");

/* Идёт показ? Если окно почему-то не встало на экран (нет элемента, класс не
   применился), ввод не держим: иначе поле намертво замолкает и игра выглядит
   зависшей. */
function knifeUnlocksActive() {
  if (!knifeUnlockOpen) return false;
  if (!kuEl || !kuEl.classList.contains("on")) {
    knifeUnlockOpen = false;
    knifeUnlockQueue.length = 0;
    knifeUnlockTotal = 0;
    return false;
  }
  return true;
}

/* Нож выбит: в очередь. Имя берём у скина — у боссовых ножей оно короче и
   ровнее, чем knifeName в карточке босса; ступень — из карточки босса.
   knifeId — конкретный нож: с босса их может выпасть несколько (knifeExtra
   в js/bosses.js), по умолчанию — свой нож босса. */
function queueKnifeUnlock(boss, knifeId) {
  if (!boss) return;
  const id = knifeId || boss.id;
  const skin = KNIFE_SKINS.find(s => s.id === id);
  knifeUnlockQueue.push({
    id: id,
    name: "НОВЫЙ НОЖ",
    boss: boss.name || "",
    tier: bossTierOf(boss)
  });
}

function paintKnifeUnlockArt(id) {
  if (!kuArt || typeof kuArt.getContext !== "function") return;
  const g = kuArt.getContext("2d");
  if (!g) return;
  g.clearRect(0, 0, kuArt.width, kuArt.height);
  const img = assets.knives && assets.knives[id];
  if (!img) return;
  const scale = Math.min(kuArt.width / img.width, kuArt.height / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  g.drawImage(img, (kuArt.width - dw) * 0.5, (kuArt.height - dh) * 0.5, dw, dh);
}

/* Перезапуск анимации ножа при смене карточки: снять/вернуть анимацию. */
function replayKnifeUnlockArt() {
  if (!kuArt) return;
  kuArt.style.animation = "none";
  void kuArt.offsetWidth;
  kuArt.style.animation = "";
}

function showKnifeUnlockCard() {
  const it = knifeUnlockQueue[0];
  if (!it || !kuEl) return false;
  /* Цвет свечения: у ножа с босса — цвет ступени, у случайного ножа — цвет
     страницы коллекции (js/knife-book.js: randomUnlockShowCard кладёт свой color) */
  const meta = bossTierMeta(it.tier);
  kuEl.style.setProperty("--ku-col", it.color || (meta && meta.color) || "#c45c3e");
  if (kuName) kuName.textContent = "Новый нож";
  paintKnifeUnlockArt(it.id);
  replayKnifeUnlockArt();
  return true;
}

/* Карточки новых ножей идут МОЛЧА: тиканье с эхом из них убрано. Единственные
   тики в игре — пять сухих ударов на сцене смерти (js/sim.js: Sfx.deathBeat),
   пока гаснет нож. Таймер оставлен пустым, чтобы не трогать вызовы ниже. */
let kuTickTimer = 0;

function startKnifeTick() {
  stopKnifeTick();
}

function stopKnifeTick() {
  if (!kuTickTimer) return;
  clearInterval(kuTickTimer);
  kuTickTimer = 0;
}

/* Показ очереди: возвращает true, если окно открылось (играть пока нельзя). */
function beginKnifeUnlocks() {
  if (knifeUnlockOpen || !knifeUnlockQueue.length || !kuEl) return false;
  knifeUnlockTotal = knifeUnlockQueue.length;
  let ok = false;
  try {
    ok = showKnifeUnlockCard();
  } catch (err) {
    ok = false;
    if (window.console && console.error) console.error("нож: карточка", err);
  }
  if (!ok) {
    /* карточку не собрали — окно не показываем и ввод не запираем */
    knifeUnlockQueue.length = 0;
    knifeUnlockTotal = 0;
    closeKnifeUnlocks();
    return false;
  }
  knifeUnlockOpen = true;
  kuEl.classList.remove("on", "out");
  /* класс ставим сразу, в этом же кадре: окно не должно остаться невидимым
     до следующего requestAnimationFrame (тогда поле молчит без причины) */
  void kuEl.offsetWidth;
  kuEl.classList.add("on");
  if (typeof Sfx !== "undefined") Sfx.rarity(knifeUnlockQueue[0].tier);
  startKnifeTick();
  return true;
}

function closeKnifeUnlocks() {
  knifeUnlockOpen = false;
  stopKnifeTick();
  if (kuEl) kuEl.classList.remove("on", "out");
}

/* Закрыть показ целиком (Esc): остальные ножи уже в коллекции, но держать
   игрока в окне нельзя — способ выйти должен быть всегда. */
function dismissKnifeUnlocks() {
  knifeUnlockQueue.length = 0;
  knifeUnlockTotal = 0;
  closeKnifeUnlocks();
  /* ножи закрыты — теперь можно показать таблицу лидеров */
  runKnifeUnlockAfter();
}

/* ОК: карточка уезжает, встаёт следующая (или окно закрывается). */
function advanceKnifeUnlock() {
  if (!knifeUnlockOpen || !kuEl || kuEl.classList.contains("out")) return;
  if (typeof Sfx !== "undefined") Sfx.pick();
  kuEl.classList.add("out");
  setTimeout(() => {
    if (!knifeUnlockOpen) return;
    knifeUnlockQueue.shift();
    if (!knifeUnlockQueue.length) {
      closeKnifeUnlocks();
      /* последний нож закрыт — очередь дошла до таблицы лидеров */
      runKnifeUnlockAfter();
      return;
    }
    let ok = false;
    try {
      ok = showKnifeUnlockCard();
    } catch (err) {
      ok = false;
      if (window.console && console.error) console.error("нож: карточка", err);
    }
    if (!ok) {
      dismissKnifeUnlocks();
      return;
    }
    kuEl.classList.remove("out", "on");
    void kuEl.offsetWidth;
    kuEl.classList.add("on");
    if (typeof Sfx !== "undefined") Sfx.rarity(knifeUnlockQueue[0].tier);
  }, 200);
}

/* Смена забега/меню: очередь сбрасывается, окно убирается без анимации. */
function resetKnifeUnlocks() {
  knifeUnlockQueue.length = 0;
  knifeUnlockTotal = 0;
  knifeUnlockAfter = null;
  closeKnifeUnlocks();
}

function applyKnifeUnlock() {
  if (!knifeUnlockOpen || !kuEl || kuEl.classList.contains("out")) return;
  const it = knifeUnlockQueue[0];
  if (it) {
    try {
      if (typeof equipKnife === "function") equipKnife(it.id);
      else {
        save.knife = it.id;
        save.rnd = false;
        if (typeof persist === "function") persist();
        if (typeof renderLoadout === "function") renderLoadout();
      }
      if (typeof syncHud === "function") syncHud();
      if (typeof knifeBookRefresh === "function") knifeBookRefresh();
    } catch (err) {}
    try {
      if (typeof Analytics !== "undefined" && Analytics.knifeApply) {
        const skin = KNIFE_SKINS.find(s => s.id === it.id);
        Analytics.knifeApply(it.id, (skin && skin.name) || it.id);
      }
    } catch (err) {}
  }
  if (typeof Sfx !== "undefined") {
    try { Sfx.ensure(); Sfx.pick(); } catch (err) {}
  }
  advanceKnifeUnlock();
}

if (kuApply) {
  kuApply.addEventListener("click", e => {
    e.stopPropagation();
    applyKnifeUnlock();
  });
}
if (kuClose) {
  kuClose.addEventListener("click", e => {
    e.stopPropagation();
    dismissKnifeUnlocks();
  });
}

