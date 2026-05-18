export interface PatientVoiceProfile {
  gender: 'M' | 'F';
  cartesiaVoiceId: string;
  elevenlabsVoiceId: string;
  openaiVoice: string;
}

const CARTESIA_VOICE_IDS: Record<'M' | 'F', string[]> = {
  M: [
    'd709a7e8-9495-4247-aef0-01b3207d11bf',
    'ea7c252f-6cb1-45f5-8be9-b4f6ac282242',
  ],
  F: [
    'cec7cae1-ac8b-4a59-9eac-ec48366f37ae',
    'ea93f57f-7c71-4d79-aeaa-0a39b150f6ca',
  ],
};

const ELEVENLABS_VOICE_IDS: Record<'M' | 'F', string> = {
  M: 'pNInz6obpgDQGcFmaJgB',
  F: 'EXAVITQu4vr4xnSDxMaL',
};

const OPENAI_VOICES: Record<'M' | 'F', string> = {
  M: 'ash',
  F: 'shimmer',
};

function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function buildPatientVoiceProfile(caseId: string, gender: 'M' | 'F'): PatientVoiceProfile {
  const pool = CARTESIA_VOICE_IDS[gender];
  return {
    gender,
    cartesiaVoiceId: pool[hashString(caseId) % pool.length],
    elevenlabsVoiceId: ELEVENLABS_VOICE_IDS[gender],
    openaiVoice: OPENAI_VOICES[gender],
  };
}
