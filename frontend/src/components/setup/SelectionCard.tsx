type SelectionCardProps = {
  title: string;
  description?: string;
  selected: boolean;
  icon?: string;
  onSelect: () => void;
};

export function SelectionCard({ title, description, selected, icon, onSelect }: SelectionCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-[1.5rem] border px-4 py-4 text-left transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 ${
        selected
          ? "border-slate-950 bg-slate-950 text-white shadow-[0_18px_50px_-30px_rgba(15,23,42,0.65)]"
          : "border-slate-200 bg-white text-slate-950 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_14px_36px_-24px_rgba(15,23,42,0.18)]"
      }`}
      aria-pressed={selected}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          {icon ? <div className={`text-lg ${selected ? "text-white" : "text-slate-500"}`}>{icon}</div> : null}
          <p className={`text-base font-semibold ${selected ? "text-white" : "text-slate-950"}`}>{title}</p>
          {description ? <p className={`mt-2 text-sm leading-6 ${selected ? "text-slate-300" : "text-slate-600"}`}>{description}</p> : null}
        </div>
        <span className={`mt-1 h-3.5 w-3.5 rounded-full border ${selected ? "border-white bg-white" : "border-slate-300 bg-transparent"}`} />
      </div>
    </button>
  );
}
