export interface MedDrug {
  '@context': 'https://schema.org';
  '@type': 'Drug' | 'MedicalDevice';
  id: string;
  name: string;
  description: string; // Markdown
  activeIngredient: string[];
  dosageForm?: string;
  strength?: string;
  presentation?: string;
  therapeuticClass?: string[];
  atcCode?: string;
  status?: string;
  productType: 'Drug' | 'MedicalDevice';
  manufacturer?: string;
  price?: {
    currency: 'MAD';
    public?: number;
    hospital?: number;
  };
  table?: string;
  updatedAt: string;
}

export interface DrugFilters {
  search: string;
  letter: string;
  manufacturer: string;
  therapeuticClass: string;
}