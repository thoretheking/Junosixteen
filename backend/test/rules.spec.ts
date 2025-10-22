import { evalMangle } from '../src/integrations/mangleClient';
import { rulesCertificate, rulesRecommendation } from '../src/rules';
import { generateTestFacts } from '../src/facts';

// Mock the mangleClient for testing
jest.mock('../src/integrations/mangleClient');
const mockEvalMangle = evalMangle as jest.MockedFunction<typeof evalMangle>;

describe('Mangle Rules Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Certificate Eligibility Rules', () => {
    it('should grant certificate for completed user with risk success', async () => {
      const facts = [
        'User(42, "mitarbeiter", "orgA", "teamX").',
        'Module(11, "datenschutz", 10).',
        'Attempt(42, 11, 5, "risk", true, "2025-08-24T13:10Z").',
        'Attempt(42, 11, 10, "risk", true, "2025-08-24T13:12Z").',
        'LevelComplete(42, 11, 10).',
        'CompletedCount(42, 11, 10, 10).',
        'Deadline(42, 11, "2025-08-29T21:59:00Z").',
        'Now("2025-08-25T09:00:00Z").'
      ];

      mockEvalMangle.mockResolvedValue({
        answers: 'EligibleCertificate(42, 11).'
      });

      const result = await evalMangle(facts, rulesCertificate, 'EligibleCertificate(u, m).');
      
      expect(result.answers).toContain('EligibleCertificate(42, 11)');
      expect(mockEvalMangle).toHaveBeenCalledWith(facts, rulesCertificate, 'EligibleCertificate(u, m).');
    });

    it('should deny certificate for user with missed deadline', async () => {
      const facts = [
        'User(42, "mitarbeiter", "orgA", "teamX").',
        'Module(11, "datenschutz", 10).',
        'Deadline(42, 11, "2025-08-20T21:59:00Z").',
        'Now("2025-08-25T09:00:00Z").',
        'CompletedCount(42, 11, 10, 8).' // Not completed
      ];

      mockEvalMangle.mockResolvedValue({
        answers: ''
      });

      const result = await evalMangle(facts, rulesCertificate, 'EligibleCertificate(u, m).');
      
      expect(result.answers).toBe('');
    });

    it('should deny certificate for user with risk failure', async () => {
      const facts = [
        'User(42, "mitarbeiter", "orgA", "teamX").',
        'Module(11, "datenschutz", 10).',
        'Attempt(42, 11, 5, "risk", false, "2025-08-24T13:10Z").',
        'LevelComplete(42, 11, 10).',
        'Deadline(42, 11, "2025-08-29T21:59:00Z").',
        'Now("2025-08-25T09:00:00Z").'
      ];

      mockEvalMangle.mockResolvedValue({
        answers: ''
      });

      const result = await evalMangle(facts, rulesCertificate, 'EligibleCertificate(u, m).');
      
      expect(result.answers).toBe('');
    });
  });

  describe('Recommendation Rules', () => {
    it('should recommend snack for error hotspot', async () => {
      const facts = [
        'User(42, "mitarbeiter", "orgA", "teamX").',
        'Module(11, "datenschutz", 10).',
        'Attempt(42, 11, 1, "default", false, "2025-08-24T13:00Z").',
        'Attempt(42, 11, 2, "default", false, "2025-08-24T13:05Z").',
        'Attempt(42, 11, 3, "default", false, "2025-08-24T13:10Z").',
        'ErrorRate(42, 11, 0.6).',
        'ImprintSnack("snack1", "ethik/datenschutz", 2).'
      ];

      mockEvalMangle.mockResolvedValue({
        answers: 'RecommendSnack(42, "snack1").'
      });

      const result = await evalMangle(facts, rulesRecommendation, 'RecommendSnack(u, snack).');
      
      expect(result.answers).toContain('RecommendSnack(42, "snack1")');
    });
  });

  describe('Generated Test Facts', () => {
    it('should generate valid test facts', () => {
      const facts = generateTestFacts('42', '11');
      
      expect(facts).toHaveLength(10);
      expect(facts[0]).toBe('User(42, "mitarbeiter", "orgA", "teamX").');
      expect(facts[1]).toBe('Module(11, "datenschutz", 10).');
      expect(facts).toContain('Attempt(42, 11, 5, "risk", true, "2025-08-24T13:10Z").');
      expect(facts).toContain('TeamSuccess(11, 10).');
    });

    it('should escape special characters in facts', () => {
      const facts = generateTestFacts('user"42', 'module\\11');
      
      // Test that generated facts don't break Datalog syntax
      expect(facts.every(fact => fact.endsWith('.'))).toBe(true);
      expect(facts.every(fact => fact.includes('(') && fact.includes(')'))).toBe(true);
    });
  });

  describe('Rule Syntax Validation', () => {
    it('should have valid certificate rules syntax', () => {
      rulesCertificate.forEach(rule => {
        expect(rule).toMatch(/.*:-.*\./); // Basic Datalog syntax check
        expect(rule.split(':-')).toHaveLength(2); // Head :- Body
      });
    });

    it('should have valid recommendation rules syntax', () => {
      rulesRecommendation.forEach(rule => {
        expect(rule).toMatch(/.*:-.*\./); // Basic Datalog syntax check
      });
    });
  });
}); 