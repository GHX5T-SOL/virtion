import { useEffect, useRef, useState } from 'react';
import { useScreen } from '../game/store';

const MUTED_KEY = 'virtion:music-muted';

function readMuted(): boolean {
  try {
    return typeof window !== 'undefined' && window.localStorage.getItem(MUTED_KEY) === '1';
  } catch {
    return false;
  }
}

function writeMuted(v: boolean) {
  try {
    window.localStorage.setItem(MUTED_KEY, v ? '1' : '0');
  } catch {
    /* storage can be disabled; audio still works */
  }
}

function createAmbientGraph(ctx: AudioContext) {
  const master = ctx.createGain();
  master.gain.value = 0.035;
  master.connect(ctx.destination);

  const nodes: Array<OscillatorNode | GainNode | BiquadFilterNode> = [master];
  const tones = [
    { frequency: 73.42, gain: 0.38, type: 'sine' as OscillatorType },
    { frequency: 110, gain: 0.18, type: 'sine' as OscillatorType },
    { frequency: 146.83, gain: 0.10, type: 'triangle' as OscillatorType },
  ];

  for (const tone of tones) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc.type = tone.type;
    osc.frequency.value = tone.frequency;
    filter.type = 'lowpass';
    filter.frequency.value = 620;
    filter.Q.value = 0.72;
    gain.gain.value = tone.gain;
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    osc.start();
    nodes.push(osc, gain, filter);
  }

  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = 0.045;
  lfoGain.gain.value = 0.018;
  lfo.connect(lfoGain);
  lfoGain.connect(master.gain);
  lfo.start();
  nodes.push(lfo, lfoGain);

  return {
    resume: () => ctx.resume(),
    suspend: () => ctx.suspend(),
    close: () => {
      for (const node of nodes) {
        if ('stop' in node) {
          try { node.stop(); } catch { /* already stopped */ }
        }
        try { node.disconnect(); } catch { /* already disconnected */ }
      }
      return ctx.close().catch(() => undefined);
    },
  };
}

export function BackgroundMusic() {
  const screen = useScreen();
  const [userMuted, setUserMuted] = useState<boolean>(readMuted);
  const graphRef = useRef<ReturnType<typeof createAmbientGraph> | null>(null);
  const shouldPlay = !userMuted && screen !== 'encounter';
  const shouldPlayRef = useRef(shouldPlay);
  const mutedRef = useRef(userMuted);

  useEffect(() => {
    shouldPlayRef.current = shouldPlay;
    const graph = graphRef.current;
    if (!graph) return;
    if (shouldPlay) void graph.resume();
    else void graph.suspend();
  }, [shouldPlay]);

  useEffect(() => {
    mutedRef.current = userMuted;
    if (userMuted) void graphRef.current?.suspend();
    else if (shouldPlayRef.current) void graphRef.current?.resume();
  }, [userMuted]);

  useEffect(() => {
    const boot = () => {
      if (graphRef.current || mutedRef.current) return;
      const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      graphRef.current = createAmbientGraph(new AudioCtx());
      if (shouldPlayRef.current) void graphRef.current.resume();
      else void graphRef.current.suspend();
    };
    window.addEventListener('pointerdown', boot);
    window.addEventListener('keydown', boot);
    return () => {
      window.removeEventListener('pointerdown', boot);
      window.removeEventListener('keydown', boot);
      void graphRef.current?.close();
      graphRef.current = null;
    };
  }, []);

  const toggle = () => {
    const next = !userMuted;
    setUserMuted(next);
    writeMuted(next);
    if (!next && !graphRef.current) {
      const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) graphRef.current = createAmbientGraph(new AudioCtx());
    }
    if (!next && shouldPlayRef.current) void graphRef.current?.resume();
  };

  if (screen === 'splash') return null;

  const off = userMuted || screen === 'encounter';
  return (
    <button
      type="button"
      onClick={toggle}
      title={userMuted ? 'Ambient muted' : screen === 'encounter' ? 'Ambient paused during session' : 'Ambient on'}
      aria-label={userMuted ? 'Unmute ambient audio' : 'Mute ambient audio'}
      style={{
        position: 'fixed',
        top: 18,
        right: 176,
        zIndex: 1000,
        width: 38,
        height: 38,
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.18)',
        background: off ? 'rgba(255,255,255,0.06)' : 'rgba(79,227,255,0.16)',
        boxShadow: off ? 'var(--plush-tiny)' : '0 0 24px rgba(79,227,255,0.26), var(--plush-tiny)',
        cursor: 'pointer',
        color: off ? 'var(--ink-soft)' : 'var(--peach-deep)',
        fontFamily: 'Sora, Inter, sans-serif',
        fontWeight: 900,
        display: 'grid',
        placeItems: 'center',
        padding: 0,
      }}
    >
      <span aria-hidden>{off ? 'OFF' : 'ON'}</span>
    </button>
  );
}
