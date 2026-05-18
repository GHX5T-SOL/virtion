# Fizer Design System

Status date: 2026-05-18

## Product Context

Fizer is the rebranded 3D clinical simulation experience. The current product is a training-only simulator for synthetic patient consultations: accept a chart, enter the 3D clinic, examine, order investigations, diagnose, prescribe, and complete a structured debrief.

The visible product flow is intentionally short:

- Launch: show the Fizer identity and one primary `Start Simulation` action.
- Control room: accept the next patient or open `Pick from Charts`.
- Chart browser: choose a synthetic case without low-poly patient mascots.
- Brief: read the doorway summary and enter the 3D clinic.
- Encounter: preserve the existing 3D clinic scene and HUD while using Fizer styling for overlays.
- Debrief: show structured feedback and return to the 3D clinic control room.

Do not reintroduce the old `See the Platform` CTA, the module picker, or visible "Polyclinic" language in the main learner flow.

## Visual Direction

Theme: premium clinical software with deep navy, cyan, teal, glass, and white. The interface should feel polished, focused, and operational rather than like a landing-page pitch. Use dense but readable information layouts, clean cards, clear hierarchy, and restrained motion. Avoid low-quality generated props, procedural filler, cartoon patient thumbnails, and marketing-heavy copy.

Signature colors:

- Fizer navy: `#061431`
- Fizer blue: `#173f8f`
- Fizer cyan: `#18c7e8`
- Fizer teal: `#37d6dd`
- Fizer ice: `#f5fbff`

## Tokens

Fonts:

- Primary: Inter, system-ui, sans-serif.
- Display: Sora, Inter, system-ui, sans-serif.
- Numeric/technical: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace.

Colors:

- Canvas: `#f5fbff`, `#ffffff`, `#eaf6fb`.
- Deep ink: `#061431`; secondary ink: `#526579`; soft ink: `#7c91a7`.
- Glass: `rgba(255, 255, 255, 0.78)` and `rgba(255, 255, 255, 0.92)`.
- Primary: `#173f8f`; accent: `#18c7e8`; soft accent: `#d9f8ff`.
- Success: `#00a67e`; warning: `#f4c95d`; risk: `#e23b5d`.
- Borders: `rgba(7, 20, 49, 0.12)`.

Shape:

- Cards: 8px radius for repeated cards.
- Larger panels: 14px to 18px radius.
- Buttons: pill primary actions; compact controls stay fixed height.
- Avoid cards inside cards unless the nested element is an individual repeated item.

Motion:

- Page entry: 250ms to 360ms ease-out.
- Hover: 120ms to 180ms transform and shadow.
- Encounter scene motion remains unchanged.
- Respect `prefers-reduced-motion`.

## Component Patterns

- `Wordmark`: use `/fizer_logo.png` in top bars and hero contexts.
- Favicon/app mark: use `/fizer_favicon.png`.
- `TopBar`: compact frosted navigation with Fizer identity, breadcrumb, encounter status, and avatar mark.
- `fizer-button`: primary and quiet actions for all new flow screens.
- `fizer-panel`: white/glass operational surfaces.
- `fizer-panel-dark`: navy control surfaces for priority actions.
- `fizer-chart-avatar`: initials/status identity stamp for patient cards. Do not use the old low-poly patient faces.
- `fizer-exam`: Fizer-styled examination overlay while preserving the existing clinical tab logic.
- `fizer-hero-stage`: interactive splash hero scene built from CSS layers, pointer-reactive room perspective, diagnostic orbits, and Fizer status strips. It replaces the old static preview card without adding heavyweight generated assets.
- `fizer-company`, `fizer-platform-card`, `fizer-network-panel`, and `fizer-roadmap-card`: homepage sections for the professional startup story, university education use case, future discipline expansion, and consent-first biomedical compute roadmap.
- Header treatment: learner screens use a transparent/frosted Fizer top bar that blends into the page or 3D scene backdrop, with the Fizer wordmark lockup, navy/cyan breadcrumb pill, and dark encounter status pill. Do not restore the old yellow active breadcrumb or any ambient-audio/background-music control. The homepage intentionally omits a repeated logo/header block so the headline sits higher.
- Examination overlay: the modal must render above the sticky header and fixed shell controls, keep the tab row visible at 1440x900, and constrain internal scrolling to the side rail/content panes rather than clipping the top of the dialog.

## Copy Rules

- Use "Fizer" for the product name.
- Use "3D clinic" for the room/encounter.
- Keep "synthetic" patient framing where public-facing.
- Do not show raw backend, LiveKit, token, or JSON errors in the UI.
- Do not expose internal agent names in the main learner flow.
- Keep action labels short and workflow-specific.

## QA Rules

- Verify homepage, control room, chart browser, brief, encounter, and examination overlay at desktop width.
- Check mobile width for the home and chart/control screens.
- Confirm `Start Simulation` skips the old module picker.
- Confirm the 3D clinic scene remains stable and nonblank.
- Confirm Fizer logo and favicon load from public assets.
- Build, test, verify, then push only after user approval. Ghost approved the 2026-05-18 Fizer redesign push to `main`.
