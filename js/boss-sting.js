/* ---------- boss intro, Knife Hit sting ----------
   Простая версия: два меча сходятся, вспышка, лента «БОСС», слово редкости —
   и бревно проступает. Без свиты клинков, искр, молний, разлётных штрихов,
   стягивающихся частиц и звёзд-пипсов: только крупные формы и цвет ступени.
   Так вступление читается так же ясно, но не грузит слабые телефоны. */
const STING_HIT = 0.38;

const stingSparks = [];
const stingRings = [];
const stingMotes = [];
/* Свита ножей: клинки, что слетаются к центру у редкого / легендарного / тайного
   босса. Свои списки — у них своя жизнь (полёт, замок, дрейф), и считать их
   вместе с кольцами штампа нельзя: у обычного босса свиты нет вовсе. */
const stingGuards = [];
const stingGuardRings = [];
/* Эпическая «обвязка» вступления (редкий / легендарный / тайный): молнии, разлётные
   штрихи удара и искры, что стягиваются в центр на накате. Обычный босс их не рождает:
   ступень 0 обходится, как и раньше, парой искр и одним кольцом. */
const stingBolts = [];
const stingStreaks = [];
const stingSuction = [];
let stingBoltT = 0;
let stingFlash = 0;
let stingRareFlash = 0;
let stingRareHit = 0;
let stingRareKind = 0;
let stingBeat = null;
let raritySheet = null;

/* Слабый телефон: сцену босса не убираем, но искр/лучей/двойников мечей
   меньше — на старом GPU это заметная доля кадра вступления. */
function stingLow() {
  return !!(typeof window !== "undefined" && window.GAME_LOW_END);
}
/* Сколько пикселей буфера занимает текущая надпись. Полотно только растёт (см.
   rarityBuffer), поэтому рисовать надо ровно этот кусок: иначе короткая надпись
   после широкой вставляется сжатой и приплюснутой. */
let raritySheetW = 2;
let raritySheetH = 2;

function clearBossSting() {
  game.sting = 0;
  game.stingT = 0;
  game.stingHit = 0;
  game.stingWhoosh = 0;
  game.stingCharge = 0;
  stingFlash = 0;
  stingRareFlash = 0;
  stingRareHit = 0;
  stingRareKind = 0;
  stingBeat = null;
  stingSparks.length = 0;
  stingRings.length = 0;
  stingMotes.length = 0;
  stingBolts.length = 0;
  stingStreaks.length = 0;
  stingSuction.length = 0;
  stingGuards.length = 0;
  stingGuardRings.length = 0;
  stingBoltT = 0;
}

/* Тайминг вступления по ступеням редкости: индекс 0 — обычный, 3 — тайный.
   Чем выше ступень, тем дольше пауза после того, как мечи сошлись, и тем позже
   впечатывается слово редкости.
   rareAt — момент штампа надписи; charge — сколько секунд до него идёт «накат»
   (лучи подрастают, ореол сжимается к центру); from — с какого размера влетает
   надпись; hold — сколько она держится; pop — когда в кадре появляется бревно:
   под мечами его нет вовсе, поэтому появление отложено к концу вступления — но не
   к последнему кадру: за STING_LOG_LEAD секунд до конца оно проступает и к концу
   вступления уже стоит в полный рост. Иначе после мечей кадр пустовал, и бой
   начинался с задержкой; dur — вся длительность; veilOut — когда гаснет затемнение. */
const STING_LOG_LEAD = 0.42;
const STING_STEPS = [
  /* common */ { dur: 1.86, rareAt: 0.64, hold: 1.45, pop: 1.51, veilOut: 1.55, from: 1.14, charge: 0 },
  /* rare   */ { dur: 1.94, rareAt: 0.70, hold: 1.53, pop: 1.59, veilOut: 1.63, from: 1.16, charge: 0.22 },
  /* legend */ { dur: 2.01, rareAt: 0.76, hold: 1.60, pop: 1.66, veilOut: 1.70, from: 1.18, charge: 0.26 },
  /* secret */ { dur: 2.08, rareAt: 0.82, hold: 1.67, pop: 1.73, veilOut: 1.77, from: 1.20, charge: 0.30 }
];

function stingStepIndex(tier) {
  if (tier === "secret") return 3;
  if (tier === "legend") return 2;
  if (tier === "rare") return 1;
  return 0;
}

function makeStingBeat() {
  const tier = bossTierOf(game.log && game.log.boss);
  const level = stingStepIndex(tier);
  const s = STING_STEPS[level];
  return {
    tier,
    level,
    epic: level > 0,
    dur: s.dur,
    rareAt: s.rareAt,
    hold: s.hold,
    pop: s.pop,
    veilOut: s.veilOut,
    from: s.from,
    charge: s.charge
  };
}

/* Прогрев сцены босса в меню. Первое вступление босса на телефоне пекло
   полноэкранную пелену+виньетку, слово «БОСС» и меч прямо в анимации — по
   замерам это до 0.3–0.7 с рывков (tools/_perf_phone.js, STING/PLAY). Всё это
   не зависит от босса, только от размера экрана, поэтому печём один раз, пока
   игрок в меню. Если он уже начал забег — не трогаем кадр: успеется на месте. */
function warmStingAssets() {
  if (warmStingStep >= 3) return;
  if (typeof game !== "undefined" && (game.sting > 0 || game.victory > 0)) {
    setTimeout(warmStingAssets, 500);
    return;
  }
  /* Слово «БОСС» печём только настоящим шрифтом: если он ещё едет, подождём —
     иначе в кэш попадёт запасной и останется там до смены кегля. */
  if (warmStingStep === 1 && typeof document !== "undefined" && document.fonts && document.fonts.status === "loading") {
    setTimeout(warmStingAssets, 300);
    return;
  }
  if (!ctx || typeof game === "undefined" || !game.log || !(visW > 0)) return;
  const savedCtx = ctx;
  const pair = makeCanvas(2, 2);
  ctx = pair[1];
  try {
    if (warmStingStep === 0) {
      const cx = cropX + visW * 0.5;
      const cy = cropY + visH * 0.5;
      drawSceneBackdrop(cx, cy, visH * 0.12, Math.max(visW, visH) * 0.72,
        0.55, "10,2,6", 0.8, 48, 1);
    } else if (warmStingStep === 1) {
      const titlePx = clamp(Math.min(visW, visH) * 0.132, 52, 118);
      stingWordSheet(titlePx);
    } else if (warmStingStep === 2) {
      const kim = knifeImg();
      const swordH = clamp(Math.min(visW, visH) * 0.76, 360, 700);
      if (kim) stingKnifeSprite(kim, swordH * 1.22);
    }
  } catch (err) {}
  ctx = savedCtx;
  releaseCanvas(pair[0]);
  warmStingStep++;
  if (warmStingStep < 3) setTimeout(warmStingAssets, 240);
}
let warmStingStep = 0;
/* Перезапуск прогрева на входе в меню: после смены ножа меч нужно перепечь,
   а пелена/слово — просто быстрые проверки кэша. */
function armStingWarm() {
  warmStingStep = 0;
  warmStingAssets();
}

