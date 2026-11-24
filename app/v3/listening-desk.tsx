'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Headphones, Pause, Play } from 'lucide-react';
import study from './listening-examples.json';

type Example = (typeof study.examples)[number];
type Decision = 'Hold' | 'Respond';
type Segment = 'clip' | 'continuation';
const decisions = { Hold: 'Keep listening', Respond: 'Respond now' } as const;
const W = 560;
const nextSeconds = study.continuationMs / 1000;

function peakPath(peaks: number[], center: number, height: number) {
  return peaks.map((peak, i) => {
    const x = (i + .5) / peaks.length * W;
    const h = height * peak / 100;
    return h ? `M${x.toFixed(1)} ${(center - h).toFixed(1)}v${(2 * h).toFixed(1)}` : '';
  }).join(' ');
}

function DecisionCase({ example }: { example: Example }) {
  const audio = useRef<HTMLAudioElement>(null);
  const active = useRef<Segment>('clip');
  const cursor = useRef<SVGGElement>(null);
  const visibleWave = useRef<SVGRectElement>(null);
  const maskId = useId();
  const [playing, setPlaying] = useState<Segment | null>(null);
  const [unavailable, setUnavailable] = useState<Segment | null>(null);
  const [choice, setChoice] = useState<Decision | null>(null);
  const [revealed, setRevealed] = useState(false);
  const beforePauseMs = example.pauseStartMs - example.startMs;
  const leadSeconds = (beforePauseMs + study.pauseMs) / 1000;
  const duration = leadSeconds + (revealed ? nextSeconds : 0);
  const pauseX = W * (beforePauseMs / 1000) / duration;
  const cutoffX = W * leadSeconds / duration;

  // Changing cases remounts the audio element and discards the previous answer.
  useEffect(() => {
    const player = audio.current;
    return () => { player?.pause(); };
  }, []);

  const syncWave = useCallback(() => {
    const player = audio.current;
    if (!player) return;
    const following = active.current === 'continuation';
    const elapsed = following ? leadSeconds + player.currentTime : player.currentTime;
    const x = W * Math.min(1, elapsed / duration);
    cursor.current?.setAttribute('transform', `translate(${x} 0)`);
    if (following) visibleWave.current?.setAttribute('width', String(x));
  }, [leadSeconds, duration]);

  useEffect(() => {
    syncWave();
    if (!playing || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let frame: number;
    const tick = () => { syncWave(); frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, syncWave]);

  async function togglePlayback(segment: Segment) {
    const player = audio.current;
    if (!player) return;
    if (segment === active.current && !player.paused) { player.pause(); return; }
    if (segment === 'continuation') setRevealed(true);
    const src = segment === 'clip' ? example.src : example.continuation.src;
    active.current = segment;
    setUnavailable(null);
    try {
      // Set the source within the click so play() keeps the user's audio activation.
      if (player.getAttribute('src') !== src) player.src = src;
      else if (player.ended) player.currentTime = 0;
      await player.play();
    } catch (e) {
      if (active.current === segment && !(e instanceof DOMException && e.name === 'AbortError')) {
        setPlaying(null);
        setUnavailable(segment);
      }
    }
  }

  return <>
    <div className="desk-columns">
      <div className="desk-transcript">
        <p className="desk-label">Conversation</p><p className="desk-question">{study.context}</p>
        <p className="desk-label">Speaker 1</p><blockquote>“{example.transcript}”</blockquote>
      </div>
      <div className="desk-reader">
        <div className="desk-track">
          <audio ref={audio} preload="none" onTimeUpdate={syncWave} onSeeked={syncWave}
            onPlay={e => { if (!e.currentTarget.paused) setPlaying(active.current); }}
            onPause={e => { if (e.currentTarget.paused) setPlaying(null); }}
            onEnded={() => { syncWave(); setPlaying(null); }}
            onError={() => { setPlaying(null); setUnavailable(active.current); }}>
            <source src={example.src} type="audio/wav"/>
          </audio>
          <button type="button" className="desk-play" onClick={() => togglePlayback('clip')}
            aria-label={playing === 'clip' ? 'Pause example audio' : 'Play audio up to the decision'} title="Audio up to the decision">
            {playing === 'clip' ? <Pause size={17} aria-hidden="true"/> : <Play size={17} aria-hidden="true"/>}
          </button>
          <div className="desk-wave" data-revealed={revealed} data-audio-error={unavailable === 'continuation'}>
            {revealed
              ? <div className="desk-speakers"><span>Speaker 1</span><span>Speaker 2</span></div>
              : <div className="desk-clock"><span>0.00 s</span><span>{leadSeconds.toFixed(2)} s</span></div>}
            <svg viewBox={`0 0 ${W} 80`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
              <rect x={pauseX} width={cutoffX - pauseX} height="80" fill="#a5d8dc" opacity=".09"/>
              {revealed ? <>
                <defs><clipPath id={maskId}><rect ref={visibleWave} width={cutoffX} height="80"/></clipPath></defs>
                <path d={`M0 20H${W}M0 60H${W}`} stroke="#687075" strokeWidth=".7"/>
                <g className="desk-reveal-wave" clipPath={`url(#${maskId})`} strokeWidth="1.8" strokeLinecap="round">
                  <path d={peakPath(example.continuation.speaker1Peaks, 20, 17)} stroke="#c6b7df"/>
                  <path d={peakPath(example.continuation.speaker2Peaks, 60, 17)} stroke="#a5d8dc"/>
                </g>
              </> : <>
                <path d={`M0 40H${W}`} stroke="#687075" strokeWidth=".8"/>
                <path d={peakPath(example.peaks, 40, 31)} stroke="#c6b7df" strokeWidth="1.8" strokeLinecap="round"/>
              </>}
              <path d={`M${pauseX} 2V78`} stroke="#a5d8dc" strokeDasharray="2 4"/>
              <path d={`M${Math.min(cutoffX, W - 1)} 2V78`} stroke="#a5d8dc"/>
              <g ref={cursor} className="desk-playhead"><path d="M0 0V80" stroke="#fff" strokeWidth="2"/></g>
            </svg>
            {revealed
              ? <div className="desk-clock desk-axis"><span>0 s</span><span style={{ left: `${100 * cutoffX / W}%` }}>Decision</span><span>+{nextSeconds} s</span></div>
              : <div className="desk-clock"><span>Speech</span><span>{study.pauseMs} ms pause → decision</span></div>}
          </div>
        </div>
        {unavailable === 'clip' && <p className="desk-error" role="status">Audio unavailable. You can use the transcript to make the same choice.</p>}
        <div className="desk-choices" role="group" aria-label="What should the listener do at the cutoff?">
          <span>Your decision</span>
          {(Object.keys(decisions) as Decision[]).map(value => <button type="button" key={value} aria-pressed={choice === value} onClick={() => setChoice(value)}>{decisions[value]}</button>)}
        </div>
      </div>
    </div>
    <div className="desk-readout">
      {choice ? <button type="button" className="desk-follow" onClick={() => togglePlayback('continuation')}>
        {playing === 'continuation' ? <Pause size={15} aria-hidden="true"/> : <Play size={15} aria-hidden="true"/>}
        {playing === 'continuation' ? 'Pause continuation' : revealed ? 'Play continuation' : 'Hear the next 2 seconds'}
      </button> : <p>Listen or read, then choose what you would do at the pause.</p>}
      <div role="status">
        {revealed && <p><strong>{example.label === 'Hold' ? 'HOLD' : 'Response-ready'}.</strong> {example.why}{' '}
          <a href={study.source.audio} target="_blank" rel="noreferrer">Hear the full exchange</a></p>}
        {unavailable === 'continuation' && <p className="desk-error">Continuation audio unavailable.</p>}
      </div>
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
