const BASE = "http://10.0.2.2:5000"; // Android-Emu; iOS ggf. http://localhost:5000

export async function canEnter(userId: string, moduleId: string) {
  const r = await fetch(`${BASE}/api/policy/gate/${userId}/${moduleId}`);
  return (await r.json()) as { ok: boolean; allowed: boolean };
}

export async function recommend(userId: string) {
  const r = await fetch(`${BASE}/api/modules/recommend/${userId}`);
  return (await r.json()) as { ok: boolean; recommended: any[] };
}

export async function checkTimelock(userId: string, moduleId: string, questionId: number, answerTimestamp: string) {
  const r = await fetch(`${BASE}/api/policy/time-lock-check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, moduleId, questionId, answerTimestamp })
  });
  return (await r.json()) as { ok: boolean; violated: boolean; userId: string; questionId: number };
}

export async function checkPenalties(userId: string, moduleId: string) {
  const r = await fetch(`${BASE}/api/policy/penalty/${userId}/${moduleId}`);
  return (await r.json()) as { ok: boolean; penalties: any[]; userId: string; moduleId: string };
}

export async function healthCheck() {
  const r = await fetch(`${BASE}/health`);
  return (await r.json()) as { status: string; timestamp: string; service: string };
} 