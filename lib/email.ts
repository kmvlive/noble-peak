import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@magazin-tour.ru";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn("SMTP not configured. Email sending is disabled.");
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  return transporter;
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const t = getTransporter();
  if (!t) {
    console.warn(
      `Email not sent (SMTP not configured): ${options.subject} -> ${options.to}`
    );
    return false;
  }

  try {
    await t.sendMail({
      from: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}
