let uiDipShown = 0;
function applyUiDip() {
  const dip = game.uiDip || 0;
  const next = Math.abs(dip) < 0.2 ? 0 : dip;
  if (next === uiDipShown) return;
  uiDipShown = next;
  const t = next ? "translate3d(0," + next.toFixed(1) + "px,0)" : "";
  if (hud) hud.style.transform = t;
  if (fpsChip) fpsChip.style.transform = t;
  if (muteBtn) muteBtn.style.transform = t;
}

/* Зажимаем рисование летящего ножа всем полотном, КРОМЕ диска бревна: нож
   виден снаружи (он ближе к игроку), но не ложится поверх лица босса, если
   последний кадр полёта приходится на уже воткнутое положение.
   Радиус — тот же, что у диска в drawLog; пара пикселей запаса, чтобы кромка
   не срезала рукоять, стоящую вплотную. */
function clipFlyingOutsideLog() {
  const log = game.log;
  const r = Math.max(1, log.r * (log.scale || 1) + 2);
  const big = Math.max(W, H) * 2 + r * 2;
  const p = new Path2D();
  p.rect(-big, -big, big * 2, big * 2);
  p.moveTo(log.x + r, log.y);
  p.arc(log.x, log.y, r, 0, TWO_PI);
  ctx.clip(p, "evenodd");
}

