import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Html, RoundedBox, useGLTF } from '@react-three/drei';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { Group } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';
import type { ConversationStatus } from '../../voice/conversation';
import { useGameState, POLYCLINIC_BED_INDEX } from '../../game/store';
import type { PatientCase } from '../../game/types';
import { FloatingVoicePanel } from './FloatingVoicePanel';
import { interactionBus } from './interactions';
import { getPatientIdentity } from '../../data/cases';
import {
  findMedicalSuitePatientModelById,
  getRpmAnimationClipSet,
  LOCAL_RPM_PATIENT_MODELS,
  pickMedicalSuitePatientModel,
  RPM_PATIENT_ANIMATION_CLIPS,
  type RpmAnimationClipSet,
} from '../../data/medicalSuiteModelRegistry';

const OFFICE_SHELL_GLB = '/assets/medical-suite/environment/v43/optimized/modern_office_clinic_art_target_v43-fast.glb';
const OFFICE_HDRI = '/assets/medical-suite/environment/v43/visual-upgrade-v11/hdr/garden_nook_2k.hdr';
const OFFICE_ROOT_SCALE = 2.5;
const CAMERA_SEATED_EYE_HEIGHT = 1.52;
const CAMERA_FOV = 45;
const CAMERA_DESK_PUSH = 0.56;
const LOOK_SENSITIVITY = 0.0025;
const LOOK_DAMPING = 0.18;
const MAX_LOOK_PITCH = THREE.MathUtils.degToRad(25);
const MAX_LOOK_YAW_DELTA = THREE.MathUtils.degToRad(70);
const PATIENT_BASE_YAW = -Math.PI / 2;
const PATIENT_VISUAL_HEIGHT = 2.34;
const PATIENT_RPM_VISUAL_HEIGHT = 3.05;
const PATIENT_POOL_SEATED_VISUAL_HEIGHT = 3.82;
const PATIENT_VISUAL_FORWARD_OFFSET = 0.62;
const PATIENT_POOL_TOWARD_DOCTOR_OFFSET = 0.95;
const PATIENT_POOL_VERTICAL_OFFSET = -0.52;
const PATIENT_GROUND_Y_OFFSET = 0.012;
const PATIENT_IDLE_Y_AMPLITUDE = 0.002;

type GLTFScene = {
  scene: Group;
  animations: THREE.AnimationClip[];
};

type CameraRig = {
  position: THREE.Vector3;
  lookTarget: THREE.Vector3;
  initialYaw: number;
  initialPitch: number;
  patientSeat: THREE.Vector3;
  patientHead: THREE.Vector3;
  monitorScreen: THREE.Object3D | null;
  anchorValid: boolean;
};

declare global {
  interface Window {
    __officeShellV10?: {
      camera: [number, number, number];
      yaw: number;
      pitch: number;
      anchorValid: boolean;
    };
  }
}

function isMesh(node: THREE.Object3D): node is THREE.Mesh {
  return (node as THREE.Mesh & { isMesh?: boolean }).isMesh === true;
}

function materialsOf(mesh: THREE.Mesh): THREE.Material[] {
  return Array.isArray(mesh.material) ? mesh.material : [mesh.material];
}

function boxOf(object: THREE.Object3D): THREE.Box3 {
  object.updateWorldMatrix(true, true);
  return new THREE.Box3().setFromObject(object);
}

function centerOf(object: THREE.Object3D): THREE.Vector3 {
  return boxOf(object).getCenter(new THREE.Vector3());
}

function requireObject(root: THREE.Object3D, name: string): THREE.Object3D {
  const found = root.getObjectByName(name);
  if (!found) throw new Error(`Zoro v43 scene missing required GLB node: ${name}`);
  return found;
}

function tuneMaterial(material: THREE.Material) {
  const named = material.name.toLowerCase();
  if (
    named.includes('glass') ||
    named.includes('window') ||
    named.includes('wall') ||
    named.includes('plaster') ||
    named.includes('floor') ||
    named.includes('backdrop')
  ) {
    material.side = THREE.DoubleSide;
  }
  if (material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshPhysicalMaterial) {
    if (named.includes('wood_floor')) {
      material.roughness = Math.min(1, material.roughness * 1.25);
      material.envMapIntensity = 0.35;
    }
    if (named.includes('plaster') || named.includes('wall')) {
      material.roughness = Math.max(0.72, material.roughness);
    }
    if (named.includes('screen')) {
      material.emissive = new THREE.Color('#071421');
      material.emissiveIntensity = 0.22;
      material.roughness = Math.min(0.35, material.roughness);
    }
  }
  material.needsUpdate = true;
}

function baseBoneName(name: string): string {
  return name.replace(/_\d+$/, '').toLowerCase();
}

const RPM_UPPER_BODY_BONES = new Set(['spine', 'spine1', 'spine2', 'neck', 'head']);

function buildNodeNameMap(root: THREE.Object3D): Map<string, string> {
  const map = new Map<string, string>();
  root.traverse((node) => {
    if (node.name) {
      const key = baseBoneName(node.name);
      if (!map.has(key)) map.set(key, node.name);
    }
  });
  return map;
}

