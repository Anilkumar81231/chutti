

// // backend/src/server.js
// import express from "express";
// import cors from "cors";
// import fs from "fs";
// import path from "path";
// import { fileURLToPath } from "url";
// import dotenv from "dotenv";
// import nodemailer from "nodemailer";

// // If you still need bodyParser for other content types, you can keep it,
// // but express.json() already handles JSON bodies.
// dotenv.config();

// // ---- Your existing adapters / NLP pieces ----
// import { makeLLMFromEnv } from "./adapters/llm.js";
// import { generateLLMReply } from "./nlp/generate_with_llm.js";
// import { handleSmalltalk } from "./nlp/smalltalk.js";

// // ---- FS path helpers ----
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // ---- App setup ----
// const app = express();
// app.use(cors());
// app.use(express.json({ limit: "1mb" }));

// // ---------- Portfolio loader (robust path detection) ----------
// function findFirstExisting(paths) {
//   for (const p of paths) {
//     if (fs.existsSync(p)) return p;
//   }
//   return null;
// }

// function loadPortfolio() {
//   // Try common locations relative to backend/src
//   const candidates = [
//     path.join(__dirname, "portfolio.json"),             // backend/src/portfolio.json
//     path.join(__dirname, "..", "portfolio.json"),       // backend/portfolio.json
//     path.join(__dirname, "..", "..", "portfolio.json"), // <projectRoot>/portfolio.json
//   ];

//   const chosen = findFirstExisting(candidates);
//   if (!chosen) {
//     throw new Error("portfolio.json not found. Looked in:\n" + candidates.join("\n"));
//   }
//   return JSON.parse(fs.readFileSync(chosen, "utf-8"));
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
//     const nonPortfolioCount = sessionId ? (violMap.get(sessionId) || 0) : 0;
//     const escalationLevel = getEscalation(sessionId);
//     const llm = makeLLMFromEnv(process.env);

//     const { reply, intent, escalation } = await generateLLMReply({
//       llm,
//       message,
//       pf,
//       meta: { escalationLevel, nonPortfolioCount },
//     });

//     bump(sessionId, intent);

//   res.json({
//   answer: reply, // 👈 match frontend expectation
//   intent,
//   escalation,
//   nonPortfolioCount: violMap.get(sessionId) || 0,
//   adapter: (process.env.ADAPTER || "gemini"),
// });

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
//     return res.status(400).json({ success: false, message: "All fields are required" });
//   }

//   // 2) Env check
//   if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
//     console.error("ERROR: GMAIL_USER or GMAIL_PASS missing in .env");
//     return res.status(500).json({ success: false, message: "Server email configuration is missing." });
//   }

//   try {
//     // 3) Create transporter
//     const transporter = nodemailer.createTransport({
//       service: "gmail",
//       auth: {
//         user: process.env.GMAIL_USER,
//         pass: process.env.GMAIL_PASS, // Gmail App Password (not your normal password)
//       },
//     });

//     // 4) Compose email
//     const mailOptions = {
//       from: email, // sender is user
//       to: process.env.GMAIL_USER, // receiver is site owner
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
// const PORT = process.env.PORT || 4000; // keep 4000 if you’re already using that
// app.listen(PORT, () => {
//   console.log(`[backend] listening on http://localhost:${PORT} using ${(process.env.ADAPTER || "gemini").toUpperCase()} adapter`);
//   console.log(`Contact route available at http://localhost:${PORT}/api/send`);
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

// ---- Adapters / NLP (your existing files) ----
import { makeLLMFromEnv } from "./adapters/llm.js";
import { generateLLMReply } from "./nlp/generate_with_llm.js";
import { handleSmalltalk } from "./nlp/smalltalk.js";

// ---- FS path helpers ----
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---- App setup ----
const app = express();

// If you'll run behind Nginx/ALB, this makes HTTPS & IP detection correct
app.set("trust proxy", true);

// --------- CORS (allow localhost + anything set via ALLOWED_ORIGINS) ----------
const defaultOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:4200",
];

const envOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]));

app.use(
  cors({
    origin(origin, cb) {
      // allow requests without Origin header (curl/Postman/server-to-server)
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false, // set true only if you use cookies for auth
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
  // Try common locations relative to backend/src
  const candidates = [
    path.join(__dirname, "portfolio.json"), // backend/src/portfolio.json
    path.join(__dirname, "..", "portfolio.json"), // backend/portfolio.json
    path.join(__dirname, "..", "..", "portfolio.json"), // <projectRoot>/portfolio.json
  ];

  const chosen = findFirstExisting(candidates);
  if (!chosen) {
    throw new Error(
      "portfolio.json not found. Looked in:\n" + candidates.join("\n")
    );
  }
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

// ---------- Chat ----------
app.post("/api/chat", async (req, res) => {
  try {
    const { message, sessionId } = req.body || {};
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Missing 'message' string." });
    }

    // 1) Rule-based smalltalk first
    const smalltalk = handleSmalltalk(message);
    if (smalltalk) {
      return res.json({
        reply: smalltalk.content,
        intent: smalltalk.meta.intent,
        escalation: 1,
        nonPortfolioCount: violMap.get(sessionId) || 0,
        adapter: "rule",
        level: smalltalk.meta.level,
      });
    }

    // 2) Fall back to LLM
    const pf = loadPortfolio();
    const nonPortfolioCount = sessionId ? violMap.get(sessionId) || 0 : 0;
    const escalationLevel = getEscalation(sessionId);
    const llm = makeLLMFromEnv(process.env);

    const { reply, intent, escalation } = await generateLLMReply({
      llm,
      message,
      pf,
      meta: { escalationLevel, nonPortfolioCount },
    });

    bump(sessionId, intent);

    res.json({
      answer: reply, // match frontend expectation
      intent,
      escalation,
      nonPortfolioCount: violMap.get(sessionId) || 0,
      adapter: process.env.ADAPTER || "gemini",
    });
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
        pass: process.env.GMAIL_PASS, // Gmail App Password (not your normal password)
      },
    });

    // 4) Compose email
    const mailOptions = {
      from: process.env.GMAIL_USER, // use your authenticated sender
      to: process.env.GMAIL_USER, // receiver is site owner (you)
      replyTo: `${name} <${email}>`, // user shows up in Reply
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
    `[backend] listening on http://0.0.0.0:${PORT} using ${(process.env.ADAPTER || "gemini")
      .toUpperCase()} adapter`
  );
  console.log(
    `Allowed origins: ${allowedOrigins.join(", ") || "(none; using defaults)"}`
  );
});
