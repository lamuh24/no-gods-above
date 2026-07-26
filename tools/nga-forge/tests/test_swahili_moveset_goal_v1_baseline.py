from __future__ import annotations

import hashlib
import json
import unittest
from collections import Counter
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]
SWAHILI_ROOT = REPO_ROOT / "tools" / "nga-forge" / "production" / "characters" / "swahili"
MATRIX_PATH = SWAHILI_ROOT / "coverage" / "swahili-moveset-goal-v1.matrix.json"
BACKLOG_PATH = SWAHILI_ROOT / "backlog" / "swahili-moveset-goal-v1.dependency-ordered.json"
HASH_LOCK_PATH = SWAHILI_ROOT / "freeze" / "swahili-moveset-goal-v1.baseline.hash-lock.json"
REPORT_PATH = SWAHILI_ROOT / "reports" / "swahili-moveset-goal-v1" / "milestone-0-baseline-report.json"
LEGACY_GAME_JS_SHA256 = "D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B"


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest().upper()


class SwahiliMovesetGoalV1BaselineTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.matrix = load_json(MATRIX_PATH)
        cls.backlog = load_json(BACKLOG_PATH)
        cls.hash_lock = load_json(HASH_LOCK_PATH)
        cls.report = load_json(REPORT_PATH)
        cls.entries = {
            entry["animationId"]: entry for entry in cls.matrix["entries"]
        }

    def test_matrix_has_complete_unique_classified_surface(self) -> None:
        entries = self.matrix["entries"]
        self.assertEqual(self.matrix["entryCount"], 84)
        self.assertEqual(len(entries), 84)
        self.assertEqual(len(self.entries), 84)
        self.assertEqual(
            self.matrix["statusCounts"],
            dict(sorted(Counter(entry["currentStatus"] for entry in entries).items())),
        )
        allowed = set(self.matrix["allowedStatuses"])
        self.assertTrue(all(entry["currentStatus"] in allowed for entry in entries))
        self.assertTrue(all(entry["gate"] for entry in entries))
        self.assertTrue(all(entry["candidateOnly"] for entry in entries))
        self.assertTrue(all(not entry["deployable"] for entry in entries))
        self.assertTrue(all(not entry["productionRoster"] for entry in entries))

    def test_serious_playable_normal_and_special_counts_are_exact(self) -> None:
        normal_ids = {
            "standing_light",
            "standing_medium",
            "standing_heavy",
            "crouching_light",
            "crouching_medium",
            "crouching_heavy",
            "forward_normal_light",
            "forward_normal_medium",
            "forward_normal_heavy",
            "backward_normal_light",
            "backward_normal_medium",
            "backward_normal_heavy",
            "air_light",
            "air_medium",
            "air_heavy",
        }
        special_ids = {
            f"special_{direction}_{strength}"
            for direction in ["neutral", "forward", "backward", "down", "up"]
            for strength in ["light", "medium", "heavy"]
        }
        self.assertEqual(normal_ids & self.entries.keys(), normal_ids)
        self.assertEqual(special_ids & self.entries.keys(), special_ids)
        self.assertEqual(len(normal_ids), 15)
        self.assertEqual(len(special_ids), 15)

    def test_current_approval_and_review_states_are_not_stale(self) -> None:
        expected = {
            "standing_light": "approved_motion",
            "standing_medium": "candidate_key_poses",
            "standing_heavy": "approved_motion",
            "crouching_light": "approved_motion",
            "crouching_medium": "candidate_motion",
            "crouching_heavy": "candidate_motion",
            "jump_anticipation": "approved_motion",
            "soft_landing": "approved_motion",
            "launch_reaction": "approved_motion",
            "neutral_get_up": "approved_motion",
            "command_grab": "approved_motion",
            "walk_backward": "blocked_manual_art",
            "forward_to_backward_reversal": "missing",
            "throw_tech": "blocked_combat_design",
        }
        for animation_id, status in expected.items():
            self.assertEqual(
                self.entries[animation_id]["currentStatus"],
                status,
                animation_id,
            )
        self.assertIn(
            "stale",
            self.entries["command_grab"]["packageStatus"],
        )

    def test_out_of_scope_cinematics_are_explicitly_not_applicable(self) -> None:
        for animation_id in [
            "super",
            "ultimate",
            "intro",
            "victory",
            "round_finisher",
        ]:
            entry = self.entries[animation_id]
            self.assertEqual(entry["currentStatus"], "not_applicable")
            self.assertIn("out_of_scope", entry["gate"])

    def test_every_evidence_path_exists(self) -> None:
        missing: list[str] = []
        for entry in self.matrix["entries"]:
            for relative_path in entry["evidence"]:
                if not (REPO_ROOT / relative_path).is_file():
                    missing.append(f"{entry['animationId']}:{relative_path}")
        self.assertEqual(missing, [])

    def test_hash_lock_matches_every_current_protected_file(self) -> None:
        self.assertEqual(self.hash_lock["recordedHashMismatchCount"], 0)
        self.assertEqual(self.hash_lock["unresolvedRecordedPathCount"], 0)
        self.assertEqual(self.hash_lock["fileCount"], len(self.hash_lock["files"]))
        digest_rows: list[str] = []
        mismatches: list[dict[str, str]] = []
        for record in self.hash_lock["files"]:
            path = REPO_ROOT / record["path"]
            actual = sha256(path)
            digest_rows.append(f"{record['path']}\0{actual}")
            if actual != record["sha256"]:
                mismatches.append(
                    {
                        "path": record["path"],
                        "expected": record["sha256"],
                        "actual": actual,
                    }
                )
        self.assertEqual(mismatches, [])
        protected_digest = hashlib.sha256(
            "\n".join(digest_rows).encode("utf-8")
        ).hexdigest().upper()
        self.assertEqual(
            protected_digest,
            self.hash_lock["protectedDigestSha256"],
        )

    def test_legacy_runtime_and_candidate_boundary_are_locked(self) -> None:
        game_record = next(
            record
            for record in self.hash_lock["files"]
            if record["path"] == "NO_GODS_ABOVE/game.js"
        )
        self.assertEqual(game_record["sha256"], LEGACY_GAME_JS_SHA256)
        self.assertEqual(self.matrix["legacyGameJsSha256"], LEGACY_GAME_JS_SHA256)
        self.assertFalse(self.backlog["deployable"])
        self.assertFalse(self.backlog["productionRoster"])
        self.assertFalse(self.backlog["legacyGameJsMutable"])
        self.assertFalse(self.report["invariants"]["approvedPixelsModified"])
        self.assertFalse(self.report["invariants"]["generationPerformed"])
        self.assertFalse(self.report["invariants"]["packagesPromoted"])
        self.assertFalse(self.report["invariants"]["atlasBuilt"])

    def test_backlog_is_dependency_ordered_through_final_verification(self) -> None:
        phases = self.backlog["phases"]
        self.assertEqual([phase["priority"] for phase in phases], list(range(7)))
        self.assertEqual(phases[0]["milestone"], "baseline_safety")
        self.assertEqual(phases[-1]["milestone"], "final_verification")
        self.assertEqual(
            phases[1]["milestone"],
            "universal_movement_coverage",
        )
        self.assertEqual(phases[2]["milestone"], "normal_attack_coverage")
        self.assertEqual(phases[3]["milestone"], "five_core_special_families")
        self.assertEqual(phases[4]["milestone"], "grabs_throws_and_reactions")
        self.assertEqual(phases[5]["milestone"], "candidate_packaging")


if __name__ == "__main__":
    unittest.main()
