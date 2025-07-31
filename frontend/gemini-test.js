const { GoogleGenerativeAI } = require("@google/generative-ai");
const apiKey = process.env.AI_STUDIO_API_KEY;
if (!apiKey) {
  console.error("Fehlender API-Key. Setze vorher: $Env:AI_STUDIO_API_KEY=\"DEIN_GEMINI_API_KEY\"");
  process.exit(1);
}
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "text-bison-001" });
async function run() {
  const result = await model.generateContent("Erkläre, wie KI funktioniert");
  const response = await result.response;
  console.log(await response.text());
}
run().catch(err => {
  console.error("Fehler bei der Anfrage:", err);
  process.exit(1);
});
