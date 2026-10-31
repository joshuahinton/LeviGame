// =====================================================================
//  HAPPY HOTEL
//
//  Run the best hotel in the world!
//   - Tap a guest, then tap a free room ✨ to check them in.
//   - Guests ask for things. Tap the thing, then tap their room.
//   - Worried guests 😟 don't say why. ASK them what's wrong!
//   - When guests leave, tap the messy room to clean it.
//   - Bolt the robot 🤖 helps, but check Bolt's work. Robots make mistakes too!
//
//  Happy guests give tips and 💖 hearts. Hearts earn a kindness bonus!
//  Guests, days and the shop are in hotel.js.
//
//  👇 CHANGE THESE to make the game your own! 👇
// =====================================================================

const SETTINGS = {
  hotelName: "Happy Hotel",
  waitPatience: 30,     // seconds a guest will wait at the desk
  needPatience: 35,     // seconds a guest will wait for something they asked for
  roomPrice: 8,         // coins a guest pays for their room
  kindnessBonus: 3,     // coins for every 💖 at the end of the day
  cleanSeconds: 3,      // how long cleaning a room takes
};

// =====================================================================
//  The code is in parts:
//    1. Saving
//    2. Screen and drawing helpers
//    3. Starting a day
//    4. Guests: arriving, staying, asking for things, leaving
//    5. Helping guests (check in, deliver, ask, fix noise, clean)
//    6. Bolt the robot
//    7. The end of the day
//    8. Drawing the hotel
//    9. Tapping, and the helping hand 👆
//   10. The map and the shop
//   11. The game loop
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
  const fresh = { coins: 0, stars: [], owned: {}, outfit: 0, ownedOutfits: { 0: true }, badges: 0, kindness: 0, reached: 1 };
  try {
    const saved = JSON.parse(localStorage.getItem("happyHotelSave") || findOldSave("hotelsave"));
    if (saved) return { ...fresh, ...saved };
  } catch {}
  return fresh;
}

const save = loadSave();

function saveGame() {
  try {
    localStorage.setItem("happyHotelSave", JSON.stringify(save));
  } catch {}
}

function roomCount() {
  return 2 + ["room3", "room4", "room5", "room6"].filter((r) => save.owned[r]).length;
}

function hasSupply(id) {
  const s = SUPPLIES.find((x) => x.id === id);
  return !!(save.owned[id] || (s.freeOnDay && save.reached >= s.freeOnDay));
}

// ---------------------------------------------------------------------
//  2. SCREEN AND DRAWING HELPERS
//  The hotel is always 1600 x 900, scaled to fit the tablet.
// ---------------------------------------------------------------------

const canvas = $("game");
const ctx = canvas.getContext("2d");
const W = 1600;
const H = 900;

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

