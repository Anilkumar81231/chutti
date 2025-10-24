# 🚀 Portfolio Backend

This is the backend service for the **Portfolio AI Chat & Contact System** — built using **Node.js**, **Express**, and **Nodemailer**.  
It powers the intelligent chat assistant and the contact form on the frontend site.

---

## 🧩 Features

- 💬 AI chat endpoint using your LLM adapter (Gemini / OpenAI / etc.)
- 📬 Contact form email service via Gmail (Nodemailer)
- 🧠 Smart small-talk and escalation logic
- 🩺 Health check endpoint (`/api/health`)
- 🔒 CORS configuration for secure frontend connections
- 🌍 Ready for local and production deployment (localhost or any hosting URL)

---

## ⚙️ Tech Stack

| Component | Description |
|------------|-------------|
| **Runtime** | Node.js (ES Modules) |
| **Framework** | Express.js |
| **Email** | Nodemailer (Gmail App Password) |
| **Env Config** | dotenv |
| **AI Adapter** | Google Gemini / LLM (via `makeLLMFromEnv`) |
| **Security** | CORS |
| **Hosting** | Any Node-compatible service (Render, Railway, Vercel, etc.) |

---

## 📂 Project Structure

