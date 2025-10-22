/**
 * Users Repository
 * Manages user profiles, preferences, and metadata
 */

import { World } from '../common/types.js';

export interface UserRecord {
  userId: string;
  avatar?: string;
  lang?: string;
  roles?: string[];
  totalPoints: number;
  streak: number;
  createdAt: string;
  updatedAt: string;
}

export class UsersRepo {
  private users: Map<string, UserRecord> = new Map();

  /**
   * Get user by ID
   */
  async getUser(userId: string): Promise<UserRecord | null> {
    return this.users.get(userId) || null;
  }

  /**
   * Create or update user
   */
  async upsertUser(userId: string, data: Partial<UserRecord>): Promise<UserRecord> {
    const existing = this.users.get(userId);
    const now = new Date().toISOString();

    const user: UserRecord = {
      userId,
      avatar: data.avatar || existing?.avatar,
      lang: data.lang || existing?.lang || 'de',
      roles: data.roles || existing?.roles || [],
      totalPoints: data.totalPoints ?? existing?.totalPoints ?? 0,
      streak: data.streak ?? existing?.streak ?? 0,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    this.users.set(userId, user);
    return user;
  }

  /**
   * Add points to user
   */
  async addPoints(userId: string, points: number): Promise<number> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    user.totalPoints += points;
    user.updatedAt = new Date().toISOString();
    this.users.set(userId, user);

    return user.totalPoints;
  }

  /**
   * Update streak
   */
  async updateStreak(userId: string, streak: number): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    user.streak = streak;
    user.updatedAt = new Date().toISOString();
    this.users.set(userId, user);
  }

  /**
   * Get mastery map (progress per world)
   */
  async getMasteryMap(userId: string): Promise<Record<World, number>> {
    // This is a simplified version
    // In production, calculate from completed missions
    return {
      health: 0,
      it: 0,
      legal: 0,
      public: 0,
      factory: 0,
    };
  }

  /**
   * List all users (for admin/debug)
   */
  async listUsers(): Promise<UserRecord[]> {
    return Array.from(this.users.values());
  }
}


