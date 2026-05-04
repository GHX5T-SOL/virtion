# Virtion Design System

## Product Context
Virtion is an education-first clinical simulation platform for medical students and early clinicians. The product experience must feel like a premium biotech AI company: a high-trust training simulator, synthetic cases, AI attending feedback, and a roadmap toward AR/VR, mobile, desktop, and consent-first decentralized research compute.

Primary flows:
- Launch and onboarding: introduce Virtion as a clinical learning operating system.
- Home: company/product dashboard with product modules, roadmap, safety posture, and entry points into training.
- Training: select polyclinic mode, pick or accept a case, enter the 3D room, examine/order/diagnose/prescribe, and receive an AI/degraded debrief.
- Architecture: show model routing, agentic rounds, and platform topology without exposing secrets or internal-only copy.

## Visual Direction
Theme: liquid glass clinical OS. Dark, precise, high-tech, with translucent panels, white highlights, cool cyan/teal medical accents, controlled red for risk, and subtle blue-violet only as an accent. Avoid the old peach cartoon look, heavy doodle outlines, plush toy proportions, and user-specific profile surfaces.

## Tokens
Fonts:
- Primary: Inter, system-ui, sans-serif.
- Display: Sora, Inter, system-ui, sans-serif.
- Numeric/technical: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace.

Colors:
- Background: `#030711`, `#07111e`, `#0b1726`.
- Glass surface: `rgba(11, 24, 40, 0.72)`, `rgba(255, 255, 255, 0.08)`.
- Ink: `#f5fbff`, muted: `#9fb4c7`.
- Primary medical cyan: `#4fe3ff`.
- Biotech teal: `#45f0b0`.
- Data blue: `#7aa7ff`.
- Energy amber: `#ffd166`.
- Risk red: `#ff5c7a`.
- Borders: `rgba(255, 255, 255, 0.16)`.

Shape:
- Cards: 8px border radius by default, 14px for large glass panels.
- Buttons: pill radius for primary action, square-ish 10px for utility surfaces.
- Icon buttons: fixed 36-44px squares/circles with tooltip/title text.

Motion:
- Page entries: 280-420ms ease-out, translateY 10-18px, opacity.
- Micro-interactions: 120-180ms transform/box-shadow.
- Ambient orbital or scanning lines can loop linearly; obey `prefers-reduced-motion`.
- Stagger dense grids by 30-50ms.

Accessibility:
- All text must stay high-contrast on glass.
- Do not encode severity with color only; include labels.
- Keep mobile first viewport usable: hero must reveal next section and controls must wrap without clipping.

## Component Patterns
- `TopBar`: compact glass navigation with Virtion mark, breadcrumb, platform status, no personal profile.
- `Wordmark`: abstract Virtion V/orbit mark plus text; never render MedKit copy.
- `plush`, `plush-lg`, `chip`, `btn-plush`: legacy class names remapped to glass surfaces for compatibility.
- Home sections are full-width bands or unframed constrained layouts. Cards are only repeated items/tools, not nested section wrappers.
- 3D scene should use realistic dark clinic materials: satin composite floor, soft luminous panels, glass privacy boards, diagnostic displays, holographic overlays.

## Copy Rules
- Say "training simulator, synthetic cases, not clinical advice" on public/safety surfaces.
- Future patient-data, diagnostics, decentralized compute, robot-doctor, gene sequencing, and protein-folding language must be framed as consent-first R&D and roadmap, not active clinical claims.
- Avoid internal labels such as "human confirmed only" or old project names.
