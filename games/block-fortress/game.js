// =====================================================================
//  BLOCK FORTRESS
//
//  Monsters are coming to your castle! Build walls to make them walk
//  the long way round, and towers to blast them.
//  Watch out for the lost chick 🐣: it's not a monster. Tap it to help!
//
//  Bolt the robot 🤖 gives you a tip before each wave. Bolt is a helpful
//  robot, but Bolt is sometimes WRONG. Do you think the tip is good? 👍 or 👎
//
//  The towers, monsters and levels are in levels.js.
//
//  👇 CHANGE THESE to make the game your own! 👇
// =====================================================================

const SETTINGS = {
  castleHearts: 10,     // how many monsters can get in before you lose
  waveBonus: 10,        // 🧱 blocks you get after each wave
  chickReward: 15,      // 🧱 blocks for helping a lost chick home
  tipReward: 5,         // 🪙 coins for spotting if Bolt's tip was good or bad
};

// =====================================================================
//  The code is in parts:
//    1. Saving
//    2. Screen and drawing helpers
//    3. Starting a level and the path the monsters take
//    4. Building towers
//    5. Waves, monsters and shooting
//    6. Bolt's tips
//    7. Winning and losing
//    8. Drawing the game
//    9. Tapping and the tutorial
//   10. The level map and the shop
//   11. The game loop
// =====================================================================

const $ = (id) => document.getElementById(id);

// ---------------------------------------------------------------------
//  1. SAVING
// ---------------------------------------------------------------------

function loadSave() {
  const fresh = {
    coins: 0,
    stars: [],
    unlocked: { wall: true, blaster: true },
    builder: 0,
    castle: 0,
    ownedBuilders: { 0: true },
    ownedCastles: { 0: true },
    boosts: { blocks: 0, hearts: 0 },
    badges: 0,
    kindness: 0,
    tutorialDone: false,
  };
  try {
    const saved = JSON.parse(localStorage.getItem("blockFortressSave"));
    if (saved) return { ...fresh, ...saved };
  } catch {}
  return fresh;
}

const save = loadSave();

function saveGame() {
  try {
    localStorage.setItem("blockFortressSave", JSON.stringify(save));
  } catch {}
}

// ---------------------------------------------------------------------
//  2. SCREEN AND DRAWING HELPERS
//  The game world is always 1600 x 900, scaled to fit the tablet.
// ---------------------------------------------------------------------

const canvas = $("game");
const ctx = canvas.getContext("2d");
const W = 1600;
const H = 900;
const TILE = 80;
const COLS = 16;
const ROWS = 9;
const GRID_X = 20;
const GRID_Y = 90;

let width = 0;
let height = 0;
let zoom = 1;
let offX = 0;
let offY = 0;

function resize() {
  const scale = window.devicePixelRatio || 1;
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width * scale;
  canvas.height = height * scale;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  zoom = Math.min(width / W, height / H);
  offX = (width - W * zoom) / 2;
  offY = (height - H * zoom) / 2;
}

function box(x, y, w, h, color, round = 12) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, round);
  ctx.fill();
}

function emoji(e, x, y, size) {
  ctx.font = `${size}px system-ui, "Apple Color Emoji", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "white";
  ctx.fillText(e, x, y);
}

function text(t, x, y, size, color = "white", align = "center") {
  ctx.font = `bold ${size}px system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.lineWidth = size * 0.2;
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(30, 40, 30, 0.55)";
  ctx.strokeText(t, x, y);
  ctx.fillStyle = color;
  ctx.fillText(t, x, y);
}