function box(x, y, w, h, color, round = 16) {
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

function label(t, x, y, size, color = "#3b2350", align = "center") {
  ctx.font = `bold ${size}px system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.fillText(t, x, y);
}

function roomRect(i) {
  const col = i % 3;
  const row = Math.floor(i / 3);
  return { x: 450 + col * 377, y: 100 + row * 282, w: 365, h: 270 };
}

function queueSpot(k) {
  return { x: 225, y: 340 + k * 118 };
}

function supplyRect(k) {
  return { x: 450 + k * 160, y: 680, w: 150, h: 170 };
}

const BOLT_BUTTON = { x: 1270, y: 680, w: 310, h: 170 };

function moodFace(mood) {
  return mood >= 70 ? "😄" : mood >= 40 ? "🙂" : mood >= 20 ? "😟" : "😠";
}

// ---------------------------------------------------------------------
//  3. STARTING A DAY
// ---------------------------------------------------------------------

let day = null;
let frame = 0;

function features(n) {
  // n is the day number, starting at 1
  return { items: n >= 2, feelings: n >= 3, bolt: n >= 4, mistakes: n >= 5, noise: n >= 6 };
}

function startDay(index) {
  const cfg = DAYS[index];
  save.reached = Math.max(save.reached, index + 1);
  saveGame();
  const rooms = [];
  for (let i = 0; i < 6; i++) rooms.push({ state: i < roomCount() ? "clean" : "locked", guest: null, clean: 0, boltSays: false, sock: false });
  day = {
    index,
    n: index + 1,
    cfg,
    hotel: HOTELS[cfg.hotel],
    can: features(index + 1),
    time: cfg.seconds * 60,
    rooms,
    queue: [],
    history: [],
    coins: 0,
    hearts: 0,
    selectedGuest: null,
    selectedSupply: null,
    spawnTimer: 60,
    bolt: { x: BOLT_BUTTON.x + 70, y: BOLT_BUTTON.y + 80, job: null },
    floaters: [],
    sparks: [],
    ended: false,
    started: false,
    lastTap: 0,
    flashSupply: null,
  };
  showScreen("play");
  introPopup();
}

function introPopup() {
  const cfg = day.cfg;
  const lesson = cfg.learn ? `<div class="lesson"><b>New!</b> ${LESSONS[cfg.learn]}</div>` : "";
  showPopup(
    `Day ${day.n} · ${day.hotel.emoji} ${day.hotel.name}`,
    `${lesson}<p>Goal: earn <b>🪙 ${cfg.goal}</b> for ⭐</p><p class="small">Happy guests give tips and 💖 hearts.</p>`,
    [["🛎️ Open the hotel!", "green", () => (day.started = true)]]
  );
}

// ---------------------------------------------------------------------
//  4. GUESTS: ARRIVING, STAYING, ASKING FOR THINGS, LEAVING
// ---------------------------------------------------------------------

function newGuest() {
  const pool = [...GUESTS, ...(SPECIAL_GUESTS[day.hotel.id] || [])].filter((g) => day.can.noise || !g.noisy);
  const def = pool[Math.floor(Math.random() * pool.length)];
  return { def, mood: 100, room: -1, stay: 0, needTimer: 0, need: null, needsDone: 0, walk: null, quiet: false, x: 80, y: 820 };
}

function patienceSlowdown() {
  return (save.owned.plant ? 0.8 : 1) * (save.owned.fish ? 0.75 : 1);
}

function updateGuests() {
  // New guests arrive
  day.spawnTimer--;
  if (day.spawnTimer <= 0 && day.time > 20 * 60) {
    if (day.queue.length < 4) {
      const g = newGuest();
      day.queue.push(g);
      floatText(`${g.def.emoji} ${g.def.name} arrived!`, 225, 300, "#3b2350");
    }
    day.spawnTimer = day.cfg.arrive * 60 * (0.7 + Math.random() * 0.6);
  }

  // Waiting guests get impatient
  for (const g of [...day.queue]) {
    g.mood -= (100 / (SETTINGS.waitPatience * 60)) * patienceSlowdown();
    if (g.mood <= 0) {
      day.queue.splice(day.queue.indexOf(g), 1);
      if (day.selectedGuest === g) day.selectedGuest = null;
      day.hearts--;
      day.history.push("😠");
      floatText(`😠 ${g.def.name} got tired of waiting`, 225, 300, "#c0392b");
    }
  }

  // Guests in rooms
  day.rooms.forEach((room, i) => {
    if (room.state === "cleaning") {
      room.clean += 1 / ((save.owned.mop ? SETTINGS.cleanSeconds / 2 : SETTINGS.cleanSeconds) * 60);
      if (room.clean >= 1) {
        room.state = "clean";
        room.boltSays = room.byBolt;
        room.byBolt = false;
        const r = roomRect(i);
        burst(r.x + r.w / 2, r.y + r.h / 2, "#ffffff", 14);
      }
    }
    const g = room.guest;
    if (room.state !== "occupied" || !g) return;
    if (g.walk) {
      g.walk.t += 1 / 40;
      if (g.walk.t >= 1) g.walk = null;
      return;
    }
    g.stay--;
    if (g.need) {
      g.mood -= 100 / (SETTINGS.needPatience * 60);
      if (g.need.kind === "noise" && !noisyNeighbour(i)) g.need = null; // the noise stopped by itself
    } else {
      g.mood = Math.min(100, g.mood + 0.02);
      g.needTimer--;
      if (g.needTimer <= 0 && g.needsDone < 2) giveNeed(g);
      if (day.can.noise && g.def.sleepy && frame % 60 === 0) {
        const from = noisyNeighbour(i);
        if (from !== null) g.need = { kind: "noise", from };
      }
    }
    if (g.mood <= 0 || g.stay <= 0) checkOut(i);
  });
}

function giveNeed(g) {
  g.needTimer = (5 + Math.random() * 5) * 60;
  if (!day.can.items) return;
  const items = SUPPLIES.filter((s) => s.id !== "earplugs" && hasSupply(s.id)).map((s) => s.id);
  if (!items.length) return;
  const feelings = FEELINGS.filter((f) => hasSupply(f.item));
  if (day.can.feelings && feelings.length && Math.random() < 0.45) {
    g.need = { kind: "feeling", feeling: feelings[Math.floor(Math.random() * feelings.length)], wrong: [] };
  } else {
    g.need = { kind: "item", item: items[Math.floor(Math.random() * items.length)] };
  }
}

// Which room next door has a noisy guest who hasn't been asked to be quiet?
function noisyNeighbour(i) {
  const col = i % 3;
  const near = [i - 3, i + 3];
  if (col > 0) near.push(i - 1);
  if (col < 2) near.push(i + 1);
  for (const j of near) {
    const other = day.rooms[j];
    if (other && other.state === "occupied" && other.guest && other.guest.def.noisy && !other.guest.quiet && !other.guest.walk) return j;
  }
  return null;
}

function checkOut(i, kickedOut = false) {
  const room = day.rooms[i];
  const g = room.guest;
  room.state = "dirty";
  room.guest = null;
  room.boltSays = false;
  const r = roomRect(i);
  if (kickedOut) {
    day.hearts--;
    day.history.push("😠");
    floatText(`😠 ${g.def.name} left`, r.x + r.w / 2, r.y + 60, "#c0392b");
    return;
  }
  const tip = Math.round((g.mood / 100) * 8 * (save.owned.beds ? 1.6 : 1));
  const pay = SETTINGS.roomPrice + tip;
  day.coins += pay;
  let face = "🙂";
  if (g.mood >= 60) {
    face = "😄";
    day.hearts++;
  } else if (g.mood < 30) {
    face = "😠";
    day.hearts--;
  }
  day.history.push(face);
  floatText(`${face} +${pay} 🪙${face === "😄" ? " 💖" : ""}`, r.x + r.w / 2, r.y + 60, "#2e7d32");
  burst(r.x + r.w / 2, r.y + 80, "#ffd23c", 12);
}

// ---------------------------------------------------------------------
//  5. HELPING GUESTS
// ---------------------------------------------------------------------

function checkIn(g, i) {
  const room = day.rooms[i];
  day.queue.splice(day.queue.indexOf(g), 1);
  day.selectedGuest = null;
  const spot = queueSpot(0);
  const r = roomRect(i);
  room.state = "occupied";
  room.guest = g;
  g.room = i;
  g.stay = (18 + Math.random() * 8) * 60;
  g.needTimer = (3 + Math.random() * 4) * 60;
  g.mood = Math.min(100, g.mood + 10);
  g.walk = { fromX: spot.x, fromY: spot.y, toX: r.x + r.w / 2, toY: r.y + r.h / 2, t: 0 };
  if (room.sock) {
    room.sock = false;
    g.mood -= 35;
    floatText("🤢 Yuck! A stinky sock! 🧦", r.x + r.w / 2, r.y + 50, "#c0392b");
  }
  room.boltSays = false;
}

function deliver(i, item, byBolt = false) {
  const g = day.rooms[i].guest;
  const r = roomRect(i);
  const s = SUPPLIES.find((x) => x.id === item);
  if (!g || g.walk) {
    floatText("Nobody's in this room!", r.x + r.w / 2, r.y + 60, "#7a5d00");
    return;
  }
  if (g.need && g.need.kind === "item" && g.need.item === item) {
    g.need = null;
    g.needsDone++;
    g.mood = Math.min(100, g.mood + 30);
    day.coins += 2;
    floatText(`${s.emoji} Thank you! +2 🪙`, r.x + r.w / 2, r.y + 60, "#2e7d32");
    burst(r.x + r.w / 2, r.y + 100, "#ff8fc4", 12);
  } else {
    floatText(`🤔 I didn't ask for ${s.name.toLowerCase()}${byBolt ? ", Bolt!" : ""}`, r.x + r.w / 2, r.y + 60, "#7a5d00");
  }
}

