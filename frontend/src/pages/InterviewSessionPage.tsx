import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useParams } from "react-router-dom";
import { ButtonLink } from "../components/Button";
import { getInterviewSession, startInterviewSession } from "../services/interviewApi";
import type { InterviewCreationResponse, InterviewSessionState, InterviewStartApiResponse } from "../types/interview";

type LocationState = InterviewSessionState | undefined;

function formatRoleLabel(targetRole: string, customRole?: string) {
  if (targetRole === "custom") {
    return customRole?.trim() || "Custom Role";
  }

  const labels: Record<string, string> = {
    "software-engineer": "Software Engineer",
    "frontend-developer": "Frontend Developer",
    "backend-developer": "Backend Developer",
    "full-stack-developer": "Full Stack Developer",
    "python-developer": "Python Developer",
    "data-analyst": "Data Analyst",
    "data-scientist": "Data Scientist",
    "ai-ml-engineer": "AI/ML Engineer",
    "devops-engineer": "DevOps Engineer",
  };

  return labels[targetRole] ?? targetRole;
}

export function InterviewSessionPage() {
  const { sessionId } = useParams();
  const location = useLocation();
  const sessionState = location.state as LocationState;
  const [sessionData, setSessionData] = useState<InterviewCreationResponse | null>(
    sessionState
      ? {
          sessionId: sessionState.sessionId,
          status: "created",
          configuration: sessionState.configuration,
        }
      : null,
  );
  const [sessionStartData, setSessionStartData] = useState<InterviewStartApiResponse | null>(null);
  const [loading, setLoading] = useState(Boolean(sessionId && !sessionState));
  const [starting, setStarting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    let active = true;

    setLoading(true);
    getInterviewSession(sessionId)
      .then((response) => {
        if (!active) {
          return;
        }

        setSessionData(response);
        setLoadError(null);
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }

        if (!sessionState) {
          setLoadError(error instanceof Error ? error.message : "Unable to load the interview session.");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [sessionId, sessionState]);

  useEffect(() => {
    if (!sessionId || !sessionData) {
      return;
    }

    let active = true;

    setStarting(true);
    setAiError(null);

    startInterviewSession(sessionId)
      .then((response) => {
        if (!active) {
          return;
        }

        setSessionStartData(response);
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }

        setAiError(error instanceof Error ? error.message : "Unable to trigger the AI interview planner.");
      })
      .finally(() => {
        if (active) {
          setStarting(false);
        }
      });

    return () => {
      active = false;
    };
  }, [sessionId, sessionData]);

  if (!sessionId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-950">
        <section className="w-full max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-[0_20px_60px_-34px_rgba(15,23,42,0.28)] sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.38em] text-slate-500">Interview session</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Configuration required</h1>
          <p className="mt-4 text-base leading-8 text-slate-600">
            This session route expects a completed setup flow. Return to interview setup and continue from there.
          </p>
          <div className="mt-8 flex justify-center">
            <ButtonLink to="/interview/setup">Return to Interview Setup</ButtonLink>
          </div>
        </section>
      </main>
    );
  }

  if (loading && !sessionData) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-950">
        <section className="w-full max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-[0_20px_60px_-34px_rgba(15,23,42,0.28)] sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.38em] text-slate-500">Interview session</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Loading session</h1>
          <p className="mt-4 text-base leading-8 text-slate-600">
            InterviewX is loading your interview configuration.
          </p>
        </section>
      </main>
    );
  }

  if (!sessionData) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-950">
        <section className="w-full max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-[0_20px_60px_-34px_rgba(15,23,42,0.28)] sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.38em] text-slate-500">Interview session</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Configuration required</h1>
          <p className="mt-4 text-base leading-8 text-slate-600">
            {loadError ?? "This session could not be loaded. Return to interview setup and continue from there."}
          </p>
          <div className="mt-8 flex justify-center">
            <ButtonLink to="/interview/setup">Return to Interview Setup</ButtonLink>
          </div>
        </section>
      </main>
    );
  }

  const { configuration } = sessionData;
  const roleLabel = formatRoleLabel(configuration.targetRole, undefined);
  const resumeLabel = sessionState?.resumeLabel ?? "Not provided";

  const question = useMemo(() => sessionStartData?.question?.text, [sessionStartData]);
  const plan = useMemo(() => sessionStartData?.plan, [sessionStartData]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-4xl rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_20px_60px_-34px_rgba(15,23,42,0.28)] sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.38em] text-slate-500">Interview session</p>
        <div className="mt-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">AI Interviewer</h1>
          </div>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
            {starting ? "Thinking..." : "Ready"}
          </span>
        </div>

        <div className="mt-8 grid gap-4 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6 sm:grid-cols-2">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Candidate</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">{configuration.candidateName}</p>
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Target Role</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">{roleLabel}</p>
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Interview Type</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">{configuration.interviewType}</p>
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Difficulty</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">{configuration.difficulty}</p>
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Duration</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">{configuration.duration} minutes</p>
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Resume</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">{resumeLabel}</p>
          </div>
        </div>

        <section className="mt-8 rounded-[1.8rem] border border-slate-900/10 bg-gradient-to-br from-slate-950 to-slate-900 p-7 text-slate-50">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.36em] text-slate-400">AI Interviewer</p>
              <p className="mt-2 text-xs font-medium uppercase tracking-[0.2em] text-emerald-300">
                {plan ? `Plan: ${plan.stages.length} stages` : "Preparing interview"}
              </p>
            </div>
            <div className="text-right text-xs font-medium uppercase tracking-[0.24em] text-slate-400">
              {configuration.duration} min
            </div>
          </div>
          <div className="mt-6">
            {starting ? (
              <div className="rounded-2xl border border-white/20 bg-white/5 p-5">
                <p className="text-sm font-medium text-slate-200">Generating your first question...</p>
              </div>
            ) : aiError ? (
              <div className="rounded-2xl border border-rose-300/40 bg-rose-500/10 p-5">
                <p className="text-sm font-semibold text-rose-200">Interview engine unavailable</p>
                <p className="mt-2 text-sm leading-7 text-rose-100/90">{aiError}</p>
              </div>
            ) : question ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-[2rem] leading-[1.13] font-semibold tracking-tight text-white">“{question}”</p>
                <div className="mt-6 flex items-center justify-between gap-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.38em] text-slate-400">Question 01</span>
                  <span className="rounded-full border border-white/20 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-200">
                    {sessionStartData?.question.type ?? configuration.interviewType}
                  </span>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/20 bg-white/5 p-5">
                <p className="text-sm font-medium text-slate-200">Awaiting AI interview configuration.</p>
              </div>
            )}
          </div>
        </section>

        <div className="mt-8 flex justify-end">
          <ButtonLink to="/">Back to landing</ButtonLink>
        </div>
      </section>
    </main>
  );
}
