// src/components/LandingPage.jsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

// Helper function to read text files
function readTextFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(`Failed reading ${file.name}`);
        reader.readAsText(file);
    });
}

// Helper function to extract text from PDF
async function extractTextFromPDF(file) {
    try {
        // Ensure PDF.js is loaded and properly configured
        if (!window.pdfjsLib) {
            throw new Error("PDF.js not available");
        }

        console.log(`Starting PDF extraction for: ${file.name}`);

        const buffer = await file.arrayBuffer();
        console.log(`Buffer size: ${buffer.byteLength} bytes`);

        // Enhanced PDF loading with better error handling
        const loadingTask = window.pdfjsLib.getDocument({
            data: buffer,
            verbosity: 0, // Reduce console noise
            disableWorker: false,
            isEvalSupported: false,
            disableFontFace: false,
        });

        const pdf = await loadingTask.promise;
        console.log(`PDF loaded successfully. Pages: ${pdf.numPages}`);

        let allText = "";

        // Process pages sequentially to avoid overwhelming the browser
        for (let i = 1; i <= pdf.numPages; i++) {
            try {
                console.log(`Processing page ${i}/${pdf.numPages}`);
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();

                // Enhanced text extraction with better spacing
                const pageText = content.items
                    .map(item => {
                        // Add space handling for better text flow
                        let text = item.str;
                        if (item.hasEOL) {
                            text += '\n';
                        }
                        return text;
                    })
                    .join(' ')
                    .replace(/\s+/g, ' ') // Normalize whitespace
                    .trim();

                if (pageText) {
                    allText += pageText + '\n';
                }

                // Clean up page resources
                page.cleanup();
            } catch (pageError) {
                console.error(`Error processing page ${i}:`, pageError);
                allText += `[Error processing page ${i}]\n`;
            }
        }

        // Clean up PDF document
        pdf.cleanup();

        if (!allText.trim()) {
            console.warn(`No extractable text found in: ${file.name}`);
            return `[❌ No extractable text in PDF: ${file.name}]`;
        }

        console.log(`Successfully extracted ${allText.length} characters from: ${file.name}`);
        return allText.trim();

    } catch (err) {
        console.error(`❌ PDF extraction failed for ${file.name}:`, err);

        // More specific error messages
        if (err.name === 'InvalidPDFException') {
            return `[❌ Invalid PDF file: ${file.name}]`;
        } else if (err.name === 'MissingPDFException') {
            return `[❌ PDF file is empty or corrupted: ${file.name}]`;
        } else if (err.name === 'PasswordException') {
            return `[❌ PDF is password protected: ${file.name}]`;
        } else {
            return `[❌ Could not extract PDF: ${file.name} - ${err.message}]`;
        }
    }
}

