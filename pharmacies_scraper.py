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
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/115.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "fr,ar;q=0.8,en;q=0.7",
}


def parse_nmra1(url: str, city: str) -> List[PharmacyRecord]:
    """Parse a Nmra1 article and return a list of pharmacy records."""
    records: List[PharmacyRecord] = []
    resp = requests.get(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    content = soup.find("div", class_="entry-content") or soup.find("article")
    if not content:
        return records

    current_area: Optional[str] = None

    for element in content.children:
        if element.name is None:
            continue

        if element.name == "h2":
            text = element.get_text().strip()
            m = re.match(r".*?\u0641\s+(.+)", text)
            current_area = m.group(1).strip() if m else text

        elif element.name == "h3":
            name = element.get_text().strip()
            # Skip non-pharmacy headings
            if any(keyword in name for keyword in ["قائمة", "صيدليات"]):
                continue

            details_paragraph = element.find_next_sibling("p")
            address = phone = district = duty = ""

            if details_paragraph is not None:
                text = details_paragraph.get_text(separator="|")
                parts = [part.strip() for part in re.split(r"[|\n]", text) if part.strip()]
                for part in parts:
                    if part.lower().startswith("adresse") or part.startswith("العنوان"):
                        address = part.split(":", 1)[-1].strip()
                    elif part.lower().startswith("téléphone") or part.startswith("الهاتف"):
                        phone = part.split(":", 1)[-1].strip()
                    elif part.lower().startswith("quartier") or part.startswith("الحي"):
                        district = part.split(":", 1)[-1].strip()
                    elif part.lower().startswith("garde") or part.startswith("الحراسة"):
                        duty = part.split(":", 1)[-1].strip()

            record = PharmacyRecord(
                city=city,
                area=current_area,
                name=name,
                address=address,
                phone=phone,
                district=district or current_area,
                duty=duty or "24h/24",
                source=url,
                date=date.today().isoformat(),
            )
            records.append(record)

    return records


def parse_kenitra_extra(url: str) -> List[PharmacyRecord]:
    """Parse the Kénitra-specific portal."""
    records: List[PharmacyRecord] = []
    resp = requests.get(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    candidates = soup.find_all(string=re.compile(r"Pharmacie", re.IGNORECASE))
    for candidate in candidates:
        parent = candidate.parent
        if parent.name not in {"p", "div", "span"}:
            continue

        text = parent.get_text(separator="|").strip()
        parts = [part.strip() for part in re.split(r"[|\n]", text) if part.strip()]

        name = district = address = phone = duty = None
        for part in parts:
            pharma_match = re.match(r"^Pharmacie\s+(.*)$", part, re.IGNORECASE)
            if pharma_match:
                name = pharma_match.group(1).strip()
            elif part.lower().startswith("téléphone") or part.startswith("الهاتف"):
                phone = part.split(":", 1)[-1].strip()
            elif part.lower().startswith("quartier") or part.startswith("الحي"):
                district = part.split(":", 1)[-1].strip()
            elif part.lower().startswith("adresse") or part.startswith("العنوان"):
                address = part.split(":", 1)[-1].strip()
            elif part.lower().startswith("garde") or part.startswith("الحراسة"):
                duty = part.split(":", 1)[-1].strip()

        record = PharmacyRecord(
            city="Kénitra",
            area=district,
            name=name or "",
            address=address or "",
            phone=phone or "",
            district=district,
            duty=duty or "24h/24",
            source=url,
            date=date.today().isoformat(),
        )
        records.append(record)
    return records


def parse_tangier(url: str) -> List[PharmacyRecord]:
    """Parse the Infopoint page for Tangier pharmacies."""
    records: List[PharmacyRecord] = []
    resp = requests.get(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    names = soup.find_all("h3")
    i = 0
    while i < len(names) - 1:
        name_fr = names[i].get_text(strip=True)
        name_ar = names[i + 1].get_text(strip=True)

        details = []
        pointer = names[i + 1]
        for _ in range(5):
            pointer = pointer.find_next_sibling()
            if not pointer:
                break
            if pointer.name == "p":
                details.append(pointer.get_text(separator=" ").strip())

        phone = ""
        address = ""
        for detail in details:
            phone_match = re.search(r"\+?[0-9\s]{10,}", detail)
            if phone_match:
                phone = phone_match.group(0).strip()
                break
        for detail in details:
            if "," in detail or any(
                word in detail.lower() for word in [
                    "rue", "route", "avenue", "lotissement", "hay", "quartier"
                ]
            ):
                address = detail.strip()
                break

        full_name = f"{name_fr} / {name_ar}"
        record = PharmacyRecord(
            city="Tanger",
            area=None,
            name=full_name,
            address=address,
            phone=phone,
            district=None,
            duty="24h/24",
            source=url,
            date=date.today().isoformat(),
        )
        records.append(record)
        i += 2

    return records


def collect_pharmacies() -> List[PharmacyRecord]:
    all_records: List[PharmacyRecord] = []
    nmra1_urls = {
        "Rabat": "https://www.nmra1.com/%D8%B5%D9%8A%D8%AF%D9%84%D9%8A%D8%A9-%D8%A7%D9%84%D8%AD%D8%B1%D8%A7%D8%B3%D8%A9-%D8%A7%D9%84%D8%B1%D8%A8%D8%A7%D8%B7/",
        "Salé": "https://www.nmra1.com/%D8%B5%D9%8A%D8%AF%D9%84%D9%8A%D8%A9-%D8%A7%D9%84%D8%AD%D8%B1%D8%A7%D8%B3%D8%A9-%D8%B3%D9%84%D8%A7/",
        "Témara": "https://www.nmra1.com/%D8%B5%D9%8A%D8%AF%D9%84%D9%8A%D8%A9-%D8%A7%D9%84%D8%AD%D8%B1%D8%A7%D8%B3%D8%A9-%D8%AA%D9%85%D8%A7%D8%B1%D8%A9/",
        "Casablanca": "https://www.nmra1.com/%D8%B5%D9%8A%D8%AF%D9%84%D9%8A%D8%A9-%D8%A7%D9%84%D8%AD%D8%B1%D8%A7%D8%B3%D8%A9-%D8%A7%D9%84%D8%AF%D8%A7%D8%B1-%D8%A7%D9%84%D8%A8%D9%8A%D8%B6%D8%A7%D8%A1/",
        "Fès": "https://www.nmra1.com/%D8%B5%D9%8A%D8%AF%D9%84%D9%8A%D8%A9-%D8%A7%D9%84%D8%AD%D8%B1%D8%A7%D8%B3%D8%A9-%D9%81%D8%A7%D8%B3/",
        "Marrakech": "https://www.nmra1.com/%D8%B5%D9%8A%D8%AF%D9%84%D9%8A%D8%A9-%D8%A7%D9%84%D8%AD%D8%B1%D8%A7%D8%B3%D8%A9-%D9%85%D8%B1%D8%A7%D9%83%D8%B4/",
    }
    for city, url in nmra1_urls.items():
        try:
            records = parse_nmra1(url, city)
            all_records.extend(records)
        except Exception as exc:
            print(f"Warning: failed to parse Nmra1 page for {city}: {exc}")

    try:
        kenitra_nmra1 = parse_nmra1(
            "https://www.nmra1.com/%D8%B5%D9%8A%D8%AF%D9%84%D9%8A%D8%A9-%D8%A7%D9%84%D8%AD%D8%B1%D8%A7%D8%B3%D8%A9-%D8%A7%D9%84%D9%82%D9%86%D9%8A%D8%B7%D8%B1%D8%A9/",
            "Kenitra",
        )
        all_records.extend(kenitra_nmra1)
    except Exception as exc:
        print(f"Warning: failed to parse Nmra1 page for Kénitra: {exc}")

    try:
        kenitra_extra = parse_kenitra_extra("https://pharmaciedegardekenitra.com/")
        all_records.extend(kenitra_extra)
    except Exception as exc:
        print(f"Warning: failed to parse Kénitra portal: {exc}")

    try:
        tangier = parse_tangier("https://infopoint.ma/pharmacies-de-garde")
        all_records.extend(tangier)
    except Exception as exc:
        print(f"Warning: failed to parse Tangier page: {exc}")

    return all_records


def main() -> None:
    records = collect_pharmacies()
    dicts = [rec.to_dict() for rec in records]
    print(json.dumps(dicts, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
