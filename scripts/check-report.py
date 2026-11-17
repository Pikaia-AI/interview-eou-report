"""Standalone verification script for Pikaia EOU report repository.
Verifies internal self-consistency, repository hygiene (zero forbidden bytes),
and served HTTP resources if an origin URL is supplied.
"""
from __future__ import annotations

import hashlib
import json
import re
import subprocess
import sys
import zlib
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.request import ProxyHandler, build_opener

ROOT = Path(__file__).resolve().parents[1]

FORBIDDEN = [
    bytes([116, 114, 111, 111, 108, 121]),
    bytes([111, 118, 101, 114, 108, 101, 97, 102]),
    bytes([54, 97, 102, 53, 57, 51, 48, 54, 53, 53, 56, 49, 49, 98, 97, 54, 51, 101, 54, 99, 100, 101, 56, 53]),
    bytes([47, 85, 115, 101, 114, 115, 47]),
    bytes([99, 104, 97, 116, 103, 112, 116, 46, 115, 105, 116, 101]),
    bytes([105, 97, 110, 108, 105, 110]),
    bytes([46, 111, 112, 101, 110, 97, 105]),
    bytes([99, 104, 97, 116, 103, 112, 116, 45, 97, 117, 116, 104]),
]


def verify_hygiene() -> int:
    """Scan all git-tracked files and decompressed PDF streams for forbidden bytes."""
    cmd = ["git", "ls-files"]
    tracked = subprocess.check_output(cmd, cwd=ROOT).decode("utf-8").splitlines()
    violations = []
    scanned = 0

    stream_regex = re.compile(rb"stream\r?\n(.*?)[\r\n]+endstream", re.DOTALL)

    for rel in tracked:
        p = ROOT / rel
        if not p.is_file():
            continue
        scanned += 1
        raw = p.read_bytes()
        raw_lower = raw.lower()

        for f in FORBIDDEN:
            if f.lower() in raw_lower:
                violations.append((rel, "raw", f))

        if p.suffix == ".pdf":
            for i, match in enumerate(stream_regex.finditer(raw)):
                try:
                    decomp = zlib.decompress(match.group(1)).lower()
                    for f in FORBIDDEN:
                        if f.lower() in decomp:
                            violations.append((rel, f"pdf_stream_{i}", f))
                except Exception:
                    pass

    if violations:
        for v in violations:
            print(f"HYGIENE VIOLATION in {v[0]} ({v[1]}): {v[2]}")
        raise AssertionError(f"Hygiene check failed with {len(violations)} violations across {scanned} files.")

    print(f"Hygiene verified: {scanned} tracked files scanned, 0 forbidden bytes found.")
    return scanned


