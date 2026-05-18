import { useEffect, useMemo, useRef } from 'react';
import { ContactShadows, RoundedBox, Text, useAnimations, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Group } from 'three';
import { interactionBus } from './interactions';
import type { WallCollider } from './Player';
import { useGameState, POLYCLINIC_BED_INDEX } from '../../game/store';
import { CLINIC_LABELS } from '../../game/clinic';
import { FloatingVoicePanel } from './FloatingVoicePanel';
import { MEDICAL_SUITE_PROP_MODELS, pickMedicalSuitePatientModel } from '../../data/medicalSuiteModelRegistry';

const ROOM = {
  left: -5.8,
  right: 5.8,
  back: -5.9,
  front: 5.2,
  width: 11.6,
  depth: 11.1,
};

const DESK_POS: [number, number, number] = [0, 0.72, 2.05];
const DESK_SIZE: [number, number, number] = [5.9, 0.28, 2.05];

export const DOCTOR_CHAIR_POS: [number, number, number] = [0, 0, 4.38];
export const PATIENT_CHAIR_POS: [number, number, number] = [0, 0, -1.18];

export const POLYCLINIC_COLLIDERS: WallCollider[] = [
  { x: 0, z: ROOM.back - 0.15, w: ROOM.width, d: 0.3 },
  { x: 0, z: ROOM.front + 0.15, w: ROOM.width, d: 0.3 },
  { x: ROOM.left - 0.15, z: -0.35, w: 0.3, d: ROOM.depth },
  { x: ROOM.right + 0.15, z: -0.35, w: 0.3, d: ROOM.depth },
  { x: DESK_POS[0], z: DESK_POS[2], w: DESK_SIZE[0], d: DESK_SIZE[2] },
  { x: PATIENT_CHAIR_POS[0], z: PATIENT_CHAIR_POS[2], w: 1.05, d: 1.05 },
  { x: ROOM.right - 0.68, z: -2.2, w: 0.85, d: 2.6 },
  { x: ROOM.left + 0.55, z: -2.3, w: 0.7, d: 2.5 },
];

type GLTFScene = {
  scene: Group;
  animations: THREE.AnimationClip[];
};

function primeScene(scene: THREE.Object3D) {
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      child.frustumCulled = false;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      for (const material of materials) {
        if (material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshPhysicalMaterial) {
          material.roughness = Math.max(0.34, material.roughness);
          material.metalness = Math.min(0.9, material.metalness);
          material.needsUpdate = true;
        }
      }
    }
  });
}

function ImportedModel({
  url,
  position,
  rotation = [0, 0, 0],
  scale = 1,
}: {
  url: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
}) {
  const gltf = useGLTF(url) as unknown as GLTFScene;
  useEffect(() => primeScene(gltf.scene), [gltf.scene]);
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <primitive object={gltf.scene} />
    </group>
  );
}

function useClinicalMonitorTexture(patientName: string, complaint: string, age: number, bp: string, hr: number, spo2: number) {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 640;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const grd = ctx.createLinearGradient(0, 0, 1024, 640);
    grd.addColorStop(0, '#071522');
    grd.addColorStop(1, '#0d2636');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 1024, 640);

    ctx.strokeStyle = 'rgba(84, 225, 255, 0.55)';
    ctx.lineWidth = 3;
    ctx.strokeRect(28, 28, 968, 584);
    ctx.fillStyle = 'rgba(76, 220, 255, 0.08)';
    ctx.fillRect(50, 82, 250, 488);
    ctx.fillRect(330, 82, 612, 118);
    ctx.fillRect(330, 230, 612, 340);

    ctx.fillStyle = '#9eedff';
    ctx.font = '700 42px Inter, Arial';
    ctx.fillText('FIZER 3D CLINIC', 50, 62);
    ctx.font = '700 32px Inter, Arial';
    ctx.fillText('Patient Overview', 330, 124);
    ctx.font = '700 40px Inter, Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(patientName, 76, 178);
    ctx.font = '600 24px Inter, Arial';
    ctx.fillStyle = '#b8d7e7';
    ctx.fillText(`${age} years`, 76, 220);
    ctx.fillText(complaint, 76, 258);

    const vitals = [
      ['HR', `${hr}`, '#7bffb8'],
      ['BP', bp, '#ff8b9b'],
      ['SpO2', `${spo2}%`, '#83d8ff'],
      ['RR', '14', '#f2f7ff'],
    ];
    vitals.forEach(([label, value, color], i) => {
      const x = 360 + i * 140;
      ctx.fillStyle = '#8eaebe';
      ctx.font = '600 18px Inter, Arial';
      ctx.fillText(label, x, 160);
      ctx.fillStyle = color;
      ctx.font = '800 30px Inter, Arial';
      ctx.fillText(value, x, 192);
    });

    ctx.strokeStyle = '#55e6ff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let i = 0; i < 420; i++) {
      const x = 390 + i;
      const y = 360 + Math.sin(i * 0.09) * 26 + Math.sin(i * 0.31) * 8;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.fillStyle = '#d9f7ff';
    ctx.font = '600 24px Inter, Arial';
    ctx.fillText('Recent tests', 360, 288);
    ctx.font = '500 20px Inter, Arial';
    ctx.fillStyle = '#b8d7e7';
    ctx.fillText('ECG: pending    Troponin: ordered    Chest X-ray: pending', 360, 324);
    ctx.fillText('Voice path: LiveKit when configured, text fallback otherwise', 360, 520);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    return texture;
  }, [patientName, complaint, age, bp, hr, spo2]);
}

