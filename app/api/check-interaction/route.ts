import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const runtime = 'nodejs'

const RATE_LIMIT_MAX_REQUESTS = 20
const RATE_LIMIT_WINDOW_MS = 60_000
const CACHE_TTL_MS = 24 * 60 * 60 * 1000

type Action = 'OK' | 'Surveiller' | 'Ajuster dose' | 'Eviter/Contre-indique'
type Severity = 'aucune' | 'mineure' | 'moderee' | 'majeure' | 'contre-indiquee'

type BaseInteractionResult = {
  summary_fr: string
  bullets_fr: string[]
  action: Action
  severity: Severity
  mechanism?: string
  monitoring?: string[]
  pregnancy_category?: 'A' | 'B' | 'C' | 'D' | 'X' | 'inconnue'
  raw_text?: string
}

type FinalInteractionResult = BaseInteractionResult & {
  triage: 'vert' | 'ambre' | 'rouge'
  patient_specific_notes?: string[]
  citations?: string[]
}

type CacheEntry = {
  expiresAt: number
  result: BaseInteractionResult
  citations: string[]
}

type RateLimitEntry = {
  count: number
  windowStart: number
}

const interactionCache = new Map<string, CacheEntry>()
const requestRateMap = new Map<string, RateLimitEntry>()

const DrugInputSchema = z.union([
  z.string().min(1),
  z.object({
    name: z.string().min(1),
    dose_mg: z.number().positive().optional(),
    route: z.enum(['po', 'iv', 'im', 'sc', 'inhal', 'top']).optional(),
    freq: z.string().min(1).max(50).optional(),
    active_ingredient_hint: z.array(z.string().min(1).max(80)).max(8).optional(),
  }),
])

const RequestSchema = z.object({
  drug1: DrugInputSchema,
  drug2: DrugInputSchema,
  patient: z
    .object({
      age: z.number().int().nonnegative().max(130).optional(),
      sex: z.enum(['M', 'F', 'autre', 'inconnu']).optional(),
      weight_kg: z.number().positive().max(500).optional(),
      pregnancy_status: z.enum(['enceinte', 'non_enceinte', 'inconnu']).optional(),
      breastfeeding: z.enum(['oui', 'non', 'inconnu']).optional(),
      renal_function: z
        .object({
          eGFR: z.number().nonnegative().max(300).optional(),
          CKD_stage: z.string().max(20).optional(),
        })
        .optional(),
      hepatic_impairment: z.enum(['none', 'mild', 'moderate', 'severe']).optional(),
      allergies: z.array(z.string().min(1).max(60)).max(20).optional(),
      conditions: z.array(z.string().min(1).max(80)).max(20).optional(),
      risk_flags: z.array(z.string().min(1).max(40)).max(10).optional(),
    })
    .optional(),
  locale: z.string().optional(),
})

const ModelPayloadSchema = z
  .object({
    summary_fr: z.string().min(1),
    bullets_fr: z.array(z.string().min(1)).min(1).max(8),
    action: z.string().optional(),
    severity: z.string().optional(),
    mechanism: z.string().optional(),
    monitoring: z.array(z.string().min(1)).max(8).optional(),
    pregnancy_category: z.string().optional(),
  })
  .passthrough()

type PatientInput = z.infer<typeof RequestSchema>['patient']
type CanonicalDrug = {
  name: string
  dose_mg?: number
  route?: 'po' | 'iv' | 'im' | 'sc' | 'inhal' | 'top'
  freq?: string
  activeIngredientHint?: string[]
}

const FEW_SHOT_EXAMPLES = `Exemple 1:
{"summary_fr":"Association a risque hemorragique augmente.","bullets_fr":["Risque de saignement accru avec anticoagulant.","Surveiller signes de saignement et INR."],"action":"Surveiller","severity":"moderee","mechanism":"Potentialisation pharmacodynamique sur l'hemostase.","monitoring":["Controler INR","Rechercher saignements"],"pregnancy_category":"inconnue"}

Exemple 2:
{"summary_fr":"Association generalement contre-indiquee.","bullets_fr":["Risque eleve d'evenement grave documente.","Preferer une alternative therapeutique."],"action":"Eviter/Contre-indique","severity":"contre-indiquee","mechanism":"Interaction metabolique et pharmacodynamique majeure.","monitoring":["Surveillance clinique rapprochee si association inevitable"],"pregnancy_category":"inconnue"}`

