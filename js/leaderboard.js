/* ---------- таблица лидеров на окне смерти ----------
   Подъём — это ПОЛЁТ, а не перерисовка. Строка игрока идёт вверх одним
   непрерывным движением (плавный разгон, крейсер, плавное торможение), а строки
   перед ней раздвигаются вниз, освобождая место, и замыкаются за спиной: каждая
   считает свой сдвиг от положения игрока, поэтому кадр всегда цельный — без дыр
   и наложений. В конце игрок проскакивает своё место выше, замирает, «понимает»
   и садится на место с ударом. Окно смерти до конца посадки не закрывается
   (js/flow.js: dismissFailOverlay). */
const LB_RPC = "bh_leaderboard";
const LB_REFRESH_MS = 60 * 1000;

/* Старый кэш ботов больше не нужен — чистим его у тестеров. */
try { localStorage.removeItem("bh_lb_bots_v3"); } catch (err) {}

const LB_INTRO_MS = 120;        // показываем таблицу «как было»
const LB_RUN_PER_ROW_MS = 110;  // время полёта на строку (пропорционально пути)
const LB_RUN_MIN_MS = 500;      // ближний подъём — не короче 0,5 с
const LB_RUN_MAX_MS = 4000;     // самый дальний — не дольше 4 с
const LB_HOLD_MS = 200;         // пауза после посадки, окно ещё держим
const LB_MIN_WATCH_MS = 200;    // без рекорда — 0,2 с, и окно можно закрывать
const LB_ANCHOR = 0.4;          // где по окну висит строка игрока
const LB_ANCHOR_STILL = 0.45;
const LB_GUARD = 0.12;          // выше этого игрока не пускаем
const LB_OPEN_ROWS = 1.1;       // за сколько строк до игрока строка начинает уезжать

/* rAF с запасным таймером: модуль гоняют и в node-стенде без браузера */
const lbRaf = typeof requestAnimationFrame === "function"
  ? function (fn) { return requestAnimationFrame(fn); }
  : function (fn) { return setTimeout(function () { fn(performance.now()); }, 16); };
const lbCaf = typeof cancelAnimationFrame === "function"
  ? function (id) { cancelAnimationFrame(id); }
  : function (id) { clearTimeout(id); };

let lbReal = [];
let lbRealSorted = null;
let lbRealLoading = false;
let lbRealAt = 0;
let lbLockUntil = 0;
let lbTimer = 0;
let lbSoundTimer = 0;
let lbCountRaf = 0;
let lbAnims = [];
let lbTimers = [];
let lbFx = [];
let lbFinish = null;
let lbScroll = null;
let lbScrollRaf = 0;
let lbVel = 0;
let lbMomentumRaf = 0;
let lbPassed = 0;
let lbPassAt = 0;

/* Отложенные шаги сцены: живут в одном списке, чтобы lbStop снял их разом и
   старая смерть не трогала новую */
function lbLater(fn, ms) {
  const id = setTimeout(() => {
    const k = lbTimers.indexOf(id);
    if (k >= 0) lbTimers.splice(k, 1);
    fn();
  }, ms);
  lbTimers.push(id);
  return id;
}

/* Посадка на место: чуть проваливается ниже и щёлкает обратно */
function lbEaseOutBack(p, s) {
  const k = s || 1.15;
  const u = p - 1;
  return 1 + (k + 1) * u * u * u + k * u * u;
}

function lbSmooth(p) {
  if (p <= 0) return 0;
  if (p >= 1) return 1;
  return p * p * (3 - 2 * p);
}

/* Сдвиг строки i: 0 — стоит, 1 — уехала на место ниже. Уезжает заранее, чтобы
   к приходу игрока место было свободно, и замыкается уже у него за спиной */
function lbOpen(i, r) {
  return lbSmooth((i + LB_OPEN_ROWS + 0.35 - r) / LB_OPEN_ROWS);
}

function lbNum(n) {
  return typeof statNum === "function" ? statNum(n) : String(n | 0);
}

/* Ники реальных игроков приходят из Supabase. */
function lbEsc(s) {
  return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
    return c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&quot;";
  });
}

/* Порядок: больше ножей — выше; при равенстве Premium выше,
   затем сам игрок выше остальных. */
function lbCmp(a, b) {
  if (b.score !== a.score) return b.score - a.score;
  if (!!a.premium !== !!b.premium) return a.premium ? -1 : 1;
  if (!!a.me !== !!b.me) return a.me ? -1 : 1;
  return 0;
}

/* Реальная таблица лидеров из Supabase. Никаких ботов. */
function lbSortedReal() {
  if (!lbRealSorted) lbRealSorted = (lbReal || []).slice().sort(lbCmp);
  return lbRealSorted;
}

async function lbRefreshReal() {
  if (lbRealLoading) return;
  const cfg = window.BH_SUPABASE || {};
  if (!cfg.url || !cfg.key) return;
  lbRealLoading = true;
  try {
    const res = await fetch(String(cfg.url).replace(/\/+$/, "") + "/rest/v1/rpc/" + LB_RPC, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: cfg.key,
        Authorization: "Bearer " + cfg.key
      },
      body: JSON.stringify({ p_limit: 200 })
    });
    if (!res.ok) return;
    const data = await res.json();
    if (!Array.isArray(data)) return;
    lbReal = data
      .filter(r => r && r.nick)
      .map((r, i) => ({
        key: "r" + i,
        nick: String(r.nick).slice(0, 20),
        score: Math.max(0, Math.floor(+r.score || 0)),
        level: Math.max(0, Math.floor(+r.level || 0)),
        premium: !!r.premium
      }));
    lbRealSorted = null;
    lbRealAt = Date.now();
  } catch (err) {
  } finally {
    lbRealLoading = false;
  }
}

function lbLoad() {
  if (lbRealLoading) return;
  if (!lbRealAt || Date.now() - lbRealAt > 15000) lbRefreshReal();
}

function lbInsertMe(sorted, score) {
  const s = Math.max(0, score | 0);
  const meNick = typeof playerNick === "function" ? playerNick() : "ВЫ";
  const clean = sorted.filter(r => !meNick || r.nick !== meNick);
  let lo = 0;
  let hi = clean.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (clean[mid].score <= s) hi = mid;
    else lo = mid + 1;
  }
  const out = clean.slice();
  out.splice(lo, 0, {
    key: "me",
    nick: meNick || "ВЫ",
    score: s,
    me: true,
    premium: !!(typeof save !== "undefined" && save && save.premium)
  });
  return out;
}

