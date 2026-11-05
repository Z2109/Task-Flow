
import Groq from "groq-sdk";
import "dotenv/config";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

try {
    const models = await groq.models.list();

    console.log("\nAVAILABLE GROQ MODELS:\n");

    models.data
        .filter((model) => model.active !== false)
        .forEach((model) => {
            console.log(model.id);
        });

} catch (error) {
    console.error("Unable to fetch models:", error.message);
}
