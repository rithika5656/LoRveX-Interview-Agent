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

export interface InterviewSessionApiResponse {
  sessionId: string;
  status: "created";
  configuration: InterviewSetupPayload;
}
