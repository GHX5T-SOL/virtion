import { useEffect } from 'react';
import { store } from '../game/store';

export function ModeSelectScreen() {
  useEffect(() => {
    store.setScreen('gpRoom');
  }, []);

  return (
    <div className="screen fizer-page" style={{ display: 'grid', placeItems: 'center' }}>
      <div className="fizer-panel" style={{ padding: 24, fontWeight: 800 }}>
        Opening the Fizer control room...
      </div>
    </div>
  );
}