function beginBossSting() {  clearBossSting();
  stingBeat = makeStingBeat();
  game.sting = stingBeat.dur;
  /* Сцена без частиц: ничего не печём и не грузим в кадре. Буферы удара и
     разлома пекутся обычным путём (меню/загрузка), а в бою звук собирается
     на месте — это дешевле, чем заводить OfflineAudioContext прямо во время
     вступления и ронять кадр. */
  /* Дорогие полотна (слово «БОСС», клинок, надпись редкости) готовим СРАЗУ,
     до первого кадра сцены. Иначе первый блит приходится ровно на удар или на
     штамп — и вступление дёргается на слабом телефоне. */
  if (typeof ctx !== "undefined" && ctx && visW > 0) {
    try {
      const titlePx = clamp(Math.min(visW, visH) * 0.132, 52, 118);
      const swordH = clamp(Math.min(visW, visH) * 0.76, 360, 700);
      stingWordSheet(titlePx);
      const kim = knifeImg();
      if (kim) stingKnifeSprite(kim, swordH * 1.22);
      rarityPrebake(stingBeat, titlePx, cropX + visW * 0.5, cropY + visH * 0.5);
    } catch (err) {}
  }
  /* бревно босса проступает ПОСЛЕ вступления (STING_STEPS: pop), поэтому и
     бросок открывается вместе с ним, а не раньше */
  game.intro = stingBeat.dur;
  game.log.scale = 0.001;
}

function stingPopAt() {
  return (stingBeat && stingBeat.pop) || 2.65;
}

/* ---------- свита ножей: редкость видно по клинкам ----------
   Обычный босс оставляет в кадре только два меча, что сошлись. У редкого,
   легендарного и тайного к ним слетает свита — 2 / 4 / 6 клинков. Они входят
   по СВОЕЙ оси, сверху и с углов, и встают остриём в ту же точку, где сошлись
   главные мечи: вокруг «БОСС» раскрывается веер клинков. Свита приходит ДО
   штампа редкости — пока игра «накатывает», игрок уже видит, что клинков
   больше двух, поэтому слово редкости ложится на готовое удивление, а не
   создаёт его с нуля. */
function stingGuardCount(level) {
  return level >= 3 ? 6 : level === 2 ? 4 : level === 1 ? 2 : 0;
}

/* Углы веера в радианах от вертикали: пара на каждую ступень. 0.8 — угол
   главных мечей, поэтому свита встаёт между ними (0.2…0.6) и по краям
   (1.05…1.1), а не поверх: так веер видно над плашкой «БОСС». */
function stingGuardAngles(level) {
  if (level >= 3) return [0.22, -0.22, 0.6, -0.6, 1.08, -1.08];
  if (level === 2) return [0.3, -0.3, 1.05, -1.05];
  if (level === 1) return [0.55, -0.55];
  return [];
}

function stingSpawnGuards(beat) {
  if (!beat || !(visW > 0) || stingGuardCount(beat.level) <= 0 || stingGuards.length) return;
  const sh = clamp(Math.min(visW, visH) * 0.76, 360, 700);
  const angles = stingGuardAngles(beat.level);
  /* приходят между ударом мечей и штампом: последний клинок встаёт за 0.26 с
     до слова — ровно когда начинается накат */
  const first = STING_HIT + 0.08;
  const tail = Math.max(0.28, beat.rareAt - 0.26 - first);
  const reach = Math.hypot(visW, visH) * 0.62 + sh * 0.5;
  for (let i = 0; i < angles.length; i++) {
    const u = angles.length > 1 ? i / (angles.length - 1) : 0;
    const dir = i % 2 ? 1 : -1;
    stingGuards.push({
      a: angles[i],
      at: first + tail * u,
      dur: 0.26,
      h: sh * 0.40,
      fly: reach,
      swing: dir * (0.55 + beat.level * 0.12),
      spin: dir * (1.2 + beat.level * 0.3),
      seed: rand(0, TWO_PI),
      lvl: beat.level | 0,
      locked: false
    });
  }
}

function stingCenterX() {
  return cropX + visW * 0.5;
}

function stingCenterY() {
  return cropY + visH * 0.5;
}

/* Поза клинка свиты: летит из-за кромки кадра по собственной оси, остриём
   вперёд, и встаёт в точку удара. После замка чуть вздрагивает на месте —
   веер живой, но слово не заслоняет. */
function stingGuardPose(g, elapsed) {
  const t = elapsed - g.at;
  if (t < 0 || !(visW > 0)) return null;
  const u = clamp(t / g.dur, 0, 1);
  const e = easeOutCubic(u);
  const rot = Math.PI + g.a + (1 - e) * g.swing + (1 - e) * g.spin;
  const off = t < g.dur ? g.fly * (1 - e) : Math.sin(elapsed * 24 + g.seed) * 1.4;
  const hold = (stingBeat && stingBeat.hold) || 1.14;
  const out = elapsed < hold ? 0 : clamp((elapsed - hold) / 0.3, 0, 1);
  return {
    x: stingCenterX() - Math.sin(rot) * off,
    y: stingCenterY() + Math.cos(rot) * off,
    rot: rot,
    h: g.h * (0.86 + 0.14 * e),
    alpha: clamp(u * 2.2, 0, 1) * (1 - out * out),
    u: u
  };
}

/* Клинок встал: короткое кольцо по цвету редкости, искры с клинка, толчок
   кадра и свой призвук. Сверкает не точка удара (она общая), а середина
   клинка — веер вспыхивает по очереди. Чем выше ступень, тем слышнее замок. */
function stingGuardLock(g) {
  const beat = stingBeat;
  if (!beat) return;
  const ink = tierInk(beat.tier);
  const p = stingGuardPose(g, game.stingT || 0);
  if (!p) return;
  const gx = p.x - Math.sin(p.rot) * p.h * 0.42;
  const gy = p.y + Math.cos(p.rot) * p.h * 0.42;
  stingGuardRings.push({
    x: gx, y: gy, r: Math.max(3, p.h * 0.05), vr: 150 + g.lvl * 40,
    a: 0.8, fade: 3.4, w: 2.6, col: ink.rgb
  });
  const n = 4 + g.lvl;
  for (let i = 0; i < n; i++) {
    const a = rand(0, TWO_PI);
    const sp = rand(40, 150 + g.lvl * 40);
    const life = rand(0.2, 0.42);
    stingMotes.push({
      x: gx, y: gy,
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      life, max: life,
      sz: rand(1.2, 2.6), rot: rand(0, TWO_PI), vr: rand(-6, 6),
      col: i % 3 === 0 ? ink.hot : ink.mid, kind: "dot"
    });
  }
  shakeCanvas(1.6 + g.lvl * 1.1);
  Sfx.stingGuard(g.lvl, stingGuards.indexOf(g));
}

function stepStingGuards(elapsed) {
  if (!stingGuards.length || !stingBeat) return;
  for (let i = 0; i < stingGuards.length; i++) {
    const g = stingGuards[i];
    if (g.locked || elapsed < g.at + g.dur) continue;
    g.locked = true;
    stingGuardLock(g);
  }
}

function tierInk(id) {
  if (id === "rare") return {
    rgb: "255,210,63", hot: "#fff8d6", mid: "#ffd23f", deep: "#8a6408", edge: "#ffea9e"
  };
  if (id === "legend") return {
    rgb: "192,124,255", hot: "#f5e8ff", mid: "#c07cff", deep: "#4e1c96", edge: "#e4caff"
  };
  if (id === "secret") return {
    rgb: "255,68,68", hot: "#ffdede", mid: "#ff4444", deep: "#8a1212", edge: "#ffb0b0"
  };
  return {
    rgb: "205,198,184", hot: "#f6f1e8", mid: "#cdc6b8", deep: "#3e3932", edge: "#efe8dc"
  };
}

/* Цвет ленты «БОСС»: у обычного прежний багровый, у редких — свой на ступень
   (золото / фиолет / алый). Лента — самая большая плашка кадра, поэтому даже
   она меняется: редкий босс не может выглядеть как обычный. */
function stingRibbonInk(level) {
  if (level >= 3) return ["#ff7a5c", "#b21512", "#2a0404", "#ffc79a"];
  if (level === 2) return ["#e3c2ff", "#7d2fd0", "#2c0d52", "#f0ddff"];
  if (level === 1) return ["#ffe9a3", "#d9a217", "#5c3d04", "#fff4c8"];
  return ["#d24a58", "#9a2030", "#5c101c", "#f3d48a"];
}

