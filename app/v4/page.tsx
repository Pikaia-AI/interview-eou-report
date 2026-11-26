import type { Metadata } from 'next';
import { ArrowDown, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import report from '../report-data.json';
import { Header } from '../report-ui';
import { FocusedReport } from '../v2/focused-report';
import { ListeningDesk } from '../v3/listening-desk';
import { OutcomeReadout } from './outcome-readout';
import { ModelFamilyV4 } from './model-family-v4';
import { ResultsExplorerV4 } from './results-explorer-v4';
import { CascadeFrontiersV4 } from './cascade-frontiers-v4';
import { GeneralizationV4 } from './generalization-v4';
import { V4ResourceAccess } from './resource-access-fusion';
import '../v3/study.css';
import './study.css';

export const metadata: Metadata = {
  title: 'Pikaia-Turn — Models, open release & technical report',
  description: 'Explore Pikaia-Turn (2.3B), Pikaia-Turn-Mini (0.6B), and open-weight Smart Turn v3.2-Interview (8.0M): causal turn detection, listening study, architecture controls, and waiting-time frontiers.',
};

const companyUrl = process.env.NEXT_PUBLIC_COMPANY_V4_URL || 'https://www.pikaia.ai/';

const frontierScopes = {
  pikaia: { title: 'Our Pikaia benchmark', note: '1,700 paired decisions across Mandarin & English interviews (75 dev, 788 public test, 837 private holdout).' },
  livekit_floor_end: { title: 'LiveKit · original Floor-end', note: '1,058 external LiveKit EOT Bench pairs with original speaker-finished labels.' },
  livekit: { title: 'LiveKit · Response-ready', note: '842 eligible LiveKit pairs relabeled by Pikaia for natural response readiness.' },
};

const EXCLUDED_MODELS = ['Pikaia-Turn-Nano'];

function Opening() {
  return <div className="v4-titlepage" id="top">
    <Header
      links={[['listen', 'Listen'], ['models', 'Models'], ['results', 'Results'], ['latency', 'Timing'], ['access', 'Access']]}
      showPaper={false}
    />
    <div className="shell">
      <div className="v4-folio">
        <p>Pikaia-Turn Technical Report <span>/</span> November 2026</p>
        <a className="v4-folio-home" href={companyUrl}>Pikaia homepage <ArrowUpRight size={13} aria-hidden="true"/></a>
      </div>
      <div className="v4-opening-grid">
        <div className="v4-title-copy">
          <p className="eyebrow">Pikaia-Turn · 2.3B / 0.6B / 8.0M Open</p>
          <h1>Wait or <br/><em>respond?</em></h1>
          <p>Two pauses from the same conversation. Listen to each one, then compare our private server models and open-weight Smart Turn v3.2-Interview across bilingual spoken interviews.</p>
          <div className="v4-hero-specs" aria-label="Study specifications">
            <span>2.3B · 0.6B · 8.0M open</span>
            <span>300 ms pause cutoff</span>
            <span>1,100 research test</span>
          </div>
          <div className="v4-hero-actions">
            <a className="v4-pill-cta" href="#models">Explore the models <ArrowDown size={15} aria-hidden="true"/></a>
            <a className="v4-results-link" href="#readout">1,100-pause readout <ArrowDownRight size={15} aria-hidden="true"/></a>
          </div>
        </div>
        <div className="v4-listening-stage" id="listen"><ListeningDesk optical/></div>
      </div>
    </div>
  </div>;
}

function Colophon() {
  return <footer className="v4-ending">
    <a className="v4-signature" href={companyUrl} aria-label="Pikaia Research, visit the company homepage">Pikaia<span>Research</span><ArrowUpRight size={21} aria-hidden="true"/></a>
    <nav aria-label="Research footer">
      <div><h2>Report</h2><a href="#listen">Listening task</a><a href="#models">Models &amp; release</a><a href="#results">Results &amp; timing</a></div>
      <div><h2>Resources</h2><a href="#access">Dataset and models</a><a href="#paper">Limits &amp; archives</a><a href={companyUrl}>Company homepage ↗</a></div>
    </nav>
  </footer>;
}

export default function Page() {
  const models = report.models
    .filter(m => !EXCLUDED_MODELS.includes(m.name))
    .map(m => (m.name === 'Turn-1' ? { ...m, spec: '2.8B · zero-shot' } : m));
  return (
    <FocusedReport
      edition="v4"
      modelsFirst
      hidePaperPdf
      ablationExcludeModels={EXCLUDED_MODELS}
      opening={<Opening/>}
      overview={<OutcomeReadout/>}
      modelsSection={<ModelFamilyV4/>}
      results={<ResultsExplorerV4 models={models}/>}
      frontiers={<CascadeFrontiersV4 scopes={frontierScopes} excludeModels={EXCLUDED_MODELS}/>}
      generalizationSection={<GeneralizationV4/>}
      access={<V4ResourceAccess/>}
      colophon={<Colophon/>}
    />
  );
}
