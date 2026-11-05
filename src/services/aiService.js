
import Groq from "groq-sdk";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

const generateAIResponse = async (message, context = "") => {
    try {
        if (!process.env.GROQ_API_KEY) {
            throw new Error("GROQ_API_KEY is missing");
        }

        const completion = await groq.chat.completions.create({
            model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",

            messages: [
                {
                    role: "system",
                    content: `
                        You are TaskFlow AI, an intelligent project
                        management assistant.

                        Help users with:
                        - Project management
                        - Task management
                        - Productivity improvement
                        - Task descriptions
                        - Priority suggestions
                        - Project progress analysis

                        Give clear, professional and actionable answers.

                        Never invent project statistics.
                        Use only supplied workspace context when
                        answering questions about actual projects.

                        Workspace context:
                        ${context || "No workspace context provided."}
                    `,
                },
                {
                    role: "user",
                    content: message,
                },
            ],

            temperature: 0.7,
            max_tokens: 1000,
        });

        const reply = completion.choices[0]?.message?.content;

        if (!reply) {
            throw new Error("Groq returned an empty response");
        }

        return reply;

    } catch (error) {
        console.error("TaskFlow Groq AI Error:", {
            message: error.message,
            status: error.status,
        });

        throw error;
    }
};

export default generateAIResponse;
