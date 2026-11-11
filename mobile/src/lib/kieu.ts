// Kiểu dữ liệu theo đúng hợp đồng API backend (cùng tên trường với web).
export interface NguoiDung {
  id: string;
  ho_ten: string;
  email: string;
  so_dien_thoai: string | null;
  vai_tro: 'NGUOI_DUNG' | 'QUAN_TRI';
  trang_thai_nguoi_ban: string;
  trang_thai_tai_khoan: string;
}

export interface Phien {
  id: string;
  san_pham_id: string;
  tieu_de: string;
  ten_danh_muc?: string;
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
  phi_van_chuyen: string;
  yeu_cau_dat_coc: number;
  so_tien_dat_coc: string;
}

export interface SanPham {
  id: string;
  mo_ta: string;
  tinh_trang_san_pham: string;
  thuong_hieu: string | null;
  hinh_anh: { id: string; duong_dan_anh: string }[];
}

export interface LuotGia {
  id: string;
  nguoi_tra_gia: string;
  so_tien: string;
  ngay_tao: string;
}

export interface DatCoc {
  trang_thai: string;
  so_tien: string;
}

export interface DiaChi {
  id: string;
  ten_nguoi_nhan: string;
  sdt_nguoi_nhan: string;
  tinh_thanh: string;
  quan_huyen: string;
  phuong_xa: string;
  dia_chi_chi_tiet: string;
  la_mac_dinh: number | boolean;
}

export interface DonHang {
  id: string;
  ma_don_hang: string;
  phien_dau_gia_id: string;
  nguoi_mua_id: string;
  nguoi_ban_id: string;
  tieu_de?: string;
  tieu_de_san_pham?: string;
  anh_chinh?: string | null;
  anh_san_pham?: string | null;
  trang_thai: string;
  gia_san_pham: string;
  phi_van_chuyen: string;
  tong_tien: string;
  tien_coc_da_chuyen: string;
  so_tien_da_thu: string;
  so_tien_con_phai_thanh_toan: string;
  han_thanh_toan: string | null;
  han_kiem_tra: string | null;
  ten_nguoi_nhan: string;
  sdt_nguoi_nhan: string;
  dia_chi_giao_hang: string;
  don_vi_van_chuyen: string | null;
  ma_van_don: string | null;
  can_admin_xu_ly: number;
  trang_thai_giu_tien: string;
  ngay_tao: string;
  thanh_toan?: { id: string; khoa_yeu_cau: string | null; trang_thai: string; so_tien: string }[];
  tranh_chap?: { id: string; trang_thai: string }[];
}

export interface ThongBao {
  id: string;
  tieu_de: string;
  noi_dung: string;
  duong_dan_lien_ket: string | null;
  la_nguoi_ban?: number;
  da_doc: number;
  ngay_tao: string;
}
