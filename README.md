# Firefly Meadow

A gamified habit tracker built for ADHD brains. No streaks. No shame. Just a dark meadow that fills with glowing fireflies every time you do a tiny thing.

## Why it's built the way it is

- **No streaks.** Miss a day, nothing is taken away. The only visual history is the meadow, which only ever grows.
- **Daily Spark.** Each morning 3 habits are picked at random from your list — rotated for novelty, capped to kill choice paralysis.
- **Variable rewards.** Every completion rolls for firefly rarity (common / uncommon / rare / legendary). Legendary catches trigger a full-screen celebration. There's a pity timer so dry spells don't last.
- **"I'm up" morning flow.** No fixed morning alarms. When you're actually awake, tap the button — the morning stack (tongue scraping, oil pulling, chia + lemon) lights up and plays a wake-up cue.
- **Surprise micro-habits.** Random 5-minute bonus prompts ("drink a glass of water", "name three things you see") for extra fireflies.
- **Day Challenges.** Opt into No Sugar / No Carb / Fasting each morning, claim after 6 PM for a guaranteed legendary commemorative firefly.
- **Prep reminders.** Some habits need the night before (e.g. soaking chia seeds). Each habit can have a separate prep reminder N hours before its main time.
- **Weekly-frequency habits.** Gym × 2 per week is tracked with urgency rising toward the weekend if you haven't hit target.
- **Timers with ad-free audio.** 20-minute downstairs clean, 15-minute oil pulling etc. Each timer can pull from a playlist group of **audio files you upload once** — stored in IndexedDB, play offline, zero ads ever. If a group is empty, it falls back to **generative Tone.js music** (morning / hype / calm moods).
- **Icon badge.** The home-screen icon shows how many habits are still to do today.

## Install on Android

1. Deploy (see below) or open the local dev URL on your phone's Chrome.
2. Chrome will either show an install banner or you can tap the menu → **Install app**.
3. Launch from the home screen. First time it will ask for notification permission (only tap yes if you want reminders).
4. Open **Settings** tab → add your music files into "Morning wake-up" and "Cleaning hype" playlist groups. This keeps the timer screens ad-free forever.

## Develop locally

```bash
npm install
npm run dev     # open http://localhost:5173
npm run build   # production build (tsc + vite)
npm run preview # preview the built PWA
```

## Deploy

Any static host works. Easiest options:

- **Vercel**: `npx vercel` in this directory. Free tier, persistent URL.
- **Netlify**: drag the `dist/` folder into [app.netlify.com/drop](https://app.netlify.com/drop).
- **GitHub Pages**: push `dist/` to a `gh-pages` branch.

The PWA manifest, icons and service worker are all generated at build time by `vite-plugin-pwa`.

## Stack

- **Vite + React + TypeScript** — fast dev loop, strong typing for the game state.
- **Tailwind CSS** — styling.
- **Framer Motion** — firefly drift, card flips, celebration animations.
- **Zustand + persist** — game state in `localStorage`.
- **canvas-confetti** — sparkle bursts.
- **Tone.js** — generative fallback audio (morning chimes / hype beat / calm drones).
- **idb-keyval** — audio file blobs in IndexedDB.
- **vite-plugin-pwa** — manifest, service worker, install prompt handling.

## Data

Everything is on-device. Nothing leaves your phone. You can **export** a JSON backup and **import** it on another device — see Settings → Data.

## Your starter habits

The app seeds these the first time you open it. All editable:

- 👅 **Tongue scraping** — morning stack
- 🥥 **Oil pulling** — morning stack, 15-min timer
- 🍋 **Chia seeds + lemon** — morning stack, 10h prep reminder the night before
- 🏋️ **Gym** — weekly × 2, flexible time
- 🧹 **Downstairs mini clean** — daily, 20-min timer, rotates through your "Cleaning hype" tracks
- 🍵 **Tea + reading** — daily at 20:00
