import React, { useState, useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
  const [normResult, setNormResult] = useState<null | {
    summary_fr: string;
    bullets_fr: string[];
    action: 'OK' | 'Surveiller' | 'Ajuster dose' | 'Éviter/Contre-indiqué';
    severity: 'aucune' | 'mineure' | 'modérée' | 'majeure' | 'contre-indiquée';
    mechanism?: string;
    patient_specific_notes?: string[];
    citations?: string[];
    triage: 'vert' | 'ambre' | 'rouge';
  }>(null);

  // Contexte patient (optionnel) — mémorisé en session
  const [age, setAge] = useState<string>('');
  const [pregnancy, setPregnancy] = useState<'enceinte' | 'non_enceinte' | 'inconnu'>('inconnu');
  const [breastfeeding, setBreastfeeding] = useState<'oui' | 'non' | 'inconnu'>('inconnu');
  const [egfr, setEgfr] = useState<string>('');
  const [ckdStage, setCkdStage] = useState<string>('');
  const [allergiesStr, setAllergiesStr] = useState<string>('');
  const [conditionsStr, setConditionsStr] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [riskQT, setRiskQT] = useState<boolean>(false);
  const [riskFall, setRiskFall] = useState<boolean>(false);
  const sessionKey = 'patientContextV1';

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(sessionKey);
      if (!raw) return;
      const obj = JSON.parse(raw);
      if (obj) {
        setAge(obj.age ?? '');
        setPregnancy(obj.pregnancy ?? 'inconnu');
        setBreastfeeding(obj.breastfeeding ?? 'inconnu');
        setEgfr(obj.egfr ?? '');
        setCkdStage(obj.ckdStage ?? '');
        setAllergiesStr(obj.allergiesStr ?? '');
        setConditionsStr(obj.conditionsStr ?? '');
        setWeight(obj.weight ?? '');
        setRiskQT(!!obj.riskQT);
        setRiskFall(!!obj.riskFall);
      }
    } catch {}
  }, []);

  useEffect(() => {
    const obj = {
      age,
      pregnancy,
      breastfeeding,
      egfr,
      ckdStage,
      allergiesStr,
      conditionsStr,
      weight,
      riskQT,
      riskFall,
    };
    try { sessionStorage.setItem(sessionKey, JSON.stringify(obj)); } catch {}
  }, [age, pregnancy, breastfeeding, egfr, ckdStage, allergiesStr, conditionsStr, weight, riskQT, riskFall]);
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
    setNormResult(null);
    try {
      const patient: any = {
        age: age ? Number(age) : undefined,
        weight_kg: weight ? Number(weight) : undefined,
        pregnancy_status: pregnancy,
        breastfeeding,
        renal_function: {
          eGFR: egfr ? Number(egfr) : undefined,
          CKD_stage: ckdStage || undefined,
        },
        allergies: allergiesStr
          ? allergiesStr.split(',').map((s) => s.trim()).filter(Boolean)
          : undefined,
        conditions: conditionsStr
          ? conditionsStr.split(',').map((s) => s.trim()).filter(Boolean)
          : undefined,
        risk_flags: [riskQT ? 'QT_prolongation' : null, riskFall ? 'chute' : null].filter(Boolean),
      };

      const res = await fetch('/api/check-interaction', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          drug1: { name: drug1 },
          drug2: { name: drug2 },
          patient,
          locale: 'fr-FR',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erreur inconnue');
      // Support both old and new formats during migration
      if (data?.summary_fr) {
        setNormResult(data);
      } else {
        setCheckAnswer(typeof data?.answer === 'string' ? data.answer : null);
        setCheckSources(Array.isArray(data?.sources) ? data.sources : null);
      }
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
          {/* Contexte patient (optionnel) */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="grid gap-1">
              <label className="text-sm font-medium">Âge</label>
              <Input inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} placeholder="ex. 72" />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium">Grossesse</label>
              <select className="border rounded-md h-9 px-3 text-sm" value={pregnancy} onChange={(e) => setPregnancy(e.target.value as any)}>
                <option value="inconnu">Inconnu</option>
                <option value="enceinte">Enceinte</option>
                <option value="non_enceinte">Non enceinte</option>
              </select>
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium">Allaitement</label>
              <select className="border rounded-md h-9 px-3 text-sm" value={breastfeeding} onChange={(e) => setBreastfeeding(e.target.value as any)}>
                <option value="inconnu">Inconnu</option>
                <option value="oui">Oui</option>
                <option value="non">Non</option>
              </select>
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium">eGFR (mL/min/1.73m²)</label>
              <Input inputMode="numeric" value={egfr} onChange={(e) => setEgfr(e.target.value)} placeholder="ex. 38" />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium">CKD (stade)</label>
              <Input value={ckdStage} onChange={(e) => setCkdStage(e.target.value)} placeholder="ex. 3b" />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium">Poids (kg)</label>
              <Input inputMode="numeric" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="ex. 63" />
            </div>
            <div className="grid gap-1 sm:col-span-3">
              <label className="text-sm font-medium">Allergies (tags séparés par des virgules)</label>
              <Input value={allergiesStr} onChange={(e) => setAllergiesStr(e.target.value)} placeholder="ex. pénicillines, AINS, sulfamides" />
            </div>
            <div className="grid gap-1 sm:col-span-3">
              <label className="text-sm font-medium">Comorbidités (tags séparés par des virgules)</label>
              <Input value={conditionsStr} onChange={(e) => setConditionsStr(e.target.value)} placeholder="ex. HTA, FA, épilepsie, glaucome, HBP" />
            </div>
            <div className="flex items-center gap-6 sm:col-span-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="accent-primary" checked={riskQT} onChange={(e) => setRiskQT(e.target.checked)} />
                Risque QT
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="accent-primary" checked={riskFall} onChange={(e) => setRiskFall(e.target.checked)} />
                Somnolence/Chute
              </label>
            </div>
          </div>

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
          {normResult && (
            <div className="text-sm break-words whitespace-pre-wrap hyphens-auto space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={
                  normResult.triage === 'vert' ? 'bg-emerald-600 text-white' :
                  normResult.triage === 'ambre' ? 'bg-amber-500 text-white' :
                  'bg-red-600 text-white'
                }>{normResult.triage.toUpperCase()}</Badge>
                <Badge variant="secondary">Action: {normResult.action}</Badge>
                <Badge variant="outline">Gravité: {normResult.severity}</Badge>
              </div>
              <p className="font-medium">{normResult.summary_fr}</p>
              {normResult.bullets_fr?.length > 0 && (
                <ul className="list-disc pl-6 space-y-2">
                  {normResult.bullets_fr.map((b: string, i: number) => (
                    <li key={i} className="leading-relaxed">{b}</li>
                  ))}
                </ul>
              )}
              {normResult.patient_specific_notes?.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Notes patient</p>
                  <ul className="list-disc pl-6 space-y-1">
                    {normResult.patient_specific_notes.map((n: string, i: number) => (
                      <li key={i} className="text-sm">{n}</li>
                    ))}
                  </ul>
                </div>
              )}
              {normResult.citations?.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2 break-words">
                  Source :{' '}
                  {normResult.citations.map((s, i) => (
                    <span key={i}>
                      <a href={s} target="_blank" rel="noreferrer" className="underline">drugs.com</a>
                      {i < normResult.citations!.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </p>
              )}
            </div>
          )}
          {!normResult && checkAnswer && (
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
