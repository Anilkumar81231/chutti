
// // backend/src/server.js
// import express from "express";
// import cors from "cors";
// import fs from "fs";
// import path from "path";
// import { fileURLToPath } from "url";
// import dotenv from "dotenv";
// import nodemailer from "nodemailer";

// // Load environment variables
// dotenv.config();

// // ---- Adapters / NLP (your existing files) ----
// import { makeLLMFromEnv } from "./adapters/llm.js";
// import { generateLLMReply } from "./nlp/generate_with_llm.js";
// import { handleSmalltalk } from "./nlp/smalltalk.js";

// // ---- FS path helpers ----
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // ---- App setup ----
// const app = express();
// app.set("trust proxy", true);

// // --------- CORS (allow localhost + env + vercel) ----------
// const defaultOrigins = [
//   "http://localhost:3000",
//   "http://localhost:5173",
//   "http://localhost:4200",
// ];

// const envOrigins = (process.env.ALLOWED_ORIGINS || "")
//   .split(",")
//   .map((s) => s.trim())
//   .filter(Boolean);

// /**
//  * Allow production vercel domain and (optionally) preview deployments.
//  * Change "sanilkumar" below to match your project if needed.
//  */
// const allowOrigin = (origin) => {
//   if (!origin) return true; // server-to-server, curl, Postman
//   try {
//     const u = new URL(origin);
//     // add your production domain here
//     const isProd = u.hostname === "sanilkumar.vercel.app";
//     // optional: allow preview URLs such as sanilkumar-git-main-<team>.vercel.app
//     const isPreview = /^sanilkumar-.*\.vercel\.app$/.test(u.hostname);
//     // any explicit env origin
//     const inEnv = envOrigins.includes(origin);
//     // any localhost from defaults
//     const inDefaults = defaultOrigins.includes(origin);
//     return isProd || isPreview || inEnv || inDefaults;
//   } catch {
//     return false;
//   }
// };

// app.use(
//   cors({
//     origin(origin, cb) {
//       if (allowOrigin(origin)) return cb(null, true);
//       return cb(new Error(`CORS blocked for origin: ${origin || "(none)"}`));
//     },
//     methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
//     // IMPORTANT: include any custom headers your frontend sends
//     allowedHeaders: [
//       "Content-Type",
//       "Authorization",
//       "X-Requested-With",
//       "X-Session-Id",
//     ],
//     credentials: false, // set true only if you use cookies/sessions
//   })
// );

// // JSON body parsing
// app.use(express.json({ limit: "1mb" }));

// // ---------- Portfolio loader (robust path detection) ----------
// function findFirstExisting(paths) {
//   for (const p of paths) {
//     if (fs.existsSync(p)) return p;
//   }
//   return null;
// }

// function loadPortfolio() {
//   const candidates = [
//     path.join(__dirname, "portfolio.json"),
//     path.join(__dirname, "..", "portfolio.json"),
//     path.join(__dirname, "..", "..", "portfolio.json"),
//   ];

//   // in backend/src/server.js, inside loadPortfolio()
// const chosen = findFirstExisting(candidates);
// if (!chosen) {
//   throw new Error("portfolio.json not found. Looked in:\n" + candidates.join("\n"));
// }
// console.log("[portfolio] Using file:", chosen);   // <— add this line
// return JSON.parse(fs.readFileSync(chosen, "utf-8"));

// }

// // ---------- Off-topic tracking ----------
// const violMap = new Map(); // sessionId -> non-portfolio count
// function getEscalation(sessionId) {
//   if (!sessionId) return 1;
//   const count = violMap.get(sessionId) || 0;
//   if (count >= 6) return 3;
//   if (count >= 2) return 2;
//   return 1;
// }
// function bump(sessionId, intent) {
//   if (!sessionId) return;
//   if (intent !== "portfolio") {
//     violMap.set(sessionId, (violMap.get(sessionId) || 0) + 1);
//   }
// }

// // ---------- Health ----------
// app.get("/api/health", (req, res) => res.json({ ok: true }));

// // ---------- Chat ----------
// app.post("/api/chat", async (req, res) => {
//   try {
//     const { message, sessionId } = req.body || {};
//     if (!message || typeof message !== "string") {
//       return res.status(400).json({ error: "Missing 'message' string." });
//     }

//     // 1) Rule-based smalltalk first
//     const smalltalk = handleSmalltalk(message);
//     if (smalltalk) {
//       return res.json({
//         reply: smalltalk.content,
//         intent: smalltalk.meta.intent,
//         escalation: 1,
//         nonPortfolioCount: violMap.get(sessionId) || 0,
//         adapter: "rule",
//         level: smalltalk.meta.level,
//       });
//     }

