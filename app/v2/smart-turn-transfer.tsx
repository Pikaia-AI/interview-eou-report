import { ArrowRight, ArrowUpRight, Download } from 'lucide-react';

type Metric = {
  title: string;
  scope: string;
  unit: '%' | 'ms';
  original: number;
  fineTuned: number;
  rank?: { title: string; original: number; fineTuned: number; systems: number };
  note?: string;
};

const results: { dataset: string; scope: string; metrics: Metric[] }[] = [
  {
    dataset: 'Pikaia Interview EOU Benchmark',
    scope: 'Our benchmark · Real Mandarin and English research interviews',
    metrics: [
      {
        title: 'Research test recall',
        scope: '300 ms · 1,100 decisions · ≤5% false-positive rate',
        unit: '%', original: 40.23, fineTuned: 63.79,
        rank: { title: 'Report rank by recall', original: 5, fineTuned: 4, systems: 6 },
      },
      {
        title: 'Mean cascade wait',
        scope: '1,700 full-pool pairs · ≤5% false cut-offs',
        unit: 'ms', original: 735.2, fineTuned: 630.8,
      },
    ],
  },
  {
    dataset: 'LiveKit EOT Bench',
    scope: 'External benchmark · Task-oriented conversations with voice agents',
    metrics: [
      {
        title: 'Recall on original Floor-end labels',
        scope: '300 ms · 1,058 decisions · ≤5% false-positive rate',
        unit: '%', original: 29.19, fineTuned: 33.24,
        note: 'ROC-AUC on the same decisions improved from 0.7998 to 0.8474.',
      },
      {
        title: 'English mean wait',
        scope: 'LiveKit evaluation protocol · ≤10% false cut-offs',
        unit: 'ms', original: 723.3, fineTuned: 674.2,
        rank: { title: 'Reference rank by mean wait', original: 9, fineTuned: 7, systems: 13 },
      },
      {
        title: 'Mandarin mean wait',
        scope: 'LiveKit evaluation protocol · ≤10% false cut-offs',
        unit: 'ms', original: 658.4, fineTuned: 597.8,
        rank: { title: 'Reference rank by mean wait', original: 3, fineTuned: 3, systems: 9 },
      },
    ],
  },
];

function TransferMetric({ title, scope, unit, original, fineTuned, rank, note }: Metric) {
  const isRecall = unit === '%';
  const axisMax = isRecall ? 100 : 1000;
  const digits = isRecall ? 2 : 1;
  const numberUnit = isRecall ? '%' : ' ms';
  const change = fineTuned - original;
  const delta = `${change > 0 ? '+' : '−'}${Math.abs(change).toFixed(digits)} ${isRecall ? 'pp' : 'ms'}`;
  const rankGain = rank ? rank.original - rank.fineTuned : 0;

  return (
    <div className="v2-transfer-metric">
      <div className="v2-transfer-metric-heading">
        <div><h5>{title}</h5><p>{scope}</p></div>
        <strong>{delta}</strong>
      </div>
      <dl className="v2-transfer-bars">
        {([['Original', original], ['Fine-tuned', fineTuned]] as const).map(([variant, value]) => (
          <div className="v2-transfer-bar" key={variant}>
            <dt>{variant}</dt>
            <dd>
              <span className="v2-transfer-track" aria-hidden="true">
                <i style={{ width: `${value / axisMax * 100}%` }}/>
              </span>
              <span className="v2-transfer-value">{value.toFixed(digits)}{numberUnit}</span>
            </dd>
          </div>
        ))}
      </dl>
      <div className="v2-transfer-axis" aria-hidden="true">
        <span>0</span><span>{isRecall ? '100%' : '1,000 ms'}</span>
      </div>
      {rank && (
        <div className="v2-transfer-rank">
          <div className="v2-transfer-rank-label"><span>{rank.title}</span>
            <span>{rankGain ? `Up ${rankGain} ${rankGain === 1 ? 'place' : 'places'}` : 'Same rank'}</span>
          </div>
          <div className="v2-transfer-rank-flow">
            <span><b>#{rank.original}</b> of {rank.systems}<small>Original</small></span>
            <ArrowRight size={17} aria-hidden="true"/>
            <span><b>#{rank.fineTuned}</b> of {rank.systems}<small>Fine-tuned</small></span>
          </div>
        </div>
      )}
      {note && <p className="v2-transfer-metric-note">{note}</p>}
    </div>
  );
}

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
        {results.map(({ dataset, scope, metrics }) => (
          <figure className="v2-transfer-figure" key={dataset}>
            <figcaption><h4>{dataset}</h4><p>{scope}</p></figcaption>
            {metrics.map(metric => <TransferMetric key={metric.title} {...metric}/>)}
          </figure>
        ))}
      </div>
      <p className="source-note">
        Higher recall and shorter waits are better. Ranks use the metric and budget shown above each rank.
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
