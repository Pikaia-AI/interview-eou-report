import { ArrowDownRight, Download } from 'lucide-react';
import report from '../report-data.json';

type FamilyCard = {
  id: string;
  index: string;
  name: string;
  size: string;
  unit: string;
  role: string;
  tone: 'lilac' | 'cyan' | 'mint';
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
    role: 'FLAGSHIP · SERVER · PRIVATE',
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
    role: 'COMPACT · SERVER · PRIVATE',
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
    id: 'smart-turn-interview',
    index: '03',
    name: 'Smart Turn v3.2-Interview',
    size: '8.0',
    unit: 'M',
    role: 'OPEN-WEIGHT · AUDIO-ONLY · BSD-2',
    tone: 'mint',
    architecture: 'Open-weight 8M Whisper audio-only turn detector fine-tuned on 3,891 bilingual interview pauses; seed 29 weights released in ONNX and safetensors.',
    fit: 'Best fit: lightweight audio-only deployments with zero prompt dependency and immediate open download.',
    stats: [
      { value: metricPct('Smart Turn + Interview FT', 'test_1100', '300ms', '5'), label: 'Research test 300 ms R@5%', delta: `+23.56 pp vs v3.2 · AUC ${metricAuc('Smart Turn + Interview FT', 'test_1100', '300ms')}` },
      { value: '630.8 ms', label: 'Pikaia Wait@5% (1,700 pairs)', delta: '−104.4 ms vs Smart Turn v3.2' },
      { value: '674.2 / 597.8 ms', label: 'LiveKit EN / ZH wait (≤10%)', delta: '−49.1 ms (#7) / −60.6 ms (#3)' },
    ],
  },
];

export function ModelFamilyV4() {
  return (
    <section className="report-section v4m-section" id="models" aria-labelledby="models-title">
      <div className="v4-result-head">
        <div>
          <p className="eyebrow">01 / Pikaia models &amp; open release</p>
          <h2 id="models-title">Two private server models.<br/>One open-weight release.</h2>
        </div>
        <p>
          Pikaia-Turn (2.3B) and Pikaia-Turn-Mini (0.6B) fuse causal interviewee audio with the preceding question on servers. Alongside them, we release open-weight Smart Turn v3.2-Interview (8.0M), fine-tuned on our bilingual interview training corpus under BSD 2-Clause.
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
            <p className="v4m-proof-eyebrow">ARCHITECTURE, TRAINING &amp; CALIBRATION · VERIFIED SUPPLEMENT</p>
            <h3 id="arch-proof-title">Architecture controls, interview fine-tuning, and frozen transfer</h3>
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
              <span>02 · 3,891-CLIP INTERVIEW FT</span>
              <strong className="tone-mint">+23.56 pp · −104.4 ms</strong>
            </div>
            <h4>Open-weight Smart Turn v3.2 before &amp; after training</h4>
            <div className="v4m-mini-bars">
              <div className="v4m-mini-row is-mint">
                <div className="v4m-mini-meta"><span>Smart Turn v3.2-Interview (8M)</span><b>63.79% · 630.8 ms</b></div>
                <div className="v4m-mini-track"><i style={{ width: '63.79%' }}/></div>
              </div>
              <div className="v4m-mini-row">
                <div className="v4m-mini-meta"><span>Smart Turn v3.2 (zero-shot)</span><b>40.23% · 735.2 ms</b></div>
                <div className="v4m-mini-track"><i style={{ width: '40.23%' }}/></div>
              </div>
            </div>
            <p className="v4m-proof-note">3-seed mean on Pikaia Research Test 300 ms &amp; 1,700-pair cascade; also lifts LiveKit Floor-end AUC from 0.7998 to 0.8474.</p>
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
        <p>Pikaia-Turn and Pikaia-Turn-Mini weights and the interview training corpus remain private. Smart Turn v3.2-Interview (8.0M, seed 29) is open-weight under BSD 2-Clause.</p>
        <div className="v4-source-links">
          <a href="#access-model">Download Smart Turn v3.2-Interview <ArrowDownRight size={15} aria-hidden="true"/></a>
          <a href="#access-family">Request Pikaia-Turn evaluation <ArrowDownRight size={15} aria-hidden="true"/></a>
        </div>
      </div>
    </section>
  );
}
