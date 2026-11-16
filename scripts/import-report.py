"""Import the verified LaTeX report; emit aggregate metrics and public report text only."""
import hashlib
import json
from pathlib import Path
import re
import shutil
import subprocess
import sys

source = Path(sys.argv[1]).resolve()
root = Path(__file__).resolve().parents[1]
paper = source / 'latex' if (source / 'latex').exists() else (source / 'paper' if (source / 'paper').exists() else next((d for d in source.iterdir() if d.is_dir() and (d / 'sections').exists()), source))
output = root / 'public' / 'report'
output.mkdir(parents=True, exist_ok=True)
metrics = json.loads((source / 'data/v1_paper_metrics.json').read_text())
supplement = json.loads((source / 'data/v1_6model_supplement.json').read_text())
roster = [
    ('p99_v2_exp_split2085_exp', 'Pikaia-Turn', '2.3B · server', '#b9a3ed'),
    ('qwen_v2_exp_split2085_exp', 'Pikaia-Turn-Mini', '0.6B · server', '#a1dbe0'),
    ('p99_mini_ctx_exp_split2085_exp', 'Pikaia-Turn-Nano', '6.7M · CPU streaming', '#e6baac'),
    ('native_p99', 'Turn-1', '2.3B · zero-shot', '#a2a5b2'),
    ('native-smart_turn_v32-strict_exp-3seed_mean-epoch1', 'Smart Turn + Interview FT', '8M · 3-seed mean', '#a6c6b0'),
    ('smart_turn_v32_original', 'Smart Turn v3.2', '8M · zero-shot', '#777f97'),
    ('p99_mini_zero', 'Turn-1-Mini', '5.3M · zero-shot', '#a58c9b'),
]
models = []
for tag, name, spec, color in roster:
    splits = {}
    for key in ['test_1100', 'test_private_1138', 'full_2338']:
        splits[key] = {}
        for cutoff in ['300ms', '300ms_paired', '600ms_paired']:
            splits[key][cutoff] = {}
            for language in ['overall', 'zh', 'en']:
                m = metrics['models'][tag]['splits'][key][cutoff][language]
                splits[key][cutoff][language] = {
                    'n': m['samples'], 'eot': m['eot'], 'hold': m['hold'], 'auc': m['roc_auc'],
                    'operating': {b: {f: point[f] for f in ['recall', 'fpr', 'tp', 'fp', 'allowed_fp']} for b, point in m['empirical_roc'].items()},
                }
    models.append({'name': name, 'spec': spec, 'color': color, 'splits': splits})

data = {'title': 'Pikaia Interview EOU Benchmark v1.0.0', 'snapshot': 'November 2026', 'models': models}
data['cascades'] = {}
for dataset in ['v1_paired_1700', 'tier2_paired_800', 'livekit_clean_paired_842', 'livekit_orig_paired_1058']:
    entry = supplement['cascades_and_pareto'][dataset]
    data['cascades'][dataset] = {'n': entry['dataset_info']['n'], 'models': []}
    for tag, name, spec, color in roster:
        if tag not in entry['models']:
            continue
        m = entry['models'][tag]
        data['cascades'][dataset]['models'].append({'name': name, 'color': color, 'operating': {
            b: {f: v[f] for f in ['cum_recall_pct', 'cum_fir_pct', 'mean_wait_ms']}
            for b, v in m['operating_table'].items()
        }})

macros = {'benchver': 'Pikaia Interview EOU Benchmark v1.0.0', 'bench': 'Pikaia Interview EOU Benchmark',
          'turnbig': 'Pikaia-Turn', 'turnmed': 'Pikaia-Turn-Mini', 'turnmini': 'Pikaia-Turn-Nano',
          'pmini': 'Turn-1-Mini', 'rr': 'response-ready', 'fe': 'floor-end', 'eot': 'EOT', 'hold': 'HOLD'}
def replace_macros(s):
    for name, value in macros.items():
        s = re.sub(r'\\' + name + r'(?:\{\})?(?![a-zA-Z])', lambda _: value, s)
    return s

def plain(s):
    s = replace_macros(s)
    s = s.replace('{,}', ',')
    s = re.sub(r'\\cite\{[^}]+\}', '', s)
    s = re.sub(r'\\(?:texttt|textbf|textsc|emph|text|scriptsize)\{([^{}]*)\}', r'\1', s)
    for _ in range(5):
        s = re.sub(r'\\(?:texttt|textbf|textsc|emph|text|scriptsize)\{([^{}]*)\}', r'\1', s)
    for a,b in [(r'\le','≤'), (r'\to','→'), (r'\times','×'), (r'\uparrow','↑'), (r'\downarrow','↓'), (r'\kappa','κ'), (r'\ms',' ms'), (r'\pp',' pp'), (r'\%','%'), (r'\&','&'), (r'\_','_'), (r'\#','#'), (r'\quad',''), (r'\,',' '), (r'\;',' '), ('---','—'), ('~',' '), ('{,}',',')]:
        s=s.replace(a,b)
    s=s.replace('$','').replace('{','').replace('}','').replace('\\ ',' ').replace('\\.','.')
    return re.sub(r'\s+',' ',s).strip()

