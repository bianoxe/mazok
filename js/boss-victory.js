/* ---------- победа над боссом: «БОСС ПОВЕРЖЕН» ----------
   Обратная сторона вступления из boss-sting.js. Бой кончился, бревно разлетелось —
   и игра коротко это подчёркивает: влетает один нож игрока, садится остриём в
   невидимую землю, затем впечатывается слово ПОВЕРЖЕН и лента ступени.

   Простая версия: без свиты клинков, искр, сора, колец и лучей. В кадре только
   нож, слово, лента, полоска ХП и короткая вспышка на ударе. Редкость читается
   по цвету ленты и надписи — этого достаточно, а слабый телефон не дёргается.

   ХП сцена цифрой не объявляет: полоска ХП игрока стоит в кадре с первого кадра —
   как была до боя, — и на удар ножа дорастает на награду. Уровень вырос — полоска
   доходит до конца и добирается заново уже на новом уровне. */
const VICTORY_WORD = "ПОВЕРЖЕН";

/* Посадка в невидимую землю: после удара нож ещё чуть-чуть идёт вниз — вдоль
   собственной оси, — пока под кромку не уйдёт ровно половина клинка. Линия земли
   при этом всегда пересекает клинок посередине: она проходит по точке удара, а
   клинок скользит по своей же оси, поэтому точка пересечения не уезжает. */
const VICTORY_SINK = 0.13;      /* сек: сколько идёт посадка после удара */
const VICTORY_SINK_PART = 0.5;  /* какая часть клинка уходит под землю */

/* Сор из-под кромки: земля в сцене не нарисована, поэтому её выдаёт только он —
   земляные комья и пыль. */
const VICTORY_SOIL = ["#8a7458", "#6d5a44", "#5a4a36", "#a08a68", "#c2ad8e"];
const VICTORY_DUST = ["#b6a68c", "#cdbda3"];
const victoryDebris = [];
let victorySoilT = 0;

/* Наклон и направление влёта — одно и то же число: нож летит остриём вперёд, вдоль
   собственного клинка, поэтому идёт не отвесно, а по своей диагонали — примерно 22° от
   вертикали. Рукоять уходит вверх-влево, остриё входит чуть правее и ниже центра.
   Ноль означал бы падение строго сверху, π/2 — бросок совсем сбоку, из-за левой
   кромки кадра: тогда наклон клинка был бы почти горизонтальным. */
const VICTORY_TILT = -0.38;

/* Тайминг по ступеням редкости (0 — обычный … 3 — тайный). Чем выше ступень,
   тем длиннее залп и вся сцена: land — остриё главного ножа вошло в точку удара
   (на бросок 0.3 с), полоска ХП пошла в рост; ribbon — проступает лента со
   ступенью босса; word — впечатывается слово ПОВЕРЖЕН; panel — всплывает
   карточка без цифр (только уровень); fade — сцена гаснет; dur — вся
   длительность. Свита (VICTORY_VOLLEY) влетает между land и word — слово
   приходит уже на готовую картину «пять ножей в земле». */
const VICTORY_STEPS = [
  /* common */ { dur: 1.55, land: 0.26, ribbon: 0.34, word: 0.46, panel: 0.62, fade: 1.24 },
  /* rare   */ { dur: 1.80, land: 0.26, ribbon: 0.38, word: 0.56, panel: 0.76, fade: 1.44 },
  /* legend */ { dur: 2.10, land: 0.26, ribbon: 0.42, word: 0.68, panel: 0.92, fade: 1.66 },
  /* secret */ { dur: 2.35, land: 0.26, ribbon: 0.46, word: 0.80, panel: 1.06, fade: 1.88 }
];

/* Свита на победе: в простой версии её нет — после главного клинка в кадре
   только слово, лента и полоска ХП. Редкость читается по цвету и надписи. */
const VICTORY_VOLLEY = [
  [],
  [],
  [],
  []
];
const VICTORY_STAB_FLY = 0.18;   /* сек: полёт клинка свиты до земли */

const victoryRings = [];
const victoryMotes = [];
let victoryBeat = null;
let victoryDrop = false;
let victoryFlash = 0;
let victoryWordHit = 0;
let victoryPanelHit = 0;
/* какие клинки свиты уже встали в землю: по флагу на клинок, чтобы толчок и
   звук сыграли ровно один раз */
let victoryStabs = [];
let victoryJolt = 0;
let victoryJoltV = 0;
let victoryWordCache = { key: "", px: 0 };
/* Надпись с обводками и ореол вокруг неё — самые дорогие куски кадра. Слово стоит
   в кадре почти две секунды и всё это время не меняется, поэтому после штампа оно
   рисуется одним запечённым холстом, а не четырьмя проходами текста на каждом кадре
   (и ореол-градиент тоже пересобирается только при смене размера). */
let victorySheetCanvas = null;
let victoryFlashCanvas = null;
let victorySheetCache = null;
let victorySheetKey = "";
let victoryGlowCache = null;
let victoryGlowKey = "";

function clearBossVictory() {
  game.victory = 0;
  game.victoryT = 0;
  game.victoryReward = null;
  victoryBeat = null;
  victoryDrop = false;
  victoryFlash = 0;
  victoryWordHit = 0;
  victoryPanelHit = 0;
  victoryJolt = 0;
  victoryJoltV = 0;
  victorySoilT = 0;
  victoryStabs = [];
  victoryRings.length = 0;
  victoryMotes.length = 0;
  victoryDebris.length = 0;
}

/* Запускается ровно один раз — когда после разлёта бревна выясняется, что босс
   повержен. Награду приносит flow.js из shatterLog. */
function beginBossVictory(reward) {
  const boss = (reward && reward.boss) || (game.log && game.log.boss);
  const tier = (reward && reward.tier) || bossTierOf(boss);
  const lvl = stingStepIndex(tier);
  clearBossVictory();
  victoryBeat = {
    tier: tier, lvl: lvl, step: VICTORY_STEPS[lvl],
    reward: reward || null
  };
  victoryStabs = victoryVolleySpec(lvl).map(() => false);
  game.victory = victoryBeat.step.dur;
  game.victoryT = 0;
  game.victoryReward = reward || null;
  Sfx.victoryWhoosh(lvl);
}