export default function LandingPage() {
    const navigate = useNavigate();

    const [jobs, setJobs] = useState([]);
    const [selectedJobId, setSelectedJobId] = useState("");
    const [resumeFiles, setResumeFiles] = useState([]);
    const [extractedExperiences, setExtractedExperiences] = useState([]);
    const [error, setError] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    // Removed yearsOfExperience state - AI will extract it from resume
    const [jobForm, setJobForm] = useState({
        id: null,
        title: "",
        skills: "",
        description: "",
        years_experience: ""
    });
    const [editingJobId, setEditingJobId] = useState(null);

    const BACKEND_URL = "http://localhost:8000";

    useEffect(() => {
        fetchJobs();
        // Load PDF.js dynamically to ensure version compatibility
        loadPDFJS();
    }, []);

    async function loadPDFJS() {
        try {
            // Only load if not already loaded
            if (!window.pdfjsLib) {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
                    script.onload = () => {
                        // Set worker URL immediately after loading
                        if (window.pdfjsLib) {
                            window.pdfjsLib.GlobalWorkerOptions.workerSrc =
                                'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                            console.log('PDF.js loaded successfully with version compatibility');
                            resolve();
                        } else {
                            reject(new Error('PDF.js failed to load'));
                        }
                    };
                    script.onerror = () => reject(new Error('Failed to load PDF.js script'));
                    document.head.appendChild(script);
                });
            } else {
                // Already loaded, just ensure worker is set
                window.pdfjsLib.GlobalWorkerOptions.workerSrc =
                    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            }
        } catch (err) {
            console.error('Failed to load PDF.js:', err);
            setError("PDF processing unavailable. Please use .txt files only.");
        }
    }

    async function fetchJobs() {
        try {
            const res = await fetch(`${BACKEND_URL}/jobs`);
            if (!res.ok) throw new Error("Fetch jobs failed");
            setJobs(await res.json());
        } catch (e) {
            console.error(e);
            setError("Could not load jobs.");
        }
    }

    function handleResumeUpload(e) {
        const list = Array.from(e.target.files);
        if (list.length > 15) {
            return setError("You can upload up to 15 files only.");
        }
        setError("");
        setResumeFiles(list);
        setExtractedExperiences([]); // Reset extracted experiences
    }

    function extractYearsOfExperience(text) {
        if (!text) return 0;

        const patterns = [
            // Direct patterns: "5 years of experience", "3+ years experience"
            /(\d+)[\+\-]?\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|exp)/gi,

            // Pattern: "Experience: 5 years"
            /experience:?\s*(\d+)[\+\-]?\s*(?:years?|yrs?)/gi,

            // Pattern: "5+ years in", "3 years as"
            /(\d+)[\+\-]?\s*(?:years?|yrs?)\s*(?:in|as|with)/gi,

            // Pattern: "Over 5 years", "More than 3 years"
            /(?:over|more\s*than)\s*(\d+)[\+\-]?\s*(?:years?|yrs?)/gi,

            // Pattern: "5-8 years", "3 to 5 years"
            /(\d+)[\s\-to]*(\d+)?\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|exp)/gi,

            // Pattern for job durations: "2020-2023" (calculate years)
            /(\d{4})\s*[-–]\s*(\d{4}|present|current)/gi,

            // Pattern: "Since 2018", "From 2019"
            /(?:since|from)\s*(\d{4})/gi
        ];

        const experiences = [];
        const currentYear = new Date().getFullYear();

        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                if (match[0].toLowerCase().includes('years')) {
                    // Direct years mention
                    const years = parseInt(match[1]);
                    if (years > 0 && years <= 50) { // Reasonable range
                        experiences.push(years);
                    }
                } else if (match[1] && match[2]) {
                    // Date range pattern
                    const startYear = parseInt(match[1]);
                    const endYear = match[2].toLowerCase().includes('present') || match[2].toLowerCase().includes('current')
                        ? currentYear
                        : parseInt(match[2]);

                    if (startYear && endYear && endYear >= startYear) {
                        const yearsDiff = endYear - startYear;
                        if (yearsDiff >= 0 && yearsDiff <= 50) {
                            experiences.push(yearsDiff);
                        }
                    }
                } else if (match[1]) {
                    // Since/From pattern
                    const startYear = parseInt(match[1]);
                    if (startYear && startYear <= currentYear) {
                        const yearsDiff = currentYear - startYear;
                        if (yearsDiff >= 0 && yearsDiff <= 50) {
                            experiences.push(yearsDiff);
                        }
                    }
                }
            }
        }

        // Return the maximum experience found (assuming it's the total experience)
        return experiences.length > 0 ? Math.max(...experiences) : 0;
    }

    async function handleSubmit() {
        setError("");
        setIsProcessing(true);

        if (!selectedJobId) {
            setIsProcessing(false);
            return setError("Select a job.");
        }
        if (resumeFiles.length === 0) {
            setIsProcessing(false);
            return setError("Upload at least one resume.");
        }

        try {
            console.log(`Processing ${resumeFiles.length} files...`);
            const texts = [];

            // Process files with progress indication
            for (let i = 0; i < resumeFiles.length; i++) {
                const file = resumeFiles[i];
                console.log(`Processing file ${i + 1}/${resumeFiles.length}: ${file.name}`);

                try {
                    let extractedText;
                    if (file.type === "application/pdf") {
                        extractedText = await extractTextFromPDF(file);
                    } else {
                        extractedText = await readTextFile(file);
                    }
                    texts.push(extractedText);
                } catch (fileError) {
                    console.error(`Error processing ${file.name}:`, fileError);
                    texts.push(`[❌ Error processing file: ${file.name}]`);
                }
            }

            const job = jobs.find(j => String(j.id) === selectedJobId);
            if (!job) {
                setIsProcessing(false);
                return setError("Selected job not found.");
            }

            const bulkResults = texts.map(txt => {
                const extractedYears = extractYearsOfExperience(txt);
                return {
                    resumeText: txt,
                    selectedJob: {
                        title: job.title,
                        description: job.description,
                        skills: job.skills.split(",").map(s => s.trim()),
                        years_experience: job.years_experience || 0
                    },
                    yearsOfExperience: extractedYears
                };
            });

            console.log('Processing complete, navigating to results...');
            navigate("/results", { state: { bulkResults } });

        } catch (e) {
            console.error("Submission error", e);
            setError("Error processing resumes. Please check the console for details.");
        } finally {
            setIsProcessing(false);
        }
    }

    // Job add/edit/delete logic
    async function handleAddOrUpdateJob() {
        const { title, skills, description, years_experience, id } = jobForm;
        if (!title || !skills || !description || years_experience === "") {
            return alert("Fill all job fields.");
        }

        const endpoint = editingJobId
            ? `${BACKEND_URL}/update_job?id=${id}`
            : `${BACKEND_URL}/add_job`;

        try {
            const res = await fetch(endpoint, {
                method: editingJobId ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(jobForm)
            });
            if (!res.ok) throw new Error();
            setJobForm({ id: null, title: "", skills: "", description: "", years_experience: "" });
            setEditingJobId(null);
            fetchJobs();
        } catch {
            alert("Error saving job.");
        }
    }

    async function handleDeleteJob(id) {
        try {
            await fetch(`${BACKEND_URL}/delete_job?id=${id}`, { method: "DELETE" });
            fetchJobs();
        } catch (e) {
            console.error(e);
            setError("Error deleting job.");
        }
    }

    function handleEditJob(job) {
        setJobForm({
            id: job.id,
            title: job.title,
            skills: job.skills,
            description: job.description,
            years_experience: job.years_experience
        });
        setEditingJobId(job.id);
    }

    return (
        <div className="container py-5">
            <h1 className="text-center mb-4">Blind Screening AI</h1>

            <div className="mb-3">
                <label>Resumes (.pdf, .txt, max 15):</label>
                <input
                    type="file"
                    multiple
                    accept=".pdf,.txt"
                    className="form-control"
                    onChange={handleResumeUpload}
                    disabled={isProcessing}
                />
                {resumeFiles.length > 0 && (
                    <small className="text-muted">
                        {resumeFiles.length} file(s) selected: {resumeFiles.map(f => f.name).join(', ')}
                    </small>
                )}
                <small className="text-muted d-block mt-1">
                    Tip: If PDF extraction fails, convert your PDFs to .txt format for better compatibility.
                </small>
            </div>

            <div className="mb-3">
                <label>Select Job:</label>
                <select
                    className="form-select"
                    value={selectedJobId}
                    onChange={e => setSelectedJobId(e.target.value)}
                    disabled={isProcessing}
                >
                    <option value="">-- Choose --</option>
                    {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                </select>
            </div>

            {!!error && <div className="alert alert-danger">{error}</div>}

            <button
                className="btn btn-primary btn-lg w-100 mb-4"
                onClick={handleSubmit}
                disabled={isProcessing}
            >
                {isProcessing ? "Processing..." : "Submit & Score"}
            </button>

            <hr />

            <h3>Manage Jobs</h3>
            <div className="row">
                <div className="col-md-6 mb-3">
                    <input
                        className="form-control mb-2"
                        placeholder="Title"
                        value={jobForm.title}
                        onChange={e => setJobForm({ ...jobForm, title: e.target.value })}
                    />
                    <input
                        className="form-control mb-2"
                        placeholder="Skills (comma separated)"
                        value={jobForm.skills}
                        onChange={e => setJobForm({ ...jobForm, skills: e.target.value })}
                    />
                    <input
                        type="number"
                        min="0"
                        className="form-control mb-2"
                        placeholder="Years Exp."
                        value={jobForm.years_experience}
                        onChange={e => setJobForm({ ...jobForm, years_experience: e.target.value })}
                    />
                    <textarea
                        className="form-control mb-2"
                        placeholder="Description"
                        value={jobForm.description}
                        onChange={e => setJobForm({ ...jobForm, description: e.target.value })}
                    />

                    <button className="btn btn-success" onClick={handleAddOrUpdateJob}>
                        {editingJobId ? "Update Job" : "Add Job"}
                    </button>
                </div>

                <div className="col-md-6">
                    <ul className="list-group">
                        {jobs.map(j => (
                            <li key={j.id} className="list-group-item d-flex justify-content-between">
                                <span><strong>{j.title}</strong> – {j.skills}</span>
                                <span>
                                    <button className="btn btn-sm btn-secondary me-2" onClick={() => handleEditJob(j)}>
                                        Edit
                                    </button>
                                    <button className="btn btn-sm btn-danger" onClick={() => handleDeleteJob(j.id)}>
                                        Delete
                                    </button>
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
