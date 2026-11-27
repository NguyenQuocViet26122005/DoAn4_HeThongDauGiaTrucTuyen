import contextlib
import importlib.util
import io
import json
import hashlib
import base64
import os
from pathlib import Path
import shutil
import subprocess
import tarfile
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('mobile_receiver', Path(__file__).resolve().parents[1] / 'nhan-cap-nhat-app.py')
receiver = importlib.util.module_from_spec(spec)
spec.loader.exec_module(receiver)


@unittest.skipUnless(os.name == 'posix', 'Bộ nhận hosting dùng fcntl trên Linux')
class MobileUpdatesTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        receiver.ROOT = self.root
        (self.root / 'backend/.local').mkdir(parents=True)
        (self.root / 'mobile').mkdir()
        self.key = self.root / 'key.pem'
        subprocess.run(['openssl', 'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-subj', '/CN=Test',
                        '-keyout', str(self.key), '-out', str(self.root / 'mobile/update-certificate.crt'), '-days', '1'],
                       capture_output=True, check=True)

    def tearDown(self):
        self.temp.cleanup()

    def package(self, *, corrupt_asset=False, corrupt_signature=False, extra=None):
        asset = b'Android bundle fixture'
        key = hashlib.sha256(asset).hexdigest()
        self.runtime = 'vietbid-android-' + 'a' * 32
        manifest = {'id': 'f7b53ddb-7930-4b23-9e2a-c193411c83c0', 'runtimeVersion': self.runtime,
                    'assets': [], 'launchAsset': {'key': key,
                    'url': 'https://vietbid.alwaysdata.net/api/mobile-updates/assets/' + key,
                    'hash': base64.urlsafe_b64encode(hashlib.sha256(asset).digest()).decode().rstrip('=')}}
        body = json.dumps(manifest)
        signature = subprocess.run(['openssl', 'dgst', '-sha256', '-sign', str(self.key)],
                                   input=body.encode(), capture_output=True, check=True).stdout
        record = {'body': body, 'signature': base64.b64encode(signature if not corrupt_signature else b'fake').decode()}
        files = {'manifest.json': json.dumps(record).encode(), 'assets/' + key: b'corrupt' if corrupt_asset else asset}
        if extra: files[extra] = b'escape'
        data = io.BytesIO()
        with tarfile.open(fileobj=data, mode='w:gz') as archive:
            for name, content in files.items():
                entry = tarfile.TarInfo(name)
                entry.size = len(content)
                archive.addfile(entry, io.BytesIO(content))
        data.seek(0)
        return data

    def test_accepts_signed_complete_update_and_rejects_corrupt_replacement(self):
        with contextlib.redirect_stdout(io.StringIO()): receiver.receive(self.package())
        pointer = self.root / 'backend/.local/mobile-updates/runtimes' / (self.runtime + '.json')
        original = pointer.read_bytes()
        with self.assertRaisesRegex(ValueError, 'HASH_MISMATCH'):
            receiver.receive(self.package(corrupt_asset=True))
        self.assertEqual(pointer.read_bytes(), original)

    def test_rejects_forged_signature_without_publishing_manifest(self):
        with self.assertRaises(subprocess.CalledProcessError): receiver.receive(self.package(corrupt_signature=True))
        self.assertFalse((self.root / 'backend/.local/mobile-updates/runtimes').exists())

    def test_rejects_traversal_and_extra_files(self):
        for name in ['../../escape', '/tmp/escape', 'assets/.env', 'unexpected.json']:
            with self.subTest(name=name), self.assertRaisesRegex(ValueError, 'ARCHIVE_REJECTED'):
                receiver.receive(self.package(extra=name))
        self.assertFalse((self.root / 'escape').exists())


if __name__ == '__main__': unittest.main()