/* Звёзды-пипсы в ленте: ступень видно и без чтения слова — одна звезда у
   редкого, две у легендарного, три у тайного, на каждой стороне от подписи. */
function drawRibbonStars(count, textW, margin, rh, col) {
  const n = count | 0;
  if (n <= 0 || rh <= 0 || margin <= 1) return;
  const r = Math.min(rh * 0.18, margin * 0.2);
  if (r < 1.2) return;
  const gap = r * 2.25;
  const fits = Math.min(n, Math.max(0, Math.floor((margin - r * 1.2) / gap) + 1));
  if (!fits) return;
  ctx.save();
  ctx.fillStyle = col;
  for (let s = -1; s <= 1; s += 2) {
    for (let i = 0; i < fits; i++) {
      const x = s * (textW * 0.5 + margin * 0.5 + (i - (fits - 1) * 0.5) * gap);
      ctx.save();
      ctx.translate(x, 0);
      traceSparkle(r);
      ctx.fill();
      ctx.restore();
    }
  }
  ctx.restore();
}

function stingVeil(elapsed) {
  const outAt = (stingBeat && stingBeat.veilOut) || 2.45;
  if (elapsed < 0.2) return elapsed / 0.2;
  if (elapsed < outAt) return 1;
  return clamp(1 - (elapsed - outAt) / 0.22, 0, 1);
}

function stingPose(side, elapsed) {
  const rest = -side * 0.8;
  let slide = 1;
  let rot = -side * 1.22;
  let alpha = 0;
  let rush = 1;
  let zoom = 1;
  if (elapsed < STING_HIT) {
    const u = clamp((elapsed - 0.02) / (STING_HIT - 0.02), 0, 1);
    /* Разгон, а не торможение: мечи видны сразу у краёв и влетают в удар. */
    const e = u * u * u;
    slide = 0.42 - e * 0.46;
    rot = lerp(-side * 1.36, rest, e);
    alpha = clamp((elapsed - 0.02) / 0.06, 0, 1);
    rush = 1 - e * 0.85;
  } else if (elapsed >= STING_HIT && elapsed < STING_HIT + 0.24) {
    const u = (elapsed - STING_HIT) / 0.24;
    const kick = Math.sin(u * Math.PI);
    slide = -kick * 0.085;
    rot = rest + kick * side * 0.06;
    alpha = 1;
    rush = (1 - u) * 0.6;
    zoom = 1 + kick * 0.1;
  } else if (elapsed >= STING_HIT + 0.24 && elapsed < ((stingBeat && stingBeat.hold) || 2.10)) {
    /* После удара мечи «дышат» — сцена не застывает в картинку. */
    slide = 0;
    rot = rest + Math.sin(elapsed * 3.1 + side * 1.3) * 0.012
      + Math.sin(elapsed * 23 + side * 1.7) * 0.003;
    alpha = 1;
    rush = 0;
    zoom = 1 + Math.sin(elapsed * 2.2 + side) * 0.012;
  } else if (elapsed >= ((stingBeat && stingBeat.hold) || 2.10)) {
    const hold = (stingBeat && stingBeat.hold) || 1.30;
    const u = clamp((elapsed - hold) / 0.15, 0, 1);
    slide = 0;
    rot = rest;
    alpha = 1 - u * u;
    rush = 0;
    zoom = 1 + u * 0.1;
  }
  return { slide, rot, alpha, rush, zoom };
}

function spawnStingHit(x, y, level) {
  /* Удар: вспышка и две волны — быстрая белая и медленная тёплая. */
  stingFlash = 1;
  stingRings.push({ r: 12, vr: 980, a: 0.95, fade: 3.6, w: 6, col: "255,250,240" });
  stingRings.push({ r: 22, vr: 540, a: 0.7, fade: 2.2, w: 3, col: "255,214,150" });
}

/* ---------- эпическая обвязка удара ----------
   Молнии (stingBolts), разлётные штрихи (stingStreaks) и стягивающиеся искры
   (stingSuction) рождаются только у редкого / легендарного / тайного босса. Точки
   зазубрин заморожены при рождении, поэтому разряд дрожит кадром, но не телепается
   на месте. */

/* Молния: ломаная из центра. kind «charge» — короткие разряды наката, «impact» —
   длинный хлёсткий разряд в миг штампа. */
function spawnStingBolts(x, y, tier, kind) {
  const lvl = stingStepIndex(tier);
  if (lvl <= 0) return;
  const ink = tierInk(tier);
  const impact = kind === "impact";
  let n = impact ? (lvl >= 3 ? 9 : lvl === 2 ? 7 : 5) : (2 + lvl);
  if (phone) n = Math.max(2, Math.round(n * 0.6));
  const reach = Math.max(visW, visH);
  for (let i = 0; i < n; i++) {
    const a = rand(0, TWO_PI);
    const len = reach * rand(0.24, impact ? 0.6 : 0.4) * (1 + lvl * 0.05);
    const seg = 5 + lvl;
    const jag = [];
    for (let s = 0; s <= seg; s++) jag.push(rand(-1, 1) * len * 0.075);
    const life = impact ? rand(0.16, 0.3) : rand(0.12, 0.26);
    stingBolts.push({
      x, y, a, len, jag, seg,
      life, max: life,
      w: (impact ? 2.2 : 1.4) + lvl * 0.5,
      col: i % 4 === 0 ? ink.edge : ink.mid,
      hot: i % 3 === 0
    });
  }
}

/* Разлётные штрихи: короткие яркие лучи, что проносятся от центра наружу и гаснут.
   Именно они дают стуку «скорость» — видно, как волна расходится по кадру. */
function spawnStingStreaks(x, y, tier) {
  const lvl = stingStepIndex(tier);
  if (lvl <= 0) return;
  const ink = tierInk(tier);
  const n = stingLow() ? 7 + lvl * 2 : phone ? 10 + lvl * 4 : 18 + lvl * 8;
  const reach = Math.max(visW, visH);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TWO_PI + rand(-0.12, 0.12);
    const sp = rand(0.9, 1.9) * reach;
    const life = rand(0.16, 0.34);
    stingStreaks.push({
      x, y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      len: rand(0.06, 0.16) * reach,
      life, max: life,
      col: i % 3 === 0 ? ink.hot : ink.mid
    });
  }
}

/* Накат: иголки стягиваются к центру — игра «втягивает» удар, прежде чем впечатать
   слово. Рождаются по кромке кадра и ускоряются вовнутрь. */
function spawnStingSuction(x, y, tier) {
  const lvl = stingStepIndex(tier);
  if (lvl <= 0) return;
  const ink = tierInk(tier);
  const n = stingLow() ? 4 + lvl * 2 : phone ? 6 + lvl * 3 : 12 + lvl * 5;
  const reach = Math.max(visW, visH) * 0.6;
  for (let i = 0; i < n; i++) {
    const a = rand(0, TWO_PI);
    const d = reach * rand(0.85, 1.3);
    const life = rand(0.34, 0.6);
    stingSuction.push({
      x: x + Math.cos(a) * d,
      y: y + Math.sin(a) * d,
      tx: x, ty: y,
      life, max: life,
      len: rand(9, 24),
      col: i % 3 === 0 ? ink.hot : ink.mid
    });
  }
}

