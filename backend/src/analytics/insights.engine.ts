/**
 * Analytics & Insights Engine
 * ML-ready analytics für personalisierte Empfehlungen und Pattern-Detection
 */

import { World } from '../common/types.js';

export interface UserInsights {
  userId: string;
  generatedAt: string;
  
  // Performance insights
  performance: {
    overallScore: number; // 0-100
    strongWorlds: World[];
    weakWorlds: World[];
    improvementRate: number; // % pro Woche
    consistencyScore: number; // 0-100
  };
  
  // Learning patterns
  learningPatterns: {
    preferredDifficulty: 'easy' | 'medium' | 'hard';
    averageSessionLength: number; // Minuten
    peakPerformanceHours: number[]; // Stunden des Tages
    optimalQuestionPace: number; // Sekunden pro Frage
    fatigueThreshold: number; // Fragen bis Ermüdung
  };
  
  // Behavioral insights
  behavior: {
    helpUsageRate: number; // 0-1
    riskTakingLevel: 'conservative' | 'balanced' | 'aggressive';
    challengeSuccessRate: number; // 0-1
    teamCollaboration: 'low' | 'medium' | 'high';
    streakMaintenance: 'poor' | 'good' | 'excellent';
  };
  
  // Recommendations
  recommendations: {
    nextMission: {
      missionId: string;
      world: World;
      difficulty: 'easy' | 'medium' | 'hard';
      reason: string;
    };
    focusAreas: string[];
    skillGaps: string[];
    motivationTips: string[];
  };
  
  // Predictions
  predictions: {
    nextLevelUp: {
      estimatedDate: string;
      confidence: number; // 0-1
    };
    masteryCompletion: Record<World, {
      estimatedDate: string;
      confidence: number;
    }>;
  };
}

/**
 * Generate insights for user
 */
export function generateUserInsights(userData: {
  userId: string;
  missions: any[];
  attempts: any[];
  currentStreak: number;
  totalPoints: number;
}): UserInsights {
  const performance = analyzePerformance(userData);
  const learningPatterns = detectLearningPatterns(userData);
  const behavior = analyzeBehavior(userData);
  const recommendations = generateRecommendations(userData, performance, learningPatterns);
  const predictions = generatePredictions(userData, performance);

  return {
    userId: userData.userId,
    generatedAt: new Date().toISOString(),
    performance,
    learningPatterns,
    behavior,
    recommendations,
    predictions,
  };
}

/**
 * Analyze performance metrics
 */
function analyzePerformance(userData: any): UserInsights['performance'] {
  const missions = userData.missions || [];
  
  // Calculate overall score
  const totalScore = missions.reduce((sum: number, m: any) => {
    const missionScore = m.history?.filter((a: any) => a.correct).length || 0;
    return sum + missionScore;
  }, 0);
  const totalQuestions = missions.reduce((sum: number, m: any) => sum + (m.history?.length || 0), 0);
  const overallScore = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;

  // Identify strong/weak worlds
  const worldPerformance: Record<World, number> = {
    health: 0,
    it: 0,
    legal: 0,
    public: 0,
    factory: 0,
  };

  for (const mission of missions) {
    const world = extractWorldFromMissionId(mission.missionId);
    if (world) {
      const successRate = mission.success ? 100 : 0;
      worldPerformance[world] = (worldPerformance[world] + successRate) / 2;
    }
  }

  const sortedWorlds = Object.entries(worldPerformance)
    .sort(([, a], [, b]) => b - a)
    .map(([world]) => world as World);

  // Calculate improvement rate (last 7 days vs. previous 7 days)
  const improvementRate = calculateImprovementRate(missions);

  // Consistency score
  const consistencyScore = calculateConsistencyScore(missions);

  return {
    overallScore,
    strongWorlds: sortedWorlds.slice(0, 2),
    weakWorlds: sortedWorlds.slice(-2),
    improvementRate,
    consistencyScore,
  };
}

/**
 * Detect learning patterns
 */
