function heartPoint(t, r, out) {
  const s = Math.sin(t);
  const x = 16 * s * s * s;
  const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
  const k = r / HEART_FIT.maxR;
  if (out) {
    out.x = x * k;
    out.y = y * k;
    return out;
  }
  return { x: x * k, y: y * k };
}

const _hp = { x: 0, y: 0 };
function pathHeart(g, r, append) {
  if (!append && g.beginPath) g.beginPath();
  const n = 96;
  for (let i = 0; i <= n; i++) {
    heartPoint((i / n) * TWO_PI, r, _hp);
    if (i === 0) g.moveTo(_hp.x, _hp.y);
    else g.lineTo(_hp.x, _hp.y);
  }
  g.closePath();
}

function pathEgg(g, r, append) {
  if (!append && g.beginPath) g.beginPath();
  const segs = EGG_FIT.segs;
  const p0 = segs[0][0];
  g.moveTo(p0[0] * r, p0[1] * r);
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i];
    g.bezierCurveTo(s[1][0] * r, s[1][1] * r, s[2][0] * r, s[2][1] * r, s[3][0] * r, s[3][1] * r);
  }
  g.closePath();
}

function pathPumpkin(g, r, append) {
  if (!append && g.beginPath) g.beginPath();
  for (let a = 0; a <= TWO_PI + 0.04; a += 0.04) {
    const wr = r * (0.9 + 0.08 * Math.cos(a * 8) + 0.02 * Math.sin(a * 3));
    const x = Math.cos(a) * wr;
    const y = Math.sin(a) * wr * 0.96;
    if (a === 0) g.moveTo(x, y); else g.lineTo(x, y);
  }
  g.closePath();
}

function pathSaw(g, r, append) {
  if (!append && g.beginPath) g.beginPath();
  const step = TWO_PI / (SAW_TEETH * 8);
  for (let a = 0; a <= TWO_PI + step * 0.5; a += step) {
    const wr = r * sawRadiusMul(a);
    const x = Math.cos(a) * wr;
    const y = Math.sin(a) * wr;
    if (a === 0) g.moveTo(x, y); else g.lineTo(x, y);
  }
  g.closePath();
}

/* Шестерёнка: зубчатый венец по тому же полярному правилу, что и кромка под
   ножом (gearRadiusMul) — силуэт и кромка обязаны совпадать, иначе нож садится
   мимо зубьев. Выборка по восемь точек на зуб: у пилы зубьев больше, а тут
   площадки зубьев выходят ровными, без огранки. */
function pathGear(g, r, append) {
  if (!append && g.beginPath) g.beginPath();
  const step = TWO_PI / (GEAR_TEETH * 8);
  for (let a = 0; a <= TWO_PI + step * 0.5; a += step) {
    const wr = r * gearRadiusMul(a);
    const x = Math.cos(a) * wr;
    const y = Math.sin(a) * wr;
    if (a === 0) g.moveTo(x, y); else g.lineTo(x, y);
  }
  g.closePath();
}

/* ---------- шарик ----------
   Надувной латекс: округлый корпус, чуть вытянутый вверх, и мягко собранная
   шейка внизу. Силуэт задан радиусом от центра вращения, поэтому он всегда
   вписан в служебный круг босса, а вытянутость задаётся тем, что бока сжаты по
   горизонтали: купол доходит до края круга, бока чуть не дотягивают. Сам узел
   и нитка рисуются поверх силуэта (drawBossStem) в форме "шейка - узел - нитка".
   Угол тут как везде на холсте: -PI/2 — верх, +PI/2 — низ (шейка). */
/* форма шарика: ширина относительно высоты и мягкая стяжка к шейке. Сама шейка
   выступает ниже силуэта: её, узел и нитку рисует drawBossStem. */
const BALLOON_WIDE = 0.93;      /* бока сжаты по горизонтали: шарик вытянут вверх */
const BALLOON_NECK = 0.15;      /* мягкая стяжка дна — латекс собирается к шейке */
const BALLOON_NECK_A = 0.62;    /* от этого угла (радианы, ~35°) начинается стяжка */
const BALLOON_NECK_TIP = 1 - BALLOON_NECK;   /* низ силуэта: отсюда растёт шейка */

function balloonRadiusMul(ang) {
  const cx = Math.cos(ang);
  const cy = Math.sin(ang);
  /* корпус: ширина 0.93 от высоты — так шарик читается вытянутым, а не блином */
  const body = Math.hypot(cx * BALLOON_WIDE, cy);
  /* низ сходится конусом: стяжка включается плавно и так же плавно упирается в
     предел, поэтому силуэт читается надутым шариком, а не яйцом с выемкой */
  const d = Math.abs(angNorm(ang - Math.PI * 0.5));
  const u = d < BALLOON_NECK_A ? 0.5 + 0.5 * Math.cos((Math.PI * d) / BALLOON_NECK_A) : 0;
  return body * (1 - BALLOON_NECK * u);
}

