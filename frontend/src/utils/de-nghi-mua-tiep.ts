import type { PhanHoiDeNghi } from '../types/de-nghi-mua-tiep';
import type { KetQuaThanhToan } from '../types/tham-gia-phien';

export function ketQuaChapNhan(phanHoi: PhanHoiDeNghi): KetQuaThanhToan {
  if (phanHoi.ket_qua_mo_phong === 'THAT_BAI') {
    return { ket_qua_mo_phong: 'THAT_BAI', don_hang: null };
  }

  const { de_nghi: deNghi, don_hang: don } = phanHoi;

  // Lần gửi thành công đầu tiên và lần khôi phục có thể không kèm cờ kết quả thanh toán.
  if (
    deNghi.trang_thai !== 'DA_CHAP_NHAN' ||
    !don ||
    String(deNghi.don_hang_moi_id) !== String(don.id) ||
    String(deNghi.nguoi_tra_gia_id) !== String(don.nguoi_mua_id)
  ) {
    throw new Error('Chưa xác nhận được đơn của đề nghị. Hãy kiểm tra lại lần thanh toán trước.');
  }

  return { ket_qua_mo_phong: 'THANH_CONG', don_hang: don };
}
