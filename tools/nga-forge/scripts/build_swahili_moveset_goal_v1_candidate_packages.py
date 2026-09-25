#!/usr/bin/env python3
"""Build deterministic candidate packages and lossless family atlases for Swahili Goal V1."""

from __future__ import annotations

import hashlib
import json
import re
import shutil
import subprocess
from collections import defaultdict
from pathlib import Path
from typing import Any

import numpy as np
from PIL import Image, ImageChops


REPO_ROOT = Path(__file__).resolve().parents[3]
ENGINE_ROOT = REPO_ROOT / "NO_GODS_ABOVE" / "engine_v2"
CONTENT_ROOT = ENGINE_ROOT / "content-source" / "characters" / "swahili-goal-v1"
GENERATED_MANIFEST = ENGINE_ROOT / "generated" / "manifests" / "swahili_moveset_goal_v1.candidate.runtime.json"
SWAHILI_ROOT = REPO_ROOT / "tools" / "nga-forge" / "production" / "characters" / "swahili"
PACKAGE_ROOT = SWAHILI_ROOT / "packages" / "moveset-goal-v1"
SEQUENCE_SNAPSHOT = PACKAGE_ROOT / "engine-sequence-snapshot.json"
OPERATION_STATUS = PACKAGE_ROOT / "operation-status.json"
ATLAS_ROOT = PACKAGE_ROOT / "atlases"
FINAL_MATRIX = SWAHILI_ROOT / "coverage" / "swahili-moveset-goal-v1.final.matrix.json"
HASH_LOCK = SWAHILI_ROOT / "freeze" / "swahili-moveset-goal-v1.baseline.hash-lock.json"
PRODUCTION_ENTRY = SWAHILI_ROOT / "production-entry.json"
SPRITE_SOURCE_TS = ENGINE_ROOT / "src" / "sandbox" / "swahiliSandboxSpriteSources.ts"
EXPORT_SCRIPT = REPO_ROOT / "tools" / "nga-forge" / "scripts" / "export_swahili_moveset_goal_v1_sequences.js"
COMPILE_SCRIPT = REPO_ROOT / "tools" / "nga-forge" / "scripts" / "compile_swahili_moveset_goal_v1_candidate.js"

LEGACY_GAME_JS = REPO_ROOT / "NO_GODS_ABOVE" / "game.js"
LEGACY_SHA256 = "D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B"
MAX_ATLAS_SIZE = 4096
EXTRUDE = 1
PACK_GAP = 2
EVENT_ID = "{matchId}:{simulationFrame}:{fighterId}:{moveInstance}:{eventIndex}"
TIMING_BASIS = [
    "move_weight",
    "readability",
    "combat_role",
    "risk_reward",
    "character_identity",
    "animation_quality",
    "balance",
]

EXISTING_PACKAGE_SOURCES = {
    "standing_block": ENGINE_ROOT
    / "content-source"
    / "characters"
    / "swahili"
    / "moves"
    / "standing-block"
    / "animation.package.json",
    "crouching_block": ENGINE_ROOT
    / "content-source"
    / "characters"
    / "swahili"
    / "moves"
    / "crouching-block"
    / "animation.package.json",
    "light_hit_reaction": ENGINE_ROOT
    / "content-source"
    / "characters"
    / "swahili"
    / "moves"
    / "light-hit-reaction"
    / "animation.package.json",
    "heavy_hit_reaction": ENGINE_ROOT
    / "content-source"
    / "characters"
    / "swahili"
    / "moves"
    / "heavy-hit-reaction"
    / "animation.package.json",
    "universal_grab_attempt": ENGINE_ROOT
    / "content-source"
    / "characters"
    / "swahili"
    / "moves"
    / "universal-grab-attempt"
    / "animation.package.json",
    "universal_forward_throw": ENGINE_ROOT
    / "content-source"
    / "characters"
    / "swahili"
    / "moves"
    / "universal-forward-throw"
    / "animation.package.json",
    "universal_backward_throw": ENGINE_ROOT
    / "content-source"
    / "characters"
    / "swahili"
    / "moves"
    / "universal-backward-throw"
    / "animation.package.json",
}

PACKAGE_GROUPS = {
    "universal_movement": [
        "idle",
        "walk_forward",
        "dash_forward",
        "dash_backward",
        "standing_to_crouch",
        "crouch_to_standing",
        "turn_side_switch",
    ],
    "air_movement": [
        "jump_fall_landing",
        "air_dash_forward",
        "air_dash_backward",
        "air_dash_side_switch",
    ],
    "ground_normals": [
        "standing_light",
        "standing_heavy",
        "crouching_light",
        "crouching_medium",
        "crouching_heavy",
    ],
    "defense": ["standing_block", "crouching_block"],
    "reactions_and_recovery": ["light_hit_reaction", "heavy_hit_reaction", "knockdown_recovery"],
    "grabs": [
        "universal_grab_attempt",
        "universal_forward_throw",
        "universal_backward_throw",
        "command_grab_v2",
    ],
}

