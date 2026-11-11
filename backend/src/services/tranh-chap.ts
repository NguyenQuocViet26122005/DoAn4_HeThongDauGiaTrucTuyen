import type { NguoiDungDangNhap, BanGhiSQL } from '../types/nghiep-vu';
import {
  moTranhChapSchema,
  phanHoiSchema,
  bangChungSchema,
  giaiQuyetSchema,
} from '../validations/tranh-chap.schema';
import coSoDuLieu = require('../repositories/ket-noi');
import khoBanGhi = require('../repositories/ban-ghi');
import khoDuLieu = require('../repositories/tuong-tac');
import cacDonHang = require('../repositories/don-hang');
import dichVuDonHang = require('./don-hang');
import { ghiNhatKy, taoThongBao } from './nhat-ky-thong-bao';
import kiemTra = require('../validations/du-lieu-dau-vao');
import { baoDam, batBuocTonTai, cungId } from '../utils/loi';
import { donViTienNho, chuoiTien } from '../utils/tien';
import thoiGian = require('../utils/thoi-gian');
const trangThaiDangMo = ['DANG_MO', 'NGUOI_BAN_DA_PHAN_HOI', 'QUAN_TRI_DANG_XU_LY'];

function duocBoSungBangChung(tranhChap, donHang) {
  const hang = require('./hang-hoan').docXuLyHang(donHang);

  return (
    trangThaiDangMo.includes(tranhChap.trang_thai) ||
    (hang &&
      ![
        'DU_DIEU_KIEN_BAN_LAI',
        'DA_TRA_NGUOI_BAN',
        'DA_GIAO_LAI_NGUOI_MUA',
        'DA_DUNG_THU_HOI',
      ].includes(hang.trang_thai))
  );
}

async function chiTiet(nguoiDung: NguoiDungDangNhap, id) {
  const banGhi = batBuocTonTai(await khoBanGhi.layTheoId('tranh_chap', kiemTra.id(id)));

  const donHang = batBuocTonTai(await khoBanGhi.layTheoId('don_hang', banGhi.don_hang_id));

  dichVuDonHang.kiemTraQuyen(nguoiDung, donHang);

  return {
    ...banGhi,
    // Chỉ để giao diện gọi đúng vai trò (Bạn/Người mua/Người bán) thay cho mã tài khoản.
    nguoi_mua_id: donHang.nguoi_mua_id,
    nguoi_ban_id: donHang.nguoi_ban_id,
    co_the_them_bang_chung: !!duocBoSungBangChung(banGhi, donHang),
    bang_chung: await khoDuLieu.bangChung(id),
    ho_so_kiem_dinh: donHang.kiem_dinh_san_pham_id
      ? await require('./kiem-dinh').chiTiet(nguoiDung, donHang.kiem_dinh_san_pham_id)
      : null,
  };
}

function kiemTraDieuKienMo(
  nguoiDung: NguoiDungDangNhap,
  donHang: BanGhiSQL,
  lyDo: string,
  thoiGianHienTai: string,
  yeuCauHuy = false,
) {
  baoDam(
    lyDo !== 'KHONG_KHOP_HO_SO_KIEM_DINH' || donHang.kiem_dinh_san_pham_id,
    409,
    'Đơn không có hồ sơ kiểm định để đối chiếu',
  );
  baoDam(!yeuCauHuy || lyDo === 'KHAC', 400, 'Yêu cầu hủy sử dụng lý do Khác');

  const choPhepYeuCauHuy =
    yeuCauHuy && ['CHO_GUI_HANG', 'DA_THANH_TOAN', 'DA_GUI_HANG'].includes(donHang.trang_thai);
  const trongHanKiemTra =
    lyDo !== 'CHUA_NHAN_HANG' &&
    ['DA_GIAO', 'DANG_KIEM_TRA'].includes(donHang.trang_thai) &&
    donHang.han_kiem_tra &&
    !thoiGian.daHetHan(donHang.han_kiem_tra, thoiGianHienTai);
  const chuaNhanHang =
    lyDo === 'CHUA_NHAN_HANG' &&
    donHang.trang_thai === 'DA_GUI_HANG' &&
    donHang.moc_khieu_nai_chua_nhan &&
    thoiGian.daHetHan(donHang.moc_khieu_nai_chua_nhan, thoiGianHienTai);
  const adminCanThiep =
    nguoiDung.vai_tro === 'QUAN_TRI' &&
    ['CHO_GUI_HANG', 'DA_THANH_TOAN', 'DA_GUI_HANG', 'DA_GIAO', 'DANG_KIEM_TRA'].includes(
      donHang.trang_thai,
    );

  baoDam(
    trongHanKiemTra || chuaNhanHang || adminCanThiep || choPhepYeuCauHuy,
    409,
    'Chưa đủ điều kiện hoặc đã quá hạn mở tranh chấp',
  );
}

