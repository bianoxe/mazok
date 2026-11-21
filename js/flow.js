/* ---------- game flow ---------- */
function armFirstLog() {
  game.fail = null;
  game.clash = null;
  game.pop = null;
  clearFlying();
  releaseShards();
  clearAppleHalves();
  game.shockT = 0;
  game.flash = 0;
  game.shake = 0;
  game.shakeX = 0;
  game.shakeY = 0;
  game.shakeT = 0;
  game.shakeMag = 0;
  game.viewY = 0;
  game.viewV = 0;
  game.uiDip = 0;
  game.uiDipV = 0;
  game.log.pulse = 0;
  game.log.pulseV = 0;
  game.intro = 0;
  clearBossSting();
  clearBossVictory();
  resetKnifeUnlocks();
  game.hitStop = 0;
  game.level = 1;
  /* новый забег начинается с чистого листа: лента «НОВЫЙ РЕКОРД» появляется
     только когда этот забег реально перебьёт прежний рекорд (js/flow.js:
     stickKnife, js/hud.js: syncRecordHud) */
  game.bestBeaten = false;
  game.recordNum = 0;
  resetStageWoods();
  resetWoodPatterns();
  resetWoodKnives();
  game.theme = themeIndexFor(1);
  game.thrown = 0;
  game.knife.ready = true;
  game.knife.flying = false;
  game.handT = 1;
  lastThrowAt = 0;
  game.lives = playerMaxLives();
  game.maxLives = playerMaxLives();
  game.rewardAdUsed = false;
  game.drop = null;
  game.buffs.shield = false;
  game.buffs.slow = false;
  game.buffs.double = false;
  game.log.boss = bossFor(1);
  game.log.maxHp = maxHpFor(1);
  game.log.hp = game.log.maxHp;
  game.log.dmg = 0;
  clearLogFlash();
  /* меню начинает забег с первого уровня: шарик, если он тут окажется, красный,
     и качание у него с начала фазы */
  game.log.balloonN = 0;
  game.log.balloonT = 0;
  resetHpTrail();
  game.log.scale = 1;
  game.log.dir = 1;
  game.log.burst = 0;
  game.log.angle = 0;
  game.log.from = game.log.angle;
  game.log.delta = 0;
  game.log.t = 0;
  game.log.dur = 1;
  game.log.pauseT = 0;
  /* новый забег: очередь нажатий с прошлого бревна не переживает его */
  clearThrowBuffer();
  syncLogTurn();
  game.cracks = [];
  game.needCracks = true;
  game.bakeId = (game.bakeId || 0) + 1;
  invalidateLogBakes();
  startLogSpin(1);
  clearStuck();
  layout();
  /* Первый уровень забега начинается здесь, а не через startLevel (его зовёт только
     переход на следующий уровень, см. js/sim.js). Значит и стартовые ножи ставим
     здесь: на бревне их по-прежнему не будет (knifeCountAt(1) = 0 — первый уровень
     учит бросать в голое бревно), а босс, поставленный в первую стадию своей
     очереди, придёт со своими ножами, а не с пустым полем. */
  placeStartKnives(1);
  /* яблоки на бревне: сколько их — решает уровень (js/progress.js) */
  placeLogApples(1);
}

function enterMenu(result) {
  /* если игрок вышел из забега кнопкой «⟵», запись забега закрывается как
     «выход»; после смерти она уже закрыта и вызов ничего не делает */
  if (typeof Analytics !== "undefined") Analytics.runEnd("exit");
  state = "menu";
  hideDeathWord();
  hideDeathSkip();
  hideReviveButton();
  hud.classList.remove("on", "death-dim");
  menuEl.classList.remove("hidden");
  if (overlay) {
    overlay.classList.add("hidden");
    overlay.classList.remove("spring-in");
  }
  closeSheet();
  /* книга ножей живёт своим слоем: в меню она закрыта всегда */
  if (typeof closeKnifeBook === "function") closeKnifeBook();
  armFirstLog();
  resetMenuTip();
  /* подпись под кнопкой «Играть» — только новичку (js/stats.js) */
  syncPlayHint();
  /* док и счётчики открываются по прогрессу (js/stats.js: applyUiGate) */
  applyUiGate();
  if (result) {
    menuSub.textContent = result;
    menuSub.classList.add("fail");
  } else {
    menuSub.textContent = "";
    menuSub.classList.remove("fail");
  }
  /* в бою syncHud обновляет только HUD, поэтому при входе в меню сбрасываем
     снимок и синхронизируем меню целиком (js/hud.js: syncHud) */
  hudSnap = "";
  syncHud();
  if (typeof syncResumeButton === "function") syncResumeButton();
  /* Аудиоконтекст создаём заранее, в меню: на телефоне создание ctx — заметная
     синхронная работа, и первый тап не должен платить за неё. Звук всё равно
     проснётся только на жесте (js/sfx.js: unlock). */
  try { if (typeof Sfx !== "undefined" && Sfx.ensure) Sfx.ensure(); } catch (err) {}
  /* Если звук уже разбужен, но буферы частых эффектов ещё не готовы (например,
     первый забег начался сразу с тапа), догоняем их в меню — не в бою. */
  try {
    if (typeof Sfx !== "undefined" && Sfx.ctx && Sfx._warmBuffers) {
      setTimeout(function () {
        try {
          Sfx._warmTries = 0;
          Sfx._warmBuffers();
        } catch (err) {}
      }, 400);
    }
  } catch (err) {}
  /* Один раз за сессию раскладываем строки таблицы лидеров в скрытой панели:
     иначе первый показ после смерти платит за стили/раскладку в своём кадре. */
  if (typeof warmLeaderboardRows === "function") setTimeout(warmLeaderboardRows, 700);
  /* Спрайты полоски HP — тоже заранее, чтобы первый удар не пёк их в бою. */
  if (typeof warmHpBarSprites === "function") setTimeout(warmHpBarSprites, 900);
  /* Сцена первого босса: пелена/виньетка, слово и меч пекутся в меню, а не в
     анимации вступления (js/boss-sting.js: warmStingAssets). */
  if (typeof armStingWarm === "function") setTimeout(armStingWarm, 1250);
  if (window.__canvasTextWarmPending) {
    window.__canvasTextWarmPending = false;
    setTimeout(function () { try { if (typeof prewarmCanvasTexts === "function") prewarmCanvasTexts(); } catch (err) {} }, 1000);
  }
  /* Коллекция ножей: строим скрытый DOM в меню (без принудительного layout),
     чтобы открытие не собирало 150 карточек в кадре, а наборы были готовы. */
  if (typeof warmKnifeBook === "function") setTimeout(warmKnifeBook, 1600);
  /* Статистика, накопленная в бою, сохраняется здесь, а не в кадре. */
  if (typeof persistStats === "function") {
    setTimeout(function () { try { persistStats(); } catch (err) {} }, 0);
  }
  /* Premium-плашка и баннер мастерской живут только в главном меню */
  if (typeof premiumSync === "function") premiumSync();
  /* аналитика: обновить кулдаун яблок, проверить обязательный отзыв */
  if (typeof Analytics !== "undefined") Analytics.onMenu();
}

function consumeLoadout() {
  game.buffs.shield = false;
  game.buffs.slow = false;
  game.buffs.double = false;
  for (const it of SHOP_ITEMS) {
    if (!save.loadout[it.id]) continue;
    if (itemCount(it.id) <= 0) {
      save.loadout[it.id] = false;
      continue;
    }
    save.items[it.id] = itemCount(it.id) - 1;
    save.loadout[it.id] = false;
    game.buffs[it.id] = true;
  }
  persist();
}

function startRun() {
  if (state !== "menu" || sheetMode) return;
  /* Сколько забегов игрок начал ДО этого: по нему и решаем, есть ли уже
     сравниваемый результат. Первый забег рекорда не даёт вовсе */
  const runsBefore = stats.runs | 0;
  resetBossPick();
  consumeLoadout();
  menuEl.classList.add("hidden");
  hud.classList.add("on");
  state = "play";
  /* стата: забег начался (js/stats.js) */
  statRun();
  /* запись демки: какое бревно, какой нож, каждый бросок (js/analytics.js) */
  if (typeof Analytics !== "undefined") Analytics.runStart();
  game.lives = playerMaxLives();
  game.maxLives = playerMaxLives();
  /* Реклама за возрождение — ровно один раз за забег (js/flow.js:
     tryReviveByAd). Новый забег снова даёт один шанс. */
  game.rewardAdUsed = false;
  /* подсказка новичку про свои жизни (js/hud.js: livesHint) */
  game.fail = null;
  /* Счёт и рекорд на старте забега:
     recordNum — сколько ножей воткнуто (забег ещё не начался, счёт нулевой);
     bestBase — лучший результат ДО этого забега, с ним и сравниваем;
     bestKnown — сравнивать есть с чем: у игрока уже был забег (runsBefore)
     или остался старый рекорд. ПЕРВЫЙ забег рекорда не даёт: справа одно
     число ножей, без колонки рекорда и без ленты. */
  game.recordNum = 0;
  game.bestBase = save.best | 0;
  game.bestKnown = (save.best | 0) > 0 || runsBefore >= 1;
  game.bestBeaten = false;
  game.drop = null;
  game.clash = null;
  game.pop = null;
  game.hitStop = 0;
  game.log.scale = 1;
  syncHud();
  livesHint();
  /* забег начался: предложение Premium и баннер со сцены убираем */
  if (typeof premiumSync === "function") premiumSync();
  if (isBoss(game.level)) beginBossSting();
  else {
    clearBossSting();
    game.intro = 0;
    /* Нож остаётся в руке: забег, пущенный из магазина или листа предметов, не бросает
       за игрока. Бросок делает ровно тот клик, который начал забег с игрового поля
       (см. input.js), поэтому со стороны поля всё как было. */
  }
}