/* now — таблица с текущим рекордом, before — с прежним (для полёта) */
function lbBoard(score, base) {
  const sorted = lbSortedReal();
  const now = lbInsertMe(sorted, score | 0);
  let before = null;
  if (base != null && base !== score) before = lbInsertMe(sorted, base);
  return { now: now, before: before };
}

function lbRankOf(rows, key) {
  for (let i = 0; i < rows.length; i++) if (rows[i].key === key) return i;
  return rows.length - 1;
}

function lbVar(el, name, value) {
  if (!el || !el.style || typeof el.style.setProperty !== "function") return;
  el.style.setProperty(name, value);
}

/* animate с пакетным cancel: всё, что запущено сценой, гаснет в lbStop */
function lbAnim(node, frames, opts) {
  if (!node || typeof node.animate !== "function") return null;
  try {
    const anim = node.animate(frames, opts);
    if (anim && typeof anim.cancel === "function") lbAnims.push(anim);
    return anim;
  } catch (err) {
    return null;
  }
}

/* Место в строке + цвет медалей для первого-третьего */
function lbSetPlace(el, rank) {
  if (!el) return;
  const num = el.firstChild && el.firstChild.nodeType === 1 ? el.firstChild : el;
  const txt = "#" + (rank + 1);
  if (num.textContent !== txt) num.textContent = txt;
  if (el.classList) {
    el.classList.toggle("lb-p1", rank === 0);
    el.classList.toggle("lb-p2", rank === 1);
    el.classList.toggle("lb-p3", rank === 2);
  }
}

function lbDropFx() {
  for (let i = 0; i < lbFx.length; i++) {
    const node = lbFx[i];
    try { if (node && typeof node.remove === "function") node.remove(); } catch (err) {}
  }
  lbFx.length = 0;
}

function lbStop() {
  if (lbTimer) { clearTimeout(lbTimer); lbTimer = 0; }
  if (lbSoundTimer) { clearTimeout(lbSoundTimer); lbSoundTimer = 0; }
  lbScrollUnbind();
  for (let i = 0; i < lbTimers.length; i++) clearTimeout(lbTimers[i]);
  lbTimers.length = 0;
  if (lbCountRaf) {
    lbCaf(lbCountRaf);
    lbCountRaf = 0;
  }
  lbLockUntil = 0;
  lbFinish = null;
  lbPassed = 0;
  lbPassAt = 0;
  for (let i = 0; i < lbAnims.length; i++) {
    try { lbAnims[i].cancel(); } catch (err) {}
  }
  lbAnims.length = 0;
  lbDropFx();
  if (overlay) overlay.classList.remove("lb-lock");
  const box = document.getElementById("deathBoard");
  if (box) box.hidden = true;
  /* виртуальные строки таблицы больше не нужны — отпускаем DOM */
  lbVirtClear();
}

/* Окно смерти закрывается только когда таблица отпустила: полёт доигран */
function leaderboardLocked() {
  return performance.now() < lbLockUntil;
}

/* Таблица видна на экране (и в меню, и на смерти). Пока она открыта, игровой
   кадр под ней не рисуем — canvas всё равно закрыт, а его отрисовка отнимала
   у прокрутки таблицы половину кадра (js/frame.js: draw). */
function lbBoardOpen() {
  if (lbMenuOpen()) return true;
  const box = document.getElementById("deathBoard");
  if (!box || box.hidden) return false;
  /* Таблица живёт в окне смерти (#overlay). Само окно может быть скрыто —
     тогда таблица не видна и кадр рисовать нужно. */
  const ov = box.closest ? box.closest("#overlay") : null;
  if (ov) return !ov.classList.contains("hidden");
  return true;
}

/* Клик по заблокированному окну: панель коротко вздрагивает, окно стоит */
function leaderboardNudge() {
  const box = document.getElementById("deathBoard");
  if (!box || !box.classList) return;
  box.classList.remove("lb-nudge");
  if (typeof box.offsetWidth === "number") void box.offsetWidth;
  box.classList.add("lb-nudge");
  setTimeout(() => { if (box.classList) box.classList.remove("lb-nudge"); }, 380);
}

function leaderboardHide() {
  lbStop();
}

/* вспышка-толчок на блоке текста (ник, счёт, место) */
function lbBump(node, scale) {
  if (!node) return;
  const s = scale || 1.16;
  lbAnim(node, [
    { transform: "scale(1)" },
    { transform: "scale(" + s + ")", offset: 0.35 },
    { transform: "scale(1)" }
  ], { duration: 240, easing: "cubic-bezier(0.3, 1.7, 0.4, 1)" });
}

/* Кольцо-волна: расходится от строки игрока, когда он проходит место */
function lbRing(view, y, big) {
  if (!view) return;
  const ring = document.createElement("div");
  ring.className = "lb-ring" + (big ? " big" : "");
  ring.style.top = Math.round(y) + "px";
  view.appendChild(ring);
  lbFx.push(ring);
  const to = big ? 2.6 : 1.7;
  lbAnim(ring, [
    { transform: "translate(-50%,-50%) scale(0.3)", opacity: 0.85 },
    { transform: "translate(-50%,-50%) scale(" + to + ")", opacity: 0 }
  ], { duration: big ? 620 : 380, easing: "cubic-bezier(0.2, 0.9, 0.3, 1)" });
  lbLater(() => {
    if (typeof ring.remove === "function") ring.remove();
    const k = lbFx.indexOf(ring);
    if (k >= 0) lbFx.splice(k, 1);
  }, big ? 680 : 420);
}

/* Залп искр: единственный «дорогой» эффект, поэтому только на посадку */
function lbSparks(view, x, y, count) {
  if (!view) return;
  for (let i = 0; i < count; i++) {
    const sp = document.createElement("div");
    sp.className = "lb-spark";
    sp.style.left = Math.round(x) + "px";
    sp.style.top = Math.round(y) + "px";
    view.appendChild(sp);
    lbFx.push(sp);
    const a = (i / count) * Math.PI * 2 + Math.random() * 0.5;
    const r = 60 + Math.random() * 90;
    const dx = Math.cos(a) * r;
    const dy = Math.sin(a) * r * 0.7;
    lbAnim(sp, [
      { transform: "translate(-50%,-50%) scale(1)", opacity: 1 },
      { transform: "translate(calc(-50% + " + dx.toFixed(1) + "px), calc(-50% + " +
          dy.toFixed(1) + "px)) scale(0.15)", opacity: 0 }
    ], { duration: 420 + Math.random() * 260, easing: "cubic-bezier(0.15, 0.7, 0.4, 1)" });
    lbLater(() => {
      if (typeof sp.remove === "function") sp.remove();
      const k = lbFx.indexOf(sp);
      if (k >= 0) lbFx.splice(k, 1);
    }, 760);
  }
}

