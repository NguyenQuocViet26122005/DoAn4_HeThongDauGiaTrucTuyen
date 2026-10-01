import type { Phien } from './du-lieu';

export interface BieuMauTaoPhien {
  san_pham_id: string;
  gia_khoi_diem: number;
  gia_san?: number | null;
  gia_mua_ngay?: number | null;
  phi_van_chuyen: number;
  thoi_gian_bat_dau: string;
  thoi_gian_ket_thuc: string;
}

export interface YeuCauHuyPhien {
  id: string;
  ly_do: string;
  trang_thai: string;
  ghi_chu_duyet: string | null;
  ngay_tao: string;
  ngay_duyet: string | null;
}

export interface PhienNguoiBan extends Phien {
  yeu_cau_huy_moi_nhat: YeuCauHuyPhien | null;
  co_the_yeu_cau_huy: boolean;
  ly_do_khong_the_huy: string | null;
}

export interface ThongKeCoc {
  da_dang_ky: string | number;
  da_coc: string | number;
  du_dieu_kien: string | number;
}
