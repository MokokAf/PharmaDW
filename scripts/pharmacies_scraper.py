import requests
from bs4 import BeautifulSoup
import json
import logging
import re
import datetime
import time
from pathlib import Path

"""Simple scraper that extracts duty-pharmacy data from annuaire-gratuit.ma
and writes the canonical JSON used by the Next.js front-end.

Usage
-----
$ python scripts/pharmacies_scraper.py
This will (over)write `public/data/pharmacies.json`.

The scraper is intentionally kept small and dependency-light so that it can
run quickly inside a GitHub Action on a nightly schedule.
"""

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
BASE_URL = "https://www.annuaire-gratuit.ma"
MAIN_URL = f"{BASE_URL}/pharmacie-garde-maroc.html"
HEADERS = {
    "User-Agent": "PharmaDW-Scraper/1.0 (+https://github.com/MokokAf/PharmaDW)",
}

REQUEST_DELAY = 1.0   # seconds between city pages
DETAIL_DELAY = 0.3    # seconds between detail-page fetches

# ---------------------------------------------------------------------------
# City normalisation helpers
# ---------------------------------------------------------------------------

CITY_NORMALIZATION = {
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
}

OUTPUT_JSON = Path(__file__).resolve().parents[1] / "public" / "data" / "pharmacies.json"
TODAY = datetime.date.today().isoformat()

# ---------------------------------------------------------------------------
# HTTP helper with retry + backoff
# ---------------------------------------------------------------------------

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


def get_soup(url: str) -> BeautifulSoup:
    """Fetch a URL and parse it into BeautifulSoup."""
    resp = get_with_retry(url)
    return BeautifulSoup(resp.content, "html.parser")


# ---------------------------------------------------------------------------
# Utility functions
# ---------------------------------------------------------------------------

def fetch_city_links() -> list[str]:
    """Return absolute URLs for all city pages listed on the main page."""
    soup = get_soup(MAIN_URL)
    return [
        BASE_URL + a["href"]
        for a in soup.select("ul#agItemList li.ag_listing_item h3 > a")
    ]


def _fix_039_apostrophe(text: str) -> str:
    """Convert patterns like "D 039 Agdal" -> "d'Agdal"   "L 039 Ocean" -> "l'Ocean"""
    return re.sub(r"\b([DdLl])\s*0?39\s+", lambda m: f"{m.group(1).lower()}\'", text)


def safe_text(sel, strip: bool = True) -> str:
    return sel.get_text(" ", strip=strip) if sel else ""


def parse_pharmacy_detail(url: str) -> tuple[str, str, str]:
    """Return (name, address, phone) from a pharmacy detail page."""
    soup = get_soup(url)
    name_tag = soup.select_one('h1[itemprop="name"]') or soup.find("h1")
    name = _fix_039_apostrophe(safe_text(name_tag))

    addr_tag = soup.select_one('td[itemprop="streetAddress"]') or soup.select_one("span[itemprop=streetAddress]")
    address = safe_text(addr_tag)

    phone_tag = soup.select_one('a[itemprop="telephone"]') or soup.select_one("span[itemprop=telephone]")
    phone = safe_text(phone_tag).replace(" ", "")

    return name, address, phone


def parse_city(city_url: str) -> list[dict]:
    """Parse a single city page and return list of pharmacy records."""
    soup = get_soup(city_url)

    # Derive city slug from URL and normalise it
    city_slug = city_url.rsplit("-", 1)[1].split(".")[0].lower()
    city = CITY_NORMALIZATION.get(city_slug, city_slug.capitalize())

    records: list[dict] = []

    # Each neighbourhood is in an <h2> (title starts with "Quartier ...")
    for heading in soup.select('h2[title^="Quartier"]'):
        area = safe_text(heading)
        if not area:
            continue

        # The associated <ul class="agItemList"> contains pharmacies
        listing = heading.find_next("ul", class_="agItemList")
        if not listing:
            continue

        for card in listing.select("li.ag_listing_item"):
            link = card.select_one("a")
            if not link or "href" not in link.attrs:
                continue

            # Duty info (e.g. "Garde ouverte")
            duty_el = card.select_one(".garde_status") or card.select_one(".garde-openingStatus")
            duty = safe_text(duty_el)

            detail_path = link["href"]
            if not detail_path.startswith("http"):
                # Ensure absolute URL
                if not detail_path.startswith("/"):
                    detail_path = "/" + detail_path
                detail_url = BASE_URL + detail_path
            else:
                detail_url = detail_path

            # Fetch detail page -- make best effort; fall back to card text on failure
            try:
                d_name, d_address, d_phone = parse_pharmacy_detail(detail_url)
            except Exception as exc:
                logger.debug("Detail page failed for %s: %s", detail_url, exc)
                d_name = _fix_039_apostrophe(safe_text(link.select_one("h3")) or safe_text(link))
                d_address, d_phone = "", ""

            record = {
                "city": city,
                "area": area,
                "name": d_name,
                "address": d_address,
                "phone": d_phone,
                "district": area,  # default: district = area
                "duty": duty,
                "source": detail_url,
                "date": TODAY,
            }
            records.append(record)

            # Respect polite delay between requests
            time.sleep(DETAIL_DELAY)

        # Fallback: pages without "Quartier" headings -- iterate over main list
    if not records:
        for li in soup.select("ul#agItemList li.ag_listing_item"):
            name = _fix_039_apostrophe(safe_text(li.select_one("h3[itemprop=name]")) or safe_text(li.select_one("h3")))
            area_li = safe_text(li.select_one("span[itemprop=addressLocality]")) or city
            address = safe_text(li.select_one("p[itemprop=streetAddress]"))
            phone = safe_text(li.select_one("span[title='Appelle-nous']")).replace(" ", "")
            duty_li = safe_text(li.select_one(".garde-openingStatus") or li.select_one(".garde_status"))
            records.append({
                "city": city,
                "area": area_li,
                "name": name,
                "address": address,
                "phone": phone,
                "district": area_li,
                "duty": duty_li,
                "source": city_url,
                "date": TODAY,
            })

    return records


# ---------------------------------------------------------------------------
# Entry-point
# ---------------------------------------------------------------------------

def main() -> None:
    all_records: list[dict] = []
    errors: list[str] = []

    city_links = fetch_city_links()
    logger.info("Found %d city pages to scrape", len(city_links))

    for link in city_links:
        logger.info("Scraping %s", link)
        try:
            records = parse_city(link)
            all_records.extend(records)
            logger.info("  -> %d pharmacies found", len(records))
        except Exception as exc:
            logger.error("Failed to scrape %s: %s", link, exc)
            errors.append(link)
        time.sleep(REQUEST_DELAY)

    # Write JSON (ensure directory exists)
    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)

    with OUTPUT_JSON.open("w", encoding="utf-8") as fp:
        json.dump(all_records, fp, ensure_ascii=False, indent=2)

    logger.info("Done: %d pharmacies scraped -> %s", len(all_records), OUTPUT_JSON.relative_to(Path.cwd()))
    if errors:
        logger.warning("%d failed sources: %s", len(errors), ", ".join(errors))


if __name__ == "__main__":
    main()
