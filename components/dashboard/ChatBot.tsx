import React, {
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Bot,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Search,
  ChevronDown,
  Sparkles,
  FlaskConical,
  Baby,
  Heart,
  Scale,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Types & Config                                                     */
/* ------------------------------------------------------------------ */
export type ChatBotHandle = {
  focusInteractions: () => void;
  showHistory: () => void;
};

const triageConfig = {
  vert: {
    border: 'border-l-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    ring: 'ring-emerald-200 dark:ring-emerald-800/40',
    icon: CheckCircle2,
    iconColor: 'text-emerald-600',
    badgeBg: 'bg-emerald-600 text-white',
    label: 'Compatible',
  },
  ambre: {
    border: 'border-l-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    ring: 'ring-amber-200 dark:ring-amber-800/40',
    icon: AlertTriangle,
    iconColor: 'text-amber-600',
    badgeBg: 'bg-amber-500 text-white',
    label: 'Précaution',
  },
  rouge: {
    border: 'border-l-red-500',
    bg: 'bg-red-50 dark:bg-red-950/30',
    ring: 'ring-red-200 dark:ring-red-800/40',
    icon: AlertCircle,
    iconColor: 'text-red-600',
    badgeBg: 'bg-red-600 text-white',
    label: 'Danger',
  },
};

/* ------------------------------------------------------------------ */
/*  Quick suggestions                                                  */
/* ------------------------------------------------------------------ */
const suggestions = [
  { d1: 'Ibuprofène', d2: 'Warfarine' },
  { d1: 'Méthotrexate', d2: 'Triméthoprime' },
  { d1: 'Fluoxétine', d2: 'Tramadol' },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
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

  /* Patient context */
  const [showContext, setShowContext] = useState(false);
  const [age, setAge] = useState<string>('');
  const [pregnancy, setPregnancy] = useState<
    'enceinte' | 'non_enceinte' | 'inconnu'
  >('inconnu');
  const [breastfeeding, setBreastfeeding] = useState<
    'oui' | 'non' | 'inconnu'
  >('inconnu');
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
    try {
      sessionStorage.setItem(sessionKey, JSON.stringify(obj));
    } catch {}
  }, [
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
  ]);

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
      setCheckError('Veuillez saisir deux médicaments.');
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
          ? allergiesStr
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined,
        conditions: conditionsStr
          ? conditionsStr
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined,
        risk_flags: [
          riskQT ? 'QT_prolongation' : null,
          riskFall ? 'chute' : null,
        ].filter(Boolean),
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
        setCheckAnswer(
          typeof data?.answer === 'string' ? data.answer : null
        );
        setCheckSources(
          Array.isArray(data?.sources) ? data.sources : null
        );
      }
    } catch (err: any) {
      setCheckError(err?.message || 'Une erreur est survenue.');
    } finally {
      setCheckLoading(false);
    }
  };

  const handleInteractionKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleInteractionSubmit();
    }
  };

  const handleSuggestion = (d1: string, d2: string) => {
    setDrug1(d1);
    setDrug2(d2);
    setCheckError(null);
    setCheckAnswer(null);
    setNormResult(null);
  };

  const interactionLines = (checkAnswer || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.replace(/^[-]\s*/, ''));

  const contextFieldCount = [
    age,
    pregnancy !== 'inconnu' ? pregnancy : '',
    breastfeeding !== 'inconnu' ? breastfeeding : '',
    egfr,
    ckdStage,
    allergiesStr,
    conditionsStr,
    weight,
    riskQT ? 'QT' : '',
    riskFall ? 'fall' : '',
  ].filter(Boolean).length;

  return (
    <div className="w-full space-y-6">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-2xl pharma-gradient flex items-center justify-center shadow-md shadow-primary/20">
          <Bot className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Assistant DwaIA
          </h1>
          <p className="text-xs text-muted-foreground">
            Interactions médicamenteuses en temps réel
          </p>
        </div>
        <div className="ml-auto">
          <Badge
            variant="outline"
            className="text-[10px] font-medium text-primary border-primary/30"
          >
            <Sparkles className="h-3 w-3 mr-1" />
            IA
          </Badge>
        </div>
      </div>

      {/* ── Drug inputs ────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-background shadow-sm overflow-hidden">
        <form onSubmit={handleInteractionSubmit} className="p-5 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Médicament 1
              </label>
              <Input
                ref={drug1Ref}
                autoFocus
                value={drug1}
                onChange={(e) => setDrug1(e.target.value)}
                onKeyDown={handleInteractionKeyDown}
                placeholder="DCI — ex. ibuprofène"
                className="h-12 rounded-xl text-base border-border/70 focus:border-primary"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Médicament 2
              </label>
              <Input
                value={drug2}
                onChange={(e) => setDrug2(e.target.value)}
                onKeyDown={handleInteractionKeyDown}
                placeholder="DCI — ex. warfarine"
                className="h-12 rounded-xl text-base border-border/70 focus:border-primary"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={checkLoading}
            aria-busy={checkLoading}
            className="w-full h-12 rounded-xl text-sm font-semibold shadow-md shadow-primary/20"
          >
            {checkLoading ? (
              <>
                <div className="h-4 w-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Vérifier l&apos;interaction
              </>
            )}
          </Button>
        </form>

        {/* Quick suggestions */}
        <div className="px-5 pb-4">
          <p className="text-[11px] text-muted-foreground mb-2">
            Essayez un exemple :
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s.d1 + s.d2}
                onClick={() => handleSuggestion(s.d1, s.d2)}
                className="text-xs px-3 py-1.5 rounded-full border border-border bg-muted/50 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
              >
                {s.d1} + {s.d2}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Patient context (collapsible) ──────────────────── */}
      <div className="rounded-2xl border border-border bg-background overflow-hidden">
        <button
          onClick={() => setShowContext(!showContext)}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              Contexte patient
            </span>
            {contextFieldCount > 0 && (
              <Badge
                variant="secondary"
                className="text-[10px] h-5 px-1.5 font-medium"
              >
                {contextFieldCount} renseigné
                {contextFieldCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <ChevronDown
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform duration-200',
              showContext && 'rotate-180'
            )}
          />
        </button>

        {showContext && (
          <div className="px-5 pb-5 border-t border-border/50 pt-4 animate-fade-in">
            <div className="grid gap-3 sm:grid-cols-3">
              <ContextField
                icon={<Heart className="h-3.5 w-3.5" />}
                label="Âge"
              >
                <Input
                  inputMode="numeric"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="72"
                  className="h-9 rounded-lg"
                />
              </ContextField>
              <ContextField
                icon={<Baby className="h-3.5 w-3.5" />}
                label="Grossesse"
              >
                <select
                  className="w-full border border-input rounded-lg h-9 px-3 text-sm bg-background"
                  value={pregnancy}
                  onChange={(e) => setPregnancy(e.target.value as any)}
                >
                  <option value="inconnu">Inconnu</option>
                  <option value="enceinte">Enceinte</option>
                  <option value="non_enceinte">Non enceinte</option>
                </select>
              </ContextField>
              <ContextField
                icon={<Baby className="h-3.5 w-3.5" />}
                label="Allaitement"
              >
                <select
                  className="w-full border border-input rounded-lg h-9 px-3 text-sm bg-background"
                  value={breastfeeding}
                  onChange={(e) => setBreastfeeding(e.target.value as any)}
                >
                  <option value="inconnu">Inconnu</option>
                  <option value="oui">Oui</option>
                  <option value="non">Non</option>
                </select>
              </ContextField>
              <ContextField label="eGFR (mL/min)">
                <Input
                  inputMode="numeric"
                  value={egfr}
                  onChange={(e) => setEgfr(e.target.value)}
                  placeholder="38"
                  className="h-9 rounded-lg"
                />
              </ContextField>
              <ContextField label="CKD (stade)">
                <Input
                  value={ckdStage}
                  onChange={(e) => setCkdStage(e.target.value)}
                  placeholder="3b"
                  className="h-9 rounded-lg"
                />
              </ContextField>
              <ContextField
                icon={<Scale className="h-3.5 w-3.5" />}
                label="Poids (kg)"
              >
                <Input
                  inputMode="numeric"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="63"
                  className="h-9 rounded-lg"
                />
              </ContextField>
              <div className="sm:col-span-3">
                <ContextField label="Allergies">
                  <Input
                    value={allergiesStr}
                    onChange={(e) => setAllergiesStr(e.target.value)}
                    placeholder="pénicillines, AINS, sulfamides"
                    className="h-9 rounded-lg"
                  />
                </ContextField>
              </div>
              <div className="sm:col-span-3">
                <ContextField label="Comorbidités">
                  <Input
                    value={conditionsStr}
                    onChange={(e) => setConditionsStr(e.target.value)}
                    placeholder="HTA, FA, épilepsie"
                    className="h-9 rounded-lg"
                  />
                </ContextField>
              </div>
              <div className="flex items-center gap-6 sm:col-span-3 pt-1">
                <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    className="accent-primary rounded"
                    checked={riskQT}
                    onChange={(e) => setRiskQT(e.target.checked)}
                  />
                  Risque QT
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    className="accent-primary rounded"
                    checked={riskFall}
                    onChange={(e) => setRiskFall(e.target.checked)}
                  />
                  Somnolence / Chute
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Error ──────────────────────────────────────────── */}
      {checkError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3 animate-fade-in">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
          <p role="alert" className="text-sm text-destructive">
            {checkError}
          </p>
        </div>
      )}

      {/* ── Triage result ──────────────────────────────────── */}
      {normResult &&
        (() => {
          const tc = triageConfig[normResult.triage] || triageConfig.ambre;
          const TriageIcon = tc.icon;
          return (
            <div
              className={cn(
                'rounded-2xl border-l-4 p-5 md:p-6 space-y-5 ring-1 animate-fade-in',
                tc.border,
                tc.bg,
                tc.ring
              )}
            >
              {/* Header */}
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                    tc.bg
                  )}
                >
                  <TriageIcon className={cn('h-5 w-5', tc.iconColor)} />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={tc.badgeBg}>
                      {tc.label} — {normResult.triage.toUpperCase()}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">
                      {normResult.action}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      Sévérité : {normResult.severity}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium leading-relaxed text-foreground">
                    {normResult.summary_fr}
                  </p>
                </div>
              </div>

              {/* Bullets */}
              {normResult.bullets_fr?.length > 0 && (
                <ul className="space-y-2.5 pl-[52px]">
                  {normResult.bullets_fr.map((b: string, i: number) => (
                    <li
                      key={i}
                      className="text-sm leading-relaxed text-foreground/90 flex items-start gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current mt-2 shrink-0 opacity-40" />
                      {b}
                    </li>
                  ))}
                </ul>
              )}

              {/* Patient notes */}
              {normResult.patient_specific_notes &&
                normResult.patient_specific_notes.length > 0 && (
                  <div className="pl-[52px] space-y-2 border-t border-border/30 pt-4">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                      Notes patient
                    </p>
                    <ul className="space-y-1.5">
                      {normResult.patient_specific_notes.map(
                        (n: string, i: number) => (
                          <li
                            key={i}
                            className="text-sm leading-relaxed flex items-start gap-2"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current mt-2 shrink-0 opacity-40" />
                            {n}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}
            </div>
          );
        })()}

      {/* ── Fallback (old format) ──────────────────────────── */}
      {!normResult && checkAnswer && (
        <div className="rounded-2xl border-l-4 border-l-primary/50 bg-primary/5 p-5 text-sm animate-fade-in">
          <ul className="space-y-2">
            {interactionLines.map((line, idx) => (
              <li
                key={idx}
                className="leading-relaxed flex items-start gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0 opacity-50" />
                {line}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Sources footer ─────────────────────────────────── */}
      <div className="flex items-start gap-3 text-xs text-muted-foreground bg-surface rounded-xl p-4">
        <FlaskConical className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground/60" />
        <div className="space-y-0.5">
          <p className="font-semibold text-foreground/80">
            Sources : Micromedex, Cerner Multum, ASHP
          </p>
          <p>
            IA basée sur des bases de données médicales validées, mises à jour
            régulièrement. Vérifiez toujours les résultats.
          </p>
        </div>
      </div>
    </div>
  );
});

/* ------------------------------------------------------------------ */
/*  Tiny helper for labeled context fields                             */
/* ------------------------------------------------------------------ */
function ContextField({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
        {icon}
        {label}
      </label>
      {children}
    </div>
  );
}
