/* Породы бревна. Индекс темы — это и есть «дерево стадии» (js/progress.js:
   stageWoodAt): картинки лежат в images/wood, запекаются в assets.woods по
   этому же индексу (js/assets.js: WOOD_IMAGE_SRC), цвета нужны для щепок,
   дыма и плашки в редакторе уровней.
   Порядок стадий: дуб → берёза → ель → тёмный дуб → оливковое → разноцветное
   (6 вариантов, на КАЖДОМ бревне свой — js/progress.js: rainbowWoodAt) → дальше
   рандом. Оранжевого дерева в игре нет: убрано из коллекции вместе с картинкой. */
const THEMES = [
  { name: "ДУБ", fill: "#d0a06a", dark: "#a97848", ring: "#c08e58", pith: "#e8d2ae", outline: "#7a5330", chips: ["#d0a06a", "#b88650", "#e8d2ae"] },
  { name: "БЕРЁЗА", fill: "#e2d3b8", dark: "#c4b394", ring: "#d4c3a4", pith: "#f4eee2", outline: "#8a7a60", chips: ["#e2d3b8", "#c4b394", "#f4eee2"] },
  { name: "ЕЛЬ", grain: "spruce", fill: "#e4d7a8", dark: "#8f7d52", ring: "#cbb98a", pith: "#f7efd4", outline: "#5a4c30", chips: ["#e4d7a8", "#a89060", "#f7efd4"] },
  { name: "ТЁМНЫЙ ДУБ", grain: "oak", fill: "#3a2618", dark: "#1c120c", ring: "#5c4030", pith: "#8d6844", outline: "#120c08", chips: ["#3a2618", "#6b4a32", "#c4a070"] },
  { name: "ОЛИВКОВОЕ", grain: "oak", fill: "#a3946a", dark: "#7e734c", ring: "#90845c", pith: "#d8d0b4", outline: "#5a5234", chips: ["#a3946a", "#7e734c", "#d8d0b4"] },
  { name: "РАЗНОЦВЕТНОЕ · БРЫЗГИ", fill: "#d94a8c", dark: "#7a2350", ring: "#e07ab8", pith: "#f6d0e6", outline: "#4a1230", chips: ["#d94a8c", "#f0b03c", "#4cc0e0"] },
  { name: "РАЗНОЦВЕТНОЕ · ВОЛНА", fill: "#2f8ad6", dark: "#1b4f80", ring: "#5ab0e8", pith: "#cfe8f8", outline: "#0e2c4a", chips: ["#2f8ad6", "#5ad6a8", "#f0d04a"] },
  { name: "РАЗНОЦВЕТНОЕ · СИЯНИЕ", fill: "#7a4ad6", dark: "#3f2178", ring: "#a06ae8", pith: "#ded0f8", outline: "#24104a", chips: ["#7a4ad6", "#4ae0c0", "#ff8ad0"] },
  { name: "РАЗНОЦВЕТНОЕ · ТРОПИКА", fill: "#1fa87a", dark: "#0f6448", ring: "#4ad0a0", pith: "#d0f6e8", outline: "#08382a", chips: ["#1fa87a", "#ffd23f", "#ff6a3c"] },
  { name: "РАЗНОЦВЕТНОЕ · ОГОНЬ И ЛЁД", fill: "#d63a2a", dark: "#7a1408", ring: "#f07050", pith: "#cfe8f8", outline: "#4a0a04", chips: ["#d63a2a", "#7fd3ff", "#f0f4f8"] },
  { name: "РАЗНОЦВЕТНОЕ · НЕОН", fill: "#c81ec8", dark: "#6a0a6a", ring: "#f05af0", pith: "#f8d0f8", outline: "#3a063a", chips: ["#c81ec8", "#1ee0e0", "#f0f04a"] }
];

