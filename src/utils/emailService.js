
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async ({ to, subject, html }) => {
    try {
        const apiKey = process.env.RESEND_API_KEY?.trim();
        const emailFrom = process.env.EMAIL_FROM?.trim();

        if (!apiKey) {
            throw new Error("RESEND_API_KEY is missing");
        }

        if (!emailFrom) {
            throw new Error("EMAIL_FROM is missing");
        }

        const { data, error } = await resend.emails.send({
            from: `TaskFlow <${emailFrom}>`,
            to,
            subject,
            html,
        });

        if (error) {
            console.error("Resend email error:", error);
            throw new Error(error.message || "Failed to send email");
        }

        console.log("Email sent successfully:", data.id);

        return data;

    } catch (error) {
        console.error("Email sending failed:", {
            message: error.message,
            code: error.code,
        });

        throw error;
    }
};

export default sendEmail;
