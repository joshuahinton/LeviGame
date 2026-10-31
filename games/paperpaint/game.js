// =====================================================================
//  PAPERPAINT.IO
//
//  Slide your finger to steer. Leave your land to draw a line,
//  then come back home to paint everything inside it!
//
//  ⚠️ If anyone touches your line while you're out, you're out!
//  ✂️ Touch someone else's line to knock THEM out.
//
//  Paint enough of each continent to win it and unlock the next one.
//  The levels are in maps.js.
//
//  👇 CHANGE THESE to make the game your own! 👇
// =====================================================================

const SETTINGS = {
  title: "PaperPaint.io",
  playerName: "YOU",
  playerColor: "#ff3d7f",

  speed: 7,            // squares per second
  crossOwnLine: true,  // true = you can run over your own line safely. false = it knocks you out (like the real game)
  zoom: 22,            // how many squares fit across the screen (bigger = see more)

  botNames: ["Zippy", "Mango", "Pixel", "Noodle", "Rex", "Blip", "Taco", "Ziggy", "Momo", "Pogo"],
  botColors: ["#3d8bff", "#ffb02e", "#2ecc71", "#a259ff", "#ff6b3d", "#00c2c7", "#e84393", "#8bc34a", "#795548", "#607d8b"],

  sea: "#2f9fd8",
  paper: "#f6f1e7",
};

// =====================================================================
//  The game code is below. It's longer than the other games, so it's
//  split into parts:
//    1. Screen and saving
//    2. Building the map for a level
//    3. Players moving and painting
//    4. The computer players (bots)
//    5. Touch controls
//    6. Drawing everything
//    7. The world map screen
//    8. The game loop
// =====================================================================

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// ---------------------------------------------------------------------
//  1. SCREEN AND SAVING
// ---------------------------------------------------------------------

let width = 0;
let height = 0;

function resize() {
  const scale = window.devicePixelRatio || 1;
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width * scale;
  canvas.height = height * scale;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
}

// Which continents are unlocked, and the most of each one you've ever painted
let progress = loadProgress();

function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem("paperPaintProgress"));
    if (saved && Array.isArray(saved.best)) return saved;
  } catch {}
  return { unlocked: 1, best: LEVELS.map(() => 0) };
}

function saveProgress() {
  try {
    localStorage.setItem("paperPaintProgress", JSON.stringify(progress));
  } catch {}
}

// "worldMap", "ready", "playing", "won" or "lost"
let screen = "worldMap";

// ---------------------------------------------------------------------
//  2. BUILDING THE MAP FOR A LEVEL
//  The map is a grid of squares. Each square remembers:
//    land:  is it land (1) or sea (0)?
//    owner: which player has painted it (0 = nobody)
//    trail: whose line is on it (0 = nobody)
// ---------------------------------------------------------------------

const CELL_PIXELS = 8; // size of one square in the hidden picture of the map

let level = null;
let levelNumber = 0;
let gridW = 0;
let gridH = 0;
let land, owner, trail;
let landCount = 0;
let seaCells = [];
let counts = []; // how many squares each player owns
let mapPicture = null; // a hidden canvas with the whole map painted on it
let mapPen = null;

function pointInShape(x, y, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function buildMap() {
  // Squash the longitude so shapes far from the equator don't look stretched
  const outline = SHAPES[level.shape];
  const middleLat = outline.reduce((sum, p) => sum + p[1], 0) / outline.length;
  const squash = Math.cos((middleLat * Math.PI) / 180);
  const points = outline.map(([lon, lat]) => [lon * squash, -lat]);

  // Work out how many squares per degree, so the land has about `level.size` squares
  let area = 0;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    area += (points[j][0] + points[i][0]) * (points[j][1] - points[i][1]);
  }
  area = Math.abs(area / 2);
  const perDegree = Math.sqrt(level.size / area);

  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const border = 4;
  gridW = Math.ceil((Math.max(...xs) - minX) * perDegree) + border * 2;
  gridH = Math.ceil((Math.max(...ys) - minY) * perDegree) + border * 2;

  land = new Uint8Array(gridW * gridH);
  owner = new Uint8Array(gridW * gridH);
  trail = new Uint8Array(gridW * gridH);

  for (let y = 0; y < gridH; y++) {
    for (let x = 0; x < gridW; x++) {
      const px = (x + 0.5 - border) / perDegree + minX;
      const py = (y + 0.5 - border) / perDegree + minY;
      if (pointInShape(px, py, points)) land[y * gridW + x] = 1;
    }
  }
  keepBiggestIsland();

  landCount = 0;
  seaCells = [];
  for (let i = 0; i < land.length; i++) {
    if (land[i]) landCount++;
    else seaCells.push(i);
  }

  // Paint the hidden picture of the map
  mapPicture = document.createElement("canvas");
  mapPicture.width = gridW * CELL_PIXELS;
  mapPicture.height = gridH * CELL_PIXELS;
  mapPen = mapPicture.getContext("2d");
  mapPen.fillStyle = SETTINGS.sea;
  mapPen.fillRect(0, 0, mapPicture.width, mapPicture.height);
  for (let i = 0; i < land.length; i++) if (land[i]) paintSquare(i);
}

