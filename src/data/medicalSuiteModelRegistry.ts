import type { PatientAvatarRace } from './patientIdentities';

export type MedicalSuiteAssetRole =
  | 'hero-patient'
  | 'patient-fallback'
  | 'rpm-patient'
  | 'mixamo-seated-patient'
  | 'desk-prop'
  | 'diagnostic-wall'
  | 'environment-kit';

export interface MedicalSuiteAssetEntry {
  id: string;
  role: MedicalSuiteAssetRole;
  path: string;
  source: string;
  licenseLabel: string;
  notes: string;
  gender?: 'M' | 'F';
  avatarRace?: PatientAvatarRace;
}

export interface RpmAnimationClipSet {
  idle: string;
  listening: string;
  speaking: string;
}

export const MPHO_MIXAMO_PATIENT_MODEL: MedicalSuiteAssetEntry = {
  id: 'phase49-mpho-mixamo-sitting-talking',
  role: 'mixamo-seated-patient',
  gender: 'F',
  avatarRace: 'black',
  path: '/assets/medical-suite/patients/phase49-mpho-mixamo/mpho-mixamo-sitting-talking.glb',
  source: '/Users/mx/3D Clinic/patient_avatars/Sitting_Talking_female.fbx',
  licenseLabel: 'User-supplied Mixamo FBX; local prototype asset, terms to be cleared before public release',
  notes: 'Phase49 first-patient sample for Mpho Molefe. Rigged 65-bone Mixamo character with one embedded seated talking animation; converted offline through Blender and texture-resized for web loading.',
};

