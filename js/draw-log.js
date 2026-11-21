function drawBossHalo() {
  const log = game.log;
  const boss = log.boss;
  if (!boss) return;
  /* СЕРДЦУ круглое свечение не рисуем: его силуэт — сердце, и тёмно-красный
     круг за ним читается как чёрный круг, который появляется и исчезает. */
  if (boss.id === "heart") return;
  /* На слабом телефоне свечение — лишняя полупрозрачная заливка почти на весь
     экран каждый кадр; без него босс читается так же. */
  if (typeof window !== "undefined" && window.GAME_LOW_END) return;
  if ((log.scale || 1) < 0.02) return;
  const s = log.scale || 1;
  const steady = Math.abs(s - 1) < 0.004;
  const r = log.r * (steady ? 1 : s);
  if (steady) {
    /* свечение входит в ключ: у шарика оно меняется вместе с цветом латекса */
    const key = boss.id + ":" + ((log.r * 2 + 0.5) | 0) + ":" + (boss.glow || "");
    if (!haloSpr || haloKey !== key) {
      const rad = log.r;
      const size = Math.max(8, Math.ceil(rad * 2.85));
      if (haloSpr && haloSpr.c) releaseCanvas(haloSpr.c);
      const pair = makeCanvas(size, size);
      const g = pair[1];
      g.translate(size * 0.5, size * 0.5);
      const glow = g.createRadialGradient(0, 0, rad * 0.35, 0, 0, rad * 1.4);
      glow.addColorStop(0, "rgba(" + boss.glow + ", 0.2)");
      glow.addColorStop(0.55, "rgba(" + boss.glow + ", 0.07)");
      glow.addColorStop(1, "rgba(" + boss.glow + ", 0)");
      g.fillStyle = glow;
      g.beginPath();
      g.arc(0, 0, rad * 1.4, 0, TWO_PI);
      if (boss.id === "lifebelt") g.arc(0, 0, rad * LIFEBELT_DRAW_HOLE, 0, TWO_PI, true);
      g.fill(boss.id === "lifebelt" ? "evenodd" : "nonzero");
      haloSpr = { c: pair[0], size };
      haloKey = key;
    }
    const size = haloSpr.size;
    ctx.drawImage(haloSpr.c, snap(log.x - size * 0.5), snap(log.y - size * 0.5));
    return;
  }
  ctx.save();
  ctx.translate(snap(log.x), snap(log.y));
  const glow = ctx.createRadialGradient(0, 0, r * 0.35, 0, 0, r * 1.4);
  glow.addColorStop(0, "rgba(" + boss.glow + ", 0.2)");
  glow.addColorStop(0.55, "rgba(" + boss.glow + ", 0.07)");
  glow.addColorStop(1, "rgba(" + boss.glow + ", 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.4, 0, TWO_PI);
  if (boss.id === "lifebelt") ctx.arc(0, 0, r * LIFEBELT_DRAW_HOLE, 0, TWO_PI, true);
  ctx.fill(boss.id === "lifebelt" ? "evenodd" : "nonzero");
  ctx.restore();
}

function cheapLogDisc(r) {
  const boss = game.log.boss;
  const th = themeFor(game.level);
  const wood = !boss && assets.woods && assets.woods[game.theme];
  const tex = boss && boss.id !== "ball" ? bossTex(boss.id) : null;
  if (boss && bossHasPhoto(boss.id)) {
    if (tex) {
      ctx.save();
      const sprite = bossPhotoIsSprite(boss.id);
      if (boss.id === "donut") clipShape("donut", r);
      else if (!sprite && boss.id !== "helm") {
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, TWO_PI);
        ctx.clip();
      }
      /* силуэтные фото несут запас под выступы — рисуем их крупнее кромки;
         штурвал кладётся на r / HELM_RIM, чтобы обод сел на круг */
      const half = boss.id === "helm" ? r / HELM_RIM : sprite ? bossPhotoHalf(r) : r;
      ctx.drawImage(tex, -half, -half, half * 2, half * 2);
      ctx.restore();
    }
    return;
  }
  if (boss && boss.id === "helm") {
    /* обод штурвала садится ровно на круг бревна, а спицы торчат за него на
       треть радиуса (r / HELM_RIM — так рисунок ложится как задумано) */
    const half = r / HELM_RIM;
    if (tex) ctx.drawImage(tex, -half, -half, half * 2, half * 2);
    ctx.strokeStyle = boss.outline;
    ctx.lineJoin = "round";
    ctx.lineWidth = Math.max(3, r * 0.03);
    strokeShape("helm", r);
    return;
  }
  if (boss && boss.id === "donut") {
    ctx.save();
    clipShape("donut", r);
    if (tex) ctx.drawImage(tex, -r, -r, r * 2, r * 2);
    else {
      ctx.fillStyle = boss.fill;
      fillShape("donut", r);
    }
    ctx.restore();
    ctx.strokeStyle = boss.outline;
    ctx.lineWidth = Math.max(3, r * 0.034);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TWO_PI);
    ctx.stroke();
    ctx.strokeStyle = "#c98448";
    ctx.beginPath();
    ctx.arc(0, 0, r * DONUT_HOLE, 0, TWO_PI);
    ctx.stroke();
    return;
  }
  if (boss && (boss.id === "egg" || boss.id === "aegis" || boss.id === "balloon")) {
    ctx.save();
    clipShape(boss.id, r);
    if (tex) ctx.drawImage(tex, -r, -r, r * 2, r * 2);
    else {
      ctx.fillStyle = boss.fill;
      fillShape(boss.id, r);
    }
    ctx.restore();
    ctx.strokeStyle = boss.outline;
    ctx.lineJoin = "round";
    ctx.lineWidth = Math.max(3, r * 0.034);
    strokeShape(boss.id, r);
    drawBossStem(boss.id, r);
    return;
  }
  const photoWood = !!(!boss && wood && wood.__photo);
  if (photoWood) {
    ctx.drawImage(wood, -r, -r, r * 2, r * 2);
    return;
  }
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TWO_PI);
  if (wood || tex) {
    ctx.save();
    ctx.clip();
    ctx.drawImage(wood || tex, -r, -r, r * 2, r * 2);
    ctx.restore();
  } else {
    ctx.fillStyle = boss ? boss.fill : th.fill;
    ctx.fill();
  }
  /* Сердцу круглую обводку не рисуем: силуэт — сердце, и круг вокруг него
     читается чужой чёрной обводкой. Контур сердца уже лежит в его текстуре. */
  if (!boss || boss.id !== "heart") {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TWO_PI);
    ctx.strokeStyle = boss ? boss.outline : th.outline;
    ctx.lineWidth = Math.max(3, r * 0.034);
    ctx.stroke();
  }
  if (boss && boss.id === "lifebelt") {
    ctx.beginPath();
    ctx.arc(0, 0, r * LIFEBELT_DRAW_HOLE, 0, TWO_PI);
    ctx.stroke();
  }
}

