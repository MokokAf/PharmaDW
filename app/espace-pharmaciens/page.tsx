"use client";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AuthForm } from "@/components/auth/AuthForm";
import { useRouter } from "next/navigation";

const EspacePharmacienContent = () => {
  const { login } = useAuth();
  const router = useRouter();

  const handleDemoAccess = async () => {
    try {
      await login("demo@pharmadw.ma", "demo123");
      router.push("/espace-pharmaciens/dashboard");
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[80vh] p-4">
      {/* Disabled AuthForm */}
      <div className="pointer-events-none opacity-50 w-full max-w-md [&_button:first-child]:hidden">
        <AuthForm />
      </div>

      {/* Coming soon overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <h1 className="text-3xl font-semibold text-primary drop-shadow-lg bg-background/70 backdrop-blur-sm px-6 py-3 rounded-lg">
          Bientôt disponible
        </h1>
      </div>

      {/* Hidden demo access button - visible on hover */}
      <button
        onClick={handleDemoAccess}
        className="mt-6 text-xs text-muted-foreground/0 hover:text-muted-foreground/80 transition-colors duration-300 cursor-default hover:cursor-pointer"
      >
        Accès demo
      </button>
    </div>
  );
};

export default function EspacePharmaciensPage() {
  return (
    <AuthProvider>
      <EspacePharmacienContent />
    </AuthProvider>
  );
}
