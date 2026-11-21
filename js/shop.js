/* ---------- shop / items ---------- */
function closeSheet() {
  sheetMode = null;
  /* режим снимаем и с листа: иначе закрытый лист останется в раскладке предметов */
  sheet.removeAttribute("data-mode");
  sheet.classList.remove("open");
  sheetBack.classList.remove("on");
  sheet.setAttribute("aria-hidden", "true");
  sheet.inert = true;
}

/* ---------- построение своей очереди уровней ---------- */
function stepColor(step) {
  if (!step) return "#ccc";
  if (step.t === "boss") {
    const b = BOSSES.find(x => x.id === step.id);
    return b ? b.fill : "#888";
  }
  return (THEMES[step.id] || THEMES[0]).fill;
}

function seedSeq() {
  const seq = [];
  for (let level = 1; level <= 8; level++) seq.push(defaultStep(level));
  return seq;
}

function applySeqEdit() {
  const ang = game.log.angle;
  persist();
  if (state === "menu") {
    armFirstLog();
    game.log.angle = ang;
    game.log.from = ang;
    syncHud();
  }
}

function stepValue(step) {
  if (step && step.t === "boss") return "boss:" + step.id;
  const id = step && step.t === "wood" ? (step.id | 0) : 0;
  return "wood:" + id;
}

function stepSelect(i, step) {
  const cur = stepValue(step);
  const opts = ['<optgroup label="БРЕВНО">'];
  for (let t = 0; t < THEMES.length; t++) {
    const v = "wood:" + t;
    opts.push(`<option value="${v}"${v === cur ? " selected" : ""}>БРЕВНО · ${THEMES[t].name}</option>`);
  }
  opts.push("</optgroup>");
  for (const tier of BOSS_TIERS) {
    const pool = BOSSES.filter(b => bossTierOf(b) === tier.id);
    if (!pool.length) continue;
    opts.push(`<optgroup label="${tier.name}">`);
    for (const b of pool) {
      const v = "boss:" + b.id;
      const lbl = tier.id === "common" ? b.name : b.name + " · " + bossWindowLabel(b);
      opts.push(`<option value="${v}"${v === cur ? " selected" : ""}>${lbl}</option>`);
    }
    opts.push("</optgroup>");
  }
  return `<select class="lvl-select" data-seq-set="${i}" aria-label="Уровень ${i + 1}">${opts.join("")}</select>`;
}

function renderLevelEditor() {
  const on = !!save.seqOn;
  const seq = save.seq || [];
  const bits = ['<div class="lvl-editor">'];
  bits.push('<div class="sheet-note">Своя очередь уровней: каждая строка — следующий уровень. В строке выбери бревно или босса.</div>');
  bits.push('<div class="lvl-actions">');
  if (on) bits.push('<button class="card-btn ghost" type="button" data-seq-off>КАК ОБЫЧНО</button>');
  else bits.push('<button class="card-btn" type="button" data-seq-on>СВОЯ ОЧЕРЕДЬ</button>');
  bits.push('<button class="card-btn ghost" type="button" data-seq-clear>ОЧИСТИТЬ</button>');
  bits.push("</div>");
  if (!on) {
    bits.push('<div class="lvl-empty">Сейчас уровни идут как обычно: бревно по стадиям, каждый 5-й — босс. Включи «Своя очередь», чтобы собрать свою последовательность.</div>');
  } else if (!seq.length) {
    bits.push('<div class="lvl-empty">Очередь пуста. Добавь первый уровень.</div>');
  } else {
    bits.push('<div class="lvl-list">');
    for (let i = 0; i < seq.length; i++) {
      const step = seq[i];
      bits.push(`<div class="lvl-row">
        <span class="lvl-n">${i + 1}</span>
        <span class="lvl-swatch" style="background:${stepColor(step)}"></span>
        ${stepSelect(i, step)}
        <button class="lvl-mini" type="button" data-seq-del="${i}" aria-label="Удалить уровень ${i + 1}">✕</button>
      </div>`);
    }
    bits.push("</div>");
  }
  if (on) {
    const full = seq.length >= SEQ_MAX;
    bits.push(`<button class="card-btn lvl-add" type="button" data-seq-add ${full ? "disabled" : ""}>${full ? "МАКСИМУМ " + SEQ_MAX : "ДОБАВИТЬ УРОВЕНЬ"}</button>`);
  }
  bits.push("</div>");
  return bits.join("");
}

function mutateSeq(fn) {
  save.seqOn = true;
  save.seq = sanitizeSeq(save.seq);
  fn();
  save.seq = sanitizeSeq(save.seq);
  applySeqEdit();
  const top = sheetBody.scrollTop;
  renderSheet();
  sheetBody.scrollTop = top;
}

function openSheet(mode) {
  Sfx.ensure();
  /* В доке меню: уровни, предметы, боссы, генератор и статистика. «Ножи» —
     это не лист, а книга на столе во весь экран (js/knife-book.js), а таблица
     лидеров — своё полноэкранное окно (js/leaderboard.js: openLbMenu). */
  if (mode !== "shop" && mode !== "levels" && mode !== "bosses" && mode !== "gen" && mode !== "stats") mode = "items";
  if (mode === "items" && typeof openKnifeBook === "function") {
    openKnifeBook();
    return;
  }
  sheetMode = mode;
  sheet.dataset.mode = mode;
  sheetTitle.textContent = mode === "shop" ? "Магазин"
    : mode === "levels" ? "Уровни"
    : mode === "bosses" ? "Боссы"
    : mode === "gen" ? "Генератор"
    : mode === "stats" ? "Статистика"
    : "Витрина";
  if (mode === "gen" && (!bossGenRows || !bossGenRows.length)) rollBossGen();
  renderSheet();
  sheetBack.classList.add("on");
  sheet.classList.add("open");
  sheet.setAttribute("aria-hidden", "false");
  sheet.inert = false;
}

/* ---------- инвентарь и ножи ---------- */

/* Надеть нож — отдельное действие, а не побочный эффект клика по превью: иначе
   промах по плитке срывал бы игрока в забег. */
