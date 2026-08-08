import { SectionHeading } from "../components/SectionHeading";

const flow = ["Candidate Answer", "AI Evaluation", "Performance Signal", "Adaptive Decision", "Next Question"];

export function AdaptiveInterview() {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Core innovation"
          title="Your answer changes the next question."
          description="This is the central experience the hackathon judges should be able to understand in a few seconds."
          centered
        />

        <div className="mt-12 grid gap-4 xl:grid-cols-[0.9fr_1.1fr] xl:items-center">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-32px_rgba(15,23,42,0.28)]">
            <div className="space-y-4">
              {flow.map((item, index) => (
                <div key={item} className="flex items-center gap-4 rounded-2xl border border-slate-200 px-4 py-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm font-medium text-slate-700">{item}</span>
                  <span className="ml-auto text-slate-300">↓</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-8 text-white shadow-[0_24px_80px_-44px_rgba(15,23,42,0.35)]">
            <p className="text-xs uppercase tracking-[0.34em] text-slate-400">Example</p>
            <div className="mt-6 space-y-5 text-base leading-8 text-slate-200 sm:text-lg">
              <p>
                <span className="font-semibold text-white">Candidate:</span> “Indexes improve database query
                performance.”
              </p>
              <p>
                <span className="font-semibold text-white">AI:</span> Good foundation. Let&apos;s go deeper.
              </p>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Next question</p>
                <p className="mt-3 text-xl text-white">
                  “When can an index actually hurt database performance?”
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
