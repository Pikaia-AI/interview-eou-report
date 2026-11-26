import training from '../../public/report/training-data-summary.json';

const SCALING_ROWS = [
  { variant: 'Turn-1 (2.8B, zero-shot)', clips: 'Zero-shot', p300AccRec: '56.2 / 32.4', pWait: '411.4 ms', lk600: '83.8%', lkWait: '476.1 ms', feAuc: '.9109', tone: 'base' },
  { variant: 'Turn-1 + Curated FT (unmodified)', clips: '2,025 Cur.', p300AccRec: '86.6 / 82.5', pWait: '398.4 ms', lk600: '80.4%', lkWait: '425.5 ms', feAuc: '.8955', tone: 'base' },
  { variant: 'Turn-1 + Expanded FT (unmodified)', clips: '3,195 Exp.', p300AccRec: '89.1 / 88.1', pWait: '413.3 ms', lk600: '60.7% ↓', lkWait: '494.3 ms ↓', feAuc: '.8687 ↓', tone: 'warn' },
  { variant: 'Pikaia-Turn + Curated FT (2.3B)', clips: '2,025 Cur.', p300AccRec: '87.6 / 84.6', pWait: '387.8 ms', lk600: '81.8%', lkWait: '432.9 ms', feAuc: '.8984', tone: 'lilac' },
  { variant: 'Pikaia-Turn + Expanded FT (2.3B)', clips: '3,195 Exp.', p300AccRec: '88.6 / 86.3', pWait: '406.8 ms', lk600: '81.5% ↑', lkWait: '394.4 ms ↑', feAuc: '.9038', tone: 'lilac' },
  { variant: 'Pikaia-Turn-Mini + Curated FT (0.6B)', clips: '2,025 Cur.', p300AccRec: '87.2 / 84.3', pWait: '406.2 ms', lk600: '76.8%', lkWait: '504.7 ms', feAuc: '.9085', tone: 'cyan' },
  { variant: 'Pikaia-Turn-Mini + Expanded FT (0.6B)', clips: '3,195 Exp.', p300AccRec: '87.9 / 86.5', pWait: '395.3 ms', lk600: '79.1% ↑', lkWait: '473.8 ms ↑', feAuc: '.9000', tone: 'cyan' },
] as const;

