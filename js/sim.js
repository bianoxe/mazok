/* ---------- белая вспышка удара по бревну ----------
   Раньше это был один-два белых кадра: бревно «мигало» и резко возвращалось,
   и удар читался как лаг. Теперь у вспышки короткая мягкая огибающая (вход
   сразу с 45 %, пик через ~22 мс, плавное затухание строго в ноль). Дольше
   LOG_HIT_FLASH_DUR она не живёт, поэтому белым бревно не «залипает». */
const LOG_HIT_FLASH_DUR = 0.1;

function hitLogFlash(power) {
  const log = game.log;
  if (!log) return;
  power = power > 0 ? power : 0;
  log.hitFlash = Math.max(log.hitFlash || 0, Math.min(1, power));
  log.hitFlashT = LOG_HIT_FLASH_DUR;
}

function clearLogFlash() {
  const log = game.log;
  if (!log) return;
  log.hitFlash = 0;
  log.hitFlashT = 0;
}

/* Текущая яркость вспышки 0…1: считается от оставшегося времени, а не от
   кадров, поэтому на просадке fps она не исчезает мгновенно. */
function logHitFlashAlpha() {
  const log = game.log;
  const left = log && log.hitFlashT ? log.hitFlashT : 0;
  const power = log && log.hitFlash ? log.hitFlash : 0;
  if (!(left > 0) || !(power > 0)) return 0;
  const t = clamp(1 - left / LOG_HIT_FLASH_DUR, 0, 1);
  const rise = 0.22;
  let e;
  if (t < rise) {
    e = 0.45 + 0.55 * (t / rise);
  } else {
    const d = (t - rise) / (1 - rise);
    e = 1 - d;
    e = e * e * (3 - 2 * e);
  }
  return power * e;
}

