
import { callOpenAI } from "./openai.js";
import { callOllama } from "./ollama.js";
import { callGemini } from "./gemini.js";

export function makeLLMFromEnv(env) {
  const adapter = (env.ADAPTER || 'gemini').toLowerCase();

  if (adapter === 'gemini') {
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Missing GEMINI_API_KEY (set it in backend/.env).");
    const model = env.GEMINI_MODEL || 'gemini-1.5-flash';
    return {
      async call({ system, messages, temperature, max_tokens }) {
        return callGemini({ apiKey, model, system, messages, temperature, max_tokens });
      }
    }
  }

  if (adapter === 'ollama') {
    const baseUrl = env.OLLAMA_URL || 'http://localhost:11434';
    const model = env.OLLAMA_MODEL || 'llama3';
    return {
      async call({ system, messages, temperature, max_tokens }) {
        return callOllama({ baseUrl, model, system, messages, temperature, max_tokens });
      }
    }
  }

  // default openai
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY (or set ADAPTER=gemini with GEMINI_API_KEY).");
  const model = env.OPENAI_MODEL || 'gpt-4o-mini';
  return {
    async call({ system, messages, temperature, max_tokens }) {
      return callOpenAI({ apiKey, model, system, messages, temperature, max_tokens });
    }
  }
}
