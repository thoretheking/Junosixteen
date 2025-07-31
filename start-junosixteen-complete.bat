@echo off
title JunoSixteen Complete System Launcher
color 0A

echo.
echo ========================================================
echo 🚀 JUNOSIXTEEN COMPLETE SYSTEM LAUNCHER
echo ========================================================
echo 📊 88+ Themenbereiche • 13 Kategorien • 880K+ Fragen
echo 🎨 Imprint-Funktionalitäten: AKTIVIERT
echo ⚡ Wissenssnacks • 🗺️ Storytelling • 💭 Reflexion
echo ========================================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js ist nicht installiert!
    echo 💡 Bitte installiere Node.js von https://nodejs.org
    pause
    exit /b 1
)

echo ✅ Node.js gefunden: 
node --version

REM Check if npm packages are installed
if not exist "node_modules" (
    echo 📦 Installiere npm packages...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ npm install fehlgeschlagen!
        pause
        exit /b 1
    )
)

echo.
echo 🔧 SYSTEMAUSWAHL:
echo ========================================================
echo [1] 🎨 COMPLETE SYSTEM (Demo + Production + Question Generator)
echo [2] 📱 MOBILE DEV (Demo + Expo Development)
echo [3] 🧠 QUESTION GENERATOR (Massive Fragengenerierung)
echo [4] 🎮 PRODUCTION ONLY (Production Server)
echo [5] 🌟 DEMO ONLY (Demo Server)
echo [6] ⚡ IMPRINT SHOWCASE (Alle Imprint-Features)
echo [7] 🔥 MASSIVE GENERATION (880K+ Fragen generieren)
echo ========================================================
echo.

set /p choice="Wähle eine Option (1-7): "

if "%choice%"=="1" goto COMPLETE_SYSTEM
if "%choice%"=="2" goto MOBILE_DEV
if "%choice%"=="3" goto QUESTION_GENERATOR
if "%choice%"=="4" goto PRODUCTION_ONLY
if "%choice%"=="5" goto DEMO_ONLY
if "%choice%"=="6" goto IMPRINT_SHOWCASE
if "%choice%"=="7" goto MASSIVE_GENERATION

echo ❌ Ungültige Auswahl!
timeout /t 3 >nul
goto :eof

:COMPLETE_SYSTEM
echo.
echo 🚀 STARTE COMPLETE SYSTEM...
echo ========================================================
echo 🌟 Demo Server: http://localhost:3000
echo 🎮 Production Server: http://localhost:3001  
echo 🧠 Question Generator: Hintergrund
echo 📱 Imprint-Funktionalitäten: AKTIV
echo ========================================================
echo.

REM Start all services in separate windows
start "🌟 Demo Server" cmd /k "echo 🌟 DEMO SERVER STARTING... && node demo-server.js"
timeout /t 2 >nul

start "🎮 Production Server" cmd /k "echo 🎮 PRODUCTION SERVER STARTING... && node server-production.js"
timeout /t 2 >nul

start "🧠 Question Generator" cmd /k "echo 🧠 QUESTION GENERATOR STARTING... && node question-generator.js"
timeout /t 2 >nul

echo ✅ Alle Systeme gestartet!
echo 💡 Öffne http://localhost:3000 für Demo
echo 💡 Öffne http://localhost:3001 für Production
echo.
echo Drücke eine beliebige Taste zum Beenden...
pause >nul
goto :eof

:MOBILE_DEV
echo.
echo 📱 STARTE MOBILE DEVELOPMENT...
echo ========================================================
echo 🌟 Demo Server: http://localhost:3000
echo 📱 Expo Dev: http://localhost:8081
echo 🎨 Imprint-Features verfügbar
echo ========================================================
echo.

start "🌟 Demo Server" cmd /k "echo 🌟 DEMO SERVER (Mobile Ready)... && node demo-server.js"
timeout /t 3 >nul

start "📱 Expo Development" cmd /k "echo 📱 EXPO DEV STARTING... && npx expo start"
timeout /t 2 >nul

echo ✅ Mobile Development gestartet!
echo 💡 Demo APIs: http://localhost:3000
echo 💡 Expo: Scanne QR-Code in Terminal
echo.
pause
goto :eof

:QUESTION_GENERATOR
echo.
echo 🧠 STARTE QUESTION GENERATOR...
echo ========================================================
echo 📚 88+ Themenbereiche
echo 🎯 1000 Fragen pro Bereich/Level
echo 📊 Geschätzte Generierungszeit: 5-10 Minuten
echo ========================================================
echo.

