// =====================================================================
//  DAD'S STICK FIGHT
//
//  Punch the other stick figure until they're out of energy,
//  or knock them off the edge! First to win 5 rounds wins.
//
//  1 PLAYER:  you are Red, the computer is Blue.
//  2 PLAYERS: Red uses the buttons on the left, Blue on the right.
//
//  On a computer: Red = A D W F,  Blue = ← → ↑ L
//
//  👇 CHANGE THESE to make the game your own! 👇
// =====================================================================

const SETTINGS = {
  title: "DAD'S STICK FIGHT",

  player1: { name: "RED", color: "#ff4d4d" },
  player2: { name: "BLUE", color: "#4da6ff" },

  winsNeeded: 5,      // rounds to win the match
  runSpeed: 8,
  jumpPower: 18,
  gravity: 0.8,
  punchDamage: 12,    // energy lost per punch (everyone starts with 100)
  knockback: 15,      // how far a punch sends you flying
  computerSkill: 0.5, // 0 = sleepy, 1 = really tough

  skyTop: "#1b2a4a",
  skyBottom: "#4a3b6b",
  platformColor: "#e8e0d0",
};

// =====================================================================
//  The game code is below. Ideas for what to add next:
//   - weapons or power-ups that fall from the sky
//   - a kick or a block button
//   - more maps with different platforms
// =====================================================================

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// The game world is always 1600 x 900. It gets scaled to fit the screen.
const WORLD_W = 1600;
const WORLD_H = 900;

const PLATFORMS = [
  { x: 200, y: 760, w: 1200 }, // the ground
  { x: 330, y: 560, w: 300 },
  { x: 970, y: 560, w: 300 },
  { x: 650, y: 370, w: 300 },
];

let width = 0;
let height = 0;
let zoom = 1;
let offsetX = 0;
let offsetY = 0;

function resize() {
  const scale = window.devicePixelRatio || 1;
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width * scale;
  canvas.height = height * scale;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  zoom = Math.min(width / WORLD_W, height / WORLD_H);
  offsetX = (width - WORLD_W * zoom) / 2;
  offsetY = (height - WORLD_H * zoom) / 2;
}

// ---- Game state ----
let mode = "title"; // "title", "fight", "roundOver" or "matchOver"
let players = [];
let onePlayer = true;
let sparks = [];
let message = "";
let messageTimer = 0;

function makePlayer(settings, x, facing) {
  return {
    name: settings.name,
    color: settings.color,
    startX: x,
    startFacing: facing,
    wins: 0,
    controls: { left: false, right: false, jump: false, punch: false },
  };
}

function resetPlayer(p) {
  p.x = p.startX;
  p.y = 760;
  p.vx = 0;
  p.vy = 0;
  p.facing = p.startFacing;
  p.onGround = true;
  p.energy = 100;
  p.punchTimer = 0;
  p.punchCooldown = 0;
  p.hurtTimer = 0;
  p.walkPhase = 0;
  p.out = false;
  p.jumpWasDown = false;
  p.punchWasDown = false;
}

function startMatch(single) {
  onePlayer = single;
  players = [makePlayer(SETTINGS.player1, 500, 1), makePlayer(SETTINGS.player2, 1100, -1)];
  startRound();
}

function startRound() {
  players.forEach(resetPlayer);
  sparks = [];
  message = "FIGHT!";
  messageTimer = 60;
  mode = "fight";
}

// ---- Touch buttons ----
// Each button: where it is on screen, which player it belongs to and what it does.
let buttons = [];

function layoutButtons() {
  const r = Math.min(width, height) * 0.065;
  const gap = r * 2.4;
  const low = height - r * 1.4;
  const high = low - gap;
  const left = r * 1.4;
  const right = width - r * 1.4;

  if (onePlayer) {
    buttons = [
      { player: 0, action: "left", label: "◀", x: left, y: low, r },
      { player: 0, action: "right", label: "▶", x: left + gap, y: low, r },
      { player: 0, action: "jump", label: "⬆", x: right - gap, y: low, r },
      { player: 0, action: "punch", label: "👊", x: right, y: high + gap * 0.4, r },
    ];
  } else {
    buttons = [
      { player: 0, action: "left", label: "◀", x: left, y: low, r },
      { player: 0, action: "right", label: "▶", x: left + gap, y: low, r },
      { player: 0, action: "jump", label: "⬆", x: left, y: high, r },
      { player: 0, action: "punch", label: "👊", x: left + gap, y: high, r },
      { player: 1, action: "left", label: "◀", x: right - gap, y: low, r },
      { player: 1, action: "right", label: "▶", x: right, y: low, r },
      { player: 1, action: "jump", label: "⬆", x: right, y: high, r },
      { player: 1, action: "punch", label: "👊", x: right - gap, y: high, r },
    ];
  }
}