/* ---------- update / draw ---------- */
function update(dt, t0, t1) {
  const tms = dt * 1000;
  if (!(t1 > 0)) {
    t1 = performance.now();
    t0 = t1 - tms;
  }
  game.time += tms;
  game.flash = Math.max(0, game.flash - dt * 1.6);
  /* шаг вспышки режем: один провал кадра не должен стирать её целиком */
  const flashDt = dt > 0.05 ? 0.05 : dt;
  game.log.hitFlashT = Math.max(0, (game.log.hitFlashT || 0) - flashDt);
  if (game.log.hitFlashT <= 0) game.log.hitFlash = 0;
  stepHpTrail(dt);
  game.shockT = Math.max(0, game.shockT - dt * 2.6);
  if (game.clash) {
    game.clash.t = Math.max(0, game.clash.t - dt * 3.4);
    if (game.clash.t <= 0) game.clash = null;
  }
  if (game.pop) {
    game.pop.t = Math.max(0, game.pop.t - dt * 7.5);
    if (game.pop.t <= 0) game.pop = null;
  }
  if (game.sting > 0) {
    stepBossSting(dt);
  } else if (game.victory > 0) {
    stepBossVictory(dt);
  } else if (game.intro > 0) {
    game.intro = Math.max(0, game.intro - dt);
    const u = 1 - game.intro / INTRO_DUR;
    game.log.scale = Math.max(0.001, easeOutBack(u));
  } else if (state !== "shatter") {
    game.log.scale = 1;
  }

  if (state === "play") {
    game.handT = handRecovered(performance.now());
  } else if (state === "fail") {
    /* бревно докатывается по инерции: скорость гаснет, угол доезжает — и всё.
       Все узоры держат угловую скорость в рад/мс, так что ход за кадр — это
       просто vel * tms. Но быстрые венцы (пила 4125°/с, спасательный круг,
       монета) за кадр проскакивают десятки градусов: на смерти это читается
       не как докат, а как «бревно трясётся». Поэтому шаг за кадр режем до
       FAIL_COAST_TURN — оборот видно, а мигания нет. */
    let v = (game.log.vel || 0) * Math.exp(-3.4 * dt);
    if (game.log.pattern === "saw" && v < 0) v = 0;
    game.log.vel = v;
    game.log.speed = v;
    game.log.angle += clamp(v * tms, -FAIL_COAST_TURN, FAIL_COAST_TURN);
    if (game.log.boss && game.log.boss.id === "fan") stepFanSpin(tms);
    if (!game.deathDone) {
      game.deathT = (game.deathT || 0) + dt;
      /* первые DEATH_SCENE_DELAY секунд в кадре ничего не появляется: игрок
         видит, что произошло. Потом вся сцена включается разом */
      const t = game.deathT - DEATH_SCENE_DELAY;
      if (t >= 0) {
        if (!game.reviveShown) {
          game.reviveShown = true;
          if (hud) hud.classList.add("death-dim");
          showDeathWord();
          showReviveButton();
          hideDeathSkip();
        }
        /* отказ открывается не сразу: через DEATH_SKIP_DELAY после сцены,
           и кнопка «Нет, спасибо» появляется с анимацией */
        if (!game.skipShown && t >= DEATH_SKIP_DELAY) {
          game.skipShown = true;
          showDeathSkip();
        }
        game.deathTick = (game.deathTick || 0) + dt;
        /* тикает РОВНО пять раз за пять секунд, сухим тиком без эха */
        if (game.deathTick >= 1 && (game.deathBeats | 0) < 5) {
          game.deathTick -= 1;
          game.deathBeats = (game.deathBeats | 0) + 1;
          deferSfx(() => Sfx.deathBeat());
        }
        /* нож погас — ролик больше не взять, показываем итог */
        if (t >= DEATH_FADE) endDeathScene();
      }
    }
  } else if (state === "menu") {
    stepLogSpin(dt);
    stepMenuTips(dt);
  }

  let levelBoot = false;
  if (state === "shatter") {
    game.shatterT += dt;
    /* боссу даём слышать смерть ~0.9 с, иначе победа (whoosh/land) её забивает */
    const handoff = game.victoryReward ? 0.9 : SHATTER_HANDOFF;
    if (game.shatterT >= handoff) {
      /* шарик лопается трижды: пока остались шарики, тот же уровень начинается
         заново — с новым латексом и заново надутым шариком */
      if (nextBalloon()) {
        state = "play";
        levelBoot = true;
      } else if (game.victoryReward && game.log.boss) {
        /* босс добит: вместо нового уровня показываем «БОСС ПОВЕРЖЕН», и уже
           она пустит дальше — ветка state === "victory" ниже.
           Обычное бревно (boss = null) сюда не попадает ни при каких условиях. */
        state = "victory";
        beginBossVictory(game.victoryReward);
      } else {
        startLevel(game.level + 1, false);
        state = "play";
        levelBoot = true;
      }
    }
  } else if (state === "victory") {
    /* сцена отыграла: нож упал, награда показана — можно и дальше */
    if (!(game.victory > 0)) {
      startLevel(game.level + 1, false);
      state = "play";
      levelBoot = true;
      /* выбитые ножи тут НЕ показываем: карточка «НОВЫЙ НОЖ» ждёт смерти
         игрока и выходит на итоге забега (js/flow.js: showFailOverlay) */
    }
  }

  for (let i = game.shards.length - 1; i >= 0; i--) {
    const s = game.shards[i];
    s.age = (s.age || 0) + dt;
    if ((s.delay || 0) > 0) {
      s.delay -= dt;
      if (!phone) s.scale = 1 + Math.min(s.age, 0.05) * 1.35;
      if (s.delay > 0) continue;
    }
    s.vy += (s.kind === "anchor" || s.kind === "cap" ? 2600 : 1680) * dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.rot += s.vr * dt;
    s.vx *= 0.994;
    s.vr *= 0.996;
    const tomatoPop = s.boss && s.boss.id === "tomato" && s.kind === "wedge";
    s.scale = phone || s.kind === "anchor" || s.kind === "cap" ? 1 : Math.max(tomatoPop ? 0.78 : 0.68, 1 - s.age * (tomatoPop ? 0.16 : 0.28));
    const fadeStart = tomatoPop ? 0.72 : s.kind === "wedge" ? 0.46 : (s.kind === "anchor" || s.kind === "cap") ? 1.15 : 0.3;
    const fadeLen = tomatoPop ? 0.5 : 0.32;
    s.alpha = s.age > fadeStart ? clamp(1 - (s.age - fadeStart) / fadeLen, 0, 1) : 1;
    if (s.alpha <= 0.02 || s.y > H + 260 || s.x < -240 || s.x > W + 240) {
      if (s.sprite) releaseCanvas(s.sprite);
      s.sprite = null;
      s.atlas = null;
      s.wedgePath = null;
      s.wedgeClip = null;
      s.split0 = null;
      s.split1 = null;
      givePool(shardPool, dropSwap(game.shards, i));
    }
  }
  if (shatterSpr) {
    let used = false;
    for (let i = 0; i < game.shards.length; i++) {
      if (game.shards[i].kind === "wedge") { used = true; break; }
    }
    if (!used) {
      if (!(logBake && logBake.c === shatterSpr.c)) releaseCanvas(shatterSpr.c);
      shatterSpr = null;
    }
  }

  if (state === "play" && !levelBoot) {
    if (simulateFlight(dt)) {
      if (game.drop) stepSpinKnife(game.drop, dt);
      if (game.fail) stepSpinKnife(game.fail, dt);
      stepJuice(dt);
      return;
    }
  }

  if (game.fail) {
    stepSpinKnife(game.fail, dt);
    if (game.fail.y > H + 240 || game.fail.x < -160 || game.fail.x > W + 160) game.fail = null;
  }
  if (game.drop) {
    stepSpinKnife(game.drop, dt);
    if (game.drop.y > H + 240 || game.drop.x < -160 || game.drop.x > W + 160) game.drop = null;
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.vy += p.g * dt;
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.rot += p.vr * dt;
    p.life -= dt;
    if (p.life <= 0) givePool(particlePool, dropSwap(particles, i));
  }
  for (let i = trails.length - 1; i >= 0; i--) {
    trails[i].life -= dt * 5;
    if (trails[i].life <= 0) givePool(trailPool, dropSwap(trails, i));
  }
  const targetX = cropX + 56, targetY = cropY + 48;
  for (let i = flyApples.length - 1; i >= 0; i--) {
    const c = flyApples[i];
    c.t += dt;
    if (c.t < c.delay) continue;
    const u = clamp((c.t - c.delay) / 0.7, 0, 1);
    if (u < 0.35) {
      c.vy += 500 * dt;
      c.x += c.vx * dt; c.y += c.vy * dt;
      c._sx = c.x; c._sy = c.y;
    } else {
      const k = easeOutCubic((u - 0.35) / 0.65);
      c.x = lerp(c._sx || c.x, targetX, k);
      c.y = lerp(c._sy || c.y, targetY, k);
    }
    if (u >= 1) givePool(applePool, dropSwap(flyApples, i));
  }
  stepAppleHalves(dt);
  stepJuice(dt);
}

