# Layouts

The app does not use file-system routing or a formal layout component. `src/App.tsx` is the shell and switches screens from the global `Store`.

## `src/App.tsx`

```tsx
import { useEffect } from 'react';
import { store, useScreen, useTweaks } from './game/store';
import { applyIntensity, applyPalette } from './styles/palettes';
import { SplashScreen } from './components/SplashScreen';
import { OnboardingScreen } from './components/OnboardingScreen';
import { HomeScreen } from './components/HomeScreen';
import { ModeSelectScreen } from './components/ModeSelectScreen';
import { GPRoomScreen } from './components/GPRoomScreen';
import { CaseLibraryScreen } from './components/CaseLibraryScreen';
import { BriefScreen } from './components/BriefScreen';
import { EncounterScreen } from './components/EncounterScreen';
import { EndConfirmScreen } from './components/EndConfirmScreen';
import { DebriefScreen } from './components/DebriefScreen';
import { HistoryScreen } from './components/HistoryScreen';
import { AgenticRoundsScreen } from './components/AgenticRoundsScreen';
import { AgentTopologyScreen } from './components/AgentTopologyScreen';
import { BackgroundMusic } from './components/BackgroundMusic';

export default function App() {
  const screen = useScreen();
  const tweaks = useTweaks();
  useEffect(() => { applyPalette(tweaks.palette); }, [tweaks.palette]);
  useEffect(() => { applyIntensity(tweaks.intensity); }, [tweaks.intensity]);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const path = window.location.pathname.replace(/\/+$/, '');
    if (path === '/agentic-rounds') store.setScreen('agenticRounds');
    else if (path === '/agent-topology') store.setScreen('agentTopology');
  }, []);
  return <div className="app">{/* active screen + BackgroundMusic */}</div>;
}
```

## Shared Navigation

`src/components/primitives.tsx` exports `TopBar`, `Breadcrumb`, and `Wordmark`. These are the cross-screen layout elements and should be passed as context for any page design.
