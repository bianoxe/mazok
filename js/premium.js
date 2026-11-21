/* ============================================================
   PREMIUM + РЕКЛАМА МАСТЕРСКОЙ «ЦАП ЦАРАПА»
   ------------------------------------------------------------
   • Premium скрывает межстраничную рекламу и баннер мастерской (в меню и в
     игре), а также даёт +3 золотые жизни (js/state.js: playerMaxLives).
   • Реклама за возрождение (rewarded) НЕ отключается: это награда.
   • Межстраничная реклама — раз в 3 минуты и только в главном меню:
     пока игрок в забеге, ничего не показываем.
   • Вся реклама — один фирменный 13-секундный баннер мастерской.
   ============================================================ */

const PREMIUM_PRICE_RUB = 149;
/* Телеграм-канал мастерской. Поменяйте ссылку здесь, и она обновится везде. */
const PREMIUM_TG_URL = "https://t.me/gizbzi";
const PREMIUM_AD_INTERVAL_MS = 3 * 60 * 1000;   /* межстраничная: каждые 3 минуты */
const PREMIUM_REWARD_SEC = 13;                  /* награда: ровно 13 секунд */
const PREMIUM_INTERSTITIAL_SEC = 6;             /* межстраничная: 6 секунд до крестика */
const PREMIUM_MENU_SETTLE_MS = 5000;            /* не бьём рекламой сразу после входа */

let premiumAdOpen = false;
let premiumAdMode = "";
let premiumAdEndAt = 0;
let premiumAdDuration = 1;
let premiumAdTimer = 0;
let premiumAdFinished = false;
let premiumAdDone = null;
let premiumAdFail = null;
let premiumInterstitialAt = Date.now();
let premiumMenuSince = 0;
let premiumLastState = "";
let premiumLastInputAt = Date.now();
let premiumLastActive = null;
let premiumCloseTimer = 0;
/* баннер в меню: считаем показы один раз на вход в меню, а не каждые 700 мс */
let premiumStickerShown = false;

function premiumEl(id) {
  return document.getElementById(id);
}

function premiumActive() {
  return !!(typeof save !== "undefined" && save && save.premium);
}

function premiumIsMenu() {
  return typeof state !== "undefined" && state === "menu";
}

function premiumIsPhone() {
  return !!(document.documentElement && document.documentElement.classList.contains("is-phone"));
}

/* Где живёт баннер:
   • телефон — полоса снизу ТОЛЬКО в забеге (menu/fail его не показывают);
   • ПК — вертикальный баннер справа и в меню, и в игре.
   На смерти (fail) не показываем: там своё окно и реклама за возрождение. */
function premiumBannerShouldShow() {
  if (premiumActive() || typeof state === "undefined") return false;
  if (state === "fail") return false;
  if (document.body && document.body.classList.contains("boss-cine")) return false;
  const inRun = state === "play" || state === "shatter" || state === "victory";
  if (premiumIsPhone()) return inRun;
  return state === "menu" || inRun;
}

/* ---------- золотые жизни ---------- */

function premiumGrantLives() {
  if (typeof game === "undefined" || !game) return;
  const max = typeof playerMaxLives === "function" ? playerMaxLives() : 6;
  if (premiumIsMenu()) {
    game.maxLives = max;
    game.lives = max;
  } else {
    game.maxLives = Math.max(game.maxLives || 0, max);
    game.lives = Math.min(game.maxLives, (game.lives | 0) + (typeof PREMIUM_LIVES_BONUS === "number" ? PREMIUM_LIVES_BONUS : 3));
  }
  if (typeof livesSnap !== "undefined") livesSnap = "";
  if (typeof renderLives === "function") renderLives();
  if (typeof hudSnap !== "undefined") hudSnap = "";
  if (typeof syncHud === "function") syncHud();
}

/* ---------- Premium-плашка и баннер в меню ---------- */

function premiumSync() {
  const active = premiumActive();
  const inMenu = premiumIsMenu();
  const offer = premiumEl("premiumOffer");
  const banner = premiumEl("adBanner");
  const showOffer = inMenu && !active;
  const showBanner = premiumBannerShouldShow();
  if (offer && offer.hidden !== !showOffer) offer.hidden = !showOffer;
  if (banner && banner.hidden !== !showBanner) banner.hidden = !showBanner;
  /* показ рекламного баннера — событие для статистики (js/analytics.js) */
  if (showBanner && !premiumStickerShown && banner) {
    if (typeof Analytics !== "undefined") Analytics.ad("banner", "banner");
  }
  premiumStickerShown = !!showBanner;
  document.documentElement.classList.toggle("ad-banner-on", showBanner);
  if (active && premiumLastActive !== true) {
    try { if (typeof YxNoAds !== "undefined") YxNoAds = true; } catch (err) {}
    try { if (typeof yxHideBanner === "function") yxHideBanner(); } catch (err) {}
    premiumInterstitialAt = Date.now();
  }
  premiumLastActive = active;
}

