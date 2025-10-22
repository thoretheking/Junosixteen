import React, { useState } from "react";
import { whyPolicy } from "../api/policy";

export default function PolicyWhyPanel({ userId, level, sessionId }:{
  userId:string; level:number; sessionId?:string;
}) {
  const [data, setData] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setBusy(true);
    try { 
      setData(await whyPolicy(userId, level, sessionId)); 
    } catch (error) {
      console.error('PolicyWhyPanel error:', error);
      setData({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally { 
      setBusy(false); 
    }
  };

  return (
    <div className="p-4 rounded-xl shadow space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Warum diese Entscheidung?</h3>
        <button 
          onClick={load} 
          disabled={busy}
          className={`px-4 py-2 rounded ${busy 
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
            : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {busy ? "Lade..." : "Neu laden"}
        </button>
      </div>

      {data && !data.error && (
        <div className="grid md:grid-cols-2 gap-3 text-sm">
          <div className="p-3 rounded-lg border">
            <div className="font-medium mb-1">Zusammenfassung</div>
            <div>Status: <code className="bg-gray-100 px-1 rounded">{data.summary?.status}</code></div>
            <div>CanStartNext: <code className="bg-gray-100 px-1 rounded">{data.summary?.canStartNext}</code></div>
          </div>

          <div className="p-3 rounded-lg border">
            <div className="font-medium mb-1">Ursachen</div>
            <ul className="list-disc ml-4 space-y-1">
              <li>completed_level: <code className="bg-gray-100 px-1 rounded text-xs">{data.causes?.completed_level}</code></li>
              <li>correct_count: <code className="bg-gray-100 px-1 rounded text-xs">{data.causes?.correct_count}</code></li>
              <li>deadline_missed: <code className="bg-gray-100 px-1 rounded text-xs">{data.causes?.deadline_missed}</code></li>
              <li>timeout: <code className="bg-gray-100 px-1 rounded text-xs">{data.causes?.timeout}</code></li>
              <li>risk_success: <code className="bg-gray-100 px-1 rounded text-xs">{data.causes?.risk_success}</code></li>
              <li>risk_fail: <code className="bg-gray-100 px-1 rounded text-xs">{data.causes?.risk_fail}</code></li>
              <li>team_success: <code className="bg-gray-100 px-1 rounded text-xs">{data.causes?.team_success}</code></li>
              <li>mult: <code className="bg-gray-100 px-1 rounded text-xs">{data.causes?.mult}</code></li>
              <li>team_mult: <code className="bg-gray-100 px-1 rounded text-xs">{data.causes?.team_mult}</code></li>
            </ul>
          </div>

          {data.ui?.length > 0 && (
            <div className="p-2 bg-gray-50 rounded md:col-span-2">
              <div className="font-medium mb-1">Kurzbegründungen</div>
              <ul className="list-disc ml-4 text-sm space-y-1">
                {data.ui.map((t:string, index: number) => <li key={index}>{t}</li>)}
              </ul>
            </div>
          )}

          <div className="p-3 rounded-lg border md:col-span-2">
            <div className="font-medium mb-1">Raw (Debug)</div>
            <pre className="text-xs whitespace-pre-wrap bg-gray-50 p-2 rounded overflow-auto max-h-40">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {data && data.error && (
        <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded">
          <div className="font-medium">Error:</div>
          <div className="text-sm">{data.error}</div>
        </div>
      )}

      {!data && (
        <div className="text-sm text-gray-500">
          Noch keine Daten – klicke „Neu laden".
        </div>
      )}
    </div>
  );
} 