#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

globalThis.FileReader ??= class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((value) => { this.result = value; this.onloadend?.(); });
  }
};

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT = path.join(ROOT, "public", "models", "lamuh_prototype_v0.glb");
const scene = new THREE.Scene();
scene.name = "lamuh_prototype_v0";

const bone = (name, parent, position) => {
  const value = new THREE.Bone(); value.name = name; value.position.fromArray(position); parent.add(value); return value;
};
const root = new THREE.Bone(); root.name = "root"; scene.add(root);
const pelvis = bone("pelvis", root, [0, 0.82, 0]);
const spineLower = bone("spine_lower", pelvis, [0, 0.18, 0]);
const spineMid = bone("spine_mid", spineLower, [0, 0.20, 0]);
const spineUpper = bone("spine_upper", spineMid, [0, 0.20, 0]);
const chest = bone("chest", spineUpper, [0, 0.18, 0]);
const neck = bone("neck", chest, [0, 0.24, 0]);
const head = bone("head", neck, [0, 0.18, 0]);
const clavicleL = bone("clavicle_l", chest, [0, 0.14, 0.22]);
const upperArmL = bone("upper_arm_l", clavicleL, [0, -0.10, 0.10]);
const forearmL = bone("forearm_l", upperArmL, [0, -0.34, 0.06]);
const handL = bone("hand_l", forearmL, [0.02, -0.30, 0]);
const clavicleR = bone("clavicle_r", chest, [0, 0.14, -0.22]);
const upperArmR = bone("upper_arm_r", clavicleR, [0, -0.10, -0.10]);
const forearmR = bone("forearm_r", upperArmR, [0, -0.34, -0.06]);
const handR = bone("hand_r", forearmR, [0.02, -0.30, 0]);
const thighL = bone("thigh_l", pelvis, [0, -0.08, 0.14]);
const shinL = bone("shin_l", thighL, [0, -0.43, 0]);
const footL = bone("foot_l", shinL, [0.08, -0.43, 0]);
bone("toe_l", footL, [0.20, -0.04, 0]);
const thighR = bone("thigh_r", pelvis, [0, -0.08, -0.14]);
const shinR = bone("shin_r", thighR, [0, -0.43, 0]);
const footR = bone("foot_r", shinR, [0.08, -0.43, 0]);
bone("toe_r", footR, [0.20, -0.04, 0]);
const bones = [];
root.traverse((node) => { if (node.isBone) bones.push(node); });
scene.updateMatrixWorld(true);
const boneIndex = Object.fromEntries(bones.map((value, index) => [value.name, index]));
const skeleton = new THREE.Skeleton(bones);

const palette = [
  new THREE.MeshStandardMaterial({ name: "skin_brown", color: 0x4a2418, roughness: 0.9 }),
  new THREE.MeshStandardMaterial({ name: "coat_white", color: 0xf3ead8, roughness: 0.8 }),
  new THREE.MeshStandardMaterial({ name: "cloth_black", color: 0x111319, roughness: 0.95 }),
  new THREE.MeshStandardMaterial({ name: "gold_trim", color: 0xd7a928, metalness: 0.25, roughness: 0.55 }),
  new THREE.MeshStandardMaterial({ name: "teal_sash", color: 0x078c86, roughness: 0.72 }),
  new THREE.MeshStandardMaterial({ name: "hair_black", color: 0x09090c, roughness: 1 }),
  new THREE.MeshStandardMaterial({ name: "eye_teal", color: 0x45f1df, emissive: 0x063c38, roughness: 0.45 })
];

