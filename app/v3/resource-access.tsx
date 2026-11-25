import { ArrowUpRight, Download } from 'lucide-react';

const development = 'https://huggingface.co/datasets/pikaia-ai/interview-eou-benchmark';
const researchTest = 'https://huggingface.co/datasets/pikaia-ai/interview-eou-benchmark-research';
const modelCard = 'https://huggingface.co/pikaia-ai/smart-turn-v3.2-interview';
const checkpoint = `${modelCard}/resolve/3ae0f8039a3d619b8e00c456e2ab27ce435d3398`;
const inquiry = new URL('https://github.com/Pikaia-AI/interview-eou-report/issues/new');
inquiry.searchParams.set('title', 'Model access inquiry for the Pikaia-Turn family');
inquiry.searchParams.set('body', 'I would like to ask about evaluation access.\n\n**Model of interest**\nPikaia-Turn / Pikaia-Turn-Mini / Pikaia-Turn-Nano\n\n**Planned evaluation**\n');

export function ResourceAccess() {
  return (
    <section className="report-section study-access" id="access" aria-labelledby="access-title">
      <h2 id="access-title">Dataset and model access</h2>
      <div className="access-frame">
        <div className="access-sheet">
          <article className="access-card" aria-labelledby="access-dataset">
            <header>
              <p className="micro-label">Evaluation dataset</p>
              <h3 id="access-dataset">Pikaia Interview EOU Benchmark</h3>
            </header>
            <p className="access-description">Real Mandarin and English interview pauses, labeled for when the interviewer can respond. Available for non-commercial research and evaluation.</p>
            <dl className="access-stats">
              <div><dt>Development examples</dt><dd>100</dd></div>
              <div><dt>Research test examples</dt><dd>1,100</dd></div>
            </dl>
            <div className="access-actions">
              <a className="access-primary" href={researchTest} target="_blank" rel="noreferrer">Request test access <ArrowUpRight size={16} aria-hidden="true"/></a>
              <a href={development} target="_blank" rel="noreferrer">Open development set <ArrowUpRight size={15} aria-hidden="true"/></a>
            </div>
            <p className="access-note">Hugging Face grants development access when you accept the terms. Pikaia reviews research test requests.</p>
          </article>

          <article className="access-card" aria-labelledby="access-model">
            <header>
              <p className="micro-label">Open-weight model</p>
              <h3 id="access-model">Smart Turn v3.2-Interview</h3>
            </header>
            <p className="access-description">Pikaia fine-tuned this audio-only turn detector on bilingual interviews. Both downloads contain the released seed 29 checkpoint.</p>
            <dl className="access-stats">
              <div><dt>Parameters</dt><dd>8.0M</dd></div>
              <div><dt>Training examples</dt><dd>3,891</dd></div>
            </dl>
            <div className="access-actions">
              <a className="access-primary" href={`${checkpoint}/smart-turn-v3.2-interview.onnx?download=true`}>Download ONNX <Download size={16} aria-hidden="true"/></a>
              <a href={`${checkpoint}/model.safetensors?download=true`}>Download safetensors <Download size={15} aria-hidden="true"/></a>
            </div>
            <p className="access-note">BSD 2-Clause license · <a href={modelCard} target="_blank" rel="noreferrer">Hugging Face model card <ArrowUpRight size={13} aria-hidden="true"/></a></p>
          </article>

          <aside className="access-private" aria-labelledby="access-family">
            <div>
              <h3 id="access-family">Pikaia-Turn family</h3>
              <p>Pikaia-Turn, Pikaia-Turn-Mini and Pikaia-Turn-Nano have private weights.</p>
            </div>
            <div className="access-inquiry">
              <a href={inquiry.href} target="_blank" rel="noreferrer">Ask about model access <ArrowUpRight size={15} aria-hidden="true"/></a>
              <span>Opens a public GitHub issue draft</span>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
