
import fetch from "node-fetch";

export async function callOllama({ baseUrl, model, system, messages, temperature=0.7, max_tokens=400 }) {
  const r = await fetch(`${baseUrl || "http://localhost:11434"}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: system }, ...messages],
      options: { temperature, num_predict: max_tokens }
    })
  });
  if (!r.ok) {
    const e = await r.text();
    throw new Error(`Ollama error: ${r.status} ${e}`);
  }
  const data = await r.json();
  const last = data.message?.content || data.messages?.slice(-1)[0]?.content || "";
  return last;
}
