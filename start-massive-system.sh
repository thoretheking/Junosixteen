#!/bin/bash

echo "==============================================="
echo "🚀 JUNOSIXTEEN MASSIVE SYSTEM STARTUP"
echo "==============================================="
echo "🔥 Starting 500,000+ Question Database System"
echo "==============================================="
echo
echo "📊 SYSTEM OVERVIEW:"
echo "✅ 50+ Themenbereiche"
echo "✅ 10 Level pro Bereich"
echo "✅ 1000 Fragen pro Level/Bereich"
echo "✅ 500,000+ Total Fragen"
echo "✅ Multi-Platform: Android/iOS/Windows"
echo
echo "🚀 Starting 3 parallel processes..."
echo

echo "[1/3] 🧠 Starting MASSIVE Question Generator..."
gnome-terminal --title="JunoSixteen Question Generator" -- bash -c "echo '🧠 MASSIVE QUESTION GENERATOR'; echo 'Generating 500,000+ questions...'; node question-generator.js; exec bash" &

sleep 3

echo "[2/3] 🖥️ Starting Production Server..."
gnome-terminal --title="JunoSixteen Production Server" -- bash -c "echo '🖥️ PRODUCTION SERVER'; echo 'Starting backend with Game Engine...'; node server-production.js; exec bash" &

sleep 3

echo "[3/3] 📱 Starting Mobile Development..."
gnome-terminal --title="JunoSixteen Mobile App" -- bash -c "echo '📱 MOBILE DEVELOPMENT'; echo 'Starting React Native...'; cd mobile && npm start; exec bash" &

echo
echo "==============================================="
echo "✅ ALL SYSTEMS STARTED!"
echo "==============================================="
echo
echo "🧠 Terminal 1: Question Generator (500k+ questions)"
echo "🖥️ Terminal 2: Production Server (localhost:3000)"
echo "📱 Terminal 3: Mobile App Development"
echo
echo "💡 Wait for all systems to fully initialize"
echo "🎯 Check each terminal for status updates"
echo

read -p "Press Enter to continue..." 