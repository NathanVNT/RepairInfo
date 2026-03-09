type EmailPayload = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;

  if (!host || !user || !pass || !from) {
    console.warn('[Email] SMTP non configuré, e-mail non envoyé', {
      to: payload.to,
      subject: payload.subject,
    });
    return false;
  }

  try {
    const nodemailer = await import('nodemailer');
    const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465;

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
