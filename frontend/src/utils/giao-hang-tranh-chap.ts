import type { DonHang } from '../types/don-hang';
import type { NguoiDung } from '../types/du-lieu';
import { mocThoiGian } from './dinh-dang.ts';
import { coTranhChapDangMo } from './don-hang.ts';

export const lyDoTranhChap = [
  'CHUA_NHAN_HANG',
  'KHONG_DUNG_MO_TA',
  'HONG_HOC',
  'KHONG_KHOP_HO_SO_KIEM_DINH',
  'NGHI_NGO_TINH_XAC_THUC',
  'THIEU_PHU_KIEN',
  'KHAC',
];

export function tranhChapDangMo(trangThai: string) {
  return ['DANG_MO', 'NGUOI_BAN_DA_PHAN_HOI', 'QUAN_TRI_DANG_XU_LY'].includes(trangThai);
}

export function duocGuiHang(don: DonHang, nguoiDung: NguoiDung) {
  if (
    nguoiDung.trang_thai_tai_khoan !== 'HOAT_DONG' ||
    !['CHO_GUI_HANG', 'DA_THANH_TOAN'].includes(don.trang_thai) ||
    don.trang_thai_giu_tien !== 'DANG_GIU'
  ) {
    return false;
  }

  return don.nguon_gui_hang === 'TRUNG_TAM'
    ? nguoiDung.vai_tro === 'QUAN_TRI'
    : nguoiDung.vai_tro === 'NGUOI_DUNG' && String(nguoiDung.id) === String(don.nguoi_ban_id);
}

export function lyDoDuocMo(don: DonHang, nguoiDung: NguoiDung, hienTai: number): string[] {
  if (
    nguoiDung.trang_thai_tai_khoan !== 'HOAT_DONG' ||
    don.trang_thai_giu_tien !== 'DANG_GIU' ||
    coTranhChapDangMo(don)
  ) {
    return [];
  }

  if (nguoiDung.vai_tro === 'QUAN_TRI') {
    return ['CHO_GUI_HANG', 'DA_THANH_TOAN', 'DA_GUI_HANG', 'DA_GIAO', 'DANG_KIEM_TRA'].includes(
      don.trang_thai,
    )
      ? lyDoTranhChap
      : [];
  }

  if (String(nguoiDung.id) !== String(don.nguoi_mua_id)) {
    return [];
  }

  if (
    ['DA_GIAO', 'DANG_KIEM_TRA'].includes(don.trang_thai) &&
    don.han_kiem_tra &&
    mocThoiGian(don.han_kiem_tra) > hienTai
  ) {
    return lyDoTranhChap.filter((lyDo) => lyDo !== 'CHUA_NHAN_HANG');
  }

  return don.trang_thai === 'DA_GUI_HANG' &&
    don.moc_khieu_nai_chua_nhan &&
    mocThoiGian(don.moc_khieu_nai_chua_nhan) <= hienTai
    ? ['CHUA_NHAN_HANG']
    : [];
}
