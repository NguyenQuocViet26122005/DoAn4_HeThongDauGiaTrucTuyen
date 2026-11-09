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
  co_the_quyet_toan_coc?: boolean;
  ly_do_chua_giai_toa?: string | null;
  quyet_toan_coc?: {
    ket_qua: 'BOI_HOAN_NGUOI_BAN' | 'HOAN_NGUOI_MUA';
    so_tien: string;
    ly_do: string;
    nguoi_xu_ly_id: string;
    ngay_xu_ly: string;
    loai_ngoai_le?: string;
    tham_chieu_bang_chung?: string;
  } | null;
  giai_toa_canh_bao?: {
    ly_do: string;
    canh_bao_cu: string;
    nguoi_xu_ly_id: string;
    ngay_xu_ly: string;
  } | null;
  san_pham_id: string;
  tieu_de_san_pham?: string;
  anh_san_pham?: string | null;
  ung_vien_de_nghi?: { ma_cong_khai: string; gia: string } | null;
  kiem_dinh_san_pham_id: string | null;
  thao_tac_hang?: string[];
  ly_do_khong_gui_de_nghi?: string | null;
  xu_ly_hang: {
    trang_thai: string;
    kiem_dinh_moi_id?: string;
    san_pham_dang_lai_id?: string;
    ho_so_luu_giu_id?: string;
    trach_nhiem?: {
      ben_chiu_phi: string;
      phi_hoan: string;
      ben_boi_thuong: string;
      nguoi_nhan_boi_thuong: string;
      tien_boi_thuong: string;
      ghi_chu: string;
      ngay_ket_luan: string;
    };
    doi_soat_chi_phi?: {
      ma_chung_tu: string;
      ghi_chu: string;
      ngay_doi_soat: string;
    };
    lich_su: {
      thao_tac: string;
      thoi_gian: string;
      nguoi_thuc_hien_id: string;
      ghi_chu?: string;
      ma_van_don?: string;
      don_vi_van_chuyen?: string;
      serial?: string;
      phu_kien?: string;
      ket_qua?: string;
    }[];
  } | null;
  nguoi_ban_id: string;
  tieu_de?: string;
  anh_chinh?: string | null;
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
