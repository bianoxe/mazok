const INTRO_DUR = 0.2;
const SHATTER_HANDOFF = 0.24;
/* Сколько секунд после смерти нож качается и гаснет, пока висит кнопка ролика
   (js/sim.js, js/draw-hud.js: drawDeathKnife). Ролик можно взять всё это время */
const DEATH_FADE = 5;
/* Пауза после смерти: секунду в кадре ещё идёт игра (бревно докатывается), и
   только потом разом появляется вся сцена — тёмный кадр, нож, вопрос и кнопка */
const DEATH_SCENE_DELAY = 1;
/* Сколько ещё ждать после появления сцены, прежде чем разрешить отказ: почти
   сразу — сцена уже показала нож и «возродиться за рекламу?», и игрок вправе
   уйти к окну смерти (js/sim.js, js/input.js). Кнопка «Нет, спасибо»
   появляется с той же анимацией */
const DEATH_SKIP_DELAY = 0.2;
/* предел доката бревна на экране смерти, радиан за кадр: 0.1 рад = 5.7°,
   то есть ~344°/с — оборот видно, но игла/пила/колесо уже не мигают */
const FAIL_COAST_TURN = 0.1;
const HAND_DRAW = 0.0425;
const THROW_MS = 50;
const PHYS_SLICE = 1 / 60;
const MAX_FRAME_DT = 0.1;

/* ---------- particles ---------- */
function burst(x, y, n, opt) {
  const cap = opt.cap != null ? opt.cap : (phone ? 22 : 180);
  const jx = opt.jx || 0;
  const jy = opt.jy || 0;
  const kind = opt.kind || "chip";
  const g = opt.g || 420;
  const colors = opt.colors;
  for (let i = 0; i < n; i++) {
    if (particles.length >= cap) break;
    const a = opt.a != null ? opt.a + rand(-opt.spread, opt.spread) : rand(0, TWO_PI);
    const sp = rand(opt.smin, opt.smax);
    const p = takePool(particlePool);
    p.x = x + (jx ? rand(-jx, jx) : 0);
    p.y = y + (jy ? rand(-jy, jy) : 0);
    p.vx = Math.cos(a) * sp;
    p.vy = Math.sin(a) * sp;
    p.life = rand(opt.lmin || 0.35, opt.lmax || 0.85);
    p.max = p.life;
    p.r = rand(opt.rmin, opt.rmax);
    p.rot = opt.align ? a : rand(0, TWO_PI);
    p.vr = opt.align ? rand(-2.4, 2.4) : rand(-8, 8);
    p.color = (colors && colors[i % colors.length]) || "#e8d2ae";
    p.g = g;
    p.kind = kind;
    particles.push(p);
  }
}

/* Яблоки летят от места подбора к счётчику яблок в углу: тот же полёт, что был
   у монет, — сначала подскок, потом дуга к цели (см. sim.js). */
function spawnApples(x, y, n) {
  for (let i = 0; i < n; i++) {
    const c = takePool(applePool);
    c.x = x + rand(-10, 10);
    c.y = y + rand(-8, 8);
    c.vx = rand(-80, 80);
    c.vy = rand(-220, -80);
    c.t = 0;
    c.delay = i * 0.04;
    c.gone = false;
    c._sx = 0;
    c._sy = 0;
    flyApples.push(c);
  }
}

/* ---------- половины разрезанного яблока ----------
   Яблоко под лезвием не пропадает: на его месте появляются две половины
   (js/wood.js: makeAppleHalf) и разлетаются в стороны. Нож всегда входит
   в кромку радиально, поэтому срез идёт по радиусу, а половины уходят по
   касательной — левая в одну сторону, правая в другую, — и обе падают.
   Размер и место те же, что у целого яблока (js/draw-stuck.js: logApplePose),
   поэтому в кадре разреза рисунок не дёргается: яблоко просто расходится. */