// Bits of land that you can't walk to are turned into sea
function keepBiggestIsland() {
  const island = new Int32Array(land.length).fill(-1);
  let biggest = -1;
  let biggestSize = 0;
  let islandNumber = 0;
  const queue = new Int32Array(land.length);
  for (let start = 0; start < land.length; start++) {
    if (!land[start] || island[start] !== -1) continue;
    let head = 0;
    let tail = 0;
    queue[tail++] = start;
    island[start] = islandNumber;
    while (head < tail) {
      const i = queue[head++];
      for (const n of neighbours(i)) {
        if (land[n] && island[n] === -1) {
          island[n] = islandNumber;
          queue[tail++] = n;
        }
      }
    }
    if (tail > biggestSize) {
      biggestSize = tail;
      biggest = islandNumber;
    }
    islandNumber++;
  }
  for (let i = 0; i < land.length; i++) if (island[i] !== biggest) land[i] = 0;
}

function neighbours(i) {
  const x = i % gridW;
  const result = [];
  if (x > 0) result.push(i - 1);
  if (x < gridW - 1) result.push(i + 1);
  if (i >= gridW) result.push(i - gridW);
  if (i < gridW * (gridH - 1)) result.push(i + gridW);
  return result;
}

function squareAt(x, y) {
  const cx = Math.floor(x);
  const cy = Math.floor(y);
  if (cx < 0 || cy < 0 || cx >= gridW || cy >= gridH) return -1;
  return cy * gridW + cx;
}

function isLand(x, y) {
  const i = squareAt(x, y);
  return i >= 0 && land[i] === 1;
}

// Draw one square onto the hidden map picture
function paintSquare(i) {
  if (i < 0 || !land[i]) return;
  const x = (i % gridW) * CELL_PIXELS;
  const y = Math.floor(i / gridW) * CELL_PIXELS;
  const who = owner[i];
  if (who) {
    mapPen.fillStyle = players[who - 1].color;
    mapPen.fillRect(x, y, CELL_PIXELS, CELL_PIXELS);
    // A darker edge at the bottom makes painted land look raised up
    const below = i + gridW;
    if (below >= owner.length || owner[below] !== who) {
      mapPen.fillStyle = players[who - 1].dark;
      mapPen.fillRect(x, y + CELL_PIXELS - 3, CELL_PIXELS, 3);
    }
  } else {
    const checker = ((i % gridW) + Math.floor(i / gridW)) % 2;
    mapPen.fillStyle = checker ? SETTINGS.paper : "#efe8db";
    mapPen.fillRect(x, y, CELL_PIXELS, CELL_PIXELS);
  }
}

function setOwner(i, who) {
  const old = owner[i];
  if (old === who) return;
  if (old) counts[old]--;
  owner[i] = who;
  if (who) counts[who]++;
  paintSquare(i);
  paintSquare(i - gridW); // the square above's shadow might change
}

// ---------------------------------------------------------------------
//  3. PLAYERS MOVING AND PAINTING
// ---------------------------------------------------------------------

let players = [];
let me = null;
let sparks = [];
let popups = [];
let bestThisGame = 0;
let endTimer = 0;
let endReason = "";

function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c) => Math.round(amount < 0 ? c * (1 + amount) : c + (255 - c) * amount);
  const r = mix(n >> 16);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return `rgb(${r}, ${g}, ${b})`;
}

function makePlayer(id, name, color, isBot) {
  return {
    id,
    name,
    color,
    dark: shade(color, -0.35),
    light: shade(color, 0.35),
    isBot,
    alive: false,
    x: 0,
    y: 0,
    angle: 0,
    targetAngle: 0,
    square: -1,
    trail: [],
    trailPoints: [],
    lastHome: { x: 0, y: 0 },
    respawnTimer: 0,
  };
}

function startLevel(number) {
  levelNumber = number;
  level = LEVELS[number];
  players = [];
  me = makePlayer(1, SETTINGS.playerName, SETTINGS.playerColor, false);
  players.push(me);
  const names = [...SETTINGS.botNames].sort(() => Math.random() - 0.5);
  for (let b = 0; b < level.bots; b++) {
    const color = SETTINGS.botColors[b % SETTINGS.botColors.length];
    players.push(makePlayer(b + 2, names[b % names.length], color, true));
  }
  counts = new Array(players.length + 1).fill(0);
  buildMap();

  // You start in the middle-ish, the bots start around you
  spawn(me, true);
  for (const p of players) if (p.isBot) spawn(p, false);

  sparks = [];
  popups = [];
  bestThisGame = 0;
  screen = "ready";
}

