#!/usr/bin/env python3
"""Advance Swahili Moveset Goal V1 from baseline classification to final review readiness.

This script does not generate artwork or promote Swahili. It closes the remaining
requirements-level gaps by:

* converting the silent reversal gap into a complete manual dependency kit;
* authoring human-review-ready combat-design contracts for every item that cannot
  enter key-pose production before a move-concept decision;
* emitting a final classified matrix and grouped human review queue.
"""

from __future__ import annotations

import hashlib
import json
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[3]
SWAHILI_ROOT = REPO_ROOT / "tools" / "nga-forge" / "production" / "characters" / "swahili"
M0_MATRIX_PATH = SWAHILI_ROOT / "coverage" / "swahili-moveset-goal-v1.matrix.json"
M0_HASH_LOCK_PATH = SWAHILI_ROOT / "freeze" / "swahili-moveset-goal-v1.baseline.hash-lock.json"
FINAL_MATRIX_PATH = SWAHILI_ROOT / "coverage" / "swahili-moveset-goal-v1.final.matrix.json"
CONCEPT_JSON_PATH = SWAHILI_ROOT / "design" / "swahili-moveset-goal-v1.combat-concepts.json"
CONCEPT_MD_PATH = SWAHILI_ROOT / "design" / "swahili-moveset-goal-v1.combat-concepts.md"
REVERSAL_KIT_ROOT = SWAHILI_ROOT / "manual-paintover-kits" / "moveset-goal-v1-reversals"
REVERSAL_KIT_JSON_PATH = REVERSAL_KIT_ROOT / "reversal-manual-action-kit.json"
REVERSAL_KIT_MD_PATH = REVERSAL_KIT_ROOT / "README.md"
REVIEW_QUEUE_JSON_PATH = SWAHILI_ROOT / "reviews" / "swahili-moveset-goal-v1" / "human-review-queue.json"
REVIEW_QUEUE_MD_PATH = SWAHILI_ROOT / "reviews" / "swahili-moveset-goal-v1" / "HUMAN_REVIEW_QUEUE.md"
BACKWARD_KIT_MANIFEST = (
    SWAHILI_ROOT
    / "manual-paintover-kits"
    / "walk-backward-motion-v2"
    / "manual-paintover-kits.manifest.json"
)

LEGACY_GAME_JS = REPO_ROOT / "NO_GODS_ABOVE" / "game.js"
LEGACY_GAME_JS_SHA256 = "D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B"

COMMON_PRESERVE = [
    "approved Swahili character lock and canonical idle anchor",
    "face, snout, body proportions, tuxedo, coat, pistols, and canonical rigid scythe",
    "approved source pixels and VFX separation",
    "1536x1536 RGBA source-frame contract and root at (768, 1408)",
    "authored P1 plus lossless runtime mirror for P2",
    "simulation-owned movement, collision, hit results, timing, and rollback",
    "candidate-only status, deployable false, and production-roster exclusion",
]

COMMON_PROHIBITIONS = [
    "no baked muzzle flashes, sparks, smoke, projectile trails, camera effects, text, grids, or review overlays",
    "no arbitrary whole-sprite victim scaling",
    "no runtime-driven pose fabrication or rotated-idle victim falls",
    "no authoritative combat timing, damage, boxes, cancels, armor, invulnerability, or balance before approval",
    "no legacy game.js, production roster, deployment, or final shipping atlas changes",
]


def repo_path(path: Path) -> str:
    return path.resolve().relative_to(REPO_ROOT.resolve()).as_posix()


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest().upper()


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text.rstrip() + "\n", encoding="utf-8")


def concept(
    animation_id: str,
    group: str,
    label: str,
    gameplay_intent: str,
    key_pose_direction: list[str],
    phase_requirements: list[str],
    variant_delta: dict[str, str] | None = None,
    dependencies: list[str] | None = None,
) -> dict[str, Any]:
    return {
        "animationId": animation_id,
        "group": group,
        "label": label,
        "productionState": "awaiting_human_move_concept_review",
        "finalCategory": "human_review_ready_combat_design_candidate",
        "gameplayIntent": gameplay_intent,
        "keyPoseDirectionCandidate": key_pose_direction,
        "phaseRequirements": phase_requirements,
        "variantDeltaCandidate": variant_delta,
        "dependencies": dependencies or [],
        "humanDecisionRequired": [
            "accept, revise, or reject the move concept and combat role",
            "accept, revise, or reject the key animation direction before artwork generation",
            "approve later motion quality, game feel, authoritative timing, and combat balance separately",
        ],
        "preserve": COMMON_PRESERVE,
        "prohibited": COMMON_PROHIBITIONS,
        "artworkGenerated": False,
        "timingAuthoritative": False,
        "sandboxIntegrated": False,
        "candidateOnly": True,
        "deployable": False,
        "productionRoster": False,
    }