// Split long text into lines that fit
function wrap(t, maxWidth, size) {
  ctx.font = `bold ${size}px system-ui, sans-serif`;
  const words = t.split(" ");
  const lines = [""];
  for (const word of words) {
    const test = lines[lines.length - 1] ? `${lines[lines.length - 1]} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && lines[lines.length - 1]) lines.push(word);
    else lines[lines.length - 1] = test;
  }
  return lines;
}

const tileCenter = (c, r) => ({ x: GRID_X + c * TILE + TILE / 2, y: GRID_Y + r * TILE + TILE / 2 });
const tileAt = (x, y) => ({ c: Math.floor((x - GRID_X) / TILE), r: Math.floor((y - GRID_Y) / TILE) });
const inGrid = (c, r) => c >= 0 && r >= 0 && c < COLS && r < ROWS;
const index = (c, r) => r * COLS + c;

// ---------------------------------------------------------------------
//  3. STARTING A LEVEL AND THE PATH THE MONSTERS TAKE
// ---------------------------------------------------------------------

let game = null;

function parseWaves(textWaves) {
  return textWaves.split("|").map((wave) =>
    wave.split("+").map((group) => {
      const [type, count] = group.trim().split("*");
      return { type: type.trim(), count: Number(count) };
    })
  );
}

function startLevel(n) {
  const level = LEVELS[n];
  const map = MAPS[level.map];
  const rocks = new Uint8Array(COLS * ROWS);
  let spawn = null;
  let castle = null;
  map.rows.forEach((row, r) => {
    [...row].forEach((ch, c) => {
      if (ch === "#") rocks[index(c, r)] = 1;
      if (ch === "S") spawn = { c, r };
      if (ch === "C") castle = { c, r };
    });
  });
  const hearts = SETTINGS.castleHearts + save.boosts.hearts * 2;
  game = {
    n,
    level,
    map,
    rocks,
    spawn,
    castle,
    towers: new Array(COLS * ROWS).fill(null),
    monsters: [],
    shots: [],
    beams: [],
    sparks: [],
    floaters: [],
    waves: parseWaves(level.waves),
    wave: 0,
    phase: "build",
    queue: [],
    waveTime: 0,
    blocks: level.blocks + save.boosts.blocks * 15,
    hearts,
    maxHearts: hearts,
    tool: null,
    leaked: [],
    flash: null,
    fast: false,
    tip: null,
    tutorial: !save.tutorialDone && n === 0 ? 0 : -1,
  };
  game.dist = computePath(game.towers);
  chooseTip();
  showScreen("play");
}

// Works out how far every square is from the castle, going round walls.
// Monsters always step to a square that's closer to the castle.
function computePath(towers) {
  const dist = new Int16Array(COLS * ROWS).fill(-1);
  const queue = [game.castle];
  dist[index(game.castle.c, game.castle.r)] = 0;
  while (queue.length) {
    const { c, r } = queue.shift();
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nc = c + dc;
      const nr = r + dr;
      if (!inGrid(nc, nr)) continue;
      const i = index(nc, nr);
      if (dist[i] !== -1 || game.rocks[i] || towers[i]) continue;
      dist[i] = dist[index(c, r)] + 1;
      queue.push({ c: nc, r: nr });
    }
  }
  return dist;
}

// The squares from the start to the castle (drawn as dots so you can see the path)
function pathTiles() {
  const tiles = [];
  let { c, r } = game.spawn;
  for (let steps = 0; steps < COLS * ROWS && game.dist[index(c, r)] > 0; steps++) {
    tiles.push({ c, r });
    const next = nextTile(c, r, game.dist);
    if (!next) break;
    ({ c, r } = next);
  }
  return tiles;
}

function nextTile(c, r, dist) {
  let best = null;
  for (const [dc, dr] of [[1, 0], [0, -1], [0, 1], [-1, 0]]) {
    const nc = c + dc;
    const nr = r + dr;
    if (!inGrid(nc, nr)) continue;
    const d = dist[index(nc, nr)];
    if (d >= 0 && d < dist[index(c, r)] && (!best || d < best.d)) best = { c: nc, r: nr, d };
  }
  return best;
}

// ---------------------------------------------------------------------
//  4. BUILDING TOWERS
// ---------------------------------------------------------------------

function towerStats(tower) {
  const t = TOWERS[tower.type];
  const boost = [1, 1.6, 2.4][tower.level - 1];
  return { ...t, damage: t.damage * boost, range: t.range * [1, 1.12, 1.25][tower.level - 1] };
}

function upgradeCost(tower) {
  return Math.round(TOWERS[tower.type].cost * (tower.level === 1 ? 0.8 : 1.2));
}

// Why can't we build here? Gives back null if we can.
function whyNotBuild(c, r) {
  const i = index(c, r);
  if (game.rocks[i]) return "There's a rock there!";
  if (game.towers[i]) return null;
  if ((c === game.spawn.c && r === game.spawn.r) || (c === game.castle.c && r === game.castle.r)) return "You can't build there!";
  for (const m of game.monsters) {
    if (m.flying) continue;
    const here = tileAt(m.x, m.y);
    if ((here.c === c && here.r === r) || (m.target && m.target.c === c && m.target.r === r)) return "A monster is standing there!";
  }
  // Would this block the path completely?
  const test = [...game.towers];
  test[i] = { type: "test" };
  const dist = computePath(test);
  if (dist[index(game.spawn.c, game.spawn.r)] < 0) return "Monsters need SOME way through! Don't block it all.";
  for (const m of game.monsters) {
    if (m.flying) continue;
    const here = tileAt(m.x, m.y);
    if (inGrid(here.c, here.r) && dist[index(here.c, here.r)] < 0) return "That would trap a monster!";
  }
  return null;
}

function build(c, r) {
  const type = game.tool;
  const cost = TOWERS[type].cost;
  if (game.blocks < cost) {
    toast(`You need ${cost} 🧱. Blast monsters to get more!`);
    return;
  }
  const why = whyNotBuild(c, r);
  if (why) {
    game.flash = { c, r, life: 30 };
    toast(why);
    return;
  }
  game.blocks -= cost;
  game.towers[index(c, r)] = { type, level: 1, cooldown: 0, spent: cost, c, r };
  game.dist = computePath(game.towers);
  const p = tileCenter(c, r);
  burst(p.x, p.y, "#ffd23c", 10);
  if (game.tutorial === 1 || game.tutorial === 2) game.tutorial++;
}

function towerMenu(tower) {
  const t = TOWERS[tower.type];
  const refund = Math.floor(tower.spent / 2);
  const buttons = [];
  if (tower.type !== "wall" && tower.level < 3) {
    const cost = upgradeCost(tower);
    buttons.push([`⬆️ Upgrade (${cost} 🧱)`, "green", () => {
      if (game.blocks < cost) return toast(`You need ${cost} 🧱`);
      game.blocks -= cost;
      tower.level++;
      tower.spent += cost;
      const p = tileCenter(tower.c, tower.r);
      burst(p.x, p.y, "#7cff9b", 16);
    }]);
  }
  buttons.push([`♻️ Sell (+${refund} 🧱)`, "orange", () => {
    game.towers[index(tower.c, tower.r)] = null;
    game.blocks += refund;
    game.dist = computePath(game.towers);
  }]);
  buttons.push(["Close", "grey"]);
  const stars = tower.type === "wall" ? "" : `<p>Level ${"⭐".repeat(tower.level)}</p>`;
  showPopup(`${t.emoji} ${t.name}`, `<p>${t.info}</p>${stars}`, buttons);
}

// ---------------------------------------------------------------------
//  5. WAVES, MONSTERS AND SHOOTING
// ---------------------------------------------------------------------

function startWave() {
  if (game.phase !== "build") return;
  game.phase = "wave";
  game.waveTime = 0;
  game.queue = [];
  let t = 0;
  for (const group of game.waves[game.wave]) {
    for (let i = 0; i < group.count; i++) {
      game.queue.push({ type: group.type, at: t });
      t += MONSTERS[group.type].gap * 60;
    }
    t += 60;
  }
  if (game.tutorial === 3) {
    game.tutorial = -1;
    save.tutorialDone = true;
    saveGame();
  }
}

function spawnMonster(type) {
  const def = MONSTERS[type];
  const p = tileCenter(game.spawn.c, game.spawn.r);
  const toughness = 1 + 0.07 * game.n; // monsters get a bit tougher each level
  game.monsters.push({
    type,
    def,
    x: p.x,
    y: p.y,
    hp: def.hp * toughness,
    maxHp: def.hp * toughness,
    flying: !!def.flying,
    friendly: !!def.friendly,
    helped: false,
    slow: 0,
    target: null,
    wobble: Math.random() * 6,
  });
}

function moveMonster(m) {
  const speed = (m.def.speed * TILE) / 60 * (m.slow > 0 ? 0.55 : 1);
  if (m.slow > 0) m.slow--;
  const castle = tileCenter(game.castle.c, game.castle.r);

  if (m.flying) {
    const dx = castle.x - m.x;
    const dy = castle.y - m.y;
    const d = Math.hypot(dx, dy);
    if (d < speed + 4) return reachCastle(m);
    m.x += (dx / d) * speed;
    m.y += (dy / d) * speed;
    return;
  }

  // Walkers go square by square towards the castle
  if (!m.target) {
    const here = tileAt(m.x, m.y);
    if (here.c === game.castle.c && here.r === game.castle.r) return reachCastle(m);
    m.target = nextTile(here.c, here.r, game.dist);
    if (!m.target) return;
  }
  const goal = tileCenter(m.target.c, m.target.r);
  const dx = goal.x - m.x;
  const dy = goal.y - m.y;
  const d = Math.hypot(dx, dy);
  if (d <= speed) {
    m.x = goal.x;
    m.y = goal.y;
    m.target = null;
  } else {
    m.x += (dx / d) * speed;
    m.y += (dy / d) * speed;
  }
}

function reachCastle(m) {
  m.gone = true;
  if (m.friendly) {
    if (m.helped) {
      game.blocks += SETTINGS.chickReward;
      save.kindness++;
      saveGame();
      floatText(`💛 The chick is home! +${SETTINGS.chickReward} 🧱`, m.x, m.y - 40, "#ffe066");
    } else {
      floatText("🐣 Phew, home safe!", m.x, m.y - 40, "#ffe066");
    }
    return;
  }
  game.hearts -= m.def.boss ? 3 : 1;
  game.leaked.push(m.type);
  floatText("💔", m.x, m.y - 40, "#ff6b6b");
  if (game.hearts <= 0) loseLevel();
}

function towerShoot(tower) {
  const s = towerStats(tower);
  if (!s.rate) return;
  if (tower.cooldown > 0) {
    tower.cooldown--;
    return;
  }
  const p = tileCenter(tower.c, tower.r);
  let best = null;
  let bestScore = Infinity;
  for (const m of game.monsters) {
    if (m.gone || (m.friendly && m.helped)) continue;
    if (m.flying && !s.air) continue;
    if (!m.flying && s.airOnly) continue;
    if (Math.hypot(m.x - p.x, m.y - p.y) > s.range * TILE) continue;
    // Shoot the monster that's closest to the castle
    const here = tileAt(m.x, m.y);
    const score = m.flying ? Math.hypot(m.x - p.x, m.y - p.y) / TILE : game.dist[index(here.c, here.r)];
    if (score < bestScore) {
      bestScore = score;
      best = m;
    }
  }
  if (!best) return;
  tower.cooldown = s.rate;
  if (tower.type === "laser") {
    hit(best, s);
    game.beams.push({ x1: p.x, y1: p.y, x2: best.x, y2: best.y, life: 5, color: s.color });
  } else {
    game.shots.push({ x: p.x, y: p.y, target: best, tx: best.x, ty: best.y, stats: s });
  }
}

function moveShot(shot) {
  if (shot.target && !shot.target.gone) {
    shot.tx = shot.target.x;
    shot.ty = shot.target.y;
  }
  const dx = shot.tx - shot.x;
  const dy = shot.ty - shot.y;
  const d = Math.hypot(dx, dy);
  if (d < 14) {
    shot.done = true;
    const s = shot.stats;
    if (s.splash) {
      for (const m of game.monsters) {
        if (!m.flying && !m.gone && !(m.friendly && m.helped) && Math.hypot(m.x - shot.tx, m.y - shot.ty) < s.splash * TILE) hit(m, s);
      }
      burst(shot.tx, shot.ty, "#ffb347", 14);
    } else if (shot.target && !shot.target.gone) {
      hit(shot.target, s);
    }
    return;
  }
  shot.x += (dx / d) * 12;
  shot.y += (dy / d) * 12;
}

function hit(m, s) {
  m.hp -= Math.max(1, s.damage - (m.def.armor || 0));
  if (s.slow) m.slow = 70;
  if (m.hp > 0 || m.gone) return;
  m.gone = true;
  if (m.friendly) {
    floatText("😢 The chick ran away scared", m.x, m.y - 40, "#ffe066");
    return;
  }
  game.blocks += m.def.reward;
  burst(m.x, m.y, "#ffffff", m.def.boss ? 40 : 12);
  floatText(`+${m.def.reward} 🧱`, m.x, m.y - 30, "#ffe066");
}

function updateWave() {
  game.waveTime++;
  while (game.queue.length && game.queue[0].at <= game.waveTime) spawnMonster(game.queue.shift().type);
  for (const m of game.monsters) if (!m.gone) moveMonster(m);
  for (const tower of game.towers) if (tower) towerShoot(tower);
  for (const shot of game.shots) moveShot(shot);
  game.monsters = game.monsters.filter((m) => !m.gone);
  game.shots = game.shots.filter((s) => !s.done);
  if (game.phase === "wave" && game.queue.length === 0 && game.monsters.length === 0) waveCleared();
}

function waveCleared() {
  judgeTip();
  game.wave++;
  if (game.wave >= game.waves.length) {
    winLevel();
    return;
  }
  const bonus = SETTINGS.waveBonus + game.wave * 2;
  game.blocks += bonus;
  floatText(`Wave done! +${bonus} 🧱`, W / 2 - 150, 450, "#7cff9b");
  game.phase = "build";
  chooseTip();
}

// ---------------------------------------------------------------------
//  6. BOLT'S TIPS
//  Bolt looks at the next wave and gives a tip. Some tips are wrong!
// ---------------------------------------------------------------------

function chooseTip() {
  const types = game.waves[game.wave].map((g) => g.type);
  const order = ["chick", "kingblob", "bat", "turtle", "beetle", "blob"];
  const about = order.find((t) => types.includes(t)) || "blob";
  const choices = BOLT_TIPS[about];
  const good = Math.random() < 0.6;
  const tip = choices.find((c) => c.good === good) || choices[0];
  game.tip = { ...tip, vote: null };
}

function voteTip(vote) {
  if (game.phase !== "build" || !game.tip) return;
  game.tip.vote = vote;
}

function judgeTip() {
  const tip = game.tip;
  if (!tip || tip.vote === null) return;
  const right = (tip.vote === "up") === tip.good;
  if (right) {
    save.coins += SETTINGS.tipReward;
    save.badges++;
    saveGame();
    toast(`🔍 Good thinking! Bolt's tip was ${tip.good ? "good" : "WRONG"}. +${SETTINGS.tipReward} 🪙`);
  } else {
    toast(`🤔 Bolt's tip was actually ${tip.good ? "good" : "wrong"}. Now you know!`);
  }
}