const layers = { body: [], clothing: [], hair: [], accessories: [] };
function part(layer, geometry, position, scale, boneName, materialIndex, rotation = [0, 0, 0]) {
  const value = geometry.toNonIndexed();
  const matrix = new THREE.Matrix4().compose(new THREE.Vector3(...position), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)), new THREE.Vector3(...scale));
  value.applyMatrix4(matrix);
  const count = value.getAttribute("position").count;
  const indices = new Uint16Array(count * 4), weights = new Float32Array(count * 4);
  for (let index = 0; index < count; index++) { indices[index * 4] = boneIndex[boneName]; weights[index * 4] = 1; }
  value.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(indices, 4));
  value.setAttribute("skinWeight", new THREE.Float32BufferAttribute(weights, 4));
  value.userData.materialIndex = materialIndex;
  layers[layer].push(value);
}
const sphere = () => new THREE.SphereGeometry(1, 12, 8);
const box = () => new THREE.BoxGeometry(1, 1, 1, 1, 1, 1);
const cylinder = () => new THREE.CylinderGeometry(1, 1, 1, 10, 1);
const cone = () => new THREE.ConeGeometry(1, 1, 10, 1);

part("body", sphere(), [0, 1.82, 0], [0.19, 0.23, 0.18], "head", 0);
part("body", sphere(), [0.16, 1.82, 0], [0.08, 0.07, 0.07], "head", 0);
part("body", cylinder(), [0, 1.36, 0.30], [0.10, 0.34, 0.10], "upper_arm_l", 0, [0, 0, -0.04]);
part("body", cylinder(), [0.01, 1.02, 0.34], [0.09, 0.30, 0.09], "forearm_l", 0);
part("body", sphere(), [0.05, 0.77, 0.34], [0.11, 0.13, 0.10], "hand_l", 0);
part("body", cylinder(), [0, 1.36, -0.30], [0.10, 0.34, 0.10], "upper_arm_r", 0, [0, 0, 0.04]);
part("body", cylinder(), [0.01, 1.02, -0.34], [0.09, 0.30, 0.09], "forearm_r", 0);
part("body", sphere(), [0.05, 0.77, -0.34], [0.11, 0.13, 0.10], "hand_r", 0);

part("clothing", box(), [0, 1.38, 0], [0.40, 0.63, 0.47], "chest", 1);
part("clothing", box(), [-0.04, 0.78, 0.23], [0.14, 0.72, 0.39], "pelvis", 1, [0, 0, 0.05]);
part("clothing", box(), [-0.04, 0.78, -0.23], [0.14, 0.72, 0.39], "pelvis", 1, [0, 0, 0.05]);
part("clothing", box(), [0.01, 1.40, 0.245], [0.42, 0.06, 0.025], "chest", 3);
part("clothing", box(), [0.01, 1.40, -0.245], [0.42, 0.06, 0.025], "chest", 3);
part("clothing", box(), [0.11, 1.16, 0], [0.08, 0.50, 0.40], "spine_mid", 2);
part("clothing", cylinder(), [0, 0.52, 0.15], [0.17, 0.43, 0.16], "thigh_l", 2);
part("clothing", cylinder(), [0.02, 0.13, 0.15], [0.15, 0.35, 0.14], "shin_l", 2);
part("clothing", cylinder(), [0, 0.52, -0.15], [0.17, 0.43, 0.16], "thigh_r", 2);
part("clothing", cylinder(), [0.02, 0.13, -0.15], [0.15, 0.35, 0.14], "shin_r", 2);
part("clothing", box(), [0.10, 1.05, 0], [0.09, 0.12, 0.48], "pelvis", 4, [0, 0, -0.08]);
part("clothing", box(), [0.05, 0.54, -0.25], [0.08, 0.62, 0.12], "pelvis", 4, [0, 0, -0.08]);
part("clothing", box(), [0.13, 0.02, 0.15], [0.36, 0.09, 0.20], "foot_l", 3);
part("clothing", box(), [0.13, 0.02, -0.15], [0.36, 0.09, 0.20], "foot_r", 3);

part("hair", sphere(), [-0.05, 1.94, 0], [0.22, 0.21, 0.24], "head", 5);
for (let index = 0; index < 14; index++) {
  const angle = (index / 14) * Math.PI * 2;
  part("hair", cylinder(), [-0.06 + Math.cos(angle) * 0.08, 1.94 + Math.sin(angle) * 0.10, Math.sin(angle * 1.7) * 0.18], [0.035, 0.23 + (index % 3) * 0.035, 0.035], "head", 5, [Math.sin(angle) * 0.8, 0, Math.cos(angle) * 0.9]);
}
part("hair", box(), [0.14, 1.72, 0], [0.04, 0.11, 0.16], "head", 5);
part("accessories", sphere(), [0.183, 1.86, 0.07], [0.026, 0.020, 0.018], "head", 6);
part("accessories", sphere(), [0.183, 1.86, -0.07], [0.026, 0.020, 0.018], "head", 6);
part("accessories", cylinder(), [0.13, 1.21, 0], [0.018, 0.23, 0.018], "chest", 3);
part("accessories", sphere(), [0.13, 1.02, 0], [0.075, 0.085, 0.035], "spine_mid", 3);

