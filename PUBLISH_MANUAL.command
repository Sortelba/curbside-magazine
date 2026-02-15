#!/bin/bash
cd "$(dirname "$0")"
echo "------------------------------------------------"
echo "CURBSIDE - MANUELLES PUBLISH"
echo "------------------------------------------------"
echo "1. Speichere lokale Änderungen..."

git add .
git commit -m "Manuelles Update: $(date '+%H:%M:%S')"

echo "2. Übertrage zu GitHub..."
git push origin main

if [ $? -eq 0 ]; then
  echo "------------------------------------------------"
  echo "ERFOLG! Deine Änderungen sind auf dem Weg."
  echo "In ca. 2 Minuten ist die Homepage aktualisiert."
  echo "------------------------------------------------"
else
  echo "------------------------------------------------"
  echo "FEHLER: Konnte nicht zu GitHub übertragen."
  echo "Bitte prüfe dein Internet oder melde dich beim Support."
  echo "------------------------------------------------"
fi

read -p "Drücke ENTER zum Beenden..."
