const KNIFE_SKINS = [
  { id: "classic", name: "СТАРТОВЫЙ НОЖ", page: "none", src: "images/knifes/classic.webp?v=1", blade: "#d8ddd8", edge: "#5c5a56", hi: "rgba(255,255,255,0.45)", guard: "#c4a06a", handle: "#6b4a32", stripe: "#8a6344", pommel: "#c4a06a" },
  { id: "target", name: "ДРОТИК", blurb: "жало, латунный ствол и оперение", src: "images/knifes/drotik2.webp?v=1", blade: "#f4f1ea", edge: "#1a1a1a", hi: "rgba(255,255,255,0.6)", guard: "#c4a06a", handle: "#6b3a28", stripe: "#c4342c", pommel: "#e2b423" },
  { id: "valve", name: "ВЕНТИЛЬ", blurb: "медное зубило и колесо", src: "images/knifes/bosses/10_Red_Valve_Guard_Sword.webp?v=1", blade: "#c47848", edge: "#3a2418", hi: "rgba(255,210,160,0.38)", guard: "#6a5044", handle: "#3a2c24", stripe: "#a34820", pommel: "#8a5a3c" },
  { id: "tomato", name: "ТОМАТ", shape: "tomato", price: 280, blurb: "красный клинок и листья", src: "images/knifes/tomato.webp?v=1", blade: "#ddd6d2", edge: "#6a534c", hi: "rgba(255,220,206,0.38)", guard: "#c4a06a", handle: "#6a4e42", stripe: "#9a584c", pommel: "#c4a06a" },
  { id: "heart", name: "СЕРДЦЕ", blurb: "багровый клинок и сердечко", src: "images/knifes/heart.webp?v=1", blade: "#e0344c", edge: "#4a0814", hi: "rgba(255,210,214,0.42)", guard: "#c4a06a", handle: "#2c0a10", stripe: "#8a3a36", pommel: "#c4a06a" },
  /* id прежний: он в сейвах и в наборе ножей — переименовано только имя */
  { id: "marmalade", name: "БАБЛ", blurb: "пузыри и зелёная гарда", src: "images/knifes/bubble.webp?v=1", blade: "#ff7eae", edge: "#c43a68", hi: "rgba(255,255,255,0.5)", guard: "#f0c878", handle: "#8e2d52", stripe: "#e07098", pommel: "#f0c878" },
  { id: "pumpkin", name: "ТЫКВА", blurb: "оранжевый крюк", src: "images/knifes/tikva.webp?v=1", blade: "#f08a28", edge: "#6a2808", hi: "rgba(255,230,180,0.45)", guard: "#c4a06a", handle: "#4a1c08", stripe: "#a06020", pommel: "#c4a06a" },
  { id: "basketball", name: "СВИСТОК", blurb: "свисток арбитра", blade: "#e8a03c", edge: "#4a2206", hi: "rgba(255,230,190,0.5)", guard: "#2a2a2e", handle: "#c4610c", stripe: "#f4c46a", pommel: "#3a3a40" },
  { id: "plate", name: "ЛОЖКА", blurb: "гнутая ложка с синей росписью", blade: "#eef6ff", edge: "#2a4a7a", hi: "rgba(255,255,255,0.72)", guard: "#2f6fd0", handle: "#f2f7fc", stripe: "#7fb0e8", pommel: "#2f6fd0" },
  { id: "tape", name: "РЕЗАК", blurb: "зубчатый резак скотча", blade: "#dfe8ee", edge: "#3a4e5a", hi: "rgba(255,255,255,0.72)", guard: "#8aa2b2", handle: "#c9b088", stripe: "#e8f2f8", pommel: "#5c7482" },
  { id: "yarn", name: "СПИЦА", blurb: "спица с зелёной нитью", blade: "#e8f0f4", edge: "#3a4a56", hi: "rgba(255,255,255,0.7)", guard: "#a8d44a", handle: "#3f6a12", stripe: "#c6e878", pommel: "#8fc93a" },
  { id: "saw", name: "ПИЛА", blurb: "зубья и закрытая рукоять", src: "images/knifes/saw.webp?v=1", blade: "#c5ccd4", edge: "#2a3038", hi: "rgba(255,255,255,0.55)", guard: "#8a929c", handle: "#2c3138", stripe: "#5c6672", pommel: "#b0b8c0" },
  { id: "ball", name: "БИЛЬЯРД", blurb: "восьмёрка и зелёная рукоять", src: "images/knifes/bosses/09_Eight_Ball_Sword.webp?v=1", blade: "#f7f4ee", edge: "#1a1a1a", hi: "rgba(255,255,255,0.75)", guard: "#e8e2d6", handle: "#141414", stripe: "#f4f0e6", pommel: "#d4af37" },
  { id: "donut", name: "ПОНЧИК", shape: "donut", price: 400, blurb: "рукоять из пончиков", src: "images/knifes/donut.webp?v=3", blade: "#e4dcd4", edge: "#a86a78", hi: "rgba(255,255,255,0.5)", guard: "#e4c48a", handle: "#7a5648", stripe: "#c49258", pommel: "#f0a8c4" },
  { id: "aegis", name: "ЩИТ", blurb: "рыцарский меч", src: "images/knifes/aegis.webp?v=1", blade: "#d5dde4", edge: "#1c2228", hi: "rgba(255,255,255,0.62)", guard: "#c4a46a", handle: "#3a342c", stripe: "#6a5c48", pommel: "#b7a48a" },
  { id: "helm", name: "ШТУРВАЛ", shape: "helm", blurb: "дуга и спица", src: "images/knifes/bosses/03_Ship_Wheel_Sword.webp?v=1", blade: "#d9d4cc", edge: "#5c4636", hi: "rgba(255,236,210,0.42)", guard: "#c49258", handle: "#6b4e38", stripe: "#8a6238", pommel: "#d7c4a4" },
  { id: "coconut", name: "МАЧЕТЕ", shape: "machete", blurb: "широкий клинок с кокоса", src: "images/knifes/bosses/07_Coconut_Palm_Sword.webp?v=1", blade: "#9aa884", edge: "#243024", hi: "rgba(232,238,214,0.5)", guard: "#6e5438", handle: "#3a2818", stripe: "#24180e", pommel: "#c4a06a" },
  { id: "egg", name: "ГЛАЗУНЬЯ", blurb: "тост и яичница", src: "images/knifes/egg.webp?v=1", blade: "#f6f1e6", edge: "#8a7460", hi: "rgba(255,255,255,0.72)", guard: "#c4a574", handle: "#e7dcc8", stripe: "#d4c4a4", pommel: "#f7f1e4" },
  { id: "dummy", name: "ЧУЧЕЛО", blurb: "гвоздь и мешковина", src: "images/knifes/chuchelo.webp?v=1", blade: "#d7dee6", edge: "#2c333a", hi: "rgba(255,255,255,0.55)", guard: "#8d949c", handle: "#b08958", stripe: "#5c4030", pommel: "#aeb6be" },
  { id: "fan", name: "ФЕН", blurb: "скошенный пластик", blade: "#e7e2d8", edge: "#6a645c", hi: "rgba(255,255,255,0.5)", guard: "#8aa4b0", handle: "#3a3834", stripe: "#d4543c", pommel: "#c9c2b6" },
  { id: "candy", name: "КОНФЕТА", blurb: "полосатая карамель", src: "images/knifes/konfeta.webp?v=1", blade: "#fff6f4", edge: "#a01828", hi: "rgba(255,255,255,0.7)", guard: "#f0c878", handle: "#8e1424", stripe: "#fff4f2", pommel: "#e1062c" },
  { id: "lifebelt", name: "СПАСАТЕЛЬНЫЙ КРУГ", blurb: "тупой нос и спасательный круг", src: "images/knifes/lifebelt.webp?v=2", blade: "#f7f4f2", edge: "#6f757c", hi: "rgba(255,255,255,0.62)", guard: "#cfd4da", handle: "#c41230", stripe: "#8a0d22", pommel: "#f7f4f2" },
  { id: "pepsi", name: "БАНКА", blurb: "клинок, открывашка и рукоять", src: "images/knifes/pepsi.webp?v=1", blade: "#d7dee6", edge: "#1c2126", hi: "rgba(255,255,255,0.7)", guard: "#9aa3ab", handle: "#1a1c1f", stripe: "#3c4146", pommel: "#c5ccd3" },
  { id: "tire", name: "ОТВЁРТКА", blurb: "жало, стержень и рифление", src: "images/knifes/otvertka.webp?v=1", blade: "#cfd6dd", edge: "#14171a", hi: "rgba(255,255,255,0.5)", guard: "#6a727a", handle: "#3c444c", stripe: "#9aa2aa", pommel: "#b9bfc6" },
  { id: "coin", name: "ДУБЛОН", blurb: "золото и монеты", src: "images/knifes/coin.webp?v=1", blade: "#f6e3a8", edge: "#8a6208", hi: "rgba(255,252,224,0.66)", guard: "#e8b62e", handle: "#8a5c14", stripe: "#f6d977", pommel: "#c48a10" },
  { id: "balloon", name: "ШАРИК", blurb: "игла и нитка", src: "images/knifes/bosses/01_Red_Balloon_Flower_Sword.webp?v=1", blade: "#ffe0e6", edge: "#a01428", hi: "rgba(255,255,255,0.7)", guard: "#e02338", handle: "#6a0818", stripe: "#ff8a98", pommel: "#c4122c" },
  { id: "pie", name: "ПИРОГ", blurb: "кусок пирога с начинкой", src: "images/knifes/bosses/pirog.webp?v=1", blade: "#f4e2bc", edge: "#a33a28", hi: "rgba(255,248,230,0.55)", guard: "#d4a04a", handle: "#b8862a", stripe: "#c4482a", pommel: "#e8c878" },
  { id: "cog", name: "ШПИЛЬКА", blurb: "стальной стержень и зубчатая гайка", src: "images/knifes/shesterenka.webp?v=1", blade: "#c5ccd4", edge: "#1b2028", hi: "rgba(255,255,255,0.6)", guard: "#8f99a5", handle: "#3c444c", stripe: "#d8e0e8", pommel: "#aeb8c2" },
  { id: "tennis", name: "РАКЕТКА", blurb: "обод со струнами и мяч на пятке", src: "images/knifes/bosses/08_Tennis_Ball_Sword.webp?v=1", blade: "#eaf7c8", edge: "#3f5408", hi: "rgba(255,255,255,0.7)", guard: "#c8e034", handle: "#2c3a2c", stripe: "#f4ffd0", pommel: "#93b41e" },
  { id: "compass", name: "КОМПАС", blurb: "клинок и роза ветров", src: "images/knifes/compass.webp?v=1", blade: "#e8e2d6", edge: "#2a241c", hi: "rgba(255,255,255,0.62)", guard: "#c4a46a", handle: "#1c1a17", stripe: "#e23b2f", pommel: "#c4a46a" },
  { id: "camera", name: "КАМЕРА", blurb: "клинок и объектив", src: "images/knifes/bosses/05_Camera_Lens_Sword.webp?v=1", blade: "#d7dee6", edge: "#0a0806", hi: "rgba(255,255,255,0.65)", guard: "#3a78c8", handle: "#1a1614", stripe: "#e8b84a", pommel: "#c5ced6" },
  /* МИГАЛКА: файл появился (images/knifes/bosses/06_Disco_Ball_Sword.webp),
     канвасный paintDisco остался запасным — им нож рисуется, если картинка
     не загрузилась. Цвета ниже — тоже запасные, для витрины. */
  { id: "disco", name: "МИГАЛКА", blurb: "зеркальные грани и шар на рукояти", src: "images/knifes/bosses/06_Disco_Ball_Sword.webp?v=1", blade: "#dfe6f2", edge: "#141821", hi: "rgba(255,255,255,0.75)", guard: "#8f9ab0", handle: "#2a2f3c", stripe: "#8ad6ff", pommel: "#c9a4ff" },
  /* РЕВЕРС: файл появился последним (05_Refresh_Arrows_Sword.webp) — две
     стрелки по кругу. До него у босса не было своего ножа; микрофон из этой
     же папки сюда НЕ ставим: МИКРОФОН уже есть в классике (none), дубликат
     не нужен. id совпадает с id босса, поэтому нож сам попадает в его дроп
     (js/progress.js: bossKnifeIds) и на страницу РЕДКИХ. */
  { id: "reverse", name: "РЕВЕРС", blurb: "две стрелки по кругу на клинке", src: "images/knifes/bosses/05_Refresh_Arrows_Sword.webp?v=1", blade: "#cfd6dc", edge: "#1c2126", hi: "rgba(255,255,255,0.6)", guard: "#8fb0d0", handle: "#2a3a54", stripe: "#2fa8ff", pommel: "#ff9a30" },

  /* ---------- вторые ножи боссов: кокос, фен, бильярд ----------
     У каждого своя картинка (images/knifes/kokos|fen.webp) и свой id,
     поэтому это не замена основному ножу босса, а награда сверху: с одного
     босса выпадают оба ножа (knifeExtra в js/bosses.js, выдача —
     grantBossKnife в js/progress.js). boss: — чей это босс: по нему витрина
     попадает на страницу его редкости (js/shop.js: knifeOwnerBoss). */
  { id: "kokos", boss: "coconut", name: "СКОРЛУПА", blurb: "кокосовая рукоять и зубчатая кромка", src: "images/knifes/kokos.webp?v=1", blade: "#c9ccd0", edge: "#33363a", hi: "rgba(255,255,255,0.62)", guard: "#5a3a22", handle: "#cfae8c", stripe: "#6a4428", pommel: "#7a5230" },
  { id: "fen", boss: "fan", name: "ТУРБИНА", blurb: "фен с раскалённой полосой", src: "images/knifes/fen.webp?v=1", blade: "#e2e7ea", edge: "#2a2c30", hi: "rgba(255,255,255,0.7)", guard: "#2fc0d4", handle: "#1c2a44", stripe: "#ff6a18", pommel: "#2a3240" },

  /* ---------- ножи за яблоки и VIP-наборы ----------
     Все ножи ниже — отдельные спрайты из images/knifes/none, переделанные
     в webp (обрезка по контенту, sharp). Своего рисунка канвас им не рисует:
     есть картинка — js/knife.js кладёт фото в слот (makeKnife). Цена (price)
     открывает нож за яблоки, ad: true — VIP-нож, который продаётся ТОЛЬКО
     набором за 49 💎 (js/knife-book.js: buyKnifeSet). */
  { id: "serp", name: "СЕРП", price: 180, blurb: "тёмный крюк и зазубрины", src: "images/knifes/serp.webp?v=1", blade: "#6a3a34", edge: "#2a1310", hi: "rgba(255,220,205,0.35)", guard: "#3a2018", handle: "#7a4a40", stripe: "#a06050", pommel: "#2e1a14" },
  { id: "schetka", name: "ЩЁТКА", ad: true, blurb: "зубная щётка с пастой", src: "images/knifes/schetka.webp?v=1", blade: "#7f7fc4", edge: "#2a2a6a", hi: "rgba(255,255,255,0.5)", guard: "#e8c88a", handle: "#c98a5a", stripe: "#5ad0e8", pommel: "#f0d060" },
  { id: "ryba", name: "РЫБА", ad: true, mini: true, blurb: "золотая рыба целиком", src: "images/knifes/vip/ryba.webp", blade: "#e8a636", edge: "#8a5a10", hi: "rgba(255,240,200,0.45)", guard: "#c8871f", handle: "#f0c968", stripe: "#fff0c0", pommel: "#a86a12" },
  { id: "plunzher", name: "ПЛУНЖЕР", price: 260, blurb: "красная сантехника", src: "images/knifes/plunzher.webp?v=1", blade: "#d63a3a", edge: "#6a1414", hi: "rgba(255,220,220,0.5)", guard: "#b02a2a", handle: "#8a1c1c", stripe: "#f07070", pommel: "#d8b0b0" },
  { id: "skelet", name: "СКЕЛЕТ", ad: true, mini: true, blurb: "жезл из скелета с короной", src: "images/knifes/vip/skelet.webp", blade: "#e8ecef", edge: "#7a8290", hi: "rgba(255,255,255,0.7)", guard: "#f0c020", handle: "#dfe4e8", stripe: "#c41b1b", pommel: "#f0c020" },
  { id: "spagetti", name: "СПАГЕТТИ", price: 560, blurb: "вилка с мотком спагетти", src: "images/knifes/spagetti.webp?v=1", blade: "#c9c6d4", edge: "#6a6478", hi: "rgba(255,255,255,0.6)", guard: "#e2b04a", handle: "#c9c6d4", stripe: "#e0a83c", pommel: "#8f8b9c" },
  { id: "rozhok", name: "РОЖОК", ad: true, blurb: "рожок с мороженым и ленточкой", src: "images/knifes/rozhok.webp?v=1", blade: "#d42a40", edge: "#6a0c18", hi: "rgba(255,255,255,0.5)", guard: "#e8f4f8", handle: "#c02034", stripe: "#f0a0b0", pommel: "#e8c88a" },

  { id: "jungle", name: "ДЖУНГЛИ", price: 360, blurb: "зелёный тесак из чащи", src: "images/knifes/jungle.webp?v=1", blade: "#3f6b45", edge: "#12200f", hi: "rgba(255,255,255,0.5)", guard: "#2c4429", handle: "#25422c", stripe: "#8fc46a", pommel: "#1d3320" },
  { id: "scissors", name: "НОЖНИЦЫ", ad: true, blurb: "портновские ножницы", src: "images/knifes/scissors.webp?v=1", blade: "#ccd3da", edge: "#3a4149", hi: "rgba(255,255,255,0.8)", guard: "#9aa3ac", handle: "#b6bec6", stripe: "#e8eef4", pommel: "#8f98a1" },

  /* ---------- хлам: первая страница витрин ----------
     Двенадцать бытовых «ножей» из папки none — отдельная страница перед
     классикой (page: "junk", js/shop.js). Запечены в корень images/knifes.
     Витрины у них не красные, а серые: ступень заведомо ниже боссовых,
     поэтому и цвет ткани другой. Цена — за яблоки, как у классики, только
     дешевле. */
  { id: "trezubec", name: "ТРЕЗУБЕЦ", page: "junk", price: 90, blurb: "стальная острога", src: "images/knifes/trezubec.webp", blade: "#b9c2cc", edge: "#2b323c", hi: "rgba(255,255,255,0.6)", guard: "#8d97a3", handle: "#242a32", stripe: "#d8e0e8", pommel: "#c8d0d8" },
  { id: "utochka", name: "УТОЧКА", page: "junk", price: 110, blurb: "резиновая уточка на палке", src: "images/knifes/utochka.webp", blade: "#f2b724", edge: "#8a5a08", hi: "rgba(255,248,210,0.6)", guard: "#c9302c", handle: "#7a3a24", stripe: "#ffd94a", pommel: "#e8a018" },
  { id: "mukhoboyka", name: "МУХОБОЙКА", page: "junk", price: 130, blurb: "красная сетка и ручка", src: "images/knifes/mukhoboyka.webp", blade: "#e2452f", edge: "#7a1408", hi: "rgba(255,220,210,0.55)", guard: "#a82818", handle: "#d84028", stripe: "#ff8a6a", pommel: "#8a2010" },
  { id: "skovoroda", name: "СКОВОРОДА", page: "junk", price: 120, blurb: "чугунная с тёмным дном", src: "images/knifes/skovoroda.webp", blade: "#4a4a4e", edge: "#141416", hi: "rgba(255,255,255,0.4)", guard: "#2a2a2e", handle: "#1a1a1c", stripe: "#6a6a70", pommel: "#3a3a3e" },
  { id: "sapog", name: "САПОГ", page: "junk", price: 140, blurb: "жёлтый резиновый сапог", src: "images/knifes/sapog.webp", blade: "#f0c020", edge: "#8a6408", hi: "rgba(255,248,210,0.5)", guard: "#d8a814", handle: "#b88808", stripe: "#ffe070", pommel: "#e8b414" },
  { id: "raduga", name: "РАДУГА", page: "junk", price: 160, blurb: "щётка с радужной щетиной", src: "images/knifes/raduga.webp", blade: "#f0f4f8", edge: "#7a8a9a", hi: "rgba(255,255,255,0.8)", guard: "#e8b84a", handle: "#5ac8e8", stripe: "#e04a8a", pommel: "#8ad04a" },
  { id: "baget", name: "БАГЕТ", page: "junk", price: 130, blurb: "хрустящий батон", src: "images/knifes/baget.webp", blade: "#e8b878", edge: "#8a5e28", hi: "rgba(255,240,210,0.55)", guard: "#c48a44", handle: "#a8702c", stripe: "#f0c890", pommel: "#8a5a20" },
  { id: "vantuz", name: "ВАНТУЗ", page: "junk", price: 150, blurb: "красная присоска", src: "images/knifes/vantuz.webp", blade: "#d8382c", edge: "#6a1008", hi: "rgba(255,220,210,0.5)", guard: "#a82820", handle: "#8a1c14", stripe: "#f06858", pommel: "#5a0e08" },
  { id: "makarony", name: "МАКАРОНЫ", page: "junk", price: 170, blurb: "вилка с мотком макарон", src: "images/knifes/makarony.webp", blade: "#e8c44a", edge: "#8a6a10", hi: "rgba(255,248,210,0.6)", guard: "#b8b0c0", handle: "#c8c0d0", stripe: "#f0d870", pommel: "#9a92a2" },
  { id: "khlopushka", name: "ХЛОПУШКА", page: "junk", price: 140, blurb: "красная хлопушка с фитилём", src: "images/knifes/khlopushka.webp", blade: "#c8202c", edge: "#5a0a10", hi: "rgba(255,220,220,0.5)", guard: "#e8c040", handle: "#a01822", stripe: "#f0e8e0", pommel: "#5ac8e8" },
  { id: "strizhka", name: "СТРИЖКА", page: "junk", price: 160, blurb: "острые ножницы", src: "images/knifes/strizhka.webp", blade: "#ccd3da", edge: "#2e343a", hi: "rgba(255,255,255,0.8)", guard: "#9aa3ac", handle: "#b6bec6", stripe: "#e8eef4", pommel: "#8f98a1" },
  { id: "kuhonny", name: "КУХОННЫЙ", page: "junk", price: 180, blurb: "нож со стальным клинком", src: "images/knifes/kuhonny.webp", blade: "#dfe4e8", edge: "#20242a", hi: "rgba(255,255,255,0.65)", guard: "#4a4a4e", handle: "#1a1a1c", stripe: "#8a9098", pommel: "#c8ced4" },

  /* ---------- вип для жёлтых минивитрин ----------
     mini: true — нож попадает в жёлтую минивитрину на первой странице
     (js/shop.js: vipMiniEntries). Остальные вип-ножи (ЩЁТКА, РОЖОК,
     НОЖНИЦЫ) остаются на своей странице без мини. */
  { id: "pero", name: "ПЕРО", ad: true, mini: true, blurb: "павлинье перо с золотом", src: "images/knifes/vip/pero.webp?v=2", blade: "#2a8a7a", edge: "#0c3a32", hi: "rgba(210,255,245,0.55)", guard: "#e8b830", handle: "#141a1c", stripe: "#3ac8b0", pommel: "#f0c848" },
  { id: "drakon", name: "ДРАКОН", ad: true, mini: true, blurb: "красный дракон с клинком", src: "images/knifes/vip/drakon.webp", blade: "#c8281c", edge: "#4a0806", hi: "rgba(255,220,200,0.5)", guard: "#e8c040", handle: "#8a1a10", stripe: "#f07050", pommel: "#f0c848" },

  /* ---------- морская коллекция (последняя страница книги) ----------
     Восемь ножей из images/knifes/VIP/океан стоят в морской раме — своя
     страница «okean» в конце книги (js/knife-book.js: BOOK_ORDER). Открываются
     роликом, как прочие VIP-ножи, и отдельной страницей есть в витринах. */
  { id: "volna", name: "ВОЛНА", page: "okean", ad: true, blurb: "гребень волны в клинке", src: "images/knifes/VIP/океан/01_Ocean_Wave_Sword.webp", blade: "#3fc8e8", edge: "#0d4a7a", hi: "rgba(220,250,255,0.6)", guard: "#f0c060", handle: "#1a5f9e", stripe: "#a8ecff", pommel: "#f0c060" },
  { id: "meduza", name: "МЕДУЗА", page: "okean", ad: true, blurb: "фиолетовая медуза с щупальцами", src: "images/knifes/VIP/океан/02_Purple_Jellyfish_Sword.webp", blade: "#c07cff", edge: "#3a1060", hi: "rgba(255,230,255,0.55)", guard: "#f0a8d8", handle: "#7a2fa8", stripe: "#f0c8ff", pommel: "#f0a8d8" },
  { id: "akula", name: "АКУЛА", page: "okean", ad: true, blurb: "тёмный плавник акулы", src: "images/knifes/VIP/океан/03_Shadow_Shark_Sword.webp", blade: "#5a6a78", edge: "#141c24", hi: "rgba(220,235,245,0.45)", guard: "#8a98a4", handle: "#28323c", stripe: "#b8c8d4", pommel: "#8a98a4" },
  { id: "konek", name: "МОРСКОЙ КОНЁК", page: "okean", ad: true, blurb: "золотой морской конёк", src: "images/knifes/VIP/океан/04_Golden_Seahorse_Sword.webp", blade: "#f0c040", edge: "#8a5a10", hi: "rgba(255,248,210,0.6)", guard: "#e8a020", handle: "#c8871f", stripe: "#ffe08a", pommel: "#a86a12" },
  { id: "udilschik", name: "УДИЛЬЩИК", page: "okean", ad: true, blurb: "глубинный удильщик с огоньком", src: "images/knifes/VIP/океан/05_Abyssal_Angler_Sword.webp", blade: "#2a4a6a", edge: "#0a1420", hi: "rgba(160,230,255,0.5)", guard: "#5ae0d0", handle: "#16283c", stripe: "#8afff0", pommel: "#5ae0d0" },
  { id: "cherepaha", name: "ЧЕРЕПАХА", page: "okean", ad: true, blurb: "изумрудный панцирь черепахи", src: "images/knifes/VIP/океан/08_Emerald_Turtle_Sword.webp", blade: "#3fa86a", edge: "#0e3020", hi: "rgba(220,255,230,0.5)", guard: "#a8d860", handle: "#1f6a44", stripe: "#b8f0a0", pommel: "#a8d860" },
  { id: "nautilus", name: "НАУТИЛУС", page: "okean", ad: true, blurb: "перламутровая раковина", src: "images/knifes/VIP/океан/06_Pearl_Nautilus_Sword.webp", blade: "#f0e8f0", edge: "#9a88a8", hi: "rgba(255,255,255,0.75)", guard: "#d8c8e0", handle: "#c0a8c8", stripe: "#fff0ff", pommel: "#a890b8" },
  { id: "marlin", name: "МАРЛИН", page: "okean", ad: true, blurb: "синий марлин с копьём", src: "images/knifes/VIP/океан/07_Blue_Marlin_Sword.webp", blade: "#2a6ad0", edge: "#0a1f4a", hi: "rgba(200,230,255,0.55)", guard: "#8ad0f0", handle: "#1a3a7a", stripe: "#a0e0ff", pommel: "#8ad0f0" },

  /* ---------- покерная коллекция ----------
     Та же схема, что у морской: восемь ножей из images/knifes/VIP/покер стоят
     в своей рамке — страница «poker» сразу за «okean» (js/knife-book.js:
     BOOK_ORDER). Открываются роликом, как прочие VIP-ножи. */
  { id: "pika", name: "ПИКА", page: "poker", ad: true, blurb: "чёрная пика с серебром", src: "images/knifes/VIP/покер/01_Black_Spade_Ornate_Dagger.webp", blade: "#2a2a33", edge: "#0a0a12", hi: "rgba(220,225,240,0.55)", guard: "#c8ccd8", handle: "#1b1b22", stripe: "#8a90a0", pommel: "#e0e4ee" },
  { id: "dama", name: "ДАМА ЧЕРВЕЙ", page: "poker", ad: true, blurb: "алая дама с золотом", src: "images/knifes/VIP/покер/02_Red_Heart_Queen_Dagger.webp", blade: "#d02840", edge: "#4a0a18", hi: "rgba(255,220,225,0.55)", guard: "#f0c860", handle: "#8a1030", stripe: "#ff8098", pommel: "#f0d070" },
  { id: "korona", name: "КОРОНА", page: "poker", ad: true, blurb: "корона четырёх мастей", src: "images/knifes/VIP/покер/07_Four_Suits_Crown_Dagger.webp", blade: "#f0c040", edge: "#6a4a08", hi: "rgba(255,250,215,0.6)", guard: "#f8dc80", handle: "#8a5a10", stripe: "#ffe9a0", pommel: "#f8e090" },
  { id: "trefa", name: "ТРЕФА", page: "poker", ad: true, blurb: "тёмная трефа с изумрудом", src: "images/knifes/VIP/покер/04_Club_Spade_Dagger.webp", blade: "#2f6a45", edge: "#0c2418", hi: "rgba(220,255,230,0.5)", guard: "#b8bcc8", handle: "#1b2a22", stripe: "#7fc89a", pommel: "#d0d4e0" },
  { id: "joker", name: "ДЖОКЕР", page: "poker", ad: true, blurb: "радужный клинок шута", src: "images/knifes/VIP/покер/05_Rainbow_Jester_Blade.webp", blade: "#a558ff", edge: "#2a0a4a", hi: "rgba(255,235,255,0.6)", guard: "#f0c040", handle: "#4a1a6a", stripe: "#ff8ad0", pommel: "#ffd860" },
  { id: "fishka", name: "ФИШКА", page: "poker", ad: true, blurb: "полосатая фишка казино", src: "images/knifes/VIP/покер/06_Poker_Chip_Stripe_Dagger.webp", blade: "#e0384a", edge: "#4a0a14", hi: "rgba(255,240,235,0.5)", guard: "#f4f4f4", handle: "#a02030", stripe: "#ffffff", pommel: "#f0f0f0" },
  { id: "rubin", name: "РУБИН", page: "poker", ad: true, blurb: "рубиновый камень в клинке", src: "images/knifes/VIP/покер/03_Golden_Ruby_Gem_Dagger.webp", blade: "#e83058", edge: "#5a0a20", hi: "rgba(255,235,240,0.6)", guard: "#f0c040", handle: "#8a1a30", stripe: "#ff9ab0", pommel: "#f5d060" },
  { id: "royal", name: "РОЯЛ", page: "poker", ad: true, blurb: "синий роял-флеш в золоте", src: "images/knifes/VIP/покер/08_Blue_Gold_Royal_Dagger.webp", blade: "#2a5ad0", edge: "#0a1a4a", hi: "rgba(215,235,255,0.6)", guard: "#f0c040", handle: "#1a2a6a", stripe: "#9ac0ff", pommel: "#f5d060" },

  /* ---------- карнавальная коллекция ----------
     Восемь ножей из images/knifes/VIP/карнавал в своей рамке — отдельная
     страница «carnival» после покерной (js/knife-book.js: BOOK_ORDER).
     Раскладка та же, что у морской и покерной коллекций. */
  { id: "maska", name: "МАСКА", page: "carnival", ad: true, blurb: "венецианская маска с золотом", src: "images/knifes/VIP/карнавал/01_Masquerade_Mask_Sword.webp", blade: "#8a3fd0", edge: "#2a0a4a", hi: "rgba(245,225,255,0.6)", guard: "#f0c040", handle: "#4a1a6a", stripe: "#d0a0ff", pommel: "#ffd860" },
  { id: "bilet", name: "БИЛЕТ", page: "carnival", ad: true, blurb: "звезда-билет на шоу", src: "images/knifes/VIP/карнавал/02_Star_Ticket_Sword.webp", blade: "#e8b020", edge: "#6a4408", hi: "rgba(255,250,215,0.6)", guard: "#f0c040", handle: "#a06a10", stripe: "#ffe27a", pommel: "#ffd860" },
  { id: "buben", name: "БУБЕН", page: "carnival", ad: true, blurb: "ромб шута в оранжевом", src: "images/knifes/VIP/карнавал/03_Jester_Diamond_Sword.webp", blade: "#f06030", edge: "#5a1a08", hi: "rgba(255,235,220,0.55)", guard: "#ffd860", handle: "#8a2a10", stripe: "#ff9a60", pommel: "#ffd860" },
  { id: "karusel", name: "КАРУСЕЛЬ", page: "carnival", ad: true, blurb: "лошадка с карусели", src: "images/knifes/VIP/карнавал/04_Carousel_Horse_Sword.webp", blade: "#ff6ea8", edge: "#5a0a30", hi: "rgba(255,235,245,0.6)", guard: "#58d8d0", handle: "#8a1a4a", stripe: "#ffb0d0", pommel: "#7ae0d8" },
  { id: "arlekin", name: "АРЛЕКИН", page: "carnival", ad: true, blurb: "улыбка шута в двух цветах", src: "images/knifes/VIP/карнавал/10_Jester_Face_Sword.webp", blade: "#5ad06a", edge: "#0e3a18", hi: "rgba(230,255,230,0.55)", guard: "#c07cff", handle: "#1f6a3a", stripe: "#a8ffb8", pommel: "#e0b0ff" },
  { id: "popcorn", name: "ПОПКОРН", page: "carnival", ad: true, blurb: "ведро попкорна с маслом", src: "images/knifes/VIP/карнавал/07_Popcorn_Sword.webp", blade: "#f0d060", edge: "#6a5010", hi: "rgba(255,252,230,0.6)", guard: "#ffffff", handle: "#b08a20", stripe: "#fff6c0", pommel: "#fffbe0" },
  { id: "fejerverk", name: "ФЕЙЕРВЕРК", page: "carnival", ad: true, blurb: "залп искр в ночном небе", src: "images/knifes/VIP/карнавал/08_Firework_Celebration_Sword.webp", blade: "#3ac8ff", edge: "#0a3a6a", hi: "rgba(215,245,255,0.65)", guard: "#ffd860", handle: "#10306a", stripe: "#9ae8ff", pommel: "#ffe89a" },
  { id: "karamel", name: "КАРАМЕЛЬ", page: "carnival", ad: true, blurb: "полосатая леденцовая трость", src: "images/knifes/VIP/карнавал/05_Candy_Cane_Tent_Sword.webp", blade: "#e83048", edge: "#4a0a18", hi: "rgba(255,240,240,0.65)", guard: "#ffffff", handle: "#a81830", stripe: "#ffffff", pommel: "#fff0f0" },

  /* ---------- мотоспорт ----------
     Восемь ножей из images/knifes/VIP/мотоспорт в своей рамке — страница
     «motosport» после карнавальной (js/knife-book.js: BOOK_ORDER).
     Раскладка ровно та же, что у остальных коллекций. */
  { id: "kubok", name: "КУБОК", page: "motosport", ad: true, blurb: "чемпионский кубок с золотом", src: "images/knifes/VIP/мотоспорт/01_Championship_Trophy_Sword.webp", blade: "#f0c040", edge: "#6a4a08", hi: "rgba(255,250,215,0.6)", guard: "#f8dc80", handle: "#8a5a10", stripe: "#ffe9a0", pommel: "#f8e090" },
  { id: "futbol", name: "ФУТБОЛ", page: "motosport", ad: true, blurb: "клинок с бороздками мяча", src: "images/knifes/VIP/мотоспорт/02_Football_Blade.webp", blade: "#3fa86a", edge: "#0e3020", hi: "rgba(230,255,235,0.55)", guard: "#ffffff", handle: "#1f6a44", stripe: "#ffffff", pommel: "#f0f0f0" },
  { id: "basketbol", name: "БАСКЕТБОЛ", page: "motosport", ad: true, blurb: "оранжевый мяч в клинке", src: "images/knifes/VIP/мотоспорт/03_Basketball_Sword.webp", blade: "#f08020", edge: "#5a2a08", hi: "rgba(255,235,215,0.55)", guard: "#1a1a1a", handle: "#a04a10", stripe: "#ffb060", pommel: "#2a2a2a" },
  { id: "kort", name: "ТЕННИС", page: "motosport", ad: true, blurb: "ракетка и теннисный мяч", src: "images/knifes/VIP/мотоспорт/04_Tennis_Racket_Sword.webp", blade: "#d0e040", edge: "#4a5a08", hi: "rgba(250,255,220,0.6)", guard: "#ffffff", handle: "#8a9a10", stripe: "#f0ff90", pommel: "#f0f0f0" },
  { id: "hokkej", name: "ХОККЕЙ", page: "motosport", ad: true, blurb: "лёд и клюшка в клинке", src: "images/knifes/VIP/мотоспорт/05_Ice_Hockey_Sword.webp", blade: "#7ac8ff", edge: "#0a3a6a", hi: "rgba(235,248,255,0.65)", guard: "#b0b8c8", handle: "#1a3a6a", stripe: "#d0e8ff", pommel: "#c0c8d8" },
  { id: "ekstrim", name: "ЭКСТРИМ", page: "motosport", ad: true, blurb: "молния экстремального спорта", src: "images/knifes/VIP/мотоспорт/06_Extreme_Sports_Lightning_Sword.webp", blade: "#a558ff", edge: "#2a0a4a", hi: "rgba(255,250,200,0.6)", guard: "#ffe040", handle: "#4a1a6a", stripe: "#ffe86a", pommel: "#ffe86a" },
  { id: "bejsbol", name: "БЕЙСБОЛ", page: "motosport", ad: true, blurb: "шов бейсбольного мяча", src: "images/knifes/VIP/мотоспорт/07_Baseball_Stitching_Sword.webp", blade: "#e03a48", edge: "#4a0a14", hi: "rgba(255,240,235,0.55)", guard: "#f0f0f0", handle: "#a02030", stripe: "#ffffff", pommel: "#f0f0f0" },
  { id: "boks", name: "БОКС", page: "motosport", ad: true, blurb: "красные перчатки на клинке", src: "images/knifes/VIP/мотоспорт/08_Boxing_Gloves_Sword.webp", blade: "#d02838", edge: "#4a080f", hi: "rgba(255,225,225,0.55)", guard: "#f0c040", handle: "#8a1020", stripe: "#ff7a8a", pommel: "#f0c040" },

  /* ---------- коллекция монстров ----------
     Восемь ножей из images/knifes/VIP/монстры в своей рамке — последняя
     страница книги (js/knife-book.js: BOOK_ORDER). Раскладка ровно та же,
     что у морской и покерной коллекций. */
  { id: "frank", name: "ФРАНКЕНШТЕЙН", page: "monsters", ad: true, blurb: "зелёный монстр со швами", src: "images/knifes/VIP/монстры/01_Frankenstein_Monster_Sword.webp", blade: "#5aa86a", edge: "#1a3a22", hi: "rgba(225,255,230,0.55)", guard: "#8a98a4", handle: "#2a3a2c", stripe: "#b8d0a8", pommel: "#c8ccd8" },
  { id: "vampir", name: "ВАМПИР", page: "monsters", ad: true, blurb: "кроваво-алый клинок", src: "images/knifes/VIP/монстры/02_Vampire_Blood_Sword.webp", blade: "#b02030", edge: "#3a060c", hi: "rgba(255,220,225,0.55)", guard: "#c8ccd8", handle: "#2a0a12", stripe: "#ff6070", pommel: "#e0e4ee" },
  { id: "ciklop", name: "ЦИКЛОП", page: "monsters", ad: true, blurb: "жёлтый глаз в клинке", src: "images/knifes/VIP/монстры/03_Cyclops_Eye_Sword.webp", blade: "#f0a020", edge: "#6a3008", hi: "rgba(255,240,200,0.6)", guard: "#a558ff", handle: "#4a2a10", stripe: "#ffe08a", pommel: "#c07cff" },
  { id: "demon", name: "ДЕМОН", page: "monsters", ad: true, blurb: "пламя преисподней", src: "images/knifes/VIP/монстры/04_Demon_Flame_Sword.webp", blade: "#e03a20", edge: "#4a0a08", hi: "rgba(255,230,200,0.6)", guard: "#f0c040", handle: "#6a1a10", stripe: "#ffaa40", pommel: "#ffd860" },
  { id: "mumija", name: "МУМИЯ", page: "monsters", ad: true, blurb: "древние бинты и золото", src: "images/knifes/VIP/монстры/05_Mummy_Wrapped_Sword.webp", blade: "#d8c8a0", edge: "#6a5a38", hi: "rgba(255,250,230,0.6)", guard: "#c8b078", handle: "#8a7848", stripe: "#f0e8c8", pommel: "#e0d0a0" },
  { id: "sliz", name: "СЛИЗЕНЬ", page: "monsters", ad: true, blurb: "зелёный слизистый клинок", src: "images/knifes/VIP/монстры/06_Slime_Monster_Sword.webp", blade: "#5ad06a", edge: "#0e3a18", hi: "rgba(230,255,230,0.55)", guard: "#a8f0b8", handle: "#1f6a3a", stripe: "#b8ffc0", pommel: "#c8ffd0" },
  { id: "oboroten", name: "ОБОРОТЕНЬ", page: "monsters", ad: true, blurb: "стальные когти волка", src: "images/knifes/VIP/монстры/07_Werewolf_Claw_Sword.webp", blade: "#7a8494", edge: "#2a3038", hi: "rgba(230,240,250,0.5)", guard: "#c8ccd8", handle: "#3a3a44", stripe: "#b8c0cc", pommel: "#e0e4ee" },
  { id: "tentakl", name: "ТЕНТАКЛЬ", page: "monsters", ad: true, blurb: "щупальце из бездны", src: "images/knifes/VIP/монстры/08_Abyssal_Tentacle_Sword.webp", blade: "#a558ff", edge: "#2a0a4a", hi: "rgba(250,230,255,0.6)", guard: "#ff5fa2", handle: "#4a1a6a", stripe: "#e0a0ff", pommel: "#ff9ad0" },

  /* ---------- средневековая коллекция ----------
     Восемь ножей из images/knifes/VIP/средневековье в своей рамке — страница
     «medieval» перед коллекцией монстров (js/knife-book.js: BOOK_ORDER).
     Раскладка ровно та же, что у морской и покерной коллекций. */
  { id: "gerb", name: "ГЕРБ", page: "medieval", ad: true, blurb: "золотой лев на щите", src: "images/knifes/VIP/средневековье/01_Golden_Lion_Crest_Dagger.webp", blade: "#f0c040", edge: "#6a4a08", hi: "rgba(255,248,210,0.6)", guard: "#e8b830", handle: "#1a2a5a", stripe: "#ffe08a", pommel: "#ffd860" },
  { id: "cherep", name: "ЧЕРЕП", page: "medieval", ad: true, blurb: "пылающий череп в клинке", src: "images/knifes/VIP/средневековье/02_Infernal_Skull_Dagger.webp", blade: "#8a1a1a", edge: "#2a0404", hi: "rgba(255,200,190,0.5)", guard: "#c8a060", handle: "#3a0a0a", stripe: "#e04a2a", pommel: "#d8b060" },
  { id: "zmey", name: "ДРАКОН", page: "medieval", ad: true, blurb: "изумрудный дракон с замком", src: "images/knifes/VIP/средневековье/03_Emerald_Dragon_Sword.webp", blade: "#3fa86a", edge: "#0e3020", hi: "rgba(220,255,230,0.55)", guard: "#c8a040", handle: "#1f6a44", stripe: "#8ae0a8", pommel: "#e0c060" },
  { id: "krest", name: "КРЕСТОНОСЕЦ", page: "medieval", ad: true, blurb: "крест на светлом клинке", src: "images/knifes/VIP/средневековье/04_Crusader_Cross_Sword.webp", blade: "#d8dee6", edge: "#5a626c", hi: "rgba(255,255,255,0.65)", guard: "#c8a038", handle: "#f0ece0", stripe: "#c02828", pommel: "#e8c050" },
  { id: "bashnja", name: "БАШНЯ", page: "medieval", ad: true, blurb: "каменная башня замка", src: "images/knifes/VIP/средневековье/05_Castle_Tower_Sword.webp", blade: "#a8b0bc", edge: "#3a424c", hi: "rgba(240,248,255,0.55)", guard: "#8a929c", handle: "#5a626c", stripe: "#c02828", pommel: "#d8c060" },
  { id: "liliya", name: "ЛИЛИЯ", page: "medieval", ad: true, blurb: "сапфировая лилия", src: "images/knifes/VIP/средневековье/06_Sapphire_Fleur_De_Lis_Sword.webp", blade: "#2a5ad0", edge: "#0a1a4a", hi: "rgba(215,235,255,0.6)", guard: "#f0c040", handle: "#1a2a6a", stripe: "#9ac0ff", pommel: "#ffd860" },
  { id: "lesnik", name: "ЛЕСНИК", page: "medieval", ad: true, blurb: "зелёный капюшон и листья", src: "images/knifes/VIP/средневековье/07_Forest_Hood_Sword.webp", blade: "#3f7a3a", edge: "#123012", hi: "rgba(230,255,220,0.5)", guard: "#8a6a3a", handle: "#2a4a22", stripe: "#a8d060", pommel: "#c8a050" },
  { id: "korol", name: "КОРОЛЬ", page: "medieval", ad: true, blurb: "королевский лев в золоте", src: "images/knifes/VIP/средневековье/08_Royal_Lion_Sword.webp", blade: "#e8b830", edge: "#6a4408", hi: "rgba(255,250,215,0.6)", guard: "#f5d060", handle: "#8a1020", stripe: "#ffe27a", pommel: "#ffd860" },

  /* ---------- конфетная коллекция ----------
     Восемь ножей из images/knifes/VIP/конфеты в своей рамке — страница
     «konfety» в общей секции коллекции (js/knife-book.js: bookSectionList).
     Раскладка ровно та же, что у морской и покерной коллекций. */
  { id: "ledenec", name: "ЛЕДЕНЕЦ", page: "konfety", ad: true, blurb: "радужная карамель", src: "images/knifes/VIP/конфеты/01_Rainbow_Swirl_Candy_Sword.webp", blade: "#ff6ea8", edge: "#5a0a30", hi: "rgba(255,235,245,0.6)", guard: "#5ad0e8", handle: "#a81860", stripe: "#ffe08a", pommel: "#7ae0d8" },
  { id: "shokolad", name: "ШОКОЛАД", page: "konfety", ad: true, blurb: "шоколад с посыпкой", src: "images/knifes/VIP/конфеты/02_Chocolate_Sprinkle_Blade.webp", blade: "#6a3a1a", edge: "#2a1206", hi: "rgba(255,225,190,0.45)", guard: "#f0c040", handle: "#3a1a0a", stripe: "#ff9ad0", pommel: "#ffe08a" },
  { id: "vafli", name: "ВАФЛИ", page: "konfety", ad: true, blurb: "вафля с клубничным кремом", src: "images/knifes/VIP/конфеты/03_Strawberry_Cream_Waffle_Sword.webp", blade: "#e8b060", edge: "#8a5a18", hi: "rgba(255,245,220,0.55)", guard: "#ff8ab8", handle: "#c8871f", stripe: "#ffd0e0", pommel: "#ffb0d0" },
  { id: "kristall", name: "КРИСТАЛЛ", page: "konfety", ad: true, blurb: "радужный кристалл", src: "images/knifes/VIP/конфеты/04_Crystal_Rainbow_Gem_Sword.webp", blade: "#c8e8ff", edge: "#6a9ac8", hi: "rgba(255,255,255,0.8)", guard: "#ffd860", handle: "#7ab0e0", stripe: "#ffb0e0", pommel: "#ffe89a" },
  { id: "mishka", name: "МИШКА", page: "konfety", ad: true, blurb: "башня мармеладных мишек", src: "images/knifes/VIP/конфеты/05_Gummy_Bear_Stack_Sword.webp", blade: "#ff8a3a", edge: "#6a2a08", hi: "rgba(255,240,220,0.6)", guard: "#5ad06a", handle: "#c02828", stripe: "#ffe060", pommel: "#7ae08a" },
  { id: "vata", name: "САХАРНАЯ ВАТА", page: "konfety", ad: true, blurb: "розовый завиток ваты", src: "images/knifes/VIP/конфеты/06_Cotton_Candy_Twirl_Sword.webp", blade: "#ffa8d8", edge: "#c05a90", hi: "rgba(255,250,255,0.7)", guard: "#f0f0f0", handle: "#e88ac0", stripe: "#ffffff", pommel: "#ffe0f0" },
  { id: "apelsin", name: "АПЕЛЬСИН", page: "konfety", ad: true, blurb: "цитрусовый клинок", src: "images/knifes/VIP/конфеты/07_Citrus_Orange_Sword.webp", blade: "#ff8a1e", edge: "#6a3008", hi: "rgba(255,240,210,0.6)", guard: "#3fa86a", handle: "#c8600c", stripe: "#ffd060", pommel: "#a8d860" },
  { id: "klubnika", name: "КЛУБНИКА", page: "konfety", ad: true, blurb: "клубничный пончик", src: "images/knifes/VIP/конфеты/08_Strawberry_Donut_Sword.webp", blade: "#ff5a7a", edge: "#6a0a20", hi: "rgba(255,235,240,0.6)", guard: "#e8c48a", handle: "#c02848", stripe: "#ffe0a0", pommel: "#f0a8c4" },

  /* ---------- коллекция дикого запада ----------
     Восемь ножей из images/knifes/VIP/дикий запад в своей рамке — отдельная
     секция «west» (js/knife-book.js: bookSectionList, BOOK_FRAMES). */
  { id: "zvezda", name: "ЗВЕЗДА", page: "west", ad: true, blurb: "золотая шерифская звезда", src: "images/knifes/VIP/дикий запад/01_Western_Golden_Star_Knife.webp", blade: "#f0c040", edge: "#6a4a08", hi: "rgba(255,250,215,0.65)", guard: "#c8a038", handle: "#6a3a1a", stripe: "#ffe08a", pommel: "#ffd860" },
  { id: "revolver", name: "РЕВОЛЬВЕР", page: "west", ad: true, blurb: "барабан кольта", src: "images/knifes/VIP/дикий запад/02_Revolver_Cylinder_Knife.webp", blade: "#c8ccd8", edge: "#3a4048", hi: "rgba(245,250,255,0.6)", guard: "#8a6a3a", handle: "#4a2a14", stripe: "#a8b0bc", pommel: "#c8a060" },
  { id: "kaktus", name: "КАКТУС", page: "west", ad: true, blurb: "колючий клинок пустыни", src: "images/knifes/VIP/дикий запад/03_Desert_Cactus_Knife.webp", blade: "#4a9a4a", edge: "#123a12", hi: "rgba(225,255,225,0.55)", guard: "#8a6a3a", handle: "#2a5a2a", stripe: "#a8e090", pommel: "#c8a060" },
  { id: "samorodok", name: "САМОРОДОК", page: "west", ad: true, blurb: "золотой самородок", src: "images/knifes/VIP/дикий запад/04_Golden_Nugget_Bowie_Knife.webp", blade: "#f0b830", edge: "#7a4a08", hi: "rgba(255,248,205,0.65)", guard: "#a87a2a", handle: "#5a3a14", stripe: "#ffe27a", pommel: "#e8c050" },
  { id: "karty", name: "КАРТЫ", page: "west", ad: true, blurb: "рубиновая масть", src: "images/knifes/VIP/дикий запад/05_Card_Suit_Ruby_Knife.webp", blade: "#d02838", edge: "#4a0810", hi: "rgba(255,230,230,0.6)", guard: "#c8a038", handle: "#5a1a14", stripe: "#ff7a8a", pommel: "#e8c050" },
  { id: "gremuchka", name: "ГРЕМУЧКА", page: "west", ad: true, blurb: "чешуя гремучей змеи", src: "images/knifes/VIP/дикий запад/06_Rattlesnake_Scale_Knife.webp", blade: "#b08a4a", edge: "#4a3010", hi: "rgba(255,240,205,0.55)", guard: "#6a4a24", handle: "#3a2810", stripe: "#e0c080", pommel: "#c8a060" },
  { id: "podkova", name: "ПОДКОВА", page: "west", ad: true, blurb: "счастливая подкова", src: "images/knifes/VIP/дикий запад/07_Lucky_Horseshoe_Knife.webp", blade: "#c8ccd8", edge: "#4a5058", hi: "rgba(250,252,255,0.6)", guard: "#a87a2a", handle: "#5a3a1a", stripe: "#e0e4ee", pommel: "#d8b060" },
  { id: "zoloto", name: "ЗОЛОТО", page: "west", ad: true, blurb: "тёмное золото с орнаментом", src: "images/knifes/VIP/дикий запад/08_Dark_Gold_Ornament_Knife.webp", blade: "#c89028", edge: "#4a2a08", hi: "rgba(255,240,200,0.6)", guard: "#7a5a20", handle: "#2a1a08", stripe: "#e8c060", pommel: "#f0d080" },

  /* ---------- ДЕМОНИЧЕСКАЯ VIP-КОЛЛЕКЦИЯ ---------- */
  { id: "inferno", name: "ИНФЕРНО", page: "demons", ad: true, blurb: "пламя из преисподней", src: "images/knifes/VIP/демоны/01_Inferno_Flame_Sword.webp", blade: "#ff5a2a", edge: "#4a0808", hi: "rgba(255,230,190,0.55)", guard: "#8a1a12", handle: "#2a0808", stripe: "#ff8a3a", pommel: "#ffb347" },
  { id: "horncrown", name: "РОГАТЫЙ ВЕНЕЦ", page: "demons", ad: true, blurb: "корона и рога", src: "images/knifes/VIP/демоны/02_Demon_Horn_Crown_Sword.webp", blade: "#b03a4a", edge: "#380610", hi: "rgba(255,220,220,0.5)", guard: "#c8a038", handle: "#2a0e14", stripe: "#e05a6a", pommel: "#ffd860" },
  { id: "boneclaw", name: "КОСТЯНОЙ КОГОТЬ", page: "demons", ad: true, blurb: "кость и череп", src: "images/knifes/VIP/демоны/03_Bone_Claw_Skull_Sword.webp", blade: "#e8dcc0", edge: "#5a4a32", hi: "rgba(255,250,230,0.6)", guard: "#8a7a5a", handle: "#3a2a1a", stripe: "#c8b890", pommel: "#d8c8a0" },
  { id: "crimstar", name: "БАГРОВАЯ ЗВЕЗДА", page: "demons", ad: true, blurb: "аметист и кровь", src: "images/knifes/VIP/демоны/04_Crimson_Amethyst_Star_Sword.webp", blade: "#9a3ad0", edge: "#2a0848", hi: "rgba(250,225,255,0.6)", guard: "#c02838", handle: "#2a0a1e", stripe: "#ff5a7a", pommel: "#e0a0ff" },
  { id: "cerberus", name: "ЦЕРБЕР", page: "demons", ad: true, blurb: "три головы, один клинок", src: "images/knifes/VIP/демоны/05_Cerberus_Three_Heads_Sword.webp", blade: "#5a6a8a", edge: "#101828", hi: "rgba(220,235,255,0.55)", guard: "#8a1a12", handle: "#1a1018", stripe: "#c02838", pommel: "#e05a3a" },
  { id: "ghostflame", name: "ПРИЗРАЧНОЕ ПЛАМЯ", page: "demons", ad: true, blurb: "холодный огонь", src: "images/knifes/VIP/демоны/06_Aqua_Ghost_Flame_Sword.webp", blade: "#3ad0d8", edge: "#0a3a48", hi: "rgba(225,255,255,0.65)", guard: "#1a6a7a", handle: "#0a1e2a", stripe: "#8afff0", pommel: "#5ae0d0" },
  { id: "bloodruby", name: "КРОВАВЫЙ РУБИН", page: "demons", ad: true, blurb: "капли рубина", src: "images/knifes/VIP/демоны/07_Blood_Ruby_Dripping_Sword.webp", blade: "#c01828", edge: "#3a0408", hi: "rgba(255,220,220,0.55)", guard: "#8a1018", handle: "#280408", stripe: "#ff4a5a", pommel: "#ffb0b0" },
  { id: "dragonfang", name: "КЛЫК ДРАКОНА", page: "demons", ad: true, blurb: "зуб древнего дракона", src: "images/knifes/VIP/демоны/08_Dragon_Fang_Flame_Sword.webp", blade: "#f0a020", edge: "#5a2a08", hi: "rgba(255,245,210,0.6)", guard: "#8a3a12", handle: "#2a1008", stripe: "#ff7a20", pommel: "#ffd060" },

  /* ---------- КОСМИЧЕСКАЯ VIP-КОЛЛЕКЦИЯ ---------- */
  { id: "voidcrescent", name: "ПУСТОТА", page: "space", ad: true, blurb: "серп из туманности", src: "images/knifes/VIP/космос/01_Void_Nebula_Crescent_Sword.webp", blade: "#6a5ad0", edge: "#1a0a4a", hi: "rgba(235,225,255,0.6)", guard: "#b08aff", handle: "#120a2a", stripe: "#8a7aff", pommel: "#d0b8ff" },
  { id: "planet", name: "ПЛАНЕТА", page: "space", ad: true, blurb: "золотая орбита", src: "images/knifes/VIP/космос/02_Golden_Planetary_Sword.webp", blade: "#f0c040", edge: "#6a4a08", hi: "rgba(255,250,215,0.65)", guard: "#c8a038", handle: "#2a1a08", stripe: "#ffe08a", pommel: "#ffd860" },
  { id: "solar", name: "СОЛЯР", page: "space", ad: true, blurb: "солнечное пламя", src: "images/knifes/VIP/космос/03_Solar_Flame_Sword.webp", blade: "#ff8a1e", edge: "#6a2a04", hi: "rgba(255,245,210,0.6)", guard: "#e04a12", handle: "#2a0e04", stripe: "#ffb040", pommel: "#ffe080" },
  { id: "galaxy", name: "ГАЛАКТИКА", page: "space", ad: true, blurb: "спираль галактики", src: "images/knifes/VIP/космос/04_Galaxy_Vortex_Blade.webp", blade: "#7a5aff", edge: "#1a0a5a", hi: "rgba(240,230,255,0.65)", guard: "#3a8ae8", handle: "#0a0a2a", stripe: "#ff6ad0", pommel: "#b8a0ff" },
  { id: "rocket", name: "РАКЕТА", page: "space", ad: true, blurb: "красно-белый старт", src: "images/knifes/VIP/космос/05_Red_White_Rocket_Sword.webp", blade: "#e8eef4", edge: "#7a2020", hi: "rgba(255,255,255,0.7)", guard: "#d02828", handle: "#1a1a22", stripe: "#f0f0f0", pommel: "#d02828" },
  { id: "moon", name: "ЛУНА", page: "space", ad: true, blurb: "лунные кратеры", src: "images/knifes/VIP/космос/06_Lunar_Crater_Crescent.webp", blade: "#d8dce8", edge: "#5a6070", hi: "rgba(255,255,255,0.65)", guard: "#8a90a0", handle: "#2a2e38", stripe: "#b8c0d0", pommel: "#a0a8b8" },
  { id: "celestial", name: "СОЗВЕЗДИЕ", page: "space", ad: true, blurb: "звёздный клинок", src: "images/knifes/VIP/космос/07_Celestial_Star_Sword.webp", blade: "#8ae0ff", edge: "#0a3a6a", hi: "rgba(230,250,255,0.7)", guard: "#f0c040", handle: "#0a1a3a", stripe: "#ffe08a", pommel: "#d0f0ff" },
  { id: "ufo", name: "НЛО", page: "space", ad: true, blurb: "энергия пришельцев", src: "images/knifes/VIP/космос/08_Alien_UFO_Energy_Blade.webp", blade: "#5aff8a", edge: "#0a4a1a", hi: "rgba(225,255,230,0.65)", guard: "#8a8a9a", handle: "#1a2a1e", stripe: "#c0ffd0", pommel: "#7ae0a8" },

  /* ---------- МЕМНАЯ VIP-КОЛЛЕКЦИЯ ----------
     Картинки из папки images/knifes/VIP/мемные — как нарисованы, без замен. */
  { id: "mem_doge", name: "ДОГЕ", page: "memes", ad: true, blurb: "такой острый, wow", src: "images/knifes/VIP/мемные/01_Doge_Meme_Sword.webp", blade: "#f0c060", edge: "#5a3208", hi: "rgba(255,250,220,0.65)", guard: "#c9a24a", handle: "#7a4a22", stripe: "#e8b45a", pommel: "#ffd860" },
  { id: "mem_pepe", name: "ПЕПЕ", page: "memes", ad: true, blurb: "редкий зелёный клинок", src: "images/knifes/VIP/мемные/02_Pepe_Frog_Sword.webp", blade: "#6ec24a", edge: "#1e4a12", hi: "rgba(235,255,220,0.6)", guard: "#b8c46a", handle: "#2a5a1a", stripe: "#8ed45a", pommel: "#a8e08a" },
  { id: "mem_nyan", name: "НЯН-КОТ", page: "memes", ad: true, blurb: "пиксельный нянь", src: "images/knifes/VIP/мемные/03_Nyan_Cat_Pixel_Sword.webp", blade: "#ff8ac8", edge: "#5a0a3a", hi: "rgba(255,235,250,0.7)", guard: "#8ae0ff", handle: "#2a0a2a", stripe: "#ffe08a", pommel: "#ffd0f0" },
  { id: "mem_couple", name: "МЕМ-ПАРА", page: "memes", ad: true, blurb: "два мема на одном клинке", src: "images/knifes/VIP/мемные/04_Meme_Couple_Sword.webp", blade: "#c8d0d8", edge: "#2a3038", hi: "rgba(255,255,255,0.65)", guard: "#e8b45a", handle: "#3a3430", stripe: "#e8e4dc", pommel: "#c8b8a8" },
  { id: "mem_scream", name: "КРИЧАЩИЙ КОТ", page: "memes", ad: true, blurb: "очень громкий", src: "images/knifes/VIP/мемные/05_Screaming_Cat_Sword.webp", blade: "#f0a038", edge: "#5a2a08", hi: "rgba(255,240,210,0.6)", guard: "#e8b45a", handle: "#7a3a12", stripe: "#ffd27a", pommel: "#ffe0a8" },
  { id: "mem_coffee", name: "КОФЕ-ПЁС", page: "memes", ad: true, blurb: "сгорел на работе", src: "images/knifes/VIP/мемные/06_Fire_Dog_Coffee_Sword.webp", blade: "#ff7a3a", edge: "#4a1408", hi: "rgba(255,240,220,0.65)", guard: "#8a4a22", handle: "#2a1208", stripe: "#ffb060", pommel: "#ffd090" },
  { id: "mem_troll", name: "ТРОЛЛЬ", page: "memes", ad: true, blurb: "улыбка на всё лезвие", src: "images/knifes/VIP/мемные/07_Trollface_Grin_Sword.webp", blade: "#c9d0d8", edge: "#2a2a30", hi: "rgba(255,255,255,0.7)", guard: "#b8c0c8", handle: "#4a3a2a", stripe: "#f4efe2", pommel: "#e8e4dc" },
  { id: "mem_banana", name: "БАНАНА-КОТ", page: "memes", ad: true, blurb: "банановый кот", src: "images/knifes/VIP/мемные/08_Banana_Cat_Sword.webp", blade: "#ffe066", edge: "#6a5a10", hi: "rgba(255,255,235,0.7)", guard: "#c9a24a", handle: "#7a5a12", stripe: "#fff0a0", pommel: "#ffe89a" },

  /* ---------- временные ножи легендарной ступени ----------
     Легендарная полоса осталась без мечей боссов (единственный — МАХОВИК —
     уехал к редкому ВЕНТИЛЮ), поэтому здесь стоят три заглушки, чтобы раздел
     не был пустым. Файлов нет: их рисует канвас (js/knife.js: paintKnife) по
     цветам скина. Заменить на настоящие: положить webp в images/knifes/bosses
     и дописать src — или удалить строку целиком. page: "legend" кладёт нож
     ровно в легендарный раздел книги (js/knife-book.js: bookSectionList). */
  { id: "legend_tmp_1", page: "legend", name: "СИЯНИЕ", blurb: "временный нож легендарной ступени", blade: "#f2e6c8", edge: "#8a6a20", hi: "rgba(255,250,230,0.7)", guard: "#f0c040", handle: "#6a3a10", stripe: "#ffe08a", pommel: "#ffd860" },
  { id: "legend_tmp_2", page: "legend", name: "МЕТЕОР", blurb: "временный нож легендарной ступени", blade: "#b48aff", edge: "#3a1060", hi: "rgba(245,230,255,0.65)", guard: "#7a2fd6", handle: "#241238", stripe: "#d0a0ff", pommel: "#c07cff" },
  { id: "legend_tmp_3", page: "legend", name: "ЭФИР", blurb: "временный нож легендарной ступени", blade: "#9ae8ff", edge: "#0a3a5a", hi: "rgba(230,250,255,0.7)", guard: "#2fc0d4", handle: "#10303c", stripe: "#b8f0ff", pommel: "#7ae0d8" }
];