start "🧠 Question Generator" cmd /k "echo 🧠 GENERATING MASSIVE QUESTION POOL... && node question-generator.js"

echo ✅ Question Generator gestartet!
echo 💡 Überwache das separate Fenster für Progress
echo.
pause
goto :eof

:PRODUCTION_ONLY
echo.
echo 🎮 STARTE PRODUCTION SERVER...
echo ========================================================
echo 🔧 Port: 3001
echo 🎯 Vollständige Game Engine
echo 🎨 Alle Imprint-APIs aktiv
echo ========================================================
echo.

start "🎮 Production Server" cmd /k "echo 🎮 PRODUCTION SERVER STARTING... && node server-production.js"

echo ✅ Production Server gestartet!
echo 💡 Zugriff: http://localhost:3001
echo.
pause
goto :eof

:DEMO_ONLY
echo.
echo 🌟 STARTE DEMO SERVER...
echo ========================================================
echo 🔧 Port: 3000
echo 🎨 Imprint-Demo APIs aktiv
echo 📱 Mobile App ready
echo ========================================================
echo.

start "🌟 Demo Server" cmd /k "echo 🌟 DEMO SERVER STARTING... && node demo-server.js"

echo ✅ Demo Server gestartet!
echo 💡 Zugriff: http://localhost:3000
echo.
pause
goto :eof

:IMPRINT_SHOWCASE
echo.
echo 🎨 STARTE IMPRINT SHOWCASE...
echo ========================================================
echo 🍿 Wissenssnacks: http://localhost:3000/api/wissenssnacks
echo 🗺️ Storytelling: http://localhost:3000/api/storytelling  
echo ⚡ Microlearning: http://localhost:3000/api/microlearning
echo 💭 Reflexion: http://localhost:3000/api/reflexion
echo 📅 Wissensimpuls: http://localhost:3000/api/wissensimpuls
echo 🤖 Empfehlungen: http://localhost:3000/api/empfehlungen
echo ========================================================
echo.

start "🎨 Imprint Showcase" cmd /k "echo 🎨 IMPRINT SHOWCASE STARTING... && node demo-server.js"
timeout /t 3 >nul

REM Open browser with Imprint APIs
start "" "http://localhost:3000"
start "" "http://localhost:3000/api/wissenssnacks"

echo ✅ Imprint Showcase gestartet!
echo 💡 Browser öffnet automatisch
echo 🎨 Teste alle Imprint-Features
echo.
pause
goto :eof

:MASSIVE_GENERATION
echo.
echo 🔥 STARTE MASSIVE QUESTION GENERATION...
echo ========================================================
echo 📊 TARGET: 880.000+ Fragen
echo 📚 88+ Bereiche × 10 Level × 1000 Fragen
echo ⏱️ Geschätzte Zeit: 10-15 Minuten
echo 💾 Speicherort: ./question-pools/
echo ========================================================
echo.

echo ⚠️  WARNUNG: Dies wird sehr viele Fragen generieren!
echo 💽 Stelle sicher, dass genug Speicherplatz vorhanden ist.
echo.
set /p confirm="Fortfahren? (j/n): "

if /i not "%confirm%"=="j" (
    echo ❌ Abgebrochen.
    timeout /t 2 >nul
    goto :eof
)

echo.
echo 🔥 MASSIVE GENERATION GESTARTET...
start "🔥 Massive Question Generation" cmd /k "echo 🔥 GENERATING 880K+ QUESTIONS... && node question-generator.js && echo. && echo ✅ GENERATION COMPLETE! && echo 📊 Check ./question-pools/ folder && pause"

REM Also start demo server to show progress
timeout /t 3 >nul
start "🌟 Demo Server (Progress Monitor)" cmd /k "echo 🌟 DEMO SERVER (Monitor Generation)... && node demo-server.js"

echo ✅ Massive Generation gestartet!
echo 💡 Überwache Progress in separaten Fenstern
echo 📊 Demo Dashboard: http://localhost:3000
echo 💾 Fragen werden in ./question-pools/ gespeichert
echo.
echo ⏳ Bitte warten... Generation läuft...
pause
goto :eof

echo.
echo ========================================================
echo 🎉 JUNOSIXTEEN SYSTEM LAUNCHER BEENDET
echo 💫 Danke fürs Nutzen!
echo ========================================================
pause 