function stepStingBits(dt) {
  let n = 0;
  for (let i = 0; i < stingSparks.length; i++) {
    const s = stingSparks[i];
    s.life -= dt;
    if (s.life <= 0) continue;
    s.vy += 90 * dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.vx *= 0.985;
    s.vy *= 0.985;
    stingSparks[n++] = s;
  }
  stingSparks.length = n;
  for (let i = stingRings.length - 1; i >= 0; i--) {
    const r = stingRings[i];
    r.r += r.vr * dt;
    r.a -= dt * r.fade;
    if (r.a <= 0) stingRings.splice(i, 1);
  }
  /* кольца свиты живут своей жизнью: у них есть своя точка в кадре */
  for (let i = stingGuardRings.length - 1; i >= 0; i--) {
    const r = stingGuardRings[i];
    r.r += r.vr * dt;
    r.a -= dt * r.fade;
    if (r.a <= 0) stingGuardRings.splice(i, 1);
  }
  if (stingFlash > 0) stingFlash = Math.max(0, stingFlash - dt * 3.0);
  if (stingRareFlash > 0) stingRareFlash = Math.max(0, stingRareFlash - dt * (2.8 - stingRareKind * 0.42));
  let m = 0;
  for (let i = 0; i < stingMotes.length; i++) {
    const s = stingMotes[i];
    s.life -= dt;
    if (s.life <= 0) continue;
    s.vy += (s.kind === "star" ? -30 : 50) * dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.vx *= 0.982;
    s.vy *= 0.982;
    s.rot += s.vr * dt;
    stingMotes[m++] = s;
  }
  stingMotes.length = m;
  for (let i = stingBolts.length - 1; i >= 0; i--) {
    stingBolts[i].life -= dt;
    if (stingBolts[i].life <= 0) stingBolts.splice(i, 1);
  }
  for (let i = stingStreaks.length - 1; i >= 0; i--) {
    const s = stingStreaks[i];
    s.life -= dt;
    if (s.life <= 0) { stingStreaks.splice(i, 1); continue; }
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.vx *= 0.9;
    s.vy *= 0.9;
  }
  for (let i = stingSuction.length - 1; i >= 0; i--) {
    const s = stingSuction[i];
    s.life -= dt;
    if (s.life <= 0) { stingSuction.splice(i, 1); continue; }
    const k = Math.min(1, dt * (2.4 + (1 - s.life / s.max) * 6.5));
    s.x += (s.tx - s.x) * k;
    s.y += (s.ty - s.y) * k;
  }
}

function spawnRarityHit(x, y, tier) {
  /* Простое вступление: штамп — цветная вспышка и одно кольцо. Без искр,
     звёзд, штрихов и молний. */
  const ink = tierInk(tier);
  stingRareFlash = 1;
  stingRareKind = tier === "secret" ? 3 : tier === "legend" ? 2 : tier === "rare" ? 1 : 0;
  stingRings.push({ r: 16, vr: 520, a: 0.8, fade: 2.2, w: 4, col: ink.rgb });
}

function stepBossSting(dt) {
  if (!(game.sting > 0)) return;
  const beat = stingBeat || makeStingBeat();
  stingBeat = beat;
  game.stingT = (game.stingT || 0) + dt;
  const elapsed = game.stingT;
  if (elapsed >= beat.dur) {
    clearBossSting();
    /* Бревно к этому кадру уже выросло на месте (см. ниже): ни наплывать заново, ни
       ждать INTRO_DUR ему не нужно. Под мечами оно не крутилось (см. stepLogSpin
       в flow.js), а первый бросок игрок делает сразу, как ушло затемнение. */
    game.log.scale = 1;
    game.intro = 0;
    return;
  }
  game.sting = beat.dur - elapsed;
  game.intro = game.sting;
  if (!game.stingWhoosh && elapsed >= 0.06) {
    game.stingWhoosh = 1;
    Sfx.whoosh();
  }
  if (!game.stingHit && elapsed >= STING_HIT) {
    game.stingHit = 1;
    spawnStingHit(cropX + visW * 0.5, cropY + visH * 0.5, beat.level);
    Sfx.bossHit();
    shakeCanvas(17 + beat.level * 2);
    punchView(9 + beat.level * 3);
    buzz([18, 24, 12]);
  }
  /* Накат остался только звуком и светом: без разрядов и стягивающихся искр. */
  const chargeAt = beat.rareAt - beat.charge;
  if (beat.charge > 0 && !game.stingCharge && elapsed >= chargeAt) {
    game.stingCharge = 1;
    Sfx.stingCharge(beat.level);
  }
  if (!stingRareHit && elapsed >= beat.rareAt) {
    stingRareHit = 1;
    spawnRarityHit(cropX + visW * 0.5, cropY + visH * 0.5, beat.tier);
    Sfx.rarity(beat.tier);
    const mag = beat.level === 3 ? 15 : beat.level === 2 ? 12 : beat.level === 1 ? 9 : 4;
    shakeCanvas(mag);
    if (beat.level > 0) {
      punchView(5 + beat.level * 4);
      buzz(beat.level >= 2 ? [12, 22, 10] : [10, 16, 8]);
      game.flash = beat.level === 3 ? 0.5 : beat.level === 2 ? 0.4 : 0.28;
      game.flashCol = tierInk(beat.tier).rgb;
      game.flashK = 0.38 + beat.level * 0.06;
    }
  }
  /* Бревно проступает за STING_LOG_LEAD до конца вступления — мягким проявлением
     без перелёта (easeOutCubic), чтобы босс не «выпрыгивал» в кадр. Мечи к этому
     мигу уже ушли (hold + 0.45), затемнение сходит, а босс к концу вступления
     стоит в полный рост: бой начинается без паузы. */
  const popAt = stingPopAt();
  if (elapsed >= popAt) {
    const u = clamp((elapsed - popAt) / Math.max(0.001, beat.dur - popAt), 0, 1);
    game.log.scale = Math.max(0.001, easeOutCubic(u));
  } else {
    game.log.scale = 0.001;
  }
  stepStingBits(dt);
}

function stingTrack(value) {
  if ("letterSpacing" in ctx) ctx.letterSpacing = value;
}

/* Слово «БОСС» с четырьмя обводками и заливкой — самый дорогой текстовый
   фрагмент сцены: раньше он перерисовывался целиком каждый кадр. Печём один
   раз на кегль и плотность экрана, в кадре — один блит. */
let stingWordSpr = null;
let stingWordKey = "";
function stingWordSheet(titlePx) {
  const s = viewSx > 0 ? viewSx : 1;
  const px = Math.max(8, titlePx | 0);
  const key = px + "|" + s.toFixed(2);
  if (stingWordSpr && stingWordKey === key) return stingWordSpr;
  const scratch = makeCanvas(8, 8);
  const mg = scratch[1];
  mg.font = "800 " + px + "px Unbounded, Manrope, sans-serif";
  if ("letterSpacing" in mg) mg.letterSpacing = "0.06em";
  const tw = Math.max(px, mg.measureText("БОСС").width);
  releaseCanvas(scratch[0]);
  const padX = px * 0.3;
  /* с запасом: measureText может не учитывать letterSpacing, а слово рисуется
     с трекингом — иначе первая буква обрезается */
  const wWorld = tw * 1.25 + px * 1.2;
  const hWorld = px * 2.2;
  const cw = Math.max(8, Math.ceil(wWorld * s));
  const ch = Math.max(8, Math.ceil(hWorld * s));
  const pair = makeCanvas(cw, ch);
  const g = pair[1];
  g.setTransform(s, 0, 0, s, cw * 0.5, ch * 0.5);
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.lineJoin = "round";
  g.font = "800 " + px + "px Unbounded, Manrope, sans-serif";
  if ("letterSpacing" in g) g.letterSpacing = "0.06em";
  g.lineWidth = Math.max(8, px * 0.11);
  g.strokeStyle = "rgba(0,0,0,0.4)";
  g.strokeText("БОСС", 0, px * 0.04);
  g.lineWidth = Math.max(7, px * 0.09);
  g.strokeStyle = "#3a0c12";
  g.strokeText("БОСС", 0, 0);
  g.lineWidth = Math.max(3, px * 0.04);
  g.strokeStyle = "#f2d48a";
  g.strokeText("БОСС", 0, 0);
  g.fillStyle = "#fff8f1";
  g.fillText("БОСС", 0, 0);
  if (stingWordSpr) releaseCanvas(stingWordSpr.c);
  stingWordSpr = { c: pair[0], w: wWorld, h: hWorld, tw: tw, px: px, cw: cw, ch: ch };
  stingWordKey = key;
  return stingWordSpr;
}

