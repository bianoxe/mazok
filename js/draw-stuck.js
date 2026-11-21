function traceWedge(c0, c1, r, hole) {
  const a0 = ((c0.ang % TWO_PI) + TWO_PI) % TWO_PI;
  let a1 = ((c1.ang % TWO_PI) + TWO_PI) % TWO_PI;
  if (a1 <= a0) a1 += TWO_PI;
  ctx.beginPath();
  if (hole > 2) {
    ctx.arc(0, 0, r, a0, a1, false);
    ctx.arc(0, 0, hole, a1, a0, true);
    ctx.closePath();
    return;
  }
  ctx.moveTo(0, 0);
  for (let i = 0; i < c0.pts.length; i++) ctx.lineTo(c0.pts[i].x * r, c0.pts[i].y * r);
  ctx.lineTo(Math.cos(a0) * r, Math.sin(a0) * r);
  ctx.arc(0, 0, r, a0, a1, false);
  for (let i = c1.pts.length - 1; i >= 0; i--) ctx.lineTo(c1.pts[i].x * r, c1.pts[i].y * r);
  ctx.closePath();
}

/* Ножи, которые воткнуты в босса или бревно, показываются ОБЫЧНЫМ ножом:
   скин игрока — у того ножа, что бросил он сам (k.player). Рисуем ИСХОДНЫЙ
   спрайт 180×500 напрямую: раньше его сначала пекли в канвас размером ножа на
   экране (≈90 px), а на телефоне этот канвас растягивался ещё в ~2 раза — ножи
   и выглядели мылом. Исходник при экранном масштабе ложится почти 1:1. */
function knifeDispImg(skinId) {
  const id = skinId || save.knife || "classic";
  return (typeof knifeDrawImg === "function" ? knifeDrawImg(id) : null) ||
    (assets.knives && assets.knives[id]) || knifeImg() || null;
}

function drawStuckKnives(r, knives, bossId, clipOut) {
  if (!knives || !knives.length) return;
  const smooth = ctx.imageSmoothingEnabled;
  const quality = ctx.imageSmoothingQuality;
  ctx.imageSmoothingEnabled = true;
  /* high, а не low: на телефоне «low» вместе с апскейлом давал мыло */
  ctx.imageSmoothingQuality = "high";
  const id = bossId || (game.log.boss && game.log.boss.id) || "";
  /* Нож рисуется ЦЕЛИКОМ. У боссов с необычной формой (сердце, штурвал, яйцо,
     кактус) силуэт — не круг, и любой круговой вырез резал клинок пополам: нож
     висел в воздухе. Видимую поверх кромки часть и так закрывает рисунок босса,
     поэтому полный блит корректен для любой формы. */
  for (const k of knives) {
    /* ножи, что стояли в боссе/бревне с самого начала, — обычные (classic);
       скин игрока — у его собственного ножа, и свой у каждого: с рандомизатором
       нож в руке к моменту удара уже другой (js/flow.js: stickKnife) */
    const skinId = k.skin || (k.player ? save.knife : "classic");
    /* Готовую картинку держим НА САМОМ НОЖЕ: без строкового ключа и поиска в
       кэше на каждый нож в каждом кадре (на бревне их десятки). Размер ножа
       меняется только при ресайзе — тогда ключ не совпадёт. */
    let img = k._dispImg;
    if (!img || k._dispSkin !== skinId) {
      img = knifeDispImg(skinId);
      k._dispImg = img;
      k._dispSkin = skinId;
    }
    if (!img) continue;
    ctx.save();
    /* пончик — кольцо вокруг дырки, и нож входит в него как в бревно: острие
       уходит за край дырки. Дырку вырезаем, а не всё кольцо: рукоять стоит выше
       кромки, и клип кольцом срезал бы её — на пончике ножи пропадали. Так видно
       ровно то же, что у бревна: рукоять да основание клинка над кромкой */
    if (id === "donut") clipPunchHole("donut", r);
    const rad = r * (k.rad > 0 ? k.rad : 1);
    /* k.scale — запас на будущее: у ножа бота он 1, то есть в дереве он ровно
       того же размера, что летел */
    const ksc = k.scale > 0 ? k.scale : 1;
    const embed = bladeEmbed(rad, id) * ksc;
    const along = (k.kick || 0) * 0.12 + (k.sink || 0);
    ctx.rotate(k.rel - Math.PI / 2);
    ctx.translate(0, rad);
    const vw = knifeW * ksc;
    const vh = knifeH * ksc;
    const dx = snap(-vw * 0.5);
    /* остриё всех скинов — на одной глубине с классикой (размер спрайта тот же) */
    const dy = snap(-embed - knifeTipAlign(img) * ksc + along);
    ctx.drawImage(img, dx, dy, vw, vh);
    if (!phone && k.flash > 0.02) {
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = k.flash * 0.85;
      ctx.drawImage(img, dx, dy, vw, vh);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }
    ctx.restore();
  }
  ctx.imageSmoothingEnabled = smooth;
  ctx.imageSmoothingQuality = quality;
}

