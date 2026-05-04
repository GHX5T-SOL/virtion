import { useEffect, useMemo, useState } from 'react';
import { ClinicalOrbitVisual, TopBar } from './primitives';
import { store } from '../game/store';
import { listEvalHistory, type EvalHistoryEntry } from '../data/evalHistory';
import { CASES } from '../data/cases';
import { CLINIC_IDS } from '../game/clinic';

const VERDICT_SCORE: Record<EvalHistoryEntry['verdict'], number> = {
  'clear-fail': 1,
  borderline: 2,
  satisfactory: 3,
  good: 4,
  excellent: 5,
};

const PRODUCT_PILLARS = [
  {
    title: 'Synthetic patient encounters',
    body: 'Students practice history, examination, tests, treatment, prescribing, counseling, and disposition in a live clinic loop.',
    tag: 'now',
  },
  {
    title: 'AI attending debriefs',
    body: 'Structured feedback grades clinical reasoning, communication, and management with clear degraded fallbacks.',
    tag: 'resilient AI',
  },
  {
    title: 'AR / VR / mobile / desktop',
    body: 'Roadmap clients turn every device into a portable clinical-skills lab for students and educators.',
    tag: 'apps',
  },
  {
    title: 'Decentralized research compute',
    body: 'Opt-in device nodes may support future protein folding, sequencing, and drug-discovery simulations.',
    tag: 'R&D',
  },
];

const ROADMAP = [
  ['01', 'Clinical OS', 'More specialties, procedural stations, voice-first consults, and cited debriefs.'],
  ['02', 'Immersive apps', 'Native mobile, desktop, AR, and VR releases for repeated training outside the browser.'],
  ['03', 'Compute mesh', 'Opt-in node clients aggregate idle compute for biotech simulations and model evaluation.'],
  ['04', 'Future medical AI', 'Synthetic and consented datasets support safer AI doctor and robotics research workflows.'],
];

function averageScore(history: EvalHistoryEntry[]): string {
  if (!history.length) return '0.0';
  const avg = history.reduce((sum, e) => sum + (VERDICT_SCORE[e.verdict] ?? 0), 0) / history.length;
  return avg.toFixed(1);
}

function latestCaseLabel(history: EvalHistoryEntry[]): string {
  const latest = history[0];
  if (!latest) return 'Start first case';
  return latest.caseName;
}

