'use client';

import { useState } from 'react';
import { ChevronDown, Download } from 'lucide-react';
import data from '../public/report/context-ablation.json';

type Cutoff = '300ms' | '600ms';
type Cohort = keyof typeof data.cohorts;
const ticks = [-30, -20, -10, 0, 10, 20, 30];
// One symmetric scale for both cutoffs and both label objectives.
const position = (value: number) => ((value + 30) / 60) * 100;
const signed = (value: number) => `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value).toFixed(2)}`;

function IntervalChart({ cohortKey, cutoff }: { cohortKey: Cohort; cutoff: Cutoff }) {
  const cohort = data.cohorts[cohortKey];
  const rows = cohort.cutoffs[cutoff];
  const titleId = `ablation-${cohortKey}-title`;

  return <figure className="context-ablation-chart" aria-labelledby={titleId} data-ablation-cohort={cohortKey} data-cutoff={cutoff}>
    <figcaption>
      <h4 id={titleId}>{cohort.title}<span>{cutoff === '300ms' ? '300 ms' : '600 ms'} audio cutoff</span></h4>
      <p>LiveKit · N={cohort.n.toLocaleString('en-US')} · {cohort.eot} EOT / {cohort.hold} HOLD · Mandarin + English</p>
    </figcaption>
    <div className="ablation-key">
      <span><i className="ablation-key-dot" aria-hidden="true"/>Point estimate</span>
      <span><i className="ablation-key-line" aria-hidden="true"/>95% confidence interval</span>
      <span>Recall: with question → audio only</span>
    </div>
    <p className="ablation-axis-title">Change in recall · audio only − with question · percentage points</p>
    <div className="ablation-grid ablation-axis" aria-hidden="true">
      <div className="ablation-ticks">{ticks.map(tick => <span key={tick} style={{ left: `${position(tick)}%` }}>{tick > 0 ? '+' : ''}{tick}</span>)}</div>
    </div>
    <div className="ablation-rows">
      {rows.map(row => <div className="ablation-grid ablation-row" key={row.model} data-ablation-model={row.model}>
        <div className="ablation-model">
          <strong>{row.model}</strong>
          <span><span className="sr-only">Recall with question: </span>{row.with_text.recall_pct.toFixed(2)}% <span aria-hidden="true">→</span> <span className="sr-only">Recall with audio only: </span>{row.audio_only.recall_pct.toFixed(2)}%</span>
        </div>
        <div className="ablation-interval" aria-hidden="true">
          <svg viewBox="0 0 600 44" preserveAspectRatio="none" focusable="false">
            {ticks.map(tick => <line key={tick} x1={position(tick) * 6} x2={position(tick) * 6} y1="0" y2="44" className={tick === 0 ? 'ablation-zero' : 'ablation-gridline'}/>)}
            <line x1={position(row.ci95_pp[0]) * 6} x2={position(row.ci95_pp[1]) * 6} y1="22" y2="22" className="ablation-ci"/>
            {row.ci95_pp.map((bound, i) => <line key={i} x1={position(bound) * 6} x2={position(bound) * 6} y1="16" y2="28" className="ablation-ci"/>)}
          </svg>
          <span className="ablation-point" style={{ left: `${position(row.delta_recall_pp)}%` }}/>
        </div>
        <div className="ablation-estimate">
          <strong><span className="sr-only">Change in recall: </span>{signed(row.delta_recall_pp)} <small>pp</small></strong>
          <span><span className="sr-only">95% confidence interval: </span>[{signed(row.ci95_pp[0])}, {signed(row.ci95_pp[1])}]</span>
        </div>
      </div>)}
    </div>
    <div className="ablation-grid ablation-axis-footer" aria-hidden="true">
      <div><span>← Higher recall with question</span><span>Higher recall with audio only →</span></div>
    </div>
  </figure>;
}

export function ContextAblation() {
  const [cutoff, setCutoff] = useState<Cutoff>('300ms');

  return <section className="context-ablation" id="context-ablation" aria-labelledby="context-ablation-title">
    <div className="subsection-heading">
      <div><p className="micro-label">INPUT ABLATION / PRECEDING QUESTION</p><h3 id="context-ablation-title">Does the preceding<br/>question help?</h3></div>
      <p>The same Pikaia checkpoints hear the same user audio. We remove only the agent’s preceding question text, without retraining. Neither input condition uses user ASR. These LiveKit cohorts are separate from the Pikaia research test and full evaluation pool.</p>
    </div>
    <div className="ablation-controls">
      <div><span className="micro-label">AUDIO CUTOFF</span><div className="segmented" role="group" aria-label="Ablation audio cutoff">{(['300ms', '600ms'] as const).map(value => <button key={value} aria-pressed={cutoff === value} aria-controls="ablation-response_ready-title ablation-floor_end-title" onClick={() => setCutoff(value)}>{value === '300ms' ? '300 ms' : '600 ms'}</button>)}</div></div>
      <a className="quiet-button" href="/report/context-ablation.json" download>Download ablation data <Download size={14}/></a>
    </div>
    <p className="sr-only" role="status">Showing {cutoff === '300ms' ? '300 ms' : '600 ms'} for both evaluation objectives.</p>
    <IntervalChart cohortKey="response_ready" cutoff={cutoff}/>
    <div className="ablation-takeaway">
      <h4>Differences remain uncertain.</h4>
      <p>Removing the question lowers recall point estimates for Turn and Mini at both cutoffs; Nano changes little. All six response-ready confidence intervals cross zero. These results establish neither a reliable benefit from the question nor equivalence between the two inputs.</p>
    </div>
    <p className="source-note ablation-method">Metric: recall at an empirical ≤5% HOLD false-positive rate. Each input condition and cutoff selects its own ROC threshold. Intervals are paired session-cluster bootstrap estimates (2,000 resamples; 95% percentile intervals; no language stratification). The 300 / 600 ms settings describe the audio cutoff, not inference time.</p>
    <details className="report-detail ablation-floor-detail" id="ablation-floor-end">
      <summary><span><span className="detail-index">SUPPLEMENTARY</span>Floor-end · the retrospective turn-ending objective</span><ChevronDown size={18}/></summary>
      <p className="body-note">Floor-end asks whether the observed speaking turn ended here. Response-ready asks whether a listener could naturally respond at this point. The floor-end cohort contains 1,058 items; the response-ready cohort contains 842 eligible items. Label objective and cohort membership both differ, so their absolute scores are not directly comparable.</p>
      <IntervalChart cohortKey="floor_end" cutoff={cutoff}/>
      <p className="source-note">The same cutoff control, scale and bootstrap method apply here. All six floor-end recall-difference intervals also cross zero across the two cutoffs.</p>
    </details>
    <p className="source-note ablation-provenance">Additional experiment · 15 November 2026 · Pikaia-Turn / Mini / Nano · <a href="/report/context-ablation.json" download>Paired values, observed FPRs and source checksum <Download size={13}/></a></p>
  </section>;
}
