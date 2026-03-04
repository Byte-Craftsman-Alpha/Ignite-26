import nodemailer from 'nodemailer';

function readSmtpConfig() {
  const host = (process.env.SMTP_HOST || '').trim();
  const port = Number(process.env.SMTP_PORT || 587);
  const user = (process.env.SMTP_USER || '').trim();
  const pass = String(process.env.SMTP_PASS || '').replace(/\s+/g, '');
  const from = (process.env.SMTP_FROM || user || '').trim();

  if (!host || !port || !user || !pass || !from) {
    return null;
  }

  return {
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    from,
  };
}

let cachedTransport = null;
let cachedFrom = null;

function getTransport() {
  if (cachedTransport && cachedFrom) {
    return { transport: cachedTransport, from: cachedFrom };
  }

  const config = readSmtpConfig();
  if (!config) {
    throw new Error('SMTP is not configured. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM.');
  }

  cachedFrom = config.from;
  cachedTransport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });

  return { transport: cachedTransport, from: cachedFrom };
}

export async function sendOtpEmail(email, otp) {
  const { transport, from } = getTransport();

  await transport.sendMail({
    from,
    to: email,
    subject: "Ignite'26 Registration OTP Verification",
    text:
      `Your OTP for Ignite'26 registration is: ${otp}\n\n` +
      'This OTP expires in 10 minutes.\n\n' +
      'If you do not see this email in Inbox, check Spam and Promotions folders.\n',
    html:
      `<p>Your OTP for <strong>Ignite'26 registration</strong> is:</p>` +
      `<p style="font-size:24px;font-weight:700;letter-spacing:4px;">${otp}</p>` +
      `<p>This OTP expires in <strong>10 minutes</strong>.</p>` +
      `<p>If you do not see this email in Inbox, please check your <strong>Spam</strong> and <strong>Promotions</strong> folders.</p>`,
  });
}

export async function sendRegistrationConfirmationEmail(participant) {
  const { transport, from } = getTransport();

  await transport.sendMail({
    from,
    to: participant.email,
    subject: "Ignite'26 Registration Confirmed",
    text:
      `Hi ${participant.full_name},\n\n` +
      "Your registration for Ignite'26 has been completed successfully.\n\n" +
      `Roll Number: ${participant.roll_number}\n` +
      `Branch: ${participant.branch}\n` +
      `Year: ${participant.year}\n` +
      `Payment ID: ${participant.payment_id}\n` +
      `WhatsApp: ${participant.whatsapp_number}\n\n` +
      'Please keep this email for your records. If this email lands outside inbox, check Spam/Promotions folders.',
    html:
      `<p>Hi <strong>${participant.full_name}</strong>,</p>` +
      `<p>Your registration for <strong>Ignite'26</strong> is completed successfully.</p>` +
      `<ul>` +
      `<li>Roll Number: ${participant.roll_number}</li>` +
      `<li>Branch: ${participant.branch}</li>` +
      `<li>Year: ${participant.year}</li>` +
      `<li>Payment ID: ${participant.payment_id}</li>` +
      `<li>WhatsApp: ${participant.whatsapp_number}</li>` +
      `</ul>` +
      `<p>Please keep this email for your records. If not in inbox, check <strong>Spam</strong> and <strong>Promotions</strong>.</p>`,
  });
}
