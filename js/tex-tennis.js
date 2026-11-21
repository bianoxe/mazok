/* ТЕННИСНЫЙ МЯЧ — жёлто-зелёный войлок с двумя белыми швами. Картинка должна
   читаться ШАРОМ, а не жёлтым кругом: свет ложится сверху слева, к кромке
   уходит тень, блик стоит отдельно от основы, а швы идут по сфере дугами —
   так мяч объёмный.

   Швы вплавлены в саму текстуру: она крутится вместе с боссом (ровный ход,
   как у баскетбольного босса в Knife Hit), поэтому швы едут по мячу, а не
   стоят на месте. Единственный неподвижный блик — drawShineGlint поверх
   готового диска: свет в игре не крутится вместе с боссом.

   Войлок даёт мелкая крапина: без неё мяч выглядит пластмассовым шариком. */
function makeTennisTex() {
  const size = BOSS_TEX;
  const R = BOSS_TEX_R;
  const [c, g] = makeCanvas(size, size);
  const img = bossImages.tennis;
  if (img) {
    paintBossPhotoDisc(g, img, size, R - 0.5);
    return c;
  }
  g.translate(R, R);
  g.lineJoin = "round";
  g.lineCap = "round";
  g.save();
  g.beginPath();
  g.arc(0, 0, R - 0.5, 0, TWO_PI);
  g.clip();

  /* основа: флуоресцентная жёлто-зелёнка, свет сверху слева */
  const felt = g.createRadialGradient(-R * 0.3, -R * 0.34, R * 0.05, R * 0.06, R * 0.1, R * 1.02);
  felt.addColorStop(0, "#fbffb4");
  felt.addColorStop(0.24, "#e6f75c");
  felt.addColorStop(0.55, "#c8e034");
  felt.addColorStop(0.8, "#93b41e");
  felt.addColorStop(1, "#5e7812");
  g.fillStyle = felt;
  g.fillRect(-R, -R, size, size);

  /* войлок: ворс светлее и темнее основы, крупных пятен нет */
  for (let i = 0; i < 190; i++) {
    const a = hash(4100, i) * TWO_PI;
    const d = R * (0.06 + hash(4101, i) * 0.9);
    const x = Math.cos(a) * d;
    const y = Math.sin(a) * d;
    const r = R * (0.008 + hash(4102, i) * 0.016);
    g.fillStyle = hash(4103, i) > 0.5
      ? "rgba(255,255,220," + (0.1 + hash(4104, i) * 0.16).toFixed(3) + ")"
      : "rgba(72, 96, 12," + (0.08 + hash(4105, i) * 0.14).toFixed(3) + ")";
    g.beginPath();
    g.ellipse(x, y, r, r * 0.62, a, 0, TWO_PI);
    g.fill();
  }

  /* швы: две дуги по сфере — от макушки к низу, каждая со своей тенью.
     Тень идёт под швом и чуть наружу от него, поэтому шов кажется накладным */
  const seam = (mirror) => {
    const m = mirror ? -1 : 1;
    g.beginPath();
    g.moveTo(0, -R * 0.995);
    g.bezierCurveTo(m * R * 0.96, -R * 0.58, m * R * 0.96, R * 0.58, 0, R * 0.995);
  };
  for (const mirror of [false, true]) {
    seam(mirror);
    g.strokeStyle = "rgba(56, 74, 10, 0.34)";
    g.lineWidth = R * 0.115;
    g.stroke();
    seam(mirror);
    g.strokeStyle = "rgba(255, 255, 244, 0.92)";
    g.lineWidth = R * 0.082;
    g.stroke();
    seam(mirror);
    g.strokeStyle = "rgba(255, 255, 255, 0.5)";
    g.lineWidth = R * 0.03;
    g.stroke();
  }

  /* тень по краю: без неё шар сливается с фоном */
  const rim = g.createRadialGradient(0, 0, R * 0.55, 0, 0, R);
  rim.addColorStop(0, "rgba(0,0,0,0)");
  rim.addColorStop(0.72, "rgba(24, 36, 4, 0.14)");
  rim.addColorStop(1, "rgba(14, 22, 2, 0.44)");
  g.fillStyle = rim;
  g.beginPath();
  g.arc(0, 0, R, 0, TWO_PI);
  g.fill();

  /* блик: широкое пятно и маленькое ядро — войлок блестит мягко */
  const glow = g.createRadialGradient(-R * 0.34, -R * 0.4, R * 0.03, -R * 0.3, -R * 0.35, R * 0.5);
  glow.addColorStop(0, "rgba(255,255,255,0.72)");
  glow.addColorStop(0.44, "rgba(255,255,255,0.18)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = glow;
  g.beginPath();
  g.arc(-R * 0.3, -R * 0.35, R * 0.5, 0, TWO_PI);
  g.fill();
  g.save();
  g.translate(-R * 0.3, -R * 0.34);
  g.rotate(-0.42);
  g.fillStyle = "rgba(255,255,255,0.5)";
  g.beginPath();
  g.ellipse(0, 0, R * 0.13, R * 0.072, 0, 0, TWO_PI);
  g.fill();
  g.restore();
  g.restore();

  /* кант: узкая тёмная кромка, чтобы мяч отделялся от неба */
  g.strokeStyle = "rgba(38, 54, 6, 0.5)";
  g.lineWidth = Math.max(2.4, R * 0.018);
  g.beginPath();
  g.arc(0, 0, R - 1, 0, TWO_PI);
  g.stroke();
  return c;
}
