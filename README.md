# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

-- Blind Screening AI
Blind Screening AI is a web application designed to help recruiters and HR professionals objectively evaluate candidate resumes against job requirements using AI technology. The tool:

Anonymizes resumes by removing personal identifiers (name, email, phone, etc.) to reduce bias.

Uses AI-powered semantic analysis (via OpenAI’s GPT models) to score candidates on skills and experience relevance, not just keyword matching.

Presents clear visual results with scores, matched/missing skills, bias flags, and anonymized resume previews.

Enables bulk resume uploads, sorting candidates by score, and exporting results to CSV reports.

--How AI Scoring Works
Resume & Job Parsing:
Extracts the candidate’s text and the job’s skill requirements.

Semantic Analysis:
Sends a carefully crafted prompt including job skills, required experience, and the candidate’s resume to OpenAI’s API.

Score Calculation:
The AI returns a JSON object containing:

skillScore: How well the candidate’s skills match job requirements (0-100).

experienceScore: How relevant the candidate’s experience is (0-100).

biasFlags: Any potential concerns or red flags.

Overall Score:
Combines skill and experience scores (typically 70% skill, 30% experience) into an overall score.

Anonymization:
The resume is sanitized to remove personal identifiers before being shown.

OpenAI API key:
REACT_APP_OPENAI_API_KEY=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

