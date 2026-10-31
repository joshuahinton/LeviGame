// =====================================================================
//  CHECK ALL THE GAMES on iPad and Android tablet sizes.
//
//  It opens every game on several pretend tablets (portrait and
//  landscape), taps around a bit, and checks nothing breaks.
//  Screenshots go in check-results/ so you can look at them.
//
//  How to run it (on a computer, not the tablet):
//    1. npm install playwright      (one time only, in any folder)
//    2. node tools/check-games.js
//
//  This is only for testing. The games themselves don't need it.
// =====================================================================

const http = require("http");
const fs = require("fs");
const path = require("path");
let playwright;
try {
  playwright = require("playwright");
} catch {
  console.log("Please run:  npm install playwright   then try again.");
  process.exit(1);
}

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "check-results");
const PORT = 8137;

// The pretend tablets
const TABLETS = [
  { name: "iPad landscape", device: "iPad (gen 11) landscape" },
  { name: "iPad portrait", device: "iPad (gen 11)" },
  { name: "iPad Pro landscape", device: "iPad Pro 11 landscape" },
  { name: "Android landscape", device: "Galaxy Tab S9 landscape" },
  { name: "Android portrait", device: "Galaxy Tab S9" },
  { name: "Older Android landscape", device: "Galaxy Tab S4 landscape" },
  // An older tablet browser that can't draw rounded boxes on its own (compat.js should fix it)
  { name: "Older browser", device: "Galaxy Tab S4 landscape", old: true },
];

// What to do in each game to check it really works. Each returns true if all is well.
const GAMES = {
  "": async (page) => {
    // The menu: every game button must open a real page
    const links = await page.$$eval("a.game", (as) => as.map((a) => a.getAttribute("href")));
    for (const href of links) {
      const res = await page.request.get(`http://localhost:${PORT}/${href}`);
      if (res.status() !== 200) throw new Error(`menu link ${href} is broken (${res.status()})`);
    }
    const manifest = await (await page.request.get(`http://localhost:${PORT}/manifest.webmanifest`)).json();
    if (!manifest.icons.some((i) => i.purpose === "maskable")) throw new Error("no Android (maskable) icon");
    return `${links.length} games on the menu`;
  },
  "games/my-game/": async (page) => {
    await tapMiddle(page);
    await page.waitForTimeout(600);
    return expect(page, () => mode === "playing", "tap starts the game");
  },
  "games/star-catcher/": async (page) => {
    await tapMiddle(page);
    await page.waitForTimeout(1200);
    return expect(page, () => mode === "playing", "tap starts the game");
  },
  "games/stick-fight/": async (page) => {
    await page.evaluate(() => startMatch(true));
    await page.waitForTimeout(1500);
    return expect(page, () => mode === "fight", "a 1-player fight starts");
  },
  "games/paperpaint/": async (page) => {
    await page.evaluate(() => startLevel(0));
    await tapMiddle(page);
    await page.waitForTimeout(1500);
    return expect(page, () => screen === "playing" && counts[1] > 0, "level 1 starts and you own some land");
  },
  "games/draw-along/": async (page) => {
    await page.evaluate(() => startLesson(LESSONS[0]));
    await page.waitForTimeout(400);
    const box = await page.locator("#drawCanvas").boundingBox();
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.28);
    await page.mouse.down();
    for (let a = 0; a <= 1; a += 0.05) {
      await page.mouse.move(box.x + box.width * (0.5 + 0.22 * Math.sin(a * Math.PI * 2)), box.y + box.height * (0.5 - 0.22 * Math.cos(a * Math.PI * 2)));
    }
    await page.mouse.up();
    await page.waitForTimeout(400);
    return expect(page, () => ink[0].length > 0 || stepNumber > 0, "drawing on the tablet works");
  },
  "games/blockville/": async (page) => {
    await page.locator("#right").dispatchEvent("pointerdown");
    await page.waitForTimeout(700);
    await page.locator("#right").dispatchEvent("pointerup");
    const moved = await page.evaluate(() => player.x > 340);
    await page.evaluate(() => goTo("petTown", 500));
    await page.waitForTimeout(600);
    if (!moved) throw new Error("the ▶ touch button didn't move the player");
    return expect(page, () => scene.name === "Pet Town", "walks with touch buttons and visits Pet Town");
  },
  "games/block-fortress/": async (page) => {
    await page.evaluate(() => {
      save.tutorialDone = true;
      startLevel(0);
      closePopups();
      game.tool = "blaster";
      build(3, 3);
      startWave();
    });
    await page.waitForTimeout(2500);
    await checkTurnHint(page);
    return expect(page, () => game.monsters.length > 0 && game.towers.some((t) => t), "builds a tower and starts a wave");
  },
  "games/happy-hotel/": async (page) => {
    await page.evaluate(() => startDay(0));
    await page.locator("text=Open the hotel!").click();
    await page.waitForTimeout(1800);
    await checkTurnHint(page);
    return expect(page, () => day.started && day.queue.length > 0, "the hotel opens and a guest arrives");
  },
};

