"""Multi-source pharmacy scraper with cross-validation.

Combines data from several Moroccan pharmacy directories:
  1. annuaire-gratuit.ma  — national coverage
  2. guidepharmacies.ma   — Rabat, Salé, Kénitra, Témara
  3. infopoint.ma         — Tanger, Casablanca
  4. med.ma               — Marrakech

Outputs:
  public/data/pharmacies.json      — pharmacy records
  public/data/pharmacies_meta.json — freshness metadata

Usage:
  python scripts/pharmacies_scraper.py
"""

from __future__ import annotations

import json
import logging
import re
import sys
import time
import unicodedata
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field, asdict
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import List, Dict, Tuple

import requests
from bs4 import BeautifulSoup

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("pharmacies_scraper")

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
HEADERS = {
    "User-Agent": "PharmaDW-Scraper/2.0 (+https://github.com/MokokAf/PharmaDW)",
    "Accept-Language": "fr,ar;q=0.8,en;q=0.7",
}

REQUEST_DELAY = 0.5
DETAIL_DELAY = 0.3

BASE_DIR = Path(__file__).resolve().parents[1]
OUTPUT_JSON = BASE_DIR / "public" / "data" / "pharmacies.json"
OUTPUT_META = BASE_DIR / "public" / "data" / "pharmacies_meta.json"

MOROCCO_TZ = timezone(timedelta(hours=1))
_NOW_MOROCCO = datetime.now(MOROCCO_TZ)
TODAY = _NOW_MOROCCO.strftime("%Y-%m-%d")
NOW_ISO = datetime.now(timezone.utc).isoformat()

# ---------------------------------------------------------------------------
# City normalisation
# ---------------------------------------------------------------------------
CITY_NORMALIZATION: Dict[str, str] = {
    "rabat": "Rabat",
    "salé": "Salé",
    "sale": "Salé",
    "témara": "Témara",
    "temara": "Témara",
    "kénitra": "Kénitra",
    "kenitra": "Kénitra",
    "casablanca": "Casablanca",
    "fès": "Fès",
    "fes": "Fès",
    "tanger": "Tanger",
    "marrakech": "Marrakech",
    "agadir": "Agadir",
    "meknès": "Meknès",
    "meknes": "Meknès",
    "oujda": "Oujda",
    "tétouan": "Tétouan",
    "tetouan": "Tétouan",
    "safi": "Safi",
    "el jadida": "El Jadida",
    "mohammedia": "Mohammedia",
    "khouribga": "Khouribga",
    "beni mellal": "Béni Mellal",
    "nador": "Nador",
    "taza": "Taza",
    "settat": "Settat",
    "berrechid": "Berrechid",
    "khemisset": "Khémisset",
    "khémisset": "Khémisset",
    "larache": "Larache",
    "guelmim": "Guelmim",
    "errachidia": "Errachidia",
    "kenitra - mehdia": "Kénitra",
    "temara - tamesna (harhoura)": "Témara",
}


def normalize_city(raw: str) -> str:
    key = raw.strip().lower()
    return CITY_NORMALIZATION.get(key, raw.strip().title())


# ---------------------------------------------------------------------------
# Text helpers
# ---------------------------------------------------------------------------
def _clean(txt: str) -> str:
    return re.sub(r"\s+", " ", txt.strip())


def _strip_accents(s: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFD", s)
        if unicodedata.category(c) != "Mn"
    )


def _fix_039(text: str) -> str:
    return re.sub(r"\b([DdLl])\s*0?39\s+", lambda m: f"{m.group(1).lower()}'", text)


def _normalize_phone(raw: str) -> str:
    if not raw or raw.endswith("..."):
        return ""
    digits = re.sub(r"[^\d]", "", raw)
    if len(digits) < 9:
        return ""
    if digits.startswith("212") and len(digits) >= 11:
        return f"+{digits}"
    if not digits.startswith("0"):
        digits = "0" + digits
    return digits


