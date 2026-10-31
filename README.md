# Hinton-Bazil Games 🎮

Games made at home to play on a tablet: iPad or Android.

Opening the app shows a menu with each game:

- **My Game** (`games/my-game/`): a starter template for building your own game. Drag to move 😎 and collect the 🪙.
- **Star Catcher** (`games/star-catcher/`): an example game. Slide your finger to catch the ⭐ and dodge the 🪨.
- **Stick Fight** (`games/stick-fight/`): punch the other stick figure off the platforms. Play against the computer, or 2 players on one tablet (Red uses the buttons on the left, Blue on the right). First to 5 rounds wins.
- **PaperPaint.io** (`games/paperpaint/`): like Paper.io 2. Slide your finger to steer, leave your land to draw a line, and come back to paint everything inside it. If someone touches your line while you're out, you're out! Each continent on the world map is a level. The levels are in `maps.js`.
- **Draw Along** (`games/draw-along/`): learn to draw step by step. Part 1: draw over the dots on the tablet (less help as you go). Part 2: draw it on paper and take a photo. Everything goes in the Journal. Lessons are in `lessons.js`.
- **Blockville** (`games/blockville/`): run and jump around a blocky lobby and go through portals: 🐾 Pet Town (hatch eggs, look after pets, watch them grow) and 👗 Fashion Show (dress up for a theme, walk the runway, win coins). Clothes are in `avatar.js`, pets in `pets.js`, the show in `fashion.js`.
- **Block Fortress** (`games/block-fortress/`): tower defence. Build walls to make monsters walk the long way and towers to blast them, across 15 levels in 3 worlds. Help the lost chick 🐣 home, and decide whether Bolt the robot's tips are right 👍 or wrong 👎. Towers, monsters and levels are in `levels.js`.
- **Happy Hotel** (`games/happy-hotel/`): run a hotel. Check guests in, bring them what they need, ask worried guests what's wrong, sort out noisy neighbours fairly, and give Bolt the robot clear instructions (then check Bolt's work!). 12 days across 3 hotels. Guests, days and the shop are in `hotel.js`.

Every game has a 🏠 button in the corner to get back to the menu. Block Fortress and Happy Hotel are best with the tablet sideways.

## Play it on a tablet

The games live at **https://joshuahinton.github.io/LeviGame/**

**iPad**
1. Open **Safari** and go to the link above.
2. Tap the **Share** button (the square with the arrow pointing up).
3. Tap **Add to Home Screen**, then **Add**.

**Android tablet**
1. Open **Chrome** and go to the link above.
2. Tap the **⋮** menu (top right).
3. Tap **Install app** (or **Add to Home screen**), then **Install**.

Now there's a ⭐ icon on the home screen. Tap it to open the games full-screen, even without internet.
Each time we push to `main`, the tablet gets the new version the next time it opens the games with internet.

## Change a game

Each game has its own `game.js` (for example `games/my-game/game.js`). The `SETTINGS` at the top are the easy bits to change.
In Star Catcher they are:

- `player`: swap 🐱 for any emoji (🚀 🦖 🐸 🤖)
- `goodThing` / `badThing`: what you catch and what you dodge
- `lives`, `startSpeed`, `speedUp`, `badChance`: make it easier or harder
- `skyTop` / `skyBottom`: the background colours

Below the settings is the real game code. It has comments explaining each part.

## Try it on a computer first

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000. Click/drag the mouse or use the arrow keys.

## Check every game on iPad and Android sizes

```sh
npm install playwright      # one time only
node tools/check-games.js
```

This opens every game on pretend iPads and Android tablets (upright and sideways, plus an older tablet browser), taps around, and checks nothing breaks. Screenshots go in `check-results/`.

## Add another game

1. Copy a game folder, e.g. `games/my-game/` to `games/my-new-game/`.
2. In the new `index.html`, change the `<title>`.
3. In the top-level `index.html`, copy one of the `<a class="game">` buttons and point it at `games/my-new-game/`.
4. Add the new game to `tools/check-games.js` so it gets checked too.

## What's in here

| File | What it does |
|------|--------------|
| `index.html` | The game menu |
| `games/my-game/` | A starter game to build your own |
| `games/star-catcher/` | Star Catcher |
| `games/stick-fight/` | Stick Fight |
| `games/paperpaint/` | PaperPaint.io (`maps.js` has the levels and continent shapes) |
| `games/draw-along/` | Draw Along (`lessons.js` has the drawings) |
| `games/blockville/` | Blockville (`avatar.js` clothes, `pets.js` pets, `fashion.js` fashion show) |
| `games/block-fortress/` | Block Fortress (`levels.js` towers, monsters, levels, Bolt's tips) |
| `games/happy-hotel/` | Happy Hotel (`hotel.js` guests, supplies, days, shop) |
| `style.css` | Shared by every game: fills the screen, stops the tablet scrolling or zooming, styles the 🏠 button |
| `compat.js` | Shared by every game: helps older iPads and Android tablets draw everything |
| `manifest.webmanifest`, `sw.js`, `icons/` | Make it all work like an app on the home screen, including offline |
| `tools/check-games.js` | Checks every game on iPad and Android tablet sizes |
| `tools/make-icons.js` | Draws the app icons (`node tools/make-icons.js`) |
| `.github/workflows/deploy.yml` | Puts the games online every time we push to `main` |

## One-time setup

In the GitHub repo go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
The games then appear at the link above after the next push to `main`.
GitHub Pages on a *private* repo needs a paid GitHub plan, so either make the repo public or use a plan that includes Pages.
