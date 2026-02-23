#!/usr/bin/env python3
"""Incremental daily updater for Moroccan drugs dataset from medicament.ma.

This script discovers medicament pages via WordPress sitemaps and updates
`public/data/medicament_ma_optimized.json` with a resilient incremental flow.

Highlights:
- Incremental updates based on sitemap `lastmod`
- Bootstrap mode from existing local JSON (no expensive full crawl on first run)
- Grace periods for missing/disappearing pages (avoid abrupt data drops)
- Safety guard against large accidental drops

Usage:
    python scripts/medicaments_updater.py
    python scripts/medicaments_updater.py --full-refresh
    python scripts/medicaments_updater.py --limit 50 --verbose
"""

from __future__ import annotations

import argparse
import concurrent.futures
import datetime as dt
import json
import logging
import os
import random
import re
import threading
import time
import unicodedata
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import requests
from bs4 import BeautifulSoup


BASE_URL = "https://medicament.ma"
SITEMAP_INDEX_URL = f"{BASE_URL}/wp-sitemap.xml"
USER_AGENT = "PharmaDW-Medicaments-Updater/1.0 (+https://github.com/MokokAf/PharmaDW)"
HEADERS = {"User-Agent": USER_AGENT}

ROOT_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT_DIR / "public" / "data"
OUTPUT_JSON = DATA_DIR / "medicament_ma_optimized.json"
STATE_JSON = DATA_DIR / "medicament_ma_state.json"

MAX_RETRIES = 3
REQUEST_TIMEOUT = 30
DROP_GUARD_RATIO = 0.30
MISSING_GRACE_RUNS = 3
ABSENT_GRACE_RUNS = 7
DEFAULT_REQUEST_DELAY = 0.35
DEFAULT_REQUEST_JITTER = 0.08
DEFAULT_CONCURRENCY = 1

logger = logging.getLogger("medicaments_updater")


FR_MONTHS = {
    "janvier": 1,
    "fevrier": 2,
    "février": 2,
    "mars": 3,
    "avril": 4,
    "mai": 5,
    "juin": 6,
    "juillet": 7,
    "aout": 8,
    "août": 8,
    "septembre": 9,
    "octobre": 10,
    "novembre": 11,
    "decembre": 12,
    "décembre": 12,
}


@dataclass
class SitemapEntry:
    url: str
    slug: str
    lastmod: Optional[str]


def configure_logging(verbose: bool) -> None:
    logging.basicConfig(
        level=logging.DEBUG if verbose else logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )


def env_float(name: str, default: float) -> float:
    raw = os.getenv(name)
    if raw is None:
        return default
    try:
        value = float(raw)
    except ValueError:
        logger.warning("Invalid float for %s=%r. Falling back to %.3f", name, raw, default)
        return default
    if value < 0:
        logger.warning("Negative value for %s=%r. Falling back to %.3f", name, raw, default)
        return default
    return value


def now_iso() -> str:
    return dt.datetime.utcnow().replace(microsecond=0).isoformat() + "Z"


def to_ascii_slug(value: str) -> str:
    value = unicodedata.normalize("NFD", value)
    value = "".join(ch for ch in value if unicodedata.category(ch) != "Mn")
    value = value.lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    value = re.sub(r"-+", "-", value).strip("-")
    return value


def parse_float(value: str) -> Optional[float]:
    if not value:
        return None
    cleaned = value.replace("dhs", "").replace("dh", "").replace("MAD", "")
    cleaned = cleaned.replace("\xa0", " ").strip()
    # keep digits, comma, dot
    cleaned = re.sub(r"[^0-9,\.]", "", cleaned)
    cleaned = cleaned.replace(",", ".")
    if cleaned.count(".") > 1:
        parts = cleaned.split(".")
        cleaned = "".join(parts[:-1]) + "." + parts[-1]
    try:
        return float(cleaned)
    except ValueError:
        return None


def split_values(value: str) -> List[str]:
    if not value:
        return []
    parts = re.split(r"\s*(?:\||;|,|/|\+|\bet\b)\s*", value, flags=re.IGNORECASE)
    out: List[str] = []
    seen = set()
    for part in parts:
        p = part.strip(" -\n\t")
        if not p:
            continue
        p = re.sub(r"\s+", " ", p)
        key = p.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(p)
    return out


# ---------------------------------------------------------------------------
# Therapeutic-class normalisation
# ---------------------------------------------------------------------------

def _tc_strip_accents(s: str) -> str:
    """Remove combining diacritics for fuzzy matching."""
    nfkd = unicodedata.normalize("NFD", s)
    return "".join(ch for ch in nfkd if unicodedata.category(ch) != "Mn")


