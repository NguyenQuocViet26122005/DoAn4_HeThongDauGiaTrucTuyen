import { z } from 'zod';
import { soTien, vanBan, vanBanTuyChon } from './schema-chung';

export const danhGiaSchema = z.strictObject({ so_sao: soTien, nhan_xet: vanBanTuyChon(1000) });
export const baoCaoSanPhamSchema = z.strictObject({
  ly_do: z.enum(['HANG_GIA', 'THONG_TIN_SAI', 'HANG_CAM', 'QUYEN_SO_HUU', 'KHAC']),
  mo_ta: vanBan(850, 'Nội dung báo cáo'),
});
export const duyetViPhamSchema = z.strictObject({
  trang_thai: z.enum(['DA_XAC_NHAN', 'DA_HUY']),
  hinh_thuc_xu_ly: z.enum(['CANH_CAO', 'TAM_NGUNG', 'KHOA_TAI_KHOAN', 'KHONG_VI_PHAM']).optional(),
  ly_do_xu_ly: vanBanTuyChon(1000),
});
