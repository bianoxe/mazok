/* ---------- коллекция ножей ----------
   Вкладка «Ножи» открывает один экран-коллекцию вместо книги-разворота.
   Сверху — название, прогресс и крупный кошелёк яблок. Ниже — прокручиваемая
   лента секций, а внизу вывеска с двумя большими кнопками: разблокировка
   случайного ножа за яблоки и рандомизатор ножа в руке. Страниц, стрелок,
   точек, подписей «КОЛЛЕКЦИЯ НОЖЕЙ» и прочего больше нет: коллекция
   читается сверху вниз, как обычный список.

   VIP-коллекции сохраняют свой прежний вид: та же художественная рамка, тот же
   ряд из восьми ножей. Меняется только окружение — рамка живёт внутри общей
   ленты, а не на отдельном развороте книги. */
const BOOK_ORDER = ["none", "junk", "common", "rarelegend", "secret", "vip", "okean", "poker", "carnival", "motosport", "medieval", "konfety", "west", "monsters", "demons", "space", "memes"];
/* Коллекционные рамки: у каждой своя картинка 1604×980/981. Путь пишем
   относительно css/style.css: браузер раскрывает url() из переменной
   относительно того файла стилей, где переменная используется. */
const BOOK_FRAMES = {
  okean: "../images/knifes/VIP/океан/Океанская рамка с ракушками и кораллами.png",
  poker: "../images/knifes/VIP/покер/Декоративная покерная рамка с картами.png",
  carnival: "../images/knifes/VIP/карнавал/Kleurrijk carnavalsmasker met feestelijke omlijsting.png",
  motosport: "../images/knifes/VIP/мотоспорт/Cadre de course colore sur fond blanc.png",
  monsters: "../images/knifes/VIP/монстры/Туманный фиолетовый замок и монстры.png",
  medieval: "../images/knifes/VIP/средневековье/Средневековая геральдическая рамка с замками.png",
  konfety: "../images/knifes/VIP/конфеты/Розовый пончик с золотыми завитками.png",
  west: "../images/knifes/VIP/дикий запад/Дикий Запад_ закат у салуна.png",
  demons: "../images/knifes/VIP/демоны/Огненная демоническая рамка над адским пейзажем.png",
  space: "../images/knifes/VIP/космос/Золотая рамка в космической галактике.png",
  memes: "../images/knifes/VIP/мемные/Яркая мем-рамка с коронованным смайлом.png"
};
/* Цена набора коллекции: одна на всю рамку, в алмазах. Реальной оплаты в игре
   нет — как и у наборов валюты в магазине, кнопка сразу открывает все ножи. */
const KNIFE_SET_PRICE = 49;

/* Рамки наборов: вместо того чтобы держать в памяти восемь PNG 1604×980
   (это десятки мегабайт декодированных пикселей), один раз уменьшаем каждую до
   маленького canvas и отпускаем полноразмерную картинку. В книге этот canvas
   и показывается — прокрутка не декодирует ничего. */
const bookFrameCv = Object.create(null);     // url -> готовый canvas рамки
const bookFrameMask = Object.create(null);   // url -> data-url маски формы рамки
const bookFrameWaiters = Object.create(null); // url -> [.bk-sea-frame]
(function bookPreloadFrames() {
  /* Размер — под экран: на телефоне рамка показывается почти во всю ширину,
     поэтому 512 px там мылили бы. Один canvas на рамку, полноразмерный PNG
     после отрисовки отпускаем. */
  const iw = window.innerWidth || 1280;
  /* На телефоне рамка не больше 768 px: она всё равно отображается ~350 CSS px.
     На слабом (2 ГБ/4 ядра) — 512 px. Это в 2–3.5 раза меньше текстуры на
     каждую витрину, а внешний вид на экране почти не страдает. */
  const fw = window.GAME_LOW_END ? 512 : (iw < 900 ? 768 : Math.min(1024, Math.max(640, Math.round((iw - 48) * Math.min(2, window.devicePixelRatio || 1)))));
  const fh = Math.round(fw * 980 / 1604);
  const urls = [];
  for (const key of Object.keys(BOOK_FRAMES)) {
    const url = BOOK_FRAMES[key].replace(/^\.\.\//, "");
    if (!bookFrameCv[url] && urls.indexOf(url) < 0) urls.push(url);
  }
  /* По одной: одновременно декодированные 8 PNG 1604×980 — это десятки
     мегабайт пиковой памяти на слабом телефоне. */
  let i = 0;
  const next = function () {
    if (i >= urls.length) return;
    /* В бою не декодируем рамки: это работа на главном потоке. Дождёмся меню. */
    if (window.gameBooted && typeof state !== "undefined" && state !== "menu") {
      setTimeout(next, 800);
      return;
    }
    const url = urls[i++];
    const img = new Image();
    img.decoding = "async";
    const process = function () {
      try {
        const c = document.createElement("canvas");
        c.width = fw;
        c.height = fh;
        c.className = "bk-sea-frame-art";
        const g = c.getContext("2d");
        g.imageSmoothingEnabled = true;
        g.imageSmoothingQuality = "low";
        g.drawImage(img, 0, 0, fw, fh);
        bookFrameCv[url] = c;
        /* Маска формы рамки — маленькая копия её альфы. По ней обрезается
           бегущий блик, поэтому свет идёт по рисунку рамки (у каждого набора
           свой силуэт), а не по прямоугольнику. 320 px хватает: блик мягкий. */
        try {
          const m = document.createElement("canvas");
          m.width = 320;
          m.height = Math.round(320 * 980 / 1604);
          m.getContext("2d").drawImage(c, 0, 0, m.width, m.height);
          bookFrameMask[url] = m.toDataURL("image/png");
        } catch (err) {}
        const waiters = bookFrameWaiters[url];
        if (waiters) {
          for (let k = 0; k < waiters.length; k++) bookAttachFrame(waiters[k]);
          delete bookFrameWaiters[url];
        }
      } catch (err) {}
      img.onload = null;
      img.onerror = null;
      img.removeAttribute("src");
      setTimeout(next, 60);
    };
    img.onload = function () {
      /* Декодирование/уменьшение PNG — работа в кадре. В бою откладываем до
         меню, чтобы не ронять FPS. */
      if (!bookIsOpen && window.gameBooted && typeof state !== "undefined" && state !== "menu") {
        setTimeout(process, 800);
        return;
      }
      process();
    };
    img.onerror = function () {
      /* Снимаем оба обработчика: иначе очистка src ниже сама вызывает error
         снова и обработчик зацикливается на сотни событий в секунду. */
      img.onload = null;
      img.onerror = null;
      img.removeAttribute("src");
      setTimeout(next, 60);
    };
    img.src = url;
  };
  let started = false;
  const start = function () {
    if (started) return;
    /* Загрузку/декодирование рамок начинаем только после заставки: иначе
       восемь PNG конкурируют с buildAssets и удлиняют загрузку. */
    if (!window.gameBooted) { setTimeout(start, 300); return; }
    started = true;
    next();
  };
  setTimeout(start, 250);
})();

/* Ставим готовый canvas внутрь рамки набора. При пересборке книги тот же
   canvas просто переезжает в новый DOM — второй копии не появляется. */
function bookAttachFrame(el) {
  if (!el || !el.dataset || !el.dataset.frame) return;
  if (el.dataset.frameReady === "1") return;
  const url = el.dataset.frame.replace(/^\.\.\//, "");
  const cv = bookFrameCv[url];
  if (!cv) {
    let w = bookFrameWaiters[url];
    if (!w) w = bookFrameWaiters[url] = [];
    if (w.indexOf(el) < 0) w.push(el);
    return;
  }
  el.dataset.frameReady = "1";
  if (bookFrameMask[url]) el.style.setProperty("--frame-mask", "url(\"" + bookFrameMask[url] + "\")");
  if (cv.parentElement === el) return;
  try { el.insertBefore(cv, el.firstChild); } catch (err) {}
}

/* Подгоняем холст рамки под её НАСТОЯЩИЙ размер на экране (в пикселях
   устройства). Рамка заранее рисуется «на глазок» под ширину окна, а на ПК
   витрина занимает половину строки — холст 1024 px показывался в 440: это
   лишняя текстура, лишняя выборка при растре и мыло на экране. Пересчёт —
   восемь drawImage, один раз при открытии и на ресайз. */
function bookFitFrames() {
  if (!bookScroll) return;
  const dprEff = Math.min(2.5, window.devicePixelRatio || 1);
  const sc = (typeof stageScale === "number" && stageScale > 0) ? stageScale : 1;
  const els = bookScroll.querySelectorAll(".bk-sea-frame");
  for (let i = 0; i < els.length; i++) {
    const el = els[i];
    const cv = el.firstChild;
    if (!cv || cv.tagName !== "CANVAS") continue;
    const cssW = el.clientWidth || 0;
    if (!cssW) continue;
    let w = Math.round(cssW * sc * dprEff);
    if (!(w > 0)) continue;
    w = Math.min(1024, w);
    if (window.GAME_LOW_END) w = Math.min(w, 512);
    else if ((window.innerWidth || 1280) < 900) w = Math.min(w, 900);
    if (Math.abs(cv.width - w) < Math.max(40, w * 0.12)) continue;
    const h = Math.round(w * 980 / 1604);
    /* Источник — уже уменьшенная копия: сохраняем её, пока меняем размер. */
    const tmp = document.createElement("canvas");
    tmp.width = cv.width;
    tmp.height = cv.height;
    try { tmp.getContext("2d").drawImage(cv, 0, 0); } catch (err) { continue; }
    cv.width = w;
    cv.height = h;
    const g = cv.getContext("2d");
    if (!g) continue;
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = "low";
    try { g.drawImage(tmp, 0, 0, w, h); } catch (err) {}
  }
}

const bookOverlay = document.getElementById("book");
const bookStage = document.getElementById("stage");
const bookEl = document.getElementById("bookEl");
const bookScroll = document.getElementById("bookScroll");
const bookCloseBtn = document.getElementById("bookClose");
const bookRndEl = document.getElementById("bookRnd");
const bookRndFlagEl = document.getElementById("bookRndFlag");
const bookUnlockEl = document.getElementById("bookUnlock");
const bookUnlockPriceEl = document.getElementById("bookUnlockPrice");
const bookActEl = document.getElementById("bookAct");
const bookProgressEl = document.getElementById("bookProgress");
const bookEmptyEl = document.getElementById("bookEmpty");
const bookTourEl = document.getElementById("bookTour");
const bookTourPctEl = document.getElementById("bookTourPct");
const knivesArrowEl = document.getElementById("knivesArrow");
const itemsBtnEl = document.getElementById("itemsBtn");
const menuTourDimEl = document.getElementById("menuTourDim");
const bookTourArrowEl = document.getElementById("bookTourArrow");
const menuDockEl = document.querySelector("#menu .menu-dock");

const KB_CLICKED_KEY = "bh_kb_clicked";
const KB_TOUR_KEY = "bh_kb_tour_done";

var bookIsOpen = false;
let bookTour = false;
let kbClickedMem = false;
let kbTourDoneMem = false;
let bookSel = "";
let bookStats = { all: 0, own: 0, lock: 0 };
let bookSections = [];
let bookReturnFocus = null;

function bookEsc(s) {
  return String(s).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
  });
}

