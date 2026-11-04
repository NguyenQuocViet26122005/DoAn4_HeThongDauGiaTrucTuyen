import { z } from 'zod';
import { dinhDanh, dungSai, vanBan } from './schema-chung';

export const thanhToanSchema = z.strictObject({
  ket_qua_mo_phong: z.enum(['THANH_CONG', 'THAT_BAI']).optional(),
  khoa_yeu_cau: z
    .string()
    .regex(
      /^[a-zA-Z0-9_-]{8,64}$/,
      'Khóa yêu cầu cần 8–64 ký tự chữ, số, gạch ngang hoặc gạch dưới',
    )
    .nullish(),
});
export const guiHangSchema = z.strictObject({
  don_vi_van_chuyen: vanBan(100, 'Đơn vị vận chuyển'),
  ma_van_don: vanBan(100, 'Mã vận đơn'),
});
export const diaChiDonSchema = z.strictObject({ dia_chi_id: dinhDanh });
const lyDoQuyetToan = vanBan(1000, 'Căn cứ quyết toán').min(20, 'Căn cứ cần ít nhất 20 ký tự');
export const quyetToanCocSchema = z.discriminatedUnion('ket_qua', [
  z.strictObject({ ket_qua: z.literal('BOI_HOAN_NGUOI_BAN'), ly_do: lyDoQuyetToan }),
  z.strictObject({
    ket_qua: z.literal('HOAN_NGUOI_MUA'),
    ly_do: lyDoQuyetToan,
    loai_ngoai_le: z.enum(['LOI_HE_THONG', 'LOI_BEN_BAN', 'SAI_THONG_TIN_PHIEN']),
    tham_chieu_bang_chung: vanBan(200, 'Mã hồ sơ hoặc tham chiếu chứng cứ').min(6),
  }),
]);
export const giaiToaDonSchema = z.strictObject({
  ly_do: vanBan(1000, 'Kết quả kiểm tra').min(20, 'Kết quả kiểm tra cần ít nhất 20 ký tự'),
});
export const phanHoiDeNghiSchema = z.strictObject({
  chap_nhan: dungSai,
  ...thanhToanSchema.shape,
});
export type DuLieuThanhToan = z.infer<typeof thanhToanSchema>;
export type DuLieuGuiHang = z.infer<typeof guiHangSchema>;
