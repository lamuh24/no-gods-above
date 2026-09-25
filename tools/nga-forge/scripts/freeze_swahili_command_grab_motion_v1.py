from __future__ import annotations

import copy
import hashlib
import json
import shutil
from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[3]
CHAR = ROOT / "tools/nga-forge/production/characters/swahili"
RECORD = "SWAHILI_COMMAND_GRAB_MOTION_V1"

V21_MOTION = CHAR / "motion/command-grab-full-v21-head-direction.synchronization.json"
V21_VALIDATION = (
    CHAR
    / "reports/command-grab-full-v21-head-direction/full-command-grab-v21-head-direction-validation.json"
)
V21_TIMING_VALIDATION = (
    CHAR
    / "reports/command-grab-full-v21-head-direction/full-command-grab-v21-0.8x-validation.json"
)
SELECTED_PREVIEW = (
    CHAR
    / "review/command-grab-full-v21-head-direction/command-grab-full-v21-p1-0.8x.gif"
)
GAME_JS = ROOT / "NO_GODS_ABOVE/game.js"

APPROVED_FRAMES = CHAR / "source-frames/approved/command-grab-motion-v1"
APPROVED_REVIEW = CHAR / "review/command-grab-motion-v1-approved"
APPROVED_AUTHORED_PREVIEW = APPROVED_REVIEW / "command-grab-motion-v1-authored-0.8x.gif"
APPROVED_MIRRORED_PREVIEW = APPROVED_REVIEW / "command-grab-motion-v1-mirrored-0.8x.gif"
APPROVAL = CHAR / "approvals/command-grab-motion-v1.approval.json"
MOTION = CHAR / "motion/command-grab-motion-v1.approved.synchronization.json"
PROVENANCE = CHAR / "generation/command-grab-motion-v1.approved.provenance.json"
STATUS = CHAR / "status/command-grab-motion-v1.approved.status.json"
REPORT_DIR = CHAR / "reports/command-grab-motion-v1-approved"
VALIDATION = REPORT_DIR / "command-grab-motion-v1-freeze-validation.json"
LESSONS = REPORT_DIR / "production-lessons.md"
OPTIONAL_VFX = REPORT_DIR / "optional-presentation-polish.md"

EXPECTED_SELECTED_PREVIEW_SHA = (
    "48E636E8526C9B042232A29F30DFDDA176EA66A13376874E58A503335E230FE2"
)
EXPECTED_GAME_JS_SHA = (
    "D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B"
)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest().upper()


def relative(path: Path) -> str:
    return path.resolve().relative_to(ROOT.resolve()).as_posix()


def write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def gif_metrics(path: Path) -> dict:
    with Image.open(path) as image:
        frame_count = image.n_frames
        duration_ms = 0
        for index in range(frame_count):
            image.seek(index)
            duration_ms += int(image.info.get("duration", 0))
        return {
            "frameCount": frame_count,
            "durationMs": duration_ms,
            "canvas": [image.size[0], image.size[1]],
        }


def save_mirrored_gif(source: Path, output: Path) -> None:
    frames: list[Image.Image] = []
    durations: list[int] = []
    with Image.open(source) as image:
        for index in range(image.n_frames):
            image.seek(index)
            frames.append(ImageOps.mirror(image.convert("RGBA")))
            durations.append(int(image.info.get("duration", 0)))
    frames[0].save(
        output,
        save_all=True,
        append_images=frames[1:],
        duration=durations,
        loop=0,
        disposal=2,
        optimize=False,
    )


def frame_filename(frame: dict) -> str:
    return f"{int(frame['index']):02d}_{frame['frameId']}.png"