function detectLearningPatterns(userData: any): UserInsights['learningPatterns'] {
  const missions = userData.missions || [];
  const attempts = userData.attempts || [];

  // Preferred difficulty
  const difficultyScores = {
    easy: 0,
    medium: 0,
    hard: 0,
  };

  for (const mission of missions) {
    if (mission.success) {
      difficultyScores[mission.difficulty || 'medium'] += 1;
    }
  }

  const preferredDifficulty = Object.entries(difficultyScores)
    .sort(([, a], [, b]) => b - a)[0][0] as any;

  // Average session length
  const sessionDurations = missions.map((m: any) => {
    if (!m.startedAt || !m.finishedAt) return 0;
    return (new Date(m.finishedAt).getTime() - new Date(m.startedAt).getTime()) / 60000;
  });
  const averageSessionLength = sessionDurations.length > 0
    ? Math.round(sessionDurations.reduce((sum: number, d: number) => sum + d, 0) / sessionDurations.length)
    : 10;

  // Peak performance hours
  const hourPerformance: Record<number, number> = {};
  for (const mission of missions) {
    if (!mission.startedAt) continue;
    const hour = new Date(mission.startedAt).getHours();
    hourPerformance[hour] = (hourPerformance[hour] || 0) + (mission.success ? 1 : 0);
  }
  const peakPerformanceHours = Object.entries(hourPerformance)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([hour]) => Number(hour));

  // Optimal question pace
  const timesPerQuestion = attempts.map((a: any) => a.timeMs || 10000);
  const optimalQuestionPace = timesPerQuestion.length > 0
    ? Math.round(timesPerQuestion.reduce((sum: number, t: number) => sum + t, 0) / timesPerQuestion.length / 1000)
    : 15;

  // Fatigue threshold
  const fatigueThreshold = calculateFatigueThreshold(missions);

  return {
    preferredDifficulty,
    averageSessionLength,
    peakPerformanceHours,
    optimalQuestionPace,
    fatigueThreshold,
  };
}

/**
 * Analyze behavior
 */
function analyzeBehavior(userData: any): UserInsights['behavior'] {
  const attempts = userData.attempts || [];
  const missions = userData.missions || [];

  // Help usage rate
  const helpUsed = attempts.filter((a: any) => a.helpUsed).length;
  const helpUsageRate = attempts.length > 0 ? helpUsed / attempts.length : 0;

  // Risk-taking level
  const riskQuestions = attempts.filter((a: any) => a.questId?.includes('risk') || a.questId?.includes('q5') || a.questId?.includes('q10'));
  const riskSuccess = riskQuestions.filter((a: any) => a.correct).length;
  const riskSuccessRate = riskQuestions.length > 0 ? riskSuccess / riskQuestions.length : 0;
  
  let riskTakingLevel: 'conservative' | 'balanced' | 'aggressive' = 'balanced';
  if (riskSuccessRate < 0.5) riskTakingLevel = 'conservative';
  if (riskSuccessRate > 0.8) riskTakingLevel = 'aggressive';

  // Challenge success rate
  const challenges = attempts.filter((a: any) => a.challengeOutcome);
  const challengeSuccess = challenges.filter((a: any) => a.challengeOutcome === 'success').length;
  const challengeSuccessRate = challenges.length > 0 ? challengeSuccess / challenges.length : 0;

  // Team collaboration (simplified)
  const teamQuestions = attempts.filter((a: any) => a.questId?.includes('team') || a.questId?.includes('q9'));
  const teamSuccess = teamQuestions.filter((a: any) => a.correct).length;
  const teamRate = teamQuestions.length > 0 ? teamSuccess / teamQuestions.length : 0;
  
  let teamCollaboration: 'low' | 'medium' | 'high' = 'medium';
  if (teamRate < 0.4) teamCollaboration = 'low';
  if (teamRate > 0.7) teamCollaboration = 'high';

  // Streak maintenance
  const currentStreak = userData.currentStreak || 0;
  let streakMaintenance: 'poor' | 'good' | 'excellent' = 'good';
  if (currentStreak < 3) streakMaintenance = 'poor';
  if (currentStreak > 10) streakMaintenance = 'excellent';

  return {
    helpUsageRate,
    riskTakingLevel,
    challengeSuccessRate,
    teamCollaboration,
    streakMaintenance,
  };
}

