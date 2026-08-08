import type { InterviewConfig } from "../../types/interview";

type ReviewStepProps = {
  config: InterviewConfig;
  resumeLabel: string;
  targetRoleLabel: string;
};

export function ReviewStep({ config, resumeLabel, targetRoleLabel }: ReviewStepProps) {
  const roleLabel = targetRoleLabel;

  return (
    <section className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.38em] text-slate-500">Step 4</p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Review</h2>
        <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
          Confirm your settings before InterviewX creates your interview session.
        </p>
      </div>

      <div className="grid gap-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_-28px_rgba(15,23,42,0.22)] sm:p-8">
        {[
          ["Candidate", config.candidateName],
          ["Target Role", roleLabel],
          ["Experience", config.experienceLevel],
          ["Interview Type", config.interviewType],
          ["Difficulty", config.difficulty],
          ["Duration", `${config.duration} minutes`],
          ["Resume", resumeLabel],
        ].map(([label, value]) => (
          <div key={label} className="flex items-start justify-between gap-6 border-b border-slate-100 pb-4 last:border-b-0 last:pb-0">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-slate-500">{label}</p>
            </div>
            <p className="text-right text-sm font-medium text-slate-950 sm:text-base">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