// Wide games ask you to turn the tablet sideways when it's upright
async function checkTurnHint(page) {
  const size = page.viewportSize();
  const showing = await page.evaluate(() => getComputedStyle(document.querySelector(".turn-hint")).display !== "none");
  if (size.height > size.width && !showing) throw new Error("the 'turn sideways' hint didn't show in portrait");
  if (size.width > size.height && showing) throw new Error("the 'turn sideways' hint showed in landscape");
}

// Saves from before a game was renamed must still load (so nobody loses their progress)
async function checkOldSaves(browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`http://localhost:${PORT}/`);
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("oldnameHotelSave", JSON.stringify({ coins: 123 }));
    localStorage.setItem("oldnameBloxSave", JSON.stringify({ coins: 77 }));
    localStorage.setItem("oldnameDrawJournal", JSON.stringify([{ kind: "free", name: "Old drawing", img: "" }]));
  });
  const results = [];
  for (const [game, check] of [
    ["games/happy-hotel/", () => save.coins === 123],
    ["games/blockville/", () => save.coins === 77],
    ["games/draw-along/", () => journal.length === 1],
  ]) {
    await page.goto(`http://localhost:${PORT}/${game}`);
    await page.waitForTimeout(300);
    results.push((await page.evaluate(check)) ? `✅ ${game}` : `❌ ${game}`);
  }
  await context.close();
  return results;
}

async function tapMiddle(page) {
  const size = page.viewportSize();
  await page.touchscreen.tap(size.width / 2, size.height / 2);
}

async function expect(page, check, what) {
  const ok = await page.evaluate(check);
  if (!ok) throw new Error(`expected: ${what}`);
  return what;
}

// A tiny web server, so the games load just like on the internet
function startServer() {
  const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".webmanifest": "application/manifest+json" };
  const server = http.createServer((req, res) => {
    let file = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]));
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
    if (!file.startsWith(ROOT) || !fs.existsSync(file)) {
      res.writeHead(404);
      res.end("not found");
      return;
    }
    res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
  server.on("error", () => {
    console.log(`Port ${PORT} is busy. Close whatever is using it, then try again.`);
    process.exit(1);
  });
  return new Promise((resolve) => server.listen(PORT, () => resolve(server)));
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const server = await startServer();
  const browser = await playwright.chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  let failures = 0;

  for (const tablet of TABLETS) {
    console.log(`\n📱 ${tablet.name}`);
    for (const [game, check] of Object.entries(GAMES)) {
      const context = await browser.newContext({ ...playwright.devices[tablet.device] });
      if (tablet.old) {
        await context.addInitScript(() => {
          delete CanvasRenderingContext2D.prototype.roundRect;
          delete Path2D.prototype.roundRect;
        });
      }
      const page = await context.newPage();
      const problems = [];
      page.on("pageerror", (e) => problems.push(e.message));
      page.on("console", (m) => m.type() === "error" && problems.push(m.text()));
      page.on("response", (r) => r.status() >= 400 && problems.push(`${r.status()} ${r.url()}`));
      let result = "";
      try {
        await page.goto(`http://localhost:${PORT}/${game}`);
        await page.evaluate(() => localStorage.clear());
        await page.reload();
        await page.waitForTimeout(500);
        result = await check(page);
      } catch (e) {
        problems.push(e.message.split("\n")[0]);
      }
      const name = game.replace("games/", "").replace("/", "") || "menu";
      await page.screenshot({ path: path.join(OUT, `${tablet.name.replace(/ /g, "-")}--${name}.png`) });
      if (problems.length) {
        failures++;
        console.log(`  ❌ ${name}: ${problems.join(" | ")}`);
      } else {
        console.log(`  ✅ ${name}: ${result}`);
      }
      await context.close();
    }
  }

  console.log("\n💾 Old saves still load after renaming:");
  for (const line of await checkOldSaves(browser)) {
    console.log(`  ${line}`);
    if (line.startsWith("❌")) failures++;
  }

  await browser.close();
  server.close();
  console.log(failures ? `\n❌ ${failures} problem(s) found.` : "\n✅ Every game works on every tablet!");
  console.log(`Screenshots: ${OUT}`);
  process.exit(failures ? 1 : 0);
})();