function startLevel(level, first) {
  if (typeof Replay !== "undefined" && Replay.active()) Replay.beforeLevel(level);
  game.level = level;
  /* «до какой стадии дошёл»: помним самый дальний уровень, дойденный вообще,
     а не только в этом забеге (js/hud.js: строка СТАДИЯ в меню) */
  if ((save.bestLevel | 0) < level) {
    save.bestLevel = level;
    if (typeof persistSoon === "function") persistSoon();
  }
  /* Счётчик ножей и рекорд от уровня не зависят: они копятся в stickKnife,
     здесь ничего не трогаем — цифры не дёргаются на старте уровня */
  game.theme = themeIndexFor(level);
  if (first) {
    releaseShards();
    game.shockT = 0;
  }
  clearAppleHalves();
  game.shatterT = 0;
  game.log.angle = 0;
  /* новое бревно = новый прицел: старые нажатия и точка отсчёта поворота в мусор */
  clearThrowBuffer();
  syncLogTurn();
  game.log.scale = 0.001;
  game.intro = INTRO_DUR;
  game.thrown = 0;
  game.knife.ready = true;
  game.knife.flying = false;
  clearFlying();
  game.handT = 1;
  lastThrowAt = 0;
  game.fail = null;
  game.drop = null;
  game.clash = null;
  game.pop = null;
  game.hitStop = 0;
  game.shakeX = 0;
  game.shakeY = 0;
  game.shakeT = 0;
  game.shakeMag = 0;
  game.viewY = 0;
  game.viewV = 0;
  game.log.pulse = 0;
  game.log.pulseV = 0;
  game.log.dir = 1;
  game.log.burst = 0;
  game.log.vel = 0;
  game.log.speed = 0;
  game.log.boss = bossFor(level);
  if (typeof Replay !== "undefined" && Replay.active()) Replay.applyBoss(level);
  game.log.maxHp = maxHpFor(level);
  game.log.hp = game.log.maxHp;
  game.log.dmg = 0;
  clearLogFlash();
  game.log.plates = null;
  game.log.shellFly = null;
  game.log.leaves = null;
  game.log.kick = 0;
  /* шарик отсчитывает лопнувших с нуля: на этом уровне он снова красный */
  game.log.balloonN = 0;
  /* и качание начинается со своей фазы: у каждого захода шарика оно своё */
  game.log.balloonT = 0;
  resetHpTrail();
  game.cracks = [];
  game.needCracks = true;
  game.bakeId = (game.bakeId || 0) + 1;
  invalidateLogBakes();
  startLogSpin(level);
  layout();
  /* Спрайт бревна (и первый клин) — до первого кадра уровня, а не в бою. */
  if (typeof prebakeLevelLog === "function") {
    try { prebakeLevelLog(); } catch (err) {}
  }
  placeStartKnives(level);
  placeLogApples(level);
  /* Демка — непрерывная игра без заставок: вступление босса в ней не нужно.
     Для старых записей без длительности вступления всё же запускаем его,
     чтобы демка знала, сколько времени вычесть из таймлайна. */
  const replaySting = typeof Replay !== "undefined" && Replay.active() &&
    !(Replay.skipSting && Replay.skipSting());
  if (isBoss(level) && !replaySting) beginBossSting();
  else clearBossSting();
  clearBossVictory();
  /* Полоска HP босса (имя/тир) — до вступления, а не в кадре её появления. */
  if (isBoss(level) && typeof warmHpBarCurrent === "function") {
    try { warmHpBarCurrent(); } catch (err) {}
  }
  syncHud();
  /* новый уровень в записи демки: босс, HP и уже воткнутые ножи */
  if (typeof Analytics !== "undefined") Analytics.levelStart(level);
  if (typeof Replay !== "undefined" && Replay.active()) Replay.afterLevel(level);
}

/* Шарик лопнул, но бой не кончился: на то же место надувается следующий —
   красный, синий, зелёный. Уровень, босс и лезвие остаются те же, меняются
   только цвет латекса и запас (у шарика он всегда единица). Возвращает false,
   когда шарики кончились и уровень можно закрывать. */
function nextBalloon() {
  const log = game.log;
  const boss = log.boss;
  if (!boss || boss.id !== "balloon") return false;
  const next = (log.balloonN | 0) + 1;
  if (next >= balloonStages()) return false;
  log.balloonN = next;
  game.shatterT = 0;
  /* Второй шарик встаёт на место первого сразу, без вступления: то же место, та же
     фаза качания (log.balloonT не трогаем) — видно только смену цвета и прогиб.
     Так латекс не «надувается заново», а бой идёт без паузы: качание, за которым
     игрок следил, продолжается ровно с того места, где лопнул предыдущий */
  log.angle = balloonRockAngle(log.balloonT || 0);
  log.scale = 1;
  game.intro = 0;
  log.pulse = 0.05;
  log.pulseV = 0;
  game.thrown = 0;
  game.knife.ready = true;
  game.knife.flying = false;
  clearFlying();
  game.handT = 1;
  lastThrowAt = 0;
  game.fail = null;
  game.drop = null;
  game.clash = null;
  game.pop = null;
  game.hitStop = 0;
  log.dir = 1;
  log.burst = 0;
  log.vel = 0;
  log.speed = 0;
  log.maxHp = maxHpFor(game.level);
  log.hp = log.maxHp;
  log.dmg = 0;
  clearLogFlash();
  resetHpTrail();
  game.cracks = [];
  game.needCracks = true;
  game.bakeId = (game.bakeId || 0) + 1;
  invalidateLogBakes();
  startLogSpin(game.level);      /* тот же уровень: новый латекс и парение */
  layout();
  placeStartKnives(game.level);
  clearBossSting();              /* шарик уже был представлен: штампа нет */
  syncHud();
  return true;
}

function handRecovered(now) {
  if (!lastThrowAt) return 1;
  return clamp((now - lastThrowAt) / 1000 / HAND_DRAW, 0, 1);
}

function landY() {
  const surf = hitSurfR();
  if (game.log.boss && game.log.boss.id === "dummy" && dummyHatOn() && dummyCapHit(hitRel())) {
    return game.log.y + surf - knifeH * (16 / KNIFE_SRC_H);
  }
  const m = knifeMetrics(surf);
  return game.log.y + surf - m.embed;
}

/* ---------- очередь броска ----------
   Клик не должен пропадать: ни из-за занятой руки (нож летит), ни из-за
   подвисшего кадра (бейк спрайта, сборка мусора, тяжёлый кадр на слабом
   телефоне). Но и «вылетать из прошлой жизни» ему нельзя: пока нажатие ждёт,
   бревно поворачивается, и бросок уже не тот, каким его сделал игрок — нож
   садится в чужой лезвием, игрок теряет жизнь «на ровном месте».

   Поэтому нажатие живёт в очереди ровно до тех пор, пока бревно не ушло
   из-под прицела: смотрим не стенные часы, а ПОВОРОТ (logTurnAbs ниже).
   Порог THROW_MAX_TURN — это примерно столько, сколько бревно проходит за
   полёт ножа; столько игра и так прощает любому броску. Пока кадры стоят,
   поворот не растёт — значит нажатие, сделанное во фриз, остаётся прицельным
   и вылетает сразу, как кадр вернулся.

   Раньше тут было два грубых правила, из-за которых нажатия пропадали
   пачками (жалоба «клик завис, а всё остальное двигается»):
     · «клик старше STALE_INPUT_MS не считаем» — по event.timeStamp, который
       при фризе врёт и уезжает от performance.now();
     · «после провала кадра ввод слепой ещё 120 мс» — уже совершенно свежие
       нажатия гасились просто потому, что кадр до них был тяжёлым. */
const THROW_QUEUE_MAX = 2;        /* сколько нажатий держим про запас */
const THROW_MAX_WAIT = 400;       /* мс: дольше клик не живёт и на стоящем бревне */
const THROW_MAX_TURN = 0.52;      /* рад (~30°): дальше прицел уже не тот */
/* Наплыв нового бревна (game.intro, INTRO_DUR = 0.2 с в fx.js). Пока бревно не
   встало на место, нож не бросаем — но нажатие больше НЕ выбрасываем: клик ждёт
   в очереди и вылетает, как только бревно выросло. Порог 0.08 с — это те 60 %
   вступления, на которых easeOutBack выводит бревно на полный размер: дальше
   оно уже стоит, и бросок честный. Раньше здесь стоял отказ на всё вступление,
   и первые ~0.2 с после победы над бревном или появления босса игра не
   отзывалась на клики вовсе. */
const THROW_INTRO_OPEN = 0.08;    /* с: до этого нажатие копится, а не бросается */

const throwQueue = [];

/* Абсолютный поворот бревна без разрывов на 2π (js/frame.js: stepFrame зовёт
   раз в кадр, после update). По нему видно, «уехал» ли прицел с момента клика. */
let logTurnAbs = 0;
let logTurnPrev = 0;

function sampleLogTurn() {
  const a = game.log.angle || 0;
  let d = a - logTurnPrev;
  if (d > Math.PI || d < -Math.PI) d = ((d + Math.PI) % TWO_PI + TWO_PI) % TWO_PI - Math.PI;
  logTurnPrev = a;
  logTurnAbs += d;
}

/* Новое бревно/новый забег: угол сброшен — точку отсчёта берём заново, иначе
   первый же кадр засчитается как «бревно уехало на пол-оборота» */
function syncLogTurn() {
  logTurnPrev = game.log.angle || 0;
}

function clearThrowBuffer() {
  throwQueue.length = 0;
}

function queueThrow(at) {
  throwQueue.push({ at: at > 0 ? at : performance.now(), turn: logTurnAbs });
  while (throwQueue.length > THROW_QUEUE_MAX) throwQueue.shift();
}

/* Нажатие «остыло»: пока оно ждало, бревно ушло из-под прицела (или прошло
   слишком много времени) — бросать нельзя, это будущая потеря жизни */
function throwExpired(it, now, turn) {
  if (now - it.at > THROW_MAX_WAIT) return true;
  return Math.abs(turn - it.turn) > THROW_MAX_TURN;
}

function pumpThrowBuffer() {
  if (!throwQueue.length) return;
  if (GamePause.on || state !== "play" || !game.knife.ready || game.log.hp <= 0) {
    throwQueue.length = 0;
    return;
  }
  const now = performance.now();
  while (throwQueue.length) {
    const it = throwQueue[0];
    if (throwExpired(it, now, logTurnAbs)) {
      throwQueue.shift();
      continue;
    }
    /* бревно ещё наплывает: нажатие держим на следующие кадры, но не теряем.
       Проверка «остыло» выше при этом работает как обычно — клик, сделанный
       посреди долгого вступления босса, всё равно не выстрелит вслепую */
    if (game.intro > THROW_INTRO_OPEN) return;
    /* рука занята (нож в полёте): нажатие ждёт следующего кадра */
    if (game.flying.length) return;
    throwQueue.shift();
    launchKnife(now);
    return;
  }
}

function launchKnife(now) {
  game.handT = handRecovered(now);
  const y = handY();
  lastThrowAt = now;
  game.handT = 0;
  const shot = takeFly();
  shot.x = W * 0.5;
  shot.y = y;
  shot.fromY = y;
  shot.t = 0;
  shot.handle = false;
  shot.dmg = knifeHitDamage();
  shot.born = now;
  /* Рандомизатор ножей (js/knife-book.js: knifeRndNext): брошенный нож летит со
     своим скином — снимок скина держим на самом броске (js/frame.js:
     drawFlyKnife), — а в руку сразу встаёт новый случайный нож из открытых */
  shot.skin = save.knife;
  /* запись броска: момент, угол бревна, скин и задержка нажатия */
  if (typeof Analytics !== "undefined") Analytics.launch(now, shot.skin);
  if (typeof knifeRndNext === "function") knifeRndNext();
  game.flying.push(shot);
  game.thrown++;
  statThrow();
  deferSfx(() => Sfx.throw());
}

function throwKnife(e) {
  if (state !== "play" || !game.knife.ready) return;
  /* пауза: нож не бросаем и не придерживаем — в паузе ввод не копится */
  if (GamePause.on) return;
  if (game.log.hp <= 0) return;
  /* Вступление (старт уровня, «БОСС»): бревно ещё наплывает. Нажатие не теряем —
     оно встаёт в очередь, а бросает его pumpThrowBuffer, как только бревно
     выросло (THROW_INTRO_OPEN). Бросок в невыросшее бревно игроку не засчитать,
     но и пропавший клик — не дело. */
  if (typeof Analytics !== "undefined") Analytics.press();
  queueThrow(performance.now());
  pumpThrowBuffer();
}

function handleHit() {
  const k = game.flying[0] || game.knife;
  return handleHitAt(k.y) || handleHitAt(k.y + 14);
}

/* ---------- яблоки на бревне ----------
   Раскладку выдаёт уровень (js/progress.js: appleRelsAt): яблоки на кромке как
   ножи, без угла стартового ножа. Ставим после placeStartKnives (armFirstLog /
   startLevel), крутятся с бревном (drawLogApples). */
function clearLogApples() {
  if (game.logApples) game.logApples.length = 0;
}

