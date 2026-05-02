const nodemailer = require('nodemailer');

let transporter = null;

let testAccountPromise = null;
if (!process.env.SMTP_HOST) {
  // If no SMTP host is provided, automatically create a test account on Ethereal
  console.log('[Email] No SMTP config found. Generating Ethereal test account...');
  testAccountPromise = nodemailer.createTestAccount().then(account => {
    transporter = nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: {
          user: account.user,
          pass: account.pass
      }
    });
    console.log('[Email] Ethereal account ready!');
  }).catch(err => {
    console.error('[Email] Failed to create Ethereal account', err);
  });
} else {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

/**
 * Send an email with HTML content.
 */
async function sendEmail({ to, subject, html }) {
  if (testAccountPromise) await testAccountPromise;
  
  if (!transporter) {
    throw new Error('Email transporter is not initialized');
  }

  const mailOptions = {
    from: process.env.SMTP_FROM || '"EmPay HRMS" <noreply@empay.local>',
    to,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email] Message sent to ${to}: ${info.messageId}`);
    if (!process.env.SMTP_HOST) {
      console.log(`[Email] Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
    return info;
  } catch (error) {
    console.error('[Email] Error sending email', error);
    throw error;
  }
}

/**
 * Send welcome credentials to a newly created employee/user
 */
async function sendWelcomeEmail(user, loginId, tempPassword) {
  const html = `
    <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #4f46e5; color: white; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">Welcome to EmPay HRMS!</h1>
      </div>
      <div style="padding: 24px; background-color: #ffffff;">
        <p>Hi ${user.name},</p>
        <p>Your account has been created successfully. Below are your login credentials:</p>
        
        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 6px; margin: 24px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Company:</strong> ${user.companyName}</p>
          <p style="margin: 0 0 8px 0;"><strong>Login ID:</strong> ${loginId}</p>
          <p style="margin: 0 0 8px 0;"><strong>Email:</strong> ${user.email}</p>
          <p style="margin: 0 0 8px 0;"><strong>Temporary Password:</strong> <code style="background: #e5e7eb; padding: 2px 6px; border-radius: 4px;">${tempPassword}</code></p>
        </div>
        
        <p style="color: #4b5563; font-size: 14px;"><em>Note: You will be required to change your password upon your first login.</em></p>
        
        <div style="text-align: center; margin-top: 32px;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:5174'}/login" style="background-color: #4f46e5; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">Login to EmPay</a>
        </div>
      </div>
    </div>
  `;
  return sendEmail({ to: user.email, subject: 'Your EmPay Account Credentials', html });
}

module.exports = {
  sendEmail,
  sendWelcomeEmail
};
