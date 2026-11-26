'use client';

import { useState } from 'react';
import { ArrowUpRight, Download } from 'lucide-react';

type Point = { n: number; auc: number; operating: Record<string, { recall: number; fpr: number; tp: number; fp: number; allowed_fp: number }> };
type Model = { name: string; spec: string; color: string; splits: Record<string, Record<string, Record<string, Point>>> };

type ResultRow = {
  name: string;
  spec: string;
  color: string;
  value: number;
  auc: number;
  recall: number;
  fpr: number;
  n: number;
  family: boolean;
};

const FAMILY = new Set(['Pikaia-Turn', 'Pikaia-Turn-Mini', 'Pikaia-Turn-Nano']);

const SPLITS = {
  test_1100: {
    id: 'results-research-test',
    label: 'Research test (1,100)',
    title: 'Public research test',
    eyebrow: '01 / HUGGING FACE · RESEARCH ACCESS',
    scope: '1,100 decision points · 500 Mandarin + 600 English · 65 speaker clusters.',
    note: 'Tier 2 is available through academic gated access on Hugging Face. The separate 100-item development and calibration split is excluded from this test chart.',
  },
  full_2338: {
    id: 'results-full-pool',
    label: 'Full pool (2,338)',
    title: 'Full evaluation pool',
    eyebrow: '02 / ALL THREE TIERS · AGGREGATE ANALYSIS',
    scope: '2,338 decision points · 978 Mandarin + 1,360 English · 150 speaker clusters.',
    note: 'Includes 100 development items, 1,100 research-test items and 1,138 private-holdout items. This is a full-pool analysis, not an independent held-out test or a fully public dataset.',
  },
} as const;

type SplitKey = keyof typeof SPLITS;

