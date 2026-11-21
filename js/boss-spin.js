/* кручение новых боссов: у каждого свой характер. Угол считается от накопленного
   времени, поэтому накаты, подкруты и покачивания не зависят от частоты кадров */
const SMOOTH_STYLE = {
  pie: {},                                                  /* пирог: полный оборот 360°, пауза, снова оборот */
  coin: { top: true },                                      /* волчок: затухание и подкрут */
  balloon: { sway: [], creep: 0 },                          /* висит на месте: не крутится, только качается (BALLOON_ROCK) */
  heart: {},                                                /* сердце: ровный ход без разгонов, рывков и остановок */
  target: {},                                               /* мишень: так же ровно, но оборот короче (SMOOTH_TURNS.target) */
  /* пиццы тут нет намеренно: она больше не идёт ровно — поворачивается ломтями,
     свой ход и своя пауза (PIZZA_STEP ниже) */
  marmalade: {},                                            /* жевачка: ровный каток в одну сторону, без качаний и рывков; оборот — SMOOTH_TURNS.marmalade */
  /* ни пэпси, ни шестерёнки тут нет намеренно: в угле банки нет ни слагаемых
     хода, ни покачивания — только ровный оборот (встряска банки живёт в
     smoothAlive и угла не касается), а отсчёт сотен градусов — отдельно, в
     stepSmoothSpin. У шестерёнки не оборот, а пружина на ровном ходу — своя
     механика в beginGearSpin/stepGearSpin, общий оборот ей не нужен */
};

/* ---------- шарик: качание на нитке ----------
   Латекс висит и покачивается, и крен — это настоящий поворот босса (log.angle),
   а не только картинка: от него зависит, куда смотрит фитиль — узел с ниткой под
   дном. Нож всегда идёт по центру снизу, поэтому в фитиль он садится только пока
   шарик стоит ровно; ушёл крен — нож втыкается в латекс сбоку и соскальзывает.
   Качание идёт по своему счётчику (log.balloonT), который не сбрасывается ни при
   смене латекса (nextBalloon), ни при заходе: второй шарик подхватывает фазу ровно
   там, где лопнул первый. Периоды разные: медленная волна даёт «шатание», быстрые —
   дрожь; вместе читается живой латекс на воздухе, а не ровно посаженный диск.
   Периоды подобраны ещё и под полёт ножа (THROW_MS): даже на самом быстром проходе
   крен успевает уйти лишь на две трети допуска, поэтому целиться надо по тому, что
   видно сейчас, а не вести упреждение на глаз. */
const BALLOON_ROCK = [
  [0.185, 1250],
  [0.06, 1900],
  [0.025, 700]
];
/* Допуск на фитиль: пока крен меньше этого, шейка с узлом смотрит ровно под нож.
   Дальше нож садится в бок шарика — это промах, шарик остаётся цел и качается
   дальше. Угол подобран по геометрии дна (±BALLOON_FUSE это полоса силуэта от
   узла до начала стяжки — ровно та кромка, где видно фитиль) и по ходу качания:
   при этом допуске фитиль стоит под ножом 39 % времени, а самое долгое окно —
   около 0.4 с, так что удар требует момента, но не превращается в лотерею. */
const BALLOON_FUSE = 0.1;
/* волчок: цикл затухания, подкрута и дожёвывания */
const COIN_TOP = { cycle: 2400, wane: 1700, kick: 240, settle: 460, floor: 0.26, over: 1.55 };

function smoothBaseOmega(id) {
  return TWO_PI / (SMOOTH_TURNS[id] || 900);
}

function smoothSlow() {
  return game.buffs.slow ? 1.7 : 1;
}

/* волнистый ход: ровный оборот плюс гармоники разгона и наката */
function smoothWaveAngle(id, t, w) {
  const terms = (SMOOTH_STYLE[id] || {}).terms;
  let ang = w * t;
  if (!terms) return ang;
  for (let i = 0; i < terms.length; i++) {
    const per = terms[i][1];
    ang += terms[i][0] * w * (per / TWO_PI) * (1 - Math.cos((TWO_PI * t) / per));
  }
  return ang;
}

function smoothWaveOmega(id, t, w) {
  const terms = (SMOOTH_STYLE[id] || {}).terms;
  let om = w;
  if (!terms) return om;
  for (let i = 0; i < terms.length; i++) {
    om += terms[i][0] * w * Math.sin((TWO_PI * t) / terms[i][1]);
  }
  return om;
}

/* парение: покачивание туда-обратно плюс очень медленный дрейф */
function smoothSwayAngle(id, t) {
  const st = SMOOTH_STYLE[id] || {};
  const sway = st.sway || [[0.6, 4000]];
  let ang = (st.creep || 0) * t;
  for (let i = 0; i < sway.length; i++) ang += sway[i][0] * Math.sin((TWO_PI * t) / sway[i][1]);
  return ang;
}

function smoothSwayOmega(id, t) {
  const st = SMOOTH_STYLE[id] || {};
  const sway = st.sway || [[0.6, 4000]];
  let om = st.creep || 0;
  for (let i = 0; i < sway.length; i++) om += sway[i][0] * (TWO_PI / sway[i][1]) * Math.cos((TWO_PI * t) / sway[i][1]);
  return om;
}

/* крен шарика: сумма синусов от счётчика качания (миллисекунды). Фаза живёт
   отдельно от spinT, поэтому её не сбрасывает ни заход, ни смена латекса */
function balloonRockAngle(t) {
  let ang = 0;
  for (let i = 0; i < BALLOON_ROCK.length; i++) {
    ang += BALLOON_ROCK[i][0] * Math.sin((TWO_PI * (t || 0)) / BALLOON_ROCK[i][1] + i * 1.9);
  }
  return ang;
}

/* производная крена — радианы на миллисекунду, как log.vel у прочих боссов */
function balloonRockOmega(t) {
  let om = 0;
  for (let i = 0; i < BALLOON_ROCK.length; i++) {
    const amp = BALLOON_ROCK[i][0];
    const per = BALLOON_ROCK[i][1];
    om += amp * (TWO_PI / per) * Math.cos((TWO_PI * (t || 0)) / per + i * 1.9);
  }
  return om;
}

/* попал ли нож в фитиль: rel — угол на боссе, куда садится остриё (см. hitRel) */
function balloonFuseHit(rel) {
  return angAbs(rel, Math.PI * 0.5) <= BALLOON_FUSE;
}

function coinWaneOmega(u, w) {
  const C = COIN_TOP;
  return w * (C.floor + (1 - C.floor) * Math.pow(1 - u, 1.6));
}

function coinWaneAngle(u, w) {
  const C = COIN_TOP;
  const p = 2.6;
  return w * C.wane * (C.floor * u + (1 - C.floor) * (1 - Math.pow(1 - u, p)) / p);
}

function coinKickOmega(u, w) {
  const C = COIN_TOP;
  const s = Math.sin(u * Math.PI * 0.5);
  return w * (C.floor + (C.over - C.floor) * s * s);
}

function coinKickAngle(u, w) {
  const C = COIN_TOP;
  return w * C.kick * (C.floor * u + (C.over - C.floor) * (u * 0.5 - Math.sin(u * Math.PI) / (2 * Math.PI)));
}

function coinSettleOmega(u, w) {
  const C = COIN_TOP;
  return w * (1 + (C.over - 1) * Math.pow(1 - u, 1.2));
}

function coinSettleAngle(u, w) {
  const C = COIN_TOP;
  const p = 2.2;
  return w * C.settle * (u + (C.over - 1) * (1 - Math.pow(1 - u, p)) / p);
}

function coinAngle(t, w) {
  const C = COIN_TOP;
  const n = Math.floor(t / C.cycle);
  let u = t - n * C.cycle;
  let ang = n * (coinWaneAngle(1, w) + coinKickAngle(1, w) + coinSettleAngle(1, w));
  if (u <= C.wane) return ang + coinWaneAngle(u / C.wane, w);
  ang += coinWaneAngle(1, w);
  u -= C.wane;
  if (u <= C.kick) return ang + coinKickAngle(u / C.kick, w);
  ang += coinKickAngle(1, w);
  u -= C.kick;
  return ang + coinSettleAngle(Math.min(1, u / C.settle), w);
}

function coinOmega(t, w) {
  const C = COIN_TOP;
  const u = t - Math.floor(t / C.cycle) * C.cycle;
  if (u <= C.wane) return coinWaneOmega(u / C.wane, w);
  if (u <= C.wane + C.kick) return coinKickOmega((u - C.wane) / C.kick, w);
  return coinSettleOmega(Math.min(1, (u - C.wane - C.kick) / C.settle), w);
}

/* ---------- сетка ножей ----------
   Ножи, воткнутые в босса, стоят ровными промежутками (BOSS_KNIVES),
   между ними ровно n свободных окон. У шины и пирога вращение устроено так,
   что в каждой паузе окно смотрит точно вверх — под нож игрока, — а все
   остановки приходятся на линии этой же сетки. У щита сетка просто торчит
   пятью ножами через равный шаг. */
function knifeGridPitch(id) {
  const n = (typeof BOSS_KNIVES === "object" && BOSS_KNIVES[id]) | 0;
  return n > 1 ? TWO_PI / n : 0;
}

/* ближайший угол, при котором окно между ножами смотрит вверх.
   Боссу без сетки угол не трогаем. */
function knifeGridSnap(id, ang) {
  const pitch = knifeGridPitch(id);
  if (!pitch) return ang;
  const home = Math.PI / 2 - pitch / 2;
  return home + Math.round((ang - home) / pitch) * pitch;
}

/* ---------- ход «разгон — торможение» ----------
   Скорость растёт степенью до доли a и падает после неё; пройденный путь
   считаем интегралом, поэтому фаза всегда заканчивается ровно в конце
   отрезка — без накопления ошибки. u — фаза 0..1, a — где пик скорости. */
function rampUnit(a, pa, pb) {
  return a / (pa + 1) + (1 - a) / (pb + 1);
}

function rampInt(u, a, pa, pb) {
  if (u <= 0) return 0;
  if (u >= 1) return rampUnit(a, pa, pb);
  if (u <= a) return (a * Math.pow(u / a, pa + 1)) / (pa + 1);
  const tail = Math.pow((1 - u) / (1 - a), pb + 1);
  return a / (pa + 1) + ((1 - a) / (pb + 1)) * (1 - tail);
}

function rampSpeed(u, a, pa, pb) {
  if (u <= 0 || u >= 1) return 0;
  if (u <= a) return Math.pow(u / a, pa);
  return Math.pow((1 - u) / (1 - a), pb);
}

function phaseAngle(u, travel, a, pa, pb) {
  return (travel * rampInt(u, a, pa, pb)) / rampUnit(a, pa, pb);
}

/* радианы за миллисекунду — та же единица, что у log.vel */
function phaseOmega(u, travel, dur, a, pa, pb) {
  return (travel * rampSpeed(u, a, pa, pb)) / (rampUnit(a, pa, pb) * dur);
}

/* ШИНА ходит тем же механизмом, что пила: передачи 1 → 3 → 7 → 15, короткий
   тормоз и пауза, потом заново (SAW_GEARS, sawOrbit ниже). Своей кривой у неё
   больше нет — в startLogSpin она заводится beginSawSpin, как и пила. */

/* ПЭПСИ: банка идёт ровно, как привязанная, и всегда ПО ЧАСОВОЙ — ни разгонов,
   ни тормозов, ни остановок: угол растёт ровно (SMOOTH_TURNS.pepsi), и банка не
   смещается ни на пиксель. Так и надо цели под ножом: окно едет с постоянной
   скоростью, и попадание зависит только от игрока, а не от случайной мотни
   босса. Звуков у банки нет вовсе: отметки поворота проходят молча.
   Каждые PEPSI_STEP градусов (160°) банку качает: пока качает, она НЕ едет вперёд
   — ходит на месте на 5° влево и на 5° вправо, туда-сюда (PEPSI_SHAKE_WAVES
   полных качаний), всё время с той же скоростью, что и обычный оборот: меняется
   только сторона, мгновенно. Откачало — и банка продолжает тот же ровный оборот
   с той же скоростью: темп один и тот же, просто во время качания ход не
   накапливается, поэтому качание видно, а не тонет в обороте.
   Качание считается от того же времени, по которому шагает оборот, поэтому всегда
   попадает в один и тот же поворот — на любой частоте кадров и под замедлением.
   Отметки идут по кругу: 160°, 320°, 480° и так далее. */
const PEPSI_STEP = 160 * Math.PI / 180;   /* каждые сто шестьдесят градусов — качание */

/* мс между отметками: сто шестьдесят градусов при обороте SMOOTH_TURNS.pepsi */
function pepsiTickPeriod() {
  return SMOOTH_TURNS.pepsi * PEPSI_STEP / TWO_PI;
}

/* ступень отметки: 1, 2, 3 ... — по числу пройденных шагов поворота. Runtime её
   не озвучивает (звука у банки нет), счётчик держим только для порядка */
function pepsiTickStep(t) {
  return Math.floor(t / pepsiTickPeriod());
}

/* качание банки после отметки. Амплитуда ровно 5°, и идёт оно С ТОЙ ЖЕ СКОРОСТЬЮ,
   что и обычный оборот: 5° в одну сторону, 5° обратно, и так несколько раз —
   скорость одна и та же, меняется только сторона. Никаких телепортов: угол едет
   непрерывно, разворот мгновенный (без разгонов и торможений), потому что банка
   всё время идёт с одной и той же скоростью.
   Откачало — и банка продолжает тот же ровный оборот до следующей отметки */
const PEPSI_SHAKE_AMP = 5 * Math.PI / 180;   /* ровно 5° влево и 5° вправо от ровного угла */
const PEPSI_SHAKE_WAVES = 3;                 /* полных качаний за раз: 0→+5→-5→0 — одно (4 хода по 5°) */

/* сколько живёт качание: столько, сколько нужно пройти PEPSI_SHAKE_WAVES раз по
   (4 * PEPSI_SHAKE_AMP) тем же ходом w. Считаем от w, а не фиксированными мс,
   чтобы скорость качания ВСЕГДА совпадала со скоростью оборота — и под
   замедлением тоже */
function pepsiShakeSpan(w) {
  if (!(w > 0)) return 0;
  return PEPSI_SHAKE_WAVES * 4 * PEPSI_SHAKE_AMP / w;
}

/* отклонение угла в этот момент: «пила» с постоянной скоростью w — от 0 к +5°,
   от +5° к -5°, от -5° к 0. Разворот мгновенный, но движение не прерывается:
   каждая нога проходится ровно с той скоростью, что и обычный оборот, поэтому
   это качание, а не прыжок.
   Фаза берётся от того же времени, по которому шагает оборот (log.spinT),
   поэтому под замедлением качание растягивается вместе с оборотом, а на любой
   частоте кадров попадает в тот же поворот. Вне качания — ровно 0 */
function pepsiShakeOffset(t, w) {
  const per = pepsiTickPeriod();
  if (!(per > 0) || !(w > 0)) return 0;
  const u = t % per;                              /* 0 — только что прошли 120° */
  if (!(u < pepsiShakeSpan(w))) return 0;         /* откачало — ровный ход */
  const period = 4 * PEPSI_SHAKE_AMP;             /* 0 → +5 → -5 → 0 */
  const p = (w * u) % period;                     /* пройдено по «пиле» */
  if (p <= PEPSI_SHAKE_AMP) return p;                       /* вправо: 0 → +5° */
  if (p <= 3 * PEPSI_SHAKE_AMP) return 2 * PEPSI_SHAKE_AMP - p;  /* влево: +5° → -5° */
  return p - period;                                        /* вправо: -5° → 0 */
}

/* сколько времени РОВНОГО хода набежало к моменту t: время качания не считается.
   Пока банку качает, она ходит влево-вправо на месте, а не едет вперёд — иначе
   качание тонуло бы в обороте и банка просто ехала бы дальше с дрожью.
   Кончилось качание — ход продолжается с той же скоростью, темп не меняется */
function pepsiTurnPhase(t, w) {
  const per = pepsiTickPeriod();
  if (!(per > 0)) return t;
  const span = pepsiShakeSpan(w);
  if (!(span > 0)) return t;
  const k = Math.floor(t / per);
  const u = t - k * per;
  return k * (per - span) + Math.max(0, u - span);
}

/* ШЕСТЕРЁНКА: пружина на месте (GEAR_* в bosses.js). Цикл — четыре толчка, и
   каждый начинается из домашней позы. Толчок — по часовой: пружину отпускает,
   шестерёнка уходит на пик и — если это не последний толчок — летит оттуда
   обратно ПО ИНЕРЦИИ, ровно домой, в ту же позу. Три отскока с растущим пиком,
   а четвёртый толчок — целый виток на 420°: тот же удар пружины, но БЕЗ
   возврата, поэтому он и задаёт новую домашнюю позу, от которой цикл продолжается.
   Влево и вправо считаем по кромке ПОД НОЖОМ (низ шестерёнки): на канве
   положительный угол крутит по часовой, поэтому толчок уводит низ влево — а сама
   шестерёнка при этом видно крутится по часовой.
   Все четыре толчка — ОДНА и та же кривая (gearPushAngle): ПОЛУВОЛНА синуса —
   ноль в начале, пик в конце разгона. Это и есть «отталкивание»: из дома
   шестерёнка уходит на полной скорости (пружина отпустила), на пике на миг
   замирает, а домой прилетает уже мягче — и следующий толчок подхватывает её тем
   же ударом. Поэтому пик скорости — дома, а не на пике, и это ровно то, что
   читает нож: удары пружины с замиранием между ними. Пики растут от толчка к
   толчку (GEAR_PUSH: 16° → 46° → 104°), поэтому отскоки видно расходящимися.
   Разгон занимает долю такта GEAR_RISE, вторая доля — возврат, и она длиннее,
   поэтому обратно шестерёнку несёт помедленнее, чем бросает вперёд.
   Четвёртый толчок (gearSpinAngle) отличается ТОЛЬКО тем, что возврата нет:
   полуволна донесла шестерёнку до пика и оставила её там на короткую паузу
   GEAR_SPIN_HOLD — удар тот же, разгон тот же, замирание то же, а виток не
   откатывается. Новая домашняя поза = старая + 420°, поэтому за цикл шестерёнка
   уходит ровно на виток, а рисунок едет вперёд.
   Угол считаем от времени (gearAngleAt), а не приращением: задержка кадра
   картинку не сдвигает, а длинный пропуск проглатывается целиком — шестерёнка
   просто встаёт в ту фазу, которая есть по времени. */

