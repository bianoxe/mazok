function roundBar(x, y, w, h, r) {
  const rr = Math.min(r, w * 0.5, h * 0.5);
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, rr);
  else {
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }
}

/* ---------- цвет редкости босса ----------
   И полоска HP, и имя над ней красятся по редкости (js/bosses.js: BOSS_TIERS).
   У обычного в таблице цвет бежевый (#cdc6b8), а в кадре полоска серая: белую
   наливку не отличить от белого «призрака» урона, который её догоняет. */
const BOSS_TIER_HP_RGB = {
  common: [178, 174, 168],
  rare: [255, 210, 63],
  legend: [192, 124, 255],
  secret: [255, 68, 68]
};

function bossTierId(boss) {
  const t = boss ? bossTierOf(boss) : "";
  return t && t.id ? t.id : String(t || "");
}

function bossTierRgb(boss) {
  return BOSS_TIER_HP_RGB[bossTierId(boss)] || BOSS_TIER_HP_RGB.common;
}

/* оттенок в сторону белого (t = 0…1): верх наливки и цвет имени */
function bossTierLight(k, t) {
  const m = i => Math.round(k[i] + (255 - k[i]) * t);
  return "rgb(" + m(0) + ", " + m(1) + ", " + m(2) + ")";
}

/* тот же оттенок в темноту (s = 0…1): низ наливки */
function bossTierDark(k, s) {
  const m = i => Math.round(k[i] * s);
  return "rgb(" + m(0) + ", " + m(1) + ", " + m(2) + ")";
}

function bossTierSolid(k) {
  return "rgb(" + k[0] + ", " + k[1] + ", " + k[2] + ")";
}

/* ---------- полоска запаса: три готовых слоя ----------
   Раньше весь спрайт полоски перепекался каждый раз, когда менялась «дорожка»
   урона (hpTrail/nip) — то есть почти каждый кадр целую секунду после каждого
   попадания. На телефоне это давало ровно тот микрофриз, который чувствуется
   в бою: перерисовка текста, трёх градиентов и нового битмапа прямо в кадре
   удара. Теперь слоёв три, и в кадре нет ни текста, ни градиентов:

     base  — тень, корпус, жёлоб и имя босса (меняется только с боссом/размером);
     fill  — наливка (меняется только при смене цвета состояния, 1–2 раза за бой);
     front — рамка, насечки и подпись «N / M» (только при смене числа HP).

   В кадре: base → «призрак» урона → fill (обрезанный по ширине) → front.
   Все размеры считаются в пикселях экрана (k), поэтому цифры и обводка резкие. */
let hpBaseSpr = null;
let hpFillSpr = null;
let hpFrontSpr = null;
let hpGhostSpr = null;
let hpFillKey = "";
let hpFrontKey = "";
let hpGhostKey = "";

function hpLayer(cur, cw, ch) {
  if (cur && cur.c && cur.c.width === cw && cur.c.height === ch) {
    const g = cur.g;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalAlpha = 1;
    g.globalCompositeOperation = "source-over";
    g.clearRect(0, 0, cw, ch);
    return cur;
  }
  if (cur && cur.c) releaseCanvas(cur.c);
  const pair = makeCanvas(cw, ch);
  return { c: pair[0], g: pair[1] };
}

/* Рисуем в слой: paintHpBase/Front/Fill используют глобальный ctx, поэтому на
   время бейка подменяем его и возвращаем обратно даже при ошибке. */
function hpPaintLayer(spr, k, fn) {
  const saved = ctx;
  ctx = spr.g;
  ctx.setTransform(k, 0, 0, k, 0, 0);
  try {
    fn();
  } finally {
    ctx = saved;
  }
}

/* Полноэкранная подложка сцен: полупрозрачная пелена + радиальная виньетка.
   Раньше это были ДВЕ полные заливки кадра (fillRect + радиальный градиент)
   на каждый кадр сцены. Печём их вместе в один спрайт и в кадре кладём одним
   drawImage с общей прозрачностью. */
let sceneBgSpr = null;
let sceneBgKey = "";
function drawSceneBackdrop(cx, cy, rin, rout, edgeAlpha, veilRGB, veilA, bleed, veil) {
  const b = bleed || 0;
  const s = viewSx > 0 ? viewSx : 1;
  const ww = visW + b * 2;
  const wh = visH + b * 2;
  const w = Math.max(8, Math.round(ww * s));
  const h = Math.max(8, Math.round(wh * s));
  const key = Math.round(cx) + ":" + Math.round(cy) + ":" + Math.round(rin) + ":" +
    Math.round(rout) + ":" + veilRGB + ":" + veilA + ":" + w + "x" + h;
  if (!sceneBgSpr || sceneBgKey !== key) {
    if (sceneBgSpr) releaseCanvas(sceneBgSpr);
    const pair = makeCanvas(w, h);
    const g = pair[1];
    g.setTransform(w / ww, 0, 0, h / wh, -(cropX - b) * (w / ww), -(cropY - b) * (h / wh));
    g.fillStyle = "rgba(" + veilRGB + "," + veilA + ")";
    g.fillRect(cropX - b, cropY - b, ww, wh);
    const grad = g.createRadialGradient(cx, cy, rin, cx, cy, rout);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(1, "rgba(0,0,0," + edgeAlpha + ")");
    g.fillStyle = grad;
    g.fillRect(cropX - b, cropY - b, ww, wh);
    sceneBgSpr = pair[0];
    sceneBgKey = key;
  }
  if (veil < 1) ctx.globalAlpha = veil;
  ctx.drawImage(sceneBgSpr, cropX - b, cropY - b, ww, wh);
  if (veil < 1) ctx.globalAlpha = 1;
}

/* Прогрев спрайтов полоски HP в меню: первый кадр боя не должен платить за
   создание канвасов и растеризацию шрифта. Рисуем в крошечный служебный
   канвас — на экране ничего не появляется. */
function warmHpBarSprites() {
  if (!ctx || typeof game === "undefined" || !game.log) return;
  /* Спрайт воткнутого ножа печётся в первом попадании (knifeDispImg): на
     слабом телефоне это первый заметный рывок уже в бою. Готовим заранее, в
     меню; при смене скина вызов просто перепечёт один маленький канвас. */
  if (typeof knifeDispImg === "function") {
    try { knifeDispImg(save.knife); } catch (err) {}
  }
  if (hpBaseSpr && hpBaseSpr.c) return;
  const savedCtx = ctx;
  const savedState = state;
  const savedSting = game.sting;
  const pair = makeCanvas(2, 2);
  ctx = pair[1];
  state = "play";
  game.sting = 0;
  try { drawLogHpBar(); } catch (err) {}
  /* Призрак полоски (след урона) — отдельный слой, который иначе пекся бы в
     первом попадании. Показываем «хп ниже, след выше» и печём его здесь же. */
  const lg = game.log;
  const savedHp = lg.hp, savedTrail = lg.hpTrail;
  try {
    lg.hp = Math.max(1, Math.round(lg.maxHp * 0.8));
    lg.hpTrail = lg.maxHp;
    drawLogHpBar();
  } catch (err) {}
  lg.hp = savedHp;
  lg.hpTrail = savedTrail;
  /* и сразу возвращаем слой «полный запас», чтобы первый кадр боя не пёк его */
  try { drawLogHpBar(); } catch (err) {}
  state = savedState;
  game.sting = savedSting;
  ctx = savedCtx;
  releaseCanvas(pair[0]);
}

/* Прогрев полоски HP для текущего бревна/босса. На босс-уровне базовый слой
   отличается (имя и тир), и раньше он пёкся ровно в момент появления полоски
   после вступления — на телефоне это заметный рывок. Печём в переходе уровня. */