function ResultsTable({ rows, split, caption, metric }: {
  rows: ResultRow[];
  split: string;
  caption: string;
  metric: string;
}) {
  return (
    <div className="table-scroll">
      <table data-results-split={split}>
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th>Model</th>
            <th>ROC-AUC</th>
            <th>Recall @{metric === 'auc' ? '5' : metric}% FPR</th>
            <th>Observed FPR</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.name}>
              <th scope="row">{row.name}</th>
              <td>{row.auc.toFixed(4)}</td>
              <td>{row.recall.toFixed(2)}%</td>
              <td>{row.fpr.toFixed(2)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ResultsExplorerV4({ models }: { models: Model[] }) {
  const [split, setSplit] = useState<SplitKey>('test_1100');
  const [cutoff, setCutoff] = useState<'300ms' | '300ms_paired' | '600ms_paired'>('300ms');
  const [language, setLanguage] = useState<'overall' | 'zh' | 'en'>('overall');
  const [metric, setMetric] = useState<'5' | '3' | '1' | 'auc'>('5');
  const [hovered, setHovered] = useState<string | null>(null);
  const [downloadState, setDownloadState] = useState('');

  const isAuc = metric === 'auc';
  const metricLabel = isAuc ? 'ROC-AUC' : `Recall at ≤${metric}% FPR`;
  const cutoffLabel = cutoff === '300ms' ? '300 ms · all items' : cutoff === '300ms_paired' ? '300 ms · paired subset' : '600 ms · paired subset';
  const languageLabel = language === 'overall' ? 'Mandarin + English' : language === 'zh' ? 'Mandarin' : 'English';
  const selectionLabel = `${cutoffLabel} · ${languageLabel}`;

  const valueOf = (point: Point) => (isAuc ? point.auc : point.operating[metric].recall * 100);
  const orderedModels = [...models].sort((a, b) => valueOf(b.splits.test_1100[cutoff][language]) - valueOf(a.splits.test_1100[cutoff][language]));

  const rowsFor = (targetSplit: string): ResultRow[] =>
    orderedModels.map(model => {
      const point = model.splits[targetSplit][cutoff][language];
      const op = point.operating[isAuc ? '5' : metric];
      return {
        name: model.name,
        spec: model.spec,
        color: model.color,
        value: valueOf(point),
        auc: point.auc,
        recall: op.recall * 100,
        fpr: op.fpr * 100,
        n: point.n,
        family: FAMILY.has(model.name),
      };
    });

  const activeMeta = SPLITS[split];
  const rows = rowsFor(split);
  const otherSplit: SplitKey = split === 'test_1100' ? 'full_2338' : 'test_1100';
  const otherMeta = SPLITS[otherSplit];
  const otherRows = rowsFor(otherSplit);
  const privateRows = rowsFor('test_private_1138');
  const focusedRow = rows.find(r => r.name === hovered) ?? rows[0];
  const ticks = isAuc ? ['0.0', '0.25', '0.50', '0.75', '1.0'] : ['0%', '25%', '50%', '75%', '100%'];

  function downloadCsv(targetRows: ResultRow[], targetSplit: string, title: string) {
    const csv = [
      'Model,Specification,N,AUC,Recall_pct,FPR_pct,Split,Cutoff,Language,Metric',
      ...targetRows.map(row =>
        [
          row.name,
          row.spec,
          row.n,
          row.auc,
          row.recall.toFixed(4),
          row.fpr.toFixed(4),
          targetSplit,
          cutoff,
          language,
          isAuc ? 'AUC (recall/FPR at 5%)' : `Recall at ${metric}% FPR`,
        ]
          .map(v => '"' + String(v).replaceAll('"', '""') + '"')
          .join(','),
      ),
    ].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `pikaia-${targetSplit}-${cutoff}-${language}-${metric}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setDownloadState(`${title} CSV downloaded`);
  }

  return (
    <div className="v4r-wrap">
      <article className="v4r-console" id={activeMeta.id} aria-labelledby="v4r-panel-title">
        <div className="v4r-controls" role="group" aria-label="Evaluation chart filters">
          <div className="v4r-ctrl-group">
            <span className="v4r-ctrl-lbl">Split</span>
            <div className="v4r-seg" role="group" aria-label="Evaluation split">
              {(['test_1100', 'full_2338'] as const).map(key => (
                <button key={key} type="button" aria-pressed={split === key} onClick={() => setSplit(key)}>
                  {SPLITS[key].label}
                </button>
              ))}
            </div>
          </div>

          <div className="v4r-ctrl-group">
            <span className="v4r-ctrl-lbl">Cutoff</span>
            <div className="v4r-seg" role="group" aria-label="Audio cutoff">
              <button type="button" aria-pressed={cutoff === '300ms'} onClick={() => setCutoff('300ms')}>300 ms · all</button>
              <button type="button" aria-pressed={cutoff === '300ms_paired'} onClick={() => setCutoff('300ms_paired')}>300 ms · paired</button>
              <button type="button" aria-pressed={cutoff === '600ms_paired'} onClick={() => setCutoff('600ms_paired')}>600 ms · paired</button>
            </div>
          </div>

          <div className="v4r-ctrl-group">
            <span className="v4r-ctrl-lbl">Lang</span>
            <div className="v4r-seg" role="group" aria-label="Language filter">
              <button type="button" aria-pressed={language === 'overall'} onClick={() => setLanguage('overall')}>ZH + EN</button>
              <button type="button" aria-pressed={language === 'zh'} onClick={() => setLanguage('zh')}>Mandarin</button>
              <button type="button" aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>English</button>
            </div>
          </div>

          <div className="v4r-ctrl-group">
            <span className="v4r-ctrl-lbl">Metric</span>
            <div className="v4r-seg" role="group" aria-label="Evaluation metric">
              <button type="button" aria-pressed={metric === '5'} onClick={() => setMetric('5')}>≤5% FPR</button>
              <button type="button" aria-pressed={metric === '3'} onClick={() => setMetric('3')}>≤3%</button>
              <button type="button" aria-pressed={metric === '1'} onClick={() => setMetric('1')}>≤1%</button>
              <button type="button" aria-pressed={metric === 'auc'} onClick={() => setMetric('auc')}>AUC</button>
            </div>
          </div>
        </div>

        <div className="v4r-meta-band">
          <div>
            <p className="v4r-eyebrow">{activeMeta.eyebrow}</p>
            <h3 id="v4r-panel-title">
              {metricLabel}
              <span>N = {rows[0].n.toLocaleString('en-US')} · {selectionLabel} · Higher is better</span>
            </h3>
            <p className="v4r-note">
              {activeMeta.note}
              {split === 'test_1100' && (
                <> <a href="https://huggingface.co/datasets/pikaia-ai/interview-eou-benchmark-research" target="_blank" rel="noreferrer">View research dataset <ArrowUpRight size={12} aria-hidden="true"/></a></>
              )}
            </p>
          </div>
          <p className="v4r-telemetry" aria-live="polite">
            {hovered ? focusedRow.name : `${focusedRow.name} leads`} · AUC {focusedRow.auc.toFixed(4)} · R@{isAuc ? '5' : metric}% {focusedRow.recall.toFixed(2)}% · Obs FPR {focusedRow.fpr.toFixed(2)}%
          </p>
        </div>

        <div className="v4r-bars" role="region" aria-label={`${activeMeta.title}: ${metricLabel}. ${selectionLabel}.`} tabIndex={0}>
          {rows.map(row => {
            const pct = isAuc ? row.value * 100 : row.value;
            const bg = row.family
              ? `linear-gradient(90deg, ${row.color}40 0%, ${row.color}cc 68%, ${row.color} 100%)`
              : `linear-gradient(90deg, ${row.color}22 0%, ${row.color}55 100%)`;
            const valStr = isAuc ? row.value.toFixed(4) : `${row.value.toFixed(2)}%`;
            return (
              <div
                key={row.name}
                className={row.family ? 'v4r-bar-row family' : 'v4r-bar-row baseline'}
                onMouseEnter={() => setHovered(row.name)}
                onMouseLeave={() => setHovered(null)}
              >
                <div className="v4r-name-col">
                  <span className="v4r-model-name">{row.name}</span>
                  <span className="v4r-spec-tag">{row.spec.split('·')[0].trim()}</span>
                </div>
                <div className="v4r-track" aria-hidden="true">
                  <div className="v4r-fill" style={{ width: `${pct.toFixed(2)}%`, background: bg, color: row.color }}/>
                </div>
                <div className="v4r-val">{valStr}</div>
              </div>
            );
          })}
          <div className="v4r-axis-row" aria-hidden="true">
            <span className="v4r-axis-legend">Luminous bars: Pikaia family</span>
            <div className="v4r-axis-ticks">{ticks.map(t => <span key={t}>{t}</span>)}</div>
            <span/>
          </div>
        </div>

        <div className="v4r-footer">
          <p>Empirical ROC points on this slice, not frozen deployment thresholds. Models ordered by research-test score. <a href="#protocol">Evaluation protocol</a></p>
          <button type="button" className="v4r-export-btn" onClick={() => downloadCsv(rows, split, activeMeta.title)} aria-label={`Export ${activeMeta.title} as CSV`}>
            <Download size={14} aria-hidden="true"/> Export CSV
          </button>
        </div>

        <details className="v4r-details">
          <summary>View exact values · Public research test &amp; Full evaluation pool</summary>
          <ResultsTable rows={rows} split={split} caption={`${activeMeta.title} · ${selectionLabel} · N=${rows[0].n.toLocaleString('en-US')}`} metric={metric}/>
          <ResultsTable rows={otherRows} split={otherSplit} caption={`${otherMeta.title} · ${selectionLabel} · N=${otherRows[0].n.toLocaleString('en-US')}`} metric={metric}/>
        </details>
      </article>

      <details className="chart-table holdout-values v4r-holdout">
        <summary>Private holdout · view Tier 3 separately</summary>
        <p className="source-note">1,138 private items in the complete split. Current selection: {privateRows[0].n.toLocaleString('en-US')} decision points.</p>
        <ResultsTable rows={privateRows} split="test_private_1138" caption={`Private holdout · ${selectionLabel} · N=${privateRows[0].n.toLocaleString('en-US')}`} metric={metric}/>
        <button type="button" className="quiet-button" onClick={() => downloadCsv(privateRows, 'test_private_1138', 'Private holdout')}>
          <Download size={14} aria-hidden="true"/> Export private holdout
        </button>
      </details>

      <span className="sr-only" aria-live="polite">{downloadState}</span>
    </div>
  );
}
