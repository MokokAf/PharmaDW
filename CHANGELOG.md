# PharmaDW — Changelog

Ce fichier centralise toutes les modifications du projet. **Tout agent (Claude, Replit, Codex, humain) doit mettre a jour ce fichier apres chaque session de travail.**

---

## 2026-02-21 — Automatisation quotidienne base médicaments (medicament.ma)

### Data pipeline médicaments
- Ajout de `scripts/medicaments_updater.py` pour une mise à jour incrémentale quotidienne depuis les sitemaps WordPress de medicament.ma
- Respect du schéma frontend existant de `medicament_ma_optimized.json` (clés conservées)
- Mode bootstrap + gestion des disparitions temporaires (grace periods)
- Garde-fou anti-régression volume: arrêt si chute >30% (exit code 2), sans écraser les données
- Rate limit configurable pour éviter le blocage source: `MEDICAMENT_REQUEST_DELAY` + jitter `MEDICAMENT_REQUEST_JITTER`

### Index de recherche médicaments
- Ajout de `scripts/generate-drug-search-index.mjs`
- Génération de:
  - `public/data/medicament_list_index.json`
  - `public/data/medicament_search_index.json`
- Normalisation accent-insensitive + enrichissement des termes (nom + principes actifs)

### GitHub Actions
- Ajout du workflow `.github/workflows/update_medicaments.yml` (daily + manuel)
- Exécution séquentielle: update JSON principal -> régénération des index -> commit auto
- Alerte automatique via GitHub Issue si échec (dont cas chute >30%)
- Permissions `issues: write` pour la remontée d’alerte

### Scripts npm
- Ajout de `npm run generate:drug-indexes`

### Fichiers principaux
- `.github/workflows/update_medicaments.yml`
- `scripts/medicaments_updater.py`
- `scripts/generate-drug-search-index.mjs`
- `package.json`

## 2026-02-21 — Audit deep + Refonte scraper pharmacies

### SEO & PWA
- Ajout sitemap.ts, metadata structuree (schema.org), opengraph-image.tsx
- Ajout manifest.json, site.webmanifest, icones PWA (apple-touch-icon, icon-192, icon-512)
- Ajout robots.txt ameliore

### Mobile UX
- Touch targets min-h-11 sur tous les boutons interactifs
- Focus-visible:ring sur les elements du dashboard
- Barre de recherche accueil : icone seule sur mobile, placeholder responsive ("Rechercher un medicament..." sur mobile, texte complet sur desktop)
- Suppression espaces blancs excessifs en bas de page (footer margin, min-h-screen)

### Systeme d'interactions medicamenteuses (DwaIA)
- Autocomplete fuzzy avec Fuse.js pour les noms de medicaments
- Index de recherche leger (medicament_list_index.json, medicament_search_index.json)
- Boutons swap/clear, historique localStorage, copier resultat, skeleton loading
- Correction substitution autocomplete erronee + ajout hints DCI pour Perplexity
- Composant AutocompleteInput, validateur isInteractionResult, helper highlightQuery

### Performance
- Reduction bundles client (tree-shaking, imports optimises)
- Index de recherche medicaments pre-generes (scripts/generate-drug-search-index.mjs)
- TypeScript strict active + production hardening

### Scraper pharmacies (refonte majeure)
- Ancien : mono-source (annuaire-gratuit.ma), ~236 pharmacies
- Nouveau : multi-source en parallele (ThreadPoolExecutor) :
  - annuaire-gratuit.ma (national, ~224 pharmacies)
  - guidepharmacies.ma (Rabat, Sale, Kenitra, Temara)
  - infopoint.ma (Casablanca, Tanger)
  - med.ma (Marrakech)
- Cross-validation : badge "Verifie" si 2+ sources confirment
- Deduplication par cle normalisee (ville, nom)
- Extraction ville depuis <h1> (plus fiable que l'URL)
- Nettoyage adresses (suppression prefixe "Pharmacie X,", suffixe "Autre ville")
- Normalisation 51 villes (El Jadida, Beni Mellal, Sidi Slimane, etc.)
- Generation pharmacies_meta.json (fraicheur, stats, statuts sources, delta)
- Codes de sortie CI : 1 = zero resultat, 2 = chute >30%

### GitHub Actions
- Workflow 2x/jour : 08h30 + 20h30 (heure marocaine)
- Retry automatique si chute >30%
- Creation GitHub Issue automatique en cas d'echec

### Frontend pharmacies de garde
- Banniere de fraicheur (date mise a jour, nombre pharmacies/villes)
- Alerte donnees perimees (amber) si > 48h
- Badge "Verifie" (vert) sur pharmacies confirmees par 2+ sources
- Cards : affichage quartier au lieu d'adresse complete
- Bouton "Carte" prominent (outlined, meme taille que "Appeler")
- Ouverture app native maps sur mobile, Google Maps sur desktop
- Fix type declarations lucide-react pour le build

### Architecture
- Split server/client : page.tsx (metadata) + *Client.tsx (composant)
- Fichiers concernes : espace-pharmaciens, dashboard, pharmacies-de-garde
- Ajout error.tsx boundaries pour medicaments et dashboard
- Fichier legacy pharmacies_scraper.py (racine) supprime

---

## 2026-02-20 — UI/UX Redesign (Phases 1-5)

### Espace pharmaciens (refonte complete)
- Landing page premium : hero, grille 6 features, stats, CTA
- Dashboard : vue home/assistant toggle, quick actions, top bar mobile
- Sidebar : navigation groupee, logo header, tokens sidebar
- ChatBot : drug input card, suggestions, contexte patient collapsible, resultats triage

### Acces demo cache
- Hook useTripleTap : triple-tap sur icone stethoscope pour acces demo
- Remplace l'ancien bouton texte invisible

### Dark mode sidebar
- Ajout 8 variables CSS --sidebar-* dans .dark (globals.css)
- Suppression bg-background override sur <Sidebar>
- Tous les textes/bordures sidebar utilisent sidebar-* tokens

### Nettoyage & hardening
- Migration Vite -> Next.js clean
- Auth hardening
- Robustesse scraper
- Fix cle API Perplexity

---

## Comment utiliser ce fichier

**Apres chaque session de travail, ajouter une entree en haut du fichier avec :**
1. La date
2. Un titre court de la session
3. Les modifications groupees par categorie
4. Les fichiers principaux concernes

**Cela permet a tout agent (Claude, Replit AI, Codex, ou l'humain) de comprendre l'etat actuel du projet avant de faire des modifications.**