//     // 2) Fall back to LLM
//     const pf = loadPortfolio();
//     // inside POST /api/chat

// console.log("[portfolio] projects length:", Array.isArray(pf?.projects) ? pf.projects.length : "N/A");
// console.log("[portfolio] project names:", (pf?.projects || []).map(p => p.name));

    
//     const nonPortfolioCount = sessionId ? violMap.get(sessionId) || 0 : 0;
//     const escalationLevel = getEscalation(sessionId);
//     const llm = makeLLMFromEnv(process.env);

//     const { reply, intent, escalation } = await generateLLMReply({
//       llm,
//       message,
//       pf,
//       meta: { escalationLevel, nonPortfolioCount },
//     });

//     bump(sessionId, intent);

//     res.json({
//       answer: reply, // match frontend expectation
//       intent,
//       escalation,
//       nonPortfolioCount: violMap.get(sessionId) || 0,
//       adapter: (process.env.ADAPTER || "gemini"),
//     });
//   } catch (e) {
//     console.error(e);
//     res.status(500).json({ error: e.message || "Internal error" });
//   }
// });

// // ---------- Contact (email) ----------
// app.post("/api/send", async (req, res) => {
//   const { name, email, subject, message } = req.body || {};

//   // 1) Input validation
//   if (!name || !email || !subject || !message) {
//     return res
//       .status(400)
//       .json({ success: false, message: "All fields are required" });
//   }

//   // 2) Env check
//   if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
//     console.error("ERROR: GMAIL_USER or GMAIL_PASS missing in .env");
//     return res.status(500).json({
//       success: false,
//       message: "Server email configuration is missing.",
//     });
//   }

//   try {
//     // 3) Create transporter (Gmail)
//     const transporter = nodemailer.createTransport({
//       host: "smtp.gmail.com",
//       port: 465,
//       secure: true,
//       auth: {
//         user: process.env.GMAIL_USER,
//         pass: process.env.GMAIL_PASS, // Gmail App Password
//       },
//     });

//     // 4) Compose email
//     const mailOptions = {
//       from: process.env.GMAIL_USER,
//       to: process.env.GMAIL_USER, // send to yourself
//       replyTo: `${name} <${email}>`,
//       subject: `New Contact Form: ${subject}`,
//       text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\nMessage: ${message}`,
//     };

//     // 5) Send
//     await transporter.sendMail(mailOptions);
//     res.json({ success: true, message: "Message sent successfully!" });
//   } catch (err) {
//     console.error("Error sending email:", err);
//     res.status(500).json({ success: false, message: "Error sending message" });
//   }
// });

// // ---------- Start ----------
// const PORT = process.env.PORT || 4000;
// app.listen(PORT, "0.0.0.0", () => {
//   console.log(
//     `[backend] listening on http://0.0.0.0:${PORT} using ${(process.env.ADAPTER || "gemini")
//       .toUpperCase()} adapter`
//   );
//   console.log(
//     `Allowed (env) origins: ${envOrigins.join(", ") || "(none)"}`
//   );
// });




















// backend/src/server.js
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

// Load environment variables
dotenv.config();

// ---- Adapters / NLP ----
import { makeLLMFromEnv } from "./adapters/llm.js";
import { generateLLMReply } from "./nlp/generate_with_llm.js";
import { handleSmalltalk } from "./nlp/smalltalk.js";

// ---- FS path helpers ----
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---- App setup ----
const app = express();
app.set("trust proxy", true);

// --------- CORS (allow localhost + env + vercel) ----------
const defaultOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:4200",
];

const envOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

/**
 * Allow production vercel domain and (optionally) preview deployments.
 * Change "sanilkumar" below to match your project if needed.
 */
const allowOrigin = (origin) => {
  if (!origin) return true; // server-to-server, curl, Postman
  try {
    const u = new URL(origin);
    // add your production domain here
    const isProd = u.hostname === "sanilkumar.vercel.app";
    // optional: allow preview URLs such as sanilkumar-git-main-<team>.vercel.app
    const isPreview = /^sanilkumar-.*\.vercel\.app$/.test(u.hostname);
    // any explicit env origin
    const inEnv = envOrigins.includes(origin);
    // any localhost from defaults
    const inDefaults = defaultOrigins.includes(origin);
    return isProd || isPreview || inEnv || inDefaults;
  } catch {
    return false;
  }
};

