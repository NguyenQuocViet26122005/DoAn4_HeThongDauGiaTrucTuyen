import test from 'node:test';
import assert from 'node:assert/strict';
import { ketQuaChapNhan } from '../src/utils/de-nghi-mua-tiep.ts';
import type { DonMua } from '../src/types/tham-gia-phien.ts';
import type { PhanHoiDeNghi } from '../src/types/de-nghi-mua-tiep.ts';

const thanhCong: PhanHoiDeNghi = {
  de_nghi: { trang_thai: 'DA_CHAP_NHAN', nguoi_tra_gia_id: '2', don_hang_moi_id: '3' },
  don_hang: { id: '3', nguoi_mua_id: '2' } as DonMua,
};

test('Chấp nhận lần đầu/khôi phục không cần cờ thanh toán nhưng phải khớp đúng đơn và người nhận', () => {
  assert.equal(ketQuaChapNhan(thanhCong).ket_qua_mo_phong, 'THANH_CONG');
  for (const ghiDe of [
    { don_hang: null },
    { don_hang: { id: '4', nguoi_mua_id: '2' } as DonMua },
    { don_hang: { id: '3', nguoi_mua_id: '9' } as DonMua },
    { de_nghi: { ...thanhCong.de_nghi, trang_thai: 'CHO_XU_LY' } },
  ]) {
    assert.throws(() => ketQuaChapNhan({ ...thanhCong, ...ghiDe }));
  }
});

test('Lấy lại lần thất bại cũ không biến thành thành công dù đề nghị sau đó đã được chấp nhận', () => {
  const ketQua = ketQuaChapNhan({ ...thanhCong, ket_qua_mo_phong: 'THAT_BAI' });
  assert.equal(ketQua.ket_qua_mo_phong, 'THAT_BAI');
  assert.equal(ketQua.don_hang, null);
});