_HOURS_RE = re.compile(r"\d{1,2}h")


def _canonical_duty(raw: str) -> str:
    txt = raw.lower()
    if "24" in txt:
        return "24h/24"
    m = re.search(r"(\d{1,2}h?\d{0,2}).*?(\d{1,2}h?\d{0,2})", txt)
    return f"{m.group(1)}-{m.group(2)}" if m else _clean(raw)


def _split_area_duty(text: str) -> Tuple[str, str]:
    text = _clean(text)
    m = re.match(r"(.+?)\s*\((.+?)\)", text)
    if m and _HOURS_RE.search(m.group(2)):
        return _clean(m.group(1)), _canonical_duty(m.group(2))
    parts = text.rsplit(" ", 1)
    if len(parts) == 2 and _HOURS_RE.search(parts[1]):
        return _clean(parts[0]), _canonical_duty(parts[1])
    return text, ""


# ---------------------------------------------------------------------------
# HTTP
# ---------------------------------------------------------------------------
def get_with_retry(url: str, max_retries: int = 3, timeout: int = 30) -> requests.Response:
    for attempt in range(max_retries):
        try:
            resp = requests.get(url, headers=HEADERS, timeout=timeout)
            resp.raise_for_status()
            return resp
        except requests.RequestException as exc:
            if attempt == max_retries - 1:
                raise
            wait = 2 ** attempt
            logger.warning("Attempt %d failed for %s: %s. Retry in %ds", attempt + 1, url, exc, wait)
            time.sleep(wait)
    raise RuntimeError("unreachable")


def safe_soup(url: str) -> BeautifulSoup:
    return BeautifulSoup(get_with_retry(url).text, "html.parser")


# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------
@dataclass
class Pharmacy:
    city: str
    area: str
    name: str
    address: str = ""
    phone: str = ""
    district: str = ""
    duty: str = ""
    source: str = ""
    source_site: str = ""
    date: str = ""

    def norm_key(self) -> Tuple[str, str]:
        """Key for dedup: (city_lower, name_stripped_lower)"""
        city_n = _strip_accents(self.city.lower().strip())
        name_n = _strip_accents(re.sub(r"pharmacie\s*(de\s*)?", "", self.name.lower().strip()))
        name_n = re.sub(r"[^a-z0-9]", "", name_n)
        return (city_n, name_n)


# ---------------------------------------------------------------------------
# Source 1: annuaire-gratuit.ma (national)
# ---------------------------------------------------------------------------
ANNUAIRE_BASE = "https://www.annuaire-gratuit.ma"
ANNUAIRE_MAIN = f"{ANNUAIRE_BASE}/pharmacie-garde-maroc.html"


def scrape_annuaire_gratuit() -> Tuple[List[Pharmacy], dict]:
    """Scrape all cities from annuaire-gratuit.ma."""
    source_name = "annuaire-gratuit.ma"
    results: List[Pharmacy] = []
    status = {"ok": True, "count": 0, "error": None}

    try:
        soup = safe_soup(ANNUAIRE_MAIN)
        city_links = [
            ANNUAIRE_BASE + a["href"]
            for a in soup.select("ul#agItemList li.ag_listing_item h3 > a")
        ]
        logger.info("[annuaire-gratuit] Found %d city pages", len(city_links))

        for city_url in city_links:
            try:
                records = _parse_annuaire_city(city_url, source_name)
                results.extend(records)
                logger.info("[annuaire-gratuit] %s -> %d pharmacies", city_url.split("-")[-1].split(".")[0], len(records))
            except Exception as exc:
                logger.warning("[annuaire-gratuit] Failed %s: %s", city_url, exc)
            time.sleep(REQUEST_DELAY)

    except Exception as exc:
        logger.error("[annuaire-gratuit] Fatal: %s", exc)
        status["ok"] = False
        status["error"] = str(exc)

    status["count"] = len(results)
    return results, status