async function mo(nguoiDung: NguoiDungDangNhap, donHangId, duLieuNhap: unknown) {
  const dauVao = kiemTra.docSchema(moTranhChapSchema, duLieuNhap);
  const lyDo = kiemTra.giaTriLuaChon(
    dauVao.ly_do,
    [
      'CHUA_NHAN_HANG',
      'KHONG_DUNG_MO_TA',
      'HONG_HOC',
      'KHONG_KHOP_HO_SO_KIEM_DINH',
      'NGHI_NGO_TINH_XAC_THUC',
      'THIEU_PHU_KIEN',
      'KHAC',
    ],
    'Lý do',
  );
  const moTa = kiemTra.chuoi(dauVao.mo_ta, 'Mô tả', 20000);

  return coSoDuLieu.giaoDich(async () => {
    const donHang = batBuocTonTai(await cacDonHang.khoaDuLieu(kiemTra.id(donHangId)));

    if (nguoiDung.vai_tro !== 'QUAN_TRI') {
      dichVuDonHang.nguoiMua(nguoiDung, donHang);
    }

    const thoiGianHienTai = await coSoDuLieu.thoiGianHienTai();

    kiemTraDieuKienMo(nguoiDung, donHang, lyDo, thoiGianHienTai, dauVao.yeu_cau_huy);

    baoDam(!(await cacDonHang.tranhChapDangMo(donHang.id)), 409, 'Đơn đã có tranh chấp đang xử lý');

    const tienDangGiu = batBuocTonTai(await cacDonHang.tienTrungGian(donHang.id, true));

    baoDam(tienDangGiu.trang_thai === 'DANG_GIU', 409, 'Tiền không còn được giữ trung gian');

    const id = await khoBanGhi.them('tranh_chap', {
      don_hang_id: donHang.id,
      nguoi_mo_id: nguoiDung.id,
      ly_do: lyDo,
      mo_ta: dauVao.yeu_cau_huy ? `[Yêu cầu hủy/không tiếp tục nhận hàng] ${moTa}` : moTa,
    });
    await khoBanGhi.capNhat('don_hang', donHang.id, { trang_thai: 'DANG_TRANH_CHAP' });

    await ghiNhatKy(nguoiDung.id, 'MO_TRANH_CHAP', 'tranh_chap', id);
    await taoThongBao(
      donHang.nguoi_ban_id,
      'MO_TRANH_CHAP',
      'Người mua mở tranh chấp',
      'Vui lòng phản hồi và cung cấp bằng chứng.',
      `/disputes/${id}`,
    );

    return chiTiet(nguoiDung, id);
  });
}

async function phanHoiNguoiBan(nguoiDung: NguoiDungDangNhap, id, duLieuNhap: unknown) {
  const dauVao = kiemTra.docSchema(phanHoiSchema, duLieuNhap);
  const ketQuaHTTP = kiemTra.chuoi(dauVao.phan_hoi_nguoi_ban, 'Phản hồi', 20000);

  return coSoDuLieu.giaoDich(async () => {
    const { dispute: tranhChap, order: donHang } = batBuocTonTai(
      await khoDuLieu.khoaTranhChap(kiemTra.id(id)),
    );

    dichVuDonHang.nguoiBan(nguoiDung, donHang);
    baoDam(trangThaiDangMo.includes(tranhChap.trang_thai), 409, 'Tranh chấp đã kết thúc');

    await khoBanGhi.capNhat('tranh_chap', id, {
      phan_hoi_nguoi_ban: ketQuaHTTP,
      trang_thai:
        tranhChap.trang_thai === 'QUAN_TRI_DANG_XU_LY'
          ? 'QUAN_TRI_DANG_XU_LY'
          : 'NGUOI_BAN_DA_PHAN_HOI',
    });

    await ghiNhatKy(nguoiDung.id, 'PHAN_HOI_TRANH_CHAP', 'tranh_chap', id);
    await taoThongBao(
      donHang.nguoi_mua_id,
      'PHAN_HOI_TRANH_CHAP',
      'Người bán đã phản hồi',
      'Xem phản hồi tại chi tiết tranh chấp.',
      `/disputes/${id}`,
    );

    return chiTiet(nguoiDung, id);
  });
}

