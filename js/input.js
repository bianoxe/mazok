/* ---------- input ---------- */
/* Возврат в окно: САМЫЙ ПЕРВЫЙ клик/тап после ухода только возвращает фокус
   окну — нож на нём не бросается. Иначе игрок, кликая в браузер из другого
   окна/вкладки, терял жизнь на «слепом» броске: браузер успевал отдать клик
   странице ещё до того, как окно становилось основным. Второе нажатие уже
   работает как обычно. Флаг ставится на blur и на скрытие вкладки, снимается
   первым pointerdown (или Space/Enter — клавишами броска). */
let inputRefocus = false;

function markInputBlind() {
  inputRefocus = true;
  if (typeof clearThrowBuffer === "function") clearThrowBuffer();
}

/* Первое нажатие после возврата будит окно: помечаем сам event, чтобы игровые
   обработчики пропустили именно его, а кнопки интерфейса продолжили работать.
   Флаг снимаем здесь же — следующее нажатие уже бросает нож. */
function markFirstPointer(e) {
  if (!inputRefocus) return;
  inputRefocus = false;
  if (e) e.__bhFocusOnly = true;
}

/* Клавиши броска после возврата тоже не должны стрелять вслепую. Остальные
   клавиши (Esc, стрелки, настройки) работают сразу — они не бросают нож. */
function markFirstKey(e) {
  if (!inputRefocus) return;
  inputRefocus = false;
  if (!e) return;
  if (e.code === "Space" || e.code === "Enter" || e.code === "NumpadEnter") {
    e.__bhFocusOnly = true;
  }
}

function onPointer(e) {
  /* клик, которым вернулись в окно, уже ушёл на фокус */
  if (e && e.__bhFocusOnly) return;
  /* открыт ник/отзыв/админка: поле игры под ними не работает */
  if (typeof Analytics !== "undefined" && Analytics.blockInput()) return;
  if (e && e.button != null && e.button !== 0) return;
  /* Поле — только сама сцена. Кнопки дока/магазина/окон лежат внутри #stage и
     всплывают сюда же: их нажатие не должно бросать нож. */
  if (e && e.target && e.target !== stage) return;
  /* Пауза (свернули окно, ролик площадки): клик не бросает нож и не начинает
     забег. Иначе нажатия копятся в паузе и вылетают разом после неё */
  if (GamePause.on) return;
  /* Открыта панель «Ещё»: тап по полю её закрывает, а не начинает забег —
     иначе игрок попадал бы в игру, целясь мимо плитки */
  if (moreOpened()) { closeMore(); return; }
  /* звук не должен съедать нажатие: если аудио не поднялось, бросок всё равно
     обязан пройти */
  try { Sfx.ensure(); } catch (err) {}
  if (overlayOpen()) return;
  if (knifeUnlocksActive()) return;
  if (sheetMode) return;
  /* клик по полю и начинает забег, и бросает первый нож: startRun сам не бросает,
     иначе нож улетал бы и от клика в магазине */
  if (state === "menu") { statClick(); startRun(); if (state === "play") throwKnife(e); return; }
  if (state === "fail" || state === "shatter" || state === "victory") return;
  throwKnife(e);
}

/* Продолжаем кликом по любому месту окна: отдельной кнопки на плашке нет
   (index.html: надпись «Нажмите, чтобы продолжить») */
overlay.addEventListener("click", e => {
  e.stopPropagation();
  Sfx.ensure();
  dismissFailOverlay();
});

/* Кнопка ролика на смерти: +2 жизни и продолжаем (js/flow.js: tryReviveByAd) */
if (reviveBtn) {
  reviveBtn.addEventListener("click", e => {
    e.stopPropagation();
    try { Sfx.ensure(); } catch (err) {}
    tryReviveByAd();
  });
}
/* «Нет, спасибо» на сцене смерти: пропускает её сразу к итогу (появляется через
   DEATH_SKIP_DELAY, раньше кнопки нет вовсе) */
if (deathSkip) {
  deathSkip.addEventListener("click", e => {
    e.stopPropagation();
    if ((game.deathT || 0) < DEATH_SCENE_DELAY + DEATH_SKIP_DELAY) return;
    endDeathScene();
  });
}
/* клик по любому пустому месту во время сцены смерти — скип, но только через
   DEATH_SKIP_DELAY после её появления (кнопка ролика гасит всплытие) */
