type FeatureCardProps = {
  title: string;
  description: string;
};

export function FeatureCard({ title, description }: FeatureCardProps) {
  return (
    <article className="group rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_-26px_rgba(15,23,42,0.28)] transition duration-200 hover:-translate-y-1 hover:border-slate-300">
      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white transition group-hover:scale-[1.02]">
        •
      </div>
      <h3 className="text-lg font-semibold tracking-tight text-slate-950">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
    </article>
  );
}
