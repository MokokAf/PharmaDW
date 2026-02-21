# PharmaDW - Replit Agent Guide

## Overview

PharmaDW (Dwaia.ma) is a pharmaceutical platform for Morocco. It provides three core features:

1. **Drug Database** — A searchable catalog of 5,000+ Moroccan medications with details like active ingredients, dosage forms, prices, manufacturers, and therapeutic classes.
2. **Pharmacy Duty Finder** — Lists pharmacies currently on duty (pharmacies de garde) across Moroccan cities, sourced by scraping multiple pharmacy directories.
3. **AI Assistant (DwaIA)** — A professional tool for pharmacists to check drug interactions, with patient context awareness (age, pregnancy, renal function) and clinical triage (green/amber/red severity).

The entire UI is in French, targeting Moroccan pharmacists and patients. The domain is `dwa-ia-maroc.com`.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Framework
- **Next.js 14** with the App Router (`app/` directory). Pages use server components by default; interactive components are marked `'use client'`.
- **TypeScript** throughout. Strict null checks enabled.
- Path aliases use `@/*` mapped to the project root.

### Styling
- **Tailwind CSS** with a custom theme defined in `tailwind.config.ts` and CSS variables in `app/globals.css`.
- **shadcn/ui** component library (Radix UI primitives + CVA). Components live in `components/ui/`. The config is in `components.json`.
- Custom pharmacy-themed CSS variables (`--pharma-primary`, `--triage-vert/ambre/rouge`, etc.).
- Dark mode supported via `next-themes` with class strategy.

### Routing & Pages
- `/` — Landing page with hero search, DwaIA promo section, FAQ with structured data (schema.org)
- `/medicaments` — Drug catalog with virtualized list (`react-window`), alphabet filter, search, manufacturer/class filters
- `/medicaments/[slug]` — Individual drug detail page (FicheMedicament component)
- `/pharmacies-de-garde` — Duty pharmacy listing by city, loaded from static JSON
- `/espace-pharmaciens` — Professional space with auth gate and AI chatbot dashboard

### Data Layer
- **No database.** All drug data is served from a static JSON file at `public/data/medicament_ma_optimized.json`. Pharmacy data comes from `public/data/pharmacies.json` and `public/data/pharmacies_meta.json`.
- Drug data is fetched client-side via `fetch()` in `lib/drugService.ts` with an in-memory cache.
- **React Query** (`@tanstack/react-query`) manages async data fetching with 1-minute stale time.
- Drug types are defined in `types/medication.ts` (`MedDrug`, `MedDrugListItem`, `DrugFilters`).

### Authentication
- **Simulated/mock authentication** via React Context (`contexts/AuthContext.tsx`). No real backend auth.
- User state persisted in `localStorage` under `pharmacist_user`.
- Supports mock email/password login, signup, and Google OAuth.
- Auth types in `types/auth.ts`.

### AI Chatbot
- Located in `components/dashboard/ChatBot.tsx`. Uses **Fuse.js** for fuzzy drug name matching.
- Interaction checking produces triage results (vert/ambre/rouge) with severity levels and clinical recommendations.
- Currently simulated — no real API calls to Perplexity or other AI services.
- The chatbot is gated behind the pharmacist auth flow.

### Data Scraping (Python)
- `scripts/pharmacies_scraper.py` — Multi-source pharmacy scraper combining data from several Moroccan directories (annuaire-gratuit.ma, guidepharmacies.ma, infopoint.ma, med.ma).
- Uses `requests` + `BeautifulSoup`. Dependencies in `requirements.txt`.
- Outputs JSON files to `public/data/`.
- There's also a legacy `pharmacies_scraper.py` at the root.

### SEO
- Comprehensive SEO setup in `lib/seo.ts` — Open Graph images (generated via `next/og`), structured data (schema.org WebSite, FAQPage), sitemap generation (`app/sitemap.ts`), robots.txt.
- PWA manifest at `public/manifest.json`.
- Security headers configured in `next.config.js` (HSTS, X-Frame-Options, CSP-adjacent headers).

### Key Design Patterns
- **Component composition**: Page-level components in `app/`, shared UI in `components/`, dashboard-specific in `components/dashboard/`.
- **Dynamic imports**: Heavy components (VirtualizedDrugList, AlphabetFilter, DrugFilters) are loaded with `next/dynamic` to reduce initial bundle.
- **Virtualized rendering**: Drug list uses `react-window` (`FixedSizeList`) for performance with 5,000+ items.
- **Mobile-first**: Bottom navigation bar for mobile (`BottomNav.tsx`), hidden on desktop. Responsive design with `xs` breakpoint at 380px.
- **Conditional header**: `SiteHeader` hides the main header on `/espace-pharmaciens` routes (which have their own sidebar layout).

### Build & Dev
- `npm run dev` — Next.js dev server
- `npm run build` — Production build
- `npm run generate:indexes` — Script to generate drug search indexes

## External Dependencies

### NPM Packages (Key)
- **next** 14.x — Framework
- **react** 18.x — UI library
- **@tanstack/react-query** — Server state management
- **@radix-ui/*** — Headless UI primitives (accordion, dialog, dropdown, tabs, tooltip, etc.)
- **tailwindcss** + **class-variance-authority** + **clsx** + **tailwind-merge** — Styling
- **react-hook-form** + **@hookform/resolvers** + **zod** — Form validation
- **react-window** — Virtualized list rendering
- **fuse.js** — Fuzzy search for drug interactions
- **lucide-react** — Icon library
- **next-themes** — Dark mode
- **vaul** — Drawer component
- **embla-carousel-react** — Carousel
- **recharts** — Charts
- **date-fns** — Date utilities
- **cmdk** — Command palette
- **input-otp** — OTP input

### Python Dependencies
- **requests** — HTTP client for scraping
- **beautifulsoup4** — HTML parsing

### External Services
- **Google AdSense** — `public/ads.txt` contains publisher ID (`pub-2730741572453484`)
- **Google OAuth** — Simulated (no real integration yet)
- **Perplexity AI** — Referenced for drug interaction API but currently simulated
- No database service (Postgres, Supabase, etc.) is currently used — all data is static JSON

### Data Sources (Scraped)
- annuaire-gratuit.ma
- guidepharmacies.ma
- infopoint.ma
- med.ma