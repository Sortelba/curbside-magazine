#!/bin/bash
cd "$(dirname "$0")"
echo "Publishing Curbside to GitHub..."
echo "--------------------------------"

# Check for changes
if [[ -z $(git status -s) ]]; then
  echo "No changes to publish."
  read -p "Press Enter to close..."
  exit 0
fi

# Add all changes
git add .

# Commit with timestamp
git commit -m "Update website content: $(date '+%Y-%m-%d %H:%M:%S')"

# Push to GitHub
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
