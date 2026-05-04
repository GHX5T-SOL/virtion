import { useEffect } from 'react';
import { ClinicalOrbitVisual, Wordmark } from './primitives';
import { store } from '../game/store';

const SIGNALS = [
  ['Synthetic patients', 'training today'],
  ['AI attending', 'structured debriefs'],
  ['No PHI demo', 'not clinical advice'],
];

const ROADMAP = [
  '3D clinical spaces',
  'AR / VR training grounds',
  'Consent-first R&D compute',
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
    <div className="screen virtion-shell" style={{ overflowY: 'auto' }}>
      <header
        className="splash-header"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 18,
          padding: '16px clamp(18px, 4vw, 48px)',
          background: 'rgba(255,255,255,0.70)',
          backdropFilter: 'blur(24px) saturate(1.3)',
          borderBottom: '1px solid var(--line)',
        }}
      >
        <Wordmark size={32} />
        <nav className="splash-nav" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <span className="chip mint splash-nav-chip">BioMed AI education</span>
          <button type="button" className="btn-plush ghost splash-platform" onClick={() => store.setScreen('agentTopology')}>
            Platform
          </button>
          <button type="button" className="btn-plush primary" onClick={() => store.beginFromSplash()}>
            Start
          </button>
        </nav>
      </header>

      <main className="splash-main" style={{ width: 'calc(100vw - 48px)', maxWidth: 1180, margin: '0 auto', padding: 'clamp(32px, 7vw, 72px) 0 34px' }}>
        <section
          className="splash-hero-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 390px), 1fr))',
            gap: 'clamp(24px, 5vw, 54px)',
            alignItems: 'center',
            minHeight: 'min(760px, calc(100vh - 128px))',
          }}
        >
          <div className="popin" style={{ maxWidth: 620 }}>
            <div className="chip sky">training simulator · synthetic cases · not clinical advice</div>
            <h1 style={{ fontSize: 'clamp(42px, 7vw, 72px)', lineHeight: 0.96, marginTop: 18 }}>
              Medical training, played live.
            </h1>
            <p style={{ margin: '22px 0 0', color: 'var(--ink-2)', fontSize: 'var(--type-copy-lg)', lineHeight: 1.58, fontWeight: 650 }}>
              Virtion lets students practice the real consultation loop with synthetic patients, investigations, treatment choices, and AI attending feedback.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 30 }}>
              <button type="button" className="btn-plush primary" style={{ fontSize: 17, padding: '15px 26px' }} onClick={() => store.beginFromSplash()}>
                Start simulation
              </button>
              <button type="button" className="btn-plush ghost" style={{ fontSize: 17, padding: '15px 26px' }} onClick={() => store.setScreen('agentTopology')}>
                See the platform
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: 10, marginTop: 32 }}>
              {SIGNALS.map(([big, label], i) => (
                <div key={big} className="glass-panel popin" style={{ padding: 14, animationDelay: `${0.12 + i * 0.045}s` }}>
                  <div style={{ fontFamily: 'Sora', fontWeight: 850, fontSize: 18 }}>{big}</div>
                  <div style={{ marginTop: 4, color: 'var(--ink-soft)', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="popin" style={{ animationDelay: '0.08s' }}>
            <ClinicalOrbitVisual />
          </div>
        </section>

        <section
          className="glass-panel"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
            gap: 1,
            overflow: 'hidden',
          }}
        >
          {ROADMAP.map((item, i) => (
            <div key={item} style={{ padding: '18px 20px', background: i === 1 ? 'rgba(255,255,255,0.46)' : 'rgba(255,255,255,0.30)' }}>
              <div className={`chip ${i === 0 ? 'mint' : i === 1 ? 'peach' : 'butter'}`}>roadmap {i + 1}</div>
              <div style={{ marginTop: 10, fontFamily: 'Sora', fontSize: 20, fontWeight: 850 }}>{item}</div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