// Ask a worried guest what's wrong
function askPopup(i) {
  const g = day.rooms[i].guest;
  const right = g.need.feeling;
  const others = FEELINGS.filter((f) => f !== right && hasSupply(f.item)).sort(() => Math.random() - 0.5).slice(0, 2);
  const choices = [right, ...others].sort(() => Math.random() - 0.5);
  const cards = choices
    .map((f) => `<button class="ask ${g.need.wrong.includes(f.id) ? "used" : ""}" data-id="${f.id}"><span>${f.icon}</span>${f.ask}</button>`)
    .join("");
  const popup = showPopup(
    `${g.def.emoji} ${g.def.name} looks worried`,
    `<div class="big">${g.def.emoji}😟</div><p>What will you ask?</p><div class="asks">${cards}</div><p class="reply"></p>`,
    [["Not now", "grey"]]
  );
  for (const b of popup.querySelectorAll(".ask")) {
    b.addEventListener("click", () => {
      const f = FEELINGS.find((x) => x.id === b.dataset.id);
      if (f !== right) {
        if (!g.need.wrong.includes(f.id)) g.need.wrong.push(f.id);
        g.mood -= 5;
        b.classList.add("used");
        popup.querySelector(".reply").textContent = `${g.def.name}: "No, that's not it..."`;
        return;
      }
      popup.remove();
      const item = SUPPLIES.find((s) => s.id === right.item);
      const firstTry = g.need.wrong.length === 0;
      g.need = { kind: "item", item: right.item };
      g.mood = Math.min(100, g.mood + 10);
      if (firstTry) {
        day.hearts++;
        const r = roomRect(i);
        floatText("💖 Thanks for asking!", r.x + r.w / 2, r.y + 40, "#e8467c");
      }
      showPopup(`${g.def.emoji} ${g.def.name} says:`, `<p class="speech">"${right.answer} Could I have some ${item.name.toLowerCase()}? ${item.emoji}"</p><p class="small">Tap the ${item.emoji} button, then tap the room!</p>`, [["OK!", "green"]]);
    });
  }
}

// A sleepy guest can't sleep because of a noisy neighbour
function noisePopup(i) {
  const g = day.rooms[i].guest;
  const j = g.need.from;
  const noisy = day.rooms[j].guest;
  const r = roomRect(i);
  const buttons = [
    [`🗣️ Kindly ask ${noisy.def.name} to be quieter`, "green", () => {
      noisy.quiet = true;
      g.need = null;
      g.mood = Math.min(100, g.mood + 25);
      day.hearts++;
      floatText("💖 Kind and fair!", r.x + r.w / 2, r.y + 50, "#e8467c");
    }],
  ];
  if (hasSupply("earplugs")) {
    buttons.push(["🎧 Give earplugs", "blue", () => {
      g.need = null;
      g.mood = Math.min(100, g.mood + 25);
      floatText("🎧 Ahh, peace and quiet!", r.x + r.w / 2, r.y + 50, "#2e7d32");
    }]);
  }
  buttons.push([`😠 Kick ${noisy.def.name} out!`, "red", () => {
    checkOut(j, true);
    g.need = null;
    showPopup("💭 Hmm...", `<p>${noisy.def.name} was just having fun, and didn't know anyone was trying to sleep.</p><p>Kicking guests out isn't very fair. Next time, try <b>asking kindly</b> first!</p>`, [["OK", "grey"]]);
  }]);
  showPopup(
    `${g.def.emoji} ${g.def.name} can't sleep!`,
    `<div class="big">${g.def.emoji}😴 🔊 ${noisy.def.emoji}</div><p><b>${noisy.def.name}</b> in room ${j + 1} is being really noisy.</p><p>What's the <b>fairest</b> way to fix it?</p>`,
    buttons
  );
}

// ---------------------------------------------------------------------
//  6. BOLT THE ROBOT
//  You tell Bolt WHAT to do and WHICH room. Bolt is fast, but not perfect!
// ---------------------------------------------------------------------

