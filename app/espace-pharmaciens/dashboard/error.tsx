'use client'

import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 space-y-4">
        <div className="flex items-start gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
          <div>
            <h1 className="text-base font-semibold">Erreur dans l espace pharmacien</h1>
            <p className="text-sm mt-1">{error.message || 'Une erreur inattendue est survenue.'}</p>
          </div>
        </div>
        <Button type="button" variant="outline" className="h-11" onClick={reset}>
          Recharger le tableau de bord
        </Button>
      </div>
    </main>
  )
}