const SYSTEM_PROMPT =
  'Tu es un assistant de pharmacologie clinique. Reponds en francais strictement au format JSON valide uniquement, sans markdown ni texte hors JSON. ' +
  'Le JSON doit respecter exactement la structure demandee. Mentionne le mecanisme d interaction et des parametres de surveillance concrets (ex: INR, eGFR, potassium, QTc).'

function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function canonicalizeDrug(input: z.infer<typeof DrugInputSchema>): CanonicalDrug | null {
  if (typeof input === 'string') {
    const name = normalizeText(input)
    if (!name || name.length > 120) {
      return null
    }
    return { name, route: 'po' }
  }

  const name = normalizeText(input.name)
  if (!name || name.length > 120) {
    return null
  }

  return {
    name,
    dose_mg: input.dose_mg,
    route: input.route ?? 'po',
    freq: input.freq,
    activeIngredientHint: input.active_ingredient_hint?.map((item) => normalizeText(item)).filter(Boolean),
  }
}

function compactPatientBlock(patient?: PatientInput): string {
  if (!patient) {
    return ''
  }

  const chunks: string[] = []
  if (typeof patient.age === 'number') chunks.push(`age:${patient.age}`)
  if (typeof patient.weight_kg === 'number') chunks.push(`poids:${patient.weight_kg}kg`)
  if (patient.pregnancy_status) chunks.push(`grossesse:${patient.pregnancy_status}`)
  if (patient.breastfeeding) chunks.push(`allaitement:${patient.breastfeeding}`)
  if (typeof patient.renal_function?.eGFR === 'number') chunks.push(`eGFR:${patient.renal_function.eGFR}`)
  if (patient.renal_function?.CKD_stage) chunks.push(`CKD:${patient.renal_function.CKD_stage}`)
  if (patient.hepatic_impairment) chunks.push(`foie:${patient.hepatic_impairment}`)
  if (patient.allergies?.length) chunks.push(`allergies:${patient.allergies.join('|')}`)
  if (patient.conditions?.length) chunks.push(`comorbidites:${patient.conditions.join('|')}`)
  if (patient.risk_flags?.length) chunks.push(`flags:${patient.risk_flags.join('|')}`)

  return chunks.join('; ')
}

function normalizeAction(input: string): Action {
  const value = normalizeText(input)
  if (value.includes('contre') || value.includes('eviter') || value.includes('avoid')) {
    return 'Eviter/Contre-indique'
  }
  if (value.includes('ajust') || value.includes('dose') || value.includes('posolog')) {
    return 'Ajuster dose'
  }
  if (value.includes('surveil') || value.includes('monitor') || value.includes('precaution') || value.includes('prudence')) {
    return 'Surveiller'
  }
  return 'OK'
}

function normalizeSeverity(input: string, action: Action): Severity {
  const value = normalizeText(input)
  if (value.includes('contre') || value.includes('interdit')) {
    return 'contre-indiquee'
  }
  if (value.includes('majeur') || value.includes('severe') || value.includes('grave')) {
    return 'majeure'
  }
  if (value.includes('moder')) {
    return 'moderee'
  }
  if (value.includes('mineur')) {
    return 'mineure'
  }

  if (action === 'Eviter/Contre-indique') return 'contre-indiquee'
  if (action === 'Ajuster dose' || action === 'Surveiller') return 'moderee'
  return 'aucune'
}

function normalizePregnancyCategory(input?: string): BaseInteractionResult['pregnancy_category'] {
  if (!input) {
    return undefined
  }

  const value = normalizeText(input)
  if (value === 'a') return 'A'
  if (value === 'b') return 'B'
  if (value === 'c') return 'C'
  if (value === 'd') return 'D'
  if (value === 'x') return 'X'
  if (value.includes('inconn')) return 'inconnue'
  return undefined
}

function stripMarkdownFences(input: string): string {
  return input.replace(/```json/gi, '').replace(/```/g, '').trim()
}

function extractJsonPayload(content: string): unknown | null {
  const cleaned = stripMarkdownFences(content)

  try {
    return JSON.parse(cleaned)
  } catch {
    // continue
  }

  const firstBrace = cleaned.indexOf('{')
  const lastBrace = cleaned.lastIndexOf('}')
  if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
    return null
  }

  const candidate = cleaned.slice(firstBrace, lastBrace + 1)
  try {
    return JSON.parse(candidate)
  } catch {
    return null
  }
}

