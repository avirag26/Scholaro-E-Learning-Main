import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();
if (!process.env.EMAIL_USERNAME || !process.env.EMAIL_PASSWORD) {
  throw new Error("Missing email credentials in .env file");
}
const transporter = nodemailer.createTransport({
  service: 'gmail', 
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});
const sendOtpEmail = async (to, otp) => {
  try {
    const mailOptions = {
      from: `"Scholaro" <${process.env.EMAIL_USERNAME}>`,
      to,
      subject: 'Your OTP for Scholaro Verification',
      html: `<p>Your One-Time Password is: <b>${otp}</b>. It will expire in 10 minutes.</p>`,
    };
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw error; 
  }
};
const sendPasswordResetEmail = async (to, resetToken, userType = 'user') => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetURL = `${frontendUrl}/${userType}/reset-password/${resetToken}`;
    const mailOptions = {
      from: `"Scholaro" <${process.env.EMAIL_USERNAME}>`,
      to,
      subject: 'Password Reset Request - Scholaro',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #0ea5e9; margin: 0;">Scholaro</h1>
          </div>
          <h2 style="color: #333; margin-bottom: 20px;">Password Reset Request</h2>
          <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
            You requested a password reset for your Scholaro account. Click the button below to reset your password:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetURL}" 
               style="display: inline-block; 
                      padding: 15px 30px; 
                      background-color: #0ea5e9; 
                      color: white; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      font-weight: bold;
                      font-size: 16px;">
              Reset My Password
            </a>
          </div>
          <p style="color: #555; line-height: 1.6; margin-bottom: 10px;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <div style="background-color: #f8f9fa; 
                      padding: 15px; 
                      border-radius: 4px; 
                      margin: 20px 0;
                      border-left: 4px solid #0ea5e9;">
            <a href="${resetURL}" style="color: #0ea5e9; word-break: break-all;">${resetURL}</a>
          </div>
          <div style="background-color: #fff3cd; 
                      border: 1px solid #ffeaa7; 
                      border-radius: 4px; 
                      padding: 15px; 
                      margin: 20px 0;">
            <p style="margin: 0; color: #856404;">
              <strong>?? Important:</strong> This link will expire in 10 minutes for security reasons.
            </p>
          </div>
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
          </p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
            This is an automated message from Scholaro. Please do not reply to this email.
          </p>
        </div>
      `,
    };
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw error;
  }
};

const sendContact = async (to,subject,html) => {
  try {
    const mailOptions = {
      from: `"Scholaro" <${process.env.EMAIL_USERNAME}>`,
      to,
      subject,
      html,
    };
    console.log("email to ",to)
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw error; 
  }
};

export {sendOtpEmail , sendPasswordResetEmail, sendContact};