function traceRibbon(w, h) {
  const tip = h * 0.48;
  ctx.beginPath();
  ctx.moveTo(-w / 2 + tip, -h / 2);
  ctx.lineTo(w / 2 - tip, -h / 2);
  ctx.lineTo(w / 2, 0);
  ctx.lineTo(w / 2 - tip, h / 2);
  ctx.lineTo(-w / 2 + tip, h / 2);
  ctx.lineTo(-w / 2, 0);
  ctx.closePath();
}

let stingKnifeId = 0;
const stingKnifeSprs = new Map();

/* Меч в сцене босса — тот же клинок 180×500, растянутый в 3–4 раза и с
   imageSmoothingQuality = "high" КАЖДЫЙ кадр (и у главных мечей, и у свиты,
   и у призрачных копий). На телефоне это дорогое бикубическое растяжение на
   миллионы пикселей в кадре. Поэтому масштабируем клинок в нужный размер ОДИН
   раз (тем же "high"), а в кадре просто кладём готовое полотно 1:1. */
function stingKnifeSprite(img, hWorld) {
  if (!img) return null;
  const sy = viewSy > 0 ? viewSy : 1;
  const h = Math.max(16, Math.round(hWorld * sy / 8) * 8);
  if (!img.__skId) img.__skId = ++stingKnifeId;
  const key = img.__skId + ":" + h;
  let s = stingKnifeSprs.get(key);
  if (s) return s;
  const w = Math.max(1, Math.round(h * (KNIFE_SRC_W / KNIFE_SRC_H)));
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d");
  g.imageSmoothingEnabled = true;
  /* "high" на телефоне — бикубика на кадр сцены; клинок в сцене и так в
     движении, medium визуально не отличить, а бейк дешевле в разы */
  g.imageSmoothingQuality = phone ? "medium" : "high";
  g.drawImage(img, 0, 0, w, h);
  s = c;
  stingKnifeSprs.set(key, s);
  if (stingKnifeSprs.size > 12) {
    const first = stingKnifeSprs.keys().next().value;
    const old = stingKnifeSprs.get(first);
    if (old) { old.width = 2; old.height = 2; }
    stingKnifeSprs.delete(first);
  }
  return s;
}

function drawStingSword(img, side, pose, h, cx, cy, dist) {
  if (!img || pose.alpha < 0.02) return;
  const zh = h * (pose.zoom || 1);
  const along = zh * 0.4;
  const bx = -along * Math.sin(pose.rot);
  const by = along * Math.cos(pose.rot);
  const ox = side * pose.slide * dist;
  const oy = pose.slide * dist * 0.3;
  const tipX = cx - bx + ox;
  const tipY = cy - by + oy;
  const w = zh * (KNIFE_SRC_W / KNIFE_SRC_H);
  /* Клинок в сцене «дышит» зумом (pose.zoom до 1.2), и раньше спрайт пекся
     заново на каждые 8 device-пикселей этой высоты — за одно вступление
     набегало до двух десятков больших полотен, и сцена дёргалась. Печём один
     спрайт на максимальный зум: в кадре он лишь слегка уменьшается (low-
     сглаживание), разницы не видно, а бейков на анимацию больше нет. */
  const spr = stingKnifeSprite(img, h * 1.22);
  if (!spr) return;
  /* Простая версия: без шлейфа из призрачных клинков. Два больших повёрнутых
     блита на кадр вместо шести — заметная экономия на слабом GPU. */
  const ghosts = 0;
  ctx.save();
  ctx.imageSmoothingQuality = "low";
  /* Шлейф тоже гасится плавно: жёсткий порог «rush > 0.08» выключал все четыре
     призрачных клинка в один кадр. */
  const ghostGain = clamp((pose.rush - 0.08) / 0.22, 0, 1)
                  * clamp((pose.alpha - 0.45) / 0.25, 0, 1);
  if (ghostGain > 0.001) for (let i = ghosts; i >= 1; i--) {
    const lag = i * 0.018 * pose.rush;
    const gx = tipX + side * lag * dist;
    const gy = tipY + lag * dist * 0.3;
    ctx.save();
    ctx.translate(snap(gx), snap(gy));
    ctx.rotate(pose.rot);
    if (side > 0) ctx.scale(-1, 1);
    ctx.globalAlpha = pose.alpha * (0.045 + (ghosts - i) * 0.028) * ghostGain;
    ctx.drawImage(spr, -w * 0.5, 0, w, zh);
    ctx.restore();
  }
  ctx.save();
  ctx.translate(snap(tipX), snap(tipY));
  ctx.rotate(pose.rot);
  if (side > 0) ctx.scale(-1, 1);
  ctx.globalAlpha = pose.alpha;
  /* Меч рисуется напрямую, одним drawImage. Раньше здесь на каждый кадр
     заново растрировался отдельный буфер с бегущим бликом (полотно высотой
     zh × DPR, до ~2100 px) — дважды за кадр, по 60 раз в секунду. На живой
     видеокарте это и давало пропадание мечей: полотно успевало переехать, а
     композитор показывал пустой кадр. Блик убран — он и мигал на клинке. */
  ctx.drawImage(spr, -w * 0.5, 0, w, zh);
  ctx.restore();
  ctx.restore();
}

function rarityBuffer(w, h, s) {
  if (!raritySheet) raritySheet = document.createElement("canvas");
  const W = Math.max(2, Math.ceil(w * s));
  const H = Math.max(2, Math.ceil(h * s));
  /* Полотно только растёт — пересоздание по кадру заставляет композитор терять
     содержимое: полотно переаллоцируется, и на живой видеокарте виден пустой
     кадр (та же беда, что была у буфера блика мечей). */
  if (raritySheet.width < W || raritySheet.height < H) {
    raritySheet.width = Math.max(raritySheet.width, W);
    raritySheet.height = Math.max(raritySheet.height, H);
  }
  raritySheetW = W;
  raritySheetH = H;
  const g = raritySheet.getContext("2d");
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, raritySheet.width, raritySheet.height);
  g.setTransform(s, 0, 0, s, 0, 0);
  return g;
}

/* ---------- надпись редкости: печётся один раз ----------
   Слово с четырьмя обводками и градиентом раньше перерисовывалось в буфер
   КАЖДЫЙ кадр (и буфер ещё и пересоздавался при смене размера) — на телефоне
   это и был рывок в момент штампа. Теперь печём две готовые картинки: обычную
   и белую (для вспышки), а блик накладываем поверх уже готовой копии. */
let raritySpr = null;
let raritySprKey = "";
let rarityScratch = null;