// Find an empty spot of land with room for a new player
function findSpot(nearMiddle) {
  for (let tries = 0; tries < 600; tries++) {
    let x, y;
    if (nearMiddle && tries < 300) {
      x = gridW / 2 + (Math.random() - 0.5) * gridW * 0.3;
      y = gridH / 2 + (Math.random() - 0.5) * gridH * 0.3;
    } else {
      x = Math.random() * gridW;
      y = Math.random() * gridH;
    }
    x = Math.floor(x) + 0.5;
    y = Math.floor(y) + 0.5;
    const roomy = tries < 400 ? 4 : 3;
    let ok = true;
    for (let dy = -roomy; dy <= roomy && ok; dy++) {
      for (let dx = -roomy; dx <= roomy && ok; dx++) {
        const i = squareAt(x + dx, y + dy);
        if (i < 0 || !land[i] || owner[i] || trail[i]) ok = false;
      }
    }
    for (const p of players) {
      if (p.alive && Math.hypot(p.x - x, p.y - y) < 10) ok = false;
    }
    if (ok) return { x, y };
  }
  return null;
}

function spawn(p, nearMiddle) {
  const spot = findSpot(nearMiddle);
  if (!spot) {
    p.respawnTimer = 60; // no room right now, try again in a second
    return;
  }
  p.alive = true;
  p.x = spot.x;
  p.y = spot.y;
  p.angle = Math.random() * Math.PI * 2;
  p.targetAngle = p.angle;
  p.trail = [];
  p.trailPoints = [];
  p.lastHome = { x: p.x, y: p.y };
  p.home = { x: p.x, y: p.y };
  p.mode = "home";
  p.goalAngle = p.angle;
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      if (dx * dx + dy * dy > 5) continue;
      const i = squareAt(p.x + dx, p.y + dy);
      if (i >= 0 && land[i]) setOwner(i, p.id);
    }
  }
  p.square = squareAt(p.x, p.y);
}

function movePlayer(p) {
  // Turn smoothly towards where we want to go
  let turn = p.targetAngle - p.angle;
  while (turn > Math.PI) turn -= Math.PI * 2;
  while (turn < -Math.PI) turn += Math.PI * 2;
  const maxTurn = 0.22;
  p.angle += Math.max(-maxTurn, Math.min(maxTurn, turn));

  // Bots are a bit slower on the easy levels
  const speed = p.isBot ? SETTINGS.speed * (0.75 + 0.25 * level.skill) : SETTINGS.speed;
  const step = speed / 60;
  let nx = p.x + Math.cos(p.angle) * step;
  let ny = p.y + Math.sin(p.angle) * step;

  // Can't go into the sea: slide along the coast instead
  if (!isLand(nx, ny)) {
    if (isLand(nx, p.y)) ny = p.y;
    else if (isLand(p.x, ny)) nx = p.x;
    else return;
  }
  p.x = nx;
  p.y = ny;

  const now = squareAt(p.x, p.y);
  if (now === p.square) return;

  // Moving corner-to-corner? Also visit a side square, so lines never have gaps
  const old = p.square;
  p.square = now;
  if (old >= 0 && old % gridW !== now % gridW && Math.floor(old / gridW) !== Math.floor(now / gridW)) {
    const side = Math.floor(old / gridW) * gridW + (now % gridW);
    if (land[side]) {
      visit(p, side);
      if (!p.alive) return;
    }
  }
  visit(p, now);
}

// What happens when a player steps onto a square
const SAFE_TAIL = 4;

function visit(p, i) {
  const lineOwner = trail[i];
  if (lineOwner === p.id) {
    // The last few squares of your line are safe, so sharp turns don't knock you out
    if (p.trail.lastIndexOf(i) >= p.trail.length - SAFE_TAIL) return;
    // You can cross your own line without being knocked out (see SETTINGS)
    if (!p.isBot && SETTINGS.crossOwnLine) return;
    knockOut(p, null, "You ran into your own line!");
    return;
  }
  if (lineOwner) {
    knockOut(players[lineOwner - 1], p, `${p.name} cut your line!`);
  }

  if (owner[i] === p.id) {
    if (p.trail.length > 0) paintInside(p);
    p.lastHome = { x: p.x, y: p.y };
  } else {
    if (p.trail.length === 0) p.trailPoints.push(p.lastHome);
    trail[i] = p.id;
    p.trail.push(i);
    p.trailPoints.push({ x: p.x, y: p.y });
    if (p.isBot) p.legSteps++;
  }
}

