# Virtion Design System

## Product Context
Virtion is a premium BioMed and AI education company. The product today is a training-only clinical simulator for medical students: synthetic patients, a doctor-POV consultation loop, live voice or text interaction, orders and treatment decisions, and an AI attending debrief. The platform roadmap includes AR/VR training grounds, mobile and desktop clients, consent-first learning datasets, and opt-in decentralized compute for biomedical research.

Primary flows:
- Launch: quickly communicate "synthetic clinical training" and start the simulation.
- Product intro: optional, visual-first, no heavy pitch copy.
- Module select: choose the active training environment.
- Polyclinic: pick a specialty, accept a patient or browse cases, read a brief, consult, wrap, and debrief.
- Platform views: explain agent routing and R&D roadmap without exposing secrets or implying active clinical diagnosis.

## Visual Direction
Theme: white clinical luxury with liquid glass. The interface should feel like an Apple or Meta-caliber startup product: bright, precise, spatial, alive, and quiet enough for repeated use. Use glass panels, luminous cyan, deep navy typography, restrained biotech green, and subtle holographic surfaces. Avoid dark generic AI dashboards, cartoon doodle clutter, oversized marketing hero copy, and low-contrast translucent text.

Signature color: Virtion Cyan `#00C7FF`.

## Tokens
Fonts:
- Primary: Inter, system-ui, sans-serif.
- Display: Sora, Inter, system-ui, sans-serif.
- Numeric/technical: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace.

Colors:
- Canvas: `#ffffff`, `#f7fbff`, `#eaf3fb`.
- Deep ink: `#071525`; secondary ink: `#526579`; soft ink: `#7c91a7`.
- Glass: `rgba(255, 255, 255, 0.68)` and `rgba(255, 255, 255, 0.88)`.
- Primary cyan: `#00c7ff`; soft cyan: `#bff1ff`.
- Biotech green: `#00a67e`; soft green: `#d7fbef`.
- Data blue: `#2e6bff`; soft blue: `#dcecff`.
- Gold: `#f4c95d`.
- Risk rose: `#e23b5d`.
- Borders: `rgba(8, 32, 55, 0.12)`.

Shape:
- Cards and panels: 8px radius for repeated cards, 14-18px for larger glass panels.
- Buttons: pill primary actions, fixed 36-44px icon/utility controls.
- Avoid cards inside cards. Page sections are full-width white/glass bands or unframed constrained layouts.

Motion:
- Page entries: 250-400ms ease-out, opacity plus translateY 10-18px.
- Grid stagger: 30-50ms per related item, lead with the primary CTA or title.
- Hover: 120-180ms transform and shadow only.
- Ambient orbit/scan motion is allowed for hero and product visuals; all motion must obey `prefers-reduced-motion`.

## Component Patterns
- `Wordmark`: iconic liquid-glass V formed from a helix/orbit stroke and a single signal dot. It must work at favicon, app icon, top-nav, and hero sizes.
- `TopBar`: compact frosted navigation with the wordmark, breadcrumb, status dot, and one module label. No personal profile metaphors.
- `btn-plush`, `chip`, `plush`, `plush-lg`, `glass-panel`: legacy class names remapped to bright glass for compatibility.
- `ClinicalOrbitVisual`: procedural holographic sphere used as the brand/product visual. It can show patient, AI attending, rubric, and compute nodes without external assets.
- Training surfaces: operational and scan-friendly. Use clean case cards, specialty chips, vital tiles, fixed-format controls, and readable chart surfaces.

## Copy Rules
- Always include training-only safety posture on public surfaces: "synthetic cases" and "not clinical advice."
- Future AI doctors, robotics, data collection, and decentralized compute must be framed as consent-first R&D roadmap, not current clinical capability.
- Keep marketing copy short. Use visuals, metrics, and product-state labels instead of large internal explanations.
- Avoid internal-only phrasing, unverifiable clinical claims, and "AI slop" language in product copy.

## QA Rules
- Verify desktop and mobile widths before claiming visual completion.
- Check that text never clips inside buttons, chips, cards, or nav.
- Ensure the first viewport on launch shows the product and hints at the next section.
- Keep 3D/canvas visuals stable and nonblank; support reduced motion.
