# 🖥️ JunoSixteen Desktop Installation

**Installationsanleitung für die JunoSixteen Desktop Demo App**

---

## 📋 **Systemanforderungen**

- **Windows 10/11** (64-bit)
- **Node.js 18+** (Download: https://nodejs.org)
- **4 GB RAM** (empfohlen)
- **500 MB freier Speicherplatz**
- **Internetverbindung** (nur für Installation)

---

## 🚀 **Schnellinstallation (Empfohlen)**

### **Option 1: Ein-Klick Installation**

1. **Doppelklick** auf `JunoSixteen-Desktop-Installer.bat`
2. **Folgen Sie den Anweisungen** im Terminal
3. **Fertig!** - Die App startet automatisch

### **Was passiert automatisch:**
- ✅ Dependency-Installation
- ✅ Electron-Setup
- ✅ App-Start
- ✅ Desktop-Verknüpfung (optional)

---

## 🔧 **Manuelle Installation**

### **Schritt 1: Dependencies installieren**
```bash
npm install
```

### **Schritt 2: App starten**
```bash
npm start
```

### **Schritt 3: Alternative Startmethoden**
```bash
# Falls npm start nicht funktioniert:
npx electron .

# Oder direkt:
.\node_modules\.bin\electron.cmd .
```

---

## 🎮 **Nutzung der Desktop-App**

### **Tastenkürzel**
| Tastenkombination | Funktion |
|-------------------|----------|
| `Ctrl + 1` | Level 1 auswählen |
| `Ctrl + 2` | Level 2 auswählen |
| `Ctrl + N` | Neues Spiel starten |
| `Ctrl + S` | Spielstand speichern |
| `Ctrl + O` | Spielstand laden |
| `Ctrl + R` | App neu laden |
| `F11` | Vollbild ein/aus |
| `Leertaste` | Frage starten/fortfahren |
| `1-4 Tasten` | Antworten auswählen |
| `Ctrl + Q` | App beenden |

### **Menü-Funktionen**
- **Spiel-Menü:** Neues Spiel, Level-Wechsel, Vollbild
- **Ansicht-Menü:** Zoom, Developer Tools, Neu laden
- **Hilfe-Menü:** Tastenkürzel, Spielregeln

---

## 💾 **Speichern & Laden**

### **Automatisches Speichern**
- Nach jedem abgeschlossenen Level
- Beim Beenden der App
- Bei Risikofragen-Erfolg

### **Manuelles Speichern**
1. **Ctrl + S** drücken oder **Datei > Speichern**
2. **Speicherort wählen** (empfohlen: Desktop)
3. **Dateiname eingeben** (z.B. "mein-spielstand.json")

### **Spielstand laden**
1. **Ctrl + O** drücken oder **Datei > Laden**
2. **JSON-Datei auswählen**
3. **Spielstand wird wiederhergestellt**

---

## 🎯 **Features der Desktop-Version**

### **Offline-Funktionalität**
- ✅ Vollständig offline nutzbar
- ✅ Keine Internetverbindung erforderlich
- ✅ Lokale Datenspeicherung

### **Enhanced UI**
- 🎨 **Glasmorphismus-Design** mit Blur-Effekten
- ⚡ **Animationen** für alle Interaktionen
- 🌈 **Gradient-Backgrounds** und Glow-Effekte
- 📱 **Responsive Layout** für verschiedene Bildschirmgrößen

### **Desktop-spezifische Features**
- 🔔 **Native Benachrichtigungen**
- 💾 **Dateisystem-Integration** für Speichern/Laden
- ⌨️ **Vollständige Tastatursteuerung**
- 🖥️ **Multi-Monitor Support**
- 🔄 **Auto-Updates** (vorbereitet)

---

## 🎮 **Spielfunktionen**

### **Level-System**
- **Level 1 (Rookie):** 10 DSGVO-Grundlagen Fragen
- **Level 2 (Explorer):** 10 Erweiterte DSGVO-Fragen
- **Progressives Punktsystem:** Level × 50 × Fragennummer

### **Fragentypen**
- **🟢 Standard:** Bei Fehler → Punktabzug + neue Frage
- **🔴 Risiko:** 2 Teilfragen, bei Fehler → Level-Neustart
- **🔵 Team:** Kollaborative Fragen mit Verdreifachung

### **Badge-System**
- 🎉 **Erste Antwort** - Willkommen!
- 🧠 **Quiz Master** - 5 richtige in Folge
- ⚡ **Risk Master** - Risikofrage gemeistert
- 🎮 **Minigame Pro** - Minigame gewonnen
- 🤝 **Team Player** - Teamfrage erfolgreich
- 🏆 **Level Master** - Level abgeschlossen

### **Minigames**
- 🧠 **Memory Cards** - Vollständig spielbar
- 🔤 **Word Scramble** - Demo-Version
- ⚡ **Reaction Test** - Demo-Version
- 🧩 **Puzzle Slider** - Demo-Version

### **Wissenssnacks**
- 🍎 **QUICK (2-3 Min.):** Datenschutz-Grundlagen
- 🍎 **SHORT (5-7 Min.):** E-Mail-Etikette
- 🍎 **MEDIUM (10-15 Min.):** DSGVO-Umsetzung

---

## 🔧 **Problemlösung**

### **App startet nicht**
1. **Node.js aktualisieren:** https://nodejs.org
2. **Dependencies neu installieren:** `npm install --force`
3. **Cache leeren:** `npm cache clean --force`
4. **Als Administrator ausführen**

### **Fehler beim Build**
1. **Installer-Script verwenden:** `JunoSixteen-Desktop-Installer.bat`
2. **Direkt starten:** `npm start` (kein Build nötig)
3. **Alternative:** `npx electron .`

### **Performance-Probleme**
1. **Hardware-Beschleunigung aktivieren**
2. **Andere Programme schließen**
3. **App neu starten:** `Ctrl + R`

### **Tastenkürzel funktionieren nicht**
1. **App-Fokus sicherstellen** (Klick in App-Fenster)
2. **Entwicklertools schließen:** `Ctrl + Shift + I`
3. **App neu laden:** `Ctrl + R`

---

## 📁 **Dateistruktur**

```
junosixteen/
├── main.js                          # Electron-Hauptprozess
├── renderer/
│   ├── index.html                   # App-UI
│   └── game-logic.js               # Spiellogik
├── assets/
│   └── icon.ico                    # App-Icon
├── package.json                    # App-Konfiguration
├── JunoSixteen-Desktop-Installer.bat # Ein-Klick Installer
└── INSTALLATION-DESKTOP.md         # Diese Anleitung
```

---

## 🆘 **Support**

### **Bei Problemen:**
1. **Schritt-für-Schritt Neuinstallation** durchführen
2. **Terminal-Ausgabe** auf Fehlermeldungen prüfen
3. **Debug-Informationen** sammeln:
   ```bash
   node --version
   npm --version
   npm list electron
   ```

### **Häufige Lösungen:**
- **"Node.js nicht gefunden"** → Node.js installieren
- **"npm install fehlt"** → `npm install` ausführen
- **"Electron startet nicht"** → `npx electron .` versuchen
- **"App friert ein"** → `Ctrl + R` für Neustart

---

## ✨ **Zusätzliche Features**

### **Geplante Updates**
- 🔄 **Auto-Update-System**
- 🌐 **Online-Synchronisation**
- 🎵 **Sound-Effekte**
- 📊 **Erweiterte Statistiken**
- 🏆 **Leaderboards**

### **Anpassungen**
- **Themes:** Dark/Light Mode umschaltbar
- **Sprachen:** 7 Sprachen geplant
- **Difficulty:** Anpassbare Schwierigkeitsgrade

---

**🚀 Viel Erfolg mit JunoSixteen Desktop!**

*Die Desktop-App bietet die vollständige JunoSixteen-Erfahrung mit nativer Performance und erweiterter Funktionalität.* 