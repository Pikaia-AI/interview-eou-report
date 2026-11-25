/* eslint-disable @next/next/no-img-element -- Uses locally optimized optical glass artwork in public/art/. */
'use client';

import { useState } from 'react';
import { ArrowUpRight, Check, Copy, Download } from 'lucide-react';
import './resource-access-fusion.css';

const LINKS = {
  development: 'https://huggingface.co/datasets/pikaia-ai/interview-eou-benchmark',
  researchTest: 'https://huggingface.co/datasets/pikaia-ai/interview-eou-benchmark-research',
  modelCard: 'https://huggingface.co/pikaia-ai/smart-turn-v3.2-interview',
  onnx: 'https://huggingface.co/pikaia-ai/smart-turn-v3.2-interview/resolve/3ae0f8039a3d619b8e00c456e2ab27ce435d3398/smart-turn-v3.2-interview.onnx?download=true',
  safetensors: 'https://huggingface.co/pikaia-ai/smart-turn-v3.2-interview/resolve/3ae0f8039a3d619b8e00c456e2ab27ce435d3398/model.safetensors?download=true',
  inquiry: (() => {
    const url = new URL('https://github.com/Pikaia-AI/interview-eou-report/issues/new');
    url.searchParams.set('title', 'Model access inquiry for the Pikaia-Turn family');
    url.searchParams.set('body', 'I would like to ask about evaluation access.\n\n**Model of interest**\nPikaia-Turn / Pikaia-Turn-Mini / Pikaia-Turn-Nano\n\n**Planned evaluation**\n');
    return url.href;
  })(),
};

const TIERS = [
  {
    key: 'dataset' as const,
    num: '01',
    railLabel: 'Evaluation dataset',
    railMeta: '100 / 1,100',
    tone: 'lilac' as const,
    ticksRight: '16 KHZ MONO · 300 / 600 MS · ROUTE A · κ = 0.8024',
    badge: 'HF DATASET',
    statementLead: '1,200 public Mandarin & English interview pauses',
    statementRest: ' — 100 auto-granted dev examples plus 1,100 held-out research test decisions across 65 speaker clusters.',
    code: 'load_dataset("pikaia-ai/interview-eou-benchmark")',
    copyable: true,
    shiftX: 0,
  },
  {
    key: 'model' as const,
    num: '02',
    railLabel: 'Open-weight model',
    railMeta: '8.0M · BSD-2',
    tone: 'ice' as const,
    ticksRight: 'SEED 29 · REV 3AE0F803 · +23.56 PP · −104.4 MS',
    badge: 'BSD 2-CLAUSE',
    statementLead: 'Smart Turn v3.2-Interview (8.0M audio-only)',
    statementRest: ' — fine-tuned on 3,891 bilingual interview pauses, shipping identical seed 29 checkpoints in ONNX & safetensors.',
    code: 'pikaia-ai/smart-turn-v3.2-interview @ 3ae0f803',
    copyable: true,
    shiftX: -12,
  },
  {
    key: 'family' as const,
    num: '03',
    railLabel: 'Pikaia-Turn family',
    railMeta: '2.3B · 0.6B · 6.7M',
    tone: 'coral' as const,
    ticksRight: 'DUAL SERVER · COMPACT SERVER · CPU STREAMING',
    badge: 'PRIVATE WEIGHTS',
    statementLead: 'Three compute budgets for long-form speech',
    statementRest: ' — flagship 2.3B (84.48% R@5%), compact 0.6B (395.3 ms wait), and 6.7M frame-synchronous CPU streaming.',
    code: 'Pikaia-Turn (2.3B) · Mini (0.6B) · Nano (6.7M)',
    copyable: false,
    shiftX: 10,
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button type="button" className="v4a-copy-btn" onClick={onCopy} aria-label={`Copy ${text}`}>
      {copied ? <Check size={12} aria-hidden="true" /> : <Copy size={12} aria-hidden="true" />}
      <span>{copied ? 'Copied' : 'Copy'}</span>
    </button>
  );
}