function placeLogApples(level) {
  clearLogApples();
  if (!game.logApples) game.logApples = [];
  /* Углы ножей — уже после случайного off в placeStartKnives. Без них яблоки
     попадали «в нож»: раскладка смотрела сырые углы, а ножи были сдвинуты. */
  const knives = [];
  const stuck = game.stuck;
  if (stuck) for (let i = 0; i < stuck.length; i++) knives.push(stuck[i].rel);
  const list = appleRelsAt(level, knives);
  for (let i = 0; i < list.length; i++) game.logApples.push(list[i]);
}

/* Яблоко попалось под нож. За одно яблоко игрок получает два (APPLE_VALUE) —
   так просил заказчик; «x2 яблоки» из магазина удваивает и это (appleGain).
   Из-под кромки летят щепки кожицы и лист. Полёта яблок к счётчику больше нет:
   мелкие яблочки, летящие в HUD, только засоряли кадр — начисление видно по
   цифре, а сам удар должен читаться разлётом половин и соком.

   Само яблоко не пропадает: оно распадается на две половины и они разлетаются
   от среза (js/fx.js: spawnAppleHalves). Место берём у самого яблока, а не
   у точки удара ножа, — половины встают ровно туда, где висело яблоко.

   quiet — для ножа, снявшего сразу несколько яблок: половинки, щепки и сок
   рисуются у каждого, а хруст один на удар (см. resolveThrow ниже). */
function takeLogApple(a, hx, hy, quiet) {
  a.taken = true;
  const kind = a.kind || "plain";
  const pose = logApplePose(a);
  spawnAppleHalves(pose.x, pose.y, pose.rot, pose.d, kind);
  /* золотое даёт ×5, алмазное ×10 от обычного (APPLE_KIND_MUL); «x2 яблоки»
     из магазина удваивает уже это число (appleGain) */
  const gain = appleGain(APPLE_VALUE * (APPLE_KIND_MUL[kind] || 1));
  game.apples += gain;
  statApples(gain);
  if (typeof Analytics !== "undefined") Analytics.apple(kind, gain, a.rel, a.rr);
  persistSoon();
  syncHud();
  const chips = kind === "gold" ? APPLE_CHIPS_GOLD : kind === "diamond" ? APPLE_CHIPS_DIAMOND : APPLE_CHIPS;
  burst(hx, hy, 7, {
    a: Math.PI / 2, spread: 1.3, smin: 120, smax: 380,
    rmin: 1.4, rmax: 3,
    colors: chips, g: 460, kind: "chip",
    jx: 12, jy: 8, lmin: 0.26, lmax: 0.56
  });
  burst(hx, hy, 3, {
    spread: TWO_PI, smin: 60, smax: 220,
    rmin: 2, rmax: 4,
    colors: APPLE_LEAF, g: 320, kind: "spark",
    jx: 8, jy: 6, lmin: 0.2, lmax: 0.44
  });
  if (!quiet) deferSfx(() => Sfx.apple());
}

function stickKnife(hit) {
  statStick();
  /* РЕКОРД: сколько ножей воткнуто за этот забег. Считаем в том же кадре, когда
     нож сел в кромку, и сразу сверяем с лучшим результатом (game.bestBase —
     рекорд ДО забега). Первый забег рекорда не даёт: game.bestKnown = false.
     В save.best лежит лучший счёт за всё время — им и живёт колонка «РЕКОРД» */
  game.recordNum = (game.recordNum | 0) + 1;
  if (game.bestKnown && game.recordNum > (game.bestBase | 0)) game.bestBeaten = true;
  if (!(typeof window !== "undefined" && window.__BH_REPLAY_ACTIVE)) {
    if (game.recordNum > (save.best | 0)) {
      save.best = game.recordNum;
      persistSoon();
    }
  }
  syncHud();
  const dmg = Math.max(1, (hit && hit.dmg) | 0 || knifeDamage());
  const rel = hitRel();
  const surf = hitSurfR();
  const sk = takeStuck();
  sk.rel = rel;
  sk.player = true;
  /* скин, которым нож был брошен: с рандомизатором нож в руке уже другой,
     а воткнутый нож должен остаться тем, что летел (js/draw-stuck.js) */
  sk.skin = (hit && hit.skin) || save.knife;
  sk.rad = surf / Math.max(1, game.log.r);
  sk.sink = 14;
  sk.sinkV = -80;
  sk.flash = 0.2;
  sk.kick = 0;
  game.stuck.push(sk);
  hitLogFlash(0.62);
  const iron = !!(game.log.boss && game.log.boss.id === "aegis");
  const fanBoss = !!(game.log.boss && game.log.boss.id === "fan");
  const helmBoss = !!(game.log.boss && game.log.boss.id === "helm");
  if (fanBoss && (game.log.fanStage || FAN_STAGE_1) >= FAN_STAGE_2) hitLogFlash(0.72);
  if (game.log.hp - dmg > 0) {
    game.log.pulse = Math.min(iron ? 0.05 : 0.08, (game.log.pulse || 0) + (iron ? 0.032 : 0.05));
    /* щит не трясёт кадр: железо гасит удар в себя, а тряска на каждом ноже
       только сбивала прицел (у кокоса и болвана она осталась — там она по делу).
       Толчка картинки щиту тоже нет, как и штурвалу: у щита свой отзыв — щелчок,
       вспышка и толчок самого бревна (pulse выше) */
    if (!iron && !helmBoss) punchView(9);
    buzz(iron ? [7, 16, 9] : 8);
  }
  const coco = !!(game.log.boss && game.log.boss.id === "coconut");
  if (coco) coconutRecoil(true);
  /* у босса — свой звук материала; у бревна — прежний деревянный stick.
     pick() (монетный «дзынь») сюда не зовём — он только у яблок и в магазине.
     Добивающий нож — только смерть: иначе короткий stick перекрывает crack */
  const stickId = game.log.boss && game.log.boss.id;
  const killing = game.log.hp - dmg <= 0;
  deferSfx(() => {
    if (stickId) {
      if (!killing) Sfx.bossStick(stickId);
    } else {
      Sfx.stick();
    }
  });
  const log = game.log;
  const hx = log.x;
  /* щепки летят из-под нижней кромки — нож входит снизу */
  const hy = log.y + surf;
  const th = themeFor(game.level);
  const boss = game.log.boss;
  const chips = boss ? boss.chips : th.chips;
  const crumb = boss && boss.id === "donut";
  const helm = boss && boss.id === "helm";
  burst(hx, hy, crumb ? 9 : 7, {
    a: Math.PI / 2, spread: 1.45, smin: 160, smax: 460,
    rmin: crumb ? 2.6 : 1.5, rmax: crumb ? 5.4 : 3.2,
    colors: crumb ? DONUT_SPRINKLES : chips,
    kind: crumb ? "sprinkle" : "chip",
    g: crumb ? 640 : 420,
    jx: 16, jy: 12,
    lmin: 0.28, lmax: 0.62
  });
  if (coco) {
    /* нож вошёл в мякоть: из-под кромки летят белые волокна и стружка скорлупы */
    burst(hx, hy, 7, {
      spread: TWO_PI, smin: 160, smax: 480,
      rmin: 1.1, rmax: 2.3,
      colors: ["#fffdf4", "#f3e6c8", "#8a5a34"],
      g: 380, kind: "fiber",
      jx: 12, jy: 8,
      lmin: 0.2, lmax: 0.46
    });
  }
  if (helm) {
    burst(log.x, log.y, 5, {
      spread: TWO_PI, smin: 40, smax: 160,
      rmin: 1.4, rmax: 2.6,
      colors: HELM_WATER,
      g: 720, kind: "drop",
      jx: 10, jy: 8,
      lmin: 0.22, lmax: 0.42
    });
  }
  if (crumb) {
    burst(hx, hy, 6, {
      a: Math.PI / 2, spread: 1.05, smin: 30, smax: 170,
      rmin: 2.4, rmax: 5.2,
      colors: DONUT_GLAZE,
      g: 980, kind: "glaze",
      jx: 10, jy: 6,
      lmin: 0.5, lmax: 0.95
    });
  }
  burst(hx, hy, 3, {
    a: Math.PI / 2, spread: 1.1, smin: 90, smax: 240,
    rmin: 1.1, rmax: 2,
    colors: (colorPair[0] = chips[0], colorPair[1] = chips[1] || chips[0], colorPair),
    g: 360, kind: "spark",
    jx: 12, jy: 10,
    lmin: 0.16, lmax: 0.34
  });
  if (boss && boss.id === "aegis") {
    burst(hx, hy, 8, {
      spread: TWO_PI, smin: 260, smax: 720,
      rmin: 1, rmax: 2.1,
      colors: SPARK_IRON,
      g: 40, kind: "spark",
      jx: 10, jy: 8,
      lmin: 0.1, lmax: 0.26
    });
  }
  if (boss && boss.id === "valve") {
    burst(hx, hy, 6, {
      a: Math.PI / 2, spread: 1.35, smin: 180, smax: 520,
      rmin: 0.7, rmax: 1.7,
      colors: SPARK_IRON,
      g: 70, kind: "spark",
      jx: 8, jy: 6,
      lmin: 0.08, lmax: 0.2
    });
  }
  if (boss && boss.id === "fan" && (log.fanStage || FAN_STAGE_1) >= FAN_STAGE_2) {
    const hot = (log.fanStage || FAN_STAGE_1) >= FAN_STAGE_3;
    burst(hx, hy, hot ? 4 : 2, {
      a: Math.PI / 2, spread: 1.05, smin: 120, smax: 340,
      rmin: 0.7, rmax: 1.6,
      colors: hot ? FAN_HEAT : FAN_WARM,
      g: 50, kind: "spark",
      jx: 8, jy: 6,
      lmin: 0.08, lmax: 0.2
    });
    punchView(hot ? 4 : 2);
  }
  if (boss && (boss.id === "tomato" || boss.id === "heart")) {
    burst(hx, hy, 4, {
      a: Math.PI / 2, spread: 1.15, smin: 120, smax: 320,
      rmin: 1.4, rmax: 2.8,
      colors: boss.chips,
      g: 520, kind: "chip",
      jx: 14, jy: 10,
      lmin: 0.24, lmax: 0.52
    });
  }
  /* Яблоко под лезвием снимает resolveThrow — ДО всех проверок на блок (рукоять,
     стрела, шапка), поэтому здесь его больше нет: иначе один нож мог бы снять
     два соседних яблока сразу. */

  const maxHp = Math.max(1, game.log.maxHp || LOG_HP);
  const prevFrac = clamp(game.log.hp / maxHp, 0, 1);
  game.log.hp = Math.max(0, game.log.hp - dmg);
  game.log.dmg = game.log.maxHp - game.log.hp;
  if (typeof Analytics !== "undefined") {
    Analytics.result("stick", rel, { hpAfter: game.log.hp, dmg: dmg });
  }
  game.log.hpTrail = Math.max(game.log.hpTrail || prevFrac, prevFrac);
  game.log.hpTrailHold = 0.24;
  game.log.hpNip = 1;
  /* РЕВЕРС: любой нож в корпус переворачивает направление вращения. Скорость та
     же, меняется только знак, поэтому диск разворачивается мгновенно — и это
     единственный босс, которого можно «крутить» самому, бросая ножи */
  if (game.log.boss && game.log.boss.id === "reverse" && game.log.hp > 0) {
    game.log.dir = -(game.log.dir || 1);
  }
  adoptAhead(game.log.dmg);
  syncHud();
  bakeSkip = 1;
  if (game.log.hp <= 0) {
    shatterLog();
  }
}