function equipKnife(id) {
  if (!ownsKnife(id)) return false;
  save.knife = id;
  /* Выбрали конкретный нож — рандомизатор снимается: он ведёт себя как
     отдельный нож (js/knife-book.js: save.rnd), и надеть его обратно можно
     только кнопкой 🎲. Свой список очереди при этом НЕ чистится. */
  save.rnd = false;
  persist();
  renderLoadout();
  return true;
}

/* Кнопка «ИГРАТЬ» — единственное место, откуда нож пускает забег: она стоит в
   магазине, а в листе предметов нож надевает сама плитка и забег не начинает.
   Забег начинается с ножом в руке — сам он не бросается (см. startRun). */
function playKnife(id) {
  if (!equipKnife(id)) return;
  closeSheet();
  if (state === "menu") startRun();
}

/* Списание яблок в одном месте: с открытой чит-кнопкой (save.inf) кошелёк не
   уменьшается, но покупка проходит как обычно — иначе «бесконечных» яблок
   хватило бы ровно до конца числа. */
function spendApples(n) {
  if (save.inf) return true;
  if (game.apples < n) return false;
  game.apples -= n;
  save.appleSpent = (save.appleSpent | 0) + Math.max(0, Math.floor(+n) || 0);
  return true;
}

function buyItem(id) {
  const it = SHOP_ITEMS.find(x => x.id === id);
  if (!it || !spendApples(it.price)) return;
  save.items[id] = itemCount(id) + 1;
  persist();
  syncHud();
  renderSheet();
  Sfx.pick();
  if (typeof Analytics !== "undefined") {
    Analytics.purchase({ kind: "item", id: it.id, name: it.name || it.id, cost: it.price, currency: "apple" });
  }
}

function buyKnife(id) {
  const skin = KNIFE_SKINS.find(k => k.id === id);
  if (!skin || !skin.price || ownsKnife(id) || !spendApples(skin.price)) return;
  save.owned.push(id);
  persist();
  syncHud();
  renderSheet();
  Sfx.pick();
  if (typeof Analytics !== "undefined") {
    Analytics.purchase({ kind: "knife", id: skin.id, name: skin.name, cost: skin.price, currency: "apple" });
  }
}

/* VIP-ножи продаются ТОЛЬКО набором: один набор коллекции — 49 💎.
   Индивидуальной покупки нет. */
function buyVipKnifeSetFor(id) {
  const skin = KNIFE_SKINS.find(k => k.id === id);
  if (!skin || !skin.ad) return false;
  if (ownsKnife(id)) return false;
  if (typeof buyKnifeSet !== "function") return false;
  buyKnifeSet(knifePageOf(skin));
  return ownsKnife(id);
}

/* Чит-кнопка дока (index.html: cheatBtn): разом открывает всё, что можно
   открыть, — все ножи (покупные, за рекламу и боссовы), кладёт полный запас
   предметов и включает бесконечные яблоки. Нажатие безопасно повторять:
   запас предметов берётся «не меньше, чем уже есть», а кошелёк не обнуляется.
   Выключить чит можно кнопкой сброса прогресса (js/input.js: resetProgress). */
function cheatUnlockAll() {
  save.owned = KNIFE_IDS.slice();
  if (!save.owned.includes("classic")) save.owned.unshift("classic");
  if (!KNIFE_IDS.includes(save.knife)) save.knife = "classic";
  if (!save.items || typeof save.items !== "object") save.items = {};
  for (const it of SHOP_ITEMS) save.items[it.id] = Math.max(CHEAT_ITEMS, itemCount(it.id));
  save.inf = true;
  game.apples = Math.max(game.apples | 0, CHEAT_APPLES);
  persist();
  hudSnap = "";
  loadoutSnap = "";
  syncHud();
  if (sheetMode) renderSheet();
  if (typeof knifeBookRefresh === "function") knifeBookRefresh();
  Sfx.pick();
  toast("ВСЁ ОТКРЫТО · НОЖИ, ПРЕДМЕТЫ И БЕСКОНЕЧНЫЕ ЯБЛОКИ");
}

function toggleItem(id) {
  if (itemCount(id) <= 0) return;
  save.loadout[id] = !save.loadout[id];
  persist();
  renderLoadout();
  renderSheet();
}

/* Отдельного «ножа за рекламу» больше нет: VIP-ножи продаются только
   набором за 49 💎. Функция удалена намеренно, чтобы её нельзя было вызвать
   из консоли и открыть один нож бесплатно. */

/* Кнопка в карточке ножа: у открытого — «ИГРАТЬ» (надевает и пускает забег),
   у покупного в магазине — цена, у рекламного — ролик, у остальных — куда идти
   за ножом. */
function knifeButton(skin, inShop) {
  if (ownsKnife(skin.id)) {
    const eq = knifeEquipped(skin.id);
    return `<button class="card-btn${eq ? "" : " ghost"}" type="button" data-knife-play="${skin.id}">${eq ? "ИГРАТЬ" : "ИГРАТЬ ЭТИМ"}</button>`;
  }
  if (skin.ad && inShop) {
    return `<button class="card-btn" type="button" data-buy-set="${knifePageOf(skin)}">НАБОР · ${KNIFE_SET_PRICE} 💎</button>`;
  }
  if (skin.price && inShop) {
    const poor = game.apples < skin.price;
    return `<button class="card-btn" data-buy-knife="${skin.id}" ${poor ? "disabled" : ""}>${poor ? "МАЛО ЯБЛОК" : "КУПИТЬ · " + skin.price}</button>`;
  }
  if (skin.price) return `<button class="card-btn ghost" type="button" data-goto-shop>В МАГАЗИН</button>`;
  return `<button class="card-btn" type="button" disabled>ЗАКРЫТ</button>`;
}

/* Одна строка описания ножа: своя подпись, иначе стартовый или имя босса. */
function knifeBlurb(skin) {
  const boss = BOSSES.find(b => b.id === skin.id);
  return skin.blurb || (skin.id === "classic" ? "стартовый" : (boss ? "босс · " + boss.name : ""));
}

/* Карточка ножа в магазине: превью, имя, редкость и кнопка — у открытого
   «ИГРАТЬ», у покупного цена. Клик по превью ничего не пускает. */
