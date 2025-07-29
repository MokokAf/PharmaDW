from __future__ import annotations

import json
import re
import urllib.parse
from dataclasses import dataclass
from datetime import datetime
from typing import List, Dict, Callable, Tuple

import requests
from bs4 import BeautifulSoup


# --------------------------------------------------------------------
# utility helpers
# --------------------------------------------------------------------
def today_iso() -> str:
    return datetime.now().strftime("%Y-%m-%d")


def _clean(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip())


def _canonical_duty(raw: str) -> str:
    txt = raw.lower()
    if "24" in txt:
        return "24h/24"
    m = re.search(r"(\d{1,2}h?\d{0,2}).*?(\d{1,2}h?\d{0,2})", txt)
    if m:
        return f"{m.group(1)}-{m.group(2)}"
    return _clean(raw)


def _normalize_phone(raw: str) -> str:
    digits = re.sub(r"[^\d]", "", raw)
    if digits.startswith("212") and len(digits) >= 11:
        return f"+{digits}"
    return digits if digits.startswith("0") else ("0" + digits if digits else "")


def _dedup_key(area: str, name: str, phone: str) -> Tuple[str, str, str]:
    return (_clean(area).lower(), _clean(name).lower(), _normalize_phone(phone))


# --------------------------------------------------------------------
# data model
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


HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/125.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "fr,ar;q=0.8,en;q=0.7",
}

Parser = Callable[[str], List[PharmacyRecord]]


# --------------------------------------------------------------------
# generic table parser (Kenitra, Temara, etc.)
# --------------------------------------------------------------------
def _parse_generic_table(url: str, city: str) -> List[PharmacyRecord]:
    records: List[PharmacyRecord] = []
    seen: set[Tuple[str, str, str]] = set()

    r = requests.get(url, headers=HEADERS, timeout=30)
    r.raise_for_status()
    soup = BeautifulSoup(r.text, "html.parser")

    for td in soup.select("td.tableb"):
        loc = td.find("p", class_="location-name")
        if not loc:
            continue
        area_raw = _clean(loc.get_text(" ", strip=True))
        m = re.match(r"(.+?)\s*\((.+?)\)", area_raw)
        if m:
            area, duty_raw = m.groups()
        else:
            parts = area_raw.rsplit(" ", 1)
            area, duty_raw = (parts if len(parts) == 2 else (area_raw, "24h/24"))
        duty = _canonical_duty(duty_raw)

        a = td.select_one("h4 a")
        if not a:
            continue
        raw = _clean(a.get_text(" ", strip=True))
        name, phone = (raw.split(" - ", 1) + [""])[:2]
        phone = _normalize_phone(phone)
        if name.lower() == "pharmacie" and not phone:
            continue

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
# Rabat
# --------------------------------------------------------------------
def parse_rabat(url: str) -> List[PharmacyRecord]:
    records: List[PharmacyRecord] = []
    seen: set[Tuple[str, str, str]] = set()

    r = requests.get(url, headers=HEADERS, timeout=30)
    soup = BeautifulSoup(r.text, "html.parser")
    nav = soup.select_one("nav.sp-megamenu-wrapper")
    if nav:
        nav.decompose()

    for td in soup.select("td.tableb"):
        loc = td.find("p", class_="location-name")
        if not loc:
            continue
        area_raw = _clean(loc.get_text(" ", strip=True))
        m = re.match(r"(.+?)\s*\((.+?)\)", area_raw)
        area, duty_raw = m.groups() if m else (area_raw, "24h/24")
        duty = _canonical_duty(duty_raw)

        a = td.select_one("h4 a")
        if not a:
            continue
        raw = _clean(a.get_text(" ", strip=True))
        name, phone = (raw.split(" - ", 1) + [""])[:2]
        phone = _normalize_phone(phone)

        addr = ""
        try:
            detail = requests.get(
                urllib.parse.urljoin(url, a["href"]), headers=HEADERS, timeout=30
            )
            if detail.ok:
                s2 = BeautifulSoup(detail.text, "html.parser")
                tag = s2.find(string=re.compile(r"\d+\s+(Rue|Av|Avenue|Bd)"))
                if tag:
                    addr = _clean(tag)
        except Exception:
            pass

        key = _dedup_key(area, name, phone)
        if key in seen:
            continue
        seen.add(key)

        records.append(
            PharmacyRecord(
                city="Rabat",
                area=area,
                name=name.title(),
                address=addr,
                phone=phone,
                district=area,
                duty=duty,
                source=url,
                date=today_iso(),
            )
        )
    return records


