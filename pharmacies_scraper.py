from __future__ import annotations

import json
import logging
import re
import time
import urllib.parse
from dataclasses import dataclass
from datetime import datetime
from typing import List, Dict, Callable, Tuple

import requests
from bs4 import BeautifulSoup

# --------------------------------------------------------------------
# logging
# --------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("pharmacies_scraper")

# --------------------------------------------------------------------
# small helpers
# --------------------------------------------------------------------
def today_iso() -> str:
    return datetime.now().strftime("%Y-%m-%d")


def _clean(txt: str) -> str:
    """Collapse whitespace & trim."""
    return re.sub(r"\s+", " ", txt.strip())


def _canonical_duty(raw: str) -> str:
    txt = raw.lower()
    if "24" in txt:
        return "24h/24"
    m = re.search(r"(\d{1,2}h?\d{0,2}).*?(\d{1,2}h?\d{0,2})", txt)
    return f"{m.group(1)}-{m.group(2)}" if m else _clean(raw)


def _normalize_phone(raw: str) -> str:
    if raw.endswith("..."):
        return ""  # masked – unusable
    digits = re.sub(r"[^\d]", "", raw)
    if len(digits) < 9:                       # too short => drop
        return ""
    if digits.startswith("212") and len(digits) >= 11:
        return f"+{digits}"
    if not digits.startswith("0"):
        digits = "0" + digits
    return digits


def _dedup_key(area: str, name: str, phone: str) -> Tuple[str, str, str]:
    return (_clean(area).lower(), _clean(name).lower(), _normalize_phone(phone))


# --------------------------------------------------------------------
# HTTP helper with retry + backoff
# --------------------------------------------------------------------
HEADERS = {
    "User-Agent": "PharmaDW-Scraper/1.0 (+https://github.com/MokokAf/PharmaDW)",
    "Accept-Language": "fr,ar;q=0.8,en;q=0.7",
}

REQUEST_DELAY = 0.5   # seconds between page fetches
DETAIL_DELAY = 0.3    # seconds between detail-page fetches


def get_with_retry(url: str, max_retries: int = 3, timeout: int = 30) -> requests.Response:
    """GET with exponential backoff retry."""
    for attempt in range(max_retries):
        try:
            resp = requests.get(url, headers=HEADERS, timeout=timeout)
            resp.raise_for_status()
            return resp
        except requests.RequestException as exc:
            if attempt == max_retries - 1:
                raise
            wait = 2 ** attempt
            logger.warning("Attempt %d failed for %s: %s. Retrying in %ds...", attempt + 1, url, exc, wait)
            time.sleep(wait)
    raise RuntimeError("unreachable")


Parser = Callable[[str], List["PharmacyRecord"]]


# --------------------------------------------------------------------
# data class
# --------------------------------------------------------------------
@dataclass
class PharmacyRecord:
    city: str
    area: str
    name: str
    address: str
    phone: str
    district: str
    duty: str
    source: str
    date: str

    def to_dict(self) -> Dict[str, str]:
        return {
            "city": self.city,
            "area": self.area,
            "name": self.name,
            "address": self.address,
            "phone": self.phone,
            "district": self.district,
            "duty": self.duty,
            "source": self.source,
            "date": self.date,
        }


# --------------------------------------------------------------------
# generic table parser (GuidePharmacies)
# --------------------------------------------------------------------
_HOURS_RE = re.compile(r"\d{1,2}h")


def _split_area_duty(text: str) -> tuple[str, str]:
    """Return (area, duty) with duty canonicalised, never empty."""
    text = _clean(text)
    # Case 1 : "Area (9h à 00h00)"
    m = re.match(r"(.+?)\s*\((.+?)\)", text)
    if m and _HOURS_RE.search(m.group(2)):
        return _clean(m.group(1)), _canonical_duty(m.group(2))
    # Case 2 : area followed by hours outside parens
    parts = text.rsplit(" ", 1)
    if len(parts) == 2 and _HOURS_RE.search(parts[1]):
        return _clean(parts[0]), _canonical_duty(parts[1])
    # Fallback
    return text, "24h/24"