def normal_concepts() -> list[dict[str, Any]]:
    phases = [
        "clear anticipation/startup silhouette",
        "one readable active/contact pose",
        "impact exposure without baked VFX",
        "follow-through that preserves opponent-facing intent",
        "planted recovery compatible with idle, walk, block, and throw startup",
    ]
    specs = [
        (
            "forward_normal_light",
            "Forward Light - advancing pistol-frame check",
            "Fast, close advancing check that supports approach and confirms without becoming a zoning shot.",
            ["small forward weight transfer", "pistol-frame or forearm contact kept close to the body", "short guarded recovery"],
        ),
        (
            "forward_normal_medium",
            "Forward Medium - scythe-shaft body control",
            "Committed mid-strength advancing body check using the rigid scythe shaft as close-range position control.",
            ["hip-led step", "shaft contact outside Swahili's body", "opponent-facing recoil with weapon geometry unchanged"],
        ),
        (
            "forward_normal_heavy",
            "Forward Heavy - advancing hook-control strike",
            "High-commitment advancing control strike with strong reach and whiff risk; not a replacement for Standing Heavy.",
            ["deep loaded step", "broad readable hook-control contact", "long planted recovery with no side switch"],
        ),
        (
            "backward_normal_light",
            "Backward Light - retreating guard check",
            "Quick retreat-compatible check that interrupts pursuit while preserving close-range identity.",
            ["rearward weight shift", "compact elbow or pistol-frame check", "guarded recovery without root teleportation"],
        ),
        (
            "backward_normal_medium",
            "Backward Medium - retreating low hook check",
            "Measured retreating scythe check that discourages forward pursuit without creating full-screen control.",
            ["rear-foot load", "low shaft or hook threat within close-mid range", "weapon-led recovery back to guard"],
        ),
        (
            "backward_normal_heavy",
            "Backward Heavy - committed drag-control denial",
            "Slow, high-risk retreating hook-control strike that denies reckless chase and visibly yields space.",
            ["large rearward anticipation", "single committed drag-control contact", "long recovery with no automatic pull or throw"],
        ),
        (
            "air_light",
            "Air Light - compact airborne check",
            "Fast air-to-air check with low commitment and no projectile behavior.",
            ["compact airborne chamber", "short boot or pistol-frame contact", "return to existing falling pose"],
        ),
        (
            "air_medium",
            "Air Medium - cross-body scythe-shaft strike",
            "Moderate airborne space-control strike that commits torso rotation while preserving facing and landing compatibility.",
            ["airborne cross-body load", "shaft contact separated from body silhouette", "fall-compatible unwind"],
        ),
        (
            "air_heavy",
            "Air Heavy - committed descending hook sweep",
            "High-commitment air normal with a broad downward hook-control silhouette and explicit attack-landing recovery.",
            ["clear airborne anticipation", "descending hook sweep with rigid scythe continuity", "attack-landing recovery branch"],
        ),
    ]
    return [
        concept(
            animation_id,
            "directional_and_air_normals",
            label,
            intent,
            direction,
            phases,
        )
        for animation_id, label, intent, direction in specs
    ]