function warmHpBarCurrent() {
  if (!ctx || typeof game === "undefined" || !game.log) return;
  const savedCtx = ctx, savedState = state, savedSting = game.sting, savedT = game.stingT;
  const pair = makeCanvas(2, 2);
  ctx = pair[1];
  state = "play";
  game.sting = 0;
  game.stingT = 99;
  try { drawLogHpBar(); } catch (err) {}
  ctx = savedCtx;
  state = savedState;
  game.sting = savedSting;
  game.stingT = savedT;
  releaseCanvas(pair[0]);
}

function drawLogHpBar() {  if (state === "menu" || state === "victory") return;
  if (game.sting > 0 && (game.stingT || 0) < stingPopAt()) return;
  /* У кокоса полоска тоже есть: она показывает мякоть (двадцать), а скорлупа
     живёт своей жизнью — её куски видны на самом кокосе. */
  if (!hpFontHook && document.fonts && document.fonts.ready) {
    hpFontHook = true;
    document.fonts.ready.then(() => {
      /* Перепекать полоску в бою из-за приехавшего шрифта нельзя: это лишний
         кадровый рывок. В меню/на вступлении — можно. */
      if (state !== "play" || game.intro > 0) hpBarKey = "";
    });
  }
  const log = game.log;
  const boss = log.boss;
  const maxHp = Math.max(1, log.maxHp || LOG_HP);
  const hp = Math.max(0, log.hp) | 0;
  const shown = clamp(log.hp / maxHp, 0, 1);
  const trail = clamp(Math.max(log.hpTrail == null ? shown : log.hpTrail, shown), 0, 1);
  const low = shown < 0.28;
  const pulse = low ? 0.55 + 0.45 * Math.sin(game.time * 0.014) : 1;

  const w = clamp(log.r * 2.05, 176, 268);
  const h = 18;
  /* Над полоской — имя босса крупными буквами, цветом редкости. Строка входит
     в спрайт сверху, поэтому сама полоска остаётся на прежнем месте. */
  const nameH = boss ? 26 : 0;
  const padX = 8;
  const padY = 8;
  const bw = Math.ceil(w + padX * 2);
  const bh = Math.ceil(nameH + h + 4 + padY * 2);
  /* Спрайты печём в ПИКСЕЛЯХ ЭКРАНА: раньше полоска была 1:1 к миру и на
     телефоне растягивалась — отсюда мыльные цифры ХП и обводка. На телефоне
     берём фиксированные 2× (полоска маленькая): при смене адаптивного
     разрешения её больше не приходится перепекать. */
  const k = phone ? 2.2 : Math.max(1, Math.min(2.4, Math.round((pixelScale || 1) * 10) / 10));
  const cw = Math.ceil(bw * k);
  const ch = Math.ceil(bh * k);
  const tier = boss ? bossTierId(boss) : "";
  const baseKey = (boss ? boss.id + ":" + boss.name + ":" + tier : "_") +
    ":" + (w | 0) + ":" + (h | 0) + ":" + k.toFixed(1);
  if (!hpBaseSpr || hpBarKey !== baseKey) {
    hpBaseSpr = hpLayer(hpBaseSpr, cw, ch);
    hpPaintLayer(hpBaseSpr, k, () => paintHpBase(padX, padY + nameH, w, h, nameH, boss));
    hpBarKey = baseKey;
    hpFrontKey = "";
    hpGhostKey = "";
  }

  const pad = 2.1;
  const ix = padX + pad;
  const iy = padY + nameH + pad;
  const iw = w - pad * 2;
  const ih = h - pad * 2;
  const fw = iw * shown;
  const tw = iw * trail;
  const last = hp === 1;
  const x0 = snap(log.x - w * 0.5 - padX);
  const y0 = snap(log.y - log.r - 28 - padY - nameH);

  /* задний слой — всегда и первым */
  ctx.drawImage(hpBaseSpr.c, x0, y0, bw, bh);

  /* «Призрак» урона: белая полоска, которая догоняет заливку. Готовый спрайт
     на всю ширину — в кадре только обрезка по tw. */
  if (tw > fw + 0.4) {
    const ghostKey = k.toFixed(1) + ":" + iw.toFixed(2) + "x" + ih.toFixed(2);
    if (!hpGhostSpr || hpGhostKey !== ghostKey) {
      const gw = Math.max(2, Math.ceil(iw * k));
      const gh = Math.max(2, Math.ceil(ih * k));
      hpGhostSpr = hpLayer(hpGhostSpr, gw, gh);
      hpPaintLayer(hpGhostSpr, k, () => {
        roundBar(0, 0, iw, ih, ih * 0.5);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.fillRect(0, 1.1, iw, ih * 0.36);
      });
      hpGhostKey = ghostKey;
    }
    const gwPx = Math.min(hpGhostSpr.c.width, Math.max(1, Math.ceil(tw * k)));
    ctx.globalAlpha = 0.92;
    ctx.drawImage(hpGhostSpr.c, 0, 0, gwPx, hpGhostSpr.c.height,
      x0 + ix, y0 + iy, tw, ih);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillRect(x0 + ix + tw - 2.2, y0 + iy, 2.2, ih);
  }

  /* Наливка. Ключ меняется только вместе с цветом состояния (последняя
     единица, босс/тир) — не на каждом кадре и не на пульсе: пульс рисуется
     полупрозрачной полосой поверх готового спрайта. */
  if (fw > 0.5) {
    const fillKey = tier + ":" + (boss ? 1 : 0) + ":" + (last ? 1 : 0) +
      ":" + (low ? 1 : 0) + ":" + k.toFixed(1) + ":" + iw.toFixed(2);
    if (!hpFillSpr || hpFillKey !== fillKey) {
      const fc = Math.max(2, Math.ceil(iw * k));
      const fh = Math.max(2, Math.ceil(ih * k));
      hpFillSpr = hpLayer(hpFillSpr, fc, fh);
      let c0, c1, c2;
      if (last) {
        c0 = `rgb(${Math.round(240 + pulse * 15)}, ${Math.round(80 + pulse * 30)}, ${Math.round(60 + pulse * 10)})`;
        c1 = "#d44532";
        c2 = "#7a1a12";
      } else if (boss) {
        const kr = bossTierRgb(boss);
        c0 = bossTierLight(kr, low ? 0.24 + 0.16 * pulse : 0.32);
        c1 = bossTierSolid(kr);
        c2 = bossTierDark(kr, 0.55);
      } else {
        c0 = "#ffb656";
        c1 = "#ee8d2b";
        c2 = "#b4531a";
      }
      hpPaintLayer(hpFillSpr, k, () => {
        ctx.save();
        roundBar(0, 0, iw, ih, ih * 0.5);
        ctx.clip();
        const fg = ctx.createLinearGradient(0, 0, 0, ih);
        fg.addColorStop(0, c0);
        fg.addColorStop(0.4, c1);
        fg.addColorStop(1, c2);
        ctx.fillStyle = fg;
        ctx.fillRect(0, 0, iw, ih);
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.fillRect(0, 1.1, iw, ih * 0.36);
        /* блик у ведущей кромки — он ездит вместе с наливкой, поэтому лежит
           в самом спрайте: правый край обрезки всегда приходится на него */
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.fillRect(iw - 1.6, 0, 1.6, ih);
        ctx.restore();
      });
      hpFillKey = fillKey;
    }
    const fwPx = Math.min(hpFillSpr.c.width, Math.max(1, Math.ceil(fw * k)));
    ctx.drawImage(hpFillSpr.c, 0, 0, fwPx, hpFillSpr.c.height,
      x0 + ix, y0 + iy, fw, ih);
    /* Пульс последних единиц: светлая полоса поверх готовой наливки — без
       перепекания спрайта (раньше оно шло 5 раз в секунду и давало рывки). */
    if (low) {
      const pu = clamp((pulse - 0.55) / 0.45, 0, 1);
      ctx.globalAlpha = 0.1 + pu * 0.22;
      ctx.fillStyle = "#fff";
      ctx.fillRect(x0 + ix, y0 + iy, fw, ih * 0.44);
      ctx.globalAlpha = 1;
    }
  }

  /* Рамка, насечки и «N / M» — тоже готовый слой. */
  const frontKey = hp + ":" + maxHp + ":" + k.toFixed(1) + ":" + (w | 0) + ":" + tier;
  if (!hpFrontSpr || hpFrontKey !== frontKey) {
    hpFrontSpr = hpLayer(hpFrontSpr, cw, ch);
    hpPaintLayer(hpFrontSpr, k, () => paintHpFront(padX, padY + nameH, w, h, maxHp, hp, ix, iy, iw, ih));
    hpFrontKey = frontKey;
  }
  ctx.drawImage(hpFrontSpr.c, x0, y0, bw, bh);
}

