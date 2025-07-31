@echo off
echo ===============================================
echo 🚀 JUNOSIXTEEN MASSIVE SYSTEM STARTUP
echo ===============================================
echo 🔥 Starting 500,000+ Question Database System
echo ===============================================

echo.
echo 📊 SYSTEM OVERVIEW:
echo ✅ 50+ Themenbereiche
echo ✅ 10 Level pro Bereich  
echo ✅ 1000 Fragen pro Level/Bereich
echo ✅ 500,000+ Total Fragen
echo ✅ Multi-Platform: Android/iOS/Windows
echo.

echo 🚀 Starting 3 parallel processes...
echo.

echo [1/3] 🧠 Starting MASSIVE Question Generator...
start "JunoSixteen Question Generator" cmd /k "echo 🧠 MASSIVE QUESTION GENERATOR && echo Generating 500,000+ questions... && node question-generator.js"

timeout /t 3 /nobreak > nul

echo [2/3] 🖥️ Starting Production Server...
start "JunoSixteen Production Server" cmd /k "echo 🖥️ PRODUCTION SERVER && echo Starting backend with Game Engine... && node server-production.js"

timeout /t 3 /nobreak > nul

echo [3/3] 📱 Starting Mobile Development...
start "JunoSixteen Mobile App" cmd /k "echo 📱 MOBILE DEVELOPMENT && echo Starting React Native... && cd mobile && npm start"

echo.
echo ===============================================
echo ✅ ALL SYSTEMS STARTED!
echo ===============================================
echo.
echo 🧠 Terminal 1: Question Generator (500k+ questions)
echo 🖥️ Terminal 2: Production Server (localhost:3000)
echo 📱 Terminal 3: Mobile App Development
echo.
echo 💡 Wait for all systems to fully initialize
echo 🎯 Check each terminal for status updates
echo.
pause 