# Accent-stripped word → properly accented word (for French pharma terms)
_ACCENT_FIX: Dict[str, str] = {
    "antidepresseur": "antidépresseur",
    "antidepresseurs": "antidépresseurs",
    "antiemetique": "antiémétique",
    "antiemetiques": "antiémétiques",
    "antianemique": "antianémique",
    "antiasthenique": "antiasthénique",
    "antibacterien": "antibactérien",
    "antibacteriens": "antibactériens",
    "antiagregant": "antiagrégant",
    "antiacneique": "antiacnéique",
    "periphérique": "périphérique",
    "peripherique": "périphérique",
    "opioide": "opioïde",
    "opioides": "opioïdes",
    "steroidien": "stéroïdien",
    "steroidiens": "stéroïdiens",
    "steroide": "stéroïde",
    "steroides": "stéroïdes",
    "steroidienne": "stéroïdienne",
    "corticosteroide": "corticostéroïde",
    "corticosteroides": "corticostéroïdes",
    "antipyretique": "antipyrétique",
    "antipyretiques": "antipyrétiques",
    "analgesique": "analgésique",
    "analgesiques": "analgésiques",
    "antiulcereux": "antiulcéreux",
    "antispasmodique": "antispasmodique",
    "antihypertenseur": "antihypertenseur",
    "antiparasitaire": "antiparasitaire",
    "antineoplasique": "antinéoplasique",
    "antineoplasiques": "antinéoplasiques",
    "antiepileptique": "antiépileptique",
    "antiepileptiques": "antiépileptiques",
    "hypoglycemiant": "hypoglycémiant",
    "hypolipidemiant": "hypolipidémiant",
    "hypolipemiant": "hypolipémiant",
    "hypolipemiants": "hypolipémiants",
    "diuretique": "diurétique",
    "diuretiques": "diurétiques",
    "antitetanique": "antitétanique",
    "cephalosporine": "céphalosporine",
    "cephalosporines": "céphalosporines",
    "generation": "génération",
    "adrenergiques": "adrénergiques",
    "dopaminergiques": "dopaminergiques",
    "homeopathique": "homéopathique",
    "homeopathiques": "homéopathiques",
    "betabloquant": "bêtabloquant",
    "betabloquants": "bêtabloquants",
    "beta-bloquant": "bêta-bloquant",
    "beta-bloquants": "bêta-bloquants",
    "complement": "complément",
    "corticoide": "corticoïde",
    "corticoides": "corticoïdes",
    "thyroidienne": "thyroïdienne",
    "thyroidiennes": "thyroïdiennes",
    "phosphodiesterase": "phosphodiestérase",
    "mineraux": "minéraux",
    "mineral": "minéral",
    "oligoelements": "oligoéléments",
    "oligoelement": "oligoélément",
    "penicilline": "pénicilline",
    "penicillines": "pénicillines",
    "erectile": "érectile",
    "antineoplasique": "antinéoplasique",
    "antineoplasiques": "antinéoplasiques",
}


def _fix_accents(text: str) -> str:
    """Fix missing/wrong accents in French pharmaceutical terms."""
    words = text.split()
    fixed = []
    for w in words:
        # Separate trailing punctuation
        trail = ""
        core = w
        while core and core[-1] in ".,;:)":
            trail = core[-1] + trail
            core = core[:-1]
        if not core:
            fixed.append(w)
            continue
        stripped = _tc_strip_accents(core.lower())
        if stripped in _ACCENT_FIX:
            target = _ACCENT_FIX[stripped]
            if core[0].isupper():
                target = target[0].upper() + target[1:]
            if core == core.upper() and len(core) > 3:
                target = target.upper()
            fixed.append(target + trail)
        else:
            fixed.append(w)
    return " ".join(fixed)


def _normalize_case(text: str) -> str:
    """Normalize case: sentence case, preserving acronyms."""
    if not text:
        return text
    # Known acronyms to preserve
    acronyms = {"AINS", "IPP", "IEC", "ISRS", "IRSNa", "IRDN", "GnRH",
                "DPP-4", "ECA", "IRSN", "ISRSN", "PDE5", "ADN", "HMG",
                "CoA", "MAO", "ARA", "II", "III", "IV", "XA", "Xa",
                "H1", "H2", "B1", "B2", "B6", "B9", "B12", "D3", "K",
                "SGLT2", "DHA", "EPA", "RGO"}

    words = text.split()
    result = []
    for i, w in enumerate(words):
        # Keep acronyms as-is
        if w in acronyms or w.rstrip(".,;:)") in acronyms:
            result.append(w)
        # Keep words with intentional mid-caps (e.g. "CoA")
        elif any(c.isupper() for c in w[1:]) and not w.isupper():
            result.append(w)
        # First word: capitalize
        elif i == 0:
            result.append(w[0].upper() + w[1:].lower() if len(w) > 1 else w.upper())
        # ALL-CAPS word (not acronym): lowercase
        elif w == w.upper() and len(w) > 4:
            result.append(w.lower())
        # Short all-caps that aren't known acronyms: lowercase unless ≤2 chars
        elif w == w.upper() and len(w) <= 4 and len(w) > 2:
            result.append(w.lower())
        else:
            result.append(w.lower() if w[0].isupper() and i > 0 and len(w) > 1 else w)

    return " ".join(result)


