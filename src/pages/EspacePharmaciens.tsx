import Header from "@/components/Header";
import Footer from "@/components/Footer";

const EspacePharmaciens = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-8">Espace Pharmaciens</h1>
          <div className="bg-card rounded-lg p-8 shadow-soft">
            <p className="text-muted-foreground text-lg">
              Bienvenue dans l'espace dédié aux pharmaciens. Cette section sera bientôt développée pour offrir des outils et ressources spécialisés.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EspacePharmaciens;