"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  DynamicDrawUsage,
  IcosahedronGeometry,
  Sphere,
  Vector2,
  Vector3,
} from "three";
import type { Group, LineBasicMaterial, Mesh, MeshStandardMaterial, PointsMaterial } from "three";
import { ConvexHull } from "three/addons/math/ConvexHull.js";

const COUNT = 180;
const MAX_LINKS = 8;
const MORPH = 2;
const DRAW = 3.2;
const HOLD = 3.4;
const FADE = 0.6;
const GAP = 0.22;

const CIRCLE_SHELL = 1.14;
const CIRCLE_INNER = 1.04;
const BOX_SHELL = 0.78;
const BOX_INNER = 0.6;
const PRISM_HALF = 0.36;
const CAN_SIDES = 16;
const CAN_RADIUS = 0.96;
const CAN_HALF = 0.72;

const KINDS = ["circle", "square", "polygon", "can"] as const;
type Kind = (typeof KINDS)[number];

type Hit = { face: number; nx: number; ny: number; nz: number };

const INNER_POLY = (() => {
  const angles = [0.2, 1.15, 2.25, 3.35, 4.3, 5.45];
  const radii = [0.58, 0.82, 0.52, 0.76, 0.6, 0.88].map((radius) => radius * 0.98);
  const raw = angles
    .map((angle, index) => new Vector2(Math.cos(angle) * radii[index], Math.sin(angle) * radii[index]))
    .sort((a, b) => Math.atan2(a.y, a.x) - Math.atan2(b.y, b.x));
  const center = centroid(raw);
  return raw.map((vert) => vert.sub(center));
})();

const SHELL_POLY = offsetConvex(INNER_POLY, GAP);
const LINK_COUNTS = new Uint8Array(COUNT);
const FACE_IDS = new Int16Array(COUNT);
const NEAREST = new Uint16Array(COUNT * 2);
const NEAR_DIST = new Float32Array(COUNT * 2);

const _dir = new Vector3();
const _from = new Vector3();
const _to = new Vector3();
const _hit: Hit = { face: 0, nx: 0, ny: 0, nz: 1 };

const CIRCLE = buildCircleShell(CIRCLE_SHELL);
const BOX_CORNERS = boxCorners();
const PRISM_CORNERS = loopCorners(SHELL_POLY, PRISM_HALF + GAP);
const CAN_INNER = regularPolygon(CAN_SIDES, CAN_RADIUS);
const CAN_SHELL = offsetConvex(CAN_INNER, GAP);
const CAN_CORNERS = loopCorners(CAN_SHELL, CAN_HALF + GAP);

function offsetConvex(verts: Vector2[], dist: number) {
  const out: Vector2[] = [];
  const n = verts.length;
  for (let i = 0; i < n; i += 1) {
    const prev = verts[(i + n - 1) % n];
    const curr = verts[i];
    const next = verts[(i + 1) % n];
    const e1x = curr.x - prev.x;
    const e1y = curr.y - prev.y;
    const e2x = next.x - curr.x;
    const e2y = next.y - curr.y;
    const l1 = Math.hypot(e1x, e1y) || 1;
    const l2 = Math.hypot(e2x, e2y) || 1;
    const n1x = e1y / l1;
    const n1y = -e1x / l1;
    const n2x = e2y / l2;
    const n2y = -e2x / l2;
    let nx = n1x + n2x;
    let ny = n1y + n2y;
    const nl = Math.hypot(nx, ny) || 1;
    nx /= nl;
    ny /= nl;
    const denom = Math.max(0.45, nx * n2x + ny * n2y);
    out.push(new Vector2(curr.x + nx * (dist / denom), curr.y + ny * (dist / denom)));
  }
  return out;
}

function centroid(verts: Vector2[]) {
  let x = 0;
  let y = 0;
  for (const vert of verts) {
    x += vert.x;
    y += vert.y;
  }
  return new Vector2(x / verts.length, y / verts.length);
}

