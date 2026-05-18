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
  onStatusChange?: (status: ConversationStatus) => void;
}

export function FloatingVoicePanel({
  bedPosition,
  bedRotationY = 0,
  headOffset,
  patient,
  onStatusChange,
}: Props) {
  const [status, setStatus] = useState<ConversationStatus>('uninitialized');
  const [subtitle, setSubtitle] = useState<SubtitleEvent>({ who: 'patient', text: '…' });
  const [error, setError] = useState('');
  const [voiceReady, setVoiceReady] = useState(false);
  const [voiceStarting, setVoiceStarting] = useState(false);
  const [progress, setProgress] = useState('');
  const onStatusChangeRef = useRef(onStatusChange);

  onStatusChangeRef.current = onStatusChange;

  // Stable listener object — built ONCE per mount.
  const listenersRef = useRef<{
    onStatus: (s: ConversationStatus) => void;
    onProgress: (m: string) => void;
    onSubtitle: (sub: SubtitleEvent) => void;
    onError: (e: string) => void;
  } | null>(null);
  if (listenersRef.current === null) {
    listenersRef.current = {
      onStatus: (s) => {
        setStatus(s);
        onStatusChangeRef.current?.(s);
      },
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
      onStatusChangeRef.current?.(current);
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
    error || status === 'error' ? 'Fallback' :
    status === 'listening' ? 'Listening' :
    status === 'thinking' ? 'Thinking' :
    status === 'speaking' ? 'Speaking' :
    status === 'loading' ? 'Connecting' :
    voiceReady ? 'LIVE' :
    voiceStarting ? 'Connecting' : 'Offline';

  const idleHint =
    error || status === 'error' ? 'Voice offline - use Chat in Examine.' :
    status === 'speaking' ? `${firstName} is speaking…` :
    status === 'thinking' ? `${firstName} is thinking…` :
    status === 'listening' ? 'Listening — go ahead.' :
    voiceStarting ? (progress || 'Connecting…') :
    voiceReady ? 'Just talk — real-time. Press T to end.' :
    'Connecting…';

  const live = voiceReady && (status === 'listening' || status === 'speaking' || status === 'thinking' || status === 'ready');
  const statusColor =
    error || status === 'error' ? '#ffd166' :
    status === 'speaking' ? '#6ee7ff' :
    status === 'listening' ? '#7dffbf' :
    status === 'thinking' ? '#ffd166' :
    live ? '#7dffbf' : '#99b8c8';

  const [ox, oy, oz] = headOffset ?? [-0.88, 1.0, 0];
  const cos = Math.cos(bedRotationY);
  const sin = Math.sin(bedRotationY);
  const mouthX = bedPosition[0] + ox * cos + oz * sin;
  const mouthY = bedPosition[1] + oy;
  const mouthZ = bedPosition[2] - ox * sin + oz * cos;
  const complaint = patient.case.chiefComplaint || patient.case.arrivalBlurb || 'Chest pain';
  const complaintLabel =
    complaint.length > 42
      ? complaint
          .replace(/^I('|’)ve been /i, '')
          .replace(/^I am /i, '')
          .replace(/^I feel /i, '')
          .replace(/\.$/, '')
          .slice(0, 42)
      : complaint;

  return (
    <Html
      position={[mouthX, mouthY, mouthZ]}
      zIndexRange={[24, 0]}
      style={{ pointerEvents: 'auto', userSelect: 'none', transform: 'translate(-50%, -104%)' }}
    >
      <div
        style={{
          position: 'relative',
          width: 230,
          background: 'linear-gradient(135deg, rgba(8, 29, 45, 0.58), rgba(16, 58, 75, 0.34))',
          border: '1px solid rgba(111, 235, 255, 0.55)',
          borderRadius: 14,
          boxShadow: '0 0 24px rgba(74, 231, 255, 0.26), inset 0 1px 0 rgba(255,255,255,0.20)',
          padding: '11px 13px 12px',
          fontFamily: 'Inter, system-ui, sans-serif',
          color: '#f3fdff',
          backdropFilter: 'blur(14px) saturate(1.25)',
          textShadow: '0 1px 10px rgba(0, 0, 0, 0.28)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 5,
            border: '1px solid rgba(122, 239, 255, 0.18)',
            borderRadius: 11,
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 8,
            marginBottom: 7,
          }}
        >
          <div style={{ display: 'grid', gap: 2, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 5,
                  display: 'inline-grid',
                  placeItems: 'center',
                  border: '1px solid rgba(207, 250, 255, 0.44)',
                  background: 'rgba(218, 250, 255, 0.16)',
                  fontSize: 11,
                  fontWeight: 900,
                }}
              >
                {firstName[0]}
              </span>
              <span style={{ fontSize: 17, fontWeight: 850, letterSpacing: 0, lineHeight: 1 }}>
                {patient.case.name}
              </span>
            </div>
            <div style={{ fontSize: 12, color: '#c8eff8', fontWeight: 700 }}>
              {patient.case.age} years  |  {patient.case.gender}  |  {complaintLabel}
            </div>
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 10,
              letterSpacing: 0,
              color: statusColor,
              textTransform: 'none',
              fontWeight: 850,
              whiteSpace: 'nowrap',
              padding: '4px 8px',
              borderRadius: 999,
              background: 'rgba(4, 18, 29, 0.30)',
              border: '1px solid rgba(135, 239, 255, 0.26)',
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

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '18px 1fr',
            alignItems: 'center',
            gap: 8,
            marginTop: 2,
            padding: '8px 9px',
            borderRadius: 10,
            background: 'rgba(4, 18, 29, 0.20)',
            border: '1px solid rgba(135, 239, 255, 0.14)',
            fontStyle: 'italic',
            fontSize: 12,
            lineHeight: 1.35,
            color: '#f3fdff',
            fontWeight: 650,
          }}
        >
          <span
            style={{
              width: 16,
              height: 16,
              borderRadius: 4,
              display: 'inline-block',
              background: 'linear-gradient(180deg, rgba(119,246,255,0.82), rgba(82,199,255,0.34))',
              boxShadow: '0 0 14px rgba(111, 235, 255, 0.38)',
            }}
          />
          {subtitle.text && subtitle.text !== '…' ? (
            <span>&ldquo;{subtitle.text}&rdquo;</span>
          ) : (
            <span style={{ color: '#c8eff8', fontStyle: 'normal', fontSize: 12, fontWeight: 750 }}>
              {idleHint}
            </span>
          )}
        </div>

        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: -10,
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '10px solid transparent',
            borderRight: '10px solid transparent',
            borderTop: '10px solid rgba(111, 235, 255, 0.45)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: -7,
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: '8px solid rgba(14, 47, 65, 0.72)',
          }}
        />
      </div>
    </Html>
  );
}
