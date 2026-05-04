import { useMemo, useState } from 'react';
import { PatientFace, TopBar } from './primitives';
import { CASES, CONDITION_COLORS, type Case } from '../data/cases';
import { CLINIC_IDS, CLINIC_LABELS, type ClinicId } from '../game/clinic';
import { store, useTweaks } from '../game/store';

interface CaseCardProps {
  c: Case;
  delay?: number;
  avatarStyle: ReturnType<typeof useTweaks>['avatarStyle'];
}

function CaseCard({ c, delay = 0, avatarStyle }: CaseCardProps) {
  const bg = CONDITION_COLORS[c.cond] ?? 'var(--butter)';
  return (
    <div
      className="tap popin"
      onClick={() => store.selectCase(c.id)}
      style={{ animationDelay: `${delay}s`, position: 'relative' }}
    >
      <div
        style={{
          position: 'absolute',
          top: -10,
          left: 18,
          zIndex: 2,
          background: bg,
          border: '1px solid var(--line)',
          borderRadius: '8px 8px 0 0',
          padding: '4px 14px',
          fontWeight: 800,
          fontSize: 12,
          boxShadow: 'var(--glow-cyan)',
        }}
      >
        {c.cond}
      </div>

      <div
        className="glass-panel"
        style={{
          padding: 14,
          opacity: c.attempted ? 0.92 : 1,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {c.attempted && c.score && (
          <div
            style={{
              position: 'absolute',
              top: 14,
              right: -28,
              transform: 'rotate(38deg)',
              background: 'var(--mint-deep)',
              color: 'white',
              border: '1px solid var(--line)',
              padding: '2px 36px',
              fontWeight: 900,
              fontSize: 11,
              boxShadow: '0 2px 0 var(--line)',
            }}
          >
            {c.score}
          </div>
        )}

        <div
          style={{
            background: bg,
            borderRadius: 12,
          border: '1px solid rgba(8,32,55,0.10)',
            height: 140,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            marginBottom: 10,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.32) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.28) 1px, transparent 1px)',
              backgroundSize: '22px 22px',
              opacity: 0.35,
            }}
          />
          <div style={{ marginBottom: -8 }} className="floaty">
            <PatientFace
              name={c.name}
              style={avatarStyle}
              skin={c.skin}
              hair={c.hair}
              size={120}
              mood={c.mood}
              accessory={c.accessory}
            />
          </div>
        </div>

        <div style={{ fontWeight: 900, fontSize: 16, lineHeight: 1.15 }}>{c.name}</div>
        <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--ink-2)', marginBottom: 6 }}>
          {c.age} · {c.sex}
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink)', minHeight: 36, lineHeight: 1.3, fontWeight: 600 }}>
          "{c.complaint}"
        </div>

        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
          {c.tags.slice(0, 2).map((t) => (
            <span key={t} className="chip" style={{ fontSize: 11, padding: '3px 9px' }}>
              {t}
            </span>
          ))}
        </div>
        <div style={{ marginTop: 8, fontSize: 11, fontWeight: 800, color: 'var(--ink-2)' }}>GUIDELINE · {c.guideline}</div>
      </div>
    </div>
  );
}

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