function angInSpan(rel, a0, span) {
  const start = ((a0 % TWO_PI) + TWO_PI) % TWO_PI;
  let d = ((rel % TWO_PI) + TWO_PI) % TWO_PI - start;
  if (d < 0) d += TWO_PI;
  return d < span;
}

/* ---------- победа над бревном/боссом ----------
   Счёт справа от победы больше не зависит: он считает НОЖИ (js/flow.js:
   stickKnife), поэтому здесь только обновляем HUD — уровни в рекорд не идут. */
function levelCleared() {
  /* уровень закрыт: если это был редкий/легендарный/тайный босс — охота за
     редкостью закончена, удвоенный шанс больше не нужен (js/progress.js) */
  if (typeof bossRareWin === "function") bossRareWin();
  syncHud();
}

function shatterLog() {
  state = "shatter";
  game.knife.ready = false;
  game.knife.flying = false;
  clearFlying();
  game.shatterT = 0;
  game.shockT = 1;
  const log = game.log;
  game.shockX = log.x;
  game.shockY = log.y;
  game.shockR = log.r;
  punchView(32);
  buzz(16);
  game.flash = 0.52;
  game.flashCol = "255,255,255";
  game.flashK = 0;
  if (log.boss && log.boss.id === "donut") {
    game.flash = 0.8;
    game.flashCol = "255, 64, 138";
    game.flashK = 0.5;
  }
  if (log.boss && log.boss.id === "helm") {
    game.flashCol = "186, 220, 232";
    game.uiDip = 22;
    game.uiDipV = 160;
  }
  if (log.boss && log.boss.id === "lifebelt") {
    game.flash = 0.34;
    game.flashCol = "255, 228, 232";
  }
  if (log.boss && log.boss.id === "valve") {
    game.flash = 0.42;
    game.flashCol = "214, 220, 226";
  }
  if (log.boss && log.boss.id === "fan") {
    game.flash = 0.38;
    game.flashCol = "255, 168, 96";
    game.flashK = 0.36;
  }
  if (log.boss && log.boss.id === "balloon") {
    /* хлопок: короткая белая вспышка и лёгкий толчок интерфейса — шарик рвётся
       разом, а не разваливается на сектора */
    game.flash = 0.44;
    game.flashCol = "255, 240, 244";
    game.uiDip = 14;
    game.uiDipV = 120;
  }
  if (log.boss && log.boss.id === "tomato") {
    /* сочный хлопок: красная вспышка, помидор рвётся на дольки */
    game.flash = 0.58;
    game.flashCol = "255, 96, 64";
    game.flashK = 0.28;
    game.uiDip = 16;
    game.uiDipV = 140;
  }
  if (game.needCracks || !game.cracks.length) {
    game.cracks = generateCracks(1 + Math.floor(rand(1, 99991)), log.boss && log.boss.id);
    game.needCracks = false;
  }
  /* кокос разламывается надвое: у него своя скорлупа, и клинья берём её же */
  if (log.boss && log.boss.id === "coconut") game.cracks = coconutHalves();
  /* фото-помидор в бою без трещин — иначе mains пустой и он просто исчезает.
     На смерть кладём радиальные разрезы: дольки летят как лопающийся плод */
  if (log.boss && log.boss.id === "tomato" && !(game.cracks && game.cracks.length)) {
    game.cracks = generateTomatoPopCracks(1 + Math.floor(rand(1, 99991)));
  }
  const stuck = game.stuck;
  const cracks = game.cracks;
  const mains = mainsScratch;
  mains.length = 0;
  for (let i = 0; i < cracks.length; i++) {
    if (cracks[i].kind === "main") mains.push(cracks[i]);
  }
  mains.sort((a, b) => a.ang - b.ang);
  const level = game.level;
  const th = themeFor(level);
  /* Только записанный босс. Раньше здесь был запасной bossFor(level): если
     уровень числился боссовым, а на экране стояло обычное бревно, после его
     разлома запускалась сцена «БОСС ПОВЕРЖЕН». */
  const boss = log.boss || (isBoss(level) && !(typeof window !== "undefined" && window.__BH_REPLAY_ACTIVE)
    ? bossFor(level)
    : null);
  const pal = boss || th;
  /* Шарик лопается, а не раскалывается: клиньев и трещин у него нет, зато есть
     лоскуты латекса (ниже). Пока шариков не кончилось, уровень не закрывается:
     опыт и нож-награда выдаются только за последний хлопок (nextBalloon). */
  const balloon = !!boss && boss.id === "balloon";
  const popMore = balloon && (log.balloonN | 0) < balloonStages() - 1;
  /* очко за уровень — здесь, в кадре победы. Шарик лопается трижды: очко
     даёт только последний хлопок (popMore) */
  if (!popMore) levelCleared();
  if (balloon) mains.length = 0;
  const themeIdx = game.theme;
  const omega = log.vel * 1000;
  const hx = log.x;
  const hy = log.y + log.r * 0.96;
  const ca = Math.cos(log.angle), sa = Math.sin(log.angle);
  releaseShards();
  const n = mains.length;
  for (let i = 0; i < n; i++) {
    const c0 = mains[i];
    const c1 = mains[(i + 1) % n];
    let a0 = c0.ang, a1 = c1.ang;
    if (a1 <= a0) a1 += TWO_PI;
    const span = a1 - a0;
    const mid = a0 + span * 0.5;
    const world = mid + log.angle;
    const s = takePool(shardPool);
    let knives = s.knives;
    if (!knives) knives = s.knives = [];
    let kn = 0;
    for (let ki = 0; ki < stuck.length; ki++) {
      if (!angInSpan(stuck[ki].rel, a0, span)) continue;
      let slot = knives[kn];
      if (!slot) {
        slot = { rel: 0, player: false, rad: 1, sink: 0, sinkV: 0, flash: 0, kick: 0 };
        knives[kn] = slot;
      }
      const src = stuck[ki];
      slot.rel = src.rel;
      slot.player = !!src.player;
      /* Скин едет вместе с ножом. Раньше он не копировался, и в разлетающихся
         клиньях все ножи рисовались текущим save.knife (js/draw-stuck.js
         подставляет его для player-ножа): с рандомизатором, который меняет нож
         после каждого броска, они все становились одинаковыми. У застрявшего
         ножа свой скин лежит с момента попадания (js/flow.js: stickKnife). */
      slot.skin = src.skin || (src.player ? save.knife : "classic");
      slot.rad = src.rad > 0 ? src.rad : 1;
      slot.sink = src.sink || 0;
      slot.sinkV = 0;
      slot.flash = 0;
      slot.kick = src.kick || 0;
      kn++;
    }
    knives.length = kn;
    let d;
    const holeR = boss ? bossRingHole(boss.id, log.r) : 0;
    if (holeR > 0) {
      const r2 = log.r * log.r;
      const h2 = holeR * holeR;
      d = (2 / 3) * (r2 * log.r - h2 * holeR) / (r2 - h2) * (Math.sin(span * 0.5) / Math.max(0.18, span * 0.5));
    } else {
      d = (2 / 3) * log.r * (Math.sin(span * 0.5) / Math.max(0.18, span * 0.5));
    }
    const cx = Math.cos(mid) * d;
    const cy = Math.sin(mid) * d;
    const x = log.x + Math.cos(world) * d;
    const y = log.y + Math.sin(world) * d;
    const away = Math.abs(angNorm(world - Math.PI / 2)) / Math.PI;
    const rad = 640 + (1 - away) * 400 + rand(-40, 100);
    let ix = x - hx, iy = y - hy;
    const il = Math.hypot(ix, iy) || 1;
    ix /= il; iy /= il;
    const impact = 320 + (1 - away) * 500;
    s.kind = "wedge";
    s.c0 = c0; s.c1 = c1; s.r = log.r;
    s.cx = cx; s.cy = cy; s.x = x; s.y = y;
    s.vx = Math.cos(world) * rad + ix * impact - Math.sin(world) * omega * d + rand(-90, 90);
    s.vy = Math.sin(world) * rad * 0.7 + iy * impact + Math.cos(world) * omega * d + rand(-80, 100);
    s.rot = log.angle;
    s.vr = omega + rand(-12, 12) + (Math.random() < 0.5 ? -1 : 1) * (5.5 + (1 - away) * 8);
    s.knives = knives; s.dmg = log.dmg; s.maxHp = log.maxHp; s.boss = boss;
    s.alpha = 1; s.delay = 0.006 + away * 0.036; s.age = 0; s.scale = 1;
    s.cracks = cracks; s.theme = themeIdx; s.level = level; s.atlas = null;
    s.sprite = null; s.ow = 0; s.oh = 0;
    s.wedgeClip = null;
    s.wedgePath = null;
    s.split0 = null;
    s.split1 = null;
    game.shards.push(s);
  }
  if (boss && boss.id === "coconut") {
    for (let i = 0; i < game.shards.length; i++) {
      const sh = game.shards[i];
      if (sh.kind !== "wedge") continue;
      sh.vx *= 1.45;
      sh.vy = sh.vy * 1.2 - 40;
    }
  }
  if (boss && boss.id === "valve") {
    for (let i = 0; i < game.shards.length; i++) {
      const sh = game.shards[i];
      if (sh.kind !== "wedge") continue;
      sh.vx *= 0.74;
      sh.vy = sh.vy * 0.7 + 24;
      sh.vr *= 0.6;
    }
  }
  if (boss && boss.id === "tomato") {
    /* дольки летят сразу — без ступенчатой задержки */
    for (let i = 0; i < game.shards.length; i++) {
      const sh = game.shards[i];
      if (sh.kind !== "wedge") continue;
      sh.vx *= 1.35;
      sh.vy = sh.vy * 1.15 - 120;
      sh.vr *= 1.25;
      sh.delay = 0;
    }
  }
  for (const c of mains) {
    const count = boss && boss.id === "donut"
      ? (phone ? 3 : 6)
      : (phone ? (c.primary ? 2 : 1) : (c.primary ? 3 : 2));
    for (let k = 0; k < count; k++) {
      const t = 0.3 + k * 0.2 + rand(0, 0.1);
      const idx = Math.min(c.pts.length - 1, Math.max(1, Math.floor(t * (c.pts.length - 1))));
      const p = c.pts[idx];
      let px = p.x, py = p.y;
      if (boss && (boss.id === "donut" || boss.id === "lifebelt")) {
        const rad = Math.hypot(px, py);
        const inner = (boss.id === "lifebelt" ? LIFEBELT_HOLE : DONUT_HOLE) + 0.05;
        if (rad < inner || rad > 0.96) {
          const ang = rad > 0.02 ? Math.atan2(py, px) : c.ang;
          const u = inner + 0.08 + hash(541, k) * (0.9 - inner);
          px = Math.cos(ang) * u;
          py = Math.sin(ang) * u;
        }
      }
      const lx = px * log.r, ly = py * log.r;
      const x = log.x + lx * ca - ly * sa;
      const y = log.y + lx * sa + ly * ca;
      const a = Math.atan2(y - log.y, x - log.x);
      const sp = rand(440, 1020);
      const s = takePool(shardPool);
      s.kind = "chunk";
      s.x = x; s.y = y;
      s.vx = Math.cos(a) * sp + rand(-130, 130);
      s.vy = Math.sin(a) * sp * 0.82 + rand(-90, 210);
      s.rot = log.angle + c.ang + rand(-0.5, 0.5);
      s.vr = rand(-20, 20);
      s.w = rand(8, 21); s.h = rand(3.4, 8.2);
      s.delay = rand(0, 0.028); s.age = 0; s.alpha = 1; s.scale = 1;
      s.fill = pal.fill; s.dark = pal.dark; s.outline = pal.outline;
      if (boss && boss.id === "donut") {
        s.kind = "sprinkle";
        s.fill = DONUT_SPRINKLES[(hash(530, k + c.ang) * DONUT_SPRINKLES.length) | 0];
        s.w = rand(9, 18);
        s.h = rand(3.2, 5.6);
      }
      s.sprite = null; s.atlas = null;
      if (s.knives) s.knives.length = 0;
      game.shards.push(s);
    }
  }
  const pithN = boss && boss.id === "donut" ? (phone ? 8 : 20) : (phone ? 2 : 5);
  for (let i = 0; i < pithN; i++) {
    const a = rand(0, TWO_PI);
    const sp = rand(240, 680);
    const s = takePool(shardPool);
    const donut = boss && boss.id === "donut";
    const belt = boss && boss.id === "lifebelt";
    const mid = donut ? log.r * (DONUT_HOLE + 1) * 0.5 : belt ? log.r * (LIFEBELT_HOLE + 1) * 0.5 : 5;
    s.kind = donut ? "sprinkle" : "pith";
    s.x = log.x + Math.cos(a) * mid;
    s.y = log.y + Math.sin(a) * mid;
    s.vx = Math.cos(a) * sp;
    s.vy = Math.sin(a) * sp * 0.68 + rand(-50, 130);
    s.rot = rand(0, TWO_PI); s.vr = rand(-16, 16);
    s.w = donut ? rand(8, 15) : rand(7, 14);
    s.h = donut ? rand(3.2, 5.2) : 0;
    s.delay = rand(0, 0.018); s.age = 0; s.alpha = 1; s.scale = 1;
    s.fill = donut ? DONUT_SPRINKLES[i % DONUT_SPRINKLES.length] : belt ? (i % 2 ? "#e1062c" : "#f7f4f2") : pal.pith; s.outline = boss ? pal.outline : th.ring;
    s.sprite = null; s.atlas = null;
    if (s.knives) s.knives.length = 0;
    game.shards.push(s);
  }
  if (boss && boss.id === "tomato") {
    /* мякоть и семечки — поверх долек, чтобы лопание читалось сочным */
    const pulp = phone ? 10 : 22;
    const juice = ["#d44532", "#f07a48", "#8a1e16", "#f2c878", "#e85a3a"];
    for (let i = 0; i < pulp; i++) {
      const a = (i / pulp) * TWO_PI + rand(-0.2, 0.2);
      const dist = log.r * rand(0.25, 0.92);
      const sp = rand(280, 780);
      const s = takePool(shardPool);
      s.kind = "chunk";
      s.x = log.x + Math.cos(a + log.angle) * dist;
      s.y = log.y + Math.sin(a + log.angle) * dist;
      s.vx = Math.cos(a + log.angle) * sp + rand(-90, 90);
      s.vy = Math.sin(a + log.angle) * sp * 0.78 + rand(-160, 60);
      s.rot = a + rand(-0.5, 0.5);
      s.vr = rand(-22, 22);
      s.w = rand(12, 30);
      s.h = rand(5, 14);
      s.delay = 0;
      s.age = 0;
      s.alpha = 1;
      s.scale = 1;
      s.fill = juice[i % juice.length];
      s.dark = "#6a1810";
      s.outline = "#5a1810";
      s.sprite = null;
      s.atlas = null;
      if (s.knives) s.knives.length = 0;
      game.shards.push(s);
    }
    const seeds = phone ? 6 : 14;
    for (let i = 0; i < seeds; i++) {
      const a = rand(0, TWO_PI);
      const sp = rand(200, 640);
      const s = takePool(shardPool);
      s.kind = "pith";
      s.x = log.x + Math.cos(a) * log.r * rand(0.1, 0.55);
      s.y = log.y + Math.sin(a) * log.r * rand(0.1, 0.55);
      s.vx = Math.cos(a) * sp + rand(-60, 60);
      s.vy = Math.sin(a) * sp * 0.7 + rand(-40, 120);
      s.rot = rand(0, TWO_PI);
      s.vr = rand(-18, 18);
      s.w = rand(4, 8);
      s.h = 0;
      s.delay = 0;
      s.age = 0;
      s.alpha = 1;
      s.scale = 1;
      s.fill = i % 2 ? "#f2c878" : "#fff0c8";
      s.outline = "#8a5a20";
      s.sprite = null;
      s.atlas = null;
      if (s.knives) s.knives.length = 0;
      game.shards.push(s);
    }
    burst(log.x, log.y, phone ? 18 : 42, {
      spread: TWO_PI, smin: 240, smax: 920,
      rmin: 2, rmax: 5.5,
      colors: juice,
      g: 520, kind: "chip",
      lmin: 0.35, lmax: 0.8
    });
    burst(log.x, log.y, phone ? 8 : 16, {
      spread: TWO_PI, smin: 80, smax: 360,
      rmin: 16, rmax: 36,
      colors: ["#ffc8a0", "#f07a48", "#d44532"],
      g: 40, kind: "dust",
      lmin: 0.28, lmax: 0.55
    });
  }
  if (balloon) {
    /* латекс лопается: куски рвутся от кромки и летят наружу, узел с ниткой
       падает вниз, а следом расходится струя воздуха. Кромка снимается вместе с
       креном (log.angle): шарик рвётся там, где он сейчас, а не «ровно стоя» */
    const skin = balloonSkin(log.balloonN | 0);
    const spin = log.angle;
    const cs = Math.cos(spin);
    const sn = Math.sin(spin);
    const scraps = phone ? 12 : 24;
    for (let i = 0; i < scraps; i++) {
      const a = (i / scraps) * TWO_PI + rand(-0.16, 0.16);
      const wa = a + spin;
      const dist = log.r * balloonRadiusMul(a) * rand(0.7, 0.98);
      const sp = rand(240, 620);
      const s = takePool(shardPool);
      s.kind = "chunk";
      s.x = log.x + Math.cos(wa) * dist;
      s.y = log.y + Math.sin(wa) * dist;
      s.vx = Math.cos(wa) * sp + rand(-70, 70);
      s.vy = Math.sin(wa) * sp * 0.72 + rand(-140, 40);
      s.rot = wa + rand(-0.4, 0.4);
      s.vr = rand(-26, 26);
      s.w = rand(10, 26);
      s.h = rand(3.4, 9);
      s.delay = rand(0, 0.03);
      s.age = 0;
      s.alpha = 1;
      s.scale = 1;
      s.fill = i % 3 === 0 ? skin.body[0] : i % 3 === 1 ? skin.body[2] : skin.chips[2];
      s.dark = skin.body[3];
      s.outline = skin.outline;
      s.sprite = null;
      s.atlas = null;
      if (s.knives) s.knives.length = 0;
      game.shards.push(s);
    }
    for (let i = 0; i < (phone ? 1 : 3); i++) {
      const s = takePool(shardPool);
      s.kind = "pith";
      /* узел с ниткой снимается с шейки: тоже с учётом крена */
      const kx = rand(-log.r * 0.1, log.r * 0.1);
      const ky = log.r * BALLOON_NECK_TIP;
      s.x = log.x + kx * cs - ky * sn;
      s.y = log.y + kx * sn + ky * cs;
      s.vx = rand(-110, 110);
      s.vy = rand(60, 230);
      s.rot = rand(0, TWO_PI);
      s.vr = rand(-14, 14);
      s.w = rand(5, 10);
      s.h = 0;
      s.delay = 0;
      s.age = 0;
      s.alpha = 1;
      s.scale = 1;
      s.fill = skin.knot[1];
      s.outline = skin.outline;
      s.sprite = null;
      s.atlas = null;
      if (s.knives) s.knives.length = 0;
      game.shards.push(s);
    }
    burst(log.x, log.y, phone ? 14 : 30, {
      spread: TWO_PI, smin: 200, smax: 820,
      rmin: 1.6, rmax: 4.6,
      colors: skin.chips,
      g: 420, kind: "chip",
      lmin: 0.3, lmax: 0.72
    });
    burst(log.x, log.y, phone ? 8 : 16, {
      spread: TWO_PI, smin: 60, smax: 320,
      rmin: 14, rmax: 34,
      colors: ["#eef2f6", "#dfe4ea", skin.chips[2]],
      g: 20, kind: "dust",
      lmin: 0.24, lmax: 0.5
    });
  }
  if (boss && boss.id === "helm") {
    const s = takePool(shardPool);
    s.kind = "anchor";
    s.x = log.x;
    s.y = log.y;
    s.vx = rand(-28, 28);
    s.vy = 80;
    s.rot = log.angle + Math.PI;
    s.vr = rand(-1.4, 1.4);
    s.w = log.r * 0.42;
    s.h = log.r * 0.62;
    s.delay = 0;
    s.age = 0;
    s.alpha = 1;
    s.scale = 1;
    s.fill = "#9aa3ad";
    s.outline = "#1a1e24";
    s.sprite = null;
    s.atlas = null;
    if (s.knives) s.knives.length = 0;
    game.shards.push(s);
    burst(log.x, log.y, phone ? 10 : 18, {
      spread: TWO_PI, smin: 80, smax: 340,
      rmin: 1.8, rmax: 4.2,
      colors: HELM_WATER,
      g: 640, kind: "drop",
      lmin: 0.35, lmax: 0.7
    });
  }
  /* шапка летит только если она ещё на голове: снесённая раньше уже улетела */
  if (boss && boss.id === "dummy" && !game.log.hatBroken) {
    const s = takePool(shardPool);
    const ang = DUMMY_CAP_ANG + log.angle;
    const dist = log.r * DUMMY_DOME_C;
    s.kind = "cap";
    s.x = log.x + Math.cos(ang) * dist;
    s.y = log.y + Math.sin(ang) * dist;
    s.vx = Math.cos(ang) * rand(160, 320);
    s.vy = Math.sin(ang) * rand(80, 220) - 40;
    s.rot = log.angle;
    s.vr = rand(-3.2, 3.2);
    s.w = log.r;
    s.h = 0;
    s.delay = 0;
    s.age = 0;
    s.alpha = 1;
    s.scale = 1;
    s.fill = "#8a929a";
    s.outline = "#1a2026";
    s.sprite = null;
    s.atlas = null;
    if (s.knives) s.knives.length = 0;
    game.shards.push(s);
    burst(s.x, s.y, phone ? 8 : 14, {
      spread: 1.4, a: ang, smin: 180, smax: 640,
      rmin: 1, rmax: 2.2,
      colors: SPARK_IRON,
      g: 40, kind: "spark",
      lmin: 0.16, lmax: 0.36
    });
  }
  if (boss && boss.id === "valve") {
    const bits = phone ? 6 : 10;
    for (let i = 0; i < bits; i++) {
      const spoke = i % 6;
      const a = -Math.PI / 2 + spoke * (TWO_PI / 6) + log.angle;
      const along = i % 3 === 2 ? 0.12 : 0.42 + (i % 3) * 0.24;
      const dist = log.r * along;
      const s = takePool(shardPool);
      const ring = i % 3 === 1;
      const hubBit = i % 3 === 2;
      s.kind = hubBit ? "pith" : "chunk";
      s.x = log.x + Math.cos(a) * dist;
      s.y = log.y + Math.sin(a) * dist;
      const sp = rand(120, hubBit ? 260 : 420);
      s.vx = Math.cos(a) * sp + rand(-36, 36);
      s.vy = Math.sin(a) * sp * 0.72 + rand(-24, 70);
      s.rot = ring ? a + Math.PI / 2 : a;
      s.vr = rand(-4.5, 4.5);
      s.w = hubBit ? rand(6, 11) : ring ? rand(11, 20) : rand(16, 32);
      s.h = hubBit ? 0 : ring ? rand(5.5, 10) : rand(4.2, 7.4);
      s.delay = rand(0, 0.02);
      s.age = 0;
      s.alpha = 1;
      s.scale = 1;
      s.fill = hubBit ? "#e4eaef" : ring ? "#9aa4ae" : (i % 2 ? "#d5dde4" : "#5c666e");
      s.dark = "#1c2228";
      s.outline = "#101418";
      s.sprite = null;
      s.atlas = null;
      if (s.knives) s.knives.length = 0;
      game.shards.push(s);
    }
    burst(log.x, log.y, phone ? 8 : 14, {
      spread: TWO_PI, smin: 200, smax: 560,
      rmin: 0.7, rmax: 1.6,
      colors: SPARK_IRON,
      g: 50, kind: "spark",
      lmin: 0.1, lmax: 0.28
    });
  }
  if (boss && boss.id === "fan") {
    const bits = phone ? 7 : 12;
    const fanAng = log.fanAng || 0;
    for (let i = 0; i < bits; i++) {
      const blade = i % FAN_N;
      const a = fanAng + blade * (TWO_PI / FAN_N) + log.angle;
      const along = i < FAN_N ? 0.28 : 0.55 + (i % 3) * 0.12;
      const dist = log.r * along;
      const s = takePool(shardPool);
      const screw = i % 5 === 4;
      const grilleBit = i % 4 === 1;
      const handleBit = i % 6 === 5;
      s.kind = screw ? "pith" : "chunk";
      s.x = log.x + Math.cos(a) * dist;
      s.y = log.y + Math.sin(a) * dist + (handleBit ? log.r * 0.7 : 0);
      const sp = rand(90, handleBit ? 280 : 380);
      s.vx = Math.cos(a) * sp + rand(-30, 30);
      s.vy = Math.sin(a) * sp * 0.7 + (handleBit ? 80 : rand(-20, 60));
      s.rot = a;
      s.vr = rand(-5, 5);
      s.w = screw ? rand(5, 8) : grilleBit ? rand(12, 22) : handleBit ? rand(16, 28) : rand(14, 26);
      s.h = screw ? 0 : grilleBit ? rand(3.2, 5.5) : rand(4, 8);
      s.delay = rand(0, 0.02);
      s.age = 0;
      s.alpha = 1;
      s.scale = 1;
      s.fill = screw ? "#dfe6ec" : grilleBit ? "#8a847c" : handleBit ? "#c9c1b4" : (i % 2 ? "#d5dee6" : "#e7e1d6");
      s.dark = "#3a342e";
      s.outline = "#2a2622";
      s.sprite = null;
      s.atlas = null;
      if (s.knives) s.knives.length = 0;
      game.shards.push(s);
    }
    const fx = log.x + Math.cos(log.angle) * log.r * FAN_CX - Math.sin(log.angle) * log.r * FAN_CY;
    const fy = log.y + Math.sin(log.angle) * log.r * FAN_CX + Math.cos(log.angle) * log.r * FAN_CY;
    burst(fx, fy, phone ? 6 : 10, {
      spread: TWO_PI, smin: 80, smax: 280,
      rmin: 0.7, rmax: 1.6,
      colors: FAN_HEAT,
      g: 40, kind: "spark",
      lmin: 0.1, lmax: 0.24
    });
  }
  clearStuck();
  const shatterDmg = log.dmg | 0;
  const gen = game.bakeId || 0;
  const face = logBakeFace();
  let atlasReady = !!(logBake && logBake.c && logBake.gen === gen && logBake.dmg === shatterDmg && (logBake.face | 0) === face);
  if (!atlasReady) atlasReady = adoptAhead(shatterDmg);
  /* у шарика нет клиньев, значит и атлас для них не нужен: он лопается.
     помидор на телефоне тоже печём — иначе дольки будут плоским цветом */
  const needBake = !balloon;
  if (!atlasReady && needBake) {
    /* На телефоне свежий бейк ровно в кадре смерти — это второй большой бейк
       подряд (сначала треснувшее бревно, потом осколки) и заметный рывок.
       Спрайт от предыдущего удара уже есть и отличается только самой свежей
       трещиной — на разлетающихся клиньях её не видно. Берём его. */
    const near = phone && logBake && logBake.c && logBake.gen === gen && (logBake.face | 0) === face;
    if (!near) bakeLogDmg(shatterDmg);
    atlasReady = true;
  }
  if (atlasReady) {
    shatterSpr = logBake;
    for (let i = 0; i < game.shards.length; i++) {
      if (game.shards[i].kind === "wedge") game.shards[i].atlas = shatterSpr;
    }
    /* Забираем заранее испечённые клинья: в кадре взрыва остаются только
       назначение картинок и физика, без шести бейков подряд. */
    if (phone && shardWarmCache && shardWarmCache.atlas === shatterSpr &&
        shardWarmCache.gen === gen && (shardWarmCache.face | 0) === face &&
        shardWarmCache.cracks === cracks) {
      let wi = 0;
      for (let i = 0; i < game.shards.length; i++) {
        const sh = game.shards[i];
        if (sh.kind !== "wedge") continue;
        const w = shardWarmCache.items[wi++];
        if (!w || !w.sprite || w.c0 !== sh.c0 || w.c1 !== sh.c1) continue;
        sh.sprite = w.sprite;
        sh.sprOx = w.sprOx;
        sh.sprOy = w.sprOy;
        sh.sprDw = w.sprDw;
        sh.sprDh = w.sprDh;
        sh.cx = w.cx;
        sh.cy = w.cy;
        w.sprite = null;
      }
    }
  } else {
    shatterSpr = null;
  }
  if (shardWarmCache) shardWarmRelease();
  deferSfx(() => {
    if (boss) Sfx.bossCrack(boss.id);
    else Sfx.logCrack();
  });
  /* шарик лопается трижды: опыт и нож-награда — только за последний хлопок,
     иначе один уровень дал бы тройную награду */
  if (boss && !popMore) {
    /* Стата и выдача ножа пишут localStorage. На телефоне это синхронная
       запись на диск — несколько миллисекунд ровно в кадр взрыва. Выносим
       запись на следующий такт: на картинку она не влияет. */
    const bossRef = boss;
    setTimeout(function () {
      try { statBoss(bossRef); } catch (err) {}
      try { grantBossKnife(bossRef); } catch (err) {}
    }, 0);
    /* награду складываем заранее — сцена стартует уже с готовыми числами.
       Уровней и опыта в игре больше нет: победа над боссом даёт только нож
       (если он у босса есть), а награды игрок получает на дорожке по времени. */
    game.victoryReward = {
      name: boss.name || "",
      tier: bossTierOf(boss)
    };
    /* слово сцены победы печём заранее: экран сейчас занят разлётом осколков,
       а к началу сцены полотно уже готово (js/boss-victory.js: prebakeVictoryWord) */
    if (typeof prebakeVictoryWord === "function") {
      setTimeout(function () {
        try { prebakeVictoryWord(game.victoryReward); } catch (err) {}
      }, 800);
    }
  }
  const pn = phone ? 0.22 : 1;
  const crumb = boss && boss.id === "donut";
  burst(log.x, log.y, crumb ? (phone ? 48 : 160) : Math.round(58 * pn), {
    spread: TWO_PI, smin: 220, smax: 1020,
    rmin: crumb ? 2.4 : 2, rmax: crumb ? 5.6 : 11,
    colors: crumb ? DONUT_SPRINKLES : pal.chips,
    g: crumb ? 720 : 820, kind: crumb ? "sprinkle" : "chip",
    cap: crumb ? (phone ? 72 : 220) : undefined,
    lmin: 0.42, lmax: 0.95
  });
  if (crumb) {
    burst(log.x, log.y, phone ? 12 : 32, {
      spread: TWO_PI, smin: 70, smax: 420,
      rmin: 2.6, rmax: 6.2,
      colors: DONUT_GLAZE,
      g: 1100, kind: "glaze",
      cap: phone ? 88 : 240,
      lmin: 0.48, lmax: 1.05
    });
  }
  burst(log.x, log.y, Math.round(24 * pn), {
    spread: TWO_PI, smin: 160, smax: 560,
    rmin: 1.2, rmax: 3.4,
    colors: boss
      ? (boss.id === "marmalade" ? SPARK_MARM : boss.id === "donut" ? DONUT_SPRINKLES : pal.chips)
      : SPARK_WOOD,
    g: 160, kind: "spark",
    lmin: 0.2, lmax: 0.48
  });
  colorPair[0] = pal.chips[0];
  colorPair[1] = pal.chips[1] || pal.chips[0];
  burst(log.x, log.y, Math.round(16 * pn), {
    spread: TWO_PI, smin: 50, smax: 240,
    rmin: 12, rmax: 28,
    colors: boss ? colorPair : DUST_WOOD,
    g: 30, kind: "dust",
    lmin: 0.26, lmax: 0.52
  });
  /* яблок за победу над боссом больше нет: кошелёк пополняется только тем, что
     игрок сам сбил ножом на бревне (takeLogApple выше). Награда за босса — опыт,
     и он копится молча: сцена победы цифр не объявляет, прирост виден по полоске */
  persistSoon();
  syncHud();
}