SPECIAL_FAMILIES = {
    "special_neutral": {
        "label": "Pistol Pressure",
        "identity": "Short-to-mid-range pistol pressure that supports approach and confirms; never a runaway zoning loop.",
        "directions": [
            "close guarded presentation with pistols retained",
            "separate muzzle/smoke/shell VFX sockets",
            "recovery returns to close-range threat rather than retreat",
        ],
        "variants": {
            "light": "Fast single pressure shot; shortest reach and recovery; low commitment; no movement.",
            "medium": "Two-beat pressure string with a small advancing step; moderate recovery; confirms at close-mid range.",
            "heavy": "Committed short burst with the longest startup/recovery and strongest close-range push result; never full-screen.",
        },
    },
    "special_backward": {
        "label": "Scythe Control",
        "identity": "Rearward-loaded scythe control that catches forward movement and manipulates close-range spacing.",
        "directions": [
            "rear-foot load with weapon lag",
            "canonical hook remains outside the victim volume until contact",
            "recovery preserves scythe mounting and both pistols",
        ],
        "variants": {
            "light": "Quick hook check with minimal displacement and no victim pull.",
            "medium": "Slower hook-and-reel candidate with modest victim displacement pending combat approval.",
            "heavy": "Deep-load control candidate with the greatest range and recovery; any side switch requires separate approval.",
        },
    },
    "special_forward": {
        "label": "Advancing Weapon Control",
        "identity": "Forward-moving close-range weapon control that carries Swahili into grappler pressure instead of projectile keep-away.",
        "directions": [
            "visible planted launch before travel",
            "simulation-owned advance with no sprite-driven collision",
            "braked recovery that remains punishable on whiff",
        ],
        "variants": {
            "light": "Short pistol-frame or forearm entry; fastest recovery; no launch result.",
            "medium": "Scythe-shaft shoulder drive with moderate travel and body-control hit result candidate.",
            "heavy": "Longest committed advance with hook-control finish, longest recovery, and no unapproved armor.",
        },
    },
    "special_up": {
        "label": "Anti-Air Upward Control",
        "identity": "Close-range upward control that protects the grappler's approach space without becoming a vertical projectile.",
        "directions": [
            "low loaded anticipation",
            "upward contact silhouette clear from the body",
            "grounded or explicitly authored airborne recovery",
        ],
        "variants": {
            "light": "Fast upward pistol-frame check; narrow range; stays grounded.",
            "medium": "Rising scythe-shaft hook with broader vertical coverage and moderate recovery.",
            "heavy": "Committed launcher candidate with largest vertical reach and landing/recovery liability; no automatic follow-up.",
        },
    },
    "special_down": {
        "label": "Low Control Sweep",
        "identity": "Grounded low-control family that forces close-range respect without replacing the approved Crouching Light shot.",
        "directions": [
            "deep grounded load with stance-aware support",
            "low contact remains visually separate from floor and VFX",
            "planted recovery preserves root and weapon geometry",
        ],
        "variants": {
            "light": "Fast low scythe-shaft check; no knockdown; shortest recovery.",
            "medium": "Broader low hook-control sweep with moderate startup and positional push candidate.",
            "heavy": "Full committed sweep with hard-knockdown candidate, longest startup/recovery, and strict single-hit parity.",
        },
    },
}


def special_concepts() -> list[dict[str, Any]]:
    phases = [
        "distinct anticipation and startup",
        "single readable active/contact role unless later multi-hit approval is explicit",
        "impact exposure with VFX kept separate",
        "variant-specific follow-through",
        "recovery proportional to range, movement, and reward",
    ]
    records: list[dict[str, Any]] = []
    for family_id, family in SPECIAL_FAMILIES.items():
        for strength in ("light", "medium", "heavy"):
            animation_id = f"{family_id}_{strength}"
            records.append(
                concept(
                    animation_id,
                    "core_special_families",
                    f"{family['label']} - {strength.title()}",
                    family["identity"],
                    family["directions"],
                    phases,
                    {
                        "strength": strength,
                        "intentionalDifference": family["variants"][strength],
                        "startup": "relative_only_pending_human_approval",
                        "duration": "independently_authored_at_60_hz_after_motion_review",
                        "range": "relative_only_pending_human_approval",
                        "movement": "simulation_owned_candidate_only",
                        "hitResult": "candidate_only_pending_combat_approval",
                        "vfx": "separate_socketed_presentation_assets_only",
                        "recovery": "relative_only_pending_human_approval",
                        "riskReward": "human_balance_review_required",
                    },
                    [f"{family_id}_family_concept_human_approval"],
                )
            )
    return records


