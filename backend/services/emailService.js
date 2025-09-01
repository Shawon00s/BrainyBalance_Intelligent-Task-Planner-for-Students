import nodemailer from 'nodemailer';

const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
};

export async function sendEmail({ to, subject, html, text }) {
    try {
        const transporter = createTransporter();
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to,
            subject,
            text,
            html,
        });
        console.log('sendEmail - Message sent:', info.messageId);
        return info;
    } catch (error) {
        console.error('sendEmail - Error sending email:', error);
        throw error;
    }
}
