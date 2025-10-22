/**
 * Badges Service
 * Manages badge definitions and checks eligibility
 */

import { Badge, World } from '../common/types.js';
import { ProgressRepo } from '../memory/repo.progress.js';
import { UsersRepo } from '../memory/repo.users.js';

export class BadgesService {
  constructor(
    private readonly progressRepo: ProgressRepo,
    private readonly usersRepo: UsersRepo
  ) {}

  /**
   * Get all badge definitions
   */
  getAllBadges(): Badge[] {
    return [
      // Completion badges
      {
        id: 'first_mission',
        name: 'Erste Mission',
        description: 'Schließe deine erste Mission ab',
        icon: '🎯',
        condition: 'Complete any mission',
      },
      {
        id: 'perfect_mission',
        name: 'Perfekte Mission',
        description: 'Schließe eine Mission ohne Fehler ab',
        icon: '⭐',
        condition: 'Complete mission with 100% correct answers',
      },
      {
        id: 'speed_demon',
        name: 'Speedrun',
        description: 'Schließe eine Mission in unter 5 Minuten ab',
        icon: '⚡',
        condition: 'Complete mission in < 5 minutes',
      },

      // World-specific badges
      {
        id: 'health_master',
        name: 'Gesundheits-Experte',
        description: 'Meistere alle Health-Missionen',
        icon: '🏥',
        condition: 'Complete all missions in Health world',
      },
      {
        id: 'cyber_defender',
        name: 'Cyber-Verteidiger',
        description: 'Meistere alle IT-Missionen',
        icon: '🛡️',
        condition: 'Complete all missions in IT world',
      },
      {
        id: 'legal_eagle',
        name: 'Rechts-Adler',
        description: 'Meistere alle Legal-Missionen',
        icon: '⚖️',
        condition: 'Complete all missions in Legal world',
      },
      {
        id: 'public_servant',
        name: 'Bürgerhelfer',
        description: 'Meistere alle Public-Missionen',
        icon: '🏛️',
        condition: 'Complete all missions in Public world',
      },
      {
        id: 'safety_champion',
        name: 'Sicherheits-Champion',
        description: 'Meistere alle Factory-Missionen',
        icon: '🏭',
        condition: 'Complete all missions in Factory world',
      },

      // Challenge badges
      {
        id: 'boss_slayer',
        name: 'Boss-Bezwinger',
        description: 'Bestehe 5 Boss-Challenges',
        icon: '👑',
        condition: 'Complete 5 boss challenges successfully',
      },
      {
        id: 'risk_taker',
        name: 'Risikofreudiger',
        description: 'Bestehe 10 Risikofragen',
        icon: '🎲',
        condition: 'Complete 10 risk questions successfully',
      },

      // Team badges
      {
        id: 'squad_sync',
        name: 'Squad Sync',
        description: 'Erfolgreiche Team-Zusammenarbeit',
        icon: '🤝',
        condition: 'Complete team question with >50% team success',
      },
      {
        id: 'team_leader',
        name: 'Team-Leader',
        description: 'Führe dein Team zum Sieg',
        icon: '👥',
        condition: 'Complete 5 team questions with 100% team success',
      },

      // Point badges
      {
        id: 'point_collector',
        name: 'Punkte-Sammler',
        description: 'Sammle 10.000 Punkte',
        icon: '💰',
        condition: 'Earn 10,000 total points',
      },
      {
        id: 'point_master',
        name: 'Punkte-Meister',
        description: 'Sammle 50.000 Punkte',
        icon: '💎',
        condition: 'Earn 50,000 total points',
      },

      // Streak badges
      {
        id: 'streak_3',
        name: '3er-Streak',
        description: '3 richtige Antworten hintereinander',
        icon: '🔥',
        condition: 'Answer 3 questions correctly in a row',
      },
      {
        id: 'streak_10',
        name: '10er-Streak',
        description: '10 richtige Antworten hintereinander',
        icon: '🔥🔥',
        condition: 'Answer 10 questions correctly in a row',
      },

      // Special badges
      {
        id: 'comeback_kid',
        name: 'Comeback-Kid',
        description: 'Gewinne eine Mission mit nur 1 Leben übrig',
        icon: '💪',
        condition: 'Complete mission with only 1 life remaining',
      },
      {
        id: 'bonus_hunter',
        name: 'Bonus-Jäger',
        description: 'Gewinne 5 Bonus-Minigames',
        icon: '🎰',
        condition: 'Win 5 bonus minigames',
      },
    ];
  }