function cloneRetargetedUpperBodyClip(clip: THREE.AnimationClip, root: THREE.Object3D): THREE.AnimationClip | null {
  const nodeMap = buildNodeNameMap(root);
  const tracks: THREE.KeyframeTrack[] = [];
  for (const track of clip.tracks) {
    const dot = track.name.lastIndexOf('.');
    if (dot <= 0) continue;
    const nodePath = track.name.slice(0, dot);
    const propertyPath = track.name.slice(dot);
    const nodeParts = nodePath.split('/');
    const sourceName = nodeParts[nodeParts.length - 1];
    const baseName = baseBoneName(sourceName);
    if (!RPM_UPPER_BODY_BONES.has(baseName)) continue;
    const targetName = nodeMap.get(baseName);
    if (!targetName) continue;
    const nextTrack = track.clone();
    nextTrack.name = [...nodeParts.slice(0, -1), targetName].filter(Boolean).join('/') + propertyPath;
    tracks.push(nextTrack);
  }
  if (tracks.length === 0) return null;
  return new THREE.AnimationClip(clip.name, clip.duration, tracks);
}

type RpmClinicPoseBone =
  | 'hips'
  | 'leftshoulder'
  | 'rightshoulder'
  | 'leftarm'
  | 'rightarm'
  | 'leftforearm'
  | 'rightforearm'
  | 'leftupleg'
  | 'rightupleg'
  | 'leftleg'
  | 'rightleg'
  | 'leftfoot'
  | 'rightfoot';

type RpmClinicPoseRig = {
  bones: Partial<Record<RpmClinicPoseBone, THREE.Object3D>>;
  rotations: Map<THREE.Object3D, THREE.Euler>;
  positions: Map<THREE.Object3D, THREE.Vector3>;
};

const RPM_CLINIC_POSE_BONES: RpmClinicPoseBone[] = [
  'hips',
  'leftshoulder',
  'rightshoulder',
  'leftarm',
  'rightarm',
  'leftforearm',
  'rightforearm',
  'leftupleg',
  'rightupleg',
  'leftleg',
  'rightleg',
  'leftfoot',
  'rightfoot',
];

function findBone(root: THREE.Object3D, baseName: string): THREE.Object3D | undefined {
  let found: THREE.Object3D | undefined;
  root.traverse((node) => {
    if (!found && node.name && baseBoneName(node.name) === baseName) found = node;
  });
  return found;
}

function buildRpmClinicPoseRig(root: THREE.Object3D): RpmClinicPoseRig {
  const bones: Partial<Record<RpmClinicPoseBone, THREE.Object3D>> = {};
  const rotations = new Map<THREE.Object3D, THREE.Euler>();
  const positions = new Map<THREE.Object3D, THREE.Vector3>();
  for (const boneName of RPM_CLINIC_POSE_BONES) {
    const bone = findBone(root, boneName);
    if (!bone) continue;
    bones[boneName] = bone;
    rotations.set(bone, bone.rotation.clone());
    positions.set(bone, bone.position.clone());
  }
  return { bones, rotations, positions };
}

function applyRotationDelta(
  rig: RpmClinicPoseRig,
  boneName: RpmClinicPoseBone,
  delta: Partial<Record<'x' | 'y' | 'z', number>>,
) {
  const bone = rig.bones[boneName];
  if (!bone) return;
  const base = rig.rotations.get(bone);
  if (!base) return;
  bone.rotation.set(
    base.x + (delta.x ?? 0),
    base.y + (delta.y ?? 0),
    base.z + (delta.z ?? 0),
    base.order,
  );
}

function applyPositionDelta(
  rig: RpmClinicPoseRig,
  boneName: RpmClinicPoseBone,
  delta: Partial<Record<'x' | 'y' | 'z', number>>,
) {
  const bone = rig.bones[boneName];
  if (!bone) return;
  const base = rig.positions.get(bone);
  if (!base) return;
  bone.position.set(
    base.x + (delta.x ?? 0),
    base.y + (delta.y ?? 0),
    base.z + (delta.z ?? 0),
  );
}

function applyRpmClinicPose(rig: RpmClinicPoseRig) {
  applyPositionDelta(rig, 'hips', { y: -0.06, z: -0.015 });

  applyRotationDelta(rig, 'leftshoulder', { z: 0.12 });
  applyRotationDelta(rig, 'rightshoulder', { z: -0.12 });
  applyRotationDelta(rig, 'leftarm', { x: -0.12, z: 0.62 });
  applyRotationDelta(rig, 'rightarm', { x: -0.12, z: -0.62 });
  applyRotationDelta(rig, 'leftforearm', { x: -0.08, z: 0.42 });
  applyRotationDelta(rig, 'rightforearm', { x: -0.08, z: -0.42 });

  applyRotationDelta(rig, 'leftupleg', { x: 1.12, y: 0.04, z: 0.03 });
  applyRotationDelta(rig, 'rightupleg', { x: 1.12, y: -0.04, z: -0.03 });
  applyRotationDelta(rig, 'leftleg', { x: -1.24 });
  applyRotationDelta(rig, 'rightleg', { x: -1.24 });
  applyRotationDelta(rig, 'leftfoot', { x: -0.22 });
  applyRotationDelta(rig, 'rightfoot', { x: -0.22 });
}

