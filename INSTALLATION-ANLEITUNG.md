# 🚀 JunoSixteen - PC Installation für Windows

## 📋 Schnellstart

### 1️⃣ **Einfache Installation (Empfohlen)**
```bash
# Rechtsklick auf "JunoSixteen-Windows-Installer.bat" → "Als Administrator ausführen"
# Folge den Anweisungen
# Fertig! 🎉
```

---

## 🔧 Systemvoraussetzungen

### **Mindestanforderungen:**
- ✅ **Windows 10/11** (64-bit)
- ✅ **4 GB RAM** (8 GB empfohlen)
- ✅ **2 GB freier Speicherplatz**
- ✅ **Internetverbindung** (für Installation)

### **Software-Abhängigkeiten:**
- 📦 **Node.js 18+** (wird automatisch heruntergeladen)
- 🔧 **npm** (wird mit Node.js mitgeliefert)

---

## 🎯 Installationsprozess

### **Schritt 1: Installer ausführen**
1. **Rechtsklick** auf `JunoSixteen-Windows-Installer.bat`
2. **"Als Administrator ausführen"** wählen
3. Bei Windows-Sicherheitswarnung: **"Trotzdem ausführen"**

### **Schritt 2: System-Check**
```
🔍 SYSTEM-CHECK...
✅ Node.js ist installiert (v18.17.1)
✅ npm ist verfügbar (v9.6.7)
```

### **Schritt 3: Installation**
```
📦 INSTALLATION STARTEN...
✅ Installationsverzeichnis erstellt: C:\Users\[IhrName]\JunoSixteen
📁 Kopiere Dateien...
🔧 Dependencies installieren...
🎮 Frontend Setup...
🔥 Question Pools generieren...
🖥️ Desktop App erstellen...
🎯 Shortcuts erstellen...
```

### **Schritt 4: Desktop-Integration**
Der Installer erstellt automatisch:
- 🖥️ **"JunoSixteen Demo.bat"** - Vollständige Demo
- 🎯 **"JunoSixteen Quiz.bat"** - Direkter Quiz-Start
- ⚡ **"JunoSixteen Production.bat"** - Production-Server
- 📋 **"JunoSixteen-Bookmarks.html"** - Browser-Lesezeichen

---

## 🎮 Nach der Installation

### **Option 1: Desktop-App starten**
```bash
# Doppelklick auf "JunoSixteen Demo" auf dem Desktop
# Wartet automatisch bis Server läuft
# Öffnet Browser und Desktop-App
```

### **Option 2: Browser-Version**
```bash
# Doppelklick auf "JunoSixteen Quiz"
# Öffnet direkten Quiz im Browser
# http://localhost:3000/demo-quiz.html
```

### **Option 3: Production-Modus**
```bash
# Doppelklick auf "JunoSixteen Production"
# Vollständiger Server mit allen Features
# http://localhost:3000
```

---

## 📂 Installationsverzeichnis

```
C:\Users\[IhrName]\JunoSixteen\
├── 📁 frontend/           # React Native App
├── 📁 mobile/             # Mobile App Dateien
├── 📁 config/             # Konfigurationsdateien
├── 📁 routes/             # API-Endpunkte
├── 📁 question-pools/     # Generierte Fragen
├── 📁 dist/              # Desktop App Build
├── 📄 demo-server.js      # Demo-Server
├── 📄 server-production.js # Production-Server
├── 📄 electron-main.js    # Desktop App
└── 📄 package.json        # Dependencies
```

---

## 🔧 Verfügbare Features

### **🤖 KI-Integration**
- **UL (Unsupervised Learning):** Automatische Lerntyp-Erkennung
- **MCP (Machine Control Program):** Adaptive Fragengenerierung mit Gemini AI
- **Real-time Clustering:** 3 Lerntypen (A/B/C)

### **🎮 Gamification**
- **10-Level-System** mit progressiven Schwierigkeiten
- **Risiko-Fragen** mit Punkteverlust-Mechanik
- **Team-Fragen** für Gruppenlernen
- **Badges & Zertifikate** mit Hash-Validierung

