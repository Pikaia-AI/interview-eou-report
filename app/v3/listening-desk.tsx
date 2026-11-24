'use client';

import { useEffect, useRef, useState } from 'react';
import { Headphones, Pause, Play } from 'lucide-react';
import study from './listening-examples.json';

type Example = (typeof study.examples)[number];
type Decision = 'Hold' | 'Respond';
const decisions = { Hold: 'Keep listening', Respond: 'Respond now' } as const;
const W = 560;

function DecisionCase({ example }: { example: Example }) {
  const audio = useRef<HTMLAudioElement>(null);
  const cursor = useRef<SVGGElement>(null);
  const [playing, setPlaying] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [choice, setChoice] = useState<Decision | null>(null);
  const beforePauseMs = example.pauseStartMs - example.startMs;
  const durationMs = beforePauseMs + study.pauseMs;
  const duration = durationMs / 1000;
  const pauseX = W * beforePauseMs / durationMs;
  const trace = example.peaks.map((peak, i) => {
    const x = (i + .5) / example.peaks.length * W;
    const h = Math.max(.6, 31 * peak / 100);
    return `M${x.toFixed(1)} ${(40 - h).toFixed(1)}v${(2 * h).toFixed(1)}`;
  }).join(' ');

  // Changing cases remounts the audio element and discards the previous answer.
  useEffect(() => {
    const player = audio.current;
    return () => { player?.pause(); };
  }, []);

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    const update = () => {
      const fraction = Math.min(1, (audio.current?.currentTime ?? 0) / duration);
      cursor.current?.setAttribute('transform', `translate(${fraction * W} 0)`);
      frame = requestAnimationFrame(update);
    };
    update();
    return () => cancelAnimationFrame(frame);
  }, [playing, duration]);

  async function togglePlayback() {
    const player = audio.current;
    if (!player) return;
    if (!player.paused) { player.pause(); return; }
    try {
      setUnavailable(false);
      if (player.ended) player.currentTime = 0;
      await player.play();
    } catch (e) {
      if (!(e instanceof DOMException && e.name === 'AbortError')) setUnavailable(true);
    }
  }

  return <>
    <div className="desk-columns">
      <div className="desk-transcript">
        <p className="desk-label">Conversation</p><p className="desk-question">{study.context}</p>
        <p className="desk-label">Speaker</p><blockquote>“{example.transcript}”</blockquote>
      </div>
      <div className="desk-reader">
        <div className="desk-track">
          <audio ref={audio} src={example.src} preload="none"
            onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
            onEnded={() => { setPlaying(false); cursor.current?.setAttribute('transform', `translate(${W} 0)`); }}
            onError={() => { setPlaying(false); setUnavailable(true); }}/>
          <button type="button" className="desk-play" onClick={togglePlayback} aria-label={playing ? 'Pause example audio' : 'Play example audio'}>
            {playing ? <Pause size={17} aria-hidden="true"/> : <Play size={17} aria-hidden="true"/>}
          </button>
          <div className="desk-wave">
            <div className="desk-clock"><span>0.00 s</span><span>{duration.toFixed(2)} s</span></div>
            <svg viewBox={`0 0 ${W} 80`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
              <rect x={pauseX} width={W - pauseX} height="80" fill="#a5d8dc" opacity=".09"/>
              <path d={`M0 40H${W}`} stroke="#687075" strokeWidth=".8"/>
              <path d={trace} stroke="#c6b7df" strokeWidth="1.8" strokeLinecap="round"/>
              <path d={`M${pauseX} 2V78`} stroke="#a5d8dc" strokeDasharray="2 4"/>
              <path d={`M${W - 1} 2V78`} stroke="#a5d8dc"/>
              <g ref={cursor}><path d="M0 0V80" stroke="#fff" strokeWidth="2"/></g>
            </svg>
            <div className="desk-clock"><span>Speech</span><span>{study.pauseMs} ms pause → decision</span></div>
          </div>
        </div>
        {unavailable && <p className="desk-error" role="status">Audio unavailable. You can use the transcript to make the same choice.</p>}
        <div className="desk-choices" role="group" aria-label="What should the listener do at the cutoff?">
          <span>Your decision</span>
          {(Object.keys(decisions) as Decision[]).map(value => <button type="button" key={value} aria-pressed={choice === value} onClick={() => setChoice(value)}>{decisions[value]}</button>)}
        </div>
      </div>
    </div>
    <div className="desk-readout" aria-live="polite" aria-atomic="true">
      {choice ? <p><strong>{example.label === 'Hold' ? 'HOLD' : 'Response-ready'}.</strong> {example.why}{' '}
        <a href={study.source.audio} target="_blank" rel="noreferrer">Hear the full exchange</a></p>
        : <p>Listen or read, then choose what you would do at the pause.</p>}
    </div>
  </>;
}

export function ListeningDesk() {
  const [index, setIndex] = useState(0);
  return <section className="listening-desk" aria-labelledby="desk-heading">
    <div className="desk-topline">
      <div className="desk-id"><Headphones size={17} aria-hidden="true"/><h2 id="desk-heading">The listening task</h2></div>
      <div className="desk-examples" role="group" aria-label="Choose an illustrative example">
        {study.examples.map((e, i) => <button type="button" key={e.src} aria-pressed={index === i} onClick={() => setIndex(i)}>Case {i === 0 ? 'A' : 'B'}</button>)}
      </div>
    </div>
    <DecisionCase key={index} example={study.examples[index]}/>
    <p className="desk-note">Recording from <a href={study.source.page}>{study.source.collection}</a> by {study.source.author} (<a href={study.source.licenseUrl}>{study.source.license}</a>). Pikaia clipped and labeled the two pauses for this exercise.</p>
  </section>;
}
