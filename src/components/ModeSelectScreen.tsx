import { TopBar } from './primitives';
import { store } from '../game/store';

interface ModuleCardProps {
  label: string;
  sub: string;
  meta: string;
  tone: 'mint' | 'sky' | 'rose';
  available?: boolean;
  onOpen?: () => void;
}

function ModuleCard({ label, sub, meta, tone, available, onOpen }: ModuleCardProps) {
  const accent =
    tone === 'mint' ? 'var(--mint)' :
    tone === 'sky' ? 'var(--sky)' :
    'var(--rose)';
  return (
    <button
      type="button"
      className={`glass-panel scanline ${available ? 'tap' : ''}`}
      onClick={available ? onOpen : undefined}
      disabled={!available}
      style={{
        minHeight: 320,
        padding: 22,
        textAlign: 'left',
        color: 'var(--ink)',
        cursor: available ? 'pointer' : 'not-allowed',
        opacity: available ? 1 : 0.58,
        fontFamily: 'inherit',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'hidden',
      }}
    >
      <div>
        <div className={`chip ${tone}`}>{available ? 'open now' : 'coming soon'}</div>
        <div
          aria-hidden
          style={{
            marginTop: 28,
            width: '100%',
            height: 130,
            borderRadius: 12,
            border: '1px solid var(--line)',
            background:
              `radial-gradient(circle at 50% 42%, ${accent}33, transparent 36%), linear-gradient(135deg, rgba(255,255,255,0.72), rgba(255,255,255,0.34))`,
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: 80,
              height: 80,
              transform: 'translate(-50%, -50%) rotate(45deg)',
              border: `2px solid ${accent}`,
              borderRadius: 18,
              boxShadow: `0 0 40px ${accent}55`,
            }}
          />
        </div>
      </div>
      <div>
        <div style={{ fontFamily: 'Sora', fontSize: 30, fontWeight: 800, marginTop: 22 }}>{label}</div>
        <div style={{ color: 'var(--ink-2)', lineHeight: 1.5, fontWeight: 600, marginTop: 8 }}>{sub}</div>
        <div style={{ color: accent, fontWeight: 850, marginTop: 18, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {meta}
        </div>
      </div>
    </button>
  );
}

export function ModeSelectScreen() {
  return (
    <div className="screen virtion-shell" style={{ overflowY: 'auto' }}>
      <TopBar here={0} showProfile />

      <main style={{ width: 'min(1180px, calc(100vw - 32px))', margin: '0 auto', padding: '44px 0 72px' }}>
        <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, flexWrap: 'wrap', marginBottom: 24 }}>
          <div>
            <div className="chip mint">simulation modules</div>
            <h1 style={{ fontSize: 'var(--type-hero-md)', lineHeight: 1.02, marginTop: 14 }}>Choose the training environment.</h1>
            <p style={{ color: 'var(--ink-2)', fontWeight: 600, fontSize: 18, lineHeight: 1.55, maxWidth: 760, margin: '16px 0 0' }}>
              Start in the polyclinic. Emergency, services, procedures, and immersive app clients are staged on the roadmap.
            </p>
          </div>
          <button type="button" className="btn-plush ghost" onClick={() => store.setScreen('home')}>
            Home
          </button>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 16 }}>
          <ModuleCard
            label="Polyclinic"
            sub="One outpatient at a time. Speak, examine, order tests, diagnose, prescribe, and dispatch."
            meta="24 specialties · live"
            tone="mint"
            available
            onOpen={() => store.setScreen('gpRoom')}
          />
          <ModuleCard
            label="Diagnostics cloud"
            sub="Imaging, labs, pharmacy, and specialty tool stations for fast OSCE-style drills."
            meta="services roadmap"
            tone="sky"
          />
          <ModuleCard
            label="Emergency"
            sub="Triage, resus, time-critical decisions, and multi-patient pressure once the ED module ships."
            meta="ER roadmap"
            tone="rose"
          />
        </section>
      </main>
    </div>
  );
}
