function makePumpkinTex() {
  const size = BOSS_TEX, cx = BOSS_TEX_R;
  const [c, g] = makeCanvas(size, size);
  const img = bossImages.pumpkin;
  if (img) {
    /* Как помидор/пила: без обрезки кругом — края и черешок из альфы файла.
       paintBossPhotoDisc срезал бока и стебель. */
    paintBossPhotoSprite(g, img, size);
    return c;
  }
  g.translate(cx, cx);
  pathPumpkin(g, BOSS_TEX_R - 1);
  g.clip();
  const skin = g.createRadialGradient(-40, -50, 16, 10, 20, cx);
  skin.addColorStop(0, "#f0a030");
  skin.addColorStop(0.35, "#e07018");
  skin.addColorStop(0.72, "#c0480c");
  skin.addColorStop(1, "#7a2808");
  g.fillStyle = skin;
  g.fillRect(-cx, -cx, size, size);
  for (let i = 0; i < 8; i++) {
    const a0 = -Math.PI / 2 + (i / 8) * TWO_PI;
    const a1 = a0 + TWO_PI / 8;
    const mid = a0 + TWO_PI / 16;
    g.fillStyle = i % 2 === 0 ? "rgba(90, 24, 4, 0.18)" : "rgba(255, 190, 70, 0.12)";
    g.beginPath();
    g.moveTo(0, 0);
    g.arc(0, 0, cx, a0, a1);
    g.closePath();
    g.fill();
    g.strokeStyle = "rgba(90, 24, 6, 0.4)";
    g.lineWidth = 7;
    g.beginPath();
    g.moveTo(Math.cos(mid) * 16, Math.sin(mid) * 16);
    g.quadraticCurveTo(Math.cos(mid + 0.08) * 110, Math.sin(mid + 0.08) * 105, Math.cos(mid) * 230, Math.sin(mid) * 220);
    g.stroke();
  }
  g.fillStyle = "rgba(255,220,120,0.22)";
  g.beginPath();
  g.ellipse(-60, -80, 50, 24, -0.5, 0, TWO_PI);
  g.fill();
  return c;
}