function boltPopup() {
  if (day.bolt.job) return toast("🤖 Bolt is busy! Wait a moment.");
  let job = null;
  let room = null;
  const jobs = [{ id: "clean", emoji: "🧹", name: "Clean" }, ...SUPPLIES.filter((s) => s.id !== "earplugs" && hasSupply(s.id))];
  const roomIcon = (rm) => (rm.state === "dirty" ? "🧺" : rm.state === "occupied" ? rm.guest.def.emoji : rm.state === "cleaning" ? "🧽" : "✨");
  const html = `
    <div class="bolt-say">🤖 "What should I do? Tell me <b>what</b> AND <b>which room</b>!"</div>
    <p class="step">1. What job?</p>
    <div class="cards">${jobs.map((j) => `<button class="pick job" data-id="${j.id}"><span>${j.emoji}</span>${j.name}</button>`).join("")}</div>
    <p class="step">2. Which room?</p>
    <div class="cards">${day.rooms
      .map((rm, i) => (rm.state === "locked" ? "" : `<button class="pick room" data-id="${i}"><span>${roomIcon(rm)}</span>Room ${i + 1}</button>`))
      .join("")}</div>`;
  const popup = showPopup("🤖 Tell Bolt what to do", html, [
    ["Go, Bolt! 🤖", "green", null],
    ["Cancel", "grey"],
  ], true);
  for (const b of popup.querySelectorAll(".pick")) {
    b.addEventListener("click", () => {
      const isJob = b.classList.contains("job");
      for (const other of popup.querySelectorAll(isJob ? ".job" : ".room")) other.classList.remove("chosen");
      b.classList.add("chosen");
      if (isJob) job = b.dataset.id;
      else room = Number(b.dataset.id);
    });
  }
  // The "Go" button: check the instructions are clear first
  const go = popup.querySelector(".buttons button");
  const fresh = go.cloneNode(true);
  go.replaceWith(fresh);
  fresh.addEventListener("click", () => {
    if (!job) {
      popup.querySelector(".bolt-say").innerHTML = `🤖 "Beep boop? You didn't say <b>what</b> to do! 🤔"`;
      return;
    }
    let guessed = false;
    if (room === null) {
      const open = day.rooms.map((rm, i) => (rm.state === "locked" ? -1 : i)).filter((i) => i >= 0);
      room = open[Math.floor(Math.random() * open.length)];
      guessed = true;
    }
    popup.remove();
    day.bolt.job = { job, room, guessed, phase: "going", t: 0 };
  });
}

function updateBolt() {
  const b = day.bolt;
  if (!b.job) return;
  const speed = save.owned.fastbolt ? 14 : 7;
  const r = roomRect(b.job.room);
  const target = b.job.phase === "home" ? { x: BOLT_BUTTON.x + 70, y: BOLT_BUTTON.y + 80 } : { x: r.x + r.w - 60, y: r.y + r.h - 70 };
  const dx = target.x - b.x;
  const dy = target.y - b.y;
  const d = Math.hypot(dx, dy);
  if (d > speed) {
    b.x += (dx / d) * speed;
    b.y += (dy / d) * speed;
    return;
  }
  if (b.job.phase === "home") {
    b.job = null;
    return;
  }
  // Arrived! Do the job.
  const i = b.job.room;
  const room = day.rooms[i];
  if (b.job.guessed) floatText(`🤖 You didn't say which room, so I guessed room ${i + 1}!`, r.x + r.w / 2, r.y + 30, "#2b6cb0");
  if (b.job.job === "clean") {
    if (room.state === "dirty") {
      room.state = "cleaning";
      room.clean = 0;
      room.byBolt = true;
      // Sometimes Bolt misses something...
      if (day.can.mistakes && Math.random() < 0.35) room.sock = true;
    } else {
      floatText(`🤖 Room ${i + 1} doesn't need cleaning!`, r.x + r.w / 2, r.y + 60, "#2b6cb0");
    }
  } else {
    deliver(i, b.job.job, true);
  }
  b.job.phase = "home";
}

// Check a room that Bolt says is clean
function checkBoltWork(i) {
  const room = day.rooms[i];
  room.boltSays = false;
  if (room.sock) {
    room.sock = false;
    room.state = "dirty";
    save.badges++;
    day.coins += 2;
    saveGame();
    showPopup("🔍 You found a mistake!", `<div class="big">🧦</div><p>Bolt missed a stinky sock! Good thing you checked before a guest moved in.</p><p class="small">Robots are helpful, but it's smart to check their work. +2 🪙</p>`, [["Clean it up!", "green"]]);
  } else {
    showPopup("🔍 All good!", `<div class="big">✨</div><p>Sparkling clean! Bolt did a great job this time.</p>`, [["OK", "green"]]);
  }
}

// ---------------------------------------------------------------------
//  7. THE END OF THE DAY
// ---------------------------------------------------------------------

function endDay() {
  day.ended = true;
  day.selectedGuest = null;
  day.selectedSupply = null;
  day.rooms.forEach((room, i) => {
    if (room.state === "occupied") checkOut(i);
  });
  if (day.can.bolt && day.history.length) boltReport();
  else results();
}

// Bolt counts the happy guests... but does Bolt count right?
function boltReport() {
  const happy = day.history.filter((f) => f === "😄").length;
  let claim = happy;
  if (Math.random() < 0.5) claim = Math.max(0, happy + (Math.random() < 0.5 ? -1 : 1) * (1 + Math.floor(Math.random() * 2)));
  const right = claim === happy;
  const answer = (sayRight) => () => {
    if (sayRight === right) {
      save.badges++;
      save.coins += 10;
      saveGame();
      toast(`🔍 Well spotted! Bolt was ${right ? "right" : "wrong"}. +10 🪙`);
    } else {
      toast(`🤔 Bolt was actually ${right ? "right" : "wrong"}. There were ${happy} happy faces.`);
    }
    results();
  };
  showPopup(
    "🤖 Bolt's report",
    `<p class="speech">"I counted <b>${claim}</b> happy guests today! 😄"</p>
     <p>Here are all of today's guests. Count the 😄 faces:</p>
     <div class="faces">${day.history.join(" ")}</div>
     <p><b>Is Bolt right?</b></p>`,
    [
      ["✅ Bolt is right", "green", answer(true)],
      ["❌ Bolt is wrong", "red", answer(false)],
    ]
  );
}

