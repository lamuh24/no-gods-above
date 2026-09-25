from __future__ import annotations

import csv
import hashlib
import io
import json
import subprocess
from collections import Counter
from pathlib import Path
from typing import Any, Iterable


REPO_ROOT = Path(__file__).resolve().parents[3]
SWAHILI_ROOT = REPO_ROOT / "tools" / "nga-forge" / "production" / "characters" / "swahili"
ENGINE_ROOT = REPO_ROOT / "NO_GODS_ABOVE" / "engine_v2"
ENGINE_CONTENT_ROOT = ENGINE_ROOT / "content-source" / "characters" / "swahili"

MATRIX_PATH = SWAHILI_ROOT / "coverage" / "swahili-moveset-goal-v1.matrix.json"
CSV_PATH = SWAHILI_ROOT / "coverage" / "swahili-moveset-goal-v1.matrix.csv"
BACKLOG_PATH = SWAHILI_ROOT / "backlog" / "swahili-moveset-goal-v1.dependency-ordered.json"
HASH_LOCK_PATH = SWAHILI_ROOT / "freeze" / "swahili-moveset-goal-v1.baseline.hash-lock.json"
REPORT_JSON_PATH = SWAHILI_ROOT / "reports" / "swahili-moveset-goal-v1" / "milestone-0-baseline-report.json"
REPORT_MD_PATH = SWAHILI_ROOT / "reports" / "swahili-moveset-goal-v1" / "milestone-0-baseline-report.md"

LEGACY_GAME_JS_SHA256 = "D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B"
BASELINE_COMMIT = "81412231aa5fdfbd907d27bc6591b39dce7b43ca"
GOAL_BRANCH = "codex/swahili-moveset-goal-v1"

ALLOWED_STATUSES = [
    "approved_motion",
    "approved_key_poses",
    "candidate_motion",
    "candidate_key_poses",
    "blocked_manual_art",
    "blocked_combat_design",
    "rejected",
    "missing",
    "not_applicable",
]


def repo_path(path: Path) -> str:
    return path.relative_to(REPO_ROOT).as_posix()


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest().upper()


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8", newline="\n")


def write_json(path: Path, payload: Any) -> None:
    write_text(path, json.dumps(payload, indent=2, ensure_ascii=False) + "\n")