function draw() {
  /* Книга/коллекция — непрозрачный DOM-экран поверх канваса. Пока она открыта,
     игровой кадр не рисуем: это главный источник просадок на ПК (canvas 1280×800
     каждый кадр под книгой). FPS-статистика считается отдельно, в tickFps. */
  if (typeof bookIsOpen !== "undefined" && bookIsOpen) return;
  /* Таблица лидеров (в меню и на смерти) — тоже непрозрачное окно поверх игры:
     её прокрутка на телефоне упиралась в отрисовку игрового кадра под ней. */
  if (typeof lbBoardOpen === "function" && lbBoardOpen()) return;
  beginDraw();
  const jx = game.shakeX || 0;
  const jy = game.shakeY || 0;
  const shaken = jx || jy;
  if (shaken) {
    ctx.save();
    ctx.translate(snap(jx), snap(jy));
  }
  const bg = assets.bg;
  const bgByCache = typeof drawBackdropLayer === "function" && drawBackdropLayer();
  if (bgByCache) {
    /* фон уже лёг из пиксельного кэша (js/mobile.js) — кадру остался мир */
  } else if (bg) {
    const bleed = shaken ? 18 : 0;
    const dx = cropX - bleed;
    const dy = cropY - bleed;
    const dw = visW + bleed * 2;
    const dh = visH + bleed * 2;
    ctx.drawImage(
      bg,
      dx / W * bg.width, dy / H * bg.height,
      dw / W * bg.width, dh / H * bg.height,
      dx, dy, dw, dh
    );
  } else {
    ctx.fillStyle = "#5ea3a6";
    const bleed = shaken ? 18 : 0;
    ctx.fillRect(cropX - bleed, cropY - bleed, visW + bleed * 2, visH + bleed * 2);
  }

  const sy = (game.viewY || game.uiDip) ? snap((game.viewY || 0) + (game.uiDip || 0)) : 0;
  if (sy) {
    ctx.save();
    ctx.translate(0, sy);
  }

  drawShock();
  if (game.shards.length) drawShards();
  if (state !== "shatter" && state !== "victory") drawBossHalo();
  if (trails.length) {
    ctx.fillStyle = "#f4efe6";
    for (let i = 0; i < trails.length; i++) {
      const t = trails[i];
      const a = t.life * 0.22;
      if (a < 0.02) continue;
      const h = 8 + 22 * t.life;
      ctx.globalAlpha = a;
      ctx.fillRect(snap(t.x - 1.15), snap(t.y + 8), 2.3, h);
    }
    ctx.globalAlpha = 1;
  }
  if (state !== "shatter" && state !== "victory") {
    drawLog();
    /* Летящий нож — ПОВЕРХ бревна и воткнутых ножей: раньше он рисовался до
       drawLog и уходил под них, поэтому момент касания рукояти был не виден —
       нож «проскакивал» за неё и отскакивал уже невидимо. Снаружи диска он и
       должен быть впереди: он ближе к игроку. Внутрь диска не пускаем — там
       его закрывает само бревно (иначе на последнем кадре полёта лезвие легло
       бы поверх лица босса). */
    if (game.flying.length) {
      ctx.save();
      clipFlyingOutsideLog();
      for (let i = 0; i < game.flying.length; i++) {
        const k = game.flying[i];
        /* скин — с самого броска: рандомизатор из альманаха уже поставил в руку
           другой нож, а летящий должен остаться тем, что кинули */
        drawFlyKnife(k.x, k.y, 0, k.skin);
      }
      ctx.restore();
    }
    drawCoconutShellFly();
    drawCoconutLeaves();
  }
  /* половины разрезанных яблок летят и в расколе бревна: они уже в мире,
     привязки к бревну у них нет */
  if (appleHalves.length) drawAppleHalves(game.log.r);
  /* нож в руке — только в игре и в меню; на смерти в кадре летит отскочивший */
  if ((state === "play" || state === "menu") && game.knife.ready && game.intro <= 0 && !game.flying.length) {
    const hy = handY();
    /* soft = 1: нож в руке дышит (±2 px, js/layout.js: handY) и раньше рисовался
       по снапу — координата округлялась до целого пикселя полотна, и на медленном
       вдохе-выдохе движение шло ступеньками, «по пикселям». Субпиксельная
       отрисовка даёт ровный ход: спрайт и так масштабируется под размер ножа,
       лишнего сглаживания тут не прибавляется, а дёрганье уходит */
    drawKnifeImg(W * 0.5, hy, 0, 1, 1, null, 1);
  }
  /* дуэль: счёт матча живёт в HUD полоской с флагом (js/mode1v1.js), в кадре
     дуэльного ничего нет */

  if (flyApples.length) {
    for (let i = 0; i < flyApples.length; i++) {
      const c = flyApples[i];
      if (c.t < c.delay) continue;
      const apple = appleImg(c.kind) || assets.apple;
      ctx.drawImage(apple, snap(c.x - 13), snap(c.y - 13), 26, 26);
    }
  }

  if (game.fail) drawFailKnife();
  if (game.drop) drawSpinKnife(game.drop);
  drawPop();
  if (particles.length) {
    if (phone) {
      let prev = "";
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const a = p.life / p.max;
        if (a <= 0) continue;
        const col = p.color || "#e8d2ae";
        if (col !== prev) {
          ctx.fillStyle = col;
          prev = col;
        }
        const x = snap(p.x);
        const y = snap(p.y);
        const rad = p.r;
        if (p.kind === "dust") {
          ctx.globalAlpha = a * 0.22;
          fillDeviceRect(x - rad, y - rad, rad * 2, rad * 2);
        } else if (p.kind === "spark") {
          ctx.globalAlpha = a * 0.72;
          fillDeviceRect(x, y, rad * 3.6, 1.1);
        } else if (p.kind === "sprinkle") {
          ctx.globalAlpha = a;
          fillDeviceRect(x - rad * 1.35, y - rad * 0.32, rad * 2.7, rad * 0.64);
        } else if (p.kind === "glaze") {
          ctx.globalAlpha = a;
          ctx.beginPath();
          ctx.arc(x, y, rad, 0, TWO_PI);
          ctx.fill();
        } else if (p.kind === "drop") {
          ctx.globalAlpha = a * 0.92;
          ctx.beginPath();
          ctx.arc(x, y, rad, 0, TWO_PI);
          ctx.fill();
        } else if (p.kind === "fiber") {
          ctx.globalAlpha = a;
          fillDeviceRect(x, y - rad * 0.3, rad * 3.4, Math.max(1, rad * 0.34));
        } else {
          ctx.globalAlpha = a;
          fillDeviceRect(x, y, rad * 2, rad * 0.84);
        }
      }
    } else {
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const a = p.life / p.max;
        if (a <= 0) continue;
        ctx.save();
        ctx.translate(snap(p.x), snap(p.y));
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color || "#e8d2ae";
        if (p.kind === "spark") {
          ctx.globalAlpha = a * 0.72;
          ctx.fillRect(-p.r * 1.8, -0.55, p.r * 3.6, 1.1);
        } else if (p.kind === "dust") {
          ctx.globalAlpha = a * 0.22;
          ctx.beginPath();
          ctx.arc(0, 0, p.r, 0, TWO_PI);
          ctx.fill();
        } else if (p.kind === "sprinkle") {
          ctx.globalAlpha = a;
          const w = p.r * 2.6;
          const h = p.r * 0.7;
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(-w * 0.5, -h * 0.5, w, h, h * 0.5);
          else ctx.rect(-w * 0.5, -h * 0.5, w, h);
          ctx.fill();
        } else if (p.kind === "glaze") {
          ctx.globalAlpha = a;
          ctx.beginPath();
          ctx.arc(0, 0, p.r, 0, TWO_PI);
          ctx.fill();
          ctx.globalAlpha = a * 0.7;
          ctx.fillStyle = "rgba(255,255,255,0.9)";
          ctx.beginPath();
          ctx.arc(-p.r * 0.28, -p.r * 0.32, p.r * 0.28, 0, TWO_PI);
          ctx.fill();
        } else if (p.kind === "fiber") {
          ctx.globalAlpha = a;
          ctx.fillRect(-p.r * 2.2, -p.r * 0.22, p.r * 4.4, Math.max(1.1, p.r * 0.38));
        } else if (p.kind === "drop") {
          ctx.globalAlpha = a * 0.92;
          ctx.beginPath();
          ctx.arc(0, 0, p.r, 0, TWO_PI);
          ctx.fill();
          ctx.globalAlpha = a * 0.8;
          ctx.fillStyle = "rgba(255,255,255,0.9)";
          ctx.beginPath();
          ctx.arc(-p.r * 0.28, -p.r * 0.32, p.r * 0.3, 0, TWO_PI);
          ctx.fill();
        } else {
          ctx.globalAlpha = a;
          ctx.fillRect(-p.r, -p.r * 0.42, p.r * 2, p.r * 0.84);
        }
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
  }
  drawClash();
  if (state !== "victory") drawLogHpBar();

  if (sy) ctx.restore();
  if (game.sting > 0) drawBossSting();
  if (game.victory > 0) drawBossVictory();
  if (shaken) ctx.restore();
  applyUiDip();
  /* телефон: на вступлении босса и сцене победы интерфейс убирается (js/mobile.js) */
  if (typeof syncPhoneScene === "function") syncPhoneScene();

  if (game.flash > 0) {
    const k = game.flashK || 0.22;
    ctx.fillStyle = `rgba(${game.flashCol},${game.flash * k})`;
    ctx.fillRect(cropX, cropY, visW, visH);
  }

  /* Смерть: экран гаснет ПОВЕРХ всего — пелена, а над ней остаётся только нож
     (js/draw-hud.js: drawDeathKnife). HUD уходит отдельно через css (.death-dim),
     кнопка ролика тоже остаётся яркой. */
  if (state === "fail") {
    /* Пелена одна: наезжает за четверть секунды и остаётся, пока открыт итог —
       экран не вспыхивает обратно. Нож рисуется только пока идёт сцена. */
    const k = clamp(((game.deathT || 0) - DEATH_SCENE_DELAY) / 0.24, 0, 1);
    const a = 0.62 * k;
    if (a > 0.004) {
      ctx.fillStyle = "rgba(6, 3, 2, " + a.toFixed(3) + ")";
      ctx.fillRect(cropX - 160, cropY - 160, visW + 320, visH + 320);
    }
    if (!game.deathDone) drawDeathKnife();
  }
}