/* Имя босса над полоской HP: крупно, цветом редкости, с тёмной обводкой. */
function paintHpName(x, w, nameH, boss) {
  const k = bossTierRgb(boss);
  const text = String(boss.name || "").toUpperCase();
  if (!text) return;
  const font = px => "900 " + px + "px Unbounded, Manrope, sans-serif";
  const maxW = w + 12;
  let size = 21;
  ctx.font = font(size);
  const wide = ctx.measureText(text).width;
  if (wide > maxW && wide > 0) size = Math.max(12, Math.floor(size * maxW / wide));
  ctx.font = font(size);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  const cx = x + w * 0.5;
  const cy = nameH * 0.52;
  ctx.lineWidth = Math.max(3, size * 0.3);
  ctx.strokeStyle = "rgba(14, 8, 5, 0.74)";
  ctx.strokeText(text, cx, cy);
  ctx.fillStyle = bossTierSolid(k);
  ctx.fillText(text, cx, cy);
}

/* Нижний слой: тень, корпус, жёлоб, имя. Заливка ляжет поверх жёлоба. */
function paintHpBase(x, y, w, h, nameH, boss) {
  const rad = h * 0.5;
  ctx.fillStyle = "rgba(16, 10, 6, 0.38)";
  roundBar(x, y + 4, w, h, rad);
  ctx.fill();

  roundBar(x, y, w, h, rad);
  const shell = ctx.createLinearGradient(0, y, 0, y + h);
  shell.addColorStop(0, "#3a322c");
  shell.addColorStop(0.45, "#1a1512");
  shell.addColorStop(1, "#100e0c");
  ctx.fillStyle = shell;
  ctx.fill();

  const pad = 2.1;
  const ix = x + pad, iy = y + pad, iw = w - pad * 2, ih = h - pad * 2;
  ctx.save();
  roundBar(ix, iy, iw, ih, ih * 0.5);
  ctx.clip();
  const groove = ctx.createLinearGradient(0, iy, 0, iy + ih);
  groove.addColorStop(0, "#0a0806");
  groove.addColorStop(0.5, "#1e1814");
  groove.addColorStop(1, "#14110e");
  ctx.fillStyle = groove;
  ctx.fillRect(ix, iy, iw, ih);
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fillRect(ix, iy + ih - 3, iw, 3);
  ctx.restore();

  if (boss) paintHpName(x, w, nameH, boss);
}

/* Верхний слой: насечки по единицам запаса, рамка и подпись «N / M». */
function paintHpFront(x, y, w, h, maxHp, hp, ix, iy, iw, ih) {
  const rad = h * 0.5;
  if (maxHp <= 18) {
    ctx.strokeStyle = "rgba(0,0,0,0.22)";
    ctx.lineWidth = 1;
    for (let i = 1; i < maxHp; i++) {
      const tx = ix + iw * (i / maxHp);
      ctx.beginPath();
      ctx.moveTo(tx, iy + 1.4);
      ctx.lineTo(tx, iy + ih - 1.4);
      ctx.stroke();
    }
  }

  roundBar(x, y, w, h, rad);
  ctx.strokeStyle = "rgba(255, 236, 210, 0.4)";
  ctx.lineWidth = 1.4;
  ctx.stroke();
  roundBar(x + 1, y + 1, w - 2, h - 2, Math.max(1, rad - 1));
  ctx.strokeStyle = "rgba(0,0,0,0.48)";
  ctx.lineWidth = 1.15;
  ctx.stroke();

  ctx.font = "800 12px Unbounded, Manrope, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 3.2;
  ctx.strokeStyle = "rgba(18, 10, 6, 0.55)";
  const label = hp + " / " + (maxHp | 0);
  ctx.strokeText(label, x + w * 0.5, y + h * 0.54);
  ctx.fillStyle = "rgba(255, 248, 236, 0.96)";
  ctx.fillText(label, x + w * 0.5, y + h * 0.54);
}

function drawShock() {
  if (game.shockT <= 0) return;
  /* сердцу круглую ударную волну не рисуем: на смерти она читается второй
     круглой обводкой вокруг сердца */
  if (game.log.boss && game.log.boss.id === "heart") return;
  const u = 1 - game.shockT;
  const e = 1 - Math.pow(1 - u, 3);
  const r0 = game.shockR || 80;
  const boom = game.shards.length > 0;
  ctx.save();
  ctx.beginPath();
  ctx.arc(game.shockX, game.shockY, r0 * (boom ? 0.2 : 0.85) + e * r0 * (boom ? 2.55 : 0.55), 0, TWO_PI);
  ctx.strokeStyle = `rgba(255,255,255,${game.shockT * (boom ? 0.58 : 0.42)})`;
  ctx.lineWidth = Math.max(2, (boom ? 15 : 8) * game.shockT);
  ctx.stroke();
  if (boom) {
    ctx.beginPath();
    ctx.arc(game.shockX, game.shockY, r0 * 0.04 + e * r0 * 1.65, 0, TWO_PI);
    ctx.strokeStyle = `rgba(232, 210, 174, ${game.shockT * 0.34})`;
    ctx.lineWidth = Math.max(1.2, 6.5 * game.shockT);
    ctx.stroke();
  }
  ctx.restore();
}

function strokeSplit(c, r, hole) {
  ctx.beginPath();
  if (!(hole > 1)) {
    ctx.moveTo(0, 0);
    for (let i = 0; i < c.pts.length; i++) ctx.lineTo(c.pts[i].x * r, c.pts[i].y * r);
    ctx.stroke();
    return;
  }
  let started = false;
  const h2 = hole * hole;
  for (let i = 0; i < c.pts.length; i++) {
    const x = c.pts[i].x * r;
    const y = c.pts[i].y * r;
    if (x * x + y * y < h2) continue;
    if (!started) {
      ctx.moveTo(x, y);
      started = true;
    } else ctx.lineTo(x, y);
  }
  if (started) ctx.stroke();
}

/* На телефоне звук нельзя откладывать в setTimeout: под нагрузкой колбэк
   приходит на кадр-два позже картинки, и удар «плывёт» за анимацией ножа.
   Там запускаем сразу, ещё в update(): WebAudio играет асинхронно, а сборка
   нескольких узлов стоит доли миллисекунды. На ПК оставляем прежний путь. */
function deferSfx(fn) {
  if (phone) {
    try { fn(); } catch (err) {}
    return;
  }
  sfxLater.push(fn);
}