function deriveActionAndSeverityFromText(text: string): { action: Action; severity: Severity } {
  const normalized = normalizeText(text)
  const action = normalizeAction(normalized)
  const severity = normalizeSeverity(normalized, action)
  return { action, severity }
}

function parseModelResult(rawText: string): BaseInteractionResult | null {
  const extracted = extractJsonPayload(rawText)
  if (!extracted) {
    return null
  }

  const parsed = ModelPayloadSchema.safeParse(extracted)
  if (!parsed.success) {
    return null
  }

  const payload = parsed.data
  const fallbackSignals = [payload.summary_fr, payload.bullets_fr.join(' '), payload.mechanism ?? ''].join(' ')
  const derived = deriveActionAndSeverityFromText(fallbackSignals)

  const action = payload.action ? normalizeAction(payload.action) : derived.action
  const severity = payload.severity ? normalizeSeverity(payload.severity, action) : normalizeSeverity(derived.severity, action)

  return {
    summary_fr: payload.summary_fr.trim(),
    bullets_fr: payload.bullets_fr.map((bullet) => bullet.trim()).filter(Boolean).slice(0, 6),
    action,
    severity,
    mechanism: payload.mechanism?.trim() || undefined,
    monitoring: payload.monitoring?.map((item) => item.trim()).filter(Boolean).slice(0, 6),
    pregnancy_category: normalizePregnancyCategory(payload.pregnancy_category),
  }
}

function buildFallbackResult(rawText: string): BaseInteractionResult {
  const lines = stripMarkdownFences(rawText)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 5)

  const combined = lines.join(' ')
  const { action, severity } = deriveActionAndSeverityFromText(combined)

  return {
    summary_fr: lines[0] || 'La reponse IA n est pas au format attendu. Lecture brute disponible.',
    bullets_fr: lines.length > 0 ? lines : ['Reponse brute recue, veuillez verifier manuellement.'],
    action,
    severity,
    raw_text: rawText,
  }
}

function triageFromAction(action: Action): 'vert' | 'ambre' | 'rouge' {
  if (action === 'OK') return 'vert'
  if (action === 'Surveiller') return 'ambre'
  return 'rouge'
}

function actionRank(action: Action): number {
  if (action === 'OK') return 0
  if (action === 'Surveiller') return 1
  if (action === 'Ajuster dose') return 2
  return 3
}

function severityRank(severity: Severity): number {
  if (severity === 'aucune') return 0
  if (severity === 'mineure') return 1
  if (severity === 'moderee') return 2
  if (severity === 'majeure') return 3
  return 4
}

function severityFromAction(action: Action): Severity {
  if (action === 'OK') return 'aucune'
  if (action === 'Surveiller') return 'moderee'
  if (action === 'Ajuster dose') return 'moderee'
  return 'contre-indiquee'
}

function mergeUnique(values: Array<string | undefined>): string[] {
  const set = new Set<string>()
  values.forEach((value) => {
    if (!value) {
      return
    }
    const normalized = value.trim()
    if (normalized) {
      set.add(normalized)
    }
  })
  return Array.from(set)
}

function hasAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term))
}