/* профиль пружины: шестерёнка и клубок ходят ОДНИМ механизмом, вся разница —
   в числах. GEAR_PROFILE — родной, шестерёночный; у клубка свой, «лунный»
   (YARN_GEAR ниже): те же толчки, но такты длиннее и пики дальше.
   slots — шаг домашней позы (у шестерёнки зубья, у клубка — его ножи).
   fall — показатель падения на возврате: 2 — нормальная гравитация (разгон
   вниз, как у брошенного тела), без него — прежняя синусоида. */
const GEAR_PROFILE = {
  push: GEAR_PUSH,
  pushMs: GEAR_PUSH_MS,
  rise: GEAR_RISE,
  fall: 2,
  spin: GEAR_SPIN,
  spinMs: GEAR_SPIN_MS,
  hold: GEAR_SPIN_HOLD,
  slots: GEAR_TEETH
};

/* длительность всего цикла: три отскока и четвёртый толчок на виток с короткой
   паузой на пике */
function gearPeriod(prof) {
  const p = prof || GEAR_PROFILE;
  return p.pushMs[0] + p.pushMs[1] + p.pushMs[2] + p.spinMs + p.hold;
}

/* где сейчас цикл: u — фаза внутри цикла, c — номер цикла */
function gearCycleAt(t, prof) {
  const p = prof || GEAR_PROFILE;
  const P = gearPeriod(p);
  const c = Math.floor(t / P);
  return { u: t - c * P, c: c };
}

/* фаза внутри цикла, 0 ... P */
function gearCyclePhase(t, prof) {
  return gearCycleAt(t, prof).u;
}

/* такт цикла: 0, 1, 2 — отскоки, 3 — четвёртый толчок на виток. По смене такта
   stepGearSpin щёлкает: слышно все четыре удара пружины, и каждый следующий
   сильнее предыдущего */
function gearBeat(t, prof) {
  const p = prof || GEAR_PROFILE;
  const st = gearCycleAt(t, p);
  let u = st.u;
  let seg = 0;
  while (seg < 3 && u >= p.pushMs[seg]) {
    u -= p.pushMs[seg];
    seg++;
  }
  return st.c * 4 + seg;
}

/* один толчок: удар пружины — полуволна синуса. Ноль в начале, пик в конце
   разгона (rise — его доля в такте), и скорость там нулевая: шестерёнка на миг
   замирает в верхней точке. Дальше её несёт обратно домой. fall = 2 — возврат
   по нормальной гравитации: из верхней точки падает с ускорением, а не ползёт
   синусом. Для клубка fall не задан — у него прежний «лунный» вязкий выкат. */
function gearPushAngle(u, peak, dur, rise, fall) {
  const s = u / dur;
  if (s < rise) return peak * Math.sin((Math.PI * s) / (2 * rise));
  const f = (s - rise) / (1 - rise);
  if (fall > 0) return peak * (1 - Math.pow(f, fall));
  return peak * Math.sin((Math.PI * (1 - f)) / 2);
}

/* четвёртый толчок: не оборот, а ТОТ ЖЕ удар пружины, что у первых трёх, только
   сильнее — амплитуда GEAR_SPIN. Отличие одно: возврата нет. Полуволна (rise 0.5)
   донесла шестерёнку до пика и оставила её там на короткую паузу GEAR_SPIN_HOLD,
   и этот пик и есть новая домашняя поза, от которой продолжается цикл (её
   добавляет gearAngleAt за прожитый цикл) */
function gearSpinAngle(u, prof) {
  const p = prof || GEAR_PROFILE;
  if (u >= p.spinMs) return p.spin;
  return gearPushAngle(u, p.spin, 2 * p.spinMs, 0.5);
}

/* профиль цикла по фазе: три отскока подряд плюс четвёртый толчок-закрепление */
function gearCycleAngleAt(u, prof) {
  const p = prof || GEAR_PROFILE;
  for (let i = 0; i < 3; i++) {
    if (u < p.pushMs[i]) return gearPushAngle(u, p.push[i], p.pushMs[i], p.rise, p.fall);
    u -= p.pushMs[i];
  }
  return gearSpinAngle(u, p);
}

function gearCycleAngle(t, prof) {
  const p = prof || GEAR_PROFILE;
  return gearCycleAngleAt(gearCyclePhase(t, p), p);
}

/* полный ход в момент t: витки прожитых циклов плюс профиль текущего. Живёт
   отдельной чистой функцией, потому что угол собирается приращениями по кадрам,
   а эта поза нужна чистой — по ней меряется и глубина отскока, и сдвиг за цикл */
function gearAngleAt(t, prof) {
  const p = prof || GEAR_PROFILE;
  const st = gearCycleAt(t, p);
  return st.c * p.spin + gearCycleAngleAt(st.u, p);
}

/* стартовая поза: зуб ровно под ножом. Кромка шестерёнки стоит на зубе, а не на
   случайном скосе, поэтому первый нож всегда садится на площадку зуба. От этой
   позы шестерёнку и толкает пружина, а после оборота она садится в НОВУЮ домашнюю
   позу — поза под ножом всё время новая, но начало у всех боёв одно и то же */
function gearHomeAngle(ang, prof) {
  const p = prof || GEAR_PROFILE;
  const slot = TWO_PI / (p.slots || GEAR_TEETH);
  const home = Math.PI / 2 - slot / 2;
  return home + Math.round((ang - home) / slot) * slot;
}

function beginGearSpin(prof) {
  const log = game.log;
  log.pattern = "gear";
  log.mode = "spring";
  log.gearProf = prof || null;
  log.spinT = 0;
  log.burst = 0;
  log.pauseT = 0;
  log.beat = 0;
  log.gearPhase = 0;
  /* старт — на зубе: первый нож садится на площадку, а от этой позы шестерёнку и
     толкает по часовой весь бой */
  log.angle = gearHomeAngle(log.angle, prof);
  log.dir = 1;
  log.vel = 0;
  log.speed = 0;
  /* пружину отпускают на глазах: слышно первый толчок — кроме клубка и шестерёнки,
     им звук отскоков убран */
  const quietGear = !!(log.boss && (log.boss.id === "yarn" || log.boss.id === "cog"));
  if (!quietGear) {
    deferSfx(() => {
      Sfx.noise(0.3, 0.03, 520);
      Sfx.tone(150, 0.3, "sawtooth", 0.014, 230);
    });
  }
}

function stepGearSpin(tms) {
  const log = game.log;
  if (!(tms > 0)) return;
  const prof = log.gearProf || GEAR_PROFILE;
  const slow = smoothSlow();
  const dt = tms / slow;
  const t0 = log.spinT || 0;
  const t1 = t0 + dt;
  const d = gearAngleAt(t1, prof) - gearAngleAt(t0, prof);
  log.angle += d;
  log.spinT = t1;
  /* скорость — честная производная кривой между кадрами: дома она велика (толчок
     пружины), на пике нулевая (замирание), а после пика четвёртого толчка тоже
     нулевая — он оставляет шестерёнку на витке, а не несёт её назад. Нож видит
     ровно то, что происходит сейчас */
  const om = d / dt;
  if (om) log.dir = om < 0 ? -1 : 1;
  log.vel = om;
  log.speed = om;
  /* такт: по его смене щёлкает очередной толчок пружины. Все четыре звучат одним
     ударом, только от толчка к толчку он сильнее — четвёртый самый мощный, потому
     что это и есть самый сильный удар пружины */
  const beat = gearBeat(t1, prof);
  log.beat = beat;
  const seg = beat % 4;
  if (seg !== log.gearPhase) {
    log.gearPhase = seg;
    /* клубку и шестерёнке звук отскоков не ставим: пружина ходит молча */
    const quietGear = !!(log.boss && (log.boss.id === "yarn" || log.boss.id === "cog"));
    if (!quietGear) {
      deferSfx(() => {
        Sfx.tone(420 + seg * 70, 0.08 + seg * 0.03, "triangle", 0.05 + seg * 0.015, 150);
        Sfx.tone(90, 0.24 + seg * 0.08, "sine", 0.04 + seg * 0.015, 46);
      });
    }
  }
}

/* ПИРОГ: полный оборот на 360° за раз, короткая пауза, следующий оборот.
   Простой паттерн без шагов и качелей: всегда в одну сторону. */
const PIE_TURN_MS = 2100;        /* мс на полный оборот */
const PIE_HOLD_MS = 450;         /* мс стоит между оборотами */

function piePitch(id) {
  return knifeGridPitch(id) || TWO_PI / 8;
}

function pieAngle(t, id) {
  const leg = PIE_TURN_MS + PIE_HOLD_MS;
  const i = Math.floor(t / leg);
  const u = (t - i * leg) / PIE_TURN_MS;
  if (u <= 0) return i * TWO_PI;
  if (u >= 1) return (i + 1) * TWO_PI;
  return (i + 0.5 - 0.5 * Math.cos(Math.PI * u)) * TWO_PI;
}

function pieOmega(t, id) {
  const leg = PIE_TURN_MS + PIE_HOLD_MS;
  const i = Math.floor(t / leg);
  const u = (t - i * leg) / PIE_TURN_MS;
  if (u <= 0 || u >= 1) return 0;
  return TWO_PI * (Math.PI / (2 * PIE_TURN_MS)) * Math.sin(Math.PI * u);
}

/* РОВНОЕ КАЧАНИЕ: неповоротливый ход с характером. Основа — «колокол»
   pos(u) = u - sin(2πu)/2π: тело еле трогается, к 180° накатывает, после 180°
   вязко тормозит и встаёт ровно на 360°; дальше всё то же в обратную сторону.
   Поверх — мелкие «хуйни» (ROCK_WIGGLES): короткие примеси, из-за которых ход
   идёт не как чистый маятник, а слегка рыскает — где-то чуть подхватывает, где-то
   чуть тормозит. Примеси затухают на обоих концах хода (множитель u(1-u)), поэтому
   0°, 180° и 360° остаются точными: пик по-прежнему строго на середине.
   Длительность одной половины (0°→360°) — SMOOTH_TURNS.marmalade: этим ходом
   качается банка жевачки. Раньше так ходил теннисный мяч, отсюда и прежнее имя
   функций; мяч же заводится шагами (TENNIS_SCRIPT ниже). */
const ROCK_SWING = TWO_PI;   /* размах в одну сторону — полный оборот, 360° */
/* [амплитуда, число волн на полуход]: маленькие, чтобы ход остался плавным */
const ROCK_WIGGLES = [
  [0.050, 2],
  [0.030, 3],
  [0.020, 5]
];

function rockPos(u) {
  let p = u - Math.sin(TWO_PI * u) / TWO_PI;
  for (let k = 0; k < ROCK_WIGGLES.length; k++) {
    const a = ROCK_WIGGLES[k][0], f = ROCK_WIGGLES[k][1];
    p += a * u * (1 - u) * Math.sin(TWO_PI * f * u);
  }
  return p;
}

function rockSlope(u) {
  let s = 1 - Math.cos(TWO_PI * u);
  for (let k = 0; k < ROCK_WIGGLES.length; k++) {
    const a = ROCK_WIGGLES[k][0], f = ROCK_WIGGLES[k][1];
    s += a * ((1 - 2 * u) * Math.sin(TWO_PI * f * u) +
      u * (1 - u) * TWO_PI * f * Math.cos(TWO_PI * f * u));
  }
  return s;
}

function rockAngle(t, w) {
  const H = TWO_PI / w;        /* мс на одну половину хода (0°→360°) */
  const i = Math.floor(t / H);
  const u = t / H - i;
  const pos = rockPos(u);
  return (i & 1) ? ROCK_SWING * (1 - pos) : ROCK_SWING * pos;
}

function rockOmega(t, w) {
  const H = TWO_PI / w;
  const i = Math.floor(t / H);
  const u = t / H - i;
  const v = ROCK_SWING * rockSlope(u) / H;
  return (i & 1) ? -v : v;
}

function smoothAngleAt(id, t, w) {
  if (id === "pie") return pieAngle(t, id);
  /* пэпси: ровный оборот плюс качание на месте после каждой отметки в 160° —
     и то и другое живёт в самом угле, поэтому банку видно, как она качается */
  if (id === "pepsi") return w * pepsiTurnPhase(t, w) + pepsiShakeOffset(t, w);
  const st = SMOOTH_STYLE[id] || {};
  if (st.top) return coinAngle(t, w);
  if (st.sway) return smoothSwayAngle(id, t);
  if (st.rock) return rockAngle(t, w);
  return smoothWaveAngle(id, t, w);
}

function smoothOmegaAt(id, t, w) {
  if (id === "pie") return pieOmega(t, id);
  const st = SMOOTH_STYLE[id] || {};
  if (st.top) return coinOmega(t, w);
  if (st.sway) return smoothSwayOmega(id, t);
  if (st.rock) return rockOmega(t, w);
  return smoothWaveOmega(id, t, w);
}

function beginSmoothSpin(id) {
  const log = game.log;
  const w = smoothBaseOmega(id);
  const om = smoothOmegaAt(id, 0, w);
  log.pattern = "smooth";
  log.spinId = id;
  log.mode = "cruise";
  log.spinT = 0;
  log.burst = 0;
  log.pauseT = 0;
  log.pepsiStep = 0;
  /* шарик сразу встаёт в свою фазу качания, остальные боссы с ножами начинают
     с ровной сетки: окно под ножом */
  log.angle = id === "balloon" ? balloonRockAngle(log.balloonT || 0) : knifeGridSnap(id, log.angle);
  log.dir = om < 0 ? -1 : 1;
  /* РЕВЕРС стартует всегда по часовой: дальше знак живёт в log.dir и
     переворачивается от удара ножом, а не берётся из производной */
  if (id === "reverse") log.dir = 1;
  log.vel = om / smoothSlow();
  log.speed = log.vel;
}

function stepSmoothSpin(tms) {
  const log = game.log;
  if (!(tms > 0)) return;
  const id = log.spinId;
  const slow = smoothSlow();
  const w = smoothBaseOmega(id);
  /* шарик качается на нитке: у него свой счётчик качания, который переживает и
     заход, и смену латекса, поэтому второй шарик качается дальше с того же места.
     Крен пишем в log.angle — от него зависит, куда смотрит фитиль */
  if (id === "balloon") {
    const tb = (log.balloonT = (log.balloonT || 0) + tms / slow);
    const om = balloonRockOmega(tb) / slow;
    log.spinT = tb;
    log.angle = balloonRockAngle(tb);
    if (om) log.dir = om < 0 ? -1 : 1;
    log.vel = om;
    log.speed = om;
    return;
  }
  const t0 = log.spinT || 0;
  const t1 = t0 + tms / slow;
  /* РЕВЕРС: ровный ход задан приращением со знаком из log.dir — поэтому удар
     ножом разворачивает диск мгновенно, без разгонов и без остановок, а
     скорость остаётся прежней (меняется только знак) */
  if (id === "reverse") {
    const wd = (log.dir || 1) * w;
    log.angle += wd * tms / slow;
    log.spinT = t1;
    log.vel = wd / slow;
    log.speed = log.vel;
    return;
  }
  log.angle += smoothAngleAt(id, t1, w) - smoothAngleAt(id, t0, w);
  log.spinT = t1;
  const om = smoothOmegaAt(id, t1, w) / slow;
  /* пэпси: скорость та же ровная, отметки в 160° проходят молча — звука у банки
     нет вовсе, только счётчик ступени для порядка (pepsiStep) */
  if (id === "pepsi") log.pepsiStep = pepsiTickStep(t1);
  if (om) log.dir = om < 0 ? -1 : 1;
  log.vel = om;
  log.speed = om;
}

/* живое движение поверх кручения: качание, покачивание, дрожь резины и встряска
   банки по щелчку отсчёта. Всё это — ТОЛЬКО картинка: сдвиг и крен в кадре.
   Угол босса (log.angle) такая мотня не трогает, поэтому от неё не зависит ни
   попадание ножа, ни ход. Блик (drawShineGlint) живёт в мировых координатах, и на
   мотне картинка чуть отходит от него — поэтому амплитуда у всех взята мелкой:
   мотня читается живым телом, а не дрожью отрисовки. Исключение — крен шарика:
   он идёт в log.angle (от него зависит, куда смотрит фитиль), см. stepSmoothSpin */
function smoothAlive(id, r) {
  const t = game.time || 0;
  if (!(r > 0)) r = 120;
  if (id === "tire") return { ox: Math.sin(t * 0.0057) * r * 0.005, oy: Math.cos(t * 0.0071) * r * 0.005, tilt: Math.sin(t * 0.0047) * 0.006 };
  if (id === "coin") return { ox: Math.cos(t * 0.0092) * r * 0.014, oy: Math.sin(t * 0.0115) * r * 0.012, tilt: Math.sin(t * 0.0083) * 0.02 };
  /* шарик висит на нитке: его качает лёгким синусом, и он не кренится — латекс
     надут, а не надет на жёсткий стержень. Сам крен шарика живёт в log.angle
     (balloonRockAngle): от него зависит, куда смотрит фитиль, поэтому он не может
     быть только картинкой */
  if (id === "balloon") return { ox: Math.sin(t * 0.0013) * r * 0.024, oy: Math.sin(t * 0.0021 + 0.9) * r * 0.03, tilt: 0 };
  if (id === "pie") return { ox: Math.sin(t * 0.0017) * r * 0.007, oy: Math.cos(t * 0.0023) * r * 0.007, tilt: Math.sin(t * 0.0019) * 0.016 };
  /* пэпси трясёт сам угол (pepsiShakeOffset в smoothAngleAt), а не картинку:
     сдвигать и кренить спрайт поверх этого не надо */
  if (id === "pepsi") return null;
  return null;
}

