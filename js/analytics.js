/* ============================================================
   БРЕВНО HIT — КЛИЕНТ АНАЛИТИКИ
   ------------------------------------------------------------
   • выдаёт игроку личный токен (хранится в localStorage);
   • обязательно спрашивает ник у новичка;
   • записывает забег: какое бревно/босс, каждый бросок, угол, скин ножа,
     результат, яблоки, жизни, смерти и возрождения;
   • считает FPS и провалы ниже 55, время в игре, рекламу, покупки;
   • отправляет отзывы (после 4-й игры — обязательно);
   • открывает админку, если в отзыве был секретный код (проверяет сервер).

   Любая ошибка аналитики НЕ должна ломать игру: все хвосты обёрнуты в try.
   ============================================================ */
(function () {
  "use strict";
  if (window.Analytics) return;

  /* Публичная конфигурация Supabase (js/supabase-config.js). */
  const SB = window.BH_SUPABASE || {};
  /* ?bh_replay=1 — index.html открыт админкой внутри iframe для показа демки.
     В этом режиме аналитика полностью молчит и не создаёт игрока. */
  const REPLAY_HOST = /[?&]bh_replay=1(?:&|$)/.test(
    typeof location !== "undefined" ? location.search : ""
  );

  const LS_SUPA_TOKEN = "bh_supa_token";
  const LS_SUPA_PID = "bh_supa_pid";
  const LS_EVENTS = "bh_an_events";
  const LS_RUNS = "bh_an_runs";
  const LS_REVIEW_DONE = "bh_review_done";
  const LS_REVIEW_Q = "bh_an_reviewq";
  const SYNC_MS = 10000;
  const FREE_APPLES_COOLDOWN_MS = 5 * 60 * 1000;
  const FREE_APPLES_MIN = 200;
  const FREE_APPLES_MAX = 500;
  const MAX_RUN_FRAMES = 4200;
  const MAX_RUN_EVENTS = 1400;
  const MAX_RUN_THROWS = 900;
  const MAX_RUN_LEVELS = 400;
  /* Кадры [t, angle, hp] — только редкая дорожка для графиков админки.
     Раньше игра снимала их 20 раз в секунду; для настоящей демки они больше
     не нужны: воспроизведение идёт по сценам уровней и таймлайну бросков. */
  const FRAME_SAMPLE_MS = 1000;
  const MAX_QUEUED_EVENTS = 300;
  const MAX_QUEUED_RUNS = 3;

  const A = {
    enabled: typeof location !== "undefined" && /^https?:$/.test(location.protocol) && !REPLAY_HOST,
    ready: false,
    online: false,
    supaPid: "",
    supaToken: "",
    supaReady: false,
    supaNextTry: 0,
    device: null,
    events: [],
    runs: [],
    reviews: [],
    pendingFps: { frames: 0, ms: 0, low: 0, episodes: 0 },
    wasLowFps: false,
    pendingPlayMs: 0,
    lastPlayAt: 0,
    flushing: false,
    syncTimer: 0,
    lastFlushAt: 0,
    reviewMode: "optional",
    reviewRating: 0,
    reviewKind: "review",
    reviewExists: false,
    myReview: null,
    myReviewFor: "",
    myReviewLoaded: false,
    myReviewLoading: false,
    nickShown: false,
    forceBusy: false,
    freeBusy: false,
    lastPressAt: 0,
    run: null,
    bootAt: Date.now()
  };

  /* ---------- мелкие безопасные утилиты ---------- */
  function $(id) { return document.getElementById(id); }
  function safe(fn, fallback) {
    try { return fn(); } catch (err) { return fallback; }
  }
  function num(v, d) {
    const n = Math.floor(+v);
    return Number.isFinite(n) ? n : (d || 0);
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function readJson(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || "null") || fallback; }
    catch (err) { return fallback; }
  }
  function writeJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (err) { return false; }
  }
  /* ---------- Supabase (PostgREST RPC) ----------
     Клиенту доступны только RPC-функции из supabase/schema.sql.
     Прямого чтения таблиц у игрока нет. */
  function sbBase() { return String(SB.url || "").replace(/\/+$/, ""); }
  function sbReady() { return !!(SB.url && SB.key); }
  function sbRpcUrl(name) { return sbBase() + "/rest/v1/rpc/" + name; }
  function sbHeaders(token) {
    const h = {
      "Content-Type": "application/json",
      "apikey": SB.key
    };
    h.Authorization = "Bearer " + (token || SB.key);
    return h;
  }

  async function rpc(name, params, opts) {
    if (!sbReady()) throw new Error("supabase_not_configured");
    const res = await fetch(sbRpcUrl(name), {
      method: "POST",
      headers: sbHeaders(""),
      credentials: "omit",
      cache: "no-store",
      keepalive: !!(opts && opts.keepalive),
      body: JSON.stringify(params || {})
    });
    let data = null;
    try {
      const text = await res.text();
      data = text ? JSON.parse(text) : null;
    } catch (err) { data = null; }
    if (!res.ok) {
      const msg = (data && (data.message || data.error || data.hint)) || ("HTTP " + res.status);
      const err = new Error(msg);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data || {};
  }

  function isBadToken(err) {
    return !!(err && /bad_token/i.test(String(err.message || "")));
  }

  /* Игрок — это случайный токен в localStorage. В базе лежит только его SHA-256. */
  function makeToken() {
    try {
      const bytes = new Uint8Array(32);
      (window.crypto || window.msCrypto).getRandomValues(bytes);
      let s = "";
      for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
      return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    } catch (err) {
      let s = "bh_";
      for (let i = 0; i < 40; i++) s += "abcdefghijklmnopqrstuvwxyz0123456789".charAt(
        Math.floor(Math.random() * 36)
      );
      return s;
    }
  }

  /* ---------- Supabase: единственный источник аналитики ---------- */
  function readSupaToken() {
    try { return localStorage.getItem(LS_SUPA_TOKEN) || ""; }
    catch (err) { return ""; }
  }
  function saveSupaToken() {
    try {
      if (A.supaToken) localStorage.setItem(LS_SUPA_TOKEN, A.supaToken);
      if (A.supaPid) localStorage.setItem(LS_SUPA_PID, A.supaPid);
    } catch (err) {}
  }

  let supaPromise = null;
  function ensureSupaPlayer() {
    if (!sbReady()) return Promise.resolve(false);
    if (supaPromise) return supaPromise;
    supaPromise = ensureSupaPlayerOnce().finally(function () { supaPromise = null; });
    return supaPromise;
  }

  async function ensureSupaPlayerOnce() {
    if (!sbReady() || Date.now() < A.supaNextTry) return false;
    if (!A.supaToken) A.supaToken = readSupaToken();
    if (!A.supaPid) {
      try { A.supaPid = localStorage.getItem(LS_SUPA_PID) || ""; } catch (err) {}
    }
    if (!A.supaToken) {
      A.supaToken = makeToken();
      saveSupaToken();
    }
    if (A.supaPid) {
      try {
        const s = await rpc("bh_session", { p_token: A.supaToken });
        if (s && s.ok) {
          A.supaReady = true;
          return true;
        }
      } catch (err) {
        if (!/bad_token/i.test(String(err && err.message || ""))) {
          A.supaReady = false;
          A.supaNextTry = Date.now() + 2 * 60 * 1000;
          return false;
        }
        /* Старый токен от удалённого профиля — регистрируем заново. */
        A.supaPid = "";
      }
    }
    try {
      const d = await rpc("bh_register", {
        p_token: A.supaToken,
        p_nick: safe(function () { return save.nick || ""; }, "")
      });
      if (d && d.ok) {
        A.supaPid = d.id;
        A.supaReady = true;
        saveSupaToken();
        return true;
      }
    } catch (err) {
      A.supaReady = false;
      if (err && (err.status === 404 || /PGRST202|Could not find the function/i.test(String(err.message || "")))) {
        A.supaNextTry = Date.now() + 30 * 60 * 1000;
      } else {
        A.supaNextTry = Date.now() + 2 * 60 * 1000;
      }
    }
    return false;
  }

  function deviceInfo() {
    const ua = navigator.userAgent || "";
    const touch = !!(window.matchMedia && matchMedia("(pointer: coarse)").matches);
    let type = "desktop";
    if (/iPad|Tablet|PlayBook|Silk|Android(?!.*Mobile)/i.test(ua)) type = "tablet";
    else if (/Android|iPhone|iPod|Windows Phone|Mobile|webOS|BlackBerry/i.test(ua)) type = "mobile";
    else if (touch) type = "tablet";
    let os = "Другая";
    if (/Windows NT/i.test(ua)) os = "Windows";
    else if (/Android/i.test(ua)) os = "Android";
    else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
    else if (/Mac OS X/i.test(ua)) os = "macOS";
    else if (/Linux/i.test(ua)) os = "Linux";
    let browser = "Другой";
    if (/YaBrowser/i.test(ua)) browser = "Yandex";
    else if (/Edg\//i.test(ua)) browser = "Edge";
    else if (/OPR\/|Opera/i.test(ua)) browser = "Opera";
    else if (/Firefox\//i.test(ua)) browser = "Firefox";
    else if (/Chrome\//i.test(ua)) browser = "Chrome";
    else if (/Safari\//i.test(ua)) browser = "Safari";
    return {
      type: type,
      os: os,
      browser: browser,
      screen: (screen.width || 0) + "x" + (screen.height || 0),
      dpr: Math.round((window.devicePixelRatio || 1) * 100) / 100,
      lang: navigator.language || "",
      platform: navigator.platform || "",
      touch: touch,
      cores: navigator.hardwareConcurrency || 0,
      memory: navigator.deviceMemory || 0
    };
  }

  /* ---------- профиль/снапшот ---------- */
  function snapshot() {
    return safe(function () {
      return {
        nick: (typeof save !== "undefined" && save.nick) || "",
        apples: num(game.apples),
        rubles: num(save.rubles),
        appleSpent: num(save.appleSpent),
        rubSpent: num(save.rubSpent),
        premium: !!(save && save.premium),
        record: num(save.best),
        bestLevel: num(save.bestLevel),
        owned: (save.owned || []).slice(0, 400),
        items: save.items || {},
        stats: typeof stats !== "undefined" ? {
          runs: stats.runs, deaths: stats.deaths, knives: stats.knives,
          sticks: stats.sticks, handles: stats.handles, apples: stats.apples,
          livesLost: stats.livesLost, bosses: stats.bosses,
          bossesById: stats.bossesById || {},
          tiers: stats.tiers || {}
        } : {},
        device: A.device || deviceInfo()
      };
    }, {});
  }

  /* ---------- очередь событий ---------- */
  function queueEvent(ev) {
    if (!A.enabled) return;
    if (typeof window !== "undefined" && window.__BH_REPLAY_ACTIVE) return;
    try {
      ev.t = Date.now();
      A.events.push(ev);
      if (A.events.length > MAX_QUEUED_EVENTS) {
        A.events.splice(0, A.events.length - MAX_QUEUED_EVENTS);
      }
      saveEventsSoon();
      scheduleFlush();
    } catch (err) {}
  }

  let saveEventsTimer = 0;
  function saveEventsSoon() {
    if (saveEventsTimer) return;
    saveEventsTimer = setTimeout(function () {
      saveEventsTimer = 0;
      persistEventQueue();
    }, 1800);
  }

  function persistEventQueue() {
    try {
      if (A.events.length) writeJson(LS_EVENTS, A.events);
      else localStorage.removeItem(LS_EVENTS);
    } catch (err) {}
  }

  function scheduleFlush() {
    if (A.syncTimer) return;
    A.syncTimer = setTimeout(function () {
      A.syncTimer = 0;
      flush(false);
    }, 6000);
  }

  function saveRunQueue() {
    try {
      if (!A.runs.length) { localStorage.removeItem(LS_RUNS); return; }
      let arr = A.runs.slice(-MAX_QUEUED_RUNS);
      let text = JSON.stringify(arr);
      while (text.length > 1900000 && arr.length > 1) {
        arr.shift();
        text = JSON.stringify(arr);
      }
      localStorage.setItem(LS_RUNS, text);
    } catch (err) {}
  }

  /* ---------- отправка ---------- */
  function requeue(events, fps, play) {
    A.events = events.concat(A.events).slice(-MAX_QUEUED_EVENTS);
    A.pendingFps.frames += fps.frames;
    A.pendingFps.ms += fps.ms;
    A.pendingFps.low += fps.low;
    A.pendingFps.episodes += fps.episodes;
    A.pendingPlayMs += play;
    saveEventsSoon();
  }

  async function flush(keepalive) {
    if (!A.enabled) return;
    if (typeof window !== "undefined" && window.__BH_REPLAY_ACTIVE) return;
    if (A.flushing && !keepalive) return;
    A.flushing = true;
    try {
      const events = A.events.splice(0, 100);
      const fps = A.pendingFps;
      const play = A.pendingPlayMs;
      A.pendingFps = { frames: 0, ms: 0, low: 0, episodes: 0 };
      A.pendingPlayMs = 0;
      const body = {
        events: events,
        heartbeat: { activeMs: Math.round(play) },
        fps: { frames: fps.frames, ms: Math.round(fps.ms), low: fps.low, episodes: fps.episodes },
        snapshot: snapshot()
      };

      const ready = await ensureSupaPlayer();
      if (!ready) {
        requeue(events, fps, play);
        return;
      }

      try {
        await rpc("bh_track", { p_token: A.supaToken, p_payload: body }, { keepalive: !!keepalive });
        A.online = true;
        A.lastFlushAt = Date.now();
        persistEventQueue();
      } catch (err) {
        requeue(events, fps, play);
        A.online = false;
        if (isBadToken(err)) {
          A.supaPid = "";
          A.supaNextTry = 0;
        }
      }
    } catch (err) {
      /* тихо: аналитика не должна ломать игру */
    } finally {
      A.flushing = false;
    }
  }

  /* Демка не должна превышать лимит тела запроса Supabase.
     Сначала убираем самое тяжёлое и необязательное, броски и уровни — в конце. */
  function compactRun(run) {
    let copy;
    try { copy = JSON.parse(JSON.stringify(run)); }
    catch (err) { return run; }
    const tooBig = function () {
      try { return JSON.stringify(copy).length > 780000; }
      catch (err) { return true; }
    };
    if (!tooBig()) return copy;
    if (Array.isArray(copy.levels)) {
      for (const lv of copy.levels) if (lv && typeof lv === "object") lv.spin = null;
    }
    if (!tooBig()) return copy;
    if (Array.isArray(copy.levels)) {
      for (const lv of copy.levels) {
        if (lv && Array.isArray(lv.angles) && lv.angles.length > 400) {
          lv.angles = lv.angles.filter(function (x, i) { return i % 2 === 0; });
        }
      }
    }
    if (!tooBig()) return copy;
    copy.frames = [];
    if (!tooBig()) return copy;
    if (Array.isArray(copy.events) && copy.events.length > 600) copy.events = copy.events.slice(-600);
    if (Array.isArray(copy.throws) && copy.throws.length > 900) copy.throws = copy.throws.slice(-900);
    if (Array.isArray(copy.levels) && copy.levels.length > 80) copy.levels = copy.levels.slice(-80);
    return copy;
  }

  async function flushRuns() {
    if (!A.enabled || !A.runs.length) return;
    if (typeof window !== "undefined" && window.__BH_REPLAY_ACTIVE) return;
    const item = compactRun(A.runs[0]);
    if (!(await ensureSupaPlayer())) return;
    try {
      await rpc("bh_submit_run", { p_token: A.supaToken, p_run: item });
      A.runs.shift();
      saveRunQueue();
    } catch (err) {
      if (err && /run_too_large|bad_run/i.test(String(err.message || ""))) {
        A.runs.shift();
        saveRunQueue();
      } else if (isBadToken(err)) {
        A.supaPid = "";
        A.supaNextTry = 0;
      }
    }
  }

  async function flushReviews() {
    if (!A.enabled || !A.reviews.length) return;
    if (typeof window !== "undefined" && window.__BH_REPLAY_ACTIVE) return;
    const item = A.reviews[0];
    const kind = normalizeReviewKind(item.kind || "review");
    if (!(await ensureSupaPlayer())) return;
    try {
      await rpc("bh_review", {
        p_token: A.supaToken,
        p_rating: kind === "review" ? clamp(item.rating | 0, 1, 5) : 0,
        p_text: item.text,
        p_kind: kind
      });
      A.reviews.shift();
      writeJson(LS_REVIEW_Q, A.reviews);
      if (kind === "review") A.myReviewLoaded = false;
    } catch (err) {
      if (err && /bad_rating|bad_text|bad_kind/i.test(String(err.message || ""))) {
        A.reviews.shift();
        writeJson(LS_REVIEW_Q, A.reviews);
      } else if (isBadToken(err)) {
        A.supaPid = "";
        A.supaNextTry = 0;
      }
    }
  }

  /* ---------- ник ---------- */
  function nickModal() { return $("nickModal"); }

  function showNickIfNeeded() {
    if (A.nickShown) return;
    const nick = safe(function () { return save.nick || ""; }, "");
    if (nick) { A.nickShown = true; return; }
    const modal = nickModal();
    if (!modal) return;
    A.nickShown = true;
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    const input = $("nickInput");
    if (input) {
      setTimeout(function () {
        try { input.focus({ preventScroll: true }); } catch (err) {}
      }, 120);
    }
  }

  function submitNick() {
    const input = $("nickInput");
    if (!input) return;
    let value = String(input.value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    value = value.replace(/[^\p{L}\p{N} _\-.!?]/gu, "").slice(0, 20);
    const errEl = $("nickError");
    if (value.length < 3) {
      if (errEl) errEl.textContent = "Ник — от 3 до 20 символов: буквы, цифры, пробел, _ - . ! ?";
      return;
    }
    safe(function () {
      save.nick = value;
      if (typeof persist === "function") persist();
    });
    if (errEl) errEl.textContent = "";
    const modal = nickModal();
    if (modal) {
      modal.hidden = true;
      modal.setAttribute("aria-hidden", "true");
    }
    queueEvent({ type: "nick", nick: value });
    safe(function () { if (typeof localStorage !== "undefined") localStorage.setItem("bh_nick", value); });
    if (typeof toast === "function") toast("ПРИВЕТ, " + value.toUpperCase());
    flush(false);
    maybeShowForcedReview();
  }

  /* ---------- отзыв ---------- */
  function reviewModal() { return $("reviewModal"); }

  function reviewDone() {
    try { return localStorage.getItem(LS_REVIEW_DONE) === "1"; } catch (err) { return false; }
  }

  function markReviewDone() {
    try { localStorage.setItem(LS_REVIEW_DONE, "1"); } catch (err) {}
  }

  function paintStars() {
    const box = $("reviewStars");
    if (!box) return;
    const stars = box.querySelectorAll("button[data-star]");
    for (let i = 0; i < stars.length; i++) {
      const v = +stars[i].getAttribute("data-star");
      stars[i].classList.toggle("on", v > 0 && v <= A.reviewRating);
      stars[i].setAttribute("aria-pressed", v === A.reviewRating ? "true" : "false");
    }
  }

  const REVIEW_KINDS = {
    review: {
      sub: "Поставьте оценку и напишите отзыв.",
      placeholder: "Что нравится, а что улучшить?",
      submit: "ОТПРАВИТЬ ОТЗЫВ"
    },
    bug: {
      sub: "Опишите, что сломалось и как это повторить.",
      placeholder: "Что произошло? Что вы делали перед этим?",
      submit: "ОТПРАВИТЬ БАГ"
    },
    complaint: {
      sub: "Опишите проблему или неприятную ситуацию.",
      placeholder: "Что случилось?",
      submit: "ОТПРАВИТЬ ЖАЛОБУ"
    },
    idea: {
      sub: "Расскажите, что добавить или изменить.",
      placeholder: "Ваша идея…",
      submit: "ОТПРАВИТЬ ИДЕЮ"
    }
  };

  function normalizeReviewKind(kind) {
    return REVIEW_KINDS[kind] ? kind : "review";
  }

  function reviewSubmitText(kind) {
    if (kind === "review" && A.reviewExists) return "СОХРАНИТЬ ОТЗЫВ";
    return REVIEW_KINDS[kind].submit;
  }

  async function loadMyReview(force) {
    if (!(await ensureSupaPlayer())) return null;
    if (!force && A.myReviewLoaded && A.myReviewFor === A.supaToken) return A.myReview;
    if (A.myReviewLoading) return A.myReview;
    A.myReviewLoading = true;
    try {
      const d = await rpc("bh_my_review", { p_token: A.supaToken });
      A.myReview = d && d.rating ? d : null;
      A.myReviewLoaded = true;
      A.myReviewFor = A.supaToken;
    } catch (err) {
      A.myReview = null;
    } finally {
      A.myReviewLoading = false;
    }
    return A.myReview;
  }

  async function hydrateMyReview() {
    const existing = await loadMyReview(false);
    A.reviewExists = !!(existing && existing.rating);
    if (A.reviewKind === "review") {
      const submit = $("reviewSubmit");
      if (submit) submit.textContent = reviewSubmitText("review");
    }
    if (!existing || !existing.rating) return;
    const modal = reviewModal();
    if (!modal || modal.hidden || A.reviewKind !== "review") return;
    if (!A.reviewRating) {
      A.reviewRating = clamp(existing.rating | 0, 1, 5);
      paintStars();
    }
    const text = $("reviewText");
    if (text && !text.value) {
      text.value = String(existing.text || "").slice(0, 2000);
      const count = $("reviewCount");
      if (count) count.textContent = text.value.length + " / 2000";
    }
    const sub = $("reviewSub");
    if (sub) {
      sub.textContent = A.reviewMode === "forced"
        ? "Вы уже оставили отзыв. Измените оценку или текст — и можно продолжать."
        : "Ваш отзыв уже сохранён. Можно изменить оценку и текст.";
    }
  }

  function setReviewKind(kind) {
    A.reviewKind = normalizeReviewKind(kind);
    const cfg = REVIEW_KINDS[A.reviewKind];
    const cats = $("reviewCats");
    if (cats) {
      const buttons = cats.querySelectorAll("button[data-kind]");
      for (let i = 0; i < buttons.length; i++) {
        buttons[i].classList.toggle("on", buttons[i].getAttribute("data-kind") === A.reviewKind);
      }
    }
    const stars = $("reviewStars");
    if (stars) stars.hidden = A.reviewKind !== "review";
    if (A.reviewKind !== "review") A.reviewRating = 0;
    paintStars();
    const sub = $("reviewSub");
    if (sub) {
      let subText;
      if (A.reviewKind === "review" && A.reviewExists) {
        subText = A.reviewMode === "forced"
          ? "Вы уже оставили отзыв. Измените оценку или текст — и можно продолжать."
          : "Ваш отзыв уже сохранён. Можно изменить оценку и текст.";
      } else if (A.reviewMode === "forced" && A.reviewKind === "review") {
        subText = "Вы сыграли 4 игры. Поставьте оценку и напишите пару слов — без этого дальше нельзя.";
      } else {
        subText = cfg.sub;
      }
      sub.textContent = subText;
    }
    const text = $("reviewText");
    if (text) text.placeholder = cfg.placeholder;
    const submit = $("reviewSubmit");
    if (submit) submit.textContent = reviewSubmitText(A.reviewKind);
    const err = $("reviewError");
    if (err) err.textContent = "";
    if (A.reviewKind === "review") hydrateMyReview();
  }

  function openReview(mode, kind) {
    const modal = reviewModal();
    if (!modal) return;
    A.reviewMode = mode === "forced" ? "forced" : "optional";
    A.reviewRating = 0;
    A.reviewKind = normalizeReviewKind(kind);
    const text = $("reviewText");
    if (text) text.value = "";
    const count = $("reviewCount");
    if (count) count.textContent = "0 / 2000";
    const err = $("reviewError");
    if (err) err.textContent = "";
    const close = $("reviewClose");
    if (close) close.hidden = A.reviewMode === "forced";
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    modal.classList.toggle("is-forced", A.reviewMode === "forced");
    setReviewKind(A.reviewKind);
    setTimeout(function () {
      try { if (text) text.focus({ preventScroll: true }); } catch (err) {}
    }, 140);
  }

  function closeReview() {
    if (A.reviewMode === "forced") return;
    const modal = reviewModal();
    if (modal) {
      modal.hidden = true;
      modal.setAttribute("aria-hidden", "true");
    }
  }

  async function submitReview() {
    const err = $("reviewError");
    const kind = normalizeReviewKind(A.reviewKind);
    const isReview = kind === "review";
    if (isReview && A.reviewRating < 1) {
      if (err) err.textContent = "Поставьте оценку от 1 до 5 звёзд.";
      return;
    }
    const textEl = $("reviewText");
    const text = String((textEl && textEl.value) || "").trim().slice(0, 2000);
    if (text.length < 3) {
      if (err) err.textContent = "Напишите хотя бы несколько слов.";
      return;
    }
    const rating = isReview ? clamp(A.reviewRating, 1, 5) : 0;
    const btn = $("reviewSubmit");
    if (btn) { btn.disabled = true; btn.textContent = "ОТПРАВЛЯЕМ…"; }
    let sent = false;
    try {
      if (await ensureSupaPlayer()) {
        await rpc("bh_review", {
          p_token: A.supaToken,
          p_rating: rating,
          p_text: text,
          p_kind: kind
        });
        sent = true;
      }
    } catch (err2) {}
    if (!sent) {
      A.reviews.push({ rating: rating, text: text, kind: kind, t: Date.now() });
      if (A.reviews.length > 5) A.reviews.shift();
      writeJson(LS_REVIEW_Q, A.reviews);
    }
    if (sent && isReview) {
      A.reviewExists = true;
      A.myReview = { rating: rating, text: text, t: new Date().toISOString() };
      A.myReviewLoaded = true;
      A.myReviewFor = A.supaToken;
    }
    markReviewDone();
    if (btn) { btn.disabled = false; btn.textContent = reviewSubmitText(kind); }
    const modal = reviewModal();
    if (modal) {
      modal.hidden = true;
      modal.setAttribute("aria-hidden", "true");
      modal.classList.remove("is-forced");
    }
    A.reviewMode = "optional";
    if (typeof toast === "function") {
      toast(sent ? "СПАСИБО! СООБЩЕНИЕ ОТПРАВЛЕНО" : "СООБЩЕНИЕ СОХРАНЕНО · ОТПРАВИМ ПОЗЖЕ");
    }
    queueEvent({ type: "custom", name: "review_submitted", value: rating });
    flush(true);
  }

  function adLayerOpen() {
    if (typeof premiumAdOpen !== "undefined" && premiumAdOpen) return true;
    const layer = $("adLayer");
    return !!(layer && !layer.classList.contains("hidden"));
  }

  function maybeShowForcedReview() {
    if (reviewDone()) return;
    const runs = safe(function () { return stats.runs | 0; }, 0);
    if (runs < 4) return;
    if (!A.nickShown || blockInput()) return;
    if (adLayerOpen()) return;
    if (typeof state !== "undefined" && state !== "menu") return;
    if (A.forceBusy) return;
    A.forceBusy = true;
    setTimeout(function () {
      A.forceBusy = false;
      if (!reviewDone() && !blockInput() && !adLayerOpen()) openReview("forced");
    }, 900);
  }

  /* ---------- алмазы и яблоки за рекламу ---------- */
  function fmtLeft(ms) {
    const total = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return m + ":" + (s < 10 ? "0" + s : String(s));
  }

  function updateFreeUI() {
    const btn = $("freeApplesBtn");
    if (!btn) return;
    const left = safe(function () { return (+save.freeAppleAt || 0) - Date.now(); }, 0);
    const cap = btn.querySelector(".more-cap");
    const ready = left <= 0;
    btn.classList.toggle("an-cool", !ready);
    btn.setAttribute("aria-disabled", ready ? "false" : "true");
    btn.title = ready
      ? "Посмотреть рекламу и получить 200–500 яблок"
      : "Следующие яблоки за рекламу через " + fmtLeft(left);
    if (cap) cap.textContent = ready ? "Яблоки" : fmtLeft(left);
  }

  function claimFreeApples() {
    if (A.freeBusy) return;
    const left = safe(function () { return (+save.freeAppleAt || 0) - Date.now(); }, 0);
    if (left > 0) {
      if (typeof toast === "function") toast("ПОДОЖДИТЕ " + fmtLeft(left) + " ДО НОВОЙ ПОРЦИИ");
      return;
    }
    const show = typeof showRewardedAd === "function"
      ? showRewardedAd
      : (typeof yxShowRewarded === "function" ? yxShowRewarded : null);
    if (!show) {
      if (typeof toast === "function") toast("РЕКЛАМА ПОКА НЕДОСТУПНА");
      return;
    }
    A.freeBusy = true;
    updateFreeUI();
    show(function () {
      A.freeBusy = false;
      const gain = FREE_APPLES_MIN + Math.floor(Math.random() * (FREE_APPLES_MAX - FREE_APPLES_MIN + 1));
      safe(function () {
        game.apples = (game.apples | 0) + gain;
        save.freeAppleAt = Date.now() + FREE_APPLES_COOLDOWN_MS;
        if (typeof persist === "function") persist();
        if (typeof syncHud === "function") syncHud();
        if (typeof Sfx !== "undefined" && Sfx.pick) Sfx.pick();
      });
      queueEvent({ type: "custom", name: "free_apples", value: gain });
      ad("rewarded", "apples");
      if (typeof toast === "function") toast("+" + gain + " ЯБЛОК ЗА РЕКЛАМУ");
      updateFreeUI();
      flush(false);
    }, function () {
      A.freeBusy = false;
      updateFreeUI();
      if (typeof toast === "function") toast("РЕКЛАМА НЕ ПОКАЗАЛАСЬ · ПОПРОБУЙТЕ ЧУТЬ ПОЗЖЕ");
    });
  }

  /* ---------- запись забега ---------- */
  function bossInfo() {
    return safe(function () {
      const b = game.log && game.log.boss;
      if (!b) return { id: "wood", name: "БРЕВНО", tier: "" };
      return {
        id: String(b.id || "boss"),
        name: String(b.name || b.id || "БОСС"),
        tier: typeof bossTierOf === "function" ? bossTierOf(b) : ""
      };
    }, { id: "wood", name: "БРЕВНО", tier: "" });
  }

  /* Ножи, уже стоявшие в бревне к началу уровня (в том числе «родные» ножи
     боссов), и яблоки на кромке. Демка должна начинаться ровно с этой картинки. */
  function collectStuck() {
    return safe(function () {
      return (game.stuck || []).slice(0, 120).map(function (s) {
        return {
          rel: +(+s.rel || 0).toFixed(4),
          skin: String(s.skin || "classic"),
          rad: +(+s.rad || 1).toFixed(4),
          player: s.player ? 1 : 0,
          scale: +(+s.scale || 1).toFixed(3)
        };
      });
    }, []);
  }

  function collectApples() {
    return safe(function () {
      return (game.logApples || []).slice(0, 60).map(function (a) {
        return {
          rel: +(+a.rel || 0).toFixed(4),
          rr: +(+a.rr || 0).toFixed(4),
          kind: String(a.kind || "plain")
        };
      });
    }, []);
  }

  /* ---------- «сид» бревна ----------
     Вместо снимка картинки 20 раз в секунду записываем состояние вращения:
     паттерн, скорость, направление, фазу, скрипты ходов, куски скорлупы и т.п.
     Демка восстановит это состояние и запустит настоящий движок — бревно
     поедет так же, как у игрока, без искусственных подстановок угла.
     Поля, которые зависят от размера экрана (x/y/r/scale) и мимолётные
     эффекты (вспышка, пружина), не пишем: их задаёт layout. */
  const SPIN_SKIP = {
    x: 1, y: 1, r: 1, scale: 1, alpha: 1, boss: 1, hp: 1, maxHp: 1,
    dmg: 1, hpTrail: 1, hpTrailHold: 1, hpNip: 1, hitFlash: 1, hitFlashT: 1,
    pulse: 1, pulseV: 1, kick: 1, leaves: 1, shellFly: 1, baked: 1
  };

  function plainValue(v, depth) {
    if (v == null) return null;
    const t = typeof v;
    if (t === "number") return isFinite(v) ? Math.round(v * 1e6) / 1e6 : null;
    if (t === "boolean") return v;
    if (t === "string") return v.length > 120 ? v.slice(0, 120) : v;
    if (depth >= 3) return null;
    if (Array.isArray(v)) {
      const out = [];
      const n = Math.min(v.length, 48);
      for (let i = 0; i < n; i++) out.push(plainValue(v[i], depth + 1));
      return out;
    }
    if (t === "object") {
      /* canvas/контекст/узлы DOM в демку не тащим */
      if (v.getContext || v.canvas || v.nodeType || v.ownerDocument) return null;
      const out = {};
      let n = 0;
      for (const k in v) {
        if (!Object.prototype.hasOwnProperty.call(v, k)) continue;
        if (!k || k.charAt(0) === "_") continue;
        const c = plainValue(v[k], depth + 1);
        if (c == null) continue;
        out[k] = c;
        if (++n >= 32) break;
      }
      return out;
    }
    return null;
  }

  function collectSpin() {
    return safe(function () {
      const log = game.log;
      if (!log) return {};
      const out = {};
      for (const k in log) {
        if (!Object.prototype.hasOwnProperty.call(log, k)) continue;
        if (SPIN_SKIP[k]) continue;
        const v = plainValue(log[k], 0);
        if (v != null) out[k] = v;
      }
      return out;
    }, {});
  }

  function runElapsed(now) {
    const r = A.run;
    if (!r) return 0;
    const t = (now || performance.now()) - r.t0;
    return clamp(Math.round(t), 0, 6 * 60 * 60 * 1000);
  }

  /* Время внутри текущего бревна. Все броски/яблоки/возрождения пишем и в
     общем времени забега, и в уровне: демка после перехода на новое бревно
     снова стартует свой уровень с нуля, поэтому тайминги не «уезжают». */
  function levelElapsed(now) {
    const r = A.run;
    if (!r) return 0;
    const t = (now || performance.now()) - (r.levelT0 || r.t0);
    return clamp(Math.round(t), 0, 6 * 60 * 60 * 1000);
  }

  function runEvent(type, data) {
    const r = A.run;
    if (!r) return;
    const ev = Object.assign({ t: runElapsed(), type: type }, data || {});
    r.events.push(ev);
    if (r.events.length > MAX_RUN_EVENTS * 2) {
      /* Старты уровней, смерти и возрождения не теряем: режем служебные
         события и яблоки (сами броски лежат в run.throws). */
      const keep = [];
      let dropped = 0;
      const overflow = r.events.length - MAX_RUN_EVENTS;
      for (const e of r.events) {
        const important = e.type === "start" || e.type === "level" ||
          e.type === "revive" || e.type === "death" || e.type === "end";
        if (!important && dropped < overflow) {
          dropped++;
          continue;
        }
        keep.push(e);
      }
      r.events = keep.slice(-MAX_RUN_EVENTS);
    }
  }

  /* Раз в ~100 мс пишем только угол бревна (два числа: время, угол). Это не
     «скриншоты», а опорная дорожка для синхронизации вращения в демке: паттерн
     остаётся движковым, но угол не уезжает из-за разницы кадров. */
  function sampleAngle(force) {
    const r = A.run;
    if (!r || r.levelIndex < 0) return;
    const lv = r.levels[r.levelIndex];
    if (!lv) return;
    const t = levelElapsed();
    const gap = force ? 35 : 100;
    if (t - (r.lastAngleSample == null ? -1000 : r.lastAngleSample) < gap) return;
    if (!lv.angles) lv.angles = [[0, +(+(lv.angle || 0)).toFixed(4)]];
    const last = lv.angles[lv.angles.length - 1];
    if (last && t <= last[0]) return;
    lv.angles.push([t, +(+(safe(function () { return game.log.angle || 0; }, 0))).toFixed(4)]);
    r.lastAngleSample = t;
    if (lv.angles.length > 5000) {
      const compact = [];
      for (let i = 0; i < lv.angles.length; i++) {
        if (i % 2 === 0 || i === lv.angles.length - 1) compact.push(lv.angles[i]);
      }
      lv.angles = compact;
    }
  }

  function sampleFrame(force) {
    const r = A.run;
    if (!r) return;
    const now = performance.now();
    const t = runElapsed(now);
    /* Плановый сэмпл — раз в секунду. Принудительный (старт уровня, смерть,
       возрождение) тоже не чаще 120 мс: серия бросков не должна снова
       превращать запись в «скриншот каждые 50 мс». */
    if (t - r.lastSample < (force ? 120 : FRAME_SAMPLE_MS)) return;
    r.lastSample = t;
    const angle = +(safe(function () { return game.log.angle || 0; }, 0)).toFixed(4);
    const hp = safe(function () { return Math.max(0, game.log.hp | 0); }, 0);
    r.frames.push([t, angle, hp]);
    if (r.frames.length > MAX_RUN_FRAMES) {
      /* прореживаем вдвое: дорожка не должна расти бесконечно */
      const compact = [];
      for (let i = 0; i < r.frames.length; i++) {
        if (i % 2 === 0 || i === r.frames.length - 1) compact.push(r.frames[i]);
      }
      r.frames = compact;
    }
  }

  function runStart() {
    if (!A.enabled) return;
    if (typeof window !== "undefined" && window.__BH_REPLAY_ACTIVE) return;
    if (A.run) finishRun("exit");
    const t = Date.now();
    A.run = {
      id: "run_" + t.toString(36) + "_" + Math.random().toString(36).slice(2, 7),
      t0: performance.now(),
      startedAt: t,
      durationMs: 0,
      level: safe(function () { return game.level | 0 || 1; }, 1),
      knife: safe(function () { return save.knife || "classic"; }, "classic"),
      boss: bossInfo(),
      /* «сид» забега и сцены уровней: по нему можно отличить одинаковые
         раскладки и восстановить картину, даже если бревно пересоздадут */
      seed: (Math.random() * 0x100000000) >>> 0,
      levels: [],
      levelT0: 0,
      levelIndex: -1,
      levelThrown: false,
      frames: [],
      events: [],
      throws: [],
      lastThrow: null,
      throwSeq: 0,
      apples: 0,
      livesLost: 0,
      revives: 0,
      score: 0,
      fps: { frames: 0, ms: 0, low: 0, episodes: 0 },
      lastSample: -1000,
      lastAngleSample: -1000
    };
    A.lastPressAt = 0;
    /* Первый уровень начинается прямо здесь: startRun в игре не зовёт
       startLevel (см. js/flow.js). Сцену фиксируем до первого броска. */
    levelStart(A.run.level, { start: true, skin: A.run.knife });
    scheduleFlush();
  }

  function levelStart(level, opts) {
    if (!A.run) return;
    if (typeof window !== "undefined" && window.__BH_REPLAY_ACTIVE) return;
    opts = opts || {};
    const r = A.run;
    const boss = bossInfo();
    const now = performance.now();
    const n = (r.levels.length + 1) | 0;
    r.level = level | 0 || 1;
    r.boss = boss;
    r.levelT0 = now;
    r.levelIndex = r.levels.length;
    const rec = {
      t: runElapsed(now),
      tL: 0,
      level: r.level,
      bossId: boss.id,
      bossName: boss.name,
      bossTier: boss.tier || "",
      theme: safe(function () { return game.theme | 0; }, 0),
      maxHp: safe(function () { return Math.max(1, game.log.maxHp | 0); }, 1),
      hp: safe(function () { return Math.max(0, game.log.hp | 0); }, 0),
      lives: safe(function () { return Math.max(0, game.lives | 0); }, 0),
      maxLives: safe(function () { return Math.max(3, game.maxLives | 0); }, 3),
      /* startRun() обнуляет recordNum сразу ПОСЛЕ Analytics.runStart, поэтому
         стартовую сцену пишем с нулём, а не с рекордом прошлого забега. */
      score: opts.start ? 0 : safe(function () { return Math.max(0, game.recordNum | 0); }, 0),
      buffSlow: safe(function () { return !!game.buffs.slow; }, false),
      buffDouble: safe(function () { return !!game.buffs.double; }, false),
      buffShield: safe(function () { return !!game.buffs.shield; }, false),
      /* true — заставка/intro этого уровня уже идёт внутри tL бросков */
      introIncluded: !opts.start,
      /* сколько длится вступление/наплыв: демка их не показывает, но время
         вычитает, чтобы первый бросок не ждал впустую */
      sting: safe(function () { return +(+game.sting || 0).toFixed(3); }, 0),
      /* Сколько бревно реально стоит на месте в заставке босса (до pop).
         Именно это время демка вырезает, а не всю заставку. */
      stingFreeze: safe(function () {
        /* только если заставка реально идёт: у обычного бревна sting=0,
           а stingPopAt() вернул бы дефолт 2.65 с и сжал бы весь таймлайн */
        if (!(game.sting > 0) || typeof stingPopAt !== "function") return 0;
        return +(+stingPopAt() || 0).toFixed(3);
      }, 0),
      intro: safe(function () { return +(+game.intro || 0).toFixed(3); }, 0),
      introCaptured: !opts.start,
      angle: safe(function () { return +(+game.log.angle || 0).toFixed(6); }, 0),
      spin: collectSpin(),
      knives: collectStuck(),
      apples: collectApples(),
      seed: ((r.seed ^ Math.imul(n, 0x9e3779b1)) >>> 0)
    };
    rec.angles = [[0, +(+rec.angle || 0).toFixed(4)]];
    r.lastAngleSample = 0;
    /* Продолжение забега: startRun() пишет сцену из меню (уровень 1), а
       resumeRun() сразу же зовёт startLevel(сохранённый уровень). Первую
       сцену заменяем настоящей, иначе демка начиналась с чужого бревна и
       обрывалась на первом переходе. */
    const replaceFirst = r.levels.length === 1 && r.throws.length === 0 && runElapsed(now) < 1500;
    if (replaceFirst) {
      rec.t = 0;
      rec.introIncluded = true;
      r.levelIndex = 0;
      r.levelT0 = now;
      r.levels[0] = rec;
      r.levelThrown = false;
      const evStart = r.events.find(function (e) { return e && e.type === "start"; });
      if (evStart) {
        evStart.level = rec.level;
        evStart.boss = rec.bossId;
        evStart.bossName = rec.bossName;
        evStart.hp = rec.hp;
        evStart.maxHp = rec.maxHp;
        evStart.lives = rec.lives;
        evStart.theme = rec.theme;
        evStart.seed = rec.seed;
        evStart.lvl = 0;
        evStart.tL = 0;
      }
      sampleFrame(true);
      return;
    }
    r.levels.push(rec);
    r.levelThrown = false;
    const ev = {
      level: rec.level,
      boss: rec.bossId,
      bossName: rec.bossName,
      hp: rec.hp,
      maxHp: rec.maxHp,
      lives: rec.lives,
      theme: rec.theme,
      lvl: r.levelIndex,
      tL: 0,
      seed: rec.seed
    };
    if (opts.start) {
      ev.skin = String(opts.skin || r.knife || "classic");
      runEvent("start", ev);
    } else {
      runEvent("level", ev);
    }
    sampleFrame(true);
  }

  function press() {
    if (typeof window !== "undefined" && window.__BH_REPLAY_ACTIVE) return;
    A.lastPressAt = performance.now();
  }

  function launch(now, skin) {
    if (!A.run) return;
    if (typeof window !== "undefined" && window.__BH_REPLAY_ACTIVE) return;
    const at = now || performance.now();
    const r = A.run;
    const t = runElapsed(at);
    const tL = levelElapsed(at);
    /* Жизни на старте уровня могли поменяться уже после levelStart — например,
       «ПРОДОЛЖИТЬ» выставляет их после startLevel. Первый бросок уточняет. */
    if (!r.levelThrown && r.levels[r.levelIndex]) {
      r.levels[r.levelIndex].lives = safe(function () { return Math.max(0, game.lives | 0); }, 0);
      r.levels[r.levelIndex].maxLives = safe(function () { return Math.max(3, game.maxLives | 0); }, 3);
      r.levelThrown = true;
    }
    const boss = bossInfo();
    const ang = +(safe(function () { return game.log.angle || 0; }, 0)).toFixed(4);
    let ptL = null;
    if (A.lastPressAt) {
      const p = Math.round(A.lastPressAt - (r.levelT0 || r.t0));
      if (p >= -20) ptL = Math.max(0, p);
    }
    const rec = {
      t: t,
      tL: tL,
      ptL: ptL,
      ang: ang,
      id: (r.throwSeq = (r.throwSeq | 0) + 1),
      skin: String(skin || "classic"),
      res: "",
      rel: null,
      rt: null,
      lvl: r.levelIndex,
      level: r.level,
      boss: boss.id,
      hp: safe(function () { return game.log.hp | 0; }, 0),
      apples: [],
      lead: A.lastPressAt ? Math.max(0, Math.min(600, Math.round(at - A.lastPressAt))) : 0
    };
    A.lastPressAt = 0;
    r.throws.push(rec);
    if (r.throws.length > MAX_RUN_THROWS) r.throws.shift();
    r.lastThrow = rec;
    /* Отдельное событие «бросок» больше не пишем: сам бросок уже лежит в
       run.throws со всеми полями. Так журнал событий не забивается и не
       вытесняет старты уровней. */
    sampleAngle(true);
  }

  function setResult(res, rel, extra) {
    if (!A.run) return;
    if (typeof window !== "undefined" && window.__BH_REPLAY_ACTIVE) return;
    const r = A.run;
    let rec = r.lastThrow;
    if (!rec || rec.res) {
      /* результат пришёл от ножа, который уже учтён: ищем последний без ответа */
      for (let i = r.throws.length - 1; i >= 0; i--) {
        if (!r.throws[i].res) { rec = r.throws[i]; break; }
      }
    }
    if (!rec) return;
    rec.res = String(res || "miss");
    rec.rt = runElapsed();
    rec.tRes = levelElapsed();
    if (rel != null) rec.rel = +(+rel).toFixed(4);
    if (extra && typeof extra === "object") {
      if (extra.hpAfter != null) rec.hpAfter = extra.hpAfter | 0;
      if (extra.dmg != null) rec.dmg = Math.max(1, extra.dmg | 0);
      if (extra.livesAfter != null) rec.livesAfter = Math.max(0, extra.livesAfter | 0);
      if (extra.kind != null) rec.kind = String(extra.kind).slice(0, 24);
      if (extra.line != null) rec.line = String(extra.line).slice(0, 120);
      if (extra.flash != null) rec.flash = String(extra.flash).slice(0, 32);
      if (extra.plateAng != null) rec.plateAng = +(+extra.plateAng).toFixed(4);
      if (extra.shield != null) rec.shield = !!extra.shield;
      if (extra.inf != null) rec.inf = !!extra.inf;
    }
    r.lastThrow = null;
    sampleAngle(true);
  }

  function apple(kind, gain, rel, rr) {
    if (!A.run) return;
    if (typeof window !== "undefined" && window.__BH_REPLAY_ACTIVE) return;
    const r = A.run;
    const a = {
      rel: rel == null ? null : +(+rel).toFixed(4),
      rr: rr == null ? null : +(+rr).toFixed(4),
      kind: String(kind || "plain"),
      gain: num(gain)
    };
    r.apples += num(gain);
    /* Привязываем яблоко к текущему броску: в демке оно снимется ровно в
       момент, когда нож садится в бревно, а не по отдельному таймеру. */
    const rec = r.lastThrow;
    if (rec && !rec.res) {
      if (!rec.apples) rec.apples = [];
      if (rec.apples.length < 24) rec.apples.push(a);
    }
    runEvent("apple", {
      kind: a.kind,
      gain: a.gain,
      rel: a.rel,
      rr: a.rr,
      lvl: r.levelIndex,
      tL: levelElapsed()
    });
  }

  function lifeLoss() {
    if (!A.run) return;
    if (typeof window !== "undefined" && window.__BH_REPLAY_ACTIVE) return;
    A.run.livesLost++;
    runEvent("life", {
      lives: safe(function () { return game.lives | 0; }, 0),
      lvl: A.run.levelIndex,
      tL: levelElapsed()
    });
  }

  function revive() {
    if (!A.run) return;
    if (typeof window !== "undefined" && window.__BH_REPLAY_ACTIVE) return;
    A.run.revives++;
    runEvent("revive", {
      lives: safe(function () { return game.lives | 0; }, 0),
      lvl: A.run.levelIndex,
      tL: levelElapsed()
    });
    sampleFrame(true);
  }

  function failEvent(death, extra) {
    if (!A.run) return;
    if (typeof window !== "undefined" && window.__BH_REPLAY_ACTIVE) return;
    if (!A.run.throws.length) return;
    const last = A.run.throws[A.run.throws.length - 1];
    if (last) {
      if (!last.res) {
        last.res = death ? "death" : "miss";
        last.rt = runElapsed();
        last.tRes = levelElapsed();
      }
      if (extra && typeof extra === "object") {
        if (extra.livesAfter != null) last.livesAfter = Math.max(0, extra.livesAfter | 0);
        if (extra.shield != null) last.shield = !!extra.shield;
        if (extra.inf != null) last.inf = !!extra.inf;
      }
    }
    runEvent(death ? "death" : "miss", {
      lives: extra && extra.livesAfter != null ? extra.livesAfter | 0 : undefined,
      lvl: A.run.levelIndex,
      tL: levelElapsed()
    });
  }

  function finishRun(result) {
    const r = A.run;
    if (!r) return;
    A.run = null;
    try {
      r.durationMs = Math.max(1, clamp(Math.round(performance.now() - r.t0), 0, 6 * 60 * 60 * 1000));
      r.endedAt = Date.now();
      r.result = String(result || "exit");
      r.score = safe(function () { return game.recordNum | 0; }, 0);
      r.level = Math.max(r.level | 0, safe(function () { return game.level | 0; }, 1));
      r.knife = safe(function () { return save.knife || r.knife; }, r.knife);
      /* Страховка от гигантских забегов: оставляем последние уровни, а ссылки
         бросков/событий на уровень сдвигаем вместе с массивом. */
      if (r.levels.length > MAX_RUN_LEVELS) {
        const cut = r.levels.length - MAX_RUN_LEVELS;
        r.levels = r.levels.slice(cut);
        r.throws = r.throws
          .filter(th => th.lvl == null || (th.lvl | 0) >= cut)
          .map(th => { if (th.lvl != null) th.lvl = (th.lvl | 0) - cut; return th; });
        r.events = r.events
          .filter(ev => ev.lvl == null || (ev.lvl | 0) >= cut)
          .map(ev => { if (ev.lvl != null) ev.lvl = (ev.lvl | 0) - cut; return ev; });
      }
      if (!r.frames.length) r.frames.push([0, 0, 0], [r.durationMs, 0, 0]);
      if (r.frames[r.frames.length - 1][0] < r.durationMs) {
        r.frames.push([r.durationMs, r.frames[r.frames.length - 1][1], r.frames[r.frames.length - 1][2]]);
      }
      r.fps.low = Math.min(r.fps.low, r.fps.frames);
      r.device = A.device ? A.device.type : "";
      r.events.push({ t: r.durationMs, type: "end", result: r.result, score: r.score });
      /* страховка от гигантских демок */
      if (r.frames.length > MAX_RUN_FRAMES) {
        const step = Math.ceil(r.frames.length / MAX_RUN_FRAMES);
        const compact = [];
        for (let i = 0; i < r.frames.length; i += step) compact.push(r.frames[i]);
        compact.push(r.frames[r.frames.length - 1]);
        r.frames = compact;
      }
      if (r.events.length > MAX_RUN_EVENTS) r.events = r.events.slice(-MAX_RUN_EVENTS);
      if (r.throws.length > MAX_RUN_THROWS) r.throws = r.throws.slice(-MAX_RUN_THROWS);
      A.runs.push(r);
      if (A.runs.length > MAX_QUEUED_RUNS) A.runs.shift();
      saveRunQueue();
      flushRuns();
      flush(false);
    } catch (err) {}
  }

  /* ---------- FPS и время ---------- */
  function fpsSample(inst, rawDt) {
    if (!(inst > 0) || !(rawDt > 0)) return;
    if (typeof window !== "undefined" && window.__BH_REPLAY_ACTIVE) return;
    const dtMs = rawDt * 1000;
    if (dtMs > 2000) return;
    A.pendingFps.frames++;
    A.pendingFps.ms += dtMs;
    if (inst < 55) {
      A.pendingFps.low++;
      if (!A.wasLowFps) A.pendingFps.episodes++;
      A.wasLowFps = true;
    } else {
      A.wasLowFps = false;
    }
    if (A.run) {
      A.run.fps.frames++;
      A.run.fps.ms += dtMs;
      if (inst < 55) {
        A.run.fps.low++;
        if (!A.run.wasLowFps) A.run.fps.episodes++;
        A.run.wasLowFps = true;
      } else {
        A.run.wasLowFps = false;
      }
    }
  }

  /* Первый уровень забега записывается в runStart ДО beginBossSting, поэтому
     длину вступления добираем на первых кадрах: game.sting/intro ещё почти
     полные. Нужна она только демке — чтобы вырезать заставку из таймлайна. */
  function captureIntro() {
    const r = A.run;
    if (!r || !r.levels || r.levelIndex < 0) return;
    const lv = r.levels[r.levelIndex];
    if (!lv || lv.introCaptured) return;
    const st = safe(function () { return +(+game.sting || 0); }, 0);
    const it = safe(function () { return +(+game.intro || 0); }, 0);
    const fr = st > 0 && typeof stingPopAt === "function"
      ? safe(function () { return +(+stingPopAt() || 0); }, 0)
      : 0;
    if (st > (lv.sting || 0)) lv.sting = Math.round(st * 1000) / 1000;
    if (fr > (lv.stingFreeze || 0)) lv.stingFreeze = Math.round(fr * 1000) / 1000;
    if (it > (lv.intro || 0)) lv.intro = Math.round(it * 1000) / 1000;
    if (st <= 0 && it <= 0) lv.introCaptured = true;
  }

  function frame() {
    if (!A.enabled) return;
    if (typeof window !== "undefined" && window.__BH_REPLAY_ACTIVE) return;
    const now = performance.now();
    captureIntro();
    sampleAngle(false);
    if (A.lastPlayAt && !document.hidden && !(window.GamePause && GamePause.on)) {
      const d = now - A.lastPlayAt;
      if (d > 0 && d < 2000) A.pendingPlayMs += d;
    }
    A.lastPlayAt = now;
    if (A.run) sampleFrame(false);
  }

  /* ---------- покупки / реклама ---------- */
  function purchase(p) {
    if (!p) return;
    queueEvent({
      type: "purchase",
      kind: String(p.kind || ""),
      id: String(p.id || ""),
      name: String(p.name || ""),
      cost: num(p.cost),
      currency: String(p.currency || "")
    });
    flush(false);
  }

  function ad(mode, purpose, extra) {
    queueEvent(Object.assign({
      type: "ad",
      mode: String(mode || ""),
      purpose: String(purpose || "")
    }, extra || {}));
    flush(false);
  }

  function bannerClick(id, name) {
    if (typeof window !== "undefined" && window.__BH_REPLAY_ACTIVE) return;
    queueEvent({
      type: "banner_click",
      id: String(id || "banner").slice(0, 40),
      name: String(name || id || "Баннер").slice(0, 60)
    });
    /* клик по ссылке уводит со страницы — отправляем сразу, с keepalive */
    flush(true);
  }

  function knifeApply(id, name) {
    if (typeof window !== "undefined" && window.__BH_REPLAY_ACTIVE) return;
    queueEvent({
      type: "knife_apply",
      id: String(id || "").slice(0, 40),
      name: String(name || id || "").slice(0, 60)
    });
    flush(false);
  }

  /* ---------- меню/модалки ---------- */
  function modalOpen() {
    const nick = $("nickModal");
    if (nick && !nick.hidden) return true;
    const rev = $("reviewModal");
    if (rev && !rev.hidden) return true;
    return false;
  }

  function blockInput() {
    if (typeof window !== "undefined" && window.Replay && Replay.active && Replay.active()) return true;
    return modalOpen();
  }

  function onMenu() {
    if (typeof window !== "undefined" && window.__BH_REPLAY_ACTIVE) return;
    updateFreeUI();
    maybeShowForcedReview();
    flush(false);
  }

  /* ---------- привязка интерфейса ---------- */
  function bindUi() {
    const nickBtn = $("nickSubmit");
    if (nickBtn) nickBtn.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); submitNick(); });
    const nickInput = $("nickInput");
    if (nickInput) {
      nickInput.addEventListener("keydown", function (e) {
        e.stopPropagation();
        if (e.code === "Enter" || e.code === "NumpadEnter") {
          e.preventDefault();
          submitNick();
        }
      });
    }

    const close = $("reviewClose");
    if (close) close.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); closeReview(); });
    const submit = $("reviewSubmit");
    if (submit) submit.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); submitReview(); });
    const cats = $("reviewCats");
    if (cats) {
      cats.addEventListener("click", function (e) {
        const b = e.target && e.target.closest ? e.target.closest("button[data-kind]") : null;
        if (!b) return;
        e.preventDefault();
        e.stopPropagation();
        setReviewKind(b.getAttribute("data-kind"));
      });
    }
    const stars = $("reviewStars");
    if (stars) {
      stars.addEventListener("click", function (e) {
        const b = e.target && e.target.closest ? e.target.closest("button[data-star]") : null;
        if (!b) return;
        e.preventDefault();
        e.stopPropagation();
        A.reviewRating = clamp(+b.getAttribute("data-star") | 0, 1, 5);
        paintStars();
      });
    }
    const text = $("reviewText");
    if (text) {
      text.addEventListener("input", function () {
        const c = $("reviewCount");
        if (c) c.textContent = String(text.value.length) + " / 2000";
      });
      text.addEventListener("keydown", function (e) { e.stopPropagation(); });
    }

    const revBtn = $("reviewBtn");
    if (revBtn) revBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      openReview("optional");
    });

    /* Обязательная форма ника: клавиатура игры под ней молчит */
    window.addEventListener("keydown", function (e) {
      /* демка: клавиши обрабатывает js/replay.js, игра и админка молчат */
      if (typeof window !== "undefined" && window.Replay && Replay.active && Replay.active()) {
        e.stopPropagation();
        return;
      }
      if (!modalOpen()) return;
      const t = e.target;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if (e.code === "Escape" && e.target && e.target.id === "nickInput") return;
      if (!typing) e.stopPropagation();
      else e.stopPropagation();
      if (e.code === "Escape") {
        const nick = $("nickModal");
        if (nick && !nick.hidden) return;
        const rev = $("reviewModal");
        if (rev && !rev.hidden) { e.preventDefault(); closeReview(); return; }
      }
    }, true);

    /* Кнопки рекламы/алмазов обновляем раз в секунду */
    setInterval(function () {
      updateFreeUI();
      /* отзыв после 4-й игры: если в момент возврата в меню шла реклама,
         дождёмся её закрытия и покажем форму */
      if (typeof state !== "undefined" && state === "menu") maybeShowForcedReview();
    }, 1000);
  }

  /* ---------- жизненный цикл ---------- */
  function loadQueues() {
    if (!A.enabled) return;
    try {
      if (!A.supaToken) A.supaToken = localStorage.getItem(LS_SUPA_TOKEN) || "";
      if (!A.supaPid) A.supaPid = localStorage.getItem(LS_SUPA_PID) || "";
    } catch (err) {}
    const ev = readJson(LS_EVENTS, []);
    if (Array.isArray(ev)) A.events = ev.filter(x => x && typeof x === "object").slice(-MAX_QUEUED_EVENTS);
    const runs = readJson(LS_RUNS, []);
    if (Array.isArray(runs)) A.runs = runs.filter(x => x && x.id).slice(-MAX_QUEUED_RUNS);
    const rev = readJson(LS_REVIEW_Q, []);
    if (Array.isArray(rev)) A.reviews = rev.filter(x => x && x.rating).slice(-5);
  }

  function tick() {
    flush(false);
    flushRuns();
    flushReviews();
  }

  function boot() {
    /* iframe админки для показа демки: ни аналитики, ни ника, ни отправок */
    if (REPLAY_HOST) return;

    A.device = deviceInfo();
    loadQueues();
    bindUi();
    updateFreeUI();
    if (A.enabled) {
      ensureSupaPlayer().then(function () {
        flush(false);
        flushRuns();
        flushReviews();
      });
      setInterval(tick, SYNC_MS);
      document.addEventListener("visibilitychange", function () {
        if (document.hidden) {
          flush(true);
          saveRunQueue();
        } else {
          A.lastPlayAt = performance.now();
          flush(false);
          flushRuns();
        }
      });
      window.addEventListener("pagehide", function () { flush(true); });
      window.addEventListener("beforeunload", function () { flush(true); });
    }
    /* Ник спрашиваем после загрузки игры, но не позже 8 секунд */
    const waitStart = Date.now();
    const timer = setInterval(function () {
      if (window.gameBooted || Date.now() - waitStart > 8000) {
        clearInterval(timer);
        showNickIfNeeded();
        maybeShowForcedReview();
      }
    }, 250);
    scheduleFlush();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  /* ---------- публичный API для игры ---------- */
  window.Analytics = {
    blockInput: blockInput,
    onMenu: onMenu,
    frame: function () { safe(frame); },
    fpsSample: function (inst, dt) { safe(function () { fpsSample(inst, dt); }); },
    runStart: function () { safe(runStart); },
    levelStart: function (level) { safe(function () { levelStart(level); }); },
    press: function () { safe(press); },
    launch: function (now, skin) { safe(function () { launch(now, skin); }); },
    result: function (res, rel, extra) { safe(function () { setResult(res, rel, extra); }); },
    apple: function (kind, gain, rel, rr) { safe(function () { apple(kind, gain, rel, rr); }); },
    lifeLoss: function () { safe(lifeLoss); },
    revive: function () { safe(revive); },
    fail: function (death, extra) { safe(function () { failEvent(death, extra); }); },
    runEnd: function (result) { safe(function () { finishRun(result); }); },
    purchase: function (p) {
      if (typeof window !== "undefined" && window.__BH_REPLAY_ACTIVE) return;
      safe(function () { purchase(p); });
    },
    ad: function (mode, purpose, extra) {
      if (typeof window !== "undefined" && window.__BH_REPLAY_ACTIVE) return;
      safe(function () { ad(mode, purpose, extra); });
    },
    bannerClick: function (id, name) {
      if (typeof window !== "undefined" && window.__BH_REPLAY_ACTIVE) return;
      safe(function () { bannerClick(id, name); });
    },
    knifeApply: function (id, name) {
      if (typeof window !== "undefined" && window.__BH_REPLAY_ACTIVE) return;
      safe(function () { knifeApply(id, name); });
    },
    claimFreeApples: function () { safe(claimFreeApples); },
    updateFreeUI: function () { safe(updateFreeUI); },
    openReview: function () { safe(function () { openReview("optional"); }); },
    isAdmin: function () { return false; },
    getDevice: function () { return A.device; },
    flush: function () { safe(function () { flush(false); }); },
    reviewRequired: function () { return !reviewDone() && safe(function () { return (stats.runs | 0) >= 4; }, false); }
  };
})();
