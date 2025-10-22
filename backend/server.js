import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true
}));

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('combined'));

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "junosixteen-backend",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    features: {
      hrm_trm: true,
      mangle: true,
      gamification: true,
      telemetry: true
    }
  });
});

// ============================================
// HRM/TRM System Integration
// ============================================

// Initialize HRM/TRM System
import { initializeHRMTRM } from "./src/hrm-trm/index.js";
const hrmTrm = initializeHRMTRM();

console.log("✅ HRM/TRM System initialized");

// HRM Endpoints (Orchestrator)
app.post("/hrm/plan", (req, res) => hrmTrm.hrmController.plan(req, res));
app.post("/hrm/update", (req, res) => hrmTrm.hrmController.update(req, res));
app.get("/hrm/explain/:userId/:world", (req, res) => hrmTrm.hrmController.explain(req, res)); // Mangle explainability

// TRM Endpoints (Executor/Evaluator)
app.post("/trm/eval", (req, res) => hrmTrm.trmController.eval(req, res));
app.get("/trm/stats/:userId/:missionId", (req, res) => hrmTrm.trmController.getStats(req, res));

// Profile Endpoints
app.get("/profile/:userId", (req, res) => hrmTrm.profileController.getProfile(req, res));
app.put("/profile/:userId", (req, res) => hrmTrm.profileController.updateProfile(req, res));
app.get("/profile/:userId/history", (req, res) => hrmTrm.profileController.getHistory(req, res));
app.get("/profile/:userId/badges", (req, res) => hrmTrm.profileController.getBadges(req, res));

// Telemetry Endpoints
app.post("/telemetry/event", (req, res) => hrmTrm.eventsController.logEvent(req, res));
app.post("/telemetry/batch", (req, res) => hrmTrm.eventsController.logBatch(req, res));
app.get("/telemetry/events/:userId", (req, res) => hrmTrm.eventsController.getUserEvents(req, res));
app.get("/telemetry/analytics/:userId", (req, res) => hrmTrm.eventsController.getAnalytics(req, res));

// Adventure Endpoints (Challenges, Quests, Drops)
app.get("/adventure/challenges", (req, res) => hrmTrm.adventureController.getChallenges(req, res));
app.get("/adventure/challenges/:id", (req, res) => hrmTrm.adventureController.getChallengeById(req, res));
app.post("/adventure/challenges/validate", (req, res) => hrmTrm.adventureController.validateChallenge(req, res));
app.get("/adventure/random-challenge/:world", (req, res) => hrmTrm.adventureController.getRandomChallenge(req, res));

app.get("/adventure/quests/daily", (req, res) => hrmTrm.adventureController.getDailyQuests(req, res));
app.get("/adventure/quests/weekly", (req, res) => hrmTrm.adventureController.getWeeklyQuest(req, res));
app.post("/adventure/quests/progress", (req, res) => hrmTrm.adventureController.updateQuestProgress(req, res));

app.post("/adventure/drops/roll", (req, res) => hrmTrm.adventureController.rollDrop(req, res));
app.get("/adventure/drops/easter-eggs/:world", (req, res) => hrmTrm.adventureController.getEasterEggs(req, res));

app.get("/adventure/stats", (req, res) => hrmTrm.adventureController.getStats(req, res));

// Analytics Endpoints (Insights & Predictions)
app.get("/analytics/insights/:userId", (req, res) => hrmTrm.analyticsController.getUserInsights(req, res));
app.get("/analytics/summary/:userId", (req, res) => hrmTrm.analyticsController.getInsightsSummary(req, res));
app.get("/analytics/recommendations/:userId", (req, res) => hrmTrm.analyticsController.getRecommendations(req, res));
app.get("/analytics/predictions/:userId", (req, res) => hrmTrm.analyticsController.getPredictions(req, res));

// ============================================
// End HRM/TRM Integration
// ============================================

// Policy-Adapter: ruft Mangle-Sidecar auf
import { 
  decideProgress, 
  explainDecision,
  evaluateGameMechanics,
  getRecommendations,
  checkCertificateEligibility,
  checkTimeoutOrDeadline,
  decideRisk,
  decideTeam,
  decideCertificate,
  explainWhy,
  getLeaderboard,
  getUserStats,
  getTeamStats,
  getUserBadges
} from "./policy.js";

import { addAnswer, setDeadline, setTimeLimit, startQuestion, finishQuestion, getFacts, setTeam } from "./events.js";
import { generateCertificatePDF, makeCertId } from "./certificates.js";
import pkg from 'pg';
const { Pool } = pkg;