def reaction_and_grab_concepts() -> list[dict[str, Any]]:
    specs = [
        (
            "wall_bounce_reaction",
            "reaction_results",
            "Wall-bounce compatibility",
            "Optional combat-result branch for supported victims; not an automatic property of existing attacks.",
            ["impact compression", "wall contact", "outbound tumble", "fall/landing handoff"],
            ["combat system selects branch", "real victim poses only", "corner clamp and mirrored parity"],
        ),
        (
            "ground_bounce_reaction",
            "reaction_results",
            "Ground-bounce compatibility",
            "Optional combat-result branch with one readable floor impact and deterministic recovery handoff.",
            ["descending victim pose", "floor impact compression", "single rebound", "fall/knockdown handoff"],
            ["single-bounce default", "no rotated idle", "stage floor and root remain simulation-owned"],
        ),
        (
            "soft_knockdown",
            "reaction_results",
            "Soft knockdown result",
            "Shorter knockdown result reusing approved landing/recovery language without changing hard-knockdown art.",
            ["soft impact", "brief downed hold", "quick recovery handoff"],
            ["combat-result selector owns choice", "approved hard-knockdown sequence remains unchanged"],
        ),
        (
            "quick_recovery",
            "reaction_results",
            "Quick recovery option",
            "Simulation-selected faster recovery path that reuses approved compatible get-up poses.",
            ["downed eligibility", "quick brace", "rise", "neutral return"],
            ["timing and invulnerability require balance approval", "no skipped visual discontinuity"],
        ),
        (
            "delayed_recovery",
            "reaction_results",
            "Delayed recovery option",
            "Simulation-selected delayed wake-up path using a held approved downed pose before the approved rise.",
            ["downed hold", "wake-up tell", "approved rise", "neutral return"],
            ["hold duration is simulation-owned", "no new downed art unless human review finds a visual need"],
        ),
        (
            "throw_tech",
            "grabs_and_victim_contracts",
            "Throw-tech response",
            "Mutual break response before capture lock with readable separation and deterministic neutral return.",
            ["pre-lock clash", "attacker recoil", "victim recoil", "neutral spacing restore"],
            ["command grab remains non-techable unless separately approved", "tech window and advantage require combat approval"],
        ),
        (
            "throw_corner_behavior",
            "grabs_and_victim_contracts",
            "Throw corner behavior",
            "Stage-safe resolution contract for forward throw, backward throw, and command grab without sprite scaling or clipping.",
            ["capture", "corner-aware root resolution", "release/impact", "recovery"],
            ["simulation clamps roots", "back throw side switch occurs only if space resolves safely", "mirrored parity"],
        ),
        (
            "unsupported_victim_variants",
            "grabs_and_victim_contracts",
            "Unsupported victim-class variants",
            "Explicit requirements for small, large, non-humanoid, and extreme-proportion victims.",
            ["class-specific capture anchor", "class-specific carry/release pose track", "class-specific landing result"],
            ["standard-height package remains valid only for its declared class", "no arbitrary whole-sprite scaling"],
        ),
    ]
    return [
        concept(
            animation_id,
            group,
            label,
            intent,
            directions,
            requirements + ["authored/mirrored transition compatibility and deterministic replay"],
        )
        for animation_id, group, label, intent, directions, requirements in specs
    ]


def build_concepts(blocked_design_ids: set[str]) -> dict[str, Any]:
    concepts = normal_concepts() + special_concepts() + reaction_and_grab_concepts()
    actual_ids = {item["animationId"] for item in concepts}
    if actual_ids != blocked_design_ids:
        missing = sorted(blocked_design_ids - actual_ids)
        unexpected = sorted(actual_ids - blocked_design_ids)
        raise RuntimeError(f"combat concept coverage mismatch; missing={missing}, unexpected={unexpected}")
    return {
        "schemaVersion": 1,
        "record": "SWAHILI_MOVESET_GOAL_V1_COMBAT_CONCEPT_REVIEW_CONTRACT",
        "generatedAt": "2026-07-25",
        "status": "awaiting_grouped_human_move_concept_review",
        "candidateOnly": True,
        "deployable": False,
        "productionRoster": False,
        "artworkGenerated": False,
        "authoritativeCombatValuesAuthored": False,
        "conceptCount": len(concepts),
        "specialFamilyCount": len(SPECIAL_FAMILIES),
        "specialVariantCount": len([item for item in concepts if item["group"] == "core_special_families"]),
        "concepts": sorted(concepts, key=lambda item: item["animationId"]),
        "reviewDecisionContract": {
            "allowedDecisions": ["APPROVE_CONCEPT", "REQUEST_TARGETED_REVISION", "REJECT_CONCEPT"],
            "approvalEffect": "authorizes candidate key-pose production only; does not approve motion, timing, combat, package promotion, roster, or deployment",
            "groupedReviewFamilies": [
                "directional_and_air_normals",
                "pistol_pressure_special_family",
                "scythe_control_special_family",
                "advancing_weapon_control_special_family",
                "anti_air_upward_special_family",
                "low_control_sweep_special_family",
                "reaction_results",
                "grabs_and_victim_contracts",
            ],
        },
    }


