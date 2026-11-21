const canvas = document.getElementById("c");
const stage = document.getElementById("stage");
let ctx;
const coarse = !!(window.matchMedia && matchMedia("(pointer: coarse)").matches);
try {
  ctx = canvas.getContext("2d", { alpha: false, desynchronized: !coarse });
} catch (err) {
  ctx = null;
}
if (!ctx) ctx = canvas.getContext("2d", { alpha: false });
const hud = document.getElementById("hud");
/* кнопка «чистого» HUD: прячет счёт/рекорд/баффы, оставляет жизни */
const hudToggle = document.getElementById("hudToggle");
const reviveBtn = document.getElementById("reviveBtn");
const deathWord = document.getElementById("deathWord");
const deathSkip = document.getElementById("deathSkip");
const menuEl = document.getElementById("menu");
const overlay = document.getElementById("overlay");
const deathBrand = document.getElementById("deathBrand");
const runStats = document.getElementById("runStats");
const menuStats = document.getElementById("menuStats");
/* единственный счётчик яблок на всю игру (index.html: #globalApples) */
const globalAppleVal = document.getElementById("globalAppleVal");
const globalAppleIco = document.getElementById("globalAppleIco");
/* алмазы бета-теста: вторая валюта, постоянный счётчик под яблоками */
const globalRubleVal = document.getElementById("globalRubleVal");
const lvlVal = document.getElementById("lvlVal");
const bestVal = document.getElementById("bestVal");
/* правая колонка HUD целиком: на время нового рекорда она пропадает, а вместо
   неё справа сверху горит одно крупное число (js/hud.js: syncRecordHud) */
const hudRight = document.getElementById("hudRight");
const recordMark = document.getElementById("recordMark");
const recordVal = document.getElementById("recordVal");
const menuBestVal = document.getElementById("menuBestVal");
/* Дорожка наград: только вкладка в доке (js/rewards.js) */
const rewardsBtn = document.getElementById("rewardsBtn");
const rewardsBadge = document.getElementById("rewardsBadge");
const menuSub = document.getElementById("menuSub");
const loadoutBar = document.getElementById("loadoutBar");
const itemsBadge = document.getElementById("itemsBadge");
const hudBuffs = document.getElementById("hudBuffs");
const livesEl = document.getElementById("livesVal");
const livesBox = document.getElementById("livesBox");
const themeEl = document.getElementById("themeVal");
const sheet = document.getElementById("sheet");
const sheetBack = document.getElementById("sheetBack");
const sheetTitle = document.getElementById("sheetTitle");
const sheetBody = document.getElementById("sheetBody");
const levelBtn = document.getElementById("levelBtn");
const itemsBtn = document.getElementById("itemsBtn");
const bossesBtn = document.getElementById("bossesBtn");
const genBtn = document.getElementById("genBtn");
const statsBtn = document.getElementById("statsBtn");
const playHint = document.getElementById("playHint");
const cheatBtn = document.getElementById("cheatBtn");
const freeApplesBtn = document.getElementById("freeApplesBtn");
/* галочка «бесконечные жизни» в доке меню и её близнец в HUD забега
   (js/input.js: infLivesBtn / infLivesHudBtn) */
const infLivesBtn = document.getElementById("infLivesBtn");
const infLivesHudBtn = document.getElementById("infLivesHudBtn");
/* вкладка «Таблица лидеров» в доке меню (js/leaderboard.js: openLbMenu) */
const lbBtn = document.getElementById("lbBtn");
/* окно дорожки наград (js/rewards.js) */
const rewardWin = document.getElementById("rewardWin");
const rwGrid = document.getElementById("rwGrid");
const rwTimer = document.getElementById("rwTimer");
const rwTimerCap = document.getElementById("rwTimerCap");
const rwTimerIco = document.getElementById("rwTimerIco");
const rwTimerBox = document.getElementById("rwTimerBox");
const rwFoot = document.getElementById("rwFoot");
const rwClaim = document.getElementById("rwClaim");
const rwClose = document.getElementById("rwClose");
const sheetClose = document.getElementById("sheetClose");
const muteBtn = document.getElementById("muteBtn");
/* плашки выбора звуков бревна (js/stick-sound.js): удар и разлом */
const stickSoundBtn = document.getElementById("stickSoundBtn");
const stickSoundName = document.getElementById("stickSoundName");
const stickSoundNum = document.getElementById("stickSoundNum");
const logCrackBtn = document.getElementById("logCrackBtn");
const logCrackName = document.getElementById("logCrackName");
const logCrackNum = document.getElementById("logCrackNum");
const resetBtn = document.getElementById("resetBtn");
const resetFill = document.getElementById("resetFill");
const resetLabel = document.getElementById("resetLabel");
const unlockToast = document.getElementById("unlockToast");
const fpsChip = document.getElementById("fpsChip");
const fpsVal = document.getElementById("fpsVal");
const fpsMs = document.getElementById("fpsMs");
const fpsAvgEl = document.getElementById("fpsAvg");
const fpsMinEl = document.getElementById("fpsMin");

const exitBtn = document.getElementById("exitBtn");
const exitAsk = document.getElementById("exitAsk");
const exitAskYes = document.getElementById("exitAskYes");
const exitAskClose = document.getElementById("exitAskClose");
const resumeBtn = document.getElementById("resumeBtn");
const resumeLevel = document.getElementById("resumeLevel");
/* вкладка «Магазин» в доке меню (js/shop-scene.js: openShopScene) */
const shopBtn = document.getElementById("shopBtn");
const moreBtn = document.getElementById("moreBtn");
const menuMore = document.getElementById("menuMore");
const menuMoreBack = document.getElementById("menuMoreBack");
const menuMoreClose = document.getElementById("menuMoreClose");
const keysBtn = document.getElementById("keysBtn");
