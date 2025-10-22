import fs from 'fs';

// TODO: statt Dummy: DB lesen (z.B. Prisma/Firebase) und in Mangle-Fakten umwandeln
export function exportNowFacts(nowIso = new Date().toISOString()) {
  const dow = new Intl.DateTimeFormat('en-GB', { weekday: 'short' }).format(new Date());
  const hhmm = new Date().toISOString().slice(11, 16);
  return [
    `now_dow("${dow}").`,
    `now_before("${hhmm}").`,
    `now_before_deadline(deadline("u1","L1","2099-12-31T23:59:59Z"), "2099-12-31T23:59:59Z").`
  ].join('\n');
}

export function factsFromJson(jsonPath: string) {
  const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const emit = (pred: string, tuple: any[]) => 
    `${pred}(${tuple.map(v => typeof v === 'string' ? JSON.stringify(v) : v).join(', ')}).`;
  const lines: string[] = [];
  
  for (const [pred, rows] of Object.entries(raw)) {
    if (pred === 'now') continue;
    (rows as any[]).forEach(r => lines.push(emit(pred, r as any[])));
  }
  
  return lines.join('\n');
} 