def _extract_city_from_url(url: str) -> str:
    """Extract city name from annuaire-gratuit URL like pharmacie-garde-el-jadida.html"""
    # Remove base and extension: "pharmacie-garde-el-jadida.html" -> "pharmacie-garde-el-jadida"
    slug = url.rsplit("/", 1)[-1].replace(".html", "")
    # Remove "pharmacie-garde-" prefix
    slug = re.sub(r"^pharmacie-garde-", "", slug)
    # Replace hyphens with spaces, handle common multi-word cities
    return slug.replace("-", " ")


def _clean_address(address: str, name: str) -> str:
    """Strip pharmacy name prefix from address if present."""
    if not address:
        return ""
    # Remove "Pharmacie X, " prefix that annuaire-gratuit includes
    cleaned = re.sub(r"^Pharmacie\s+[^,]+,\s*", "", address, flags=re.I)
    # Also remove " - Autre ville" suffix
    cleaned = re.sub(r"\s*-\s*Autre ville\s*$", "", cleaned, flags=re.I)
    return _clean(cleaned)


def _parse_annuaire_city(city_url: str, source_name: str) -> List[Pharmacy]:
    soup = safe_soup(city_url)

    # Try to get city name from <h1> tag first (most reliable)
    h1 = soup.select_one("h1")
    if h1:
        h1_text = _clean(h1.get_text(" ", strip=True))
        # "Pharmacies de garde à El Jadida" -> "El Jadida"
        m = re.search(r"(?:garde\s+(?:à|a|de)\s+)(.+)", h1_text, re.I)
        city = normalize_city(m.group(1)) if m else normalize_city(_extract_city_from_url(city_url))
    else:
        city = normalize_city(_extract_city_from_url(city_url))

    records: List[Pharmacy] = []

    # Try structured quartier headings first
    for heading in soup.select('h2[title^="Quartier"]'):
        area = _clean(heading.get_text(" ", strip=True))
        listing = heading.find_next("ul", class_="agItemList")
        if not listing:
            continue
        for card in listing.select("li.ag_listing_item"):
            ph = _parse_annuaire_card(card, city, area, city_url, source_name)
            if ph:
                records.append(ph)
            time.sleep(DETAIL_DELAY)

    # Fallback: flat list without quartier headings
    if not records:
        for li in soup.select("ul#agItemList li.ag_listing_item"):
            name_tag = li.select_one("h3[itemprop=name]") or li.select_one("h3")
            name = _fix_039(_clean(name_tag.text)) if name_tag else ""
            area_tag = li.select_one("span[itemprop=addressLocality]")
            area = _clean(area_tag.text) if area_tag else city
            addr_tag = li.select_one("p[itemprop=streetAddress]")
            address = _clean_address(_clean(addr_tag.text) if addr_tag else "", name)
            phone_tag = li.select_one("span[title='Appelle-nous']")
            phone = _normalize_phone(phone_tag.text) if phone_tag else ""
            duty_tag = li.select_one(".garde-openingStatus") or li.select_one(".garde_status")
            duty = _clean(duty_tag.text) if duty_tag else ""

            if name:
                records.append(Pharmacy(
                    city=city, area=area, name=name, address=address,
                    phone=phone, district=area, duty=duty,
                    source=city_url, source_site=source_name, date=TODAY,
                ))

    return records