def git_output(*args: str) -> str:
    result = subprocess.run(
        ["git", *args],
        cwd=REPO_ROOT,
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    return result.stdout.strip()


def entry(
    animation_id: str,
    family: str,
    status: str,
    gate: str,
    evidence: Iterable[str],
    *,
    timing: str = "not_authored",
    sandbox: str = "not_integrated",
    package: str = "not_compiled",
    dependencies: Iterable[str] = (),
    notes: str = "",
) -> dict[str, Any]:
    if status not in ALLOWED_STATUSES:
        raise ValueError(f"Unsupported coverage status for {animation_id}: {status}")
    return {
        "animationId": animation_id,
        "family": family,
        "currentStatus": status,
        "gate": gate,
        "timingStatus": timing,
        "sandboxStatus": sandbox,
        "packageStatus": package,
        "dependencies": list(dependencies),
        "evidence": list(evidence),
        "notes": notes,
        "candidateOnly": True,
        "deployable": False,
        "productionRoster": False,
    }


def build_entries() -> list[dict[str, Any]]:
    approvals = "tools/nga-forge/production/characters/swahili/approvals"
    statuses = "tools/nga-forge/production/characters/swahili/status"
    reports = "tools/nga-forge/production/characters/swahili/reports"
    engine_docs = "NO_GODS_ABOVE/engine_v2/docs/swahili_sandbox"
    entries: list[dict[str, Any]] = []

    entries.extend(
        [
            entry(
                "idle",
                "universal_state",
                "approved_motion",
                "approved_production_baseline",
                [f"{approvals}/idle-foundation-v1.approval.json"],
                timing="approved_review_timing_non_combat",
                sandbox="sandbox_preview_only",
            ),
            entry(
                "crouch",
                "universal_state",
                "approved_key_poses",
                "stance_transition_motion_review",
                [f"{approvals}/defense-reaction-key-poses-v1.approval.json"],
                timing="hold_state_simulation_owned",
                sandbox="sandbox_preview_only",
            ),
            entry(
                "walk_forward",
                "locomotion",
                "candidate_motion",
                "awaiting_human_forward_walk_v2_motion_review",
                [
                    f"{engine_docs}/forward-walk-v2-live-review/REVIEW_SUMMARY.md",
                    "tools/nga-forge/production/characters/swahili/production-entry.json",
                ],
                timing="candidate_contact_weighted_40_ticks_non_authoritative",
                sandbox="isolated_swahili_sandbox",
            ),
            entry(
                "walk_backward",
                "locomotion",
                "blocked_manual_art",
                "three_manual_rgba_paintovers_required",
                [
                    f"{approvals}/walk-backward-motion-v2.manual-paintovers-block.json",
                    "tools/nga-forge/production/characters/swahili/manual-paintover-kits/walk-backward-motion-v2/manual-paintover-kits.manifest.json",
                ],
                timing="blocked_until_cycle_art_is_complete",
                dependencies=[
                    "walk_backward_first_passing",
                    "walk_backward_first_up",
                    "walk_backward_opposite_down",
                ],
                notes="Automated retries are prohibited; the complete manual paint-over kits are authoritative.",
            ),
            entry(
                "dash_forward",
                "locomotion",
                "approved_motion",
                "approved_production_baseline",
                [f"{approvals}/dash-motion-v2.approval.json"],
                timing="approved_44_ticks_60hz",
                sandbox="isolated_swahili_sandbox",
            ),
            entry(
                "dash_backward",
                "locomotion",
                "approved_motion",
                "approved_production_baseline",
                [f"{approvals}/dash-motion-v2.approval.json"],
                timing="approved_50_ticks_60hz",
                sandbox="isolated_swahili_sandbox",
            ),
            entry(
                "forward_to_backward_reversal",
                "locomotion_transition",
                "missing",
                "requirements_authored_then_key_pose_authoring",
                ["tools/nga-forge/production/characters/swahili/coverage/animation-coverage-completion-v1.matrix.json"],
                dependencies=["walk_forward", "walk_backward"],
            ),
            entry(
                "backward_to_forward_reversal",
                "locomotion_transition",
                "blocked_manual_art",
                "blocked_until_backward_walk_manual_paintovers_pass",
                [f"{approvals}/walk-backward-motion-v2.manual-paintovers-block.json"],
                dependencies=["walk_backward"],
            ),
            entry(
                "standing_to_crouch",
                "stance_transition",
                "candidate_motion",
                "awaiting_human_stance_transition_motion_review",
                [f"{statuses}/stance-transitions-v1.status.json"],
                timing="candidate_11_ticks_non_authoritative",
                sandbox="candidate_review_only",
            ),
            entry(
                "crouch_to_standing",
                "stance_transition",
                "candidate_motion",
                "awaiting_human_stance_transition_motion_review",
                [f"{statuses}/stance-transitions-v1.status.json"],
                timing="candidate_11_ticks_non_authoritative",
                sandbox="candidate_review_only",
            ),
            entry(
                "turn_side_switch_compatibility",
                "facing_transition",
                "candidate_motion",
                "awaiting_human_turn_side_switch_live_review",
                [
                    f"{statuses}/turn-side-switch-compatibility-v1.status.json",
                    f"{reports}/animation-coverage-completion-v1/turn-side-switch-compatibility-v1/turn-side-switch-compatibility-v1.motion-review.md",
                ],
                timing="candidate_12_ticks_non_authoritative",
                sandbox="isolated_swahili_sandbox",
            ),
            entry(
                "air_dash_forward",
                "air_mobility",
                "approved_motion",
                "approved_current_sandbox_baseline_production_balance_pending",
                [f"{approvals}/air-mobility-v1.approval.json", f"{statuses}/air-dash-motion-v1.status.json"],
                timing="approved_sandbox_baseline_12_ticks_non_production_balance",
                sandbox="isolated_swahili_sandbox",
            ),
            entry(
                "air_dash_backward",
                "air_mobility",
                "approved_motion",
                "approved_current_sandbox_baseline_production_balance_pending",
                [f"{approvals}/air-mobility-v1.approval.json", f"{statuses}/air-dash-side-switch-v2.status.json"],
                timing="approved_sandbox_baseline_12_ticks_non_production_balance",
                sandbox="isolated_swahili_sandbox",
            ),
        ]
    )

    jump_evidence = [
        f"{approvals}/jump-fall-landing-key-poses-v1.approval.json",
        f"{approvals}/jump-fall-landing-connectors-v1.approval.json",
        "tools/nga-forge/production/characters/swahili/motion/jump-fall-landing-connectors-v1.approved.synchronization.json",
    ]
    for animation_id in [
        "jump_anticipation",
        "jump_takeoff",
        "jump_rising",
        "jump_apex",
        "falling",
        "soft_landing",
        "attack_landing_recovery",
        "hard_landing_compatibility",
    ]:
        entries.append(
            entry(
                animation_id,
                "jump_fall_landing",
                "approved_motion",
                "approved_motion_sandbox_integration_candidate_only",
                jump_evidence,
                timing="approved_motion_spacing_reference_simulation_trajectory_owned",
                sandbox="isolated_swahili_sandbox",
            )
        )

    defense_evidence = [
        f"{approvals}/defense-reaction-motion-v1.approval.json",
        f"{approvals}/defense-reaction-v1.in-game.approval.json",
    ]
    for animation_id in [
        "standing_block",
        "crouching_block",
        "light_hit_reaction",
        "heavy_hit_reaction",
    ]:
        entries.append(
            entry(
                animation_id,
                "defense_reaction",
                "approved_motion",
                "approved_current_sandbox_baseline",
                defense_evidence,
                timing="incoming_combat_state_owned_candidate_timing",
                sandbox="isolated_swahili_sandbox",
                package="candidate_animation_package_compiled",
            )
        )

    knockdown_approval = f"{approvals}/knockdown-recovery-motion-v1.approval.json"
    for animation_id in [
        "launch_reaction",
        "airborne_tumble",
        "ground_impact",
        "face_up_knockdown",
        "hard_knockdown",
        "wake_up_startup",
        "neutral_get_up",
        "landing_from_launch",
    ]:
        entries.append(
            entry(
                animation_id,
                "knockdown_recovery",
                "approved_motion",
                "approved_motion_sandbox_integration_candidate_only",
                [knockdown_approval, f"{statuses}/knockdown-recovery-motion-v1.approved.status.json"],
                timing="approved_artwork_motion_sandbox_cursor_non_production",
                sandbox="isolated_swahili_sandbox",
            )
        )
    entries.extend(
        [
            entry(
                "face_down_knockdown_if_required",
                "knockdown_recovery",
                "not_applicable",
                "no_current_move_contract_requires_face_down_variant",
                [knockdown_approval],
                notes="Re-open only if an approved combat result requires a face-down branch.",
            ),
            entry(
                "wall_bounce_reaction",
                "knockdown_recovery",
                "blocked_combat_design",
                "wall_bounce_result_and_variant_requirement_pending",
                ["tools/nga-forge/production/characters/swahili/character.lock.json"],
                dependencies=["approved_wall_bounce_combat_result"],
            ),
            entry(
                "ground_bounce_reaction",
                "knockdown_recovery",
                "blocked_combat_design",
                "ground_bounce_result_and_variant_requirement_pending",
                ["tools/nga-forge/production/characters/swahili/character.lock.json"],
                dependencies=["approved_ground_bounce_combat_result"],
            ),
            entry(
                "soft_knockdown",
                "knockdown_recovery",
                "blocked_combat_design",
                "soft_knockdown_result_pending_move_contract",
                [knockdown_approval],
            ),
            entry(
                "quick_recovery",
                "knockdown_recovery",
                "blocked_combat_design",
                "recovery_option_and_timing_pending",
                [knockdown_approval],
            ),
            entry(
                "delayed_recovery",
                "knockdown_recovery",
                "blocked_combat_design",
                "recovery_option_and_timing_pending",
                [knockdown_approval],
            ),
            entry(
                "throw_result_knockdown_compatibility",
                "knockdown_recovery",
                "candidate_motion",
                "awaiting_throw_result_and_corner_gameplay_review",
                [
                    knockdown_approval,
                    "NO_GODS_ABOVE/engine_v2/tests/swahili_knockdown_recovery_v1.test.js",
                ],
                sandbox="isolated_swahili_sandbox",
                dependencies=["universal_forward_throw", "universal_backward_throw", "command_grab"],
            ),
        ]
    )

    entries.extend(
        [
            entry(
                "standing_light",
                "normal_attack",
                "approved_motion",
                "approved_current_production_baseline_with_polish_debt",
                [f"{approvals}/standing-light-motion-v1.baseline-with-polish-debt.approval.json"],
                timing="approved_12_ticks",
                sandbox="isolated_swahili_sandbox",
                notes="Standing Heavy remains the visual-quality benchmark.",
            ),
            entry(
                "standing_medium",
                "normal_attack",
                "candidate_key_poses",
                "awaiting_human_standing_medium_v3_key_pose_review",
                [
                    f"{statuses}/standing-medium-identity-v3.status.json",
                    f"{reports}/attack-animation-cleanup-v1/standing-medium-identity-v3/standing-medium-v3-key-pose-review.md",
                ],
                timing="not_authored_for_v3",
                notes="V3 supersedes the rejected longer-light/rising-knee direction for current review.",
            ),
            entry(
                "standing_heavy",
                "normal_attack",
                "approved_motion",
                "approved_production_baseline",
                [
                    f"{approvals}/standing-heavy-motion-v1.approval.json",
                    f"{approvals}/standing-heavy-combat-profile-v1.approval.json",
                ],
                timing="authoritative_75_ticks_60hz",
                sandbox="isolated_swahili_sandbox",
            ),
            entry(
                "crouching_light",
                "normal_attack",
                "approved_motion",
                "approved_current_production_baseline",
                [f"{approvals}/crouching-light-motion-v1.approval.json"],
                timing="authoritative_17_ticks_60hz",
                sandbox="isolated_swahili_sandbox",
            ),
            entry(
                "crouching_medium",
                "normal_attack",
                "candidate_motion",
                "awaiting_human_crouching_medium_motion_review",
                [f"{statuses}/crouching-medium-motion-v1.status.json"],
                timing="candidate_20_or_24_ticks_non_authoritative",
                sandbox="isolated_swahili_sandbox",
            ),
            entry(
                "crouching_heavy",
                "normal_attack",
                "candidate_motion",
                "awaiting_human_crouching_heavy_motion_review",
                [f"{statuses}/crouching-heavy-motion-v1.status.json"],
                timing="candidate_32_or_40_ticks_non_authoritative",
                sandbox="isolated_swahili_sandbox",
                notes="Sweep knockdown result is not authoritative.",
            ),
        ]
    )

    attack_audit = f"{reports}/attack-animation-cleanup-v1/attack-animation-audit-v1.md"
    rebuild_queue = f"{reports}/attack-animation-cleanup-v1/prioritized-rebuild-queue-v1.json"
    for direction in ["forward", "backward"]:
        for strength in ["light", "medium", "heavy"]:
            entries.append(
                entry(
                    f"{direction}_normal_{strength}",
                    "normal_attack",
                    "blocked_combat_design",
                    "approve_move_design_then_author_key_poses",
                    [attack_audit, rebuild_queue],
                    dependencies=[f"{direction}_directional_normals_family_concept_approval"],
                )
            )
    for strength in ["light", "medium", "heavy"]:
        entries.append(
            entry(
                f"air_{strength}",
                "normal_attack",
                "blocked_combat_design",
                "approve_air_normal_design_then_author_key_poses",
                [attack_audit, rebuild_queue],
                dependencies=["air_normals_family_concept_approval"],
            )
        )

    special_families = {
        "neutral": "pistol_pressure_family",
        "backward": "scythe_control_family",
        "forward": "advancing_weapon_control_family",
        "up": "anti_air_upward_family",
        "down": "low_control_sweep_family",
    }
    for direction, concept in special_families.items():
        for strength in ["light", "medium", "heavy"]:
            entries.append(
                entry(
                    f"special_{direction}_{strength}",
                    "core_special",
                    "blocked_combat_design",
                    "approve_five_core_family_concepts_before_variant_key_poses",
                    [
                        "tools/nga-forge/production/characters/swahili/character.lock.json",
                        rebuild_queue,
                    ],
                    dependencies=[f"{concept}_approval"],
                    notes="L/M/H must be intentional variants of one approved family, not unrelated moves.",
                )
            )

    grab_motion_approval = f"{approvals}/grab-throw-motion-v1.approval.json"
    command_motion_approval = f"{approvals}/command-grab-motion-v1.approval.json"
    package_status = "tools/nga-forge/production/characters/swahili/packages/grab-throw-v1/operation-status.json"
    for animation_id in [
        "universal_grab_attempt",
        "universal_forward_throw",
        "universal_backward_throw",
    ]:
        entries.append(
            entry(
                animation_id,
                "throw_grab",
                "approved_motion",
                "awaiting_human_grab_combat_timing_and_balance_review",
                [grab_motion_approval, package_status],
                timing="candidate_non_authoritative_package_timing",
                sandbox="preview_only",
                package="candidate_animation_package_unlisted_from_active_bundle",
            )
        )
    entries.extend(
        [
            entry(
                "command_grab",
                "throw_grab",
                "approved_motion",
                "awaiting_combat_timing_runtime_balance",
                [command_motion_approval, f"{statuses}/command-grab-motion-v1.approved.status.json"],
                timing="selected_0_8x_motion_reference_non_authoritative",
                sandbox="isolated_swahili_sandbox",
                package="existing_candidate_package_is_stale_and_requires_rebuild_from_approved_v1_motion",
            ),
            entry(
                "throw_whiff",
                "throw_grab",
                "candidate_motion",
                "awaiting_throw_whiff_gameplay_review",
                [package_status],
                timing="candidate_universal_grab_attempt_recovery",
                sandbox="preview_only",
                package="candidate_package",
            ),
            entry(
                "throw_tech",
                "throw_grab",
                "blocked_combat_design",
                "throw_tech_window_result_and_animation_direction_pending",
                [package_status],
            ),
            entry(
                "command_grab_victim_fall",
                "throw_grab",
                "candidate_motion",
                "awaiting_human_command_grab_victim_fall_gameplay_review",
                [f"{statuses}/command-grab-victim-fall-v1.status.json"],
                timing="candidate_sandbox_victim_timing",
                sandbox="isolated_swahili_sandbox",
            ),
            entry(
                "throw_corner_behavior",
                "throw_grab",
                "blocked_combat_design",
                "forward_backward_command_throw_corner_results_pending",
                [package_status],
            ),
            entry(
                "unsupported_victim_variants",
                "throw_grab",
                "blocked_combat_design",
                "small_large_non_humanoid_and_extreme_variant_requirements_pending",
                [package_status],
                notes="Arbitrary whole-sprite runtime scaling is prohibited.",
            ),
        ]
    )

    for animation_id in ["super", "ultimate", "intro", "victory", "round_finisher"]:
        entries.append(
            entry(
                animation_id,
                "cinematic_or_meta",
                "not_applicable",
                "explicitly_out_of_scope_for_swahili_moveset_goal_v1",
                ["tools/nga-forge/production/characters/swahili/production-entry.json"],
                notes="Requires a new explicitly authorized Goal.",
            )
        )

    seen: set[str] = set()
    for item in entries:
        animation_id = item["animationId"]
        if animation_id in seen:
            raise ValueError(f"Duplicate coverage entry: {animation_id}")
        seen.add(animation_id)
        for evidence_path in item["evidence"]:
            if not (REPO_ROOT / evidence_path).exists():
                raise FileNotFoundError(f"Coverage evidence is missing for {animation_id}: {evidence_path}")
    return entries


def resolve_recorded_path(raw_path: str, source_json: Path) -> Path | None:
    value = raw_path.removeprefix("repo://").replace("\\", "/")
    candidates: list[Path] = []
    if value.startswith("tools/") or value.startswith("NO_GODS_ABOVE/") or value.startswith("agent/"):
        candidates.append(REPO_ROOT / value)
    elif value.startswith("../") or value.startswith("./"):
        candidates.append(source_json.parent / value)
    else:
        candidates.extend(
            [
                SWAHILI_ROOT / value,
                source_json.parent / value,
                REPO_ROOT / value,
            ]
        )
    for candidate in candidates:
        resolved = candidate.resolve()
        try:
            resolved.relative_to(REPO_ROOT.resolve())
        except ValueError:
            continue
        if resolved.is_file():
            return resolved
    return None


def recorded_path_hash_pairs(payload: Any) -> Iterable[tuple[str, str]]:
    if isinstance(payload, dict):
        path_value = None
        for key in ("path", "approvedPath", "approvedSourcePath", "activeAnchorPath"):
            if isinstance(payload.get(key), str):
                path_value = payload[key]
                break
        hash_value = None
        for key in (
            "sha256",
            "approvedSha256",
            "actualSha256",
            "expectedSha256",
            "activeAnchorSha256",
        ):
            if isinstance(payload.get(key), str) and len(payload[key]) == 64:
                hash_value = payload[key]
                break
        if path_value and hash_value:
            yield path_value, hash_value.upper()
        for value in payload.values():
            yield from recorded_path_hash_pairs(value)
    elif isinstance(payload, list):
        for value in payload:
            yield from recorded_path_hash_pairs(value)


def add_files(
    protected: dict[Path, set[str]],
    category: str,
    files: Iterable[Path],
) -> None:
    for path in files:
        if path.is_file() and path.resolve() != HASH_LOCK_PATH.resolve():
            protected.setdefault(path.resolve(), set()).add(category)


def build_hash_lock() -> dict[str, Any]:
    protected: dict[Path, set[str]] = {}
    expected_hashes: dict[Path, set[str]] = {}
    recorded_sources: dict[Path, set[str]] = {}
    unresolved_records: list[dict[str, str]] = []

    add_files(
        protected,
        "approved_source",
        (SWAHILI_ROOT / "source-frames" / "approved").rglob("*"),
    )
    add_files(protected, "approved_vfx", (SWAHILI_ROOT / "vfx").rglob("*"))
    add_files(protected, "candidate_packages", ENGINE_CONTENT_ROOT.rglob("*"))
    add_files(protected, "approval_evidence", (SWAHILI_ROOT / "approvals").glob("*.json"))
    add_files(protected, "approval_evidence", (SWAHILI_ROOT / "freeze").glob("*.json"))
    add_files(
        protected,
        "approval_evidence",
        [
            SWAHILI_ROOT / "character.lock.json",
            SWAHILI_ROOT / "reference.manifest.json",
            SWAHILI_ROOT / "production-entry.json",
        ],
    )

    recorded_jsons = sorted((SWAHILI_ROOT / "approvals").glob("*.json"))
    recorded_jsons += sorted((SWAHILI_ROOT / "freeze").glob("*.json"))
    recorded_jsons += sorted((SWAHILI_ROOT / "motion").glob("*approved*.json"))
    for source_json in recorded_jsons:
        if source_json.resolve() == HASH_LOCK_PATH.resolve():
            continue
        payload = json.loads(source_json.read_text(encoding="utf-8"))
        for raw_path, expected_hash in recorded_path_hash_pairs(payload):
            resolved = resolve_recorded_path(raw_path, source_json)
            if resolved is None:
                unresolved_records.append(
                    {
                        "sourceRecord": repo_path(source_json),
                        "recordedPath": raw_path,
                    }
                )
                continue
            protected.setdefault(resolved, set()).add("recorded_approved_artifact")
            expected_hashes.setdefault(resolved, set()).add(expected_hash)
            recorded_sources.setdefault(resolved, set()).add(repo_path(source_json))

    architecture_files: list[Path] = [
        ENGINE_ROOT / "docs" / "production_ecosystem_architecture.md",
        ENGINE_ROOT / "scripts" / "compile_content.js",
        ENGINE_ROOT / "scripts" / "validate_production_contracts.js",
        ENGINE_ROOT / "src" / "data" / "fighters.ts",
    ]
    architecture_files.extend((ENGINE_ROOT / "schemas" / "production").rglob("*"))
    architecture_files.extend((ENGINE_ROOT / "src" / "core").rglob("*"))
    add_files(protected, "protected_architecture", architecture_files)
    add_files(protected, "protected_legacy_runtime", [REPO_ROOT / "NO_GODS_ABOVE" / "game.js"])

    records: list[dict[str, Any]] = []
    mismatches: list[dict[str, Any]] = []
    for path in sorted(protected, key=repo_path):
        actual_hash = sha256(path)
        expected = sorted(expected_hashes.get(path, set()))
        if expected and actual_hash not in expected:
            mismatches.append(
                {
                    "path": repo_path(path),
                    "actualSha256": actual_hash,
                    "recordedSha256": expected,
                    "sourceRecords": sorted(recorded_sources.get(path, set())),
                }
            )
        records.append(
            {
                "path": repo_path(path),
                "bytes": path.stat().st_size,
                "sha256": actual_hash,
                "categories": sorted(protected[path]),
                "recordedSha256": expected,
                "sourceRecords": sorted(recorded_sources.get(path, set())),
            }
        )

    game_record = next(
        record for record in records if record["path"] == "NO_GODS_ABOVE/game.js"
    )
    if game_record["sha256"] != LEGACY_GAME_JS_SHA256:
        mismatches.append(
            {
                "path": "NO_GODS_ABOVE/game.js",
                "actualSha256": game_record["sha256"],
                "recordedSha256": [LEGACY_GAME_JS_SHA256],
                "sourceRecords": ["hard_goal_invariant"],
            }
        )

    digest_source = "\n".join(
        f"{record['path']}\0{record['sha256']}" for record in records
    ).encode("utf-8")
    manifest = {
        "schemaVersion": 1,
        "record": "SWAHILI_MOVESET_GOAL_V1_MILESTONE_0_HASH_LOCK",
        "createdAt": "2026-07-25",
        "branch": GOAL_BRANCH,
        "baselineCommit": BASELINE_COMMIT,
        "rule": "Hash-reference only. No protected source is copied, rewritten, normalized, repainted, resized, recentered, staged, or promoted by this operation.",
        "fileCount": len(records),
        "categoryCounts": dict(
            sorted(
                Counter(
                    category
                    for record in records
                    for category in record["categories"]
                ).items()
            )
        ),
        "protectedDigestSha256": hashlib.sha256(digest_source).hexdigest().upper(),
        "legacyGameJsSha256": game_record["sha256"],
        "recordedHashMismatchCount": len(mismatches),
        "recordedHashMismatches": mismatches,
        "unresolvedRecordedPathCount": len(unresolved_records),
        "unresolvedRecordedPaths": unresolved_records,
        "files": records,
    }
    if mismatches:
        raise RuntimeError(
            "Recorded protected hashes do not match current bytes:\n"
            + json.dumps(mismatches, indent=2)
        )
    return manifest


def build_backlog(entries: list[dict[str, Any]]) -> dict[str, Any]:
    by_id = {item["animationId"]: item for item in entries}

    def item(animation_id: str) -> dict[str, Any]:
        current = by_id[animation_id]
        return {
            "animationId": animation_id,
            "currentStatus": current["currentStatus"],
            "gate": current["gate"],
            "dependencies": current["dependencies"],
        }

    phases = [
        {
            "priority": 0,
            "milestone": "baseline_safety",
            "status": "complete_after_report_validation",
            "workItems": [
                "goal_branch",
                "protected_hash_lock",
                "baseline_validation",
                "coverage_matrix",
                "dependency_ordered_backlog",
            ],
            "stopGate": "no_generation_before_milestone_0_pass",
        },
        {
            "priority": 1,
            "milestone": "universal_movement_coverage",
            "status": "in_progress",
            "workItems": [
                item(animation_id)
                for animation_id in [
                    "walk_forward",
                    "walk_backward",
                    "forward_to_backward_reversal",
                    "backward_to_forward_reversal",
                    "standing_to_crouch",
                    "crouch_to_standing",
                    "turn_side_switch_compatibility",
                ]
            ],
            "preserveApproved": [
                "idle",
                "dash_forward",
                "dash_backward",
                "air_dash_forward",
                "air_dash_backward",
                "jump_anticipation",
                "jump_takeoff",
                "jump_rising",
                "jump_apex",
                "falling",
                "soft_landing",
                "attack_landing_recovery",
                "hard_landing_compatibility",
                "launch_reaction",
                "airborne_tumble",
                "ground_impact",
                "face_up_knockdown",
                "neutral_get_up",
            ],
            "stopGate": "family_human_motion_or_manual_art_review",
        },
        {
            "priority": 2,
            "milestone": "normal_attack_coverage",
            "status": "in_progress",
            "workItems": [
                {
                    "family": "standing_normals",
                    "items": [item(name) for name in ["standing_light", "standing_medium", "standing_heavy"]],
                    "nextAction": "human_review_standing_medium_v3_key_pose_direction",
                },
                {
                    "family": "crouching_normals",
                    "items": [item(name) for name in ["crouching_light", "crouching_medium", "crouching_heavy"]],
                    "nextAction": "human_review_medium_and_heavy_motion_candidates",
                },
                {
                    "family": "directional_normals",
                    "items": [
                        item(f"{direction}_normal_{strength}")
                        for direction in ["forward", "backward"]
                        for strength in ["light", "medium", "heavy"]
                    ],
                    "nextAction": "author_requirements_and_stop_for_family_concept_review",
                },
                {
                    "family": "air_normals",
                    "items": [item(f"air_{strength}") for strength in ["light", "medium", "heavy"]],
                    "nextAction": "author_requirements_and_stop_for_family_concept_review",
                },
            ],
            "stopGate": "family_human_key_pose_motion_and_gameplay_review",
        },
        {
            "priority": 3,
            "milestone": "five_core_special_families",
            "status": "blocked_combat_design",
            "workItems": [
                {
                    "family": family,
                    "items": [
                        item(f"special_{direction}_{strength}")
                        for strength in ["light", "medium", "heavy"]
                    ],
                    "nextAction": "author_family_requirements_then_human_concept_review",
                }
                for direction, family in {
                    "neutral": "pistol_pressure_family",
                    "backward": "scythe_control_family",
                    "forward": "advancing_weapon_control_family",
                    "up": "anti_air_upward_family",
                    "down": "low_control_sweep_family",
                }.items()
            ],
            "stopGate": "human_family_concept_review_before_lmh_variant_art",
        },
        {
            "priority": 4,
            "milestone": "grabs_throws_and_reactions",
            "status": "in_progress",
            "workItems": [
                item(name)
                for name in [
                    "universal_grab_attempt",
                    "universal_forward_throw",
                    "universal_backward_throw",
                    "command_grab",
                    "throw_whiff",
                    "throw_tech",
                    "command_grab_victim_fall",
                    "throw_corner_behavior",
                    "unsupported_victim_variants",
                    "throw_result_knockdown_compatibility",
                    "wall_bounce_reaction",
                    "ground_bounce_reaction",
                ]
            ],
            "nextAction": "rebuild_command_grab_candidate_package_from_approved_v1_motion_then_review_combat_timing_and_victim_results",
            "stopGate": "human_gameplay_balance_and_victim_compatibility_review",
        },
        {
            "priority": 5,
            "milestone": "candidate_packaging",
            "status": "blocked_by_family_review_gates",
            "requirements": [
                "deterministic_animation_packages",
                "trimmed_family_atlases",
                "explicit_sourceBounds",
                "anchor_offsets",
                "edge_extrusion",
                "pixel_exact_reconstruction",
                "isolated_sandbox_only",
            ],
            "stopGate": "no_final_shipping_atlas_and_no_production_roster",
        },
        {
            "priority": 6,
            "milestone": "final_verification",
            "status": "blocked_by_prior_milestones",
            "requirements": [
                "full_forge_tests",
                "full_engine_v2_tests",
                "production_build",
                "typescript_checks",
                "browser_authored_and_mirrored_smokes",
                "deterministic_replay_checksums",
                "rollback_presentation_event_checks",
                "source_hash_verification",
                "alpha_edge_and_rigid_prop_audits",
                "transition_matrix",
                "package_reconstruction_tests",
                "no_running_jobs",
            ],
            "stopGate": "goal_final_stop_condition",
        },
    ]
    return {
        "schemaVersion": 1,
        "record": "SWAHILI_MOVESET_GOAL_V1_DEPENDENCY_ORDERED_BACKLOG",
        "generatedAt": "2026-07-25",
        "branch": GOAL_BRANCH,
        "candidateOnly": True,
        "deployable": False,
        "productionRoster": False,
        "legacyGameJsMutable": False,
        "phases": phases,
    }


def build_report(
    entries: list[dict[str, Any]],
    hash_lock: dict[str, Any],
) -> dict[str, Any]:
    counts = dict(sorted(Counter(item["currentStatus"] for item in entries).items()))
    human_review = [
        item["animationId"]
        for item in entries
        if item["currentStatus"] in {"candidate_motion", "candidate_key_poses"}
    ]
    manual = [
        item["animationId"]
        for item in entries
        if item["currentStatus"] == "blocked_manual_art"
    ]
    combat_design = [
        item["animationId"]
        for item in entries
        if item["currentStatus"] == "blocked_combat_design"
    ]
    explicit_missing = [
        item["animationId"] for item in entries if item["currentStatus"] == "missing"
    ]
    return {
        "schemaVersion": 1,
        "record": "SWAHILI_MOVESET_GOAL_V1_MILESTONE_0_BASELINE_REPORT",
        "generatedAt": "2026-07-25",
        "goal": "Complete Swahili Moveset V1",
        "milestone": 0,
        "result": "PASS_WITH_RECORDED_BASELINE_TEST_REPAIR",
        "git": {
            "branch": GOAL_BRANCH,
            "baselineCommit": BASELINE_COMMIT,
            "baselineStagedFileCount": 0,
            "baselineTrackedModifiedFileCount": 68,
            "baselineUntrackedFileCount": 3061,
            "unrelatedWorkPreserved": True,
            "filesCleanedOrReverted": 0,
        },
        "coverage": {
            "entryCount": len(entries),
            "statusCounts": counts,
            "humanReviewReadyCandidates": human_review,
            "blockedManualArt": manual,
            "blockedCombatDesign": combat_design,
            "explicitMissing": explicit_missing,
            "silentMissingCount": 0,
            "outOfScopeStatesClassifiedNotApplicable": [
                item["animationId"]
                for item in entries
                if item["currentStatus"] == "not_applicable"
            ],
        },
        "hashLock": {
            "path": repo_path(HASH_LOCK_PATH),
            "fileCount": hash_lock["fileCount"],
            "protectedDigestSha256": hash_lock["protectedDigestSha256"],
            "recordedHashMismatchCount": hash_lock["recordedHashMismatchCount"],
            "unresolvedRecordedPathCount": hash_lock["unresolvedRecordedPathCount"],
            "legacyGameJsSha256": hash_lock["legacyGameJsSha256"],
        },
        "validation": [
            {
                "command": "python -m unittest discover -s tests -v",
                "cwd": "tools/nga-forge/backend",
                "initialResult": "FAIL_79_OF_83",
                "cause": "stale_global_gif_allowlist_rejected_235_later_review_gifs",
                "repair": "preserve_exact_original_review_counts_and_restrict_all_gifs_to_reports_review_or_reviews_roots",
                "finalResult": "PASS_83_OF_83",
            },
            {
                "command": "python -m unittest discover -s tools/nga-forge/tests -v",
                "cwd": ".",
                "finalResult": "PASS_36_OF_36",
            },
            {
                "command": "npm.cmd run validate",
                "cwd": "NO_GODS_ABOVE/engine_v2",
                "finalResult": "PASS",
            },
            {
                "command": "npm.cmd run build",
                "cwd": "NO_GODS_ABOVE/engine_v2",
                "finalResult": "PASS",
            },
            {
                "command": "npm.cmd run build",
                "cwd": "tools/nga-forge/frontend",
                "finalResult": "PASS",
            },
            {
                "command": "focused Swahili walk, dash, jump, turn, air, command-grab, and ground-normal suites",
                "cwd": "NO_GODS_ABOVE/engine_v2",
                "finalResult": "PASS",
            },
        ],
        "invariants": {
            "legacyGameJsByteIdentical": hash_lock["legacyGameJsSha256"]
            == LEGACY_GAME_JS_SHA256,
            "approvedRecordedHashMismatches": hash_lock["recordedHashMismatchCount"],
            "swahiliOutsideProductionRoster": True,
            "candidateOnly": True,
            "deployable": False,
            "generationPerformed": False,
            "approvedPixelsModified": False,
            "packagesPromoted": False,
            "atlasBuilt": False,
            "pushPrMergeDeployPublishPerformed": False,
        },
        "nextAction": "Begin Milestone 1 with the candidate review queue and manual backward-walk blocker preserved; do not generate new art until the user-facing review gates are respected.",
    }


def matrix_csv(entries: list[dict[str, Any]]) -> str:
    output = io.StringIO(newline="")
    fields = [
        "animationId",
        "family",
        "currentStatus",
        "gate",
        "timingStatus",
        "sandboxStatus",
        "packageStatus",
        "dependencies",
        "evidence",
        "notes",
        "candidateOnly",
        "deployable",
        "productionRoster",
    ]
    writer = csv.DictWriter(output, fieldnames=fields, lineterminator="\n")
    writer.writeheader()
    for item in entries:
        row = dict(item)
        row["dependencies"] = "|".join(item["dependencies"])
        row["evidence"] = "|".join(item["evidence"])
        writer.writerow(row)
    return output.getvalue()


def report_markdown(report: dict[str, Any]) -> str:
    coverage = report["coverage"]
    hash_lock = report["hashLock"]
    lines = [
        "# Swahili Moveset Goal V1 - Milestone 0 Baseline",
        "",
        f"Status: `{report['result']}`",
        "",
        "## Safety outcome",
        "",
        f"- Dedicated branch: `{report['git']['branch']}` at baseline `{report['git']['baselineCommit']}`.",
        f"- Preserved the pre-existing dirty worktree: {report['git']['baselineTrackedModifiedFileCount']} tracked modifications, {report['git']['baselineUntrackedFileCount']} untracked files, and no staged files at branch creation.",
        "- No file was cleaned, reverted, staged, promoted, pushed, merged, deployed, or published.",
        "- No artwork generation occurred during Milestone 0.",
        "",
        "## Protected baseline",
        "",
        f"- Hash-locked {hash_lock['fileCount']} approved-source, VFX, candidate-package, approval-evidence, architecture, core-simulation, roster, and legacy-runtime files.",
        f"- Protected digest: `{hash_lock['protectedDigestSha256']}`.",
        f"- Legacy `NO_GODS_ABOVE/game.js`: `{hash_lock['legacyGameJsSha256']}`.",
        f"- Recorded hash mismatches: {hash_lock['recordedHashMismatchCount']}.",
        f"- Unresolved historical recorded paths: {hash_lock['unresolvedRecordedPathCount']} (preserved as report evidence; these are historical relative-path records, not hash failures).",
        "",
        "## Coverage outcome",
        "",
        f"- Matrix entries: {coverage['entryCount']}.",
        f"- Status counts: `{json.dumps(coverage['statusCounts'], sort_keys=True)}`.",
        f"- Explicitly missing: {', '.join(coverage['explicitMissing']) or 'none'}.",
        f"- Manual-art blockers: {', '.join(coverage['blockedManualArt']) or 'none'}.",
        f"- Silent missing states: {coverage['silentMissingCount']}.",
        "- Supers, ultimate, intro, victory, and round finisher are explicitly `not_applicable` for this Goal.",
        "",
        "## Validation",
        "",
    ]
    for validation in report["validation"]:
        detail = validation.get("finalResult", "UNKNOWN")
        lines.append(f"- `{validation['command']}` from `{validation['cwd']}`: **{detail}**.")
        if "initialResult" in validation:
            lines.append(
                f"  - Initial result `{validation['initialResult']}` was traced to `{validation['cause']}` and repaired as `{validation['repair']}`."
            )
    lines.extend(
        [
            "",
            "## Current production gates",
            "",
            "- Human review remains required for forward walk, stance transitions, planted turn/side-switch, Standing Medium V3 key poses, Crouching Medium motion, Crouching Heavy motion, throw gameplay, and Command Grab combat timing/victim results.",
            "- Backward Walk remains `blocked_manual_art` with three complete paint-over kits; automated retries remain prohibited.",
            "- Directional normals, air normals, five special-family concepts, throw tech, bounce results, and unsupported victim variants remain `blocked_combat_design`.",
            "- The existing Command Grab candidate package predates the approved 24-frame Command Grab Motion V1 and must be rebuilt before it can evidence the current motion.",
            "",
            "## Artifacts",
            "",
            f"- Coverage JSON: `{repo_path(MATRIX_PATH)}`",
            f"- Coverage CSV: `{repo_path(CSV_PATH)}`",
            f"- Dependency backlog: `{repo_path(BACKLOG_PATH)}`",
            f"- Hash lock: `{repo_path(HASH_LOCK_PATH)}`",
            f"- Machine report: `{repo_path(REPORT_JSON_PATH)}`",
            "",
            "Swahili remains candidate-only, outside the production roster, and `deployable: false`.",
            "",
        ]
    )
    return "\n".join(lines)


def main() -> None:
    branch = git_output("branch", "--show-current")
    commit = git_output("rev-parse", "HEAD")
    if branch != GOAL_BRANCH:
        raise RuntimeError(f"Expected goal branch {GOAL_BRANCH}, found {branch}")
    if commit != BASELINE_COMMIT:
        raise RuntimeError(f"Expected baseline commit {BASELINE_COMMIT}, found {commit}")

    entries = build_entries()
    counts = dict(sorted(Counter(item["currentStatus"] for item in entries).items()))
    matrix = {
        "schemaVersion": 2,
        "record": "SWAHILI_MOVESET_GOAL_V1_COVERAGE_MATRIX",
        "generatedAt": "2026-07-25",
        "branch": GOAL_BRANCH,
        "baselineCommit": BASELINE_COMMIT,
        "sourceOfTruthOrder": [
            "human approval and rejection records",
            "exact protected hashes and freeze records",
            "current status and synchronization records",
            "current Engine V2 tests and sandbox contracts",
            "older coverage matrix only where not superseded",
        ],
        "allowedStatuses": ALLOWED_STATUSES,
        "entryCount": len(entries),
        "statusCounts": counts,
        "candidateOnly": True,
        "deployable": False,
        "productionRoster": False,
        "legacyGameJsSha256": LEGACY_GAME_JS_SHA256,
        "supersedesForCurrentPlanning": "tools/nga-forge/production/characters/swahili/coverage/animation-coverage-completion-v1.matrix.json",
        "entries": entries,
    }
    backlog = build_backlog(entries)
    hash_lock = build_hash_lock()
    report = build_report(entries, hash_lock)

    write_json(MATRIX_PATH, matrix)
    write_text(CSV_PATH, matrix_csv(entries))
    write_json(BACKLOG_PATH, backlog)
    write_json(HASH_LOCK_PATH, hash_lock)
    write_json(REPORT_JSON_PATH, report)
    write_text(REPORT_MD_PATH, report_markdown(report))

    print(
        json.dumps(
            {
                "result": "PASS",
                "entryCount": len(entries),
                "statusCounts": counts,
                "hashLockedFiles": hash_lock["fileCount"],
                "protectedDigestSha256": hash_lock["protectedDigestSha256"],
                "recordedHashMismatchCount": hash_lock["recordedHashMismatchCount"],
                "unresolvedRecordedPathCount": hash_lock["unresolvedRecordedPathCount"],
                "outputs": [
                    repo_path(MATRIX_PATH),
                    repo_path(CSV_PATH),
                    repo_path(BACKLOG_PATH),
                    repo_path(HASH_LOCK_PATH),
                    repo_path(REPORT_JSON_PATH),
                    repo_path(REPORT_MD_PATH),
                ],
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
