"""Đóng gói bản Linux; nhận bản qua SSH và chuyển bản chạy theo manifest."""

import argparse
import io
import json
import os
from pathlib import Path, PurePosixPath
import posixpath
import re
import shutil
import subprocess
import sys
import tarfile
import tempfile
import time
import urllib.request

RELEASE_PATTERN = re.compile(r"([0-9a-f]{40})-[0-9]{1,20}-[0-9]{1,5}\Z")
PREFIXES = ("backend/dist/", "backend/node_modules/", "frontend/dist/")
FILES = {
    "backend/package.json", "backend/package-lock.json",
    "backend/scripts/kiem-tra-cau-truc.js", "doan4_daugia_tieng_viet.sql",
    "deploy/chay-alwaysdata.cjs", "deploy/quan-ly-phat-hanh.cjs",
    "deploy/khoi-tao-mysql.cjs", "deploy/kiem-tra-websocket.cjs", "release.json",
}
MAX_ARCHIVE = 128 * 1024 * 1024
MAX_CONTENT = 400 * 1024 * 1024
MAX_FILES = 15000


def allowed(name):
    parts = PurePosixPath(name).parts
    return (
        bool(parts) and not name.startswith("/") and "\\" not in name
        and all(p not in ("..", ".git", ".local") and not p.startswith(".env") for p in parts)
        and (name in FILES or any(name.startswith(p) for p in PREFIXES))
    )


def check_members(members):
    seen = set()
    size = 0
    for member in members:
        if len(seen) >= MAX_FILES or member.name in seen or not allowed(member.name):
            raise ValueError("ARCHIVE_PATH_REJECTED")
        seen.add(member.name)
        size += member.size
        if size > MAX_CONTENT or not (member.isfile() or member.isdir() or member.issym()):
            raise ValueError("ARCHIVE_TYPE_OR_SIZE_REJECTED")
        if member.issym():
            target = posixpath.normpath(posixpath.join(posixpath.dirname(member.name), member.linkname))
            if (member.linkname.startswith("/") or "\\" in member.linkname
                    or not member.name.startswith("backend/node_modules/")
                    or not target.startswith("backend/node_modules/")):
                raise ValueError("ARCHIVE_LINK_REJECTED")


def add_json(archive, name, value):
    data = json.dumps(value).encode()
    member = tarfile.TarInfo(name)
    member.size = len(data)
    member.mode = 0o644
    archive.addfile(member, io.BytesIO(data))


def pack(root, output, sha, run_id, attempt):
    release = f"{sha}-{run_id}-{attempt}"
    if not RELEASE_PATTERN.fullmatch(release):
        raise ValueError("INVALID_RELEASE_ID")
    required = ["backend/dist/may-chu.js", "frontend/dist/index.html", "backend/node_modules/mysql2/package.json"]
    if any(not (root / p).is_file() for p in required):
        raise ValueError("BUILD_OR_DEPENDENCIES_MISSING")
    with tarfile.open(output, "w:gz", compresslevel=6) as archive:
        for name in sorted(FILES - {"release.json"}):
            archive.add(root / name, arcname=name, recursive=False)
        for prefix in PREFIXES:
            for source in sorted((root / prefix).rglob("*")):
                name = source.relative_to(root).as_posix()
                if (not allowed(name) or name == 'frontend/dist/version.json'
                        or source.is_dir() and not source.is_symlink()):
                    continue
                member = archive.gettarinfo(str(source), arcname=name)
                if member.islnk():
                    member.type = tarfile.REGTYPE
                    member.size = source.stat().st_size
                if member.isfile():
                    with source.open("rb") as file:
                        archive.addfile(member, file)
                else:
                    archive.addfile(member)
        manifest = {"format": 1, "release": release, "sha": sha}
        add_json(archive, "release.json", manifest)
        # Gắn phiên bản vào chính gói build, không sửa tệp nguồn của frontend.
        add_json(archive, "frontend/dist/version.json", {"sha": sha})
    if output.stat().st_size > MAX_ARCHIVE:
        raise ValueError("ARCHIVE_TOO_LARGE")
    with tarfile.open(output) as archive:
        check_members(archive.getmembers())
    print(f"PACKED {release} {output.stat().st_size} bytes")


def atomic_json(target, value):
    temporary = target.with_name(target.name + ".pending")
    try:
        with temporary.open("x", encoding="utf-8") as file:
            json.dump(value, file)
            file.flush()
            os.fsync(file.fileno())
        temporary.chmod(0o600)
        temporary.replace(target)
    finally:
        temporary.unlink(missing_ok=True)


def healthy(origin, sha, attempts=90):
    for _ in range(attempts):
        try:
            with urllib.request.urlopen(origin + "/api/health", timeout=5) as response:
                data = json.load(response)["data"]
            if data.get("database") == "connected" and (not sha or data.get("revision") == sha):
                if sha:
                    with urllib.request.urlopen(origin + "/version.json", timeout=5) as response:
                        if json.load(response).get("sha") != sha:
                            raise ValueError("STALE_FRONTEND")
                return True
        except Exception:
            pass
        time.sleep(1)
    return False