def verify_data() -> Dict[str, Any]:
    """Verify internal self-consistency of report-data.json and metrics.json."""
    data_file = ROOT / "app/report-data.json"
    metrics_file = ROOT / "public/report/metrics.json"

    assert data_file.exists(), f"Missing {data_file}"
    assert metrics_file.exists(), f"Missing {metrics_file}"

    data = json.loads(data_file.read_text(encoding="utf-8"))
    metrics = json.loads(metrics_file.read_text(encoding="utf-8"))

    # Models
    assert len(data["models"]) == 7, f"Expected 7 models, got {len(data['models'])}"
    op_points = 0
    for m in data["models"]:
        assert m["name"] and m["spec"] and m["color"]
        for sp_name, cutoffs in m["splits"].items():
            assert sp_name in ("test_1100", "test_private_1138", "full_2338")
            for cu_name, langs in cutoffs.items():
                assert cu_name in ("300ms", "300ms_paired", "600ms_paired")
                for lg_name, pt in langs.items():
                    assert lg_name in ("overall", "zh", "en")
                    assert pt["n"] == pt["eot"] + pt["hold"]
                    assert 0.0 <= pt["auc"] <= 1.0
                    for b in ("1", "3", "5"):
                        op = pt["operating"][b]
                        assert op["fp"] <= op["allowed_fp"], f"FP budget violated in {m['name']} {sp_name} {cu_name} {lg_name} budget {b}"
                        assert op["fpr"] <= float(b) / 100.0 + 1e-5
                        assert 0.0 <= op["recall"] <= 1.0
                        op_points += 1
    assert op_points == 567, f"Expected 567 operating points, got {op_points}"

    # Cascades
    cascades = data["cascades"]
    assert len(cascades) == 4, f"Expected 4 cascade sets, got {len(cascades)}"
    assert cascades["tier2_paired_788"]["n"] == 788
    assert cascades["v1_paired_1700"]["n"] == 1700
    assert cascades["livekit_clean_paired_842"]["n"] == 842
    assert cascades["livekit_orig_paired_1058"]["n"] == 1058

    casc_points = 0
    for ds_name, ds in cascades.items():
        assert len(ds["models"]) == 6, f"Expected 6 models in cascade {ds_name}, got {len(ds['models'])}"
        for m in ds["models"]:
            for b in ("1pct", "2pct", "3pct", "5pct", "10pct"):
                pt = m["operating"][b]
                assert 300.0 <= pt["mean_wait_ms"] <= 1000.0, f"Wait out of bounds: {pt}"
                assert 0.0 <= pt["cum_recall_pct"] <= 100.0
                assert pt["cum_fir_pct"] <= float(b[:-3]) + 0.1
                casc_points += 1
    assert casc_points == 120, f"Expected 120 cascade operating points, got {casc_points}"

    # Tables
    tables = data["tables"]
    assert len(tables) == 9, f"Expected 9 tables, got {len(tables)}"
    for i, t in enumerate(tables, 1):
        assert t["number"] == i
        assert len(t["rows"]) > 0
        for r in t["rows"]:
            assert len(r) == len(t["headers"]), f"Header mismatch in Table {i}: {r}"
            assert not any("\\" in cell for cell in r), f"Unescaped LaTeX in Table {i}: {r}"

    # Table 2 verification
    t2_rows = tables[1]["rows"]
    assert t2_rows[0] == ["Tier 1 · dev", "Auto-gated", "50", "50", "100", "11", "75", "237"]
    assert t2_rows[1] == ["Tier 2 · research test", "Manual-gated", "500", "600", "1,100", "65", "788", "2,574"]
    assert t2_rows[2] == ["Tier 3 · blind holdout", "Private", "428", "710", "1,138", "74", "837", "2,648"]
    assert t2_rows[3] == ["Full benchmark", "Combined", "978", "1,360", "2,338", "150", "1,700", "5,459"]

    # Chapters & References
    assert len(data["chapters"]) == 8, f"Expected 8 chapters, got {len(data['chapters'])}"
    assert len(data["references"]) == 17, f"Expected 17 references, got {len(data['references'])}"

    # PDF parity
    pdf_path = ROOT / "public/report/pikaia-interview-eou-benchmark.pdf"
    assert pdf_path.exists(), f"Missing PDF at {pdf_path}"
    raw_pdf = pdf_path.read_bytes()
    assert raw_pdf.startswith(b"%PDF"), "PDF missing %PDF magic"
    sha = hashlib.sha256(raw_pdf).hexdigest()
    assert sha == data["pdf_sha256"], f"PDF SHA-256 mismatch: {sha} vs {data['pdf_sha256']}"

    # metrics.json parity
    for k in ["title", "snapshot", "models", "cascades", "tables", "pdf_sha256"]:
        assert metrics[k] == data[k], f"metrics.json key {k} does not match report-data.json"

    print(f"Data verified: 7 models, 567 op points, 120 cascade points, 9 tables, 8 chapters, 17 references, PDF SHA {sha[:8]}...")
    return {
        "models": len(data["models"]),
        "operating_points": op_points,
        "cascade_operating_points": casc_points,
        "tables": len(tables),
        "chapters": len(data["chapters"]),
        "references": len(data["references"]),
        "pdf_sha256": sha,
    }


def verify_ablation() -> dict:
    data = json.loads((ROOT / "public/report/context-ablation.json").read_text())
    assert re.fullmatch(r"[a-f0-9]{64}", data["source"]["sha256"])
    ci = data["protocol"]["confidence_interval"]
    assert ci["level"] == 0.95 and ci["resamples"] == 2000
    assert ci["seed"] == 20261115 and not ci["language_stratified"]
    expected_models = ["Pikaia-Turn", "Pikaia-Turn-Mini", "Pikaia-Turn-Nano"]
    count = 0
    for key, n in (("response_ready", 842), ("floor_end", 1058)):
        cohort = data["cohorts"][key]
        assert cohort["n"] == n == cohort["eot"] + cohort["hold"]
        assert set(cohort["cutoffs"]) == {"300ms", "600ms"}
        for rows in cohort["cutoffs"].values():
            assert [row["model"] for row in rows] == expected_models
            for row in rows:
                for condition in ("with_text", "audio_only"):
                    point = row[condition]
                    assert point["eot"] == cohort["eot"] and point["hold"] == cohort["hold"]
                    assert abs(point["recall_pct"] - point["tp"] / point["eot"] * 100) <= 0.0051
                    assert abs(point["fpr_pct"] - point["fp"] / point["hold"] * 100) <= 0.0051
                    assert point["fp"] <= point["allowed_fp"] == int(point["hold"] * 0.05)
                delta = row["audio_only"]["recall_pct"] - row["with_text"]["recall_pct"]
                assert abs(delta - row["delta_recall_pp"]) <= 0.011
                lo, hi = row["ci95_pp"]
                assert -30 <= lo <= row["delta_recall_pp"] <= hi <= 30, "Interval is clipped by the chart domain"
                assert lo < 0 < hi, "Update the zero-crossing takeaway if new evidence changes it"
                count += 1
    assert count == 12
    print("Ablation verified: 12 paired results, bootstrap metadata, FP budgets, delta signs and full interval bounds.")
    return {"ablation_paired_results": count}


class PageParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids: List[str] = []
        self.links: List[str] = []
        self.assets: List[str] = []
        self.skip = 0
        self.text: List[str] = []
        self.result_tables = {}
        self.result_split = None
        self.result_row = None
        self.result_cell = None
        self.ablation_panels = {}
        self.ablation_rows = {}
        self.ablation_cohort = None
        self.ablation_model = None
        self.ablation_depth = 0
        self.ablation_text = []
        self.detail_open = {}

    def handle_starttag(self, tag: str, attrs: List[tuple[str, str | None]]) -> None:
        a = dict(attrs)
        if tag == "details" and a.get("id"):
            self.detail_open[a["id"]] = "open" in a
        if tag == "figure" and a.get("data-ablation-cohort"):
            self.ablation_cohort = a["data-ablation-cohort"]
            self.ablation_panels[self.ablation_cohort] = a["data-cutoff"]
        if tag == "div" and self.ablation_depth:
            self.ablation_depth += 1
        if a.get("data-ablation-model"):
            self.ablation_model = a["data-ablation-model"]
            self.ablation_text = []
            self.ablation_depth = 1
        if tag == "table" and a.get("data-results-split"):
            self.result_split = a["data-results-split"]
            self.result_tables[self.result_split] = []
        if self.result_split and tag == "tr":
            self.result_row = []
        if self.result_split and tag in ("td", "th"):
            self.result_cell = []
        if tag in ["script", "style"]:
            self.skip += 1
        if "id" in a and a["id"]:
            self.ids.append(a["id"])
        if "href" in a and a["href"]:
            self.links.append(a["href"])
        if tag == "img" and "src" in a and a["src"]:
            self.assets.append(a["src"])

    def handle_endtag(self, tag: str) -> None:
        if tag == "div" and self.ablation_depth:
            self.ablation_depth -= 1
            if not self.ablation_depth:
                self.ablation_rows[(self.ablation_cohort, self.ablation_model)] = "".join(self.ablation_text)
        if tag == "figure":
            self.ablation_cohort = None
        if self.result_split:
            if tag in ("td", "th") and self.result_cell is not None:
                self.result_row.append("".join(self.result_cell).strip())
                self.result_cell = None
            elif tag == "tr" and self.result_row is not None:
                self.result_tables[self.result_split].append(self.result_row)
                self.result_row = None
            elif tag == "table":
                self.result_split = None
        if tag in ["script", "style"]:
            self.skip = max(0, self.skip - 1)

    def handle_data(self, data: str) -> None:
        if self.ablation_depth:
            self.ablation_text.append(data)
        if self.result_cell is not None:
            self.result_cell.append(data)
        if not self.skip:
            self.text.append(data)