/* ---------- обучение коллекции ----------
   После 3 забегов игроку, который ни разу не открывал «Ножи», показываем
   стрелку. Клик по кнопке открывает коллекцию в режиме обучения: крестик
   скрыт, закрыть нельзя, пока лента не прокручена до конца. */
function kbGet(key) {
  try { return localStorage.getItem(key); } catch (err) { return null; }
}
function kbSet(key, val) {
  try { localStorage.setItem(key, val); } catch (err) {}
}
function knifeBookClickedBefore() {
  if (kbClickedMem) return true;
  return kbGet(KB_CLICKED_KEY) === "1";
}
function knifeBookTourSeen() {
  if (kbTourDoneMem) return true;
  return kbGet(KB_TOUR_KEY) === "1";
}
function knifeBookTourPending() {
  if (knifeBookTourSeen() || knifeBookClickedBefore()) return false;
  const runs = typeof stats !== "undefined" ? (stats.runs | 0) : 0;
  return runs >= 3;
}
function knifeBookTourActive() {
  return !!bookTour;
}
function knifeBookTourArm() {
  const pending = knifeBookTourPending();
  const show = pending && (typeof state === "undefined" || state === "menu");
  if (knivesArrowEl) knivesArrowEl.hidden = !show;
  if (itemsBtnEl) itemsBtnEl.classList.toggle("tour-hint", show);
  if (menuTourDimEl) menuTourDimEl.hidden = !show;
  if (menuDockEl) menuDockEl.style.zIndex = show ? "57" : "";
  return show;
}
function knifeBookTourLock() {
  if (!knifeBookTourPending()) return false;
  knifeBookTourArm();
  if (itemsBtnEl) {
    itemsBtnEl.classList.remove("tour-bump");
    void itemsBtnEl.offsetWidth;
    itemsBtnEl.classList.add("tour-bump");
  }
  if (typeof toast === "function") toast("СНАЧАЛА ЗАГЛЯНИ В НОЖИ");
  return true;
}
function knifeBookMarkClicked() {
  kbClickedMem = true;
  kbSet(KB_CLICKED_KEY, "1");
  knifeBookTourArm();
}
function knifeBookDockOpen() {
  const tour = knifeBookTourPending();
  knifeBookMarkClicked();
  openKnifeBook(tour);
}
function bookTourSync() {
  if (!bookTour || !bookScroll) return;
  const max = Math.max(0, bookScroll.scrollHeight - bookScroll.clientHeight);
  const pct = max > 0 ? Math.min(100, Math.round((bookScroll.scrollTop / max) * 100)) : 0;
  if (bookTourPctEl) bookTourPctEl.textContent = pct + "%";
  if (max > 0 && bookScroll.scrollTop + bookScroll.clientHeight >= bookScroll.scrollHeight - 28) {
    bookTourFinish();
  }
}
function bookTourFinish() {
  if (!bookTour) return;
  bookTour = false;
  kbTourDoneMem = true;
  kbSet(KB_TOUR_KEY, "1");
  kbSet(KB_CLICKED_KEY, "1");
  if (bookOverlay) bookOverlay.classList.remove("tour-lock");
  if (bookTourEl) bookTourEl.hidden = true;
  if (bookTourArrowEl) bookTourArrowEl.hidden = true;
  if (bookCloseBtn) bookCloseBtn.hidden = false;
  knifeBookTourArm();
  if (typeof toast === "function") toast("ГОТОВО · МОЖЕШЬ ЗАКРЫТЬ");
}

/* Все секции коллекции в человеческом порядке: редкости идут друг за другом,
   а коллекционные рамки — после VIP. Пустые страницы просто не попадают в
   ленту, поэтому никаких «страница пуста» здесь нет. */
function bookSectionList() {
  const out = [];
  const add = (id, entries, frame) => {
    if (!entries || !entries.length) return;
    const meta = itemPageMeta(id);
    out.push({ id, name: meta.name, color: meta.color, entries, frame: frame || "" });
  };
  for (const key of BOOK_ORDER) {
    if (key === "rarelegend") {
      add("rare", itemsPageEntries("rarelegend:rare"));
      /* легендарная ступень: боссовы мечи + временные ножи-заглушки
         (page: "legend" в js/knife-skins.js), пока заказчик не заменит их */
      add("legend", itemsPageEntries("rarelegend:legend").concat(itemsPageEntries("legend")));
      continue;
    }
    add(key, itemsPageEntries(key), BOOK_FRAMES[key]);
  }
  return out;
}

function bookEntryById(id) {
  const skin = KNIFE_SKINS.find(sk => sk.id === id);
  return skin ? { kind: "knife", skin } : null;
}

function bookMetaOf(skin) {
  let page = knifePageOf(skin);
  if (page === "rarelegend") {
    const boss = knifeOwnerBoss(skin);
    if (boss) page = bossTierOf(boss);
  }
  return itemPageMeta(page);
}

/* Состояние ножа подписью под картинкой: цена/ролик у закрытого. На телефоне
   у надетого подписи нет — он только подсвечивается рамкой, чтобы карточки
   не меняли высоту при смене ножа. Источник боссовых и подписочных ножей
   написан один раз в заголовке секции. */
function bookCardState(skin) {
  const owned = ownsKnife(skin.id);
  /* Надетый нож просто подсвечивается рамкой. Никакой подписи «В РУКЕ» —
     ни на телефоне, ни на ПК: строка под карточкой меняла высоту и двигала
     соседние ножи при смене ножа. */
  if (knifeEquipped(skin.id)) return { html: "", cls: "eq", owned: true, eq: true };
  /* Купленный VIP-нож подписываем «КУПЛЕНО»: раньше подпись просто исчезала,
     и после покупки было непонятно, прошла ли она. */
  if (owned) return { html: skin.ad ? "КУПЛЕНО" : "", cls: "own", owned: true, eq: false };
  if (skin.ad) return { html: "◆ " + KNIFE_SET_PRICE, cls: "lock", owned: false, eq: false };
  if (skin.price) return { html: appleIconHtml() + " " + skin.price, cls: "lock", owned: false, eq: false };
  /* У боссовых и подписочных ножей подпись не повторяется под каждым
     ножом: источник написан один раз в заголовке секции. */
  return { html: "", cls: "lock", owned: false, eq: false };
}

