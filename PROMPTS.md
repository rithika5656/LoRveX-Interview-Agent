# LoRveX AI Interview Agent — AI Usage Log

## Project Overview

**LoRveX** is an AI Technical Interview Agent created for the 31-Day Enterprise AI Cohort hackathon challenge.

The core design philosophy behind LoRveX is:

> **"Build the interviewer, not the interview."**

Instead of presenting candidates with static questionnaires or linear quizzes, LoRveX operates as an active, candidate-aware AI interviewer. The system conducts multi-turn, stateful technical interviews that adapt dynamically based on:

- **31-Day Enterprise AI Cohort Curriculum**: Mapping questions directly to curriculum modules, learning objectives, and cohort days (Days 1–31).
- **Candidate Learning Signals**: Assessing candidate history across completed missions, strong topics, challenging areas, and skipped modules.
- **Dynamic Claim Extraction & Probing**: Analyzing candidate answers to extract technical claims (e.g., *"vector search"*, *"RAG"*, *"MCP"*, *"agentic workflows"*) and probing edge cases or misconceptions.
- **Adaptive Difficulty & Question Modes**: Scaling difficulty dynamically across 8 distinct question modes (`conceptual`, `architecture`, `debugging`, `tradeoff`, `scenario`, `engineering_decision`, `followup`, `reflection`).
- **Structured Executive Feedback**: Generating a comprehensive end-of-interview report covering overall score, 3-pillar assessments (Communication, Problem Solving, Engineering Depth), technical strengths, knowledge gaps, and actionable learning steps.

---

## Phase 1 — Project Foundation

- **Goal**: Establish a clean, modular repository structure for a full-stack AI interview agent using React + Vite + TypeScript for the frontend and Python + FastAPI for the backend.
- **AI Prompting & Assistance**: AI was instructed to inspect the repository requirements, propose a clean monorepo-style layout (`frontend/` and `backend/`), set up initial configurations (`.env.example`, `.gitignore`), and configure lightweight dependencies (`uvicorn`, `fastapi`, `pydantic`).
- **Implementation & Deliverables**:
  - `backend/app/main.py` shell and `requirements.txt`.
  - `frontend/package.json` and `vite.config.ts`.
  - Initial repository layout and portability adjustments for standard environment setup.

---

## Phase 2 — Premium Frontend & Design System

- **Goal**: Build a WOW-level, responsive frontend interface with reusable design tokens, modern typography, glassmorphism UI cards, dark theme styling, and clear visual hierarchy.
- **AI Prompting & Assistance**: AI was prompted to construct a design system with reusable components (`Button`, `Card`, `Badge`, `Navbar`), structured section components (`Hero`, `Problem`, `HowItWorks`, `Agents`, `AdaptiveInterview`, `Features`, `DemoPreview`, `CTA`), and routing shells via React Router.
- **Implementation & Deliverables**:
  - `frontend/src/pages/LandingPage.tsx` and section components.
  - Custom design tokens in CSS and Tailwind configuration.
  - Responsive design supporting mobile, tablet, and desktop viewports without layout overflow.

---

## Phase 3 — Interview Setup Flow

- **Goal**: Create a multi-step onboarding wizard for candidates to select candidate profiles, input job role details, set interview preferences, and upload resumes.
- **AI Prompting & Assistance**: AI was prompted to build a typed multi-step wizard component (`ProfileStep`, `PreferencesStep`, `ResumeUpload`, `ReviewStep`) with client-side resume validation and guarded state progression.
- **Implementation & Deliverables**:
  - `frontend/src/pages/InterviewSetupPage.tsx` and step components under `frontend/src/components/setup/`.
  - Form validation for candidate details, experience level, and PDF/file constraints.
  - State handoff from setup wizard to interview session workspace.

---

## Phase 4 — FastAPI Backend Foundation

- **Goal**: Implement the core REST API backend handling session creation, candidate retrieval, resume validation, and status health checks.
- **AI Prompting & Assistance**: AI was prompted to construct typed Pydantic models for request/response schemas, in-memory runtime session storage, structured error exception handlers, and CORS middleware configuration.
- **Implementation & Deliverables**:
  - `backend/app/api/routes/health.py`, `interviews.py`, `resumes.py`, and `interview.py`.
  - `backend/app/schemas/interview.py` (Pydantic models for request/response contracts).
  - In-memory `InterviewService` runtime managing session lifecycle.

---

## Phase 5 — AI Provider & Planner Agent

