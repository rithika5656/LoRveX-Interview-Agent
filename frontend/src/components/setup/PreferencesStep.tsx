import type { Difficulty, InterviewDuration, InterviewType } from "../../types/interview";
import { SelectionCard } from "./SelectionCard";

type PreferencesStepProps = {
  interviewType: "" | InterviewType;
  difficulty: Difficulty;
  duration: InterviewDuration;
  onInterviewTypeChange: (value: "" | InterviewType) => void;
  onDifficultyChange: (value: Difficulty) => void;
  onDurationChange: (value: InterviewDuration) => void;
  errors: {
    interviewType?: string;
    difficulty?: string;
    duration?: string;
  };
};

const interviewTypes = [
  { value: "technical", label: "Technical", icon: "⌘", description: "Core skills, systems, and problem solving." },
  { value: "behavioral", label: "Behavioral", icon: "◌", description: "Situations, teamwork, and judgment." },
  { value: "hr", label: "HR", icon: "◈", description: "Communication, motivation, and fit." },
  { value: "mixed", label: "Mixed", icon: "◎", description: "A balanced blend of the above." },
] as const;

const difficultyOptions = ["easy", "medium", "hard", "adaptive"] as const;
const durationOptions = [10, 20, 30] as const;

export function PreferencesStep({
  interviewType,
  difficulty,
  duration,
  onInterviewTypeChange,
  onDifficultyChange,
  onDurationChange,
  errors,
}: PreferencesStepProps) {
  return (
    <section className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.38em] text-slate-500">Step 2</p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Interview preferences</h2>
        <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
          Choose the type and intensity of the interview experience.
        </p>
      </div>

      <div className="grid gap-6">
        <div className="grid gap-3">
          <span className="text-sm font-medium text-slate-700">Interview type</span>
          <div className="grid gap-3 xl:grid-cols-2">
            {interviewTypes.map((option) => (
              <SelectionCard
                key={option.value}
                title={option.label}
                description={option.description}
                icon={option.icon}
                selected={interviewType === option.value}
                onSelect={() => onInterviewTypeChange(option.value)}
              />
            ))}
          </div>
          {errors.interviewType ? <span className="text-sm text-rose-600">{errors.interviewType}</span> : null}
        </div>

        <div className="grid gap-3">
          <span className="text-sm font-medium text-slate-700">Difficulty</span>
          <p className="text-sm text-slate-500">InterviewX adjusts difficulty based on your performance.</p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {difficultyOptions.map((option) => (
              <SelectionCard
                key={option}
                title={option[0].toUpperCase() + option.slice(1)}
                selected={difficulty === option}
                onSelect={() => onDifficultyChange(option)}
              />
            ))}
          </div>
          {errors.difficulty ? <span className="text-sm text-rose-600">{errors.difficulty}</span> : null}
        </div>

        <div className="grid gap-3">
          <span className="text-sm font-medium text-slate-700">Duration</span>
          <div className="grid gap-3 sm:grid-cols-3">
            {durationOptions.map((option) => (
              <SelectionCard
                key={option}
                title={`${option} minutes`}
                selected={duration === option}
                onSelect={() => onDurationChange(option)}
              />
            ))}
          </div>
          {errors.duration ? <span className="text-sm text-rose-600">{errors.duration}</span> : null}
        </div>
      </div>
    </section>
  );
}
