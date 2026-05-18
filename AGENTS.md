# Fizer Web MVP Agent Notes

Status date: 2026-05-18

## Current Target

```text
PHASE52_FizerRedesignAndDeployGate
```

Main route:

```text
http://127.0.0.1:5173/
```

## Current Truth

Fizer rebrand and product-flow redesign is active:

1. `/` shows the Fizer launch screen with one `Start Simulation` action.
2. Start Simulation skips the old module picker and opens the `gpRoom` control room.
3. The main learner flow says `3D clinic`, not visible `Polyclinic`.
4. Home, control room, chart browser, brief, and examination overlay use the Fizer redesign system in `src/styles/global.css`.
5. Fizer public assets live at `public/fizer_logo.png` and `public/fizer_favicon.png`.

Phase46 is implemented locally:

1. South African display names flow through cases, HUD, monitor texture, voice persona, and debrief.
2. `ZoroPatientActor` uses active `patient.case` instead of a hard-coded patient.
3. Gender-correct Ready Player Me avatars resolve by `case.id + case.gender`.
4. Runtime avatar assets live in `public/assets/medical-suite/patients/rpm-local/`.
5. RPM animation clips live in `public/assets/medical-suite/animations/rpm/`.
6. Visual proof lives in `review/screenshots/phase46-patient-avatar-assignment/`.

Current limitation: Phase47 restored the donor chair, raised avatar scale, improved `im-001` loading in final proof, and moved `Press E`, but user visual review rejected the result. Treat the generic RPM assets as identity placeholders unless a real seated animation path is proven for those cases.

Phase48 asset-source result: Quaternius Universal Animation Library Standard was downloaded under `source-assets/phase48-candidate-quaternius-universal-animation-library/`. It is CC0 and includes seated idle/talking clips, but direct runtime retargeting onto `rpm-local-female-3` failed visually and was removed from the active runtime path. Do not reintroduce that direct-retarget code; use offline retarget/bake in Blender, Unity, or Unreal before integration.

Phase49 result: the user-supplied Mixamo FBX `patient_avatars/Sitting_Talking_female.fbx` is converted to `public/assets/medical-suite/patients/phase49-mpho-mixamo/mpho-mixamo-sitting-talking.glb` and registered as `phase49-mpho-mixamo-sitting-talking` for Mpho Molefe (`im-001`).

Phase50 result: eight user-supplied Mixamo FBXs from `/Users/mx/3D Clinic/patient_pool` are converted to `public/assets/medical-suite/patients/patient-pool/`, registered as `PATIENT_POOL_MIXAMO_MODELS`, and mapped by strict gender plus broad `avatarRace`.

Do not depend on live Ready Player Me avatar generation for future assets; use existing local GLBs or source better licensed alternatives with provenance.

## Hard Rules

- Do not push unless explicitly approved. The 2026-05-18 push to `main` is approved after tests pass.
- Do not commit unless explicitly asked. The 2026-05-18 commit for the approved push is allowed after tests pass.
- Preserve `/`, `/encounter`, `E`, `T`, Examine, backend, and fallback voice.
- Do not expose raw voice/token errors in hero UI.
- Local LiveKit missing is not the current blocker.
- Do not spend Meshy credits without explicit approval.
- Do not use procedurally generated filler assets.
- Do not use low-quality generated or procedural characters.
- Do not change the 3D clinic room composition unless the user explicitly requests it.
- Record source, license, path, size, and optimization notes for imported assets.
- Prove one high-quality seated animated sample before bulk imports or generation.
- Preserve the accepted first sample: Mpho Molefe (`im-001`), 34-year-old female, first accepted patient, current resolver `phase49-mpho-mixamo-sitting-talking`.
- Preserve the Phase50 pool unless a higher-quality reviewed source replaces it.
- Match Mpho's avatar to patient description as far as the asset pool supports it: strict female gender, loose adult age band, broad representation/ethnicity fit without stereotyping.
- If a baked sample is integrated, bypass the current manual `applyRpmClinicPose()` route for Mpho so old forced rotations do not fight the new animation.

## Key Files

```text
src/data/patientIdentities.ts
src/data/cases.ts
src/data/medicalSuiteModelRegistry.ts
src/components/SplashScreen.tsx
src/components/GPRoomScreen.tsx
src/components/CaseLibraryScreen.tsx
src/components/BriefScreen.tsx
src/components/ExamineOverlay.tsx
src/components/three/ZoroV43PolyclinicScene.tsx
src/components/EncounterScreen.tsx
scripts/verify/patient-identities.ts
scripts/assets/import-patient-pool-fbx.py
scripts/visual/phase50-patient-pool-review.mjs
ASSET_MANIFEST.md
RUNBOOK_LOCAL.md
../docs/VISUAL_REVIEW_PHASE47_AVATARS.md
../docs/VISUAL_REVIEW_PHASE49_MPHO_MIXAMO.md
../docs/VISUAL_REVIEW_PHASE50_PATIENT_POOL.md
../docs/PATIENT_AVATAR_PIPELINE.md
../docs/PATIENT_IDENTITY_MAPPING.md
```

## Verification

```bash
npm run verify
npm test -- --run
npm run build
python3 -m py_compile backend/server.py backend/voice_agent.py backend/model_router.py
```
