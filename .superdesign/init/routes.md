# Routes

Virtion is a Vite SPA. Routes are mostly internal store screens rather than URL routes.

## URL Paths
- `/`: loads `src/App.tsx`, then starts at `screen='splash'`.
- `/agentic-rounds`: `App` switches to `agenticRounds`.
- `/agent-topology`: `App` switches to `agentTopology`.
- `/agent/*`: proxied to the backend by Vite in development and Vercel middleware in production.
- `/voice/*`: proxied to the backend by Vite in development and Vercel middleware in production.

## Internal Screens
- `splash` -> `src/components/SplashScreen.tsx`
- `onboarding` -> `src/components/OnboardingScreen.tsx`
- `home` -> `src/components/HomeScreen.tsx`
- `mode` -> `src/components/ModeSelectScreen.tsx`
- `gpRoom` -> `src/components/GPRoomScreen.tsx`
- `library` -> `src/components/CaseLibraryScreen.tsx`
- `brief` -> `src/components/BriefScreen.tsx`
- `encounter` -> `src/components/EncounterScreen.tsx`
- `endConfirm` -> `src/components/EndConfirmScreen.tsx`
- `debrief` -> `src/components/DebriefScreen.tsx`
- `history` -> `src/components/HistoryScreen.tsx`
- `agenticRounds` -> `src/components/AgenticRoundsScreen.tsx`
- `agentTopology` -> `src/components/AgentTopologyScreen.tsx`

Router source of truth: `src/App.tsx` and `src/game/store.ts`.