// You came home! Paint your line, and everything your line goes around.
let floodSeen = null;
let floodQueue = null;

function paintInside(p) {
  for (const i of p.trail) {
    trail[i] = 0;
    setOwner(i, p.id);
  }
  p.trail = [];
  p.trailPoints = [];

  // Pour "water" in from the sea. Anywhere the water can't reach
  // without crossing your land is inside your loop, so it's yours!
  if (!floodSeen || floodSeen.length !== land.length) {
    floodSeen = new Uint8Array(land.length);
    floodQueue = new Int32Array(land.length);
  }
  const seen = floodSeen;
  seen.fill(0);
  let head = 0;
  let tail = 0;
  for (const i of seaCells) {
    seen[i] = 1;
    floodQueue[tail++] = i;
  }
  while (head < tail) {
    const i = floodQueue[head++];
    const x = i % gridW;
    if (x > 0) tail = pour(i - 1, p.id, seen, tail);
    if (x < gridW - 1) tail = pour(i + 1, p.id, seen, tail);
    if (i >= gridW) tail = pour(i - gridW, p.id, seen, tail);
    if (i < land.length - gridW) tail = pour(i + gridW, p.id, seen, tail);
  }
  for (let i = 0; i < land.length; i++) {
    if (land[i] && !seen[i] && owner[i] !== p.id) setOwner(i, p.id);
  }

  // Anyone who just lost ALL their land is out
  for (const other of players) {
    if (other.alive && other !== p && counts[other.id] === 0) {
      knockOut(other, p, `${p.name} painted over all your land!`);
    }
  }

  if (p === me) {
    const painted = counts[me.id] / landCount;
    bestThisGame = Math.max(bestThisGame, painted);
    if (painted >= level.target) winLevel();
  }
}

function pour(n, id, seen, tail) {
  if (!seen[n] && owner[n] !== id) {
    seen[n] = 1;
    floodQueue[tail++] = n;
  }
  return tail;
}

function knockOut(p, byWho, reason) {
  if (!p.alive) return;
  p.alive = false;
  for (const i of p.trail) trail[i] = 0;
  p.trail = [];
  p.trailPoints = [];
  for (let i = 0; i < owner.length; i++) if (owner[i] === p.id) setOwner(i, 0);
  burst(p.x, p.y, p.color);

  if (p === me) {
    if (screen === "playing") {
      screen = "lost";
      endReason = reason;
      endTimer = 60;
      saveBest();
    }
  } else {
    p.respawnTimer = 240; // a new bot joins after 4 seconds
    if (byWho === me) popups.push({ text: `✂️ You got ${p.name}!`, life: 120 });
  }
}

function burst(x, y, color) {
  for (let i = 0; i < 24; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.05 + Math.random() * 0.15;
    sparks.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 40, color });
  }
}

function winLevel() {
  if (screen !== "playing") return;
  screen = "won";
  endTimer = 60;
  saveBest();
  if (levelNumber + 1 >= progress.unlocked && levelNumber + 1 < LEVELS.length) {
    progress.unlocked = levelNumber + 2;
  }
  saveProgress();
  burst(me.x, me.y, "#ffd23c");
}

function saveBest() {
  progress.best[levelNumber] = Math.max(progress.best[levelNumber] || 0, bestThisGame);
  saveProgress();
}

// ---------------------------------------------------------------------
//  4. THE COMPUTER PLAYERS (BOTS)
//  A bot goes out in a box shape: straight, turn, straight, turn,
//  then heads home. Cleverer bots make bigger boxes, run home when
//  someone gets close, and chase other players' lines.
// ---------------------------------------------------------------------

