# Asset Manifest

Status date: 2026-05-18

This is a local prototype manifest, not commercial-license clearance.

## Runtime Payload

```text
306M public/assets
574M source-assets
```

The runtime payload is still large, but Phase51 removed the unused 182 MB public room GLB, switched `/encounter` to a 3.6 MB meshopt-compressed room GLB, removed the blocking HDRI load from the first render path, and recompressed the active Mixamo patient pool to sub-1.1 MB GLBs.

Phase52 added the Fizer rebrand assets and replaced the static splash card with a lightweight interactive CSS hero scene. No new heavy bitmap hero asset was introduced.

## Active Runtime Assets

| Asset | Path | Use |
| --- | --- | --- |
| Fizer logo | `public/fizer_logo.png` | Rebrand wordmark for splash and navigation |
| Fizer favicon | `public/fizer_favicon.png` | Browser favicon, app mark, and small in-UI brand mark |
| Zoro v43 room optimized | `public/assets/medical-suite/environment/v43/optimized/modern_office_clinic_art_target_v43-fast.glb` | Default `/encounter` room |
| v43 support assets | `public/assets/medical-suite/environment/v43/visual-upgrade-v11/` | Support textures/backplates; HDRI retained on disk but not loaded in the `/encounter` critical path |
| Phase34 patient | `public/assets/medical-suite/patients/phase34-patient/patient-unity-clean.glb` | Legacy/fallback patient |
| Zoro patient candidates | `public/assets/medical-suite/patients/zoro/` | Registered candidates/fallbacks |
| Local RPM avatars | `public/assets/medical-suite/patients/rpm-local/` | Active Phase46 patient avatar pool; Phase48 placeholders unless seated animation path is proven |
| Phase49 Mpho Mixamo sample | `public/assets/medical-suite/patients/phase49-mpho-mixamo/mpho-mixamo-sitting-talking.glb` | Accepted seated animated first-patient sample for Mpho Molefe (`im-001`) |
| Phase50 Mixamo patient pool | `public/assets/medical-suite/patients/patient-pool/` | Eight seated/talking patient assets mapped by gender and broad avatar race |
| RPM animation subset | `public/assets/medical-suite/animations/rpm/` | Active Phase46 standing idle/listening/speaking clips; not sufficient for final seated patients alone |
| Medical prop candidates | `public/assets/medical-suite/props/` | Available or future prop library |
| Canonical reference copy | `public/assets/medical-suite/reference/reference_Image.jpeg` | Review/reference only |

## Source Assets

```text
source-assets/handoffs/zoro-mx-3d-clinic-handoff-2026-05-12/
/Users/mx/3D Clinic/patient_avatars/Sitting_Talking_female.fbx
/Users/mx/3D Clinic/patient_pool/
```

Zoro handoff hash:

```text
462b1dc343d1abcef9b2dfdc2397f64ee9b00a68c046737e8b15b84d8abfd2c1
```

## Rejected Phase45 Asset Pass

The Phase45 procedural room-completion pass was rejected and rolled back. No imported runtime binary assets were added, and the rejected procedural components were removed from:

```text
src/components/three/ZoroV43PolyclinicScene.tsx
```

Removed rejected components:

1. `Phase45DeskComputer`
2. `DoctorDeskClinicalAssets`
3. `ClinicalRoomFixtures`

The rejected evidence folder was deleted:

```text
review/screenshots/phase45-room-completion/
```

## Local Ready Player Me Avatar Pool

Source folder:

```text
/Users/mx/3D Clinic/patient_avatars
```

Inspected local GLBs:

| File | Label | Size | Notes |
| --- | --- | ---: | --- |
| `female_1.glb` | F | 3.85 MB | 68-joint skin; 1 embedded `mixamo.com` animation |
| `female_2.glb` | F | 5.72 MB | 68-joint skin; no embedded animation |
| `female_3.glb` | F | 2.05 MB | 68-joint skin; no embedded animation; uses `KHR_materials_specular` |
| `female_4.glb` | F | 4.86 MB | 68-joint skin; no embedded animation |
| `female_5.glb` | F | 4.86 MB | 68-joint skin; no embedded animation |
| `female_6.glb` | F | 3.74 MB | 68-joint skin; no embedded animation |
| `male_1.glb` | M | 2.27 MB | 68-joint skin; no embedded animation |
| `male_2.glb` | M | 2.55 MB | 68-joint skin; no embedded animation; uses `KHR_materials_specular` |
| `male_3.glb` | M | 25.49 MB | 98-joint skin; 9 embedded gesture clips; has morph meshes |
| `male_4.glb` | M | 2.89 MB | 68-joint skin; no embedded animation; uses `KHR_materials_specular` |
| `male_5.glb` | M | 2.03 MB | 68-joint skin; no embedded animation; uses `KHR_materials_specular` |

