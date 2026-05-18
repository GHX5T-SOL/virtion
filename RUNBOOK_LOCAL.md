# Local Runbook

Status date: 2026-05-18

## Start

Terminal 1:

```bash
cd "/Users/mx/3D Clinic/virtion-web-production-mvp"
backend/.venv/bin/python backend/server.py
```

Terminal 2:

```bash
cd "/Users/mx/3D Clinic/virtion-web-production-mvp"
npm run dev -- --host 127.0.0.1 --port 5173
```

Open:

```text
http://127.0.0.1:5173/encounter
```

## Verify

```bash
cd "/Users/mx/3D Clinic/virtion-web-production-mvp"
npm run verify
npm test -- --run
npm run build
python3 -m py_compile backend/server.py backend/voice_agent.py backend/model_router.py
curl -sS http://127.0.0.1:8787/health
```

## Expected Local Voice State

Local LiveKit may be absent. That is acceptable for visual MVP work. The page must remain fallback-safe and must not show raw technical errors.

## Phase46 Screenshot Evidence

Use:

```text
review/screenshots/phase46-patient-avatar-assignment/
```

Acceptance view:

```text
1440x900 seated doctor POV
```

Required avatar proof:

1. female case with female avatar;
2. male case with male avatar;
3. patient switch changes/recycles the avatar;
4. idle and speaking animation states are visible;
5. HUD and room remain intact.

Known local caveat: local LiveKit env vars are absent, so `/voice/token` logs expected 500s in the browser console. This must not appear as raw technical text in the hero UI.

## Phase47 Avatar Review Evidence

Use:

```text
review/screenshots/phase47-avatar-scale-review/
```

Current visual truth:

1. patient names and gender-correct avatar assignment work;
2. avatars are too small;
3. avatars are standing, not seated;
4. no real visible patient chair is present;
5. `Press E` overlaps the lower body/contact zone;
6. `im-001` should be audited because it remained on `Loading patient...` during one fresh capture.

Next screenshot acceptance remains:

```text
1440x900 seated doctor POV
```

## Phase47 Partial Attempt Evidence

Use:

```text
review/screenshots/phase47-seated-avatar-scale-chair/
```

What changed:

1. donor chair restored;
2. scale raised;
3. `/encounter?case=<id>` deterministic QA added;
4. `im-001` loaded in final proof;
5. `Press E` moved.

Why it is still rejected:

1. patient does not look naturally seated on the actual chair;
2. chair/contact scale reads wrong;
3. legs are cut/hidden;
4. motion is rigid because the local clips are standing-only.

## Phase48 Rejected Evidence

Phase48 produced rejected direct-retarget evidence, not an accepted sample. The rejected/control evidence folder is:

```text
review/screenshots/phase48-seated-animated-asset-sample/
```

Required proof:

1. one high-quality seated animated Mpho Molefe (`im-001`) sample in `/encounter`;
2. strict female gender match and loose adult age-band/description match;
3. broad South African representation/ethnicity fit where the asset supports it;
4. visible chair contact and adult scale;
5. idle/listening/speaking motion;
6. provenance and license receipt before any bulk import.

Rejected current proof:

```text
mpho-quaternius-seated-idle-25s-1440x900.png
mpho-quaternius-seated-inspection.json
```

That screenshot shows the direct Quaternius runtime retarget collapsed across the chair. Keep Quaternius as source material only until offline retarget/bake proves a clean export.

Control proof after cleanup:

```text
mpho-after-preload-fix-1440x900.png
mpho-after-preload-fix-inspection.json
```

This confirms the active app no longer hangs on `Loading patient...` after the legacy eager preloads were removed and the actual Mpho avatar was preloaded first.

## Phase49 Prep Baseline

Use:

```text
review/screenshots/phase49-prep-review/
```

Historical rejected baseline:

1. Mpho Molefe (`im-001`) loads in the active route.
2. `rpm-local/female_3.glb` returns 200.
3. The chair is visible.
4. The patient is still not naturally seated on the chair.
5. Legs/feet are hidden or cut.
6. Listening/speaking motion still reads rigid.

Next accepted sample proof must be saved under:

```text
review/screenshots/phase49-mpho-mixamo-sample/
```

## Phase49 Accepted Mpho Mixamo Sample

Use:

```text
review/screenshots/phase49-mpho-mixamo-sample/
```

Current proof:

```text
mpho-mixamo-final-yloop-offset052-1440x900.png
mpho-mixamo-final-yloop-offset052-inspection.json
```

Current visual truth:

1. Mpho Molefe (`im-001`) resolves to `phase49-mpho-mixamo-sitting-talking`.
2. The user-supplied Mixamo FBX is converted to a 7.4 MB runtime GLB.
3. The embedded seated talking animation runs continuously.
4. The scene strips root translation so the avatar stays anchored.
5. The patient is adult-scale and lowered onto the chair with `PATIENT_POOL_VERTICAL_OFFSET = -0.52`.

Next pool proof should be saved under:

```text
review/screenshots/phase50-patient-pool/
```

## Phase50 Patient Pool

Use:

```text
review/screenshots/phase50-patient-pool/
```

Current proof:

```text
phase50-patient-pool-review.json
phase49-mpho-mixamo-sitting-talking-im-001-1440x900.png
patient-pool-female-black-im-004-1440x900.png
patient-pool-male-black-im-003-1440x900.png
patient-pool-female-white-card-002-1440x900.png
patient-pool-male-white-im-002-1440x900.png
patient-pool-female-indian-gi-003-1440x900.png
patient-pool-male-indian-card-009-1440x900.png
patient-pool-female-asian-endo-007-1440x900.png
patient-pool-male-asian-nsg-007-1440x900.png
motion-im-004-speaking-t1.png
motion-im-004-speaking-t2.png
```

Current visual truth:

1. Mpho remains on the accepted Phase49 Mixamo sample.
2. Eight seated Mixamo pool assets are mapped by gender and broad `avatarRace`.
3. Patients sit on the visible chair at adult scale.
4. Local LiveKit fallback remains expected.

## Phase51 Production Verification

After the approved `main` push, verify the Netlify live domain. Production LiveKit should be tested there because the missing local env vars are stored on Netlify.