function insideConvex(verts: Vector2[], x: number, y: number) {
  for (let i = 0; i < verts.length; i += 1) {
    const a = verts[i];
    const b = verts[(i + 1) % verts.length];
    if ((b.x - a.x) * (y - a.y) - (b.y - a.y) * (x - a.x) < -1e-5) return false;
  }
  return true;
}

function buildCircleShell(inRadius: number) {
  const phi = (1 + Math.sqrt(5)) / 2;
  const seeds: [number, number, number][] = [
    [0, 1, 3 * phi],
    [1, 2 + phi, 2 * phi],
    [2, 1 + 2 * phi, phi],
  ];
  const verts: Vector3[] = [];
  const seen = new Set<string>();
  const add = (x: number, y: number, z: number) => {
    const perms: [number, number, number][] = [
      [x, y, z],
      [y, z, x],
      [z, x, y],
    ];
    for (const perm of perms) {
      for (const sx of [-1, 1]) {
        for (const sy of [-1, 1]) {
          for (const sz of [-1, 1]) {
            const vert = new Vector3(sx * perm[0], sy * perm[1], sz * perm[2]);
            const key = `${vert.x.toFixed(5)},${vert.y.toFixed(5)},${vert.z.toFixed(5)}`;
            if (seen.has(key)) continue;
            seen.add(key);
            verts.push(vert);
          }
        }
      }
    }
  };
  for (const seed of seeds) add(seed[0], seed[1], seed[2]);

  const hull = new ConvexHull().setFromPoints(verts);
  const groups: { normal: Vector3; tris: number[] }[] = [];
  const faceOf: number[] = [];
  const tris: number[][] = [];
  hull.faces.forEach((face, index) => {
    const normal = face.normal.clone().normalize();
    let group = groups.find((item) => item.normal.dot(normal) > 0.999);
    if (!group) {
      group = { normal, tris: [] };
      groups.push(group);
    }
    const groupIndex = groups.indexOf(group);
    faceOf[index] = groupIndex;
    group.tris.push(index);
    tris.push([verts.indexOf(face.edge.tail().point), verts.indexOf(face.edge.head().point), verts.indexOf(face.edge.next.head().point)]);
  });

  let inR = Number.POSITIVE_INFINITY;
  for (const group of groups) {
    const point = hull.faces[group.tris[0]].edge.tail().point;
    inR = Math.min(inR, Math.abs(group.normal.dot(point)));
  }
  const scale = inRadius / inR;
  for (const vert of verts) vert.multiplyScalar(scale);

  const faceVerts: number[][] = groups.map(() => []);
  tris.forEach((tri, index) => {
    const bucket = faceVerts[faceOf[index]];
    for (const vertex of tri) if (!bucket.includes(vertex)) bucket.push(vertex);
  });
  const centers = faceVerts.map((ids) => {
    const center = new Vector3();
    for (const id of ids) center.add(verts[id]);
    return center.multiplyScalar(1 / ids.length);
  });
  const spokes: [number, number][] = [];
  faceVerts.forEach((ids, face) => {
    const centerIndex = verts.length + face;
    for (const id of ids) spokes.push([centerIndex, id]);
  });

  const edges: [number, number][] = [];
  const edgeFaces = new Map<string, number>();
  tris.forEach((tri, index) => {
    for (let k = 0; k < 3; k += 1) {
      const a = tri[k];
      const b = tri[(k + 1) % 3];
      const key = a < b ? `${a}-${b}` : `${b}-${a}`;
      const previous = edgeFaces.get(key);
      if (previous === undefined) edgeFaces.set(key, faceOf[index]);
      else if (previous !== faceOf[index] && previous !== -1) {
        edgeFaces.set(key, -1);
        edges.push([a, b]);
      }
    }
  });
  edges.sort((a, b) => verts[b[0]].y + verts[b[1]].y - (verts[a[0]].y + verts[a[1]].y));
  return { verts, tris, faceOf, edges, centers, spokes };
}