// Every finger touching the screen right now
const fingers = new Map();

function updateButtons() {
  for (const b of buttons) b.down = false;
  for (const f of fingers.values()) {
    for (const b of buttons) {
      if (Math.hypot(f.x - b.x, f.y - b.y) < b.r * 1.3) b.down = true;
    }
  }
}

// The 1 PLAYER / 2 PLAYERS buttons on the title screen
function titleButtons() {
  const bw = Math.min(width * 0.32, 360);
  const bh = bw * 0.3;
  const y = height * 0.62;
  return [
    { single: true, label: "1 PLAYER", x: width / 2 - bw - 20, y, w: bw, h: bh },
    { single: false, label: "2 PLAYERS", x: width / 2 + 20, y, w: bw, h: bh },
  ];
}

canvas.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  fingers.set(event.pointerId, { x: event.clientX, y: event.clientY });

  if (mode === "title") {
    for (const t of titleButtons()) {
      if (event.clientX > t.x && event.clientX < t.x + t.w && event.clientY > t.y && event.clientY < t.y + t.h) {
        startMatch(t.single);
      }
    }
  } else if (mode === "matchOver" && messageTimer <= 0) {
    mode = "title";
  }
});

canvas.addEventListener("pointermove", (event) => {
  event.preventDefault();
  if (fingers.has(event.pointerId)) fingers.set(event.pointerId, { x: event.clientX, y: event.clientY });
});

function fingerUp(event) {
  fingers.delete(event.pointerId);
}
canvas.addEventListener("pointerup", fingerUp);
canvas.addEventListener("pointercancel", fingerUp);
canvas.addEventListener("pointerleave", fingerUp);

// Keyboard (for testing on a computer)
const keys = {};
window.addEventListener("keydown", (event) => {
  keys[event.key.toLowerCase()] = true;
  if (mode === "title" && event.key === "1") startMatch(true);
  if (mode === "title" && event.key === "2") startMatch(false);
  if (mode === "matchOver" && messageTimer <= 0 && event.key === "Enter") mode = "title";
});
window.addEventListener("keyup", (event) => {
  keys[event.key.toLowerCase()] = false;
});

function readControls() {
  updateButtons();
  for (let i = 0; i < players.length; i++) {
    const c = players[i].controls;
    c.left = c.right = c.jump = c.punch = false;
    for (const b of buttons) {
      if (b.player === i && b.down) c[b.action] = true;
    }
  }

  const red = players[0].controls;
  if (keys.a) red.left = true;
  if (keys.d) red.right = true;
  if (keys.w) red.jump = true;
  if (keys.f) red.punch = true;

  if (onePlayer) {
    computerControls(players[1], players[0]);
  } else {
    const blue = players[1].controls;
    if (keys.arrowleft) blue.left = true;
    if (keys.arrowright) blue.right = true;
    if (keys.arrowup) blue.jump = true;
    if (keys.l) blue.punch = true;
  }
}

// ---- The computer player ----
function groundBelow(x, y) {
  return PLATFORMS.some((p) => x > p.x && x < p.x + p.w && p.y >= y - 5);
}

function computerControls(me, enemy) {
  const c = me.controls;
  c.left = c.right = c.jump = c.punch = false;
  const dx = enemy.x - me.x;
  const dy = enemy.y - me.y;
  const skill = SETTINGS.computerSkill;

  // Fell off? Try to get back to the middle.
  if (!groundBelow(me.x, me.y)) {
    if (me.x < WORLD_W / 2) c.right = true;
    else c.left = true;
    c.jump = true;
    return;
  }

  // Walk towards the enemy, but don't walk off an edge
  if (Math.abs(dx) > 70) {
    const dir = dx > 0 ? 1 : -1;
    if (groundBelow(me.x + dir * 60, me.y) || dy < -50) {
      if (dir > 0) c.right = true;
      else c.left = true;
    }
  }

  // Enemy is up on a platform: jump up there
  if (dy < -100 && Math.abs(dx) < 300 && Math.random() < 0.05 + skill * 0.1) c.jump = true;

  // Close enough? Punch!
  if (Math.abs(dx) < 90 && Math.abs(dy) < 80) {
    me.facing = dx > 0 ? 1 : -1;
    if (Math.random() < 0.05 + skill * 0.25) c.punch = true;
  }
}

