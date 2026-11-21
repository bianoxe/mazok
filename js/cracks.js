function themeFor(level) {
  return THEMES[themeIndexFor(level)];
}

function buildCrackLine(x0, y0, ang, length, seed) {
  const pts = [{ x: x0, y: y0 }];
  const steps = (phone ? 9 : 22) + Math.floor(length * (phone ? 7 : 22));
  let x = x0, y = y0, a = ang;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const wander = (fbm(seed * 0.11 + i * 0.17, seed * 0.23) - 0.5) * (0.22 + t * 0.78);
    const kink = hash(seed, i + 0.7) > 0.84 ? (hash(seed, i + 1.4) - 0.5) * 1.05 : 0;
    a = ang + wander + kink;
    const step = length / steps * (0.9 + hash(seed, i) * 0.2);
    x += Math.cos(a) * step;
    y += Math.sin(a) * step;
    const nx = -Math.sin(a), ny = Math.cos(a);
    const j = (fbm(seed * 0.4 + t * 5.2, i * 0.31) - 0.5) * 0.052 * (0.12 + t);
    x += nx * j;
    y += ny * j;
    const d = Math.hypot(x, y);
    if (d > 0.985) {
      x *= 0.985 / d;
      y *= 0.985 / d;
      pts.push({ x, y });
      break;
    }
    pts.push({ x, y });
  }
  return pts;
}

function irregularAngles(n, seed, minW, maxW) {
  const w = [];
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const v = minW + hash(seed, 17 + i) * (maxW - minW);
    w.push(v);
    sum += v;
  }
  const angs = [];
  let a = hash(seed, 1) * TWO_PI;
  for (let i = 0; i < n; i++) {
    angs.push(a);
    a += TWO_PI * (w[i] / sum);
  }
  return angs;
}

function pushCrack(cracks, spec) {
  cracks.push(spec);
  return spec;
}

function buildTomatoSplit(ang, bend, reach, start, slide) {
  const steps = phone ? 8 : 14;
  const pts = [];
  const ox = Math.cos(ang + Math.PI / 2) * (slide || 0);
  const oy = Math.sin(ang + Math.PI / 2) * (slide || 0);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const len = start + Math.pow(t, 0.92) * (reach - start);
    const a = ang + Math.sin(t * Math.PI) * bend + Math.sin(t * Math.PI * 2) * bend * 0.35;
    let x = Math.cos(a) * len + ox * (1 - t);
    let y = Math.sin(a) * len + oy * (1 - t);
    const d = Math.hypot(x, y);
    if (d > 0.975) {
      x *= 0.975 / d;
      y *= 0.975 / d;
    }
    pts.push({ x, y });
  }
  return pts;
}

function buildTangentialTear(ang, rad, len, bend) {
  const steps = phone ? 5 : 8;
  const pts = [];
  for (let s = 0; s <= steps; s++) {
    const u = s / steps;
    const a = ang + (u - 0.5) * len + Math.sin(u * Math.PI) * bend;
    const rr = rad + Math.sin(u * Math.PI) * 0.025;
    pts.push({ x: Math.cos(a) * rr, y: Math.sin(a) * rr });
  }
  return pts;
}

function offsetCrack(pts, dist, from, to) {
  const n = pts.length;
  const i0 = Math.max(1, Math.floor(from * (n - 1)));
  const i1 = Math.min(n - 2, Math.ceil(to * (n - 1)));
  if (i1 - i0 < 2) return null;
  const out = [];
  const span = i1 - i0;
  for (let i = i0; i <= i1; i++) {
    const a = pts[i - 1];
    const b = pts[i + 1];
    let nx = b.y - a.y, ny = a.x - b.x;
    const len = Math.hypot(nx, ny) || 1;
    nx /= len;
    ny /= len;
    const fade = Math.sin(Math.PI * ((i - i0) / span));
    out.push({
      x: pts[i].x + nx * dist * fade,
      y: pts[i].y + ny * dist * fade
    });
  }
  return out;
}

