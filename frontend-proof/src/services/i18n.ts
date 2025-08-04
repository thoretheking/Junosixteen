// ===================================================
// 🌍 JUNOSIXTEEN INTERNATIONALIZATION SYSTEM
// Complete i18n support for all 7 languages
// ===================================================

export type LanguageCode = 'de' | 'en' | 'es' | 'fr' | 'it' | 'pt' | 'nl';

export interface TranslationKeys {
  // Common
  welcome: string;
  continue: string;
  back: string;
  next: string;
  cancel: string;
  save: string;
  loading: string;
  error: string;
  success: string;
  
  // Language Selection
  selectLanguage: string;
  languageDescription: string;
  languageInfo: string;
  continueToAvatar: string;
  
  // Avatar Selection
  selectAvatar: string;
  avatarDescription: string;
  avatarCategories: {
    manga: string;
    realistic: string;
    comic: string;
    business: string;
  };
  
  // Navigation
  home: string;
  quiz: string;
  progress: string;
  leaderboard: string;
  profile: string;
  admin: string;
  
  // Quiz
  quizWelcome: string;
  correctAnswer: string;
  incorrectAnswer: string;
  timeUp: string;
  answerLabels: string[];
  readQuestion: string;
  readAnswers: string;
  ttsSettings: string;
  
  // Gamification
  level: string;
  points: string;
  badges: string;
  leaderboards: string;
  riskQuestion: string;
  teamQuestion: string;
  
  // Freiwillige Pfade
  voluntaryPaths: string;
  personalGrowth: string;
  reflection: string;
  noDeadlines: string;
  pausableAnytime: string;
}