def concept_markdown(payload: dict[str, Any]) -> str:
    groups: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for item in payload["concepts"]:
        groups[item["group"]].append(item)
    lines = [
        "# Swahili Moveset Goal V1 - Combat Concept Review",
        "",
        "Status: `awaiting_grouped_human_move_concept_review`  ",
        "Candidate-only: `true`  ",
        "Deployable: `false`  ",
        "",
        "These requirements are the maximum safe autonomous progress before move-concept approval. No artwork, authoritative timing, combat values, package promotion, roster entry, or deployment is authorized by this document.",
        "",
    ]
    for group_name in sorted(groups):
        lines.extend([f"## {group_name.replace('_', ' ').title()}", ""])
        for item in groups[group_name]:
            lines.extend(
                [
                    f"### {item['label']}",
                    "",
                    f"- Animation ID: `{item['animationId']}`",
                    f"- Intent: {item['gameplayIntent']}",
                    f"- Key-pose direction: {'; '.join(item['keyPoseDirectionCandidate'])}.",
                    f"- Required phases: {'; '.join(item['phaseRequirements'])}.",
                ]
            )
            if item["variantDeltaCandidate"]:
                lines.append(f"- Variant delta: {item['variantDeltaCandidate']['intentionalDifference']}")
            lines.extend(
                [
                    "- Decision: `APPROVE_CONCEPT`, `REQUEST_TARGETED_REVISION`, or `REJECT_CONCEPT`.",
                    "",
                ]
            )
    lines.extend(
        [
            "## Approval boundary",
            "",
            "Concept approval authorizes candidate key-pose production only. Key-pose direction, motion quality, game feel, authoritative timing, combat balance, and final production promotion remain separate human gates.",
        ]
    )
    return "\n".join(lines)


def build_reversal_kit() -> dict[str, Any]:
    manifest = read_json(BACKWARD_KIT_MANIFEST)
    verified_files = 0
    for role in manifest["roles"]:
        role_root = BACKWARD_KIT_MANIFEST.parent / role["frameId"]
        for record in role["files"]:
            path = role_root / record["path"]
            if not path.is_file():
                raise RuntimeError(f"manual paintover kit file missing: {repo_path(path)}")
            actual = sha256(path)
            if actual != record["sha256"].upper():
                raise RuntimeError(
                    f"manual paintover kit hash mismatch: {repo_path(path)} expected {record['sha256']} actual {actual}"
                )
            verified_files += 1
    return {
        "schemaVersion": 1,
        "record": "SWAHILI_MOVESET_GOAL_V1_REVERSAL_MANUAL_ACTION_KIT",
        "generatedAt": "2026-07-25",
        "status": "BLOCKED_MANUAL_ART_COMPLETE_DEPENDENCY_KIT",
        "candidateOnly": True,
        "deployable": False,
        "automatedGenerationRetriesAllowed": False,
        "blockingDependency": {
            "manifest": repo_path(BACKWARD_KIT_MANIFEST),
            "manifestSha256": sha256(BACKWARD_KIT_MANIFEST),
            "requiredManualFrames": manifest["requiredManualFrames"],
            "verifiedReferencedFileCount": verified_files,
            "completionRule": "all three paintovers must pass their existing post-paintover validation templates and human motion review before reversal connector authoring",
        },
        "reversals": [
            {
                "animationId": "forward_to_backward_reversal",
                "finalCategory": "blocked_manual_art_complete_kit",
                "sourceBoundary": "approved/candidate Forward Walk V2 contact-weighted cycle boundary",
                "targetBoundary": "completed Backward Walk V2 cycle",
                "manualAction": [
                    "complete and validate the three existing Backward Walk V2 paintovers",
                    "select the nearest valid forward support phase and backward support phase",
                    "author the minimum transition connector only after both boundary phases are approved",
                    "validate support-foot continuity, root velocity sign change, weapon continuity, authored/mirrored parity, and deterministic replay",
                ],
                "timingAuthority": "simulation-owned candidate; authoritative reversal timing requires gameplay approval",
            },
            {
                "animationId": "backward_to_forward_reversal",
                "finalCategory": "blocked_manual_art_complete_kit",
                "sourceBoundary": "completed Backward Walk V2 cycle",
                "targetBoundary": "approved/candidate Forward Walk V2 contact-weighted cycle boundary",
                "manualAction": [
                    "complete and validate the three existing Backward Walk V2 paintovers",
                    "select the nearest valid backward support phase and forward support phase",
                    "author the minimum transition connector only after both boundary phases are approved",
                    "validate support-foot continuity, root velocity sign change, weapon continuity, authored/mirrored parity, and deterministic replay",
                ],
                "timingAuthority": "simulation-owned candidate; authoritative reversal timing requires gameplay approval",
            },
        ],
        "postManualValidation": [
            "1536x1536 clean RGBA with transparent corners and no colored alpha fringe",
            "character lock, pistols, and rigid scythe unchanged",
            "no floating feet, foot skating, root jump, scale pumping, or camera-distance drift",
            "no mirrored-source splice; P2 is a lossless runtime mirror",
            "forward-to-backward and backward-to-forward direction changes are monotonic and deterministic",
            "legacy game.js remains byte-identical",
        ],
    }