// Mangle Engine Integration
import { getMangleEngine } from "./mangle-engine.js";

// Database connection pool
const pool = new Pool(); // nutzt .env

// Progress API
app.post("/api/progress/decide", async (req, res) => {
  try {
    const { userId, level } = req.body;
    
    if (!userId || typeof level !== 'number') {
      return res.status(400).json({ 
        error: "Missing or invalid parameters: userId (string) and level (number) required" 
      });
    }

    const canStartNext = await decideProgress(userId, level);
    
    res.json({ 
      canStartNext,
      userId,
      level,
      nextLevel: level + 1,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.error("Error in progress/decide:", e);
    res.status(500).json({ 
      error: e.message,
      code: "PROGRESS_DECISION_ERROR"
    });
  }
});

app.post("/api/progress/explain", async (req, res) => {
  try {
    const { userId, level } = req.body;
    
    if (!userId || typeof level !== 'number') {
      return res.status(400).json({ 
        error: "Missing or invalid parameters: userId (string) and level (number) required" 
      });
    }

    const explanation = await explainDecision(userId, level);
    
    res.json({ 
      explanation,
      userId,
      level,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.error("Error in progress/explain:", e);
    res.status(500).json({ 
      error: e.message,
      code: "PROGRESS_EXPLANATION_ERROR"
    });
  }
});

// Explainability: Warum wurde eine Entscheidung getroffen?
app.post("/api/policy/why", async (req, res) => {
  try {
    const { userId, level, sessionId } = req.body;
    const trace = await explainWhy({ userId, level, sessionId });
    res.json(trace);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Leaderboard APIs
app.get("/api/leaderboard/individual/:period", async (req, res) => {
  try {
    const { period } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    
    if (!['alltime', 'weekly', 'monthly'].includes(period)) {
      return res.status(400).json({ 
        error: "Invalid period. Use: alltime, weekly, monthly" 
      });
    }

    const leaderboard = await getLeaderboard('individual', period, limit);
    res.json(leaderboard);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/leaderboard/team/:period", async (req, res) => {
  try {
    const { period } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    
    if (!['alltime', 'weekly', 'monthly'].includes(period)) {
      return res.status(400).json({ 
        error: "Invalid period. Use: alltime, weekly, monthly" 
      });
    }

    const leaderboard = await getLeaderboard('team', period, limit);
    res.json(leaderboard);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/leaderboard/user/:userId/stats", async (req, res) => {
  try {
    const { userId } = req.params;
    const stats = await getUserStats(userId);
    res.json(stats);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/leaderboard/team/:teamId/stats", async (req, res) => {
  try {
    const { teamId } = req.params;
    const stats = await getTeamStats(teamId);
    res.json(stats);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/leaderboard/badges/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const badges = await getUserBadges(userId);
    res.json(badges);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Game Mechanics API
app.post("/api/game/evaluate", async (req, res) => {
  try {
    const { userId, level, action, context } = req.body;
    
    const result = await evaluateGameMechanics(userId, level, action, context);
    
    res.json({
      result,
      userId,
      level,
      action,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.error("Error in game/evaluate:", e);
    res.status(500).json({ 
      error: e.message,
      code: "GAME_EVALUATION_ERROR"
    });
  }
});

// Recommendations API
app.post("/api/recommendations/get", async (req, res) => {
  try {
    const { userId, context } = req.body;
    
    const recommendations = await getRecommendations(userId, context);
    
    res.json({
      recommendations,
      userId,
      context,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.error("Error in recommendations/get:", e);
    res.status(500).json({ 
      error: e.message,
      code: "RECOMMENDATIONS_ERROR"
    });
  }
});

// Certificates API
app.post("/api/certificates/check", async (req, res) => {
  try {
    const { userId, course } = req.body;
    
    const eligibility = await checkCertificateEligibility(userId, course);
    
    res.json({
      eligible: eligibility.eligible,
      requirements: eligibility.requirements,
      userId,
      course,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.error("Error in certificates/check:", e);
    res.status(500).json({ 
      error: e.message,
      code: "CERTIFICATE_CHECK_ERROR"
    });
  }
});

// Event-Ingestion -> Facts Cache
app.post("/api/events/answer", (req, res) => {
  const { userId, level, q, correct } = req.body;
  const snapshot = addAnswer(userId, level, q, !!correct);
  res.json({ ok: true, snapshot });
});

app.post("/api/events/deadline", (req, res) => {
  const { level, isoTs } = req.body;
  setDeadline(level, isoTs);
  res.json({ ok: true });
});

app.get("/api/facts", (req, res) => {
  const { userId, level } = req.query;
  res.json(getFacts(String(userId), Number(level)));
});

// Time-Lock API
app.post("/api/time/check", async (req, res) => {
  const { userId, level } = req.body;
  const shouldReset = await checkTimeoutOrDeadline(userId, level);
  res.json({ shouldReset });
});

app.post("/api/time/limit", (req, res) => {
  const { level, q, sec } = req.body; 
  setTimeLimit(level, q, sec); 
  res.json({ ok:true });
});

app.post("/api/time/start", (req, res) => {
  const { userId, level, q, startedAt } = req.body; 
  startQuestion(userId, level, q, startedAt); 
  res.json({ ok:true });
});

app.post("/api/time/finish", (req, res) => {
  const { userId, level, q, finishedAt } = req.body; 
  finishQuestion(userId, level, q, finishedAt); 
  res.json({ ok:true });
});

// Risk & Team API
app.post("/api/game/risk", async (req, res) => {
  const { userId, level } = req.body;
  res.json(await decideRisk(userId, level));
});

app.post("/api/game/team", async (req, res) => {
  const { userId, level } = req.body;
  res.json(await decideTeam(userId, level));
});

// Teams setzen (einfacher Helper)
app.post("/api/team/set", (req, res) => {
  const { team, members } = req.body; // [{userId, level}]
  setTeam(team, members || []);
  res.json({ ok:true });
});

// Certificate API
app.post("/api/cert/check", async (req, res) => {
  const { userId, courseId } = req.body;
  const { ok, tier } = await decideCertificate(userId, courseId);
  res.json({ eligible: ok, tier });
});

app.post("/api/cert/issue", async (req, res) => {
  const { userId, fullName, courseId = "onboarding" } = req.body;
  const { ok, tier } = await decideCertificate(userId, courseId);
  if (!ok) return res.status(400).json({ error: "Not eligible" });

  const certId = makeCertId({ userId, courseId, tier });
  const verifyUrl = `${process.env.PUBLIC_BASEURL || "https://example.com"}/verify/${certId}`;
  const pdfBytes = await generateCertificatePDF({ userId, fullName, courseId, tier, verifyUrl });

  // Hash speichern
  const hash = require("crypto").createHash("sha256").update(pdfBytes).digest("hex");
  await pool.query(
    `INSERT INTO certificates (cert_id, user_id, course_id, tier, hash, issued_at)
     VALUES ($1,$2,$3,$4,$5, NOW())`,
    [certId, userId, courseId, tier, hash]
  );

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${courseId}-${tier}-${certId}.pdf"`);
  res.send(Buffer.from(pdfBytes));
});

app.get("/api/cert/verify/:certId", async (req, res) => {
  const certId = req.params.certId;
  const r = await pool.query("SELECT cert_id, user_id, course_id, tier, issued_at FROM certificates WHERE cert_id=$1", [certId]);
  if (!r.rows.length) return res.status(404).json({ valid:false });
  res.json({ valid:true, ...r.rows[0] });
});

// Mangle Engine Direct API
app.post("/api/mangle/query", async (req, res) => {
  try {
    const { query, facts } = req.body;
    
    if (!query) {
      return res.status(400).json({ 
        error: "Missing query parameter" 
      });
    }

    const engine = getMangleEngine();
    
    // Lade Facts wenn bereitgestellt
    if (facts) {
      engine.reset(); // Reset für frische Query
      engine.convertJSONFactsToProlog(facts);
    }

    // Führe Query aus
    const result = await engine.query(query);
    
    res.json({
      ...result,
      query,
      engine_stats: engine.getStats(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error in mangle/query:", error);
    res.status(500).json({ 
      error: error.message,
      code: "MANGLE_QUERY_ERROR"
    });
  }
});

app.post("/api/mangle/add-rule", async (req, res) => {
  try {
    const { ruleId, rule } = req.body;
    
    if (!ruleId || !rule) {
      return res.status(400).json({ 
        error: "Missing ruleId or rule parameter" 
      });
    }

    const engine = getMangleEngine();
    engine.addRule(ruleId, rule);
    
    res.json({
      success: true,
      ruleId,
      rule,
      stats: engine.getStats(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error in mangle/add-rule:", error);
    res.status(500).json({ 
      error: error.message,
      code: "MANGLE_RULE_ERROR"
    });
  }
});

app.post("/api/mangle/add-fact", async (req, res) => {
  try {
    const { factId, fact } = req.body;
    
    if (!factId || !fact) {
      return res.status(400).json({ 
        error: "Missing factId or fact parameter" 
      });
    }

    const engine = getMangleEngine();
    engine.addFact(factId, fact);
    
    res.json({
      success: true,
      factId,
      fact,
      stats: engine.getStats(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error in mangle/add-fact:", error);
    res.status(500).json({ 
      error: error.message,
      code: "MANGLE_FACT_ERROR"
    });
  }
});

app.get("/api/mangle/stats", (req, res) => {
  try {
    const engine = getMangleEngine();
    const stats = engine.getStats();
    
    res.json({
      ...stats,
      engine_status: "active",
      version: "1.0.0-nodejs",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error in mangle/stats:", error);
    res.status(500).json({ 
      error: error.message,
      code: "MANGLE_STATS_ERROR"
    });
  }
});

app.post("/api/mangle/reset", (req, res) => {
  try {
    const engine = getMangleEngine();
    engine.reset();
    
    res.json({
      success: true,
      message: "Engine reset successfully",
      stats: engine.getStats(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error in mangle/reset:", error);
    res.status(500).json({ 
      error: error.message,
      code: "MANGLE_RESET_ERROR"
    });
  }
});

// JunoSixteen Demo API mit Mangle Integration
app.post("/api/junosixteen/can-start-level", async (req, res) => {
  try {
    const { userId, currentLevel } = req.body;
    
    if (!userId || typeof currentLevel !== 'number') {
      return res.status(400).json({ 
        error: "Missing userId or currentLevel" 
      });
    }

    const engine = getMangleEngine();
    
    // Lade aktuelle Facts für User
    const facts = getFacts(userId, currentLevel);
    engine.reset();
    engine.convertJSONFactsToProlog(facts);
    
    // Beispiel-Regeln hinzufügen
    engine.addRule("progress_rule", `can_start(U, Next) :- completed_level(U, L), Next = L + 1.`);
    
    // Query ausführen
    const result = await engine.query(`can_start("${userId}", L).`);
    
    res.json({
      userId,
      currentLevel,
      canStartNext: result.results.length > 0,
      nextLevel: result.results.length > 0 ? result.results[0].L : null,
      explanation: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error in junosixteen/can-start-level:", error);
    res.status(500).json({ 
      error: error.message,
      code: "JUNOSIXTEEN_LEVEL_ERROR"
    });
  }
});

// Rule Management API (Admin)
const RULE_VERSIONS = [
  { name: "v1.0", date: "2025-08-25", description: "Initial rule set" },
  { name: "v1.1", date: "2025-08-26", description: "Enhanced game mechanics" },
  { name: "v2.0", date: "2025-08-25", description: "Mangle Engine Integration" }
];

app.get("/api/rules/versions", (req, res) => {
  res.json({
    versions: RULE_VERSIONS,
    current: "v2.0",
    engine: "mangle-nodejs",
    timestamp: new Date().toISOString()
  });
});

// Admin: Regeln neu laden (Sidecar)
app.post("/api/rules/reload", async (_req, res) => {
  const axios = (await import("axios")).default;
  const { data } = await axios.get(`${process.env.POLICY_BASEURL || "http://localhost:8088"}/reload`);
  res.json({ ok: true, data });
});

app.post("/api/rules/dry-run", async (req, res) => {
  try {
    const { ruleset, facts, query } = req.body;
    
    if (!ruleset || !facts || !query) {
      return res.status(400).json({ 
        error: "Missing parameters: ruleset, facts, and query are required" 
      });
    }

    const axios = (await import("axios")).default;
    const baseUrl = process.env.POLICY_BASEURL || "http://localhost:8088";
    
    const { data } = await axios.post(`${baseUrl}/eval`, { 
      ruleset, 
      facts, 
      query 
    });
    
    res.json({ 
      result: data,
      dryRun: true,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.error("Error in rules/dry-run:", e);
    res.status(500).json({ 
      error: e.message,
      code: "DRY_RUN_ERROR"
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    code: "INTERNAL_ERROR",
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    code: "NOT_FOUND",
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Start server
const PORT = process.env.NODE_PORT || 5000;
const HOST = process.env.NODE_HOST || "localhost";

app.listen(PORT, HOST, () => {
  console.log("🚀 JunoSixteen Backend starting...");
  console.log(`📡 Server running on http://${HOST}:${PORT}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🎯 Mangle URL: ${process.env.POLICY_BASEURL || "http://localhost:8088"}`);
  console.log("⚡ Ready to serve requests!");
}); 