/* Один нож. Обычная карточка показывает имя и состояние, VIP-слот внутри
   рамки — только рисунок: рамка остаётся ровно такой, какой была. */
function bookCardHtml(e, compact) {
  const skin = e.skin;
  const id = skin.id;
  const owned = ownsKnife(id);
  const eq = knifeEquipped(id);
  const meta = bookMetaOf(skin);
  /* Закрытый VIP-нож показываем обычной цветной картинкой: игрок должен
     видеть, за что платит. Раньше здесь лежала чёрно-белая лента, и нож
     выглядел серым пятном. Остальные закрытые — залитый цветом редкости
     силуэт. Любая страница с художественной рамкой считается VIP-коллекцией. */
  const page = knifePageOf(skin);
  const vip = page === "vip" || !!BOOK_FRAMES[page];
  const silhouette = owned || vip ? "" : ` data-silhouette="${meta.color}"`;
  const st = bookCardState(skin);
  const name = bookEsc(skin.name);
  const sel = bookSel === id ? " sel" : "";
  const res = bookCanvasSize(compact);
  const resH = Math.round(res * 500 / 180);
  const art = `<canvas data-knife="${id}" data-cw="${res}" data-ch="${resH}"${silhouette} width="${res}" height="${resH}"></canvas>`;
  if (compact) {
    /* Маска блика — сам рисунок ножа. Блик ходит по силуэту, а не по
       прямоугольной клетке. Параметры покачивания отдаём CSS-анимации
       (никакого JS на каждый кадр). */
    /* Блик по ножам теперь один на витрину (см. .bk-glint-row в разметке
       рамки): маска с полноразмерным PNG на каждый слот и отдельный слой под
       каждый блик — это и был главный тормоз витрин на телефонах. */
    let swayCss = "";
    if (typeof knifeSwayParams === "function") {
      const p = knifeSwayParams(id);
      if (p && p.bobSpd > 0) {
        const dur = Math.PI / p.bobSpd;
        const delay = -(p.bobPh / p.bobSpd);
        swayCss = `--sway-amp:${(p.bob * 1.3).toFixed(2)}px;` +
          `--sway-rot:${(p.tilt * 1.3).toFixed(2)}deg;` +
          `--sway-dur:${dur.toFixed(2)}s;` +
          `--sway-delay:${delay.toFixed(2)}s;`;
      }
    }
    return `<button class="bk-slot bk-sea-slot${eq ? " eq" : ""}${owned ? " own" : " locked"}${vip ? " vip" : ""}${sel}" ` +
      `type="button" style="--bc:${meta.color}" data-knife="${id}" ` +
      `aria-label="${name}" title="${name}">` +
      `<span class="bk-art" style="${swayCss}">${art}` +
      `</span></button>`;
  }
  return `<button class="kb-card${eq ? " eq" : ""}${owned ? " own" : " locked"}${vip ? " vip" : ""}${sel}" ` +
    `type="button" style="--bc:${meta.color}" data-knife="${id}" aria-label="${name}">` +
    `<span class="kb-card-art">${art}</span>` +
    `<span class="kb-card-state ${st.cls}">${st.html}</span>` +
    `</button>`;
}

/* Разрешение холста ножа: исходник 180×500. Карточки в полноэкранной
   коллекции крупные, поэтому и холст крупнее: 160 px по ширине на монитор,
   130 — на телефон. Полноразмерные 180×500 на 150 ножей съедали бы слишком
   много памяти. */
function bookCanvasSize(compact) {
  const wide = (window.innerWidth || 1280) >= 760;
  /* Слоты внутри наборов показываются крошечными (≈30 CSS px), поэтому им не
     нужен полноразмерный холст: на телефоне 80 px по ширине вместо 130 — втрое
     меньше пикселей на отрисовку и меньше памяти. */
  if (compact) return wide ? 128 : 80;
  return wide ? 160 : 130;
}

function bookSectionHtml(section, entries) {
  const owned = section.entries.filter(e => ownsKnife(e.skin.id)).length;
  const total = section.entries.length;
  const head = `<div class="kb-sec-head" style="--bc:${section.color}">` +
    `<span class="kb-sec-dot" aria-hidden="true"></span>` +
    `<span class="kb-sec-name">${bookEsc(section.name)}</span>` +
    `<span class="kb-sec-count">${owned} / ${total}</span>` +
    `</div>`;
  if (section.frame) {
    const cells = entries.map(e => bookCardHtml(e, true)).join("");
    /* Кнопка набора остаётся на месте всегда: после открытия коллекции она
       не пропадает, а честно пишет «КУПЛЕНО». Раньше она исчезала, и было
       непонятно, куплен набор или кнопка сломалась. */
    const done = owned >= total;
    const buy = `<button class="bk-set-buy${done ? " done" : ""}" type="button" ` +
      `data-buy-set="${section.id}"${done ? " disabled" : ""} ` +
      `aria-label="${done ? "Коллекция уже куплена" : "Открыть всю коллекцию за " + KNIFE_SET_PRICE + " алмазов"}">` +
      `<span class="bk-set-buy-price">${done ? "КУПЛЕНО" : KNIFE_SET_PRICE + " 💎"}</span>` +
      `</button>`;
    /* Блёстки и бегущий блик — это 48 анимированных элементов на витрину.
       Ради стабильного FPS (и на ПК, и на телефоне) не создаём их вовсе:
       рамка набора и так достаточно нарядная. */
    const lowGfx = false;
    /* Блёстки: два «слоя» по 4 звезды. Анимируется сам слой (одна дорожка
       композитора), а не каждая звезда отдельно — на телефоне 8 отдельных
       анимированных элементов на витрину были лишними слоями. Звёзды внутри
       неподвижны; слой мягко вспыхивает, у второго слоя свой ритм. */
    let glints = "";
    for (let g = 0; g < 2; g++) {
      const gDur = (2.2 + g * 1.1 + Math.random() * 0.8).toFixed(2);
      const gDelay = (-Math.random() * 2).toFixed(2);
      glints += `<span class="bk-glints g${g + 1}" aria-hidden="true" style="animation-duration:${gDur}s;animation-delay:${gDelay}s">`;
      for (let i = 0; i < 4; i++) {
        const left = (8 + Math.random() * 84).toFixed(1);
        const top = (12 + Math.random() * 64).toFixed(1);
        const size = (10 + Math.random() * 16).toFixed(1);
        const op = (0.55 + Math.random() * 0.45).toFixed(2);
        glints += `<i style="left:${left}%;top:${top}%;width:${size}px;height:${size}px;opacity:${op}"></i>`;
      }
      glints += '</span>';
    }
    /* У каждой витрины свой ритм блика: не проходят хором в один момент. */
    const sheenDur = (10.5 + Math.random() * 4).toFixed(2);
    const sheenDelay = (-Math.random() * parseFloat(sheenDur)).toFixed(2);
    const sheen = lowGfx ? "" :
      `<span class="bk-sheen" aria-hidden="true"><i style="animation-duration:${sheenDur}s;` +
        `animation-delay:${sheenDelay}s"></i></span>`;
    /* Рамка набора — маленький canvas, который заранее уменьшается из PNG
       1604×980 и вставляется в .bk-sea-frame (см. bookPreloadFrames /
       bookAttachFrame). При прокрутке нет ни декодирования, ни рисования
       полноразмерной картинки — отсюда пропадают «резкие появления». */
    return `<section class="kb-section kb-vip bk-sea-${section.id}" style="--bc:${section.color}">` +
      head +
      `<div class="kb-vip-scroll"><div class="kb-vip-inner">` +
        `<div class="bk-sea-frame" data-frame="${bookEsc(section.frame)}">` +
          `<div class="bk-sea-grid">${cells}</div>` +
          sheen +
          glints +
        `</div>` +
        buy +
      `</div></div>` +
      `</section>`;
  }
  return `<section class="kb-section" style="--bc:${section.color}">` +
    head +
    `<div class="kb-grid">${entries.map(e => bookCardHtml(e)).join("")}</div>` +
    `</section>`;
}

function bookVisibleEntries(section) {
  return section.entries;
}

/* Две VIP-коллекции в одну строку. Если после фильтра осталась одна — она
   занимает всю ширину, чтобы сетка не прижималась к половине экрана. */
function bookVipRowHtml(items) {
  return `<div class="kb-vip-row${items.length === 1 ? " single" : ""}">` +
    items.map(item => bookSectionHtml(item.section, item.entries)).join("") +
    `</div>`;
}

