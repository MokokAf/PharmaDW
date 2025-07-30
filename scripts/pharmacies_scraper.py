import requests
from bs4 import BeautifulSoup
import json
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

BASE_URL = "https://www.annuaire-gratuit.ma"
MAIN_URL = f"{BASE_URL}/pharmacie-garde-maroc.html"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/125.0.0.0 Safari/537.36"
    )
}

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
# Utility functions
# ---------------------------------------------------------------------------

def get_soup(url: str) -> BeautifulSoup:
    """Fetch a URL and parse it into BeautifulSoup."""
    r = requests.get(url, headers=HEADERS, timeout=30)
    r.raise_for_status()
    return BeautifulSoup(r.content, "html.parser")


def fetch_city_links() -> list[str]:
    """Return absolute URLs for all city pages listed on the main page."""
    soup = get_soup(MAIN_URL)
    return [
        BASE_URL + a["href"]
        for a in soup.select("ul#agItemList li.ag_listing_item h3 > a")
    ]


def _fix_039_apostrophe(text: str) -> str:
    """Convert patterns like "D 039 Agdal" → "d'Agdal"   "L 039 Ocean" → "l'Ocean"""
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

    # Each neighbourhood is in an <h2> (title starts with "Quartier …")
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

            # Fetch detail page – make best effort; fall back to card text on failure
            try:
                d_name, d_address, d_phone = parse_pharmacy_detail(detail_url)
            except Exception:
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
            time.sleep(0.2)

        # Fallback: pages without "Quartier" headings – iterate over main list
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

    city_links = fetch_city_links()
    print(f"Found {len(city_links)} city pages to scrape …")

    for link in city_links:
        print(f"Scraping {link}")
        try:
            all_records.extend(parse_city(link))
        except Exception as exc:
            print(f"⚠️  Failed to scrape {link}: {exc}")

    # Write JSON (ensure directory exists)
    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)

    with OUTPUT_JSON.open("w", encoding="utf-8") as fp:
        json.dump(all_records, fp, ensure_ascii=False, indent=2)

    print(f"✅ Scraped {len(all_records)} pharmacies → {OUTPUT_JSON.relative_to(Path.cwd())}")


if __name__ == "__main__":
    main()
