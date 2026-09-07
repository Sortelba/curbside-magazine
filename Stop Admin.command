#!/bin/bash
PORT=3000
PID=$(lsof -Pi :$PORT -sTCP:LISTEN -t)

if [ -z "$PID" ]; then
  echo "Kein Server auf Port $PORT gefunden."
  osascript -e 'tell application "Terminal" to close (every window whose frontmost is true)' >/dev/null 2>&1 || true
  exit 0
fi

kill $PID
printf "Server auf Port %s gestoppt (PID: %s)\n" "$PORT" "$PID"
osascript -e 'tell application "Terminal" to close (every window whose frontmost is true)' >/dev/null 2>&1 || true
exit 0
