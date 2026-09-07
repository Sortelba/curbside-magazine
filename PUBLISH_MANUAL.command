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

echo "------------------------------------------------"
echo "CURBSIDE - MANUELLES PUBLISH"
echo "------------------------------------------------"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "FEHLER: Das ist kein gültiges Git-Repository."
  read -p "Drücke ENTER zum Beenden..."
  exit 1
fi

if [[ -z $(git status --porcelain) ]]; then
  echo "Keine Änderungen zum Veröffentlichen."
  read -p "Drücke ENTER zum Beenden..."
  exit 0
fi

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
