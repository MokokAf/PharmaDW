import type { Metadata } from 'next'
import Footer from '@/components/Footer'
import HeroSection from '@/components/HeroSection'
import DwaIASection from '@/components/DwaIASection'
import FAQSection from '@/components/FAQSection'
import { SITE_NAME, absoluteUrl, pageAlternates } from '@/lib/seo'

const homeTitle = 'Medicaments, Pharmacies de garde et IA pharmaceutique au Maroc'
const homeDescription =
  'Recherchez plus de 5 000 medicaments marocains, trouvez les pharmacies de garde par ville et utilisez DwaIA pour verifier les interactions medicamenteuses.'

export const metadata: Metadata = {
  title: homeTitle,
  description: homeDescription,
  alternates: pageAlternates('/'),
  openGraph: {
    title: homeTitle,
    description: homeDescription,
    type: 'website',
    locale: 'fr_MA',
    url: absoluteUrl('/'),
    images: [
      {
        url: absoluteUrl('/opengraph-image'),
        width: 1200,
        height: 630,
        alt: 'PharmaDW',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: homeTitle,
    description: homeDescription,
    images: [absoluteUrl('/opengraph-image')],
  },
}

export default function HomePage() {
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: absoluteUrl('/'),
    inLanguage: 'fr-MA',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${absoluteUrl('/medicaments')}?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <div className="bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <main>
        <HeroSection />
        <DwaIASection />
        <FAQSection />
      </main>
      <Footer />
    </div>
  )
}
