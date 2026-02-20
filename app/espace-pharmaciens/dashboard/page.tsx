"use client";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { PharmacistDashboard } from "@/components/dashboard/PharmacistDashboard";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

function DashboardGuard() {
  const { user, isInitialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isInitialized && !user) {
      router.replace("/espace-pharmaciens");
    }
  }, [isInitialized, user, router]);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <PharmacistDashboard />
    </div>
  );
}

export default function PharmacistDashboardPage() {
  return (
    <AuthProvider>
      <DashboardGuard />
    </AuthProvider>
  );
}
