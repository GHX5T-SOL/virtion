import { useState, useMemo } from 'react';
import { PatientFace, TopBar } from './primitives';
import { CASES, getCase } from '../data/cases';
import { CLINIC_IDS, CLINIC_LABELS, type ClinicId } from '../game/clinic';
import { store, useGameState, useTweaks } from '../game/store';

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

export function GPRoomScreen() {
  const tweaks = useTweaks();
  const state = useGameState();
  const activeClinic = state.polyclinic.clinic;
  const [pickerOpen, setPickerOpen] = useState(false);

  // Cases from the active clinic — that's what "Accept the next patient"
  // will walk through. 'all-specialties' pulls from every roster.
  const clinicCases = useMemo(() => {
    if (activeClinic === 'all-specialties') return CASES;
    return CASES.filter((c) => c.clinic === activeClinic);
  }, [activeClinic]);

  const totalAll = CASES.length;
  const queueAhead = clinicCases.length;
  const nextId = store.pickNextCaseId() ?? clinicCases[0]?.id ?? CASES[0]?.id;
  const next = nextId ? getCase(nextId) : null;

  // Only show clinics that actually have at least one case in the
  // catalogue, plus the synthetic "all" option at the top.
  const availableClinics = useMemo(() => {
    return CLINIC_IDS.filter(
      (id) => id === 'all-specialties' || CASES.some((c) => c.clinic === id),
    );
  }, []);

  return (
    <div className="screen virtion-shell" style={{ position: 'relative', overflowY: 'auto' }}>
      <TopBar here={1} steps={['Polyclinic', 'GP']} />

      <div style={{ padding: '36px 36px 12px', textAlign: 'center' }}>
        <span className="chip mint" style={{ marginBottom: 12 }}>
          POLYCLINIC CONTROL ROOM
        </span>
        <h1 style={{ fontSize: 42, lineHeight: 1.05, marginTop: 12 }}>How would you like to start?</h1>
        <div
          style={{
            fontSize: 16,
            color: 'var(--ink-2)',
            fontWeight: 600,
            marginTop: 8,
            maxWidth: 620,
            margin: '8px auto 0',
          }}
        >
          Pick a polyclinic and the next patient on the bench will walk straight in. Or browse the case folder.
        </div>
      </div>

      {/* Clinic picker — collapsible */}
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '12px 36px 4px' }}>
        <button
          type="button"
          onClick={() => setPickerOpen((v) => !v)}
          className="btn-plush ghost"
          style={{
            width: '100%',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 15,
            fontWeight: 800,
            background: 'rgba(255,255,255,0.08)',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: 'var(--ink-2)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              Specialty
            </span>
            <span>
              {CLINIC_ICON[activeClinic]} {CLINIC_LABELS[activeClinic]}
            </span>
          </span>
          <span style={{ fontWeight: 800, color: 'var(--ink-2)' }}>{pickerOpen ? '▴' : '▾'}</span>
        </button>

        {pickerOpen && (
          <div
            className="plush"
            style={{
              marginTop: 8,
              padding: 12,
              background: 'var(--glass-strong)',
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            {availableClinics.map((id) => {
              const isActive = activeClinic === id;
              return (
                <span
                  key={id}
                  className={`chip ${isActive ? 'butter' : ''}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    store.setPolyclinicClinic(id);
                    setPickerOpen(false);
                  }}
                >
                  {CLINIC_ICON[id]} {CLINIC_LABELS[id]}
                </span>
              );
            })}
          </div>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
          gap: 28,
          padding: '20px 36px 40px',
          maxWidth: 1080,
          margin: '0 auto',
        }}
      >
        {/* LEFT — accept next patient (clinic-aware) */}
        <div
          className={`tap plush-lg popin ${next ? 'breathe' : ''}`}
          onClick={() => next && store.acceptNextPatient()}
          style={{
            background: 'linear-gradient(145deg, rgba(69,240,176,0.2), rgba(79,227,255,0.08))',
            padding: 32,
            position: 'relative',
            transform: 'none',
            animationDelay: '.05s',
            opacity: next ? 1 : 0.55,
            cursor: next ? 'pointer' : 'not-allowed',
          }}
        >
          <div style={{ position: 'absolute', top: -14, left: 24 }} className="chip rose">
            01 · ACCEPT
          </div>
          <div className="floaty" style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <div
              className="plush"
              style={{
                width: 160,
                height: 160,
                background: 'radial-gradient(circle at 50% 36%, rgba(79,227,255,0.22), rgba(7,17,30,0.94))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {next ? (
                <PatientFace
                  style={tweaks.avatarStyle}
                  skin={next.skin}
                  hair={next.hair}
                  size={130}
                  mood={next.mood}
                  accessory={next.accessory}
                />
              ) : (
                <span style={{ fontSize: 42 }}>{CLINIC_ICON[activeClinic]}</span>
              )}
            </div>
          </div>
          <h2 style={{ fontSize: 28, lineHeight: 1.1, textAlign: 'center', marginBottom: 8 }}>
            Accept the next patient
          </h2>
          <div
            style={{
              fontSize: 14,
              color: 'var(--ink-2)',
              fontWeight: 600,
              textAlign: 'center',
              marginBottom: 16,
              minHeight: 42,
            }}
          >
            {next
              ? `${next.name} walks in next — straight into the consultation.`
              : `No cases queued for ${CLINIC_LABELS[activeClinic]} yet.`}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
            {next && (
              <>
                <span className="chip">
                  {next.name.split(' ')[0]} · {next.age}
                </span>
                <span className="chip rose">{next.cond}</span>
              </>
            )}
            <span className="chip butter">
              {CLINIC_ICON[activeClinic]} {queueAhead} in {CLINIC_LABELS[activeClinic]}
            </span>
          </div>
        </div>

        {/* RIGHT — browse charts */}
        <div
          className="tap plush-lg popin"
          onClick={() => store.setScreen('library')}
          style={{
            background: 'linear-gradient(145deg, rgba(122,167,255,0.2), rgba(79,227,255,0.08))',
            padding: 32,
            position: 'relative',
            transform: 'none',
            animationDelay: '.15s',
          }}
        >
          <div style={{ position: 'absolute', top: -14, left: 24 }} className="chip butter">
            02 · BROWSE
          </div>
          <div className="floaty" style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <div
              className="plush"
              style={{
                width: 160,
                height: 160,
                background: 'radial-gradient(circle at 50% 40%, rgba(122,167,255,0.18), rgba(7,17,30,0.96))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ChartFolder />
            </div>
          </div>
          <h2 style={{ fontSize: 28, lineHeight: 1.1, textAlign: 'center', marginBottom: 8 }}>
            Pick from the charts
          </h2>
          <div
            style={{
              fontSize: 14,
              color: 'var(--ink-2)',
              fontWeight: 600,
              textAlign: 'center',
              marginBottom: 16,
              minHeight: 42,
            }}
          >
            Open the case folder, filter by specialty or red-flag, attempted ribbons on completed.
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span className="chip">
              {totalAll} case files
            </span>
            <span className="chip butter">filterable</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 36 }}>
        <button
          type="button"
          className="btn-plush ghost"
          style={{ fontSize: 14, padding: '10px 18px' }}
          onClick={() => store.setScreen('mode')}
        >
          Back to corridor
        </button>
      </div>
    </div>
  );
}

function ChartFolder() {
  const stroke = 'var(--line)';
  return (
    <svg width="120" height="120" viewBox="0 0 120 120">
      <rect x="18" y="18" width="84" height="84" rx="18" fill="rgba(255,255,255,0.06)" stroke={stroke} strokeWidth="2" />
      <path d="M34 42h52M34 58h38M34 74h48" stroke="var(--peach-deep)" strokeWidth="4" strokeLinecap="round" />
      <circle cx="86" cy="78" r="12" fill="rgba(69,240,176,0.18)" stroke="var(--mint)" strokeWidth="3" />
      <path d="M80 78h12M86 72v12" stroke="var(--mint)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