function drawDonutGlint(log, r) {
  const glint = 0.18 + Math.min(0.42, Math.abs(log.vel || 0) * 90);
  const cx = snap(log.x);
  const cy = snap(log.y);
  const inner = r * DONUT_HOLE * 1.22;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.9, 0, TWO_PI);
  ctx.moveTo(cx + inner, cy);
  ctx.arc(cx, cy, inner, 0, TWO_PI, true);
  ctx.clip("evenodd");
  ctx.fillStyle = "rgba(255,255,255," + glint.toFixed(3) + ")";
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.16, cy - r * 0.34, r * 0.3, r * 0.085, -0.55, 0, TWO_PI);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255," + (glint * 0.45).toFixed(3) + ")";
  ctx.beginPath();
  ctx.ellipse(cx + r * 0.24, cy + r * 0.18, r * 0.1, r * 0.038, 0.4, 0, TWO_PI);
  ctx.fill();
  ctx.restore();
}

function drawDummyTufts(r) {
  const spots = [0.2, -0.15, 0.55, 2.55, 2.95, 3.4, -0.55];
  for (let i = 0; i < spots.length; i++) {
    const a = spots[i];
    if (dummyCapHit(a)) continue;
    ctx.save();
    ctx.rotate(a);
    ctx.translate(r * 0.78, 0);   /* рожки чучела тоже под кромкой: 0.78 + 0.2 = 0.98 */
    ctx.rotate(i % 2 ? 0.45 : -0.4);
    ctx.fillStyle = i % 2 ? "#e6c98a" : "#b8894a";
    ctx.fillRect(0, -r * 0.012, r * 0.2, r * 0.024);
    ctx.restore();
  }
}