function rarityTextSheet(label, px, track, ink, tier, tw, bw, bh) {
  const s = viewSx > 0 ? viewSx : 1;
  const key = tier + "|" + (px | 0) + "|" + track + "|" + Math.round(tw) + "|" + s.toFixed(2);
  if (raritySpr && raritySprKey === key) return raritySpr;
  const pw = Math.max(2, Math.ceil(bw * s));
  const ph = Math.max(2, Math.ceil(bh * s));
  const pair = makeCanvas(pw, ph);
  const g = pair[1];
  g.setTransform(s, 0, 0, s, 0, 0);
  g.font = "900 " + (px | 0) + "px Unbounded, Manrope, sans-serif";
  if ("letterSpacing" in g) g.letterSpacing = track;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.lineJoin = "round";
  const ox = bw / 2;
  const oy = bh / 2;
  g.lineWidth = Math.max(8, px * 0.16);
  g.strokeStyle = "rgba(0,0,0,0.55)";
  g.strokeText(label, ox, oy + px * 0.035);
  g.lineWidth = Math.max(5, px * 0.095);
  g.strokeStyle = ink.deep;
  g.strokeText(label, ox, oy);
  g.lineWidth = Math.max(1.6, px * 0.032);
  g.strokeStyle = ink.edge;
  g.strokeText(label, ox, oy);
  const fill = g.createLinearGradient(0, oy - px * 0.55, 0, oy + px * 0.55);
  fill.addColorStop(0, ink.hot);
  fill.addColorStop(0.45, ink.mid);
  fill.addColorStop(1, ink.deep);
  g.fillStyle = fill;
  g.fillText(label, ox, oy);
  if (tier === "secret") {
    g.save();
    g.globalCompositeOperation = "destination-over";
    g.fillStyle = "#7ee0ff";
    g.fillText(label, ox - px * 0.08, oy);
    g.fillStyle = "#ff8ad4";
    g.fillText(label, ox + px * 0.08, oy);
    g.restore();
  }
  if (raritySpr) {
    releaseCanvas(raritySpr.c);
  }
  raritySpr = { c: pair[0], flash: null, w: bw, h: bh, pw, ph };
  raritySprKey = key;
  return raritySpr;
}

/* Блик: копия готовой надписи с белой полосой поверх (source-atop), чтобы
   свет шёл только по буквам. Копия живёт один кадр, зато полоса — это один
   прямоугольник, а не перерисовка слова с обводками. */
function raritySheen(sheet, x0, px) {
  if (!rarityScratch) rarityScratch = document.createElement("canvas");
  if (rarityScratch.width < sheet.pw || rarityScratch.height < sheet.ph) {
    rarityScratch.width = Math.max(rarityScratch.width, sheet.pw);
    rarityScratch.height = Math.max(rarityScratch.height, sheet.ph);
  }
  const g = rarityScratch.getContext("2d");
  const s = viewSx > 0 ? viewSx : 1;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = "source-over";
  g.globalAlpha = 1;
  g.clearRect(0, 0, rarityScratch.width, rarityScratch.height);
  g.drawImage(sheet.c, 0, 0);
  g.globalCompositeOperation = "source-atop";
  const sh = g.createLinearGradient(x0 * s, 0, (x0 + px * 0.85) * s, 0);
  sh.addColorStop(0, "rgba(255,255,255,0)");
  sh.addColorStop(0.5, "rgba(255,255,255,0.82)");
  sh.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = sh;
  g.fillRect(0, 0, sheet.pw, sheet.ph);
  g.globalCompositeOperation = "source-over";
  return rarityScratch;
}

function traceSparkle(r) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 4;
    const rad = i % 2 ? r * 0.28 : r;
    const x = Math.cos(a) * rad;
    const y = Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function rarityPose(elapsed, beat) {
  const t = elapsed - beat.rareAt;
  if (t < 0) return null;
  const lvl = beat.level | 0;
  /* Жёсткий штамп: слово влетает крупным и впечатывается, но без сплющивания. */
  const land = 0.20 + lvl * 0.02;
  const len = Math.max(0.001, land);
  const approach = easeOutBack(clamp(t / len, 0, 1));
  const from = beat.from != null ? Math.min(beat.from, 1.3) : 1.14;
  const scale = lerp(from, 1, approach);
  let alpha = clamp(t / (0.06 + lvl * 0.012), 0, 1);
  const out = elapsed < beat.hold ? 0 : clamp((elapsed - beat.hold) / 0.15, 0, 1);
  alpha *= 1 - out * out;
  return {
    alpha,
    sx: scale,
    sy: scale,
    flash: clamp(1 - t / (0.2 + lvl * 0.04), 0, 1),
    sheen: 0,
    lvl,
    t
  };
}

/* Размер и ширина надписи редкости. Одна функция на замер и на запекание:
   ключ кэша (px, track, tw) обязан совпадать до пикселя. */
function rarityLayout(beat, titlePx) {
  /* Замер дорогой (крупный шрифт + letterSpacing) — держим его на бите:
     сцена зовёт раскладку каждый кадр, пока слово в кадре. */
  if (beat.__lay && beat.__layPx === (titlePx | 0)) return beat.__lay;
  const label = bossTierMeta(beat.tier).name + " БОСС";
  const track = label.length > 12 ? "0.03em" : "0.12em";
  let px = titlePx * (label.length > 12 ? 0.62 : 0.72);
  ctx.save();
  ctx.font = "900 " + (px | 0) + "px Unbounded, Manrope, sans-serif";
  stingTrack(track);
  while (px > 18 && ctx.measureText(label).width > visW * 0.78) {
    px = Math.max(18, px * 0.92);
    ctx.font = "900 " + (px | 0) + "px Unbounded, Manrope, sans-serif";
  }
  const tw = ctx.measureText(label).width;
  ctx.restore();
  stingTrack("0px");
  const lay = { label: label, track: track, px: px, tw: tw };
  beat.__lay = lay;
  beat.__layPx = titlePx | 0;
  return lay;
}

/* Готовим надпись редкости в самом начале сцены, пока кадр ещё под затемнением:
   иначе холст слова собирался бы точно в момент штампа — самом заметном.
   И сразу один раз кладём его в кадр с прозрачностью 0.001: первый блит нового
   полотна загружает текстуру в GPU, и без прогрева эта загрузка приходится
   ровно на штамп (на телефоне — заметный рывок). */
function rarityPrebake(beat, titlePx, cx, cy) {
  if (!beat || beat.__rb) return;
  beat.__rb = 1;
  const lay = rarityLayout(beat, titlePx);
  const ink = tierInk(beat.tier);
  const pad = lay.px * 0.6;
  const bw = lay.tw + pad * 2;
  const bh = lay.px * 2.4;
  const sheet = rarityTextSheet(lay.label, lay.px, lay.track, ink, beat.tier,
    lay.tw, bw, bh);
  const y = cy + titlePx * 0.66 + lay.px * 0.72;
  const a = ctx.globalAlpha;
  const q = ctx.imageSmoothingQuality;
  ctx.imageSmoothingQuality = "high";
  ctx.globalAlpha = 0.006;
  ctx.drawImage(sheet.c, cx - bw * 0.5, y - bh * 0.5, bw, bh);
  ctx.imageSmoothingQuality = q;
  ctx.globalAlpha = a;
}

