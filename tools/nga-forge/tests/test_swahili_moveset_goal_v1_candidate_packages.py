import hashlib
import json
import unittest
from pathlib import Path

from PIL import Image, ImageChops


REPO_ROOT = Path(__file__).resolve().parents[3]
ENGINE_ROOT = REPO_ROOT / "NO_GODS_ABOVE" / "engine_v2"
CONTENT_ROOT = ENGINE_ROOT / "content-source" / "characters" / "swahili-goal-v1"
BUNDLE = CONTENT_ROOT / "character.bundle.json"
COMPILED_MANIFEST = (
    ENGINE_ROOT / "generated" / "manifests" / "swahili_moveset_goal_v1.candidate.runtime.json"
)
SWAHILI_ROOT = REPO_ROOT / "tools" / "nga-forge" / "production" / "characters" / "swahili"
PACKAGE_ROOT = SWAHILI_ROOT / "packages" / "moveset-goal-v1"
OPERATION_STATUS = PACKAGE_ROOT / "operation-status.json"
FINAL_MATRIX = SWAHILI_ROOT / "coverage" / "swahili-moveset-goal-v1.final.matrix.json"
HASH_LOCK = SWAHILI_ROOT / "freeze" / "swahili-moveset-goal-v1.baseline.hash-lock.json"
LEGACY_GAME_JS = REPO_ROOT / "NO_GODS_ABOVE" / "game.js"
LEGACY_SHA256 = "D081DA2D907CF6ABD978301C1637008B26CCB30B47E2CCAFCA3FEA3331910C6B"


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest().upper()


def resolve_repo_uri(uri: str) -> Path:
    if not uri.startswith("repo://"):
        raise AssertionError(f"not a repo URI: {uri}")
    path = (REPO_ROOT / uri[len("repo://") :]).resolve()
    path.relative_to(REPO_ROOT.resolve())
    return path