function premiumOpen() {
  if (premiumActive()) return;
  const modal = premiumEl("premiumModal");
  if (!modal) return;
  const buy = premiumEl("premiumBuy");
  if (premiumCloseTimer) {
    clearTimeout(premiumCloseTimer);
    premiumCloseTimer = 0;
  }
  modal.classList.remove("is-bought");
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  if (buy) {
    buy.disabled = false;
    const txt = buy.querySelector(".pm-buy-txt");
    if (txt) txt.textContent = "ОФОРМИТЬ ЗА " + PREMIUM_PRICE_RUB + " 💎";
  }
  try { if (typeof Sfx !== "undefined" && Sfx.ensure) Sfx.ensure(); } catch (err) {}
  const card = modal.querySelector(".pm-card");
  if (card) { try { card.focus({ preventScroll: true }); } catch (err) {} }
}

function premiumClose() {
  const modal = premiumEl("premiumModal");
  if (!modal) return;
  if (premiumCloseTimer) {
    clearTimeout(premiumCloseTimer);
    premiumCloseTimer = 0;
  }
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
  if (modal.contains(document.activeElement)) {
    try { document.activeElement.blur(); } catch (err) {}
  }
}

function premiumBuy() {
  if (premiumActive()) return;
  /* Premium покупается за алмазы бета-теста (не за настоящие деньги) */
  if ((save.rubles | 0) < PREMIUM_PRICE_RUB) {
    if (typeof toast === "function") toast("МАЛО АЛМАЗОВ · НУЖНО " + PREMIUM_PRICE_RUB);
    return;
  }
  if (!spendRubles(PREMIUM_PRICE_RUB)) {
    if (typeof toast === "function") toast("МАЛО АЛМАЗОВ · НУЖНО " + PREMIUM_PRICE_RUB);
    return;
  }
  save.premium = true;
  try { localStorage.setItem("bh_premium", "1"); } catch (err) {}
  if (typeof persist === "function") persist();
  if (typeof yxDirtyMark === "function") yxDirtyMark();
  try { if (typeof YxNoAds !== "undefined") YxNoAds = true; } catch (err) {}
  try { if (typeof yxHideBanner === "function") yxHideBanner(); } catch (err) {}
  premiumInterstitialAt = Date.now();
  premiumGrantLives();
  if (typeof Analytics !== "undefined") {
    Analytics.purchase({
      kind: "premium",
      id: "premium",
      name: "Premium статус",
      cost: PREMIUM_PRICE_RUB,
      currency: "diamond"
    });
  }
  const modal = premiumEl("premiumModal");
  if (modal) modal.classList.add("is-bought");
  const buy = premiumEl("premiumBuy");
  if (buy) {
    buy.disabled = true;
    const txt = buy.querySelector(".pm-buy-txt");
    if (txt) txt.textContent = "PREMIUM АКТИВЕН";
    const sub = buy.querySelector(".pm-buy-sub");
    if (sub) sub.textContent = "✓";
  }
  try {
    if (typeof Sfx !== "undefined") {
      if (Sfx.recordReveal) Sfx.recordReveal();
      else if (Sfx.pick) Sfx.pick();
    }
  } catch (err) {}
  if (typeof toast === "function") toast("PREMIUM АКТИВЕН · РЕКЛАМА ОТКЛЮЧЕНА");
  premiumSync();
  premiumCloseTimer = setTimeout(premiumClose, 2200);
}

function premiumBuyLabel() {
  const buy = premiumEl("premiumBuy");
  if (!buy) return;
  const txt = buy.querySelector(".pm-buy-txt");
  if (txt) txt.textContent = "ОФОРМИТЬ ЗА " + PREMIUM_PRICE_RUB + " 💎";
}

/* ---------- фирменный ролик ---------- */

function rewardedAdOpen() {
  return premiumAdOpen && premiumAdMode === "reward";
}

function showRewardedAd(onReward, onFail) {
  if (typeof GamePause !== "undefined" && GamePause.on) {
    if (typeof onFail === "function") onFail();
    return;
  }
  openPremiumAd("reward", onReward, onFail);
}

