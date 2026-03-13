export function safeJsonParse<T>(json: string | undefined, fallback: T): T {
  if (!json) return fallback;
  try {
    // Remove markdown code blocks if present
    const cleanJson = json.replace(/```json\n?|```/g, '').trim();
    return JSON.parse(cleanJson) as T;
  } catch (e) {
    console.error("Failed to parse JSON:", e, json);
    return fallback;
  }
}
