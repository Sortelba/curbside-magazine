#!/bin/bash
set -u

# Immer im Ordner arbeiten, in dem dieses Script liegt (dem echten Projekt).
# Früher wurde auf ~/curbside-magazine umgeleitet – das war aber eine alte,
# separate Kopie, d.h. Scan + Publish liefen im falschen Projekt.
DIR="$(cd "$(dirname "$0")" && pwd -P)"
cd "$DIR" || {
  echo "Fehler: Projektordner konnte nicht gefunden werden."
  exit 1
}

clear
echo "================================================"
echo "   CURBSIDE MAGAZINE - AUTOSCAN & PUBLISH       "
echo "================================================"
echo " Projekt: $DIR"
echo "================================================"
echo ""

PORT=3000

fail() {
  echo ""
  echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
  echo " FEHLER: $1"
  echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
  read -p "Drücke ENTER zum Beenden..."
  exit 1
}

PID=$(lsof -Pi ":$PORT" -sTCP:LISTEN -t 2>/dev/null | head -1)
if [ -n "$PID" ]; then
  # Prüfen, ob der laufende Server aus DIESEM Ordner gestartet wurde.
  SERVER_DIR=$(lsof -a -p "$PID" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -1)
  SERVER_DIR=$(cd "$SERVER_DIR" 2>/dev/null && pwd -P)
  if [ "$SERVER_DIR" != "$DIR" ]; then
    echo "Auf Port $PORT läuft ein Server aus einem ANDEREN Ordner:"
    echo "   $SERVER_DIR"
    fail "Bitte zuerst 'Stop Admin.command' ausführen und Autoscan neu starten."
  fi
  echo "[1/3] Server läuft bereits auf Port $PORT."
else
  echo "[1/3] Starte Server im Hintergrund..."
  nohup npm run dev -- --hostname 127.0.0.1 > "$DIR/server.log" 2>&1 &
  echo "      Warte auf Initialisierung..."
  for i in {1..60}; do
    if curl -fsS "http://localhost:$PORT" >/dev/null 2>&1; then
      break
    fi
    sleep 1
  done
fi

echo "[2/3] Starte News-Scanner & Auto-Publish (Top 3)..."
node scripts/auto-publish.mjs || fail "Der Auto-Scan ist fehlgeschlagen. Bitte prüfe server.log."

echo "[3/3] Übertrage Änderungen zu GitHub..."
echo "" | bash "$DIR/Publish.command" || fail "Publish zu GitHub fehlgeschlagen."

echo ""
echo "================================================"
echo "   ALLES ERLEDIGT! DEINE NEWS SIND LIVE.        "
echo "================================================"
echo ""

read -p "Drücke ENTER zum Schließen..."
exit 0
