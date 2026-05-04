# Pages

## `/` Launch / Home Flow
Entry: `src/App.tsx`
Dependencies:
- `src/components/SplashScreen.tsx`
  - `src/components/primitives.tsx`
  - `src/game/store.ts`
- `src/components/OnboardingScreen.tsx`
  - `src/components/primitives.tsx`
  - `src/game/store.ts`
- `src/components/HomeScreen.tsx`
  - `src/components/primitives.tsx`
  - `src/game/store.ts`
  - `src/data/evalHistory.ts`
- `src/styles/global.css`
- `.superdesign/design-system.md`

## Training Selection Flow
Entry: `src/App.tsx`
Dependencies:
- `src/components/ModeSelectScreen.tsx`
  - `src/components/primitives.tsx`
  - `src/game/store.ts`
- `src/components/GPRoomScreen.tsx`
  - `src/components/primitives.tsx`
  - `src/data/cases.ts`
  - `src/game/clinic.ts`
  - `src/game/store.ts`
- `src/components/CaseLibraryScreen.tsx`
  - `src/components/primitives.tsx`
  - `src/data/cases.ts`
  - `src/game/clinic.ts`
  - `src/game/store.ts`

## 3D Encounter
Entry: `src/components/EncounterScreen.tsx`
Dependencies:
- `src/components/three/Polyclinic.tsx`
  - `src/components/three/Player.tsx`
  - `src/components/three/FloatingVoicePanel.tsx`
  - `src/components/three/StylizedCharacter.tsx`
  - `src/components/three/interactions.ts`
- `src/components/ExamineOverlay.tsx`
- `src/components/DockedVoicePanel.tsx`
- `src/game/store.ts`
- `src/game/types.ts`
- `src/voice/conversation.ts`
- `src/styles/global.css`

## Debrief
Entry: `src/components/DebriefScreen.tsx`
Dependencies:
- `src/agents/useAttendingDebrief.ts`
- `src/agents/debriefRequest.ts`
- `src/agents/customTools.ts`
- `src/data/guidelines.ts`
- `src/data/evalHistory.ts`
- `src/game/store.ts`
- `src/styles/global.css`

## Architecture Pages
Entry: `src/App.tsx`
Dependencies:
- `src/components/AgenticRoundsScreen.tsx`
- `src/components/AgentTopologyScreen.tsx`
- `src/components/primitives.tsx`
- `src/data/guidelines.ts`
- `src/data/polyclinicPatients.ts`
- `src/data/patients.ts`
