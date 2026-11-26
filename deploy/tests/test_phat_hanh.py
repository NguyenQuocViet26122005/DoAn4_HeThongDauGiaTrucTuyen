import contextlib
import importlib.util
import io
import json
from pathlib import Path
import tarfile
import tempfile
import unittest

spec = importlib.util.spec_from_file_location("phat_hanh", Path(__file__).resolve().parents[1] / "phat_hanh.py")
deploy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(deploy)
SHA = "a" * 40
MANIFEST = {"format": 1, "release": SHA + "-1-1", "sha": SHA}


class DeploymentTests(unittest.TestCase):
    def test_archive_rejects_unsafe_paths_and_duplicate_files(self):
        for name in ("../data", "/etc/passwd", "backend/.local/alwaysdata.json", "backend/dist/.env", "frontend/dist/../../x"):
            with self.subTest(name=name), self.assertRaises(ValueError):
                deploy.check_members([tarfile.TarInfo(name)])
        entry = tarfile.TarInfo("backend/dist/app.js")
        with self.assertRaises(ValueError):
            deploy.check_members([entry, entry])

    def test_archive_rejects_escaping_links_and_special_files(self):
        entry = tarfile.TarInfo("backend/node_modules/.bin/x")
        entry.type = tarfile.SYMTYPE
        entry.linkname = "../../../.local/alwaysdata.json"
        with self.assertRaises(ValueError): deploy.check_members([entry])
        entry.linkname = "../package/bin.js"
        deploy.check_members([entry])
        entry.type = tarfile.LNKTYPE
        with self.assertRaises(ValueError): deploy.check_members([entry])
        entry.type = tarfile.REGTYPE
        entry.size = deploy.MAX_CONTENT + 1
        with self.assertRaises(ValueError): deploy.check_members([entry])

    def test_pack_excludes_private_files_and_extracts_version(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            files = set(deploy.FILES) - {"release.json"}
            files.update(["backend/dist/may-chu.js", "frontend/dist/index.html", "frontend/dist/version.json",
                          "backend/node_modules/mysql2/package.json", "backend/node_modules/example/.env"])
            for name in files:
                target = root / name
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text("fixture")
            secret = root / "backend/.local/alwaysdata.json"
            secret.parent.mkdir(parents=True)
            secret.write_text("private")
            output = root / "release.tar.gz"
            with contextlib.redirect_stdout(io.StringIO()): deploy.pack(root, output, SHA, "1", "1")
            target = root / "unpacked"
            target.mkdir()
            deploy.extract(output, target)
            self.assertEqual(json.loads((target / "frontend/dist/version.json").read_text())["sha"], SHA)
            self.assertFalse((target / "backend/.local").exists())
            self.assertFalse((target / "backend/node_modules/example/.env").exists())
            # Swagger đọc tệp này ngay khi nạp ứng dụng, dù không mở trang tài liệu.
            self.assertEqual(
                (target / "backend/docs/doan4-dau-gia.postman_collection.json").read_text(),
                "fixture",
            )

    def test_rollback_restores_previous_pointer_on_failed_health(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            pointer = root / "backend/.local/current-release.json"
            pointer.parent.mkdir(parents=True)
            old = {"format": 1, "release": "b" * 40 + "-1-1", "sha": "b" * 40}
            deploy.atomic_json(pointer, old)
            seen = []
            def check(origin, sha):
                seen.append(sha)
                return sha == old["sha"]
            with self.assertRaisesRegex(RuntimeError, "PREVIOUS_RELEASE_RESTORED"):
                deploy.activate(root, MANIFEST, "https://example.test", check)
            self.assertEqual(json.loads(pointer.read_text()), old)
            self.assertEqual(seen, [SHA, old["sha"]])

    def test_rollback_to_legacy_removes_only_created_pointer(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            pointer = root / "backend/.local/current-release.json"
            pointer.parent.mkdir(parents=True)
            preserved = pointer.parent / "alwaysdata.json"
            preserved.write_text("private fixture")
            with self.assertRaisesRegex(RuntimeError, "PREVIOUS_RELEASE_RESTORED"):
                deploy.activate(root, MANIFEST, "https://example.test", lambda origin, sha: not sha)
            self.assertFalse(pointer.exists())
            self.assertEqual(preserved.read_text(), "private fixture")


if __name__ == "__main__": unittest.main()
