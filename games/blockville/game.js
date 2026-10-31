// =====================================================================
//  BLOCKVILLE
//
//  Run and jump around the lobby, then go through a portal:
//   🐾 Pet Town:     hatch eggs, look after your pets, watch them grow
//   👗 Fashion Show: dress up for a theme and walk the runway
//
//  Your clothes are in avatar.js, pets in pets.js,
//  and the fashion show in fashion.js.
//
//  👇 CHANGE THESE to make the game your own! 👇
// =====================================================================

const SETTINGS = {
  title: "Blockville",
  playerName: "You",
  walkSpeed: 6.5,
  jumpPower: 17,
  gravity: 0.8,
  doubleJump: true,   // jump again in the air!
  startCoins: 30,
};

// =====================================================================
//  The code is in parts:
//    1. Saving
//    2. Screen, controls and the player
//    3. Scenes (places you can be) and portals
//    4. The lobby
//    5. Drawing the world
//    6. Pop-ups, panels and messages
//    7. The game loop
// =====================================================================

const $ = (id) => document.getElementById(id);

// ---------------------------------------------------------------------
//  1. SAVING
// ---------------------------------------------------------------------

// Bring across a save from when this game had a different name
function findOldSave(ending) {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.toLowerCase().endsWith(ending)) return localStorage.getItem(key);
  }
  return null;
}

function loadSave() {
  const fresh = {
    coins: SETTINGS.startCoins,
    outfit: { ...STARTING_OUTFIT },
    owned: {},      // clothes you've bought, like "head:crown": true
    pets: [],       // your pets
    equipped: -1,   // which pet follows you (-1 = none)
    freeEgg: true,  // your first egg is free!
    shows: 0,       // fashion shows you've done
  };
  try {
    const saved = JSON.parse(localStorage.getItem("blockvilleSave") || findOldSave("bloxsave"));
    if (saved) return { ...fresh, ...saved, outfit: { ...fresh.outfit, ...saved.outfit } };
  } catch {}
  return fresh;
}

const save = loadSave();

function saveGame() {
  try {
    localStorage.setItem("blockvilleSave", JSON.stringify(save));
  } catch {}
}

function addCoins(amount, x, y) {
  save.coins += amount;
  saveGame();
  updateHud();
  if (x !== undefined) floatText(`+${amount} 🪙`, x, y, "#ffd23c");
}

function spendCoins(amount) {
  if (save.coins < amount) return false;
  save.coins -= amount;
  saveGame();
  updateHud();
  return true;
}

// ---------------------------------------------------------------------
//  2. SCREEN, CONTROLS AND THE PLAYER
//  The world is always 720 tall. It's scaled to fit the tablet.
// ---------------------------------------------------------------------

const canvas = $("game");
const ctx = canvas.getContext("2d");
const VIEW_H = 720;
const GROUND = 600;
const PLAYER_HEIGHT = 150;

let width = 0;
let height = 0;
let zoom = 1;
let viewW = 0;

function resize() {
  const scale = window.devicePixelRatio || 1;
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width * scale;
  canvas.height = height * scale;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  zoom = height / VIEW_H;
  viewW = width / zoom;
}

const player = { x: 300, y: GROUND, vx: 0, vy: 0, onGround: true, jumpsLeft: 1, facing: 1, walk: 0 };

// Buttons being held down (touch buttons or keyboard)
const held = { left: false, right: false, jump: false, action: false };
const touchHeld = { left: false, right: false, jump: false, action: false };
const keys = {};
const tapped = {}; // remembers quick taps until the game sees them
let jumpWasDown = false;
let actionWasDown = false;

function holdButton(id, name) {
  const button = $(id);
  const down = (event) => {
    event.preventDefault();
    touchHeld[name] = true;
    tapped[name] = true;
    button.classList.add("down");
  };
  const up = (event) => {
    event.preventDefault();
    touchHeld[name] = false;
    button.classList.remove("down");
  };
  button.addEventListener("pointerdown", down);
  button.addEventListener("pointerup", up);
  button.addEventListener("pointercancel", up);
  button.addEventListener("pointerleave", up);
}