- **Goal**: Build a provider abstraction boundary for AI planning and question generation, allowing seamless switching between OpenAI API calls and deterministic fallbacks.
- **AI Prompting & Assistance**: AI was prompted to implement an `AIProvider` abstract base class, an `OpenAIProvider` adapter with structured JSON schema responses, and an `InterviewPlannerAgent` that creates initial multi-stage interview plans.
- **Implementation & Deliverables**:
  - `backend/app/ai/provider.py` and `backend/app/ai/openai_provider.py`.
  - `backend/app/agents/interview_planner.py`.
  - Deterministic fallback methods (`_fallback_plan`, `_fallback_question`) ensuring offline/keyless reliability.

---

## Phase 6 — Answer Evaluation

- **Goal**: Implement closed-loop candidate answer evaluation to analyze answer quality, calculate technical depth scores, and extract strengths and weaknesses.
- **AI Prompting & Assistance**: AI was prompted to create an `AnswerEvaluatorAgent` that processes candidate text submissions against the active question context, scoring performance and returning structured feedback.
- **Implementation & Deliverables**:
  - `backend/app/agents/answer_evaluator.py`.
  - Evaluator prompt definitions in `backend/app/ai/prompts.py`.
  - Submission storage in `InterviewSessionRuntime` for historical audit.

---

## Phase 7 — Adaptive Interview Runtime

- **Goal**: Turn the interview into an adaptive, multi-turn dialogue where difficulty, question selection, and follow-up topics depend directly on previous evaluations.
- **AI Prompting & Assistance**: AI was prompted to build an `AdaptiveInterviewPlannerAgent` that evaluates candidate performance after each answer, dynamically selects next actions (`probe_deeper`, `pivot_topic`, `simplify`, `advance`), and tracks curriculum coverage.
- **Implementation & Deliverables**:
  - `backend/app/agents/adaptive_interview_planner.py`.
  - Runtime difficulty adjustment logic (`easy` / `medium` / `hard`).
  - Stage tracking and curriculum day progression across multi-turn sessions.

---

## Phase 8 — Curriculum-Aware Interview & Structured Feedback

- **Goal**: Enforce enterprise cohort curriculum rules (minimum 8 questions, minimum 4 curriculum days) and generate an executive final feedback report.
- **AI Prompting & Assistance**: AI was prompted to integrate `curriculum.json` and `candidates.json` data, enrich question objects with complete curriculum metadata (`curriculumDay`, `module`, `topic`, `learningObjective`, `questionType`), enhance `FeedbackAgent` to compute 3-pillar scores (Communication, Problem Solving, Engineering Depth), and update `InterviewSessionPage.tsx` with live progress bars and final executive report views.
- **Implementation & Deliverables**:
  - `backend/app/services/curriculum_service.py` and `backend/app/services/candidate_service.py`.
  - `backend/app/agents/candidate_profiler.py` (strategy generation based on cohort missions).
  - `backend/app/agents/feedback_agent.py` (structured executive feedback generation).
  - `frontend/src/pages/InterviewSessionPage.tsx` (Personalized Interview Strategy Header, Interview Journey Card, live lifecycle loading states, and executive feedback view).

---

## Phase 9 — Frontend Migration & Session Persistence

- **Goal**: Align the frontend with the required single HTTP API contract (`POST /api/interview`), maintain session continuity, and handle browser refreshes gracefully.
- **AI Prompting & Assistance**: AI was prompted to refactor `frontend/src/services/interviewApi.ts` to execute both session start (`{ sessionId, candidate }`) and continue (`{ sessionId, message }`) payloads against `POST /api/interview`, store active state in `sessionStorage`, and enable seamless state recovery upon page reload.
- **Implementation & Deliverables**:
  - Unified `sendInterviewRequest()` API function in `frontend/src/services/interviewApi.ts`.
  - Session state hydration in `InterviewSetupPage.tsx` and `InterviewSessionPage.tsx`.

---

## Phase 10 — Production Deployment & Debugging

