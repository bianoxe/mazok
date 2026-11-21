/* ============================================================
   БРЕВНО HIT — ФИНАЛЬНЫЙ КОНФИГ БОССОВ (ВШИТ В ИГРУ)
   ------------------------------------------------------------
   Значения применяются при загрузке игры и не зависят от сети.
   ============================================================ */
window.BH_BOSS_CONFIG = {
  "tiers": [
    { "id": "common", "name": "ОБЫЧНЫЙ", "weight": 92, "xp": 50, "color": "#cdc6b8" },
    { "id": "rare", "name": "РЕДКИЙ", "weight": 6.2, "xp": 150, "color": "#ffd23f" },
    { "id": "legend", "name": "ЛЕГЕНДАРНЫЙ", "weight": 1.5, "xp": 350, "color": "#c07cff" },
    { "id": "secret", "name": "ТАЙНЫЙ", "weight": 0.3, "xp": 700, "color": "#ff4444" }
  ],
  "bosses": [
    { "id": "target", "name": "МИШЕНЬ", "hp": 13, "tier": "common", "from": 2, "to": 2, "fill": "#f4f1ea", "dark": "#1a1a1a", "outline": "#3a2414", "glow": "214, 58, 48" },
    { "id": "valve", "name": "ВЕНТИЛЬ", "hp": 24, "tier": "rare", "from": 3, "to": 0, "fill": "#8b949e", "dark": "#2c343c", "outline": "#101418", "glow": "156, 166, 176" },
    { "id": "tomato", "name": "ПОМИДОР", "hp": 14, "tier": "common", "from": 1, "to": 1, "fill": "#d44532", "dark": "#8a1e16", "outline": "#5a1810", "glow": "210, 56, 40" },
    { "id": "heart", "name": "СЕРДЦЕ", "hp": 14, "tier": "common", "from": 2, "to": 2, "fill": "#c41e36", "dark": "#7a0c1c", "outline": "#4a0810", "glow": "196, 24, 48" },
    { "id": "marmalade", "name": "ЖЕВАЧКА", "hp": 14, "tier": "common", "from": 2, "to": 2, "fill": "#ff6a9c", "dark": "#e03870", "outline": "#c43a68", "glow": "255, 110, 160" },
    { "id": "pumpkin", "name": "ТЫКВА", "hp": 12, "tier": "common", "from": 1, "to": 1, "fill": "#e07018", "dark": "#b0400c", "outline": "#6a2808", "glow": "232, 112, 24" },
    { "id": "basketball", "name": "БАСКЕТБОЛ", "hp": 18, "tier": "common", "from": 6, "to": 0, "fill": "#e2710f", "dark": "#8f3d06", "outline": "#3a1606", "glow": "236, 126, 28" },
    { "id": "plate", "name": "ТАРЕЛКА", "hp": 11, "tier": "common", "from": 6, "to": 0, "fill": "#f4f9ff", "dark": "#c9d8ea", "outline": "#4a709e", "glow": "120, 176, 235" },
    { "id": "tape", "name": "СКОТЧ", "hp": 13, "tier": "common", "from": 6, "to": 0, "fill": "#c9d8e2", "dark": "#8aa2b2", "outline": "#4a5e6a", "glow": "150, 200, 225" },
    { "id": "yarn", "name": "КЛУБОК", "hp": 12, "tier": "common", "from": 10, "to": 0, "fill": "#8fc93a", "dark": "#4a7318", "outline": "#2e4a10", "glow": "150, 210, 80" },
    { "id": "saw", "name": "ПИЛА", "hp": 21, "tier": "rare", "from": 3, "to": 0, "fill": "#b7c0ca", "dark": "#5c6670", "outline": "#2a3038", "glow": "176, 186, 196" },
    { "id": "ball", "name": "БИЛЬЯРД", "hp": 17, "tier": "secret", "from": 6, "to": 0, "fill": "#161616", "dark": "#0a0a0a", "outline": "#0e0e0e", "glow": "232, 210, 160" },
    { "id": "pizza", "name": "ПИЦЦА", "hp": 12, "tier": "common", "from": 3, "to": 3, "fill": "#e8b45a", "dark": "#8a2818", "outline": "#6a3418", "glow": "232, 148, 56" },
    { "id": "aegis", "name": "ЩИТ", "hp": 11, "tier": "common", "from": 3, "to": 0, "fill": "#a87440", "dark": "#3a2414", "outline": "#1a140e", "glow": "196, 154, 90" },
    { "id": "donut", "name": "ПОНЧИК", "hp": 15, "tier": "common", "from": 3, "to": 3, "fill": "#ff4d8d", "dark": "#e0943c", "outline": "#b86a32", "glow": "255, 90, 150" },
    { "id": "cheese", "name": "СЫР", "hp": 10, "tier": "common", "from": 1, "to": 1, "fill": "#f7c948", "dark": "#c9921f", "outline": "#b5811c", "glow": "255, 205, 70" },
    { "id": "helm", "name": "ШТУРВАЛ", "hp": 14, "tier": "legend", "from": 4, "to": 0, "fill": "#b6834a", "dark": "#5c3818", "outline": "#3a2412", "glow": "184, 132, 72" },
    { "id": "coconut", "name": "КОКОС", "hp": 20, "tier": "secret", "from": 3, "to": 0, "fill": "#8a5a32", "dark": "#4a2c18", "outline": "#2a180e", "glow": "196, 140, 72" },
    { "id": "egg", "name": "ЯЙЦО", "hp": 14, "tier": "common", "from": 5, "to": 0, "fill": "#f3ead8", "dark": "#d7c6a6", "outline": "#6e5840", "glow": "236, 214, 176" },
    { "id": "dummy", "name": "ЧУЧЕЛО", "hp": 15, "tier": "common", "from": 3, "to": 0, "fill": "#c4a36a", "dark": "#6b4e32", "outline": "#3a2818", "glow": "176, 140, 78" },
    { "id": "fan", "name": "ФЕН", "hp": 12, "tier": "legend", "from": 4, "to": 0, "fill": "#c9c1b4", "dark": "#5c564e", "outline": "#2a2622", "glow": "214, 148, 86" },
    { "id": "candy", "name": "КОНФЕТА", "hp": 8, "tier": "rare", "from": 1, "to": 1, "fill": "#f6e4e0", "dark": "#c43a48", "outline": "#6e1018", "glow": "225, 40, 56" },
    { "id": "lifebelt", "name": "СПАСАТЕЛЬНЫЙ КРУГ", "hp": 15, "tier": "rare", "from": 3, "to": 0, "fill": "#e1062c", "dark": "#f3eeea", "outline": "#6e1020", "glow": "225, 36, 52" },
    { "id": "pepsi", "name": "ПЭПСИ", "hp": 16, "tier": "rare", "from": 1, "to": 2, "fill": "#1e5ed0", "dark": "#0e2c66", "outline": "#0a2a6a", "glow": "58, 124, 226" },
    { "id": "reverse", "name": "РЕВЕРС", "hp": 17, "tier": "rare", "from": 3, "to": 0, "fill": "#3a4048", "dark": "#14171b", "outline": "#0b0e12", "glow": "255, 138, 60" },
    { "id": "tire", "name": "ШИНА", "hp": 12, "tier": "common", "from": 4, "to": 0, "fill": "#232628", "dark": "#101214", "outline": "#0c0e10", "glow": "120, 128, 136" },
    { "id": "coin", "name": "МОНЕТА", "hp": 11, "tier": "rare", "from": 2, "to": 2, "fill": "#e8b62e", "dark": "#8a6410", "outline": "#6a4a08", "glow": "245, 190, 60" },
    { "id": "balloon", "name": "ШАРИК", "hp": 1, "tier": "legend", "from": 1, "to": 1, "fill": "#e02338", "dark": "#9c0a22", "outline": "#6a0818", "glow": "230, 44, 66" },
    { "id": "pie", "name": "ЯБЛОЧНЫЙ ПИРОГ", "hp": 8, "tier": "legend", "from": 1, "to": 1, "fill": "#d9a04e", "dark": "#8a5a20", "outline": "#6a4418", "glow": "232, 168, 72" },
    { "id": "cog", "name": "ШЕСТЕРЁНКА", "hp": 13, "tier": "common", "from": 4, "to": 0, "fill": "#8f99a5", "dark": "#2b323a", "outline": "#111820", "glow": "150, 162, 176" },
    { "id": "tennis", "name": "ТЕННИСНЫЙ МЯЧ", "hp": 20, "tier": "secret", "from": 5, "to": 0, "fill": "#c8e034", "dark": "#7a9618", "outline": "#3f5408", "glow": "202, 224, 60" },
    { "id": "compass", "name": "КОМПАС", "hp": 14, "tier": "common", "from": 5, "to": 0, "fill": "#e7dcc4", "dark": "#8a7352", "outline": "#2a241c", "glow": "196, 148, 72" },
    { "id": "camera", "name": "КАМЕРА", "hp": 18, "tier": "legend", "from": 5, "to": 0, "fill": "#3a78c8", "dark": "#161412", "outline": "#0a0806", "glow": "64, 168, 220" },
    { "id": "disco", "name": "ДИСКО ШАР", "hp": 17, "tier": "legend", "from": 5, "to": 0, "fill": "#a8b2c4", "dark": "#2c3240", "outline": "#10131a", "glow": "150, 140, 255" }
  ]
};