def verify_server(origin: str) -> Dict[str, Any]:
    """Fetch root HTML and all served assets from running server."""
    fetch = build_opener(ProxyHandler({}))
    url = origin.rstrip("/")
    res = fetch.open(url, timeout=30)
    assert res.status == 200, f"Server returned status {res.status}"
    html = res.read().decode("utf-8")

    parser = PageParser()
    parser.feed(html)

    # 1. Duplicate IDs
    id_counts = Counter(parser.ids)
    duplicates = [i for i, c in id_counts.items() if c > 1]
    assert not duplicates, f"Duplicate HTML IDs found: {duplicates}"

    # 2. Internal # links
    id_set = set(parser.ids)
    broken_links = [h for h in parser.links if h.startswith("#") and h != "#" and h[1:] not in id_set]
    assert not broken_links, f"Broken internal anchor links found: {broken_links}"

    # 3. Macro escapes
    full_text = " ".join(parser.text)
    latex_matches = re.findall(r"\\[a-zA-Z]+", full_text)
    # Filter known valid MathML or math entities if any
    raw_macros = [m for m in latex_matches if m in (r"\cite", r"\cref", r"\label", r"\textbf", r"\emph", r"\section", r"\begin", r"\end")]
    assert not raw_macros, f"Unrendered LaTeX macros in text: {raw_macros}"

    # 4. Required sections, tables, figures
    for i in range(1, 9):
        assert f"chapter-{i}" in id_set, f"Missing chapter-{i} in page IDs"
    for i in range(1, 10):
        assert f"table-{i}" in id_set, f"Missing table-{i} in page IDs"
    for i in range(1, 5):
        assert f"figure-{i}" in id_set, f"Missing figure-{i} in page IDs"

    # Two visible cohort panels and the retained private-holdout table must
    # render the source values for their own split, in the same model order.
    for panel in ("results-research-test", "results-full-pool"):
        assert panel in id_set, f"Missing evaluation chart panel: {panel}"
    assert "100 development items" in full_text
    source = json.loads((ROOT / "app/report-data.json").read_text())
    models = sorted(source["models"], key=lambda m: -m["splits"]["test_1100"]["300ms"]["overall"]["operating"]["5"]["recall"])
    for split in ("test_1100", "full_2338", "test_private_1138"):
        expected = []
        for model in models:
            point = model["splits"][split]["300ms"]["overall"]
            op = point["operating"]["5"]
            expected.append([model["name"], f"{point['auc']:.4f}", f"{op['recall'] * 100:.2f}%", f"{op['fpr'] * 100:.2f}%"])
        assert parser.result_tables.get(split, [])[1:] == expected, f"Rendered result values or model order differ for {split}"

    # The main ablation and collapsed supplement must both contain exact
    # values before hydration; interval interpretation must not rely on hover.
    assert parser.ablation_panels == {"response_ready": "300ms", "floor_end": "300ms"}
    assert parser.detail_open.get("ablation-floor-end") is False
    ablation = json.loads((ROOT / "public/report/context-ablation.json").read_text())
    for key, cohort in ablation["cohorts"].items():
        for row in cohort["cutoffs"]["300ms"]:
            rendered = parser.ablation_rows[(key, row["model"])]
            numbers = [float(s.replace("−", "-")) for s in re.findall(r"[+−]?\d+\.\d{2}", rendered)]
            assert numbers == [row["with_text"]["recall_pct"], row["audio_only"]["recall_pct"], row["delta_recall_pp"], *row["ci95_pp"]]

    # 5. Check all assets
    assets = set(parser.assets + [h for h in parser.links if h.startswith("/report/") or h.startswith("/fonts/") or h.startswith("/art/")])
    # Add explicit assets
    assets.update([
        "/report/pikaia-interview-eou-benchmark.pdf",
        "/report/metrics.json",
        "/report/citation.bib",
        "/fonts/InterVariable.woff2",
        "/fonts/Manrope-200.ttf",
        "/fonts/Manrope-400.ttf",
        "/fonts/Manrope-600.ttf",
    ])

    for a in assets:
        if not a.startswith("/"):
            continue
        asset_url = url + a
        a_res = fetch.open(asset_url, timeout=30)
        assert a_res.status == 200, f"Asset returned {a_res.status}: {asset_url}"
        cl = int(a_res.headers.get("content-length", 1))
        assert cl > 0, f"Asset empty: {asset_url}"
        if a.endswith(".pdf"):
            magic = a_res.read(4)
            assert magic == b"%PDF", f"Invalid PDF header on {a}: {magic}"
        elif a.endswith(".json"):
            json.loads(a_res.read().decode("utf-8"))

    print(f"Server verified: {url} served HTML (0 duplicate IDs, 0 broken anchors, 0 raw macros) and {len(assets)} assets with HTTP 200.")
    return {
        "origin": origin,
        "assets_verified": len(assets),
        "evaluation_chart_panels": 2,
        "result_tables_verified": len(parser.result_tables),
        "ablation_chart_panels": len(parser.ablation_panels),
        "ablation_rows_verified": len(parser.ablation_rows),
        "floor_end_collapsed": True,
        "duplicate_ids": 0,
        "broken_internal_links": 0,
    }


def main():
    origin = sys.argv[1] if len(sys.argv) > 1 else None

    print("=== Running Pikaia Report Verification ===")
    scanned_files = verify_hygiene()
    data_summary = verify_data()
    ablation_summary = verify_ablation()

    server_summary = {}
    if origin:
        server_summary = verify_server(origin)

    summary = {
        "scanned_files": scanned_files,
        **data_summary,
        **ablation_summary,
        **server_summary,
    }

    out_dir = ROOT / "outputs"
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "verification.json").write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    print("Verification completed successfully.")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