def reversal_markdown(payload: dict[str, Any]) -> str:
    dependency = payload["blockingDependency"]
    lines = [
        "# Swahili Moveset Goal V1 - Reversal Manual Action Kit",
        "",
        "Status: `BLOCKED_MANUAL_ART_COMPLETE_DEPENDENCY_KIT`  ",
        "Automated retries: `prohibited`  ",
        "",
        "Both reversal directions depend on the same three unresolved Backward Walk V2 paintovers. This kit closes the prior silent `missing` classification without fabricating connector art.",
        "",
        "## Required manual inputs",
        "",
    ]
    lines.extend(f"- `{frame_id}`" for frame_id in dependency["requiredManualFrames"])
    lines.extend(
        [
            "",
            f"Authoritative paintover manifest: `{dependency['manifest']}`",
            f"Verified referenced files: `{dependency['verifiedReferencedFileCount']}`",
            "",
        ]
    )
    for reversal in payload["reversals"]:
        lines.extend([f"## {reversal['animationId']}", ""])
        lines.extend(f"- {action}" for action in reversal["manualAction"])
        lines.append("")
    lines.extend(["## Post-manual gate", ""])
    lines.extend(f"- {item}" for item in payload["postManualValidation"])
    return "\n".join(lines)


def final_category(entry: dict[str, Any]) -> str:
    status = entry["currentStatus"]
    if status in {"approved_motion", "approved_key_poses"}:
        return "approved_production_baseline"
    if status in {"candidate_motion", "candidate_key_poses"}:
        return "human_review_ready_candidate"
    if status == "blocked_manual_art":
        return "blocked_manual_art_complete_kit"
    if status == "blocked_combat_design":
        return "human_review_ready_combat_design_candidate"
    if status == "not_applicable":
        return "not_applicable"
    raise RuntimeError(f"entry has no valid final category: {entry['animationId']} status={status}")