function fpsMode(arr, n) {
  fpsBins.fill(0);
  let best = 0, nBest = 0;
  for (let i = 0; i < n; i++) {
    const r = arr[i] | 0;
    if (r < 0 || r > 240) continue;
    const c = ++fpsBins[r];
    if (c > nBest) { nBest = c; best = r; }
  }
  return best;
}

/* Самый низкий FPS за окно — это худший кадр: самая длинная пауза между
   кадрами внутри последних пяти секунд. Средний по секунде такой провал
   сглаживает (200 мс просадки дают всего 48 к/с), а глаз видит именно рывок.
   Провал считаем в ЦЕЛЫХ кадрах обновления: 16.9–18 мс на 60 Гц — это всё ещё
   один кадр (джиттер вертикальной синхронизации), а не 57 к/с; настоящий
   пропуск — 30+ мс, и он честно покажет 30. */
function fpsLowest() {
  const n = fpsLog.length;
  if (n < 2) return 0;
  const from = fpsLog[0];
  let worst = 0;
  for (let i = 1; i < n; i++) {
    const t = fpsLog[i];
    if (t < from) continue;
    const dt = t - fpsLog[i - 1];
    if (dt > worst) worst = dt;
  }
  if (!(worst > 0)) return 0;
  if (fpsCap >= 30 && fpsCap <= 240) {
    const q = 1000 / fpsCap;
    const slots = Math.max(1, Math.round(worst / q));
    return Math.max(1, Math.min(999, Math.round(fpsCap / slots)));
  }
  const fps = 1000 / worst;
  return Math.max(1, Math.min(999, Math.round(fps)));
}

