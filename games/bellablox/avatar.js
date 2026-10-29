// =====================================================================
//  BELLABLOX  -  your character and all the clothes
//
//  Every piece of clothing has:
//    name:  what it's called
//    icon:  the emoji on its button
//    price: coins to unlock it (0 = free)
//    tags:  which fashion show themes it's good for
//
//  Theme tags: beach, royal, space, sporty, spooky, cute, party, rainbow
//  👇 Add your own clothes or colours here! 👇
// =====================================================================

const COLORS = [
  { name: "Pink", hex: "#ff7eb6", tags: ["cute", "party"] },
  { name: "Red", hex: "#e8463c", tags: ["sporty", "royal"] },
  { name: "Orange", hex: "#ff8a1e", tags: ["spooky", "beach"] },
  { name: "Yellow", hex: "#ffd23c", tags: ["beach"] },
  { name: "Gold", hex: "#d9a826", tags: ["royal", "party"] },
  { name: "Green", hex: "#2ebd6b", tags: ["sporty", "spooky"] },
  { name: "Aqua", hex: "#2ec4c4", tags: ["beach", "cute"] },
  { name: "Blue", hex: "#3d8bff", tags: ["sporty", "space"] },
  { name: "Navy", hex: "#283a7a", tags: ["space", "royal"] },
  { name: "Purple", hex: "#9b51e0", tags: ["spooky", "royal", "party"] },
  { name: "Lilac", hex: "#c9a7f5", tags: ["cute"] },
  { name: "Black", hex: "#2b2b2b", tags: ["spooky"] },
  { name: "White", hex: "#f4f4f4", tags: ["space", "royal"] },
  { name: "Silver", hex: "#aeb8c4", tags: ["space", "party"] },
];

const HAIR_COLORS = [
  { name: "Brown", hex: "#6b4226", tags: [] },
  { name: "Dark", hex: "#2a1d17", tags: ["spooky"] },
  { name: "Blonde", hex: "#f2cf6b", tags: ["beach", "royal"] },
  { name: "Ginger", hex: "#d4652a", tags: ["beach"] },
  { name: "Pink", hex: "#ff8fc4", tags: ["cute", "party"] },
  { name: "Blue", hex: "#5aa9ff", tags: ["space", "party"] },
  { name: "Purple", hex: "#a36bf0", tags: ["spooky", "party"] },
  { name: "White", hex: "#eeeeee", tags: ["space", "royal"] },
];

const SKINS = ["#ffdbc4", "#f1c27d", "#e0a273", "#b97a4f", "#7d4a2b"];