/* ---------- мечи боссов (images/knifes/bosses) ----------
   Отдельный клинок к каждому боссу: лежит файлом и выпадает вместе с его
   основным ножом (js/progress.js: bossKnifeIds собирает все скины с boss:).
   boss: — чей это босс: по нему витрина попадает на страницу его редкости
   (js/shop.js: knifeOwnerBoss). Файлы нарисованы в разных размерах и стоят
   не по центру кадра — размер и посадку выравнивает makeKnife по classic
   (обрезка по альфе, общая высота, центр и линия острия). */
const BOSS_SWORD_ROWS = [
  /* [id, босс, имя, файл] */
  ["sw_egg", "egg", "ЖЕЛТОК", "01_Egg_Yolk_Cracked_Shell_Sword.webp"],
  ["sw_slime", "marmalade", "СЛИЗЬ", "01_Red_Slime_Vine_Dagger.webp"],
  ["sw_compass", "compass", "ШТУРМАН", "02_Compass_Star_Sword.webp"],
  ["sw_cheese", "cheese", "ЛОМТИК", "02_Yellow_Cheese_Sword.webp"],
  ["sw_dunk", "basketball", "ДАНК", "03_Basketball_Sword.webp"],
  ["sw_wing", "pumpkin", "КРЫЛО", "03_Orange_Wing_Serrated_Sword.webp"],
  ["sw_porcelain", "plate", "ФАРФОР", "04_Blue_White_Porcelain_Sword.webp"],
  ["sw_caramel", "candy", "КАРАМЕЛЬ", "04_Pink_Flame_Blade.webp"],
  ["sw_sector", "target", "СЕКТОР", "05_Dartboard_Sword.webp"],
  ["sw_glaze", "donut", "ГЛАЗУРЬ", "05_Golden_Serrated_Ring_Blade.webp"],
  ["sw_yarn", "yarn", "МОТОК", "06_Green_Vine_Wrapped_Sword.webp"],
  ["sw_pulse", "heart", "ПУЛЬС", "06_Red_Heart_Sword.webp"],
  ["sw_order", "aegis", "ОРДЕН", "07_Blue_Royal_Shield_Sword.webp"],
  ["sw_cane", "candy", "ТРОСТЬ", "07_Red_White_Candy_Cane_Sword.webp"],
  ["sw_rope", "tape", "ВЕРЁВКА", "08_Rope_Wrapped_Serrated_Dagger.webp"],
  ["sw_chervonets", "coin", "ЧЕРВОНЕЦ", "09_Golden_Star_Emblem_Sword.webp"],
  ["sw_pepperoni", "pizza", "ПЕППЕРОНИ", "09_Pizza_Sword.webp"],
  ["sw_bubble", "marmalade", "ПУЗЫРЬ", "10_Pink_Candy_Crescent_Blade.webp"],
  /* У ВЕНТИЛЯ один нож — сам ВЕНТИЛЬ (js/knife-skins.js выше): по просьбе
     заказчика канвасный клинок заменён готовым webp 10_Red_Valve_Guard_Sword.
     Второй строки МАХОВИК здесь больше нет: это был тот же самый файл. */
  ["sw_tread", "tire", "ПРОТЕКТОР", "11_Black_Chevron_Sword.webp"],
  ["sw_tooth", "saw", "ЗУБЕЦ", "11_Yellow_Black_Saw_Sword.webp"],
  ["sw_buoy", "lifebelt", "БУЙ", "12_Life_Preserver_Guard_Sword.webp"],
  ["sw_gear", "cog", "ЗУБЧАТКА", "12_Steel_Gear_Greatsword.webp"],
  ["sw_wave", "pepsi", "ВОЛНА", "Нож с волнистой эмблемой на лезвии.png"]
];
for (let i = 0; i < BOSS_SWORD_ROWS.length; i++) {
  const row = BOSS_SWORD_ROWS[i];
  KNIFE_SKINS.push({
    id: row[0],
    boss: row[1],
    name: row[2],
    src: "images/knifes/bosses/" + row[3] + "?v=1",
    /* цвета — запасные: если файл не загрузится, канвас нарисует обычный клинок */
    blade: "#cfd6dc",
    edge: "#5a626a",
    hi: "rgba(255,255,255,0.6)",
    guard: "#c4a06a",
    handle: "#6b4a32",
    stripe: "#8a6344",
    pommel: "#c4a06a"
  });
}