/* Лента со ступенью редкости: у обычного — привычный багровый, дальше всё злее. */
function victoryRibbonInk(tier) {
  if (tier === "secret") return { g0: "#ff8a76", g1: "#c81a1a", g2: "#4e0808", edge: "#ffbda4" };
  if (tier === "legend") return { g0: "#d3a6ff", g1: "#7b2fd6", g2: "#2c0f52", edge: "#e6cdff" };
  if (tier === "rare") return { g0: "#ffe08a", g1: "#d99a12", g2: "#553703", edge: "#fff0b8" };
  return { g0: "#e0606a", g1: "#9a2030", g2: "#4e0d17", edge: "#f3d48a" };
}

/* Размер слова подбирается один раз на каждый размер кадра: слово должно влезать
   в экран на любом телефоне, но оставаться большим. */
function victoryWordPx() {
  const key = visW + "x" + visH;
  if (victoryWordCache.key === key && victoryWordCache.px > 0) return victoryWordCache.px;
  let px = clamp(Math.min(visW, visH) * (phone ? 0.19 : 0.152), phone ? 56 : 44, 118);
  ctx.save();
  stingTrack("0.05em");
  ctx.font = "900 " + (px | 0) + "px Unbounded, Manrope, sans-serif";
  while (px > 22 && ctx.measureText(VICTORY_WORD).width > visW * (phone ? 0.84 : 0.78)) {
    px = Math.max(22, px * 0.94);
    ctx.font = "900 " + (px | 0) + "px Unbounded, Manrope, sans-serif";
  }
  ctx.restore();
  victoryWordCache = { key: key, px: px };
  return px;
}

/* Геометрия сцены: куда входит нож, строки над ним и карточка награды под ним.
   Считается каждый кадр — сцена обязана попадать в кадр на любом экране,
   в отличие от вступления. */
function victoryGeom() {
  const cx = cropX + visW * 0.5;
  const m = Math.min(visW, visH);
  const gy = cropY + visH * (phone ? 0.66 : 0.64);
  /* На телефоне сцена крупнее: нож — главный герой кадра, и раньше он терялся
     на большом экране. На десктопе размер прежний. */
  const kh = phone
    ? clamp(m * 0.55, 240, 420)
    : clamp(m * 0.25, 145, 265);
  /* остриё входит чуть правее центра: нож летит под углом, рукоять остаётся влево */
  const tipX = cx - Math.sin(VICTORY_TILT) * kh * 0.42;
  const tipY = gy;
  /* Невидимая земля идёт ровно по точке удара. Клинок в спрайте занимает от острия
     до гарды KNIFE_BLADE_END - 16 пикселей, поэтому «полблейда» в кадре — это
     половина этой длины, пересчитанная в тот же рост, что и нож на экране. */
  const sink = kh * ((KNIFE_BLADE_END - 16) / KNIFE_SRC_H) * VICTORY_SINK_PART;
  /* Влёт — вдоль самого клинка: dx/dy это то же направление, под которым нож потом
     стоит. Старт отложен за ту кромку кадра, которую эта диагональ пересекает, чтобы
     нож именно влетал из-за края, а не проступал на глазах в середине экрана. */
  const dx = -Math.sin(VICTORY_TILT);
  const dy = Math.cos(VICTORY_TILT);
  const flyLen = Math.min(
    (tipY - cropY + kh * 0.45) / Math.max(0.2, dy),
    (tipX - cropX + kh * 0.45) / Math.max(0.2, dx)
  );
  /* наклонённый нож по вертикали короче на cos угла — по этой верхушке и ставим строки */
  const top = tipY - kh * Math.cos(VICTORY_TILT);
  const wp = victoryWordPx();
  const rp = phone
    ? clamp(m * 0.062, 20, 34)
    : clamp(m * 0.046, 14, 30);
  const wordY = top - Math.max(24, visH * 0.05);
  return {
    cx: cx, gy: gy, kh: kh, tipX: tipX, tipY: tipY,
    groundY: tipY, sink: sink,
    entryX: tipX - dx * flyLen, entryY: tipY - dy * flyLen, flyLen: flyLen,
    scale: knifeH > 0 ? kh / knifeH : 1,
    wordY: wordY,
    ribbonY: wordY - wp * 0.7 - rp * 1.6
  };
}

/* Где сейчас остриё: нож уже влетает — из-за кромки кадра, остриём вперёд по своей же
   диагонали. Разгона нет: скорость сразу высокая и почти ровная, так что вход читается
   как бросок. На ударе нож не встаёт колом, а садится в невидимую землю: едет дальше
   вдоль собственной оси, пока под кромку не уйдёт половина клинка. */
function victoryTip(t, step, g) {
  if (t >= step.land) {
    const u = clamp((t - step.land) / VICTORY_SINK, 0, 1);
    const s = g.sink * easeOutCubic(u);
    return {
      x: g.tipX + s * -Math.sin(VICTORY_TILT),
      y: g.tipY + s * Math.cos(VICTORY_TILT)
    };
  }
  const u = clamp(t / Math.max(0.001, step.land), 0, 1);
  const k = Math.pow(u, 1.25);
  return { x: lerp(g.entryX, g.tipX, k), y: lerp(g.entryY, g.tipY, k) };
}

/* Наклон по ходу влёта: нож не кувыркается — летит остриём вперёд под одним и тем же
   углом, поэтому путь острия совпадает с осью клинка (и поза на ударе та же). */
function victoryTiltAt() {
  return VICTORY_TILT;
}

/* Скорость острия — по всему пути, а не только по вертикали: нож летит по диагонали,
   и дымный след должен тянуться по ней же. */
function victoryFallSpeed(t, step, g) {
  const a = victoryTip(t, step, g);
  const b = victoryTip(Math.max(0, t - 0.05), step, g);
  return Math.hypot(a.x - b.x, a.y - b.y) / 0.05;
}

/* Удар: вспышка, тряска, кольца от острия и сноп стальных искр.
   Земли в мире нет, но нож в неё садится: там, где остриё ушло под кромку, из
   пустоты летит сор — комья и пыль. Это единственное, что рисует землю. */
