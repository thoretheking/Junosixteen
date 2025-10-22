import { Router } from "express";
import { evalMangle } from "../integrations/mangleClient";
import dayjs from "dayjs";

export const progression = Router();

// Hilfsmapper: App-Events -> Mangle-Facts
function toFacts(payload: any) {
  const {
    userId, team, sessionId, level, answers, watched, deadlineISO, basePoints
  } = payload;

  const facts: any[] = [];
  facts.push({ pred: "user", args: [userId] });
  facts.push({ pred: "session", args: [userId, sessionId] });
  facts.push({ pred: "level", args: [sessionId, level] });
  facts.push({ pred: "deadline", args: [sessionId, deadlineISO] });
  facts.push({ pred: "now", args: [dayjs().toISOString()] });

  // Fragen-Index 1..10
  for (let i = 1; i <= 10; i++) facts.push({ pred: "q", args: [i] });

  // Team
  if (team) facts.push({ pred: "team_member", args: [userId, team] });

  // Gesehene Videos
  (watched ?? []).forEach((idx: number) => facts.push({ pred: "watched", args: [sessionId, idx] }));

  // Antworten: Standard ("-"), Risk ("A"|"B")
  (answers ?? []).forEach((a: any) => {
    facts.push({ pred: "answered", args: [sessionId, a.idx, a.part ?? "-", !!a.correct] })
  });

  // Teamfrage 9 – Antworten aller Mitglieder optional übergeben
  (payload.teamAnswers ?? []).forEach((t: any) => {
    facts.push({ pred: "team_answer", args: [team, 9, t.memberId, !!t.correct] })
  });

  // Basispunkte
  const bp = basePoints ?? { 1: 1, 2: 1, 3: 2, 4: 2, 5: 3, 6: 3, 7: 4, 8: 4, 9: 5, 10: 6 };
  Object.entries(bp).forEach(([idx, p]: any) => {
    facts.push({ pred: "base_points", args: [Number(idx), Number(p)] })
  });
  return facts;
}

progression.post("/decision", async (req, res) => {
  try {
    const facts = toFacts(req.body);
    const q = [
      { pred: "current_status", args: [req.body.sessionId, "_S"] },
      { pred: "next_question", args: [req.body.sessionId, "_N"] },
      { pred: "points_raw", args: [req.body.sessionId, "_PR"] },
      { pred: "points_final", args: [req.body.sessionId, "_PF"] },
    ];
    const results = await evalMangle(facts, q);
    res.json({ results });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}); 