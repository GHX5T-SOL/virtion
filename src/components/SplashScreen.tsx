import { useEffect } from 'react';
import { Wordmark } from './primitives';
import { store } from '../game/store';

const SIGNALS = [
  'clinical simulation',
  'AI attending',
  'synthetic cases',
  'AR / VR roadmap',
  'decentralized compute',
];

export function SplashScreen() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        store.beginFromSplash();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div
      className="screen virtion-shell"
      onClick={() => store.beginFromSplash()}
      style={{
        cursor: 'pointer',
        display: 'grid',
        gridTemplateRows: '1fr auto',
        overflow: 'hidden',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 50% 34%, rgba(79,227,255,0.24), transparent 28%), radial-gradient(circle at 50% 42%, rgba(69,240,176,0.12), transparent 34%)',
        }}
      />

      <div
        aria-hidden
        className="drift"
        style={{
          position: 'absolute',
          left: '50%',
          top: '38%',
          width: 'min(72vw, 760px)',
          aspectRatio: '1 / 1',
          transform: 'translate(-50%, -50%)',
          border: '1px solid rgba(79,227,255,0.22)',
          borderRadius: '50%',
          boxShadow: 'inset 0 0 120px rgba(79,227,255,0.08), 0 0 90px rgba(79,227,255,0.16)',
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              inset: `${10 + i * 13}%`,
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '50%',
              transform: `rotate(${i * 28}deg)`,
            }}
          />
        ))}
      </div>

      <main
        className="popin"
        style={{
          position: 'relative',
          zIndex: 2,
          alignSelf: 'center',
          justifySelf: 'center',
          width: 'min(1120px, calc(100vw - 32px))',
          padding: '72px 28px 44px',
          textAlign: 'center',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <Wordmark size={64} />
        </div>

        <div className="chip mint" style={{ marginBottom: 18 }}>
          Training simulator · synthetic cases · not clinical advice
        </div>

        <h1
          style={{
            fontSize: 'var(--type-hero-xl)',
            lineHeight: 0.92,
            maxWidth: 980,
            margin: '0 auto',
          }}
        >
          The medical learning OS for the AI-native doctor.
        </h1>

        <p
          style={{
            maxWidth: 780,
            margin: '24px auto 0',
            color: 'var(--ink-2)',
            fontSize: 'var(--type-copy-lg)',
            lineHeight: 1.6,
            fontWeight: 600,
          }}
        >
          Enter a realistic clinic, speak to synthetic patients, make decisions under pressure, and receive structured feedback from an AI attending.
        </p>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 10,
            flexWrap: 'wrap',
            marginTop: 28,
          }}
        >
          {SIGNALS.map((signal) => (
            <span key={signal} className="chip sky">
              {signal}
            </span>
          ))}
        </div>

        <div style={{ marginTop: 38, display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-plush primary"
            style={{ fontSize: 18, padding: '16px 30px' }}
            onClick={(e) => {
              e.stopPropagation();
              store.beginFromSplash();
            }}
          >
            Start simulation
          </button>
          <button
            type="button"
            className="btn-plush ghost"
            style={{ fontSize: 18, padding: '16px 30px' }}
            onClick={(e) => {
              e.stopPropagation();
              store.setScreen('agentTopology');
            }}
          >
            View platform
          </button>
        </div>
      </main>

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: 1,
          background: 'rgba(255,255,255,0.08)',
        }}
      >
        {[
          ['300+', 'synthetic consults'],
          ['24', 'specialty tracks'],
          ['<8 min', 'case loop'],
          ['0 PHI', 'demo data'],
        ].map(([big, label]) => (
          <div key={label} style={{ padding: '18px 20px', background: 'rgba(3,7,17,0.78)', textAlign: 'center' }}>
            <div style={{ fontFamily: 'Sora', fontSize: 24, fontWeight: 800 }}>{big}</div>
            <div style={{ marginTop: 4, color: 'var(--ink-soft)', fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
