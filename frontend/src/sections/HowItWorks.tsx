import { SectionHeading } from "../components/SectionHeading";
import { StepCard } from "../components/StepCard";

const steps = [
  {
    step: "01 — Understand",
    title: "AI analyzes your resume, role, and experience.",
    description: "The interview begins with context so the questions are aligned with the candidate's background and target role.",
  },
  {
    step: "02 — Interview",
    title: "The AI conducts a realistic interview.",
    description: "One question at a time. Professional, focused, and tailored to the chosen interview type.",
  },
  {
    step: "03 — Adapt",
    title: "Every answer influences what comes next.",
    description: "Follow-ups, difficulty changes, and topic shifts are driven by the previous response.",
  },
  {
    step: "04 — Improve",
    title: "Receive a detailed performance report.",
    description: "A concise summary of strengths, weak areas, and recommended learning topics closes the loop.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="How it works"
          title="A simple flow with one important twist: the next question is not fixed."
          description="InterviewX keeps the structure of a strong interview while adapting the path in response to the candidate's answers."
        />

        <div className="mt-12 grid gap-4 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div key={step.step} className="relative">
              <StepCard {...step} />
              {index < steps.length - 1 ? <div className="hidden lg:block absolute right-[-14px] top-1/2 h-px w-7 bg-slate-200" /> : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