function results() {
  const bonus = Math.max(0, day.hearts) * SETTINGS.kindnessBonus;
  const total = day.coins + bonus;
  const goal = day.cfg.goal;
  const stars = total >= goal * 1.7 ? 3 : total >= goal * 1.35 ? 2 : total >= goal ? 1 : 0;
  save.coins += total;
  save.kindness += Math.max(0, day.hearts);
  save.stars[day.index] = Math.max(save.stars[day.index] || 0, stars);
  if (stars > 0) save.reached = Math.max(save.reached, day.n + 1);
  saveGame();
  const next = DAYS[day.index + 1];
  const buttons = [];
  if (stars > 0 && next) buttons.push(["Next day ▶", "green", () => startDay(day.index + 1)]);
  buttons.push(["🔁 Play again", stars > 0 ? "grey" : "green", () => startDay(day.index)]);
  buttons.push(["🗺️ Map", "blue", () => showScreen("map")]);
  showPopup(
    stars > 0 ? `🎉 Day ${day.n} done!` : `Day ${day.n} is over`,
    `<div class="stars">${"⭐".repeat(stars)}${"☆".repeat(3 - stars)}</div>
     <p>Guests paid <b>🪙 ${day.coins}</b></p>
     <p>Kindness bonus: ${Math.max(0, day.hearts)} 💖 × ${SETTINGS.kindnessBonus} = <b>🪙 ${bonus}</b></p>
     <p class="total">Total: 🪙 ${total} <span class="small">(goal 🪙 ${goal})</span></p>
     ${stars === 0 ? "<p>So close! Keep your coins and try again. Tip: be quick to check guests in, and ask worried guests what's wrong.</p>" : ""}
     ${stars > 0 && !next ? "<p>You finished every hotel! You're a superstar manager! 🌟</p>" : ""}`,
    buttons
  );
}

// ---------------------------------------------------------------------
//  8. DRAWING THE HOTEL
// ---------------------------------------------------------------------

function burst(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = 2 + Math.random() * 4;
    day.sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 30, color });
  }
}

function floatText(t, x, y, color) {
  day.floaters.push({ t, x, y, life: 120, color });
}

function drawHotel() {
  const hotel = day.hotel;
  const dark = hotel.id === "space";
  ctx.fillStyle = hotel.wall;
  ctx.fillRect(0, 0, width, height);
  ctx.save();
  ctx.translate(offX, offY);
  ctx.scale(zoom, zoom);
  ctx.fillStyle = hotel.wall;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = hotel.floor;
  ctx.fillRect(0, 660, W, 240);
  hotel.deco.forEach((d, k) => emoji(d, 1300 + k * 70, 40, 34));

  drawTopBar(dark);
  drawLobby();
  for (let i = 0; i < 6; i++) drawRoom(i);
  drawSupplies();
  drawBolt();

  for (const s of day.sparks) {
    ctx.globalAlpha = s.life / 30;
    ctx.fillStyle = s.color;
    ctx.fillRect(s.x - 4, s.y - 4, 8, 8);
  }
  ctx.globalAlpha = 1;
  for (const f of day.floaters) {
    ctx.globalAlpha = Math.min(1, f.life / 30);
    ctx.font = "bold 24px system-ui, sans-serif";
    const w = ctx.measureText(f.t).width + 24;
    box(f.x - w / 2, f.y - 20, w, 40, "rgba(255,255,255,0.9)", 14);
    label(f.t, f.x, f.y, 24, f.color);
  }
  ctx.globalAlpha = 1;
  drawHint();
  ctx.restore();
}

function drawTopBar(dark) {
  const ink = dark ? "white" : "#3b2350";
  label(`Day ${day.n} · ${day.hotel.name}`, 30, 40, 30, ink, "left");
  // The clock
  const left = Math.max(0, day.time / (day.cfg.seconds * 60));
  box(470, 22, 420, 36, "rgba(0,0,0,0.15)", 18);
  box(470, 22, Math.max(36, 420 * left), 36, left < 0.2 ? "#ff8a1e" : "#2ebd6b", 18);
  label(`⏰ ${Math.ceil(day.time / 60)}s`, 680, 41, 22, "white");
  label(`🪙 ${day.coins} / ${day.cfg.goal}`, 930, 40, 28, ink, "left");
  label(`💖 ${day.hearts}`, 1160, 40, 28, ink, "left");
}

function drawLobby() {
  // The front desk, with you (the manager) behind it
  box(40, 92, 370, 200, "rgba(255,255,255,0.4)", 24);
  emoji(OUTFITS[save.outfit].emoji, 225, 150, 86);
  box(60, 190, 330, 80, "#a8744f", 16);
  box(60, 190, 330, 18, "#c48b5f", 10);
  emoji("🛎️", 340, 182, 36);
  label(SETTINGS.hotelName, 225, 240, 22, "white");
  if (save.owned.plant) emoji("🪴", 70, 150, 50);
  if (save.owned.fish) emoji("🐠", 380, 130, 44);
  emoji("🚪", 70, 820, 70);

  // Guests waiting in line
  day.queue.forEach((g, k) => {
    const p = queueSpot(k);
    g.x = p.x;
    g.y = p.y;
    const chosen = day.selectedGuest === g;
    box(p.x - 150, p.y - 52, 300, 104, chosen ? "#ffd23c" : "rgba(255,255,255,0.75)", 22);
    emoji(g.def.emoji, p.x - 95, p.y, 66);
    emoji(moodFace(g.mood), p.x - 50, p.y - 30, 30);
    label(g.def.name, p.x + 40, p.y - 18, 20);
    // patience bar
    box(p.x - 30, p.y + 14, 160, 16, "rgba(0,0,0,0.12)", 8);
    box(p.x - 30, p.y + 14, 160 * Math.max(0, g.mood / 100), 16, g.mood > 40 ? "#2ebd6b" : "#ff8a1e", 8);
  });
  if (day.queue.length === 0 && !day.ended) label("Waiting for guests... 🚶", 225, 400, 22, "#7a6a80");
}

