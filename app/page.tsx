import Footer from '@/components/Footer'
import HeroSection from '@/components/HeroSection'
import DwaIASection from '@/components/DwaIASection'
import FAQSection from '@/components/FAQSection'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <main>
        <HeroSection />
        <DwaIASection />
        <FAQSection />
      </main>
      <Footer />
    </div>
  )
}
