import { notFound } from "next/navigation";
import { Metadata } from "next";
import { promises as fs } from "fs";
import path from "path";
import FicheMedicament from "@/components/FicheMedicament";
import { MedDrug } from "@/types/medication";

const dataPath = path.join(process.cwd(), "public/data/medicament_ma_optimized.json");

async function getAllDrugs(): Promise<MedDrug[]> {
  const raw = await fs.readFile(dataPath, "utf8");
  return JSON.parse(raw) as MedDrug[];
}

export async function generateStaticParams() {
  const drugs = await getAllDrugs();
  return drugs.map((d) => ({ slug: d.id.toString() }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const drugs = await getAllDrugs();
  const drug = drugs.find((d) => d.id.toString() === params.slug);
  if (!drug) return {};
  return {
    title: `${drug.name} – Dwaia.ma`,
    description: `${drug.name} ${drug.strength ?? ""} ${drug.dosageForm ?? ""}`.trim(),
  };
}

export default async function DrugDetailPage({ params }: { params: { slug: string } }) {
  const drugs = await getAllDrugs();
  const drug = drugs.find((d) => d.id.toString() === params.slug);
  if (!drug) notFound();

  return (
    <main className="container mx-auto py-8">
      <FicheMedicament drug={drug} />
    </main>
  );
}