/* Текущий FPS — среднее по последним 500 мс, а не 1/длительность кадра:
   мгновенное значение скачет на каждом кадре и читается как ошибка. */
function fpsCurrent(ts) {
  const n = fpsLog.length;
  if (!n) return 0;
  const from = ts - 500;
  let cnt = 0;
  for (let i = n - 1; i >= 0 && fpsLog[i] >= from; i--) cnt++;
  const span = (ts - fpsLog[n - cnt]) / 1000;
  return span > 0 ? Math.round(cnt / Math.min(0.5, span)) : 0;
}

/* Новая «сессия» счётчика: когда стартовая заставка совсем ушла, окно
   «минимальный FPS за 5 с» начинается с чистого листа. Тормоза загрузки и
   первого показа меню — не игровые кадры, и в счётчике они только пугали. */
function fpsResetWindow() {
  fpsLog.length = 0;
  fpsUiAt = 0;
  fpsHot = false;
  fpsHitchOn = false;
  if (fpsMinEl) fpsMinEl.textContent = "—";
  if (fpsVal) fpsVal.textContent = "0";
  if (fpsMs) fpsMs.textContent = "— МС";
}

function tickFps(rawDt, ts) {
  if (!(rawDt > 0)) return;
  const ms = rawDt * 1000;

  /* сессия: средний FPS = кадры / время кадров (паузы и скрытая вкладка в счёт
     не идут — там stepFrame время не копит) */
  fpsFrames++;
  fpsSumDt += rawDt;
  fpsLog.push(ts);
  /* Чистим окно пачкой, а не shift() на каждом кадре: 300 сдвигов массива в
     секунду — лишняя работа и мусор. */
  if (fpsLog.length > 360) {
    const lim = ts - FPS_WIN_MS;
    let cut = 0;
    while (cut < fpsLog.length && fpsLog[cut] < lim) cut++;
    if (cut > 0) fpsLog.splice(0, cut);
  }

  const inst = 1 / rawDt;

  if (inst >= 24 && inst <= 240 && rawDt < 0.08) {
    fpsSamples[fpsSampleI] = inst;
    fpsSampleI = (fpsSampleI + 1) % fpsSamples.length;
    if (fpsSampleN < fpsSamples.length) fpsSampleN++;
    if (fpsSampleN >= 24) {
      const mode = fpsMode(fpsSamples, fpsSampleN);
      if (mode >= 30) fpsCap = mode;
    }
  }

  /* Счётчика FPS в интерфейсе больше нет. Определение герцовки выше и
     накопление статистики остаются: по ним игра выбирает ритм кадров. */
  if (!fpsChip) return;

  const cap = fpsCap || 60;
  const budget = 1000 / cap;
  const shown = Math.round(inst);
  const below = fpsCap > 0 && shown < fpsCap;
  /* Любой, даже микроскопический провал кадра красит счётчик: порог — 1 мс
     сверх бюджета (16.7 → 17.7 при 60 Гц). Стабильные 60 остаются зелёными —
     иначе чип горел бы красным всегда */
  const hitch = ms > budget + 1.0 || ms > budget * 1.15;
  if (hitch) fpsRedUntil = ts + 320;
  const hitchVis = hitch || ts < fpsRedUntil;
  const hot = below || hitchVis;
  if (hot !== fpsHot) {
    fpsHot = hot;
    fpsChip.classList.toggle("hot", hot);
  }
  if (hitchVis !== fpsHitchOn) {
    fpsHitchOn = hitchVis;
    fpsChip.classList.toggle("hitch", hitchVis);
  }

  if (ts - fpsUiAt > 120) {
    fpsUiAt = ts;
    const cur = fpsCurrent(ts) || shown;
    fpsVal.textContent = String(cur);
    fpsMs.textContent = ms.toFixed(1) + " МС";
    fpsAvgVal = fpsSumDt > 0 ? Math.round(fpsFrames / fpsSumDt) : 0;
    fpsMinVal = fpsLowest();
    fpsAvgEl.textContent = fpsAvgVal ? String(fpsAvgVal) : "—";
    fpsMinEl.textContent = fpsMinVal ? String(fpsMinVal) : "—";
  }
}

