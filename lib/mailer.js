import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

/**
 * Send an email via Gmail SMTP.
 * @param {{ to: string, subject: string, html: string, replyTo?: string, attachments?: Array }} options
 */
export async function sendEmail({ to, subject, html, replyTo, attachments }) {
  const from = process.env.GMAIL_USER;
  if (!from || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error("Gmail SMTP not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD.");
  }
  return transporter.sendMail({ from, replyTo, to, subject, html, attachments });
}
