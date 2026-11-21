/* Ножи с боссов. Контур и раскраска у каждого свои.
   Холст 180×500 и длина клинка до гарды те же, что у классики,
   поэтому хитбокс не зависит от рисунка. */

function kGrad(g, x0, y0, x1, y1, stops) {
  const grd = g.createLinearGradient(x0, y0, x1, y1);
  for (let i = 0; i < stops.length; i++) grd.addColorStop(stops[i][0], stops[i][1]);
  return grd;
}

function kFill(g, draw, style) {
  g.beginPath();
  draw(g);
  g.fillStyle = style;
  g.fill();
}

function kFillRule(g, draw, style, rule) {
  g.beginPath();
  draw(g);
  g.fillStyle = style;
  g.fill(rule || "nonzero");
}

function kStroke(g, draw, style, w) {
  g.beginPath();
  draw(g);
  g.strokeStyle = style;
  g.lineWidth = w;
  g.stroke();
}

function kClip(g, draw, fn) {
  g.save();
  g.beginPath();
  draw(g);
  g.clip();
  fn();
  g.restore();
}

function kVolume(g, draw, hi, mid, sh) {
  kFill(g, draw, kGrad(g, -46, 0, 46, 0, [
    [0, sh],
    [0.2, hi],
    [0.46, mid],
    [0.74, mid],
    [1, sh]
  ]));
  kClip(g, draw, () => {
    g.fillStyle = kGrad(g, 0, 8, 0, 258, [
      [0, "rgba(255,255,255,0.4)"],
      [0.18, "rgba(255,255,255,0.07)"],
      [1, "rgba(0,0,0,0.18)"]
    ]);
    g.fillRect(-90, 0, 180, 280);
  });
}

function kSheen(g, draw, x, col) {
  kClip(g, draw, () => {
    g.beginPath();
    g.moveTo(x, 34);
    g.bezierCurveTo(x - 2.5, 96, x - 1.5, 168, x + 1, 228);
    g.strokeStyle = col || "rgba(255,255,255,0.7)";
    g.lineWidth = 2.5;
    g.stroke();
    g.beginPath();
    g.moveTo(x + 3, 20);
    g.lineTo(x + 1, 46);
    g.strokeStyle = "rgba(255,255,255,0.85)";
    g.lineWidth = 1.5;
    g.stroke();
  });
}

function kGrip(g, draw, hi, mid, sh) {
  kFill(g, draw, kGrad(g, -30, 0, 30, 0, [
    [0, sh],
    [0.28, hi],
    [0.55, mid],
    [1, sh]
  ]));
}

function paintTarget(g) {
  /* Дротик: стальное жало, латунный ствол с мишенью, тонкий хвостовик и
     оперение в цветах мишени (чёрный, белый, красный). */

  /* --- жало --- */
  function point(ctx) {
    ctx.moveTo(0, 8);
    ctx.bezierCurveTo(-1.6, 30, -3.8, 62, -6.6, 92);
    ctx.lineTo(6.6, 92);
    ctx.bezierCurveTo(3.8, 62, 1.6, 30, 0, 8);
    ctx.closePath();
  }
  kFill(g, point, kGrad(g, -8, 0, 8, 0, [
    [0, "#505962"],
    [0.2, "#c8d1d8"],
    [0.44, "#e6ecf1"],
    [0.62, "#98a2ab"],
    [1, "#4e565e"]
  ]));
  kClip(g, point, () => {
    g.strokeStyle = "rgba(255,255,255,0.85)";
    g.lineWidth = 1.3;
    g.beginPath();
    g.moveTo(-2.4, 30);
    g.bezierCurveTo(-3.6, 52, -4.6, 72, -5.2, 88);
    g.stroke();
  });
  kStroke(g, point, "#39414a", 1.5);

  /* --- ствол: точёная латунь, компактная и толстая, с мишенью --- */
  function barrel(ctx) {
    ctx.moveTo(-6.6, 92);
    ctx.lineTo(-15.2, 124);
    ctx.lineTo(-15.2, 176);
    ctx.lineTo(-13, 190);
    ctx.lineTo(13, 190);
    ctx.lineTo(15.2, 176);
    ctx.lineTo(15.2, 124);
    ctx.lineTo(6.6, 92);
    ctx.closePath();
  }
  kFill(g, barrel, kGrad(g, -18, 0, 18, 0, [
    [0, "#6a420c"],
    [0.14, "#f7d98a"],
    [0.34, "#e0ae2c"],
    [0.58, "#b8861e"],
    [0.8, "#8a6410"],
    [1, "#573708"]
  ]));
  kClip(g, barrel, () => {
    const rings = ["#1a1a1a", "#f7f4ee", "#d63a32", "#f0c430"];
    let rad = 14.5;
    for (let i = 0; i < rings.length; i++) {
      g.beginPath();
      g.arc(0, 148, rad, 0, Math.PI * 2);
      g.fillStyle = rings[i];
      g.fill();
      rad -= 3.6;
    }
    /* накатка: тонкие кольца у жала и у воротника */
    g.strokeStyle = "rgba(64, 40, 6, 0.45)";
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(-15, 118);
    g.lineTo(15, 118);
    g.moveTo(-15, 172);
    g.lineTo(15, 172);
    g.moveTo(-14, 180);
    g.lineTo(14, 180);
    g.stroke();
    g.strokeStyle = "rgba(255, 244, 200, 0.5)";
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(-15, 120.5);
    g.lineTo(15, 120.5);
    g.moveTo(-15, 174.5);
    g.lineTo(15, 174.5);
    g.moveTo(-14, 182.5);
    g.lineTo(14, 182.5);
    g.stroke();
  });
  kStroke(g, barrel, "#452e08", 1.7);

  /* --- воротник между стволом и хвостовиком --- */
  function collar(ctx) {
    ctx.moveTo(-13, 190);
    ctx.lineTo(13, 190);
    ctx.lineTo(9, 212);
    ctx.lineTo(-9, 212);
    ctx.closePath();
  }
  kFill(g, collar, kGrad(g, 0, 190, 0, 212, [[0, "#f4d585"], [0.5, "#a67c32"], [1, "#63460f"]]));
  kStroke(g, collar, "#452e08", 1.4);

  /* --- хвостовик --- */
  function shaft(ctx) {
    ctx.moveTo(-7.5, 210);
    ctx.lineTo(7.5, 210);
    ctx.lineTo(6.5, 258);
    ctx.lineTo(6.5, 392);
    ctx.lineTo(-6.5, 392);
    ctx.lineTo(-6.5, 258);
    ctx.closePath();
  }
  kGrip(g, shaft, "#414141", "#191919", "#080808");
  kClip(g, shaft, () => {
    g.strokeStyle = "#c0342c";
    g.lineWidth = 2;
    for (let i = 0; i < 13; i++) {
      const y = 222 + i * 12;
      g.beginPath();
      g.moveTo(-9, y);
      g.bezierCurveTo(0, y + 5, 0, y + 5, 9, y + 2);
      g.stroke();
    }
    g.strokeStyle = "rgba(255,255,255,0.45)";
    g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(-4, 218);
    g.lineTo(-4, 388);
    g.stroke();
  });
  kStroke(g, shaft, "#0a0a0a", 1.4);

  /* --- оперение: две лопасти по бокам и узкое ребро по центру --- */
  function flightSpine() {
    g.beginPath();
    g.moveTo(0, 380);
    g.lineTo(4, 430);
    g.lineTo(4, 488);
    g.lineTo(2.4, 496);
    g.lineTo(-2.4, 496);
    g.lineTo(-4, 488);
    g.lineTo(-4, 430);
    g.closePath();
    g.fillStyle = kGrad(g, -4.5, 0, 4.5, 0, [[0, "#151515"], [0.45, "#3c3c3c"], [1, "#101010"]]);
    g.fill();
    g.strokeStyle = "#0a0a0a";
    g.lineWidth = 1;
    g.stroke();
  }
  function flightSide(sign, body, edge, stripe) {
    g.save();
    g.scale(sign, 1);
    g.beginPath();
    g.moveTo(2.5, 382);
    g.quadraticCurveTo(25, 412, 38, 456);
    g.lineTo(38, 496);
    g.lineTo(2.5, 496);
    g.closePath();
    g.fillStyle = body;
    g.fill();
    g.save();
    g.clip();
    g.strokeStyle = stripe;
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(3.5, 392);
    g.quadraticCurveTo(23, 422, 32, 456);
    g.lineTo(32, 492);
    g.stroke();
    g.strokeStyle = "rgba(0,0,0,0.12)";
    g.lineWidth = 1.4;
    g.beginPath();
    g.moveTo(15, 400);
    g.quadraticCurveTo(30, 430, 35, 464);
    g.stroke();
    g.restore();
    g.strokeStyle = edge;
    g.lineWidth = 1.6;
    g.stroke();
    g.restore();
  }
  flightSide(1, "#f4f1ea", "#1a1a1a", "#d63a32");
  flightSide(-1, "#1a1a1a", "#3a3a3a", "#d63a32");
  flightSpine();
}

function paintHeart(g) {
  function blade(ctx) {
    ctx.moveTo(0, 12);
    ctx.bezierCurveTo(-10, 36, -26, 78, -20, 140);
    ctx.bezierCurveTo(-14, 196, -30, 232, -18, 256);
    ctx.lineTo(18, 256);
    ctx.bezierCurveTo(30, 232, 14, 196, 20, 140);
    ctx.bezierCurveTo(26, 78, 10, 36, 0, 12);
    ctx.closePath();
  }
  kVolume(g, blade, "#ff6a7c", "#d41838", "#6a0814");
  kClip(g, blade, () => {
    g.beginPath();
    g.moveTo(0, 168);
    g.bezierCurveTo(-16, 150, -22, 128, -10, 118);
    g.bezierCurveTo(-4, 112, 0, 122, 0, 128);
    g.bezierCurveTo(0, 122, 4, 112, 10, 118);
    g.bezierCurveTo(22, 128, 16, 150, 0, 168);
    g.closePath();
    g.fillStyle = "#ffb0ba";
    g.fill();
    g.strokeStyle = "#6a0818";
    g.lineWidth = 1.5;
    g.stroke();
  });
  kSheen(g, blade, -6, "rgba(255,220,224,0.7)");
  kStroke(g, blade, "#4a0814", 2.3);

  function heartGuard(ctx) {
    ctx.moveTo(0, 292);
    ctx.bezierCurveTo(-28, 268, -48, 236, -22, 228);
    ctx.bezierCurveTo(-8, 224, 0, 240, 0, 248);
    ctx.bezierCurveTo(0, 240, 8, 224, 22, 228);
    ctx.bezierCurveTo(48, 236, 28, 268, 0, 292);
    ctx.closePath();
  }
  kFill(g, heartGuard, kGrad(g, -40, 220, 40, 300, [[0, "#ff8090"], [0.4, "#e02040"], [1, "#7a1020"]]));
  kStroke(g, heartGuard, "#4a0814", 1.8);

  function grip(ctx) {
    ctx.moveTo(-11, 286);
    ctx.bezierCurveTo(-14, 330, -14, 390, -11, 448);
    ctx.lineTo(11, 448);
    ctx.bezierCurveTo(14, 390, 14, 330, 11, 286);
    ctx.closePath();
  }
  kGrip(g, grip, "#4a1820", "#1a060a", "#0a0204");
  kStroke(g, grip, "#2a080c", 1.5);
  g.fillStyle = "#e02040";
  g.beginPath();
  g.moveTo(0, 470);
  g.bezierCurveTo(-12, 456, -16, 444, -8, 440);
  g.bezierCurveTo(-2, 438, 0, 446, 0, 448);
  g.bezierCurveTo(0, 446, 2, 438, 8, 440);
  g.bezierCurveTo(16, 444, 12, 456, 0, 470);
  g.closePath();
  g.fill();
  g.strokeStyle = "#4a0814";
  g.lineWidth = 1.3;
  g.stroke();
}