def _parse_annuaire_card(card, city: str, area: str, city_url: str, source_name: str) -> Pharmacy | None:
    link = card.select_one("a")
    if not link or "href" not in link.attrs:
        return None

    duty_el = card.select_one(".garde_status") or card.select_one(".garde-openingStatus")
    duty = _clean(duty_el.text) if duty_el else ""

    detail_path = link["href"]
    if not detail_path.startswith("http"):
        if not detail_path.startswith("/"):
            detail_path = "/" + detail_path
        detail_url = ANNUAIRE_BASE + detail_path
    else:
        detail_url = detail_path

    # Try detail page for richer data
    try:
        dsoup = safe_soup(detail_url)
        name_tag = dsoup.select_one('h1[itemprop="name"]') or dsoup.find("h1")
        name = _fix_039(_clean(name_tag.text)) if name_tag else ""
        addr_tag = dsoup.select_one('td[itemprop="streetAddress"]') or dsoup.select_one("span[itemprop=streetAddress]")
        address = _clean_address(_clean(addr_tag.text) if addr_tag else "", name)
        phone_tag = dsoup.select_one('a[itemprop="telephone"]') or dsoup.select_one("span[itemprop=telephone]")
        phone = _normalize_phone(phone_tag.text) if phone_tag else ""
    except Exception:
        h3 = link.select_one("h3")
        name = _fix_039(_clean(h3.text)) if h3 else _fix_039(_clean(link.text))
        address, phone = "", ""

    if not name:
        return None

    return Pharmacy(
        city=city, area=area, name=name, address=address,
        phone=phone, district=area, duty=duty,
        source=detail_url, source_site=source_name, date=TODAY,
    )


# ---------------------------------------------------------------------------
# Source 2: guidepharmacies.ma (Rabat, Salé, Kénitra, Témara)
# ---------------------------------------------------------------------------
GUIDE_SOURCES = {
    "Rabat": "https://www.guidepharmacies.ma/pharmacies-de-garde/rabat.html",
    "Salé": "https://www.guidepharmacies.ma/pharmacies-de-garde/sale.html",
    "Kénitra": "https://www.guidepharmacies.ma/pharmacies-de-garde/kenitra-mehdia.html",
    "Témara": "https://www.guidepharmacies.ma/pharmacies-de-garde/temara.html",
}


def scrape_guidepharmacies() -> Tuple[List[Pharmacy], dict]:
    source_name = "guidepharmacies.ma"
    results: List[Pharmacy] = []
    status = {"ok": True, "count": 0, "error": None}

    for city, url in GUIDE_SOURCES.items():
        try:
            records = _parse_guide_table(url, city, source_name)
            results.extend(records)
            logger.info("[guidepharmacies] %s -> %d pharmacies", city, len(records))
        except Exception as exc:
            logger.warning("[guidepharmacies] Failed %s: %s", city, exc)
        time.sleep(REQUEST_DELAY)

    if not results:
        status["ok"] = False
        status["error"] = "No records from any city"

    status["count"] = len(results)
    return results, status


def _parse_guide_table(url: str, city: str, source_name: str) -> List[Pharmacy]:
    """Parse guidepharmacies.ma weekly table, extracting only TODAY's entries."""
    records: List[Pharmacy] = []
    seen: set = set()
    soup = safe_soup(url)

    # Remove nav to avoid noise
    nav = soup.select_one("nav.sp-megamenu-wrapper")
    if nav:
        nav.decompose()

    # The page shows a weekly schedule.  Day headers live in td.tableh2
    # (e.g. "lundi  23 février  2026") and pharmacy entries in td.tableb.
    # We walk through both in document order and only keep today's section.
    day_num = str(_NOW_MOROCCO.day)          # "23" (no leading zero)
    year_str = str(_NOW_MOROCCO.year)         # "2026"
    in_today = False

    for td in soup.select("td.tableh2, td.tableb"):
        classes = td.get("class", [])

        if "tableh2" in classes:
            header = td.get_text(" ", strip=True)
            # Match e.g. "lundi  23 février  2026"
            in_today = (
                re.search(rf"\b{day_num}\b", header) is not None
                and year_str in header
            )
            continue

        if not in_today or "tableb" not in classes:
            continue

        loc = td.find("p", class_="location-name")
        if not loc:
            continue
        area, duty = _split_area_duty(loc.get_text(" ", strip=True))

        a = td.select_one("h4 a")
        if not a:
            continue
        raw = _clean(a.get_text(" ", strip=True))
        name, phone_raw = (raw.split(" - ", 1) + [""])[:2]
        phone = _normalize_phone(phone_raw)

        # Some cities (Kénitra, Mehdia) only have "Pharmacie" in h4 a
        # with no actual name.  Fall back to the area/quartier.
        name_stripped = re.sub(r"(?i)^pharmacie\s*(de\s*)?", "", name).strip()
        if not name_stripped and area:
            name = f"Pharmacie {area}"

        key = (city.lower(), re.sub(r"[^a-z0-9]", "", _strip_accents(name.lower())))
        if key in seen:
            continue
        seen.add(key)

        records.append(Pharmacy(
            city=normalize_city(city), area=area, name=name.title(),
            address="", phone=phone, district=area, duty=duty or "24h/24",
            source=url, source_site=source_name, date=TODAY,
        ))

    return records


