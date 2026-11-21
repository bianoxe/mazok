/* ---------- звук попадания в бревно ----------
   Пять характеров одного события — нож вошёл в кромку БРЕВНА (у боссов свой
   материал, см. Sfx.bossStick). Выбор зашит в игру: всегда звучит 2/5
   «глухой» (индекс 1). localStorage и меню выбора больше не участвуют.
   Сами удары собираются ниже, в Sfx.stick:
   0 «сочный», 1 «глухой», 2 «звонкий», 3 «тяжёлый», 4 «классика». */
const STICK_SOUND_KEY = "bh_stick_sound";
const STICK_SOUND_NAMES = ["СОЧНЫЙ", "ГЛУХОЙ", "ЗВОНКИЙ", "ТЯЖЁЛЫЙ", "КЛАССИКА"];
const STICK_SOUND_FIXED = 1;
let stickSound = STICK_SOUND_FIXED;
/* ---------- звук разлома бревна ----------
   Смерть обычного бревна: запас снят, ствол разлетается (js/flow.js:
   levelCleared). У боссов своя смерть (Sfx.bossCrack), а осколки болвана и
   кокоса зовут прежний crack() напрямую — этот выбор их не трогает.
   Выбор зашит в игру: всегда звучит 1/5 «глубокий» (индекс 0). Прежний набор
   из пятнадцати убран: у него верх сидел в 2.6–4 кГц и на пачке слоёв бил по
   ушам. Звук собран иначе — вес в 45–90 Гц, деревянный корпус 300–700 Гц
   и стук 560–1050 Гц (woodKnock / _crackHit), волокна мягким lowpass-шумом
   не выше 2.6 кГц. Разлом должен ощущаться ударом в грудь, а не «дзынем»
   в уши. Остальные характеры остались в коде, но игроку недоступны. */
const LOG_CRACK_KEY = "bh_log_crack";
const LOG_CRACK_NAMES = [
  "ГЛУБОКИЙ", "ВЛАЖНЫЙ", "ХРУСТ", "ТЯЖЁЛЫЙ",
  "ЩЕПКИ", "ГРОХОТ", "ТРЕЩИНА", "ЭХО"
];
const LOG_CRACK_FIXED = 0;
let logCrackSound = LOG_CRACK_FIXED;