/* Тряска всей панели: только на посадку */
function lbShake(box, amp) {
  if (!box) return;
  const a = amp || 6;
  lbAnim(box, [
    { transform: "translate3d(0,0,0) rotate(0deg)" },
    { transform: "translate3d(" + (-a) + "px," + (a * 0.4) + "px,0) rotate(-0.45deg)", offset: 0.2 },
    { transform: "translate3d(" + (a * 0.8) + "px," + (-a * 0.3) + "px,0) rotate(0.4deg)", offset: 0.45 },
    { transform: "translate3d(" + (-a * 0.45) + "px,0,0) rotate(-0.2deg)", offset: 0.7 },
    { transform: "translate3d(0,0,0) rotate(0deg)" }
  ], { duration: 380, easing: "ease-out" });
}

/* ---------- прокрутка таблицы ----------
   Листается колесом, пальцем и мышью. Пока строка игрока за кадром, у края
   висит кнопка с его местом: тап — плавный возврат к себе. */

function lbScrollHint() {
  const s = lbScroll;
  if (!s || !s.jump) return;
  const top = s.meY - s.cam;
  const bottom = top + s.rowH;
  const pad = s.rowH * 0.25;
  if (bottom > pad && top < s.viewH - pad) {
    if (!s.jump.hidden) s.jump.hidden = true;
    return;
  }
  const above = bottom <= pad;
  if (s.arrow) s.arrow.textContent = above ? "↑" : "↓";
  if (s.num) s.num.textContent = "#" + (s.meRank + 1);
  if (s.jump.hidden) s.jump.hidden = false;
  if (s.jump.classList) {
    s.jump.classList.toggle("up", above);
    s.jump.classList.toggle("down", !above);
  }
  if (s.top) {
    if (s.cam > 4) { if (s.top.hidden) s.top.hidden = false; }
    else if (!s.top.hidden) s.top.hidden = true;
  }
}

function lbCamSet(v, quiet) {
  const s = lbScroll;
  if (!s) return;
  const c = Math.max(0, Math.min(s.max, v));
  s.cam = c;
  if (lbVirt) {
    lbVirt.cam = c;
    lbVirtSync();
    lbVirtLay();
  }
  if (s.spot) {
    s.spot.style.transform = "translate3d(0," +
      (s.meY - c - s.rowH * 1.2).toFixed(2) + "px,0)";
  }
  if (!quiet) lbScrollHint();
}

function lbScrollTo(to, ms) {
  const s = lbScroll;
  if (!s) return;
  lbMomentumStop();
  if (lbScrollRaf) { lbCaf(lbScrollRaf); lbScrollRaf = 0; }
  const goal = Math.max(0, Math.min(s.max, to));
  if (!ms) { lbCamSet(goal); return; }
  const from = s.cam;
  const t0 = performance.now();
  const step = () => {
    const p = Math.min(1, (performance.now() - t0) / ms);
    lbCamSet(from + (goal - from) * (1 - Math.pow(1 - p, 3)));
    lbScrollRaf = p < 1 ? lbRaf(step) : 0;
  };
  lbScrollRaf = lbRaf(step);
}

/* Инерция колеса: каждое деление подкидывает скорость, дальше камера едет
   сама и вязко тормозит. У края таблицы скорость гасится сразу */
function lbMomentumStop() {
  if (lbMomentumRaf) { lbCaf(lbMomentumRaf); lbMomentumRaf = 0; }
  lbVel = 0;
}

function lbMomentumRun() {
  const s = lbScroll;
  if (!s || lbMomentumRaf) return;
  let last = performance.now();
  const tick = () => {
    lbMomentumRaf = 0;
    const st = lbScroll;
    if (!st) return;
    const now = performance.now();
    const dt = Math.max(0.001, Math.min(0.05, (now - last) / 1000));
    last = now;
    const from = st.cam;
    lbCamSet(from + lbVel * dt);
    if (st.cam === from) lbVel = 0;
    lbVel *= Math.pow(0.9, dt * 60);
    if (Math.abs(lbVel) < 25) { lbVel = 0; return; }
    lbMomentumRaf = lbRaf(tick);
  };
  lbMomentumRaf = lbRaf(tick);
}

/* Старое место — такой же зачёркнутый ярлык в левом верхнем углу нового */
function lbOldPlace(placeEl, oldRank) {
  if (!placeEl || typeof placeEl.appendChild !== "function") return;
  if (typeof placeEl.querySelector === "function" && placeEl.querySelector(".lb-old-place")) return;
  const old = document.createElement("s");
  old.className = "lb-old lb-old-place";
  old.textContent = "#" + (oldRank + 1);
  placeEl.appendChild(old);
}

