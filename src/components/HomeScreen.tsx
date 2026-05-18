import { useEffect, useMemo, useState } from 'react';
import { TopBar } from './primitives';
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

function averageScore(history: EvalHistoryEntry[]): string {
  if (!history.length) return '0.0';
  const avg = history.reduce((sum, e) => sum + (VERDICT_SCORE[e.verdict] ?? 0), 0) / history.length;
  return avg.toFixed(1);
}

export function HomeScreen() {
  const [history, setHistory] = useState<EvalHistoryEntry[]>([]);

  useEffect(() => {
    setHistory(listEvalHistory());
  }, []);

  const stats = useMemo(() => {
    const specialtyCount = CLINIC_IDS.filter((id) => id !== 'all-specialties').length;
    return [
      { big: String(CASES.length), label: 'synthetic charts' },
      { big: String(specialtyCount), label: 'specialty rosters' },
      { big: String(history.length), label: 'completed debriefs' },
      { big: averageScore(history), label: 'average verdict' },
    ];
  }, [history]);

  return (
    <div className="screen fizer-page" style={{ overflowY: 'auto' }}>
      <TopBar here={0} steps={['Fizer']} />

      <main className="fizer-shell" style={{ padding: '42px 0 72px' }}>
        <section className="fizer-control-grid">
          <div className="fizer-panel" style={{ padding: 'clamp(24px, 5vw, 56px)' }}>
            <div className="fizer-kicker">Simulation home</div>
            <h1 style={{ marginTop: 18, fontSize: 'clamp(42px, 6vw, 76px)', lineHeight: 0.96 }}>
              Start with the next patient.
            </h1>
            <p style={{ marginTop: 22, color: 'var(--ink-2)', fontSize: 19, lineHeight: 1.6, fontWeight: 650, maxWidth: 680 }}>
              Enter the Fizer control room, accept a chart, and move straight into the 3D clinic encounter. No module picker, no platform detour.
            </p>
            <div style={{ marginTop: 32, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button type="button" className="fizer-button fizer-button--primary" onClick={() => store.setScreen('gpRoom')}>
                Start Simulation
              </button>
            </div>
          </div>

          <aside className="fizer-panel-dark" style={{ padding: 24, display: 'grid', alignContent: 'space-between', gap: 22 }}>
            <div>
              <div className="fizer-kicker" style={{ color: '#bff5ff', background: 'rgba(255,255,255,0.07)', borderColor: 'rgba(24,199,232,0.30)' }}>
                Training record
              </div>
              <div className="fizer-stat-grid" style={{ marginTop: 18 }}>
                {stats.map((s) => (
                  <div key={s.label} className="fizer-stat" style={{ background: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.12)' }}>
                    <strong style={{ color: '#75e7ff' }}>{s.big}</strong>
                    <span style={{ color: '#a9c6dd' }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
