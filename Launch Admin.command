#!/bin/bash

# Port auf dem Next.js läuft
PORT=3000
# Pfad zum Projektverzeichnis
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

# Überprüfen, ob der Server bereits läuft
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "Server läuft bereits auf Port $PORT."
else
    echo "Starte Server im Hintergrund..."
    # Startet npm run dev im Hintergrund und leitet Output in eine Logdatei um
    nohup npm run dev > "$DIR/server.log" 2>&1 &
    
    # Kurz warten, bis der Server initialisiert ist
    echo "Warte kurz auf Server-Start..."
    sleep 3
fi

# Admin Dashboard im Standardbrowser öffnen
echo "Öffne Admin Dashboard..."
open "http://localhost:$PORT/admin?key=skatelife-secret"

# Terminalfenster automatisch schließen (macOS)
osascript -e 'tell application "Terminal" to close (every window whose name contains (do shell script "basename \"$0\""))' &
exit