function flushSfx() {
  if (!sfxLater.length) return;
  const q = sfxLater.splice(0, sfxLater.length);
  setTimeout(() => {
    for (let i = 0; i < q.length; i++) q[i]();
  }, 0);
}

function liveAtlas(s) {
  return s.atlas && s.atlas.c ? s.atlas : shatterSpr;
}

function invalidateLogBakes() {
  const keep = shatterSpr && shatterSpr.c;
  if (logBake && logBake.c === keep) logBake = null;
  else if (logBake) {
    logBake.gen = -1;
    logBake.dmg = -1;
  }
  if (logAhead) {
    if (logAhead.c && logAhead.c !== keep && !(logBake && logBake.c === logAhead.c)) releaseCanvas(logAhead.c);
    logAhead = null;
  }
}

function bakeScale() {
  const s = pixelScale > 0 ? pixelScale : 1;
  if (phone) return Math.min(1.35, Math.max(0.55, s));
  return Math.min(2, Math.max(0.5, s));
}

/* Номер запекания. Нужен вспышке удара (js/draw-log.js: hitMaskFor): белая
   маска строится по конкретному спрайту и пересобирается, только когда спрайт
   перепекли. Полотно может переиспользоваться под новое содержимое, поэтому
   сравнивать ссылки на канвас нельзя — только этот номер. */
let bakeSeq = 0;

function spriteCanvasFree(spr) {
  if (!spr || !spr.c) return false;
  if (shatterSpr && shatterSpr.c === spr.c) return false;
  if (logBake && logBake !== spr && logBake.c === spr.c) return false;
  if (logAhead && logAhead !== spr && logAhead.c === spr.c) return false;
  return true;
}

function bakeLogSprite(dmg, prev) {
  dmg = dmg | 0;
  const log = game.log;
  const r = log.r;
  const pad = Math.ceil(r * 0.28 + 14);
  const scale = bakeScale();
  const size = Math.max(16, Math.ceil((r + pad) * 2 * scale));
  const gen = game.bakeId || 0;
  const wantOff = !phone && typeof OffscreenCanvas === "function";
  const reusable = !!(prev && spriteCanvasFree(prev) && prev.c.width === size && prev.c.height === size && (!wantOff || isOffscreen(prev.c)));
  let c, g;
  if (reusable) {
    c = prev.c;
    g = c.getContext("2d", { alpha: true });
  } else {
    if (prev && prev.c && spriteCanvasFree(prev)) releaseCanvas(prev.c);
    const pair = wantOff ? makeOffscreen(size, size) : makeCanvas(size, size);
    c = pair[0];
    g = pair[1];
  }
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalAlpha = 1;
  g.globalCompositeOperation = "source-over";
  g.clearRect(0, 0, size, size);
  g.setTransform(scale, 0, 0, scale, size * 0.5, size * 0.5);
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = phone ? "low" : "medium";
  const saved = ctx;
  ctx = g;
  try {
    drawLogContents(r, dmg, 0);
  } finally {
    ctx = saved;
  }
  return { c, g, w: size / scale, h: size / scale, gen, r, dmg, face: logBakeFace(), seq: ++bakeSeq };
}

/* Готов ли запечённый спрайт бревна/босса. На телефоне, пока его нет, рисуется
   дешёвый диск без теней и прокрасски — и босс «появлялся, а тени позже», а
   свечение (у СЕРДЦА тёмно-красное) на секунду висело чёрным кругом на небе.
   Поэтому и босс, и его свечение показываются только вместе со спрайтом. */
function logSpriteReady() {
  if (!logBake || !logBake.c) return false;
  return logBake.gen === (game.bakeId || 0) && (logBake.face | 0) === logBakeFace();
}

function logBakeFace() {
  const b = game.log.boss;
  if (!b) return 0;
  /* у бильярда и шарика текстура не одна: запечённый спрайт годится только
     для того же номера, иначе смена облика не попадёт в кадр */
  if (b.id === "ball") return game.log.ballN | 0;
  if (b.id === "balloon") return game.log.balloonN | 0;
  return 0;
}

/* Зависит ли запечённый спрайт от урона. У обычного бревна трещины больше не
   рисуются, у фото-боссов и сердца порчи нет вовсе — их спрайт от HP не
   меняется. Значит перепекать его на каждом попадании не нужно: это была
   самая частая «микрофризовая» операция в бою. */
function logBakeDmgFree() {
  const b = game.log.boss;
  if (!b) return true;
  if (b.id === "heart" || b.id === "coconut") return true;
  return typeof bossHasPhoto === "function" && bossHasPhoto(b.id);
}

function bakeLogDmg(dmg) {
  logBake = bakeLogSprite(dmg, logBake);
  return logBake;
}

function adoptAhead(dmg) {
  dmg = dmg | 0;
  const gen = game.bakeId || 0;
  if (!(logAhead && logAhead.c && logAhead.gen === gen && logAhead.dmg === dmg && (logAhead.face | 0) === logBakeFace())) return false;
  const prev = logBake;
  logBake = logAhead;
  logAhead = null;
  if (prev && prev.c && prev.c !== logBake.c && spriteCanvasFree(prev)) releaseCanvas(prev.c);
  return true;
}

function aheadDamage() {
  if ((state !== "play" && state !== "menu") || game.intro > 0 || game.log.hp <= 0) return -1;
  const dmg = game.log.dmg | 0;
  const maxHp = game.log.maxHp | 0;
  /* у босса в один запас (шарик) следующего состояния нет: он лопается сразу,
     запекать «следующий урон» незачем. У кокоса так же: текстура скорлупы от
     урона не меняется — порча живёт в кусках (drawCoconutCracks) */
  if (maxHp <= 1) return -1;
  if (logBakeDmgFree()) return -1;
  let add = 0;
  if (game.flying.length === 1) add = game.flying[0].dmg || knifeHitDamage();
  else if (!game.flying.length) add = knifeHitDamage();
  else return -1;
  const want = Math.min(maxHp, dmg + add);
  return want === dmg ? -1 : want;
}

/* Печём бревно и клинья сразу на старте уровня, пока идёт наплыв. Иначе первые
   ~0.3 с каждого уровня (пока не появятся трещины и не будет готов спрайт)
   бревно рисуется живым вектором drawLogContents — самый дорогой путь кадра.
   На телефоне это давало рывок в начале КАЖДОГО уровня, то есть примерно раз
   в 10 секунд. Бейк дешёвый (1–2 мс) и происходит в переходе между уровнями. */
function prebakeLevelLog() {
  const log = game.log;
  if (!log || !(log.r > 0)) return;
  if (game.needCracks || !game.cracks || game.cracks.length < 3) {
    game.cracks = generateCracks(1 + Math.floor(rand(1, 99991)), log.boss && log.boss.id);
    game.needCracks = false;
  }
  const gen = game.bakeId || 0;
  const face = logBakeFace();
  const coco = !!(log.boss && log.boss.id === "coconut");
  const dmg = coco || logBakeDmgFree() ? 0 : (log.dmg | 0);
  if (logBake && logBake.c && logBake.gen === gen && logBake.dmg === dmg && (logBake.face | 0) === face) {
    return;
  }
  logBake = bakeLogSprite(dmg, logBake);
  /* клинья тоже готовим заранее: сейчас спрайт есть, и в бою печь уже нечего */
  if (phone) {
    try { pumpShardPrewarm(); } catch (err) {}
  }
}

