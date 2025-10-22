import { describe, it, expect, beforeEach } from '@jest/globals';
import { PolicyLoader, PolicyConfig } from '../../src/hrm/policy.loader';
import { World } from '../../src/common/types';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';

/**
 * HRM Policy Parser Unit Tests
 * Tests für das Laden und Parsen von YAML Policy-Dateien
 */

describe('HRM Policy Parser', () => {
  let policyLoader: PolicyLoader;
  const testPoliciesDir = join(process.cwd(), 'test-policies-temp');
  
  beforeEach(() => {
    // Create temporary policies directory
    try {
      mkdirSync(testPoliciesDir, { recursive: true });
    } catch (e) {
      // Directory might already exist
    }
    
    policyLoader = new PolicyLoader(testPoliciesDir);
  });
  
  afterEach(() => {
    // Clean up temporary directory
    try {
      rmSync(testPoliciesDir, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors
    }
  });
  
  describe('YAML Parsing', () => {
    it('sollte einfache Key-Value-Paare korrekt parsen', async () => {
      const yamlContent = `
policy_version: "1.0"
world: factory
      `.trim();
      
      writeFileSync(join(testPoliciesDir, 'factory.yaml'), yamlContent);
      
      const policy = await policyLoader.forWorld('factory' as World);
      
      expect(policy.policy_version).toBe('1.0');
      expect(policy.world).toBe('factory');
    });
    
    it('sollte verschachtelte Objekte korrekt parsen', async () => {
      const yamlContent = `
policy_version: "1.0"
world: factory
mission_template:
  lives_start: 3
  questions:
    standard: 7
    risk_at: [5, 10]
    team_at: [9]
  challenge_fallback: true
      `.trim();
      
      writeFileSync(join(testPoliciesDir, 'factory.yaml'), yamlContent);
      
      const policy = await policyLoader.forWorld('factory' as World);
      
      expect(policy.mission_template.lives_start).toBe(3);
      expect(policy.mission_template.questions.standard).toBe(7);
      expect(policy.mission_template.questions.risk_at).toEqual([5, 10]);
      expect(policy.mission_template.questions.team_at).toEqual([9]);
      expect(policy.mission_template.challenge_fallback).toBe(true);
    });
    
    it('sollte Arrays korrekt parsen', async () => {
      const yamlContent = `
policy_version: "1.0"
world: factory
zpd:
  start: "beginner"
  adjust_rules:
    - when: "3_correct_in_row"
      do: "bump_intermediate"
    - when: "2_wrong_in_row"
      do: "drop_easier"
      `.trim();
      
      writeFileSync(join(testPoliciesDir, 'factory.yaml'), yamlContent);
      
      const policy = await policyLoader.forWorld('factory' as World);
      
      expect(Array.isArray(policy.zpd.adjust_rules)).toBe(true);
      expect(policy.zpd.adjust_rules).toHaveLength(2);
      expect(policy.zpd.adjust_rules[0].when).toBe('3_correct_in_row');
      expect(policy.zpd.adjust_rules[0].do).toBe('bump_intermediate');
    });
    
    it('sollte Zahlen korrekt als Number-Typ parsen', async () => {
      const yamlContent = `
policy_version: "1.0"
world: factory
gamification:
  base_points:
    standard: 100
    risk: 200
    team: 300
  bonus_minigame:
    points: 5000
    life_plus: 1
    life_cap: 5
      `.trim();
      
      writeFileSync(join(testPoliciesDir, 'factory.yaml'), yamlContent);
      
      const policy = await policyLoader.forWorld('factory' as World);
      
      expect(typeof policy.gamification.base_points.standard).toBe('number');
      expect(policy.gamification.base_points.standard).toBe(100);
      expect(policy.gamification.bonus_minigame.points).toBe(5000);
      expect(policy.gamification.bonus_minigame.life_cap).toBe(5);
    });
    
    it('sollte Booleans korrekt parsen', async () => {
      const yamlContent = `
policy_version: "1.0"
world: factory
mission_template:
  lives_start: 3
  challenge_fallback: true
risk_guard:
  max_attempts: 2
  cooldown_ms: 30000
      `.trim();
      
      writeFileSync(join(testPoliciesDir, 'factory.yaml'), yamlContent);
      
      const policy = await policyLoader.forWorld('factory' as World);
      
      expect(typeof policy.mission_template.challenge_fallback).toBe('boolean');
      expect(policy.mission_template.challenge_fallback).toBe(true);
    });
    
    it('sollte Kommentare ignorieren', async () => {
      const yamlContent = `
# Dies ist ein Kommentar
policy_version: "1.0"
# Noch ein Kommentar
world: factory
      `.trim();
      
      writeFileSync(join(testPoliciesDir, 'factory.yaml'), yamlContent);
      
      const policy = await policyLoader.forWorld('factory' as World);
      
      expect(policy.policy_version).toBe('1.0');
      expect(policy.world).toBe('factory');
    });
    
    it('sollte leere Zeilen ignorieren', async () => {
      const yamlContent = `
policy_version: "1.0"

world: factory

mission_template:
  lives_start: 3
      `.trim();
      
      writeFileSync(join(testPoliciesDir, 'factory.yaml'), yamlContent);
      
      const policy = await policyLoader.forWorld('factory' as World);
      
      expect(policy.policy_version).toBe('1.0');
      expect(policy.world).toBe('factory');
      expect(policy.mission_template.lives_start).toBe(3);
    });
  });
  
  describe('Policy Loading (forWorld)', () => {
    it('sollte Policy für Factory-World laden', async () => {
      const yamlContent = `
policy_version: "1.0"
world: factory
mission_template:
  lives_start: 3
  questions:
    standard: 7
    risk_at: [5, 10]
    team_at: [9]
      `.trim();
      
      writeFileSync(join(testPoliciesDir, 'factory.yaml'), yamlContent);
      
      const policy = await policyLoader.forWorld('factory' as World);
      
      expect(policy.world).toBe('factory');
      expect(policy.mission_template.lives_start).toBe(3);
    });
    
    it('sollte Policy für IT-World laden', async () => {
      const yamlContent = `
policy_version: "1.0"
world: it
mission_template:
  lives_start: 3
  questions:
    standard: 7
    risk_at: [5, 10]
    team_at: [9]
      `.trim();
      
      writeFileSync(join(testPoliciesDir, 'it.yaml'), yamlContent);
      
      const policy = await policyLoader.forWorld('it' as World);
      
      expect(policy.world).toBe('it');
    });
    
    it('sollte verschiedene Welten separat laden', async () => {
      // Factory Policy
      const factoryYaml = `
policy_version: "1.0"
world: factory
gamification:
  base_points:
    standard: 100
      `.trim();
      
      // IT Policy
      const itYaml = `
policy_version: "1.0"
world: it
gamification:
  base_points:
    standard: 150
      `.trim();
      
      writeFileSync(join(testPoliciesDir, 'factory.yaml'), factoryYaml);
      writeFileSync(join(testPoliciesDir, 'it.yaml'), itYaml);
      
      const factoryPolicy = await policyLoader.forWorld('factory' as World);
      const itPolicy = await policyLoader.forWorld('it' as World);
      
      expect(factoryPolicy.gamification.base_points.standard).toBe(100);
      expect(itPolicy.gamification.base_points.standard).toBe(150);
    });
  });
  
  describe('Caching', () => {
    it('sollte Policy beim zweiten Aufruf aus Cache laden', async () => {
      const yamlContent = `
policy_version: "1.0"
world: factory
mission_template:
  lives_start: 3
      `.trim();
      
      writeFileSync(join(testPoliciesDir, 'factory.yaml'), yamlContent);
      
      // Erster Aufruf - lädt von Datei
      const policy1 = await policyLoader.forWorld('factory' as World);
      
      // Zweiter Aufruf - sollte aus Cache kommen
      const policy2 = await policyLoader.forWorld('factory' as World);
      
      expect(policy1).toBe(policy2); // Exakt dasselbe Objekt
    });
    
    it('sollte verschiedene Welten separat cachen', async () => {
      const factoryYaml = `
policy_version: "1.0"
world: factory
      `.trim();
      
      const itYaml = `
policy_version: "1.0"
world: it
      `.trim();
      
      writeFileSync(join(testPoliciesDir, 'factory.yaml'), factoryYaml);
      writeFileSync(join(testPoliciesDir, 'it.yaml'), itYaml);
      
      const factory1 = await policyLoader.forWorld('factory' as World);
      const it1 = await policyLoader.forWorld('it' as World);
      const factory2 = await policyLoader.forWorld('factory' as World);
      
      expect(factory1).toBe(factory2);
      expect(factory1).not.toBe(it1);
    });
  });
  
  describe('Validierung', () => {
    it('sollte Fehler werfen wenn World nicht übereinstimmt', async () => {
      const yamlContent = `
policy_version: "1.0"
world: it
      `.trim();
      
      writeFileSync(join(testPoliciesDir, 'factory.yaml'), yamlContent);
      
      await expect(
        policyLoader.forWorld('factory' as World)
      ).rejects.toThrow();
    });
    
    it('sollte Fehler werfen wenn Policy-Datei nicht existiert', async () => {
      await expect(
        policyLoader.forWorld('nonexistent' as World)
      ).rejects.toThrow('Failed to load policy for world: nonexistent');
    });
  });
  
  describe('Vollständige Policy-Struktur', () => {
    it('sollte vollständige Factory-Policy korrekt parsen', async () => {
      const yamlContent = `
policy_version: "1.0"
world: factory
mission_template:
  lives_start: 3
  questions:
    standard: 7
    risk_at: [5, 10]
    team_at: [9]
  challenge_fallback: true
compose:
  max_quests_per_loop: 10
  modality_weights:
    mcq: 0.6
    challenge: 0.25
    reflection: 0.15
zpd:
  start: "beginner"
  adjust_rules:
    - when: "3_correct_in_row"
      do: "bump_intermediate"
    - when: "2_wrong_in_row"
      do: "drop_easier"
risk_guard:
  max_attempts: 2
  cooldown_ms: 30000
  boss_challenge_ids:
    "5": "factory_boss_q5"
    "10": "factory_boss_q10"
gamification:
  base_points:
    standard: 100
    risk: 200
    team: 300
  bonus_minigame:
    points: 5000
    life_plus: 1
    life_cap: 5
avatar_feedback:
  success_style: "encouraging"
  fail_style: "supportive"
story:
  briefing: "Willkommen in der Fabrik!"
  debrief_success: "Großartig! Du hast die Mission gemeistert!"
  debrief_fail: "Nicht aufgeben - versuche es erneut!"
  cliffhanger: "Fortsetzung folgt..."
      `.trim();
      
      writeFileSync(join(testPoliciesDir, 'factory.yaml'), yamlContent);
      
      const policy = await policyLoader.forWorld('factory' as World);
      
      // Validate all sections
      expect(policy.policy_version).toBe('1.0');
      expect(policy.world).toBe('factory');
      
      // Mission Template
      expect(policy.mission_template.lives_start).toBe(3);
      expect(policy.mission_template.questions.standard).toBe(7);
      expect(policy.mission_template.questions.risk_at).toEqual([5, 10]);
      expect(policy.mission_template.questions.team_at).toEqual([9]);
      expect(policy.mission_template.challenge_fallback).toBe(true);
      
      // Compose
      expect(policy.compose.max_quests_per_loop).toBe(10);
      expect(policy.compose.modality_weights.mcq).toBe(0.6);
      
      // ZPD
      expect(policy.zpd.start).toBe('beginner');
      expect(policy.zpd.adjust_rules).toHaveLength(2);
      
      // Risk Guard
      expect(policy.risk_guard.max_attempts).toBe(2);
      expect(policy.risk_guard.cooldown_ms).toBe(30000);
      expect(policy.risk_guard.boss_challenge_ids['5']).toBe('factory_boss_q5');
      
      // Gamification
      expect(policy.gamification.base_points.standard).toBe(100);
      expect(policy.gamification.bonus_minigame.points).toBe(5000);
      expect(policy.gamification.bonus_minigame.life_cap).toBe(5);
      
      // Avatar Feedback
      expect(policy.avatar_feedback.success_style).toBe('encouraging');
      
      // Story
      expect(policy.story.briefing).toBe('Willkommen in der Fabrik!');
    });
  });
  
  describe('Edge Cases', () => {
    it('sollte mit leeren Werten umgehen', async () => {
      const yamlContent = `
policy_version: "1.0"
world: factory
story:
  briefing: ""
  debrief_success: ""
      `.trim();
      
      writeFileSync(join(testPoliciesDir, 'factory.yaml'), yamlContent);
      
      const policy = await policyLoader.forWorld('factory' as World);
      
      expect(policy.story.briefing).toBe('');
      expect(policy.story.debrief_success).toBe('');
    });
    
    it('sollte mit Sonderzeichen in Strings umgehen', async () => {
      const yamlContent = `
policy_version: "1.0"
world: factory
story:
  briefing: "Willkommen! 🎯 Let's go!"
      `.trim();
      
      writeFileSync(join(testPoliciesDir, 'factory.yaml'), yamlContent);
      
      const policy = await policyLoader.forWorld('factory' as World);
      
      expect(policy.story.briefing).toContain('🎯');
    });
    
    it('sollte mit Dezimalzahlen umgehen', async () => {
      const yamlContent = `
policy_version: "1.0"
world: factory
compose:
  modality_weights:
    mcq: 0.6
    challenge: 0.25
    reflection: 0.15
      `.trim();
      
      writeFileSync(join(testPoliciesDir, 'factory.yaml'), yamlContent);
      
      const policy = await policyLoader.forWorld('factory' as World);
      
      expect(policy.compose.modality_weights.mcq).toBe(0.6);
      expect(policy.compose.modality_weights.challenge).toBe(0.25);
    });
  });
});

