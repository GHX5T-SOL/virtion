import { useEffect, useRef, useState } from 'react';
import { Html } from '@react-three/drei';
import type { ActivePatient } from '../../game/types';
import type { ConversationStatus, SubtitleEvent } from '../../voice/conversation';
import { getOrCreatePatientConversation } from '../../voice/conversationStore';

interface Props {
  bedPosition: [number, number, number];
  /** Bed rotation around Y (radians). Service-room beds are -PI/2, triage is 0. */
  bedRotationY?: number;
  /** Mouth offset in the bed's LOCAL frame (x along the bed, y up, z across).
   *  Default: lying-on-bed head position (-0.88, 1.0, 0). Polyclinic passes
   *  a seated-patient offset since the patient sits in a chair. */
  headOffset?: [number, number, number];
  patient: ActivePatient;
  onClose: () => void;
}

export function FloatingVoicePanel({
  bedPosition,
  bedRotationY = 0,
  headOffset,
  patient,
}: Props) {
  const [status, setStatus] = useState<ConversationStatus>('uninitialized');
  const [subtitle, setSubtitle] = useState<SubtitleEvent>({ who: 'patient', text: '…' });
  const [error, setError] = useState('');
  const [voiceReady, setVoiceReady] = useState(false);
  const [voiceStarting, setVoiceStarting] = useState(false);
  const [progress, setProgress] = useState('');

  // Stable listener object — built ONCE per mount.
  const listenersRef = useRef<{
    onStatus: (s: ConversationStatus) => void;
    onProgress: (m: string) => void;
    onSubtitle: (sub: SubtitleEvent) => void;
    onError: (e: string) => void;
  } | null>(null);
  if (listenersRef.current === null) {
    listenersRef.current = {
      onStatus: (s) => setStatus(s),
      onProgress: (m) => setProgress(m),
      // Only the patient's voice goes into the speech bubble above their
      // head — the doctor's transcript stays in the chat panel.
      onSubtitle: (sub) => { if (sub.who === 'patient') setSubtitle(sub); },
      onError: (e) => setError(e),
    };
  }
  const listeners = listenersRef.current;

  // Auto-start when the panel mounts. We do NOT dispose on unmount — the
  // panel can be transiently hidden (e.g. when an exam modal opens) without
  // killing the conversation. The parent owns the conversation lifecycle:
  // T-toggle-off and patient-leaves both call disposePatientConversation
  // explicitly.
  //
  // We key on `patient.case.id` (not just bedIndex) so that swapping the
  // active patient — they all share the polyclinic sentinel bedIndex — also
  // re-runs init(): the cached conv has been disposed by the parent before
  // this re-render, so getOrCreatePatientConversation builds a fresh one
  // and we trigger its greeting.
  useEffect(() => {
    let cancelled = false;
    // Reset visible chrome so the previous patient's last-spoken bubble
    // doesn't bleed into the new patient's encounter.
    setStatus('uninitialized');
    setSubtitle({ who: 'patient', text: '…' });
    setVoiceReady(false);
    setVoiceStarting(false);
    setError('');

    const conv = getOrCreatePatientConversation(patient.bedIndex, patient.case, listeners);
    const current = conv.getStatus();
    if (current !== 'uninitialized') {
      setVoiceReady(current !== 'error');
      setStatus(current);
    } else {
      setVoiceStarting(true);
      conv
        .init()
        .then(() => { if (!cancelled) setVoiceReady(true); })
        .catch(() => { /* onError set */ })
        .finally(() => { if (!cancelled) setVoiceStarting(false); });
    }
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient.bedIndex, patient.case.id]);

  const firstName = patient.case.name.split(' ')[0];
  const statusLabel =
    error || status === 'error' ? 'TEXT FALLBACK' :
    status === 'listening' ? 'LISTENING…' :
    status === 'thinking' ? 'THINKING…' :
    status === 'speaking' ? `${firstName.toUpperCase()} SPEAKING` :
    status === 'loading' ? 'CONNECTING…' :
    voiceReady ? 'LIVE' :
    voiceStarting ? 'CONNECTING…' : 'OFFLINE';

  const idleHint =
    error || status === 'error' ? 'Voice unavailable. Open the clinical workspace and use Chat.' :
    status === 'speaking' ? `${firstName} is speaking…` :
    status === 'thinking' ? `${firstName} is thinking…` :
    status === 'listening' ? 'Listening — go ahead.' :
    voiceStarting ? (progress || 'Connecting…') :
    voiceReady ? 'Just talk — real-time. Press T to end.' :
    'Connecting…';

  const live = voiceReady && (status === 'listening' || status === 'speaking' || status === 'thinking' || status === 'ready');
  const statusColor =
    error || status === 'error' ? 'var(--butter-deep)' :
    status === 'speaking' ? 'var(--peach-deep)' :
    status === 'listening' ? 'var(--mint-deep)' :
    status === 'thinking' ? 'var(--butter-deep)' :
    live ? 'var(--mint-deep)' : 'var(--ink-soft)';

  const [ox, oy, oz] = headOffset ?? [-0.88, 1.0, 0];
  const cos = Math.cos(bedRotationY);
  const sin = Math.sin(bedRotationY);
  const mouthX = bedPosition[0] + ox * cos + oz * sin;
  const mouthY = oy;
  const mouthZ = bedPosition[2] - ox * sin + oz * cos;

  return (
    <Html
      position={[mouthX, mouthY, mouthZ]}
      zIndexRange={[100, 0]}
      style={{ pointerEvents: 'auto', userSelect: 'none', transform: 'translate(-50%, -110%)' }}
    >
      <div
        style={{
          position: 'relative',
          minWidth: 240,
          maxWidth: 320,
          background: 'rgba(255,255,255,0.88)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--r-md)',
          boxShadow: 'var(--plush-sm)',
          padding: '10px 14px 12px',
          fontFamily: 'Inter, system-ui, sans-serif',
          color: 'var(--ink)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 8,
            marginBottom: 6,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: 0 }}>
            {patient.case.name}
            <span style={{ fontSize: 11, color: 'var(--ink-soft)', marginLeft: 6, fontWeight: 700 }}>
              {patient.case.age}{patient.case.gender}
            </span>
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 10,
              letterSpacing: '0.12em',
              color: statusColor,
              textTransform: 'uppercase',
              fontWeight: 900,
              whiteSpace: 'nowrap',
              padding: '3px 8px',
              borderRadius: 'var(--r-pill)',
              background: 'rgba(255,255,255,0.70)',
              border: '1px solid var(--line)',
            }}
          >
            <span
              className={live ? 'breathe' : undefined}
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: statusColor,
                display: 'inline-block',
              }}
            />
            {statusLabel}
          </div>
        </div>

        <div style={{ fontStyle: 'italic', fontSize: 13, lineHeight: 1.4, color: 'var(--ink)', fontWeight: 600 }}>
          {subtitle.text && subtitle.text !== '…' ? (
            <span>&ldquo;{subtitle.text}&rdquo;</span>
          ) : (
            <span style={{ color: 'var(--ink-soft)', fontStyle: 'normal', fontSize: 12, fontWeight: 700 }}>
              {idleHint}
            </span>
          )}
        </div>

        {error && (
          <div
            style={{
              marginTop: 8,
              padding: '6px 10px',
              background: 'rgba(255,209,102,0.14)',
              border: '1px solid rgba(255,209,102,0.32)',
              borderRadius: 10,
              boxShadow: 'none',
              fontSize: 11,
              fontWeight: 800,
              color: 'var(--ink)',
            }}
          >
            {error} · text chat remains available
          </div>
        )}

        {/* Speech-bubble tail — outline + fill stack matches the cozy SpeechBubble. */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: -12,
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '12px solid transparent',
            borderRight: '12px solid transparent',
            borderTop: '12px solid var(--line)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: -8,
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '9px solid transparent',
            borderRight: '9px solid transparent',
            borderTop: '9px solid rgba(255,255,255,0.88)',
          }}
        />
      </div>
    </Html>
  );
}