// ---- Update: move everything a tiny bit, 60 times a second ----
function update() {
  if (messageTimer > 0) messageTimer--;

  for (const s of sparks) {
    s.x += s.vx;
    s.y += s.vy;
    s.vy += 0.3;
    s.life--;
  }
  sparks = sparks.filter((s) => s.life > 0);

  if (mode === "roundOver" && messageTimer <= 0) {
    if (players.some((p) => p.wins >= SETTINGS.winsNeeded)) {
      const winner = players.find((p) => p.wins >= SETTINGS.winsNeeded);
      message = `${winner.name} WINS!`;
      messageTimer = 60;
      mode = "matchOver";
    } else {
      startRound();
    }
  }

  if (mode !== "fight" && mode !== "roundOver") return;

  readControls();
  for (const p of players) movePlayer(p);
  if (mode === "fight") checkPunches();

  // Anyone knocked out or fallen off?
  if (mode === "fight") {
    const loser = players.find((p) => p.out);
    if (loser) {
      const winner = players.find((p) => p !== loser);
      winner.wins++;
      message = `${winner.name} WINS THE ROUND`;
      messageTimer = 120;
      mode = "roundOver";
    }
  }
}

function movePlayer(p) {
  const c = p.controls;
  const canMove = p.hurtTimer <= 0 && !p.out && mode === "fight";

  // Running
  let target = 0;
  if (canMove && c.left) target -= SETTINGS.runSpeed;
  if (canMove && c.right) target += SETTINGS.runSpeed;
  if (target !== 0 && p.punchTimer <= 0) p.facing = Math.sign(target);
  if (p.hurtTimer <= 0) p.vx += (target - p.vx) * (p.onGround ? 0.3 : 0.1);
  else p.vx *= 0.95;

  // Jumping (only when you press, not when you hold)
  if (canMove && c.jump && !p.jumpWasDown && p.onGround) {
    p.vy = -SETTINGS.jumpPower;
    p.onGround = false;
  }
  p.jumpWasDown = c.jump;

  // Punching
  if (p.punchCooldown > 0) p.punchCooldown--;
  if (p.punchTimer > 0) p.punchTimer--;
  if (p.hurtTimer > 0) p.hurtTimer--;
  if (canMove && c.punch && !p.punchWasDown && p.punchCooldown <= 0) {
    p.punchTimer = 12;
    p.punchCooldown = 22;
    p.hasHit = false;
  }
  p.punchWasDown = c.punch;

  // Gravity and moving
  const oldY = p.y;
  p.vy += SETTINGS.gravity;
  p.x += p.vx;
  p.y += p.vy;

  // Landing on platforms (you can jump up through them from below)
  p.onGround = false;
  if (p.vy >= 0 && !p.out) {
    for (const plat of PLATFORMS) {
      if (p.x > plat.x && p.x < plat.x + plat.w && oldY <= plat.y && p.y >= plat.y) {
        p.y = plat.y;
        p.vy = 0;
        p.onGround = true;
      }
    }
  }

  if (p.onGround && Math.abs(p.vx) > 1) p.walkPhase += Math.abs(p.vx) * 0.04;

  // Fell off the bottom of the world
  if (p.y > WORLD_H + 200) {
    p.y = WORLD_H + 200;
    p.vy = 0;
    p.out = true;
  }
}

function checkPunches() {
  for (const p of players) {
    if (p.punchTimer !== 8 || p.hasHit) continue; // the moment the fist is out
    for (const other of players) {
      if (other === p) continue;
      const dx = other.x - p.x;
      const dy = other.y - p.y;
      const inFront = Math.sign(dx) === p.facing || Math.abs(dx) < 15;
      if (inFront && Math.abs(dx) < 95 && Math.abs(dy) < 100) {
        p.hasHit = true;
        other.energy -= SETTINGS.punchDamage;
        other.vx = p.facing * SETTINGS.knockback * (1 + (100 - other.energy) / 100);
        other.vy = -8;
        other.hurtTimer = 15;
        burst(other.x - p.facing * 10, other.y - 85, "#ffd23c");
        if (other.energy <= 0) {
          other.energy = 0;
          other.out = true;
          other.vy = -14;
          other.vx = p.facing * 20;
        }
      }
    }
  }
}

