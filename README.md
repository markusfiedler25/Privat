# Swiss Health Quest

A personal daily learning app (PWA): German for work plus Swiss healthcare IT along the patient journey – SAP IS-H, Epic, interfaces, tariffs and business analysis – for three case types (external order, outpatient, inpatient). XP, streak with weekly freeze, career map, ripple effects, regulatory radar.

## Run locally
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/ (installable PWA, offline)
```

## Deploy (GitHub Pages)
Push to `main`. The workflow `.github/workflows/deploy.yml` builds and publishes (Settings → Pages → Source: GitHub Actions).
Install on iPhone: open the Pages URL in Safari → Share → Add to Home Screen.

## How a day works
- Two blocks with time targets (default Deutsch 45 min, Healthcare IT 15 min – change under Me).
- Each block is a queue of cards with an estimated duration. Finishing a card unlocks the next one right away; when you are faster than planned, more cards unlock until the block's time target is reached. Then the block locks until tomorrow.
- Time counts only while a block is open and the screen is on.
- Both targets reached = streak day. One missed day per week is covered by a freeze.
- Healthcare IT is one continuous stream: stage → case type → lesson cards (process, systems, interfaces, tariffs, scenario, quiz, KPIs & BA idea, ripple effect, why this matters), plus a BA exercise at the end of each stage, a daily follow-up and a weekly regulatory radar card.
- Deutsch reuses the day's healthcare topic: spaced-repetition reviews, new words, grammar by CEFR sublevel, a topic exercise, reading, sentence building, dictation, speed rounds.
- "Use it today": one small challenge for real work, a check-in the next day, a weekly reflection.

## Content (JSON, separate from code)
| File | What |
|---|---|
| `src/content/stages.json` | 10 journey stages, case types, what each stage means per case type |
| `src/content/modules/<stage>.json` | One lesson per case type + the stage's BA exercise (ripple effects, why-this-matters, German links, Use-it-today challenges) |
| `src/content/radar.json` | Regulatory radar 2026–2032 – every item "verify before publishing" with sources |
| `src/content/usetoday.json` | Generic Use-it-today challenge templates |
| `src/content/german/vocab.json` | Spaced-repetition deck |
| `src/content/german/grammar.json` | Grammar drills by CEFR sublevel |
| `src/content/careers.json` | Career levels, target roles, skills, salary ranges |
| `src/content/architecture.json` | System map (front end → logic → tables → systems) |
| `src/content/boss.json` | Sunday boss challenges |

Add a stage: write `src/content/modules/<stage-id>.json` (same shape as `referral.json`) and register it in `src/content/index.js`.

## Data
Progress lives in `localStorage` on the device (old versions are migrated automatically). Export/import JSON under **Me**. Reminders: **Me → Add reminders to calendar** creates an `.ics` file with a morning and an evening alarm.
