// JunoSixteen Mangle Rules - Certificate Eligibility & Game Logic

export const rulesCertificate = [
  // Level Completion Rules
  `LevelComplete(u, m, L) :- 
    CompletedCount(u, m, L, c), 
    c = 10.`,
  
  // Risk Question Success (Questions 5 & 10)
  `RiskDouble(u, m, L) :- 
    Attempt(u, m, 5, "risk", true, _),
    Attempt(u, m, 10, "risk", true, _).`,
  
  // Team Question Success (Question 9)
  `TeamTriple(u, m, L) :- 
    TeamSuccess(m, L).`,
  
  // Point Calculation with Multipliers
  `LevelPoints(u, m, L, P) :- 
    LevelState(u, m, L, baseP), 
    RiskDouble(u, m, L), 
    P = baseP * 2.`,
    
  `LevelPoints(u, m, L, P) :- 
    LevelState(u, m, L, baseP), 
    TeamTriple(u, m, L), 
    P = baseP * 3.`,
    
  `LevelPoints(u, m, L, P) :- 
    LevelState(u, m, L, baseP), 
    not RiskDouble(u, m, L),
    not TeamTriple(u, m, L),
    P = baseP.`,
  
  // Deadline Logic
  `NotDeadlineMissed(u, m) :- 
    not DeadlineMissed(u, m).`,
    
  `DeadlineMissed(u, m) :- 
    Deadline(u, m, ts), 
    Now(nowTs), 
    nowTs > ts, 
    not LevelComplete(u, m, 10).`,
  
  // Reset Logic
  `ResetRequired(u, m) :- 
    DeadlineMissed(u, m).`,
    
  `ResetRequired(u, m) :- 
    RiskFailed(u, m).`,
    
  `RiskFailed(u, m) :- 
    Attempt(u, m, 5, "risk", false, _).`,
    
  `RiskFailed(u, m) :- 
    Attempt(u, m, 10, "risk", false, _).`,
  
  // Main Certificate Eligibility Rule
  `EligibleCertificate(u, m) :- 
    LevelComplete(u, m, 10), 
    NotDeadlineMissed(u, m),
    not ResetRequired(u, m).`
];

export const rulesRecommendation = [
  // Error Hotspot Detection
  `ErrorHotspot(u, topic) :- 
    Attempt(u, m, _, _, false, _), 
    Module(m, topic, _), 
    ErrorRate(u, m, rate),
    rate > 0.4.`,
  
  // Snack Recommendations
  `RecommendSnack(u, snack) :- 
    ErrorHotspot(u, "datenschutz"), 
    ImprintSnack(snack, "ethik/datenschutz", minutes), 
    minutes <= 2.`,
    
  `RecommendSnack(u, snack) :- 
    ErrorHotspot(u, "sicherheit"), 
    ImprintSnack(snack, "cyber/basics", minutes), 
    minutes <= 3.`,
    
  // Advanced Learning Path
  `SuggestAdvanced(u, m) :- 
    LevelComplete(u, m, 10),
    RiskDouble(u, m, 10),
    TeamTriple(u, m, 10),
    CompletionTime(u, m, time),
    time < 300.` // < 5 minutes = fast learner
];

export const rulesTeamDynamics = [
  // Team Performance Analysis
  `TeamPerformance(team, "excellent") :- 
    TeamMember(_, team),
    TeamSuccessRate(team, rate),
    rate > 0.8.`,
    
  `TeamPerformance(team, "good") :- 
    TeamMember(_, team),
    TeamSuccessRate(team, rate),
    rate > 0.6,
    rate <= 0.8.`,
    
  `TeamPerformance(team, "needs_support") :- 
    TeamMember(_, team),
    TeamSuccessRate(team, rate),
    rate <= 0.6.`,
  
  // Cross-Team Collaboration
  `SuggestCrossTeam(u1, u2) :- 
    User(u1, _, org1, team1),
    User(u2, _, org2, team2),
    team1 != team2,
    ComplementarySkills(u1, u2).`
]; 