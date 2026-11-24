"use client";

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import {
  AdditiveBlending,
  AmbientLight,
  BackSide,
  Box3,
  BufferAttribute,
  BufferGeometry,
  Color,
  DirectionalLight,
  DynamicDrawUsage,
  Group,
  CircleGeometry,
  Mesh,
  MeshBasicMaterial,
  PMREMGenerator,
  Scene,
  SphereGeometry,
  SpotLight,
  Vector3,
} from "three";
import type { LineBasicMaterial, MeshStandardMaterial, Object3D, PointsMaterial } from "three";

const SLIDE = 0.95;
const DRAW = 2.6;
const HOLD = 1;
const FADE = 0.65;
const TARGET = 2.2;
const POINT_COUNT = 340;
const SCAN_GAP = 0.22;
const LINE_FLOATS = POINT_COUNT * 24;
const FACE = 0.58;

const MODELS = [
  "/food_can_415g.glb",
  "/medicine_pill_bottle_with_label.glb",
  "/t-shirt.glb",
  "/9v_battery.glb",
  "/bike_tire.glb",
  "/coffee_pack.glb",
  "/drill.glb",
  "/haier_refrigerator.glb",
  "/light_bulb.glb",
] as const;

type Prepared = {
  object: Group;
  positions: Float32Array;
  pointCount: number;
  linePositions: Float32Array;
  lineColors: Float32Array;
  segmentCount: number;
};

const _box = new Box3();
const _center = new Vector3();
const _vertex = new Vector3();

function setModelOpacity(object: Object3D, opacity: number) {
  object.traverse((obj) => {
    const mesh = obj as Mesh;
    if (!mesh.isMesh) return;
    const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of list) {
      material.opacity = opacity;
      material.depthWrite = opacity >= 0.99;
    }
  });
}

function smooth(value: number) {
  const x = Math.min(1, Math.max(0, value));
  return x * x * (3 - 2 * x);
}

function sealOpenEnds(wrapper: Group) {
  const coords: number[] = [];
  const found: { material: MeshStandardMaterial | null } = { material: null };
  wrapper.updateMatrixWorld(true);
  wrapper.traverse((obj) => {
    const mesh = obj as Mesh;
    if (!mesh.isMesh) return;
    const source = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
    if (!found.material && source && "metalness" in source) found.material = source as MeshStandardMaterial;
    const position = mesh.geometry.getAttribute("position");
    if (!position) return;
    for (let i = 0; i < position.count; i++) {
      _vertex.fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld);
      coords.push(_vertex.x, _vertex.y, _vertex.z);
    }
  });
  const material = found.material;
  if (!material || coords.length < 30) return;

  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < coords.length; i += 3) {
    for (let axis = 0; axis < 3; axis++) {
      min[axis] = Math.min(min[axis], coords[i + axis]);
      max[axis] = Math.max(max[axis], coords[i + axis]);
    }
  }
  const size = min.map((value, axis) => max[axis] - value);
  const order = [0, 1, 2].sort((a, b) => size[b] - size[a]);
  const long = order[0];
  const mid = order[1];
  const short = order[2];
  if (size[short] < size[mid] * 0.92 || size[long] < size[mid] * 1.2) return;

  const center = min.map((value, axis) => (value + max[axis]) / 2);
  const length = size[long];
  const caps: { end: number; minR: number; maxR: number }[] = [];
  for (const end of [min[long], max[long]]) {
    let minR = Infinity;
    let maxR = 0;
    let count = 0;
    for (let i = 0; i < coords.length; i += 3) {
      if (Math.abs(coords[i + long] - end) > length * 0.12) continue;
      const radius = Math.hypot(coords[i + mid] - center[mid], coords[i + short] - center[short]);
      minR = Math.min(minR, radius);
      maxR = Math.max(maxR, radius);
      count += 1;
    }
    if (count < 12 || minR < maxR * 0.45 || minR > maxR * 0.82) return;
    caps.push({ end, minR, maxR });
  }

  const scale = wrapper.scale.x || 1;
  for (const cap of caps) {
    const outward = cap.end >= center[long] ? 1 : -1;
    const radius = Math.min(cap.minR * 1.08, cap.maxR * 0.96) / scale;
    const lid = material.clone();
    lid.normalMap = null;
    const disc = new Mesh(new CircleGeometry(radius, 40), lid);
    disc.castShadow = false;
    const position = [...center];
    position[long] = cap.end - outward * length * 0.012;
    disc.position.set(position[0] / scale, position[1] / scale, position[2] / scale);
    if (long === 0) disc.rotation.y = outward > 0 ? Math.PI / 2 : -Math.PI / 2;
    else if (long === 1) disc.rotation.x = outward > 0 ? -Math.PI / 2 : Math.PI / 2;
    else if (outward < 0) disc.rotation.y = Math.PI;
    wrapper.add(disc);
  }
}

