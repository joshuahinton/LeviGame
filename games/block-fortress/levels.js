// =====================================================================
//  BLOCK FORTRESS  -  towers, monsters, levels and Bolt's tips
//
//  👇 Change these to make your own towers, monsters and levels! 👇
// =====================================================================

// range is in squares. rate is how many frames between shots (60 = 1 second).
// price is how many 🪙 coins it costs to unlock in the shop (0 = free).
const TOWERS = {
  wall:    { name: "Wall",    emoji: "🧱", cost: 5,  price: 0,   range: 0,   damage: 0,  rate: 0,  color: "#c98f60", info: "Blocks the path. Make the monsters walk the long way!" },
  blaster: { name: "Blaster", emoji: "🔫", cost: 20, price: 0,   range: 2.3, damage: 6,  rate: 28, color: "#3d8bff", air: true, info: "Shoots anything: walkers and flyers." },
  cannon:  { name: "Cannon",  emoji: "💣", cost: 40, price: 40,  range: 2.0, damage: 16, rate: 75, color: "#555b66", splash: 1.1, info: "Big boom that hits a group. Can't hit flyers." },
  freeze:  { name: "Freezer", emoji: "❄️", cost: 35, price: 60,  range: 1.9, damage: 1,  rate: 40, color: "#7cd3ff", air: true, slow: 0.45, info: "Slows monsters down so other towers get more shots." },
  rocket:  { name: "Rocket",  emoji: "🚀", cost: 50, price: 90,  range: 3.2, damage: 24, rate: 65, color: "#ff8a1e", air: true, airOnly: true, info: "Super strong, but only hits flyers." },
  laser:   { name: "Laser",   emoji: "⚡", cost: 70, price: 150, range: 3.0, damage: 4,  rate: 7,  color: "#c45cff", air: true, info: "Zaps really fast. Hits everything." },
};

// speed is in squares per second. armor takes away damage from each hit.
const MONSTERS = {
  blob:     { name: "Blob",       emoji: "👾", hp: 22,  speed: 1.0,  reward: 3,  gap: 1.0, traits: [] },
  beetle:   { name: "Beetle",     emoji: "🪲", hp: 14,  speed: 1.7,  reward: 3,  gap: 0.6, traits: ["fast"] },
  turtle:   { name: "Turtle",     emoji: "🐢", hp: 70,  speed: 0.55, reward: 6,  gap: 1.6, armor: 3, traits: ["tough"] },
  bat:      { name: "Bat",        emoji: "🦇", hp: 18,  speed: 1.25, reward: 4,  gap: 0.9, flying: true, traits: ["flies"] },
  kingblob: { name: "King Blob",  emoji: "👾", hp: 500, speed: 0.4,  reward: 40, gap: 2,   boss: true, traits: ["boss", "tough"] },
  chick:    { name: "Lost Chick", emoji: "🐣", hp: 12,  speed: 0.8,  reward: 0,  gap: 1,   friendly: true, traits: ["friendly"] },
};

const TRAIT_ICONS = { fast: "⚡ fast", tough: "🛡️ tough", flies: "🦇 flies", boss: "👑 boss", friendly: "💛 lost, not a monster!" };

// The maps. # = rock, S = where monsters come from, C = your castle
const MAPS = [
  {
    name: "Meadow",
    grass: ["#8fd694", "#84cc89"],
    rows: [
      "................",
      "..#.............",
      "..........#.....",
      "................",
      "S..............C",
      "................",
      ".....#..........",
      "..........#.....",
      "................",
    ],
  },
  {
    name: "Desert",
    grass: ["#f2d58a", "#ead083"],
    rows: [
      "......#.........",
      "......#.....#...",
      "......#.....#...",
      "............#...",
      "S..............C",
      "...#............",
      "...#.....#......",
      "...#.....#......",
      ".........#......",
    ],
  },
  {
    name: "Snowy Peaks",
    grass: ["#e8f2fb", "#dceaf6"],
    rows: [
      "....#......#....",
      "....#......#....",
      "....#...........",
      "....#...#.......",
      "S.......#......C",
      "........#...#...",
      "............#...",
      "....#.......#...",
      "....#.......#...",
    ],
  },
];

