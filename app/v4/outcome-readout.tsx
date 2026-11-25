import { ArrowDownRight } from 'lucide-react';
import report from '../report-data.json';

const columns = 48;
const pitch = 6;

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
  const flagship = report.models.find(model => model.name === 'Pikaia-Turn');
  if (!flagship) throw new Error('The Pikaia-Turn measurement is missing');
  const sample = flagship.splits.test_1100['300ms'].overall;
  const point = sample.operating['5'];
  return <section className="report-section v4-readout" id="readout" aria-labelledby="readout-title">
    <div className="v4-result-head">
      <div><p className="eyebrow">Pikaia-Turn · Public research test</p><h2 id="readout-title">At a 5% cut-off budget</h2></div>
      <p>At the 300 ms cutoff, Pikaia-Turn could respond or keep listening. These are its decisions across {sample.n.toLocaleString('en-US')} labeled pauses in Mandarin and English.</p>
    </div>
    <div className="v4-readout-chamber">
      <div className="v4-chamber-ticks">
        <span>300 MS CUTOFF · EMPIRICAL ROC AT ≤5% FPR</span>
        <span>N = {sample.n.toLocaleString('en-US')} LABELED PAUSES · {sample.eot} RESPONSE-READY · {sample.hold} HOLD</span>
      </div>
      <div className="outcome-grid">
        <Outcome id="opportunities" title="Response opportunities detected" count={point.tp} total={sample.eot} population="response-ready pauses" marked="detected" other="missed"/>
        <Outcome id="cutoffs" title="Premature responses" count={point.fp} total={sample.hold} population="pauses labeled HOLD" marked="early responses" other="correctly held"/>
      </div>
    </div>
    <div className="outcome-source"><p>Each dot is one labeled pause, grouped by outcome. The threshold was selected on this test slice to cap early responses at 5% of HOLD decisions.</p><a href="#results">Compare all models <ArrowDownRight size={15} aria-hidden="true"/></a></div>
  </section>;
}
