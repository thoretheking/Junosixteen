@echo off
echo ====================================
echo   JunoSixteen Desktop Demo Setup
echo ====================================
echo.

REM Prüfe ob Node.js installiert ist
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo FEHLER: Node.js ist nicht installiert!
    echo Bitte installieren Sie Node.js von https://nodejs.org
    echo.
    pause
    exit /b 1
)

REM Prüfe aktuelle Verzeichnis
if not exist "package.json" (
    echo FEHLER: package.json nicht gefunden!
    echo Stellen Sie sicher, dass Sie sich im richtigen Verzeichnis befinden.
    echo.
    pause
    exit /b 1
)

echo [1/4] Dependencies installieren...
call npm install --silent
if %ERRORLEVEL% NEQ 0 (
    echo FEHLER beim Installieren der Dependencies!
    pause
    exit /b 1
)

echo [2/4] Prüfe ob Electron verfügbar ist...
if not exist "node_modules\.bin\electron.cmd" (
    echo Electron wird nachinstalliert...
    call npm install electron --save-dev
)

echo [3/4] Erstelle Desktop-App ohne Code-Signing...
echo Starte JunoSixteen Desktop Demo...

REM Direkt Electron starten ohne Packaging
call npm start

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo FEHLER beim Starten der App!
    echo Versuche alternativen Start...
    echo.
    
    REM Alternative: Direkt mit Electron
    call npx electron .
    
    if %ERRORLEVEL% NEQ 0 (
        echo Alle Startversuche fehlgeschlagen!
        echo.
        echo DEBUG-Informationen:
        echo - Node.js Version:
        node --version
        echo - NPM Version:
        npm --version
        echo - Verzeichnisinhalt:
        dir
        echo.
        pause
        exit /b 1
    )
)

echo [4/4] App erfolgreich gestartet!
echo.
echo ====================================
echo   Vielen Dank für JunoSixteen!
echo ====================================
echo.
echo Die App läuft jetzt als Desktop-Anwendung.
echo Sie können dieses Fenster schließen.
echo.

REM Erstelle Desktop-Verknüpfung
set SCRIPT_DIR=%~dp0
set DESKTOP=%USERPROFILE%\Desktop
set SHORTCUT_NAME=JunoSixteen Demo

echo Möchten Sie eine Desktop-Verknüpfung erstellen? (j/n)
set /p CREATE_SHORTCUT=

if /i "%CREATE_SHORTCUT%"=="j" (
    echo Erstelle Desktop-Verknüpfung...
    
    REM PowerShell Script für Verknüpfung
    powershell -Command "& {$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%DESKTOP%\%SHORTCUT_NAME%.lnk'); $Shortcut.TargetPath = '%SCRIPT_DIR%JunoSixteen-Desktop-Installer.bat'; $Shortcut.WorkingDirectory = '%SCRIPT_DIR%'; $Shortcut.IconLocation = '%SCRIPT_DIR%assets\icon.ico'; $Shortcut.Description = 'JunoSixteen Gamifizierte Lernplattform'; $Shortcut.Save()}"
    
    if %ERRORLEVEL% EQU 0 (
        echo Desktop-Verknüpfung wurde erstellt!
    ) else (
        echo Warnung: Desktop-Verknüpfung konnte nicht erstellt werden.
    )
)

echo.
echo ====================================
echo   NUTZUNG DER DESKTOP-APP:
echo ====================================
echo.
echo Tastenkürzel:
echo - Ctrl+1/2     : Level wechseln
echo - Ctrl+N       : Neues Spiel
echo - Ctrl+S       : Spielstand speichern
echo - Ctrl+O       : Spielstand laden
echo - F11          : Vollbild
echo - Leertaste    : Frage starten/fortfahren
echo - 1-4 Tasten   : Antworten auswählen
echo.
echo Features:
echo - Offline-Funktionalität
echo - Automatisches Speichern
echo - Vollständige DSGVO-Fragenpools
echo - Memory-Spiel und Minigames
echo - Wissenssnacks-System
echo - Badge-System
echo.

pause 