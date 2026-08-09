import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, ButtonLink } from "../components/Button";
import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";
import { PreferencesStep } from "../components/setup/PreferencesStep";
import { ReviewStep } from "../components/setup/ReviewStep";
import { ResumeUpload, validateResumeFile } from "../components/setup/ResumeUpload";
import { SetupStepper } from "../components/setup/SetupStepper";
import { sendInterviewRequest } from "../services/interviewApi";
import candidatesData from "../data/candidates.json";
import type {
  Difficulty,
  InterviewCandidateRecord,
  InterviewConfig,
  InterviewDuration,
  InterviewType,
  InterviewApiResponse,
} from "../types/interview";

const candidateOptions = candidatesData.candidates as InterviewCandidateRecord[];

type SetupStep = 1 | 2 | 3 | 4;

type SetupErrors = {
  selectedCandidate?: string;
  interviewType?: string;
  difficulty?: string;
  duration?: string;
  resume?: string;
};

const initialInterviewType = "" as "" | InterviewType;

function formatRoleLabel(targetRole: string) {
  return targetRole;
}

function validateStep1(values: { selectedCandidate: InterviewCandidateRecord | null }): SetupErrors {
  const errors: SetupErrors = {};

  if (!values.selectedCandidate) {
    errors.selectedCandidate = "Choose a candidate to continue.";
  }

  return errors;
}

function validateStep2(values: {
  interviewType: "" | InterviewType;
  difficulty: Difficulty;
  duration: InterviewDuration;
}): SetupErrors {
  const errors: SetupErrors = {};

  if (!values.interviewType) {
    errors.interviewType = "Choose an interview type.";
  }

  if (!values.difficulty) {
    errors.difficulty = "Choose a difficulty level.";
  }

  if (!values.duration) {
    errors.duration = "Choose an interview duration.";
  }

  return errors;
}

function validateStep3(resume: File | null, resumeError: string | null): SetupErrors {
  const errors: SetupErrors = {};

  if (resumeError) {
    errors.resume = resumeError;
  }

  if (resume && resume.type !== "application/pdf") {
    errors.resume = "Please upload a PDF resume.";
  }

  if (resume && resume.size > 5 * 1024 * 1024) {
    errors.resume = "Resume must be 5 MB or smaller.";
  }

  return errors;
}