def build_final_matrix(
    baseline: dict[str, Any],
    concepts: dict[str, Any],
    reversal_kit: dict[str, Any],
) -> dict[str, Any]:
    concept_by_id = {item["animationId"]: item for item in concepts["concepts"]}
    entries = json.loads(json.dumps(baseline["entries"]))
    for entry in entries:
        animation_id = entry["animationId"]
        if animation_id == "forward_to_backward_reversal":
            entry["currentStatus"] = "blocked_manual_art"
            entry["gate"] = "blocked_until_backward_walk_manual_paintovers_pass"
            entry["timingStatus"] = "blocked_manual_dependency_then_candidate_timing"
            entry["sandboxStatus"] = "not_integrated_manual_blocker"
            entry["packageStatus"] = "not_eligible_until_manual_art_and_motion_review"
            entry["dependencies"] = ["walk_forward", "walk_backward"]
            entry["evidence"] = [repo_path(REVERSAL_KIT_JSON_PATH)]
            entry["notes"] = "Requirements are authored; the complete reversal action kit reuses the verified Backward Walk paintover kits. No connector art was fabricated."
        elif animation_id == "backward_to_forward_reversal":
            entry["evidence"] = sorted(set(entry["evidence"] + [repo_path(REVERSAL_KIT_JSON_PATH)]))
            entry["notes"] = "Complete reversal action kit recorded; connector authoring remains blocked on the three Backward Walk manual paintovers."
        elif animation_id in concept_by_id:
            concept_record = concept_by_id[animation_id]
            entry["productionState"] = concept_record["productionState"]
            entry["finalCategory"] = concept_record["finalCategory"]
            entry["gate"] = "awaiting_grouped_human_move_concept_review"
            entry["timingStatus"] = "requirements_only_no_authoritative_timing"
            entry["sandboxStatus"] = "not_integrated_requirements_only"
            entry["packageStatus"] = "not_eligible_before_concept_key_pose_and_motion_approval"
            entry["evidence"] = sorted(set(entry["evidence"] + [repo_path(CONCEPT_JSON_PATH)]))
            entry["notes"] = "Human-review-ready move requirements authored. Concept approval authorizes key-pose production only; no artwork or combat values were fabricated."
        if "finalCategory" not in entry:
            entry["finalCategory"] = final_category(entry)
        entry["finalStopEligible"] = True
    status_counts = Counter(item["currentStatus"] for item in entries)
    category_counts = Counter(item["finalCategory"] for item in entries)
    if status_counts.get("missing", 0):
        raise RuntimeError("final matrix still contains missing entries")
    if len(entries) != baseline["entryCount"] or len({item["animationId"] for item in entries}) != len(entries):
        raise RuntimeError("final matrix entry coverage is not unique and complete")
    return {
        **{key: value for key, value in baseline.items() if key != "entries"},
        "record": "SWAHILI_MOVESET_GOAL_V1_FINAL_CLASSIFIED_MATRIX",
        "generatedAt": "2026-07-25",
        "supersedesForFinalPlanning": repo_path(M0_MATRIX_PATH),
        "entryCount": len(entries),
        "statusCounts": dict(sorted(status_counts.items())),
        "finalCategoryCounts": dict(sorted(category_counts.items())),
        "silentMissingCount": 0,
        "combatDesignRequirementsReadyCount": len(concepts["concepts"]),
        "manualActionKit": repo_path(REVERSAL_KIT_JSON_PATH),
        "combatConceptContract": repo_path(CONCEPT_JSON_PATH),
        "candidateOnly": True,
        "deployable": False,
        "productionRoster": False,
        "entries": entries,
    }


def build_review_queue(matrix: dict[str, Any]) -> dict[str, Any]:
    groups: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for entry in matrix["entries"]:
        category = entry["finalCategory"]
        if category == "human_review_ready_candidate":
            queue_group = {
                "locomotion": "locomotion",
                "stance_transition": "locomotion",
                "facing_transition": "locomotion",
                "ground_normal": "standing_and_crouching_normals",
                "grab_result": "grabs_and_reactions",
                "grab": "grabs_and_reactions",
                "command_grab": "grabs_and_reactions",
            }.get(entry["family"], "other_review_candidates")
            groups[queue_group].append(entry)
        elif category == "human_review_ready_combat_design_candidate":
            concept_group = (
                "core_special_concepts"
                if entry["animationId"].startswith("special_")
                else "directional_air_normal_concepts"
                if entry["animationId"].startswith(("forward_normal", "backward_normal", "air_"))
                else "reaction_and_grab_contracts"
            )
            groups[concept_group].append(entry)
        elif category == "blocked_manual_art_complete_kit":
            groups["manual_art_blockers"].append(entry)
    payload_groups = []
    for priority, name in enumerate(
        [
            "locomotion",
            "standing_and_crouching_normals",
            "grabs_and_reactions",
            "directional_air_normal_concepts",
            "core_special_concepts",
            "reaction_and_grab_contracts",
            "manual_art_blockers",
            "other_review_candidates",
        ],
        start=1,
    ):
        items = sorted(groups.get(name, []), key=lambda item: item["animationId"])
        if not items:
            continue
        payload_groups.append(
            {
                "priority": priority,
                "group": name,
                "itemCount": len(items),
                "decision": "APPROVE, REQUEST_TARGETED_REVISION, or REJECT for each independent item/family",
                "items": [
                    {
                        "animationId": item["animationId"],
                        "currentStatus": item["currentStatus"],
                        "finalCategory": item["finalCategory"],
                        "gate": item["gate"],
                        "evidence": item["evidence"],
                        "notes": item["notes"],
                    }
                    for item in items
                ],
            }
        )
    return {
        "schemaVersion": 1,
        "record": "SWAHILI_MOVESET_GOAL_V1_GROUPED_HUMAN_REVIEW_QUEUE",
        "generatedAt": "2026-07-25",
        "status": "ready_for_grouped_human_review",
        "candidateOnly": True,
        "deployable": False,
        "groupCount": len(payload_groups),
        "itemCount": sum(group["itemCount"] for group in payload_groups),
        "groups": payload_groups,
    }


