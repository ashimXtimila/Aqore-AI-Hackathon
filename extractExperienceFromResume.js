// src/utils/extractExperienceFromResume.js

import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true, // Only for development
});

export async function extractYearsOfExperience(resumeText) {
    try {
        const prompt = `Extract the total years of professional experience from the following resume text. Respond with just a number.\n\n${resumeText.substring(0, 4000)}`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "user",
                    content: prompt,
                },
            ],
        });

        const answer = completion.choices[0].message.content.trim();
        const years = parseFloat(answer.match(/\d+(\.\d+)?/));

        return isNaN(years) ? 0 : years;
    } catch (error) {
        console.error("AI extraction error:", error);
        return 0;
    }
}