function pumpLogBake() {  if (state === "shatter" || state === "victory" || game.drop || game.fail) return;
  if (phone && game.shards.length) {
    for (let i = 0; i < game.shards.length; i++) {
      if (game.shards[i].kind === "wedge" && !game.shards[i].sprite) return;
    }
  }
  if (bakeSkip > 0) {
    bakeSkip--;
    return;
  }
  /* Телефон: одно запекание не чаще раза в 60 мс. Пока спрайт отстаёт, бревно
     рисуется живым путём (как на ПК до запекания) — картинка та же, зато нет
     подвисания на каждом ударе и на каждом следующем шаге урона. */
  if (phone) {
    const nowBake = performance.now();
    if (nowBake - phoneBakeAt < 60) return;
    phoneBakeAt = nowBake;
  }
  if (game.needCracks) {
    if (game.intro > INTRO_DUR * 0.55) return;
    if (game.shards.length > 12 && game.intro > 0.12) return;
    game.cracks = generateCracks(1 + Math.floor(rand(1, 99991)), game.log.boss && game.log.boss.id);
    game.needCracks = false;
    return;
  }
  if (!game.cracks || !game.cracks.length) {
    /* кокос запекается и без трещин: их у него нет, а запечённая скорлупа нужна —
       отвалившиеся куски вырезаются уже поверх неё (clipCoconutShell) */
    if (!(game.log.boss && game.log.boss.id === "coconut")) return;
  }
  const gen = game.bakeId || 0;
  const face = logBakeFace();
  if (game.flying.length && logBake && logBake.c && logBake.gen === gen && (logBake.face | 0) === face) return;
  /* кокос от урона не меняется: ключ держим на нуле, чтобы скорлупа пеклась один раз */
  const coco = !!(game.log.boss && game.log.boss.id === "coconut");
  const dmg = coco || logBakeDmgFree() ? 0 : (game.log.dmg | 0);
  if (!(logBake && logBake.c && logBake.gen === gen && logBake.dmg === dmg && (logBake.face | 0) === face)) {
    if (!adoptAhead(dmg)) logBake = bakeLogSprite(dmg, logBake);
    return;
  }
  const want = aheadDamage();
  if (want < 0) {
    if (!game.flying.length && logAhead) {
      if (logAhead.c && spriteCanvasFree(logAhead)) releaseCanvas(logAhead.c);
      logAhead = null;
    }
    return;
  }
  if (logAhead && logAhead.c && logAhead.gen === gen && logAhead.dmg === want && (logAhead.face | 0) === face) return;
  /* Телефон «впрок» не печёт: это второй бейк на каждый шаг урона, а именно
     спарка бейков и давала микрофризы при частых бросках. Живой путь рисует
     ровно то же, что было бы в спрайте. */
  if (phone) {
    if (logAhead && spriteCanvasFree(logAhead)) releaseCanvas(logAhead.c);
    logAhead = null;
    return;
  }
  logAhead = bakeLogSprite(want, logAhead);
}

/* Ножи и метки удара, которые лежат ПОД рисунком осколка. Их не запекаем в
   спрайт тела: они выходят за кромку, и из-за них спрайт раздувался в 7 раз.
   Рисуются живьём каждый кадр — их всего несколько, а тело осколка уже блит. */
function drawWedgeOverlays(s) {
  ctx.translate(-s.cx, -s.cy);
  drawStuckKnives(s.r, s.knives, s.boss && s.boss.id);
  /* Колья пиццы и стрела мишени — метки зон удара (js/hit.js): на осколке они
     ложатся ПОД рисунок куска, ровно как в живом кадре (drawLog в
     js/draw-log.js): воткнутая часть метки прячется под ломоть осколка, а наружу
     видно рукоять и хвост стрелы. span оставляем: на осколке видны только метки
     своего сектора */
  if (s.boss && s.boss.id === "pizza") {
    let a0 = s.c0.ang;
    let a1 = s.c1.ang;
    if (a1 <= a0) a1 += TWO_PI;
    drawPizzaStakes(s.r, "pizza", a0, a1 - a0);
  }
  if (s.boss && s.boss.id === "target") {
    let a0 = s.c0.ang;
    let a1 = s.c1.ang;
    if (a1 <= a0) a1 += TWO_PI;
    drawTargetMark(s.r, a0, a1 - a0);
  }
}

function drawWedgeFromAtlas(s, atlas, bodyOnly) {
  const pal = s.boss || themeFor(s.level);
  const hole = bossDrawHole(s.boss && s.boss.id, s.r);
  if (bodyOnly) ctx.translate(-s.cx, -s.cy);
  else drawWedgeOverlays(s);
  ctx.save();
  traceWedge(s.c0, s.c1, s.r + 1, hole);
  ctx.clip();
  ctx.drawImage(atlas.c, -atlas.w * 0.5, -atlas.h * 0.5, atlas.w, atlas.h);
  ctx.restore();
  traceWedge(s.c0, s.c1, s.r, hole);
  ctx.strokeStyle = pal.outline;
  ctx.lineWidth = Math.max(2.4, s.r * 0.028);
  ctx.lineJoin = "round";
  ctx.stroke();
  const juicy = s.boss && s.boss.id === "tomato";
  const glazed = s.boss && s.boss.id === "donut";
  ctx.strokeStyle = juicy ? "rgba(110, 22, 16, 0.85)" : glazed ? "rgba(196, 72, 110, 0.9)" : "rgba(28, 16, 8, 0.72)";
  ctx.lineWidth = Math.max(1.6, s.r * 0.016);
  strokeSplit(s.c0, s.r, hole);
  strokeSplit(s.c1, s.r, hole);
  const glow = clamp(1 - s.age / 0.12, 0, 1);
  if (glow > 0) {
    ctx.strokeStyle = juicy
      ? "rgba(255, 198, 110," + (glow * 0.9) + ")"
      : glazed
        ? "rgba(255, 236, 246," + (glow * 0.9) + ")"
        : "rgba(255, 236, 210," + (glow * 0.82) + ")";
    ctx.lineWidth = Math.max(1.2, s.r * 0.012);
    strokeSplit(s.c0, s.r, hole);
    strokeSplit(s.c1, s.r, hole);
  }
}

function drawCheapWedge(s) {
  const pal = s.boss || themeFor(s.level);
  const hole = bossDrawHole(s.boss && s.boss.id, s.r);
  ctx.translate(-s.cx, -s.cy);
  if (!phone && s.knives && s.knives.length) drawStuckKnives(s.r, s.knives, s.boss && s.boss.id);
  /* метки зон удара — под рисунком куска, см. drawWedgeFromAtlas */
  if (s.boss && s.boss.id === "pizza") {
    let a0 = s.c0.ang;
    let a1 = s.c1.ang;
    if (a1 <= a0) a1 += TWO_PI;
    drawPizzaStakes(s.r, "pizza", a0, a1 - a0);
  }
  if (s.boss && s.boss.id === "target") {
    let a0 = s.c0.ang;
    let a1 = s.c1.ang;
    if (a1 <= a0) a1 += TWO_PI;
    drawTargetMark(s.r, a0, a1 - a0);
  }
  ctx.fillStyle = pal.fill;
  traceWedge(s.c0, s.c1, s.r, hole);
  ctx.fill();
  ctx.lineWidth = Math.max(2, s.r * 0.03);
  ctx.strokeStyle = pal.outline;
  ctx.stroke();
}

function quantPx(n) {
  return Math.max(16, (Math.ceil(n) + 15) & ~15);
}

/* Плотный прямоугольник клина в системе бревна (центр 0,0). Раньше каждый
   клин пекся в квадрат 2.12r со всех сторон, хотя сам он занимает только свой
   сектор: впустую растеризовались и заливались текстурой сотни тысяч пикселей,
   и один бейк на телефоне давал рывок в 40-50 мс (замер: tools/_spin_stall.js).
   Здесь считаем реальные границы: точки трещин, концы дуги и кардинальные
   углы, которые дуга проходит. */
