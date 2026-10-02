import type { LanThanhToan } from '../types/tham-gia-phien';

export function tenLanThanhToan(nguoiDungId: string, phienId: string, loai: string) {
  return `vietbid-thanh-toan:${nguoiDungId}:${phienId}:${loai}`;
}

export function docLanThanhToan(ten: string): LanThanhToan | null {
  const giaTri = sessionStorage.getItem(ten);

  if (!giaTri) {
    return null;
  }

  const lan: unknown = JSON.parse(giaTri);

  if (
    !lan ||
    typeof lan !== 'object' ||
    !('khoa_yeu_cau' in lan) ||
    !('ket_qua_mo_phong' in lan) ||
    typeof lan.khoa_yeu_cau !== 'string' ||
    !/^[a-zA-Z0-9_-]{8,100}$/.test(lan.khoa_yeu_cau) ||
    !['THANH_CONG', 'THAT_BAI'].includes(String(lan.ket_qua_mo_phong))
  ) {
    throw new Error(
      'Không đọc được lần thanh toán trước. Hãy kiểm tra đơn hàng trước khi thử lại.',
    );
  }

  return lan as LanThanhToan;
}

export function luuLanThanhToan(ten: string, lan: LanThanhToan) {
  // Chỉ lưu mã đối soát và kết quả mô phỏng; không lưu trần giá, địa chỉ hoặc thông tin thẻ.
  sessionStorage.setItem(ten, JSON.stringify(lan));
}
