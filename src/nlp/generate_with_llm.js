
// import { classifyIntent } from '../nlp/intent.js';

// function buildSystemPrompt(pf) {
//   const persona = pf?.persona?.name || "Pepper";
//   const boss = pf?.tone?.bossName || pf?.owner?.name || "my boss";
//   return `You are ${persona}, a friendly, witty personal assistant for ${boss}.
// Rules:
// - If the user's intent is portfolio-related, answer warmly, conversationally, and clearly with short paragraphs and bullet points when helpful.
// - If the user's intent is smalltalk or a joke: be playful and light.
// - If the user's intent is personal, set boundaries politely (do not ask or reveal personal/private info), and steer back to portfolio.
// - If the user's intent is rude or off-topic: respond with playful, non-abusive sarcasm; never target protected classes; avoid slurs or threats.
// - Keep replies concise (80–160 words), natural, and varied. Use occasional interjections (e.g., "ahh", "okayyy") and light emojis if it fits.
// - Always avoid illegal, hateful, or unsafe content.
// Use the provided portfolio JSON as the source of truth for portfolio questions.`;
// }


// function collectAllowedPersonalFacts(pf) {
//   const priv = pf?.privacy || {};
//   if (!priv.allowPersonalAnswers) return "";
//   const paths = Array.isArray(priv.shareFields) ? priv.shareFields : [];
//   const facts = [];
//   function get(path) {
//     return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined) ? acc[key] : undefined, pf);
//   }
//   for (const p of paths) {
//     const v = get(p);
//     if (v === undefined || v === null || v === "") continue;
//     facts.push(`${p}: ${Array.isArray(v) ? v.join(', ') : v}`);
//   }
//   return facts.join('\n');
// }

// function buildUserContext(pf) {
//   const ctx = [];
//   const owner = pf?.owner || {};
//   ctx.push(`Owner: ${owner.name || ''} — ${owner.title || ''}`.trim());
//   if (pf.summary) ctx.push(`Summary: ${pf.summary}`);
//   if (pf.skills?.length) ctx.push(`Skills: ${pf.skills.join(', ')}`);
//   if (pf.experience?.length) ctx.push(`Experience: ${pf.experience.map(e=>`${e.role} @ ${e.company} (${e.period})`).join('; ')}`);
//   if (pf.projects?.length) ctx.push(`Projects: ${pf.projects.map(p=>`${p.name} (${(p.stack||[]).join(', ')})`).join('; ')}`);
//   if (pf.education?.length) ctx.push(`Education: ${pf.education.map(ed=>`${ed.degree} — ${ed.school} (${ed.period})`).join('; ')}`);
//   if (pf.appearance) ctx.push(`Appearance: height ${pf.appearance.heightCm||'?'} cm; skin tone ${pf.appearance.skinTone||'?'}; eyes ${pf.appearance.eyeColor||'?'}; hair ${pf.appearance.hair||'?'}; pronouns ${pf.appearance.pronouns||'?'}.`);
//   if (pf.preferences) ctx.push(`Preferences: hobbies ${ (pf.preferences.hobbies||[]).join(', ') }; favorite tech ${ (pf.preferences.favoriteTech||[]).join(', ') }`);
//   return ctx.join('\n');
// }

// export async function generateLLMReply({ llm, message, pf, meta }) {
//   const { label } = classifyIntent(message);
//   const system = buildSystemPrompt(pf);
//   const context = buildUserContext(pf);
//   const tone = pf?.tone || {};
//   const escalation = Math.max(1, Math.min(3, meta?.escalationLevel || tone.scoldIntensity || 1));

//   const styleHints = {
//     aboutme: `If the user asks about the person, you MAY answer using only the allowed personal facts provided below. Keep it respectful and brief, then nudge back to portfolio.`,
//     portfolio: `Tone: friendly, helpful, human. Mention relevant items from context. End with a short nudge like "${(tone.signOffs||['anything else?'])[0]}".`,
//     smalltalk: `Tone: playful smalltalk, one or two lines.`,
//     joke: `Tell a short, safe, tech-themed joke.`,
//     personal: `Politely decline and redirect to portfolio topics. One or two lines.`,
//     rude: `Use witty, safe sarcasm (no abuse). Add a reminder to focus on portfolio. Escalation level: ${escalation}.`,
//     offtopic: `Light sarcasm and redirect to portfolio topics. Escalation level: ${escalation}.`,
//     help: `Explain what you can do in one small paragraph.`
//   };

//   const personalFacts = (label==="aboutme" || label==="personal") ? collectAllowedPersonalFacts(pf) : "";
//   const prompt = [
//     { role: "user", content: `Context:\n${context}\n\nAllowed personal facts (use ONLY these if needed):\n${personalFacts}\n\nUser intent: ${label}\nUser said: ${message}\n\nWrite the reply.\n${styleHints[label] || styleHints.offtopic}` }
//   ];

//   const temperature = label === 'portfolio' ? 0.7 : (label === 'smalltalk' || label === 'joke') ? 0.9 : 0.6;
//   const max_tokens = 300;

//   const reply = await llm.call({
//     system,
//     messages: prompt,
//     temperature,
//     max_tokens
//   });

//   return { reply, intent: label, escalation };
// }






// backend/src/nlp/generate_with_llm.js
import { classifyIntent } from "../nlp/intent.js";