export function InterviewSetupPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<SetupStep>(1);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(candidateOptions[0]?.member.id ?? "");
  const [interviewType, setInterviewType] = useState<InterviewType>("technical");
  const [difficulty, setDifficulty] = useState<Difficulty>("adaptive");
  const [duration, setDuration] = useState<InterviewDuration>(20);
  const [resume, setResume] = useState<File | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  const selectedCandidate = candidateOptions.find((item) => item.member.id === selectedCandidateId) ?? null;
  const step1Errors = validateStep1({ selectedCandidate });
  const step2Errors = validateStep2({ interviewType, difficulty, duration });
  const step3Errors = validateStep3(resume, resumeError);
  const canProceedStep1 = Object.keys(step1Errors).length === 0;
  const canProceedStep2 = Object.keys(step2Errors).length === 0;
  const canProceedStep3 = Object.keys(step3Errors).length === 0;

  const resumeLabel = useMemo(() => {
    if (!resume) {
      return "No resume uploaded";
    }

    return `${resume.name} • ${(resume.size / (1024 * 1024)).toFixed(1)} MB`;
  }, [resume]);

  const config: InterviewConfig = {
    candidateName: selectedCandidate?.member.name ?? "",
    targetRole: selectedCandidate?.member.jobRole ?? "",
    customRole: undefined,
    experienceLevel: selectedCandidate?.member.yearsExperience ? (selectedCandidate.member.yearsExperience < 2 ? "beginner" : selectedCandidate.member.yearsExperience < 6 ? "intermediate" : "advanced") : "beginner",
    interviewType,
    difficulty,
    duration,
    resume: resume ?? undefined,
  };

  const canNavigateToStep = (step: number) => {
    if (step < currentStep) {
      return true;
    }

    if (step === currentStep + 1) {
      if (currentStep === 1) {
        return canProceedStep1;
      }

      if (currentStep === 2) {
        return canProceedStep2;
      }

      if (currentStep === 3) {
        return canProceedStep3;
      }
    }

    return step === currentStep;
  };

  const handleResumeSelect = (file: File | null) => {
    if (!file) {
      setResume(null);
      setResumeError(null);
      return;
    }

    const validationMessage = validateResumeFile(file);
    if (validationMessage) {
      setResume(null);
      setResumeError(validationMessage);
      return;
    }

    setResume(file);
    setResumeError(null);
  };

  const handleNext = () => {
    setSubmittedOnce(true);

    if (currentStep === 1 && !canProceedStep1) {
      return;
    }

    if (currentStep === 2 && !canProceedStep2) {
      return;
    }

    if (currentStep === 3 && !canProceedStep3) {
      return;
    }

    if (currentStep < 4) {
      setCurrentStep((step) => (step + 1) as SetupStep);
    }
  };

  const handleStartInterview = async () => {
    setSubmittedOnce(true);

    if (!canProceedStep1 || !canProceedStep2 || !canProceedStep3 || isStarting || !selectedCandidate) {
      return;
    }

    const sessionId = crypto.randomUUID();
    const startPayload = {
      sessionId,
      candidate: selectedCandidate,
    };

    setIsStarting(true);
    setStartError(null);

    try {
      const response: InterviewApiResponse = await sendInterviewRequest(startPayload);
      // persist session to sessionStorage so the session can be resumed after refresh
      const sessionPayload = {
        sessionId,
        candidate: selectedCandidate,
        messages: [
          {
            id: `${sessionId}-interviewer-1`,
            role: "interviewer",
            text: response.reply,
          },
        ],
        isCompleted: response.done,
        feedback: response.feedback ?? null,
        currentQuestion: response.question ?? null,
        plan: response.plan ?? null,
        coveredDays: response.coveredDays ?? [],
      };

      try {
        sessionStorage.setItem(`interview.session.${sessionId}`, JSON.stringify(sessionPayload));
      } catch (e) {
        // ignore storage errors
      }

      navigate(`/interview/session/${sessionId}`, { state: sessionPayload });
    } catch (error) {
      setStartError(error instanceof Error ? error.message : "Unable to start the interview session.");
    } finally {
      setIsStarting(false);
    }
  };

  const renderStep = () => {
    if (currentStep === 1) {
      return (
        <section className="space-y-6">
          <div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Select a candidate</h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
              Choose a real candidate from the training data. InterviewX will use their profile for the session.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {candidateOptions.map((candidate) => {
              const selected = candidate.member.id === selectedCandidateId;
              return (
                <button
                  key={candidate.member.id}
                  type="button"
                  onClick={() => setSelectedCandidateId(candidate.member.id)}
                  className={`rounded-[1.5rem] border px-5 py-5 text-left transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 ${
                    selected
                      ? "border-slate-950 bg-slate-950 text-white shadow-[0_18px_50px_-30px_rgba(15,23,42,0.65)]"
                      : "border-slate-200 bg-white text-slate-950 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_14px_36px_-24px_rgba(15,23,42,0.18)]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold">{candidate.member.name}</p>
                      <p className="mt-2 text-sm text-slate-400">{candidate.member.jobRole}</p>
                    </div>
                    <span className="text-xs uppercase tracking-[0.28em] text-slate-400">{candidate.member.yearsExperience} yrs</span>
                  </div>
                  <div className="mt-4 text-sm leading-7 text-slate-600">
                    <p>{candidate.member.education}</p>
                    <p className="mt-2 text-slate-500">{candidate.signals.missionsCompleted} missions completed</p>
                  </div>
                </button>
              );
            })}
          </div>

          {submittedOnce && step1Errors.selectedCandidate ? (
            <p className="text-sm text-rose-600">{step1Errors.selectedCandidate}</p>
          ) : null}
        </section>
      );
    }

    if (currentStep === 2) {
      return (
        <PreferencesStep
          interviewType={interviewType}
          difficulty={difficulty}
          duration={duration}
          onInterviewTypeChange={setInterviewType}
          onDifficultyChange={setDifficulty}
          onDurationChange={setDuration}
          errors={submittedOnce ? step2Errors : {}}
        />
      );
    }

    if (currentStep === 3) {
      return <ResumeUpload file={resume} error={submittedOnce ? step3Errors.resume : resumeError ?? undefined} onFileSelect={handleResumeSelect} />;
    }

    return <ReviewStep config={config} resumeLabel={resumeLabel} targetRoleLabel={formatRoleLabel(config.targetRole)} />;
  };

  const primaryDisabled =
    (currentStep === 1 && !canProceedStep1) ||
    (currentStep === 2 && !canProceedStep2) ||
    (currentStep === 3 && !canProceedStep3);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.06),_transparent_34%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] text-slate-950">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.38fr] lg:items-start">
          <section className="rounded-[2rem] border border-slate-200 bg-white/95 p-5 shadow-[0_18px_60px_-38px_rgba(15,23,42,0.28)] sm:p-6 lg:p-8">
            <div className="flex flex-col gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.36em] text-slate-500">InterviewX</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Interview setup</h1>
                <p className="mt-3 max-w-2xl text-base leading-8 text-slate-600">
                  Build your candidate profile, pick interview preferences, and review the configuration before the session begins.
                </p>
              </div>
              <ButtonLink to="/" variant="secondary" className="w-full sm:w-auto">
                Back to landing
              </ButtonLink>
            </div>

            <div className="mt-6">
              <SetupStepper currentStep={currentStep} onStepSelect={(step) => setCurrentStep(step as SetupStep)} canNavigateToStep={canNavigateToStep} />
            </div>

            <div className="mt-8">{renderStep()}</div>

            <div className="mt-10 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-500">
                {currentStep === 1 ? "Step 1 of 4" : currentStep === 2 ? "Step 2 of 4" : currentStep === 3 ? "Step 3 of 4" : "Step 4 of 4"}
                <span className="ml-2 text-slate-400">•</span>
                <span className="ml-2">{currentStep < 4 ? "Complete this step to continue." : "Ready to start the interview session."}</span>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setCurrentStep((step) => Math.max(1, step - 1) as SetupStep)}
                  disabled={currentStep === 1}
                  className="w-full sm:w-auto"
                >
                  Back
                </Button>
                {currentStep < 4 ? (
                  <Button type="button" onClick={handleNext} disabled={primaryDisabled} className="w-full sm:w-auto">
                    Next
                  </Button>
                ) : (
                  <Button type="button" onClick={handleStartInterview} disabled={!canProceedStep1 || !canProceedStep2 || !canProceedStep3 || isStarting} className="w-full sm:w-auto">
                    {isStarting ? "Starting..." : "Start Interview"}
                  </Button>
                )}
              </div>
            </div>

            {startError ? <p className="mt-4 text-sm text-rose-600">{startError}</p> : null}
          </section>

          <aside className="space-y-4 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_18px_60px_-38px_rgba(15,23,42,0.2)] sm:p-6 lg:sticky lg:top-24">
            <p className="text-xs font-semibold uppercase tracking-[0.36em] text-slate-500">Setup summary</p>
            <div className="space-y-4 text-sm leading-7 text-slate-600">
              <p>
                InterviewX keeps setup lightweight while collecting the exact configuration needed for the future adaptive interview engine.
              </p>
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Current selection</p>
                <div className="mt-3 space-y-2 text-slate-950">
                  <p><span className="font-medium">Candidate:</span> {selectedCandidate?.member.name ?? "Not set"}</p>
                  <p><span className="font-medium">Role:</span> {selectedCandidate?.member.jobRole ?? "Not set"}</p>
                  <p><span className="font-medium">Experience:</span> {config.experienceLevel}</p>
                  <p><span className="font-medium">Type:</span> {interviewType}</p>
                  <p><span className="font-medium">Difficulty:</span> {difficulty}</p>
                  <p><span className="font-medium">Duration:</span> {duration} minutes</p>
                  <p><span className="font-medium">Resume:</span> {resume ? resume.name : "Optional"}</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
