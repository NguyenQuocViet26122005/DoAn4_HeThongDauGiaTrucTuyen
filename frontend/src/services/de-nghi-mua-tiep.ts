import { boNho, gui } from './api';
import type { DeNghiMuaTiep, PhanHoiDeNghi } from '../types/de-nghi-mua-tiep';
import type { LanThanhToan } from '../types/tham-gia-phien';
import { ketQuaChapNhan } from '../utils/de-nghi-mua-tiep';

export function lamMoiDeNghi() {
  return boNho.invalidateQueries({
    predicate: ({ queryKey }) =>
      typeof queryKey[0] === 'string' &&
      ['/second-chances', '/orders', '/admin/orders', '/notifications'].some((goc) =>
        String(queryKey[0]).startsWith(goc),
      ),
  });
}

export function taoDeNghi(donId: string) {
  return gui<DeNghiMuaTiep>(`/orders/${donId}/second-chance`);
}

export async function chapNhanDeNghi(id: string, lan: LanThanhToan) {
  const phanHoi = await gui<PhanHoiDeNghi>(`/second-chances/${id}/respond`, {
    ...lan,
    chap_nhan: true,
  });

  return ketQuaChapNhan(phanHoi);
}

export function tuChoiDeNghi(id: string) {
  return gui<PhanHoiDeNghi>(`/second-chances/${id}/respond`, { chap_nhan: false });
}
