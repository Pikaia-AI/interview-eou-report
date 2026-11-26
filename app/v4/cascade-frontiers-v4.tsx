'use client';

import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import data from '../../public/report/figure-data.json';

type Frontier = typeof data.frontiers[number];
type FrontierScope = { title: string; note: string };

const minBudget = 0.5;
const maxBudget = 15;
const budgetStep = 0.25;
const snapBudget = (v: number) => Math.min(maxBudget, Math.max(minBudget, Math.round(v / budgetStep) * budgetStep));
const yPercent = (error: number) => 100 - (error / 15) * 100;

function OpticalFrontierPanel({ dataset, active, budget, onBudgetChange, scope }: {
  dataset: Frontier;
  active: string | null;
  budget: number;
  onBudgetChange: (value: number) => void;
  scope?: FrontierScope;
}) {
  const stage = useRef<HTMLDivElement>(null);
  const dragOffset = useRef(0);
  const operating = dataset.models.map(model => ({
    model,
    point: model.points.find(p => Math.abs(p.budget - budget) < 0.01) ?? model.points[0],
  }));

  const budgetY = 180 - (budget / 15) * 180;
  const xMap = (w: number) => ((w - 300) / 700) * 320;
  const yMap = (e: number) => 180 - (e / 15) * 180;

  function beginDrag(event: PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
    const bounds = stage.current!.getBoundingClientRect();
    dragOffset.current = event.clientY - (bounds.top + (bounds.height * yPercent(budget)) / 100);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function dragBudget(event: PointerEvent<HTMLDivElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const bounds = stage.current!.getBoundingClientRect();
    onBudgetChange(snapBudget(maxBudget * (1 - (event.clientY - dragOffset.current - bounds.top) / bounds.height)));
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function keyBudget(event: KeyboardEvent<HTMLDivElement>) {
    const map: Record<string, number> = {
      ArrowUp: budget + budgetStep,
      ArrowRight: budget + budgetStep,
      ArrowDown: budget - budgetStep,
      ArrowLeft: budget - budgetStep,
      PageUp: budget + 1,
      PageDown: budget - 1,
      Home: minBudget,
      End: maxBudget,
    };
    if (event.key in map) {
      event.preventDefault();
      onBudgetChange(snapBudget(map[event.key]));
    }
  }

  return (
    <figure className="v4p-chamber" data-frontier={dataset.id} data-budget={budget}>
      <div className="v4p-chamber-head">
        <h4>{scope?.title ?? dataset.label}</h4>
        <span className="v4p-chamber-n">N={dataset.n.toLocaleString('en-US')}</span>
      </div>
      {scope && <p className="v4p-chamber-sub">{scope.note}</p>}

      <div className="v4p-plot-frame" role="group" aria-label={`${scope?.title ?? dataset.label}: waiting-time versus false-cut-off curves. Exact operating points follow below.`}>
        <div className="v4p-y-ticks" aria-hidden="true"><span>15%</span><span>10%</span><span>5%</span><span>0%</span></div>
        <div className="v4p-stage" ref={stage}>
          <svg className="v4p-svg" viewBox="0 0 320 180" preserveAspectRatio="none" focusable="false" aria-hidden="true">
            <defs>
              <clipPath id={`v4p-clip-${dataset.id}`}><rect width="320" height="180"/></clipPath>
              <radialGradient id={`v4p-opt-${dataset.id}`} cx="0%" cy="100%" r="65%">
                <stop offset="0%" stopColor="#a5d8dc" stopOpacity="0.14"/>
                <stop offset="100%" stopColor="#a5d8dc" stopOpacity="0"/>
              </radialGradient>
            </defs>
            <rect x="0" y="0" width="320" height="180" fill={`url(#v4p-opt-${dataset.id})`}/>
            <rect x="0" y={budgetY} width="320" height={180 - budgetY} fill="rgba(197,180,236,0.065)"/>
            {[0, 60, 120, 180].map(y => <line key={`y-${y}`} x1="0" y1={y} x2="320" y2={y} stroke="rgba(240,237,245,0.07)"/>)}
            {[91.4, 182.9, 274.3].map(x => <line key={`x-${x}`} x1={x} y1="0" x2={x} y2="180" stroke="rgba(240,237,245,0.06)" strokeDasharray="2 4"/>)}
            <g clipPath={`url(#v4p-clip-${dataset.id})`}>
              {dataset.models.map(model => {
                const dim = active !== null && active !== model.name;
                return (
                  <polyline
                    key={model.name}
                    data-frontier-model={model.name}
                    points={model.points.filter(p => p.budget <= 15).map(p => `${xMap(p.wait).toFixed(1)},${yMap(p.error).toFixed(1)}`).join(' ')}
                    fill="none"
                    stroke={model.color}
                    strokeWidth={model.family ? 2.2 : 1.3}
                    strokeDasharray={model.family ? undefined : '4 4'}
                    opacity={dim ? 0.14 : 0.96}
                  />
                );
              })}
            </g>
            <line x1="0" y1={budgetY} x2="320" y2={budgetY} stroke="#c5b4ec" strokeDasharray="4 3" strokeWidth="1.2"/>
            {operating.map(({ model, point }) => {
              const cx = xMap(point.wait);
              const cy = yMap(point.error);
              const dim = active !== null && active !== model.name;
              return (
                <g key={model.name} opacity={dim ? 0.14 : 1}>
                  {model.family && <circle cx={cx} cy={cy} r="6.5" fill={model.color} opacity="0.22"/>}
                  <circle cx={cx} cy={cy} r={model.family ? 3.5 : 2.6} fill={model.color} stroke="#08080c" strokeWidth="1"/>
                </g>
              );
            })}
            <rect x="258" y={Math.max(2, budgetY - 17)} width="58" height="15" rx="7.5" fill="#181523" stroke="rgba(197,180,236,0.45)" strokeWidth="0.8"/>
            <text x="287" y={Math.max(12, budgetY - 6.5)} textAnchor="middle" fill="#e7dff4" fontFamily="ui-monospace, monospace" fontSize="9">
              ≤{budget.toFixed(2)}%
            </text>
          </svg>
          <div
            className="v4p-drag-handle"
            role="slider"
            tabIndex={0}
            aria-label={`${scope?.title ?? dataset.label}: false cut-off budget`}
            aria-describedby="v4p-budget-help"
            aria-orientation="vertical"
            aria-valuemin={minBudget}
            aria-valuemax={maxBudget}
            aria-valuenow={budget}
            aria-valuetext={`${budget.toFixed(2)}% false cut-off budget; updates all three charts`}
            style={{ top: `${yPercent(budget)}%` }}
            onPointerDown={beginDrag}
            onPointerMove={dragBudget}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onKeyDown={keyBudget}
          />
        </div>
        <div className="v4p-x-ticks" aria-hidden="true"><span>300 ms</span><span>500</span><span>700</span><span>1000 ms</span></div>
      </div>

      <div className="table-scroll">
        <table className="v4p-table" data-frontier-operating={dataset.id}>
          <caption className="sr-only">Measured operating points at ≤{budget.toFixed(2)}% false-cut-off budget</caption>
          <thead>
            <tr>
              <th scope="col">Model</th>
              <th scope="col" className="num">Mean wait</th>
              <th scope="col" className="num">Cut-offs</th>
            </tr>
          </thead>
          <tbody>
            {operating.map(({ model, point }) => (
              <tr key={model.name} className={active && active !== model.name ? 'muted' : undefined}>
                <th scope="row"><i className="v4p-dot" style={{ background: model.color }} aria-hidden="true"/>{model.name}</th>
                <td className="wait">{point.wait.toFixed(1)} ms</td>
                <td>{point.error.toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}

export function CascadeFrontiersV4({ scopes, excludeModels = [] }: { scopes: Record<string, FrontierScope>; excludeModels?: string[] }) {
  const [active, setActive] = useState<string | null>(null);
  const [budget, setBudget] = useState(5);
  const [draft, setDraft] = useState<string | null>(null);
  const changeBudget = (v: number) => setBudget(snapBudget(v));
  const fillPct = ((budget - minBudget) / (maxBudget - minBudget)) * 100;
  const excluded = new Set(excludeModels);
  const frontiers = excluded.size
    ? data.frontiers.map(ds => ({ ...ds, models: ds.models.filter(m => !excluded.has(m.name)) }))
    : data.frontiers;

  return (
    <div className="v4p-wrap">
      <div className="v4p-deck">
        <div className="v4p-top">
          <div className="v4p-budget-bar">
            <div className="v4p-budget-input-group">
              <label htmlFor="v4p-budget-value">False cut-off budget</label>
              <div className="v4p-budget-readout">
                <input
                  id="v4p-budget-value"
                  type="number"
                  inputMode="decimal"
                  min={minBudget}
                  max={maxBudget}
                  step={budgetStep}
                  value={draft ?? budget.toFixed(2)}
                  aria-label="False cut-off budget in percent"
                  aria-describedby="v4p-budget-help"
                  onChange={e => setDraft(e.target.value)}
                  onBlur={e => {
                    if (Number.isFinite(e.target.valueAsNumber)) changeBudget(e.target.valueAsNumber);
                    setDraft(null);
                  }}
                  onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                />
                <span>%</span>
              </div>
            </div>

            <div className="v4p-range-wrap">
              <label className="sr-only" htmlFor="v4p-budget-slider">Adjust false cut-off budget for all three charts</label>
              <input
                id="v4p-budget-slider"
                className="v4p-range"
                type="range"
                min={minBudget}
                max={maxBudget}
                step={budgetStep}
                value={budget}
                style={{ background: `linear-gradient(to right, #c5b4ec ${fillPct}%, rgba(240,237,245,0.14) ${fillPct}%)` }}
                aria-valuetext={`${budget.toFixed(2)}% false cut-off budget`}
                aria-describedby="v4p-budget-help"
                onChange={e => changeBudget(e.target.valueAsNumber)}
              />
              <div className="v4p-range-ends" aria-hidden="true">
                <span>0.50% · fewer interruptions</span>
                <span>0.25 pp grid · drag any horizontal line</span>
                <span>15.00% · more interruptions</span>
              </div>
            </div>

            <div className="v4r-seg" role="group" aria-label="Common false cut-off budgets">
              {[1, 3, 5, 10].map(v => (
                <button key={v} type="button" aria-pressed={budget === v} onClick={() => changeBudget(v)}>{v}%</button>
              ))}
            </div>
          </div>

          <div className="v4p-models-row">
            <div className="v4p-models" role="group" aria-label="Highlight a model in all three charts">
              <button type="button" className="v4p-pill" aria-pressed={active === null} onClick={() => setActive(null)}>All models</button>
              {frontiers[0].models.map(model => (
                <button
                  key={model.name}
                  type="button"
                  className="v4p-pill"
                  aria-pressed={active === model.name}
                  onClick={() => setActive(active === model.name ? null : model.name)}
                >
                  <i style={{ background: model.color }} aria-hidden="true"/>{model.name}
                </button>
              ))}
            </div>
            <p id="v4p-budget-help" className="v4p-help">Solid = Pikaia server models · Dashed = zero-shot baselines · Lower-left is better</p>
          </div>
        </div>

        <div className="v4p-grid">
          {frontiers.map(ds => (
            <OpticalFrontierPanel
              key={ds.id}
              dataset={ds}
              active={active}
              budget={budget}
              onBudgetChange={changeBudget}
              scope={scopes[ds.id]}
            />
          ))}
        </div>
      </div>

      <p className="native-chart-note">
        A decision is made at 300 ms, reconsidered at 600 ms, then falls back to 1,000 ms. Mean waiting time is measured on true EOT examples and includes fallback. Each budget uses its recorded operating point; values are not interpolated. Open-weight Smart Turn v3.2-Interview (8.0M) is evaluated at the ≤5% operating point (630.8 ms on Pikaia 1,700 pairs; 758.9 ms on LiveKit Response-ready) rather than the sampled 79-step curve grid. The downloadable data includes all sampled budgets up to 20%.
      </p>
    </div>
  );
}
