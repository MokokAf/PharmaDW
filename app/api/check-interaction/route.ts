import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// ---- Types ----
type DrugIn = {
  name: string;
  dose_mg?: number;
  route?: "po" | "iv" | "im" | "sc" | "inhal" | "top";
  freq?: string;
};

type PatientIn = {
  age?: number;
  sex?: "M" | "F" | "autre" | "inconnu";
  weight_kg?: number;
  pregnancy_status?: "enceinte" | "non_enceinte" | "inconnu";
  breastfeeding?: "oui" | "non" | "inconnu";
  renal_function?: { eGFR?: number; CKD_stage?: string };
  hepatic_impairment?: "none" | "mild" | "moderate" | "severe";
  allergies?: string[];
  conditions?: string[];
  pharmacogenetics?: { gene: string; phenotype: string }[];
  risk_flags?: string[]; // e.g. ["QT_prolongation", "chute"]
};

type Payload = {
  drug1?: DrugIn | string;
  drug2?: DrugIn | string;
  patient?: PatientIn;
  locale?: string;
};

type NormalizedOut = {
  summary_fr: string;
  bullets_fr: string[];
  action: "OK" | "Surveiller" | "Ajuster dose" | "Éviter/Contre-indiqué";
  severity: "aucune" | "mineure" | "modérée" | "majeure" | "contre-indiquée";
  mechanism?: string;
  patient_specific_notes?: string[];
  citations?: string[];
  triage: "vert" | "ambre" | "rouge";
};

// ---- Utils ----
const SYSTEM_PROMPT =
  "Vous êtes un assistant pharmaceutique. Répondez en français, brièvement (1–3 puces), " +
  "utilisez ✅ pour OK et ⚠️ pour mise en garde. Ne déduisez rien si un champ patient manque. " +
  "Basez-vous exclusivement sur drugs.com. Format concis, sans paragraphes longs.";

const toClean = (s?: string) => (s ?? "").toString().trim();
const sanitizeDrugName = (s?: string) => {
  const v = toClean(s).toLowerCase();
  if (!v || v.length > 100) return null;
  return v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/gi, "");
};

function canonicalizeDrug(input: DrugIn | string | undefined): DrugIn | null {
  if (!input) return null;
  if (typeof input === "string") {
    const name = sanitizeDrugName(input);
    if (!name) return null;
    return { name, route: "po" };
  }
  const name = sanitizeDrugName(input.name);
  if (!name) return null;
  return {
    name,
    dose_mg: typeof input.dose_mg === "number" ? input.dose_mg : undefined,
    route: input.route ?? "po",
    freq: input.freq ? toClean(input.freq) : undefined,
  };
}

const compactPatientBlock = (p?: PatientIn) => {
  if (!p) return "";
  const parts: string[] = [];
  if (typeof p.age === "number") parts.push(`age:${p.age}`);
  if (p.sex) parts.push(`sexe:${p.sex}`);
  if (typeof p.weight_kg === "number") parts.push(`poids:${p.weight_kg}kg`);
  if (p.pregnancy_status) parts.push(`grossesse:${p.pregnancy_status}`);
  if (p.breastfeeding) parts.push(`allaitement:${p.breastfeeding}`);
  if (p.renal_function?.eGFR !== undefined) parts.push(`eGFR:${p.renal_function.eGFR}`);
  if (p.renal_function?.CKD_stage) parts.push(`CKD:${p.renal_function.CKD_stage}`);
  if (p.hepatic_impairment) parts.push(`foie:${p.hepatic_impairment}`);
  if (p.allergies?.length) parts.push(`allergies:${p.allergies.join("|")}`);
  if (p.conditions?.length) parts.push(`comorbidites:${p.conditions.join("|")}`);
  if (p.pharmacogenetics?.length) parts.push(`pharmacogenetique:${p.pharmacogenetics.map(x=>`${x.gene}:${x.phenotype}`).join("|")}`);
  if (p.risk_flags?.length) parts.push(`flags:${p.risk_flags.join("|")}`);
  return parts.join("; ");
};

function deriveActionSeverity(text: string): { action: NormalizedOut["action"]; severity: NormalizedOut["severity"]; } {
  const t = text.toLowerCase();
  // Heuristics based on keywords/emojis
  let action: NormalizedOut["action"] = t.includes("⚠️") || /\bmonitor|surveiller|prudence|caution\b/.test(t)
    ? "Surveiller"
    : "OK";
  if (/contre[-\s]?indiqu|avoid|ne pas associer|danger/.test(t)) action = "Éviter/Contre-indiqué";
  if (/ajuster|dose|posologie/.test(t) && action !== "Éviter/Contre-indiqué") action = "Ajuster dose";

  let severity: NormalizedOut["severity"] = "aucune";
  if (action === "OK") severity = t.includes("mineure") ? "mineure" : "aucune";
  else if (action === "Surveiller") severity = "modérée";
  else if (action === "Ajuster dose") severity = "modérée";
  else if (action === "Éviter/Contre-indiqué") severity = "contre-indiquée";
  return { action, severity };
}

function triageFromAction(action: NormalizedOut["action"]): NormalizedOut["triage"] {
  if (action === "OK") return "vert";
  if (action === "Surveiller") return "ambre";
  return "rouge";
}

