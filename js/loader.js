/* ---------- загрузочный экран ----------
   Прогресс честный: 12% — движок (скрипты распарсены, пошли файлы), 12→99% —
   реально загруженные картинки (GameLoader.imgDone зовут js/assets.js и
   js/knife.js). Полоска сглажена, никогда не идёт назад и не убегает вперёд
   реального прогресса больше чем на 4% — иначе она врёт. Экран уходит
   в js/input.js:bootGame, когда игра уже нарисована и меню работает. */
window.GameLoader = (function () {
  const el = document.getElementById("boot");
  const stub = {
    expect() {}, imgDone() {}, stage() {}, fail() {},
    finish(cb) { if (typeof cb === "function") cb(); },
    whenReady(cb) { if (typeof cb === "function") cb(); }
  };
  if (!el) return stub;

  const fillEl = document.getElementById("bootFill");
  const pctEl = document.getElementById("bootPct");
  const statusEl = document.getElementById("bootStatus");
  const tipEl = document.getElementById("bootTip");
  const errEl = document.getElementById("bootErr");

  const TIPS = [
    "Совет: меткость важнее скорости — бей, когда бревно подставило кромку.",
    "Совет: попал в яблоко — забрал яблоко в копилку.",
    "Совет: у каждого босса свой материал и свой характер.",
    "Совет: рекорд — это ножи, всаженные за один забег.",
    "Совет: новые ножи открываются за яблоки.",
    "Совет: клавиши броска переназначаются в настройках ⚙"
  ];

  const MIN_SHOW = 800;      /* короче — экран мигал бы */
  const FADE = 400;          /* чуть больше transition в index.html: ready() ждёт конца */
  const STALL_MS = 26000;    /* столько ждём bootGame, потом «Обновить» */

  const t0 = performance.now();
  let total = 0, done = 0, shown = 0, lastPct = -1;
  let finished = false, errored = false, removed = false;
  let raf = 0, last = t0;
  const waiters = [];
  const outCbs = [];         /* «заставка поплыла» — сюда вешает анимацию игра */

  /* доля реальной работы: картинки — основная масса байтов */
  function value() {
    const base = Math.min(0.12, ((performance.now() - t0) / 4200) * 0.12);
    const img = total > 0 ? Math.min(1, done / total) : 0;
    return Math.max(base, 0.12 + img * 0.87);
  }

  function paint() {
    const p = Math.round(shown * 100);
    if (p === lastPct) return;
    lastPct = p;
    fillEl.style.width = p + "%";
    pctEl.textContent = p + "%";
    el.setAttribute("aria-valuenow", String(p));
  }

  function frame(now) {
    const dt = Math.min(0.08, Math.max(0, (now - last) / 1000));
    last = now;
    if (!finished) {
      const t = value();
      shown += (t - shown) * (1 - Math.exp(-dt * 7));
      /* мягкий дрейф: файл грузится долго — полоска не замирает намертво */
      const cap = Math.min(0.985, t + 0.04);
      if (shown < cap) shown = Math.min(cap, shown + dt * 0.02);
      if (shown > cap) shown = cap;
      if (shown < 0) shown = 0;
      paint();
    }
    raf = requestAnimationFrame(frame);
  }

  /* --- советы: ожидание превращаем в онбординг --- */
  let tipI = 0;
  tipEl.textContent = TIPS[0];
  tipEl.classList.add("is-in");
  const tipTimer = setInterval(function () {
    if (finished) return;
    tipI = (tipI + 1) % TIPS.length;
    tipEl.textContent = TIPS[tipI];
    tipEl.classList.remove("is-in");
    void tipEl.offsetWidth;
    tipEl.classList.add("is-in");
  }, 3200);

  function showError() {
    if (finished || errored) return;
    errored = true;
    if (errEl) errEl.hidden = false;
    if (statusEl) statusEl.textContent = "ЗАГРУЗКА ВСТАЛА";
  }

  const reload = document.getElementById("bootReload");
  if (reload) reload.addEventListener("click", function () { location.reload(); });

  function hide() {
    el.classList.add("is-done");
    el.style.pointerEvents = "none";   /* игра уже живая — не держим клики */
    clearInterval(tipTimer);
    /* заставка пошла на выход: игра получает слово в тот же кадр */
    for (let i = 0; i < outCbs.length; i++) { try { outCbs[i](); } catch (e) {} }
    outCbs.length = 0;
    setTimeout(function () {
      cancelAnimationFrame(raf);
      removed = true;
      if (el.parentNode) el.parentNode.removeChild(el);
      /* окно счётчика FPS начинается здесь: кадры загрузки в него не входят */
      if (typeof fpsResetWindow === "function") fpsResetWindow();
      const cbs = waiters.splice(0, waiters.length);
      for (let i = 0; i < cbs.length; i++) { try { cbs[i](); } catch (e) {} }
    }, FADE + 40);
  }

  setTimeout(function () {
    if (!window.gameBooted) showError();
  }, STALL_MS);

  raf = requestAnimationFrame(frame);
  requestAnimationFrame(function () {
    if (statusEl && !statusEl.textContent) statusEl.textContent = "ЗАГРУЖАЕМ ДВИЖОК";
  });

  return {
    /* сколько всего файлов — зовёт js/assets.js:loadGameImages */
    expect(n) { if (n > total) total = n; },
    imgDone() { done++; if (total < done) total = done; },
    stage(name) { if (statusEl && name && !finished) statusEl.textContent = name; },

    finish(afterOut) {
      if (typeof afterOut === "function") {
        if (removed) afterOut(); else outCbs.push(afterOut);
      }
      if (finished) return;
      finished = true;
      if (total > done) done = total;
      shown = 1;
      paint();
      pctEl.textContent = "100%";
      el.setAttribute("aria-valuenow", "100");
      if (statusEl) statusEl.textContent = "ПОЕХАЛИ";
      const left = MIN_SHOW - (performance.now() - t0);
      setTimeout(hide, Math.max(140, left));   /* пауза на 100% — «щелчок» */
    },

    fail() { showError(); },

    /* ready() площадки ждёт скрытия заставки (js/yandex.js) */
    whenReady(cb) {
      if (typeof cb !== "function") return;
      if (removed) { cb(); return; }
      waiters.push(cb);
    }
  };
})();