const KEY_NAMES = { arrowup: "jump", w: "jump", " ": "jump", e: "action", enter: "action" };

window.addEventListener("keydown", (event) => {
  keys[event.key.toLowerCase()] = true;
  const name = KEY_NAMES[event.key.toLowerCase()];
  if (name) tapped[name] = true;
  if (event.key === " ") event.preventDefault();
});
window.addEventListener("keyup", (event) => {
  keys[event.key.toLowerCase()] = false;
});

function readControls() {
  held.left = touchHeld.left || keys.arrowleft || keys.a;
  held.right = touchHeld.right || keys.arrowright || keys.d;
  held.jump = touchHeld.jump || keys.arrowup || keys.w || keys[" "];
  held.action = touchHeld.action || keys.e || keys.enter;
  // A tap that was too quick to see still counts as a press
  if (tapped.jump && jumpWasDown && !held.jump) jumpWasDown = false;
  if (tapped.action && actionWasDown && !held.action) actionWasDown = false;
  if (tapped.jump) held.jump = true;
  if (tapped.action) held.action = true;
  tapped.jump = false;
  tapped.action = false;
}

// ---------------------------------------------------------------------
//  3. SCENES AND PORTALS
//  A scene is a place: the lobby, Pet Town, the runway...
// ---------------------------------------------------------------------

const scenes = {};
let scene = null;
let nearby = null; // the thing you're standing next to (a portal, a shop...)

function goTo(name, x = 200) {
  scene = scenes[name];
  player.x = x;
  player.y = GROUND;
  player.vx = 0;
  player.vy = 0;
  if (petFollower) {
    petFollower.x = x - 80;
    petFollower.y = GROUND;
  }
  sparkles = [];
  if (scene.onEnter) scene.onEnter();
  updateHud();
}

function makePortal(x, label, emoji, colors, onEnter) {
  return {
    x,
    label: `Enter ${emoji}`,
    onAction: onEnter,
    draw(ctx) {
      const t = frame * 0.05;
      // the swirly middle
      const swirl = ctx.createRadialGradient(x, GROUND - 120, 10, x, GROUND - 120, 110);
      swirl.addColorStop(0, "white");
      swirl.addColorStop(0.3 + 0.1 * Math.sin(t), colors[0]);
      swirl.addColorStop(1, colors[1]);
      ctx.fillStyle = swirl;
      ctx.beginPath();
      ctx.roundRect(x - 75, GROUND - 230, 150, 230, [75, 75, 0, 0]);
      ctx.fill();
      // the frame round the edge
      ctx.strokeStyle = "#5b3b8c";
      ctx.lineWidth = 16;
      ctx.beginPath();
      ctx.roundRect(x - 83, GROUND - 238, 166, 238, [83, 83, 0, 0]);
      ctx.stroke();
      // sparkles floating up
      for (let i = 0; i < 5; i++) {
        const sy = GROUND - ((frame * 1.5 + i * 47) % 220);
        const sx = x + Math.sin(i * 2.3 + frame * 0.03) * 50;
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(sx, sy, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      // the sign on top
      drawSign(ctx, x, GROUND - 290, `${emoji} ${label}`);
    },
  };
}

function drawSign(ctx, x, y, text) {
  ctx.font = "bold 30px system-ui, sans-serif";
  const w = ctx.measureText(text).width + 40;
  ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - 24 + 5, w, 52, 16);
  ctx.fill();
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - 24, w, 52, 16);
  ctx.fill();
  ctx.fillStyle = "#4a2f6b";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y + 2);
}

// ---------------------------------------------------------------------
//  4. THE LOBBY
// ---------------------------------------------------------------------

const lobbyCoins = [];
for (const [x, y] of [
  [450, 540], [520, 540], [590, 540], [1000, 380], [1060, 380], [1200, 260], [1260, 260],
  [1850, 400], [1910, 400], [2100, 300], [2160, 300], [2350, 180], [2700, 540], [2770, 540], [2840, 540],
]) {
  lobbyCoins.push({ x, y, gone: 0 });
}

