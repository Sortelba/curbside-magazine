#!/bin/bash
set -u

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ ! -d "$ROOT_DIR/.git" ]; then
  for candidate in \
    "$HOME/Documents/GitHub/curbside-magazine" \
    "$HOME/curbside-magazine" \
    "/Users/steffenortelbach/Documents/GitHub/curbside-magazine"; do
    if [ -d "$candidate/.git" ]; then
      ROOT_DIR="$candidate"
      break
    fi
  done
fi

cd "$ROOT_DIR" || {
  echo "Projektordner nicht gefunden."
  exit 1
}

PORT=3000
URL="http://localhost:$PORT/admin?key=skatelife-secret"

wait_for_server() {
  for i in {1..45}; do
    if curl -fsS "http://localhost:$PORT" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  return 1
}

close_terminal_window() {
  osascript -e 'tell application "Terminal" to close (every window whose frontmost is true)' >/dev/null 2>&1 || true
}

echo "Starting Curbside Admin Dashboard..."
if lsof -Pi ":$PORT" -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "Server läuft bereits auf Port $PORT."
else
    echo "Starting server..."
    nohup npm run dev -- --hostname 127.0.0.1 > "$ROOT_DIR/server.log" 2>&1 &
    if ! wait_for_server; then
      echo "Server konnte nicht gestartet werden. Bitte server.log prüfen:"
      echo "$ROOT_DIR/server.log"
      close_terminal_window
      exit 1
    fi
fi

echo "Opening browser..."
open "$URL"
close_terminal_window
exit 0