function useVitalsTexture(bp: string, hr: number, spo2: number, temp: number) {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 900;
    canvas.height = 520;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = '#061421';
    ctx.fillRect(0, 0, 900, 520);
    ctx.fillStyle = '#9eedff';
    ctx.font = '800 36px Inter, Arial';
    ctx.fillText('Fizer 3D Clinic', 34, 56);
    ctx.strokeStyle = 'rgba(89, 230, 255, 0.45)';
    ctx.lineWidth = 3;
    ctx.strokeRect(22, 22, 856, 476);
    ctx.strokeStyle = '#67ff9f';
    ctx.lineWidth = 5;
    ctx.beginPath();
    for (let i = 0; i < 520; i++) {
      const x = 280 + i;
      const spike = i % 76 < 9 ? -75 + (i % 9) * 10 : 0;
      const y = 142 + Math.sin(i * 0.07) * 18 + spike;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    const cells: Array<[string, string, string, string, number, number]> = [
      ['HR', `${hr}`, 'bpm', '#69ff9f', 48, 148],
      ['BP', bp, '', '#ff7990', 48, 276],
      ['SpO2', `${spo2}`, '%', '#71dcff', 364, 276],
      ['TEMP', `${temp.toFixed(1)}`, 'C', '#ffffff', 648, 276],
    ];
    cells.forEach(([label, value, unit, color, x, y]) => {
      ctx.fillStyle = '#6d8fa1';
      ctx.font = '700 22px Inter, Arial';
      ctx.fillText(label, x, y);
      ctx.fillStyle = String(color);
      ctx.font = '900 48px Inter, Arial';
      ctx.fillText(value, x, y + 54);
      if (unit) {
        ctx.font = '700 18px Inter, Arial';
        ctx.fillText(unit, x + 118, y + 54);
      }
    });
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    return texture;
  }, [bp, hr, spo2, temp]);
}

function LightingRig() {
  return (
    <>
      <color attach="background" args={['#dfeaf1']} />
      <fog attach="fog" args={['#dfeaf1', 11, 24]} />
      <ambientLight intensity={0.66} />
      <hemisphereLight args={['#f8fcff', '#8fa0ad', 0.94]} />
      <directionalLight
        position={[-3.6, 7.5, 4.5]}
        intensity={2.15}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <rectAreaLight position={[0, 3.0, 2.2]} rotation={[-Math.PI / 2, 0, 0]} width={5.8} height={1.1} intensity={6.6} color="#fffdf8" />
      <rectAreaLight position={[0, 3.0, -2.1]} rotation={[-Math.PI / 2, 0, 0]} width={5.4} height={1.0} intensity={5.2} color="#e4f8ff" />
      <pointLight position={[-2.2, 1.7, 1.0]} intensity={2.2} color="#5de6ff" distance={6} />
      <pointLight position={[2.7, 1.7, -1.1]} intensity={2.0} color="#6deaff" distance={5.5} />
      <spotLight position={[0.15, 3.25, -0.7]} target-position={[0, 1.2, -1.0]} angle={0.42} penumbra={0.75} intensity={3.2} color="#fff4e7" castShadow />
    </>
  );
}