/* ---------- классические ножи: только файлы из корня none ----------
   Стартовая редкость «КЛАССИЧЕСКИЕ» — это стартовый нож и 23 готовых webp,
   которые лежат прямо в images/knifes/none. Ножи из подпапок old, arpho-epic
   и poteruanniue в игру не входят и в этой редкости не показываются.
   Размер и посадку выравнивает makeKnife (js/knife.js) по classic. Закрытые
   ножи выдаёт кнопка «Открыть» за яблоки (js/knife-book.js: randomUnlockKnife). */
const NONE_KNIFE_ROWS = [
  ["none", "wrench", "КЛЮЧ", "none/11_Adjustable_Wrench_Sword.webp"],
  ["none", "thermometer", "ГРАДУСНИК", "none/05_Thermometer_Sword.webp"],
  ["none", "hookblade", "КРЮК", "none/03_Crescent_Hook_Sword.webp"],
  ["none", "cactus", "КАКТУС", "none/12_Cactus_Sword.webp"],
  ["none", "cassette", "КАССЕТА", "none/10_Cassette_Sword.webp"],
  ["none", "goldenpen", "ЗОЛОТОЕ ПЕРО", "none/04_Golden_Pen_Sword.webp"],
  ["none", "gamepad", "ГЕЙМПАД", "none/11_Game_Controller_Sword.webp"],
  ["none", "clip", "СКРЕПКА", "none/01_Paperclip_Sword.webp"],
  ["none", "pencil", "КАРАНДАШ", "none/06_Pencil_Sword.webp"],
  ["none", "straw", "ТРУБОЧКА", "none/04_Turquoise_Twist_Sword.webp"],
  ["none", "gamepadstick", "ДЖОЙСТИК", "none/dzostik.webp"],
  ["none", "microphone", "МИКРОФОН", "none/08_Microphone_Sword.webp"],
  ["none", "lightning", "МОЛНИЯ", "none/06_Lightning_Bolt_Sword.webp"],
  ["none", "remote", "ПУЛЬТ", "none/07_Zipper_Sword.webp"],
  ["none", "gold", "ЯНТАРЬ", "none/06_Golden_Utility_Blade.webp"],
  ["none", "toothbrush", "ЗУБНАЯ", "none/07_Toothbrush_Sword.webp"],
  ["none", "keyboard", "КЛАВИАТУРА", "none/09_QWERTY_Keyboard_Sword.webp"],
  ["none", "shadow", "ТЕНЕВОЙ", "none/knife_01.webp"],
  ["none", "ghost", "ПРИЗРАЧНЫЙ", "none/knife_02.webp"],
  ["none", "lunar", "ЛУННЫЙ", "none/knife_09.webp"],
  ["none", "hockey", "КЛЮШКА", "none/12_Golden_Fountain_Pen_Sword.webp"],
  ["none", "cupcake", "КЕКС", "none/10_Ice_Cream_Sundae_Sword.webp"],
  ["none", "movies", "ФИЛЬМЫ", "none/02_Orange_Tape_Sword.webp"]
];

