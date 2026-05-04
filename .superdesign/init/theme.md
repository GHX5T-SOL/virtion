# Theme

## Global CSS
Primary theme file: `src/styles/global.css`.

Required design direction:
- Dark high-tech clinical OS.
- Glass panels, subtle grid/radial backgrounds, cyan/teal medical accents.
- Legacy class names (`plush`, `btn-plush`, `chip`) remain but are visually remapped away from the old toy/cartoon style.

## Important Tokens
See `.superdesign/design-system.md` for the target tokens. The implementation should keep CSS custom properties stable because many components use inline styles such as `var(--cream)`, `var(--line)`, `var(--mint)`, `var(--peach)`, and `var(--plush-sm)`.

## Other Theme Files
`src/styles/palettes.ts` mutates CSS variables based on the in-app tweak state. It should map the legacy palette names to the new Virtion high-tech palette instead of restoring the old color families.