export const PATIENT_POOL_MIXAMO_MODELS: MedicalSuiteAssetEntry[] = [
  {
    id: 'patient-pool-female-asian',
    role: 'mixamo-seated-patient',
    gender: 'F',
    avatarRace: 'asian',
    path: '/assets/medical-suite/patients/patient-pool/patient-pool-female-asian.glb',
    source: '/Users/mx/3D Clinic/patient_pool/female_asian.fbx',
    licenseLabel: 'User-supplied Mixamo FBX; local prototype asset, terms to be cleared before public release',
    notes: 'Phase50 patient-pool asset. Already Mixamo-rigged with embedded seated talking animation; converted offline through Blender and texture-resized for web loading.',
  },
  {
    id: 'patient-pool-female-black',
    role: 'mixamo-seated-patient',
    gender: 'F',
    avatarRace: 'black',
    path: '/assets/medical-suite/patients/patient-pool/patient-pool-female-black.glb',
    source: '/Users/mx/3D Clinic/patient_pool/female_black.fbx',
    licenseLabel: 'User-supplied Mixamo FBX; local prototype asset, terms to be cleared before public release',
    notes: 'Phase50 patient-pool asset. Already Mixamo-rigged with embedded seated talking animation; converted offline through Blender and texture-resized for web loading.',
  },
  {
    id: 'patient-pool-female-indian',
    role: 'mixamo-seated-patient',
    gender: 'F',
    avatarRace: 'indian',
    path: '/assets/medical-suite/patients/patient-pool/patient-pool-female-indian.glb',
    source: '/Users/mx/3D Clinic/patient_pool/female_indian.fbx',
    licenseLabel: 'User-supplied Mixamo FBX; local prototype asset, terms to be cleared before public release',
    notes: 'Phase50 patient-pool asset. Already Mixamo-rigged with embedded seated talking animation; converted offline through Blender and texture-resized for web loading.',
  },
  {
    id: 'patient-pool-female-white',
    role: 'mixamo-seated-patient',
    gender: 'F',
    avatarRace: 'white',
    path: '/assets/medical-suite/patients/patient-pool/patient-pool-female-white.glb',
    source: '/Users/mx/3D Clinic/patient_pool/female_white.fbx',
    licenseLabel: 'User-supplied Mixamo FBX; local prototype asset, terms to be cleared before public release',
    notes: 'Phase50 patient-pool asset. Already Mixamo-rigged with embedded seated talking animation; converted offline through Blender and texture-resized for web loading.',
  },
  {
    id: 'patient-pool-male-asian',
    role: 'mixamo-seated-patient',
    gender: 'M',
    avatarRace: 'asian',
    path: '/assets/medical-suite/patients/patient-pool/patient-pool-male-asian.glb',
    source: '/Users/mx/3D Clinic/patient_pool/male_asian.fbx',
    licenseLabel: 'User-supplied Mixamo FBX; local prototype asset, terms to be cleared before public release',
    notes: 'Phase50 patient-pool asset. Already Mixamo-rigged with embedded seated talking animation; converted offline through Blender and texture-resized for web loading.',
  },
  {
    id: 'patient-pool-male-black',
    role: 'mixamo-seated-patient',
    gender: 'M',
    avatarRace: 'black',
    path: '/assets/medical-suite/patients/patient-pool/patient-pool-male-black.glb',
    source: '/Users/mx/3D Clinic/patient_pool/male_black.fbx',
    licenseLabel: 'User-supplied Mixamo FBX; local prototype asset, terms to be cleared before public release',
    notes: 'Phase50 patient-pool asset. Already Mixamo-rigged with embedded seated talking animation; converted offline through Blender and texture-resized for web loading.',
  },
  {
    id: 'patient-pool-male-indian',
    role: 'mixamo-seated-patient',
    gender: 'M',
    avatarRace: 'indian',
    path: '/assets/medical-suite/patients/patient-pool/patient-pool-male-indian.glb',
    source: '/Users/mx/3D Clinic/patient_pool/male_indian.fbx',
    licenseLabel: 'User-supplied Mixamo FBX; local prototype asset, terms to be cleared before public release',
    notes: 'Phase50 patient-pool asset. Already Mixamo-rigged with embedded seated talking animation; converted offline through Blender and texture-resized for web loading.',
  },
  {
    id: 'patient-pool-male-white',
    role: 'mixamo-seated-patient',
    gender: 'M',
    avatarRace: 'white',
    path: '/assets/medical-suite/patients/patient-pool/patient-pool-male-white.glb',
    source: '/Users/mx/3D Clinic/patient_pool/male_white.fbx',
    licenseLabel: 'User-supplied Mixamo FBX; local prototype asset, terms to be cleared before public release',
    notes: 'Phase50 patient-pool asset. Already Mixamo-rigged with embedded seated talking animation; converted offline through Blender and texture-resized for web loading.',
  },
];