document.addEventListener("click", () => {
  if (state !== "fail" || game.deathDone) return;
  if ((game.deathT || 0) < DEATH_SCENE_DELAY + DEATH_SKIP_DELAY) return;
  endDeathScene();
});

if (levelBtn) {
  levelBtn.addEventListener("click", e => {
    e.stopPropagation();
    openSheet("levels");
  });
}
if (rewardsBtn) {
  rewardsBtn.addEventListener("click", e => {
    e.stopPropagation();
    openRewardWindow();
  });
}
itemsBtn.addEventListener("click", e => {
  e.stopPropagation();
  /* «Ножи» — книга на столе во весь экран (js/knife-book.js), не лист */
  if (typeof openKnifeBook === "function") openKnifeBook();
  else openSheet("items");
});
/* «Магазин» — отдельная сцена с наборами валюты (js/shop-scene.js) */
if (shopBtn) {
  shopBtn.addEventListener("click", e => {
    e.stopPropagation();
    openShopScene();
  });
}
if (bossesBtn) {
  bossesBtn.addEventListener("click", e => {
    e.stopPropagation();
    openSheet("bosses");
  });
}
if (genBtn) {
  genBtn.addEventListener("click", e => {
    e.stopPropagation();
    openSheet("gen");
  });
}
if (statsBtn) {
  statsBtn.addEventListener("click", e => {
    e.stopPropagation();
    openSheet("stats");
  });
}
/* Чит-кнопка «🎁» в доке: одно нажатие — все ножи, полный запас предметов и
   бесконечные яблоки (js/shop.js: cheatUnlockAll). Подтверждения нет нарочно:
   кнопка для того и стоит, чтобы выдать всё сразу. */
if (cheatBtn) {
  cheatBtn.addEventListener("click", e => {
    e.stopPropagation();
    e.preventDefault();
    cheatUnlockAll();
  });
}
if (freeApplesBtn) {
  freeApplesBtn.addEventListener("click", e => {
    e.stopPropagation();
    e.preventDefault();
    /* Раз в 5 минут — ролик и случайные 200–500 яблок (js/analytics.js).
       Бесплатных яблок по клику больше нет: это была бесконечная валюта. */
    if (typeof Analytics !== "undefined") Analytics.claimFreeApples();
  });
}
/* Вкладка «🏆» в доке меню: таблица лидеров отдельным полноэкранным окном —
   тем же кадром, что после смерти (js/leaderboard.js: openLbMenu) */
if (lbBtn) {
  lbBtn.addEventListener("click", e => {
    e.stopPropagation();
    openLbMenu();
  });
}
sheetClose.addEventListener("click", e => {
  e.stopPropagation();
  closeSheet();
});
sheetBack.addEventListener("click", e => {
  e.stopPropagation();
  closeSheet();
});
/* ---------- меню: большая кнопка «Играть» и панель «Ещё» ----------
   В меню должна быть одна очевидная дверь: кнопка по центру. Всё, что не нужно
   каждый раз, убрано в «Ещё» — на экране не остаётся девяти кружков. */
function moreOpened() {
  return !!(menuMore && !menuMore.hidden);
}

function setMoreOpen(on) {
  if (!menuMore) return;
  menuMore.hidden = !on;
  if (moreBtn) {
    moreBtn.classList.toggle("on", !!on);
    moreBtn.setAttribute("aria-expanded", on ? "true" : "false");
  }
  /* затемнение панели не должно спорить с кружком звука в углу */
  if (menuEl) menuEl.classList.toggle("more-open", !!on);
}

function closeMore() {
  setMoreOpen(false);
}

if (moreBtn) {
  moreBtn.addEventListener("click", e => {
    e.preventDefault();
    e.stopPropagation();
    setMoreOpen(!moreOpened());
  });
}
if (menuMoreBack) {
  menuMoreBack.addEventListener("click", e => {
    e.stopPropagation();
    closeMore();
  });
}
if (menuMoreClose) {
  menuMoreClose.addEventListener("click", e => {
    e.stopPropagation();
    closeMore();
  });
}
/* Плитка, которая открывает своё окно, закрывает панель. Звуки и «жизни»
   оставляем открытыми: их листают и проверяют несколько раз подряд.
   Слушаем в фазе перехвата: обработчики самих плиток гасят всплытие. */