/**
 * Generate personalized recommendations
 */
function generateRecommendations(
  userData: any,
  performance: UserInsights['performance'],
  patterns: UserInsights['learningPatterns']
): UserInsights['recommendations'] {
  const recommendations: UserInsights['recommendations'] = {
    nextMission: {
      missionId: 'recommended_001',
      world: performance.weakWorlds[0] || 'health',
      difficulty: patterns.preferredDifficulty,
      reason: `Verbesserung in ${performance.weakWorlds[0]} empfohlen`,
    },
    focusAreas: [],
    skillGaps: [],
    motivationTips: [],
  };

  // Focus areas
  if (performance.weakWorlds.length > 0) {
    recommendations.focusAreas.push(
      `Übe mehr in ${performance.weakWorlds[0]}-Missionen`
    );
  }

  if (patterns.fatigueThreshold < 5) {
    recommendations.focusAreas.push('Kürzere Sessions für besseren Fokus');
  }

  // Skill gaps
  if (userData.behavior?.challengeSuccessRate < 0.5) {
    recommendations.skillGaps.push('Challenge-Techniken verbessern');
  }

  if (userData.behavior?.helpUsageRate > 0.3) {
    recommendations.skillGaps.push('Grundlagen-Wissen vertiefen');
  }

  // Motivation tips
  recommendations.motivationTips = [
    `Spiele während deiner Peak-Hours (${patterns.peakPerformanceHours[0]}:00 Uhr)`,
    'Setze dir tägliche Ziele mit Daily Quests',
    `Nutze ${patterns.preferredDifficulty} Difficulty für optimalen Flow`,
  ];

  return recommendations;
}

/**
 * Generate predictions
 */
function generatePredictions(
  userData: any,
  performance: UserInsights['performance']
): UserInsights['predictions'] {
  const now = new Date();
  
  // Predict next level up (based on improvement rate)
  const daysToLevelUp = performance.improvementRate > 0
    ? Math.ceil(100 / performance.improvementRate)
    : 30;
  
  const levelUpDate = new Date(now);
  levelUpDate.setDate(now.getDate() + daysToLevelUp);

  // Predict mastery completion per world
  const masteryCompletion: Record<World, { estimatedDate: string; confidence: number }> = {
    health: { estimatedDate: '', confidence: 0 },
    it: { estimatedDate: '', confidence: 0 },
    legal: { estimatedDate: '', confidence: 0 },
    public: { estimatedDate: '', confidence: 0 },
    factory: { estimatedDate: '', confidence: 0 },
  };

  for (const world of Object.keys(masteryCompletion) as World[]) {
    const worldMissions = userData.missions?.filter((m: any) => 
      m.missionId.includes(world)
    ) || [];
    
    const completionRate = worldMissions.length > 0
      ? worldMissions.filter((m: any) => m.success).length / worldMissions.length
      : 0;

    const daysToMastery = completionRate > 0
      ? Math.ceil((100 - completionRate * 100) / (completionRate * 7))
      : 90;

    const masteryDate = new Date(now);
    masteryDate.setDate(now.getDate() + daysToMastery);

    masteryCompletion[world] = {
      estimatedDate: masteryDate.toISOString(),
      confidence: Math.min(completionRate, 0.8),
    };
  }

  return {
    nextLevelUp: {
      estimatedDate: levelUpDate.toISOString(),
      confidence: Math.min(performance.improvementRate / 10, 0.9),
    },
    masteryCompletion,
  };
}

/**
 * Calculate improvement rate
 */
function calculateImprovementRate(missions: any[]): number {
  if (missions.length < 10) return 0;

  const recentMissions = missions.slice(0, 7);
  const olderMissions = missions.slice(7, 14);

  const recentScore = calculateAverageScore(recentMissions);
  const olderScore = calculateAverageScore(olderMissions);

  if (olderScore === 0) return 0;

  return Math.round(((recentScore - olderScore) / olderScore) * 100);
}

/**
 * Calculate consistency score
 */
