import React, { useState, useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

export type ChatBotHandle = {
  focusInteractions: () => void;
  showHistory: () => void;
};

const triageConfig = {
  vert: { border: 'border-l-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30', icon: CheckCircle2, iconColor: 'text-emerald-600' },
  ambre: { border: 'border-l-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30', icon: AlertTriangle, iconColor: 'text-amber-600' },
  rouge: { border: 'border-l-red-500', bg: 'bg-red-50 dark:bg-red-950/30', icon: AlertCircle, iconColor: 'text-red-600' },
};

export const ChatBot = forwardRef<ChatBotHandle, {}>((props, ref) => {
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
      age, pregnancy, breastfeeding, egfr, ckdStage,
      allergiesStr, conditionsStr, weight, riskQT, riskFall,
    };
    try { sessionStorage.setItem(sessionKey, JSON.stringify(obj)); } catch {}
  }, [age, pregnancy, breastfeeding, egfr, ckdStage, allergiesStr, conditionsStr, weight, riskQT, riskFall]);

  const drug1Ref = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focusInteractions: () => { drug1Ref.current?.focus(); },
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

  const interactionLines =
    (checkAnswer || '')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => l.replace(/^[-]\s*/, ''));

  return (
    <div className="w-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 md:px-6 md:py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Interactions médicamenteuses</h2>
            <p className="text-xs text-muted-foreground">Assistant DwaIA 2.0</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 md:px-6 space-y-4">
        {/* Patient context accordion */}
        <Accordion type="single" collapsible>
          <AccordionItem value="patient-context" className="border rounded-lg">
            <AccordionTrigger className="px-4 py-3 text-sm hover:no-underline">
              Contexte patient (optionnel)
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="grid gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Âge</label>
                  <Input inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} placeholder="ex. 72" className="h-9" />
                </div>
                <div className="grid gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Grossesse</label>
                  <select className="border rounded-lg h-9 px-3 text-sm bg-background" value={pregnancy} onChange={(e) => setPregnancy(e.target.value as any)}>
                    <option value="inconnu">Inconnu</option>
                    <option value="enceinte">Enceinte</option>
                    <option value="non_enceinte">Non enceinte</option>
                  </select>
                </div>
                <div className="grid gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Allaitement</label>
                  <select className="border rounded-lg h-9 px-3 text-sm bg-background" value={breastfeeding} onChange={(e) => setBreastfeeding(e.target.value as any)}>
                    <option value="inconnu">Inconnu</option>
                    <option value="oui">Oui</option>
                    <option value="non">Non</option>
                  </select>
                </div>
                <div className="grid gap-1">
                  <label className="text-xs font-medium text-muted-foreground">eGFR (mL/min)</label>
                  <Input inputMode="numeric" value={egfr} onChange={(e) => setEgfr(e.target.value)} placeholder="ex. 38" className="h-9" />
                </div>
                <div className="grid gap-1">
                  <label className="text-xs font-medium text-muted-foreground">CKD (stade)</label>
                  <Input value={ckdStage} onChange={(e) => setCkdStage(e.target.value)} placeholder="ex. 3b" className="h-9" />
                </div>
                <div className="grid gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Poids (kg)</label>
                  <Input inputMode="numeric" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="ex. 63" className="h-9" />
                </div>
                <div className="grid gap-1 sm:col-span-3">
                  <label className="text-xs font-medium text-muted-foreground">Allergies</label>
                  <Input value={allergiesStr} onChange={(e) => setAllergiesStr(e.target.value)} placeholder="pénicillines, AINS, sulfamides" className="h-9" />
                </div>
                <div className="grid gap-1 sm:col-span-3">
                  <label className="text-xs font-medium text-muted-foreground">Comorbidités</label>
                  <Input value={conditionsStr} onChange={(e) => setConditionsStr(e.target.value)} placeholder="HTA, FA, épilepsie" className="h-9" />
                </div>
                <div className="flex items-center gap-6 sm:col-span-3">
                  <label className="flex items-center gap-2 text-xs">
                    <input type="checkbox" className="accent-primary" checked={riskQT} onChange={(e) => setRiskQT(e.target.checked)} />
                    Risque QT
                  </label>
                  <label className="flex items-center gap-2 text-xs">
                    <input type="checkbox" className="accent-primary" checked={riskFall} onChange={(e) => setRiskFall(e.target.checked)} />
                    Somnolence/Chute
                  </label>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Drug inputs */}
        <form onSubmit={handleInteractionSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1">
              <label className="text-xs font-medium text-muted-foreground">Médicament 1 (DCI)</label>
              <Input
                ref={drug1Ref}
                autoFocus
                value={drug1}
                onChange={(e) => setDrug1(e.target.value)}
                onKeyDown={handleInteractionKeyDown}
                placeholder="Ex. ibuprofène"
                className="h-11"
                required
              />
            </div>
            <div className="grid gap-1">
              <label className="text-xs font-medium text-muted-foreground">Médicament 2 (DCI)</label>
              <Input
                value={drug2}
                onChange={(e) => setDrug2(e.target.value)}
                onKeyDown={handleInteractionKeyDown}
                placeholder="Ex. warfarine"
                className="h-11"
                required
              />
            </div>
          </div>
          <Button type="submit" disabled={checkLoading} aria-busy={checkLoading} className="w-full h-11 rounded-lg">
            {checkLoading ? 'Recherche en cours...' : 'Vérifier l\u2019interaction'}
          </Button>
          <p className="text-[11px] text-muted-foreground text-center">Saisissez la DCI, pas le nom commercial.</p>
        </form>

        {/* Error */}
        {checkError && (
          <p role="alert" aria-live="polite" className="text-sm text-destructive">{checkError}</p>
        )}

        {/* Triage result card */}
        {normResult && (() => {
          const tc = triageConfig[normResult.triage] || triageConfig.ambre;
          const TriageIcon = tc.icon;
          return (
            <div className={cn("rounded-lg border-l-4 p-4 space-y-3", tc.border, tc.bg)}>
              <div className="flex items-start gap-3">
                <TriageIcon className={cn("h-5 w-5 mt-0.5 shrink-0", tc.iconColor)} />
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={
                      normResult.triage === 'vert' ? 'bg-emerald-600 text-white' :
                      normResult.triage === 'ambre' ? 'bg-amber-500 text-white' :
                      'bg-red-600 text-white'
                    }>{normResult.triage.toUpperCase()}</Badge>
                    <Badge variant="secondary" className="text-xs">Action : {normResult.action}</Badge>
                    <Badge variant="outline" className="text-xs">Gravité : {normResult.severity}</Badge>
                  </div>
                  <p className="text-sm font-medium">{normResult.summary_fr}</p>
                </div>
              </div>

              {normResult.bullets_fr?.length > 0 && (
                <ul className="list-disc pl-9 space-y-1.5 text-sm">
                  {normResult.bullets_fr.map((b: string, i: number) => (
                    <li key={i} className="leading-relaxed">{b}</li>
                  ))}
                </ul>
              )}
              {normResult.patient_specific_notes && normResult.patient_specific_notes.length > 0 && (
                <div className="pl-9 space-y-1 border-t border-border/30 pt-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Notes patient</p>
                  <ul className="list-disc pl-5 space-y-1">
                    {normResult.patient_specific_notes.map((n: string, i: number) => (
                      <li key={i} className="text-sm">{n}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })()}

        {/* Fallback answer (old format) */}
        {!normResult && checkAnswer && (
          <div className="rounded-lg border-l-4 border-l-primary/50 bg-primary/5 p-4 text-sm">
            <ul className="list-disc pl-5 space-y-2">
              {interactionLines.map((line, idx) => (
                <li key={idx} className="leading-relaxed">{line}</li>
              ))}
            </ul>
          </div>
        )}

        {/* DB info — compact */}
        <div className="pt-4 border-t text-xs text-muted-foreground space-y-1.5">
          <p className="font-medium">Sources : Micromedex, Cerner Multum, ASHP</p>
          <p>
            IA basée sur des bases de données médicales validées, mises à jour régulièrement.
          </p>
        </div>
      </div>
    </div>
  );
});