export function CaseLibraryScreen() {
  const tweaks = useTweaks();
  const [filter, setFilter] = useState<ClinicFilter>('all');

  // Group every case by its clinic once. The grouping respects
  // CLINIC_IDS order so sections render in the same canonical order.
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

  // Apply the active filter to the grouped data so we can render it as
  // sections without having to re-group inside the JSX.
  const visibleGroups = useMemo<Array<[ClinicId, Case[]]>>(() => {
    if (filter === 'red-flag') {
      const out: Array<[ClinicId, Case[]]> = [];
      for (const [clinic, list] of grouped) {
        const reds = list.filter((c) => c.tags.some((t) => t.toLowerCase().includes('red flag')));
        if (reds.length) out.push([clinic, reds]);
      }
      return out;
    }
    if (filter === 'all') {
      return Array.from(grouped.entries()).filter(([, list]) => list.length > 0);
    }
    const list = grouped.get(filter as ClinicId) ?? [];
    return list.length ? [[filter as ClinicId, list]] : [];
  }, [grouped, filter]);

  const totalVisible = visibleGroups.reduce((n, [, list]) => n + list.length, 0);

  const shuffle = () => {
    const pool = visibleGroups.flatMap(([, list]) => list);
    const fallback = pool.length > 0 ? pool : CASES;
    const pick = fallback[Math.floor(Math.random() * fallback.length)];
    store.selectCase(pick.id);
  };

  const clinicChips: Array<{ id: ClinicFilter; label: string; icon?: string }> = [
    { id: 'all', label: 'All clinics', icon: 'ALL' },
    { id: 'red-flag', label: 'Red-flag only', icon: 'RF' },
    ...CLINIC_IDS.filter((id) => id !== 'all-specialties' && (grouped.get(id)?.length ?? 0) > 0).map(
      (id) => ({ id: id as ClinicFilter, label: CLINIC_LABELS[id], icon: CLINIC_ICON[id] }),
    ),
  ];

  return (
    <div className="screen virtion-shell" style={{ overflowY: 'auto' }}>
      <TopBar here={2} steps={['Polyclinic', 'GP', 'Case']} />

      {/* Header row: back button + title + shuffle */}
      <div
        style={{
          padding: '22px 28px 0',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            type="button"
            className="btn-plush ghost"
            style={{ fontSize: 14, padding: '10px 18px' }}
            onClick={() => store.setScreen('gpRoom')}
            title="Back to the GP room"
          >
            Back
          </button>
          <div>
            <h1 style={{ fontSize: 36, marginBottom: 4 }}>Pick a patient</h1>
            <div style={{ fontWeight: 600, color: 'var(--ink-2)', fontSize: 14 }}>
              Cases are grouped by polyclinic — pick a specialty chip to focus.
            </div>
          </div>
        </div>
        <button
          type="button"
          className="btn-plush mint"
          style={{ fontSize: 16, padding: '12px 22px', whiteSpace: 'nowrap', maxWidth: '100%' }}
          onClick={shuffle}
        >
          Shuffle ({totalVisible})
        </button>
      </div>

      {/* Clinic filter chip row */}
      <div
        style={{
          padding: '18px 28px 6px',
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        {clinicChips.map((chip) => (
          <span
            key={chip.id}
            className={`chip ${filter === chip.id ? 'butter' : ''}`}
            style={{ cursor: 'pointer' }}
            onClick={() => setFilter(chip.id)}
          >
            {chip.icon ? `${chip.icon} ` : ''}
            {chip.label}
          </span>
        ))}
      </div>

      {/* Grouped sections */}
      <div style={{ padding: '18px 28px 28px', display: 'flex', flexDirection: 'column', gap: 28 }}>
        {visibleGroups.map(([clinic, list]) => (
          <section key={clinic}>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 10,
                marginBottom: 14,
                paddingBottom: 8,
                borderBottom: '1px solid var(--line)',
              }}
            >
              <span className="chip mint" style={{ fontSize: 11 }}>{CLINIC_ICON[clinic] ?? 'CLINIC'}</span>
              <h2 style={{ fontSize: 22, margin: 0, letterSpacing: 0 }}>
                {CLINIC_LABELS[clinic]}
              </h2>
              <span className="chip" style={{ fontSize: 11, marginLeft: 6 }}>
                {list.length} case{list.length === 1 ? '' : 's'}
              </span>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
                gap: 18,
              }}
            >
              {list.map((c, i) => (
                <CaseCard key={c.id} c={c} delay={(i % 8) * 0.04} avatarStyle={tweaks.avatarStyle} />
              ))}
            </div>
          </section>
        ))}

        {visibleGroups.length === 0 && (
          <div
            className="plush"
            style={{ padding: 24, textAlign: 'center', color: 'var(--ink-2)', fontWeight: 700 }}
          >
            No cases match this filter — try another chip.
          </div>
        )}
      </div>
    </div>
  );
}