if (menuMore) {
  menuMore.addEventListener("click", e => {
    const t = e.target;
    if (!t || !t.closest) return;
    if (t.closest(".more-sound") || t.closest("#infLivesBtn")) return;
    if (t.closest("button")) closeMore();
  }, true);
}
/* «Клавиши» открывают существующую панель настроек (index.html: #kkeys).
   Сама кнопка ⚙ спрятана — в доке она больше не нужна. */
if (keysBtn) {
  keysBtn.addEventListener("click", e => {
    e.stopPropagation();
    const b = document.getElementById("kkeysBtn");
    if (b) b.click();
  });
}
/* Меню: забег начинает только тап по полю — отдельной кнопки «Играть» больше
   нет (js/input.js: onPointer, ветка state === "menu"). */
/* Поле — это #stage (он лежит ПОВЕРХ полотна, js/mobile.js уводит канву в свой
   слой без CSS-масштаба). Клик по пустому месту доходит до сцены: у HUD и меню
   pointer-events: none. Кнопки гасят всплытие сами. */
stage.addEventListener("pointerdown", onPointer);
/* ЛКМ при зажатой ПКМ: пока указатель уже активен, браузер НЕ шлёт второй
   pointerdown — нажатие приходит только как mousedown, и нож не летел.
   Ловим именно этот случай: ЛКМ вместе с ПКМ/средней кнопкой. Обычный первый
   клик и синтетический mousedown с тапа сюда не попадают — двойного броска нет. */
stage.addEventListener("mousedown", e => {
  if (e.button !== 0 || !(e.buttons & 6)) return;
  onPointer(e);
});
window.addEventListener("keydown", e => {
  /* первое нажатие после возврата в окно — только фокус, не бросок */
  if (e && e.__bhFocusOnly) return;
  /* ник/отзыв/админка: клавиатура игры под ними молчит, иначе пробел
     запускал бы забег за спиной у формы */
  if (typeof Analytics !== "undefined" && Analytics.blockInput()) return;
  /* книга ножей: стрелки листают, Esc закрывает, остальное не проходит в игру */
  if (typeof knifeBookOpened === "function" && knifeBookOpened()) {
    if (e.code === "Escape") {
      e.preventDefault();
      closeKnifeBook();
    } else if (e.code === "ArrowUp" || e.code === "ArrowLeft" || e.code === "PageUp") {
      e.preventDefault();
      if (typeof bookScrollBy === "function") bookScrollBy(-1);
    } else if (e.code === "ArrowDown" || e.code === "ArrowRight" || e.code === "PageDown") {
      e.preventDefault();
      if (typeof bookScrollBy === "function") bookScrollBy(1);
    } else if (e.code === "Home" || e.code === "End") {
      e.preventDefault();
      if (typeof bookScrollEdge === "function") bookScrollEdge(e.code === "Home");
    }
    return;
  }
  /* окно выбитого ножа: пробел/энтер — это «ОК», Esc — закрыть всё,
     поле не бросает */
  if (knifeUnlocksActive()) {
    if (e.code === "Space" || e.code === "Enter" || e.code === "NumpadEnter") {
      e.preventDefault();
      advanceKnifeUnlock();
    } else if (e.code === "Escape") {
      e.preventDefault();
      dismissKnifeUnlocks();
    }
    return;
  }
  /* Открыта панель «Ещё»: Esc её закрывает, остальные клавиши в игру не
     проваливаются — иначе пробел запускал забег за спиной у панели */
  if (moreOpened()) {
    if (e.code === "Escape") {
      e.preventDefault();
      closeMore();
    }
    return;
  }
  /* Магазин (js/shop-scene.js) — отдельная сцена: Esc закрывает, остальные
     клавиши в игру не проваливаются */
  if (typeof shopSceneOpened === "function" && shopSceneOpened()) {
    if (e.code === "Escape") {
      e.preventDefault();
      closeShopScene();
    }
    return;
  }
  if (e.code === "Escape" && typeof rewardWindowOpened === "function" && rewardWindowOpened()) {
    e.preventDefault();
    closeRewardWindow();
    return;
  }
  if (e.code === "Escape" && sheetMode) {
    e.preventDefault();
    closeSheet();
    return;
  }
  /* Выход из уровня: Esc в игре (до первого босса — сразу, на боссе — окно
     подтверждения; повторный Esc в окне — отмена) */
  if (e.code === "Escape" && (state === "play" || (typeof exitAskOpen === "function" && exitAskOpen()))) {
    e.preventDefault();
    if (typeof requestExitLevel === "function") requestExitLevel();
    return;
  }
  if (state === "menu" && !sheetMode && !overlayOpen() &&
      !(typeof rewardWindowOpened === "function" && rewardWindowOpened()) &&
      (e.code === "KeyR" || e.code === "KeyL")) {
    e.preventDefault();
    if (e.code === "KeyR") openRewardWindow();
    else openSheet("levels");
    return;
  }
  if (e.code === "Space" || e.code === "Enter") {
    e.preventDefault();
    if (overlayOpen()) { dismissFailOverlay(); return; }
    if (sheetMode) return;
    if (typeof rewardWindowOpened === "function" && rewardWindowOpened()) return;
    if (state === "menu") {
      startRun();
      if (state === "play") throwKnife(e);
    } else if (state === "play") throwKnife(e);
  }
});
window.addEventListener("resize", requestResize);
if (window.visualViewport) {
  visualViewport.addEventListener("resize", requestResize);
  visualViewport.addEventListener("scroll", requestResize);
}
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    persist();
    /* вкладку свернули/переключили: первый клик по возвращении — только фокус */
    markInputBlind();
  } else if (typeof clearThrowBuffer === "function") {
    clearThrowBuffer();
  }
});