const translations: Record<LanguageCode, TranslationKeys> = {
  de: {
    // Common
    welcome: 'Willkommen',
    continue: 'Weiter',
    back: 'Zurück',
    next: 'Weiter',
    cancel: 'Abbrechen',
    save: 'Speichern',
    loading: 'Lädt...',
    error: 'Fehler',
    success: 'Erfolgreich',
    
    // Language Selection
    selectLanguage: 'Wähle deine Sprache',
    languageDescription: 'JunoSixteen ist in 7 Sprachen verfügbar. Du kannst diese später jederzeit ändern.',
    languageInfo: '🌍 Alle Inhalte werden automatisch in deiner gewählten Sprache angezeigt',
    continueToAvatar: 'Weiter zur Avatar-Auswahl',
    
    // Avatar Selection
    selectAvatar: 'Wähle deinen Avatar',
    avatarDescription: 'Dein Avatar repräsentiert dich in JunoSixteen. Du kannst ihn später ändern.',
    avatarCategories: {
      manga: 'Manga Style',
      realistic: 'Realistisch',
      comic: 'Comic Style',
      business: 'Business'
    },
    
    // Navigation
    home: 'Startseite',
    quiz: 'Quiz',
    progress: 'Fortschritt',
    leaderboard: 'Bestenliste',
    profile: 'Profil',
    admin: 'Admin',
    
    // Quiz
    quizWelcome: 'Willkommen zum JunoSixteen Quiz. Tippe auf den Lautsprecher-Button, um Fragen vorgelesen zu bekommen.',
    correctAnswer: 'Richtige Antwort! Gut gemacht!',
    incorrectAnswer: 'Leider falsch. Lerne aus dem Fehler und mache weiter!',
    timeUp: 'Zeit abgelaufen!',
    answerLabels: ['Antwort A', 'Antwort B', 'Antwort C', 'Antwort D'],
    readQuestion: 'Frage vorlesen',
    readAnswers: 'Antworten vorlesen',
    ttsSettings: 'Sprachausgabe-Einstellungen',
    
    // Gamification
    level: 'Level',
    points: 'Punkte',
    badges: 'Abzeichen',
    leaderboards: 'Ranglisten',
    riskQuestion: 'Risiko-Frage',
    teamQuestion: 'Team-Frage',
    
    // Freiwillige Pfade
    voluntaryPaths: 'Freiwillige Pfade',
    personalGrowth: 'Persönliches Wachstum',
    reflection: 'Reflexion',
    noDeadlines: 'Keine Deadlines',
    pausableAnytime: 'Jederzeit pausierbar'
  },
  
  en: {
    // Common
    welcome: 'Welcome',
    continue: 'Continue',
    back: 'Back',
    next: 'Next',
    cancel: 'Cancel',
    save: 'Save',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    
    // Language Selection
    selectLanguage: 'Choose your language',
    languageDescription: 'JunoSixteen is available in 7 languages. You can change this anytime later.',
    languageInfo: '🌍 All content will automatically display in your chosen language',
    continueToAvatar: 'Continue to Avatar Selection',
    
    // Avatar Selection
    selectAvatar: 'Choose your Avatar',
    avatarDescription: 'Your avatar represents you in JunoSixteen. You can change it later.',
    avatarCategories: {
      manga: 'Manga Style',
      realistic: 'Realistic',
      comic: 'Comic Style',
      business: 'Business'
    },
    
    // Navigation
    home: 'Home',
    quiz: 'Quiz',
    progress: 'Progress',
    leaderboard: 'Leaderboard',
    profile: 'Profile',
    admin: 'Admin',
    
    // Quiz
    quizWelcome: 'Welcome to the JunoSixteen quiz. Tap the speaker button to have questions read aloud.',
    correctAnswer: 'Correct answer! Well done!',
    incorrectAnswer: 'Unfortunately wrong. Learn from the mistake and continue!',
    timeUp: 'Time\'s up!',
    answerLabels: ['Answer A', 'Answer B', 'Answer C', 'Answer D'],
    readQuestion: 'Read question',
    readAnswers: 'Read answers',
    ttsSettings: 'Speech output settings',
    
    // Gamification
    level: 'Level',
    points: 'Points',
    badges: 'Badges',
    leaderboards: 'Leaderboards',
    riskQuestion: 'Risk Question',
    teamQuestion: 'Team Question',
    
    // Freiwillige Pfade
    voluntaryPaths: 'Voluntary Paths',
    personalGrowth: 'Personal Growth',
    reflection: 'Reflection',
    noDeadlines: 'No Deadlines',
    pausableAnytime: 'Pausable Anytime'
  },
  
  es: {
    // Common
    welcome: 'Bienvenido',
    continue: 'Continuar',
    back: 'Atrás',
    next: 'Siguiente',
    cancel: 'Cancelar',
    save: 'Guardar',
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',
    
    // Language Selection
    selectLanguage: 'Elige tu idioma',
    languageDescription: 'JunoSixteen está disponible en 7 idiomas. Puedes cambiarlo más tarde.',
    languageInfo: '🌍 Todo el contenido se mostrará automáticamente en tu idioma elegido',
    continueToAvatar: 'Continuar a Selección de Avatar',
    
    // Avatar Selection
    selectAvatar: 'Elige tu Avatar',
    avatarDescription: 'Tu avatar te representa en JunoSixteen. Puedes cambiarlo más tarde.',
    avatarCategories: {
      manga: 'Estilo Manga',
      realistic: 'Realista',
      comic: 'Estilo Cómic',
      business: 'Negocios'
    },
    
    // Navigation
    home: 'Inicio',
    quiz: 'Quiz',
    progress: 'Progreso',
    leaderboard: 'Clasificación',
    profile: 'Perfil',
    admin: 'Admin',
    
    // Quiz
    quizWelcome: 'Bienvenido al quiz de JunoSixteen. Toca el botón del altavoz para escuchar las preguntas.',
    correctAnswer: '¡Respuesta correcta! ¡Bien hecho!',
    incorrectAnswer: 'Desafortunadamente incorrecto. ¡Aprende del error y continúa!',
    timeUp: '¡Se acabó el tiempo!',
    answerLabels: ['Respuesta A', 'Respuesta B', 'Respuesta C', 'Respuesta D'],
    readQuestion: 'Leer pregunta',
    readAnswers: 'Leer respuestas',
    ttsSettings: 'Configuración de voz',
    
    // Gamification
    level: 'Nivel',
    points: 'Puntos',
    badges: 'Insignias',
    leaderboards: 'Clasificaciones',
    riskQuestion: 'Pregunta de Riesgo',
    teamQuestion: 'Pregunta de Equipo',
    
    // Freiwillige Pfade
    voluntaryPaths: 'Rutas Voluntarias',
    personalGrowth: 'Crecimiento Personal',
    reflection: 'Reflexión',
    noDeadlines: 'Sin Fechas Límite',
    pausableAnytime: 'Pausable en Cualquier Momento'
  },
  
  fr: {
    // Common
    welcome: 'Bienvenue',
    continue: 'Continuer',
    back: 'Retour',
    next: 'Suivant',
    cancel: 'Annuler',
    save: 'Sauvegarder',
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
    
    // Language Selection
    selectLanguage: 'Choisissez votre langue',
    languageDescription: 'JunoSixteen est disponible en 7 langues. Vous pouvez la changer plus tard.',
    languageInfo: '🌍 Tout le contenu s\'affichera automatiquement dans votre langue choisie',
    continueToAvatar: 'Continuer vers la Sélection d\'Avatar',
    
    // Avatar Selection
    selectAvatar: 'Choisissez votre Avatar',
    avatarDescription: 'Votre avatar vous représente dans JunoSixteen. Vous pouvez le changer plus tard.',
    avatarCategories: {
      manga: 'Style Manga',
      realistic: 'Réaliste',
      comic: 'Style Bande Dessinée',
      business: 'Business'
    },
    
    // Navigation
    home: 'Accueil',
    quiz: 'Quiz',
    progress: 'Progrès',
    leaderboard: 'Classement',
    profile: 'Profil',
    admin: 'Admin',
    
    // Quiz
    quizWelcome: 'Bienvenue au quiz JunoSixteen. Touchez le bouton haut-parleur pour écouter les questions.',
    correctAnswer: 'Bonne réponse ! Bien joué !',
    incorrectAnswer: 'Malheureusement incorrect. Apprenez de l\'erreur et continuez !',
    timeUp: 'Temps écoulé !',
    answerLabels: ['Réponse A', 'Réponse B', 'Réponse C', 'Réponse D'],
    readQuestion: 'Lire la question',
    readAnswers: 'Lire les réponses',
    ttsSettings: 'Paramètres de synthèse vocale',
    
    // Gamification
    level: 'Niveau',
    points: 'Points',
    badges: 'Badges',
    leaderboards: 'Classements',
    riskQuestion: 'Question à Risque',
    teamQuestion: 'Question d\'Équipe',
    
    // Freiwillige Pfade
    voluntaryPaths: 'Parcours Volontaires',
    personalGrowth: 'Croissance Personnelle',
    reflection: 'Réflexion',
    noDeadlines: 'Pas de Délais',
    pausableAnytime: 'Pausable à Tout Moment'
  },
  
  it: {
    // Common
    welcome: 'Benvenuto',
    continue: 'Continua',
    back: 'Indietro',
    next: 'Avanti',
    cancel: 'Annulla',
    save: 'Salva',
    loading: 'Caricamento...',
    error: 'Errore',
    success: 'Successo',
    
    // Language Selection
    selectLanguage: 'Scegli la tua lingua',
    languageDescription: 'JunoSixteen è disponibile in 7 lingue. Puoi cambiarla più tardi.',
    languageInfo: '🌍 Tutto il contenuto verrà mostrato automaticamente nella tua lingua scelta',
    continueToAvatar: 'Continua alla Selezione Avatar',
    
    // Avatar Selection
    selectAvatar: 'Scegli il tuo Avatar',
    avatarDescription: 'Il tuo avatar ti rappresenta in JunoSixteen. Puoi cambiarlo più tardi.',
    avatarCategories: {
      manga: 'Stile Manga',
      realistic: 'Realistico',
      comic: 'Stile Fumetto',
      business: 'Business'
    },
    
    // Navigation
    home: 'Home',
    quiz: 'Quiz',
    progress: 'Progresso',
    leaderboard: 'Classifica',
    profile: 'Profilo',
    admin: 'Admin',
    
    // Quiz
    quizWelcome: 'Benvenuto al quiz JunoSixteen. Tocca il pulsante altoparlante per sentire le domande.',
    correctAnswer: 'Risposta corretta! Ben fatto!',
    incorrectAnswer: 'Purtroppo sbagliato. Impara dall\'errore e continua!',
    timeUp: 'Tempo scaduto!',
    answerLabels: ['Risposta A', 'Risposta B', 'Risposta C', 'Risposta D'],
    readQuestion: 'Leggi domanda',
    readAnswers: 'Leggi risposte',
    ttsSettings: 'Impostazioni sintesi vocale',
    
    // Gamification
    level: 'Livello',
    points: 'Punti',
    badges: 'Badge',
    leaderboards: 'Classifiche',
    riskQuestion: 'Domanda a Rischio',
    teamQuestion: 'Domanda di Squadra',
    
    // Freiwillige Pfade
    voluntaryPaths: 'Percorsi Volontari',
    personalGrowth: 'Crescita Personale',
    reflection: 'Riflessione',
    noDeadlines: 'Nessuna Scadenza',
    pausableAnytime: 'Pausabile in Qualsiasi Momento'
  },
  
  pt: {
    // Common
    welcome: 'Bem-vindo',
    continue: 'Continuar',
    back: 'Voltar',
    next: 'Próximo',
    cancel: 'Cancelar',
    save: 'Salvar',
    loading: 'Carregando...',
    error: 'Erro',
    success: 'Sucesso',
    
    // Language Selection
    selectLanguage: 'Escolha seu idioma',
    languageDescription: 'JunoSixteen está disponível em 7 idiomas. Você pode mudar mais tarde.',
    languageInfo: '🌍 Todo o conteúdo será exibido automaticamente em seu idioma escolhido',
    continueToAvatar: 'Continuar para Seleção de Avatar',
    
    // Avatar Selection
    selectAvatar: 'Escolha seu Avatar',
    avatarDescription: 'Seu avatar representa você no JunoSixteen. Você pode mudá-lo mais tarde.',
    avatarCategories: {
      manga: 'Estilo Manga',
      realistic: 'Realista',
      comic: 'Estilo Quadrinhos',
      business: 'Negócios'
    },
    
    // Navigation
    home: 'Início',
    quiz: 'Quiz',
    progress: 'Progresso',
    leaderboard: 'Classificação',
    profile: 'Perfil',
    admin: 'Admin',
    
    // Quiz
    quizWelcome: 'Bem-vindo ao quiz JunoSixteen. Toque no botão do alto-falante para ouvir as perguntas.',
    correctAnswer: 'Resposta correta! Muito bem!',
    incorrectAnswer: 'Infelizmente errado. Aprenda com o erro e continue!',
    timeUp: 'Tempo esgotado!',
    answerLabels: ['Resposta A', 'Resposta B', 'Resposta C', 'Resposta D'],
    readQuestion: 'Ler pergunta',
    readAnswers: 'Ler respostas',
    ttsSettings: 'Configurações de voz',
    
    // Gamification
    level: 'Nível',
    points: 'Pontos',
    badges: 'Emblemas',
    leaderboards: 'Classificações',
    riskQuestion: 'Pergunta de Risco',
    teamQuestion: 'Pergunta de Equipe',
    
    // Freiwillige Pfade
    voluntaryPaths: 'Caminhos Voluntários',
    personalGrowth: 'Crescimento Pessoal',
    reflection: 'Reflexão',
    noDeadlines: 'Sem Prazos',
    pausableAnytime: 'Pausável a Qualquer Momento'
  },
  
  nl: {
    // Common
    welcome: 'Welkom',
    continue: 'Doorgaan',
    back: 'Terug',
    next: 'Volgende',
    cancel: 'Annuleren',
    save: 'Opslaan',
    loading: 'Laden...',
    error: 'Fout',
    success: 'Succes',
    
    // Language Selection
    selectLanguage: 'Kies je taal',
    languageDescription: 'JunoSixteen is beschikbaar in 7 talen. Je kunt dit later wijzigen.',
    languageInfo: '🌍 Alle inhoud wordt automatisch weergegeven in je gekozen taal',
    continueToAvatar: 'Doorgaan naar Avatar Selectie',
    
    // Avatar Selection
    selectAvatar: 'Kies je Avatar',
    avatarDescription: 'Je avatar vertegenwoordigt jou in JunoSixteen. Je kunt hem later wijzigen.',
    avatarCategories: {
      manga: 'Manga Stijl',
      realistic: 'Realistisch',
      comic: 'Strip Stijl',
      business: 'Business'
    },
    
    // Navigation
    home: 'Home',
    quiz: 'Quiz',
    progress: 'Voortgang',
    leaderboard: 'Ranglijst',
    profile: 'Profiel',
    admin: 'Admin',
    
    // Quiz
    quizWelcome: 'Welkom bij de JunoSixteen quiz. Tik op de luidspreker knop om vragen voorgelezen te krijgen.',
    correctAnswer: 'Correct antwoord! Goed gedaan!',
    incorrectAnswer: 'Helaas fout. Leer van de fout en ga verder!',
    timeUp: 'Tijd is om!',
    answerLabels: ['Antwoord A', 'Antwoord B', 'Antwoord C', 'Antwoord D'],
    readQuestion: 'Vraag voorlezen',
    readAnswers: 'Antwoorden voorlezen',
    ttsSettings: 'Spraak instellingen',
    
    // Gamification
    level: 'Niveau',
    points: 'Punten',
    badges: 'Badges',
    leaderboards: 'Ranglijsten',
    riskQuestion: 'Risico Vraag',
    teamQuestion: 'Team Vraag',
    
    // Freiwillige Pfade
    voluntaryPaths: 'Vrijwillige Paden',
    personalGrowth: 'Persoonlijke Groei',
    reflection: 'Reflectie',
    noDeadlines: 'Geen Deadlines',
    pausableAnytime: 'Altijd Pauseerbaar'
  }
};

