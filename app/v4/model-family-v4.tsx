import { ArrowDownRight, Download } from 'lucide-react';
import report from '../report-data.json';

type FamilyCard = {
  id: string;
  index: string;
  name: string;
  size: string;
  unit: string;
  role: string;
  tone: 'lilac' | 'cyan' | 'coral';
  architecture: string;
  fit: string;
  stats: { value: string; label: string; delta: string }[];
};

const byName = new Map(report.models.map(m => [m.name, m]));

function metricPct(modelName: string, split: 'test_1100' | 'full_2338', cutoff: '300ms' | '600ms_paired', budget: '1' | '5') {
  const m = byName.get(modelName);
  if (!m) throw new Error(`Missing model ${modelName}`);
  const op = (m.splits[split][cutoff].overall.operating as Record<string, { recall: number }>)[budget];
  return `${(op.recall * 100).toFixed(2)}%`;
}

function metricAuc(modelName: string, split: 'test_1100' | 'full_2338', cutoff: '300ms' | '600ms_paired') {
  const m = byName.get(modelName);
  if (!m) throw new Error(`Missing model ${modelName}`);
  return m.splits[split][cutoff].overall.auc.toFixed(4);
}

const FAMILY_CARDS: FamilyCard[] = [
  {
    id: 'pikaia-turn',
    index: '01',
    name: 'Pikaia-Turn',
    size: '2.3',
    unit: 'B',
    role: 'FLAGSHIP · SERVER',
    tone: 'lilac',
    architecture: 'Dual-backbone audio and preceding-question fusion built for multi-clause spoken interviews without waiting for user ASR.',
    fit: 'Best fit: maximum recall and strict low-interruption control on long-form server deployments.',
    stats: [
      { value: metricPct('Pikaia-Turn', 'test_1100', '300ms', '5'), label: 'Research test 300 ms R@5%', delta: `AUC ${metricAuc('Pikaia-Turn', 'test_1100', '300ms')}` },
      { value: metricPct('Pikaia-Turn', 'test_1100', '300ms', '1'), label: 'Strict 300 ms R@1%', delta: '+14.23 pp vs Turn-1 2.8B' },
      { value: '394.4 ms', label: 'LiveKit RR Wait@5%', delta: '−81.7 ms vs Turn-1 2.8B' },
    ],
  },
  {
    id: 'pikaia-turn-mini',
    index: '02',
    name: 'Pikaia-Turn-Mini',
    size: '0.6',
    unit: 'B',
    role: 'COMPACT · SERVER',
    tone: 'cyan',
    architecture: 'Standalone single-backbone server detector at roughly one-fifth the active parameters of 2.8B open baselines.',
    fit: 'Best fit: high-concurrency GPU inference delivering the shortest mean wait across Pikaia interviews.',
    stats: [
      { value: '395.3 ms', label: 'Pikaia Wait@5% (1,700 pairs)', delta: '#1 fastest in suite' },
      { value: metricPct('Pikaia-Turn-Mini', 'full_2338', '600ms_paired', '5'), label: 'Full-pool 600 ms R@5%', delta: `AUC ${metricAuc('Pikaia-Turn-Mini', 'full_2338', '600ms_paired')}` },
      { value: '91.28%', label: 'TurnBench Dev duplex OOF', delta: '617.5 ms median latency' },
    ],
  },
  {
    id: 'pikaia-turn-nano',
    index: '03',
    name: 'Pikaia-Turn-Nano',
    size: '6.7',
    unit: 'M',
    role: 'STREAMING · CPU',
    tone: 'coral',
    architecture: 'Frame-synchronous audio encoder with prompt conditioning and running utterance state for continuous CPU decisions.',
    fit: 'Best fit: edge and zero-GPU voice pipelines requiring sub-10M footprint and streaming execution.',
    stats: [
      { value: metricPct('Pikaia-Turn-Nano', 'test_1100', '300ms', '5'), label: 'Research test 300 ms R@5%', delta: '+15.80 pp vs Smart Turn 8M' },
      { value: '657.0 ms', label: 'Pikaia Wait@5% (1,700 pairs)', delta: '−192.3 ms vs Turn-1-Mini' },
      { value: '89.81%', label: 'TurnBench Dev duplex OOF', delta: '597.0 ms median latency' },
    ],
  },
];

