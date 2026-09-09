import type { BodyEnvelope, FighterKind, Rect } from "../core/types";

// ---------------------------------------------------------------------------
// Versus playtest roster.
//
// Presentation and collision constants here are MEASURED from the shipped art,
// not authored by feel. See docs/versus_playtest/BODY_METRICS.md for the
// measurement method and the raw numbers.
//
// This module is playtest-scoped. It does not modify any approved move data,
// any fighter definition in src/data/fighters.ts, or either existing sandbox.
// ---------------------------------------------------------------------------

/**
 * Canvas pixels per simulation unit.
 *
 * Pinned to 1.3 because that is the Tribunal renderer's own PIXELS_PER_SIM: the
 * 3D arena maps the flat combat canvas onto a fixed world-space plane at that
 * ratio, so any other value would make the fighters the wrong size inside the
 * stage. Sprites and collision boxes both derive from this one number, so they
 * can never drift apart.
 */
export const WORLD_SCALE = 1.3;

/**
 * Shared drawn body height, in simulation units, measured head-top to feet.
 *
 * Derived from Lamuh's approved idle: 788 source px tall drawn at his approved
 * 0.3 presentation scale => 236.4 canvas px => 181.8 units at WORLD_SCALE.
 * Rounded to 182 and then applied to BOTH fighters, so neither character is the
 * odd one out and every future character has one number to hit.
 */
export const TARGET_BODY_UNITS = 182;

/** Source-art measurements taken from the alpha mask of each fighter's idle frame. */
export interface BodyMetrics {
  /** Source canvas the frames are authored on. */
  canvas: { width: number; height: number };
  /** Y of the lowest opaque row: the floor contact line. */
  feetY: number;
  /** Y of the first row at least 60px wide: the top of the head, ignoring thin props. */
  headTopY: number;
  /** X of the centre of the foot contact region. */
  footCentreX: number;
}

/** Head-top-to-feet height in source pixels. */
export const bodyHeightPx = (m: BodyMetrics) => m.feetY - m.headTopY;

/**
 * Canvas pixels per source pixel needed to draw this body at TARGET_BODY_UNITS.
 * This is the whole height fix: every fighter is scaled to the same body height
 * instead of to an arbitrary per-character constant.
 */
export const drawScaleFor = (m: BodyMetrics) => (TARGET_BODY_UNITS * WORLD_SCALE) / bodyHeightPx(m);

/**
 * The sprite root in source space. X is the foot centre and Y is the floor
 * contact line, so the drawn feet land on the simulation's ground plane
 * (y = 0) rather than on the authored canvas edge.
 */
export const rootFor = (m: BodyMetrics) => ({ x: m.footCentreX, y: m.feetY });

// --- Measured metrics ------------------------------------------------------
// Lamuh: public/lamuh-legacy-v2/movement-v2/idle-00.png
// Swahili: source-frames/approved/anchors/neutral_idle_anchor_v3.png
export const LAMUH_METRICS: BodyMetrics = { canvas: { width: 2048, height: 1536 }, feetY: 1359, headTopY: 571, footCentreX: 768 };
export const SWAHILI_METRICS: BodyMetrics = { canvas: { width: 1536, height: 1536 }, feetY: 1406, headTopY: 371, footCentreX: 773 };

// --- Body envelopes --------------------------------------------------------
// Three stacked bands spanning the full TARGET_BODY_UNITS: head, torso, legs.
//
// Height is measured. Width is a deliberate review choice: the raw alpha
// silhouette includes Lamuh's robe flare and Swahili's coat tails and scythe,
// which run 90+ units wide and would make cloth and a prop into hurtboxes.
// These widths track each character's torso core and keep the width identity
// their approved pushboxes already established.
function envelope(headW: number, torsoW: number, legW: number, crouchW: number, pushW: number): BodyEnvelope {
  const centred = (w: number, y: number, h: number): Rect => ({ x: -w / 2, y, w, h });
  return {
    pushbox: centred(pushW, -TARGET_BODY_UNITS, TARGET_BODY_UNITS),
    standing: [
      centred(headW, -182, 44),  // head + neck
      centred(torsoW, -138, 64), // shoulders through hips
      centred(legW, -74, 74)     // thighs to feet
    ],
    // Crouch compresses to 57% of standing height, the ratio the existing
    // crouching hurtboxes already used against the old silhouette.
    crouching: [centred(crouchW, -104, 60), centred(crouchW, -44, 44)]
  };
}

export const LAMUH_ENVELOPE = envelope(42, 54, 48, 56, 68);
export const SWAHILI_ENVELOPE = envelope(46, 58, 52, 60, 60);

export type CharacterId = "lamuh" | "swahili";

export interface VersusCharacter {
  id: CharacterId;
  name: string;
  tagline: string;
  /** Engine fighter kind. Unchanged from what each character already runs on. */
  kind: FighterKind;
  /**
   * Swahili's gameplay lives on the `lamuh_proto` kind: that kind carries his
   * specials (Grave Furrow, Grounded Verdict, Crossdraw) and the engine gates
   * his air specials on it. The name is legacy; the moveset is his.
   */
  swahiliAirSpecialsV1: boolean;
  metrics: BodyMetrics;
  envelope: BodyEnvelope;
  /** Honest statement of animation coverage, shown on the select screen. */
  animationStatus: string;
  accent: string;
}

export const ROSTER: Record<CharacterId, VersusCharacter> = {
  lamuh: {
    id: "lamuh",
    name: "LAMUH",
    tagline: "Legacy V2 · celestial pressure",
    kind: "lamuh_legacy_v2",
    swahiliAirSpecialsV1: false,
    metrics: LAMUH_METRICS,
    envelope: LAMUH_ENVELOPE,
    animationStatus: "Full animation set: normals, four special families, throws, reactions, ultimate.",
    accent: "#e9c46a"
  },
  swahili: {
    id: "swahili",
    name: "SWAHILI",
    tagline: "Moveset goal V1 · scythe and crossdraw",
    kind: "lamuh_proto",
    swahiliAirSpecialsV1: true,
    metrics: SWAHILI_METRICS,
    envelope: SWAHILI_ENVELOPE,
    animationStatus: "Playable candidate. Normals, movement, defense, Grave Furrow, ground specials, and air specials draw authored motion clips.",
    accent: "#8ecae6"
  }
};

export const ROSTER_ORDER: CharacterId[] = ["lamuh", "swahili"];