### **🌍 Mehrsprachigkeit**
- **7 Sprachen:** DE, EN, ES, FR, IT, PT, NL
- **Automatische Übersetzung** aller Inhalte
- **Kulturelle Anpassungen** für verschiedene Regionen

### **📱 Cross-Platform**
- **Desktop App** (Electron)
- **Web-Demo** (Browser)
- **Mobile Ready** (React Native)
- **Offline-Modus** mit Synchronisation

### **🔊 Barrierefreiheit**
- **Text-to-Speech** für alle Inhalte
- **Accessibility Labels** für Screen Reader
- **Große Buttons** und klare Kontraste
- **Tastatur-Navigation** unterstützt

### **🌱 Freiwilliges Lernen**
- **Keine Deadlines** oder Zeitdruck
- **Pausierbare Pfade** jederzeit
- **Privates Lernjournal** ohne Bewertung
- **Tägliche Lernimpulse** optional

---

## 🚨 Troubleshooting

### **Problem: Node.js nicht gefunden**
```bash
# Lösung 1: Automatischer Download
# Der Installer öffnet automatisch nodejs.org
# Installiere Node.js v18.17.1 und starte Installer neu

# Lösung 2: Manueller Download
https://nodejs.org/dist/v18.17.1/node-v18.17.1-x64.msi
```

### **Problem: npm install schlägt fehl**
```bash
# Lösung: Cache leeren
npm cache clean --force
npm install
```

### **Problem: Electron App startet nicht**
```bash
# Lösung: Rebuild Electron
cd C:\Users\[IhrName]\JunoSixteen
npm run electron
```

### **Problem: Port 3000 bereits verwendet**
```bash
# Lösung 1: Anderen Port verwenden
set PORT=3001 && node demo-server.js

# Lösung 2: Prozess beenden
netstat -ano | findstr :3000
taskkill /PID [ProcessID] /F
```

### **Problem: Browser öffnet nicht automatisch**
```bash
# Lösung: Manuell öffnen
http://localhost:3000
http://localhost:3000/demo-quiz.html
```

---

## 🔄 Update/Deinstallation

### **Update:**
```bash
# Installer erneut ausführen
# Überschreibt bestehende Installation
# Behält Konfiguration bei
```

### **Deinstallation:**
```bash
# Option 1: Windows Programme
Einstellungen → Apps → JunoSixteen → Deinstallieren

# Option 2: Manuell
1. Ordner C:\Users\[IhrName]\JunoSixteen löschen
2. Desktop-Shortcuts löschen
3. Registry-Einträge entfernen (optional)
```

---

## 📞 Support & Hilfe

### **Logfiles:**
```
C:\Users\[IhrName]\JunoSixteen\logs\
├── installation.log      # Installations-Log
├── server.log           # Server-Aktivitäten
└── error.log            # Fehlerprotokoll
```

### **Konfiguration:**
```
C:\Users\[IhrName]\JunoSixteen\config\
├── install-config.json  # Installations-Details
├── server-config.json   # Server-Einstellungen
└── user-settings.json   # Benutzer-Präferenzen
```

### **Kontakt:**
- 📧 **Support:** GitHub Issues
- 📚 **Dokumentation:** README-Dateien im Projektordner
- 🌐 **Online-Hilfe:** http://localhost:3000/help

---

## 🎉 Erfolgreiche Installation

Nach erfolgreicher Installation sollten Sie sehen:

```
🎉 INSTALLATION ABGESCHLOSSEN!
████████████████████████████████████████████████████████████████
█                  ✅ JUNOSIXTEEN INSTALLIERT                  █
█                                                              █
█  📚 FEATURES VERFÜGBAR:                                      █
█  • 🤖 KI-Integration (UL + MCP)                             █
█  • 🎮 Gamification mit 10 Leveln                           █
█  • 🌍 7 Sprachen                                           █
█  • 📱 Offline-Funktionalität                               █
█  • 🔊 Sprachausgabe                                        █
█  • 🌱 Freiwillige Lernpfade                                █
█  • 🏆 Zertifikate & Audit-Trails                          █
████████████████████████████████████████████████████████████████
```

**🚀 Viel Spaß mit JunoSixteen!** 