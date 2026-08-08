import { SectionHeading } from "../components/SectionHeading";

const problems = [
  {
    title: "Static Questions",
    description: "Traditional platforms follow fixed question lists instead of responding to candidate performance.",
  },
  {
    title: "Limited Context",
    description: "They don't understand why a candidate gave an answer or what topic should come next.",
  },
  {
    title: "Generic Feedback",
    description: "Candidates receive scores without the nuance needed to improve meaningfully.",
  },
];

export function Problem() {
  return (
    <section className="border-t border-slate-200 bg-slate-50/70 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Why InterviewX"
          title="Most interview platforms test memory. InterviewX tests thinking."
          description="The experience is designed to adapt around the candidate instead of forcing the candidate into a fixed script."
        />

        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {problems.map((problem, index) => (
            <article key={problem.title} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_-28px_rgba(15,23,42,0.2)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.34em] text-slate-500">0{index + 1}</span>
                <span className="h-2 w-2 rounded-full bg-slate-400" />
              </div>
              <h3 className="mt-6 text-xl font-semibold tracking-tight text-slate-950">{problem.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{problem.description}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white px-6 py-5 text-sm leading-7 text-slate-700 shadow-[0_12px_40px_-30px_rgba(15,23,42,0.22)]">
          <span className="font-semibold text-slate-950">InterviewX adapts the interview around you.</span>
          <span className="ml-2">That means the platform can probe deeper, shift difficulty, and keep the conversation grounded in the candidate&apos;s answers.</span>
        </div>
      </div>
    </section>
  );
}
