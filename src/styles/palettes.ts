export type PaletteName = 'sunshine' | 'candy' | 'forest';

const PALETTES: Record<PaletteName, Record<string, string>> = {
  sunshine: {
    '--cream': '#07111e', '--cream-2': '#0b1726',
    '--peach': '#19c8ff', '--peach-deep': '#4fe3ff',
    '--butter': '#ffd166', '--butter-deep': '#ffb84d',
    '--mint': '#45f0b0', '--mint-deep': '#10c991',
    '--sky': '#7aa7ff', '--sky-deep': '#5f84ff',
    '--rose': '#ff5c7a', '--rose-deep': '#ff315f',
  },
  candy: {
    '--cream': '#050814', '--cream-2': '#10162a',
    '--peach': '#8be7ff', '--peach-deep': '#52d7ff',
    '--butter': '#ffe28a', '--butter-deep': '#ffc65a',
    '--mint': '#70f8cb', '--mint-deep': '#31dca0',
    '--sky': '#9eb5ff', '--sky-deep': '#738aff',
    '--rose': '#ff7b99', '--rose-deep': '#ff4f75',
  },
  forest: {
    '--cream': '#03110f', '--cream-2': '#0a1f1b',
    '--peach': '#36e3d2', '--peach-deep': '#4fe3ff',
    '--butter': '#dbf26d', '--butter-deep': '#b8d94f',
    '--mint': '#45f0b0', '--mint-deep': '#0fb37d',
    '--sky': '#79c7ff', '--sky-deep': '#4f95e8',
    '--rose': '#ff687d', '--rose-deep': '#ec3d60',
  },
};

export function applyPalette(name: PaletteName) {
  const p = PALETTES[name] ?? PALETTES.sunshine;
  const root = document.documentElement;
  for (const [k, v] of Object.entries(p)) root.style.setProperty(k, v);
}

export function applyIntensity(intensity: number) {
  const root = document.documentElement;
  root.style.setProperty('--stroke', intensity >= 1.5 ? '1.5px' : '1px');
  root.style.setProperty('--stroke-thick', intensity >= 1.5 ? '1.5px' : '1px');
}
