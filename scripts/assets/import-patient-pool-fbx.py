import json
import shutil
import subprocess
from pathlib import Path

import bpy
from mathutils import Vector


REPO_ROOT = Path(__file__).resolve().parents[2]
SOURCE_DIR = REPO_ROOT.parent / "patient_pool"
OUTPUT_DIR = REPO_ROOT / "public" / "assets" / "medical-suite" / "patients" / "patient-pool"
MANIFEST_PATH = OUTPUT_DIR / "patient-pool-manifest.json"


def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for action in list(bpy.data.actions):
        bpy.data.actions.remove(action)
    for mesh in list(bpy.data.meshes):
        bpy.data.meshes.remove(mesh)
    for armature in list(bpy.data.armatures):
        bpy.data.armatures.remove(armature)
    for material in list(bpy.data.materials):
        if material.users == 0:
            bpy.data.materials.remove(material)
    for image in list(bpy.data.images):
        if image.users == 0:
            bpy.data.images.remove(image)


def materialize_bounds() -> dict:
    bpy.context.view_layer.update()
    min_x = min_y = min_z = float("inf")
    max_x = max_y = max_z = float("-inf")
    mesh_count = 0
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH":
            continue
        mesh_count += 1
        for corner in obj.bound_box:
            world = obj.matrix_world @ Vector(corner)
            min_x = min(min_x, world.x)
            min_y = min(min_y, world.y)
            min_z = min(min_z, world.z)
            max_x = max(max_x, world.x)
            max_y = max(max_y, world.y)
            max_z = max(max_z, world.z)

    if mesh_count == 0:
        return {"meshCount": 0, "min": [0, 0, 0], "max": [0, 0, 0], "size": [0, 0, 0]}

    return {
        "meshCount": mesh_count,
        "min": [min_x, min_y, min_z],
        "max": [max_x, max_y, max_z],
        "size": [max_x - min_x, max_y - min_y, max_z - min_z],
    }


def normalize_transforms() -> None:
    if bpy.ops.object.mode_set.poll():
        bpy.ops.object.mode_set(mode="OBJECT")
    bpy.ops.object.select_all(action="SELECT")
    armatures = [obj for obj in bpy.context.scene.objects if obj.type == "ARMATURE"]
    if armatures:
        bpy.context.view_layer.objects.active = armatures[0]
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    bpy.context.view_layer.update()


def parse_source(source: Path) -> tuple[str, str]:
    stem = source.stem.lower()
    parts = stem.split("_")
    if len(parts) != 2 or parts[0] not in {"female", "male"}:
        raise ValueError(f"Patient pool source must be named like female_black.fbx: {source.name}")
    gender = "F" if parts[0] == "female" else "M"
    race = parts[1]
    if race not in {"black", "white", "indian", "asian"}:
        raise ValueError(f"Unsupported patient pool race in {source.name}")
    return gender, race


def action_fcurve_count(action: bpy.types.Action) -> int:
    layers = getattr(action, "layers", None)
    if layers is not None:
        try:
            return sum(len(strip.channelbag.fcurves) for layer in layers for strip in layer.strips if getattr(strip, "channelbag", None))
        except Exception:
            return 0
    return len(getattr(action, "fcurves", []))


def optimize_glb(raw_glb: Path, output_glb: Path) -> str:
    executable = shutil.which("gltf-transform")
    if executable is None:
        raw_glb.replace(output_glb)
        return "No gltf-transform binary found; raw Blender GLB kept"
    subprocess.run(
        [
            executable,
            "resize",
            str(raw_glb),
            str(output_glb),
            "--width",
            "1024",
            "--height",
            "1024",
        ],
        check=True,
        cwd=str(REPO_ROOT),
    )
    raw_glb.unlink(missing_ok=True)
    return "gltf-transform resize --width 1024 --height 1024"


def export_one(source: Path) -> dict:
    gender, race = parse_source(source)
    id_gender = "female" if gender == "F" else "male"
    asset_id = f"patient-pool-{id_gender}-{race}"
    output_glb = OUTPUT_DIR / f"{asset_id}.glb"
    raw_glb = OUTPUT_DIR / f"{asset_id}.raw.glb"
    metadata_path = OUTPUT_DIR / f"{asset_id}-metadata.json"

    clear_scene()
    bpy.ops.import_scene.fbx(filepath=str(source), use_anim=True)
    normalize_transforms()

    actions = []
    for action in bpy.data.actions:
        action.name = f"{asset_id}-sitting-talking"
        actions.append(
            {
                "name": action.name,
                "frameRange": [float(action.frame_range.x), float(action.frame_range.y)],
                "fcurves": action_fcurve_count(action),
            }
        )

    armatures = []
    meshes = []
    for obj in bpy.context.scene.objects:
        if obj.type == "ARMATURE":
            armatures.append(
                {
                    "name": obj.name,
                    "boneCount": len(obj.data.bones),
                    "animation": obj.animation_data.action.name if obj.animation_data and obj.animation_data.action else None,
                }
            )
        elif obj.type == "MESH":
            meshes.append({"name": obj.name, "materials": [mat.name for mat in obj.data.materials if mat]})

    bounds = materialize_bounds()
    bpy.ops.export_scene.gltf(
        filepath=str(raw_glb),
        export_format="GLB",
        export_animations=True,
        export_frame_range=True,
        export_apply=False,
        export_yup=True,
    )
    optimization = optimize_glb(raw_glb, output_glb)

    metadata = {
        "phase": "PHASE50_PatientPoolMixamo",
        "id": asset_id,
        "gender": gender,
        "race": race,
        "source": str(source),
        "output": str(output_glb),
        "sourceFileSizeBytes": source.stat().st_size,
        "outputFileSizeBytes": output_glb.stat().st_size,
        "objects": {
            "armatures": armatures,
            "meshes": meshes,
        },
        "actions": actions,
        "bounds": bounds,
        "optimization": optimization,
        "notes": [
            "User-supplied Mixamo FBX patient-pool asset.",
            "Already rigged with a seated talking Mixamo animation.",
            "Converted offline with Blender for web runtime GLB loading.",
            "No procedural avatar generation or retargeting was used.",
        ],
    }
    metadata_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    return {
        "id": asset_id,
        "gender": gender,
        "race": race,
        "source": str(source),
        "path": f"/assets/medical-suite/patients/patient-pool/{output_glb.name}",
        "metadata": f"/assets/medical-suite/patients/patient-pool/{metadata_path.name}",
        "sourceFileSizeBytes": source.stat().st_size,
        "outputFileSizeBytes": output_glb.stat().st_size,
        "actions": actions,
        "armatures": armatures,
        "meshCount": len(meshes),
        "bounds": bounds,
        "optimization": optimization,
    }


def main() -> None:
    if not SOURCE_DIR.exists():
        raise FileNotFoundError(SOURCE_DIR)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    sources = sorted(SOURCE_DIR.glob("*.fbx"))
    if not sources:
        raise FileNotFoundError(f"No FBX files found in {SOURCE_DIR}")
    manifest = {
        "phase": "PHASE50_PatientPoolMixamo",
        "sourceDir": str(SOURCE_DIR),
        "outputDir": str(OUTPUT_DIR),
        "assets": [export_one(source) for source in sources],
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
