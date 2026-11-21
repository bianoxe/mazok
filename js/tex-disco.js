/* ---------- ДИСКО ШАР ----------
   Зеркальный шар: сфера в мелких плитках, каждая плитка ловит свет по своей
   нормали. Фото у босса нет и не нужно — объём считается прямо здесь, поэтому
   кромка диска и кромка под ножом (hit.js: surfaceRadius) — один и тот же
   ровный круг, и нож садится на одну глубину с любого угла.

   Текстура статична, а блиск живой: шар «дышит» яркостью, по плите бежит полоса
   света, и каждые ~110 мс по всему диску вспыхивает другая горстка зеркал
   (drawDiscoLive). Слой рисуется поверх диска так же, как живой слой фена
   (js/draw-log.js: drawFanLive). */

const DISCO_ROWS = 9;          /* рядов плитки от полюса до полюса */
/* Плиток по кругу вдвое больше видимых: обратная сторона шара отбрасывается (её
   всё равно не видно), и на диск приходится ровно половина — те же мелкие
   зеркала, что были, когда рисовались обе стороны и задние перекрывали передние */
const DISCO_COLS = 24;
/* Свет в зале стоит вокруг шара, а не один сбоку: четыре прожектора,
   по одному на каждую сторону. Одного света не хватало — шар делился на
   светлую и чёрную половину, хотя зеркальный шар в зале светится весь. */
const DISCO_LIGHTS = [
  [-0.58, -0.62, 0.53],
  [0.60, -0.30, 0.74],
  [-0.34, 0.62, 0.71],
  [0.46, 0.58, 0.67]
];
const DISCO_HUES = [
  [132, 214, 255],
  [186, 152, 255],
  [255, 152, 226],
  [142, 244, 214],
  [232, 238, 250]
];
const DISCO_SPARKS = 7;
const DISCO_FLASH = 14;      /* сколько плиток мигает за раз в живом слое */
const DISCO_SPARK_COLS = ["#ffffff", "#b6ecff", "#e2c4ff", "#ffc6f2"];

/* Цвет плитки: суммарный свет всех прожекторов плюс зеркальная вспышка в упор
   к ближайшему. Тени не чёрные: плитка — зеркало, она всегда что-то отражает,
   поэтому даже самая тёмная держится около 0.8 яркости и в чёрноту не уходит */
function discoTileRgb(base, lit, front, spec) {
  const k = Math.min(1.06, (0.72 + 0.34 * lit) * (0.86 + 0.14 * front));
  const w = Math.min(150, spec * 180);
  const r = clamp(Math.round(base[0] * k + w), 0, 255);
  const g = clamp(Math.round(base[1] * k + w), 0, 255);
  const b = clamp(Math.round(base[2] * k + w), 0, 255);
  return "rgb(" + r + "," + g + "," + b + ")";
}

