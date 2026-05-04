import { PatientFace, TopBar } from './primitives';
import { getCase } from '../data/cases';
import { store, useStore, useTweaks } from '../game/store';
import type { EndConfirmChecks } from '../game/types';

interface Item {
  id: keyof EndConfirmChecks;
  label: string;
  sub: string;
}

const ITEMS: Item[] = [
  { id: 'sum', label: 'Have you summarised back to the patient?', sub: 'A short read-back of the story.' },
  { id: 'safe', label: 'Have you safety-netted?', sub: 'What to look for, when to come back.' },
  { id: 'ice', label: 'Have you addressed their ideas, concerns, expectations?', sub: 'Did the patient feel heard?' },
];

export function EndConfirmScreen() {
  const tweaks = useTweaks();
  const checked = useStore((s) => s.endConfirm);
  const caseId = useStore((s) => s.selectedCaseId);
  const c = getCase(caseId);

  return (
    <div className="screen virtion-shell" style={{ position: 'relative', overflowY: 'auto' }}>
      <TopBar here={5} steps={['Polyclinic', 'GP', 'Case', 'Brief', 'Encounter', 'Wrap']} />

      <div
        style={{
          minHeight: 'calc(100vh - 62px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'clamp(22px, 5vw, 48px)',
        }}
      >
        <div
          className="glass-panel"
          style={{
            width: 'min(820px, 100%)',
            background: 'rgba(255,255,255,0.84)',
            padding: 'clamp(24px, 4.4vw, 40px)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', right: -18, top: -24, opacity: 0.92 }}>
            <div className="floaty">
              <PatientFace style={tweaks.avatarStyle} skin={c.skin} hair={c.hair} size={110} mood="happy" />
            </div>
          </div>

          <div className="chip butter" style={{ marginBottom: 16 }}>before debrief</div>
          <h1 style={{ fontSize: 'clamp(34px, 5vw, 56px)', lineHeight: 1.02, marginBottom: 10 }}>Wrap the consultation.</h1>
          <div
            style={{
              fontSize: 17,
              color: 'var(--ink-2)',
              fontWeight: 600,
              lineHeight: 1.55,
              marginBottom: 24,
              maxWidth: 560,
            }}
          >
            One last check before the AI attending grades the encounter. Tick only what you actually covered.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
            {ITEMS.map((it) => {
              const on = checked[it.id];
              return (
                <div
                  key={it.id}
                  className="tap"
                  onClick={() => store.toggleEndConfirm(it.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '12px 14px',
                    background: on ? 'var(--mint)' : 'white',
                    border: '1px solid var(--line)',
                    borderRadius: 12,
                    boxShadow: 'var(--plush-tiny)',
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: on ? 'white' : 'var(--cream)',
                      border: '1px solid var(--line)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      fontSize: 18,
                      color: 'var(--mint-deep)',
                    }}
                  >
                    {on ? '✓' : ''}
                  </div>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 15 }}>{it.label}</div>
                    <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--ink-2)' }}>{it.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="button"
              className="btn-plush ghost"
              style={{ flex: 1 }}
              onClick={() => store.setScreen('encounter')}
            >
              Back to room
            </button>
            <button
              type="button"
              className="btn-plush primary"
              style={{ flex: 1.4 }}
              onClick={() => store.setScreen('debrief')}
            >
              End consultation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
