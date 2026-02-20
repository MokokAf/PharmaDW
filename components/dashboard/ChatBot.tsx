import React, { useState, useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, AlertTriangle, CheckCircle2, AlertCircle, Search } from 'lucide-react';
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
    <div className="w-full space-y-6">
      {/* Header card */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Bot className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">Interactions médicamenteuses</h1>
          <p className="text-xs text-muted-foreground">Assistant DwaIA 2.0</p>
        </div>
      </div>

      {/* Drug inputs — main CTA */}
      <div className="rounded-xl border border-border bg-background p-5 space-y-4">
        <form onSubmit={handleInteractionSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Médicament 1 (DCI)</label>
              <Input
                ref={drug1Ref}
                autoFocus
                value={drug1}
                onChange={(e) => setDrug1(e.target.value)}
                onKeyDown={handleInteractionKeyDown}
                placeholder="Ex. ibuprofène"
                className="h-11 rounded-lg"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Médicament 2 (DCI)</label>
              <Input
                value={drug2}
                onChange={(e) => setDrug2(e.target.value)}
                onKeyDown={handleInteractionKeyDown}
                placeholder="Ex. warfarine"
                className="h-11 rounded-lg"
                required
              />
            </div>
          </div>
          <Button type="submit" disabled={checkLoading} aria-busy={checkLoading} className="w-full h-12 rounded-lg text-sm font-medium">
            <Search className="h-4 w-4 mr-2" />
            {checkLoading ? 'Recherche en cours...' : 'Vérifier l\u2019interaction'}
          </Button>
          <p className="text-[11px] text-muted-foreground text-center">Saisissez la DCI (dénomination commune internationale), pas le nom commercial.</p>
        </form>
      </div>

      {/* Patient context — collapsed by default */}
      <Accordion type="single" collapsible>
        <AccordionItem value="patient-context" className="rounded-xl border border-border bg-background overflow-hidden">
          <AccordionTrigger className="px-5 py-3.5 text-sm font-medium hover:no-underline">
            Contexte patient (optionnel)
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Âge</label>
                <Input inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} placeholder="ex. 72" className="h-9 rounded-lg" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Grossesse</label>
                <select className="w-full border border-input rounded-lg h-9 px-3 text-sm bg-background" value={pregnancy} onChange={(e) => setPregnancy(e.target.value as any)}>
                  <option value="inconnu">Inconnu</option>
                  <option value="enceinte">Enceinte</option>
                  <option value="non_enceinte">Non enceinte</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Allaitement</label>
                <select className="w-full border border-input rounded-lg h-9 px-3 text-sm bg-background" value={breastfeeding} onChange={(e) => setBreastfeeding(e.target.value as any)}>
                  <option value="inconnu">Inconnu</option>
                  <option value="oui">Oui</option>
                  <option value="non">Non</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">eGFR (mL/min)</label>
                <Input inputMode="numeric" value={egfr} onChange={(e) => setEgfr(e.target.value)} placeholder="ex. 38" className="h-9 rounded-lg" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">CKD (stade)</label>
                <Input value={ckdStage} onChange={(e) => setCkdStage(e.target.value)} placeholder="ex. 3b" className="h-9 rounded-lg" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Poids (kg)</label>
                <Input inputMode="numeric" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="ex. 63" className="h-9 rounded-lg" />
              </div>
              <div className="space-y-1 sm:col-span-3">
                <label className="text-xs font-medium text-muted-foreground">Allergies</label>
                <Input value={allergiesStr} onChange={(e) => setAllergiesStr(e.target.value)} placeholder="pénicillines, AINS, sulfamides" className="h-9 rounded-lg" />
              </div>
              <div className="space-y-1 sm:col-span-3">
                <label className="text-xs font-medium text-muted-foreground">Comorbidités</label>
                <Input value={conditionsStr} onChange={(e) => setConditionsStr(e.target.value)} placeholder="HTA, FA, épilepsie" className="h-9 rounded-lg" />
              </div>
              <div className="flex items-center gap-6 sm:col-span-3 pt-1">
                <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <input type="checkbox" className="accent-primary rounded" checked={riskQT} onChange={(e) => setRiskQT(e.target.checked)} />
                  Risque QT
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <input type="checkbox" className="accent-primary rounded" checked={riskFall} onChange={(e) => setRiskFall(e.target.checked)} />
                  Somnolence/Chute
                </label>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Error */}
      {checkError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p role="alert" aria-live="polite" className="text-sm text-destructive">{checkError}</p>
        </div>
      )}

      {/* Triage result card */}
      {normResult && (() => {
        const tc = triageConfig[normResult.triage] || triageConfig.ambre;
        const TriageIcon = tc.icon;
        return (
          <div className={cn("rounded-xl border-l-4 p-5 space-y-4", tc.border, tc.bg)}>
            <div className="flex items-start gap-3">
              <TriageIcon className={cn("h-5 w-5 mt-0.5 shrink-0", tc.iconColor)} />
              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={
                    normResult.triage === 'vert' ? 'bg-emerald-600 text-white' :
                    normResult.triage === 'ambre' ? 'bg-amber-500 text-white' :
                    'bg-red-600 text-white'
                  }>{normResult.triage.toUpperCase()}</Badge>
                  <Badge variant="secondary" className="text-xs">Action : {normResult.action}</Badge>
                  <Badge variant="outline" className="text-xs">Gravité : {normResult.severity}</Badge>
                </div>
                <p className="text-sm font-medium leading-relaxed">{normResult.summary_fr}</p>
              </div>
            </div>

            {normResult.bullets_fr?.length > 0 && (
              <ul className="list-disc pl-9 space-y-2 text-sm">
                {normResult.bullets_fr.map((b: string, i: number) => (
                  <li key={i} className="leading-relaxed">{b}</li>
                ))}
              </ul>
            )}
            {normResult.patient_specific_notes && normResult.patient_specific_notes.length > 0 && (
              <div className="pl-9 space-y-1.5 border-t border-border/30 pt-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Notes patient</p>
                <ul className="list-disc pl-5 space-y-1">
                  {normResult.patient_specific_notes.map((n: string, i: number) => (
                    <li key={i} className="text-sm leading-relaxed">{n}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })()}

      {/* Fallback answer (old format) */}
      {!normResult && checkAnswer && (
        <div className="rounded-xl border-l-4 border-l-primary/50 bg-primary/5 p-5 text-sm">
          <ul className="list-disc pl-5 space-y-2">
            {interactionLines.map((line, idx) => (
              <li key={idx} className="leading-relaxed">{line}</li>
            ))}
          </ul>
        </div>
      )}

      {/* DB info */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p className="font-medium">Sources : Micromedex, Cerner Multum, ASHP</p>
        <p>IA basée sur des bases de données médicales validées, mises à jour régulièrement.</p>
      </div>
    </div>
  );
});
