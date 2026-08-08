import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useParams } from "react-router-dom";
import { Button, ButtonLink } from "../components/Button";
import { getInterviewSession, startInterviewSession, submitInterviewAnswer } from "../services/interviewApi";
import type {
  InterviewAnswerSubmissionRequest,
  InterviewAnswerSubmissionResponse,
  InterviewCreationResponse,
  InterviewQuestion,
  InterviewSessionState,
  InterviewStartApiResponse,
} from "../types/interview";

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
  const [candidateAnswer, setCandidateAnswer] = useState("");
  const [answerSubmitting, setAnswerSubmitting] = useState(false);
  const [answerError, setAnswerError] = useState<string | null>(null);
  const [answerResponse, setAnswerResponse] = useState<InterviewAnswerSubmissionResponse | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<InterviewQuestion | null>(null);
  const [adaptiveLoading, setAdaptiveLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [answeredCount, setAnsweredCount] = useState(0);

  const question = useMemo(() => activeQuestion?.text ?? sessionStartData?.question?.text, [activeQuestion, sessionStartData]);
  const questionId = useMemo(() => activeQuestion?.id, [activeQuestion]);
  const plan = useMemo(() => sessionStartData?.plan, [sessionStartData]);

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
        setActiveQuestion(response.question);
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

  async function handleAnswerSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!sessionId || !questionId) {
      return;
    }

    const trimmedAnswer = candidateAnswer.trim();
    if (!trimmedAnswer) {
      setAnswerError("Please provide an answer before submitting.");
      return;
    }

    const payload: InterviewAnswerSubmissionRequest = {
      questionId,
      answer: trimmedAnswer,
    };

    setAnswerSubmitting(true);
    setAnswerError(null);
    setAdaptiveLoading(true);

    try {
      const response = await submitInterviewAnswer(sessionId, payload);
      setAnswerResponse(response);
      setAnsweredCount((current) => current + 1);

      if (response.next.action === "finish_interview") {
        setCompleted(true);
        setActiveQuestion(null);
        setCandidateAnswer("");
      } else if (response.next.question) {
        setActiveQuestion(response.next.question);
        setCandidateAnswer("");
      }
    } catch (error) {
      setAnswerError(error instanceof Error ? error.message : "Unable to submit your answer.");
    } finally {
      setAnswerSubmitting(false);
      setAdaptiveLoading(false);
    }
  }

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
  const progressCount = Math.min(Math.max(answeredCount + 1, 1), plan?.questionCount ?? 1);

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
          <div className="mt-4 flex items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.34em] text-slate-400">
                {completed ? "Interview complete" : `Question ${Math.min(answeredCount + 1, plan?.questionCount ?? 1)} of ${plan?.questionCount ?? 1}`}
              </span>
            </div>
            <div className="h-2 w-40 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                style={{ width: `${Math.max(8, ((Math.min(answeredCount + 1, plan?.questionCount ?? 1) ?? 1) / (plan?.questionCount ?? 1)) * 100)}%` }}
              />
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
            ) : adaptiveLoading ? (
              <div className="rounded-2xl border border-white/20 bg-white/5 p-5">
                <p className="text-sm font-medium text-slate-200">Preparing your next question...</p>
              </div>
            ) : question ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-[2rem] leading-[1.13] font-semibold tracking-tight text-white">“{question}”</p>
                <div className="mt-6 flex items-center justify-between gap-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.38em] text-slate-400">
                    Question {Math.min(answeredCount + 1, plan?.questionCount ?? 1).toString().padStart(2, "0")}
                  </span>
                  <span className="rounded-full border border-white/20 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-200">
                    {activeQuestion?.stage ?? sessionStartData?.question.type ?? configuration.interviewType}
                  </span>
                </div>
              </div>
            ) : completed ? (
              <div className="rounded-2xl border border-emerald-300/60 bg-emerald-500/10 p-5">
                <p className="text-sm font-semibold text-emerald-100">Interview complete</p>
                <p className="mt-2 text-sm leading-7 text-emerald-50/90">
                  The interview has reached the configured stopping point. No additional question will be asked.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/20 bg-white/5 p-5">
                <p className="text-sm font-medium text-slate-200">Awaiting AI interview configuration.</p>
              </div>
            )}
          </div>
        </section>

        {sessionStartData && !completed && (
          <section className="mt-8 rounded-[1.8rem] border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-slate-500">Candidate answer</p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">Your response</h2>
              </div>
              <span className="rounded-full border border-slate-200 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-700">
                {answerResponse ? "Submitted" : "Awaiting response"}
              </span>
            </div>

            <form className="mt-5" onSubmit={handleAnswerSubmit}>
              <label className="block text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Answer
              </label>
              <textarea
                className="mt-3 min-h-[160px] w-full resize-y rounded-[1.2rem] border border-slate-300 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-900 shadow-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
                value={candidateAnswer}
                onChange={(event) => setCandidateAnswer(event.target.value)}
                placeholder="Share your answer to the interviewer question..."
                disabled={answerSubmitting || completed}
              />

              {answerError ? (
                <p className="mt-3 text-sm font-medium text-rose-700">{answerError}</p>
              ) : null}

              <div className="mt-5 flex items-center justify-between gap-4">
                <div className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500">
                  {candidateAnswer.trim().length} characters
                </div>
                <Button type="submit" className="min-w-[180px]" disabled={answerSubmitting || completed}>
                  {answerSubmitting ? "Submitting..." : "Submit answer"}
                </Button>
              </div>
            </form>

            {answerResponse ? (
              <section className="mt-7 rounded-[1.4rem] border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-emerald-700">AI evaluation</p>
                    <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
                      {answerResponse.evaluation.assessment}
                    </h3>
                  </div>
                  <span className="rounded-full border border-emerald-700/30 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.26em] text-emerald-800">
                    Score {answerResponse.evaluation.score}
                  </span>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-slate-500">Strengths</p>
                    <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-800">
                      {answerResponse.evaluation.strengths.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-slate-500">Improvement areas</p>
                    <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-800">
                      {answerResponse.evaluation.weaknesses.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <p className="mt-5 text-sm leading-7 text-slate-800">{answerResponse.evaluation.feedback}</p>
              </section>
            ) : null}
          </section>
        )}

        <div className="mt-8 flex justify-end">
          <ButtonLink to="/">Back to landing</ButtonLink>
        </div>
      </section>
    </main>
  );
}
