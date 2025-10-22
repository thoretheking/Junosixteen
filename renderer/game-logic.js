// Game State
let gameState = {
    currentLevel: 1,
    currentQuestion: 1,
    totalPoints: 0,
    levelPoints: 0,
    streak: 0,
    badges: [],
    answeredQuestions: [],
    gameStartTime: new Date()
};

// Check if running in Electron
const isElectron = () => {
    return typeof window !== 'undefined' && window.process && window.process.type;
};

// Question Pools für Level 1 & 2
const questionPools = {
    1: [
        {
            type: 'standard',
            text: 'Was ist der wichtigste Grundsatz des Datenschutzes?',
            answers: [
                'Datenminimierung - nur notwendige Daten sammeln',
                'Datenmaximierung - alle verfügbaren Daten sammeln',
                'Daten können unbegrenzt gespeichert werden',
                'Datenschutz ist optional'
            ],
            correct: 0,
            explanation: 'Datenminimierung ist ein Kernprinzip der DSGVO.'
        },
        {
            type: 'standard',
            text: 'Wie lange dürfen personenbezogene Daten gespeichert werden?',
            answers: [
                'Unbegrenzt',
                'Nur so lange wie für den Zweck erforderlich',
                'Mindestens 10 Jahre',
                'Bis das Unternehmen schließt'
            ],
            correct: 1,
            explanation: 'Daten dürfen nur so lange gespeichert werden, wie es für den ursprünglichen Zweck erforderlich ist.'
        },
        {
            type: 'standard',
            text: 'Was bedeutet "Einwilligung" nach DSGVO?',
            answers: [
                'Stillschweigende Zustimmung',
                'Freiwillige, spezifische und informierte Zustimmung',
                'Automatische Zustimmung bei Webseitenbesuch',
                'Zustimmung durch Nichthandeln'
            ],
            correct: 1,
            explanation: 'Einwilligung muss freiwillig, spezifisch, informiert und eindeutig sein.'
        },
        {
            type: 'standard',
            text: 'Welche Rechte haben betroffene Personen nach DSGVO?',
            answers: [
                'Nur das Recht auf Information',
                'Auskunft, Berichtigung, Löschung und Datenübertragbarkeit',
                'Keine besonderen Rechte',
                'Nur das Recht auf Löschung'
            ],
            correct: 1,
            explanation: 'Die DSGVO gewährt umfassende Betroffenenrechte.'
        },
        {
            type: 'risk',
            text: 'RISIKOFRAGE: Ein Mitarbeiter möchte Kundendaten für Marketingzwecke nutzen.',
            parts: [
                'Ist eine separate Einwilligung erforderlich?',
                'Muss der Datenschutzbeauftragte informiert werden?'
            ],
            answers: [
                ['Ja, separate Einwilligung nötig', 'Nein, ursprüngliche Einwilligung reicht'],
                ['Ja, DSB muss informiert werden', 'Nein, keine Information nötig']
            ],
            correct: [0, 0],
            explanation: 'Für neue Zwecke ist eine separate Einwilligung erforderlich und der DSB muss informiert werden.'
        },
        {
            type: 'standard',
            text: 'Was ist bei der Übermittlung von Daten in Drittländer zu beachten?',
            answers: [
                'Ist immer erlaubt',
                'Angemessenes Datenschutzniveau oder Garantien erforderlich',
                'Nur innerhalb der EU möglich',
                'Bedarf keiner besonderen Regelung'
            ],
            correct: 1,
            explanation: 'Drittlandübermittlungen erfordern angemessenes Schutzniveau oder geeignete Garantien.'
        },
        {
            type: 'standard',
            text: 'Wann muss eine Datenschutz-Folgenabschätzung durchgeführt werden?',
            answers: [
                'Bei jeder Datenverarbeitung',
                'Bei voraussichtlich hohem Risiko für Betroffene',
                'Nur bei Verstößen',
                'Nie erforderlich'
            ],
            correct: 1,
            explanation: 'Eine DSFA ist bei voraussichtlich hohem Risiko für die Rechte und Freiheiten der Betroffenen erforderlich.'
        },
        {
            type: 'standard',
            text: 'Was charakterisiert personenbezogene Daten?',
            answers: [
                'Nur Name und Adresse',
                'Alle Informationen, die sich auf eine identifizierte oder identifizierbare Person beziehen',
                'Nur biometrische Daten',
                'Nur sensible Daten'
            ],
            correct: 1,
            explanation: 'Personenbezogene Daten umfassen alle Informationen über identifizierte oder identifizierbare Personen.'
        },
        {
            type: 'team',
            text: 'TEAMFRAGE: Ihr Team entdeckt eine potenzielle Datenpanne.',
            teamQuestion: 'Welche Schritte sollten innerhalb der ersten 72 Stunden unternommen werden?',
            answers: [
                'Aufsichtsbehörde benachrichtigen und Dokumentation erstellen',
                'Abwarten und beobachten',
                'Nur interne Meldung',
                'Panne geheim halten'
            ],
            correct: 0,
            explanation: 'Bei Datenpannen ist eine schnelle Reaktion mit Behördenmeldung innerhalb von 72 Stunden erforderlich.'
        },
        {
            type: 'risk',
            text: 'FINALE RISIKOFRAGE: Ein externer Dienstleister soll Kundendaten verarbeiten.',
            parts: [
                'Ist ein Auftragsverarbeitungsvertrag erforderlich?',
                'Müssen technische und organisatorische Maßnahmen definiert werden?'
            ],
            answers: [
                ['Ja, AVV ist erforderlich', 'Nein, Vertrag ist optional'],
                ['Ja, TOMs müssen definiert werden', 'Nein, TOMs sind optional']
            ],
            correct: [0, 0],
            explanation: 'Bei Auftragsverarbeitung sind sowohl AVV als auch definierte TOMs gesetzlich vorgeschrieben.'
        }
    ],
    2: [
        {
            type: 'standard',
            text: 'Welche Bußgelder können bei DSGVO-Verstößen verhängt werden?',
            answers: [
                'Maximal 1.000 Euro',
                'Bis zu 20 Millionen Euro oder 4% des Jahresumsatzes',
                'Nur Verwarnungen',
                'Gefängnisstrafen'
            ],
            correct: 1,
            explanation: 'Die DSGVO sieht hohe Bußgelder von bis zu 20 Mio. Euro oder 4% des Jahresumsatzes vor.'
        },
        {
            type: 'standard',
            text: 'Was versteht man unter "Privacy by Design"?',
            answers: [
                'Nachträglicher Datenschutz',
                'Datenschutz von Anfang an mitdenken',
                'Datenschutz ist optional',
                'Nur für große Unternehmen relevant'
            ],
            correct: 1,
            explanation: 'Privacy by Design bedeutet, Datenschutz von Beginn an in Systeme und Prozesse zu integrieren.'
        },
        {
            type: 'standard',
            text: 'Wer darf als Datenschutzbeauftragter bestellt werden?',
            answers: [
                'Jeder Mitarbeiter',
                'Person mit Fachwissen im Datenschutzrecht',
                'Nur externe Berater',
                'Geschäftsführung automatisch'
            ],
            correct: 1,
            explanation: 'Der DSB muss über Fachwissen im Datenschutzrecht und in der Praxis verfügen.'
        },
        {
            type: 'standard',
            text: 'Was sind technische und organisatorische Maßnahmen (TOMs)?',
            answers: [
                'Nur IT-Sicherheit',
                'Umfassende Schutzmaßnahmen für personenbezogene Daten',
                'Nur Mitarbeiterschulungen',
                'Optional bei kleinen Unternehmen'
            ],
            correct: 1,
            explanation: 'TOMs umfassen alle technischen und organisatorischen Maßnahmen zum Schutz personenbezogener Daten.'
        },
        {
            type: 'risk',
            text: 'RISIKOFRAGE: Ein Unternehmen plant eine neue App mit Standortdaten.',
            parts: [
                'Ist eine Datenschutz-Folgenabschätzung erforderlich?',
                'Müssen die Nutzer explizit über die Standortnutzung informiert werden?'
            ],
            answers: [
                ['Ja, DSFA ist erforderlich', 'Nein, DSFA nicht nötig'],
                ['Ja, explizite Information nötig', 'Nein, allgemeine AGB reichen']
            ],
            correct: [0, 0],
            explanation: 'Standortdaten erfordern eine DSFA und explizite, transparente Information der Nutzer.'
        },
        {
            type: 'standard',
            text: 'Wie lange haben Unternehmen Zeit, auf Auskunftsersuchen zu antworten?',
            answers: [
                '72 Stunden',
                '1 Monat (verlängerbar auf 3 Monate)',
                '6 Monate',
                'Keine feste Frist'
            ],
            correct: 1,
            explanation: 'Auskunftsersuchen müssen grundsätzlich innerhalb eines Monats beantwortet werden.'
        },
        {
            type: 'standard',
            text: 'Was ist bei der Videoüberwachung am Arbeitsplatz zu beachten?',
            answers: [
                'Ist immer erlaubt',
                'Interessenabwägung und Mitarbeiterinformation erforderlich',
                'Nur mit Betriebsrat möglich',
                'Grundsätzlich verboten'
            ],
            correct: 1,
            explanation: 'Videoüberwachung erfordert eine sorgfältige Interessenabwägung und transparente Information.'
        },
        {
            type: 'standard',
            text: 'Welche Pflichten hat ein Auftragsverarbeiter?',
            answers: [
                'Keine besonderen Pflichten',
                'Weisungsgebundene Verarbeitung und Vertraulichkeit',
                'Nur Datenlöschung',
                'Vollständige Haftungsfreistellung'
            ],
            correct: 1,
            explanation: 'Auftragsverarbeiter müssen weisungsgebunden verarbeiten und Vertraulichkeit gewährleisten.'
        },
        {
            type: 'team',
            text: 'TEAMFRAGE: Ihr Team entwickelt eine neue Software.',
            teamQuestion: 'Welche Datenschutz-Prinzipien sollten von Anfang an berücksichtigt werden?',
            answers: [
                'Privacy by Design, Datenminimierung und Zweckbindung',
                'Nur die technische Funktionalität',
                'Datenschutz kann später hinzugefügt werden',
                'Nur bei sensiblen Daten relevant'
            ],
            correct: 0,
            explanation: 'Privacy by Design, Datenminimierung und Zweckbindung sind von Anfang an zu berücksichtigen.'
        },
        {
            type: 'risk',
            text: 'FINALE RISIKOFRAGE: Ein Mitarbeiter verliert ein Laptop mit Kundendaten.',
            parts: [
                'Muss eine Datenpanne gemeldet werden?',
                'Müssen die betroffenen Kunden informiert werden?'
            ],
            answers: [
                ['Ja, Meldung ist erforderlich', 'Nein, nur interne Behandlung'],
                ['Ja, Kunden müssen informiert werden', 'Nein, interne Meldung reicht']
            ],
            correct: [0, 0],
            explanation: 'Laptop-Verlust mit personenbezogenen Daten erfordert sowohl Behördenmeldung als auch Betroffeneninformation.'
        }
    ]
};

