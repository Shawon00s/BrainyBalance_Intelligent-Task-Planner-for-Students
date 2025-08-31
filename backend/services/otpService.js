import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

// OTP Configuration
const OTP_LENGTH = process.env.OTP_LENGTH || 6;
const OTP_EXPIRY_MINUTES = process.env.OTP_EXP_MIN || 10;

// Create email transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
};

/**
 * Generate a random OTP and expiry time
 */
export function generateOtp() {
    const otp = Math.floor(Math.random() * Math.pow(10, OTP_LENGTH))
        .toString()
        .padStart(OTP_LENGTH, '0');

    const expires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    return { otp, expires };
}

/**
 * Hash an OTP for secure storage
 */
export async function hashOtp(otp) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(otp, salt);
}

/**
 * Verify an OTP against its hash
 */
export async function verifyOtpHash(otp, hash) {
    return bcrypt.compare(otp, hash);
}

/**
 * Send OTP email to user
 */
export async function sendOtpEmail(email, otp) {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: 'BrainyBalance - Email Verification Code',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #6366f1;">Email Verification</h2>
                    <p>Thank you for registering with BrainyBalance!</p>
                    <p>Your verification code is:</p>
                    <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
                        <h1 style="color: #6366f1; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
                    </div>
                    <p>This code will expire in ${OTP_EXPIRY_MINUTES} minutes.</p>
                    <p>If you didn't request this code, please ignore this email.</p>
                    <hr style="margin: 30px 0;">
                    <p style="color: #6b7280; font-size: 14px;">
                        This is an automated message from BrainyBalance. Please do not reply to this email.
                    </p>
                </div>
            `
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('OTP email sent successfully:', result.messageId);
        return result;
    } catch (error) {
        console.error('Failed to send OTP email:', error);
        throw error;
    }
}