function drawRarityReveal(cx, cy, elapsed, beat, titlePx) {
  const pose = rarityPose(elapsed, beat);
  if (!pose || pose.alpha < 0.02) return;
  const ink = tierInk(beat.tier);
  const lay = rarityLayout(beat, titlePx);
  const label = lay.label;
  const track = lay.track;
  const px = lay.px;
  const tw = lay.tw;
  const y = cy + titlePx * 0.66 + px * 0.72;

  ctx.save();
  ctx.translate(cx, y);
  ctx.globalAlpha = pose.alpha;
  ctx.scale(pose.sx, pose.sy);

  /* Слово ложится поверх рукоятей мечей — без подложки буквы тонут в дереве.
     Плашка тонкая: держит контраст, но не спорит с лентой «БОСС». */
  const bandW = tw + px * 1.15;
  const bandH = px * 1.6;
  roundBar(-bandW * 0.5, -bandH * 0.5, bandW, bandH, bandH * 0.3);
  ctx.fillStyle = "rgba(12,5,8,0.62)";
  ctx.fill();
  ctx.strokeStyle = "rgba(" + ink.rgb + ",0.85)";
  ctx.lineWidth = Math.max(1.4, px * 0.045);
  ctx.stroke();

  const glowR = Math.max(tw, px * 4) * 0.7;
  const pulse = 0.32 + pose.flash * 0.45 + (beat.epic ? Math.sin(pose.t * 6) * 0.05 : 0);
  const glow = ctx.createRadialGradient(0, 0, px * 0.15, 0, 0, glowR);
  glow.addColorStop(0, "rgba(" + ink.rgb + "," + pulse + ")");
  glow.addColorStop(0.5, "rgba(" + ink.rgb + "," + (pulse * 0.32) + ")");
  glow.addColorStop(1, "rgba(" + ink.rgb + ",0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.ellipse(0, 0, glowR, px * 1.25, 0, 0, TWO_PI);
  ctx.fill();

  const pad = px * 0.6;
  const bw = tw + pad * 2;
  const bh = px * 2.4;
  const sheet = rarityTextSheet(label, px, track, ink, beat.tier, tw, bw, bh);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(sheet.c, -bw * 0.5, -bh * 0.5, bw, bh);
  ctx.restore();
}

function drawStingBolts() {
  if (!stingBolts.length) return;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (let i = 0; i < stingBolts.length; i++) {
    const b = stingBolts[i];
    const a = clamp(b.life / b.max, 0, 1);
    if (a <= 0) continue;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.a);
    ctx.globalAlpha = a;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (let s = 1; s <= b.seg; s++) {
      const t = s / b.seg;
      ctx.lineTo(b.len * t, b.jag[s] * (1 - t * 0.3));
    }
    ctx.lineWidth = b.w * a + 0.6;
    ctx.strokeStyle = "rgba(" + hexRgb(b.col) + ",0.85)";
    ctx.stroke();
    if (b.hot) {
      ctx.globalAlpha = a * 0.9;
      ctx.lineWidth = Math.max(0.8, b.w * 0.4);
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
}

function drawStingStreaks() {
  if (!stingStreaks.length) return;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";
  for (let i = 0; i < stingStreaks.length; i++) {
    const s = stingStreaks[i];
    const a = clamp(s.life / s.max, 0, 1);
    if (a <= 0) continue;
    const sp = Math.sqrt(s.vx * s.vx + s.vy * s.vy) || 1;
    const ux = s.vx / sp, uy = s.vy / sp;
    ctx.globalAlpha = a;
    ctx.strokeStyle = s.col;
    ctx.lineWidth = 1.4 + a * 2.6;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x - ux * s.len * (0.35 + a), s.y - uy * s.len * (0.35 + a));
    ctx.stroke();
  }
  ctx.restore();
}

function drawStingSuction() {
  if (!stingSuction.length) return;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";
  for (let i = 0; i < stingSuction.length; i++) {
    const s = stingSuction[i];
    const a = clamp(s.life / s.max, 0, 1);
    if (a <= 0) continue;
    const dx = s.tx - s.x, dy = s.ty - s.y;
    const l = Math.sqrt(dx * dx + dy * dy) || 1;
    ctx.globalAlpha = a * 0.9;
    ctx.strokeStyle = s.col;
    ctx.lineWidth = 1.5 + a * 2;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x + (dx / l) * s.len, s.y + (dy / l) * s.len);
    ctx.stroke();
  }
  ctx.restore();
}

/* Клинок свиты рисуется тем же спрайтом и с тем же «остриём в начале
   координат», что и главные мечи (drawStingSword), только без зеркала: он
   входит остриём внутрь, поэтому ось у него своя. */
function drawStingGuard(img, p) {
  if (!img || !p || p.alpha < 0.02) return;
  const w = p.h * (KNIFE_SRC_W / KNIFE_SRC_H);
  const spr = stingKnifeSprite(img, p.h);
  if (!spr) return;
  ctx.save();
  ctx.imageSmoothingQuality = "low";
  ctx.translate(snap(p.x), snap(p.y));
  ctx.rotate(p.rot);
  ctx.globalAlpha = p.alpha;
  ctx.drawImage(spr, -w * 0.5, 0, w, p.h);
  ctx.restore();
}

function drawStingGuardRings() {
  if (!stingGuardRings.length) return;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < stingGuardRings.length; i++) {
    const r = stingGuardRings[i];
    if (r.a <= 0.02) continue;
    ctx.globalAlpha = r.a;
    ctx.strokeStyle = "rgba(" + r.col + ",0.9)";
    ctx.lineWidth = Math.max(1, r.w * (1 - r.a * 0.5));
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.r, 0, TWO_PI);
    ctx.stroke();
  }
  ctx.restore();
}

/* Рамка редкости: цветная окантовка кадра. Включается на накате — ещё до
   слова, — и держится, пока держится вступление: редкость видно даже краем
   глаза, с первого кадра события. У обычного босса её нет. */
