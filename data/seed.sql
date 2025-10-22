-- JunoSixteen Mangle Integration Test Data

-- Users
INSERT INTO "User"(id, email, xp) VALUES 
  ('u1', 'u1@example.com', 120),
  ('u2', 'u2@example.com', 50),
  ('u3', 'admin@example.com', 300);

-- Modules  
INSERT INTO "Module"(id, topic, "levelReqXP", "maxLevel", "moduleType") VALUES
  ('m-cleanroom-01', 'Clean Room', 100, 10, 'weekly'),
  ('m-datenschutz-01', 'Datenschutz', 150, 10, 'standard'),
  ('m-sicherheit-01', 'IT-Sicherheit', 200, 8, 'advanced');

-- Progress Records
INSERT INTO "Progress"(id, "userId", "moduleId", level, finished, "deadlineIso") VALUES
  ('p1', 'u1', 'm-cleanroom-01', 3, false, '2025-08-29T21:59:00Z'),
  ('p2', 'u2', 'm-cleanroom-01', 1, false, '2025-08-29T21:59:00Z'),
  ('p3', 'u3', 'm-datenschutz-01', 10, true, NULL);

-- Attempts (User u1 - has some penalties)
INSERT INTO "Attempt"(id, "userId", "moduleId", "questionId", "questionType", "isCorrect", duration) VALUES
  ('a1', 'u1', 'm-cleanroom-01', 1, 'default', true, 15),
  ('a2', 'u1', 'm-cleanroom-01', 2, 'default', true, 12),
  ('a3', 'u1', 'm-cleanroom-01', 3, 'default', false, 45), -- wrong answer
  ('a4', 'u1', 'm-cleanroom-01', 5, 'risk', false, 30),    -- risk failed
  ('a5', 'u1', 'm-cleanroom-01', 9, 'team', true, 25);     -- team success

-- Attempts (User u2 - clean record)
INSERT INTO "Attempt"(id, "userId", "moduleId", "questionId", "questionType", "isCorrect", duration) VALUES
  ('a6', 'u2', 'm-cleanroom-01', 1, 'default', true, 18),
  ('a7', 'u2', 'm-cleanroom-01', 2, 'default', true, 20);

-- Teams
INSERT INTO "Team"(id, name, "successRate") VALUES
  ('t1', 'CleanRoom-Alpha', 0.85),
  ('t2', 'Security-Beta', 0.72);

-- Team Members
INSERT INTO "TeamMember"(id, "userId", "teamId", role) VALUES
  ('tm1', 'u1', 't1', 'member'),
  ('tm2', 'u2', 't1', 'member'),
  ('tm3', 'u3', 't2', 'leader');

-- Certificates
INSERT INTO "Certificate"(id, "userId", topic, tier, hash) VALUES
  ('c1', 'u3', 'Datenschutz', 'gold', 'abc123def456');

-- Audit Logs
INSERT INTO "AuditLog"(id, "userId", action, resource, details) VALUES
  ('l1', 'u1', 'level_attempt', 'm-cleanroom-01', '{"level": 3, "result": "penalty"}'),
  ('l2', 'u3', 'certificate_issued', 'Datenschutz', '{"tier": "gold"}');

-- Sessions
INSERT INTO "Session"(id, "userId", "sessionId", "isActive", "expiresAt") VALUES
  ('s1', 'u1', 'sess_u1_active', true, '2025-08-26T12:00:00Z'),
  ('s2', 'u2', 'sess_u2_active', true, '2025-08-26T12:00:00Z');

-- Expected Test Results:
-- u1 + m-cleanroom-01: allowed = false (XP=120 >= req=100, BUT risk penalty active)
-- u2 + m-cleanroom-01: allowed = true (XP=50 < req=100, should be false in normal logic)
-- u3 + m-datenschutz-01: allowed = true (XP=300 >= req=150, clean record) 