function victoryImpact(g) {
  const lvl = victoryBeat.lvl;
  const ink = tierInk(victoryBeat.tier);
  victoryFlash = 1;
  victoryJolt = 0;
  victoryJoltV = Math.max(120, visH * 0.16) * (1 + lvl * 0.16);
  Sfx.victoryLand(lvl);
  shakeCanvas(lvl >= 3 ? 18 : lvl === 2 ? 13 : lvl === 1 ? 9 : 5);
  buzz(lvl >= 2 ? [12, 20, 10] : [8, 14, 8]);
  game.flash = Math.max(game.flash, 0.16 + lvl * 0.06);
  game.flashCol = ink.rgb;
  game.flashK = 0.32 + lvl * 0.05;
  /* Простая версия: без колец, искр и сора — только вспышка и толчок. */
}

/* Сор из точки удара: невидимая земля выдаёт себя только им. Комья летят веером
   вверх и в стороны и падают обратно на ту же линию, пыль поднимается медленнее и
   висит дольше. Всё живёт в своём списке (victoryDebris) и рисуется вместе со
   сценой, поверх её затемнения: в общем котле частиц кадра (fx.js) его бы съело
   затемнение — сцена рисуется последней. */
function victorySoil(g, power) {
  const k = clamp(power, 0.2, 2);
  const pn = (phone ? 0.45 : 1) * k;
  const n = Math.max(1, Math.round(rand(4, 9) * pn));
  for (let i = 0; i < n; i++) {
    const side = Math.random() < 0.5 ? -1 : 1;
    const sp = rand(90, 520) * k;
    const a = -Math.PI / 2 + side * rand(0.05, 1.15);
    const life = rand(0.34, 0.72);
    victoryDebris.push({
      x: g.tipX + rand(-4, 4), y: g.tipY + rand(-2, 2),
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      life: life, max: life, bounces: 0, gy: g.groundY,
      r: rand(1.4, 3.6) * (phone ? 0.8 : 1),
      rot: rand(0, TWO_PI), vr: rand(-9, 9),
      col: VICTORY_SOIL[i % VICTORY_SOIL.length],
      kind: "clod"
    });
  }
  if (k <= 0.8) return;
  const nd = phone ? 2 : 5;
  for (let i = 0; i < nd; i++) {
    const a = -Math.PI / 2 + rand(-1.25, 1.25);
    const sp = rand(34, 180);
    const life = rand(0.5, 1.05);
    victoryDebris.push({
      x: g.tipX + rand(-6, 6), y: g.tipY + rand(-3, 3),
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      life: life, max: life, bounces: 0, gy: g.groundY,
      r: rand(5, 13) * (phone ? 0.8 : 1),
      rot: 0, vr: 0,
      col: VICTORY_DUST[i % VICTORY_DUST.length],
      kind: "dust"
    });
  }
}

/* ---------- свита ножей на победе ---------- */
function victoryVolleySpec(lvl) {
  return VICTORY_VOLLEY[clamp(lvl | 0, 0, VICTORY_VOLLEY.length - 1)];
}

/* Точка невидимой земли, куда встаёт клинок свиты: та же линия, что у главного
   ножа, но своё место по горизонтали. Разлёт считается от меньшей стороны кадра,
   а не от ширины: на широком экране залп не разъезжается в пустоту по краям. */
function victoryStabPoint(g, i) {
  const spec = victoryVolleySpec(victoryBeat ? victoryBeat.lvl : 0)[i];
  if (!spec) return { x: g.tipX, y: g.tipY };
  const pad = g.kh * 0.22;
  const spread = Math.min(visW, visH) * 1.05;
  return {
    x: clamp(g.cx + spec.dx * spread, cropX + pad, cropX + visW - pad),
    y: g.groundY
  };
}

/* Клинок свиты вошёл: кольцо по цвету редкости, стальные искры, сор из-под
   кромки, толчок кадра и призвук. Каждый клинок бьёт сам по себе, поэтому залп
   слышно и видно по шагам, а не одной общей вспышкой. */
function victoryStabImpact(g, i) {
  const lvl = victoryBeat.lvl;
  const ink = tierInk(victoryBeat.tier);
  const p = victoryStabPoint(g, i);
  const pn = phone ? 0.45 : 1;
  victoryRings.push({
    x: p.x, y: p.y, r: 8, vr: 520 + lvl * 70,
    a: 0.55, fade: 3.2, w: 2, col: ink.rgb
  });
  burst(p.x, p.y, Math.round(10 * pn), {
    a: -Math.PI / 2, spread: 1.15,
    smin: 120, smax: 520, rmin: 1, rmax: 2.4,
    colors: SPARK_IRON, g: 520, kind: "spark",
    cap: phone ? 90 : 240, lmin: 0.14, lmax: 0.34
  });
  victorySoil({ tipX: p.x, tipY: p.y, groundY: g.groundY }, 0.5);
  shakeCanvas(2.5 + lvl * 1.4);
  Sfx.victoryStab(lvl, i);
}

/* Слово впечаталось: в простой версии без снопа искр — только сам штамп. */
function victoryWordBurst(g) {
}