function refreshQuantum(rawDt) {
  if (fpsCap >= 30 && fpsCap <= 240) return 1 / fpsCap;
  if (!(rawDt > 0)) return 0;
  const guess = 1 / rawDt;
  if (guess < 40 || guess > 260) return 0;
  const rates = [60, 75, 90, 120, 144, 165, 240, 50, 48, 30];
  let best = 0;
  let bestErr = 10;
  for (let i = 0; i < rates.length; i++) {
    const err = Math.abs(guess - rates[i]);
    if (err < bestErr) {
      bestErr = err;
      best = rates[i];
    }
  }
  return best ? 1 / best : 0;
}

function paceDt(rawDt) {
  if (!(rawDt > 0)) return 0;
  const capped = rawDt > MAX_FRAME_DT ? MAX_FRAME_DT : rawDt;
  const q = refreshQuantum(rawDt);
  if (q > 0 && rawDt <= q * 1.35) {
    const n = Math.round(capped / q);
    if (n >= 1 && n <= 2) {
      const snapped = n * q;
      if (Math.abs(capped - snapped) <= q * 0.45) {
        prevPace = snapped;
        return snapped;
      }
    }
  }
  if (prevPace > 0 && Math.abs(capped - prevPace) <= Math.max(0.0008, prevPace * 0.08)) {
    prevPace += (capped - prevPace) * 0.25;
    return prevPace;
  }
  prevPace = capped;
  return capped;
}

/* Провал кадра (бейк спрайта, сборка мусора, реклама): время фриза не догоняем.
   Иначе бревно за один кадр прыгает вперёд на сотню миллисекунд и клик,
   пришедший после провала, втыкается уже в другой (или чужой) нож. */
const HITCH_DT = 0.12;
let prevRawDt = 0;

let frameErrMsg = "", frameErrAt = 0, frameErrN = 0;
/* Ошибка в кадре не должна убивать цикл: без requestAnimationFrame игра встаёт
   насмерть — ни броска, ни анимации, помогает только перезагрузка. Ловим,
   пишем в консоль (одну и ту же ошибку — не чаще раза в 5 с) и живём дальше. */
function noteFrameError(err) {
  frameErrN++;
  const msg = String((err && err.message) || err);
  const now = performance.now();
  if (msg === frameErrMsg && now - frameErrAt < 5000) return;
  frameErrMsg = msg;
  frameErrAt = now;
  if (window.console && console.error) console.error("кадр:", err);
}

/* Реальная герцовка дисплея: rAF вызывает нас и на пропущенных кадрах тоже,
   поэтому меряем интервал до КАЖДОГО кадра, а не до отрисованного. */
let lastRafTs = 0;
let rafHzEst = 0;
let rafHzN = 0;
let pauseDrawn = false;

function loop(ts) {
  try {
    stepFrame(ts);
  } catch (err) {
    noteFrameError(err);
  }
  requestAnimationFrame(loop);
}