// Wissenssnacks Content
const wissenssnacks = {
    quick: {
        title: 'QUICK: Datenschutz-Grundlagen',
        duration: '2-3 Minuten',
        content: 'Die DSGVO schützt personenbezogene Daten. Wichtigste Prinzipien: Rechtmäßigkeit, Zweckbindung, Datenminimierung, Richtigkeit, Speicherbegrenzung, Sicherheit und Rechenschaftspflicht.',
        points: 100
    },
    short: {
        title: 'SHORT: E-Mail-Etikette',
        duration: '5-7 Minuten',
        content: 'Professionelle E-Mails: Klare Betreffzeile, höfliche Anrede, strukturierter Inhalt, eindeutige Handlungsaufforderung, professionelle Signatur. Antworten innerhalb von 24-48 Stunden.',
        points: 250
    },
    medium: {
        title: 'MEDIUM: DSGVO-Umsetzung',
        duration: '10-15 Minuten',
        content: 'Praktische DSGVO-Umsetzung: Verzeichnis von Verarbeitungstätigkeiten erstellen, Datenschutzerklärung anpassen, Betroffenenrechte implementieren, TOMs definieren, Mitarbeiter schulen.',
        points: 500
    }
};

// Memory Game Data
const memoryCards = [
    '🔒', '🔑', '📊', '⚖️', '🛡️', '📋', '💾', '🌐'
];

