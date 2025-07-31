// gemini-test.js
// CommonJS-Version (Standard in Node.js-Projekten ohne "type":"module")
const { GoogleGenerativeAI } = require("@google/generative-ai");

// API-Key aus Umgebungsvariable laden
const apiKey = process.env.AI_STUDIO_API_KEY;
if (!apiKey) {
  console.error("Fehlender API-Key. Setze vorher: $Env:AI_STUDIO_API_KEY=\"DEIN_GEMINI_API_KEY\"");
  process.exit(1);
}

// Client instanziieren
const genAI = new GoogleGenerativeAI(apiKey);

// generatives Modell holen (z. B. „text-bison-001“)
const model = genAI.getGenerativeModel({ model: "text-bison-001" });

async function run() {
  // reine Text-Prompt
  const prompt = "Erkläre, wie KI funktioniert";
  const result = await model.generateContent(prompt);
  const response = await result.response;
  console.log(await response.text()); 
}

run().catch(err => {
  console.error("Fehler bei der Anfrage:", err);
  process.exit(1);
});

