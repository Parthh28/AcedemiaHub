// src/services/emailService.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendOTP(email, otp) {
  // Useful for local development and testing
  console.log(`\n============================`);
  console.log(`🔑 OTP for ${email}: ${otp}`);
  console.log(`📡 Sending via HOST: ${process.env.SMTP_HOST}`);
  console.log(`============================\n`);

  const mailOptions = {
    from: process.env.SMTP_FROM || '"Acedemia Hub" <noreply@acedemiahub.com>',
    to: email,
    subject: 'Your Acedemia Hub Verification Code',
    text: `Your verification code is: ${otp}\nIt is valid for 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Verify Your Email</h2>
        <p>Thank you for signing up for Acedemia Hub! Use the following code to verify your email address:</p>
        <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
          ${otp}
        </div>
        <p>This code is valid for 10 minutes. If you didn't request this, please ignore this email.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send verification email');
  }
}

async function sendPasswordResetEmail(email, resetLink) {
  // Useful for local development and testing
  console.log(`\n============================`);
  console.log(`🔗 Password Reset Link for ${email}:\n${resetLink}`);
  console.log(`📡 Sending via HOST: ${process.env.SMTP_HOST}`);
  console.log(`============================\n`);

  const mailOptions = {
    from: process.env.SMTP_FROM || '"Acedemia Hub" <noreply@acedemiahub.com>',
    to: email,
    subject: 'Reset your Acedemia Hub Password',
    text: `You requested a password reset. Click this link to reset your password: ${resetLink}\nThis link is valid for 1 hour.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>We received a request to reset your password for Acedemia Hub. If you didn't make this request, you can safely ignore this email.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #3525cd; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Reset Password</a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666; font-size: 14px;">${resetLink}</p>
        <p>This link is valid for 1 hour.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
}

async function sendPurchaseReceipt(email, buyerName, purchaseId, purchasedAt, items, totalAmount) {
  // Useful for local development and testing
  console.log(`\n============================`);
  console.log(`🧾 Sending Purchase Bill to ${email} for transaction ${purchaseId}`);
  console.log(`📡 Sending via HOST: ${process.env.SMTP_HOST}`);
  console.log(`============================\n`);

  const itemsHtml = items.map(item => `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 12px 8px; font-size: 14px; color: #333;">${item.title}</td>
      <td style="padding: 12px 8px; font-size: 14px; color: #666;">${item.sellerName || 'Contributor'}</td>
      <td style="padding: 12px 8px; font-size: 14px; text-align: right; color: #333; font-weight: bold;">${item.price > 0 ? `₹${item.price.toFixed(2)}` : 'FREE'}</td>
    </tr>
  `).join('');

  const mailOptions = {
    from: process.env.SMTP_FROM || '"Acedemia Hub" <noreply@acedemiahub.com>',
    to: email,
    subject: `Your Acedemia Hub Purchase Bill - Receipt #${purchaseId.slice(0, 8).toUpperCase()}`,
    text: `Thank you for your purchase! Receipt #${purchaseId}\nTotal: ₹${totalAmount.toFixed(2)}\nLog in to your account to download your study materials.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; padding: 24px; color: #333; background-color: #ffffff;">
        <div style="text-align: center; border-bottom: 2px solid #3525cd; padding-bottom: 16px; margin-bottom: 24px;">
          <h2 style="color: #3525cd; margin: 0; font-size: 24px;">Acedemia Hub</h2>
          <p style="color: #666; font-size: 12px; margin: 4px 0 0 0;">Secure Learning Material Marketplace</p>
        </div>
        
        <h3 style="margin-top: 0; font-size: 18px; color: #333;">Thank you for your purchase, ${buyerName}!</h3>
        <p style="font-size: 14px; color: #555; line-height: 1.5;">Your payment was processed successfully. You can now download and view your purchased materials under your <b>My Study Hub</b> dashboard.</p>
        
        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 16px; margin: 24px 0; font-size: 13px; line-height: 1.6; border: 1px solid #f0f0f0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="font-weight: bold; color: #666;">Receipt Number:</td>
              <td style="text-align: right; font-family: monospace; font-weight: bold; color: #333;">${purchaseId.toUpperCase()}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; color: #666;">Date of Purchase:</td>
              <td style="text-align: right; color: #333;">${new Date(purchasedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; color: #666;">Payment Status:</td>
              <td style="text-align: right; color: #2e7d32; font-weight: bold;">PAID</td>
            </tr>
          </table>
        </div>

        <h4 style="margin: 20px 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #666; border-bottom: 1px solid #eee; padding-bottom: 6px;">Order Details</h4>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <thead>
            <tr style="border-bottom: 2px solid #eee; text-align: left; font-size: 12px; color: #666; text-transform: uppercase;">
              <th style="padding: 8px; font-weight: bold;">Study Guide</th>
              <th style="padding: 8px; font-weight: bold;">Seller</th>
              <th style="padding: 8px; text-align: right; font-weight: bold;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
            <tr style="border-top: 2px solid #3525cd;">
              <td colspan="2" style="padding: 16px 8px 8px 8px; font-size: 16px; font-weight: bold; color: #333; text-align: right;">Total Amount:</td>
              <td style="padding: 16px 8px 8px 8px; font-size: 16px; font-weight: bold; color: #3525cd; text-align: right;">₹${totalAmount.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <div style="text-align: center; margin: 32px 0 16px 0;">
          <a href="http://localhost:5500/buyer-dashboard.html" style="background-color: #3525cd; color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; box-shadow: 0 4px 6px rgba(53,37,205,0.2);">Go to Study Hub</a>
        </div>

        <div style="text-align: center; border-top: 1px solid #eee; padding-top: 16px; font-size: 11px; color: #999; margin-top: 32px;">
          <p style="margin: 0 0 4px 0;">For support or inquiries, reply to this email or contact support@acedemiahub.com</p>
          <p style="margin: 0;">© 2026 AcademiaHub Marketplace. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Receipt email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Error sending purchase receipt email:', error);
  }
}

module.exports = {
  sendOTP,
  sendPasswordResetEmail,
  sendPurchaseReceipt,
};