function drawStingFrame(ink, lvl, a) {
  if (a <= 0.02 || lvl <= 0 || !(visW > 0)) return;
  const al = clamp(a, 0, 1);
  const m = Math.max(5, Math.min(visW, visH) * 0.02);
  ctx.save();
  ctx.globalAlpha = al;
  ctx.lineJoin = "miter";
  ctx.strokeStyle = "rgba(" + ink.rgb + ",0.85)";
  ctx.lineWidth = m;
  ctx.strokeRect(cropX + m * 0.5, cropY + m * 0.5, visW - m, visH - m);
  ctx.globalAlpha = al * 0.5;
  ctx.strokeStyle = ink.hot;
  ctx.lineWidth = Math.max(1, m * 0.18);
  ctx.strokeRect(cropX + m * 1.4, cropY + m * 1.4, visW - m * 2.8, visH - m * 2.8);
  /* уголки: короткие толстые штрихи — рамка читается и на светлом фоне */
  const t = Math.min(visW, visH) * (0.06 + lvl * 0.012);
  ctx.globalAlpha = al;
  ctx.strokeStyle = ink.edge;
  ctx.lineWidth = Math.max(2.5, m * 0.42);
  ctx.lineCap = "round";
  const pts = [
    [cropX + m, cropY + m, 1, 1], [cropX + visW - m, cropY + m, -1, 1],
    [cropX + m, cropY + visH - m, 1, -1], [cropX + visW - m, cropY + visH - m, -1, -1]
  ];
  for (let i = 0; i < 4; i++) {
    const p = pts[i];
    ctx.beginPath();
    ctx.moveTo(p[0] + p[2] * t, p[1]);
    ctx.lineTo(p[0], p[1]);
    ctx.lineTo(p[0], p[1] + p[3] * t);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBossSting() {
  if (!(game.sting > 0) || !(visW > 0)) return;
  const elapsed = game.stingT || 0;
  const veil = stingVeil(elapsed);
  const cx = cropX + visW * 0.5;
  const cy = cropY + visH * 0.5;
  const bleed = 48;
  const titlePx = clamp(Math.min(visW, visH) * 0.132, 52, 118);
  const swordH = clamp(Math.min(visW, visH) * 0.76, 360, 700);
  const dist = Math.max(visW, visH) * 0.5;
  const beat = stingBeat || { tier: "common", level: 0, epic: false, rareAt: 0.92, hold: 2.10, from: 1.14, charge: 0 };
  const ink = tierInk(beat.tier);
  /* Лист редкости печём один раз и не в момент штампа. */
  if (elapsed >= Math.min(0.3, beat.rareAt - 0.2)) rarityPrebake(beat, titlePx, cx, cy);
  /* заранее масштабируем клинок для мечей: сама сцена только кладёт готовое */
  /* Клинок сцены: заранее печём ТОЛЬКО базовый размер. Остальные зум-варианты
     (0.7/1.2) пекутся по требованию позже — иначе первый кадр сцены делает
     три больших canvas-апскейла подряд. */
  if (!beat.__kn) {
    beat.__kn = 1;
    const kim = knifeImg();
    if (kim) stingKnifeSprite(kim, swordH);
  }
  const rareU = elapsed < beat.rareAt ? 0 : clamp((elapsed - beat.rareAt) / 0.12, 0, 1);
  const chargeWin = beat.charge || 0;
  const chargeAt = beat.rareAt - chargeWin;
  const chargeU = chargeWin > 0 ? clamp((elapsed - chargeAt) / chargeWin, 0, 1) : 0;
  /* Цвет сцены въезжает в редкость уже на накате, а не в момент штампа:
     к слову кадр уже золотой / фиолетовый / алый, и слово не «красит» его в
     последний миг, а подтверждает то, что игрок уже видит. */
  const tintU = chargeWin > 0
    ? (elapsed <= chargeAt ? 0 : clamp((elapsed - chargeAt) / (chargeWin + 0.25), 0, 1))
    : rareU;
  const boss = game.log.boss;
  const glow = (boss && boss.glow) || "196, 48, 42";
  const name = (boss && boss.name) || "";
  const gParts = glow.split(",");
  const tParts = ink.rgb.split(",");
  const auraRgb = [
    (+gParts[0] + (+tParts[0] - +gParts[0]) * tintU) | 0,
    (+gParts[1] + (+tParts[1] - +gParts[1]) * tintU) | 0,
    (+gParts[2] + (+tParts[2] - +gParts[2]) * tintU) | 0
  ].join(",");

  ctx.save();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";

  /* Пелена + виньетка одним готовым блитом (см. drawSceneBackdrop) */
  drawSceneBackdrop(cx, cy, visH * 0.12, Math.max(visW, visH) * 0.72,
    0.55, "10,2,6", 0.8, bleed, veil);

  if (stingFlash > 0.5) {
    ctx.fillStyle = "rgba(255, 236, 214," + ((stingFlash - 0.5) * 0.3) + ")";
    ctx.fillRect(cropX - bleed, cropY - bleed, visW + bleed * 2, visH + bleed * 2);
  }

  const hold = beat.hold;
  /* Лучи убраны совсем: остаётся только мягкий ореол вокруг мечей — большие
     формы без «звездопада» из тонких линий. */

  const aura = ctx.createRadialGradient(cx, cy, 8, cx, cy, swordH * 0.62);
  const auraHot = (0.42 + rareU * (beat.epic ? 0.28 : 0.08) + chargeU * 0.16)
    * (0.94 + Math.sin(elapsed * 4.2) * 0.06);
  aura.addColorStop(0, "rgba(" + auraRgb + "," + (auraHot * Math.max(veil, stingFlash, stingRareFlash)) + ")");
  aura.addColorStop(0.5, "rgba(" + auraRgb + "," + ((0.14 + rareU * 0.12) * veil) + ")");
  aura.addColorStop(1, "rgba(" + auraRgb + ",0)");
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(cx, cy, swordH * 0.62, 0, TWO_PI);
  ctx.fill();

  const inn = clamp((elapsed - STING_HIT) / 0.24, 0, 1);
  const out = elapsed < hold ? 0 : clamp((elapsed - hold) / 0.15, 0, 1);
  const titleA = (inn > 0 ? 1 : 0) * (1 - out);
  const punch = inn > 0 ? easeOutBack(inn) : 0;
  let titleScale = lerp(1.28, 1, punch);
  if (out > 0) titleScale = lerp(titleScale, 1.06, out * out);

  let titleW = beat.__tw;
  if (!titleW || beat.__twPx !== (titlePx | 0)) {
    ctx.font = "800 " + (titlePx | 0) + "px Unbounded, Manrope, sans-serif";
    stingTrack("0.04em");
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    titleW = ctx.measureText("БОСС").width;
    beat.__tw = titleW;
    beat.__twPx = titlePx | 0;
  }

  if (titleA > 0.02 && punch > 0.02) {
    const rcol = stingRibbonInk(beat.level);
    const rw = clamp(titleW + titlePx * 2.2, 180, visW * 0.92);
    const rh = titlePx * 1.22;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.globalAlpha = titleA;
    ctx.scale(Math.max(0.001, punch), 1);
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.translate(0, 7);
    traceRibbon(rw, rh);
    ctx.fill();
    ctx.translate(0, -7);
    /* Ровная плашка цвета ступени: без градиента, блика и звёзд. */
    ctx.fillStyle = rcol[1];
    traceRibbon(rw, rh);
    ctx.fill();
    ctx.lineJoin = "round";
    ctx.lineWidth = Math.max(2, titlePx * 0.035);
    ctx.strokeStyle = rcol[3];
    traceRibbon(rw, rh);
    ctx.stroke();
    ctx.restore();
  }

  const img = knifeImg();
  const left = stingPose(-1, elapsed);
  const right = stingPose(1, elapsed);
  drawStingSword(img, -1, left, swordH, cx, cy, dist);
  drawStingSword(img, 1, right, swordH, cx, cy, dist);

  /* Вспышка удара: крест света по мечам. Крупный и короткий — ради экшена,
     без мелкой крошки. */
  let cut = 0;
  if (elapsed >= STING_HIT) {
    const u = elapsed - STING_HIT;
    cut = u < 0.06 ? u / 0.06 : Math.max(0, 1 - (u - 0.06) / 0.34);
  }
  if (cut > 0.02) {
    ctx.save();
    ctx.lineCap = "round";
    const len = (0.35 + cut * 0.65) * Math.min(visW, visH) * 0.62;
    for (let s = -1; s <= 1; s += 2) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-s * 0.8);
      ctx.globalAlpha = cut * 0.9;
      ctx.fillStyle = "#fff6ea";
      ctx.fillRect(-7, -len, 14, len * 2);
      ctx.globalAlpha = cut;
      ctx.fillStyle = "#ffd78a";
      ctx.fillRect(-2.5, -len, 5, len * 2);
      ctx.restore();
    }
    ctx.restore();
  }
  for (let i = 0; i < stingRings.length; i++) {
    const r = stingRings[i];
    if (r.a <= 0) continue;
    ctx.beginPath();
    ctx.arc(cx, cy, r.r, 0, TWO_PI);
    ctx.strokeStyle = "rgba(" + r.col + "," + r.a + ")";
    ctx.lineWidth = r.w;
    ctx.stroke();
  }

  if (stingFlash > 0) {
    const rad = 18 + (1 - stingFlash) * 110;
    const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
    core.addColorStop(0, "rgba(255,252,246," + stingFlash + ")");
    core.addColorStop(0.35, "rgba(255,214,140," + (stingFlash * 0.65) + ")");
    core.addColorStop(1, "rgba(255,160,60,0)");
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, TWO_PI);
    ctx.fill();
  }

  if (titleA > 0.02) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(titleScale, titleScale);
    ctx.globalAlpha = titleA;
    const ws = stingWordSheet(titlePx);
    if (ws) ctx.drawImage(ws.c, -ws.w * 0.5, -ws.h * 0.5, ws.w, ws.h);
    ctx.restore();
  }

  if (titleA > 0.2) {
    const pomY = cy + swordH * 0.6 * Math.cos(0.8);
    ctx.save();
    ctx.globalAlpha = titleA;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (name) {
      const namePx = Math.max(18, titlePx * 0.26);
      const ny = Math.min(pomY + namePx * 0.7, cropY + visH - namePx * 1.8);
      ctx.font = "700 " + (namePx | 0) + "px Unbounded, Manrope, sans-serif";
      stingTrack("0.24em");
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillText(name, cx, ny + namePx * 0.08);
      ctx.fillStyle = "#ffe7b8";
      ctx.fillText(name, cx, ny);
    }
    ctx.restore();
  }

  if (stingRareFlash > 0) {
    const rf = stingRareFlash * stingRareFlash * (0.22 + stingRareKind * 0.06);
    ctx.fillStyle = "rgba(" + ink.rgb + "," + rf + ")";
    ctx.fillRect(cropX - bleed, cropY - bleed, visW + bleed * 2, visH + bleed * 2);
  }

  drawRarityReveal(cx, cy, elapsed, beat, titlePx);

  ctx.restore();
  stingTrack("0px");
}