/* ---------- курсор ----------
   Канва — игровое поле, а не кнопка. Раньше рука (pointer) висела на всём поле:
   и над надписью «Нажмите, чтобы играть», и над бревном — из-за этого казалось,
   что кликабельно всё подряд. Теперь над полем ВСЕГДА обычная стрелка, в любом
   состоянии игры, а рука осталась только у настоящих кнопок: док, ползунки,
   карточки листов (css/style.css: .dock-btn, .card-btn и т.д.). */
function syncCanvasCursor() {
  if (canvas.style.cursor !== "default") canvas.style.cursor = "default";
}

/* Фокус окна: уход (blur) и скрытие вкладки ставят «первый клик — только
   фокус». Возврат (focus) лишь чистит очередь нажатий: снимать флаг здесь
   нельзя — иначе клик, которым игрок вернулся из другого окна, снова бросал бы
   нож. Сам флаг снимает первый pointerdown / клавиша броска (markFirstPointer,
   markFirstKey). */
window.addEventListener("focus", () => {
  if (typeof clearThrowBuffer === "function") clearThrowBuffer();
});
window.addEventListener("blur", markInputBlind);
document.addEventListener("pointerdown", markFirstPointer, true);
document.addEventListener("mousedown", markFirstPointer, true);
document.addEventListener("keydown", markFirstKey, true);

window.addEventListener("pagehide", persist);
document.addEventListener("gesturestart", e => e.preventDefault());
/* это игра, а не страница: ПКМ не открывает контекстное меню, текст и картинки не
   выделяются, средней кнопкой не включается автопрокрутка, а drag не тянет
   элементы. Игровые кнопки мыши при этом не трогаем — pointerdown/pointerup
   доходят до канвы как обычно */
document.addEventListener("contextmenu", e => e.preventDefault());
document.addEventListener("selectstart", e => {
  const t = e.target;
  if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
  e.preventDefault();
});
document.addEventListener("dragstart", e => e.preventDefault());
document.addEventListener("mousedown", e => {
  if (e.button === 1) e.preventDefault();
});
document.addEventListener("touchmove", e => {
  /* Прокручиваемые списки и ленты листаются пальцем сами: коллекция ножей,
     магазин, генератор и лист предметов. Всё остальное — игровое поле,
     где браузерный скролл/зум запрещён. */
  if (e.target.closest && e.target.closest(".sheet-body, .kb-scroll, .shop-grid, .gen-list, .an-card, .an-textarea, .ap-list, .ap-main, .ap-events, .ap-replay, #adminPanel")) return;
  e.preventDefault();
}, { passive: false });