function buildSystemPrompt(pf) {
  const persona = pf?.persona?.name || "Pepper";
  const boss = pf?.tone?.bossName || pf?.owner?.name || "my boss";
  return `You are ${persona}, a friendly, witty personal assistant for ${boss}.
Rules:
- Portfolio: answer warmly, clearly, with short paragraphs and bullets when helpful.
- Smalltalk/joke: playful and brief.
- Personal/private info: set boundaries politely and steer back to portfolio.
- Rude/off-topic: playful, non-abusive sarcasm; never target protected classes; no slurs or threats.
- Roast intent: Give a playful PG roast. No hate/harassment, no protected classes, no violence, no explicit/sexual content. Roast the user's request/situation (e.g., girlfriend talk or “5 vs 2 projects” complaint), not their identity. Keep to 2–3 punchy lines, then nudge back to portfolio/work.
- Always avoid illegal or unsafe content.
Use the provided portfolio JSON as the source of truth for portfolio questions.`;
}

function collectAllowedPersonalFacts(pf) {
  const priv = pf?.privacy || {};
  if (!priv.allowPersonalAnswers) return "";
  const paths = Array.isArray(priv.shareFields) ? priv.shareFields : [];
  const facts = [];
  function get(path) {
    return path.split(".").reduce(
      (acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined),
      pf
    );
  }
  for (const p of paths) {
    const v = get(p);
    if (v === undefined || v === null || v === "") continue;
    facts.push(`${p}: ${Array.isArray(v) ? v.join(", ") : v}`);
  }
  return facts.join("\n");
}

function buildUserContext(pf) {
  const ctx = [];
  const owner = pf?.owner || {};
  if (owner.name || owner.title) {
    ctx.push(`Owner: ${owner.name || ""} — ${owner.title || ""}`.trim());
  }
  if (pf.summary) ctx.push(`Summary: ${pf.summary}`);
  if (pf.skills?.length) ctx.push(`Skills: ${pf.skills.join(", ")}`);
  if (pf.experience?.length) {
    ctx.push(
      `Experience: ${pf.experience
        .map((e) => `${e.role} @ ${e.company} (${e.period})`)
        .join("; ")}`
    );
  }
  if (pf.projects?.length) {
    const list = pf.projects
      .map((p) => {
        const stack = Array.isArray(p.stack) ? ` (${p.stack.join(", ")})` : "";
        const about = p.about ? ` — ${p.about}` : "";
        return `${p.name}${stack}${about}`;
      })
      .join("\n- ");
    ctx.push(`Projects:\n- ${list}`);
  }
  if (pf.education?.length) {
    ctx.push(
      `Education: ${pf.education
        .map((ed) => `${ed.degree} — ${ed.school} (${ed.period})`)
        .join("; ")}`
    );
  }
  if (pf.appearance) {
    ctx.push(
      `Appearance: height ${pf.appearance.heightCm ?? "?"} cm; skin tone ${
        pf.appearance.skinTone ?? "?"
      }; eyes ${pf.appearance.eyeColor ?? "?"}; hair ${
        pf.appearance.hair ?? "?"
      }; pronouns ${pf.appearance.pronouns ?? "?"}.`
    );
  }
  if (pf.preferences) {
    ctx.push(
      `Preferences: hobbies ${(pf.preferences.hobbies || []).join(
        ", "
      )}; favorite tech ${(pf.preferences.favoriteTech || []).join(", ")}`
    );
  }
  return ctx.join("\n");
}

function roastGuardrails() {
  return `Roast guardrails:
- PG only: no profanity/slurs, no protected classes (race, religion, gender, sexuality, nationality, disability, etc.).
- No explicit/sexual content, no threats or violence.
- Roast the situation/request (girlfriend talk or 5-vs-2 projects complaint), not identity.
- Keep it to 2–3 short lines, then nudge back to portfolio/work.`;
}

export async function generateLLMReply({ llm, message, pf, meta }) {
  const { label } = classifyIntent(message);
  const system = buildSystemPrompt(pf);
  const context = buildUserContext(pf);
  const tone = pf?.tone || {};
  const escalation = Math.max(
    1,
    Math.min(3, meta?.escalationLevel || tone.scoldIntensity || 1)
  );

  const styleHints = {
    aboutme: `If the user asks about the person, use ONLY the allowed personal facts below. Be brief and respectful, then nudge back to portfolio.`,
    portfolio: `Tone: friendly, helpful, human. Mention relevant items from context. End with a short nudge like "${
      (tone.signOffs || ["anything else?"])[0]
    }".`,
    smalltalk: `Playful smalltalk, one or two lines.`,
    joke: `Tell a short, safe, tech-themed joke.`,
    personal: `Politely decline and redirect to portfolio topics. One or two lines.`,
    rude: `Use witty, safe sarcasm (no abuse). Add a reminder to focus on portfolio. Escalation level: ${escalation}.`,
    offtopic: `Light sarcasm and redirect to portfolio topics. Escalation level: ${escalation}.`,
    roast: roastGuardrails(),
    help: `Explain what you can do in one small paragraph.`,
  };

  const personalFacts =
    label === "aboutme" || label === "personal"
      ? collectAllowedPersonalFacts(pf)
      : "";

  const prompt = [
    {
      role: "user",
      content: `Context:
${context}

Allowed personal facts (use ONLY these if needed):
${personalFacts || "(none)"}

User intent: ${label}
User said: ${message}

Write the reply.
${styleHints[label] || styleHints.offtopic}`,
    },
  ];

  const temperature =
    label === "portfolio"
      ? 0.7
      : label === "smalltalk" || label === "joke" || label === "roast"
      ? 0.9
      : 0.6;

  // a bit higher so full project list fits when needed
  const max_tokens = label === "portfolio" ? 600 : 300;

  const reply = await llm.call({
    system,
    messages: prompt,
    temperature,
    max_tokens,
  });

  return { reply, intent: label, escalation };
}
