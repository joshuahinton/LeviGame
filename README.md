# Levi's Games 🎮

A school holiday project by Levi and Dad: games you can play on the iPad.

Opening the app shows a menu with each game:

- **Levi's Game** (`games/levi/`): Levi's own game. It starts as a template: drag to move 😎 and collect the 🪙.
- **Star Catcher** (`games/star-catcher/`): Dad's example. Slide your finger to catch the ⭐ and dodge the 🪨.
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
| `style.css` | Shared by every game: fills the screen, stops the iPad scrolling or zooming, styles the 🏠 button |
| `manifest.webmanifest`, `sw.js`, `icons/` | Make it all work like an app on the home screen, including offline |
| `tools/make-icons.js` | Draws the app icons (`node tools/make-icons.js`) |
| `.github/workflows/deploy.yml` | Puts the games online every time we push to `main` |

## One-time setup (Dad)

In the GitHub repo go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
The game then appears at the link above after the next push to `main`.
GitHub Pages on a *private* repo needs a paid GitHub plan, so either make the repo public or use a plan that includes Pages.