def main() -> int:
    motion = json.loads(V21_MOTION.read_text(encoding="utf-8"))
    v21_validation = json.loads(V21_VALIDATION.read_text(encoding="utf-8"))
    timing_validation = json.loads(V21_TIMING_VALIDATION.read_text(encoding="utf-8"))

    APPROVED_FRAMES.mkdir(parents=True, exist_ok=True)
    APPROVED_REVIEW.mkdir(parents=True, exist_ok=True)
    REPORT_DIR.mkdir(parents=True, exist_ok=True)

    frames, approved_entries, failures = [], [], []
    source_hashes_before: dict[str, str] = {}
    for frame in motion["frames"]:
        source = Path(frame["source"])
        if not source.is_file():
            failures.append(f"missing source for frame {frame['index']}: {source}")
            continue

        current_source_sha = sha256(source)
        source_hashes_before[str(source)] = current_source_sha
        if current_source_sha != frame["sourceSha256"]:
            failures.append(
                f"source hash mismatch for frame {frame['index']}: "
                f"{current_source_sha} != {frame['sourceSha256']}"
            )
            continue

        approved = APPROVED_FRAMES / frame_filename(frame)
        shutil.copyfile(source, approved)
        approved_sha = sha256(approved)
        if approved_sha != current_source_sha:
            failures.append(f"approved copy is not byte-identical: {approved}")

        with Image.open(approved) as image:
            canvas = [image.size[0], image.size[1], image.mode]
        if canvas != [1536, 1536, "RGBA"]:
            failures.append(f"unexpected frame canvas/mode for {approved}: {canvas}")

        approved_entry = copy.deepcopy(frame)
        approved_entry.update(
            {
                "originalSource": frame["source"],
                "approvedPath": relative(approved),
                "approvedSha256": approved_sha,
                "byteIdenticalToOriginalSource": approved.read_bytes() == source.read_bytes(),
                "canvas": canvas,
            }
        )
        approved_entries.append(approved_entry)
        frames.append(approved)

    expected_names = {frame_filename(frame) for frame in motion["frames"]}
    for extra in APPROVED_FRAMES.glob("*.png"):
        if extra.name not in expected_names:
            failures.append(f"unexpected file in approved frame lane: {extra}")

    shutil.copyfile(SELECTED_PREVIEW, APPROVED_AUTHORED_PREVIEW)
    selected_sha = sha256(SELECTED_PREVIEW)
    approved_authored_sha = sha256(APPROVED_AUTHORED_PREVIEW)

    save_mirrored_gif(APPROVED_AUTHORED_PREVIEW, APPROVED_MIRRORED_PREVIEW)

    authored_metrics = gif_metrics(APPROVED_AUTHORED_PREVIEW)
    mirrored_metrics = gif_metrics(APPROVED_MIRRORED_PREVIEW)
    source_hashes_after = {
        source: sha256(Path(source)) for source in source_hashes_before
    }
    source_bytes_unchanged = source_hashes_before == source_hashes_after
    reference_frames = v21_validation["frames"]
    entries_match_motion = len(reference_frames) == len(motion["frames"]) and all(
        reference["frameId"] == frozen["frameId"]
        and reference["sourceSha256"] == frozen["sourceSha256"]
        and reference["exposureTicks"] == frozen["exposureTicks"]
        and reference["attackerRoot"] == frozen["attackerRoot"]
        and reference["victimRoot"] == frozen["victimRoot"]
        for reference, frozen in zip(reference_frames, motion["frames"])
    )

    source_hash_manifest = {
        f"{int(frame['index']):02d}_{frame['frameId']}": frame["sourceSha256"]
        for frame in motion["frames"]
    }
    approval = {
        "schemaVersion": 1,
        "recordId": RECORD,
        "characterId": "swahili",
        "result": "APPROVED_AS_COMMAND_GRAB_MOTION_V1",
        "approvedAt": "2026-07-18",
        "approvedBy": "human_owner",
        "status": "approved_motion",
        "candidateOnly": True,
        "deployable": False,
        "approvedArtworkFrameCount": 24,
        "selectedMotionReference": {
            "speed": 0.8,
            "durationMs": 1720,
            "authoritativeGameplayTiming": False,
            "authoredPreview": relative(APPROVED_AUTHORED_PREVIEW),
            "authoredPreviewSha256": approved_authored_sha,
            "mirroredPreview": relative(APPROVED_MIRRORED_PREVIEW),
            "mirroredPreviewSha256": sha256(APPROVED_MIRRORED_PREVIEW),
        },
        "immutableSourceRoot": relative(APPROVED_FRAMES),
        "immutableSourceHashes": source_hash_manifest,
        "lockedMotionMetadata": relative(MOTION),
        "preservedContracts": [
            "exact approved frame pixels",
            "frame order and exposure spacing metadata",
            "victim trajectory and victim alignment metadata",
            "attacker and victim root paths",
            "canonical rigid scythe geometry",
            "blade flip and axial roll",
            "low scoop and side-switch choreography",
            "airborne release, pistol shot, fall, landing, and recovery",
            "authored and lossless horizontal-mirror behavior",
            "hashes and provenance",
        ],
        "combatTimingStillSeparate": [
            "startup",
            "capture",
            "release",
            "hitstop",
            "recovery",
            "damage",
            "side-switch timing",
            "victim timing",
        ],
        "nextGate": "awaiting_combat_timing_runtime_balance",
        "nextMilestone": "SWAHILI_LOCOMOTION_COMPLETION_V1",
        "blocked": [
            "approved artwork regeneration or repaint",
            "resize, crop, recenter, retime, or reblock",
            "final atlas or package",
            "runtime integration or production roster",
            "legacy game.js changes",
            "push, pull request, or deployment",
        ],
    }

    approved_motion = copy.deepcopy(motion)
    approved_motion.update(
        {
            "record": RECORD,
            "status": "approved_motion",
            "candidateOnly": True,
            "deployable": False,
            "approval": relative(APPROVAL),
            "sourceMotionRecord": relative(V21_MOTION),
            "reviewTimingNonAuthoritative": True,
            "selectedReviewSpeed": 0.8,
            "selectedReviewDurationMs": 1720,
            "combatTimingAuthored": False,
            "frames": approved_entries,
            "finalReviewState": "awaiting_combat_timing_runtime_balance",
        }
    )

    provenance = {
        "schemaVersion": 1,
        "record": RECORD,
        "method": "byte-identical freeze of the human-approved V21 24-frame artwork sequence",
        "sourceMotion": relative(V21_MOTION),
        "sourceValidation": relative(V21_VALIDATION),
        "selectedTimingValidation": relative(V21_TIMING_VALIDATION),
        "imageGenerationUsed": False,
        "sourcePixelsModified": False,
        "approvedPixelsModified": False,
        "sourceFilesCopiedByteIdentically": True,
        "authoredPreviewCopiedByteIdentically": True,
        "mirroredPreviewMethod": "lossless horizontal mirror of the exact V21 review composition at 0.8x",
        "runtimeSourcesModified": False,
        "legacyGameJsModified": False,
        "frameSources": [
            {
                "index": frame["index"],
                "frameId": frame["frameId"],
                "originalSource": frame["source"],
                "originalSha256": frame["sourceSha256"],
                "approvedPath": approved_entries[index]["approvedPath"],
                "approvedSha256": approved_entries[index]["approvedSha256"],
            }
            for index, frame in enumerate(motion["frames"])
        ],
    }

    status = {
        "schemaVersion": 1,
        "record": RECORD,
        "state": "APPROVED_MOTION",
        "candidateOnly": True,
        "deployable": False,
        "approvedArtworkFrozen": True,
        "motionPreviewApprovalGranted": True,
        "combatTimingApprovalGranted": False,
        "runtimeBalanceApprovalGranted": False,
        "runtimeIntegrationAllowed": False,
        "finalPackagingAllowed": False,
        "productionRosterAllowed": False,
        "nextMilestone": "SWAHILI_LOCOMOTION_COMPLETION_V1",
        "nextGate": "awaiting_combat_timing_runtime_balance",
    }

    write_json(APPROVAL, approval)
    write_json(MOTION, approved_motion)
    write_json(PROVENANCE, provenance)
    write_json(STATUS, status)

    LESSONS.write_text(
        "# Swahili Command Grab Motion V1 - Production Lessons\n\n"
        "- Lock the physical action order before polishing connectors.\n"
        "- Preserve approved frames and make additive, candidate-only corrections.\n"
        "- Treat the canonical scythe as a rigid prop; only position, rotation, and approved perspective projection may change.\n"
        "- Sell weapon weight with body load, weapon lag, acceleration spacing, impact compression, and follow-through.\n"
        "- Use the blade path as the motion spine for the scoop, carry, side switch, and release.\n"
        "- Keep victim-root and attacker-root paths explicit so the side switch cannot read as teleportation.\n"
        "- Separate review playback speed from authoritative gameplay timing and balance.\n"
        "- Repair isolated weapon geometry or individual frames without reopening approved body art.\n"
        "- Validate authored and mirrored behavior, frame scrub, hashes, source provenance, and locked runtime boundaries.\n",
        encoding="utf-8",
    )
    OPTIONAL_VFX.write_text(
        "# Optional Presentation Polish - Deferred\n\n"
        "These items are optional future layers and do not reopen motion approval:\n\n"
        "- gold scythe trails\n"
        "- contact and slam bursts\n"
        "- pistol muzzle flash\n"
        "- impact sparks\n"
        "- trailing embers\n\n"
        "They must remain separate from the frozen artwork frames and require their own review.\n",
        encoding="utf-8",
    )

    checks = {
        "v21ValidationPassed": v21_validation["result"]
        == "PASS_FOR_HUMAN_FULL_COMMAND_GRAB_V21_HEAD_DIRECTION_PREVIEW_REVIEW",
        "selectedTimingValidationPassed": timing_validation["result"]
        == "PASS_FOR_HUMAN_V21_0_8X_PREVIEW_REVIEW",
        "all24SourceReferencesPresentAndHashMatch": len(approved_entries) == 24
        and not any("source" in failure for failure in failures),
        "all24ApprovedCopiesAreByteIdentical": len(approved_entries) == 24
        and all(frame["byteIdenticalToOriginalSource"] for frame in approved_entries),
        "all24ApprovedFramesAre1536Rgba": len(approved_entries) == 24
        and all(frame["canvas"] == [1536, 1536, "RGBA"] for frame in approved_entries),
        "sourceFilesRemainUnchanged": source_bytes_unchanged,
        "motionFrameOrderHashesRootsAndSpacingMatchV21": entries_match_motion,
        "attackerRootPathPreserved": approved_motion["attackerRootPathX"]
        == motion["attackerRootPathX"],
        "victimRootPathPreserved": approved_motion["victimRootPathX"]
        == motion["victimRootPathX"],
        "oneSideSwitchRootCrossingPreserved": approved_motion["rootCrossings"] == 1,
        "authoredSelectedPreviewHashPreserved": selected_sha
        == approved_authored_sha
        == EXPECTED_SELECTED_PREVIEW_SHA,
        "authoredSelectedPreviewHas24Frames": authored_metrics["frameCount"] == 24,
        "authoredSelectedPreviewIs1720Ms": authored_metrics["durationMs"] == 1720,
        "mirroredPreviewHasMatchingFrameCountAndDuration": mirrored_metrics["frameCount"]
        == authored_metrics["frameCount"]
        and mirrored_metrics["durationMs"] == authored_metrics["durationMs"],
        "reviewTimingExplicitlyNonAuthoritative": approval["selectedMotionReference"][
            "authoritativeGameplayTiming"
        ]
        is False
        and approved_motion["reviewTimingNonAuthoritative"] is True,
        "combatTimingAndRuntimeBalanceRemainUnapproved": approved_motion[
            "combatTimingAuthored"
        ]
        is False
        and status["combatTimingApprovalGranted"] is False
        and status["runtimeBalanceApprovalGranted"] is False,
        "candidateOnlyAndNotDeployable": status["candidateOnly"] is True
        and status["deployable"] is False,
        "legacyGameJsHashUnchanged": sha256(GAME_JS) == EXPECTED_GAME_JS_SHA,
        "noImageGenerationOrSourceRegeneration": provenance["imageGenerationUsed"] is False
        and provenance["sourcePixelsModified"] is False,
        "runtimeIntegrationNotPerformed": provenance["runtimeSourcesModified"] is False,
        "finalPackagingNotAllowed": status["finalPackagingAllowed"] is False,
    }
    failed_checks = [name for name, passed in checks.items() if passed is not True]
    failures.extend(failed_checks)
    validation = {
        "schemaVersion": 1,
        "record": RECORD,
        "result": "PASS_APPROVED_MOTION_FREEZE" if not failures else "FAIL_APPROVED_MOTION_FREEZE",
        "status": "approved_motion" if not failures else "freeze_failed",
        "candidateOnly": True,
        "deployable": False,
        "frameCount": len(approved_entries),
        "selectedReviewSpeed": 0.8,
        "selectedReviewDurationMs": authored_metrics["durationMs"],
        "selectedAuthoredPreviewSha256": approved_authored_sha,
        "selectedMirroredPreviewSha256": sha256(APPROVED_MIRRORED_PREVIEW),
        "checks": checks,
        "failedChecks": failures,
        "approvedFrames": [
            {
                "index": frame["index"],
                "frameId": frame["frameId"],
                "approvedPath": frame["approvedPath"],
                "sha256": frame["approvedSha256"],
            }
            for frame in approved_entries
        ],
        "nextMilestone": "SWAHILI_LOCOMOTION_COMPLETION_V1",
        "nextGate": "awaiting_combat_timing_runtime_balance",
    }
    write_json(VALIDATION, validation)
    if failures:
        raise RuntimeError(f"Command-grab motion V1 freeze failed: {failures}")

    print(json.dumps(validation, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
