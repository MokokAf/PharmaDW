import { MedDrug } from '@/types/medication';

// Cache for the drugs data
let drugsCache: MedDrug[] | null = null;

export async function getAllDrugs(): Promise<MedDrug[]> {
  // Return cached data if available
  if (drugsCache) {
    return drugsCache;
  }

  try {
    const response = await fetch('/data/medicament_ma_optimized.json?nocache', {
      cache: 'no-store',
    });
    if (!response.ok) {
      throw new Error(`Fichier JSON indisponible (${response.status})`);
    }

    const text = await response.text();
    if (!text) {
      throw new Error('Réponse JSON vide');
    }
    const drugs: MedDrug[] = JSON.parse(text) as MedDrug[];
    
    // Cache the result
    drugsCache = drugs;
    
    return drugs;
  } catch (error) {
    console.error('Error loading drugs data:', error);
    return [];
  }
}

export async function getDrugBySlug(slug: string): Promise<MedDrug | null> {
  const drugs = await getAllDrugs();
  return drugs.find(drug => drug.id === slug) || null;
}

export function createSlugFromName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getUniqueManufacturers(drugs: MedDrug[]): string[] {
  const manufacturers = drugs
    .map(drug => drug.manufacturer)
    .filter((manufacturer): manufacturer is string => Boolean(manufacturer));
  
  return Array.from(new Set(manufacturers)).sort();
}

export function getUniqueTherapeuticClasses(drugs: MedDrug[]): string[] {
  const classes = drugs
    .flatMap(drug => drug.therapeuticClass || [])
    .filter(Boolean);
  
  return Array.from(new Set(classes)).sort();
}

export const ALPHABET = ['#', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];