/* ---------- яблоки на бревне ----------
   Обычно снаружи кромки впритык (центр APPLE_R_OUT · r), но у сердца свой rr:
   его яблоки лежат НА долях (BOSS_APPLES.heart в js/progress.js), внутри
   круглого APPLE_R_OUT. Поверх бревна. Черенок наружу. */
function drawLogApples(r) {
  const list = game.logApples;
  if (!list || !list.length) return;
  const size = r * APPLE_BODY;
  const out = typeof APPLE_R_OUT === "number" ? APPLE_R_OUT : 1 + APPLE_BODY + 0.06;
  for (let i = 0; i < list.length; i++) {
    const a = list[i];
    if (a.taken) continue;
    /* обычное, золотое или алмазное — спрайт по виду яблока */
    const apple = appleImg(a.kind);
    if (!apple) continue;
    const d = r * (a.rr > 0 ? a.rr : out);
    ctx.save();
    ctx.rotate(a.rel - Math.PI / 2);
    ctx.translate(0, d);
    ctx.rotate(Math.PI);
    ctx.drawImage(apple, snap(-size), snap(-size), size * 2, size * 2);
    ctx.restore();
  }
}

/* Где яблоко стоит в мире и как повёрнуто. Та же раскладка, что у drawLogApples,
   только в мировых числах: по ней появляются половины разрезанного яблока
   (js/flow.js: takeLogApple), поэтому срез встаёт ровно туда, где висело яблоко.
   Бревно с яблоками боссом не бывает, так что наклон и покачивание (tilt, ox/oy
   из drawLog) тут не нужны. */
function logApplePose(a) {
  const log = game.log;
  const d = log.r * (a.rr > 0 ? a.rr : APPLE_R_OUT);
  const wa = a.rel + log.angle;
  return {
    x: log.x + Math.cos(wa) * d,
    y: log.y + Math.sin(wa) * d,
    /* спрайт перевёрнут (Math.PI в drawLogApples): низ яблока смотрит в бревно,
       а ось разреза ложится по касательной к кромке */
    rot: wa + Math.PI / 2,
    d: d
  };
}

/* Половины разрезанного яблока: летят от бревна и тают (js/fx.js). Размер тот
   же, что у целого яблока, — в кадре разреза рисунок не дёргается. */
function drawAppleHalves(r) {
  if (!appleHalves.length) return;
  const size = r * APPLE_BODY;
  const smooth = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = true;
  for (let i = 0; i < appleHalves.length; i++) {
    const h = appleHalves[i];
    const img = appleHalfImg(h.kind, h.side);
    if (!img) continue;
    ctx.save();
    if (h.a < 1) ctx.globalAlpha = h.a;
    /* позиция и поворот половин — мировые: рисуем их там, где разрезали */
    ctx.translate(snap(h.x), snap(h.y));
    ctx.rotate(h.rot);
    ctx.drawImage(img, snap(-size), snap(-size), size * 2, size * 2);
    ctx.restore();
  }
  ctx.imageSmoothingEnabled = smooth;
}

/* светотень поверх запечённой текстуры: блик сверху слева и затемнение к кромке */
const BOSS_SHADE = {
  valve: { hi: "rgba(255,255,255,0.05)", edge: "rgba(6, 8, 12, 0.16)" },
  aegis: { hi: "rgba(255, 232, 196, 0.14)", edge: "rgba(42, 22, 8, 0.22)" },
  fan: { hi: "rgba(255,255,255,0.05)", edge: "rgba(24, 18, 14, 0.16)" },
  candy: { hi: "rgba(255,255,255,0.1)", edge: "rgba(140, 24, 36, 0.12)" },
  lifebelt: { hi: "rgba(255,255,255,0.06)", edge: "rgba(120, 16, 28, 0.06)" },
  donut: { hi: "rgba(255,255,255,0.16)", edge: "rgba(90, 24, 48, 0.1)" },
  tire: { hi: "rgba(255,255,255,0.12)", edge: "rgba(8, 10, 14, 0.3)" },
  pepsi: { hi: "rgba(255,255,255,0.18)", edge: "rgba(8, 12, 20, 0.24)" },
  coin: { hi: "rgba(255,255,255,0.18)", edge: "rgba(30, 20, 4, 0.2)" },
  balloon: { hi: "rgba(255,255,255,0.2)", edge: "rgba(70, 24, 40, 0.14)" },
  pie: { hi: "rgba(255,255,255,0.13)", edge: "rgba(74, 34, 6, 0.3)" },
  cog: { hi: "rgba(255,255,255,0.2)", edge: "rgba(10, 14, 20, 0.28)" },
  tennis: { hi: "rgba(255,255,255,0.16)", edge: "rgba(40, 54, 6, 0.18)" },
  /* сердце: затемнение уходит в свой тёмный багровый, а не в коричневый wood */
  heart: { hi: "rgba(255, 210, 210, 0.12)", edge: "rgba(60, 0, 8, 0.22)" },
  wood: { hi: "rgba(255,255,255,0.16)", edge: "rgba(20, 6, 4, 0.28)" }
};

