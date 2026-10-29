# Hinton-Bazil Games 🎮

A school holiday project by Levi and Dad: games you can play on the iPad.

Opening the app shows a menu with each game:

- **Levi's Game** (`games/levi/`): Levi's own game. It starts as a template: drag to move 😎 and collect the 🪙.
- **Star Catcher** (`games/star-catcher/`): Dad's example. Slide your finger to catch the ⭐ and dodge the 🪨.
- **PaperPaint.io** (`games/paperpaint/`): like Paper.io 2. Slide your finger to steer, leave your land to draw a line, and come back to paint everything inside it. If someone touches your line while you're out, you're out! Each continent on the world map is a level: paint enough of it to win and unlock the next. The levels are in `maps.js`.
- **AmaliaDraw** (`games/amaliadraw/`): learn to draw step by step. Part 1: draw over the dots on the iPad (less help as you go). Part 2: draw it on paper and take a photo. Everything goes in the Journal. Lessons are in `lessons.js`.
- **Bellablox** (`games/bellablox/`): Bella's game, inspired by her favourite Roblox games. Run and jump around a lobby and go through portals: 🐾 Pet Town (hatch eggs, look after pets, watch them grow) and 👗 Fashion Show (dress up for a theme, walk the runway, win coins). Clothes are in `avatar.js`, pets in `pets.js`, the show in `fashion.js`.
- **Dad's Stick Fight** (`games/stick-fight/`): punch the other stick figure off the platforms. Play against the computer, or 2 players on one iPad (Red uses the buttons on the left, Blue on the right). First to 5 rounds wins.

Every game has a 🏠 button in the corner to get back to the menu.

## Play it on the iPad

1. Open **Safari** on the iPad and go to **https://joshuahinton.github.io/LeviGame/**
2. Tap the **Share** button (the square with the arrow pointing up).
3. Tap **Add to Home Screen**, then **Add**.
4. Now there's a ⭐ icon on the home screen. Tap it to open the game menu full-screen, even without internet.

Each time we change the game and push to `main`, the iPad gets the new version the next time it opens the game with internet.

## Change a game

Each game has its own `game.js` (for example `games/levi/game.js`). The `SETTINGS` at the top are the easy bits to change.
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

## Add another game

1. Copy a game folder, e.g. `games/levi/` to `games/my-new-game/`.
2. In the new `index.html`, change the `<title>`.
3. In the top-level `index.html`, copy one of the `<a class="game">` buttons and point it at `games/my-new-game/`.

## What's in here

| File | What it does |
|------|--------------|
| `index.html` | The game menu |
| `games/levi/` | **Levi's game!** |
| `games/star-catcher/` | Dad's example game |
| `games/stick-fight/` | Dad's Stick Fight |
| `games/bellablox/` | Bellablox (`avatar.js` clothes, `pets.js` pets, `fashion.js` fashion show) |
| `games/amaliadraw/` | AmaliaDraw (`lessons.js` has the drawings) |
| `games/paperpaint/` | PaperPaint.io (`maps.js` has the levels and continent shapes) |
| `style.css` | Shared by every game: fills the screen, stops the iPad scrolling or zooming, styles the 🏠 button |
| `manifest.webmanifest`, `sw.js`, `icons/` | Make it all work like an app on the home screen, including offline |
| `tools/make-icons.js` | Draws the app icons (`node tools/make-icons.js`) |
| `.github/workflows/deploy.yml` | Puts the games online every time we push to `main` |

## One-time setup (Dad)

In the GitHub repo go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
The game then appears at the link above after the next push to `main`.
GitHub Pages on a *private* repo needs a paid GitHub plan, so either make the repo public or use a plan that includes Pages.
