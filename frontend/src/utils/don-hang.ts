import type { DonHang } from '../types/don-hang';
import type { LanThanhToan } from '../types/tham-gia-phien';
import { donViNho } from './tien-tham-gia.ts';

export function coTranhChapDangMo(don: Pick<DonHang, 'tranh_chap'>) {
  return don.tranh_chap.some((muc) =>
    ['DANG_MO', 'NGUOI_BAN_DA_PHAN_HOI', 'QUAN_TRI_DANG_XU_LY'].includes(muc.trang_thai),
  );
}

export function duocHoanTatDon(don: DonHang) {
  return (
    ['DA_GIAO', 'DANG_KIEM_TRA'].includes(don.trang_thai) &&
    !Number(don.can_admin_xu_ly) &&
    !coTranhChapDangMo(don) &&
    don.trang_thai_giu_tien === 'DANG_GIU' &&
    donViNho(don.so_tien_da_thu) === donViNho(don.tong_tien)
  );
}

export function ketQuaThanhToanDon(don: DonHang, lan: LanThanhToan) {
  // API đơn trả hồ sơ đơn, không trả ket_qua_mo_phong như API Mua ngay.
  if (
    don.thanh_toan.some((muc) => muc.trang_thai === 'DA_THANH_TOAN') &&
    donViNho(don.so_tien_da_thu) === donViNho(don.tong_tien)
  ) {
    return 'THANH_CONG' as const;
  }

  const thanhToan = don.thanh_toan.find((muc) => muc.khoa_yeu_cau === lan.khoa_yeu_cau);

  if (thanhToan?.trang_thai === 'THAT_BAI') {
    return 'THAT_BAI' as const;
  }

  throw new Error(
    'Chưa xác định được kết quả thanh toán. Hãy làm mới đơn và kiểm tra lại lần trước.',
  );
}
