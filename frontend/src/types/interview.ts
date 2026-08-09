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

export interface InterviewCandidateMember {
  id: string;
  name: string;
  jobRole: string;
  yearsExperience: number;
  education: string;
  status?: string;
}

export interface InterviewCandidateMission {
  day: number;
  title: string;
  passed?: boolean;
  skipped?: boolean;
  attempts?: number;
}

export interface InterviewCandidateSignals {
  commitDays: number;
  missionsCompleted: number;
  missionsFirstTry: number;
}

export interface InterviewCandidateRecord {
  member: InterviewCandidateMember;
  missions: InterviewCandidateMission[];
  signals: InterviewCandidateSignals;
}

export interface InterviewStartRequest {
  sessionId: string;
  candidate: InterviewCandidateRecord;
}

export interface InterviewContinueRequest {
  sessionId: string;
  message: string;
}

export interface FinalFeedback {
  // Phase 8 structured feedback (backend uses snake_case keys)
  interview_summary?: string;
  overall_score?: number;
  technical_strengths?: string[];
  knowledge_gaps?: string[];
  curriculum_coverage?: Record<string, number> | number[];
  communication_assessment?: string;
  problem_solving_assessment?: string;
  engineering_depth?: string;
  recommendations?: string[];
  topics_to_revise?: string[];
  // legacy compatibility
  strengths?: string[];
  gaps?: string[];
  next?: string[];
}

export interface InterviewApiResponse {
  reply: string;
  done: boolean;
  feedback?: FinalFeedback;
  // optional adaptive/phase8 fields (some backends return structured next state)
  next?: InterviewAnswerNextState;
  question?: InterviewQuestion;
  coveredDays?: number[];
  plan?: InterviewPlan;
}

export interface InterviewSessionNavigationState {
  sessionId: string;
  candidate: InterviewCandidateRecord;
  messages: Array<{ id: string; role: "interviewer" | "candidate"; text: string }>;
  isCompleted: boolean;
  feedback?: FinalFeedback;
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
  // Phase 8 metadata
  curriculumDay?: number | null;
  module?: string | null;
  topic?: string | null;
  learningObjective?: string | null;
  questionType?: string | null;
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
