# PROMPTS

This file tracks significant AI-assisted development work for InterviewX so the hackathon history stays authentic and auditable.

## 2026-08-08

### Feature
Project foundation and repository inspection

### Prompt
Inspect the empty workspace, propose an initial architecture, create the clean project structure, and add the initial README, PROMPTS log, environment example, and ignore rules.

### Purpose
Establish a modular starting point for the hackathon build without jumping straight to the full application.

### Important AI Output
Identified the repository as empty and proposed a monorepo-style layout with separate frontend and backend areas plus root documentation. Also noticed that the initial backend dependency set needed to avoid native Windows build extras.

### Human Modifications
Adjusted the backend dependency list from `uvicorn[standard]` to `uvicorn` so setup remains portable on a plain Windows install.

### Final Implementation
Root documentation, `.env.example`, `.gitignore`, backend FastAPI shell, and frontend Vite shell were created. Frontend and backend were both validated locally.

### Additional Task
Backend portability fix

### Prompt
Replace the backend `uvicorn[standard]` dependency with the base `uvicorn` package after the Windows install surfaced a native build requirement.

### Purpose
Keep the foundation easy to install without Visual C++ build tools.

### Important AI Output
Confirmed that the standard uvicorn extra pulled in `httptools`, which failed to build on this machine.

### Human Modifications
None.

### Final Implementation
Backend requirements now use `uvicorn==0.34.0` and install successfully.

## 2026-08-08 - Phase 2

### Feature
Frontend design system and landing page

### Prompt
Inspect the existing frontend, reuse the Vite/React setup, establish reusable design tokens and components, create a premium InterviewX landing page, and prepare a clean `/interview/setup` placeholder route.

### Purpose
Build a polished, production-style frontend foundation for the hackathon without starting the actual interview workflow yet.

### Important AI Output
Created a modular landing page architecture with a router-based shell, reusable components, section blocks, a dark CTA, and a placeholder setup route. The design language was kept restrained and professional, with subtle motion only.

### Human Modifications
Adjusted the CTA styling to preserve contrast on the dark section and enabled React Router future flags to remove development warnings.

### Final Implementation
Added shared design tokens, responsive navigation, hero, problem, how-it-works, AI agents, adaptive interview, features, product preview, CTA, footer, and an interview setup placeholder page.

### Validation Performed
Ran `npm install`, `npm run build`, launched the Vite dev server, loaded the landing page in a browser, opened `/interview/setup`, and verified no horizontal overflow at mobile width.

## 2026-08-08 - Phase 3

### Feature
Interview setup and candidate onboarding

### Prompt
Inspect the existing frontend and routing, then replace the `/interview/setup` placeholder with a multi-step setup flow that collects candidate profile, interview preferences, resume upload, and review details before handing off to `/interview/session`.

### Purpose
Create a polished onboarding experience that gathers all future interview configuration without implementing the AI interview engine yet.

### Important AI Output
Built a typed multi-step wizard with guarded progression, accessible selection cards, resume file validation, a reusable stepper, and a session shell that safely handles both routed and direct access.

### Human Modifications
Refined the review and session screens to show human-readable role labels instead of internal slugs.

### Final Implementation
Added setup components under `frontend/src/components/setup/`, a routed session placeholder page, a centralized `InterviewConfig` model, and navigation that preserves setup state through the session handoff.

### Validation Performed
Ran `npm run build`, exercised the setup flow in the browser, verified validation for empty fields, invalid PDF uploads, oversized PDF uploads, valid PDF uploads, back/next navigation, session handoff, direct `/interview/session` fallback, and mobile overflow at 390px.

## 2026-08-08 - Phase 4

### Feature
FastAPI backend foundation and frontend API integration

### Prompt
Inspect the current frontend setup flow and build a clean FastAPI backend with health, interview creation/lookup, and resume validation endpoints, then connect the existing Start Interview action to the backend session API.

### Purpose
Create the first functional backend layer for InterviewX without adding AI providers or persistent storage yet.

### Important AI Output
Added a modular FastAPI app with typed schemas, in-memory session storage, resume validation, structured error responses, CORS configuration, and a frontend handoff that posts setup data before navigating to a session ID route.

### Human Modifications
Corrected the frontend router to include `/interview/session/:sessionId` after the first integration test exposed a wildcard fallback issue.

### Final Implementation
Implemented `/api/health`, `/api/interviews`, `/api/interviews/{session_id}`, and `/api/resumes/validate`, updated environment examples, wired the setup flow to POST interview configuration, and added session loading plus fallback behavior in the frontend.

