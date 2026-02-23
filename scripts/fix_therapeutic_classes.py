#!/usr/bin/env python3
"""One-time script to normalize therapeutic classes in existing data.

Reads medicament_ma_optimized.json, applies the normalization function
from medicaments_updater.py, writes back cleaned data, then regenerates
the search index.

Usage:
    python scripts/fix_therapeutic_classes.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

# Add scripts dir to path so we can import from medicaments_updater
sys.path.insert(0, str(Path(__file__).resolve().parent))

from medicaments_updater import normalize_therapeutic_classes  # noqa: E402

ROOT_DIR = Path(__file__).resolve().parents[1]
OPTIMIZED_JSON = ROOT_DIR / "public" / "data" / "medicament_ma_optimized.json"


def main() -> None:
    data = json.loads(OPTIMIZED_JSON.read_text(encoding="utf-8"))
    if not isinstance(data, list):
        print("ERROR: Expected a JSON array")
        sys.exit(1)

    total_drugs = len(data)
    modified_count = 0
    before_unique: set[str] = set()
    after_unique: set[str] = set()

    for record in data:
        tc = record.get("therapeuticClass")
        if tc is None:
            continue

        # Ensure it's a list
        if isinstance(tc, str):
            tc = [tc]

        for v in tc:
            if isinstance(v, str):
                before_unique.add(v)

        # Normalize
        cleaned = normalize_therapeutic_classes(tc)

        for v in cleaned:
            after_unique.add(v)

        if cleaned != tc:
            modified_count += 1

        if cleaned:
            record["therapeuticClass"] = cleaned
        else:
            # Remove empty therapeutic class
            record.pop("therapeuticClass", None)

    # Write back
    tmp = OPTIMIZED_JSON.with_suffix(".json.tmp")
    tmp.write_text(
        json.dumps(data, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    tmp.replace(OPTIMIZED_JSON)

    print(f"Processed {total_drugs} drugs, modified {modified_count}")
    print(f"Unique classes: {len(before_unique)} → {len(after_unique)}")
    print(f"Removed {len(before_unique) - len(after_unique)} duplicate/junk entries")


if __name__ == "__main__":
    main()
