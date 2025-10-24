

// // server.js - Simple Mail Sending Server
// require("dotenv").config();
// const express = require("express");
// const nodemailer = require("nodemailer");
// const cors = require("cors");

// const app = express();
// const PORT = process.env.PORT || 4000;

// // Middlewares
// app.use(cors());
// app.use(express.json());

// /* ------------------ Contact route ------------------ */
// /**
//  * Handles incoming POST requests to send an email.
//  * Requires name, email, subject, and message in the request body.
//  */
// app.post("/api/send", async (req, res) => {
//   const { name, email, subject, message } = req.body;

//   // 1. Input validation
//   if (!name || !email || !subject || !message) {
//     return res.status(400).json({ success: false, message: "All fields are required" });
//   }

//   // 2. Environment variable check (MANDATORY for nodemailer)
//   if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
//     console.error("ERROR: GMAIL_USER or GMAIL_PASS environment variables are not set. Check your .env file.");
//     return res.status(500).json({ success: false, message: "Server email configuration is missing." });
//   }

//   try {
//     // 3. Create a transporter object using Nodemailer
//     const transporter = nodemailer.createTransport({
//       service: "gmail",
//       auth: {
//         user: process.env.GMAIL_USER, // Your Gmail address (sender/recipient)
//         pass: process.env.GMAIL_PASS  // Your App Password for Gmail
//       }
//     });

//     // 4. Define mail options
//     const mailOptions = {
//       from: email,                      // Sender is the user filling out the form
//       to: process.env.GMAIL_USER,       // Recipient is the owner of the application
//       subject: `New Contact Form: ${subject}`,
//       text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\nMessage: ${message}`
//     };

//     // 5. Send the email
//     await transporter.sendMail(mailOptions);
//     res.json({ success: true, message: "Message sent successfully!" });
//   } catch (err) {
//     console.error("Error sending email:", err);
//     // Log the error for debugging and send a generic 500 status to the client
//     res.status(500).json({ success: false, message: "Error sending message" });
//   }
// });


// // Start the server
// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
//   console.log(`Contact route available at http://localhost:${PORT}/api/send`);
// });
