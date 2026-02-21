# PharmaDW Deep Audit & Implementation Prompt

> **Pre-audit snapshot**: tag `v1.0-pre-audit` (commit `e274def`) on branch `fix/cleanup-and-hardening`
> **To restore**: `git checkout v1.0-pre-audit` or `git stash && git reset --hard v1.0-pre-audit`

---

## Context

You are auditing and improving **PharmaDW**, a Next.js 14 pharmaceutical platform for the Moroccan market. The codebase is at `/tmp/PharmaDW` (cloned from `github.com/MokokAf/PharmaDW`). The dev server runs on `localhost:3000` using Node.js v20 (via nvm at `/Users/mktr/.nvm/nvm.sh`).

### What the app does
- **Homepage**: Search-first hero, DwaIA CTA, FAQ with Schema.org
- **Médicaments** (`/medicaments`): Searchable list of 5,000+ Moroccan drugs (loaded from `/public/data/medicament_ma_optimized.json`, 4.9 MB). Virtualized with `react-window`. Filter by letter, manufacturer, therapeutic class. Each drug has a detail page (`/medicaments/[slug]`) with ISR (24h revalidation).
- **Pharmacies de garde** (`/pharmacies-de-garde`): On-call pharmacies by city, with tel: and Google Maps links. Data from `/public/data/pharmacies.json`.
- **Espace pharmaciens** (`/espace-pharmaciens`): "Coming soon" landing page with a **hidden demo access** (triple-tap the stethoscope icon). Leads to a pharmacist dashboard with:
  - A sidebar navigation (shadcn Sidebar component)
  - An AI-powered drug interaction checker (ChatBot component) that calls `/api/check-interaction`
  - Patient context form (age, pregnancy, renal function, allergies, comorbidities, risk flags)
  - Triage result display (vert/ambre/rouge) with severity badges

### Tech stack
- Next.js 14 App Router, TypeScript (strict: false), Tailwind CSS, shadcn/ui (60+ Radix components)
- `react-window` for virtualized lists, `react-hook-form` + `zod` for forms, `@tanstack/react-query` for data fetching
- Perplexity AI API (model "sonar") for drug interactions via `/api/check-interaction`
- Dark mode via `next-themes` (class-based), mobile-first with custom `xs: 380px` breakpoint
- Auth: mock client-side auth with localStorage (demo only)

### Environment
- `.env.local` contains `PERPLEXITY_API_KEY` (Perplexity AI key for drug interaction API)
- No `next.config.js` exists (all Next.js defaults)
- `tsconfig.json`: strict mode OFF, no implicit any OFF

---

## Your Mission

Perform a **deep audit** of the entire application across the domains listed below. For each domain, **identify every issue**, then **implement the fixes directly** in the codebase. Do not just list recommendations — actually write the code. After all changes, verify the build passes (`npx next build`) and test critical pages in the browser.

---

## 1. SEO Optimization

### Audit targets
- `app/layout.tsx` — root metadata, viewport, icons, manifest
- `app/page.tsx` — homepage metadata
- `app/medicaments/page.tsx` and `app/medicaments/[slug]/page.tsx` — drug page SEO
- `app/pharmacies-de-garde/page.tsx` — pharmacy page SEO
- `public/robots.txt` — crawl directives
- Check if a `sitemap.xml` exists (it does NOT currently — create one)
- Check if a `manifest.json` / `site.webmanifest` exists (it does NOT — create one)
- `components/FAQSection.tsx` — existing Schema.org FAQPage (verify correctness)

