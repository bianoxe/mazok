(function () {
  const RESUME_KEY = "bh_resume";
  let pendingRun = null;

  function readResume() {
    try {
      const raw = localStorage.getItem(RESUME_KEY);
      if (!raw) return null;
      const r = JSON.parse(raw);
      if (!r || !(r.level > 0)) return null;
      return { level: r.level | 0, lives: r.lives | 0 };
    } catch (e) {
      return null;
    }
  }
  function writeResume(r) {
    try { localStorage.setItem(RESUME_KEY, JSON.stringify(r)); } catch (e) {}
  }
  function clearResume() {
    pendingRun = null;
    try { localStorage.removeItem(RESUME_KEY); } catch (e) {}
  }

  function syncResumeButton() {
    if (!resumeBtn) return;
    if (!pendingRun) pendingRun = readResume();
    resumeBtn.hidden = !pendingRun;
    if (pendingRun && resumeLevel) resumeLevel.textContent = String(pendingRun.level);
  }

  function askOpen() {
    if (!exitAsk) return false;
    return !exitAsk.hidden;
  }
  function openAsk() {
    if (!exitAsk) return;
    exitAsk.hidden = false;
    exitAsk.classList.add("on");
  }
  function closeAsk() {
    if (!exitAsk) return;
    exitAsk.hidden = true;
    exitAsk.classList.remove("on");
  }

  /* Уходим в меню, запомнив уровень и жизни: в меню появится «ПРОДОЛЖИТЬ» */
  function saveAndLeave() {
    pendingRun = { level: Math.max(1, game.level | 0), lives: Math.max(0, game.lives | 0) };
    writeResume(pendingRun);
    closeAsk();
    clearFlying();
    clearStuck();
    enterMenu();
    syncResumeButton();
  }

  /* Кнопка выхода / Esc. До первого босса выходим сразу, на боссе и дальше —
     спрашиваем подтверждение. */
  function requestExitLevel() {
    if (askOpen()) {
      closeAsk();
      return;
    }
    if (state !== "play") return;
    if (!isBoss(game.level)) {
      saveAndLeave();
      return;
    }
    openAsk();
  }

  function resumeRun() {
    if (state !== "menu" || sheetMode) return;
    const r = pendingRun || readResume();
    if (!r) return;
    const lvl = Math.max(1, r.level | 0);
    const lives = Math.max(0, r.lives | 0);
    clearResume();
    menuEl.classList.add("hidden");
    startRun();
    if (state !== "play") return;
    startLevel(lvl, true);
    if (lives > 0 && lives < game.lives) game.lives = lives;
    syncHud();
    syncResumeButton();
  }

  if (exitAskYes) {
    exitAskYes.addEventListener("click", e => {
      e.stopPropagation();
      if (state === "play") saveAndLeave();
      else closeAsk();
    });
  }
  if (exitAskClose) {
    exitAskClose.addEventListener("click", e => {
      e.stopPropagation();
      closeAsk();
    });
  }
  /* клик по любой зоне вне окна — отмена */
  if (exitAsk) {
    exitAsk.addEventListener("click", e => {
      if (e.target === exitAsk) closeAsk();
    });
  }
  if (resumeBtn) {
    resumeBtn.addEventListener("click", e => {
      e.stopPropagation();
      resumeRun();
    });
  }

  window.requestExitLevel = requestExitLevel;
  window.syncResumeButton = syncResumeButton;
  window.resumeRun = resumeRun;
  window.exitAskOpen = askOpen;

  syncResumeButton();
})();