/* Полная перерисовка ленты: вызывается при открытии, смене фильтра, покупке и
   разблокировке. Позиция прокрутки сохраняется — игрок не возвращается в
   начало коллекции после каждого действия. */
/* Кэш собранной ленты: пока ничего не куплено/не надето, повторное открытие
   не пересобирает сто пятьдесят карточек и не перепекает их канвасы. Это была
   самая дорогая часть открытия (сотни миллисекунд). */
let bookHtmlCache = "";
let bookHtmlKey = "";

/* Секции, которые сейчас далеко от экрана, браузер не раскладывает и не
   рисует (css/style.css: .kb-scroll.cv). На телефоне это в разы уменьшает
   площадь растра при прокрутке. Чтобы лента не прыгала, каждой секции заранее
   прописывается её настоящая высота: снимаем .cv, меряем все блоки одним
   заходом (этот reflow и так случается после innerHTML) и включаем .cv назад.

   Включаем ТОЛЬКО на телефоне. На ПК content-visibility плодит по слою на
   секцию и её содержимое: в ленте становилось 223 слоя вместо 90, и слабый
   десктоп на каждом кадре тратил время на обновление этого дерева. Там
   виртуализация не нужна — весь список по высоте спокойно растеризуется. */
function bookMeasureBlocks() {
  if (!bookScroll) return;
  bookScroll.classList.remove("cv");
  const kids = bookScroll.children;
  for (let i = 0; i < kids.length; i++) {
    const el = kids[i];
    const h = el.offsetHeight | 0;
    if (h > 0) el.style.setProperty("--kb-h", h + "px");
  }
  if (typeof phone !== "undefined" && phone) bookScroll.classList.add("cv");
}

function bookRender(force) {
  if (!bookScroll) return;
  const top = bookScroll.scrollTop || 0;
  /* Клавиатура: после пересборки возвращаем фокус на тот же нож, иначе Tab
     начинал бы обход коллекции заново. */
  const active = document.activeElement;
  const focusId = active && active.closest && active.closest("[data-knife]")
    ? active.closest("[data-knife]").dataset.knife
    : "";
  bookSections = bookSectionList();
  let all = 0;
  let owned = 0;
  for (const section of bookSections) {
    all += section.entries.length;
    owned += section.entries.filter(e => ownsKnife(e.skin.id)).length;
  }
  bookStats = { all, own: owned, lock: all - owned };
  /* Обычные секции идут во всю ширину, VIP-коллекции собираются в пары:
     две рамки на одной строке. */
  const blocks = [];
  let vipPair = [];
  const flushVip = () => {
    if (!vipPair.length) return;
    blocks.push(bookVipRowHtml(vipPair));
    vipPair = [];
  };
  for (const section of bookSections) {
    const entries = bookVisibleEntries(section);
    if (!entries.length) continue;
    if (section.frame) {
      vipPair.push({ section, entries });
      if (vipPair.length === 2) flushVip();
    } else {
      flushVip();
      blocks.push(bookSectionHtml(section, entries));
    }
  }
  flushVip();
  const html = blocks.join("");
  const key = owned + "|" + all + "|" + save.knife + "|" + (save.owned ? save.owned.length : 0);
  if (!force && key === bookHtmlKey && bookScroll.children.length) {
    bookSyncCards();
    bookSyncChrome();
    bookRndRender();
    bookActionSync();
    bookSwaySync();
    if (bookIsOpen) bookScroll.scrollTop = top;
    return;
  }
  bookHtmlCache = html;
  bookHtmlKey = key;
  bookScroll.innerHTML = html;
  /* Сразу замеряем высоту каждой секции и только потом включаем
     content-visibility:auto. Так прокрутка никогда не «прыгает»: у всех
     секций, до которых ещё далеко, уже стоит их настоящая высота. */
  bookMeasureBlocks();
  if (bookPaintRaf) { cancelAnimationFrame(bookPaintRaf); bookPaintRaf = 0; }
  bookPaintQueue.length = 0;
  if (bookWarmRaf) { cancelAnimationFrame(bookWarmRaf); bookWarmRaf = 0; }
  if (bookPaintIO) { bookPaintIO.disconnect(); }
  bookPaintLazy(bookScroll);
  /* После пересборки ленты рамки наборов — новые пустые .bk-sea-frame:
     без этого вызова холсты рамок и ножей внутри них оставались ненарисованными,
     и после покупки ножа все VIP-витрины выглядели исчезнувшими. */
  bookWarmSets(bookScroll);
  if (bookIsOpen) bookScroll.scrollTop = top;
  if (focusId) {
    const again = bookScroll.querySelector('[data-knife="' + focusId + '"]');
    if (again) again.focus({ preventScroll: true });
  }
  bookScroll.hidden = !html;
  if (bookEmptyEl) bookEmptyEl.hidden = !!html;
  bookSyncChrome();
  bookRndRender();
  bookActionSync();
  bookSwaySync();
  if (bookIsOpen) bookAnimSync();
}

/* Прогрев коллекции в меню: строим скрытый DOM, заранее рисуем рамки наборов и
   их ножи. Тогда открытие книги не собирает 150 карточек в кадре, а наборы при
   прокрутке уже готовы (жалобы: «резко появляются» и просадки в инвентаре). */
function warmKnifeBook() {
  if (bookIsOpen || !bookScroll) return;
  /* Только в меню: если игрок уже начал забег, не строим/не рисуем коллекцию
     в игровом кадре — она соберётся при открытии. */
  if (typeof state !== "undefined" && state !== "menu") return;
  if (typeof sheetMode !== "undefined" && sheetMode) return;
  if (typeof shopSceneOpened === "function" && shopSceneOpened()) return;
  if (bookScroll.children.length) return;
  try {
    bookRender(true);
    bookPaintLazy(bookScroll);
    bookWarmSets(bookScroll);
  } catch (err) {}
}

/* Лёгкая синхронизация после надевания/включения рандома: не пересобираем
   сто пятьдесят карточек, а только меняем классы и подписи. */
function bookSyncCards() {
  if (!bookScroll) return;
  const list = bookScroll.querySelectorAll("[data-knife]");
  for (let i = 0; i < list.length; i++) {
    const card = list[i];
    const id = card.dataset.knife;
    const skin = KNIFE_SKINS.find(sk => sk.id === id);
    if (!skin) continue;
    const st = bookCardState(skin);
    card.classList.toggle("eq", st.eq);
    card.classList.toggle("own", st.owned);
    card.classList.toggle("locked", !st.owned);
    card.classList.toggle("sel", bookSel === id);
    const stateEl = card.querySelector(".kb-card-state");
    if (stateEl) {
      stateEl.className = "kb-card-state " + st.cls;
      stateEl.innerHTML = st.html;
    }
  }
}

function bookSyncChrome() {
  if (bookProgressEl) bookProgressEl.textContent = bookStats.own + " / " + bookStats.all;
  randomUnlockRender();
}

function bookActionSync() {
  if (!bookActEl) return;
  const entry = bookSel ? bookEntryById(bookSel) : null;
  if (!entry || ownsKnife(entry.skin.id)) {
    bookSel = "";
    bookActEl.hidden = true;
    bookActEl.innerHTML = "";
    return;
  }
  const cta = itemsAction(entry);
  if (!cta) {
    bookSel = "";
    bookActEl.hidden = true;
    bookActEl.innerHTML = "";
    return;
  }
  const skin = entry.skin;
  const meta = bookMetaOf(skin);
  bookActEl.style.setProperty("--bc", meta.color);
  bookActEl.innerHTML =
    `<span class="kb-act-info">` +
      `<span class="kb-act-name">${bookEsc(skin.name)}</span>` +
      `<span class="kb-act-rar">${bookEsc(meta.name)}</span>` +
    `</span>` +
    `<span class="kb-act-cta">${cta}</span>` +
    `<button class="kb-act-x" type="button" data-act-clear aria-label="Снять выбор">✕</button>`;
  bookActEl.hidden = false;
}

/* ---------- открытие и закрытие ---------- */
/* Тело и сцена в игре выключают жесты целиком (#stage: touch-action none).
   Пока открыта коллекция, разрешаем вертикальную прокрутку — иначе лента на
   телефоне не листается пальцем. Закрыли — вернули строгий режим игры. */
function bookTouchMode(on) {
  if (document.body) document.body.classList.toggle("book-open", on);
  if (bookStage) bookStage.classList.toggle("book-open", on);
}

function knifeBookOpened() {
  return bookIsOpen;
}

