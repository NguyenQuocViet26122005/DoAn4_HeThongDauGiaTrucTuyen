import test from 'node:test';
import assert from 'node:assert/strict';
import { duocGuiHang, lyDoDuocMo } from '../src/utils/giao-hang-tranh-chap.ts';
import type { NguoiDung } from '../src/types/du-lieu.ts';
import type { DonHang } from '../src/types/don-hang.ts';

const mua = { id: '1', vai_tro: 'NGUOI_DUNG', trang_thai_tai_khoan: 'HOAT_DONG' } as NguoiDung;
const ban = { ...mua, id: '2' };
const admin = { ...mua, id: '3', vai_tro: 'QUAN_TRI' } as NguoiDung;
const don = {
  nguoi_mua_id: '1',
  nguoi_ban_id: '2',
  nguon_gui_hang: 'NGUOI_BAN',
  trang_thai: 'CHO_GUI_HANG',
  trang_thai_giu_tien: 'DANG_GIU',
  tranh_chap: [],
} as unknown as DonHang;
const hienTai = Date.parse('2026-10-03T10:00:00+07:00');

test('Đơn gửi từ trung tâm chỉ Admin thao tác; đơn người bán không cho người mua gửi', () => {
  assert.equal(duocGuiHang(don, ban), true);
  assert.equal(duocGuiHang(don, mua), false);
  assert.equal(duocGuiHang(don, admin), false);
  assert.equal(duocGuiHang({ ...don, nguon_gui_hang: 'TRUNG_TAM' }, ban), false);
  assert.equal(duocGuiHang({ ...don, nguon_gui_hang: 'TRUNG_TAM' }, admin), true);
  assert.equal(duocGuiHang({ ...don, trang_thai: 'DA_GUI_HANG' }, ban), false);
});

test('Tranh chấp chưa nhận hàng chỉ mở từ mốc cho phép; hết hạn kiểm tra chặn người mua', () => {
  const daGui = {
    ...don,
    trang_thai: 'DA_GUI_HANG',
    moc_khieu_nai_chua_nhan: '2026-10-03 10:00:00',
  };
  assert.deepEqual(lyDoDuocMo(daGui, mua, hienTai - 1), []);
  assert.deepEqual(lyDoDuocMo(daGui, mua, hienTai), ['CHUA_NHAN_HANG']);
  assert.deepEqual(lyDoDuocMo(daGui, ban, hienTai), []);

  const kiemTra = { ...don, trang_thai: 'DANG_KIEM_TRA', han_kiem_tra: '2026-10-03 10:00:00' };
  assert.ok(lyDoDuocMo(kiemTra, mua, hienTai - 1).includes('NGHI_NGO_TINH_XAC_THUC'));
  assert.equal(lyDoDuocMo(kiemTra, mua, hienTai - 1).includes('CHUA_NHAN_HANG'), false);
  assert.deepEqual(lyDoDuocMo(kiemTra, mua, hienTai), []);
  assert.ok(lyDoDuocMo(kiemTra, admin, hienTai).length);
});

test('Tiền đã xử lý hoặc tranh chấp còn mở chặn hồ sơ mới cả với Admin', () => {
  assert.deepEqual(lyDoDuocMo({ ...don, trang_thai_giu_tien: 'DA_HOAN_TIEN' }, admin, hienTai), []);
  assert.deepEqual(
    lyDoDuocMo({ ...don, tranh_chap: [{ id: '9', trang_thai: 'DANG_MO' }] }, admin, hienTai),
    [],
  );
  assert.deepEqual(lyDoDuocMo(don, { ...admin, trang_thai_tai_khoan: 'BI_KHOA' }, hienTai), []);
});