function generateTomatoWounds(seed) {
  const n = 4 + Math.floor(hash(seed, 2) * 3);
  const angs = irregularAngles(n, seed, 0.72, 1.38);
  const spin = -Math.PI / 2 - angs[0];
  for (let i = 0; i < n; i++) angs[i] += spin;
  let primaryJ = Math.round(n / 2) + (hash(seed, 9) > 0.5 ? 0 : -1);
  if (primaryJ < 1) primaryJ = 1;
  if (primaryJ >= n) primaryJ = n - 1;
  const cracks = [];

  for (let i = 0; i < n; i++) {
    const primary = i === 0 || i === primaryJ;
    const bend = (hash(seed, 40 + i) - 0.5) * (primary ? 0.62 : 0.34);
    const reach = primary ? 0.98 : 0.86 + hash(seed, 50 + i) * 0.1;
    const slide = (hash(seed, 70 + i) - 0.5) * (primary ? 0.04 : 0.055);
    const pts = buildTomatoSplit(angs[i], bend, reach, 0.03, slide);
    const seeds = [];
    const beads = [];
    const nSeeds = phone ? (primary ? 3 : 1) : (primary ? 5 : 2);
    for (let s = 0; s < nSeeds; s++) {
      seeds.push({
        t: 0.24 + hash(seed, 500 + i * 17 + s) * 0.58,
        side: hash(seed, 600 + i * 17 + s) > 0.48 ? 1 : -1,
        rot: (hash(seed, 700 + i * 17 + s) - 0.5) * 1.4,
        sc: 0.75 + hash(seed, 800 + i * 17 + s) * 0.55
      });
    }
    if (primary) {
      const nBeads = phone ? 2 : 3;
      for (let b = 0; b < nBeads; b++) {
        beads.push({
          t: 0.42 + hash(seed, 900 + i * 11 + b) * 0.46,
          side: hash(seed, 910 + i * 11 + b) > 0.5 ? 1 : -1,
          sc: 0.65 + hash(seed, 920 + i * 11 + b) * 0.7
        });
      }
    }
    const spec = {
      kind: "main",
      pts,
      width: primary ? 1.4 : 0.9,
      ang: angs[i],
      primary,
      fork: false,
      gape: primary ? 0.118 + hash(seed, i + 8) * 0.02 : 0.058 + hash(seed, i + 11) * 0.012,
      seeds,
      beads,
      deep: true
    };
    if (!primary) spec.appear = 0.36 + hash(seed, 33 + i) * 0.28;
    pushCrack(cracks, spec);

    if (primary && !(phone && i !== 0)) {
      const side = hash(seed, 60 + i) > 0.5 ? 1 : -1;
      const wr = offsetCrack(pts, side * (0.055 + hash(seed, 61 + i) * 0.02), 0.2, 0.8);
      if (wr) {
        pushCrack(cracks, {
          kind: "wrinkle",
          pts: wr,
          width: 0.4,
          ang: angs[i],
          primary: false,
          fork: true,
          forkAt: 0.18 + hash(seed, 62 + i) * 0.1,
          gape: 0.006
        });
      }
    }
  }

  const ringN = phone ? 2 : 3;
  for (let i = 0; i < ringN; i++) {
    const rad = 0.15 + i * 0.12 + hash(seed, 100 + i) * 0.03;
    const cy = -0.56 + rad * 0.4;
    const cx = (hash(seed, 130 + i) - 0.5) * 0.04;
    const sweep = Math.PI * (0.58 + i * 0.2 + hash(seed, 120 + i) * 0.1);
    const a0 = -Math.PI / 2 - sweep * 0.5 + (hash(seed, 110 + i) - 0.5) * 0.16;
    const steps = phone ? 7 : 12;
    const pts = [];
    for (let s = 0; s <= steps; s++) {
      const u = s / steps;
      const a = a0 + sweep * u;
      const wob = Math.sin(u * Math.PI * 2 + i) * 0.008;
      pts.push({
        x: cx + Math.cos(a) * (rad + wob),
        y: cy + Math.sin(a) * (rad * 0.92 + wob)
      });
    }
    pushCrack(cracks, {
      kind: "ring",
      pts,
      width: 0.8,
      ang: -Math.PI / 2,
      primary: false,
      fork: true,
      forkAt: 0.03 + i * 0.09,
      gape: 0.02 + i * 0.006
    });
  }

  const tearN = phone ? 1 : 3;
  for (let i = 0; i < tearN; i++) {
    const slot = (i + 1) % n;
    const ang = angs[slot] + (hash(seed, 160 + i) - 0.5) * 0.4;
    const rad = 0.4 + hash(seed, 170 + i) * 0.34;
    const len = 0.16 + hash(seed, 180 + i) * 0.14;
    const pts = buildTangentialTear(ang, rad, len, (hash(seed, 190 + i) - 0.5) * 0.06);
    pushCrack(cracks, {
      kind: "pulp",
      pts,
      width: 0.55,
      ang,
      primary: false,
      fork: true,
      forkAt: 0.32 + hash(seed, 200 + i) * 0.22,
      gape: 0.042 + hash(seed, 210 + i) * 0.012,
      deep: false
    });
  }
  return cracks;
}

