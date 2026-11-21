/* ============================================================
   БРЕВНО HIT — ДЕМКА НА НАСТОЯЩЕМ ДВИЖКЕ
   ------------------------------------------------------------
   Новая запись (js/analytics.js) хранит не «скриншоты» игры 20 раз в секунду,
   а сцены уровней и таймлайн действий:

     • уровень — номер, босс, запас, тема;
     • spin — «сид» бревна: паттерн, направление, скорость, фаза, скрипты
       ходов, куски скорлупы, шапка чучела и т.п.;
     • knives / apples — что уже стояло на кромке к началу уровня;
     • броски — момент нажатия, момент вылета, угол бревна, скин, результат,
       куда нож сел, сколько HP осталось и какие яблоки он снял.

   Демка восстанавливает сцену уровня и запускает настоящий движок. Бревно
   крутится своим кодом, боссы и яблоки — те же, ножи втыкаются в записанные
   углы. Никаких покадровых подстановок угла/HP.

   Всё, что делает демка, изолировано от профиля админа:
   • статистика и рекорд не пишутся (страж __BH_REPLAY_ACTIVE);
   • кошелёк, скин ножа и рекорд восстанавливаются после просмотра;
   • админ-панель прячется на время показа.
   ============================================================ */
(function () {
  "use strict";
  if (window.Replay) return;

  const $ = id => document.getElementById(id);
  const REPLAY_MS_PAD = 500;

  const S = {
    active: false,
    run: null,
    levels: [],
    li: 0,
    expectedIndex: -1,
    byLevel: [],
    throwList: [],
    ti: 0,
    appleByLevel: [],
    appleList: [],
    ai: 0,
    reviveByLevel: [],
    reviveList: [],
    legacy: false,
    cur: 0,
    levelT: 0,
    shift: 0,
    end: 1,
    speed: 1,
    playing: true,
    initializing: false,
    backup: null,
    onStop: null,
    hud: null,
    lastHudAt: 0,
    deathSeen: false,
    reviveRec: null,
    reviveAt: 0,
    stopAt: 0,
    stopRequested: false,
    noMore: false,
    jumpRec: null,
    jumping: false,
    bossJump: null,
    angleTrack: null
  };

  function active() { return S.active; }
  function num(v, d) { const n = Math.floor(+v); return Number.isFinite(n) ? n : (d || 0); }
  function fnum(v, d) { const n = +v; return Number.isFinite(n) ? n : (d || 0); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function angDiff(a, b) {
    let d = (a || 0) - (b || 0);
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return Math.abs(d);
  }
  function fmtClock(ms) {
    const s = Math.max(0, Math.round((+ms || 0) / 1000));
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m + ":" + (sec < 10 ? "0" + sec : sec);
  }
  function esc(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function clone(v) {
    if (Array.isArray(v)) {
      const out = new Array(v.length);
      for (let i = 0; i < v.length; i++) out[i] = clone(v[i]);
      return out;
    }
    if (v && typeof v === "object") {
      const out = {};
      for (const k in v) if (Object.prototype.hasOwnProperty.call(v, k)) out[k] = clone(v[k]);
      return out;
    }
    return v;
  }
  function cloneSave() {
    try { return JSON.parse(JSON.stringify(save)); } catch (err) {}
    const out = {};
    try {
      for (const k in save) if (Object.prototype.hasOwnProperty.call(save, k)) out[k] = save[k];
    } catch (err) {}
    return out;
  }

  function bossById(id) {
    try {
      if (typeof BOSSES !== "undefined" && id) return BOSSES.find(b => b.id === id) || null;
    } catch (err) {}
    return null;
  }

  /* ---------- модель записи ---------- */

  function buildNewLevels(run) {
    const out = [];
    const src = Array.isArray(run.levels) ? run.levels : [];
    for (const raw of src) {
      if (!raw || typeof raw !== "object") continue;
      const rec = {
        idx: out.length,
        t: Math.max(0, num(raw.t, 0)),
        level: Math.max(1, num(raw.level, 1)),
        bossId: String(raw.bossId || raw.boss || ""),
        bossName: String(raw.bossName || ""),
        bossTier: String(raw.bossTier || raw.tier || ""),
        theme: raw.theme == null ? null : num(raw.theme, 0),
        maxHp: raw.maxHp == null ? null : Math.max(1, num(raw.maxHp, 1)),
        hp: raw.hp == null ? null : Math.max(0, num(raw.hp, 0)),
        lives: raw.lives == null ? null : Math.max(0, num(raw.lives, 0)),
        maxLives: raw.maxLives == null ? null : Math.max(3, num(raw.maxLives, 3)),
        score: raw.score == null ? null : Math.max(0, num(raw.score, 0)),
        buffSlow: !!raw.buffSlow,
        buffDouble: !!raw.buffDouble,
        buffShield: !!raw.buffShield,
        introIncluded: !!raw.introIncluded,
        angles: Array.isArray(raw.angles) ? raw.angles : null,
        sting: raw.sting == null ? null : Math.max(0, fnum(raw.sting, 0)),
        stingFreeze: raw.stingFreeze == null ? null : Math.max(0, fnum(raw.stingFreeze, 0)),
        intro: raw.intro == null ? null : Math.max(0, fnum(raw.intro, 0)),
        introCaptured: !!raw.introCaptured,
        angle: raw.angle == null ? 0 : fnum(raw.angle, 0),
        spin: raw.spin && typeof raw.spin === "object" ? raw.spin : null,
        knives: Array.isArray(raw.knives) ? raw.knives : null,
        apples: Array.isArray(raw.apples) ? raw.apples : null,
        seed: raw.seed == null ? null : num(raw.seed, 0)
      };
      out.push(rec);
    }
    out.sort((a, b) => a.t - b.t);
    for (let i = 0; i < out.length; i++) out[i].idx = i;
    return out;
  }

  function legacyLevel(e, run) {
    return {
      idx: 0,
      t: Math.max(0, num(e.t, 0)),
      level: Math.max(1, num(e.level, run.level || 1)),
      bossId: String(e.boss || (run.boss && run.boss.id) || ""),
      bossName: String(e.bossName || (run.boss && run.boss.name) || ""),
      bossTier: String((run.boss && run.boss.tier) || ""),
      theme: e.theme == null ? null : num(e.theme, 0),
      maxHp: e.maxHp == null ? null : Math.max(1, num(e.maxHp, 1)),
      hp: e.hp == null ? null : Math.max(0, num(e.hp, 0)),
      lives: e.lives == null ? null : Math.max(0, num(e.lives, 0)),
      maxLives: null,
      score: null,
      angle: e.ang == null ? 0 : fnum(e.ang, 0),
      spin: null,
      knives: Array.isArray(e.knives) ? e.knives : null,
      apples: Array.isArray(e.apples) ? e.apples : null,
      seed: null
    };
  }

  function buildLegacyLevels(run) {
    const events = (run.events || []).slice().sort((a, b) => a.t - b.t);
    const out = [];
    const start = events.find(e => e && e.type === "start");
    if (start) out.push(legacyLevel(start, run));
    for (const e of events) {
      if (!e || e.type !== "level") continue;
      const lv = legacyLevel(e, run);
      const last = out[out.length - 1];
      if (last && last.level === lv.level && Math.abs(last.t - lv.t) < 5) continue;
      out.push(lv);
    }
    if (!out.length) {
      out.push({
        idx: 0, t: 0, level: Math.max(1, num(run.level, 1)),
        bossId: String((run.boss && run.boss.id) || ""),
        bossName: String((run.boss && run.boss.name) || ""),
        bossTier: String((run.boss && run.boss.tier) || ""),
        theme: null, maxHp: null, hp: null, lives: null, maxLives: null,
        score: null, angle: 0, spin: null, knives: null, apples: null, seed: null
      });
    }
    out.sort((a, b) => a.t - b.t);
    for (let i = 0; i < out.length; i++) {
      out[i].idx = i;
      /* у старых записей levelStart звался уже после начала заставки/intro */
      out[i].introIncluded = i > 0;
    }
    out[0].t = 0;
    /* Старые демки хранят кадры [t, angle, hp]. Из них можно собрать дорожку
       угла для этого уровня — так и старые записи перестанут «отставать». */
    const frames = (run.frames || []).slice().sort((a, b) => a[0] - b[0]);
    for (let i = 0; i < out.length; i++) {
      const from = out[i].t;
      const to = i + 1 < out.length ? out[i + 1].t : Infinity;
      const arr = [];
      for (const f of frames) {
        if (!Array.isArray(f) || f.length < 2) continue;
        if (f[0] < from - 1 || f[0] >= to) continue;
        const tL = Math.max(0, Math.round(f[0] - from));
        if (arr.length && tL <= arr[arr.length - 1][0]) continue;
        arr.push([tL, +(+f[1] || 0).toFixed(4)]);
        if (arr.length >= 4000) break;
      }
      if (arr.length < 2 && out[i].angle != null) {
        arr.length = 0;
        arr.push([0, +(+out[i].angle || 0).toFixed(4)]);
      }
      out[i].angles = arr.length >= 2 ? arr : null;
    }
    return out;
  }

  function buildLevels(run) {
    const fresh = buildNewLevels(run);
    if (fresh.length) return { levels: fresh, legacy: false };
    return { levels: buildLegacyLevels(run), legacy: true };
  }

  /* Какой уровень был на экране в момент t (для старых записей без lvl). */
  function levelIndexAt(levels, t, level) {
    let best = 0;
    let byTime = 0;
    for (let i = 0; i < levels.length; i++) {
      const l = levels[i];
      if (l.t <= t + 2) byTime = i;
      if (level != null && l.level === level && l.t <= t + 2) best = i;
    }
    if (level != null && levels[best] && levels[best].level === level) return best;
    return byTime;
  }

  function buildTimeline(run, levels, legacy) {
    const byLevel = levels.map(() => []);
    const all = (run.throws || []).slice().sort((a, b) => num(a.t, 0) - num(b.t, 0));
    for (const raw of all) {
      if (!raw || typeof raw !== "object") continue;
      let idx = raw.lvl != null ? raw.lvl | 0 : -1;
      if (!(idx >= 0 && idx < levels.length)) idx = levelIndexAt(levels, num(raw.t, 0), raw.level);
      const base = levels[idx] ? levels[idx].t : 0;
      const rec = Object.assign({}, raw);
      rec.lvl = idx;
      rec.tL = rec.tL != null ? Math.max(0, num(rec.tL, 0)) : Math.max(0, num(raw.t, 0) - base);
      rec.ptL = rec.ptL != null && rec.ptL >= 0 ? num(rec.ptL, rec.tL) : null;
      rec.apples = Array.isArray(rec.apples) ? rec.apples : [];
      byLevel[idx].push(rec);
    }
    for (const list of byLevel) {
      list.sort((a, b) => (a.ptL != null ? a.ptL : a.tL) - (b.ptL != null ? b.ptL : b.tL));
    }
    return byLevel;
  }

  function buildEvents(run, levels) {
    const reviveByLevel = levels.map(() => []);
    const appleByLevel = levels.map(() => []);
    const events = (run.events || []).slice();
    for (const e of events) {
      if (!e || (e.type !== "revive" && e.type !== "apple")) continue;
      let idx = e.lvl != null ? e.lvl | 0 : -1;
      if (!(idx >= 0 && idx < levels.length)) idx = levelIndexAt(levels, num(e.t, 0), e.level);
      const base = levels[idx] ? levels[idx].t : 0;
      const rec = Object.assign({}, e);
      rec.lvl = idx;
      rec.tL = e.tL != null ? Math.max(0, num(e.tL, 0)) : Math.max(0, num(e.t, 0) - base);
      (e.type === "revive" ? reviveByLevel : appleByLevel)[idx].push(rec);
    }
    for (const list of reviveByLevel) list.sort((a, b) => a.tL - b.tL);
    for (const list of appleByLevel) list.sort((a, b) => a.tL - b.tL);
    return { reviveByLevel, appleByLevel };
  }

  function throwAt(rec) {
    if (!rec) return 0;
    return rec.ptL != null ? rec.ptL : rec.tL;
  }

  /* ---------- восстановление сцены ---------- */

  function applySpin(spin) {
    if (!spin) return;
    const log = game.log;
    for (const k in spin) {
      if (!Object.prototype.hasOwnProperty.call(spin, k)) continue;
      if (k === "x" || k === "y" || k === "r" || k === "scale" || k === "boss") continue;
      const v = spin[k];
      if (v == null) continue;
      log[k] = clone(v);
    }
  }

  /* Угол из записанной дорожки [tL, angle]. Между точками — линейно. */
  function angleAt(list, t) {
    if (!list || !list.length) return null;
    if (t <= list[0][0]) return list[0][1];
    const last = list[list.length - 1];
    if (t >= last[0]) return last[1];
    let lo = 0;
    let hi = list.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (list[mid][0] <= t) lo = mid; else hi = mid;
    }
    const a = list[lo];
    const b = list[hi];
    const span = Math.max(1, b[0] - a[0]);
    const k = clamp((t - a[0]) / span, 0, 1);
    return a[1] + (b[1] - a[1]) * k;
  }

  /* Сдвигаем опорные углы паттерна вместе с углом: иначе следующий шаг
     «хода из точки from» вернул бы бревно назад. */
  const ANGLE_ANCHORS = ["from", "holdFrom", "revFrom", "eggFrom", "camFrom", "camHome", "camTo"];
  function shiftAngleAnchors(d) {
    if (!d || Math.abs(d) < 1e-7) return;
    const log = game.log;
    for (const k of ANGLE_ANCHORS) {
      if (typeof log[k] === "number") log[k] += d;
    }
    if (Array.isArray(log.camPeaks)) {
      for (let i = 0; i < log.camPeaks.length; i++) {
        if (typeof log.camPeaks[i] === "number") log.camPeaks[i] += d;
      }
    }
  }

  /* Плавная сверка с записанной дорожкой угла. Разница за кадр — доли градуса,
     поэтому никаких рывков: просто бревно не уезжает из-за разницы частоты
     кадров. */
  function syncAngleAt(t) {
    if (!S.angleTrack || S.angleTrack.length < 2) return;
    const target = angleAt(S.angleTrack, t);
    if (target == null || !isFinite(target)) return;
    let d = target - fnum(game.log.angle, 0);
    if (!isFinite(d)) return;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    if (Math.abs(d) < 1e-5) return;
    game.log.angle += d;
    shiftAngleAnchors(d);
    try { syncLogTurn(); } catch (err) {}
  }

  function applyKnives(list) {
    if (!Array.isArray(list)) return;
    try { clearStuck(); } catch (err) { game.stuck.length = 0; }
    for (const raw of list) {
      if (!raw || typeof raw !== "object") continue;
      const sk = takeStuck();
      sk.rel = fnum(raw.rel, 0);
      sk.skin = String(raw.skin || "classic");
      sk.player = raw.player == null ? true : !!raw.player;
      const rad = fnum(raw.rad, 1);
      sk.rad = rad > 0 ? rad : 1;
      const scale = fnum(raw.scale, 1);
      sk.scale = scale > 0 ? scale : 1;
      sk.sink = 0;
      sk.sinkV = 0;
      sk.flash = 0;
      sk.kick = 0;
      /* пул мог вернуть нож со старой картинкой скина — сбрасываем кэш */
      sk._dispImg = null;
      sk._dispSkin = "";
      game.stuck.push(sk);
    }
  }

  function applyApples(list) {
    if (!Array.isArray(list)) return;
    try { clearLogApples(); } catch (err) {}
    for (const raw of list) {
      if (!raw || typeof raw !== "object") continue;
      game.logApples.push({
        rel: fnum(raw.rel, 0),
        rr: fnum(raw.rr, 0),
        kind: String(raw.kind || "plain"),
        taken: false
      });
    }
  }

  function legacyScoreAt(levels, idx) {
    let n = 0;
    for (let i = 0; i <= idx && i < levels.length; i++) {
      const list = S.byLevel[i] || [];
      for (const th of list) if (th.res === "stick") n++;
    }
    return n;
  }

  function legacyLivesAt(t) {
    const events = (S.run && S.run.events) || [];
    let lives = 3;
    const start = events.find(e => e && e.type === "start" && e.lives != null);
    if (start) lives = num(start.lives, 3);
    for (const e of events) {
      if (!e || num(e.t, 0) > t + 2) continue;
      if ((e.type === "life" || e.type === "revive") && e.lives != null) {
        lives = num(e.lives, lives);
      }
    }
    return lives;
  }

  function enterLevel(rec) {
    if (!rec) return;
    S.levelT = 0;
    S.shift = 0;
    /* Заставки боссов и наплыв бревна в демке не показываем: нужно непрерывное
       «как играет игрок». Время заставки вычитаем из таймлайна уровня, иначе
       первый бросок ждал бы впустую. */
    const actualSting = Math.max(0, game.sting || 0);
    const actualIntro = Math.max(0, game.intro || 0);
    /* В заставке босса бревно стоит на месте до момента pop. Только это
       «мёртвое» время вырезаем из таймлайна. Наплыв бревна не вырезаем:
       в записи бревно в это время уже крутится, и если убрать время, демка
       начинала отставать — нож садился не по центру, а сбоку. */
    const freezeSec = rec.stingFreeze != null
      ? rec.stingFreeze
      : (actualSting > 0 && typeof stingPopAt === "function"
        ? Math.max(0, +stingPopAt() || 0)
        : actualSting);
    const skippedMs = Math.max(0, freezeSec * 1000);
    if (actualSting > 0 || actualIntro > 0 || skippedMs > 0) {
      try { clearBossSting(); } catch (err) {}
      game.sting = 0;
      game.stingT = 0;
      game.intro = 0;
      game.log.scale = 1;
    }
    if (skippedMs > 0) {
      S.shift = -skippedMs;
      S.end = Math.max(1, S.end - skippedMs);
    }
    S.deathSeen = false;
    S.reviveRec = null;
    S.reviveAt = 0;
    S.stopAt = 0;
    S.ti = 0;
    S.ai = 0;
    S.throwList = S.byLevel[rec.idx] || [];
    S.appleList = S.appleByLevel[rec.idx] || [];
    S.reviveList = S.reviveByLevel[rec.idx] || [];
    S.angleTrack = Array.isArray(rec.angles) && rec.angles.length >= 2 ? rec.angles : null;

    game.buffs.slow = !!rec.buffSlow;
    game.buffs.double = !!rec.buffDouble;
    game.buffs.shield = !!rec.buffShield;
    try { if (typeof renderHudBuffs === "function") renderHudBuffs(); } catch (err) {}

    const boss = rec.bossId ? bossById(rec.bossId) : null;
    game.log.boss = boss;
    primeBossPick(rec);
    if (rec.theme != null) {
      game.theme = rec.theme;
    } else {
      try { game.theme = themeIndexFor(rec.level); } catch (err) {}
    }

    try { clearFlying(); } catch (err) { game.flying.length = 0; }
    game.knife.ready = true;
    game.knife.flying = false;
    game.handT = 1;
    lastThrowAt = 0;
    game.fail = null;
    game.drop = null;
    game.clash = null;
    game.pop = null;
    game.hitStop = 0;

    game.log.maxHp = Math.max(1, rec.maxHp != null ? rec.maxHp : (game.log.maxHp | 0) || 8);
    let hp = rec.hp != null ? rec.hp : game.log.maxHp;
    hp = clamp(hp, 0, game.log.maxHp);
    game.log.hp = hp;
    game.log.dmg = Math.max(0, game.log.maxHp - hp);
    game.log.hpTrail = hp / game.log.maxHp;
    game.log.hpTrailHold = 0;
    game.log.hpNip = 0;
    game.log.scale = 1;
    game.log.pulse = 0;
    game.log.pulseV = 0;
    game.log.hitFlash = 0;
    game.log.hitFlashT = 0;
    game.log.kick = 0;
    try { resetHpTrail(); } catch (err) {}

    /* Сцена уровня: сначала состояние вращения, потом точный стартовый угол. */
    applySpin(rec.spin);
    game.log.angle = fnum(rec.angle, 0);
    try { syncLogTurn(); } catch (err) {}

    applyKnives(rec.knives);
    applyApples(rec.apples);

    game.recordNum = rec.score != null ? rec.score : (S.legacy ? legacyScoreAt(S.levels, rec.idx) : 0);
    game.bestBase = 0;
    game.bestKnown = false;
    game.bestBeaten = false;

    const maxLives = Math.max(3, rec.maxLives != null ? rec.maxLives : ((game.maxLives | 0) || 3));
    game.maxLives = maxLives;
    const startLives = rec.lives != null ? rec.lives : (S.legacy ? legacyLivesAt(rec.t) : game.lives);
    game.lives = clamp(startLives, 0, maxLives);
    try { renderLives(); } catch (err) {}
    try { syncHud(); } catch (err) {}
  }

  function expectedLevel() {
    if (!S.active) return null;
    if (S.bossJump) return S.bossJump;
    if (S.initializing) return S.levels[0] || null;
    return S.expectedIndex >= 0 ? (S.levels[S.expectedIndex] || null) : null;
  }

  /* Подставляем записанного босса ДО того, как startLevel вызовет bossFor().
     Иначе bossFor выберет случайного босса из мешка админа, потратит его и
     запишет статистику — а нам нужен ровно тот босс из демки. */
  function primeBossPick(rec) {
    if (!rec) return;
    try {
      bossPick.level = rec.level;
      bossPick.boss = rec.bossId ? bossById(rec.bossId) : null;
    } catch (err) {}
  }

  /* ---------- API для движка ---------- */

  function beforeLevel(level) {
    if (!S.active || S.initializing || S.jumping) return;
    let idx = S.li + 1;
    if (!S.levels[idx] || S.levels[idx].level !== level) {
      idx = -1;
      for (let i = S.li + 1; i < S.levels.length; i++) {
        if (S.levels[i].level === level) { idx = i; break; }
      }
    }
    S.expectedIndex = idx;
    S.noMore = idx < 0;
    if (S.noMore) {
      /* Номера уровней не совпали (продолжение забега, старая запись).
         Вместо обрыва дёргаем демку сразу на следующий записанный уровень. */
      const next = S.levels[S.li + 1] || null;
      if (next) {
        S.jumpRec = next;
        S.stopRequested = false;
        primeBossPick({ level: level, bossId: "" });
      } else {
        S.stopRequested = true;
        /* Запись кончилась. Не даём bossFor() вытянуть случайного босса из
           мешка админа — следующий уровень нам уже не нужен. */
        primeBossPick({ level: level, bossId: "" });
      }
    } else {
      primeBossPick(S.levels[idx]);
    }
  }

  function applyBoss(level) {
    if (!S.active) return;
    const rec = expectedLevel();
    if (!rec) return;
    game.level = rec.level;
    const boss = rec.bossId ? bossById(rec.bossId) : null;
    game.log.boss = boss;
    primeBossPick(rec);
    if (rec.theme != null) {
      game.theme = rec.theme;
    } else {
      try { game.theme = themeIndexFor(rec.level); } catch (err) {}
    }
  }

  function afterLevel(level) {
    if (!S.active || S.initializing || S.jumping) return;
    if (S.jumpRec) return;   /* переход выполнит step() сразу после update */
    if (S.noMore || S.expectedIndex < 0) {
      S.stopRequested = true;
      return;
    }
    S.li = S.expectedIndex;
    S.expectedIndex = -1;
    enterLevel(S.levels[S.li]);
  }

  /* ---------- запуск броска ---------- */

  function launchRec(rec) {
    if (!rec) return false;
    if (state !== "play" || !game.knife.ready || game.flying.length || game.hitStop > 0) return false;
    /* Как и живой бросок: пока бревно наплывает, нажатие ждёт, а не летит
       в невыросшее бревно. Запись хранит момент нажатия, поэтому здесь
       достаточно повторить это же правило. */
    if ((game.intro || 0) > 0.08) return false;
    save.knife = rec.skin || "classic";
    game.knife.ready = true;
    game.handT = 1;
    try { launchKnife(performance.now()); } catch (err) { return false; }
    const k = game.flying[game.flying.length - 1];
    if (!k) return false;
    k.skin = rec.skin || "classic";
    k.dmg = Math.max(1, num(rec.dmg, 1));
    k.__rec = rec;
    return true;
  }

  function processThrows() {
    let guard = 0;
    while (S.ti < S.throwList.length && guard++ < 8) {
      const rec = S.throwList[S.ti];
      const at = throwAt(rec);
      const eff = S.levelT - S.shift;
      if (at > eff + 0.5) break;
      if (!launchRec(rec)) break;
      S.ti++;
    }
  }

  function nextRevive() {
    const eff = S.levelT - S.shift;
    const list = S.reviveList || [];
    for (const e of list) {
      if ((e.tL || 0) >= eff - 120) return e;
    }
    return null;
  }

  function processRevive() {
    if (state === "fail" && !S.deathSeen) {
      S.deathSeen = true;
      const rev = nextRevive();
      if (rev) {
        S.reviveRec = rev;
        /* Реклама в демке не показывается: сцену смерти показываем ~0.9 с,
           затем возвращаемся в бой. Остальной таймлайн сдвигаем на записанный
           момент возрождения, чтобы следующие броски шли по записи. */
        S.reviveAt = S.levelT + 900;
      } else {
        S.stopAt = S.levelT + 2600;
      }
    }
    if (S.reviveRec && state === "fail" && S.levelT >= S.reviveAt) {
      const rec = S.reviveRec;
      S.reviveRec = null;
      if (rec) S.reviveList = (S.reviveList || []).filter(e => e !== rec);
      try { reviveAfterAd(); } catch (err) { return; }
      if (rec && rec.lives != null) {
        game.lives = clamp(num(rec.lives), 0, Math.max(3, game.maxLives || 3));
      }
      try { renderLives(); } catch (err) {}
      const oldEff = S.levelT - S.shift;
      const target = rec && rec.tL != null ? rec.tL : oldEff;
      const compressed = Math.max(0, target - oldEff);
      S.shift = S.levelT - target;
      /* Реклама в демке не показывается: её время вычли из общего хронометража,
         иначе после последнего броска демка молча стояла бы десяток секунд. */
      if (compressed > 0) S.end = Math.max(S.levelT, S.end - compressed);
      while (S.ti < S.throwList.length && throwAt(S.throwList[S.ti]) < target - 40) S.ti++;
      while (S.ai < S.appleList.length && (S.appleList[S.ai].tL || 0) < target - 40) S.ai++;
      S.deathSeen = false;
      S.stopAt = 0;
    }
  }

  /* ---------- яблоки ---------- */

  function triggerApple(ev) {
    if (!ev || state !== "play") return;
    const list = game.logApples || [];
    let best = null;
    let bestD = 1e9;
    for (const a of list) {
      if (a.taken) continue;
      if (ev.kind && a.kind && a.kind !== ev.kind) continue;
      const d = ev.rel == null ? 0 : angDiff(a.rel, ev.rel);
      if (d < bestD) { bestD = d; best = a; }
    }
    if (!best) return;
    if (ev.rel != null && bestD > 0.4) return;
    try {
      takeLogApple(best, game.log.x, game.log.y + hitSurfR(), false);
    } catch (err) {}
  }

  function takeRecordedApples(rec) {
    const list = game.logApples || [];
    const events = Array.isArray(rec.apples) ? rec.apples : [];
    if (!events.length || !list.length) return;
    for (let i = 0; i < events.length; i++) {
      const ev = events[i];
      const target = ev.rel != null ? fnum(ev.rel, rec.rel || 0) : fnum(rec.rel, 0);
      let best = null;
      let bestD = 1e9;
      for (const a of list) {
        if (a.taken) continue;
        const d = angDiff(a.rel, target);
        const kindPenalty = ev.kind && a.kind && a.kind !== ev.kind ? 0.08 : 0;
        const score = d + kindPenalty;
        if (score < bestD) { bestD = score; best = a; }
      }
      if (!best || bestD > 0.45) continue;
      try {
        takeLogApple(best, game.log.x, game.log.y + hitSurfR(), i < events.length - 1);
      } catch (err) {}
    }
  }

  function processLegacyApples() {
    if (!S.legacy) return;
    const eff = S.levelT - S.shift;
    let guard = 0;
    while (S.ai < S.appleList.length && guard++ < 8) {
      const ev = S.appleList[S.ai];
      if ((ev.tL || 0) > eff) break;
      triggerApple(ev);
      S.ai++;
    }
  }

  /* ---------- результат броска ---------- */

  function removeFlying(k) {
    const i = game.flying.indexOf(k);
    if (i >= 0) game.flying.splice(i, 1);
  }

  function replayStick(k, rec, maxHp) {
    const dmg = Math.max(1, num(rec.dmg, 1));
    const after = rec.hpAfter != null
      ? clamp(num(rec.hpAfter), 0, maxHp)
      : Math.max(0, (game.log.hp | 0) - dmg);
    k.dmg = dmg;
    k.skin = rec.skin || k.skin || "classic";
    k.y = landY();
    /* Настоящий stickKnife снимает своё dmg; ставим HP так, чтобы после него
       получилось ровно записанное число. */
    game.log.hp = Math.min(maxHp, after + dmg);
    try { stickKnife(k); } catch (err) { console.error("[replay] stickKnife", err); }
    game.log.hp = clamp(after, 0, maxHp);
    game.log.dmg = Math.max(0, (game.log.maxHp | 0) - game.log.hp);
    game.log.hpTrail = Math.max(0, game.log.hp / maxHp);
    game.log.hpTrailHold = 0.2;
    const sk = game.stuck[game.stuck.length - 1];
    if (sk) {
      if (rec.rel != null) sk.rel = fnum(rec.rel, sk.rel);
      sk.skin = rec.skin || "classic";
      sk.player = true;
      sk.sink = 14;
      sk.sinkV = -80;
      sk.flash = 0.2;
    }
    if (after <= 0 && state === "play") {
      try { shatterLog(); } catch (err) {}
    }
  }

  function replayBlocked(k, rec) {
    const res = String(rec.res || "");
    const maxLives = Math.max(1, game.maxLives || 3);
    const hadAfter = rec.livesAfter != null;
    const after = hadAfter ? clamp(num(rec.livesAfter), 0, maxLives) : (game.lives | 0);
    const safe = !!(rec.shield || rec.inf);

    /* Щит предмета / бесконечные жизни: жизнь не снимается, только отскок. */
    if (safe) {
      game.buffs.shield = false;
      try { if (typeof renderHudBuffs === "function") renderHudBuffs(); } catch (err) {}
      k.y = landY();
      try { bounceOffHandle(k); } catch (err) {}
      if (hadAfter) game.lives = clamp(after, 0, maxLives);
      try { renderLives(); } catch (err) {}
      return false;
    }

    if (res === "hat") {
      k.y = game.log.y + hitSurfR() - knifeH * (16 / KNIFE_SRC_H);
      try { dummyHatHit(k); } catch (err) { try { bounceOffHandle(k); } catch (e) {} }
      if (hadAfter) game.lives = clamp(after, 0, maxLives);
      try { renderLives(); } catch (err) {}
      return state !== "play";
    }

    if (res === "shell") {
      let plate = null;
      const plates = game.log.plates || [];
      if (rec.plateAng != null) {
        let best = 1e9;
        for (const p of plates) {
          const d = angDiff(p.ang, fnum(rec.plateAng, 0));
          if (d < best) { best = d; plate = p; }
        }
      }
      if (!plate && rec.rel != null && typeof coconutPlateAt === "function") {
        try { plate = coconutPlateAt(fnum(rec.rel, 0)); } catch (err) {}
      }
      k.y = game.log.y + hitSurfR() - knifeH * (16 / KNIFE_SRC_H);
      if (plate && typeof coconutShellHit === "function") {
        try { coconutShellHit(k, plate); } catch (err) { try { bounceOffHandle(k); } catch (e) {} }
      } else {
        try { bounceOffHandle(k); } catch (err) {}
      }
      if (hadAfter) game.lives = clamp(after, 0, maxLives);
      try { renderLives(); } catch (err) {}
      return state !== "play";
    }

    /* handle / hazard / miss / death: та же потеря жизни, что была в записи. */
    game.lives = clamp((hadAfter ? after : (game.lives | 0)) + 1, 1, maxLives);
    if (res === "hazard" || res === "handle") {
      try { k.y = game.log.y + knifeMetrics(hitSurfR()).outer - 8; } catch (err) { k.y = landY(); }
    } else {
      k.y = landY();
    }
    try { fail(k, rec.line || "", rec.flash || ""); } catch (err) {
      try { bounceOffHandle(k); } catch (e) {}
    }
    if (hadAfter) game.lives = clamp(after, 0, maxLives);
    try { renderLives(); } catch (err) {}
    try { syncHud(); } catch (err) {}
    return state !== "play";
  }

  function resolve(k) {
    if (!k) return false;
    const rec = k.__rec || null;
    removeFlying(k);
    if (!rec) {
      try { bounceOffHandle(k); } catch (err) {}
      try { recycleFly(k); } catch (err) {}
      return false;
    }
    k.__rec = null;
    const maxHp = Math.max(1, game.log.maxHp || 8);
    const res = String(rec.res || "");

    /* Перед ударом сверяем угол с записанной дорожкой ровно на момент удара:
       нож садится по центру, а не сбоку из-за накопленного отставания. */
    syncAngleAt(rec.tRes != null ? rec.tRes : (S.levelT - S.shift));
    takeRecordedApples(rec);

    if (res === "stick") {
      replayStick(k, rec, maxHp);
      try { recycleFly(k); } catch (err) {}
      return state !== "play";
    }

    if (res) {
      const done = replayBlocked(k, rec);
      try { recycleFly(k); } catch (err) {}
      return done;
    }

    /* Старая демка без результата: не бросаем нож в пустоту, просто отскок. */
    try { bounceOffHandle(k); } catch (err) {}
    try { recycleFly(k); } catch (err) {}
    return false;
  }

  function onDeath() {
    S.deathSeen = true;
    if (!S.reviveRec) {
      const rev = nextRevive();
      if (!rev && !S.stopAt) S.stopAt = S.levelT + 1800;
    }
  }

  /* ---------- HUD ---------- */

  function buildHud(title) {
    removeHud();
    const el = document.createElement("div");
    el.id = "replayHud";
    el.className = "replay-hud";
    el.innerHTML =
      '<div class="rh-top"><span class="rh-live">ДЕМКА</span><span class="rh-title">' + esc(title) + '</span></div>' +
      '<div class="rh-bar">' +
        '<button class="rh-btn" id="rhBack" type="button" title="Вернуться в админку">←</button>' +
        '<button class="rh-btn rh-play" id="rhPlay" type="button" title="Пауза">❚❚</button>' +
        '<button class="rh-btn" id="rhRestart" type="button" title="Заново">⟲</button>' +
        '<div class="rh-track"><i id="rhFill"></i></div>' +
        '<span class="rh-time" id="rhTime">0:00 / 0:00</span>' +
        '<span class="rh-speed" id="rhSpeed">' +
          '<button type="button" data-speed="0.5">0.5×</button>' +
          '<button type="button" data-speed="1" class="on">1×</button>' +
          '<button type="button" data-speed="2">2×</button>' +
          '<button type="button" data-speed="4">4×</button>' +
        '</span>' +
      '</div>';
    document.body.appendChild(el);
    S.hud = el;
    const back = $("rhBack");
    if (back) back.addEventListener("click", function (e) { e.stopPropagation(); stop(); });
    const play = $("rhPlay");
    if (play) play.addEventListener("click", function (e) {
      e.stopPropagation();
      S.playing = !S.playing;
      play.textContent = S.playing ? "❚❚" : "▶";
    });
    const restart = $("rhRestart");
    if (restart) restart.addEventListener("click", function (e) { e.stopPropagation(); restartReplay(); });
    const speed = $("rhSpeed");
    if (speed) speed.addEventListener("click", function (e) {
      const b = e.target && e.target.closest ? e.target.closest("button[data-speed]") : null;
      if (!b) return;
      e.stopPropagation();
      S.speed = +b.getAttribute("data-speed") || 1;
      for (const x of speed.querySelectorAll("button")) x.classList.toggle("on", x === b);
    });
  }

  function removeHud() {
    const el = $("replayHud");
    if (el) el.remove();
    S.hud = null;
  }

  function updateHud() {
    if (!S.hud) return;
    const fill = $("rhFill");
    if (fill) fill.style.width = clamp(S.cur / Math.max(1, S.end) * 100, 0, 100).toFixed(2) + "%";
    const time = $("rhTime");
    if (time) {
      const txt = fmtClock(S.cur) + " / " + fmtClock(S.end);
      if (time.textContent !== txt) time.textContent = txt;
    }
    const play = $("rhPlay");
    if (play) play.textContent = S.playing ? "❚❚" : "▶";
  }

  /* ---------- запуск ---------- */

  function play(run, opts) {
    opts = opts || {};
    if (!run) return false;
    const built = buildLevels(run);
    if (!built.levels.length) return false;
    if (S.active) stop(true);

    S.run = run;
    S.levels = built.levels;
    S.legacy = built.legacy;
    S.li = 0;
    S.expectedIndex = -1;
    S.cur = 0;
    S.levelT = 0;
    S.shift = 0;
    S.speed = 1;
    S.playing = true;
    S.initializing = false;
    S.noMore = false;
    S.stopRequested = false;
    S.jumpRec = null;
    S.jumping = false;
    S.bossJump = null;
    S.deathSeen = false;
    S.reviveRec = null;
    S.stopAt = 0;
    S.onStop = typeof opts.onStop === "function" ? opts.onStop : null;
    S.byLevel = buildTimeline(run, S.levels, S.legacy);
    S.throwList = [];
    S.ti = 0;
    const evs = buildEvents(run, S.levels);
    S.reviveByLevel = evs.reviveByLevel;
    S.appleByLevel = evs.appleByLevel;
    S.reviveList = [];
    S.appleList = [];
    S.ai = 0;
    S.end = Math.max(1, num(run.durationMs, 0) || (S.levels[S.levels.length - 1].t + 20000));

    S.backup = {
      save: cloneSave(),
      apples: game.apples | 0,
      knife: save.knife,
      infLives: !!save.infLives,
      rnd: !!save.rnd,
      best: save.best | 0,
      state: state
    };

    window.__BH_REPLAY_ACTIVE = true;
    document.body.classList.add("bh-replay");
    try { if (typeof closeSheet === "function") closeSheet(); } catch (err) {}
    try { if (typeof closeKnifeBook === "function") closeKnifeBook(); } catch (err) {}
    try { if (typeof hideDeathWord === "function") hideDeathWord(); } catch (err) {}
    try { if (typeof hideDeathSkip === "function") hideDeathSkip(); } catch (err) {}
    try { if (typeof hideReviveButton === "function") hideReviveButton(); } catch (err) {}
    try {
      if (overlay) {
        overlay.classList.add("hidden");
        overlay.classList.remove("spring-in");
      }
    } catch (err) {}
    const admin = $("adminPanel");
    if (admin) admin.hidden = true;

    game.apples = 0;
    save.infLives = false;
    save.rnd = false;
    save.best = Math.max(save.best | 0, num(run.score, 0));
    const firstThrows = S.byLevel[0] || [];
    save.knife = (firstThrows[0] && firstThrows[0].skin) || run.knife || "classic";
    game.buffs.shield = false;
    game.buffs.slow = false;
    game.buffs.double = false;
    game.bestKnown = false;
    game.bestBeaten = false;
    game.recordNum = 0;
    try { particles.length = 0; } catch (err) {}
    try { trails.length = 0; } catch (err) {}
    try { flyApples.length = 0; } catch (err) {}
    try { clearAppleHalves(); } catch (err) {}
    try { releaseShards(); } catch (err) {}

    S.active = true;
    S.initializing = true;
    const first = S.levels[0];
    primeBossPick(first);
    /* Первый уровень: даём движку собрать сцену, но босса/тему подставляет
       applyBoss ещё до запекания спрайта. */
    try {
      startLevel(first.level, true);
    } catch (err) {
      console.error("[replay] startLevel", err);
      try { stop(); } catch (err2) {}
      return false;
    }
    S.initializing = false;
    S.li = 0;
    S.reviveList = S.reviveByLevel[0] || [];
    S.appleList = S.appleByLevel[0] || [];
    enterLevel(first);
    state = "play";
    if (menuEl) menuEl.classList.add("hidden");
    if (hud) hud.classList.add("on");
    buildHud(opts.title || ((run.boss && run.boss.name) || "ЗАБЕГ"));
    S.lastHudAt = 0;
    updateHud();
    return true;
  }

  function step(dt, ts) {
    if (!S.active) return;
    const d = S.playing ? clamp(dt * S.speed, 0, 0.08) : 0;
    if (S.playing) {
      const dtMs = dt * 1000 * S.speed;
      S.cur += dtMs;
      S.levelT += dtMs;
      if (S.stopAt && S.levelT >= S.stopAt) { stop(); return; }
      processRevive();
      if (S.stopRequested) { stop(); return; }
      processThrows();
      processLegacyApples();
    }

    /* настоящий update: полёт, повороты, частицы, победа, смерть */
    try { update(d, ts - d * 1000, ts); } catch (err) { console.error("[replay] update", err); }
    try { if (typeof pumpShardBakes === "function") pumpShardBakes(); } catch (err) {}
    if (S.jumpRec) jumpToRecordedLevel(S.jumpRec);
    else if (S.playing) syncAngleAt(S.levelT - S.shift);

    if (S.stopRequested) { stop(); return; }
    if (S.playing && S.stopAt && S.levelT >= S.stopAt) { stop(); return; }

    if (state === "play" || state === "fail" || state === "shatter" || state === "victory") {
      /* HUD уровня: движок сам ведёт HP, жизни и счёт. Ничего не подменяем. */
    }
    if (ts - S.lastHudAt > 120) {
      S.lastHudAt = ts;
      try { syncHud(); } catch (err) {}
      try { renderLives(); } catch (err) {}
    }
    updateHud();
    if (S.cur >= S.end + REPLAY_MS_PAD) stop();
  }

  /* Прыжок на записанный уровень без промежуточных «рандомных» брёвен:
     нужен для старых демок и забегов, продолженных с сохранённого уровня. */
  function jumpToRecordedLevel(rec) {
    if (!rec) return;
    S.jumpRec = null;
    S.jumping = true;
    S.bossJump = rec;
    primeBossPick(rec);
    try {
      startLevel(rec.level, false);
    } catch (err) {
      console.error("[replay] jump startLevel", err);
      S.jumping = false;
      S.bossJump = null;
      stop();
      return;
    }
    S.jumping = false;
    S.bossJump = null;
    S.li = rec.idx;
    S.expectedIndex = -1;
    S.noMore = false;
    S.stopRequested = false;
    enterLevel(rec);
    state = "play";
  }

  function restartReplay() {
    const run = S.run;
    const cb = S.onStop;
    if (!run) return;
    stop(true);
    play(run, { onStop: cb });
  }

  function stop(silent) {
    if (!S.active) return;
    const cb = S.onStop;
    S.active = false;
    S.onStop = null;
    removeHud();
    document.body.classList.remove("bh-replay");
    /* Флаг ещё включён: enterMenu не должен записать аналитику/статистику. */
    try { clearFlying(); } catch (err) {}
    try { clearStuck(); } catch (err) {}
    try { clearLogApples(); } catch (err) {}
    try { releaseShards(); } catch (err) {}
    try { clearAppleHalves(); } catch (err) {}
    try { particles.length = 0; } catch (err) {}
    try { trails.length = 0; } catch (err) {}
    try { flyApples.length = 0; } catch (err) {}
    try { enterMenu(); } catch (err) {}
    if (S.backup) {
      for (const k in S.backup.save) {
        if (Object.prototype.hasOwnProperty.call(S.backup.save, k)) save[k] = S.backup.save[k];
      }
      game.apples = S.backup.apples;
      save.knife = S.backup.knife;
      save.infLives = S.backup.infLives;
      save.rnd = S.backup.rnd;
      save.best = S.backup.best;
    }
    try { syncHud(); } catch (err) {}
    window.__BH_REPLAY_ACTIVE = false;
    if (hud) hud.classList.remove("on");
    if (!silent && cb) {
      try { cb(); } catch (err) {}
    } else if (!silent) {
      const admin = $("adminPanel");
      if (admin && typeof Admin !== "undefined" && Admin.isOpen && Admin.isOpen()) admin.hidden = false;
    }
    S.run = null;
    S.levels = [];
    S.byLevel = [];
    S.throwList = [];
    S.reviveByLevel = [];
    S.appleByLevel = [];
    S.jumpRec = null;
    S.jumping = false;
    S.bossJump = null;
    S.angleTrack = null;
  }

  /* Клавиши: пробел — пауза, Esc — назад, R — заново */
  window.addEventListener("keydown", function (e) {
    if (!S.active) return;
    if (e.code === "Space") {
      e.preventDefault();
      e.stopPropagation();
      S.playing = !S.playing;
      updateHud();
      return;
    }
    if (e.code === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      stop();
      return;
    }
    if (e.code === "KeyR") {
      e.preventDefault();
      e.stopPropagation();
      restartReplay();
    }
  }, true);

  window.Replay = {
    play: play,
    stop: function () { stop(); },
    active: active,
    /* новым записям заставка не нужна: её длительность уже записана.
       Если в записи длительности нет (старый формат) — дадим заставке
       запуститься, чтобы было что вычесть из таймлайна. */
    skipSting: function () {
      if (!S.active || S.legacy) return false;
      const rec = expectedLevel() || S.levels[0];
      return !!(rec && rec.sting != null);
    },
    step: function (dt, ts) { try { step(dt, ts); } catch (err) { console.error("[replay] step", err); } },
    beforeLevel: beforeLevel,
    applyBoss: applyBoss,
    afterLevel: afterLevel,
    resolve: function (k) { try { return resolve(k); } catch (err) { console.error("[replay] resolve", err); return false; } },
    onDeath: onDeath
  };
})();
