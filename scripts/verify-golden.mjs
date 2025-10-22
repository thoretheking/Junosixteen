import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const sidecarBase = process.env.POLICY_BASEURL || "http://localhost:8088";

function asStringContainsNeedle(hay, needle) {
  if (typeof needle === "string") {
    return hay.includes(needle);
  }
  try {
    return hay.includes(JSON.stringify(needle));
  } catch {
    return false;
  }
}

async function runOne(goldenPath) {
  const spec = JSON.parse(fs.readFileSync(goldenPath, "utf8"));
  const factsPath = path.isAbsolute(spec.facts)
    ? spec.facts
    : path.join(root, "rules", spec.facts);
  const facts = JSON.parse(fs.readFileSync(factsPath, "utf8"));

  const res = await fetch(`${sidecarBase}/eval`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ ruleset: "progress", facts, query: spec.query })
  });
  const data = await res.json();
  const raw = data.raw || JSON.stringify(data.results || "");

  const expect = spec.expectContains || [];
  const failures = expect.filter(needle =>
    typeof needle === "string"
      ? !raw.includes(needle)
      : !raw.includes(JSON.stringify(needle))
  );

  return { ok: failures.length === 0, failures, raw };
}

async function checkServiceHealth() {
  try {
    console.log(`🏥 Checking service health at ${backendBase}/health`);
    const res = await fetch(`${backendBase}/health`);
    if (res.ok) {
      console.log(`✅ Service is healthy`);
      return true;
    } else {
      console.log(`❌ Service health check failed: ${res.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Service unreachable: ${error.message}`);
    return false;
  }
}

(async () => {
  const files = [
    path.join(root, "rules/tests/progress/can_start.golden.json"),
    path.join(root, "rules/tests/game/risk_pass.golden.json"),
    path.join(root, "rules/tests/game/risk_fail.golden.json"),
    path.join(root, "rules/tests/game/team_success.golden.json"),
    path.join(root, "rules/tests/time/timeout_reset.golden.json"),
    path.join(root, "rules/tests/cert/award_gold.golden.json"),
    path.join(root, "rules/tests/cert/no_award_missing_level.golden.json")
  ];
  let okAll = true;
  for (const f of files) {
    const r = await runOne(f);
    if (!r.ok) { okAll = false; console.error("FAIL", f, "missing:", r.failures); }
    else { console.log("OK  ", f); }
  }
  if (!okAll) process.exit(1);
})(); 