async function themBangChung(nguoiDung: NguoiDungDangNhap, id, duLieuNhap: unknown) {
  const dauVao = kiemTra.docSchema(bangChungSchema, duLieuNhap);

  await require('./tai-tep').kiemTraTepSoHuu(dauVao.duong_dan_tep, 'evidence', nguoiDung.id);

  const moTa = dauVao.mo_ta ? kiemTra.chuoi(dauVao.mo_ta, 'Mô tả', 500) : null;

  return coSoDuLieu.giaoDich(async () => {
    const { dispute: tranhChap, order: donHang } = batBuocTonTai(
      await khoDuLieu.khoaTranhChap(kiemTra.id(id)),
    );

    dichVuDonHang.kiemTraQuyen(nguoiDung, donHang);

    const cacBangChung = await khoDuLieu.bangChung(id);
    const daGan = cacBangChung.find((tep) => tep.duong_dan_tep === dauVao.duong_dan_tep);

    // Gửi lại sau mất phản hồi phải nhận đúng bằng chứng đã lưu, kể cả hồ sơ vừa đóng.
    if (daGan) {
      return daGan;
    }

    baoDam(duocBoSungBangChung(tranhChap, donHang), 409, 'Tranh chấp và xử lý hàng đã kết thúc');
    baoDam(cacBangChung.length < 30, 400, 'Tối đa 30 bằng chứng');

    const bangChungId = await khoBanGhi.them('tep_dinh_kem', {
      loai_tep: 'BANG_CHUNG_TRANH_CHAP',
      tranh_chap_id: id,
      nguoi_tai_len_id: nguoiDung.id,
      duong_dan_tep: dauVao.duong_dan_tep,
      loai_noi_dung: dauVao.duong_dan_tep.endsWith('.pdf') ? 'TAI_LIEU' : 'HINH_ANH',
      mo_ta: moTa,
    });

    await ghiNhatKy(nguoiDung.id, 'THEM_BANG_CHUNG', 'tranh_chap', id);

    return (await khoDuLieu.bangChung(id)).find((b) => cungId(b.id, bangChungId));
  });
}

async function tiepNhan(quanTri: NguoiDungDangNhap, id) {
  return coSoDuLieu.giaoDich(async () => {
    const { dispute: tranhChap } = batBuocTonTai(await khoDuLieu.khoaTranhChap(kiemTra.id(id)));

    baoDam(trangThaiDangMo.includes(tranhChap.trang_thai), 409, 'Tranh chấp đã kết thúc');

    await khoBanGhi.capNhat('tranh_chap', id, {
      trang_thai: 'QUAN_TRI_DANG_XU_LY',
      nguoi_xu_ly_id: quanTri.id,
    });

    await ghiNhatKy(quanTri.id, 'TIEP_NHAN_TRANH_CHAP', 'tranh_chap', id);

    return chiTiet(quanTri, id);
  });
}