function pathBalloon(g, r, append) {
  if (!append && g.beginPath) g.beginPath();
  const step = TWO_PI / 176;
  for (let a = 0; a <= TWO_PI + step * 0.5; a += step) {
    const wr = r * balloonRadiusMul(a);
    const x = Math.cos(a) * wr;
    const y = Math.sin(a) * wr;
    if (a === 0) g.moveTo(x, y); else g.lineTo(x, y);
  }
  g.closePath();
}

function helmShapeMul(ang) {
  const slot = TWO_PI / HELM_N;
  let u = ang % slot;
  if (u < 0) u += slot;
  const d = Math.min(u, slot - u);
  const rim = HELM_RIM;
  const w = HELM_PEG_W;
  const capC = HELM_TIP - w;
  const sd = Math.sin(d);
  const cd = Math.cos(d);
  let r = rim;
  const disc = w * w - capC * capC * sd * sd;
  if (disc > 0) {
    const hit = capC * cd + Math.sqrt(disc);
    if (hit > r) r = hit;
  }
  if (sd > 1e-4) {
    const sideR = w / sd;
    const sideX = sideR * cd;
    const joinX = Math.sqrt(Math.max(0, rim * rim - w * w));
    if (sideX >= joinX - 0.004 && sideX <= capC + 0.002 && sideR > r) r = sideR;
  }
  return r;
}

function helmRadiusMul(ang) {
  return helmShapeMul(ang) / HELM_RIM;
}

function pathHelm(g, r, append) {
  if (!append && g.beginPath) g.beginPath();
  const step = TWO_PI / 192;
  for (let a = 0; a <= TWO_PI + step * 0.5; a += step) {
    const wr = r * helmRadiusMul(a);
    const x = Math.cos(a) * wr;
    const y = Math.sin(a) * wr;
    if (a === 0) g.moveTo(x, y); else g.lineTo(x, y);
  }
  g.closePath();
}

function pathLifebelt(g, r, append) {
  if (!append && g.beginPath) g.beginPath();
  const hole = Math.max(1, r * LIFEBELT_DRAW_HOLE);
  g.moveTo(r, 0);
  g.arc(0, 0, r, 0, TWO_PI);
  g.closePath();
  g.moveTo(hole, 0);
  g.arc(0, 0, hole, 0, TWO_PI);
  g.closePath();
}

function pathDonut(g, r, append) {
  if (!append && g.beginPath) g.beginPath();
  const hole = Math.max(1, r * DONUT_HOLE);
  g.moveTo(r, 0);
  g.arc(0, 0, r, 0, TWO_PI);
  g.closePath();
  g.moveTo(hole, 0);
  g.arc(0, 0, hole, 0, TWO_PI);
  g.closePath();
}

function aegisBez(seg, t) {
  const p0 = seg[0], p1 = seg[1], p2 = seg[2], p3 = seg[3];
  const u = 1 - t;
  return {
    x: u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    y: u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]
  };
}

/* Рыцарский щит «heater»: почти прямой верх с лёгкой выпуклостью, слегка
   закруглённые верхние углы, плавно сужающиеся бока и резко сходящееся книзу
   остриё. Правая половина обвода зеркалится, поэтому силуэт строго
   симметричен и массивен. Дальняя точка вписывается в радиус 1. */
