// In-Memory Fact Cache für Events
// In Produktion würde dies durch Redis/Database ersetzt
const FACT_CACHE = new Map(); // key: "userId:level" -> facts object

/**
 * Fügt eine Antwort zu den Facts hinzu
 * @param {string} userId - Benutzer-ID
 * @param {number} level - Level-Nummer
 * @param {number} question - Fragen-Nummer
 * @param {boolean} correct - Ob die Antwort korrekt war
 * @param {string} timestamp - ISO-Zeitstempel (optional)
 * @returns {object} Aktualisierte Facts für den User/Level
 */
export function addAnswer(userId, level, q, correct) {
  const key = `${userId}:${level}`;
  const obj = FACT_CACHE.get(key) || { answered_correct: [], answered_wrong: [], deadline: [], time_limit: [], answered_duration: [], team_member: [] };
  const now = new Date().toISOString();
  (correct ? obj.answered_correct : obj.answered_wrong).push([userId, level, q, now]);
  FACT_CACHE.set(key, obj);
  return obj;
}

export function setDeadline(level, isoTs) {
  // triviale Strategie: setze gleiche Level-Deadline für alle Caches
  for (const [k, obj] of FACT_CACHE.entries()) {
    if (!obj.deadline.some(d => d[0] === level)) obj.deadline.push([level, isoTs]);
    FACT_CACHE.set(k, obj);
  }
}

export function startQuestion(userId, level, q, startedAtIso) {
  const key = `${userId}:${level}`;
  const obj = FACT_CACHE.get(key) || { answered_correct: [], answered_wrong: [], deadline: [], time_limit: [], answered_duration: [], team_member: [] };
  obj.__currentStart = obj.__currentStart || {};
  obj.__currentStart[`${userId}:${level}:${q}`] = startedAtIso || new Date().toISOString();
  FACT_CACHE.set(key, obj);
  return obj;
}

export function finishQuestion(userId, level, q, finishedAtIso) {
  const key = `${userId}:${level}`;
  const obj = FACT_CACHE.get(key) || { answered_correct: [], answered_wrong: [], deadline: [], time_limit: [], answered_duration: [], team_member: [] };
  const startKey = `${userId}:${level}:${q}`;
  const startIso = obj.__currentStart?.[startKey];
  const endIso = finishedAtIso || new Date().toISOString();
  if (startIso) {
    const d = (new Date(endIso).getTime() - new Date(startIso).getTime())/1000;
    obj.answered_duration.push([userId, level, q, Math.round(d)]);
    delete obj.__currentStart[startKey];
  }
  FACT_CACHE.set(key, obj);
  return obj;
}

export function setTimeLimit(level, q, sec) {
  // optional globales Limit je (Level, Frage)
  for (const [k, obj] of FACT_CACHE.entries()) {
    if (!obj.time_limit.some(t => t[0]===level && t[1]===q)) obj.time_limit.push([level, q, sec]);
    FACT_CACHE.set(k, obj);
  }
}

export function setTeam(team, members) {
  // überschreibt Team-Mitglieder (einfach)
  const perUser = new Map();
  for (const m of members) perUser.set(`${m.userId}:${m.level}`, m);
  for (const [k, obj] of FACT_CACHE.entries()) {
    for (const m of members) {
      if (k === `${m.userId}:${m.level}`) {
        if (!obj.team_member.some(t => t[0]===m.userId && t[1]===team)) obj.team_member.push([m.userId, team]);
        FACT_CACHE.set(k, obj);
      }
    }
  }
}

export function getFacts(userId, level) {
  return FACT_CACHE.get(`${userId}:${level}`) || { answered_correct: [], answered_wrong: [], deadline: [] };
}

/**
 * Fügt ein Gamification-Event hinzu
 * @param {string} userId - Benutzer-ID
 * @param {number} level - Level-Nummer
 * @param {string} eventType - Art des Events (badge_earned, level_completed, etc.)
 * @param {object} data - Event-Daten
 */
export function addGameEvent(userId, level, eventType, data = {}) {
  const key = `${userId}:${level}`;
  const obj = FACT_CACHE.get(key) || createEmptyFacts();
  
  if (!obj.game_events) obj.game_events = [];
  
  const event = {
    userId,
    level,
    eventType,
    data,
    timestamp: new Date().toISOString()
  };
  
  obj.game_events.push(event);
  FACT_CACHE.set(key, obj);
  
  console.log(`🎮 Game event: ${userId} L${level} - ${eventType}`);
  
  // Event für Analytics
  emitEvent('game_event', {
    level,
    eventType,
    data,
    user_hash: hashUserId(userId)
  });
  
  return obj;
}

/**
 * Markiert ein Level als abgeschlossen
 * @param {string} userId - Benutzer-ID
 * @param {number} level - Level-Nummer
 * @param {object} completionData - Abschluss-Daten (Punkte, Zeit, etc.)
 */
