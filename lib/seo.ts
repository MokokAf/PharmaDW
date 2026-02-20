import type { Metadata } from 'next'

export const SITE_NAME = 'PharmaDW'
export const SITE_TITLE = 'PharmaDW - Plateforme pharmaceutique intelligente au Maroc'
export const SITE_DESCRIPTION =
  'PharmaDW facilite la recherche de medicaments au Maroc, les pharmacies de garde par ville et la verification des interactions medicamenteuses pour pharmaciens.'
export const SITE_LOCALE = 'fr_MA'
export const SITE_LANGUAGE = 'fr-MA'
export const SITE_PRIMARY_COLOR = '#20c997'

const DEFAULT_SITE_URL = 'https://dwa-ia-maroc.com'

export function getSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_BASE_URL?.trim()
  if (!envUrl) {
    return DEFAULT_SITE_URL
  }

  try {
    const url = new URL(envUrl)
    return url.toString().replace(/\/$/, '')
  } catch {
    return DEFAULT_SITE_URL
  }
}

export function absoluteUrl(pathname = '/'): string {
  return new URL(pathname, getSiteUrl()).toString()
}

export function pageAlternates(pathname: string): Metadata['alternates'] {
  return {
    canonical: pathname,
    languages: {
      [SITE_LANGUAGE]: pathname,
    },
  }
}

export function getHostName(): string {
  return new URL(getSiteUrl()).hostname
}