function paintMarmalade(g) {
  function blade(ctx) {
    ctx.moveTo(0, 14);
    ctx.bezierCurveTo(-22, 36, -34, 72, -10, 108);
    ctx.bezierCurveTo(16, 144, 32, 176, 8, 214);
    ctx.bezierCurveTo(-8, 236, -14, 248, -4, 258);
    ctx.lineTo(14, 258);
    ctx.bezierCurveTo(6, 246, 18, 228, 28, 200);
    ctx.bezierCurveTo(46, 158, 24, 124, 2, 96);
    ctx.bezierCurveTo(-16, 70, -4, 42, 10, 28);
    ctx.quadraticCurveTo(6, 18, 0, 14);
    ctx.closePath();
  }
  kVolume(g, blade, "#ffd6e8", "#ff6a9c", "#c43a68");
  kClip(g, blade, () => {
    g.fillStyle = "rgba(255,255,255,0.7)";
    const specks = [[-8, 78, 2.4], [10, 124, 1.8], [2, 168, 2.2], [-6, 206, 1.7], [8, 228, 2]];
    for (let i = 0; i < specks.length; i++) {
      g.beginPath();
      g.arc(specks[i][0], specks[i][1], specks[i][2], 0, Math.PI * 2);
      g.fill();
    }
  });
  kSheen(g, blade, -2, "rgba(255,255,255,0.8)");
  kStroke(g, blade, "#a02858", 2.3);
  g.beginPath();
  g.moveTo(18, 176);
  g.bezierCurveTo(30, 184, 28, 208, 16, 210);
  g.quadraticCurveTo(24, 196, 12, 182);
  g.closePath();
  g.fillStyle = "#ff8ab4";
  g.fill();
  g.strokeStyle = "#a02858";
  g.lineWidth = 1.3;
  g.stroke();

  const lobes = [250, 300, 350, 400];
  for (let i = 0; i < lobes.length; i++) {
    const y = lobes[i];
    g.beginPath();
    g.roundRect(-22, y, 44, 58, 20);
    g.fillStyle = kGrad(g, -22, y, 22, y + 58, [[0, "#ffd0e4"], [0.35, "#ff7aaa"], [1, "#c43a68"]]);
    g.fill();
    g.strokeStyle = "#8e2450";
    g.lineWidth = 1.6;
    g.stroke();
    g.fillStyle = "#ffe08a";
    g.fillRect(-20, y + 24, 40, 7);
    g.fillStyle = "rgba(255,255,255,0.55)";
    g.beginPath();
    g.ellipse(-6, y + 16, 8, 4, -0.4, 0, Math.PI * 2);
    g.fill();
  }
}

