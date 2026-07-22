import { useEffect } from 'react'
import { ScrollTrigger } from '../lib/gsap'
import LandingNav from '../components/home/shared/LandingNav'
import ScrollProgressBar from '../components/home/shared/ScrollProgressBar'
import GrainOverlay from '../components/home/shared/GrainOverlay'
import HeroSection from '../components/home/HeroSection'
import ComplianceMarquee from '../components/home/ComplianceMarquee'
import AgentsSection from '../components/home/AgentsSection'
import FeaturesSection from '../components/home/FeaturesSection'
import HowItWorksSection from '../components/home/HowItWorksSection'
import TerminalSection from '../components/home/TerminalSection'
import StatsSection from '../components/home/StatsSection'
import PricingSection from '../components/home/PricingSection'
import FinalCTASection from '../components/home/FinalCTASection'
import Footer from '../components/Footer'

export default function Home() {
  // Recompute trigger positions once fonts/images/lazy 3D have settled.
  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh()
    window.addEventListener('load', refresh)
    const t = window.setTimeout(refresh, 800)
    return () => {
      window.removeEventListener('load', refresh)
      window.clearTimeout(t)
    }
  }, [])

  return (
    <div className="relative min-h-[100dvh] bg-bg-base">
      <ScrollProgressBar />
      <GrainOverlay />
      <LandingNav />
      <HeroSection />
      <ComplianceMarquee />
      <AgentsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TerminalSection />
      <StatsSection />
      <PricingSection />
      <FinalCTASection />
      <Footer />
    </div>
  )
}