async function giaiQuyet(quanTri: NguoiDungDangNhap, id, duLieuNhap: unknown) {
  baoDam(quanTri.vai_tro === 'QUAN_TRI', 403, 'Chỉ Admin được giải quyết tranh chấp');

  const dauVao = kiemTra.docSchema(giaiQuyetSchema, duLieuNhap);
  const ketQua = kiemTra.giaTriLuaChon(dauVao.ket_qua, ['NGUOI_MUA', 'NGUOI_BAN'], 'Kết quả');
  const tienYeuCau =
    dauVao.so_tien_hoan == null ? null : kiemTra.kiemTraTien(dauVao.so_tien_hoan, 'Số tiền hoàn');
  const giaiThich = kiemTra.chuoi(dauVao.ket_qua_xu_ly, 'Kết quả xử lý', 20000);

  return coSoDuLieu.giaoDich(async () => {
    const { dispute: tranhChap, order: donHang } = batBuocTonTai(
      await khoDuLieu.khoaTranhChap(kiemTra.id(id)),
    );

    baoDam(
      trangThaiDangMo.includes(tranhChap.trang_thai) && donHang.trang_thai === 'DANG_TRANH_CHAP',
      409,
      'Tranh chấp đã xử lý hoặc đơn không phù hợp',
    );
    // Quyết định chỉ sau khi Admin đã tiếp nhận hồ sơ (đã xem mô tả, phản hồi và bằng chứng).
    baoDam(
      tranhChap.trang_thai === 'QUAN_TRI_DANG_XU_LY',
      409,
      'Cần tiếp nhận tranh chấp trước khi ra quyết định',
    );

    const tienDangGiu = batBuocTonTai(await cacDonHang.tienTrungGian(donHang.id, true));

    baoDam(tienDangGiu.trang_thai === 'DANG_GIU', 409, 'Tiền trung gian đã được xử lý');
    baoDam(
      donViTienNho(donHang.so_tien_da_thu) === donViTienNho(donHang.tong_tien),
      409,
      'Đơn phải thu đủ tiền trước khi giải quyết tranh chấp',
    );

    const tienHoan = ketQua === 'NGUOI_MUA' ? tienDangGiu.so_tien : '0.00';

    baoDam(
      tienYeuCau == null || donViTienNho(tienYeuCau) === donViTienNho(tienHoan),
      400,
      'Chỉ hoàn toàn bộ tiền gồm phí vận chuyển hoặc giải ngân toàn bộ',
    );

    if (ketQua === 'NGUOI_MUA') {
      require('./hang-hoan').kiemTraHoanTien(donHang);
    } else {
      const hang = require('./hang-hoan').docXuLyHang(donHang);

      baoDam(
        !hang || ['DA_DUNG_THU_HOI', 'DA_GIAO_LAI_NGUOI_MUA'].includes(hang.trang_thai),
        409,
        'Hàng đã thu hồi phải gửi lại và xác nhận giao cho người mua trước khi giải ngân',
      );
      baoDam(
        hang?.ngay_giao_lai || donHang.ngay_giao_hang,
        409,
        'Chưa ghi nhận hàng đã giao; không giải ngân cho người bán',
      );

      const cacId = [donHang.nguoi_mua_id, donHang.nguoi_ban_id].sort((a, b) =>
        BigInt(a) < BigInt(b) ? -1 : 1,
      );

      for (const id of cacId) {
        const taiKhoan = batBuocTonTai(await khoBanGhi.layTheoId('nguoi_dung', id, true));

        baoDam(
          taiKhoan.trang_thai_tai_khoan === 'HOAT_DONG',
          409,
          'Có tài khoản bị khóa/tạm ngưng; cần xác minh trước khi giải ngân',
        );
      }
    }

    const thoiGianHienTai = await coSoDuLieu.thoiGianHienTai();
    const trangThaiGiuTien = ketQua === 'NGUOI_MUA' ? 'DA_HOAN_TIEN' : 'DA_GIAI_NGAN';
    const daGiaiNgan = chuoiTien(donViTienNho(tienDangGiu.so_tien) - donViTienNho(tienHoan));

    await khoBanGhi.capNhat('don_hang', donHang.id, {
      trang_thai_giu_tien: trangThaiGiuTien,
      so_tien_da_hoan: tienHoan,
      so_tien_da_giai_ngan: daGiaiNgan,
      ngay_hoan_tien: ketQua === 'NGUOI_MUA' ? thoiGianHienTai : null,
      ngay_giai_ngan: ketQua === 'NGUOI_BAN' ? thoiGianHienTai : null,
      can_admin_xu_ly: 0,
      ly_do_can_xu_ly: null,
      ghi_chu_giu_tien: `Mô phỏng: hoàn ${tienHoan}; giải ngân ${daGiaiNgan}. Tranh chấp #${id}.`,
    });

    if (trangThaiGiuTien === 'DA_HOAN_TIEN') {
      await cacDonHang.hoanCacThanhToan(donHang.id);
    }

    const daHuy = trangThaiGiuTien === 'DA_HOAN_TIEN';

    await khoBanGhi.capNhat('don_hang', donHang.id, {
      trang_thai: daHuy ? 'DA_HUY' : 'HOAN_THANH',
      ngay_huy: daHuy ? thoiGianHienTai : null,
      ly_do_huy: daHuy ? 'HOAN_TIEN_TRANH_CHAP' : null,
      ngay_hoan_thanh: daHuy ? null : thoiGianHienTai,
    });
    await khoBanGhi.capNhat('tranh_chap', id, {
      trang_thai: ketQua === 'NGUOI_MUA' ? 'GIAI_QUYET_CHO_NGUOI_MUA' : 'GIAI_QUYET_CHO_NGUOI_BAN',
      so_tien_hoan: tienHoan,
      ket_qua_xu_ly: giaiThich,
      nguoi_xu_ly_id: quanTri.id,
      ngay_giai_quyet: thoiGianHienTai,
    });

    await ghiNhatKy(quanTri.id, 'GIAI_QUYET_TRANH_CHAP', 'tranh_chap', id, {
      ket_qua: ketQua,
      so_tien_hoan: tienHoan,
      so_tien_giai_ngan: daGiaiNgan,
    });

    for (const nguoiDungId of [donHang.nguoi_mua_id, donHang.nguoi_ban_id]) {
      await taoThongBao(
        nguoiDungId,
        'GIAI_QUYET_TRANH_CHAP',
        'Tranh chấp đã được giải quyết',
        'Xem quyết định và số tiền được xử lý tại chi tiết tranh chấp.',
        `/disputes/${id}`,
      );
    }

    return chiTiet(quanTri, id);
  });
}

export { chiTiet, mo, phanHoiNguoiBan, themBangChung, tiepNhan, giaiQuyet };
