import { boNho, gui } from './api';
import type { Phien } from '../types/du-lieu';
import type { BieuMauTaoPhien, YeuCauHuyPhien } from '../types/phien-nguoi-ban';

export function taoPhien(duLieu: BieuMauTaoPhien) {
  return gui<Phien>('/auctions', {
    san_pham_id: duLieu.san_pham_id,
    gia_khoi_diem: String(duLieu.gia_khoi_diem),
    gia_san: duLieu.gia_san == null ? null : String(duLieu.gia_san),
    gia_mua_ngay: duLieu.gia_mua_ngay == null ? null : String(duLieu.gia_mua_ngay),
    phi_van_chuyen: String(duLieu.phi_van_chuyen),
    thoi_gian_bat_dau: `${duLieu.thoi_gian_bat_dau}+07:00`,
    thoi_gian_ket_thuc: `${duLieu.thoi_gian_ket_thuc}+07:00`,
  });
}

export function guiYeuCauHuyPhien(id: string, lyDo: string) {
  return gui<YeuCauHuyPhien>(`/auctions/${id}/cancellation-requests`, { ly_do: lyDo.trim() });
}

export function lamMoiPhienNguoiBan() {
  return boNho.invalidateQueries({
    predicate: ({ queryKey }) => {
      const url = queryKey[0];

      return (
        typeof url === 'string' && (url.startsWith('/auctions') || url.startsWith('/products'))
      );
    },
  });
}
