@echo off
chcp 65001 >nul
title 🚀 JunoSixteen - Windows PC Installer
color 0B

echo.
echo ████████████████████████████████████████████████████████████████
echo █                                                              █
echo █            🚀 JUNOSIXTEEN PC INSTALLER                      █
echo █        Gamifizierte KI-Lernplattform für Windows            █
echo █                                                              █
echo ████████████████████████████████████████████████████████████████
echo.

REM Check for Administrator rights
net session >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Administrator-Rechte erkannt
) else (
    echo ⚠️  WARNUNG: Für beste Ergebnisse als Administrator ausführen
    pause
)

echo.
echo 🔍 SYSTEM-CHECK...
echo ========================================================

REM Check Node.js
node --version >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Node.js ist installiert
    node --version
) else (
    echo ❌ Node.js nicht gefunden!
    echo 📥 Lade Node.js herunter...
    start https://nodejs.org/dist/v18.17.1/node-v18.17.1-x64.msi
    echo.
    echo ⏳ Bitte installiere Node.js und starte diesen Installer erneut.
    pause
    exit
)

REM Check npm
npm --version >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ npm ist verfügbar
    npm --version
) else (
    echo ❌ npm nicht gefunden!
    pause
    exit
)

echo.
echo 📦 INSTALLATION STARTEN...
echo ========================================================

REM Create installation directory
set INSTALL_DIR=%USERPROFILE%\JunoSixteen
if not exist "%INSTALL_DIR%" (
    mkdir "%INSTALL_DIR%"
    echo ✅ Installationsverzeichnis erstellt: %INSTALL_DIR%
)

REM Copy files to installation directory
echo 📁 Kopiere Dateien...
robocopy "%~dp0" "%INSTALL_DIR%" /E /XD node_modules .git /XF *.log *.tmp >nul 2>&1

cd /d "%INSTALL_DIR%"

echo.
echo 🔧 DEPENDENCIES INSTALLIEREN...
echo ========================================================

REM Install main dependencies
echo 📦 Installiere Haupt-Dependencies...
call npm install --silent

REM Install Electron dependencies
echo 🖥️ Installiere Electron...
call npm install electron electron-builder --save-dev --silent

REM Install production dependencies
echo ⚡ Installiere Production-Dependencies...
call npm install express cors helmet compression --save --silent
call npm install firebase-admin @google/generative-ai --save --silent
call npm install axios uuid validator --save --silent

echo.
echo 🎮 FRONTEND SETUP...
echo ========================================================

REM Setup React Native frontend (if needed)
if exist "frontend\JunoApp" (
    echo 📱 Setup React Native Frontend...
    cd frontend\JunoApp
    call npm install --silent
    cd ..\..
)

REM Setup mobile app (if needed)
if exist "mobile" (
    echo 📱 Setup Mobile Dependencies...
    cd mobile
    call npm install --silent
    cd ..
)

echo.
echo 🔥 QUESTION POOLS GENERIEREN...
echo ========================================================

REM Generate question pools for all areas
echo 📚 Generiere Fragen-Pools...
if exist "generate-question-pools.js" (
    node generate-question-pools.js
    echo ✅ Question Pools generiert
) else (
    echo ⚠️  Question-Generator nicht gefunden, verwende Demo-Daten
)

echo.
echo 🖥️ DESKTOP APP ERSTELLEN...
echo ========================================================

REM Build Electron App
echo 🔨 Baue Desktop-Anwendung...
call npx electron-builder --win --publish=never

echo.
echo 🎯 SHORTCUTS ERSTELLEN...
echo ========================================================

REM Create Desktop Shortcuts
set DESKTOP=%USERPROFILE%\Desktop

