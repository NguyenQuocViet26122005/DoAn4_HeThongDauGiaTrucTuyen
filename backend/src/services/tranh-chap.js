const coSoDuLieu = require('../repositories/ket-noi');
const khoBanGhi = require('../repositories/ban-ghi');
const khoDuLieu = require('../repositories/tuong-tac');
const cacDonHang = require('../repositories/don-hang');
const dichVuDonHang = require('./don-hang');
const { ghiNhatKy, taoThongBao } = require('./nhat-ky-thong-bao');
const kiemTra = require('../validators/du-lieu-dau-vao');
const { baoDam, batBuocTonTai, cungId } = require('../utils/loi');
const { donViTienNho, chuoiTien } = require('../utils/tien');
const thoiGian = require('../utils/thoi-gian');
const trangThaiDangMo = ['DANG_MO', 'NGUOI_BAN_DA_PHAN_HOI', 'QUAN_TRI_DANG_XU_LY'];
async function chiTiet(nguoiDung, id) {
  const banGhi = batBuocTonTai(await khoBanGhi.layTheoId('tranh_chap', kiemTra.id(id)));
  dichVuDonHang.kiemTraQuyen(
    nguoiDung,
    batBuocTonTai(await khoBanGhi.layTheoId('don_hang', banGhi.don_hang_id)),
  );
  return { ...banGhi, bang_chung: await khoDuLieu.bangChung(id) };
}
async function mo(nguoiDung, donHangId, dauVao) {
  kiemTra.kiemTraNoiDung(dauVao, ['ly_do', 'mo_ta']);
  const lyDo = kiemTra.giaTriLuaChon(
    dauVao.ly_do,
    ['CHUA_NHAN_HANG', 'KHONG_DUNG_MO_TA', 'HONG_HOC', 'HANG_GIA', 'KHAC'],
    'Lý do',
  );
  const moTa = kiemTra.chuoi(dauVao.mo_ta, 'Mô tả', 20000);
  return coSoDuLieu.giaoDich(async () => {
    const donHang = batBuocTonTai(await cacDonHang.khoaDuLieu(kiemTra.id(donHangId)));
    dichVuDonHang.nguoiMua(nguoiDung, donHang);
    const thoiGianHienTai = await coSoDuLieu.thoiGianHienTai();
    baoDam(
      ['DA_GIAO', 'DANG_KIEM_TRA'].includes(donHang.trang_thai) &&
        donHang.han_kiem_tra &&
        !thoiGian.daHetHan(donHang.han_kiem_tra, thoiGianHienTai),
      409,
      'Chỉ mở tranh chấp trong thời gian kiểm tra hàng',
    );
    baoDam(!(await cacDonHang.tranhChapDangMo(donHang.id)), 409, 'Đơn đã có tranh chấp đang xử lý');
    const tienDangGiu = batBuocTonTai(await cacDonHang.tienTrungGian(donHang.id, true));
    baoDam(tienDangGiu.trang_thai === 'DANG_GIU', 409, 'Tiền không còn được giữ trung gian');
    const id = await khoBanGhi.them('tranh_chap', {
      don_hang_id: donHang.id,
      nguoi_mo_id: nguoiDung.id,
      ly_do: lyDo,
      mo_ta: moTa,
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
async function phanHoiNguoiBan(nguoiDung, id, dauVao) {
  kiemTra.kiemTraNoiDung(dauVao, ['phan_hoi_nguoi_ban']);
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
async function themBangChung(nguoiDung, id, dauVao) {
  kiemTra.kiemTraNoiDung(dauVao, ['duong_dan_tep', 'mo_ta']);
  await require('./tai-tep').kiemTraTepSoHuu(dauVao.duong_dan_tep, 'evidence', nguoiDung.id);
  const moTa = dauVao.mo_ta ? kiemTra.chuoi(dauVao.mo_ta, 'Mô tả', 500) : null;
  return coSoDuLieu.giaoDich(async () => {
    const { dispute: tranhChap, order: donHang } = batBuocTonTai(
      await khoDuLieu.khoaTranhChap(kiemTra.id(id)),
    );
    dichVuDonHang.kiemTraQuyen(nguoiDung, donHang);
    baoDam(trangThaiDangMo.includes(tranhChap.trang_thai), 409, 'Tranh chấp đã kết thúc');
    baoDam((await khoDuLieu.bangChung(id)).length < 30, 400, 'Tối đa 30 bằng chứng');
    const bangChungId = await khoBanGhi.them('bang_chung_tranh_chap', {
      tranh_chap_id: id,
      nguoi_tai_len_id: nguoiDung.id,
      duong_dan_tep: dauVao.duong_dan_tep,
      loai_bang_chung: dauVao.duong_dan_tep.endsWith('.pdf') ? 'TAI_LIEU' : 'HINH_ANH',
      mo_ta: moTa,
    });
    await ghiNhatKy(nguoiDung.id, 'THEM_BANG_CHUNG', 'tranh_chap', id);
    return khoBanGhi.layTheoId('bang_chung_tranh_chap', bangChungId);
  });
}
async function tiepNhan(quanTri, id) {
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
async function giaiQuyet(quanTri, id, dauVao) {
  kiemTra.kiemTraNoiDung(dauVao, ['ket_qua', 'so_tien_hoan', 'ket_qua_xu_ly']);
  const ketQua = kiemTra.giaTriLuaChon(dauVao.ket_qua, ['NGUOI_MUA', 'NGUOI_BAN'], 'Kết quả');
  const tienHoan = kiemTra.kiemTraTien(dauVao.so_tien_hoan ?? 0, 'Số tiền hoàn');
  const giaiThich = kiemTra.chuoi(dauVao.ket_qua_xu_ly, 'Kết quả xử lý', 20000);
  baoDam(
    ketQua === 'NGUOI_MUA' || donViTienNho(tienHoan) === 0n,
    400,
    'Kết quả cho người bán không kèm hoàn tiền',
  );
  baoDam(
    ketQua === 'NGUOI_BAN' || donViTienNho(tienHoan) > 0n,
    400,
    'Kết quả cho người mua cần số tiền hoàn lớn hơn 0',
  );
  return coSoDuLieu.giaoDich(async () => {
    const { dispute: tranhChap, order: donHang } = batBuocTonTai(
      await khoDuLieu.khoaTranhChap(kiemTra.id(id)),
    );
    baoDam(
      trangThaiDangMo.includes(tranhChap.trang_thai) && donHang.trang_thai === 'DANG_TRANH_CHAP',
      409,
      'Tranh chấp đã xử lý hoặc đơn không phù hợp',
    );
    const tienDangGiu = batBuocTonTai(await cacDonHang.tienTrungGian(donHang.id, true));
    baoDam(tienDangGiu.trang_thai === 'DANG_GIU', 409, 'Tiền trung gian đã được xử lý');
    baoDam(
      donViTienNho(tienHoan) <= donViTienNho(tienDangGiu.so_tien),
      400,
      'Số tiền hoàn vượt số tiền đang giữ',
    );
    const thoiGianHienTai = await coSoDuLieu.thoiGianHienTai();
    let trangThaiGiuTien = 'DA_GIAI_NGAN';
    if (donViTienNho(tienHoan) > 0n)
      trangThaiGiuTien =
        donViTienNho(tienHoan) === donViTienNho(tienDangGiu.so_tien)
          ? 'DA_HOAN_TIEN'
          : 'HOAN_TIEN_MOT_PHAN';
    const daGiaiNgan = chuoiTien(donViTienNho(tienDangGiu.so_tien) - donViTienNho(tienHoan));
    await khoBanGhi.capNhat('giu_tien_trung_gian', tienDangGiu.id, {
      trang_thai: trangThaiGiuTien,
      ngay_hoan_tien: donViTienNho(tienHoan) > 0n ? thoiGianHienTai : null,
      ngay_giai_ngan: donViTienNho(daGiaiNgan) > 0n ? thoiGianHienTai : null,
      ghi_chu: `Mô phỏng: hoàn ${tienHoan}; giải ngân ${daGiaiNgan}. Tranh chấp #${id}.`,
    });
    if (trangThaiGiuTien === 'DA_HOAN_TIEN') await cacDonHang.hoanCacThanhToan(donHang.id);
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
    for (const nguoiDungId of [donHang.nguoi_mua_id, donHang.nguoi_ban_id])
      await taoThongBao(
        nguoiDungId,
        'GIAI_QUYET_TRANH_CHAP',
        'Tranh chấp đã được giải quyết',
        'Xem kết quả và số tiền mô phỏng tại chi tiết tranh chấp.',
        `/disputes/${id}`,
      );
    return chiTiet(quanTri, id);
  });
}
module.exports = { chiTiet, mo, phanHoiNguoiBan, themBangChung, tiepNhan, giaiQuyet };