function RoomShell() {
  const floorTiles = useMemo(() => {
    const tiles: JSX.Element[] = [];
    let k = 0;
    for (let x = ROOM.left + 0.6; x < ROOM.right; x += 1.2) {
      for (let z = ROOM.back + 0.6; z < ROOM.front; z += 1.2) {
        tiles.push(
          <mesh key={`floor-tile-${k++}`} position={[x, 0.004, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[1.14, 1.14]} />
            <meshStandardMaterial color={k % 2 ? '#dfeaf1' : '#e8f1f6'} roughness={0.38} metalness={0.04} />
          </mesh>,
        );
      }
    }
    return tiles;
  }, []);

  return (
    <group>
      <mesh position={[0, -0.015, -0.35]} receiveShadow>
        <boxGeometry args={[ROOM.width + 0.7, 0.03, ROOM.depth + 0.7]} />
        <meshPhysicalMaterial color="#cddbe6" roughness={0.34} metalness={0.03} clearcoat={0.32} clearcoatRoughness={0.18} />
      </mesh>
      {floorTiles}

      <mesh position={[0, 1.55, ROOM.back - 0.08]} receiveShadow>
        <boxGeometry args={[ROOM.width + 0.35, 3.1, 0.16]} />
        <meshStandardMaterial color="#eef5f8" roughness={0.62} />
      </mesh>
      {[-3.7, -1.85, 0, 1.85, 3.7].map((x) => (
        <mesh key={`rear-wall-panel-seam-${x}`} position={[x, 1.55, ROOM.back + 0.01]}>
          <boxGeometry args={[0.035, 2.76, 0.045]} />
          <meshStandardMaterial color="#c7d6df" roughness={0.5} metalness={0.08} />
        </mesh>
      ))}
      {[1.05, 2.48].map((y) => (
        <mesh key={`rear-wall-light-band-${y}`} position={[0, y, ROOM.back + 0.02]}>
          <boxGeometry args={[9.4, 0.035, 0.05]} />
          <meshStandardMaterial color="#faffff" emissive="#dcf8ff" emissiveIntensity={0.4} roughness={0.35} />
        </mesh>
      ))}
      <mesh position={[0, 3.12, -0.35]}>
        <boxGeometry args={[ROOM.width + 0.35, 0.12, ROOM.depth + 0.35]} />
        <meshStandardMaterial color="#f6fbfd" roughness={0.7} />
      </mesh>

      <group position={[0, 1.58, ROOM.front - 0.1]}>
        {[-4.4, -2.2, 0, 2.2, 4.4].map((x) => (
          <mesh key={`glass-${x}`} position={[x, 0, 0]} receiveShadow>
            <boxGeometry args={[1.72, 2.78, 0.05]} />
            <meshPhysicalMaterial
              color="#d6f5ff"
              transparent
              opacity={0.28}
              roughness={0.08}
              metalness={0.0}
              transmission={0.45}
              thickness={0.08}
            />
          </mesh>
        ))}
        {[-5.45, -3.3, -1.1, 1.1, 3.3, 5.45].map((x) => (
          <mesh key={`glass-mullion-${x}`} position={[x, 0, 0.035]}>
            <boxGeometry args={[0.05, 2.9, 0.08]} />
            <meshStandardMaterial color="#223442" roughness={0.28} metalness={0.58} />
          </mesh>
        ))}
      </group>

      <group position={[0, 1.5, -3.05]}>
        {[-3.6, -1.2, 1.2, 3.6].map((x) => (
          <mesh key={`rear-glass-panel-${x}`} position={[x, 0, 0]} receiveShadow>
            <boxGeometry args={[2.0, 2.52, 0.045]} />
            <meshPhysicalMaterial
              color="#d8f6ff"
              transparent
              opacity={0.18}
              roughness={0.05}
              metalness={0.0}
              transmission={0.36}
              thickness={0.06}
            />
          </mesh>
        ))}
        {[-4.75, -2.4, 2.4, 4.75].map((x) => (
          <mesh key={`rear-glass-mullion-${x}`} position={[x, 0, 0.04]}>
            <boxGeometry args={[0.04, 2.62, 0.07]} />
            <meshStandardMaterial color="#536a78" roughness={0.34} metalness={0.28} />
          </mesh>
        ))}
        <mesh position={[0, 1.22, 0.05]}>
          <boxGeometry args={[9.6, 0.06, 0.09]} />
          <meshStandardMaterial color="#fbfdff" emissive="#dff9ff" emissiveIntensity={0.28} roughness={0.45} />
        </mesh>
      </group>

      <mesh position={[ROOM.left, 1.45, -0.35]} receiveShadow>
        <boxGeometry args={[0.14, 2.9, ROOM.depth]} />
        <meshStandardMaterial color="#eef5f8" roughness={0.62} />
      </mesh>
      <mesh position={[ROOM.right, 1.45, -0.35]} receiveShadow>
        <boxGeometry args={[0.14, 2.9, ROOM.depth]} />
        <meshStandardMaterial color="#eef5f8" roughness={0.62} />
      </mesh>

      <mesh position={[0, 0.08, ROOM.back + 0.04]}>
        <boxGeometry args={[ROOM.width, 0.16, 0.08]} />
        <meshStandardMaterial color="#cbdde8" roughness={0.35} />
      </mesh>
      <mesh position={[ROOM.left + 0.04, 0.08, -0.35]}>
        <boxGeometry args={[0.08, 0.16, ROOM.depth]} />
        <meshStandardMaterial color="#cbdde8" roughness={0.35} />
      </mesh>
      <mesh position={[ROOM.right - 0.04, 0.08, -0.35]}>
        <boxGeometry args={[0.08, 0.16, ROOM.depth]} />
        <meshStandardMaterial color="#cbdde8" roughness={0.35} />
      </mesh>

      {[-2.75, 0, 2.75].map((x) => (
        <mesh key={`ceiling-panel-${x}`} position={[x, 3.075, 1.95]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.2, 0.38]} />
          <meshStandardMaterial color="#ffffff" emissive="#dff9ff" emissiveIntensity={0.8} />
        </mesh>
      ))}
      {[-2.6, 0, 2.6].map((x) => (
        <mesh key={`rear-light-${x}`} position={[x, 3.07, -2.9]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.85, 0.28]} />
          <meshStandardMaterial color="#ffffff" emissive="#e8fbff" emissiveIntensity={0.7} />
        </mesh>
      ))}

      {[-3.1, 0.2, 3.3].map((x, i) => (
        <group key={`rear-room-silhouette-${i}`} position={[x, 0.02, -4.6 - i * 0.18]}>
          <RoundedBox args={[1.0, 0.48, 0.42]} radius={0.08} smoothness={8} position={[0, 0.24, 0]} receiveShadow>
            <meshStandardMaterial color={i === 1 ? '#dce8ef' : '#cfdce5'} roughness={0.5} metalness={0.08} />
          </RoundedBox>
          <mesh position={[0, 0.74, -0.13]}>
            <boxGeometry args={[0.62, 0.04, 0.12]} />
            <meshStandardMaterial color="#243848" emissive="#254657" emissiveIntensity={0.08} roughness={0.35} />
          </mesh>
        </group>
      ))}

      <BackgroundClinicDepth />
      <ImportedModel url={MEDICAL_SUITE_PROP_MODELS.rearClinicKit} position={[-2.6, 0.04, -4.9]} rotation={[0, 0.2, 0]} scale={1.9} />
    </group>
  );
}

function BackgroundClinicDepth() {
  return (
    <group>
      {[-2.7, 0, 2.7].map((x, i) => (
        <group key={`rear-office-frame-${i}`} position={[x, 1.38, -3.86]}>
          <RoundedBox args={[1.26, 1.46, 0.045]} radius={0.025} smoothness={5}>
            <meshStandardMaterial color="#243b4b" roughness={0.28} metalness={0.3} />
          </RoundedBox>
          <mesh position={[0, 0, 0.028]}>
            <planeGeometry args={[1.12, 1.28]} />
            <meshBasicMaterial color={i === 1 ? '#d6eef6' : '#edf6fa'} transparent opacity={0.32} />
          </mesh>
        </group>
      ))}
      {[-4.65, -1.9, 1.9, 4.65].map((x, i) => (
        <mesh key={`rear-light-band-${i}`} position={[x, 2.68, -4.82]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.15, 0.06]} />
          <meshBasicMaterial color={i % 2 ? '#dff7ff' : '#fff7e6'} transparent opacity={0.78} toneMapped={false} />
        </mesh>
      ))}
      {[-3.75, 3.9].map((x, i) => (
        <group key={`rear-plant-${i}`} position={[x, 0.08, -4.25]} scale={i ? 0.92 : 1.05}>
          <mesh position={[0, 0.18, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.23, 0.36, 18]} />
            <meshStandardMaterial color="#d8e0e5" roughness={0.45} metalness={0.12} />
          </mesh>
          {[-0.18, -0.06, 0.08, 0.2].map((dx, j) => (
            <mesh key={`leaf-${j}`} position={[dx, 0.62 + j * 0.055, 0]} rotation={[0.35 + j * 0.16, 0, dx * 2.2]} castShadow>
              <capsuleGeometry args={[0.035, 0.62, 6, 14]} />
              <meshStandardMaterial color={j % 2 ? '#5c8c78' : '#6ea08a'} roughness={0.62} />
            </mesh>
          ))}
        </group>
      ))}
      <group position={[2.0, 0.02, -4.72]}>
        <RoundedBox args={[1.36, 0.46, 0.42]} radius={0.07} smoothness={8} position={[0, 0.23, 0]} receiveShadow>
          <meshStandardMaterial color="#d7e4ed" roughness={0.48} metalness={0.08} />
        </RoundedBox>
        <RoundedBox args={[1.08, 0.08, 0.4]} radius={0.04} smoothness={6} position={[0, 0.54, -0.16]}>
          <meshStandardMaterial color="#a8bac8" roughness={0.44} metalness={0.1} />
        </RoundedBox>
      </group>
    </group>
  );
}

