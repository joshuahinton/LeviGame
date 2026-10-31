// =====================================================================
//  BLOCKVILLE  -  The Fashion Show!
//
//  1. You get a theme (like "Royal Ball").
//  2. Get dressed before the timer runs out.
//  3. Walk the runway. Three judges give you stars.
//  4. Beat the other models to win coins!
//
//  Clothes that match the theme score more. So do colours that match:
//  look at the "tags" on clothes and colours in avatar.js.
//
//  👇 Add your own themes and judges here! 👇
// =====================================================================

const THEMES = [
  { name: "Beach Day", emoji: "🏖️", tag: "beach" },
  { name: "Royal Ball", emoji: "👑", tag: "royal" },
  { name: "Space Party", emoji: "🚀", tag: "space" },
  { name: "Sports Day", emoji: "⚽", tag: "sporty" },
  { name: "Spooky Night", emoji: "🎃", tag: "spooky" },
  { name: "Super Cute", emoji: "🎀", tag: "cute" },
  { name: "Disco Party", emoji: "🕺", tag: "party" },
  { name: "Rainbow", emoji: "🌈", tag: "rainbow" },
];

const JUDGES = [["🐱", "Miss Whiskers"], ["🦄", "Sparkle"], ["🤖", "Robo"]];
const MODEL_NAMES = ["Ava", "Mia", "Zoe", "Lily", "Ruby", "Sophie", "Chloe", "Ivy", "Luna", "Isla", "Max", "Leo"];
const DRESS_TIME = 90;              // seconds to get dressed
const PRIZES = [60, 35, 20, 10];    // coins for 1st, 2nd, 3rd and 4th

// =====================================================================
//  Scoring: how well does an outfit match the theme?
//  Gives back a number from 0 (not at all) to 1 (perfect!)
// =====================================================================

function outfitScore(outfit, theme) {
  const tag = theme.tag;
  const top = findItem("top", outfit.top);
  let points = 0;
  for (const [slot, worth] of [["hair", 2], ["top", 4], ["bottom", 3], ["shoes", 2], ["head", 3], ["back", 2]]) {
    // A dress or suit counts for the bottom half too
    const item = slot === "bottom" && top.fullBody ? top : findItem(slot, outfit[slot]);
    if (item.tags.includes(tag)) points += worth;
  }
  const colored = ["hair", "top", "bottom", "shoes", "back"].filter(
    (slot) => !(slot === "bottom" && top.fullBody) && !(slot === "back" && outfit.back === "none") && !(slot === "top" && top.id === "rainbow")
  );
  for (const slot of colored) if (colorOf(outfit, slot).tags.includes(tag)) points += 1;
  if (tag === "rainbow") points += new Set(colored.map((slot) => colorOf(outfit, slot).hex)).size;
  return Math.min(1, points / 21);
}

function judgeStars(score) {
  const base = 1 + 4 * Math.min(1, score / 0.7);
  return JUDGES.map(() => Math.max(1, Math.min(5, Math.round(base + (Math.random() - 0.5) * 1.2))));
}

// The other models choose outfits too. Some try harder than others!
function randomOutfit(theme, effort) {
  const pick = (list, matches) => {
    const good = list.filter(matches);
    const from = good.length && Math.random() < effort ? good : list;
    return from[Math.floor(Math.random() * from.length)];
  };
  const outfit = { skin: Math.floor(Math.random() * SKINS.length) };
  for (const slot of Object.keys(CLOTHES)) outfit[slot] = pick(CLOTHES[slot], (item) => item.tags.includes(theme.tag)).id;
  for (const [slot, key] of Object.entries(COLOR_SLOTS)) {
    const list = slot === "hair" ? HAIR_COLORS : COLORS;
    outfit[key] = list.indexOf(pick(list, (c) => c.tags.includes(theme.tag)));
  }
  return outfit;
}

// =====================================================================
//  Starting a show
// =====================================================================

let show = null;

function startFashionShow() {
  const choices = THEMES.filter((t) => t.name !== save.lastTheme);
  const theme = choices[Math.floor(Math.random() * choices.length)];
  save.lastTheme = theme.name;
  saveGame();
  showPopup(
    "👗 Fashion Show!",
    `<p>This round's theme is...</p>
     <div class="big-emoji pop">${theme.emoji}</div>
     <h3>${theme.name}</h3>
     <p>You have <b>${DRESS_TIME} seconds</b> to get dressed. Pick clothes and colours that match the theme!</p>`,
    [
      ["Let's go! ✨", "pink", () => openDressingRoom(theme)],
      ["Not now", "grey"],
    ]
  );
}

// =====================================================================
//  The dressing room
//  theme = null means you're just changing clothes (no timer)
// =====================================================================

