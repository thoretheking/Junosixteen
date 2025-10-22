import axios from "axios";

const MANGLE_URL = process.env.MANGLE_URL || "http://localhost:7070";

export type MangleFact = Record<string, any>;

export async function evalMangle(opts: {
  program?: string;
  query: string;
  facts: MangleFact[];
  params?: Record<string, any>;
}) {
  const { data } = await axios.post(`${MANGLE_URL}/eval`, {
    program: opts.program || "",
    query: opts.query,
    facts: opts.facts,
    params: opts.params || {},
  });
  return data as { ok: boolean; tables: Record<string, any[]>; error?: string };
} 