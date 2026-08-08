import { SectionHeading } from "../components/SectionHeading";
import { AgentCard } from "../components/AgentCard";

const agents = [
  {
    title: "Interview Planner",
    description: "Designs the interview strategy from role, resume context, and selected difficulty.",
    accent: "P",
  },
  {
    title: "Interviewer",
    description: "Conducts the conversation one question at a time and keeps the flow professional.",
    accent: "I",
  },
  {
    title: "Evaluator",
    description: "Analyzes answer quality across correctness, depth, relevance, and communication.",
    accent: "E",
  },
  {
    title: "Follow-up Agent",
    description: "Decides when to probe deeper, clarify, or move to a harder or easier path.",
    accent: "F",
  },
  {
    title: "Report Agent",
    description: "Turns the interview session into actionable feedback and summary insights.",
    accent: "R",
  },
];

export function Agents() {
  return (
    <section id="agents" className="border-t border-slate-200 bg-slate-50/70 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="AI agents"
          title="Not one AI. A team of interview agents."
          description="The product concept is intentionally modular so each agent can evolve independently as the platform grows."
        />

        <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {agents.map((agent) => (
            <AgentCard key={agent.title} {...agent} />
          ))}
        </div>
      </div>
    </section>
  );
}
