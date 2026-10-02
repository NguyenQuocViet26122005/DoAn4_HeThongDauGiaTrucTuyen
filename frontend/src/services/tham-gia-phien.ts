import { boNho, gui } from './api';
import type { Phien } from '../types/du-lieu';
import type { BieuMauDiaChi, DatCoc, DiaChi } from '../types/tham-gia-phien';

export function datGia(id: string, mucToiDa: number) {
  return gui<Phien & { ban_dang_dan_dau: boolean }>(`/auctions/${id}/bids`, {
    gia_toi_da: String(mucToiDa),
  });
}

export function dangKyCoc(id: string) {
  return gui<DatCoc>(`/auctions/${id}/deposit/register`);
}

export function luuDiaChi(duLieu: BieuMauDiaChi, id?: string) {
  return gui<DiaChi>(`/users/me/addresses${id ? `/${id}` : ''}`, duLieu, id ? 'put' : 'post');
}

export function lamMoiThamGia(id: string) {
  return boNho.invalidateQueries({
    predicate: ({ queryKey }) => {
      const url = queryKey[0];

      return (
        typeof url === 'string' &&
        (url === `/auctions/${id}` ||
          url.startsWith(`/auctions/${id}/`) ||
          url === '/auctions' ||
          url === '/auctions/my-bids' ||
          url.startsWith('/orders'))
      );
    },
  });
}
