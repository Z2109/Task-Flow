
import nodemailer from "nodemailer";

const sendEmail = async ({ to, subject, html }) => {
    try {
        const emailUser = process.env.EMAIL_USER?.trim();
        const emailPass = process.env.EMAIL_PASS?.trim();

        if (!emailUser || !emailPass) {
            throw new Error(
                "EMAIL_USER or EMAIL_PASS is missing"
            );
        }

        // Create the transporter when the email function is called.
        // This ensures it reads the current environment values.
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: emailUser,
                pass: emailPass,
            },
            tls: {
                rejectUnauthorized: true,
            },
        });

        console.log("SMTP username configured:", Boolean(emailUser));
        console.log("SMTP password configured:", Boolean(emailPass));

        await transporter.verify();

        const info = await transporter.sendMail({
            from: `"TaskFlow" <${emailUser}>`,
            to,
            subject,
            html,
        });

        console.log("Email sent successfully:", info.messageId);

        return info;
    } catch (error) {
        console.error("Email sending failed:", {
            message: error.message,
            code: error.code,
            command: error.command,
            responseCode: error.responseCode,
        });

        throw error;
    }
};

export default sendEmail;