const Sfx = {
  ctx: null,
  _noise: null,
  _out: null,
  _lim: null,
  _phone: null,
  _warm: false,
  _burstAt: 0,
  _burst: 0,
  ensure() {
    if (!this.ctx) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return;
      let c = null;
      /* Телефон: просим самый короткий буфер вывода. По умолчанию он тоже
         «interactive», но некоторые Android-сборки сами выбирают большой
         буфер, и тогда удар приходит на 100+ мс позже картинки. */
      try { c = phone ? new Ctor({ latencyHint: "interactive" }) : new Ctor(); } catch (err) {}
      if (!c) {
        try { c = new Ctor(); } catch (err) { return; }
      }
      this.ctx = c;
    }
    if (this.ctx.state === "suspended" && !GamePause.on && !this._rec) this._wake();
    if (!this._noise) {
      const len = this.ctx.sampleRate;
      const n = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = n.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this._noise = n;
    }
  },
  /* resume() возвращает промис: без catch отказ (например, WebView без жеста)
     всплывал бы необработанной ошибкой в консоли */
  _wake() {
    if (!this.ctx || !this.ctx.resume) return;
    try {
      const p = this.ctx.resume();
      if (p && p.catch) p.catch(function () {});
    } catch (err) {}
  },
  /* Разбудить звук на первом касании, ДО обработчика игры. Телефонный
     AudioContext стартует «suspended» и просыпается асинхронно: если будить
     его только в момент удара, первый нож звучит позже картинки (или молчит).
     Тихий пустой буфер — классическая разблокировка iOS; заодно заранее
     собираем шину и шум, чтобы первый удар не тратил время на их создание. */
  unlock() {
    this.ensure();
    if (!this.ctx) return;
    if (this.ctx.state !== "running" && !GamePause.on) this._wake();
    if (this._warm) return;
    this._warm = true;
    try {
      const src = this.ctx.createBufferSource();
      src.buffer = this.ctx.createBuffer(1, 1, this.ctx.sampleRate);
      src.connect(this.bus());
      src.start(0);
    } catch (err) {}
    /* Фоном, после первого тапа: печём частые звуки в буферы. Не в кадре —
       setTimeout, и по одному, чтобы не забить аудиопоток. */
    const self = this;
    setTimeout(function () { self._warmBuffers(); }, 250);
  },
  _warmBuffers() {
    if (!this.ctx || this._rec) return;
    if (!this._canBake()) {
      if ((this._warmTries | 0) < 80) {
        this._warmTries = (this._warmTries | 0) + 1;
        const self = this;
        setTimeout(function () { self._warmBuffers(); }, 600);
      }
      return;
    }
    if (this._warmRun) return;
    this._warmRun = true;
    const jobs = [];
    /* Текущий характер разлома и текущий удар — то, что реально звучит в бою.
       Остальные варианты запекутся в меню при выборе плашки (js/stick-sound.js
       сразу проигрывает выбранный), поэтому все восемь здесь не нужны. */
    jobs.push(["crack:" + logCrackSound, 0.95, function () { this._crackVariant(logCrackSound); }]);
    jobs.push(["stick:" + stickSound, 0.34, function () { this._stickVariant(stickSound); }]);
    jobs.push(["throw", 0.18, function () { this._throwRaw(); }]);
    jobs.push(["apple", 0.18, function () { this._appleRaw(); }]);
    jobs.push(["fail", 0.62, function () { this._failRaw(); }]);
    jobs.push(["deathBeat", 0.09, function () { this._deathBeatRaw(); }]);
    jobs.push(["settle", 0.24, function () { this._settleRaw(); }]);
    jobs.push(["creakUp", 0.32, function () { this._creakRaw(true); }]);
    jobs.push(["creakDown", 0.32, function () { this._creakRaw(false); }]);
    jobs.push(["whoosh", 0.32, function () { this._whooshRaw(); }]);
    jobs.push(["pick", 0.16, function () { this._pickRaw(); }]);
    let i = 0;
    const step = () => {
      if (!this.ctx) { this._warmRun = false; return; }
      if (i >= jobs.length) { this._warmRun = false; return; }
      if (!this._canBake()) {
        this._warmRun = false;
        this._warmTries = 0;
        setTimeout(() => this._warmBuffers(), 600);
        return;
      }
      const j = jobs[i++];
      this._buf(j[0], j[1], j[2]);
      setTimeout(step, 180);
    };
    step();
  },
  /* Общая шина: громкость + лимитер. На ПК — как было. На телефоне добавляем
     компенсацию маленького динамика: саб ниже 90 Гц он всё равно не играет,
     только зря съедает запас и трещит; зато 200–500 Гц («тело» дерева) и
     верхняя середина у него провалены. Поэтому срезаем неслышимый низ,
     поднимаем низкую середину и чуть прибираем звонкость 3 кГц: на телефоне
     удар снова читается телом, а не одним щелчком. Компрессор держит пики. */
  bus() {
    if (this._out) return this._out;
    const c = this.ctx;
    /* Предрендер: сухой выход прямо в destination — телефонные фильтры и
       компрессор применятся при ПРОИГРЫВАНИИ (через живую шину), как и раньше. */
    if (this._rec) {
      const dry = c.createGain();
      dry.gain.value = 1;
      dry.connect(c.destination);
      return dry;
    }
    const g = c.createGain();
    g.gain.value = 1;
    let node = g;
    if (phone) {
      try {
        const hp = c.createBiquadFilter();
        hp.type = "highpass";
        hp.frequency.value = 90;
        hp.Q.value = 0.7;
        const body = c.createBiquadFilter();
        body.type = "lowshelf";
        body.frequency.value = 220;
        body.gain.value = 3;
        const harsh = c.createBiquadFilter();
        harsh.type = "peaking";
        harsh.frequency.value = 2800;
        harsh.Q.value = 0.8;
        harsh.gain.value = -2;
        node.connect(hp);
        hp.connect(body);
        body.connect(harsh);
        node = harsh;
        this._phone = [hp, body, harsh];
      } catch (err) {}
    }
    if (c.createDynamicsCompressor) {
      const k = c.createDynamicsCompressor();
      k.threshold.value = -18;
      k.knee.value = 12;
      k.ratio.value = 6;
      k.attack.value = 0.003;
      k.release.value = 0.18;
      node.connect(k);
      k.connect(c.destination);
      this._lim = k;
    } else {
      node.connect(c.destination);
    }
    this._out = g;
    return g;
  },
  /* Контекст просыпается на первом тапе; если он ещё suspended — будим его, но
     звук НЕ выбрасываем: на телефоне resume асинхронный, и выброс съедал первые
     удары (жалоба «некоторых звуков нет»). Во время паузы площадки не играем. */
  ready() {
    if (!this.ctx) return false;
    if (this._rec) return true;
    if (GamePause.on) return false;
    if (this.ctx.state !== "running") this._wake();
    return true;
  },
  /* Ограничитель пачки: не больше N стартов за 35 мс — иначе треск */
  _ok() {
    const t = this.ctx.currentTime;
    if (t - this._burstAt > 0.035) {
      this._burstAt = t;
      this._burst = 0;
    }
    return ++this._burst <= (phone ? 10 : 18);
  },
  /* Звук вне игры: глушим контекст при потере фокуса (треб. 1.3) */
  suspend() {
    if (this.ctx && this.ctx.state === "running") this.ctx.suspend();
  },
  resume() {
    if (this.ctx && this.ctx.state === "suspended" && !GamePause.on) this._wake();
  },
  /* Живая неровность: множитель около 1. Питч и громкость каждого разлома
     чуть разные — один и тот же звук не читается как приевшийся сэмпл.
     Неровность маленькая (±2–5 %), иначе поедет баланс слоёв. */
  _rn(spread) {
    return 1 + (Math.random() * 2 - 1) * spread;
  },
  /* ---------- предрендер частых звуков ----------
     Каждый удар ножа собирает заново 4–6 узлов WebAudio: осцилляторы, фильтры,
     громкости. На слабом телефоне это несколько миллисекунд ровно в кадр удара —
     и кадр может не успеть. Поэтому частые звуки один раз рендерятся в
     OfflineAudioContext (это происходит в аудиопотоке, не в кадре) и дальше
     играются одним буфером. Пока буфер ещё не готов, играет обычный синтез:
     игрок не слышит разницы и не ждёт. */
  _bufs: null,
  _bufBusy: null,
  _rec: false,

  /* Печь буферы можно только в меню/загрузке: создание OfflineAudioContext —
     синхронная работа на главном потоке (несколько мс), и в кадре боя она
     недопустима. В игре уже готовые буферы играют, а незнакомый звук — обычным
     синтезом (он дешевле, чем разово заводить контекст). */
  _canBake() {
    if (this._forceBake) return true;
    if (this._rec) return true;
    if (typeof state === "undefined") return true;
    return state === "menu" || state === "boot";
  },

  _buf(key, dur, make) {
    if (!this.ctx || this._rec) return null;
    if (!this._bufs) { this._bufs = {}; this._bufBusy = {}; }
    const ready = this._bufs[key];
    if (ready) return ready;
    if (this._bufBusy[key]) return null;
    if (!this._canBake()) return null;
    const Ctor = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!Ctor) return null;
    this._bufBusy[key] = 1;
    let oc = null;
    try {
      oc = new Ctor(2, Math.max(1, Math.ceil(this.ctx.sampleRate * dur)), this.ctx.sampleRate);
    } catch (err) {
      this._bufBusy[key] = 0;
      return null;
    }
    const saveCtx = this.ctx, saveOut = this._out, saveLim = this._lim;
    const savePhone = this._phone, saveNoise = this._noise;
    this.ctx = oc;
    this._out = null;
    this._lim = null;
    this._phone = null;
    this._noise = null;
    this._rec = true;
    try { this.ensure(); } catch (err) {}
    try { make.call(this); } catch (err) {}
    this.ctx = saveCtx;
    this._out = saveOut;
    this._lim = saveLim;
    this._phone = savePhone;
    this._noise = saveNoise;
    this._rec = false;
    let p = null;
    try { p = oc.startRendering(); } catch (err) { p = null; }
    if (!p || !p.then) {
      this._bufBusy[key] = 0;
      return null;
    }
    p.then((buf) => {
      this._bufs[key] = buf;
      this._bufBusy[key] = 0;
    }, () => { this._bufBusy[key] = 0; });
    return null;
  },

  _playBuf(buf) {
    if (!buf || muted || !this.ready()) return true;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const r = this._rn(0.02);
    if (src.playbackRate) src.playbackRate.value = r;
    src.connect(this.bus());
    src.start(0);
    return true;
  },
  tone(freq, dur, type, vol, slide) {
    if (muted || !this.ready()) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.bus());
    o.start(t); o.stop(t + dur + 0.02);
  },
  noise(dur, vol, hp, delay) {
    if (muted || !this._noise || !this.ready()) return;
    const t = this.ctx.currentTime + (delay || 0);
    const src = this.ctx.createBufferSource();
    src.buffer = this._noise;
    const f = this.ctx.createBiquadFilter(); f.type = "highpass"; f.frequency.value = hp;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.bus());
    src.start(t);
    src.stop(t + dur + 0.02);
  },
  /* мягкий шум: lowpass — сок, мякоть, ткань; без «дощатого» шипения */
  softNoise(dur, vol, lp, delay) {
    if (muted || !this._noise || !this.ready()) return;
    const t = this.ctx.currentTime + (delay || 0);
    const src = this.ctx.createBufferSource();
    src.buffer = this._noise;
    const f = this.ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = lp;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.bus());
    src.start(t);
    src.stop(t + dur + 0.02);
  },
  /* Общий удар разлома: импульс шума с обрезом 750 Гц (щелчок волокон, но без
     «игл» в 3–6 кГц) плюс узкий стук корпуса — именно он звучит на динамике
     телефона, где саб не воспроизводится. freq/q подбираются под характер:
     ниже freq и меньше q — больше и тяжелее ствол. */
  _crackHit(v, freq, q) {
    this.noise(0.034, 0.36 * v, 700);
    this.woodKnock(0.11, 0.62 * v, freq, q * 0.8);
  },
  /* Деревянный «тук» — корпус ствола. Шум пропускается через узкую полосу
     (bandpass), поэтому удар плотный и тёплый, а верха срезаны: никаких
     «игл» в 3–4 кГц, которые бьют по ушам на телефоне и в наушниках.
     freq — резонанс ствола (300–700 Гц), q — узость полосы (1.8–3.5);
     чем ниже freq и меньше q, тем больше ствол и тем тяжелее удар. */
  woodKnock(dur, vol, freq, q, delay) {
    if (muted || !this._noise || !this.ready()) return;
    const t = this.ctx.currentTime + (delay || 0);
    const src = this.ctx.createBufferSource();
    src.buffer = this._noise;
    const f = this.ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = freq;
    f.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.bus());
    src.start(t);
    src.stop(t + dur + 0.02);
  },
  /* тон с задержкой — «нож уходит внутрь», второй слой после удара */
  toneAt(freq, dur, type, vol, slide, delay) {
    if (muted || !this.ready()) return;
    const t = this.ctx.currentTime + (delay || 0);
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.014);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.bus());
    o.start(t); o.stop(t + dur + 0.02);
  },
  /* Сухой тик на смерти — БЕЗ эха: один короткий щелчок, ровно раз в секунду,
     всего пять раз, пока гаснет нож (js/sim.js) */
  deathBeat() {
    this.ensure();
    const b = this._buf("deathBeat", 0.09, function () { this._deathBeatRaw(); });
    if (b) return this._playBuf(b);
    this._deathBeatRaw();
  },
  _deathBeatRaw() {
    if (muted || !this.ready()) return;
    this.noise(0.014, 0.12, 2600);
    this.tone(1500, 0.045, "triangle", 0.05, 1100);
  },
  throw() {
    this.ensure();
    const b = this._buf("throw", 0.18, function () { this._throwRaw(); });
    if (b) return this._playBuf(b);
    this._throwRaw();
  },
  _throwRaw() {
    this.noise(0.12, 0.12, 900);
    this.tone(420, 0.1, "sine", 0.05, 160);
  },
  /* ---------- удар ножа в бревно ----------
     В игре намертво зашит 2/5 «глухой». Все варианты короткие (0.14–0.26 с):
     удары идут очередью, и длинный хвост превращал бы игру в кашу. */
  stick() {
    this.ensure();
    const v = STICK_SOUND_FIXED;
    /* готовый буфер — один draw/start вместо пяти узлов в кадре удара */
    const buf = this._buf("stick:" + v, 0.34, function () { this._stickVariant(v); });
    if (buf) return this._playBuf(buf);
    return this._stickVariant(v);
  },
  _stickVariant(v) {
    if (v === 1) return this.stickDull();
    if (v === 2) return this.stickRing();
    if (v === 3) return this.stickHeavy();
    if (v === 4) return this.stickClassic();
    return this.stickJuicy();
  },
  /* сочный: лезвие входит в сырое дерево — щелчок, хруст волокон, плотное тело */
  stickJuicy() {
    this.noise(0.018, 0.22, 3200);
    this.softNoise(0.06, 0.28, 1200);
    this.tone(88, 0.16, "sine", 0.3, 48);
    this.tone(212, 0.075, "triangle", 0.1, 96);
    this.toneAt(420, 0.05, "sine", 0.035, 240, 0.01);
  },
  /* глухой: вязкая плотная древесина — верха почти нет, весь удар уходит в низ */
  stickDull() {
    this.softNoise(0.12, 0.3, 380);
    this.tone(66, 0.22, "sine", 0.34, 34);
    this.tone(132, 0.1, "triangle", 0.07, 60);
    this.noise(0.03, 0.06, 300);
  },
  /* звонкий: сухая выдержанная древесина — короткий «ток» с деревянным звоном */
  stickRing() {
    this.noise(0.016, 0.2, 3600);
    this.softNoise(0.05, 0.08, 900);
    this.tone(104, 0.14, "sine", 0.22, 66);
    this.tone(286, 0.13, "triangle", 0.11, 150);
    this.tone(640, 0.16, "sine", 0.07, 480);
    this.tone(1180, 0.1, "triangle", 0.035, 900);
  },
  /* тяжёлый: толстый комель — удар с сабом и долгим весом */
  stickHeavy() {
    this.noise(0.05, 0.26, 1000);
    this.softNoise(0.2, 0.18, 300);
    this.tone(52, 0.26, "sine", 0.36, 28);
    this.tone(108, 0.16, "triangle", 0.12, 46);
    this.toneAt(74, 0.18, "sine", 0.08, 40, 0.02);
  },
  /* классика: прежний деревянный удар — один в один, как было до выбора */
  stickClassic() {
    this.tone(90, 0.16, "sine", 0.28, 50);
    this.tone(220, 0.08, "triangle", 0.08);
    this.noise(0.08, 0.08, 200);
  },
  clang() {
    this.noise(0.028, 0.16, 2800);
    this.tone(1560, 0.2, "triangle", 0.11, 1120);
    this.tone(2340, 0.11, "sine", 0.05, 1860);
    this.tone(520, 0.28, "sine", 0.07, 320);
    this.tone(188, 0.14, "triangle", 0.05, 110);
  },
  fail() {
    this.ensure();
    const b = this._buf("fail", 0.62, function () { this._failRaw(); });
    if (b) return this._playBuf(b);
    this._failRaw();
  },
  _failRaw() {
    this.noise(0.06, 0.34, 2400);
    this.noise(0.14, 0.22, 700);
    this.noise(0.28, 0.12, 180);
    this.tone(1860, 0.07, "square", 0.09, 420);
    this.tone(980, 0.16, "triangle", 0.11, 160);
    this.tone(240, 0.22, "sine", 0.26, 70);
    this.tone(68, 0.5, "sine", 0.2, 28);
  },
  /* «дзынь» — подбор: яблоко на бревне (было: монета за попадание) и покупка */
  pick() {
    this.ensure();
    const b = this._buf("pick", 0.16, function () { this._pickRaw(); });
    if (b) return this._playBuf(b);
    this._pickRaw();
  },
  _pickRaw() { this.tone(880, 0.07, "sine", 0.07); this.tone(1320, 0.12, "triangle", 0.05); },
  /* Яблоко под ножом. Раньше тут стоял pick() — «дзынь» монеты, а потом набор
     тонов с «блупами»: любые питченные частоты в этом месте читаются как
     монетка/капля и выбиваются из дерева. Поэтому здесь только шум, и весь
     удар укладывается в ~0.12 с: кожица лопается, лезвие входит в мякоть,
     низ добавляет телу веса. Ни одного осциллятора — так это и звучит как
     кромсание, а не как награда. */
  apple() {
    this.ensure();
    const b = this._buf("apple", 0.18, function () { this._appleRaw(); });
    if (b) return this._playBuf(b);
    this._appleRaw();
  },
  _appleRaw() {
    this.noise(0.022, 0.26, 3200);        /* щелчок лопнувшей кожицы */
    this.softNoise(0.055, 0.3, 1500);     /* сухой хруст под лезвием */
    this.softNoise(0.09, 0.2, 700);       /* мокрая мякоть */
    this.softNoise(0.12, 0.1, 260, 0.01); /* низ: тело удара */
  },
  /* Прежний разлом. В плашке его больше нет — он остался звуком осколков
     болвана и кокоса (js/boss-spin.js зовёт Sfx.crack() напрямую). Не трогаем
     уровни: у этих событий свой, уже принятый характер. */
  crack() {
    this.noise(0.3, 0.3, 260);
    this.tone(52, 0.38, "sine", 0.25, 30);
    this.tone(150, 0.18, "triangle", 0.1, 48);
    this.noise(0.05, 0.1, 1000);
    this.softNoise(0.18, 0.1, 1600, 0.02);
  },
  /* ---------- разлом бревна: восемь отборных характеров ----------
     Смерть обычного бревна — самое крупное событие уровня: удар длиннее
     втыка, с весом и хвостом. Все восемь собраны по одной формуле, чтобы
     звучали одной семьёй и не били по ушам:
       1) удар (_crackHit): импульс шума с обрезом 700 Гц + узкий стук
          корпуса 560–1050 Гц — «ток» и разборчивость на динамике телефона;
       2) тело 45–90 Гц (sine с падением) — вес, «удар в грудь»;
       3) корпус 300–700 Гц (woodKnock, bandpass по шуму) — порода дерева;
       4) волокна — пачка мелких щелчков с разными задержками (рвётся,
          а не лопается одним всплеском);
       5) хвост — низкий выдох ствола / осколки / отражение.
     Верх намеренно не поднимаем: ни одного слоя выше 2.6 кГц, доля 2–6 кГц
     держится в пределах ~1 % — это и есть «не бьёт в уши» (у прежнего набора
     поверх суммы слоёв шёл шум с highpass 3–4 кГц).
     Уровни сверены замером (tools/_crack_render.js): без шины пик −7…−9 дБFS,
     после компрессора −12…−16 дБFS — клиппинга нет, а по «телефонной» полосе
     (обрезка ниже 520 Гц) разлом громче удара ножа на ~7 дБ.
     Каждый вызов чуть неровный (_rn): питч ±2–3 %, громкость ±5 %.
     В игре намертво зашит 1/5 «глубокий»; остальные характеры остались
     в коде, но недоступны. */
  logCrack() {
    this.ensure();
    const v = LOG_CRACK_FIXED;
    const buf = this._buf("crack:" + v, 0.95, function () { this._crackVariant(v); });
    if (buf) return this._playBuf(buf);
    return this._crackVariant(v);
  },
  _crackVariant(v) {
    if (v === 1) return this.crackWet();
    if (v === 2) return this.crackCrunch();
    if (v === 3) return this.crackHeavy();
    if (v === 4) return this.crackShards();
    if (v === 5) return this.crackRumble();
    if (v === 6) return this.crackRift();
    if (v === 7) return this.crackEcho();
    return this.crackDeep();
  },
  /* ГЛУБОКИЙ (0, по умолчанию): ствол расходится надвое. Вес в груди, корпус
     дерева, волокна рвутся пачкой — верх мягкий, ни одного яркого слоя.
     Стук 880 Гц — то, что слышно на динамике телефона (саб он не играет). */
  crackDeep() {
    const p = this._rn(0.02), v = this._rn(0.05);
    this.tone(62 * p, 0.34, "sine", 0.20 * v, 36);        /* тело: удар в грудь */
    this.tone(158 * p, 0.22, "triangle", 0.10 * v, 84);   /* деревянный корпус */
    this.woodKnock(0.10, 0.14 * v, 430 * p, 3.0);         /* пустотелый «тук» */
    this._crackHit(v, 880 * p, 1.6);                      /* стук: слышен на телефоне */
    this.softNoise(0.055, 0.17 * v, 2400);                /* сам разрыв, тёплый */
    this.softNoise(0.34, 0.08 * v, 430, 0.04);            /* низкий выдох ствола */
    this.softNoise(0.02, 0.07 * v, 1500, 0.05);           /* волокна по очереди */
    this.softNoise(0.018, 0.055 * v, 1200, 0.09);
    this.softNoise(0.016, 0.045 * v, 1800, 0.14);
  },
  /* ВЛАЖНЫЙ (1): сырое дерево — плотное тело, мясистый хруст, много волокон,
     верх срезан ещё ниже: звук «мокрый», а не сухой щелчок. */
  crackWet() {
    const p = this._rn(0.02), v = this._rn(0.05);
    this.tone(76 * p, 0.34, "sine", 0.20 * v, 42);
    this.tone(190 * p, 0.18, "triangle", 0.11 * v, 104);
    this.woodKnock(0.09, 0.15 * v, 520 * p, 2.6);
    this._crackHit(v, 760 * p, 1.5);                      /* мясистый стук */
    this.softNoise(0.07, 0.17 * v, 2000);
    this.softNoise(0.20, 0.08 * v, 700, 0.02);
    this.softNoise(0.022, 0.07 * v, 1100, 0.03);
    this.softNoise(0.02, 0.06 * v, 1300, 0.07);
    this.softNoise(0.018, 0.05 * v, 900, 0.11);
    this.softNoise(0.016, 0.04 * v, 1200, 0.16);
  },
  /* ХРУСТ (2): дерево ломается горстью — сухие щелчки пачкой, тело легче;
     резонанс корпуса выше, поэтому читается «сучковато». */
  crackCrunch() {
    const p = this._rn(0.025), v = this._rn(0.05);
    this.tone(70 * p, 0.30, "sine", 0.18 * v, 40);
    this.tone(168 * p, 0.16, "triangle", 0.09 * v, 92);
    this.woodKnock(0.07, 0.13 * v, 640 * p, 3.4);
    this._crackHit(v, 1000 * p, 1.8);
    this.softNoise(0.04, 0.17 * v, 1800);
    this.softNoise(0.026, 0.10 * v, 2100, 0.03);
    this.softNoise(0.03, 0.085 * v, 1600, 0.075);
    this.softNoise(0.028, 0.07 * v, 1900, 0.12);
    this.softNoise(0.024, 0.055 * v, 1400, 0.175);
    this.softNoise(0.25, 0.05 * v, 480, 0.06);
  },
  /* ТЯЖЁЛЫЙ (3): удар весом — глубокий саб, долгий низкий хвост, верх почти
     убран: самый «большой» ствол из восьми. */
  crackHeavy() {
    const p = this._rn(0.02), v = this._rn(0.05);
    this.tone(52 * p, 0.50, "sine", 0.25 * v, 30);
    this.tone(104 * p, 0.34, "triangle", 0.11 * v, 52);
    this.woodKnock(0.16, 0.13 * v, 330 * p, 2.2);
    this._crackHit(v, 620 * p, 1.4);
    this.softNoise(0.08, 0.15 * v, 1500);
    this.softNoise(0.50, 0.09 * v, 320, 0.05);
    this.softNoise(0.03, 0.05 * v, 900, 0.10);
  },
  /* ЩЕПКИ (4): осколки летят — тёплый разрыв и мелкие щелчки в хвосте.
     Верх поднят только количеством слоёв, не громкостью: без «дзыня». */
  crackShards() {
    const p = this._rn(0.025), v = this._rn(0.05);
    this.tone(66 * p, 0.32, "sine", 0.18 * v, 38);
    this.tone(210 * p, 0.16, "triangle", 0.09 * v, 120);
    this.woodKnock(0.08, 0.13 * v, 700 * p, 3.0);
    this._crackHit(v, 1050 * p, 1.8);
    this.softNoise(0.045, 0.16 * v, 2600);
    this.toneAt(520 * p, 0.09, "sine", 0.035 * v, 380, 0.06);
    this.toneAt(680 * p, 0.07, "sine", 0.026 * v, 470, 0.12);
    this.softNoise(0.03, 0.055 * v, 1600, 0.09);
    this.softNoise(0.025, 0.045 * v, 1400, 0.16);
    this.softNoise(0.022, 0.035 * v, 1800, 0.22);
  },
  /* ГРОХОТ (5): обвал — самый длинный хвост, гул уходит в землю. Верх срезан
     сильнее всех: это «большой» разлом, а не треск. */
  crackRumble() {
    const p = this._rn(0.02), v = this._rn(0.05);
    this.tone(46 * p, 0.60, "sine", 0.24 * v, 26);
    this.tone(92 * p, 0.50, "triangle", 0.12 * v, 46);
    this.woodKnock(0.20, 0.12 * v, 300 * p, 1.8);
    this._crackHit(v, 560 * p, 1.2);
    this.softNoise(0.09, 0.14 * v, 1300);
    this.softNoise(0.60, 0.09 * v, 400, 0.02);
    this.toneAt(180 * p, 0.30, "triangle", 0.045 * v, 90, 0.12);
    this.softNoise(0.05, 0.05 * v, 1000, 0.18);
  },
  /* ТРЕЩИНА (6): разлом ползёт по стволу — волокна лопаются по очереди,
     от сухого щелчка до низкого выдоха; самый длинный «сюжет» из восьми. */
  crackRift() {
    const p = this._rn(0.025), v = this._rn(0.05);
    this.tone(60 * p, 0.45, "sine", 0.17 * v, 34);
    this.tone(140 * p, 0.28, "triangle", 0.08 * v, 70);
    this.woodKnock(0.10, 0.13 * v, 480 * p, 2.8);
    this._crackHit(v, 900 * p, 1.6);
    this.softNoise(0.05, 0.16 * v, 2200);
    this.softNoise(0.03, 0.08 * v, 1800, 0.06);
    this.softNoise(0.03, 0.07 * v, 1500, 0.13);
    this.softNoise(0.035, 0.06 * v, 1700, 0.21);
    this.softNoise(0.03, 0.05 * v, 1400, 0.30);
    this.softNoise(0.03, 0.04 * v, 1200, 0.40);
    this.softNoise(0.30, 0.05 * v, 380, 0.10);
  },
  /* ЭХО (7): разлом в лесу — тело сухое, а хвост дважды возвращается. */
  crackEcho() {
    const p = this._rn(0.02), v = this._rn(0.05);
    this.tone(62 * p, 0.40, "sine", 0.19 * v, 36);
    this.tone(156 * p, 0.20, "triangle", 0.09 * v, 78);
    this.woodKnock(0.10, 0.13 * v, 460 * p, 2.8);
    this._crackHit(v, 820 * p, 1.5);
    this.softNoise(0.05, 0.15 * v, 2300);
    this.softNoise(0.14, 0.06 * v, 700, 0.16);
    this.softNoise(0.18, 0.04 * v, 600, 0.32);
    this.toneAt(120 * p, 0.22, "triangle", 0.04 * v, 62, 0.17);
  },
  husk() {
    this.noise(0.07, 0.22, 480);
    this.noise(0.18, 0.12, 150);
    this.tone(128, 0.11, "triangle", 0.08, 62);
    this.tone(54, 0.22, "sine", 0.18, 32);
  },
  split() {
    this.noise(0.045, 0.18, 1200);
    this.noise(0.16, 0.2, 260);
    this.tone(240, 0.08, "triangle", 0.11, 100);
    this.tone(96, 0.22, "sine", 0.22, 44);
    this.tone(46, 0.16, "sine", 0.1, 28);
  },
  tick() {
    this.noise(0.028, 0.07, 640);
    this.tone(168, 0.04, "triangle", 0.045, 84);
  },
  /* Выбор ножа в книге: мягкий «тсок» — короткий сухой щелчок и низкий
     деревянный призвук, без монетного «дзыня» (тот остался наградой). */
  select() {
    this.noise(0.014, 0.05, 900);
    this.softNoise(0.03, 0.055, 700);
    this.tone(420, 0.045, "sine", 0.045, 300);
    this.tone(190, 0.07, "triangle", 0.03, 150);
  },
  /* Пройденное место в таблице лидеров: один звонкий «пинг» на строку.
     Питч идёт по пентатонике вверх и упирается в две октавы — длинный подъём
     звучит как лестница, а не как сирена. На разгоне чуть тише, чтобы серия
     не забивала удар посадки. */
  lbPass(step, gap) {
    this.ensure();
    const pent = [0, 2, 4, 7, 9];
    const i = Math.max(0, step | 0);
    const semi = pent[i % 5] + Math.min(24, 12 * Math.floor(i / 5));
    const f = 880 * Math.pow(2, semi / 12);
    const v = gap && gap < 90 ? 0.042 : 0.06;
    this.tone(f, 0.085, "sine", v);
    this.toneAt(f * 2, 0.045, "triangle", v * 0.3, null, 0.006);
  },
  /* бревно садится на тормоз: глухой деревянный стук и шорох волокон. По нему
     слышно, что вращение закончилось само, а не оборвалось на полпути */
  settle() {
    this.ensure();
    const b = this._buf("settle", 0.24, function () { this._settleRaw(); });
    if (b) return this._playBuf(b);
    this._settleRaw();
  },
  _settleRaw() {
    this.noise(0.055, 0.1, 720);
    this.noise(0.15, 0.055, 230);
    this.tone(104, 0.17, "sine", 0.1, 62);
    this.tone(214, 0.07, "triangle", 0.035, 148);
  },
  /* бревно срывается в новое вращение: скрип, тон ползёт в сторону вращения
     (вверх — по часовой, вниз — против). Слышно, что сейчас поедет назад */
  creak(dir) {
    this.ensure();
    const up = (dir || 1) > 0;
    const b = this._buf(up ? "creakUp" : "creakDown", 0.32, function () { this._creakRaw(up); });
    if (b) return this._playBuf(b);
    this._creakRaw(up);
  },
  _creakRaw(up) {
    this.noise(0.17, 0.055, 520);
    this.tone(up ? 88 : 124, 0.22, "triangle", 0.05, up ? 176 : 68);
    this.tone(up ? 176 : 248, 0.09, "sine", 0.018, up ? 300 : 150);
  },
  whoosh() {
    this.ensure();
    const b = this._buf("whoosh", 0.32, function () { this._whooshRaw(); });
    if (b) return this._playBuf(b);
    this._whooshRaw();
  },
  _whooshRaw() {
    this.noise(0.26, 0.16, 420);
    this.tone(280, 0.2, "sine", 0.05, 90);
    this.tone(140, 0.16, "triangle", 0.04, 60);
  },
  /* Накат перед штампом редкости: длинный райзер — фильтрованный шум и тон ползут
     вверх, снизу подпирает саб, сверху дрожит второй голос. Чем выше ступень, тем
     длиннее и злее накат: по нему слышно, что слово вот-вот впечатается. */
  stingCharge(level) {
    this.ensure();
    const lvl = level | 0;
    const dur = 0.62 + lvl * 0.16;
    this.noise(dur, 0.035 + lvl * 0.02, 260 + lvl * 130);
    this.noise(dur * 0.7, 0.02 + lvl * 0.015, 1200 + lvl * 400);
    this.tone(140 + lvl * 30, dur, "sine", 0.045 + lvl * 0.018, 520 + lvl * 360);
    this.tone(280 + lvl * 60, dur * 0.85, "triangle", 0.028 + lvl * 0.012, 900 + lvl * 420);
    if (lvl >= 2) this.tone(70, dur, "sine", 0.05 + lvl * 0.012, 150 + lvl * 40);
  },
  bossHit() {
    this.ensure();
    this.noise(0.05, 0.26, 1700);
    this.noise(0.24, 0.18, 160);
    this.tone(64, 0.46, "sine", 0.32, 30);
    this.tone(168, 0.18, "triangle", 0.12, 54);
    this.tone(1240, 0.16, "triangle", 0.09, 480);
    this.tone(1860, 0.09, "sine", 0.05, 820);
  },
  /* Замок клинка свиты (js/boss-sting.js: stingGuardLock): короткий
     металлический «ш-шинг». Номер клинка чуть понижает строй — корона
     встаёт по очереди, и на слух это слышно. У обычного босса молчит. */
  stingGuard(level, i) {
    this.ensure();
    const lvl = level | 0;
    if (lvl <= 0) return;
    const k = (i | 0) % 6;
    const base = 1500 + lvl * 190 - k * 85;
    this.noise(0.05, 0.06 + lvl * 0.012, 2500);
    this.tone(base, 0.16, "triangle", 0.045 + lvl * 0.008, base * 0.55);
    this.tone(base * 1.5, 0.1, "sine", 0.022 + lvl * 0.004, base * 0.85);
  },
  /* Штамп редкости, как в Knife Hit: глухой удар, у высоких редкостей сверху вспышка.
     Теперь это полноценный эпический удар — низкий саб, треск металла и восходящий
     аккорд по ступени; чем выше редкость, тем ниже, дольше и богаче. */
  rarity(tier) {
    this.ensure();
    this.noise(0.04, 0.22, 220);
    const lvl = tier === "secret" ? 3 : tier === "legend" ? 2 : tier === "rare" ? 1 : 0;
    /* корпус удара: тем ниже и длиннее, чем выше ступень */
    this.noise(0.28 + lvl * 0.06, 0.13 + lvl * 0.035, 120);
    this.tone(70 - lvl * 4, 0.46 + lvl * 0.09, "sine", 0.38 + lvl * 0.04, 32 - lvl * 2);
    this.tone(140, 0.18 + lvl * 0.03, "triangle", 0.11 + lvl * 0.02, 58);
    if (lvl >= 1) {
      this.noise(0.03, 0.16, 2600);
      this.tone(1240, 0.13, "triangle", 0.05, 620);
      this.tone(1860, 0.08, "sine", 0.035, 900);
    }
    if (lvl === 1) {
      this.tone(523, 0.18, "triangle", 0.06, 880);
      this.tone(784, 0.22, "sine", 0.045, 1046);
    } else if (lvl === 2) {
      this.tone(440, 0.26, "triangle", 0.08, 880);
      this.tone(659, 0.34, "sine", 0.06, 1046);
      this.tone(988, 0.22, "sine", 0.04, 1568);
    } else if (lvl === 3) {
      this.tone(392, 0.32, "triangle", 0.09, 784);
      this.tone(587, 0.4, "sine", 0.065, 1174);
      this.tone(988, 0.3, "sine", 0.05, 1568);
      this.tone(1318, 0.22, "sine", 0.035, 1976);
    }
  },
  /* Эпическая подложка под штампом: глубокий саб и раскат, поверх — «вспышка духовых».
     Играет только у редких ступеней, поэтому обычный босс звучит как раньше. */
  stingBoom(level) {
    this.ensure();
    const lvl = level | 0;
    if (lvl <= 0) return;
    this.noise(0.5 + lvl * 0.08, 0.14 + lvl * 0.03, 90);
    this.tone(46, 0.72 + lvl * 0.08, "sine", 0.32 + lvl * 0.04, 22);
    this.tone(92, 0.5, "triangle", 0.1, 38);
    this.tone(184, 0.4, "sine", 0.05, 70);
  },
  /* ---------- победа над боссом ----------
     whoosh — нож валится сверху; land — остриё входит в пустоту на месте удара;
     fanfare — в момент, когда впечатывается слово. Чем выше ступень редкости,
     тем ниже и дольше удар и ярче отклик сверху: тайную победу слышно дальше всех. */
  victoryWhoosh(level) {
    this.ensure();
    const lvl = level | 0;
    /* тише: не должен затирать материал смерти босса */
    this.noise(0.28 + lvl * 0.06, 0.06, 520 + lvl * 160);
    this.tone(520 + lvl * 70, 0.3 + lvl * 0.08, "sine", 0.028, 88);
  },
  victoryLand(level) {
    this.ensure();
    const lvl = level | 0;
    this.noise(0.05, 0.2, 1600);
    this.noise(0.26, 0.14, 150);
    this.tone(58, 0.46, "sine", 0.24, 26);
    this.tone(150, 0.18, "triangle", 0.08, 48);
    if (lvl >= 1) this.tone(1240 + lvl * 60, 0.12, "triangle", 0.045, 520);
  },
  /* Клинок свиты вошёл в землю (js/boss-victory.js: victoryStabImpact):
     короткий глухой удар и стальной отклик. Номер клинка чуть понижает строй,
     поэтому залп читается как очередь. У обычного босса молчит. */
  victoryStab(level, i) {
    this.ensure();
    const lvl = level | 0;
    if (lvl <= 0) return;
    const k = 1 - Math.min(0.4, (i | 0) * 0.09);
    this.noise(0.04, 0.1 * k, 1500);
    this.noise(0.15, 0.07 * k, 190);
    this.tone(96 - (i | 0) * 6, 0.22, "sine", 0.11 * k, 48);
    this.tone(1180 + lvl * 70, 0.1, "triangle", 0.028 * k, 470);
  },
  victoryFanfare(tier) {
    this.ensure();
    if (tier === "secret") {
      this.tone(392, 0.44, "triangle", 0.09, 784);
      this.tone(587, 0.52, "sine", 0.06, 1174);
      this.tone(988, 0.36, "sine", 0.04, 1568);
    } else if (tier === "legend") {
      this.tone(440, 0.38, "triangle", 0.08, 880);
      this.tone(659, 0.46, "sine", 0.05, 1046);
    } else if (tier === "rare") {
      this.tone(523, 0.3, "triangle", 0.07, 880);
    } else {
      this.tone(330, 0.24, "triangle", 0.05, 660);
    }
  },

  /* Новый рекорд (js/hud.js: revealRecordMark): справа сверху зажигается одно
     крупное число с подписью «НОВЫЙ РЕКОРД». Низкий удар, восходящий аккорд и
     блеск сверху — звук ровно один раз, в момент появления числа; на каждом
     следующем очке молчим, чтобы не грохотало всю игру. */
  recordReveal() {
    this.ensure();
    this.noise(0.06, 0.16, 2600);
    this.noise(0.55, 0.16, 110);
    this.tone(52, 0.8, "sine", 0.3, 24);
    this.tone(104, 0.5, "triangle", 0.12, 46);
    this.tone(392, 0.5, "triangle", 0.09, 784);
    this.toneAt(587, 0.55, "sine", 0.07, 1174, 0.1);
    this.toneAt(988, 0.5, "sine", 0.05, 1568, 0.2);
    this.toneAt(1318, 0.34, "sine", 0.04, 1976, 0.32);
  },

  /* ---------- материал босса ----------
     У КАЖДОГО босса свой втык и своя смерть — без общих шаблонов и без
     древесного crack. Бревно зовёт stick()/crack() напрямую. */
  bossStick(id) {
    this.ensure();
    const key = "bossStick:" + id;
    const b = this._buf(key, 0.4, function () { this._bossStickRaw(id); });
    if (b) return this._playBuf(b);
    this._bossStickRaw(id);
  },
  _bossStickRaw(id) {
    switch (id) {
      case "tomato":
        /* мягкий сочный прокол: только низ и мокрый шорох, без высоких «дзынь» */
        this.softNoise(0.14, 0.2, 620);
        this.softNoise(0.2, 0.12, 280, 0.04);
        this.tone(78, 0.26, "sine", 0.22, 34);
        this.toneAt(120, 0.16, "sine", 0.08, 52, 0.04);
        this.toneAt(42, 0.22, "sine", 0.12, 24, 0.06);
        break;
      case "pumpkin":
        /* плотная кожура, внутри пустовато — глухой тыквенный стук */
        this.softNoise(0.1, 0.14, 700);
        this.tone(78, 0.24, "sine", 0.24, 38);
        this.tone(160, 0.1, "triangle", 0.06, 70);
        this.toneAt(52, 0.16, "sine", 0.08, 30, 0.06);
        break;
      case "heart":
        /* плотная влажная ткань, тяжелее помидора */
        this.softNoise(0.1, 0.18, 750);
        this.softNoise(0.16, 0.08, 280, 0.05);
        this.tone(110, 0.2, "sine", 0.22, 48);
        this.tone(55, 0.26, "sine", 0.14, 26);
        break;
      case "pizza":
        /* тесто + сыр: мягкий вход, лёгкий тягучий шорох */
        this.softNoise(0.14, 0.12, 650);
        this.softNoise(0.1, 0.06, 1400, 0.05);
        this.tone(140, 0.16, "sine", 0.14, 60);
        this.toneAt(260, 0.18, "triangle", 0.04, 90, 0.04);
        break;
      case "donut":
        /* воздушное тесто, сахарная корочка шуршит */
        this.softNoise(0.1, 0.11, 1100);
        this.noise(0.04, 0.08, 2200);
        this.tone(190, 0.12, "sine", 0.12, 80);
        this.tone(520, 0.06, "triangle", 0.035, 260);
        break;
      case "pie":
        /* корочка ломается, начинка мягкая */
        this.noise(0.035, 0.1, 1600);
        this.softNoise(0.14, 0.12, 600);
        this.tone(170, 0.12, "triangle", 0.1, 70);
        this.toneAt(80, 0.16, "sine", 0.12, 40, 0.04);
        break;
      case "candy":
        /* твёрдая глазурь — сухой щелчок */
        this.noise(0.028, 0.18, 3200);
        this.tone(1680, 0.07, "triangle", 0.08, 820);
        this.tone(640, 0.09, "sine", 0.05, 280);
        this.tone(180, 0.1, "sine", 0.06, 90);
        break;
      case "marmalade":
        /* липкая банка: вязкий чмок */
        this.softNoise(0.16, 0.18, 500);
        this.softNoise(0.12, 0.08, 220, 0.06);
        this.tone(120, 0.2, "sine", 0.14, 50);
        this.toneAt(280, 0.14, "triangle", 0.04, 100, 0.05);
        break;
      case "balloon":
        /* латекс натягивается — тонкий скрип */
        this.noise(0.1, 0.09, 1800);
        this.tone(520, 0.14, "sine", 0.05, 280);
        this.tone(300, 0.1, "triangle", 0.03, 180);
        break;
      case "tennis":
        /* упругий мяч: короткий резиновый отскок внутрь */
        this.softNoise(0.08, 0.12, 900);
        this.tone(130, 0.14, "sine", 0.2, 70);
        this.tone(340, 0.08, "triangle", 0.05, 160);
        this.toneAt(90, 0.12, "sine", 0.08, 50, 0.04);
        break;
      case "basketball":
        /* тугая кожа и пустое нутро: глубокий упругий стук, ниже теннисного */
        this.softNoise(0.09, 0.13, 760);
        this.tone(96, 0.2, "sine", 0.24, 44);
        this.tone(250, 0.09, "triangle", 0.05, 110);
        this.toneAt(150, 0.14, "sine", 0.06, 62, 0.03);
        break;
      case "plate":
        /* фарфор: тонкий стеклянистый щелчок и звон кромки */
        this.noise(0.02, 0.14, 3400);
        this.tone(1860, 0.12, "triangle", 0.08, 820);
        this.tone(940, 0.16, "sine", 0.06, 420);
        this.tone(260, 0.1, "sine", 0.07, 110);
        break;
      case "tape":
        /* липкая плёнка: глухой вход и короткий чмок клея */
        this.softNoise(0.1, 0.14, 620);
        this.noise(0.05, 0.07, 1300);
        this.tone(120, 0.18, "sine", 0.18, 58);
        this.tone(320, 0.07, "triangle", 0.04, 150);
        break;
      case "yarn":
        /* шерсть: мягкий глухой вход, нити пружинят под клинком */
        this.softNoise(0.16, 0.2, 420);
        this.softNoise(0.1, 0.1, 180, 0.05);
        this.tone(96, 0.22, "sine", 0.14, 44);
        break;
      case "tire":
        /* толстая резина — глухой прокол */
        this.softNoise(0.1, 0.16, 450);
        this.tone(64, 0.24, "sine", 0.26, 32);
        this.tone(150, 0.1, "triangle", 0.05, 70);
        break;
      case "lifebelt":
        /* пенопласт/ткань — сухой мягкий шорох */
        this.softNoise(0.12, 0.12, 1400);
        this.noise(0.05, 0.07, 900);
        this.tone(210, 0.1, "sine", 0.08, 100);
        break;
      case "egg":
        /* тонкая скорлупа — сухой хрупкий тик */
        this.noise(0.03, 0.16, 2400);
        this.tone(780, 0.07, "triangle", 0.09, 320);
        this.tone(220, 0.1, "sine", 0.08, 100);
        break;
      case "coconut":
        /* белая мякоть: мягкий раскол волокна */
        this.softNoise(0.1, 0.14, 800);
        this.noise(0.04, 0.1, 1400);
        this.tone(150, 0.12, "triangle", 0.1, 70);
        this.tone(70, 0.18, "sine", 0.16, 34);
        break;
      case "pepsi":
        /* алюминий — тонкий звон банки */
        this.noise(0.03, 0.14, 2600);
        this.tone(980, 0.1, "triangle", 0.08, 480);
        this.tone(420, 0.12, "sine", 0.06, 180);
        this.tone(140, 0.12, "sine", 0.1, 70);
        break;
      case "coin":
        /* золотой пинг */
        this.noise(0.022, 0.12, 2800);
        this.tone(1760, 0.18, "triangle", 0.1, 980);
        this.tone(1170, 0.12, "sine", 0.05, 700);
        this.tone(260, 0.1, "sine", 0.06, 120);
        break;
      case "valve":
        /* тяжёлый чугун — короткий металлический удар */
        this.noise(0.03, 0.18, 2000);
        this.tone(420, 0.14, "triangle", 0.12, 180);
        this.tone(180, 0.18, "sine", 0.14, 80);
        this.tone(90, 0.2, "sine", 0.1, 45);
        break;
      case "aegis":
        /* щит: жёсткий железный щелчок */
        this.noise(0.025, 0.16, 2800);
        this.tone(1560, 0.18, "triangle", 0.1, 900);
        this.tone(780, 0.12, "sine", 0.06, 360);
        this.tone(140, 0.16, "sine", 0.12, 70);
        break;
      case "saw":
        /* стальной диск — скрежет + удар */
        this.noise(0.05, 0.14, 2400);
        this.tone(1100, 0.1, "sawtooth", 0.04, 420);
        this.tone(280, 0.12, "triangle", 0.08, 120);
        this.tone(100, 0.14, "sine", 0.1, 50);
        break;
      case "fan":
        /* пластик корпуса + металл решётки */
        this.noise(0.035, 0.14, 1800);
        this.tone(640, 0.1, "triangle", 0.07, 280);
        this.tone(200, 0.12, "sine", 0.1, 90);
        this.tone(80, 0.14, "sine", 0.08, 40);
        break;
      case "cog":
        /* зубчатый металл — сухой клик шестерни */
        this.noise(0.025, 0.14, 2200);
        this.tone(740, 0.07, "square", 0.05, 320);
        this.tone(260, 0.1, "triangle", 0.08, 110);
        this.tone(110, 0.12, "sine", 0.08, 55);
        break;
      case "dummy":
        /* солома и ткань чучела */
        this.softNoise(0.12, 0.14, 1200);
        this.noise(0.05, 0.08, 700);
        this.tone(140, 0.14, "triangle", 0.1, 60);
        this.tone(55, 0.18, "sine", 0.12, 28);
        break;
      case "helm":
        /* мокрое дерево штурвала */
        this.softNoise(0.1, 0.1, 800);
        this.tone(170, 0.14, "sine", 0.12, 75);
        this.toneAt(480, 0.18, "sine", 0.035, 160, 0.03);
        this.tone(70, 0.16, "sine", 0.1, 36);
        break;
      case "target":
        /* пробка/картон мишени */
        this.softNoise(0.09, 0.13, 1000);
        this.tone(200, 0.1, "triangle", 0.11, 85);
        this.tone(85, 0.14, "sine", 0.12, 42);
        break;
      case "compass":
        /* латунь и стекло */
        this.noise(0.028, 0.12, 2000);
        this.tone(1120, 0.12, "triangle", 0.07, 560);
        this.tone(380, 0.1, "sine", 0.06, 160);
        this.tone(140, 0.1, "sine", 0.07, 70);
        break;
      case "camera":
        /* пластик + стекло объектива */
        this.noise(0.03, 0.13, 2600);
        this.tone(1280, 0.09, "sine", 0.06, 520);
        this.tone(360, 0.1, "triangle", 0.05, 140);
        this.tone(120, 0.12, "sine", 0.08, 60);
        break;
      case "ball":
        /* бильярдный шар — твёрдый гладкий удар */
        this.noise(0.025, 0.1, 1400);
        this.tone(380, 0.1, "sine", 0.1, 160);
        this.tone(95, 0.18, "sine", 0.16, 48);
        break;
      case "reverse":
        /* стальная шайба: короткий щелчок и низкий толчок — слышно, как диск
           развернулся */
        this.noise(0.028, 0.16, 2600);
        this.tone(560, 0.09, "triangle", 0.09, 320);
        this.tone(150, 0.16, "sine", 0.1, 64);
        break;
      default:
        /* неизвестный босс — прежний деревянный удар, а не выбор игрока:
           настройка звука касается только самого бревна */
        this.stickClassic();
    }
  },

  /* длинная смерть: ~0.9–1.2 с, громко, с хвостом — иначе победа её съедает */
  bossCrack(id) {
    this.ensure();
    const key = "bossCrack:" + id;
    const b = this._buf(key, 1.6, function () { this._bossCrackRaw(id); });
    if (b) return this._playBuf(b);
    this._bossCrackRaw(id);
  },
  _bossCrackRaw(id) {
    switch (id) {
      case "tomato":
        this.softNoise(0.16, 0.42, 720);
        this.softNoise(0.7, 0.32, 340);
        this.softNoise(0.9, 0.18, 160, 0.08);
        this.softNoise(0.5, 0.1, 90, 0.25);
        this.tone(150, 0.36, "sine", 0.2, 42);
        this.tone(52, 0.95, "sine", 0.34, 20);
        this.toneAt(95, 0.5, "sine", 0.12, 34, 0.12);
        break;
      case "pumpkin":
        this.softNoise(0.14, 0.34, 780);
        this.softNoise(0.75, 0.26, 240);
        this.softNoise(0.55, 0.12, 110, 0.2);
        this.tone(70, 0.85, "sine", 0.34, 28);
        this.tone(170, 0.28, "triangle", 0.1, 55);
        this.toneAt(44, 0.55, "sine", 0.14, 20, 0.15);
        break;
      case "heart":
        this.softNoise(0.14, 0.38, 680);
        this.softNoise(0.8, 0.28, 180);
        this.softNoise(0.55, 0.12, 100, 0.22);
        this.tone(90, 0.85, "sine", 0.34, 32);
        this.tone(46, 1.05, "sine", 0.26, 20);
        break;
      case "pizza":
        this.softNoise(0.16, 0.28, 900);
        this.softNoise(0.7, 0.22, 300);
        this.softNoise(0.45, 0.1, 140, 0.2);
        this.tone(170, 0.45, "triangle", 0.14, 55);
        this.toneAt(280, 0.4, "sine", 0.06, 80, 0.1);
        this.tone(65, 0.8, "sine", 0.22, 28);
        break;
      case "donut":
        this.softNoise(0.14, 0.28, 1200);
        this.noise(0.08, 0.16, 2000);
        this.softNoise(0.65, 0.18, 340);
        this.softNoise(0.4, 0.08, 140, 0.22);
        this.tone(250, 0.35, "triangle", 0.1, 75);
        this.tone(80, 0.75, "sine", 0.2, 32);
        break;
      case "pie":
        this.noise(0.06, 0.2, 1400);
        this.softNoise(0.7, 0.26, 420);
        this.softNoise(0.45, 0.12, 160, 0.18);
        this.tone(200, 0.35, "triangle", 0.12, 65);
        this.tone(60, 0.85, "sine", 0.26, 26);
        break;
      case "candy":
        this.noise(0.06, 0.34, 2800);
        this.noise(0.28, 0.18, 1100);
        this.softNoise(0.55, 0.12, 280, 0.12);
        this.tone(1760, 0.22, "triangle", 0.12, 560);
        this.tone(880, 0.35, "sine", 0.08, 300);
        this.tone(110, 0.7, "sine", 0.16, 42);
        break;
      case "marmalade":
        this.softNoise(0.18, 0.36, 520);
        this.softNoise(0.8, 0.26, 180);
        this.softNoise(0.5, 0.12, 90, 0.25);
        this.tone(130, 0.7, "sine", 0.22, 40);
        this.tone(48, 1.0, "sine", 0.28, 20);
        break;
      case "balloon":
        this.noise(0.08, 0.52, 1200);
        this.noise(0.45, 0.2, 340);
        this.softNoise(0.55, 0.1, 160, 0.12);
        this.tone(1480, 0.1, "square", 0.08, 340);
        this.tone(130, 0.7, "sine", 0.18, 42);
        break;
      case "tennis":
        this.softNoise(0.2, 0.28, 900);
        this.softNoise(0.85, 0.18, 240);
        this.softNoise(0.5, 0.1, 120, 0.25);
        this.tone(150, 0.75, "sine", 0.22, 40);
        this.toneAt(85, 0.55, "triangle", 0.08, 36, 0.12);
        break;
      case "basketball":
        /* кожа лопается с долгим выдохом воздуха из пустого мяча */
        this.softNoise(0.24, 0.3, 700);
        this.softNoise(0.9, 0.22, 200);
        this.softNoise(0.45, 0.1, 110, 0.26);
        this.tone(105, 0.8, "sine", 0.24, 36);
        this.toneAt(62, 0.6, "triangle", 0.09, 30, 0.1);
        break;
      case "plate":
        /* тарелка бьётся: сухой треск и долгий звон осколков */
        this.noise(0.05, 0.3, 3200);
        this.noise(0.3, 0.16, 1500);
        this.softNoise(0.55, 0.12, 400, 0.14);
        this.tone(1640, 0.5, "triangle", 0.1, 620);
        this.tone(880, 0.7, "sine", 0.08, 300);
        this.tone(120, 0.6, "sine", 0.14, 50);
        break;
      case "tape":
        /* лента рвётся: длинный треск плёнки и хлопок освободившегося рулона */
        this.noise(0.42, 0.34, 2400);
        this.noise(0.22, 0.16, 900);
        this.softNoise(0.6, 0.12, 320, 0.2);
        this.tone(220, 0.45, "triangle", 0.1, 90);
        this.tone(70, 0.7, "sine", 0.2, 30);
        break;
      case "yarn":
        /* клубок разматывается: нити лопаются, пряжа шуршит */
        this.noise(0.16, 0.24, 1500);
        this.softNoise(0.8, 0.3, 500);
        this.softNoise(0.5, 0.12, 220, 0.18);
        this.tone(180, 0.5, "triangle", 0.08, 70);
        this.tone(60, 0.8, "sine", 0.16, 28);
        break;
      case "tire":
        this.softNoise(0.22, 0.3, 480);
        this.softNoise(0.95, 0.2, 150);
        this.softNoise(0.55, 0.1, 80, 0.28);
        this.tone(55, 1.0, "sine", 0.3, 24);
        this.tone(130, 0.4, "triangle", 0.08, 50);
        break;
      case "lifebelt":
        this.softNoise(0.2, 0.28, 1100);
        this.softNoise(0.7, 0.18, 300);
        this.noise(0.14, 0.12, 700);
        this.softNoise(0.4, 0.08, 120, 0.22);
        this.tone(120, 0.7, "sine", 0.16, 42);
        break;
      case "egg":
        this.noise(0.07, 0.32, 2100);
        this.noise(0.28, 0.18, 850);
        this.softNoise(0.65, 0.18, 380);
        this.softNoise(0.4, 0.08, 140, 0.2);
        this.tone(860, 0.2, "triangle", 0.1, 240);
        this.tone(75, 0.8, "sine", 0.22, 30);
        break;
      case "coconut":
        this.noise(0.08, 0.3, 1300);
        this.softNoise(0.75, 0.26, 300);
        this.softNoise(0.5, 0.12, 120, 0.22);
        this.tone(80, 0.85, "sine", 0.3, 28);
        this.tone(44, 0.95, "sine", 0.2, 20);
        break;
      case "pepsi":
        this.noise(0.07, 0.3, 1900);
        this.noise(0.4, 0.18, 380);
        this.softNoise(0.55, 0.1, 140, 0.18);
        this.tone(780, 0.35, "triangle", 0.12, 220);
        this.tone(260, 0.4, "sine", 0.08, 90);
        this.tone(70, 0.85, "sine", 0.24, 28);
        break;
      case "coin":
        this.noise(0.05, 0.24, 2300);
        this.tone(1560, 0.45, "triangle", 0.14, 700);
        this.tone(1175, 0.55, "sine", 0.1, 480);
        this.tone(784, 0.45, "sine", 0.07, 320);
        this.tone(150, 0.7, "sine", 0.12, 55);
        this.softNoise(0.4, 0.08, 180, 0.2);
        break;
      case "valve":
        this.noise(0.07, 0.32, 1700);
        this.noise(0.45, 0.18, 260);
        this.softNoise(0.5, 0.1, 120, 0.2);
        this.tone(340, 0.45, "triangle", 0.16, 120);
        this.tone(130, 0.65, "sine", 0.18, 55);
        this.tone(50, 0.95, "sine", 0.26, 22);
        break;
      case "aegis":
        this.noise(0.06, 0.28, 2500);
        this.noise(0.4, 0.14, 300);
        this.tone(1280, 0.45, "triangle", 0.14, 560);
        this.tone(420, 0.55, "sine", 0.12, 140);
        this.tone(65, 0.95, "sine", 0.3, 24);
        break;
      case "saw":
        this.noise(0.08, 0.3, 2100);
        this.noise(0.35, 0.16, 850);
        this.softNoise(0.5, 0.1, 160, 0.18);
        this.tone(920, 0.35, "sawtooth", 0.06, 240);
        this.tone(190, 0.5, "triangle", 0.12, 65);
        this.tone(55, 0.9, "sine", 0.24, 24);
        break;
      case "fan":
        this.noise(0.07, 0.28, 1600);
        this.noise(0.4, 0.16, 480);
        this.softNoise(0.45, 0.08, 140, 0.2);
        this.tone(680, 0.35, "triangle", 0.1, 220);
        this.tone(150, 0.4, "sine", 0.12, 55);
        this.tone(48, 0.85, "sine", 0.2, 22);
        break;
      case "cog":
        this.noise(0.06, 0.28, 1900);
        this.noise(0.35, 0.14, 480);
        this.tone(640, 0.22, "square", 0.07, 200);
        this.toneAt(420, 0.22, "square", 0.05, 140, 0.08);
        this.toneAt(280, 0.2, "square", 0.04, 100, 0.16);
        this.tone(85, 0.8, "sine", 0.22, 32);
        break;
      case "dummy":
        this.softNoise(0.18, 0.32, 1050);
        this.softNoise(0.75, 0.22, 300);
        this.noise(0.14, 0.14, 650);
        this.softNoise(0.45, 0.1, 120, 0.22);
        this.tone(140, 0.5, "triangle", 0.14, 50);
        this.tone(48, 0.95, "sine", 0.24, 22);
        break;
      case "helm":
        this.softNoise(0.16, 0.3, 850);
        this.softNoise(0.75, 0.2, 240);
        this.tone(190, 0.4, "triangle", 0.12, 65);
        this.tone(820, 0.85, "sine", 0.12, 130);
        this.tone(100, 0.95, "sine", 0.22, 32);
        break;
      case "target":
        this.softNoise(0.16, 0.32, 950);
        this.softNoise(0.7, 0.22, 280);
        this.softNoise(0.45, 0.1, 120, 0.2);
        this.tone(210, 0.4, "triangle", 0.14, 65);
        this.tone(60, 0.9, "sine", 0.28, 24);
        break;
      case "compass":
        this.noise(0.06, 0.3, 2100);
        this.noise(0.35, 0.16, 560);
        this.softNoise(0.45, 0.08, 160, 0.18);
        this.tone(1180, 0.4, "triangle", 0.12, 380);
        this.tone(500, 0.45, "sine", 0.08, 180);
        this.tone(65, 0.85, "sine", 0.2, 26);
        break;
      case "camera":
        this.noise(0.06, 0.32, 2500);
        this.noise(0.35, 0.16, 650);
        this.softNoise(0.45, 0.08, 160, 0.18);
        this.tone(1320, 0.28, "sine", 0.1, 340);
        this.tone(300, 0.4, "triangle", 0.1, 90);
        this.tone(50, 0.85, "sine", 0.22, 22);
        break;
      case "ball":
        this.noise(0.06, 0.24, 1100);
        this.softNoise(0.7, 0.22, 280);
        this.softNoise(0.45, 0.1, 120, 0.2);
        this.tone(220, 0.45, "sine", 0.16, 70);
        this.tone(60, 0.9, "sine", 0.28, 24);
        break;
      case "reverse":
        this.noise(0.07, 0.32, 2400);
        this.noise(0.4, 0.16, 520);
        this.softNoise(0.5, 0.08, 150, 0.18);
        this.tone(900, 0.3, "triangle", 0.1, 260);
        this.tone(300, 0.4, "sine", 0.08, 90);
        this.tone(60, 0.9, "sine", 0.22, 24);
        break;
      default:
        this.crack();
    }
  }
};

/* ---------- телефон: разбудить звук заранее ----------
   Первое касание будит AudioContext до обработчика сцены (слушатель на window
   в фазе перехвата), поэтому к первому броску он уже running, а шина и шум
   собраны. Это убирает «первый удар без звука» и стартовую задержку, которую
   на телефоне даёт асинхронный resume. На ПК поведение не меняем. */
(function bindSfxWarmup() {
  if (typeof window === "undefined") return;
  function warm() {
    if (!phone) return;
    try { Sfx.unlock(); } catch (err) {}
  }
  function onVisible() {
    if (!document.hidden) warm();
  }
  const opts = { capture: true, passive: true };
  window.addEventListener("pointerdown", warm, opts);
  window.addEventListener("touchstart", warm, opts);
  window.addEventListener("mousedown", warm, opts);
  window.addEventListener("keydown", warm, opts);
  window.addEventListener("focus", warm, true);
  document.addEventListener("visibilitychange", onVisible);
})();

