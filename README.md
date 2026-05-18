# Fizer Web Production MVP

Local playable clinical training slice for the 3D Clinic project.

## Main Route

```text
http://127.0.0.1:5173/encounter
```

The current default scene uses Zoro's v43 room donor asset inside the Fizer encounter flow.

## Current Product Focus

Room and HUD are acceptable for now. The 2026-05-18 product pass rebranded the app from Virtion to Fizer, removed the old platform CTA and module picker, replaced the static splash preview with a lightweight interactive hero scene, added professional company/roadmap homepage sections, and redesigned the home, control room, chart browser, brief, top navigation, and examination overlay while preserving the 3D clinic scene. Phase46 completed patient-specific name/avatar assignment. Phase49 accepted a high-quality seated animated Mpho Molefe (`im-001`) sample. Phase50 extends that approach with eight user-supplied Mixamo seated/talking patient-pool assets:

1. preserve female cases rendering female avatars and male cases rendering male avatars;
2. use broad `avatarRace` mapping for black, white, indian, and asian pool assets;
3. keep patients human-scale relative to the desk and room;
4. seat patients naturally on the visible consultation chair;
5. preserve continuous real seated/talking motion from embedded Mixamo animations;
6. keep RPM avatars as fallbacks only.

## Local Run

```bash
npm run verify
npm test -- --run
npm run build
python3 -m py_compile backend/server.py backend/voice_agent.py backend/model_router.py
backend/.venv/bin/python backend/server.py
npm run dev -- --host 127.0.0.1 --port 5173
```

Backend health:

```text
http://127.0.0.1:8787/health
```

## Runtime Notes

- Local LiveKit secrets are not the current blocker. Production Netlify has the relevant env keys.
- Keep local fallback voice clean and do not show raw token/backend errors in the hero UI.
- Do not print secrets or env values.
- Do not push or commit unless Ghost explicitly asks. Ghost approved the 2026-05-18 push to `main` after tests pass.
- Do not use procedurally generated filler assets.
- Do not depend on live Ready Player Me avatar generation for future avatars.
- Do not reintroduce the rejected direct Quaternius runtime retarget.
- Current avatar planning details are in `../docs/PATIENT_AVATAR_PIPELINE.md` and `../docs/VISUAL_REVIEW_PHASE50_PATIENT_POOL.md`.
- Phase47 partial evidence is under `review/screenshots/phase47-seated-avatar-scale-chair/`, but it is rejected.
- Phase48 rejected direct-retarget evidence is under `review/screenshots/phase48-seated-animated-asset-sample/`.
- Phase49 prep/control evidence is under `review/screenshots/phase49-prep-review/`.
- Phase49 accepted Mpho evidence is under `review/screenshots/phase49-mpho-mixamo-sample/`.
- Phase50 accepted pool evidence is under `review/screenshots/phase50-patient-pool/`.
- After the approved push, verify Netlify deploy status, large/LFS asset delivery, and production LiveKit voice.

## Main Files

```text
src/components/three/ZoroV43PolyclinicScene.tsx
src/components/EncounterScreen.tsx
src/components/three/FloatingVoicePanel.tsx
src/components/DockedVoicePanel.tsx
src/components/ExamineOverlay.tsx
src/data/medicalSuiteModelRegistry.ts
ASSET_MANIFEST.md
RUNBOOK_LOCAL.md
```
