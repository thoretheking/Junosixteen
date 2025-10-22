/**
 * Telemetry Events Controller
 * Collects and processes telemetry events from clients
 */

import { Request, Response } from 'express';
import { TelemetryEvent } from '../common/types.js';

export class EventsController {
  private events: TelemetryEvent[] = [];
  private readonly maxEvents = 10000; // Keep last 10k events

  /**
   * POST /telemetry/event
   * Log a telemetry event
   */
  async logEvent(req: Request, res: Response): Promise<void> {
    try {
      const event: Omit<TelemetryEvent, 'timestamp'> = req.body;

      // Validate required fields
      if (!event.eventType || !event.userId) {
        res.status(400).json({
          error: 'Missing required fields: eventType, userId',
        });
        return;
      }

      // Add timestamp
      const telemetryEvent: TelemetryEvent = {
        ...event,
        timestamp: new Date().toISOString(),
      };

      // Store event
      this.events.push(telemetryEvent);

      // Trim if exceeding max
      if (this.events.length > this.maxEvents) {
        this.events = this.events.slice(-this.maxEvents);
      }

      // Log to console for debugging
      this.logToConsole(telemetryEvent);

      res.json({
        ok: true,
        eventId: this.events.length - 1,
      });
    } catch (error) {
      console.error('Error in telemetry event:', error);
      res.status(500).json({
        error: 'Failed to log event',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /telemetry/batch
   * Log multiple events at once
   */
  async logBatch(req: Request, res: Response): Promise<void> {
    try {
      const events: Omit<TelemetryEvent, 'timestamp'>[] = req.body.events;

      if (!Array.isArray(events)) {
        res.status(400).json({
          error: 'Invalid request: events must be an array',
        });
        return;
      }

      const eventIds: number[] = [];

      for (const event of events) {
        const telemetryEvent: TelemetryEvent = {
          ...event,
          timestamp: new Date().toISOString(),
        };

        this.events.push(telemetryEvent);
        eventIds.push(this.events.length - 1);
      }

      // Trim if exceeding max
      if (this.events.length > this.maxEvents) {
        this.events = this.events.slice(-this.maxEvents);
      }

      res.json({
        ok: true,
        count: eventIds.length,
        eventIds,
      });
    } catch (error) {
      console.error('Error in telemetry batch:', error);
      res.status(500).json({
        error: 'Failed to log batch events',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /telemetry/events/:userId
   * Get events for a user
   */
  async getUserEvents(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 100;

      const userEvents = this.events
        .filter(e => e.userId === userId)
        .slice(-limit);

      res.json({
        userId,
        events: userEvents,
        count: userEvents.length,
      });
    } catch (error) {
      console.error('Error getting user events:', error);
      res.status(500).json({
        error: 'Failed to get user events',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /telemetry/analytics/:userId
   * Get analytics summary for a user
   */
  async getAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      const userEvents = this.events.filter(e => e.userId === userId);

      // Calculate analytics
      const analytics = {
        totalEvents: userEvents.length,
        eventTypes: this.countEventTypes(userEvents),
        missionsStarted: userEvents.filter(e => e.eventType === 'mission_started').length,
        missionsFinished: userEvents.filter(e => e.eventType === 'mission_finished').length,
        challengesStarted: userEvents.filter(e => e.eventType === 'challenge_start').length,
        challengesCompleted: userEvents.filter(e => e.eventType === 'challenge_finish').length,
        minigamesPlayed: userEvents.filter(e => e.eventType === 'minigame_success').length,
        averageSessionDuration: this.calculateAverageSessionDuration(userEvents),
      };

      res.json(analytics);
    } catch (error) {
      console.error('Error getting analytics:', error);
      res.status(500).json({
        error: 'Failed to get analytics',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Helper: Count event types
   */
  private countEventTypes(events: TelemetryEvent[]): Record<string, number> {
    const counts: Record<string, number> = {};

    for (const event of events) {
      counts[event.eventType] = (counts[event.eventType] || 0) + 1;
    }

    return counts;
  }

  /**
   * Helper: Calculate average session duration
   */
  private calculateAverageSessionDuration(events: TelemetryEvent[]): number {
    const sessions: { start: number; end: number }[] = [];
    let currentSession: { start: number; end: number } | null = null;

    for (const event of events) {
      const timestamp = new Date(event.timestamp).getTime();

      if (event.eventType === 'mission_started') {
        currentSession = { start: timestamp, end: timestamp };
      } else if (event.eventType === 'mission_finished' && currentSession) {
        currentSession.end = timestamp;
        sessions.push(currentSession);
        currentSession = null;
      } else if (currentSession) {
        currentSession.end = timestamp;
      }
    }

    if (sessions.length === 0) return 0;

    const totalDuration = sessions.reduce(
      (sum, session) => sum + (session.end - session.start),
      0
    );

    return Math.round(totalDuration / sessions.length / 1000); // Return in seconds
  }

  /**
   * Helper: Log to console (structured)
   */
  private logToConsole(event: TelemetryEvent): void {
    const emoji = this.getEmojiForEventType(event.eventType);
    console.log(
      `${emoji} [TELEMETRY] ${event.eventType} | User: ${event.userId} | Mission: ${event.missionId || 'N/A'}`
    );
  }

  /**
   * Helper: Get emoji for event type
   */
  private getEmojiForEventType(eventType: string): string {
    const emojiMap: Record<string, string> = {
      mission_started: '🚀',
      quest_view: '👀',
      answer_click: '🖱️',
      challenge_start: '⚔️',
      challenge_finish: '✅',
      risk_cooldown_start: '⏱️',
      avatar_voice_play: '🔊',
      minigame_success: '🎰',
      mission_finished: '🏁',
    };

    return emojiMap[eventType] || '📊';
  }
}