const TABS = [
  ["hair", "💇 Hair"],
  ["top", "👕 Top"],
  ["bottom", "👖 Bottom"],
  ["shoes", "👟 Shoes"],
  ["head", "👑 Head"],
  ["back", "🧚 Back"],
  ["skin", "🙂 Skin"],
];

function owns(slot, item) {
  return item.price === 0 || save.owned[`${slot}:${item.id}`];
}

function openDressingRoom(theme) {
  const draft = { ...save.outfit };
  let tab = "top";
  let timeLeft = DRESS_TIME;
  let timer = null;

  const room = document.createElement("div");
  room.className = "popup-back dressing";
  room.innerHTML = `
    <div class="dress-left">
      <div class="theme-banner">${theme ? `${theme.emoji} ${theme.name}` : "👗 Wardrobe"}</div>
      <div class="timer ${theme ? "" : "hidden"}"><div class="timer-fill"></div><span class="timer-text"></span></div>
      <canvas class="preview"></canvas>
      <div class="coins-line"></div>
      <button class="green done">${theme ? "I'm ready! ✨" : "Done ✅"}</button>
    </div>
    <div class="dress-right">
      <div class="tabs"></div>
      <div class="note"></div>
      <div class="items"></div>
      <div class="colors"></div>
    </div>`;
  document.body.appendChild(room);
  updateHud();

  const preview = room.querySelector(".preview");
  const tabsBox = room.querySelector(".tabs");
  const itemsBox = room.querySelector(".items");
  const colorsBox = room.querySelector(".colors");

  function drawPreview() {
    const box = preview.getBoundingClientRect();
    const scale = window.devicePixelRatio || 1;
    preview.width = box.width * scale;
    preview.height = box.height * scale;
    const p = preview.getContext("2d");
    p.setTransform(scale, 0, 0, scale, 0, 0);
    p.fillStyle = "rgba(255, 255, 255, 0.25)";
    p.beginPath();
    p.ellipse(box.width / 2, box.height * 0.93, box.width * 0.3, 12, 0, 0, Math.PI * 2);
    p.fill();
    drawAvatar(p, box.width / 2, box.height * 0.93, box.height * 0.78, draft, 0, 1);
    room.querySelector(".coins-line").textContent = `🪙 ${save.coins}`;
  }

  function thumbnail(canvas, outfit, slot) {
    const size = 84;
    const scale = window.devicePixelRatio || 1;
    canvas.width = size * scale;
    canvas.height = size * scale;
    const t = canvas.getContext("2d");
    t.setTransform(scale, 0, 0, scale, 0, 0);
    // Zoom in on the part of the body this slot is for
    const focus = { hair: [0, 0.36], head: [-0.08, 0.38], top: [0.18, 0.66], back: [0.1, 0.78], bottom: [0.45, 0.98], shoes: [0.76, 1.02], skin: [0, 0.4] }[slot];
    const h = (size / (focus[1] - focus[0])) * 0.92;
    drawAvatar(t, size / 2, size * 0.04 + h - focus[0] * h, h, outfit, 0, 1);
  }

  function showTabs() {
    tabsBox.innerHTML = "";
    for (const [id, label] of TABS) {
      const b = document.createElement("button");
      b.className = id === tab ? "tab chosen" : "tab";
      b.textContent = label;
      b.addEventListener("click", () => {
        tab = id;
        showAll();
      });
      tabsBox.appendChild(b);
    }
  }

  function showItems() {
    itemsBox.innerHTML = "";
    const top = findItem("top", draft.top);
    room.querySelector(".note").textContent =
      tab === "bottom" && top.fullBody
        ? `Your ${top.name.toLowerCase()} covers your legs, so bottoms won't show.`
        : theme
          ? `✨ = suits ${theme.name}. Matching colours help too!`
          : "";
    if (tab === "skin") return;
    for (const item of CLOTHES[tab]) {
      const b = document.createElement("button");
      const chosen = draft[tab] === item.id;
      const unlocked = owns(tab, item);
      b.className = `item ${chosen ? "chosen" : ""} ${unlocked ? "" : "locked"}`;
      const c = document.createElement("canvas");
      thumbnail(c, { ...draft, [tab]: item.id }, tab);
      b.appendChild(c);
      const label = document.createElement("div");
      // A ✨ means it suits the theme
      const suits = theme && item.tags.includes(theme.tag) ? "✨ " : "";
      label.textContent = suits + (unlocked ? item.name : `🔒 ${item.price}`);
      b.appendChild(label);
      b.addEventListener("click", () => chooseItem(item));
      itemsBox.appendChild(b);
    }
  }

  function chooseItem(item) {
    if (!owns(tab, item)) {
      const slot = tab;
      if (save.coins < item.price) {
        toast(`${item.icon} ${item.name} costs 🪙 ${item.price}. Look after your pet to earn coins!`);
        return;
      }
      showPopup(`${item.icon} ${item.name}`, `<p>Buy this for <b>🪙 ${item.price}</b>?</p>`, [
        ["Buy it!", "green", () => {
          spendCoins(item.price);
          save.owned[`${slot}:${item.id}`] = true;
          saveGame();
          draft[slot] = item.id;
          showAll();
        }],
        ["No thanks", "grey"],
      ]);
      return;
    }
    draft[tab] = item.id;
    showAll();
  }

  function showColors() {
    colorsBox.innerHTML = "";
    let list = null;
    let key = null;
    if (tab === "skin") {
      list = SKINS.map((hex) => ({ hex, name: "" }));
      key = "skin";
    } else if (COLOR_SLOTS[tab]) {
      list = tab === "hair" ? HAIR_COLORS : COLORS;
      key = COLOR_SLOTS[tab];
    }
    if (!list) return;
    list.forEach((color, i) => {
      const b = document.createElement("button");
      b.className = draft[key] === i ? "swatch chosen" : "swatch";
      b.style.background = color.hex;
      b.title = color.name;
      b.addEventListener("click", () => {
        draft[key] = i;
        showAll();
      });
      colorsBox.appendChild(b);
    });
  }

  function showAll() {
    showTabs();
    showItems();
    showColors();
    drawPreview();
  }

  function finish() {
    if (timer) clearInterval(timer);
    room.remove();
    save.outfit = { ...draft };
    saveGame();
    updateHud();
    if (theme) startRunway(theme);
    else toast("Looking great! 😍");
  }

  room.querySelector(".done").addEventListener("click", finish);

  if (theme) {
    const fill = room.querySelector(".timer-fill");
    const text = room.querySelector(".timer-text");
    const tick = () => {
      text.textContent = `⏱️ ${timeLeft}`;
      fill.style.width = `${(timeLeft / DRESS_TIME) * 100}%`;
      fill.classList.toggle("hurry", timeLeft <= 10);
    };
    tick();
    timer = setInterval(() => {
      // Don't count down while a "buy this?" question is showing
      if (document.querySelectorAll(".popup-back").length > 1) return;
      timeLeft--;
      tick();
      if (timeLeft <= 0) finish();
    }, 1000);
  }

  showAll();
}