/* Сочность: яблоко под ножом не «расползается», а лопается. Половины
   выстреливают в стороны резко (как от пружины), кувыркаются в воздухе, а из
   среза бьёт сноп сока — быстрые струи, брызги-капли, светлая мякоть и мутное
   облачко. Скорости подобраны так, чтобы за первые 3–4 кадра (50–70 мс) разлёт
   успевал прочитаться на глаз: до этого момента половины почти не двигались, и
   удар выглядел вялым. */
const APPLE_HALF_LIFE = 0.72;   /* сколько половина живёт, с */
const APPLE_HALF_FADE = 0.18;   /* последние кадры она тает */
const APPLE_HALF_V = 430;       /* разлёт по касательной (вдоль среза), px/с */
const APPLE_HALF_OUT = 165;     /* и немного от бревна, px/с */
const APPLE_HALF_G = 1700;      /* тяжесть, px/с² */
const APPLE_HALF_SPIN = 7.6;    /* кувырок половины, рад/с */

/* Сок из среза. Отдельной функцией, чтобы разлёт половин и брызги читались
   как одно событие, но жили по своим правилам: струи летят вдоль среза (по
   rot), капли — веером по всей сцене, мякоть — медленнее и тяжелее, облачко —
   почти висит на месте. Цвета — те же, что у яблочных половин и сока
   (wood.js: makeAppleHalf), поэтому вспышка не выбивается из палитры. */
function splashAppleJuice(x, y, rot) {
  const juice = ["#ff3b2e", "#ff6b3d", "#c2181a", "#ffd166"];
  /* струи вдоль среза: вытянутые по скорости капли — самый «мокрый» слой */
  burst(x, y, phone ? 5 : 13, {
    a: rot, spread: 0.42,
    smin: 760, smax: 1320,
    rmin: 1.2, rmax: 2.6,
    colors: ["#ff5540", "#ff8a5c", "#e0261a"],
    g: 1750, kind: "chip", align: true,
    lmin: 0.16, lmax: 0.34,
    jx: 4, jy: 4
  });
  /* основной веер брызг поперёк среза — сок летит в обе стороны от лезвия */
  burst(x, y, phone ? 9 : 24, {
    a: rot, spread: 1.1,
    smin: 280, smax: 900,
    rmin: 1.8, rmax: 4.8,
    colors: juice,
    g: 1650, kind: "chip",
    lmin: 0.26, lmax: 0.6,
    jx: 5, jy: 5
  });
  /* мякоть: редкие светлые комочки, летят тяжелее и гаснут позже сока */
  burst(x, y, phone ? 3 : 8, {
    spread: TWO_PI,
    smin: 130, smax: 430,
    rmin: 3, rmax: 6.5,
    colors: ["#fff3d0", "#ffe0a8", "#f7e7c4"],
    g: 1500, kind: "chip",
    lmin: 0.4, lmax: 0.8
  });
  /* мутное облачко сока — вспышка «влаги» в первые кадры */
  burst(x, y, phone ? 3 : 7, {
    spread: TWO_PI,
    smin: 40, smax: 200,
    rmin: 12, rmax: 28,
    colors: ["#ffb3a0", "#ff7a5c", "#ffd9c2"],
    g: 40, kind: "dust",
    lmin: 0.26, lmax: 0.5
  });
}

/* ---------- куски яблока ----------
   Яблоко под ножом рвётся на куски: не только две половины, а ещё полтора
   десятка обломков — наружные с красной кожицей, внутренние со светлой
   мякотью. Куски идут через общий массив game.shards видом "chunk" (тот же,
   которым осыпается кокос и помидор, см. js/flow.js и drawShards в
   js/draw-hud.js): движок сам считает им полёт, кувырок и затухание, поэтому
   ничего нового рисовать не нужно. Размер берётся от яблока (APPLE_BODY × r),
   иначе на телефоне куски выглядели бы крупнее самого яблока. */
