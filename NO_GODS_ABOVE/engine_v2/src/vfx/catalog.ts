import { defineLayer, VfxEffectDefinition } from "./types";

export const VFX_ENGINE_V1_CATALOG: readonly VfxEffectDefinition[] = [
  {
    id: "swahili.opposed_split_shot_v2",
    label: "Opposed Split Shot V2",
    category: "weapon",
    description: "One simultaneous firing beat with independent screen-left and screen-right muzzle, smoke, and shell tracks.",
    durationTicks: 24,
    tags: ["muzzle_flash", "smoke", "shell_ejection", "camera_shake", "two_muzzles_one_beat"],
    layers: [
      defineLayer({ id: "right_muzzle", kind: "flash", startTick: 3, durationTicks: 3, offset: [78, -12], size: 46, length: 72, width: 16, color: "#fff4bd", secondaryColor: "#ff7b27" }),
      defineLayer({ id: "left_muzzle", kind: "flash", startTick: 3, durationTicks: 3, offset: [-78, -12], size: 46, length: 72, width: 16, rotationDegrees: 180, color: "#fff4bd", secondaryColor: "#ff7b27" }),
      defineLayer({ id: "right_smoke", kind: "smoke", startTick: 4, durationTicks: 14, count: 7, offset: [92, -12], velocity: [1.7, -1.15], spread: 13, size: 24, color: "#d8d3c8", secondaryColor: "#74717d", blend: "screen", opacity: 0.72 }),
      defineLayer({ id: "left_smoke", kind: "smoke", startTick: 4, durationTicks: 14, count: 7, offset: [-92, -12], velocity: [-1.7, -1.15], spread: 13, size: 24, color: "#d8d3c8", secondaryColor: "#74717d", blend: "screen", opacity: 0.72 }),
      defineLayer({ id: "right_shell", kind: "debris", startTick: 5, durationTicks: 16, count: 2, offset: [30, -24], velocity: [2.5, -4.2], gravity: 0.42, spread: 5, size: 7, length: 11, width: 4, color: "#e6b85d", secondaryColor: "#6d431f", opacity: 0.92 }),
      defineLayer({ id: "left_shell", kind: "debris", startTick: 5, durationTicks: 16, count: 2, offset: [-30, -24], velocity: [-2.5, -4.2], gravity: 0.42, spread: 5, size: 7, length: 11, width: 4, color: "#e6b85d", secondaryColor: "#6d431f", opacity: 0.92 })
    ],
    cameraShake: { startTick: 3, durationTicks: 6, amplitude: [4, 2], frequency: 2.4 },
    candidateOnly: true,
    deployable: false,
    fighterArtworkBakedIn: false
  },
  {
    id: "impact.heavy_old_gold",
    label: "Heavy Impact — Old Gold",
    category: "impact",
    description: "Hit-confirmed heavy spark, compression ring, and debris package. Nothing appears on whiff.",
    durationTicks: 22,
    tags: ["hit_spark", "impact_ring", "debris", "hit_only", "camera_shake"],
    layers: [
      defineLayer({ id: "impact_core", kind: "flash", durationTicks: 5, visibility: "on_hit", size: 58, length: 92, width: 24, rotationDegrees: -8, color: "#fff7cf", secondaryColor: "#d69b36" }),
      defineLayer({ id: "impact_ring", kind: "ring", startTick: 1, durationTicks: 12, visibility: "on_hit", size: 38, width: 7, color: "#f3c86a", secondaryColor: "#8b341f", opacity: 0.95 }),
      defineLayer({ id: "impact_sparks", kind: "spark", durationTicks: 11, count: 18, visibility: "on_hit", spread: 180, size: 5, length: 72, width: 4, velocity: [4.8, 0], color: "#fff4b1", secondaryColor: "#bf351f" }),
      defineLayer({ id: "impact_debris", kind: "debris", startTick: 2, durationTicks: 18, count: 9, visibility: "on_hit", velocity: [3.3, -3.6], gravity: 0.38, spread: 110, size: 5, length: 10, width: 3, color: "#d88d3b", secondaryColor: "#4e1c1a", opacity: 0.9 })
    ],
    cameraShake: { startTick: 0, durationTicks: 9, amplitude: [9, 6], frequency: 2.8, visibility: "on_hit" },
    candidateOnly: true,
    deployable: false,
    fighterArtworkBakedIn: false
  },
  {
    id: "impact.block_cyan",
    label: "Block Impact — Cyan",
    category: "impact",
    description: "Compact guard flare and circular shield ripple, gated to block outcomes only.",
    durationTicks: 16,
    tags: ["block_spark", "guard_ring", "block_only"],
    layers: [
      defineLayer({ id: "guard_flash", kind: "flash", durationTicks: 4, visibility: "on_block", size: 34, length: 52, width: 12, rotationDegrees: 18, color: "#e9ffff", secondaryColor: "#35cbea" }),
      defineLayer({ id: "guard_ring", kind: "ring", durationTicks: 12, visibility: "on_block", size: 30, width: 5, color: "#7ff4ff", secondaryColor: "#1968b2", opacity: 0.88 }),
      defineLayer({ id: "guard_sparks", kind: "spark", durationTicks: 9, count: 9, visibility: "on_block", spread: 120, length: 44, width: 3, velocity: [3.4, 0], color: "#d8ffff", secondaryColor: "#208ac0" })
    ],
    cameraShake: { startTick: 0, durationTicks: 4, amplitude: [3, 2], frequency: 2.2, visibility: "on_block" },
    candidateOnly: true,
    deployable: false,
    fighterArtworkBakedIn: false
  },
  {
    id: "movement.cyan_dash_trail",
    label: "Cyan Dash Trail",
    category: "movement",
    description: "Short previous-position trail that follows a moving socket without jumping in front of the owner.",
    durationTicks: 26,
    tags: ["trail", "previous_position", "facing_aware", "follow_anchor"],
    layers: [
      defineLayer({ id: "body_wake", kind: "trail", durationTicks: 22, count: 7, anchorMode: "previous_position", followAnchor: true, offset: [-24, 2], velocity: [-1.9, 0], spread: 8, size: 16, length: 78, width: 14, color: "#9ffbff", secondaryColor: "#167faf", blend: "screen", opacity: 0.62 }),
      defineLayer({ id: "ground_streaks", kind: "spark", startTick: 3, durationTicks: 18, count: 8, anchorMode: "previous_position", followAnchor: true, offset: [-18, 32], velocity: [-3.4, 0], spread: 24, length: 54, width: 3, color: "#7beaf5", secondaryColor: "#173d75", opacity: 0.66 })
    ],
    candidateOnly: true,
    deployable: false,
    fighterArtworkBakedIn: false
  },
  {
    id: "projectile.celestial_orb",
    label: "Celestial Orb",
    category: "projectile",
    description: "Hand-origin energy orb with a compact core, halo, and trailing motes. It remains an independent projectile layer.",
    durationTicks: 60,
    tags: ["projectile", "hand_origin", "gold", "cyan", "travel"],
    layers: [
      defineLayer({ id: "orb_core", kind: "projectile", durationTicks: 60, velocity: [4.8, 0], size: 26, color: "#fff8c9", secondaryColor: "#42d9ee", opacity: 1 }),
      defineLayer({ id: "orb_halo", kind: "ring", durationTicks: 60, velocity: [4.8, 0], size: 34, width: 5, color: "#ffd66e", secondaryColor: "#1db6d7", blend: "screen", opacity: 0.76 }),
      defineLayer({ id: "orb_motes", kind: "smoke", durationTicks: 60, count: 16, velocity: [4.2, 0], spread: 15, size: 9, color: "#9df8ff", secondaryColor: "#d7a83d", blend: "screen", opacity: 0.64 })
    ],
    candidateOnly: true,
    deployable: false,
    fighterArtworkBakedIn: false
  },
  {
    id: "system.roman_cancel_crimson",
    label: "Roman Cancel — Crimson",
    category: "system",
    description: "A readable stop-time ring and four-point fracture burst for the candidate Roman Cancel system.",
    durationTicks: 30,
    tags: ["roman_cancel", "ring", "freeze_read", "system_vfx"],
    layers: [
      defineLayer({ id: "rc_core", kind: "flash", durationTicks: 6, size: 52, length: 72, width: 24, color: "#ffe5dc", secondaryColor: "#d6223d", opacity: 0.95 }),
      defineLayer({ id: "rc_ring_inner", kind: "ring", durationTicks: 22, size: 42, width: 8, color: "#ff827c", secondaryColor: "#8d102a", blend: "screen", opacity: 0.9 }),
      defineLayer({ id: "rc_ring_outer", kind: "ring", startTick: 2, durationTicks: 28, size: 68, width: 4, color: "#d8334b", secondaryColor: "#2a0714", opacity: 0.75 }),
      defineLayer({ id: "rc_fractures", kind: "spark", startTick: 1, durationTicks: 17, count: 12, spread: 360, velocity: [4.1, 0], length: 58, width: 5, color: "#ffe4d8", secondaryColor: "#9e1837", opacity: 0.86 })
    ],
    cameraShake: { startTick: 0, durationTicks: 6, amplitude: [4, 4], frequency: 3.1 },
    candidateOnly: true,
    deployable: false,
    fighterArtworkBakedIn: false
  },
  {
    id: "system.burst_gold_cyan",
    label: "Burst Escape — Gold/Cyan",
    category: "system",
    description: "Large defensive release with layered rings, radial rays, and a clean center that does not hide the fighter silhouette.",
    durationTicks: 36,
    tags: ["burst", "defense", "radial", "system_vfx", "camera_shake"],
    layers: [
      defineLayer({ id: "burst_core", kind: "flash", durationTicks: 7, size: 72, length: 90, width: 34, color: "#fff9d3", secondaryColor: "#40dceb", opacity: 0.9 }),
      defineLayer({ id: "burst_ring_gold", kind: "ring", durationTicks: 28, size: 54, width: 10, color: "#f3c35f", secondaryColor: "#513220", opacity: 0.9 }),
      defineLayer({ id: "burst_ring_cyan", kind: "ring", startTick: 3, durationTicks: 32, size: 84, width: 6, color: "#76f2ff", secondaryColor: "#145e91", blend: "screen", opacity: 0.78 }),
      defineLayer({ id: "burst_rays", kind: "spark", durationTicks: 20, count: 24, spread: 360, velocity: [6.2, 0], length: 96, width: 5, color: "#fff0ae", secondaryColor: "#32bfd8", opacity: 0.84 })
    ],
    cameraShake: { startTick: 0, durationTicks: 12, amplitude: [8, 7], frequency: 3.4 },
    candidateOnly: true,
    deployable: false,
    fighterArtworkBakedIn: false
  },
  {
    id: "environment.heavy_landing_dust",
    label: "Heavy Landing Dust",
    category: "environment",
    description: "World-anchored ground dust, compression ring, and small debris for knockdown or heavy landing contact.",
    durationTicks: 34,
    tags: ["landing", "dust", "world_anchor", "debris"],
    layers: [
      defineLayer({ id: "ground_compression", kind: "ring", durationTicks: 18, anchorMode: "world", size: 34, width: 6, color: "#c1a68f", secondaryColor: "#5b3a35", opacity: 0.72 }),
      defineLayer({ id: "left_dust", kind: "smoke", startTick: 1, durationTicks: 30, count: 11, anchorMode: "world", offset: [-14, 0], velocity: [-2.5, -1.2], gravity: 0.05, spread: 18, size: 21, color: "#b6a394", secondaryColor: "#4b3b42", blend: "screen", opacity: 0.55 }),
      defineLayer({ id: "right_dust", kind: "smoke", startTick: 1, durationTicks: 30, count: 11, anchorMode: "world", offset: [14, 0], velocity: [2.5, -1.2], gravity: 0.05, spread: 18, size: 21, color: "#b6a394", secondaryColor: "#4b3b42", blend: "screen", opacity: 0.55 }),
      defineLayer({ id: "ground_chips", kind: "debris", startTick: 1, durationTicks: 24, count: 10, anchorMode: "world", velocity: [3.2, -4.6], gravity: 0.42, spread: 140, size: 5, length: 9, width: 4, color: "#9d735d", secondaryColor: "#35242a", opacity: 0.82 })
    ],
    cameraShake: { startTick: 0, durationTicks: 8, amplitude: [5, 4], frequency: 2.5 },
    candidateOnly: true,
    deployable: false,
    fighterArtworkBakedIn: false
  }
] as const;