# ---------------------------------------------------------------------------
# Source 3: infopoint.ma (Tanger, Casablanca)
# ---------------------------------------------------------------------------
INFOPOINT_URL = "https://infopoint.ma/pharmacies-de-garde"


def scrape_infopoint() -> Tuple[List[Pharmacy], dict]:
    source_name = "infopoint.ma"
    results: List[Pharmacy] = []
    status = {"ok": True, "count": 0, "error": None}

    try:
        soup = safe_soup(INFOPOINT_URL)
        for card in soup.select("div.item-grid.arabe_pharm"):
            addr_tag = card.select_one("p.adress-item:not(.adress_arabe)")
            # Use title attr for clean address, full text for city detection
            address = _clean(addr_tag["title"]) if addr_tag and addr_tag.get("title") else ""
            full_text = _clean(addr_tag.get_text(" ", strip=True)) if addr_tag else ""

            # Determine city from full <p> text (contains "90000 TANGER - Maroc")
            full_upper = full_text.upper()
            if "TANGER" in full_upper:
                city = "Tanger"
            elif "CASABLANCA" in full_upper or "CASA" in full_upper:
                city = "Casablanca"
            else:
                city = "Tanger"  # default — infopoint is Tanger-based

            h3 = card.select_one("h3")
            name = _clean(h3.text) if h3 else ""
            phone_tag = card.select_one("p.phone-item")
            phone = _normalize_phone(phone_tag.get_text(strip=True)) if phone_tag else ""

            # Extract quartier from LAST segment of address (after last comma)
            # "73, Avenue Haroun Errachid, Colonia" -> "Colonia"
            # "Avenue Moulay Rachid, Résidence Golden Beach" -> "Résidence Golden Beach"
            if "," in address:
                area = _clean(address.rsplit(",", 1)[-1])
                # If last segment is just a number or too short, try second-to-last
                if len(area) <= 3 or area.isdigit():
                    parts = [_clean(p) for p in address.split(",")]
                    area = next((p for p in reversed(parts) if len(p) > 3 and not p.isdigit()), city)
            else:
                area = city

            if name:
                results.append(Pharmacy(
                    city=city, area=area, name=name.title(),
                    address=address, phone=phone, district=area,
                    duty="20h00-09h00", source=INFOPOINT_URL,
                    source_site=source_name, date=TODAY,
                ))

        logger.info("[infopoint] %d pharmacies found", len(results))

    except Exception as exc:
        logger.error("[infopoint] Fatal: %s", exc)
        status["ok"] = False
        status["error"] = str(exc)

    status["count"] = len(results)
    return results, status


# ---------------------------------------------------------------------------
# Source 4: med.ma (Marrakech)
# ---------------------------------------------------------------------------
MEDMA_BASE = "https://www.med.ma/pharmacie/garde-nuit/marrakech"


