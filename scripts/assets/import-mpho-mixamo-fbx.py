import json
from pathlib import Path

import bpy
from mathutils import Vector


REPO_ROOT = Path(__file__).resolve().parents[2]
SOURCE_FBX = REPO_ROOT.parent / "patient_avatars" / "Sitting_Talking_female.fbx"
OUTPUT_DIR = REPO_ROOT / "public" / "assets" / "medical-suite" / "patients" / "phase49-mpho-mixamo"
OUTPUT_GLB = OUTPUT_DIR / "mpho-mixamo-sitting-talking.glb"
OUTPUT_METADATA = OUTPUT_DIR / "mpho-mixamo-sitting-talking-metadata.json"


def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()


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
    bpy.ops.object.mode_set(mode="OBJECT") if bpy.ops.object.mode_set.poll() else None
    bpy.ops.object.select_all(action="SELECT")
    armatures = [obj for obj in bpy.context.scene.objects if obj.type == "ARMATURE"]
    if armatures:
        bpy.context.view_layer.objects.active = armatures[0]
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    bpy.context.view_layer.update()


def export_glb() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(OUTPUT_GLB),
        export_format="GLB",
        export_animations=True,
        export_frame_range=True,
        export_apply=False,
        export_yup=True,
    )


def main() -> None:
    if not SOURCE_FBX.exists():
        raise FileNotFoundError(SOURCE_FBX)

    clear_scene()
    bpy.ops.import_scene.fbx(filepath=str(SOURCE_FBX), use_anim=True)
    normalize_transforms()

    actions = []
    for action in bpy.data.actions:
        if action.name.lower().startswith("mixamo"):
            action.name = "Mpho_Mixamo_Sitting_Talking"
        actions.append(
            {
                "name": action.name,
                "frameRange": [float(action.frame_range.x), float(action.frame_range.y)],
                "fcurves": len(getattr(action, "fcurves", [])),
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
    export_glb()

    metadata = {
        "phase": "PHASE49_MphoMixamoSample",
        "source": str(SOURCE_FBX),
        "output": str(OUTPUT_GLB),
        "sourceFileSizeBytes": SOURCE_FBX.stat().st_size,
        "outputFileSizeBytes": OUTPUT_GLB.stat().st_size,
        "objects": {
            "armatures": armatures,
            "meshes": meshes,
        },
        "actions": actions,
        "bounds": bounds,
        "notes": [
            "User-supplied Mixamo FBX for first-patient Mpho Molefe sample.",
            "Converted offline with Blender so the web app can load a GLB through the existing Three.js pipeline.",
            "No procedural avatar generation was used.",
        ],
    }
    OUTPUT_METADATA.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    print(json.dumps(metadata, indent=2))


if __name__ == "__main__":
    main()
