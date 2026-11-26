'use client';
/* eslint-disable @next/next/no-img-element -- Report artwork is pre-optimized locally and served at explicit dimensions. */
import { useEffect, useState, useSyncExternalStore } from 'react';
import { ArrowUpRight, Menu, X, Copy, Check, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

type Point = {n:number; auc:number; operating:Record<string,{recall:number;fpr:number;tp:number;fp:number;allowed_fp:number}>};
type Model = {name:string;spec:string;color:string;splits:Record<string,Record<string,Record<string,Point>>>};
type CascadeData = Record<string,{n:number; models:{name:string;color:string;operating:Record<string,{cum_recall_pct:number;cum_fir_pct:number;mean_wait_ms:number}>}[]}>;
const navigation=[['overview','Overview'],['benchmark','Benchmark'],['models','Models'],['results','Results'],['protocol','Protocol'],['transfer','Transfer'],['ablations','Ablations'],['paper','Paper']];
const headerNavigation=[['overview','Overview'],['benchmark','Benchmark'],['results','Results']];

export function Header({links=headerNavigation,showPaper=true}:{links?:string[][];showPaper?:boolean}={}){const[open,setOpen]=useState(false);useEffect(()=>{const escape=(e:KeyboardEvent)=>{if(e.key==='Escape')setOpen(false)};window.addEventListener('keydown',escape);return()=>window.removeEventListener('keydown',escape)},[]);return <header className="site-header shell"><a className="brand" href="#top"><img src="/art/brand-mark.webp" alt="" width="56" height="24"/><span><b>Pikaia</b> Research</span></a><nav className={open?'header-nav open':'header-nav'} aria-label="Main navigation" id="header-navigation">{links.map(([id,label])=><a key={id} href={`#${id}`} onClick={()=>setOpen(false)}>{label}</a>)}{showPaper&&<a className="header-paper" href="/report/pikaia-interview-eou-benchmark.pdf" target="_blank" rel="noreferrer">Benchmark paper <ArrowUpRight size={16}/></a>}</nav><button className="menu-button" aria-label={open?'Close navigation':'Open navigation'} aria-expanded={open} aria-controls="header-navigation" onClick={()=>setOpen(!open)}>{open?<X size={22}/>:<Menu size={22}/>}</button></header>}

export function Contents({items=navigation}:{items?:string[][]}={}){const[active,setActive]=useState(items[0][0]);useEffect(()=>{const o=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting)setActive(entry.target.id)})},{rootMargin:'-10% 0px -65% 0px'});items.forEach(([id])=>{const el=document.getElementById(id);if(el)o.observe(el)});return()=>o.disconnect()},[items]);return <nav className="contents" aria-label="Report contents"><div className="shell contents-inner"><span className="contents-title">IN THIS REPORT</span>{items.map(([id,label])=><a key={id} href={`#${id}`} aria-current={active===id?'location':undefined}>{label}</a>)}</div></nav>}

export function DisclosureLinks(){useEffect(()=>{const reveal=()=>{const id=decodeURIComponent(location.hash.slice(1));if(!id)return;const target=document.getElementById(id);if(!target)return;let el:HTMLElement|null=target;while(el){if(el instanceof HTMLDetailsElement)el.open=true;el=el.parentElement;}requestAnimationFrame(()=>target.scrollIntoView({block:'start'}));};reveal();window.addEventListener('hashchange',reveal);return()=>window.removeEventListener('hashchange',reveal)},[]);return null}

export function Timeline(){const[example,setExample]=useState('complete');const[cutoff,setCutoff]=useState(300);return <div className="timeline"><div className="segmented" role="group" aria-label="Illustrative utterance"><button aria-pressed={example==='complete'} onClick={()=>setExample('complete')}>Complete thought</button><button aria-pressed={example==='thinking'} onClick={()=>setExample('thinking')}>Thinking pause</button></div><p className="sample-utterance">{example==='complete'?'“The follow-up questions helped us see what mattered.”':'“There were three reasons. The first was…”'}</p><div className="wave-visual"><img src="/art/waveform-art.webp" alt="Illustrative waveform, not a recording" width="1000" height="400"/><div className="cutoff-marker" style={{left:cutoff===300?'70%':'87%'}}><span>{example==='complete'?'Response-ready':'Keep listening'}</span><i/><b>{cutoff} ms</b></div></div><div className="timeline-bottom"><span>Illustrative timeline · no recorded audio</span><div className="segmented small" role="group" aria-label="Observation cutoff">{[300,600].map(v=><button key={v} aria-pressed={cutoff===v} onClick={()=>setCutoff(v)}>{v} ms</button>)}</div></div><p className="timeline-explanation" aria-live="polite">{example==='complete'?'A coherent thought may invite a response, even if the speaker would later elaborate.':'A pause inside an unfinished thought still asks the agent to listen.'}</p></div>}