for (const [name, geometries] of Object.entries(layers)) {
  const geometry = mergeGeometries(geometries, true);
  const materialIndices = geometries.map((value) => value.userData.materialIndex);
  geometry.groups.forEach((group, index) => { group.materialIndex = materialIndices[index]; });
  const mesh = new THREE.SkinnedMesh(geometry, palette); mesh.name = `lamuh_${name}`; mesh.frustumCulled = false; mesh.bind(skeleton); scene.add(mesh);
}

function anchor(name, parent, position) { const node = new THREE.Object3D(); node.name = name; node.position.fromArray(position); parent.add(node); }
anchor("grab_anchor", handL, [0.18, -0.03, 0]); anchor("victim_anchor", chest, [0.38, 0.02, 0]); anchor("release_anchor", handR, [0.32, 0, 0]);
anchor("camera_face", head, [0.20, 0.03, 0]); anchor("camera_chest", chest, [0.18, 0, 0]);
anchor("vfx_hand_l", handL, [0.12, -0.03, 0]); anchor("vfx_hand_r", handR, [0.12, -0.03, 0]);
anchor("vfx_foot_l", footL, [0.22, -0.03, 0]); anchor("vfx_foot_r", footR, [0.22, -0.03, 0]);
anchor("ground_foot_l", footL, [0, -0.05, 0]); anchor("ground_foot_r", footR, [0, -0.05, 0]);

