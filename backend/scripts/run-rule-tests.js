import { spawn } from "node:child_process";

console.log("🧪 Starting JunoSixteen Rule Tests...");

const child = spawn("node", ["scripts/verify-golden.mjs"], { 
  stdio: "inherit",
  cwd: process.cwd()
});

child.on("exit", code => {
  if (code === 0) {
    console.log("✅ All rule tests passed!");
  } else {
    console.log("❌ Rule tests failed!");
  }
  process.exit(code);
});

child.on("error", (error) => {
  console.error("💥 Failed to start test runner:", error.message);
  process.exit(1);
}); 