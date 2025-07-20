import React, { useState } from "react";
import { scoreResume } from "../utils/scoreResume";

// Example usage inside an async function
const handleScoring = async () => {
    const result = await scoreResume(resumeText, jobData, experience);
    console.log(result); // { skillScore, experienceScore, overallScore }
};

// Basic anonymizer function
function anonymizeResume(text) {
    let anonymized = text;
    anonymized = anonymized.replace(/\b([A-Z][a-z]+)\b/g, "[REDACTED]");
    anonymized = anonymized.replace(/\b(Male|Female|He|She|His|Her)\b/gi, "[REDACTED]");
    anonymized = anonymized.replace(/\b[\w.-]+@[\w.-]+\.\w{2,4}\b/g, "[REDACTED]");
    anonymized = anonymized.replace(/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, "[REDACTED]");
    return anonymized;
}

// Mock AI scoring function
function scoreResume(text) {
    // Dummy logic: count "skill" occurrences and length as score
    const skillMatch = (text.match(/skill/gi) || []).length;
    const experienceScore = Math.min(text.length / 100, 10); // capped at 10
    return {
        skillMatchScore: skillMatch,
        experienceScore: experienceScore.toFixed(1),
        totalScore: (skillMatch + experienceScore).toFixed(1),
    };
}

export default function UploadResume({ onBack, onResults }) {
    const [rawText, setRawText] = useState("");
    const [error, setError] = useState("");

    function handleProcess() {
        if (!rawText.trim()) {
            setError("Please paste resume text.");
            return;
        }
        setError("");

        const anonymizedText = anonymizeResume(rawText);
        const scores = scoreResume(anonymizedText);

        const processed = [{
            id: Date.now(),
            originalText: rawText,
            anonymizedText,
            scores,
            flaggedBias: false, // default false, you can extend this
        }];

        onResults(processed);
    }

    return (
        <div style={{ padding: "2rem" }}>
            <button onClick={onBack}>Back</button>
            <h2>Paste Resume Text</h2>
            <textarea
                rows={10}
                cols={70}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste resume text here"
            />
            <br />
            {error && <div style={{ color: "red" }}>{error}</div>}
            <button onClick={handleProcess} style={{ marginTop: "1rem" }}>
                Process Resume
            </button>
        </div>
    );
}