function DoctorDesk({ patientName, complaint, age, bp, hr, spo2 }: {
  patientName: string;
  complaint: string;
  age: number;
  bp: string;
  hr: number;
  spo2: number;
}) {
  const monitorTexture = useClinicalMonitorTexture(patientName, complaint, age, bp, hr, spo2);
  return (
    <group>
      <RoundedBox args={DESK_SIZE} radius={0.09} smoothness={8} position={DESK_POS} castShadow receiveShadow>
        <meshPhysicalMaterial color="#f8fcff" roughness={0.18} metalness={0.04} clearcoat={0.85} clearcoatRoughness={0.08} />
      </RoundedBox>
      <RoundedBox args={[5.95, 0.08, 2.1]} radius={0.07} smoothness={8} position={[0, 0.9, 2.05]} castShadow receiveShadow>
        <meshPhysicalMaterial color="#f4f9fc" roughness={0.16} metalness={0.03} clearcoat={0.95} clearcoatRoughness={0.06} />
      </RoundedBox>
      <RoundedBox args={[1.42, 0.018, 0.62]} radius={0.04} smoothness={8} position={[-1.18, 0.952, 2.88]} receiveShadow>
        <meshPhysicalMaterial color="#d8e6ee" roughness={0.22} metalness={0.04} clearcoat={0.45} clearcoatRoughness={0.12} />
      </RoundedBox>
      <RoundedBox args={[0.84, 0.02, 0.66]} radius={0.055} smoothness={8} position={[1.82, 0.956, 2.82]} receiveShadow>
        <meshStandardMaterial color="#101b25" roughness={0.28} metalness={0.08} />
      </RoundedBox>
      <RoundedBox args={[0.82, 0.018, 0.72]} radius={0.035} smoothness={8} position={[2.28, 0.958, 2.24]} rotation={[0, -0.08, 0]} receiveShadow>
        <meshStandardMaterial color="#dce9f1" roughness={0.48} metalness={0.02} />
      </RoundedBox>
      <RoundedBox args={[0.22, 0.62, 1.76]} radius={0.05} smoothness={6} position={[-2.56, 0.42, 2.05]} castShadow>
        <meshStandardMaterial color="#d8e4ec" roughness={0.36} metalness={0.15} />
      </RoundedBox>
      <RoundedBox args={[0.22, 0.62, 1.76]} radius={0.05} smoothness={6} position={[2.56, 0.42, 2.05]} castShadow>
        <meshStandardMaterial color="#d8e4ec" roughness={0.36} metalness={0.15} />
      </RoundedBox>

      <group position={[-2.15, 1.47, 1.05]} rotation={[-0.08, 0.14, 0]}>
        <RoundedBox args={[1.75, 1.06, 0.08]} radius={0.055} smoothness={8} castShadow>
          <meshStandardMaterial color="#07111b" roughness={0.26} metalness={0.5} />
        </RoundedBox>
        {monitorTexture && (
          <mesh position={[0, 0, 0.044]}>
            <planeGeometry args={[1.6, 0.9]} />
            <meshBasicMaterial map={monitorTexture} toneMapped={false} />
          </mesh>
        )}
        <RoundedBox args={[0.28, 0.5, 0.08]} radius={0.02} smoothness={4} position={[0, -0.76, -0.03]}>
          <meshStandardMaterial color="#111923" roughness={0.35} metalness={0.35} />
        </RoundedBox>
      </group>

      <Keyboard position={[-1.25, 0.965, 2.88]} />
      <Mouse position={[1.82, 0.98, 2.84]} />
      <Papers position={[0.15, 0.932, 2.94]} />
      <ForegroundChartStack position={[0.52, 0.973, 3.05]} rotation={[0, -0.06, 0]} />
      <GlovePair position={[2.52, 0.982, 2.58]} rotation={[0, -0.38, 0]} />

      {[
        [-0.48, 2.03, 0.48],
        [0.78, 1.72, 0.26],
        [1.68, 1.42, 0.42],
        [2.24, 2.06, 0.5],
      ].map(([x, z, radius], i) => (
        <mesh key={`desk-prop-contact-${i}`} position={[x, 0.962, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[radius, 36]} />
          <meshBasicMaterial color="#4a6272" transparent opacity={0.08} depthWrite={false} />
        </mesh>
      ))}
      <ImportedModel url={MEDICAL_SUITE_PROP_MODELS.stethoscope} position={[-0.48, 0.992, 2.02]} rotation={[0, -0.35, 0]} scale={1.78} />
      <ImportedModel url={MEDICAL_SUITE_PROP_MODELS.pulseOximeter} position={[0.78, 0.992, 1.7]} rotation={[0, 0.35, 0]} scale={1.52} />
      <BloodPressureCuff position={[1.66, 1.0, 1.43]} rotation={[0, -0.24, 0]} />
      <ImportedModel url={MEDICAL_SUITE_PROP_MODELS.deskClutter} position={[2.24, 0.992, 2.05]} rotation={[0, -0.4, 0]} scale={1.16} />
      <group position={[2.46, 1.0, 1.14]} rotation={[0, -0.62, 0]}>
        <RoundedBox args={[0.58, 0.16, 0.38]} radius={0.055} smoothness={8} castShadow>
          <meshStandardMaterial color="#f1f8fb" roughness={0.24} metalness={0.14} />
        </RoundedBox>
        <mesh position={[0.04, 0.09, 0.02]}>
          <planeGeometry args={[0.34, 0.18]} />
          <meshBasicMaterial color="#102235" />
        </mesh>
        <Text position={[0.04, 0.1, 0.025]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.045} color="#63f0ff" anchorX="center">
          SpO2 98
        </Text>
      </group>
    </group>
  );
}

function ForegroundChartStack({
  position,
  rotation,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={[1.0, 0.045, 0.72]} radius={0.035} smoothness={6} castShadow receiveShadow>
        <meshStandardMaterial color="#b8ccd8" roughness={0.44} metalness={0.04} />
      </RoundedBox>
      <RoundedBox args={[0.96, 0.028, 0.66]} radius={0.025} smoothness={5} position={[0.02, 0.024, -0.01]} castShadow receiveShadow>
        <meshStandardMaterial color="#dfeaf2" roughness={0.5} metalness={0.02} />
      </RoundedBox>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={`foreground-chart-paper-${i}`} position={[0.015 * i - 0.03, 0.035 + i * 0.004, -0.015 * i]} rotation={[-Math.PI / 2, 0, -0.035 + i * 0.018]}>
          <planeGeometry args={[0.86, 0.58]} />
          <meshStandardMaterial color={i === 0 ? '#f7fbff' : '#e8f0f6'} roughness={0.68} />
        </mesh>
      ))}
      <mesh position={[-0.23, 0.063, 0.25]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.22, 0.045]} />
        <meshBasicMaterial color="#41d8e8" transparent opacity={0.85} />
      </mesh>
      {[-0.22, -0.12, -0.02, 0.08, 0.18].map((z, i) => (
        <mesh key={`foreground-chart-line-${i}`} position={[-0.05, 0.058, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.62 - i * 0.045, 0.014]} />
          <meshBasicMaterial color="#5e8498" transparent opacity={0.82} />
        </mesh>
      ))}
      <Text position={[0.26, 0.07, 0.23]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.055} color="#1b5263" anchorX="center">
        Rx / ECG
      </Text>
    </group>
  );
}

