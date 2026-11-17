import { ChevronDown, Download } from 'lucide-react';
import data from '../public/report/training-data-summary.json';

const count = (value: number) => value.toLocaleString('en-US');

export function TrainingData() {
  return <section className="training-data" id="training-data" aria-labelledby="training-data-title">
    <div className="subsection-heading">
      <div><p className="micro-label">TRAINING DATA / PRIVATE INTERVIEW CORPUS</p><h3 id="training-data-title">Learning from real<br/>interview moments.</h3></div>
      <p>The Pikaia-Turn, Mini and Nano checkpoints presented here use an expanded corpus of {count(data.expanded_count)} real Mandarin and English interview examples. The controlled data ablation compares this split with its {count(data.curated_count)}-example curated base.</p>
    </div>
    <div className="training-growth" aria-label="Training corpus expansion">
      <div><strong>{count(data.curated_count)}</strong><span>Curated bilingual base</span></div>
      <div><strong><small>+</small> {count(data.added_mandarin_count)}</strong><span>Additional Mandarin examples</span></div>
      <div><strong><small>=</small> {count(data.expanded_count)}</strong><span>Expanded training examples</span></div>
    </div>
    <p className="training-balance">{count(data.languages.zh)} Mandarin · {count(data.languages.en)} English<span>{count(data.labels.EOT)} EOT / response-ready · {count(data.labels.HOLD)} HOLD / keep listening</span></p>
    <div className="table-scroll training-table" role="region" aria-label="Training source composition" tabIndex={0}>
      <table>
        <caption>Source composition of the expanded training split</caption>
        <thead><tr><th scope="col">Source pool</th><th scope="col">Examples</th><th scope="col">Mandarin</th><th scope="col">English</th></tr></thead>
        <tbody>{data.sources.map(source => <tr key={source.name}>
          <th scope="row">{source.name}<span>{source.description}</span></th>
          <td>{count(source.n)}</td><td>{count(source.zh)}</td><td>{count(source.en)}</td>
        </tr>)}</tbody>
        <tfoot><tr><th scope="row">Expanded total</th><td>{count(data.expanded_count)}</td><td>{count(data.languages.zh)}</td><td>{count(data.languages.en)}</td></tr></tfoot>
      </table>
    </div>
    <div className="training-methods">
      <article><h4>A causal input</h4><p>Each example pairs the preceding interviewer question with user audio ending at the decision point, in 16 kHz mono PCM. The target asks whether a listener can naturally respond. Future speech is hidden.</p></article>
      <article><h4>Label provenance stays visible</h4><p>The corpus combines an earlier human-reviewed source pool with machine-reviewed examples under the response-ready labeling protocol. Three-model agreement is machine consensus; it does not make the entire corpus human-annotated gold data.</p></article>
      <article><h4>Evaluation stays separate</h4><p>The selected split reserves {count(data.internal_validation_count)} internal validation and {count(data.internal_test_count)} internal test examples. Release audits check participant/interview groups and normalized audio hashes for overlap with the interview benchmark and external evaluation sets.</p></article>
    </div>
    <details className="prose-detail training-scope">
      <summary>Split definitions and release scope <ChevronDown size={17}/></summary>
      <div className="prose">
        <p>The historical split identifier contains “2085”; after label filtering, the curated base used here contains 2,025 examples. Adding 1,170 Mandarin examples gives the 3,195-example expanded split. Counts refer to training examples, not distinct interviews or speakers.</p>
        <p>The three family checkpoints use this same selected split. Table 8 separately reports a 3,891-example strict training arm for the Smart Turn baseline. That larger pool folds in examples from the internal validation/test pool and is not eligible for evaluation on those internal splits.</p>
        <p>The training corpus remains private. The Hugging Face development and research-test releases are evaluation datasets; they are not the training corpus described here. The public summary exposes aggregate counts and a source-manifest checksum.</p>
      </div>
    </details>
    <p className="source-note training-source">Training-manifest snapshot · November 2026 · <a href="/report/training-data-summary.json" download>Download aggregate summary <Download size={13}/></a> · <a href="#ablations">Data × architecture ablation</a></p>
  </section>;
}