function drawRoom(i) {
  const r = roomRect(i);
  const room = day.rooms[i];
  if (room.state === "locked") {
    box(r.x, r.y, r.w, r.h, "rgba(0,0,0,0.12)", 24);
    emoji("🔒", r.x + r.w / 2, r.y + r.h / 2 - 15, 54);
    label("Buy in the Shop 🛒", r.x + r.w / 2, r.y + r.h / 2 + 45, 20, "#5a4a60");
    return;
  }
  // Glow if this room is where your selected guest or item can go
  const g = room.guest;
  const glowGuest = day.selectedGuest && room.state === "clean";
  const glowItem = day.selectedSupply && g && g.need && g.need.kind === "item" && g.need.item === day.selectedSupply;
  if (glowGuest || glowItem) {
    ctx.globalAlpha = 0.5 + 0.3 * Math.sin(frame * 0.15);
    box(r.x - 8, r.y - 8, r.w + 16, r.h + 16, glowItem ? "#ffd23c" : "#2ebd6b", 30);
    ctx.globalAlpha = 1;
  }
  box(r.x, r.y, r.w, r.h, "#fffaf3", 24);
  box(r.x, r.y + r.h - 70, r.w, 70, "#f0dcc4", 24);
  box(r.x + 14, r.y + 14, 54, 44, "#3b2350", 14);
  label(`${i + 1}`, r.x + 41, r.y + 37, 28, "white");
  emoji("🛏️", r.x + 90, r.y + r.h - 70, 70);

  if (room.state === "clean") {
    if (room.boltSays) {
      label("🤖 Bolt says: clean ✨", r.x + r.w / 2 + 30, r.y + 40, 20, "#2b6cb0");
      emoji("🔍", r.x + r.w / 2 + 60, r.y + 120, 56 + Math.sin(frame * 0.12) * 4);
      label("Tap to check!", r.x + r.w / 2 + 60, r.y + 175, 20, "#2b6cb0");
    } else {
      emoji("✨", r.x + r.w / 2 + 60, r.y + 110, 60);
      label("Free room", r.x + r.w / 2 + 60, r.y + 170, 24, "#2e7d32");
    }
  }
  if (room.state === "dirty") {
    emoji("🧺", r.x + 230, r.y + 120, 56);
    emoji("🧦", r.x + 290, r.y + 170, 36);
    label("Messy! Tap to clean", r.x + r.w / 2 + 30, r.y + 40, 22, "#b05a00");
  }
  if (room.state === "cleaning") {
    emoji("🧽", r.x + 240, r.y + 110 + Math.sin(frame * 0.4) * 8, 56);
    box(r.x + 120, r.y + 180, 220, 20, "rgba(0,0,0,0.1)", 10);
    box(r.x + 120, r.y + 180, 220 * room.clean, 20, "#2ebd6b", 10);
    label("Cleaning...", r.x + 230, r.y + 40, 22, "#2e7d32");
  }
  if (room.state === "occupied" && g) {
    let gx = r.x + 230;
    let gy = r.y + 140;
    if (g.walk) {
      const t = g.walk.t;
      gx = g.walk.fromX + (gx - g.walk.fromX) * t;
      gy = g.walk.fromY + (gy - g.walk.fromY) * t;
    }
    emoji(g.def.emoji, gx, gy, 80);
    if (!g.walk) {
      emoji(moodFace(g.mood), gx + 46, gy - 40, 34);
      label(g.def.name, r.x + r.w / 2 + 40, r.y + 37, 20);
      // how long they're staying
      box(r.x + 120, r.y + r.h - 28, 220, 12, "rgba(0,0,0,0.1)", 6);
      box(r.x + 120, r.y + r.h - 28, 220 * Math.max(0, g.stay / (26 * 60)), 12, "#c9a7f5", 6);
      if (g.need) drawBubble(r.x + 110, r.y + 100, g.need);
    }
  }
}

function drawBubble(x, y, need) {
  const bob = Math.sin(frame * 0.1) * 4;
  box(x - 50, y - 40 + bob, 100, 76, "white", 30);
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.moveTo(x + 20, y + 30 + bob);
  ctx.lineTo(x + 50, y + 55 + bob);
  ctx.lineTo(x + 38, y + 28 + bob);
  ctx.fill();
  if (need.kind === "item") emoji(SUPPLIES.find((s) => s.id === need.item).emoji, x, y + bob - 2, 48);
  if (need.kind === "feeling") emoji("😟❓", x, y + bob - 2, 36);
  if (need.kind === "noise") emoji("😴🔊", x, y + bob - 2, 34);
}