function GlovePair({
  position,
  rotation,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation}>
      {[-0.12, 0.12].map((x, i) => (
        <group key={`glove-${i}`} position={[x, 0.02, i ? 0.06 : -0.02]} rotation={[0, 0, i ? -0.1 : 0.12]}>
          <mesh scale={[1.22, 0.22, 0.72]} castShadow>
            <sphereGeometry args={[0.16, 24, 16]} />
            <meshStandardMaterial color="#1fb7dd" roughness={0.47} metalness={0.02} />
          </mesh>
          {[-0.12, -0.04, 0.04, 0.12].map((dx, j) => (
            <mesh key={`finger-${j}`} position={[dx, 0.01, -0.18]} rotation={[0, 0, dx * 0.55]} castShadow>
              <capsuleGeometry args={[0.025, 0.25, 6, 10]} />
              <meshStandardMaterial color={j % 2 ? '#22c1e6' : '#28b4d8'} roughness={0.5} />
            </mesh>
          ))}
        </group>
      ))}
      <mesh position={[0, -0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.42, 36]} />
        <meshBasicMaterial color="#0f82a2" transparent opacity={0.11} depthWrite={false} />
      </mesh>
    </group>
  );
}

function BloodPressureCuff({
  position,
  rotation,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={[0.76, 0.07, 0.38]} radius={0.045} smoothness={8} position={[0, 0.03, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#111923" roughness={0.46} metalness={0.06} />
      </RoundedBox>
      <RoundedBox args={[0.58, 0.078, 0.24]} radius={0.04} smoothness={8} position={[-0.05, 0.083, -0.01]} castShadow>
        <meshStandardMaterial color="#1d2935" roughness={0.52} metalness={0.04} />
      </RoundedBox>
      <mesh position={[0.38, 0.11, 0.12]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.125, 0.125, 0.035, 36]} />
        <meshStandardMaterial color="#edf6fb" roughness={0.2} metalness={0.18} />
      </mesh>
      <mesh position={[0.38, 0.132, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.105, 32]} />
        <meshBasicMaterial color="#f7fbff" />
      </mesh>
      <Text position={[0.38, 0.136, 0.12]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.032} color="#16293a" anchorX="center" anchorY="middle">
        120
      </Text>
      <mesh position={[0.62, 0.055, -0.16]} scale={[1.22, 0.72, 0.92]} castShadow>
        <sphereGeometry args={[0.115, 28, 18]} />
        <meshStandardMaterial color="#0b1117" roughness={0.5} metalness={0.02} />
      </mesh>
      <mesh position={[0.5, 0.055, -0.04]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <capsuleGeometry args={[0.018, 0.34, 8, 16]} />
        <meshStandardMaterial color="#0c141b" roughness={0.44} metalness={0.04} />
      </mesh>
      <mesh position={[0.1, 0.058, 0.18]} rotation={[Math.PI / 2, 0, 0.18]} castShadow>
        <torusGeometry args={[0.34, 0.018, 8, 54, Math.PI * 1.18]} />
        <meshStandardMaterial color="#0c141b" roughness={0.42} metalness={0.04} />
      </mesh>
      <mesh position={[0.03, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.42, 36]} />
        <meshBasicMaterial color="#263a49" transparent opacity={0.13} depthWrite={false} />
      </mesh>
    </group>
  );
}

function Keyboard({ position }: { position: [number, number, number] }) {
  const keys = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 13; c++) {
      keys.push(
        <mesh key={`key-${r}-${c}`} position={[-0.48 + c * 0.08, 0.04, -0.13 + r * 0.08]}>
          <boxGeometry args={[0.052, 0.022, 0.045]} />
          <meshStandardMaterial color="#18232e" roughness={0.32} />
        </mesh>,
      );
    }
  }
  return (
    <group position={position} rotation={[0, -0.08, 0]}>
      <RoundedBox args={[1.18, 0.055, 0.45]} radius={0.035} smoothness={6} castShadow>
        <meshStandardMaterial color="#0f1720" roughness={0.26} metalness={0.2} />
      </RoundedBox>
      {keys}
    </group>
  );
}