function stepVictoryBits(dt) {
  for (let i = victoryRings.length - 1; i >= 0; i--) {
    const r = victoryRings[i];
    r.r += r.vr * dt;
    r.a -= dt * r.fade;
    if (r.a <= 0) victoryRings.splice(i, 1);
  }
  let m = 0;
  for (let i = 0; i < victoryMotes.length; i++) {
    const s = victoryMotes[i];
    s.life -= dt;
    if (s.life <= 0) continue;
    s.vy += (s.kind === "star" ? -26 : 46) * dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.vx *= 0.982;
    s.vy *= 0.982;
    s.rot += s.vr * dt;
    victoryMotes[m++] = s;
  }
  victoryMotes.length = m;
  /* Сор из-под кромки: комья летят по баллистике, коснувшись невидимой земли —
     коротко скачут и затихают на ней же; пыль всплывает, раздувается и тает. */
  let d = 0;
  for (let i = 0; i < victoryDebris.length; i++) {
    const s = victoryDebris[i];
    s.life -= dt;
    if (s.life <= 0) continue;
    if (s.kind === "dust") {
      s.vy -= 30 * dt;
      s.vx *= 0.955;
      s.vy *= 0.955;
      s.r += 17 * dt;
    } else {
      s.vy += 1500 * dt;
      s.vx *= 0.996;
      s.rot += s.vr * dt;
    }
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    if (s.kind === "clod" && s.vy > 0 && s.y >= s.gy) {
      s.y = s.gy;
      if (s.bounces < 2 && s.vy > 90) {
        s.bounces++;
        s.vy = -s.vy * 0.36;
        s.vx *= 0.6;
      } else {
        s.vy = 0;
        s.vx *= 0.82;
      }
    }
    victoryDebris[d++] = s;
  }
  victoryDebris.length = d;
  if (victoryFlash > 0) victoryFlash = Math.max(0, victoryFlash - dt * 4.6);
  if (victoryJolt !== 0 || victoryJoltV !== 0) {
    victoryJoltV += (-victoryJolt * 1200 - victoryJoltV * 14) * dt;
    victoryJolt += victoryJoltV * dt;
    if (Math.abs(victoryJolt) < 0.04 && Math.abs(victoryJoltV) < 0.6) {
      victoryJolt = 0;
      victoryJoltV = 0;
    }
  }
}

/* Шаг сцены: ровно как stepBossSting, только по своей дорожке времени.
   Сама сцена живёт в game.victory, а по её концу sim.js пускает следующий уровень. */
function stepBossVictory(dt) {
  if (!(game.victory > 0)) return;
  if (!victoryBeat) { clearBossVictory(); return; }
  const step = victoryBeat.step;
  const t = (game.victoryT = (game.victoryT || 0) + dt);
  if (t >= step.dur) { clearBossVictory(); return; }
  game.victory = step.dur - t;
  if (!victoryDrop && t >= step.land) {
    victoryDrop = true;
    victoryImpact(victoryGeom());
  }
  if (!victoryWordHit && t >= step.word) {
    victoryWordHit = 1;
    Sfx.victoryFanfare(victoryBeat.tier);
    victoryWordBurst(victoryGeom());
    const lvl = victoryBeat.lvl;
    if (lvl > 0) {
      buzz(lvl >= 2 ? [10, 18, 9] : [8, 14, 7]);
      game.flash = Math.max(game.flash, lvl === 3 ? 0.34 : lvl === 2 ? 0.28 : 0.2);
      game.flashCol = tierInk(victoryBeat.tier).rgb;
      game.flashK = 0.34 + lvl * 0.05;
    }
  }
  /* Окно с надписью «УРОВЕНЬ ↑», полоска опыта и карточка награды убраны:
     после победы остаются только сцена с ножом и слово «ПОБЕЖДЕН». */
  stepVictoryBits(dt);
}

/* ---------- отрисовка ---------- */

function victoryFadeU(t, step) {
  if (t < step.fade) return 0;
  return clamp((t - step.fade) / Math.max(0.001, step.dur - step.fade), 0, 1);
}

/* Лучи из острия: у обычного почти незаметно, у тайного — стена света.
   Расходятся во все стороны от точки удара — за ножом пусто, опоры у них нет. */
function drawVictoryRays(g, t, step, live) {
  if (t < step.land) return;
  const lvl = victoryBeat.lvl;
  const ink = tierInk(victoryBeat.tier);
  const u = t - step.land;
  const inA = clamp(u / 0.09, 0, 1);
  const peak = 0.44 + lvl * 0.13;
  const settle = 0.12 + lvl * 0.05;
  const a = lerp(peak, settle, clamp((u - 0.09) / 0.34, 0, 1)) * inA * live;
  if (a <= 0.02) return;
  ctx.save();
  ctx.lineCap = "round";
  const spin = u * 0.5;
  const n = phone ? 8 : 14;
  const reach = Math.max(visW, visH) * 0.82;
  for (let i = 0; i < n; i++) {
    const ang = spin + (i / n) * Math.PI;
    const len = reach * (0.45 + (i % 3) * 0.17);
    const ca = Math.cos(ang), sa = Math.sin(ang);
    ctx.strokeStyle = "rgba(" + ink.rgb + "," + (a * (0.4 + (i % 4) * 0.15)) + ")";
    ctx.lineWidth = i % 2 ? 1.4 : 2.6;
    ctx.beginPath();
    ctx.moveTo(g.tipX + ca * 26, g.tipY + sa * 26);
    ctx.lineTo(g.tipX + ca * len, g.tipY + sa * len);
    ctx.moveTo(g.tipX - ca * 26, g.tipY - sa * 26);
    ctx.lineTo(g.tipX - ca * len, g.tipY - sa * len);
    ctx.stroke();
  }
  ctx.restore();
}

/* Ни земли, ни трещин в сцене нет: нож входит в пустоту, опору под ним не рисуем.
   Кольца потому круглые — удар расходится в пустоте, а не по плоскости. */
function drawVictoryRings(g, jolt, live) {
  if (!victoryRings.length) return;
  ctx.save();
  /* без округления до пикселя: нож, кольца и кромка земли должны ехать одним шагом,
     иначе на затухании толчка картинка дёргается по пикселю */
  ctx.translate(g.tipX, g.tipY + jolt);
  for (let i = 0; i < victoryRings.length; i++) {
    const r = victoryRings[i];
    if (r.a <= 0.02) continue;
    ctx.globalAlpha = r.a * live;
    ctx.strokeStyle = "rgba(" + r.col + ",0.85)";
    ctx.lineWidth = Math.max(1, r.w * (1 - r.a * 0.5));
    ctx.beginPath();
    /* у колец свиты своя точка удара; у главного её нет — он в центре */
    ctx.arc(r.x == null ? 0 : r.x - g.tipX, r.y == null ? 0 : r.y - g.tipY, r.r, 0, TWO_PI);
    ctx.stroke();
  }
  ctx.restore();
}