function thinkBot(b) {
  const skill = level.skill;
  const enemies = players.filter((p) => p.alive && p !== b);

  if (b.trail.length === 0) {
    // At home: pick a direction to go out
    if (b.mode !== "home") {
      b.mode = "home";
      b.goalAngle = Math.atan2(b.y - b.home.y, b.x - b.home.x) + (Math.random() - 0.5) * 2;
    }
  } else if (b.mode === "home") {
    // Just left home: plan a box
    b.mode = "out";
    b.leg = 0;
    b.legSteps = 0;
    b.turnDirection = Math.random() < 0.5 ? 1 : -1;
    b.baseAngle = b.angle;
    b.legLength = 4 + Math.random() * (4 + skill * 10);
  }

  if (b.trail.length > 0) {
    // Someone close by? Run home!
    const scared = 3 + b.trail.length * 0.2 * skill;
    if (enemies.some((e) => Math.hypot(e.x - b.x, e.y - b.y) < scared)) b.mode = "return";
    if (b.trail.length > 15 + skill * 25) b.mode = "return";

    // Can we cut someone's line?
    if (b.mode === "out" && skill > 0.2 && frame % 10 === 0) {
      for (const e of enemies) {
        for (let t = 0; t < e.trail.length; t += 3) {
          const i = e.trail[t];
          const tx = (i % gridW) + 0.5;
          const ty = Math.floor(i / gridW) + 0.5;
          if (Math.hypot(tx - b.x, ty - b.y) < 4 + skill * 10) {
            b.mode = "hunt";
            b.huntTarget = { x: tx, y: ty, who: e };
          }
        }
      }
    }

    if (b.mode === "out") {
      if (b.legSteps >= b.legLength) {
        b.leg++;
        b.legSteps = 0;
        if (b.leg >= 3) b.mode = "return";
      }
      b.goalAngle = b.baseAngle + (b.turnDirection * b.leg * Math.PI) / 2;
    }

    if (b.mode === "hunt") {
      const t = b.huntTarget;
      if (!t.who.alive || t.who.trail.length === 0 || b.trail.length > 30) b.mode = "return";
      else b.goalAngle = Math.atan2(t.y - b.y, t.x - b.x);
    }

    if (b.mode === "return" && frame % 8 === 0) {
      const home = nearestOwnSquare(b);
      b.goalAngle = Math.atan2(home.y - b.y, home.x - b.x);
    }
  }

  avoidDanger(b);
}

// Look ahead: if there's sea or our own line in front, steer around it.
// (goalAngle is where the bot WANTS to go, targetAngle is where it steers.)
function avoidDanger(b) {
  b.targetAngle = b.goalAngle;
  const sloppy = Math.random() < 0.15 * (1 - level.skill);
  if (sloppy) return; // easier bots sometimes don't look where they're going!
  const tries = [0, 0.5, -0.5, 1, -1, 1.6, -1.6, 2.2, -2.2, Math.PI];
  for (const extra of tries) {
    const angle = b.goalAngle + extra;
    if (isSafe(b, angle)) {
      b.targetAngle = angle;
      return;
    }
  }
}

// Checks a strip as wide as the bot, a few squares ahead
function isSafe(b, angle) {
  const ahead = { x: Math.cos(angle), y: Math.sin(angle) };
  const across = { x: -ahead.y, y: ahead.x };
  for (let distance = 0.5; distance <= 3; distance += 0.5) {
    for (const side of [0, -0.45, 0.45]) {
      const x = b.x + ahead.x * distance + across.x * side;
      const y = b.y + ahead.y * distance + across.y * side;
      const i = squareAt(x, y);
      if (side === 0 && (i < 0 || !land[i])) return false;
      if (i >= 0 && trail[i] === b.id && b.trail.lastIndexOf(i) < b.trail.length - SAFE_TAIL) return false;
    }
  }
  return true;
}

function nearestOwnSquare(b) {
  const cx = Math.floor(b.x);
  const cy = Math.floor(b.y);
  for (let r = 1; r < 40; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
        const i = squareAt(cx + dx, cy + dy);
        if (i >= 0 && owner[i] === b.id) return { x: cx + dx + 0.5, y: cy + dy + 0.5 };
      }
    }
  }
  return b.lastHome;
}

// ---------------------------------------------------------------------
//  5. TOUCH CONTROLS
//  Put your finger down anywhere and slide the way you want to go.
// ---------------------------------------------------------------------

let stick = null; // where your finger started, and where it is now
let screenButtons = []; // buttons on the screen right now

canvas.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  const x = event.clientX;
  const y = event.clientY;

  for (const b of screenButtons) {
    if (x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h) {
      b.onTap();
      return;
    }
  }

  if (screen === "worldMap") {
    tapWorldMap(x, y);
    return;
  }
  if (screen === "ready") screen = "playing";
  if (screen === "playing") stick = { id: event.pointerId, startX: x, startY: y, x, y };
});

canvas.addEventListener("pointermove", (event) => {
  event.preventDefault();
  if (!stick || stick.id !== event.pointerId) return;
  stick.x = event.clientX;
  stick.y = event.clientY;
  const dx = stick.x - stick.startX;
  const dy = stick.y - stick.startY;
  const distance = Math.hypot(dx, dy);
  if (distance > 10) me.targetAngle = Math.atan2(dy, dx);
  // The start point follows your finger, so changing direction is quick
  const reach = 50;
  if (distance > reach) {
    stick.startX = stick.x - (dx / distance) * reach;
    stick.startY = stick.y - (dy / distance) * reach;
  }
});

function fingerUp(event) {
  if (stick && stick.id === event.pointerId) stick = null;
}
canvas.addEventListener("pointerup", fingerUp);
canvas.addEventListener("pointercancel", fingerUp);