/* ---------- плавный заход ----------
   Заход идёт по синусу (0.5 - 0.5cos): бревно толкается с места — ускорение
   максимально на старте, — проходит середину на пике скорости и дальше едет по
   инерции, мягко докатываясь до полной остановки. Ровной полки в середине нет:
   скорость меняется всю дорогу, поэтому ход читается как толчок и свободный
   выкат, а не как «разогнался, ехал с одной скоростью, встал». Пик скорости —
   1.57 средней. Годится не только бревну: этим же профилем идут заходы пирога,
   шара и перевороты яйца.

   Долю захода, которая уходит на разгон (и столько же на выкат), можно задать
   у каждого хода отдельно — move.ramp. 0.5 — чистый синус, меньше — в середине
   остаётся ровная полка (так идут ходы шины и прочие «ровные» вращения). */
const GLIDE_RAMP = 0.5;              /* доля захода на разгон и столько же на выкат */
const GLIDE_SINE_AVG = 2 / Math.PI;  /* средний множитель чистой синусоиды */

/* доля захода на разгон: default — чистая синусоида (0.5). Больше не берём:
   иначе в середине остаётся полка и ход перестаёт быть «толчок и выкат» */
function glideRampOf(ramp) {
  if (!(ramp > 0)) return GLIDE_RAMP;
  return ramp < 0.5 ? ramp : 0.5;
}

/* столько пути проходится заходом при единичной скорости: у синуса ровной
   середины нет, его средний множитель — 2/π (площадь под sin на полупериоде) */
function glideTotal(ramp) {
  const r = glideRampOf(ramp);
  if (r >= 0.5) return GLIDE_SINE_AVG;
  return 1 - r;
}

/* площадь под полукосинусом от начала разгона до u — путь, пройденный за разгон */
function glideRampInt(u, ramp) {
  const r = glideRampOf(ramp);
  const x = clamp(u / r, 0, 1);
  return r * (x * 0.5 - Math.sin(Math.PI * x) / (2 * Math.PI));
}

/* множитель скорости захода: 0 на концах, 1 на ровной середине. У чистого
   синуса (ramp = 0.5) он равен sin(πu): ускорение максимально на старте —
   бревно толкается с места, — а на выкате скорость сама уходит в ноль */
function glideMul(u, ramp) {
  const r = glideRampOf(ramp);
  if (u <= 0 || u >= 1) return 0;
  if (r >= 0.5) return Math.sin(Math.PI * u);
  if (u < r) return 0.5 - 0.5 * Math.cos((Math.PI * u) / r);
  if (u > 1 - r) return 0.5 - 0.5 * Math.cos((Math.PI * (1 - u)) / r);
  return 1;
}

/* пройденная доля захода: 0 в начале, 1 в конце (первообразная множителя).
   Синус идёт по 0.5 - 0.5cos(πu) — как и было до «ровного хода» */
function glideInt(u, ramp) {
  const r = glideRampOf(ramp);
  if (u <= 0) return 0;
  if (u >= 1) return 1;
  if (r >= 0.5) return 0.5 - 0.5 * Math.cos(Math.PI * u);
  const total = 1 - r;
  if (u < r) return glideRampInt(u, r) / total;
  if (u > 1 - r) return 1 - glideRampInt(1 - u, r) / total;
  return (u - r * 0.5) / total;
}

function sawAccel() {
  return game.buffs.slow ? SAW_ACCEL / 1.7 : SAW_ACCEL;
}

function sawRise() {
  return SAW_GEARS.length * SAW_STEP;
}

function sawFallStep() {
  return SAW_STEP * SAW_BRAKE;
}

function sawFall() {
  return SAW_GEARS.length * sawFallStep();
}

/* скорость в начале передачи i. i = числу передач — скорость на пике */
function sawGearSpeed(i, accel) {
  const n = SAW_GEARS.length;
  const upto = i < n ? i : n;
  let v = 0;
  for (let g = 0; g < upto; g++) v += SAW_GEARS[g] * accel * SAW_STEP;
  return v;
}

/* Переключение передачи без рывка: скорость на передаче едет не по прямой
   (у прямой на стыках мгновенно меняется разгон — это и читалось как рывок),
   а по smoothstep x²(3−2x). У него разгон на обоих концах ровно ноль, поэтому
   соседние передачи стыкуются мягко. Площадь под smoothstep ровно 0.5, как у
   прямой, поэтому средняя скорость на передаче, её длительность, пик и весь
   пройденный за круг путь остаются прежними — меняется только форма разгона. */
function sawShift(x) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  return x * x * (3 - 2 * x);
}

/* площадь под sawShift от 0 до x — пройденный путь внутри передачи */
function sawShiftInt(x) {
  if (x <= 0) return 0;
  if (x >= 1) return 0.5;
  return x * x * x - 0.5 * x * x * x * x;
}

/* путь по передаче: от скорости v0 к v1 за dur. У smoothstep площадь та же,
   что у прямой, поэтому полная передача даёт ровно (v0 + v1) · dur / 2 */
function sawGearDist(v0, v1, dur) {
  return (v0 + v1) * dur * 0.5;
}

function sawOmega(u, accel) {
  const rise = sawRise();
  const fall = sawFall();
  if (!(u > 0) || u >= rise + fall) return 0;
  const n = SAW_GEARS.length;
  const step = SAW_STEP;
  if (u < rise) {
    const i = Math.min(n - 1, Math.floor(u / step));
    const x = (u - i * step) / step;
    const v0 = sawGearSpeed(i, accel);
    const v1 = sawGearSpeed(i + 1, accel);
    return v0 + (v1 - v0) * sawShift(x);
  }
  const fstep = sawFallStep();
  const fu = u - rise;
  const j = Math.min(n - 1, Math.floor(fu / fstep));
  const x = (fu - j * fstep) / fstep;
  const v0 = sawGearSpeed(n - j, accel);
  const v1 = sawGearSpeed(n - j - 1, accel);
  return v0 + (v1 - v0) * sawShift(x);
}

function sawPartial(u, accel) {
  const rise = sawRise();
  const fall = sawFall();
  const n = SAW_GEARS.length;
  const step = SAW_STEP;
  const fstep = sawFallStep();
  if (!(u > 0)) return 0;
  if (u > rise + fall) u = rise + fall;
  let ang = 0;
  const riseDone = u < rise ? Math.min(n, Math.floor(u / step)) : n;
  for (let g = 0; g < riseDone; g++) {
    ang += sawGearDist(sawGearSpeed(g, accel), sawGearSpeed(g + 1, accel), step);
  }
  if (u < rise) {
    const s = u - riseDone * step;
    const v0 = sawGearSpeed(riseDone, accel);
    const v1 = sawGearSpeed(riseDone + 1, accel);
    ang += v0 * s + (v1 - v0) * step * sawShiftInt(s / step);
    return ang;
  }
  const fu = u - rise;
  const fallDone = fu >= fall ? n : Math.min(n, Math.floor(fu / fstep));
  for (let g = 0; g < fallDone; g++) {
    ang += sawGearDist(sawGearSpeed(n - g, accel), sawGearSpeed(n - g - 1, accel), fstep);
  }
  if (fu < fall) {
    const s = fu - fallDone * fstep;
    const v0 = sawGearSpeed(n - fallDone, accel);
    const v1 = sawGearSpeed(n - fallDone - 1, accel);
    ang += v0 * s + (v1 - v0) * fstep * sawShiftInt(s / fstep);
  }
  return ang;
}

function sawOrbit(t, accel) {
  if (!(t > 0)) return 0;
  const motion = sawRise() + sawFall();
  const period = motion + SAW_HOLD;
  const n = Math.floor(t / period);
  const u = t - n * period;
  const spun = n * sawPartial(motion, accel) + sawPartial(u, accel);
  /* Сдвиг дома после круга: нарастает вместе с ходом и к остановке уже
     добран целиком — стартовая точка уезжает заметно правее, а не прыгает.
     Сам сдвиг идёт тем же smoothstep, что и передачи: на концах хода его
     скорость нулевая, поэтому и здесь нет мгновенного толчка на стыке
     «стоп — новый круг». Сумма за круг та же — SAW_SHIFT_DEG. */
  const shift = (SAW_SHIFT_DEG || 0) * Math.PI / 180;
  const drift = (n + (u >= motion ? 1 : sawShift(u / motion))) * shift;
  return spun + drift;
}

function beginSawSpin() {
  const log = game.log;
  log.pattern = "saw";
  log.mode = "saw";
  log.dir = 1;
  log.spinT = 0;
  log.vel = 0;
  log.speed = 0;
  log.burst = 0;
  log.pauseT = 0;
}

function stepSawSpin(dt) {
  const log = game.log;
  if (!(dt > 0)) return;
  const accel = sawAccel();
  const t0 = log.spinT;
  const t1 = t0 + dt;
  log.angle += sawOrbit(t1, accel) - sawOrbit(t0, accel);
  log.spinT = t1;
  const period = sawRise() + sawFall() + SAW_HOLD;
  const u = t1 - Math.floor(t1 / period) * period;
  log.dir = 1;
  log.vel = sawOmega(u, accel) * 0.001;
  log.speed = log.vel;
}

function valveTurnMs() {
  /* Конфета идёт тем же заводом (beginValveSpin), но оборот у неё дольше в
     CANDY_TURN_SLOW раз: раньше она крутилась на скорости вентиля */
  const id = game.log.boss && game.log.boss.id;
  if (id === "candy") return VALVE_TURN * CANDY_TURN_SLOW;
  /* фен: тот же завод, но корпус крутится чуть медленнее вентиля */
  if (id === "fan") return VALVE_TURN * FAN_TURN_SLOW;
  return VALVE_TURN;
}

function valveOmega() {
  const w = TWO_PI / valveTurnMs();
  return game.buffs.slow ? w / 1.7 : w;
}

function valveEaseMul(u) {
  const s = u * u * (3 - 2 * u);
  return VALVE_EASE + (1 - VALVE_EASE) * s;
}

function valveEaseInt(u) {
  const uu = u * u;
  return VALVE_EASE * u + (1 - VALVE_EASE) * (uu * u - 0.5 * uu * uu);
}

function beginValveSpin() {
  const log = game.log;
  log.pattern = "valve";
  log.mode = "ramp";
  log.dir = 1;
  log.phaseT = 0;
  log.burst = 0;
  log.pauseT = 0;
  const w = valveOmega() * VALVE_EASE;
  log.vel = w;
  log.speed = w;
}

function stepValveSpin(tms) {
  const log = game.log;
  if (!(tms > 0)) return;
  const slow = game.buffs.slow ? 1.7 : 1;
  const w = valveOmega();
  const dir = log.dir || 1;
  if (log.mode !== "ramp") {
    log.mode = "cruise";
    log.angle += dir * w * tms;
    log.vel = dir * w;
    log.speed = log.vel;
    return;
  }
  const ramp = VALVE_RAMP * slow;
  const t0 = log.phaseT || 0;
  if (t0 >= ramp) {
    log.mode = "cruise";
    log.angle += dir * w * tms;
    log.vel = dir * w;
    log.speed = log.vel;
    return;
  }
  const t1 = t0 + tms;
  if (t1 >= ramp) {
    const u0 = clamp(t0 / ramp, 0, 1);
    log.angle += dir * w * (ramp * (valveEaseInt(1) - valveEaseInt(u0)) + (t1 - ramp));
    log.phaseT = 0;
    log.mode = "cruise";
    log.vel = dir * w;
  } else {
    const u0 = t0 / ramp;
    const u1 = t1 / ramp;
    log.angle += dir * w * ramp * (valveEaseInt(u1) - valveEaseInt(u0));
    log.phaseT = t1;
    log.vel = dir * w * valveEaseMul(u1);
  }
  log.speed = log.vel;
}

/* ШТУРВАЛ: идёт ходами, а не ровным оборотом — короткий ход и пауза, следующий
   ход в обратную сторону, потом два длинных хода на два оборота. Так и видно, что
   штурвал «выруливает»: ушёл влево, встал, пошёл вправо. Пицце этот ход не
   достаётся: она тоже ходит с паузой, но своим шагом — в одну сторону и на ломоть
   (PIZZA_STEP ниже) */
const HELM_SCRIPT = [
  { dur: 740, turns: 0.8, pause: 40, dir: -1 },
  { dur: 680, turns: 0.7, pause: 36, dir: 1 },
  { dur: 1500, turns: 2, pause: 130, dir: -1 },
  { dur: 740, turns: 0.8, pause: 40, dir: 1 },
  { dur: 680, turns: 0.7, pause: 36, dir: -1 },
  { dur: 1500, turns: 2, pause: 130, dir: 1 }
];

function nextHelmMove() {
  scriptMove(HELM_SCRIPT);
}

/* Теннисный мяч: заводится не ровным вращением, а шагами — каждый шаг крупнее
   предыдущего, — а на четвёртом срывается: контр-раскрут на 500° назад. Дальше
   цикл повторяется, и по шагам слышно, что вот-вот сорвётся. Раньше так
   заводилась банка жевачки; теперь узоры у них поменялись местами — мяч ходит
   шагами, а банка качается этим же ходом мяча (SMOOTH_STYLE.marmalade).
   Натяг (ramp) у мяча взят чистым синусом (0.5): у банки натяг был короче, и шаг
   читался резче («раскрутилась и держит»), а мячу заказан ход мягче — трогается и
   встаёт плавно, без рывка на старте шага. */
const TENNIS_SCRIPT = [
  { dur: 620, deg: 180, pause: 90, dir: 1, ramp: 0.5 },
  { dur: 720, deg: 290, pause: 100, dir: 1, ramp: 0.5 },
  { dur: 840, deg: 415, pause: 150, dir: 1, ramp: 0.5 },
  { dur: 1650, deg: 500, pause: 440, dir: -1, ramp: 0.5 }
];

function nextTennisMove() {
  const log = game.log;
  const m = TENNIS_SCRIPT[(log.beat | 0) % TENNIS_SCRIPT.length];
  /* Разворот мяча слышно только встряской: треска при вращении больше нет —
     скрип (Sfx.creak) читался как треск и забивал шаги, по которым мяч
     заводится */
  if (state === "play" && (log.beat | 0) > 0 && (m.dir | 0) !== (log.dir | 0)) {
    log.pulse = Math.min(0.05, (log.pulse || 0) + 0.022);
  }
  applySpinMove({ dur: m.dur, turns: m.deg / 360, pause: m.pause, dir: m.dir, ramp: m.ramp });
}

function beginTennisSpin() {
  const log = game.log;
  log.pattern = "tennis";
  log.beat = 0;
  log.dir = 1;
  nextTennisMove();
}

/* ШТУРВАЛ: свой ход — из HELM_SCRIPT. Пицца ходит своим шагом (PIZZA_STEP):
   единственное, что у них общее — пауза после хода */
function beginHelmSpin() {
  const log = game.log;
  log.pattern = "helm";
  log.beat = 0;
  log.dir = 1;
  log.script = HELM_SCRIPT;
  log.burst = 0;
  log.pauseT = 0;
  log.vel = 0;
  log.speed = 0;
  nextHelmMove();
}

/* ---------- ДИСКО ШАР: ходы штурвала, счёт свой ----------
   Идёт ходами, как штурвал, но по своему счёту: три коротких тычка по 30°
   (влево, вправо, влево) и длинный уход вправо на 210°, дальше по кругу.
   Профиль хода — чистый синус (ramp 0.5): трогается и встаёт плавно, а сами
   ходы ужаты по времени, поэтому стык читается резко: шар щёлкнул с места,
   качнулся и замер, а потом уехал почти на две трети оборота.
   turns — всегда положительный, сторону задаёт dir (applySpinMove умножает
   delta = dir · turns · 2π): иначе минус в turns и минус в dir гасили друг друга */
const DISCO_WINK = 30;
const DISCO_SWING = 210;
const DISCO_STEP = [
  { dur: 330, turns: DISCO_WINK / 360, pause: 60, dir: -1, ramp: 0.5 },
  { dur: 330, turns: DISCO_WINK / 360, pause: 55, dir: 1, ramp: 0.5 },
  { dur: 330, turns: DISCO_WINK / 360, pause: 70, dir: -1, ramp: 0.5 },
  { dur: 880, turns: DISCO_SWING / 360, pause: 150, dir: 1, ramp: 0.5 }
];

function nextDiscoMove() {
  scriptMove(DISCO_STEP);
}

function beginDiscoSpin() {
  const log = game.log;
  log.pattern = "disco";
  log.beat = 0;
  log.dir = 1;
  log.script = DISCO_STEP;
  log.burst = 0;
  log.pauseT = 0;
  log.vel = 0;
  log.speed = 0;
  nextDiscoMove();
}

/* ---------- ПИЦЦА: шаги теннисного мяча, только медленнее ----------
   Те же четыре нарастающих шага, что у TENNIS_SCRIPT (180°, 290°, 415° и
   ещё крупнее), и каждый примерно втрое дольше. Четвёртого срыва назад нет:
   мяч на нём контр-раскручивается, пицца продолжает в ту же сторону. Ход —
   чистый синус (ramp 0.5): с места и в остановку без рывка.
   Темп замедлен в полтора раза: длительности и паузы умножены на 1.5,
   углы не тронуты — пицца идёт теми же шагами, просто неспешно. */
const PIZZA_STEP = [
  { dur: 1860, turns: 180 / 360, pause: 270, dir: 1, ramp: 0.5 },
  { dur: 2160, turns: 290 / 360, pause: 300, dir: 1, ramp: 0.5 },
  { dur: 2520, turns: 415 / 360, pause: 360, dir: 1, ramp: 0.5 },
  { dur: 3600, turns: 540 / 360, pause: 420, dir: 1, ramp: 0.5 }
];

function nextPizzaMove() {
  scriptMove(PIZZA_STEP);
}

/* КАМЕРА: как яйцо, только короче.
   Старт — пауза в покое (CAMERA_START_HOLD), потом три пары влево-вправо
   по ±CAMERA_ROCK_DEG, довод в покой, поворот влево на CAMERA_TURN_DEG.
   Такой блок — CAMERA_BLOCKS раз, потом снова качки. Финального оборота нет.
   Без стартовой паузы первый кадр мог сразу уйти в поворот на 75° — рывок. */