function nearestHandle() {
  const log = game.log;
  let victim = null;
  let signed = 0;
  let best = 99;
  for (const sk of game.stuck) {
    const d = angAbs(sk.rel + log.angle, Math.PI / 2);
    if (d < best) {
      best = d;
      victim = sk;
      signed = angNorm(sk.rel + log.angle - Math.PI / 2);
    }
  }
  let side = -Math.sign(signed);
  if (!side) side = Math.random() < 0.5 ? 1 : -1;
  return { victim, side };
}

function beginRicochet(hit, fatal) {
  const m = knifeMetrics();
  const pivot = m.kh * 0.5;
  const found = nearestHandle();
  const side = found.side;
  if (found.victim) {
    found.victim.flash = fatal ? 0.85 : 0.6;
    found.victim.kick = fatal ? 16 : 11;
  }
  return {
    x: hit.x,
    y: hit.y + pivot,
    vx: side * rand(220, 340),
    vy: rand(640, 860),
    rot: 0,
    vr: side * rand(14, 18),
    pivot,
    glow: fatal ? 0.55 : 0.38,
    sx: 1,
    sy: 1,
    phase: "fall",
    side,
    /* застрявший нож, о который ударились: по нему ставим искры и вспышку
       ровно на рукояти, а не на острие летящего ножа (js/flow.js:
       bounceOffHandle) */
    victim: found.victim || null,
    /* падающий нож рисуется ТЕМ ЖЕ скином, что летел: иначе рандомизатор из
       альманаха успевает поставить в руку другой нож, и отскок перекрашивается
       в чужой клинок (js/draw-hud.js: drawSpinKnife) */
    skin: hit.skin || "",
    /* первый шаг пропускаем: нож только что создан в точке контакта, и кадр
       отскока не должен начинаться со сдвига на dt вниз (js/draw-hud.js:
       stepSpinKnife) */
    fresh: true,
    handle: !!hit.handle
  };
}

