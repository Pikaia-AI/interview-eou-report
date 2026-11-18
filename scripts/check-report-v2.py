"""Check the focused edition's scope, exact values, sources and served links.

HTTP/HTML checks only; this does not exercise browser layout or pointer events.
"""
from __future__ import annotations

import hashlib
import importlib.util
import json
import re
import sys
from collections import Counter
from pathlib import Path
from urllib.request import ProxyHandler, build_opener

ROOT = Path(__file__).resolve().parents[1]
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("report_checks", ROOT / "scripts/check-report.py")
base = importlib.util.module_from_spec(spec)
spec.loader.exec_module(base)


class FocusedParser(base.PageParser):
    def __init__(self):
        super().__init__()
        self.sections = []
        self.frontiers = {}
        self.closed_details = []
        self.edition_links = {}

    def handle_starttag(self, tag, attrs):
        super().handle_starttag(tag, attrs)
        attrs = dict(attrs)
        if tag == "details":
            self.closed_details.append("open" not in attrs)
        if tag == "section" and "report-section" in attrs.get("class", "").split():
            self.sections.append(attrs.get("id"))
        if tag == "figure" and attrs.get("data-frontier"):
            assert not any(self.closed_details), "Primary timing chart is hidden in a disclosure"
            self.frontiers[attrs["data-frontier"]] = attrs.get("data-budget")
        if tag == "a" and attrs.get("href") in ("/", "/v2", "/v2/"):
            href = "/v2/" if attrs["href"].rstrip("/") == "/v2" else "/"
            self.edition_links.setdefault(href, attrs.get("aria-current"))

    def handle_endtag(self, tag):
        super().handle_endtag(tag)
        if tag == "details":
            self.closed_details.pop()


def main():
    origin = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:5188").rstrip("/")
    fetch = build_opener(ProxyHandler({}))
    response = fetch.open(origin + "/v2/", timeout=30)
    assert response.status == 200
    html = response.read().decode()
    page = FocusedParser()
    page.feed(html)
    assert page.sections == ["models", "benchmark", "results", "latency", "ablations", "paper"]
    assert list(page.frontiers.items()) == [("pikaia", "5"), ("livekit_floor_end", "5"), ("livekit", "5")]
    assert page.edition_links == {"/": None, "/v2/": "page"}
    ids = set(page.ids)
    assert all(count == 1 for count in Counter(page.ids).values())
    assert all(href[1:] in ids for href in page.links if href.startswith("#") and href != "#")
    assert not any(re.fullmatch(r"chapter-\d+", value) for value in ids)
    assert not re.search(r'class="explorer cascade"', html), "Duplicate legacy cascade UI in V2"
    assert page.detail_open["ablation-floor-end"] is False
    assert page.ablation_panels == {"response_ready": "300ms", "floor_end": "300ms"}

    # Both editions must use the same default values and complete model order.
    v1 = base.PageParser()
    v1.feed(fetch.open(origin + "/", timeout=30).read().decode())
    assert set(page.result_tables) == {"test_1100", "full_2338", "test_private_1138"}
    assert page.result_tables == v1.result_tables
    assert page.ablation_rows == v1.ablation_rows
    assert len(page.ablation_rows) == 6
    assert "smart-turn-transfer" in ids

    report = json.loads((ROOT / "app/report-data.json").read_text())
    supplement = json.loads((ROOT / "public/report/v2-supplementary.json").read_text())
    assert supplement["tables"] == [report["tables"][n - 1] for n in [4, 5, 6, 7, 8, 9]]
    for cohort in ["tier2_paired_788", "livekit_orig_paired_1058"]:
        assert supplement["additional_cascade_cohorts"][cohort] == report["cascades"][cohort]
    manifest = json.loads((ROOT / "public/report/v2-source-manifest.json").read_text())
    for source in manifest["sources"]:
        path = ROOT / "public" / source["url"].lstrip("/")
        assert hashlib.sha256(path.read_bytes()).hexdigest() == source["sha256"]
    assert manifest["known_archive_discrepancies"][0]["main_table_3"] == 412.7
    assert manifest["known_archive_discrepancies"][0]["sampled_curve"] == 411.4

    assets = sorted(set(page.assets + [link for link in page.links if link.startswith("/report/")]))
    for asset in assets:
        res = fetch.open(origin + asset, timeout=30)
        assert res.status == 200
        if asset.endswith(".json"):
            json.loads(res.read())
        elif asset.endswith(".pdf"):
            assert res.read(4) == b"%PDF"
    result = {
        "v2_sections": len(page.sections), "visible_frontiers": len(page.frontiers),
        "exact_result_tables_match_v1": len(page.result_tables),
        "ablation_rows_match_v1": len(page.ablation_rows),
        "source_checksums": len(manifest["sources"]), "resources_http_200": len(assets),
        "duplicate_ids": 0, "broken_anchors": 0, "browser_visual_or_pointer_qa": False,
    }
    output = ROOT / "outputs/v2-verification.json"
    output.parent.mkdir(exist_ok=True)
    output.write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