function cameraNum(v, def) {
  return typeof v === "number" && isFinite(v) ? v : def;
}

function cameraRockPeaks(home) {
  const h = cameraNum(home, 0);
  const pairs = Math.max(1, cameraNum(CAMERA_PAIRS, 3) | 0);
  const rock = cameraNum(CAMERA_ROCK_DEG, 30) * Math.PI / 180;
  const peaks = [];
  for (let i = 0; i < pairs; i++) {
    peaks.push(h + rock);
    peaks.push(h - rock);
  }
  peaks.push(h);
  return peaks;
}

function cameraSlow() {
  return game.buffs.slow ? 1.7 : 1;
}

function cameraPaceRad() {
  return cameraNum(CAMERA_PACE, 130) * Math.PI / 180;
}

function beginCameraSpin() {
  const log = game.log;
  const home = 0;
  log.pattern = "camera";
  /* сначала стоим — камера появляется в покое, без рывка в поворот */
  log.camAct = "hold";
  log.camHome = home;
  log.camBlock = 0;
  log.camI = 0;
  log.camT = 0;
  log.camFrom = home;
  log.camTo = home;
  log.camPeaks = cameraRockPeaks(home);
  log.burst = 0;
  log.pauseT = 0;
  log.mode = "swing";
  log.dir = 1;
  log.angle = home;
  log.vel = 0;
  log.speed = 0;
}

function cameraActDur(log) {
  if (log.camAct === "hold") return cameraNum(CAMERA_START_HOLD, 0.55);
  const pace = cameraPaceRad();
  if (log.camAct === "turn") {
    return cameraNum(CAMERA_TURN_DEG, 75) * Math.PI / 180 / pace;
  }
  const from = cameraNum(log.camFrom, 0);
  const peaks = log.camPeaks;
  const to = peaks && peaks.length ? cameraNum(peaks[log.camI | 0], from) : from;
  return Math.abs(to - from) / pace;
}

function cameraAdvance(log) {
  if (log.camAct === "hold") {
    log.camAct = "rock";
    log.camFrom = cameraNum(log.camHome, 0);
    log.camI = 0;
    log.camT = 0;
    log.angle = log.camFrom;
    if (!log.camPeaks || log.camPeaks.length < 2) {
      log.camPeaks = cameraRockPeaks(log.camFrom);
    }
    return;
  }
  if (log.camAct === "turn") {
    log.camHome = cameraNum(log.camTo, log.camHome);
    log.angle = log.camHome;
    log.camBlock = (log.camBlock | 0) + 1;
    log.camT = 0;
    if (log.camBlock >= cameraNum(CAMERA_BLOCKS, 3)) log.camBlock = 0;
    log.camAct = "rock";
    log.camI = 0;
    log.camFrom = log.camHome;
    log.camPeaks = cameraRockPeaks(log.camHome);
    return;
  }
  const peaks = log.camPeaks || [];
  const i = log.camI | 0;
  log.camFrom = cameraNum(peaks[i], log.camHome);
  log.angle = log.camFrom;
  log.camI = i + 1;
  log.camT = 0;
  if (log.camI >= peaks.length) {
    /* довод в покой уже был последним пиком — только теперь поворот */
    log.camAct = "turn";
    log.camFrom = cameraNum(log.camHome, 0);
    log.camTo = log.camFrom - cameraNum(CAMERA_TURN_DEG, 75) * Math.PI / 180;
    log.angle = log.camFrom;
  }
}

function cameraApply(log) {
  if (log.camAct === "hold") {
    log.angle = cameraNum(log.camHome, 0);
    log.camFrom = log.angle;
    log.vel = 0;
    log.speed = 0;
    log.dir = 1;
    log.mode = "swing";
    return;
  }
  const dur = Math.max(1e-4, cameraActDur(log));
  const u = clamp((log.camT || 0) / dur, 0, 1);
  const from = cameraNum(log.camFrom, 0);
  let to = from;
  if (log.camAct === "turn") to = cameraNum(log.camTo, from);
  else if (log.camPeaks && log.camPeaks.length) {
    to = cameraNum(log.camPeaks[log.camI | 0], from);
  }
  const ramp = cameraNum(CAMERA_RAMP, 0.5);
  log.angle = from + (to - from) * glideInt(u, ramp);
  log.vel = ((to - from) * glideMul(u, ramp) * 0.001) / (glideTotal(ramp) * dur);
  log.speed = log.vel;
  log.dir = log.vel < 0 ? -1 : (log.vel > 0 ? 1 : log.dir);
  log.mode = "swing";
}

function stepCameraSpin(tms) {
  const log = game.log;
  if (!(tms > 0)) return;
  if (log.camAct !== "hold" && log.camAct !== "rock" && log.camAct !== "turn") {
    beginCameraSpin();
  }
  if (!log.camPeaks || log.camPeaks.length < 2) {
    log.camPeaks = cameraRockPeaks(cameraNum(log.camHome, 0));
  }
  let left = tms * 0.001 / cameraSlow();
  for (let n = 0; n < 16 && left > 1e-6; n++) {
    const dur = cameraActDur(log);
    if (!(dur > 1e-6)) {
      /* нулевой шаг — пересобираем качки и пробуем снова, без прыжка в поворот */
      if (log.camAct === "rock") {
        log.camPeaks = cameraRockPeaks(cameraNum(log.camHome, 0));
        log.camFrom = cameraNum(log.camHome, 0);
        log.camI = 0;
        log.camT = 0;
        continue;
      }
      cameraAdvance(log);
      continue;
    }
    const room = dur - (log.camT || 0);
    if (left < room) {
      log.camT = (log.camT || 0) + left;
      left = 0;
      break;
    }
    left -= room;
    cameraAdvance(log);
  }
  cameraApply(log);
}

/* пицца заводится шагами мяча без контр-раскрута. Натяг бревна ей не нужен:
   woodHold работает только у бревна */
function beginPizzaSpin() {
  const log = game.log;
  log.pattern = "pizza";
  log.beat = 0;
  log.dir = 1;
  log.script = PIZZA_STEP;
  log.burst = 0;
  log.pauseT = 0;
  log.vel = 0;
  log.speed = 0;
  nextPizzaMove();
}

/* ПОНЧИК: ход ровный и неспешный — оборот за DONUT_TURN (2.6 секунды), ни
   разгонов, ни пауз, ни остановок: попадать приходится с ходу, а самый ход
   читается по трём ножам кучкой (см. DONUT_KNIVES). Замедление растягивает
   оборот в 1.7 раза, как у остальных ровных боссов. */
function donutOmega() {
  const w = TWO_PI / DONUT_TURN;
  return game.buffs.slow ? w / 1.7 : w;
}

function beginDonutSpin() {
  const log = game.log;
  log.pattern = "donut";
  log.mode = "spin";
  log.dir = 1;
  log.phaseT = 0;
  log.burst = 0;
  log.pauseT = 0;
  const w = donutOmega();
  log.vel = w;
  log.speed = w;
}

function stepDonutSpin(tms) {
  const log = game.log;
  if (!(tms > 0)) return;
  const w = donutOmega();
  log.dir = 1;
  log.vel = w;
  log.speed = w;
  log.angle += w * tms;
}

/* СЫР: ЗАПУСК. Не ровное ползание, а «раскрутили — поехал — выбежал — встал»:
   разгон, ход на полной, выбег и короткая пауза, потом заново (CHEESE_SPINUP /
   HOLD / COAST / REST в bosses.js). Скорость берём из времени фазы, поэтому
   ход не зависит от fps; угол интегрируем скоростью конца кадра — на 60 к/с
   ошибка в доли градуса. Режимы называем своими (spinup/fast/coast/rest):
   hold и pause в stepLogSpin заняты скриптовыми ходами. */
function cheeseOmega() {
  const w = TWO_PI / CHEESE_FAST_TURN;
  return game.buffs.slow ? w / 1.7 : w;
}

function beginCheeseSpin() {
  /* СЫР: ход помидора, только в другую сторону. Свой завод (разгон — полная —
     выбег — стой) больше не используется: сыр идёт теми же проворотами, что
     помидор (общий startSpinBurst, spinProfile по умолчанию — 1.35 оборота за
     3.2 с и пауза 180 мс между заходами), но раскручен против часовой.
     dir = -1 держится весь бой: переворачивать его в startSpinBurst некому
     (reverse там только у тыквы и у тех, у кого он в профиле). */
  const log = game.log;
  log.pattern = "boss";
  log.dir = -1;
  log.burst = 0;
  log.pauseT = 0;
  log.vel = 0;
  log.speed = 0;
  startSpinBurst(game.level);
}

function stepCheeseSpin(tms) {
  const log = game.log;
  if (!(tms > 0)) return;
  const slow = game.buffs.slow ? 1.7 : 1;
  const w = cheeseOmega();
  const up = CHEESE_SPINUP * slow;
  const hold = CHEESE_HOLD * slow;
  const coast = CHEESE_COAST * slow;
  const cycle = up + hold + coast + CHEESE_REST * slow;
  let t = (log.phaseT || 0) + tms;
  if (t >= cycle) t -= Math.floor(t / cycle) * cycle;
  let speed = 0;
  if (t < up) {
    const u = t / up;
    speed = w * (u * u * (3 - 2 * u));
    log.mode = "spinup";
  } else if (t < up + hold) {
    speed = w;
    log.mode = "fast";
  } else if (t < up + hold + coast) {
    const u = (t - up - hold) / coast;
    speed = w * (1 - u * u * (3 - 2 * u));
    log.mode = "coast";
  } else {
    speed = 0;
    log.mode = "rest";
  }
  log.phaseT = t;
  log.dir = 1;
  log.vel = speed;
  log.speed = speed;
  log.angle += speed * tms;
}

function lifeEase(u) {
  return 0.5 - 0.5 * Math.cos(Math.PI * clamp(u, 0, 1));
}

function lifeEaseInt(u) {
  u = clamp(u, 0, 1);
  return 0.5 * (u - Math.sin(Math.PI * u) / Math.PI);
}

function lifeCycle() {
  return LIFEBELT_CYCLE * (game.buffs.slow ? 1.7 : 1);
}

function lifeBand(fast) {
  const turn = fast ? LIFEBELT_RUSH : LIFEBELT_DRIFT;
  const w = TWO_PI / turn;
  return game.buffs.slow ? w / 1.7 : w;
}

function lifeShape(u) {
  u -= Math.floor(u);
  if (u < LIFEBELT_A) return lifeEase(u / LIFEBELT_A);
  if (u < LIFEBELT_B) return 1;
  if (u < LIFEBELT_C) return 1 - lifeEase((u - LIFEBELT_B) / (LIFEBELT_C - LIFEBELT_B));
  return 0;
}

function lifeShapeInt(u) {
  u = clamp(u, 0, 1);
  const a = LIFEBELT_A;
  const b = LIFEBELT_B;
  const c = LIFEBELT_C;
  if (u <= a) return a * lifeEaseInt(u / a);
  const risen = a * 0.5;
  if (u <= b) return risen + (u - a);
  const rushed = risen + (b - a);
  const span = c - b;
  const t = (u - b) / span;
  if (u <= c) return rushed + span * 0.5 * (t + Math.sin(Math.PI * t) / Math.PI);
  return rushed + span * 0.5;
}

function lifeOmega(u) {
  return lifeBand(false) + (lifeBand(true) - lifeBand(false)) * lifeShape(u);
}

function lifeSweep(u0, u1, cycle) {
  const ws = lifeBand(false);
  const wf = lifeBand(true);
  return cycle * (ws * (u1 - u0) + (wf - ws) * (lifeShapeInt(u1) - lifeShapeInt(u0)));
}

function beginLifeSpin() {
  const log = game.log;
  log.pattern = "lifebelt";
  log.mode = "tumble";
  log.dir = 1;
  log.phaseT = 0;
  log.burst = 0;
  log.pauseT = 0;
  const w = lifeOmega(0);
  log.vel = w;
  log.speed = w;
}

function stepLifeSpin(tms) {
  const log = game.log;
  if (!(tms > 0)) return;
  const cycle = lifeCycle();
  const dir = log.dir || 1;
  let left = tms;
  let phase = log.phaseT || 0;
  for (let n = 0; n < 4 && left > 0.04; n++) {
    const room = cycle - phase;
    const step = left < room ? left : room;
    const u0 = phase / cycle;
    const u1 = (phase + step) / cycle;
    log.angle += dir * lifeSweep(u0, Math.min(u1, 1), cycle);
    left -= step;
    phase += step;
    if (phase >= cycle - 0.04) phase = 0;
  }
  log.phaseT = phase;
  log.mode = "tumble";
  log.vel = dir * lifeOmega(phase / cycle);
  log.speed = log.vel;
}