function Mouse({ position }: { position: [number, number, number] }) {
  return (
    <group position={position} rotation={[0, -0.18, 0]}>
      <RoundedBox args={[0.38, 0.045, 0.48]} radius={0.08} smoothness={12} position={[0, -0.012, 0]}>
        <meshStandardMaterial color="#101821" roughness={0.18} metalness={0.24} />
      </RoundedBox>
      <RoundedBox args={[0.32, 0.07, 0.32]} radius={0.16} smoothness={16} position={[0, 0.035, 0.02]} castShadow>
        <meshStandardMaterial color="#182533" roughness={0.2} metalness={0.18} />
      </RoundedBox>
    </group>
  );
}

function Papers({ position }: { position: [number, number, number] }) {
  return (
    <group position={position} rotation={[0, 0.08, 0]}>
      {[0, 1, 2].map((i) => (
        <mesh key={`paper-${i}`} position={[i * 0.035, 0.004 + i * 0.006, i * -0.018]} rotation={[-Math.PI / 2, 0, i * 0.03]}>
          <planeGeometry args={[0.82, 1.04]} />
          <meshStandardMaterial color={i === 2 ? '#edf7ff' : '#ffffff'} roughness={0.68} />
        </mesh>
      ))}
      {[-0.26, -0.07, 0.13].map((y, i) => (
        <mesh key={`paper-line-${i}`} position={[0.02, 0.035, y]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.58, 0.018]} />
          <meshBasicMaterial color="#88a7ba" transparent opacity={0.55} />
        </mesh>
      ))}
      <Text position={[0.12, 0.05, 0.29]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.06} color="#19485a" anchorX="center">
        FIZER
      </Text>
    </group>
  );
}

function PatientArea() {
  return (
    <group>
      <mesh position={[0, 0.026, PATIENT_CHAIR_POS[2] + 0.1]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.98, 48]} />
        <meshBasicMaterial color="#405b6a" transparent opacity={0.16} depthWrite={false} />
      </mesh>
      <RoundedBox args={[1.48, 0.18, 1.2]} radius={0.13} smoothness={12} position={[0, 0.42, PATIENT_CHAIR_POS[2] + 0.18]} castShadow receiveShadow>
        <meshStandardMaterial color="#9fb6c5" roughness={0.42} metalness={0.18} />
      </RoundedBox>
      <RoundedBox args={[1.44, 1.12, 0.18]} radius={0.13} smoothness={12} position={[0, 1.0, PATIENT_CHAIR_POS[2] - 0.28]} castShadow receiveShadow>
        <meshStandardMaterial color="#b9cad7" roughness={0.48} metalness={0.12} />
      </RoundedBox>
      {[-0.78, 0.78].map((x) => (
        <RoundedBox key={`patient-chair-arm-${x}`} args={[0.15, 0.16, 1.05]} radius={0.055} smoothness={8} position={[x, 0.74, PATIENT_CHAIR_POS[2] + 0.16]} castShadow receiveShadow>
          <meshStandardMaterial color="#7893a6" roughness={0.34} metalness={0.18} />
        </RoundedBox>
      ))}
      {[[-0.44, 0.22], [0.44, 0.22], [-0.44, -0.28], [0.44, -0.28]].map(([x, z], i) => (
        <mesh key={`patient-chair-leg-${i}`} position={[x, 0.22, PATIENT_CHAIR_POS[2] + z]} castShadow>
          <cylinderGeometry args={[0.035, 0.035, 0.44, 12]} />
          <meshStandardMaterial color="#5f7180" metalness={0.35} roughness={0.28} />
        </mesh>
      ))}
      <RoundedBox args={[0.9, 0.035, 0.24]} radius={0.025} smoothness={6} position={[0, 0.19, PATIENT_CHAIR_POS[2] + 0.78]} castShadow receiveShadow>
        <meshStandardMaterial color="#5f7180" roughness={0.32} metalness={0.26} />
      </RoundedBox>
      <pointLight position={[0, 1.7, PATIENT_CHAIR_POS[2] + 0.72]} intensity={0.85} color="#fff4e8" distance={2.8} />
      <HeroPatient />
    </group>
  );
}

function HeroPatient() {
  const group = useRef<Group>(null);
  const model = pickMedicalSuitePatientModel('im-001');
  const gltf = useGLTF(model.path) as unknown as GLTFScene;
  const { actions, names } = useAnimations(gltf.animations, group);

  useEffect(() => {
    primeScene(gltf.scene);
  }, [gltf.scene]);

  useEffect(() => {
    const idleName = names.find((name) => /idle|breath|sit/i.test(name)) ?? names[0];
    if (!idleName) return undefined;
    const action = actions[idleName];
    if (!action) return undefined;
    action.reset().fadeIn(0.4).play();
    action.timeScale = 0.45;
    return () => {
      action.fadeOut(0.2);
    };
  }, [actions, names]);

  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.elapsedTime;
    group.current.position.y = 0.04 + Math.sin(t * 1.2) * 0.012;
    group.current.rotation.y = Math.sin(t * 0.45) * 0.025;
  });

  return (
    <group ref={group} position={[PATIENT_CHAIR_POS[0], 0.03, PATIENT_CHAIR_POS[2] + 0.08]} rotation={[0, 0, 0]} scale={2.3}>
      <primitive object={gltf.scene} />
    </group>
  );
}

