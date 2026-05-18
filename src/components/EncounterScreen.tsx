import { Component, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { PerspectiveCamera } from 'three';
import {
  Polyclinic,
  POLYCLINIC_COLLIDERS,
  DOCTOR_CHAIR_POS,
  PATIENT_CHAIR_POS,
} from './three/Polyclinic';
import { ZoroV43PolyclinicScene } from './three/ZoroV43PolyclinicScene';
import { Player } from './three/Player';
import { useActiveInteractable, interactionBus } from './three/interactions';
import {
  store,
  useGameState,
  POLYCLINIC_BED_INDEX,
} from '../game/store';
import {
  getExistingConversation,
  disposePatientConversation,
} from '../voice/conversationStore';
import type { ConversationStatus } from '../voice/conversation';
import { TopBar } from './primitives';
import { ExamineOverlay } from './ExamineOverlay';
import { DockedVoicePanel } from './DockedVoicePanel';
import { getCase } from '../data/cases';

function readEncounterCaseParam(): string | null {
  if (typeof window === 'undefined') return null;
  const caseId = new URLSearchParams(window.location.search).get('case');
  if (!caseId) return null;
  try {
    getCase(caseId);
    return caseId;
  } catch {
    return null;
  }
}

/** Adaptive FOV: keeps the horizontal FOV near 82° regardless of viewport
 *  aspect, plus a hold-Z (or scroll wheel) "lean in" zoom. */
function AdaptiveCameraFov() {
  const { camera, size } = useThree();
  const zoomedRef = useRef(false);
  const baseFovRef = useRef(55);
  const targetFovRef = useRef(55);

  useEffect(() => {
    const aspect = size.width / Math.max(1, size.height);
    const targetHFov = (82 * Math.PI) / 180;
    const vFovRad = 2 * Math.atan(Math.tan(targetHFov / 2) / aspect);
    const baseFovDeg = Math.max(42, Math.min(68, (vFovRad * 180) / Math.PI));
    baseFovRef.current = baseFovDeg;
    targetFovRef.current = zoomedRef.current ? baseFovDeg * 0.4 : baseFovDeg;
  }, [size.width, size.height]);

  const zoomLevelRef = useRef(0);
  const applyZoom = () => {
    const z = zoomLevelRef.current;
    const base = baseFovRef.current;
    const min = base * 0.4;
    targetFovRef.current = base + (min - base) * z;
  };
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (!document.pointerLockElement) return;
      e.preventDefault();
      const dir = e.deltaY > 0 ? -1 : 1;
      zoomLevelRef.current = Math.max(0, Math.min(1, zoomLevelRef.current + dir * 0.15));
      zoomedRef.current = zoomLevelRef.current > 0;
      applyZoom();
    };
    const isZoomKey = (e: KeyboardEvent) => e.key === 'z' || e.key === 'Z';
    const onDown = (e: KeyboardEvent) => {
      if (!isZoomKey(e) || !document.pointerLockElement) return;
      zoomLevelRef.current = 1;
      zoomedRef.current = true;
      applyZoom();
    };
    const onUp = (e: KeyboardEvent) => {
      if (!isZoomKey(e)) return;
      zoomLevelRef.current = 0;
      zoomedRef.current = false;
      applyZoom();
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, []);

  useFrame(() => {
    const cam = camera as PerspectiveCamera;
    if (!cam.isPerspectiveCamera) return;
    const target = targetFovRef.current;
    const diff = target - cam.fov;
    if (Math.abs(diff) < 0.05) {
      if (cam.fov !== target) {
        cam.fov = target;
        cam.updateProjectionMatrix();
      }
      return;
    }
    cam.fov += diff * 0.22;
    cam.updateProjectionMatrix();
  });

  return null;
}

function Loader() {
  return (
    <Html center>
      <div
        style={{
          fontFamily: 'Inter, sans-serif',
          fontWeight: 800,
          color: 'var(--peach-deep)',
          background: 'var(--glass-strong)',
          padding: '8px 14px',
          border: '1px solid var(--line)',
          borderRadius: 'var(--r-pill)',
          boxShadow: 'var(--plush-tiny)',
          fontSize: 13,
          letterSpacing: '0.05em',
        }}
      >
        Loading polyclinic…
      </div>
    </Html>
  );
}