function bounceOffHandle(k) {
  if (typeof Analytics !== "undefined") Analytics.result("handle");
  const hit = k || game.flying[0] || game.knife;
  clearFlying();
  game.handT = 0;
  lastThrowAt = performance.now();
  punchView(13);
  buzz(12);
  game.flash = 0.22;
  game.flashK = 0;
  game.log.pulse = Math.min(0.07, (game.log.pulse || 0) + 0.04);
  game.drop = beginRicochet(hit, false);
  bakeSkip = 8;
  /* искры и вспышка — на рукояти задетого ножа, а не на острие летящего:
     угловой запас допускает удар в полуширине острия, и искра «в воздухе»
     рядом с рукоятью опять читалась бы как раздутый хитбокс */
  let hx = hit.x;
  let hy = hit.y;
  const victim = hit.handle && game.drop && game.drop.victim;
  if (victim) {
    const wa = victim.rel + game.log.angle;
    const hm = knifeMetrics(hitSurfR());
    hx = game.log.x + Math.cos(wa) * hm.outer;
    hy = game.log.y + Math.sin(wa) * hm.outer;
  }
  game.clash = { x: hx, y: hy, t: 0.7, ang: rand(0, TWO_PI) };
  if (hit.handle) {
    /* быстрый белый «взрыв» в точке удара: один короткий кадр-вспышка с
       расширением (рисуется в js/draw-hud.js: drawPop) */
    game.pop = { x: hx, y: hy, t: 1, r: Math.max(22, knifeH * 0.26), ang: rand(0, TWO_PI) };
  }
  burst(hx, hy, hit.handle ? 16 : 10, {
    spread: TWO_PI, smin: hit.handle ? 200 : 140, smax: hit.handle ? 620 : 420,
    rmin: 1.3, rmax: hit.handle ? 3.2 : 2.6,
    colors: hit.handle ? SPARK_POP : SPARK_FAIL,
    g: 240, kind: "spark",
    lmin: 0.14, lmax: hit.handle ? 0.3 : 0.34
  });
  deferSfx(() => Sfx.fail());
}

