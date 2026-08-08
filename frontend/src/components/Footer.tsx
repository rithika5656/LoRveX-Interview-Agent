export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <p className="text-lg font-semibold tracking-tight text-slate-950">InterviewX</p>
          <p className="mt-2 text-sm text-slate-600">Autonomous AI interviewing for better preparation.</p>
        </div>
        <div className="flex flex-wrap items-center gap-5 text-sm text-slate-600">
          <a href="#how-it-works" className="transition hover:text-slate-950">
            How It Works
          </a>
          <a href="#features" className="transition hover:text-slate-950">
            Features
          </a>
          <a href="#agents" className="transition hover:text-slate-950">
            AI Agents
          </a>
          <span className="text-slate-400">Built by LoRveX</span>
        </div>
      </div>
    </footer>
  );
}
