#!/bin/bash

# Port auf dem Next.js läuft
PORT=3000

echo "Suche nach laufendem Server auf Port $PORT..."

# PID des Prozesses finden, der auf dem Port lauscht
PID=$(lsof -Pi :$PORT -sTCP:LISTEN -t)

if [ -z "$PID" ]; then
    echo "Kein Server auf Port $PORT gefunden."
else
    echo "Stoppe Server (PID: $PID)..."
    kill $PID
    echo "Server wurde gestoppt."
fi

# Kurz warten und Fenster schließen
sleep 2
osascript -e 'tell application "Terminal" to close (every window whose name contains (do shell script "basename \"$0\""))' &
exit