function burst(x, y, color) {
  for (let i = 0; i < 14; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 6;
    sparks.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 2, life: 25, color });
  }
}

// ---- Draw: paint the picture on the screen ----
function drawText(text, x, y, textSize, color = "white") {
  ctx.font = `bold ${textSize}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = textSize * 0.15;
  ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
  ctx.strokeText(text, x, y);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function drawStickFigure(p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(p.facing, 1);
  if (p.out && p.energy <= 0) ctx.rotate(-1.2); // knocked out!

  const color = p.hurtTimer > 0 && p.hurtTimer % 4 < 2 ? "white" : p.color;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 9;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const swing = p.onGround ? Math.sin(p.walkPhase) * 22 : 12;

  // Legs
  ctx.beginPath();
  ctx.moveTo(-swing, 0);
  ctx.lineTo(0, -48);
  ctx.lineTo(swing, 0);
  ctx.stroke();

  // Body
  ctx.beginPath();
  ctx.moveTo(0, -48);
  ctx.lineTo(0, -96);
  ctx.stroke();

  // Arms: the front one punches
  const punching = p.punchTimer > 4;
  ctx.beginPath();
  ctx.moveTo(-22, -52 + swing * 0.3);
  ctx.lineTo(0, -86);
  if (punching) ctx.lineTo(62, -86);
  else ctx.lineTo(24, -60 - swing * 0.3);
  ctx.stroke();
  if (punching) {
    ctx.beginPath();
    ctx.arc(64, -86, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  // Head
  ctx.beginPath();
  ctx.arc(0, -116, 18, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawEnergyBars() {
  const barW = 480;
  const barH = 26;
  const y = 40;
  players.forEach((p, i) => {
    const x = i === 0 ? 120 : WORLD_W - 120 - barW;
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.fillRect(x, y, barW, barH);
    ctx.fillStyle = p.color;
    const fill = (barW * p.energy) / 100;
    ctx.fillRect(i === 0 ? x : x + barW - fill, y, fill, barH);
    const nameX = i === 0 ? x + 60 : x + barW - 60;
    drawText(`${p.name}  ${"★".repeat(p.wins)}`, nameX + (i === 0 ? 40 : -40), y + 60, 30, p.color);
  });
}

function drawButtons() {
  for (const b of buttons) {
    ctx.globalAlpha = b.down ? 0.6 : 0.3;
    ctx.fillStyle = players[b.player].color;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.font = `${b.r * 0.9}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "white";
    ctx.fillText(b.label, b.x, b.y);
  }
}

function draw() {
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, SETTINGS.skyTop);
  sky.addColorStop(1, SETTINGS.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  if (mode === "title") {
    drawText(SETTINGS.title, width / 2, height * 0.3, Math.min(width / 12, 90), "#ffd23c");
    drawText("Punch them off the edge!", width / 2, height * 0.45, Math.min(width / 30, 36));
    for (const t of titleButtons()) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      ctx.beginPath();
      ctx.roundRect(t.x, t.y, t.w, t.h, 20);
      ctx.fill();
      drawText(t.label, t.x + t.w / 2, t.y + t.h / 2, t.h * 0.4);
    }
    return;
  }

  // Everything in the game world, scaled to fit the screen
  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(zoom, zoom);

  ctx.fillStyle = SETTINGS.platformColor;
  for (const plat of PLATFORMS) {
    ctx.beginPath();
    ctx.roundRect(plat.x, plat.y, plat.w, plat.y > 700 ? 40 : 22, 8);
    ctx.fill();
  }

  for (const p of players) drawStickFigure(p);

  for (const s of sparks) {
    ctx.globalAlpha = s.life / 25;
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  drawEnergyBars();

  if (messageTimer > 0 || mode === "matchOver") {
    drawText(message, WORLD_W / 2, WORLD_H * 0.4, 90, "#ffd23c");
  }
  if (mode === "matchOver" && messageTimer <= 0) {
    drawText("Tap to play again", WORLD_W / 2, WORLD_H * 0.52, 40);
  }

  ctx.restore();

  layoutButtons();
  drawButtons();
}

// ---- The game loop: update, draw, repeat forever ----
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener("resize", resize);
resize();
layoutButtons();
loop();