function easeHeavy(t) {
  t = clamp(t, 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/* ЩИТ: живой маятник. Щит крутится влево до упора, у края притормаживает,
   РАЗВОРАЧИВАЕТСЯ и идёт вправо, потом снова влево — такт за тактом.

   Считаем не приращение, а сам угол от фазы такта: задержка кадра картинку
   не сдвигает, а длинный пропуск проглатывается целиком.

   Размах — ровно пол-оборота (AEGIS_SWEEP = π): та точка обвода, что смотрит
   вниз, — а нож втыкается именно в неё, — за полутакт обходит ВСЮ кромку
   щита, поэтому вечно пустого места на щите нет. Крайние позы ±π совпадают
   (щит встаёт вверх остриём), и как раз на них ход замирает.

   u — доля полного такта (0..1): первую половину щит идёт от правого края к
   левому, вторую — обратно. Профиль хода тяжёлый (easeHeavy): у краёв
   скорость нулевая, поэтому разворот видно, а в середине щит проходит центр
   на пике — 1.875 средней скорости. */
function aegisSwing(u) {
  const t = AEGIS_SWEEP;
  if (u < 0.5) return t - 2 * t * easeHeavy(u / 0.5);
  return -t + 2 * t * easeHeavy((u - 0.5) / 0.5);
}

/* угол щита в момент t (мс от старта): swingC — центр качания (ровная поза,
   остриё вниз), swing0 — фаза такта на старте */
function aegisSwingAt(log, t) {
  const a = (log.swing0 || 0) + t / (AEGIS_SWING * 2);
  return (log.swingC || 0) + aegisSwing(a - Math.floor(a));
}

function beginAegisSpin() {
  const log = game.log;
  log.pattern = "aegis";
  log.mode = "swing";
  log.beat = 0;
  log.burst = 0;
  log.pauseT = 0;
  log.spinT = 0;
  /* центр качания — поза щита на вылете: ровно, остриё вниз. Фаза взята от
     середины такта (там пик хода), поэтому с первого кадра щит уходит влево */
  log.swingC = log.angle || 0;
  log.swing0 = 0.25;
  log.angle = aegisSwingAt(log, 0);
  const w = (AEGIS_PEAK * 2 * AEGIS_SWEEP) / AEGIS_SWING;
  log.dir = -1;
  log.vel = -w;
  log.speed = -w;
}

function stepAegisSpin(tms) {
  const log = game.log;
  if (!(tms > 0)) return;
  /* тормоз-бафф растягивает весь такт: путь тот же, время длиннее */
  const slow = game.buffs.slow ? 1.7 : 1;
  const st = tms / slow;
  const t0 = log.spinT || 0;
  const t1 = t0 + st;
  const d = aegisSwingAt(log, t1) - aegisSwingAt(log, t0);
  log.angle += d;
  log.spinT = t1;
  /* ход прямо сейчас: у края щит разворачивается, dir меняется ровно там,
     а такт (beat) считает, сколько разворотов уже было */
  if (d) log.dir = d < 0 ? -1 : 1;
  log.vel = d / tms;
  log.speed = log.vel;
  log.beat = Math.floor(t1 / AEGIS_SWING + 0.5);
}

function valveSwingAt(n) {
  const deg = VALVE_SWING_DEG;
  const ms = VALVE_SWING_MS;
  const len = deg.length;
  let i = n | 0;
  if (i < 0) i = 0;
  const k = i % len;
  return {
    turns: deg[k] / 360,
    ms: ms[k],
    dir: (i % 2) ? -1 : 1
  };
}

/* производная easeHeavy: на краях ноль, в середине пик 1.875 средней */
function valveHeavyDeriv(t) {
  t = clamp(t, 0, 1);
  const o = 1 - t;
  return 30 * t * t * o * o;
}

function valveArm(log) {
  const swing = valveSwingAt(log.heaveN | 0);
  log.mode = "heave";
  log.dir = swing.dir;
  log.phaseT = 0;
  log.from = log.angle;
  log.delta = swing.dir * swing.turns * TWO_PI;
  log.heaveMs = swing.ms;
  log.vel = 0;
  log.speed = 0;
}

function beginValveHeave() {
  const log = game.log;
  log.pattern = "heave";
  log.heaveN = 0;
  log.burst = 0;
  log.pauseT = 0;
  valveArm(log);
}

function valveStall(log) {
  log.mode = "stall";
  log.phaseT = 0;
  log.angle = log.from + log.delta;
  log.vel = 0;
  log.speed = 0;
  if (state === "play") {
    /* только глухой толчок: сухой треск металла при вращении убран — на каждом
       развороте он резал ухо (было: Sfx.noise(0.04, 0.04, 120)) */
    deferSfx(() => {
      Sfx.tone(54, 0.16, "triangle", 0.07, 28);
      Sfx.tone(32, 0.28, "sine", 0.1, 18);
    });
  }
}

function valveHeave(log) {
  log.angle = log.from + log.delta;
  log.heaveN = (log.heaveN | 0) + 1;
  valveArm(log);
}

function stepValveHeave(tms) {
  const log = game.log;
  if (!(tms > 0)) return;
  const slow = game.buffs.slow ? 1.7 : 1;
  const stall = VALVE_STALL * slow;
  let left = tms;
  for (let n = 0; n < 6 && left > 0.04; n++) {
    const mode = log.mode === "stall" ? "stall" : "heave";
    log.mode = mode;
    const dur = (mode === "stall" ? stall : (log.heaveMs || VALVE_SWING_MS[0])) * (mode === "stall" ? 1 : slow);
    const phase = log.phaseT || 0;
    const room = dur - phase;
    if (!(room > 0.04)) {
      if (mode === "stall") valveHeave(log);
      else valveStall(log);
      continue;
    }
    const step = left < room ? left : room;
    const u = (phase + step) / dur;
    if (mode === "stall") {
      log.angle = log.from + log.delta;
      log.vel = 0;
    } else {
      log.angle = log.from + log.delta * easeHeavy(u);
      log.vel = log.delta * valveHeavyDeriv(u) / dur;
    }
    left -= step;
    if (phase + step >= dur - 0.04) {
      if (mode === "stall") valveHeave(log);
      else valveStall(log);
    } else log.phaseT = phase + step;
  }
  log.speed = log.vel;
}

/* Узоры бревна. Ход — толчок и выкат: бревно разгоняется с места, проходит
   середину на пике скорости и по инерции докатывается до полной остановки.
   Между ходами пауза, у обманки в ней ещё и смена стороны. Стартовой тишины
   до первого хода нет, и остановка не стучит. Обманки с 16-го уровня
   (WOOD_CALM_STAGES в progress.js).

   0 — оборот и остановка;
   1 — два хода: короткий и длинный, оба в одну сторону;
   2 — долгий неспешный оборот;
   3 — короткий ход, потом длинный;
   4 — обманка: оборот туда, пауза, такой же назад;
   5 — обманка: два коротких хода и длинный;
   6 — обманка: короткий ход против часовой и длинный обратно;
   7 — ровное кручение: без ходов, разгонов и пауз (см. WOOD_CRUISE_MS).
       Этот же узор всегда получает первое бревно (1-й уровень), только
       скорость у него случайна на забег — см. progress.js: WOOD_FIRST_PATTERN. */
const WOOD_WIND = 170;
const WOOD_WIND_ANG = 0.07;
/* натяг показываем, только если пауза длиннее него с запасом: у обманок бревна
   паузы от 220 мс, поэтому порог — 1.25 от длины натяга */
const WOOD_WIND_MIN = WOOD_WIND * 1.25;

const WOOD_SCRIPTS = [
  [{ dur: 2600, turns: 1, pause: 220, dir: 1 }],
  [
    { dur: 2000, turns: 0.75, pause: 140, dir: 1 },
    { dur: 2800, turns: 1.35, pause: 260, dir: 1 }
  ],
  [{ dur: 3400, turns: 1.4, pause: 360, dir: 1 }],
  [
    { dur: 1100, turns: 0.5, pause: 70, dir: 1 },
    { dur: 2100, turns: 1.45, pause: 300, dir: 1 }
  ],
  [
    { dur: 2600, turns: 1, pause: 220, dir: 1 },
    { dur: 2600, turns: 1, pause: 220, dir: -1 }
  ],
  [
    { dur: 720, turns: 0.32, pause: 50, dir: 1 },
    { dur: 720, turns: 0.32, pause: 50, dir: -1 },
    { dur: 2200, turns: 1.55, pause: 260, dir: 1 }
  ],
  [
    { dur: 900, turns: 0.42, pause: 80, dir: -1 },
    { dur: 2400, turns: 1.5, pause: 240, dir: 1 }
  ],
  /* 7 — ровное кручение: бревно просто едет с одной скоростью, ни разгонов,
     ни торможений, ни пауз. Скорость берётся из WOOD_CRUISE_MS */
  [{ cruise: true }]
];

/* ---------- ровное кручение ----------
   Бревно не толкается с места и не встаёт: оно крутится ровно, как маховик,
   поэтому попадать приходится с ходу. Крутится бодро — оборот за 2.4…1.3
   секунды, то есть заметно живее обычных ходов, но ещё попадаемо (на быстрых
   ходах бревно и так разгоняется до ~1.4 с на оборот). Скорость и сторону
   задаёт номер уровня, поэтому перезапуск того же уровня идёт так же, а
   следующий уровень — уже с другой скоростью. Исключение — первое бревно
   (1-й уровень): узор у него всегда этот, а скорость случайна на забег
   (js/progress.js: WOOD_FIRST_PATTERN). */
/* Пороги оборота ровного кручения (мс на оборот). Меньше — быстрее.
   Самая быстрая скорость подрезана: раньше низ был 1300 мс, и на глаз бревно
   улетало — теперь 1540 мс максимум, дальше только с баффом «медленно» */
const WOOD_CRUISE_MS = [2400, 2120, 1860, 1680, 1540];
const WOOD_CRUISE_STEP = 7;          /* множитель уровня: 7 и 5 взаимно просты,
                                        поэтому скорости идут по кругу все пять */

function woodCruisePeriod(level) {
  const l = Math.max(1, level | 0);
  const n = WOOD_CRUISE_MS.length;
  /* у первого бревна скорость не привязана к номеру уровня: оно всегда крутится
     ровно, а скорость вытягивается случайно один раз на забег */
  if (l === 1) return woodFirstPeriodMsNow();
  return WOOD_CRUISE_MS[(l * WOOD_CRUISE_STEP + 1) % n];
}

function woodCruiseOmega() {
  const period = game.log.cruisePeriod || WOOD_CRUISE_MS[0];
  const w = TWO_PI / period;
  return game.buffs.slow ? w / 1.7 : w;
}

function beginWoodCruise(level) {
  const log = game.log;
  const l = Math.max(1, level | 0);
  log.pattern = "wood";
  log.cruise = true;
  log.mode = "cruise";
  log.beat = 0;
  log.pauseT = 0;
  log.burst = 0;
  log.windOff = 0;
  log.script = null;
  log.cruisePeriod = woodCruisePeriod(l);
  /* сторону тоже задаёт уровень — на перезапуске бревно поедет так же */
  log.dir = l % 2 ? 1 : -1;
  log.vel = log.dir * woodCruiseOmega();
  log.speed = log.vel;
}

/* шаг ровного кручения: угол растёт линейно — ни толчка на старте, ни выката.
   Наплыв бревно не пережидает: оно крутится с самого первого кадра уровня и
   сразу на полной скорости. Но пока бревно растёт, его кромка шла бы по экрану
   всё быстрее (видимая скорость кромки ∝ угол × радиус, а радиус в наплыве —
   это log.scale: 0.16 → 1), и ровный ход читался бы как разгон перед ровной
   ездой. Поэтому угол в наплыве домножается на cruiseSpinScale — ход остаётся
   ровным и на глаз, а не только по числу. Броска это не касается: в наплыве
   бросок всё равно ждёт game.intro (throwKnife в flow.js). */
function stepWoodCruise(tms) {
  const log = game.log;
  if (!(tms > 0)) return;
  log.vel = log.dir * woodCruiseOmega();
  log.speed = log.vel;
  log.angle += log.vel * tms * cruiseSpinScale(log);
}

/* Множитель угла на время наплыва. Кромка бревна — его зазубрины, ручки
   застрявших ножей — обязана идти по экрану с той же скоростью, что и у бревна
   в полный рост: бревно в наплыве в log.scale раз меньше, значит угол надо
   домножить на 1/scale (лишний поворот за наплыв — около 0.03 оборота, это
   незаметно). Ниже половины роста множитель режем вдвое: бревно там меньше
   половины и почти не видно, а раскручивать его вчетверо-вшестеро быстрее
   нечего — хватит пары кадров, чтобы кромка вышла на полную скорость. */
function cruiseSpinScale(log) {
  const s = log.scale || 1;
  if (!(s < 1)) return 1;
  return 1 / (s > 0.5 ? s : 0.5);
}

function nextChaosBeat(log) {
  const prev = log.dir || 1;
  const keep = Math.random() < 0.22;
  const dir = keep ? prev : -prev;
  let dur;
  let turns;
  let pause;
  const roll = Math.random();
  if (keep || roll < 0.4) {
    dur = rand(620, 940);
    turns = rand(0.32, 0.55);
    pause = rand(28, 64);
  } else if (roll < 0.72) {
    dur = rand(900, 1240);
    turns = rand(0.5, 0.82);
    pause = rand(36, 78);
  } else {
    dur = rand(1100, 1480);
    turns = rand(0.78, 1.15);
    pause = rand(40, 88);
  }
  return { dur: dur | 0, turns: Math.round(turns * 100) / 100, pause: pause | 0, dir };
}

function nextBallMove() {
  applySpinMove(nextChaosBeat(game.log));
}

function beginBallSpin() {
  const log = game.log;
  log.pattern = "ball";
  log.ballN = 8;
  log.dir = Math.random() < 0.5 ? 1 : -1;
  log.ballOpen = false;
  log.script = null;
  log.beat = 0;
  log.revCd = 1400;
  nextBallMove();
}

function applySpinMove(move) {
  const log = game.log;
  const slow = game.buffs.slow ? 1.7 : 1;
  log.dir = move.dir || 1;
  log.beat = (log.beat | 0) + 1;
  log.from = log.angle;
  log.t = 0;
  log.pauseT = 0;
  log.windOff = 0;
  log.ramp = move.ramp || GLIDE_RAMP;
  log.pauseFor = (move.pause || 0) * slow;
  /* ход — толчок и выкат: разгон с места, пик на середине и выкат по инерции
     до полной остановки. Угол считается по пройденному пути захода (glideInt),
     поэтому ход не зависит от частоты кадров */
  log.mode = "tween";
  log.dur = (move.dur || 1) * slow;
  log.delta = log.dir * (move.turns || 0) * TWO_PI;
  /* ход поехал в другую сторону — и ни скрипа, ни толчка картинки у бревна
     больше нет: на обманках (3-я стадия и выше) мигание со скрипом только сбивали
     с толку. Куда бревно поедет, по-прежнему видно заранее по натягу (woodHold) */
}

/* ---------- ритм бревна ----------
   Ход кончается остановкой и паузой. Обманка на паузе меняет сторону.
   Стука на остановке нет. */

/* ход, который начнётся следующим: индекс узора уже сдвинут на него, когда
   стартовал текущий (см. scriptMove), поэтому смотрим в текущую позицию */
function woodPendingMove(log) {
  const script = log.script;
  if (!script || !script.length) return null;
  return script[(log.beat | 0) % script.length] || null;
}

/* ход доехал до конца: пауза, скорость ноль. Звука остановки нет. */
function woodSettle(log, extra) {
  log.mode = "pause";
  /* остаток кадра, на который ход «перескочил» свой конец, отдаём паузе: иначе
     время терялось бы и ритм бревна зависел бы от частоты кадров */
  log.pauseT = extra > 0 ? extra : 0;
  log.holdFrom = log.angle;
  log.vel = 0;
  log.speed = 0;
}

/* разворот бревна больше не мигает и не скрипит: woodCreak убран вместе с толчком
   картинки — обманку видно заранее по натягу, а мигание со скрипом только сбивали
   (см. applySpinMove) */

/* натяг: в самом конце паузы, если дальше разворот, бревно слегка оттягивается
   назад — как качели перед ходом. Игрок видит, куда оно поедет, ещё до старта,
   а следующий ход начинается уже из оттянутого положения (from = log.angle) */
function woodHold(log) {
  if (log.pattern !== "wood") return;
  const base = log.holdFrom != null ? log.holdFrom : log.angle;
  const holdFor = log.pauseFor || 180;
  const next = woodPendingMove(log);
  const dir = next && next.dir ? (next.dir < 0 ? -1 : 1) : 0;
  const flip = !!dir && dir !== (log.dir || 1) && holdFor >= WOOD_WIND_MIN;
  const left = holdFor - log.pauseT;
  if (!flip || left >= WOOD_WIND) {
    log.windOff = 0;
    log.angle = base;
    return;
  }
  const u = clamp(1 - left / WOOD_WIND, 0, 1);
  log.windOff = -dir * WOOD_WIND_ANG * (0.5 - 0.5 * Math.cos(Math.PI * u));
  log.angle = base + log.windOff;
}

/* пауза кончилась: доводим натяг до конца. Иначе величина натяга зависела бы от
   того, как кадры легли на конец паузы, и при 144 к/с бревно стояло бы чуть
   иначе, чем при 60 (сам скачок не виден: последний кадр натяга отличается от
   полного на считаные доли градуса) */
function woodHoldFinish(log) {
  if (log.pattern !== "wood") return;
  const base = log.holdFrom != null ? log.holdFrom : log.angle;
  const next = woodPendingMove(log);
  const dir = next && next.dir ? (next.dir < 0 ? -1 : 1) : 0;
  const flip = !!dir && dir !== (log.dir || 1) && (log.pauseFor || 180) >= WOOD_WIND_MIN;
  log.windOff = flip ? -dir * WOOD_WIND_ANG : 0;
  log.angle = base + log.windOff;
}

function scriptMove(script) {
  applySpinMove(script[(game.log.beat | 0) % script.length]);
}

function tryBallKick(tms) {
  const log = game.log;
  if (log.pattern !== "ball" || log.mode !== "tween") return false;
  if ((log.revCd || 0) > 0) return false;
  const u = log.dur > 0 ? log.t / log.dur : 0;
  if (u < 0.3 || u > 0.8) return false;
  const vel = log.vel || 0;
  if (Math.abs(vel) < 0.0014) return false;
  if (Math.random() > 0.11 * (tms / 1000)) return false;
  const slow = game.buffs.slow ? 1.7 : 1;
  const dur = clamp(360 * (0.0024 / Math.abs(vel)), 250, 430) * slow;
  const coast = vel * dur;
  const back = rand(0.82, 1.2);
  log.mode = "rev";
  log.revFrom = log.angle;
  log.revVel = vel;
  log.revDur = dur;
  log.revDelta = -Math.sign(vel) * (Math.abs(coast) * 0.45 + back);
  log.revT = 0;
  log.dir = log.revDelta < 0 ? -1 : 1;
  return true;
}

function stepBallKick(tms) {
  const log = game.log;
  log.revT += tms;
  const u = clamp(log.revT / log.revDur, 0, 1);
  const coast = log.revVel * log.revDur;
  const delta = log.revDelta;
  const c = 3 * delta - 2 * coast;
  const d = coast - 2 * delta;
  const uu = u * u;
  log.angle = log.revFrom + coast * u + c * uu + d * uu * u;
  log.vel = (coast + 2 * c * u + 3 * d * uu) / log.revDur;
  log.speed = log.vel;
  if (u < 1) return;
  log.angle = log.revFrom + delta;
  log.vel = 0;
  log.speed = 0;
  log.mode = "pause";
  log.pauseT = 0;
  log.pauseFor = rand(45, 85) * (game.buffs.slow ? 1.7 : 1);
  log.revCd = rand(3600, 6200);
}

function easeOutCubic(t) {
  t = clamp(t, 0, 1);
  return 1 - (1 - t) * (1 - t) * (1 - t);
}

let springY = 0;
let springV = 0;
function stepSpring(y, v, dt, freq, damp) {
  let n = 1;
  let h = dt;
  if (dt > 0.02) {
    n = Math.ceil(dt / 0.02);
    h = dt / n;
  }
  for (let i = 0; i < n; i++) {
    v = (v - y * freq * h) * Math.exp(-damp * h);
    y += v * h;
  }
  springY = y;
  springV = v;
}

function spinProfile() {
  /* Баскетбол проворачивается тем же заходом, что тыква: поворот, пауза, ход
     в обратную сторону (startSpinBurst ниже). Только заход длиннее и мягче:
     один оборот за 4.2 с вместо 1.35 оборота за 3.2 с — на глаз это те же
     провороты, но заметно плавнее и чуть медленнее. */
  const id = game.log && game.log.boss && game.log.boss.id;
  if (id === "basketball") return { reverse: true, dur: 4200, turns: 1 };
  return { reverse: false, dur: 3200, turns: 1.35 };
}

function startSpinBurst(level) {
  const log = game.log;
  const spin = spinProfile(level);
  /* у тыквы ровного хода нет: она делает проворот, встаёт на паузу и едет
     снова — но уже в другую сторону. Сторону меняем через ход, поэтому тыква
     всё время ходит навстречу сама себе (у прочих «проворотных» боссов
     spin.reverse выключен) */
  const bossId = log.boss && log.boss.id;
  const reverse = spin.reverse || bossId === "pumpkin";
  if (reverse && log.burst > 0) log.dir *= -1;
  log.burst++;
  log.from = log.angle;
  log.t = 0;
  log.mode = "tween";
  log.pauseT = 0;
  log.dur = spin.dur * (game.buffs.slow ? 1.7 : 1);
  log.delta = log.dir * spin.turns * TWO_PI;
  log.pauseFor = 180;
}

/* ---------- СКОТЧ: бешеная раскрутка, резкий стоп и медленный выкат ----------
   Цикл: за TAPE_REV_MS рулон вылетает на пиковую скорость, за TAPE_BRAKE_MS
   гасит её почти в ноль — стоп резкий, как обрезало, — но не замирает: остаётся
   TAPE_CREEP_SPEED, с которой рулон медленно едет TAPE_CREEP_MS и снова
   срывается в раскрутку. Скорость суммируется по кадрам, поэтому картинка не
   зависит от частоты кадров, а пауза и смена направления (как у проворотов)
   тут не нужны вовсе: скотч никогда не стоит и всегда крутится в одну сторону. */
const TAPE_TOP_SPEED = TWO_PI / 0.26;    /* рад/с: пик раскрутки, ~3.8 об/с */
const TAPE_CREEP_SPEED = TWO_PI / 9;     /* рад/с: выкат — оборот за девять секунд */
const TAPE_REV_MS = 280;                 /* раскрутка до пика */
const TAPE_BRAKE_MS = 90;                /* резкое гашение */
const TAPE_CREEP_MS = 800;               /* 0.8 секунды выката — и снова рывок */
/* За цикл рулон проходит ОБОРОТ ПЛЮС TAPE_EXTRA_DEG градусов: после каждой
   прокрутки он встаёт чуть правее (по часовой), а не там же, где начал.
   Лишние градусы размазаны по всему циклу (tapeCycleScale), поэтому в конце
   нет рывка — просто каждая прокрутка уезжает немного дальше. */
const TAPE_EXTRA_DEG = 66;   /* было 30° — теперь в 2.2 раза дальше за цикл */
const TAPE_EXTRA = TAPE_EXTRA_DEG * Math.PI / 180;

/* сколько рулон проходит за цикл на своих скоростях: разгон — площадь под
   кубической кривой (три четверти пика), торможение — по средней скорости,
   выкат — ровно */
function tapeBaseCycle() {
  const rev = TAPE_REV_MS / 1000;
  const brake = TAPE_BRAKE_MS / 1000;
  const creep = TAPE_CREEP_MS / 1000;
  const revAngle = TAPE_TOP_SPEED * rev - (TAPE_TOP_SPEED - TAPE_CREEP_SPEED) * rev * 0.25;
  return revAngle + (TAPE_TOP_SPEED + TAPE_CREEP_SPEED) * 0.5 * brake + TAPE_CREEP_SPEED * creep;
}

/* во сколько раз подтянуть скорости, чтобы за цикл вышло ровно оборот плюс
   лишние градусы (TAPE_EXTRA) */
function tapeCycleScale() {
  return (TWO_PI + TAPE_EXTRA) / tapeBaseCycle();
}

function beginTapeSpin() {
  const log = game.log;
  log.pattern = "tape";
  log.mode = "cruise";
  log.dir = 1;
  log.tapeMode = "rev";
  log.tapeT = 0;
  log.tapeCreepFor = 0;
  log.pauseT = 0;
  /* с места рулон уже едет: остановки у скотча не бывает ни в одной фазе */
  log.vel = TAPE_CREEP_SPEED;
  log.speed = log.vel;
}

function stepTapeSpin(tms) {
  const log = game.log;
  if (!(tms > 0)) return;
  const slow = game.buffs.slow ? 1.7 : 1;
  const dt = tms / 1000 / slow;
  log.tapeT = (log.tapeT || 0) + tms / slow;
  let v = TAPE_CREEP_SPEED;
  if (log.tapeMode === "brake") {
    /* резкое гашение: ровно от пика до выката, ни миллисекунды лишней */
    const u = clamp(log.tapeT / TAPE_BRAKE_MS, 0, 1);
    v = TAPE_TOP_SPEED + (TAPE_CREEP_SPEED - TAPE_TOP_SPEED) * u;
    if (u >= 1) {
      log.tapeMode = "creep";
      log.tapeT = 0;
      log.tapeCreepFor = TAPE_CREEP_MS;
    }
  } else if (log.tapeMode === "creep") {
    /* выкат: рулон не стоит, а медленно едет заданное время */
    v = TAPE_CREEP_SPEED;
    if (log.tapeT >= (log.tapeCreepFor || TAPE_CREEP_MS)) {
      log.tapeMode = "rev";
      log.tapeT = 0;
    }
  }
  if (log.tapeMode === "rev") {
    /* разгон почти мгновенный: почти вся скорость набирается в первой трети
       захода (куб), а остаток мягко дотягивает до пика — рывок, а не разгон */
    const u = clamp(log.tapeT / TAPE_REV_MS, 0, 1);
    const k = 1 - u;
    v = TAPE_TOP_SPEED - (TAPE_TOP_SPEED - TAPE_CREEP_SPEED) * k * k * k;
    if (u >= 1) {
      v = TAPE_TOP_SPEED;
      log.tapeMode = "brake";
      log.tapeT = 0;
    }
  }
  log.dir = 1;
  /* скорости подтянуты так, что за цикл выходит оборот плюс TAPE_EXTRA_DEG:
     после каждой прокрутки рулон стоит чуть правее */
  v *= tapeCycleScale();
  log.vel = v;
  log.speed = v;
  log.angle += v * dt;
}

function nextWoodMove() {
  scriptMove(game.log.script || WOOD_SCRIPTS[0]);
}

function coconutSlow() {
  return game.buffs.slow ? 1.7 : 1;
}

/* ---------- ЧУЧЕЛО: шапка-броня (DUMMY_HAT_* в bosses.js) ----------
   Шапка держит DUMMY_HAT_HP щелчков, как скорлупа кокоса держит свои. Нож в неё
   не входит — отскакивает, а на тулье и полях остаётся трещина: ступеней ровно
   DUMMY_HAT_STEPS, и по ним видно, сколько шапка ещё простоит. Последний щелчок
   срывает её совсем (log.hatBroken), и верх чучела становится обычной кромкой:
   нож входит и снимает запас. */

/* шапка ещё на месте? Пока её не снесли, зона над головой — броня */
function dummyHatOn() {
  const log = game.log;
  if (!log || !log.boss || log.boss.id !== "dummy") return false;
  if (log.hatHp == null) log.hatHp = DUMMY_HAT_HP;   /* заход без инициализации */
  return (log.hatHp | 0) > 0;
}

/* ступень порчи 0…DUMMY_HAT_STEPS — по ней рисуются трещины (drawDummyCap) */
function dummyHatWear() {
  const log = game.log;
  if (!log || !log.boss || log.boss.id !== "dummy") return 0;
  const hp = Math.max(0, log.hatHp | 0);
  const lost = DUMMY_HAT_HP - hp;
  return Math.round(clamp(lost / DUMMY_HAT_HP, 0, 1) * DUMMY_HAT_STEPS);
}

/* новый заход: шапка снова целая. Зовётся из beginBossSpin */
function beginDummyHat() {
  const log = game.log;
  log.hatHp = DUMMY_HAT_HP;
  log.hatBroken = false;
}

/* нож сел в шапку: она крошится, нож отскакивает, попытка НЕ снимается */
function dummyHatHit(k) {
  const log = game.log;
  const hy = log.y + hitSurfR();
  clearFlying();
  game.handT = 0;
  lastThrowAt = performance.now();
  log.hatHp = Math.max(0, (log.hatHp | 0) - 1);
  log.pulse = Math.min(0.08, (log.pulse || 0) + 0.03);
  punchView(6);
  buzz(5);
  game.flash = 0.1;
  game.flashCol = "214, 224, 232";
  game.flashK = 0.16;
  hitLogFlash(0.4);
  game.drop = beginRicochet(k, false);
  bakeSkip = 4;
  const chips = (log.boss && log.boss.chips) || ["#e6d2a4", "#c4a36a", "#6b4e32"];
  burst(log.x, hy, 6, {
    a: Math.PI / 2, spread: 1.5, smin: 120, smax: 380,
    rmin: 1.2, rmax: 2.8,
    colors: chips, g: 460, kind: "chip",
    jx: 12, jy: 9, lmin: 0.24, lmax: 0.52
  });
  if ((log.hatHp | 0) <= 0) dummyHatBreak();
  else deferSfx(() => Sfx.husk());
}

/* шапка слетела: обрывки летят, верх чучела открыт (log.hatBroken) */
function dummyHatBreak() {
  const log = game.log;
  log.hatBroken = true;
  log.pulse = Math.min(0.1, (log.pulse || 0) + 0.06);
  shakeCanvas(phone ? 3.4 : 5);
  buzz([8, 20, 10]);
  const capY = log.y - log.r * DUMMY_DOME_C;
  burst(log.x, capY, phone ? 10 : 16, {
    spread: TWO_PI, smin: 160, smax: 580,
    rmin: 1.4, rmax: 3.4,
    colors: ["#e7eef3", "#9aa6b0", "#4a545c", "#c4a36a"],
    g: 620, kind: "chip",
    jx: 16, jy: 12, lmin: 0.3, lmax: 0.7
  });
  bakeSkip = 4;
  deferSfx(() => {
    Sfx.crack();
    Sfx.tone(120, 0.2, "triangle", 0.09, 54);
  });
}

/* ---------- кокос: скорлупа в десять кусков (COCONUT_* в bosses.js) ----------
   Куски — log.plates. Углы у них свои, на самом кокосе (rel), поэтому куски едут
   вместе с ним: что окажется под ножом, решает не прицел, а поворот — нож садится
   в тот кусок, который в этот миг смотрит вниз (hitRel). Целый кусок ножа не
   держит: нож отскакивает, оставив на куске вмятину одной из пяти ступеней порчи
   (coconutShellHit). Отвалившийся кусок открывает белую мякоть — только в неё нож
   и входит (surfaceRadius в hit.js), и она снимает кокосу одну из двадцати. */

/* кусок по углу на кокосе: их ровно десять, по COCONUT_SPAN каждый. Углы живут
   со своей фазой (первый кусок встаёт низом к ножу), поэтому ищем не делением
   угла, а по ближайшей середине — тогда coconutPlateAt(plates[i].ang) === plates[i] */
function coconutPlateAt(rel) {
  const plates = game.log.plates;
  if (!plates || !plates.length) return null;
  const a = ((rel - plates[0].ang) % TWO_PI + TWO_PI) % TWO_PI;
  const i = Math.round(a / COCONUT_SPAN) % plates.length;
  return plates[i];
}

/* кусок, который ещё держит скорлупу: в мякоть нож входит только там, где её нет */
function coconutShellAt(rel) {
  const plate = coconutPlateAt(rel);
  return plate && plate.hp > 0 ? plate : null;
}

/* сколько кусков уже отвалилось: по этому счёту кокос «раздевается» */
function coconutBroken() {
  const plates = game.log.plates;
  if (!plates) return 0;
  let n = 0;
  for (let i = 0; i < plates.length; i++) if (plates[i].hp <= 0) n++;
  return n;
}

function beginCoconutSpin() {
  const log = game.log;
  log.pattern = "coconut";
  log.mode = "cruise";
  log.dir = 1;
  const plates = [];
  /* первый кусок встаёт низом к ножу: бой начинается с понятного места, а дальше
     кокос идёт ровно, и куски сами подходят под нож по очереди */
  const phase = Math.PI * 0.5 - COCONUT_HALF;
  for (let i = 0; i < COCONUT_PLATES; i++) {
    plates.push({
      ang: phase + i * COCONUT_SPAN,   /* середина куска */
      hp: COCONUT_PLATE_HP,
      seed: 1 + i * 37,                /* своя роспись трещин */
      flash: 0                         /* вспышка от последнего щелчка */
    });
  }
  log.plates = plates;
  log.shellFly = [];
  log.leaves = [];
  log.kick = 0;
  log.leafT = 0;
  log.vel = 0;
  log.speed = 0;
  log.burst = 0;
  log.pauseT = 0;
}

function coconutRecoil(heavy) {
  const log = game.log;
  log.pulse = Math.min(0.08, (log.pulse || 0) + (heavy ? 0.05 : 0.03));
}

function stepCoconutSpin(tms) {
  const log = game.log;
  if (!(tms > 0)) return;
  const turn = COCONUT_TURN * coconutSlow();
  const vel = TWO_PI / turn;
  log.dir = 1;
  log.vel = vel;
  log.speed = vel;
  log.angle += vel * tms;
  const plates = log.plates;
  if (!plates) return;
  for (let i = 0; i < plates.length; i++) {
    if (plates[i].flash > 0) plates[i].flash = Math.max(0, plates[i].flash - tms / 280);
  }
}

/* нож сел в целый кусок: скорлупа его не держит — нож отскакивает, а на куске
   остаётся вмятина. Пятый щелчок снимает кусок совсем: он отлетает вместе со
   скорлупой, а на его месте открывается мякоть */
function coconutShellHit(k, plate) {
  const log = game.log;
  const hy = log.y + hitSurfR();
  clearFlying();
  game.handT = 0;
  lastThrowAt = performance.now();
  plate.hp = Math.max(0, plate.hp - 1);
  plate.flash = 1;
  coconutRecoil(false);
  punchView(7);
  buzz(6);
  game.flash = 0.12;
  game.flashCol = "210, 180, 140";
  game.flashK = 0.18;
  hitLogFlash(0.4);
  game.drop = beginRicochet(k, false);
  bakeSkip = 4;
  const chips = (log.boss && log.boss.chips) || ["#6b4428", "#c4a070", "#3a2416"];
  burst(log.x, hy, 8, {
    a: Math.PI / 2, spread: 1.6, smin: 140, smax: 420,
    rmin: 1.4, rmax: 3.1,
    colors: chips, g: 480, kind: "chip",
    jx: 14, jy: 10, lmin: 0.28, lmax: 0.6
  });
  burst(log.x, hy, 6, {
    spread: TWO_PI, smin: 180, smax: 520,
    rmin: 1.2, rmax: 2.4,
    colors: ["#5c3a22", "#8a5a34", "#c4a070"],
    g: 360, kind: "fiber",
    jx: 10, jy: 8, lmin: 0.22, lmax: 0.48
  });
  if (plate.hp <= 0) coconutBreakPlate(plate);
  else deferSfx(() => Sfx.husk());
}

/* кусок отвалился. Он улетает сам (log.shellFly — мировые координаты: кокос его
   больше не несёт), а кокос в этом секторе разом уменьшается ровно на толщину
   скорлупы: там теперь видно мякоть (drawCoconutFlesh, clipCoconutShell) */
function coconutBreakPlate(plate) {
  const log = game.log;
  const r = log.r;
  const r0 = r * (1 - COCONUT_SHELL);
  const world = plate.ang + log.angle;
  const mid = (r0 + r) * 0.5;
  const cx = Math.cos(world) * mid;
  const cy = Math.sin(world) * mid;
  const out = rand(150, 300);
  log.shellFly.push({
    x: log.x + cx,
    y: log.y + cy,
    vx: Math.cos(world) * out + rand(-40, 40),
    vy: Math.sin(world) * out * 0.7 - rand(60, 190),
    rot: world,
    vr: rand(-6, 6) + (Math.random() < 0.5 ? -4 : 4),
    a0: plate.ang - COCONUT_HALF,
    a1: plate.ang + COCONUT_HALF,
    r0: r0,
    r1: r,
    life: 1
  });
  log.pulse = Math.min(0.09, (log.pulse || 0) + 0.055);
  shakeCanvas(phone ? 3.6 : 5.5);
  buzz([9, 22, 12]);
  burst(log.x + cx, log.y + cy, phone ? 10 : 18, {
    spread: TWO_PI, smin: 170, smax: 640,
    rmin: 1.2, rmax: 2.9,
    colors: ["#6b4428", "#8a5a34", "#3a2416", "#f3e6c8"],
    g: 620, kind: "chip",
    jx: 16, jy: 12, lmin: 0.3, lmax: 0.7
  });
  bakeSkip = 4;
  deferSfx(() => {
    Sfx.crack();
    Sfx.tone(96, 0.22, "triangle", 0.08, 48);
  });
}

function coconutHalves() {
  function ray(ang) {
    const pts = [];
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      pts.push({ x: Math.cos(ang) * t, y: Math.sin(ang) * t });
    }
    return { kind: "main", ang, pts, primary: true, width: 1.4 };
  }
  return [ray(0), ray(Math.PI)];
}

/* Нож пошёл мимо фитиля: остриё садится в латекс сбоку, латекс его не держит, и
   нож соскальзывает вниз. Удар засчитывается как промах (fail в resolveThrow), а
   шарик остаётся целым и качается дальше — его можно поймать на следующем проходе
   фитиля под ножом. Тут только «латексная» часть удара: прогиб, брызги и скрип. */
function deflectBalloon(k) {
  const log = game.log;
  const hy = log.y + hitSurfR();
  const skin = balloonSkin(log.balloonN | 0);
  hitLogFlash(0.55);
  log.pulse = Math.min(0.06, (log.pulse || 0) + 0.04);
  punchView(8);
  buzz(8);
  game.flash = 0.13;
  game.flashCol = "255, 236, 240";
  game.flashK = 0.16;
  burst(log.x, hy, phone ? 5 : 8, {
    a: Math.PI / 2, spread: 1.5, smin: 150, smax: 430,
    rmin: 1.5, rmax: 3.2,
    colors: [skin.body[2], skin.chips[2], skin.body[0]],
    g: 460, kind: "chip",
    jx: 12, jy: 9, lmin: 0.26, lmax: 0.56
  });
  burst(log.x, hy, phone ? 3 : 5, {
    spread: TWO_PI, smin: 90, smax: 300,
    rmin: 0.9, rmax: 2,
    colors: skin.chips,
    g: 320, kind: "spark",
    jx: 10, jy: 8, lmin: 0.14, lmax: 0.3
  });
  bakeSkip = 4;
  deferSfx(() => {
    Sfx.noise(0.14, 0.12, 1200);
    Sfx.tone(430, 0.16, "sine", 0.045, 220);
  });
}

/* ---------- отвалившиеся куски скорлупы ----------
   Живут в мировых координатах: кокос их больше не несёт. Летят, крутятся, гаснут —
   и уходят за кадр. Ход отдельный от листьев: листья мельтешат фоном, а кусок
   скорлупы должен падать именно там, где его сняли */
function stepCoconutShell(dt) {
  const fly = game.log.shellFly;
  if (!fly || !fly.length) return;
  for (let i = fly.length - 1; i >= 0; i--) {
    const p = fly[i];
    p.vy += 900 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rot += p.vr * dt;
    p.vx *= 0.995;
    p.life -= dt * 0.62;
    if (p.life <= 0 || p.y > H + 220) fly.splice(i, 1);
  }
}

function stepCoconutLeaves(dt) {
  const log = game.log;
  const leaves = log.leaves;
  if (!leaves) return;
  /* хохол кокоса держится за скорлупу: сняли COCONUT_LEAVES_AT куска — верх
     поехал, и пальмовые листья сыплются поверху */
  const coco = log.boss && log.boss.id === "coconut";
  if (coco && state === "play" && game.intro <= 0 && coconutBroken() >= COCONUT_LEAVES_AT) {
    log.leafT = (log.leafT || 0) + dt;
    const every = phone ? 0.42 : 0.28;
    const cap = phone ? 8 : 14;
    while (log.leafT > every && leaves.length < cap) {
      log.leafT -= every;
      leaves.push({
        x: rand(36, Math.max(48, W - 36)),
        y: -28,
        vx: rand(-28, 28),
        vy: rand(78, 150),
        rot: rand(0, TWO_PI),
        vr: rand(-1.6, 1.6),
        s: rand(0.85, 1.35)
      });
    }
  }
  for (let i = leaves.length - 1; i >= 0; i--) {
    const leaf = leaves[i];
    leaf.vy += 40 * dt;
    leaf.x += leaf.vx * dt;
    leaf.y += leaf.vy * dt;
    leaf.rot += leaf.vr * dt;
    leaf.vx += Math.sin(game.time * 0.002 + i) * 24 * dt;
    if (leaf.y > H + 48) leaves.splice(i, 1);
  }
}

/* ---------- скорлупа кокоса: швы, порча кусков и мякоть ----------
   Рисуется поверх запечённой текстуры, в повёрнутой системе кокоса. Где кусок цел —
   видны только шов с соседом и трещины его порчи; где кусок отвалился, в прореху
   (clipCoconutShell) ложится белая мякоть, а по кромке видно, что скорлупы там нет:
   кокос в этом секторе меньше ровно на её толщину */

/* прорехи на месте отвалившихся кусков: запечённая текстура рисуется под этой
   маской, поэтому скорлупа из сектора пропадает целиком, до самой мякоти */
function clipCoconutShell(r) {
  const plates = game.log.plates;
  if (!plates) return;
  const p = new Path2D();
  let any = false;
  for (let i = 0; i < plates.length; i++) {
    if (plates[i].hp > 0) continue;
    any = true;
    const a = plates[i].ang;
    p.moveTo(0, 0);
    p.arc(0, 0, r * 1.6, a - COCONUT_HALF, a + COCONUT_HALF);
    p.closePath();
  }
  if (!any) return;
  p.rect(-r * 1.7, -r * 1.7, r * 3.4, r * 3.4);
  ctx.clip(p, "evenodd");
}

/* мякоть в отвалившемся куске: белый клин от центра до кромки мякоти. Волокна и
   выбоины копятся вместе с потерянным запасом — по мякоти видно, сколько её сняли */
function drawCoconutFlesh(r0, plate) {
  const log = game.log;
  const maxHp = Math.max(1, log.maxHp || 1);
  const t = clamp((log.dmg | 0) / maxHp, 0, 1);
  const a0 = plate.ang - COCONUT_HALF;
  const a1 = plate.ang + COCONUT_HALF;
  const seed = plate.seed;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, r0, a0, a1);
  ctx.closePath();
  ctx.clip();
  const g = ctx.createRadialGradient(0, 0, r0 * 0.08, 0, 0, r0);
  g.addColorStop(0, "#fffdf4");
  g.addColorStop(0.58, "#f7eed8");
  g.addColorStop(1, "#e4d3ae");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, r0, 0, TWO_PI);
  ctx.fill();
  ctx.strokeStyle = "rgba(206, 186, 146, 0.5)";
  ctx.lineWidth = Math.max(0.8, r0 * 0.006);
  const hairs = phone ? 5 : 11;
  for (let i = 0; i < hairs; i++) {
    const a = a0 + COCONUT_SPAN * (0.08 + hash(seed, i * 3 + 1) * 0.84);
    const rr = r0 * (0.55 + hash(seed, i * 3 + 2) * 0.42);
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r0 * 0.12, Math.sin(a) * r0 * 0.12);
    ctx.quadraticCurveTo(
      Math.cos(a + 0.06) * r0 * 0.5, Math.sin(a + 0.06) * r0 * 0.5,
      Math.cos(a) * rr, Math.sin(a) * rr
    );
    ctx.stroke();
  }
  const hits = Math.min(6, Math.round(t * 6));
  for (let i = 0; i < hits; i++) {
    const a = a0 + COCONUT_SPAN * (0.16 + hash(seed, 40 + i) * 0.68);
    const d = r0 * (0.3 + hash(seed, 50 + i) * 0.58);
    const w = r0 * (0.03 + hash(seed, 60 + i) * 0.035) * (1 + t);
    ctx.fillStyle = "rgba(150, 118, 74, " + (0.3 + t * 0.35) + ")";
    ctx.beginPath();
    ctx.ellipse(Math.cos(a) * d, Math.sin(a) * d, w, w * 0.6, a, 0, TWO_PI);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 252, 240, 0.5)";
    ctx.lineWidth = Math.max(0.8, r0 * 0.005);
    ctx.beginPath();
    ctx.ellipse(Math.cos(a) * d, Math.sin(a) * d, w * 1.25, w * 0.8, a, Math.PI * 1.1, Math.PI * 1.85);
    ctx.stroke();
  }
  /* мякоть сидит глубже скорлупы: к её кромке тень гуще */
  const edge = ctx.createRadialGradient(0, 0, r0 * 0.62, 0, 0, r0);
  edge.addColorStop(0, "rgba(120, 92, 56, 0)");
  edge.addColorStop(1, "rgba(120, 92, 56, 0.42)");
  ctx.fillStyle = edge;
  ctx.beginPath();
  ctx.arc(0, 0, r0, 0, TWO_PI);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = "rgba(96, 70, 40, 0.6)";
  ctx.lineWidth = Math.max(1.6, r0 * 0.018);
  ctx.beginPath();
  ctx.arc(0, 0, r0, a0, a1);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255, 252, 242, 0.7)";
  ctx.lineWidth = Math.max(0.9, r0 * 0.008);
  ctx.beginPath();
  ctx.arc(0, 0, r0 - Math.max(1.4, r0 * 0.014), a0, a1);
  ctx.stroke();
}