const RESET_HOLD = 900;
let resetHold = null;
let resetRaf = 0;

function paintReset(p) {
  if (resetFill) resetFill.style.transform = "scaleX(" + p + ")";
}

function resetProgress() {
  game.apples = 0;
  /* рубли «с нуля»: снова стартовые 350. «Потрачено за всё время» НЕ обнуляем:
     это статистика профиля, а не баланс. История покупок тоже остаётся. */
  save.rubles = RUBLES_START;
  save.freeAppleAt = 0;
  save.randBuys = 0;
  save.best = 0;
  /* дорожка наград тоже с нуля: первая ячейка доступна сразу */
  save.rtIdx = 0;
  save.rtNextAt = 0;
  /* «с нуля» — и стадия тоже: иначе в меню остался бы прежний рекордный уровень */
  save.bestLevel = 0;
  save.owned = ["classic"];
  save.knife = "classic";
  save.items = {};
  save.loadout = {};
  /* Рандомизатор ножей из альманаха тоже гаснет: «с нуля» — значит и он */
  save.rnd = false;
  save.rndOwn = false;
  save.rndPool = [];
  /* Сброс выключает и чит: бесконечные яблоки и бесконечные жизни не должны
     пережить «с нуля» */
  save.inf = false;
  save.infLives = false;
  /* Прогресс обнуляем целиком — статистика игрока тоже с нуля */
  resetStats();
  /* Мешок боссов тоже с нуля: иначе «с нуля» начиналось бы с середины круга */
  if (typeof bossBagReset === "function") bossBagReset();
  persist();
  hudSnap = "";
  loadoutSnap = "";
  clearToasts();
  if (resetLabel) resetLabel.textContent = "✓";
  setTimeout(() => {
    if (resetLabel) resetLabel.textContent = "↺";
  }, 900);
  if (state === "menu") armFirstLog();
  syncHud();
  if (sheetMode) renderSheet();
}

function cancelReset(e) {
  if (!resetHold) return;
  if (e && e.pointerId != null && resetHold.id !== e.pointerId) return;
  resetHold = null;
  cancelAnimationFrame(resetRaf);
  paintReset(0);
}

if (resetBtn) {
  resetBtn.addEventListener("pointerdown", e => {
    e.stopPropagation();
    e.preventDefault();
    if (resetHold) return;
    try { resetBtn.setPointerCapture(e.pointerId); } catch (err) {}
    resetHold = { id: e.pointerId, start: performance.now() };
    const tick = () => {
      if (!resetHold) return;
      const p = clamp((performance.now() - resetHold.start) / RESET_HOLD, 0, 1);
      paintReset(p);
      if (p >= 1) {
        resetHold = null;
        paintReset(0);
        resetProgress();
        return;
      }
      resetRaf = requestAnimationFrame(tick);
    };
    resetRaf = requestAnimationFrame(tick);
  });
  resetBtn.addEventListener("pointerup", cancelReset);
  resetBtn.addEventListener("pointercancel", cancelReset);
}