### What to implement
1. **Sitemap**: Create `app/sitemap.ts` that generates a dynamic sitemap including all static routes AND all 5,000+ drug detail pages (`/medicaments/[slug]`). Use Next.js Metadata API.
2. **Web manifest**: Create `public/site.webmanifest` with app name "PharmaDW", short_name "PharmaDW", theme_color matching the primary green, proper icons array. Reference it in layout.tsx metadata.
3. **Per-page metadata**: Ensure every page has unique, descriptive `title` and `description` metadata. Drug detail pages should have drug-specific metadata (name, DCI, manufacturer, price). Pharmacy page should mention Moroccan cities.
4. **Structured data**: Add `WebSite` schema with SearchAction on homepage. Add `Drug` schema (JSON-LD) on each drug detail page. Verify FAQPage schema.
5. **OpenGraph images**: If none exist, create a simple OG image route using Next.js `ImageResponse` (or a static fallback).
6. **Canonical URLs**: Ensure every page has a canonical URL.
7. **Hreflang**: Add `fr-MA` hreflang tags.
8. **Performance SEO**: Check for render-blocking resources, ensure critical CSS is inlined, add `<link rel="preconnect">` for external APIs.

---

## 2. UI/UX Optimization (Mobile-First)

### Audit targets
- ALL page components and layout files
- `components/Header.tsx`, `components/BottomNav.tsx`, `components/Footer.tsx`
- `components/DrugFilters.tsx`, `components/DrugListItem.tsx`, `components/AlphabetFilter.tsx`
- `components/VirtualizedDrugList.tsx`
- `components/FicheMedicament.tsx`
- `components/HeroSection.tsx`
- `components/dashboard/PharmacistDashboard.tsx`, `ChatBot.tsx`, `PharmacistSidebar.tsx`
- `app/pharmacies-de-garde/page.tsx`
- `app/globals.css`, `tailwind.config.ts`

### What to audit and fix
1. **Touch targets**: Every interactive element must be at least 44x44px (WCAG 2.5.8). Audit all buttons, links, pills, filter chips, alphabet letters. Fix any that are too small.
2. **Scroll behavior**: Ensure no horizontal overflow on any page at 320px width. Test the scroll-strip components. Add `overscroll-behavior: contain` where needed.
3. **Loading states**: Every async action (drug search, interaction check, page navigation) should have a skeleton or spinner. Check that the drug list shows a skeleton while loading. Check the interaction checker has a proper loading state.
4. **Empty states**: What happens when drug search returns 0 results? When pharmacy filter returns nothing? Add friendly empty state illustrations/messages.
5. **Error states**: What happens when the interaction API fails? When drug data fails to load? Add proper error boundaries and user-friendly error messages.
6. **Typography scale**: Ensure consistent heading hierarchy (h1 > h2 > h3). Check line-height and letter-spacing for readability on mobile. Body text should be 16px minimum on mobile to prevent iOS zoom.
7. **Spacing consistency**: Audit padding/margin across all pages for visual consistency. Ensure the content doesn't feel cramped on small screens.
8. **Bottom nav overlap**: Ensure the bottom nav (fixed, ~4.5rem) doesn't overlap content. The `pb-safe` class should work everywhere. Verify on the drug detail page, pharmacy page, etc.
9. **Keyboard avoidance**: When the mobile keyboard opens (e.g., drug search, interaction checker inputs), ensure the input remains visible and the layout doesn't break.
10. **Dark mode consistency**: Audit every component for dark mode color issues. Check hardcoded colors (e.g., `bg-white`, `text-black`). Ensure all use CSS variables or Tailwind dark: variants.
11. **Animations**: Add subtle transitions for state changes (filter open/close, search results appear, triage result display). Use `animate-fade-in` or similar. Don't overdo it.
12. **Pull-to-refresh feel**: Consider adding a subtle loading indicator at the top when data refreshes.

---

## 3. Drug Interaction AI — Accuracy & Low Friction

### Audit target
- `app/api/check-interaction/route.ts` — the full API route
- `components/dashboard/ChatBot.tsx` — the UI component
- Drug data in `/public/data/medicament_ma_optimized.json`

### What to implement

#### 3a. Autocomplete / Type-ahead suggestions (this is called "autocomplete" or "typeahead")
This is the #1 UX improvement needed. Currently users must type exact drug names manually.

