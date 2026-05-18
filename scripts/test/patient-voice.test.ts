import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPatientVoiceProfile } from '../../src/voice/patientVoice.ts';

test('patient voice profiles are gender-specific across providers', () => {
  const female = buildPatientVoiceProfile('im-004', 'F');
  const male = buildPatientVoiceProfile('im-003', 'M');

  assert.equal(female.gender, 'F');
  assert.equal(male.gender, 'M');
  assert.notEqual(female.cartesiaVoiceId, male.cartesiaVoiceId);
  assert.notEqual(female.elevenlabsVoiceId, male.elevenlabsVoiceId);
  assert.notEqual(female.openaiVoice, male.openaiVoice);
});

test('patient voice profile selection is stable per case', () => {
  assert.deepEqual(
    buildPatientVoiceProfile('card-002', 'F'),
    buildPatientVoiceProfile('card-002', 'F'),
  );
});