function lbScrollBind(view) {
  const s = lbScroll;
  if (!s || !view || typeof view.addEventListener !== "function") return;
  if (s.jump && typeof s.jump.querySelector === "function") {
    s.arrow = s.jump.querySelector(".lb-jump-ar");
    s.num = s.jump.querySelector(".lb-jump-num");
  }
  s.top = document.getElementById("deathBoardTop") || null;
  if (s.top) s.top.hidden = true;
  const idle = () => !lbCountRaf;

  s.onWheel = function (e) {
    if (lbCountRaf) return;
    e.preventDefault();
    e.stopPropagation();
    let d = e.deltaY;
    if (e.deltaMode === 1) d *= s.rowH;
    else if (e.deltaMode === 2) d *= s.viewH * 0.9;
    if (!d) return;
    if ((s.cam <= 0 && d < 0) || (s.cam >= s.max && d > 0)) return;
    lbVel = Math.max(-3600, Math.min(3600, lbVel + d * 12));
    lbMomentumRun();
  };
  view.addEventListener("wheel", s.onWheel, { passive: false });

  s.onDown = function (e) {
    if (!idle() || (e.button != null && e.button !== 0)) return;
    lbMomentumStop();
    if (lbScrollRaf) { lbCaf(lbScrollRaf); lbScrollRaf = 0; }
    s.drag = true;
    s.dragged = false;
    s.vy = 0;
    s.mvT = 0;
    s.mvY = 0;
    s.pid = e.pointerId;
    s.y0 = e.clientY;
    s.cam0 = s.cam;
    try { view.setPointerCapture(e.pointerId); } catch (err) {}
  };
  s.onMove = function (e) {
    if (!s.drag || e.pointerId !== s.pid) return;
    const dy = e.clientY - s.y0;
    if (Math.abs(dy) > 4) s.dragged = true;
    if (!s.dragged) return;
    e.preventDefault();
    e.stopPropagation();
    lbCamSet(s.cam0 - dy);
    /* скорость пальца/мыши: по ней после отпускания камера едет по инерции */
    const now = performance.now();
    const dt = now - (s.mvT || now);
    if (dt > 0 && s.mvT) {
      const inst = -(e.clientY - s.mvY) / dt * 1000;
      s.vy = s.vy ? s.vy * 0.65 + inst * 0.35 : inst;
    }
    s.mvT = now;
    s.mvY = e.clientY;
  };
  s.onUp = function (e) {
    if (!s.drag || e.pointerId !== s.pid) return;
    s.drag = false;
    s.pid = null;
    try { view.releasePointerCapture(e.pointerId); } catch (err) {}
    /* свайп отпустили на ходу — катимся дальше */
    if (s.dragged && performance.now() - (s.mvT || 0) < 120 && Math.abs(s.vy) > 120) {
      lbVel = Math.max(-3600, Math.min(3600, s.vy));
      lbMomentumRun();
    }
    /* флаг «перетащили» гасится сам: клик после свайпа приходит сразу за
       pointerup, а если его не будет — не должен глушить следующие клики */
    if (s.dragged) {
      const seq = (s.dragSeq = (s.dragSeq | 0) + 1);
      setTimeout(() => { if (s.dragSeq === seq) s.dragged = false; }, 400);
    }
  };
  view.addEventListener("pointerdown", s.onDown);
  view.addEventListener("pointermove", s.onMove);
  view.addEventListener("pointerup", s.onUp);
  view.addEventListener("pointercancel", s.onUp);

  /* клик после перетаскивания окно не закрывает: его «съедаем» */
  s.onClick = function (e) {
    if (!s.dragged) return;
    s.dragged = false;
    e.stopPropagation();
    e.preventDefault();
  };
  view.addEventListener("click", s.onClick);

  if (s.jump) {
    s.onJump = function (e) {
      e.stopPropagation();
      lbScrollTo(s.meY - s.viewH * 0.45, 380);
    };
    s.jump.addEventListener("pointerdown", function (e) { e.stopPropagation(); });
    s.jump.addEventListener("click", s.onJump);
  }

  if (s.top) {
    s.onTop = function (e) {
      e.stopPropagation();
      lbScrollTo(0, 520);
    };
    s.top.addEventListener("pointerdown", function (e) { e.stopPropagation(); });
    s.top.addEventListener("click", s.onTop);
  }
}

function lbScrollUnbind() {
  lbMomentumStop();
  if (lbScrollRaf) { lbCaf(lbScrollRaf); lbScrollRaf = 0; }
  const s = lbScroll;
  if (!s) return;
  const v = s.view;
  if (v && typeof v.removeEventListener === "function") {
    if (s.onWheel) v.removeEventListener("wheel", s.onWheel);
    if (s.onDown) v.removeEventListener("pointerdown", s.onDown);
    if (s.onMove) v.removeEventListener("pointermove", s.onMove);
    if (s.onUp) {
      v.removeEventListener("pointerup", s.onUp);
      v.removeEventListener("pointercancel", s.onUp);
    }
    if (s.onClick) v.removeEventListener("click", s.onClick);
  }
  if (s.jump && s.onJump) s.jump.removeEventListener("click", s.onJump);
  if (s.top && s.onTop) s.top.removeEventListener("click", s.onTop);
  if (s.jump) s.jump.hidden = true;
  if (s.top) s.top.hidden = true;
  lbScroll = null;
}

/* ---------- таблица лидеров: виртуальный список ----------
   Реальные игроки + текущий игрок. Виртуализация держит в DOM только строки,
   попавшие в окно прокрутки (плюс запас), а логическая таблица остаётся
   полной: высота трека, прокрутка, полёт игрока и подсказки «#N» считают по
   настоящим индексам. Освободившиеся строки уходят в пул и переиспользуются.

   lbVirt — состояние одного показа:
     n, rowH, viewH, cam   — геометрия;
     now                   — отсортированные строки (board.now);
     srcMap                — индекс в now для КАЖДОГО старого места (во время
                             полёта строки стоят по старым местам, а показывают
                             актуальные данные); null — порядок обычный;
     used / free           — занятые индексы → запись и пул элементов;
     meIndex, meEl         — строка игрока: её нельзя отдавать в пул. */
let lbVirt = null;
/* Пул строк таблицы живёт МЕЖДУ показами: элементы не пересоздаются и не
   выбрасываются, поэтому стили и текст второго открытия уже разложены
   браузером. Это заметно дешевле, чем 9 новых строк на каждую смерть. */
const lbRowPool = [];
let lbRowWarm = 0;
let lbWarmRowH = 0;
let lbWarmViewH = 0;
let lbWarmW = 0;
let lbWarmHH = 0;

function lbNewRow() {
  const el = document.createElement("div");
  el.className = "lb-row";
  const place = document.createElement("span");
  place.className = "lb-place";
  const num = document.createElement("span");
  num.className = "lb-place-num";
  place.appendChild(num);
  const nick = document.createElement("span");
  nick.className = "lb-nick";
  const score = document.createElement("span");
  score.className = "lb-score";
  el.appendChild(place);
  el.appendChild(nick);
  el.appendChild(score);
  el.style.display = "none";
  return el;
}

/* Прогрев строк в меню: один раз за сессию раскладываем строки в скрытой
   таблице, чтобы первый показ после смерти не платил за это в кадре. */
function warmLeaderboardRows() {
  if (lbRowWarm || typeof document === "undefined") return;
  const box = document.getElementById("deathBoard");
  const track = document.getElementById("deathBoardTrack");
  if (!box || !track) return;
  lbRowWarm = 1;
  const wasHidden = box.hidden;
  try {
    lbLoad();
    box.hidden = false;
    const rows = [];
    for (let i = 0; i < 12; i++) {
      const el = lbNewRow();
      el.style.display = "";
      const ch = el.children;
      lbSetPlace(ch[0], i);
      ch[1].textContent = "ИГРОК";
      ch[2].textContent = "999";
      if (el.parentNode !== track) track.appendChild(el);
      rows.push(el);
    }
    const h = rows[0].offsetHeight || 46;
    for (let i = 0; i < rows.length; i++) {
      rows[i].style.display = "none";
      if (lbRowPool.length < 40) lbRowPool.push(rows[i]);
    }
    const view = document.getElementById("deathBoardView");
    lbWarmRowH = h;
    lbWarmViewH = (view && view.clientHeight) || h * 6;
    lbWarmW = lbWinW();
    lbWarmHH = lbWinH();
  } finally {
    box.hidden = wasHidden;
  }
}

  /* Размеры окна (в тестовом VM-окружении window может быть заглушкой).
     Вызывать их в кадре нельзя: window.innerWidth заставляет браузер сбросить
     раскладку, а это десятки миллисекунд. Кэш прогрева сбрасывается на resize. */
