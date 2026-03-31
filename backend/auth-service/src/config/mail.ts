import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Mail Configuration (Powered by Nodemailer)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const transporter = (process.env.MAIL_USER && process.env.MAIL_PASS) 
    ? nodemailer.createTransport({
        service: process.env.MAIL_SERVICE || 'gmail',
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
        },
    })
    : null;

/**
 * Send a verification email with an OTP (Mocks in dev if no credentials)
 */
export async function sendVerificationEmail(
    to: string,
    emailOtp: string,
    elderName: string,
    relation: string
): Promise<{ success: boolean; error?: any }> {
    if (!transporter) {
        logger.warn('--- DEVELOPMENT MOCK EMAIL ---');
        logger.warn(`To: ${to}`);
        logger.warn(`Purpose: Family Verification for ${elderName} (${relation})`);
        logger.warn(`Code: ${emailOtp}`);
        logger.warn('------------------------------');
        return { success: true };
    }

    try {
        const mailOptions = {
            from: `"ElderGuardAI" <${process.env.MAIL_USER}>`,
            to,
            subject: 'ElderGuardAI - Family Verification Request',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #f97316; text-align: center;">Family Verification</h2>
                    <p>Hello,</p>
                    <p><strong>${elderName}</strong> has added you as their ${relation} on ElderGuardAI.</p>
                    <p>To complete their signup, please provide them with the following 6-digit verification code:</p>
                    <div style="background: #fdf2f2; padding: 20px; text-align: center; border-radius: 8px; margin: 25px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #ec4899;">${emailOtp}</span>
                    </div>
                    <p style="font-size: 14px; color: #666;">This code will expire in 10 minutes.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #999; text-align: center;">Helping you care for your loved ones, every step of the way. ❤️</p>
                </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        logger.info('Verification email sent successfully', { messageId: info.messageId, to });
        return { success: true };
    } catch (error) {
        logger.error('Failed to send verification email', { error, to });
        return { success: false, error };
    }
}

export default transporter;
