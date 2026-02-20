import { ImageResponse } from 'next/og'
import { SITE_DESCRIPTION, SITE_NAME } from '@/lib/seo'

export const runtime = 'edge'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'
export const alt = 'PharmaDW - Plateforme pharmaceutique au Maroc'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px',
          background:
            'linear-gradient(135deg, rgba(22,163,74,1) 0%, rgba(16,185,129,1) 50%, rgba(6,95,70,1) 100%)',
          color: '#ffffff',
          fontFamily: 'Inter, Arial, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '30px',
            }}
          >
            +
          </div>
          <div style={{ fontSize: '42px', fontWeight: 700 }}>{SITE_NAME}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '920px' }}>
          <div style={{ fontSize: '64px', lineHeight: 1.05, fontWeight: 700 }}>
            Medicaments, pharmacies de garde et assistant IA
          </div>
          <div style={{ fontSize: '30px', lineHeight: 1.3, opacity: 0.95 }}>{SITE_DESCRIPTION}</div>
        </div>

        <div style={{ fontSize: '24px', opacity: 0.9 }}>pharmadw.ma</div>
      </div>
    ),
    size
  )
}
