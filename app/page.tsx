import Header from '@/components/Header'
import Footer from '@/components/Footer'
import HeroSection from '@/components/HeroSection'
import DwaIASection from '@/components/DwaIASection'
import NewsSection from '@/components/NewsSection'
import FAQSection from '@/components/FAQSection'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <DwaIASection />
        <NewsSection />
        <FAQSection />
      </main>
      <Footer />
    </div>
  )
}