for (let i = 0; i < NONE_KNIFE_ROWS.length; i++) {
  const row = NONE_KNIFE_ROWS[i];
  KNIFE_SKINS.push({
    id: row[1],
    name: row[2],
    page: row[0],
    /* Метка «выпадает из случайной разблокировки»: пул кнопки собран ТОЛЬКО
       из этих ножей (js/knife-book.js: randomUnlockPool). Боссовы и
       магазинные туда не попадают. */
    randomDrop: true,
    src: "images/knifes/" + row[3] + "?v=3"
  });
}

/* ---------- ножи подписок ----------
   Подписки из игры убраны, поэтому карты подписочных ножей нет. */

/* ---------- чистка книги: в коллекции только ножи с файлом ----------
   Заказчик: «удалить из книги все ножи, которых нет в webp». Здесь те скины,
   у которых картинки в images/knifes НЕТ — файл удалён (в корне папки лежит
   только classic.webp), а свои спрайты рисует канвас (js/knife-paint.js).
   В книге остаются только файловые: классика, мечи боссов (images/knifes/
   bosses) и классические ножи (images/knifes/none). Вернуть нож — положить его webp
   и убрать id из списка. Аудит: tools/_knife_audit.cjs.
   ИСКЛЮЧЕНИЕ: ВЕНТИЛЬ (valve) — нож босса-вентиля — снова живёт в книге
   на странице РЕДКИХ и теперь берёт готовый webp (images/knifes/bosses/
   10_Red_Valve_Guard_Sword.webp), а не канвас.
   ВТОРОЕ ИСКЛЮЧЕНИЕ: девять ножей боссов получили готовые webp и тоже убраны
   из списка — БИЛЬЯРД (ball), ШТУРВАЛ (helm), КОКОС (coconut), ШАРИК (balloon),
   РАКЕТКА (tennis), КАМЕРА (camera), МИГАЛКА (disco), ПИРОГ (pie, pirog.webp)
   и РЕВЕРС (reverse, 05_Refresh_Arrows_Sword.webp). Они выпадают со своих
   боссов (js/progress.js: bossKnifeIds) и стоят на страницах их редкостей.
   Нож ПИЦЦА (pizza) из книги убран: его файл 02_Pepperoni_Pizza_Sword.webp
   переименован в pirog.webp и отдан ПИРОГУ, а у босса ПИЦЦЫ остаётся свой
   ПЕППЕРОНИ (sw_pepperoni) — без второго ножа-дубликата. */
const KNIFE_NO_ART = new Set([
  /* канвасные ножи боссов (paint* в js/knife-paint.js) */
  "target", "heart", "marmalade", "pumpkin", "saw",
  "aegis", "egg", "dummy", "fan", "candy", "lifebelt", "pepsi",
  "tire", "coin", "cog",
  /* старые/покупные без файла и без рисовальщика */
  "tomato", "basketball", "plate", "tape", "yarn", "donut",
  "compass", "kokos", "fen", "serp", "schetka", "ryba", "plunzher",
  "skelet", "spagetti", "rozhok", "jungle", "scissors",
  "trezubec", "utochka", "mukhoboyka", "skovoroda", "sapog", "raduga", "baget",
  "vantuz", "makarony", "khlopushka", "strizhka", "kuhonny", "pero", "drakon"
]);
for (let i = KNIFE_SKINS.length - 1; i >= 0; i--) {
  if (KNIFE_NO_ART.has(KNIFE_SKINS[i].id)) KNIFE_SKINS.splice(i, 1);
}