export function V4ResourceAccess() {
  const [focused, setFocused] = useState(0);
  const tier = TIERS[focused];

  return (
    <section className="report-section v4a-section" id="access" aria-labelledby="access-title">
      <p className="v4a-eyebrow">07 / Dataset &amp; model access</p>

      <div className="v4a-fusion-stage">
        <div className="v4a-fusion-halo" data-tone={tier.tone} aria-hidden="true" />
        <img
          className="v4a-fusion-art"
          src="/art/access-filament.webp"
          alt="Translucent blown-glass acoustic filament specimen"
          width={1376}
          height={589}
          style={{ transform: `scale(1.03) translateX(${tier.shiftX}px)` }}
        />

        <div className="v4a-fusion-ticks">
          <span>ARTIFACTS &amp; GOVERNANCE · CHANNEL {tier.num}</span>
          <span>{tier.ticksRight}</span>
        </div>

        <div className="v4a-fusion-body">
          <div>
            <h2 className="v4a-title" id="access-title">Dataset and model access</h2>
            <p className="v4a-fusion-statement">
              <strong>{tier.statementLead}</strong>{tier.statementRest}
            </p>
            <div className="v4a-fusion-capsule">
              <span className={`v4a-fusion-badge ${tier.tone === 'lilac' ? '' : tier.tone}`}>{tier.badge}</span>
              <code>{tier.code}</code>
              {tier.copyable && <CopyButton text={tier.code} />}
            </div>
          </div>

          <div className="v4a-fusion-right-cap">
            <span className="v4a-specimen-cap">Acoustic glass study · Plate 07</span>
          </div>
        </div>

        <div className="v4a-fusion-rail" role="group" aria-label="Highlight artifact channel">
          {TIERS.map((t, i) => (
            <button
              key={t.key}
              type="button"
              aria-pressed={i === focused}
              className={`v4a-rail-btn ${t.tone === 'lilac' ? '' : t.tone}`}
              onClick={() => setFocused(i)}
            >
              <span><em>{t.num}</em>{t.railLabel}</span>
              <small>{t.railMeta}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="v4a-fusion-ledger">
        <article
          className="v4a-row"
          data-active={focused === 0}
          data-tone="lilac"
          aria-labelledby="access-dataset"
          onMouseEnter={() => setFocused(0)}
          onFocus={() => setFocused(0)}
        >
          <div className="v4a-row-idx">
            <span className="v4a-row-num">01</span>
            <span className="v4a-row-tag">Evaluation dataset</span>
          </div>
          <div className="v4a-row-main">
            <h3 id="access-dataset">Pikaia Interview EOU Benchmark</h3>
            <p>Real Mandarin and English interview pauses, labeled for when the interviewer can respond. Available for non-commercial research and evaluation.</p>
            <p className="v4a-row-gov">Hugging Face grants development access when you accept the terms. Pikaia reviews research test requests.</p>
          </div>
          <dl className="v4a-metrics">
            <div><dt>Development examples</dt><dd>100</dd></div>
            <div><dt>Research test examples</dt><dd>1,100</dd></div>
          </dl>
          <div className="v4a-actions">
            <a className="v4a-pill-primary" href={LINKS.researchTest} target="_blank" rel="noreferrer">
              <span>Request test access</span><ArrowUpRight size={15} aria-hidden="true" />
            </a>
            <a className="v4a-pill-outline" href={LINKS.development} target="_blank" rel="noreferrer">
              <span>Open development set</span><ArrowUpRight size={14} aria-hidden="true" />
            </a>
          </div>
        </article>

        <article
          className="v4a-row"
          id="access-model"
          data-active={focused === 1}
          data-tone="ice"
          aria-labelledby="access-model-title"
          onMouseEnter={() => setFocused(1)}
          onFocus={() => setFocused(1)}
        >
          <div className="v4a-row-idx">
            <span className="v4a-row-num">02</span>
            <span className="v4a-row-tag ice">Open-weight model</span>
          </div>
          <div className="v4a-row-main">
            <h3 id="access-model-title">Smart Turn v3.2-Interview</h3>
            <p>Pikaia fine-tuned this audio-only turn detector on bilingual interviews. Both downloads contain the released seed 29 checkpoint.</p>
            <p className="v4a-row-gov">BSD 2-Clause license · <a href={LINKS.modelCard} target="_blank" rel="noreferrer">Hugging Face model card ↗</a></p>
          </div>
          <dl className="v4a-metrics">
            <div><dt>Parameters</dt><dd>8.0M</dd></div>
            <div><dt>Training examples</dt><dd>3,891</dd></div>
          </dl>
          <div className="v4a-actions">
            <a className="v4a-pill-primary ice" href={LINKS.onnx}>
              <span>Download ONNX</span><Download size={15} aria-hidden="true" />
            </a>
            <a className="v4a-pill-outline" href={LINKS.safetensors}>
              <span>Download safetensors</span><Download size={14} aria-hidden="true" />
            </a>
          </div>
        </article>

        <aside
          className="v4a-row"
          data-active={focused === 2}
          data-tone="coral"
          aria-labelledby="access-family"
          onMouseEnter={() => setFocused(2)}
          onFocus={() => setFocused(2)}
        >
          <div className="v4a-row-idx">
            <span className="v4a-row-num">03</span>
            <span className="v4a-row-tag coral">Private family</span>
          </div>
          <div className="v4a-row-main">
            <h3 id="access-family">Pikaia-Turn family</h3>
            <p>Pikaia-Turn, Pikaia-Turn-Mini and Pikaia-Turn-Nano have private weights. Dual-backbone server, compact server, and frame-synchronous CPU streaming.</p>
          </div>
          <dl className="v4a-metrics three">
            <div><dt>Flagship</dt><dd>2.3B</dd></div>
            <div><dt>Mini</dt><dd>0.6B</dd></div>
            <div><dt>Nano CPU</dt><dd>6.7M</dd></div>
          </dl>
          <div className="v4a-actions">
            <a className="v4a-pill-outline" href={LINKS.inquiry} target="_blank" rel="noreferrer">
              <span>Ask about model access</span><ArrowUpRight size={14} aria-hidden="true" />
            </a>
            <span className="v4a-sub-caption">Opens a public GitHub issue draft</span>
          </div>
        </aside>
      </div>
    </section>
  );
}
