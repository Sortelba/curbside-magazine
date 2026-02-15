#!/bin/bash
cd "$(dirname "$0")"
echo "Starting Curbside Admin Dashboard..."
echo "Opening browser..."
open "http://localhost:3000/admin?key=skatelife-secret"
echo "Starting server..."
npm run dev
