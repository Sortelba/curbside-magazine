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

echo "Publishing Curbside to GitHub..."
echo "--------------------------------"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "FEHLER: Das ist kein gültiges Git-Repository."
  read -p "Press Enter to close..."
  exit 1
fi

if [[ -z $(git status --porcelain) ]]; then
  echo "No changes to publish."
  read -p "Press Enter to close..."
  exit 0
fi

git add .
git commit -m "Update website content: $(date '+%Y-%m-%d %H:%M:%S')"

echo "Pushing to GitHub..."
git push origin main

if [ $? -eq 0 ]; then
  echo "--------------------------------"
  echo "SUCCESS! Website updated."
  echo "Changes are live in a few minutes."
else
  echo "--------------------------------"
  echo "ERROR: Could not push to GitHub."
  echo "Check your internet connection or GitHub settings."
fi

read -p "Press Enter to close..."
