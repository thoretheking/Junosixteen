@echo off
echo 🚀 JunoSixteen Demo Deployment
echo ==============================

echo.
echo Wählen Sie eine Deployment-Option:
echo.
echo 1. GitHub Pages (Kostenlos, öffentlich)
echo 2. Netlify (Kostenlos, einfach)
echo 3. Lokales Netzwerk (Firmen-intern)
echo 4. Zip-Paket für Team erstellen
echo.

set /p choice="Ihre Wahl (1-4): "

if "%choice%"=="1" goto github
if "%choice%"=="2" goto netlify  
if "%choice%"=="3" goto network
if "%choice%"=="4" goto zip

:github
echo.
echo 📁 GitHub Pages Setup:
echo 1. GitHub Repository erstellen
echo 2. Dateien hochladen: demo-quiz.html, demo-dashboard.html
echo 3. Settings → Pages → Source: Deploy from branch
echo 4. URL teilen: https://username.github.io/repo-name
echo.
echo ✅ Team-Zugriff: Öffentliche URL
pause
goto end

:netlify
echo.
echo 🌐 Netlify Deployment:
echo 1. https://netlify.com besuchen
echo 2. Ordner mit HTML-Dateien drag & drop
echo 3. Automatische URL erhalten
echo 4. URL mit Team teilen
echo.
echo ✅ Team-Zugriff: Custom URL (z.B. junosixteen-demo.netlify.app)
pause
goto end

:network
echo.
echo 🏢 Lokales Netzwerk Setup:
echo 1. Demo-Server starten: node demo-server.js
echo 2. IP-Adresse finden: ipconfig
echo 3. Port 3000 freigeben in Firewall
echo 4. Team-Zugriff: http://IHR-IP:3000
echo.
echo ⚠️  Nur im gleichen Netzwerk erreichbar
pause
goto end

:zip
echo.
echo 📦 Erstelle Team-Paket...

if not exist "JunoSixteen-Team-Demo" mkdir "JunoSixteen-Team-Demo"

copy "demo-quiz.html" "JunoSixteen-Team-Demo\"
copy "demo-dashboard.html" "JunoSixteen-Team-Demo\"
copy "demo-server.js" "JunoSixteen-Team-Demo\"
copy "quick-demo.js" "JunoSixteen-Team-Demo\"
copy "TEAM-SETUP.md" "JunoSixteen-Team-Demo\"
copy "package.json" "JunoSixteen-Team-Demo\"

echo.
echo ✅ Team-Paket erstellt in: JunoSixteen-Team-Demo\
echo.
echo 📤 Nächste Schritte:
echo 1. Ordner "JunoSixteen-Team-Demo" komprimieren
echo 2. ZIP-Datei an Team senden
echo 3. Team folgt TEAM-SETUP.md Anleitung
echo.

:end
echo.
echo 🎉 Deployment abgeschlossen!
pause 