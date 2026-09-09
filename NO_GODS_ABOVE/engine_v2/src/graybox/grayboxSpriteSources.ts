import idleUrl from "../../../../tools/nga-forge/production/characters/swahili/source-frames/approved/anchors/neutral_idle_anchor_v3.png?url";
import walkForwardUrl from "../../../../tools/nga-forge/production/characters/swahili/source-frames/candidates/walk-key-poses-v1/walk_forward_contact.png?url";
import walkBackwardUrl from "../../../../tools/nga-forge/production/characters/swahili/source-frames/candidates/walk-key-poses-v1/walk_backward_rearward_contact.png?url";
import crouchUrl from "../../../../tools/nga-forge/production/characters/swahili/source-frames/approved/defense-reaction-key-poses-v1/crouch.png?url";
import standingBlockUrl from "../../../../tools/nga-forge/production/characters/swahili/source-frames/approved/defense-reaction-key-poses-v1/standing_block.png?url";
import lightHitUrl from "../../../../tools/nga-forge/production/characters/swahili/source-frames/approved/defense-reaction-key-poses-v1/light_hit_reaction.png?url";
import heavyHitUrl from "../../../../tools/nga-forge/production/characters/swahili/source-frames/approved/defense-reaction-key-poses-v1/heavy_hit_reaction.png?url";
import standingHeavyUrl from "../../../../tools/nga-forge/production/characters/swahili/source-frames/approved/standing-heavy-key-poses/standing_heavy_impact_v2.png?url";

export const grayboxSpriteSources = {
  idle: { url: idleUrl, approval: "APPROVED_AS_IDLE_FOUNDATION_V1" },
  walk_forward: { url: walkForwardUrl, approval: "candidate_acceptable_preview_only" },
  walk_backward: { url: walkBackwardUrl, approval: "candidate_acceptable_preview_only" },
  crouch: { url: crouchUrl, approval: "APPROVED_AS_DEFENSE_REACTION_KEY_POSE_LIBRARY_V1" },
  standing_block: { url: standingBlockUrl, approval: "APPROVED_AS_DEFENSE_REACTION_KEY_POSE_LIBRARY_V1" },
  light_hit_reaction: { url: lightHitUrl, approval: "APPROVED_AS_DEFENSE_REACTION_KEY_POSE_LIBRARY_V1" },
  heavy_hit_reaction: { url: heavyHitUrl, approval: "APPROVED_AS_DEFENSE_REACTION_KEY_POSE_LIBRARY_V1" },
  standing_heavy: { url: standingHeavyUrl, approval: "APPROVED_AS_STANDING_HEAVY_MOTION_V1" }
} as const;

export type GrayboxSpriteId = keyof typeof grayboxSpriteSources;