function applyDeterministicRules(
  base: BaseInteractionResult,
  patient: PatientInput,
  d1: CanonicalDrug,
  d2: CanonicalDrug
): FinalInteractionResult {
  let action: Action = base.action
  let severity: Severity = base.severity

  const notes: string[] = []
  const monitoring = new Set<string>(base.monitoring ?? [])

  const elevateAction = (target: Action) => {
    if (actionRank(target) > actionRank(action)) {
      action = target
    }
  }

  const elevateSeverity = (target: Severity) => {
    if (severityRank(target) > severityRank(severity)) {
      severity = target
    }
  }

  const pooledDrugNames = normalizeText(
    `${d1.name} ${d2.name} ${(d1.activeIngredientHint ?? []).join(' ')} ${(d2.activeIngredientHint ?? []).join(' ')}`
  )

  const allergyTerms = (patient?.allergies ?? []).map((item) => normalizeText(item))
  const hasAllergy = {
    penicillin: allergyTerms.some((item) => item.includes('penicill')),
    cephalosporin: allergyTerms.some((item) => item.includes('cephalo') || item.includes('cef')),
    sulfonamide: allergyTerms.some((item) => item.includes('sulfa') || item.includes('sulfamide') || item.includes('sulfonamide')),
    nsaid: allergyTerms.some((item) => item.includes('ains') || item.includes('nsaid') || item.includes('anti inflammatoire')),
  }

  const penicillinTerms = ['penicill', 'amoxicill', 'ampicill', 'augmentin', 'oxacillin']
  const cephalosporinTerms = ['cef', 'cepha', 'cefixime', 'ceftriax', 'cefurox']
  const sulfonamideTerms = ['sulfameth', 'sulfadiaz', 'sulfadoxin', 'co trimoxazole']
  const nsaidTerms = ['ibuprofen', 'diclofenac', 'naproxen', 'ketoprofen', 'aspirin', 'celecoxib', 'meloxicam', 'indomet']

  if (hasAllergy.penicillin && hasAny(pooledDrugNames, penicillinTerms)) {
    notes.push('Allergie penicilline signalee: risque de reaction severe, eviter cette classe.')
    elevateAction('Eviter/Contre-indique')
    elevateSeverity('contre-indiquee')
  }

  if (hasAllergy.cephalosporin && hasAny(pooledDrugNames, cephalosporinTerms)) {
    notes.push('Allergie aux cephalosporines signalee: risque de reactivite croisee, eviter la classe suspecte.')
    elevateAction('Eviter/Contre-indique')
    elevateSeverity('contre-indiquee')
  }

  if (hasAllergy.sulfonamide && hasAny(pooledDrugNames, sulfonamideTerms)) {
    notes.push('Allergie aux sulfamides signalee: association potentiellement contre-indiquee.')
    elevateAction('Eviter/Contre-indique')
    elevateSeverity('contre-indiquee')
  }

  if (hasAllergy.nsaid && hasAny(pooledDrugNames, nsaidTerms)) {
    notes.push('Allergie AINS signalee: eviter les anti-inflammatoires non steroidiens impliques.')
    elevateAction('Eviter/Contre-indique')
    elevateSeverity('contre-indiquee')
  }

  if (hasAllergy.penicillin && hasAny(pooledDrugNames, cephalosporinTerms)) {
    notes.push('Attention a la reactivite croisee penicilline/cephalosporine: evaluer antecedent allergique precis.')
    elevateAction('Surveiller')
    elevateSeverity('moderee')
  }

  if (typeof patient?.age === 'number' && patient.age < 12) {
    notes.push('Patient pediatrique (<12 ans): adaptation posologique indispensable et verification des formes/doses.')
    monitoring.add('Verifier dose pediatrique (mg/kg) et intervalle d administration')
    elevateAction('Ajuster dose')
    elevateSeverity('moderee')
  }

  if (typeof patient?.age === 'number' && patient.age > 75) {
    notes.push('Patient age (>75 ans): sensibilite accrue aux effets indesirables, commencer bas et surveiller.')
    monitoring.add('Surveiller confusion, chute, fonction renale et hypotension')
    elevateAction('Surveiller')
    elevateSeverity('moderee')
  }

  if (typeof patient?.renal_function?.eGFR === 'number' && patient.renal_function.eGFR < 30) {
    notes.push('Insuffisance renale severe (eGFR < 30): envisager reduction de dose ou allongement intervalle.')
    monitoring.add('Controler creatinine/eGFR avant et pendant traitement')
    elevateAction('Ajuster dose')
    elevateSeverity('moderee')
  }

  if (patient?.hepatic_impairment === 'moderate' || patient?.hepatic_impairment === 'severe') {
    notes.push('Atteinte hepatique moderee a severe: ajustement de dose et vigilance toxicite hepatique.')
    monitoring.add('Surveiller ALAT/ASAT, bilirubine et signes d hepatotoxicite')
    elevateAction('Ajuster dose')
    elevateSeverity(patient.hepatic_impairment === 'severe' ? 'majeure' : 'moderee')
  }

  if (patient?.pregnancy_status === 'enceinte') {
    if (base.pregnancy_category === 'D' || base.pregnancy_category === 'X') {
      notes.push(`Grossesse: categorie ${base.pregnancy_category}, association a eviter sauf avis specialise.`)
      elevateAction('Eviter/Contre-indique')
      elevateSeverity('contre-indiquee')
    } else if (base.pregnancy_category === 'C') {
      notes.push('Grossesse: categorie C, evaluer benefice/risque et preferer alternatives si possible.')
      elevateAction('Surveiller')
      elevateSeverity('moderee')
    } else {
      notes.push('Grossesse en cours: verifier references obstetricales et specialites contre-indiquees.')
      elevateAction('Surveiller')
      elevateSeverity('moderee')
    }
    monitoring.add('Suivi obstetrical et pharmacovigilance renforces')
  }

  if (patient?.breastfeeding === 'oui') {
    notes.push('Allaitement: verifier passage lacte et effets chez le nourrisson.')
    monitoring.add('Observer sedation, diarrhee ou irritabilite du nourrisson')
    elevateAction('Surveiller')
  }

  if (patient?.risk_flags?.includes('QT_prolongation')) {
    notes.push('Facteur de risque QT signale: prudence accrue avec medicaments prolongeant QT.')
    monitoring.add('Surveiller ECG (QTc) et ions K+/Mg2+')
    elevateAction('Surveiller')
    elevateSeverity('moderee')
  }

  if (patient?.risk_flags?.includes('chute')) {
    notes.push('Risque de chute signale: limiter associations sedatives/hypotensives.')
    monitoring.add('Surveiller vigilance, TA orthostatique et risque de chute')
    elevateAction('Surveiller')
  }

  const actionSeverity = severityFromAction(action)
  if (severityRank(actionSeverity) > severityRank(severity)) {
    severity = actionSeverity
  }

  return {
    summary_fr: base.summary_fr,
    bullets_fr: base.bullets_fr,
    action,
    severity,
    mechanism: base.mechanism,
    monitoring: mergeUnique(Array.from(monitoring)),
    pregnancy_category: base.pregnancy_category,
    raw_text: base.raw_text,
    triage: triageFromAction(action),
    patient_specific_notes: notes.length > 0 ? notes : undefined,
  }
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  return 'unknown'
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const current = requestRateMap.get(ip)

  if (!current || now - current.windowStart >= RATE_LIMIT_WINDOW_MS) {
    requestRateMap.set(ip, {
      count: 1,
      windowStart: now,
    })
    return true
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false
  }

  current.count += 1
  requestRateMap.set(ip, current)
  return true
}

