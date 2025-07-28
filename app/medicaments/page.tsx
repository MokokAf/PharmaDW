"use client";
import { Suspense } from "react";
import MedicamentsContent from "./MedicamentsContent";








export default function MedicamentsPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <MedicamentsContent />
    </Suspense>
  );
}
  







  

