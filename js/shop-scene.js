/* ---------- МАГАЗИН: отдельная сцена из главного меню ----------
   Наборы яблок — единственная валюта игры. Реальной оплаты пока нет, поэтому
   тап по набору сразу начисляет яблоки (и говорит об этом подписью снизу). */

const SHOP_SETS = {
  apple: [
    { amount: 500, price: 79 },
    { amount: 1000, price: 149 },
    { amount: 3000, price: 339, best: true }
  ]
};
const SHOP_SET_ICO = { apple: "🍎" };

let shopSceneOpen = false;

function shopSceneOpened() {
  return shopSceneOpen;
}

function renderShopGrid() {
  const grid = document.getElementById("shopGrid");
  if (!grid) return;
  grid.classList.remove("subs");
  const ico = SHOP_SET_ICO.apple || "🍎";
  grid.innerHTML = SHOP_SETS.apple.map(s =>
    '<button class="shop-offer' + (s.best ? " best" : "") + '" type="button"' +
    ' data-amount="' + s.amount + '">' +
      (s.best ? '<span class="shop-offer-best">ВЫГОДНО</span>' : "") +
      '<span class="shop-offer-ico" aria-hidden="true">' + ico + '</span>' +
      '<span class="shop-offer-amount">' + s.amount + '</span>' +
      '<span class="shop-offer-price">' + s.price + ' ₽</span>' +
    '</button>'
  ).join("");
}

function shopNote(text) {
  const el = document.getElementById("shopNote");
  if (el) el.textContent = text;
}

function renderShopScene() {
  renderShopGrid();
  shopNote("Демо-оплата: яблоки начисляются сразу");
}

function openShopScene() {
  const box = document.getElementById("shopScene");
  if (!box) return;
  try { Sfx.ensure(); } catch (err) {}
  if (typeof sheetMode !== "undefined" && sheetMode) closeSheet();
  shopSceneOpen = true;
  renderShopScene();
  box.classList.remove("hidden");
  box.setAttribute("aria-hidden", "false");
}

function closeShopScene() {
  const box = document.getElementById("shopScene");
  if (!box || !shopSceneOpen) return;
  shopSceneOpen = false;
  box.classList.add("hidden");
  box.setAttribute("aria-hidden", "true");
}

/* Покупка набора: платёжного шлюза нет — яблоки начисляются сразу. */
function shopBuy(amount, price) {
  const n = +amount | 0;
  if (n <= 0) return;
  game.apples = (game.apples | 0) + n;
  toast("+" + n + " ЯБЛОК");
  persist();
  syncHud();
  Sfx.pick();
  if (typeof Analytics !== "undefined") {
    Analytics.purchase({
      kind: "apple_pack",
      id: String(n),
      name: n + " яблок",
      cost: Math.max(0, Math.floor(+price) || 0),
      currency: "demo_rub"
    });
  }
}

if (typeof document !== "undefined") {
  const shopBox = document.getElementById("shopScene");
  const shopCloseBtn = document.getElementById("shopClose");
  const shopGridEl = document.getElementById("shopGrid");
  if (shopCloseBtn) {
    shopCloseBtn.addEventListener("click", e => {
      e.stopPropagation();
      closeShopScene();
    });
  }
  if (shopGridEl) {
    shopGridEl.addEventListener("click", e => {
      const btn = e.target.closest(".shop-offer");
      if (!btn) return;
      e.stopPropagation();
      const amount = +btn.dataset.amount;
      const set = SHOP_SETS.apple.find(s => s.amount === amount);
      shopBuy(amount, set ? set.price : 0);
    });
  }
  /* тап мимо карточки закрывает магазин */
  if (shopBox) {
    shopBox.addEventListener("click", e => {
      if (e.target === shopBox) closeShopScene();
    });
  }
}
