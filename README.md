# Quant Trading Cockpit

Local React app for quant trading internship prep (3 Jun – 20 Jul 2026).

## Run

```bash
npm install
npm run generate-data   # optional: regenerate seed CSVs in data/
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

Sessions, errors, and planned-day edits are saved to `data/*.csv` via the dev server API. Writes are atomic with up to 3 rotating backups in `data/.backups/`. Edit CSV files directly anytime; restart dev if a file changed on disk while the app is open.

## Data files

| File | Editable in app |
|------|-----------------|
| `data/workouts.csv` | No (regenerate with `npm run generate-data`) |
| `data/planned-days.csv` | Future days only |
| `data/sessions.csv` | On session complete |
| `data/errors.csv` | Errors page |
| `data/resources.csv` | No |
| `data/free-practice.csv` | No |