// ===================================================
// i18n SERVICE CLASS
// ===================================================

class i18nService {
  private static instance: i18nService;
  private currentLanguage: LanguageCode = 'de';

  public static getInstance(): i18nService {
    if (!i18nService.instance) {
      i18nService.instance = new i18nService();
    }
    return i18nService.instance;
  }

  public setLanguage(language: LanguageCode): void {
    this.currentLanguage = language;
  }

  public getCurrentLanguage(): LanguageCode {
    return this.currentLanguage;
  }

  public t(key: keyof TranslationKeys): string;
  public t(key: string): string;
  public t(key: string): string {
    const keys = key.split('.');
    let value: any = translations[this.currentLanguage];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to German if key not found
        value = translations['de'];
        for (const fallbackK of keys) {
          if (value && typeof value === 'object' && fallbackK in value) {
            value = value[fallbackK];
          } else {
            return key; // Return key if not found
          }
        }
        break;
      }
    }
    
    return typeof value === 'string' ? value : key;
  }

  public getAvailableLanguages(): { code: LanguageCode; name: string; flag: string }[] {
    return [
      { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
      { code: 'en', name: 'English', flag: '🇺🇸' },
      { code: 'es', name: 'Español', flag: '🇪🇸' },
      { code: 'fr', name: 'Français', flag: '🇫🇷' },
      { code: 'it', name: 'Italiano', flag: '🇮🇹' },
      { code: 'pt', name: 'Português', flag: '🇵🇹' },
      { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
    ];
  }
}

// ===================================================
// EXPORT
// ===================================================

export const i18n = i18nService.getInstance();
export default i18n; 