import { z } from 'zod';
import { vanBan, vanBanTuyChon, dungSai } from './schema-chung';

export const dangKySchema = z.strictObject({
  ho_ten: vanBan(100,'Họ tên'),
  email: vanBan(150,'Email'),
  mat_khau: z.string().min(8,'Mật khẩu cần ít nhất 8 ký tự').refine(x=>Buffer.byteLength(x)<=72,'Mật khẩu tối đa 72 byte'),
  so_dien_thoai: vanBanTuyChon(20),
});
export const dangNhapSchema = z.strictObject({
  email: vanBan(150,'Email'),
  mat_khau: z.string().min(1).refine(x=>Buffer.byteLength(x)<=72,'Mật khẩu tối đa 72 byte'),
});
export const diaChiSchema = z.strictObject({
  ten_nguoi_nhan: vanBan(100,'Tên người nhận'),
  sdt_nguoi_nhan: vanBan(20,'Số điện thoại'),
  tinh_thanh: vanBan(100,'Tỉnh thành'),
  quan_huyen: vanBan(100,'Quận huyện'),
  phuong_xa: vanBan(100,'Phường xã'),
  dia_chi_chi_tiet: vanBan(255,'Địa chỉ'),
  la_mac_dinh: dungSai.optional(),
});
export const trangThaiTaiKhoanSchema = z.strictObject({
  trang_thai_tai_khoan: z.enum(['HOAT_DONG','BI_KHOA','TAM_NGUNG']),
  ly_do: vanBan(500,'Lý do'),
});
export type DuLieuDangKy = z.infer<typeof dangKySchema>;
export type DuLieuDangNhap = z.infer<typeof dangNhapSchema>;
export type DuLieuDiaChi = z.infer<typeof diaChiSchema>;
