export type BanGhi = Record<string, unknown>;
export interface NguoiDung {
  id: string;
  ho_ten: string;
  email: string;
  so_dien_thoai: string | null;
  anh_dai_dien: string | null;
  vai_tro: 'NGUOI_DUNG' | 'QUAN_TRI';
  trang_thai_nguoi_ban: string;
  trang_thai_tai_khoan: string;
}
export interface DanhMuc {
  id: string;
  ten: string;
  danh_muc_cha_id: string | null;
  duong_dan: string;
}
export interface Phien {
  id: string;
  san_pham_id: string;
  tieu_de: string;
  danh_muc_id?: string;
  ten_danh_muc?: string;
  ten_nguoi_ban?: string;
  nguoi_ban_id: string;
  anh_chinh?: string;
  gia_khoi_diem: string;
  gia_hien_tai: string;
  gia_mua_ngay: string | null;
  cho_phep_mua_ngay: number;
  thoi_gian_bat_dau: string;
  thoi_gian_ket_thuc: string;
  trang_thai: string;
  ly_do_ket_thuc: string | null;
  nguoi_dan_dau: string | null;
  dat_gia_san: number;
  tong_luot_tra_gia: number;
  so_lan_gia_han: number;
}
export interface SanPham {
  id: string;
  danh_muc_id: string;
  nguoi_ban_id: string;
  tieu_de: string;
  mo_ta: string;
  tinh_trang_san_pham: string;
  thuong_hieu: string | null;
  trang_thai_duyet?: string;
  ly_do_tu_choi?: string;
  hinh_anh: { id: string; duong_dan_anh: string; la_anh_chinh: number }[];
  thuoc_tinh: {
    thuoc_tinh_id: string;
    ten_thuoc_tinh: string;
    gia_tri: string;
    don_vi: string | null;
  }[];
}
export interface TruongNhap {
  ten: string;
  nhan: string;
  loai?:
    'text' | 'email' | 'password' | 'textarea' | 'number' | 'select' | 'switch' | 'datetime-local';
  batBuoc?: boolean;
  luaChon?: { label: string; value: string | number }[];
  goiY?: string;
  min?: number;
  max?: number;
}