function generateDonutCracks(seed) {
  const cracks = [];
  const base = hash(seed, 3) * TWO_PI;
  const angs = [];
  for (let i = 0; i < 4; i++) angs.push(base + (i * Math.PI) / 2 + (hash(seed, 12 + i) - 0.5) * 0.2);
  angs.sort((a, b) => a - b);
  for (let i = 0; i < 4; i++) {
    const ang = angs[i];
    const inner = DONUT_HOLE * 0.92;
    const pts = buildCrackLine(Math.cos(ang) * inner, Math.sin(ang) * inner, ang, 1.08 - inner, seed * 13 + i * 9);
    pushCrack(cracks, {
      kind: "main",
      pts,
      width: i % 2 ? 1.05 : 1.35,
      fork: false,
      ang,
      primary: true
    });
  }
  const hairN = phone ? 4 : 10;
  for (let i = 0; i < hairN; i++) {
    const startR = DONUT_HOLE + 0.06 + hash(seed, 200 + i) * (0.86 - DONUT_HOLE);
    const startA = hash(seed, 250 + i) * TWO_PI;
    const dir = hash(seed, 270 + i) * TWO_PI;
    const len = 0.05 + hash(seed, 210 + i) * 0.14;
    const pts = buildCrackLine(Math.cos(startA) * startR, Math.sin(startA) * startR, dir, len, seed * 31 + i);
    pushCrack(cracks, {
      kind: "hair",
      pts,
      width: 0.16 + hash(seed, 220 + i) * 0.12,
      fork: false,
      ang: dir,
      primary: false
    });
  }
  return cracks;
}

function generateHelmSplit(seed) {
  const cracks = [];
  const tilt = (hash(seed, 4) - 0.5) * 0.5;
  for (let i = 0; i < 2; i++) {
    const ang = tilt + i * Math.PI;
    const pts = buildCrackLine((hash(seed, i + 2) - 0.5) * 0.04, (hash(seed, i + 6) - 0.5) * 0.04, ang, 1.08, seed * 13 + i * 9);
    pushCrack(cracks, {
      kind: "main",
      pts,
      width: 1.45,
      fork: false,
      ang,
      primary: true
    });
  }
  const hairs = phone ? 2 : 6;
  for (let i = 0; i < hairs; i++) {
    const ang = hash(seed, 40 + i) * TWO_PI;
    const pts = buildCrackLine(Math.cos(ang) * 0.2, Math.sin(ang) * 0.2, ang, 0.55, seed * 17 + i);
    pushCrack(cracks, {
      kind: "hair",
      pts,
      width: 0.35,
      fork: false,
      ang,
      primary: false
    });
  }
  return cracks;
}

/* Смерть фото-помидора: радиальных трещин в бою нет (картинка целая), но при
   лопании нужны разрезы — иначе клиньев нет и босс просто исчезает. Только
   main-лучи для клиньев shatterLog, без боевых ран/колец. */
function generateTomatoPopCracks(seed) {
  const n = phone ? 6 : 8;
  const angs = irregularAngles(n, seed, 0.82, 1.28);
  const spin = hash(seed, 3) * TWO_PI;
  const cracks = [];
  for (let i = 0; i < n; i++) {
    const ang = angs[i] + spin;
    const bend = (hash(seed, 40 + i) - 0.5) * 0.28;
    const slide = (hash(seed, 70 + i) - 0.5) * 0.03;
    const pts = buildTomatoSplit(ang, bend, 1.02, 0, slide);
    pushCrack(cracks, {
      kind: "main",
      pts,
      width: 1.15,
      ang,
      primary: true,
      fork: false,
      gape: 0.08
    });
  }
  return cracks;
}

