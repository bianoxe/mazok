/* Картинка ножа по скину. У ножа в руке скин текущий, из сейва (js/knife.js:
   knifeImg), а у летящего и воткнутого — свой, снимок с самого ножа
   (js/flow.js: queueThrow кладёт skin на бросок). Иначе рандомизатор из
   альманаха перекрашивал бы брошенный нож прямо в полёте. */
function knifeImgOf(skinId) {
  return (skinId && assets.knives && assets.knives[skinId]) || knifeImg();
}

function drawKnifeImg(x, y, rot, scale, alpha, sy, soft, skinId) {
  const img = knifeImgOf(skinId);
  /* ресайз может прийти раньше сборки спрайтов (загрузка, адресная строка на
     телефоне) — тогда картинки ещё нет, и рисовать нечего */
  if (!img) return;
  /* глобально в кадре стоит "low" ради FPS; для ножей это и давало мыло на
     телефоне — поднимаем качество только на время блита */
  const smoothQ = ctx.imageSmoothingQuality;
  if (smoothQ !== "high") ctx.imageSmoothingQuality = "high";
  const [bw, bh] = knifeViewSize(img);
  const syMul = sy == null ? scale : sy;
  const w = soft ? bw * scale : snapLen(bw * scale);
  const h = soft ? bh * syMul : snapLen(bh * syMul);
  const pad = knifeTipAlign(img) * syMul;
  const px = soft ? x : snap(x);
  const py = soft ? y : snap(y);
  ctx.save();
  ctx.globalAlpha = alpha;
  if (rot) {
    ctx.translate(px, py);
    ctx.rotate(rot);
    ctx.drawImage(img, soft ? -w * 0.5 : snap(-w * 0.5), soft ? -pad : snap(-pad), w, h);
  } else {
    ctx.drawImage(img, soft ? px - w * 0.5 : snap(px - w * 0.5), soft ? py - pad : snap(py - pad), w, h);
  }
  ctx.restore();
  if (smoothQ !== "high") ctx.imageSmoothingQuality = smoothQ;
}

/* Нож в полёте — один рисунок на свой бросок и на бросок бота (js/frame.js,
   js/mode1v1.js): та же картинка, тот же размер, то же сглаживание и снап.
   rot 0 — свой нож, он идёт снизу вверх остриём вперёд; π — нож бота, сверху
   вниз, тоже остриём вперёд. x, y — точка острия. */
function drawFlyKnife(x, y, rot, skinId) {
  drawKnifeImg(x, y, rot, 1, 1, null, false, skinId);
}

function wavyPath(g, r, wobble, seed) {
  g.beginPath();
  for (let a = 0; a <= TWO_PI + 0.08; a += 0.08) {
    const wr = r + Math.sin(a * 5 + seed) * wobble;
    const x = Math.cos(a) * wr;
    const y = Math.sin(a) * wr;
    if (a === 0) g.moveTo(x, y); else g.lineTo(x, y);
  }
  g.closePath();
}

function strokeCrackPts(pts, last, r, ox, oy) {
  ctx.beginPath();
  for (let i = 0; i < last; i++) {
    const x = pts[i].x * r + ox, y = pts[i].y * r + oy;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
}

function fillCrackPoly(pts, last, r, w0, w1) {
  if (last < 2) return false;
  ctx.beginPath();
  for (let i = 0; i < last; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(last - 1, i + 1)];
    let nx = b.y - a.y, ny = a.x - b.x;
    const len = Math.hypot(nx, ny) || 1;
    nx /= len;
    ny /= len;
    const t = i / (last - 1);
    const w = w0 + (1 - t) * w1;
    polyLX[i] = pts[i].x * r + nx * w;
    polyLY[i] = pts[i].y * r + ny * w;
    polyRX[i] = pts[i].x * r - nx * w;
    polyRY[i] = pts[i].y * r - ny * w;
  }
  ctx.moveTo(polyLX[0], polyLY[0]);
  for (let i = 1; i < last; i++) ctx.lineTo(polyLX[i], polyLY[i]);
  for (let i = last - 1; i >= 0; i--) ctx.lineTo(polyRX[i], polyRY[i]);
  ctx.closePath();
  return true;
}

function shapePath(id, r) {
  const key = id || "disc";
  const qr = (r * 4 + 0.5) | 0;
  if (shapePathObj && shapePathId === key && shapePathR === qr) return shapePathObj;
  const pr = qr * 0.25;
  const p = new Path2D();
  if (key === "heart") pathHeart(p, pr);
  else if (key === "egg") pathEgg(p, pr);
  else if (key === "pumpkin") pathPumpkin(p, pr);
  else if (key === "saw") pathSaw(p, pr);
  else if (key === "cog") pathGear(p, pr);
  else if (key === "donut") pathDonut(p, pr);
  else if (key === "lifebelt") pathLifebelt(p, pr);
  else if (key === "helm") pathHelm(p, pr);
  else if (key === "aegis") pathAegis(p, pr);
  else if (key === "balloon") pathBalloon(p, pr);
  else {
    p.arc(0, 0, Math.max(0, pr), 0, TWO_PI);
    p.closePath();
  }
  shapePathId = key;
  shapePathR = qr;
  shapePathObj = p;
  return p;
}

function shapeFillRule(id) {
  return id === "donut" || id === "lifebelt" ? "evenodd" : "nonzero";
}

function clipShape(id, r) {
  ctx.clip(shapePath(id, r), shapeFillRule(id));
}

/* Вырезает из полотна ОДНУ дырку фигуры (пончик, спасательный круг). Клип самим
   кольцом (clipShape) тут не годится: он срезает всё за кромкой, а у ножа выше
   кромки стоит рукоять — на пончике ножи пропадали совсем (жалоба заказчика).
   Здесь наоборот: берём всё полотно и вынимаем из него дырку. Кромка с рукоятью
   остаются целыми, а в дырке ножа не видно. */
function clipPunchHole(id, r) {
  const big = r * 3;
  const hole = Math.max(1, bossDrawHole(id, r));
  const p = new Path2D();
  p.moveTo(-big, -big);
  p.lineTo(big, -big);
  p.lineTo(big, big);
  p.lineTo(-big, big);
  p.closePath();
  /* В путь кладём ТОЛЬКО дырку. Добавить сюда кольцо (js/shapes.js: pathDonut
     кладёт разом и кромку, и дырку) нельзя: при правиле evenodd круг кромки
     вычтет ещё и само кольцо, а на нём стоит основание клинка. */
  p.moveTo(hole, 0);
  p.arc(0, 0, hole, 0, TWO_PI);
  p.closePath();
  ctx.clip(p, "evenodd");
}

function fillShape(id, r) {
  ctx.fill(shapePath(id, r), shapeFillRule(id));
}

function strokeShape(id, r) {
  ctx.stroke(shapePath(id, r));
}
