"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { AuthForm } from "@/components/auth/AuthForm";

const EspacePharmacienContent = () => {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-[80vh] p-4">
      {/* Disabled AuthForm */}
      <div className="pointer-events-none opacity-50 w-full max-w-md [&_button:first-child]:hidden">
        <AuthForm />
      </div>

      {/* Coming soon overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <h1 className="text-3xl font-semibold text-primary drop-shadow-lg bg-background/70 backdrop-blur-sm px-6 py-3 rounded-lg">
          Bientôt disponible
        </h1>
      </div>
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
