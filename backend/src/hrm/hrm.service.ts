/**
 * HRM Service - Orchestrator ("System 2")
 * Plans learning objectives, decomposes into sub-goals, selects mission/quest sequences
 */

import crypto from 'crypto';
import { 
  HRMPlanRequest, 
  HRMPlanResponse, 
  HRMUpdateRequest,
  HRMUpdateResponse,
  Quest,
  QKind,
  Difficulty,
  World
} from '../common/types.js';
import { PolicyLoader, PolicyConfig } from './policy.loader.js';
import { ReasoningRepo } from '../memory/repo.reasoning.js';

export class HRMService {
  constructor(
    private readonly policyLoader: PolicyLoader,
    private readonly reasoningRepo: ReasoningRepo
  ) {}

  /**
   * Plan a mission - creates hypothesis and quest set
   */
  async plan(req: HRMPlanRequest): Promise<HRMPlanResponse> {
    // Load policy for world
    const policy = await this.policyLoader.forWorld(req.goal.world);
    
    // Generate unique hypothesis ID
    const hypothesisId = crypto.randomUUID();
    
    // Determine starting difficulty
    const difficulty = req.context?.difficulty || policy.zpd.start as Difficulty;
    
    // Compose quest set based on policy
    const questSet = await this.composeQuestSet(
      policy, 
      req.goal.missionId, 
      difficulty
    );
    
    // Generate story briefing (using policy or simple template)
    const briefing = await this.generateBriefing(req.goal, policy, req.context?.lang);
    
    // Store hypothesis
    await this.reasoningRepo.writeHypothesis(
      req.userId, 
      hypothesisId, 
      policy, 
      { startDifficulty: difficulty }
    );
    
    return {
      hypothesisId,
      briefing,
      questSet,
      debriefSuccess: policy.story.debrief_success,
      debriefFail: policy.story.debrief_fail,
      cliffhanger: policy.story.cliffhanger,
    };
  }

  /**
   * Update hypothesis based on evaluation signals
   */
  async update(req: HRMUpdateRequest): Promise<HRMUpdateResponse> {
    const hypothesis = await this.reasoningRepo.getHypothesis(req.hypothesisId);
    
    if (!hypothesis) {
      return { ok: false };
    }

    // Update with new signals
    const updated = await this.reasoningRepo.updateHypothesis(
      req.hypothesisId,
      req.signals
    );

    return {
      ok: true,
      updatedHypothesis: updated,
    };
  }

  /**
   * Compose quest set based on policy
   */
  private async composeQuestSet(
    policy: PolicyConfig,
    missionId: string,
    difficulty: Difficulty
  ): Promise<Quest[]> {
    const quests: Quest[] = [];
    const { questions, risk_at, team_at } = policy.mission_template.questions;
    const totalQuestions = policy.compose.max_quests_per_loop;

    for (let i = 1; i <= totalQuestions; i++) {
      const questId = `${missionId}_q${i}`;
      let kind: QKind = 'standard';
      let riskConfig = undefined;
      let onWrongChallengeId = undefined;

      // Determine quest kind
      if (risk_at.includes(i)) {
        kind = 'risk';
        riskConfig = {
          maxAttempts: policy.risk_guard.max_attempts,
          cooldownMs: policy.risk_guard.cooldown_ms,
        };
        // Get boss challenge ID
        onWrongChallengeId = policy.risk_guard.boss_challenge_ids[`q${i}`];
      } else if (team_at.includes(i)) {
        kind = 'team';
      }

      // Generate question (simplified - in production, load from database)
      const quest = this.generateQuestion(
        questId,
        i,
        policy.world,
        kind,
        difficulty,
        onWrongChallengeId,
        riskConfig
      );

      quests.push(quest);
    }

    return quests;
  }

  /**
   * Generate a single question
   * In production, this would query a question bank
   */
  private generateQuestion(
    id: string,
    index: number,
    world: World,
    kind: QKind,
    difficulty: Difficulty,
    onWrongChallengeId?: string,
    riskConfig?: any
  ): Quest {
    // Template questions based on world and difficulty
    const questionTemplates = this.getQuestionTemplates(world, kind, difficulty);
    const template = questionTemplates[index % questionTemplates.length];

    return {
      id,
      index,
      world,
      kind,
      stem: template.stem,
      options: template.options,
      onWrongChallengeId,
      riskConfig,
    };
  }

  /**
   * Get question templates for world/kind/difficulty
   */
  private getQuestionTemplates(world: World, kind: QKind, difficulty: Difficulty): any[] {
    // Simplified templates - in production, load from database
    const templates: Record<World, any[]> = {
      health: [
        {
          stem: 'Welche Schutzkleidung muss im CleanRoom getragen werden?',
          options: [
            { id: 'a', text: 'Steriler Kittel, Handschuhe, Maske, Haube', correct: true },
            { id: 'b', text: 'Nur Handschuhe und Maske', correct: false },
            { id: 'c', text: 'Normale Arbeitskleidung reicht', correct: false },
            { id: 'd', text: 'Keine besonderen Anforderungen', correct: false },
          ],
        },
      ],
      it: [
        {
          stem: 'Was ist die wichtigste Maßnahme gegen Phishing?',
          options: [
            { id: 'a', text: 'Links vor dem Klicken überprüfen', correct: true },
            { id: 'b', text: 'Alle E-Mails löschen', correct: false },
            { id: 'c', text: 'Passwörter weitergeben', correct: false },
            { id: 'd', text: 'Firewall deaktivieren', correct: false },
          ],
        },
      ],
      legal: [
        {
          stem: 'Welcher DSGVO-Artikel regelt das Recht auf Löschung?',
          options: [
            { id: 'a', text: 'Artikel 17', correct: true },
            { id: 'b', text: 'Artikel 5', correct: false },
            { id: 'c', text: 'Artikel 32', correct: false },
            { id: 'd', text: 'Artikel 88', correct: false },
          ],
        },
      ],
      public: [
        {
          stem: 'Welche Priorität hat ein Eilantrag eines Bürgers?',
          options: [
            { id: 'a', text: 'Höchste - sofortige Bearbeitung', correct: true },
            { id: 'b', text: 'Normal - nach Reihenfolge', correct: false },
            { id: 'c', text: 'Niedrig - nach Standardanträgen', correct: false },
            { id: 'd', text: 'Keine Priorität', correct: false },
          ],
        },
      ],
      factory: [
        {
          stem: 'Was ist beim Not-Aus zu beachten?',
          options: [
            { id: 'a', text: 'Sofort betätigen bei Gefahr, dann Evakuierung', correct: true },
            { id: 'b', text: 'Erst Vorgesetzten fragen', correct: false },
            { id: 'c', text: 'Warten bis Schichtende', correct: false },
            { id: 'd', text: 'Ignorieren und weiterarbeiten', correct: false },
          ],
        },
      ],
    };

    return templates[world] || templates.health;
  }

  /**
   * Generate story briefing
   */
  private async generateBriefing(
    goal: HRMPlanRequest['goal'],
    policy: PolicyConfig,
    lang?: string
  ): Promise<string> {
    // Use policy story if available
    if (policy.story?.briefing) {
      return policy.story.briefing;
    }

    // Fallback template
    return `Willkommen zur Mission ${goal.missionId} in der ${goal.world}-Welt! Bereite dich auf spannende Herausforderungen vor!`;
  }
}


