"""Nhận gói cập nhật Android đã ký; không nhận khóa riêng hoặc thực thi gói."""
import base64
import hashlib
import io
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tarfile
import tempfile
import time

ROOT = Path(__file__).resolve().parent.parent
LIMIT = 100 * 1024 * 1024


def receive(stream):
    import fcntl
    os.umask(0o077)
    destination = ROOT / 'backend/.local/mobile-updates'
    destination.mkdir(exist_ok=True)
    with (destination / 'receive.lock').open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        with tempfile.TemporaryDirectory(dir=destination) as tmp:
            staging = Path(tmp)
            archive = staging / 'update.tar.gz'
            size = 0
            with archive.open('xb') as output:
                while chunk := stream.read(1024 * 1024):
                    size += len(chunk)
                    if size > LIMIT: raise ValueError('ARCHIVE_TOO_LARGE')
                    output.write(chunk)
            seen = set()
            total = 0
            with tarfile.open(archive) as package:
                for member in package.getmembers():
                    name = member.name.removeprefix('./')
                    if name in ('.', 'assets') and member.isdir(): continue
                    if (not member.isfile() or name in seen or len(seen) >= 1500
                            or not (name == 'manifest.json' or re.fullmatch(r'assets/[a-f0-9]{64}', name))):
                        raise ValueError('ARCHIVE_REJECTED')
                    total += member.size
                    if member.size > 32 * 1024 * 1024 or (name == 'manifest.json' and member.size > 512 * 1024):
                        raise ValueError('FILE_TOO_LARGE')
                    if total > LIMIT: raise ValueError('CONTENT_TOO_LARGE')
                    seen.add(name)
                    target = staging / name
                    target.parent.mkdir(exist_ok=True)
                    with package.extractfile(member) as source, target.open('xb') as output:
                        shutil.copyfileobj(source, output)
            record = json.loads((staging / 'manifest.json').read_text())
            body = record['body'].encode()
            manifest = json.loads(body)
            runtime = manifest['runtimeVersion']
            if not re.fullmatch(r'vietbid-android-[a-f0-9]{32}', runtime): raise ValueError('INVALID_RUNTIME')
            signature = base64.b64decode(record['signature'], validate=True)
            (staging / 'signature').write_bytes(signature)
            public = subprocess.run(['openssl', 'x509', '-pubkey', '-noout', '-in', str(ROOT / 'mobile/update-certificate.crt')],
                                    capture_output=True, check=True).stdout
            (staging / 'public.pem').write_bytes(public)
            (staging / 'body').write_bytes(body)
            subprocess.run(['openssl', 'dgst', '-sha256', '-verify', str(staging / 'public.pem'),
                            '-signature', str(staging / 'signature'), str(staging / 'body')],
                           capture_output=True, check=True)
            expected = {'manifest.json'}
            for asset in [manifest['launchAsset'], *manifest['assets']]:
                key = asset['key']
                if not re.fullmatch(r'[a-f0-9]{64}', key): raise ValueError('INVALID_ASSET')
                if asset['url'] != 'https://vietbid.alwaysdata.net/api/mobile-updates/assets/' + key:
                    raise ValueError('INVALID_ASSET_ORIGIN')
                file = staging / 'assets' / key
                digest = hashlib.sha256(file.read_bytes()).digest()
                if digest.hex() != key or base64.urlsafe_b64encode(digest).decode().rstrip('=') != asset['hash']:
                    raise ValueError('ASSET_HASH_MISMATCH')
                expected.add('assets/' + key)
            if seen != expected: raise ValueError('EXTRA_FILES')
            (destination / 'assets').mkdir(exist_ok=True)
            (destination / 'runtimes').mkdir(exist_ok=True)
            for name in expected - {'manifest.json'}:
                target = destination / name
                if target.exists():
                    if hashlib.sha256(target.read_bytes()).hexdigest() != target.name: raise ValueError('EXISTING_ASSET_CORRUPT')
                else:
                    (staging / name).replace(target)
            pointer = destination / 'runtimes' / (runtime + '.json')
            # Giữ tài nguyên của manifest vừa thay ít nhất 7 ngày cho lượt tải đang diễn ra.
            if pointer.exists():
                previous = json.loads(json.loads(pointer.read_text())['body'])
                for asset in [previous['launchAsset'], *previous['assets']]:
                    if re.fullmatch(r'[a-f0-9]{64}', asset['key']):
                        file = destination / 'assets' / asset['key']
                        if file.is_file() and not file.is_symlink(): os.utime(file, None)
            (staging / 'manifest.json').replace(pointer)
            referenced = set()
            for record_file in (destination / 'runtimes').glob('vietbid-android-*.json'):
                current = json.loads(json.loads(record_file.read_text())['body'])
                referenced.update(a['key'] for a in [current['launchAsset'], *current['assets']])
            for file in (destination / 'assets').iterdir():
                if (re.fullmatch(r'[a-f0-9]{64}', file.name) and file.name not in referenced
                        and file.is_file() and not file.is_symlink() and file.stat().st_mtime < time.time() - 7 * 86400):
                    file.unlink()
            print('MOBILE_UPDATE_READY', runtime, manifest['id'])


if __name__ == '__main__':
    try:
        receive(sys.stdin.buffer)
    except Exception as error:
        print('MOBILE_UPDATE_FAILED', str(error) if isinstance(error, ValueError) else type(error).__name__, file=sys.stderr)
        sys.exit(1)