function knifeCard(skin, inShop) {
  const owned = ownsKnife(skin.id);
  const blurb = knifeBlurb(skin);
  const meta = owned
    ? (knifeEquipped(skin.id) ? "НАДЕТ" : "ОТКРЫТ")
    : (skin.price ? (skin.price + " ЯБЛОК") : skin.ad ? ("НАБОР · " + KNIFE_SET_PRICE + " 💎") : "ПОБЕДИ БОССА");
  return `<div class="card ${knifeEquipped(skin.id) ? "eq" : ""} ${owned ? "" : "locked"}">
    <canvas data-knife="${skin.id}" width="180" height="500"></canvas>
    <div class="card-name">${skin.name}</div>
    <div class="card-desc">${blurb}</div>
    <div class="card-meta">${meta}</div>
    ${knifeButton(skin, inShop)}
  </div>`;
}

function itemButtons(it) {
  const n = itemCount(it.id);
  const poor = game.apples < it.price;
  const buy = `<button class="card-btn" data-buy-item="${it.id}" ${poor ? "disabled" : ""}>${poor ? "МАЛО ЯБЛОК" : "КУПИТЬ · " + it.price}</button>`;
  if (n <= 0) return buy;
  const on = !!save.loadout[it.id];
  return buy + `<button class="card-btn ${on ? "" : "ghost"}" data-toggle-item="${it.id}">${on ? "СНЯТЬ" : "НАДЕТЬ"}</button>`;
}

/* ---------- меню предметов: страницы по редкостям, без прокрутки ----------
   Одна страница — одна редкость (если ножей слишком много, редкость
   продолжается на следующей странице). Сетка ужимается под высоту листа,
   поэтому ни лист, ни плитки никогда не прокручиваются. */
/* Первая страница — «хлам»: двенадцать бытовых ножей из images/knifes/none
   на серых витринах — картинки из images/knifes/none, а справа от каждой
   стоят на одной странице сеткой 2×2, боссовых ножей здесь нет. Остальные
   страницы — по редкостям, а ножи за рекламу — отдельной страницей VIP
   в самом конце. */
const ITEM_PAGES = ["junk"].concat(BOSS_TIERS.map(t => t.id), ["vip", "okean", "poker", "carnival", "motosport", "medieval", "konfety", "west", "monsters", "demons", "space", "memes"]);
const ITEM_PAGE_NAMES = {
  junk: "ХЛАМ",
  rarelegend: "РЕДКИЕ И ЛЕГЕНДАРНЫЕ",
  none: "КЛАССИЧЕСКИЕ",
  old: "СТАРЫЕ",
  arpho: "АРФОЭПИЧЕСКИЕ",
  lost: "ПОТЕРЯННЫЕ",
  common: "ОБЫЧНЫЕ",
  rare: "РЕДКИЕ",
  legend: "ЛЕГЕНДАРНЫЕ",
  secret: "ТАЙНЫЕ",
  vip: "VIP",
  okean: "МОРСКИЕ",
  poker: "ПОКЕР",
  carnival: "КАРНАВАЛ",
  motosport: "МОТОСПОРТ",
  medieval: "СРЕДНЕВЕКОВЬЕ",
  konfety: "КОНФЕТЫ",
  west: "ДИКИЙ ЗАПАД",
  monsters: "МОНСТРЫ",
  demons: "ДЕМОНИЧЕСКАЯ",
  space: "КОСМИЧЕСКАЯ",
  memes: "МЕМНАЯ"
};
/* Цвета страниц заданы жёстко, в том числе для редкостей: тайные всегда красные,
   сиреневый — только у легендарных, потерянные — оранжевые. Раньше редкости
   брали цвет из BOSS_TIERS, и тайная страница могла покраситься легендарным
   сиреневым. */
const ITEM_PAGE_COLORS = {
  junk: "#8a8175", rarelegend: "#ffd23f", vip: "#f0b13c", okean: "#3fc8e8", poker: "#d0433f",
  carnival: "#ff5fa2",
  motosport: "#3ad07a",
  medieval: "#e0b040",
  konfety: "#ff8ac8",
  west: "#e0902a",
  monsters: "#a558ff",
  demons: "#ff4a2a",
  space: "#8a7aff",
  memes: "#ffb03a",
  old: "#c9a227", none: "#b8a06a", arpho: "#63d6e8", lost: "#ff8a1e",
  common: "#cdc6b8", rare: "#ffd23f", legend: "#c07cff", secret: "#ff4444"
};

function itemPageMeta(id) {
  return {
    id: id,
    name: ITEM_PAGE_NAMES[id] || bossTierMeta(id).name,
    color: ITEM_PAGE_COLORS[id] || bossTierMeta(id).color
  };
}

/* Ножи по страницам. Боссовым — ступень редкости; рекламные — VIP; у «хлама»
   страница прописана в самом скине (page: "junk"); всё остальное (стартовый и
   покупные за яблоки) — классика. */
/* Витрина второго ножа босса: id у него свой, а босс записан в skin.boss
   (js/knife-skins.js: kokos, fen). У обычных ножей босса они совпадают. */
function knifeOwnerBoss(skin) {
  if (!skin) return null;
  return BOSSES.find(b => b.id === (skin.boss || skin.id)) || null;
}

function knifePageOf(skin) {
  if (skin.page) return skin.page;
  if (skin.ad) return "vip";
  const boss = knifeOwnerBoss(skin);
  if (boss) {
    const tier = bossTierOf(boss);
    return tier === "rare" || tier === "legend" ? "rarelegend" : tier;
  }
  return "none";
}

