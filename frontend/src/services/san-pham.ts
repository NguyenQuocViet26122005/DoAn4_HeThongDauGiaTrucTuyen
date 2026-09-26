import { boNho, gui } from './api';
import type { SanPham } from '../types/du-lieu';
import type { AnhSanPham, BieuMauSanPham, ThuocTinhDanhMuc } from '../types/san-pham';

export function luuSanPham(
  id: string | undefined,
  duLieu: BieuMauSanPham,
  thuocTinh: ThuocTinhDanhMuc[],
) {
  return gui<SanPham>(
    id ? `/products/${id}` : '/products',
    {
      danh_muc_id: duLieu.danh_muc_id,
      tieu_de: duLieu.tieu_de.trim(),
      mo_ta: duLieu.mo_ta.trim(),
      tinh_trang_san_pham: duLieu.tinh_trang_san_pham,
      thuong_hieu: duLieu.thuong_hieu?.trim() || null,
      thuoc_tinh: thuocTinh
        .filter((muc) => String(duLieu.gia_tri?.[muc.id] ?? '').trim() !== '')
        .map((muc) => ({
          thuoc_tinh_id: muc.id,
          gia_tri: String(duLieu.gia_tri?.[muc.id]).trim(),
        })),
    },
    id ? 'put' : 'post',
  );
}

export const ganAnh = (id: string, url: string) =>
  gui<AnhSanPham>(`/products/${id}/images`, { duong_dan_anh: url });

export const chonAnhChinh = (id: string, anhId: string) =>
  gui<AnhSanPham[]>(`/products/${id}/images/${anhId}/primary`, {}, 'patch');

export const xoaAnh = (id: string, anhId: string) =>
  gui(`/products/${id}/images/${anhId}`, {}, 'delete');

export const guiDuyetSanPham = (id: string) => gui<SanPham>(`/products/${id}/submit`);

export function capNhatSanPham(sanPham: SanPham) {
  boNho.setQueryData([`/products/${sanPham.id}`, undefined], sanPham);
  void boNho.invalidateQueries({ queryKey: ['/products/mine'] });
}
