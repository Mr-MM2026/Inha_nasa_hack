/**
 * 🧠 МОДУЛЬ ИНТЕГРАЦИИ С СЕРВЕРОМ И ИИ
 * Отправляет параметры миссии на бэкенд и возвращает результат.
 */
async function evaluateMissionWithAI(payload) {
  const BACKEND_ENDPOINT = "/api/evaluate-mission";

  try {
    const response = await fetch(BACKEND_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Server communication error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      score: Math.min(10, Math.max(1, Number(data.score) || 5)),
      summary: data.summary || "No summary provided by neural network."
    };

  } catch (err) {
    console.error("AI Evaluation error:", err);
    return { 
      score: 3, 
      summary: "Critical network error communicating with AI service. Ensure backend server is running." 
    };
  }
}