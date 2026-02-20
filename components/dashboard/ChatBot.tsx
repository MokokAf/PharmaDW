import Fuse from 'fuse.js'
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpDown,
  Baby,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  Clipboard,
  Clock3,
  FlaskConical,
  Heart,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export type ChatBotHandle = {
  focusInteractions: () => void
  showHistory: () => void
}

type Triage = 'vert' | 'ambre' | 'rouge'
type Action = 'OK' | 'Surveiller' | 'Ajuster dose' | 'Eviter/Contre-indique'
type Severity = 'aucune' | 'mineure' | 'moderee' | 'majeure' | 'contre-indiquee'

type InteractionResult = {
  summary_fr: string
  bullets_fr: string[]
  action: Action
  severity: Severity
  mechanism?: string
  monitoring?: string[]
  patient_specific_notes?: string[]
  citations?: string[]
  triage: Triage
  raw_text?: string
}

type DrugSearchItem = {
  id: string
  name: string
  activeIngredient: string[]
  dosageForm?: string
  strength?: string
  manufacturer?: string
  searchKey: string
}

type DrugInputPayload = {
  name: string
  active_ingredient_hint?: string[]
}

type RecentCheck = {
  drug1: string
  drug2: string
  timestamp: number
  triage: Triage
  summary: string
}

type PatientPayload = {
  age?: number
  weight_kg?: number
  pregnancy_status: 'enceinte' | 'non_enceinte' | 'inconnu'
  breastfeeding: 'oui' | 'non' | 'inconnu'
  renal_function: {
    eGFR?: number
    CKD_stage?: string
  }
  hepatic_impairment?: 'none' | 'mild' | 'moderate' | 'severe'
  allergies?: string[]
  conditions?: string[]
  risk_flags?: string[]
}

const RECENT_CHECKS_KEY = 'interactionRecentChecksV1'
const PATIENT_CONTEXT_KEY = 'patientContextV2'

const triageConfig: Record<
  Triage,
  {
    border: string
    bg: string
    ring: string
    icon: React.ComponentType<{ className?: string }>
    iconColor: string
    badgeBg: string
    label: string
  }
> = {
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
    iconColor: 'text-amber-700 dark:text-amber-400',
    badgeBg: 'bg-amber-500 text-white',
    label: 'Precaution',
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
}

const quickSuggestions = [
  { d1: 'Ibuprofene', d2: 'Warfarine' },
  { d1: 'Methotrexate', d2: 'Trimethoprime' },
  { d1: 'Fluoxetine', d2: 'Tramadol' },
]

