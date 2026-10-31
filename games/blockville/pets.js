// =====================================================================
//  BLOCKVILLE  -  Pets!
//
//  Buy an egg, hatch it, and look after your pet.
//  When your pet wants something, a bubble pops up. Take it to the
//  right spot in Pet Town (food, water, ball, bed or bath) to help.
//  Happy pets earn you coins and grow up: Baby → Junior → Big → Super!
//
//  👇 Add your own pets and eggs here! 👇
// =====================================================================

const PET_KINDS = {
  common: [["🐶", "Puppy"], ["🐱", "Kitty"], ["🐰", "Bunny"], ["🐹", "Hamster"], ["🐥", "Chick"], ["🐷", "Piglet"]],
  uncommon: [["🦊", "Fox"], ["🐼", "Panda"], ["🐨", "Koala"], ["🐧", "Penguin"], ["🐸", "Frog"], ["🦉", "Owl"]],
  rare: [["🦄", "Unicorn"], ["🦩", "Flamingo"], ["🐬", "Dolphin"], ["🐯", "Tiger"], ["🦥", "Sloth"], ["🐙", "Octopus"]],
  legendary: [["🐉", "Dragon"], ["🦖", "T-Rex"], ["🦚", "Peacock"], ["🦣", "Mammoth"]],
};

const RARITY = {
  common: { name: "Common", color: "#8a8f98" },
  uncommon: { name: "Uncommon", color: "#2ebd6b" },
  rare: { name: "Rare", color: "#3d8bff" },
  legendary: { name: "Legendary", color: "#e0a400" },
};

// odds: out of 100, how likely each kind of pet is
const EGGS = [
  { id: "basic", name: "Basic Egg", price: 50, look: "none", odds: { common: 70, uncommon: 25, rare: 4.5, legendary: 0.5 } },
  { id: "shiny", name: "Shiny Egg", price: 150, look: "hue-rotate(170deg) saturate(2.5)", odds: { common: 25, uncommon: 40, rare: 27, legendary: 8 } },
  { id: "golden", name: "Golden Egg", price: 400, look: "sepia(1) saturate(5) brightness(1.1)", odds: { common: 0, uncommon: 20, rare: 50, legendary: 30 } },
];

const PET_NAMES = ["Mochi", "Biscuit", "Pickle", "Sprinkles", "Coco", "Peanut", "Waffles", "Bubbles", "Luna", "Ziggy", "Muffin", "Pudding", "Noodle", "Cupcake", "Pebbles", "Sunny"];

const AGES = [
  { name: "Baby", needs: 0, size: 44 },
  { name: "Junior", needs: 3, size: 56 },
  { name: "Big", needs: 8, size: 68 },
  { name: "Super ✨", needs: 15, size: 78 },
];

// Things pets ask for, and where in Pet Town you do them
const NEEDS = [
  { id: "hungry", icon: "🍖", verb: "Feed", station: "food" },
  { id: "thirsty", icon: "💧", verb: "Give water", station: "water" },
  { id: "play", icon: "⚽", verb: "Play", station: "ball" },
  { id: "sleepy", icon: "💤", verb: "Nap", station: "bed" },
  { id: "dirty", icon: "🧼", verb: "Bath", station: "bath" },
];

const PET_REWARD = 8; // coins for each thing you do for your pet

// =====================================================================