/* Вспышка в точке удара — живёт доли секунды, зато её видно боковым зрением. */
function drawVictoryCore(g, jolt, live) {
  const a = victoryFlash * live;
  if (a <= 0.02) return;
  const ink = tierInk(victoryBeat.tier);
  const r = Math.max(g.kh * 0.5, visW * 0.24);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const gr = ctx.createRadialGradient(g.tipX, g.tipY + jolt, 0, g.tipX, g.tipY + jolt, r);
  gr.addColorStop(0, "rgba(255,252,244," + (a * 0.8) + ")");
  gr.addColorStop(0.3, "rgba(" + ink.rgb + "," + (a * 0.42) + ")");
  gr.addColorStop(1, "rgba(" + ink.rgb + ",0)");
  ctx.fillStyle = gr;
  ctx.beginPath();
  ctx.arc(g.tipX, g.tipY + jolt, r, 0, TWO_PI);
  ctx.fill();
  ctx.restore();
}

/* Нож игрока: влетает сбоку, остриём вперёд по своей диагонали, входит и мелко
   дрожит. Пока летит — тянет за собой дымку и оставляет призраков прошлых кадров,
   чтобы быстрое движение читалось даже на одном ноже. */
function drawVictoryKnife(g, t, step, live) {
  const pt = victoryTip(t, step, g);
  const x = pt.x;
  const jolt = victoryDrop ? victoryJolt : 0;
  const y = pt.y + jolt;
  const fall = t < step.land;
  /* Дрожание гаснет и обрывается на пороге: пока амплитуда меньше половины пикселя,
     нож стоит ровно — иначе он «дышит» пикселем и кадр кажется подлагивающим. */
  let wob = Math.sin(t * 11) * 0.008;
  if (victoryDrop) {
    const amp = 0.05 * Math.exp(-(t - step.land) * 5);
    wob = amp > 0.0016 ? Math.sin((t - step.land) * 26) * amp : 0;
  }
  const rot = Math.PI + victoryTiltAt() + wob;
  if (fall) {
    /* Простая версия: без дымного следа и призрачных копий — один нож. */
    drawKnifeImg(x, y, rot, g.scale, live, null, 1);
    return;
  }
  /* Нож сел: всё, что ниже невидимой земли, в кадре не рисуем — кромка клинка
     уходит в пустоту ровно по линии удара, и остаётся верхняя половина клинка.
     Кромка та же, что у колец и вспышки, поэтому при дрожи она едет вместе с ножом
     и видимая часть клинка не меняется. И кромка, и нож идут без округления до
     пикселя — иначе срез клинка мигает на месте. */
  ctx.save();
  ctx.beginPath();
  ctx.rect(cropX - 200, cropY - 200, visW + 400, g.groundY + jolt - cropY + 200);
  ctx.clip();
  drawKnifeImg(x, y, rot, g.scale, live, null, 1);
  ctx.restore();
}

/* Свита на победе: клинки падают следом за главным, каждый под своим углом,
   и втыкаются в ту же невидимую землю. Летят из-за верхней кромки кадра по
   собственной оси — как главный нож, только мельче и быстрее; ниже кромки
   земли не рисуются, поэтому в кадре остаётся верхняя часть клинка. */
function drawVictoryVolley(g, t, step, live) {
  const specs = victoryVolleySpec(victoryBeat.lvl);
  if (!specs.length) return;
  const jolt = victoryDrop ? victoryJolt : 0;
  for (let i = 0; i < specs.length; i++) {
    const spec = specs[i];
    const at = step.land + spec.delay;
    if (t < at - VICTORY_STAB_FLY) continue;
    const p = victoryStabPoint(g, i);
    const kh = g.kh * spec.h;
    const rot = Math.PI + spec.tilt;
    /* ось клинка: от острия к рукояти (вверх и в сторону) */
    const ux = Math.sin(spec.tilt);
    const uy = -Math.cos(spec.tilt);
    let x = p.x;
    let y = p.y + (t >= at ? jolt : 0);
    if (t < at) {
      const u = clamp((t - (at - VICTORY_STAB_FLY)) / VICTORY_STAB_FLY, 0, 1);
      const k = u * u;
      const fly = (p.y - cropY + kh * 0.5) / Math.max(0.4, -uy);
      x = p.x + ux * fly * (1 - k);
      y = p.y + uy * fly * (1 - k);
    } else {
      const u = clamp((t - at) / VICTORY_SINK, 0, 1);
      const s = g.sink * spec.h * easeOutCubic(u);
      x = p.x - ux * s;
      y = p.y + Math.cos(spec.tilt) * s + jolt;
    }
    ctx.save();
    ctx.beginPath();
    ctx.rect(cropX - 200, cropY - 200, visW + 400, g.groundY + jolt - cropY + 200);
    ctx.clip();
    drawKnifeImg(x, y, rot, g.scale * spec.h, live * 0.95, null, 1);
    ctx.restore();
  }
}

/* Сор из-под кромки: единственное, что в сцене рисует землю. Комья — короткими
   угловатыми обломками, пыль — мягкими кругами; и то и другое живёт только миг
   после удара, поэтому гаснет вместе со сценой (live). */
function drawVictoryDebris(live) {
  if (!victoryDebris.length) return;
  ctx.save();
  for (let i = 0; i < victoryDebris.length; i++) {
    const s = victoryDebris[i];
    const u = clamp(s.life / s.max, 0, 1);
    const a = (s.kind === "dust" ? 0.34 : 0.88) * Math.min(1, u * 3.2) * live;
    if (a <= 0.02) continue;
    ctx.globalAlpha = a;
    ctx.fillStyle = s.col;
    if (s.kind === "dust") {
      ctx.beginPath();
      ctx.arc(snap(s.x), snap(s.y), Math.max(1, s.r * (1.5 - u * 0.5)), 0, TWO_PI);
      ctx.fill();
    } else {
      ctx.save();
      ctx.translate(snap(s.x), snap(s.y));
      ctx.rotate(s.rot);
      ctx.fillRect(-s.r, -s.r * 0.7, s.r * 2, s.r * 1.4);
      ctx.restore();
    }
  }
  ctx.restore();
}

