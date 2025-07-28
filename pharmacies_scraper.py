from __future__ import annotations

import json
import re
from dataclasses import dataclass, asdict
from datetime import date
from typing import List, Dict, Optional

import requests
from bs4 import BeautifulSoup


@dataclass
class PharmacyRecord:
    """Represents a single on‑duty pharmacy entry."""

    city: str
    area: Optional[str]
    name: str
    address: str
    phone: str
    district: Optional[str]
    duty: str
    source: str
    date: str

    def to_dict(self) -> Dict[str, str]:
        return asdict(self)


HEADERS: Dict[str, str] = {
    # A realistic user agent string helps many servers accept HTTP
    # requests from automated clients.
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/115.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "fr,ar;q=0.8,en;q=0.7",
}


def parse_nmra1(url: str, city: str) -> List[PharmacyRecord]:
    """Parse a Nmra1 article and return a list of pharmacy records.

    Args:
        url: Full URL of the Nmra1 article.
        city: Name of the city being scraped.

    Returns:
        A list of PharmacyRecord objects extracted from the article.
    """
    records: List[PharmacyRecord] = []
    resp = requests.get(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    # Find the main content area.  Nmra1 uses the class 'entry-content'.
    content = soup.find("div", class_="entry-content")
    if content is None:
        # Fall back to the first article element
        content = soup.find("article")
    if content is None:
        return records  # nothing to parse

    current_area: Optional[str] = None

    # Iterate through the direct children of the content.  This
    # preserves the order of headings and paragraphs.  We use
    # .children instead of .find_all() to avoid descending into
    # nested lists or advertisements.
    for element in content.children:
        if element.name is None:
            continue
        # Identify area headings (h2) and pharmacy names (h3)
        if element.name == "h2":
            text = element.get_text().strip()
            # Many h2 headings begin with “صيدلية الحراسة في ”.
            m = re.match(r".*?\u0641\s+(.+)", text)
            current_area = m.group(1).strip() if m else text
        elif element.name == "h3":
            name = element.get_text().strip()
            # Assume the next paragraph (<p>) contains the details
            details_paragraph = element.find_next_sibling("p")
            address = phone = district = duty = ""
            if details_paragraph is not None:
                # Split the text on the break tag to separate fields.
                text = details_paragraph.get_text(separator="|")
                parts = [part.strip() for part in text.split("|") if part.strip()]
                for part in parts:
                    if part.startswith("\u0627\u0644\u0639\u0646\u0648\u0627\u0646"):
                        # extract substring after ':'
                        address = part.split(":", 1)[-1].strip()
                    elif part.startswith("\u0627\u0644\u0647\u0627\u062a\u0641"):
                        phone = part.split(":", 1)[-1].strip()
                    elif part.startswith("\u0627\u0644\u062d\u064a \u0627\u0644\u0633\u0643\u0646\u064a"):
                        district = part.split(":", 1)[-1].strip()
                    elif part.startswith("\u0627\u0644\u062d\u0631\u0627\u0633\u0629"):
                        duty = part.split(":", 1)[-1].strip()
            record = PharmacyRecord(
                city=city,
                area=current_area,
                name=name,
                address=address,
                phone=phone,
                district=district if district else current_area,
                duty=duty,
                source=url,
                date=date.today().isoformat(),
            )
            records.append(record)
    return records


def parse_kenitra_extra(url: str) -> List[PharmacyRecord]:
    """Parse the Kénitra-specific portal.

    The site pharmaciedegardekenitra.com lists the on‑duty pharmacies with
    name, telephone, district and address embedded in paragraphs.  This
    parser looks for paragraphs that start with 'Pharmacie' and
    extracts these fields using simple string operations.

    Args:
        url: URL of the Kénitra portal (usually the home page).

    Returns:
        A list of PharmacyRecord objects.
    """
    records: List[PharmacyRecord] = []
    resp = requests.get(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")
    # search for all text segments containing Téléphone and Pharmacie
    candidates = soup.find_all(string=re.compile(r"Pharmacie", re.IGNORECASE))
    for candidate in candidates:
        parent = candidate.parent
        if parent.name not in {"p", "div", "span"}:
            continue
        text = parent.get_text(separator=" ").strip()
        # We only keep entries that include Téléphone
        if "Téléphone" not in text and "Téléphone".lower() not in text.lower():
            continue
        # Example line: "Pharmacie lourak صيدلية الوراق   Téléphone 05373-81144 ☎️  Quartier MDINA   Adresse Hay Ourida, Rue 164 N°25, 14000"
        # Break into tokens and parse by keywords
        name_match = re.match(r"^Pharmacie\s+([^\n]+)", text, re.IGNORECASE)
        name = name_match.group(0).strip() if name_match else text.split("Téléphone")[0].strip()
        phone = ""
        district = "Kénitra"
        address = ""
        # Find phone
        phone_match = re.search(r"Téléphone\s*([0-9\-\s+]+)", text, re.IGNORECASE)
        if phone_match:
            phone = phone_match.group(1).strip()
        # Find district
        dist_match = re.search(r"Quartier\s*([^A]+?)\s{2,}", text)
        if dist_match:
            district = dist_match.group(1).strip()
        # Find address
        addr_match = re.search(r"Adresse\s*([^\"]+)$", text)
        if addr_match:
            address = addr_match.group(1).strip()
        record = PharmacyRecord(
            city="Kenitra",
            area=district,
            name=name,
            address=address,
            phone=phone,
            district=district,
            duty="24h/24",
            source=url,
            date=date.today().isoformat(),
        )
        records.append(record)
    return records


def parse_tangier(url: str) -> List[PharmacyRecord]:
    """Parse the Infopoint page for Tangier pharmacies.

    The Tangier page lists each pharmacy twice: a French name and an
    Arabic name.  After the names there is a line with address and
    phone number.  This parser pairs the names and reads the following
    text to extract the address and phone.

    Args:
        url: Full URL of the Infopoint Tangier page.

    Returns:
        A list of PharmacyRecord objects for Tangier.
    """
    records: List[PharmacyRecord] = []
    resp = requests.get(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")
    # The page uses h3 tags for names (duplicated).  We'll iterate
    # through all h3 elements and group them in pairs.
    names = soup.find_all("h3")
    i = 0
    while i < len(names) - 1:
        name_fr = names[i].get_text(strip=True)
        name_ar = names[i + 1].get_text(strip=True)
        # Skip duplicate French names that repeat the Arabic name.
        # Assume the address and phone are contained in the next few
        # paragraphs (<p> elements) following the Arabic name.
        details = []
        pointer = names[i + 1]
        # collect up to 5 subsequent text nodes
        for _ in range(5):
            pointer = pointer.find_next_sibling()
            if pointer is None:
                break
            if pointer.name == "p":
                details.append(pointer.get_text(separator=" ").strip())
        # Attempt to extract phone (digits and spaces)
        phone = ""
        for detail in details:
            phone_match = re.search(r"\+?[0-9\s]{10,}", detail)
            if phone_match:
                phone = phone_match.group(0).strip()
                break
        # Address: use the first detail line that contains a comma or a
        # street designation
        address = ""
        for detail in details:
            if "," in detail or any(word in detail.lower() for word in ["rue", "route", "avenue", "lotissement", "hay", "quartier"]):
                address = detail.strip()
                break
        # Use the French name as the display name; append Arabic in
        # parentheses for completeness
        full_name = f"{name_fr} / {name_ar}"
        record = PharmacyRecord(
            city="Tangier",
            area=None,
            name=full_name,
            address=address,
            phone=phone,
            district=None,
            duty="Night",  # According to the site these entries are night duties
            source=url,
            date=date.today().isoformat(),
        )
        records.append(record)
        i += 2
    return records


def collect_pharmacies() -> List[PharmacyRecord]:
    """Collect pharmacies from all configured sources.

    Returns:
        A list of PharmacyRecord objects for Rabat, Salé, Témara,
        Kénitra, Casablanca, Fès, Tangier and Marrakech.
    """
    all_records: List[PharmacyRecord] = []
    nmra1_urls = {
        "Rabat": "https://www.nmra1.com/%D8%B5%D9%8A%D8%AF%D9%84%D9%8A%D8%A9-%D8%A7%D9%84%D8%AD%D8%B1%D8%A7%D8%B3%D8%A9-%D8%A7%D9%84%D8%B1%D8%A8%D8%A7%D8%B7/",
        "Salé": "https://www.nmra1.com/%D8%B5%D9%8A%D8%AF%D9%84%D9%8A%D8%A9-%D8%A7%D9%84%D8%AD%D8%B1%D8%A7%D8%B3%D8%A9-%D8%B3%D9%84%D8%A7/",
        "Témara": "https://www.nmra1.com/%D8%B5%D9%8A%D8%AF%D9%84%D9%8A%D8%A9-%D8%A7%D9%84%D8%AD%D8%B1%D8%A7%D8%B3%D8%A9-%D8%AA%D9%85%D8%A7%D8%B1%D8%A9/",
        "Casablanca": "https://www.nmra1.com/%D8%B5%D9%8A%D8%AF%D9%84%D9%8A%D8%A9-%D8%A7%D9%84%D8%AD%D8%B1%D8%A7%D8%B3%D8%A9-%D8%A7%D9%84%D8%AF%D8%A7%D8%B1-%D8%A7%D9%84%D8%A8%D9%8A%D8%B6%D8%A7%D8%A1/",
        "Fès": "https://www.nmra1.com/%D8%B5%D9%8A%D8%AF%D9%84%D9%8A%D8%A9-%D8%A7%D9%84%D8%AD%D8%B1%D8%A7%D8%B3%D8%A9-%D9%81%D8%A7%D8%B3/",
        "Marrakech": "https://www.nmra1.com/%D8%B5%D9%8A%D8%AF%D9%84%D9%8A%D8%A9-%D8%A7%D9%84%D8%AD%D8%B1%D8%A7%D8%B3%D8%A9-%D9%85%D8%B1%D8%A7%D9%83%D8%B4/",
        # Kénitra is handled separately to augment the list
    }
    for city, url in nmra1_urls.items():
        try:
            records = parse_nmra1(url, city)
            all_records.extend(records)
        except Exception as exc:
            print(f"Warning: failed to parse Nmra1 page for {city}: {exc}")

    # Parse Kénitra from Nmra1 (may contain only one record)
    try:
        kenitra_nmra1 = parse_nmra1(
            "https://www.nmra1.com/%D8%B5%D9%8A%D8%AF%D9%84%D9%8A%D8%A9-%D8%A7%D9%84%D8%AD%D8%B1%D8%A7%D8%B3%D8%A9-%D8%A7%D9%84%D9%82%D9%86%D9%8A%D8%B7%D8%B1%D8%A9/",
            "Kenitra",
        )
        all_records.extend(kenitra_nmra1)
    except Exception as exc:
        print(f"Warning: failed to parse Nmra1 page for Kénitra: {exc}")

    # Augment Kénitra with entries from the dedicated portal
    try:
        kenitra_extra = parse_kenitra_extra("https://pharmaciedegardekenitra.com/")
        all_records.extend(kenitra_extra)
    except Exception as exc:
        print(f"Warning: failed to parse Kénitra portal: {exc}")

    # Parse Tangier
    try:
        tangier = parse_tangier("https://infopoint.ma/pharmacies-de-garde")
        all_records.extend(tangier)
    except Exception as exc:
        print(f"Warning: failed to parse Tangier page: {exc}")

    return all_records


def main() -> None:
    """Collect data and print it as JSON on standard output."""
    records = collect_pharmacies()
    # Convert dataclass objects to plain dictionaries
    dicts = [rec.to_dict() for rec in records]
    print(json.dumps(dicts, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
