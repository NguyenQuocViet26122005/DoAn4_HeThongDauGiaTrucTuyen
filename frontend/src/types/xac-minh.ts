export interface HoSoXacMinh {
  id: string;
  nguoi_dung_id: string;
  ho_ten?: string;
  email?: string;
  loai_giay_to: string;
  so_giay_to: string;
  anh_mat_truoc: string;
  anh_mat_sau: string | null;
  anh_selfie: string;
  ten_ngan_hang: string;
  so_tai_khoan: string;
  chu_tai_khoan: string;
  trang_thai: string;
  ly_do_tu_choi: string | null;
  ngay_tao: string;
  ngay_duyet: string | null;
}

export interface DuLieuXacMinh {
  loai_giay_to: string;
  so_giay_to: string;
  anh_mat_truoc: string;
  anh_mat_sau?: string;
  anh_selfie: string;
  ten_ngan_hang: string;
  so_tai_khoan: string;
  chu_tai_khoan: string;
}
