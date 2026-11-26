import type { Metadata } from 'next';
import { ArrowDown, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import report from '../report-data.json';
import { Header } from '../report-ui';
import { FocusedReport } from '../v2/focused-report';
import { ListeningDesk } from '../v3/listening-desk';
import { OutcomeReadout } from './outcome-readout';
import { ResultsExplorerV4 } from './results-explorer-v4';
import { CascadeFrontiersV4 } from './cascade-frontiers-v4';
import { V4ResourceAccess } from './resource-access-fusion';
import '../v3/study.css';
import './study.css';

export const metadata: Metadata = {
  title: 'Pikaia-Turn — Listening study / Technical report V4',
  description: 'Listen at a real conversational pause, then compare response opportunities, false cut-offs and waiting time in Pikaia’s bilingual turn-taking benchmarks.',
};

const companyUrl = process.env.NEXT_PUBLIC_COMPANY_V4_URL || 'https://www.pikaia.ai/';

const frontierScopes = {
  pikaia: { title: 'Our Pikaia benchmark', note: '1,700 paired decisions across Mandarin & English interviews (75 dev, 788 public test, 837 private holdout).' },
  livekit_floor_end: { title: 'LiveKit · original Floor-end', note: '1,058 external LiveKit EOT Bench pairs with original speaker-finished labels.' },
  livekit: { title: 'LiveKit · Response-ready', note: '842 eligible LiveKit pairs relabeled by Pikaia for natural response readiness.' },
};

function Opening() {
  return <div className="v4-titlepage" id="top">
    <Header links={[['listen', 'Listen'], ['readout', 'Results'], ['latency', 'Timing'], ['access', 'Access']]}/>
    <div className="shell">
      <div className="v4-folio">
        <p>Technical report <span>/</span> November 2026</p>
        <a className="v4-folio-home" href={companyUrl}>Pikaia homepage <ArrowUpRight size={13} aria-hidden="true"/></a>
      </div>
      <div className="v4-opening-grid">
        <div className="v4-title-copy">
          <p className="eyebrow">Pikaia-Turn · Technical Report</p>
          <h1>Wait or <br/><em>respond?</em></h1>
          <p>Two pauses from the same conversation. Listen to each one and decide whether the other person can take a turn.</p>
          <div className="v4-hero-specs" aria-label="Study specifications">
            <span>16 kHz mono</span>
            <span>300 ms pause cutoff</span>
            <span>1,100 research test</span>
          </div>
          <div className="v4-hero-actions">
            <a className="v4-pill-cta" href="#readout">See measured results <ArrowDown size={15} aria-hidden="true"/></a>
            <a className="v4-results-link" href="#latency">Waiting-time curves <ArrowDownRight size={15} aria-hidden="true"/></a>
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
      <div><h2>Report</h2><a href="#listen">Listening task</a><a href="#readout">Results overview</a><a href="#latency">Waiting time</a></div>
      <div><h2>Resources</h2><a href="#access">Dataset and models</a><a href="/report/pikaia-interview-eou-benchmark.pdf">Benchmark paper</a><a href={companyUrl}>Company homepage ↗</a></div>
    </nav>
  </footer>;
}

export default function Page() {
  return (
    <FocusedReport
      edition="v4"
      opening={<Opening/>}
      overview={<OutcomeReadout/>}
      results={<ResultsExplorerV4 models={report.models}/>}
      frontiers={<CascadeFrontiersV4 scopes={frontierScopes}/>}
      access={<V4ResourceAccess/>}
      colophon={<Colophon/>}
    />
  );
}