/* порча куска: пять ступеней — волосяная трещина, ломаная, раскол с отломом и
   последняя, на которой кусок держится на одном волокне. Роспись закреплена за
   куском (plate.seed), поэтому трещины не переезжают от щелчка к щелчку */
function drawCoconutCracks(r, plate) {
  const dmg = COCONUT_PLATE_HP - plate.hp;
  if (dmg <= 0 && !(plate.flash > 0)) return;
  const a0 = plate.ang - COCONUT_HALF;
  const a1 = plate.ang + COCONUT_HALF;
  const seed = plate.seed;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, r, a0, a1);
  ctx.closePath();
  ctx.clip();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const lines = Math.min(4, dmg);
  for (let i = 0; i < lines; i++) {
    const off = (hash(seed, i * 7 + 1) - 0.5) * COCONUT_SPAN * 0.62;
    const t0 = 0.2 + hash(seed, i * 5 + 2) * 0.22;
    const t1 = 0.72 + hash(seed, i * 5 + 3) * 0.26;
    const bend = (hash(seed, i * 3 + 4) - 0.5) * (0.5 + i * 0.22);
    const steps = phone ? 5 : 9;
    const pts = [];
    for (let s = 0; s <= steps; s++) {
      const u = s / steps;
      const rr = t0 + (t1 - t0) * u;
      const aa = plate.ang + off + bend * Math.sin(u * Math.PI) * 0.34;
      pts.push({ x: Math.cos(aa), y: Math.sin(aa), rr });
    }
    ctx.beginPath();
    for (let s = 0; s < pts.length; s++) {
      const px = pts[s].x * pts[s].rr * r;
      const py = pts[s].y * pts[s].rr * r;
      if (s) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
    ctx.strokeStyle = "rgba(58, 32, 16, 0.85)";
    ctx.lineWidth = Math.max(2.2, r * (0.016 + i * 0.007));
    ctx.stroke();
    ctx.strokeStyle = "#f4e7c8";
    ctx.lineWidth = Math.max(1, r * (0.006 + i * 0.003));
    ctx.stroke();
    if (dmg > 2 && i === 0 && pts.length > 4) {
      /* раскол: от трещины отходит боковая ветка */
      const mid = pts[Math.floor(pts.length * 0.45)];
      const ba = plate.ang + off + (hash(seed, 30 + i) - 0.5) * 0.8;
      ctx.beginPath();
      ctx.moveTo(mid.x * mid.rr * r, mid.y * mid.rr * r);
      ctx.lineTo(Math.cos(ba) * (mid.rr + 0.16) * r, Math.sin(ba) * (mid.rr + 0.16) * r);
      ctx.strokeStyle = "rgba(58, 32, 16, 0.7)";
      ctx.lineWidth = Math.max(1.4, r * 0.012);
      ctx.stroke();
    }
  }
  if (dmg >= COCONUT_PLATE_HP - 1) {
    /* последняя ступень: по краю куска отлом — держится на одном волокне */
    const side = hash(seed, 91) > 0.5 ? a0 : a1;
    ctx.strokeStyle = "rgba(42, 22, 12, 0.75)";
    ctx.lineWidth = Math.max(2.6, r * 0.03);
    ctx.beginPath();
    ctx.moveTo(Math.cos(side) * r * 0.34, Math.sin(side) * r * 0.34);
    ctx.lineTo(Math.cos(side) * r * 0.97, Math.sin(side) * r * 0.97);
    ctx.stroke();
  }
  if (plate.flash > 0) {
    ctx.fillStyle = "rgba(255, 246, 226, " + (plate.flash * 0.3) + ")";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r, a0, a1);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawCoconutShell(r) {
  const plates = game.log.plates;
  if (!plates) return;
  const r0 = r * (1 - COCONUT_SHELL);
  for (let i = 0; i < plates.length; i++) {
    if (plates[i].hp <= 0) drawCoconutFlesh(r0, plates[i]);
    else drawCoconutCracks(r, plates[i]);
  }
  /* швы между кусками — поверх всего: по ним видно, что скорлупа из десяти кусков.
     Где оба соседних куска сорваны, шва нет: скорлупы там нет вовсе */
  ctx.save();
  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(42, 22, 12, 0.5)";
  ctx.lineWidth = Math.max(1.2, r * 0.008);
  const n = plates.length;
  for (let i = 0; i < n; i++) {
    const mine = plates[i].hp > 0;
    const prev = plates[(i + n - 1) % n].hp > 0;
    if (!mine && !prev) continue;
    const a = plates[i].ang - COCONUT_HALF;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r0 * 0.24, Math.sin(a) * r0 * 0.24);
    ctx.lineTo(Math.cos(a) * r * 0.985, Math.sin(a) * r * 0.985);
    ctx.stroke();
  }
  ctx.restore();
}