function drawVictoryMotes(live) {
  if (!victoryMotes.length) return;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < victoryMotes.length; i++) {
    const s = victoryMotes[i];
    const a = Math.min(1, (s.life / s.max) * 1.6);
    if (a <= 0.02) continue;
    ctx.globalAlpha = a * live;
    ctx.fillStyle = s.col;
    if (s.kind === "star") {
      ctx.save();
      ctx.translate(snap(s.x), snap(s.y));
      ctx.rotate(s.rot);
      const k = 0.5 + a * 0.5;
      ctx.scale(k, k);
      traceSparkle(s.sz);
      ctx.fill();
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.arc(snap(s.x), snap(s.y), s.sz, 0, TWO_PI);
      ctx.fill();
    }
  }
  ctx.restore();
}

function victoryRibbonPose(t, step) {
  const tt = t - step.ribbon;
  if (tt < 0) return null;
  const fade = victoryFadeU(t, step);
  const a = clamp(tt / 0.16, 0, 1);
  return { alpha: a * (1 - fade * fade), sx: Math.max(0.001, easeOutBack(clamp(tt / 0.36, 0, 1))) };
}

/* Слово влетает с большего размера и «штампуется» — как rarityPose во вступлении,
   только чужого конца сцены: ступень выше — влёт дольше, отскок заметнее. */
function victoryWordPose(t, step, lvl) {
  const tt = t - step.word;
  if (tt < 0) return null;
  const land = 0.16 + lvl * 0.02;
  const approach = 1 - Math.pow(1 - clamp(tt / land, 0, 1), 3);
  const scale = lerp(Math.min(1.03 + lvl * 0.005, 1.05), 1, approach);
  const fade = victoryFadeU(t, step);
  return {
    alpha: clamp(tt / (0.04 + lvl * 0.01), 0, 1) * (1 - fade * fade),
    sx: scale,
    sy: scale,
    flash: clamp(1 - tt / (0.16 + lvl * 0.04), 0, 1)
  };
}

function victoryPanelPose(t, step) {
  const tt = t - step.panel;
  if (tt < 0) return null;
  const fade = victoryFadeU(t, step);
  const a = clamp(tt / 0.24, 0, 1);
  return {
    alpha: a * (1 - fade * fade),
    scale: 0.86 + 0.14 * easeOutBack(clamp(tt / 0.36, 0, 1)),
    rise: (1 - a) * 24
  };
}

/* Надпись с обводками и градиентом — в одном месте: ею и запекается холст, и
   рисуется влёт штампа. alpha — как в исходной отрисовке: цветная разводка тайного
   идёт вполсилы, остальное в полную. */
function victoryWordPaint(c, ox, oy, pxw, ink, lvl, alpha) {
  c.lineJoin = "round";
  if (lvl >= 3) {
    /* у тайного — цветная разводка под контуром: слово «звенит» */
    const off = pxw * 0.055;
    c.globalAlpha = alpha * 0.5;
    c.fillStyle = "#7ee0ff";
    c.fillText(VICTORY_WORD, ox - off, oy);
    c.fillStyle = "#ff8ad4";
    c.fillText(VICTORY_WORD, ox + off, oy);
  }
  c.globalAlpha = alpha;
  c.lineWidth = Math.max(8, pxw * 0.2);
  c.strokeStyle = "rgba(8,3,4,0.62)";
  c.strokeText(VICTORY_WORD, ox, oy + pxw * 0.035);
  c.lineWidth = Math.max(3, pxw * 0.1);
  c.strokeStyle = ink.deep;
  c.strokeText(VICTORY_WORD, ox, oy);
  c.lineWidth = Math.max(1.8, pxw * 0.032);
  c.strokeStyle = ink.edge;
  c.strokeText(VICTORY_WORD, ox, oy);
  const fill = c.createLinearGradient(0, oy - pxw * 0.62, 0, oy + pxw * 0.62);
  fill.addColorStop(0, ink.hot);
  fill.addColorStop(0.46, ink.mid);
  fill.addColorStop(1, ink.deep);
  c.fillStyle = fill;
  c.fillText(VICTORY_WORD, ox, oy);
}

/* Запечённое слово под текущий размер кадра и ступень. Слово стоит почти две
   секунды без изменений — пересобирать его (три обводки плюс заливка) каждый кадр
   незачем: дальше это один drawImage. */
function victoryWordSheet(tier, ink, pxw, lvl) {
  const s = viewSx > 0 ? viewSx : 1;
  /* печём с запасом 1.5x: слово влетает увеличенным до ~1.5–1.7, и запас
     держит его резким и в полёте, и в покое (в покое картинка уменьшается) */
  const k = 1.5;
  const sc = s * k;
  const key = tier + ":" + (pxw | 0) + ":" + lvl + ":" + s.toFixed(2);
  if (victorySheetCache && victorySheetKey === key) return victorySheetCache;
  ctx.save();
  stingTrack("0.05em");
  ctx.font = "900 " + (pxw | 0) + "px Unbounded, Manrope, sans-serif";
  const tw = ctx.measureText(VICTORY_WORD).width;
  ctx.restore();
  const w = Math.ceil(tw + pxw * 0.72);
  const h = Math.ceil(pxw * 1.8);
  if (!victorySheetCanvas) victorySheetCanvas = document.createElement("canvas");
  victorySheetCanvas.width = Math.max(2, Math.ceil(w * sc));
  victorySheetCanvas.height = Math.max(2, Math.ceil(h * sc));
  const g = victorySheetCanvas.getContext("2d");
  g.setTransform(sc, 0, 0, sc, 0, 0);
  g.clearRect(0, 0, w, h);
  g.font = "900 " + (pxw | 0) + "px Unbounded, Manrope, sans-serif";
  if ("letterSpacing" in g) g.letterSpacing = "0.05em";
  g.textAlign = "center";
  g.textBaseline = "middle";
  victoryWordPaint(g, w * 0.5, h * 0.5, pxw, ink, lvl, 1);
  /* белая копия слова — вспышка штампа одним блитом, без живого текста в кадре */
  if (!victoryFlashCanvas) victoryFlashCanvas = document.createElement("canvas");
  victoryFlashCanvas.width = victorySheetCanvas.width;
  victoryFlashCanvas.height = victorySheetCanvas.height;
  const fg = victoryFlashCanvas.getContext("2d");
  fg.setTransform(sc, 0, 0, sc, 0, 0);
  fg.clearRect(0, 0, w, h);
  fg.font = "900 " + (pxw | 0) + "px Unbounded, Manrope, sans-serif";
  if ("letterSpacing" in fg) fg.letterSpacing = "0.05em";
  fg.textAlign = "center";
  fg.textBaseline = "middle";
  fg.fillStyle = "#fff8ee";
  fg.fillText(VICTORY_WORD, w * 0.5, h * 0.5);
  victorySheetCache = { canvas: victorySheetCanvas, flash: victoryFlashCanvas, w: w, h: h };
  victorySheetKey = key;
  return victorySheetCache;
}

