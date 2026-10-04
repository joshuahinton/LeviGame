// =====================================================================
//  STAR CATCHER  -  Dad's example game
//
//  Slide your finger to move. Catch the stars, dodge the rocks!
//
//  👇 CHANGE THESE to make the game your own! 👇
//  (Save, push, then refresh the game on the iPad to see your changes.)
// =====================================================================

const SETTINGS = {
  title: "STAR CATCHER",

  player: "🐱",       // try "🚀", "🐸", "🦖", "🤖" or any emoji you like
  goodThing: "⭐",    // what you catch
  badThing: "🪨",     // what you dodge

  lives: 3,
  startSpeed: 3,      // how fast things fall at the start
  speedUp: 0.5,       // how much faster it gets every 10 points
  badChance: 0.3,     // 0 = no rocks, 1 = all rocks
  spawnEvery: 50,     // a new thing drops every this many frames (smaller = more things)

  skyTop: "#2a1660",
  skyBottom: "#5b2a86",
};

// =====================================================================
//  The game code is below. Have a look - you can change anything!
// =====================================================================

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let width = 0;
let height = 0;
let size = 0; // how big things are drawn, based on the screen size

function resize() {
  const scale = window.devicePixelRatio || 1;
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width * scale;
  canvas.height = height * scale;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  size = Math.min(width, height) / 9;
  if (player) player.y = height - size * 1.2;
}

// ---- Game state ----
let mode = "title"; // "title", "playing" or "gameover"
let player = null;
let things = [];
let sparkles = [];
let score = 0;
let lives = 0;
let speed = 0;
let frame = 0;
let best = loadBest();

function loadBest() {
  try {
    return Number(localStorage.getItem("starCatcherBest")) || 0;
  } catch {
    return 0;
  }
}

function saveBest() {
  try {
    localStorage.setItem("starCatcherBest", best);
  } catch {}
}

function startGame() {
  player = { x: width / 2, y: height - size * 1.2, targetX: width / 2 };
  things = [];
  sparkles = [];
  score = 0;
  lives = SETTINGS.lives;
  speed = SETTINGS.startSpeed;
  frame = 0;
  mode = "playing";
}

// ---- Controls: touch / mouse / keyboard ----
function pointerX(event) {
  return event.clientX;
}

canvas.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  if (mode !== "playing") {
    startGame();
  }
  player.targetX = pointerX(event);
});

canvas.addEventListener("pointermove", (event) => {
  event.preventDefault();
  if (mode === "playing") player.targetX = pointerX(event);
});

const keys = {};
window.addEventListener("keydown", (event) => {
  keys[event.key] = true;
  if ((event.key === " " || event.key === "Enter") && mode !== "playing") startGame();
});
window.addEventListener("keyup", (event) => {
  keys[event.key] = false;
});

// ---- Update: move everything a tiny bit, 60 times a second ----
function update() {
  if (mode !== "playing") return;
  frame++;

  // Keyboard (for testing on a computer)
  if (keys.ArrowLeft) player.targetX -= size * 0.3;
  if (keys.ArrowRight) player.targetX += size * 0.3;

  // Glide the player towards your finger
  player.targetX = Math.max(size / 2, Math.min(width - size / 2, player.targetX));
  player.x += (player.targetX - player.x) * 0.3;

  // Drop new things from the sky
  if (frame % SETTINGS.spawnEvery === 0) {
    things.push({
      x: size / 2 + Math.random() * (width - size),
      y: -size,
      bad: Math.random() < SETTINGS.badChance,
      spin: Math.random() * Math.PI * 2,
    });
  }

  for (const thing of things) {
    thing.y += speed * (size / 60);
    thing.spin += 0.05;

    // Did the player touch it?
    const dx = thing.x - player.x;
    const dy = thing.y - player.y;
    if (Math.hypot(dx, dy) < size * 0.8) {
      thing.gone = true;
      if (thing.bad) {
        lives--;
        burst(thing.x, thing.y, "#ff5a5a");
        if (lives <= 0) gameOver();
      } else {
        score++;
        burst(thing.x, thing.y, "#ffd23c");
        if (score % 10 === 0) speed += SETTINGS.speedUp;
      }
    }

    if (thing.y > height + size) thing.gone = true;
  }
  things = things.filter((thing) => !thing.gone);

  for (const s of sparkles) {
    s.x += s.vx;
    s.y += s.vy;
    s.life--;
  }
  sparkles = sparkles.filter((s) => s.life > 0);
}

function burst(x, y, color) {
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    sparkles.push({
      x,
      y,
      vx: Math.cos(angle) * size * 0.08,
      vy: Math.sin(angle) * size * 0.08,
      life: 20,
      color,
    });
  }
}

function gameOver() {
  mode = "gameover";
  if (score > best) {
    best = score;
    saveBest();
  }
}

// ---- Draw: paint the picture on the screen ----
function drawEmoji(emoji, x, y, emojiSize, angle = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = "white";
  ctx.font = `${emojiSize}px system-ui, "Apple Color Emoji", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(emoji, 0, 0);
  ctx.restore();
}

function drawText(text, x, y, textSize, color = "white") {
  ctx.font = `bold ${textSize}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function draw() {
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, SETTINGS.skyTop);
  sky.addColorStop(1, SETTINGS.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  if (mode === "title") {
    drawText(SETTINGS.title, width / 2, height * 0.35, size * 0.9, "#ffd23c");
    drawEmoji(SETTINGS.player, width / 2, height * 0.52, size * 1.5);
    drawText("Tap to play!", width / 2, height * 0.7, size * 0.5);
    if (best > 0) drawText(`Best: ${best}`, width / 2, height * 0.8, size * 0.4, "#c9b6ff");
    return;
  }

  for (const thing of things) {
    drawEmoji(thing.bad ? SETTINGS.badThing : SETTINGS.goodThing, thing.x, thing.y, size, thing.bad ? 0 : thing.spin);
  }

  for (const s of sparkles) {
    ctx.globalAlpha = s.life / 20;
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(s.x, s.y, size * 0.08, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  drawEmoji(SETTINGS.player, player.x, player.y, size * 1.2);

  // Score and lives along the top
  const top = size * 0.7;
  drawText(`${score}`, width / 2, top, size * 0.6, "#ffd23c");
  ctx.font = `${size * 0.45}px system-ui, sans-serif`;
  ctx.textAlign = "left";
  ctx.fillText("❤️".repeat(Math.max(lives, 0)), size * 0.4, top);

  if (mode === "gameover") {
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, width, height);
    drawText("GAME OVER", width / 2, height * 0.38, size * 0.9, "#ff5a5a");
    drawText(`You got ${score}`, width / 2, height * 0.52, size * 0.55);
    drawText(`Best: ${best}`, width / 2, height * 0.61, size * 0.4, "#c9b6ff");
    drawText("Tap to play again", width / 2, height * 0.75, size * 0.45);
  }
}

// ---- The game loop: update, draw, repeat forever ----
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener("resize", resize);
resize();
loop();
