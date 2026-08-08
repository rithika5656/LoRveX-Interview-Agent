import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useParams } from "react-router-dom";
import { ButtonLink } from "../components/Button";
import { getInterviewSession } from "../services/interviewApi";
import type { InterviewCreationResponse, InterviewSessionState } from "../types/interview";

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
  const [loading, setLoading] = useState(Boolean(sessionId && !sessionState));
  const [loadError, setLoadError] = useState<string | null>(null);

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

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-4xl rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_20px_60px_-34px_rgba(15,23,42,0.28)] sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.38em] text-slate-500">Interview session</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Configuration received successfully.</h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
          AI interview engine will be connected in the next phase.
        </p>

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

        <div className="mt-8 flex justify-end">
          <ButtonLink to="/">Back to landing</ButtonLink>
        </div>
      </section>
    </main>
  );
}