/* Ореол вокруг слова: его форма зависит только от ступени и размера кадра */
function victoryWordGlow(glowR, pxw, ink) {
  const key = victoryBeat.tier + ":" + Math.round(glowR) + ":" + Math.round(pxw);
  if (victoryGlowCache && victoryGlowKey === key) return victoryGlowCache;
  const grd = ctx.createRadialGradient(0, 0, pxw * 0.2, 0, 0, glowR);
  grd.addColorStop(0, "rgba(" + ink.rgb + ",0.45)");
  grd.addColorStop(1, "rgba(" + ink.rgb + ",0)");
  victoryGlowCache = grd;
  victoryGlowKey = key;
  return grd;
}

/* Лента со ступенью: тело, градиент, обводка, слово и звёзды не меняются за
   сцену — печём их в одно полотно (как слово «ПОВЕРЖЕН»), а каждый кадр только
   тянем/масштабируем. Раньше лента с текстом и обводками перерисовывалась
   60 раз в секунду, и первая же её отрисовка давала рывок. */
let victoryRibCache = null;
let victoryRibKey = "";

function victoryRibbonSheet(tier, rin, label, rw, rh, rp, pips, labelW) {
  const s = viewSx > 0 ? viewSx : 1;
  const key = tier + "|" + Math.round(rw) + "|" + Math.round(rh) + "|" + s.toFixed(2);
  if (victoryRibCache && victoryRibKey === key) return victoryRibCache;
  const pad = Math.ceil(rp * 0.3 + 8);
  const w = Math.ceil(rw + pad * 2);
  const h = Math.ceil(rh + pad * 2);
  const c = document.createElement("canvas");
  c.width = Math.max(2, Math.ceil(w * s));
  c.height = Math.max(2, Math.ceil(h * s));
  const g = c.getContext("2d");
  g.setTransform(s, 0, 0, s, 0, 0);
  g.translate(w * 0.5, h * 0.5);
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = "800 " + (rp | 0) + "px Unbounded, Manrope, sans-serif";
  if ("letterSpacing" in g) g.letterSpacing = "0.14em";
  const saved = ctx;
  ctx = g;
  try {
    traceRibbon(rw, rh);
    ctx.fillStyle = rin.g1;
    ctx.fill();
    /* тело ленты: вертикальный градиент ступени + блик сверху */
    ctx.save();
    traceRibbon(rw, rh);
    ctx.clip();
    const sg = ctx.createLinearGradient(0, -rh * 0.5, 0, rh * 0.5);
    sg.addColorStop(0, rin.g0);
    sg.addColorStop(0.52, rin.g1);
    sg.addColorStop(1, rin.g2);
    ctx.fillStyle = sg;
    ctx.fillRect(-rw * 0.62, -rh, rw * 1.24, rh * 2);
    const sh = ctx.createLinearGradient(0, -rh * 0.5, 0, 0);
    sh.addColorStop(0, "rgba(255,255,255,0.26)");
    sh.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = sh;
    ctx.fillRect(-rw, -rh, rw * 2, rh);
    ctx.restore();
    ctx.lineJoin = "round";
    ctx.lineWidth = Math.max(1.6, rp * 0.14);
    ctx.strokeStyle = rin.edge;
    traceRibbon(rw, rh);
    ctx.stroke();
    ctx.fillStyle = "rgba(0,0,0,0.42)";
    ctx.fillText(label, 0, rp * 0.07);
    ctx.fillStyle = "#fff6ea";
    ctx.fillText(label, 0, 0);
    /* звёзды-пипсы убраны: ступень читается по цвету и подписи */
  } finally {
    ctx = saved;
  }
  victoryRibCache = { c: c, w: w, h: h };
  victoryRibKey = key;
  return victoryRibCache;
}

/* Над посаженным ножом: лента со ступенью босса и слово ПОВЕРЖЕН. */
function drawVictoryTitle(g, t, step, live) {
  const ink = tierInk(victoryBeat.tier);
  const lvl = victoryBeat.lvl;
  const rin = victoryRibbonInk(victoryBeat.tier);
  const rib = victoryRibbonPose(t, step);
  if (rib) {
    const lay = victoryRibbonLayout();
    const rp = lay.rp;
    const rw = lay.rw;
    const rh = lay.rh;
    const sheet = victoryRibbonSheet(victoryBeat.tier, rin, lay.label, rw, rh, rp, lay.pips, lay.labelW);
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.translate(snap(g.cx), snap(g.ribbonY));
    ctx.globalAlpha = rib.alpha * 0.35;
    ctx.fillStyle = "#000";
    ctx.translate(0, 5);
    traceRibbon(rw, rh);
    ctx.fill();
    ctx.translate(0, -5);
    ctx.globalAlpha = rib.alpha;
    ctx.scale(rib.sx, 1);
    ctx.drawImage(sheet.c, -sheet.w * 0.5, -sheet.h * 0.5, sheet.w, sheet.h);
    ctx.restore();
  }

  const wp = victoryWordPose(t, step, lvl);
  if (!wp) return;
  const pxw = victoryWordPx();
  ctx.save();
  stingTrack("0.05em");
  ctx.font = "900 " + (pxw | 0) + "px Unbounded, Manrope, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.translate(snap(g.cx), snap(g.wordY));
  ctx.globalAlpha = wp.alpha;
  ctx.scale(wp.sx, wp.sy);
  /* Слово всегда рисуется готовой картинкой. Живой текст в полёте (масштаб
     меняется каждый кадр) заставлял браузер растрировать обводки заново —
     это и были рывки в сцене победы. */
  const sheet = victoryWordSheet(victoryBeat.tier, ink, pxw, lvl);
  ctx.drawImage(sheet.canvas, -sheet.w * 0.5, -sheet.h * 0.5, sheet.w, sheet.h);
  if (wp.flash > 0.02 && sheet.flash) {
    ctx.globalAlpha = wp.alpha * wp.flash * 0.85;
    ctx.drawImage(sheet.flash, -sheet.w * 0.5, -sheet.h * 0.5, sheet.w, sheet.h);
  }
  ctx.restore();
}