function normalizeForSearch(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeForMatch(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function parseNumber(value: string): number | undefined {
  if (!value.trim()) {
    return undefined
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function isTriage(value: string): value is Triage {
  return value === 'vert' || value === 'ambre' || value === 'rouge'
}

function isInteractionResult(value: unknown): value is InteractionResult {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Record<string, unknown>
  if (typeof candidate.summary_fr !== 'string') {
    return false
  }
  if (!Array.isArray(candidate.bullets_fr)) {
    return false
  }
  if (typeof candidate.action !== 'string') {
    return false
  }
  if (typeof candidate.severity !== 'string') {
    return false
  }
  if (typeof candidate.triage !== 'string' || !isTriage(candidate.triage)) {
    return false
  }

  return true
}

function useDebouncedValue<T>(value: T, delay = 200): T {
  const [debounced, setDebounced] = useState<T>(value)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(timer)
  }, [value, delay])

  return debounced
}

function highlightQuery(text: string, query: string) {
  const trimmedQuery = query.trim()
  if (!trimmedQuery) {
    return text
  }

  const normalizedText = normalizeForMatch(text)
  const normalizedQuery = normalizeForMatch(trimmedQuery)
  const startIndex = normalizedText.indexOf(normalizedQuery)

  if (startIndex < 0) {
    return text
  }

  const map: number[] = []
  for (let index = 0; index < text.length; index += 1) {
    const normalizedChar = text[index].normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    for (let cursor = 0; cursor < normalizedChar.length; cursor += 1) {
      map.push(index)
    }
  }

  const start = map[startIndex] ?? 0
  const endMapIndex = startIndex + normalizedQuery.length - 1
  const end = (map[endMapIndex] ?? text.length - 1) + 1

  return (
    <>
      {text.slice(0, start)}
      <mark className="rounded-sm bg-primary/20 px-0.5 text-foreground">{text.slice(start, end)}</mark>
      {text.slice(end)}
    </>
  )
}

function formatHistoryTime(timestamp: number): string {
  try {
    return new Date(timestamp).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

type AutocompleteInputProps = {
  id: string
  label: string
  value: string
  onChange: (nextValue: string) => void
  onSelectSuggestion?: (selected: DrugSearchItem) => void
  placeholder: string
  autoFocus?: boolean
  loadingIndex: boolean
  search: (query: string) => DrugSearchItem[]
  onEnterWithoutSelection: () => void
  inputRef?: React.RefObject<HTMLInputElement>
}

function AutocompleteInput({
  id,
  label,
  value,
  onChange,
  onSelectSuggestion,
  placeholder,
  autoFocus,
  loadingIndex,
  search,
  onEnterWithoutSelection,
  inputRef,
}: AutocompleteInputProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [didKeyboardNavigate, setDidKeyboardNavigate] = useState(false)

  const debouncedValue = useDebouncedValue(value, 200)
  const normalizedQuery = normalizeForSearch(debouncedValue)

  const suggestions = useMemo(() => {
    if (normalizedQuery.length < 2) {
      return []
    }
    return search(normalizedQuery)
  }, [normalizedQuery, search])

  useEffect(() => {
    setActiveIndex(-1)
    setDidKeyboardNavigate(false)
  }, [suggestions.length])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    window.addEventListener('mousedown', handleClickOutside)
    return () => window.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const showDropdown = isOpen && value.trim().length > 0

  const handleSelect = (selected: DrugSearchItem) => {
    onChange(selected.name)
    onSelectSuggestion?.(selected)
    setIsOpen(false)
    setActiveIndex(-1)
    setDidKeyboardNavigate(false)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' && suggestions.length > 0) {
      event.preventDefault()
      setIsOpen(true)
      setDidKeyboardNavigate(true)
      setActiveIndex((current) => (current < 0 ? 0 : Math.min(current + 1, suggestions.length - 1)))
      return
    }

    if (event.key === 'ArrowUp' && suggestions.length > 0) {
      event.preventDefault()
      setIsOpen(true)
      setDidKeyboardNavigate(true)
      setActiveIndex((current) => {
        if (current < 0) return suggestions.length - 1
        return Math.max(current - 1, 0)
      })
      return
    }

    if (event.key === 'Escape') {
      setIsOpen(false)
      setActiveIndex(-1)
      return
    }

    if (event.key === 'Enter') {
      if (isOpen && didKeyboardNavigate && activeIndex >= 0 && suggestions[activeIndex]) {
        event.preventDefault()
        handleSelect(suggestions[activeIndex])
        return
      }

      setIsOpen(false)
      onEnterWithoutSelection()
    }
  }

  return (
    <div ref={containerRef} className="space-y-1.5 relative">
      <label htmlFor={id} className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {label}
      </label>
      <Input
        id={id}
        ref={inputRef}
        autoFocus={autoFocus}
        value={value}
        onChange={(event) => {
          onChange(event.target.value)
          setIsOpen(true)
          setDidKeyboardNavigate(false)
        }}
        onFocus={() => {
          setIsOpen(true)
          setDidKeyboardNavigate(false)
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        className="h-12 rounded-xl text-base border-border/70 focus:border-primary"
        aria-autocomplete="list"
        aria-expanded={showDropdown}
        aria-controls={`${id}-autocomplete-list`}
      />

      {showDropdown && (
        <div
          id={`${id}-autocomplete-list`}
          className="absolute z-40 mt-1 w-full rounded-xl border border-border bg-popover shadow-lg max-h-64 overflow-y-auto"
        >
          {loadingIndex && normalizedQuery.length >= 2 ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">Chargement de l index medicaments...</p>
          ) : suggestions.length > 0 ? (
            suggestions.map((item, index) => (
              <button
                key={`${id}-${item.id}`}
                type="button"
                className={cn(
                  'w-full text-left px-3 py-2.5 min-h-11 border-b border-border/60 last:border-b-0 transition-colors',
                  index === activeIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/60'
                )}
                onMouseDown={(event) => {
                  event.preventDefault()
                  handleSelect(item)
                }}
              >
                <p className="text-sm font-medium text-foreground line-clamp-2">{highlightQuery(item.name, value)}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {[item.activeIngredient.join(', '), item.dosageForm, item.strength].filter(Boolean).join(' - ')}
                </p>
              </button>
            ))
          ) : normalizedQuery.length >= 2 ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">Aucun resultat. Appuyez sur Entree pour conserver votre saisie.</p>
          ) : (
            <p className="px-3 py-3 text-sm text-muted-foreground">Saisissez au moins 2 caracteres.</p>
          )}
        </div>
      )}
    </div>
  )
}

export const ChatBot = forwardRef<ChatBotHandle>((_, ref) => {
  const [drug1, setDrug1] = useState('')
  const [drug2, setDrug2] = useState('')
  const [selectedDrug1, setSelectedDrug1] = useState<DrugSearchItem | null>(null)
  const [selectedDrug2, setSelectedDrug2] = useState<DrugSearchItem | null>(null)

  const [checkLoading, setCheckLoading] = useState(false)
  const [checkError, setCheckError] = useState<string | null>(null)
  const [normResult, setNormResult] = useState<InteractionResult | null>(null)
  const [fallbackAnswer, setFallbackAnswer] = useState<string | null>(null)
  const [fallbackSources, setFallbackSources] = useState<string[] | null>(null)

  const [showContext, setShowContext] = useState(false)
  const [age, setAge] = useState('')
  const [pregnancy, setPregnancy] = useState<'enceinte' | 'non_enceinte' | 'inconnu'>('inconnu')
  const [breastfeeding, setBreastfeeding] = useState<'oui' | 'non' | 'inconnu'>('inconnu')
  const [egfr, setEgfr] = useState('')
  const [ckdStage, setCkdStage] = useState('')
  const [hepaticImpairment, setHepaticImpairment] = useState<'none' | 'mild' | 'moderate' | 'severe' | 'inconnu'>('inconnu')
  const [allergiesStr, setAllergiesStr] = useState('')
  const [conditionsStr, setConditionsStr] = useState('')
  const [weight, setWeight] = useState('')
  const [riskQT, setRiskQT] = useState(false)
  const [riskFall, setRiskFall] = useState(false)

  const [drugIndex, setDrugIndex] = useState<DrugSearchItem[]>([])
  const [indexLoading, setIndexLoading] = useState(true)
  const [indexError, setIndexError] = useState<string | null>(null)

  const [recentChecks, setRecentChecks] = useState<RecentCheck[]>([])
  const [copySuccess, setCopySuccess] = useState(false)

  const drug1Ref = useRef<HTMLInputElement>(null)
  const recentRef = useRef<HTMLDivElement>(null)

  useImperativeHandle(ref, () => ({
    focusInteractions: () => {
      drug1Ref.current?.focus()
    },
    showHistory: () => {
      recentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    },
  }))

  useEffect(() => {
    async function loadSearchIndex() {
      try {
        const response = await fetch('/data/medicament_search_index.json', { cache: 'force-cache' })
        if (!response.ok) {
          throw new Error('Impossible de charger l index de recherche medicaments.')
        }
        const payload = (await response.json()) as DrugSearchItem[]
        setDrugIndex(payload)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erreur de chargement de l index.'
        setIndexError(message)
      } finally {
        setIndexLoading(false)
      }
    }

    void loadSearchIndex()
  }, [])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_CHECKS_KEY)
      if (!raw) {
        return
      }

      const parsed = JSON.parse(raw) as RecentCheck[]
      if (Array.isArray(parsed)) {
        setRecentChecks(parsed.slice(0, 10))
      }
    } catch {
      // ignore localStorage errors
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(RECENT_CHECKS_KEY, JSON.stringify(recentChecks.slice(0, 10)))
    } catch {
      // ignore localStorage errors
    }
  }, [recentChecks])

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(PATIENT_CONTEXT_KEY)
      if (!raw) {
        return
      }

      const parsed = JSON.parse(raw) as Record<string, unknown>
      setAge(typeof parsed.age === 'string' ? parsed.age : '')
      setPregnancy(parsed.pregnancy === 'enceinte' || parsed.pregnancy === 'non_enceinte' ? parsed.pregnancy : 'inconnu')
      setBreastfeeding(parsed.breastfeeding === 'oui' || parsed.breastfeeding === 'non' ? parsed.breastfeeding : 'inconnu')
      setEgfr(typeof parsed.egfr === 'string' ? parsed.egfr : '')
      setCkdStage(typeof parsed.ckdStage === 'string' ? parsed.ckdStage : '')
      setHepaticImpairment(
        parsed.hepaticImpairment === 'none' ||
          parsed.hepaticImpairment === 'mild' ||
          parsed.hepaticImpairment === 'moderate' ||
          parsed.hepaticImpairment === 'severe'
          ? parsed.hepaticImpairment
          : 'inconnu'
      )
      setAllergiesStr(typeof parsed.allergiesStr === 'string' ? parsed.allergiesStr : '')
      setConditionsStr(typeof parsed.conditionsStr === 'string' ? parsed.conditionsStr : '')
      setWeight(typeof parsed.weight === 'string' ? parsed.weight : '')
      setRiskQT(Boolean(parsed.riskQT))
      setRiskFall(Boolean(parsed.riskFall))
    } catch {
      // ignore sessionStorage errors
    }
  }, [])

  useEffect(() => {
    try {
      sessionStorage.setItem(
        PATIENT_CONTEXT_KEY,
        JSON.stringify({
          age,
          pregnancy,
          breastfeeding,
          egfr,
          ckdStage,
          hepaticImpairment,
          allergiesStr,
          conditionsStr,
          weight,
          riskQT,
          riskFall,
        })
      )
    } catch {
      // ignore sessionStorage errors
    }
  }, [age, pregnancy, breastfeeding, egfr, ckdStage, hepaticImpairment, allergiesStr, conditionsStr, weight, riskQT, riskFall])

  const fuse = useMemo(() => {
    if (drugIndex.length === 0) {
      return null
    }

    return new Fuse(drugIndex, {
      includeScore: true,
      threshold: 0.33,
      ignoreLocation: true,
      keys: ['searchKey', 'name', 'activeIngredient'],
    })
  }, [drugIndex])

  const searchDrugs = useCallback(
    (query: string) => {
      if (!fuse || query.length < 2) {
        return []
      }

      return fuse
        .search(query, { limit: 8 })
        .map((result) => result.item)
        .filter((item, index, array) => array.findIndex((candidate) => candidate.id === item.id) === index)
    },
    [fuse]
  )

  const findHintByExactName = useCallback(
    (drugName: string): string[] | undefined => {
      const normalized = normalizeForSearch(drugName)
      if (!normalized) {
        return undefined
      }

      const match = drugIndex.find((item) => normalizeForSearch(item.name) === normalized)
      if (!match || match.activeIngredient.length === 0) {
        return undefined
      }
      return match.activeIngredient
    },
    [drugIndex]
  )

  const buildDrugPayload = useCallback(
    (drugName: string, selected: DrugSearchItem | null): DrugInputPayload => {
      const hint =
        selected?.activeIngredient && selected.activeIngredient.length > 0
          ? selected.activeIngredient
          : findHintByExactName(drugName)

      return {
        name: drugName,
        active_ingredient_hint: hint && hint.length > 0 ? hint : undefined,
      }
    },
    [findHintByExactName]
  )

  const resetResultState = () => {
    setCheckError(null)
    setNormResult(null)
    setFallbackAnswer(null)
    setFallbackSources(null)
  }

  const contextFieldCount = [
    age,
    pregnancy !== 'inconnu' ? pregnancy : '',
    breastfeeding !== 'inconnu' ? breastfeeding : '',
    egfr,
    ckdStage,
    hepaticImpairment !== 'inconnu' ? hepaticImpairment : '',
    allergiesStr,
    conditionsStr,
    weight,
    riskQT ? 'qt' : '',
    riskFall ? 'fall' : '',
  ].filter(Boolean).length

  const runInteractionCheck = useCallback(
    async (pairOverride?: { drug1: string; drug2: string }) => {
      const nextDrug1 = (pairOverride?.drug1 ?? drug1).trim()
      const nextDrug2 = (pairOverride?.drug2 ?? drug2).trim()

      if (pairOverride) {
        setDrug1(pairOverride.drug1)
        setDrug2(pairOverride.drug2)
        setSelectedDrug1(null)
        setSelectedDrug2(null)
      }

      if (!nextDrug1 || !nextDrug2) {
        setCheckError('Veuillez saisir deux medicaments.')
        return
      }

      setCheckLoading(true)
      resetResultState()

      const patient: PatientPayload = {
        pregnancy_status: pregnancy,
        breastfeeding,
        renal_function: {
          eGFR: parseNumber(egfr),
          CKD_stage: ckdStage || undefined,
        },
        risk_flags: [riskQT ? 'QT_prolongation' : null, riskFall ? 'chute' : null].filter(
          (flag): flag is string => Boolean(flag)
        ),
      }

      const parsedAge = parseNumber(age)
      const parsedWeight = parseNumber(weight)
      if (parsedAge !== undefined) {
        patient.age = parsedAge
      }
      if (parsedWeight !== undefined) {
        patient.weight_kg = parsedWeight
      }
      if (hepaticImpairment !== 'inconnu') {
        patient.hepatic_impairment = hepaticImpairment
      }

      const allergies = allergiesStr
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
      if (allergies.length > 0) {
        patient.allergies = allergies
      }

      const conditions = conditionsStr
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
      if (conditions.length > 0) {
        patient.conditions = conditions
      }

      try {
        const response = await fetch('/api/check-interaction', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            drug1: buildDrugPayload(nextDrug1, selectedDrug1),
            drug2: buildDrugPayload(nextDrug2, selectedDrug2),
            patient,
            locale: 'fr-MA',
          }),
        })

        const payload = (await response.json()) as unknown

        if (!response.ok) {
          const errorMessage =
            payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
              ? payload.error
              : 'Une erreur est survenue pendant la verification.'
          throw new Error(errorMessage)
        }

        if (isInteractionResult(payload)) {
          setNormResult(payload)

          const historyItem: RecentCheck = {
            drug1: nextDrug1,
            drug2: nextDrug2,
            timestamp: Date.now(),
            triage: payload.triage,
            summary: payload.summary_fr,
          }

          setRecentChecks((previous) => {
            const targetKey = [normalizeForSearch(nextDrug1), normalizeForSearch(nextDrug2)].sort().join('|')
            const deduped = previous.filter((item) => {
              const currentKey = [normalizeForSearch(item.drug1), normalizeForSearch(item.drug2)].sort().join('|')
              return currentKey !== targetKey
            })
            return [historyItem, ...deduped].slice(0, 10)
          })
        } else {
          const answer =
            payload && typeof payload === 'object' && 'answer' in payload && typeof payload.answer === 'string'
              ? payload.answer
              : 'Reponse brute indisponible.'
          const sources =
            payload && typeof payload === 'object' && 'sources' in payload && Array.isArray(payload.sources)
              ? payload.sources.filter((source): source is string => typeof source === 'string')
              : []

          setFallbackAnswer(answer)
          setFallbackSources(sources)
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Une erreur est survenue.'
        setCheckError(message)
      } finally {
        setCheckLoading(false)
      }
    },
    [
      age,
      allergiesStr,
      breastfeeding,
      ckdStage,
      conditionsStr,
      drug1,
      drug2,
      egfr,
      hepaticImpairment,
      pregnancy,
      riskFall,
      riskQT,
      selectedDrug1,
      selectedDrug2,
      weight,
      buildDrugPayload,
    ]
  )

  const handleSubmit = (event?: React.FormEvent) => {
    if (event) {
      event.preventDefault()
    }
    void runInteractionCheck()
  }

  const handleSwapDrugs = () => {
    const currentDrug1 = drug1
    const currentDrug2 = drug2
    const currentSelectedDrug1 = selectedDrug1
    const currentSelectedDrug2 = selectedDrug2
    setDrug1(currentDrug2)
    setDrug2(currentDrug1)
    setSelectedDrug1(currentSelectedDrug2)
    setSelectedDrug2(currentSelectedDrug1)
    resetResultState()
  }

  const handleClearDrugs = () => {
    setDrug1('')
    setDrug2('')
    setSelectedDrug1(null)
    setSelectedDrug2(null)
    resetResultState()
    setCheckError(null)
    drug1Ref.current?.focus()
  }

  const handleSuggestion = (d1: string, d2: string) => {
    setDrug1(d1)
    setDrug2(d2)
    setSelectedDrug1(null)
    setSelectedDrug2(null)
    resetResultState()
  }

  const handleReRunFromHistory = (item: RecentCheck) => {
    void runInteractionCheck({ drug1: item.drug1, drug2: item.drug2 })
  }

  const composeCopyText = (result: InteractionResult): string => {
    const lines: string[] = []
    lines.push(`Interaction: ${drug1} + ${drug2}`)
    lines.push(`Triage: ${result.triage.toUpperCase()}`)
    lines.push(`Action: ${result.action}`)
    lines.push(`Severite: ${result.severity}`)
    lines.push('')
    lines.push(`Resume: ${result.summary_fr}`)

    if (result.bullets_fr.length > 0) {
      lines.push('')
      lines.push('Points cles:')
      result.bullets_fr.forEach((bullet) => lines.push(`- ${bullet}`))
    }

    if (result.monitoring && result.monitoring.length > 0) {
      lines.push('')
      lines.push('Surveillance:')
      result.monitoring.forEach((item) => lines.push(`- ${item}`))
    }

    if (result.patient_specific_notes && result.patient_specific_notes.length > 0) {
      lines.push('')
      lines.push('Notes patient:')
      result.patient_specific_notes.forEach((item) => lines.push(`- ${item}`))
    }

    return lines.join('\n')
  }

  const handleCopyResult = async () => {
    if (!normResult || typeof navigator === 'undefined' || !navigator.clipboard) {
      return
    }

    try {
      await navigator.clipboard.writeText(composeCopyText(normResult))
      setCopySuccess(true)
      window.setTimeout(() => setCopySuccess(false), 1800)
    } catch {
      setCopySuccess(false)
    }
  }

  return (
    <div className="w-full space-y-6 pb-10">
      <div className="flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-2xl pharma-gradient flex items-center justify-center shadow-md shadow-primary/20">
          <Bot className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Assistant DwaIA</h1>
          <p className="text-xs text-muted-foreground">Interactions medicamenteuses en temps reel</p>
        </div>
        <div className="ml-auto">
          <Badge variant="outline" className="text-[10px] font-medium text-primary border-primary/30">
            <Sparkles className="h-3 w-3 mr-1" />
            IA
          </Badge>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-background shadow-sm overflow-visible">
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <AutocompleteInput
              id="drug-one"
              inputRef={drug1Ref}
              autoFocus
              label="Medicament 1"
              value={drug1}
              onChange={(nextValue) => {
                setDrug1(nextValue)
                setSelectedDrug1(null)
              }}
              onSelectSuggestion={setSelectedDrug1}
              placeholder="Nom commercial ou DCI"
              loadingIndex={indexLoading}
              search={searchDrugs}
              onEnterWithoutSelection={() => void runInteractionCheck()}
            />
            <AutocompleteInput
              id="drug-two"
              label="Medicament 2"
              value={drug2}
              onChange={(nextValue) => {
                setDrug2(nextValue)
                setSelectedDrug2(null)
              }}
              onSelectSuggestion={setSelectedDrug2}
              placeholder="Nom commercial ou DCI"
              loadingIndex={indexLoading}
              search={searchDrugs}
              onEnterWithoutSelection={() => void runInteractionCheck()}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="icon" className="rounded-lg" onClick={handleSwapDrugs} aria-label="Inverser les medicaments">
                <ArrowUpDown className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="rounded-lg" onClick={handleClearDrugs} aria-label="Vider les champs medicaments">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {indexError && <p className="text-xs text-destructive">{indexError}</p>}
          </div>

          <Button type="submit" disabled={checkLoading} aria-busy={checkLoading} className="w-full h-12 rounded-xl text-sm font-semibold shadow-md shadow-primary/20">
            {checkLoading ? (
              <>
                <div className="h-4 w-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Verifier l interaction
              </>
            )}
          </Button>
        </form>

        <div className="px-5 pb-4">
          <p className="text-[11px] text-muted-foreground mb-2">Exemples rapides:</p>
          <div className="flex flex-wrap gap-2">
            {quickSuggestions.map((suggestion) => (
              <button
                key={`${suggestion.d1}-${suggestion.d2}`}
                type="button"
                onClick={() => handleSuggestion(suggestion.d1, suggestion.d2)}
                className="text-xs px-3 rounded-full min-h-11 border border-border bg-muted/50 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
              >
                {suggestion.d1} + {suggestion.d2}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div ref={recentRef} className="rounded-2xl border border-border bg-background p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Recents</h2>
        </div>

        {recentChecks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune verification recente pour le moment.</p>
        ) : (
          <div className="space-y-2">
            {recentChecks.map((item, index) => (
              <button
                key={`${item.drug1}-${item.drug2}-${index}`}
                type="button"
                onClick={() => handleReRunFromHistory(item)}
                className="w-full text-left rounded-xl border border-border px-3 py-2.5 min-h-11 hover:bg-accent/40 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground line-clamp-1">
                    {item.drug1} + {item.drug2}
                  </span>
                  <Badge variant="outline" className="text-[10px] uppercase">
                    {item.triage}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.summary}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{formatHistoryTime(item.timestamp)}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-background overflow-hidden">
        <button
          type="button"
          onClick={() => setShowContext((current) => !current)}
          className="w-full flex items-center justify-between px-5 min-h-12 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Contexte patient</span>
            {contextFieldCount > 0 && (
              <Badge variant="secondary" className="text-[10px] min-h-5 px-1.5 font-medium">
                {contextFieldCount} renseigne{contextFieldCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform duration-200', showContext && 'rotate-180')} />
        </button>

        {showContext && (
          <div className="px-5 pb-5 border-t border-border/50 pt-4 animate-fade-in">
            <div className="grid gap-3 sm:grid-cols-3">
              <ContextField icon={<Heart className="h-3.5 w-3.5" />} label="Age">
                <Input inputMode="numeric" value={age} onChange={(event) => setAge(event.target.value)} placeholder="72" className="h-11 rounded-lg" />
              </ContextField>

              <ContextField icon={<Baby className="h-3.5 w-3.5" />} label="Grossesse">
                <select
                  className="w-full border border-input rounded-lg h-11 px-3 text-base bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  value={pregnancy}
                  onChange={(event) => setPregnancy(event.target.value as typeof pregnancy)}
                >
                  <option value="inconnu">Inconnu</option>
                  <option value="enceinte">Enceinte</option>
                  <option value="non_enceinte">Non enceinte</option>
                </select>
              </ContextField>

              <ContextField icon={<Baby className="h-3.5 w-3.5" />} label="Allaitement">
                <select
                  className="w-full border border-input rounded-lg h-11 px-3 text-base bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  value={breastfeeding}
                  onChange={(event) => setBreastfeeding(event.target.value as typeof breastfeeding)}
                >
                  <option value="inconnu">Inconnu</option>
                  <option value="oui">Oui</option>
                  <option value="non">Non</option>
                </select>
              </ContextField>

              <ContextField label="eGFR (mL/min)">
                <Input inputMode="numeric" value={egfr} onChange={(event) => setEgfr(event.target.value)} placeholder="38" className="h-11 rounded-lg" />
              </ContextField>

              <ContextField label="CKD (stade)">
                <Input value={ckdStage} onChange={(event) => setCkdStage(event.target.value)} placeholder="3b" className="h-11 rounded-lg" />
              </ContextField>

              <ContextField label="Foie">
                <select
                  className="w-full border border-input rounded-lg h-11 px-3 text-base bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  value={hepaticImpairment}
                  onChange={(event) => setHepaticImpairment(event.target.value as typeof hepaticImpairment)}
                >
                  <option value="inconnu">Inconnu</option>
                  <option value="none">Normal</option>
                  <option value="mild">Atteinte legere</option>
                  <option value="moderate">Atteinte moderee</option>
                  <option value="severe">Atteinte severe</option>
                </select>
              </ContextField>

              <div className="sm:col-span-3">
                <ContextField label="Allergies">
                  <Input
                    value={allergiesStr}
                    onChange={(event) => setAllergiesStr(event.target.value)}
                    placeholder="penicillines, AINS, sulfamides"
                    className="h-11 rounded-lg"
                  />
                </ContextField>
              </div>

              <div className="sm:col-span-3">
                <ContextField label="Comorbidites">
                  <Input
                    value={conditionsStr}
                    onChange={(event) => setConditionsStr(event.target.value)}
                    placeholder="HTA, FA, epilepsie"
                    className="h-11 rounded-lg"
                  />
                </ContextField>
              </div>

              <div className="sm:col-span-3">
                <ContextField label="Poids (kg)">
                  <Input
                    inputMode="numeric"
                    value={weight}
                    onChange={(event) => setWeight(event.target.value)}
                    placeholder="63"
                    className="h-11 rounded-lg"
                  />
                </ContextField>
              </div>

              <div className="flex items-center gap-6 sm:col-span-3 pt-1 flex-wrap">
                <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground cursor-pointer min-h-11">
                  <input
                    type="checkbox"
                    className="accent-primary rounded h-4 w-4"
                    checked={riskQT}
                    onChange={(event) => setRiskQT(event.target.checked)}
                  />
                  Risque QT
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground cursor-pointer min-h-11">
                  <input
                    type="checkbox"
                    className="accent-primary rounded h-4 w-4"
                    checked={riskFall}
                    onChange={(event) => setRiskFall(event.target.checked)}
                  />
                  Somnolence / Chute
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {checkError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3 animate-fade-in" role="alert" aria-live="assertive">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
          <p className="text-sm text-destructive">{checkError}</p>
        </div>
      )}

      {checkLoading && (
        <div className="rounded-2xl border border-border p-5 space-y-4 animate-pulse" aria-live="polite" aria-busy="true">
          <div className="h-4 w-40 rounded bg-muted" />
          <div className="h-6 w-2/3 rounded bg-muted" />
          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-muted" />
            <div className="h-4 w-[92%] rounded bg-muted" />
            <div className="h-4 w-[78%] rounded bg-muted" />
          </div>
        </div>
      )}

      {normResult &&
        (() => {
          const tc = triageConfig[normResult.triage] ?? triageConfig.ambre
          const TriageIcon = tc.icon

          return (
            <div className={cn('rounded-2xl border-l-4 p-5 md:p-6 space-y-5 ring-1 animate-fade-in', tc.border, tc.bg, tc.ring)}>
              <div className="flex items-start gap-3">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', tc.bg)}>
                  <TriageIcon className={cn('h-5 w-5', tc.iconColor)} />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={tc.badgeBg}>
                      {tc.label} - {normResult.triage.toUpperCase()}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">
                      {normResult.action}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      Severite: {normResult.severity}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium leading-relaxed text-foreground">{normResult.summary_fr}</p>
                </div>

                <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={handleCopyResult}>
                  {copySuccess ? <Check className="h-4 w-4 mr-1" /> : <Clipboard className="h-4 w-4 mr-1" />}
                  {copySuccess ? 'Copie' : 'Copier'}
                </Button>
              </div>

              {normResult.bullets_fr?.length > 0 && (
                <ul className="space-y-2.5 pl-[52px]">
                  {normResult.bullets_fr.map((bullet, index) => (
                    <li key={`${bullet}-${index}`} className="text-sm leading-relaxed text-foreground/90 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-current mt-2 shrink-0 opacity-40" />
                      {bullet}
                    </li>
                  ))}
                </ul>
              )}

              {normResult.mechanism && (
                <div className="pl-[52px] space-y-1 border-t border-border/30 pt-4">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Mecanisme</p>
                  <p className="text-sm leading-relaxed text-foreground/90">{normResult.mechanism}</p>
                </div>
              )}

              {normResult.monitoring && normResult.monitoring.length > 0 && (
                <div className="pl-[52px] space-y-2 border-t border-border/30 pt-4">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Surveillance</p>
                  <ul className="space-y-1.5">
                    {normResult.monitoring.map((item, index) => (
                      <li key={`${item}-${index}`} className="text-sm leading-relaxed flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-current mt-2 shrink-0 opacity-40" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {normResult.patient_specific_notes && normResult.patient_specific_notes.length > 0 && (
                <div className="pl-[52px] space-y-2 border-t border-border/30 pt-4">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Notes patient</p>
                  <ul className="space-y-1.5">
                    {normResult.patient_specific_notes.map((note, index) => (
                      <li key={`${note}-${index}`} className="text-sm leading-relaxed flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-current mt-2 shrink-0 opacity-40" />
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {normResult.raw_text && (
                <details className="pl-[52px] border-t border-border/30 pt-4">
                  <summary className="cursor-pointer text-xs font-semibold text-muted-foreground uppercase tracking-widest">Texte brut IA</summary>
                  <pre className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">{normResult.raw_text}</pre>
                </details>
              )}

              {normResult.citations && normResult.citations.length > 0 && (
                <div className="pl-[52px] space-y-1 border-t border-border/30 pt-4">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Citations</p>
                  {normResult.citations.slice(0, 4).map((citation) => (
                    <a
                      key={citation}
                      href={citation}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-xs text-primary hover:underline break-all"
                    >
                      {citation}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )
        })()}

      {fallbackAnswer && (
        <div className="rounded-2xl border-l-4 border-l-primary/50 bg-primary/5 p-5 text-sm animate-fade-in">
          <p className="leading-relaxed whitespace-pre-wrap">{fallbackAnswer}</p>
          {fallbackSources && fallbackSources.length > 0 && (
            <div className="mt-4 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">Sources</p>
              {fallbackSources.map((source) => (
                <p key={source} className="text-xs text-primary break-all">
                  {source}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex items-start gap-3 text-xs text-muted-foreground bg-surface rounded-xl p-4">
        <FlaskConical className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground/60" />
        <div className="space-y-0.5">
          <p className="font-semibold text-foreground/80">Sources: Micromedex, Cerner Multum, ASHP</p>
          <p>Cette aide ne remplace pas le jugement clinique. Verifiez toujours les recommandations officielles.</p>
        </div>
      </div>
    </div>
  )
})

ChatBot.displayName = 'ChatBot'

function ContextField({
  label,
  icon,
  children,
}: {
  label: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
        {icon}
        {label}
      </label>
      {children}
    </div>
  )
}