scenes.lobby = {
  name: "Lobby",
  width: 3200,
  sky: ["#7cc6ff", "#d9f1ff"],
  hills: "#8fd694",
  grass: "#5cc461",
  dirt: "#9a6b47",
  platforms: [
    { x: 940, y: 440, w: 180, color: "#ff7eb6" },
    { x: 1150, y: 320, w: 160, color: "#ffd23c" },
    { x: 1800, y: 460, w: 170, color: "#3d8bff" },
    { x: 2050, y: 360, w: 170, color: "#2ebd6b" },
    { x: 2290, y: 240, w: 140, color: "#9b51e0" },
  ],
  decor: [
    ["🌳", 120, 170], ["🌷", 380, 50], ["🌳", 860, 150], ["🌼", 1380, 50], ["🏡", 1680, 170],
    ["🌳", 2600, 160], ["🌷", 2950, 50], ["🎠", 3080, 150],
  ],
  interactables: [
    makePortal(700, "Pet Town", "🐾", ["#ffb3d9", "#ff6fae"], () => goTo("petTown", 220)),
    {
      x: 1450,
      label: "👗 Change clothes",
      onAction: () => openDressingRoom(null),
      draw(ctx) {
        // a wardrobe
        box(ctx, 1450 - 70, GROUND - 200, 140, 200, "#b07a4f", 12);
        box(ctx, 1450 - 60, GROUND - 190, 58, 180, "#c98f60", 8);
        box(ctx, 1450 + 2, GROUND - 190, 58, 180, "#c98f60", 8);
        emojiAt(ctx, "👗", 1450 - 31, GROUND - 110, 40);
        emojiAt(ctx, "👑", 1450 + 31, GROUND - 110, 40);
        drawSign(ctx, 1450, GROUND - 240, "Wardrobe");
      },
    },
    makePortal(2000 + 600, "Fashion Show", "👗", ["#e0c3ff", "#9b51e0"], () => startFashionShow()),
    makePortal(2000 + 1000 - 50, "Coming soon", "🔒", ["#d0d0d0", "#8a8a8a"], () =>
      showPopup("🔒 Coming soon!", "<p>What game should go here next? Dream it up and we'll build it!</p>", [["OK", "pink"]])
    ),
  ],
  update() {
    // Collect coins by touching them. They come back after a while.
    for (const c of lobbyCoins) {
      if (c.gone > 0) {
        c.gone--;
        continue;
      }
      if (Math.abs(c.x - player.x) < 40 && c.y > player.y - PLAYER_HEIGHT - 20 && c.y < player.y + 10) {
        c.gone = 60 * 30;
        addCoins(1, c.x, c.y);
        burst(c.x, c.y, "#ffd23c", 8);
      }
    }
  },
  drawFront(ctx) {
    for (const c of lobbyCoins) {
      if (c.gone > 0) continue;
      const bob = Math.sin(frame * 0.08 + c.x) * 6;
      emojiAt(ctx, "🪙", c.x, c.y + bob, 40);
    }
    drawSign(ctx, 330, GROUND - 330, `Welcome to ${SETTINGS.title}!`);
  },
};

// ---------------------------------------------------------------------
//  Moving the player (used in the lobby and Pet Town)
// ---------------------------------------------------------------------

