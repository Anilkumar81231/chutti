// export function normalize(s='') {
//   return s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim();
// }

// const kw = {
//   aboutme: ['about me','about yourself','tell me about you','who are you','height','skin tone','skin colour','skin color','hobbies','interests','eye color','hair color','pronouns'],
//   portfolio: [
//     'portfolio','resume','cv','skill','skills','project','projects','experience','work','company',
//     'role','education','degree','school','university','college','contact','email','github','stack','tech'
//   ],
//   smalltalk: ['how are you',"what's up",'hi','hello','hey','good morning','good evening','sup','how is it going','how do you do'],
//   personal: ['your age','married','relationship','religion','salary','politics','where do you live','phone number','address'],
//   joke: ['joke','funny','meme','lol','lmao','rofl','haha','make me laugh'],
//   rude: ['stupid','idiot','dumb','shut up','useless','hate you','trash','moron','noob'],
//   help: ['help','what can you do','commands','how to use','guide']
// };

// export function classifyIntent(text) {
//   const t = normalize(text);
//   let scores = { portfolio:0, smalltalk:0, personal:0, joke:0, rude:0, help:0, aboutme:0, offtopic:0 };

//   for (const k of kw.portfolio) if (t.includes(k)) scores.portfolio += 2;
//   for (const k of kw.smalltalk) if (t.includes(k)) scores.smalltalk += 1.7;
//   for (const k of kw.personal) if (t.includes(k)) scores.personal += 2;
//   for (const k of kw.joke) if (t.includes(k)) scores.joke += 1.6;
//   for (const k of kw.rude) if (t.includes(k)) scores.rude += 3;
//   for (const k of kw.help) if (t.includes(k)) scores.help += 2;
//   for (const k of kw.aboutme) if (t.includes(k)) scores.aboutme += 2.2;

//   if (/\b(c#|asp\.?net|sql|entity framework|react|angular|azure|docker)\b/i.test(text)) scores.portfolio += 1.5;
//   if (/who are you|about yourself|introduce yourself/i.test(text)) scores.portfolio += 1.2;

//   const maxLabel = Object.entries(scores).sort((a,b)=>b[1]-a[1])[0];
//   const label = (maxLabel && maxLabel[1] > 0) ? maxLabel[0] : 'offtopic';
//   return { label, scores };
// }














// backend/src/nlp/intent.js
export function normalize(s = "") {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const kw = {
  aboutme: [
    "about me","about yourself","tell me about you","who are you","height","skin tone","skin colour","skin color",
    "hobbies","interests","eye color","hair color","pronouns"
  ],
  portfolio: [
    "portfolio","resume","cv","skill","skills","project","projects","experience","work","company",
    "role","education","degree","school","university","college","contact","email","github","stack","tech"
  ],
  smalltalk: ["how are you","what's up","hi","hello","hey","good morning","good evening","sup","how is it going","how do you do"],
  personal: ["your age","married","relationship","religion","salary","politics","where do you live","phone number","address"],
  joke: ["joke","funny","meme","lol","lmao","rofl","haha","make me laugh"],
  rude: ["stupid","idiot","dumb","shut up","useless","hate you","trash","moron","noob"],
  help: ["help","what can you do","commands","how to use","guide"],
};

// --- Roast triggers ---
// 1) Girlfriend / relationship topics
const rxGF = /\b(girlfriend|girl ?friend|bf|boyfriend|crush|date|dating|relationship)\b/i;
// 2) “5 vs 2 projects” complaints (various phrasings)
const rxProjComplaint =
  /\b(projects?)\b.*\b(5|five)\b.*\b(2|two)\b|\bonly\s*2\s*projects?\b|\bwhy\b.*\b(2|two)\b.*\b(5|five)\b|\b(where (are|is) the (rest|others))\b/i;
// 3) Explicit roast ask
const rxRoastCue = /\b(roast|roasting|make fun|insult|burn|ratio|clown)\b/i;

export function classifyIntent(text) {
  const t = normalize(text);

  // 🔥 Force "roast" for the specified cases
  if (rxRoastCue.test(text) || rxGF.test(text) || rxProjComplaint.test(text)) {
    return { label: "roast", scores: { roast: 1 } };
  }

  // Otherwise, use your existing weighted scoring
  const scores = { portfolio:0, smalltalk:0, personal:0, joke:0, rude:0, help:0, aboutme:0, offtopic:0 };

  for (const k of kw.portfolio) if (t.includes(k)) scores.portfolio += 2;
  for (const k of kw.smalltalk) if (t.includes(k)) scores.smalltalk += 1.7;
  for (const k of kw.personal) if (t.includes(k)) scores.personal += 2;
  for (const k of kw.joke) if (t.includes(k)) scores.joke += 1.6;
  for (const k of kw.rude) if (t.includes(k)) scores.rude += 3;
  for (const k of kw.help) if (t.includes(k)) scores.help += 2;
  for (const k of kw.aboutme) if (t.includes(k)) scores.aboutme += 2.2;

  if (/\b(c#|asp\.?net|sql|entity framework|react|angular|azure|docker)\b/i.test(text)) scores.portfolio += 1.5;
  if (/who are you|about yourself|introduce yourself/i.test(text)) scores.portfolio += 1.2;

  const maxLabel = Object.entries(scores).sort((a,b)=>b[1]-a[1])[0];
  const label = (maxLabel && maxLabel[1] > 0) ? maxLabel[0] : "offtopic";
  return { label, scores };
}
