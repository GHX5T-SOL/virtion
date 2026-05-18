import { useMemo, useState } from 'react';
import { TopBar } from './primitives';
import { CASES, type Case } from '../data/cases';
import { CLINIC_IDS, CLINIC_LABELS, type ClinicId } from '../game/clinic';
import { store } from '../game/store';

type ClinicFilter = ClinicId | 'all' | 'red-flag';

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

function ChartAvatar({ c }: { c: Case }) {
  const initials = c.name.split(' ').map((part) => part[0]).slice(0, 2).join('');
  const urgent = c.tags.some((t) => t.toLowerCase().includes('red flag')) || c.cond.toLowerCase().includes('red');
  return (
    <div className="fizer-chart-avatar">
      <strong>{initials}</strong>
      <span
        style={{
          position: 'absolute',
          left: 7,
          top: 7,
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: urgent ? 'var(--rose-deep)' : 'var(--mint-deep)',
          boxShadow: urgent ? '0 0 0 5px rgba(198,56,92,0.12)' : '0 0 0 5px rgba(26,159,123,0.12)',
        }}
      />
    </div>
  );
}

function CaseCard({ c }: { c: Case }) {
  const urgent = c.tags.some((t) => t.toLowerCase().includes('red flag')) || c.cond.toLowerCase().includes('red');
  return (
    <button type="button" className="fizer-case-card" onClick={() => store.selectCase(c.id)}>
      <div style={{ display: 'grid', gridTemplateColumns: '74px 1fr', gap: 12, alignItems: 'start' }}>
        <ChartAvatar c={c} />
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ fontSize: 17, lineHeight: 1.15 }}>{c.name}</h3>
              <div style={{ color: 'var(--ink-soft)', fontSize: 12, fontWeight: 850, marginTop: 4 }}>
                {c.age} · {c.sex} · {c.cond}
              </div>
            </div>
            <span className={`chip ${urgent ? 'rose' : 'mint'}`} style={{ fontSize: 10, padding: '3px 7px' }}>
              {urgent ? 'Priority' : 'Stable'}
            </span>
          </div>
          <p style={{ color: 'var(--ink-2)', fontSize: 13, fontWeight: 650, lineHeight: 1.4, margin: '10px 0 0' }}>
            {c.complaint}
          </p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
            {c.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="chip" style={{ fontSize: 10, padding: '3px 7px' }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </button>
  );
}

export function CaseLibraryScreen() {
  const [filter, setFilter] = useState<ClinicFilter>('all');

  const grouped = useMemo(() => {
    const map = new Map<ClinicId, Case[]>();
    for (const id of CLINIC_IDS) {
      if (id === 'all-specialties') continue;
      map.set(id, []);
    }
    for (const c of CASES) {
      const list = map.get(c.clinic);
      if (list) list.push(c);
    }
    return map;
  }, []);

  const visibleGroups = useMemo<Array<[ClinicId, Case[]]>>(() => {
    if (filter === 'red-flag') {
      const out: Array<[ClinicId, Case[]]> = [];
      for (const [clinic, list] of grouped) {
        const red = list.filter((c) => c.tags.some((t) => t.toLowerCase().includes('red flag')));
        if (red.length) out.push([clinic, red]);
      }
      return out;
    }
    if (filter === 'all') {
      return Array.from(grouped.entries()).filter(([, list]) => list.length > 0);
    }
    const list = grouped.get(filter as ClinicId) ?? [];
    return list.length ? [[filter as ClinicId, list]] : [];
  }, [filter, grouped]);

  const totalVisible = visibleGroups.reduce((n, [, list]) => n + list.length, 0);
  const clinicChips: Array<{ id: ClinicFilter; label: string; icon?: string }> = [
    { id: 'all', label: 'All charts', icon: 'ALL' },
    { id: 'red-flag', label: 'Priority', icon: 'RF' },
    ...CLINIC_IDS.filter((id) => id !== 'all-specialties' && (grouped.get(id)?.length ?? 0) > 0).map(
      (id) => ({ id: id as ClinicFilter, label: CLINIC_LABELS[id], icon: CLINIC_ICON[id] }),
    ),
  ];

  const shuffle = () => {
    const pool = visibleGroups.flatMap(([, list]) => list);
    const fallback = pool.length > 0 ? pool : CASES;
    const pick = fallback[Math.floor(Math.random() * fallback.length)];
    store.selectCase(pick.id);
  };

  return (
    <div className="screen fizer-page" style={{ overflowY: 'auto' }}>
      <TopBar here={2} steps={['Fizer', '3D Clinic', 'Charts']} />

      <main className="fizer-shell" style={{ padding: '28px 0 64px' }}>
        <section style={{ display: 'grid', gridTemplateColumns: '250px minmax(0, 1fr)', gap: 18, alignItems: 'start' }} className="fizer-library-layout">
          <aside className="fizer-panel" style={{ padding: 16, position: 'sticky', top: 94 }}>
            <button type="button" className="fizer-button fizer-button--quiet" style={{ width: '100%', marginBottom: 14 }} onClick={() => store.setScreen('gpRoom')}>
              Back to Control Room
            </button>
            <div className="fizer-kicker">Chart filters</div>
            <div style={{ display: 'grid', gap: 7, marginTop: 14 }}>
              {clinicChips.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  className={`fizer-specialty-chip ${filter === chip.id ? 'active' : ''}`}
                  onClick={() => setFilter(chip.id)}
                >
                  <span style={{ display: 'block', color: filter === chip.id ? 'var(--fizer-blue)' : 'var(--ink-soft)', fontSize: 11, letterSpacing: '0.08em' }}>
                    {chip.icon}
                  </span>
                  {chip.label}
                </button>
              ))}
            </div>
          </aside>

          <section style={{ minWidth: 0 }}>
            <div className="fizer-panel" style={{ padding: 22, marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div>
                  <div className="fizer-kicker">Pick from Charts</div>
                  <h1 style={{ marginTop: 10, fontSize: 'clamp(34px, 4.8vw, 56px)', lineHeight: 1 }}>
                    {totalVisible} available patient charts
                  </h1>
                  <p style={{ margin: '12px 0 0', color: 'var(--ink-2)', fontWeight: 650, lineHeight: 1.5 }}>
                    Select any chart to review the brief before entering the 3D clinic.
                  </p>
                </div>
                <button type="button" className="fizer-button fizer-button--primary" onClick={shuffle}>
                  Shuffle Chart
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gap: 18 }}>
              {visibleGroups.map(([clinic, list]) => (
                <section key={clinic} className="fizer-panel" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                    <span className="chip mint">{CLINIC_ICON[clinic] ?? 'CLINIC'}</span>
                    <h2 style={{ fontSize: 24 }}>{CLINIC_LABELS[clinic]}</h2>
                    <span className="chip">{list.length} chart{list.length === 1 ? '' : 's'}</span>
                  </div>
                  <div className="fizer-case-grid">
                    {list.map((c) => (
                      <CaseCard key={c.id} c={c} />
                    ))}
                  </div>
                </section>
              ))}

              {visibleGroups.length === 0 && (
                <div className="fizer-panel" style={{ padding: 24, color: 'var(--ink-2)', fontWeight: 750 }}>
                  No charts match this filter.
                </div>
              )}
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}
