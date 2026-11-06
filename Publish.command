#!/bin/bash
set -u

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR" || {
  echo "Fehler: Projektordner konnte nicht gefunden werden."
  exit 1
}

echo "------------------------------------------------"
echo "CURBSIDE - MANUELLES PUBLISH"
echo "------------------------------------------------"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "FEHLER: Das ist kein gültiges Git-Repository."
  exit 1
fi

git fetch origin main >/dev/null 2>&1 || true

if [ -n "$(git status --porcelain)" ]; then
  echo "1. Speichere lokale Änderungen..."
  git add .

  if ! git diff --cached --quiet; then
    git commit -m "Manuelles Update: $(date '+%Y-%m-%d %H:%M:%S')" || {
      echo "Commit fehlgeschlagen. Bitte prüfe die Git-Config oder Konflikte."
      exit 1
    }
  fi
else
  echo "Keine lokalen Änderungen zum Veröffentlichen."
fi

REMOTE_AHEAD=$(git rev-list --left-right --count origin/main...HEAD 2>/dev/null | awk '{print $2}')
if [ -n "$REMOTE_AHEAD" ] && [ "$REMOTE_AHEAD" -gt 0 ]; then
  echo "2. Remote hat neue Commits. Rebase vor dem Push..."
  git pull --rebase origin main || {
    echo "Rebase fehlgeschlagen. Bitte Konflikte manuell lösen und erneut publizieren."
    exit 1
  }
fi

echo "3. Übertrage zu GitHub..."
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
  exit 1
fi