These assets are integrated into the runtime scene. All 11 are copied into the runtime folder and audited; `female_1.glb` is excluded from the active resolver because it rendered with an inverted/bad pose in browser QA. They are acceptable identity placeholders, but they are not a complete final seated-patient solution without real seated animations.

## Phase49 Mixamo Mpho Sample

Accepted local sample:

```text
source: /Users/mx/3D Clinic/patient_avatars/Sitting_Talking_female.fbx
runtime: public/assets/medical-suite/patients/phase49-mpho-mixamo/mpho-mixamo-sitting-talking.glb
metadata: public/assets/medical-suite/patients/phase49-mpho-mixamo/mpho-mixamo-sitting-talking-metadata.json
registryId: phase49-mpho-mixamo-sitting-talking
case: im-001 / Mpho Molefe / F / age 34
```

Conversion and optimization:

```text
scripts/assets/import-mpho-mixamo-fbx.py
source size: 59,709,264 bytes
runtime size: 7,749,612 bytes
optimization: gltf-transform resize --width 1024 --height 1024
```

Source/provenance notes:

1. This was a user-supplied Mixamo FBX, not a procedurally generated character.
2. The FBX contains one 65-bone armature, six meshes, and one embedded Mixamo animation.
3. The runtime scene strips the clip to anchored rotation tracks so root translation does not make the patient float or jump into the sky.
4. Adobe's Mixamo FAQ says Mixamo characters and animations can be used royalty-free in games and other projects, but this manifest is still prototype provenance, not final legal clearance for public release.
5. Public release should retain provenance and confirm redistribution/package terms before pushing source assets.

Visual proof:

```text
review/screenshots/phase49-mpho-mixamo-sample/mpho-mixamo-final-yloop-offset052-1440x900.png
review/screenshots/phase49-mpho-mixamo-sample/mpho-mixamo-final-yloop-offset052-inspection.json
```

Runtime avatar path:

```text
public/assets/medical-suite/patients/rpm-local/
```

Runtime RPM animation subset:

```text
public/assets/medical-suite/animations/rpm/feminine/idle/F_Standing_Idle_001.glb
public/assets/medical-suite/animations/rpm/feminine/idle/F_Standing_Idle_Variations_001.glb
public/assets/medical-suite/animations/rpm/feminine/expression/F_Talking_Variations_001.glb
public/assets/medical-suite/animations/rpm/masculine/idle/M_Standing_Idle_001.glb
public/assets/medical-suite/animations/rpm/masculine/idle/M_Standing_Idle_Variations_001.glb
public/assets/medical-suite/animations/rpm/masculine/expression/M_Talking_Variations_001.glb
```

Source:

```text
/Users/mx/3D Clinic/tools/external/readyplayerme-animation-library-phase46
https://github.com/readyplayerme/animation-library
```

Service caveat:

```text
https://readyplayer.me/
```

Ready Player Me's official service page says the service was discontinued on 2026-01-31. Existing local GLBs and already downloaded animation-library files can remain source assets, but do not plan future avatar creation around a live RPM API.

Receipt:

```text
review/screenshots/phase46-patient-avatar-assignment/avatar-audit.json
```

Any future imported asset must include:

| Field | Required |
| --- | --- |
| Source URL | Yes |
| Author/creator | Yes, if available |
| License | Yes |
| Original file path | Yes, in `source-assets/` |
| Runtime file path | Yes, under `public/assets/medical-suite/props/` or another deliberate runtime folder |
| Size before/after | Yes |
| Optimization notes | Yes |
| Scene placement notes | Yes |

## Quality Rule

Do not use procedurally generated filler assets for this project. Future room improvements must use high-quality reviewed 3D assets with provenance, or the scene should remain unchanged until such assets are available.

Fresh Phase47 visual review found the current active avatar presentation is not acceptable yet:

```text
review/screenshots/phase47-avatar-scale-review/
```

Blocking avatar issues from the first review:

1. active avatars are too small;
2. active avatars are standing, not seated;
3. the visible consultation chair is missing;
4. `im-001` can remain on `Loading patient...`;
5. `Press E` overlaps the lower body/contact zone.

Partial Phase47 follow-up evidence:

```text
review/screenshots/phase47-seated-avatar-scale-chair/
```

That pass restored the donor chair, increased avatar scale, improved `im-001` loading, and moved `Press E`, but it is still rejected. The avatar does not sit naturally on the actual chair, the chair/contact scale reads wrong, legs are hidden/cut, and the motion is rigid because the local clips are standing-only.

Phase50 asset requirement:

1. Preserve Mpho Molefe (`im-001`) on the accepted Mixamo sample.
2. Add only one to three new high-quality seated animated samples at a time.
3. Strictly match case gender.
4. Loosely match adult age band and patient description where the asset supports it.
5. Broadly represent South African identity/ethnicity cues respectfully, without claiming exact matching from a small pool.
6. Use real seated idle/listening/speaking animation or a better rigged seated character source.
7. Record provenance, license, source URL, file paths, size, and optimization notes before adding to the runtime path.