// Initialize game
document.addEventListener('DOMContentLoaded', function() {
    setupKeyboardShortcuts();
    updateStats();
    updateProgress();
    loadGameState();
    showNotification('JunoSixteen Desktop gestartet!', 'success');
});

// Keyboard shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey) {
            switch(e.key) {
                case '1':
                    e.preventDefault();
                    switchLevel(1);
                    break;
                case '2':
                    e.preventDefault();
                    switchLevel(2);
                    break;
                case 'n':
                    e.preventDefault();
                    resetGame();
                    break;
                case 's':
                    e.preventDefault();
                    saveGameState();
                    break;
                case 'o':
                    e.preventDefault();
                    loadGameState();
                    break;
            }
        }
        
        if (e.key === 'F11') {
            e.preventDefault();
            if (isElectron() && require) {
                const { remote } = require('electron');
                if (remote) {
                    const win = remote.getCurrentWindow();
                    win.setFullScreen(!win.isFullScreen());
                }
            }
        }
        
        // Number keys for answers
        const num = parseInt(e.key);
        if (num >= 1 && num <= 4) {
            const answerBtns = document.querySelectorAll('.answer-btn');
            if (answerBtns[num - 1] && answerBtns[num - 1].onclick) {
                answerBtns[num - 1].click();
            }
        }
        
        // Space for start/continue
        if (e.code === 'Space') {
            const startBtn = document.getElementById('startBtn');
            if (startBtn && startBtn.style.display !== 'none') {
                e.preventDefault();
                startBtn.click();
            }
        }
    });
}