# Explicit typo → correction map (lowercased keys, preferred-case values)
_TYPO_MAP: Dict[str, str] = {
    "abtibactérien": "Antibactérien",
    "ais": "AINS",
    "ant-inflammatoire non stéroïdien": "Anti-inflammatoire non stéroïdien",
    "ant-inflammatoire stéroïdien": "Anti-inflammatoire stéroïdien",
    "antagioniste": "Antagoniste",
    "anti-inflammatoire non stroïdien": "Anti-inflammatoire non stéroïdien",
    "anti-inflammatoire non stéroidien": "Anti-inflammatoire non stéroïdien",
    "anti-inflammatoire stéroidien": "Anti-inflammatoire stéroïdien",
    "anti-inflammatoires non stéroïdes": "Anti-inflammatoires non stéroïdiens",
    "antimycosique a usage systemiqu": "Antimycosique à usage systémique",
    "antaengoreux": "Antiangoreux",
    "anytipyrétique": "antipyrétique",
    "antbiotique": "Antibiotique",
    "macropodes": "macrolides",
    "fluoquinolone": "fluoroquinolone",
    "fluoquinolones": "fluoroquinolones",
    "plaguettaire": "plaquettaire",
    "antihistamique": "Antihistaminique",
    "musculoptrope": "musculotrope",
    "musculotrpe": "musculotrope",
    "anasthésique": "Anesthésique",
    "anxolytique": "Anxiolytique",
    "hynotique": "Hypnotique",
    "hypolémiant": "Hypolipémiant",
    "neuroleptiaue": "Neuroleptique",
    "neuroléptique": "Neuroleptique",
    "corticostroïde": "Corticostéroïde",
    "glucostéroïdes": "Glucocorticoïdes",
    "biphosphonate": "Bisphosphonate",
    "immunosuppreseur": "Immunosuppresseur",
    "immunosuppreseurs": "Immunosuppresseurs",
    "antidiabètique": "Antidiabétique",
    "mycolytique": "Mucolytique",
    "votamines": "Vitamines",
    "chelateur": "Chélateur",
    "hypolipidemiant": "Hypolipémiant",
    "cytologique": "cytotoxique",
    "occulaire": "oculaire",
    "veinotoniqueique": "veinotonique",
    "duirétique": "diurétique",
    "complémént": "Complément",
    "allimentaire": "alimentaire",
    "hypolémiants": "hypolipémiants",
    "probiotics": "Probiotiques",
    "emoliant": "Émollient",
    "emolients": "Émollients",
    "analoque": "analogue",
    "antidiarrheique": "Antidiarrhéique",
    "acétylchlinestérase": "acétylcholinestérase",
    "sooscié": "associé",
    "systèmique": "systémique",
    "phosphodiésterase": "phosphodiestérase",
    "eréctile": "érectile",
    "hypertenseurs": "antihypertenseurs",
    "facteur xa": "facteur Xa",
}

# Regex patterns that mark a value as junk (not a real therapeutic class)
_JUNK_PATTERNS: List[re.Pattern] = [  # type: ignore[type-arg]
    re.compile(r"^\d{5,}$"),                          # barcodes
    re.compile(r"^[A-Z]\d{2}[A-Z]{0,2}\d{0,2}$"),    # ATC codes (e.g. A02BC05)
    re.compile(r"Statut\s*:", re.IGNORECASE),          # "Statut :" appended
    re.compile(r"\b(?:cpr|caps|pell)\s+\d", re.IGNORECASE),  # dosage forms
    re.compile(r"\bDIOVAN\b|\bREVATIO\b|\bDEMETRIN\b|\bHYCAMTIN\b"),  # brand names
    re.compile(r"\bUROMI\b"),                          # product name
    re.compile(r"^(?:CalmTu|ReConnect|Vitadigest)\b"),  # product descriptions
    re.compile(r"^Ce complément alimentaire", re.IGNORECASE),
    re.compile(r"^Agalsidase bêta \(produite", re.IGNORECASE),
    re.compile(r"est un cytostatique", re.IGNORECASE),
    re.compile(r"^Traitement des infections suivantes", re.IGNORECASE),
    re.compile(r"\bATC\s+[A-Z]\d{2}", re.IGNORECASE),  # inline ATC refs
    re.compile(r"\bliste\s+\d", re.IGNORECASE),        # "liste 2" appended
    re.compile(r"\bDCI\s*:", re.IGNORECASE),            # DCI refs
    re.compile(r"^flacon compte goutte", re.IGNORECASE),
    re.compile(r"^20 ML$", re.IGNORECASE),
    re.compile(r"^ÉDICAMENTS?\b"),                      # truncated MÉDICAMENTS
]

