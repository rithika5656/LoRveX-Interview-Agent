import { ButtonLink } from "../components/Button";

export function InterviewSetupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-950">
      <section className="w-full max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-[0_20px_60px_-34px_rgba(15,23,42,0.28)] sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.38em] text-slate-500">Interview setup</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Interview setup coming next</h1>
        <p className="mt-4 text-base leading-8 text-slate-600">
          The navigation route is ready for Phase 3, where the actual interview setup form and resume upload flow will be added.
        </p>
        <div className="mt-8 flex justify-center">
          <ButtonLink to="/" variant="secondary">
            Back to landing
          </ButtonLink>
        </div>
      </section>
    </main>
  );
}
