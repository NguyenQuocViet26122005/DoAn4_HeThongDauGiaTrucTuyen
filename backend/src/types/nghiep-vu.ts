import type { PoolConnection, RowDataPacket } from 'mysql2/promise';

/** MySQL trả BIGINT và DECIMAL bằng chuỗi để giữ nguyên độ chính xác. */
export type DinhDanh = string | number;
export type TienNhap = string | number;
export type BanGhiSQL = RowDataPacket;
export type DuLieuGhi = Record<string, unknown>;
export interface PhanTrang {
  limit: number;
  offset: number;
  page?: number;
}
export interface BoLocDanhSach {
  search?: string;
  status?: string;
  sellerId?: DinhDanh;
  categoryId?: DinhDanh;
  watcherId?: DinhDanh;
  bidderId?: DinhDanh;
}
export type TruyVanDanhSach = Record<string, unknown>;
export interface NguoiDungDangNhap {
  id: string;
  ho_ten: string;
  email: string;
  vai_tro: 'NGUOI_DUNG' | 'QUAN_TRI';
  trang_thai_nguoi_ban: string;
  trang_thai_tai_khoan: string;
  so_dien_thoai?: string;
  anh_dai_dien?: string;
  ngay_tao?: string;
}
export interface NguCanhGiaoDich {
  connection: PoolConnection;
  events: Array<() => unknown | Promise<unknown>>;
}
export interface GiaTriThuocTinh {
  thuoc_tinh_id: string;
  gia_tri: string;
  thu_tu?: number;
  [khoa: string]: unknown;
}
export interface PhienDauGia extends RowDataPacket {
  id: string;
  san_pham_id: string;
  nguoi_ban_id: string;
  nguoi_dan_dau_id: string | null;
  gia_hien_tai: string;
  gia_khoi_diem: string;
  gia_san: string | null;
  gia_mua_ngay: string | null;
  phi_van_chuyen: string;
  cho_phep_mua_ngay: number;
  dat_gia_san: number;
  tong_luot_tra_gia: number;
  trang_thai: string;
  thoi_gian_bat_dau: string;
  thoi_gian_ket_thuc: string;
}
export interface MucCamKet extends RowDataPacket {
  id: string;
  phien_dau_gia_id: string;
  nguoi_tra_gia_id: string;
  gia_toi_da: string;
  thoi_gian_dat_gia_toi_da: string;
}
export interface BuocGia {
  gia_tu: TienNhap;
  gia_den: TienNhap | null;
  muc_tang_gia: TienNhap;
  dang_hoat_dong: boolean | number;
}
export interface LuotGiaTinhToan {
  bidderId: string;
  price: bigint;
  type: 'TRUC_TIEP' | 'TU_DONG';
}