### Validation Performed
Ran the frontend production build, confirmed backend imports and route registration, started FastAPI locally, validated health, interview create/lookup, invalid interview config, invalid session, resume validation, invalid resume, oversized resume, browser CORS fetch, and the setup-to-session browser handoff.

## 2026-08-08 - Phase 5

### Feature
AI providers and first-question generation

### Prompt
Inspect the existing backend and schema contracts, introduce a provider abstraction boundary for AI planning, and expose the planner through a small agent surface so the runtime can ask a provider for a plan and a first question.

### Purpose
Keep AI orchestration behind a stable interface so the service layer can stay ignorant of the model adapter details while still issuing a first question from a started interview.

### Important AI Output
Generated the provider interface, OpenAI adapter with deterministic fallback objects, interview planner agent, service-level runtime storage for `interviewPlan` and `currentQuestion`, and the API contract for `POST /api/interviews/{session_id}/start`.

### Human Modifications
Resolved provider boundary import mismatches so `InterviewPlan` and `InterviewQuestion` use the schema layer instead of a provider-only module.

### Final Implementation
Added the provider contract, OpenAI provider support, planner agent wiring, runtime write-through in `InterviewService.start_interview()`, and the frontend `startInterviewSession` page integration.

### Validation Performed
Ran the frontend production build, executed backend import smoke checks, exercised the TestClient start flow, and confirmed the start endpoint emits a structured plan plus question body.

## 2026-08-08 - Phase 6

### Feature
Candidate answer submission and AI evaluation

### Prompt
Extend the existing interview lifecycle to accept a candidate answer for the active question, run it through an evaluator agent, and return a typed evaluation payload without changing the Phase 4 or Phase 5 contracts that are already stable.

### Purpose
Complete the closed-loop answer-to-feedback path while keeping the planner and first-question runtime intact.

### Important AI Output
Introduced `InterviewAnswerSubmissionRequest`, `InterviewAnswerSubmissionResponse`, `InterviewEvaluation`, `InterviewAnswer`, and the runtime answer/evaluation storage fields. The service validates the active question identifier, rejects empty or duplicate submissions, and calls an `AnswerEvaluatorAgent` that uses the provider interface to produce a structured evaluation.

### Human Modifications
Added the `POST /api/interviews/{session_id}/answer` route and the corresponding frontend `submitInterviewAnswer()` API client plus a session page textarea, submit button, and evaluation panel.

### Final Implementation
The service now stores answers and evaluations in memory, the API returns `questionId` and `evaluation`, and the page can present score, strengths, weaknesses, and feedback immediately after submission.

### Validation Performed
Ran the new backend answer-flow integration test with TestClient and confirmed that the response contains a full `evaluation` envelope. The frontend build was validated after the UI and API client contract were written.

## 2026-08-08 - Phase 7

### Feature
Adaptive interview planning and next-question generation

### Prompt
Inspect the Phase 4/5/6 runtime and build a Phase 7 planning layer that decides what should happen after each evaluation. The adaptive planner must decide among explicit actions, generate the next question through the provider abstraction, and preserve current runtime status instead of creating a second store.

### Purpose
Advance from a static first-question interview into a closed-loop interview where the next question depends on the previous answer, evaluation text, score, and question history.

### Important AI Output
Created the typed adaptive decision model (`InterviewAdaptiveDecision`), the next-state response surface (`InterviewAnswerNextState`), the new `AdaptiveInterviewPlannerAgent`, and the `AIProvider` extension points for decision-making and next-question generation. These are validated against the existing `InterviewSessionRuntime` fields such as `current_stage`, `current_difficulty`, `current_question`, `question_history`, `answer_history`, `evaluations`, and `adaptive_decisions`.

### Human Modifications
Integrated the adaptive planner call into `InterviewService.submit_answer()`, kept the answer/evaluation store intact, and updated the frontend page to derive the live question from the answer response rather than from the startup payload alone.

### Final Implementation
The answer POST response now includes both the evaluation and a `next` object containing the adaptive decision. The service stores the decision and either materializes a new `current_question` or closes the interview. `finish_interview` is used as the bounded fallback when the question limit is reached.

### Validation Performed
Ran the Phase 7 backend integration tests for answer adaptation, repeat-answer protection, invalid-question rejection, and a strong/weak answer next-question envelope. The frontend production build was checked after the page consumed the new response shape.
