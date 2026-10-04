# Levi's Game 🎮

A school holiday project by Levi and Dad: a game you can play on the iPad.

Right now it's **Star Catcher**: slide your finger to catch the ⭐ and dodge the 🪨.

## Play it on the iPad

1. Open **Safari** on the iPad and go to **https://joshuahinton.github.io/LeviGame/**
2. Tap the **Share** button (the square with the arrow pointing up).
3. Tap **Add to Home Screen**, then **Add**.
4. Now there's a ⭐ icon on the home screen. Tap it to play full-screen, even without internet.

Each time we change the game and push to `main`, the iPad gets the new version the next time it opens the game with internet.

## Change the game

Open `game.js`. The `SETTINGS` at the top are the easy bits to change:

- `player`: swap 🐱 for any emoji (🚀 🦖 🐸 🤖)
- `goodThing` / `badThing`: what you catch and what you dodge
- `lives`, `startSpeed`, `speedUp`, `badChance`: make it easier or harder
- `skyTop` / `skyBottom`: the background colours

Below the settings is the real game code. It has comments explaining each part.

## Try it on a computer first

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000. Click/drag the mouse or use the ← → arrow keys.

## What's in here

| File | What it does |
|------|--------------|
| `index.html` | The web page the game lives in |
| `game.js` | **The game!** |
| `style.css` | Makes it fill the screen and stops the iPad scrolling or zooming |
| `manifest.webmanifest`, `sw.js`, `icons/` | Make it work like an app on the home screen, including offline |
| `tools/make-icons.js` | Draws the app icons (`node tools/make-icons.js`) |
| `.github/workflows/deploy.yml` | Puts the game online every time we push to `main` |

## One-time setup (Dad)

In the GitHub repo go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
The game then appears at the link above after the next push to `main`.
GitHub Pages on a *private* repo needs a paid GitHub plan, so either make the repo public or use a plan that includes Pages.