const CLOTHES = {
  hair: [
    { id: "long", name: "Long", icon: "💁", price: 0, tags: ["royal", "cute"] },
    { id: "short", name: "Short", icon: "💇", price: 0, tags: ["sporty"] },
    { id: "ponytail", name: "Ponytail", icon: "🎀", price: 0, tags: ["sporty", "cute"] },
    { id: "pigtails", name: "Pigtails", icon: "👧", price: 0, tags: ["cute", "rainbow"] },
    { id: "bun", name: "Bun", icon: "🍩", price: 20, tags: ["royal", "party"] },
    { id: "curly", name: "Curly", icon: "🌀", price: 20, tags: ["beach", "party"] },
    { id: "bald", name: "No hair", icon: "🥚", price: 0, tags: ["space"] },
  ],
  top: [
    { id: "tee", name: "T-shirt", icon: "👕", price: 0, tags: ["sporty", "beach"] },
    { id: "hoodie", name: "Hoodie", icon: "🧥", price: 0, tags: ["sporty"] },
    { id: "stripes", name: "Stripy top", icon: "🦓", price: 0, tags: ["sporty", "beach"] },
    { id: "dress", name: "Dress", icon: "👗", price: 0, tags: ["cute", "party"], fullBody: true },
    { id: "swimsuit", name: "Swimsuit", icon: "🩱", price: 0, tags: ["beach"], fullBody: true },
    { id: "sparkly", name: "Sparkly top", icon: "✨", price: 30, tags: ["party", "cute"] },
    { id: "rainbow", name: "Rainbow top", icon: "🌈", price: 30, tags: ["rainbow", "party"] },
    { id: "gown", name: "Ball gown", icon: "👸", price: 60, tags: ["royal", "party"], fullBody: true },
    { id: "spacesuit", name: "Space suit", icon: "🧑‍🚀", price: 60, tags: ["space"], fullBody: true },
    { id: "robe", name: "Witch robe", icon: "🧙", price: 50, tags: ["spooky"], fullBody: true },
  ],
  bottom: [
    { id: "jeans", name: "Jeans", icon: "👖", price: 0, tags: ["sporty"] },
    { id: "shorts", name: "Shorts", icon: "🩳", price: 0, tags: ["beach", "sporty"] },
    { id: "skirt", name: "Skirt", icon: "💃", price: 0, tags: ["cute", "party", "rainbow"] },
    { id: "leggings", name: "Leggings", icon: "🧘", price: 0, tags: ["sporty", "space"] },
    { id: "stripy", name: "Stripy tights", icon: "🧦", price: 20, tags: ["spooky", "cute", "rainbow"] },
  ],
  shoes: [
    { id: "sneakers", name: "Sneakers", icon: "👟", price: 0, tags: ["sporty", "rainbow"] },
    { id: "sandals", name: "Sandals", icon: "🩴", price: 0, tags: ["beach"] },
    { id: "boots", name: "Boots", icon: "👢", price: 20, tags: ["spooky", "space"] },
    { id: "heels", name: "Heels", icon: "👠", price: 30, tags: ["royal", "party"] },
    { id: "barefoot", name: "Bare feet", icon: "🦶", price: 0, tags: ["beach"] },
  ],
  head: [
    { id: "none", name: "Nothing", icon: "❌", price: 0, tags: [] },
    { id: "bow", name: "Bow", icon: "🎀", price: 0, tags: ["cute", "rainbow"] },
    { id: "flower", name: "Flower", icon: "🌺", price: 0, tags: ["beach", "cute"] },
    { id: "cap", name: "Cap", icon: "🧢", price: 0, tags: ["sporty"] },
    { id: "sunglasses", name: "Sunglasses", icon: "🕶️", price: 20, tags: ["beach", "party"] },
    { id: "headphones", name: "Headphones", icon: "🎧", price: 20, tags: ["sporty", "party"] },
    { id: "crown", name: "Crown", icon: "👑", price: 50, tags: ["royal"] },
    { id: "tophat", name: "Top hat", icon: "🎩", price: 30, tags: ["spooky", "royal"] },
    { id: "witchhat", name: "Witch hat", icon: "🧙", price: 40, tags: ["spooky"] },
    { id: "helmet", name: "Space helmet", icon: "🪐", price: 50, tags: ["space"] },
  ],
  back: [
    { id: "none", name: "Nothing", icon: "❌", price: 0, tags: [] },
    { id: "cape", name: "Cape", icon: "🦸", price: 40, tags: ["royal", "spooky"] },
    { id: "wings", name: "Fairy wings", icon: "🧚", price: 60, tags: ["cute", "party", "rainbow"] },
    { id: "backpack", name: "Backpack", icon: "🎒", price: 20, tags: ["sporty", "space"] },
  ],
};

// Which outfit parts can change colour, and which colour list they use
const COLOR_SLOTS = { hair: "hairColor", top: "topColor", bottom: "bottomColor", shoes: "shoesColor", back: "backColor" };

const STARTING_OUTFIT = {
  skin: 0,
  hair: "long", hairColor: 0,
  top: "tee", topColor: 0,
  bottom: "skirt", bottomColor: 10,
  shoes: "sneakers", shoesColor: 12,
  head: "bow", back: "none", backColor: 9,
};

function findItem(slot, id) {
  return CLOTHES[slot].find((item) => item.id === id) || CLOTHES[slot][0];
}

function colorOf(outfit, slot) {
  const list = slot === "hair" ? HAIR_COLORS : COLORS;
  return list[outfit[COLOR_SLOTS[slot]]] || list[0];
}

// =====================================================================
//  DRAWING YOUR CHARACTER
//  (x, y) is where your feet touch the ground. h is how tall you are.
//  walk makes the legs and arms swing. facing is 1 (right) or -1 (left).
// =====================================================================

function shadeColor(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c) => Math.max(0, Math.min(255, Math.round(amount < 0 ? c * (1 + amount) : c + (255 - c) * amount)));
  return `rgb(${mix(n >> 16)}, ${mix((n >> 8) & 255)}, ${mix(n & 255)})`;
}

function box(ctx, x, y, w, h, color, round = 0) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, round);
  ctx.fill();
}

