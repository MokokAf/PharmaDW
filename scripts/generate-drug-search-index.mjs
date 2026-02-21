#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const sourcePath = path.join(process.cwd(), "public/data/medicament_ma_optimized.json");
const searchOutputPath = path.join(process.cwd(), "public/data/medicament_search_index.json");
const listOutputPath = path.join(process.cwd(), "public/data/medicament_list_index.json");

function normalize(input = "") {
  return String(input)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => String(item).trim()).filter(Boolean);
}

function expandIngredients(values) {
  const out = [];
  const seen = new Set();
  for (const raw of toStringArray(values)) {
    const parts = raw.split(/\s*(?:\||\/|;|\+|,|\bet\b)\s*/i).map((part) => part.trim()).filter(Boolean);
    const candidates = parts.length > 1 ? parts : [raw];
    for (const item of candidates) {
      const key = normalize(item);
      if (!key || seen.has(key)) {
        continue;
      }
      seen.add(key);
      out.push(item);
    }
  }
  return out;
}

function normalizeDrugType(value) {
  return value === "MedicalDevice" ? "MedicalDevice" : "Drug";
}

async function generate() {
  const raw = await fs.readFile(sourcePath, "utf8");
  const drugs = JSON.parse(raw);
  if (!Array.isArray(drugs)) {
    throw new Error("Invalid source format: expected an array");
  }

  const searchIndex = drugs.map((drug) => {
    const activeIngredient = toStringArray(drug.activeIngredient);
    const expandedIngredient = expandIngredients(drug.activeIngredient);

    return {
      id: String(drug.id ?? ""),
      name: String(drug.name ?? ""),
      activeIngredient,
      dosageForm: typeof drug.dosageForm === "string" ? drug.dosageForm : undefined,
      strength: typeof drug.strength === "string" ? drug.strength : undefined,
      manufacturer: typeof drug.manufacturer === "string" ? drug.manufacturer : undefined,
      searchKey: normalize(`${drug.name ?? ""} ${activeIngredient.join(" ")} ${expandedIngredient.join(" ")}`),
    };
  });

  const listIndex = drugs.map((drug) => ({
    id: String(drug.id ?? ""),
    name: String(drug.name ?? ""),
    activeIngredient: toStringArray(drug.activeIngredient),
    dosageForm: typeof drug.dosageForm === "string" ? drug.dosageForm : undefined,
    strength: typeof drug.strength === "string" ? drug.strength : undefined,
    manufacturer: typeof drug.manufacturer === "string" ? drug.manufacturer : undefined,
    therapeuticClass: toStringArray(drug.therapeuticClass),
    "@type": normalizeDrugType(drug["@type"]),
    productType: normalizeDrugType(drug.productType),
  }));

  await Promise.all([
    fs.writeFile(searchOutputPath, JSON.stringify(searchIndex), "utf8"),
    fs.writeFile(listOutputPath, JSON.stringify(listIndex), "utf8"),
  ]);

  process.stdout.write(`Wrote ${searchIndex.length} records to ${searchOutputPath}\n`);
  process.stdout.write(`Wrote ${listIndex.length} records to ${listOutputPath}\n`);
}

generate().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