// =====================================================================
//  The runway!
// =====================================================================

function startRunway(theme) {
  const models = [{ name: SETTINGS.playerName, outfit: { ...save.outfit }, you: true }];
  const names = [...MODEL_NAMES].sort(() => Math.random() - 0.5);
  for (let i = 0; i < 3; i++) models.push({ name: names[i], outfit: randomOutfit(theme, 0.2 + Math.random() * 0.55) });
  for (const m of models) {
    m.stars = judgeStars(outfitScore(m.outfit, theme));
    m.total = m.stars.reduce((a, b) => a + b, 0);
  }
  show = { theme, models, phase: "walk", t: 0, x: -150, flashes: [] };
  goTo("runway");
}

scenes.runway = {
  custom: true,
  controls: false,
  width: 1280,
  update() {
    if (!show) return;
    show.t++;
    const centre = viewW / 2;
    if (show.phase === "walk") {
      show.x += 4.5;
      if (show.x >= centre - 80) {
        show.phase = "pose";
        show.t = 0;
      }
    } else if (show.phase === "pose") {
      if (show.t % 20 === 0) show.flashes.push({ x: Math.random() * viewW, y: 420 + Math.random() * 120, life: 12 });
      if (show.t > 110) {
        show.phase = "judges";
        show.t = 0;
      }
    } else if (show.phase === "judges") {
      if (show.t > 60 * 4) {
        show.phase = "results";
        show.t = 0;
        giveRewards();
      }
    }
    for (const f of show.flashes) f.life--;
    show.flashes = show.flashes.filter((f) => f.life > 0);
  },
  draw(ctx) {
    ctx.save();
    ctx.scale(zoom, zoom);
    if (show.phase === "results") drawResults(ctx);
    else drawRunway(ctx);
    ctx.restore();
  },
};