# Fragment patterns: values from incorrect splitting that aren't real classes
_FRAGMENT_PATTERNS: List[re.Pattern] = [  # type: ignore[type-arg]
    re.compile(r"^(?:cystite|pyélonéphrite|otite moyenne aiguë|pneumonie aiguë communautaire)$", re.IGNORECASE),
    re.compile(r"^(?:infections de la peau|infections des os|morsures animales)$", re.IGNORECASE),
    re.compile(r"^(?:abcès dentaire|exacerbations aiguës|sinusite bactérienne)", re.IGNORECASE),
    re.compile(r"^en particulier (?:ostéomyélite|cellulite)", re.IGNORECASE),
    re.compile(r"^les enfants", re.IGNORECASE),
    re.compile(r"ayant un effet bénéfique", re.IGNORECASE),
    re.compile(r"^(?:CD3\)|CDK6|D3\)|EPA\)|III|dose réduite\))$"),
    re.compile(r"^(?:alpha|puissant|monovalent|recombinant|sélectif|non fractionnée|non ionique|prolongée\.?)$", re.IGNORECASE),
    re.compile(r"^(?:apparentés|associations\.?\s*(?:IEC)?|autres combinaisons|incluant les associations)$", re.IGNORECASE),
    re.compile(r"^(?:de basse osmolarité|des propriétés vasoconstrictrices|à élimination rénale)$", re.IGNORECASE),
    re.compile(r"^(?:la coqueluche|la diphtérie|la poliomyélite|la vitamine|le sommeil|le reflux)$", re.IGNORECASE),
    re.compile(r"^de (?:la noradrénaline|l'hypothalamus|Antagoniste|bronchodilatateur)$", re.IGNORECASE),
    re.compile(r"^(?:des articulations|des tissus mous|des fissures anales|scabicides inclus)$", re.IGNORECASE),
    re.compile(r"^(?:non stéroïdiens|immunomodulateurs\)|anti-IL-23\)|diurétique \))$", re.IGNORECASE),
    re.compile(r"^(?:LE REFLUX GASTRO|DES FISSURES ANALES|SCABICIDES INCLUS)", re.IGNORECASE),
    re.compile(r"^(?:rhCG|rhFSH|rhLH|époétine alfa|époétine bêta|insuline glargine|lixisénatide|somatropine)$", re.IGNORECASE),
]

# Active ingredients misclassified as therapeutic classes
_NOT_A_CLASS = {
    "fer", "iode", "zinc", "sélénium", "lévodopa", "métformine",
    "repaglinide", "prégabaline", "cyclophosphamide", "follitropine alfa",
}


def _apply_typo_fixes(text: str) -> str:
    """Apply word-level typo corrections."""
    lower = text.lower()
    # Try full-string match first
    if lower in _TYPO_MAP:
        return _TYPO_MAP[lower]
    # Try word-level replacements
    result = text
    for typo, fix in _TYPO_MAP.items():
        pattern = re.compile(re.escape(typo), re.IGNORECASE)
        if pattern.search(result):
            result = pattern.sub(fix, result)
    return result


def _is_junk(value: str) -> bool:
    """Check if a value should be discarded entirely."""
    stripped = value.strip()
    if not stripped or len(stripped) < 2:
        return True
    if len(stripped) > 120:
        return True
    if stripped.lower() in _NOT_A_CLASS:
        return True
    for pat in _JUNK_PATTERNS:
        if pat.search(stripped):
            return True
    for pat in _FRAGMENT_PATTERNS:
        if pat.search(stripped):
            return True
    return False


def normalize_therapeutic_classes(values: List[str]) -> List[str]:
    """Normalize a list of therapeutic class strings.

    Applies: junk removal, typo fixes, punctuation cleanup,
    whitespace normalization, case normalization, deduplication.
    """
    result: List[str] = []
    seen: set = set()

    for raw in values:
        v = raw.strip()
        if not v:
            continue

        # 1. Discard junk
        if _is_junk(v):
            continue

        # 2. Fix concatenation errors (missing spaces)
        v = re.sub(r"([a-zé])([A-Z])", r"\1, \2", v)  # "AntiacideAntiulcéreux"
        v = re.sub(r"Anti-inAnti-", "Anti-", v)  # stuttered prefix

        # 3. Strip trailing punctuation
        v = re.sub(r"[.,;:]+\s*$", "", v)

        # 4. Fix double spaces
        v = re.sub(r"\s{2,}", " ", v).strip()

        # 5. Fix unbalanced parentheses (missing closing)
        open_count = v.count("(")
        close_count = v.count(")")
        if open_count > close_count:
            v += ")" * (open_count - close_count)

        # 6. Apply typo corrections
        v = _apply_typo_fixes(v)

        # 7. Fix accents (missing/wrong diacritics)
        v = _fix_accents(v)

        # 8. Case normalization
        v = _normalize_case(v)

        # 9. Ensure first letter is uppercase
        if v and v[0].islower():
            v = v[0].upper() + v[1:]

        # 10. Second junk check after transformations (e.g. concatenation fixes)
        if _is_junk(v):
            continue

        # 11. Deduplicate (case-insensitive, accent-insensitive)
        key = _tc_strip_accents(v.lower().strip())
        # Also strip trailing 's' for dedup
        dedup_key = key.rstrip("s") if len(key) > 3 else key
        if dedup_key in seen:
            continue
        seen.add(dedup_key)
        seen.add(key)

        if v.strip():
            result.append(v.strip())

    return result


def parse_fr_date(raw: str) -> Optional[str]:
    # examples: "5 novembre 2024"
    raw_norm = raw.strip().lower()
    raw_norm = unicodedata.normalize("NFD", raw_norm)
    raw_norm = "".join(ch for ch in raw_norm if unicodedata.category(ch) != "Mn")
    m = re.search(r"(\d{1,2})\s+([a-z]+)\s+(\d{4})", raw_norm)
    if not m:
        return None
    day = int(m.group(1))
    month = FR_MONTHS.get(m.group(2))
    year = int(m.group(3))
    if not month:
        return None
    try:
        return dt.date(year, month, day).isoformat()
    except ValueError:
        return None


