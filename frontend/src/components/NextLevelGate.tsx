import React, { useState } from "react";
import { canStartNext } from "../api/policy";

export default function NextLevelGate({ userId, level }:{ userId:string; level:number }) {
  const [status, setStatus] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  const check = async () => {
    setBusy(true);
    try {
      const res = await canStartNext(userId, level);
      setStatus(res);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ padding: 16, borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
      <button onClick={check} disabled={busy}>
        {busy ? "Prüfe..." : `Darf ${userId} Level ${level+1} starten?`}
      </button>
      {status && (
        <div style={{ marginTop: 12 }}>
          {status.canStartNext
            ? <span>✅ Freigegeben: Level {status.next} kann gestartet werden.</span>
            : <span>⏳ Noch gesperrt – Abschnitt wiederholt sich oder Frist offen.</span>}
        </div>
      )}
    </div>
  );
} 