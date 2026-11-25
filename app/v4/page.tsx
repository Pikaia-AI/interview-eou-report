import type { Metadata } from 'next';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { Header } from '../report-ui';
import { ResearchEditionSwitch } from '../report-version-switch';
import { FocusedReport } from '../v2/focused-report';
import { ListeningDesk } from '../v3/listening-desk';
import { OutcomeReadout } from './outcome-readout';
import '../v3/study.css';
import './study.css';
import './resource-cards.css';

export const metadata: Metadata = {
  title: 'Pikaia-Turn — Listening study / Technical report V4',
  description: 'Listen at a real conversational pause, then compare response opportunities, false cut-offs and waiting time in Pikaia’s bilingual turn-taking benchmarks.',
};

function Opening() {
  return <div className="v4-titlepage" id="top">
    <Header links={[['listen', 'Listen'], ['readout', 'Results'], ['latency', 'Timing'], ['access', 'Access']]}/>
    <div className="shell">
      <div className="v4-folio">
        <p>Technical report <span>/</span> November 2026</p>
        <ResearchEditionSwitch version="v4"/>
      </div>
      <div className="v4-opening-grid">
        <div className="v4-title-copy">
          <p className="eyebrow">Pikaia-Turn</p>
          <h1>Wait or <br/><em>respond?</em></h1>
          <p>Two pauses from the same conversation. Listen to each one and decide whether the other person can take a turn.</p>
          <a className="v4-results-link" href="#readout">See measured results <ArrowDown size={16} aria-hidden="true"/></a>
        </div>
        <div className="v4-listening-stage" id="listen"><ListeningDesk/></div>
      </div>
    </div>
  </div>;
}

function Colophon() {
  const company = process.env.NEXT_PUBLIC_COMPANY_V4_URL || 'https://www.pikaia.ai/';
  return <footer className="v4-ending">
    <a className="v4-signature" href={company} aria-label="Pikaia Research, visit the company homepage">Pikaia<span>Research</span><ArrowUpRight size={21} aria-hidden="true"/></a>
    <nav aria-label="Research footer">
      <div><h2>Report</h2><a href="#listen">Listening task</a><a href="#readout">Results overview</a><a href="#latency">Waiting time</a></div>
      <div><h2>Resources</h2><a href="#access">Dataset and models</a><a href="/report/pikaia-interview-eou-benchmark.pdf">Benchmark paper</a><a href={company}>Company homepage ↗</a></div>
    </nav>
  </footer>;
}

export default function Page() {
  return <FocusedReport edition="v4" opening={<Opening/>} overview={<OutcomeReadout/>} colophon={<Colophon/>}/>;
}
