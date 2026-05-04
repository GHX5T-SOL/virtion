import { store, useStore } from '../game/store';
import { Wordmark } from './primitives';

interface Card {
  tag: string;
  title: string;
  body: string;
  metric: string;
  detail: string;
}

const CARDS: Card[] = [
  {
    tag: '01 · simulation layer',
    title: 'Practice the consultation before it matters.',
    body:
      'Virtion puts medical students inside synthetic clinical encounters: take the history, examine, order tests, diagnose, prescribe, counsel, and learn from the result.',
    metric: 'doctor POV',
    detail: 'A clinic environment built for repeated decisions, not passive revision.',
  },
  {
    tag: '02 · AI attending',
    title: 'Feedback is structured, cited, and resilient.',
    body:
      'The attending debrief grades data gathering, management, and communication. Premium models lead, then fallback providers and deterministic rubrics keep the loop alive.',
    metric: 'never blank',
    detail: 'If upstream AI fails, Virtion degrades clearly instead of breaking the case.',
  },
  {
    tag: '03 · future network',
    title: 'A learning platform that can become research infrastructure.',
    body:
      'The roadmap expands into AR, VR, mobile, desktop, and consent-first device nodes that can contribute idle compute to protein folding, gene sequencing, and drug-discovery simulations.',
    metric: 'R&D only',
    detail: 'Synthetic cases today. Consent-first data and compute research tomorrow.',
  },
];

export function OnboardingScreen() {
  const step = useStore((s) => s.onboardingStep);
  const card = CARDS[step];

  return (
    <div className="screen virtion-shell" style={{ overflowY: 'auto' }}>
      <div style={{ padding: '22px clamp(18px, 4vw, 48px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Wordmark size={32} />
        <div className="chip mint">training simulator · synthetic cases</div>
      </div>

      <main
        style={{
          minHeight: 'calc(100vh - 88px)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
          gap: 36,
          alignItems: 'center',
          width: 'min(1180px, calc(100vw - 32px))',
          margin: '0 auto',
          padding: '28px 0 48px',
        }}
      >
        <section className="glass-panel scanline" style={{ padding: 'clamp(22px, 4vw, 42px)' }}>
          <div className="chip sky">{card.tag}</div>
          <h1 style={{ fontSize: 'var(--type-hero-md)', lineHeight: 1.02, marginTop: 18 }}>
            {card.title}
          </h1>
          <p style={{ color: 'var(--ink-2)', fontSize: 18, lineHeight: 1.65, fontWeight: 600, margin: '22px 0 0' }}>
            {card.body}
          </p>
          <div style={{ marginTop: 30, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-plush ghost"
              style={{ visibility: step === 0 ? 'hidden' : 'visible' }}
              onClick={() => store.setOnboardingStep(step - 1)}
            >
              Back
            </button>
            {step < CARDS.length - 1 ? (
              <button type="button" className="btn-plush primary" onClick={() => store.setOnboardingStep(step + 1)}>
                Continue
              </button>
            ) : (
              <button type="button" className="btn-plush primary" onClick={() => store.finishOnboarding()}>
                Enter Virtion
              </button>
            )}
          </div>
        </section>

        <section style={{ display: 'grid', gap: 16 }}>
          <div className="glass-panel" style={{ padding: 22 }}>
            <div style={{ color: 'var(--ink-soft)', fontSize: 12, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              current module
            </div>
            <div style={{ marginTop: 10, fontFamily: 'Sora', fontSize: 46, fontWeight: 800, color: 'var(--peach-deep)' }}>
              {card.metric}
            </div>
            <div style={{ marginTop: 8, color: 'var(--ink-2)', lineHeight: 1.5, fontWeight: 600 }}>
              {card.detail}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: 22, display: 'grid', gap: 14 }}>
            {CARDS.map((item, i) => (
              <button
                key={item.tag}
                type="button"
                onClick={() => store.setOnboardingStep(i)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '36px 1fr',
                  gap: 12,
                  alignItems: 'center',
                  textAlign: 'left',
                  background: i === step ? 'rgba(79,227,255,0.12)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${i === step ? 'rgba(79,227,255,0.45)' : 'rgba(255,255,255,0.12)'}`,
                  borderRadius: 10,
                  padding: 12,
                  color: 'var(--ink)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    background: i === step ? 'var(--peach-deep)' : 'rgba(255,255,255,0.08)',
                    color: i === step ? '#02111b' : 'var(--ink-2)',
                    fontWeight: 900,
                  }}
                >
                  {i + 1}
                </span>
                <span>
                  <span style={{ display: 'block', fontWeight: 850 }}>{item.title}</span>
                  <span style={{ display: 'block', color: 'var(--ink-soft)', fontSize: 12, marginTop: 2 }}>{item.metric}</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
