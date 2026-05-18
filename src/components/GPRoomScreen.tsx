import { useMemo } from 'react';
import { TopBar } from './primitives';
import { CASES, getCase } from '../data/cases';
import { CLINIC_IDS, CLINIC_LABELS, type ClinicId } from '../game/clinic';
import { store, useGameState } from '../game/store';

const CLINIC_ICON: Record<ClinicId, string> = {
  'all-specialties': 'ALL',
  'internal-medicine': 'IM',
  cardiology: 'CV',
  neurology: 'NEU',
  neurosurgery: 'NS',
  dermatology: 'DERM',
  endocrinology: 'ENDO',
  gastroenterology: 'GI',
  pulmonology: 'PULM',
  nephrology: 'REN',
  rheumatology: 'RHE',
  hematology: 'HEME',
  oncology: 'ONC',
  'infectious-disease': 'ID',
  'allergy-immunology': 'AI',
  psychiatry: 'PSY',
  obgyn: 'OB',
  urology: 'URO',
  ophthalmology: 'OPH',
  ent: 'ENT',
  orthopedics: 'ORTH',
  pmr: 'PMR',
  pediatrics: 'PEDS',
  'general-surgery': 'GS',
  'cardiothoracic-vascular-surgery': 'CTS',
};

function ChartAvatar({ name, cond }: { name: string; cond: string }) {
  const initials = name.split(' ').map((part) => part[0]).slice(0, 2).join('');
  return (
    <div className="fizer-chart-avatar">
      <strong>{initials}</strong>
      <span
        style={{
          position: 'absolute',
          right: 6,
          bottom: 6,
          width: 22,
          height: 22,
          borderRadius: 6,
          display: 'grid',
          placeItems: 'center',
          background: cond.toLowerCase().includes('red') ? 'var(--rose)' : 'var(--mint)',
          color: 'var(--fizer-navy)',
          fontSize: 10,
          fontWeight: 900,
          border: '1px solid rgba(6,20,49,0.12)',
        }}
      >
        {cond.slice(0, 2).toUpperCase()}
      </span>
    </div>
  );
}