function openKnifeBook(forceTour) {
  if (!bookOverlay) return;
  bookTour = !!forceTour;
  Sfx.ensure();
  if (typeof sheetMode !== "undefined" && sheetMode) closeSheet();
  bookReturnFocus = document.activeElement;
  bookIsOpen = true;
  bookCancelMotion();
  bookDragInfo = null;
  bookDragMoved = false;
  /* Пока книга открыта, игровой canvas и меню под ней не нужны: прячем их,
     чтобы композитор не тратил кадр на скрытые слои. HUD тоже прячем — он
     лежит ПОД непрозрачной книгой, но браузер не всегда может это доказать и
     честно рисует каждый его слой в каждом кадре (на слабом ПК это главный
     источник лага в инвентаре). Счётчик FPS — отдельный элемент, он остаётся. */
  try {
    if (typeof canvas !== "undefined" && canvas) canvas.style.visibility = "hidden";
    if (typeof menuEl !== "undefined" && menuEl) menuEl.style.visibility = "hidden";
    if (typeof hud !== "undefined" && hud) hud.style.visibility = "hidden";
  } catch (err) {}
  bookSel = "";
  bookTouchMode(true);
  if (bookTour) {
    bookOverlay.classList.add("tour-lock");
    if (bookCloseBtn) bookCloseBtn.hidden = true;
    if (bookTourEl) bookTourEl.hidden = false;
    if (bookTourArrowEl) bookTourArrowEl.hidden = false;
    if (bookTourPctEl) bookTourPctEl.textContent = "0%";
  } else {
    bookOverlay.classList.remove("tour-lock");
    if (bookCloseBtn) bookCloseBtn.hidden = false;
    if (bookTourEl) bookTourEl.hidden = true;
    if (bookTourArrowEl) bookTourArrowEl.hidden = true;
  }
  bookRender();
  bookPaintLazy(bookScroll);
  bookWarmSets(bookScroll);
  bookAnimSync();
  bookOverlay.classList.remove("hidden", "in");
  bookOverlay.setAttribute("aria-hidden", "false");
  if (bookEl) bookEl.focus({ preventScroll: true });
  void bookOverlay.offsetWidth;
  bookFitFrames();
  bookOverlay.classList.add("in");
  const saved = Number(localStorage.getItem("bh_book_scroll"));
  requestAnimationFrame(() => {
    if (bookScroll) bookScroll.scrollTop = bookTour ? 0 : (Number.isFinite(saved) && saved > 0 ? saved : 0);
    if (bookTour) requestAnimationFrame(bookTourSync);
  });
}

function closeKnifeBook() {
  if (bookTour) return;
  if (!bookOverlay || !bookIsOpen) return;
  bookIsOpen = false;
  bookCancelMotion();
  bookDragInfo = null;
  if (bookScroll) bookScroll.classList.remove("dragging");
  /* bookIsOpen уже false: снимаем .anim и отписываемся от наблюдения. */
  bookAnimSync();
  try {
    if (typeof canvas !== "undefined" && canvas) canvas.style.visibility = "";
    if (typeof menuEl !== "undefined" && menuEl) menuEl.style.visibility = "";
    if (typeof hud !== "undefined" && hud) hud.style.visibility = "";
  } catch (err) {}
  bookTouchMode(false);
  bookSwayStop();
  if (bookPaintIO) { bookPaintIO.disconnect(); }
  if (bookPaintRaf) { cancelAnimationFrame(bookPaintRaf); bookPaintRaf = 0; }
  bookPaintQueue.length = 0;
  if (bookWarmRaf) { cancelAnimationFrame(bookWarmRaf); bookWarmRaf = 0; }
  if (bookScroll) localStorage.setItem("bh_book_scroll", String(bookScroll.scrollTop | 0));
  bookSel = "";
  if (bookActEl) {
    bookActEl.hidden = true;
    bookActEl.innerHTML = "";
  }
  bookOverlay.classList.add("hidden");
  bookOverlay.classList.remove("in");
  bookOverlay.setAttribute("aria-hidden", "true");
  if (bookReturnFocus && bookReturnFocus.focus) {
    bookReturnFocus.focus({ preventScroll: true });
    bookReturnFocus = null;
  }
}

/* Открытия/покупки из магазина и чит-кнопки перерисовывают коллекцию, чтобы
   силуэт только что открытого ножа сразу стал рисунком. */
function knifeBookRefresh() {
  if (!bookIsOpen) return;
  if (bookSel && ownsKnife(bookSel)) bookSel = "";
  bookRender();
}

/* ---------- покупка набора коллекции ----------
   Набор VIP-ножей стоит KNIFE_SET_PRICE алмазов — это реальная трата новой
   валюты (алмазов), а не бесплатная выдача. */
function buyKnifeSet(page) {
  const entries = itemsPageEntries(page);
  if (!entries.length) return;
  if (entries.every(e => ownsKnife(e.skin.id))) {
    toast("НАБОР УЖЕ ОТКРЫТ");
    return;
  }
  if ((save.rubles | 0) < KNIFE_SET_PRICE) {
    toast("МАЛО АЛМАЗОВ · НУЖНО " + KNIFE_SET_PRICE);
    return;
  }
  if (!spendRubles(KNIFE_SET_PRICE)) {
    toast("МАЛО АЛМАЗОВ · НУЖНО " + KNIFE_SET_PRICE);
    return;
  }
  const added = [];
  for (const e of entries) {
    if (!save.owned.includes(e.skin.id)) {
      save.owned.push(e.skin.id);
      added.push(e.skin.id);
    }
  }
  persist();
  syncHud();
  knifeBookRefresh();
  Sfx.pick();
  toast("НАБОР ОТКРЫТ · " + entries.length + " НОЖЕЙ");
  if (typeof Analytics !== "undefined") {
    Analytics.purchase({
      kind: "knife_set",
      id: String(page),
      name: "Набор " + (typeof ITEM_PAGE_NAMES !== "undefined" ? (ITEM_PAGE_NAMES[page] || page) : page),
      cost: KNIFE_SET_PRICE,
      currency: "diamond",
      count: added.length
    });
  }
}

/* ---------- выбор ножа ---------- */
function bookExplainLocked(skin) {
  const boss = knifeOwnerBoss(skin);
  if (boss) {
    toast("НОЖ БОССА · " + boss.name);
  } else if (skin.randomDrop) {
    toast("ОТКРЫВАЕТСЯ КНОПКОЙ «ОТКРЫТЬ НОЖ»");
  } else {
    toast("НОЖ ПОКА ЗАКРЫТ");
  }
}

function bookPick(id) {
  const skin = KNIFE_SKINS.find(sk => sk.id === id);
  if (!skin) return;
  /* Открытый нож надевается сразу — никаких промежуточных карточек и кнопок. */
  if (ownsKnife(id)) {
    if (equipKnife(id)) {
      bookSel = "";
      if (typeof renderLoadout === "function") renderLoadout();
      if (typeof Sfx !== "undefined") Sfx.select();
      bookSyncCards();
      bookRndRender();
    }
    return;
  }
  /* Закрытый: одно понятное действие по клику, без скрытых панелей. */
  if (skin.ad) {
    /* VIP-ножи покупаются только набором за 49 💎 кнопкой под коллекцией.
       Клик по одному неразблокированному VIP-ножу ничего не делает. */
    return;
  }
  if (skin.price) {
    if (game.apples < skin.price) {
      toast("МАЛО ЯБЛОК · НУЖНО " + skin.price);
      return;
    }
    buyKnife(id);
    if (ownsKnife(id)) {
      toast(skin.name + " · ОТКРЫТ");
      bookRender(true);
    }
    return;
  }
  bookExplainLocked(skin);
}

/* ---------- рисование ножей на холстах ---------- */
/* ---------- «дыхание» VIP-ножей ----------
   Та же фаза и те же параметры, что у витрин магазина: нож качается по общим
   часам, а не начинает анимацию заново после каждой перерисовки. */
let bookSwayItems = [];
let bookSwayRaf = 0;

function bookSwayApply(t) {
  for (let i = 0; i < bookSwayItems.length; i++) {
    const it = bookSwayItems[i];
    const p = it.p;
    /* Чуть заметнее, чем на витрине магазина: в рамке нож мелкий, и
       исходная амплитуда почти терялась. */
    const dy = Math.sin(t * p.bobSpd + p.bobPh) * p.bob * 1.3;
    const rot = p.base + Math.sin(t * p.tiltSpd + p.tiltPh) * p.tilt * 1.3;
    /* Двигаем обёртку, а не холст: тогда маска блика качается вместе с ножом. */
    it.el.style.setProperty("--sway", "translateY(" + dy.toFixed(2) + "px) rotate(" + rot.toFixed(2) + "deg)");
  }
}