/* Запекаем слово победы ЗАРАНЕЕ — пока на экране ещё разлетаются осколки
   (до сцены ~0.9 с). Тогда первый кадр сцены только блитит готовое полотно. */
function prebakeVictoryWord(reward) {
  const r = reward || (typeof game !== "undefined" ? game.victoryReward : null);
  if (!r || !(visW > 0)) return;
  const tier = r.tier || "common";
  const lvl = stingStepIndex(tier);
  victoryWordSheet(tier, tierInk(tier), victoryWordPx(), lvl);
  const lay = victoryRibbonLayout(tier, lvl);
  victoryRibbonSheet(tier, victoryRibbonInk(tier), lay.label, lay.rw, lay.rh, lay.rp, lay.pips, lay.labelW);
}

/* Параметры ленты (ступень/ширина/звёзды) — одни и те же для бейка и для
   кадра. Вынесены, чтобы ключ кэша совпадал до пикселя. */
let victoryRibLayCache = null;
let victoryRibLayKey = "";
function victoryRibbonLayout(tier, lvl) {
  const tr = tier || victoryBeat.tier;
  const lv = lvl == null ? victoryBeat.lvl : lvl;
  const key = tr + ":" + (lv | 0) + ":" + visW + "x" + visH;
  if (victoryRibLayCache && victoryRibLayKey === key) return victoryRibLayCache;
  let rp = phone
    ? clamp(Math.min(visW, visH) * 0.062, 20, 34)
    : clamp(Math.min(visW, visH) * 0.046, 14, 30);
  const label = bossTierMeta(tr).name + " БОСС";
  ctx.save();
  stingTrack("0.14em");
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  let labelW = 0;
  let pad = 0;
  /* Лента обязана влезть в кадр целиком даже с увеличенным кеглем: если подпись
     с полями шире экрана, аккуратно уменьшаем кегль, а не режем края. */
  for (let guard = 0; guard < 24; guard++) {
    ctx.font = "800 " + (rp | 0) + "px Unbounded, Manrope, sans-serif";
    labelW = ctx.measureText(label).width;
    pad = Math.ceil(rp * 0.3 + 8);
    if (labelW + rp * 2.4 + pad * 2 <= visW * 0.94 || rp <= 12) break;
    rp *= 0.96;
  }
  ctx.restore();
  stingTrack("0px");
  const pips = lv | 0;
  const rw = labelW + rp * 2.4;
  victoryRibLayCache = { rp: rp, label: label, labelW: labelW, pips: pips, rw: rw, rh: rp * 1.9 };
  victoryRibLayKey = key;
  return victoryRibLayCache;
}

/* Точка входа: вызывается из frame.js там же, где drawBossSting, — сцена идёт
   поверх мира и под общим затемнением кадра. */
function drawBossVictory() {
  if (!(game.victory > 0) || !(visW > 0) || !victoryBeat || !(knifeH > 0)) return;
  const t = game.victoryT || 0;
  const step = victoryBeat.step;
  const g = victoryGeom();
  /* слово и ленту печём в первом кадре сцены (кадр всё равно уходит на
     затемнение), а не в момент штампа: там любой рывок виден лучше всего */
  if (!victoryBeat.__wb) {
    victoryBeat.__wb = 1;
    const sheet = victoryWordSheet(victoryBeat.tier, tierInk(victoryBeat.tier), victoryWordPx(), victoryBeat.lvl);
    const lay = victoryRibbonLayout();
    const rs = victoryRibbonSheet(victoryBeat.tier, victoryRibbonInk(victoryBeat.tier), lay.label, lay.rw, lay.rh, lay.rp, lay.pips, lay.labelW);
    /* первый блит нового полотна — загрузка текстуры в GPU; платим её в первом
       кадре сцены (под затемнением), а не в моменты штампа и ленты */
    const a = ctx.globalAlpha;
    ctx.globalAlpha = 0.006;
    ctx.drawImage(sheet.canvas, g.cx - sheet.w * 0.5, g.wordY - sheet.h * 0.5, sheet.w, sheet.h);
    if (sheet.flash) ctx.drawImage(sheet.flash, g.cx - sheet.w * 0.5, g.wordY - sheet.h * 0.5, sheet.w, sheet.h);
    ctx.drawImage(rs.c, g.cx - rs.w * 0.5, g.ribbonY - rs.h * 0.5, rs.w, rs.h);
    /* режим lighter включается впервые на ударе — прогреваем его здесь */
    const op = ctx.globalCompositeOperation;
    ctx.globalCompositeOperation = "lighter";
    ctx.fillRect(g.cx, g.wordY, 2, 2);
    ctx.globalCompositeOperation = op;
    ctx.globalAlpha = a;
  }
  const fade = victoryFadeU(t, step);
  const live = 1 - fade * fade;
  const veil = clamp(t / 0.12, 0, 1) * (1 - fade * 0.5);
  const jolt = victoryDrop ? victoryJolt : 0;

  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  /* мир гаснет: пелена и виньетка одним готовым блитом */
  drawSceneBackdrop(g.cx, g.gy - visH * 0.12, visH * 0.1,
    Math.max(visW, visH) * 0.75, 0.5, "10,2,6", 0.82, 60, veil);

  drawVictoryCore(g, jolt, live);
  drawVictoryKnife(g, t, step, live);
  drawVictoryTitle(g, t, step, live);
  ctx.restore();
  stingTrack("0px");
}