function wedgeBBox(c0, c1, r, hole) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const add = (x, y) => {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  };
  const a0 = ((c0.ang % TWO_PI) + TWO_PI) % TWO_PI;
  let a1 = ((c1.ang % TWO_PI) + TWO_PI) % TWO_PI;
  if (a1 <= a0) a1 += TWO_PI;
  const arc = (rad) => {
    add(Math.cos(a0) * rad, Math.sin(a0) * rad);
    add(Math.cos(a1) * rad, Math.sin(a1) * rad);
    for (let k = 0; k < 4; k++) {
      let a = k * Math.PI * 0.5;
      while (a < a0) a += TWO_PI;
      if (a <= a1) add(Math.cos(a) * rad, Math.sin(a) * rad);
    }
  };
  if (hole > 2) {
    arc(r);
    arc(hole);
  } else {
    add(0, 0);
    const p0 = c0.pts, p1 = c1.pts;
    for (let i = 0; i < p0.length; i++) add(p0[i].x * r, p0[i].y * r);
    for (let i = 0; i < p1.length; i++) add(p1[i].x * r, p1[i].y * r);
    arc(r);
  }
  if (!(minX <= maxX && minY <= maxY)) return null;
  return [minX, minY, maxX, maxY];
}

function bakeShardVisual(s) {
  if (s.sprite || s.kind !== "wedge") return;
  const atlas = liveAtlas(s);
  if (!atlas || !atlas.c) return;
  const r = s.r;
  /* Только тело осколка: ножи и метки рисуются поверх живьём (drawWedgeOverlays),
     поэтому спрайт не раздувается на длину клинка — он в разы меньше. */
  const full = r * 1.06 + 6;
  const bb = wedgeBBox(s.c0, s.c1, r, bossDrawHole(s.boss && s.boss.id, r));
  const pad = Math.max(8, r * 0.07);
  let minX = -s.cx - full;
  let minY = -s.cy - full;
  let maxX = -s.cx + full;
  let maxY = -s.cy + full;
  if (bb) {
    minX = Math.max(minX, bb[0] - s.cx - pad);
    minY = Math.max(minY, bb[1] - s.cy - pad);
    maxX = Math.min(maxX, bb[2] - s.cx + pad);
    maxY = Math.min(maxY, bb[3] - s.cy + pad);
  }
  const sc = phone
    ? Math.min(1.35, Math.max(0.9, (pixelScale || 1) * 0.6))
    : Math.min(1, bakeScale());
  const pw = quantPx((maxX - minX) * sc);
  const ph = quantPx((maxY - minY) * sc);
  const pair = makeOffscreen(pw, ph);
  const saved = ctx;
  const age = s.age;
  s.age = 99;
  ctx = pair[1];
  try {
    ctx.setTransform(sc, 0, 0, sc, -minX * sc, -minY * sc);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "low";
    drawWedgeFromAtlas(s, atlas, true);
  } finally {
    s.age = age;
    ctx = saved;
  }
  s.sprite = pair[0];
  s.sprOx = minX;
  s.sprOy = minY;
  s.sprDw = pw / sc;
  s.sprDh = ph / sc;
}

function pumpShardBakes() {
  /* В обычном бою заранее печём клинья, которые появятся при разломе: на
     телефоне 6 бейков в первом кадре взрыва — это и был рывок. Печём по
     одному раз в несколько кадров, пока игрок спокойно целится. */
  if (state === "play" && phone && !game.shards.length) {
    pumpShardPrewarm();
    return;
  }
  if (!game.shards.length) return;
  if (!(shatterSpr && shatterSpr.c)) return;
  let budget = phone ? 1 : 6;
  for (let i = 0; i < game.shards.length && budget > 0; i++) {
    const s = game.shards[i];
    if (s.kind !== "wedge" || s.sprite) continue;
    bakeShardVisual(s);
    budget--;
  }
}

/* ------- предварительная печь клиньев (телефон) -------
   Геометрия клиньев известна сразу после генерации трещин: порядок mains и
   углы не меняются до разлома. Значит можно испечь их спрайты заранее, по
   одному на кадр, и в момент взрыва только подставить готовые картинки. */
function shardWarmRelease() {
  if (!shardWarmCache) return;
  const it = shardWarmCache.items;
  for (let i = 0; i < it.length; i++) {
    const w = it[i];
    if (w && w.sprite) releaseCanvas(w.sprite);
    if (w) w.sprite = null;
  }
  shardWarmCache = null;
}

function shardWedgeCenter(c0, c1, r, boss) {
  let a0 = c0.ang;
  let a1 = c1.ang;
  if (a1 <= a0) a1 += TWO_PI;
  const span = a1 - a0;
  const mid = a0 + span * 0.5;
  const holeR = boss ? bossRingHole(boss.id, r) : 0;
  let d;
  if (holeR > 0) {
    const r2 = r * r;
    const h2 = holeR * holeR;
    d = (2 / 3) * (r2 * r - h2 * holeR) / (r2 - h2) * (Math.sin(span * 0.5) / Math.max(0.18, span * 0.5));
  } else {
    d = (2 / 3) * r * (Math.sin(span * 0.5) / Math.max(0.18, span * 0.5));
  }
  return { cx: Math.cos(mid) * d, cy: Math.sin(mid) * d };
}

function pumpShardPrewarm() {
  const atlas = typeof logBake !== "undefined" ? logBake : null;
  if (!atlas || !atlas.c) return;
  const gen = game.bakeId || 0;
  const face = logBakeFace();
  const cracks = game.cracks;
  if (!cracks || cracks.length < 3) return;
  if (game.log.hp <= 0) return;
  /* В обычном наплыве клинья печём сразу (они offscreen и дешёвые), а во
     вступлении босса ждём, пока сцена закончится: там и без них работы полно. */
  if (game.sting > 0 && game.log.scale < 0.9) return;
  if (atlas.gen !== gen || (atlas.face | 0) !== face) return;
  /* кокос разламывается по своим половинам, а не по mains — не прогреваем */
  if (game.log.boss && game.log.boss.id === "coconut") return;
  if (shardWarmCache &&
      (shardWarmCache.cracks !== cracks || shardWarmCache.gen !== gen ||
       shardWarmCache.face !== face || shardWarmCache.atlas !== atlas)) {
    shardWarmRelease();
  }
  if (!shardWarmCache) {
    const mains = [];
    for (let i = 0; i < cracks.length; i++) if (cracks[i].kind === "main") mains.push(cracks[i]);
    if (mains.length < 3) return;
    mains.sort((a, b) => a.ang - b.ang);
    shardWarmCache = {
      cracks: cracks, gen: gen, face: face, atlas: atlas,
      mains: mains, items: [], built: 0, ticks: 0
    };
  }
  const w = shardWarmCache;
  if (w.built >= w.mains.length) return;
  /* один бейк на ~4 кадра — лёгкие кадры во время прицеливания */
  if ((w.ticks++ & 3) !== 0) return;
  const i = w.built;
  const n = w.mains.length;
  const c0 = w.mains[i];
  const c1 = w.mains[(i + 1) % n];
  const r = game.log.r;
  const pos = shardWedgeCenter(c0, c1, r, game.log.boss);
  const spec = {
    kind: "wedge", c0: c0, c1: c1, r: r, cx: pos.cx, cy: pos.cy,
    boss: game.log.boss, level: game.level, age: 99, atlas: atlas
  };
  try { bakeShardVisual(spec); } catch (err) { return; }
  w.items[i] = {
    c0: c0, c1: c1, cx: pos.cx, cy: pos.cy,
    sprite: spec.sprite, sprOx: spec.sprOx, sprOy: spec.sprOy,
    sprDw: spec.sprDw, sprDh: spec.sprDh
  };
  spec.sprite = null;
  w.built++;
}