function lbWinW() {
  return (typeof window !== "undefined" && window && window.innerWidth) || 0;
}
function lbWinH() {
  return (typeof window !== "undefined" && window && window.innerHeight) || 0;
}

if (typeof window !== "undefined" && window && typeof window.addEventListener === "function") {
  window.addEventListener("resize", function () {
    lbWarmRowH = 0;
    lbWarmViewH = 0;
  });
}

function lbVirtClear() {
  if (!lbVirt) return;
  const v = lbVirt;
  v.used.forEach((rec) => {
    rec.el.style.display = "none";
    rec.el.classList.remove("lb-rise", "lb-shift");
    if (lbRowPool.length < 40) lbRowPool.push(rec.el);
  });
  v.used.clear();
  lbVirt = null;
}

function lbSetRankClasses(el, rank) {
  if (!el || !el.classList) return;
  el.classList.toggle("rank1", rank === 0);
  el.classList.toggle("rank2", rank === 1);
  el.classList.toggle("rank3", rank === 2);
  const odd = (rank & 1) === 1;
  el.classList.toggle("lb-odd", odd);
  el.classList.toggle("lb-even", !odd);
}

function lbVirtRow(i) {
  const v = lbVirt;
  if (!v || i < 0 || i >= v.n) return null;
  let rec = v.used.get(i);
  if (rec) return rec;
  const p = v.now[v.srcMap ? v.srcMap[i] : i];
  if (!p) return null;
  let el = v.free.pop();
  if (!el) {
    el = lbRowPool.pop();
    if (!el) el = lbNewRow();
  }
  el.style.display = "";
  el.className = "lb-row" + (p.me ? " me" : "") + (p.premium ? " premium" : "");
  lbSetRankClasses(el, i);
  el.style.willChange = "";
  el.style.animationDuration = "";
  const ch = el.children;
  const place = ch[0];
  lbSetPlace(place, i);
  ch[1].textContent = p.premium ? "👑 " + p.nick : p.nick;
  ch[2].textContent = lbNum(p.score);
  if (p.me && v.record && v.base < v.score) {
    const old = document.createElement("s");
    old.className = "lb-old";
    old.textContent = lbNum(v.base);
    ch[2].appendChild(old);
  }
  el.style.transform = "translate(0," + (i * v.rowH - v.cam).toFixed(2) + "px)";
  lbVar(el, "--lb-open", "0");
  lbVar(el, "--lb-tail", "0px");
  lbVar(el, "--lb-tail-a", "0");
  el.classList.remove("lb-shift", "lb-rise");
  el.style.display = "";
  if (el.parentNode !== v.track) v.track.appendChild(el);
  rec = { el: el, place: place, o: -1, m: false, rank: i };
  v.used.set(i, rec);
  if (p.me) {
    v.meEl = el;
    v.mePlace = place;
    v.meNick = ch[1];
    v.meScore = ch[2];
  }
  return rec;
}

/* Довести набор строк до окна прокрутки: лишние — в пул, недостающие — из пула */
function lbVirtSync() {
  const v = lbVirt;
  if (!v || !v.rowH) return;
  const from = Math.max(0, Math.floor(v.cam / v.rowH) - 1);
  const to = Math.min(v.n - 1, Math.ceil((v.cam + v.viewH) / v.rowH) + 1);
  v.from = from;
  v.to = to;
  if (v.used.size) {
    v.used.forEach((rec, i) => {
      if (i === v.meIndex || (i >= from && i <= to)) return;
      v.used.delete(i);
      rec.el.style.display = "none";
      if (v.free.length < 40) v.free.push(rec.el);
    });
  }
  for (let i = from; i <= to; i++) lbVirtRow(i);
}

/* Строки привязаны к окну камеры: трек НЕ растягивается на всю таблицу
   (613 × 48 px = 29 000 px высоты — композитор заводил под это гигантский
   слой и первый показ таблицы стоил сотни миллисекунд). Видимое окно — это
   несколько строк, каждая просто сдвинута на (i * шаг − прокрутка). */
function lbVirtLay() {
  const v = lbVirt;
  if (!v) return;
  v.used.forEach((rec, i) => {
    if (rec.el.style.display === "none") return;
    rec.el.style.transform = "translate(0," + (i * v.rowH - v.cam).toFixed(2) + "px)";
  });
}

/* Полёт окончен: таблица снова живёт в обычном порядке (new rank → row) */
function lbVirtSettle() {
  const v = lbVirt;
  if (!v) return;
  v.srcMap = null;
  v.climbing = false;
  v.meIndex = v.meRank;
  v.used.forEach((rec) => {
    rec.el.style.display = "none";
    rec.el.style.willChange = "";
    rec.el.classList.remove("lb-rise", "lb-shift");
    if (v.free.length < 40) v.free.push(rec.el);
  });
  v.used.clear();
  v.meEl = null;
  v.mePlace = null;
  lbVirtSync();
  if (v.meEl) {
    v.meEl.style.animationDuration = "";
    v.meEl.classList.remove("lb-rise");
    lbVar(v.meEl, "--lb-tail", "0px");
    lbVar(v.meEl, "--lb-tail-a", "0");
  }
}

