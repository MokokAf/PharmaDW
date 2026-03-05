/**
 * Maps ~1,300 granular therapeutic class values to ~70 broad categories
 * (based on medicament.ma's taxonomy). Uses keyword matching on the
 * accent-stripped lowercase class string.
 *
 * Order matters — more specific rules must come before general ones.
 */

export const BROAD_CATEGORIES = [
  "Analgésiques",
  "Anesthésiques",
  "Anti-inflammatoires et antirhumatismaux",
  "Antibactériens à usage systémique",
  "Antidiarrhéiques et anti-infectieux intestinaux",
  "Antiémétiques et antinauséeux",
  "Antiépileptiques",
  "Antifongiques",
  "Antigoutteux",
  "Antihelmintiques",
  "Antihémorragiques",
  "Antihistaminiques à usage systémique",
  "Antihypertenseurs",
  "Antinéoplasiques",
  "Antiparasitaires",
  "Antiparkinsoniens",
  "Antiseptiques et désinfectants",
  "Antithrombotiques",
  "Antiviraux à usage systémique",
  "Bêtabloquants",
  "Compléments alimentaires",
  "Corticoïdes",
  "Diurétiques",
  "Dispositifs médicaux",
  "Hormones et modulateurs hormonaux",
  "Hypolipidémiants",
  "Immunosuppresseurs et immunomodulateurs",
  "Inhibiteurs calciques",
  "Laxatifs",
  "Médicaments de cardiologie",
  "Médicaments de la digestion",
  "Médicaments de la thyroïde",
  "Médicaments des voies respiratoires",
  "Médicaments du diabète",
  "Médicaments du système rénine-angiotensine",
  "Médicaments gastro-intestinaux",
  "Médicaments ophtalmologiques",
  "Médicaments pour les troubles de l'acidité",
  "Médicaments urologiques",
  "Myorelaxants",
  "Oligoéléments et minéraux",
  "Préparations anti-anémiques",
  "Préparations dermatologiques",
  "Préparations nasales et ORL",
  "Psychoanaleptiques",
  "Psycholeptiques",
  "Substituts du sang et solutions de perfusion",
  "Vaccins",
  "Vasculoprotecteurs et vasodilatateurs",
  "Vitamines",
  "Autres médicaments",
] as const

export type BroadCategory = (typeof BROAD_CATEGORIES)[number]