function calculateConsistencyScore(missions: any[]): number {
  if (missions.length < 5) return 50;

  const scores = missions.map((m: any) => {
    const correct = m.history?.filter((a: any) => a.correct).length || 0;
    const total = m.history?.length || 10;
    return (correct / total) * 100;
  });

  const avg = scores.reduce((sum: number, s: number) => sum + s, 0) / scores.length;
  const variance = scores.reduce((sum: number, s: number) => sum + Math.pow(s - avg, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);

  // Lower stdDev = higher consistency
  const consistencyScore = Math.max(0, 100 - stdDev);

  return Math.round(consistencyScore);
}

/**
 * Calculate average score
 */
function calculateAverageScore(missions: any[]): number {
  if (missions.length === 0) return 0;

  const totalCorrect = missions.reduce((sum: number, m: any) => {
    return sum + (m.history?.filter((a: any) => a.correct).length || 0);
  }, 0);

  const totalQuestions = missions.reduce((sum: number, m: any) => {
    return sum + (m.history?.length || 0);
  }, 0);

  return totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
}

/**
 * Calculate fatigue threshold
 */
function calculateFatigueThreshold(missions: any[]): number {
  // Analyze when performance starts to drop within missions
  const dropPoints: number[] = [];

  for (const mission of missions) {
    if (!mission.history || mission.history.length < 5) continue;

    let peakIndex = 0;
    let peakScore = 0;

    for (let i = 0; i < mission.history.length; i++) {
      const score = mission.history[i].correct ? 1 : 0;
      if (score > peakScore) {
        peakScore = score;
        peakIndex = i;
      }
    }

    // Find where performance drops significantly
    for (let i = peakIndex + 1; i < mission.history.length; i++) {
      const score = mission.history[i].correct ? 1 : 0;
      if (score < peakScore * 0.5) {
        dropPoints.push(i + 1);
        break;
      }
    }
  }

  if (dropPoints.length === 0) return 10; // No fatigue detected

  const avgDropPoint = dropPoints.reduce((sum, p) => sum + p, 0) / dropPoints.length;
  return Math.round(avgDropPoint);
}

/**
 * Extract world from mission ID
 */
function extractWorldFromMissionId(missionId: string): World | null {
  const worldKeywords: Record<World, string[]> = {
    health: ['health', 'cleanroom', 'medical'],
    it: ['it', 'cyber', 'security'],
    legal: ['legal', 'law', 'dsgvo'],
    public: ['public', 'citizen', 'admin'],
    factory: ['factory', 'safety', 'production'],
  };

  const lowerMissionId = missionId.toLowerCase();

  for (const [world, keywords] of Object.entries(worldKeywords)) {
    if (keywords.some(kw => lowerMissionId.includes(kw))) {
      return world as World;
    }
  }

  return null;
}

/**
 * Generate AI-ready insights summary
 */
export function generateInsightsSummary(insights: UserInsights): string {
  const summary: string[] = [
    `📊 Insights für ${insights.userId}`,
    '',
    `Performance: ${insights.performance.overallScore}/100`,
    `Verbesserung: ${insights.performance.improvementRate > 0 ? '+' : ''}${insights.performance.improvementRate}% pro Woche`,
    `Konsistenz: ${insights.performance.consistencyScore}/100`,
    '',
    `🎯 Stärken: ${insights.performance.strongWorlds.join(', ')}`,
    `⚠️ Schwächen: ${insights.performance.weakWorlds.join(', ')}`,
    '',
    `🧠 Lernmuster:`,
    `• Bevorzugte Difficulty: ${insights.learningPatterns.preferredDifficulty}`,
    `• Durchschnittliche Session: ${insights.learningPatterns.averageSessionLength} Min`,
    `• Peak-Hours: ${insights.learningPatterns.peakPerformanceHours.join(', ')} Uhr`,
    '',
    `💡 Empfehlung:`,
    `• Nächste Mission: ${insights.recommendations.nextMission.missionId}`,
    `• Grund: ${insights.recommendations.nextMission.reason}`,
  ];

  return summary.join('\n');
}


