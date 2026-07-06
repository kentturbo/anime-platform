import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export const sendVerificationEmail = async (email, code) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Verify Your Anime Platform Account',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Anime Platform!</h1>
        </div>
        <div style="background: white; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          <p style="font-size: 16px; color: #333; margin-bottom: 30px;">Your verification code is:</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0066CC;">${code}</span>
          </div>
          <p style="font-size: 14px; color: #666;">This code will expire in 15 minutes.</p>
          <p style="font-size: 14px; color: #666; margin-top: 30px;">If you didn't request this code, please ignore this email.</p>
        </div>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};

export default transporter;