export function GPRoomScreen() {
  const state = useGameState();
  const activeClinic = state.polyclinic.clinic;

  const clinicCases = useMemo(() => {
    if (activeClinic === 'all-specialties') return CASES;
    return CASES.filter((c) => c.clinic === activeClinic);
  }, [activeClinic]);

  const nextId = store.pickNextCaseId() ?? clinicCases[0]?.id ?? CASES[0]?.id;
  const next = nextId ? getCase(nextId) : null;

  const availableClinics = useMemo(() => {
    return CLINIC_IDS.filter(
      (id) => id === 'all-specialties' || CASES.some((c) => c.clinic === id),
    );
  }, []);

  const queuePreview = clinicCases.slice(0, 4);

  return (
    <div className="screen fizer-page" style={{ overflowY: 'auto' }}>
      <TopBar here={1} steps={['Fizer', '3D Clinic']} />

      <main className="fizer-shell" style={{ padding: '34px 0 72px' }}>
        <section style={{ display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 20 }}>
          <div style={{ maxWidth: 760 }}>
            <div className="fizer-kicker">Control room</div>
            <h1 style={{ marginTop: 12, fontSize: 'clamp(38px, 5.6vw, 68px)', lineHeight: 0.98 }}>
              Choose the next consultation.
            </h1>
            <p style={{ color: 'var(--ink-2)', fontWeight: 650, fontSize: 18, lineHeight: 1.55, margin: '16px 0 0' }}>
              Accept the next patient from the active 3D clinic queue, or open the chart browser and pick a specific case.
            </p>
          </div>
          <button type="button" className="fizer-button fizer-button--quiet" onClick={() => store.setScreen('splash')}>
            Home
          </button>
        </section>

        <section className="fizer-control-grid">
          <div className="fizer-panel-dark" style={{ padding: 24, display: 'grid', gap: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <div className="fizer-kicker" style={{ color: '#bff5ff', background: 'rgba(255,255,255,0.07)', borderColor: 'rgba(24,199,232,0.34)' }}>
                  Active queue
                </div>
                <h2 style={{ marginTop: 12, fontSize: 30 }}>{CLINIC_LABELS[activeClinic]}</h2>
              </div>
              <div style={{ color: '#75e7ff', fontFamily: 'Sora', fontSize: 36, fontWeight: 850 }}>
                {clinicCases.length}
              </div>
            </div>

            {next && (
              <div style={{ display: 'grid', gridTemplateColumns: '86px 1fr', gap: 16, alignItems: 'center', padding: 16, border: '1px solid rgba(24,199,232,0.20)', borderRadius: 8, background: 'rgba(255,255,255,0.07)' }}>
                <ChartAvatar name={next.name} cond={next.cond} />
                <div>
                  <div style={{ color: '#a9c6dd', fontSize: 11, fontWeight: 850, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Next patient
                  </div>
                  <h3 style={{ marginTop: 5, fontSize: 24, color: '#fff' }}>{next.name}</h3>
                  <div style={{ marginTop: 4, color: '#b9c9dc', fontWeight: 700 }}>{next.age} · {next.sex} · {next.cond}</div>
                  <p style={{ margin: '10px 0 0', color: '#d8eaff', fontWeight: 650, lineHeight: 1.45 }}>{next.complaint}</p>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="fizer-button fizer-button--primary"
                style={{ flex: '1 1 220px' }}
                onClick={() => next && store.acceptNextPatient()}
                disabled={!next}
              >
                Accept Next Patient
              </button>
              <button type="button" className="fizer-button" style={{ flex: '1 1 180px' }} onClick={() => store.setScreen('library')}>
                Pick from Charts
              </button>
            </div>
          </div>

          <aside className="fizer-panel" style={{ padding: 20, display: 'grid', gap: 18 }}>
            <div>
              <div className="fizer-kicker">Specialty roster</div>
              <p style={{ margin: '10px 0 0', color: 'var(--ink-2)', fontWeight: 650, lineHeight: 1.45 }}>
                This controls the next-patient queue. The 3D clinic opens directly after accepting.
              </p>
            </div>
            <div className="fizer-specialty-grid">
              {availableClinics.map((id) => (
                <button
                  key={id}
                  type="button"
                  className={`fizer-specialty-chip ${activeClinic === id ? 'active' : ''}`}
                  onClick={() => store.setPolyclinicClinic(id)}
                >
                  <span style={{ display: 'block', color: activeClinic === id ? 'var(--fizer-blue)' : 'var(--ink-soft)', fontSize: 11, letterSpacing: '0.08em' }}>
                    {CLINIC_ICON[id]}
                  </span>
                  {CLINIC_LABELS[id]}
                </button>
              ))}
            </div>
          </aside>
        </section>

        <section className="fizer-panel" style={{ marginTop: 18, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', marginBottom: 12 }}>
            <div>
              <div className="fizer-kicker">Queue preview</div>
              <h2 style={{ marginTop: 8, fontSize: 24 }}>Upcoming charts</h2>
            </div>
            <button type="button" className="fizer-button fizer-button--quiet" onClick={() => store.setScreen('library')}>
              Open Full Chart Browser
            </button>
          </div>
          <div className="fizer-case-grid">
            {queuePreview.map((c) => (
              <button key={c.id} type="button" className="fizer-case-card" onClick={() => store.selectCase(c.id)}>
                <div style={{ display: 'grid', gridTemplateColumns: '74px 1fr', gap: 12, alignItems: 'center' }}>
                  <ChartAvatar name={c.name} cond={c.cond} />
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 16 }}>{c.name}</div>
                    <div style={{ color: 'var(--ink-soft)', fontSize: 12, fontWeight: 800, marginTop: 3 }}>{c.age} · {c.sex} · {c.cond}</div>
                    <div style={{ color: 'var(--ink-2)', fontSize: 13, fontWeight: 650, lineHeight: 1.35, marginTop: 8 }}>{c.complaint}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
