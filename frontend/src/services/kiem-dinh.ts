import { boNho, gui } from './api';
import type { HoSoKiemDinh } from '../types/kiem-dinh';

export async function lamMoiDuyetVaKiemDinh() {
  await boNho.invalidateQueries({
    predicate: ({ queryKey }) => {
      const url = queryKey[0];

      return (
        typeof url === 'string' &&
        ['/products', '/admin/products', '/inspections', '/admin/inspections'].some((tienTo) =>
          url.startsWith(tienTo),
        )
      );
    },
  });
}

export function moHoSo(sanPhamId: string) {
  return gui<HoSoKiemDinh>(`/admin/products/${sanPhamId}/inspections`);
}

export function xuLyHoSo(id: string, thaoTac: string, noiDung: unknown = {}) {
  const duongDan = thaoTac === 'shipping' ? '/inspections' : '/admin/inspections';

  return gui(`${duongDan}/${id}/${thaoTac}`, noiDung, thaoTac === 'result' ? 'patch' : 'post');
}
