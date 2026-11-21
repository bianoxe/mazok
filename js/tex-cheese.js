/* СЫР: головка сыра как у эмменталя — восковая жёлтая масса, тёмная корка по
   кромке и «глазки» с настоящей глубиной. Фото — images/boss/сыр.png (текстура
   ниже остаётся запасной, если файла нет). Глазки разложены по
   золотому углу от hash: рисунок одинаков от запуска к запуску, но читается
   живым, а не случайными точками. Свет у всей головки один — сверху слева:
   у каждой дырки светлая кромка сверху и тёмный провал внизу справа. */
function makeCheeseTex() {
  const size = BOSS_TEX, cx = size * 0.5;
  const R = BOSS_TEX_R - 1;
  const [c, g] = makeCanvas(size, size);
  const img = bossImages.cheese;
  if (img) {
    /* Фото головки: клин, выступы и края — из альфы файла, без кругового
       клипа (круг срезал клин). Размер общий для всех фото-боссов —
       paintBossPhotoSprite. */
    paintBossPhotoSprite(g, img, size);
    return c;
  }
  g.translate(cx, cx);
  /* масса: тёплый восковой жёлтый, от блика сверху слева к тёплой кромке.
     Было темнее (на кромке уходило в коричневый) — головка читалась грязной,
     поэтому весь градиент поднят на ступень */
  const body = g.createRadialGradient(-R * 0.22, -R * 0.3, R * 0.05, 0, 0, R);
  body.addColorStop(0, "#fff8c4");
  body.addColorStop(0.4, "#ffe487");
  body.addColorStop(0.75, "#ffd253");
  body.addColorStop(0.93, "#f7bb32");
  body.addColorStop(1, "#e8a521");
  g.fillStyle = body;
  g.beginPath();
  g.arc(0, 0, R, 0, TWO_PI);
  g.fill();
  /* мраморность: крупные мягкие пятна светлее и темнее — масса не пластик */
  for (let i = 0; i < 9; i++) {
    const a = hash(31, i) * TWO_PI;
    const d = R * (0.12 + hash(32, i) * 0.62);
    const rr = R * (0.15 + hash(33, i) * 0.24);
    const px = Math.cos(a) * d, py = Math.sin(a) * d;
    const pg = g.createRadialGradient(px, py, 0, px, py, rr);
    if (hash(34, i) > 0.45) {
      pg.addColorStop(0, "rgba(255, 240, 170, 0.22)");
    } else {
      pg.addColorStop(0, "rgba(206, 132, 18, 0.18)");
    }
    pg.addColorStop(1, "rgba(206, 132, 18, 0)");
    g.fillStyle = pg;
    g.beginPath();
    g.arc(px, py, rr, 0, TWO_PI);
    g.fill();
  }
  /* зернистость: мелкие вкрапления, видные вблизи */
  for (let i = 0; i < 64; i++) {
    const a = hash(35, i) * TWO_PI;
    const d = R * Math.sqrt(hash(36, i)) * 0.9;
    const rr = 1 + hash(37, i) * 2.1;
    g.fillStyle = hash(38, i) > 0.5
      ? "rgba(255, 242, 178, 0.12)"
      : "rgba(150, 88, 10, 0.12)";
    g.beginPath();
    g.arc(Math.cos(a) * d, Math.sin(a) * d, rr, 0, TWO_PI);
    g.fill();
  }
  /* корка: тёплая полоса по кромке (уже и светлее прежней — она и делала сыр
     тёмным) и тонкая светлая линия у неё */
  const rindW = Math.max(8, R * 0.05);
  g.lineWidth = rindW;
  g.strokeStyle = "rgba(196, 132, 34, 0.5)";
  g.beginPath();
  g.arc(0, 0, R - rindW * 0.45, 0, TWO_PI);
  g.stroke();
  g.lineWidth = Math.max(2, R * 0.014);
  g.strokeStyle = "rgba(255, 240, 168, 0.6)";
  g.beginPath();
  g.arc(0, 0, R - rindW - g.lineWidth * 0.5, 0, TWO_PI);
  g.stroke();
  /* глазки: золотой угол раскладывает их равномерно без видимой сетки, к
     середине они крупнее, как в настоящей головке. У каждой дырки тень на
     массе справа внизу, тёмный провал низа и светлая кромка сверху слева —
     свет общий с телом головки */
  const GA = Math.PI * (3 - Math.sqrt(5));
  const HOLES = 13;
  for (let i = 0; i < HOLES; i++) {
    const t = (i + 0.75) / HOLES;
    const a = i * GA + (hash(41, i) - 0.5) * 0.6;
    const rr = R * (0.05 + hash(42, i) * 0.05) * (1.3 - t * 0.5);
    const d = Math.min(R * Math.sqrt(t) * 0.88, R * 0.82 - rr);
    const hx = Math.cos(a) * d, hy = Math.sin(a) * d;
    const squish = 0.82 + hash(43, i) * 0.18;
    const rot = (hash(44, i) - 0.5) * 0.7;
    /* тень дырки на массе — туда же, куда смотрит затемнение всей головки */
    g.fillStyle = "rgba(140, 82, 8, 0.3)";
    g.beginPath();
    g.ellipse(hx + rr * 0.26, hy + rr * 0.3, rr * 1.04, rr * (squish + 0.04), rot, 0, TWO_PI);
    g.fill();
    /* полость: янтарный низ к светлому верхнему краю (низ был почти чёрным —
       глазки читались дырами в пустоту) */
    const hg = g.createRadialGradient(hx + rr * 0.28, hy + rr * 0.4, rr * 0.08, hx, hy, rr);
    hg.addColorStop(0, "#8f5708");
    hg.addColorStop(0.45, "#bb7a0e");
    hg.addColorStop(0.8, "#e8ad2c");
    hg.addColorStop(1, "#ffe07a");
    g.fillStyle = hg;
    g.beginPath();
    g.ellipse(hx, hy, rr, rr * squish, rot, 0, TWO_PI);
    g.fill();
    /* светлая кромка сверху слева: локальные углы дуги считаются с поправкой
       на наклон дырки, чтобы блик оставался у общего света */
    g.strokeStyle = "rgba(255, 238, 152, 0.8)";
    g.lineWidth = Math.max(1.6, rr * 0.15);
    g.beginPath();
    g.ellipse(hx, hy, rr * 0.9, rr * squish * 0.9, rot, Math.PI * 0.8 - rot, Math.PI * 1.7 - rot);
    g.stroke();
    /* тёмный ободок снизу справа — дальняя от света стенка */
    g.strokeStyle = "rgba(96, 54, 5, 0.45)";
    g.lineWidth = Math.max(1.4, rr * 0.12);
    g.beginPath();
    g.ellipse(hx, hy, rr * 0.94, rr * squish * 0.94, rot, -Math.PI * 0.35 - rot, Math.PI * 0.55 - rot);
    g.stroke();
  }
  /* объём: мягкий восковой блик сверху слева, отблеск снизу и общий тёплый
     свет поверх головки (затемнение дальней стороны ослаблено: раньше оно
     съедало половину сыра в коричневый) */
  g.fillStyle = "rgba(255, 252, 232, 0.34)";
  g.beginPath();
  g.ellipse(-R * 0.3, -R * 0.42, R * 0.32, R * 0.13, -0.55, 0, TWO_PI);
  g.fill();
  g.fillStyle = "rgba(255, 250, 222, 0.16)";
  g.beginPath();
  g.ellipse(R * 0.2, R * 0.28, R * 0.12, R * 0.05, 0.5, 0, TWO_PI);
  g.fill();
  g.fillStyle = "rgba(255, 246, 198, 0.1)";
  g.beginPath();
  g.arc(0, 0, R, 0, TWO_PI);
  g.fill();
  const shade = g.createRadialGradient(-R * 0.25, -R * 0.3, R * 0.5, R * 0.15, R * 0.2, R * 1.05);
  shade.addColorStop(0, "rgba(120, 66, 6, 0)");
  shade.addColorStop(1, "rgba(120, 66, 6, 0.14)");
  g.fillStyle = shade;
  g.beginPath();
  g.arc(0, 0, R, 0, TWO_PI);
  g.fill();
  return c;
}