import type { ExperienceLevel } from "../../types/interview";
import { SelectionCard } from "./SelectionCard";

type ProfileStepProps = {
  candidateName: string;
  targetRole: string;
  customRole: string;
  experienceLevel: "" | ExperienceLevel;
  roleOptions: Array<{ value: string; label: string }>;
  onCandidateNameChange: (value: string) => void;
  onTargetRoleChange: (value: string) => void;
  onCustomRoleChange: (value: string) => void;
  onExperienceLevelChange: (value: "" | ExperienceLevel) => void;
  errors: {
    candidateName?: string;
    targetRole?: string;
    customRole?: string;
    experienceLevel?: string;
  };
};

export function ProfileStep({
  candidateName,
  targetRole,
  customRole,
  experienceLevel,
  roleOptions,
  onCandidateNameChange,
  onTargetRoleChange,
  onCustomRoleChange,
  onExperienceLevelChange,
  errors,
}: ProfileStepProps) {
  return (
    <section className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.38em] text-slate-500">Step 1</p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Candidate profile</h2>
        <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
          Tell InterviewX who you are and what role you want to practice for.
        </p>
      </div>

      <div className="grid gap-6">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Full name</span>
          <input
            value={candidateName}
            onChange={(event) => onCandidateNameChange(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 shadow-sm transition placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
            placeholder="Enter your full name"
            autoComplete="name"
          />
          {errors.candidateName ? <span className="text-sm text-rose-600">{errors.candidateName}</span> : null}
        </label>

        <div className="grid gap-3">
          <span className="text-sm font-medium text-slate-700">Target role</span>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {roleOptions.map((option) => (
              <SelectionCard
                key={option.value}
                title={option.label}
                selected={targetRole === option.value}
                onSelect={() => onTargetRoleChange(option.value)}
              />
            ))}
          </div>
          {errors.targetRole ? <span className="text-sm text-rose-600">{errors.targetRole}</span> : null}
        </div>

        {targetRole === "custom" ? (
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Custom role</span>
            <input
              value={customRole}
              onChange={(event) => onCustomRoleChange(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 shadow-sm transition placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
              placeholder="Describe your target role"
            />
            {errors.customRole ? <span className="text-sm text-rose-600">{errors.customRole}</span> : null}
          </label>
        ) : null}

        <div className="grid gap-3">
          <span className="text-sm font-medium text-slate-700">Experience level</span>
          <div className="grid gap-3 sm:grid-cols-3">
            {([
              ["beginner", "Beginner", "Building fundamentals and learning patterns."] ,
              ["intermediate", "Intermediate", "Comfortable with core concepts and some depth."] ,
              ["advanced", "Advanced", "Strong technical fluency and strategic thinking."] ,
            ] as const).map(([value, label, description]) => (
              <SelectionCard
                key={value}
                title={label}
                description={description}
                selected={experienceLevel === value}
                onSelect={() => onExperienceLevelChange(value)}
              />
            ))}
          </div>
          {errors.experienceLevel ? <span className="text-sm text-rose-600">{errors.experienceLevel}</span> : null}
        </div>
      </div>
    </section>
  );
}