  /**
   * Check which badges a user has earned
   */
  async checkBadges(userId: string): Promise<Badge[]> {
    const earnedBadges: Badge[] = [];
    const allBadges = this.getAllBadges();

    const user = await this.usersRepo.getUser(userId);
    const history = await this.progressRepo.getUserHistory(userId);

    if (!user) return [];

    for (const badge of allBadges) {
      const earned = await this.checkBadgeEligibility(badge.id, userId, user, history);
      if (earned) {
        earnedBadges.push({
          ...badge,
          earnedAt: new Date().toISOString(),
        });
      }
    }

    return earnedBadges;
  }

  /**
   * Check eligibility for a specific badge
   */
  private async checkBadgeEligibility(
    badgeId: string,
    userId: string,
    user: any,
    history: any[]
  ): Promise<boolean> {
    const completedMissions = history.filter(h => h.finished && h.success);

    switch (badgeId) {
      case 'first_mission':
        return completedMissions.length >= 1;

      case 'perfect_mission':
        return completedMissions.some(m => 
          m.history.every((a: any) => a.correct)
        );

      case 'speed_demon':
        return completedMissions.some(m => {
          const duration = new Date(m.finishedAt).getTime() - new Date(m.startedAt).getTime();
          return duration < 5 * 60 * 1000; // 5 minutes
        });

      case 'health_master':
        return this.hasCompletedWorld(completedMissions, 'health');

      case 'cyber_defender':
        return this.hasCompletedWorld(completedMissions, 'it');

      case 'legal_eagle':
        return this.hasCompletedWorld(completedMissions, 'legal');

      case 'public_servant':
        return this.hasCompletedWorld(completedMissions, 'public');

      case 'safety_champion':
        return this.hasCompletedWorld(completedMissions, 'factory');

      case 'boss_slayer':
        return this.countBossChallenges(history) >= 5;

      case 'risk_taker':
        return this.countRiskQuestions(history) >= 10;

      case 'squad_sync':
        return this.hasTeamSuccess(history);

      case 'point_collector':
        return user.totalPoints >= 10000;

      case 'point_master':
        return user.totalPoints >= 50000;

      case 'streak_3':
        return this.hasStreak(history, 3);

      case 'streak_10':
        return this.hasStreak(history, 10);

      case 'comeback_kid':
        return completedMissions.some(m => m.lives === 1);

      default:
        return false;
    }
  }

  private hasCompletedWorld(missions: any[], world: World): boolean {
    // Simplified: check if at least 3 missions completed in this world
    const worldMissions = missions.filter(m => m.missionId.includes(world));
    return worldMissions.length >= 3;
  }

  private countBossChallenges(history: any[]): number {
    let count = 0;
    for (const mission of history) {
      for (const attempt of mission.history || []) {
        if (attempt.challengeOutcome === 'success' && 
            (attempt.questId.includes('q5') || attempt.questId.includes('q10'))) {
          count++;
        }
      }
    }
    return count;
  }

  private countRiskQuestions(history: any[]): number {
    let count = 0;
    for (const mission of history) {
      for (const attempt of mission.history || []) {
        if (attempt.correct && 
            (attempt.questId.includes('q5') || attempt.questId.includes('q10'))) {
          count++;
        }
      }
    }
    return count;
  }

  private hasTeamSuccess(history: any[]): boolean {
    for (const mission of history) {
      for (const attempt of mission.history || []) {
        if (attempt.questId.includes('team') || attempt.questId.includes('q9')) {
          return attempt.correct;
        }
      }
    }
    return false;
  }

  private hasStreak(history: any[], targetStreak: number): boolean {
    for (const mission of history) {
      let streak = 0;
      for (const attempt of mission.history || []) {
        if (attempt.correct) {
          streak++;
          if (streak >= targetStreak) return true;
        } else {
          streak = 0;
        }
      }
    }
    return false;
  }
}


