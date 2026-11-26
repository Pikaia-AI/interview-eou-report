'use client';

import { useState } from 'react';
import { ArrowDownRight } from 'lucide-react';
import report from '../report-data.json';

const columns = 48;
const pitch = 6;

const FAMILY_OPTIONS = [
  { name: 'Pikaia-Turn', short: 'Pikaia-Turn · 2.3B', displayName: 'Pikaia-Turn', tone: 'lilac' },
  { name: 'Pikaia-Turn-Mini', short: 'Mini · 0.6B', displayName: 'Pikaia-Turn-Mini', tone: 'cyan' },
  { name: 'Smart Turn + Interview FT', short: 'Smart Turn FT · 8.0M', displayName: 'Smart Turn v3.2-Interview', tone: 'mint' },
] as const;

// A single repeated mark per decision. The last row stops at the exact count.
function dotArea(count: number) {
  const rows = Math.floor(count / columns);
  const tail = count % columns;
  const bottom = rows * pitch;
  return `M0 0h${columns * pitch}v${bottom}H0z M0 ${bottom}h${tail * pitch}v${pitch}H0z`;
}

type OutcomeProps = {
  id: string;
  title: string;
  count: number;
  total: number;
  population: string;
  marked: string;
  other: string;
};

function Outcome({ id, title, count, total, population, marked, other }: OutcomeProps) {
  const percentage = (100 * count / total).toFixed(2);
  return <figure className={`outcome outcome-${id}`} aria-labelledby={`title-${id}`}>
    <div className="outcome-head">
      <h3 id={`title-${id}`}>{title}</h3>
      <p className="outcome-denominator">of {total} {population}</p>
    </div>
    <p className="outcome-number">{percentage}<span>%</span></p>
    <div className="outcome-field">
      <svg viewBox={`0 0 ${columns * pitch} ${Math.ceil(total / columns) * pitch}`} aria-hidden="true" focusable="false">
        <defs>
          <pattern id={`${id}-unmarked`} width={pitch} height={pitch} patternUnits="userSpaceOnUse">
            <circle cx="3" cy="3" r="1.45" fill="none" stroke="rgba(240,237,245,0.28)" strokeWidth=".72"/>
          </pattern>
          <pattern id={`${id}-marked`} width={pitch} height={pitch} patternUnits="userSpaceOnUse">
            <circle cx="3" cy="3" r="1.92" fill="currentColor"/>
          </pattern>
        </defs>
        <path d={dotArea(total)} fill={`url(#${id}-unmarked)`}/>
        <path d={dotArea(count)} fill={`url(#${id}-marked)`}/>
      </svg>
    </div>
    <figcaption><span><i aria-hidden="true"/><b>{count}</b> {marked}</span><span><i aria-hidden="true"/><b>{total - count}</b> {other}</span></figcaption>
  </figure>;
}

export function OutcomeReadout() {
  const [selected, setSelected] = useState<(typeof FAMILY_OPTIONS)[number]['name']>('Pikaia-Turn');
  const activeOption = FAMILY_OPTIONS.find(option => option.name === selected) ?? FAMILY_OPTIONS[0];
  const active = report.models.find(model => model.name === selected);
  if (!active) throw new Error(`The ${selected} measurement is missing`);
  const sample = active.splits.test_1100['300ms'].overall;
  const point = sample.operating['5'];

  return <section className="report-section v4-readout" id="readout" aria-labelledby="readout-title">
    <div className="v4-result-head">
      <div>
        <p className="eyebrow">Pikaia models · Public research test</p>
        <h2 id="readout-title">At a 5% cut-off budget</h2>
      </div>
      <p>
        At the 300 ms cutoff, each model decides whether to respond or keep listening across {sample.n.toLocaleString('en-US')} labeled pauses in Mandarin and English. Switch between Pikaia-Turn, Mini, and open-weight Smart Turn v3.2-Interview below.
      </p>
    </div>
    <div className="v4-readout-chamber">
      <div className="v4-chamber-ticks v4-chamber-bar">
        <div className="v4-readout-switch" role="group" aria-label="Select evaluated model tier">
          {FAMILY_OPTIONS.map(option => (
            <button
              key={option.name}
              type="button"
              aria-pressed={selected === option.name}
              onClick={() => setSelected(option.name)}
            >
              <i className={`v4-tier-dot tone-${option.tone}`} aria-hidden="true"/>
              {option.short}
            </button>
          ))}
        </div>
        <span>300 MS CUTOFF · ≤5% FPR · AUC {sample.auc.toFixed(4)} · N = {sample.n.toLocaleString('en-US')}</span>
      </div>
      <div className="outcome-grid">
        <Outcome id="opportunities" title="Response opportunities detected" count={point.tp} total={sample.eot} population="response-ready pauses" marked="detected" other="missed"/>
        <Outcome id="cutoffs" title="Premature responses" count={point.fp} total={sample.hold} population="pauses labeled HOLD" marked="early responses" other="correctly held"/>
      </div>
    </div>
    <div className="outcome-source">
      <p>Each dot is one labeled pause for <strong>{activeOption.displayName}</strong> ({active.spec}), grouped by outcome. The threshold is selected on this test slice to cap early responses at 5% of HOLD decisions.</p>
      <div className="v4-source-links">
        <a href="#models">Explore the models <ArrowDownRight size={15} aria-hidden="true"/></a>
        <a href="#results">Compare all 6 models <ArrowDownRight size={15} aria-hidden="true"/></a>
      </div>
    </div>
  </section>;
}
