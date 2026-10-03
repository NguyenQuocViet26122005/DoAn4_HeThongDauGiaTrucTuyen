import test from 'node:test';
import assert from 'node:assert/strict';
import type { DonHang } from '../src/types/don-hang.ts';
import { duocHoanTatDon, ketQuaThanhToanDon } from '../src/utils/don-hang.ts';

const lan = { khoa_yeu_cau: 'kiem-thu-thanh-toan-don', ket_qua_mo_phong: 'THANH_CONG' as const };

function donMau(ghiDe: Partial<DonHang> = {}): DonHang {
  return {
    trang_thai: 'DANG_KIEM_TRA',
    tong_tien: '25050000.00',
    so_tien_da_thu: '25050000.00',
    trang_thai_giu_tien: 'DANG_GIU',
    can_admin_xu_ly: 0,
    tranh_chap: [],
    thanh_toan: [],
    ...ghiDe,
  } as DonHang;
}

test('Nhận hàng và hoàn tất là hai bước; tranh chấp/cờ Admin/thiếu tiền khóa hoàn tất', () => {
  assert.equal(duocHoanTatDon(donMau()), true);

  for (const ghiDe of [
    { trang_thai: 'DA_GUI_HANG' },
    { can_admin_xu_ly: 1 },
    { so_tien_da_thu: '24999999.99' },
    { trang_thai_giu_tien: 'DA_GIAI_NGAN' },
    { tranh_chap: [{ id: '1', trang_thai: 'DANG_MO' }] },
  ]) {
    assert.equal(duocHoanTatDon(donMau(ghiDe)), false);
  }
});

test('HTTP thành công không biến một giao dịch đơn thất bại thành đã thu tiền', () => {
  const don = donMau({
    trang_thai: 'CHO_THANH_TOAN',
    so_tien_da_thu: '1800000',
    thanh_toan: [
      {
        id: '1',
        khoa_yeu_cau: lan.khoa_yeu_cau,
        trang_thai: 'THAT_BAI',
        so_tien: '23250000',
        ngay_tao: '',
        ngay_thanh_toan: null,
      },
    ],
  });

  assert.equal(ketQuaThanhToanDon(don, lan), 'THAT_BAI');
  assert.throws(() => ketQuaThanhToanDon(don, { ...lan, khoa_yeu_cau: 'mot-lan-khac' }));
});

test('Lấy lại đơn đã thanh toán đủ nhận kết quả thật, không dựa lựa chọn mô phỏng', () => {
  const don = donMau({
    trang_thai: 'CHO_GUI_HANG',
    thanh_toan: [
      {
        id: '2',
        khoa_yeu_cau: lan.khoa_yeu_cau,
        trang_thai: 'DA_THANH_TOAN',
        so_tien: '23250000',
        ngay_tao: '',
        ngay_thanh_toan: '',
      },
    ],
  });

  assert.equal(ketQuaThanhToanDon(don, { ...lan, ket_qua_mo_phong: 'THAT_BAI' }), 'THANH_CONG');
  assert.throws(() => ketQuaThanhToanDon({ ...don, so_tien_da_thu: '1800000' }, lan));
});
