#!/usr/bin/env node
/* Procedural placeholder SFX generator for NO GODS ABOVE.
 * Synthesizes the 16 combat/UI sounds as 44.1kHz 16-bit mono WAVs so the game
 * has audio before AI-generated finals land. Rerun any time:
 *   node tools/generate_placeholder_sfx.js
 */
const fs = require("fs");
const path = require("path");

const SR = 44100;
const OUT = path.resolve(__dirname, "..", "NO_GODS_ABOVE", "assets", "audio", "sfx");

function writeWav(name, samples) {
  const n = samples.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i += 1) {
    buf.writeInt16LE(Math.max(-1, Math.min(1, samples[i])) * 32767, 44 + i * 2);
  }
  fs.writeFileSync(path.join(OUT, name), buf);
}

const sec = (s) => Math.floor(s * SR);
const mix = (...layers) => {
  const len = Math.max(...layers.map((l) => l.length));
  const out = new Float32Array(len);
  for (const l of layers) for (let i = 0; i < l.length; i += 1) out[i] += l[i];
  return out;
};
const gain = (buf, g) => buf.map((v) => v * g);

// Simple one-pole lowpass for softer noise
function noise(dur, decay, lp = 0.28) {
  const out = new Float32Array(sec(dur));
  let prev = 0;
  for (let i = 0; i < out.length; i += 1) {
    const env = Math.exp(-i / (SR * decay));
    prev = prev + lp * ((Math.random() * 2 - 1) - prev);
    out[i] = prev * env;
  }
  return out;
}

function tone(freqStart, freqEnd, dur, decay, shape = "sine") {
  const out = new Float32Array(sec(dur));
  let phase = 0;
  for (let i = 0; i < out.length; i += 1) {
    const t = i / out.length;
    const f = freqStart + (freqEnd - freqStart) * t;
    phase += (2 * Math.PI * f) / SR;
    const env = Math.exp(-i / (SR * decay));
    const s = shape === "square" ? Math.sign(Math.sin(phase)) * 0.6 : Math.sin(phase);
    out[i] = s * env;
  }
  return out;
}

fs.mkdirSync(OUT, { recursive: true });

const sounds = {
  "hit_light.wav": mix(gain(noise(0.09, 0.02, 0.5), 0.5), gain(tone(190, 150, 0.09, 0.03), 0.5)),
  "hit_medium.wav": mix(gain(noise(0.14, 0.03, 0.45), 0.55), gain(tone(130, 90, 0.14, 0.045), 0.65)),
  "hit_heavy.wav": mix(gain(noise(0.26, 0.05, 0.4), 0.55), gain(tone(85, 45, 0.26, 0.09), 0.8)),
  "hit_super.wav": mix(gain(noise(0.5, 0.09, 0.35), 0.6), gain(tone(60, 32, 0.5, 0.16), 0.85)),
  "block.wav": mix(gain(tone(1250, 1180, 0.12, 0.02), 0.35), gain(tone(1850, 1700, 0.12, 0.015), 0.25), gain(noise(0.05, 0.008, 0.6), 0.3)),
  "whoosh.wav": (() => {
    const n = noise(0.16, 0.2, 0.18);
    for (let i = 0; i < n.length; i += 1) {
      const t = i / n.length;
      n[i] *= Math.sin(Math.PI * t) * 0.9;
    }
    return n;
  })(),
  "jump.wav": gain(tone(210, 430, 0.12, 0.06), 0.45),
  "double_jump.wav": mix(gain(tone(320, 640, 0.13, 0.05), 0.4), gain(tone(1280, 1500, 0.1, 0.03), 0.15)),
  "dash.wav": (() => {
    const n = noise(0.14, 0.12, 0.22);
    for (let i = 0; i < n.length; i += 1) n[i] *= Math.sin(Math.PI * (i / n.length)) * 0.85;
    return n;
  })(),
  "super_dash.wav": mix(gain(tone(220, 900, 0.3, 0.12), 0.35), gain(noise(0.3, 0.1, 0.2), 0.4)),
  "grab_catch.wav": mix(gain(tone(140, 110, 0.07, 0.025), 0.7), gain(noise(0.06, 0.015, 0.5), 0.4)),
  "grab_toss.wav": mix(gain(noise(0.2, 0.06, 0.25), 0.5), gain(tone(100, 60, 0.2, 0.07), 0.7)),
  "super_flash.wav": mix(gain(tone(880, 440, 0.4, 0.14), 0.3), gain(tone(1320, 660, 0.4, 0.12), 0.2), gain(noise(0.35, 0.1, 0.15), 0.2)),
  "ko.wav": mix(gain(tone(55, 28, 0.7, 0.22), 0.9), gain(noise(0.6, 0.12, 0.3), 0.5)),
  "ui_move.wav": gain(tone(700, 700, 0.045, 0.015), 0.35),
  "ui_confirm.wav": mix(gain(tone(550, 550, 0.06, 0.02), 0.35), (() => {
    const t2 = gain(tone(880, 880, 0.09, 0.03), 0.35);
    const padded = new Float32Array(sec(0.15));
    padded.set(t2, sec(0.05));
    return padded;
  })())
};

for (const [name, samples] of Object.entries(sounds)) {
  writeWav(name, samples);
}
console.log(`Wrote ${Object.keys(sounds).length} placeholder SFX to ${OUT}`);