// ---------------------------------------------------------------------
//  7. WINNING AND LOSING
// ---------------------------------------------------------------------

function winLevel() {
  game.phase = "won";
  const lost = game.maxHearts - game.hearts;
  const stars = lost === 0 ? 3 : game.hearts >= game.maxHearts / 2 ? 2 : 1;
  const firstTime = !save.stars[game.n];
  const coins = 10 + stars * 10 + (firstTime ? 15 : 0);
  save.stars[game.n] = Math.max(save.stars[game.n] || 0, stars);
  save.coins += coins;
  saveGame();
  const next = LEVELS[game.n + 1];
  const buttons = [];
  if (next) buttons.push(["Next level ▶", "green", () => startLevel(game.n + 1)]);
  buttons.push(["🗺️ Map", "blue", () => showScreen("map")]);
  buttons.push(["Play again", "grey", () => startLevel(game.n)]);
  setTimeout(() => {
    showPopup(
      next ? "🏆 You saved the castle!" : "🏆 You beat EVERY level!",
      `<div class="stars">${"⭐".repeat(stars)}${"☆".repeat(3 - stars)}</div>
       <p>You got <b>${coins} 🪙</b>${firstTime ? " (first time bonus!)" : ""}</p>
       ${stars < 3 ? "<p>Get 3 stars by not letting ANY monsters in.</p>" : ""}`,
      buttons
    );
  }, 600);
}