1. **Create an autocomplete endpoint or client-side search**: Since we have 5,000+ drugs in a JSON file, implement client-side fuzzy search using the drug names AND active ingredients (DCI). Options:
   - Use the existing `medicament_ma_optimized.json` data
   - Create a lightweight index of just `{ name, activeIngredient[], id }` for the autocomplete (to reduce memory)
   - Implement fuzzy matching (handle typos, partial matches, accent-insensitive search)
   - Consider using a library like `fuse.js` for fuzzy search, or implement a simple trigram/prefix matcher

2. **Autocomplete UI**: Replace the plain `<Input>` fields in ChatBot with a combobox/command palette:
   - Use shadcn's `<Command>` component (already installed via `cmdk` dependency) or `<Popover>` + search
   - Show suggestions as user types (debounce 200ms)
   - Show drug name + DCI + dosage form in each suggestion
   - Highlight matching text in suggestions
   - Allow keyboard navigation (arrow keys, enter to select)
   - Allow free-text entry (for drugs not in the database — the AI can still check them)
   - Show "Aucun résultat" when no matches
   - Mobile-friendly: suggestions should appear in a scrollable list, not overlap the keyboard

3. **Autocomplete data preparation**:
   - Extract a lightweight drug name index from the full JSON
   - Include both brand names (`name`) and DCI (`activeIngredient`) as searchable terms
   - Normalize for search: remove accents, lowercase, trim

#### 3b. Interaction API improvements
1. **Prompt engineering**: Review and improve the Perplexity AI prompt in `route.ts`. The current prompt asks for a specific JSON schema. Improvements:
   - Add few-shot examples of expected output format to reduce parsing errors
   - Add explicit instruction to cite mechanism of action
   - Add instruction to mention monitoring parameters (e.g., "monitor INR", "check renal function")
   - Strengthen the instruction to respond in French

2. **Response validation**: The current code does `JSON.parse` on the AI response. Add:
   - Zod schema validation on the parsed response
   - Fallback behavior if the response doesn't match the schema (show raw text instead of crashing)
   - Retry logic (1 retry with slight prompt variation if first attempt fails or returns invalid JSON)

3. **Deterministic safety rules**: Review the post-processing rules in `route.ts`:
   - The allergy detection only checks for "penicillin" class. Extend to NSAID, sulfonamide, cephalosporin cross-reactivity
   - Add age-based dose adjustment warnings (pediatric <12, elderly >75)
   - Add hepatic impairment checks
   - Add pregnancy category warnings (categories A/B/C/D/X if data available)

4. **Caching**: Implement a simple cache for interaction results:
   - Key: normalized `drug1 + drug2` (sorted alphabetically so A+B = B+A)
   - Store in a server-side Map or use Next.js unstable_cache
   - TTL: 24 hours
   - This saves API calls and speeds up repeated checks

5. **Rate limiting**: Add basic rate limiting to prevent API abuse:
   - Max 20 requests per minute per IP
   - Return 429 with a friendly message

#### 3c. UX improvements for the interaction checker
1. **Recent checks history**: Store the last 10 checks in localStorage. Show them as a "Récents" section below the form. Allow re-running a previous check with one tap.
2. **Share/copy result**: Add a "Copier" button on triage results that copies a plain-text summary to clipboard.
3. **Swap drugs button**: Add a swap icon between the two drug inputs to quickly reverse them.
4. **Clear form button**: Add a small X button to clear both inputs at once.
5. **Loading experience**: During the API call (which takes ~3-5 seconds), show a skeleton of the expected result card with a pulsing animation, not just a spinner.

---

## 4. Performance Audit

### What to check and fix
1. **Bundle size**: Run `npx next build` and check the output. Identify any pages over 100kB First Load JS. Consider:
   - Dynamic imports for heavy components (e.g., recharts if used, react-markdown)
   - Tree-shaking lucide-react icons (import only used icons, not the barrel export)