function interactionCacheKey(d1: CanonicalDrug, d2: CanonicalDrug): string {
  const toKeyPart = (drug: CanonicalDrug) => {
    const hint = (drug.activeIngredientHint ?? []).map((item) => normalizeText(item)).sort().join('+')
    return `${normalizeText(drug.name)}#${hint}`
  }

  return [toKeyPart(d1), toKeyPart(d2)].sort().join('|')
}

function buildUserPrompt(d1: CanonicalDrug, d2: CanonicalDrug, patient?: PatientInput, strictRetry = false): string {
  const patientBlock = compactPatientBlock(patient)
  const d1Hint = d1.activeIngredientHint && d1.activeIngredientHint.length > 0 ? d1.activeIngredientHint.join(', ') : ''
  const d2Hint = d2.activeIngredientHint && d2.activeIngredientHint.length > 0 ? d2.activeIngredientHint.join(', ') : ''
  const requirements = [
    'Analyse l interaction entre les deux traitements ci-dessous.',
    `Molecule 1: ${d1.name}${d1.dose_mg ? ` (${d1.dose_mg} mg)` : ''}${d1.route ? ` voie ${d1.route}` : ''}${
      d1Hint ? ` [DCI: ${d1Hint}]` : ''
    }`,
    `Molecule 2: ${d2.name}${d2.dose_mg ? ` (${d2.dose_mg} mg)` : ''}${d2.route ? ` voie ${d2.route}` : ''}${
      d2Hint ? ` [DCI: ${d2Hint}]` : ''
    }`,
    patientBlock ? `Contexte patient: ${patientBlock}` : 'Contexte patient: non renseigne',
    '',
    'Format JSON OBLIGATOIRE:',
    '{',
    '  "summary_fr": "string",',
    '  "bullets_fr": ["string", "string"],',
    '  "action": "OK|Surveiller|Ajuster dose|Eviter/Contre-indique",',
    '  "severity": "aucune|mineure|moderee|majeure|contre-indiquee",',
    '  "mechanism": "string",',
    '  "monitoring": ["string", "string"],',
    '  "pregnancy_category": "A|B|C|D|X|inconnue"',
    '}',
    '',
    'Contraintes:',
    '- Repondre en francais.',
    '- Inclure un mecanisme pharmacologique plausible.',
    '- Inclure des parametres de surveillance concrets.',
    '- Maximum 4 puces utiles dans bullets_fr.',
    '- Aucun texte hors JSON.',
    '',
    FEW_SHOT_EXAMPLES,
  ]

  if (strictRetry) {
    requirements.push('', 'RAPPEL: Cette tentative doit contenir uniquement un JSON valide sans commentaire.')
  }

  return requirements.join('\n')
}