def review_queue_markdown(payload: dict[str, Any]) -> str:
    lines = [
        "# Swahili Moveset Goal V1 - Human Review Queue",
        "",
        "Status: `ready_for_grouped_human_review`  ",
        "Candidate-only: `true`  ",
        "Deployable: `false`  ",
        "",
        "Review groups are independent. A blocked family does not stop decisions on another family. Concept approval authorizes candidate key-pose work only; it does not approve motion, timing, balance, roster promotion, or deployment.",
        "",
    ]
    for group in payload["groups"]:
        lines.extend(
            [
                f"## {group['priority']}. {group['group'].replace('_', ' ').title()}",
                "",
            ]
        )
        for item in group["items"]:
            lines.extend(
                [
                    f"- `{item['animationId']}` - `{item['finalCategory']}`",
                    f"  - Gate: `{item['gate']}`",
                    f"  - Evidence: {', '.join(f'`{path}`' for path in item['evidence'])}",
                ]
            )
        lines.append("")
    return "\n".join(lines)


def main() -> None:
    if not M0_MATRIX_PATH.is_file() or not M0_HASH_LOCK_PATH.is_file():
        raise RuntimeError("Milestone 0 matrix and hash lock must exist before completion planning")
    if sha256(LEGACY_GAME_JS) != LEGACY_GAME_JS_SHA256:
        raise RuntimeError("legacy game.js no longer matches the protected hash")
    baseline = read_json(M0_MATRIX_PATH)
    blocked_design_ids = {
        item["animationId"] for item in baseline["entries"] if item["currentStatus"] == "blocked_combat_design"
    }
    concepts = build_concepts(blocked_design_ids)
    reversal_kit = build_reversal_kit()
    write_json(CONCEPT_JSON_PATH, concepts)
    write_text(CONCEPT_MD_PATH, concept_markdown(concepts))
    write_json(REVERSAL_KIT_JSON_PATH, reversal_kit)
    write_text(REVERSAL_KIT_MD_PATH, reversal_markdown(reversal_kit))
    final_matrix = build_final_matrix(baseline, concepts, reversal_kit)
    write_json(FINAL_MATRIX_PATH, final_matrix)
    review_queue = build_review_queue(final_matrix)
    write_json(REVIEW_QUEUE_JSON_PATH, review_queue)
    write_text(REVIEW_QUEUE_MD_PATH, review_queue_markdown(review_queue))
    print(
        json.dumps(
            {
                "result": "PASS",
                "entryCount": final_matrix["entryCount"],
                "statusCounts": final_matrix["statusCounts"],
                "finalCategoryCounts": final_matrix["finalCategoryCounts"],
                "silentMissingCount": final_matrix["silentMissingCount"],
                "combatConceptCount": concepts["conceptCount"],
                "specialVariantCount": concepts["specialVariantCount"],
                "manualKitVerifiedFiles": reversal_kit["blockingDependency"]["verifiedReferencedFileCount"],
                "reviewQueueItems": review_queue["itemCount"],
                "legacyGameJsSha256": sha256(LEGACY_GAME_JS),
                "outputs": [
                    repo_path(FINAL_MATRIX_PATH),
                    repo_path(CONCEPT_JSON_PATH),
                    repo_path(CONCEPT_MD_PATH),
                    repo_path(REVERSAL_KIT_JSON_PATH),
                    repo_path(REVERSAL_KIT_MD_PATH),
                    repo_path(REVIEW_QUEUE_JSON_PATH),
                    repo_path(REVIEW_QUEUE_MD_PATH),
                ],
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
