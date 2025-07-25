"use client";

import React from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AuthForm } from '@/components/auth/AuthForm';
import { PharmacistDashboard } from '@/components/dashboard/PharmacistDashboard';

const EspacePharmacienContent: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <AuthForm />;
  }

  return <PharmacistDashboard />;
};

export default function EspacePharmaciens() {
  return (
    <AuthProvider>
      <EspacePharmacienContent />
    </AuthProvider>
  );
}