export function ModelFamilyV4() {
  return (
    <section className="report-section v4m-section" id="models" aria-labelledby="models-title">
      <div className="v4-result-head">
        <div>
          <p className="eyebrow">01 / Pikaia-Turn model family</p>
          <h2 id="models-title">Three compute budgets.<br/>One causal architecture.</h2>
        </div>
        <p>
          Every Pikaia-Turn model combines causal interviewee audio with the interviewer’s preceding question to separate a completed thought from a mid-sentence pause — scaling from a 2.3B dual-backbone flagship down to 6.7M CPU streaming.
        </p>
      </div>

      <div className="v4m-grid">
        {FAMILY_CARDS.map(card => (
          <article key={card.id} className={`v4m-card tone-${card.tone}`}>
            <div className="v4m-card-head">
              <span className="v4m-index">{card.index} · {card.role}</span>
              <span className="v4m-dot" aria-hidden="true"/>
            </div>
            <div className="v4m-hero-row">
              <h3>{card.name}</h3>
              <p className="v4m-size">{card.size}<span>{card.unit}</span></p>
            </div>
            <p className="v4m-arch">{card.architecture}</p>
            <dl className="v4m-stats">
              {card.stats.map(stat => (
                <div key={stat.label}>
                  <dt>
                    <span className="v4m-stat-label">{stat.label}</span>
                    <small>{stat.delta}</small>
                  </dt>
                  <dd>{stat.value}</dd>
                </div>
              ))}
            </dl>
            <p className="v4m-fit">{card.fit}</p>
          </article>
        ))}
      </div>

      <div className="v4m-proof-deck" id="architecture-controls" aria-labelledby="arch-proof-title">
        <div className="v4m-proof-head">
          <div>
            <p className="v4m-proof-eyebrow">ARCHITECTURE VS. DATA CONTROLS · VERIFIED SUPPLEMENT</p>
            <h3 id="arch-proof-title">Why the gains come from architecture, not just training volume</h3>
          </div>
          <a className="v4m-proof-dl" href="/report/v2-supplementary.json" download>
            Complete controls JSON <Download size={13} aria-hidden="true"/>
          </a>
        </div>

        <div className="v4m-proof-grid">
          <article className="v4m-proof-chamber">
            <div className="v4m-proof-topline">
              <span>01 · SAME 3,195 CLIPS</span>
              <strong className="tone-lilac">+20.8 pp · −99.9 ms</strong>
            </div>
            <h4>Modified Pikaia-Turn vs. unmodified Turn-1 FT</h4>
            <div className="v4m-mini-bars">
              <div className="v4m-mini-row is-pikaia">
                <div className="v4m-mini-meta"><span>Pikaia-Turn (2.3B, modified)</span><b>81.5% · 394.4 ms</b></div>
                <div className="v4m-mini-track"><i style={{ width: '81.5%' }}/></div>
              </div>
              <div className="v4m-mini-row">
                <div className="v4m-mini-meta"><span>Turn-1 + FT (unmodified)</span><b>60.7% · 494.3 ms</b></div>
                <div className="v4m-mini-track"><i style={{ width: '60.7%' }}/></div>
              </div>
            </div>
            <p className="v4m-proof-note">LiveKit RR 600 ms on identical 3,195 expanded interview clips; Pikaia-Turn retains external generalization where unmodified fine-tuning degrades.</p>
          </article>

          <article className="v4m-proof-chamber">
            <div className="v4m-proof-topline">
              <span>02 · NANO STEPWISE</span>
              <strong className="tone-coral">−72.8 ms · +10.6 pp</strong>
            </div>
            <h4>Each Nano component cuts pause waiting time</h4>
            <div className="v4m-mini-bars">
              <div className="v4m-mini-row">
                <div className="v4m-mini-meta"><span>Turn-1-Mini + FT (audio baseline)</span><b>729.8 ms · 41.5%</b></div>
                <div className="v4m-mini-track"><i style={{ width: '73%' }}/></div>
              </div>
              <div className="v4m-mini-row">
                <div className="v4m-mini-meta"><span>+ Prosody &amp; utterance state</span><b>706.9 ms · 43.0%</b></div>
                <div className="v4m-mini-track"><i style={{ width: '70.7%' }}/></div>
              </div>
              <div className="v4m-mini-row is-coral">
                <div className="v4m-mini-meta"><span>Pikaia-Turn-Nano (+Prompt)</span><b>657.0 ms · 52.1%</b></div>
                <div className="v4m-mini-track"><i style={{ width: '65.7%' }}/></div>
              </div>
            </div>
            <p className="v4m-proof-note">Pikaia Wait@5% (↓) &amp; 300 ms R@5% (↑) across identical 3,195 training clips.</p>
          </article>

          <article className="v4m-proof-chamber">
            <div className="v4m-proof-topline">
              <span>03 · DEV ≤1 FP → TEST</span>
              <strong className="tone-cyan">+7.33 pp recall</strong>
            </div>
            <h4>Out-of-sample calibration transfer to unseen speakers</h4>
            <div className="v4m-mini-bars">
              <div className="v4m-mini-row is-pikaia">
                <div className="v4m-mini-meta"><span>Pikaia-Turn (2.3B)</span><b>77.73% @ 5.20% FPR</b></div>
                <div className="v4m-mini-track"><i style={{ width: '77.73%' }}/></div>
              </div>
              <div className="v4m-mini-row is-cyan">
                <div className="v4m-mini-meta"><span>Pikaia-Turn-Mini (0.6B)</span><b>73.13% @ 4.21% FPR</b></div>
                <div className="v4m-mini-track"><i style={{ width: '73.13%' }}/></div>
              </div>
              <div className="v4m-mini-row">
                <div className="v4m-mini-meta"><span>Turn-1 (2.8B, zero-shot)</span><b>70.40% @ 3.96% FPR</b></div>
                <div className="v4m-mini-track"><i style={{ width: '70.40%' }}/></div>
              </div>
            </div>
            <p className="v4m-proof-note">Thresholds frozen strictly on the 100-item dev split (35 HOLDs) and applied unadjusted to 1,100 unseen test decisions.</p>
          </article>
        </div>
      </div>

      <div className="v4m-footer">
        <p>All three models accept causal audio and preceding-question context; inference ablations with empty questions appear in Section 04. Model weights and the 3,195-clip training corpus remain private.</p>
        <a href="#access-family">Request Pikaia-Turn evaluation <ArrowDownRight size={15} aria-hidden="true"/></a>
      </div>
    </section>
  );
}