function Crosshair() {
  const active = useActiveInteractable();
  const hot = !!active;
  const size = hot ? 14 : 6;
  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: size,
        height: size,
        marginLeft: -size / 2,
        marginTop: -size / 2,
        borderRadius: '50%',
        background: hot ? 'transparent' : 'rgba(255,248,236,0.85)',
        border: hot ? '2.5px solid var(--peach-deep)' : 'none',
        boxShadow: hot
          ? '0 0 12px rgba(79,227,255,0.55), 0 0 0 1px rgba(255,255,255,0.18)'
          : '0 0 0 1px rgba(255,255,255,0.24)',
        pointerEvents: 'none',
        transition: 'width 0.12s, height 0.12s, margin 0.12s, border 0.12s, box-shadow 0.12s',
      }}
    />
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        background: 'rgba(255,255,255,0.70)',
        padding: '2px 8px',
        borderRadius: 6,
        fontFamily: 'ui-monospace, monospace',
        fontSize: 11,
        border: '1px solid var(--line)',
        boxShadow: 'none',
        margin: '0 2px',
        color: 'var(--ink)',
      }}
    >
      {children}
    </span>
  );
}

function VoiceInputHud({
  voiceActive,
  pointerLocked,
  lookMode = 'pointer-lock',
}: {
  voiceActive: boolean;
  pointerLocked: boolean;
  lookMode?: 'pointer-lock' | 'drag';
}) {
  const statusLabel = voiceActive ? 'Doctor mic ready' : 'Voice muted';
  const patientStatus = voiceActive ? 'Patient: Listening / fallback-safe' : 'Patient: Text fallback ready';
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 18,
        left: 18,
        zIndex: 6,
        width: 268,
        padding: '13px 14px 12px',
        borderRadius: 12,
        border: '1px solid rgba(101, 232, 255, 0.42)',
        background: 'linear-gradient(135deg, rgba(8, 29, 45, 0.68), rgba(20, 62, 82, 0.38))',
        boxShadow: '0 0 34px rgba(0, 199, 255, 0.18), inset 0 1px 0 rgba(255,255,255,0.16)',
        backdropFilter: 'blur(18px) saturate(1.25)',
        color: '#f4fdff',
        fontFamily: 'Inter, system-ui, sans-serif',
        pointerEvents: 'none',
        textShadow: '0 1px 10px rgba(0, 0, 0, 0.28)',
      }}
    >
      <div style={{ position: 'absolute', inset: 5, border: '1px solid rgba(137, 239, 255, 0.14)', borderRadius: 9 }} />
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 850, color: '#aeefff', marginBottom: 5 }}>
            Voice Input
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 750 }}>
            <span
              className={voiceActive ? 'breathe' : undefined}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: voiceActive ? '#7dffbf' : '#9fb4c4',
                boxShadow: voiceActive ? '0 0 13px rgba(125, 255, 191, 0.72)' : 'none',
              }}
            />
            {statusLabel}
          </div>
        </div>
        <div
          style={{
            fontSize: 10,
            fontWeight: 850,
            color: voiceActive ? '#7dffbf' : '#c8d8e2',
            border: '1px solid rgba(137, 239, 255, 0.22)',
            borderRadius: 999,
            padding: '4px 8px',
            background: 'rgba(4, 18, 29, 0.28)',
          }}
        >
          READY
        </div>
      </div>

      <div
        style={{
          position: 'relative',
          height: 38,
          margin: '11px 0 9px',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          borderRadius: 8,
          background: 'rgba(4, 18, 29, 0.22)',
          border: '1px solid rgba(137, 239, 255, 0.12)',
          padding: '5px 8px',
          overflow: 'hidden',
        }}
      >
        {Array.from({ length: 32 }).map((_, i) => (
          <span
            key={`voice-wave-${i}`}
            style={{
              display: 'block',
              width: 2,
              height: voiceActive ? 8 + Math.abs(Math.sin(i * 0.73)) * 24 : 8 + Math.abs(Math.sin(i * 0.46)) * 10,
              borderRadius: 999,
              background: voiceActive ? 'rgba(190, 249, 255, 0.86)' : 'rgba(190, 249, 255, 0.36)',
              boxShadow: voiceActive ? '0 0 8px rgba(111, 235, 255, 0.35)' : 'none',
            }}
          />
        ))}
      </div>

      <div style={{ position: 'relative', display: 'grid', gap: 6, fontSize: 10.5, fontWeight: 720, color: '#cceff7' }}>
        <div>{patientStatus}</div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: '#b4d9e5', flexWrap: 'wrap' }}>
          {pointerLocked ? (
            <>
              <Kbd>E</Kbd> examine <Kbd>T</Kbd> mute <Kbd>Esc</Kbd> release
            </>
          ) : lookMode === 'drag' ? (
            <>
              Drag room to look <Kbd>E</Kbd> examine <Kbd>T</Kbd> voice
            </>
          ) : (
            <>
              Click room to look <Kbd>E</Kbd> examine <Kbd>T</Kbd> voice
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ExamineCallout({ compact = false }: { compact?: boolean }) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: compact ? 'clamp(14px, 2.4vh, 24px)' : 'clamp(34px, 5vh, 58px)',
        left: compact ? 'calc(50% + min(19vw, 310px))' : '50%',
        transform: 'translateX(-50%)',
        zIndex: 5,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        minWidth: compact ? 178 : 204,
        padding: compact ? '6px 12px' : '7px 14px',
        borderRadius: 10,
        border: '1px solid rgba(111, 235, 255, 0.42)',
        background: 'linear-gradient(135deg, rgba(8, 29, 45, 0.50), rgba(33, 83, 102, 0.32))',
        boxShadow: '0 0 28px rgba(0, 199, 255, 0.20), inset 0 1px 0 rgba(255,255,255,0.18)',
        backdropFilter: 'blur(14px) saturate(1.25)',
        color: '#f6fdff',
        fontSize: compact ? 15 : 17,
        fontWeight: 750,
        pointerEvents: 'none',
        textShadow: '0 1px 12px rgba(0, 0, 0, 0.34)',
      }}
    >
      <span>Press</span>
      <span
        style={{
          display: 'inline-grid',
          placeItems: 'center',
          width: compact ? 25 : 29,
          height: compact ? 22 : 24,
          borderRadius: 6,
          background: 'rgba(247, 253, 255, 0.92)',
          color: '#213949',
          fontSize: compact ? 14 : 16,
          fontFamily: 'ui-monospace, monospace',
          fontWeight: 900,
          textShadow: 'none',
        }}
      >
        E
      </span>
      <span>to Examine</span>
    </div>
  );
}

