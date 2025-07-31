const express = require('express');
const admin = require('firebase-admin');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const router = express.Router();

const db = admin.firestore();

// Google Gemini AI initialisieren
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

// Themen für verschiedene Module
const MODULE_THEMES = {
  1: { theme: 'Händehygiene und Grundlagen', category: 'hygiene' },
  2: { theme: 'Toiletten-Hygiene', category: 'hygiene' },
  3: { theme: 'Arbeitsplatz-Sicherheit', category: 'safety' },
  4: { theme: 'Teamwork und Kommunikation', category: 'communication' },
  5: { theme: 'RISIKO: Notfall-Situationen', category: 'emergency' },
  6: { theme: 'Qualitätskontrolle', category: 'quality' },
  7: { theme: 'Datenschutz und Compliance', category: 'compliance' },
  8: { theme: 'Kundenservice', category: 'service' },
  9: { theme: 'Führung und Verantwortung', category: 'leadership' },
  10: { theme: 'FINALES RISIKO: Gesamtverständnis', category: 'comprehensive' }
};

// Adaptives Prompt-Template basierend auf Lerntyp
const PROMPT_TEMPLATES = {
  'Typ_A': {
    style: 'analytisch und detailliert',
    approach: 'Fokus auf Fakten und genaue Anweisungen'
  },
  'Typ_B': {
    style: 'praktisch und anwendungsorientiert',
    approach: 'Fokus auf Beispiele aus dem echten Arbeitsalltag'
  },
  'Typ_C': {
    style: 'kreativ und visuell',
    approach: 'Fokus auf bildliche Beschreibungen und Szenarien'
  }
};

// Sprach-spezifische Prompts
const LANGUAGE_PROMPTS = {
  'de': 'auf Deutsch',
  'en': 'in English',
  'es': 'en Español',
  'fr': 'en Français',
  'it': 'in Italiano',
  'pt': 'em Português',
  'nl': 'in het Nederlands'
};

// Adaptive Frage generieren
router.post('/generate-question', async (req, res) => {
  try {
    const { moduleId, level, language = 'de', cluster = 'Typ_A', difficulty = 'medium', isRiskQuestion = false } = req.body;
    
    if (!moduleId || !level) {
      return res.status(400).json({ error: 'ModuleId und Level sind erforderlich' });
    }

    const moduleTheme = MODULE_THEMES[moduleId];
    if (!moduleTheme) {
      return res.status(400).json({ error: 'Ungültiges Modul' });
    }

    const promptTemplate = PROMPT_TEMPLATES[cluster];
    const languagePrompt = LANGUAGE_PROMPTS[language] || 'auf Deutsch';

    // Benutzer-Kontext abrufen
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    const userData = userDoc.data();
    const userRole = userData?.role || 'Mitarbeiter';

    // Schwierigkeitsgrad bestimmen
    const difficultyLevels = {
      'easy': 'einfach verständlich',
      'medium': 'mittlerer Schwierigkeit',
      'hard': 'anspruchsvoll und detailliert'
    };

    // Haupt-Prompt zusammenstellen
    let mainPrompt = `
Erstelle eine Multiple-Choice-Frage zum Thema "${moduleTheme.theme}" für einen ${userRole} 
${languagePrompt}, angepasst an Lerntyp ${cluster} (${promptTemplate.style}).

Anforderungen:
- ${promptTemplate.approach}
- Schwierigkeitsgrad: ${difficultyLevels[difficulty]}
- Level: ${level}/10
- Genau 4 Antwortmöglichkeiten (A, B, C, D)
- Eine richtige Antwort
- Realitätsbezug zum Arbeitsalltag
- ${isRiskQuestion ? 'WICHTIG: Dies ist eine Risiko-Frage - mache die Konsequenzen falscher Antworten deutlich!' : ''}

Antworte im folgenden JSON-Format:
{
  "question": "Die Hauptfrage...",
  "answers": [
    "Antwort A",
    "Antwort B", 
    "Antwort C",
    "Antwort D"
  ],
  "correctAnswer": 0,
  "explanation": "Erklärung warum diese Antwort richtig ist...",
  "level": ${level},
  "moduleId": ${moduleId},
  "category": "${moduleTheme.category}",
  "isRiskQuestion": ${isRiskQuestion}
}
`;

    // Gemini AI anfragen
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(mainPrompt);
    const response = await result.response;
    const generatedText = response.text();

    // JSON aus der Antwort extrahieren
    let questionData;
    try {
      // Versuche JSON zu parsen
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        questionData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Kein JSON gefunden');
      }
    } catch (parseError) {
      console.error('JSON-Parse-Fehler:', parseError);
      // Fallback: Strukturierte Antwort manuell erstellen
      questionData = createFallbackQuestion(moduleId, level, moduleTheme, language);
    }

    // Validierung der generierten Frage
    if (!questionData.question || !questionData.answers || questionData.answers.length !== 4) {
      questionData = createFallbackQuestion(moduleId, level, moduleTheme, language);
    }

    // Zusätzliche Metadaten hinzufügen
    questionData.generatedBy = 'mcp';
    questionData.generatedAt = admin.firestore.FieldValue.serverTimestamp();
    questionData.language = language;
    questionData.cluster = cluster;
    questionData.difficulty = difficulty;
    questionData.userRole = userRole;
    questionData.aiModel = 'gemini-1.5-flash';

    // In Datenbank speichern
    const questionRef = await db.collection('questions').add(questionData);

    // MCP-Statistik aktualisieren
    await db.collection('mcpStats').add({
      uid: req.user.uid,
      questionId: questionRef.id,
      moduleId,
      level,
      cluster,
      language,
      generatedAt: admin.firestore.FieldValue.serverTimestamp(),
      success: true
    });

    res.json({
      success: true,
      questionId: questionRef.id,
      question: questionData,
      meta: {
        generatedBy: 'MCP (Machine Control Program)',
        adaptedFor: cluster,
        language: language,
        difficulty: difficulty
      }
    });

  } catch (error) {
    console.error('MCP-Generation-Fehler:', error);
    
    // Fehler-Statistik
    await db.collection('mcpStats').add({
      uid: req.user.uid,
      moduleId: req.body.moduleId,
      level: req.body.level,
      cluster: req.body.cluster,
      language: req.body.language,
      error: error.message,
      generatedAt: admin.firestore.FieldValue.serverTimestamp(),
      success: false
    });

    res.status(500).json({ 
      error: 'Fehler bei der Fragengenerierung',
      details: error.message 
    });
  }
});