function showInterstitialAd(onDone, onFail) {
  if (premiumActive()) {
    if (typeof onFail === "function") onFail();
    return;
  }
  /* Жёсткая страховка: межстраничная реклама — ТОЛЬКО в главном меню.
     Если по какой-то причине сюда пришли во время забега, ничего не показываем. */
  if (typeof state !== "undefined" && state !== "menu") {
    if (typeof onFail === "function") onFail();
    return;
  }
  if (typeof hud !== "undefined" && hud && hud.classList.contains("on")) {
    if (typeof onFail === "function") onFail();
    return;
  }
  if (typeof menuEl !== "undefined" && menuEl && menuEl.classList.contains("hidden")) {
    if (typeof onFail === "function") onFail();
    return;
  }
  openPremiumAd("interstitial", onDone, onFail);
}

function openPremiumAd(mode, onDone, onFail) {
  if (premiumAdOpen) {
    if (typeof onFail === "function") onFail();
    return;
  }
  const layer = premiumEl("adLayer");
  if (!layer) {
    if (typeof onFail === "function") onFail();
    return;
  }
  const reward = mode === "reward";
  premiumAdOpen = true;
  premiumAdMode = mode;
  premiumAdFinished = false;
  premiumAdDone = typeof onDone === "function" ? onDone : null;
  premiumAdFail = typeof onFail === "function" ? onFail : null;
  premiumAdDuration = (reward ? PREMIUM_REWARD_SEC : PREMIUM_INTERSTITIAL_SEC) * 1000;
  premiumAdEndAt = Date.now() + premiumAdDuration;

  const stamp = premiumEl("adStamp");
  const headline = premiumEl("adHeadline");
  const subline = premiumEl("adSubline");
  const note = premiumEl("adNote");
  const bar = premiumEl("adBar");
  const count = premiumEl("adCount");
  if (stamp) stamp.textContent = reward ? "НАГРАДА" : "РЕКЛАМА";
  if (headline) headline.innerHTML = "МАСТЕРСКАЯ<br>ЦАП ЦАРАПА";
  if (subline) subline.textContent = reward
    ? "Подпишись на Telegram — и сразу в бой"
    : "Ножи ручной работы · Telegram";
  if (note) note.textContent = reward
    ? "Награда через " + PREMIUM_REWARD_SEC + " сек"
    : "Реклама · Мастерская Цап Царапа";
  if (bar) bar.style.width = "0%";
  if (count) {
    count.textContent = String(reward ? PREMIUM_REWARD_SEC : PREMIUM_INTERSTITIAL_SEC);
    count.style.setProperty("--p", "0");
    count.classList.remove("is-done", "is-skip");
    count.disabled = true;
    count.setAttribute("aria-label", "Отсчёт рекламы");
  }
  layer.classList.remove("hidden");
  layer.classList.toggle("ad-rewarded", reward);
  layer.setAttribute("aria-hidden", "false");
  try { if (typeof Sfx !== "undefined" && Sfx.ensure) Sfx.ensure(); } catch (err) {}
  premiumAdTimer = setInterval(premiumAdTick, 120);
  premiumAdTick();
}

function premiumAdTick() {
  if (!premiumAdOpen || premiumAdFinished) return;
  const left = Math.max(0, premiumAdEndAt - Date.now());
  const pct = Math.min(100, Math.max(0, (1 - left / premiumAdDuration) * 100));
  const bar = premiumEl("adBar");
  const count = premiumEl("adCount");
  if (bar) bar.style.width = pct.toFixed(2) + "%";
  if (count) {
    count.style.setProperty("--p", pct.toFixed(2));
    const sec = Math.ceil(left / 1000);
    const txt = sec > 0 ? String(sec) : "✓";
    if (count.textContent !== txt) count.textContent = txt;
  }
  if (left > 0) return;
  premiumAdFinished = true;
  const note = premiumEl("adNote");
  if (premiumAdMode === "reward") {
    if (note) note.textContent = "ВОЗВРАЩАЕМСЯ В БОЙ…";
    if (count) {
      count.textContent = "✓";
      count.classList.remove("is-skip");
      count.classList.add("is-done");
      count.disabled = true;
    }
    setTimeout(function () {
      if (premiumAdOpen && premiumAdMode === "reward") finishPremiumAd(true);
    }, 700);
    return;
  }
  if (note) note.textContent = "Реклама · Мастерская Цап Царапа";
  /* межстраничная: отсчёт закончился — тот же круг становится крестиком
     «пропустить», отдельной кнопки «ПРОДОЛЖИТЬ» больше нет */
  if (count) {
    count.textContent = "✕";
    count.classList.remove("is-done");
    count.classList.add("is-skip");
    count.disabled = false;
    count.setAttribute("aria-label", "Пропустить рекламу");
    try { count.focus({ preventScroll: true }); } catch (err) {}
  }
}

