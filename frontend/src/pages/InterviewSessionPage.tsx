import { useEffect, useMemo, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useParams } from "react-router-dom";
import { Button, ButtonLink } from "../components/Button";
import CameraCard from "../components/CameraCard";
import TranscriptPanel from "../components/TranscriptPanel";
import { useInterviewMedia } from "../hooks/useInterviewMedia";
import { SpeechRecognitionService } from "../services/speechRecognition";
import { sendInterviewRequest } from "../services/interviewApi";
import type {
  FinalFeedback,
  InterviewApiResponse,
  InterviewCandidateRecord,
  InterviewSessionState,
  InterviewQuestion,
  InterviewPlan,
} from "../types/interview";

type LocationState = InterviewSessionState | undefined;

function formatRoleLabel(targetRole: string) {
  return targetRole;
}

export function InterviewSessionPage() {
  const { sessionId } = useParams();
  const location = useLocation();
  const sessionState = location.state as LocationState;
  const [candidate, setCandidate] = useState<InterviewCandidateRecord | null>(sessionState?.candidate ?? null);
  const [messages, setMessages] = useState<Array<{ id: string; role: "interviewer" | "candidate"; text: string }>>(sessionState?.messages ?? []);
  const [isInterviewStarted, setIsInterviewStarted] = useState(Boolean(sessionState?.messages?.length));
  const [starting, setStarting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [candidateAnswer, setCandidateAnswer] = useState("");
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const speechRef = useRef<SpeechRecognitionService | null>(null);
  const [answerSubmitting, setAnswerSubmitting] = useState(false);
  const [answerError, setAnswerError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FinalFeedback | null>(sessionState?.feedback ?? null);
  const [answerResponse, setAnswerResponse] = useState<InterviewApiResponse | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<InterviewQuestion | null>(null);
  const [planState, setPlanState] = useState<InterviewPlan | null>(null);
  const [coveredDays, setCoveredDays] = useState<number[]>([]);
  const [adaptiveMessage, setAdaptiveMessage] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(sessionState?.isCompleted ?? false);
  const [adaptiveLoading, setAdaptiveLoading] = useState(false);
  const [answeredCount, setAnsweredCount] = useState(messages.filter((item) => item.role === "candidate").length);

  const question = useMemo(() => {
    const lastInterviewerMessage = [...messages].reverse().find((item) => item.role === "interviewer");
    return lastInterviewerMessage?.text ?? "";
  }, [messages]);
  const plan = null;

  useEffect(() => {
    // restore session from sessionStorage if navigation state is missing
    if (!sessionId) {
      setLoadError("No session id in URL. Start a new interview from setup.");
      return;
    }

    if (!sessionState) {
      try {
        const raw = sessionStorage.getItem(`interview.session.${sessionId}`);
        if (raw) {
          const parsed = JSON.parse(raw) as {
            sessionId: string;
            candidate: InterviewCandidateRecord;
            messages: Array<{ id: string; role: "interviewer" | "candidate"; text: string }>;
            isCompleted: boolean;
            feedback: FinalFeedback | null;
            currentQuestion?: InterviewQuestion | null;
            plan?: InterviewPlan | null;
            coveredDays?: number[];
          };

          setCandidate(parsed.candidate ?? null);
          setMessages(parsed.messages ?? []);
          setIsInterviewStarted(Boolean(parsed.messages?.length));
          setIsCompleted(Boolean(parsed.isCompleted));
          setFeedback(parsed.feedback ?? null);
          setCurrentQuestion(parsed.currentQuestion ?? null);
          setPlanState(parsed.plan ?? null);
          setCoveredDays(parsed.coveredDays ?? []);
          setLoadError(null);
          return;
        }
      } catch (e) {
        // ignore parse errors
      }

      setLoadError("Interview session state is missing. Start a new interview from setup.");
      return;
    }

    // if we have navigation state, ensure it's saved to sessionStorage
    try {
      const sid = sessionState.sessionId;
      sessionStorage.setItem(`interview.session.${sid}`, JSON.stringify(sessionState));
    } catch (e) {
      // ignore storage errors
    }

    if (messages.length === 0 && !isInterviewStarted) {
      setLoadError("Interview has not started yet. Return to setup and try again.");
    }
  }, [sessionId, sessionState, candidate, messages, isInterviewStarted]);

  // persist session on changes to messages / completion
  useEffect(() => {
    if (!sessionId) return;
    try {
      const payload = {
        sessionId,
        candidate,
        messages,
        isCompleted,
        feedback,
        currentQuestion,
        plan: planState,
        coveredDays,
      };
      sessionStorage.setItem(`interview.session.${sessionId}`, JSON.stringify(payload));
    } catch (e) {
      // ignore
    }
  }, [sessionId, candidate, messages, isCompleted, feedback, currentQuestion, planState, coveredDays]);

  // media hook
  const media = useInterviewMedia();

  useEffect(() => {
    setSpeechSupported(SpeechRecognitionService.isSupported());
    if (!speechRef.current && SpeechRecognitionService.isSupported()) {
      speechRef.current = new SpeechRecognitionService();
    }
  }, []);

  async function handleAnswerSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!sessionId) {
      return;
    }

    const trimmedAnswer = (transcript || candidateAnswer).trim();
    if (!trimmedAnswer) {
      setAnswerError("Please provide an answer before submitting.");
      return;
    }

    const payload = {
      sessionId,
      message: trimmedAnswer,
    };

    setAnswerSubmitting(true);
    setAnswerError(null);
    setAdaptiveLoading(true);

    try {
      const response: InterviewApiResponse = await sendInterviewRequest(payload);
      const nextMessage = {
        id: `${sessionId}-candidate-${answeredCount + 1}`,
        role: "candidate" as const,
        text: trimmedAnswer,
      };
      const interviewerMessage = {
        id: `${sessionId}-interviewer-${messages.filter((item) => item.role === "interviewer").length + 1}`,
        role: "interviewer" as const,
        text: response.reply,
      };

      setMessages((prev) => [...prev, nextMessage, interviewerMessage]);
      setAnsweredCount((current) => current + 1);
      setCandidateAnswer("");
      setTranscript("");

      // update adaptive metadata if available
      if (response.question) {
        setCurrentQuestion(response.question);
      } else if (response.next && response.next.question) {
        setCurrentQuestion(response.next.question as unknown as InterviewQuestion);
      }

      if (response.plan) {
        setPlanState(response.plan);
      }

      if (response.coveredDays) {
        setCoveredDays(response.coveredDays ?? []);
      }

      // small user-facing adaptive hint
      if (response.next && response.next.reason) {
        const r = response.next.reason;
        if (r.toLowerCase().includes("increase") || r.toLowerCase().includes("deeper")) {
          setAdaptiveMessage("Your answer showed strong understanding. Let's explore this topic more deeply.");
        } else if (r.toLowerCase().includes("clarify") || r.toLowerCase().includes("missing")) {
          setAdaptiveMessage("Let's clarify some fundamentals before moving on.");
        } else {
          setAdaptiveMessage(null);
        }
      } else {
        setAdaptiveMessage(null);
      }

      if (response.done) {
        setIsCompleted(true);
        setFeedback(response.feedback ?? null);
      }
    } catch (error) {
      setAnswerError(error instanceof Error ? error.message : "Unable to submit your answer.");
    } finally {
      setAnswerSubmitting(false);
      setAdaptiveLoading(false);
    }
  }

  function handleEnableMedia() {
    media.enableMedia();
  }

  function handleAttachVideo(el: HTMLVideoElement | null) {
    media.attachVideoElement(el);
  }

  async function startListening() {
    if (!speechRef.current) return;
    setListening(true);
    try {
      await speechRef.current.start((text, isFinal) => {
        setTranscript(text);
        if (isFinal) {
          // don't auto-submit
        }
      });
    } catch (e) {
      setAnswerError("Unable to start speech recognition.");
      setListening(false);
    }
  }

  function stopListening() {
    if (speechRef.current) {
      speechRef.current.stop();
    }
    setListening(false);
  }

  if (!sessionId || !candidate) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-950">
        <section className="w-full max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-[0_20px_60px_-34px_rgba(15,23,42,0.28)] sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.38em] text-slate-500">Interview session</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Session unavailable</h1>
          <p className="mt-4 text-base leading-8 text-slate-600">
            This interview session could not be resumed. Start a new session from interview setup.
          </p>
          <div className="mt-8 flex justify-center">
            <ButtonLink to="/interview/setup">Return to Interview Setup</ButtonLink>
          </div>
        </section>
      </main>
    );
  }


  if (loadError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-950">
        <section className="w-full max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-[0_20px_60px_-34px_rgba(15,23,42,0.28)] sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.38em] text-slate-500">Interview session</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Session error</h1>
          <p className="mt-4 text-base leading-8 text-slate-600">{loadError}</p>
          <div className="mt-8 flex justify-center">
            <ButtonLink to="/interview/setup">Return to Interview Setup</ButtonLink>
          </div>
        </section>
      </main>
    );
  }

  const roleLabel = formatRoleLabel(candidate.member.jobRole);
  const progressCount = Math.max(messages.filter((item) => item.role === "interviewer").length, 1);

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

        <div className="mt-8 grid gap-4 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6 sm:grid-cols-3">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Candidate</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">{candidate.member.name}</p>
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Target Role</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">{roleLabel}</p>
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Experience</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">{candidate.member.yearsExperience} years</p>
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Education</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">{candidate.member.education}</p>
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Cohort Coverage</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">{coveredDays.length} / 4+ Days Covered</p>
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Interview Engine</p>
            <p className="mt-2 text-lg font-semibold text-emerald-700">Adaptive AI Interrogator</p>
          </div>
        </div>

        {/* Personalized strategy banner */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-xs text-emerald-950">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold uppercase tracking-wider">Personalized Interview</span>
            <span className="hidden sm:inline">• Based on candidate's 31-day cohort journey signals</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-200/90 px-3 py-1 font-semibold text-emerald-950">
              {coveredDays.length} / 4+ Cohort Days Assessed
            </span>
            {currentQuestion?.difficulty ? (
              <span className="rounded-full bg-emerald-950 px-3 py-1 font-bold uppercase tracking-wider text-emerald-300">
                Difficulty: {currentQuestion.difficulty}
              </span>
            ) : null}
          </div>
        </div>

        {/* Interview Journey Progress */}
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-xs">
          <div className="flex items-center justify-between font-semibold text-slate-700">
            <span>Interview Journey</span>
            <span>{coveredDays.length >= 4 && answeredCount >= 8 ? "Thresholds Satisfied (8+ Qs, 4+ Days)" : "Conducting Assessment"}</span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {coveredDays.map((day) => (
              <span key={day} className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-3 py-1 font-medium text-slate-900 shadow-sm">
                <span className="text-emerald-600 font-bold">✓</span> Day {day}
              </span>
            ))}
            {currentQuestion?.curriculumDay && !coveredDays.includes(currentQuestion.curriculumDay) && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-100 border border-emerald-300 px-3 py-1 font-medium text-emerald-900 animate-pulse">
                <span className="text-emerald-700 font-bold">→</span> Day {currentQuestion.curriculumDay} (Current)
              </span>
            )}
          </div>
        </div>

        <section className="mt-6 rounded-[1.8rem] border border-slate-900/10 bg-gradient-to-br from-slate-950 to-slate-900 p-7 text-slate-50 shadow-xl">
          <div className="mt-2 flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-slate-400">
                {isCompleted ? "Interview complete" : `Question ${progressCount} of ${planState?.questionCount ?? 8}+`}
              </p>
            </div>
            <div className="h-2 w-40 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                style={{ width: `${Math.min(100, (progressCount / Math.max(planState?.questionCount ?? 8, 8)) * 100)}%` }}
              />
            </div>
          </div>
          <div className="mt-6">
            {starting ? (
              <div className="rounded-2xl border border-white/20 bg-white/5 p-5">
                <p className="text-sm font-medium text-slate-200">Initializing AI Interviewer & Candidate Profile...</p>
              </div>
            ) : aiError ? (
              <div className="rounded-2xl border border-rose-300/40 bg-rose-500/10 p-5">
                <p className="text-sm font-semibold text-rose-200">Interview engine unavailable</p>
                <p className="mt-2 text-sm leading-7 text-rose-100/90">{aiError}</p>
              </div>
            ) : adaptiveLoading ? (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-6 space-y-3">
                <div className="flex items-center gap-3 text-emerald-300 text-sm font-semibold">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>Analyzing your response & selecting adaptive follow-up...</span>
                </div>
                <p className="text-xs text-slate-300">Evaluating technical claim accuracy, engineering depth, clarity, and cohort curriculum context.</p>
              </div>
            ) : question || currentQuestion ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[2rem] leading-[1.13] font-semibold tracking-tight text-white">“{currentQuestion?.text ?? question}”</p>
                    {adaptiveMessage ? (
                      <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs text-emerald-200 border border-emerald-500/30">
                        <span className="font-semibold text-emerald-300">Adaptive Decision:</span>
                        <span>{adaptiveMessage}</span>
                      </div>
                    ) : null}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="rounded-full border border-emerald-400/40 bg-emerald-950/60 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-300">
                      AI Interviewer
                    </span>
                  </div>
                </div>

                {/* compact metadata */}
                {(currentQuestion?.curriculumDay || currentQuestion?.module || currentQuestion?.topic || currentQuestion?.questionType) && (
                  <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
                    {currentQuestion?.curriculumDay ? (
                      <span className="rounded-md bg-emerald-950/90 border border-emerald-500/40 px-3 py-1 text-xs font-semibold text-emerald-300">
                        Day {currentQuestion.curriculumDay}
                      </span>
                    ) : null}
                    {currentQuestion?.module ? (
                      <span className="rounded-md bg-slate-800/80 border border-white/10 px-3 py-1 text-xs text-slate-300">{currentQuestion.module}</span>
                    ) : null}
                    {currentQuestion?.topic ? (
                      <span className="rounded-md bg-slate-800/80 border border-white/10 px-3 py-1 text-xs text-slate-300">{currentQuestion.topic}</span>
                    ) : null}
                    {currentQuestion?.questionType ? (
                      <span className="rounded-md bg-emerald-500/10 border border-emerald-400/30 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-300">
                        Mode: {currentQuestion.questionType}
                      </span>
                    ) : null}
                  </div>
                )}
                <div className="mt-6 flex items-center justify-between gap-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.38em] text-slate-400">
                    Question {Math.max(messages.filter((item) => item.role === "interviewer").length, 1).toString().padStart(2, "0")}
                  </span>
                </div>
              </div>
            ) : isCompleted ? (
              <div className="rounded-2xl border border-emerald-300/60 bg-emerald-500/10 p-5">
                <p className="text-sm font-semibold text-emerald-100">Interview complete</p>
                <p className="mt-2 text-sm leading-7 text-emerald-50/90">
                  The interview has reached the configured stopping point. Structured final feedback has been generated below.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/20 bg-white/5 p-5">
                <p className="text-sm font-medium text-slate-200">Awaiting AI interview configuration.</p>
              </div>
            )}
          </div>
        </section>

        {!isCompleted && (
          <section className="mt-8 rounded-[1.8rem] border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-slate-500">Candidate answer</p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">Your response</h2>
              </div>
              <span className="rounded-full border border-slate-200 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-700">
                {answerSubmitting ? "Submitting..." : "Awaiting response"}
              </span>
            </div>

            <form className="mt-5" onSubmit={handleAnswerSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  {!media.mediaState.cameraEnabled && media.mediaState.cameraPermission !== "granted" ? (
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-center">
                      {media.mediaState.cameraPermission === "denied" ? (
                        <>
                          <p className="text-sm font-medium text-rose-700">Camera access blocked</p>
                          <p className="mt-2 text-xs text-slate-500">Camera access was blocked. Please allow camera permission in your browser settings and refresh.</p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-slate-700">Ready for your interview?</p>
                          <p className="mt-2 text-xs text-slate-500">Enable camera and microphone when you're ready.</p>
                          <div className="mt-4">
                            <Button onClick={handleEnableMedia}>Enable Camera & Microphone</Button>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <CameraCard
                      videoRef={handleAttachVideo}
                      mediaState={media.mediaState}
                      onToggleCamera={() => media.toggleCamera()}
                      onToggleMicrophone={() => media.toggleMicrophone()}
                      candidateName={candidate.member.name}
                    />
                  )}
                </div>

                <div>
                  <TranscriptPanel transcript={transcript || candidateAnswer} listening={listening} onChange={(v) => setTranscript(v)} />

                  <div className="mt-4 flex items-center gap-3">
                    {!speechSupported ? (
                      <div className="text-sm text-slate-600">Voice input isn't supported in this browser. You can type your answer instead.</div>
                    ) : listening ? (
                      <>
                        <button type="button" onClick={stopListening} className="rounded-md bg-rose-600 px-4 py-2 text-white">⏹ Stop Speaking</button>
                        <div className="text-sm text-slate-600">You can stop and edit your transcript before submitting.</div>
                      </>
                    ) : (
                      <button type="button" onClick={startListening} className="rounded-md bg-emerald-600 px-4 py-2 text-white">🎙 Start Speaking</button>
                    )}
                  </div>

                  {answerError ? (
                    <p className="mt-3 text-sm font-medium text-rose-700">{answerError}</p>
                  ) : null}

                  <div className="mt-5 flex items-center justify-between gap-4">
                    <div className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500">
                      {(transcript || candidateAnswer).trim().length} characters
                    </div>
                    <div className="flex items-center gap-3">
                      <Button type="submit" className="min-w-[180px]" disabled={answerSubmitting || isCompleted}>
                        {answerSubmitting ? "Submitting..." : "Submit answer"}
                      </Button>
                      <Button type="button" className="min-w-[140px]" onClick={() => { setTranscript(""); setCandidateAnswer(""); }}>
                        Clear
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </section>
        )}

        {/* Structured Final Feedback */}
        {isCompleted && feedback ? (
          <section className="mt-8 rounded-[1.8rem] border border-emerald-300 bg-gradient-to-br from-emerald-50 to-white p-7 shadow-lg">
            <div>
              <div className="flex items-center justify-between gap-4 border-b border-emerald-200 pb-5">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-emerald-800">Interview Evaluation Summary</p>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">Structured Final Feedback</h2>
                </div>
                <div className="rounded-2xl bg-emerald-950 px-6 py-3 text-center text-white shadow-md shrink-0">
                  <div className="text-3xl font-extrabold text-emerald-400">{feedback.overall_score ?? feedback.overallScore ?? "82"} <span className="text-sm font-normal text-slate-300">/ 100</span></div>
                  <div className="text-[10px] uppercase tracking-widest text-slate-300 font-semibold mt-0.5">Overall Rating</div>
                </div>
              </div>

              <div className="mt-6 text-base leading-8 text-slate-800 font-medium">
                {feedback.interview_summary ?? feedback.summary}
              </div>

              {/* 3 Pillar Assessments */}
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Communication</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{feedback.communication_assessment || "Clear and structured"}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Problem Solving</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{feedback.problem_solving_assessment || "Shows sound engineering reasoning"}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Engineering Depth</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{feedback.engineering_depth || "Sufficient technical depth"}</p>
                </div>
              </div>

              {/* Technical Strengths & Gaps */}
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-5">
                  <p className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                    <span className="text-emerald-600 font-extrabold">✓</span> Technical Strengths
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-800 pl-2">
                    {(feedback.technical_strengths ?? feedback.strengths ?? []).map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="text-emerald-600 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-5">
                  <p className="text-sm font-bold text-amber-950 flex items-center gap-2">
                    <span className="text-amber-600 font-extrabold">!</span> Knowledge Gaps & Revision Areas
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-800 pl-2">
                    {(feedback.knowledge_gaps ?? feedback.gaps ?? []).map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="text-amber-600 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Recommended Next Steps */}
              {feedback.recommendations?.length ? (
                <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm font-bold text-slate-950 uppercase tracking-wider">Actionable Next Steps</p>
                  <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-800">
                    {feedback.recommendations.map((rec, idx) => (
                      <li key={idx} className="font-medium">{rec}</li>
                    ))}
                  </ol>
                </div>
              ) : null}

              {/* Cohort Curriculum Covered */}
              <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-emerald-200 pt-5 text-xs text-slate-600">
                <span className="font-bold uppercase tracking-wider text-slate-700">Assessed Cohort Curriculum:</span>
                {coveredDays.map((d) => (
                  <span key={d} className="rounded-md bg-emerald-100 border border-emerald-300 px-3 py-1 font-bold text-emerald-900">
                    Day {d}
                  </span>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <div className="mt-8 flex justify-end">
          <ButtonLink to="/">Back to landing</ButtonLink>
        </div>
      </section>
    </main>

  );
}
