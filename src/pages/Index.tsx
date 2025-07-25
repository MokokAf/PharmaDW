import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import DwaIASection from "@/components/DwaIASection";
import NewsSection from "@/components/NewsSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <DwaIASection />
        <NewsSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;