async function callPerplexity(d1: CanonicalDrug, d2: CanonicalDrug, patient?: PatientInput, strictRetry = false) {
  const apiKey = process.env.PERPLEXITY_API_KEY
  if (!apiKey) {
    throw new Error('PERPLEXITY_API_KEY manquant.')
  }

  const payload = {
    model: 'sonar',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(d1, d2, patient, strictRetry) },
    ],
    temperature: 0,
    max_tokens: 700,
    search_domain_filter: ['drugs.com'],
    web_search_options: { search_context_size: 'medium' },
  } as const

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 18_000)

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
    signal: controller.signal,
    cache: 'no-store',
  }).finally(() => clearTimeout(timeout))

  if (!response.ok) {
    const reason = await response.text().catch(() => '')
    throw new Error(`Erreur fournisseur IA (${response.status}): ${reason.slice(0, 200)}`)
  }

  const result = await response.json()
  const content: string = result?.choices?.[0]?.message?.content ?? ''
  const citations: string[] = (result?.citations ?? result?.sources ?? [])
    .map((item: unknown) => {
      if (typeof item === 'string') return item
      if (item && typeof item === 'object' && 'url' in item && typeof item.url === 'string') return item.url
      return null
    })
    .filter((item: string | null): item is string => Boolean(item))

  return { content, citations }
}

async function getBaseInteractionResult(d1: CanonicalDrug, d2: CanonicalDrug, patient?: PatientInput) {
  const first = await callPerplexity(d1, d2, patient, false)
  const firstParsed = parseModelResult(first.content)
  if (firstParsed) {
    return {
      result: firstParsed,
      citations: first.citations,
    }
  }

  const second = await callPerplexity(d1, d2, patient, true)
  const secondParsed = parseModelResult(second.content)
  if (secondParsed) {
    return {
      result: secondParsed,
      citations: second.citations.length > 0 ? second.citations : first.citations,
    }
  }

  const rawText = second.content || first.content
  return {
    result: buildFallbackResult(rawText),
    citations: second.citations.length > 0 ? second.citations : first.citations,
  }
}

function cleanupMaps() {
  const now = Date.now()

  interactionCache.forEach((entry, key) => {
    if (entry.expiresAt <= now) {
      interactionCache.delete(key)
    }
  })

  requestRateMap.forEach((entry, key) => {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS * 2) {
      requestRateMap.delete(key)
    }
  })
}

export async function POST(request: NextRequest) {
  cleanupMaps()

  const ip = getClientIp(request)
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      {
        error: 'Limite atteinte: maximum 20 verifications par minute. Merci de patienter quelques secondes.',
      },
      { status: 429 }
    )
  }

  try {
    const rawBody = (await request.json()) as unknown
    const parsedBody = RequestSchema.safeParse(rawBody)

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: 'Requete invalide. Verifiez les champs drug1/drug2 et le contexte patient.',
          details: parsedBody.error.flatten(),
        },
        { status: 400 }
      )
    }

    const body = parsedBody.data
    const d1 = canonicalizeDrug(body.drug1)
    const d2 = canonicalizeDrug(body.drug2)

    if (!d1 || !d2) {
      return NextResponse.json({ error: 'Noms de medicaments invalides.' }, { status: 400 })
    }

    const key = interactionCacheKey(d1, d2)
    const cached = interactionCache.get(key)

    let baseResult: BaseInteractionResult
    let citations: string[]

    if (cached && cached.expiresAt > Date.now()) {
      baseResult = cached.result
      citations = cached.citations
    } else {
      const fresh = await getBaseInteractionResult(d1, d2, body.patient)
      baseResult = fresh.result
      citations = fresh.citations

      interactionCache.set(key, {
        result: fresh.result,
        citations: fresh.citations,
        expiresAt: Date.now() + CACHE_TTL_MS,
      })
    }

    const finalResult = applyDeterministicRules(baseResult, body.patient, d1, d2)

    const payload: FinalInteractionResult = {
      ...finalResult,
      citations: citations.length > 0 ? citations : undefined,
    }

    return NextResponse.json(payload, { status: 200 })
  } catch (error) {
    const message =
      error instanceof Error && error.name === 'AbortError'
        ? 'Delai depasse pendant la verification de l interaction.'
        : error instanceof Error
          ? error.message
          : 'Erreur serveur inattendue.'

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