function loseLevel() {
  if (game.phase === "lost") return;
  game.phase = "lost";
  // Work out which monster got in most, and give a helpful tip
  const counts = {};
  for (const t of game.leaked) counts[t] = (counts[t] || 0) + 1;
  const worst = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0] || "blob";
  const advice = BOLT_TIPS[worst].find((t) => t.good).text;
  const who = Object.entries(counts).map(([t, n]) => `${MONSTERS[t].emoji}×${n}`).join("  ");
  setTimeout(() => {
    showPopup(
      "😮 The monsters got in!",
      `<p>These got past: <b>${who}</b></p><p class="advice">💡 ${advice}</p><p>Every builder learns by trying again!</p>`,
      [
        ["🔁 Try again", "green", () => startLevel(game.n)],
        ["🗺️ Map", "blue", () => showScreen("map")],
      ]
    );
  }, 600);
}

// ---------------------------------------------------------------------
//  8. DRAWING THE GAME
// ---------------------------------------------------------------------

let frame = 0;

function burst(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = 2 + Math.random() * 4;
    game.sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 30, color });
  }
}

function floatText(t, x, y, color) {
  game.floaters.push({ t, x, y, life: 90, color });
}

// Buttons drawn on the game screen: [name, x, y, w, h]
function panelButtons() {
  const list = Object.keys(TOWERS).map((type, i) => ({ type, x: 1320, y: 96 + i * 98, w: 262, h: 88 }));
  return {
    towers: list,
    go: { x: 1320, y: 690, w: 262, h: 90 },
    fast: { x: 1320, y: 20, w: 120, h: 60 },
    up: { x: 1388, y: 812, w: 90, h: 76 },
    down: { x: 1492, y: 812, w: 90, h: 76 },
  };
}

