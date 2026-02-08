import { Header } from "@/components/landing-page/Header"
import { HeroSection } from "@/components/landing-page/HeroSection"
import { ProblemSolutionSection } from "@/components/landing-page/ProblemSolutionSection"
import { AppScreenshotsSection } from "@/components/landing-page/AppScreenshotsSection"
import { TechStackSection } from "@/components/landing-page/TechStackSection"
import { Footer } from "@/components/landing-page/Footer"

export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <ProblemSolutionSection />
        <AppScreenshotsSection />
        <TechStackSection />
      </main>
      <Footer />
    </div>
  )
}