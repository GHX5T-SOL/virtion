# Pages

Status date: 2026-05-18

## `/`

Fizer launch screen. It has one primary action: `Start Simulation`. Do not restore the old `See the Platform` branch in the visible learner flow.

## Control Room

Internal screen `gpRoom`. This is now the first screen after `Start Simulation`, replacing the old module picker. Users can accept the next patient or open `Pick from Charts`.

## `/encounter`

This is the current acceptance page.

Dependency tree for current visual work:

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

The accepted encounter view preserves the existing 3D clinic room, HUD, patient placement, and animation setup. Current redesign work is around the website shell, chart flow, and examination overlay styling.
