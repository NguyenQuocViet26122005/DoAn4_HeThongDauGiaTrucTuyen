import { boNho, gui } from './api';
import type { ChiTietTranhChap } from '../types/tranh-chap';

export function moTranhChap(donId: string, noiDung: unknown) {
  return gui<ChiTietTranhChap>(`/orders/${donId}/disputes`, noiDung);
}

export function xuLyTranhChap(
  id: string,
  thaoTac: 'response' | 'take' | 'resolve' | 'evidence',
  noiDung: unknown = {},
) {
  const tienTo = ['take', 'resolve'].includes(thaoTac) ? '/admin/disputes' : '/disputes';

  return gui(`${tienTo}/${id}/${thaoTac}`, noiDung);
}

export function lamMoiTranhChap() {
  return boNho.invalidateQueries({
    predicate: ({ queryKey }) => {
      const duongDan = queryKey[0];

      return (
        typeof duongDan === 'string' &&
        ['/orders', '/admin/orders', '/disputes', '/admin/disputes', '/notifications'].some((url) =>
          duongDan.startsWith(url),
        )
      );
    },
  });
}