function leaderboardShow(opt) {
  const box = document.getElementById("deathBoard");
  const view = document.getElementById("deathBoardView");
  const track = document.getElementById("deathBoardTrack");
  const spot = document.getElementById("deathBoardSpot");
  if (!box || !view || !track) return;

  lbStop();
  lbLoad();
  box.hidden = false;

  const score = Math.max(0, Math.floor(+((opt && opt.score) || 0)));
  const base = Math.max(0, Math.floor(+((opt && opt.base) || 0)));
  const record = !!(opt && opt.record);
  /* Окно из главного меню открывается с ВЕРШИНЫ таблицы: игроку интересен
     пьедестал (первые три места в рамках), а к своей строке доведёт кнопка «#N» */
  const startTop = !!(opt && opt.startTop);
  const board = lbBoard(score, record ? base : null);
  const meRank = lbRankOf(board.now, "me");
  const oldRank = board.before ? lbRankOf(board.before, "me") : meRank;
  const n = board.now.length;
  const span = oldRank - meRank;
  const climbing = record && span > 0;

  /* Во время полёта строки стоят по СТАРЫМ местам, а показывают человека,
     который сейчас занимает соответствующее новое место. Карта старая→новая
     строится один раз: 613 сравнений — доли миллисекунды. */
  let srcMap = null;
  if (climbing && board.before) {
    const newOf = new Map();
    board.now.forEach((p, i) => newOf.set(p.key, i));
    srcMap = new Array(n);
    for (let i = 0; i < n; i++) srcMap[i] = newOf.get(board.before[i].key);
  }

  /* Шаг строки берём из прогрева (его мерили в меню), иначе — пробной строкой.
     В обоих случаях НЕ трогаем offsetHeight/clientHeight, если размеры уже
     известны: эти чтения заставляют браузер синхронно пересчитать раскладку
     всей панели прямо в кадре смерти (десятки миллисекунд на телефоне). */
  const inMenu = (function () {
    const el = document.getElementById("deathBoard");
    return !!(el && el.closest && el.closest("#lbMenu"));
  })();
  /* Размеры из прогрева годятся, пока не было resize (он сбрасывает кэш).
     Никаких window.innerWidth/clientHeight в этой ветке: это принудительный
     flush раскладки прямо в кадре смерти. */
  const warmValid = !inMenu && lbWarmRowH > 0;
  let rowH = 0;
  let viewH = 0;
  let probe = null;
  if (warmValid) {
    rowH = lbWarmRowH;
    viewH = lbWarmViewH;
  } else {
    probe = lbRowPool.pop();
    if (!probe) probe = lbNewRow();
    probe.className = "lb-row";
    probe.style.display = "";
    if (probe.parentNode !== track) track.appendChild(probe);
    rowH = (probe && probe.offsetHeight) || 46;
    viewH = view.clientHeight ||
      (view.getBoundingClientRect && view.getBoundingClientRect().height) || rowH * 6;
    probe.style.display = "none";
    if (lbRowPool.length < 40) lbRowPool.push(probe);
    lbWarmRowH = rowH;
    lbWarmViewH = viewH;
    lbWarmW = lbWinW();
    lbWarmHH = lbWinH();
  }
  /* Трек — размером с окно, а не с таблицу: иначе на 613 строк композитор
     получает слой высотой 29 000 px (сотни мегабайт текстуры и рывок при
     первом показе). Строки позиционируются относительно камеры. */
  track.style.height = Math.ceil(viewH) + "px";
  track.style.willChange = "";
  const maxScroll = Math.max(0, n * rowH - viewH);
  const clampScroll = v => Math.max(0, Math.min(maxScroll, v));
  const centerOf = rank => rank * rowH + rowH / 2;
  const viewW = view.clientWidth || 300;

  lbVirt = {
    n: n, rowH: rowH, viewH: viewH, cam: 0,
    now: board.now, srcMap: srcMap, climbing: climbing, record: record,
    base: base, score: score,
    used: new Map(), free: [], track: track,
    meIndex: oldRank, meRank: meRank, meEl: null, mePlace: null,
    from: 0, to: 0
  };

  /* состояние прокрутки: живёт до lbStop; полёт его только читает */
  lbScroll = {
    view: view, track: track, spot: spot,
    jump: document.getElementById("deathBoardJump"),
    arrow: null, num: null,
    rowH: rowH, viewH: viewH, max: maxScroll,
    meY: meRank * rowH, meRank: meRank,
    cam: 0, drag: false, dragged: false
  };
  lbScrollBind(view);

  let cam = startTop ? 0 : clampScroll(centerOf(oldRank) - viewH * 0.54);
  lbVirt.cam = cam;
  lbCamSet(cam, true);

  /* Въезд панели: только когда за столом что-то происходит (рекорд или подъём).
     Без рекорда таблица просто появляется — игрок сразу её пролистывает. */
  if (climbing || record) {
    lbAnim(view, [
      { opacity: 0.2, transform: "translateY(12px) scale(0.98)" },
      { opacity: 1, transform: "none" }
    ], { duration: 320, easing: "cubic-bezier(0.16, 1, 0.3, 1)" });
  }

  /* --- полёта нет: строки уже на местах. Здесь только камера и эффект рекорда. */
  if (!climbing) {
    const meEl = lbVirt.meEl;
    const meNick = lbVirt.meNick;
    const meScore = lbVirt.meScore;
    const endCam = startTop ? 0 : clampScroll(centerOf(meRank) - viewH * LB_ANCHOR_STILL);
    lbCamSet(endCam);
    const screenY = centerOf(meRank) - endCam;

    if (record) {
      if (meEl && meEl.classList) {
        meEl.style.animationDuration = "1600ms";
        meEl.classList.add("lb-rise");
      }
      lbBump(meNick, 1.28);
      lbBump(meScore, 1.32);
      lbRing(view, screenY, true);
      lbSparks(view, viewW * 0.5, screenY, 12);
      lbShake(box, 6);
      lbSoundTimer = setTimeout(() => {
        lbSoundTimer = 0;
        if (typeof Sfx !== "undefined" && Sfx.recordReveal) Sfx.recordReveal();
      }, 120);
    }

    const watchMs = record ? 1500 : LB_MIN_WATCH_MS;
    lbLockUntil = performance.now() + watchMs;
    if (overlay) overlay.classList.add("lb-lock");
    lbTimer = setTimeout(() => {
      lbTimer = 0;
      lbLockUntil = 0;
      if (overlay) overlay.classList.remove("lb-lock");
      if (meEl && meEl.classList) meEl.classList.remove("lb-rise");
    }, watchMs + 20);
    return;
  }

  /* ---------- полёт ----------
     Время строго пропорционально пути: 110 мс на строку, но не меньше 0,5 с и
     не больше 4 с. Путь — одна плавная S-кривая: ровный разгон со старта,
     максимум скорости ровно на половине, такое же ровное торможение к месту. */
  const travelMs = Math.max(LB_RUN_MIN_MS,
    Math.min(LB_RUN_MAX_MS, span * LB_RUN_PER_ROW_MS));
  const doneAt = travelMs;
  const totalMs = LB_INTRO_MS + doneAt;

  /* положение игрока в строках: 0 — старое место, span — новое */
  const movedAt = t => {
    if (t <= 0) return 0;
    if (t >= travelMs) return span;
    return span * lbSmooth(t / travelMs);
  };

  const t0 = performance.now() + LB_INTRO_MS;
  let lastT = 0;
  let camV = 0;
  let prevMoved = 0;
  let vel = 0;
  let shownRank = oldRank;
  let landed = 0;

  const meRec = lbVirtRow(oldRank);
  const meEl = meRec && meRec.el;
  const mePlace = meRec && meRec.place;
  const meNick = meEl && meEl.children[1];
  const meScore = meEl && meEl.children[2];

  if (meEl) {
    meEl.style.willChange = "transform";
    meEl.style.animationDuration = Math.round(travelMs + 900) + "ms";
    lbLater(() => {
      if (meEl.classList) meEl.classList.add("lb-rise");
    }, 30);
  }

  lbLockUntil = performance.now() + totalMs + LB_HOLD_MS;
  if (overlay) overlay.classList.add("lb-lock");
  lbTimer = setTimeout(() => {
    lbTimer = 0;
    lbLockUntil = 0;
    if (overlay) overlay.classList.remove("lb-lock");
    if (lbFinish) lbFinish();
  }, totalMs + LB_HOLD_MS + 20);

  lbLater(() => {
    if (typeof Sfx !== "undefined" && Sfx.whoosh) Sfx.whoosh();
  }, LB_INTRO_MS - 60);
  lbSoundTimer = setTimeout(() => {
    lbSoundTimer = 0;
    if (typeof Sfx !== "undefined" && Sfx.recordReveal) Sfx.recordReveal();
  }, LB_INTRO_MS + doneAt - 90);

  const finalize = () => {
    const endCam = clampScroll(centerOf(meRank) - viewH * LB_ANCHOR);
    lbCamSet(endCam);
    /* после полёта таблица переезжает в новый порядок; строки вне окна
       пересоздадутся по требованию при прокрутке. Старое место цепляем уже
       к НОВОЙ строке игрока — старую мы сейчас вернём в пул. */
    lbVirtSettle();
    if (record && oldRank > meRank && lbVirt && lbVirt.mePlace) {
      lbOldPlace(lbVirt.mePlace, oldRank);
    }
  };
  lbFinish = finalize;

  const step = ts => {
    const nowT = typeof ts === "number" ? ts : performance.now();
    if (!lastT) lastT = nowT - 16;
    const dt = Math.max(0.001, Math.min(0.05, (nowT - lastT) / 1000));
    lastT = nowT;
    const gone = nowT - t0;
    if (gone < 0) {
      lbCountRaf = lbRaf(tickWrap);
      return;
    }

    const moved = movedAt(Math.min(gone, doneAt));
    const r = oldRank - moved;
    const meY = r * rowH;

    /* каждый пройденный игрок — звонкий «пинг»; на пике разгона режем частоту,
       чтобы серия не сливалась в трель */
    const passed = Math.floor(oldRank - r);
    if (passed > lbPassed) {
      const stepN = passed - 1;
      lbPassed = passed;
      const gap = nowT - lbPassAt;
      if (gap > 55) {
        lbPassAt = nowT;
        if (typeof Sfx !== "undefined" && Sfx.lbPass) Sfx.lbPass(stepN, gap);
      }
    }

    /* скорость в строках/с: по ней растяжение строки и хвост */
    vel += ((moved - prevMoved) / dt - vel) * Math.min(1, dt * 20);
    prevMoved = moved;
    if (vel < 0) vel = 0;
    const st = Math.min(0.19, vel * 0.0045);

    /* камера-погоня: пружина с недогашением — догоняет мягко, но без тряски */
    const anchorNow = viewH * (LB_ANCHOR - Math.min(0.07, vel * 0.0022));
    /* упреждение гасит отставание пружины: камера не прилипает к строке, но и
       не даёт игроку улететь под шапку */
    const goal = clampScroll(meY - vel * rowH * 0.115 + rowH * 0.5 - anchorNow);
    const stiff = 150;
    const damp = 2 * Math.sqrt(stiff);
    camV += (goal - cam) * stiff * dt - camV * damp * dt;
    cam += camV * dt;
    if (meY - cam < viewH * LB_GUARD) { cam = meY - viewH * LB_GUARD; if (camV > 0) camV *= 0.2; }
    cam = Math.max(0, Math.min(maxScroll, cam));
    const camY = cam;
    if (lbScroll) lbScroll.cam = camY;
    if (lbVirt) lbVirt.cam = camY;

    /* строки в окне: каждая считает сдвиг от положения игрока, поэтому строки
       перед ним раздвигаются, а за спиной замыкаются — без дыр и наложений */
    lbVirtSync();
    const from = lbVirt ? lbVirt.from : 0;
    const to = lbVirt ? lbVirt.to : n - 1;
    /* пока игрок не оторвался, таблица стоит как была: раздвигание включается
       на первых сантиметрах разгона */
    const launch = Math.min(1, moved / 0.5);
    for (let i = from; i <= to; i++) {
      const rec = lbVirtRow(i);
      if (!rec) continue;
      let y = i;
      let open = 0;
      let shift = 0;
      let moving = false;
      let squash = 0;
      if (i >= meRank && i < oldRank) {
        const s = lbOpen(i, r) * launch;
        shift = s > 0.5 ? 1 : 0;
        moving = s > 0.04 && s < 0.995;
        if (s > 0.001) {
          open = Math.sin(Math.PI * s);
          squash = open * 0.09;
          y = i + s + 0.105 * open;
        }
      } else if (i === meRank - 1 && r < meRank) {
        /* игрок завис выше своего места — строка над ним подаётся вверх, чтобы
           он не лёг на неё текстом. Села на место — она возвращается */
        y = i - (meRank - r) * 0.92 * launch;
        moving = true;
      }
      rec.el.style.transform = "translate(0," + (y * rowH - camY).toFixed(2) + "px)" +
        (squash > 0.001 ? " scale(1.02," + (1 - squash).toFixed(3) + ")" : "");
      if (rec.o !== open) {
        rec.o = open;
        lbVar(rec.el, "--lb-open", open > 0.02 ? open.toFixed(2) : "0");
      }
      if (rec.m !== moving) {
        rec.m = moving;
        if (rec.el.classList) rec.el.classList.toggle("lb-shift", moving);
      }
      lbSetPlace(rec.place, i + shift);
      if (rec.rank !== i + shift) {
        rec.rank = i + shift;
        lbSetRankClasses(rec.el, i + shift);
      }
    }

    /* место в строке игрока бежит по числам */
    if (mePlace) {
      const cur = Math.max(meRank, Math.min(oldRank, Math.round(r)));
      if (cur !== shownRank) {
        shownRank = cur;
        lbSetPlace(mePlace, cur);
        lbBump(mePlace, 1.18);
      }
    }

    /* посадка: удар, кольцо, искры, тряска */
    if (!landed && gone >= doneAt) {
      landed = nowT;
      const screenY = meY - camY + rowH / 2;
      if (mePlace) lbSetPlace(mePlace, meRank);
      shownRank = meRank;
      lbRing(view, screenY, true);
      lbSparks(view, viewW * 0.5, screenY, 12);
      lbShake(box, 7);
      lbBump(meNick, 1.3);
      lbBump(meScore, 1.34);
    }

    /* отскок после посадки: затухающая пружина */
    let bounce = 0;
    if (landed) {
      const lt = nowT - landed;
      bounce = Math.sin(lt / 60) * Math.exp(-lt / 170) * 0.5;
    }
    const sy = (1 + st) * (1 + bounce * 0.55);
    const sx = (1 - st * 0.1) * (1 - bounce * 0.26);
    if (meEl) {
      meEl.style.transform = "translate(0," + (meY - camY).toFixed(2) + "px) scale(" +
        sx.toFixed(3) + "," + sy.toFixed(3) + ")";
      lbVar(meEl, "--lb-tail", Math.round(st * 520) + "px");
      lbVar(meEl, "--lb-tail-a", Math.min(0.72, st * 7).toFixed(2));
    }
    if (spot) spot.style.transform = "translate3d(0," + (meY - camY - rowH * 1.2) + "px,0)";

    if (gone >= doneAt && (Math.abs(goal - cam) < 1.5 || gone >= doneAt + 520)) {
      finalize();
      lbFinish = null;
      lbCountRaf = 0;
      return;
    }
    lbCountRaf = lbRaf(tickWrap);
  };

  /* любая ошибка в кадре не должна оставлять таблицу в полёте: сразу падаем в
     финальную раскладку и отпускаем окно */
  function tickWrap(ts) {
    try {
      step(ts);
    } catch (err) {
      if (typeof window !== "undefined") window.__lbErr = String((err && err.message) || err);
      lbCountRaf = 0;
      finalize();
      lbFinish = null;
    }
  }

  lbCountRaf = lbRaf(tickWrap);
}