function boxCorners() {
  const dirs: Vector3[] = [];
  const edges: [number, number][] = [];
  for (const x of [-1, 1]) {
    for (const y of [-1, 1]) {
      for (const z of [-1, 1]) dirs.push(new Vector3(x, y, z).normalize());
    }
  }
  for (let i = 0; i < dirs.length; i += 1) {
    for (let j = i + 1; j < dirs.length; j += 1) {
      const difference = Math.abs(Math.sign(dirs[i].x) - Math.sign(dirs[j].x)) + Math.abs(Math.sign(dirs[i].y) - Math.sign(dirs[j].y)) + Math.abs(Math.sign(dirs[i].z) - Math.sign(dirs[j].z));
      if (difference === 2) edges.push([i, j]);
    }
  }
  edges.sort((a, b) => dirs[b[0]].y + dirs[b[1]].y - (dirs[a[0]].y + dirs[a[1]].y));
  return { dirs, edges };
}

function loopCorners(verts: Vector2[], half: number) {
  const dirs: Vector3[] = [];
  const edges: [number, number][] = [];
  const n = verts.length;
  for (const z of [-half, half]) {
    for (const vert of verts) dirs.push(new Vector3(vert.x, vert.y, z).normalize());
  }
  for (let i = 0; i < n; i += 1) {
    edges.push([i, (i + 1) % n]);
    edges.push([n + i, n + ((i + 1) % n)]);
    edges.push([i, n + i]);
  }
  edges.sort((a, b) => dirs[b[0]].y + dirs[b[1]].y - (dirs[a[0]].y + dirs[a[1]].y));
  return { dirs, edges };
}

function regularPolygon(sides: number, radius: number) {
  const verts: Vector2[] = [];
  for (let i = 0; i < sides; i += 1) {
    const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
    verts.push(new Vector2(Math.cos(angle) * radius, Math.sin(angle) * radius));
  }
  return verts;
}

function fibDirection(index: number, target: Vector3) {
  const y = 1 - (index / (COUNT - 1)) * 2;
  const ring = Math.sqrt(Math.max(0, 1 - y * y));
  const theta = Math.PI * (3 - Math.sqrt(5)) * index;
  target.set(Math.cos(theta) * ring, y, Math.sin(theta) * ring);
}

function rayTriangle(dir: Vector3, a: Vector3, b: Vector3, c: Vector3) {
  const e1x = b.x - a.x;
  const e1y = b.y - a.y;
  const e1z = b.z - a.z;
  const e2x = c.x - a.x;
  const e2y = c.y - a.y;
  const e2z = c.z - a.z;
  const px = dir.y * e2z - dir.z * e2y;
  const py = dir.z * e2x - dir.x * e2z;
  const pz = dir.x * e2y - dir.y * e2x;
  const det = e1x * px + e1y * py + e1z * pz;
  if (Math.abs(det) < 1e-8) return null;
  const inv = 1 / det;
  const tx = -a.x;
  const ty = -a.y;
  const tz = -a.z;
  const u = (tx * px + ty * py + tz * pz) * inv;
  if (u < -1e-4 || u > 1) return null;
  const qx = ty * e1z - tz * e1y;
  const qy = tz * e1x - tx * e1z;
  const qz = tx * e1y - ty * e1x;
  const v = (dir.x * qx + dir.y * qy + dir.z * qz) * inv;
  if (v < -1e-4 || u + v > 1) return null;
  const t = (e2x * qx + e2y * qy + e2z * qz) * inv;
  return t > 1e-4 ? t : null;
}

function projectBox(dir: Vector3, half: number, target: Vector3, hit?: Hit) {
  const tx = half / Math.max(1e-5, Math.abs(dir.x));
  const ty = half / Math.max(1e-5, Math.abs(dir.y));
  const tz = half / Math.max(1e-5, Math.abs(dir.z));
  let t = tx;
  let face = dir.x >= 0 ? 0 : 1;
  if (ty < t) {
    t = ty;
    face = dir.y >= 0 ? 2 : 3;
  }
  if (tz < t) {
    t = tz;
    face = dir.z >= 0 ? 4 : 5;
  }
  target.set(dir.x * t, dir.y * t, dir.z * t);
  if (hit) {
    hit.face = face;
    hit.nx = face < 2 ? (face === 0 ? 1 : -1) : 0;
    hit.ny = face >= 2 && face < 4 ? (face === 2 ? 1 : -1) : 0;
    hit.nz = face >= 4 ? (face === 4 ? 1 : -1) : 0;
  }
}