// Keyboard (for testing on a computer): arrow keys or WASD
const keys = {};
window.addEventListener("keydown", (event) => {
  keys[event.key.toLowerCase()] = true;
  if (screen === "ready") screen = "playing";
});
window.addEventListener("keyup", (event) => {
  keys[event.key.toLowerCase()] = false;
});

function readKeyboard() {
  let dx = 0;
  let dy = 0;
  if (keys.arrowleft || keys.a) dx--;
  if (keys.arrowright || keys.d) dx++;
  if (keys.arrowup || keys.w) dy--;
  if (keys.arrowdown || keys.s) dy++;
  if (dx || dy) me.targetAngle = Math.atan2(dy, dx);
}

// ---------------------------------------------------------------------
//  6. DRAWING EVERYTHING
// ---------------------------------------------------------------------

function drawText(text, x, y, size, color = "white", align = "center") {
  ctx.font = `bold ${size}px system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.lineWidth = size * 0.18;
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
  ctx.strokeText(text, x, y);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function addButton(label, x, y, w, h, color, onTap) {
  ctx.fillStyle = shade(color, -0.3);
  ctx.beginPath();
  ctx.roundRect(x, y + 6, w, h, 18);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 18);
  ctx.fill();
  drawText(label, x + w / 2, y + h / 2, h * 0.38);
  screenButtons.push({ x, y, w, h, onTap });
}

function drawGame() {
  const cell = Math.min(width, height) / SETTINGS.zoom;
  const camX = me.x * cell - width / 2;
  const camY = me.y * cell - height / 2;

  ctx.fillStyle = SETTINGS.sea;
  ctx.fillRect(0, 0, width, height);

  // The map: only the part that's on screen
  const x0 = Math.max(0, Math.floor(camX / cell));
  const y0 = Math.max(0, Math.floor(camY / cell));
  const x1 = Math.min(gridW, Math.ceil((camX + width) / cell) + 1);
  const y1 = Math.min(gridH, Math.ceil((camY + height) / cell) + 1);
  if (x1 > x0 && y1 > y0) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      mapPicture,
      x0 * CELL_PIXELS, y0 * CELL_PIXELS, (x1 - x0) * CELL_PIXELS, (y1 - y0) * CELL_PIXELS,
      x0 * cell - camX, y0 * cell - camY, (x1 - x0) * cell, (y1 - y0) * cell
    );
  }

  ctx.save();
  ctx.translate(-camX, -camY);

  // Lines (trails)
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const p of players) {
    if (!p.alive || p.trailPoints.length === 0) continue;
    ctx.strokeStyle = p.light;
    ctx.globalAlpha = 0.85;
    ctx.lineWidth = cell * 0.7;
    ctx.beginPath();
    ctx.moveTo(p.trailPoints[0].x * cell, p.trailPoints[0].y * cell);
    for (const pt of p.trailPoints) ctx.lineTo(pt.x * cell, pt.y * cell);
    ctx.lineTo(p.x * cell, p.y * cell);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  for (const p of players) if (p.alive) drawPlayer(p, cell);

  for (const s of sparks) {
    ctx.globalAlpha = s.life / 40;
    ctx.fillStyle = s.color;
    ctx.fillRect(s.x * cell - cell * 0.2, s.y * cell - cell * 0.2, cell * 0.4, cell * 0.4);
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  drawHud();

  // Show where your finger is steering
  if (stick) {
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = "white";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(stick.startX, stick.startY, 50, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(stick.x, stick.y, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawPlayer(p, cell) {
  const size = cell * 1.2;
  const x = p.x * cell - size / 2;
  const y = p.y * cell - size / 2;
  ctx.fillStyle = p.dark;
  ctx.beginPath();
  ctx.roundRect(x, y + size * 0.15, size, size, size * 0.2);
  ctx.fill();
  ctx.fillStyle = p.color;
  ctx.beginPath();
  ctx.roundRect(x, y, size, size, size * 0.2);
  ctx.fill();

  // Eyes that look where you're going
  const lookX = Math.cos(p.angle) * size * 0.08;
  const lookY = Math.sin(p.angle) * size * 0.08;
  for (const side of [-1, 1]) {
    const ex = p.x * cell + side * size * 0.2;
    const ey = p.y * cell - size * 0.05;
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(ex, ey, size * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#222";
    ctx.beginPath();
    ctx.arc(ex + lookX, ey + lookY, size * 0.07, 0, Math.PI * 2);
    ctx.fill();
  }

  drawText(p.name, p.x * cell, y - size * 0.35, Math.max(12, cell * 0.5));
}

function drawHud() {
  const pad = 16;
  const painted = counts[me.id] / landCount;

  // Top left: level name and how close you are to winning
  drawText(`${level.emoji} ${level.name}`, pad, pad + 18, 26, "white", "left");
  const barW = Math.min(320, width * 0.4);
  const barH = 26;
  const barY = pad + 42;
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.beginPath();
  ctx.roundRect(pad, barY, barW, barH, barH / 2);
  ctx.fill();
  ctx.fillStyle = me.color;
  ctx.beginPath();
  ctx.roundRect(pad, barY, Math.max(barH, (barW * Math.min(painted, level.target)) / level.target), barH, barH / 2);
  ctx.fill();
  drawText(`${Math.floor(painted * 100)}% of ${Math.round(level.target * 100)}%`, pad + barW / 2, barY + barH / 2, 16);

  // Top right (under the 🏠): who has the most land
  const ranking = players
    .filter((p) => p.alive)
    .sort((a, b) => counts[b.id] - counts[a.id])
    .slice(0, 5);
  let rowY = 96;
  for (const p of ranking) {
    const percent = ((counts[p.id] / landCount) * 100).toFixed(1);
    ctx.fillStyle = p === me ? p.dark : "rgba(0, 0, 0, 0.25)";
    ctx.beginPath();
    ctx.roundRect(width - pad - 190, rowY - 15, 190, 30, 10);
    ctx.fill();
    ctx.fillStyle = p.color;
    ctx.fillRect(width - pad - 182, rowY - 8, 16, 16);
    drawText(p.name, width - pad - 158, rowY, 16, "white", "left");
    drawText(`${percent}%`, width - pad - 10, rowY, 16, "white", "right");
    rowY += 36;
  }

  // Bottom left: little map of the whole continent
  const mini = Math.min(170, width * 0.22);
  const miniScale = mini / Math.max(gridW, gridH);
  const mx = pad;
  const my = height - pad - gridH * miniScale;
  ctx.globalAlpha = 0.85;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(mapPicture, mx, my, gridW * miniScale, gridH * miniScale);
  ctx.globalAlpha = 1;
  for (const p of players) {
    if (!p.alive) continue;
    ctx.fillStyle = p === me ? "white" : p.dark;
    ctx.beginPath();
    ctx.arc(mx + p.x * miniScale, my + p.y * miniScale, p === me ? 5 : 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Messages like "You got Zippy!"
  let popY = height * 0.22;
  for (const pop of popups) {
    ctx.globalAlpha = Math.min(1, pop.life / 30);
    drawText(pop.text, width / 2, popY, 30, "#ffd23c");
    popY += 40;
  }
  ctx.globalAlpha = 1;
}

function drawOverlay() {
  if (screen === "ready") {
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.fillRect(0, 0, width, height);
    drawText(`Level ${levelNumber + 1}: ${level.emoji} ${level.name}`, width / 2, height * 0.3, 40, "#ffd23c");
    drawText(`Paint ${Math.round(level.target * 100)}% of ${level.name} to win!`, width / 2, height * 0.42, 28);
    drawText(`${level.bots} other players are trying to paint it too.`, width / 2, height * 0.5, 20);
    drawText("Slide your finger to steer. Tap to start!", width / 2, height * 0.62, 26);
  }

  if (screen === "won" || screen === "lost") {
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, width, height);
    const painted = Math.floor(bestThisGame * 100);
    if (screen === "won") {
      drawText(`${level.name} painted! 🎉`, width / 2, height * 0.3, 48, "#ffd23c");
      const next = LEVELS[levelNumber + 1];
      drawText(next ? `${next.emoji} ${next.name} is unlocked!` : "You painted the whole world! 🌏", width / 2, height * 0.42, 28);
    } else {
      drawText("Oh no!", width / 2, height * 0.28, 52, "#ff5a5a");
      drawText(endReason, width / 2, height * 0.38, 28);
      drawText(`You painted ${painted}% (you need ${Math.round(level.target * 100)}%)`, width / 2, height * 0.46, 22);
    }
    if (endTimer <= 0) {
      const bw = 240;
      const bh = 70;
      const by = height * 0.58;
      addButton("🌏 World map", width / 2 - bw - 15, by, bw, bh, "#3d8bff", () => (screen = "worldMap"));
      if (screen === "won" && LEVELS[levelNumber + 1]) {
        addButton("Next ▶", width / 2 + 15, by, bw, bh, "#2ecc71", () => startLevel(levelNumber + 1));
      } else {
        addButton("Try again", width / 2 + 15, by, bw, bh, "#2ecc71", () => startLevel(levelNumber));
      }
    }
  }
}

// ---------------------------------------------------------------------
//  7. THE WORLD MAP SCREEN
//  Each continent fills up with your colour as you paint it.
// ---------------------------------------------------------------------

let worldShapes = []; // continent outlines in screen positions, for tapping

function drawWorldMap() {
  const sea = ctx.createLinearGradient(0, 0, 0, height);
  sea.addColorStop(0, "#1d6fa5");
  sea.addColorStop(1, "#2f9fd8");
  ctx.fillStyle = sea;
  ctx.fillRect(0, 0, width, height);

  drawText(SETTINGS.title, width / 2, 50, Math.min(56, width / 12), "#ffd23c");

  // Fit the world (longitude -170 to 180, latitude 80 to -56) on the screen
  const top = 100;
  const bottom = 60;
  const scale = Math.min((width - 40) / 350, (height - top - bottom) / 136);
  const ox = (width - 350 * scale) / 2;
  const oy = top + (height - top - bottom - 136 * scale) / 2;
  const toScreen = ([lon, lat]) => [ox + (lon + 170) * scale, oy + (80 - lat) * scale];

  worldShapes = [];
  const pulse = 0.5 + 0.5 * Math.sin(frame * 0.08);

  LEVELS.forEach((lvl, n) => {
    const points = SHAPES[lvl.shape].map(toScreen);
    worldShapes.push({ n, points });
    const locked = n >= progress.unlocked;
    const filled = Math.min(1, (progress.best[n] || 0) / lvl.target);

    const outline = new Path2D();
    points.forEach(([x, y], i) => (i ? outline.lineTo(x, y) : outline.moveTo(x, y)));
    outline.closePath();

    ctx.fillStyle = locked ? "#9aa7b4" : SETTINGS.paper;
    ctx.fill(outline);

    // Paint fills up from the bottom as you get closer to winning
    if (filled > 0) {
      const ys = points.map((p) => p[1]);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      ctx.save();
      ctx.clip(outline);
      ctx.fillStyle = SETTINGS.playerColor;
      ctx.fillRect(0, maxY - (maxY - minY) * filled, width, (maxY - minY) * filled + 1);
      ctx.restore();
    }

    const current = n === progress.unlocked - 1 && filled < 1;
    ctx.lineWidth = current ? 3 + pulse * 3 : 2;
    ctx.strokeStyle = current ? "#ffd23c" : "rgba(0, 0, 0, 0.25)";
    ctx.stroke(outline);

    // Label in the middle of the continent
    const xs = points.map((p) => p[0]);
    const ys = points.map((p) => p[1]);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    const label = locked ? "🔒" : filled >= 1 ? "✅" : lvl.emoji;
    ctx.font = `${Math.max(22, scale * 14)}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "white";
    ctx.fillText(label, cx, cy);
    if (!locked) {
      const size = Math.max(13, scale * 5.5);
      drawText(`${n + 1}. ${lvl.name}`, cx, cy + Math.max(26, scale * 13), size);
      if (filled > 0 && filled < 1) {
        drawText(`${Math.round(filled * 100)}%`, cx, cy + Math.max(26, scale * 13) + size * 1.3, size * 0.9, "#ffd23c");
      }
    }
  });

  drawText("Tap a continent to play!", width / 2, height - 30, 22);
}