function stepFrame(ts) {
  /* Страховка от зависшей паузы (js/yandex.js: yxPauseWatchdog) */
  if (typeof yxPauseWatchdog === "function") yxPauseWatchdog(ts);
  const rafGap = lastRafTs ? ts - lastRafTs : 0;
  lastRafTs = ts;
  if (rafGap > 2 && rafGap < 50) {
    const hz = Math.round(1000 / rafGap);
    if (hz >= 40 && hz <= 240) {
      if (Math.abs(hz - rafHzEst) <= 3) rafHzN++;
      else { rafHzEst = hz; rafHzN = 0; }
    }
  }
  /* Курсор канвы не меняется (css/style.css: cursor: default !important), а
     трогать CSSOM на каждом кадре незачем: это лишняя работа в кадре. */
  if (document.hidden) {
    lastT = 0;
    prevPace = 0;
    return;
  }
  /* Пауза площадки (свернули, сменили вкладку, идёт реклама): геймплей стоит.
     Кадр рисуем только один — в момент входа в паузу, дальше не тратим GPU
     впустую, пока показывают рекламу. */
  if (GamePause.on) {
    if (!pauseDrawn) {
      pauseDrawn = true;
      draw();
    }
    lastT = 0;
    prevPace = 0;
    return;
  }
  pauseDrawn = false;
  if (!lastT) {
    lastT = ts;
    prevRawDt = 0;
    draw();
    return;
  }
  /* Телефон с высокой герцовкой (120/144 Гц): рисуем ровно половину кадров —
     60/72 fps. Игра не требует больше, а заливка и нагрев падают вдвое; ритм
     остаётся ровным, потому что пропускаем строго каждый второй кадр. Герцовку
     берём из сырых rAF-интервалов (fpsCap подстраивается под уже отрисованные
     кадры и после первого пропуска стал бы 60 — и цикл за oscillated бы). */
  if (phone && rafHzEst >= 100 && ts - lastT < (1000 / (rafHzEst * 0.5)) * 0.9) return;
  const rawDt = (ts - lastT) / 1000;
  if (rawDt < 0.002) return;
  /* одиночный провал кадра (а не ровные 8 fps): мир стоит кадр. Время фриза не
     догоняем и ввод НЕ гасим: нажатия, сделанные в этот момент, ждут в очереди
     броска и вылетают, как только кадр вернулся, — за фриз бревно не повернулось,
     значит прицел тот же (js/flow.js: sampleLogTurn / pumpThrowBuffer) */
  const hitch = rawDt > HITCH_DT && prevRawDt <= HITCH_DT;
  prevRawDt = rawDt;
  lastT = ts;
  tickFps(rawDt, ts);
  if (typeof Analytics !== "undefined") Analytics.fpsSample(1 / rawDt, rawDt);
  if (hitch) {
    prevPace = 0;
    draw();
    return;
  }
  const dt = paceDt(rawDt);
  const t1 = ts;
  const t0 = ts - dt * 1000;
  /* Демка: настоящий движок рисует игру, но временем и бросками управляет
     js/replay.js (как будто за игрока нажимает авто-бот). */
  if (typeof Replay !== "undefined" && Replay.active()) {
    if (typeof pumpLogBake === "function") pumpLogBake();
    Replay.step(dt, ts);
    draw();
    flushSfx();
    return;
  }
  if (game.hitStop > 0) {
    game.hitStop = Math.max(0, game.hitStop - dt);
    draw();
    return;
  }
  /* бейк бревна — ДО кадра: иначе спрайт приходит на кадр позже, и босс
     появляется без теней (js/draw-log.js: logSpriteReady) */
  pumpLogBake();
  update(dt, t0, t1);
  /* поворот бревна за кадр: по нему очередь броска решает, прицельно ли нажатие */
  sampleLogTurn();
  /* запись кадров демки и подсчёт времени в игре (js/analytics.js) */
  if (typeof Analytics !== "undefined") Analytics.frame();
  /* клик, придержанный из-за летящего ножа (js/flow.js) */
  pumpThrowBuffer();
  pumpShardBakes();
  draw();
  flushSfx();
}

