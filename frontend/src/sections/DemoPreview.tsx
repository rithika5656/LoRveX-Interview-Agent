import { SectionHeading } from "../components/SectionHeading";

const metrics = [
  ["Technical", "82"],
  ["Problem Solving", "76"],
  ["Communication", "88"],
];

export function DemoPreview() {
  return (
    <section id="about" className="border-t border-slate-200 bg-slate-50/80 py-20 sm:py-24">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:px-8">
        <div>
          <SectionHeading
            eyebrow="Product preview"
            title="A mock interview workspace that shows the product direction."
            description="This preview is intentionally visual. It communicates the final experience before the real interactive interview flow arrives in the next phase."
          />
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_-44px_rgba(15,23,42,0.35)]">
          <div className="rounded-[1.6rem] border border-slate-200 bg-slate-950 p-6 text-white">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.34em] text-slate-400">Interview progress</p>
                <p className="mt-2 text-2xl font-semibold">6 / 10</p>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.28em] text-slate-200">
                Hard
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <p className="text-sm text-slate-300">Current Topic</p>
                <p className="mt-1 text-lg font-medium text-white">System Design</p>
              </div>
              <div>
                <p className="text-sm text-slate-300">Difficulty</p>
                <p className="mt-1 text-lg font-medium text-white">Hard</p>
              </div>
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <p className="text-sm uppercase tracking-[0.28em] text-slate-400">AI Interviewer</p>
              <p className="mt-4 text-xl leading-relaxed text-white">
                “How would you design a notification system capable of handling millions of users?”
              </p>
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Candidate Answer</p>
              <div className="mt-4 h-12 rounded-2xl border border-dashed border-white/15 bg-white/5" />
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {metrics.map(([label, value]) => (
                <div key={label} className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-slate-300">{label}</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
