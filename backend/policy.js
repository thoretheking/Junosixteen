import axios from "axios";
import fs from "fs";
import path from "path";

const BASE_URL = process.env.POLICY_BASEURL || "http://localhost:8088";
const FIXTURES_PATH = process.env.FIXTURES_PATH || "../rules/fixtures";

// HTTP-Client mit Timeout und Retry-Logic
const mangleClient = axios.create({
  baseURL: BASE_URL,
  timeout: parseInt(process.env.MANGLE_TIMEOUT) || 5000,
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'JunoSixteen-Backend/1.0.0'
  }
});

// Retry-Logic für Mangle-Requests
async function callMangle(ruleset, facts, query, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Calling Mangle: ${ruleset} (attempt ${attempt}/${retries})`);
      
      const response = await mangleClient.post('/eval', {
        ruleset,
        facts,
        query
      });
      
      console.log(`Mangle response: ${response.status} - ${JSON.stringify(response.data.results).slice(0, 100)}...`);
      return response.data;
    } catch (error) {
      console.error(`Mangle call failed (attempt ${attempt}/${retries}):`, error.message);
      
      if (attempt === retries) {
        throw new Error(`Mangle service unavailable after ${retries} attempts: ${error.message}`);
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
    }
  }
}

export async function decideProgress(userId, level) {
  // 1) Bevorzugt Live-Facts (Event-Cache)
  const { getFacts } = await import('./events.js');
  let facts = getFacts(userId, level);

  // 2) Fallback: Fixture (nur für MVP)
  if (!facts.answered_correct?.length) {
    const p = path.join(process.cwd(), "rules/fixtures/lea_level3.json");
    if (fs.existsSync(p)) facts = JSON.parse(fs.readFileSync(p, "utf8"));
  }

  const body = { ruleset: "progress", facts, query: "can_start(U,Next)?" };
  const { data } = await mangleClient.post('/eval', body);

  const raw = JSON.stringify(data.results ?? data.raw ?? "");
  const needleU = `"${userId}"`;
  const needleNext = `"Next":${level + 1}`;

  return raw.includes(needleU) && raw.includes(needleNext);
}

export async function explainDecision(userId, level) {
  const { getFacts } = await import('./events.js');
  const facts = getFacts(userId, level);
  return { facts, query: "can_start(U,Next)?", note: "MVP: ohne Ableitungs-Trace" };
}

export async function checkTimeoutOrDeadline(userId, level) {
  const { getFacts } = await import('./events.js');
  const facts = getFacts(userId, level);
  const { data } = await mangleClient.post('/eval', {
    ruleset: "time",
    facts,
    query: "should_reset_due_timeout(U,L)?"
  });
  const raw = JSON.stringify(data.results ?? data.raw ?? "");
  return raw.includes(`"L":${level}`); // irgendein U -> Reset fällig
}

export async function decideRisk(userId, level) {
  const { getFacts } = await import('./events.js');
  const facts = getFacts(userId, level);
  const q1 = await mangleClient.post('/eval', { ruleset:"game", facts, query:"apply_multiplier(U,L,M)?" });
  const q2 = await mangleClient.post('/eval', { ruleset:"game", facts, query:"reset_level(U,L)?" });
  const raw1 = JSON.stringify(q1.data.results ?? q1.data.raw ?? "");
  const raw2 = JSON.stringify(q2.data.results ?? q2.data.raw ?? "");
  const apply = raw1.includes(`"U":"${userId}"`) && raw1.includes(`"L":${level}`);
  const reset = raw2.includes(`"U":"${userId}"`) && raw2.includes(`"L":${level}`);
  const mult = apply ? (raw1.includes(`"M":3`) ? 3 : 2) : 1; // falls später Team-Multis zusammenlaufen
  return { apply, reset, multiplier: mult };
}

export async function decideTeam(userId, level) {
  const { getFacts } = await import('./events.js');
  const facts = getFacts(userId, level);
  const r = await mangleClient.post('/eval', { ruleset:"game", facts, query:"apply_team_multiplier(U,L,M)?" });
  const raw = JSON.stringify(r.data.results ?? r.data.raw ?? "");
  const apply = raw.includes(`"U":"${userId}"`) && raw.includes(`"L":${level}`);
  const mult = apply && raw.includes(`"M":3`) ? 3 : 1;
  return { apply, multiplier: mult };
}

export async function decideCertificate(userId, courseId = "onboarding") {
  // Wir fragen die certificate-Regeln ab
  const facts = mergeFactsAcrossLevels(userId, courseId); // helper unten
  const { data } = await mangleClient.post('/eval', {
    ruleset: "certificate",
    facts,
    query: "award_certificate(U,C,Tier)?"
  });
  const raw = JSON.stringify(data.results ?? data.raw ?? "");
  const ok = raw.includes(`"U":"${userId}"`) && raw.includes(`"C":"${courseId}"`);
  let tier = "basic";
  if (ok && raw.includes(`"Tier":"gold"`)) tier = "gold";
  else if (ok && raw.includes(`"Tier":"silver"`)) tier = "silver";
  return { ok, tier };
}

// --- Helper: Alle Level-Fakten des Kurses zusammenführen ---
function mergeFactsAcrossLevels(userId, courseId) {
  // Holt Facts je Level aus dem Event-Cache und fusioniert.
  // Falls du bereits eine Kurs-weite Speicherung hast, ersetze diese Funktion.
  const { getFacts } = require('./events.js');
  const out = { completed_level:[], answered_correct:[], answered_wrong:[], course_of_level:[], team_member:[], risk_success:[], team_success:[] };
  for (let l=1; l<=10; l++) {
    const f = getFacts(userId, l);
    if (!f) continue;
    // primitive Merge:
    for (const k of Object.keys(out)) if (Array.isArray(f[k])) out[k].push(...f[k]);
    // Kurs-Mapping wenn fehlt:
    if (!out.course_of_level.some(x=>x[0]===l)) out.course_of_level.push([l, courseId]);
  }
  return out;
}

// Game-Mechaniken evaluieren
export async function evaluateGameMechanics(userId, level, action, context = {}) {
  const facts = await collectFacts(userId, level);
  
  // Erweitere Facts um Kontext
  const extendedFacts = {
    ...facts,
    current_action: [[userId, level, action, new Date().toISOString()]],
    ...context
  };
  
  let query;
  switch (action) {
    case 'risk_attempt':
      query = "apply_multiplier(U,L,M)?";
      break;
    case 'team_question':
      query = "apply_multiplier_team(U,L,M)?";
      break;
    case 'level_complete':
      query = "reset_level(U,L)?";
      break;
    default:
      query = "apply_multiplier(U,L,M)?";
  }
  
  const response = await callMangle("game", extendedFacts, query);
  
  return {
    action,
    results: response.results,
    applicable_rules: response.results.length > 0,
    timestamp: response.timestamp
  };
}

// Empfehlungen abrufen
export async function getRecommendations(userId, context = {}) {
  const facts = await collectFacts(userId, 'all'); // Alle Level berücksichtigen
  
  // Erweitere Facts um Kontext (z.B. falsch beantwortete Fragen)
  const extendedFacts = {
    ...facts,
    context_data: context,
    recommendation_timestamp: new Date().toISOString()
  };
  
  const response = await callMangle(
    "recommend",
    extendedFacts,
    "recommend_snack(U,M)?"
  );
  
  return {
    recommendations: response.results,
    priority: determinePriority(response.results),
    timestamp: response.timestamp
  };
}

// Zertifikatsberechtigung prüfen
export async function checkCertificateEligibility(userId, course) {
  const facts = await collectFacts(userId, 'all');
  
  const extendedFacts = {
    ...facts,
    target_course: course,
    check_timestamp: new Date().toISOString()
  };
  
  const response = await callMangle(
    "certs",
    extendedFacts,
    "award_certificate(U,Course)?"
  );
  
  const eligible = response.results.some(r => r.U === userId && r.Course === course);
  
  // Hole auch Anforderungen für detaillierte Antwort
  const requirementsResponse = await callMangle(
    "certs", 
    extendedFacts,
    "completed_all_levels(U,Course)?"
  );
  
  return {
    eligible,
    requirements: {
      completed_levels: requirementsResponse.results,
      violations: [], // TODO: aus "open_violations" Query
      missing: calculateMissingRequirements(userId, course, response.results)
    },
    timestamp: response.timestamp
  };
}

// Facts sammeln (aus Cache oder Fixtures)
async function collectFacts(userId, level) {
  // Versuche zuerst Cache (aus events.js)
  const { getFacts } = await import('./events.js');
  
  if (level === 'all') {
    // Sammle Facts für alle Level
    const allFacts = { answered_correct: [], answered_wrong: [], deadline: [] };
    
    for (let l = 1; l <= 10; l++) {
      const levelFacts = getFacts(userId, l);
      allFacts.answered_correct.push(...(levelFacts.answered_correct || []));
      allFacts.answered_wrong.push(...(levelFacts.answered_wrong || []));
      allFacts.deadline.push(...(levelFacts.deadline || []));
    }
    
    return allFacts;
  }
  
  let facts = getFacts(userId, level);
  
  // Fallback auf Fixtures, wenn keine Cache-Daten vorhanden
  if (!facts.answered_correct?.length && !facts.answered_wrong?.length) {
    console.log(`No cached facts for ${userId}:${level}, falling back to fixtures`);
    facts = await loadFixture(userId, level);
  }
  
  return facts;
}

// Fixture-Daten laden
async function loadFixture(userId, level) {
  try {
    const fixturePath = path.join(process.cwd(), FIXTURES_PATH, `${userId}_level${level}.json`);
    
    if (fs.existsSync(fixturePath)) {
      const data = fs.readFileSync(fixturePath, 'utf8');
      return JSON.parse(data);
    }
    
    // Fallback auf Standard-Fixture
    const defaultPath = path.join(process.cwd(), FIXTURES_PATH, 'lea_level3.json');
    if (fs.existsSync(defaultPath)) {
      const data = fs.readFileSync(defaultPath, 'utf8');
      return JSON.parse(data);
    }
    
    console.warn(`No fixture found for ${userId}:${level}, using empty facts`);
    return { answered_correct: [], answered_wrong: [], deadline: [] };
    
  } catch (error) {
    console.error(`Error loading fixture for ${userId}:${level}:`, error);
    return { answered_correct: [], answered_wrong: [], deadline: [] };
  }
}

// Hilfsfunktionen
function determinePriority(recommendations) {
  if (!Array.isArray(recommendations) || recommendations.length === 0) {
    return 'none';
  }
  
  // Priorität basierend auf Anzahl und Art der Empfehlungen
  if (recommendations.length >= 3) return 'high';
  if (recommendations.length >= 2) return 'medium';
  return 'low';
}

function calculateMissingRequirements(userId, course, eligibilityResults) {
  // TODO: Implementiere basierend auf Kurs-Requirements
  return {
    levels: [],
    assessments: [],
    timeRequirements: []
  };
}

// Health-Check für Mangle-Service
export async function checkMangleHealth() {
  try {
    const response = await mangleClient.get('/health');
    return {
      status: 'ok',
      mangle: response.data,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// --- Explainability ---
export async function explainWhy({ userId, level, sessionId }) {
  // 1) Fakten zusammensetzen (Level/Echtzeit)
  const { getFacts } = await import('./events.js');
  const facts = getFacts(userId, level);
  
  const queries = [
    { label: "status",          rule: "current_status(S, Sx)?", vars: ["Sx"] },
    { label: "completed_level", rule: "completed_level(U, L)?", vars: [] },
    { label: "count_correct",   rule: "count_correct(U, L, N)?", vars: ["N"] },
    { label: "deadline_missed", rule: "deadline_missed(U, L)?", vars: [] },
    { label: "timeout",         rule: "timeout(U, L, Q)?",      vars: ["Q"] },
    { label: "risk_success",    rule: "risk_success(U, L)?",     vars: [] },
    { label: "risk_fail",       rule: "reset_level(U, L)?",      vars: [] },
    { label: "team_success",    rule: "team_success(T, L)?",     vars: ["T"] },
    { label: "apply_mult",      rule: "apply_multiplier(U, L, M)?", vars: ["M"] },
    { label: "apply_team_mult", rule: "apply_team_multiplier(U, L, M)?", vars: ["M"] },
    { label: "can_start_next",  rule: "can_start(U, Next)?", vars: ["Next"] }
  ];

  // 2) Alle relevanten Regeln nacheinander evaluieren
  const results = {};
  for (const q of queries) {
    try {
      const response = await mangleClient.post('/eval', {
        ruleset: "why",
        facts,
        query: q.rule
      });
      const raw = response.data.results ?? response.data.raw ?? "";
      results[q.label] = raw;
    } catch (error) {
      console.warn(`Query ${q.label} failed:`, error.message);
      results[q.label] = null;
    }
  }

  // 3) Kompakte Erklärung erzeugen (lesbar im UI)
  const pick = (label) => JSON.stringify(results[label] ?? "");
  const explanation = {
    summary: {
      status:       pick("status"),
      canStartNext: pick("can_start_next")
    },
    causes: {
      completed_level: pick("completed_level"),
      correct_count:   pick("count_correct"),
      deadline_missed: pick("deadline_missed"),
      timeout:         pick("timeout"),
      risk_success:    pick("risk_success"),
      risk_fail:       pick("risk_fail"),
      team_success:    pick("team_success"),
      mult:            pick("apply_mult"),
      team_mult:       pick("apply_team_mult")
    },
    ui: [
      results.deadline_missed ? "Frist überschritten" : null,
      results.risk_fail      ? "Risikofrage falsch"   : null,
      results.team_success   ? "Teamfrage bestanden"   : null,
      results.completed_level? "Level vollständig"     : null
    ].filter(Boolean)
  };
  
  return explanation;
}

// --- Leaderboard Functions ---

export async function getLeaderboard(type, period, limit = 10) {
  // Generate sample leaderboard facts (in real app: from database)
  const facts = await generateLeaderboardFacts();
  
  let query;
  if (type === 'individual') {
    query = `top_individual_leaders(_UserId, _Name, _Points, _Rank, "${period}").`;
  } else if (type === 'team') {
    query = `top_team_leaders(_TeamId, _Points, _Rank, _MemberCount, "${period}").`;
  } else {
    throw new Error('Invalid leaderboard type. Use: individual, team');
  }

  const response = await mangleClient.post('/eval', {
    ruleset: "leaderboard",
    facts,
    query
  });

  const results = response.data.results || [];
  const leaderboard = results.slice(0, limit);

  return {
    type,
    period,
    leaderboard: leaderboard.map((entry, index) => {
      if (type === 'individual') {
        return {
          userId: entry.UserId,
          name: entry.Name,
          points: entry.Points,
          rank: entry.Rank || index + 1
        };
      } else {
        return {
          teamId: entry.TeamId,
          points: entry.Points,
          rank: entry.Rank || index + 1,
          memberCount: entry.MemberCount
        };
      }
    }),
    total_entries: results.length,
    generated_at: new Date().toISOString()
  };
}

export async function getUserStats(userId) {
  const facts = await generateLeaderboardFacts();
  
  const response = await mangleClient.post('/eval', {
    ruleset: "leaderboard",
    facts,
    query: `user_leaderboard_stats("${userId}", _AllTimeRank, _AllTimePoints, _WeeklyRank, _WeeklyPoints, _MonthlyRank, _MonthlyPoints).`
  });

  const stats = response.data.results?.[0];
  
  if (!stats) {
    return {
      userId,
      error: 'User not found or no stats available',
      generated_at: new Date().toISOString()
    };
  }

  return {
    userId,
    stats: {
      alltime: {
        rank: stats.AllTimeRank,
        points: stats.AllTimePoints
      },
      weekly: {
        rank: stats.WeeklyRank,
        points: stats.WeeklyPoints
      },
      monthly: {
        rank: stats.MonthlyRank,
        points: stats.MonthlyPoints
      }
    },
    generated_at: new Date().toISOString()
  };
}

export async function getTeamStats(teamId) {
  const facts = await generateLeaderboardFacts();
  
  const response = await mangleClient.post('/eval', {
    ruleset: "leaderboard",
    facts,
    query: `team_leaderboard_stats("${teamId}", _AllTimeRank, _AllTimePoints, _WeeklyRank, _WeeklyPoints, _MemberCount, _ActiveMembers).`
  });

  const stats = response.data.results?.[0];
  
  if (!stats) {
    return {
      teamId,
      error: 'Team not found or no stats available',
      generated_at: new Date().toISOString()
    };
  }

  return {
    teamId,
    stats: {
      alltime: {
        rank: stats.AllTimeRank,
        points: stats.AllTimePoints
      },
      weekly: {
        rank: stats.WeeklyRank,
        points: stats.WeeklyPoints
      },
      members: {
        total: stats.MemberCount,
        active_this_week: stats.ActiveMembers
      }
    },
    generated_at: new Date().toISOString()
  };
}

export async function getUserBadges(userId) {
  const facts = await generateLeaderboardFacts();
  
  const badgeQueries = [
    'top_performer_badge',
    'team_player_badge', 
    'consistent_learner_badge',
    'speed_runner_badge'
  ];

  const badges = [];
  
  for (const badgeType of badgeQueries) {
    try {
      const response = await mangleClient.post('/eval', {
        ruleset: "leaderboard",
        facts,
        query: `${badgeType}("${userId}").`
      });
      
      if (response.data.results?.length > 0) {
        badges.push({
          type: badgeType,
          name: badgeType.replace('_badge', '').replace('_', ' '),
          earned_at: new Date().toISOString(),
          description: getBadgeDescription(badgeType)
        });
      }
    } catch (error) {
      console.warn(`Badge check failed for ${badgeType}:`, error.message);
    }
  }

  return {
    userId,
    badges,
    badge_count: badges.length,
    generated_at: new Date().toISOString()
  };
}

// Helper: Badge descriptions
function getBadgeDescription(badgeType) {
  const descriptions = {
    'top_performer_badge': '🥇 Top 10% aller Spieler',
    'team_player_badge': '👥 Mindestens 5 Team-Completions',
    'consistent_learner_badge': '📅 3+ Wochen aktiv',
    'speed_runner_badge': '⚡ Level in unter 30 Minuten'
  };
  return descriptions[badgeType] || 'Badge erhalten';
}

// Helper: Generate sample leaderboard facts
async function generateLeaderboardFacts() {
  const facts = [];
  
  // Current time
  facts.push({
    predicate: 'now',
    args: [new Date().toISOString()]
  });

  // Sample users with completions
  const sampleUsers = [
    { id: 'lea', name: 'Lea Müller', dept: 'IT' },
    { id: 'max', name: 'Max Schmidt', dept: 'Marketing' },
    { id: 'kim', name: 'Kim Chen', dept: 'IT' },
    { id: 'tom', name: 'Tom Weber', dept: 'Sales' },
    { id: 'anna', name: 'Anna Fischer', dept: 'HR' }
  ];

  const sampleTeams = [
    { id: 'team-alpha', members: ['lea', 'max'] },
    { id: 'team-beta', members: ['kim', 'tom'] },
    { id: 'team-gamma', members: ['anna'] }
  ];

  // Generate user profiles
  sampleUsers.forEach(user => {
    facts.push({
      predicate: 'user_profile',
      args: [user.id, user.name, user.dept, 'employee']
    });
  });

  // Generate team memberships
  sampleTeams.forEach(team => {
    team.members.forEach(userId => {
      facts.push({
        predicate: 'team_member',
        args: [userId, team.id]
      });
    });
  });

  // Generate sample completions with realistic points
  const now = new Date();
  const thisWeek = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
  const lastWeek = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000));

  const completions = [
    // This week completions
    { userId: 'lea', sessionId: 'sess-lea-w1', level: 3, completedAt: now.toISOString(), points: 465 },
    { userId: 'max', sessionId: 'sess-max-w1', level: 3, completedAt: thisWeek.toISOString(), points: 420 },
    { userId: 'kim', sessionId: 'sess-kim-w1', level: 2, completedAt: thisWeek.toISOString(), points: 380 },
    
    // Last week completions
    { userId: 'lea', sessionId: 'sess-lea-w0', level: 2, completedAt: lastWeek.toISOString(), points: 350 },
    { userId: 'tom', sessionId: 'sess-tom-w0', level: 2, completedAt: lastWeek.toISOString(), points: 320 },
    { userId: 'anna', sessionId: 'sess-anna-w0', level: 1, completedAt: lastWeek.toISOString(), points: 280 }
  ];

  completions.forEach(completion => {
    facts.push({
      predicate: 'user_completion',
      args: [
        completion.userId,
        completion.sessionId,
        completion.level,
        completion.completedAt,
        completion.points
      ]
    });
  });

  // Session start times for speed runner badge
  completions.forEach(completion => {
    const startTime = new Date(completion.completedAt);
    startTime.setMinutes(startTime.getMinutes() - (completion.userId === 'lea' ? 25 : 45)); // Lea is fast!
    
    facts.push({
      predicate: 'session_start_time',
      args: [completion.sessionId, startTime.toISOString()]
    });
  });

  return facts;
} 