function fail(k, line, flash) {
  if (game.buffs.shield) {
    game.buffs.shield = false;
    game.flashCol = "180,220,255";
    bounceOffHandle(k);
    renderHudBuffs();
    return;
  }
  /* Бесконечные жизни (галочка «❤️» в доке меню, js/input.js: infLivesBtn):
     промах отзывается как обычно — нож отскакивает, плашка вздрагивает, — но
     сердце не снимается и забег не кончается. Запас держим полным, чтобы
     плашка жизней не гасла и не мигала «минус одна». */
  if (save.infLives) {
    game.lives = game.maxLives || playerMaxLives();
    flashLives();
    game.flashCol = flash || "255,186,168";
    bounceOffHandle(k);
    return;
  }
  game.lives = Math.max(0, (game.lives | 0) - 1);
  statLife();
  if (typeof Analytics !== "undefined") {
    Analytics.lifeLoss();
    Analytics.fail((game.lives | 0) <= 0, {
      livesAfter: game.lives | 0,
      shield: !!game.buffs.shield,
      inf: !!save.infLives
    });
  }
  /* жизнь снята: плашка вздрагивает и вспыхивает (js/hud.js: flashLives) */
  flashLives();
  renderLives();
  if (game.lives > 0) {
    game.flashCol = flash || "255,186,168";
    bounceOffHandle(k);
    return;
  }
  /* причину смерти на окно не выводим — там только «ПРОИГРЫШ» */
  /* Точка смерти: возрождение за рекламу вернёт бревно ровно в этот поворот,
     с этой скоростью и со всеми уже воткнутыми ножами (js/flow.js:
     reviveAfterAd). Снимок берём ДО того, как sim.js начнёт докатывать бревно. */
  game.deathSnap = snapshotLogState();
  state = "fail";
  /* HUD погаснет вместе со сценой — в sim.js, когда пройдёт DEATH_SCENE_DELAY */
  /* статистику смерти пишем только когда ролик уже не взять — в showFailOverlay:
     за эти пять секунд игрок ещё может вернуться в игру */
  const hit = k || game.flying[0] || game.knife;
  game.knife.flying = false;
  game.knife.ready = false;
  clearFlying();
  game.drop = null;
  const cx = hit.x;
  const cy = hit.y;
  /* нож ОТСКАКИВАЕТ от рукояти и улетает: это тот самый отскок, он живёт своей
     физикой и пропадает только когда улетит за кадр (js/sim.js: game.fail) */
  game.fail = beginRicochet(hit, true);
  if (hit.handle) game.pop = { x: cx, y: cy, t: 1, r: Math.max(24, knifeH * 0.3), ang: rand(0, TWO_PI) };
  bakeSkip = 8;
  game.log.pulse = Math.min(0.08, (game.log.pulse || 0) + 0.045);
  game.clash = { x: cx, y: cy, t: 1, ang: rand(0, TWO_PI) };
  game.shockT = 0.7;
  game.shockX = cx;
  game.shockY = cy;
  game.shockR = 42;
  punchView(20);
  buzz([10, 34, 18]);
  game.flash = 0.32;
  game.flashK = 0;
  game.flashCol = flash || "255,214,170";
  hitLogFlash(0.22);
  burst(cx, cy, 12, {
    spread: TWO_PI, smin: 180, smax: 640,
    rmin: 1.3, rmax: 2.8,
    colors: SPARK_CLASH,
    g: 240, kind: "spark", align: true,
    lmin: 0.16, lmax: 0.36, jx: 10, jy: 10
  });
  burst(cx, cy, 5, {
    a: Math.PI / 2, spread: 1.0, smin: 180, smax: 420,
    rmin: 1.6, rmax: 3.2,
    colors: CHIP_CLASH,
    g: 880, kind: "chip",
    lmin: 0.28, lmax: 0.58, jx: 8, jy: 8
  });
  game.failT = 0;
  game.deathT = 0;
  game.deathDone = false;
  game.deathTick = 0;
  game.deathBeats = 0;
  game.skipShown = false;
  game.reviveShown = false;
  /* сначала секунда пустоты: сцену покажет sim.js, когда пройдёт DEATH_SCENE_DELAY */
  hideDeathWord();
  hideDeathSkip();
  hideReviveButton();
  /* таблица лидеров от прошлой смерти больше не держит окно */
  if (typeof leaderboardHide === "function") leaderboardHide();
  /* баннер мастерской на телефоне жил внизу — на смерти убираем его и
     возвращаем нижний HUD на место */
  if (typeof premiumSync === "function") premiumSync();
  deferSfx(() => Sfx.fail());
  /* Реклама за возрождение в этом забеге уже использована: сцену с огромным
     ножом и предложением ролика не показываем — сразу открываем «ПРОИГРЫШ».
     deathDone гасит и сцену, и сам огромный нож (js/frame.js: drawDeathKnife). */
  if (game.rewardAdUsed) endDeathScene();
}

function overlayOpen() {
  return overlay && !overlay.classList.contains("hidden");
}

/* Окно «ПРОИГРЫШ» только что открылось: короткая защита от случайного клика.
   Когда смерть пропускает сцену с ножом, окно выскакивает мгновенно, и тот же
   клик/тап, которым игрок только что бросал нож, иначе сразу закрывал бы его
   в главное меню — выглядело так, будто вместо таблицы лидеров открылось
   «другое меню». */
let failOverlayAt = 0;
const FAIL_OVERLAY_GUARD_MS = 900;

function showFailOverlay() {
  /* демка: окно «ПРОИГРЫШ» не открываем, иначе оно перекроет игру. Сцена
     смерти при этом отыгрывает по-настоящему. */
  if (typeof Replay !== "undefined" && Replay.active()) {
    Replay.onDeath();
    return;
  }
  hideReviveButton();
  hideDeathWord();
  hideDeathSkip();
  failOverlayAt = performance.now();
  /* если ролик за возрождение уже использован в этом забеге — кнопки нет */
  const adBtn = document.getElementById("deathAdBtn");
  if (adBtn) adBtn.hidden = !!game.rewardAdUsed;
  /* ролик уже не взять — только теперь смерть считается состоявшейся */
  statDeath();
  hud.classList.remove("on", "death-dim");
  /* Плашка окна смерти: «ПРОИГРЫШ» + итог раунда (index.html) */
  if (deathBrand) deathBrand.textContent = "ПРОИГРЫШ";
  /* Итог раунда: уровень, ножи за забег и рекорд (js/stats.js: runStatsHtml) */
  if (runStats) runStats.innerHTML = runStatsHtml();
  overlay.classList.remove("hidden");
  /* Таблица лидеров: место · ник · ножи за забег. Рекорд — лучший забег по
     ножам (save.best), сравнение с прежним рекордом — game.bestBase. Но
     первыми идут ножи: карточка нового ножа закрывает таблицу, поэтому её
     показ ждёт последнего ОК (js/knife-unlock.js: knifeUnlockThen) */
  const showBoard = function () {
    if (typeof leaderboardShow !== "function") return;
    leaderboardShow({
      score: Math.max(save.best | 0, game.recordNum | 0),
      base: game.bestBase | 0,
      record: !!game.bestKnown && (game.recordNum | 0) > (game.bestBase | 0)
    });
  };
  const startUnlocks = function () {
    const knivesOn = typeof beginKnifeUnlocks === "function" && beginKnifeUnlocks();
    if (knivesOn && typeof knifeUnlockThen === "function") {
      knifeUnlockThen(showBoard);
    } else {
      showBoard();
    }
  };
  /* Сначала даём браузеру показать само окно, и только следующим тактом
     строим карточки новых ножей (они тяжёлые: своя анимация и арт). Раньше
     всё это попадало в первый кадр «ПРОИГРЫША» и давало рывок на телефоне. */
  setTimeout(startUnlocks, 60);
}

function dismissFailOverlay() {
  if (!overlayOpen()) return;
  /* окно только что выскочило (особенно когда сцена с ножом пропущена) —
     не закрываем его случайным кликом/тапом в первые 0.9 с */
  if (performance.now() - failOverlayAt < FAIL_OVERLAY_GUARD_MS) return;
  /* карточки новых ножей перекрывают окно: сначала их, потом всё остальное */
  if (typeof knifeUnlocksActive === "function" && knifeUnlocksActive()) return;
  /* Таблица лидеров держит окно: пока идёт подъём игрока (или не прошла
     первая секунда без рекорда), окно не закрывается — иначе анимацию
     никто не увидит */
  if (typeof leaderboardLocked === "function" && leaderboardLocked()) {
    if (typeof leaderboardNudge === "function") leaderboardNudge();
    return;
  }
  hideReviveButton();
  hideDeathWord();
  hideDeathSkip();
  if (typeof leaderboardHide === "function") leaderboardHide();
  if (hud) hud.classList.remove("death-dim");
  game.deathT = 0;
  game.deathDone = false;
  game.deathTick = 0;
  overlay.classList.add("hidden");
  overlay.classList.remove("spring-in");
  enterMenu();
}

/* ---------- смерть: сначала нож и ролик, потом окно проигрыша ----------
   Пока нож гаснет (DEATH_FADE), в кадре висит огромный нож, вопрос
   «Возродиться за 13 сек рекламы?», кнопка ролика и «Нет, спасибо». Взял
   ролик — возвращаемся ровно в точку смерти со всеми воткнутыми ножами и
   двумя жизнями; отказался — сразу открывается окно «ПРОИГРЫШ» с таблицей
   лидеров (js/flow.js: showFailOverlay). Площадка может не дать ролик — тогда
   честно говорим, что он недоступен. */
function showReviveButton() {
  if (!reviveBtn || game.rewardAdUsed) return;
  reviveBtn.hidden = false;
}

function hideReviveButton() {
  if (reviveBtn) reviveBtn.hidden = true;
}

function showDeathWord() {
  if (!deathWord || game.rewardAdUsed) return;
  deathWord.textContent = "Возродиться за 13 сек рекламы?";
  deathWord.hidden = false;
}