function presentFace(wrapper: Group) {
  wrapper.updateMatrixWorld(true);
  _box.setFromObject(wrapper);
  const size = _box.getSize(_vertex);
  if (size.x < size.z * 0.35) wrapper.rotateY(-Math.PI / 2);
  wrapper.updateMatrixWorld(true);
}

function prepare(source: Object3D, src: string) {
  const root = source.clone(true);
  const drop: Object3D[] = [];
  root.traverse((obj) => {
    const node = obj as Mesh;
    if (node.isMesh) {
      node.castShadow = false;
      const source = node.material;
      const list = Array.isArray(source) ? source : [source];
      const cloned = list.map((material) => {
        const next = material.clone();
        const keepDepth = next.transparent;
        next.transparent = true;
        next.opacity = 1;
        next.depthWrite = !keepDepth;
        if ("envMapIntensity" in next) (next as MeshStandardMaterial).envMapIntensity *= 0.55;
        if ("metalness" in next) {
          const standard = next as MeshStandardMaterial;
          if (!standard.map && standard.metalness < 0.2 && standard.color.r < 0.03 && standard.color.g < 0.03 && standard.color.b < 0.03) {
            standard.color.setRGB(0.28, 0.28, 0.29);
            standard.roughness = Math.max(standard.roughness, 0.55);
          }
          if (!standard.metalnessMap && standard.metalness > 0.8) {
            standard.metalness = 0.5;
            standard.roughness = Math.max(standard.roughness, 0.38);
          }
          if (src.endsWith("/haier_refrigerator.glb") && standard.metalnessMap) {
            standard.metalness = 0.32;
            standard.envMapIntensity = 0.4;
          }
          if (src.endsWith("/light_bulb.glb") && standard.name === "glass") {
            standard.metalness = 0.05;
            standard.roughness = Math.max(standard.roughness, 0.12);
            standard.envMapIntensity = 0.7;
          }
        }
        if (src.endsWith("/food_can_415g.glb") && "metalness" in next) {
          const standard = next as MeshStandardMaterial;
          if (standard.metalnessMap || standard.metalness > 0.85) {
            standard.metalnessMap = null;
            standard.roughnessMap = null;
            standard.aoMap = null;
            standard.color.multiplyScalar(0.82);
            standard.metalness = 0.4;
            standard.roughness = 0.68;
            standard.envMapIntensity = 0.16;
            standard.normalScale.set(1.25, 1.25);
          }
        }
        return next;
      });
      node.material = Array.isArray(source) ? cloned : cloned[0];
    }
    if ("isLight" in obj || "isCamera" in obj) drop.push(obj);
  });
  drop.forEach((obj) => obj.parent?.remove(obj));

  const wrapper = new Group();
  wrapper.add(root);
  root.updateMatrixWorld(true);
  _box.setFromObject(root);
  _box.getCenter(_center);
  root.position.sub(_center);
  const size = _box.getSize(_vertex);
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  wrapper.scale.setScalar(TARGET / maxDim);
  wrapper.updateMatrixWorld(true);
  sealOpenEnds(wrapper);
  presentFace(wrapper);

  const coords: number[] = [];
  wrapper.traverse((obj) => {
    const mesh = obj as Mesh;
    if (!mesh.isMesh) return;
    const position = mesh.geometry.getAttribute("position");
    if (!position) return;
    const step = Math.max(1, Math.floor(position.count / 4000));
    for (let i = 0; i < position.count; i += step) {
      _vertex.fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld);
      coords.push(_vertex.x, _vertex.y, _vertex.z);
    }
  });
  const samples = Float32Array.from(coords);
  const sampleCount = samples.length / 3;

  wrapper.updateMatrixWorld(true);
  _box.setFromObject(wrapper);
  _box.getCenter(_center);
  const cx = _center.x;
  const cy = _center.y;
  const cz = _center.z;
  const positions = new Float32Array(POINT_COUNT * 3);
  for (let i = 0; i < POINT_COUNT; i += 1) {
    const y = 1 - (i / (POINT_COUNT - 1)) * 2;
    const ring = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = i * Math.PI * (3 - Math.sqrt(5));
    const dx = Math.cos(theta) * ring;
    const dy = y;
    const dz = Math.sin(theta) * ring;
    let support = -Infinity;
    for (let s = 0; s < sampleCount; s += 1) {
      const offset = s * 3;
      const projection =
        (samples[offset] - cx) * dx + (samples[offset + 1] - cy) * dy + (samples[offset + 2] - cz) * dz;
      if (projection > support) support = projection;
    }
    const reach = (Number.isFinite(support) ? support : 1) + SCAN_GAP;
    positions[i * 3] = cx + dx * reach;
    positions[i * 3 + 1] = cy + dy * reach;
    positions[i * 3 + 2] = cz + dz * reach;
  }

  const pointCount = POINT_COUNT;
  const nearest = new Float32Array(pointCount);
  for (let i = 0; i < pointCount; i += 1) {
    let min = Infinity;
    for (let j = 0; j < pointCount; j += 1) {
      if (i === j) continue;
      const dx = positions[j * 3] - positions[i * 3];
      const dy = positions[j * 3 + 1] - positions[i * 3 + 1];
      const dz = positions[j * 3 + 2] - positions[i * 3 + 2];
      const dist = dx * dx + dy * dy + dz * dz;
      if (dist < min) min = dist;
    }
    nearest[i] = Math.sqrt(min);
  }
  const ordered = Array.from(nearest).sort((a, b) => a - b);
  const spacing = ordered[Math.floor(ordered.length / 2)] || 0.3;
  const limit = spacing * 1.85;
  const limitSq = limit * limit;
  const raw: { y: number; ax: number; ay: number; az: number; bx: number; by: number; bz: number; near: number }[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < pointCount; i += 1) {
    const near: { j: number; dist: number }[] = [];
    for (let j = 0; j < pointCount; j += 1) {
      if (i === j) continue;
      const dx = positions[j * 3] - positions[i * 3];
      const dy = positions[j * 3 + 1] - positions[i * 3 + 1];
      const dz = positions[j * 3 + 2] - positions[i * 3 + 2];
      const dist = dx * dx + dy * dy + dz * dz;
      if (dist > limitSq || dist < 1e-6) continue;
      near.push({ j, dist });
    }
    near.sort((a, b) => a.dist - b.dist);
    for (const candidate of near.slice(0, 4)) {
      const a = Math.min(i, candidate.j);
      const b = Math.max(i, candidate.j);
      const key = `${a}-${b}`;
      if (seen.has(key)) continue;
      seen.add(key);
      raw.push({
        y: positions[a * 3 + 1] + positions[b * 3 + 1],
        ax: positions[a * 3],
        ay: positions[a * 3 + 1],
        az: positions[a * 3 + 2],
        bx: positions[b * 3],
        by: positions[b * 3 + 1],
        bz: positions[b * 3 + 2],
        near: 1 - candidate.dist / limitSq,
      });
    }
  }
  raw.sort((a, b) => a.y - b.y);
  const linePositions = new Float32Array(raw.length * 6);
  const lineColors = new Float32Array(raw.length * 6);
  raw.forEach((segment, index) => {
    const cursor = index * 6;
    linePositions[cursor] = segment.ax;
    linePositions[cursor + 1] = segment.ay;
    linePositions[cursor + 2] = segment.az;
    linePositions[cursor + 3] = segment.bx;
    linePositions[cursor + 4] = segment.by;
    linePositions[cursor + 5] = segment.bz;
    const near = segment.near;
    const r = (0.9 + near * 0.06) * (0.35 + near * 0.65);
    const g = (0.29 + near * 0.38) * (0.35 + near * 0.65);
    const b = (0.15 - near * 0.12) * (0.35 + near * 0.65);
    lineColors[cursor] = r;
    lineColors[cursor + 1] = g;
    lineColors[cursor + 2] = b;
    lineColors[cursor + 3] = r;
    lineColors[cursor + 4] = g;
    lineColors[cursor + 5] = b;
  });

  const prepared: Prepared = {
    object: wrapper,
    positions,
    pointCount,
    linePositions,
    lineColors,
    segmentCount: raw.length,
  };
  return prepared;
}