def scrape_medma() -> Tuple[List[Pharmacy], dict]:
    source_name = "med.ma"
    results: List[Pharmacy] = []
    seen: set = set()
    status = {"ok": True, "count": 0, "error": None}

    try:
        for i in range(5):
            page_url = f"{MEDMA_BASE}/{i}"
            try:
                soup = safe_soup(page_url)
            except requests.RequestException:
                logger.warning("[med.ma] Stopping at page %d", i)
                break

            for block in soup.select("div.card-doctor-block"):
                name_tag = block.select_one(".list__label–name")
                if not name_tag:
                    continue
                name = _clean(name_tag.text)

                adr_all = block.select(".list__label–adr")
                address = _clean(adr_all[0].text) if adr_all else ""
                duty = _canonical_duty(_clean(adr_all[-1].text).replace("Garde de", "")) if adr_all else "24h/24"

                phone_tag = block.select_one("a.calltel")
                phone = _normalize_phone(phone_tag.text) if phone_tag else ""

                key = ("marrakech", re.sub(r"[^a-z0-9]", "", _strip_accents(name.lower())))
                if key in seen:
                    continue
                seen.add(key)

                results.append(Pharmacy(
                    city="Marrakech", area="Marrakech", name=name.title(),
                    address=address, phone=phone, district="Marrakech",
                    duty=duty, source=page_url, source_site=source_name, date=TODAY,
                ))
            time.sleep(REQUEST_DELAY)

        logger.info("[med.ma] %d pharmacies found", len(results))

    except Exception as exc:
        logger.error("[med.ma] Fatal: %s", exc)
        status["ok"] = False
        status["error"] = str(exc)

    status["count"] = len(results)
    return results, status


# ---------------------------------------------------------------------------
# Merge & cross-validate
# ---------------------------------------------------------------------------
def merge_and_validate(source_lists: List[Tuple[str, List[Pharmacy]]]) -> List[Pharmacy]:
    """Merge pharmacies from multiple sources, deduplicate, and mark confidence.

    Source priority: for cities where guidepharmacies.ma has data, its entries
    replace other sources (guidepharmacies tracks the real daily duty rotation).
    """

    # Detect which cities guidepharmacies.ma actually returned data for
    guide_cities: set = set()
    for source_name, pharmacies in source_lists:
        if source_name == "guidepharmacies.ma":
            for ph in pharmacies:
                guide_cities.add(_strip_accents(ph.city.lower().strip()))
    if guide_cities:
        logger.info("guidepharmacies.ma covers cities: %s — using as primary source",
                     ", ".join(sorted(guide_cities)))

    # Index all pharmacies by normalized key
    by_key: Dict[Tuple[str, str], List[Pharmacy]] = {}
    for source_name, pharmacies in source_lists:
        for ph in pharmacies:
            city_norm = _strip_accents(ph.city.lower().strip())
            # For cities guidepharmacies covers, skip other sources
            if city_norm in guide_cities and source_name != "guidepharmacies.ma":
                continue
            key = ph.norm_key()
            by_key.setdefault(key, []).append(ph)

    merged: List[Pharmacy] = []
    for key, dupes in by_key.items():
        # Pick the most complete record (most non-empty fields)
        best = max(dupes, key=lambda p: sum([
            bool(p.address), bool(p.phone), bool(p.area),
            bool(p.duty), len(p.address),
        ]))

        # Fill in missing fields from other records
        for other in dupes:
            if not best.address and other.address:
                best.address = other.address
            if not best.phone and other.phone:
                best.phone = other.phone
            if not best.duty and other.duty:
                best.duty = other.duty

        merged.append(best)

    # Sort by city then name
    merged.sort(key=lambda p: (p.city, p.name))

    logger.info("Merged: %d unique pharmacies from %d total records",
                len(merged), sum(len(phs) for _, phs in source_lists))
    return merged


def count_sources_per_pharmacy(source_lists: List[Tuple[str, List[Pharmacy]]]) -> Dict[Tuple[str, str], int]:
    """Count how many distinct sources confirm each pharmacy."""
    sources_by_key: Dict[Tuple[str, str], set] = {}
    for source_name, pharmacies in source_lists:
        for ph in pharmacies:
            key = ph.norm_key()
            sources_by_key.setdefault(key, set()).add(source_name)
    return {k: len(v) for k, v in sources_by_key.items()}


