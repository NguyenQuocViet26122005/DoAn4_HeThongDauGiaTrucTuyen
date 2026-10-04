import type { SanPham } from './du-lieu';

export type AnhSanPham = SanPham['hinh_anh'][number];

export interface SanPhamTrongDanhSach {
  nguoi_ban_id: string;
  id: string;
  tieu_de: string;
  danh_muc_id: string;
  anh_chinh: string | null;
  trang_thai_duyet: string;
  tinh_trang_san_pham: string;
  ngay_tao: string;
  co_the_tao_phien?: boolean | number;
  da_tung_dau_gia?: boolean | number;
}

export interface ThuocTinhDanhMuc {
  id: string;
  ten_thuoc_tinh: string;
  kieu_nhap: 'VAN_BAN' | 'SO' | 'LUA_CHON' | 'DUNG_SAI' | 'NGAY';
  bat_buoc: boolean | number;
  don_vi: string | null;
  lua_chon_json: string[] | null;
}

export interface BieuMauSanPham {
  danh_muc_id: string;
  tieu_de: string;
  mo_ta: string;
  tinh_trang_san_pham: string;
  thuong_hieu?: string;
  gia_tri?: Record<string, string>;
}