function itemsPageEntries(page) {
  if (page === "rarelegend:rare" || page === "rarelegend:legend") {
    const wanted = page.endsWith(":rare") ? "rare" : "legend";
    const entries = KNIFE_SKINS.filter(sk => {
      const boss = knifeOwnerBoss(sk);
      if (!boss) return false;
      return bossTierOf(boss) === wanted;
    }).map(sk => ({ kind: "knife", skin: sk }));
    return entries;
  }
  const entries = KNIFE_SKINS
    .filter(sk => knifePageOf(sk) === page)
    .map(sk => ({ kind: "knife", skin: sk }));
  const order = sk => KNIFE_SKINS.indexOf(sk);
  if (page === "none") {
    entries.sort((a, b) => (a.skin.id === "classic" ? -1 : b.skin.id === "classic" ? 1 : order(a.skin) - order(b.skin)));
  } else if (page === "classic") {
    entries.sort((a, b) => (a.skin.price || 0) - (b.skin.price || 0) || order(a.skin) - order(b.skin));
  } else if (page === "vip" || page === "junk" || page === "okean" || page === "poker" || page === "carnival" || page === "motosport" || page === "medieval" || page === "konfety" || page === "west" || page === "monsters" || page === "demons" || page === "space" || page === "memes") {
    entries.sort((a, b) => order(a.skin) - order(b.skin));
  } else {
    const win = e => {
      const boss = knifeOwnerBoss(e.skin);
      return boss ? bossWindowOf(boss) : [page, 99, 99];
    };
    entries.sort((a, b) => {
      const wa = win(a), wb = win(b);
      return wa[1] - wb[1] || wa[2] - wb[2] || order(a.skin) - order(b.skin);
    });
  }
  return entries;
}

function itemsKey(e) {
  return "knife:" + e.skin.id;
}

/* Сколько ножей ставим в ряд. Витрина теперь тянется на всю ширину окна, так
   что ряды делаем покороче: меньше столбцов — крупнее ножи. Значения совпадают
   с медиазапросами в style.css. */
function itemsCols() {
  const w = window.innerWidth || 420;
  return w >= 760 ? 8 : w >= 560 ? 6 : 4;
}

/* Витрины: одна редкость — одна витрина, ножи лежат в один ряд на красной
   ткани. На странице не больше двух витрин: тогда ножи крупные, а витрины
   растягиваются на всё окно до краёв. У «хлама» своя раскладка — см. ниже. */
const TRAY_MAX = 2;
const JUNK_PAGE = "junk";
const JUNK_TRAY_N = 3;   /* обычные ножи — витрины по три: 12 ножей = 4 витрины */
const VIP_MINI_N = 4;    /* сколько вип-ножей уходит в минивитрины */

/* Одиночный нож на первой странице: стартовая «классика» стоит на своём
   синем бархате вместо серой полки с хламом. */
function heroEntry() {
    const list = itemsPageEntries("none");
  return list.find(e => e.skin.id === "classic") || list[0] || null;
}

/* «Хлам»: делим двенадцать ножей на витрины по четыре, не подгоняя под ширину
   окна — иначе на широком экране все двенадцать улеглись бы в две витрины
   и жёлтым витринам не осталось бы места. */
function junkTrays() {
  const entries = itemsPageEntries(JUNK_PAGE);
  const trays = [];
  for (let i = 0; i < entries.length; i += JUNK_TRAY_N) {
    trays.push({ page: JUNK_PAGE, entries: entries.slice(i, i + JUNK_TRAY_N) });
  }
  return trays;
}

/* Вип-ножи для минивитрин: те, у кого в скине стоит mini: true. */
function vipMiniEntries() {
  const out = [];
  for (const e of itemsPageEntries("vip")) {
    if (e.skin.mini && out.length < VIP_MINI_N) out.push(e);
  }
  return out;
}

function itemsPages() {
  const cols = itemsCols();
  const pages = [];
  let cur = null;
  for (const page of ITEM_PAGES) {
    if (page === JUNK_PAGE) {
      /* Обычные ножи — только из images/knifes/none: витрины по три ножа,
         по две витрины на страницу (12 ножей = 4 витрины = 2 страницы). Справа от каждой витрины стоит золотая
         минивитрина с одним VIP-ножом (картинки из images/knifes/vip).
         Раскладка страницы — 2×2: .ipg-stage.grid2 (style.css). */
      const trays = junkTrays();
      const vips = vipMiniEntries();
      let vi = 0;
      for (let i = 0; i < trays.length; i += 2) {
        const pageTrays = [];
        for (let k = 0; k < 2 && i + k < trays.length; k++) {
          pageTrays.push(trays[i + k]);
          if (vi < vips.length) {
            pageTrays.push({ page: "vip", entries: [vips[vi++]], mini: true });
          }
        }
        pages.push({ key: String(pages.length + 1), trays: pageTrays });
      }
      /* Страница «хлама» закрыта: следующая редкость начнёт новую. */
      cur = null;
      continue;
    }
    /* VIP-ножи — отдельной страницей: хвост предыдущей редкости не должен
       подцепить их к себе. */
    if (page === "vip" || page === "okean" || page === "poker" || page === "carnival" || page === "motosport" || page === "medieval" || page === "konfety" || page === "west" || page === "monsters" || page === "demons" || page === "space" || page === "memes") cur = null;
    /* Классика стоит на своей странице. VIP-ножи уже показаны золотыми
       минивитринами справа от витрин с обычными ножами — второй раз их
       не выводим. */
    const entries = itemsPageEntries(page)
      .filter(e => !(page === "vip" && e.skin.mini));
    if (!entries.length) continue;
    /* Третья страница (классика): старые ножи с витрины убраны, остаётся
       один обычный нож, и витрина у него синяя. */
    if (page === "classic") {
      const plain = entries.find(e => e.skin.id === "classic") || entries[0];
      const trays = [{ page: page, entries: [plain], blue: true }];
      pages.push({ key: String(pages.length + 1), trays: trays });
      cur = null;
      continue;
    }
    /* Ножи одной редкости делим на витрины поровну: 6 ножей при 5 столбцах —
       это две витрины по 3, а не полная и сирота с одним ножом. */
    const trays = Math.ceil(entries.length / cols);
    const per = Math.ceil(entries.length / trays);
    for (let i = 0; i < entries.length; i += per) {
      if (!cur || cur.trays.length >= TRAY_MAX) {
        cur = { key: String(pages.length + 1), trays: [] };
        pages.push(cur);
      }
      cur.trays.push({ page: page, entries: entries.slice(i, i + per) });
    }
  }
  /* Под синей витриной (3-я страница) должна лежать верхняя витрина
     следующей редкости. Дальше то же правило для всех страниц: страница
     не остаётся с одной витриной — недостающую подтягиваем сверху со
     следующей, порядок витрин при этом не меняется. */
  const blueAt = pages.findIndex(p => p.trays.some(t => t.blue));
  if (blueAt >= 0 && pages[blueAt + 1]) {
    const donor = pages[blueAt + 1];
    if (donor.trays.length) pages[blueAt].trays.push(donor.trays.shift());
    if (!donor.trays.length) pages.splice(blueAt + 1, 1);
  }
  for (let i = 0; i < pages.length - 1; i++) {
    while (pages[i + 1] && pages[i].trays.length < 2) {
      pages[i].trays.push(pages[i + 1].trays.shift());
      if (!pages[i + 1].trays.length) pages.splice(i + 1, 1);
    }
  }
  /* Никаких «убрать шестую страницу»: тайные ножи теперь живут на своей
     витрине в конце, и обрезать хвост нельзя — иначе они просто исчезают */
  return pages;
}

