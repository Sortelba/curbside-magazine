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

PORT=3000

echo "Öffne Admin Dashboard..."
if ! lsof -Pi ":$PORT" -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "Server läuft noch nicht. Starte ihn jetzt..."
    nohup npm run dev > "$DIR/server.log" 2>&1 &
    for i in {1..30}; do
        if curl -fsS "http://localhost:$PORT" >/dev/null 2>&1; then
            break
        fi
        sleep 1
    done
fi

open "http://localhost:$PORT/admin?key=skatelife-secret"
exit 0
