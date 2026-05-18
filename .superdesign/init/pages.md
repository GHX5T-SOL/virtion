# Pages

Status date: 2026-05-14

## `/encounter`

This is the current acceptance page.

Dependency tree for Phase48 visual work:

```text
src/App.tsx
src/components/EncounterScreen.tsx
src/components/three/ZoroV43PolyclinicScene.tsx
src/components/three/FloatingVoicePanel.tsx
src/components/DockedVoicePanel.tsx
src/components/ExamineOverlay.tsx
src/data/medicalSuiteModelRegistry.ts
src/game/store.ts
src/voice/conversation.ts
src/styles/global.css
.superdesign/design-system.md
```

## `/encounter?scene=legacy`

Fallback/comparison page. It uses `src/components/three/Polyclinic.tsx` and should stay available unless a future task explicitly retires it.

## `/review/index.html`

Static screenshot gallery and evidence page.

## Acceptance View

Use normal 1440x900 seated doctor POV. Close-ups support but do not replace the main frame.

The accepted view must show one high-quality seated animated Mpho Molefe (`im-001`) sample in the existing room, with visible chair contact, adult scale, resolved legs/feet, and real idle/listening/speaking motion. The sample should strictly match female gender and loosely match adult age band / patient description where the source asset supports it.
