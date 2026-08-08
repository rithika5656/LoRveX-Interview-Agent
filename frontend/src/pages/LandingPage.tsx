import { Navbar } from "../components/Navbar";
import { Hero } from "../sections/Hero";
import { Problem } from "../sections/Problem";
import { HowItWorks } from "../sections/HowItWorks";
import { Agents } from "../sections/Agents";
import { AdaptiveInterview } from "../sections/AdaptiveInterview";
import { Features } from "../sections/Features";
import { DemoPreview } from "../sections/DemoPreview";
import { CTA } from "../sections/CTA";
import { Footer } from "../components/Footer";

export function LandingPage() {
  return (
    <div id="top" className="overflow-x-hidden bg-white text-slate-950">
      <Navbar />
      <main>
        <Hero />
        <Problem />
        <HowItWorks />
        <Agents />
        <AdaptiveInterview />
        <Features />
        <DemoPreview />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