def normalize_header(value: str) -> str:
    v = value.strip().lower()
    v = unicodedata.normalize("NFD", v)
    v = "".join(ch for ch in v if unicodedata.category(ch) != "Mn")
    v = re.sub(r"\s+", " ", v)
    return v


def read_json(path: Path, fallback: Any) -> Any:
    if not path.exists():
        return fallback
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:  # noqa: BLE001
        logger.warning("Failed to read %s: %s", path, exc)
        return fallback


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(path)


def get_with_retry(url: str) -> requests.Response:
    last_exc: Optional[Exception] = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            resp = requests.get(url, headers=HEADERS, timeout=REQUEST_TIMEOUT)
            return resp
        except requests.RequestException as exc:
            last_exc = exc
            if attempt >= MAX_RETRIES:
                break
            wait = 2 ** (attempt - 1)
            logger.warning("GET failed (%s) for %s, retry in %ss", exc, url, wait)
            time.sleep(wait)
    raise RuntimeError(f"HTTP failure for {url}: {last_exc}")


def parse_sitemap_index() -> List[str]:
    resp = get_with_retry(SITEMAP_INDEX_URL)
    resp.raise_for_status()
    root = ET.fromstring(resp.text)
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    urls = [
        n.text.strip()
        for n in root.findall("sm:sitemap/sm:loc", ns)
        if n.text and "posts-medicament" in n.text
    ]
    return urls


def slug_from_url(url: str) -> Optional[str]:
    m = re.search(r"/medicament/([^/]+)/?$", url)
    if not m:
        return None
    return m.group(1).strip()


def parse_sitemap_entries(sitemap_url: str) -> List[SitemapEntry]:
    resp = get_with_retry(sitemap_url)
    resp.raise_for_status()
    root = ET.fromstring(resp.text)
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}

    entries: List[SitemapEntry] = []
    for url_node in root.findall("sm:url", ns):
        loc = url_node.find("sm:loc", ns)
        if loc is None or not loc.text:
            continue
        url = loc.text.strip()
        slug = slug_from_url(url)
        if not slug:
            continue
        lastmod_node = url_node.find("sm:lastmod", ns)
        lastmod = lastmod_node.text.strip() if lastmod_node is not None and lastmod_node.text else None
        entries.append(SitemapEntry(url=url, slug=slug, lastmod=lastmod))
    return entries


def extract_details_map(root: BeautifulSoup) -> Dict[str, str]:
    details: Dict[str, str] = {}
    for item in root.select(".medicine-details .detail-item"):
        key_el = item.select_one(".detail-header")
        val_el = item.select_one(".detail-content")
        if not key_el or not val_el:
            continue
        key = normalize_header(key_el.get_text(" ", strip=True))
        val = val_el.get_text(" ", strip=True)
        if key and val:
            details[key] = re.sub(r"\s+", " ", val).strip()
    return details


def parse_notice_dates(root: BeautifulSoup) -> Tuple[Optional[str], Optional[str]]:
    text = root.get_text(" ", strip=True)
    text = re.sub(r"\s+", " ", text)
    updated = None
    added = None

    m1 = re.search(r"Mise\s+a\s+jour\s+le\s*:\s*([^A]+?\d{4})", text, flags=re.IGNORECASE)
    if m1:
        updated = parse_fr_date(m1.group(1))

    m2 = re.search(r"Ajoute\s+le\s*:\s*([^S]+?\d{4})", text, flags=re.IGNORECASE)
    if m2:
        added = parse_fr_date(m2.group(1))

    return updated, added


def infer_dosage_form(name: str) -> Optional[str]:
    if "," in name:
        part = name.split(",", 1)[1].strip()
        return part or None
    return None


def map_details_to_record(slug: str, url: str, name: str, details: Dict[str, str], updated_date: Optional[str]) -> Dict[str, Any]:
    presentation = details.get("presentation")
    strength = details.get("dosage")
    manufacturer = details.get("distributeur ou fabriquant") or details.get("fabricant")
    active_ingredient_raw = details.get("composition", "")
    active_ingredients = split_values(active_ingredient_raw)
    if not active_ingredients:
        active_ingredients = [name.split(",", 1)[0].strip()]

    therapeutic = normalize_therapeutic_classes(
        split_values(details.get("classe therapeutique", ""))
    )
    status = details.get("statut")
    atc_code = details.get("code atc")
    table = details.get("tableau")
    ppv = parse_float(details.get("ppv", ""))
    hospital_price = parse_float(details.get("prix hospitalier", ""))

    indication = details.get("indication(s)") or details.get("indications")
    description = indication or f"Fiche medicament Maroc issue de medicament.ma ({url})."

    price_payload: Dict[str, Any] = {"currency": "MAD"}
    if ppv is not None:
        price_payload["public"] = ppv
    if hospital_price is not None:
        price_payload["hospital"] = hospital_price

    dosage_form = infer_dosage_form(name)

    record: Dict[str, Any] = {
        "@context": "https://schema.org",
        "@type": "Drug",
        "id": slug,
        "name": name,
        "description": description,
        "activeIngredient": active_ingredients,
        "dosageForm": dosage_form,
        "strength": strength,
        "presentation": presentation,
        "therapeuticClass": therapeutic,
        "atcCode": atc_code,
        "status": status,
        "productType": "Drug",
        "manufacturer": manufacturer,
        "price": price_payload if len(price_payload) > 1 else None,
        "table": table,
        "updatedAt": updated_date or dt.date.today().isoformat(),
    }

    # Remove null/empty values to keep output compact and consistent
    cleaned: Dict[str, Any] = {}
    for key, value in record.items():
        if value is None:
            continue
        if isinstance(value, str) and not value.strip():
            continue
        if isinstance(value, list) and not value:
            continue
        cleaned[key] = value

    return cleaned