function drawGame() {
  ctx.fillStyle = "#2d4a2f";
  ctx.fillRect(0, 0, width, height);
  ctx.save();
  ctx.translate(offX, offY);
  ctx.scale(zoom, zoom);
  ctx.fillStyle = "#3b5e3d";
  ctx.fillRect(0, 0, W, H);

  // The grass grid
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      ctx.fillStyle = game.map.grass[(r + c) % 2];
      ctx.fillRect(GRID_X + c * TILE, GRID_Y + r * TILE, TILE, TILE);
      if (game.rocks[index(c, r)]) emoji("🪨", tileCenter(c, r).x, tileCenter(c, r).y, 60);
    }
  }

  // The path the monsters will walk (dots)
  ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
  for (const t of pathTiles()) {
    const p = tileCenter(t.c, t.r);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Start portal and castle
  const s = tileCenter(game.spawn.c, game.spawn.r);
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(frame * 0.05);
  emoji("🌀", 0, 0, 70);
  ctx.restore();
  const cp = tileCenter(game.castle.c, game.castle.r);
  emoji(CASTLES[save.castle].emoji, cp.x, cp.y - 6, 74);
  emoji(BUILDERS[save.builder].emoji, cp.x - 10, cp.y + TILE * 0.95, 46);

  // Bad square flash
  if (game.flash && game.flash.life-- > 0) {
    ctx.fillStyle = `rgba(255, 60, 60, ${game.flash.life / 40})`;
    ctx.fillRect(GRID_X + game.flash.c * TILE, GRID_Y + game.flash.r * TILE, TILE, TILE);
  }

  // Towers
  for (const tower of game.towers) {
    if (!tower) continue;
    const t = TOWERS[tower.type];
    const x = GRID_X + tower.c * TILE;
    const y = GRID_Y + tower.r * TILE;
    if (tower.type === "wall") {
      box(x + 3, y + 3, TILE - 6, TILE - 6, "#b5784a", 8);
      ctx.fillStyle = "#9a6038";
      ctx.fillRect(x + 3, y + TILE / 2 - 2, TILE - 6, 4);
      ctx.fillRect(x + TILE / 2 - 2, y + 3, 4, TILE / 2 - 3);
    } else {
      box(x + 6, y + 10, TILE - 12, TILE - 12, "rgba(0,0,0,0.2)", 14);
      box(x + 6, y + 6, TILE - 12, TILE - 12, t.color, 14);
      emoji(t.emoji, x + TILE / 2, y + TILE / 2, 44);
      if (tower.level > 1) text("⭐".repeat(tower.level - 1), x + TILE / 2, y + 12, 14);
    }
  }

  // Monsters
  for (const m of game.monsters) {
    const bob = Math.sin(frame * 0.2 + m.wobble) * 3;
    const size = m.def.boss ? 90 : 52;
    if (m.flying) {
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.beginPath();
      ctx.ellipse(m.x, m.y + 30, 18, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (m.friendly && !m.helped) {
      // A wave and a heart so you know it's friendly
      emoji(frame % 40 < 20 ? "👋" : "💛", m.x + 26, m.y - 26, 26);
    }
    if (m.friendly && m.helped) {
      ctx.fillStyle = "rgba(255, 230, 102, 0.45)";
      ctx.beginPath();
      ctx.arc(m.x, m.y, 34, 0, Math.PI * 2);
      ctx.fill();
    }
    emoji(m.def.emoji, m.x, m.y + bob - (m.flying ? 10 : 0), size);
    if (m.def.boss) emoji("👑", m.x, m.y - 56 + bob, 40);
    if (m.slow > 0) emoji("❄️", m.x + 20, m.y - 20, 20);
    if (!m.friendly && m.hp < m.maxHp) {
      box(m.x - 26, m.y - size / 2 - 14, 52, 8, "rgba(0,0,0,0.4)", 4);
      box(m.x - 26, m.y - size / 2 - 14, 52 * Math.max(0, m.hp / m.maxHp), 8, "#ff5a5a", 4);
    }
  }

  // Shots and lasers
  for (const shot of game.shots) {
    ctx.fillStyle = shot.stats.color;
    ctx.beginPath();
    ctx.arc(shot.x, shot.y, shot.stats.splash ? 10 : 7, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const b of game.beams) {
    ctx.strokeStyle = b.color;
    ctx.lineWidth = 6;
    ctx.globalAlpha = b.life / 5;
    ctx.beginPath();
    ctx.moveTo(b.x1, b.y1);
    ctx.lineTo(b.x2, b.y2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  for (const sp of game.sparks) {
    ctx.globalAlpha = sp.life / 30;
    ctx.fillStyle = sp.color;
    ctx.fillRect(sp.x - 4, sp.y - 4, 8, 8);
  }
  ctx.globalAlpha = 1;

  drawTopBar();
  drawPanel();
  drawBottomBar();
  drawTutorial();

  for (const f of game.floaters) {
    ctx.globalAlpha = Math.min(1, f.life / 30);
    text(f.t, f.x, f.y, 28, f.color);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawTopBar() {
  text(`Level ${game.n + 1} · ${game.map.name}`, 30, 45, 34, "white", "left");
  text(`❤️ ${game.hearts}`, 560, 45, 34, "white", "left");
  text(`🧱 ${game.blocks}`, 720, 45, 34, "#ffe066", "left");
  text(`Wave ${Math.min(game.wave + 1, game.waves.length)} of ${game.waves.length}`, 920, 45, 30, "white", "left");
  const b = panelButtons().fast;
  box(b.x, b.y, b.w, b.h, game.fast ? "#ff8a1e" : "rgba(255,255,255,0.2)", 16);
  text(game.fast ? "⏩ 2x" : "▶️ 1x", b.x + b.w / 2, b.y + b.h / 2, 26);
}

function drawPanel() {
  const buttons = panelButtons();
  for (const b of buttons.towers) {
    const t = TOWERS[b.type];
    const unlocked = save.unlocked[b.type];
    const chosen = game.tool === b.type;
    const afford = game.blocks >= t.cost;
    box(b.x, b.y, b.w, b.h, chosen ? "#ffd23c" : unlocked ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.3)", 18);
    emoji(unlocked ? t.emoji : "🔒", b.x + 46, b.y + b.h / 2, 46);
    ctx.globalAlpha = unlocked && !afford ? 0.45 : 1;
    ctx.font = "bold 26px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillStyle = "#2b2b2b";
    ctx.fillText(t.name, b.x + 92, b.y + 30);
    ctx.font = "bold 24px system-ui, sans-serif";
    ctx.fillStyle = unlocked ? "#9a6038" : "#555";
    ctx.fillText(unlocked ? `${t.cost} 🧱` : "Shop", b.x + 92, b.y + 62);
    ctx.globalAlpha = 1;
  }
  const go = buttons.go;
  if (game.phase === "build") {
    const pulse = 1 + Math.sin(frame * 0.1) * 0.03;
    ctx.save();
    ctx.translate(go.x + go.w / 2, go.y + go.h / 2);
    ctx.scale(pulse, pulse);
    box(-go.w / 2, -go.h / 2 + 6, go.w, go.h, "#1f8a4c", 22);
    box(-go.w / 2, -go.h / 2, go.w, go.h, "#2ebd6b", 22);
    text("GO! ▶", 0, 0, 40);
    ctx.restore();
  } else {
    box(go.x, go.y, go.w, go.h, "rgba(255,255,255,0.15)", 22);
    text(`👾 ${game.monsters.filter((m) => !m.friendly).length + game.queue.length} left`, go.x + go.w / 2, go.y + go.h / 2, 28);
  }
}

function drawBottomBar() {
  // Scout: what's in the next wave
  const wave = game.waves[Math.min(game.wave, game.waves.length - 1)];
  box(20, 812, 500, 76, "rgba(0,0,0,0.25)", 16);
  const label = game.phase === "wave" ? "This wave:" : "Next wave:";
  text(label, 36, 834, 20, "white", "left");
  let x = 36;
  const traits = new Set();
  for (const g of wave) {
    const m = MONSTERS[g.type];
    text(`${m.emoji}×${g.count}`, x, 866, 26, "white", "left");
    ctx.font = "bold 26px system-ui, sans-serif";
    x += ctx.measureText(`${m.emoji}×${g.count}`).width + 18;
    m.traits.forEach((t) => traits.add(t));
  }
  text([...traits].map((t) => TRAIT_ICONS[t]).join("  "), 180, 834, 18, "#ffe066", "left");

  // Bolt's tip
  box(530, 812, 1052, 76, "rgba(255,255,255,0.92)", 16);
  emoji("🤖", 572, 850, 48);
  const lines = wrap(`Bolt says: "${game.tip.text}"`, 640, 21);
  ctx.font = "bold 21px system-ui, sans-serif";
  ctx.fillStyle = "#2b2b2b";
  ctx.textAlign = "left";
  lines.slice(0, 2).forEach((line, i) => ctx.fillText(line, 610, 838 + i * 26 + (lines.length === 1 ? 12 : 0)));
  const b = panelButtons();
  const vote = game.tip.vote;
  box(b.up.x, b.up.y, b.up.w, b.up.h, vote === "up" ? "#2ebd6b" : "#e8eef5", 14);
  box(b.down.x, b.down.y, b.down.w, b.down.h, vote === "down" ? "#e8463c" : "#e8eef5", 14);
  emoji("👍", b.up.x + b.up.w / 2, b.up.y + b.up.h / 2, 40);
  emoji("👎", b.down.x + b.down.w / 2, b.down.y + b.down.h / 2, 40);
  if (vote === null && game.phase === "build") {
    ctx.font = "bold 17px system-ui, sans-serif";
    ctx.fillStyle = "#2b6cb0";
    ctx.textAlign = "right";
    ctx.fillText("Is Bolt", 1378, 838);
    ctx.fillText("right? 👉", 1378, 862);
  }
}

// ---------------------------------------------------------------------
//  9. TAPPING AND THE TUTORIAL
// ---------------------------------------------------------------------

function inside(p, b) {
  return p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
}

canvas.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  if (!game || game.phase === "won" || game.phase === "lost" || document.querySelector(".popup-back")) return;
  const p = { x: (event.clientX - offX) / zoom, y: (event.clientY - offY) / zoom };
  const buttons = panelButtons();

  for (const b of buttons.towers) {
    if (!inside(p, b)) continue;
    if (!save.unlocked[b.type]) {
      showPopup(`🔒 ${TOWERS[b.type].name}`, `<p>${TOWERS[b.type].info}</p><p>Unlock it in the 🛒 Shop for ${TOWERS[b.type].price} 🪙</p>`, [["OK", "grey"]]);
      return;
    }
    game.tool = game.tool === b.type ? null : b.type;
    if (game.tutorial === 0 && game.tool === "blaster") game.tutorial = 1;
    return;
  }
  if (inside(p, buttons.go)) return startWave();
  if (inside(p, buttons.fast)) {
    game.fast = !game.fast;
    return;
  }
  if (inside(p, buttons.up)) return voteTip("up");
  if (inside(p, buttons.down)) return voteTip("down");

  // Tapped a lost chick? Help it home!
  for (const m of game.monsters) {
    if (m.friendly && !m.helped && Math.hypot(m.x - p.x, m.y - p.y) < 50) {
      m.helped = true;
      floatText("💛 This way home!", m.x, m.y - 40, "#ffe066");
      return;
    }
  }

  const t = tileAt(p.x, p.y);
  if (!inGrid(t.c, t.r)) return;
  const tower = game.towers[index(t.c, t.r)];
  if (tower) return towerMenu(tower);
  if (!game.tool) return toast("👉 First pick a tower on the right!");
  build(t.c, t.r);
});

window.addEventListener("keydown", (event) => {
  if (!game || currentScreen !== "play") return;
  const types = Object.keys(TOWERS);
  const n = Number(event.key);
  if (n >= 1 && n <= types.length && save.unlocked[types[n - 1]]) game.tool = types[n - 1];
  if (event.key === " ") startWave();
});

// A bouncing hand shows what to do on the very first level
function drawTutorial() {
  if (game.tutorial < 0) return;
  const steps = [
    { x: 1320 + 46, y: 96 + 98 + 44, say: "Tap the Blaster 🔫" },
    { x: tileCenter(3, 3).x, y: tileCenter(3, 3).y, say: "Now tap next to the dots to build it!" },
    { x: tileCenter(8, 5).x, y: tileCenter(8, 5).y, say: "Build another one here!" },
    { x: 1320 + 131, y: 735, say: "Tap GO when you're ready!" },
  ];
  const step = steps[game.tutorial];
  box(W / 2 - 330, 120, 560, 64, "rgba(255,255,255,0.95)", 20);
  ctx.font = "bold 28px system-ui, sans-serif";
  ctx.fillStyle = "#2b2b2b";
  ctx.textAlign = "center";
  ctx.fillText(step.say, W / 2 - 50, 154);
  const bounce = Math.abs(Math.sin(frame * 0.12)) * 18;
  emoji("👆", step.x + 10, step.y + 46 + bounce, 64);
}

// ---------------------------------------------------------------------
//  10. THE LEVEL MAP AND THE SHOP
// ---------------------------------------------------------------------

let currentScreen = "map";

function showScreen(name) {
  currentScreen = name;
  document.body.classList.toggle("playing", name === "play"); // for the "turn sideways" hint
  closePopups();
  $("mapScreen").classList.toggle("hidden", name !== "map");
  if (name === "map") drawMap();
}

function drawMap() {
  $("coins").textContent = `🪙 ${save.coins}`;
  $("badges").textContent = `🔍 ${save.badges}`;
  const box = $("levels");
  box.innerHTML = "";
  MAPS.forEach((map, m) => {
    const section = document.createElement("div");
    section.className = "map-section";
    section.innerHTML = `<h2>${["🌳", "🏜️", "🏔️"][m]} ${map.name}</h2><div class="level-row"></div>`;
    LEVELS.forEach((level, n) => {
      if (level.map !== m) return;
      const unlocked = n === 0 || (save.stars[n - 1] || 0) > 0;
      const stars = save.stars[n] || 0;
      const isNext = unlocked && !stars;
      const b = document.createElement("button");
      b.className = `level ${unlocked ? "" : "locked"} ${isNext ? "next" : ""} ${level.waves.includes("kingblob") ? "boss" : ""}`;
      b.innerHTML = `<div class="num">${unlocked ? n + 1 : "🔒"}</div><div class="lstars">${"⭐".repeat(stars)}${"☆".repeat(3 - stars)}</div>${level.waves.includes("kingblob") ? '<div class="crown">👑</div>' : ""}`;
      b.addEventListener("click", () => (unlocked ? startLevel(n) : toast("Beat the level before first! 💪")));
      section.querySelector(".level-row").appendChild(b);
    });
    box.appendChild(section);
  });
}

function openShop() {
  const card = (icon, name, sub, state, action) => `<button class="card ${state}" data-action="${action}"><div class="big">${icon}</div><div class="name">${name}</div><div class="sub">${sub}</div></button>`;
  let html = `<p>You have <b>${save.coins} 🪙</b>. Win levels to earn more!</p><h3>Towers</h3><div class="grid">`;
  for (const [type, t] of Object.entries(TOWERS)) {
    if (!t.price) continue;
    html += card(t.emoji, t.name, save.unlocked[type] ? "✅ Unlocked" : `${t.price} 🪙`, save.unlocked[type] ? "owned" : "", `tower:${type}`);
  }
  html += `</div><h3>Power-ups</h3><div class="grid">`;
  for (const boost of BOOSTS) {
    const level = save.boosts[boost.id];
    const price = boost.prices[level];
    html += card(boost.emoji, boost.name, price ? `${price} 🪙 (${level}/${boost.prices.length})` : "✅ Maxed!", price ? "" : "owned", `boost:${boost.id}`);
  }
  html += `</div><h3>Your builder</h3><div class="grid">`;
  BUILDERS.forEach((b, i) => {
    const owned = save.ownedBuilders[i];
    html += card(b.emoji, b.name, save.builder === i ? "✅ Wearing" : owned ? "Tap to wear" : `${b.price} 🪙`, save.builder === i ? "chosen" : "", `builder:${i}`);
  });
  html += `</div><h3>Your castle</h3><div class="grid">`;
  CASTLES.forEach((c, i) => {
    const owned = save.ownedCastles[i];
    html += card(c.emoji, c.name, save.castle === i ? "✅ Using" : owned ? "Tap to use" : `${c.price} 🪙`, save.castle === i ? "chosen" : "", `castle:${i}`);
  });
  html += "</div>";
  const popup = showPopup("🛒 Shop", html, [["Close", "grey", drawMap]], true);
  for (const b of popup.querySelectorAll("[data-action]")) b.addEventListener("click", () => shopAction(b.dataset.action));
}

function buy(price) {
  if (save.coins < price) {
    toast(`You need ${price} 🪙. Win more levels!`);
    return false;
  }
  save.coins -= price;
  return true;
}

function shopAction(action) {
  const [kind, id] = action.split(":");
  if (kind === "tower" && !save.unlocked[id]) {
    if (!buy(TOWERS[id].price)) return;
    save.unlocked[id] = true;
    toast(`${TOWERS[id].emoji} ${TOWERS[id].name} unlocked!`);
  }
  if (kind === "boost") {
    const boost = BOOSTS.find((b) => b.id === id);
    const price = boost.prices[save.boosts[id]];
    if (!price || !buy(price)) return;
    save.boosts[id]++;
  }
  if (kind === "builder") {
    const i = Number(id);
    if (!save.ownedBuilders[i] && !buy(BUILDERS[i].price)) return;
    save.ownedBuilders[i] = true;
    save.builder = i;
  }
  if (kind === "castle") {
    const i = Number(id);
    if (!save.ownedCastles[i] && !buy(CASTLES[i].price)) return;
    save.ownedCastles[i] = true;
    save.castle = i;
  }
  saveGame();
  closePopups();
  openShop();
}

// Pop-ups. buttons: a list of [label, colour, what happens when you tap it]
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
      if (onTap) onTap();
    });
    back.querySelector(".buttons").appendChild(b);
  }
  document.body.appendChild(back);
  return back;
}

function closePopups() {
  for (const p of document.querySelectorAll(".popup-back")) p.remove();
}

function toast(t) {
  for (const old of document.querySelectorAll(".toast")) old.remove();
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = t;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

// ---------------------------------------------------------------------
//  11. THE GAME LOOP
//  Steps of 1/60th of a second, so it's the same speed on every tablet.
// ---------------------------------------------------------------------

function update() {
  frame++;
  if (!game || currentScreen !== "play") return;
  const paused = document.querySelector(".popup-back");
  const steps = game.fast ? 2 : 1;
  for (let i = 0; i < steps; i++) {
    if (game.phase === "wave" && !paused) updateWave();
    for (const sp of game.sparks) {
      sp.x += sp.vx;
      sp.y += sp.vy;
      sp.life--;
    }
    game.sparks = game.sparks.filter((sp) => sp.life > 0);
    for (const b of game.beams) b.life--;
    game.beams = game.beams.filter((b) => b.life > 0);
  }
  for (const f of game.floaters) {
    f.y -= 0.8;
    f.life--;
  }
  game.floaters = game.floaters.filter((f) => f.life > 0);
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
  if (currentScreen === "play" && game) drawGame();
  requestAnimationFrame(loop);
}

$("shopButton").addEventListener("click", openShop);
window.addEventListener("resize", resize);
resize();
showScreen("map");
requestAnimationFrame(loop);
