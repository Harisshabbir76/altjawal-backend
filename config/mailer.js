const nodemailer = require('nodemailer');

function getSenderEmail() {
  return (
    process.env.BUSINESS_EMAIL ||
    process.env.EMAIL_USER ||
    process.env.ADMIN_EMAIL ||
    process.env.admin_email
  );
}

function buildTransporter() {
  const adminEmail = getSenderEmail();
  const adminPassword =
    process.env.EMAIL_PASS ||
    process.env.ADMIN_PASSWORD ||
    process.env.password;
  const smtpService = process.env.SMTP_SERVICE || 'gmail';
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpSecure = String(process.env.SMTP_SECURE || 'false') === 'true';

  if (!adminEmail || !adminPassword) {
    throw new Error(
      'Email credentials (BUSINESS_EMAIL/EMAIL_USER and EMAIL_PASS) are required'
    );
  }

  const timeouts = {
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  };

  if (smtpHost) {
    return nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: { user: adminEmail, pass: adminPassword },
      ...timeouts,
    });
  }

  return nodemailer.createTransport({
    service: smtpService,
    auth: { user: adminEmail, pass: adminPassword },
    ...timeouts,
  });
}

function buildOtpEmailHtml(otp) {
  return `
    <div style="margin:0;padding:16px;background:#fffdf7;color:#3a2d26;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #eadfd6;">
        <div style="padding:32px 20px;text-align:center;background:#2b170f;color:#fffdf7;">
          <div style="font-family:Georgia,serif;font-size:26px;line-height:1.15;">Password Reset</div>
          <div style="margin-top:12px;font-family:Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;">Philosophy Account</div>
        </div>
        <div style="padding:28px 24px;text-align:center;">
          <p style="margin:0 0 18px;font-family:Arial,sans-serif;font-size:13px;line-height:1.6;color:#3a2d26;">
            Use the verification code below to reset your password. This code expires in 10 minutes.
          </p>
          <div style="display:inline-block;padding:16px 28px;background:#fffdf7;border:1px solid #e7ded6;font-family:Georgia,serif;font-size:34px;letter-spacing:10px;color:#2b170f;">${otp}</div>
          <p style="margin:22px 0 0;font-family:Arial,sans-serif;font-size:12px;line-height:1.6;color:#7a6a60;">
            If you did not request a password reset, you can safely ignore this email.
          </p>
        </div>
      </div>
    </div>
  `;
}

async function sendOtpEmail(toEmail, otp) {
  const senderEmail = getSenderEmail();
  const transporter = buildTransporter();

  await transporter.sendMail({
    from: `"Philosophy" <${senderEmail}>`,
    to: toEmail,
    subject: 'Your password reset code',
    html: buildOtpEmailHtml(otp),
    text: `Your Philosophy password reset code is ${otp}. It expires in 10 minutes.`,
  });
}

const defaultTransporter = buildTransporter();

module.exports = defaultTransporter;
module.exports.buildTransporter = buildTransporter;
module.exports.sendOtpEmail = sendOtpEmail;
module.exports.getSenderEmail = getSenderEmail;
