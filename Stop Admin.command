#!/bin/bash
PORT=3000
PID=$(lsof -Pi :$PORT -sTCP:LISTEN -t)

if [ -z "$PID" ]; then
  echo "Kein Server auf Port $PORT gefunden."
  exit 0
fi

kill $PID
printf "Server auf Port %s gestoppt (PID: %s)\n" "$PORT" "$PID"
exit 0
