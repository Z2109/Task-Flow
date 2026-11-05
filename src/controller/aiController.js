import generateAIResponse from "../services/aiService.js";

export const chatWithAI = async (req, res, next) => {
    try {
        const { message } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: "Message is required",
            });
        }

        const reply = await generateAIResponse(message);

        return res.status(200).json({
            success: true,
            message: "AI response generated successfully",
            reply,
        });

    } catch (error) {
        next(error);
    }
};