// Game functions
function switchLevel(level) {
    gameState.currentLevel = level;
    gameState.currentQuestion = 1;
    gameState.levelPoints = 0;
    gameState.answeredQuestions = [];
    
    document.querySelectorAll('.level-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[onclick="switchLevel(${level})"]`).classList.add('active');
    document.getElementById('currentLevel').textContent = level;
    
    updateProgress();
    resetQuestion();
    showNotification(`Level ${level} ausgewählt!`, 'info');
}

function startQuestion() {
    const questions = questionPools[gameState.currentLevel];
    const question = questions[gameState.currentQuestion - 1];
    
    document.getElementById('startBtn').style.display = 'none';
    displayQuestion(question);
}

function displayQuestion(question) {
    const container = document.getElementById('questionContainer');
    const questionNumber = document.getElementById('questionNumber');
    const questionType = document.getElementById('questionType');
    const questionText = document.getElementById('questionText');
    const answersContainer = document.getElementById('answersContainer');
    
    questionNumber.textContent = `Frage ${gameState.currentQuestion}/10`;
    questionText.textContent = question.text;
    
    // Question type styling
    questionType.textContent = question.type === 'standard' ? 'Standard' : 
                             question.type === 'risk' ? '🎯 Risiko' : '🤝 Team';
    questionType.className = `question-type type-${question.type}`;
    
    // Clear previous answers
    answersContainer.innerHTML = '';
    answersContainer.style.display = 'grid';
    
    if (question.type === 'risk') {
        displayRiskQuestion(question);
    } else {
        displayStandardQuestion(question);
    }
}

function displayStandardQuestion(question) {
    const answersContainer = document.getElementById('answersContainer');
    
    question.answers.forEach((answer, index) => {
        const button = document.createElement('button');
        button.className = 'answer-btn';
        button.textContent = `${String.fromCharCode(65 + index)}. ${answer}`;
        button.onclick = () => checkAnswer(index, question);
        answersContainer.appendChild(button);
    });
}

function displayRiskQuestion(question) {
    const answersContainer = document.getElementById('answersContainer');
    answersContainer.style.gridTemplateColumns = '1fr';
    
    question.parts.forEach((part, partIndex) => {
        const partDiv = document.createElement('div');
        partDiv.style.marginBottom = '20px';
        partDiv.innerHTML = `<h4>Teil ${partIndex + 1}: ${part}</h4>`;
        
        const partAnswers = document.createElement('div');
        partAnswers.style.display = 'grid';
        partAnswers.style.gridTemplateColumns = '1fr 1fr';
        partAnswers.style.gap = '10px';
        
        question.answers[partIndex].forEach((answer, answerIndex) => {
            const button = document.createElement('button');
            button.className = 'answer-btn';
            button.textContent = answer;
            button.onclick = () => selectRiskAnswer(partIndex, answerIndex, button);
            partAnswers.appendChild(button);
        });
        
        partDiv.appendChild(partAnswers);
        answersContainer.appendChild(partDiv);
    });
    
    const submitBtn = document.createElement('button');
    submitBtn.className = 'level-btn';
    submitBtn.textContent = 'Antworten einreichen (Enter)';
    submitBtn.onclick = () => checkRiskAnswers(question);
    answersContainer.appendChild(submitBtn);
}

let riskAnswers = [];

function selectRiskAnswer(partIndex, answerIndex, button) {
    // Deselect other buttons in this part
    button.parentElement.querySelectorAll('.answer-btn').forEach(btn => {
        btn.classList.remove('correct');
    });
    
    button.classList.add('correct');
    riskAnswers[partIndex] = answerIndex;
}

function checkRiskAnswers(question) {
    const isCorrect = question.correct.every((correct, index) => riskAnswers[index] === correct);
    
    if (isCorrect) {
        // Double points for risk question
        const points = calculatePoints() * 2;
        gameState.levelPoints *= 2;
        gameState.totalPoints += points;
        gameState.streak++;
        showFeedback(true, `Risikofrage gemeistert! Punkte verdoppelt: +${points}`, question.explanation);
        unlockBadge('risk');
        playSuccessSound();
    } else {
        // Restart level for risk question
        gameState.levelPoints = 0;
        gameState.currentQuestion = 1;
        gameState.streak = 0;
        showFeedback(false, 'Risikofrage verfehlt! Level wird neu gestartet.', question.explanation);
        playErrorSound();
        setTimeout(() => {
            resetQuestion();
        }, 3000);
        return;
    }
    
    riskAnswers = [];
    nextQuestion();
}

function checkAnswer(selectedIndex, question) {
    const buttons = document.querySelectorAll('.answer-btn');
    buttons.forEach(btn => btn.onclick = null);
    
    const isCorrect = selectedIndex === question.correct;
    const points = calculatePoints();
    
    if (isCorrect) {
        buttons[selectedIndex].classList.add('correct');
        gameState.levelPoints += points;
        gameState.totalPoints += points;
        gameState.streak++;
        showFeedback(true, `Richtig! +${points} Punkte`, question.explanation);
        
        if (gameState.currentQuestion === 1) unlockBadge('first');
        if (gameState.streak === 5) unlockBadge('streak');
        
        playSuccessSound();
    } else {
        buttons[selectedIndex].classList.add('incorrect');
        buttons[question.correct].classList.add('correct');
        gameState.levelPoints -= points;
        gameState.totalPoints = Math.max(0, gameState.totalPoints - points);
        gameState.streak = 0;
        showFeedback(false, `Falsch! -${points} Punkte`, question.explanation);
        playErrorSound();
    }
    
    updateStats();
    setTimeout(nextQuestion, 3000);
}

function calculatePoints() {
    return gameState.currentLevel * 50 * gameState.currentQuestion;
}

function showFeedback(isCorrect, message, explanation) {
    const feedback = document.getElementById('feedback');
    feedback.className = `feedback ${isCorrect ? 'correct' : 'incorrect'}`;
    feedback.innerHTML = `<strong>${message}</strong><br><br>${explanation}`;
    feedback.style.display = 'block';
}

function nextQuestion() {
    if (gameState.currentQuestion >= 10) {
        completeLevel();
        return;
    }
    
    gameState.currentQuestion++;
    updateProgress();
    resetQuestion();
    
    // Auto start next question after delay
    setTimeout(() => {
        startQuestion();
    }, 1000);
}

function completeLevel() {
    // Level completion bonus (5x multiplier)
    const bonus = gameState.levelPoints * 4; // Already have 1x, so add 4x more
    gameState.totalPoints += bonus;
    
    document.getElementById('questionContainer').style.display = 'none';
    document.getElementById('feedback').style.display = 'none';
    
    const levelComplete = document.getElementById('levelComplete');
    const levelPoints = document.getElementById('levelPoints');
    levelPoints.textContent = `+${gameState.levelPoints * 5} Punkte (Level-Bonus!)`;
    levelComplete.style.display = 'block';
    
    unlockBadge('level');
    updateStats();
    autoSaveGame();
    playLevelCompleteSound();
    showNotification(`Level ${gameState.currentLevel} abgeschlossen!`, 'success');
}

function resetQuestion() {
    document.getElementById('startBtn').style.display = 'block';
    document.getElementById('startBtn').textContent = 'Nächste Frage starten (Leertaste)';
    document.getElementById('answersContainer').style.display = 'none';
    document.getElementById('feedback').style.display = 'none';
    document.getElementById('levelComplete').style.display = 'none';
    document.getElementById('questionContainer').style.display = 'block';
    document.getElementById('questionText').textContent = 'Bereit für die nächste Frage?';
}

function updateProgress() {
    const progress = (gameState.currentQuestion - 1) / 10 * 100;
    document.getElementById('progressFill').style.width = `${progress}%`;
}

function updateStats() {
    document.getElementById('totalPoints').textContent = gameState.totalPoints.toLocaleString();
    document.getElementById('currentLevel').textContent = gameState.currentLevel;
    document.getElementById('badges').textContent = gameState.badges.length;
    document.getElementById('streak').textContent = gameState.streak;
}

function unlockBadge(type) {
    if (gameState.badges.includes(type)) return;
    
    gameState.badges.push(type);
    const badges = document.querySelectorAll('.badge');
    
    switch(type) {
        case 'first': badges[0].classList.add('unlocked'); break;
        case 'streak': badges[1].classList.add('unlocked'); break;
        case 'risk': badges[2].classList.add('unlocked'); break;
        case 'minigame': badges[3].classList.add('unlocked'); break;
        case 'team': badges[4].classList.add('unlocked'); break;
        case 'level': badges[5].classList.add('unlocked'); break;
    }
    
    showNotification(`Badge freigeschaltet: ${type}!`, 'success');
}

// Wissenssnacks
function showSnack(type) {
    const snack = wissenssnacks[type];
    const container = document.getElementById('questionContainer');
    
    container.innerHTML = `
        <h2>📚 ${snack.title}</h2>
        <p><strong>Dauer:</strong> ${snack.duration}</p>
        <div style="margin: 20px 0; text-align: left; line-height: 1.6; background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px;">
            ${snack.content}
        </div>
        <button class="level-btn" onclick="completeSnack('${type}')">Abschließen (+${snack.points} Punkte)</button>
    `;
}

function completeSnack(type) {
    const snack = wissenssnacks[type];
    gameState.totalPoints += snack.points;
    updateStats();
    
    showFeedback(true, `Wissenssnack abgeschlossen! +${snack.points} Punkte`, 'Weiter so! Microlearning bringt Sie schnell voran.');
    showNotification(`${snack.title} abgeschlossen!`, 'success');
    
    setTimeout(() => {
        resetQuestion();
    }, 2000);
}

// Minigames
function showMinigames() {
    document.getElementById('levelComplete').style.display = 'none';
}

function startMemoryGame() {
    const memoryGame = document.getElementById('memoryGame');
    const grid = document.getElementById('memoryGrid');
    
    // Hide other elements and show memory game
    document.querySelector('.game-area').style.display = 'none';
    memoryGame.style.display = 'block';
    
    // Create shuffled cards (pairs)
    const cards = [...memoryCards, ...memoryCards].sort(() => Math.random() - 0.5);
    
    grid.innerHTML = '';
    let flippedCards = [];
    let matchedPairs = 0;
    
    cards.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = 'memory-card';
        cardElement.textContent = '?';
        cardElement.dataset.card = card;
        cardElement.onclick = () => flipCard(cardElement);
        grid.appendChild(cardElement);
    });
    
    function flipCard(cardElement) {
        if (cardElement.classList.contains('flipped') || flippedCards.length >= 2) return;
        
        cardElement.classList.add('flipped');
        cardElement.textContent = cardElement.dataset.card;
        flippedCards.push(cardElement);
        
        if (flippedCards.length === 2) {
            setTimeout(() => {
                if (flippedCards[0].dataset.card === flippedCards[1].dataset.card) {
                    flippedCards.forEach(card => card.classList.add('matched'));
                    matchedPairs++;
                    
                    if (matchedPairs === memoryCards.length) {
                        gameState.totalPoints += 500;
                        unlockBadge('minigame');
                        updateStats();
                        showNotification('Memory Game gewonnen! +500 Punkte', 'success');
                        playSuccessSound();
                    }
                } else {
                    flippedCards.forEach(card => {
                        card.classList.remove('flipped');
                        card.textContent = '?';
                    });
                }
                flippedCards = [];
            }, 1000);
        }
    }
}

