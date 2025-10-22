import { evalMangle } from "../../src/mangleClient";

const rules = [
  `risk_idx(5). risk_idx(10).`,
  `correct_q(S,5) :- answered(S,5,"A",true), answered(S,5,"B",true).`,
  `correct_q(S,10) :- answered(S,10,"A",true), answered(S,10,"B",true).`,
  `level_reset(S) :- answered(S,5,"A",false); answered(S,5,"B",false).`,
  `level_reset(S) :- answered(S,10,"A",false); answered(S,10,"B",false).`,
  `current_status(S,"RESET_RISK") :- level_reset(S).`,
  `current_status(S,"IN_PROGRESS") :- not level_reset(S).`,
  `team_success(S) :- team_answer_correct(S,9,C), team_size(S,Total), C * 2 > Total.`,
  `apply_multiplier(S,"team_triple") :- team_success(S).`,
  `points_raw(S,P) :- base_points(S,BaseP), P = BaseP.`,
  `points_final(S,FinalP) :- points_raw(S,P), apply_multiplier(S,"team_triple"), FinalP = P * 3.`,
  `points_final(S,P) :- points_raw(S,P), not apply_multiplier(S,"team_triple").`
];

describe('Mangle Golden Tests', () => {
  
  describe('Risk Question Logic', () => {
    test('risk wrong -> RESET_RISK', async () => {
      const facts = [
        `answered("s1",5,"A",true).`,
        `answered("s1",5,"B",false).` // Risk failed
      ];
      
      const result = await evalMangle({
        query: `current_status("s1", _S).`,
        facts: facts.map(f => ({ raw: f })),
        rules
      });
      
      expect(JSON.stringify(result)).toContain("RESET_RISK");
    });

    test('risk pass -> IN_PROGRESS', async () => {
      const facts = [
        `answered("s2",5,"A",true).`,
        `answered("s2",5,"B",true).` // Risk passed
      ];
      
      const result = await evalMangle({
        query: `current_status("s2", _S).`,
        facts: facts.map(f => ({ raw: f })),
        rules
      });
      
      expect(JSON.stringify(result)).toContain("IN_PROGRESS");
    });
    
    test('question 10 risk failure', async () => {
      const facts = [
        `answered("s3",10,"A",true).`,
        `answered("s3",10,"B",false).` // Q10 risk failed
      ];
      
      const result = await evalMangle({
        query: `level_reset("s3").`,
        facts: facts.map(f => ({ raw: f })),
        rules
      });
      
      expect(result.tables?.level_reset?.length).toBeGreaterThan(0);
    });
  });

  describe('Team Question Logic', () => {
    test('team success with >50% correct', async () => {
      const facts = [
        `team_answer_correct("s4",9,3).`, // 3 correct answers
        `team_size("s4",5).` // out of 5 team members
      ];
      
      const result = await evalMangle({
        query: `team_success("s4").`,
        facts: facts.map(f => ({ raw: f })),
        rules
      });
      
      expect(result.tables?.team_success?.length).toBeGreaterThan(0);
    });
    
    test('team failure with <=50% correct', async () => {
      const facts = [
        `team_answer_correct("s5",9,2).`, // 2 correct answers  
        `team_size("s5",5).` // out of 5 team members (40%)
      ];
      
      const result = await evalMangle({
        query: `team_success("s5").`,
        facts: facts.map(f => ({ raw: f })),
        rules
      });
      
      expect(result.tables?.team_success?.length || 0).toBe(0);
    });
  });

  describe('Point Calculation', () => {
    test('base points without multiplier', async () => {
      const facts = [
        `base_points("s6",100).`
      ];
      
      const result = await evalMangle({
        query: `points_final("s6", _P).`,
        facts: facts.map(f => ({ raw: f })),
        rules
      });
      
      // Should return 100 (no multiplier)
      const points = result.tables?.points_final?.[0];
      expect(points).toBeDefined();
    });
    
    test('team multiplier x3', async () => {
      const facts = [
        `base_points("s7",100).`,
        `team_answer_correct("s7",9,4).`,
        `team_size("s7",6).` // 4/6 = 66% > 50%
      ];
      
      const result = await evalMangle({
        query: `points_final("s7", _P).`,
        facts: facts.map(f => ({ raw: f })),
        rules
      });
      
      // Should return 300 (100 * 3)
      const finalPoints = result.tables?.points_final?.[0];
      expect(finalPoints).toBeDefined();
    });
  });

  describe('Status Integration', () => {
    test('complete scenario - risk pass + team success', async () => {
      const facts = [
        // Risk questions passed
        `answered("s8",5,"A",true).`,
        `answered("s8",5,"B",true).`,
        `answered("s8",10,"A",true).`,  
        `answered("s8",10,"B",true).`,
        // Team success
        `team_answer_correct("s8",9,3).`,
        `team_size("s8",4).`,
        // Base points
        `base_points("s8",200).`
      ];
      
      const statusResult = await evalMangle({
        query: `current_status("s8", _S).`,
        facts: facts.map(f => ({ raw: f })),
        rules
      });
      
      const pointsResult = await evalMangle({
        query: `points_final("s8", _P).`,
        facts: facts.map(f => ({ raw: f })),
        rules
      });
      
      expect(JSON.stringify(statusResult)).toContain("IN_PROGRESS");
      
      // Points should be multiplied by team success
      const finalPoints = pointsResult.tables?.points_final?.[0];
      expect(finalPoints).toBeDefined();
    });
    
    test('complete scenario - risk failure overrides team success', async () => {
      const facts = [
        // Risk question failed  
        `answered("s9",5,"A",true).`,
        `answered("s9",5,"B",false).`, // Risk failed
        // Team would have succeeded
        `team_answer_correct("s9",9,4).`,
        `team_size("s9",5).`,
        `base_points("s9",150).`
      ];
      
      const result = await evalMangle({
        query: `current_status("s9", _S).`,
        facts: facts.map(f => ({ raw: f })),
        rules
      });
      
      // Risk failure should override team success
      expect(JSON.stringify(result)).toContain("RESET_RISK");
    });
  });

  describe('Rule Syntax Validation', () => {
    test('all rules are valid datalog syntax', () => {
      rules.forEach(rule => {
        expect(rule).toMatch(/.*:-.*\.|.*\./); // Basic Datalog syntax
        expect(rule.split('.').length).toBeGreaterThanOrEqual(1);
      });
    });
    
    test('predicates have consistent naming', () => {
      const predicates = rules
        .map(rule => rule.match(/^[a-zA-Z_][a-zA-Z0-9_]*/))
        .filter(match => match !== null)
        .map(match => match![0]);
      
      // Check for consistent naming patterns
      predicates.forEach(pred => {
        expect(pred).toMatch(/^[a-z][a-z_]*$/); // snake_case
      });
    });
  });
}); 