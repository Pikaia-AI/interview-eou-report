# Pikaia Interview EOU Report

Official companion technical report website for **Pikaia Interview EOU Benchmark v1.0.0**, presenting the **Pikaia-Turn** detector family, controlled **Data × Architecture** ablations, interview fine-tuning of open-weight models, and external benchmark transfer across LiveKit eot-bench, TurnBench Dev, and EasyTurn-800.

The primary benchmark paper (*Pikaia Interview EOU Benchmark: Evaluating Response Readiness in Bilingual Spoken Interviews*) focuses on the public 1,200-item benchmark (76 speaker clusters across Tier 1 `dev` and Tier 2 `test`) and reproducible open-weight baselines. This technical report and companion website document the broader research program, full-pool metrics (2,338 items across 150 clusters), and streaming architecture designs.

## Compare report editions

The original edition opens at `/`, the focused edition at `/v2/`, the research report at `/v3/` and the listening study at `/v4/`. The V3 and V4 headers let readers switch between the two. All editions are available in the footer navigation.

V4 pairs the real listening exercise with a public-test readout. Each dot represents one labeled decision for Pikaia-Turn on the bilingual 300 ms slice at a 5% HOLD false-positive budget. The readout uses `app/report-data.json`. The full result tables, interactive timing curves, ablations, transfer measurements and access links use the same components as V3.

To pair the report with a local V4 homepage, run `NEXT_PUBLIC_COMPANY_V4_URL=http://127.0.0.1:5197/v4/ npm run build` and `npm start -- --port 5198`. Open `http://127.0.0.1:5198/v4`. Selecting V3 returns to the previous edition on the same server.

