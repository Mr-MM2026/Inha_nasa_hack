import express from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

const openrouter = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
});

app.post('/api/evaluate-mission', async (req, res) => {
    try {
        const payload = req.body;
        let prompt;

        if (payload.user_question) {
            prompt = `You are a strict aerospace mission consultant for a professional NASA space mission simulator. 
CRITICAL RULES:
1. You MUST respond ONLY in professional English.
2. Discuss spacecraft design, orbits, mass, power, budgets, data links, and mission telemetry. 
3. If unrelated, reply: "ERROR: Out of scope. Consult mission telemetry parameters only."

Current Mission Parameters:
${JSON.stringify(payload.parameters, null, 2)}

User Question: "${payload.user_question}"

Return your response strictly as a valid JSON object without markdown formatting wrappers:
{
  "score": 5,
  "summary": "Technical response in professional English"
}`;
        } else {
            prompt = `You are an elite aerospace chief engineer and NASA mission judge. 
CRITICAL RULE: Respond ONLY in professional English.

Analyze spacecraft mission telemetry:
${JSON.stringify(payload, null, 2)}

Evaluate mission feasibility based on physics constraints (mass vs capacity, data volume vs bandwidth, power, budget).
Return strictly as valid JSON without markdown formatting:
{
  "score": <integer from 1 to 10>,
  "summary": "<concise 2-3 sentence space-engineering breakdown written in English>"
}`;
        }

        const completion = await openrouter.chat.completions.create({
            model: 'openrouter/free',
            messages: [{ role: 'user', content: prompt }],
        });

        const rawContent = completion.choices[0].message.content.trim();
        const cleanJsonStr = rawContent.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');
        
        const aiResult = JSON.parse(cleanJsonStr);
        res.json(aiResult);

    } catch (error) {
        console.error('OpenRouter Error:', error);
        res.status(500).json({ score: 4, summary: "Telemetry evaluation error from backend." });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 NASA Mission Control Server running at http://localhost:${PORT}`);
});