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


def parse_rabat(url: str) -> List[PharmacyRecord]:
    """Parse Rabat weekly calendar from guidepharmacies.ma."""
    records: List[PharmacyRecord] = []
    resp = requests.get(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    calendar = soup.find("table", class_="eb-weekly-events-container")
    if not calendar:
        return records

    for td in calendar.find_all("td", class_="tableb"):
        loc_p = td.find("p", class_="location-name")
        if not loc_p:
            continue
        loc_text = loc_p.get_text(" ", strip=True)
        m = re.search(r"\d", loc_text)
        if m:
            idx = m.start()
            area = loc_text[:idx].strip()
            duty = loc_text[idx:].strip()
        else:
            area = loc_text
            duty = "24h/24"

        a = td.find("h4").find("a") if td.find("h4") else None
        if not a:
            continue
        raw = a.get_text(" ", strip=True)
        parts = raw.rsplit(" - ", 1)
        name, phone = (parts if len(parts) == 2 else (raw, ""))

        records.append(PharmacyRecord(
            city="Rabat",
            area=area or None,
            name=name,
            address="",
            phone=phone,
            district=area or None,
            duty=duty or "24h/24",
            source=url,
            date=date.today().isoformat()
        ))
    return records


def parse_nmra1(url: str, city: str) -> List[PharmacyRecord]:
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
            m = re.match(r".*?في\s+(.+)", text)
            current_area = m.group(1).strip() if m else text
        elif element.name == "h3":
            name = element.get_text().strip()
            if any(keyword in name for keyword in ["قائمة", "صيدليات"]):
                continue

            details_paragraph = element.find_next_sibling("p")
            address = phone = district = duty = ""
            if details_paragraph:
                parts = [p.strip() for p in re.split(r"[|\n]", details_paragraph.get_text()) if p.strip()]
                for part in parts:
                    low = part.lower()
                    if low.startswith("adresse") or part.startswith("العنوان"):
                        address = part.split(":", 1)[-1].strip()
                    elif low.startswith("téléphone") or part.startswith("الهاتف"):
                        phone = part.split(":", 1)[-1].strip()
                    elif low.startswith("quartier") or part.startswith("الحي"):
                        district = part.split(":", 1)[-1].strip()
                    elif low.startswith("garde") or part.startswith("الحراسة"):
                        duty = part.split(":", 1)[-1].strip()

            records.append(PharmacyRecord(
                city=city,
                area=current_area,
                name=name,
                address=address,
                phone=phone,
                district=district or current_area,
                duty=duty or "24h/24",
                source=url,
                date=date.today().isoformat()
            ))
    return records


def parse_kenitra_extra(url: str) -> List[PharmacyRecord]:
    records: List[PharmacyRecord] = []
    resp = requests.get(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    for fig in soup.select("figure.wp-block-table"):
        table = fig.find("table")
        if not table:
            continue
        header = table.find("thead").find("td")
        raw_name = header.get_text(" ", strip=True)
        name = raw_name
        if not name:
            continue

        phone = address = district = ""
        for tr in table.find("tbody").find_all("tr", recursive=False):
            cells = tr.find_all("td")
            if len(cells) < 2:
                continue
            label = cells[0].get_text(strip=True).lower()
            value = cells[1].get_text(" ", strip=True)
            if label == "téléphone":
                phone = value
            elif label == "quartier":
                district = value
            elif label == "adresse":
                address = value

        records.append(PharmacyRecord(
            city="Kénitra",
            area=district or None,
            name=name,
            address=address,
            phone=phone,
            district=district or None,
            duty="24h/24",
            source=url,
            date=date.today().isoformat()
        ))
    return records


def parse_tangier(url: str) -> List[PharmacyRecord]:
    records: List[PharmacyRecord] = []
    resp = requests.get(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    names = soup.find_all("h3")
    i = 0
    while i < len(names) - 1:
        name_fr = names[i].get_text(strip=True)
        name_ar = names[i + 1].get_text(strip=True)
        full_name = f"{name_fr} / {name_ar}"

        details = []
        node = names[i + 1].find_next_sibling()
        count = 0
        while node and count < 5:
            if node.name == "p":
                details.append(node.get_text(separator=" ", strip=True))
                count += 1
            node = node.find_next_sibling()

        phone = address = ""
        for detail in details:
            m = re.search(r"\+?[0-9\s]{6,}", detail)
            if m and not phone:
                phone = m.group(0).strip()
            if "," in detail or any(w in detail.lower() for w in ["rue","avenue","hay","quartier"]):
                address = detail
                break

        records.append(PharmacyRecord(
            city="Tanger",
            area=None,
            name=full_name,
            address=address,
            phone=phone,
            district=None,
            duty="24h/24",
            source=url,
            date=date.today().isoformat()
        ))
        i += 2
    return records


def collect_pharmacies() -> List[PharmacyRecord]:
    all_records: List[PharmacyRecord] = []

    # Rabat via guidepharmacies
    try:
        all_records.extend(parse_rabat("https://www.guidepharmacies.ma/pharmacies-de-garde/rabat.html"))
    except Exception as exc:
        print(f"Warning: failed parsing Rabat page: {exc}")

    # Other NMRA1 cities
    nmra1_urls = {
        "Salé": "https://www.nmra1.com/صيدلية-الحراسة-سلا/",
        "Témara": "https://www.nmra1.com/صيدلية-الحراسة-تمارة/",
        "Casablanca": "https://www.nmra1.com/صيدلية-الحراسة-الدار-البيضاء/",
        "Fès": "https://www.nmra1.com/صيدلية-الحراسة-فاس/",
        "Marrakech": "https://www.nmra1.com/صيدلية-الحراسة-مراكش/",
        "Kenitra": "https://www.nmra1.com/صيدلية-الحراسة-القنيطرة/",
    }
    for city, url in nmra1_urls.items():
        try:
            all_records.extend(parse_nmra1(url, city))
        except Exception as exc:
            print(f"Warning: failed parsing NMRA1 for {city}: {exc}")

    # Kénitra dedicated portal
    try:
        all_records.extend(parse_kenitra_extra("https://pharmaciedegardekenitra.com/"))
    except Exception as exc:
        print(f"Warning: failed parsing Kenitra portal: {exc}")

    # Tangier
    try:
        all_records.extend(parse_tangier("https://infopoint.ma/pharmacies-de-garde"))
    except Exception as exc:
        print(f"Warning: failed parsing Tangier page: {exc}")

    return all_records


def main() -> None:
    records = collect_pharmacies()
    print(json.dumps([rec.to_dict() for rec in records], ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