function finishPremiumAd(ok) {
  if (!premiumAdOpen) return;
  const mode = premiumAdMode;
  const cb = ok ? premiumAdDone : premiumAdFail;
  premiumAdOpen = false;
  premiumAdMode = "";
  premiumAdFinished = false;
  premiumAdDone = null;
  premiumAdFail = null;
  if (premiumAdTimer) {
    clearInterval(premiumAdTimer);
    premiumAdTimer = 0;
  }
  const layer = premiumEl("adLayer");
  if (layer) {
    layer.classList.add("hidden");
    layer.classList.remove("ad-rewarded");
    layer.setAttribute("aria-hidden", "true");
  }
  if (typeof cb === "function") cb();
  /* межстраничная реклама: считаем просмотренной, только если ролик закрыли
     после конца (rewarded считают сами получатели награды: revive/apples) */
  if (ok && mode === "interstitial" && typeof Analytics !== "undefined") {
    Analytics.ad("interstitial", "menu");
  }
}

/* ---------- расписание межстраничной рекламы ---------- */

function premiumMenuBlocked() {
  if (typeof GamePause !== "undefined" && GamePause.on) return true;
  if (typeof sheetMode !== "undefined" && sheetMode) return true;
  if (typeof menuEl !== "undefined" && menuEl && menuEl.classList.contains("hidden")) return true;
  if (typeof hud !== "undefined" && hud && hud.classList.contains("on")) return true;
  if (typeof overlay !== "undefined" && overlay && !overlay.classList.contains("hidden")) return true;
  if (typeof knifeUnlocksActive === "function" && knifeUnlocksActive()) return true;
  if (typeof rewardWindowOpened === "function" && rewardWindowOpened()) return true;
  if (typeof shopSceneOpened === "function" && shopSceneOpened()) return true;
  const classBlocked = ["book", "rewardWin", "shopScene", "lbMenu", "premiumModal", "adLayer"];
  for (let i = 0; i < classBlocked.length; i++) {
    const el = premiumEl(classBlocked[i]);
    if (el && !el.classList.contains("hidden")) return true;
  }
  const more = premiumEl("menuMore");
  if (more && !more.hidden) return true;
  const kkeys = premiumEl("kkeysPanel");
  if (kkeys && !kkeys.hidden) return true;
  return false;
}

function premiumTick() {
  premiumSync();
  /* Если межстраничная почему-то осталась открытой, а игрок уже не в меню —
     немедленно убираем её. В забеге рекламы быть не должно. */
  if (premiumAdOpen && premiumAdMode === "interstitial" &&
      (typeof state === "undefined" || state !== "menu")) {
    finishPremiumAd(true);
  }
  const now = Date.now();
  const inMenu = premiumIsMenu();
  if (inMenu && premiumLastState !== "menu") premiumMenuSince = now;
  if (!inMenu) premiumMenuSince = 0;
  premiumLastState = inMenu ? "menu" : (typeof state !== "undefined" ? state : "");
  /* Реклама — только когда игрок реально стоит в главном меню, а не в забеге,
     не на смерти и не в любом другом экране. */
  if (typeof state === "undefined" || state !== "menu") return;
  if (premiumActive() || premiumAdOpen || !premiumMenuSince) return;
  if (now - premiumMenuSince < PREMIUM_MENU_SETTLE_MS) return;
  /* и не сразу после клика/тапа: даём игроку спокойно начать забег/меню */
  if (now - premiumLastInputAt < 4000) return;
  if (now - premiumInterstitialAt < PREMIUM_AD_INTERVAL_MS) return;
  if (premiumMenuBlocked()) return;
  showInterstitialAd(function () {
    premiumInterstitialAt = Date.now();
  }, function () {
    premiumInterstitialAt = Date.now();
  });
}

/* ---------- события и защита от «сквозных» кликов ---------- */

