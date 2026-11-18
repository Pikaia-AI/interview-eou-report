import { ArrowUpRight, Download } from 'lucide-react';

const results = [
  {
    dataset: 'Pikaia Interview EOU Benchmark',
    scope: 'Our benchmark · Real Mandarin and English research interviews',
    rows: [
      ['Research test recall at ≤5% FPR', '300 ms · 1,100 decisions', '40.23%', '63.79%', '+23.56 pp'],
      ['Research test rank by recall', 'Same test and operating point · six report systems', '#5 of 6', '#4 of 6', 'Up 1 place'],
      ['Full-pool mean cascade wait at ≤5% false cut-offs', '1,700 paired decisions', '735.2 ms', '630.8 ms', '−104.4 ms'],
    ],
  },
  {
    dataset: 'LiveKit EOT Bench',
    scope: 'External benchmark · Task-oriented conversations with voice agents',
    rows: [
      ['ROC-AUC with original Floor-end labels', '300 ms · 1,058 decisions', '0.7998', '0.8474', '+0.0476'],
      ['English mean wait at ≤10% false cut-offs', 'LiveKit evaluation protocol', '723.3 ms', '674.2 ms', '−49.1 ms'],
      ['English reference rank by mean wait', 'Same language and budget · fixed LiveKit snapshot', '#9 of 13', '#7 of 13', 'Up 2 places'],
      ['Mandarin mean wait at ≤10% false cut-offs', 'LiveKit evaluation protocol · rank #3 of 9 in both runs', '658.4 ms', '597.8 ms', '−60.6 ms'],
    ],
  },
];

export function SmartTurnTransfer() {
  return (
    <section className="v2-transfer" id="smart-turn-transfer" aria-labelledby="smart-turn-transfer-title">
      <h3 id="smart-turn-transfer-title">Does interview training transfer?</h3>
      <p className="v2-intro">
        We fine-tuned Smart Turn v3.2 on 3,891 pauses from our own interviews
        (2,757 Mandarin, 1,134 English). We kept its 8M-parameter architecture and
        audio-only input fixed, then evaluated on Pikaia and LiveKit data held out from training.
      </p>
      <div className="v2-transfer-grid">
        {results.map(({ dataset, scope, rows }) => (
          <div className="table-scroll" key={dataset}>
            <table>
              <caption><strong>{dataset}</strong><span>{scope}</span></caption>
              <thead><tr><th scope="col">Metric</th><th scope="col">Original</th><th scope="col">Fine-tuned</th><th scope="col">Change</th></tr></thead>
              <tbody>
                {rows.map(([metric, detail, original, adapted, change]) => (
                  <tr key={metric}>
                    <th scope="row">{metric}<small>{detail}</small></th>
                    <td>{original}</td><td>{adapted}</td><td>{change}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
      <p className="source-note">
        The offline Pikaia and Floor-end results average the three checkpoints’ prediction scores.
        The LiveKit harness averages waiting times across those same training seeds.
        Each reference rank replaces the original Smart Turn score while holding the other systems fixed.
        The LiveKit ranks are local comparisons against the archived leaderboard.
      </p>
      <div className="v2-inline-links">
        <a href="/report/metrics.json" download>Report tables and metrics <Download size={14}/></a>
        <a href="https://github.com/livekit/eot-bench/blob/dd85cd5af2284638dde9b18b52b90d06dd79b8c4/site/src/turn-detector/data.ts" target="_blank" rel="noreferrer">
          LiveKit leaderboard snapshot <ArrowUpRight size={14}/>
        </a>
      </div>
    </section>
  );
}