table_specs = [
('tab1_benchmark_comparison', 'Benchmark comparison', ['Dimension','LiveKit eot-bench','Pikaia v1.0.0','EasyTurn-800','TurnBench Dev']),
('tab1_dataset_tiers','Dataset access tiers',['Split','Access','ZH','EN','Total','Clusters','600 ms pairs','WAV files']),
('tab2_main_benchmark','Main benchmark results',['Model','Specification','Tier 2 AUC','ZH AUC','EN AUC','R@3%','R@5%','Tier 3 AUC','Full AUC','Full R@3%','Full R@5%','600 ms AUC','600 ms R@5%','Wait@5% (ms)']),
('tab3_calibration_transfer','Frozen calibration transfer',['Model','Dev 0 FP → T2 recall','T2 FPR','T3 recall','T3 FPR','Dev ≤1 FP → T2 recall','T2 FPR','T3 recall','T3 FPR','Internal-Val → T2 recall','T2 FPR']),
('tab4_ablation_and_external','Provenance and objective shifts',['Model','Gold AUC (77)','Causal AUC (956)','Historical AUC (1,382)','LiveKit FE AUC','FE wait / rank','RR R@5%','RR wait / rank','Pikaia wait / rank']),
('tab_livekit_leaderboard_ranks','LiveKit reference rankings',['System','Type','EN ≤2% wait / rank','EN ≤5% wait / rank','EN ≤10% wait / rank','EN AUC200','ZH ≤5% wait / rank','ZH ≤10% wait / rank','ZH AUC200','Pikaia T2 R@5% / AUC']),
('tab6_turnbench_duplex','TurnBench Dev stress test',['Model','Legacy Dev recall','Legacy OOF recall','+ Partner ASR Dev (OOF)','Legacy p50 ms','Duplex Dev recall','Duplex OOF recall','+ Partner ASR OOF','Duplex OOF p50 ms','≤5% recall (FPR)']),
('tab_data_arch_ablation','Data × architecture ablation',['Model / variant','Training clips','Pikaia 300 Acc/Rec','Pikaia 600 Acc/Rec','Pikaia 300 R@5%','Pikaia 600 R@5%','Pikaia cascade R@5%','Pikaia wait ms','LiveKit 300 Acc/Rec','LiveKit 600 Acc/Rec','LiveKit 300/600 R@5%','LiveKit cascade R@5%','LiveKit wait ms','LiveKit FE AUC']),
('tab5_easyturn_profile','EasyTurn-800 transfer',['Model / variant','Training clips','All AUC','Real AUC','Synthetic AUC','R@1%','R@5%','Acc @0.50','Rec/FPR @0.50','ValCal Rec/FPR','Completion','Backchannel hold','Wait hold']),
]
tables=[]
for idx,(stem,title,headers) in enumerate(table_specs,1):
    s=(paper/'tables'/f'{stem}.tex').read_text()
    rows=[]; in_body=False
    for line in s.splitlines():
        if line.startswith(r'\midrule'): in_body=True; continue
        if not in_body or not line.rstrip().endswith(r'\\'):continue
        if line.startswith(r'\multicolumn'):
            continue
        cells=[plain(c) for c in re.split(r'(?<!\\)&',line.rstrip()[:-2])]
        if stem=='tab1_dataset_tiers':continue
        if len(cells)!=len(headers):raise ValueError((stem,len(cells),len(headers),cells))
        rows.append(cells)
    if stem=='tab1_dataset_tiers':
        rows=[['Tier 1 · dev','Auto-gated','50','50','100','12','71','236'],['Tier 2 · research test','Manual-gated','500','600','1,100','70','800','2,584'],['Tier 3 · blind holdout','Private','428','710','1,138','73','829','2,639'],['Full benchmark','Combined','978','1,360','2,338','155','1,700','5,459']]
    label=re.search(r'\\label\{([^}]+)\}',s).group(1)
    tables.append({'number':idx,'title':title,'headers':headers,'rows':rows,'source':f'{stem}.tex','label':label})
data['tables']=tables