export function ArchitectureV4() {
  const curated = training.curated_count.toLocaleString('en-US');
  const expanded = training.expanded_count.toLocaleString('en-US');

  return (
    <div className="v4arch-deck" id="architecture" aria-labelledby="v4arch-title">
      <div className="v4m-proof-head">
        <div>
          <p className="v4m-proof-eyebrow">SYSTEM ARCHITECTURE &amp; TRAINING RECIPE</p>
          <h3 id="v4arch-title">How Pikaia-Turn operates inside a modular voice pipeline</h3>
        </div>
        <span className="v4arch-badge">ZERO USER ASR WAIT · 300 → 600 → 1,000 MS GATE</span>
      </div>

      {/* Optical SVG Pipeline Diagram */}
      <div className="v4arch-diagram-wrap">
        <svg className="v4arch-svg" viewBox="0 0 980 214" role="img" aria-label="Modular voice-agent pipeline showing Silero VAD feeding causal raw audio and deterministic interviewer prompt text into Pikaia-Turn’s speech-boundary pooling and cross-modal fusion gate, committing at 300 ms, 600 ms, or 1,000 ms fallback before ASR, LLM, and TTS.">
          <defs>
            <linearGradient id="v4arch-lilac" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#c5b4ec" stopOpacity="0.22"/>
              <stop offset="100%" stopColor="#c5b4ec" stopOpacity="0.06"/>
            </linearGradient>
            <linearGradient id="v4arch-cyan" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#a5d8dc" stopOpacity="0.22"/>
              <stop offset="100%" stopColor="#a5d8dc" stopOpacity="0.06"/>
            </linearGradient>
            <linearGradient id="v4arch-line" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#c5b4ec" stopOpacity="0.65"/>
              <stop offset="100%" stopColor="#a5d8dc" stopOpacity="0.85"/>
            </linearGradient>
            <marker id="v4arch-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M1 1.5 L8.5 5 L1 8.5" fill="none" stroke="#c5b4ec" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </marker>
            <marker id="v4arch-arrow-cyan" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M1 1.5 L8.5 5 L1 8.5" fill="none" stroke="#a5d8dc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </marker>
          </defs>

          {/* Left Inputs */}
          <rect x="12" y="24" width="222" height="72" rx="10" fill="#101017" stroke="rgba(165,216,220,0.34)" strokeWidth="1"/>
          <circle cx="28" cy="43" r="3.5" fill="#a5d8dc"/>
          <text x="40" y="47" fill="#a5d8dc" fontFamily="ui-monospace, monospace" fontSize="9" letterSpacing="1.1">CAUSAL AUDIO · SILERO VAD</text>
          <text x="26" y="68" fill="#f0edf5" fontFamily="Inter, system-ui, sans-serif" fontSize="13" fontWeight="500">Raw waveform x ≤ t_c</text>
          <text x="26" y="85" fill="#9a96a6" fontFamily="ui-monospace, monospace" fontSize="9.2">16 kHz mono · ≤8.0 s · no user ASR</text>

          <rect x="12" y="118" width="222" height="72" rx="10" fill="#101017" stroke="rgba(197,180,236,0.34)" strokeWidth="1"/>
          <circle cx="28" cy="137" r="3.5" fill="#c5b4ec"/>
          <text x="40" y="141" fill="#c5b4ec" fontFamily="ui-monospace, monospace" fontSize="9" letterSpacing="1.1">DETERMINISTIC CONTEXT</text>
          <text x="26" y="162" fill="#f0edf5" fontFamily="Inter, system-ui, sans-serif" fontSize="13" fontWeight="500">Preceding agent_text</text>
          <text x="26" y="179" fill="#9a96a6" fontFamily="ui-monospace, monospace" fontSize="9.2">Keeps ? &amp; clauses · 0 ms latency</text>

          {/* Connectors left -> center */}
          <path d="M234 60 C256 60, 258 80, 276 80" fill="none" stroke="#a5d8dc" strokeWidth="1.3" markerEnd="url(#v4arch-arrow-cyan)"/>
          <path d="M234 154 C256 154, 258 134, 276 134" fill="none" stroke="#c5b4ec" strokeWidth="1.3" markerEnd="url(#v4arch-arrow)"/>

          {/* Center Core: Pikaia-Turn */}
          <rect x="282" y="18" width="332" height="178" rx="13" fill="url(#v4arch-lilac)" stroke="rgba(197,180,236,0.48)" strokeWidth="1.2"/>
          <text x="300" y="42" fill="#c5b4ec" fontFamily="ui-monospace, monospace" fontSize="9.5" letterSpacing="1.4">PIKAIA-TURN COMMIT DETECTOR</text>
          <text x="300" y="64" fill="#ffffff" fontFamily="Manrope, Inter, sans-serif" fontSize="16" fontWeight="400">Cross-Modal Boundary Fusion</text>

          <rect x="298" y="78" width="300" height="44" rx="8" fill="rgba(8,8,13,0.82)" stroke="rgba(240,237,245,0.14)" strokeWidth="1"/>
          <text x="312" y="96" fill="#f0edf5" fontFamily="Inter, system-ui, sans-serif" fontSize="11.5" fontWeight="500">Speech-Boundary Prosodic Pooling</text>
          <text x="312" y="112" fill="#9a96a6" fontFamily="ui-monospace, monospace" fontSize="9.2">Stops 300–600 ms silence diluting speech cues</text>

          <rect x="298" y="132" width="300" height="48" rx="8" fill="rgba(8,8,13,0.82)" stroke="rgba(240,237,245,0.14)" strokeWidth="1"/>
          <text x="312" y="150" fill="#f0edf5" fontFamily="Inter, system-ui, sans-serif" fontSize="11.5" fontWeight="500">Adapted Branch Fusion + Context Dropout</text>
          <text x="312" y="166" fill="#9a96a6" fontFamily="ui-monospace, monospace" fontSize="9.2">2.3B dual-backbone · 0.6B single · zh / en</text>

          {/* Connector center -> gate */}
          <line x1="614" y1="107" x2="656" y2="107" stroke="url(#v4arch-line)" strokeWidth="1.5" markerEnd="url(#v4arch-arrow-cyan)"/>
          <text x="635" y="97" textAnchor="middle" fill="#a5d8dc" fontFamily="ui-monospace, monospace" fontSize="9.5">p_EOT</text>

          {/* Right: Two-Stage Gate + Downstream */}
          <rect x="662" y="18" width="166" height="178" rx="12" fill="url(#v4arch-cyan)" stroke="rgba(165,216,220,0.42)" strokeWidth="1.1"/>
          <text x="676" y="41" fill="#a5d8dc" fontFamily="ui-monospace, monospace" fontSize="9.5" letterSpacing="1.2">TWO-STAGE GATE</text>

          <rect x="674" y="54" width="142" height="36" rx="7" fill="rgba(8,8,13,0.84)" stroke="rgba(165,216,220,0.28)" strokeWidth="1"/>
          <text x="684" y="70" fill="#ffffff" fontFamily="ui-monospace, monospace" fontSize="10.5" fontWeight="500">300 ms · p ≥ τ_300</text>
          <text x="684" y="83" fill="#a5d8dc" fontFamily="Inter, system-ui, sans-serif" fontSize="9.5">Fast commit on clear turns</text>

          <rect x="674" y="99" width="142" height="36" rx="7" fill="rgba(8,8,13,0.84)" stroke="rgba(197,180,236,0.28)" strokeWidth="1"/>
          <text x="684" y="115" fill="#ffffff" fontFamily="ui-monospace, monospace" fontSize="10.5" fontWeight="500">600 ms · p ≥ τ_600</text>
          <text x="684" y="128" fill="#c5b4ec" fontFamily="Inter, system-ui, sans-serif" fontSize="9.5">Re-score uncertain pauses</text>

          <rect x="674" y="144" width="142" height="36" rx="7" fill="rgba(8,8,13,0.84)" stroke="rgba(231,189,170,0.28)" strokeWidth="1"/>
          <text x="684" y="160" fill="#ffffff" fontFamily="ui-monospace, monospace" fontSize="10.5" fontWeight="500">1,000 ms fallback</text>
          <text x="684" y="173" fill="#e7bdaa" fontFamily="Inter, system-ui, sans-serif" fontSize="9.5">Safety commit timeout</text>

          {/* Connector gate -> downstream */}
          <line x1="828" y1="107" x2="854" y2="107" stroke="#a5d8dc" strokeWidth="1.4" markerEnd="url(#v4arch-arrow-cyan)"/>

          {/* Downstream */}
          <rect x="860" y="54" width="106" height="106" rx="10" fill="#101017" stroke="rgba(240,237,245,0.16)" strokeWidth="1"/>
          <text x="913" y="82" textAnchor="middle" fill="#9a96a6" fontFamily="ui-monospace, monospace" fontSize="9" letterSpacing="1">DOWNSTREAM</text>
          <text x="913" y="106" textAnchor="middle" fill="#f0edf5" fontFamily="Inter, system-ui, sans-serif" fontSize="12" fontWeight="500">ASR / LLM</text>
          <text x="913" y="124" textAnchor="middle" fill="#c5b4ec" fontFamily="ui-monospace, monospace" fontSize="10">↓</text>
          <text x="913" y="142" textAnchor="middle" fill="#f0edf5" fontFamily="Inter, system-ui, sans-serif" fontSize="12" fontWeight="500">TTS Reply</text>
        </svg>
      </div>

      {/* Three Technical Design Principles */}
      <div className="v4arch-pillars">
        <article>
          <span>01 · BOUNDARY POOLING</span>
          <h4>No silence dilution at 300–600 ms</h4>
          <p>Zero-shot Turn-1 freezes its primary backbone and pools statically across trailing pause frames. Pikaia-Turn jointly adapts speech-boundary prosodic pooling and branch fusion so 300–600 ms silences reinforce rather than dilute terminal prosody.</p>
        </article>
        <article>
          <span>02 · PUNCTUATION-PRESERVING CONTEXT</span>
          <h4>Zero-latency interviewer prompt conditioning</h4>
          <p>Because the agent already knows its own preceding prompt (<code>agent_text</code>) before the user speaks, Pikaia-Turn preserves terminal question marks and enumerative clause punctuation, while stochastic context dropout lets one checkpoint serve audio-only fallback.</p>
        </article>
        <article>
          <span>03 · CAUSAL SUPERVISION ({expanded} CLIPS)</span>
          <h4>Curated ({curated}) vs. Expanded ({expanded}) recipe</h4>
          <p>Built from {training.sources[0].n} human-reviewed clips, {training.sources[1].n.toLocaleString('en-US')} three-model consensus bilingual clips, and {training.sources[2].n.toLocaleString('en-US')} unanimous Mandarin expansions ({training.languages.zh.toLocaleString('en-US')} ZH / {training.languages.en.toLocaleString('en-US')} EN; {training.labels.EOT.toLocaleString('en-US')} EOT / {training.labels.HOLD} HOLD), speaker- and audio-hash disjoint from all test splits.</p>
        </article>
      </div>

      {/* Data x Architecture Scaling Table */}
      <div className="v4arch-scaling">
        <div className="v4arch-scaling-head">
          <div>
            <p className="v4m-proof-eyebrow">DATA × ARCHITECTURE SCALING · TABLE 8 ARCHIVE</p>
            <h4>Why unmodified fine-tuning regresses at {expanded} clips while Pikaia-Turn eliminates forgetting</h4>
          </div>
          <p>
            Scaling unmodified Turn-1 from {curated} to {expanded} clips collapses external LiveKit 600 ms recall by <strong>−23.1 pp</strong> (83.8% → 60.7%) and degrades Floor-end AUC by −0.0422. Joint architectural adaptation in Pikaia-Turn eliminates that regression, while standalone 0.6B Mini improves monotonically across both benchmarks.
          </p>
        </div>
        <div className="table-scroll">
          <table className="v4g-table v4arch-table">
            <thead>
              <tr>
                <th scope="col">Model &amp; adaptation</th>
                <th scope="col">Corpus</th>
                <th scope="col" className="num">Pikaia 300 Acc/Rec (τ=0.5)</th>
                <th scope="col" className="num">Pikaia Wait@5%↓</th>
                <th scope="col" className="num">LiveKit RR 600 R@5%</th>
                <th scope="col" className="num">LiveKit RR Wait@5%↓</th>
                <th scope="col" className="num">LiveKit FE AUC</th>
              </tr>
            </thead>
            <tbody>
              {SCALING_ROWS.map(row => (
                <tr key={row.variant} className={`v4arch-row tone-${row.tone}`}>
                  <th scope="row">{row.variant}</th>
                  <td>{row.clips}</td>
                  <td className="num">{row.p300AccRec}</td>
                  <td className="num">{row.pWait}</td>
                  <td className="num">{row.lk600}</td>
                  <td className="num">{row.lkWait}</td>
                  <td className="num">{row.feAuc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
