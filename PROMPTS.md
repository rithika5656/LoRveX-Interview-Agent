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
