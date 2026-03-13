import { getRuntimeConfig } from '@/lib/runtime-config';
import { decryptSecret } from '@/lib/secret-crypto';

type EmailPayload = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

function extractEmailAddress(value: string): string {
  const trimmed = value.trim();
  const angleMatch = trimmed.match(/<([^>]+)>/);
  return (angleMatch?.[1] || trimmed).replace(/^"|"$/g, '').trim();
}

function buildFromAddress(appName: string, sourceAddress: string): string {
  const email = extractEmailAddress(sourceAddress);
  return `${appName} <${email}>`;
}

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const runtime = await getRuntimeConfig();
  const host = runtime.smtpHost || process.env.SMTP_HOST;
  const port = Number(runtime.smtpPort || process.env.SMTP_PORT || 587);
  const user = runtime.smtpUser || process.env.SMTP_USER;
  const pass = decryptSecret(runtime.smtpPass || process.env.SMTP_PASS || '');
  const appName = runtime.appName || process.env.NEXT_PUBLIC_APP_NAME || 'Atelier Informatique';
  const fromSource = runtime.smtpFrom || process.env.SMTP_FROM || user;
  const from = fromSource ? buildFromAddress(appName, fromSource) : undefined;

  if (!host || !user || !pass || !from) {
    console.warn('[Email] SMTP non configuré, e-mail non envoyé', {
      to: payload.to,
      subject: payload.subject,
    });
    return false;
  }

  try {
    const nodemailer = await import('nodemailer');
    const secure = String(runtime.smtpSecure || process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465;

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });

    await transporter.sendMail({
      from,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html || payload.text,
    });

    return true;
  } catch (error) {
    console.error('[Email] Erreur envoi e-mail:', error);
    return false;
  }
}