function prepareOfficeShell(root: THREE.Group) {
  root.scale.setScalar(OFFICE_ROOT_SCALE);
  root.updateWorldMatrix(true, true);

  requireObject(root, 'Window_Table_0');
  requireObject(root, 'Window_Chair_0');
  requireObject(root, 'Clinic_Patient_Chair_0');
  requireObject(root, 'Window_Structure_0');
  requireObject(root, 'Window_Window_0');
  requireObject(root, 'Clinic_Desk_Monitor_0');
  requireObject(root, 'Clinic_Acer_Monitor_Screen_Object_5');

  root.traverse((node) => {
    node.castShadow = true;
    node.receiveShadow = true;
    if (!isMesh(node)) return;
    node.frustumCulled = false;
    for (const material of materialsOf(node)) tuneMaterial(material);
  });

  const originalPainting = root.getObjectByName('Window_Painting_0');
  if (originalPainting) originalPainting.visible = false;
  const originalPlant = root.getObjectByName('Window_Plant_0');
  const upgradedPlant = root.getObjectByName('Clinic_Polyhaven_Potted_Plant_0');
  if (originalPlant && upgradedPlant) originalPlant.visible = false;
  const originalTableDecoration = root.getObjectByName('Window_Table Decoration_0');
  if (originalTableDecoration) originalTableDecoration.visible = false;

  const donorPatientChair = root.getObjectByName('Clinic_Patient_Chair_0');
  if (donorPatientChair) donorPatientChair.visible = true;
  const donorPatientShadow = root.getObjectByName('Clinic_Patient_Chair_Soft_Contact_Shadow_0');
  if (donorPatientShadow) donorPatientShadow.visible = true;
  const donorDeskMonitor = root.getObjectByName('Clinic_Desk_Monitor_0');
  if (donorDeskMonitor) donorDeskMonitor.visible = false;
  root.traverse((node) => {
    if (node.name.startsWith('Clinic_Acer_Monitor')) node.visible = false;
  });
}

function computeCameraRig(root: THREE.Object3D): CameraRig {
  const table = requireObject(root, 'Window_Table_0');
  const chair = requireObject(root, 'Window_Chair_0');
  const patientChair = requireObject(root, 'Clinic_Patient_Chair_0');
  const structure = requireObject(root, 'Window_Structure_0');

  const roomBox = boxOf(structure);
  const tableBox = boxOf(table);
  const chairCenter = centerOf(chair);
  const tableCenter = centerOf(table);
  const patientBox = boxOf(patientChair);
  const patientCenter = patientBox.getCenter(new THREE.Vector3());
  const monitorScreen = root.getObjectByName('Clinic_Acer_Monitor_Screen_Object_5');
  const chairToDesk = tableCenter.clone().sub(chairCenter).setY(0).normalize();
  const position = chairCenter.clone().addScaledVector(chairToDesk, CAMERA_DESK_PUSH);
  position.y = Math.min(roomBox.max.y - 0.12, Math.max(roomBox.min.y + CAMERA_SEATED_EYE_HEIGHT, tableBox.max.y + 1.18));

  const patientHead = new THREE.Vector3(patientCenter.x, patientBox.max.y + 1.05, patientCenter.z);
  const lookTarget = new THREE.Vector3(patientCenter.x, Math.max(tableBox.max.y + 0.35, patientBox.max.y + 0.62), patientCenter.z);
  const camera = new THREE.PerspectiveCamera();
  camera.position.copy(position);
  camera.lookAt(lookTarget);
  camera.rotation.reorder('YXZ');

  table.visible = false;

  return {
    position,
    lookTarget,
    initialYaw: camera.rotation.y,
    initialPitch: camera.rotation.x + THREE.MathUtils.degToRad(-0.75),
    patientSeat: new THREE.Vector3(patientCenter.x, patientBox.min.y + 0.03, patientCenter.z + 0.02),
    patientHead,
    monitorScreen: monitorScreen ?? null,
    anchorValid: roomBox.containsPoint(position) && lookTarget.clone().sub(position).dot(chairToDesk) > 0,
  };
}

function RendererContract() {
  const { gl } = useThree();
  useEffect(() => {
    gl.outputColorSpace = THREE.SRGBColorSpace;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 0.78;
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
  }, [gl]);
  return null;
}

function HdriEnvironment() {
  const hdri = useLoader(RGBELoader, OFFICE_HDRI) as THREE.DataTexture;
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const target = pmrem.fromEquirectangular(hdri);
    scene.environment = target.texture;
    return () => {
      if (scene.environment === target.texture) scene.environment = null;
      target.dispose();
      pmrem.dispose();
    };
  }, [gl, hdri, scene]);
  return null;
}

