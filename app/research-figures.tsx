'use client';

import { useState } from 'react';
import data from '../public/report/figure-data.json';

type Frontier = typeof data.frontiers[number];
const xTicks = [300, 500, 700, 1000];
const yTicks = [0, 5, 10, 15];
const xPercent = (wait: number) => (wait - 300) / 7;
const yPercent = (error: number) => 100 - error / 15 * 100;

function FrontierPanel({ dataset, active }: { dataset: Frontier; active: string | null }) {
  return <figure className="frontier-panel" data-frontier={dataset.id}>
    <figcaption><h4>{dataset.label}</h4><p>N={dataset.n.toLocaleString('en-US')} paired decision points</p></figcaption>
    <p className="frontier-y-title">False cut-off rate · % of HOLD decisions</p>
    <div className="frontier-geometry" role="img" aria-label={`${dataset.label}: waiting-time versus false-cut-off curves. Exact operating points follow below.`}>
      <div className="frontier-y-axis" aria-hidden="true">{yTicks.map(tick => <span key={tick} style={{ top: `${yPercent(tick)}%` }}>{tick}%</span>)}</div>
      <div className="frontier-stage" aria-hidden="true">
        <svg viewBox="0 0 700 300" preserveAspectRatio="none" focusable="false">
          <defs><clipPath id={`frontier-clip-${dataset.id}`}><rect width="700" height="300"/></clipPath></defs>
          <rect x="0" y="200" width="700" height="100" className="frontier-budget-band"/>
          {xTicks.map(tick => <line key={`x-${tick}`} x1={tick - 300} x2={tick - 300} y1="0" y2="300" className="frontier-gridline"/>)}
          {yTicks.map(tick => <line key={`y-${tick}`} x1="0" x2="700" y1={300 - tick * 20} y2={300 - tick * 20} className={tick === 5 ? 'frontier-budget-line' : 'frontier-gridline'}/>)}
          <g clipPath={`url(#frontier-clip-${dataset.id})`}>
            {dataset.models.map(model => <polyline key={model.name} data-frontier-model={model.name}
              points={model.points.map(point => `${point.wait - 300},${300 - point.error * 20}`).join(' ')}
              fill="none" stroke={model.color} strokeWidth={model.family ? 2.4 : 1.5}
              strokeDasharray={model.family ? undefined : '5 5'}
              opacity={!active || active === model.name ? 1 : 0.14}
              className="frontier-curve"/>)}</g>
        </svg>
        <span className="frontier-budget-label">5% false-cut-off budget</span>
        {dataset.models.map(model => <i key={model.name} className="frontier-marker" data-frontier-marker={model.name} style={{ left: `${xPercent(model.at5.wait)}%`, top: `${yPercent(model.at5.error)}%`, background: model.color, opacity: !active || active === model.name ? 1 : 0.14 }}/>) }
      </div>
      <div className="frontier-x-axis" aria-hidden="true">{xTicks.map(tick => <span key={tick} style={{ left: `${xPercent(tick)}%` }}>{tick}</span>)}</div>
    </div>
    <p className="frontier-x-title">Mean waiting time · milliseconds</p>
    <div className="frontier-operating table-scroll">
      <table data-frontier-operating={dataset.id}>
        <caption>At an observed ≤5% false-cut-off budget</caption>
        <thead><tr><th scope="col">Model</th><th scope="col">Wait</th><th scope="col">Cut-offs</th></tr></thead>
        <tbody>{dataset.models.map(model => <tr key={model.name} className={active && active !== model.name ? 'is-muted' : undefined}>
          <th scope="row"><i style={{ background: model.color }} aria-hidden="true"/>{model.name}</th>
          <td>{model.at5.wait.toFixed(1)} <small>ms</small></td><td>{model.at5.error.toFixed(2)}%</td>
        </tr>)}</tbody>
      </table>
    </div>
  </figure>;
}

export function CascadeFrontiers() {
  const [active, setActive] = useState<string | null>(null);
  return <div className="native-research-figure">
    <div className="native-figure-intro"><h3>Less waiting.<br/>Fewer interruptions.</h3><p>Each curve shows the trade-off between response speed and cutting off a speaker who should still be heard. Lower-left is better. The dots mark each model’s operating point at an observed false-cut-off budget of at most 5%.</p></div>
    <div className="frontier-models" role="group" aria-label="Highlight a model in both frontier charts">
      <button type="button" aria-pressed={active === null} onClick={() => setActive(null)}>All models</button>
      {data.frontiers[0].models.map(model => <button type="button" key={model.name} aria-pressed={active === model.name} onClick={() => setActive(active === model.name ? null : model.name)}><i style={{ background: model.color }} aria-hidden="true"/>{model.name}</button>)}
    </div>
    <p className="native-chart-hint">Select a model to highlight it in both charts. Solid lines: Pikaia family. Dashed lines: reference baselines.</p>
    <div className="frontier-panels">{data.frontiers.map(dataset => <FrontierPanel key={dataset.id} dataset={dataset} active={active}/>)}</div>
    <p className="native-chart-note">A decision is made at 300 ms, reconsidered at 600 ms, then falls back to 1,000 ms. Waiting time includes that fallback on true EOT examples; it is not model inference time. Curves use measured operating points without smoothing. The view shows 0–15% false cut-offs; the downloadable data contains the complete sampled frontier.</p>
  </div>;
}