PACKAGE_TO_MATRIX = {
    "idle": ["idle"],
    "walk_forward": ["walk_forward"],
    "dash_forward": ["dash_forward"],
    "dash_backward": ["dash_backward"],
    "standing_to_crouch": ["standing_to_crouch"],
    "crouch_to_standing": ["crouch_to_standing"],
    "turn_side_switch": ["turn_side_switch_compatibility"],
    "jump_fall_landing": [
        "jump_anticipation",
        "jump_takeoff",
        "jump_rising",
        "jump_apex",
        "falling",
        "soft_landing",
        "attack_landing_recovery",
        "hard_landing_compatibility",
    ],
    "air_dash_forward": ["air_dash_forward"],
    "air_dash_backward": ["air_dash_backward"],
    "air_dash_side_switch": [],
    "knockdown_recovery": [
        "launch_reaction",
        "airborne_tumble",
        "ground_impact",
        "face_up_knockdown",
        "neutral_get_up",
        "throw_result_knockdown_compatibility",
    ],
    "standing_light": ["standing_light"],
    "standing_heavy": ["standing_heavy"],
    "crouching_light": ["crouching_light"],
    "crouching_medium": ["crouching_medium"],
    "crouching_heavy": ["crouching_heavy"],
    "standing_block": ["standing_block"],
    "crouching_block": ["crouching_block"],
    "light_hit_reaction": ["light_hit_reaction"],
    "heavy_hit_reaction": ["heavy_hit_reaction"],
    "universal_grab_attempt": ["universal_grab_attempt", "throw_whiff"],
    "universal_forward_throw": ["universal_forward_throw"],
    "universal_backward_throw": ["universal_backward_throw"],
    "command_grab_v2": ["command_grab", "command_grab_victim_fall"],
}


def repo_path(path: Path) -> str:
    return path.resolve().relative_to(REPO_ROOT.resolve()).as_posix()


def repo_uri(path: Path) -> str:
    return f"repo://{repo_path(path)}"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest().upper()


