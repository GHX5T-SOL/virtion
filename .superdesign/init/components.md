# Components

Framework: React 18 + TypeScript + Vite. Component library: custom React components and inline styles. CSS approach: global CSS tokens in `src/styles/global.css`.

## Shared UI Primitives

### `src/components/primitives.tsx`
Reusable UI primitives: patient face SVGs, icon/doodle helpers, breadcrumb, top bar, wordmark, speech bubble, and legacy utility wrappers.

```tsx
export function TopBar({ here = 0, steps = ['Polyclinic'], showProfile = true }: TopBarProps) {
  // Shared top navigation rendered across app screens.
}

export function Wordmark({ size = 36, dark = false }: WordmarkProps) {
  // Brand mark and wordmark. Must render Virtion only.
}

export function PatientFace(...) {
  // Legacy SVG/initials patient avatar primitive used in case cards and briefs.
}

export function Doodle(...) {
  // Legacy decorative SVG primitive. Avoid in new public surfaces.
}
```

Full source file to pass as context during design work: `src/components/primitives.tsx`.

## Main Screen Components

- `src/components/SplashScreen.tsx`: launch screen and first user gesture.
- `src/components/OnboardingScreen.tsx`: three-step product/safety onboarding.
- `src/components/HomeScreen.tsx`: public/product home and training hub.
- `src/components/ModeSelectScreen.tsx`: training mode selector.
- `src/components/GPRoomScreen.tsx`: polyclinic queue entry.
- `src/components/CaseLibraryScreen.tsx`: grouped case picker.
- `src/components/BriefScreen.tsx`: doorway brief before entering 3D encounter.
- `src/components/EncounterScreen.tsx`: 3D canvas shell and HUD.
- `src/components/ExamineOverlay.tsx`: modal clinical workstation for history, chat, tests, results, diagnosis, Rx.
- `src/components/DockedVoicePanel.tsx`: compact voice transcript/status card.
- `src/components/DebriefScreen.tsx`: AI/degraded debrief rendering.
- `src/components/HistoryScreen.tsx`: training history.
- `src/components/AgenticRoundsScreen.tsx`: product architecture flow.
- `src/components/AgentTopologyScreen.tsx`: agent topology visualization.

## 3D Components

- `src/components/three/Polyclinic.tsx`: primary R3F scene and procedural room assets.
- `src/components/three/StylizedCharacter.tsx`: procedural character model.
- `src/components/three/FloatingVoicePanel.tsx`: in-scene voice panel.
- `src/components/three/Player.tsx`: movement/camera controller.
