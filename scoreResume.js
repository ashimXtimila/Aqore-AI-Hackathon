import { callOpenAI } from "./openai.js"; // You must implement this
import { redactSensitiveInfo } from "./utils.js"; // optional anonymization

export async function scoreResume(resumeText, job, candidateExp) {
    if (!resumeText || !job?.skills || job.skills.length === 0) {
        return {
            skillScore: 0,
            experienceScore: 0,
            overallScore: 0,
            biasFlags: ["Invalid input"],
            anonymizedResumeText: "[Invalid resume]",
        };
    }

    const prompt = `
.

Job Requirements:
- Required Skills: ${job.skills.join(", ")}
- Required Years of Experience: ${job.yearsExperience || "Not specified"}

Candidate Resume:
"""
${resumeText}
"""

Candidate claims ${candidateExp} years of experience.


`;

    let aiResult = {
        skillScore: 0,
        experienceScore: 0,
        biasFlags: ["Failed to analyze"],
    };

    try {
        const response = await callOpenAI(prompt); // Sends prompt to GPT
        const json = JSON.parse(response);

        aiResult = {
            skillScore: json.skillScore ?? 0,
            experienceScore: json.experienceScore ?? 0,
            biasFlags: json.biasFlags ?? [],
        };
    } catch (err) {
        console.error("AI resume scoring failed:", err);
        aiResult.biasFlags = ["AI scoring failed"];
    }

    return {
        ...aiResult,
        overallScore: Math.round(aiResult.skillScore * 0.7 + aiResult.experienceScore * 0.3),
        anonymizedResumeText: redactSensitiveInfo(resumeText),
    };
}
