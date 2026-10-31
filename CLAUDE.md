# Hinton-Bazil Games

Hinton-Bazil Games: a family school-holiday project building games to play on tablets, both **iPad (Safari)** and **Android (Chrome)**.

## Naming and privacy
- Don't name, or refer to, who plays or owns the games anywhere: game names, in-game text, code comments, save keys, docs or commit messages. Use neutral names ("You", "Player", "Happy Hotel") and "they/you" wording.

## How it works
- Plain HTML + JavaScript on a `<canvas>`. **No build step, no frameworks, no npm dependencies** in the games, so young players can read and change everything. (`tools/` may use dev-only tools such as Playwright.)
- Deployed to GitHub Pages by `.github/workflows/deploy.yml` on every push to `main`. Played from the tablet home screen as an installed web app (`manifest.webmanifest` + `sw.js`).
- The top-level `index.html` is a menu linking to each game in `games/<name>/`. Each game is self-contained (its own `index.html` + `game.js`) and shares only `style.css`, `compat.js`, the manifest, `sw.js` and `icons/` from the root. Keep games independent so changes to one can't break another.
- Every game page loads `../../compat.js` before its own scripts. It adds `roundRect` for older tablet browsers (Safari before 16, Chrome before 99).
- `games/my-game/` is a starter template for building your own game. `games/paperpaint/` is a Paper.io 2-style game (levels and continent outlines in `maps.js`). `games/draw-along/` is a step-by-step drawing lesson app (draw on the tablet, then on paper; lessons in `lessons.js`); it uses HTML screens plus canvases rather than one full-screen canvas. `games/blockville/` is a Roblox-inspired side-on lobby with portals to Pet Town and a Fashion Show (split into `avatar.js`, `game.js`, `pets.js`, `fashion.js`).
- `games/block-fortress/` and `games/happy-hotel/` are softly educational: alongside the fun they build empathy, people skills and critical thinking. Both feature **Bolt 🤖**, a helper robot that is sometimes wrong, so players learn to give AI clear instructions and check its work. Keep that spirit: reward kind and fair choices, never make Bolt always right. Both are wide games that show a "turn your tablet sideways" hint when played upright.
- Easy-to-change values live in the `SETTINGS` object at the top of each `game.js`.
- Each game page has a 🏠 link back to the menu: the installed app has no browser back button.
- Games share one origin, so give `localStorage` keys a per-game prefix (e.g. `starCatcherBest`). If you rename a game's save key, bring old saves across (see `findOldSave` in Happy Hotel) so nobody loses progress.

## When making changes
- Write code a young player can follow: clear names, short functions, friendly comments explaining *what* each part does.
- The main input is **touch** (pointer events), on both iPad and Android. Always keep the keyboard/mouse controls working too, for testing on a computer.
- Size things relative to the screen, not fixed pixels. Tablets rotate and come in different shapes: Android tablets are often wider and shorter (16:10) than iPads (4:3).
- Emoji are the sprites. Only use emoji from **Emoji 13.0 (2020) or older**, so they show on older Android tablets and iPads (no 🫧 🪩 🪽 🪺 etc).
- Don't rely on browser features newer than about 2021 without a fallback in `compat.js`.
- **Test on both iPad and Android sizes before pushing:** `node tools/check-games.js` (needs `npm install playwright`). It checks every game on iPad and Android tablets, upright and sideways, plus an older browser. When you add a game, add a check for it there.
- When explaining things in chat, keep it simple and encouraging: young players may be reading along.
