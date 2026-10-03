import test from 'node:test';
import assert from 'node:assert/strict';
import { soTienMuaNgay, donViNho } from '../src/utils/tien-tham-gia.ts';
import {
  docLanThanhToan,
  luuLanThanhToan,
  tenLanThanhToan,
} from '../src/services/lan-thanh-toan.ts';

test('Mua ngay trừ đúng cọc và giữ chính xác tiền thập phân lịch sử', () => {
  assert.deepEqual(soTienMuaNgay('25000000.00', '50000', '1800000'), {
    tong: '25050000.00',
    conLai: '23250000.00',
  });
  assert.deepEqual(soTienMuaNgay('9999999999999.99', '0', '0.01'), {
    tong: '9999999999999.99',
    conLai: '9999999999999.98',
  });
  assert.equal(soTienMuaNgay('100', '0', '100').conLai, '0.00');
});

test('Dữ liệu tiền sai hoặc cọc vượt tổng không tạo số cần thu giả', () => {
  for (const sai of ['NaN', '-1', '1e6', '1.001']) {
    assert.throws(() => donViNho(sai));
  }
  assert.throws(() => soTienMuaNgay('100', '20', '121'));
});

test('Tải lại giữ nguyên mã và kết quả thanh toán, tách theo người/phiên/loại', () => {
  const duLieu = new Map<string, string>();
  const moTaCu = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');

  Object.defineProperty(globalThis, 'sessionStorage', {
    configurable: true,
    value: {
      getItem: (ten: string) => duLieu.get(ten) ?? null,
      setItem: (ten: string, giaTri: string) => duLieu.set(ten, giaTri),
    },
  });

  try {
    const ten = tenLanThanhToan('buyer-a', '123', 'mua-ngay');
    const lan = { khoa_yeu_cau: 'thu-lai-cung-ma', ket_qua_mo_phong: 'THAT_BAI' as const };

    luuLanThanhToan(ten, lan);
    assert.deepEqual(docLanThanhToan(ten), lan);
    assert.equal(docLanThanhToan(tenLanThanhToan('buyer-b', '123', 'mua-ngay')), null);
    assert.equal(docLanThanhToan(tenLanThanhToan('buyer-a', '124', 'mua-ngay')), null);
    assert.equal(docLanThanhToan(tenLanThanhToan('buyer-a', '123', 'coc')), null);

    duLieu.set(ten, '{"ket_qua_mo_phong":"THANH_CONG"}');
    assert.throws(() => docLanThanhToan(ten));
    duLieu.set(ten, 'JSON hỏng');
    assert.throws(() => docLanThanhToan(ten));
  } finally {
    if (moTaCu) {
      Object.defineProperty(globalThis, 'sessionStorage', moTaCu);
    } else {
      Reflect.deleteProperty(globalThis, 'sessionStorage');
    }
  }
});