const AEGIS_FIT = (() => {
  const half = [
    /* верхний правый угол */
    [[0.80, -1.00], [0.86, -1.00], [1.00, -0.94], [1.00, -0.82]],
    /* правый борт: почти прямой, с лёгким наклоном внутрь */
    [[1.00, -0.82], [1.02, -0.44], [1.00, -0.18], [0.95, 0.12]],
    /* сведение к острию */
    [[0.95, 0.12], [0.78, 0.60], [0.40, 1.00], [0.00, 1.34]]
  ];
  const flipX = s => s.map(p => [-p[0], p[1]]);
  const raw = [
    /* верхняя кромка: почти прямая, едва выпуклая вверх */
    [[-0.80, -1.00], [-0.30, -1.008], [0.30, -1.008], [0.80, -1.00]]
  ];
  for (let i = 0; i < half.length; i++) raw.push(half[i]);
  for (let i = half.length - 1; i >= 0; i--) raw.push(flipX(half[i]).reverse());
  const pts = [];
  for (let s = 0; s < raw.length; s++) {
    for (let i = 0; i < 80; i++) pts.push(aegisBez(raw[s], i / 80));
  }
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const cx = (minX + maxX) * 0.5;
  const cy = (minY + maxY) * 0.5;
  let maxR = 0;
  for (let i = 0; i < pts.length; i++) {
    maxR = Math.max(maxR, Math.hypot(pts[i].x - cx, pts[i].y - cy));
  }
  const segs = raw.map(seg => seg.map(p => [(p[0] - cx) / maxR, (p[1] - cy) / maxR]));
  const N = 256;
  const lut = new Float64Array(N);
  const acc = new Float64Array(N);
  const w = new Float64Array(N);
  for (let s = 0; s < raw.length; s++) {
    for (let i = 0; i < 180; i++) {
      const p = aegisBez(raw[s], i / 180);
      const x = (p.x - cx) / maxR;
      const y = (p.y - cy) / maxR;
      const rr = Math.hypot(x, y);
      let a = Math.atan2(y, x);
      if (a < 0) a += TWO_PI;
      const b = Math.floor(a / TWO_PI * N) % N;
      acc[b] += rr;
      w[b] += 1;
    }
  }
  for (let i = 0; i < N; i++) lut[i] = w[i] ? acc[i] / w[i] : 0;
  for (let i = 0; i < N; i++) {
    if (lut[i] > 0) continue;
    let p = 1, q = 1;
    while (lut[(i - p + N) % N] <= 0 && p < N) p++;
    while (lut[(i + q) % N] <= 0 && q < N) q++;
    const a = lut[(i - p + N) % N];
    const b = lut[(i + q) % N];
    lut[i] = a + (b - a) * (p / (p + q));
  }
  return { segs, lut };
})();

/* Заклёпки: ровно по обводу, без сгустков и разрывов. Считаем половину обвода
   (от середины верхней кромки до острия) по длине дуги и зеркалим — набор
   заклёпок строго симметричен. Точки уже слегка утоплены внутрь, чтобы сесть
   посередине стальной окантовки. */
const AEGIS_RIVETS = (() => {
  const segs = AEGIS_FIT.segs;
  const n = segs.length;
  const EP = 200;
  const bx = [segs[0][0][0]];
  const by = [segs[0][0][1]];
  const bl = [0];
  let px = bx[0], py = by[0], acc = 0;
  for (let s = 0; s < n; s++) {
    for (let i = 1; i <= EP; i++) {
      const p = aegisBez(segs[s], i / EP);
      acc += Math.hypot(p.x - px, p.y - py);
      px = p.x; py = p.y;
      bx.push(px); by.push(py); bl.push(acc);
    }
  }
  const mid = EP * 0.5;   /* середина верхней кромки */
  const tip = EP * 4;     /* остриё: стык третьего и четвёртого сегментов */
  const at = target => {
    let j = mid + 1;
    while (j <= tip && bl[j] < target) j++;
    const a = bl[j - 1], b = bl[j];
    const f = b > a ? (target - a) / (b - a) : 0;
    return { x: bx[j - 1] + (bx[j] - bx[j - 1]) * f, y: by[j - 1] + (by[j] - by[j - 1]) * f };
  };
  const K = 8;
  const s0 = bl[mid], s1 = bl[tip];
  const inset = 0.93;
  const out = [];
  for (let k = 0; k <= K; k++) {
    const q = at(s0 + (k / K) * (s1 - s0));
    out.push({ x: q.x * inset, y: q.y * inset });
  }
  for (let k = K - 1; k >= 1; k--) out.push({ x: -out[k].x, y: out[k].y });
  return out;
})();

function pathAegis(g, r, append) {
  if (!append && g.beginPath) g.beginPath();
  const segs = AEGIS_FIT.segs;
  const p0 = segs[0][0];
  g.moveTo(p0[0] * r, p0[1] * r);
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i];
    g.bezierCurveTo(s[1][0] * r, s[1][1] * r, s[2][0] * r, s[2][1] * r, s[3][0] * r, s[3][1] * r);
  }
  g.closePath();
}

function aegisNormPoint(u) {
  const segs = AEGIS_FIT.segs;
  const n = segs.length;
  let x = u % 1;
  if (x < 0) x += 1;
  const f = x * n;
  const i = Math.min(n - 1, Math.floor(f));
  return aegisBez(segs[i], f - i);
}

function traceShape(id, r) {
  if (id === "heart") pathHeart(ctx, r);
  else if (id === "egg") pathEgg(ctx, r);
  else if (id === "pumpkin") pathPumpkin(ctx, r);
  else if (id === "saw") pathSaw(ctx, r);
  else if (id === "cog") pathGear(ctx, r);
  else if (id === "donut") pathDonut(ctx, r);
  else if (id === "lifebelt") pathLifebelt(ctx, r);
  else if (id === "helm") pathHelm(ctx, r);
  else if (id === "aegis") pathAegis(ctx, r);
  else if (id === "balloon") pathBalloon(ctx, r);
  else {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TWO_PI);
    ctx.closePath();
  }
}

