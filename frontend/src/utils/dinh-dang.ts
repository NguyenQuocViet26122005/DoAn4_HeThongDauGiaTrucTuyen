export const tien = (giaTri: unknown) => new Intl.NumberFormat('vi-VN', {style: 'currency', currency: 'VND', maximumFractionDigits: 0}).format(Number(giaTri || 0));
export const chuoi = (giaTri: unknown) => giaTri == null ? '' : String(giaTri);
export const mocThoiGian = (giaTri: unknown) => new Date(chuoi(giaTri).replace(' ', 'T') + (/Z$|[+-]\d\d:\d\d$/.test(chuoi(giaTri)) ? '' : '+07:00')).getTime();
export const ngayGio = (giaTri: unknown) => giaTri ? new Date(mocThoiGian(giaTri)).toLocaleString('vi-VN', {timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'medium', timeStyle: 'short'}) : 'Chưa cập nhật';
export const nhanTrangThai: Record<string, string> = {
  HOAT_DONG: 'Đang diễn ra', DA_LEN_LICH: 'Sắp bắt đầu', DA_KET_THUC: 'Đã kết thúc', THAT_BAI: 'Chưa thành công', DA_HUY: 'Đã hủy',
  BAN_NHAP: 'Bản nháp', CHO_XU_LY: 'Chờ xử lý', DA_DUYET: 'Đã duyệt', TU_CHOI: 'Từ chối', LUU_TRU: 'Lưu trữ',
  CHUA_DANG_KY: 'Chưa đăng ký', DA_XAC_MINH: 'Đã xác minh', BI_KHOA: 'Đã khóa', TAM_NGUNG: 'Tạm ngưng',
  CHO_THANH_TOAN: 'Chờ thanh toán', DA_THANH_TOAN: 'Đã thanh toán', CHO_GUI_HANG: 'Chờ gửi hàng', DA_GUI_HANG: 'Đang vận chuyển',
  DA_GIAO: 'Đã giao hàng', DANG_KIEM_TRA: 'Đang kiểm tra hàng', DANG_TRANH_CHAP: 'Đang tranh chấp', HOAN_THANH: 'Hoàn thành',
  DANG_GIU: 'Đang giữ tiền', DA_GIAI_NGAN: 'Đã giải ngân', DA_HOAN_TIEN: 'Đã hoàn tiền', HOAN_TIEN_MOT_PHAN: 'Hoàn tiền một phần',
  DANG_MO: 'Đang mở', NGUOI_BAN_DA_PHAN_HOI: 'Người bán đã phản hồi', QUAN_TRI_DANG_XU_LY: 'Quản trị đang xử lý',
  GIAI_QUYET_CHO_NGUOI_MUA: 'Giải quyết cho người mua', GIAI_QUYET_CHO_NGUOI_BAN: 'Giải quyết cho người bán',
  DA_CHAP_NHAN: 'Đã chấp nhận', HET_HAN: 'Hết hạn', DA_XAC_NHAN: 'Đã xác nhận',
  MOI: 'Mới', NHU_MOI: 'Như mới', DA_QUA_SU_DUNG_TOT: 'Đã dùng, còn tốt', DA_QUA_SU_DUNG: 'Đã qua sử dụng', LAY_LINH_KIEN: 'Lấy linh kiện',
  NGUOI_DUNG: 'Người dùng', QUAN_TRI: 'Quản trị viên', TRUC_TIEP: 'Đặt giá', TU_DONG: 'Tự động',
  KHONG_THANH_TOAN: 'Không thanh toán', GIAO_HANG_MUON: 'Gửi hàng muộn', TU_DAU_GIA: 'Tự đấu giá', GIAN_LAN: 'Gian lận', LAM_DUNG: 'Lạm dụng', KHAC: 'Khác',
  CHUA_NHAN_HANG: 'Chưa nhận hàng', KHONG_DUNG_MO_TA: 'Không đúng mô tả', HONG_HOC: 'Hỏng hóc', HANG_GIA: 'Hàng giả',
};
export const nhan = (giaTri: unknown) => nhanTrangThai[chuoi(giaTri)] || chuoi(giaTri) || '—';