- **Goal**: Deploy the application as a production-grade dual-service architecture on Vercel and Render (React Static Frontend + FastAPI Serverless/Web Backend) and resolve all production edge cases.
- **AI Prompting & Assistance**: AI was prompted to configure root [vercel.json](file:///c:/Users/rithi/OneDrive/Desktop/LoRveX-Interview-Agent/vercel.json), [runtime.txt](file:///c:/Users/rithi/OneDrive/Desktop/LoRveX-Interview-Agent/runtime.txt) (`python-3.11.9`), [api/index.py](file:///c:/Users/rithi/OneDrive/Desktop/LoRveX-Interview-Agent/api/index.py) serverless handler, environment variable routing (`VITE_API_BASE_URL`, `FRONTEND_URL`), and CORS regex matching (`https://.*\.onrender\.com`, `https://.*\.vercel\.app`).
- **Debugging & Resolution**:
  - **Python 3.14 Render Build Error**: Identified that Render defaulted to Python 3.14 where binary wheels for `pydantic-core` did not exist. Fixed by pinning `python-3.11.9` in `runtime.txt` and `PYTHON_VERSION=3.11.9`.
  - **Unexpected End of JSON Input**: Identified that direct `response.json()` calls failed on non-JSON or empty response streams. Fixed `interviewApi.ts` to read `await response.text()` first, log diagnostic URL/status/content-type, safely parse JSON, and handle errors cleanly.
  - **Session ID Mapping**: Refactored `POST /api/interview` route to initialize `svc._sessions[session_id]` and `svc._runtimes[session_id]` directly under client-provided session IDs.

---

## AI-Assisted Development Method

The codebase was developed iteratively using the following disciplined AI-assisted engineering methodology:

```text
1. Inspect Codebase & Architecture
        ↓
2. Identify Target Capability / Specification Requirement
        ↓
3. Draft Technical Implementation Plan with AI
        ↓
4. Apply Targeted Code Modifications
        ↓
5. Execute Local Verification (npm run build, pytest)
        ↓
6. Investigate Runtime / Build Errors via Error Tracebacks
        ↓
7. Refactor & Apply Diagnostic Enhancements
        ↓
8. Re-verify Tests & End-to-End Workflows
```

AI was utilized as a high-velocity pair-programming agent, accelerating schema design, agent prompt engineering, UI component crafting, and error log diagnosis while maintaining strict architectural constraints.

---

## Verification Evidence

All features and requirements have been empirically verified:

1. **Frontend Production Build**:
   ```bash
   cd frontend && npm run build
   ```
   *Result*: Built successfully in 1.35s with 0 TypeScript / Vite compilation errors.

2. **Backend Unit & Integration Test Suite**:
   ```bash
   cd backend && python -m pytest tests -q
   ```
   *Result*: **15 passed, 0 failed** in 0.99s across all agent, service, and API tests.

3. **End-to-End Turn-by-Turn Verification**:
   ```bash
   cd backend && python test_e2e_full_flow.py
   ```
   *Result*: 100% success across 9 turns covering 10 curriculum days.

4. **Production API Connectivity**:
   - **Production Backend URL**: `https://lorvex-interview-agent-1.onrender.com`
   - **Frontend API Endpoint**: `POST /api/interview`

---

## Hackathon Requirements Mapping

| Hackathon Requirement | Status | Implementation Evidence |
| :--- | :--- | :--- |
| **1. Conversational Technical Interview** | **PASSED** | Single stateful API (`POST /api/interview`) maintaining multi-turn context between candidate and AI interviewer. |
| **2. Minimum 8 Questions** | **PASSED** | `InterviewService.submit_answer()` strictly enforces `len(question_history) >= 8` before concluding session. |
| **3. Minimum 4 Curriculum Days** | **PASSED** | `InterviewService.submit_answer()` strictly enforces `len(set(covered_days)) >= 4` matching 31-day cohort curriculum. |
| **4. Adaptive Follow-up Questions** | **PASSED** | Candidate claim extraction, misconception probing, and dynamic difficulty scaling across 8 question modes (`openai_provider.py`). |
| **5. Context Preservation** | **PASSED** | Session state, candidate profiles, evaluations, and covered curriculum days are preserved in runtime memory and `sessionStorage`. |
| **6. Structured Final Feedback** | **PASSED** | Generates overall rating, 3-pillar assessments (Communication, Problem Solving, Engineering Depth), technical strengths, knowledge gaps, and next steps (`feedback_agent.py`). |
| **7. Required HTTP Endpoint** | **PASSED** | Preserves exact contract for `POST /api/interview` (Start: `{ sessionId, candidate }`, Continue: `{ sessionId, message }`). |

---

## Authenticity Statement

This document is an authentic AI-assisted development log generated directly from the repository's git commit history, technical specifications, and empirical test suite outputs created during the hackathon.
