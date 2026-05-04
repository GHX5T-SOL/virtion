export type PaletteName = 'sunshine' | 'candy' | 'forest';

const PALETTES: Record<PaletteName, Record<string, string>> = {
  sunshine: {
    '--cream': '#f7fbff', '--cream-2': '#eaf3fb',
    '--peach': '#bff1ff', '--peach-deep': '#00c7ff',
    '--butter': '#f4c95d', '--butter-deep': '#b8860b',
    '--mint': '#d7fbef', '--mint-deep': '#00a67e',
    '--sky': '#dcecff', '--sky-deep': '#2e6bff',
    '--rose': '#ffe4eb', '--rose-deep': '#e23b5d',
  },
  candy: {
    '--cream': '#fbf8ff', '--cream-2': '#eef4ff',
    '--peach': '#d6f7ff', '--peach-deep': '#18bfff',
    '--butter': '#fff0b8', '--butter-deep': '#c69518',
    '--mint': '#dcfff4', '--mint-deep': '#00a47a',
    '--sky': '#e4e8ff', '--sky-deep': '#5f6fff',
    '--rose': '#ffe5ef', '--rose-deep': '#df3b73',
  },
  forest: {
    '--cream': '#f7fff9', '--cream-2': '#e9f8f0',
    '--peach': '#b9f8f1', '--peach-deep': '#00bfd0',
    '--butter': '#eef7b1', '--butter-deep': '#88a81f',
    '--mint': '#d8ffec', '--mint-deep': '#008f6b',
    '--sky': '#dff0ff', '--sky-deep': '#2470d9',
    '--rose': '#ffe5e9', '--rose-deep': '#d63b58',
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
