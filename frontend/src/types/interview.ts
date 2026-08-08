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

export interface InterviewSessionState {
  config: InterviewConfig;
}