def _parse_generic_table(url: str, city: str) -> List[PharmacyRecord]:
    records: List[PharmacyRecord] = []
    seen: set[Tuple[str, str, str]] = set()

    soup = BeautifulSoup(get_with_retry(url).text, "html.parser")
    for td in soup.select("td.tableb"):
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

        key = _dedup_key(area, name, phone)
        if key in seen:
            continue
        seen.add(key)

        records.append(
            PharmacyRecord(
                city=city,
                area=area,
                name=name.title(),
                address="",
                phone=phone,
                district=area,
                duty=duty,
                source=url,
                date=today_iso(),
            )
        )
    return records


def parse_kenitra_mehdia(url: str) -> List[PharmacyRecord]:
    return _parse_generic_table(url, "Kenitra - Mehdia")


def parse_temara(url: str) -> List[PharmacyRecord]:
    return _parse_generic_table(url, "Temara - Tamesna (Harhoura)")


# --------------------------------------------------------------------
# Rabat & Salé (slightly custom)
# --------------------------------------------------------------------
def parse_rabat(url: str) -> List[PharmacyRecord]:
    records, seen = [], set()

    soup = BeautifulSoup(get_with_retry(url).text, "html.parser")
    soup.select_one("nav.sp-megamenu-wrapper") and soup.select_one(
        "nav.sp-megamenu-wrapper"
    ).decompose()

    for td in soup.select("td.tableb"):
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

        # attempt to scrape address on detail page
        address = ""
        href = urllib.parse.urljoin(url, a["href"])
        try:
            time.sleep(DETAIL_DELAY)
            s2 = BeautifulSoup(get_with_retry(href, timeout=20).text, "html.parser")
            tag = s2.find(string=re.compile(r"\d+\s+(Rue|Av|Avenue|Bd)", re.I))
            if tag:
                address = _clean(tag)
        except Exception:
            logger.debug("Could not fetch detail page %s", href)

        key = _dedup_key(area, name, phone)
        if key in seen:
            continue
        seen.add(key)

        records.append(
            PharmacyRecord(
                city="Rabat",
                area=area,
                name=name.title(),
                address=address,
                phone=phone,
                district=area,
                duty=duty,
                source=url,
                date=today_iso(),
            )
        )
    return records


def parse_sale(url: str) -> List[PharmacyRecord]:
    # Uses same HTML layout as Rabat, but no sub-page addresses
    return _parse_generic_table(url, "Salé")


# --------------------------------------------------------------------
# Tanger / Casablanca (infopoint.ma)
# --------------------------------------------------------------------
def _parse_infopoint(url: str, city: str) -> List[PharmacyRecord]:
    records, seen = [], set()
    html = get_with_retry(url).text
    soup = BeautifulSoup(html, "html.parser")

    for card in soup.select("div.item-grid.arabe_pharm"):
        addr_tag = card.select_one("p.adress-item")
        address = _clean(addr_tag["title"]) if addr_tag else ""
        if city == "Casablanca" and "TANGER" in address.upper():
            continue  # skip Tanger rows when parsing Casablanca list

        name = _clean(card.select_one("h3").text)
        phone = _normalize_phone(card.select_one("p.phone-item").get_text(strip=True))
        area = address.split(",")[0] if "," in address else address.split()[0]
        duty = "20h00-09h00"

        key = _dedup_key(area, name, phone)
        if key in seen:
            continue
        seen.add(key)

        records.append(
            PharmacyRecord(
                city=city,
                area=area,
                name=name.title(),
                address=address,
                phone=phone,
                district=area,
                duty=duty,
                source=url,
                date=today_iso(),
            )
        )
    return records


def parse_tanger(url: str) -> List[PharmacyRecord]:
    return _parse_infopoint(url, "Tanger")


def parse_casablanca(url: str) -> List[PharmacyRecord]:
    return _parse_infopoint(url, "Casablanca")


