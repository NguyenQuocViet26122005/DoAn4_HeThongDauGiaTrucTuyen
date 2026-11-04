// Gọi tên theo vai trò trong giao dịch thay cho mã tài khoản khó hiểu.
export function vaiTroGiaoDich(
  taiKhoanId: string | number | null | undefined,
  ben: { nguoi_mua_id?: string | number; nguoi_ban_id?: string | number },
  nguoiXemId?: string | number,
): string {
  if (taiKhoanId == null) {
    return 'Hệ thống';
  }

  const id = String(taiKhoanId);

  if (nguoiXemId != null && id === String(nguoiXemId)) {
    return 'Bạn';
  }
  if (id === String(ben.nguoi_mua_id)) {
    return 'Người mua';
  }
  if (id === String(ben.nguoi_ban_id)) {
    return 'Người bán';
  }

  return 'Quản trị viên';
}