/* кусок в полёте: дуга от кромки мякоти до кромки скорлупы — сразу видно и её
   толщину, и изгиб. Внутренняя сторона светлая: это мякоть, что была под куском */
function drawCoconutShellFly() {
  const fly = game.log.shellFly;
  if (!fly || !fly.length) return;
  for (let i = 0; i < fly.length; i++) {
    const p = fly[i];
    ctx.save();
    ctx.globalAlpha = clamp(p.life, 0, 1);
    ctx.translate(snap(p.x), snap(p.y));
    ctx.rotate(p.rot);
    ctx.beginPath();
    ctx.arc(0, 0, p.r1, p.a0, p.a1);
    ctx.arc(0, 0, p.r0, p.a1, p.a0, true);
    ctx.closePath();
    const g = ctx.createRadialGradient(0, 0, p.r0, 0, 0, p.r1);
    g.addColorStop(0, "#f3e6c8");
    g.addColorStop(0.4, "#6b4428");
    g.addColorStop(1, "#8a5a34");
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = "rgba(42, 22, 12, 0.9)";
    ctx.lineWidth = Math.max(1.6, p.r1 * 0.012);
    ctx.stroke();
    ctx.restore();
  }
}

function drawCoconutLeaves() {
  const leaves = game.log.leaves;
  if (!leaves || !leaves.length) return;
  for (let i = 0; i < leaves.length; i++) {
    const leaf = leaves[i];
    ctx.save();
    ctx.translate(snap(leaf.x), snap(leaf.y));
    ctx.rotate(leaf.rot);
    ctx.scale(leaf.s, leaf.s);
    ctx.fillStyle = i % 2 ? "#4e7a32" : "#2f6a28";
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.quadraticCurveTo(14, -4, 0, 18);
    ctx.quadraticCurveTo(-14, -4, 0, -18);
    ctx.fill();
    ctx.strokeStyle = "#1c3e14";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(0, 14);
    ctx.stroke();
    ctx.restore();
  }
}

/* Такт яйца: двенадцать ЗАТУХАЮЩИХ качков → остановка → оборот ровно на 360°.

   EGG_PEAKS — вершины качков. Первый отрезок не тронут: от EGG_MAX к EGG_TAIL_MIN
   шагом 6° (105° → 75°). Дальше шаг ТОТ ЖЕ, а размах продолжает падать — 69°, 63°
   … 39°: раскачка всё меньше и меньше. Знак через раз, поэтому яйцо качается с
   боку на бок.
   После последнего качка — довод в 0°. Ноль нужен обороту: он ровно на 360°, и
   если уйти в него с 39°, поза уехала бы на 39° каждый такт.
   Скорость нигде не растёт: широкий качок идёт на темпе EGG_PACE, а узкий не
   короче EGG_ROCK_TIME — размах падает, скорость вместе с ним. */
const EGG_STEP_DEG = EGG_ROCKS > 1 ? (EGG_MAX - EGG_TAIL_MIN) / (EGG_ROCKS - 1) : 0;
const EGG_PEAKS = [];
for (let i = 0; i < EGG_ROCKS_TOTAL; i++) {
  const deg = EGG_MAX - EGG_STEP_DEG * i;
  EGG_PEAKS.push((i % 2 ? -deg : deg) * Math.PI / 180);
}
EGG_PEAKS.push(0);                      /* довод в покой: из него и идёт оборот */
const EGG_PACE_RAD = EGG_PACE * Math.PI / 180;
/* КАЧОК — ЭТО ТАКТ, А НЕ ТОЛЬКО СКОРОСТЬ. Широкий качок идёт на темпе EGG_PACE
   (как было), а узкий не короче EGG_ROCK_TIME: без этого пола с убывающим
   размахом качки становились всё короче, и яйцо под конец раскачки дёргалось
   резче, чем начинало. Размах падает — падает скорость. */
const EGG_ROCK_DUR = [];
for (let i = 0; i < EGG_PEAKS.length; i++) {
  const from = i === 0 ? 0 : EGG_PEAKS[i - 1];
  const raw = Math.abs(EGG_PEAKS[i] - from) / EGG_PACE_RAD;
  /* первый качок — завод с места: он короткий и резкий по своей природе,
     пол к нему не применяем, иначе поменялся бы самый первый толчок */
  EGG_ROCK_DUR.push(i === 0 ? raw : Math.max(raw, EGG_ROCK_TIME));
}
/* оборот — на темпе EGG_PACE и тем же синусом, что у качков (EGG_TURN_RAMP) */
const EGG_WHIP = TWO_PI / EGG_PACE_RAD;

function eggSlow() {
  return game.buffs.slow ? 1.7 : 1;
}

function beginEggSpin() {
  const log = game.log;
  log.pattern = "egg";
  log.eggAct = "rock";
  log.eggI = 0;
  log.eggT = 0;
  log.eggFrom = 0;
  log.eggSpin = -TWO_PI;
  log.phaseT = 0;
  log.burst = 0;
  log.pauseT = 0;
  log.mode = "swing";
  log.dir = -1;
  log.angle = 0;
  log.vel = 0;
  log.speed = 0;
}

function eggActDur(log) {
  if (log.eggAct === "rock") return EGG_ROCK_DUR[log.eggI] || 0.5;
  if (log.eggAct === "hold") return EGG_SETTLE;
  return EGG_WHIP;
}

function eggAdvance(log) {
  if (log.eggAct === "rock") {
    /* качок кончился на своей вершине: оттуда и идёт следующий */
    log.eggFrom = EGG_PEAKS[log.eggI];
    log.angle = log.eggFrom;
    log.eggI++;
    log.eggT = 0;
    if (log.eggI >= EGG_PEAKS.length) {
      /* последний качок довёл яйцо в покой (пик 0°) — здесь и начинается
         ОСТАНОВКА: отдельная пауза без движения, чтобы оборот читался сам по
         себе, а не как хвост последнего качка */
      log.eggAct = "hold";
      log.eggFrom = 0;
    }
    return;
  }
  if (log.eggAct === "hold") {
    /* остановка выдержана — ровный оборот на полный круг. Дельта ровно -360°:
       яйцо стоит в покое (0°), поэтому оборот возвращает его в ту же позу, и
       такт замкнут — ни накопленного сноса угла, ни лишних градусов */
    log.eggAct = "whip";
    log.eggFrom = 0;
    log.eggSpin = -TWO_PI;
    log.eggT = 0;
    return;
  }
  /* оборот замкнулся в покой — новый такт начинается с той же позы */
  log.angle = 0;
  log.eggFrom = 0;
  log.eggAct = "rock";
  log.eggI = 0;
  log.eggT = 0;
}

function eggApply(log) {
  if (log.eggAct === "hold") {
    /* остановка: яйцо стоит ровно в покое — ни хода, ни дрожи */
    log.angle = 0;
    log.eggFrom = 0;
    log.vel = 0;
  } else if (log.eggAct === "whip") {
    const dur = EGG_WHIP;
    const u = clamp(log.eggT / dur, 0, 1);
    const from = log.eggFrom || 0;
    const delta = log.eggSpin || -TWO_PI;
    log.angle = from + delta * glideInt(u, EGG_TURN_RAMP);
    log.vel = (delta * glideMul(u, EGG_TURN_RAMP) * 0.001) /
      (glideTotal(EGG_TURN_RAMP) * dur);
  } else {
    const dur = EGG_ROCK_DUR[log.eggI] || 0.5;
    const u = clamp(log.eggT / dur, 0, 1);
    const from = log.eggFrom || 0;
    const to = EGG_PEAKS[log.eggI];
    log.angle = from + (to - from) * glideInt(u);
    log.vel = ((to - from) * glideMul(u) * 0.001) / (glideTotal(GLIDE_RAMP) * dur);
  }
  log.speed = log.vel;
  log.dir = log.vel < 0 ? -1 : 1;
  log.mode = "swing";
}

function stepEggSpin(tms) {
  const log = game.log;
  if (!(tms > 0)) return;
  if (!log.eggAct) beginEggSpin();
  let left = tms * 0.001 / eggSlow();
  for (let n = 0; n < 16 && left > 1e-6; n++) {
    const room = eggActDur(log) - (log.eggT || 0);
    if (left < room) {
      log.eggT = (log.eggT || 0) + left;
      left = 0;
      break;
    }
    left -= room > 0 ? room : 0;
    eggAdvance(log);
  }
  eggApply(log);
}