function FixedDragLookCamera({ rig }: { rig: CameraRig }) {
  const { camera, gl } = useThree();
  const initialized = useRef(false);
  const lockedPosition = useRef(new THREE.Vector3());
  const drag = useRef({
    yaw: 0,
    pitch: 0,
    targetYaw: 0,
    targetPitch: 0,
    pointerId: -1,
    lastX: 0,
    lastY: 0,
    dragging: false,
  });

  useLayoutEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    lockedPosition.current.copy(rig.position);
    const cam = camera as THREE.PerspectiveCamera;
    cam.position.copy(rig.position);
    cam.rotation.order = 'YXZ';
    cam.rotation.set(rig.initialPitch, rig.initialYaw, 0);
    cam.fov = CAMERA_FOV;
    cam.near = 0.05;
    cam.far = 100;
    cam.updateProjectionMatrix();
  }, [camera, rig]);

  useEffect(() => {
    const canvas = gl.domElement;
    canvas.style.cursor = 'grab';
    canvas.style.touchAction = 'none';
    const stopDrag = (event: PointerEvent) => {
      const state = drag.current;
      if (!state.dragging) return;
      state.dragging = false;
      state.pointerId = -1;
      canvas.style.cursor = 'grab';
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    };
    const onPointerDown = (event: PointerEvent) => {
      const state = drag.current;
      state.dragging = true;
      state.pointerId = event.pointerId;
      state.lastX = event.clientX;
      state.lastY = event.clientY;
      canvas.style.cursor = 'grabbing';
      canvas.setPointerCapture(event.pointerId);
    };
    const onPointerMove = (event: PointerEvent) => {
      const state = drag.current;
      if (!state.dragging || state.pointerId !== event.pointerId) return;
      const dx = event.clientX - state.lastX;
      const dy = event.clientY - state.lastY;
      state.targetYaw = THREE.MathUtils.clamp(state.targetYaw - dx * LOOK_SENSITIVITY, -MAX_LOOK_YAW_DELTA, MAX_LOOK_YAW_DELTA);
      state.targetPitch = THREE.MathUtils.clamp(state.targetPitch - dy * LOOK_SENSITIVITY, -MAX_LOOK_PITCH, MAX_LOOK_PITCH);
      state.lastX = event.clientX;
      state.lastY = event.clientY;
    };
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', stopDrag);
    canvas.addEventListener('pointerleave', stopDrag);
    canvas.addEventListener('pointercancel', stopDrag);
    return () => {
      canvas.style.cursor = '';
      canvas.style.touchAction = '';
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', stopDrag);
      canvas.removeEventListener('pointerleave', stopDrag);
      canvas.removeEventListener('pointercancel', stopDrag);
    };
  }, [gl]);

  useFrame(() => {
    const state = drag.current;
    state.yaw = THREE.MathUtils.lerp(state.yaw, state.targetYaw, LOOK_DAMPING);
    state.pitch = THREE.MathUtils.lerp(state.pitch, state.targetPitch, LOOK_DAMPING);
    const cam = camera as THREE.PerspectiveCamera;
    cam.position.copy(lockedPosition.current);
    cam.rotation.order = 'YXZ';
    cam.rotation.x = THREE.MathUtils.clamp(rig.initialPitch + state.pitch, rig.initialPitch - MAX_LOOK_PITCH, rig.initialPitch + MAX_LOOK_PITCH);
    cam.rotation.y = rig.initialYaw + state.yaw;
    cam.rotation.z = 0;
    window.__officeShellV10 = {
      camera: [Number(cam.position.x.toFixed(4)), Number(cam.position.y.toFixed(4)), Number(cam.position.z.toFixed(4))],
      yaw: Number(THREE.MathUtils.radToDeg(state.yaw).toFixed(2)),
      pitch: Number(THREE.MathUtils.radToDeg(state.pitch).toFixed(2)),
      anchorValid: rig.anchorValid,
    };
  });

  return null;
}

function usePatientOverviewTexture(patientName: string, age: number, complaint: string, status: string) {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 640;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = '#071522';
    ctx.fillRect(0, 0, 1024, 640);
    ctx.fillStyle = '#9eedff';
    ctx.font = '800 38px Inter, Arial';
    ctx.fillText('VIRTION POLYCLINIC', 42, 58);
    ctx.strokeStyle = 'rgba(84, 225, 255, 0.52)';
    ctx.lineWidth = 3;
    ctx.strokeRect(26, 26, 972, 588);
    ctx.fillStyle = 'rgba(76, 220, 255, 0.08)';
    ctx.fillRect(42, 92, 312, 492);
    ctx.fillRect(386, 92, 566, 132);
    ctx.fillRect(386, 256, 566, 328);
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 42px Inter, Arial';
    ctx.fillText(patientName, 74, 168);
    ctx.font = '700 24px Inter, Arial';
    ctx.fillStyle = '#b8d7e7';
    ctx.fillText(`${age} years`, 74, 210);
    ctx.fillText(complaint.slice(0, 31), 74, 248);
    ctx.fillStyle = '#7dffbf';
    ctx.fillText(`Status: ${status}`, 74, 294);
    const vitals = [['HR', '72'], ['BP', '120/80'], ['SpO2', '98'], ['RR', '14']];
    vitals.forEach(([label, value], i) => {
      const x = 420 + i * 128;
      ctx.fillStyle = '#8fb4c6';
      ctx.font = '700 18px Inter, Arial';
      ctx.fillText(label, x, 148);
      ctx.fillStyle = i === 1 ? '#ff8b9b' : '#7bffb8';
      ctx.font = '900 31px Inter, Arial';
      ctx.fillText(value, x, 188);
    });
    ctx.strokeStyle = '#55e6ff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let i = 0; i < 420; i++) {
      const x = 430 + i;
      const y = 395 + Math.sin(i * 0.08) * 24 + Math.sin(i * 0.29) * 8;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.fillStyle = '#d9f7ff';
    ctx.font = '700 25px Inter, Arial';
    ctx.fillText('Patient Overview', 412, 286);
    ctx.font = '600 20px Inter, Arial';
    ctx.fillStyle = '#b8d7e7';
    ctx.fillText('ECG pending  |  Troponin ordered  |  Chest X-ray pending', 412, 326);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    return texture;
  }, [age, complaint, patientName, status]);
}