# --------------------------------------------------------------------
# Marrakech (med.ma)
# --------------------------------------------------------------------
def parse_marrakech(url: str) -> List[PharmacyRecord]:
    records, seen = [], set()
    base = url.rstrip("/0")

    for i in range(5):  # first five pages more than cover the week
        page = f"{base}/{i}"
        try:
            resp = get_with_retry(page)
        except requests.RequestException:
            logger.warning("Stopping Marrakech pagination at page %d", i)
            break
        soup = BeautifulSoup(resp.text, "html.parser")

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

            key = _dedup_key("Marrakech", name, phone)
            if key in seen:
                continue
            seen.add(key)

            records.append(
                PharmacyRecord(
                    city="Marrakech",
                    area="Marrakech",
                    name=name.title(),
                    address=address,
                    phone=phone,
                    district="Marrakech",
                    duty=duty,
                    source=page,
                    date=today_iso(),
                )
            )
        time.sleep(REQUEST_DELAY)
    return records


# --------------------------------------------------------------------
# Fès (annuaire-gratuit.ma)
# --------------------------------------------------------------------
def parse_fes(url: str) -> List[PharmacyRecord]:
    records, seen = [], set()
    soup = BeautifulSoup(get_with_retry(url).text, "html.parser")

    for li in soup.select("ul#agItemList li.ag_listing_item"):
        name_tag = li.select_one("h3[itemprop=name]")
        if not name_tag:
            continue
        name = _clean(name_tag.text)

        address = _clean(li.select_one("p[itemprop=streetAddress]").text) if li.select_one(
            "p[itemprop=streetAddress]"
        ) else ""

        phone = _normalize_phone(li.select_one("span[title='Appelle-nous']").text)

        district = _clean(li.select_one("span[itemprop=addressLocality]").text) if li.select_one(
            "span[itemprop=addressLocality]"
        ) else ""

        duty_raw = li.select_one("span.garde-openingStatus").text if li.select_one(
            "span.garde-openingStatus"
        ) else "24h/24"
        duty = _canonical_duty(duty_raw)

        key = _dedup_key(district, name, phone)
        if key in seen:
            continue
        seen.add(key)

        records.append(
            PharmacyRecord(
                city="Fès",
                area=district,
                name=name.title(),
                address=address,
                phone=phone,
                district=district,
                duty=duty,
                source=url,
                date=today_iso(),
            )
        )
    return records


# --------------------------------------------------------------------
# main
# --------------------------------------------------------------------
def main() -> None:
    sources: Dict[str, Tuple[Parser, str]] = {
        "Rabat": (
            parse_rabat,
            "https://www.guidepharmacies.ma/pharmacies-de-garde/rabat.html",
        ),
        "Salé": (
            parse_sale,
            "https://www.guidepharmacies.ma/pharmacies-de-garde/sale.html",
        ),
        "Tanger": (parse_tanger, "https://infopoint.ma/pharmacies-de-garde"),
        "Casablanca": (
            parse_casablanca,
            "https://infopoint.ma/pharmacies-de-garde/",
        ),
        "Marrakech": (
            parse_marrakech,
            "https://www.med.ma/pharmacie/garde-nuit/marrakech/0",
        ),
        "Kenitra - Mehdia": (
            parse_kenitra_mehdia,
            "https://www.guidepharmacies.ma/pharmacies-de-garde/kenitra-mehdia.html",
        ),
        "Temara - Tamesna (Harhoura)": (
            parse_temara,
            "https://www.guidepharmacies.ma/pharmacies-de-garde/temara.html",
        ),
        "Fès": (
            parse_fes,
            "https://www.annuaire-gratuit.ma/pharmacie-garde-fes.html",
        ),
    }

    all_records: List[PharmacyRecord] = []
    errors: List[str] = []

    for city, (parser, url) in sources.items():
        logger.info("Scraping %s ...", city)
        try:
            records = parser(url)
            all_records.extend(records)
            logger.info("  -> %d pharmacies found", len(records))
        except Exception as exc:
            logger.error("Failed to scrape %s: %s", city, exc)
            errors.append(city)
        time.sleep(REQUEST_DELAY)

    with open("pharmacies.json", "w", encoding="utf-8") as fh:
        json.dump([rec.to_dict() for rec in all_records], fh, ensure_ascii=False, indent=2)

    logger.info("Done: %d pharmacies total, %d errors", len(all_records), len(errors))
    if errors:
        logger.warning("Failed cities: %s", ", ".join(errors))


if __name__ == "__main__":
    main()
