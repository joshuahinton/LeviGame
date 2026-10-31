// =====================================================================
//  HAPPY HOTEL  -  guests, supplies, days and the shop
//
//  👇 Change these to make your own hotel! 👇
// =====================================================================

// sleepy guests don't like noise. noisy guests love a party!
const GUESTS = [
  { emoji: "👵", name: "Granny Rose", sleepy: true },
  { emoji: "👴", name: "Grandpa Joe", sleepy: true },
  { emoji: "👩", name: "Mia" },
  { emoji: "👨", name: "Sam" },
  { emoji: "🧒", name: "Little Leo" },
  { emoji: "🐼", name: "Mr Panda", sleepy: true },
  { emoji: "🦊", name: "Ms Fox" },
  { emoji: "🐨", name: "Kenny Koala", sleepy: true },
  { emoji: "🧑‍🎤", name: "Rock Star", noisy: true },
  { emoji: "🥳", name: "Party Pat", noisy: true },
];

// Extra guests who only visit some hotels
const SPECIAL_GUESTS = {
  snow: [{ emoji: "🐧", name: "Pip Penguin" }, { emoji: "⛷️", name: "Ski Sally" }],
  space: [{ emoji: "👽", name: "Zorp", noisy: true }, { emoji: "🧑‍🚀", name: "Captain Kim", sleepy: true }],
};

// Things guests ask for. free: the day it becomes free. Otherwise buy it in the shop.
const SUPPLIES = [
  { id: "towels", emoji: "🧺", name: "Towels", freeOnDay: 2 },
  { id: "cake", emoji: "🍰", name: "Cake", freeOnDay: 3 },
  { id: "tea", emoji: "🍵", name: "Hot tea", freeOnDay: 5 },
  { id: "teddy", emoji: "🧸", name: "Teddy", price: 60 },
  { id: "earplugs", emoji: "🎧", name: "Earplugs", price: 60 },
];

// When a guest looks worried, you ASK what's wrong. The right question
// tells you what they need.
const FEELINGS = [
  { id: "hungry", ask: "Are you hungry?", icon: "🍽️", answer: "Yes! My tummy is rumbling.", item: "cake" },
  { id: "cold", ask: "Are you cold?", icon: "🥶", answer: "Brrr, yes! I'm freezing.", item: "tea" },
  { id: "lonely", ask: "Are you lonely?", icon: "🥺", answer: "A bit... I miss home.", item: "teddy" },
  { id: "messy", ask: "Do you need a wash?", icon: "🛁", answer: "Yes, I got all sandy!", item: "towels" },
];

// The hotels. Each one has 4 days (levels).
const HOTELS = [
  { id: "sea", name: "Seaside Hotel", emoji: "🏖️", wall: "#bfe8f2", floor: "#f3e2b8", deco: ["🐚", "🌴", "⛱️"] },
  { id: "snow", name: "Snowy Lodge", emoji: "❄️", wall: "#e3eefb", floor: "#c9d8ea", deco: ["⛄", "🎿", "🌲"] },
  { id: "space", name: "Space Hotel", emoji: "🚀", wall: "#3b2f6b", floor: "#5a4a8f", deco: ["🪐", "⭐", "🛸"] },
];

// Each day: how long it lasts, how often guests arrive, and the coin goal for ⭐.
// learn: a new thing that happens from this day on.
const DAYS = [
  { hotel: 0, seconds: 90, arrive: 12, goal: 60, learn: "welcome" },
  { hotel: 0, seconds: 100, arrive: 10.5, goal: 80, learn: "towels" },
  { hotel: 0, seconds: 110, arrive: 9.5, goal: 120, learn: "feelings" },
  { hotel: 0, seconds: 120, arrive: 9, goal: 155, learn: "bolt" },
  { hotel: 1, seconds: 120, arrive: 8, goal: 160, learn: "check" },
  { hotel: 1, seconds: 120, arrive: 7, goal: 200, learn: "noise" },
  { hotel: 1, seconds: 130, arrive: 6.5, goal: 235 },
  { hotel: 1, seconds: 130, arrive: 6, goal: 235 },
  { hotel: 2, seconds: 140, arrive: 6, goal: 285 },
  { hotel: 2, seconds: 140, arrive: 5.5, goal: 325 },
  { hotel: 2, seconds: 150, arrive: 5, goal: 365 },
  { hotel: 2, seconds: 150, arrive: 4.5, goal: 395 },
];

// What's new on each day. Shown before the day starts.
const LESSONS = {
  welcome: "Guests arrive at the desk. Tap a guest, then tap a free room ✨. When they leave, tap the messy room to clean it!",
  towels: "Guests might ask for things! Tap the 🧺 Towels button, then tap their room.",
  feelings: "Some guests look worried 😟 but don't say why. Tap their room and ASK them what's wrong!",
  bolt: "Meet Bolt 🤖, your robot helper! Tap Bolt, pick a job AND a room, and Bolt will do it.",
  check: "Bolt works fast but sometimes makes mistakes! When a room says 🤖✨, tap it to CHECK Bolt's work.",
  noise: "Noisy guests 🥳 can keep sleepy guests 😴 awake! Tap the grumpy guest's room and find a FAIR way to fix it.",
};

const SHOP = [
  { id: "room3", name: "Room 3", emoji: "🚪", price: 60, info: "More rooms, more guests!" },
  { id: "room4", name: "Room 4", emoji: "🚪", price: 120, needs: "room3", info: "More rooms, more guests!" },
  { id: "room5", name: "Room 5", emoji: "🚪", price: 200, needs: "room4", info: "More rooms, more guests!" },
  { id: "room6", name: "Room 6", emoji: "🚪", price: 320, needs: "room5", info: "More rooms, more guests!" },
  { id: "teddy", name: "Teddies", emoji: "🧸", price: 60, info: "For guests who feel lonely." },
  { id: "earplugs", name: "Earplugs", emoji: "🎧", price: 60, info: "Help sleepy guests with noisy neighbours." },
  { id: "beds", name: "Comfy beds", emoji: "🛏️", price: 120, info: "Happy guests give bigger tips!" },
  { id: "mop", name: "Super mop", emoji: "🧽", price: 70, info: "Clean rooms twice as fast." },
  { id: "fastbolt", name: "Turbo Bolt", emoji: "⚡", price: 100, info: "Bolt works twice as fast." },
  { id: "plant", name: "Lobby plant", emoji: "🪴", price: 40, info: "A cosy lobby: guests wait more patiently." },
  { id: "fish", name: "Fish tank", emoji: "🐠", price: 90, info: "Guests love watching fish while they wait." },
];

// Outfits for you, the hotel manager
const OUTFITS = [
  { emoji: "🧑‍💼", name: "Manager", price: 0 },
  { emoji: "🧑‍🍳", name: "Chef", price: 40 },
  { emoji: "👸", name: "Princess", price: 80 },
  { emoji: "🤴", name: "Prince", price: 80 },
  { emoji: "🧑‍🚀", name: "Astronaut", price: 100 },
  { emoji: "🦸", name: "Superhero", price: 140 },
  { emoji: "🧚", name: "Fairy", price: 180 },
];
