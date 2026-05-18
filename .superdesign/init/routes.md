# Routes

Status date: 2026-05-14

Virtion is a Vite SPA. Routes are mostly internal store screens, but these URL paths matter for the current work.

## Active URLs

- `/encounter`: default Zoro v43 scene in the real Virtion encounter shell.
- `/encounter?scene=legacy`: legacy scene fallback/comparison.
- `/review/index.html`: local evidence gallery.
- `/agent/*`: proxied to backend by Vite/dev middleware.
- `/voice/*`: proxied to backend by Vite/dev middleware.

## Internal Screen

`encounter` is rendered by `src/components/EncounterScreen.tsx`. It must remain the owner of app flow, HUD, keyboard handlers, Examine, voice fallback, and end-consultation.

Phase48 avatar sample evidence should be saved under `review/screenshots/phase48-seated-animated-asset-sample/`.