app.use(
  cors({
    origin(origin, cb) {
      if (allowOrigin(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked for origin: ${origin || "(none)"}`));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    // IMPORTANT: include any custom headers your frontend sends
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "X-Session-Id",
    ],
    credentials: false, // set true only if you use cookies/sessions
  })
);

// JSON body parsing
app.use(express.json({ limit: "1mb" }));

// ---------- Portfolio loader (robust path detection) ----------
function findFirstExisting(paths) {
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function loadPortfolio() {
  const candidates = [
    path.join(__dirname, "portfolio.json"),
    path.join(__dirname, "..", "portfolio.json"),
    path.join(__dirname, "..", "..", "portfolio.json"),
  ];
  const chosen = findFirstExisting(candidates);
  if (!chosen) {
    throw new Error(
      "portfolio.json not found. Looked in:\n" + candidates.join("\n")
    );
  }
  console.log("[portfolio] Using file:", chosen);
  return JSON.parse(fs.readFileSync(chosen, "utf-8"));
}

// ---------- Off-topic tracking ----------
const violMap = new Map(); // sessionId -> non-portfolio count
function getEscalation(sessionId) {
  if (!sessionId) return 1;
  const count = violMap.get(sessionId) || 0;
  if (count >= 6) return 3;
  if (count >= 2) return 2;
  return 1;
}
function bump(sessionId, intent) {
  if (!sessionId) return;
  if (intent !== "portfolio") {
    violMap.set(sessionId, (violMap.get(sessionId) || 0) + 1);
  }
}

// ---------- Health ----------
app.get("/api/health", (req, res) => res.json({ ok: true }));

// ---------- Portfolio / Projects (NEW) ----------
app.get("/api/portfolio", (req, res) => {
  try {
    const pf = loadPortfolio();
    return res.json(pf);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to load portfolio.json" });
  }
});

app.get("/api/projects", (req, res) => {
  try {
    const pf = loadPortfolio();
    const projects = Array.isArray(pf?.projects) ? pf.projects : [];
    return res.json(projects);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to load projects" });
  }
});

// ---------- Chat ----------
// ---------- Chat ----------
app.post("/api/chat", async (req, res) => {
  try {
    const { message, sessionId } = req.body || {};
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Missing 'message' string." });
    }

    const smalltalk = handleSmalltalk(message);
    if (smalltalk) {
      return res.json({
        answer: smalltalk.content,       // <-- ensure "answer" not "reply"
        intent: smalltalk.meta.intent,
        escalation: 1,
        nonPortfolioCount: violMap.get(sessionId) || 0,
        adapter: "rule",
        level: smalltalk.meta.level,
      });
    }

    const pf = loadPortfolio();
    const nonPortfolioCount = sessionId ? violMap.get(sessionId) || 0 : 0;
    const escalationLevel = getEscalation(sessionId);
    const llm = makeLLMFromEnv(process.env);

    try {
      const { reply, intent, escalation } = await generateLLMReply({
        llm,
        message,
        pf,
        meta: { escalationLevel, nonPortfolioCount },
      });

      bump(sessionId, intent);

      return res.json({
        answer: reply,                   // <-- frontend expects "answer"
        intent,
        escalation,
        nonPortfolioCount: violMap.get(sessionId) || 0,
        adapter: (process.env.ADAPTER || "gemini"),
      });
    } catch (llmErr) {
      console.error("[LLM ERROR]", llmErr?.message || llmErr);
      // Fallback so UI never hangs
      const safe = makeSafePortfolioReply(pf, message);
      return res.json({
        answer: safe,
        intent: "portfolio",
        escalation: 1,
        nonPortfolioCount: violMap.get(sessionId) || 0,
        adapter: "fallback",
      });
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || "Internal error" });
  }
});


// ---------- Contact (email) ----------
app.post("/api/send", async (req, res) => {
  const { name, email, subject, message } = req.body || {};

  // 1) Input validation
  if (!name || !email || !subject || !message) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });
  }

  // 2) Env check
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    console.error("ERROR: GMAIL_USER or GMAIL_PASS missing in .env");
    return res.status(500).json({
      success: false,
      message: "Server email configuration is missing.",
    });
  }

  try {
    // 3) Create transporter (Gmail)
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS, // Gmail App Password
      },
    });

    // 4) Compose email
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: process.env.GMAIL_USER, // send to yourself
      replyTo: `${name} <${email}>`,
      subject: `New Contact Form: ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\nMessage: ${message}`,
    };

    // 5) Send
    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: "Message sent successfully!" });
  } catch (err) {
    console.error("Error sending email:", err);
    res.status(500).json({ success: false, message: "Error sending message" });
  }
});

// ---------- Start ----------
const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `[backend] listening on http://0.0.0.0:${PORT} using ${(process.env.ADAPTER || "gemini").toUpperCase()} adapter`
  );
  console.log(`Allowed (env) origins: ${envOrigins.join(", ") || "(none)"}`);
});

export { loadPortfolio }; // (optional) export if other modules need it