// Fallback-Fragen-Generator
function createFallbackQuestion(moduleId, level, moduleTheme, language) {
  const fallbackQuestions = {
    1: {
      de: {
        question: "Wie lange sollten Sie Ihre Hände mindestens waschen?",
        answers: ["5 Sekunden", "20 Sekunden", "1 Minute", "2 Minuten"],
        correctAnswer: 1,
        explanation: "20 Sekunden ist die empfohlene Mindestdauer für effektives Händewaschen."
      }
    },
    2: {
      de: {
        question: "Was ist nach dem Toilettengang am wichtigsten?",
        answers: ["Handy checken", "Hände waschen", "Kaffee trinken", "E-Mails lesen"],
        correctAnswer: 1,
        explanation: "Händewaschen nach dem Toilettengang ist essentiell für die Hygiene."
      }
    }
  };

  const fallback = fallbackQuestions[moduleId]?.[language] || fallbackQuestions[1][language];
  
  return {
    ...fallback,
    level,
    moduleId,
    category: moduleTheme.category,
    isRiskQuestion: false,
    generatedBy: 'fallback'
  };
}

// Batch-Generierung für Module
router.post('/generate-batch', async (req, res) => {
  try {
    const { moduleId, count = 5, language = 'de', cluster = 'Typ_A' } = req.body;
    
    // Admin-Check
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    if (!userDoc.data()?.isAdmin) {
      return res.status(403).json({ error: 'Admin-Berechtigung erforderlich' });
    }

    const generatedQuestions = [];
    const errors = [];

    for (let i = 0; i < count; i++) {
      try {
        // Zufällige Schwierigkeit und Level
        const difficulties = ['easy', 'medium', 'hard'];
        const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
        const level = Math.min(10, Math.max(1, moduleId + Math.floor(Math.random() * 3) - 1));

        const questionRequest = {
          body: {
            moduleId,
            level,
            language,
            cluster,
            difficulty,
            isRiskQuestion: [5, 10].includes(moduleId) && Math.random() > 0.7
          },
          user: req.user
        };

        // Verwende die gleiche Logik wie generate-question
        const result = await generateSingleQuestion(questionRequest);
        generatedQuestions.push(result);

        // Kurze Pause zwischen Anfragen
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        errors.push({ index: i, error: error.message });
      }
    }

    res.json({
      success: true,
      generated: generatedQuestions.length,
      errors: errors.length,
      questions: generatedQuestions,
      errorDetails: errors
    });

  } catch (error) {
    console.error('Batch-Generation-Fehler:', error);
    res.status(500).json({ error: 'Fehler bei der Batch-Generierung' });
  }
});

