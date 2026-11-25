"""Check the focused edition's scope, exact values, sources and served links.

HTTP/HTML checks only; this does not exercise browser layout or pointer events.
"""
from __future__ import annotations

import hashlib
from array import array
import importlib.util
import io
import wave
import json
import re
import sys
from collections import Counter
from math import ceil
from pathlib import Path
from urllib.parse import parse_qs, urlsplit
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
        self.scripts = []
        self.transfer_figures = 0
        self.audio_sources = []
        self.open_sections = []
        self.access_links = []
        self.readout_text = []

    def handle_starttag(self, tag, attrs):
        super().handle_starttag(tag, attrs)
        attrs = dict(attrs)
        if tag == "script" and attrs.get("src"):
            self.scripts.append(attrs["src"])
        if tag == "source" and attrs.get("type") == "audio/wav":
            self.audio_sources.append(attrs["src"])
        if tag == "figure" and "v2-transfer-figure" in attrs.get("class", "").split():
            self.transfer_figures += 1
        if tag == "details":
            self.closed_details.append("open" not in attrs)
        if tag == "section":
            self.open_sections.append(attrs.get("id"))
        if tag == "a" and "access" in self.open_sections:
            assert not any(self.closed_details), "Access links must be visible without opening a disclosure"
            self.access_links.append(attrs["href"])
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
        if tag == "section":
            self.open_sections.pop()

    def handle_data(self, data):
        super().handle_data(data)
        if "readout" in self.open_sections:
            self.readout_text.append(data)