def pixel_sha256(image: Image.Image) -> str:
    return hashlib.sha256(image.convert("RGBA").tobytes()).hexdigest().upper()


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def run_json(command: list[str]) -> dict[str, Any]:
    result = subprocess.run(
        command,
        cwd=REPO_ROOT,
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    return json.loads(result.stdout)


def source_registry() -> dict[str, dict[str, Any]]:
    text = SPRITE_SOURCE_TS.read_text(encoding="utf-8")
    imports: dict[str, Path] = {}
    for variable, raw_path in re.findall(
        r'import\s+([A-Za-z0-9_]+)\s+from\s+"([^"]+)\?url";',
        text,
    ):
        imports[variable] = (SPRITE_SOURCE_TS.parent / raw_path).resolve()
    registry: dict[str, dict[str, Any]] = {}
    for source_id, variable, approval in re.findall(
        r'^\s+([a-z0-9_]+):\s+approved\(([A-Za-z0-9_]+),\s+"([^"]+)"\),?\s*$',
        text,
        flags=re.MULTILINE,
    ):
        if variable not in imports:
            raise RuntimeError(f"sprite registry references missing import variable: {variable}")
        path = imports[variable]
        if not path.is_file():
            raise RuntimeError(f"sandbox sprite source missing: {repo_path(path)}")
        registry[source_id] = {"path": path, "approval": approval}
    return registry


def pose_token(
    pose_id: str,
    *,
    elevation: str = "grounded",
    planted: str = "both",
    weight: str = "neutral",
    vertical: str = "stationary",
    silhouette: str = "swahili_candidate_pose",
) -> dict[str, Any]:
    return {
        "id": pose_id,
        "facing": "forward",
        "elevation": elevation,
        "plantedFoot": planted,
        "weight": weight,
        "weaponState": "dual_pistols_and_canonical_rigid_scythe_preserved",
        "handOccupancy": {"left": "pistol_or_authored_control", "right": "pistol_or_authored_control"},
        "silhouette": silhouette,
        "verticalMotion": vertical,
    }


POSE_LIBRARY = [
    pose_token("neutral_stand", silhouette="calm_low_ready"),
    pose_token("standing_guard", silhouette="responsive_standing_guard"),
    pose_token("crouch", weight="low", silhouette="compact_crouch"),
    pose_token("crouching_guard", weight="low", silhouette="compact_low_guard"),
    pose_token("light_hit_reaction", weight="backward", silhouette="compact_directional_recoil"),
    pose_token("heavy_hit_stagger", weight="backward", silhouette="deep_backward_stagger"),
    pose_token("grab_control", weight="forward", silhouette="captured_weapon_control"),
    pose_token(
        "airborne",
        elevation="airborne",
        planted="none",
        weight="airborne",
        vertical="falling",
        silhouette="airborne_weapon_control",
    ),
]


def sequence_poses(sequence_id: str) -> tuple[dict[str, Any], dict[str, Any], list[dict[str, Any]], list[dict[str, Any]]]:
    if sequence_id in {"crouching_light", "crouching_medium", "crouching_heavy"}:
        pose = pose_token("crouch", weight="low", silhouette="compact_crouch")
        return pose, pose, [pose], []
    if sequence_id.startswith("air_dash_"):
        pose = pose_token(
            "airborne",
            elevation="airborne",
            planted="none",
            weight="airborne",
            vertical="falling",
            silhouette="airborne_weapon_control",
        )
        return pose, pose, [pose], [{"start": 0, "end": 0, "rule": "external_gameplay_state_owns_landing"}]
    neutral = pose_token("neutral_stand", silhouette="calm_low_ready")
    return neutral, neutral, [neutral], []


def phase_and_combat(sequence: dict[str, Any], length: int) -> tuple[dict[str, list[dict[str, int]]], dict[str, Any]]:
    candidate = sequence.get("combatCandidate")
    if candidate:
        startup = int(candidate["startup"])
        active = int(candidate["active"])
        recovery = int(candidate["recovery"])
        if startup + active + recovery != length:
            raise RuntimeError(
                f"{sequence['id']} combat timing {startup}+{active}+{recovery} does not equal {length}"
            )
    else:
        startup, active, recovery = 0, 0, length

    def range_if(start: int, duration: int) -> list[dict[str, int]]:
        return [] if duration <= 0 else [{"start": start, "end": start + duration - 1}]

    phases = {
        "anticipation": range_if(0, startup),
        "startup": range_if(0, startup),
        "active": range_if(startup, active),
        "impact": range_if(startup, active),
        "followThrough": range_if(startup + active, recovery),
        "recovery": range_if(startup + active, recovery),
    }
    authoritative = bool(candidate and candidate.get("authoritative"))
    combat = {
        "startup": startup,
        "active": active,
        "recovery": recovery,
        "damage": 0,
        "hitstop": 0,
        "hitstun": 0,
        "blockstun": 0,
        "boxes": [],
        "cancelWindows": [],
        "timingAuthorship": {
            "simulationTickRateHz": 60,
            "authoredTotalDuration": length,
            "durationModel": "independently_authored_per_move",
            "durationBasis": TIMING_BASIS,
            "uniformDurationNormalizationProhibited": True,
            "visualGameplayAlignment": "aligned_by_default",
            "timingExceptions": [],
        },
    }
    return phases, {
        "combat": combat,
        "authoritative": authoritative,
        "timingState": "authoritative" if authoritative else "sandbox_candidate_awaiting_combat_approval",
    }


def alpha_metrics(path: Path) -> dict[str, Any]:
    with Image.open(path) as source:
        image = source.convert("RGBA")
    pixels = np.asarray(image, dtype=np.uint8)
    alpha = pixels[:, :, 3]
    visible = alpha >= 16
    semitransparent = (alpha > 0) & (alpha < 255)
    red = pixels[:, :, 0].astype(np.int16)
    green = pixels[:, :, 1].astype(np.int16)
    blue = pixels[:, :, 2].astype(np.int16)
    magenta = visible & (red >= 180) & (blue >= 180) & (green <= 95)
    chroma_green = visible & (green >= 150) & (green >= red * 3 // 2) & (green >= blue * 7 // 5)
    near_key_magenta = visible & (red >= 240) & (green <= 32) & (blue >= 240)
    near_key_green = visible & (red <= 32) & (green >= 240) & (blue <= 32)
    visible_count = int(np.count_nonzero(visible))
    magenta_count = int(np.count_nonzero(magenta))
    green_count = int(np.count_nonzero(chroma_green))
    isolated_broad_hue_tolerance = max(8, visible_count // 10_000)
    corners = [
        int(alpha[0, 0]),
        int(alpha[0, image.width - 1]),
        int(alpha[image.height - 1, 0]),
        int(alpha[image.height - 1, image.width - 1]),
    ]
    bbox = image.getchannel("A").getbbox()
    if bbox is None:
        raise RuntimeError(f"empty source frame: {repo_path(path)}")
    return {
        "canvas": [image.width, image.height],
        "mode": image.mode,
        "alphaBounds": list(bbox),
        "transparentCornerAlpha": corners,
        "visiblePixelCount": visible_count,
        "semiTransparentPixelCount": int(np.count_nonzero(semitransparent)),
        "magentaPurpleResiduePixelCount": magenta_count,
        "greenKeyResiduePixelCount": green_count,
        "nearKeyMagentaPixelCount": int(np.count_nonzero(near_key_magenta)),
        "nearKeyGreenPixelCount": int(np.count_nonzero(near_key_green)),
        "isolatedBroadHueTolerancePixels": isolated_broad_hue_tolerance,
        "pass": (
            image.size == (1536, 1536)
            and image.mode == "RGBA"
            and not any(corners)
            and not np.any(near_key_magenta)
            and not np.any(near_key_green)
            and magenta_count <= isolated_broad_hue_tolerance
            and green_count <= isolated_broad_hue_tolerance
        ),
    }


def package_record(
    sequence: dict[str, Any],
    registry: dict[str, dict[str, Any]],
    matrix_evidence_uri: str,
) -> dict[str, Any]:
    sequence_exposures = sequence["exposures"]
    cursor = 0
    exposures = []
    ordered_source_ids: list[str] = []
    for item in sequence_exposures:
        source_id = item["sourceId"]
        if source_id not in registry:
            raise RuntimeError(f"{sequence['id']} references missing sprite registry source: {source_id}")
        if source_id not in ordered_source_ids:
            ordered_source_ids.append(source_id)
        ticks = int(item["ticks"])
        exposures.append({"sourceFrameId": source_id, "start": cursor, "duration": ticks})
        cursor += ticks
    for victim in sequence.get("victimFrames", []):
        source_id = victim["sourceId"]
        if source_id not in registry:
            raise RuntimeError(f"{sequence['id']} references missing victim registry source: {source_id}")
        if source_id not in ordered_source_ids:
            ordered_source_ids.append(source_id)
    length = cursor
    phases, combat_info = phase_and_combat(sequence, length)
    entry_pose, exit_pose, interrupt_poses, landing = sequence_poses(sequence["id"])
    source_frames = []
    alpha_by_id = {}
    for source_id in ordered_source_ids:
        path = registry[source_id]["path"]
        with Image.open(path) as source:
            width, height = source.size
        actual_hash = sha256(path)
        exported = next(
            (
                item.get("approvalSha256")
                for item in [*sequence_exposures, *sequence.get("victimFrames", [])]
                if item["sourceId"] == source_id and item.get("approvalSha256")
            ),
            None,
        )
        if exported and actual_hash != exported.upper():
            raise RuntimeError(
                f"{sequence['id']} exported source hash mismatch for {source_id}: {exported} != {actual_hash}"
            )
        alpha_by_id[source_id] = alpha_metrics(path)
        source_frames.append(
            {
                "id": source_id,
                "sourceUri": repo_uri(path),
                "width": width,
                "height": height,
                "sha256": actual_hash,
                "approvalUri": matrix_evidence_uri,
                "provenanceUri": repo_uri(PRODUCTION_ENTRY),
                "metadataUri": repo_uri(SEQUENCE_SNAPSHOT),
            }
        )
    anchors = []
    grounding = []
    seen = set()
    for exposure in exposures:
        source_id = exposure["sourceFrameId"]
        bounds = alpha_by_id[source_id]["alphaBounds"]
        left, top, right, bottom = bounds
        near = {"x": int(left + (right - left) * 0.35), "y": min(1408, bottom - 1)}
        far = {"x": int(left + (right - left) * 0.65), "y": min(1408, bottom - 1)}
        anchors.append(
            {
                "frame": exposure["start"],
                "sourceFrameId": source_id,
                "root": {"x": 768, "y": 1408},
                "feet": near,
                "nearFoot": near,
                "farFoot": far,
                "effect": {"x": 768, "y": 768},
                "groundingContract": "forge_stance_grounding_v2_source_review_authority",
            }
        )
        if source_id not in seen:
            grounding.append(
                {
                    "sourceFrameId": source_id,
                    "root": {"x": 768, "y": 1408},
                    "nearFoot": near,
                    "farFoot": far,
                    "nearFootRole": "source_review_contact_reference",
                    "farFootRole": "source_review_depth_contact_reference",
                    "projectedGroundPlaneY": 1408,
                    "contractVersion": "forge_stance_grounding_v2_source_review_authority",
                }
            )
            seen.add(source_id)
    review_state = sequence["reviewState"]
    human_state = "approved" if "APPROVED" in review_state or review_state.startswith("approved_") else "pending"
    record = {
        "schemaVersion": "2.1.0-contract",
        "id": sequence["id"],
        "version": 1,
        "promotionState": "candidate",
        "simulationLength": length,
        "sourceFrames": source_frames,
        "exposures": exposures,
        "phases": phases,
        "entryPose": entry_pose,
        "exitPose": exit_pose,
        "interruptPoses": interrupt_poses,
        "transitions": [],
        "landing": landing,
        "anchors": anchors,
        "groundingTrack": grounding,
        "facingBehavior": {
            "authoredFacing": "P1_screen_right",
            "runtimeP2": "horizontal_mirror_screen_left",
            "mirrorAxisX": 768,
            "losslessMirrorRequired": True,
        },
        "playbackPolicy": {
            "mode": "external_gameplay_state" if sequence["family"] in {"universal_movement", "air_movement"} else "fixed_timeline",
            "cursorOwner": "simulation",
            "hitstopFreezesCursor": True,
            "holdBehavior": "clamp_to_gameplay_state" if sequence["family"] in {"universal_movement", "air_movement"} else "none",
        },
        "interruptionBehavior": {
            "owner": "simulation",
            "allowedSources": ["incoming_hit", "incoming_throw", "round_end", "forced_state", "rollback_restore"],
            "onInterrupt": "simulation_selects_authoritative_reaction_or_neutral_branch",
            "returnStatePolicy": "simulation selects the next compatible state; artwork never controls collision or state",
        },
        "transitionCompatibility": [
            {
                "fromStates": ["idle", "walk_forward", "walk_backward", "crouch", "airborne", sequence["id"]],
                "toState": sequence["id"],
                "condition": "isolated_swahili_sandbox_selects_candidate_state",
                "addsGameplayFrames": False,
            },
            {
                "fromStates": [sequence["id"]],
                "toState": "idle",
                "condition": "simulation_owned_candidate_sequence_complete_or_external_state_changes",
                "addsGameplayFrames": False,
            },
        ],
        "combatTrack": combat_info["combat"],
        "gameplayTimingStatus": {
            "state": combat_info["timingState"],
            "authoritative": combat_info["authoritative"],
            "owner": "simulation",
            "candidateValues": {
                "reviewState": review_state,
                "timingAuthority": sequence["timingAuthority"],
                "rootMotionAuthority": sequence.get("rootMotionAuthority", "simulation_owned_or_not_applicable"),
            },
            "notes": [
                "Every move keeps its independently authored 60 Hz duration.",
                "Candidate timing is not authoritative unless the source record explicitly marks it authoritative.",
                "Artwork never controls collision, movement, capture, release, hit results, or rollback.",
            ],
        },
        "presentationSockets": [
            {
                "id": "character_center",
                "x": 768,
                "y": 768,
                "mirrorRule": "x_prime_equals_canvas_width_minus_x",
                "eventTypes": ["frame_change", "optional_vfx", "optional_sound", "optional_camera"],
            }
        ],
        "presentationTrack": [],
        "approvalRecords": [matrix_evidence_uri],
        "validation": {
            "hardGates": [
                "contract_shape",
                "source_sha256",
                "exposure_coverage",
                "phase_bounds",
                "simulation_owns_cursor",
                "mirror_round_trip",
                "pixel_exact_atlas_reconstruction",
                "provenance_present",
            ],
            "creativeWarnings": [
                review_state,
                "source-review grounding records remain authoritative; package alpha bounds do not replace foot-contact review",
                "candidate package only; no production roster or deployment authorization",
            ],
            "humanApprovalRequired": True,
        },
        "provenance": {
            "sourceType": "approved_or_human_review_candidate_exact_rgba",
            "tool": "NGA Forge deterministic Swahili Moveset Goal V1 package compiler",
            "model": None,
            "createdAt": "2026-07-26T00:00:00Z",
            "promptHash": None,
            "seed": None,
            "references": [
                matrix_evidence_uri,
                repo_uri(FINAL_MATRIX),
                repo_uri(SEQUENCE_SNAPSHOT),
            ],
            "revisionChain": [review_state, f"{sequence['id']}_goal_v1_candidate_package"],
            "cleanupOperations": ["metadata_only_package_authoring", "source_pixels_unchanged"],
            "humanApproval": {
                "state": human_state,
                "approvedBy": "recorded_human_approval" if human_state == "approved" else None,
                "approvedAt": "recorded_in_source_evidence" if human_state == "approved" else None,
            },
            "licensingNotes": [
                "Candidate-only Engine V2 sandbox package; not approved for the production roster, shipping atlas, or deployment."
            ],
        },
        "goalV1Extension": {
            "reviewState": review_state,
            "sourceAlphaAudit": alpha_by_id,
            "victimFrames": sequence.get("victimFrames", []),
            "interactionContract": sequence.get("interactionContract"),
        },
    }
    return record


def build_bundle(package_paths: dict[str, str]) -> dict[str, Any]:
    ordered_paths = [package_paths[package_id] for group in PACKAGE_GROUPS.values() for package_id in group]
    if len(ordered_paths) != len(set(ordered_paths)):
        raise RuntimeError("candidate bundle package paths are duplicated")
    return {
        "schemaVersion": "2.1.0-contract",
        "id": "swahili_goal_v1",
        "displayName": "Swahili - Moveset Goal V1 Candidate",
        "bundleVersion": 1,
        "promotionState": "candidate",
        "poseLibrary": POSE_LIBRARY,
        "animationPackages": ordered_paths,
        "packageGroups": PACKAGE_GROUPS,
        "design": {
            "characterBible": repo_uri(SWAHILI_ROOT / "character.lock.json"),
            "palette": repo_uri(SWAHILI_ROOT / "reference.manifest.json"),
            "forbiddenMutations": [
                "identity_drift",
                "costume_drift",
                "pistol_mutation",
                "scythe_mutation",
                "scale_pumping",
                "camera_recenter",
                "baked_vfx",
            ],
        },
        "runtimeProfile": {
            "candidateOnly": True,
            "deployable": False,
            "productionRoster": False,
            "isolatedSandboxOnly": True,
            "centerline": 768,
            "footPosition": 1408,
            "worldHeight": 1067,
            "unsupportedFallbacksWarn": True,
        },
    }


def resolve_repo_uri(uri: str) -> Path:
    if not uri.startswith("repo://"):
        raise RuntimeError(f"expected repo URI: {uri}")
    path = (REPO_ROOT / uri[len("repo://") :]).resolve()
    path.relative_to(REPO_ROOT.resolve())
    return path


def extrude(target: Image.Image, frame: Image.Image, left: int, top: int) -> None:
    target.alpha_composite(frame, (left + EXTRUDE, top + EXTRUDE))
    width, height = frame.size
    target.alpha_composite(frame.crop((0, 0, width, 1)), (left + EXTRUDE, top))
    target.alpha_composite(frame.crop((0, height - 1, width, height)), (left + EXTRUDE, top + EXTRUDE + height))
    target.alpha_composite(frame.crop((0, 0, 1, height)), (left, top + EXTRUDE))
    target.alpha_composite(frame.crop((width - 1, 0, width, height)), (left + EXTRUDE + width, top + EXTRUDE))
    target.putpixel((left, top), frame.getpixel((0, 0)))
    target.putpixel((left + EXTRUDE + width, top), frame.getpixel((width - 1, 0)))
    target.putpixel((left, top + EXTRUDE + height), frame.getpixel((0, height - 1)))
    target.putpixel(
        (left + EXTRUDE + width, top + EXTRUDE + height),
        frame.getpixel((width - 1, height - 1)),
    )


def pack_family_atlas(
    family: str,
    package_records: list[tuple[str, dict[str, Any]]],
) -> dict[str, Any]:
    aliases_by_uri: dict[str, list[dict[str, str]]] = defaultdict(list)
    records_by_uri: dict[str, dict[str, Any]] = {}
    for package_id, package in package_records:
        for frame in package["sourceFrames"]:
            aliases_by_uri[frame["sourceUri"]].append({"packageId": package_id, "sourceFrameId": frame["id"]})
            records_by_uri[frame["sourceUri"]] = frame
    items = []
    for source_uri in sorted(records_by_uri):
        path = resolve_repo_uri(source_uri)
        with Image.open(path) as source:
            image = source.convert("RGBA")
            bbox = image.getchannel("A").getbbox()
            if bbox is None:
                raise RuntimeError(f"cannot atlas empty frame: {repo_path(path)}")
            width, height = bbox[2] - bbox[0], bbox[3] - bbox[1]
        if width + EXTRUDE * 2 > MAX_ATLAS_SIZE or height + EXTRUDE * 2 > MAX_ATLAS_SIZE:
            raise RuntimeError(f"trimmed frame exceeds candidate atlas page: {repo_path(path)} {width}x{height}")
        frame_hash = records_by_uri[source_uri]["sha256"]
        items.append(
            {
                "assetId": f"asset_{frame_hash[:16].lower()}",
                "sourceUri": source_uri,
                "sourcePath": path,
                "sourceSha256": frame_hash,
                "sourcePixelSha256": pixel_sha256(Image.open(path).convert("RGBA")),
                "sourceBounds": {"x": bbox[0], "y": bbox[1], "width": width, "height": height},
                "width": width,
                "height": height,
                "aliases": sorted(aliases_by_uri[source_uri], key=lambda item: (item["packageId"], item["sourceFrameId"])),
            }
        )
    pages: list[list[dict[str, Any]]] = [[]]
    x = PACK_GAP
    y = PACK_GAP
    row_height = 0
    for item in items:
        slot_width = item["width"] + EXTRUDE * 2
        slot_height = item["height"] + EXTRUDE * 2
        if x + slot_width + PACK_GAP > MAX_ATLAS_SIZE:
            x = PACK_GAP
            y += row_height + PACK_GAP
            row_height = 0
        if y + slot_height + PACK_GAP > MAX_ATLAS_SIZE:
            pages.append([])
            x = PACK_GAP
            y = PACK_GAP
            row_height = 0
        item["pageIndex"] = len(pages) - 1
        item["slotX"] = x
        item["slotY"] = y
        pages[-1].append(item)
        x += slot_width + PACK_GAP
        row_height = max(row_height, slot_height)
    output_dir = ATLAS_ROOT / family
    output_dir.mkdir(parents=True, exist_ok=True)
    page_records = []
    frame_manifest: dict[str, Any] = {}
    reconstruction_mismatches: list[str] = []
    for page_index, page_items in enumerate(pages):
        if not page_items:
            continue
        used_width = max(item["slotX"] + item["width"] + EXTRUDE * 2 for item in page_items) + PACK_GAP
        used_height = max(item["slotY"] + item["height"] + EXTRUDE * 2 for item in page_items) + PACK_GAP
        atlas = Image.new("RGBA", (used_width, used_height), (0, 0, 0, 0))
        for item in page_items:
            with Image.open(item["sourcePath"]) as source:
                source_rgba = source.convert("RGBA")
                bounds = item["sourceBounds"]
                trimmed = source_rgba.crop(
                    (
                        bounds["x"],
                        bounds["y"],
                        bounds["x"] + bounds["width"],
                        bounds["y"] + bounds["height"],
                    )
                )
            extrude(atlas, trimmed, item["slotX"], item["slotY"])
        atlas_path = output_dir / f"{family}.candidate.page-{page_index + 1:02d}.png"
        atlas.save(atlas_path, format="PNG", compress_level=6)
        page_records.append(
            {
                "pageIndex": page_index,
                "path": repo_path(atlas_path),
                "width": atlas.width,
                "height": atlas.height,
                "sha256": sha256(atlas_path),
            }
        )
        with Image.open(atlas_path) as packed_source:
            packed = packed_source.convert("RGBA")
            for item in page_items:
                region = packed.crop(
                    (
                        item["slotX"] + EXTRUDE,
                        item["slotY"] + EXTRUDE,
                        item["slotX"] + EXTRUDE + item["width"],
                        item["slotY"] + EXTRUDE + item["height"],
                    )
                )
                reconstructed = Image.new("RGBA", (1536, 1536), (0, 0, 0, 0))
                bounds = item["sourceBounds"]
                reconstructed.alpha_composite(region, (bounds["x"], bounds["y"]))
                with Image.open(item["sourcePath"]) as source:
                    source_rgba = source.convert("RGBA")
                if ImageChops.difference(reconstructed, source_rgba).getbbox() is not None:
                    reconstruction_mismatches.append(item["assetId"])
                frame_manifest[item["assetId"]] = {
                    "pageIndex": page_index,
                    "region": {
                        "x": item["slotX"] + EXTRUDE,
                        "y": item["slotY"] + EXTRUDE,
                        "width": item["width"],
                        "height": item["height"],
                    },
                    "sourceBounds": item["sourceBounds"],
                    "sourceCanvas": {"width": 1536, "height": 1536},
                    "sourceUri": item["sourceUri"],
                    "sourceSha256": item["sourceSha256"],
                    "sourcePixelSha256": item["sourcePixelSha256"],
                    "anchorOffset": {
                        "rootX": 768 - item["sourceBounds"]["x"],
                        "rootY": 1408 - item["sourceBounds"]["y"],
                    },
                    "aliases": item["aliases"],
                }
    manifest = {
        "schemaVersion": 1,
        "record": "SWAHILI_MOVESET_GOAL_V1_CANDIDATE_FAMILY_ATLAS",
        "family": family,
        "candidateOnly": True,
        "deployable": False,
        "finalShippingAtlas": False,
        "packing": {
            "algorithm": "deterministic_variable_trim_shelf_pages",
            "maxPageSize": [MAX_ATLAS_SIZE, MAX_ATLAS_SIZE],
            "extrudePixels": EXTRUDE,
            "gapPixels": PACK_GAP,
            "explicitSourceBounds": True,
            "anchorOffsetsPreserved": True,
        },
        "pageCount": len(page_records),
        "sourceAssetCount": len(items),
        "pages": page_records,
        "frames": dict(sorted(frame_manifest.items())),
        "validation": {
            "pixelExactReconstruction": not reconstruction_mismatches,
            "reconstructionMismatches": reconstruction_mismatches,
        },
    }
    manifest_path = output_dir / f"{family}.candidate.atlas.manifest.json"
    write_json(manifest_path, manifest)
    manifest["manifestPath"] = repo_path(manifest_path)
    manifest["manifestSha256"] = sha256(manifest_path)
    return manifest


def load_bundle_packages(bundle: dict[str, Any]) -> dict[str, dict[str, Any]]:
    packages = {}
    for relative in bundle["animationPackages"]:
        path = (CONTENT_ROOT / relative).resolve()
        path.relative_to((ENGINE_ROOT / "content-source").resolve())
        package = read_json(path)
        packages[package["id"]] = package
    return packages


def verify_hash_lock() -> dict[str, Any]:
    lock = read_json(HASH_LOCK)
    mismatches = []
    for record in lock["files"]:
        path = REPO_ROOT / record["path"]
        actual = sha256(path)
        if actual != record["sha256"]:
            mismatches.append(
                {"path": record["path"], "expectedSha256": record["sha256"], "actualSha256": actual}
            )
    if mismatches:
        raise RuntimeError(f"protected hash lock changed during package build: {mismatches[:5]}")
    return {
        "fileCount": lock["fileCount"],
        "protectedDigestSha256": lock["protectedDigestSha256"],
        "mismatchCount": 0,
    }


def update_matrix_package_status(matrix: dict[str, Any], package_manifest_uri: str) -> None:
    entries = {item["animationId"]: item for item in matrix["entries"]}
    for package_id, animation_ids in PACKAGE_TO_MATRIX.items():
        for animation_id in animation_ids:
            if animation_id not in entries:
                raise RuntimeError(f"package mapping references unknown matrix animation: {animation_id}")
            entries[animation_id]["packageStatus"] = "candidate_package_compiled"
            entries[animation_id]["packageEvidence"] = package_manifest_uri
    entries["standing_medium"]["packageStatus"] = "not_eligible_before_key_pose_and_motion_approval"
    entries["walk_backward"]["packageStatus"] = "not_eligible_manual_art_blocker"
    for animation_id in ("forward_to_backward_reversal", "backward_to_forward_reversal"):
        entries[animation_id]["packageStatus"] = "not_eligible_manual_art_blocker"
    write_json(FINAL_MATRIX, matrix)


def main() -> None:
    if sha256(LEGACY_GAME_JS) != LEGACY_SHA256:
        raise RuntimeError("legacy game.js hash changed before package build")
    if not (ENGINE_ROOT / "dist" / "sandbox" / "sandboxConfig.js").is_file():
        raise RuntimeError("Engine V2 dist modules are missing; run npm.cmd run build:sim first")
    registry = source_registry()
    snapshot = run_json(["node", str(EXPORT_SCRIPT)])
    if snapshot["sequenceCount"] != 18:
        raise RuntimeError(f"unexpected sequence count: {snapshot['sequenceCount']}")
    write_json(SEQUENCE_SNAPSHOT, snapshot)
    matrix = read_json(FINAL_MATRIX)
    matrix_by_id = {entry["animationId"]: entry for entry in matrix["entries"]}
    new_package_paths: dict[str, str] = {}
    for sequence in snapshot["sequences"]:
        matrix_ids = PACKAGE_TO_MATRIX[sequence["id"]]
        evidence = []
        for animation_id in matrix_ids:
            evidence.extend(matrix_by_id[animation_id]["evidence"])
        evidence_path = REPO_ROOT / (evidence[0] if evidence else repo_path(FINAL_MATRIX))
        if not evidence_path.is_file():
            evidence_path = FINAL_MATRIX
        package = package_record(sequence, registry, repo_uri(evidence_path))
        package_path = CONTENT_ROOT / "moves" / sequence["id"].replace("_", "-") / "animation.package.json"
        write_json(package_path, package)
        new_package_paths[sequence["id"]] = package_path.relative_to(CONTENT_ROOT).as_posix()
    reused_package_paths: dict[str, str] = {}
    reused_package_copies = []
    for package_id, source_path in EXISTING_PACKAGE_SOURCES.items():
        source_package = read_json(source_path)
        if source_package["id"] != package_id:
            raise RuntimeError(
                f"reused package id mismatch: expected {package_id}, got {source_package['id']}"
            )
        target_path = CONTENT_ROOT / "reused" / source_path.parent.name / "animation.package.json"
        target_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source_path, target_path)
        source_sha256 = sha256(source_path)
        target_sha256 = sha256(target_path)
        if source_sha256 != target_sha256:
            raise RuntimeError(f"reused package copy changed bytes: {package_id}")
        reused_package_paths[package_id] = target_path.relative_to(CONTENT_ROOT).as_posix()
        reused_package_copies.append(
            {
                "packageId": package_id,
                "source": repo_path(source_path),
                "candidateCopy": repo_path(target_path),
                "sourceSha256": source_sha256,
                "candidateCopySha256": target_sha256,
                "byteIdentical": True,
            }
        )
    package_paths = {**reused_package_paths, **new_package_paths}
    bundle = build_bundle(package_paths)
    bundle_path = CONTENT_ROOT / "character.bundle.json"
    write_json(bundle_path, bundle)
    compile_result = run_json(["node", str(COMPILE_SCRIPT)])
    subprocess.run(
        ["node", str(COMPILE_SCRIPT), "--check"],
        cwd=REPO_ROOT,
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    packages = load_bundle_packages(bundle)
    atlas_manifests = []
    for family, package_ids in PACKAGE_GROUPS.items():
        atlas_manifests.append(
            pack_family_atlas(family, [(package_id, packages[package_id]) for package_id in package_ids])
        )
    reconstruction_mismatches = [
        mismatch
        for manifest in atlas_manifests
        for mismatch in manifest["validation"]["reconstructionMismatches"]
    ]
    alpha_failures = []
    unique_sources = {}
    for package in packages.values():
        for source_frame in package["sourceFrames"]:
            unique_sources[source_frame["sourceUri"]] = resolve_repo_uri(source_frame["sourceUri"])
    alpha_audit = {}
    for source_uri, path in sorted(unique_sources.items()):
        metrics = alpha_metrics(path)
        alpha_audit[source_uri] = metrics
        if not metrics["pass"]:
            alpha_failures.append(source_uri)
    if reconstruction_mismatches:
        raise RuntimeError(f"candidate atlas reconstruction mismatch: {reconstruction_mismatches[:5]}")
    if alpha_failures:
        raise RuntimeError(f"candidate package alpha contamination audit failed: {alpha_failures[:5]}")
    protected = verify_hash_lock()
    status = {
        "schemaVersion": 1,
        "record": "SWAHILI_MOVESET_GOAL_V1_CANDIDATE_PACKAGE_OPERATION",
        "generatedAt": "2026-07-26",
        "status": "PASS_CANDIDATE_PACKAGES_AND_FAMILY_ATLASES",
        "candidateOnly": True,
        "deployable": False,
        "productionRoster": False,
        "isolatedSandboxOnly": True,
        "finalShippingAtlasBuilt": False,
        "bundle": repo_path(bundle_path),
        "bundleSha256": sha256(bundle_path),
        "compiledManifest": repo_path(GENERATED_MANIFEST),
        "compiledManifestSha256": sha256(GENERATED_MANIFEST),
        "compilerSourceDigest": compile_result["sourceDigest"],
        "animationPackageCount": len(packages),
        "newGoalPackageCount": len(new_package_paths),
        "reusedExistingPackageCount": len(EXISTING_PACKAGE_SOURCES),
        "reusedExistingPackages": reused_package_copies,
        "staleCommandGrabPackageExcluded": "NO_GODS_ABOVE/engine_v2/content-source/characters/swahili/moves/command-grab/animation.package.json",
        "currentCommandGrabPackage": repo_path(
            CONTENT_ROOT / "moves" / "command-grab-v2" / "animation.package.json"
        ),
        "atlasFamilies": [
            {
                "family": manifest["family"],
                "manifestPath": manifest["manifestPath"],
                "manifestSha256": manifest["manifestSha256"],
                "pageCount": manifest["pageCount"],
                "sourceAssetCount": manifest["sourceAssetCount"],
                "pixelExactReconstruction": manifest["validation"]["pixelExactReconstruction"],
            }
            for manifest in atlas_manifests
        ],
        "atlasPageCount": sum(manifest["pageCount"] for manifest in atlas_manifests),
        "uniqueSourceAssetCount": len(unique_sources),
        "sourceHashValidation": "PASS_BY_ENGINE_V2_PRODUCTION_CONTRACT_COMPILER",
        "alphaAudit": {
            "sourceCount": len(alpha_audit),
            "failureCount": len(alpha_failures),
            "failures": alpha_failures,
            "records": alpha_audit,
        },
        "pixelExactReconstruction": {
            "pass": not reconstruction_mismatches,
            "mismatchCount": len(reconstruction_mismatches),
            "mismatches": reconstruction_mismatches,
        },
        "protectedHashLock": protected,
        "legacyGameJsSha256": sha256(LEGACY_GAME_JS),
        "humanApprovalStillRequired": [
            "candidate motion and key-pose quality",
            "game feel and authoritative timing",
            "combat balance",
            "final production promotion",
        ],
    }
    write_json(OPERATION_STATUS, status)
    update_matrix_package_status(matrix, repo_path(OPERATION_STATUS))
    print(
        json.dumps(
            {
                "result": "PASS",
                "animationPackageCount": status["animationPackageCount"],
                "newGoalPackageCount": status["newGoalPackageCount"],
                "reusedExistingPackageCount": status["reusedExistingPackageCount"],
                "atlasFamilyCount": len(status["atlasFamilies"]),
                "atlasPageCount": status["atlasPageCount"],
                "uniqueSourceAssetCount": status["uniqueSourceAssetCount"],
                "alphaAuditFailureCount": status["alphaAudit"]["failureCount"],
                "reconstructionMismatchCount": status["pixelExactReconstruction"]["mismatchCount"],
                "protectedMismatchCount": status["protectedHashLock"]["mismatchCount"],
                "legacyGameJsSha256": status["legacyGameJsSha256"],
                "operationStatus": repo_path(OPERATION_STATUS),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