class SwahiliMovesetGoalV1CandidatePackageTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.bundle = read_json(BUNDLE)
        cls.compiled = read_json(COMPILED_MANIFEST)
        cls.status = read_json(OPERATION_STATUS)
        cls.matrix = read_json(FINAL_MATRIX)
        cls.hash_lock = read_json(HASH_LOCK)
        cls.package_paths = [
            (CONTENT_ROOT / relative).resolve() for relative in cls.bundle["animationPackages"]
        ]
        cls.packages = {read_json(path)["id"]: read_json(path) for path in cls.package_paths}

    def test_operation_is_candidate_only_and_complete(self):
        self.assertEqual(
            self.status["status"], "PASS_CANDIDATE_PACKAGES_AND_FAMILY_ATLASES"
        )
        self.assertTrue(self.status["candidateOnly"])
        self.assertFalse(self.status["deployable"])
        self.assertFalse(self.status["productionRoster"])
        self.assertTrue(self.status["isolatedSandboxOnly"])
        self.assertFalse(self.status["finalShippingAtlasBuilt"])
        self.assertEqual(self.status["animationPackageCount"], 25)
        self.assertEqual(self.status["newGoalPackageCount"], 18)
        self.assertEqual(self.status["reusedExistingPackageCount"], 7)
        self.assertEqual(self.status["atlasPageCount"], 13)
        self.assertEqual(self.status["uniqueSourceAssetCount"], 131)

    def test_bundle_and_compiled_manifest_keep_roster_boundary_closed(self):
        self.assertEqual(self.bundle["id"], "swahili_goal_v1")
        self.assertEqual(self.bundle["promotionState"], "candidate")
        self.assertTrue(self.bundle["runtimeProfile"]["candidateOnly"])
        self.assertFalse(self.bundle["runtimeProfile"]["deployable"])
        self.assertFalse(self.bundle["runtimeProfile"]["productionRoster"])
        self.assertEqual(len(self.bundle["animationPackages"]), 25)
        self.assertEqual(len(self.packages), 25)
        self.assertTrue(all(".." not in Path(item).parts for item in self.bundle["animationPackages"]))
        for path in self.package_paths:
            path.relative_to(CONTENT_ROOT.resolve())
        self.assertEqual(self.compiled["fighterId"], "swahili_goal_v1")
        self.assertFalse(self.compiled["deployable"])
        self.assertEqual(len(self.compiled["animations"]), 25)
        self.assertEqual(self.compiled["sourceDigest"], self.status["compilerSourceDigest"])
        self.assertEqual(digest(BUNDLE), self.status["bundleSha256"])
        self.assertEqual(digest(COMPILED_MANIFEST), self.status["compiledManifestSha256"])

    def test_current_command_grab_replaces_stale_package(self):
        stale = self.status["staleCommandGrabPackageExcluded"]
        self.assertNotIn(stale, self.bundle["animationPackages"])
        self.assertNotIn("command_grab", self.packages)
        current = self.packages["command_grab_v2"]
        self.assertEqual(current["simulationLength"], 107)
        self.assertEqual(len(current["exposures"]), 24)
        self.assertEqual(len(current["sourceFrames"]), 30)
        self.assertEqual(len(current["goalV1Extension"]["victimFrames"]), 6)
        self.assertEqual(sum(item["duration"] for item in current["exposures"]), 107)
        self.assertEqual(current["promotionState"], "candidate")

    def test_reused_package_manifests_are_byte_identical(self):
        records = self.status["reusedExistingPackages"]
        self.assertEqual(len(records), 7)
        for record in records:
            source = REPO_ROOT / record["source"]
            candidate = REPO_ROOT / record["candidateCopy"]
            self.assertTrue(record["byteIdentical"], record["packageId"])
            self.assertEqual(source.read_bytes(), candidate.read_bytes(), record["packageId"])
            self.assertEqual(digest(source), record["sourceSha256"], record["packageId"])
            self.assertEqual(digest(candidate), record["candidateCopySha256"], record["packageId"])

    def test_every_package_source_hash_is_current(self):
        checked = 0
        for package_id, package in self.packages.items():
            for frame in package["sourceFrames"]:
                path = resolve_repo_uri(frame["sourceUri"])
                self.assertTrue(path.is_file(), f"{package_id}: {path}")
                self.assertEqual(digest(path), frame["sha256"], f"{package_id}: {frame['id']}")
                self.assertEqual((frame["width"], frame["height"]), (1536, 1536))
                checked += 1
        self.assertGreater(checked, 131)

    def test_family_atlases_are_lossless_and_explicitly_trimmed(self):
        family_records = self.status["atlasFamilies"]
        self.assertEqual(len(family_records), 6)
        for family_record in family_records:
            manifest_path = REPO_ROOT / family_record["manifestPath"]
            manifest = read_json(manifest_path)
            self.assertEqual(digest(manifest_path), family_record["manifestSha256"])
            self.assertTrue(manifest["candidateOnly"])
            self.assertFalse(manifest["deployable"])
            self.assertFalse(manifest["finalShippingAtlas"])
            self.assertEqual(manifest["packing"]["extrudePixels"], 1)
            self.assertTrue(manifest["packing"]["explicitSourceBounds"])
            self.assertTrue(manifest["packing"]["anchorOffsetsPreserved"])
            self.assertTrue(manifest["validation"]["pixelExactReconstruction"])
            self.assertEqual(manifest["validation"]["reconstructionMismatches"], [])
            pages = {}
            try:
                for page_record in manifest["pages"]:
                    page_path = REPO_ROOT / page_record["path"]
                    self.assertEqual(digest(page_path), page_record["sha256"])
                    pages[page_record["pageIndex"]] = Image.open(page_path).convert("RGBA")
                for asset_id, frame in manifest["frames"].items():
                    source_path = resolve_repo_uri(frame["sourceUri"])
                    with Image.open(source_path) as source_image:
                        source = source_image.convert("RGBA")
                    bounds = frame["sourceBounds"]
                    expected_bounds = (
                        bounds["x"],
                        bounds["y"],
                        bounds["x"] + bounds["width"],
                        bounds["y"] + bounds["height"],
                    )
                    self.assertEqual(source.getchannel("A").getbbox(), expected_bounds, asset_id)
                    region = frame["region"]
                    actual = pages[frame["pageIndex"]].crop(
                        (
                            region["x"],
                            region["y"],
                            region["x"] + region["width"],
                            region["y"] + region["height"],
                        )
                    )
                    expected = source.crop(expected_bounds)
                    self.assertIsNone(ImageChops.difference(actual, expected).getbbox(), asset_id)
            finally:
                for page in pages.values():
                    page.close()

    def test_alpha_audit_and_rigid_prop_guards_are_explicit(self):
        alpha = self.status["alphaAudit"]
        self.assertEqual(alpha["sourceCount"], 131)
        self.assertEqual(alpha["failureCount"], 0)
        self.assertEqual(alpha["failures"], [])
        for uri, record in alpha["records"].items():
            self.assertTrue(record["pass"], uri)
            self.assertEqual(record["mode"], "RGBA", uri)
            self.assertEqual(record["canvas"], [1536, 1536], uri)
            self.assertEqual(record["transparentCornerAlpha"], [0, 0, 0, 0], uri)
            self.assertEqual(record["nearKeyMagentaPixelCount"], 0, uri)
            self.assertEqual(record["nearKeyGreenPixelCount"], 0, uri)
            self.assertLessEqual(
                record["magentaPurpleResiduePixelCount"],
                record["isolatedBroadHueTolerancePixels"],
                uri,
            )
            self.assertLessEqual(
                record["greenKeyResiduePixelCount"],
                record["isolatedBroadHueTolerancePixels"],
                uri,
            )
        self.assertIn("pistol_mutation", self.bundle["design"]["forbiddenMutations"])
        self.assertIn("scythe_mutation", self.bundle["design"]["forbiddenMutations"])

    def test_matrix_and_protected_hash_lock_remain_closed(self):
        self.assertEqual(self.matrix["entryCount"], 84)
        self.assertEqual(self.matrix["silentMissingCount"], 0)
        entries = {entry["animationId"]: entry for entry in self.matrix["entries"]}
        self.assertEqual(
            entries["walk_backward"]["packageStatus"], "not_eligible_manual_art_blocker"
        )
        self.assertEqual(
            entries["standing_medium"]["packageStatus"],
            "not_eligible_before_key_pose_and_motion_approval",
        )
        self.assertEqual(entries["command_grab"]["packageStatus"], "candidate_package_compiled")
        self.assertEqual(self.status["protectedHashLock"]["mismatchCount"], 0)
        self.assertEqual(
            self.status["protectedHashLock"]["protectedDigestSha256"],
            self.hash_lock["protectedDigestSha256"],
        )
        for record in self.hash_lock["files"]:
            self.assertEqual(digest(REPO_ROOT / record["path"]), record["sha256"], record["path"])
        self.assertEqual(digest(LEGACY_GAME_JS), LEGACY_SHA256)
        self.assertEqual(self.status["legacyGameJsSha256"], LEGACY_SHA256)


if __name__ == "__main__":
    unittest.main()