function makeDiscoTex() {
  /* фото: зеркальный шар — диском; живой слой бликов (drawDiscoLive) остаётся */
  const photo = bossPhotoTex("disco");
  if (photo) return photo;
  const size = BOSS_TEX;
  const R = BOSS_TEX_R;
  const [c, g] = makeCanvas(size, size);
  g.translate(R, R);
  g.save();
  g.beginPath();
  g.arc(0, 0, R - 0.5, 0, TWO_PI);
  g.clip();

  /* Швы: между плитками видно тёмную глубину шара, а не плоскую заливку */
  const back = g.createRadialGradient(-R * 0.3, -R * 0.34, R * 0.08, 0, 0, R);
  back.addColorStop(0, "#3e4656");
  back.addColorStop(0.68, "#1e222c");
  back.addColorStop(1, "#0a0c12");
  g.fillStyle = back;
  g.fillRect(-R, -R, size, size);

  /* Плитка на сфере: угол phi — широта (−π/2 макушка), theta — долгота.
     Ортографическая проекция: (R·cosφ·sinθ, R·sinφ), нормаль — тот же вектор. */
  const px = [0, 0, 0, 0];
  const py = [0, 0, 0, 0];
  for (let i = 0; i < DISCO_ROWS; i++) {
    const p0 = -Math.PI * 0.5 + (i / DISCO_ROWS) * Math.PI;
    const p1 = -Math.PI * 0.5 + ((i + 1) / DISCO_ROWS) * Math.PI;
    const pm = (p0 + p1) * 0.5;
    const cols = Math.max(5, Math.round(DISCO_COLS * Math.cos(pm)));
    for (let j = 0; j < cols; j++) {
      const t0 = (j / cols) * TWO_PI;
      const t1 = ((j + 1) / cols) * TWO_PI;
      const tm = (t0 + t1) * 0.5;
      const nx = Math.cos(pm) * Math.sin(tm);
      const ny = Math.sin(pm);
      const nz = Math.cos(pm) * Math.cos(tm);
      /* Рисуем только видимую половину: задние плитки ложились в ту же точку
         диска, что и передние, и, дорисованные позже, перекрывали их — отсюда и
         бралась тёмная половина шара. Кромка (nz → 0) не нужна: там шов и так
         залит тенью */
      if (nz <= 0.04) continue;
      /* четыре прожектора: плитка складывает свет от всех сразу, поэтому нет
         ни «светлой», ни «тёмной» половины — шар горит ровно и целиком */
      let sum = 0;
      let best = 0;
      for (let li = 0; li < DISCO_LIGHTS.length; li++) {
        const L = DISCO_LIGHTS[li];
        const d = nx * L[0] + ny * L[1] + nz * L[2];
        if (d <= 0) continue;
        sum += d;
        if (d > best) best = d;
      }
      /* вспышка — только от ближайшего к плите прожектора: у каждой грани свой,
         поэтому по шару рассыпаны отдельные горячие зеркала, а не одно белое
         пятно на полшара. Степень высокая: горячей становится плитка, чья
         нормаль смотрит в прожектор почти в упор */
      const spec = Math.pow(best, 20);
      /* подсветка зала: даже отвёрнутая от всех прожекторов плитка не чернеет */
      const lit = 0.48 + 0.52 * (sum / DISCO_LIGHTS.length);
      /* у каждой плитки своя яркость: зеркала стоят под разными углами, и шар
         читается гранёным уже в статике (превью, окно боссов, кадр на паузе) */
      const jit = 0.86 + hash(i * 17 + 3, j * 29 + 7) * 0.3;
      const hue = DISCO_HUES[(i * 5 + j * 3) % DISCO_HUES.length];
      g.fillStyle = discoTileRgb(hue, lit * jit, nz, Math.min(1, spec * 0.95));

      const phi = [p0, p0, p1, p1];
      const th = [t0, t1, t1, t0];
      let mx = 0, my = 0;
      for (let q = 0; q < 4; q++) {
        const cf = Math.cos(phi[q]);
        px[q] = R * cf * Math.sin(th[q]);
        py[q] = R * Math.sin(phi[q]);
        mx += px[q];
        my += py[q];
      }
      mx /= 4;
      my /= 4;
      /* ужимаем плитку к её центру на пару процентов — так проступает шов */
      g.beginPath();
      for (let q = 0; q < 4; q++) {
        const x = mx + (px[q] - mx) * 0.93;
        const y = my + (py[q] - my) * 0.93;
        if (q === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.closePath();
      g.fill();
    }
  }

  /* Объём сферы: общий блик сверху слева и мягкая тень к кромке. Тень здесь
     только для круглости — она не должна съедать половину шара, поэтому к
     кромке он темнеет чуть-чуть, а не в чёрноту */
  const shade = g.createRadialGradient(-R * 0.34, -R * 0.38, R * 0.04, 0, 0, R * 1.02);
  shade.addColorStop(0, "rgba(255,255,255,0.22)");
  shade.addColorStop(0.34, "rgba(255,255,255,0.06)");
  shade.addColorStop(0.66, "rgba(255,255,255,0)");
  shade.addColorStop(0.9, "rgba(10,12,20,0.12)");
  shade.addColorStop(1, "rgba(6,8,14,0.34)");
  g.fillStyle = shade;
  g.fillRect(-R, -R, size, size);

  /* Подвеса нет: плашка с дужкой читалась как навесной замок посреди шара,
     а шар всё равно крутится (boss-spin.js: DISCO_STEP) — любая деталь на
     макушке уезжала бы вбок и снизу. Зеркальный диск висит сам по себе. */

  /* Несколько искр впаяны в рисунок: шар блистел и без кадровой анимации
     (превью, окно боссов, кадр на паузе) */
  discoSparkBaked(g, -R * 0.3, -R * 0.34, R * 0.19, "#ffffff", 0.85);
  discoSparkBaked(g, R * 0.34, -R * 0.06, R * 0.12, "#cfeaff", 0.6);
  discoSparkBaked(g, R * 0.06, R * 0.42, R * 0.1, "#ffd6f4", 0.5);

  g.restore();
  return c;
}

/* Четырёхлучевая искра: так блик читается как отражение прожектора, а не как
   белое пятно */
function discoSparkBaked(g, x, y, s, col, alpha) {
  g.globalAlpha = alpha;
  g.fillStyle = col;
  g.beginPath();
  g.moveTo(x, y - s);
  g.quadraticCurveTo(x + s * 0.14, y - s * 0.14, x + s, y);
  g.quadraticCurveTo(x + s * 0.14, y + s * 0.14, x, y + s);
  g.quadraticCurveTo(x - s * 0.14, y + s * 0.14, x - s, y);
  g.quadraticCurveTo(x - s * 0.14, y - s * 0.14, x, y - s);
  g.fill();
  g.globalAlpha = alpha * 0.55;
  g.beginPath();
  g.arc(x, y, s * 0.2, 0, TWO_PI);
  g.fill();
  g.globalAlpha = 1;
}

/* Живой блиск: мигает весь шар, а не уголок — по зеркалам бегает полоса света,
   сам шар медленно «дышит» яркостью, а каждые ~110 мс вспыхивает другая горстка
   плитки по всему диску. Рисуется поверх диска (js/draw-log.js), в мировых
   координатах — поэтому сам переводит начало в центр бревна, как drawCandyGlint */
function drawDiscoLive(r) {
  const log = game.log;
  const ms = game.time || 0;
  const t = ms * 0.001;
  ctx.save();
  ctx.translate(snap(log.x), snap(log.y));
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.985, 0, TWO_PI);
  ctx.clip();
  ctx.globalCompositeOperation = "lighter";

  /* Дыхание: весь диск разом то ярче, то тише. Медленно и неглубоко — так светит
     прожектор в зале, строб здесь читался бы как баг */
  const breath = 0.05 + 0.035 * Math.sin(t * 2.1) + 0.025 * Math.sin(t * 3.7 + 1.3);
  ctx.fillStyle = "rgba(186,214,255," + clamp(breath, 0, 1).toFixed(3) + ")";
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TWO_PI);
  ctx.fill();

  /* Полоса света: мягкое пятно обегает шар по косой орбите. В режиме lighter
     зеркала вспыхивают, а не закрашиваются белым */
  const a = t * 0.8;
  const sx = Math.cos(a) * r * 0.6;
  const sy = Math.sin(a * 0.83) * r * 0.46;
  const band = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 0.62);
  band.addColorStop(0, "rgba(198,240,255,0.3)");
  band.addColorStop(0.5, "rgba(150,196,255,0.12)");
  band.addColorStop(1, "rgba(150,196,255,0)");
  ctx.fillStyle = band;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TWO_PI);
  ctx.fill();

  /* Мигание плитки: раз в ~110 мс вспыхивает другая горстка зеркал, разбросанных
     по всему диску — и в центре, и у самой кромки. Вспышка гаснет к концу своего
     шага, поэтому мигание идёт волной, а не строгим стробом */
  const bucket = Math.floor(ms / 110);
  const fade = 1 - ((ms % 110) / 110) * 0.55;
  for (let i = 0; i < DISCO_FLASH; i++) {
    const s1 = bucket * 41 + i * 7;
    const ang = hash(s1, 1) * TWO_PI;
    const rad = Math.sqrt(hash(s1, 2)) * r * 0.9;
    const size = r * (0.03 + hash(s1, 3) * 0.05);
    const col = DISCO_SPARK_COLS[(bucket + i) % DISCO_SPARK_COLS.length];
    discoSparkBaked(ctx, Math.cos(ang) * rad, Math.sin(ang) * rad, size, col, 0.5 * fade);
  }

  /* Живые искры: своё место, своя фаза и своя скорость у каждой — вместе
     читается как «шар играет», а не как ровная гирлянда */
  for (let i = 0; i < DISCO_SPARKS; i++) {
    const phase = t * (0.5 + hash(31, i) * 0.55) + hash(32, i);
    const k = Math.sin((phase % 1) * Math.PI);
    if (k < 0.1) continue;
    const ang = hash(33, i) * TWO_PI + t * (0.1 + hash(34, i) * 0.22) * (i % 2 ? -1 : 1);
    const rad = r * (0.16 + hash(35, i) * 0.7);
    const size = r * (0.035 + 0.075 * k) * (0.7 + hash(36, i) * 0.7);
    discoSparkBaked(ctx, Math.cos(ang) * rad, Math.sin(ang) * rad * 0.92, size,
      DISCO_SPARK_COLS[i % DISCO_SPARK_COLS.length], 0.62 * k);
  }
  ctx.restore();
}