export function ProvenanceAndObjectives() {
  return <div className="native-research-figure provenance-objectives">
    <div className="native-figure-intro"><h3>What changes<br/>the evaluation?</h3><p>These are checks on how to interpret the results. The first separates label sources. The second changes the question the benchmark asks. Neither chart represents progress over training time.</p></div>
    <section className="provenance-panel" aria-labelledby="provenance-matrix-title">
      <div className="native-panel-heading"><span className="micro-label">A / LABEL PROVENANCE</span><h4 id="provenance-matrix-title">Does performance depend on the label source?</h4><p>ROC-AUC at 300 ms · higher is better. Each column is a sample group, so no trend line joins the columns.</p></div>
      <div className="table-scroll provenance-matrix" role="region" aria-label="ROC-AUC by label provenance" tabIndex={0}>
        <table data-provenance-matrix="true"><caption>ROC-AUC by group. Small bars use a common 0–1 scale.</caption>
          <thead><tr><th scope="col">Model</th>{data.provenance.groups.map(group => <th scope="col" key={group.key}>{group.label}<span>N={group.n.toLocaleString('en-US')}</span></th>)}</tr></thead>
          <tbody>{data.provenance.models.map(model => <tr key={model.name} className={model.family ? 'family-row' : 'baseline-row'}>
            <th scope="row"><i style={{ background: model.color }} aria-hidden="true"/>{model.name}</th>
            {model.auc.map((auc, i) => <td key={i}><span className="provenance-value">{auc.toFixed(4)}</span><span className="provenance-mini-bar" aria-hidden="true"><i style={{ width: `${auc * 100}%`, background: model.color }}/></span></td>)}
          </tr>)}</tbody>
        </table>
      </div>
      <p className="native-chart-note">The 77-item blind agreement subset overlaps the other groups; the full benchmark includes them. The report’s causal group combines reviewed, newly labeled and adjudicated items with differing annotation protocols. These columns are not independent held-out test sets. The full-benchmark column follows the current metrics release.</p>
    </section>
    <section className="objective-panel" aria-labelledby="objective-shift-title">
      <div className="native-panel-heading"><span className="micro-label">B / EVALUATION OBJECTIVE</span><h4 id="objective-shift-title">Same model. Different evaluation question.</h4><p>Recall at ≤5% FPR · 300 ms. Floor-end asks if the observed turn ended; response-ready asks if a listener could naturally respond.</p></div>
      <div className="objective-scope"><p><strong>Floor-end</strong><span>N={data.objective_shift.floor_end_n.toLocaleString('en-US')} · original labels</span></p><p><strong>Response-ready</strong><span>N={data.objective_shift.response_ready_n.toLocaleString('en-US')} · eligible relabeled subset</span></p></div>
      <p className="objective-caution">Both the labels and the eligible sample set change. The model predictions are fixed. A score difference here is descriptive; it does not measure a model improvement or isolate the effect of relabeling.</p>
      <div className="objective-rows">{data.objective_shift.models.map(model => <div className="objective-row" key={model.name} data-objective-model={model.name}>
        <div className="objective-model"><strong>{model.name}</strong><span>Difference: {model.delta_pp > 0 ? '+' : '−'}{Math.abs(model.delta_pp).toFixed(2)} pp</span></div>
        <div className="objective-comparison">
          <div className="objective-series floor"><span>Floor-end</span><div className="objective-track" aria-hidden="true"><i style={{ width: `${model.floor_end_recall}%` }}/></div><b>{model.floor_end_recall.toFixed(2)}%</b></div>
          <div className="objective-series ready"><span>Response-ready</span><div className="objective-track" aria-hidden="true"><i style={{ width: `${model.response_ready_recall}%` }}/></div><b>{model.response_ready_recall.toFixed(2)}%</b></div>
        </div>
      </div>)}</div>
      <p className="native-chart-note">All bars share a zero-based 0–100% scale. Differences are response-ready minus floor-end recall, in percentage points; no training or inference change occurs between the two evaluations.</p>
    </section>
  </div>;
}
