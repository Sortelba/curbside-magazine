# Curbside Magazine

Skateboard-News-Seite (Next.js), veröffentlicht über GitHub Pages.
Inhalte liegen als JSON in `src/data/` und werden lokal über das Admin Dashboard gepflegt.

## Doppelklick-Befehle (macOS)

| Datei | Was es macht |
|---|---|
| **Start Admin.command** | Startet den lokalen Server und öffnet das Admin Dashboard |
| **Stop Admin.command** | Stoppt den lokalen Server |
| **Autoscan.command** | Scannt News, veröffentlicht die Top 3 und pusht zu GitHub |
| **Publish.command** | Committet alle Änderungen und pusht zu GitHub (Seite ist nach ~2 Min. live) |

Icons der Befehle neu setzen (z. B. nach frischem Clone):

```bash
swift scripts/set-command-icons.swift
```

## Aufbau

- `src/app/admin` – Admin Dashboard (nur lokal, `http://localhost:3000/admin?key=…`)
- `src/app/api` – lokale API für das Dashboard (wird beim Pages-Build entfernt)
- `src/data` – Posts, Events, Lern-Center, Community, Einstellungen
- `src/lib/eventScanner.ts` – Event-Scanner (Admin → Events → „Events scannen“): sucht europaweit
  auf The Boardr, Skateboard Germany, Blue Tomato, festen Kalender-Seiten und per Websuche.
  Weitere Kalender-Seiten: in `src/data/settings.json` unter `"eventSources": ["https://…"]` eintragen.
- `src/lib/dedupe.ts` – verhindert doppelte Beiträge
- `scripts/auto-publish.mjs` – Logik hinter Autoscan
- `scripts/prepare-static-export.mjs` – Build für GitHub Pages
- `scripts/optimize-uploads.mjs` – verkleinert Bilder in `public/uploads`

Optional: `GEMINI_API_KEY` in `.env.local` – dann werden gescannte News umgeschrieben und übersetzt.
