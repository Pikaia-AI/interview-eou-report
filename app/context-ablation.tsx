'use client';

import { useState } from 'react';
import { ChevronDown, Download } from 'lucide-react';
import data from '../public/report/context-ablation.json';

type Cutoff = '300ms' | '600ms';
type Cohort = keyof typeof data.cohorts;
const ticks = [-30, 0, 30];
// One symmetric scale for both cutoffs and both label objectives.
const position = (value: number) => ((value + 30) / 60) * 100;
const signed = (value: number) => `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value).toFixed(2)}`;

function IntervalChart({ cohortKey, cutoff, excludeModels = [] }: { cohortKey: Cohort; cutoff: Cutoff; excludeModels?: string[] }) {
  const cohort = data.cohorts[cohortKey];
  const excluded = new Set(excludeModels);
  const rows = excluded.size ? cohort.cutoffs[cutoff].filter(row => !excluded.has(row.model)) : cohort.cutoffs[cutoff];
  const titleId = `ablation-${cohortKey}-title`;

  return <figure className="context-ablation-chart" aria-labelledby={titleId} data-ablation-cohort={cohortKey} data-cutoff={cutoff}>
    <figcaption>
      <h4 id={titleId}>{cohort.title}<span>{cutoff === '300ms' ? '300 ms' : '600 ms'} audio cutoff</span></h4>
      <p>LiveKit · N={cohort.n.toLocaleString('en-US')} · {cohort.eot} EOT / {cohort.hold} HOLD · Mandarin + English</p>
    </figcaption>
    <p className="ablation-metric">Recall at ≤5% false-positive rate <span>Higher is better</span></p>
    <div className="ablation-rows">
      {rows.map(row => <div className="ablation-row" key={row.model} data-ablation-model={row.model}>
        <div className="ablation-model"><strong>{row.model}</strong></div>
        <div className="ablation-comparison">
          <div className="ablation-series with-question"><span>Audio + question</span><div className="ablation-bar-track" aria-hidden="true"><i style={{ width: `${row.with_text.recall_pct}%` }}/></div><b>{row.with_text.recall_pct.toFixed(2)}%</b></div>
          <div className="ablation-series audio-only"><span>Audio only</span><div className="ablation-bar-track" aria-hidden="true"><i style={{ width: `${row.audio_only.recall_pct}%` }}/></div><b>{row.audio_only.recall_pct.toFixed(2)}%</b></div>
        </div>
        <div className="ablation-effect">
          <div className="ablation-effect-summary"><span>Change without question</span><strong>{signed(row.delta_recall_pp)} <small>pp</small></strong></div>
          <div className="ablation-interval" aria-hidden="true">
            <svg viewBox="0 0 600 44" preserveAspectRatio="none" focusable="false">
              {ticks.map(tick => <line key={tick} x1={position(tick) * 6} x2={position(tick) * 6} y1="7" y2="37" className={tick === 0 ? 'ablation-zero' : 'ablation-gridline'}/>)}
              <line x1={position(row.ci95_pp[0]) * 6} x2={position(row.ci95_pp[1]) * 6} y1="22" y2="22" className="ablation-ci"/>
              {row.ci95_pp.map((bound, i) => <line key={i} x1={position(bound) * 6} x2={position(bound) * 6} y1="16" y2="28" className="ablation-ci"/>)}
            </svg>
            <span className="ablation-point" style={{ left: `${position(row.delta_recall_pp)}%` }}/>
          </div>
          <div className="ablation-interval-label"><span>95% CI</span><span>[{signed(row.ci95_pp[0])}, {signed(row.ci95_pp[1])}]</span></div>
        </div>
      </div>)}
    </div>
    <p className="ablation-reading-guide">Bars start at zero on the same 0–100% scale. Change = audio only − audio + question; a negative value favors keeping the question. The small interval plots share a −30 to +30 pp scale, with zero marked at the center.</p>
  </figure>;
}

export function ContextAblation({ excludeModels = [] }: { excludeModels?: string[] } = {}) {
  const [cutoff, setCutoff] = useState<Cutoff>('300ms');
  const hidesNano = excludeModels.includes('Pikaia-Turn-Nano');

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
    <IntervalChart cohortKey="response_ready" cutoff={cutoff} excludeModels={excludeModels}/>
    <div className="ablation-takeaway">
      <h4>Differences remain uncertain.</h4>
      <p>{hidesNano ? 'Removing the question lowers recall point estimates for Pikaia-Turn and Pikaia-Turn-Mini at both cutoffs, while all four response-ready confidence intervals cross zero. These results establish neither a reliable benefit from the question nor equivalence between the two inputs.' : 'Removing the question lowers recall point estimates for Turn and Mini at both cutoffs; Nano changes little. All six response-ready confidence intervals cross zero. These results establish neither a reliable benefit from the question nor equivalence between the two inputs.'}</p>
    </div>
    <p className="source-note ablation-method">Metric: recall at an empirical ≤5% HOLD false-positive rate. Each input condition and cutoff selects its own ROC threshold. Intervals are paired session-cluster bootstrap estimates (2,000 resamples; 95% percentile intervals; no language stratification). The 300 / 600 ms settings describe the audio cutoff, not inference time.</p>
    <details className="report-detail ablation-floor-detail" id="ablation-floor-end">
      <summary><span><span className="detail-index">SUPPLEMENTARY</span>Floor-end · the retrospective turn-ending objective</span><ChevronDown size={18}/></summary>
      <p className="body-note">Floor-end asks whether the observed speaking turn ended here. Response-ready asks whether a listener could naturally respond at this point. The floor-end cohort contains 1,058 items; the response-ready cohort contains 842 eligible items. Label objective and cohort membership both differ, so their absolute scores are not directly comparable.</p>
      <IntervalChart cohortKey="floor_end" cutoff={cutoff} excludeModels={excludeModels}/>
      <p className="source-note">{hidesNano ? 'The same cutoff control, scale and bootstrap method apply here. All four floor-end recall-difference intervals also cross zero across the two cutoffs.' : 'The same cutoff control, scale and bootstrap method apply here. All six floor-end recall-difference intervals also cross zero across the two cutoffs.'}</p>
    </details>
    <p className="source-note ablation-provenance">Additional experiment · 15 November 2026 · {hidesNano ? 'Pikaia-Turn / Pikaia-Turn-Mini' : 'Pikaia-Turn / Mini / Nano'} · <a href="/report/context-ablation.json" download>Paired values, observed FPRs and source checksum <Download size={13}/></a></p>
  </section>;
}