# ---------------------------------------------------------------------------
# Output
# ---------------------------------------------------------------------------
def write_output(
    pharmacies: List[Pharmacy],
    sources_count: Dict[Tuple[str, str], int],
    source_statuses: Dict[str, dict],
) -> None:
    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)

    # Build enriched records
    records = []
    for ph in pharmacies:
        rec = {
            "city": ph.city,
            "area": ph.area,
            "name": ph.name,
            "address": ph.address,
            "phone": ph.phone,
            "district": ph.district or ph.area,
            "duty": ph.duty,
            "source": ph.source,
            "sources_count": sources_count.get(ph.norm_key(), 1),
            "date": ph.date,
            "scraped_at": NOW_ISO,
        }
        records.append(rec)

    with OUTPUT_JSON.open("w", encoding="utf-8") as fh:
        json.dump(records, fh, ensure_ascii=False, indent=2)
    logger.info("Wrote %d pharmacies to %s", len(records), OUTPUT_JSON)

    # Load previous metadata for delta comparison
    previous_total = 0
    if OUTPUT_META.exists():
        try:
            prev = json.loads(OUTPUT_META.read_text(encoding="utf-8"))
            previous_total = prev.get("total_pharmacies", 0)
        except Exception:
            pass

    # Count cities
    cities = sorted(set(ph.city for ph in pharmacies))

    meta = {
        "scraped_at": NOW_ISO,
        "total_pharmacies": len(records),
        "cities_count": len(cities),
        "cities": cities,
        "sources_used": list(source_statuses.keys()),
        "sources_status": source_statuses,
        "previous_total": previous_total,
        "delta": len(records) - previous_total if previous_total else None,
    }

    with OUTPUT_META.open("w", encoding="utf-8") as fh:
        json.dump(meta, fh, ensure_ascii=False, indent=2)
    logger.info("Wrote metadata to %s", OUTPUT_META)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main() -> None:
    logger.info("Starting multi-source pharmacy scraper")

    scrapers = {
        "annuaire-gratuit.ma": scrape_annuaire_gratuit,
        "guidepharmacies.ma": scrape_guidepharmacies,
        "infopoint.ma": scrape_infopoint,
        "med.ma": scrape_medma,
    }

    source_lists: List[Tuple[str, List[Pharmacy]]] = []
    source_statuses: Dict[str, dict] = {}

    # Run scrapers in parallel (each source is independent)
    with ThreadPoolExecutor(max_workers=4) as pool:
        futures = {
            pool.submit(fn): name
            for name, fn in scrapers.items()
        }

        for future in as_completed(futures):
            name = futures[future]
            try:
                pharmacies, status = future.result()
                source_lists.append((name, pharmacies))
                source_statuses[name] = status
                logger.info("Source %s: %d pharmacies (ok=%s)",
                            name, status["count"], status["ok"])
            except Exception as exc:
                logger.error("Source %s crashed: %s", name, exc)
                source_statuses[name] = {"ok": False, "count": 0, "error": str(exc)}

    # Merge and cross-validate
    merged = merge_and_validate(source_lists)
    sources_per_ph = count_sources_per_pharmacy(source_lists)

    # Write output
    write_output(merged, sources_per_ph, source_statuses)

    # Summary
    total = len(merged)
    multi_source = sum(1 for v in sources_per_ph.values() if v >= 2)
    logger.info("DONE: %d pharmacies total, %d confirmed by 2+ sources", total, multi_source)

    # Check for significant drop (for CI alerting)
    if OUTPUT_META.exists():
        meta = json.loads(OUTPUT_META.read_text(encoding="utf-8"))
        prev = meta.get("previous_total", 0)
        if prev and total < prev * 0.7:
            logger.warning("ALERT: pharmacy count dropped >30%% (%d -> %d)", prev, total)
            sys.exit(2)  # Exit code 2 = significant drop, used by CI

    # Exit code 1 if zero results
    if total == 0:
        logger.error("ALERT: zero pharmacies scraped!")
        sys.exit(1)


if __name__ == "__main__":
    main()