function drawAnchorGlyph(w) {
  const h = w * 1.35;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#3a2414";
  ctx.lineWidth = Math.max(2.4, w * 0.14);
  ctx.beginPath();
  ctx.arc(0, -h * 0.34, w * 0.22, 0, TWO_PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -h * 0.12);
  ctx.lineTo(0, h * 0.28);
  ctx.moveTo(-w * 0.46, h * 0.02);
  ctx.lineTo(w * 0.46, h * 0.02);
  ctx.moveTo(-w * 0.52, h * 0.22);
  ctx.quadraticCurveTo(-w * 0.16, h * 0.02, 0, h * 0.38);
  ctx.quadraticCurveTo(w * 0.16, h * 0.02, w * 0.52, h * 0.22);
  ctx.stroke();
  ctx.strokeStyle = "#c4a574";
  ctx.lineWidth = Math.max(1.2, w * 0.05);
  ctx.beginPath();
  ctx.arc(0, -h * 0.38, w * 0.1, -0.4, 1.4);
  ctx.stroke();
}

/* Осколки рисуются в ДВА прохода: сперва ножи и метки ВСЕХ осколков, потом
   тела ВСЕХ. Иначе клинок, воткнутый у границы сектора, ложился поверх уже
   нарисованного соседнего куска — и ножи «лежали» на бревне, а после разлёта
   выглядели вывалившимися. Теперь тело любого осколка закрывает клинок так же,
   как целое бревно. */
function drawShards() {
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < game.shards.length; i++) {
      const s = game.shards[i];
      if (s.alpha < 0.02) continue;
      const wedge = s.kind === "wedge";
      if (pass === 0) {
        if (!wedge) continue;
        if (!s.sprite && !liveAtlas(s)) continue;
        ctx.save();
        ctx.globalAlpha = s.alpha;
        ctx.translate(snap(s.x), snap(s.y));
        ctx.rotate(s.rot);
        const wsc = s.scale || 1;
        if (wsc !== 1) ctx.scale(wsc, wsc);
        drawWedgeOverlays(s);
        ctx.restore();
        continue;
      }
      ctx.save();
      ctx.globalAlpha = s.alpha;
      ctx.translate(snap(s.x), snap(s.y));
      ctx.rotate(s.rot);
      const sc = s.scale || 1;
      if (sc !== 1) ctx.scale(sc, sc);
      if (s.kind === "anchor") {
        drawAnchorGlyph(s.w || 36);
      } else if (s.kind === "cap") {
        drawDummyCapGlyph(s.w || 80);
      } else if (s.kind === "sprinkle") {
        ctx.fillStyle = s.fill || "#ff8cb8";
        const w = s.w || 12;
        const h = Math.max(2, s.h || 4);
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(-w * 0.5, -h * 0.5, w, h, h * 0.5);
        else ctx.rect(-w * 0.5, -h * 0.5, w, h);
        ctx.fill();
      } else if (s.kind === "chunk") {
        ctx.fillStyle = s.fill;
        const w = snapLen(s.w);
        const h = snapLen(s.h);
        ctx.fillRect(snap(-w * 0.5), snap(-h * 0.5), w, h);
      } else if (s.kind === "pith") {
        ctx.fillStyle = s.fill;
        if (phone) {
          const d = snapLen(s.w);
          ctx.fillRect(snap(-d * 0.5), snap(-d * 0.5), d, d);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, s.w * 0.5, 0, TWO_PI);
          ctx.fill();
        }
      } else if (s.sprite) {
        ctx.drawImage(s.sprite, s.sprOx, s.sprOy, s.sprDw, s.sprDh);
      } else if (liveAtlas(s)) {
        /* Спрайт осколка ещё не запечён: тело режем прямо из атласа (без ножей —
           они уже нарисованы первым проходом). */
        drawWedgeFromAtlas(s, liveAtlas(s), true);
      } else {
        drawCheapWedge(s);
      }
      ctx.restore();
    }
  }
}

/* Белая вспышка отскока: мягкий радиальный спрайт кэшируется один раз (в кадре
   только масштаб и alpha), чтобы удар не стоил создания градиента на телефоне. */
let popSpr = null;
function popSprite() {
  if (popSpr) return popSpr;
  const size = 128;
  const [c, g] = makeCanvas(size, size);
  const half = size * 0.5;
  const grad = g.createRadialGradient(half, half, 0, half, half, half);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.22, "rgba(255,255,255,0.92)");
  grad.addColorStop(0.55, "rgba(255,255,255,0.32)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  popSpr = { c: c, size: size };
  return popSpr;
}

function drawPop() {
  const p = game.pop;
  if (!p || p.t <= 0) return;
  const u = 1 - p.t;
  const e = 1 - Math.pow(1 - u, 3);
  const R = p.r * (0.32 + 0.92 * e);
  const a = p.t * p.t;
  const spr = popSprite();
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = a;
  ctx.drawImage(spr.c, snap(p.x - R), snap(p.y - R), R * 2, R * 2);
  /* короткие белые лучи — вспышка читается взрывом, а не ровным кругом */
  ctx.globalAlpha = a * 0.62;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = Math.max(1, 3 * p.t);
  ctx.beginPath();
  for (let i = 0; i < 7; i++) {
    const ang = (p.ang || 0) + i * TWO_PI / 7;
    const r0 = R * 0.45;
    const r1 = R * (1.05 + 0.15 * Math.sin(i * 2.1));
    ctx.moveTo(p.x + Math.cos(ang) * r0, p.y + Math.sin(ang) * r0);
    ctx.lineTo(p.x + Math.cos(ang) * r1, p.y + Math.sin(ang) * r1);
  }
  ctx.stroke();
  ctx.restore();
}

function drawClash() {
  const c = game.clash;
  if (!c || c.t <= 0) return;
  const t = c.t;
  ctx.save();
  ctx.translate(snap(c.x), snap(c.y));
  ctx.rotate(c.ang);
  ctx.strokeStyle = "rgba(255,232,190," + (t * 0.7) + ")";
  ctx.lineWidth = Math.max(1, 2.2 * t);
  ctx.beginPath();
  ctx.arc(0, 0, 6 + (1 - t) * 28, 0, TWO_PI);
  ctx.stroke();
  ctx.restore();
}

function stepSpinKnife(f, dt) {
  if (!f) return;
  /* нож только что создан в точке контакта: первый шаг кадра пропускаем, чтобы
     отскок начинался ровно там, где его увидели, а не на dt ниже
     (js/flow.js: beginRicochet) */
  if (f.fresh) {
    f.fresh = false;
    return;
  }
  f.vy += 2400 * dt;
  f.x += f.vx * dt;
  f.y += f.vy * dt;
  f.rot += f.vr * dt;
  f.vx *= Math.exp(-0.4 * dt);
}

function drawSpinKnife(f) {
  if (!f) return;
  /* скин летевшего ножа: рандомизатор мог уже сменить нож в руке */
  const img = knifeImgOf(f.skin);
  const [vw, vh] = knifeViewSize(img);
  const smoothQ = ctx.imageSmoothingQuality;
  if (smoothQ !== "high") ctx.imageSmoothingQuality = "high";
  ctx.save();
  ctx.translate(snap(f.x), snap(f.y));
  ctx.rotate(f.rot);
  ctx.drawImage(img, snap(-vw * 0.5), snap(-f.pivot - knifeTipAlign(img)), vw, vh);
  ctx.restore();
  if (smoothQ !== "high") ctx.imageSmoothingQuality = smoothQ;
}

