export interface MedDrug {
  '@context': 'https://schema.org';
  '@type': 'Drug' | 'MedicalDevice';
  id: string;
  name: string;
  description?: string; // Markdown
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
  updatedAt?: string;
}

export interface MedDrugListItem {
  id: string;
  name: string;
  activeIngredient: string[];
  dosageForm?: string;
  strength?: string;
  therapeuticClass?: string[];
  manufacturer?: string;
  '@type'?: 'Drug' | 'MedicalDevice';
  productType?: 'Drug' | 'MedicalDevice';
}

export interface DrugFilters {
  search: string;
  letter: string;
  manufacturer: string;
  therapeuticClass: string;
}