function itemsGoTo(key) {
  const pages = itemsPages();
  const next = pages.findIndex(p => p.key === key);
  if (next < 0) return;
  const prev = pages.findIndex(p => p.key === itemsPage);
  /* Направление листания запоминаем до перерисовки: по нему страница
     влетает нужной стороной (style.css: .ipg.flip-next/.flip-prev). */
  itemsFlipDir = prev === next ? 0 : (next > prev ? 1 : -1);
  itemsPage = key;
  renderSheet();
}

function itemsStep(dir) {
  const pages = itemsPages();
  const i = pages.findIndex(p => p.key === itemsPage);
  const next = pages[i + dir];
  if (next) itemsGoTo(next.key);
}

function itemsSelEntry(entries) {
  for (const e of entries) if (itemsKey(e) === itemsSel) return e;
  return null;
}

/* Панель действия под сеткой: у выбранного закрытого ножа — цена и покупка,
   у рекламного — ролик. У боссовых ножей покупки нет: их даёт только победа. */
function itemsAction(e) {
  if (!e || e.kind !== "knife") return "";
  const skin = e.skin;
  if (ownsKnife(skin.id)) return "";
  if (skin.ad) {
    const page = knifePageOf(skin);
    const poor = (save.rubles | 0) < KNIFE_SET_PRICE;
    return `<div class="ipg-price">НАБОР · 💎 ${KNIFE_SET_PRICE}</div>
      <button class="ipg-buy" type="button" data-buy-set="${page}"${poor ? " disabled" : ""}>${poor ? "МАЛО АЛМАЗОВ" : "КУПИТЬ НАБОР"}</button>`;
  }
  /* Любой нож с ценой покупается за яблоки — и в листе, и в коллекции.
     Раньше условие пускало только страницы classic/junk, из-за чего нож
     с ценой в книге показывал её, но не давал купить. */
  if (skin.price) {
    const poor = game.apples < skin.price;
    return `<div class="ipg-price">${appleIconHtml()} ${skin.price}</div>
      <button class="ipg-buy" type="button" data-buy-knife="${skin.id}"${poor ? " disabled" : ""}>${poor ? "МАЛО ЯБЛОК" : "КУПИТЬ"}</button>`;
  }
  return "";
}

/* Маска для VIP-полосок: PNG запечённого ножа (alpha = форма клинка).
   Кешируем по id — перерисовка листа не должна каждый раз собирать PNG. */
const knifeMaskUrls = Object.create(null);
function knifeMaskUrl(skin) {
  if (knifeMaskUrls[skin.id]) return knifeMaskUrls[skin.id];
  let url = skin.src || "";
  const src = assets.knives && assets.knives[skin.id];
  if (src && src.toDataURL) {
    try { url = src.toDataURL("image/png"); } catch (err) { /* остаётся файл скина */ }
  }
  knifeMaskUrls[skin.id] = url;
  return url;
}

/* Нож на витрине: стоит на полке, без имени. Закрытый нож залит цветом
   редкости (силуэт), поэтому рисунок не разглядеть. У VIP-ножей поверх
   силуэта или картинки бегут чёрно-белые полоски — как лента эскалатора. */
function itemsTile(e, sel) {
  const key = itemsKey(e);
  const skin = e.skin;
  const owned = ownsKnife(skin.id);
  const eq = knifeEquipped(skin.id);
  const page = knifePageOf(skin);
  const meta = itemPageMeta(page);
  /* «shop» только там, где покупка или ролик действительно есть: у боссового
     ножа цена может остаться в данных, но в листе он всё равно закрыт. */
  const sellable = page === "classic" || page === "vip" || page === "junk";
  const st = eq ? "eq" : owned ? "own" : sellable ? "shop" : "lock";
  const cls = "vslot" + (eq ? " eq" : "") + (key === sel ? " sel" : "") +
    (page === "vip" ? " vip" : "") + (owned ? " own" : " locked");
  const hint = eq ? "надет" : owned ? "открыт" : skin.ad ? "за рекламу" : skin.price ? "за " + skin.price + " яблок" : "победи босса";
  /* Имя ножа осталось только в aria-label: на плитке и в подсказке — иконка
     и действие. Подпись всегда принадлежит показанному ножу, а не боссу. */
  const tip = hint;
  const label = skin.name;
  /* Закрытый VIP-нож показываем обычной цветной картинкой — и в магазине,
     и в коллекционных наборах: игрок должен видеть, как нож выглядит, ещё до
     покупки. Чёрно-белую «ленту» убрали совсем. */
  const vipPage = page === "vip" || !!BOOK_FRAMES[page];
  const silhouette = owned || vipPage ? "" : ` data-silhouette="${meta.color}"`;
  /* Ярлык на полке: у открытого ножа его нет, у закрытого — цена или замок,
     у рекламного — ролик. Сам нож подписан только в подсказке. */
  const tag = eq || owned ? "" : skin.ad ? "📺" : skin.price ? appleIconHtml() + " " + skin.price : "🔒";
  return `<button class="${cls}" style="--tc:${meta.color}" type="button" data-items-pick="${key}" data-st="${st}" title="${label} · ${tip}" aria-label="${label} · ${tip}">
    <span class="vslot-art islot-art">
      <canvas data-knife="${skin.id}"${silhouette} width="${KNIFE_SRC_W}" height="${KNIFE_SRC_H}"></canvas>
      ${eq ? '<span class="islot-eq">✓</span>' : ""}
    </span>
    ${tag ? `<span class="vslot-tag">${tag}</span>` : ""}
  </button>`;
}

