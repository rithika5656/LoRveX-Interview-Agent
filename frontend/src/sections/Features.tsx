import { SectionHeading } from "../components/SectionHeading";
import { FeatureCard } from "../components/FeatureCard";

const features = [
  ["Resume-aware interviews", "Uses uploaded resume context to shape the opening and the follow-up path."],
  ["Adaptive questioning", "Responds to answer quality rather than moving through a fixed script."],
  ["Role-specific interviews", "Keeps the conversation aligned with the selected role and interview type."],
  ["Difficulty adjustment", "Can ease up or push harder based on observed performance signals."],
  ["Interview memory", "Tracks what has already been covered so questions do not repeat."],
  ["AI evaluation", "Produces structured feedback after each answer and at the end of the session."],
  ["Personalized feedback", "Highlights strengths, weaknesses, and practical improvement areas."],
  ["Performance analytics", "Surfaces topic-level performance and overall interview progression."],
] as const;

export function Features() {
  return (
    <section id="features" className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Features"
          title="Focused on the parts that make interviews feel intelligent."
          description="Every visible feature is designed to support the adaptive interview core without pretending the product is more complete than it is."
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {features.map(([title, description]) => (
            <FeatureCard key={title} title={title} description={description} />
          ))}
        </div>
      </div>
    </section>
  );
}