function bookSwayFrame(now) {
  bookSwayRaf = 0;
  if (!bookIsOpen) return;
  bookSwayApply(now / 1000);
  bookSwayRaf = requestAnimationFrame(bookSwayFrame);
}

function bookSwaySync() {
  /* Покачивание 150 карточек — это 150 записей CSS-переменных и слоёв каждый
     кадр. На ПК это была одна из причин 40 fps в инвентаре, на телефоне уже
     отключено. Ради стабильного кадра оставляем карточки статичными. */
  bookSwayStop();
}

function bookSwayStop() {
  if (bookSwayRaf) cancelAnimationFrame(bookSwayRaf);
  bookSwayRaf = 0;
  bookSwayItems = [];
}

function bookPaintOne(c) {
  if (!c || c.dataset.painted === "1") return;
  const img = assets.knives[c.dataset.knife];
  if (!img) return;
  /* Битmap могли отпустить, пока карточка была далеко: возвращаем размер. */
  if (!c.width || !c.height) {
    const cw = c.dataset.cw | 0;
    const ch = c.dataset.ch | 0;
    if (!cw || !ch) return;
    c.width = cw;
    c.height = ch;
  }
  c.dataset.painted = "1";
  const g = c.getContext("2d");
  g.clearRect(0, 0, c.width, c.height);
  const scale = Math.min(c.width / img.width, c.height / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  const dx = (c.width - dw) * 0.5;
  const dy = (c.height - dh) * 0.5;
  g.drawImage(img, dx, dy, dw, dh);
  const silhouette = c.dataset.silhouette;
  if (silhouette) {
    g.globalCompositeOperation = "source-in";
    g.fillStyle = silhouette;
    g.fillRect(0, 0, c.width, c.height);
    g.globalCompositeOperation = "source-over";
  }
}

function bookPaint(root) {
  const scope = root || bookScroll;
  if (!scope || typeof assets === "undefined" || !assets || !assets.knives) return;
  scope.querySelectorAll("canvas[data-knife]").forEach(bookPaintOne);
}

/* Отрисовка карточек порциями: IO может отдать сразу десятки холстов (прыжок
   к набору/быстрый флинг), и если нарисовать их в одном кадре, получается
   рывок на 100-200 мс. Рисуем максимум 8 за кадр — картинки доезжают без
   заморозки, а на экран заранее попадает 2.5 экрана (rootMargin ниже). */
let bookPaintQueue = [];
let bookPaintRaf = 0;
function bookQueuePaint(c) {
  if (!c || c.dataset.painted === "1") return;
  bookPaintQueue.push(c);
  if (!bookPaintRaf) bookPaintRaf = requestAnimationFrame(bookFlushPaint);
}
function bookFlushPaint() {
  bookPaintRaf = 0;
  let n = Math.min(8, bookPaintQueue.length);
  while (n-- > 0) bookPaintOne(bookPaintQueue.shift());
  if (bookPaintQueue.length) bookPaintRaf = requestAnimationFrame(bookFlushPaint);
}

/* Заранее готовим все наборы: рамки и холсты ножей внутри них. Наборы далеко
   внизу, поэтому к моменту прокрутки они уже полностью нарисованы. */
let bookWarmRaf = 0;
function bookWarmSets(root) {
  const scope = root || bookScroll;
  if (!scope) return;
  const frames = scope.querySelectorAll(".bk-sea-frame:not([data-frame-ready])");
  const slots = scope.querySelectorAll(".kb-vip canvas[data-knife]:not([data-painted])");
  if (!frames.length && !slots.length) return;
  let fi = 0, si = 0;
  if (bookWarmRaf) cancelAnimationFrame(bookWarmRaf);
  const step = function () {
    bookWarmRaf = 0;
    /* Если игрок ушёл в бой, не рисуем скрытые наборы в игровом кадре. */
    if (!bookIsOpen && typeof state !== "undefined" && state !== "menu") return;
    let budget = 6;
    while (fi < frames.length && budget > 0) { bookAttachFrame(frames[fi++]); budget--; }
    while (si < slots.length && budget > 0) { bookPaintOne(slots[si++]); budget--; }
    if (fi < frames.length || si < slots.length) {
      bookWarmRaf = requestAnimationFrame(step);
    } else {
      /* Все рамки на местах — подгоняем их холсты под фактическую ширину. */
      bookFitFrames();
    }
  };
  bookWarmRaf = requestAnimationFrame(step);
}

/* Анимации VIP-наборов идут ВСЕГДА, пока витрина в поле зрения — в том числе
   во время листания: покачивание («дыхание»), блёстки, блик клинка и бегущий
   блик по рамке. Наборы за пределами экрана не держат ни слоёв, ни анимаций:
   класс .anim ставит IntersectionObserver, а сами эффекты у невидимых наборов
   вообще не участвуют в отрисовке (css: .kb-vip:not(.anim) ... display:none).
   Сколько наборов анимируется одновременно: на слабом телефоне 1, на обычном
   телефоне 2, на ПК все видимые (до 4) — столько и помещается на экране. */
let bookAnimIO = null;
let bookAnimActive = [];
let bookAnimFirst = null;

function bookAnimCap() {
  /* Все витрины, которые сейчас в поле зрения, — без ограничения по счёту:
     «дыхание», блёстки и блики идут всегда, пока набор виден, в том числе во
     время листания. Дёшево это потому, что у невидимых наборов эффектов нет
     вовсе (display:none), а сами анимации — только transform/opacity. */
  return 99;
}

/* Пересчёт по фактической геометрии: анимируем только те наборы, что реально
   видны (и не больше cap — самые близкие к центру экрана). */
function bookAnimPick() {
  if (!bookScroll) return;
  const list = bookScroll.querySelectorAll(".kb-vip");
  if (!list.length) return;
  const vp = bookScroll.getBoundingClientRect().top;
  const vh = bookScroll.clientHeight;
  const cand = [];
  for (let i = 0; i < list.length; i++) {
    const r = list[i].getBoundingClientRect();
    if (r.bottom <= vp + 2 || r.top >= vp + vh - 2) continue;
    const vis = Math.min(r.bottom, vp + vh) - Math.max(r.top, vp);
    if (vis < Math.min(r.height || 1, vh) * 0.06) continue;
    cand.push([Math.abs((r.top + r.bottom) * 0.5 - (vp + vh * 0.5)), list[i]]);
  }
  cand.sort(function (a, b) { return a[0] - b[0]; });
  const keep = cand.slice(0, bookAnimCap()).map(function (x) { return x[1]; });
  for (let i = 0; i < list.length; i++) {
    const want = keep.indexOf(list[i]) >= 0;
    if (list[i].classList.contains("anim") !== want) list[i].classList.toggle("anim", want);
  }
  bookAnimActive = keep;
}

function bookAnimSync() {
  if (!bookScroll) return;
  if (!bookIsOpen) {
    if (bookAnimIO) bookAnimIO.disconnect();
    bookAnimFirst = null;
    for (let i = 0; i < bookAnimActive.length; i++) bookAnimActive[i].classList.remove("anim");
    bookAnimActive = [];
    return;
  }
  const first = bookScroll.querySelector(".kb-vip");
  /* После пересборки ленты узлы новые — подписываемся заново. */
  if (!bookAnimIO || first !== bookAnimFirst) {
    if (bookAnimIO) bookAnimIO.disconnect();
    bookAnimFirst = first;
    bookAnimActive = [];
    if (!first) return;
    bookAnimIO = new IntersectionObserver(function () {
      bookAnimPick();
    }, { root: bookScroll, rootMargin: "16% 0px", threshold: 0 });
    const list = bookScroll.querySelectorAll(".kb-vip");
    for (let i = 0; i < list.length; i++) bookAnimIO.observe(list[i]);
  }
  bookAnimPick();
}

/* Страховка после остановки прокрутки: IntersectionObserver может «потерять»
   событие (например, после пересборки ленты или прыжка скролла), и тогда
   витрина осталась бы без анимаций. Догоняем одним пересчётом, когда лента
   встала. Во время прокрутки он не срабатывает. */
let bookAnimSettle = 0;
if (bookScroll) {
  bookScroll.addEventListener("scroll", function () {
    if (!bookIsOpen) return;
    if (bookTour) bookTourSync();
    if (bookAnimSettle) clearTimeout(bookAnimSettle);
    bookAnimSettle = setTimeout(function () {
      bookAnimSettle = 0;
      if (bookIsOpen) bookAnimPick();
    }, 180);
  }, { passive: true });
}

/* Ленивая отрисовка: в кадре открытия рисуем только карточки у экрана, ос-
   тальные — когда до них долистали (IntersectionObserver). Иначе первое
   открытие книги — это 150 canvas-отрисовок сразу. */
let bookPaintIO = null;
function bookPaintLazy(root) {
  const scope = root || bookScroll;
  if (!scope) return;
  if (typeof IntersectionObserver !== "function") {
    bookPaint(scope);
    bookWarmSets(scope);
    return;
  }
  if (!bookPaintIO) {
    bookPaintIO = new IntersectionObserver(function (entries) {
      for (let i = 0; i < entries.length; i++) {
        const en = entries[i];
        if (!en.isIntersecting) continue;
        bookPaintIO.unobserve(en.target);
        bookQueuePaint(en.target);
      }
    }, { root: bookScroll, rootMargin: "250% 0px" });
  }
  const list = scope.querySelectorAll("canvas[data-knife]:not([data-painted])");
  for (let i = 0; i < list.length; i++) bookPaintIO.observe(list[i]);
}

/* ---------- рандомизатор ножей ----------
   Одна кнопка в шапке: включили — каждый бросок меняет нож в руке на случайный
   из открытых; выключили — в руке снова тот нож, который был выбран последним.
   Никакой «своей очереди» и списков: для ленивого игрока это лишний лабиринт. */
function knifeRndOwned() {
  const out = [];
  for (const sk of KNIFE_SKINS) if (ownsKnife(sk.id)) out.push(sk.id);
  return out;
}

function knifeRndPool() {
  return knifeRndOwned();
}

function knifeRndNext() {
  if (!save.rnd) return false;
  const pool = knifeRndPool();
  if (!pool.length) return false;
  const other = pool.filter(id => id !== save.knife);
  const list = other.length ? other : pool;
  const next = list[(Math.random() * list.length) | 0];
  if (!next || next === save.knife) return false;
  save.knife = next;
  persistSoon();
  return true;
}

function knifeRndApplyNow() {
  const changed = knifeRndNext();
  if (changed && typeof renderLoadout === "function") renderLoadout();
  return changed;
}

function bookRndRender() {
  if (!bookRndEl) return;
  const on = !!save.rnd;
  bookRndEl.classList.toggle("on", on);
  bookRndEl.setAttribute("aria-pressed", on ? "true" : "false");
  bookRndEl.title = on
    ? "Случайный нож включён — нажмите, чтобы выключить"
    : "Каждый бросок — случайный нож";
  if (bookRndFlagEl) bookRndFlagEl.hidden = !on;
}

if (bookRndEl) {
  bookRndEl.addEventListener("click", e => {
    e.stopPropagation();
    if (save.rnd) {
      save.rnd = false;
    } else {
      save.rnd = true;
      knifeRndApplyNow();
    }
    persist();
    if (typeof renderLoadout === "function") renderLoadout();
    if (typeof Sfx !== "undefined") Sfx.select();
    bookRndRender();
    bookSyncCards();
    bookActionSync();
  });
}

/* ---------- разблокировать случайный нож за яблоки ----------
   Кнопка в шапке коллекции. Первое открытие стоит 100 яблок, каждое
   следующее — на 25 дороже. Выпадает только закрытый нож из общего пула
   images/knifes/none; когда открыты все, кнопка гаснет. Счётчик открытий
   лежит в сейве (save.randBuys), поэтому цена не сбрасывается после
   перезагрузки. */
const RANDOM_UNLOCK_BASE = 100;
const RANDOM_UNLOCK_STEP = 25;

function randomUnlockPrice() {
  return RANDOM_UNLOCK_BASE + RANDOM_UNLOCK_STEP * Math.max(0, save.randBuys | 0);
}

function randomUnlockPool() {
  return KNIFE_SKINS.filter(sk => sk.randomDrop && !ownsKnife(sk.id));
}

function randomUnlockRender() {
  if (!bookUnlockEl) return;
  const price = randomUnlockPrice();
  const empty = !randomUnlockPool().length;
  if (bookUnlockPriceEl) bookUnlockPriceEl.innerHTML = appleIconHtml() + " " + price;
  bookUnlockEl.disabled = empty;
  bookUnlockEl.classList.toggle("poor", !empty && (game.apples | 0) < price);
  bookUnlockEl.setAttribute("aria-label",
    empty ? "Все случайные ножи уже открыты" : "Разблокировать случайный нож за " + price + " яблок");
  bookUnlockEl.title = empty
    ? "Все ножи уже открыты"
    : "Разблокировать случайный нож за " + price + " яблок";
}

function randomUnlockShowCard(skin, meta) {
  if (typeof knifeUnlockQueue === "undefined" || typeof beginKnifeUnlocks !== "function") return;
  if (typeof knifeUnlocksActive === "function" && knifeUnlocksActive()) return;
  knifeUnlockQueue.length = 0;
  knifeUnlockQueue.push({
    id: skin.id,
    name: "НОВЫЙ НОЖ",
    tier: "common",
    color: meta.color,
    rarity: meta.name,
    sub: "ОТКРЫТ ЗА ЯБЛОКИ"
  });
  try { beginKnifeUnlocks(); } catch (err) {}
}

function randomUnlockKnife() {
  if (typeof knifeUnlocksActive === "function" && knifeUnlocksActive()) return;
  const pool = randomUnlockPool();
  if (!pool.length) {
    toast("ВСЕ СЛУЧАЙНЫЕ НОЖИ УЖЕ ОТКРЫТЫ");
    return;
  }
  const price = randomUnlockPrice();
  if (!spendApples(price)) {
    toast("МАЛО ЯБЛОК · НУЖНО " + price);
    randomUnlockRender();
    return;
  }
  const skin = pool[(Math.random() * pool.length) | 0];
  save.owned.push(skin.id);
  save.randBuys = Math.max(0, save.randBuys | 0) + 1;
  persist();
  syncHud();
  bookRender(true);
  randomUnlockRender();
  try { Sfx.pick(); } catch (err) {}
  if (typeof Analytics !== "undefined") {
    Analytics.purchase({ kind: "case", id: skin.id, name: "Кейс: " + skin.name, cost: price, currency: "apple" });
  }
  randomUnlockShowCard(skin, bookMetaOf(skin));
}

/* ---------- события ---------- */
if (bookCloseBtn) {
  bookCloseBtn.addEventListener("click", e => {
    e.stopPropagation();
    closeKnifeBook();
  });
}

/* Клик по тёмному столу мимо панели закрывает коллекцию — привычнее, чем
   целиться в крестик. Клики внутри панели сюда не доходят. */
if (bookOverlay) {
  bookOverlay.addEventListener("click", e => {
    if (e.target === bookOverlay) closeKnifeBook();
  });
}

/* ---------- инерционное листание мышью ----------
   Колесо и перетаскивание докручиваются сами: колесо ведёт плавную цель, drag
   отпускается с затухающей скоростью. На тач-экранах не вмешиваемся — там
   нативная инерция браузера. */
let bookGlideRaf = 0, bookGlideLast = 0, bookGlideTarget = null;
let bookFlingRaf = 0, bookFlingLast = 0, bookFlingV = 0;
let bookDragInfo = null;
let bookDragMoved = false, bookDragEndAt = 0;

function bookCancelMotion() {
  if (bookGlideRaf) cancelAnimationFrame(bookGlideRaf);
  if (bookFlingRaf) cancelAnimationFrame(bookFlingRaf);
  bookGlideRaf = 0;
  bookFlingRaf = 0;
  bookGlideTarget = null;
  bookFlingV = 0;
}

function bookScrollMax() {
  return bookScroll ? Math.max(0, bookScroll.scrollHeight - bookScroll.clientHeight) : 0;
}

function bookWheelBy(delta) {
  if (!bookIsOpen || !bookScroll) return;
  const max = bookScrollMax();
  const from = bookGlideTarget == null ? bookScroll.scrollTop : bookGlideTarget;
  bookGlideTarget = Math.max(0, Math.min(max, from + delta));
  if (bookFlingRaf) { cancelAnimationFrame(bookFlingRaf); bookFlingRaf = 0; }
  bookFlingV = 0;
  if (!bookGlideRaf) {
    bookGlideLast = performance.now();
    bookGlideRaf = requestAnimationFrame(bookGlideStep);
  }
}

function bookGlideStep(now) {
  bookGlideRaf = 0;
  if (!bookIsOpen || !bookScroll || bookGlideTarget == null) { bookGlideTarget = null; return; }
  const dt = Math.min(0.05, Math.max(0.001, (now - bookGlideLast) / 1000));
  bookGlideLast = now;
  const cur = bookScroll.scrollTop;
  const dist = bookGlideTarget - cur;
  const k = 1 - Math.exp(-dt * 17);
  let next = cur + dist * k;
  if (Math.abs(dist) < 0.7) next = bookGlideTarget;
  bookScroll.scrollTop = next;
  if (Math.abs(bookGlideTarget - next) < 0.7) { bookGlideTarget = null; return; }
  bookGlideRaf = requestAnimationFrame(bookGlideStep);
}

function bookStartFling(v) {
  if (!bookIsOpen || !bookScroll) return;
  v = Math.max(-4.5, Math.min(4.5, v || 0));
  if (Math.abs(v) < 0.05) return;
  bookCancelMotion();
  bookFlingV = v;
  bookFlingLast = performance.now();
  bookFlingRaf = requestAnimationFrame(bookFlingStep);
}

function bookFlingStep(now) {
  bookFlingRaf = 0;
  if (!bookIsOpen || !bookScroll) return;
  const dt = Math.min(0.05, Math.max(0.001, (now - bookFlingLast) / 1000));
  bookFlingLast = now;
  const max = bookScrollMax();
  /* bookFlingV — в пикселях на МИЛЛИСЕКУНДУ (так считает drag), а dt — в секундах. */
  let top = bookScroll.scrollTop + bookFlingV * dt * 1000;
  if (top <= 0) { top = 0; bookFlingV = 0; }
  else if (top >= max) { top = max; bookFlingV = 0; }
  bookScroll.scrollTop = top;
  bookFlingV *= Math.exp(-dt * 4.2);
  if (Math.abs(bookFlingV) > 0.02) bookFlingRaf = requestAnimationFrame(bookFlingStep);
  else bookFlingV = 0;
}

function bookDragDown(e) {
  if (!bookIsOpen || !bookScroll || e.button !== 0) return;
  if (e.pointerType === "touch") return; /* тач листает нативно */
  bookCancelMotion();
  bookDragMoved = false;
  bookDragInfo = {
    id: e.pointerId, x: e.clientX, y: e.clientY, top: bookScroll.scrollTop,
    lastT: performance.now(), v: 0, moved: false, captured: false
  };
  bookScroll.classList.add("dragging");
}

function bookDragMove(e) {
  const d = bookDragInfo;
  if (!d || e.pointerId !== d.id || !bookScroll) return;
  const dy = e.clientY - d.y;
  if (!d.moved && Math.abs(dy) > 6) {
    d.moved = true;
    bookDragMoved = true;
    /* Захват — только когда начался именно драг. Иначе pointer capture
       перехватывает pointerup, и обычный клик по карточке не доходит до ножа
       (из-за этого нельзя было выбрать нож). */
    try { bookScroll.setPointerCapture(e.pointerId); d.captured = true; } catch (err) {}
  }
  if (!d.moved) return;
  e.preventDefault();
  const now = performance.now();
  const dt = Math.max(1, now - d.lastT);
  const prev = bookScroll.scrollTop;
  bookScroll.scrollTop = d.top - dy;
  d.v = (bookScroll.scrollTop - prev) / dt;
  d.lastT = now;
}

function bookDragUp(e) {
  const d = bookDragInfo;
  if (!d || e.pointerId !== d.id) return;
  const moved = d.moved;
  const v = d.v;
  bookDragInfo = null;
  if (bookScroll) {
    bookScroll.classList.remove("dragging");
    if (d.captured) {
      try { bookScroll.releasePointerCapture(e.pointerId); } catch (err) {}
    }
  }
  if (moved) {
    bookDragEndAt = performance.now();
    bookStartFling(v);
    setTimeout(function () { bookDragMoved = false; }, 320);
  }
}

if (bookScroll) {
  bookScroll.addEventListener("wheel", function (e) {
    if (!bookIsOpen || e.ctrlKey) return;
    let dy = e.deltaY;
    if (!dy) return;
    if (e.deltaMode === 1) dy *= 16;
    else if (e.deltaMode === 2) dy *= bookScroll.clientHeight;
    e.preventDefault();
    bookWheelBy(dy);
  }, { passive: false });
  bookScroll.addEventListener("pointerdown", bookDragDown);
  bookScroll.addEventListener("pointermove", bookDragMove);
  bookScroll.addEventListener("pointerup", bookDragUp);
  bookScroll.addEventListener("pointercancel", bookDragUp);
  /* Ширина/высота экрана поменялись — высоты секций другие. Пересчитываем
     редко (поворот телефона, ресайз окна), после того как раскладка устоялась. */
  let bookMeasureTimer = 0;
  window.addEventListener("resize", function () {
    if (bookMeasureTimer) clearTimeout(bookMeasureTimer);
    bookMeasureTimer = setTimeout(function () {
      bookMeasureTimer = 0;
      if (!bookIsOpen) return;
      bookMeasureBlocks();
      bookFitFrames();
    }, 220);
  }, { passive: true });
}

if (bookScroll) {
  bookScroll.addEventListener("click", e => {
    /* После перетаскивания клик по карточке не должен случайно выбирать нож. */
    if (bookDragMoved || (bookDragEndAt && performance.now() - bookDragEndAt < 260)) {
      bookDragMoved = false;
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    /* «49 💎» под VIP-рамкой лежит в ленте, а не в панели действия. */
    const setBtn = e.target.closest("[data-buy-set]");
    if (setBtn) {
      e.stopPropagation();
      buyKnifeSet(setBtn.dataset.buySet);
      return;
    }
    const card = e.target.closest("[data-knife]");
    if (!card) {
      if (bookSel) {
        bookSel = "";
        bookSyncCards();
        bookActionSync();
      }
      return;
    }
    e.stopPropagation();
    bookPick(card.dataset.knife);
  });
}

if (bookActEl) {
  bookActEl.addEventListener("click", e => {
    e.stopPropagation();
    const btn = e.target.closest("button");
    if (!btn) return;
    if (btn.dataset.buySet) {
      buyKnifeSet(btn.dataset.buySet);
      return;
    }
    if (btn.dataset.adKnife) {
      const id = btn.dataset.adKnife;
      const skin = KNIFE_SKINS.find(sk => sk.id === id);
      bookSel = "";
      bookActionSync();
      if (skin) buyKnifeSet(knifePageOf(skin));
      if (skin && ownsKnife(id)) bookRender(true);
      return;
    }
    if (btn.dataset.buyKnife) {
      const id = btn.dataset.buyKnife;
      buyKnife(id);
      if (ownsKnife(id)) {
        const skin = KNIFE_SKINS.find(sk => sk.id === id);
        toast((skin ? skin.name + " · " : "") + "ОТКРЫТ");
        bookSel = "";
        bookRender();
      } else {
        bookActionSync();
      }
      return;
    }
    if (btn.dataset.actClear !== undefined) {
      bookSel = "";
      bookSyncCards();
      bookActionSync();
      if (typeof Sfx !== "undefined") Sfx.select();
    }
  });
}

if (bookUnlockEl) {
  bookUnlockEl.addEventListener("click", e => {
    e.stopPropagation();
    randomUnlockKnife();
  });
}

/* Прокрутка стрелками/PageUp/PageDown из js/input.js. */
function bookScrollBy(dir) {
  if (!bookIsOpen || !bookScroll) return;
  bookCancelMotion();
  const step = Math.max(160, Math.round(bookScroll.clientHeight * 0.85));
  bookScroll.scrollBy({ top: dir * step, behavior: "smooth" });
}

function bookScrollEdge(toTop) {
  if (!bookIsOpen || !bookScroll) return;
  bookCancelMotion();
  bookScroll.scrollTo({ top: toTop ? 0 : bookScroll.scrollHeight, behavior: "smooth" });
}

/* Совместимость с прежним именем: раньше bookTurn листал страницы книги. */
function bookTurn(dir) {
  bookScrollBy(dir);
}

bookRndRender();
randomUnlockRender();

/* Игрок уже мог набрать 3 забега в прошлой сессии — стрелка появится сразу. */
setTimeout(function () { knifeBookTourArm(); }, 1200);

/* Отладка из адресной строки: ...#booktest открывает коллекцию — так снимают
   headless-проверки. Ждём, пока игра закончит загрузку и сама откроет меню:
   иначе showMenu закроет коллекцию сразу после нашего вызова. */
if (typeof location !== "undefined" && location.hash === "#booktest") {
  (function bookDebug() {
    let tries = 0;
    const tick = function () {
      if (!window.gameBooted) {
        if (tries++ < 600) setTimeout(tick, 100);
        return;
      }
      /* showMenu уже отработал — открываемся после него, иначе он закроет */
      setTimeout(function () {
        game.apples = Math.max(game.apples | 0, 2000);
        openKnifeBook();
      }, 350);
    };
    setTimeout(tick, 200);
  })();
}