const q = (x = 0, y = 0, z = 0) => new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z)).toArray();
function clip(name, duration, pose = {}) {
  const tracks = [];
  for (const [boneName, values] of Object.entries(pose)) {
    const sequence = Array.isArray(values[0]) ? values : [[0, 0, 0], values, [0, 0, 0]];
    const times = sequence.map((_, index) => (duration * index) / Math.max(1, sequence.length - 1));
    tracks.push(new THREE.QuaternionKeyframeTrack(`${boneName}.quaternion`, times, sequence.flatMap((value) => q(...value))));
  }
  if (!tracks.length) tracks.push(new THREE.QuaternionKeyframeTrack("chest.quaternion", [0, duration / 2, duration], [...q(), ...q(0, 0, 0.03), ...q()]));
  return new THREE.AnimationClip(name, duration, tracks);
}
const animations = [
  clip("idle", 1.2, { chest: [[0,0,-0.02],[0,0,0.03],[0,0,-0.02]], head: [0,0,0.02] }),
  clip("walk_forward", 0.72, { thigh_l: [[0,0,0.45],[0,0,-0.45],[0,0,0.45]], thigh_r: [[0,0,-0.45],[0,0,0.45],[0,0,-0.45]], upper_arm_l: [[0,0,-0.3],[0,0,0.3],[0,0,-0.3]] }),
  clip("walk_backward", 0.82, { thigh_l: [[0,0,-0.35],[0,0,0.35],[0,0,-0.35]], thigh_r: [[0,0,0.35],[0,0,-0.35],[0,0,0.35]] }),
  clip("crouch", 0.4, { spine_lower: [0,0,-0.20], thigh_l: [0,0,0.55], thigh_r: [0,0,0.55], shin_l: [0,0,-0.9], shin_r: [0,0,-0.9] }),
  clip("jump_startup", 0.16, { spine_lower: [0,0,-0.15], thigh_l: [0,0,0.55], thigh_r: [0,0,0.55] }),
  clip("jump_air", 0.6, { thigh_l: [0,0,0.28], thigh_r: [0,0,-0.18], upper_arm_l: [0.1,0,-0.3], upper_arm_r: [-0.1,0,-0.3] }),
  clip("landing", 0.2, { spine_lower: [0,0,-0.18], thigh_l: [0,0,0.42], thigh_r: [0,0,0.42] }),
  clip("dash_forward", 0.2, { spine_lower: [0,0,-0.30], thigh_l: [0,0,-0.55], thigh_r: [0,0,0.45] }),
  clip("backdash", 0.24, { spine_lower: [0,0,0.25], thigh_l: [0,0,0.35], thigh_r: [0,0,-0.35] }),
  clip("turn", 0.18, { chest: [0,0.45,0], head: [0,-0.35,0] }),
  clip("standing_light", 0.28, { chest: [0,-0.18,-0.08], upper_arm_l: [0,0,-1.25], forearm_l: [0,0,-0.25] }),
  clip("standing_medium", 0.42, { chest: [0,-0.28,-0.14], upper_arm_r: [0,0,-1.35], forearm_r: [0,0,-0.55] }),
  clip("standing_heavy", 0.58, { chest: [0,-0.38,-0.22], upper_arm_l: [0,0,-1.55], upper_arm_r: [0,0,-0.80] }),
  clip("crouching_light", 0.31, { spine_lower: [0,0,-0.30], upper_arm_l: [0,0,-1.15] }),
  clip("crouching_medium", 0.45, { spine_lower: [0,0,-0.32], thigh_l: [0,0,-1.05], shin_l: [0,0,0.45] }),
  clip("crouching_heavy", 0.62, { spine_lower: [0,0,-0.42], upper_arm_r: [0,0,-1.35], chest: [0,-0.25,-0.3] }),
  clip("air_light", 0.30, { chest: [0,-0.12,-0.12], upper_arm_l: [0,0,-1.15], thigh_l: [0,0,0.25] }),
  clip("air_medium", 0.43, { chest: [0,-0.20,-0.2], thigh_r: [0,0,-1.05], shin_r: [0,0,0.48] }),
  clip("air_heavy", 0.61, { chest: [0,-0.28,-0.35], upper_arm_l: [0,0,-1.55], upper_arm_r: [0,0,-1.0], thigh_l: [0,0,0.55] }),
  clip("standing_block", 0.3, { upper_arm_l: [0,0,-0.85], forearm_l: [0,0,-1.1], upper_arm_r: [0,0,-0.85], forearm_r: [0,0,-1.1] }),
  clip("crouching_block", 0.3, { spine_lower: [0,0,-0.30], upper_arm_l: [0,0,-0.9], forearm_l: [0,0,-1.05] }),
  clip("light_hit", 0.25, { chest: [0,0,0.22], head: [0,0,0.22] }),
  clip("heavy_hit", 0.48, { chest: [0,0,0.52], head: [0,0,0.40], upper_arm_l: [0,0,0.45] }),
  clip("knockdown", 0.7, { pelvis: [1.25,0,0], chest: [0,0,0.35], thigh_l: [0,0,-0.6] }),
  clip("get_up", 0.72, { pelvis: [[1.25,0,0],[0.55,0,0],[0,0,0]], spine_lower: [[0,0,0.45],[0,0,-0.3],[0,0,0]] }),
  clip("forward_throw_attacker", 0.86, { chest: [0,-0.45,-0.22], upper_arm_l: [0,0,-1.25], upper_arm_r: [0,0,-1.2], pelvis: [0,-0.25,0] }),
  clip("forward_throw_whiff", 0.52, { chest: [0,-0.22,-0.28], upper_arm_l: [0,0,-1.1] }),
  clip("throw_tech_attacker", 0.38, { chest: [0,0,0.25], upper_arm_l: [0,0,-0.7], upper_arm_r: [0,0,-0.7] }),
  clip("throw_tech_victim", 0.38, { chest: [0,0,0.38], head: [0,0,0.25] })
];

const exporter = new GLTFExporter();
const binary = await exporter.parseAsync(scene, { binary: true, animations, onlyVisible: false });
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, Buffer.from(binary));
console.log(`Wrote ${path.relative(ROOT, OUTPUT)} (${binary.byteLength} bytes, ${bones.length} bones, ${animations.length} clips)`);
