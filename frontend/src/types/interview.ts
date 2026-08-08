export type ExperienceLevel = "beginner" | "intermediate" | "advanced";
export type InterviewType = "technical" | "behavioral" | "hr" | "mixed";
export type Difficulty = "easy" | "medium" | "hard" | "adaptive";
export type InterviewDuration = 10 | 20 | 30;

export interface InterviewConfig {
  candidateName: string;
  targetRole: string;
  customRole?: string;
  experienceLevel: ExperienceLevel;
  interviewType: InterviewType;
  difficulty: Difficulty;
  duration: InterviewDuration;
  resume?: File;
}

export interface InterviewSetupPayload {
  candidateName: string;
  targetRole: string;
  experienceLevel: ExperienceLevel;
  interviewType: InterviewType;
  difficulty: Difficulty;
  duration: InterviewDuration;
}

export interface InterviewCreationResponse {
  sessionId: string;
  status: "created";
  configuration: InterviewSetupPayload;
}

export interface InterviewSessionNavigationState {
  sessionId: string;
  configuration: InterviewSetupPayload;
  resumeLabel?: string | null;
}

export type InterviewSessionState = InterviewSessionNavigationState;

export interface InterviewPlanStage {
  name: string;
  focus: string;
}

export interface InterviewPlan {
  goal: string;
  stages: InterviewPlanStage[];
  difficulty: Difficulty | "adaptive";
  questionCount: number;
}

export interface InterviewQuestion {
  id: string;
  text: string;
  type: InterviewType;
  difficulty: Difficulty;
  stage?: string;
}

export interface InterviewStartApiResponse {
  sessionId: string;
  status: "started";
  plan: InterviewPlan;
  question: InterviewQuestion;
}

export interface InterviewSessionApiResponse {
  sessionId: string;
  status: "created";
  configuration: InterviewSetupPayload;
}

export interface InterviewAnswerSubmissionRequest {
  questionId: string;
  answer: string;
}

export interface InterviewEvaluation {
  questionId: string;
  score: number;
  assessment: string;
  strengths: string[];
  weaknesses: string[];
  feedback: string;
}

export interface InterviewAnswerNextState {
  action: "ask_question" | "clarify_answer" | "move_to_next_stage" | "finish_interview";
  stage?: string;
  difficulty?: Difficulty;
  focus?: string;
  reason?: string;
  question?: InterviewQuestion;
}

export interface InterviewAnswerSubmissionResponse {
  questionId: string;
  evaluation: InterviewEvaluation;
  next: InterviewAnswerNextState;
}