function applyDeterministicRules(answer: string, p: PatientIn | undefined, d1: DrugIn, d2: DrugIn) {
  const notes: string[] = [];
  let actionElevated: NormalizedOut["action"] | null = null;
  const lower = answer.toLowerCase();

  const elevate = (target: NormalizedOut["action"]) => {
    const order: NormalizedOut["action"][] = ["OK", "Surveiller", "Ajuster dose", "Éviter/Contre-indiqué"];
    if (!actionElevated) actionElevated = target; else {
      if (order.indexOf(target) > order.indexOf(actionElevated)) actionElevated = target;
    }
  };

  const textIncludesAny = (arr: string[]) => arr.some((x) => lower.includes(x.toLowerCase()));
  const hasFlag = (flag: string) => p?.risk_flags?.includes(flag) ?? false;

  // Age >=65 and sedative/anticholinergic mentions
  if ((p?.age ?? 0) >= 65 && textIncludesAny(["sedat", "somnol", "anticholin"])) {
    notes.push("⚠️ Sujet âgé : risque de chute/somnolence ↑ ; envisager dose ↓ et prudence.");
    elevate("Surveiller");
  }

  // Renal function eGFR <30 and renal keywords
  if ((p?.renal_function?.eGFR ?? 999) < 30 && textIncludesAny(["ajuster", "dose", "elimination", "renal", "rein", "insuffisance renale"])) {
    notes.push("⚠️ Atteinte rénale : vérifier posologie/intervalle ; surveiller effets/élimination.");
    elevate("Surveiller");
  }

  // QT risk
  if (hasFlag("QT_prolongation") || /\bqt\b|torsades/i.test(answer)) {
    notes.push("⚠️ Allongement du QT : éviter associations à risque ; envisager ECG/prudence électrolytes.");
    elevate("Surveiller");
  }

  // Pregnancy/Breastfeeding caution
  if (p?.pregnancy_status === "enceinte" || p?.breastfeeding === "oui") {
    if (/grossesse|allaitement|foetal|fetal|lactation/i.test(answer)) {
      notes.push("⚠️ Grossesse/Allaitement : vérifier sécurité sur la page drugs.com citée.");
      elevate("Surveiller");
    }
  }

  // Allergy class naive match
  const stripAccents = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const allergyHit = (p?.allergies || []).some((a) => {
    const al = stripAccents(a);
    return [d1.name, d2.name].some((dn) => {
      const n = stripAccents(dn);
      return (n.includes("penicillin") && al.includes("penicill")) || (n.includes("amoxicill") && al.includes("penicill"));
    });
  });
  if (allergyHit) {
    notes.push("⚠️ Antécédent d’allergie de classe : contre-indication potentielle ; confirmer l’historique.");
    elevate("Éviter/Contre-indiqué");
  }

  return { notes, actionElevated };
}

export async function POST(req: NextRequest) {
  try {
    const inBody = (await req.json()) as Payload;
    const d1 = canonicalizeDrug(inBody.drug1);
    const d2 = canonicalizeDrug(inBody.drug2);
    if (!d1 || !d2) {
      return NextResponse.json(
        { error: "Champs 'drug1' et 'drug2' requis." },
        { status: 400 }
      );
    }

    const patient = inBody.patient;
    const patientBlock = compactPatientBlock(patient);

    const userBlock = [
      `Meds: ${d1.name} vs ${d2.name}`,
      d1.dose_mg ? `D1_dose:${d1.dose_mg}mg` : null,
      d1.route ? `D1_route:${d1.route}` : null,
      d1.freq ? `D1_freq:${d1.freq}` : null,
      d2.dose_mg ? `D2_dose:${d2.dose_mg}mg` : null,
      d2.route ? `D2_route:${d2.route}` : null,
      d2.freq ? `D2_freq:${d2.freq}` : null,
      patientBlock ? `Patient: ${patientBlock}` : null,
    ].filter(Boolean).join("; ");

    const question = `${userBlock}. Interaction? Donnez 1–3 puces (✅/⚠️). Puis une ligne: Action = OK/Surveiller/Ajuster dose/Éviter.`;

    const body = {
      model: "sonar",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: question },
      ],
      temperature: 0,
      search_domain_filter: ["drugs.com"],
      web_search_options: { search_context_size: "low" },
      max_tokens: 320,
    } as const;

    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 12_000);
    const res = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      },
      body: JSON.stringify(body),
      signal: ctrl.signal,
      cache: "no-store",
    }).finally(() => clearTimeout(to));

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json({ error: `Upstream error (${res.status}): ${text.slice(0, 200)}` }, { status: 502 });
    }

    const result = await res.json();
    const rawAnswer: string = result?.choices?.[0]?.message?.content ?? "Réponse indisponible.";
    const citations: string[] = (result?.citations ?? result?.sources ?? result?.choices?.[0]?.message?.citations ?? [])
      .map((s: any) => (typeof s === "string" ? s : s?.url))
      .filter(Boolean);

    // Normalize bullets (split lines, keep only short items)
    const bullets = rawAnswer
      .split("\n")
      .map((l: string) => l.trim())
      .filter(Boolean)
      .map((l: string) => l.replace(/^[-•\*]\s*/, ""))
      .slice(0, 3);

    const { action: baseAction, severity: baseSeverity } = deriveActionSeverity(rawAnswer);
    const { notes, actionElevated } = applyDeterministicRules(rawAnswer, patient, d1, d2);

    const finalAction = actionElevated ?? baseAction;
    const triage = triageFromAction(finalAction);
    const out: NormalizedOut = {
      summary_fr: bullets[0] || (finalAction === "OK" ? "Association acceptable." : "Voir remarques."),
      bullets_fr: bullets,
      action: finalAction,
      severity: baseSeverity,
      mechanism: undefined,
      patient_specific_notes: notes,
      citations: citations.length ? citations : undefined,
      triage,
    };

    return NextResponse.json(out, { status: 200 });
  } catch (err: any) {
    const msg = err?.name === "AbortError" ? "Délai dépassé (timeout)." : err?.message || "Erreur serveur.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