function startWordScramble() {
    showNotification('Word Scramble wird gestartet! (Demo-Funktion)', 'info');
    gameState.totalPoints += 300;
    updateStats();
}

function startReactionTest() {
    showNotification('Reaction Test wird gestartet! (Demo-Funktion)', 'info');
    gameState.totalPoints += 200;
    updateStats();
}

function startPuzzleSlider() {
    showNotification('Puzzle Slider wird gestartet! (Demo-Funktion)', 'info');
    gameState.totalPoints += 400;
    updateStats();
}

function hideMinigames() {
    document.getElementById('memoryGame').style.display = 'none';
    document.querySelector('.game-area').style.display = 'block';
    resetQuestion();
}

// Save/Load functionality
function saveGameState() {
    const saveData = {
        gameState: gameState,
        timestamp: new Date().toISOString(),
        version: '1.0'
    };
    
    if (isElectron()) {
        // Use Electron dialog
        saveGameStateElectron(saveData);
    } else {
        // Use localStorage for web version
        localStorage.setItem('junosixteen-gamestate', JSON.stringify(saveData));
        showNotification('Spielstand gespeichert!', 'success');
    }
}

function loadGameState() {
    if (isElectron()) {
        loadGameStateElectron();
    } else {
        const saved = localStorage.getItem('junosixteen-gamestate');
        if (saved) {
            try {
                const saveData = JSON.parse(saved);
                gameState = saveData.gameState;
                updateStats();
                updateProgress();
                resetQuestion();
                showNotification('Spielstand geladen!', 'success');
            } catch (e) {
                showNotification('Fehler beim Laden!', 'error');
            }
        }
    }
}

