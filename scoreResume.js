import dotenv from "dotenv";
import fetch from "node-fetch"; // use `npm install node-fetch`
dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function callOpenAI(prompt) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "gpt-4", // or "gpt-3.5-turbo"
            messages: [
                { role: "system", content: "You are a helpful AI resume screener." },
                { role: "user", content: prompt },
            ],
            temperature: 0.2,
        }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error?.message || "OpenAI API error");
    }

    return data.choices[0].message.content;
}