# The complete eight report chapters remain available below the designed research narrative.
# Remove only float environments: their tables and figures are separately rendered in the page.
bbl=(paper/'main.bbl').read_text()
citation_order=re.findall(r'\\bibitem\[[\s\S]*?\]\{([^}]+)\}',bbl)
refs=json.loads(subprocess.check_output(['pandoc',str(paper/'references.bib'),'-f','biblatex','-t','csljson']))
by_id={r['id']:r for r in refs}
data['references']=[by_id[k] for k in citation_order]
target_links={t['label']:(f'table-{t["number"]}',f'Table {t["number"]}') for t in tables}
for n,key in enumerate(['roc_curves','pareto_frontier','provenance_shift','easyturn_benchmark'],1):target_links['fig:'+key]=(f'figure-{n}',f'Figure {n}')
sections=[]
for n,f in enumerate(sorted((paper/'sections').glob('*.tex')),1):
    text=f.read_text();title=re.search(r'\\section\{([^}]+)\}',text)
    for key in re.findall(r'\\label\{(sec:[^}]+)\}',text):target_links[key]=(f'chapter-{n}',f'Section {n}')
    sections.append((n,f,text))
full=[]
for n,f,text in sections:
    text=re.sub(r'\\begin\{figure\}[\s\S]*?\\end\{figure\}','',text)
    text=re.sub(r'\\input\{tables/[^}]+\}','',text)
    text=replace_macros(text)
    text=re.sub(r'\\texorpdfstring\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}\{[^}]*\}',r'\1',text)
    text=re.sub(r'\\label\{[^}]+\}','',text)
    text=re.sub(r'\\cite\{([^}]+)\}',lambda m: ''.join(r'\href{#ref-'+k+'}{['+str(citation_order.index(k)+1)+']}' for k in m[1].split(',') if k in citation_order),text)
    text=re.sub(r'\\[cC]ref\{([^}]+)\}',lambda m: ', '.join(r'\href{#'+target_links.get(k,('full-report','Report'))[0]+'}{'+target_links.get(k,('full-report','Report'))[1]+'}' for k in m[1].split(',')),text)
    text=text.replace(r'\ms',r'\,\mathrm{ms}').replace(r'\pp',r'\,\mathrm{pp}')
    text=re.sub(r'(\\begin\{(?:enumerate|itemize)\})\[[^\]]*\]',r'\1',text)
    html=subprocess.check_output(['pandoc','-f','latex','-t','html5','--mathml','--shift-heading-level-by=2'],input=text.encode()).decode()
    html=re.sub(r'((?:id|href)=")(#?)(fn[^" ]*)',lambda m:m[1]+m[2]+f'ch{n}-'+m[3],html)
    html=html.replace('id="footnotes"', f'id="ch{n}-footnotes"')
    html=re.sub(r'<annotation\s+encoding="application/x-tex">[\s\S]*?</annotation>', '', html)
    full.append({'number':n,'html':html,'source':f.name})
data['chapters']=full
data['pdf_sha256']=hashlib.sha256((source/'paper.pdf').read_bytes()).hexdigest()
(root/'app/report-data.json').write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n')
public_data={k:v for k,v in data.items() if k not in ['chapters','references']}
(output/'metrics.json').write_text(json.dumps(public_data,ensure_ascii=False,indent=2)+'\n')
shutil.copy2(source/'paper.pdf',output/'pikaia-eou-technical-report.pdf')
for f in (paper/'figures').glob('*.pdf'):
    shutil.copy2(f,output/f.name)
    subprocess.run(['pdftoppm','-scale-to','1600','-png','-singlefile',str(f),str(output/f.stem)],check=True,stdout=subprocess.DEVNULL)
(output/'citation.bib').write_text('@article{pikaia2026intervieweou,\n  author = {{Pikaia AI Research}},\n  title = {Pikaia Interview EOU Benchmark: Evaluating Response Readiness in Bilingual Spoken Interviews},\n  journal = {arXiv preprint},\n  year = {2026},\n  url = {https://huggingface.co/datasets/pikaia-ai/interview-eou-benchmark}\n}\n\n@techreport{pikaia2026turntechreport,\n  author = {{Pikaia AI Research}},\n  title = {Pikaia-Turn: Technical Report on Causal Turn Detection, Cross-Modal Architectures, and External Benchmark Transfer},\n  institution = {Pikaia AI},\n  year = {2026},\n  month = {November},\n  url = {https://github.com/Pikaia-AI/interview-eou-report}\n}\n')
print(f'Imported {len(models)} models, {len(tables)} tables, {len(full)} chapters, {len(refs)} references, 4 figures.')
