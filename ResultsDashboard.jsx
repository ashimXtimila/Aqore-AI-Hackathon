import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// 🔹 Score one resume
function scoreResume(resumeText, job, candidateExp) {
    const resumeLower = resumeText.toLowerCase();
    const matchedSkills = job.skills.filter(skill =>
        resumeLower.includes(skill.toLowerCase())
    );
    const missingSkills = job.skills.filter(
        skill => !matchedSkills.includes(skill)
    );
    const skillMatchScore = Math.round((matchedSkills.length / job.skills.length) * 100);
    const expScore = Math.min(candidateExp, 10) * 10;

    const biasFlags = [];
    if (skillMatchScore < 50) biasFlags.push("Low skill match");
    if (candidateExp < 1) biasFlags.push("Less than 1 year experience");

    const anonymizedResumeText = resumeText.replace(
        /(Name|Email|Phone|Contact):?.*$/gim,
        "[redacted]"
    );

    const totalScore = Math.round(skillMatchScore * 0.7 + expScore * 0.3); // ✅ Updated here

    return {
        skillMatchScore,
        experienceScore: expScore,
        biasFlags,
        matchedSkills,
        missingSkills,
        anonymizedResumeText,
        totalScore,
    };
}

// 🔹 Generate CSV from scored results
function generateCSV(results) {
    const headers = [
        "Candidate",
        "Skill Match Score",
        "Experience Score",
        "Total Score",
        "Matched Skills",
        "Missing Skills",
        "Bias Flags",
    ];

    const rows = results.map((res, index) => [
        `Candidate #${index + 1}`,
        res.skillMatchScore,
        res.experienceScore,
        res.totalScore,
        res.matchedSkills.join("; "),
        res.missingSkills.join("; "),
        res.biasFlags.join("; "),
    ]);

    const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(","))
        .join("\n");

    return csvContent;
}

export default function ResultsDashboard() {
    const location = useLocation();
    const navigate = useNavigate();
    const { bulkResults } = location.state || {};
    const [scoredResults, setScoredResults] = useState([]);

    useEffect(() => {
        if (!bulkResults || !Array.isArray(bulkResults)) {
            navigate("/", { replace: true });
            return;
        }

        const allScored = bulkResults.map(({ resumeText, selectedJob, yearsOfExperience }) => {
            const scored = scoreResume(resumeText, selectedJob, yearsOfExperience);
            return scored;
        });

        const validSkillMatches = allScored.filter(res => res.skillMatchScore > 0);
        const zeroSkillMatches = allScored.filter(res => res.skillMatchScore === 0);

        validSkillMatches.sort((a, b) => b.totalScore - a.totalScore);

        const finalResults = [...validSkillMatches, ...zeroSkillMatches];

        setScoredResults(finalResults);
    }, [bulkResults, navigate]);

    function handleDownloadCSV() {
        const csv = generateCSV(scoredResults);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "screening_results.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    if (!bulkResults || !Array.isArray(bulkResults)) {
        return (
            <div className="container mt-5">
                <h3>Invalid data. Please go back and upload resumes.</h3>
                <button className="btn btn-primary mt-3" onClick={() => navigate("/")}>
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="container mt-5">
            <h1>Candidate Screening Results</h1>
            <div className="mb-3">
                <button className="btn btn-secondary" onClick={() => navigate("/")}>
                    ← Back to Upload
                </button>
                <button className="btn btn-success ms-2" onClick={handleDownloadCSV}>
                    ⬇️ Download CSV Report
                </button>
            </div>

            {scoredResults.length === 0 && <p>Calculating scores, please wait...</p>}

            {scoredResults.map((scores, idx) => (
                <div key={idx} className="card my-4 p-3 shadow-sm">
                    <h4>Candidate #{idx + 1}</h4>

                    <div>
                        <strong>Skill Match Score:</strong> {scores.skillMatchScore}%
                        <div className="progress" style={{ height: "20px" }}>
                            <div
                                className="progress-bar bg-success"
                                role="progressbar"
                                style={{ width: `${scores.skillMatchScore}%` }}
                                aria-valuenow={scores.skillMatchScore}
                                aria-valuemin="0"
                                aria-valuemax="100"
                            />
                        </div>
                    </div>

                    <div className="mt-2">
                        <strong>Experience Score:</strong> {scores.experienceScore}%
                        <div className="progress" style={{ height: "20px" }}>
                            <div
                                className="progress-bar bg-info"
                                role="progressbar"
                                style={{ width: `${scores.experienceScore}%` }}
                                aria-valuenow={scores.experienceScore}
                                aria-valuemin="0"
                                aria-valuemax="100"
                            />
                        </div>
                    </div>

                    <div className="mt-2">
                        <strong>Total Score:</strong> {scores.totalScore}%
                    </div>

                    <div className="mt-3">
                        <strong>Matched Skills:</strong>
                        {scores.matchedSkills.length > 0 ? (
                            <ul>
                                {scores.matchedSkills.map((skill, i) => (
                                    <li key={i} style={{ color: "green" }}>{skill}</li>
                                ))}
                            </ul>
                        ) : (
                            <p>No skills matched.</p>
                        )}
                    </div>

                    <div>
                        <strong>Missing Skills:</strong>
                        {scores.missingSkills.length > 0 ? (
                            <ul>
                                {scores.missingSkills.map((skill, i) => (
                                    <li key={i} style={{ color: "red" }}>{skill}</li>
                                ))}
                            </ul>
                        ) : (
                            <p>No missing skills.</p>
                        )}
                    </div>

                    <div>
                        <strong>Bias Flags:</strong>
                        {scores.biasFlags.length > 0 ? (
                            <ul>
                                {scores.biasFlags.map((flag, i) => (
                                    <li key={i} style={{ color: "red", fontWeight: "600" }}>{flag}</li>
                                ))}
                            </ul>
                        ) : (
                            <p>No bias flags detected.</p>
                        )}
                    </div>

                    <div className="mt-3">
                        <strong>Anonymized Resume Preview:</strong>
                        <pre
                            style={{
                                whiteSpace: "pre-wrap",
                                maxHeight: "200px",
                                overflowY: "auto",
                                backgroundColor: "#f8f9fa",
                                padding: "1rem",
                                borderRadius: "4px"
                            }}
                        >
                            {scores.anonymizedResumeText}
                        </pre>
                    </div>
                </div>
            ))}
        </div>
    );
}
async function callOpenAI(prompt) {
    // Example using fetch to your backend or directly to OpenAI API
    // return fetch('/api/ai-score', { method: 'POST', body: JSON.stringify({ prompt }) }) ...
    throw new Error("callOpenAI() not implemented");
}