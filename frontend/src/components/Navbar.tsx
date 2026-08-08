import { useState } from "react";
import { ButtonLink } from "./Button";

const links = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "AI Agents", href: "#agents" },
  { label: "Features", href: "#features" },
  { label: "About", href: "#about" },
];

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/92 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <a href="#top" className="group inline-flex items-center gap-3 text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-950 text-sm font-semibold tracking-[0.24em] text-white shadow-sm transition group-hover:scale-[1.02]">
            IX
          </span>
          <span>
            <span className="block text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">LoRveX</span>
            <span className="block text-lg font-semibold tracking-tight text-slate-950">InterviewX</span>
          </span>
        </a>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-slate-600 transition hover:text-slate-950 focus-visible:outline-none focus-visible:text-slate-950"
            >
              {link.label}
            </a>
          ))}
          <ButtonLink to="/interview/setup" variant="primary" className="px-5 py-2.5 text-sm">
            Start Interview
          </ButtonLink>
        </nav>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 lg:hidden"
          aria-expanded={menuOpen}
          aria-label="Toggle navigation menu"
          onClick={() => setMenuOpen((value) => !value)}
        >
          <span className="sr-only">Toggle menu</span>
          <span className="text-xl leading-none">☰</span>
        </button>
      </div>

      {menuOpen ? (
        <div className="border-t border-slate-200 bg-white lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 sm:px-6" aria-label="Mobile primary">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="rounded-2xl px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <ButtonLink to="/interview/setup" variant="primary" className="mt-2 w-full">
              Start Interview
            </ButtonLink>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
