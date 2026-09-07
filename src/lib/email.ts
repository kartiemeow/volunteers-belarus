import { createHash, timingSafeEqual } from "crypto";
import nodemailer from "nodemailer";

export const CODE_LENGTH = 6;
export const CODE_TTL_MS = 10 * 60 * 1000;
export const RESEND_COOLDOWN_MS = 60 * 1000;
export const MAX_ATTEMPTS = 5;

export function generateVerificationCode(): string {
  const min = Math.pow(10, CODE_LENGTH - 1);
  const max = min * 10;
  return String(Math.floor(min + Math.random() * (max - min)));
}

export function hashVerificationCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

export function codesEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function senderName(): string {
  return process.env.MAIL_FROM_NAME ?? "Волонтёры Беларуси";
}

const SMTP_IP_FALLBACKS = ["142.251.127.109"];

function isIpLike(host: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
}

async function sendViaSmtp(to: string, subject: string, html: string): Promise<void> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const fromEmail = process.env.MAIL_FROM_EMAIL;
  if (!host || !user || !pass || !fromEmail) {
    console.error("[email] Для отправки SMTP нужны SMTP_HOST, SMTP_USER, SMTP_PASS, MAIL_FROM_EMAIL");
    throw new Error("EMAIL_NOT_CONFIGURED");
  }

  const port = Number(process.env.SMTP_PORT ?? 465);
  const secure = String(process.env.SMTP_SECURE ?? "true") !== "false";

  const mail = {
    from: `"${senderName()}" <${fromEmail}>`,
    to,
    subject,
    html,
  };

  for (const candidate of [host, ...SMTP_IP_FALLBACKS]) {
    try {
      const transporter = nodemailer.createTransport({
        host: candidate,
        port,
        secure,
        auth: { user, pass },
        tls: isIpLike(candidate) ? { servername: host } : undefined,
      });
      await transporter.sendMail(mail);
      return;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/Invalid login|Username and Password|5\.7\.8|5\.3\.4|Application-specific/i.test(msg)) throw err;
      console.error(`[email] Не удалось через ${candidate}: ${msg}`);
    }
  }
  throw new Error("EMAIL_SEND_FAILED");
}

async function sendViaBrevo(to: string, subject: string, html: string): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.MAIL_FROM_EMAIL;
  if (!apiKey || !fromEmail) {
    console.error("[email] Для отправки через Brevo нужны BREVO_API_KEY и MAIL_FROM_EMAIL");
    throw new Error("EMAIL_NOT_CONFIGURED");
  }

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: { email: fromEmail, name: senderName() },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[email] Ошибка отправки (Brevo):", res.status, text);
    throw new Error("EMAIL_SEND_FAILED");
  }
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    await sendViaSmtp(to, subject, html);
    return;
  }
  if (process.env.BREVO_API_KEY) {
    await sendViaBrevo(to, subject, html);
    return;
  }
  console.error(
    "[email] Отправка не настроена: укажите SMTP (SMTP_HOST/SMTP_USER/SMTP_PASS) " +
    "или BREVO_API_KEY. Письмо не доставлено получателю " + to
  );
  throw new Error("EMAIL_NOT_CONFIGURED");
}

export async function sendVerificationEmail(to: string, code: string): Promise<void> {
  const siteUrl = process.env.NEXTAUTH_URL ?? "https://volunteers-belarus.vercel.app";
  console.info(`[email] Код подтверждения для ${to}: ${code} (отладочная информация)`);

  await sendEmail(
    to,
    "Код подтверждения — Волонтёры Беларуси",
    `<div style="font-family:Arial,'Segoe UI',sans-serif;background:#f6f7f9;padding:24px;">
      <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;border:1px solid #e5e7eb;">
        <h2 style="margin:0 0 12px;color:#111827;font-size:20px;">Волонтёры Беларуси</h2>
        <p style="margin:0 0 8px;color:#374151;font-size:15px;line-height:1.5;">
          Здравствуйте! Для подтверждения почты введите код:
        </p>
        <div style="margin:20px 0;text-align:center;">
          <span style="display:inline-block;font-size:32px;font-weight:bold;letter-spacing:8px;color:#059669;background:#ecfdf5;border-radius:10px;padding:12px 20px;">${code}</span>
        </div>
        <p style="margin:0 0 4px;color:#6b7280;font-size:13px;line-height:1.5;">
          Код действует 10 минут. Введите его на странице подтверждения, чтобы завершить регистрацию.
        </p>
        <p style="margin:16px 0 0;color:#9ca3af;font-size:12px;line-height:1.5;">
          Если вы не регистрировались на платформе — просто проигнорируйте это письмо.<br/>
          <a href="${siteUrl}" style="color:#059669;">${siteUrl}</a>
        </p>
      </div>
    </div>`
  );
}