REM JunoSixteen Demo Shortcut
echo @echo off > "%DESKTOP%\JunoSixteen Demo.bat"
echo cd /d "%INSTALL_DIR%" >> "%DESKTOP%\JunoSixteen Demo.bat"
echo start "JunoSixteen Server" cmd /k "node demo-server.js" >> "%DESKTOP%\JunoSixteen Demo.bat"
echo timeout /t 3 ^>nul >> "%DESKTOP%\JunoSixteen Demo.bat"
echo start "JunoSixteen Desktop" npm run electron >> "%DESKTOP%\JunoSixteen Demo.bat"
echo timeout /t 3 ^>nul >> "%DESKTOP%\JunoSixteen Demo.bat"
echo start "" "http://localhost:3000" >> "%DESKTOP%\JunoSixteen Demo.bat"

REM JunoSixteen Production Shortcut
echo @echo off > "%DESKTOP%\JunoSixteen Production.bat"
echo cd /d "%INSTALL_DIR%" >> "%DESKTOP%\JunoSixteen Production.bat"
echo start "JunoSixteen Production" cmd /k "node server-production.js" >> "%DESKTOP%\JunoSixteen Production.bat"
echo timeout /t 5 ^>nul >> "%DESKTOP%\JunoSixteen Production.bat"
echo start "" "http://localhost:3000" >> "%DESKTOP%\JunoSixteen Production.bat"

REM JunoSixteen Quiz Demo Shortcut
echo @echo off > "%DESKTOP%\JunoSixteen Quiz.bat"
echo cd /d "%INSTALL_DIR%" >> "%DESKTOP%\JunoSixteen Quiz.bat"
echo start "JunoSixteen Quiz" cmd /k "node demo-server.js" >> "%DESKTOP%\JunoSixteen Quiz.bat"
echo timeout /t 3 ^>nul >> "%DESKTOP%\JunoSixteen Quiz.bat"
echo start "" "http://localhost:3000/demo-quiz.html" >> "%DESKTOP%\JunoSixteen Quiz.bat"

echo ✅ Desktop-Shortcuts erstellt

echo.
echo 🎨 BROWSER-LINKS ERSTELLEN...
echo ========================================================

REM Create Browser bookmark file
echo ^<!DOCTYPE NETSCAPE-Bookmark-file-1^> > "%DESKTOP%\JunoSixteen-Bookmarks.html"
echo ^<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8"^> >> "%DESKTOP%\JunoSixteen-Bookmarks.html"
echo ^<TITLE^>JunoSixteen Bookmarks^</TITLE^> >> "%DESKTOP%\JunoSixteen-Bookmarks.html"
echo ^<H1^>JunoSixteen - Quick Links^</H1^> >> "%DESKTOP%\JunoSixteen-Bookmarks.html"
echo ^<DL^>^<p^> >> "%DESKTOP%\JunoSixteen-Bookmarks.html"
echo     ^<DT^>^<A HREF="http://localhost:3000"^>🏠 JunoSixteen Hauptseite^</A^> >> "%DESKTOP%\JunoSixteen-Bookmarks.html"
echo     ^<DT^>^<A HREF="http://localhost:3000/demo-quiz.html"^>🎯 Interactive Quiz Demo^</A^> >> "%DESKTOP%\JunoSixteen-Bookmarks.html"
echo     ^<DT^>^<A HREF="http://localhost:3000/demo-dashboard.html"^>📊 KI Dashboard^</A^> >> "%DESKTOP%\JunoSixteen-Bookmarks.html"
echo     ^<DT^>^<A HREF="http://localhost:3000/standalone-demo.html"^>🚀 Standalone Demo^</A^> >> "%DESKTOP%\JunoSixteen-Bookmarks.html"
echo ^</DL^>^<p^> >> "%DESKTOP%\JunoSixteen-Bookmarks.html"

echo ✅ Browser-Bookmarks erstellt

echo.
echo 📋 KONFIGURATION...
echo ========================================================