// Each level: which map, how many 🧱 blocks you start with, and the waves.
// Waves are split by "|". "blob*8 + bat*3" means 8 blobs, then 3 bats.
const LEVELS = [
  { map: 0, blocks: 60, waves: "blob*6 | blob*10 | blob*8 + beetle*4" },
  { map: 0, blocks: 60, waves: "blob*8 | beetle*8 | blob*10 + beetle*6" },
  { map: 0, blocks: 70, waves: "blob*8 | bat*5 | blob*8 + bat*6" },
  { map: 0, blocks: 70, waves: "blob*10 + chick*1 | turtle*4 | beetle*10 + bat*6 | turtle*5 + blob*10" },
  { map: 0, blocks: 80, waves: "blob*12 | bat*8 + beetle*8 | turtle*6 + chick*1 | kingblob*1 + blob*10" },
  { map: 1, blocks: 80, waves: "blob*12 | beetle*12 | bat*8 + blob*8" },
  { map: 1, blocks: 80, waves: "turtle*6 | bat*10 + chick*1 | beetle*14 + turtle*4" },
  { map: 1, blocks: 90, waves: "blob*16 | bat*12 | turtle*8 + beetle*10 | blob*20 + bat*8" },
  { map: 1, blocks: 90, waves: "beetle*20 + chick*1 | turtle*10 | bat*16 | turtle*8 + bat*10" },
  { map: 1, blocks: 100, waves: "blob*20 | bat*14 + beetle*14 | turtle*12 + chick*1 | kingblob*1 + turtle*6 + bat*8" },
  { map: 2, blocks: 140, waves: "blob*20 + beetle*10 | bat*18 | turtle*12 + blob*12" },
  { map: 2, blocks: 140, waves: "beetle*24 | turtle*14 + chick*1 | bat*20 + beetle*14" },
  { map: 2, blocks: 150, waves: "turtle*16 | bat*22 | blob*26 + beetle*18 | turtle*14 + bat*16" },
  { map: 2, blocks: 150, waves: "bat*24 + chick*1 | turtle*18 + beetle*16 | blob*30 + bat*20 | turtle*20" },
  { map: 2, blocks: 160, waves: "blob*24 + bat*16 | turtle*18 + beetle*20 | kingblob*1 + bat*20 | kingblob*2 + turtle*12 + chick*1" },
];

// Bolt the robot gives a tip before each wave.
// good: true means it's a GOOD tip. good: false means Bolt has got it WRONG.
// Can you tell which is which?
const BOLT_TIPS = {
  bat: [
    { text: "Bats fly over walls! Blasters and Rockets can hit them.", good: true },
    { text: "Walls will stop the bats. Build lots of walls!", good: false },
  ],
  turtle: [
    { text: "Turtles are tough. Cannons and upgraded towers help!", good: true },
    { text: "Turtles are super weak. One Blaster is plenty!", good: false },
  ],
  beetle: [
    { text: "Beetles are fast. A Freezer slows them down!", good: true },
    { text: "Beetles are slow, so you don't need many towers.", good: false },
  ],
  blob: [
    { text: "Use walls to make a long, twisty path. Towers get more shots!", good: true },
    { text: "Put your towers far away from the path. That's safest!", good: false },
  ],
  chick: [
    { text: "That chick 🐣 is lost, not a monster! Tap it to help it get home.", good: true },
    { text: "Blast everything that moves, even the chick!", good: false },
  ],
  kingblob: [
    { text: "King Blob has LOTS of energy. Upgrade your towers before it comes!", good: true },
    { text: "King Blob is tiny. Save your blocks, you won't need them.", good: false },
  ],
};

// Things to buy in the shop with 🪙 coins
const BUILDERS = [
  { emoji: "👷", name: "Builder", price: 0 },
  { emoji: "🧑‍🚀", name: "Astronaut", price: 50 },
  { emoji: "🥷", name: "Ninja", price: 80 },
  { emoji: "🦸", name: "Superhero", price: 120 },
  { emoji: "🧙", name: "Wizard", price: 160 },
];

const CASTLES = [
  { emoji: "🏰", name: "Castle", price: 0 },
  { emoji: "🛖", name: "Hut", price: 30 },
  { emoji: "🏯", name: "Temple", price: 90 },
  { emoji: "🗼", name: "Tower", price: 140 },
];

const BOOSTS = [
  { id: "blocks", name: "+15 🧱 at the start", emoji: "🧱", prices: [40, 80, 140] },
  { id: "hearts", name: "+2 ❤️ for your castle", emoji: "❤️", prices: [60, 120] },
];
