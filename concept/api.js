async function evaluateMissionWithAI(payload) {
  const BACKEND_ENDPOINT = "/api/evaluate-mission";

  try {
    const response = await fetch(BACKEND_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      score: Math.min(10, Math.max(1, Number(data.score) || 5)),
      summary: data.summary || "No technical summary returned."
    };

  } catch (err) {
    console.error("AI Evaluation error:", err);
    return { 
      score: 3, 
      summary: "Network communication error with NASA backend server." 
    };
  }
}