function drawDummyCap(r) {
  /* фото-чучело уже в шляпе: второй шляпы поверх не рисуем */
  if (typeof bossHasPhoto === "function" && bossHasPhoto("dummy")) return;
  /* шапки нет: она слетела после DUMMY_HAT_HP щелчков — верх чучела открыт
     (dummyHatBreak в boss-spin.js). Глиф в полёте рисуется отдельно, поэтому
     проверка только для живого босса */
  if (game.log.boss && game.log.boss.id === "dummy" && game.log.hatBroken) {
    ctx.save();
    drawDummyTufts(r);
    /* рваная кромка на месте шапки: видно, откуда она слетела */
    ctx.strokeStyle = "rgba(92, 66, 40, 0.55)";
    ctx.lineWidth = Math.max(1.4, r * 0.01);
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.94, DUMMY_CAP_ANG - DUMMY_CAP_HALF, DUMMY_CAP_ANG + DUMMY_CAP_HALF);
    ctx.stroke();
    ctx.restore();
    return;
  }
  const half = DUMMY_CAP_HALF;
  const a0 = DUMMY_CAP_ANG - half;
  const a1 = DUMMY_CAP_ANG + half;
  const dc = -r * DUMMY_DOME_C;
  const crownW = r * DUMMY_DOME_R;
  const crownTop = dc - r * 0.28;
  const by = -r * DUMMY_BRIM_C;
  const rx = r * DUMMY_BRIM_RX;
  const ry = r * DUMMY_BRIM_RY;
  const pulse = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin((game.time || 0) * 0.005));
  ctx.save();
  drawDummyTufts(r);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.995, a0, a1, false);
  ctx.closePath();
  ctx.fillStyle = "#2c2418";
  ctx.fill();
  ctx.fillStyle = "rgba(20, 14, 8, 0.35)";
  ctx.beginPath();
  ctx.ellipse(0, by + ry * 0.9, rx * 0.82, ry * 0.85, 0, 0, TWO_PI);
  ctx.fill();
  const crown = ctx.createLinearGradient(-crownW, crownTop, crownW, by);
  crown.addColorStop(0, "#f4f7fa");
  crown.addColorStop(0.35, "#9aa6b0");
  crown.addColorStop(0.72, "#4a545c");
  crown.addColorStop(1, "#1c242a");
  ctx.fillStyle = crown;
  ctx.beginPath();
  ctx.moveTo(-crownW, by - ry * 0.05);
  ctx.quadraticCurveTo(-crownW * 1.08, dc, -crownW * 0.62, crownTop);
  ctx.quadraticCurveTo(0, crownTop - r * 0.05, crownW * 0.62, crownTop);
  ctx.quadraticCurveTo(crownW * 1.08, dc, crownW, by - ry * 0.05);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#12171b";
  ctx.lineWidth = Math.max(2, r * 0.02);
  ctx.stroke();
  ctx.fillStyle = "#1a2026";
  ctx.fillRect(-crownW * 0.92, by - ry * 0.55, crownW * 1.84, ry * 0.55);
  const brim = ctx.createLinearGradient(0, by - ry, 0, by + ry);
  brim.addColorStop(0, "#f7fafc");
  brim.addColorStop(0.28, "#c5ced6");
  brim.addColorStop(0.62, "#5c666e");
  brim.addColorStop(1, "#1e252b");
  ctx.fillStyle = brim;
  ctx.beginPath();
  ctx.ellipse(0, by, rx, ry, 0, 0, TWO_PI);
  ctx.fill();
  ctx.strokeStyle = "#101418";
  ctx.lineWidth = Math.max(2.6, r * 0.03);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255," + (0.25 + pulse * 0.45).toFixed(3) + ")";
  ctx.lineWidth = Math.max(1.4, r * 0.012);
  ctx.beginPath();
  ctx.ellipse(0, by - ry * 0.18, rx * 0.72, ry * 0.38, 0, Math.PI * 1.05, Math.PI * 1.95);
  ctx.stroke();
  for (let i = 0; i < 5; i++) {
    const u = (i / 4) * 2 - 1;
    const x = u * rx * 0.78;
    const y = by + (1 - u * u) * ry * 0.06;
    ctx.fillStyle = "#141a1e";
    ctx.beginPath();
    ctx.arc(x, y, Math.max(1.7, r * 0.02), 0, TWO_PI);
    ctx.fill();
    ctx.fillStyle = "#e7eef3";
    ctx.beginPath();
    ctx.arc(x - r * 0.004, y - r * 0.004, Math.max(0.7, r * 0.007), 0, TWO_PI);
    ctx.fill();
  }
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.beginPath();
  ctx.ellipse(-crownW * 0.28, crownTop + r * 0.1, crownW * 0.28, r * 0.045, -0.5, 0, TWO_PI);
  ctx.fill();
  /* трещины: шапка крошится ступенями — по ним видно, сколько она ещё держит.
     Каждая ступень добавляет две ломаные: одна идёт по тулье сверху вниз, вторая
     по полям, а на последних ступенях к ним добавляются выбитые куски скола */
  const wear = typeof dummyHatWear === "function" ? dummyHatWear() : 0;
  if (wear > 0) {
    ctx.save();
    ctx.lineCap = "round";
    for (let i = 0; i < wear * 2; i++) {
      const seed = 7100 + i * 7;
      const up = hash(seed, 1) > 0.45;
      const x0 = (hash(seed, 2) - 0.5) * crownW * 1.2;
      const y0 = up ? crownTop + r * 0.02 : by - ry * 0.2;
      const x1 = x0 + (hash(seed, 3) - 0.5) * crownW * 0.55;
      const y1 = up ? by - ry * 0.05 : by + ry * (0.6 + hash(seed, 4) * 0.35);
      const mx = (x0 + x1) * 0.5 + (hash(seed, 5) - 0.5) * crownW * 0.22;
      const my = (y0 + y1) * 0.5;
      ctx.strokeStyle = "rgba(12, 16, 20, 0.86)";
      ctx.lineWidth = Math.max(1.2, r * 0.0085);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(mx, my);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      /* светлая кромка рядом: скол читается объёмным, а не просто чёрточкой */
      ctx.strokeStyle = "rgba(255, 255, 255, 0.24)";
      ctx.lineWidth = Math.max(0.8, r * 0.004);
      ctx.beginPath();
      ctx.moveTo(x0 + r * 0.007, y0);
      ctx.lineTo(mx + r * 0.007, my);
      ctx.lineTo(x1 + r * 0.007, y1);
      ctx.stroke();
      if (wear >= 3 && i % 2 === 0) {
        ctx.fillStyle = "rgba(16, 20, 24, 0.5)";
        ctx.beginPath();
        ctx.ellipse(x1, y1, r * 0.02, r * 0.012, up ? 0.4 : -0.3, 0, TWO_PI);
        ctx.fill();
      }
    }
    ctx.restore();
  }
  const capFlash = logHitFlashAlpha();
  if (capFlash > 0.004 && game.log.boss && game.log.boss.id === "dummy") {
    ctx.globalAlpha = Math.min(0.55, capFlash);
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.ellipse(0, by, rx, ry, 0, 0, TWO_PI);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-crownW, by);
    ctx.quadraticCurveTo(0, crownTop - r * 0.08, crownW, by);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawDummyCapGlyph(r) {
  ctx.save();
  ctx.translate(0, DUMMY_DOME_C * r);
  drawDummyCap(r);
  ctx.restore();
}

