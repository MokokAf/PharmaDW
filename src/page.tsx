import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import DwaIASection from "@/components/DwaIASection";
import NewsSection from "@/components/NewsSection";
import Footer from "@/components/Footer";

export const metadata = {
  title: "DwaIA - Intelligence Artificielle pour la Pharmacie",
  description: "Découvrez DwaIA, votre assistant IA pour l'information pharmaceutique au Maroc. Recherchez des médicaments, consultez les interactions et optimisez votre pratique pharmaceutique.",
};

export default function HomePage() {
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
}