function spawnAppleChunks(x, y, rot) {
  const body = typeof APPLE_BODY === "number" ? APPLE_BODY : 0.42;
  const size = game.log.r * body;
  const tx = Math.cos(rot);
  const ty = Math.sin(rot);
  const n = phone ? 12 : 18;
  const skin = ["#b52a1e", "#8f1f16", "#cf3a24"];
  const flesh = ["#fff1cd", "#ffe3a8", "#f7e2b4", "#ffd9a0"];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TWO_PI + rand(-0.3, 0.3);
    const dist = size * rand(0.06, 0.5);
    const sp = rand(420, 980);
    const s = takePool(shardPool);
    const outer = i % 5 < 2;    /* каждый третий-второй кусок — с кожицей */
    s.kind = "chunk";
    s.x = x + Math.cos(a) * dist;
    s.y = y + Math.sin(a) * dist;
    /* летят и в стороны от яблока, и вдоль среза: нож рвёт его пополам */
    s.vx = Math.cos(a) * sp + tx * rand(-220, 220);
    s.vy = Math.sin(a) * sp * 0.82 + ty * rand(-220, 220) - rand(0, 140);
    s.rot = rand(0, TWO_PI);
    s.vr = rand(-24, 24);
    s.w = size * (outer ? rand(0.2, 0.42) : rand(0.26, 0.56));
    s.h = size * (outer ? rand(0.12, 0.24) : rand(0.14, 0.34));
    s.delay = rand(0, 0.035);
    s.age = 0;
    s.alpha = 1;
    s.scale = 1;
    s.fill = outer ? skin[i % skin.length] : flesh[i % flesh.length];
    s.dark = "#6a1810";
    s.outline = "#5a1810";
    s.sprite = null;
    s.atlas = null;
    if (s.knives) s.knives.length = 0;
    game.shards.push(s);
  }
}

/* rot — поворот спрайта яблока (logApplePose), d — как далеко оно стояло от
   центра бревна: с ним половины забирают и скорость вращения бревна, иначе
   разрезанное яблоко на глазах «замирало» бы в мире. */
function spawnAppleHalves(x, y, rot, d, kind) {
  const tx = Math.cos(rot);
  const ty = Math.sin(rot);
  const ox = ty;                /* наружу от бревна: радиус × касательная */
  const oy = -tx;
  const carry = (game.log.vel || 0) * 1000 * (d || 0);
  for (let i = 0; i < 2; i++) {
    const side = i ? 1 : -1;
    const h = takePool(appleHalfPool);
    h.side = side;
    h.kind = kind || "plain";
    h.x = x;
    h.y = y;
    h.rot = rot;
    /* рывок неравный: половины не «разъезжаются зеркально», а прыскают —
       у каждой свой разгон и свой подброс, иначе разрез выглядит механическим */
    const kick = APPLE_HALF_V * side * rand(0.82, 1.24);
    h.vx = tx * (carry + kick) + ox * APPLE_HALF_OUT * rand(0.7, 1.3) + rand(-26, 26);
    h.vy = ty * (carry + kick) + oy * APPLE_HALF_OUT * rand(0.7, 1.3) - rand(20, 90);
    h.spin = APPLE_HALF_SPIN * side * rand(0.8, 1.25);
    h.age = 0;
    h.a = 1;
    appleHalves.push(h);
  }
  /* сок бьёт ровно из среза, в тот же кадр, что и разлёт половин */
  splashAppleJuice(x, y, rot);
  spawnAppleChunks(x, y, rot);
}

/* Полёт половин: разлёт, тяжесть, кувырок и таяние в конце */
function stepAppleHalves(dt) {
  for (let i = appleHalves.length - 1; i >= 0; i--) {
    const h = appleHalves[i];
    h.age += dt;
    h.vx *= 0.996;
    h.vy += APPLE_HALF_G * dt;
    h.x += h.vx * dt;
    h.y += h.vy * dt;
    h.rot += h.spin * dt;
    const tail = APPLE_HALF_LIFE - APPLE_HALF_FADE;
    h.a = h.age > tail ? clamp(1 - (h.age - tail) / APPLE_HALF_FADE, 0, 1) : 1;
    if (h.a <= 0.01) givePool(appleHalfPool, dropSwap(appleHalves, i));
  }
}

function clearAppleHalves() {
  for (let i = appleHalves.length - 1; i >= 0; i--) givePool(appleHalfPool, dropSwap(appleHalves, i));
}

