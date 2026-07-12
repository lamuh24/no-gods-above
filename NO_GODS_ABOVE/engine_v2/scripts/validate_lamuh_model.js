#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifests', 'lamuh_prototype_v0.model.json'), 'utf8'));
const glb = fs.readFileSync(path.join(ROOT, 'public', 'models', 'lamuh_prototype_v0.glb'));
function assert(value, message) { if (!value) throw new Error(message); }
assert(glb.readUInt32LE(0) === 0x46546c67, 'Lamuh asset is not binary glTF');
assert(glb.readUInt32LE(4) === 2, 'Lamuh GLB must use glTF 2.0');
const jsonLength = glb.readUInt32LE(12);
assert(glb.readUInt32LE(16) === 0x4e4f534a, 'Lamuh GLB JSON chunk missing');
const gltf = JSON.parse(glb.subarray(20, 20 + jsonLength).toString('utf8').trim());
const nodeNames = new Set((gltf.nodes || []).map((node) => node.name));
const clipNames = new Set((gltf.animations || []).map((animation) => animation.name));
for (const name of [...manifest.requiredBones, ...manifest.optionalBones, ...manifest.requiredAnchors, ...manifest.layers]) assert(nodeNames.has(name), `Lamuh GLB missing node ${name}`);
for (const name of manifest.requiredClips) assert(clipNames.has(name), `Lamuh GLB missing clip ${name}`);
const rootIndex = (gltf.nodes || []).findIndex((node) => node.name === 'root');
for (const animation of gltf.animations || []) {
  for (const channel of animation.channels || []) {
    assert(!(channel.target.node === rootIndex && channel.target.path === 'translation'), `${animation.name} authors forbidden root translation`);
  }
}
assert(manifest.render.simulationFps === 60, 'simulation tick contract changed');
assert([12, 15, 20, 24].includes(manifest.render.presentationFps), 'presentation FPS is outside approved stepped rates');
assert(manifest.render.rootMotion === false, 'root motion must remain disabled');
console.log(`Validated ${manifest.id}: ${manifest.requiredBones.length + manifest.optionalBones.length} bones, ${manifest.requiredAnchors.length} anchors, ${manifest.requiredClips.length} required clips, no root motion.`);