def request_sleep_delay(base_delay: float, jitter: float) -> float:
    if jitter <= 0:
        return base_delay
    return max(0.0, base_delay + random.uniform(-jitter, jitter))


class RateLimiter:
    """Thread-safe rate limiter ensuring minimum spacing between request starts."""

    def __init__(self, min_interval: float, jitter: float = 0.0):
        self._min_interval = min_interval
        self._jitter = jitter
        self._lock = threading.Lock()
        self._next_allowed = 0.0

    def wait(self) -> None:
        with self._lock:
            now = time.monotonic()
            wait_until = self._next_allowed
            interval = request_sleep_delay(self._min_interval, self._jitter)
            self._next_allowed = max(now, wait_until) + interval

        delay = wait_until - time.monotonic()
        if delay > 0:
            time.sleep(delay)


def fetch_and_parse_medicament(
    entry: SitemapEntry,
    rate_limiter: Optional[RateLimiter] = None,
    request_delay: float = 0.0,
    request_jitter: float = 0.0,
) -> Tuple[str, str, Optional[Dict[str, Any]], str]:
    """Returns (slug, status, record, message). status in {ok,missing,error}"""
    if rate_limiter is not None:
        rate_limiter.wait()
    else:
        time.sleep(request_sleep_delay(request_delay, request_jitter))
    try:
        resp = get_with_retry(entry.url)
    except Exception as exc:  # noqa: BLE001
        return entry.slug, "error", None, f"request failed: {exc}"

    if resp.status_code >= 400:
        return entry.slug, "missing", None, f"http {resp.status_code}"

    soup = BeautifulSoup(resp.text, "html.parser")
    page_title = (soup.title.get_text(strip=True) if soup.title else "").lower()

    if "page non trouv" in page_title or "page non trouv" in soup.get_text(" ", strip=True).lower():
        return entry.slug, "missing", None, "not found marker"

    root = soup.select_one(".single-medicament")
    if not root:
        return entry.slug, "error", None, "missing .single-medicament container"

    title_el = root.select_one("h1.main-title") or root.select_one("h1")
    if not title_el:
        return entry.slug, "error", None, "missing title"

    name = re.sub(r"\s+", " ", title_el.get_text(" ", strip=True)).strip()
    if not name:
        return entry.slug, "error", None, "empty title"

    details = extract_details_map(root)
    updated_date, _ = parse_notice_dates(root)
    record = map_details_to_record(entry.slug, entry.url, name, details, updated_date)

    return entry.slug, "ok", record, ""


def merge_state_entry(prev: Dict[str, Any], **updates: Any) -> Dict[str, Any]:
    next_entry = dict(prev)
    next_entry.update(updates)
    return next_entry


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Incremental daily updater for medicament dataset")
    parser.add_argument("--full-refresh", action="store_true", help="Ignore cache hints and re-fetch all discovered URLs")
    parser.add_argument("--force-accept-drop", action="store_true", help="Allow big drops (>30%) without failing")
    parser.add_argument("--limit", type=int, default=0, help="Process only N discovered entries (debug/testing)")
    parser.add_argument("--dry-run", action="store_true", help="Run updater without writing JSON files")
    parser.add_argument(
        "--request-delay",
        type=float,
        default=env_float("MEDICAMENT_REQUEST_DELAY", DEFAULT_REQUEST_DELAY),
        help="Delay in seconds between page requests (default from MEDICAMENT_REQUEST_DELAY or 0.35)",
    )
    parser.add_argument(
        "--request-jitter",
        type=float,
        default=env_float("MEDICAMENT_REQUEST_JITTER", DEFAULT_REQUEST_JITTER),
        help="Random jitter in seconds (+/-) for request delay (default from MEDICAMENT_REQUEST_JITTER or 0.08)",
    )
    parser.add_argument(
        "--concurrency",
        type=int,
        default=int(os.getenv("MEDICAMENT_CONCURRENCY", str(DEFAULT_CONCURRENCY))),
        help="Number of parallel fetch workers (default from MEDICAMENT_CONCURRENCY or 1)",
    )
    parser.add_argument("--verbose", action="store_true", help="Verbose logs")
    return parser