REM Create configuration file
echo { > "%INSTALL_DIR%\config\install-config.json"
echo   "installation_date": "%DATE% %TIME%", >> "%INSTALL_DIR%\config\install-config.json"
echo   "installation_path": "%INSTALL_DIR%", >> "%INSTALL_DIR%\config\install-config.json"
echo   "version": "1.0.0", >> "%INSTALL_DIR%\config\install-config.json"
echo   "features": [ >> "%INSTALL_DIR%\config\install-config.json"
echo     "Desktop App", >> "%INSTALL_DIR%\config\install-config.json"
echo     "Web Demo", >> "%INSTALL_DIR%\config\install-config.json"
echo     "TTS Support", >> "%INSTALL_DIR%\config\install-config.json"
echo     "Offline Mode", >> "%INSTALL_DIR%\config\install-config.json"
echo     "Multi-Language", >> "%INSTALL_DIR%\config\install-config.json"
echo     "Firebase Auth" >> "%INSTALL_DIR%\config\install-config.json"
echo   ] >> "%INSTALL_DIR%\config\install-config.json"
echo } >> "%INSTALL_DIR%\config\install-config.json"

echo ✅ Konfiguration gespeichert

echo.
echo 🔧 WINDOWS REGISTRY EINTRÄGE...
echo ========================================================

REM Add to Windows Programs (optional)
reg add "HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Uninstall\JunoSixteen" /v "DisplayName" /t REG_SZ /d "JunoSixteen - Gamified Learning Platform" /f >nul 2>&1
reg add "HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Uninstall\JunoSixteen" /v "InstallLocation" /t REG_SZ /d "%INSTALL_DIR%" /f >nul 2>&1
reg add "HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Uninstall\JunoSixteen" /v "DisplayVersion" /t REG_SZ /d "1.0.0" /f >nul 2>&1

echo ✅ Registry-Einträge erstellt

echo.
echo 🎉 INSTALLATION ABGESCHLOSSEN!
echo ████████████████████████████████████████████████████████████████
echo █                                                              █
echo █                  ✅ JUNOSIXTEEN INSTALLIERT                  █
echo █                                                              █
echo █  📍 Installiert in: %INSTALL_DIR%
echo █                                                              █
echo █  🚀 VERFÜGBARE OPTIONEN:                                     █
echo █                                                              █
echo █  1️⃣  Desktop-App:     Doppelklick "JunoSixteen Demo"        █
echo █  2️⃣  Quiz-Demo:       Doppelklick "JunoSixteen Quiz"        █
echo █  3️⃣  Production:      Doppelklick "JunoSixteen Production"  █
echo █  4️⃣  Browser:         http://localhost:3000                 █
echo █                                                              █
echo █  📚 FEATURES VERFÜGBAR:                                      █
echo █  • 🤖 KI-Integration (UL + MCP)                             █
echo █  • 🎮 Gamification mit 10 Leveln                           █
echo █  • 🌍 7 Sprachen                                           █
echo █  • 📱 Offline-Funktionalität                               █
echo █  • 🔊 Sprachausgabe                                        █
echo █  • 🌱 Freiwillige Lernpfade                                █
echo █  • 🏆 Zertifikate & Audit-Trails                          █
echo █                                                              █
echo ████████████████████████████████████████████████████████████████

echo.
echo 🎯 QUICK-START:
echo ========================================================
echo 1. Doppelklicke auf "JunoSixteen Demo" auf dem Desktop
echo 2. Warte 10 Sekunden bis Server startet
echo 3. Browser öffnet automatisch
echo 4. Teste alle Features!

echo.
echo 📞 SUPPORT:
echo ========================================================
echo • Installation: %INSTALL_DIR%
echo • Logs: %INSTALL_DIR%\logs\
echo • Config: %INSTALL_DIR%\config\
echo • Desktop-Shortcuts: %DESKTOP%

echo.
set /p START_NOW="🚀 JunoSixteen jetzt starten? (j/n): "

if /i "%START_NOW%"=="j" (
    echo.
    echo 🔥 STARTE JUNOSIXTEEN...
    start "JunoSixteen Demo Server" cmd /k "cd /d %INSTALL_DIR% && node demo-server.js"
    timeout /t 5 >nul
    start "" "http://localhost:3000"
    echo ✅ JunoSixteen gestartet!
    echo 🌐 Browser öffnet in 5 Sekunden...
)

echo.
echo 🎉 Installation erfolgreich abgeschlossen!
echo 📧 Viel Spaß mit JunoSixteen!
echo.
pause 