/* Белая вспышка попадания обязана повторять силуэт текстуры, а не круг r.
   Раньше белое клипалось кругом, и у боссов с фото/фигурной текстурой (сыр,
   пила, мишень, сердце, бревно с прозрачной кромкой) вспышка вылезала за края
   круглым пятном. Здесь из запечённого спрайта один раз готовится его точная
   белая копия по альфе: source-in оставляет белым ровно те пиксели, где тело
   есть, а прозрачный запас остаётся прозрачным. Дыры (пончик, спасательный
   круг) и выступы (черешки, спицы) тоже попадают как есть. */
let hitMaskC = null;
let hitMaskSeq = -1;

function hitMaskFor(spr) {
  if (hitMaskC && hitMaskSeq === spr.seq) return hitMaskC;
  if (hitMaskC) releaseCanvas(hitMaskC);
  const [c, g] = makeCanvas(spr.c.width, spr.c.height);
  g.drawImage(spr.c, 0, 0);
  g.globalCompositeOperation = "source-in";
  g.fillStyle = "#fff";
  g.fillRect(0, 0, c.width, c.height);
  hitMaskC = c;
  hitMaskSeq = spr.seq;
  return c;
}

function drawLog() {
  const log = game.log;
  const s = log.scale || 1;
  if (s < 0.02) return;
  const r = log.r * s;
  const boss = log.boss;
  const gen = game.bakeId || 0;
  const face = logBakeFace();
  const spr = logBake && logBake.c && logBake.gen === gen && (logBake.face | 0) === face ? logBake : null;

  ctx.save();
  let ox = 0;
  let oy = 0;
  if (boss && boss.id === "fan") {
    const st = log.fanStage || FAN_STAGE_1;
    const amp = log.r * ((st >= FAN_STAGE_3 ? 0.011 : st >= FAN_STAGE_2 ? 0.0035 : 0) + (log.fanPulse || 0) * 0.008);
    if (amp > 0.04) {
      ox += Math.sin(game.time * 0.055) * amp;
      oy += Math.cos(game.time * 0.041) * amp * 0.72;
    }
  }
  const alive = boss ? smoothAlive(boss.id, log.r) : null;
  if (alive) {
    ox += alive.ox;
    oy += alive.oy;
  }
  ctx.translate(snap(log.x + ox), snap(log.y + oy));
  ctx.rotate(log.angle + (alive ? alive.tilt : 0));
  if (s !== 1) ctx.scale(s, s);
  drawStuckKnives(log.r, game.stuck, null, !!spr);
  const pulse = log.pulse || 0;
  if (pulse > 0.0008 || pulse < -0.0008) ctx.scale(1 + pulse, 1 - pulse * 0.55);
  /* КОЛЬЯ ПИЦЦЫ И СТРЕЛА МИШЕНИ РИСУЮТСЯ ПОД РИСУНКОМ БОССА: сразу за ними
     ложится текстура (или её дешёвая копия, или запечённый спрайт), и она
     закрывает всё, что метка уводит вглубь. Так и было всегда — кол воткнут в
     ломоть: зубцы вилки лежат на сыре в глубине ломтя (0.4 r), перекладина
     садится на корку, а наружу торчит рукоять с набалдашником (js/tex-pizza.js);
     у стрелы под рисунок уходит остриё (0.38 r), а за кромку свешивается хвост с
     оперением (js/tex-target.js). Воткнутая часть НЕ ИМЕЕТ ПРАВА лежать поверх
     босса (жалоба заказчика: «та часть, которая у них воткнута, видна поверх
     слоя босса»): вилка целиком лежит над сыром, и она читается как
     нарисованная НА пицце, а не воткнутая в неё.
     Видно ровно то, обо что ломается нож (hit.js: pizzaHazardAt, targetHazardAt):
     за кромкой бревна метку ничто не закрывает — круг босса кончается на log.r, а
     запас запечённого спрайта прозрачен (bakeLogSprite). Зона удара меряется этой
     видимой частью (js/bosses.js: pizzaStakeHalf, TARGET_ARROW_HALF), поэтому нож
     ломается ровно по рисунку (проверка: tools/_hazard_check.js) */
  if (boss && boss.id === "pizza") drawPizzaStakes(log.r, boss.id);
  if (boss && boss.id === "target") drawTargetMark(log.r);
  /* у кокоса отвалившиеся куски скорлупы вырезают сам кокос: текстура (или её
     дешёвая копия) рисуется под маской, поэтому в этих секторах скорлупы нет —
     там ложится белая мякоть, а кромка уходит вглубь на её толщину */
  ctx.save();
  if (boss && boss.id === "coconut") clipCoconutShell(log.r);
  if (spr) {
    ctx.drawImage(spr.c, -spr.w * 0.5, -spr.h * 0.5, spr.w, spr.h);
    /* Вспышка попадания — белая заливка по форме тела. Раньше здесь повторно
       блитился тот же спрайт с alpha: он смешивался сам с собой и давал не
       белое мигание, а просто лёгкое затемнение — на телефоне вспышки не было
       видно вовсе. Теперь белый кладётся ровно по силуэту, без blend-режимов. */
    const hitA = logHitFlashAlpha();
    if (hitA > 0.004) {
      const a = Math.min(0.55, hitA * 0.32);
      const mask = hitMaskFor(spr);
      ctx.save();
      ctx.globalAlpha *= a;
      ctx.drawImage(mask, -spr.w * 0.5, -spr.h * 0.5, spr.w, spr.h);
      ctx.restore();
    }
  } else {
    /* Фолбэк — ровно то же, что рисует ПК (js/draw-stuck.js: drawLogContents).
       «Дешёвый диск» на телефоне терял прокраску и детали (у помидора — ядро и
       семечки), и босс выглядел плоским. Теперь телефон и ПК показывают одно и
       то же; запечённый спрайт, когда готов, заменяет это без швов. */
    drawLogContents(log.r, log.dmg | 0, logHitFlashAlpha());
  }
  ctx.restore();
  if (boss && boss.id === "coconut") drawCoconutShell(log.r);
  if (boss && boss.id === "dummy") drawDummyCap(log.r);
  if (boss && boss.id === "fan" && !bossHasPhoto("fan")) drawFanLive(log.r);
  /* яблоки снаружи кромки — поверх диска, бревно не перекрывают */
  drawLogApples(log.r);
  ctx.restore();
  /* диск-шар: полоса света и искры по зеркалам поверх диска (js/tex-disco.js).
     Слой живёт в мировых координатах, поэтому вызывается ЗДЕСЬ — уже после
     restore, вне сдвига/поворота бревна. Внутри блока выше он получал translate
     второй раз и уезжал от шара на его же координаты. */
  if (boss && boss.id === "disco") drawDiscoLive(r);
  if (boss && boss.id === "candy") drawCandyGlint(r);

  /* Блик по кромке убран: он рисовался в мировых координатах, поэтому стоял на
     месте, пока бревно крутится, и был ровно один и тот же у всех пород —
     заказчик просил его убрать. */
  if (boss && boss.id === "donut") drawDonutGlint(log, r);
  if (boss && (boss.id === "coin" || boss.id === "pepsi" || boss.id === "tire")) drawShineGlint(r, 0.5);
  /* сталь: блик по венцу, чуть глуше банки — матовая деталь, а не полировка */
  if (boss && boss.id === "cog") drawShineGlint(r, 0.34);
  /* мяч: блик рисуется в мировых координатах, поэтому он стоит на месте, пока
     швы едут под ним — именно это и продаёт объём шара */
  if (boss && boss.id === "tennis") drawShineGlint(r, 0.26);
  /* баскетбол: тот же неподвижный блик, что у теннисного мяча, — швы едут под
     ним, и лаковая кожа читается шаром на любом угле */
  if (boss && boss.id === "basketball") drawShineGlint(r, 0.28);
  /* тарелка: глянцевый фарфор — широкий неподвижный блик поверх росписи */
  if (boss && boss.id === "plate") drawShineGlint(r, 0.34);
  /* скотч: глянцевая плёнка — широкий неподвижный блик поверх витков */
  if (boss && boss.id === "tape") drawShineGlint(r, 0.4);
  if (boss && boss.id === "pie") drawShineGlint(r, 0.2);
  /* диско-шару диагональный блик не кладём: он делил шар на светлую и тёмную
     половину, а живой слой (drawDiscoLive) и так ведёт по зеркалам свою полосу
     света и мигание — этого хватает */
  if (boss && boss.id === "ball") {
    const cx = snap(log.x);
    const cy = snap(log.y);
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, TWO_PI);
    ctx.clip();
    ctx.fillStyle = "rgba(255,255,255,0.42)";
    ctx.beginPath();
    ctx.ellipse(cx - r * 0.28, cy - r * 0.32, r * 0.22, r * 0.11, -0.55, 0, TWO_PI);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.16)";
    ctx.beginPath();
    ctx.ellipse(cx + r * 0.34, cy + r * 0.28, r * 0.09, r * 0.05, 0.45, 0, TWO_PI);
    ctx.fill();
    ctx.restore();
  }
}