function projectPrism(dir: Vector3, verts: Vector2[], halfZ: number, target: Vector3, hit?: Hit) {
  let best = Number.POSITIVE_INFINITY;
  let face = 0;
  let nx = 0;
  let ny = 0;
  let nz = 1;

  if (Math.abs(dir.z) > 1e-5) {
    const t = halfZ / Math.abs(dir.z);
    if (insideConvex(verts, dir.x * t, dir.y * t)) {
      best = t;
      face = dir.z >= 0 ? 0 : 1;
      nz = dir.z >= 0 ? 1 : -1;
      nx = 0;
      ny = 0;
    }
  }

  for (let i = 0; i < verts.length; i += 1) {
    const a = verts[i];
    const b = verts[(i + 1) % verts.length];
    const ex = b.x - a.x;
    const ey = b.y - a.y;
    const det = dir.x * ey - dir.y * ex;
    if (Math.abs(det) < 1e-6) continue;
    const t = (a.x * ey - a.y * ex) / det;
    const u = (a.x * dir.y - a.y * dir.x) / det;
    if (t > 1e-4 && u >= 0 && u <= 1 && Math.abs(dir.z * t) <= halfZ + 1e-3 && t < best) {
      best = t;
      face = 2 + i;
      const len = Math.hypot(ey, ex) || 1;
      nx = ey / len;
      ny = -ex / len;
      nz = 0;
    }
  }

  const t = Number.isFinite(best) ? best : halfZ;
  target.set(dir.x * t, dir.y * t, dir.z * t);
  if (hit) {
    hit.face = face;
    hit.nx = nx;
    hit.ny = ny;
    hit.nz = nz;
  }
}

function projectCircle(dir: Vector3, target: Vector3, hit: Hit) {
  let best = Number.POSITIVE_INFINITY;
  let face = 0;
  for (let i = 0; i < CIRCLE.tris.length; i += 1) {
    const [ia, ib, ic] = CIRCLE.tris[i];
    const t = rayTriangle(dir, CIRCLE.verts[ia], CIRCLE.verts[ib], CIRCLE.verts[ic]);
    if (t !== null && t < best) {
      best = t;
      face = CIRCLE.faceOf[i];
    }
  }
  const distance = Number.isFinite(best) ? best : CIRCLE_SHELL * 1.1;
  target.set(dir.x * distance, dir.y * distance, dir.z * distance);
  hit.face = face;
  hit.nx = 0;
  hit.ny = 0;
  hit.nz = 1;
}

function projectShell(kind: Kind, dir: Vector3, target: Vector3, hit: Hit) {
  if (kind === "circle") projectCircle(dir, target, hit);
  else if (kind === "square") projectBox(dir, BOX_SHELL, target, hit);
  else if (kind === "can") projectPrism(dir, CAN_SHELL, CAN_HALF + GAP, target, hit);
  else projectPrism(dir, SHELL_POLY, PRISM_HALF + GAP, target, hit);
}

function projectInner(kind: Kind, dir: Vector3, target: Vector3) {
  if (kind === "circle") target.set(dir.x, dir.y, dir.z).multiplyScalar(CIRCLE_INNER);
  else if (kind === "square") projectBox(dir, BOX_INNER, target);
  else if (kind === "can") projectPrism(dir, CAN_INNER, CAN_HALF, target);
  else projectPrism(dir, INNER_POLY, PRISM_HALF, target);
}

function smooth(value: number) {
  const t = Math.min(1, Math.max(0, value));
  return t * t * (3 - 2 * t);
}