function paintPumpkin(g) {
  /* Лезвие-семечко входит в корку-гарду, корка — в черешок-рукоять,
     зелёный воротник садится на стык, а на пятке — маленькая тыква. */
  function blade(ctx) {
    ctx.moveTo(2, 14);
    ctx.bezierCurveTo(8, 48, 12, 110, 14, 180);
    ctx.bezierCurveTo(15, 224, 14, 254, 13, 278);
    ctx.lineTo(-13, 278);
    ctx.bezierCurveTo(-22, 244, -36, 188, -40, 140);
    ctx.bezierCurveTo(-42, 96, -28, 58, -8, 32);
    ctx.quadraticCurveTo(-2, 20, 2, 14);
    ctx.closePath();
  }
  kVolume(g, blade, "#ffc060", "#f07818", "#8a3008");
  kClip(g, blade, () => {
    g.beginPath();
    g.moveTo(6, 40);
    g.bezierCurveTo(8, 100, 8, 180, 4, 258);
    g.strokeStyle = "rgba(120, 40, 8, 0.4)";
    g.lineWidth = 2;
    g.stroke();
    g.strokeStyle = "rgba(255, 230, 170, 0.55)";
    g.lineWidth = 2.2;
    g.beginPath();
    g.moveTo(-2, 36);
    g.bezierCurveTo(-8, 90, -16, 150, -14, 220);
    g.stroke();
  });
  kStroke(g, blade, "#6a2808", 2.2);

  /* корка-гарда: симметричный воротник, накрывающий и лезвие, и рукоять */
  function guard(ctx) {
    ctx.moveTo(-27, 246);
    ctx.quadraticCurveTo(0, 234, 27, 246);
    ctx.quadraticCurveTo(22, 276, 0, 282);
    ctx.quadraticCurveTo(-22, 276, -27, 246);
    ctx.closePath();
  }
  kFill(g, guard, kGrad(g, -27, 234, 27, 282, [[0, "#a8400c"], [0.42, "#e2701a"], [1, "#7a2c06"]]));
  kStroke(g, guard, "#6a2808", 1.6);

  function grip(ctx) {
    ctx.moveTo(-13, 268);
    ctx.bezierCurveTo(-16, 320, -15, 394, -12, 452);
    ctx.lineTo(12, 452);
    ctx.bezierCurveTo(15, 394, 16, 320, 13, 268);
    ctx.closePath();
  }
  kGrip(g, grip, "#e0b070", "#8a5a28", "#4a2c10");
  kClip(g, grip, () => {
    g.strokeStyle = "rgba(70, 36, 8, 0.35)";
    g.lineWidth = 1.2;
    for (let i = 0; i < 8; i++) {
      const y = 296 + i * 18;
      g.beginPath();
      g.moveTo(-14, y);
      g.quadraticCurveTo(0, y + 5, 14, y + 1);
      g.stroke();
    }
  });
  kStroke(g, grip, "#4a280c", 1.6);

  /* зелёный воротник черешка — поверх стыка корки и рукояти */
  g.fillStyle = "#3d7a22";
  g.beginPath();
  g.ellipse(0, 290, 17, 8, 0, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#1c400e";
  g.lineWidth = 1.3;
  g.stroke();

  /* пятка: тыква на конце рукояти, верх перекрывает рукоять */
  g.fillStyle = kGrad(g, -15, 450, 15, 494, [[0, "#a06a30"], [0.5, "#f0d0a0"], [1, "#6a3c14"]]);
  g.beginPath();
  g.ellipse(0, 466, 15, 19, 0, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#4a280c";
  g.stroke();
}

function paintSaw(g) {
  function blade(ctx) {
    ctx.moveTo(0, 14);
    ctx.lineTo(14, 26);
    ctx.lineTo(14, 288);
    ctx.lineTo(-4, 288);
    for (let i = 0; i < 9; i++) {
      const y = 246 - i * 25;
      ctx.lineTo(-22, y - 8);
      ctx.lineTo(-4, y - 22);
    }
    ctx.closePath();
  }
  kVolume(g, blade, "#ffffff", "#c5ccd4", "#5c6672");
  kSheen(g, blade, 6, "rgba(255,255,255,0.75)");
  kStroke(g, blade, "#2a3038", 2);
  g.fillStyle = "#ffb25a";
  g.beginPath();
  g.arc(4, 240, 5, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#6a4010";
  g.lineWidth = 1.2;
  g.stroke();

  function handle(ctx) {
    ctx.roundRect(-30, 264, 60, 220, 26);
    ctx.roundRect(-14, 306, 28, 148, 14);
  }
  kFillRule(g, handle, kGrad(g, -30, 0, 30, 0, [[0, "#1a1e22"], [0.4, "#4a525c"], [1, "#121416"]]), "evenodd");
  kStroke(g, () => {
    g.roundRect(-30, 264, 60, 220, 26);
  }, "#0c0e10", 2);
  g.strokeStyle = "#ffb25a";
  g.lineWidth = 3;
  g.beginPath();
  g.arc(0, 292, 6, 0, Math.PI * 2);
  g.stroke();
}

function paintBall(g) {
  function blade(ctx) {
    ctx.moveTo(0, 10);
    ctx.lineTo(-9, 26);
    ctx.lineTo(-9, 252);
    ctx.lineTo(9, 252);
    ctx.lineTo(9, 26);
    ctx.closePath();
  }
  kVolume(g, blade, "#ffffff", "#f4f0e6", "#b8b2a6");
  kSheen(g, blade, -3, "rgba(255,255,255,0.9)");
  kStroke(g, blade, "#1a1a1a", 2);

  /* Древко начинается под кольцом, а кольцо насажено на самый низ клинка:
     так детали перекрываются и между ними нет пустой полосы */
  function shaft(ctx) {
    ctx.moveTo(-6, 258);
    ctx.lineTo(6, 258);
    ctx.lineTo(6, 424);
    ctx.lineTo(-6, 424);
    ctx.closePath();
  }
  kGrip(g, shaft, "#3a3a3a", "#141414", "#050505");
  kStroke(g, shaft, "#0a0a0a", 1.4);
  function ring(y) {
    g.fillStyle = kGrad(g, -12, y, 12, y + 10, [[0, "#f0dc9a"], [0.5, "#d4af37"], [1, "#8a6a14"]]);
    g.fillRect(-11, y, 22, 10);
    g.strokeStyle = "#6a5010";
    g.lineWidth = 1;
    g.strokeRect(-11, y, 22, 10);
  }
  ring(250);
  ring(418);

  g.beginPath();
  g.arc(0, 456, 28, 0, Math.PI * 2);
  g.fillStyle = kGrad(g, -20, 428, 24, 484, [[0, "#3a3a3a"], [0.4, "#111"], [1, "#000"]]);
  g.fill();
  g.strokeStyle = "#d4af37";
  g.lineWidth = 2;
  g.stroke();
  g.beginPath();
  g.arc(0, 456, 12, 0, Math.PI * 2);
  g.fillStyle = "#f7f4ee";
  g.fill();
  g.fillStyle = "#111";
  g.font = "800 16px sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("8", 0, 457);
}

function paintPizza(g) {
  function blade(ctx) {
    ctx.moveTo(0, 14);
    ctx.lineTo(-36, 252);
    ctx.quadraticCurveTo(0, 262, 36, 252);
    ctx.closePath();
  }
  kVolume(g, blade, "#fff0c8", "#f0c56a", "#c48830");
  kClip(g, blade, () => {
    g.beginPath();
    g.moveTo(0, 48);
    g.lineTo(-26, 236);
    g.lineTo(26, 236);
    g.closePath();
    g.fillStyle = "#c4482a";
    g.fill();
    g.fillStyle = "#fff4d4";
    const dots = [[-8, 120], [10, 150], [-12, 180], [6, 200], [14, 120], [-2, 160]];
    for (let i = 0; i < dots.length; i++) {
      g.beginPath();
      g.ellipse(dots[i][0], dots[i][1], 4.5, 3, 0.4, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = "#3f6a22";
    g.beginPath();
    g.ellipse(4, 128, 7, 3.2, -0.6, 0, Math.PI * 2);
    g.fill();
  });
  kStroke(g, blade, "#6a3418", 2.4);
  kClip(g, blade, () => {
    g.beginPath();
    g.moveTo(-4, 30);
    g.lineTo(-30, 240);
    g.strokeStyle = "rgba(255, 236, 190, 0.7)";
    g.lineWidth = 7;
    g.stroke();
  });

  function grip(ctx) {
    ctx.moveTo(-10, 258);
    ctx.bezierCurveTo(-12, 320, -11, 390, -9, 458);
    ctx.lineTo(9, 458);
    ctx.bezierCurveTo(11, 390, 12, 320, 10, 258);
    ctx.closePath();
  }
  kGrip(g, grip, "#6ea044", "#3f6a22", "#243e12");
  kStroke(g, grip, "#243e12", 1.5);

  /* корка ломтя: закрывает и основание ломтя, и верх рукояти */
  kFill(g, (ctx) => ctx.roundRect(-38, 244, 76, 30, 10),
    kGrad(g, -38, 244, 38, 274, [[0, "#c4863a"], [0.34, "#f4d396"], [0.72, "#d9a45c"], [1, "#8a5a20"]]));
  kStroke(g, (ctx) => ctx.roundRect(-38, 244, 76, 30, 10), "#6a3418", 2);

  g.fillStyle = "#c4482a";
  g.beginPath();
  g.arc(0, 470, 16, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#6a2014";
  g.lineWidth = 1.6;
  g.stroke();
  g.fillStyle = "#3f6a22";
  g.beginPath();
  g.ellipse(-2, 464, 6, 2.4, -0.5, 0, Math.PI * 2);
  g.fill();
}

function paintAegis(g) {
  function blade(ctx) {
    ctx.moveTo(0, 8);
    ctx.lineTo(-12, 34);
    ctx.lineTo(-13, 246);
    ctx.lineTo(13, 246);
    ctx.lineTo(12, 34);
    ctx.closePath();
  }
  kVolume(g, blade, "#ffffff", "#d5dde4", "#6a7380");
  kClip(g, blade, () => {
    g.fillStyle = "rgba(40, 48, 58, 0.28)";
    g.beginPath();
    g.moveTo(-2.2, 48);
    g.lineTo(-2.2, 232);
    g.lineTo(2.2, 232);
    g.lineTo(2.2, 48);
    g.closePath();
    g.fill();
  });
  kSheen(g, blade, -6, "rgba(255,255,255,0.8)");
  kStroke(g, blade, "#1c2228", 2.1);

  function cross(ctx) {
    ctx.roundRect(-64, 240, 128, 16, 4);
    ctx.moveTo(-8, 240);
    ctx.lineTo(8, 240);
    ctx.lineTo(7, 272);
    ctx.lineTo(-7, 272);
    ctx.closePath();
  }
  kFill(g, cross, kGrad(g, -64, 240, 64, 272, [[0, "#8a929c"], [0.35, "#f4f7fa"], [0.7, "#c4a574"], [1, "#4a4036"]]));
  kStroke(g, cross, "#1c2228", 1.6);

  /* Рукоять шире перекрестья и насажена на него: детали перекрываются,
     пустой полосы между ними нет */
  function grip(ctx) {
    ctx.moveTo(-15, 268);
    ctx.lineTo(15, 268);
    ctx.lineTo(15, 454);
    ctx.lineTo(-15, 454);
    ctx.closePath();
  }
  kGrip(g, grip, "#a08058", "#5c4632", "#2c2016");
  kClip(g, grip, () => {
    g.strokeStyle = "rgba(40, 24, 12, 0.55)";
    g.lineWidth = 2;
    for (let i = 0; i < 7; i++) {
      const y = 290 + i * 20;
      g.beginPath();
      g.moveTo(-15, y);
      g.lineTo(15, y);
      g.stroke();
    }
  });
  kStroke(g, grip, "#2a2018", 1.5);

  g.beginPath();
  g.arc(0, 468, 18, 0, Math.PI * 2);
  g.fillStyle = kGrad(g, -18, 450, 18, 486, [[0, "#f4f7fa"], [0.5, "#9aa4ae"], [1, "#3a4148"]]);
  g.fill();
  g.strokeStyle = "#1c2228";
  g.lineWidth = 1.8;
  g.stroke();
  g.beginPath();
  g.arc(0, 468, 5, 0, Math.PI * 2);
  g.fillStyle = "#c4a574";
  g.fill();
}

function paintMachete(g) {
  function blade(ctx) {
    ctx.moveTo(2, 14);
    ctx.lineTo(-6, 40);
    ctx.bezierCurveTo(-20, 86, -36, 148, -38, 206);
    ctx.bezierCurveTo(-36, 236, -24, 254, -14, 258);
    ctx.lineTo(18, 258);
    ctx.lineTo(20, 240);
    ctx.bezierCurveTo(24, 188, 16, 112, 10, 48);
    ctx.lineTo(2, 14);
    ctx.closePath();
  }
  kVolume(g, blade, "#dfe8c8", "#9aa884", "#3a4a32");
  kSheen(g, blade, -8, "rgba(232,238,214,0.7)");
  kClip(g, blade, () => {
    g.beginPath();
    g.moveTo(8, 56);
    g.bezierCurveTo(12, 120, 12, 190, 8, 240);
    g.strokeStyle = "rgba(36, 48, 28, 0.35)";
    g.lineWidth = 2;
    g.stroke();
  });
  kStroke(g, blade, "#243024", 2.4);

  function collar(ctx) {
    ctx.moveTo(-16, 250);
    ctx.lineTo(20, 250);
    ctx.lineTo(16, 272);
    ctx.lineTo(-14, 272);
    ctx.closePath();
  }
  kFill(g, collar, kGrad(g, 0, 250, 0, 272, [[0, "#e0c48a"], [0.5, "#8a6840"], [1, "#4a3420"]]));
  kStroke(g, collar, "#2a1c10", 1.4);

  function grip(ctx) {
    ctx.moveTo(-14, 274);
    ctx.bezierCurveTo(-18, 320, -18, 390, -14, 446);
    ctx.lineTo(14, 446);
    ctx.bezierCurveTo(16, 390, 16, 320, 13, 274);
    ctx.closePath();
  }
  kGrip(g, grip, "#6a4a30", "#3a2818", "#1a1008");
  kClip(g, grip, () => {
    g.strokeStyle = "#c4a06a";
    g.lineWidth = 3.2;
    for (let i = 0; i < 8; i++) {
      const y = 292 + i * 18;
      g.beginPath();
      g.moveTo(-16, y);
      g.lineTo(16, y);
      g.stroke();
    }
  });
  kStroke(g, grip, "#1a1008", 1.6);
  g.fillStyle = "#e0c48a";
  g.beginPath();
  g.arc(-4, 330, 3.2, 0, Math.PI * 2);
  g.arc(4, 390, 3.2, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = kGrad(g, -16, 446, 16, 492, [[0, "#c4a06a"], [0.5, "#6e5438"], [1, "#2a1c10"]]);
  g.beginPath();
  g.moveTo(-14, 446);
  g.lineTo(14, 446);
  g.lineTo(10, 488);
  g.lineTo(-10, 488);
  g.closePath();
  g.fill();
  g.strokeStyle = "#2a1c10";
  g.lineWidth = 1.4;
  g.stroke();
}

function paintEgg(g) {
  /* Между лезвием и рукоятью — разрезанное вдоль варёное яйцо: белок в форме
     яйца и круглый желток по центру. Детали перекрываются: клинок входит в
     белок сверху, рукоять — снизу, зазоров нет. */
  function blade(ctx) {
    ctx.moveTo(0, 18);
    ctx.bezierCurveTo(-12, 40, -28, 88, -26, 150);
    ctx.bezierCurveTo(-25, 200, -20, 250, -14, 296);
    ctx.lineTo(14, 296);
    ctx.bezierCurveTo(20, 250, 25, 200, 26, 150);
    ctx.bezierCurveTo(28, 88, 12, 40, 0, 18);
    ctx.closePath();
  }
  kVolume(g, blade, "#fffaf2", "#f3ead8", "#c4b496");
  kClip(g, blade, () => {
    const specks = [[-10, 86, 3.1], [8, 112, 2.4], [-4, 142, 3.4], [12, 168, 2.2], [-14, 188, 2.8], [3, 210, 2], [9, 240, 2.5]];
    for (let i = 0; i < specks.length; i++) {
      g.fillStyle = i % 2 ? "rgba(150, 122, 88, 0.72)" : "rgba(255,255,255,0.85)";
      g.beginPath();
      g.ellipse(specks[i][0], specks[i][1], specks[i][2], specks[i][2] * 0.72, 0.5, 0, Math.PI * 2);
      g.fill();
    }
    /* трещинка от удара — как у яйца-босса, но мелкая: тут она на клинке */
    g.beginPath();
    g.moveTo(16, 92);
    g.lineTo(6, 112);
    g.lineTo(15, 130);
    g.lineTo(4, 148);
    g.strokeStyle = "rgba(170, 140, 100, 0.72)";
    g.lineWidth = 1.5;
    g.stroke();
  });
  kSheen(g, blade, -8, "rgba(255,255,255,0.8)");
  kStroke(g, blade, "#8a7460", 2.1);

  /* Разрезанное яйцо: белок яйцевидной формы, по центру круглый желток */
  function yolkCut(ctx) {
    ctx.moveTo(0, 238);
    ctx.bezierCurveTo(-18, 250, -26, 286, -24, 326);
    ctx.bezierCurveTo(-22, 364, -13, 392, 0, 398);
    ctx.bezierCurveTo(13, 392, 22, 364, 24, 326);
    ctx.bezierCurveTo(26, 286, 18, 250, 0, 238);
    ctx.closePath();
  }
  kVolume(g, yolkCut, "#fffdf7", "#f4ecd9", "#c9b896");
  kStroke(g, yolkCut, "#8a7460", 1.9);
  /* желток: круг по центру белка; внизу — чуть утолщённая стенка белка,
     чтобы видно было срез, а не просто пятно */
  const yg = kGrad(g, -18, 288, 18, 340, [[0, "#ffd75e"], [0.45, "#f5b52c"], [1, "#e08a10"]]);
  g.fillStyle = yg;
  g.beginPath();
  g.arc(0, 314, 21, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#b06a08";
  g.lineWidth = 1.6;
  g.stroke();
  g.fillStyle = "rgba(255,255,255,0.5)";
  g.beginPath();
  g.arc(-7, 306, 6, 0, Math.PI * 2);
  g.fill();

  function grip(ctx) {
    ctx.moveTo(-14, 386);
    ctx.bezierCurveTo(-22, 408, -22, 442, -16, 466);
    ctx.bezierCurveTo(-12, 480, -9, 488, -8, 492);
    ctx.quadraticCurveTo(0, 500, 8, 492);
    ctx.bezierCurveTo(9, 488, 12, 480, 16, 466);
    ctx.bezierCurveTo(22, 442, 22, 408, 14, 386);
    ctx.closePath();
  }
  kGrip(g, grip, "#fffaf2", "#e7dcc8", "#c4b496");
  kStroke(g, grip, "#8a7460", 1.6);
  kClip(g, grip, () => {
    g.beginPath();
    g.moveTo(-4, 404);
    g.bezierCurveTo(2, 432, -6, 460, 2, 488);
    g.strokeStyle = "rgba(138, 116, 96, 0.7)";
    g.lineWidth = 1.3;
    g.stroke();
  });
}

function paintDummy(g) {
  /* Клинок гвоздя входит в рукоять-мешковину, а фланец и шарик шляпки
     перекрывают друг друга — ничего не висит в воздухе. */
  function blade(ctx) {
    ctx.moveTo(0, 22);
    ctx.lineTo(-22, 58);
    ctx.lineTo(-22, 268);
    ctx.lineTo(22, 268);
    ctx.lineTo(22, 58);
    ctx.closePath();
  }
  kVolume(g, blade, "#eef2f6", "#b7c0c8", "#4a525a");
  kClip(g, blade, () => {
    g.beginPath();
    g.moveTo(-8, 64);
    g.lineTo(-8, 258);
    g.moveTo(8, 64);
    g.lineTo(8, 258);
    g.strokeStyle = "rgba(30, 36, 42, 0.35)";
    g.lineWidth = 1.6;
    g.stroke();
    g.strokeStyle = "rgba(255,255,255,0.45)";
    g.lineWidth = 2.2;
    g.beginPath();
    g.moveTo(-12, 66);
    g.lineTo(-12, 254);
    g.stroke();
  });
  kStroke(g, blade, "#2c333a", 2.4);

  function grip(ctx) {
    ctx.moveTo(-28, 252);
    ctx.quadraticCurveTo(-36, 330, -30, 414);
    ctx.lineTo(30, 414);
    ctx.quadraticCurveTo(36, 330, 28, 252);
    ctx.closePath();
  }
  kGrip(g, grip, "#f0dcb4", "#c4a36a", "#6b4e32");
  kClip(g, grip, () => {
    g.strokeStyle = "#5c4030";
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(-16, 276);
    g.lineTo(16, 392);
    g.moveTo(16, 276);
    g.lineTo(-16, 392);
    g.stroke();
    g.lineWidth = 1.2;
    for (let i = 0; i < 5; i++) {
      const y = 286 + i * 22;
      g.beginPath();
      g.moveTo(-30, y);
      g.quadraticCurveTo(0, y + 6, 30, y + 2);
      g.stroke();
    }
  });
  kStroke(g, grip, "#3a2818", 1.8);

  /* шляпка гвоздя: фланец лежит на рукояти, шляпка — на фланце */
  g.beginPath();
  g.ellipse(0, 420, 52, 18, 0, 0, Math.PI * 2);
  g.fillStyle = kGrad(g, -52, 402, 52, 438, [[0, "#f2f5f8"], [0.45, "#8a929a"], [1, "#2c333a"]]);
  g.fill();
  g.strokeStyle = "#2c333a";
  g.lineWidth = 2;
  g.stroke();
  g.beginPath();
  g.ellipse(0, 452, 24, 22, 0, 0, Math.PI * 2);
  g.fillStyle = kGrad(g, -18, 430, 18, 474, [[0, "#dfe6ec"], [1, "#4b535b"]]);
  g.fill();
  g.stroke();
}

function paintFan(g) {
  /* Лезвие опущено до верхней кромки рукояти (258), а рукоять начинается под
     ним: детали перекрываются, пустой полосы между ними нет */
  function blade(ctx) {
    ctx.moveTo(0, 12);
    ctx.lineTo(-24, 36);
    ctx.lineTo(-24, 258);
    ctx.lineTo(8, 258);
    ctx.lineTo(22, 150);
    ctx.lineTo(0, 12);
    ctx.closePath();
  }
  kVolume(g, blade, "#ffffff", "#e7e2d8", "#8f877c");
  kClip(g, blade, () => {
    g.beginPath();
    g.moveTo(6, 70);
    g.lineTo(16, 150);
    g.lineTo(4, 236);
    g.strokeStyle = "rgba(70, 64, 58, 0.4)";
    g.lineWidth = 2;
    g.stroke();
  });
  kSheen(g, blade, -12);
  kStroke(g, blade, "#3a342e", 2.3);

  function grip(ctx) {
    ctx.moveTo(-26, 258);
    ctx.lineTo(18, 258);
    ctx.bezierCurveTo(28, 270, 32, 320, 30, 380);
    ctx.bezierCurveTo(28, 440, 16, 468, 0, 472);
    ctx.bezierCurveTo(-22, 468, -34, 420, -32, 340);
    ctx.bezierCurveTo(-30, 290, -28, 266, -26, 258);
    ctx.closePath();
  }
  kGrip(g, grip, "#f6f2ea", "#b7aea2", "#3a342e");
  kStroke(g, grip, "#2a2622", 1.8);
  g.fillStyle = "#2a2622";
  for (let i = 0; i < 3; i++) {
    g.beginPath();
    g.roundRect(-16, 292 + i * 36, 28, 10, 4);
    g.fill();
  }
  g.beginPath();
  g.arc(8, 414, 12, 0, Math.PI * 2);
  g.fillStyle = "#d4543c";
  g.fill();
  g.strokeStyle = "#6a2018";
  g.lineWidth = 1.6;
  g.stroke();
  g.fillStyle = "rgba(255,255,255,0.45)";
  g.beginPath();
  g.arc(4, 410, 3, 0, Math.PI * 2);
  g.fill();
}

function paintCandy(g) {
  function blade(ctx) {
    ctx.moveTo(0, 16);
    ctx.lineTo(-15, 34);
    ctx.lineTo(-15, 236);
    ctx.lineTo(15, 236);
    ctx.lineTo(15, 34);
    ctx.closePath();
  }
  kFill(g, blade, "#fff6f4");
  kClip(g, blade, () => {
    g.save();
    g.translate(0, 120);
    g.rotate(-0.65);
    for (let i = -14; i < 16; i++) {
      g.fillStyle = (i & 1) ? "#e1062c" : "#fff6f4";
      g.fillRect(-80, i * 14, 160, 14);
    }
    g.restore();
    g.fillStyle = kGrad(g, -15, 0, 15, 0, [
      [0, "rgba(0,0,0,0.18)"],
      [0.3, "rgba(255,255,255,0.28)"],
      [1, "rgba(0,0,0,0.22)"]
    ]);
    g.fillRect(-20, 0, 40, 250);
  });
  kSheen(g, blade, -5, "rgba(255,255,255,0.65)");
  kStroke(g, blade, "#8e1420", 2.2);

  function twist(side) {
    g.beginPath();
    g.moveTo(side * 8, 228);
    g.quadraticCurveTo(side * 46, 232, side * 62, 252);
    g.quadraticCurveTo(side * 36, 266, side * 8, 256);
    g.closePath();
    g.fillStyle = side < 0 ? "#fff6f4" : "#e1062c";
    g.fill();
    g.strokeStyle = "#8e1420";
    g.lineWidth = 1.4;
    g.stroke();
  }
  twist(-1);
  twist(1);

  function grip(ctx) {
    ctx.moveTo(-13, 260);
    ctx.lineTo(13, 260);
    ctx.lineTo(13, 455);
    ctx.lineTo(-13, 455);
    ctx.closePath();
  }
  kFill(g, grip, "#fff6f4");
  kClip(g, grip, () => {
    g.save();
    g.translate(0, 360);
    g.rotate(-0.65);
    for (let i = -12; i < 14; i++) {
      g.fillStyle = (i & 1) ? "#e1062c" : "#fff6f4";
      g.fillRect(-40, i * 14, 80, 14);
    }
    g.restore();
  });
  kStroke(g, grip, "#8e1420", 1.6);
  function knot(y, flip) {
    g.save();
    g.translate(0, y);
    if (flip) g.scale(1, -1);
    g.beginPath();
    g.moveTo(-8, 0);
    g.quadraticCurveTo(-36, 8, -28, 28);
    g.quadraticCurveTo(-10, 18, -4, 6);
    g.closePath();
    g.moveTo(8, 0);
    g.quadraticCurveTo(36, 8, 28, 28);
    g.quadraticCurveTo(10, 18, 4, 6);
    g.closePath();
    g.fillStyle = "#fff6f4";
    g.fill();
    g.strokeStyle = "#8e1420";
    g.lineWidth = 1.4;
    g.stroke();
    g.restore();
  }
  knot(452, false);
}

function paintLifebelt(g) {
  /* Спасательный нож: тупой нос, вырез-крюк под верёвку, матовый клинок, красная
     рукоять одного цвета и спасательный круг на навершии. Полос «новогоднего
     леденца» нет: рукоять цельная — вдоль неё только мелкие дольки, — а красное
     это стальная муфта, рукоять и кольцо с четырьмя секторами. */

  /* клинок: спасательный, с тупым скруглённым носом (не жалом) */
  function blade(ctx) {
    ctx.moveTo(-10, 30);
    ctx.quadraticCurveTo(0, 6, 10, 30);
    ctx.bezierCurveTo(13, 54, 15, 82, 16, 112);
    ctx.lineTo(16, 232);
    ctx.quadraticCurveTo(16, 252, 12, 264);
    ctx.lineTo(-12, 264);
    ctx.quadraticCurveTo(-16, 252, -16, 232);
    ctx.lineTo(-16, 112);
    ctx.bezierCurveTo(-15, 82, -13, 54, -10, 30);
    ctx.closePath();
  }
  kVolume(g, blade, "#ffffff", "#f4f1ec", "#c1bbb4");
  kClip(g, blade, () => {
    /* матовая сталь: тёмная спинка справа и светлый спуск слева — по одной грани,
       никаких поперечных полос */
    g.fillStyle = kGrad(g, -16, 0, 16, 0, [
      [0, "rgba(255,255,255,0.55)"],
      [0.4, "rgba(255,255,255,0)"],
      [0.74, "rgba(110,116,124,0.2)"],
      [1, "rgba(58,64,72,0.42)"]
    ]);
    g.fillRect(-20, 0, 40, 280);
    /* вырез-крюк под верёвку у самого носа: главная примета спасательного ножа */
    g.beginPath();
    g.moveTo(16, 52);
    g.bezierCurveTo(5, 58, 3, 72, 8, 82);
    g.bezierCurveTo(11, 72, 13, 66, 16, 62);
    g.closePath();
    g.fillStyle = "#6c7278";
    g.fill();
    g.beginPath();
    g.moveTo(15, 56);
    g.bezierCurveTo(7, 62, 5, 72, 9, 79);
    g.strokeStyle = "rgba(255,255,255,0.6)";
    g.lineWidth = 1.4;
    g.stroke();
  });
  kSheen(g, blade, -8, "rgba(255,255,255,0.7)");
  kStroke(g, blade, "#6f757c", 2.2);

  /* муфта-больстер: стальная, отделяет клинок от красной рукояти */
  function collar(ctx) {
    ctx.roundRect(-19, 250, 38, 28, 7);
  }
  kFill(g, collar, kGrad(g, -19, 250, 19, 278, [[0, "#fdfcfa"], [0.42, "#d2d7dd"], [1, "#8f969e"]]));
  kStroke(g, collar, "#5f656d", 1.6);

  /* рукоять: одна цельная колодка одного цвета — вдоль неё мелкие дольки, ни одной
     поперечной полосы: леденцом она не выглядит */
  function grip(ctx) {
    ctx.moveTo(-16, 256);
    ctx.lineTo(16, 256);
    ctx.bezierCurveTo(19, 302, 19, 350, 17, 390);
    ctx.lineTo(17, 470);
    ctx.lineTo(-17, 470);
    ctx.lineTo(-17, 390);
    ctx.bezierCurveTo(-19, 350, -19, 302, -16, 256);
    ctx.closePath();
  }
  kClip(g, grip, () => {
    g.fillStyle = kGrad(g, -19, 0, 19, 0, [
      [0, "#7e0c1e"],
      [0.26, "#e1244a"],
      [0.58, "#c41230"],
      [1, "#630818"]
    ]);
    g.fillRect(-26, 250, 52, 230);
    /* дольки вдоль рукояти: тень грани и блик рядом с ней */
    for (let i = -2; i <= 2; i++) {
      const x = i * 6.6;
      g.beginPath();
      g.moveTo(x, 262);
      g.lineTo(x, 464);
      g.strokeStyle = "rgba(28,4,12,0.26)";
      g.lineWidth = 2.2;
      g.stroke();
      g.beginPath();
      g.moveTo(x + 1.7, 262);
      g.lineTo(x + 1.7, 464);
      g.strokeStyle = "rgba(255,255,255,0.16)";
      g.lineWidth = 1.3;
      g.stroke();
    }
    /* короткая светлая стяжка у муфты и перед кольцом — как обвязка на ручке */
    g.fillStyle = "rgba(247,244,242,0.9)";
    g.fillRect(-17, 266, 34, 6);
    g.fillRect(-17, 424, 34, 6);
    /* объём: светлая грань слева, тень по краям — колодка читается цельной */
    g.fillStyle = kGrad(g, -26, 0, 26, 0, [
      [0, "rgba(30,8,14,0.34)"],
      [0.24, "rgba(255,255,255,0.14)"],
      [0.6, "rgba(255,255,255,0)"],
      [1, "rgba(20,4,10,0.34)"]
    ]);
    g.fillRect(-26, 250, 52, 230);
  });
  kStroke(g, grip, "#5f0a18", 2);

  /* навершие: спасательный круг — белое кольцо с четырьмя красными секторами,
     надетое на рукоять (рукоять проходит сквозь отверстие) */
  const ry = 452;
  const ro = 34;
  const ri = 15;
  function ring(ctx) {
    ctx.arc(0, ry, ro, 0, Math.PI * 2);
    ctx.arc(0, ry, ri, 0, Math.PI * 2, true);
  }
  g.beginPath();
  ring(g);
  g.fillStyle = "#f7f4f2";
  g.fill();
  kClip(g, ring, () => {
    const seg = Math.PI * 2 / 4;
    g.fillStyle = kGrad(g, -ro, ry - ro, ro, ry + ro, [[0, "#ff5f6e"], [0.5, "#e1062c"], [1, "#8a1022"]]);
    for (let i = 0; i < 4; i++) {
      const a0 = i * seg + seg * 0.19;
      g.beginPath();
      g.arc(0, ry, ro + 2, a0, a0 + seg * 0.62);
      g.arc(0, ry, ri - 2, a0 + seg * 0.62, a0, true);
      g.closePath();
      g.fill();
    }
    g.fillStyle = kGrad(g, -ro, 0, ro, 0, [
      [0, "rgba(30,8,14,0.3)"],
      [0.26, "rgba(255,255,255,0.2)"],
      [0.6, "rgba(255,255,255,0)"],
      [1, "rgba(20,4,10,0.3)"]
    ]);
    g.fillRect(-ro - 3, ry - ro - 3, (ro + 3) * 2, (ro + 3) * 2);
  });
  g.beginPath();
  g.arc(0, ry, ro, 0, Math.PI * 2);
  g.strokeStyle = "#8a1022";
  g.lineWidth = 2.2;
  g.stroke();
  g.beginPath();
  g.arc(0, ry, ri, 0, Math.PI * 2);
  g.strokeStyle = "rgba(122,114,106,0.75)";
  g.lineWidth = 1.6;
  g.stroke();
}

function paintPepsi(g) {
  /* Барный нож: стальной клинок, между ним и рукоятью — открывашка
     (крюк с прорезью под крышку), снизу тёмная рукоять под руку.
     Цветов банки нет: это просто инструмент. Прорезь — evenodd,
     поэтому дырка видна и в игре, и в превью. Крюк целиком выше
     линии рукояти, его не сжимает KNIFE_HANDLE_KEEP. */

  const steelHi = "#f3f6f8";
  const steelMid = "#b4bdc6";
  const steelSh = "#4c555d";
  const line = "#1c2126";

  /* --- рукоять: начинается ровно на линии сжатия, изгиб ниже неё --- */
  function grip(ctx) {
    ctx.moveTo(-16, 274);
    ctx.bezierCurveTo(-26, pyKeep(318), -26, pyKeep(392), -15, pyKeep(428));
    ctx.quadraticCurveTo(0, pyKeep(444), 15, pyKeep(428));
    ctx.bezierCurveTo(26, pyKeep(392), 26, pyKeep(318), 16, 274);
    ctx.closePath();
  }
  kGrip(g, grip, "#4a5056", "#23262a", "#0c0e10");
  kClip(g, grip, () => {
    const groove = 7 / 0.66;
    g.strokeStyle = "rgba(255,255,255,0.14)";
    g.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      const y = pyKeep(312 + i * 24);
      g.beginPath();
      g.moveTo(-22, y);
      g.quadraticCurveTo(0, y + groove, 22, y);
      g.stroke();
    }
    g.strokeStyle = "rgba(0,0,0,0.35)";
    g.lineWidth = 1.4;
    for (let i = 0; i < 5; i++) {
      const y = pyKeep(318 + i * 24);
      g.beginPath();
      g.moveTo(-22, y);
      g.quadraticCurveTo(0, y + groove, 22, y);
      g.stroke();
    }
  });
  kStroke(g, grip, "#0c0e10", 1.8);
  /* штифты */
  for (const yv of [348, 404]) {
    const y = pyKeep(yv);
    g.beginPath();
    g.ellipse(0, y, 4.2, 4.2 / 0.66, 0, 0, Math.PI * 2);
    g.fillStyle = kGrad(g, -5, y - 6, 5, y + 6, [[0, steelHi], [0.5, steelMid], [1, "#2c3238"]]);
    g.fill();
    g.strokeStyle = line;
    g.lineWidth = 1.1;
    g.stroke();
  }
  /* пятка */
  function pommel(ctx) {
    ctx.moveTo(-16, pyKeep(416));
    ctx.lineTo(16, pyKeep(416));
    ctx.quadraticCurveTo(18, pyKeep(440), 0, pyKeep(452));
    ctx.quadraticCurveTo(-18, pyKeep(440), -16, pyKeep(416));
    ctx.closePath();
  }
  kVolume(g, pommel, steelHi, "#8b949c", "#2a3036");
  kStroke(g, pommel, line, 1.6);

  /* --- открывашка: пластина и крюк справа, прорезь под крышку --- */
  function opener(ctx) {
    ctx.moveTo(-20, 148);
    ctx.lineTo(-20, 268);
    ctx.lineTo(16, 268);
    ctx.lineTo(16, 246);
    ctx.lineTo(34, 252);
    ctx.quadraticCurveTo(58, 240, 56, 208);
    ctx.quadraticCurveTo(54, 176, 34, 168);
    ctx.lineTo(16, 174);
    ctx.lineTo(16, 148);
    ctx.closePath();
    /* прорезь: губа снизу ловит крышку */
    ctx.moveTo(18, 188);
    ctx.lineTo(30, 184);
    ctx.quadraticCurveTo(44, 190, 42, 210);
    ctx.quadraticCurveTo(40, 230, 28, 236);
    ctx.lineTo(18, 230);
    ctx.closePath();
  }
  kFillRule(g, opener, kGrad(g, -20, 0, 58, 0, [
    [0, "#3e464e"],
    [0.18, steelHi],
    [0.42, steelMid],
    [0.7, "#7d868e"],
    [1, "#3a424a"]
  ]), "evenodd");
  kClip(g, opener, () => {
    g.fillStyle = "rgba(255,255,255,0.45)";
    g.fillRect(-8, 152, 3, 112);
  });
  kStroke(g, () => {
    g.moveTo(-20, 148);
    g.lineTo(-20, 268);
    g.lineTo(16, 268);
    g.lineTo(16, 246);
    g.lineTo(34, 252);
    g.quadraticCurveTo(58, 240, 56, 208);
    g.quadraticCurveTo(54, 176, 34, 168);
    g.lineTo(16, 174);
    g.lineTo(16, 148);
    g.closePath();
  }, line, 1.8);
  kStroke(g, () => {
    g.moveTo(18, 188);
    g.lineTo(30, 184);
    g.quadraticCurveTo(44, 190, 42, 210);
    g.quadraticCurveTo(40, 230, 28, 236);
    g.lineTo(18, 230);
    g.closePath();
  }, line, 1.4);

  /* больстер между открывашкой и рукоятью */
  kFill(g, (ctx) => ctx.roundRect(-22, 252, 44, 28, 5),
    kGrad(g, -22, 252, 22, 280, [[0, "#d5dbe1"], [0.45, "#6e767e"], [1, "#22262a"]]));
  kStroke(g, (ctx) => ctx.roundRect(-22, 252, 44, 28, 5), line, 1.6);

  /* --- клинок: копьё, обух слева, режущая кромка справа --- */
  function blade(ctx) {
    ctx.moveTo(1, 10);
    ctx.lineTo(-3, 26);
    ctx.lineTo(-15, 62);
    ctx.lineTo(-15, 170);
    ctx.lineTo(13, 170);
    ctx.bezierCurveTo(14, 118, 10, 58, 3, 24);
    ctx.closePath();
  }
  kVolume(g, blade, steelHi, steelMid, steelSh);
  kClip(g, blade, () => {
    /* дол */
    g.beginPath();
    g.moveTo(-2, 48);
    g.bezierCurveTo(-4, 80, -4, 120, -3, 152);
    g.lineTo(2, 152);
    g.bezierCurveTo(1, 120, 1, 80, 2, 48);
    g.closePath();
    g.fillStyle = "rgba(28, 34, 40, 0.28)";
    g.fill();
    g.beginPath();
    g.moveTo(-1, 50);
    g.bezierCurveTo(-2, 84, -2, 122, -1.4, 150);
    g.strokeStyle = "rgba(255,255,255,0.55)";
    g.lineWidth = 1.2;
    g.stroke();
  });
  kSheen(g, blade, -6, "rgba(255,255,255,0.8)");
  kStroke(g, blade, line, 1.8);
  /* плечо клинка заходит на открывашку, стык закрыт */
  kFill(g, (ctx) => ctx.roundRect(-18, 158, 34, 16, 3),
    kGrad(g, -18, 158, 16, 174, [[0, "#c8d0d6"], [0.5, "#6a727a"], [1, "#2a3034"]]));
  kStroke(g, (ctx) => ctx.roundRect(-18, 158, 34, 16, 3), line, 1.4);
}

/* Рукоять ниже KNIFE_HANDLE_EDGE сжимается в KNIFE_HANDLE_KEEP.
   Точка визуальной высоты vis, заданная в координатах рисунка. */
function pyKeep(vis) {
  const edge = 274;
  const keep = 0.66;
  return vis <= edge ? vis : edge + (vis - edge) / keep;
}

function paintTire(g) {
  /* Отвёртка: плоское жало, стальной стержень, феррула и пузатая рукоять
     с продольным рифлением. Жало идёт в стержень, стержень — в феррулу,
     феррула — в рукоять: детали перекрываются, ничего не висит в воздухе. */
  function tip(ctx) {
    ctx.moveTo(0, 10);
    ctx.lineTo(-4.6, 32);
    ctx.lineTo(-10, 58);
    ctx.lineTo(10, 58);
    ctx.lineTo(4.6, 32);
    ctx.closePath();
  }
  kVolume(g, tip, "#f4f7fa", "#c2cad2", "#5a626a");
  kSheen(g, tip, -2, "rgba(255,255,255,0.8)");
  kStroke(g, tip, "#14171a", 2);

  function shaft(ctx) {
    ctx.moveTo(-8, 52);
    ctx.lineTo(8, 52);
    ctx.lineTo(8, 250);
    ctx.lineTo(-8, 250);
    ctx.closePath();
  }
  kVolume(g, shaft, "#eef2f6", "#aab2ba", "#444c54");
  kClip(g, shaft, () => {
    g.fillStyle = "rgba(255,255,255,0.5)";
    g.fillRect(-5.4, 56, 2.6, 190);
    g.fillStyle = "rgba(12,14,16,0.26)";
    g.fillRect(4.2, 56, 3.4, 190);
  });
  kStroke(g, shaft, "#14171a", 2);

  /* феррула — кольцо на стыке стержня и рукояти */
  kFill(g, (ctx) => ctx.roundRect(-11, 240, 22, 28, 5),
    kGrad(g, -11, 240, 11, 268, [[0, "#c6ccd2"], [0.45, "#6a727a"], [1, "#22262a"]]));
  kStroke(g, (ctx) => ctx.roundRect(-11, 240, 22, 28, 5), "#14171a", 1.8);

  /* рукоять: бочонок с продольным рифлением */
  function grip(ctx) {
    ctx.moveTo(-24, 258);
    ctx.bezierCurveTo(-32, 300, -32, 402, -22, 448);
    ctx.quadraticCurveTo(0, 460, 22, 448);
    ctx.bezierCurveTo(32, 402, 32, 300, 24, 258);
    ctx.closePath();
  }
  kGrip(g, grip, "#79828b", "#3c444c", "#12161a");
  kClip(g, grip, () => {
    g.strokeStyle = "rgba(255,255,255,0.15)";
    g.lineWidth = 2.4;
    for (let i = -4; i <= 4; i++) {
      const x = i * 7;
      g.beginPath();
      g.moveTo(x * 1.1, 260);
      g.quadraticCurveTo(x * 1.32, 352, x * 1.1, 452);
      g.stroke();
    }
    g.strokeStyle = "rgba(10,12,14,0.34)";
    g.lineWidth = 1.3;
    for (let i = -4; i <= 4; i++) {
      const x = i * 7 + 4;
      g.beginPath();
      g.moveTo(x * 1.08, 260);
      g.quadraticCurveTo(x * 1.3, 352, x * 1.08, 452);
      g.stroke();
    }
    g.fillStyle = kGrad(g, -33, 0, 33, 0, [
      [0, "rgba(0,0,0,0.45)"],
      [0.3, "rgba(255,255,255,0.2)"],
      [0.64, "rgba(255,255,255,0)"],
      [1, "rgba(0,0,0,0.5)"]
    ]);
    g.fillRect(-34, 254, 68, 208);
  });
  kStroke(g, grip, "#0c0e10", 2);

  /* донышко рукояти — стальной пятак */
  kFill(g, (ctx) => ctx.roundRect(-17, 438, 34, 18, 7),
    kGrad(g, -17, 438, 17, 456, [[0, "#d6dbe0"], [0.5, "#7b838b"], [1, "#2a2f34"]]));
  kStroke(g, (ctx) => ctx.roundRect(-17, 438, 34, 18, 7), "#14171a", 1.6);
}

function paintCoin(g) {
  function blade(ctx) {
    ctx.moveTo(0, 12);
    ctx.bezierCurveTo(-7, 40, -12, 90, -14, 150);
    ctx.bezierCurveTo(-16, 200, -28, 232, -20, 256);
    ctx.lineTo(20, 256);
    ctx.bezierCurveTo(28, 232, 16, 200, 14, 150);
    ctx.bezierCurveTo(12, 90, 7, 40, 0, 12);
    ctx.closePath();
  }
  kVolume(g, blade, "#fff2b8", "#f0c84a", "#a06a10");
  kClip(g, blade, () => {
    g.beginPath();
    g.moveTo(0, 36);
    g.bezierCurveTo(-4, 70, -8, 120, -8, 180);
    g.bezierCurveTo(-8, 210, -14, 230, -10, 242);
    g.lineTo(10, 242);
    g.bezierCurveTo(14, 230, 8, 210, 8, 180);
    g.bezierCurveTo(8, 120, 4, 70, 0, 36);
    g.closePath();
    g.strokeStyle = "rgba(106, 62, 8, 0.45)";
    g.lineWidth = 1.4;
    g.stroke();
  });
  kSheen(g, blade, -5, "rgba(255,252,224,0.8)");
  kStroke(g, blade, "#6a4a08", 2.2);

  function disc(x, y, r) {
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fillStyle = kGrad(g, x - r, y - r, x + r, y + r, [[0, "#fff2b8"], [0.45, "#e8b62e"], [1, "#8a6410"]]);
    g.fill();
    g.beginPath();
    g.arc(x, y, r * 0.62, 0, Math.PI * 2);
    g.strokeStyle = "#6a4a08";
    g.lineWidth = 1.3;
    g.stroke();
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.lineWidth = 1.5;
    g.stroke();
  }
  /* гарда: перекладина, на концах — монеты. Перекладина заходит и в клинок,
     и в рукоять, поэтому монеты больше не висят по бокам в пустоте. */
  function bar(ctx) {
    ctx.roundRect(-51, 246, 102, 30, 12);
  }
  kFill(g, bar, kGrad(g, -51, 246, 51, 276, [[0, "#8a6410"], [0.3, "#f6d977"], [0.68, "#e8b62e"], [1, "#7a5408"]]));
  kStroke(g, bar, "#6a4a08", 1.8);
  disc(-35, 261, 17);
  disc(35, 261, 17);

  function grip(ctx) {
    ctx.moveTo(-10, 262);
    ctx.lineTo(10, 262);
    ctx.lineTo(9, 446);
    ctx.lineTo(-9, 446);
    ctx.closePath();
  }
  kGrip(g, grip, "#f6d977", "#a06a10", "#6a4a08");
  kClip(g, grip, () => {
    g.strokeStyle = "rgba(255, 236, 170, 0.55)";
    g.lineWidth = 1.4;
    for (let i = 0; i < 10; i++) {
      const y = 286 + i * 14;
      g.beginPath();
      g.moveTo(-12, y);
      g.lineTo(12, y + 8);
      g.stroke();
    }
  });
  kStroke(g, grip, "#6a4a08", 1.4);

  g.beginPath();
  g.arc(0, 462, 28, 0, Math.PI * 2);
  g.fillStyle = kGrad(g, -28, 434, 28, 490, [[0, "#fff6d0"], [0.4, "#e8b62e"], [1, "#8a5c10"]]);
  g.fill();
  g.strokeStyle = "#6a4a08";
  g.lineWidth = 2;
  g.stroke();
  g.beginPath();
  g.arc(0, 462, 20, 0, Math.PI * 2);
  g.stroke();
  g.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 4;
    const rr = (i & 1) ? 6 : 14;
    const px = Math.cos(a) * rr;
    const py = 462 + Math.sin(a) * rr;
    if (i === 0) g.moveTo(px, py);
    else g.lineTo(px, py);
  }
  g.closePath();
  g.fillStyle = "#fff6d0";
  g.fill();
  g.strokeStyle = "#8a6410";
  g.lineWidth = 1;
  g.stroke();
}

function paintBalloon(g) {
  /* Игла с ниткой — как у шарика, который висит на нити.
     Остриё смотрит вверх (это и есть клинок), стержень тонкий и тянется
     вниз, а у самого низа пятка с ушком, сквозь которое продета красная
     нить: она уходит за стержень слева и выныривает из ушка справа.
     Ушко вырезано правилом evenodd, поэтому и в игре, и в превью
     (tools/_knife_render.js) видна настоящая дырка, а не заливка. */

  function body(ctx) {
    ctx.moveTo(0, 6);
    ctx.bezierCurveTo(-3.0, 40, -3.8, 120, -4.8, 236);
    ctx.bezierCurveTo(-5.4, 300, -6.2, 360, -6.6, 386);
    ctx.bezierCurveTo(-8.2, 400, -10.4, 416, -10.6, 440);
    ctx.bezierCurveTo(-10.8, 462, -8.6, 478, -4.6, 486);
    ctx.quadraticCurveTo(-1.8, 493, 0, 493);
    ctx.quadraticCurveTo(1.8, 493, 4.6, 486);
    ctx.bezierCurveTo(8.6, 478, 10.8, 462, 10.6, 440);
    ctx.bezierCurveTo(10.4, 416, 8.2, 400, 6.6, 386);
    ctx.bezierCurveTo(6.2, 360, 5.4, 300, 4.8, 236);
    ctx.bezierCurveTo(3.8, 120, 3.0, 40, 0, 6);
    ctx.closePath();
  }
  function eye(ctx) {
    ctx.moveTo(0, 420);
    ctx.bezierCurveTo(-4.8, 426, -5.0, 464, 0, 471);
    ctx.bezierCurveTo(5.0, 464, 4.8, 426, 0, 420);
    ctx.closePath();
  }

  /* нить за иглой: над стержнем её не видно, торчит слева и в ушке */
  g.beginPath();
  g.moveTo(-44, 358);
  g.bezierCurveTo(-28, 388, -14, 416, -2, 448);
  g.bezierCurveTo(0, 452, 1, 455, 2, 458);
  g.strokeStyle = "#c4122c";
  g.lineWidth = 4.6;
  g.stroke();
  g.strokeStyle = "#ff8a98";
  g.lineWidth = 1.8;
  g.stroke();

  /* стальной стержень: горизонтальный блеск + объёмная тень сверху вниз */
  g.beginPath();
  body(g);
  eye(g);
  g.fillStyle = kGrad(g, -12, 0, 12, 0, [
    [0, "#5a646e"],
    [0.18, "#eef4fa"],
    [0.4, "#c2ccd6"],
    [0.64, "#9aa6b1"],
    [1, "#5a646e"]
  ]);
  g.fill("evenodd");
  g.beginPath();
  body(g);
  eye(g);
  g.fillStyle = kGrad(g, 0, 8, 0, 492, [
    [0, "rgba(255,255,255,0.36)"],
    [0.3, "rgba(255,255,255,0.08)"],
    [0.68, "rgba(0,0,0,0.05)"],
    [1, "rgba(0,0,0,0.3)"]
  ]);
  g.fill("evenodd");

  /* светлая жилка вдоль стержня — игла читается металлической */
  g.beginPath();
  g.moveTo(0, 18);
  g.bezierCurveTo(-1.5, 110, -2.3, 250, -2.6, 386);
  g.lineTo(-0.9, 386);
  g.bezierCurveTo(-0.6, 250, -0.3, 110, 0.7, 18);
  g.closePath();
  g.fillStyle = "rgba(255,255,255,0.75)";
  g.fill();

  kStroke(g, body, "#3c454e", 2);
  kStroke(g, eye, "#3c454e", 1.5);

  /* нить на переднем плане: выходит из нижнего края ушка и вьётся вправо */
  g.beginPath();
  g.moveTo(2, 458);
  g.bezierCurveTo(6, 476, 8, 486, 18, 492);
  g.bezierCurveTo(30, 499, 48, 492, 52, 478);
  g.bezierCurveTo(56, 466, 46, 458, 36, 464);
  g.strokeStyle = "#c4122c";
  g.lineWidth = 4.2;
  g.stroke();
  g.strokeStyle = "#ff8a98";
  g.lineWidth = 1.6;
  g.stroke();
}

function paintPie(g) {
  /* Перевернутая вилка: остриё (то, что входит в босса) — сверху, зубцы
     смотрят вниз. Вся вилка железная. На кончики зубцов насажена долька
     яблока — срез с сердцевиной. Зубцы и яблоко ниже линии рукояти,
     поэтому их высота задана через pyKeep: после сжатия кружок остаётся
     кругом, а зубцы не ломаются на границе. */
  const TINE_X = [-24, -8, 8, 24];
  const TW = 4.6;
  const ROOT = pyKeep(332);
  const TIP = pyKeep(472);
  const line = "#2a3038";
  /* отрезок визуальной высоты в растянутых координатах рукояти */
  const vd = (v) => v / 0.66;

  function shaft(ctx) {
    ctx.moveTo(0, 8);
    ctx.lineTo(-3.6, 22);
    ctx.lineTo(-8.6, 52);
    ctx.lineTo(-8.6, pyKeep(308));
    ctx.lineTo(8.6, pyKeep(308));
    ctx.lineTo(8.6, 52);
    ctx.lineTo(3.6, 22);
    ctx.closePath();
  }
  kVolume(g, shaft, "#f7f9fb", "#c5ced6", "#555e66");
  kClip(g, shaft, () => {
    g.fillStyle = "rgba(255,255,255,0.55)";
    g.fillRect(-5.2, 28, 2.4, pyKeep(300) - 28);
  });
  kSheen(g, shaft, -3, "rgba(255,255,255,0.75)");
  kStroke(g, shaft, line, 1.7);
  for (const y of [110, 188, 250]) {
    g.beginPath();
    g.ellipse(0, y, 3.6, 3.6, 0, 0, Math.PI * 2);
    g.fillStyle = kGrad(g, -4, y - 4, 4, y + 4, [[0, "#f4f7fa"], [0.55, "#8e98a1"], [1, "#2e353b"]]);
    g.fill();
    g.strokeStyle = line;
    g.lineWidth = 1;
    g.stroke();
  }

  function head(ctx) {
    const neck = pyKeep(292);
    ctx.moveTo(-8.6, neck);
    ctx.bezierCurveTo(-22, pyKeep(308), -34, pyKeep(320), TINE_X[0] - TW, ROOT);
    for (let i = 0; i < TINE_X.length; i++) {
      const x = TINE_X[i];
      ctx.lineTo(x - TW, TIP - vd(16));
      ctx.quadraticCurveTo(x - TW, TIP, x, TIP);
      ctx.quadraticCurveTo(x + TW, TIP, x + TW, TIP - vd(16));
      ctx.lineTo(x + TW, ROOT);
      if (i < TINE_X.length - 1) {
        const mid = (x + TINE_X[i + 1]) * 0.5;
        ctx.quadraticCurveTo(mid, ROOT - vd(12), TINE_X[i + 1] - TW, ROOT);
      }
    }
    ctx.bezierCurveTo(34, pyKeep(320), 22, pyKeep(308), 8.6, neck);
    ctx.closePath();
  }
  kVolume(g, head, "#ffffff", "#c8d0d8", "#5a626a");
  kStroke(g, head, line, 1.7);

  /* долька: срез яблока, насаженный на зубцы */
  const ay = pyKeep(418);
  const arx = 46;
  const ary = 46 / 0.66;
  g.beginPath();
  g.ellipse(2, ay + 46 / 0.66 * 0.12, arx, ary, 0, 0, Math.PI * 2);
  g.fillStyle = "#6a100c";
  g.fill();
  g.beginPath();
  g.ellipse(0, ay, arx, ary, 0, 0, Math.PI * 2);
  g.fillStyle = kGrad(g, -arx, ay - ary, arx, ay + ary, [
    [0, "#ff6a5c"],
    [0.45, "#e0342c"],
    [1, "#8e140e"]
  ]);
  g.fill();
  g.beginPath();
  g.ellipse(0, ay, arx - 8, ary - 8 / 0.66, 0, 0, Math.PI * 2);
  g.fillStyle = kGrad(g, -20, ay - 30, 24, ay + 40, [
    [0, "#fff6df"],
    [0.55, "#f3d7a4"],
    [1, "#e7b56a"]
  ]);
  g.fill();
  g.beginPath();
  g.ellipse(0, ay, 15, 15 / 0.66, 0, 0, Math.PI * 2);
  g.fillStyle = "#fffaf0";
  g.fill();
  g.strokeStyle = "rgba(180, 140, 70, 0.55)";
  g.lineWidth = 1.2;
  g.stroke();
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + i * (Math.PI * 2 / 5);
    const sx = Math.cos(a) * 13;
    const sy = ay + Math.sin(a) * (13 / 0.66);
    g.beginPath();
    g.ellipse(sx, sy, 2.5, 4.2 / 0.66, a, 0, Math.PI * 2);
    g.fillStyle = "#5c3414";
    g.fill();
  }
  g.beginPath();
  g.ellipse(-14, ay - 14 / 0.66, 12, 7 / 0.66, -0.5, 0, Math.PI * 2);
  g.fillStyle = "rgba(255,255,255,0.35)";
  g.fill();
  g.beginPath();
  g.ellipse(0, ay, arx, ary, 0, 0, Math.PI * 2);
  g.strokeStyle = "#6a100c";
  g.lineWidth = 1.8;
  g.stroke();

  /* кончики зубцов торчат из дольки снизу — яблоко на них насажено */
  function tips(ctx) {
    const y0 = pyKeep(448);
    for (let i = 0; i < TINE_X.length; i++) {
      const x = TINE_X[i];
      ctx.moveTo(x - TW * 0.85, y0);
      ctx.lineTo(x - TW * 0.7, TIP - vd(8));
      ctx.quadraticCurveTo(x - TW * 0.55, TIP, x, TIP);
      ctx.quadraticCurveTo(x + TW * 0.55, TIP, x + TW * 0.7, TIP - vd(8));
      ctx.lineTo(x + TW * 0.85, y0);
      ctx.closePath();
    }
  }
  kVolume(g, tips, "#ffffff", "#c8d0d8", "#5a626a");
  kStroke(g, tips, line, 1.4);
}

function paintCog(g) {
  /* Шпилька: резьбовой стержень, зубчатая гайка на гарде и накатанная головка
     с крестовым шлицем. Зубья гайки — тем же шагом, что у босса (GEAR_TEETH),
     поэтому нож читается как снятая с него деталь. */
  function shank(ctx) {
    ctx.moveTo(0, 10);
    ctx.lineTo(-5.2, 17);
    ctx.lineTo(-9, 36);
    ctx.lineTo(-9, 258);
    ctx.lineTo(9, 258);
    ctx.lineTo(9, 36);
    ctx.lineTo(5.2, 17);
    ctx.closePath();
  }
  kVolume(g, shank, "#f2f6fa", "#c5ccd4", "#5a626a");
  kSheen(g, shank, -2.6, "rgba(255,255,255,0.85)");
  /* витки резьбы: тёмная насечка и светлая кромка над ней */
  kClip(g, shank, () => {
    for (let y = 38; y < 258; y += 10) {
      g.beginPath();
      g.moveTo(-10, y);
      g.lineTo(10, y + 8);
      g.strokeStyle = "rgba(28,34,40,0.45)";
      g.lineWidth = 1.7;
      g.stroke();
      g.beginPath();
      g.moveTo(-10, y - 1.8);
      g.lineTo(10, y + 6.2);
      g.strokeStyle = "rgba(255,255,255,0.45)";
      g.lineWidth = 1;
      g.stroke();
    }
  });
  kStroke(g, shank, "#1b2028", 2);

  /* зубчатая гайка — гарда: зубья тем же шагом, что у босса */
  function nut(ctx) {
    const n = 12, R = 32, r = 26, cy = 276;
    for (let i = 0; i < n * 2; i++) {
      const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2;
      const rad = i % 2 === 0 ? R : r;
      if (i === 0) ctx.moveTo(Math.cos(a) * rad, cy + Math.sin(a) * rad);
      else ctx.lineTo(Math.cos(a) * rad, cy + Math.sin(a) * rad);
    }
    ctx.closePath();
  }
  kFill(g, nut, kGrad(g, -32, 244, 32, 308, [
    [0, "#f4f8fb"], [0.32, "#a9b3bd"], [0.68, "#6d7681"], [1, "#2f3740"]
  ]));
  kStroke(g, nut, "#1b2028", 2);

  /* шестигранник под ключ и резьбовое отверстие в нём */
  function hexNut(ctx) {
    const r = 15, cy = 276;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
      if (i === 0) ctx.moveTo(Math.cos(a) * r, cy + Math.sin(a) * r);
      else ctx.lineTo(Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    ctx.closePath();
  }
  kFill(g, hexNut, kGrad(g, -15, 261, 15, 291, [[0, "#9aa4ae"], [0.5, "#5d666f"], [1, "#3a424a"]]));
  kStroke(g, hexNut, "#1b2028", 1.6);
  kFill(g, (ctx) => ctx.arc(0, 276, 7.6, 0, Math.PI * 2), "#1d232a");
  kStroke(g, (ctx) => ctx.arc(0, 276, 7.6, 0, Math.PI * 2), "#0c1014", 1.2);

  /* накатанная рукоять: ромбовидная насечка */
  function rod(ctx) {
    ctx.roundRect(-18, 300, 36, 156, 7);
  }
  kGrip(g, rod, "#9aa3ad", "#565e68", "#1d2228");
  kClip(g, rod, () => {
    g.strokeStyle = "rgba(255,255,255,0.2)";
    g.lineWidth = 1.2;
    for (let x = -40; x <= 40; x += 7) {
      g.beginPath();
      g.moveTo(x, 300);
      g.lineTo(x + 30, 456);
      g.stroke();
      g.beginPath();
      g.moveTo(x, 300);
      g.lineTo(x - 30, 456);
      g.stroke();
    }
    g.fillStyle = kGrad(g, -18, 0, 18, 0, [
      [0, "rgba(0,0,0,0.42)"], [0.3, "rgba(255,255,255,0.22)"],
      [0.66, "rgba(255,255,255,0.02)"], [1, "rgba(0,0,0,0.5)"]
    ]);
    g.fillRect(-19, 298, 38, 160);
  });
  kStroke(g, rod, "#0e1216", 2);

  /* головка с крестовым шлицем */
  kFill(g, (ctx) => ctx.roundRect(-23, 448, 46, 32, 10), kGrad(g, -23, 448, 23, 480, [
    [0, "#eef2f6"], [0.36, "#98a1ab"], [0.72, "#525a63"], [1, "#232a31"]
  ]));
  kStroke(g, (ctx) => ctx.roundRect(-23, 448, 46, 32, 10), "#0e1216", 2);
  g.fillStyle = "#11161b";
  g.fillRect(-15, 460, 30, 5.4);
  g.fillRect(-3.2, 450, 6.4, 26);
}

function paintTennis(g) {
  /* РАКЕТКА — перевёрнута: головка со струнами внизу, к свободному концу ножа,
     рукоять с мячом вверху — этот конец уходит в бревно. У воткнутого ножа
     наружу смотрит сама ракетка, а не одна обмотка с пяткой.

     Обод не залит блином: это кольцо, а внутри на просвет натянута сетка —
     сквозь неё видно фон, отчего ракетка сразу читается ракеткой. Детали:
     струны в два прохода (тень и свет), люверсы по кромке, резиновый бампер
     на носке, клин с окошком в горловине, витки обмотки, лента-закреп и мяч
     на пятке — тот же мяч, что у босса. */

  const LIME_HI = "#f6ffd2";
  const LIME = "#cbe45c";
  const LIME_MID = "#9dbb2c";
  const LIME_SH = "#5f7412";
  const LINE = "#37480a";

  /* ---- пятка: теннисный мяч ---- */
  function ball(ctx) {
    ctx.arc(0, 30, 21, 0, Math.PI * 2);
  }
  kFill(g, ball, kGrad(g, -15, 9, 15, 51, [[0, "#f4ffb0"], [0.44, "#bcd838"], [1, "#66800c"]]));
  kClip(g, ball, () => {
    const blik = g.createRadialGradient(-7, 20, 2, -5, 24, 26);
    blik.addColorStop(0, "rgba(255,255,255,0.62)");
    blik.addColorStop(0.45, "rgba(255,255,255,0.14)");
    blik.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = blik;
    g.beginPath();
    g.arc(-5, 23, 27, 0, Math.PI * 2);
    g.fill();
    /* шов: те же две встречные дуги, что на мяче босса */
    g.strokeStyle = "rgba(255,255,255,0.92)";
    g.lineWidth = 2.4;
    g.beginPath();
    g.moveTo(-16, 14);
    g.bezierCurveTo(-5, 23, -5, 37, -16, 46);
    g.stroke();
    g.beginPath();
    g.moveTo(16, 14);
    g.bezierCurveTo(5, 23, 5, 37, 16, 46);
    g.stroke();
  });
  kStroke(g, ball, "#2f3d08", 2);

  /* ---- обмотка: тёмная рукоять и косые витки ленты поверх ---- */
  function gripPath(ctx) {
    ctx.moveTo(-15, 48);
    ctx.bezierCurveTo(-18, 94, -17, 150, -15, 196);
    ctx.lineTo(15, 196);
    ctx.bezierCurveTo(17, 150, 18, 94, 15, 48);
    ctx.closePath();
  }
  kGrip(g, gripPath, "#4a5a3e", "#2c3a2c", "#131a13");
  kClip(g, gripPath, () => {
    for (let i = 0; i < 8; i++) {
      const y = 58 + i * 18;
      g.beginPath();
      g.moveTo(-20, y + 6);
      g.quadraticCurveTo(0, y + 1, 20, y - 6);
      g.lineTo(20, y + 2);
      g.quadraticCurveTo(0, y + 9, -20, y + 14);
      g.closePath();
      g.fillStyle = "rgba(200,224,52,0.14)";
      g.fill();
      g.beginPath();
      g.moveTo(-20, y + 6);
      g.quadraticCurveTo(0, y + 1, 20, y - 6);
      g.strokeStyle = "rgba(10,16,8,0.5)";
      g.lineWidth = 1.6;
      g.stroke();
    }
    g.strokeStyle = "rgba(255,255,255,0.05)";
    g.lineWidth = 1;
    for (let x = -12; x <= 12; x += 8) {
      g.beginPath();
      g.moveTo(x, 56);
      g.lineTo(x * 0.92, 196);
      g.stroke();
    }
    g.fillStyle = kGrad(g, -18, 0, 18, 0, [
      [0, "rgba(0,0,0,0.5)"], [0.3, "rgba(255,255,255,0.18)"],
      [0.66, "rgba(255,255,255,0.02)"], [1, "rgba(0,0,0,0.55)"]
    ]);
    g.fillRect(-19, 46, 38, 152);
  });
  kStroke(g, gripPath, "#0e140e", 2);

  /* ---- горловина: шея с обмотки и два пера, входящие под обод ---- */
  function throat(ctx) {
    ctx.moveTo(-12, 176);
    ctx.lineTo(12, 176);
    ctx.bezierCurveTo(14, 214, 26, 244, 33, 270);
    ctx.lineTo(43, 300);
    ctx.lineTo(33, 308);
    ctx.bezierCurveTo(27, 290, 20, 274, 9, 250);
    ctx.lineTo(0, 212);
    ctx.lineTo(-9, 250);
    ctx.bezierCurveTo(-20, 274, -27, 290, -33, 308);
    ctx.lineTo(-43, 300);
    ctx.lineTo(-33, 270);
    ctx.bezierCurveTo(-26, 244, -14, 214, -12, 176);
    ctx.closePath();
  }
  kFill(g, throat, kGrad(g, -43, 0, 43, 0, [
    [0, LIME_SH], [0.22, LIME_HI], [0.46, LIME], [0.74, LIME_MID], [1, LIME_SH]
  ]));
  kStroke(g, throat, LINE, 2.2);

  /* ---- головка: внешний контур, окно сетки и само кольцо обода ---- */
  function headOut(ctx) {
    ctx.moveTo(0, 244);
    ctx.bezierCurveTo(33, 246, 52, 298, 52, 372);
    ctx.bezierCurveTo(52, 442, 37, 486, 0, 492);
    ctx.bezierCurveTo(-37, 486, -52, 442, -52, 372);
    ctx.bezierCurveTo(-52, 298, -33, 246, 0, 244);
    ctx.closePath();
  }
  function bedPath(ctx) {
    /* окно сетки: разворот против часовой (минус полный угол) — и в браузере,
       и в офлайн-рендере это полный круг, а кольцо обода получается вычитанием */
    ctx.moveTo(41, 372);
    ctx.ellipse(0, 372, 41, 96, 0, 0, -Math.PI * 2, true);
    ctx.closePath();
  }
  function ringPath(ctx) {
    headOut(ctx);
    bedPath(ctx);
  }

  /* обод: кольцо одним even-odd, затем тёмная кромка с обеих сторон */
  kFillRule(g, ringPath, kGrad(g, -52, 0, 52, 0, [
    [0, LIME_SH], [0.14, LIME_HI], [0.36, LIME], [0.62, LIME_MID],
    [0.86, LIME_SH], [1, "#3f4f0c"]
  ]), "evenodd");
  kStroke(g, ringPath, LINE, 3);
  /* объём: свет слева, тень справа и блик по левой дуге */
  kClip(g, ringPath, () => {
    g.fillStyle = kGrad(g, -55, 0, 55, 0, [
      [0, "rgba(255,255,255,0.42)"], [0.2, "rgba(255,255,255,0.2)"],
      [0.5, "rgba(255,255,255,0)"], [0.82, "rgba(0,0,0,0.16)"], [1, "rgba(0,0,0,0.34)"]
    ]);
    g.fillRect(-55, 238, 110, 260);
    g.strokeStyle = "rgba(255,255,255,0.5)";
    g.lineWidth = 2.2;
    g.beginPath();
    g.moveTo(-37, 278);
    g.bezierCurveTo(-47, 316, -47, 428, -34, 470);
    g.stroke();
    g.strokeStyle = "rgba(255,255,255,0.26)";
    g.lineWidth = 1.4;
    g.beginPath();
    g.moveTo(-22, 481);
    g.bezierCurveTo(-9, 487, 9, 487, 22, 481);
    g.stroke();
  });

  /* бампер: резина поверх обода на носке — ракетка бьёт этой кромкой */
  kClip(g, ringPath, () => {
    g.beginPath();
    g.ellipse(0, 474, 48, 26, 0, 0, Math.PI * 2);
    g.fillStyle = kGrad(g, 0, 446, 0, 502, [[0, "#4c5c14"], [0.42, "#2c3810"], [1, "#161d06"]]);
    g.fill();
    g.beginPath();
    g.moveTo(-41, 460);
    g.bezierCurveTo(-21, 449, 21, 449, 41, 460);
    g.strokeStyle = "rgba(255,255,255,0.22)";
    g.lineWidth = 1.4;
    g.stroke();
  });

  /* ---- сетка: на просвет дымка, тень у обода, струны в два прохода ---- */
  kClip(g, bedPath, () => {
    g.fillStyle = "rgba(255,255,255,0.16)";
    g.fillRect(-44, 274, 88, 198);
    g.beginPath();
    g.moveTo(41, 372);
    g.ellipse(0, 372, 41, 96, 0, 0, -Math.PI * 2, true);
    g.closePath();
    g.strokeStyle = "rgba(28,40,8,0.16)";
    g.lineWidth = 14;
    g.stroke();
    for (let pass = 0; pass < 2; pass++) {
      g.strokeStyle = pass ? "rgba(255,255,255,0.9)" : "rgba(46,60,12,0.42)";
      g.lineWidth = pass ? 1.3 : 2.6;
      for (let x = -36; x <= 36; x += 12) {
        g.beginPath();
        g.moveTo(x, 276);
        g.lineTo(x, 468);
        g.stroke();
      }
      for (let y = 282; y <= 462; y += 12) {
        g.beginPath();
        g.moveTo(-44, y);
        g.lineTo(44, y);
        g.stroke();
      }
    }
  });

  /* люверсы: каждая струна входит в обод через своё отверстие */
  for (let x = -36; x <= 36; x += 12) {
    const k = Math.sqrt(Math.max(0, 1 - (x / 41) * (x / 41)));
    for (const s of [-1, 1]) {
      g.beginPath();
      g.arc(x, 372 + s * 96 * k, 2, 0, Math.PI * 2);
      g.fillStyle = "#2b3608";
      g.fill();
      g.beginPath();
      g.arc(x - 0.6, 372 + s * 96 * k - 0.6, 0.9, 0, Math.PI * 2);
      g.fillStyle = "rgba(255,255,255,0.6)";
      g.fill();
    }
  }
  for (let y = 282; y <= 462; y += 12) {
    const d = (y - 372) / 96;
    const x = 41 * Math.sqrt(Math.max(0, 1 - d * d));
    for (const s of [-1, 1]) {
      g.beginPath();
      g.arc(s * x, y, 2, 0, Math.PI * 2);
      g.fillStyle = "#2b3608";
      g.fill();
      g.beginPath();
      g.arc(s * x - 0.6, y - 0.6, 0.9, 0, Math.PI * 2);
      g.fillStyle = "rgba(255,255,255,0.6)";
      g.fill();
    }
  }

  /* лента-закреп: обмотка аккуратно переходит в шею горловины */
  kFill(g, (ctx) => ctx.roundRect(-17, 182, 34, 15, 5),
    kGrad(g, -17, 182, 17, 197, [[0, LIME_HI], [0.5, "#c8e034"], [1, "#8aa81c"]]));
  kStroke(g, (ctx) => ctx.roundRect(-17, 182, 34, 15, 5), LINE, 1.6);
}

/* МИГАЛКА (босс ДИСКО ШАР): клинок-зеркалка. Грани собраны шахматкой ромбов,
   кромка отливает бирюзой и маджентой, а на конце рукояти висит маленький
   диско-шар — тот же, что босс, только в кулаке. Рисунок той же длины, что у
   классики (острие 8, гарда 258), поэтому хитбокс и посадка в бревно общие. */
function paintDisco(g) {
  const FACET = ["#8ad6ff", "#c9a4ff", "#ff9ae0", "#8ef0d4"];

  function blade(ctx) {
    ctx.moveTo(0, 8);
    ctx.lineTo(-9, 30);
    ctx.lineTo(-10, 232);
    ctx.quadraticCurveTo(-10, 250, 0, 258);
    ctx.quadraticCurveTo(10, 250, 10, 232);
    ctx.lineTo(9, 30);
    ctx.closePath();
  }
  kVolume(g, blade, "#ffffff", "#dbe4f4", "#8b95ab");
  kClip(g, blade, () => {
    /* шахматка ромбов: у каждой грани свой оттенок и светлая кромка — так
       клинок читается гранёным, а не полосатым */
    for (let row = 0; row < 9; row++) {
      const y = 26 + row * 26;
      for (let col = -1; col <= 1; col++) {
        const x = col * 17 + (row % 2 ? 7 : 0);
        g.beginPath();
        g.moveTo(x, y - 11);
        g.lineTo(x + 8.5, y);
        g.lineTo(x, y + 11);
        g.lineTo(x - 8.5, y);
        g.closePath();
        g.globalAlpha = 0.4 + (row % 3) * 0.1;
        g.fillStyle = FACET[(row + col + 4) % FACET.length];
        g.fill();
        g.globalAlpha = 0.7;
        g.strokeStyle = "rgba(255,255,255,0.75)";
        g.lineWidth = 0.9;
        g.stroke();
        g.globalAlpha = 1;
      }
    }
  });
  kSheen(g, blade, -3, "rgba(255,255,255,0.9)");
  kStroke(g, blade, "#10141c", 2);

  /* гарда: хромированная планка с цветной полосой — от неё свет идёт на грани */
  function bar(ctx) {
    ctx.moveTo(-24, 252);
    ctx.lineTo(24, 252);
    ctx.quadraticCurveTo(28, 252, 28, 258);
    ctx.quadraticCurveTo(28, 264, 24, 264);
    ctx.lineTo(-24, 264);
    ctx.quadraticCurveTo(-28, 264, -28, 258);
    ctx.quadraticCurveTo(-28, 252, -24, 252);
    ctx.closePath();
  }
  kFill(g, bar, kGrad(g, -28, 252, 28, 264, [[0, "#8f9ab0"], [0.24, "#f2f6fc"], [1, "#6e788c"]]));
  kStroke(g, bar, "#10141c", 1.6);
  g.fillStyle = kGrad(g, -24, 256, 24, 260, [[0, "#8ad6ff"], [0.5, "#ffffff"], [1, "#ff9ae0"]]);
  g.fillRect(-24, 256.6, 48, 2.6);

  /* рукоять: тёмный металл и зеркальные плитки */
  function grip(ctx) {
    ctx.moveTo(-12, 264);
    ctx.lineTo(12, 264);
    ctx.lineTo(14, 418);
    ctx.quadraticCurveTo(14, 424, 8, 424);
    ctx.lineTo(-8, 424);
    ctx.quadraticCurveTo(-14, 424, -14, 418);
    ctx.closePath();
  }
  kGrip(g, grip, "#3b4354", "#20252f", "#0d1016");
  kClip(g, grip, () => {
    for (let row = 0; row < 5; row++) {
      const y = 276 + row * 30;
      for (let col = 0; col < 3; col++) {
        const x = -9 + col * 9;
        g.globalAlpha = 0.34;
        g.fillStyle = FACET[(row * 3 + col) % FACET.length];
        g.fillRect(x, y, 8, 9);
        g.globalAlpha = 0.5;
        g.strokeStyle = "rgba(255,255,255,0.6)";
        g.lineWidth = 0.7;
        g.strokeRect(x, y, 8, 9);
        g.globalAlpha = 1;
      }
    }
  });
  kStroke(g, grip, "#0d1016", 1.6);

  /* шарик на конце: зеркальная сфера на шпильке */
  g.fillStyle = kGrad(g, -4, 414, 4, 430, [[0, "#c9d3e2"], [1, "#5a6478"]]);
  g.fillRect(-3.5, 414, 7, 16);
  g.strokeStyle = "#0d1016";
  g.lineWidth = 1.2;
  g.strokeRect(-3.5, 414, 7, 16);

  const by = 452, br = 27;
  const ball = g.createRadialGradient(-br * 0.34, by - br * 0.38, br * 0.06, 0, by, br);
  ball.addColorStop(0, "#f4f8ff");
  ball.addColorStop(0.42, "#b9c6dc");
  ball.addColorStop(0.78, "#5d6a82");
  ball.addColorStop(1, "#1a1f2a");
  g.beginPath();
  g.arc(0, by, br, 0, Math.PI * 2);
  g.fillStyle = ball;
  g.fill();

  /* плитка на шарике: цветные грани в шахматку */
  kClip(g, (ctx) => { ctx.arc(0, by, br - 1, 0, Math.PI * 2); }, () => {
    for (let row = 0; row < 5; row++) {
      const y = by - br + (row / 5) * br * 2;
      const w = br * (0.92 - Math.abs(row - 2) * 0.16);
      for (let col = 0; col < 4; col++) {
        const x = -w + (col / 4) * w * 2;
        g.globalAlpha = 0.38 + 0.2 * ((row + col) % 2);
        g.fillStyle = FACET[(row + col) % FACET.length];
        g.fillRect(x + 0.6, y + 0.6, w / 2 - 1.2, br * 0.34);
        g.globalAlpha = 0.55;
        g.strokeStyle = "rgba(255,255,255,0.7)";
        g.lineWidth = 0.7;
        g.strokeRect(x + 0.6, y + 0.6, w / 2 - 1.2, br * 0.34);
        g.globalAlpha = 1;
      }
    }
  });
  g.strokeStyle = "#0d1016";
  g.lineWidth = 1.8;
  g.beginPath();
  g.arc(0, by, br, 0, Math.PI * 2);
  g.stroke();
  discoSparkBaked(g, -br * 0.32, by - br * 0.36, br * 0.55, "#ffffff", 0.9);
  discoSparkBaked(g, br * 0.44, by + br * 0.34, br * 0.28, "#ffe0f6", 0.6);
}

const BOSS_KNIFE_PAINT = {
  target: paintTarget,
  heart: paintHeart,
  marmalade: paintMarmalade,
  pumpkin: paintPumpkin,
  saw: paintSaw,
  ball: paintBall,
  pizza: paintPizza,
  aegis: paintAegis,
  machete: paintMachete,
  coconut: paintMachete,
  egg: paintEgg,
  dummy: paintDummy,
  fan: paintFan,
  candy: paintCandy,
  lifebelt: paintLifebelt,
  pepsi: paintPepsi,
  tire: paintTire,
  coin: paintCoin,
  balloon: paintBalloon,
  pie: paintPie,
  cog: paintCog,
  tennis: paintTennis,
  disco: paintDisco
};

function paintBossKnife(g, skin) {
  const fn = (skin && skin.shape && BOSS_KNIFE_PAINT[skin.shape]) || (skin && BOSS_KNIFE_PAINT[skin.id]);
  if (!fn) return false;
  g.save();
  fn(g, skin);
  g.restore();
  return true;
}