export function markLevelCompleted(userId, level, completionData = {}) {
  const key = `${userId}:${level}`;
  const obj = FACT_CACHE.get(key) || createEmptyFacts();
  
  if (!obj.level_completions) obj.level_completions = [];
  
  const completion = {
    userId,
    level,
    timestamp: new Date().toISOString(),
    score: completionData.score || 0,
    time_spent: completionData.timeSpent || 0,
    attempts: completionData.attempts || 1,
    perfect: completionData.perfect || false
  };
  
  obj.level_completions.push(completion);
  FACT_CACHE.set(key, obj);
  
  console.log(`🏆 Level completed: ${userId} L${level} - Score: ${completion.score}`);
  
  // Game Event hinzufügen
  addGameEvent(userId, level, 'level_completed', completion);
  
  return obj;
}

/**
 * Setzt Facts für einen User/Level zurück
 * @param {string} userId - Benutzer-ID
 * @param {number} level - Level-Nummer
 */
export function resetFacts(userId, level) {
  const key = `${userId}:${level}`;
  FACT_CACHE.delete(key);
  
  console.log(`🔄 Facts reset: ${userId} L${level}`);
  
  emitEvent('facts_reset', {
    level,
    user_hash: hashUserId(userId)
  });
}

/**
 * Holt alle Facts für einen User (alle Level)
 * @param {string} userId - Benutzer-ID
 * @returns {object} Kombinierte Facts aller Level
 */
export function getAllUserFacts(userId) {
  const allFacts = createEmptyFacts();
  
  // Iteriere durch alle cached Facts für diesen User
  for (const [key, facts] of FACT_CACHE.entries()) {
    if (key.startsWith(`${userId}:`)) {
      allFacts.answered_correct.push(...(facts.answered_correct || []));
      allFacts.answered_wrong.push(...(facts.answered_wrong || []));
      allFacts.deadline.push(...(facts.deadline || []));
      
      if (facts.game_events) {
        if (!allFacts.game_events) allFacts.game_events = [];
        allFacts.game_events.push(...facts.game_events);
      }
      
      if (facts.level_completions) {
        if (!allFacts.level_completions) allFacts.level_completions = [];
        allFacts.level_completions.push(...facts.level_completions);
      }
    }
  }
  
  return allFacts;
}

/**
 * Cache-Statistiken abrufen
 * @returns {object} Cache-Metriken
 */
export function getCacheStats() {
  const stats = {
    total_entries: FACT_CACHE.size,
    unique_users: new Set(),
    levels_tracked: new Set(),
    total_answers: 0,
    correct_answers: 0,
    incorrect_answers: 0
  };
  
  for (const [key, facts] of FACT_CACHE.entries()) {
    const [userId, level] = key.split(':');
    stats.unique_users.add(userId);
    stats.levels_tracked.add(level);
    
    stats.total_answers += (facts.answered_correct?.length || 0) + (facts.answered_wrong?.length || 0);
    stats.correct_answers += facts.answered_correct?.length || 0;
    stats.incorrect_answers += facts.answered_wrong?.length || 0;
  }
  
  stats.unique_users = stats.unique_users.size;
  stats.levels_tracked = stats.levels_tracked.size;
  stats.accuracy = stats.total_answers > 0 ? 
    Math.round((stats.correct_answers / stats.total_answers) * 100) : 0;
  
  return stats;
}

// Hilfsfunktionen

function createEmptyFacts() {
  return {
    answered_correct: [],
    answered_wrong: [],
    deadline: []
  };
}

function ensureDeadlineFacts(facts, level) {
  // Füge automatisch Deadline-Facts hinzu wenn nicht vorhanden
  if (!facts.deadline.some(d => d[0] === level)) {
    // Standard-Deadline: 7 Tage ab heute
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 7);
    
    facts.deadline.push([level, deadline.toISOString()]);
  }
}

function generateSessionId(userId, timestamp) {
  // Einfache Session-ID basierend auf User und Datum
  const date = new Date(timestamp).toDateString();
  return hashUserId(`${userId}-${date}`);
}

function hashUserId(userId) {
  // Einfacher Hash für anonymisierte Analytics (in Produktion: crypto)
  return userId.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0).toString(36);
}

// Event-System für Monitoring (Platzhalter)
const eventListeners = new Map();

function emitEvent(eventType, data) {
  const listeners = eventListeners.get(eventType) || [];
  listeners.forEach(listener => {
    try {
      listener(data);
    } catch (error) {
      console.error(`Error in event listener for ${eventType}:`, error);
    }
  });
  
  // Log für Development
  if (process.env.NODE_ENV === 'development') {
    console.log(`📡 Event: ${eventType}`, JSON.stringify(data, null, 2));
  }
}

export function addEventListener(eventType, listener) {
  if (!eventListeners.has(eventType)) {
    eventListeners.set(eventType, []);
  }
  eventListeners.get(eventType).push(listener);
}

// Cleanup-Funktion für alte Facts (Memory Management)
export function cleanupOldFacts(maxAgeHours = 24) {
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - maxAgeHours);
  
  let cleaned = 0;
  
  for (const [key, facts] of FACT_CACHE.entries()) {
    // Prüfe ob alle Antworten älter als Cutoff sind
    const allAnswers = [...(facts.answered_correct || []), ...(facts.answered_wrong || [])];
    const hasRecentActivity = allAnswers.some(answer => new Date(answer[3]) > cutoff);
    
    if (!hasRecentActivity && allAnswers.length > 0) {
      FACT_CACHE.delete(key);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`🧹 Cleaned ${cleaned} old fact entries from cache`);
  }
  
  return cleaned;
} 