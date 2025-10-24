// backend/src/nlp/smalltalk.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Robust loader for portfolio.json from smalltalk.js (which is in backend/src/nlp)
function findFirstExisting(paths) {
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function loadPortfolioForSmalltalk() {
  const candidates = [
    path.join(__dirname, "..", "portfolio.json"),            // backend/src/portfolio.json
    path.join(__dirname, "..", "..", "portfolio.json"),      // backend/portfolio.json
    path.join(__dirname, "..", "..", "..", "portfolio.json") // <projectRoot>/portfolio.json
  ];
  const chosen = findFirstExisting(candidates);
  if (!chosen) {
    // Fail soft: return minimal defaults to avoid crashing smalltalk
    return { owner: { name: "Anil Kumar" } };
  }
  return JSON.parse(fs.readFileSync(chosen, "utf-8"));
}

const portfolio = loadPortfolioForSmalltalk();
const bossDisplay = `my boss ${portfolio?.owner?.name || "Anil Kumar"}`;

const patterns = [
  { id: "what_you_do", re: /\b(what\s*(do|u)\s*do)\b|\bwhat'?s\s*your\s*job\b/i },
  { id: "who_are_you", re: /\bwho\s*are\s*you\??\b/i },
  { id: "who_is_boss", re: /\bwho('?s| is)\s*your\s*boss\??\b/i },
  { id: "about_boss",  re: /\b(tell|say)\s*me\s*about\s*(your\s*)?boss\b/i },
];

function detect(text = "") {
  const t = String(text).trim();
  if (!t) return null;
  const hit = patterns.find(p => p.re.test(t));
  return hit?.id || null;
}

function replyFor(/* intent */) {
  const base =
    `Oh, me? I'm chitti! ✨ I'm the friendly, witty assistant to ${bossDisplay}. ` +
    `I make sure ${bossDisplay.split("my ")[1]}'s projects and skills get the spotlight they deserve.`;

  const pivot =
    `So, instead of my glamorous AI life 😄, how about we explore ${bossDisplay} — ` +
    `his projects, experience, or latest AI work? What do you want to know about my boss today?`;

  return `${base}\n\n${pivot}`;
}

export function handleSmalltalk(userText) {
  const intent = detect(userText);
  if (!intent) return null;

  return {
    role: "assistant",
    content: replyFor(intent),
    meta: { intent: "smalltalk", level: 2, source: "rule" }
  };
}
    