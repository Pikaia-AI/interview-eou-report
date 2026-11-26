'use client';

import { useState } from 'react';

type PauseCase = {
  id: string;
  num: string;
  tag: string;
  title: string;
  lang: 'EN' | 'ZH';
  provenance: string;
  gold: 'HOLD' | 'EOT' | 'HOLD → EOT';
  prompt: string;
  speech: string;
  insight: string;
  scores: { model: string; detail: string; status: 'pass' | 'fail' | 'shift' }[];
};

const CASES: PauseCase[] = [
  {
    id: 'conjunction',
    num: '01',
    tag: 'MID-CLAUSE CONJUNCTION',
    title: 'Pause right after “and”',
    lang: 'EN',
    provenance: 'Blind-agreed Gold · Tier 2',
    gold: 'HOLD',
    prompt: '“Thinking about the last time you actually drank sake, can you walk me through…”',
    speech: '“The last time I had steak, I think I had my friend over, a female friend, and” [pause]',
    insight: 'Compact audio-only detectors mistake a sustained 600 ms trailing pause after “and” for a completed turn, breaching even their strictest zero-FP dev threshold (τ_600 = 0.6330). Speech-LLM models read the syntactic incompleteness and stay at 0.00.',
    scores: [
      { model: 'Smart Turn v3.2 (8M)', detail: '0.28 (300 ms) → 0.64 (600 ms) · false cut-off', status: 'fail' },
      { model: 'Turn-1-Mini (5.3M)', detail: '0.01 → 0.01 · correctly held', status: 'pass' },
      { model: 'Turn-1 (2.8B, Audio / +Text)', detail: '0.00 → 0.00 · correctly held', status: 'pass' },
    ],
  },
  {
    id: 'topic-marker',
    num: '02',
    tag: 'MANDARIN TOPIC MARKER',
    title: 'Clause-framing particle “之后呢”',
    lang: 'ZH',
    provenance: 'Blind-agreed Gold · Tier 2',
    gold: 'HOLD',
    prompt: '“At what step did Feishu provide evidence, and how did you return to Claude Code?”',
    speech: '“fenxi wan zhihou ne” (“After finishing the analysis…”) [pause]',
    insight: 'In Mandarin interviews, speakers frequently pause after a topic-setting particle (“ne”) before delivering the main clause. Compact streaming Turn-1-Mini triggers false commits at both cutoffs (0.63 / 0.60 > τ = 0.4086), while speech-LLM models hold cleanly.',
    scores: [
      { model: 'Turn-1-Mini (5.3M)', detail: '0.63 (300 ms) / 0.60 (600 ms) · false cut-off', status: 'fail' },
      { model: 'Smart Turn v3.2 (8M)', detail: '0.28 → 0.04 · correctly held', status: 'pass' },
      { model: 'Turn-1 (2.8B, Audio / +Text)', detail: '0.02 / 0.03 · correctly held', status: 'pass' },
    ],
  },
  {
    id: 'trajectory',
    num: '03',
    tag: 'SAME-TURN TRAJECTORY',
    title: 'From mid-list hesitation to completed contrast',
    lang: 'ZH',
    provenance: 'Blind-agreed Gold · Same speaker turn',
    gold: 'HOLD → EOT',
    prompt: '“When buying clothes abroad, do you visit malls, brand stores, or local vintage shops?”',
    speech: '(a) “…check Xiaohongshu for brand/local shops, uh and then” [HOLD]  →  (b) “…we rarely visit malls, there’s nothing to see in malls.” [EOT]',
    insight: 'Two blind-audited pauses from the same multi-clause turn progress from unfinished enumeration to a completed contrast. Compact Turn-1-Mini fails to detect the completion (0.11 / 0.16), whereas preceding prompt context lifts Turn-1 from 0.45 to 0.62.',
    scores: [
      { model: 'Pause (a) · all detectors', detail: '≤ 0.13 across all configs · correctly held', status: 'pass' },
      { model: 'Pause (b) · Turn-1-Mini (5.3M)', detail: '0.11 (300 ms) / 0.16 (600 ms) · missed completion', status: 'fail' },
      { model: 'Pause (b) · Turn-1 (2.8B)', detail: '0.45 (Audio-Only) → 0.62 (+Text) · context lift', status: 'shift' },
    ],
  },
  {
    id: 'soft-prosody',
    num: '04',
    tag: 'TWO-STAGE 300 → 600 MS RESOLUTION',
    title: 'Soft trailing prosody resolved at 600 ms',
    lang: 'EN',
    provenance: 'Blind-agreed Gold · Tier 2',
    gold: 'EOT',
    prompt: '“Right—so user interviews would be structured… versus casual rapport-building…”',
    speech: '“I don’t think they’ll be, you know, open in a user interview the way they would be in casual settings.” [pause]',
    insight: 'Illustrates why a two-stage 300 → 600 ms gate outperforms fixed 300 ms cutoffs: at 300 ms the soft ending remains ambiguous (0.17), but once silence persists to 600 ms, completion probability jumps cleanly to 0.69 without waiting for a 1,000 ms timeout.',
    scores: [
      { model: 'Turn-1 (2.8B, +Text)', detail: '0.17 (300 ms) → 0.69 (600 ms) · resolved at Stage 2', status: 'shift' },
      { model: 'Turn-1 (2.8B, Audio-Only)', detail: '0.36 (300 ms) → 0.77 (600 ms) · resolved at Stage 2', status: 'pass' },
      { model: 'Turn-1-Mini (5.3M)', detail: '0.15 → 0.33 · low recall sensitivity', status: 'fail' },
    ],
  },
  {
    id: 'clarification',
    num: '05',
    tag: 'PROMPT DISAMBIGUATION · SUPPRESS',
    title: 'Multi-part clarification hold (Δp = −0.27)',
    lang: 'EN',
    provenance: 'Tier 2 · Paired Audio-Only vs. +Text',
    gold: 'HOLD',
    prompt: '“…it sounds like you spent around $10,000 on maintenance? And you mentioned routine…”',
    speech: '“Yeah. I think there is a misunderstanding… I spent about four thousand dollars” [pause]',
    insight: 'On audio alone, “four thousand dollars” sounds syntactically complete (0.74). Reading the two-part interviewer prompt reveals the second half is still unaddressed — suppressing premature commit probability by −0.27 down to 0.47.',
    scores: [
      { model: 'Turn-1 (2.8B, Audio-Only)', detail: '0.74 · risks interrupting mid-clarification', status: 'fail' },
      { model: 'Turn-1 (2.8B, +Text)', detail: '0.47 (Δ = −0.27) · prompt suppresses barge-in', status: 'shift' },
      { model: 'Smart Turn v3.2 / Turn-1-Mini', detail: '0.05 / 0.14 · held', status: 'pass' },
    ],
  },
  {
    id: 'terse-reply',
    num: '06',
    tag: 'PROMPT DISAMBIGUATION · BOOST',
    title: 'Terse elliptical answer to narrow prompt (Δp = +0.48)',
    lang: 'EN',
    provenance: 'Tier 2 · Paired Audio-Only vs. +Text',
    gold: 'EOT',
    prompt: '“What made you decide to download Tinder if you weren’t actively trying to meet…”',
    speech: '“Just curiosity.” [pause]',
    insight: 'Without knowing the question, a two-word fragment like “Just curiosity.” looks ambiguous (0.33). Conditioning on the narrow “what made you decide…” prompt immediately confirms a complete answer, lifting completion probability by +0.48 to 0.81.',
    scores: [
      { model: 'Turn-1 (2.8B, Audio-Only)', detail: '0.33 · uncertain fragment without prompt', status: 'fail' },
      { model: 'Turn-1 (2.8B, +Text)', detail: '0.81 (Δ = +0.48) · prompt confirms completion', status: 'shift' },
      { model: 'Smart Turn v3.2 / Turn-1-Mini', detail: '0.99 / 0.62 · detected', status: 'pass' },
    ],
  },
];

