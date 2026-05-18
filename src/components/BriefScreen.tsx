import { TopBar } from './primitives';
import { getCase, getPatientCase } from '../data/cases';
import { store, useStore } from '../game/store';

interface VitalCard {
  label: string;
  value: string;
  unit: string;
  tone: string;
}

function buildVitals(p?: { hr: number; bp: string; spo2: number; temp: number; rr: number }): VitalCard[] {
  return [
    { label: 'HR', value: String(p?.hr ?? 88), unit: 'bpm', tone: 'var(--rose)' },
    { label: 'BP', value: p?.bp ?? '120/80', unit: 'mmHg', tone: 'var(--peach)' },
    { label: 'RR', value: String(p?.rr ?? 16), unit: '/min', tone: 'var(--sky)' },
    { label: 'SpO2', value: String(p?.spo2 ?? 98), unit: '%', tone: 'var(--mint)' },
    { label: 'Temp', value: (p?.temp ?? 36.7).toFixed(1), unit: 'C', tone: 'var(--butter)' },
  ];
}

function BriefAvatar({ name, severity }: { name: string; severity?: string }) {
  const initials = name.split(' ').map((part) => part[0]).slice(0, 2).join('');
  return (
    <div className="fizer-chart-avatar" style={{ width: 118, height: 118 }}>
      <strong style={{ fontSize: 34 }}>{initials}</strong>
      <span
        style={{
          position: 'absolute',
          right: 10,
          bottom: 10,
          width: 28,
          height: 28,
          borderRadius: 8,
          display: 'grid',
          placeItems: 'center',
          fontSize: 11,
          fontWeight: 900,
          background: severity === 'urgent' || severity === 'critical' ? 'var(--rose)' : 'var(--mint)',
        }}
      >
        ID
      </span>
    </div>
  );
}

export function BriefScreen() {
  const caseId = useStore((s) => s.selectedCaseId);
  const c = getCase(caseId);
  const patient = getPatientCase(caseId);
  const vitals = buildVitals(patient?.vitals);
  const chiefComplaint = patient?.chiefComplaint ?? c.complaint;
  const arrivalBlurb = patient?.arrivalBlurb ?? 'Looks well. No acute distress.';
  const severity = patient?.severity ?? 'stable';

  return (
    <div className="screen fizer-page" style={{ overflowY: 'auto' }}>
      <TopBar here={3} steps={['Fizer', '3D Clinic', 'Charts', 'Brief']} />

      <main className="fizer-shell" style={{ padding: '32px 0 72px' }}>
        <section className="fizer-control-grid">
          <div className="fizer-panel" style={{ padding: 'clamp(22px, 4vw, 38px)' }}>
            <div className="fizer-kicker">Doorway brief</div>
            <div style={{ display: 'grid', gridTemplateColumns: '118px 1fr', gap: 18, alignItems: 'center', marginTop: 20 }}>
              <BriefAvatar name={c.name} severity={severity} />
              <div>
                <h1 style={{ fontSize: 'clamp(34px, 4.8vw, 56px)', lineHeight: 1 }}>{c.name}</h1>
                <div style={{ marginTop: 8, color: 'var(--ink-soft)', fontWeight: 850 }}>
                  {c.age} y · {c.sex === 'F' ? 'Female' : 'Male'} · {c.cond}
                </div>
                <div className={`chip ${severity === 'critical' ? 'rose' : severity === 'urgent' ? 'peach' : 'mint'}`} style={{ marginTop: 12 }}>
                  {severity}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gap: 12, marginTop: 24 }}>
              <section className="fizer-panel" style={{ padding: 16, boxShadow: 'none' }}>
                <div className="fizer-kicker">Chief complaint</div>
                <p style={{ margin: '10px 0 0', fontSize: 20, lineHeight: 1.4, fontWeight: 750 }}>
                  "{chiefComplaint}"
                </p>
              </section>
              <section className="fizer-panel" style={{ padding: 16, boxShadow: 'none' }}>
                <div className="fizer-kicker">At presentation</div>
                <p style={{ margin: '10px 0 0', color: 'var(--ink-2)', fontSize: 16, lineHeight: 1.55, fontWeight: 650 }}>
                  {arrivalBlurb}
                </p>
              </section>
            </div>
          </div>

          <aside style={{ display: 'grid', gap: 14 }}>
            <div className="fizer-panel-dark" style={{ padding: 20 }}>
              <div className="fizer-kicker" style={{ color: '#bff5ff', background: 'rgba(255,255,255,0.07)', borderColor: 'rgba(24,199,232,0.30)' }}>
                Triage vitals
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(92px, 1fr))', gap: 8, marginTop: 16 }}>
                {vitals.map((v) => (
                  <div key={v.label} style={{ padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.07)' }}>
                    <div style={{ color: '#a9c6dd', fontSize: 11, fontWeight: 850, letterSpacing: '0.08em' }}>{v.label}</div>
                    <strong style={{ display: 'block', marginTop: 5, color: '#fff', fontSize: 21 }}>{v.value}</strong>
                    <span style={{ color: '#75e7ff', fontSize: 11, fontWeight: 800 }}>{v.unit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="fizer-panel" style={{ padding: 20 }}>
              <div className="fizer-kicker">Your task</div>
              <ol style={{ margin: '14px 0 0', paddingLeft: 20, color: 'var(--ink-2)', fontSize: 15, lineHeight: 1.65, fontWeight: 700 }}>
                <li>Take a focused history.</li>
                <li>Examine and order relevant tests.</li>
                <li>Submit a diagnosis and management plan.</li>
              </ol>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="button" className="fizer-button fizer-button--quiet" style={{ flex: '1 1 150px' }} onClick={() => store.setScreen('library')}>
                Back to Charts
              </button>
              <button type="button" className="fizer-button fizer-button--primary" style={{ flex: '2 1 220px' }} onClick={() => store.setScreen('encounter')}>
                Enter 3D Clinic
              </button>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
