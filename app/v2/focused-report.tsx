/* eslint-disable @next/next/no-img-element -- Reuses the approved, locally optimized report artwork. */
import Link from 'next/link';
import { ArrowUpRight, ChevronDown, Download } from 'lucide-react';
import report from '../report-data.json';
import training from '../../public/report/training-data-summary.json';
import { Header, Contents, DisclosureLinks, ResultsExplorer } from '../report-ui';
import { CascadeFrontiers } from '../research-figures';
import { ContextAblation } from '../context-ablation';
import { ReportVersionSwitch } from '../report-version-switch';
import { SmartTurnTransfer } from './smart-turn-transfer';
import { ResourceAccess } from '../v3/resource-access';
import '../report-v2.css';

const navigation = [['models', 'The family'], ['benchmark', 'Data'], ['results', 'Results'], ['smart-turn-transfer', 'Transfer'], ['latency', 'Timing'], ['ablations', 'Ablations'], ['paper', 'Resources']];
const researchNavigation = [['results', 'Results'], ['smart-turn-transfer', 'Transfer'], ['latency', 'Timing'], ['models', 'Models'], ['benchmark', 'Data'], ['ablations', 'Ablations'], ['paper', 'Sources'], ['access', 'Access']];
const headerLinks = [['models', 'The family'], ['results', 'Results'], ['latency', 'Timing']];
const PDF = '/report/pikaia-interview-eou-benchmark.pdf';
const scopes = {
  pikaia: { title: 'Our Pikaia benchmark', note: 'From our Pikaia Interview EOU Benchmark v1.0.0: 75 development, 788 public research test and 837 private holdout pairs.' },
  livekit_floor_end: { title: 'LiveKit · original Floor-end', note: 'External LiveKit EOT Bench pairs with LiveKit’s original labels for whether the speaker finished their turn.' },
  livekit: { title: 'LiveKit · Response-ready', note: 'Eligible LiveKit pairs relabeled by Pikaia for whether a listener could naturally respond at the decision point.' },
};
const family = [
  { name: 'Pikaia-Turn', size: '2.3', unit: 'B', role: 'FLAGSHIP / SERVER', description: 'Dual-backbone audio and question-text fusion for long-form interviews.', architecture: 'Dual backbone', runtime: 'Server' },
  { name: 'Pikaia-Turn-Mini', size: '0.6', unit: 'B', role: 'COMPACT / SERVER', description: 'A standalone single-backbone detector with a smaller parameter footprint.', architecture: 'Single backbone', runtime: 'Server' },
  { name: 'Pikaia-Turn-Nano', size: '6.7', unit: 'M', role: 'STREAMING / CPU', description: 'A prompt encoder and running utterance state for continuous audio decisions.', architecture: 'Frame-synchronous', runtime: 'CPU streaming' },
];
const number = (value: number) => value.toLocaleString('en-US');

function Title({ index, label, children }: { index: string; label: string; children: React.ReactNode }) {
  return <div className="section-title"><p className="eyebrow">{index} / {label}</p><h2>{children}</h2></div>;
}

