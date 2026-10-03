import { boNho, gui } from './api';
import type { DonHang } from '../types/don-hang';
import type { KetQuaThanhToan, LanThanhToan } from '../types/tham-gia-phien';
import { ketQuaThanhToanDon } from '../utils/don-hang';

export async function thanhToanDon(id: string, lan: LanThanhToan): Promise<KetQuaThanhToan> {
  const don = await gui<DonHang>(`/orders/${id}/payments/simulate`, lan);

  return { ket_qua_mo_phong: ketQuaThanhToanDon(don, lan), don_hang: don };
}

export function lamMoiDon(id: string) {
  return boNho.invalidateQueries({
    predicate: ({ queryKey }) =>
      queryKey[0] === '/orders' ||
      queryKey[0] === `/orders/${id}` ||
      queryKey[0] === '/admin/orders',
  });
}

export function doiDiaChiDon(id: string, diaChiId: string) {
  return gui<DonHang>(`/orders/${id}/address`, { dia_chi_id: diaChiId }, 'patch');
}

export function xacNhanDon(id: string, thaoTac: 'delivered' | 'confirm') {
  return gui<DonHang>(`/orders/${id}/${thaoTac}`);
}
