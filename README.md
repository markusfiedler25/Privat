# Swiss Health Quest

A personal 60-minute daily learning app (PWA): Swiss healthcare IT along the patient journey (SAP IS-H, Epic, interfaces, tariffs, business analysis) plus German for work, with XP, streaks, badges and a career dashboard.

## Run locally
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/ (installable PWA, offline)
```

## Deploy (GitHub Pages)
1. Push this folder to a GitHub repository (branch `main`).
2. Repository → Settings → Pages → Source: **GitHub Actions**.
3. The workflow `.github/workflows/deploy.yml` builds and publishes on every push.
4. Open the Pages URL on your phone → Safari: Share → Add to Home Screen (Android/Chrome: Install app).

Pages on a private repository needs a paid GitHub plan. Your progress is stored on the device only, never in the repo.

## Content (JSON, separate from code)
| File | What |
|---|---|
| `src/content/stages.json` | The 11 patient-journey stages (map, status ready/planned) |
| `src/content/lessons/<stage>.json` | Lessons: sections, scenario, quiz, skills, German link, BA exercise |
| `src/content/german/vocab.json` | Spaced-repetition deck |
| `src/content/german/grammar.json` | Grammar drills |
| `src/content/careers.json` | Target roles, skill targets, certs, salary ranges |
| `src/content/architecture.json` | System map (front end → logic → tables → systems) |
| `src/content/market.json` | Swiss market context cards |
| `src/content/boss.json` | Sunday boss challenges |

Add a stage: create `lessons/<stage-id>.json`, import it in `src/content/index.js`, set `"status": "ready"` in `stages.json`.
Items with a `verify` block are shown with a "Verify" note and official sources (BAG, OAAT, SwissDRG AG, eHealth Suisse).

## Data
Progress lives in `localStorage` on the device. Export/import JSON in the **Me** tab. Reminders: **Me → Add reminders to calendar** creates an `.ics` with a daily morning and evening alarm.