/* ---------- окно таблицы из главного меню ----------
   Кнопка «🏆» в доке (js/input.js: lbBtn) открывает ТУ ЖЕ таблицу, что и после
   смерти, — это не копия, а сам узел #deathBoard. При открытии он переезжает из
   окна смерти в окно меню (#lbMenu) и живёт там со всей своей машинерией:
   камерой, драгом с инерцией, подсказками «ТОП-1 ↑» и «#N» (lbScrollBind),
   медалями и подсветкой своей строки. На закрытии возвращается на место, чтобы
   смерть снова показывала его в #overlay.
   Поэтому вид и поведение совпадают буквально: классы, строки и анимация
   прокрутки — одни и те же. Само окно меню — тот же кадр, что #overlay: тот же
   градиент и тот же масштаб --ov (style.css: #lbMenu). */
const lbMenuHome = (function () {
  const board = document.getElementById("deathBoard");
  return board ? board.parentNode : null;
})();

function lbMenuOpen() {
  const box = document.getElementById("lbMenu");
  return !!box && !box.classList.contains("hidden");
}

function openLbMenu() {
  const box = document.getElementById("lbMenu");
  const body = document.getElementById("lbMenuBody");
  const board = document.getElementById("deathBoard");
  if (!box || !body || !board) return;
  if (typeof Sfx !== "undefined" && Sfx.ensure) Sfx.ensure();
  /* переносим сам узел: так меню получает и камеру, и инерцию, и «ТОП-1 ↑» */
  if (board.parentNode !== body) body.appendChild(board);
  box.classList.remove("hidden");
  box.setAttribute("aria-hidden", "false");
  /* record: false — без полёта за рекорд: строки встают по местам, камера — у
     строки игрока, и таблицу сразу можно тащить, как после смерти без рекорда */
  leaderboardShow({ score: Math.max(0, save.best | 0), base: 0, record: false, startTop: true });
}

