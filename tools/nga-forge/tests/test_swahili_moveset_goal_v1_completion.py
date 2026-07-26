import hashlib
import json
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]
SWAHILI_ROOT = REPO_ROOT / "tools" / "nga-forge" / "production" / "characters" / "swahili"
FINAL_MATRIX = SWAHILI_ROOT / "coverage" / "swahili-moveset-goal-v1.final.matrix.json"
CONCEPTS = SWAHILI_ROOT / "design" / "swahili-moveset-goal-v1.combat-concepts.json"
REVERSAL_KIT = (
    SWAHILI_ROOT
    / "manual-paintover-kits"
    / "moveset-goal-v1-reversals"
    / "reversal-manual-action-kit.json"
)
BACKWARD_MANIFEST = (
    SWAHILI_ROOT
    / "manual-paintover-kits"
    / "walk-backward-motion-v2"
    / "manual-paintover-kits.manifest.json"
)
REVIEW_QUEUE = SWAHILI_ROOT / "reviews" / "swahili-moveset-goal-v1" / "human-review-queue.json"
LEGACY_GAME_JS = REPO_ROOT / "NO_GODS_ABOVE" / "game.js"
LEGACY_SHA256 = "D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B"


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest().upper()


class SwahiliMovesetGoalV1CompletionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.matrix = read_json(FINAL_MATRIX)
        cls.concepts = read_json(CONCEPTS)
        cls.reversal = read_json(REVERSAL_KIT)
        cls.backward_manifest = read_json(BACKWARD_MANIFEST)
        cls.queue = read_json(REVIEW_QUEUE)
        cls.entries = {entry["animationId"]: entry for entry in cls.matrix["entries"]}

    def test_final_matrix_has_all_84_unique_states_and_no_missing(self):
        self.assertEqual(self.matrix["entryCount"], 84)
        self.assertEqual(len(self.entries), 84)
        self.assertEqual(self.matrix["silentMissingCount"], 0)
        self.assertNotIn("missing", self.matrix["statusCounts"])
        self.assertTrue(all(entry["finalStopEligible"] for entry in self.matrix["entries"]))

    def test_every_entry_has_an_allowed_final_stop_category(self):
        allowed = {
            "approved_production_baseline",
            "human_review_ready_candidate",
            "human_review_ready_combat_design_candidate",
            "blocked_manual_art_complete_kit",
            "not_applicable",
        }
        actual = {entry["finalCategory"] for entry in self.matrix["entries"]}
        self.assertEqual(actual, allowed)
        self.assertEqual(
            self.matrix["finalCategoryCounts"],
            {
                "approved_production_baseline": 33,
                "blocked_manual_art_complete_kit": 3,
                "human_review_ready_candidate": 10,
                "human_review_ready_combat_design_candidate": 32,
                "not_applicable": 6,
            },
        )

    def test_all_32_combat_design_items_have_review_ready_contracts(self):
        concept_by_id = {item["animationId"]: item for item in self.concepts["concepts"]}
        self.assertEqual(len(concept_by_id), 32)
        matrix_design_ids = {
            entry["animationId"]
            for entry in self.matrix["entries"]
            if entry["currentStatus"] == "blocked_combat_design"
        }
        self.assertEqual(set(concept_by_id), matrix_design_ids)
        for animation_id, item in concept_by_id.items():
            self.assertEqual(item["productionState"], "awaiting_human_move_concept_review")
            self.assertEqual(item["finalCategory"], "human_review_ready_combat_design_candidate")
            self.assertFalse(item["artworkGenerated"], animation_id)
            self.assertFalse(item["timingAuthoritative"], animation_id)
            self.assertFalse(item["sandboxIntegrated"], animation_id)
            self.assertTrue(item["candidateOnly"], animation_id)
            self.assertFalse(item["deployable"], animation_id)
            self.assertGreaterEqual(len(item["keyPoseDirectionCandidate"]), 3, animation_id)
            self.assertGreaterEqual(len(item["phaseRequirements"]), 3, animation_id)

    def test_five_special_families_have_intentional_lmh_variants(self):
        special_records = [
            item for item in self.concepts["concepts"] if item["group"] == "core_special_families"
        ]
        self.assertEqual(len(special_records), 15)
        families = {}
        for item in special_records:
            family = "_".join(item["animationId"].split("_")[:-1])
            strength = item["animationId"].split("_")[-1]
            families.setdefault(family, {})[strength] = item
            self.assertIsNotNone(item["variantDeltaCandidate"])
            self.assertNotEqual(
                item["variantDeltaCandidate"]["intentionalDifference"],
                "uniform_duration_or_range",
            )
        self.assertEqual(
            set(families),
            {"special_neutral", "special_backward", "special_forward", "special_up", "special_down"},
        )
        for variants in families.values():
            self.assertEqual(set(variants), {"light", "medium", "heavy"})
            descriptions = {
                item["variantDeltaCandidate"]["intentionalDifference"] for item in variants.values()
            }
            self.assertEqual(len(descriptions), 3)

    def test_both_reversals_are_manual_blockers_with_complete_verified_dependency_kit(self):
        self.assertEqual(self.reversal["status"], "BLOCKED_MANUAL_ART_COMPLETE_DEPENDENCY_KIT")
        self.assertFalse(self.reversal["automatedGenerationRetriesAllowed"])
        self.assertEqual(
            {item["animationId"] for item in self.reversal["reversals"]},
            {"forward_to_backward_reversal", "backward_to_forward_reversal"},
        )
        for animation_id in ("forward_to_backward_reversal", "backward_to_forward_reversal"):
            entry = self.entries[animation_id]
            self.assertEqual(entry["currentStatus"], "blocked_manual_art")
            self.assertEqual(entry["finalCategory"], "blocked_manual_art_complete_kit")
            self.assertIn("reversal-manual-action-kit.json", " ".join(entry["evidence"]))
        verified = 0
        for role in self.backward_manifest["roles"]:
            role_root = BACKWARD_MANIFEST.parent / role["frameId"]
            for file_record in role["files"]:
                path = role_root / file_record["path"]
                self.assertTrue(path.is_file(), path)
                self.assertEqual(digest(path), file_record["sha256"].upper(), path)
                verified += 1
        self.assertEqual(verified, self.reversal["blockingDependency"]["verifiedReferencedFileCount"])
        self.assertEqual(verified, 54)

    def test_review_queue_groups_every_human_or_manual_decision(self):
        self.assertEqual(self.queue["status"], "ready_for_grouped_human_review")
        self.assertEqual(self.queue["itemCount"], 45)
        queued = {
            item["animationId"] for group in self.queue["groups"] for item in group["items"]
        }
        expected = {
            entry["animationId"]
            for entry in self.matrix["entries"]
            if entry["finalCategory"]
            in {
                "human_review_ready_candidate",
                "human_review_ready_combat_design_candidate",
                "blocked_manual_art_complete_kit",
            }
        }
        self.assertEqual(queued, expected)

    def test_candidate_and_roster_boundaries_remain_closed(self):
        self.assertTrue(self.matrix["candidateOnly"])
        self.assertFalse(self.matrix["deployable"])
        self.assertFalse(self.matrix["productionRoster"])
        self.assertTrue(self.concepts["candidateOnly"])
        self.assertFalse(self.concepts["deployable"])
        self.assertFalse(self.concepts["productionRoster"])
        self.assertEqual(digest(LEGACY_GAME_JS), LEGACY_SHA256)


if __name__ == "__main__":
    unittest.main()
