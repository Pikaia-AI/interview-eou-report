'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';

const PAIRED_ROWS = [
  { model: 'Pikaia-Turn-Mini (0.6B)', r300: '87.02%', r600: '89.85%', delta: '+2.83 pp', family: true },
  { model: 'Pikaia-Turn (2.3B)', r300: '83.86%', r600: '88.35%', delta: '+4.49 pp', family: true },
  { model: 'Turn-1 (2.8B, +Text)', r300: '83.53%', r600: '87.19%', delta: '+3.66 pp', family: false },
  { model: 'Smart Turn v3.2-Interview (8M)', r300: '61.23%', r600: '54.41%', delta: '−6.82 pp', family: true },
  { model: 'Smart Turn v3.2 (8M, zero-shot)', r300: '39.93%', r600: '42.76%', delta: '+2.83 pp', family: false },
  { model: 'Turn-1-Mini (5.3M, zero-shot)', r300: '19.47%', r600: '29.45%', delta: '+9.98 pp', family: false },
];

const PROVENANCE_ROWS = [
  { model: 'Pikaia-Turn-Mini (0.6B)', gold: '.9771', causal: '.9478', historical: '.9707', family: true },
  { model: 'Pikaia-Turn (2.3B)', gold: '.9696', causal: '.9427', historical: '.9795', family: true },
  { model: 'Turn-1 (2.8B, zero-shot)', gold: '.9568', causal: '.9233', historical: '.9789', family: false },
  { model: 'Smart Turn v3.2 (8M)', gold: '.8556', causal: '.7845', historical: '.8922', family: false },
  { model: 'Turn-1-Mini (5.3M)', gold: '.8367', causal: '.7027', historical: '.9022', family: false },
];

const CALIBRATION = {
  fp0: {
    label: 'Strict zero-FP dev (FP_dev = 0)',
    badge: 'Pikaia-Turn 51.29% @ 0.74% FPR',
    note: 'Ultra-conservative deployment thresholds locked with zero false positives on the 100-item dev split (17 ZH / 18 EN HOLDs) and applied unadjusted to unseen speakers.',
    rows: [
      { model: 'Pikaia-Turn (2.3B)', t2Rec: '51.29%', t2Fpr: '0.74%', t3Rec: '43.51%', t3Fpr: '1.02%', family: true },
      { model: 'Pikaia-Turn-Mini (0.6B)', t2Rec: '42.96%', t2Fpr: '1.73%', t3Rec: '38.55%', t3Fpr: '1.53%', family: true },
      { model: 'Turn-1 (2.8B, zero-shot)', t2Rec: '21.55%', t2Fpr: '0.50%', t3Rec: '18.61%', t3Fpr: '0.26%', family: false },
      { model: 'Turn-1-Mini (5.3M)', t2Rec: '30.32%', t2Fpr: '3.96%', t3Rec: '33.60%', t3Fpr: '5.63%', family: false },
      { model: 'Smart Turn v3.2 (8M)', t2Rec: '25.72%', t2Fpr: '3.22%', t3Rec: '17.94%', t3Fpr: '2.30%', family: false },
    ],
  },
  fp1: {
    label: 'Practical dev budget (FP_dev ≤ 1)',
    badge: 'Pikaia-Turn 77.73% · Mini 73.13%',
    note: 'One allowed HOLD false positive per language on dev (~5.7% nominal budget). Pikaia server models stay near target FPR on both unseen test tiers, while Smart Turn v3.2 drifts to 12.62% FPR from upper-tail score clustering.',
    rows: [
      { model: 'Pikaia-Turn (2.3B)', t2Rec: '77.73%', t2Fpr: '5.20%', t3Rec: '72.69%', t3Fpr: '6.14%', family: true },
      { model: 'Pikaia-Turn-Mini (0.6B)', t2Rec: '73.13%', t2Fpr: '4.21%', t3Rec: '66.53%', t3Fpr: '3.84%', family: true },
      { model: 'Turn-1 (2.8B, zero-shot)', t2Rec: '70.40%', t2Fpr: '3.96%', t3Rec: '66.27%', t3Fpr: '5.88%', family: false },
      { model: 'Smart Turn v3.2 (8M)', t2Rec: '65.09%', t2Fpr: '12.62%', t3Rec: '56.63%', t3Fpr: '9.46%', family: false },
      { model: 'Turn-1-Mini (5.3M)', t2Rec: '39.66%', t2Fpr: '6.68%', t3Rec: '40.70%', t3Fpr: '6.91%', family: false },
    ],
  },
} as const;