function bootGame() {
  /* последний тяжёлый шаг — сборка атласов, заставка ещё на виду */
  if (window.GameLoader) window.GameLoader.stage("СОБИРАЕМ МИР");
  buildAssets();
  resize();
  kickBootFonts();
  /* Текст на холсте (ленты «БОСС» / «ПОВЕРЖЕН», полоска HP) прогреваем сразу:
     первый рисунок крупной надписи иначе растрирует глифы прямо в анимации.
     Если шрифты ещё не доехали, прогреются запасные, а когда придут настоящие,
     document.fonts.ready прогреет их ещё раз (ниже). */
  if (typeof prewarmCanvasTexts === "function") prewarmCanvasTexts();
  if (typeof prewarmAppleRims === "function") prewarmAppleRims();
  /* Звук: создаём AudioContext и шумовой буфер за заставкой. Иначе это делает
     первый удар — а создание контекста на телефоне стоит десятки миллисекунд
     и встаёт ровно в кадр попадания. Контекст стартует «suspended» и
     просыпается на первом касании (js/sfx.js: unlock), это нормально. */
  try { if (typeof Sfx !== "undefined" && Sfx.ensure) Sfx.ensure(); } catch (err) {}
  /* И сразу начинаем печь частые звуки в буферы: пока игрок читает меню и
     целится, первый удар уже не будет собирать узлы WebAudio в кадре. */
  try {
    if (typeof Sfx !== "undefined" && Sfx._warmBuffers) {
      setTimeout(function () { try { Sfx._warmBuffers(); } catch (err) {} }, 80);
    }
  } catch (err) {}
  enterMenu();
  /* Сцену первого босса прогреваем уже сейчас, за заставкой: дальше останутся
     только проверки кэша. Так первый босс не печёт пелену/слово/меч в кадре. */
  if (typeof armStingWarm === "function") { try { armStingWarm(); } catch (err) {} }
  /* HUD теперь всегда в layout (css/style.css: #hud display:block + visibility):
     считаем его размеры здесь, пока висит заставка, чтобы первый кадр игры не
     платил за полный layout кадра (замер: tools/_launch_trace.js). */
  if (typeof hud !== "undefined" && hud) { try { void hud.offsetWidth; } catch (err) {} }
  /* отметка для живых прогонов в headless Chrome (tools/_lb_probe.js): до неё
     окно смерти ещё не значит ничего — bootGame сам вернёт меню */
  window.gameBooted = true;
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      if (logBake) logBake.face = -1;
      if (logAhead) logAhead.face = -1;
      /* Крупный текст на холсте — дорогая операция (замер: до 90 мс на 3× CPU).
         Если шрифты приехали уже в бою, не встаём в игровой кадр: прогреем в
         ближайшем меню. */
      if (state === "play" || state === "shatter" || state === "victory" || state === "fail") {
        window.__canvasTextWarmPending = true;
      } else if (typeof prewarmCanvasTexts === "function") {
        prewarmCanvasTexts();
      }
    });
  }
  requestAnimationFrame(loop);
  /* экран загрузки уходит только здесь, когда меню уже работает:
     js/loader.js и LoadingAPI.ready() ждут именно этого (js/yandex.js) */
  if (window.GameLoader) window.GameLoader.finish(menuLogIntro);
  else menuLogIntro();
}

/* Шрифты витрины и сцен тянем СРАЗУ, не дожидаясь картинок: загрузка игры
   идёт параллельно, так что к моменту сборки мира они обычно уже на месте. */
function kickBootFonts() {
  if (!(document.fonts && document.fonts.load)) return;
  const want = [
    "900 16px Unbounded", "800 16px Unbounded", "700 16px Unbounded",
    "800 16px Manrope", "700 16px Manrope"
  ];
  for (let i = 0; i < want.length; i++) {
    try {
      const p = document.fonts.load(want[i], "АБВ");
      if (p && p.catch) p.catch(() => {});
    } catch (err) {}
  }
}
kickBootFonts();

/* Бревно в меню выезжает тем же пружинным интро, что и на старте уровня
   (js/sim.js: game.intro + easeOutBack). Отсчёт начинаем, когда заставка уже
   поплыла, — иначе анимация целиком спряталась бы за ней. armFirstLog ставит
   scale = 1 (js/flow.js), поэтому сбрасываем размер здесь, после enterMenu. */
function menuLogIntro() {
  setTimeout(function () {
    /* игрок уже мог начать забег, пока заставка гасла: тогда интро не нужно,
       иначе бревно сжалось бы посреди игры */
    if (state !== "menu") return;
    game.log.scale = 0.001;
    /* ровно тот же пружинный интро, что и на старте уровня (js/sim.js:
       game.intro + easeOutBack, INTRO_DUR): бревно выезжает с перелётом.
       Отсчёт стартует в середине фейда заставки — так выезд видно, а не
       «бревно уже стоит», как было бы при мгновенном показе меню */
    game.intro = INTRO_DUR;
  }, 150);
}

loadGameImages(bootGame);
