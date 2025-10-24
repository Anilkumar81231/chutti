
import fetch from "node-fetch";

export async function callOpenAI({ apiKey, model, system, messages, temperature=0.7, max_tokens=400 }) {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: system }, ...messages],
      temperature,
      max_tokens
    })
  });
  if (!r.ok) {
    const e = await r.text();
    throw new Error(`OpenAI error: ${r.status} ${e}`);
    }
  const data = await r.json();
  return data.choices?.[0]?.message?.content || "";
}