function renderItemsEditor() {
  const pages = itemsPages();
  if (!pages.length) return '<div class="ipg"><div class="ipg-empty">Ножи не найдены</div></div>';
  let idx = pages.findIndex(p => p.key === itemsPage);
  if (idx < 0) idx = 0;
  const cur = pages[idx];
  itemsPage = cur.key;
  const meta = itemPageMeta(cur.trays[0].page);
  const all = [];
  for (const t of cur.trays) for (const e of t.entries) all.push(e);
  const dots = pages.map((p, i) => {
    const on = p.key === cur.key;
    return `<button class="ipg-dot${on ? " on" : ""}" type="button" ` +
      `data-ipg-go="${p.key}" aria-label="Витрины ${i + 1}"` +
      `${on ? ' aria-current="true"' : ""}></button>`;
  }).join("");
  /* Направление листания задаёт сторону влёта новой страницы. */
  const flip = itemsFlipDir;
  itemsFlipDir = 0;
  const bits = [];
  bits.push(`<div class="ipg${flip > 0 ? " flip-next" : flip < 0 ? " flip-prev" : ""}">`);
  bits.push(
    '<div class="ipg-head">' +
      `<button class="ipg-arrow" type="button" data-ipg-prev="1" aria-label="Предыдущая страница"${idx === 0 ? " disabled" : ""}>‹</button>` +
      `<div class="ipg-title" style="--sc:${meta.color}"><span>ВИТРИНЫ</span>` +
        `<em class="ipg-count">${idx + 1} / ${pages.length}</em></div>` +
      `<button class="ipg-arrow" type="button" data-ipg-next="1" aria-label="Следующая страница"${idx === pages.length - 1 ? " disabled" : ""}>›</button>` +
    "</div>"
  );
  /* Витрины страницы: каждая — рамка с бархатом, ножи лежат в один ряд.
     Ширина считается по числу ножей (--n), поэтому пустого поля по краям
     нет. На табличке — редкость и сколько ножей из неё открыто. У «хлама»
     ткань серая (style.css: .vtray.junk). Четыре витрины (страница «хлама»)
     в строку не влезают — им сетка 2×2 (style.css: .ipg-stage.grid2). */
  const grid2 = cur.trays.length > 2;
  /* Страницы «хлама»: обычная витрина занимает 3/4 ширины, а золотая
     минивитрина с VIP-ножом — 1/4. Без этого сетка 2×2 делила строку
     пополам и вип-нож занимал половину, как обычная витрина. */
  const miniRow = grid2 && cur.trays.some(t => t.mini);
  /* Синяя витрина стоит одна в строке, а перенесённая витрина — под ней:
     одна колонка вместо ряда. */
  const blueUnder = cur.trays.some(t => t.blue) && cur.trays.length > 1;
  const gridStyle = blueUnder
    ? ' style="display:grid;grid-template-columns:1fr;grid-template-rows:1fr 1fr;' +
      'gap:8px;height:100%;align-content:stretch"'
    : (miniRow ? ' style="grid-template-columns: 3fr 1fr"' : "");
  /* В одну колонку витрины иначе сжимаются до контента — тянем их на всю
     высоту, как в сетке 2×2. */
  const fillTray = blueUnder ? ";height:auto;max-height:none" : "";
  bits.push(`<div class="ipg-stage${grid2 ? " grid2" : ""}"${gridStyle}>`);
  for (const t of cur.trays) {
    const tm = itemPageMeta(t.page);
    const tOwn = t.entries.filter(e => ownsKnife(e.skin.id)).length;
    const tCls = "vtray" + (t.page === JUNK_PAGE ? " junk" : "") +
      (t.hero ? " hero" : "") + (t.mini ? " mini" : "");
    /* Синяя витрина (страница с обычным ножом): цвет задаём inline —
       style.css не трогаем, ткань и рамку перебиваем на месте. */
    const tBlue = t.blue
      ? ";--tc:#5aa0f0;background:#1e4f92;border-color:#5aa0f0;" +
        "box-shadow:inset 0 0 0 1px rgba(130,185,255,0.6)"
      : "";
    bits.push(`<div class="${tCls}" style="--tc:${tm.color};--n:${t.entries.length}${tBlue}${fillTray}">`);
    bits.push('<div class="vtray-head"><span class="vtray-tag">' +
      tm.name + ' · ' + tOwn + '/' + t.entries.length + '</span></div>');
    bits.push(t.blue ? '<div class="vtray-grid" style="background:#1e4f92">' : '<div class="vtray-grid">');
    for (const e of t.entries) bits.push(itemsTile(e, itemsSel));
    bits.push("</div></div>");
  }
  bits.push("</div>");
  bits.push(`<div class="ipg-dots">${dots}</div>`);
  bits.push('<div class="ipg-act">' + itemsAction(itemsSelEntry(all)) + "</div>");
  bits.push("</div>");
  return bits.join("");
}

/* ---------- генератор боссов ----------
   Крутит тот же pickBossFor, что и забег, но во временный чёрный список —
   сейв и текущий забег не трогает. Нужен, чтобы глазами проверить пул и
   редкости на длинной ленте стадий. */
const BOSS_GEN_N = 48;
let bossGenRows = [];

function rollBossGen(n) {
  const count = Math.max(1, (n | 0) || BOSS_GEN_N);
  /* Свой временный мешок: лента не трогает ни сейв, ни настоящий мешок игрока */
  const savedBag = bossBagAll();
  const savedPity = game.bossGroup2Pct;
  const savedDry = game.bossGroup2Dry;
  const savedTopDry = game.bossLegendDry;
  const savedSecretDry = game.bossSecretDry;
  const savedMiss = game.bossMiss;
  bossBagCache = {};
  bossBagMute = true;
  game.bossGroup2Pct = BOSS_GROUP2_BASE;
  game.bossGroup2Dry = 0;
  game.bossLegendDry = 0;
  game.bossSecretDry = 0;
  game.bossMiss = {};
  const rows = [];
  try {
    for (let ord = 1; ord <= count; ord++) {
      const pity = bossGroup2Chance();
      const boss = pickBossFor(ord);
      const tier = bossTierOf(boss);
      const meta = bossTierMeta(tier);
      rows.push({
        ord: ord,
        id: boss.id,
        name: boss.name,
        tier: tier,
        tierName: meta.name,
        color: meta.color,
        pity: pity
      });
    }
  } finally {
    bossBagCache = savedBag;
    bossBagMute = false;
    game.bossGroup2Pct = savedPity;
    game.bossGroup2Dry = savedDry;
    game.bossLegendDry = savedTopDry;
    game.bossSecretDry = savedSecretDry;
    game.bossMiss = savedMiss;
  }
  bossGenRows = rows;
  return rows;
}