export function DiagnosticsV4() {
  const [calMode, setCalMode] = useState<'fp0' | 'fp1'>('fp0');
  const activeCal = CALIBRATION[calMode];

  return (
    <div className="v4diag-wrap" id="diagnostics" aria-labelledby="v4diag-title">
      <div className="v4m-proof-deck">
        <div className="v4m-proof-head">
          <div>
            <p className="v4m-proof-eyebrow">DEEP EVALUATION DIAGNOSTICS · WINDOW PHYSICS, PROVENANCE &amp; CALIBRATION</p>
            <h3 id="v4diag-title">What lies underneath the headline Pareto curves</h3>
          </div>
          <a className="v4m-proof-dl" href="/report/v2-supplementary.json" download>
            Supplementary tables JSON <Download size={13} aria-hidden="true"/>
          </a>
        </div>

        {/* Row 1: 2-Column Rolling Window + Zero-Circularity Provenance */}
        <div className="v4g-grid">
          <article className="v4g-chamber">
            <div className="v4m-proof-topline">
              <span>01 · 300 → 600 MS WINDOW PHYSICS (N = 788 PAIRS)</span>
              <strong className="tone-lilac">209 prefix · 579 sliding</strong>
            </div>
            <h4>Same-sample 300 ms vs. 600 ms &amp; the 8.0 s rolling cap</h4>
            <p className="v4g-sub">
              Unpaired 300 ms items (N = 312) are heavily HOLD-enriched (69.6% HOLD, speakers resumed before 600 ms), so timing comparisons must stay strictly on the exact N = 788 paired turns. Waiting to 600 ms lifts Pikaia server models (+2.8 to +4.5 pp), whereas 8.0 s fixed-window audio models behave differently across short prefixes vs. rolling windows.
            </p>
            <div className="table-scroll">
              <table className="v4g-table">
                <thead>
                  <tr>
                    <th scope="col">Model (Tier 2 paired N=788)</th>
                    <th scope="col" className="num">300 ms R@5%</th>
                    <th scope="col" className="num">600 ms R@5%</th>
                    <th scope="col" className="num">Δ (600 − 300)</th>
                  </tr>
                </thead>
                <tbody>
                  {PAIRED_ROWS.map(row => (
                    <tr key={row.model} className={row.family ? 'is-family' : ''}>
                      <th scope="row">{row.model}</th>
                      <td className="num">{row.r300}</td>
                      <td className="num">{row.r600}</td>
                      <td className="num">{row.delta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="v4diag-callout">
              <strong>Why 8.0 s capping matters:</strong> On the 209 shorter pure-prefix turns (&lt;7.7 s, zero left truncation), Turn-1 (+Text) rises <code>81.88% → 92.62%</code> (+10.74 pp) and Turn-1-Mini rises <code>29.53% → 42.28%</code> (+12.75 pp). On the 579 capped 8.0 s turns where advancing 300 ms drops ≤300 ms of earliest audio off the left edge, streaming Turn-1-Mini drops <code>−10.17 pp</code> (<code>45.13% → 34.96%</code>), whereas speech-LLM detectors stay resilient (<code>84.07% → 86.73%</code>).
            </div>
          </article>

          <article className="v4g-chamber">
            <div className="v4m-proof-topline">
              <span>02 · ZERO-CIRCULARITY GOLD &amp; PROVENANCE STRATA</span>
              <strong className="tone-cyan">Mini .9771 · Turn .9696 Gold</strong>
            </div>
            <h4>Rankings hold on pure dual-human blind-agreed Gold</h4>
            <p className="v4g-sub">
              To test whether LLM consensus labeling biases rankings, we stratify full-pool 300 ms ROC-AUC separately across the 77-item pure dual-human blind-agreed Gold subset (zero LLM circularity), 956 strictly causal-labeled items, and 1,382 historical items.
            </p>
            <div className="table-scroll">
              <table className="v4g-table">
                <thead>
                  <tr>
                    <th scope="col">Model (300 ms ROC-AUC)</th>
                    <th scope="col" className="num">Blind Gold (77)</th>
                    <th scope="col" className="num">Causal (956)</th>
                    <th scope="col" className="num">Historical (1,382)</th>
                  </tr>
                </thead>
                <tbody>
                  {PROVENANCE_ROWS.map(row => (
                    <tr key={row.model} className={row.family ? 'is-family' : ''}>
                      <th scope="row">{row.model}</th>
                      <td className="num">{row.gold}</td>
                      <td className="num">{row.causal}</td>
                      <td className="num">{row.historical}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="v4diag-callout">
              <strong>Zero LLM circularity confirmed:</strong> On pure blind-agreed human gold judgments (κ = 0.8024 across 91 definitive audit pairs), Pikaia-Turn-Mini (<code>.9771</code>) and Pikaia-Turn (<code>.9696</code>) widen their lead over zero-shot Turn-1 (<code>.9568</code>) and exceed compact audio baselines by +11.4 to +14.0 AUC points across every provenance tier.
            </div>
          </article>
        </div>

        {/* Row 2: Full Out-of-Sample Deployment Calibration (FP_dev = 0 vs FP_dev <= 1) */}
        <div className="v4diag-cal">
          <div className="v4diag-cal-head">
            <div>
              <div className="v4m-proof-topline">
                <span>03 · OUT-OF-SAMPLE DEPLOYMENT CALIBRATION (TIER 1 DEV → TIER 2 &amp; TIER 3)</span>
                <strong className="tone-lilac">{activeCal.badge}</strong>
              </div>
              <h4>Frozen thresholds on unseen speakers — zero-FP strict vs. practical budget</h4>
            </div>
            <div className="v4r-seg" role="group" aria-label="Select frozen dev calibration rule">
              <button type="button" aria-pressed={calMode === 'fp0'} onClick={() => setCalMode('fp0')}>Strict FP_dev = 0</button>
              <button type="button" aria-pressed={calMode === 'fp1'} onClick={() => setCalMode('fp1')}>Practical FP_dev ≤ 1</button>
            </div>
          </div>
          <p className="v4g-sub">{activeCal.note}</p>
          <div className="table-scroll">
            <table className="v4g-table">
              <thead>
                <tr>
                  <th scope="col">Model ({activeCal.label})</th>
                  <th scope="col" className="num">Tier 2 Recall (1,100)</th>
                  <th scope="col" className="num">Tier 2 Obs. FPR</th>
                  <th scope="col" className="num">Tier 3 Recall (1,138)</th>
                  <th scope="col" className="num">Tier 3 Obs. FPR</th>
                </tr>
              </thead>
              <tbody>
                {activeCal.rows.map(row => (
                  <tr key={row.model} className={row.family ? 'is-family' : ''}>
                    <th scope="row">{row.model}</th>
                    <td className="num">{row.t2Rec}</td>
                    <td className="num">{row.t2Fpr}</td>
                    <td className="num">{row.t3Rec}</td>
                    <td className="num">{row.t3Fpr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