function hideDeathWord() {
  if (deathWord) deathWord.hidden = true;
}

function showDeathSkip() {
  if (deathSkip) deathSkip.hidden = false;
}

function hideDeathSkip() {
  if (deathSkip) deathSkip.hidden = true;
}

/* Клик мимо кнопки (или по «Нет, спасибо») пропускает сцену с роликом сразу к
   итогу: ждать все пять секунд не обязательно */
function endDeathScene() {
  if (state !== "fail" || game.deathDone) return;
  game.deathDone = true;
  hideReviveButton();
  hideDeathWord();
  hideDeathSkip();
  showFailOverlay();
}

/* ---------- снимок бревна для возрождения ----------
   Нужны только простые поля (угол, скорость, ход узора, фазы). Объекты
   (босс, тарелки, скорлупа, скрипт) не копируем: они и так лежат в game.log,
   пока сцена смерти докатывает бревно. */
function snapshotLogState() {
  const log = game.log;
  const snap = {};
  for (const key in log) {
    const v = log[key];
    if (v == null || typeof v === "number" || typeof v === "string" || typeof v === "boolean") {
      snap[key] = v;
    }
  }
  return snap;
}

function restoreLogState(snap) {
  if (!snap) return;
  const log = game.log;
  for (const key in snap) log[key] = snap[key];
  syncLogTurn();
}

/* Ролик за возрождение. Со сцены смерти — обычный путь, с окна «ПРОИГРЫШ» —
   кнопкой, не давая закрыть окно раньше времени (fromBoard = true).
   Показываем фирменный 13-секундный баннер мастерской «Цап Царапа»; Premium
   его НЕ отключает — это награда, а не навязанная реклама. */
function tryReviveByAd(fromBoard) {
  if (state !== "fail") return;
  if (game.rewardAdUsed) {
    toast("РЕКЛАМА ЗА ВОЗРОЖДЕНИЕ УЖЕ ИСПОЛЬЗОВАНА В ЭТОМ ЗАБЕГЕ");
    return;
  }
  if (game.deathDone && !fromBoard) return;
  if (typeof rewardedAdOpen === "function" && rewardedAdOpen()) return;
  hideReviveButton();
  hideDeathWord();
  hideDeathSkip();
  /* Сцену смерти замораживаем на время ролика: иначе через пять секунд
     sim.js откроет «ПРОИГРЫШ» и запишет смерть, пока игрок ещё смотрит баннер. */
  game.deathDone = true;
  const show = typeof showRewardedAd === "function"
    ? showRewardedAd
    : (typeof yxShowRewarded === "function" ? yxShowRewarded : null);
  if (!show) {
    game.deathDone = false;
    showDeathWord();
    showReviveButton();
    toast("Ролик пока недоступен — попробуйте ещё раз");
    return;
  }
  show(reviveAfterAd, () => {
    game.deathDone = false;
    if ((game.deathT || 0) >= DEATH_FADE) {
      showFailOverlay();
    } else {
      showDeathWord();
      showReviveButton();
      showDeathSkip();
    }
    toast("Ролик пока недоступен — попробуйте ещё раз");
  });
}

function reviveAfterAd() {
  if (state !== "fail") return;
  hideReviveButton();
  hideDeathWord();
  hideDeathSkip();
  if (typeof leaderboardHide === "function") leaderboardHide();
  /* окно «ПРОИГРЫШ» могло быть открыто — гасим его вместе с таблицей */
  if (overlay) {
    overlay.classList.add("hidden");
    overlay.classList.remove("spring-in");
  }
  game.deathDone = false;
  game.deathT = 0;
  game.deathTick = 0;
  game.deathBeats = 0;
  game.skipShown = false;
  game.reviveShown = false;
  game.fail = null;
  clearFlying();
  /* РОВНО ТАМ ЖЕ, ГДЕ УМЕР: возвращаем угол и ход бревна из снимка, не
     пересобираем уровень и НЕ трогаем game.stuck — все воткнутые ножи остаются. */
  restoreLogState(game.deathSnap);
  game.deathSnap = null;
  game.log.scale = 1;
  game.log.pulse = 0;
  game.log.pulseV = 0;
  game.intro = 0;
  game.handT = 1;
  game.knife.ready = true;
  game.knife.flying = false;
  lastThrowAt = 0;
  clearThrowBuffer();
  /* ровно две жизни после возрождения; у Premium запас может быть больше,
     но ролик даёт именно две (js/state.js: playerMaxLives) */
  const max = game.maxLives || playerMaxLives();
  game.lives = Math.min(max, 2);
  game.rewardAdUsed = true;
  renderLives();
  syncHud();
  state = "play";
  if (hud) {
    hud.classList.remove("death-dim");
    hud.classList.add("on");
  }
  /* снова в забеге: на телефоне возвращаем нижний баннер и поднимаем HUD */
  if (typeof premiumSync === "function") premiumSync();
  Sfx.pick();
  toast("2 ЖИЗНИ · ВОЗВРАЩЕНИЕ В БОЙ");
  if (typeof Analytics !== "undefined") {
    Analytics.revive();
    Analytics.ad("rewarded", "revive");
  }
}

function resolveThrow(k) {
  /* Демка: настоящий движок уже долетел ножом до бревна, но результат берём
     из записи — так демка показывает ровно то, что было у игрока. */
  if (typeof Replay !== "undefined" && Replay.active()) return Replay.resolve(k);
  const rel = hitRel();
  /* ЯБЛОКО — ПЕРВЫМ ДЕЛОМ. Нож, легший в яблоко, сбивает его ВСЕГДА: даже если
     дальше он сломается о стрелу мишени, отскочит от рукояти уже стоящего ножа
     или врежется в шапку чучела. Раньше яблоко снималось только при удачном
     втыкании (stickKnife), и заблокированный удар по яблоку выглядел как «нож
     прямо в яблоке, а яблоко не регается».
     Снимаем ВСЕ яблоки под лезвием (logApplesAt): лезвие имеет ширину, и если
     оно пересекло два-три яблока — у помидора кучка, у мишени и яйца соседи
     тоже близко, — в кошелёк идут все. Раньше брали только ближайшее, и
     остальные висели под тем же ножом. */
  const apples = logApplesAt(rel);
  for (let i = 0; i < apples.length; i++) {
    takeLogApple(apples[i], game.log.x, game.log.y + hitSurfR(), i < apples.length - 1);
  }
  /* ЧУЧЕЛО: шапка — броня, а не смерть. Пока она цела, нож в неё не входит:
     отскакивает, оставив трещину (dummyHatHit), и попытка НЕ снимается. Снесли
     шапку — верх открыт, удар идёт как обычный и снимает запас */
  if (game.log.boss && game.log.boss.id === "dummy" && dummyCapHit(rel) && dummyHatOn()) {
    /* демка: записываем и «щелчок по шапке», иначе следующий результат
       приклеивался к этому броску и таймлайн разъезжался */
    if (typeof Analytics !== "undefined") Analytics.result("hat", rel, { kind: "hat" });
    k.y = game.log.y + hitSurfR() - knifeH * (16 / KNIFE_SRC_H);
    dummyHatHit(k);   /* clearFlying уже вернул нож в пул */
    return false;
  }
  /* шарик: смертельных зон больше нет — любой бросок по латексу считается
     попаданием. Раньше промах мимо фитиля отскакивал и снимал попытку. */
  const hazard = pizzaHazardAt(rel);
  /* кокос: целый кусок скорлупы нож не держит — он отскакивает и крошит кусок.
     Проверка стоит до стука о ножи: вмятина на скорлупе снаружи мякоти, и ножа,
     воткнутого в мякоть, отскочивший нож не достаёт */
  if (game.log.boss && game.log.boss.id === "coconut") {
    const plate = coconutShellAt(rel);
    if (plate) {
      /* в демке отскок от скорлупы должен снять ровно тот же кусок */
      if (typeof Analytics !== "undefined") {
        Analytics.result("shell", rel, { kind: "shell", plateAng: plate.ang });
      }
      k.y = game.log.y + hitSurfR() - knifeH * (16 / KNIFE_SRC_H);
      coconutShellHit(k, plate);   /* clearFlying уже вернул нож в пул */
      return false;
    }
  }
  /* Рукоять проверяем на посадке — так было в старой версии: нож долетает до
     кромки и только там решается, воткнулся он или отбился. */
  const handle = handleHitAt(landY());
  /* стата: бросок пришёл в рукоять — это будущая потеря жизни (js/stats.js) */
  if (handle) statHandle();
  const blocked = !!hazard || handle;
  game.flying.length = 0;
  if (blocked) {
    const m = knifeMetrics(hitSurfR());
    k.y = game.log.y + m.outer - 8;
    let line = "";
    let flash = "";
    if (hazard && hazard.kind === "arrow") {
      line = "нож сломался о стрелу";
      flash = "176, 48, 36";
    } else if (hazard) {
      line = pizzaBreakLine(hazard);
      flash = hazard.kind === "olive" ? "168, 196, 72" : "214, 224, 232";
    }
    /* Демка: у каждого отскока/поломки обязан быть результат. Раньше щит
       предмета и бесконечные жизни выходили из fail() раньше записи, бросок
       оставался «без ответа», и следующий нож получал чужой результат. */
    if (typeof Analytics !== "undefined") {
      Analytics.result(handle ? "handle" : "hazard", rel, {
        kind: handle ? "handle" : (hazard && hazard.kind ? hazard.kind : "hazard"),
        line: line,
        flash: flash,
        shield: !!game.buffs.shield,
        inf: !!save.infLives
      });
    }
    k.handle = !!handle;
    fail(k, line, flash);
    recycleFly(k);
    return true;
  }
  k.y = landY();
  if (game.log.boss && game.log.boss.id === "coconut") k.dmg = COCONUT_FLESH_HIT;
  /* Нож сел — он больше не летит. Без этого при остатке кадра он мог быть
     сведён второй раз (и это же давало лишний отскок в демке). */
  game.flying.length = 0;
  stickKnife(k);
  recycleFly(k);
  return state !== "play";
}

function stepLogSpin(dt) {
  if (!(dt > 0)) return;
  /* Вступление «БОСС»: пока мечи не разошлись, бревна в кадре нет — и узора нет.
     Как только мечи ушли и бревно проступает (pop, см. stingPopAt в boss-sting.js),
     ход включается сразу: к последнему кадру вступления босс уже крутится, а не
     стоит столбом полсекунды. Ножа в руке у игрока ещё нет — бросок ждёт
     game.intro (throwKnife), — поэтому первый удар по отведённому бревну невозможен. */
  if (game.sting > 0 && (game.stingT || 0) < stingPopAt()) return;
  if (game.log.pattern === "saw") stepSawSpin(dt);
  else stepSpin(game.level, dt * 1000);
}

function simulateFlight(dt) {
  let left = dt;
  while (left > 1e-8 && state === "play") {
    const k = game.flying[0];
    let slice = left > PHYS_SLICE ? PHYS_SLICE : left;
    if (k) {
      const remain = (THROW_MS - k.t) / 1000;
      if (remain < slice) slice = remain;
    }
    if (slice > 1e-8) {
      stepLogSpin(slice);
      left -= slice;
    }
    if (!k || state !== "play") continue;
    k.t += slice * 1000;
    const u = clamp(k.t / THROW_MS, 0, 1);
    const dest = landY();
    k.y = k.fromY + (dest - k.fromY) * u;
    if (k.t >= THROW_MS - 0.05) {
      if (resolveThrow(k)) return true;
    }
  }
  return false;
}