/* Белая копия текстуры по её альфе — для живого пути (когда запечённого
   спрайта ещё нет). Как и в js/draw-log.js: hitMaskFor, вспышка обязана лечь
   по силуэту картинки, а не кругом r. */
let texHitMaskC = null;
let texHitMaskSrc = null;
function texHitMask(tex) {
  if (texHitMaskC && texHitMaskSrc === tex) return texHitMaskC;
  const w = tex && tex.width ? tex.width : BOSS_TEX;
  const h = tex && tex.height ? tex.height : BOSS_TEX;
  if (texHitMaskC) releaseCanvas(texHitMaskC);
  const [c, g] = makeCanvas(w, h);
  g.drawImage(tex, 0, 0);
  g.globalCompositeOperation = "source-in";
  g.fillStyle = "#fff";
  g.fillRect(0, 0, w, h);
  texHitMaskC = c;
  texHitMaskSrc = tex;
  return c;
}

function drawLogContents(r, dmg, hitFlash, look) {
  look = look || {};
  const boss = look.boss !== undefined ? look.boss : game.log.boss;
  const maxHp = look.maxHp || game.log.maxHp || LOG_HP;
  const th = themeFor(look.level || game.level);
  const themeIdx = look.theme != null ? look.theme : game.theme;
  const cracks = look.cracks || game.cracks;
  hitFlash = hitFlash || 0;
  const t = maxHp > 0 ? dmg / maxHp : 0;

  if (boss) {
    /* Фото-босс: только спрайт — без обводки, тени, порчи и трещин.
       Помидор / жевачка / пила: без клипа — края из альфы.
       Щит/штурвал-фото: клип диском. */
    const photo = bossHasPhoto(boss.id);
    const sprite = photo && bossPhotoIsSprite(boss.id);
    const tex = boss.id === "ball" ? null : bossTex(boss.id);
    ctx.save();
    if (sprite) {
      /* края и выступы из альфы — без клипа, иначе срезает пупырки/черешок */
    } else if (photo && boss.id !== "helm") {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, TWO_PI);
      ctx.clip();
    } else {
      clipShape(boss.id, r);
    }
    if (boss.id === "ball") {
      paintBall(ctx, r);
    } else {
      if (boss.id === "helm" && !photo) {
        /* штурвал кладётся на r / HELM_RIM: обод (HELM_RIM рисунка) садится на
           круг бревна, а кончики спиц (HELM_TIP) выходят за него — силуэт
           (clipShape) и обвод идут по этому же рисунку */
        const half = r / HELM_RIM;
        if (tex) ctx.drawImage(tex, -half, -half, half * 2, half * 2);
        ctx.restore();
        ctx.strokeStyle = boss.outline;
        ctx.lineJoin = "round";
        ctx.lineWidth = Math.max(3.4, r * 0.03);
        strokeShape("helm", r);
        return;
      }
      const half = boss.id === "helm" ? r / HELM_RIM : sprite ? bossPhotoHalf(r) : r;
      if (tex) ctx.drawImage(tex, -half, -half, half * 2, half * 2);
      else {
        ctx.fillStyle = boss.fill;
        ctx.fillRect(-r, -r, r * 2, r * 2);
      }
      if (!photo && boss.id !== "heart") {
        const shade = ctx.createRadialGradient(-r * 0.18, -r * 0.22, r * 0.06, 0, 0, r);
        const tint = boss.shade || BOSS_SHADE[boss.id] || BOSS_SHADE.wood;
        shade.addColorStop(0, tint.hi);
        shade.addColorStop(0.45, "rgba(255,255,255,0)");
        shade.addColorStop(1, tint.edge);
        ctx.fillStyle = shade;
        fillShape(boss.id, r);
      }
    }
    if (!photo) {
      /* Сердце — мультяшное и всегда чистое: ни порчи (тёмное пятно, швы), ни
         трещин. Данные трещин у него остаются (game.cracks) — по ним сердце
         разлетается на клинья при смерти (js/flow.js: shatterLog), — но на
         живом боссе их не видно, как и у бревна (см. ниже). */
      if (boss.id !== "heart") {
        drawBossDegrade(boss, r, t);
        drawCracks(r, dmg, cracks, { boss, maxHp });
      }
    }
    if (hitFlash > 0) {
      const flashA = hitFlash * hitFlash * 0.42;
      if (photo && sprite && tex) {
        /* силуэтные фото: белое ровно по альфе, включая выступы и дырки */
        const mask = texHitMask(tex);
        const half = bossPhotoHalf(r);
        ctx.save();
        ctx.globalAlpha *= flashA;
        ctx.drawImage(mask, -half, -half, half * 2, half * 2);
        ctx.restore();
      } else {
        ctx.fillStyle = "rgba(255, 255, 255, " + flashA + ")";
        fillShape(boss.id, r);
      }
    }
    ctx.restore();
    if (photo) return;
    if (boss.id === "donut") {
      ctx.strokeStyle = boss.outline;
      ctx.lineWidth = Math.max(3.2, r * 0.034);
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, TWO_PI);
      ctx.stroke();
      ctx.strokeStyle = "#c98448";
      ctx.lineWidth = Math.max(2.4, r * 0.03);
      ctx.beginPath();
      ctx.arc(0, 0, r * DONUT_HOLE, 0, TWO_PI);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255, 244, 230, 0.7)";
      ctx.lineWidth = Math.max(1.2, r * 0.012);
      ctx.beginPath();
      ctx.arc(0, 0, r * DONUT_HOLE + Math.max(2.2, r * 0.018), 0, TWO_PI);
      ctx.stroke();
      return;
    }
    ctx.strokeStyle = boss.outline;
    ctx.lineWidth = Math.max(3.2, r * (boss.id === "heart" ? 0.028 : 0.034));
    strokeShape(boss.id, r);
    if (boss.id === "ball") {
      ctx.strokeStyle = "rgba(255,255,255,0.38)";
      ctx.lineWidth = Math.max(1.4, r * 0.016);
      strokeShape(boss.id, r * 0.945);
    } else {
      ctx.strokeStyle = "rgba(0,0,0,0.2)";
      ctx.lineWidth = Math.max(1.2, r * 0.012);
      strokeShape(boss.id, r * 0.972);
    }
    drawBossStem(boss.id, r);
    return;
  }

  const wood = assets.woods && assets.woods[themeIdx];
  const photoWood = !!(wood && wood.__photo);

  ctx.save();
  if (!photoWood) {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TWO_PI);
    ctx.clip();
  }

  if (wood) ctx.drawImage(wood, -r, -r, r * 2, r * 2);
  else {
    ctx.fillStyle = th.fill;
    ctx.fillRect(-r, -r, r * 2, r * 2);
  }

  if (!photoWood) {
    /* Только объём: к кромке темнее, в центре — ровный тон. Белое пятно в
       левом верхнем углу убрано: оно было одним и тем же у всех пород и
       читалось наклейкой, а не светом. */
    const shade = ctx.createRadialGradient(-r * 0.18, -r * 0.22, r * 0.24, 0, 0, r);
    shade.addColorStop(0, "rgba(36, 20, 10, 0)");
    shade.addColorStop(0.62, "rgba(36, 20, 10, 0.05)");
    shade.addColorStop(1, "rgba(36, 20, 10, 0.3)");
    ctx.fillStyle = shade;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TWO_PI);
    ctx.fill();
  }

  /* Чёрные трещины и «раскол» в центре у бревна убраны: заказчик попросил,
     чтобы при уроне дерево не покрывалось чёрными линиями. Трещины остались
     только в данных (game.cracks) — по ним бревно разлетается на клинья при
     разломе (js/flow.js: shatterLog), но на живом бревне их больше не видно.
     У боссов своя порча — она выше и не тронута. */

  if (hitFlash > 0) {
    const flashA = hitFlash * hitFlash * 0.42;
    if (photoWood && wood) {
      const mask = texHitMask(wood);
      ctx.save();
      ctx.globalAlpha *= flashA;
      ctx.drawImage(mask, -r, -r, r * 2, r * 2);
      ctx.restore();
    } else {
      ctx.fillStyle = "rgba(255, 255, 255, " + flashA + ")";
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, TWO_PI);
      ctx.fill();
    }
  }
  ctx.restore();

  if (photoWood) return;
  ctx.strokeStyle = th.outline;
  ctx.lineWidth = Math.max(3.2, r * 0.034);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TWO_PI);
  ctx.stroke();
  ctx.strokeStyle = "rgba(0,0,0,0.22)";
  ctx.lineWidth = Math.max(1.4, r * 0.014);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.972, 0, TWO_PI);
  ctx.stroke();
}


