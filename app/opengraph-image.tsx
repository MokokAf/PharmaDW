import { ImageResponse } from 'next/og'
import { SITE_DESCRIPTION, SITE_NAME } from '@/lib/seo'

export const runtime = 'edge'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'
export const alt = "DwaIA - L'intelligence pharmaceutique du Maroc"

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
            'linear-gradient(135deg, #0F3D3E 0%, #1A5556 50%, #0A2C2D 100%)',
          color: '#ffffff',
          fontFamily: 'Manrope, Arial, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'rgba(94,211,198,0.25)',
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
            L&apos;intelligence pharmaceutique du Maroc
          </div>
          <div style={{ fontSize: '30px', lineHeight: 1.3, opacity: 0.95 }}>
            Analysez. Vérifiez. Décidez avec précision.
          </div>
        </div>

        <div style={{ fontSize: '24px', opacity: 0.9 }}>dwa-ia-maroc.com</div>
      </div>
    ),
    size
  )
}
