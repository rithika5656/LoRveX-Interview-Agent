const steps = ["Profile", "Preferences", "Resume", "Review"] as const;

type SetupStepperProps = {
  currentStep: number;
  onStepSelect?: (step: number) => void;
  canNavigateToStep?: (step: number) => boolean;
};

export function SetupStepper({ currentStep, onStepSelect, canNavigateToStep }: SetupStepperProps) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-[0_12px_40px_-28px_rgba(15,23,42,0.22)] sm:p-5">
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = currentStep === stepNumber;
          const isComplete = currentStep > stepNumber;

          return (
            <button
              key={step}
              type="button"
              onClick={() => onStepSelect?.(stepNumber)}
              disabled={!onStepSelect || (canNavigateToStep ? !canNavigateToStep(stepNumber) : false)}
              className={`rounded-2xl border px-3 py-3 text-center text-sm transition ${
                isActive
                  ? "border-slate-950 bg-slate-950 text-white"
                  : isComplete
                    ? "border-slate-200 bg-slate-50 text-slate-950"
                    : "border-slate-200 bg-white text-slate-500"
              }`}
            >
              <div className="text-xs font-semibold uppercase tracking-[0.28em] opacity-80">
                0{stepNumber}
              </div>
              <div className="mt-2 font-medium">{step}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
