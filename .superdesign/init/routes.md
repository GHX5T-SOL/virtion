# Routes

Status date: 2026-05-18

Fizer is a Vite SPA. Routes are mostly internal store screens, but these URL paths matter for the current work.

## Active URLs

- `/`: Fizer landing page. `Start Simulation` should route straight to the control room.
- `/encounter`: default Zoro v43 scene in the Fizer encounter shell.
- `/encounter?scene=legacy`: legacy scene fallback/comparison.
- `/review/index.html`: local evidence gallery.
- `/agent/*`: proxied to backend by Vite/dev middleware.
- `/voice/*`: proxied to backend by Vite/dev middleware.

## Internal Screen

`encounter` is rendered by `src/components/EncounterScreen.tsx`. It must remain the owner of app flow, HUD, keyboard handlers, Examine, voice fallback, and end-consultation.

The main learner flow now skips the old module picker and uses `gpRoom` as the Fizer control room.
