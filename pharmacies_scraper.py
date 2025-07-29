```python
from __future__ import annotations

import json
import re
import urllib.parse
from dataclasses import dataclass
from datetime import datetime
from typing import List, Dict, Optional, Callable

import requests
from bs4 import BeautifulSoup


def today_iso() -> str:
    return datetime.now().strftime("%Y-%m-%d")


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
            "area": self.area or "",
            "name": self.name,
            "address": self.address or "",
            "phone": self.phone or "",
            "district": self.district or "",
            "duty": self.duty or "",
            "source": self.source,
            "date": self.date,
        }


# Global headers
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        " AppleWebKit/537.36 (KHTML, like Gecko)"
        " Chrome/115.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "fr,ar;q=0.8,en;q=0.7",
}

Parser = Callable[[str], List[PharmacyRecord]]


def parse_rabat(url: str) -> List[PharmacyRecord]:
    """Parse Rabat weekly calendar."""
    records: List[PharmacyRecord] = []
    res = requests.get(url, headers=HEADERS, timeout=30)
    res.raise_for_status()
    soup = BeautifulSoup(res.text, "html.parser")
    table = soup.find("table", class_="eb-weekly-events-container")
    if not table:
        return records
    seen = set()
    for td in table.select("td.tableb"):
        loc = td.find("p", class_="location-name")
        if not loc:
            continue
        area_text = loc.get_text(" ", strip=True)
        m = re.match(r"(.+?)\s*\((.+?)\)", area_text)
        if m:
            area_str, duty_str = m.groups()
        else:
            parts = area_text.rsplit(" ", 1)
            if len(parts) == 2 and re.search(r"\d", parts[1]):
                area_str, duty_str = parts
            else:
                area_str, duty_str = area_text, "24h/24"
        a = td.select_one("h4 a")
        if not a:
            continue
        raw = a.get_text(" ", strip=True)
        name, phone = (raw.rsplit(" - ", 1) + [""])[:2]
        key = (area_str, name, phone)
        if key in seen:
            continue
        seen.add(key)
        # Try to fetch detail page for address
        addr = ""
        try:
            detail = requests.get(urllib.parse.urljoin(url, a["href"]), headers=HEADERS, timeout=30)
            detail.raise_for_status()
            soup2 = BeautifulSoup(detail.text, "html.parser")
            for tag in soup2.select("p, div, li"):
                text = tag.get_text(" ", strip=True)
                if re.search(r"\d+\s+(Rue|Av|Bd|Avenue)", text):
                    addr = text
                    break
        except Exception:
            pass
        records.append(PharmacyRecord(
            city="Rabat",
            area=area_str,
            name=name,
            address=addr,
            phone=phone,
            district=area_str,
            duty=duty_str,
            source=url,
            date=today_iso(),
        ))
    return records


def parse_sale(url: str) -> List[PharmacyRecord]:
    """Parse Salé weekly calendar."""
    records: List[PharmacyRecord] = []
    res = requests.get(url, headers=HEADERS, timeout=30)
    res.raise_for_status()
    soup = BeautifulSoup(res.text, "html.parser")
    table = soup.find("table", class_="eb-weekly-events-container")
    if not table:
        return records
    seen = set()
    for td in table.select("td.tableb"):
        loc = td.find("p", class_="location-name")
        if not loc:
            continue
        text = loc.get_text(" ", strip=True)
        parts = text.rsplit(" ", 1)
        if len(parts) == 2 and re.match(r"^\d", parts[1]):
            area_str, duty_str = parts
        else:
            area_str, duty_str = text, "24h/24"
        a = td.select_one("h4 a")
        if not a:
            continue
        raw = a.get_text(" ", strip=True)
        name, phone = (raw.rsplit(" - ", 1) + [""])[:2]
        key = (area_str, name, phone)
        if key in seen:
            continue
        seen.add(key)
        records.append(PharmacyRecord(
            city="Salé",
            area=area_str,
            name=name,
            address="",
            phone=phone,
            district=area_str,
            duty=duty_str,
            source=url,
            date=today_iso(),
        ))
    return records


def parse_tanger(url: str) -> List[PharmacyRecord]:
    """Parse Tanger night-duty from infopoint.ma."""
    records: List[PharmacyRecord] = []
    res = requests.get(url, headers=HEADERS, timeout=30)
    res.raise_for_status()
    soup = BeautifulSoup(res.text, "html.parser")
    hdr = soup.find("h1", class_="arabe_title")
    times = hdr.select("span.time") if hdr else []
    duty = f"{times[0].get_text(strip=True)}-{times[1].get_text(strip=True)}" if len(times) >= 2 else "24h/24"
    seen = set()
    for item in soup.select("div.item-grid.arabe_pharm"):
        en = item.select_one("div.flex_2 h3").get_text(strip=True)
        phone = item.select_one("p.phone-item").get_text(strip=True)
        title_addr = item.select_one("p.adress-item")["title"].strip()
        area_str = title_addr.split()[0] if title_addr else ""
        key = (area_str, en, phone)
        if key in seen:
            continue
        seen.add(key)
        records.append(PharmacyRecord(
            city="Tanger",
            area=area_str,
            name=en,
            address=title_addr,
            phone=phone,
            district=area_str,
            duty=duty,
            source=url,
            date=today_iso(),
        ))
    return records


def parse_casablanca(url: str) -> List[PharmacyRecord]:
    """Parse Casablanca districts via infopoint.ma."""
    records: List[PharmacyRecord] = []
    res = requests.get(url, headers=HEADERS, timeout=30)
    res.raise_for_status()
    soup = BeautifulSoup(res.text, "html.parser")
    for a in soup.select("div.sectorlist article.sec a"):
        district = a.select_one("h1").get_text(strip=True)
        duty = a.select_one("strong").get_text(strip=True)
        href = urllib.parse.urljoin(url, a["href"])
        r2 = requests.get(href, headers=HEADERS, timeout=30)
        r2.raise_for_status()
        s2 = BeautifulSoup(r2.text, "html.parser")
        seen = set()
        for ph in s2.select("div.item-grid.arabe_pharm"):
            name = ph.select_one("div.flex_2 h3").get_text(strip=True)
            phone = ph.select_one("p.phone-item").get_text(strip=True)
            title_addr = ph.select_one("p.adress-item")["title"].strip()
            key = (district, name, phone)
            if key in seen:
                continue
            seen.add(key)
            records.append(PharmacyRecord(
                city="Casablanca",
                area=district,
                name=name,
                address=title_addr,
                phone=phone,
                district=district,
                duty=duty,
                source=href,
                date=today_iso(),
            ))
    return records


def parse_marrakech(url: str) -> List[PharmacyRecord]:
    """Parse Marrakech night‑duty pharmacies with pagination."""
    records: List[PharmacyRecord] = []
    base = url.rstrip("/0")
    seen = set()
    for i in range(0, 10):
        page = f"{base}/{i}"
        r = requests.get(page, headers=HEADERS, timeout=30)
        if r.status_code != 200:
            break
        s = BeautifulSoup(r.text, "html.parser")
        items = s.select("div.card-doctor-block")
        if not items:
            break
        for it in items:
            name = it.select_one(".list__label--name").get_text(strip=True)
            adr = it.select(".list__label--adr")[0].get_text(" ", strip=True)
            duty_tag = it.select(".list__label--adr")[1].get_text(strip=True)
            duty = duty_tag.replace("Garde de", "").strip()
            phone = it.select_one("a.calltel").get_text(strip=True).replace(".", "")
            key = (name, phone)
            if key in seen:
                continue
            seen.add(key)
            records.append(PharmacyRecord(
                city="Marrakech",
                area="Marrakech",
                name=name,
                address=adr,
                phone=phone,
                district="Marrakech",
                duty=duty,
                source=page,
                date=today_iso(),
            ))
    return records


def parse_fes(url: str) -> List[PharmacyRecord]:
    """Parse Fès pharmacies de garde from annuaire-gratuit.ma."""
    records: List[PharmacyRecord] = []
    res = requests.get(url, headers=HEADERS, timeout=30)
    res.raise_for_status()
    soup = BeautifulSoup(res.text, "html.parser")

    for li in soup.select("ul#agItemList li.ag_listing_item"):
        a = li.select_one("a[itemprop=url]")
        if not a:
            continue
        name = a.select_one("h3[itemprop=name]").get_text(strip=True)
        addr_tag = a.select_one("div[itemprop=address] p[itemprop=streetAddress]")
        address = addr_tag.get_text(" ", strip=True) if addr_tag else ""
        phone_span = a.select_one("p > span:not([itemprop])")
        phone = phone_span.get_text(strip=True) if phone_span else ""
        loc_spans = a.select("p span[itemprop=addressLocality]")
        district = loc_spans[0].get_text(strip=True) if len(loc_spans) >= 1 else ""
        duty_tag = a.select_one("span.garde-openingStatus")
        duty = duty_tag.get_text(strip=True) if duty_tag else "24h/24"
        records.append(PharmacyRecord(
            city="Fès",
            area=district,
            name=name,
            address=address,
            phone=phone,
            district=district,
            duty=duty,
            source=url,
            date=today_iso(),
        ))
    return records


def main():
    sources: Dict[str, (Parser, str)] = {
        "Rabat":      (parse_rabat,      "https://www.guidepharmacies.ma/pharmacies-de-garde/rabat.html"),
        "Salé":       (parse_sale,       "https://www.guidepharmacies.ma/pharmacies-de-garde/sale.html"),
        "Tanger":     (parse_tanger,     "https://infopoint.ma/pharmacies-de-garde"),
        "Casablanca": (parse_casablanca, "https://infopoint.ma/pharmacies-de-garde/"),
        "Marrakech":  (parse_marrakech,  "https://www.med.ma/pharmacie/garde-nuit/marrakech/0"),
        "Fès":        (parse_fes,        "https://www.annuaire-gratuit.ma/pharmacie-garde-fes.html"),
        # Témara, Kénitra: to be implemented
    }

    all_records: List[PharmacyRecord] = []
    for city, (parser, url) in sources.items():
        try:
            recs = parser(url)
            all_records.extend(recs)
        except Exception as e:
            print(f"Error parsing {city}: {e}")

    with open("pharmacies.json", "w", encoding="utf-8") as f:
        json.dump([r.to_dict() for r in all_records], f, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()
```
