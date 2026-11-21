/* ---------- плашки звуков бревна ----------
   Две плитки в меню, в панели «Ещё»: «удар» — нож вошёл в бревно, «разлом» —
   бревно разлетается в конце уровня. У каждой свой набор (js/sfx.js: stick /
   logCrack): у удара пять характеров, у разлома восемь. Клик листает по кругу
   и сразу играет выбранный, чтобы выбирать на слух. Номера лежат в
   localStorage и переживают перезагрузку. Меняется только само бревно: у
   боссов свой материал (Sfx.bossStick / Sfx.bossCrack), их эти плашки не
   трогают. В забеге их нет: HUD не должен обрастать лишними надписями. */

/* Общий биндер: подпись, счётчик, круговой клик и вспышка. Возвращает paint,
   чтобы обновить плашку после программной смены номера. */
function bindSoundPill(cfg) {
  const btn = cfg.btn;
  function paint() {
    if (!btn) return;
    const names = cfg.names;
    const raw = cfg.get() | 0;
    const i = raw >= 0 && raw < names.length ? raw : 0;
    const name = names[i];
    if (cfg.nameEl) cfg.nameEl.textContent = name;
    if (cfg.numEl) cfg.numEl.textContent = (i + 1) + "/" + names.length;
    const tip = cfg.title + ": " + name + " · нажмите, чтобы сменить";
    btn.title = tip;
    btn.setAttribute("aria-label", tip);
  }
  if (btn) {
    btn.addEventListener("click", e => {
      /* клик по плашке — не бросок ножа: поле слушает только саму сцену, но
         всплытие гасим и здесь, чтобы нажатие не дошло до общих обработчиков */
      e.stopPropagation();
      e.preventDefault();
      cfg.next();
      paint();
      /* короткая вспышка: смена видна даже при выключенном звуке */
      btn.classList.remove("bump");
      void btn.offsetWidth;
      btn.classList.add("bump");
    });
  }
  paint();
  return paint;
}

function writeSoundChoice(key, value) {
  try { localStorage.setItem(key, String(value)); } catch (err) {}
}

function previewSound(fn) {
  try { Sfx.ensure(); } catch (err) {}
  fn();
}

/* ---------- удар ножа в бревно ---------- */
function applyStickSound(i) {
  const n = STICK_SOUND_NAMES.length;
  stickSound = ((i | 0) % n + n) % n;
  writeSoundChoice(STICK_SOUND_KEY, stickSound);
}

const paintStickSound = bindSoundPill({
  btn: stickSoundBtn,
  nameEl: stickSoundName,
  numEl: stickSoundNum,
  names: STICK_SOUND_NAMES,
  title: "Звук попадания в бревно",
  get: () => stickSound,
  next: () => {
    applyStickSound(stickSound + 1);
    /* без предпросмотра выбирать на слух невозможно */
    previewSound(() => Sfx.stick());
  }
});

/* программная смена (проверки, отладка): номер + подпись + предпросмотр */
function setStickSound(i) {
  applyStickSound(i);
  paintStickSound();
  previewSound(() => Sfx.stick());
}

/* ---------- разлом бревна ---------- */
function applyLogCrackSound(i) {
  const n = LOG_CRACK_NAMES.length;
  logCrackSound = ((i | 0) % n + n) % n;
  writeSoundChoice(LOG_CRACK_KEY, logCrackSound);
}

const paintLogCrackSound = bindSoundPill({
  btn: logCrackBtn,
  nameEl: logCrackName,
  numEl: logCrackNum,
  names: LOG_CRACK_NAMES,
  title: "Звук разлома бревна",
  get: () => logCrackSound,
  next: () => {
    applyLogCrackSound(logCrackSound + 1);
    previewSound(() => Sfx.logCrack());
  }
});

function setLogCrackSound(i) {
  applyLogCrackSound(i);
  paintLogCrackSound();
  previewSound(() => Sfx.logCrack());
}