function escapeText(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function myPet() {
  return save.pets[save.equipped] || null;
}

function petAge(pet) {
  let age = AGES[0];
  for (const a of AGES) if (pet.growth >= a.needs) age = a;
  return age;
}

// ---- The pet that follows you around ----

let petFollower = null;
let petNeed = null;
let petNeedTimer = 60 * 6;
let petBusy = 0; // counts down while your pet is eating, playing...

function updatePet() {
  const pet = myPet();
  if (!pet) {
    petFollower = null;
    return;
  }
  if (!petFollower) petFollower = { x: player.x - 80, y: player.y, hop: 0 };

  // Follow behind you
  const targetX = player.x - player.facing * 85;
  const dx = targetX - petFollower.x;
  petFollower.x += Math.max(-9, Math.min(9, dx * 0.12));
  petFollower.y += (player.y - petFollower.y) * 0.15;
  petFollower.hop = Math.abs(dx) > 4 || petBusy > 0 ? petFollower.hop + 0.25 : 0;

  // Every so often, your pet wants something
  if (petBusy > 0) {
    petBusy--;
    if (frame % 12 === 0) floatText("💖", petFollower.x + (Math.random() - 0.5) * 40, petFollower.y - 70, "white");
    if (petBusy === 0) finishNeed(pet);
  } else if (!petNeed) {
    petNeedTimer--;
    if (petNeedTimer <= 0) {
      const choices = NEEDS.filter((n) => n.id !== pet.lastNeed);
      petNeed = choices[Math.floor(Math.random() * choices.length)];
      pet.lastNeed = petNeed.id;
    }
  }
}

function finishNeed(pet) {
  const oldAge = petAge(pet);
  pet.growth = (pet.growth || 0) + 1;
  petNeed = null;
  petNeedTimer = 60 * (8 + Math.random() * 10);
  addCoins(PET_REWARD, petFollower.x, petFollower.y - 90);
  const newAge = petAge(pet);
  if (newAge !== oldAge) {
    burst(petFollower.x, petFollower.y - 40, "#ffd23c", 30);
    showPopup("🎉 Your pet grew up!", `<div class="big-emoji pop">${pet.emoji}</div><p><b>${escapeText(pet.name)}</b> is now <b>${newAge.name}</b>!</p>`, [["Yay!", "pink"]]);
  }
  saveGame();
}

function drawPet(ctx) {
  const pet = myPet();
  if (!pet || !petFollower) return;
  const age = petAge(pet);
  const hop = Math.abs(Math.sin(petFollower.hop)) * 14;
  const x = petFollower.x;
  const y = petFollower.y - age.size * 0.45 - hop;

  // Super pets glow!
  if (age === AGES[3]) {
    ctx.globalAlpha = 0.35 + 0.15 * Math.sin(frame * 0.1);
    ctx.fillStyle = "#ffe066";
    ctx.beginPath();
    ctx.arc(x, y, age.size * 0.75, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
  ctx.beginPath();
  ctx.ellipse(x, petFollower.y, age.size * 0.4, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  emojiAt(ctx, pet.emoji, x, y, age.size);
  outlinedText(ctx, pet.name, x, y - age.size * 0.75, 18);

  // The thought bubble
  if (petNeed && petBusy === 0) {
    const by = y - age.size * 0.75 - 50 + Math.sin(frame * 0.1) * 4;
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(x, by, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x - 12, by + 34, 7, 0, Math.PI * 2);
    ctx.fill();
    emojiAt(ctx, petNeed.icon, x, by + 2, 32);
  }
}

// ---- Pet Town ----

function makeStation(id, x, icon, name) {
  return {
    x,
    label: `${icon} ${name}`,
    onAction() {
      const pet = myPet();
      if (!pet) {
        showPopup("🥚 No pet yet!", "<p>Go to the <b>Egg Shop</b> and hatch your first pet. It's free!</p>", [["OK", "pink"]]);
        return;
      }
      if (petBusy > 0) return;
      if (!petNeed || petNeed.station !== id) {
        toast(petNeed ? `${pet.name} wants ${petNeed.icon} right now!` : `${pet.name} is happy right now 😊`);
        return;
      }
      petBusy = 60 * 2;
      burst(x, GROUND - 60, "#ff7eb6", 16);
    },
    draw(ctx) {
      // a little stand with a sign
      box(ctx, x - 60, GROUND - 26, 120, 26, "#f2e3c9", 8);
      emojiAt(ctx, icon, x, GROUND - 70, 70);
      drawSign(ctx, x, GROUND - 260, name);
      // glow when your pet needs this
      if (petNeed && petNeed.station === id && petBusy === 0) {
        ctx.globalAlpha = 0.4 + 0.3 * Math.sin(frame * 0.15);
        ctx.strokeStyle = "#ffd23c";
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(x, GROUND - 70, 60, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    },
  };
}

scenes.petTown = {
  name: "Pet Town",
  width: 2500,
  sky: ["#ffc7e4", "#fff1f8"],
  hills: "#b8e6a8",
  grass: "#79cc6a",
  dirt: "#b88a5c",
  platforms: [
    { x: 700, y: 450, w: 160, color: "#ffb3d9" },
    { x: 2120, y: 440, w: 160, color: "#a7d8ff" },
  ],
  decor: [["🌸", 330, 50], ["🌳", 760, 150], ["🌷", 1330, 50], ["🌳", 2150, 150], ["🌼", 2380, 50]],
  interactables: [
    makePortal(150, "Lobby", "🏠", ["#c4f0c2", "#5cc461"], () => goTo("lobby", 820)),
    {
      x: 500,
      label: "🥚 Egg Shop",
      onAction: showEggShop,
      draw(ctx) {
        box(ctx, 500 - 110, GROUND - 210, 220, 210, "#fff3d6", 14);
        ctx.fillStyle = "#ff7eb6";
        ctx.beginPath();
        ctx.moveTo(500 - 130, GROUND - 205);
        ctx.lineTo(500, GROUND - 290);
        ctx.lineTo(500 + 130, GROUND - 205);
        ctx.fill();
        box(ctx, 500 - 32, GROUND - 110, 64, 110, "#b07a4f", 10);
        emojiAt(ctx, "🥚", 500 - 70, GROUND - 150, 44);
        emojiAt(ctx, "🥚", 500 + 70, GROUND - 150, 44);
        drawSign(ctx, 500, GROUND - 330, "🥚 Egg Shop");
      },
    },
    makeStation("food", 1000, "🍖", "Food"),
    makeStation("water", 1250, "🚰", "Water"),
    makeStation("ball", 1500, "⚽", "Play"),
    makeStation("bed", 1750, "🛏️", "Bed"),
    makeStation("bath", 2000, "🛁", "Bath"),
  ],
  onEnter() {
    if (!myPet() && save.pets.length === 0) {
      setTimeout(() => showPopup("🐾 Welcome to Pet Town!", "<p>Go to the <b>Egg Shop</b> to hatch your first pet. Your first egg is <b>free</b>!</p>", [["OK", "pink"]]), 300);
    }
  },
};

// ---- The Egg Shop ----

function eggPrice(egg) {
  return egg.id === "basic" && save.freeEgg ? 0 : egg.price;
}

function showEggShop() {
  const cards = EGGS.map(
    (egg, i) => `
      <div class="card egg-card" data-egg="${i}">
        <div class="big-emoji" style="filter: ${egg.look}">🥚</div>
        <div class="name">${egg.name}</div>
        <div class="small">${oddsText(egg)}</div>
        <div class="price">${eggPrice(egg) === 0 ? "FREE!" : `🪙 ${egg.price}`}</div>
      </div>`
  ).join("");
  const popup = showPopup("🥚 Egg Shop", `<p>You have 🪙 ${save.coins}</p><div class="grid">${cards}</div>`, [["Close", "grey"]], true);
  for (const card of popup.querySelectorAll(".egg-card")) {
    card.addEventListener("click", () => buyEgg(EGGS[Number(card.dataset.egg)]));
  }
}

function oddsText(egg) {
  return Object.entries(egg.odds)
    .filter(([, chance]) => chance > 0)
    .map(([rarity, chance]) => `<span style="color:${RARITY[rarity].color}">${RARITY[rarity].name} ${chance}%</span>`)
    .join("<br>");
}

function buyEgg(egg) {
  const price = eggPrice(egg);
  if (!spendCoins(price)) {
    toast(`You need 🪙 ${price}. Look after your pet or do a fashion show to earn more!`);
    return;
  }
  if (egg.id === "basic") save.freeEgg = false;
  closePopups();
  hatch(egg);
}

function pickRarity(odds) {
  let roll = Math.random() * 100;
  for (const [rarity, chance] of Object.entries(odds)) {
    roll -= chance;
    if (roll < 0) return rarity;
  }
  return "common";
}

function hatch(egg) {
  const rarity = pickRarity(egg.odds);
  const kinds = PET_KINDS[rarity];
  const [emoji, kind] = kinds[Math.floor(Math.random() * kinds.length)];
  const pet = { emoji, kind, rarity, name: PET_NAMES[Math.floor(Math.random() * PET_NAMES.length)], growth: 0 };

  // Wobble, wobble... CRACK!
  const wobble = showPopup("Hatching...", `<div class="big-emoji wobble" style="filter: ${egg.look}">🥚</div>`, []);
  setTimeout(() => {
    wobble.remove();
    save.pets.push(pet);
    if (save.equipped < 0) {
      save.equipped = save.pets.length - 1;
      startNewPet();
    }
    saveGame();
    const r = RARITY[rarity];
    showPopup(
      `It's a ${kind}!`,
      `<div class="big-emoji pop">${emoji}</div>
       <p class="rarity" style="background:${r.color}">${r.name}</p>
       <p>Say hello to <b>${escapeText(pet.name)}</b>!</p>`,
      [
        ["🐾 Follow me!", "pink", () => equipPet(save.pets.length - 1)],
        ["OK", "grey"],
      ]
    );
  }, 2200);
}

function startNewPet() {
  petFollower = null;
  petNeed = null;
  petBusy = 0;
  petNeedTimer = 60 * 4;
}

function equipPet(index) {
  save.equipped = index;
  saveGame();
  startNewPet();
  toast(`${save.pets[index].emoji} ${save.pets[index].name} is following you!`);
}

// ---- My Pets ----

function showPetsPanel() {
  if (save.pets.length === 0) {
    showPopup("🐾 My Pets", "<p>No pets yet! Go through the <b>🐾 Pet Town</b> portal and hatch an egg. The first one is free!</p>", [["OK", "pink"]]);
    return;
  }
  const cards = save.pets
    .map((pet, i) => {
      const r = RARITY[pet.rarity];
      const age = petAge(pet);
      const next = AGES[AGES.indexOf(age) + 1];
      const following = i === save.equipped;
      return `
        <div class="card pet-card ${following ? "chosen" : ""}" data-pet="${i}">
          <div class="big-emoji">${pet.emoji}</div>
          <div class="name">${escapeText(pet.name)}</div>
          <div class="small"><span style="color:${r.color}">${r.name}</span> · ${age.name}</div>
          <div class="bar"><div style="width:${next ? Math.round(((pet.growth - age.needs) / (next.needs - age.needs)) * 100) : 100}%"></div></div>
          <div class="small">${following ? "✅ Following you" : "Tap to choose"}</div>
        </div>`;
    })
    .join("");
  const popup = showPopup("🐾 My Pets", `<div class="grid">${cards}</div>`, [["✏️ Rename", "orange", renamePet], ["Close", "grey"]], true);
  for (const card of popup.querySelectorAll(".pet-card")) {
    card.addEventListener("click", () => {
      equipPet(Number(card.dataset.pet));
      closePopups();
      showPetsPanel();
    });
  }
}

function renamePet() {
  const pet = myPet();
  if (!pet) return;
  const name = prompt(`New name for ${pet.name}:`, pet.name);
  if (name && name.trim()) {
    pet.name = name.trim().slice(0, 14);
    saveGame();
    toast(`${pet.emoji} Hello, ${pet.name}!`);
  }
}