function closeLbMenu() {
  const box = document.getElementById("lbMenu");
  if (!box || box.classList.contains("hidden")) return;
  /* lbStop снимает камеру, драг и таймеры: иначе обработчики остались бы висеть
     на узле, который сейчас уедет обратно в окно смерти */
  leaderboardHide();
  const board = document.getElementById("deathBoard");
  if (board) {
    board.hidden = true;
    if (lbMenuHome && board.parentNode !== lbMenuHome) lbMenuHome.appendChild(board);
  }
  box.classList.add("hidden");
  box.setAttribute("aria-hidden", "true");
}

if (typeof document !== "undefined") {
  const lbMenuCloseBtn = document.getElementById("lbMenuClose");
  if (lbMenuCloseBtn) {
    lbMenuCloseBtn.addEventListener("click", e => {
      e.stopPropagation();
      closeLbMenu();
    });
  }
  const lbMenuBox = document.getElementById("lbMenu");
  if (lbMenuBox) {
    /* Поле игры слушает pointerdown на #stage: в меню любой клик по нему
       запускает забег. Окно таблицы этот клик не должен пропускать — иначе
       игра начиналась бы за таблицей. */
    lbMenuBox.addEventListener("pointerdown", e => e.stopPropagation());
    lbMenuBox.addEventListener("click", e => {
      e.stopPropagation();
      /* клик по самой таблице не закрывает: там листают и жмут подсказки */
      if (e.target && e.target.closest && e.target.closest(".lb")) return;
      closeLbMenu();
    });
  }
  if (typeof document.addEventListener === "function") {
    document.addEventListener("keydown", e => {
      if (e.key !== "Escape" && e.key !== "Esc") return;
      if (lbMenuOpen()) closeLbMenu();
    });
  }
}


/* Отладка вида из адресной строки: ...#lbtest открывает таблицу через секунду
   после загрузки — так её снимают headless-проверки. В обычной игре хеша нет,
   и код спит. */
/* Предзагрузка реальной таблицы лидеров из Supabase.
   В iframe демки (?bh_replay=1) не нужна. */
if (typeof window !== "undefined" && !/[?&]bh_replay=1(?:&|$)/.test(location.search)) {
  setTimeout(lbRefreshReal, 900);
  setInterval(lbRefreshReal, LB_REFRESH_MS);
}

if (typeof location !== "undefined" && location.hash === "#lbtest") {
  setTimeout(function () { openLbMenu(); }, 1500);
}