/** Rule: [keywords[], category]. First match wins. */
const RULES: [string[], BroadCategory][] = [
  // --- Very specific first ---
  [["vaccin"], "Vaccins"],
  [["antineoplasique", "cytostatique", "antimitotique", "anticancereux", "antitumoral", "anthracycline", "agent alkylant", "moutarde", "antimeta"], "Antinéoplasiques"],
  [["antibiotique", "antibacterien", "penicilline", "cephalosporine", "macrolide", "fluoroquinolone", "aminoside", "tetracycline", "carbapenem", "oxazolidinone", "sulfamide", "nitroimidazole", "antituberculeux", "antimycobacterien", "anti-infectieux", "amoxicilline", "acide fusidique", "phenicole"], "Antibactériens à usage systémique"],
  [["antiepileptique", "anticonvulsivant"], "Antiépileptiques"],
  [["antifongique", "antimycosique", "imidazole antifongique"], "Antifongiques"],
  [["antiviral"], "Antiviraux à usage systémique"],
  [["antihistaminique"], "Antihistaminiques à usage systémique"],
  [["anti-inflammatoire", " ains", "anti-cox", "antirhumatismal", "antirhumatismaux"], "Anti-inflammatoires et antirhumatismaux"],
  [["analgesique", "antalgique", "antipyretique", "opioid", "morphin", "antimigraineux", "triptan"], "Analgésiques"],
  [["anesthesique", "anesthesi"], "Anesthésiques"],
  [["antihypertenseur", "association de 2 antihypertenseur", "association de 3 antihypertenseur"], "Antihypertenseurs"],
  [["antagoniste des recepteurs de l'angiotensine", "antagoniste de l'angiotensine", "antagoniste selectif des recepteurs de l'angiotensine", "inhibiteur de l'eca", "inhibiteur de l'enzyme de conversion", "systeme renine-angiotensine", "inhibiteur du recepteur de l'angiotensine", "neprilysine"], "Médicaments du système rénine-angiotensine"],
  [["inhibiteur calcique"], "Inhibiteurs calciques"],
  [["betabloquant", "beta-bloquant", "beta bloquant"], "Bêtabloquants"],
  [["diuretique"], "Diurétiques"],
  [["anticoagulant", "antithrombotique", "antiagregant", "heparine", "thrombolytique", "fibrinolytique"], "Antithrombotiques"],
  [["antidepresseur", "antidepresseur", " isrs", "irsna", "recapture de la serotonine", "recapture de la noradrenaline"], "Psychoanaleptiques"],
  [["neuroleptique", "antipsychotique"], "Psycholeptiques"],
  [["anxiolytique", "hypnotique", "sedatif", "benzodiazepine", "sevrage tabagique"], "Psycholeptiques"],
  [["antiparkinson", "dopaminergique", "levodopa"], "Antiparkinsoniens"],
  [["hypolipemiant", "statine", "hmg-coa", "hmg- coa", "fibrate"], "Hypolipidémiants"],
  [["antidiabetique", "biguanide", "sulfonylure", "gliptine", "glinide", "insuline", "sglt2", "glucagon-like", "glp-1", "hypoglycemiant", "dpp-4"], "Médicaments du diabète"],
  [["antiulcereux", "inhibiteur de la pompe a protons", "antiacide", "antagoniste des recepteurs h2", "inhibiteurs de la pompe a protons", "ulcere", "reflux gastro"], "Médicaments pour les troubles de l'acidité"],
  [["antiemetique", "antinauseeux"], "Antiémétiques et antinauséeux"],
  [["antidiarrheique", "antidiarr", "anti-infectieux intestinal"], "Antidiarrhéiques et anti-infectieux intestinaux"],
  [["laxatif"], "Laxatifs"],
  [["antispasmodique", "spasmolytique", "prokinetique", "motilite"], "Médicaments gastro-intestinaux"],
  [["antiasthmatique", "bronchodilatateur", "beta-2", "obstructi", "voies aeriennes"], "Médicaments des voies respiratoires"],
  [["antitussif", "mucolytique", "expectorant", "rhume", " toux", "rhinologie"], "Médicaments des voies respiratoires"],
  [["corticoide", "corticosteroide", "glucocorticoide", "dermocorticoide", "prednisone"], "Corticoïdes"],
  [["immunosuppresseur", "immunomodulateur", "immunosuppreseur", "inhibiteur du tnf", "anti-tnf", "anticorps monoclonal"], "Immunosuppresseurs et immunomodulateurs"],
  [["immunostimulant", "facteur de croissance"], "Immunosuppresseurs et immunomodulateurs"],
  [["immunoglobuline", "immunserum"], "Immunosuppresseurs et immunomodulateurs"],
  [["antigoutteux", "antigouteux", "uricosynthese", "xanthine oxidase"], "Antigoutteux"],
  [["myorelaxant", "relaxant musculaire", "decontracturant", "curare"], "Myorelaxants"],
  [["thyroid"], "Médicaments de la thyroïde"],
  [["phosphodiesterase", "pde5", "dysfonction erectile", "alpha-bloquant", "alphabloquant", "urologiqu", "5-alpha-reductase", "antiadipeux"], "Médicaments urologiques"],
  [["progestatif", "estrogene", "contracepti", "hormones sexuelle", "antiandrogene", "gonadotrophine", "hypothalamique", "hypophysaire", "gnrh", "somatropine", "hormone de croissance", "prolactine", "endocrinotherapie"], "Hormones et modulateurs hormonaux"],
  [["vitamine", "multivitamine", "complexe vitamine"], "Vitamines"],
  [["oligoelement", "oligo-element", "mineraux", "mineral", "acide amine", "omega"], "Oligoéléments et minéraux"],
  [["complement alimentaire", "phytotherapie", "actifs naturels", "probiotique"], "Compléments alimentaires"],
  [["dispositif medical"], "Dispositifs médicaux"],
  [["anemique", "erythropoietine", "epoetine", "chelateur", "fer "], "Préparations anti-anémiques"],
  [["antihemoragique", "hemostatique", "facteur de coagulation", "facteur viii"], "Antihémorragiques"],
  [["ophtalmol", "oculaire", "collyre", "larme", "antiglaucomateux", "anhydrase carbonique"], "Médicaments ophtalmologiques"],
  [["otologique", "otite", "stomatolog", " gorge"], "Préparations nasales et ORL"],
  [["nasal", "decongestionnant"], "Préparations nasales et ORL"],
  [["vasculoprotecteur", "veinotonique", "vasodilatateur", "phlebotrope"], "Vasculoprotecteurs et vasodilatateurs"],
  [["antiangoreux", "cardiotonique", "digitalique", "anti-arythmique", "antiarythmique", "sympathomimetique", "adrenergi", "pacemaker", "glucoside de la digitale", "cardiologie"], "Médicaments de cardiologie"],
  [["bisphosphonate", "equilibre calcique", "desordres osseux", " calcium", "chondroprotecteur"], "Médicaments de cardiologie"],
  [["enzyme digestive", "digestion", "hepatique", "biliaire", "hepatoprotecteur", "stimulant de l'appetit"], "Médicaments de la digestion"],
  [["antiacneique", " acne"], "Préparations dermatologiques"],
  [["antiseptique", "desinfectant"], "Antiseptiques et désinfectants"],
  [["dermatol", "emollient", "cicatrisant", "plaie", "psoriasis", "retinoid", "keratolytique", "protecteur cutane", "minoxidil", "toxine botulique", "chemodener"], "Préparations dermatologiques"],
  [["tonique", "adaptogene", "deficit cognitif"], "Autres médicaments"],
  [["helminth", "vermifuge"], "Antihelmintiques"],
  [["antiparasitaire"], "Antiparasitaires"],
  [["protozoaire", "antipaludeen", "antimalarien", "antiprotozoaire"], "Antiparasitaires"],
  [["substitut", "perfusion", "solute", "solutions intraveineuses", "hemofiltration", "nutrition parenterale", "electrolytes", "hemodialyse"], "Substituts du sang et solutions de perfusion"],
  [["produit de contraste", "radiopharmaceutique", "resonance magnetique", "diagnostic"], "Autres médicaments"],
  [["homeopathique", "homoeopathique"], "Autres médicaments"],
  [["cholinesterase", "parasympathomimetique", "cholinergique", "parasympatholytique", "antivertigineux", "nmda"], "Psychoanaleptiques"],
]

function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

const _cache = new Map<string, BroadCategory>()

/**
 * Map a single detailed therapeutic class string to a broad category.
 * Returns "Autres médicaments" if no rule matches.
 */
export function mapToCategory(detailedClass: string): BroadCategory {
  const cached = _cache.get(detailedClass)
  if (cached) return cached

  const normalized = stripAccents(detailedClass).toLowerCase()

  for (const [keywords, category] of RULES) {
    for (const kw of keywords) {
      if (normalized.includes(kw)) {
        _cache.set(detailedClass, category)
        return category
      }
    }
  }

  _cache.set(detailedClass, "Autres médicaments")
  return "Autres médicaments"
}

/**
 * Check if a drug's therapeutic classes match a selected broad category.
 */
export function matchesCategory(
  drugClasses: string[] | undefined,
  selectedCategory: string
): boolean {
  if (!drugClasses || drugClasses.length === 0) return false
  return drugClasses.some((tc) => mapToCategory(tc) === selectedCategory)
}