def main() -> int:
    args = build_arg_parser().parse_args()
    configure_logging(args.verbose)

    if args.request_delay < 0 or args.request_jitter < 0:
        logger.error("--request-delay and --request-jitter must be >= 0")
        return 1

    logger.info(
        "Rate limit configured: delay=%.3fs jitter=%.3fs concurrency=%d",
        args.request_delay,
        args.request_jitter,
        max(1, args.concurrency),
    )

    if args.limit and args.limit > 0 and not args.dry_run:
        logger.warning("--limit was provided without --dry-run. For safety, dry-run mode is enabled.")
        args.dry_run = True

    existing_records: List[Dict[str, Any]] = read_json(OUTPUT_JSON, fallback=[])
    if not isinstance(existing_records, list):
        logger.error("Invalid format for %s (expected list)", OUTPUT_JSON)
        return 1

    existing_rows_by_slug: Dict[str, List[Dict[str, Any]]] = {}
    for item in existing_records:
        if not isinstance(item, dict):
            continue
        slug = item.get("id")
        if not slug:
            continue
        existing_rows_by_slug.setdefault(str(slug), []).append(item)

    def existing_first(slug: str) -> Optional[Dict[str, Any]]:
        rows = existing_rows_by_slug.get(slug, [])
        return rows[0] if rows else None

    state_payload = read_json(STATE_JSON, fallback={})
    state_records: Dict[str, Dict[str, Any]] = {}
    if isinstance(state_payload, dict):
        recs = state_payload.get("records", {})
        if isinstance(recs, dict):
            state_records = {k: v for k, v in recs.items() if isinstance(v, dict)}

    try:
        sitemap_urls = parse_sitemap_index()
    except Exception as exc:  # noqa: BLE001
        logger.error("Cannot read sitemap index: %s", exc)
        return 1

    all_entries: List[SitemapEntry] = []
    for sitemap_url in sitemap_urls:
        try:
            entries = parse_sitemap_entries(sitemap_url)
            all_entries.extend(entries)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Failed to parse sitemap %s: %s", sitemap_url, exc)

    # dedupe by slug, keep latest lastmod available
    dedup: Dict[str, SitemapEntry] = {}
    for entry in all_entries:
        prev = dedup.get(entry.slug)
        if prev is None:
            dedup[entry.slug] = entry
            continue
        if (entry.lastmod or "") > (prev.lastmod or ""):
            dedup[entry.slug] = entry

    discovered = list(dedup.values())
    discovered.sort(key=lambda x: x.slug)

    if args.limit and args.limit > 0:
        discovered = discovered[: args.limit]
        logger.info("Limit enabled: processing first %d entries", len(discovered))

    logger.info("Discovered %d medicament URLs from %d sitemap files", len(discovered), len(sitemap_urls))

    bootstrap_mode = (not state_records) and (not args.full_refresh)
    if bootstrap_mode:
        logger.info("No state file detected: bootstrap mode enabled (reusing existing local records when possible)")

    next_records: Dict[str, Dict[str, Any]] = {}
    next_state_records: Dict[str, Dict[str, Any]] = {}

    discovered_slugs = {entry.slug for entry in discovered}

    to_fetch: List[SitemapEntry] = []
    reused_count = 0

    for entry in discovered:
        prev_state = state_records.get(entry.slug, {})
        existing = existing_first(entry.slug)

        should_fetch = args.full_refresh

        if not should_fetch:
            if bootstrap_mode and existing is not None:
                should_fetch = False
            elif existing is None:
                should_fetch = True
            elif prev_state.get("lastmod") != entry.lastmod:
                should_fetch = True
            elif prev_state.get("status") not in (None, "ok"):
                should_fetch = True
            else:
                should_fetch = False

        if should_fetch:
            to_fetch.append(entry)
            continue

        if existing is not None:
            next_records[entry.slug] = existing
            reused_count += 1

        next_state_records[entry.slug] = merge_state_entry(
            prev_state,
            url=entry.url,
            lastmod=entry.lastmod,
            status="ok" if existing is not None else prev_state.get("status", "unknown"),
            lastSeenAt=now_iso(),
            missingStreak=int(prev_state.get("missingStreak", 0) or 0),
            absentStreak=0,
        )

    logger.info("Reused %d unchanged records, fetching %d records", reused_count, len(to_fetch))

    fetched_ok = 0
    fetched_missing = 0
    fetched_error = 0

    def _process_fetch_result(
        entry: SitemapEntry, slug: str, status: str,
        record: Optional[Dict[str, Any]], message: str,
    ) -> None:
        nonlocal fetched_ok, fetched_missing, fetched_error
        prev_state = state_records.get(slug, {})
        existing = existing_first(slug)

        if status == "ok" and record is not None:
            next_records[slug] = record
            fetched_ok += 1
            next_state_records[slug] = merge_state_entry(
                prev_state,
                url=entry.url,
                lastmod=entry.lastmod,
                status="ok",
                missingStreak=0,
                absentStreak=0,
                lastSeenAt=now_iso(),
                lastFetchedAt=now_iso(),
                lastMessage="",
            )
        elif status == "missing":
            fetched_missing += 1
            missing_streak = int(prev_state.get("missingStreak", 0) or 0) + 1
            keep_existing = (existing is not None) and (missing_streak < MISSING_GRACE_RUNS)

            if keep_existing:
                next_records[slug] = existing

            next_state_records[slug] = merge_state_entry(
                prev_state,
                url=entry.url,
                lastmod=entry.lastmod,
                status="missing",
                missingStreak=missing_streak,
                absentStreak=0,
                lastSeenAt=now_iso(),
                lastFetchedAt=now_iso(),
                lastMessage=message,
            )
        else:
            fetched_error += 1
            if existing is not None:
                next_records[slug] = existing

            next_state_records[slug] = merge_state_entry(
                prev_state,
                url=entry.url,
                lastmod=entry.lastmod,
                status="error",
                absentStreak=0,
                lastSeenAt=now_iso(),
                lastFetchedAt=now_iso(),
                lastMessage=message,
            )

    concurrency = max(1, args.concurrency)
    rate_limiter = RateLimiter(args.request_delay, args.request_jitter)

    if concurrency <= 1:
        # Sequential mode (backward compatible)
        for idx, entry in enumerate(to_fetch, start=1):
            slug, status, record, message = fetch_and_parse_medicament(
                entry, rate_limiter=rate_limiter,
            )
            _process_fetch_result(entry, slug, status, record, message)
            if idx % 100 == 0:
                logger.info("Progress: fetched %d/%d", idx, len(to_fetch))
    else:
        # Parallel mode — overlaps network I/O across threads while
        # the RateLimiter guarantees min spacing between request starts.
        logger.info("Parallel fetching enabled: %d workers", concurrency)
        done_count = 0
        with concurrent.futures.ThreadPoolExecutor(max_workers=concurrency) as pool:
            future_to_entry = {
                pool.submit(fetch_and_parse_medicament, entry, rate_limiter=rate_limiter): entry
                for entry in to_fetch
            }
            for future in concurrent.futures.as_completed(future_to_entry):
                entry = future_to_entry[future]
                try:
                    slug, status, record, message = future.result()
                except Exception as exc:  # noqa: BLE001
                    slug, status, record, message = entry.slug, "error", None, f"thread error: {exc}"
                _process_fetch_result(entry, slug, status, record, message)
                done_count += 1
                if done_count % 100 == 0:
                    logger.info("Progress: fetched %d/%d", done_count, len(to_fetch))

    # Handle records no longer present in sitemap (temporary sitemap/API issues)
    retained_absent = 0
    retained_duplicate_rows = 0
    preserved_rows: List[Dict[str, Any]] = []

    for slug, rows in existing_rows_by_slug.items():
        if slug in next_records:
            # Keep historical duplicate rows untouched to avoid accidental collapse.
            if len(rows) > 1:
                preserved_rows.extend(rows[1:])
                retained_duplicate_rows += len(rows) - 1
            continue
        if slug in discovered_slugs:
            continue

        prev_state = state_records.get(slug, {})
        absent_streak = int(prev_state.get("absentStreak", 0) or 0) + 1
        if absent_streak < ABSENT_GRACE_RUNS:
            preserved_rows.extend(rows)
            retained_absent += len(rows)

        next_state_records[slug] = merge_state_entry(
            prev_state,
            status="absent",
            absentStreak=absent_streak,
            lastSeenAt=prev_state.get("lastSeenAt"),
            lastFetchedAt=prev_state.get("lastFetchedAt"),
        )

    output_records = list(next_records.values()) + preserved_rows
    output_records.sort(key=lambda x: (str(x.get("name", "")).lower(), str(x.get("id", "")).lower()))

    prev_count = len(existing_records)
    new_count = len(output_records)
    delta = new_count - prev_count

    logger.info(
        "Summary: prev=%d new=%d delta=%+d | fetched ok=%d missing=%d error=%d | retained absent=%d",
        prev_count,
        new_count,
        delta,
        fetched_ok,
        fetched_missing,
        fetched_error,
        retained_absent,
    )
    if retained_duplicate_rows:
        logger.info("Preserved %d duplicate legacy rows", retained_duplicate_rows)

    # Drop guard to avoid publishing broken scrapes
    if prev_count > 0:
        drop_ratio = (prev_count - new_count) / prev_count
        if drop_ratio > DROP_GUARD_RATIO and not args.force_accept_drop:
            logger.error(
                "Drop guard triggered: dataset dropped by %.1f%% (threshold %.1f%%). "
                "Use --force-accept-drop if intentional.",
                drop_ratio * 100,
                DROP_GUARD_RATIO * 100,
            )
            return 2

    if args.dry_run:
        logger.info("Dry-run: no files were written.")
        return 0

    write_json(OUTPUT_JSON, output_records)

    state_payload_out = {
        "source": SITEMAP_INDEX_URL,
        "generatedAt": now_iso(),
        "requestDelaySec": args.request_delay,
        "requestJitterSec": args.request_jitter,
        "totalSitemaps": len(sitemap_urls),
        "totalDiscovered": len(discovered),
        "totalRecords": new_count,
        "stats": {
            "previousCount": prev_count,
            "newCount": new_count,
            "delta": delta,
            "reusedUnchanged": reused_count,
            "fetchedOk": fetched_ok,
            "fetchedMissing": fetched_missing,
            "fetchedError": fetched_error,
            "retainedAbsent": retained_absent,
        },
        "records": next_state_records,
    }
    write_json(STATE_JSON, state_payload_out)

    logger.info("Wrote %s and %s", OUTPUT_JSON.relative_to(ROOT_DIR), STATE_JSON.relative_to(ROOT_DIR))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
