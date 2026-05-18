import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { POLYCLINIC_CASES } from '../../src/data/polyclinicPatients.ts';
import { buildPatientIdentityLedger } from '../../src/data/patientIdentities.ts';
import {
  ACTIVE_PATIENT_AVATAR_MODELS,
  MPHO_MIXAMO_PATIENT_MODEL,
  RPM_PATIENT_ANIMATION_CLIPS,
  pickMedicalSuitePatientModel,
} from '../../src/data/medicalSuiteModelRegistry.ts';

type Violation = { case: string; rule: string; detail: string };

const repoRoot = resolve(import.meta.dirname, '../..');

type PatientSeed = { id: string; gender: 'M' | 'F' };

function collectUniquePolyclinicSeeds(): PatientSeed[] {
  const seen = new Set<string>();
  const seeds: PatientSeed[] = [];
  for (const [clinic, list] of Object.entries(POLYCLINIC_CASES)) {
    if (clinic === 'all-specialties') continue;
    for (const patient of list) {
      if (seen.has(patient.id)) continue;
      seen.add(patient.id);
      seeds.push({ id: patient.id, gender: patient.gender });
    }
  }
  return seeds;
}

function runtimePathExists(path: string): boolean {
  return existsSync(resolve(repoRoot, `public${path}`));
}

function isGlb(path: string): boolean {
  const file = resolve(repoRoot, `public${path}`);
  if (!existsSync(file)) return false;
  const header = readFileSync(file).subarray(0, 4).toString('utf8');
  return header === 'glTF';
}

export function verifyPatientIdentities(): Violation[] {
  const violations: Violation[] = [];
  const avatarById = new Map(ACTIVE_PATIENT_AVATAR_MODELS.map((avatar) => [avatar.id, avatar]));
  const displayNames = new Map<string, string>();
  const cases = collectUniquePolyclinicSeeds();
  const identities = buildPatientIdentityLedger(cases);

  if (identities.size !== cases.length) {
    violations.push({
      case: 'catalogue',
      rule: 'identity count mismatch',
      detail: `${identities.size} identities for ${cases.length} unique display cases`,
    });
  }

  for (const c of cases) {
    const identity = identities.get(c.id);
    if (!identity) {
      violations.push({ case: c.id, rule: 'missing identity', detail: 'no PatientIdentity entry' });
      continue;
    }
    if (!identity.displayName.trim()) {
      violations.push({ case: c.id, rule: 'empty displayName', detail: identity.displayName });
    }
    if (identity.gender !== c.gender) {
      violations.push({ case: c.id, rule: 'identity gender mismatch', detail: `${identity.gender} vs ${c.gender}` });
    }
    const duplicateKey = identity.displayName.toLowerCase();
    const existing = displayNames.get(duplicateKey);
    if (existing && existing !== c.id) {
      violations.push({ case: c.id, rule: 'duplicate displayName', detail: `${identity.displayName} also used by ${existing}` });
    }
    displayNames.set(duplicateKey, c.id);
    const avatar = avatarById.get(identity.avatarId);
    if (!avatar) {
      violations.push({ case: c.id, rule: 'unknown avatarId', detail: identity.avatarId });
      continue;
    }
    if (avatar.gender !== identity.gender) {
      violations.push({ case: c.id, rule: 'avatar gender mismatch', detail: `${avatar.id} is ${avatar.gender}` });
    }
    if (avatar.avatarRace && avatar.id !== MPHO_MIXAMO_PATIENT_MODEL.id && avatar.avatarRace !== identity.avatarRace) {
      violations.push({ case: c.id, rule: 'avatar race mismatch', detail: `${avatar.id} is ${avatar.avatarRace}; identity expects ${identity.avatarRace}` });
    }
    if (!runtimePathExists(avatar.path)) {
      violations.push({ case: c.id, rule: 'avatar runtime file missing', detail: avatar.path });
    } else if (!isGlb(avatar.path)) {
      violations.push({ case: c.id, rule: 'avatar file is not GLB', detail: avatar.path });
    }
    const picked = pickMedicalSuitePatientModel(c.id, c.gender, identity.avatarRace);
    if (picked.id !== identity.avatarId) {
      violations.push({ case: c.id, rule: 'avatar resolver mismatch', detail: `${identity.avatarId} vs ${picked.id}` });
    }
  }

  for (const [clinic, list] of Object.entries(POLYCLINIC_CASES)) {
    for (const patient of list) {
      if (!identities.get(patient.id)) {
        violations.push({ case: patient.id, rule: 'roster entry missing identity', detail: clinic });
      }
    }
  }

  for (const [gender, clips] of Object.entries(RPM_PATIENT_ANIMATION_CLIPS)) {
    for (const [state, path] of Object.entries(clips)) {
      if (!runtimePathExists(path)) {
        violations.push({ case: `animation:${gender}`, rule: `${state} clip missing`, detail: path });
      } else if (!isGlb(path)) {
        violations.push({ case: `animation:${gender}`, rule: `${state} clip is not GLB`, detail: path });
      }
    }
  }

  const sceneSource = readFileSync(resolve(repoRoot, 'src/components/three/ZoroV43PolyclinicScene.tsx'), 'utf8');
  if (sceneSource.includes("pickMedicalSuitePatientModel('im-001')")) {
    violations.push({
      case: 'ZoroPatientActor',
      rule: 'hard-coded patient model',
      detail: "pickMedicalSuitePatientModel('im-001') still present",
    });
  }

  const caseSource = readFileSync(resolve(repoRoot, 'src/data/cases.ts'), 'utf8');
  if (!caseSource.includes('name: identity?.displayName ?? p.name')) {
    violations.push({
      case: 'cases.ts',
      rule: 'Case display name overlay missing',
      detail: 'toCase() should prefer identity.displayName',
    });
  }
  if (!caseSource.includes('name: identity.displayName')) {
    violations.push({
      case: 'cases.ts',
      rule: 'PatientCase name overlay missing',
      detail: 'getPatientCase() should clone with identity.displayName',
    });
  }

  return violations;
}