export function CaseStudiesV4() {
  const [selectedId, setSelectedId] = useState(CASES[0].id);
  const active = CASES.find(c => c.id === selectedId) ?? CASES[0];

  return (
    <div className="v4cs-deck" id="case-studies" aria-labelledby="v4cs-title">
      <div className="v4m-proof-head">
        <div>
          <p className="v4m-proof-eyebrow">QUALITATIVE ERROR &amp; CONTEXT DIAGNOSTICS · VERIFIED TIER 2 TURNS</p>
          <h3 id="v4cs-title">Six real interview pauses where turn detectors diverge</h3>
        </div>
        <span className="v4arch-badge">4 BLIND-AGREED GOLD · 2 PAIRED +TEXT CASES</span>
      </div>

      <div className="v4cs-rail" role="tablist" aria-label="Select qualitative pause case">
        {CASES.map(item => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={item.id === active.id}
            className="v4cs-tab"
            onClick={() => setSelectedId(item.id)}
          >
            <span className="v4cs-tab-top">
              <em>{item.num}</em>
              <b className={`v4cs-verdict is-${item.gold === 'HOLD' ? 'hold' : item.gold === 'EOT' ? 'eot' : 'both'}`}>{item.gold}</b>
            </span>
            <span className="v4cs-tab-title">{item.title}</span>
            <small>{item.lang} · {item.tag}</small>
          </button>
        ))}
      </div>

      <div className="v4cs-stage" role="tabpanel" aria-label={active.title}>
        <div className="v4cs-dialogue">
          <div className="v4cs-meta-row">
            <span className="v4cs-pill">{active.lang} · {active.tag}</span>
            <span className="v4cs-prov">{active.provenance}</span>
            <span className={`v4cs-verdict-lg is-${active.gold === 'HOLD' ? 'hold' : active.gold === 'EOT' ? 'eot' : 'both'}`}>
              Gold: {active.gold}
            </span>
          </div>

          <div className="v4cs-quote-block">
            <span className="v4cs-lbl">PRE-CUTOFF AGENT.TEXT</span>
            <p className="v4cs-prompt">{active.prompt}</p>
          </div>

          <div className="v4cs-quote-block is-user">
            <span className="v4cs-lbl">PRE-CUTOFF INTERVIEWEE SPEECH</span>
            <blockquote>{active.speech}</blockquote>
          </div>

          <p className="v4cs-insight">{active.insight}</p>
        </div>

        <div className="v4cs-diagnostics">
          <span className="v4cs-lbl">OPEN-WEIGHT REFERENCE DIAGNOSTICS (p_EOT)</span>
          <ul className="v4cs-score-list">
            {active.scores.map(row => (
              <li key={row.model} className={`v4cs-score-item is-${row.status}`}>
                <span className="v4cs-score-model">{row.model}</span>
                <span className="v4cs-score-val">{row.detail}</span>
              </li>
            ))}
          </ul>
          <p className="v4cs-footnote">
            Evaluated strictly on pre-cutoff interviewer text and truncated audio. Cases 01–04 belong to the 42-item dual-human blind-agreed Tier 2 gold subset; Cases 05–06 isolate paired Audio-Only vs. +Text disambiguation on identical open-weight Turn-1 weights.
          </p>
        </div>
      </div>
    </div>
  );
}