function drawSupplies() {
  if (!day.can.items) {
    label("Guests will start asking for things on Day 2!", 830, 765, 24, "#7a6a80");
  } else {
    SUPPLIES.forEach((s, k) => {
      const b = supplyRect(k);
      const has = hasSupply(s.id);
      const chosen = day.selectedSupply === s.id;
      const flash = day.flashSupply === s.id && frame % 20 < 10;
      box(b.x, b.y + 6, b.w, b.h, "rgba(0,0,0,0.12)", 24);
      box(b.x, b.y, b.w, b.h, chosen || flash ? "#ffd23c" : has ? "white" : "rgba(255,255,255,0.45)", 24);
      emoji(has ? s.emoji : "🔒", b.x + b.w / 2, b.y + 70, 64);
      label(has ? s.name : "Shop", b.x + b.w / 2, b.y + 140, 22, has ? "#3b2350" : "#7a6a80");
    });
  }
  if (day.can.bolt) {
    const b = BOLT_BUTTON;
    box(b.x, b.y + 6, b.w, b.h, "rgba(0,0,0,0.12)", 24);
    box(b.x, b.y, b.w, b.h, day.bolt.job ? "#d7e6f7" : "#bfe0ff", 24);
    label(day.bolt.job ? "Bolt is busy..." : "Tap to give", b.x + 200, b.y + 60, 22, "#2b6cb0");
    label(day.bolt.job ? "" : "Bolt a job!", b.x + 200, b.y + 90, 22, "#2b6cb0");
  }
}

function drawBolt() {
  if (!day.can.bolt) return;
  const bob = Math.sin(frame * 0.15) * 5;
  emoji("🤖", day.bolt.x, day.bolt.y + bob, 80);
}

// ---------------------------------------------------------------------
//  9. TAPPING, AND THE HELPING HAND 👆
// ---------------------------------------------------------------------

function inside(p, b) {
  return p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
}

canvas.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  if (!day || !day.started || day.ended || document.querySelector(".popup-back")) return;
  day.lastTap = frame;
  const p = { x: (event.clientX - offX) / zoom, y: (event.clientY - offY) / zoom };

  // Supply buttons
  if (day.can.items) {
    for (let k = 0; k < SUPPLIES.length; k++) {
      if (!inside(p, supplyRect(k))) continue;
      const s = SUPPLIES[k];
      if (!hasSupply(s.id)) return showPopup(`🔒 ${s.name}`, `<p>Buy ${s.emoji} ${s.name.toLowerCase()} in the 🛒 Shop for 🪙 ${s.price}.</p>`, [["OK", "grey"]]);
      day.selectedSupply = day.selectedSupply === s.id ? null : s.id;
      day.selectedGuest = null;
      return;
    }
  }
  if (day.can.bolt && inside(p, BOLT_BUTTON)) return boltPopup();

  // Guests waiting in line
  for (const g of day.queue) {
    if (Math.abs(p.x - g.x) < 150 && Math.abs(p.y - g.y) < 52) {
      day.selectedGuest = day.selectedGuest === g ? null : g;
      day.selectedSupply = null;
      return;
    }
  }

  // Rooms
  for (let i = 0; i < 6; i++) {
    if (inside(p, roomRect(i))) return tapRoom(i);
  }
});

function tapRoom(i) {
  const room = day.rooms[i];
  const g = room.guest;
  if (room.state === "locked") return toast("Buy more rooms in the 🛒 Shop!");
  if (day.selectedSupply) {
    const item = day.selectedSupply;
    day.selectedSupply = null;
    return deliver(i, item);
  }
  if (day.selectedGuest) {
    if (room.state === "clean") return checkIn(day.selectedGuest, i);
    return toast("That room isn't ready. Pick a free room ✨");
  }
  if (room.state === "clean") {
    if (room.boltSays) return checkBoltWork(i);
    if (day.queue.length) return checkIn(day.queue[0], i);
    return toast("This room is ready for the next guest ✨");
  }
  if (room.state === "dirty") {
    room.state = "cleaning";
    room.clean = 0;
    room.byBolt = false;
    return;
  }
  if (room.state === "occupied" && g && !g.walk) {
    if (!g.need) return toast(`${g.def.name} is happy ${moodFace(g.mood)}`);
    if (g.need.kind === "feeling") return askPopup(i);
    if (g.need.kind === "noise") return noisePopup(i);
    const s = SUPPLIES.find((x) => x.id === g.need.item);
    day.flashSupply = s.id;
    setTimeout(() => (day.flashSupply = null), 1500);
    return toast(`Tap the ${s.emoji} ${s.name} button below, then tap this room!`);
  }
}

// When you stop for a moment, a hand shows you something useful to do
function findHint() {
  const rooms = day.rooms;
  if (day.selectedSupply) {
    const i = rooms.findIndex((rm) => rm.guest && rm.guest.need && rm.guest.need.kind === "item" && rm.guest.need.item === day.selectedSupply);
    if (i >= 0) return { ...center(roomRect(i)), say: "Now tap the room that wants it!" };
  }
  if (day.selectedGuest) {
    const i = rooms.findIndex((rm) => rm.state === "clean");
    if (i >= 0) return { ...center(roomRect(i)), say: "Now tap a free room ✨" };
  }
  const itemRoom = rooms.findIndex((rm) => rm.guest && !rm.guest.walk && rm.guest.need && rm.guest.need.kind === "item");
  if (itemRoom >= 0) {
    const k = SUPPLIES.findIndex((s) => s.id === rooms[itemRoom].guest.need.item);
    return { ...center(supplyRect(k)), say: `Room ${itemRoom + 1} wants ${SUPPLIES[k].emoji}. Tap it, then tap the room!` };
  }
  const talk = rooms.findIndex((rm) => rm.guest && !rm.guest.walk && rm.guest.need && rm.guest.need.kind !== "item");
  if (talk >= 0) return { ...center(roomRect(talk)), say: "Someone needs you! Tap their room." };
  const check = rooms.findIndex((rm) => rm.state === "clean" && rm.boltSays);
  if (check >= 0) return { ...center(roomRect(check)), say: "Check Bolt's work! 🔍" };
  if (day.queue.length && rooms.some((rm) => rm.state === "clean")) return { x: day.queue[0].x - 90, y: day.queue[0].y, say: "Tap a guest, then a free room ✨" };
  const dirty = rooms.findIndex((rm) => rm.state === "dirty");
  if (dirty >= 0) return { ...center(roomRect(dirty)), say: "Tap the messy room to clean it 🧽" };
  return null;
}