function premiumWire() {
  premiumBuyLabel();

  const offer = premiumEl("premiumOffer");
  if (offer) {
    offer.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (typeof Analytics !== "undefined" && Analytics.bannerClick) {
        try { Analytics.bannerClick("premiumOffer", "Предложение Premium"); } catch (err) {}
      }
      premiumOpen();
    });
  }
  const close = premiumEl("premiumClose");
  if (close) {
    close.addEventListener("click", function (e) {
      e.stopPropagation();
      premiumClose();
    });
  }
  const back = premiumEl("premiumModalBack");
  if (back) {
    back.addEventListener("click", function (e) {
      e.stopPropagation();
      premiumClose();
    });
  }
  const buy = premiumEl("premiumBuy");
  if (buy) {
    buy.addEventListener("click", function (e) {
      e.stopPropagation();
      premiumBuy();
    });
  }
  const modal = premiumEl("premiumModal");
  if (modal) {
    modal.addEventListener("pointerdown", function (e) { e.stopPropagation(); });
    modal.addEventListener("mousedown", function (e) { e.stopPropagation(); });
  }

  const deathAd = premiumEl("deathAdBtn");
  if (deathAd) {
    deathAd.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      try { if (typeof Sfx !== "undefined" && Sfx.ensure) Sfx.ensure(); } catch (err) {}
      if (typeof tryReviveByAd === "function") tryReviveByAd(true);
    });
  }

  const adCount = premiumEl("adCount");
  if (adCount) {
    adCount.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (premiumAdOpen && premiumAdMode === "interstitial" && premiumAdFinished) {
        finishPremiumAd(true);
      }
    });
  }
  const layer = premiumEl("adLayer");
  if (layer) {
    layer.addEventListener("pointerdown", function (e) { e.stopPropagation(); });
    layer.addEventListener("mousedown", function (e) { e.stopPropagation(); });
    layer.addEventListener("click", function (e) {
      e.stopPropagation();
      if (e.target === layer && premiumAdMode === "interstitial" && premiumAdFinished) {
        finishPremiumAd(true);
      }
    });
  }

  /* Телеграм-ссылки — из одной константы, а не из двух разных мест в разметке */
  const banner = premiumEl("adBanner");
  if (banner) banner.href = PREMIUM_TG_URL;
  const cta = premiumEl("adCta");
  if (cta) cta.href = PREMIUM_TG_URL;
  /* Клики по рекламным ссылкам — в аналитику (id + название). */
  if (banner) banner.addEventListener("click", function () {
    if (typeof Analytics !== "undefined" && Analytics.bannerClick) {
      try { Analytics.bannerClick("adBanner", "Баннер Telegram"); } catch (err) {}
    }
  });
  if (cta) cta.addEventListener("click", function () {
    if (typeof Analytics !== "undefined" && Analytics.bannerClick) {
      try { Analytics.bannerClick("adCta", "Кнопка в рекламном окне"); } catch (err) {}
    }
  });

  /* Любое действие игрока откладывает межстраничную рекламу: она не должна
     выскакивать сразу после тапа/броска. */
  function premiumMarkInput() { premiumLastInputAt = Date.now(); }
  window.addEventListener("pointerdown", premiumMarkInput, true);
  window.addEventListener("mousedown", premiumMarkInput, true);
  window.addEventListener("keydown", premiumMarkInput, true);

  /* Клавиатура не должна проваливаться в игру: пробел в меню начинает забег,
     Esc закрывает окна. Пока ролик/премиум открыты — гасим это на capture. */
  document.addEventListener("keydown", function (e) {
    premiumLastInputAt = Date.now();
    if (premiumAdOpen) {
      e.stopPropagation();
      if (premiumAdMode === "interstitial" && premiumAdFinished &&
          (e.code === "Escape" || e.code === "Space" || e.code === "Enter" || e.code === "NumpadEnter")) {
        e.preventDefault();
        finishPremiumAd(true);
        return;
      }
      if (e.code === "Space" || e.code === "Enter" || e.code === "NumpadEnter" ||
          e.code === "Escape" || e.code.indexOf("Arrow") === 0) {
        e.preventDefault();
      }
      return;
    }
    const m = premiumEl("premiumModal");
    if (m && !m.classList.contains("hidden")) {
      e.stopPropagation();
      if (e.code === "Escape") {
        e.preventDefault();
        premiumClose();
      } else if (e.code === "Space" || e.code === "Enter" || e.code === "NumpadEnter") {
        e.preventDefault();
      }
    }
  }, true);

  setInterval(premiumTick, 700);
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) premiumTick();
  });
}

premiumWire();
premiumSync();