function movePlayer() {
  const busy = panelOpen();
  let dir = 0;
  if (!busy && held.left) dir -= 1;
  if (!busy && held.right) dir += 1;
  if (dir) player.facing = dir;
  player.vx += (dir * SETTINGS.walkSpeed - player.vx) * 0.25;

  const jumpPressed = !busy && held.jump && !jumpWasDown;
  jumpWasDown = held.jump;
  if (jumpPressed) {
    if (player.onGround) {
      player.vy = -SETTINGS.jumpPower;
      player.onGround = false;
    } else if (SETTINGS.doubleJump && player.jumpsLeft > 0) {
      player.vy = -SETTINGS.jumpPower * 0.85;
      player.jumpsLeft--;
      burst(player.x, player.y, "white", 10);
    }
  }

  const oldY = player.y;
  player.vy += SETTINGS.gravity;
  player.x += player.vx;
  player.y += player.vy;
  player.x = Math.max(40, Math.min(scene.width - 40, player.x));

  // Land on the ground or on a platform (you can jump up through platforms)
  player.onGround = false;
  if (player.y >= GROUND) {
    player.y = GROUND;
    player.vy = 0;
    player.onGround = true;
  }
  if (player.vy >= 0) {
    for (const p of scene.platforms || []) {
      if (player.x > p.x - 10 && player.x < p.x + p.w + 10 && oldY <= p.y && player.y >= p.y) {
        player.y = p.y;
        player.vy = 0;
        player.onGround = true;
      }
    }
  }
  if (player.onGround) player.jumpsLeft = 1;
  if (player.onGround && Math.abs(player.vx) > 0.5) player.walk += Math.abs(player.vx) * 0.045;
  else player.walk *= 0.8;

  // What are we standing next to?
  nearby = null;
  let best = 90;
  for (const thing of scene.interactables || []) {
    const distance = Math.abs(thing.x - player.x);
    if (distance < best && player.y > GROUND - 60 && (!thing.canAct || thing.canAct())) {
      best = distance;
      nearby = thing;
    }
  }
  const actionPressed = !busy && held.action && !actionWasDown;
  actionWasDown = held.action;
  if (nearby && actionPressed) nearby.onAction();
}

// ---------------------------------------------------------------------
//  5. DRAWING THE WORLD
// ---------------------------------------------------------------------

let sparkles = [];
let floaters = [];

function burst(x, y, color, count = 14) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = 2 + Math.random() * 5;
    sparkles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 2, life: 35, color });
  }
}

function floatText(text, x, y, color = "white") {
  floaters.push({ text, x, y, life: 70, color });
}

function cameraX() {
  return Math.max(0, Math.min(scene.width - viewW, player.x - viewW / 2));
}