def measured_peaks(pcm, bins):
    peaks = [max(map(abs, pcm[i*len(pcm)//bins:(i+1)*len(pcm)//bins])) for i in range(bins)]
    scale = max(peaks)
    return [round(100 * p / scale) for p in peaks]


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
    # A stale preview can serve valid HTML and still return empty WebPs or
    # 404s for the scripts that hydrate its plots. Check the actual V3 GETs.
    v3 = FocusedParser()
    response = fetch.open(origin + "/v3", timeout=30)
    assert "/art/hero-art.webp" not in response.headers.get("Link", ""), "V3 still preloads the photographic cover"
    v3.feed(response.read().decode())
    assert v3.sections == ["results", "latency", "models", "benchmark", "ablations", "paper", "access"]
    assert "desk-heading" in v3.ids and len(v3.ids) == len(set(v3.ids))
    assert all(href[1:] in v3.ids for href in v3.links if href.startswith("#") and href != "#")
    assert v3.result_tables == page.result_tables and v3.frontiers == page.frontiers
    assert v3.ablation_rows == page.ablation_rows and v3.transfer_figures == 2
    assert "#access" in v3.links and "#access-model" in v3.links and not page.access_links
    development = "https://huggingface.co/datasets/pikaia-ai/interview-eou-benchmark"
    model = "https://huggingface.co/pikaia-ai/smart-turn-v3.2-interview"
    assert {development, development + "-research", model}.issubset(v3.access_links)
    files = [u for u in v3.access_links if u.startswith(model + "/resolve/")]
    assert len(files) == 2 and len({u.rsplit("/", 1)[0] for u in files}) == 1
    assert all(re.fullmatch(r"[a-f0-9]{40}", u.split("/")[-2]) for u in files)
    assert {u.rsplit("/", 1)[1] for u in files} == {"smart-turn-v3.2-interview.onnx?download=true", "model.safetensors?download=true"}
    inquiry, = [urlsplit(u) for u in v3.access_links if urlsplit(u).hostname == "github.com"]
    assert inquiry.path == "/Pikaia-AI/interview-eou-report/issues/new"
    assert "Pikaia-Turn" in parse_qs(inquiry.query)["title"][0] and len(v3.access_links) == 6
    urls = set(v3.assets + v3.scripts + [u for u in v3.links if u.startswith("/_next/")])
    urls.add("/art/waveform-art.webp")
    assert "/art/brand-mark.webp" in urls and "/art/hero-art.webp" not in v3.assets
    assert "/art/hero-art.webp" in page.assets  # The focused edition still has its original cover.
    exercise = json.loads((ROOT / "app/v3/listening-examples.json").read_text())
    assert {sample["label"] for sample in exercise["examples"]} == {"Hold", "Respond"}
    assert exercise["source"]["page"] in v3.links and exercise["source"]["licenseUrl"] in v3.links
    assert exercise["pauseMs"] == 300 and exercise["continuationMs"] == 2000
    assert v3.audio_sources == [exercise["examples"][0]["src"]]
    audio_assets = {part["src"]: part for example in exercise["examples"] for part in (example, example["continuation"])}
    recordings = {}
    urls.update(audio_assets)
    assert any(u.endswith(".css") for u in urls) and any(u.endswith(".js") for u in urls)
    for u in sorted(urls):
        res = fetch.open(origin + u, timeout=30)
        payload = res.read()
        assert res.status == 200 and payload, f"Missing or empty V3 resource: {u}"
        mime = res.headers.get_content_type()
        if u.endswith(".webp"):
            assert mime == "image/webp" and payload == (ROOT / "public" / u.lstrip("/")).read_bytes(), u
        elif u.endswith(".wav"):
            assert payload == (ROOT / "public" / u.lstrip("/")).read_bytes() and mime.startswith("audio/"), u
            with wave.open(io.BytesIO(payload)) as audio:
                assert (audio.getnchannels(), audio.getsampwidth(), audio.getframerate()) == (1, 2, 16000)
                assert hashlib.sha256(payload).hexdigest() == audio_assets[u]["sha256"]
                pcm = array("h", audio.readframes(audio.getnframes()))
                if sys.byteorder != "little":
                    pcm.byteswap()
                recordings[u] = pcm
        elif u.endswith(".css"):
            assert mime == "text/css", u
        elif u.endswith(".js"):
            assert mime in {"text/javascript", "application/javascript"}, u

    rate = exercise["sampleRate"]
    for example in exercise["examples"]:
        clip = recordings[example["src"]]
        follow = example["continuation"]
        tail = recordings[follow["src"]]
        assert len(clip) == (example["pauseStartMs"] - example["startMs"] + exercise["pauseMs"]) * rate // 1000
        assert len(tail) == exercise["continuationMs"] * rate // 1000
        assert any(clip[-(exercise["pauseMs"] * rate // 1000):]), "Missing natural pause"
        assert measured_peaks(clip, 100) == example["peaks"]
        left, right = follow["speaker1Peaks"], follow["speaker2Peaks"]
        assert len(left) == len(right) == 160
        # The speakers take separate turns in these clips. The louder channel tracks the audible mix.
        assert [max(a, b) for a, b in zip(left, right)] == measured_peaks(clip + tail, 160)
        after_cutoff = ceil(len(clip) * len(left) / (len(clip) + len(tail)))
        assert (max(left[after_cutoff:]) > max(right[after_cutoff:])) == (example["label"] == "Hold")

    v4 = FocusedParser()
    v4.feed(fetch.open(origin + "/v4/", timeout=30).read().decode())
    assert v4.sections == ["readout", *v3.sections]
    assert len(v4.ids) == len(set(v4.ids))
    assert all(href[1:] in v4.ids for href in v4.links if href.startswith("#") and href != "#")
    assert v3.result_tables == v4.result_tables and v3.frontiers == v4.frontiers
    assert v3.ablation_rows == v4.ablation_rows and v4.transfer_figures == 2
    assert v3.access_links == v4.access_links and v3.audio_sources == v4.audio_sources
    assert "/v4/" in v3.links and "/v3/" in v4.links and "#listen" in v4.links
    readout = "".join(v4.readout_text)
    flagship = next(model for model in report["models"] if model["name"] == "Pikaia-Turn")
    sample = flagship["splits"]["test_1100"]["300ms"]["overall"]
    operating = sample["operating"]["5"]
    for count, total, label in [(operating["tp"], sample["eot"], "detected"),
                                (operating["fp"], sample["hold"], "early responses")]:
        assert f"{100*count/total:.2f}%of {total} " in readout
        assert f"{count} {label}" in readout
    for asset in set(v4.assets + v4.scripts) - urls:
        with fetch.open(origin + asset, timeout=30) as res:
            assert res.status == 200 and res.read(1)
            assert res.headers.get_content_type() != "text/html", asset

    # The access cards use CSS backgrounds, which the HTML image check cannot see.
    styles = []
    for href in sorted({u for u in v4.links if u.startswith("/") and urlsplit(u).path.endswith(".css")}):
        with fetch.open(origin + href, timeout=30) as res:
            assert res.headers.get_content_type() == "text/css", href
            styles.append(res.read().decode())
    for material in ["/art/access-seaglass.webp", "/art/access-amber.webp"]:
        assert any(material in css for css in styles), f"Missing V4 material in served CSS: {material}"
        with fetch.open(origin + material, timeout=30) as res:
            assert res.headers.get_content_type() == "image/webp", material
            assert res.read() == (ROOT / "public" / material.lstrip("/")).read_bytes(), material

    result = {
        "v4_verified_outcomes": 2, "v4_sections": len(v4.sections), "v4_access_materials": 2,
        "v3_resources_checked": len(urls), "v3_transfer_figures": v3.transfer_figures,
        "v3_access_destinations": len(v3.access_links),
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