export const MEDICAL_SUITE_PATIENT_MODELS: MedicalSuiteAssetEntry[] = [
  MPHO_MIXAMO_PATIENT_MODEL,
  {
    id: 'phase34-aisha-style-patient',
    role: 'hero-patient',
    path: '/assets/medical-suite/patients/phase34-patient/patient-unity-clean.glb',
    source: 'Local Phase34 Unity/Blender evidence pack',
    licenseLabel: 'Local prototype asset; provenance retained in ASSET_MANIFEST.md',
    notes: 'Primary seated patient for the production-slice encounter. Static GLB with procedural breathing/head motion in R3F.',
  },
  {
    id: 'threejs-michelle',
    role: 'patient-fallback',
    path: '/assets/medical-suite/patients/michelle-threejs.glb',
    source: 'three.js examples / Mixamo sample',
    licenseLabel: 'three.js examples sample asset',
    notes: 'Rigged adult female fallback; not preferred because the clip is a dance animation, but useful if the primary generated patient fails.',
  },
  {
    id: 'threejs-readyplayerme',
    role: 'patient-fallback',
    path: '/assets/medical-suite/patients/readyplayerme-threejs.glb',
    source: 'three.js examples / Ready Player Me sample',
    licenseLabel: 'Ready Player Me sample avatar terms',
    notes: 'Rigged avatar fallback for registry coverage and future case-demographic mapping.',
  },
  {
    id: 'zoro-primary-animated',
    role: 'hero-patient',
    path: '/assets/medical-suite/patients/zoro/patient-primary.glb',
    source: 'Zoro MX_3D_CLINIC_HANDOFF patient-05-patient-primary-animated',
    licenseLabel: 'Local prototype asset; Zoro handling provenance/license clearance before public release',
    notes: 'Rigged candidate with one Take 001 animation. Used first for Phase40 voice-state body motion; may need replacement if it reads as a clinician/fallback model in the main POV.',
  },
  {
    id: 'zoro-aisha-v2-lite',
    role: 'patient-fallback',
    path: '/assets/medical-suite/patients/zoro/aisha-v2-lite.glb',
    source: 'Zoro MX_3D_CLINIC_HANDOFF patient-03-aisha-v2-lite-lod',
    licenseLabel: 'Local prototype asset; Zoro handling provenance/license clearance before public release',
    notes: 'Small unrigged Meshy seated-patient LOD candidate. Visual fallback only; procedural motion required.',
  },
  {
    id: 'zoro-aisha-lite',
    role: 'patient-fallback',
    path: '/assets/medical-suite/patients/zoro/aisha-lite.glb',
    source: 'Zoro MX_3D_CLINIC_HANDOFF patient-04-aisha-lite-lod',
    licenseLabel: 'Local prototype asset; Zoro handling provenance/license clearance before public release',
    notes: 'Small unrigged Meshy seated-patient LOD candidate. Visual fallback only; procedural motion required.',
  },
];

export const LOCAL_RPM_FEMALE_PATIENT_MODELS: MedicalSuiteAssetEntry[] = [
  {
    id: 'rpm-local-female-1',
    role: 'rpm-patient',
    gender: 'F',
    path: '/assets/medical-suite/patients/rpm-local/female_1.glb',
    source: '/Users/mx/3D Clinic/patient_avatars/female_1.glb',
    licenseLabel: 'User-supplied Ready Player Me GLB; local runtime copy',
    notes: 'Rigged female RPM avatar. Contains one embedded Mixamo-style clip, but Phase46 uses RPM library clips for consistent state control.',
  },
  {
    id: 'rpm-local-female-2',
    role: 'rpm-patient',
    gender: 'F',
    path: '/assets/medical-suite/patients/rpm-local/female_2.glb',
    source: '/Users/mx/3D Clinic/patient_avatars/female_2.glb',
    licenseLabel: 'User-supplied Ready Player Me GLB; local runtime copy',
    notes: 'Rigged female RPM avatar; no embedded animation in source audit.',
  },
  {
    id: 'rpm-local-female-3',
    role: 'rpm-patient',
    gender: 'F',
    path: '/assets/medical-suite/patients/rpm-local/female_3.glb',
    source: '/Users/mx/3D Clinic/patient_avatars/female_3.glb',
    licenseLabel: 'User-supplied Ready Player Me GLB; local runtime copy',
    notes: 'Rigged female RPM avatar with KHR_materials_specular; no embedded animation in source audit.',
  },
  {
    id: 'rpm-local-female-4',
    role: 'rpm-patient',
    gender: 'F',
    path: '/assets/medical-suite/patients/rpm-local/female_4.glb',
    source: '/Users/mx/3D Clinic/patient_avatars/female_4.glb',
    licenseLabel: 'User-supplied Ready Player Me GLB; local runtime copy',
    notes: 'Rigged female RPM avatar; no embedded animation in source audit.',
  },
  {
    id: 'rpm-local-female-5',
    role: 'rpm-patient',
    gender: 'F',
    path: '/assets/medical-suite/patients/rpm-local/female_5.glb',
    source: '/Users/mx/3D Clinic/patient_avatars/female_5.glb',
    licenseLabel: 'User-supplied Ready Player Me GLB; local runtime copy',
    notes: 'Rigged female RPM avatar; no embedded animation in source audit.',
  },
  {
    id: 'rpm-local-female-6',
    role: 'rpm-patient',
    gender: 'F',
    path: '/assets/medical-suite/patients/rpm-local/female_6.glb',
    source: '/Users/mx/3D Clinic/patient_avatars/female_6.glb',
    licenseLabel: 'User-supplied Ready Player Me GLB; local runtime copy',
    notes: 'Rigged female RPM avatar; no embedded animation in source audit.',
  },
];

