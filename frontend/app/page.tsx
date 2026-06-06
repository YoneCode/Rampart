import { Nav } from "@/components/landing/Nav";
import { Hero } from "@/components/landing/Hero";
import { OnChainActivity } from "@/components/landing/OnChainActivity";
import { Problem } from "@/components/landing/Problem";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { Architecture } from "@/components/landing/Architecture";
import { LiveOnChain } from "@/components/landing/LiveOnChain";
import { Faq } from "@/components/landing/Faq";
import { CtaFooter } from "@/components/landing/CtaFooter";

export default function Landing() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-black">
      <Nav />
      <main>
        <Hero />
        <OnChainActivity />
        <Problem />
        <HowItWorks />
        <Features />
        <Architecture />
        <LiveOnChain />
        <Faq />
        <CtaFooter />
      </main>
    </div>
  );
}