function renderBossGen() {
  const rows = bossGenRows && bossGenRows.length ? bossGenRows : rollBossGen();
  const bits = [];
  bits.push('<div class="gen-panel">');
  bits.push('<div class="sheet-note">Рандомный забег: пул стадии и pity группы 2 как в игре (' +
    bossTierOddsText() + '). Внутри группы 2: ' + bossRareSplitText() +
    '. Чёрный список и pity внутри ленты свои — текущий прогресс не меняется.</div>');
  bits.push('<div class="gen-actions">');
  bits.push('<button class="card-btn" type="button" data-gen-roll="1">СГЕНЕРИРОВАТЬ</button>');
  bits.push('<span class="gen-count">' + rows.length + ' стадий</span>');
  bits.push('</div>');
  bits.push('<div class="gen-list">');
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const pity = r.pity != null ? (Math.round(r.pity * 10) / 10).toFixed(1).replace(".", ",") : "";
    bits.push(
      '<div class="gen-row" data-tier="' + r.tier + '">' +
        '<span class="gen-ord">' + r.ord + '</span>' +
        '<span class="gen-name">' + r.name + '</span>' +
        '<span class="gen-pity" title="шанс группы 2 до броска">' + pity + '%</span>' +
        '<span class="gen-tier" style="color:' + r.color + '">' + r.tierName + '</span>' +
      '</div>'
    );
  }
  bits.push('</div></div>');
  return bits.join("");
}

/* Вкладки «Ножи» больше нет: весь набор разложен плитками в листе предметов,
   а покупка и открытие за ролик остались в листе магазина. */

/* ---------- «дыхание» ножей ----------
   Ножи ходят вверх-вниз и покачиваются, каждый по-своему: амплитуды, скорости
   и фазы считаем псевдослучайно из id ножа (xorshift32). Набор детерминированный,
   поэтому один и тот же нож дышит одинаково и на витрине, и в книге (js/knife-book.js
   берёт те же параметры), а после перерисовки продолжает с того же места.
   Фазу считаем от общих часов (performance.now/секунды), а не от рождения узла:
   лист предметов и книга перерисовываются на каждый выбор и на каждый переворот
   страницы, и анимация, привязанная к узлу, начиналась бы заново — нож дёргался. */
const KNIFE_SWAY = new Map();

function knifeSwayParams(id) {
  let p = KNIFE_SWAY.get(id);
  if (p) return p;
  /* Затравка из id (FNV-1a), дальше xorshift32: свои случайные числа на нож. */
  let s = 2166136261 >>> 0;
  for (let i = 0; i < id.length; i++) s = Math.imul(s ^ id.charCodeAt(i), 16777619) >>> 0;
  if (!s) s = 0x9e3779b9;
  const rnd = () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
  p = {
    bob: 2.5 + rnd() * 4,             /* «вдох» вверх-вниз: 2.5–6.5 px */
    bobSpd: 0.6 + rnd() * 0.55,       /* скорость дыхания, рад/с */
    bobPh: rnd() * Math.PI * 2,       /* своя фаза */
    tilt: 1 + rnd() * 1.2,            /* наклон, ° */
    tiltSpd: 0.42 + rnd() * 0.4,
    tiltPh: rnd() * Math.PI * 2,
    base: -2.2 + rnd() * 4.4          /* постоянный наклон места, ° */
  };
  KNIFE_SWAY.set(id, p);
  return p;
}

/* transform ножа в момент t (секунды от старта страницы) */
function knifeSwayStyle(p, t) {
  const dy = Math.sin(t * p.bobSpd + p.bobPh) * p.bob;
  const rot = p.base + Math.sin(t * p.tiltSpd + p.tiltPh) * p.tilt;
  return "translateY(" + dy.toFixed(2) + "px) rotate(" + rot.toFixed(2) + "deg)";
}

/* ---------- покачивание ножей на витрине ----------
   Считаем сами через requestAnimationFrame: цикл крутится только пока открыт
   лист с витринами, иначе сам себя гасит. */
let swayRaf = 0;

function swayApply(t) {
  const arts = sheetMode ? sheetBody.querySelectorAll(".vtray-grid .islot-art") : null;
  if (!arts || !arts.length) return false;
  for (let i = 0; i < arts.length; i++) {
    const art = arts[i];
    /* Параметры — по id ножа, а не по месту в сетке: нож, переехавший на другую
       витрину, качается так же, и все «дышат» вразнобой. */
    const cv = art.firstElementChild;
    const id = (cv && cv.dataset && cv.dataset.knife) || "slot" + i;
    art.style.transform = knifeSwayStyle(knifeSwayParams(id), t);
  }
  return true;
}

function swayFrame(now) {
  swayRaf = 0;
  if (!swayApply(now / 1000)) return;
  swayRaf = requestAnimationFrame(swayFrame);
}

function swayKick() {
  if (swayRaf) return;
  swayRaf = requestAnimationFrame(swayFrame);
}