function tapWorldMap(x, y) {
  for (const shape of worldShapes) {
    if (pointInShape(x, y, shape.points) && shape.n < progress.unlocked) {
      startLevel(shape.n);
      return;
    }
  }
}

// ---------------------------------------------------------------------
//  8. THE GAME LOOP
//  The game moves in steps of 1/60th of a second, so it runs at the
//  same speed on every tablet (some tablet screens refresh 120 times a second).
// ---------------------------------------------------------------------

let frame = 0;

function update() {
  frame++;
  if (endTimer > 0) endTimer--;

  for (const s of sparks) {
    s.x += s.vx;
    s.y += s.vy;
    s.life--;
  }
  sparks = sparks.filter((s) => s.life > 0);
  for (const pop of popups) pop.life--;
  popups = popups.filter((pop) => pop.life > 0);

  if (screen !== "playing") return;

  readKeyboard();
  for (const p of players) {
    if (p.alive) {
      if (p.isBot) thinkBot(p);
      movePlayer(p);
    } else if (p.isBot) {
      p.respawnTimer--;
      if (p.respawnTimer <= 0) spawn(p, false);
    }
  }
}

function draw() {
  screenButtons = [];
  if (screen === "worldMap") {
    drawWorldMap();
    return;
  }
  drawGame();
  drawOverlay();
}

let lastTime = performance.now();
let waiting = 0;

function loop(now) {
  waiting += Math.min(now - lastTime, 100);
  lastTime = now;
  while (waiting >= 1000 / 60) {
    update();
    waiting -= 1000 / 60;
  }
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener("resize", resize);
resize();
requestAnimationFrame(loop);
