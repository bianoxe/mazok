function isOffscreen(c) {
  return typeof OffscreenCanvas === "function" && c instanceof OffscreenCanvas;
}

function prepSurface(c, opaque) {
  const g = c.getContext("2d", opaque ? { alpha: false } : { alpha: true });
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalAlpha = 1;
  g.globalCompositeOperation = "source-over";
  g.clearRect(0, 0, c.width, c.height);
  return g;
}

function takePooledCanvas(w, h, offscreen) {
  for (let i = canvasPool.length - 1; i >= 0; i--) {
    const p = canvasPool[i];
    if (p.width !== w || p.height !== h || isOffscreen(p) !== offscreen) continue;
    const last = canvasPool.length - 1;
    if (i !== last) canvasPool[i] = canvasPool[last];
    canvasPool.pop();
    return p;
  }
  return null;
}

function makeCanvas(w, h, opaque) {
  let c = takePooledCanvas(w, h, false);
  if (!c) {
    c = document.createElement("canvas");
    c.width = w;
    c.height = h;
  }
  return [c, prepSurface(c, opaque)];
}

function makeOffscreen(w, h) {
  if (phone || typeof OffscreenCanvas !== "function") return makeCanvas(w, h);
  let c = takePooledCanvas(w, h, true);
  if (!c) c = new OffscreenCanvas(w, h);
  return [c, prepSurface(c, false)];
}

function releaseCanvas(c) {
  if (!c) return;
  if (canvasPool.length < 48) canvasPool.push(c);
}

function recycleFly(k) {
  if (k && flyPool.length < 8) flyPool.push(k);
}

function clearFlying() {
  for (let i = 0; i < game.flying.length; i++) recycleFly(game.flying[i]);
  game.flying.length = 0;
}

function takeFly() {
  return flyPool.pop() || { x: 0, y: 0, fromY: 0, t: 0, dmg: 1, born: 0 };
}

function recycleStuck(k) {
  if (k && stuckPool.length < 48) stuckPool.push(k);
}

function clearStuck() {
  for (let i = 0; i < game.stuck.length; i++) recycleStuck(game.stuck[i]);
  game.stuck.length = 0;
}

function takeStuck() {
  const k = stuckPool.pop();
  if (!k) return { rel: 0, player: false, rad: 1, sink: 0, sinkV: 0, flash: 0, kick: 0 };
  k.player = false;
  /* скин с прошлого ножа не тащим: у чужих ножей он пустой, у своих его
     ставит stickKnife (js/flow.js) — иначе из пула вернулся бы чужой скин */
  k.skin = "";
  k.rad = 1;
  k.sink = 0;
  k.sinkV = 0;
  k.flash = 0;
  k.kick = 0;
  k.scale = 1;
  return k;
}

function releaseShards() {
  for (let i = game.shards.length - 1; i >= 0; i--) {
    const old = game.shards[i];
    if (old.sprite) releaseCanvas(old.sprite);
    old.sprite = null;
    old.atlas = null;
    old.wedgePath = null;
    old.wedgeClip = null;
    old.split0 = null;
    old.split1 = null;
    givePool(shardPool, old);
  }
  game.shards.length = 0;
}

function takePool(pool) {
  return pool.length ? pool.pop() : {};
}

function givePool(pool, obj) {
  if (pool.length < 280) pool.push(obj);
}

function prewarmPools() {
  for (let i = particlePool.length; i < 180; i++) particlePool.push({});
  for (let i = trailPool.length; i < 28; i++) trailPool.push({});
  for (let i = applePool.length; i < 20; i++) applePool.push({});
  for (let i = appleHalfPool.length; i < 12; i++) appleHalfPool.push({});
  for (let i = shardPool.length; i < 36; i++) shardPool.push({});
}

function dropSwap(arr, i) {
  const last = arr.length - 1;
  const dead = arr[i];
  arr[i] = arr[last];
  arr.pop();
  return dead;
}

