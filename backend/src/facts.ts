// Facts Builder - DB Data to Mangle Facts Conversion

export async function getFactsForUserModule(userId: string, moduleId: string): Promise<string[]> {
  const facts: string[] = [];
  
  // Current timestamp
  const now = new Date().toISOString();
  facts.push(`Now("${now}").`);
  
  // User Facts (simplified - replace with real DB queries)
  facts.push(`User(${userId}, "mitarbeiter", "orgA", "teamX").`);
  facts.push(`Module(${moduleId}, "datenschutz", 10).`);
  
  // Mock attempts for testing - replace with real DB query
  const attempts = await getAttemptsFromDB(userId, moduleId);
  attempts.forEach(attempt => {
    const { questionNo, type, isCorrect, timestamp } = attempt;
    facts.push(`Attempt(${userId}, ${moduleId}, ${questionNo}, "${type}", ${isCorrect}, "${timestamp}").`);
  });
  
  // Mock deadline - replace with real DB query
  const deadline = await getDeadlineFromDB(userId, moduleId);
  if (deadline) {
    facts.push(`Deadline(${userId}, ${moduleId}, "${deadline}").`);
  }
  
  // Mock level state - replace with real DB query
  const levelState = await getLevelStateFromDB(userId, moduleId);
  if (levelState) {
    facts.push(`LevelState(${userId}, ${moduleId}, ${levelState.level}, ${levelState.basePoints}).`);
  }
  
  // Team facts
  const teamData = await getTeamDataFromDB(userId);
  if (teamData) {
    facts.push(`TeamMember(${userId}, "${teamData.teamName}").`);
    if (teamData.teamSuccess) {
      facts.push(`TeamSuccess(${moduleId}, ${levelState?.level || 10}).`);
    }
  }
  
  // Computed facts
  const completedCount = attempts.filter(a => a.isCorrect).length;
  facts.push(`CompletedCount(${userId}, ${moduleId}, 10, ${completedCount}).`);
  
  // Error rate calculation
  const totalAttempts = attempts.length;
  const errorCount = attempts.filter(a => !a.isCorrect).length;
  const errorRate = totalAttempts > 0 ? errorCount / totalAttempts : 0;
  facts.push(`ErrorRate(${userId}, ${moduleId}, ${errorRate.toFixed(2)}).`);
  
  return facts;
}

// Mock DB functions - replace with real implementations
async function getAttemptsFromDB(userId: string, moduleId: string) {
  // TODO: Replace with real DB query
  // SELECT user_id, module_id, question_no, type, is_correct, created_at 
  // FROM attempts WHERE user_id = ? AND module_id = ?
  
  return [
    { questionNo: 1, type: "default", isCorrect: true, timestamp: "2025-08-24T10:00:00Z" },
    { questionNo: 2, type: "default", isCorrect: true, timestamp: "2025-08-24T10:05:00Z" },
    { questionNo: 3, type: "default", isCorrect: false, timestamp: "2025-08-24T10:10:00Z" },
    { questionNo: 4, type: "default", isCorrect: true, timestamp: "2025-08-24T10:15:00Z" },
    { questionNo: 5, type: "risk", isCorrect: true, timestamp: "2025-08-24T10:20:00Z" },
    { questionNo: 6, type: "default", isCorrect: true, timestamp: "2025-08-24T10:25:00Z" },
    { questionNo: 7, type: "default", isCorrect: true, timestamp: "2025-08-24T10:30:00Z" },
    { questionNo: 8, type: "default", isCorrect: true, timestamp: "2025-08-24T10:35:00Z" },
    { questionNo: 9, type: "team", isCorrect: true, timestamp: "2025-08-24T10:40:00Z" },
    { questionNo: 10, type: "risk", isCorrect: true, timestamp: "2025-08-24T10:45:00Z" }
  ];
}

async function getDeadlineFromDB(userId: string, moduleId: string): Promise<string | null> {
  // TODO: Replace with real DB query
  // SELECT deadline_ts FROM deadlines WHERE user_id = ? AND module_id = ?
  
  return "2025-08-29T21:59:00Z"; // Friday 21:59
}

async function getLevelStateFromDB(userId: string, moduleId: string) {
  // TODO: Replace with real DB query
  // SELECT level, base_points FROM level_state WHERE user_id = ? AND module_id = ?
  
  return {
    level: 10,
    basePoints: 1200
  };
}

async function getTeamDataFromDB(userId: string) {
  // TODO: Replace with real DB query
  // SELECT team_name, success_rate FROM team_data WHERE user_id = ?
  
  return {
    teamName: "DataScience",
    teamSuccess: true,
    successRate: 0.75
  };
}

export function escapeFactString(value: string): string {
  return value.replace(/"/g, '\\"').replace(/\\/g, '\\\\');
}

export function formatTimestamp(date: Date): string {
  return date.toISOString();
}

// Test data generator for development
export function generateTestFacts(userId: string, moduleId: string): string[] {
  return [
    `User(${userId}, "mitarbeiter", "orgA", "teamX").`,
    `Module(${moduleId}, "datenschutz", 10).`,
    `Attempt(${userId}, ${moduleId}, 5, "risk", true, "2025-08-24T13:10Z").`,
    `Attempt(${userId}, ${moduleId}, 10, "risk", true, "2025-08-24T13:12Z").`,
    `Deadline(${userId}, ${moduleId}, "2025-08-29T21:59:00Z").`,
    `Now("2025-08-25T09:00:00Z").`,
    `LevelState(${userId}, ${moduleId}, 10, 1200).`,
    `CompletedCount(${userId}, ${moduleId}, 10, 10).`,
    `TeamMember(${userId}, "DataScience").`,
    `TeamSuccess(${moduleId}, 10).`
  ];
} 