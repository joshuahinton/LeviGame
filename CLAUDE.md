# Levi's Game

A school holiday project: a parent and their kid (Levi) are building games together to play on an iPad.

## How it works
- Plain HTML + JavaScript on a `<canvas>`. **No build step, no frameworks, no npm dependencies.** Keep it that way so Levi can read and change everything.
- Deployed to GitHub Pages by `.github/workflows/deploy.yml` on every push to `main`. Played on the iPad from the home screen (PWA: `manifest.webmanifest` + `sw.js`).
- The top-level `index.html` is a menu linking to each game in `games/<name>/`. Each game is self-contained (its own `index.html` + `game.js`) and shares only `style.css`, the manifest, `sw.js` and `icons/` from the root. Keep games independent so Levi's changes can't break another game.
- `games/levi/` is **Levi's game**. `games/star-catcher/` and `games/stick-fight/` are his parent's games. Easy-to-change values live in the `SETTINGS` object at the top of each `game.js`.
- Each game page has a 🏠 link back to the menu: the installed app has no browser back button.
- Games share one origin, so give `localStorage` keys a per-game prefix (e.g. `starCatcherBest`).

## When making changes
- Write code a kid can follow: clear names, short functions, friendly comments explaining *what* each part does.
- The main input is **touch** (pointer events). Always keep the keyboard/mouse controls working too, for testing on a computer.
- Size things relative to the screen (the `size` variable), not fixed pixels. iPads rotate and come in different sizes.
- Emoji are the sprites. They're easy for Levi to swap and look great on iPad.
- Test locally with `python3 -m http.server 8000` before pushing. If you have a headless browser, check it at iPad size.
- When explaining things in chat, keep it simple and encouraging: Levi may be reading along.
