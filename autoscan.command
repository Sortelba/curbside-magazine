#!/bin/bash
set -u

BASE_DIR="$(cd "$(dirname "$0")" && pwd)"
SAFE_DIR="$HOME/curbside-magazine"

if [ -d "$BASE_DIR" ] && [ "$BASE_DIR" != "$SAFE_DIR" ]; then
  ln -sfn "$BASE_DIR" "$SAFE_DIR"
fi

DIR="$SAFE_DIR"
cd "$DIR" || {
  echo "Fehler: Projektordner konnte nicht gefunden werden."
  exit 1
}

clear
echo "================================================"
echo "   CURBSIDE MAGAZINE - AUTOSCAN & PUBLISH       "
echo "================================================"
echo " Startet den automatisierten Workflow...        "
echo "================================================"
echo ""

PORT=3000
if lsof -Pi ":$PORT" -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "[1/3] Server läuft bereits auf Port $PORT."
else
    echo "[1/3] Starte Server im Hintergrund..."
    nohup npm run dev > "$DIR/server.log" 2>&1 &
    echo "      Warte auf Initialisierung..."
    for i in {1..30}; do
        if curl -fsS "http://localhost:$PORT" >/dev/null 2>&1; then
            break
        fi
        sleep 1
    done
fi

echo "[2/3] Starte News-Scanner & Auto-Publish (Top 3)..."
node scripts/auto-publish.mjs

if [ $? -ne 0 ]; then
    echo ""
    echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
    echo " FEHLER: Der Auto-Scan ist fehlgeschlagen."
    echo " Bitte prüfe server.log oder das Terminal."
    echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
    read -p "Drücke ENTER zum Beenden..."
    exit 1
fi

echo "[3/3] Übertrage Änderungen zu GitHub..."
echo "" | bash "$DIR/PUBLISH_MANUAL.command"

echo ""
echo "================================================"
echo "   ALLES ERLEDIGT! DEINE NEWS SIND LIVE.        "
echo "================================================"
echo ""

read -p "Drücke ENTER zum Schließen..."
exit 0
