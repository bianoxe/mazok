/* РЕВЕРС — вид на круглый реверс-диск сверху: тяжёлая стальная шайба с насечкой
   по кромке, колодец под стрелками и втулка со шлицем в центре. Две стрелки-дуги
   обе идут ПО ЧАСОВОЙ — как диск и крутится. */
function makeReverseTex() {
  const size = BOSS_TEX;
  const R = BOSS_TEX_R;
  const [c, g] = makeCanvas(size, size);
  g.translate(R, R);
  g.lineJoin = "round";
  g.lineCap = "round";
  g.beginPath();
  g.arc(0, 0, R - 0.5, 0, TWO_PI);
  g.clip();

  /* тело: графит с холодным бликом слева сверху */
  const body = g.createRadialGradient(-R * 0.36, -R * 0.42, R * 0.06, 0, 0, R);
  body.addColorStop(0, "#5b6470");
  body.addColorStop(0.42, "#3b414a");
  body.addColorStop(0.78, "#252b32");
  body.addColorStop(1, "#11151a");
  g.fillStyle = body;
  g.fillRect(-R, -R, size, size);

  /* стальная кромка с насечкой */
  const rim = g.createLinearGradient(-R * 0.75, -R, R * 0.85, R);
  rim.addColorStop(0, "#f1f5fa");
  rim.addColorStop(0.34, "#bcc6d2");
  rim.addColorStop(0.68, "#7b8794");
  rim.addColorStop(1, "#48525d");
  g.beginPath();
  g.arc(0, 0, R - 1, 0, TWO_PI);
  g.arc(0, 0, R * 0.855, 0, TWO_PI, true);
  g.fillStyle = rim;
  g.fill("evenodd");
  const teeth = 84;
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * TWO_PI;
    g.strokeStyle = i % 2 ? "rgba(255,255,255,0.52)" : "rgba(14, 20, 28, 0.34)";
    g.lineWidth = Math.max(1, R * 0.008);
    g.beginPath();
    g.moveTo(Math.cos(a) * R * 0.86, Math.sin(a) * R * 0.86);
    g.lineTo(Math.cos(a) * (R - 2), Math.sin(a) * (R - 2));
    g.stroke();
  }

  /* колодец под стрелками */
  g.beginPath();
  g.arc(0, 0, R * 0.795, 0, TWO_PI);
  g.fillStyle = "rgba(7, 10, 14, 0.62)";
  g.fill();
  g.strokeStyle = "rgba(8, 12, 18, 0.85)";
  g.lineWidth = Math.max(2, R * 0.016);
  g.stroke();

  /* стрелка-дуга: хвост дугой и треугольный наконечник по касательной */
  const arrow = (rad, a0, a1, width, grad, head) => {
    const cw = a1 > a0;
    g.strokeStyle = grad;
    g.fillStyle = grad;
    g.lineWidth = width;
    g.beginPath();
    g.arc(0, 0, rad, a0, a1, !cw);
    g.stroke();
    const px = Math.cos(a1) * rad;
    const py = Math.sin(a1) * rad;
    const tan = cw ? a1 + Math.PI / 2 : a1 - Math.PI / 2;
    const nx = Math.cos(tan);
    const ny = Math.sin(tan);
    const bx = px - nx * head * 0.6;
    const by = py - ny * head * 0.6;
    const half = width * 0.98;
    g.beginPath();
    g.moveTo(px + nx * head * 0.9, py + ny * head * 0.9);
    g.lineTo(bx - ny * half, by + nx * half);
    g.lineTo(bx + ny * half, by - nx * half);
    g.closePath();
    g.fill();
  };

  const warm = g.createLinearGradient(-R * 0.6, -R * 0.6, R * 0.6, R * 0.6);
  warm.addColorStop(0, "#ffc46e");
  warm.addColorStop(0.45, "#ff8a3c");
  warm.addColorStop(1, "#c9300f");
  const cool = g.createLinearGradient(-R * 0.6, R * 0.6, R * 0.6, -R * 0.6);
  cool.addColorStop(0, "#c9ecff");
  cool.addColorStop(0.45, "#6fc0f2");
  cool.addColorStop(1, "#2059b8");
  arrow(R * 0.55, -2.75, -0.30, R * 0.115, warm, R * 0.22);
  arrow(R * 0.55, 0.35, 2.80, R * 0.115, cool, R * 0.22);

  /* втулка со шлицем */
  const hub = g.createRadialGradient(-R * 0.06, -R * 0.08, R * 0.02, 0, 0, R * 0.26);
  hub.addColorStop(0, "#f4f7fb");
  hub.addColorStop(0.35, "#c3ccd7");
  hub.addColorStop(0.72, "#7f8b98");
  hub.addColorStop(1, "#49525c");
  g.beginPath();
  g.arc(0, 0, R * 0.26, 0, TWO_PI);
  g.fillStyle = hub;
  g.fill();
  g.strokeStyle = "rgba(10, 14, 20, 0.8)";
  g.lineWidth = Math.max(2, R * 0.014);
  g.stroke();
  g.beginPath();
  g.arc(0, 0, R * 0.15, 0, TWO_PI);
  g.fillStyle = "rgba(14, 18, 24, 0.9)";
  g.fill();
  g.strokeStyle = "rgba(226, 236, 246, 0.7)";
  g.lineWidth = Math.max(2, R * 0.028);
  g.beginPath();
  g.moveTo(-R * 0.1, 0);
  g.lineTo(R * 0.1, 0);
  g.stroke();

  /* царапины: металл живой, а не залитый градиентом */
  for (let i = 0; i < 30; i++) {
    const a = hash(2600, i) * TWO_PI;
    const d = R * (0.2 + hash(2601, i) * 0.62);
    const len = R * (0.02 + hash(2602, i) * 0.09);
    g.strokeStyle = hash(2603, i) > 0.5 ? "rgba(255,255,255,0.16)" : "rgba(6, 9, 13, 0.3)";
    g.lineWidth = Math.max(1, R * 0.006);
    g.beginPath();
    g.moveTo(Math.cos(a) * d, Math.sin(a) * d);
    g.lineTo(Math.cos(a) * (d + len), Math.sin(a) * (d + len));
    g.stroke();
  }

  g.strokeStyle = "#0b0f14";
  g.lineWidth = Math.max(3, R * 0.02);
  g.beginPath();
  g.arc(0, 0, R - g.lineWidth * 0.3, 0, TWO_PI);
  g.stroke();
  return c;
}