// Hilfsfunktion für Einzelfrage-Generierung
async function generateSingleQuestion(req) {
  // Vereinfachte Version der Hauptlogik
  const { moduleId, level, language, cluster, difficulty, isRiskQuestion } = req.body;
  const moduleTheme = MODULE_THEMES[moduleId];
  
  const questionData = createFallbackQuestion(moduleId, level, moduleTheme, language);
  questionData.difficulty = difficulty;
  questionData.cluster = cluster;
  questionData.isRiskQuestion = isRiskQuestion;
  
  const questionRef = await db.collection('questions').add(questionData);
  return { id: questionRef.id, ...questionData };
}

// MCP-Statistiken abrufen
router.get('/stats', async (req, res) => {
  try {
    const { timeframe = '7d' } = req.query;
    
    // Zeitraum berechnen
    const now = new Date();
    const startDate = new Date();
    
    switch (timeframe) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
    }

    // Statistiken abrufen
    const statsSnapshot = await db.collection('mcpStats')
      .where('generatedAt', '>=', admin.firestore.Timestamp.fromDate(startDate))
      .get();

    let totalGenerated = 0;
    let successfulGenerated = 0;
    let byCluster = { 'Typ_A': 0, 'Typ_B': 0, 'Typ_C': 0 };
    let byLanguage = {};
    let byModule = {};

    statsSnapshot.forEach(doc => {
      const data = doc.data();
      totalGenerated++;
      
      if (data.success) {
        successfulGenerated++;
      }
      
      if (data.cluster) {
        byCluster[data.cluster] = (byCluster[data.cluster] || 0) + 1;
      }
      
      if (data.language) {
        byLanguage[data.language] = (byLanguage[data.language] || 0) + 1;
      }
      
      if (data.moduleId) {
        byModule[data.moduleId] = (byModule[data.moduleId] || 0) + 1;
      }
    });

    res.json({
      timeframe,
      totalGenerated,
      successfulGenerated,
      successRate: totalGenerated > 0 ? (successfulGenerated / totalGenerated * 100).toFixed(1) : 0,
      breakdown: {
        byCluster,
        byLanguage,
        byModule
      }
    });

  } catch (error) {
    console.error('MCP-Stats-Fehler:', error);
    res.status(500).json({ error: 'Fehler beim Laden der MCP-Statistiken' });
  }
});

// Qualität einer generierten Frage bewerten
router.post('/rate-question', async (req, res) => {
  try {
    const { questionId, rating, feedback } = req.body;
    
    if (!questionId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'QuestionId und Rating (1-5) sind erforderlich' });
    }

    await db.collection('questionRatings').add({
      questionId,
      rating,
      feedback: feedback || '',
      ratedBy: req.user.uid,
      ratedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Durchschnittsbewertung der Frage aktualisieren
    const ratingsSnapshot = await db.collection('questionRatings')
      .where('questionId', '==', questionId)
      .get();

    let totalRating = 0;
    let count = 0;

    ratingsSnapshot.forEach(doc => {
      totalRating += doc.data().rating;
      count++;
    });

    const averageRating = count > 0 ? (totalRating / count).toFixed(1) : 0;

    await db.collection('questions').doc(questionId).update({
      averageRating: parseFloat(averageRating),
      ratingCount: count
    });

    res.json({
      message: 'Bewertung erfolgreich gespeichert',
      questionId,
      rating,
      averageRating: parseFloat(averageRating)
    });

  } catch (error) {
    console.error('Rating-Fehler:', error);
    res.status(500).json({ error: 'Fehler beim Speichern der Bewertung' });
  }
});

module.exports = router; 