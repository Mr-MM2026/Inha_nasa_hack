import express from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const openrouter = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
});

app.post('/api/evaluate-mission', async (req, res) => {
    try {
        const payload = req.body;
        let prompt;

        if (payload.user_question) {
            prompt = `You are a strict aerospace mission consultant for a rocket building simulator. 
CRITICAL RULES:
1. You MUST respond ONLY in professional English. Never use any other language, regardless of the user's language.
2. You ONLY discuss spacecraft design, orbits, mass, power, budgets, data links, and mission telemetry. 
3. If the user asks about anything unrelated to space, rocketry, or their current mission, you MUST refuse and reply: "ERROR: Out of scope. Consult mission telemetry parameters only."

Current Mission Parameters:
${JSON.stringify(payload.parameters, null, 2)}

User Question: "${payload.user_question}"

Return your response strictly as a valid JSON object without any markdown formatting wrappers (like \`\`\`json), structured exactly like this:
{
  "score": 5,
  "summary": "Your technical response to the engineer strictly in English"
}`;
        } else {
            prompt = `You are an elite aerospace chief engineer and AI judge. 
CRITICAL RULE: You MUST respond ONLY in professional English.

Analyze the following spacecraft mission telemetry and parameters:
${JSON.stringify(payload, null, 2)}

Evaluate mission feasibility based on physics constraints (mass vs capacity, data volume vs downlink bandwidth, power, and budget).
Give a clear technical breakdown of why the mission succeeded or failed based strictly on these parameters.

Return your response strictly as a valid JSON object without any markdown formatting wrappers (like \`\`\`json), structured exactly like this:
{
  "score": <integer from 1 to 10>,
  "summary": "<a concise 2-3 sentence space-engineering breakdown of the telemetry results written strictly in English>"
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
        res.status(500).json({ score: 4, summary: "Telemetry evaluation error." });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен: http://localhost:${PORT}`);
});