Phase48 candidate review:

```text
source-assets/phase48-candidate-quaternius-universal-animation-library/
```

Quaternius Universal Animation Library Standard was downloaded as a source candidate. The included `License.txt` marks it CC0 1.0 Universal, and inspection found `Sitting_Idle_Loop` plus `Sitting_Talking_Loop`. Direct runtime retargeting onto `rpm-local-female-3` failed visually, so the public runtime copy was removed. Keep this pack as source material only until an offline Blender/Unity/Unreal retarget-and-bake pass produces an acceptable exported sample.

Runtime preload note: the active Zoro scene now preloads `phase49-mpho-mixamo-sitting-talking` for `im-001`. Legacy `Polyclinic.tsx` eager preloads were disabled because they loaded heavy old assets and the wrong old `im-001` model on the active route.

Exact Quaternius source files:

```text
source-assets/phase48-candidate-quaternius-universal-animation-library/extracted/Universal Animation Library[Standard]/Unreal-Godot/UAL1_Standard.glb
source-assets/phase48-candidate-quaternius-universal-animation-library/extracted/Universal Animation Library[Standard]/Unity/UAL1_Standard.fbx
source-assets/phase48-candidate-quaternius-universal-animation-library/extracted/Universal Animation Library[Standard]/License.txt
```

Phase49 prep evidence:

```text
review/screenshots/phase49-prep-review/
```

This evidence confirms the active app is recovered and Mpho loads, but it is not accepted visual proof. The avatar still does not sit naturally on the chair, lower legs/feet are hidden or cut, and motion is too rigid.

Phase49 accepted evidence:

```text
review/screenshots/phase49-mpho-mixamo-sample/
```

This evidence supersedes the prep baseline for Mpho. The accepted sample is seated, animated, adult-scale, and lowered onto the chair.

## Phase50 Mixamo Patient Pool

Source:

```text
/Users/mx/3D Clinic/patient_pool
```

Runtime:

```text
public/assets/medical-suite/patients/patient-pool/
```

Conversion:

```text
scripts/assets/import-patient-pool-fbx.py
```

Runtime files:

| Runtime GLB | Approx size | Mapping |
| --- | ---: | --- |
| `patient-pool-female-black.glb` | 864 KB | F / black |
| `patient-pool-female-white.glb` | 1.0 MB | F / white |
| `patient-pool-female-indian.glb` | 1.0 MB | F / indian |
| `patient-pool-female-asian.glb` | 832 KB | F / asian |
| `patient-pool-male-black.glb` | 608 KB | M / black |
| `patient-pool-male-white.glb` | 1.1 MB | M / white |
| `patient-pool-male-indian.glb` | 1.1 MB | M / indian |
| `patient-pool-male-asian.glb` | 952 KB | M / asian |

Each runtime GLB has a matching metadata JSON and is included in `patient-pool-manifest.json`.

Source/provenance notes:

1. These are user-supplied Mixamo FBXs, not procedural characters.
2. Local Blender audit found one 65-bone Mixamo armature and one embedded seated/talking action per source FBX.
3. Textures were resized to 1024 px during conversion, then Phase51 recompressed runtime GLBs with meshopt and WebP texture payloads for Netlify load time.
4. Public/commercial clearance still needs explicit user/license review before claims beyond prototype/MVP use.

Visual proof:

```text
review/screenshots/phase50-patient-pool/
docs/VISUAL_REVIEW_PHASE50_PATIENT_POOL.md
```

Later backlog after the Mpho avatar sample is approved:

1. Better desk computer/monitor with stand/base, keyboard and mouse if available.
2. Small medical desk props such as stethoscope, BP cuff, otoscope/ophthalmoscope, sanitizer, prescription pad, pen, or pulse oximeter.
3. Wall/room fixtures such as anatomical poster, eye chart, diplomas, wall diagnostic set, sharps bin, cabinet/cart, sink, clock, exam light, or a replacement bed if it is a clear upgrade.

Meshy spend requires explicit cost approval before generation. The rejected Phase45 pass spent no Meshy credits and made no Sketchfab/external downloads.

## Current Large Asset Risk

```text
18M public/assets/medical-suite/patients/phase34-patient/patient-unity-clean.glb
17M public/assets/medical-suite/patients/phase34-patient/patient-unity-clean.fbx
14M public/assets/medical-suite/props/stethoscope/stethoscope-unity-clean.glb
14M public/assets/medical-suite/props/desk-clutter/desk-clutter-unity-clean.glb
12M public/assets/medical-suite/props/pulse-oximeter/pulse-oximeter-unity-clean.glb
```

Do not run optimization that renames GLB nodes until required scene anchors are verified.

Before Netlify push, remove or offload large public files. Netlify currently warns that files over 10 MB are not well-supported and may fail deploy:

```text
https://docs.netlify.com/build/configure-builds/troubleshooting-tips/#large-files-or-sites
```

This manifest is not production license clearance.
