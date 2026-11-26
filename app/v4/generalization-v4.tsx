import { Download } from 'lucide-react';

const TURNBENCH_ROWS = [
  { model: 'Pikaia-Turn-Mini (0.6B)', oof: '91.28%', p50: '617.5 ms', r5: '84.72%', family: true },
  { model: 'Turn-1-Mini (5.3M)', oof: '90.39%', p50: '629.0 ms', r5: '84.61%', family: false },
  { model: 'Turn-1 (2.8B, legacy Dev)', oof: '85.14%*', p50: '1,055.0 ms', r5: '—', family: false },
  { model: 'Smart Turn v3.2 (8.0M, legacy Dev)', oof: '80.09%*', p50: '—', r5: '—', family: false },
];

const EASYTURN_ROWS = [
  { model: 'Pikaia-Turn (Curated / Exp FT)', realAuc: '.9606 / .9573', synthAuc: '.9353 / .9150', waitHold: '42.0% / 30.0%', family: true },
  { model: 'Pikaia-Turn-Mini (Curated / Exp FT)', realAuc: '.9441 / .9460', synthAuc: '.8617 / .8623', waitHold: '60.0% / 67.0%', family: true },
  { model: 'Turn-1 (2.8B, zero-shot)', realAuc: '.9571', synthAuc: '.9340', waitHold: '28.0%', family: false },
];

export function GeneralizationV4() {
  return (
    <div className="v4g-deck" id="transfer" aria-labelledby="v4g-title">
      <div className="v4g-head">
        <div>
          <p className="v4m-proof-eyebrow">EXTERNAL STRESS TESTS &amp; BOUNDARIES</p>
          <h3 id="v4g-title">Generalization beyond interview pipelines</h3>
        </div>
        <a className="v4m-proof-dl" href="/report/v2-supplementary.json" download>
          Full transfer tables <Download size={13} aria-hidden="true"/>
        </a>
      </div>

      <div className="v4g-grid">
        <article className="v4g-chamber">
          <div className="v4m-proof-topline">
            <span>TURNBENCH DEV · 38 ENGLISH STUDIO DYADS</span>
            <strong className="tone-cyan">91.28% OOF · 617.5 ms p50</strong>
          </div>
          <h4>Full-duplex dialogue stress test</h4>
          <p className="v4g-sub">
            Frozen model weights paired with a causal duplex partner-VAD control layer (conversation-grouped out-of-fold recall at ≤10% FPR). Local Dev stress test, not a held-out Test leaderboard entry.
          </p>
          <div className="table-scroll">
            <table className="v4g-table">
              <thead>
                <tr>
                  <th scope="col">Model</th>
                  <th scope="col" className="num">Duplex OOF</th>
                  <th scope="col" className="num">p50 latency</th>
                  <th scope="col" className="num">R@5% FPR</th>
                </tr>
              </thead>
              <tbody>
                {TURNBENCH_ROWS.map(row => (
                  <tr key={row.model} className={row.family ? 'is-family' : ''}>
                    <th scope="row">{row.model}</th>
                    <td className="num">{row.oof}</td>
                    <td className="num">{row.p50}</td>
                    <td className="num">{row.r5}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="v4g-footnote">*Turn-1 (2.8B) and Smart Turn v3.2 evaluated on the legacy Dev protocol without the duplex partner-VAD layer.</p>
        </article>

        <article className="v4g-chamber">
          <div className="v4m-proof-topline">
            <span>EASYTURN-800 · ZERO-CONTEXT MANDARIN</span>
            <strong className="tone-coral">Real .9606 · Boundary noted</strong>
          </div>
          <h4>Prompt-free utterances &amp; explicit “wait” boundaries</h4>
          <p className="v4g-sub">
            Evaluates isolated real + synthetic TTS Mandarin clips with empty prompt text. Highlights strong real-speech AUC alongside candid domain boundaries on synthetic prosody and explicit hold requests.
          </p>
          <div className="table-scroll">
            <table className="v4g-table">
              <thead>
                <tr>
                  <th scope="col">Model</th>
                  <th scope="col" className="num">Real AUC</th>
                  <th scope="col" className="num">Synth AUC</th>
                  <th scope="col" className="num">Wait-hold</th>
                </tr>
              </thead>
              <tbody>
                {EASYTURN_ROWS.map(row => (
                  <tr key={row.model} className={row.family ? 'is-family' : ''}>
                    <th scope="row">{row.model}</th>
                    <td className="num">{row.realAuc}</td>
                    <td className="num">{row.synthAuc}</td>
                    <td className="num">{row.waitHold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="v4g-footnote">Both Pikaia server checkpoints preserve strong real-speech discrimination; synthetic TTS prosody and explicit “wait” hold prompts remain harder out-of-domain regimes.</p>
        </article>
      </div>
    </div>
  );
}
