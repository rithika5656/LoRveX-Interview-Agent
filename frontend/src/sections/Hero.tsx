import { Button, ButtonLink } from "../components/Button";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-12 sm:pt-16 lg:pt-20">
      <div className="absolute inset-x-0 top-0 -z-10 h-64 bg-[radial-gradient(circle_at_top,rgba(15,23,42,0.08),transparent_62%)]" />
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:px-8">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-slate-400 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-slate-900" />
            </span>
            Adaptive interview intelligence
          </div>

          <div className="space-y-6">
            <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
              Meet your next interviewer.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
              InterviewX conducts adaptive AI interviews that understand your answers, challenge your
              thinking, and give you actionable feedback.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <ButtonLink to="/interview/setup" className="px-6 py-3.5 text-sm sm:text-base">
              Start an Interview
            </ButtonLink>
            <Button variant="secondary" className="px-6 py-3.5 text-sm sm:text-base" onClick={() => {
              document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}>
              See How It Works
            </Button>
          </div>

          <div className="grid gap-4 border-t border-slate-200 pt-8 sm:grid-cols-3">
            {[
              ["Resume-aware", "Understands candidate context before the first question."],
              ["Adaptive", "Each answer influences what comes next."],
              ["Actionable", "Every session ends with a report you can use."],
            ].map(([title, text]) => (
              <div key={title} className="space-y-2">
                <p className="text-sm font-semibold text-slate-950">{title}</p>
                <p className="text-sm leading-6 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute -right-4 top-10 hidden h-24 w-24 rounded-full bg-slate-200/60 blur-3xl lg:block" />
          <div className="float-slow rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.35)]">
            <div className="rounded-[1.6rem] bg-slate-950 p-6 text-white">
              <div className="flex items-center justify-between text-sm text-slate-300">
                <span>InterviewX AI Interviewer</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.28em]">
                  Live
                </span>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <span>Question 04</span>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-slate-100">
                    Hard
                  </span>
                </div>
                <p className="text-2xl font-medium leading-relaxed text-white sm:text-[1.55rem]">
                  “How would you optimize this API for 100K concurrent users?”
                </p>

                <div className="space-y-2 rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between text-sm text-slate-300">
                    <span>Candidate performance</span>
                    <span>78%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-[78%] rounded-full bg-white transition-all" />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                  <span>Adaptive difficulty</span>
                  <span className="font-semibold uppercase tracking-[0.22em] text-white">Hard</span>
                </div>

                <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                  <span className="flex gap-1.5">
                    <span className="typing-dot" />
                    <span className="typing-dot typing-dot-delay" />
                    <span className="typing-dot typing-dot-delay-more" />
                  </span>
                  <span>AI is preparing your next question…</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