function ApplyMonitorTexture({ screen, texture }: { screen: THREE.Object3D | null; texture: THREE.Texture | null }) {
  useEffect(() => {
    if (!screen || !texture || !isMesh(screen)) return;
    const original = screen.material;
    const replacement = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false });
    screen.material = replacement;
    return () => {
      replacement.dispose();
      screen.material = original;
    };
  }, [screen, texture]);
  return null;
}

function ZoroPatientActor({
  position,
  doctorPosition,
  status,
  caseData,
}: {
  position: THREE.Vector3;
  doctorPosition: THREE.Vector3;
  status: ConversationStatus;
  caseData: PatientCase;
}) {
  const group = useRef<Group>(null);
  const identity = getPatientIdentity(caseData.id);
  const model = findMedicalSuitePatientModelById(identity?.avatarId)
    ?? pickMedicalSuitePatientModel(caseData.id, caseData.gender, identity?.avatarRace);
  const useMixamoSeatedPatient = model.role === 'mixamo-seated-patient';
  const gltf = useGLTF(model.path) as unknown as GLTFScene;
  const avatarScene = useMemo(
    () => cloneSkeleton(gltf.scene) as Group,
    [gltf.scene],
  );
  const mixer = useMemo(() => new THREE.AnimationMixer(avatarScene), [avatarScene]);
  const clinicPoseRig = useMemo(() => buildRpmClinicPoseRig(avatarScene), [avatarScene]);
  const speaking = !useMixamoSeatedPatient && status === 'speaking';
  const thinking = !useMixamoSeatedPatient && status === 'thinking';
  const baseYaw = PATIENT_BASE_YAW;

  useLayoutEffect(() => {
    avatarScene.rotation.set(0, 0, 0);
    avatarScene.traverse((child) => {
      if (!isMesh(child)) return;
      child.frustumCulled = false;
      child.castShadow = true;
      child.receiveShadow = true;
      for (const material of materialsOf(child)) tuneMaterial(material);
    });
    const box = new THREE.Box3().setFromObject(avatarScene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const targetHeight = useMixamoSeatedPatient
      ? PATIENT_POOL_SEATED_VISUAL_HEIGHT
      : model.role === 'rpm-patient'
        ? PATIENT_RPM_VISUAL_HEIGHT
        : PATIENT_VISUAL_HEIGHT;
    const scale = size.y > 0 ? targetHeight / size.y : 1;
    avatarScene.position.set(-center.x, -box.min.y, -center.z);
    if (group.current) group.current.scale.setScalar(scale);
  }, [avatarScene, model.role, useMixamoSeatedPatient]);

  useEffect(() => () => {
    mixer.stopAllAction();
    mixer.uncacheRoot(avatarScene);
  }, [avatarScene, mixer]);

  useFrame(({ clock }, delta) => {
    mixer.update(delta);
    if (model.role === 'rpm-patient') applyRpmClinicPose(clinicPoseRig);
    if (!group.current) return;
    const t = clock.elapsedTime;
    const verticalOffset = useMixamoSeatedPatient ? PATIENT_POOL_VERTICAL_OFFSET : 0;
    const idleYOffset = useMixamoSeatedPatient ? 0 : Math.sin(t * 1.2) * PATIENT_IDLE_Y_AMPLITUDE;
    group.current.position.y = position.y + PATIENT_GROUND_Y_OFFSET + verticalOffset + idleYOffset;
    if (useMixamoSeatedPatient) {
      group.current.rotation.y = baseYaw;
      group.current.rotation.x = 0;
      return;
    }
    group.current.rotation.y = baseYaw + Math.sin(t * (speaking ? 1.7 : 0.45)) * (speaking ? 0.045 : 0.022);
    group.current.rotation.x = thinking ? Math.sin(t * 0.9) * 0.018 : 0;
  });

  const groupPosition = useMemo(() => {
    if (useMixamoSeatedPatient) {
      const towardDoctor = doctorPosition.clone().sub(position).setY(0).normalize();
      return position.clone().addScaledVector(towardDoctor, PATIENT_POOL_TOWARD_DOCTOR_OFFSET).add(new THREE.Vector3(0, PATIENT_GROUND_Y_OFFSET + PATIENT_POOL_VERTICAL_OFFSET, 0));
    }
    return new THREE.Vector3(position.x, position.y + PATIENT_GROUND_Y_OFFSET, position.z + PATIENT_VISUAL_FORWARD_OFFSET);
  }, [doctorPosition, position, useMixamoSeatedPatient]);

  return (
    <>
      <group ref={group} position={[groupPosition.x, groupPosition.y, groupPosition.z]} rotation={[0, baseYaw, 0]}>
        <primitive object={avatarScene} />
        <Suspense fallback={null}>
          {useMixamoSeatedPatient ? (
            <EmbeddedPatientAnimationController mixer={mixer} fallbackClips={gltf.animations} />
          ) : (
            <RpmPatientAnimationController
              avatarScene={avatarScene}
              mixer={mixer}
              fallbackClips={gltf.animations}
              gender={caseData.gender}
              status={status}
            />
          )}
        </Suspense>
      </group>
    </>
  );
}

function EmbeddedPatientAnimationController({
  mixer,
  fallbackClips,
}: {
  mixer: THREE.AnimationMixer;
  fallbackClips: THREE.AnimationClip[];
}) {
  const actionRef = useRef<THREE.AnimationAction | null>(null);
  const clip = useMemo(() => {
    const byPattern = (pattern: RegExp) => fallbackClips.find((candidate) => pattern.test(candidate.name));
    const source = byPattern(/talk|sitting|mixamo|layer/i) ?? fallbackClips[0];
    if (!source) return undefined;
    const anchoredTracks = source.tracks
      .filter((track) => track.name.endsWith('.quaternion'))
      .map((track) => track.clone());
    return new THREE.AnimationClip(`${source.name}-anchored-rotation`, source.duration, anchoredTracks);
  }, [fallbackClips]);

  useEffect(() => {
    if (!clip) return undefined;
    const next = mixer.clipAction(clip);
    const previous = actionRef.current;
    if (previous && previous !== next) previous.fadeOut(0.2);
    next.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(0.24).play();
    next.timeScale = 1;
    actionRef.current = next;
    return () => {
      next.fadeOut(0.12);
    };
  }, [clip, mixer]);

  return null;
}

function RpmPatientAnimationController({
  avatarScene,
  mixer,
  fallbackClips,
  gender,
  status,
  bakedClipSet,
}: {
  avatarScene: THREE.Object3D;
  mixer: THREE.AnimationMixer;
  fallbackClips: THREE.AnimationClip[];
  gender: 'M' | 'F';
  status: ConversationStatus;
  bakedClipSet?: RpmAnimationClipSet;
}) {
  const actionRef = useRef<THREE.AnimationAction | null>(null);
  const animationSet = bakedClipSet ?? getRpmAnimationClipSet(gender);
  const [idleGltf, listeningGltf, speakingGltf] = useGLTF([
    animationSet.idle,
    animationSet.listening,
    animationSet.speaking,
  ]) as unknown as GLTFScene[];
  const speaking = status === 'speaking';
  const thinking = status === 'thinking';
  const externalClips = useMemo(() => {
    const clips = [
      ...idleGltf.animations,
      ...listeningGltf.animations,
      ...speakingGltf.animations,
    ];
    if (bakedClipSet) return clips;
    return clips
      .map((clip) => cloneRetargetedUpperBodyClip(clip, avatarScene))
      .filter((clip): clip is THREE.AnimationClip => Boolean(clip));
  }, [avatarScene, bakedClipSet, idleGltf.animations, listeningGltf.animations, speakingGltf.animations]);
  const clipPack = useMemo(() => {
    const allClips = [...externalClips, ...fallbackClips];
    const byPattern = (pattern: RegExp) => allClips.find((clip) => pattern.test(clip.name));
    return {
      idle: byPattern(/idle_001|idle/i) ?? allClips[0],
      listening: byPattern(/variation|idle/i) ?? allClips[0],
      speaking: byPattern(/talk|expression|gesture/i) ?? allClips[0],
    };
  }, [externalClips, fallbackClips]);
  const activeClip = speaking ? clipPack.speaking : thinking ? clipPack.listening : clipPack.idle;

  useEffect(() => {
    if (!activeClip) return undefined;
    const next = mixer.clipAction(activeClip);
    const previous = actionRef.current;
    if (previous && previous !== next) previous.fadeOut(0.2);
    next.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(0.24).play();
    next.timeScale = speaking ? 0.92 : thinking ? 0.7 : 0.56;
    actionRef.current = next;
    return undefined;
  }, [activeClip, mixer, speaking, thinking]);

  return null;
}

function useDoctorDeskPlacement(rig: CameraRig, forwardDistance: number, lateralOffset: number, verticalOffset: number) {
  return useMemo(() => {
    const forward = rig.lookTarget.clone().sub(rig.position).setY(0).normalize();
    const right = new THREE.Vector3(forward.z, 0, -forward.x).normalize();
    const position = rig.position
      .clone()
      .addScaledVector(forward, forwardDistance)
      .addScaledVector(right, lateralOffset);
    position.y = rig.position.y + verticalOffset;
    const normal = rig.position.clone().sub(position).setY(0).normalize();
    const yaw = Math.atan2(normal.x, normal.z);
    return { position, yaw };
  }, [forwardDistance, lateralOffset, rig, verticalOffset]);
}

function DoctorDeskMonitor({ rig, texture }: { rig: CameraRig; texture: THREE.Texture | null }) {
  const { position, yaw } = useDoctorDeskPlacement(rig, 0.76, -0.06, -0.52);
  return (
    <group position={[position.x, position.y, position.z]} rotation={[0, yaw, 0]}>
      <group position={[-0.4, -0.006, -0.28]} scale={0.24}>
        <RoundedBox args={[1.52, 0.9, 0.065]} radius={0.035} smoothness={8} position={[0, 0.66, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#0c141b" roughness={0.32} metalness={0.42} />
        </RoundedBox>
        <RoundedBox args={[1.4, 0.78, 0.03]} radius={0.025} smoothness={6} position={[0, 0.66, 0.038]}>
          <meshBasicMaterial color="#061421" />
        </RoundedBox>
        {texture && (
          <mesh position={[0, 0.66, 0.056]}>
            <planeGeometry args={[1.34, 0.72]} />
            <meshBasicMaterial map={texture} toneMapped={false} />
          </mesh>
        )}
        <RoundedBox args={[0.16, 0.38, 0.07]} radius={0.025} smoothness={6} position={[0, 0.2, -0.02]} castShadow receiveShadow>
          <meshStandardMaterial color="#202b34" roughness={0.28} metalness={0.55} />
        </RoundedBox>
        <RoundedBox args={[0.7, 0.055, 0.32]} radius={0.04} smoothness={8} position={[0, 0.01, 0.04]} castShadow receiveShadow>
          <meshStandardMaterial color="#1a242c" roughness={0.32} metalness={0.5} />
        </RoundedBox>
        <pointLight position={[0, 0.68, 0.28]} intensity={0.28} color="#79ecff" distance={1.9} />
      </group>
    </group>
  );
}

function DoctorDeskForeground({ rig }: { rig: CameraRig }) {
  const { position, yaw } = useDoctorDeskPlacement(rig, 0.76, -0.06, -0.52);
  return (
    <group position={[position.x, position.y, position.z]} rotation={[0, yaw, 0]}>
      <RoundedBox args={[3.4, 0.075, 1.22]} radius={0.055} smoothness={10} position={[0, -0.05, 0.06]} receiveShadow>
        <meshStandardMaterial color="#f7fbfb" roughness={0.18} metalness={0.03} envMapIntensity={0.6} />
      </RoundedBox>
      <RoundedBox args={[3.46, 0.035, 0.035]} radius={0.014} smoothness={5} position={[0, -0.01, -0.565]} castShadow receiveShadow>
        <meshStandardMaterial color="#d7e2e5" roughness={0.28} metalness={0.18} />
      </RoundedBox>
      <mesh position={[0.08, 0.005, 0.08]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.15, 0.9]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.045} depthWrite={false} />
      </mesh>
    </group>
  );
}

function DeskMedicalPropCluster({ rig }: { rig: CameraRig }) {
  const { position, yaw } = useDoctorDeskPlacement(rig, 0.72, -0.02, -0.525);
  return (
    <group position={[position.x, position.y, position.z]} rotation={[0, yaw, 0]}>
      <RoundedBox args={[0.58, 0.026, 0.2]} radius={0.018} smoothness={5} position={[-0.22, 0.012, -0.31]} castShadow receiveShadow>
        <meshStandardMaterial color="#101923" roughness={0.45} metalness={0.18} />
      </RoundedBox>
      {Array.from({ length: 4 }).map((_, row) =>
        Array.from({ length: 11 }).map((__, col) => (
          <mesh key={`zoro-key-${row}-${col}`} position={[-0.46 + col * 0.044, 0.03, -0.37 + row * 0.033]} castShadow>
            <boxGeometry args={[0.03, 0.007, 0.018]} />
            <meshStandardMaterial color="#1f2a33" roughness={0.42} metalness={0.18} />
          </mesh>
        )),
      )}
      <RoundedBox args={[0.18, 0.03, 0.26]} radius={0.05} smoothness={8} position={[0.44, 0.015, -0.3]} castShadow receiveShadow>
        <meshStandardMaterial color="#0d151d" roughness={0.32} metalness={0.2} />
      </RoundedBox>
      <mesh position={[0.44, 0.033, -0.3]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.13, 0.002]} />
        <meshBasicMaterial color="#324250" transparent opacity={0.55} />
      </mesh>
    </group>
  );
}

function ReferenceClinicDepthPass() {
  return null;
}

function PatientLoader() {
  return (
    <Html center>
      <div style={{ color: '#dff9ff', fontWeight: 800, fontFamily: 'Inter, system-ui', fontSize: 12 }}>
        Loading patient…
      </div>
    </Html>
  );
}

function SeatedDoctorInteractable({ patientName, patientSeat }: { patientName: string | null; patientSeat: THREE.Vector3 }) {
  useEffect(() => {
    if (!patientName) return undefined;
    interactionBus.register({
      id: 'zoro-v43-active-patient',
      position: [patientSeat.x, patientSeat.y + 1.1, patientSeat.z],
      radius: 100,
      prompt: `Press E to examine ${patientName}`,
      kind: 'bed',
      bedIndex: POLYCLINIC_BED_INDEX,
    });
    return () => interactionBus.unregister('zoro-v43-active-patient');
  }, [patientName, patientSeat]);
  return null;
}

let rpmWarmupScheduled = false;

function scheduleRpmPatientAssetWarmup() {
  if (rpmWarmupScheduled || typeof window === 'undefined') return;
  rpmWarmupScheduled = true;
  const animationPaths = Object.values(RPM_PATIENT_ANIMATION_CLIPS).flatMap((set) => [set.idle, set.listening, set.speaking]);
  window.setTimeout(() => {
    animationPaths.forEach((path) => useGLTF.preload(path));
    const fallbackModels = LOCAL_RPM_PATIENT_MODELS
      .filter((model) => model.id !== 'rpm-local-female-1')
      .slice(0, 2);
    fallbackModels.forEach((model, index) => {
      window.setTimeout(() => useGLTF.preload(model.path), 900 * (index + 1));
    });
  }, 12000);
}

export function ZoroV43PolyclinicScene({
  voiceActive,
  onCloseVoice,
  conversationStatus = 'uninitialized',
  onVoiceStatusChange,
}: {
  voiceActive?: boolean;
  onCloseVoice?: () => void;
  conversationStatus?: ConversationStatus;
  onVoiceStatusChange?: (status: ConversationStatus) => void;
}) {
  const state = useGameState();
  const patient = state.polyclinic.patient;
  const caseData = patient?.case;
  const patientName = caseData?.name ?? 'Aisha Khan';
  const age = caseData?.age ?? 42;
  const complaint = caseData?.chiefComplaint ?? caseData?.arrivalBlurb ?? 'Chest pain';
  const statusLabel =
    conversationStatus === 'speaking' ? 'Speaking' :
    conversationStatus === 'thinking' ? 'Thinking' :
    voiceActive ? 'Listening' : 'Muted';
  const gltf = useLoader(GLTFLoader, OFFICE_SHELL_GLB) as { scene: Group };
  const root = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  useEffect(() => scheduleRpmPatientAssetWarmup(), []);
  const rig = useMemo(() => {
    prepareOfficeShell(root);
    return computeCameraRig(root);
  }, [root]);
  const patientHudAnchor = useMemo(() => {
    const forward = rig.lookTarget.clone().sub(rig.position).setY(0).normalize();
    const right = new THREE.Vector3(forward.z, 0, -forward.x).normalize();
    const anchor = rig.patientHead.clone().addScaledVector(right, -2.38).addScaledVector(forward, 0.14);
    anchor.y = rig.patientHead.y - 0.84;
    return anchor;
  }, [rig]);
  const monitorTexture = usePatientOverviewTexture(patientName, age, complaint, statusLabel);

  return (
    <group>
      <RendererContract />
      <HdriEnvironment />
      <primitive object={root} />
      <directionalLight
        color={0xfff2df}
        intensity={0.34}
        position={[rig.position.x + 3.4, rig.position.y + 5.2, rig.position.z + 2.2]}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <hemisphereLight args={[0xe9f6ff, 0xb59a76, 0.92]} />
      <pointLight position={[rig.patientSeat.x, rig.patientSeat.y + 1.7, rig.patientSeat.z + 0.6]} intensity={0.9} color="#fff2e3" distance={4} />
      <ApplyMonitorTexture screen={rig.monitorScreen} texture={monitorTexture} />
      <FixedDragLookCamera rig={rig} />
      <DoctorDeskForeground rig={rig} />
      <DoctorDeskMonitor rig={rig} texture={monitorTexture} />
      <DeskMedicalPropCluster rig={rig} />
      <ReferenceClinicDepthPass />
      {caseData && (
        <Suspense fallback={<PatientLoader />}>
          <ZoroPatientActor key={caseData.id} caseData={caseData} position={rig.patientSeat} doctorPosition={rig.position} status={conversationStatus} />
        </Suspense>
      )}
      <SeatedDoctorInteractable patientName={patientName} patientSeat={rig.patientSeat} />
      {voiceActive && patient && (
        <FloatingVoicePanel
          bedPosition={[patientHudAnchor.x, patientHudAnchor.y, patientHudAnchor.z]}
          headOffset={[0, 0, 0]}
          patient={patient}
          onClose={onCloseVoice ?? (() => undefined)}
          onStatusChange={onVoiceStatusChange}
        />
      )}
    </group>
  );
}

useLoader.preload(GLTFLoader, OFFICE_SHELL_GLB);
useLoader.preload(RGBELoader, OFFICE_HDRI);