function Pack() {
  const group = useRef<Group>(null);
  const form = useRef<Mesh>(null);
  const formMat = useRef<MeshStandardMaterial>(null);
  const pointsMat = useRef<PointsMaterial>(null);
  const linesMat = useRef<LineBasicMaterial>(null);
  const edgesMat = useRef<LineBasicMaterial>(null);

  const buffers = useMemo(() => {
    const pointPositions = new Float32Array(COUNT * 3);
    const linePositions = new Float32Array(COUNT * MAX_LINKS * 3);
    const lineColors = new Float32Array(COUNT * MAX_LINKS * 3);
    const edgePositions = new Float32Array(96 * 6);
    const pointGeom = new BufferGeometry();
    const lineGeom = new BufferGeometry();
    const edgeGeom = new BufferGeometry();
    pointGeom.setAttribute("position", new BufferAttribute(pointPositions, 3).setUsage(DynamicDrawUsage));
    lineGeom.setAttribute("position", new BufferAttribute(linePositions, 3).setUsage(DynamicDrawUsage));
    lineGeom.setAttribute("color", new BufferAttribute(lineColors, 3).setUsage(DynamicDrawUsage));
    edgeGeom.setAttribute("position", new BufferAttribute(edgePositions, 3).setUsage(DynamicDrawUsage));
    lineGeom.setDrawRange(0, 0);
    edgeGeom.setDrawRange(0, 0);

    const geometry = new IcosahedronGeometry(1, 4);
    const position = geometry.getAttribute("position");
    const directions = new Float32Array(position.count * 3);
    for (let i = 0; i < position.count; i += 1) {
      const x = position.getX(i);
      const y = position.getY(i);
      const z = position.getZ(i);
      const length = Math.hypot(x, y, z) || 1;
      directions[i * 3] = x / length;
      directions[i * 3 + 1] = y / length;
      directions[i * 3 + 2] = z / length;
    }
    geometry.boundingSphere = new Sphere(new Vector3(), 2);
    return { pointPositions, linePositions, lineColors, edgePositions, pointGeom, lineGeom, edgeGeom, geometry, directions };
  }, []);

  useEffect(() => {
    return () => {
      buffers.pointGeom.dispose();
      buffers.lineGeom.dispose();
      buffers.edgeGeom.dispose();
      buffers.geometry.dispose();
    };
  }, [buffers]);

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime + MORPH;
    const period = MORPH + DRAW + HOLD;
    const phase = time % period;
    const index = Math.floor(time / period) % KINDS.length;
    const settled = KINDS[index];
    const previous = KINDS[(index + KINDS.length - 1) % KINDS.length];
    const forming = phase < MORPH;
    const blend = forming ? smooth(phase / MORPH) : 1;
    const wrap = forming ? 1 : smooth(Math.min(1, (phase - MORPH) / DRAW));
    const gridOpacity = forming ? 1 - smooth(Math.min(1, phase / FADE)) : 1;
    const pointIn = forming ? gridOpacity : smooth(Math.min(1, (phase - MORPH) / 0.45));
    const pulse = Math.sin(time * 0.65) * 0.5 + 0.5;

    if (group.current) {
      const targetY = time * 0.12 + state.pointer.x * 0.4;
      const targetX = 0.32 - state.pointer.y * 0.18;
      group.current.rotation.y += (targetY - group.current.rotation.y) * Math.min(1, delta * 3);
      group.current.rotation.x += (targetX - group.current.rotation.x) * Math.min(1, delta * 3);
      group.current.position.x = state.size.width >= 1024 ? state.viewport.width * 0.18 : 0;
      group.current.position.y = 0.44 + Math.sin(time * 0.55) * 0.05;
    }

    const formPosition = buffers.geometry.getAttribute("position") as BufferAttribute;
    for (let i = 0; i < formPosition.count; i += 1) {
      _dir.set(buffers.directions[i * 3], buffers.directions[i * 3 + 1], buffers.directions[i * 3 + 2]);
      projectInner(forming ? previous : settled, _dir, _from);
      if (forming) {
        projectInner(settled, _dir, _to);
        const near = _from.dot(_dir);
        const far = _to.dot(_dir);
        _from.copy(_dir).multiplyScalar(near + (far - near) * blend);
      }
      formPosition.setXYZ(i, _from.x, _from.y, _from.z);
    }
    formPosition.needsUpdate = true;
    buffers.geometry.computeVertexNormals();

    const points = buffers.pointPositions;
    const gridKind = forming ? previous : settled;
    for (let i = 0; i < COUNT; i += 1) {
      fibDirection(i, _dir);
      projectShell(gridKind, _dir, _from, _hit);
      FACE_IDS[i] = _hit.face;
      points[i * 3] = _from.x;
      points[i * 3 + 1] = _from.y;
      points[i * 3 + 2] = _from.z;
    }

    const links = LINK_COUNTS;
    links.fill(0);
    const lines = buffers.linePositions;
    const colors = buffers.lineColors;
    let segments = 0;
    const maxSegments = (COUNT * MAX_LINKS) / 2;
    const shellKind = gridKind;
    const local = shellKind === "square" ? 0.64 : shellKind === "circle" ? 0.58 : 0.62;
    const extra = local * (0.55 + pulse * 0.45);
    const localLimit = local * local;
    const extraLimit = extra * extra;
    for (let i = 0; i < COUNT * 2; i += 1) {
      NEAREST[i] = 65535;
      NEAR_DIST[i] = 1e6;
    }

    const writeLink = (i: number, j: number, limit: number) => {
      if (links[i] >= MAX_LINKS || links[j] >= MAX_LINKS || segments >= maxSegments) return false;
      const ax = points[i * 3];
      const ay = points[i * 3 + 1];
      const az = points[i * 3 + 2];
      const dx = points[j * 3] - ax;
      const dy = points[j * 3 + 1] - ay;
      const dz = points[j * 3 + 2] - az;
      const dist = dx * dx + dy * dy + dz * dz;
      if (dist > limit || dist < 1e-5) return false;
      const cursor = segments * 6;
      lines[cursor] = ax;
      lines[cursor + 1] = ay;
      lines[cursor + 2] = az;
      lines[cursor + 3] = points[j * 3];
      lines[cursor + 4] = points[j * 3 + 1];
      lines[cursor + 5] = points[j * 3 + 2];
      const near = 1 - dist / limit;
      const r = (0.9 + near * 0.06) * (0.35 + near * 0.65);
      const g = (0.29 + near * 0.38) * (0.35 + near * 0.65);
      const b = (0.15 - near * 0.12) * (0.35 + near * 0.65);
      colors[cursor] = r;
      colors[cursor + 1] = g;
      colors[cursor + 2] = b;
      colors[cursor + 3] = r;
      colors[cursor + 4] = g;
      colors[cursor + 5] = b;
      links[i] += 1;
      links[j] += 1;
      segments += 1;
      return true;
    };

    const consider = (i: number, j: number, dist: number) => {
      const slot = i * 2;
      if (dist < NEAR_DIST[slot]) {
        NEAR_DIST[slot + 1] = NEAR_DIST[slot];
        NEAREST[slot + 1] = NEAREST[slot];
        NEAR_DIST[slot] = dist;
        NEAREST[slot] = j;
      } else if (dist < NEAR_DIST[slot + 1]) {
        NEAR_DIST[slot + 1] = dist;
        NEAREST[slot + 1] = j;
      }
    };

    for (let i = 0; i < COUNT; i += 1) {
      const ax = points[i * 3];
      const ay = points[i * 3 + 1];
      const az = points[i * 3 + 2];
      for (let j = i + 1; j < COUNT; j += 1) {
        if (FACE_IDS[i] !== FACE_IDS[j]) continue;
        const dx = points[j * 3] - ax;
        const dy = points[j * 3 + 1] - ay;
        const dz = points[j * 3 + 2] - az;
        const dist = dx * dx + dy * dy + dz * dz;
        if (dist >= localLimit) continue;
        consider(i, j, dist);
        consider(j, i, dist);
      }
    }

    for (let i = 0; i < COUNT; i += 1) {
      for (let k = 0; k < 2; k += 1) {
        const j = NEAREST[i * 2 + k];
        if (j === 65535 || j < i) continue;
        writeLink(i, j, localLimit);
      }
    }

    for (let i = 0; i < COUNT; i += 1) {
      if (links[i] >= MAX_LINKS || segments >= maxSegments) continue;
      const ax = points[i * 3];
      const ay = points[i * 3 + 1];
      const az = points[i * 3 + 2];
      for (let j = i + 1; j < COUNT; j += 1) {
        if (links[i] >= MAX_LINKS || segments >= maxSegments) break;
        if (FACE_IDS[i] !== FACE_IDS[j]) continue;
        const slot = i * 2;
        if (NEAREST[slot] === j || NEAREST[slot + 1] === j || NEAREST[j * 2] === i || NEAREST[j * 2 + 1] === i) continue;
        const dx = points[j * 3] - ax;
        const dy = points[j * 3 + 1] - ay;
        const dz = points[j * 3 + 2] - az;
        if (dx * dx + dy * dy + dz * dz > extraLimit) continue;
        writeLink(i, j, extraLimit);
      }
    }

    (buffers.pointGeom.getAttribute("position") as BufferAttribute).needsUpdate = true;
    buffers.pointGeom.setDrawRange(0, COUNT);
    (buffers.lineGeom.getAttribute("position") as BufferAttribute).needsUpdate = true;
    (buffers.lineGeom.getAttribute("color") as BufferAttribute).needsUpdate = true;
    buffers.lineGeom.setDrawRange(0, Math.floor(segments * wrap) * 2);

    const outline =
      gridKind === "circle"
        ? { dirs: CIRCLE.verts, edges: CIRCLE.edges }
        : gridKind === "square"
          ? BOX_CORNERS
          : gridKind === "can"
            ? CAN_CORNERS
            : PRISM_CORNERS;
    const edgePositions = buffers.edgePositions;
    const edgeReveal = forming ? 1 : wrap;
    outline.edges.forEach(([a, b], edgeIndex) => {
      _dir.copy(outline.dirs[a]).normalize();
      projectShell(gridKind, _dir, _from, _hit);
      const ax = _from.x;
      const ay = _from.y;
      const az = _from.z;
      _dir.copy(outline.dirs[b]).normalize();
      projectShell(gridKind, _dir, _from, _hit);
      const cursor = edgeIndex * 6;
      edgePositions[cursor] = ax;
      edgePositions[cursor + 1] = ay;
      edgePositions[cursor + 2] = az;
      edgePositions[cursor + 3] = _from.x;
      edgePositions[cursor + 4] = _from.y;
      edgePositions[cursor + 5] = _from.z;
    });
    (buffers.edgeGeom.getAttribute("position") as BufferAttribute).needsUpdate = true;
    buffers.edgeGeom.setDrawRange(0, Math.floor(outline.edges.length * edgeReveal) * 2);

    if (pointsMat.current) pointsMat.current.opacity = pointIn * 0.95;
    if (linesMat.current) linesMat.current.opacity = (forming ? gridOpacity : 1) * 0.92;
    if (edgesMat.current) edgesMat.current.opacity = forming ? gridOpacity : 1;
  });

  return (
    <group ref={group} scale={1.05} rotation={[0.32, 0.45, 0]}>
      <mesh ref={form} geometry={buffers.geometry}>
        <meshStandardMaterial ref={formMat} color="#f4efe6" roughness={0.58} metalness={0.04} />
      </mesh>
      <points geometry={buffers.pointGeom} frustumCulled={false}>
        <pointsMaterial ref={pointsMat} color="#f7f4ef" size={3.1} sizeAttenuation={false} transparent opacity={0} depthWrite={false} toneMapped={false} />
      </points>
      <lineSegments geometry={buffers.lineGeom} frustumCulled={false}>
        <lineBasicMaterial ref={linesMat} vertexColors transparent opacity={0} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </lineSegments>
      <lineSegments geometry={buffers.edgeGeom} frustumCulled={false}>
        <lineBasicMaterial ref={edgesMat} color="#f4aa00" transparent opacity={0} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </lineSegments>
    </group>
  );
}

export default function HeroScene() {
  return (
    <Canvas camera={{ position: [4.35, 2.31, 4.97], fov: 46 }} dpr={[1, 1.6]} gl={{ alpha: true, antialias: true }}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3.5, 4.5, 3]} intensity={1.35} color="#f7f4ef" />
      <directionalLight position={[-3, -1.5, -2]} intensity={0.35} color="#e54926" />
      <Pack />
    </Canvas>
  );
}