export function HomeScreen() {
  const [history, setHistory] = useState<EvalHistoryEntry[]>([]);

  useEffect(() => {
    setHistory(listEvalHistory());
  }, []);

  const stats = useMemo(() => {
    const specialtyCount = CLINIC_IDS.filter((id) => id !== 'all-specialties').length;
    return [
      { big: String(CASES.length), label: 'synthetic cases' },
      { big: String(specialtyCount), label: 'specialty tracks' },
      { big: String(history.length), label: 'completed debriefs' },
      { big: averageScore(history), label: 'avg verdict / 5' },
    ];
  }, [history]);

  const recent = history.slice(0, 3);

  return (
    <div className="screen virtion-shell" style={{ overflowY: 'auto' }}>
      <TopBar here={0} steps={['Virtion']} />

      <main style={{ width: 'min(1220px, calc(100vw - 32px))', margin: '0 auto', padding: '38px 0 72px' }}>
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))',
            gap: 24,
            alignItems: 'stretch',
            minHeight: 'calc(100vh - 150px)',
          }}
        >
          <div className="glass-panel scanline" style={{ padding: 'clamp(24px, 4.5vw, 54px)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="chip mint">training simulator · synthetic cases · not clinical advice</div>
            <h1 style={{ fontSize: 'clamp(40px, 6vw, 68px)', lineHeight: 0.98, marginTop: 20 }}>
              A virtual hospital for AI-native medical students.
            </h1>
            <p style={{ margin: '24px 0 0', color: 'var(--ink-2)', fontSize: 19, lineHeight: 1.65, fontWeight: 600, maxWidth: 760 }}>
              Practice with synthetic patients, make decisions in a 3D consultation, and leave with a structured debrief educators can understand.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 34 }}>
              <button type="button" className="btn-plush primary" onClick={() => store.setScreen('mode')}>
                Start training
              </button>
              <button type="button" className="btn-plush ghost" onClick={() => store.setScreen('library')}>
                Browse cases
              </button>
              <button type="button" className="btn-plush ghost" onClick={() => store.setScreen('agentTopology')}>
                Platform topology
              </button>
            </div>
          </div>

          <aside style={{ display: 'grid', gap: 14 }}>
            <ClinicalOrbitVisual compact />
            <div className="glass-panel" style={{ padding: 22 }}>
              <div style={{ color: 'var(--ink-soft)', fontSize: 12, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                live product surface
              </div>
              <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {stats.map((s) => (
                  <div key={s.label} style={{ padding: 16, borderRadius: 10, background: 'rgba(255,255,255,0.58)', border: '1px solid var(--line)' }}>
                    <div style={{ fontFamily: 'Sora', fontSize: 32, fontWeight: 800, color: 'var(--peach-deep)' }}>{s.big}</div>
                    <div style={{ color: 'var(--ink-soft)', fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: 22 }}>
              <div className="chip sky">next action</div>
              <h2 style={{ fontSize: 26, marginTop: 12 }}>{latestCaseLabel(history)}</h2>
              <p style={{ color: 'var(--ink-2)', fontWeight: 600, lineHeight: 1.5, margin: '10px 0 18px' }}>
                Pick up the loop: select a case, enter the room, make decisions, and let the debrief show the gaps.
              </p>
              <button type="button" className="btn-plush mint" onClick={() => store.setScreen('mode')}>
                Enter clinic
              </button>
            </div>

            <div className="glass-panel" style={{ padding: 22 }}>
              <div className="chip rose">safety posture</div>
              <p style={{ color: 'var(--ink-2)', fontWeight: 650, lineHeight: 1.55, margin: '12px 0 0' }}>
                Virtion does not provide clinical advice. Demo cases are synthetic. Future patient data and robotics work belongs behind explicit consent, governance, and clinical validation.
              </p>
            </div>
          </aside>
        </section>

        <section style={{ marginTop: 26, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 14 }}>
          {PRODUCT_PILLARS.map((pillar, i) => (
            <article
              key={pillar.title}
              className="glass-panel popin"
              style={{ padding: 20, animationDelay: `${i * 0.045}s` }}
            >
              <div className="chip mint">{pillar.tag}</div>
              <h2 style={{ fontSize: 22, lineHeight: 1.16, marginTop: 14 }}>{pillar.title}</h2>
              <p style={{ color: 'var(--ink-2)', lineHeight: 1.55, fontWeight: 600, margin: '12px 0 0' }}>{pillar.body}</p>
            </article>
          ))}
        </section>

        <section style={{ marginTop: 26, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: 18 }}>
          <div className="glass-panel" style={{ padding: 24 }}>
            <div className="chip sky">roadmap</div>
            <h2 style={{ fontSize: 34, lineHeight: 1.08, marginTop: 14 }}>From game loop to biotech network.</h2>
            <p style={{ color: 'var(--ink-2)', lineHeight: 1.6, fontWeight: 600, marginTop: 14 }}>
              The browser clinic remains the wedge: free, useful training for students. The long-term platform expands into apps, compute nodes, synthetic data generation, and carefully governed future clinical AI research.
            </p>
          </div>
          <div className="glass-panel" style={{ padding: 18, display: 'grid', gap: 10 }}>
            {ROADMAP.map(([num, title, body]) => (
              <div key={num} style={{ display: 'grid', gridTemplateColumns: '54px 1fr', gap: 12, padding: 14, borderRadius: 10, background: 'rgba(255,255,255,0.58)', border: '1px solid var(--line)' }}>
                <div style={{ fontFamily: 'Sora', color: 'var(--mint)', fontWeight: 800 }}>{num}</div>
                <div>
                  <div style={{ fontWeight: 850 }}>{title}</div>
                  <div style={{ color: 'var(--ink-soft)', marginTop: 4, lineHeight: 1.45, fontWeight: 600 }}>{body}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 26, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: 18 }}>
          <div className="glass-panel" style={{ padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
              <div>
                <div className="chip butter">recent debriefs</div>
                <h2 style={{ fontSize: 28, marginTop: 12 }}>Training record</h2>
              </div>
              <button type="button" className="btn-plush ghost" onClick={() => store.setScreen('history')}>
                History
              </button>
            </div>
            <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
              {(recent.length ? recent : [{ id: 'empty', caseName: 'No completed cases yet', verdict: 'satisfactory' as const, savedAt: Date.now() } as EvalHistoryEntry]).map((entry) => (
                <div key={entry.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center', padding: 14, borderRadius: 10, background: 'rgba(255,255,255,0.58)', border: '1px solid var(--line)' }}>
                  <div>
                    <div style={{ fontWeight: 850 }}>{entry.caseName}</div>
                    <div style={{ color: 'var(--ink-soft)', fontSize: 12, fontWeight: 700, marginTop: 2 }}>
                      {new Date(entry.savedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  <span className="chip mint">{entry.verdict}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: 22 }}>
            <div className="chip mint">funding narrative</div>
            <h2 style={{ fontSize: 28, lineHeight: 1.12, marginTop: 12 }}>Education wedge. Research-scale upside.</h2>
            <p style={{ color: 'var(--ink-2)', lineHeight: 1.6, fontWeight: 600, marginTop: 12 }}>
              Virtion can start as a free learning game for young clinicians while building the platform rails for consent-first datasets, simulation infrastructure, and distributed biomedical compute.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