function DiagnosticsWall({ bp, hr, spo2, temp }: { bp: string; hr: number; spo2: number; temp: number }) {
  const vitalsTexture = useVitalsTexture(bp, hr, spo2, temp);
  return (
    <group>
      <ImportedModel url={MEDICAL_SUITE_PROP_MODELS.rightDiagnosticKit} position={[3.52, 0.78, -3.15]} rotation={[0, -0.42, 0]} scale={0.78} />
      <SkeletonStand position={[2.68, 0.12, -2.16]} rotation={[0, -0.26, 0]} scale={0.76} />
      <AnatomyPoster position={[2.02, 1.54, -3.22]} rotation={[0, -0.16, 0]} />
      <group position={[3.18, 1.84, -3.78]} rotation={[0, -0.1, 0]}>
        <RoundedBox args={[2.05, 1.22, 0.08]} radius={0.05} smoothness={8} castShadow>
          <meshStandardMaterial color="#07111c" roughness={0.2} metalness={0.5} />
        </RoundedBox>
        {vitalsTexture && (
          <mesh position={[0, 0, 0.045]}>
            <planeGeometry args={[1.86, 1.04]} />
            <meshBasicMaterial map={vitalsTexture} toneMapped={false} />
          </mesh>
        )}
      </group>
      <group position={[ROOM.right - 0.14, 1.52, 0.25]} rotation={[0, -Math.PI / 2, 0]}>
        <RoundedBox args={[1.36, 1.72, 0.06]} radius={0.035} smoothness={6} castShadow>
          <meshStandardMaterial color="#f2f7fa" roughness={0.42} metalness={0.02} />
        </RoundedBox>
        <Text position={[0, 0.68, 0.04]} fontSize={0.08} color="#334957" anchorX="center">
          THE HUMAN SKELETON
        </Text>
        {[-0.34, 0, 0.34].map((x, i) => (
          <group key={`bone-chart-${i}`} position={[x, -0.1, 0.04]}>
            <mesh position={[0, 0.26, 0]}>
              <sphereGeometry args={[0.07, 18, 18]} />
              <meshBasicMaterial color="#b59268" />
            </mesh>
            <mesh position={[0, -0.08, 0]}>
              <capsuleGeometry args={[0.038, 0.48, 6, 12]} />
              <meshBasicMaterial color="#b59268" />
            </mesh>
            <mesh position={[0, -0.48, 0]}>
              <capsuleGeometry args={[0.03, 0.52, 6, 12]} />
              <meshBasicMaterial color="#b59268" />
            </mesh>
          </group>
        ))}
      </group>
      <group position={[ROOM.right - 0.62, 0.42, 1.28]} rotation={[0, -Math.PI / 2, 0]}>
        <RoundedBox args={[1.45, 0.16, 0.48]} radius={0.04} smoothness={8}>
          <meshStandardMaterial color="#dfeaf2" roughness={0.35} metalness={0.12} />
        </RoundedBox>
        {[-0.42, 0, 0.42].map((x, i) => (
          <RoundedBox key={`wall-device-${i}`} args={[0.22, 0.24, 0.18]} radius={0.035} smoothness={6} position={[x, 0.24, 0]}>
            <meshStandardMaterial color={i === 1 ? '#132536' : '#f4fbff'} roughness={0.25} metalness={0.18} />
          </RoundedBox>
        ))}
      </group>
      <mesh position={[ROOM.right - 0.46, 0.45, -0.7]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.07, 1.55, 8, 18]} />
        <meshStandardMaterial color="#1f2e3a" roughness={0.3} metalness={0.35} />
      </mesh>
      <RoundedBox args={[0.9, 0.14, 2.35]} radius={0.07} smoothness={8} position={[ROOM.right - 0.62, 0.62, 2.1]} castShadow receiveShadow>
        <meshStandardMaterial color="#264d6b" roughness={0.32} metalness={0.18} />
      </RoundedBox>
      <RoundedBox args={[0.82, 0.12, 0.34]} radius={0.06} smoothness={8} position={[ROOM.right - 0.65, 0.78, 1.05]} castShadow>
        <meshStandardMaterial color="#f2f8fb" roughness={0.36} metalness={0.08} />
      </RoundedBox>
    </group>
  );
}

function AnatomyPoster({
  position,
  rotation,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={[0.86, 1.24, 0.045]} radius={0.03} smoothness={6} castShadow>
        <meshStandardMaterial color="#f4f7f3" roughness={0.45} metalness={0.02} />
      </RoundedBox>
      <Text position={[0, 0.5, 0.035]} fontSize={0.055} color="#314654" anchorX="center">
        HUMAN ANATOMY
      </Text>
      {[[-0.22, 0.14], [0.0, 0.14], [0.22, 0.14], [-0.14, -0.23], [0.14, -0.23]].map(([x, y], i) => (
        <group key={`anatomy-figure-${i}`} position={[x, y, 0.04]} scale={0.74}>
          <mesh position={[0, 0.17, 0]}>
            <sphereGeometry args={[0.045, 16, 12]} />
            <meshBasicMaterial color={i % 2 ? '#a96d5b' : '#d5b488'} />
          </mesh>
          <mesh position={[0, -0.05, 0]}>
            <capsuleGeometry args={[0.026, 0.28, 5, 10]} />
            <meshBasicMaterial color={i % 2 ? '#b77a66' : '#d2ab7b'} />
          </mesh>
          <mesh position={[0, -0.31, 0]}>
            <capsuleGeometry args={[0.018, 0.26, 5, 10]} />
            <meshBasicMaterial color={i % 2 ? '#b77a66' : '#d2ab7b'} />
          </mesh>
        </group>
      ))}
      {[-0.32, 0.0, 0.32].map((x, i) => (
        <mesh key={`poster-callout-${i}`} position={[x, -0.47, 0.04]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.18, 0.012]} />
          <meshBasicMaterial color="#78909c" transparent opacity={0.65} />
        </mesh>
      ))}
    </group>
  );
}

