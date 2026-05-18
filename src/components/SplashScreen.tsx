import { useEffect, useRef } from 'react';
import { Wordmark } from './primitives';
import { store } from '../game/store';

const SIGNALS = [
  ['3D clinic', 'doctor POV'],
  ['Synthetic patients', 'safe practice'],
  ['Structured debrief', 'after every case'],
];

function ClinicPreview() {
  const stageRef = useRef<HTMLDivElement>(null);

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = stageRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    el.style.setProperty('--mx', x.toFixed(3));
    el.style.setProperty('--my', y.toFixed(3));
    el.style.setProperty('--rx', `${((0.5 - y) * 9).toFixed(2)}deg`);
    el.style.setProperty('--ry', `${((x - 0.5) * 12).toFixed(2)}deg`);
  };

  const resetPointer = () => {
    const el = stageRef.current;
    if (!el) return;
    el.style.setProperty('--mx', '0.52');
    el.style.setProperty('--my', '0.44');
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  };

  return (
    <div
      ref={stageRef}
      className="fizer-hero-stage"
      role="img"
      aria-label="Interactive Fizer 3D clinic training preview"
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
    >
      <div className="fizer-hero-aurora" aria-hidden />
      <div className="fizer-hero-scanline" aria-hidden />

      <div className="fizer-hero-chrome">
        <div className="fizer-kicker">Live training loop</div>
        <div className="fizer-hero-ready">READY</div>
      </div>

      <div className="fizer-hero-room" aria-hidden>
        <div className="fizer-hero-wall" />
        <div className="fizer-hero-floor" />
        <div className="fizer-hero-bed" />
        <div className="fizer-hero-desk" />
        <div className="fizer-hero-monitor">
          <img src="/fizer_favicon.png" alt="" />
          <span>3D CLINIC</span>
        </div>
        <div className="fizer-hero-patient">
          <span className="fizer-hero-head" />
          <span className="fizer-hero-body" />
          <span className="fizer-hero-leg one" />
          <span className="fizer-hero-leg two" />
        </div>
        <div className="fizer-hero-doctor" />
      </div>

      <div className="fizer-hero-orbit one" aria-hidden />
      <div className="fizer-hero-orbit two" aria-hidden />
      <div className="fizer-hero-pulse" aria-hidden />

      <div className="fizer-hero-chart">
        <div>
          <span className="fizer-hero-dot" />
          <strong>Synthetic patient</strong>
        </div>
        <p>History, examination, investigations, diagnosis, treatment.</p>
      </div>

      <div className="fizer-hero-signals">
        {SIGNALS.map(([title, label]) => (
          <div key={title}>
            <strong>{title}</strong>
            <span>{label}</span>
          </div>
        ))}
        <div>
          <strong>No PHI</strong>
          <span>demo cases only</span>
        </div>
      </div>
    </div>
  );
}

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
    <div className="screen fizer-page" style={{ overflowY: 'auto' }}>
      <header
        className="fizer-shell"
        style={{
          minHeight: 82,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 18,
          padding: '18px 0',
        }}
      >
        <Wordmark size={38} />
        <div className="fizer-kicker">3D clinical simulation</div>
      </header>

      <main className="fizer-shell" style={{ padding: 'clamp(26px, 6vw, 70px) 0 46px' }}>
        <section
          className="fizer-hero-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 0.95fr) minmax(320px, 0.8fr)',
            gap: 'clamp(24px, 5vw, 64px)',
            alignItems: 'center',
            minHeight: 'calc(100vh - 180px)',
          }}
        >
          <div className="popin" style={{ maxWidth: 670 }}>
            <div style={{ marginBottom: 18 }}>
              <Wordmark size={56} />
            </div>
            <h1 style={{ fontSize: 'clamp(46px, 7vw, 84px)', lineHeight: 0.94, letterSpacing: 0 }}>
              Practice patient encounters in a 3D clinic.
            </h1>
            <p style={{ margin: '24px 0 0', color: 'var(--ink-2)', fontSize: 'clamp(17px, 2vw, 21px)', lineHeight: 1.58, fontWeight: 650, maxWidth: 620 }}>
              Fizer puts learners into synthetic consultations: accept a patient, examine, order investigations, diagnose, prescribe, and finish with a structured debrief.
            </p>
            <div style={{ marginTop: 34 }}>
              <button
                type="button"
                className="fizer-button fizer-button--primary"
                style={{ minHeight: 54, padding: '14px 24px', fontSize: 16 }}
                onClick={() => store.beginFromSplash()}
              >
                Start Simulation
              </button>
            </div>
          </div>

          <ClinicPreview />
        </section>
      </main>
    </div>
  );
}
