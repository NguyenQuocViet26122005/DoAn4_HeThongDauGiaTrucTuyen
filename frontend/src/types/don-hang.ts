import type { DonMua } from './tham-gia-phien';

export interface ThanhToanDon {
  id: string;
  khoa_yeu_cau: string | null;
  trang_thai: string;
  so_tien: string;
  ngay_tao: string;
  ngay_thanh_toan: string | null;
}

export interface DonHang extends DonMua {
  nguoi_ban_id: string;
  tieu_de?: string;
  nguon_don: string;
  nguon_gui_hang: string;
  so_tien_con_phai_thanh_toan: string;
  so_tien_dang_giu: string;
  so_tien_da_hoan: string;
  so_tien_da_giai_ngan: string;
  han_thanh_toan: string | null;
  han_nguoi_ban_gui_hang: string | null;
  han_kiem_tra: string | null;
  moc_khieu_nai_chua_nhan: string | null;
  don_vi_van_chuyen: string | null;
  ma_van_don: string | null;
  ngay_tao: string;
  ngay_gui_hang: string | null;
  ngay_giao_hang: string | null;
  ngay_hoan_thanh: string | null;
  can_admin_xu_ly: number | boolean;
  ly_do_can_xu_ly: string | null;
  ly_do_huy: string | null;
  thanh_toan: ThanhToanDon[];
  tranh_chap: { id: string; trang_thai: string }[];
  danh_gia_cua_toi?: {
    id: string;
    so_sao: number;
    nhan_xet: string | null;
    ngay_tao: string;
  } | null;
}