# --------------------------------------------------------------------
# Salé
# --------------------------------------------------------------------
def parse_sale(url: str) -> List[PharmacyRecord]:
    records: List[PharmacyRecord] = []
    seen: set[Tuple[str, str, str]] = set()

    r = requests.get(url, headers=HEADERS, timeout=30)
    soup = BeautifulSoup(r.text, "html.parser")

    for td in soup.select("td.tableb"):
        loc = td.find("p", class_="location-name")
        if not loc:
            continue
        txt = _clean(loc.get_text(" ", strip=True))
        m = re.match(r"(.+?)\s*\((\d{1,2}h.*?\d{1,2}h?\d{0,2})\)", txt)
        area, duty_raw = m.groups() if m else (txt, "24h/24")
        duty = _canonical_duty(duty_raw)

        a = td.select_one("h4 a")
        if not a:
            continue
        raw = _clean(a.get_text(" ", strip=True))
        name, phone = (raw.split(" - ", 1) + [""])[:2]
        phone = _normalize_phone(phone)

        key = _dedup_key(area, name, phone)
        if key in seen:
            continue
        seen.add(key)

        records.append(
            PharmacyRecord(
                city="Salé",
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


# --------------------------------------------------------------------
# Casablanca (infopoint)
# --------------------------------------------------------------------
def parse_casablanca(url: str) -> List[PharmacyRecord]:
    records: List[PharmacyRecord] = []
    seen: set[Tuple[str, str, str]] = set()

    r = requests.get(url, headers=HEADERS, timeout=30)
    soup = BeautifulSoup(r.text, "html.parser")

    for card in soup.select("div.item-grid.arabe_pharm"):
        name = _clean(card.select_one("h3").text)
        phone = _normalize_phone(card.select_one("p.phone-item").get_text(strip=True))
        addr_tag = card.select_one("p.adress-item")
        address = _clean(addr_tag["title"]) if addr_tag else ""
        district = address.split(",")[0] if "," in address else address.split()[0]
        duty = "20h00-09h00"

        key = _dedup_key(district, name, phone)
        if key in seen:
            continue
        seen.add(key)

        records.append(
            PharmacyRecord(
                city="Casablanca",
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
# Tanger (infopoint)
# --------------------------------------------------------------------
def parse_tanger(url: str) -> List[PharmacyRecord]:
    records: List[PharmacyRecord] = []
    seen: set[Tuple[str, str, str]] = set()

    r = requests.get(url, headers=HEADERS, timeout=30)
    soup = BeautifulSoup(r.text, "html.parser")

    duty = "20h00-09h00"
    for card in soup.select("div.item-grid.arabe_pharm"):
        name = _clean(card.select_one("h3").text)
        phone = _normalize_phone(card.select_one("p.phone-item").get_text(strip=True))
        addr_tag = card.select_one("p.adress-item")
        address = _clean(addr_tag["title"]) if addr_tag else ""
        area = address.split(",")[0]

        key = _dedup_key(area, name, phone)
        if key in seen:
            continue
        seen.add(key)

        records.append(
            PharmacyRecord(
                city="Tanger",
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


# --------------------------------------------------------------------
# Marrakech (med.ma)
# --------------------------------------------------------------------
def parse_marrakech(url: str) -> List[PharmacyRecord]:
    records: List[PharmacyRecord] = []
    seen: set[Tuple[str, str, str]] = set()

    base = url.rstrip("/0")
    for i in range(0, 5):
        page = f"{base}/{i}"
        r = requests.get(page, headers=HEADERS, timeout=30)
        if r.status_code != 200:
            break
        soup = BeautifulSoup(r.text, "html.parser")

        for block in soup.select("div.card-doctor-block"):
            name_tag = block.select_one(".list__label–name")
            if not name_tag:
                continue
            name = _clean(name_tag.text)

            addr_full = _clean(block.select_one(".list__label–adr").text)
            duty_raw = _clean(block.select(".list__label–adr")[-1].text)
            duty = _canonical_duty(duty_raw.replace("Garde de", ""))

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
                    address=addr_full,
                    phone=phone,
                    district="Marrakech",
                    duty=duty,
                    source=page,
                    date=today_iso(),
                )
            )
    return records


# --------------------------------------------------------------------
# Fès (annuaire-gratuit)
# --------------------------------------------------------------------
def parse_fes(url: str) -> List[PharmacyRecord]:
    records: List[PharmacyRecord] = []
    seen: set[Tuple[str, str, str]] = set()

    r = requests.get(url, headers=HEADERS, timeout=30)
    soup = BeautifulSoup(r.text, "html.parser")

    for li in soup.select("ul#agItemList li.ag_listing_item"):
        name_tag = li.select_one("h3[itemprop=name]")
        if not name_tag:
            continue
        name = _clean(name_tag.text)

        addr_tag = li.select_one("p[itemprop=streetAddress]")
        address = _clean(addr_tag.text) if addr_tag else ""

        phone_tag = li.select_one("span[title='Appelle-nous']")
        phone = _normalize_phone(phone_tag.text) if phone_tag else ""

        district_tag = li.select_one("span[itemprop=addressLocality]")
        district = _clean(district_tag.text) if district_tag else ""

        duty_tag = li.select_one("span.garde-openingStatus")
        duty = _canonical_duty(duty_tag.text if duty_tag else "24h/24")

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
    for city, (parser, url) in sources.items():
        try:
            all_records.extend(parser(url))
        except Exception as exc:
            print(f"Error parsing {city}: {exc}")

    with open("pharmacies.json", "w", encoding="utf-8") as fh:
        json.dump([rec.to_dict() for rec in all_records], fh, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()
