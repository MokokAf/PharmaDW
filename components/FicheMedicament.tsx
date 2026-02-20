import React from "react";
import { MedDrug } from "@/types/medication";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface FicheMedicamentProps {
  drug: MedDrug;
}

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-1.5">
    {children}
  </h3>
);

const FicheMedicament: React.FC<FicheMedicamentProps> = ({ drug }) => {
  if (!drug) return null;
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {drug.name}
        </h1>
        {(drug.strength || drug.dosageForm) && (
          <p className="text-sm text-muted-foreground mt-1">
            {[drug.strength, drug.dosageForm].filter(Boolean).join(' — ')}
          </p>
        )}
      </div>

      {/* Active ingredients */}
      {drug.activeIngredient?.length > 0 && (
        <div>
          <SectionLabel>Principes actifs</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {drug.activeIngredient.map((ai, idx) => (
              <Link
                key={idx}
                href={`/medicaments?search=${encodeURIComponent(ai)}`}
                prefetch={false}
              >
                <Badge
                  variant="secondary"
                  className="cursor-pointer inline-flex items-center min-h-11 bg-primary/10 text-primary hover:bg-primary/20 rounded-full px-3 text-sm"
                >
                  {ai}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Manufacturer */}
      {drug.manufacturer && (
        <div>
          <SectionLabel>Fabricant</SectionLabel>
          <p className="text-sm">{drug.manufacturer}</p>
        </div>
      )}

      {/* Therapeutic class */}
      {Array.isArray(drug.therapeuticClass) && drug.therapeuticClass.length > 0 && (
        <div>
          <SectionLabel>Classe thérapeutique</SectionLabel>
          <p className="text-sm">{drug.therapeuticClass.join(", ")}</p>
        </div>
      )}

      {/* Forme / Dosage & Présentation */}
      {(drug.dosageForm || drug.strength) && (
        <div className="grid grid-cols-2 gap-4">
          {drug.strength && (
            <div>
              <SectionLabel>Dosage</SectionLabel>
              <p className="text-sm">{drug.strength}</p>
            </div>
          )}
          {drug.dosageForm && (
            <div>
              <SectionLabel>Forme pharmaceutique</SectionLabel>
              <p className="text-sm">{drug.dosageForm}</p>
            </div>
          )}
        </div>
      )}
      {drug.presentation && (
        <div>
          <SectionLabel>Présentation</SectionLabel>
          <p className="text-sm">{drug.presentation}</p>
        </div>
      )}

      {/* Codes */}
      {(drug.atcCode || drug.table) && (
        <div className="grid grid-cols-2 gap-4">
          {drug.atcCode && (
            <div>
              <SectionLabel>Code ATC</SectionLabel>
              <p className="text-sm font-mono">{drug.atcCode}</p>
            </div>
          )}
          {drug.table && (
            <div>
              <SectionLabel>Tableau</SectionLabel>
              <p className="text-sm">{drug.table}</p>
            </div>
          )}
        </div>
      )}

      {/* Price */}
      {drug.price && (
        <div className="bg-surface rounded-lg p-4 space-y-2">
          <SectionLabel>Prix</SectionLabel>
          {drug.price.public && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Prix public</span>
              <span className="text-base font-semibold">{drug.price.public} {drug.price.currency}</span>
            </div>
          )}
          {drug.price.hospital && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Prix hôpital</span>
              <span className="text-base font-semibold">{drug.price.hospital} {drug.price.currency}</span>
            </div>
          )}
        </div>
      )}

      {/* UpdatedAt */}
      {drug.updatedAt && (
        <p className="text-xs text-muted-foreground">
          Mise à jour : {new Date(drug.updatedAt).toLocaleDateString('fr-FR')}
        </p>
      )}
    </div>
  );
};

export default FicheMedicament;
