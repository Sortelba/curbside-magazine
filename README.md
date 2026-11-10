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

## `.env.local` (nicht im Repository)

```
ADMIN_KEY=…        # Passwort fürs Admin Dashboard (Start Admin und Autoscan lesen es von hier)
GEMINI_API_KEY=…   # optional: News werden beim Veröffentlichen auf Deutsch/Englisch umgeschrieben
```

- Gemini schreibt nur Beiträge um, die wirklich veröffentlicht werden; Autoscan nutzt das restliche
  Tageslimit für ältere Rohtext-Beiträge (`/api/posts/rewrite-old`). Test: `node scripts/test-gemini.mjs`
- Ablaufende Bild-Links (Instagram, Bing) werden beim Veröffentlichen nach `public/uploads/posts/` kopiert.
- Instagram: Admin → News → „Insta-Post übernehmen“ (Link + kopierter Text → Entwurf).
- Jeder Beitrag hat eine eigene Seite unter `/news/<id>/`; die Startseite enthält nur die neuesten 60.

## Skatemap (Community → Skatemap)

- Quellen: Google-Karten in `scripts/import-maps.mjs` (SOURCES) plus `src/data/map-extra.json` (Spots, die du Claude schickst). Shops mit Position aus „Support Skate Shops“ kommen automatisch dazu.
- `node scripts/import-maps.mjs` baut `src/data/map.json` neu (Dubletten werden zusammengefasst). Läuft automatisch bei jedem Autoscan.
- `node scripts/export-kml.mjs` → `exports/curbside-skatemap.kml` (alles, für Google My Maps). Mit `--neu` → `exports/neue-spots.kml` (nur Spots aus `map-extra.json`, die noch in keiner Google-Karte stehen).
- Google My Maps hat keine Schreib-Schnittstelle: neue Spots von Hand in My Maps importieren.
