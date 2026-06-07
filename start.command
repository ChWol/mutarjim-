#!/bin/bash
# Tunesisch-Deutsch Übersetzer Startskript

# In das Verzeichnis des Skripts wechseln
cd "$(dirname "$0")"

echo "=== Tunesisch-Deutsch Übersetzer ==="

# PATH anpassen, falls node via Homebrew installiert ist, aber nicht im PATH für GUI-Apps
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

if ! command -v node &> /dev/null
then
    echo "Fehler: Node.js ist nicht installiert oder nicht im PATH."
    echo "Bitte installieren Sie Node.js (z.B. via 'brew install node' oder von nodejs.org)."
    read -p "Drücken Sie Enter zum Beenden..."
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo "Installiere benötigte Pakete (dies passiert nur einmal)..."
    npm install
fi

echo "Öffne den Browser..."
(sleep 3 && open http://localhost:3000) &

echo "Starte den Server (Beenden mit Strg+C)..."
npm run dev -- -p 3000
