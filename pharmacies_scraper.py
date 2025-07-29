from __future__ import annotations

import json
import re
import urllib.parse
from dataclasses import dataclass, asdict
from datetime import date
from typing import List, Dict, Optional

import requests
from bs4 import BeautifulSoup


@dataclass
class PharmacyRecord:
    """Represents a single on‑duty pharmacy entry."""

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
        # ensure no None values
        return {
            "city": self.city,
            "area": self.area or "",
            "name": self.name,
            "address": self.address,
            "phone": self.phone,
            "district": self.district or "",
            "duty": self.duty,
            "source": self.source,
            "date": self.date,
        }


HEADERS: Dict[str, str] = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/115.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "fr,ar;q=0.8,en;q=0.7",
}


def parse_rabat(url: str) -> List[PharmacyRecord]:
    """Parse Rabat weekly calendar from guidepharmacies.ma and fetch detailed pages."""
    records: List[PharmacyRecord] = []
    resp = requests.get(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    calendar = soup.find("table", class_="eb-weekly-events-container")
    if not calendar:
        return records

    seen: set[tuple[str, str, str]] = set()
    current_date = date.today().isoformat()

    for td in calendar.find_all("td", class_="tableb"):
        loc_p = td.find("p", class_="location-name")
        if not loc_p:
            continue
        loc_text = loc_p.get_text(" ", strip=True)

        # split area and duty
        m_paren = re.match(r"(.+?)\s*\((.*?)\)", loc_text)
        if m_paren:
            area_str = m_paren.group(1).strip()
            duty_str = m_paren.group(2).strip()
        else:
            m = re.search(r"\d", loc_text)
            if m:
                area_str = loc_text[:m.start()].strip()
                duty_str = loc_text[m.start():].strip()
            else:
                area_str = loc_text
                duty_str = "24h/24"

        a_tag = td.find("h4") and td.find("h4").find("a")
        if not a_tag:
            continue
        raw = a_tag.get_text(" ", strip=True)
        parts = raw.rsplit(" - ", 1)
        name_raw, phone_str = (parts if len(parts) == 2 else (raw, ""))

        key = (area_str, name_raw, phone_str)
        if key in seen:
            continue
        seen.add(key)

        detail_url = urllib.parse.urljoin(url, a_tag['href'])
        address_str = ""
        try:
            resp2 = requests.get(detail_url, headers=HEADERS, timeout=30)
            resp2.raise_for_status()
            soup2 = BeautifulSoup(resp2.text, "html.parser")
            for line in soup2.get_text(separator="\n").splitlines():
                line = line.strip()
                if line.startswith("Rue") or line.startswith("Av"):
                    address_str = line
                    break
        except Exception:
            address_str = ""

        records.append(PharmacyRecord(
            city="Rabat",
            area=area_str,
            name=name_raw,
            address=address_str,
            phone=phone_str,
            district=area_str,
            duty=duty_str,
            source=url,
            date=current_date,
        ))
    return records


def parse_tanger(url: str) -> List[PharmacyRecord]:
    """Parse Tanger night-duty pharmacies from infopoint.ma style page."""
    records: List[PharmacyRecord] = []
    resp = requests.get(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    # Extract duty hours from header
    header = soup.find("h1", class_="arabe_title")
    times = header.find_all("span", class_="time") if header else []
    if len(times) >= 2:
        start = times[0].get_text("", strip=True)
        end = times[1].get_text("", strip=True)
        duty_str = f"{start}-{end}"
    else:
        duty_str = "24h/24"

    for item in soup.find_all("div", class_="item-grid arabe_pharm"):
        flex = item.find("div", class_="flex_2")
        name_en = flex.find_all("h3")[0].get_text(strip=True) if flex else ""
        name_str = name_en

        addr_tag = item.find("p", class_="adress-item")
        title_addr = addr_tag.get('title', '').strip() if addr_tag else ''
        district_str = title_addr.split(",")[0] if title_addr else ""
        address_str = title_addr

        phone_tag = item.find("p", class_="phone-item")
        phone_str = phone_tag.get_text(strip=True) if phone_tag else ""

        records.append(PharmacyRecord(
            city="Tanger",
            area=district_str,
            name=name_str,
            address=address_str,
            phone=phone_str,
            district=district_str,
            duty=duty_str,
            source=url,
            date=date.today().isoformat(),
        ))
    return records


def parse_casablanca(url: str) -> List[PharmacyRecord]:
    """Parse Casablanca district list and fetch pharmacies by district."""
    records: List[PharmacyRecord] = []
    resp = requests.get(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    current_date = date.today().isoformat()
    sectors = soup.select("div.sectorlist article.sec a")
    for a in sectors:
        district = a.find("h1").get_text(strip=True)
        duty = a.find("strong").get_text(strip=True)
        href = a.get('href')
        district_url = urllib.parse.urljoin(url, href)
        try:
            resp2 = requests.get(district_url, headers=HEADERS, timeout=30)
            resp2.raise_for_status()
            soup2 = BeautifulSoup(resp2.text, "html.parser")
            # find each pharmacy entry (reuse Casablanca page structure)
            for item in soup2.select("div.item-grid.arabe_pharm"):
                name_en = item.select_one("div.flex_2 h3").get_text(strip=True)
                addr_tag = item.select_one("p.adress-item")
                title_addr = addr_tag.get('title','').strip() if addr_tag else ''
                district_str = district
                address_str = title_addr
                phone_tag = item.select_one("p.phone-item")
                phone_str = phone_tag.get_text(strip=True) if phone_tag else ''
                records.append(PharmacyRecord(
                    city="Casablanca",
                    area=district,
                    name=name_en,
                    address=address_str,
                    phone=phone_str,
                    district=district_str,
                    duty=duty,
                    source=district_url,
                    date=current_date,
                ))
        except Exception:
            continue
    return records

# Ensure all parsers return consistent string fields so front-end can safely use .lower()
