// Email delivery. Configure ONE of:
//   SMTP:   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS  (Office 365 / Gmail app password / any SMTP)
//   Resend: RESEND_API_KEY                              (https://resend.com, simple HTTP API)
// plus MAIL_FROM, e.g. "HR Portal <no-reply@yourcompany.com>".
// If neither is configured the app runs in DEMO MODE: the OTP is shown on screen
// instead of emailed (useful for an internal showcase). Never leave demo mode on in production.
import nodemailer from "nodemailer";

export const mailConfigured = () => Boolean(process.env.SMTP_HOST || process.env.RESEND_API_KEY);
export const demoMode = () => !mailConfigured() || process.env.DEMO_MODE === "1";

const FROM = () => process.env.MAIL_FROM || "Apex Global Search <no-reply@example.com>";

export async function sendMail({ to, subject, text, html }) {
  if (process.env.RESEND_API_KEY) {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ from: FROM(), to: [to], subject, text, html }),
    });
    if (!r.ok) throw new Error(`Resend error ${r.status}: ${await r.text()}`);
    return;
  }
  if (process.env.SMTP_HOST) {
    const port = Number(process.env.SMTP_PORT || 587);
    const t = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await t.sendMail({ from: FROM(), to, subject, text, html });
    return;
  }
  console.log(`[DEMO MAIL] to=${to} subject=${subject}\n${text}`);
}

export function otpEmail(otp, purpose, minutes) {
  const what = purpose === "reset" ? "reset your HR Admin password" : "verify your email for HR Admin sign-up";
  const text = `Your one-time code is ${otp}. Use it to ${what}. It expires in ${minutes} minutes. If you did not request this, ignore this email.`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:480px">
  <h2 style="color:#0b1b33;margin:0">Apex Global Search</h2><p style="color:#00a3a3;margin:2px 0 16px;font-weight:bold">HR Admin Portal</p>
  <p>Use this code to ${what}:</p>
  <p style="font-size:32px;letter-spacing:8px;font-weight:bold;margin:16px 0">${otp}</p>
  <p style="color:#555">It expires in ${minutes} minutes. If you did not request this, you can ignore this email.</p></div>`;
  return { subject: `${otp} is your Apex Global Search verification code`, text, html };
}
