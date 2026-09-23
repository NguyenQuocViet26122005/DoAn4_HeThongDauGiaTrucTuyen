import { z } from 'zod';
import { soTien, vanBan, vanBanTuyChon } from './schema-chung';

export const moTranhChapSchema = z.strictObject({
  ly_do: z.enum(['CHUA_NHAN_HANG','KHONG_DUNG_MO_TA','HONG_HOC','HANG_GIA','KHAC']),
  mo_ta: vanBan(20000,'Mô tả'),
});
export const phanHoiSchema = z.strictObject({phan_hoi_nguoi_ban:vanBan(20000,'Phản hồi')});
export const bangChungSchema = z.strictObject({duong_dan_tep:vanBan(500,'Đường dẫn tệp'),mo_ta:vanBanTuyChon(500)});
export const giaiQuyetSchema = z.strictObject({
  ket_qua: z.enum(['NGUOI_MUA','NGUOI_BAN']),
  so_tien_hoan: soTien.nullish(),
  ket_qua_xu_ly: vanBan(20000,'Kết quả xử lý'),
});
export type DuLieuMoTranhChap = z.infer<typeof moTranhChapSchema>;
