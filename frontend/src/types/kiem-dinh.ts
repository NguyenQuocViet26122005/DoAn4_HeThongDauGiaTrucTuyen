export interface TepKiemDinh {
  id: string;
  loai_tep: string;
  duong_dan_tep: string;
  mo_ta: string | null;
}

export interface KiemDinhMoiNhat {
  id: string;
  ma_kiem_dinh: string;
  lan_kiem_dinh: number;
  trang_thai: string;
  ket_qua: string | null;
  ngay_roi_trung_tam: string | null;
  co_bao_cao: boolean;
}

export interface HoSoKiemDinh extends Omit<KiemDinhMoiNhat, 'co_bao_cao'> {
  san_pham_id: string;
  nguoi_ban_id?: string;
  tieu_de: string;
  ngay_tao: string;
  ngay_gui_trung_tam: string | null;
  don_vi_gui_trung_tam: string | null;
  ma_van_don_den_trung_tam: string | null;
  ngay_nhan_trung_tam: string | null;
  tinh_trang_khi_nhan: string | null;
  serial_khi_nhan: string | null;
  so_kien: number | null;
  ghi_chu_tiep_nhan: string | null;
  ngay_kiem_dinh: string | null;
  ten_chuyen_gia: string | null;
  don_vi_kiem_dinh: string | null;
  nhan_xet: string | null;
  ma_chung_nhan: string | null;
  ngay_tra_nguoi_ban: string | null;
  ly_do_tra: string | null;
  co_the_cap_nhat: boolean;
  ly_do_khong_the_cap_nhat: string | null;
  tep_dinh_kem: TepKiemDinh[];
}

export const trangThaiKiemDinh = [
  'CHO_GUI_TRUNG_TAM',
  'DANG_VAN_CHUYEN_DEN_TRUNG_TAM',
  'DA_NHAN_TAI_TRUNG_TAM',
  'DANG_KIEM_DINH',
  'CAN_BO_SUNG',
  'KIEM_DINH_KHONG_DAT',
  'DA_KIEM_DINH_DAT',
  'DANG_LUU_GIU',
  'DA_TRA_NGUOI_BAN',
];

export const loaiTepKiemDinh = ['BIEN_BAN_TIEP_NHAN', 'BAO_CAO_KIEM_DINH', 'CHUNG_NHAN_KIEM_DINH'];