function generateCracks(seed, kind) {
  kind = kind || "wood";
  if (kind === "donut") return generateDonutCracks(seed);
  if (kind === "tomato") return bossHasPhoto("tomato") ? [] : generateTomatoWounds(seed);
  if (kind === "helm") return generateHelmSplit(seed);
  /* кокос: его порча — не трещины бревна, а куски скорлупы (drawCoconutCracks),
     поэтому трещин у кокоса нет вовсе: запекается чистая скорлупа, а куски
     отваливаются уже поверх неё (clipCoconutShell в boss-spin.js) */
  if (kind === "coconut") return [];
  let nRays = 5 + Math.floor(hash(seed, 2) * 6);
  let hairN = 12;
  let forkChance = 0.58;
  let extraForks = true;
  let crossN = 8;
  let minW = 0.34, maxW = 2.05;
  if (kind === "heart") {
    nRays = 5 + Math.floor(hash(seed, 2) * 5);
    hairN = 16;
    forkChance = 0.82;
    crossN = 12;
    minW = 0.26;
    maxW = 2.35;
  } else if (kind === "marmalade") {
    nRays = 7 + Math.floor(hash(seed, 2) * 5);
    hairN = 18;
    forkChance = 0.48;
    crossN = 7;
    minW = 0.4;
    maxW = 1.7;
  } else if (kind === "pumpkin") {
    nRays = 6 + Math.floor(hash(seed, 2) * 5);
    hairN = 10;
    forkChance = 0.5;
    crossN = 7;
    minW = 0.36;
    maxW = 1.9;
  } else if (kind === "saw") {
    nRays = 4 + Math.floor(hash(seed, 2) * 3);
    hairN = 22;
    forkChance = 0.28;
    crossN = 6;
    minW = 0.5;
    maxW = 1.45;
  } else if (kind === "ball") {
    nRays = 4 + Math.floor(hash(seed, 2) * 3);
    hairN = 8;
    forkChance = 0.22;
    crossN = 4;
    minW = 0.55;
    maxW = 1.35;
  } else if (kind === "disco") {
    /* диск-шар бьётся как зеркало: редкие длинные лучи и почти без волосяных
       трещин — плитка лопается крупными кусками, а не крошится в пыль */
    nRays = 5 + Math.floor(hash(seed, 2) * 3);
    hairN = 6;
    forkChance = 0.18;
    crossN = 4;
    minW = 0.6;
    maxW = 1.3;
  } else if (kind === "pizza") {
    nRays = 6 + Math.floor(hash(seed, 2) * 3);
    hairN = 10;
    forkChance = 0.4;
    crossN = 6;
    minW = 0.42;
    maxW = 1.7;
  }
  if (phone) {
    nRays = Math.min(nRays, 6);
    hairN = Math.min(hairN, 3);
    crossN = Math.min(crossN, 3);
    forkChance *= 0.4;
  }
  nRays = Math.max(4, nRays);
  const angs = irregularAngles(nRays, seed, minW, maxW);
  const cracks = [];
  const primaryI = Math.floor(hash(seed, 8) * nRays);
  const primaryJ = (primaryI + 2 + Math.floor(hash(seed, 9) * Math.max(1, nRays - 3))) % nRays;

  const addForks = (pts, i, nFork, seedOff) => {
    for (let f = 0; f < nFork; f++) {
      const mid = 0.18 + hash(seed, seedOff + i * 10 + f + 55) * 0.62;
      const idx = Math.min(pts.length - 1, Math.max(2, Math.floor(pts.length * mid)));
      const from = pts[idx];
      const bang = hash(seed, seedOff + i + f + 66) * TWO_PI;
      const blen = 0.14 + hash(seed, seedOff + i + f + 88) * 0.42;
      const bpts = buildCrackLine(from.x, from.y, bang, blen, seed * 19 + i * 13 + f + seedOff);
      pushCrack(cracks, {
        kind: "fork",
        pts: bpts,
        width: 0.28 + hash(seed, seedOff + i + f + 9) * 0.26,
        fork: true,
        forkAt: 0.2 + f * 0.14 + hash(seed, seedOff + i + 12) * 0.22,
        ang: bang,
        primary: false
      });
      if (hash(seed, seedOff + i + f + 101) > 0.62 && bpts.length > 4) {
        const sub = Math.min(bpts.length - 1, Math.max(2, Math.floor(bpts.length * (0.4 + hash(seed, seedOff + i + f) * 0.4))));
        const from2 = bpts[sub];
        const sang = hash(seed, seedOff + i + f + 140) * TWO_PI;
        const spts = buildCrackLine(from2.x, from2.y, sang, 0.1 + hash(seed, seedOff + i + f + 150) * 0.22, seed * 29 + i + f);
        pushCrack(cracks, {
          kind: "fork",
          pts: spts,
          width: 0.18 + hash(seed, seedOff + i + f + 11) * 0.16,
          fork: true,
          forkAt: 0.38 + hash(seed, seedOff + i + f + 16) * 0.28,
          ang: sang,
          primary: false
        });
      }
    }
  };

  for (let i = 0; i < nRays; i++) {
    const ang = angs[i];
    const primary = i === primaryI || i === primaryJ || (kind === "heart" && i === (primaryI + 1) % nRays);
    const ox = (hash(seed, i + 30) - 0.5) * 0.07;
    const oy = (hash(seed, i + 40) - 0.5) * 0.07;
    const pts = buildCrackLine(ox, oy, ang, 1.08, seed * 11 + i * 7);
    pushCrack(cracks, {
      kind: "main",
      pts,
      width: primary ? 1.28 : 0.7 + hash(seed, i + 5) * 0.28,
      fork: false,
      ang,
      primary
    });
    const forks = primary ? (extraForks ? 3 : 2) : (hash(seed, i + 44) > (1 - forkChance) ? 1 + (hash(seed, i + 51) > 0.55 ? 1 : 0) : 0);
    addForks(pts, i, forks, 0);
  }

  for (let i = 0; i < crossN; i++) {
    const startR = 0.07 + hash(seed, 300 + i) * 0.66;
    const startA = hash(seed, 320 + i) * TWO_PI;
    const dir = hash(seed, 340 + i) * TWO_PI;
    const len = 0.2 + hash(seed, 360 + i) * 0.58;
    const x0 = Math.cos(startA) * startR;
    const y0 = Math.sin(startA) * startR;
    const pts = buildCrackLine(x0, y0, dir, len, seed * 41 + i * 23);
    pushCrack(cracks, {
      kind: "cross",
      pts,
      width: 0.26 + hash(seed, 380 + i) * 0.34,
      fork: true,
      forkAt: 0.04 + hash(seed, 400 + i) * 0.38,
      ang: dir,
      primary: false
    });
    if (hash(seed, 420 + i) > 0.45) addForks(pts, i, 1, 500 + i * 3);
  }

  for (let i = 0; i < hairN; i++) {
    const startR = 0.18 + hash(seed, 200 + i) * 0.72;
    const startA = hash(seed, 250 + i) * TWO_PI;
    const dir = hash(seed, 270 + i) * TWO_PI;
    const len = 0.07 + hash(seed, 210 + i) * 0.24;
    const pts = buildCrackLine(Math.cos(startA) * startR, Math.sin(startA) * startR, dir, len, seed * 31 + i * 17);
    pushCrack(cracks, {
      kind: "hair",
      pts,
      width: 0.16 + hash(seed, 220 + i) * 0.14,
      fork: false,
      ang: dir,
      primary: false
    });
  }
  const rank = c => (c.kind === "hair" ? 0 : c.kind === "cross" ? 1 : c.kind === "fork" ? 2 : c.primary ? 4 : 3);
  cracks.sort((a, b) => rank(a) - rank(b));
  return cracks;
}

