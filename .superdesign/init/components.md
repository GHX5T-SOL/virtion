# Components

Status date: 2026-05-14

## Current Default Encounter Scene

- `src/components/EncounterScreen.tsx`: owns the Canvas, app flow, DOM HUD, global `E`, global `T`, Examine overlay, voice fallback, and end-consultation.
- `src/components/three/ZoroV43PolyclinicScene.tsx`: default `/encounter` scene using Zoro's v43 donor GLB plus Ghost's HUD/interaction integration.
- `src/components/three/FloatingVoicePanel.tsx`: in-scene voice/status panel and conversation-status bridge.
- `src/components/DockedVoicePanel.tsx`: DOM voice status surface.
- `src/components/ExamineOverlay.tsx`: clinical workstation opened by `E`.
- `src/data/medicalSuiteModelRegistry.ts`: local GLB registry for patient and prop candidates.

## Legacy Fallback

- `src/components/three/Polyclinic.tsx`: legacy Phase38/39 scene available with `/encounter?scene=legacy`.
- `src/components/three/Player.tsx`: legacy movement/pointer-lock controller; v43 uses fixed drag-look instead.

## Design Notes

Phase48 visual work should target one seated animated Mpho Molefe (`im-001`) sample inside `ZoroV43PolyclinicScene.tsx` first. Do not mount standalone donor Canvas/components or move app flow ownership out of `EncounterScreen`.

Current component focus:

- preserve active patient case flow into `ZoroPatientActor`;
- preserve `case.id + case.gender` avatar mapping;
- stop relying on standing clips plus manual lower-body posing as the final visual path;
- source/author one real seated idle/listening/speaking sample first;
- preserve HUD and room components unless avatar clipping forces a tiny adjustment.