function emojiAt(ctx, emoji, x, y, size) {
  ctx.font = `${size}px system-ui, "Apple Color Emoji", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "white";
  ctx.fillText(emoji, x, y);
}

function drawAvatar(ctx, x, y, h, outfit, walk = 0, facing = 1) {
  const u = h / 8;
  const skin = SKINS[outfit.skin] || SKINS[0];
  const top = findItem("top", outfit.top);
  const bottom = findItem("bottom", outfit.bottom);
  const shoes = findItem("shoes", outfit.shoes);
  const topColor = colorOf(outfit, "top").hex;
  const bottomColor = colorOf(outfit, "bottom").hex;
  const shoeColor = colorOf(outfit, "shoes").hex;
  const hairColor = colorOf(outfit, "hair").hex;
  const backColor = colorOf(outfit, "back").hex;

  const legH = 3 * u;
  const torsoH = 2.6 * u;
  const torsoW = 2.2 * u;
  const legW = 0.95 * u;
  const armW = 0.7 * u;
  const head = 2.1 * u;
  const hipY = y - legH;
  const shoulderY = hipY - torsoH;
  const headY = shoulderY - head - 0.05 * u;
  const swing = Math.sin(walk);
  const lift = [Math.max(0, swing) * 0.5 * u, Math.max(0, -swing) * 0.5 * u];
  const legX = [x - legW - 0.08 * u, x + 0.08 * u];

  // ---- Things behind you: cape, wings, backpack, long hair ----
  const back = outfit.back;
  if (back === "cape") {
    ctx.fillStyle = shadeColor(backColor, -0.15);
    ctx.beginPath();
    ctx.moveTo(x - torsoW * 0.55, shoulderY + 0.2 * u);
    ctx.lineTo(x + torsoW * 0.55, shoulderY + 0.2 * u);
    ctx.lineTo(x + torsoW * 0.95, y - 1.2 * u);
    ctx.lineTo(x - torsoW * 0.95, y - 1.2 * u);
    ctx.fill();
  }
  if (back === "wings") {
    ctx.globalAlpha = 0.75;
    ctx.fillStyle = shadeColor(backColor, 0.45);
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(x + side * 1.7 * u, shoulderY + 0.6 * u, 1.3 * u, 0.9 * u, side * -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x + side * 1.4 * u, shoulderY + 1.8 * u, 0.9 * u, 0.6 * u, side * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  if (back === "backpack") {
    box(ctx, x - torsoW * 0.62, shoulderY + 0.3 * u, torsoW * 1.24, 2 * u, shadeColor(backColor, -0.2), 0.3 * u);
  }
  if (outfit.hair === "long") {
    box(ctx, x - head / 2 - 0.25 * u, headY + 0.3 * u, head + 0.5 * u, head + 1.6 * u, shadeColor(hairColor, -0.1), 0.5 * u);
  }
  if (outfit.hair === "ponytail") {
    box(ctx, x - facing * (head / 2 + 0.35 * u) - 0.4 * u, headY + 0.5 * u, 0.8 * u, 2.4 * u, shadeColor(hairColor, -0.1), 0.4 * u);
  }

  // ---- Legs and shoes ----
  const fullBody = top.fullBody;
  for (let i = 0; i < 2; i++) {
    const lx = legX[i];
    const shoeH = shoes.id === "boots" ? 1.1 * u : 0.45 * u;
    const footY = y - lift[i];
    const legBottom = footY - shoeH;
    box(ctx, lx, hipY, legW, legBottom - hipY + 0.1 * u, skin);

    if (top.id === "spacesuit") {
      box(ctx, lx, hipY, legW, legBottom - hipY + 0.1 * u, "#eef1f6");
    } else if (!fullBody || top.id === "dress") {
      if (bottom.id === "jeans" || bottom.id === "leggings") {
        box(ctx, lx, hipY, legW, legBottom - hipY + 0.1 * u, bottom.id === "leggings" ? shadeColor(bottomColor, -0.15) : bottomColor);
      }
      if (bottom.id === "shorts") box(ctx, lx, hipY, legW, legH * 0.42, bottomColor);
      if (bottom.id === "stripy") {
        for (let s = hipY; s < legBottom; s += 0.5 * u) {
          box(ctx, lx, s, legW, 0.25 * u, bottomColor);
        }
      }
    }

    // Shoes stick out a little in the direction you're facing
    const shoeX = lx - (facing < 0 ? 0.2 * u : 0);
    if (shoes.id === "barefoot") {
      box(ctx, shoeX, footY - 0.35 * u, legW + 0.2 * u, 0.35 * u, skin, 0.15 * u);
    } else if (shoes.id === "sandals") {
      box(ctx, shoeX, footY - 0.35 * u, legW + 0.2 * u, 0.35 * u, skin, 0.15 * u);
      box(ctx, shoeX, footY - 0.3 * u, legW + 0.2 * u, 0.12 * u, shoeColor);
      box(ctx, shoeX, footY - 0.12 * u, legW + 0.2 * u, 0.12 * u, shadeColor(shoeColor, -0.3));
    } else {
      box(ctx, shoeX, footY - shoeH, legW + 0.2 * u, shoeH, shoeColor, 0.15 * u);
      if (shoes.id === "sneakers") box(ctx, shoeX, footY - 0.14 * u, legW + 0.2 * u, 0.14 * u, "white", 0.07 * u);
      if (shoes.id === "heels") box(ctx, lx + (facing > 0 ? 0 : legW - 0.15 * u), footY - 0.2 * u, 0.25 * u, 0.2 * u, shadeColor(shoeColor, -0.35));
    }
  }

  // ---- Skirts and dresses (they go over the top of your legs) ----
  const flare = (topY, bottomY, topW, bottomW, color) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x - topW / 2, topY);
    ctx.lineTo(x + topW / 2, topY);
    ctx.lineTo(x + bottomW / 2, bottomY);
    ctx.lineTo(x - bottomW / 2, bottomY);
    ctx.fill();
  };
  if (!fullBody && bottom.id === "skirt") flare(hipY - 0.2 * u, hipY + 1.3 * u, torsoW, torsoW + 1.1 * u, bottomColor);
  if (top.id === "dress") flare(hipY - 0.4 * u, hipY + 1.5 * u, torsoW, torsoW + 1.4 * u, topColor);
  if (top.id === "gown") {
    flare(hipY - 0.4 * u, y - 0.25 * u, torsoW, torsoW + 2.6 * u, topColor);
    flare(hipY + 1.2 * u, y - 0.25 * u, torsoW + 1.4 * u, torsoW + 2.6 * u, shadeColor(topColor, 0.25));
  }
  if (top.id === "robe") flare(hipY - 0.4 * u, y - 0.4 * u, torsoW, torsoW + 1.8 * u, topColor);

  // ---- Body ----
  if (top.id === "swimsuit") {
    box(ctx, x - torsoW / 2, shoulderY, torsoW, torsoH, skin, 0.3 * u);
    box(ctx, x - torsoW / 2, shoulderY + 0.5 * u, torsoW, torsoH - 0.3 * u, topColor, 0.3 * u);
  } else if (top.id === "rainbow") {
    const bands = ["#e8463c", "#ff8a1e", "#ffd23c", "#2ebd6b", "#3d8bff", "#9b51e0"];
    bands.forEach((c, i) => box(ctx, x - torsoW / 2, shoulderY + (i * torsoH) / 6, torsoW, torsoH / 6 + 1, c));
  } else {
    const bodyColor = top.id === "spacesuit" ? "#eef1f6" : topColor;
    box(ctx, x - torsoW / 2, shoulderY, torsoW, torsoH + 0.1 * u, bodyColor, 0.3 * u);
    if (top.id === "stripes") {
      for (let s = shoulderY + 0.5 * u; s < hipY; s += 0.6 * u) box(ctx, x - torsoW / 2, s, torsoW, 0.25 * u, "white");
    }
    if (top.id === "hoodie") {
      box(ctx, x - torsoW * 0.35, hipY - 1 * u, torsoW * 0.7, 0.7 * u, shadeColor(topColor, -0.15), 0.2 * u);
      box(ctx, x - torsoW / 2, shoulderY, torsoW, 0.35 * u, shadeColor(topColor, -0.25), 0.2 * u);
    }
    if (top.id === "spacesuit") box(ctx, x - 0.6 * u, shoulderY + 0.6 * u, 1.2 * u, 0.9 * u, topColor, 0.2 * u);
    if (top.id === "sparkly") {
      ctx.fillStyle = "white";
      for (const [sx, sy] of [[-0.6, 0.6], [0.5, 0.9], [-0.2, 1.6], [0.7, 2.0], [-0.7, 2.1], [0.1, 0.3]]) {
        ctx.beginPath();
        ctx.arc(x + sx * u, shoulderY + sy * u, 0.13 * u, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // ---- Arms (they swing when you walk) ----
  const longSleeves = ["hoodie", "spacesuit", "robe"].includes(top.id);
  const noSleeves = top.id === "swimsuit";
  for (const side of [-1, 1]) {
    const ax = side < 0 ? x - torsoW / 2 - armW : x + torsoW / 2;
    const armDrop = side * swing * 0.25 * u;
    const armTop = shoulderY + 0.1 * u + armDrop;
    const armLen = 2.4 * u;
    box(ctx, ax, armTop, armW, armLen, skin, 0.25 * u);
    if (!noSleeves) {
      const sleeveColor = top.id === "spacesuit" ? topColor : top.id === "rainbow" ? "#e8463c" : topColor;
      box(ctx, ax, armTop, armW, longSleeves ? armLen - 0.4 * u : 0.9 * u, sleeveColor, 0.25 * u);
    }
  }

  // ---- Head and face ----
  box(ctx, x - head / 2, headY, head, head, skin, 0.45 * u);
  const look = facing * 0.18 * u;
  ctx.fillStyle = "#2b2220";
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(x + side * 0.45 * u + look, headY + 1.0 * u, 0.14 * u, 0.2 * u, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "rgba(255, 120, 150, 0.35)";
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(x + side * 0.7 * u + look, headY + 1.35 * u, 0.2 * u, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = "#2b2220";
  ctx.lineWidth = 0.12 * u;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(x + look, headY + 1.25 * u, 0.32 * u, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.stroke();

  // ---- Hair on top ----
  const hairTop = headY - 0.15 * u;
  if (outfit.hair !== "bald") {
    box(ctx, x - head / 2 - 0.1 * u, hairTop, head + 0.2 * u, 0.75 * u, hairColor, 0.4 * u);
    if (outfit.hair !== "short") {
      box(ctx, x - head / 2 - 0.12 * u, hairTop + 0.3 * u, 0.4 * u, 1.1 * u, hairColor, 0.2 * u);
      box(ctx, x + head / 2 - 0.28 * u, hairTop + 0.3 * u, 0.4 * u, 1.1 * u, hairColor, 0.2 * u);
    }
  }
  if (outfit.hair === "bun") {
    ctx.fillStyle = hairColor;
    ctx.beginPath();
    ctx.arc(x, hairTop - 0.2 * u, 0.6 * u, 0, Math.PI * 2);
    ctx.fill();
  }
  if (outfit.hair === "pigtails") {
    ctx.fillStyle = hairColor;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(x + side * (head / 2 + 0.35 * u), headY + 0.8 * u, 0.5 * u, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (outfit.hair === "curly") {
    ctx.fillStyle = hairColor;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.arc(x + i * 0.48 * u, hairTop + 0.15 * u, 0.42 * u, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ---- Hats and things on your head ----
  const hat = outfit.head;
  const headMid = headY + head / 2;
  if (hat === "crown") emojiAt(ctx, "👑", x, hairTop - 0.5 * u, 1.5 * u);
  if (hat === "bow") emojiAt(ctx, "🎀", x + facing * -0.6 * u, hairTop + 0.1 * u, 1.1 * u);
  if (hat === "flower") emojiAt(ctx, "🌺", x + facing * -0.75 * u, hairTop + 0.25 * u, 1.0 * u);
  if (hat === "cap") emojiAt(ctx, "🧢", x, hairTop + 0.05 * u, 1.9 * u);
  if (hat === "tophat") emojiAt(ctx, "🎩", x, hairTop - 0.55 * u, 1.8 * u);
  if (hat === "sunglasses") emojiAt(ctx, "🕶️", x + look, headY + 0.95 * u, 1.5 * u);
  if (hat === "headphones") emojiAt(ctx, "🎧", x, headMid - 0.1 * u, 2.6 * u);
  if (hat === "witchhat") {
    ctx.fillStyle = "#3a2550";
    ctx.beginPath();
    ctx.moveTo(x - 0.9 * u, hairTop + 0.3 * u);
    ctx.lineTo(x + 0.25 * u, hairTop - 2.0 * u);
    ctx.lineTo(x + 0.9 * u, hairTop + 0.3 * u);
    ctx.fill();
    box(ctx, x - 1.6 * u, hairTop + 0.15 * u, 3.2 * u, 0.35 * u, "#3a2550", 0.15 * u);
    box(ctx, x - 0.9 * u, hairTop - 0.05 * u, 1.8 * u, 0.22 * u, "#9b51e0");
  }
  if (hat === "helmet") {
    ctx.fillStyle = "rgba(190, 225, 255, 0.35)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    ctx.lineWidth = 0.15 * u;
    ctx.beginPath();
    ctx.arc(x, headMid, 1.55 * u, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.beginPath();
    ctx.ellipse(x - 0.7 * u, headMid - 0.7 * u, 0.25 * u, 0.45 * u, 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
}