function drawStage(ctx, title) {
  const bg = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  bg.addColorStop(0, "#2a1048");
  bg.addColorStop(1, "#5b2a86");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, viewW, VIEW_H);
  // Spotlights sweeping around
  for (let i = 0; i < 4; i++) {
    const sx = (viewW / 5) * (i + 1);
    const sway = Math.sin(frame * 0.02 + i * 1.7) * 160;
    ctx.fillStyle = `rgba(255, 240, 200, 0.08)`;
    ctx.beginPath();
    ctx.moveTo(sx - 20, 0);
    ctx.lineTo(sx + 20, 0);
    ctx.lineTo(sx + sway + 140, 620);
    ctx.lineTo(sx + sway - 140, 620);
    ctx.fill();
  }
  // Twinkly lights on the back wall
  for (let i = 0; i < 30; i++) {
    ctx.globalAlpha = 0.4 + 0.4 * Math.sin(frame * 0.1 + i);
    ctx.fillStyle = ["#ff7eb6", "#ffd23c", "#7cc6ff"][i % 3];
    ctx.beginPath();
    ctx.arc((viewW / 30) * (i + 0.5), 40 + (i % 2) * 14, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  outlinedText(ctx, title, viewW / 2, 115, 52, "#ffd23c");
  // The runway
  ctx.fillStyle = "#ff9ccc";
  ctx.beginPath();
  ctx.moveTo(-20, 560);
  ctx.lineTo(viewW + 20, 560);
  ctx.lineTo(viewW + 20, 640);
  ctx.lineTo(-20, 640);
  ctx.fill();
  ctx.fillStyle = "#ffc4e1";
  ctx.fillRect(-20, 560, viewW + 40, 10);
}

function drawRunway(ctx) {
  drawStage(ctx, `${show.theme.emoji} ${show.theme.name}`);
  const you = show.models[0];
  const posing = show.phase !== "walk";
  const bounce = posing ? Math.abs(Math.sin(show.t * 0.08)) * 12 : 0;
  const x = posing ? viewW / 2 - 80 : show.x;
  drawAvatar(ctx, x, 600 - bounce, 300, you.outfit, posing ? 0 : show.x * 0.05, 1);
  outlinedText(ctx, SETTINGS.playerName, x, 600 - 300 - 50 - bounce, 30);
  if (show.phase === "pose") outlinedText(ctx, "✨ Strike a pose! ✨", viewW / 2, 200, 40);

  // Camera flashes
  for (const f of show.flashes) {
    ctx.globalAlpha = f.life / 12;
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(f.x, f.y, 30, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // The judges' table
  const tableX = viewW - 420;
  box(ctx, tableX, 620, 400, 100, "#3a1d5c", 14);
  JUDGES.forEach(([emoji, name], i) => {
    const jx = tableX + 70 + i * 130;
    emojiAt(ctx, emoji, jx, 600, 70);
    outlinedText(ctx, name, jx, 680, 16);
    // Show the score once it's this judge's turn
    if (show.phase === "judges" && show.t > 30 + i * 55) {
      const pop = Math.min(1, (show.t - 30 - i * 55) / 10);
      box(ctx, jx - 52, 480 - 40 * pop, 104, 70, "white", 12);
      outlinedText(ctx, "⭐".repeat(you.stars[i]), jx, 498 - 40 * pop, 16);
      outlinedText(ctx, `${you.stars[i]}`, jx, 528 - 40 * pop, 26, "#e8467c");
    }
  });
}

function giveRewards() {
  const sorted = [...show.models].sort((a, b) => b.total - a.total);
  show.place = sorted.findIndex((m) => m.you);
  show.sorted = sorted;
  show.prize = PRIZES[show.place];
  save.shows++;
  addCoins(show.prize);
  const place = ["1st 🥇", "2nd 🥈", "3rd 🥉", "4th"][show.place];
  const message = show.place === 0 ? "You won the show! 🎉" : show.place === 3 ? "Good try! Match the theme to win." : "So close! Great outfit!";
  setTimeout(() => {
    showPopup(
      `You came ${place}!`,
      `<p>${message}</p><p>You got <b>🪙 ${show.prize}</b></p>`,
      [
        ["👗 Play again", "pink", startFashionShow],
        ["🏠 Lobby", "grey", () => goTo("lobby", 2600)],
      ]
    );
  }, 1500);
}

function drawResults(ctx) {
  drawStage(ctx, "🏆 Results");
  // Podium: 2nd, 1st, 3rd, 4th
  const order = [1, 0, 2, 3];
  const heights = [140, 100, 70, 30];
  const w = Math.min(230, viewW / 4.4);
  order.forEach((place, slot) => {
    const model = show.sorted[place];
    if (!model) return;
    const x = viewW / 2 + (slot - 1.5) * (w + 14);
    const top = 620 - heights[place];
    box(ctx, x - w / 2, top, w, heights[place] + 100, ["#ffd23c", "#d9dde3", "#e3a46b", "#a58cc4"][place], 12);
    outlinedText(ctx, ["1st", "2nd", "3rd", "4th"][place], x, top + 32, 26);
    drawAvatar(ctx, x, top - 4, 210, model.outfit, 0, 1);
    outlinedText(ctx, model.you ? `⭐ ${model.name}` : model.name, x, top - 300, 24, model.you ? "#ffd23c" : "white");
    outlinedText(ctx, `${model.total} ⭐`, x, top - 272, 20);
  });
}
