"use client";

import React from "react";
import { MedDrug } from "@/types/medication";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";


interface FicheMedicamentProps {
  drug: MedDrug;
}

/*
  Simple drug detail card.
  Displays name, strength, dosage form, manufacturer and active ingredients.
*/
const FicheMedicament: React.FC<FicheMedicamentProps> = ({ drug }) => {
  if (!drug) return null;
  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">
          {drug.name}
          {drug.strength && ` ${drug.strength}`} {drug.dosageForm && `(${drug.dosageForm})`}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {drug.activeIngredient?.length && (
          <div>
            <h3 className="font-semibold">Principes actifs</h3>
            <div className="flex flex-wrap gap-2 mt-2">
              {drug.activeIngredient.map((ai, idx) => (
                <Badge key={idx} variant="secondary">
                  {ai}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {drug.manufacturer && (
          <div>
            <h3 className="font-semibold">Fabricant</h3>
            <p>{drug.manufacturer}</p>
          </div>
        )}
        {drug.therapeuticClass?.length && (
          <div>
            <h3 className="font-semibold">Classe thérapeutique</h3>
            <p>{drug.therapeuticClass.join(", ")}</p>
          </div>
        )}

        {/* Description - HIDDEN */}
        {drug.description && (
          <div className="hidden">
            <h3 className="font-semibold">Description</h3>
            <div className="prose dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{drug.description}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* Forme / Dosage & Présentation */}
        {(drug.dosageForm || drug.strength) && (
          <div className="grid sm:grid-cols-2 gap-4">
            {drug.strength && (
              <div>
                <h3 className="font-semibold">Dosage</h3>
                <p>{drug.strength}</p>
              </div>
            )}
            {drug.dosageForm && (
              <div>
                <h3 className="font-semibold">Forme pharmaceutique</h3>
                <p>{drug.dosageForm}</p>
              </div>
            )}
          </div>
        )}
        {drug.presentation && (
          <div>
            <h3 className="font-semibold">Présentation</h3>
            <p>{drug.presentation}</p>
          </div>
        )}

        {/* Codes */}
        {(drug.atcCode || drug.table) && (
          <div className="grid sm:grid-cols-3 gap-4">
            {drug.atcCode && (
              <div>
                <h3 className="font-semibold">Code ATC</h3>
                <p>{drug.atcCode}</p>
              </div>
            )}

            {drug.table && (
              <div>
                <h3 className="font-semibold">Tableau</h3>
                <p>{drug.table}</p>
              </div>
            )}
          </div>
        )}

        {/* Price */}
        {drug.price && (
          <div>
            <h3 className="font-semibold">Prix</h3>
            <p>
              {drug.price.public && (
                <span>
                  Public: {drug.price.public} {drug.price.currency}
                  {drug.price.hospital && " | "}
                </span>
              )}
              {drug.price.hospital && (
                <span>Hôpital: {drug.price.hospital} {drug.price.currency}</span>
              )}
            </p>
          </div>
        )}

        {/* UpdatedAt */}
        {drug.updatedAt && (
          <div className="text-sm text-muted-foreground">
            Mise à jour: {new Date(drug.updatedAt).toLocaleDateString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FicheMedicament;
