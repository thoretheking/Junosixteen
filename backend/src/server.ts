import express from "express";
import cors from "cors";
import { policy } from "./routes/policy";
const { leaderboard } = require("./routes/leaderboard");
const { explainability } = require("./routes/explainability");
// import { modules } from "./routes/modules";
// import { security } from "./routes/security";

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    service: "juno-backend"
  });
});

// Routes
app.use("/api/policy", policy);
app.use("/api/leaderboard", leaderboard);
app.use("/api/explain", explainability);
// app.use("/api/modules", modules);
// app.use("/api/security", security);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 JunoSixteen Backend API on :${PORT}`)); 