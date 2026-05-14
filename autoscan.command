#!/bin/bash

# Pfad zum Projektverzeichnis
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

# Ästhetischer Header
clear
echo "================================================"
echo "   CURBSIDE MAGAZINE - AUTOSCAN & PUBLISH       "
echo "================================================"
echo " Startet den automatisierten Workflow...        "
echo "================================================"
echo ""

# 1. Server check/start (Port 3000)
PORT=3000
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "[1/3] Server läuft bereits auf Port $PORT."
else
    echo "[1/3] Starte Server im Hintergrund..."
    # Startet npm run dev im Hintergrund
    nohup npm run dev > "$DIR/server.log" 2>&1 &
    echo "      Warte auf Initialisierung..."
    sleep 3
fi

# 2. News Auto-Pump ausführen
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

# 3. GitHub Push auslösen
echo "[3/3] Übertrage Änderungen zu GitHub..."
# Wir rufen das existierende Publish-Skript auf
# Wir übergeben ein leeres Echo um den "read" Prompt am Ende zu überspringen
echo "" | bash "PUBLISH_MANUAL.command"

echo ""
echo "================================================"
echo "   ALLES ERLEDIGT! DEINE NEWS SIND LIVE.        "
echo "================================================"
echo ""

# Terminal offen lassen für Erfolgskontrolle
read -p "Drücke ENTER zum Schließen..."
exit 0