def activate(root, manifest, origin, check=healthy):
    pointer = root / "backend/.local/current-release.json"
    previous = json.loads(pointer.read_text()) if pointer.exists() else None
    atomic_json(pointer, manifest)
    if check(origin, manifest["sha"]):
        return previous
    if previous:
        atomic_json(pointer, previous)
    else:
        pointer.unlink()
    if not check(origin, previous["sha"] if previous else ""):
        raise RuntimeError("DEPLOY_AND_ROLLBACK_FAILED")
    raise RuntimeError("DEPLOY_FAILED_PREVIOUS_RELEASE_RESTORED")


def extract(archive_path, destination):
    with tarfile.open(archive_path) as archive:
        members = archive.getmembers()
        check_members(members)
        for member in members:
            target = destination / member.name
            if not target.resolve().is_relative_to(destination.resolve()):
                raise ValueError("ARCHIVE_ESCAPE_REJECTED")
            target.parent.mkdir(parents=True, exist_ok=True)
            if member.isdir():
                target.mkdir(exist_ok=True)
            elif member.issym():
                target.symlink_to(member.linkname)
            else:
                with archive.extractfile(member) as source, target.open("xb") as output:
                    shutil.copyfileobj(source, output)
                target.chmod(0o755 if member.mode & 0o111 else 0o644)


def receive(root, stream):
    if os.name != "posix":
        raise RuntimeError("LINUX_REQUIRED")
    import fcntl
    private = root / "backend/.local"
    releases = root / ".releases"
    incoming = root / ".incoming"
    os.umask(0o077)
    releases.mkdir(exist_ok=True)
    incoming.mkdir(exist_ok=True)
    # Thư mục mới do công cụ quản lý; không trộn với dữ liệu người dùng.
    with (private / "deploy.lock").open("a") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        with tempfile.TemporaryDirectory(dir=incoming) as temporary:
            staging = Path(temporary)
            archive_path = staging / "release.tar.gz"
            total = 0
            with archive_path.open("xb") as output:
                while chunk := stream.read(1024 * 1024):
                    total += len(chunk)
                    if total > MAX_ARCHIVE:
                        raise ValueError("ARCHIVE_TOO_LARGE")
                    output.write(chunk)
            candidate = staging / "candidate"
            candidate.mkdir()
            extract(archive_path, candidate)
            manifest = json.loads((candidate / "release.json").read_text())
            match = RELEASE_PATTERN.fullmatch(manifest.get("release", ""))
            if not match or manifest.get("sha") != match[1] or manifest.get("format") != 1:
                raise ValueError("INVALID_RELEASE_MANIFEST")
            destination = releases / manifest["release"]
            if destination.exists():
                raise ValueError("RELEASE_ALREADY_EXISTS")
            env = {**os.environ, "VIETBID_SHARED_ROOT": str(root), "NODE_OPTIONS": "--max-old-space-size=80"}
            subprocess.run(["node", "-e", 'require("./backend/node_modules/sharp");require("./backend/node_modules/bcrypt")'],
                           cwd=candidate, env=env, check=True, timeout=30)
            subprocess.run(["node", "deploy/chay-alwaysdata.cjs", "--check-schema"],
                           cwd=candidate, env=env, check=True, timeout=30)
            candidate.rename(destination)
            config = json.loads((private / "alwaysdata.json").read_text())
            origin = config["FRONTEND_URL"].rstrip("/")
            if not re.fullmatch(r"https://[a-zA-Z0-9.-]+", origin):
                raise ValueError("INVALID_PUBLIC_ORIGIN")
            def verify(public_origin, sha):
                if not healthy(public_origin, sha):
                    return False
                try:
                    result = subprocess.run(
                        ["node", str(root / "deploy/kiem-tra-websocket.cjs"), public_origin],
                        env=env, timeout=15,
                    )
                    return result.returncode == 0
                except subprocess.TimeoutExpired:
                    return False
            previous = activate(root, manifest, origin, verify)
            keep = {manifest["release"], previous["release"] if previous else ""}
            for old in releases.iterdir():
                if (old.name not in keep and RELEASE_PATTERN.fullmatch(old.name)
                        and old.is_dir() and not old.is_symlink()
                        and old.resolve().parent == releases.resolve()):
                    shutil.rmtree(old)
            print(f"DEPLOYED {manifest['sha']}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=["pack", "receive"])
    parser.add_argument("--sha")
    parser.add_argument("--run-id", default="1")
    parser.add_argument("--attempt", default="1")
    parser.add_argument("--output", type=Path, default=Path("vietbid-release.tar.gz"))
    args = parser.parse_args()
    try:
        root = Path(__file__).resolve().parent.parent
        if args.command == "pack":
            pack(root, args.output, args.sha, args.run_id, args.attempt)
        else:
            receive(root, sys.stdin.buffer)
    except Exception as error:
        # Không ghi cấu hình riêng, môi trường hoặc thông tin đăng nhập.
        code = str(error) if isinstance(error, (ValueError, RuntimeError)) else type(error).__name__
        print(f"DEPLOY_ERROR {code}", file=sys.stderr)
        sys.exit(1)
