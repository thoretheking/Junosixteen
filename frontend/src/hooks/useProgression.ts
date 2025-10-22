import { useCallback } from "react";

export function useProgression() {
  const decide = useCallback(async (payload: any) => {
    const res = await fetch("http://localhost:5000/mangle/decision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("Mangle decision failed");
    const data = await res.json();
    const rows = (pred: string) => data.results?.[pred] ?? [];
    return {
      status: rows("current_status")[0]?.col1 ?? "IN_PROGRESS",
      nextIdx: Number(rows("next_question")[0]?.col1 ?? 1),
      pointsRaw: Number(rows("points_raw")[0]?.col1 ?? 0),
      pointsFinal: Number(rows("points_final")[0]?.col1 ?? 0),
    };
  }, []);
  return { decide };
} 