function punchView(mag) {
  game.viewV = (game.viewV || 0) - Math.min(1900, Math.abs(mag) * 62);
}

function shakeCanvas(mag) {
  const m = Math.abs(mag);
  game.shakeMag = Math.max(game.shakeT > 0 ? (game.shakeMag || 0) : 0, m);
  game.shakeDur = 0.22;
  game.shakeT = 0.22;
  game.shakePh = Math.random() * TWO_PI;
}

function stepScreenShake(dt) {
  if (!(game.shakeT > 0)) {
    game.shakeX = 0;
    game.shakeY = 0;
    return;
  }
  game.shakeT = Math.max(0, game.shakeT - dt);
  const dur = game.shakeDur || 0.22;
  const u = 1 - game.shakeT / dur;
  const env = Math.sin((game.shakeT / dur) * Math.PI * 0.5);
  const mag = (game.shakeMag || 0) * env;
  const ph = game.shakePh || 0;
  game.shakeX = Math.sin(u * Math.PI * 8 + ph) * mag;
  game.shakeY = Math.sin(u * Math.PI * 6.5 + ph * 1.7) * mag * 0.72;
  if (game.shakeT <= 0) {
    game.shakeX = 0;
    game.shakeY = 0;
    game.shakeMag = 0;
  }
}

function buzz(pat) {
  if (!phone || muted || !navigator.vibrate) return;
  try { navigator.vibrate(pat); } catch (err) {}
}

function stepJuice(dt) {
  stepCoconutLeaves(dt);
  stepCoconutShell(dt);
  stepSpring(game.viewY || 0, game.viewV || 0, dt, 1400, 40);
  if (Math.abs(springY) < 0.04 && Math.abs(springV) < 0.4) {
    game.viewY = 0;
    game.viewV = 0;
  } else {
    game.viewY = springY;
    game.viewV = springV;
  }
  const log = game.log;
  stepSpring(log.pulse || 0, log.pulseV || 0, dt, 700, 26);
  if (Math.abs(springY) < 0.0005 && Math.abs(springV) < 0.006) {
    log.pulse = 0;
    log.pulseV = 0;
  } else {
    log.pulse = springY;
    log.pulseV = springV;
  }
  const knives = game.stuck;
  for (let i = 0; i < knives.length; i++) {
    const k = knives[i];
    if (k.flash) k.flash = Math.max(0, k.flash - dt * 4.2);
    if (k.kick) k.kick = Math.max(0, k.kick - dt * 11);
    if (!(k.sink || k.sinkV)) continue;
    stepSpring(k.sink || 0, k.sinkV || 0, dt, 620, 18);
    if (springY <= 0 || (Math.abs(springY) < 0.12 && Math.abs(springV) < 0.7)) {
      k.sink = 0;
      k.sinkV = 0;
    } else {
      k.sink = springY;
      k.sinkV = springV;
    }
  }
  stepScreenShake(dt);
  if ((game.uiDip || game.uiDipV) && (Math.abs(game.uiDip) > 0.08 || Math.abs(game.uiDipV) > 2)) {
    stepSpring(game.uiDip || 0, game.uiDipV || 0, dt, 640, 22);
    game.uiDip = springY;
    game.uiDipV = springV;
  } else {
    game.uiDip = 0;
    game.uiDipV = 0;
  }
}

