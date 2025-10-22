import { Router } from "express";
import { evalMangle } from "../integrations/mangleClient";
import { getFactsForUserModule, rulesCertificate } from "../rules";

const r = Router();

r.get("/eligible/:userId/:moduleId", async (req, res) => {
  try {
    const { userId, moduleId } = req.params;
    
    // Facts aus DB laden
    const facts = await getFactsForUserModule(userId, moduleId);
    
    // Mangle Query
    const query = "EligibleCertificate(u, m).";
    const result = await evalMangle(facts, rulesCertificate, query);
    
    // Response formatieren
    const eligible = result.answers && result.answers.length > 0;
    
    res.json({
      eligible,
      userId,
      moduleId,
      details: result.answers || [],
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    res.status(500).json({
      error: error.message,
      eligible: false
    });
  }
});

r.get("/status/:userId/:moduleId", async (req, res) => {
  try {
    const { userId, moduleId } = req.params;
    const facts = await getFactsForUserModule(userId, moduleId);
    
    // Mehrere Queries parallel
    const queries = [
      { name: "eligible", query: "EligibleCertificate(u, m)." },
      { name: "deadlineMissed", query: "DeadlineMissed(u, m)." },
      { name: "levelComplete", query: "LevelComplete(u, m, 10)." },
      { name: "riskSuccess", query: "RiskDouble(u, m, 10)." }
    ];
    
    const results: any = {};
    for (const q of queries) {
      const result = await evalMangle(facts, rulesCertificate, q.query);
      results[q.name] = result.answers && result.answers.length > 0;
    }
    
    res.json({
      userId,
      moduleId,
      status: results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default r; 