/* ---------- прогрев холста с текстом ----------
   Первое рисование крупной надписи («БОСС», «ПОВЕРЖЕН», имя босса) заставляет
   браузер растеризовать глифы шрифта в нужном кегле. На телефоне это десятки
   миллисекунд, и кадр встаёт ровно в тот момент, когда сцена появляется.
   Поэтому один раз на старте (за заставкой) рисуем весь алфавит теми же
   шрифтами и кеглями, что и сцены/полоски: дальше глифы берутся из кэша, а
   анимация идёт без первого рывка. Размеры считаются теми же формулами, что в
   js/boss-sting.js, js/boss-victory.js и полоске HP. */
let prewarmTextKey = "";
function prewarmCanvasTexts() {
  if (!(visW > 0) || !(visH > 0) || !ctx) return;
  const m = Math.min(visW, visH);
  const titlePx = clamp(m * 0.132, 52, 118);
  const wordPx = clamp(m * 0.152, 44, 118);
  /* подпись шрифта: если в системе ещё запасной шрифт, прогретые глифы не те —
     когда приедет настоящий, ширина строки изменится и прогрев повторится */
  ctx.save();
  ctx.font = "900 100px Unbounded, Manrope, sans-serif";
  const sig = Math.round(ctx.measureText("ПОВЕРЖЕН").width);
  ctx.restore();
  /* крупные кегли прогреваем ТОЧНЫМИ строками сцен (их немного), мелкие —
     алфавитом: так прогревается всё нужное, но без тысяч лишних глифов. */
  const large = [
    ["БОСС", titlePx, 800, "Unbounded"],
    ["ПОВЕРЖЕН", wordPx, 900, "Unbounded"],
    ["ОБЫЧНЫЙ БОСС", titlePx * 0.62, 900, "Unbounded"],
    ["РЕДКИЙ БОСС", titlePx * 0.72, 900, "Unbounded"],
    ["ЛЕГЕНДАРНЫЙ БОСС", titlePx * 0.62, 900, "Unbounded"],
    ["ТАЙНЫЙ БОСС", titlePx * 0.72, 900, "Unbounded"]
  ];
  const small = [
    [Math.max(18, titlePx * 0.26), 700, "Unbounded"],
    [clamp(m * 0.046, 14, 30), 800, "Unbounded"],
    [22, 800, "Unbounded"],
    [12, 800, "Unbounded"],
    [21, 900, "Unbounded"]
  ];
  const key = sig + "|" + visW + "x" + visH;
  if (key === prewarmTextKey) return;
  prewarmTextKey = key;
  const chars = "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ0123456789↑/";
  const s = viewSx > 0 ? viewSx : 1;
  const [c, g] = makeCanvas(128, 128);
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.lineJoin = "round";
  g.strokeStyle = "#000";
  g.fillStyle = "#fff";
  const warmSize = (size, weight, fam) => {
    g.font = weight + " " + size + "px " + fam + ", Unbounded, Manrope, sans-serif";
  };
  for (let i = 0; i < large.length; i++) {
    const size = Math.max(4, Math.round(large[i][1] * s));
    warmSize(size, large[i][2], large[i][3]);
    g.lineWidth = Math.max(2, Math.round(size * 0.16));
    g.fillText(large[i][0], 64, 64);
    g.strokeText(large[i][0], 64, 64);
  }
  for (let i = 0; i < small.length; i++) {
    if (!small[i][0]) continue;
    const size = Math.max(4, Math.round(small[i][0] * s));
    warmSize(size, small[i][1], small[i][2]);
    g.lineWidth = Math.max(2, Math.round(size * 0.16));
    for (let k = 0; k < chars.length; k++) {
      /* глиф рисуется по одному и по центру маленького полотна: он попадает в
         кэш целиком, даже если края обрезаны */
      g.fillText(chars[k], 64, 64);
      g.strokeText(chars[k], 64, 64);
    }
  }
  releaseCanvas(c);
  /* Метрики крупных надписей сцен: measureText на огромном Unbounded — это
     заметная работа (на слабом телефоне — десятки мс). Греем на заставке,
     чтобы сцена босса не платила за это в своём кадре. */
  try {
    if (typeof victoryWordPx === "function") victoryWordPx();
  } catch (err) {}
  try {
    if (typeof rarityLayout === "function") {
      const tiers = ["common", "rare", "legend", "secret"];
      for (let i = 0; i < tiers.length; i++) rarityLayout({ tier: tiers[i] }, titlePx);
    }
  } catch (err) {}
}

function drawFailKnife() {
  drawSpinKnife(game.fail);
}

/* ---------- нож на смерти: качается и гаснет ----------
   Пока идёт DEATH_FADE секунд, выбранный нож игрока висит в центре кадра,
   слегка качается и поворачивается, а тень ползёт ОТ ОСТРИЯ к концу рукояти:
   нож «гаснет». Заодно тикает таймер (js/sim.js) и висит кнопка ролика
   (js/flow.js: showReviveButton). Погас — открывается «ПРОИГРЫШ». */
let deathDark = null;
let deathDarkFor = null;

/* Затемнённая копия спрайта ножа: рисуем картинку и заливаем её чёрным по
   силуэту (source-in), поэтому вне лезвия и рукояти ничего не пачкается. */
function deathDarkSprite(img) {
  if (!img) return null;
  if (deathDarkFor === img && deathDark) return deathDark;
  const w = img.width | 0;
  const h = img.height | 0;
  if (!(w > 0 && h > 0)) return null;
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const g = cv.getContext("2d");
  g.drawImage(img, 0, 0);
  g.globalCompositeOperation = "source-in";
  g.fillStyle = "rgba(0, 0, 0, 0.9)";
  g.fillRect(0, 0, w, h);
  deathDark = cv;
  deathDarkFor = img;
  return cv;
}

function drawDeathKnife() {
  const t = (game.deathT || 0) - DEATH_SCENE_DELAY;
  if (!(t >= 0) || game.deathDone) return;
  const img = knifeImg();
  if (!img) return;
  const [bw, bh] = knifeViewSize(img);
  if (!(bw > 0 && bh > 0)) return;
  const u = clamp(t / DEATH_FADE, 0, 1);
  const k = Math.min(W, H) * 0.42 / bh;
  const w = bw * k;
  const h = bh * k;
  const pad = knifeTipAlign(img) * k;
  const sway = Math.sin(t * 2.1) * Math.min(W, H) * 0.008;
  const rot = 0.12 + Math.sin(t * 1.55 + 0.4) * 0.06;
  /* нож сцены смерти — чуть правее центра (просьба заказчика) */
  const cx = W * 0.5 + Math.min(W, H) * 0.03 + sway;
  /* нож ровно по центру кадра: середина клинка на середине экрана по высоте */
  const cy = H * 0.44 - h * 0.5 + Math.cos(t * 1.7) * Math.min(W, H) * 0.006;
  ctx.save();
  ctx.translate(snap(cx), snap(cy));
  ctx.rotate(rot);
  ctx.drawImage(img, -w * 0.5, -pad, w, h);
  /* тень ползёт от острия к концу рукояти */
  const dark = deathDarkSprite(img);
  if (dark && u > 0.001) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(-w * 0.5, -pad, w, h * u + 1);
    ctx.clip();
    ctx.drawImage(dark, -w * 0.5, -pad, w, h);
    ctx.restore();
  }
  ctx.restore();
}