export function FocusedReport({ edition = 'v2', opening }: { edition?: 'v2' | 'v3'; opening?: React.ReactNode }) {
  const research = edition === 'v3';
  const methods = <>
      <section className="report-section" id="models">
        {research ? <>
          <Title index="03" label="Model configurations">Models in this evaluation</Title>
          <div className="study-configs"><table><caption className="sr-only">Architectures and execution environments</caption>
            <thead><tr><th scope="col">Model</th><th scope="col">Parameters</th><th scope="col">Architecture</th><th scope="col">Execution</th></tr></thead>
            <tbody>{family.map(model => <tr key={model.name}><th scope="row">{model.name}</th><td>{model.size}{model.unit}</td><td>{model.description}</td><td>{model.runtime}</td></tr>)}</tbody>
          </table></div>
        </> : <>
        <div className="v2-section-lead"><Title index="01" label="The family">A pause is a decision.</Title><p>Can the listener naturally respond now? Pikaia-Turn combines user audio with the preceding question to distinguish a finished thought from a thinking pause, without waiting for user ASR.</p></div>
        <div className="model-grid v2-models">
          {family.map(model => <article key={model.name}>
            <p className="micro-label">{model.role}</p>
            <p className="model-size">{model.size}<span>{model.unit}</span></p>
            <h3>{model.name}</h3><p>{model.description}</p>
            <dl><dt>Architecture</dt><dd>{model.architecture}</dd><dt>Execution</dt><dd>{model.runtime}</dd></dl>
          </article>)}
        </div>
        </>}
        <p className="source-note">All three use audio and preceding-question context. The ablation below evaluates empty-question inputs. The Pikaia-Turn family weights and training corpus remain private.</p>
      </section>

      <section className="report-section" id="benchmark">
        <div className="v2-section-lead"><Title index={research ? "04" : "02"} label="Data & scope">{research ? "Training and evaluation sets" : "Know what is being measured."}</Title><p>Training examples, public research tests and full-pool analyses have different roles. The two result charts keep those evaluation scopes separate.</p></div>
        <div className="v2-data-roles">
          <article id="training-data"><div><span className="micro-label">PRIVATE / TRAINING</span><h3>Pikaia family training corpus</h3></div><strong>{number(training.expanded_count)}</strong><p>Pauses from our own real interviews: {number(training.languages.zh)} Mandarin and {number(training.languages.en)} English. Includes human-reviewed and machine-consensus labels for when a listener can respond. <a className="v2-data-link" href="#smart-turn-transfer">See the separate Smart Turn training run</a>.</p></article>
          <article><div><span className="micro-label">HUGGING FACE / EVALUATION</span><h3>Pikaia research test</h3></div><strong>1,100</strong><p>500 Mandarin and 600 English decisions from 65 speaker clusters. This gated test comes from our benchmark and excludes development and calibration points.</p></article>
          <article><div><span className="micro-label">ALL TIERS / EVALUATION</span><h3>Pikaia full evaluation pool</h3></div><strong>2,338</strong><p>Our benchmark combines 100 development, 1,100 research test and 1,138 private holdout decisions across 150 speaker clusters. The public test is part of this pool.</p></article>
        </div>
        <details className="report-detail v2-methods" id="protocol">
          <summary><span>Labels, training sources & evaluation protocol</span><ChevronDown size={18}/></summary>
          <div className="v2-detail-copy">
            <h3>Response-ready, using only the past</h3>
            <p>The target asks whether a listener could naturally respond with future speech hidden. Audio is 16 kHz mono; 300/600 ms refer to the audio cutoff. Paired comparisons use matched decision points; longer recordings can use rolling windows.</p>
            <h3>Training and evaluation stay separate</h3>
            <p>The {number(training.expanded_count)} training examples include {training.sources.map(source => `${number(source.n)} ${source.name.toLowerCase()}`).join('; ')}. Labels comprise {number(training.labels.EOT)} EOT and {number(training.labels.HOLD)} HOLD examples. Machine consensus is not human gold. Internal validation/test contain {training.internal_validation_count}/{training.internal_test_count} examples; release audits check participant groups and audio hashes against evaluation sets.</p>
            <h3>Human audit and threshold selection</h3>
            <p>Two reviewers agreed on 82 of 91 definitive decisions in a 100-item blind audit (κ = 0.8024). This describes the audit subset, not full-dataset human annotation. Main charts select empirical ROC thresholds on the displayed slice. Freezing thresholds for new speakers is a separate deployment test; the development split has only 35 HOLD examples.</p>
            <div className="v2-inline-links"><a href="/report/training-data-summary.json" download>Training summary <Download size={14}/></a><a href="/report/v2-supplementary.json" download>Calibration & experiment details <Download size={14}/></a></div>
          </div>
        </details>
      </section>
  </>;
  const measurements = <>
      <section className="report-section" id="results">
        <Title index={research ? "01" : "03"} label="Main results">{research ? "Response-ready recall" : "Compare on the same terms."}</Title>
        <p className="v2-intro">Public research test and full evaluation pool, with shared filters and model order. Recall measures how often a true response opportunity is detected within the selected false-positive budget.</p>
        <ResultsExplorer models={report.models}/>
        <SmartTurnTransfer modelAccessHref={research ? '#access-model' : undefined}/>
      </section>

      <section className="report-section" id="latency">
        <Title index={research ? "02" : "04"} label="Waiting time & interruptions">{research ? "Waiting time at a fixed interruption budget" : "How fast, at what risk?"}</Title>
        <p className="v2-intro">Each pair is one decision point evaluated at 300 and 600 ms. Drag any horizontal line to update the false-cut-off budget for all three charts. Lower-left is better.</p>
        <div id="figure-2"><CascadeFrontiers compact includeOriginalLiveKit scopes={scopes}/></div>
        <div className="v2-chart-source"><p>Mean wait uses the EOT points and actual cut-offs use the HOLD points. EOT / HOLD counts are 1,287 / 413 for Pikaia, 716 / 342 for original LiveKit, and 699 / 143 for Response-ready LiveKit. The two LiveKit views differ in both labeling and which points are included.</p><a href="/report/figure-data.json" download>Curve data <Download size={15}/></a></div>
      </section>
  </>;

  return <div className={research ? "report-v2 study-report" : "report-v2"}>
    {!research && <ReportVersionSwitch version={edition}/>}
    <a href={research ? "#results" : "#models"} className="skip-link">Skip to research</a>
    <DisclosureLinks/>
    {opening ?? <div className="hero" id="top">
      <img className="hero-art" src="/art/hero-art.webp" alt="A slender Pikaia suspended in iridescent glass, flowing horizontally through a dark field" fetchPriority="high" width="1419" height="1108"/>
      <Header links={headerLinks}/>
      <div className="hero-copy shell">
        <p className="eyebrow">Pikaia-Turn / Technical report / November 2026</p>
        <h1>Knowing when<br/>to respond.</h1>
        <p className="hero-subtitle">One family. Three compute budgets.</p>
        <p className="hero-description">Audio, context, and the moment a conversation can move on.</p>
        <div className="hero-actions"><a className="button primary" href="#results">Explore the results <ArrowUpRight size={18}/></a><a className="text-link" href="#models">Meet the family <ArrowUpRight size={16}/></a></div>
      </div>
    </div>}
    <Contents items={research ? researchNavigation : navigation}/>

    <main className="shell">
      {research ? <>{measurements}{methods}</> : <>{methods}{measurements}</>}

      <section className="report-section" id="ablations">
        <Title index="05" label="Ablations & transfer">What does context change?</Title>
        <ContextAblation/>
        <details className="report-detail v2-methods" id="training-controls">
          <summary><span>Training and architecture controls</span><ChevronDown size={18}/></summary>
          <div className="v2-detail-copy">
            <p>With the same 3,195 training examples, Pikaia-Turn reaches 81.5% recall versus 60.7% for fine-tuned unmodified Turn-1 on LiveKit response-ready at 600 ms and ≤5% FPR.</p>
            <p>On Pikaia, Nano’s reported architecture sequence goes from 729.8 ms after audio-only fine-tuning to 706.9 ms with prosody/utterance state and 657.0 ms with prompt conditioning. This training-and-architecture comparison differs from removing question text at inference above.</p>
            <p>The <a className="v2-data-link" href="#smart-turn-transfer">Smart Turn transfer experiment</a> uses a larger training pool that overlaps the separate internal validation and test splits. It is evaluated on the Pikaia benchmark and the external LiveKit data.</p>
            <a className="text-link" href="/report/v2-supplementary.json" download>Complete experiment controls <Download size={15}/></a>
          </div>
        </details>
        <details className="report-detail v2-methods" id="transfer">
          <summary><span>External evaluation & failure modes</span><ChevronDown size={18}/></summary>
          <div className="v2-detail-copy">
            <h3>TurnBench Dev</h3><p>On 38 English studio dyads, Mini reaches 91.28% conversation-grouped out-of-fold recall with 617.5 ms median event latency at a ≤10% FPR budget. This setup adds a causal duplex partner-VAD control layer to frozen model weights. It is a local Dev stress test, not a held-out test leaderboard entry.</p>
            <h3>EasyTurn and objective changes</h3><p>Synthetic-speech transfer and explicit “wait” requests remain difficult. Nano’s expanded training checkpoint has lower synthetic-speech AUC than its smaller-data control. Floor-end and response-ready evaluations also change both labels and eligible samples; their score differences do not measure a model improvement.</p>
            <a className="text-link" href="/report/v2-supplementary.json" download>Transfer results & full controls <Download size={15}/></a>
          </div>
        </details>
      </section>

      <section className="report-section v2-resources" id="paper">
        <div className="v2-section-lead"><Title index="06" label="Limits & resources">{research ? 'Limitations and sources' : 'Keep the evidence close.'}</Title><p>This page documents the Pikaia family experiments. The benchmark paper covers the public dataset and open-weight baselines. Sources are listed by experiment below.</p></div>
        <div className="v2-limits" id="discussion"><p><strong>Recorded decisions.</strong> These tests do not measure live interruption repair or end-to-end conversation quality.</p><p><strong>Deployment calibration.</strong> A low observed FPR on a small calibration pool does not guarantee that rate on new speakers.</p><p><strong>Domain boundaries.</strong> Human overlap, synthetic prosody and explicit wait requests need separate validation.</p></div>
        <div className="v2-resource-grid">
          <a href={PDF} target="_blank" rel="noreferrer"><span className="micro-label">BENCHMARK PAPER / PDF</span><h3>Public dataset & baselines <ArrowUpRight size={18}/></h3><p>1,200 public examples across development and research-test splits.</p></a>
          {!research && <a href="https://huggingface.co/datasets/pikaia-ai/interview-eou-benchmark-research" target="_blank" rel="noreferrer"><span className="micro-label">HUGGING FACE / GATED ACCESS</span><h3>Research test data <ArrowUpRight size={18}/></h3><p>1,100 evaluation points. Academic access terms apply.</p></a>}
          <a href="https://github.com/Pikaia-AI/interview-eou-report" target="_blank" rel="noreferrer"><span className="micro-label">GITHUB / REPORT REPOSITORY</span><h3>Code & report assets <ArrowUpRight size={18}/></h3><p>Source materials and reproducibility resources.</p></a>
          <a href="/report/v2-supplementary.json" download><span className="micro-label">TECHNICAL EXPERIMENTS / JSON</span><h3>Controls & supplementary results <Download size={18}/></h3><p>Calibration, transfer, training controls and additional cascade cohorts.</p></a>
        </div>
        <details className="report-detail v2-methods" id="experiment-sources">
          <summary><span>Experiment sources, versions & citation</span><ChevronDown size={18}/></summary>
          <div className="v2-detail-copy">
            <p>Main results use the November 2026 metrics snapshot. Timing curves retain the six-model supplement’s sampled policies; question ablations come from the 15 November paired-input experiment. The benchmark PDF has its own table numbering and does not include the proprietary Pikaia family experiments.</p>
            <p>One archive discrepancy remains unresolved: Turn-1’s full-pool Wait@5% is 412.7 ms in the archived main table and 411.4 ms in the sampled curve. The report editions use the latter curve data; this layout comparison does not recompute predictions or reconcile those records.</p>
            <div className="v2-inline-links"><a href="/report/v2-source-manifest.json" download>Source manifest <Download size={14}/></a><a href="/report/metrics.json" download>Main metrics archive <Download size={14}/></a><a href="/report/citation.bib" download>BibTeX <Download size={14}/></a>{!research && <a href="https://huggingface.co/datasets/pikaia-ai/interview-eou-benchmark" target="_blank" rel="noreferrer">Development data <ArrowUpRight size={14}/></a>}</div>
          </div>
        </details>
        {!research && <p className="source-note">Public audio is gated for non-commercial spoken-dialogue evaluation. Training data and model weights remain private.</p>}
      </section>
      {research && <ResourceAccess/>}
      <footer><a className="brand" href="#top"><img src="/art/brand-mark.webp" alt="" width="56" height="24"/><span><b>Pikaia</b> Research</span></a><p>Pikaia-Turn · November 2026<br/><span>Technical report / {edition.toUpperCase()}</span></p><Link className="text-link" href={edition === 'v3' ? '/v2/' : '/'} prefetch={false}>Compare with {edition === 'v3' ? 'V2' : 'V1'} <ArrowUpRight size={16}/></Link></footer>
    </main>
    {research && <ReportVersionSwitch version={edition}/>}
  </div>;
}
