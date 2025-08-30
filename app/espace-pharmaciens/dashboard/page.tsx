"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { PharmacistDashboard } from "@/components/dashboard/PharmacistDashboard";

export default function PharmacistDashboardPage() {
  return (
    <AuthProvider>
      <div className="min-h-screen">
        <PharmacistDashboard />
      </div>
    </AuthProvider>
  );
}
