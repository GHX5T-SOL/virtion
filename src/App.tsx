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

export default function App() {
  const screen = useScreen();
  const tweaks = useTweaks();

  useEffect(() => {
    applyPalette(tweaks.palette);
  }, [tweaks.palette]);

  useEffect(() => {
    applyIntensity(tweaks.intensity);
  }, [tweaks.intensity]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.scrollTo({ top: 0, left: 0 });
    requestAnimationFrame(() => {
      document.querySelectorAll<HTMLElement>('.screen').forEach((el) => {
        el.scrollTop = 0;
      });
    });
  }, [screen]);

  // Minimal path-based routes so local QA can deep-link without clicking
  // through onboarding every time. The normal app flow remains unchanged.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const path = window.location.pathname.replace(/\/+$/, '');
    if (path === '/encounter' || path === '/demo/encounter') {
      store.acceptNextPatient('im-001');
    }
  }, []);

  return (
    <div className="app">
      {screen === 'splash' && <SplashScreen />}
      {screen === 'onboarding' && <OnboardingScreen />}
      {screen === 'home' && <HomeScreen />}
      {screen === 'mode' && <ModeSelectScreen />}
      {screen === 'gpRoom' && <GPRoomScreen />}
      {screen === 'library' && <CaseLibraryScreen />}
      {screen === 'brief' && <BriefScreen />}
      {screen === 'encounter' && <EncounterScreen />}
      {screen === 'endConfirm' && <EndConfirmScreen />}
      {screen === 'debrief' && <DebriefScreen />}
      {screen === 'history' && <HistoryScreen />}
    </div>
  );
}
