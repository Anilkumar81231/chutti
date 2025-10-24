// backend/src/adapters/gemini.js
import fetch from "node-fetch";

const PREFERRED = [
  "gemini-1.5-flash-latest",
  "gemini-1.5-pro-latest",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-1.0-pro"
];

async function listModels(apiKey, version) {
  const url = `https://generativelanguage.googleapis.com/${version}/models?key=${apiKey}`;
  const r = await fetch(url);
  if (!r.ok) {
    const e = await r.text();
    throw new Error(`Gemini listModels error (${version}): ${r.status} ${e}`);
  }
  const data = await r.json();
  return data.models || [];
}

function pickModel(models, desired) {
  const names = new Set(models.map(m => m.name.replace(/^models\//, "")));
  if (desired && names.has(desired)) return desired;

  // Prefer well-known aliases first
  for (const p of PREFERRED) if (names.has(p)) return p;

  // Otherwise pick any model that supports generateContent
  for (const m of models) {
    if ((m.supportedGenerationMethods || []).includes("generateContent")) {
      return m.name.replace(/^models\//, "");
    }
  }
  return null;
}

async function resolveModelAndVersion({ apiKey, desired }) {
  // Try v1 first
  try {
    const mods = await listModels(apiKey, "v1");
    const choice = pickModel(mods, desired);
    if (choice) return { version: "v1", model: choice };
  } catch (_) {}

  // Fallback to v1beta
  try {
    const mods = await listModels(apiKey, "v1beta");
    const choice = pickModel(mods, desired);
    if (choice) return { version: "v1beta", model: choice };
  } catch (e) {
    throw e;
  }

  throw new Error("No compatible Gemini model found for generateContent. Check your API access in AI Studio.");
}

export async function callGemini({ apiKey, model, system, messages, temperature = 0.8 }) {
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY.");

  const { version, model: resolved } = await resolveModelAndVersion({ apiKey, desired: model });
  const url = `https://generativelanguage.googleapis.com/${version}/models/${resolved}:generateContent?key=${apiKey}`;

  // Flatten system + chat messages to a simple text prompt
  const prompt = [
    { role: "system", content: system },
    ...messages
  ].map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n");

  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { temperature }
  };

  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!r.ok) {
    const e = await r.text();
    throw new Error(`Gemini API error: ${r.status} ${e}`);
  }

  const data = await r.json();
  const text =
    data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("") ||
    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    "";
  return text;
}