function drawWorld() {
  const camX = cameraX();

  // Sky
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, scene.sky[0]);
  sky.addColorStop(1, scene.sky[1]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.scale(zoom, zoom);

  // Clouds and hills far away move slower (it looks 3D!)
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  for (let i = 0; i < 8; i++) {
    const cx = ((i * 420 - camX * 0.2 + frame * 0.2) % (viewW + 400)) - 200;
    const cy = 90 + (i % 3) * 60;
    for (const [dx, dy, r] of [[0, 0, 40], [40, -15, 45], [85, 0, 38]]) {
      ctx.beginPath();
      ctx.arc(cx + dx, cy + dy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.fillStyle = scene.hills;
  ctx.beginPath();
  ctx.moveTo(0, GROUND);
  for (let x = 0; x <= viewW + 20; x += 20) {
    ctx.lineTo(x, GROUND - 110 - Math.sin((x + camX * 0.4) * 0.006) * 60);
  }
  ctx.lineTo(viewW + 20, GROUND);
  ctx.fill();

  ctx.translate(-camX, 0);

  // Background things: trees, houses...
  for (const [emoji, x, size] of scene.decor || []) emojiAt(ctx, emoji, x, GROUND - size * 0.45, size);
  if (scene.drawBack) scene.drawBack(ctx);

  // Ground, with Roblox-style bumps (studs) on top
  ctx.fillStyle = scene.dirt;
  ctx.fillRect(camX - 10, GROUND, viewW + 20, VIEW_H - GROUND + 10);
  ctx.fillStyle = scene.grass;
  ctx.fillRect(camX - 10, GROUND, viewW + 20, 26);
  ctx.fillStyle = shadeColor(scene.grass, 0.2);
  for (let x = Math.floor(camX / 40) * 40; x < camX + viewW + 40; x += 40) {
    ctx.beginPath();
    ctx.ellipse(x + 20, GROUND + 2, 10, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Platforms
  for (const p of scene.platforms || []) {
    box(ctx, p.x, p.y + 6, p.w, 34, shadeColor(p.color, -0.3), 6);
    box(ctx, p.x, p.y, p.w, 34, p.color, 6);
    ctx.fillStyle = shadeColor(p.color, 0.3);
    for (let x = p.x + 20; x < p.x + p.w; x += 40) {
      ctx.beginPath();
      ctx.ellipse(x, p.y + 1, 10, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  for (const thing of scene.interactables || []) if (thing.draw) thing.draw(ctx);

  // You and your pet
  drawPet(ctx);
  drawAvatar(ctx, player.x, player.y, PLAYER_HEIGHT, save.outfit, player.walk, player.facing);
  nameTag(ctx, SETTINGS.playerName, player.x, player.y - PLAYER_HEIGHT - 30);

  if (scene.drawFront) scene.drawFront(ctx);

  for (const s of sparkles) {
    ctx.globalAlpha = s.life / 35;
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const f of floaters) {
    ctx.globalAlpha = Math.min(1, f.life / 25);
    outlinedText(ctx, f.text, f.x, f.y, 30, f.color);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function outlinedText(ctx, text, x, y, size, color = "white") {
  ctx.font = `bold ${size}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = size * 0.2;
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(60, 30, 80, 0.6)";
  ctx.strokeText(text, x, y);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function nameTag(ctx, text, x, y) {
  outlinedText(ctx, text, x, y, 24);
}

// ---------------------------------------------------------------------
//  6. POP-UPS, PANELS AND MESSAGES
// ---------------------------------------------------------------------

function panelOpen() {
  return document.querySelector(".popup-back") !== null;
}

// buttons: a list of [label, colour, what happens when you tap it]
function showPopup(title, html, buttons, wide = false) {
  const back = document.createElement("div");
  back.className = "popup-back";
  back.innerHTML = `<div class="popup ${wide ? "wide" : ""}"><h2>${title}</h2><div class="popup-body">${html}</div><div class="buttons"></div></div>`;
  for (const [label, color, onTap] of buttons) {
    const b = document.createElement("button");
    b.className = color;
    b.textContent = label;
    b.addEventListener("click", () => {
      back.remove();
      updateHud();
      if (onTap) onTap();
    });
    back.querySelector(".buttons").appendChild(b);
  }
  document.body.appendChild(back);
  updateHud();
  return back;
}

function closePopups() {
  for (const p of document.querySelectorAll(".popup-back")) p.remove();
  updateHud();
}

function toast(text) {
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = text;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1800);
}

function updateHud() {
  $("coins").textContent = `🪙 ${save.coins}`;
  const showControls = scene && scene.controls !== false && !panelOpen();
  $("controls").classList.toggle("hidden", !showControls);
  $("hud").classList.toggle("hidden", !scene || scene.controls === false);
  const action = $("action");
  if (showControls && nearby) {
    action.textContent = nearby.label;
    action.classList.remove("hidden");
  } else {
    action.classList.add("hidden");
  }
}

// ---------------------------------------------------------------------
//  7. THE GAME LOOP
//  The game moves in steps of 1/60th of a second, so it runs at the
//  same speed on every tablet.
// ---------------------------------------------------------------------

let frame = 0;

function update() {
  frame++;
  readControls();
  if (scene.custom) {
    scene.update();
  } else {
    movePlayer();
    if (scene.update) scene.update();
    updatePet();
  }
  for (const s of sparkles) {
    s.x += s.vx;
    s.y += s.vy;
    s.vy += 0.2;
    s.life--;
  }
  sparkles = sparkles.filter((s) => s.life > 0);
  for (const f of floaters) {
    f.y -= 1.2;
    f.life--;
  }
  floaters = floaters.filter((f) => f.life > 0);
}

function draw() {
  if (scene.custom) scene.draw(ctx);
  else drawWorld();
}

let lastTime = performance.now();
let waiting = 0;
let lastNearby = null;

function loop(now) {
  waiting += Math.min(now - lastTime, 100);
  lastTime = now;
  while (waiting >= 1000 / 60) {
    update();
    waiting -= 1000 / 60;
  }
  if (nearby !== lastNearby) {
    lastNearby = nearby;
    updateHud();
  }
  draw();
  requestAnimationFrame(loop);
}

function startGame() {
  holdButton("left", "left");
  holdButton("right", "right");
  holdButton("jump", "jump");
  holdButton("action", "action");
  $("petsButton").addEventListener("click", showPetsPanel);
  window.addEventListener("resize", resize);
  resize();
  goTo("lobby", 330);
  requestAnimationFrame(loop);
}