export const LOCAL_RPM_MALE_PATIENT_MODELS: MedicalSuiteAssetEntry[] = [
  {
    id: 'rpm-local-male-1',
    role: 'rpm-patient',
    gender: 'M',
    path: '/assets/medical-suite/patients/rpm-local/male_1.glb',
    source: '/Users/mx/3D Clinic/patient_avatars/male_1.glb',
    licenseLabel: 'User-supplied Ready Player Me GLB; local runtime copy',
    notes: 'Rigged male RPM avatar; no embedded animation in source audit.',
  },
  {
    id: 'rpm-local-male-2',
    role: 'rpm-patient',
    gender: 'M',
    path: '/assets/medical-suite/patients/rpm-local/male_2.glb',
    source: '/Users/mx/3D Clinic/patient_avatars/male_2.glb',
    licenseLabel: 'User-supplied Ready Player Me GLB; local runtime copy',
    notes: 'Rigged male RPM avatar with KHR_materials_specular; no embedded animation in source audit.',
  },
  {
    id: 'rpm-local-male-3',
    role: 'rpm-patient',
    gender: 'M',
    path: '/assets/medical-suite/patients/rpm-local/male_3.glb',
    source: '/Users/mx/3D Clinic/patient_avatars/male_3.glb',
    licenseLabel: 'User-supplied Ready Player Me GLB; local runtime copy',
    notes: 'Largest male RPM avatar, about 25 MB. Has 9 embedded gesture clips and morph targets; keep in pool but optimize later if payload becomes a blocker.',
  },
  {
    id: 'rpm-local-male-4',
    role: 'rpm-patient',
    gender: 'M',
    path: '/assets/medical-suite/patients/rpm-local/male_4.glb',
    source: '/Users/mx/3D Clinic/patient_avatars/male_4.glb',
    licenseLabel: 'User-supplied Ready Player Me GLB; local runtime copy',
    notes: 'Rigged male RPM avatar with KHR_materials_specular; no embedded animation in source audit.',
  },
  {
    id: 'rpm-local-male-5',
    role: 'rpm-patient',
    gender: 'M',
    path: '/assets/medical-suite/patients/rpm-local/male_5.glb',
    source: '/Users/mx/3D Clinic/patient_avatars/male_5.glb',
    licenseLabel: 'User-supplied Ready Player Me GLB; local runtime copy',
    notes: 'Rigged male RPM avatar with KHR_materials_specular; no embedded animation in source audit.',
  },
];

export const LOCAL_RPM_PATIENT_MODELS = [
  ...LOCAL_RPM_FEMALE_PATIENT_MODELS,
  ...LOCAL_RPM_MALE_PATIENT_MODELS,
];

export const MIXAMO_SEATED_PATIENT_MODELS = [
  MPHO_MIXAMO_PATIENT_MODEL,
  ...PATIENT_POOL_MIXAMO_MODELS,
];

export const ACTIVE_PATIENT_AVATAR_MODELS = [
  ...MIXAMO_SEATED_PATIENT_MODELS,
  ...LOCAL_RPM_PATIENT_MODELS,
];

const ACTIVE_RPM_FEMALE_PATIENT_MODELS = LOCAL_RPM_FEMALE_PATIENT_MODELS.filter((entry) => entry.id !== 'rpm-local-female-1');
const ACTIVE_RPM_MALE_PATIENT_MODELS = LOCAL_RPM_MALE_PATIENT_MODELS;

