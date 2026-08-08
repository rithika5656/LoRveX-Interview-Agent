type AgentCardProps = {
  title: string;
  description: string;
  accent: string;
};

export function AgentCard({ title, description, accent }: AgentCardProps) {
  return (
    <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_-28px_rgba(15,23,42,0.32)]">
      <div className="flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-base font-semibold text-slate-950">
          {accent}
        </div>
        <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium uppercase tracking-[0.28em] text-slate-500">
          Agent
        </span>
      </div>
      <h3 className="mt-5 text-lg font-semibold tracking-tight text-slate-950">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
      <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full w-1/2 rounded-full bg-slate-950/85" />
      </div>
    </article>
  );
}
