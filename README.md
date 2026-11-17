# Pikaia Interview EOU Report

Official companion technical report website for **Pikaia Interview EOU Benchmark v1.0.0**, presenting the **Pikaia-Turn** detector family, controlled **Data × Architecture** ablations, interview fine-tuning of open-weight models, and external benchmark transfer across LiveKit eot-bench, TurnBench Dev, and EasyTurn-800.

The primary benchmark paper (*Pikaia Interview EOU Benchmark: Evaluating Response Readiness in Bilingual Spoken Interviews*) focuses on the public 1,200-item benchmark (76 speaker clusters across Tier 1 `dev` and Tier 2 `test`) and reproducible open-weight baselines. This technical report and companion website document the broader research program, full-pool metrics (2,338 items across 150 clusters), and streaming architecture designs.

## Benchmark Tiers & Access

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

## Evaluation charts

The results section shows two charts with shared language, audio-cutoff and metric controls, a common axis scale, and the same model order:

- **Public research test:** Tier 2, 1,100 items, available through academic gated access on Hugging Face. The 100 development/calibration items are excluded.
- **Full evaluation pool:** 2,338 items across all three tiers, including development and the private holdout. This is aggregate analysis, not an independent held-out test or a fully public dataset.

Each chart displays the current slice size and supports exact values and CSV export. Paired subsets contain 788 Tier 2 items and 1,700 full-pool items before language filtering. Private-holdout values remain available in a separate disclosure. This presentation update retains the existing Pikaia-Turn, Mini and Nano models and the report's baseline comparisons.

## Preceding-question text ablation

The end of the ablation section (`#context-ablation`) compares the same three Pikaia family checkpoints with and without the preceding agent question. Neither condition uses user ASR, and weights and audio remain fixed.

The main chart shows **Response-ready** on 842 LiveKit items. **Floor-end** on 1,058 items is collapsed under supplementary details. A shared 300 / 600 ms control and a symmetric −30 to +30 percentage-point axis keep comparisons consistent. Points show audio-only minus with-question recall at an empirical ≤5% HOLD FPR; whiskers show paired session-cluster 95% percentile bootstrap intervals (2,000 resamples, seed 20261115, no language stratification). Thresholds are selected separately for each input condition and cutoff. All six recall-difference intervals per cohort cross zero; this does not establish either a reliable context benefit or input equivalence.

`public/report/context-ablation.json` contains the 12 paired results, observed operating points and original summary checksum from the 15 November 2026 experiment. This additional web analysis is separate from the bundled report PDF. Exact recalls, differences and interval bounds are rendered as text alongside the chart, including before client hydration; on narrow screens, labels and values sit above each interval.

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
