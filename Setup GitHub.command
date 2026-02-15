#!/bin/bash
cd "$(dirname "$0")"

echo "=========================================="
echo "       GitHub Verbindung Einrichten       "
echo "=========================================="
echo ""
echo "Das Problem: GitHub akzeptiert dein normales Passwort nicht mehr für Programme."
echo "Du brauchst einen 'Personal Access Token' (PAT)."
echo ""
echo "SCHRITT 1: Token erstellen"
echo "1. Webbrowser: https://github.com/settings/tokens?type=beta"
echo "2. Klicke 'Generate new token'"
echo "3. Gib einen Namen ein (z.B. 'Macbook')"
echo "4. Wähle bei 'Repository access' -> 'All repositories'"
echo "5. Klicke 'Generate token'"
echo "6. KOPIERE den Token (er beginnt oft mit ghp_ oder github_pat_)"
echo ""
echo "------------------------------------------"
read -p "Gib deinen GitHub Benutzernamen ein: " USERNAME
echo ""
echo "Füge jetzt den Token ein (Rechtsklick > Paste oder Cmd+V):"
read -p "Token: " TOKEN
echo ""

if [ -z "$TOKEN" ]; then
    echo "Fehler: Kein Token eingegeben."
    read -p "Drücke Enter zum Beenden..."
    exit 1
fi

# Set remote URL with credentials
# Note: This saves the token in .git/config. Secure enough for personal use.
git remote set-url origin "https://$USERNAME:$TOKEN@github.com/Sortelba/curbside-magazine.git"

echo "------------------------------------------"
echo "Einstellungen gespeichert!"
echo "Versuche jetzt, die Seite hochzuladen..."
echo ""

git add .
git commit -m "Initial commit via Setup Script" 2>/dev/null
git push origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ ERFOLG! Deine Seite ist auf GitHub."
    echo "Ab jetzt kannst du einfach 'Publish Website.command' nutzen."
else
    echo ""
    echo "❌ FEHLER: Zugriff verweigert. Prüfe den Token und versuche es erneut."
fi

echo ""
read -p "Drücke Enter zum Schließen..."