function crackGrow(c, dmg, maxHp) {
  const t = dmg / (maxHp || LOG_HP);
  if (t <= 0) return 0;
  if (c.kind === "hair") return clamp(t / 0.3, 0, 1);
  if (c.kind === "fork" || c.kind === "cross" || c.kind === "ring" || c.kind === "pulp" || c.kind === "wrinkle") {
    const appear = c.forkAt || 0.32;
    if (t < appear) return 0;
    return clamp((t - appear) / Math.max(0.2, 0.88 - appear), 0, 1);
  }
  if (c.appear) {
    if (t < c.appear) return 0;
    const u = (t - c.appear) / Math.max(0.15, 1 - c.appear);
    return clamp(Math.pow(u, 0.7), 0, 1);
  }
  const eased = Math.pow(t, 0.58);
  return clamp(c.primary ? Math.min(1, eased * 1.16 + 0.05) : eased, 0, 1);
}

function resetHpTrail() {
  const log = game.log;
  const maxHp = Math.max(1, log.maxHp || LOG_HP);
  const frac = clamp(log.hp / maxHp, 0, 1);
  log.hpTrail = frac;
  log.hpTrailHold = 0;
  log.hpNip = 0;
}

function stepHpTrail(dt) {
  const log = game.log;
  const maxHp = Math.max(1, log.maxHp || LOG_HP);
  const shown = clamp(log.hp / maxHp, 0, 1);
  if (log.hpTrail == null) log.hpTrail = shown;
  log.hpNip = Math.max(0, (log.hpNip || 0) - dt * 2.6);
  if ((log.hpTrailHold || 0) > 0) {
    log.hpTrailHold = Math.max(0, log.hpTrailHold - dt);
    return;
  }
  if (log.hpTrail > shown) {
    const gap = log.hpTrail - shown;
    log.hpTrail -= Math.min(gap, Math.max(0.72 * dt, gap * 2.35 * dt));
    if (log.hpTrail < shown) log.hpTrail = shown;
  } else {
    log.hpTrail = shown;
  }
}

function easeOutBack(t) {
  const c1 = 0.85;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