function fanStageForHp(hp, maxHp) {
  const f = (hp || 0) / Math.max(1, maxHp || 1);
  if (f <= FAN_SPLIT_TURBO) return FAN_STAGE_3;
  if (f <= FAN_SPLIT_HOT) return FAN_STAGE_2;
  return FAN_STAGE_1;
}

function fanStageKick(stage) {
  const log = game.log;
  log.fanPulse = 1;
  log.fanHum = 0.18;
  if (state !== "play") return;
  punchView(stage >= FAN_STAGE_3 ? 11 : 7);
  shakeCanvas(stage >= FAN_STAGE_3 ? 4.2 : 2.8);
  buzz(8);
  game.flash = stage >= FAN_STAGE_3 ? 0.26 : 0.16;
  game.flashCol = stage >= FAN_STAGE_3 ? "255, 112, 48" : "255, 176, 110";
  game.flashK = 0.32;
  deferSfx(() => {
    const a = stage >= FAN_STAGE_3 ? 150 : 108;
    const b = stage >= FAN_STAGE_3 ? 320 : 210;
    Sfx.tone(a, 0.16, "triangle", 0.07, b);
    Sfx.tone(b, 0.09, "sine", 0.035, b * 1.25);
    Sfx.noise(0.05, 0.045, 800);
  });
}

function fanHum(stage) {
  const base = stage >= FAN_STAGE_3 ? 96 : stage >= FAN_STAGE_2 ? 72 : 54;
  deferSfx(() => {
    Sfx.tone(base, 0.13, "sine", stage >= FAN_STAGE_3 ? 0.03 : 0.02, base * 0.9);
    if (stage >= FAN_STAGE_2) Sfx.tone(base * 2, 0.06, "triangle", 0.012, base * 1.7);
  });
}

function fanPuff(log, stage) {
  if (particles.length > (phone ? 14 : 30)) return;
  const hot = stage >= FAN_STAGE_3;
  const r = log.r;
  const lx = r * 1.02;
  const ly = r * FAN_CY + rand(-r * 0.05, r * 0.05);
  const ca = Math.cos(log.angle || 0);
  const sa = Math.sin(log.angle || 0);
  burst(log.x + lx * ca - ly * sa, log.y + lx * sa + ly * ca, 1, {
    a: log.angle || 0,
    spread: 0.22,
    smin: hot ? 60 : 30,
    smax: hot ? 150 : 80,
    rmin: 1,
    rmax: hot ? 2.2 : 1.6,
    colors: hot ? FAN_HEAT : FAN_WARM,
    g: -50,
    kind: "spark",
    lmin: 0.14,
    lmax: 0.28
  });
}

function beginFanSpin() {
  const log = game.log;
  log.fanAng = 0;
  log.fanOmega = FAN_W1;
  log.fanStage = FAN_STAGE_1;
  log.fanHeat = 0;
  log.fanPulse = 0;
  log.fanHum = 0.4;
  log.fanPuff = 0.28;
}

function stepFanSpin(tms) {
  const log = game.log;
  if (!(tms > 0)) return;
  const dt = tms * 0.001;
  const want = fanStageForHp(log.hp, log.maxHp);
  const stage = log.fanStage || FAN_STAGE_1;
  if (want > stage) {
    log.fanStage = want;
    if ((log.hp || 0) > 0) fanStageKick(want);
  }
  const st = log.fanStage || FAN_STAGE_1;
  const target = st >= FAN_STAGE_3 ? FAN_W3 : st >= FAN_STAGE_2 ? FAN_W2 : FAN_W1;
  const omega = log.fanOmega || target;
  log.fanOmega = omega + (target - omega) * (1 - Math.exp(-dt * 2.6));
  log.fanAng = (log.fanAng || 0) + log.fanOmega * dt;
  if (log.fanAng > TWO_PI) log.fanAng %= TWO_PI;
  const heatT = st >= FAN_STAGE_3 ? 1 : st >= FAN_STAGE_2 ? 0.42 : 0;
  const heat = log.fanHeat || 0;
  log.fanHeat = heat + (heatT - heat) * (1 - Math.exp(-dt * 3.2));
  log.fanPulse = Math.max(0, (log.fanPulse || 0) - dt * 1.7);
  if (state !== "play") return;
  log.fanHum = (log.fanHum || 0) - dt;
  if (log.fanHum <= 0) {
    log.fanHum = st >= FAN_STAGE_3 ? 0.2 : st >= FAN_STAGE_2 ? 0.28 : 0.42;
    fanHum(st);
  }
  if (st < FAN_STAGE_2) return;
  log.fanPuff = (log.fanPuff || 0) - dt;
  if (log.fanPuff <= 0) {
    log.fanPuff = st >= FAN_STAGE_3 ? 0.18 : 0.34;
    fanPuff(log, st);
  }
}

/* КОМПАС: стрелка не «крутится», а переставляется с метки на метку.
   Ход идёт тем же заходом, что у штурвала и диско-шара: разгон с места и выкат
   в остановку (ramp 0.5 — чистый синус), а после хода — пауза. Поэтому
   разворота «только что дошёл — и в ту же секунду поехал обратно» больше нет:
   стрелка встала, постояла и уже потом пошла в другую сторону.
   Счёт: два тика в одну сторону (45° и 45°), качок обратно на два тика (90°) —
   это читаемый маятник, — и большой уход на 240°. 240, а не 360: полный оборот
   кончался ровно там, где компас стоял (циферблат в 36 делений на глаз почти
   симметричен), и большой ход выглядел как «покрутился и вернулся на то же
   место». За круг компас уходит на +240°, то есть каждый круг встаёт в новую
   точку, а в исходную возвращается только через три круга.
   turns — всегда положительный, сторону задаёт dir (applySpinMove умножает
   delta = dir · turns · 2π): иначе минус в turns и минус в dir гасили друг друга */
const COMPASS_TICK = 45;
const COMPASS_BACK = 90;
const COMPASS_SWEEP = 240;
const COMPASS_STEP = [
  { dur: 430, turns: COMPASS_TICK / 360, pause: 130, dir: 1, ramp: 0.5 },
  { dur: 430, turns: COMPASS_TICK / 360, pause: 140, dir: 1, ramp: 0.5 },
  { dur: 680, turns: COMPASS_BACK / 360, pause: 210, dir: -1, ramp: 0.5 },
  { dur: 1250, turns: COMPASS_SWEEP / 360, pause: 360, dir: 1, ramp: 0.5 }
];

/* ---------- КЛУБОК: пружина шестерёнки на «лунной» гравитации ----------
   Механизм ровно шестерёночный (beginGearSpin/stepGearSpin): три отскока с
   растущим пиком и четвёртый толчок-закрепление, каждый удар — полуволна синуса.
   Меняются только числа: такты вдвое-втрое длиннее, пики чуть дальше, а на пике
   клубок висит дольше — он тяжёлый и вялый, как на Луне. Поэтому вместо рывка
   пружины видно долгий разгон, долгое зависание в верхней точке и медленный
   выкат обратно: ни стука на старте, ни стука в конце.
   Все циклы идут в одну сторону: поза копится на закрепление за цикл. Шаг его
   ножей — 360/7° (семь ножей, BOSS_KNIVES.yarn), а закрепление здесь равно
   десяти таким шагам (10 × 360/7 ≈ 514.3°). Поэтому клубок всегда встаёт на ту
   же сетку, что и в начале боя, и никаких случайных «подарочных» поз (широкое
   окно под ножом) и «мёртвых» (нож под ножом) не бывает.
   slots 7 — домашняя поза ложится на ножи клубка (семь через 360/7°). */
const YARN_GEAR = {
  push: [18 * Math.PI / 180, 52 * Math.PI / 180, 114 * Math.PI / 180],
  pushMs: [950, 1200, 1450],
  rise: 0.44,
  /* закрепление — десять шагов ножей клубка. Тогда поза после каждого
     закрепления снова ложится на сетку его ножей, и клубок никогда случайно не
     встаёт ни «в зуб» (нож под ножом), ни в дармовое широкое окно.
     spinMs вырос пропорционально spin (×1.3): рывок стал длиннее и дальше, но
     скорость самого толчка осталась прежней. */
  spin: 10 * TWO_PI / 7,
  spinMs: 2210,
  hold: 560,
  slots: 7
};

function beginYarnSpin() {
  /* тот же механизм, что у шестерёнки, — свои только числа профиля */
  beginGearSpin(YARN_GEAR);
}

function nextCompassMove() {
  /* скрипт берём у самого босса: у компаса в log.script лежит COMPASS_STEP,
     а клубок отсюда больше не ходит — он на пружине шестерёнки (YARN_GEAR) */
  scriptMove(game.log.script || COMPASS_STEP);
}

function sealCompass(level) {
  game.compassPat = { level: level, steps: COMPASS_STEP };
}

function beginCompassSpin() {
  const log = game.log;
  log.pattern = "compass";
  log.beat = 0;
  log.dir = 1;
  log.script = COMPASS_STEP;
  log.burst = 0;
  log.pauseT = 0;
  log.vel = 0;
  log.speed = 0;
  nextCompassMove();
}

function startLogSpin(level) {
  const log = game.log;
  const boss = log.boss;
  log.beat = 0;
  log.dir = 1;
  log.cruise = false;
  if (!boss) {
    const script = WOOD_SCRIPTS[woodPatternAt(level)] || WOOD_SCRIPTS[0];
    const first = script[0] || null;
    /* ровное кручение идёт своим счётом: ни ходов, ни пауз — сразу включаем */
    if (first && first.cruise) {
      beginWoodCruise(level);
      return;
    }
    log.script = script;
    log.pattern = "wood";
    log.beat = 0;
    log.dir = first && first.dir ? first.dir : 1;
    log.windOff = 0;
    nextWoodMove();
    return;
  }
  if (boss.id === "valve") {
    beginValveHeave();
    return;
  }
  if (boss.id === "saw" || boss.id === "tire") {
    /* пила и шина ходят ОДНИМ механизмом: передачи 1 → 3 → 7 → 15, короткий
       тормоз и пауза, потом заново (SAW_GEARS, sawOrbit ниже) */
    beginSawSpin();
    return;
  }
  if (boss.id === "ball") {
    beginBallSpin();
    return;
  }
  if (boss.id === "helm") {
    /* штурвал выруливает ходами: короткий ход, пауза, ход в обратную сторону,
       потом два длинных хода на два оборота (HELM_SCRIPT) */
    beginHelmSpin();
    return;
  }
  if (boss.id === "aegis") {
    beginAegisSpin();
    return;
  }
  if (boss.id === "donut") {
    beginDonutSpin();
    return;
  }
  if (boss.id === "cheese") {
    beginCheeseSpin();
    return;
  }
  if (boss.id === "coconut") {
    beginCoconutSpin();
    return;
  }
  if (boss.id === "egg") {
    beginEggSpin();
    return;
  }
  if (boss.id === "fan") {
    beginFanSpin();
    beginValveSpin();
    return;
  }
  if (boss.id === "candy") {
    beginValveSpin();
    return;
  }
  if (boss.id === "lifebelt") {
    beginLifeSpin();
    return;
  }
  if (boss.id === "balloon") {
    /* шарик: латекс берёт цвет по числу лопнувших (красный — синий — зелёный),
       а кручения нет вовсе — только парение, см. SMOOTH_STYLE.balloon */
    applyBalloonSkin(boss, log.balloonN | 0);
    beginSmoothSpin("balloon");
    return;
  }
  if (boss.id === "marmalade") {
    /* жевачка катится ровным ходом в одну сторону (SMOOTH_STYLE.marmalade,
       SMOOTH_TURNS.marmalade) — без качаний, разворотов и пауз */
    beginSmoothSpin("marmalade");
    return;
  }
  if (boss.id === "tennis") {
    beginTennisSpin();
    return;
  }
  if (boss.id === "yarn") {
    /* клубок: та же пружина, что у шестерёнки, только на «лунной» гравитации —
       такты длиннее, пики дальше, на пике висит дольше (beginYarnSpin/YARN_GEAR) */
    beginYarnSpin();
    return;
  }
  if (boss.id === "compass") {
    beginCompassSpin();
    return;
  }
  if (boss.id === "pizza") {
    /* пицца поворачивается ломтями: один и тот же ход в одну сторону и пауза
       после каждого — как штурвал ходами, только проще, плавнее и медленнее
       (PIZZA_STEP) */
    beginPizzaSpin();
    return;
  }
  if (boss.id === "cog") {
    /* шестерёнка не крутится, а пружинит на ровном ходу: её несёт по периметру
       ровный ход, поверх которого короткий завод вправо и один мягкий качок влево
       — beginGearSpin/stepGearSpin */
    beginGearSpin();
    return;
  }
  if (boss.id === "disco") {
    /* диск-шар: короткие тычки по 30° и длинный уход на 210° (DISCO_STEP) */
    beginDiscoSpin();
    return;
  }
  if (boss.id === "tape") {
    /* скотч: рывок до бешеной скорости, резкий стоп и медленный выкат — и так
       по кругу (beginTapeSpin/stepTapeSpin выше) */
    beginTapeSpin();
    return;
  }
  /* ровное кручение: у каждого свой оборот и свой характер (SMOOTH_STYLE,
     SMOOTH_TURNS) — сердце, мишень и жевачка идут ровно, без
     остановок; у пэпси поверх ровного хода только встряска картинки */
  if (boss.id === "camera") {
    beginCameraSpin();
    return;
  }
  if (boss.id === "reverse" || boss.id === "pepsi" || boss.id === "coin" ||
    boss.id === "pie" || boss.id === "heart" || boss.id === "target") {
    beginSmoothSpin(boss.id);
    return;
  }
  /* чучело: на заходе шапка целая — она держит DUMMY_HAT_HP щелчков, а потом
     слетает и открывает верх (beginDummyHat/dummyHatHit выше) */
  if (boss.id === "dummy") beginDummyHat();
  log.pattern = "boss";
  startSpinBurst(level);
}

function stepSpin(level, tms) {
  const log = game.log;
  if (log.boss && log.boss.id === "fan") stepFanSpin(tms);
  if (log.pattern === "smooth") {
    stepSmoothSpin(tms);
    return;
  }
  if (log.pattern === "gear") {
    stepGearSpin(tms);
    return;
  }
  if (log.pattern === "saw") {
    stepSawSpin(tms * 0.001);
    return;
  }
  if (log.pattern === "valve") {
    stepValveSpin(tms);
    return;
  }
  if (log.pattern === "heave") {
    stepValveHeave(tms);
    return;
  }
  if (log.pattern === "aegis") {
    stepAegisSpin(tms);
    return;
  }
  if (log.pattern === "donut") {
    stepDonutSpin(tms);
    return;
  }
  if (log.pattern === "cheese") {
    stepCheeseSpin(tms);
    return;
  }
  if (log.pattern === "lifebelt") {
    stepLifeSpin(tms);
    return;
  }
  if (log.pattern === "coconut") {
    stepCoconutSpin(tms);
    return;
  }
  if (log.pattern === "egg") {
    stepEggSpin(tms);
    return;
  }
  if (log.pattern === "camera") {
    stepCameraSpin(tms);
    return;
  }
  if (log.pattern === "tape") {
    stepTapeSpin(tms);
    return;
  }
  /* ровное кручение: бревно ведут только сюда — ни ходов, ни пауз */
  if (log.pattern === "wood" && log.cruise) {
    stepWoodCruise(tms);
    return;
  }
  if (log.pattern === "ball" && (log.revCd || 0) > 0 && log.mode !== "rev") log.revCd -= tms;
  if (log.mode === "rev") {
    stepBallKick(tms);
    return;
  }
  if (log.mode === "hold") {
    if (log.pattern === "ball") nextBallMove();
    else if (log.pattern === "wood") nextWoodMove();
    else if (log.pattern === "helm") nextHelmMove();
    else if (log.pattern === "disco") nextDiscoMove();
    else if (log.pattern === "compass") nextCompassMove();
    else if (log.pattern === "pizza") nextPizzaMove();
    else if (log.pattern === "tennis") nextTennisMove();
    else startSpinBurst(level);
  }
  if (log.mode === "pause") {
    log.vel = 0;
    log.speed = 0;
    log.pauseT += tms;
    /* в конце паузы, если дальше разворот, бревно оттягивается назад: куда оно
       поедет, видно ещё до старта хода */
    woodHold(log);
    const holdFor = log.pauseFor || 180;
    if (log.pauseT >= holdFor) {
      /* пауза кончилась — сразу запускаем новый заход и отдаём ему остаток
         кадра, иначе на стыке пропадал кадр и вращение дёргалось */
      woodHoldFinish(log);
      const left = log.pauseT - holdFor;
      if (log.pattern === "ball") nextBallMove();
      else if (log.pattern === "wood") nextWoodMove();
      else if (log.pattern === "helm") nextHelmMove();
      else if (log.pattern === "disco") nextDiscoMove();
      else if (log.pattern === "compass") nextCompassMove();
      else if (log.pattern === "pizza") nextPizzaMove();
      else if (log.pattern === "tennis") nextTennisMove();
      else startSpinBurst(level);
      if (left > 0 && log.mode !== "pause") stepSpin(level, left);
    }
    return;
  }
  if (log.pattern === "ball" && tryBallKick(tms)) {
    stepBallKick(tms);
    return;
  }
  log.t += tms;
  const u = clamp(log.t / log.dur, 0, 1);
  /* плавный профиль: разгон и торможение без рывка, середина — ровный ход.
     Долю разгона задаёт сам ход (move.ramp): у обманок бревна она больше,
     поэтому вход и выход длиннее и разворот видно заранее */
  log.angle = log.from + log.delta * glideInt(u, log.ramp);
  log.vel = (log.delta * glideMul(u, log.ramp)) / (glideTotal(log.ramp) * log.dur);
  log.speed = log.vel;
  if (u >= 1) {
    log.angle = log.from + log.delta;
    woodSettle(log, log.t - log.dur);
  }
}