function renderSheet() {
  const bits = [];
  if (sheetMode === "levels") {
    bits.push(renderLevelEditor());
  } else if (sheetMode === "bosses") {
    bits.push(renderBossEditor());
  } else if (sheetMode === "gen") {
    bits.push(renderBossGen());
  } else if (sheetMode === "stats") {
    bits.push(renderPlayerStats());
  } else if (sheetMode === "shop") {
    bits.push('<div class="sheet-note">Тут предметы забега и ножи за яблоки, а рекламные ножи открываются за ролик.</div>');
    bits.push('<div class="card"><div class="card-name">ЯБЛОЧНЫЙ БОНУС</div><div class="card-desc">Получить 100 яблок</div><button class="card-btn" type="button" data-free-apples>+100 ЯБЛОК</button></div>');
    for (const skin of KNIFE_SKINS) {
      if (!skin.price && !skin.ad) continue;
      bits.push(knifeCard(skin, true));
    }
    for (const it of SHOP_ITEMS) {
      bits.push(`<div class="card">
        <div class="card-ico">${it.icon}</div>
        <div class="card-name">${it.name}</div>
        <div class="card-desc">${it.desc}</div>
        <div class="card-meta">есть: ${itemCount(it.id)}</div>
        ${itemButtons(it)}
      </div>`);
    }
  } else {
    bits.push(renderItemsEditor());
  }
  sheetBody.innerHTML = bits.join("");
  /* Бегущие полоски VIP (style.css: ipgStripe, период 0.7s) привязаны к узлу:
     после перерисовки листа (выбор плитки, листание, покупка) они начинались бы
     с начала. Подставляем уже прошедшую часть периода — лента продолжает бежать
     с того же места, без рывка. */
  sheetBody.style.setProperty("--shine-delay", (-Math.round(performance.now() % 700)) + "ms");
  /* Плитки только что созданы: сразу ставим им transform по общим часам, чтобы
     не было кадра «нож в исходном положении» (выбор плитки, листание). */
  swayApply(performance.now() / 1000);
  sheetBody.querySelectorAll("canvas[data-knife]").forEach(c => {
    const img = assets.knives[c.dataset.knife];
    if (!img) return;
    const g = c.getContext("2d");
    g.clearRect(0, 0, c.width, c.height);
    const scale = Math.min(c.width / img.width, c.height / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    g.drawImage(img, (c.width - dw) * 0.5, (c.height - dh) * 0.5, dw, dh);
    /* Закрытый нож в листе предметов — цветной силуэт: та же картинка,
       залитая цветом редкости. Деталей не видно, форму — видно. */
    const silhouette = c.dataset.silhouette;
    if (silhouette) {
      g.globalCompositeOperation = "source-in";
      g.fillStyle = silhouette;
      g.fillRect(0, 0, c.width, c.height);
      g.globalCompositeOperation = "source-over";
    }
  });
  swayKick();
  /* Книга ножей живёт отдельным слоем: если она открыта, любая перерисовка
     листа (покупка, ролик, чит) должна обновить и её */
  if (typeof knifeBookRefresh === "function") knifeBookRefresh();
}

sheetBody.addEventListener("change", e => {
  const sel = e.target.closest("select[data-seq-set]");
  if (!sel) return;
  const i = sel.dataset.seqSet | 0;
  const parts = sel.value.split(":");
  mutateSeq(() => {
    if (i < 0 || i >= save.seq.length) return;
    if (parts[0] === "boss") save.seq[i] = { t: "boss", id: parts[1] };
    else save.seq[i] = { t: "wood", id: parts[1] | 0 };
  });
});

sheetBody.addEventListener("click", e => {
  const btn = e.target.closest("button");
  if (!btn) return;
  if (btn.dataset.freeApples != null) {
    /* старая кнопка «+100» больше не даёт бесконечные яблоки: только ролик
       раз в 5 минут и случайные 200–500 (js/analytics.js) */
    if (typeof Analytics !== "undefined") Analytics.claimFreeApples();
    return;
  }
  /* «ИГРАТЬ» в магазине надевает нож и пускает забег. В листе предметов такой
     кнопки нет: там нож надевает сам клик по плитке (см. ветку itemsPick) */
  if (btn.dataset.knifePlay) { playKnife(btn.dataset.knifePlay); return; }
  if (btn.dataset.buySet) { buyKnifeSet(btn.dataset.buySet); renderSheet(); return; }
  if (btn.dataset.adKnife) { buyVipKnifeSetFor(btn.dataset.adKnife); renderSheet(); return; }
  if (btn.dataset.genRoll != null) { rollBossGen(); renderSheet(); return; }
  /* «В МАГАЗИН» из карточки ножа (её рисует knifeButton) */
  if (btn.dataset.gotoShop != null) { openSheet("shop"); return; }
  /* Страницы предметов: стрелки и точки. Прокрутки в листе нет. */
  if (btn.dataset.ipgGo != null) { itemsGoTo(btn.dataset.ipgGo); return; }
  if (btn.dataset.ipgPrev != null) { itemsStep(-1); return; }
  if (btn.dataset.ipgNext != null) { itemsStep(1); return; }
  /* плитка: открытый нож сразу надевается, закрытый только выбирается —
     внизу появляется цена и кнопка покупки или ролика */
  if (btn.dataset.itemsPick != null) {
    itemsSel = btn.dataset.itemsPick;
    const knifeId = itemsSel.indexOf("knife:") === 0 ? itemsSel.slice(6) : "";
    if (knifeId && ownsKnife(knifeId)) equipKnife(knifeId);
    renderSheet();
    return;
  }
  if (btn.dataset.buyKnife) buyKnife(btn.dataset.buyKnife);
  else if (btn.dataset.buyItem) buyItem(btn.dataset.buyItem);
  else if (btn.dataset.toggleItem) toggleItem(btn.dataset.toggleItem);
  else if (btn.dataset.seqOn != null) {
    save.seqOn = true;
    if (!save.seq.length) save.seq = seedSeq();
    applySeqEdit();
    renderSheet();
  } else if (btn.dataset.seqOff != null) {
    save.seqOn = false;
    applySeqEdit();
    renderSheet();
  } else if (btn.dataset.seqClear != null) {
    save.seq = [];
    save.seqOn = false;
    applySeqEdit();
    renderSheet();
  } else if (btn.dataset.seqAdd != null) {
    mutateSeq(() => {
      if (save.seq.length >= SEQ_MAX) return;
      save.seq.push({ t: "wood", id: 0 });
    });
  } else if (btn.dataset.seqDel != null) {
    const i = btn.dataset.seqDel | 0;
    mutateSeq(() => { save.seq.splice(i, 1); });
  }
});