function Studio() {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  useEffect(() => {
    const pmrem = new PMREMGenerator(gl);
    const studio = new Scene();
    studio.add(new AmbientLight("#f7f4ef", 0.42));
    const key = new DirectionalLight("#fff6ea", 1.3);
    key.position.set(3, 5, 4);
    studio.add(key);
    const shell = new Mesh(
      new SphereGeometry(6, 24, 16),
      new MeshBasicMaterial({ color: new Color("#16345c"), side: BackSide }),
    );
    studio.add(shell);
    const texture = pmrem.fromScene(studio, 0.04).texture;
    scene.environment = texture;
    return () => {
      scene.environment = null;
      texture.dispose();
      shell.geometry.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

function Pack() {
  const gltfs = useGLTF([...MODELS]);
  const models = useMemo(() => gltfs.map((gltf, index) => prepare(gltf.scene, MODELS[index])), [gltfs]);
  const buffers = useMemo(() => {
    const pointGeom = new BufferGeometry();
    const lineGeom = new BufferGeometry();
    pointGeom.setAttribute("position", new BufferAttribute(new Float32Array(POINT_COUNT * 3), 3).setUsage(DynamicDrawUsage));
    lineGeom.setAttribute("position", new BufferAttribute(new Float32Array(LINE_FLOATS), 3).setUsage(DynamicDrawUsage));
    lineGeom.setAttribute("color", new BufferAttribute(new Float32Array(LINE_FLOATS), 3).setUsage(DynamicDrawUsage));
    pointGeom.setDrawRange(0, 0);
    lineGeom.setDrawRange(0, 0);
    return { pointGeom, lineGeom };
  }, []);
  const group = useRef<Group>(null);
  const pointsMat = useRef<PointsMaterial>(null);
  const linesMat = useRef<LineBasicMaterial>(null);
  const shown = useRef(-1);
  const started = useRef(-1);

  useEffect(() => {
    return () => {
      buffers.pointGeom.dispose();
      buffers.lineGeom.dispose();
    };
  }, [buffers]);

  useLayoutEffect(() => {
    for (const model of models) setModelOpacity(model.object, 0);
  }, [models]);

  useFrame((state, delta) => {
    if (started.current < 0) started.current = state.clock.elapsedTime;
    const time = state.clock.elapsedTime - started.current;
    const period = SLIDE + DRAW + HOLD + FADE + SLIDE;
    const phase = time % period;
    const index = Math.floor(time / period) % models.length;
    const drawStart = SLIDE;
    const drawEnd = drawStart + DRAW;
    const fadeStart = drawEnd + HOLD;
    const exitStart = fadeStart + FADE;
    let wrap = 0;
    let scan = 0;
    if (phase >= drawStart && phase < drawEnd) {
      wrap = smooth((phase - drawStart) / DRAW);
      scan = 1;
    } else if (phase >= drawEnd && phase < fadeStart) {
      wrap = 1;
      scan = 1;
    } else if (phase >= fadeStart && phase < exitStart) {
      wrap = 1;
      scan = 1 - smooth((phase - fadeStart) / FADE);
    }
    const span = state.viewport.width * 0.55 + 1.6;
    let slide = 0;
    let modelOpacity = 1;
    if (phase < SLIDE) {
      const travel = smooth(phase / SLIDE);
      slide = (1 - travel) * span;
      modelOpacity = travel;
    } else if (phase >= exitStart) {
      const travel = smooth((phase - exitStart) / SLIDE);
      slide = -travel * span;
      modelOpacity = 1 - travel;
    }

    if (group.current) {
      const travel = phase < SLIDE ? smooth(phase / SLIDE) : 1;
      const sway = phase < SLIDE ? 0 : Math.sin((phase - SLIDE) * 0.45) * 0.08;
      const targetY = FACE + (1 - travel) * 0.7 + sway + state.pointer.x * 0.28;
      const targetX = 0.32 - state.pointer.y * 0.18;
      group.current.rotation.y += (targetY - group.current.rotation.y) * Math.min(1, delta * 4);
      group.current.rotation.x += (targetX - group.current.rotation.x) * Math.min(1, delta * 3);
      const restX = state.size.width >= 1024 ? state.viewport.width * 0.18 : 0;
      group.current.position.x = restX + slide;
      group.current.position.y = 0.44 + Math.sin(time * 0.55) * 0.05;
    }

    models.forEach((model, modelIndex) => {
      const active = modelIndex === index;
      model.object.visible = active;
      if (active) setModelOpacity(model.object, modelOpacity);
    });

    if (shown.current !== index) {
      shown.current = index;
      const model = models[index];
      const pointAttr = buffers.pointGeom.getAttribute("position") as BufferAttribute;
      const lineAttr = buffers.lineGeom.getAttribute("position") as BufferAttribute;
      const colorAttr = buffers.lineGeom.getAttribute("color") as BufferAttribute;
      (pointAttr.array as Float32Array).fill(0);
      (lineAttr.array as Float32Array).fill(0);
      (colorAttr.array as Float32Array).fill(0);
      (pointAttr.array as Float32Array).set(model.positions);
      (lineAttr.array as Float32Array).set(model.linePositions.subarray(0, Math.min(model.linePositions.length, LINE_FLOATS)));
      (colorAttr.array as Float32Array).set(model.lineColors.subarray(0, Math.min(model.lineColors.length, LINE_FLOATS)));
      pointAttr.needsUpdate = true;
      lineAttr.needsUpdate = true;
      colorAttr.needsUpdate = true;
    }

    const model = models[index];
    buffers.pointGeom.setDrawRange(0, model.pointCount);
    buffers.lineGeom.setDrawRange(0, Math.floor(model.segmentCount * wrap) * 2);
    if (pointsMat.current) pointsMat.current.opacity = smooth(Math.min(1, wrap / 0.2)) * scan * 0.95;
    if (linesMat.current) linesMat.current.opacity = scan * 0.92;
  });

  return (
    <group ref={group} scale={1.05} rotation={[0.32, FACE + 0.7, 0]}>
      {models.map((model, index) => (
        <primitive key={MODELS[index]} object={model.object} />
      ))}
      <points geometry={buffers.pointGeom} frustumCulled={false}>
        <pointsMaterial ref={pointsMat} color="#f7f4ef" size={2.6} sizeAttenuation={false} transparent opacity={0} depthWrite={false} toneMapped={false} />
      </points>
      <lineSegments geometry={buffers.lineGeom} frustumCulled={false}>
        <lineBasicMaterial ref={linesMat} vertexColors transparent opacity={0} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </lineSegments>
    </group>
  );
}

MODELS.forEach((src) => {
  useGLTF.preload(src);
});

function HeroSpot() {
  const light = useRef<SpotLight>(null);
  const scene = useThree((state) => state.scene);
  useLayoutEffect(() => {
    const spot = light.current;
    if (!spot) return;
    spot.target.position.set(1.15, 0.35, 0);
    scene.add(spot.target);
    return () => {
      scene.remove(spot.target);
    };
  }, [scene]);
  return (
    <spotLight
      ref={light}
      position={[2.6, 3.8, 3.4]}
      angle={0.62}
      penumbra={1}
      intensity={18}
      distance={12}
      decay={2}
      color="#fff4e4"
    />
  );
}

export default function HeroScene() {
  return (
    <Canvas camera={{ position: [4.35, 2.31, 4.97], fov: 46 }} dpr={[1, 1.6]} gl={{ alpha: true, antialias: true }}>
      <Suspense fallback={null}>
        <Studio />
        <ambientLight intensity={0.46} />
        <directionalLight position={[3.5, 4.5, 3]} intensity={0.9} color="#f7f4ef" />
        <directionalLight position={[-3, -1.5, -2]} intensity={0.18} color="#e54926" />
        <HeroSpot />
        <Pack />
      </Suspense>
    </Canvas>
  );
}