const subscribeToHydration = () => () => {};

function MetricChart({rows,max,unit,label}:{rows:{name:string;value:number;color:string}[];max:number;unit:string;label:string}){const mounted=useSyncExternalStore(subscribeToHydration,()=>true,()=>false);return <div className="chart-scroll" role="region" aria-label={label} tabIndex={0}><div className="chart-canvas">{mounted&&<ResponsiveContainer width="100%" height={360}><BarChart data={rows} layout="vertical" margin={{top:5,right:76,left:0,bottom:12}} barSize={15}><CartesianGrid stroke="#292a32" horizontal={false} strokeDasharray="2 5"/><XAxis type="number" domain={[0,max]} tick={{fill:'#92939f',fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v=>unit==='auc'?Number(v).toFixed(1):`${v}${unit}`}/><YAxis type="category" dataKey="name" width={202} tick={{fill:'#e6e4ec',fontSize:12}} axisLine={false} tickLine={false}/><Tooltip cursor={{fill:'#ffffff05'}} contentStyle={{background:'#15151c',border:'1px solid #45434e',borderRadius:8,color:'#f4f1fa',fontSize:13}} formatter={(value)=>[unit==='auc'?Number(value).toFixed(4):`${Number(value).toFixed(2)}${unit}`,'Value']}/><Bar dataKey="value" isAnimationActive={false} radius={[0,2,2,0]}>{rows.map(r=><Cell key={r.name} fill={r.color}/>)}<LabelList dataKey="value" position="right" fill="#f4f1fa" fontSize={12} formatter={(v)=>unit==='auc'?Number(v).toFixed(4):`${Number(v).toFixed(2)}${unit}`}/></Bar></BarChart></ResponsiveContainer>}</div></div>}

type ResultRow = {
 name: string; spec: string; color: string; value: number;
 auc: number; recall: number; fpr: number; n: number;
};

function ResultsTable({rows, split, caption, metric}: {
 rows: ResultRow[]; split: string; caption: string; metric: string;
}) {
 return <div className="table-scroll"><table data-results-split={split}>
  <caption>{caption}</caption>
  <thead><tr><th>Model</th><th>ROC-AUC</th><th>Recall @{metric === 'auc' ? '5' : metric}% FPR</th><th>Observed FPR</th></tr></thead>
  <tbody>{rows.map(row => <tr key={row.name}>
   <th scope="row">{row.name}</th><td>{row.auc.toFixed(4)}</td>
   <td>{row.recall.toFixed(2)}%</td><td>{row.fpr.toFixed(2)}%</td>
  </tr>)}</tbody>
 </table></div>;
}

export function ResultsExplorer({models}: {models: Model[]}) {
 const [cutoff, setCutoff] = useState('300ms');
 const [language, setLanguage] = useState('overall');
 const [metric, setMetric] = useState('5');
 const [downloadState, setDownloadState] = useState('');
 const metricLabel = metric === 'auc' ? 'ROC-AUC' : `Recall at ≤${metric}% FPR`;
 const cutoffLabel = cutoff === '300ms' ? '300 ms · all items' : cutoff === '300ms_paired' ? '300 ms · paired subset' : '600 ms · paired subset';
 const languageLabel = language === 'overall' ? 'Mandarin + English' : language === 'zh' ? 'Mandarin' : 'English';
 const selectionLabel = `${cutoffLabel} · ${languageLabel}`;
 function value(point: Point) {
  return metric === 'auc' ? point.auc : point.operating[metric].recall * 100;
 }
 // A shared order keeps each model in the same position in both charts.
 const orderedModels = [...models].sort((a, b) => value(b.splits.test_1100[cutoff][language]) - value(a.splits.test_1100[cutoff][language]));
 function rowsFor(split: string): ResultRow[] {
  return orderedModels.map(model => {
   const point = model.splits[split][cutoff][language];
   const operating = point.operating[metric === 'auc' ? '5' : metric];
   return {name: model.name, spec: model.spec, color: model.color, value: value(point),
    auc: point.auc, recall: operating.recall * 100, fpr: operating.fpr * 100, n: point.n};
  });
 }
 const panels = [
  {split: 'test_1100', id: 'results-research-test', title: 'Public research test', eyebrow: '01 / HUGGING FACE · RESEARCH ACCESS',
   scope: '1,100 decision points · 500 Mandarin + 600 English · 65 speaker clusters.',
   note: 'Tier 2 is available through academic gated access on Hugging Face. The separate 100-item development and calibration split is excluded from this test chart.',
   rows: rowsFor('test_1100')},
  {split: 'full_2338', id: 'results-full-pool', title: 'Full evaluation pool', eyebrow: '02 / ALL THREE TIERS · AGGREGATE ANALYSIS',
   scope: '2,338 decision points · 978 Mandarin + 1,360 English · 150 speaker clusters.',
   note: 'Includes 100 development items, 1,100 research-test items and 1,138 private-holdout items. This is a full-pool analysis, not an independent held-out test or a fully public dataset.',
   rows: rowsFor('full_2338')},
 ];
 const privateRows = rowsFor('test_private_1138');
 function download(rows: ResultRow[], split: string, title: string) {
  const csv = ['Model,Specification,N,AUC,Recall_pct,FPR_pct,Split,Cutoff,Language,Metric', ...rows.map(row =>
   [row.name, row.spec, row.n, row.auc, row.recall.toFixed(4), row.fpr.toFixed(4), split, cutoff, language,
    metric === 'auc' ? 'AUC (recall/FPR at 5%)' : `Recall at ${metric}% FPR`]
   .map(v => '"' + String(v).replaceAll('"', '""') + '"').join(','))].join('\n');
  const url = URL.createObjectURL(new Blob([csv], {type: 'text/csv;charset=utf-8;'}));
  const link = document.createElement('a');
  link.href = url; link.download = `pikaia-${split}-${cutoff}-${language}-${metric}.csv`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  setDownloadState(`${title} CSV downloaded`);
 }
 return <div className="explorer results-comparison">
  <div className="explorer-controls three" role="group" aria-label="Shared filters for both evaluation charts">
   <label>Audio cutoff<select value={cutoff} onChange={e => setCutoff(e.target.value)}>
    <option value="300ms">300 ms · all items</option><option value="300ms_paired">300 ms · paired subset</option><option value="600ms_paired">600 ms · paired subset</option>
   </select></label>
   <label>Language<select value={language} onChange={e => setLanguage(e.target.value)}>
    <option value="overall">Mandarin + English</option><option value="zh">Mandarin</option><option value="en">English</option>
   </select></label>
   <label>Metric<select value={metric} onChange={e => setMetric(e.target.value)}>
    <option value="5">Recall at ≤5% FPR</option><option value="3">Recall at ≤3% FPR</option><option value="1">Recall at ≤1% FPR</option><option value="auc">ROC-AUC</option>
   </select></label>
  </div>
  <p className="comparison-guide">Both charts share the filters, axis scale and model order. Models are ordered by the research-test result.</p>
  {panels.map(panel => <article className="result-panel" key={panel.split} id={panel.id} aria-labelledby={`${panel.id}-title`}>
   <p className="micro-label">{panel.eyebrow}</p>
   <h3 id={`${panel.id}-title`}>{panel.title}</h3>
   <p className="result-scope">{panel.scope}</p>
   <p className="result-note">{panel.note}{panel.split === 'test_1100' && <> <a href="https://huggingface.co/datasets/pikaia-ai/interview-eou-benchmark-research" target="_blank" rel="noreferrer">View research dataset <ArrowUpRight size={12}/></a></>}</p>
   <div className="chart-heading"><h4>{metricLabel}<span>Higher is better</span></h4><span aria-live="polite">{panel.rows[0].n.toLocaleString('en-US')} decision points in this view</span></div>
   <p className="chart-selection">{selectionLabel}</p>
   <MetricChart rows={panel.rows} max={metric === 'auc' ? 1 : 100} unit={metric === 'auc' ? 'auc' : '%'} label={`${panel.title}: ${metricLabel}. ${selectionLabel}. Exact values below.`}/>
   <details className="chart-table"><summary>View exact values · {panel.title}</summary>
    <ResultsTable rows={panel.rows} split={panel.split} caption={`${panel.title} · ${selectionLabel} · N=${panel.rows[0].n.toLocaleString('en-US')}`} metric={metric}/>
   </details>
   <div className="explorer-footer"><p>Empirical ROC points on this slice, not frozen deployment thresholds. <a href="#protocol">Evaluation protocol</a></p>
    <button className="quiet-button" onClick={() => download(panel.rows, panel.split, panel.title)} aria-label={`Export ${panel.title} as CSV`}><Download size={14}/> Export this chart</button>
   </div>
  </article>)}
  <details className="chart-table holdout-values"><summary>Private holdout · view Tier 3 separately</summary>
   <p className="source-note">1,138 private items in the complete split. Current selection: {privateRows[0].n.toLocaleString('en-US')} decision points.</p>
   <ResultsTable rows={privateRows} split="test_private_1138" caption={`Private holdout · ${selectionLabel} · N=${privateRows[0].n.toLocaleString('en-US')}`} metric={metric}/>
   <button className="quiet-button" onClick={() => download(privateRows, 'test_private_1138', 'Private holdout')}><Download size={14}/> Export private holdout</button>
  </details>
  <span className="sr-only" aria-live="polite">{downloadState}</span>
 </div>;
}

export function CascadeExplorer({data}:{data:CascadeData}){const[dataset,setDataset]=useState('v1_paired_1700');const[budget,setBudget]=useState('5pct');const slice=data[dataset];const rows=slice.models.map(m=>({name:m.name,color:m.color,value:m.operating[budget].mean_wait_ms,...m.operating[budget]})).sort((a,b)=>a.value-b.value);return <div className="explorer cascade"><div className="explorer-controls two"><label>Paired evaluation set<select value={dataset} onChange={e=>setDataset(e.target.value)}><option value="v1_paired_1700">Pikaia · full paired set</option><option value="tier2_paired_788">Pikaia · Tier 2 paired set</option><option value="livekit_clean_paired_842">LiveKit · response-ready</option><option value="livekit_orig_paired_1058">LiveKit · floor-end</option></select></label><label>False-cutoff budget<select value={budget} onChange={e=>setBudget(e.target.value)}>{['1','2','3','5','10'].map(b=><option key={b} value={`${b}pct`}>≤{b}% cumulative false cutoffs</option>)}</select></label></div><div className="cascade-result" aria-live="polite"><div><span>LOWEST MEAN WAIT IN THIS COMPARISON</span><strong>{rows[0].value.toFixed(1)} <small>ms</small></strong><p>{rows[0].name}</p></div><div><span>PAIRED OBSERVATIONS</span><strong>{slice.n.toLocaleString()}</strong><p>300 → 600 → 1,000 ms fallback</p></div></div><div className="table-scroll"><table><caption>Cascade operating points · lower wait is better</caption><thead><tr><th>Model</th><th>Mean wait ↓</th><th>Cumulative recall</th><th>False-cutoff rate</th></tr></thead><tbody>{rows.map(r=><tr key={r.name}><th scope="row">{r.name}</th><td>{r.mean_wait_ms.toFixed(1)} ms</td><td>{r.cum_recall_pct.toFixed(2)}%</td><td>{r.cum_fir_pct.toFixed(2)}%</td></tr>)}</tbody></table></div><p className="source-note">Six-model paired-cascade comparison from the report supplement. Mean waiting time includes the timeout fallback on true EOTs. This is not compute latency or end-to-end response latency.</p></div>}

const citation='@article{pikaia2026intervieweou,\n  author = {{Pikaia AI Research}},\n  title = {Pikaia Interview EOU Benchmark: Evaluating Response Readiness in Bilingual Spoken Interviews},\n  journal = {arXiv preprint},\n  year = {2026},\n  url = {https://huggingface.co/datasets/pikaia-ai/interview-eou-benchmark}\n}\n\n@techreport{pikaia2026turntechreport,\n  author = {{Pikaia AI Research}},\n  title = {Pikaia-Turn: Technical Report on Causal Turn Detection, Cross-Modal Architectures, and External Benchmark Transfer},\n  institution = {Pikaia AI},\n  year = {2026},\n  month = {November},\n  url = {https://github.com/Pikaia-AI/interview-eou-report}\n}';
export function Citation(){const[status,setStatus]=useState('');async function copy(){try{await navigator.clipboard.writeText(citation);setStatus('Copied')}catch{setStatus('Select the text below to copy')}}return <div className="citation"><div><h3>Cite this work</h3><button className="quiet-button" onClick={copy}>{status==='Copied'?<Check size={15}/>:<Copy size={15}/>}<span aria-live="polite">{status||'Copy BibTeX'}</span></button><a href="/report/citation.bib" download aria-label="Download BibTeX citation"><Download size={16}/></a></div><pre tabIndex={0}>{citation}</pre></div>}
