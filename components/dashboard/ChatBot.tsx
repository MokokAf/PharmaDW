import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot } from 'lucide-react';

export type ChatBotHandle = {
  focusInteractions: () => void;
  showHistory: () => void;
};

export const ChatBot = forwardRef<ChatBotHandle, {}>((props, ref) => {
  // No chat state; component focuses on interaction checker only.

  // État pour le vérificateur d'interactions
  const [drug1, setDrug1] = useState('');
  const [drug2, setDrug2] = useState('');
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [checkAnswer, setCheckAnswer] = useState<string | null>(null);
  const [checkSources, setCheckSources] = useState<string[] | null>(null);
  const drug1Ref = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focusInteractions: () => {
      drug1Ref.current?.focus();
    },
    showHistory: () => {},
  }));

  const handleInteractionSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!drug1.trim() || !drug2.trim()) {
      setCheckError("Veuillez saisir deux médicaments.");
      return;
    }
    setCheckLoading(true);
    setCheckError(null);
    setCheckAnswer(null);
    setCheckSources(null);
    try {
      const res = await fetch('/api/check-interaction', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ drug1, drug2 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erreur inconnue');
      setCheckAnswer(typeof data?.answer === 'string' ? data.answer : null);
      setCheckSources(Array.isArray(data?.sources) ? data.sources : null);
    } catch (err: any) {
      setCheckError(err?.message || "Une erreur est survenue.");
    } finally {
      setCheckLoading(false);
    }
  };

  const handleInteractionKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleInteractionSubmit();
    }
  };

  // Chat-related code removed

  const interactionLines =
    (checkAnswer || '')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => l.replace(/^[-]\s*/, ''));

  return (
    <Card className="w-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          Assistant DwaIA 2.0 — Interactions médicamenteuses
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col p-0">
        {/* Informations sur les bases de données (texte discret) */}
        <div className="px-4 pb-3 text-xs sm:text-sm text-muted-foreground space-y-2">
          <p className="font-medium">Bases de données médicales de l’IA</p>
          <p>
            Notre intelligence artificielle s’appuie exclusivement sur des bases de données médicales validées et reconnues par la communauté pharmaceutique et médicale mondiale, mises à jour régulièrement :
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <span className="font-medium">Micromedex® (IBM Watson Health)</span> – Base de données clinique utilisée dans les hôpitaux du monde entier, offrant des informations validées sur les médicaments, leurs effets et leurs interactions.
            </li>
            <li>
              <span className="font-medium">Cerner Multum™ (Cerner Corporation)</span> – Fournisseur de contenus médicamenteux intégré aux dossiers médicaux électroniques, reconnu pour la clarté de ses guides destinés aux professionnels comme aux patients.
            </li>
            <li>
              <span className="font-medium">ASHP (American Society of Health-System Pharmacists)</span> – Éditeur de l’AHFS Drug Information®, compendium officiel et indépendant, largement cité par les autorités de santé américaines (FDA, Congrès).
            </li>
          </ul>
        </div>
        {/* Vérificateur d'associations de médicaments */}
        <div className="p-4 border-t space-y-3">
          <form onSubmit={handleInteractionSubmit} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div className="grid gap-1">
              <label className="text-sm font-medium">Médicament 1 (DCI)</label>
              <Input
                ref={drug1Ref}
                autoFocus
                value={drug1}
                onChange={(e) => setDrug1(e.target.value)}
                onKeyDown={handleInteractionKeyDown}
                placeholder="Ex. ibuprofène (DCI)"
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                required
              />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium">Médicament 2 (DCI)</label>
              <Input
                value={drug2}
                onChange={(e) => setDrug2(e.target.value)}
                onKeyDown={handleInteractionKeyDown}
                placeholder="Ex. warfarine (DCI)"
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                required
              />
            </div>
            <Button type="submit" disabled={checkLoading} aria-busy={checkLoading} className="mt-2 sm:mt-0 w-full sm:w-auto justify-self-stretch sm:justify-self-end" title="Appuyez sur Entrée ↵ pour soumettre">
              {checkLoading ? 'Recherche en cours…' : 'Vérifier l’interaction'}
            </Button>
            <div className="sm:col-span-2 -mt-1">
              <p className="text-xs text-muted-foreground">Saisissez la DCI, pas le nom commercial.</p>
            </div>
          </form>
          {checkError && (
            <p role="alert" aria-live="polite" className="text-sm text-destructive">{checkError}</p>
          )}
          {checkAnswer && (
            <div className="text-sm break-words whitespace-pre-wrap hyphens-auto">
              <ul className="list-disc pl-6 space-y-2 break-words">
                {interactionLines.map((line, idx) => (
                  <li key={idx} className="break-words leading-relaxed">{line}</li>
                ))}
              </ul>
              {checkSources && checkSources.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2 break-words">
                  Source :{' '}
                  {checkSources.map((s, i) => (
                    <span key={i}>
                      <a href={s} target="_blank" rel="noreferrer" className="underline">drugs.com</a>
                      {i < checkSources.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </p>
              )}
            </div>
          )}
        </div>
        {/* Chat section removed for this UI: message history and input omitted intentionally */}
      </CardContent>
    </Card>
  );
});