function center(r) {
  return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
}

function drawHint() {
  if (!day.started || day.ended) return;
  const idle = frame - day.lastTap;
  if (idle < (day.n <= 3 ? 120 : 400)) return;
  const hint = findHint();
  if (!hint) return;
  ctx.font = "bold 24px system-ui, sans-serif";
  const w = ctx.measureText(hint.say).width + 40;
  box(W / 2 - w / 2 + 180, 62, w, 40, "rgba(59, 35, 80, 0.9)", 20);
  label(hint.say, W / 2 + 180, 83, 24, "white");
  emoji("👆", hint.x + 10, hint.y + 50 + Math.abs(Math.sin(frame * 0.12)) * 18, 64);
}

// ---------------------------------------------------------------------
//  10. THE MAP AND THE SHOP
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
  $("kindness").textContent = `💖 ${save.kindness}`;
  $("manager").textContent = OUTFITS[save.outfit].emoji;
  const list = $("days");
  list.innerHTML = "";
  HOTELS.forEach((hotel, h) => {
    const section = document.createElement("div");
    section.className = "hotel-section";
    section.innerHTML = `<h2>${hotel.emoji} ${hotel.name}</h2><div class="day-row"></div>`;
    DAYS.forEach((d, n) => {
      if (d.hotel !== h) return;
      const unlocked = n === 0 || (save.stars[n - 1] || 0) > 0;
      const stars = save.stars[n] || 0;
      const b = document.createElement("button");
      b.className = `day ${unlocked ? "" : "locked"} ${unlocked && !stars ? "next" : ""}`;
      b.innerHTML = `<div class="num">${unlocked ? `Day ${n + 1}` : "🔒"}</div><div class="dstars">${"⭐".repeat(stars)}${"☆".repeat(3 - stars)}</div>${d.learn ? '<div class="new">NEW</div>' : ""}`;
      b.addEventListener("click", () => (unlocked ? startDay(n) : toast("Get a ⭐ on the day before first!")));
      section.querySelector(".day-row").appendChild(b);
    });
    list.appendChild(section);
  });
}

function openShop() {
  const card = (icon, name, sub, state, action) => `<button class="card ${state}" data-action="${action}"><div class="big-icon">${icon}</div><div class="name">${name}</div><div class="sub">${sub}</div></button>`;
  let html = `<p>You have <b>🪙 ${save.coins}</b>. Spend it now, or save up for something big?</p><h3>Your hotel</h3><div class="grid">`;
  for (const item of SHOP) {
    const owned = save.owned[item.id];
    const blocked = item.needs && !save.owned[item.needs];
    const sub = owned ? "✅ Got it!" : blocked ? "🔒 Buy the room before first" : `🪙 ${item.price}`;
    html += card(item.emoji, item.name, `${item.info}<br><b>${sub}</b>`, owned ? "owned" : "", `item:${item.id}`);
  }
  html += `</div><h3>Your outfit</h3><div class="grid">`;
  OUTFITS.forEach((o, i) => {
    const owned = save.ownedOutfits[i];
    html += card(o.emoji, o.name, save.outfit === i ? "<b>✅ Wearing</b>" : owned ? "Tap to wear" : `<b>🪙 ${o.price}</b>`, save.outfit === i ? "chosen" : "", `outfit:${i}`);
  });
  html += "</div>";
  const popup = showPopup("🛒 Hotel Shop", html, [["Close", "grey", drawMap]], true);
  for (const b of popup.querySelectorAll("[data-action]")) b.addEventListener("click", () => shopAction(b.dataset.action));
}

function shopAction(action) {
  const [kind, id] = action.split(":");
  if (kind === "item") {
    const item = SHOP.find((s) => s.id === id);
    if (save.owned[id]) return;
    if (item.needs && !save.owned[item.needs]) return toast("Buy the room before it first!");
    if (save.coins < item.price) return toast(`You need 🪙 ${item.price}. Play more days to earn coins!`);
    save.coins -= item.price;
    save.owned[id] = true;
    toast(`${item.emoji} ${item.name}: yours!`);
  }
  if (kind === "outfit") {
    const i = Number(id);
    if (!save.ownedOutfits[i]) {
      if (save.coins < OUTFITS[i].price) return toast(`You need 🪙 ${OUTFITS[i].price}.`);
      save.coins -= OUTFITS[i].price;
      save.ownedOutfits[i] = true;
    }
    save.outfit = i;
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
  for (const [text, color, onTap] of buttons) {
    const b = document.createElement("button");
    b.className = color;
    b.textContent = text;
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
//  The hotel pauses while a pop-up is showing.
// ---------------------------------------------------------------------

function update() {
  frame++;
  if (!day || currentScreen !== "play") return;
  const paused = document.querySelector(".popup-back");
  if (!paused && day.started && !day.ended) {
    day.time--;
    updateGuests();
    updateBolt();
    if (day.time <= 0) endDay();
  }
  if (paused) day.lastTap = frame; // the helping hand waits while a pop-up is open
  for (const s of day.sparks) {
    s.x += s.vx;
    s.y += s.vy;
    s.life--;
  }
  day.sparks = day.sparks.filter((s) => s.life > 0);
  for (const f of day.floaters) {
    f.y -= 0.5;
    f.life--;
  }
  day.floaters = day.floaters.filter((f) => f.life > 0);
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
  if (currentScreen === "play" && day) drawHotel();
  requestAnimationFrame(loop);
}

$("shopButton").addEventListener("click", openShop);
window.addEventListener("resize", resize);
resize();
showScreen("map");
requestAnimationFrame(loop);
