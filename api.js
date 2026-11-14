/**
 * 🧠 МОДУЛЬ ДЛЯ БЭКЕНДЕРА (САШИ)
 * Фронтенд передает сюда собранный JSON (payload). 
 * Здесь Саша настраивает запрос к своей нейросети/серверу и возвращает { score, summary }.
 */
async function evaluateMissionWithAI(payload) {
  // Эндпоинт, который сделает Саша на бэкенде:
  const BACKEND_ENDPOINT = "/api/evaluate-mission";

  try {
    /* КОГДА БЭКЕНД БУДЕТ ГОТОВ, РАСКОММЕНТИРУЙ ЭТОТ БЛОК:
    const response = await fetch(BACKEND_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error("Server communication error");
    return await response.json(); // Ожидаемый формат ответа от бэка: { score: 8, summary: "текст..." }
    */

    // ПОКА БЭКЕНДА НЕТ (ВРЕМЕННАЯ ЛОКАЛЬНАЯ СИМУЛЯЦИЯ ДЛЯ ТЕСТА КНОПКИ):
    return new Promise(resolve => {
      setTimeout(() => {
        const isEarth = payload.mission_id === 'earth_climate_monitor';
        const p = payload.parameters;
        let score = 9;
        if (p.mass_kg > (isEarth ? 300 : 1000) || p.budget_mil_usd > (isEarth ? 50 : 250)) score -= 4;
        if (p.data_volume_gb_day * 30 > p.communication_kbps) score -= 2;
        if (isEarth && p.orbit !== 'LEO') score -= 3;
        score = Math.max(1, score);

        resolve({
          score: score,
          summary: `AI Evaluation for ${payload.mission_id}: Orbit ${p.orbit}, Mass ${p.mass_kg}kg, Budget $${p.budget_mil_usd}M. ` +
            (score >= 7 ? "All parameters balanced successfully. Trajectory and downlink stable." : "Subsystem constraints violated, leading to structural or transmission failure.")
        });
      }, 1000);
    });

  } catch (err) {
    console.error("AI Evaluation error:", err);
    return { score: 3, summary: "Critical network error communicating with AI service." };
  }
}