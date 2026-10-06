import type { Phien } from '../types/du-lieu';

export const tien = (giaTri: unknown) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(giaTri || 0));
export const chuoi = (giaTri: unknown) => (giaTri == null ? '' : String(giaTri));
export const mocThoiGian = (giaTri: unknown) =>
  new Date(
    chuoi(giaTri).replace(' ', 'T') + (/Z$|[+-]\d\d:\d\d$/.test(chuoi(giaTri)) ? '' : '+07:00'),
  ).getTime();
export const ngayGio = (giaTri: unknown) =>
  giaTri
    ? new Date(mocThoiGian(giaTri)).toLocaleString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'Chưa cập nhật';

export function tenGiaPhien(phien: Pick<Phien, 'trang_thai' | 'ly_do_ket_thuc'>) {
  if (phien.trang_thai === 'DA_LEN_LICH') {
    return 'Giá khởi điểm';
  }
  if (phien.trang_thai === 'DA_KET_THUC') {
    return phien.ly_do_ket_thuc === 'MUA_NGAY' ? 'Giá Mua ngay' : 'Giá trúng công khai';
  }
  if (phien.trang_thai === 'THAT_BAI') {
    return 'Giá cuối phiên';
  }
  if (phien.trang_thai === 'DA_HUY') {
    return 'Giá trước khi hủy';
  }

  return 'Giá công khai hiện tại';
}

export const nhanTrangThai: Record<string, string> = {
  CCCD: 'Căn cước công dân',
  HO_CHIEU: 'Hộ chiếu',
  HOAT_DONG: 'Đang diễn ra',
  DA_LEN_LICH: 'Sắp bắt đầu',
  DA_KET_THUC: 'Đã kết thúc',
  THAT_BAI: 'Chưa thành công',
  DA_HUY: 'Đã hủy',
  BAN_NHAP: 'Bản nháp',
  CHO_XU_LY: 'Chờ xử lý',
  DANG_XU_LY: 'Đang xử lý',
  DA_DUYET: 'Đã duyệt',
  TU_CHOI: 'Từ chối',
  LUU_TRU: 'Lưu trữ',
  CHUA_DANG_KY: 'Chưa đăng ký',
  DA_XAC_MINH: 'Đã xác minh',
  BI_KHOA: 'Đã khóa',
  TAM_NGUNG: 'Tạm ngưng',
  CHO_THANH_TOAN: 'Chờ thanh toán',
  DA_THANH_TOAN: 'Đã thanh toán',
  DA_DAT_COC: 'Đã đặt cọc',
  DA_HOAN_COC: 'Đã hoàn cọc',
  DA_CHUYEN_VAO_DON: 'Cọc đã chuyển vào đơn',
  KHONG_HOAN_COC: 'Không hoàn cọc',
  CHO_GUI_HANG: 'Chờ gửi hàng',
  DA_GUI_HANG: 'Đang vận chuyển',
  DA_GIAO: 'Đã giao hàng',
  DANG_KIEM_TRA: 'Đang kiểm tra hàng',
  DANG_TRANH_CHAP: 'Đang tranh chấp',
  HOAN_THANH: 'Hoàn thành',
  DANG_GIU: 'Đang giữ tiền',
  DA_GIAI_NGAN: 'Đã giải ngân',
  DA_HOAN_TIEN: 'Đã hoàn tiền',
  HOAN_TIEN_MOT_PHAN: 'Hoàn tiền một phần',
  DANG_MO: 'Đang mở',
  NGUOI_BAN_DA_PHAN_HOI: 'Người bán đã phản hồi',
  QUAN_TRI_DANG_XU_LY: 'Quản trị đang xử lý',
  GIAI_QUYET_CHO_NGUOI_MUA: 'Giải quyết cho người mua',
  GIAI_QUYET_CHO_NGUOI_BAN: 'Giải quyết cho người bán',
  DA_CHAP_NHAN: 'Đã chấp nhận',
  HET_HAN: 'Hết hạn',
  DA_XAC_NHAN: 'Đã xác nhận',
  MOI: 'Mới',
  NHU_MOI: 'Như mới',
  DA_QUA_SU_DUNG_TOT: 'Đã dùng, còn tốt',
  DA_QUA_SU_DUNG: 'Đã qua sử dụng',
  LAY_LINH_KIEN: 'Lấy linh kiện',
  NGUOI_DUNG: 'Người dùng',
  QUAN_TRI: 'Quản trị viên',
  TRUC_TIEP: 'Đặt giá',
  TU_DONG: 'Tự động',
  KHONG_THANH_TOAN: 'Không thanh toán',
  GIAO_HANG_MUON: 'Gửi hàng muộn',
  TU_DAU_GIA: 'Tự đấu giá',
  GIAN_LAN: 'Gian lận',
  LAM_DUNG: 'Lạm dụng',
  KHAC: 'Khác',
  CHUA_NHAN_HANG: 'Chưa nhận hàng',
  KHONG_DUNG_MO_TA: 'Không đúng mô tả',
  HONG_HOC: 'Hỏng hóc',
  HANG_GIA: 'Hàng giả',
  KHONG_KHOP_HO_SO_KIEM_DINH: 'Không khớp hồ sơ kiểm định',
  NGHI_NGO_TINH_XAC_THUC: 'Nghi ngờ tính xác thực',
  THIEU_PHU_KIEN: 'Thiếu phụ kiện',
  HOAN_TIEN_TRANH_CHAP: 'Hoàn tiền theo quyết định tranh chấp',
  DAT: 'Đạt',
  KHONG_DAT: 'Không đạt',
  CHUA_CO_KET_QUA: 'Chưa có kết quả',
  CHO_KET_QUA: 'Chờ kết quả',
  CAN_BO_SUNG: 'Cần bổ sung',
  CHO_GUI_TRUNG_TAM: 'Chờ gửi đến trung tâm',
  DANG_VAN_CHUYEN_DEN_TRUNG_TAM: 'Đang gửi đến trung tâm',
  DA_NHAN_TAI_TRUNG_TAM: 'Trung tâm đã nhận',
  DANG_KIEM_DINH: 'Đang kiểm định',
  KIEM_DINH_KHONG_DAT: 'Kiểm định không đạt',
  DA_KIEM_DINH_DAT: 'Kiểm định đạt',
  DANG_LUU_GIU: 'Đang lưu giữ tại trung tâm',
  DA_TRA_NGUOI_BAN: 'Đã trả người bán',
  BIEN_BAN_TIEP_NHAN: 'Biên bản tiếp nhận',
  BAO_CAO_KIEM_DINH: 'Báo cáo kiểm định',
  CHUNG_NHAN_KIEM_DINH: 'Chứng nhận kiểm định',
};
export const nhan = (giaTri: unknown) => nhanTrangThai[chuoi(giaTri)] || chuoi(giaTri) || '—';
