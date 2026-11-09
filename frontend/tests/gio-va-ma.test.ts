import test from 'node:test';
import assert from 'node:assert/strict';
import { ghiNhanGioMayChu, gioMayChu } from '../src/utils/gio-may-chu.ts';
import { maNgauNhien } from '../src/utils/ma-ngau-nhien.ts';

test('Giờ máy chủ bù độ lệch đồng hồ máy người dùng, bỏ qua header hỏng', () => {
  const nhanLuc = Date.now();

  ghiNhanGioMayChu(String(nhanLuc + 5 * 60000), nhanLuc);
  assert.ok(Math.abs(gioMayChu() - (Date.now() + 5 * 60000)) < 1000);

  ghiNhanGioMayChu('khong-phai-so');
  ghiNhanGioMayChu(undefined);
  assert.ok(Math.abs(gioMayChu() - (Date.now() + 5 * 60000)) < 1000);

  ghiNhanGioMayChu(String(nhanLuc), nhanLuc);
});

test('Mã ngẫu nhiên vẫn tạo được UUID v4 khi không có crypto.randomUUID', () => {
  const goc = crypto.randomUUID;

  try {
    Object.defineProperty(crypto, 'randomUUID', { value: undefined, configurable: true });

    const ma = maNgauNhien();

    assert.match(ma, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    assert.notEqual(maNgauNhien(), ma);
  } finally {
    Object.defineProperty(crypto, 'randomUUID', { value: goc, configurable: true });
  }
});