function saveGameStateElectron(saveData) {
    if (require) {
        const { ipcRenderer } = require('electron');
        const fs = require('fs');
        
        ipcRenderer.invoke('show-save-dialog').then((result) => {
            if (!result.canceled) {
                fs.writeFileSync(result.filePath, JSON.stringify(saveData, null, 2));
                showNotification('Spielstand gespeichert!', 'success');
            }
        });
    }
}

function loadGameStateElectron() {
    if (require) {
        const { ipcRenderer } = require('electron');
        const fs = require('fs');
        
        ipcRenderer.invoke('show-open-dialog').then((result) => {
            if (!result.canceled && result.filePaths.length > 0) {
                try {
                    const data = fs.readFileSync(result.filePaths[0], 'utf8');
                    const saveData = JSON.parse(data);
                    gameState = saveData.gameState;
                    updateStats();
                    updateProgress();
                    resetQuestion();
                    showNotification('Spielstand geladen!', 'success');
                } catch (e) {
                    showNotification('Fehler beim Laden!', 'error');
                }
            }
        });
    }
}

function autoSaveGame() {
    // Auto-save after level completion
    const saveData = {
        gameState: gameState,
        timestamp: new Date().toISOString(),
        version: '1.0',
        autoSave: true
    };
    
    if (!isElectron()) {
        localStorage.setItem('junosixteen-autosave', JSON.stringify(saveData));
    }
}

function resetGame() {
    if (confirm('Sind Sie sicher, dass Sie das Spiel zurücksetzen möchten?')) {
        gameState = {
            currentLevel: 1,
            currentQuestion: 1,
            totalPoints: 0,
            levelPoints: 0,
            streak: 0,
            badges: [],
            answeredQuestions: [],
            gameStartTime: new Date()
        };
        
        // Reset UI
        document.querySelectorAll('.badge').forEach(badge => badge.classList.remove('unlocked'));
        switchLevel(1);
        showNotification('Spiel zurückgesetzt!', 'info');
    }
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Sound effects (basic beep sounds using Web Audio API)
function playSuccessSound() {
    playBeep(800, 100);
}

function playErrorSound() {
    playBeep(300, 200);
}

function playLevelCompleteSound() {
    playBeep(600, 100);
    setTimeout(() => playBeep(800, 100), 150);
    setTimeout(() => playBeep(1000, 200), 300);
}

function playBeep(frequency, duration) {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (e) {
        // Silent fail if audio context not available
    }
} 