export function validateVfxCatalog(catalog: readonly VfxEffectDefinition[] = VFX_ENGINE_V1_CATALOG): readonly string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const effect of catalog) {
    if (ids.has(effect.id)) errors.push(`duplicate effect id: ${effect.id}`);
    ids.add(effect.id);
    if (effect.durationTicks <= 0) errors.push(`${effect.id}: durationTicks must be positive`);
    if (!effect.candidateOnly || effect.deployable || effect.fighterArtworkBakedIn) errors.push(`${effect.id}: candidate separation flags are invalid`);
    const layerIds = new Set<string>();
    for (const layer of effect.layers) {
      if (layerIds.has(layer.id)) errors.push(`${effect.id}: duplicate layer id ${layer.id}`);
      layerIds.add(layer.id);
      if (layer.count <= 0 || layer.durationTicks <= 0) errors.push(`${effect.id}/${layer.id}: count and duration must be positive`);
      if (layer.startTick < 0 || layer.startTick + layer.durationTicks > effect.durationTicks + 1) errors.push(`${effect.id}/${layer.id}: layer exceeds effect duration`);
      if (layer.opacity < 0 || layer.opacity > 1) errors.push(`${effect.id}/${layer.id}: opacity outside 0..1`);
    }
    if (effect.cameraShake && effect.cameraShake.startTick + effect.cameraShake.durationTicks > effect.durationTicks + 1) {
      errors.push(`${effect.id}: camera shake exceeds effect duration`);
    }
  }
  return errors;
}

export function vfxCatalogManifest(catalog: readonly VfxEffectDefinition[] = VFX_ENGINE_V1_CATALOG) {
  return {
    schemaVersion: 1,
    record: "NGA_VFX_ENGINE_V1_CATALOG",
    status: "candidate-only",
    deployable: false,
    renderingOnly: true,
    simulationAuthority: false,
    fighterArtworkBakedIn: false,
    tickRate: 60,
    effects: catalog
  } as const;
}
