import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type Payload = { drug1?: string; drug2?: string };

const SYSTEM_PROMPT =
  "Vous êtes un assistant pharmaceutique. Répondez en français, très brièvement, " +
  "en puces commençant par un emoji : ✅ si l’association est acceptable, ⚠️ si mise en garde. " +
  "Basez-vous uniquement sur des informations provenant de drugs.com. " +
  "Si aucune interaction n’est trouvée, indiquez explicitement qu’aucun problème majeur n’est connu.";

function sanitizeName(s?: string) {
  const v = (s ?? "").trim();
  if (!v) return null;
  if (v.length > 100) return null;
  return v;
}

export async function POST(req: NextRequest) {
  try {
    const { drug1, drug2 } = (await req.json()) as Payload;

    const d1 = sanitizeName(drug1);
    const d2 = sanitizeName(drug2);
    if (!d1 || !d2) {
      return NextResponse.json(
        { error: "Champs 'drug1' et 'drug2' requis." },
        { status: 400 }
      );
    }

    const userQuestion =
      `Deux médicaments : ${d1} et ${d2}. Peuvent-ils être pris ensemble ? ` +
      `Donnez 1 à 3 puces concises (✅/⚠️), sans paragraphes longs.`;

    const body = {
      model: "sonar",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userQuestion },
      ],
      temperature: 0,
      search_domain_filter: ["drugs.com"],
      web_search_options: { search_context_size: "low" },
      max_tokens: 300,
    };

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
      return NextResponse.json(
        { error: `Upstream error (${res.status}): ${text.slice(0, 200)}` },
        { status: 502 }
      );
    }

    const result = await res.json();
    const answer: string =
      result?.choices?.[0]?.message?.content ?? "Réponse indisponible.";

    // Try to surface sources if present in common fields
    const possibleSources: string[] =
      result?.citations ??
      result?.sources ??
      result?.choices?.[0]?.message?.citations ??
      [];

    const payload: { answer: string; sources?: string[] } = { answer };
    if (Array.isArray(possibleSources) && possibleSources.length > 0) {
      payload.sources = possibleSources
        .map((s: any) => (typeof s === "string" ? s : s?.url))
        .filter(Boolean);
    }

    return NextResponse.json(payload, { status: 200 });
  } catch (err: any) {
    const msg =
      err?.name === "AbortError"
        ? "Délai dépassé (timeout)."
        : err?.message || "Erreur serveur.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