function canCreateWebGLContext(): boolean {
  if (typeof document === 'undefined') return true;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl'),
    );
  } catch {
    return false;
  }
}

class SceneErrorBoundary extends Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    // The fallback keeps the encounter usable on browsers/headless contexts
    // where WebGL cannot be created.
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function SceneFallback({
  patientName,
  onExamine,
}: {
  patientName: string;
  onExamine: () => void;
}) {
  return (
    <div
      className="glass-panel scanline"
      style={{
        height: '100%',
        display: 'grid',
        placeItems: 'center',
        padding: 28,
        background:
          'radial-gradient(circle at 50% 42%, rgba(0,199,255,0.16), transparent 34%), linear-gradient(135deg, rgba(255,255,255,0.94), rgba(234,243,251,0.92))',
      }}
    >
      <div style={{ maxWidth: 620, textAlign: 'center' }}>
        <div className="chip mint">2D continuity mode</div>
        <h2 style={{ fontSize: 42, lineHeight: 1.05, margin: '18px 0 10px' }}>Consultation room degraded gracefully.</h2>
        <p style={{ margin: 0, color: 'var(--ink-2)', fontWeight: 650, lineHeight: 1.6 }}>
          This browser context could not create a WebGL scene. Virtion preserved the patient encounter with the chart, voice/text tools, and dispatch workflow still available for {patientName}.
        </p>
        <button type="button" className="btn-plush primary" style={{ marginTop: 24 }} onClick={onExamine}>
          Open clinical workspace
        </button>
      </div>
    </div>
  );
}

