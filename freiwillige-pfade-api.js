// ===================================================
// 🌱 FREIWILLIGE PFADE API ENDPOINTS
// Integration für server-production.js
// ===================================================

/*
SCHRITT 1: Import erweitern in server-production.js Zeile ~16:
  PERSOENLICHKEIT_PFADE, REFLEXIONSFRAGEN, FREIWILLIGE_PFADE } = require('./question-generator');

SCHRITT 2: Diese Endpoints in server-production.js einfügen (nach den bestehenden APIs):
*/

// ===================================================
// 🌱 FREIWILLIGE PFADE ENDPOINTS
// ===================================================

// Alle freiwilligen Pfade abrufen
app.get('/api/freiwillige-pfade', authenticateToken, (req, res) => {
  try {
    const player = gameEngine.getPlayer(req.user.id);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Freiwillige Pfade mit Fortschritt anreichern
    const pfadeWithProgress = Object.entries(FREIWILLIGE_PFADE).map(([titel, pfad]) => {
      const playerPfad = player.freiwilligePfade?.[pfad.id] || {};
      
      return {
        id: pfad.id,
        titel,
        typ: pfad.typ,
        kategorie: pfad.kategorie,
        beschreibung: pfad.beschreibung,
        eigenschaften: pfad.eigenschaften,
        motivation: pfad.motivation,
        
        // Fortschrittsinformationen
        gestartet: playerPfad.gestartet || false,
        letzter_besuch: playerPfad.letzter_besuch || null,
        fortschritt: playerPfad.fortschritt || 0,
        abgeschlossene_module: playerPfad.abgeschlossene_module || [],
        
        // Spezifische Inhalte je nach Pfad-Typ
        module: pfad.module || pfad.szenarien || pfad.funktionen || pfad.bereiche || pfad.formate || [],
        
        // Belohnungsinformationen
        belohnung: pfad.belohnung,
        
        // Verfügbarkeitsstatus
        verfügbar: true, // Freiwillige Pfade sind immer verfügbar
        empfohlen: playerPfad.empfohlen || false
      };
    });

    res.json({
      success: true,
      freiwillige_pfade: pfadeWithProgress,
      total: Object.keys(FREIWILLIGE_PFADE).length,
      philosophy: {
        titel: "Lernen ohne Zwang",
        beschreibung: "Entdecke, lerne und wachse in deinem eigenen Tempo - ohne Deadlines, ohne Druck, nur aus intrinsischer Motivation.",
        prinzipien: [
          "Keine Deadlines oder Zeitdruck",
          "Freie Reihenfolge und Pausierung möglich", 
          "Wiederholung jederzeit erlaubt",
          "Persönliche Reflexion ohne Bewertung",
          "Neugier als einziger Kompass"
        ]
      }
    });

  } catch (error) {
    console.error('Error fetching freiwillige pfade:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Bestimmten freiwilligen Pfad starten
app.post('/api/freiwillige-pfade/:pfadId/start', authenticateToken, (req, res) => {
  try {
    const { pfadId } = req.params;
    const player = gameEngine.getPlayer(req.user.id);
    
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const pfad = Object.values(FREIWILLIGE_PFADE).find(p => p.id === pfadId);
    if (!pfad) {
      return res.status(404).json({ error: 'Freiwilliger Pfad nicht gefunden' });
    }

    // Initialisiere freiwillige Pfade im Player-Objekt
    if (!player.freiwilligePfade) {
      player.freiwilligePfade = {};
    }

    // Starte den Pfad (ohne Zwang)
    player.freiwilligePfade[pfadId] = {
      gestartet: true,
      start_datum: new Date().toISOString(),
      letzter_besuch: new Date().toISOString(),
      fortschritt: 0,
      abgeschlossene_module: [],
      reflexionen: [],
      pausiert: false,
      beliebig_unterbrechbar: true
    };

    // Sanfte XP-Belohnung für den Start (optional)
    if (pfad.belohnung?.typ !== 'ohne_bewertung') {
      gameEngine.updatePlayerActivity(req.user.id);
      player.experience += 25; // Kleine Motivationsbelohnung
    }

    res.json({
      success: true,
      message: `Freiwilliger Pfad "${pfad.titel || Object.keys(FREIWILLIGE_PFADE).find(k => FREIWILLIGE_PFADE[k].id === pfadId)}" gestartet`,
      pfad_status: player.freiwilligePfade[pfadId],
      motivation: pfad.motivation,
      naechste_schritte: {
        titel: "Du bestimmst das Tempo",
        beschreibung: "Beginne wann du möchtest, pausiere wenn nötig, wiederhole was dir gefällt.",
        keine_deadline: true
      }
    });

  } catch (error) {
    console.error('Error starting freiwilliger pfad:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Fortschritt in freiwilligem Pfad speichern (ohne Bewertung)
app.post('/api/freiwillige-pfade/:pfadId/progress', authenticateToken, (req, res) => {
  try {
    const { pfadId } = req.params;
    const { modulId, reflexion, zeitVerbracht, eigene_notizen } = req.body;
    const player = gameEngine.getPlayer(req.user.id);
    
    if (!player || !player.freiwilligePfade?.[pfadId]) {
      return res.status(404).json({ error: 'Pfad nicht gefunden oder nicht gestartet' });
    }

    const pfadProgress = player.freiwilligePfade[pfadId];
    
    // Aktualisiere Besuchszeit
    pfadProgress.letzter_besuch = new Date().toISOString();
    
    // Speichere Modul-Fortschritt (falls vorhanden)
    if (modulId && !pfadProgress.abgeschlossene_module.includes(modulId)) {
      pfadProgress.abgeschlossene_module.push(modulId);
      pfadProgress.fortschritt = Math.min(100, pfadProgress.abgeschlossene_module.length * 20);
    }

    // Speichere Reflexionen (privat, ohne Bewertung)
    if (reflexion) {
      if (!pfadProgress.reflexionen) pfadProgress.reflexionen = [];
      pfadProgress.reflexionen.push({
        datum: new Date().toISOString(),
        reflexion,
        privat: true,
        bewertet: false
      });
    }

    // Speichere eigene Notizen (nur lokal)
    if (eigene_notizen) {
      pfadProgress.eigene_notizen = eigene_notizen;
    }

    // Zeit tracking (optional)
    if (zeitVerbracht) {
      pfadProgress.zeit_verbracht = (pfadProgress.zeit_verbracht || 0) + zeitVerbracht;
    }

    // Sanfte XP-Belohnung (nur wenn gewünscht)
    const pfad = Object.values(FREIWILLIGE_PFADE).find(p => p.id === pfadId);
    if (pfad?.belohnung?.typ !== 'ohne_bewertung' && modulId) {
      player.experience += 10; // Sehr kleine Anerkennung
    }

    res.json({
      success: true,
      message: "Fortschritt gespeichert - ohne Bewertung oder Zwang",
      pfad_status: pfadProgress,
      motivation: {
        titel: "Gut gemacht!",
        beschreibung: "Du folgst deiner Neugier - das ist der beste Weg zu lernen.",
        reminder: "Du kannst jederzeit pausieren oder zu anderen Themen wechseln."
      }
    });

  } catch (error) {
    console.error('Error saving progress for freiwilliger pfad:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Pfad pausieren (explizite Pause-Funktion)
app.post('/api/freiwillige-pfade/:pfadId/pause', authenticateToken, (req, res) => {
  try {
    const { pfadId } = req.params;
    const { grund } = req.body; // Optional: Grund der Pause
    const player = gameEngine.getPlayer(req.user.id);
    
    if (!player?.freiwilligePfade?.[pfadId]) {
      return res.status(404).json({ error: 'Pfad nicht gefunden' });
    }

    const pfadProgress = player.freiwilligePfade[pfadId];
    pfadProgress.pausiert = true;
    pfadProgress.pause_datum = new Date().toISOString();
    pfadProgress.pause_grund = grund || "Persönliche Entscheidung";
    pfadProgress.letzter_besuch = new Date().toISOString();

    res.json({
      success: true,
      message: "Pfad pausiert - du kannst jederzeit zurückkehren",
      motivation: {
        titel: "Pause ist völlig in Ordnung",
        beschreibung: "Echtes Lernen braucht manchmal Reflexionszeit. Kehre zurück, wann du bereit bist.",
        kein_zeitdruck: true
      },
      pfad_status: pfadProgress
    });

  } catch (error) {
    console.error('Error pausing freiwilliger pfad:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Tagesimpuls abrufen (für "Tägliche Wissensimpulse")
app.get('/api/tagesimpuls', authenticateToken, (req, res) => {
  try {
    const player = gameEngine.getPlayer(req.user.id);
    const heute = new Date().toDateString();
    
    // Prüfe, ob heute bereits ein Impuls abgerufen wurde
    const tagesimpulse = player.tagesimpulse || {};
    const heutigerImpuls = tagesimpulse[heute];

    if (heutigerImpuls) {
      return res.json({
        success: true,
        impuls: heutigerImpuls,
        bereits_besucht: true,
        message: "Du kannst den heutigen Impuls gerne nochmal anschauen oder zu anderen Themen wechseln."
      });
    }

    // Wähle zufälligen Impuls aus verfügbaren Quellen
    const verfügbareImpulse = [
      ...Object.values(WISSENSSNACKS),
      ...Object.values(REFLEXIONSFRAGEN.allgemein).map(frage => ({
        id: 'reflexion_' + Date.now(),
        typ: 'reflexion',
        titel: 'Tägliche Reflexion',
        content: { reflexion: frage }
      }))
    ];

    const zufälligerImpuls = verfügbareImpulse[Math.floor(Math.random() * verfügbareImpulse.length)];
    
    // Speichere als heutigen Impuls (ohne Zwang zur Bearbeitung)
    if (!player.tagesimpulse) player.tagesimpulse = {};
    player.tagesimpulse[heute] = {
      ...zufälligerImpuls,
      datum: heute,
      abgerufen: new Date().toISOString(),
      freiwillig: true,
      deadline: null // Explizit keine Deadline
    };

    res.json({
      success: true,
      impuls: player.tagesimpulse[heute],
      motivation: {
        titel: "Dein heutiger Lernimpuls",
        beschreibung: "Ein kleiner Denkanstoß für heute - ganz ohne Verpflichtung.",
        hinweis: "Du entscheidest, ob und wann du ihn bearbeitest."
      }
    });

  } catch (error) {
    console.error('Error fetching tagesimpuls:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Lernjournal-Einträge abrufen (privat)
app.get('/api/lernjournal', authenticateToken, (req, res) => {
  try {
    const player = gameEngine.getPlayer(req.user.id);
    const journalEinträge = player.lernjournal || [];

    res.json({
      success: true,
      journal_einträge: journalEinträge,
      total: journalEinträge.length,
      privat: true,
      hinweis: "Diese Einträge sind nur für dich sichtbar und werden nicht bewertet.",
      motivation: {
        titel: "Dein persönliches Lernjournal",
        beschreibung: "Hier kannst du deine Gedanken und Erkenntnisse sammeln - ganz für dich allein."
      }
    });

  } catch (error) {
    console.error('Error fetching lernjournal:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Lernjournal-Eintrag hinzufügen
app.post('/api/lernjournal', authenticateToken, (req, res) => {
  try {
    const { titel, inhalt, kategorie, stimmung } = req.body;
    const player = gameEngine.getPlayer(req.user.id);

    if (!player.lernjournal) player.lernjournal = [];

    const neuerEintrag = {
      id: Date.now().toString(),
      datum: new Date().toISOString(),
      titel: titel || "Lernreflexion",
      inhalt,
      kategorie: kategorie || "allgemein",
      stimmung: stimmung || null,
      privat: true,
      bewertet: false,
      editierbar: true
    };

    player.lernjournal.unshift(neuerEintrag); // Neueste zuerst

    res.json({
      success: true,
      eintrag: neuerEintrag,
      message: "Eintrag gespeichert - nur für dich sichtbar",
      motivation: {
        titel: "Reflexion ist wertvoll",
        beschreibung: "Du dokumentierst deine Lernreise. Das hilft beim Verstehen und Behalten.",
        reminder: "Du kannst diesen Eintrag jederzeit bearbeiten oder löschen."
      }
    });

  } catch (error) {
    console.error('Error adding lernjournal entry:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/*
INTEGRATION-ANLEITUNG:

1. Füge FREIWILLIGE_PFADE zum Import in server-production.js hinzu (Zeile ~16)
2. Kopiere diese API-Endpoints in server-production.js (vor dem app.listen am Ende)
3. Erweitere das GameEngine um freiwillige Pfade Support:
   - player.freiwilligePfade = {}
   - player.tagesimpulse = {}
   - player.lernjournal = []
4. Teste die neuen Endpoints:
   - GET /api/freiwillige-pfade
   - POST /api/freiwillige-pfade/:id/start
   - GET /api/tagesimpuls
   - GET /api/lernjournal
*/ 