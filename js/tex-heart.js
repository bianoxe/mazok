/* СЕРДЦЕ-БОСС: тёмное, мясистое, без «девчачьего» глянца.
   Силуэт прежний — общий pathHeart (js/shapes.js): по нему считаются кромка под
   ножом (HEART_FIT в js/wood.js), клинья при смерти и посадка яблок, поэтому
   форма не трогается. Меняется краска: глубокий багровый градиент, мышечные
   волокна, тёмный шов по центру и сдержанный блик вместо яркого пластика. */
function makeHeartTex() {
  const size = BOSS_TEX, cx = BOSS_TEX_R;
  const R = BOSS_TEX_R - 1;
  const [c, g] = makeCanvas(size, size);
  g.translate(cx, cx);
  pathHeart(g, R);
  g.clip();

  /* тело: нормальный красный, светлее к верхней левой доле */
  const body = g.createLinearGradient(-R * 0.55, -R, R * 0.65, R);
  body.addColorStop(0, "#e83a4c");
  body.addColorStop(0.38, "#d02236");
  body.addColorStop(0.72, "#b0162a");
  body.addColorStop(1, "#8c0e20");
  g.fillStyle = body;
  g.fillRect(-cx, -cx, size, size);

  /* тёмная кромка: объём без лаковой яркости */
  const vig = g.createRadialGradient(-R * 0.12, -R * 0.18, R * 0.22, 0, 0, R * 1.12);
  vig.addColorStop(0, "rgba(0, 0, 0, 0)");
  vig.addColorStop(0.7, "rgba(28, 0, 6, 0.10)");
  vig.addColorStop(1, "rgba(20, 0, 4, 0.48)");
  g.fillStyle = vig;
  g.fillRect(-cx, -cx, size, size);

  /* сдержанный блик в левой верхней доле */
  g.save();
  g.translate(-R * 0.34, -R * 0.40);
  g.rotate(-0.5);
  const gloss = g.createRadialGradient(0, 0, R * 0.01, 0, 0, R * 0.28);
  gloss.addColorStop(0, "rgba(255, 214, 214, 0.38)");
  gloss.addColorStop(0.5, "rgba(255, 180, 184, 0.14)");
  gloss.addColorStop(1, "rgba(255, 180, 184, 0)");
  g.fillStyle = gloss;
  g.beginPath();
  g.ellipse(0, 0, R * 0.25, R * 0.12, 0, 0, TWO_PI);
  g.fill();
  g.restore();

  /* тонкий контур по силуэту */
  g.lineJoin = "round";
  g.strokeStyle = "#7a0a18";
  g.lineWidth = R * 0.07;
  pathHeart(g, R);
  g.stroke();
  return c;
}