export function EncounterScreen() {
  const state = useGameState();
  const patient = state.polyclinic.patient;

  // Voice is on the moment the encounter mounts — the FloatingVoicePanel
  // calls `getOrCreatePatientConversation()` which kicks off LiveKit
  // connection + mic. We never gate behind a "Begin consultation" button.
  const [voiceActive, setVoiceActive] = useState(true);
  const [conversationStatus, setConversationStatus] = useState<ConversationStatus>('uninitialized');
  const [pointerLocked, setPointerLocked] = useState(false);
  const [examineOpen, setExamineOpen] = useState(false);
  const [webglAvailable] = useState(canCreateWebGLContext);
  const [sceneMode] = useState<'zoro' | 'legacy'>(() => {
    if (typeof window === 'undefined') return 'zoro';
    return new URLSearchParams(window.location.search).get('scene') === 'legacy' ? 'legacy' : 'zoro';
  });

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      (!import.meta.env.DEV && !['localhost', '127.0.0.1'].includes(window.location.hostname))
    ) {
      return undefined;
    }
    const debugWindow = window as unknown as {
      __setEncounterConversationStatus?: (status: ConversationStatus) => void;
    };
    debugWindow.__setEncounterConversationStatus = setConversationStatus;
    return () => {
      delete debugWindow.__setEncounterConversationStatus;
    };
  }, []);

  // If the user navigated straight here without a patient set, drop the
  // current selectedCaseId in. Without this the scene shows an empty room.
  useEffect(() => {
    const targetCaseId = readEncounterCaseParam() ?? state.selectedCaseId;
    if (!patient || patient.case.id !== targetCaseId) store.loadPolyclinicPatient(targetCaseId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Release pointer lock on unmount (e.g. navigating away mid-session).
  useEffect(() => {
    return () => {
      if (document.pointerLockElement) document.exitPointerLock();
    };
  }, []);

  // Track pointer-lock state so the bottom hint can swap copy AND so we
  // can hard-cancel any lock that engages while Examine is open. The
  // examineOpen ref is read inside a stable listener (closing over the
  // value via a ref keeps the listener stable across re-renders).
  const examineOpenRef = useRef(false);
  examineOpenRef.current = examineOpen;
  useEffect(() => {
    const onChange = () => {
      const locked = !!document.pointerLockElement;
      setPointerLocked(locked);
      if (locked && examineOpenRef.current) {
        // Examine owns the screen — never let the 3D controls steal the
        // cursor. Release immediately.
        document.exitPointerLock();
      }
    };
    document.addEventListener('pointerlockchange', onChange);
    return () => document.removeEventListener('pointerlockchange', onChange);
  }, []);

  // When Examine is opened, force-exit any active pointer lock so the
  // modal can't be undermined by a stray scene click.
  useEffect(() => {
    if (!examineOpen) return;
    if (document.pointerLockElement) document.exitPointerLock();
    interactionBus.setActive(null);
  }, [examineOpen]);

  // Global T — toggle voice off / on. Works whether or not pointer-lock
  // is engaged; mirrors the in-scene Player handler that requires lock.
  // T while voice is on disposes the conversation (mic + TTS go quiet).
  // T while voice is off re-enables it — the patient picks back up where
  // they left off because the conversationStore caches by bedIndex.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 't' && e.key !== 'T') return;
      const tgt = e.target as HTMLElement | null;
      if (tgt && (tgt.tagName === 'INPUT' || tgt.tagName === 'TEXTAREA' || tgt.isContentEditable)) return;
      if (examineOpen) return;
      e.preventDefault();
      setVoiceActive((prev) => {
        const next = !prev;
        if (prev && !next) disposePatientConversation(POLYCLINIC_BED_INDEX);
        return next;
      });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [examineOpen]);

  // Global E-to-examine — works whether or not pointer-lock is engaged.
  // The Player.tsx handler requires lock; this one fills the gap so the
  // keyboard shortcut works the same as the on-screen Examine button.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'e' && e.key !== 'E') return;
      // Don't fire while typing into an input/textarea (defensive — there
      // aren't any today, but this guards against future text fields).
      const tgt = e.target as HTMLElement | null;
      if (tgt && (tgt.tagName === 'INPUT' || tgt.tagName === 'TEXTAREA' || tgt.isContentEditable)) return;
      if (examineOpen) return;
      e.preventDefault();
      setExamineOpen(true);
      if (document.pointerLockElement) document.exitPointerLock();
      interactionBus.setActive(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [examineOpen]);

  // Dispose conversation when the patient changes / leaves.
  const currentPatientCaseId = patient?.case.id ?? null;
  useEffect(() => {
    return () => {
      disposePatientConversation(POLYCLINIC_BED_INDEX);
    };
  }, [currentPatientCaseId]);

  // Re-arm the voice panel automatically whenever a fresh patient is
  // loaded (e.g. after End consultation → Next patient flow).
  useEffect(() => {
    if (patient) setVoiceActive(true);
    else setVoiceActive(false);
  }, [currentPatientCaseId, patient]);

  // Look-around is automatic while Examine is closed — PointerLockControls
  // mounts inside Player and engages on canvas click. When Examine opens
  // we tear it down so modal clicks can't bleed into the 3D scene.

  const openExamine = () => {
    if (document.pointerLockElement) document.exitPointerLock();
    interactionBus.setActive(null);
    setExamineOpen(true);
  };

  const handleInteract = (kind: 'desk' | 'bed' | 'triage', bedIndex?: number) => {
    // E (examine) on the patient — open the cozy examine overlay so the
    // doctor can take a history, order tests, read results, and submit a
    // diagnosis. The voice agent keeps running underneath so the patient
    // can still answer questions verbally.
    if (kind === 'bed' && bedIndex === POLYCLINIC_BED_INDEX) {
      openExamine();
    }
  };

  const handleTalk = (bedIndex: number | null) => {
    if (bedIndex === POLYCLINIC_BED_INDEX) {
      setVoiceActive((prev) => {
        const next = !prev;
        if (prev && !next) disposePatientConversation(POLYCLINIC_BED_INDEX);
        return next;
      });
    } else if (bedIndex === null) {
      setVoiceActive((prev) => {
        if (prev) disposePatientConversation(POLYCLINIC_BED_INDEX);
        return false;
      });
    }
  };

  const endConsultation = async () => {
    const conv = getExistingConversation(POLYCLINIC_BED_INDEX);
    if (conv) {
      try {
        await conv.sayFarewell();
      } catch {
        /* network/voice failure — proceed anyway */
      }
    }
    if (document.pointerLockElement) document.exitPointerLock();
    interactionBus.setActive(null);
    store.finishPolyclinicCase();
    disposePatientConversation(POLYCLINIC_BED_INDEX);
    store.setScreen('endConfirm');
  };

  const SEATED_HEIGHT = 1.45;
  const playerSpawn = useMemo<[number, number, number]>(
    () => [DOCTOR_CHAIR_POS[0], SEATED_HEIGHT, DOCTOR_CHAIR_POS[2]],
    [],
  );
  const doctorLookAt = useMemo<[number, number, number]>(
    () => [PATIENT_CHAIR_POS[0], 1.3, PATIENT_CHAIR_POS[2]],
    [],
  );
  const usingZoroScene = sceneMode === 'zoro';

  return (
    <div className="screen virtion-shell" style={{ position: 'relative' }}>
      <TopBar here={4} steps={['Polyclinic', 'GP', 'Case', 'Brief', 'Encounter']} />

      <div
        style={{
          position: 'relative',
          height: 'calc(100vh - 67px)',
          overflow: 'hidden',
          // Hard-block any click bleeding into the 3D scene while the
          // examine modal owns the screen. PointerLockControls is gated
          // behind lookMode AND this — defence in depth.
          pointerEvents: examineOpen ? 'none' : undefined,
        }}
      >
        {webglAvailable ? (
          <SceneErrorBoundary fallback={<SceneFallback patientName={patient?.case.name ?? 'the patient'} onExamine={openExamine} />}>
            <Canvas
              shadows
              camera={{ position: playerSpawn, fov: 55 }}
              style={{ background: 'linear-gradient(#edf8ff, #dfeaf5)' }}
              dpr={usingZoroScene ? [1, 1.5] : undefined}
              gl={usingZoroScene ? { antialias: true, alpha: false, powerPreference: 'high-performance' } : undefined}
            >
              {!usingZoroScene && <AdaptiveCameraFov />}
              <Suspense fallback={<Loader />}>
                {usingZoroScene ? (
                  <ZoroV43PolyclinicScene
                    voiceActive={voiceActive && !examineOpen}
                    onCloseVoice={() => setVoiceActive(false)}
                    conversationStatus={conversationStatus}
                    onVoiceStatusChange={setConversationStatus}
                  />
                ) : (
                  <>
                    <Polyclinic
                      voiceActive={voiceActive && !examineOpen}
                      onCloseVoice={() => setVoiceActive(false)}
                    />
                    <Player
                      spawn={playerSpawn}
                      colliders={POLYCLINIC_COLLIDERS}
                      onInteract={handleInteract}
                      onTalk={handleTalk}
                      height={SEATED_HEIGHT}
                      locked
                      lookAt={doctorLookAt}
                      enableLook={!examineOpen}
                    />
                  </>
                )}
              </Suspense>
            </Canvas>
          </SceneErrorBoundary>
        ) : (
          <SceneFallback patientName={patient?.case.name ?? 'the patient'} onExamine={openExamine} />
        )}

        {pointerLocked && !usingZoroScene && <Crosshair />}
        <ExamineCallout compact={usingZoroScene} />

        {/* Action buttons — always visible, bottom-right */}
        <div
          style={{
            position: 'absolute',
            bottom: 18,
            right: 18,
            zIndex: 6,
            display: 'flex',
            gap: 10,
          }}
        >
          <button
            type="button"
            className="btn-plush ghost"
            onClick={(e) => {
              e.stopPropagation();
              endConsultation();
            }}
            style={{ fontSize: 14, padding: '12px 18px' }}
          >
            End consultation →
          </button>
        </div>

        <VoiceInputHud voiceActive={voiceActive} pointerLocked={pointerLocked} lookMode={usingZoroScene ? 'drag' : 'pointer-lock'} />
      </div>

      {examineOpen && patient && (
        <>
          <DockedVoicePanel
            patientName={patient.case.name}
            patientLabel={`${patient.case.age}${patient.case.gender}`}
          />
          <ExamineOverlay
            onClose={() => setExamineOpen(false)}
            onDispatch={async () => {
              // 1. Close the modal so the patient's farewell bubble is
              //    visible while the audio plays.
              setExamineOpen(false);

              // 2. sayFarewell now polls until the agent's TTS actually
              //    finishes (RPC into voice worker → session.say → wait
              //    for status to leave 'speaking'). No extra padding here.
              const conv = getExistingConversation(POLYCLINIC_BED_INDEX);
              if (conv) {
                try {
                  await conv.sayFarewell();
                } catch {
                  /* network/voice failure — keep going */
                }
              }

              // 3. Tear down THIS patient's conversation + clear the bed.
              if (document.pointerLockElement) document.exitPointerLock();
              interactionBus.setActive(null);
              store.finishPolyclinicCase();
              disposePatientConversation(POLYCLINIC_BED_INDEX);

              // 5. Auto-load the next patient from the active clinic.
              //    FloatingVoicePanel re-keys on patient.case.id and
              //    fires the new patient's greeting automatically.
              const nextId = store.pickNextCaseId();
              if (nextId) {
                store.acceptNextPatient(nextId);
              } else {
                store.setScreen('endConfirm');
              }
            }}
          />
        </>
      )}
    </div>
  );
}