The V3 listening task uses the same speaker at two points in a real English conversation about travel. The Agentic Data Company published the recording in Open Yap 1K. Pikaia selected and labeled these excerpts for the listening exercise. [Original recording and annotations](https://theagenticdatacompany.com/research/turn-taking#why-turn-taking-is-hard) · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

The two decision clips in `public/report/examples/` come from the original speaker channel. Case A covers 0.000–1.824 s, ending inside a hesitation. Case B covers 7.000–10.572 s, ending before the listener answers. Each includes 300 ms of the recorded pause.

After choosing, readers can hear the next two seconds of the same recording. Each continuation starts at the first sample after its decision clip. Both voices play in the center. The expanded timeline shows the two original speaker channels at the same amplitude scale, with playback revealing the waveform past the decision. The reduced-motion view shows both tracks immediately.

`app/v3/listening-examples.json` holds the source link, checksums, timing and measured waveforms. To reproduce the continuations and channel peaks, run `python3 scripts/import-listening-continuations.py path/to/turn-end-question.m4a` with FFmpeg installed. The script checks the published recording's hash and each decision clip against the original speaker channel.

V2 makes the timing explorer visible by default and removes the duplicate cascade controls, ranking-change banners and eight-chapter transcript from its reading path. It keeps the public/full result pair, the Response-ready ablation with confidence intervals, collapsed Floor-end details, and explicit data/threshold limitations. Model cards show comparable specifications; training history and external controls are supplementary. The original experiment values are unchanged.

V2 links three timing charts to the same budget: our Pikaia benchmark's paired subset (1,700), the original LiveKit Floor-end pairs (1,058), and our Response-ready relabeling of eligible LiveKit pairs (842). The Smart Turn transfer section reports the 3,891-example audio-only fine-tuning experiment on both benchmarks. The reference ranks replace Smart Turn in a fixed roster for each metric; the LiveKit ranks use the archived leaderboard and local harness results.

The benchmark PDF and companion experiment tables have separate scopes and numbering. `public/report/v2-supplementary.json` preserves calibration, transfer and training controls plus the additional paired cohorts. `public/report/v2-source-manifest.json` pins the displayed sources by checksum and records the unresolved Turn-1 full-pool Wait@5% discrepancy (archived main table: 412.7 ms; sampled curve: 411.4 ms). Both editions retain the curve source; this presentation change does not silently reconcile historical values.

Run `python3 scripts/check-report-v2.py http://127.0.0.1:5188` alongside the original report check to verify the focused report route, default-visible timing plots, value parity with V1, resources and source checksums. These are HTTP/data checks, not browser visual or pointer-interaction acceptance tests.

## Benchmark Tiers & Access

The access section at `/v3#access` links both gated Hugging Face splits and the ONNX and safetensors files for Pikaia’s released Smart Turn v3.2-Interview checkpoint. Pikaia-Turn family inquiries open a public issue draft in this report’s GitHub repository.

| Tier | Split | Access | ZH | EN | Total | Clusters | 600 ms Pairs | WAV Files | Link |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Tier 1** | `dev` | Auto-gated | 50 | 50 | 100 | 11 | 75 | 237 | [Hugging Face](https://huggingface.co/datasets/pikaia-ai/interview-eou-benchmark) |
| **Tier 2** | `test` | Academic gated | 500 | 600 | 1,100 | 65 | 788 | 2,574 | [Hugging Face Research](https://huggingface.co/datasets/pikaia-ai/interview-eou-benchmark-research) |
| **Tier 3** | `test_private` | Private holdout | 428 | 710 | 1,138 | 74 | 837 | 2,648 | Private |
| **Full** | Combined | Unified evaluation | 978 | 1,360 | 2,338 | 150 | 1,700 | 5,459 | — |

## Pikaia-Turn Model Family

- **Pikaia-Turn (2.3B)**: Flagship dual-backbone server detector with cross-modal adaptation, speech-boundary prosody, and prompt-conditioned fusion. Reaches **0.9658** Tier 2 ROC-AUC and **84.48%** recall @ 5% FPR.
- **Pikaia-Turn-Mini (0.6B)**: Standalone single-backbone server detector (~25% parameter footprint of flagship) with strong 600 ms discrimination (**0.9680** Full 600 ms ROC-AUC, **395.3 ms** Full cascade Wait@5%).
- **Pikaia-Turn-Nano (6.7M)**: CPU streaming detector combining a turn-start prompt encoder with running utterance state (**56.03%** Tier 2 recall @ 5% FPR, **+35.77 pp** gain over Turn-1-Mini).

## Training corpus

The model section includes a training-data overview (`#training-data`) for the three displayed Pikaia family checkpoints: **2,025 curated examples + 1,170 new Mandarin examples = 3,195 expanded examples**. The expanded split contains 2,295 Mandarin and 900 English examples, with 2,396 EOT and 799 HOLD labels.

The source mix is 167 examples from an earlier human-reviewed pool, 1,858 from a consensus-reviewed bilingual pool, and 1,170 new Mandarin examples with unanimous three-model labels. The report distinguishes machine consensus from human gold labels, explains the causal inputs and private access scope, and describes the separate 448-item internal validation and 447-item internal test splits. The larger 3,891-example Smart Turn baseline arm is identified separately and is not eligible for those internal splits.

`public/report/training-data-summary.json` contains aggregate statistics and the source-manifest checksum, without individual examples, interview text, participant IDs or audio paths. This overview supplements the website; it does not revise the bundled PDF.

## Evaluation charts

The results section shows two charts with shared language, audio-cutoff and metric controls, a common axis scale, and the same model order:

- **Public research test:** Tier 2, 1,100 items, available through academic gated access on Hugging Face. The 100 development/calibration items are excluded.
- **Full evaluation pool:** 2,338 items across all three tiers, including development and the private holdout. This is aggregate analysis, not an independent held-out test or a fully public dataset.

Each chart displays the current slice size and supports exact values and CSV export. Paired subsets contain 788 Tier 2 items and 1,700 full-pool items before language filtering. Private-holdout values remain available in a separate disclosure. This presentation update retains the existing Pikaia-Turn, Mini and Nano models and the report's baseline comparisons.

## Native research figures

Figure 2 (`#figure-2`) renders shared-axis waiting-time / false-cut-off frontiers with family/baseline line styles and model highlighting. A shared false-cut-off budget defaults to 5% and can be changed by dragging the horizontal line in any panel, moving the range slider, or entering a number (Enter or blur applies it). V1 also offers preset buttons. All visible plots and model readouts update together. The controls cover 0.5–15% in the source's 0.25 percentage-point steps and select recorded operating points. Tables distinguish the chosen budget from the observed cut-off rate. The line supports pointer capture, touch dragging, arrow keys, Page Up/Down and Home/End. The display clips at 15% false cut-offs. The downloadable data retains all 1,422 sampled points across the three cohorts. The waiting times include the 1,000 ms fallback.

Figure 3 (`#figure-3`) is in the collapsed appendix. It uses an AUC matrix for the four overlapping provenance groups and paired recall bars for the two LiveKit objectives, with an explicit explanation that both labels and eligible samples change. The matrix does not connect categorical groups with a trend line. The causal column is described as the report's mixed provenance group, rather than claiming uniform annotation conditions.

`public/report/figure-data.json` records source checksums and the aggregate values. Frontier operating points and provenance-subset values were matched to the current report. The full-benchmark AUC column uses the current `metrics.json`: the old supplement's Turn-1 AUC of 0.955024 is aligned to 0.954290, with that adjustment recorded in the data provenance. No model is rerun.

All original paper figures remain available as PDF/PNG downloads; paper rasters are no longer embedded in the website. Figure 1's ROC attachment and Figure 4's EasyTurn attachment remain in the appendix alongside the full source tables.

## Preceding-question text ablation

The main narrative uses the final Pikaia-Turn / Mini / Nano names. The complete training-size controls (Table 8), EasyTurn-800 transfer table (Table 9) and original EasyTurn figure (Figure 4) are retained in the collapsed **Supplementary experiments** appendix under Paper & resources (`#supplementary-experiments`). Links to their original anchors automatically reveal the appendix. This keeps the primary story focused while preserving the intermediate checkpoints and out-of-domain limitations.

The end of the ablation section (`#context-ablation`) compares the same three Pikaia family checkpoints with and without the preceding agent question. Neither condition uses user ASR, and weights and audio remain fixed.

The main chart shows **Response-ready** on 842 LiveKit items. **Floor-end** on 1,058 items is collapsed under supplementary details. Paired horizontal bars show recall with the question versus audio only on a common zero-based 0–100% scale. Each row includes a compact difference plot and the exact 95% confidence interval; those plots share a symmetric −30 to +30 percentage-point scale. A shared control switches both cohorts between 300 and 600 ms. Differences are audio-only minus with-question recall at an empirical ≤5% HOLD FPR; intervals use paired session-cluster percentile bootstrap (2,000 resamples, seed 20261115, no language stratification). Thresholds are selected separately for each input condition and cutoff. All six recall-difference intervals per cohort cross zero; this does not establish either a reliable context benefit or input equivalence.

`public/report/context-ablation.json` contains the 12 paired results, observed operating points and original summary checksum from the 15 November 2026 experiment. This additional web analysis is separate from the bundled report PDF. Exact recalls, differences and interval bounds are rendered as text alongside the chart, including before client hydration; on narrow screens, each model’s paired bars and uncertainty summary stack vertically.

## Run & Verify Locally

Requires Node.js 22.13 or newer and Python 3.

```sh
# Install dependencies
npm install

# Start development server
npm run dev -- --port 5188 --hostname 127.0.0.1

# Type checking & linting
npx tsc --noEmit
npx eslint app/report-page.tsx app/report-ui.tsx app/layout.tsx app/page.tsx

# Production build
npm run build

# Standalone repository hygiene and data verification
python3 scripts/check-report.py

# Verify against a running server instance
python3 scripts/check-report.py http://127.0.0.1:5188
```

## Repository Structure

- `app/`: Next.js / Vinext application source (`report-page.tsx`, `report-ui.tsx`, `report.css`, `layout.tsx`, `report-data.json`).
- `public/report/`: Bundled research artifacts:
  - `pikaia-interview-eou-benchmark.pdf`: 17-page benchmark paper.
  - `metrics.json`: Full aggregate metrics and cascade operating points.
  - `context-ablation.json`: Paired question-text ablation results and confidence intervals.
  - `training-data-summary.json`: Aggregate private training-corpus statistics and provenance.
  - `figure-data.json`: Native frontier, provenance and objective-shift chart data with source checksums.
  - `citation.bib`: Companion BibTeX citations.
  - `fig1`..`fig4`: High-resolution figures (PDF and PNG).
- `scripts/`:
  - `check-report.py`: Standalone verification and zero-leak scanner.
  - `import-report.py`: LaTeX report importer.

## Citation

```bibtex
@article{pikaia2026intervieweou,
  author = {{Pikaia AI Research}},
  title = {Pikaia Interview EOU Benchmark: Evaluating Response Readiness in Bilingual Spoken Interviews},
  journal = {arXiv preprint},
  year = {2026},
  url = {https://huggingface.co/datasets/pikaia-ai/interview-eou-benchmark}
}

@techreport{pikaia2026turntechreport,
  author = {{Pikaia AI Research}},
  title = {Pikaia-Turn: Technical Report on Causal Turn Detection, Cross-Modal Architectures, and External Benchmark Transfer},
  institution = {Pikaia AI},
  year = {2026},
  month = {November},
  url = {https://github.com/Pikaia-AI/interview-eou-report}
}
```
