import { ButtonLink } from "../components/Button";

export function CTA() {
  return (
    <section className="border-t border-slate-200 bg-slate-950 py-20 text-white sm:py-24">
      <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.38em] text-slate-400">Ready for the next phase</p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
          Stop practicing questions. Start practicing thinking.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
          Experience an interview that adapts to you.
        </p>
        <div className="mt-10 flex justify-center">
          <ButtonLink to="/interview/setup" className="px-7 py-3.5 text-sm sm:text-base">
            Start Your Interview
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