export const RPM_PATIENT_ANIMATION_CLIPS: Record<'F' | 'M', RpmAnimationClipSet> = {
  F: {
    idle: '/assets/medical-suite/animations/rpm/feminine/idle/F_Standing_Idle_001.glb',
    listening: '/assets/medical-suite/animations/rpm/feminine/idle/F_Standing_Idle_Variations_001.glb',
    speaking: '/assets/medical-suite/animations/rpm/feminine/expression/F_Talking_Variations_001.glb',
  },
  M: {
    idle: '/assets/medical-suite/animations/rpm/masculine/idle/M_Standing_Idle_001.glb',
    listening: '/assets/medical-suite/animations/rpm/masculine/idle/M_Standing_Idle_Variations_001.glb',
    speaking: '/assets/medical-suite/animations/rpm/masculine/expression/M_Talking_Variations_001.glb',
  },
};

export const MEDICAL_SUITE_PROP_MODELS = {
  stethoscope: '/assets/medical-suite/props/stethoscope/stethoscope-unity-clean.glb',
  pulseOximeter: '/assets/medical-suite/props/pulse-oximeter/pulse-oximeter-unity-clean.glb',
  deskClutter: '/assets/medical-suite/props/desk-clutter/desk-clutter-unity-clean.glb',
  rightDiagnosticKit: '/assets/medical-suite/props/source-kits/right_diagnostic_wall_production_kit.glb',
  deskDeviceKit: '/assets/medical-suite/props/source-kits/desk_medical_device_production_kit.glb',
  rearClinicKit: '/assets/medical-suite/props/source-kits/rear_clinic_equipment_source_pack.glb',
} as const;

function hashString(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function pickLocalRpmPatientModel(caseId: string, gender: 'M' | 'F'): MedicalSuiteAssetEntry {
  const pool = gender === 'F' ? ACTIVE_RPM_FEMALE_PATIENT_MODELS : ACTIVE_RPM_MALE_PATIENT_MODELS;
  return pool[hashString(`${caseId}:avatar:${gender}`) % pool.length];
}

export function pickPatientPoolModel(gender: 'M' | 'F', avatarRace: PatientAvatarRace): MedicalSuiteAssetEntry {
  const exact = PATIENT_POOL_MIXAMO_MODELS.find((entry) => entry.gender === gender && entry.avatarRace === avatarRace);
  if (exact) return exact;
  const fallback = PATIENT_POOL_MIXAMO_MODELS.find((entry) => entry.gender === gender);
  return fallback ?? MPHO_MIXAMO_PATIENT_MODEL;
}

export function findMedicalSuitePatientModelById(id?: string): MedicalSuiteAssetEntry | undefined {
  if (!id) return undefined;
  return [...MEDICAL_SUITE_PATIENT_MODELS, ...ACTIVE_PATIENT_AVATAR_MODELS].find((entry) => entry.id === id);
}

export function getRpmAnimationClipSet(gender: 'M' | 'F'): RpmAnimationClipSet {
  return RPM_PATIENT_ANIMATION_CLIPS[gender];
}

export function pickMedicalSuitePatientModel(caseId?: string, gender?: 'M' | 'F', avatarRace?: PatientAvatarRace): MedicalSuiteAssetEntry {
  if (caseId === 'im-001' && gender === 'F') return MPHO_MIXAMO_PATIENT_MODEL;
  if (gender && avatarRace) return pickPatientPoolModel(gender, avatarRace);
  const byId = findMedicalSuitePatientModelById(caseId);
  if (byId) return byId;
  if (caseId && gender) return pickLocalRpmPatientModel(caseId, gender);
  if (caseId === 'im-001') return MEDICAL_SUITE_PATIENT_MODELS[0];
  return MEDICAL_SUITE_PATIENT_MODELS[0];
}
