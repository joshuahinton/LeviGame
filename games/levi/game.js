// =====================================================================
//  LEVI'S GAME
//
//  This is a starter template. Drag your finger to move around
//  and collect the coins. Then turn it into YOUR game!
//
//  👇 CHANGE THESE first 👇
// =====================================================================

const SETTINGS = {
  title: "LEVI'S GAME",

  player: "😎",     // you! try any emoji
  coin: "🪙",       // the thing you collect

  background: "#1f6f4a",
};

// =====================================================================
//  The game code. Ideas for what to add next:
//   - baddies that chase you
//   - a timer: how many coins in 30 seconds?
//   - levels that get harder
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
}

// ---- Game state ----
let mode = "title"; // "title" or "playing"
let player = { x: 0, y: 0, targetX: 0, targetY: 0 };
let coin = { x: 0, y: 0 };
let score = 0;

function startGame() {
  player = { x: width / 2, y: height / 2, targetX: width / 2, targetY: height / 2 };
  score = 0;
  moveCoin();
  mode = "playing";
}

function moveCoin() {
  coin.x = size + Math.random() * (width - size * 2);
  coin.y = size * 2 + Math.random() * (height - size * 3);
}

// ---- Controls: touch / mouse / keyboard ----
canvas.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  if (mode !== "playing") startGame();
  player.targetX = event.clientX;
  player.targetY = event.clientY;
});

canvas.addEventListener("pointermove", (event) => {
  event.preventDefault();
  if (event.buttons === 0 && event.pointerType === "mouse") return;
  player.targetX = event.clientX;
  player.targetY = event.clientY;
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

  // Keyboard (for testing on a computer)
  const step = size * 0.2;
  if (keys.ArrowLeft) player.targetX -= step;
  if (keys.ArrowRight) player.targetX += step;
  if (keys.ArrowUp) player.targetY -= step;
  if (keys.ArrowDown) player.targetY += step;

  // Glide the player towards your finger
  player.targetX = Math.max(size / 2, Math.min(width - size / 2, player.targetX));
  player.targetY = Math.max(size / 2, Math.min(height - size / 2, player.targetY));
  player.x += (player.targetX - player.x) * 0.2;
  player.y += (player.targetY - player.y) * 0.2;

  // Got the coin?
  if (Math.hypot(coin.x - player.x, coin.y - player.y) < size * 0.8) {
    score++;
    moveCoin();
  }
}

// ---- Draw: paint the picture on the screen ----
function drawEmoji(emoji, x, y, emojiSize) {
  ctx.font = `${emojiSize}px system-ui, "Apple Color Emoji", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "white";
  ctx.fillText(emoji, x, y);
}

function drawText(text, x, y, textSize, color = "white") {
  ctx.font = `bold ${textSize}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function draw() {
  ctx.fillStyle = SETTINGS.background;
  ctx.fillRect(0, 0, width, height);

  if (mode === "title") {
    drawText(SETTINGS.title, width / 2, height * 0.35, size * 0.9, "#ffd23c");
    drawEmoji(SETTINGS.player, width / 2, height * 0.52, size * 1.5);
    drawText("Tap to play!", width / 2, height * 0.7, size * 0.5);
    return;
  }

  drawEmoji(SETTINGS.coin, coin.x, coin.y, size);
  drawEmoji(SETTINGS.player, player.x, player.y, size * 1.2);
  drawText(`${score}`, width / 2, size * 0.7, size * 0.6, "#ffd23c");
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