2. **Drug data loading**: The 4.9MB JSON is loaded client-side via fetch. This is slow on mobile. Options:
   - Pre-process at build time: generate a lighter index file with just searchable fields
   - Paginate or lazy-load the full data
   - Use ISR to pre-render the drug list page server-side
   - Consider streaming the data or using a search API endpoint
3. **Image optimization**: Check if Next.js `<Image>` component is used (it's NOT currently). Replace any `<img>` tags with `<Image>`.
4. **Font loading**: Check if fonts are optimized (next/font or preload).
5. **Core Web Vitals**: Identify potential LCP, FID, CLS issues. Fix layout shifts from dynamic content loading.
6. **Preconnect**: Add `<link rel="preconnect">` for `api.perplexity.ai` and any other external origins.

---

## 5. Accessibility Audit

### What to check and fix
1. **Color contrast**: Verify all text/background combinations meet WCAG AA (4.5:1 for normal text, 3:1 for large text). Pay special attention to:
   - Muted foreground text on dark backgrounds
   - Primary green on white/dark backgrounds
   - Triage badge text on colored backgrounds
2. **Screen reader**: Ensure all interactive elements have accessible names. Check for missing `aria-label`, `aria-labelledby`, or visible text.
3. **Focus indicators**: Ensure all focusable elements have visible focus styles (not just color change — use outline or ring).
4. **Skip navigation**: Add a "Skip to main content" link at the top of the page.
5. **Form labels**: Ensure all form inputs have associated labels (not just placeholder text).
6. **Error announcements**: Ensure form errors are announced to screen readers (aria-live regions).
7. **Language attribute**: Verify `lang="fr"` on html element.

---

## 6. Code Quality

### What to fix
1. **TypeScript strictness**: Enable `strict: true` in tsconfig.json and fix resulting type errors. At minimum, enable `strictNullChecks`.
2. **Missing error boundaries**: Add React error boundaries around critical sections (drug list, interaction checker).
3. **Console.log cleanup**: Remove any remaining console.log statements.
4. **Unused imports**: Remove unused imports across all files.
5. **Component display names**: Add displayName to forwardRef components (e.g., ChatBot).
6. **next.config.js**: Create it with recommended production settings (image optimization, compression headers, security headers).

---

## Implementation Rules

1. **Branch**: Work on a new branch `feat/deep-audit` created from the current HEAD.
2. **Commits**: Make atomic commits per domain (one for SEO, one for UI/UX, etc.).
3. **Don't break existing functionality**: The triple-tap demo access, the drug search, the interaction checker, the pharmacy page — all must still work.
4. **Test after each major change**: Run `npx next build` to verify no compile errors.
5. **Mobile-first**: Every UI change must look good on 375px width first, then scale up.
6. **French language**: All user-facing text must be in French. Comments can be in English.
7. **Dependencies**: You may install new packages if needed (e.g., `fuse.js` for fuzzy search). Use `npm install`.
8. **Preserve the design system**: Use the existing Tailwind tokens, shadcn components, and CSS variables. Don't introduce new design patterns that conflict.

---

## Verification Checklist

After all changes, verify:
- [ ] `npx next build` passes with no errors
- [ ] Homepage loads correctly with all sections
- [ ] Drug list page loads, search works, filters work, alphabet filter works
- [ ] Drug detail page renders correctly with full metadata
- [ ] Pharmacies page loads with city selector and pharmacy cards
- [ ] Espace pharmaciens landing page renders, triple-tap demo works
- [ ] Dashboard loads with sidebar, assistant view, home view
- [ ] Drug interaction check works end-to-end (type drugs, submit, see triage result)
- [ ] Autocomplete shows suggestions when typing drug names
- [ ] Dark mode works consistently across all pages
- [ ] No horizontal scroll on mobile (320px)
- [ ] All touch targets are minimum 44x44px
- [ ] sitemap.xml is accessible
- [ ] manifest.json is accessible
- [ ] Lighthouse score > 90 on Performance, Accessibility, SEO, Best Practices