function SkeletonStand({
  position,
  rotation,
  scale,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
}) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh position={[0, 0.05, 0]} castShadow>
        <cylinderGeometry args={[0.26, 0.32, 0.05, 24]} />
        <meshStandardMaterial color="#d5e0e8" roughness={0.38} metalness={0.18} />
      </mesh>
      <mesh position={[0, 0.78, 0]} castShadow>
        <cylinderGeometry args={[0.018, 0.018, 1.45, 12]} />
        <meshStandardMaterial color="#718696" roughness={0.32} metalness={0.3} />
      </mesh>
      <mesh position={[0, 1.55, 0]} castShadow>
        <sphereGeometry args={[0.14, 24, 18]} />
        <meshStandardMaterial color="#e9dcc6" roughness={0.54} metalness={0.02} />
      </mesh>
      <mesh position={[0, 1.18, 0]} castShadow>
        <capsuleGeometry args={[0.07, 0.42, 8, 16]} />
        <meshStandardMaterial color="#e4d5bc" roughness={0.58} />
      </mesh>
      {[-0.18, 0.18].map((x) => (
        <mesh key={`skeleton-arm-${x}`} position={[x, 1.16, 0]} rotation={[0, 0, x > 0 ? -0.38 : 0.38]} castShadow>
          <capsuleGeometry args={[0.025, 0.62, 6, 12]} />
          <meshStandardMaterial color="#e1d0b6" roughness={0.58} />
        </mesh>
      ))}
      {[-0.08, 0.08].map((x) => (
        <mesh key={`skeleton-leg-${x}`} position={[x, 0.65, 0]} rotation={[0, 0, x > 0 ? -0.08 : 0.08]} castShadow>
          <capsuleGeometry args={[0.028, 0.74, 6, 12]} />
          <meshStandardMaterial color="#e1d0b6" roughness={0.58} />
        </mesh>
      ))}
    </group>
  );
}

function HolographicHud({ status }: { status: string }) {
  const hudRef = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!hudRef.current) return;
    hudRef.current.position.y = 1.43 + Math.sin(clock.elapsedTime * 1.1) * 0.012;
  });

  return (
    <group ref={hudRef}>
      <group position={[0, -1.16, 2.05]} rotation={[-0.04, 0, 0]} scale={0.22}>
        <RoundedBox args={[2.05, 0.34, 0.035]} radius={0.07} smoothness={12}>
          <meshBasicMaterial color="#173246" transparent opacity={0.40} />
        </RoundedBox>
        <RoundedBox args={[1.92, 0.24, 0.026]} radius={0.055} smoothness={10} position={[0, 0, 0.032]}>
          <meshBasicMaterial color="#64ecff" transparent opacity={0.055} toneMapped={false} />
        </RoundedBox>
        <mesh position={[-0.83, 0.0, 0.052]}>
          <circleGeometry args={[0.035, 24]} />
          <meshBasicMaterial color="#7dffbf" transparent opacity={status === 'Listening' ? 0.95 : 0.48} />
        </mesh>
        <Text position={[-0.72, -0.015, 0.055]} fontSize={0.115} color="#f5fdff" anchorX="left">
          Press
        </Text>
        <RoundedBox args={[0.26, 0.2, 0.03]} radius={0.035} smoothness={8} position={[-0.14, 0.0, 0.06]}>
          <meshBasicMaterial color="#f2fbff" transparent opacity={0.86} />
        </RoundedBox>
        <Text position={[-0.14, -0.028, 0.087]} fontSize={0.13} color="#203746" anchorX="center">
          E
        </Text>
        <Text position={[0.06, -0.015, 0.055]} fontSize={0.115} color="#f5fdff" anchorX="left">
          to Examine
        </Text>
        <Text position={[0.84, -0.012, 0.055]} fontSize={0.07} color="#9eefff" anchorX="right">
          {status}
        </Text>
      </group>
    </group>
  );
}

function SeatedDoctorInteractable({ patientName }: { patientName: string | null }) {
  useEffect(() => {
    if (!patientName) return undefined;
    interactionBus.register({
      id: 'polyclinic-active-patient',
      position: [PATIENT_CHAIR_POS[0], 1.1, PATIENT_CHAIR_POS[2]],
      radius: 100,
      prompt: `Press E to examine ${patientName}`,
      kind: 'bed',
      bedIndex: POLYCLINIC_BED_INDEX,
    });
    return () => interactionBus.unregister('polyclinic-active-patient');
  }, [patientName]);
  return null;
}

export function Polyclinic({
  voiceActive,
  onCloseVoice,
}: {
  voiceActive?: boolean;
  onCloseVoice?: () => void;
}) {
  const state = useGameState();
  const patient = state.polyclinic.patient;
  const clinicLabel = CLINIC_LABELS[state.polyclinic.clinic];
  const caseData = patient?.case;
  const patientName = caseData?.name ?? 'Aisha Khan';
  const age = caseData?.age ?? 42;
  const complaint = caseData?.chiefComplaint ?? caseData?.arrivalBlurb ?? 'Chest pain';
  const bp = caseData?.vitals.bp ?? '120/80';
  const hr = caseData?.vitals.hr ?? 72;
  const spo2 = caseData?.vitals.spo2 ?? 98;
  const temp = caseData?.vitals.temp ?? 37;
  const voiceStatus = voiceActive ? 'Listening' : 'Muted';

  return (
    <group>
      <LightingRig />
      <ContactShadows position={[0, 0.018, 0.15]} opacity={0.28} scale={10.5} blur={2.2} far={5.6} color="#8ca4b2" />
      <RoomShell />
      <DoctorDesk patientName={patientName} complaint={complaint} age={age} bp={bp} hr={hr} spo2={spo2} />
      <PatientArea />
      <DiagnosticsWall bp={bp} hr={hr} spo2={spo2} temp={temp} />
      <HolographicHud status={voiceStatus} />
      <SeatedDoctorInteractable patientName={patientName} />

      <Text position={[-4.9, 2.12, -4.84]} rotation={[0, 0.02, 0]} fontSize={0.14} color="#64eaff" anchorX="left">
        {clinicLabel}
      </Text>

      {voiceActive && patient && (
        <FloatingVoicePanel
          bedPosition={PATIENT_CHAIR_POS}
          headOffset={[1.38, 1.58, 0.12]}
          patient={patient}
          onClose={onCloseVoice ?? (() => undefined)}
        />
      )}
    </group>
  );
}
