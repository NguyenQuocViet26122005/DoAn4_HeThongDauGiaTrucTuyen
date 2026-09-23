import type { NguoiDungDangNhap } from '../types/nghiep-vu';
import { dangKySchema, dangNhapSchema, diaChiSchema, trangThaiTaiKhoanSchema } from '../validations/nguoi-dung.schema';
import type { DuLieuGhi } from '../types/nghiep-vu';
import bcrypt = require('bcrypt');
import jwt = require('jsonwebtoken');
import { randomUUID as taoMaNgauNhien } from 'node:crypto';
import { cauHinh } from '../config/moi-truong';
import coSoDuLieu = require('../repositories/ket-noi');
import khoBanGhi = require('../repositories/ban-ghi');
import cacNguoiDung = require('../repositories/nguoi-dung');
import kiemTra = require('../validations/du-lieu-dau-vao');
import { baoDam, batBuocTonTai, cungId } from '../utils/loi';
import { nguoiDungAnToan } from '../utils/du-lieu-cong-khai';
import { ghiNhatKy, taoThongBao } from './nhat-ky-thong-bao';
const maBamGia = bcrypt.hashSync(taoMaNgauNhien(), 12);
async function dangKy(duLieuNhap: unknown) {
  const dauVao = kiemTra.docSchema(dangKySchema, duLieuNhap);
  const duLieu = {
    ho_ten: kiemTra.chuoi(dauVao.ho_ten, 'Họ tên', 100),
    email: kiemTra.thuDienTu(dauVao.email),
    mat_khau_bam: await bcrypt.hash(kiemTra.matKhau(dauVao.mat_khau), 12),
    so_dien_thoai: dauVao.so_dien_thoai ? kiemTra.soDienThoai(dauVao.so_dien_thoai) : null,
  };
  return coSoDuLieu.giaoDich(async () => {
    baoDam(!(await cacNguoiDung.timTheoEmail(duLieu.email)), 409, 'Email đã được sử dụng');
    const id = await khoBanGhi.them('nguoi_dung', duLieu);
    await ghiNhatKy(id, 'DANG_KY', 'nguoi_dung', id);
    return nguoiDungAnToan(await cacNguoiDung.layTheoId(id));
  });
}
async function dangNhap(duLieuNhap: unknown) {
  const dauVao = kiemTra.docSchema(dangNhapSchema, duLieuNhap);
  const thuDienTu = kiemTra.thuDienTu(dauVao.email);
  baoDam(
    typeof dauVao.mat_khau === 'string' &&
      dauVao.mat_khau.length > 0 &&
      Buffer.byteLength(dauVao.mat_khau) <= 72,
    400,
    'Mật khẩu không hợp lệ',
  );
  const nguoiDung = await cacNguoiDung.timTheoEmail(thuDienTu);
  const hopLe = await bcrypt.compare(dauVao.mat_khau, nguoiDung?.mat_khau_bam || maBamGia);
  baoDam(nguoiDung && hopLe, 401, 'Email hoặc mật khẩu không đúng');
  baoDam(
    nguoiDung.trang_thai_tai_khoan === 'HOAT_DONG',
    403,
    'Tài khoản đang bị khóa hoặc tạm ngưng',
  );
  baoDam(cauHinh.jwtSecret, 503, 'Máy chủ chưa cấu hình JWT_SECRET');
  const maTruyCap = jwt.sign({}, cauHinh.jwtSecret, {
    algorithm: 'HS256',
    subject: String(nguoiDung.id),
    issuer: 'doan4-daugia',
    audience: 'doan4-client',
    expiresIn: cauHinh.jwtExpiresIn,
  });
  await khoBanGhi.capNhat('nguoi_dung', nguoiDung.id, {
    lan_dang_nhap_cuoi: await coSoDuLieu.thoiGianHienTai(),
  });
  return {
    token: maTruyCap,
    token_type: 'Bearer',
    expires_in: 28800,
    user: nguoiDungAnToan(nguoiDung),
  };
}
async function hoSo(nguoiDung: NguoiDungDangNhap) {
  return nguoiDungAnToan(batBuocTonTai(await cacNguoiDung.layTheoId(nguoiDung.id)));
}
async function capNhatHoSo(nguoiDung: NguoiDungDangNhap, dauVao) {
  kiemTra.kiemTraNoiDung(dauVao, ['ho_ten', 'so_dien_thoai', 'anh_dai_dien']);
  const duLieu: DuLieuGhi = {};
  if (dauVao.ho_ten !== undefined) duLieu.ho_ten = kiemTra.chuoi(dauVao.ho_ten, 'Họ tên', 100);
  if (dauVao.so_dien_thoai !== undefined)
    duLieu.so_dien_thoai = kiemTra.soDienThoai(dauVao.so_dien_thoai);
  if (dauVao.anh_dai_dien !== undefined) {
    await require('./tai-tep').kiemTraTepSoHuu(dauVao.anh_dai_dien, 'avatar', nguoiDung.id);
    duLieu.anh_dai_dien = dauVao.anh_dai_dien;
  }
  baoDam(Object.keys(duLieu).length, 400, 'Không có dữ liệu cập nhật');
  return coSoDuLieu.giaoDich(async () => {
    await cacNguoiDung.layTheoId(nguoiDung.id, true);
    await khoBanGhi.capNhat('nguoi_dung', nguoiDung.id, duLieu);
    await ghiNhatKy(nguoiDung.id, 'CAP_NHAT_HO_SO', 'nguoi_dung', nguoiDung.id);
    return hoSo(nguoiDung);
  });
}
function duLieuDiaChi(duLieuNhap: unknown) {
  const dauVao = kiemTra.docSchema(diaChiSchema, duLieuNhap);
  return {
    ten_nguoi_nhan: kiemTra.chuoi(dauVao.ten_nguoi_nhan, 'Tên người nhận', 100),
    sdt_nguoi_nhan: kiemTra.soDienThoai(dauVao.sdt_nguoi_nhan),
    tinh_thanh: kiemTra.chuoi(dauVao.tinh_thanh, 'Tỉnh thành', 100),
    quan_huyen: kiemTra.chuoi(dauVao.quan_huyen, 'Quận huyện', 100),
    phuong_xa: kiemTra.chuoi(dauVao.phuong_xa, 'Phường xã', 100),
    dia_chi_chi_tiet: kiemTra.chuoi(dauVao.dia_chi_chi_tiet, 'Địa chỉ', 255),
    la_mac_dinh: kiemTra.giaTriDungSai(dauVao.la_mac_dinh ?? false, 'Địa chỉ mặc định'),
  };
}
async function luuDiaChi(nguoiDung: NguoiDungDangNhap, idCanSua, dauVao) {
  const duLieu = duLieuDiaChi(dauVao);
  return coSoDuLieu.giaoDich(async () => {
    let id = idCanSua;
    await cacNguoiDung.layTheoId(nguoiDung.id, true);
    if (id)
      baoDam(
        cungId(
          batBuocTonTai(await khoBanGhi.layTheoId('dia_chi_nguoi_dung', kiemTra.id(id), true))
            .nguoi_dung_id,
          nguoiDung.id,
        ),
        403,
        'Địa chỉ không thuộc tài khoản',
      );
    const daCo = await cacNguoiDung.danhSachDiaChi(nguoiDung.id);
    baoDam(id || daCo.length < 20, 400, 'Tối đa 20 địa chỉ');
    if (!daCo.length) duLieu.la_mac_dinh = 1;
    if (duLieu.la_mac_dinh) await cacNguoiDung.boDiaChiMacDinh(nguoiDung.id);
    if (id) await khoBanGhi.capNhat('dia_chi_nguoi_dung', id, duLieu);
    else
      id = await khoBanGhi.them('dia_chi_nguoi_dung', { ...duLieu, nguoi_dung_id: nguoiDung.id });
    return khoBanGhi.layTheoId('dia_chi_nguoi_dung', id);
  });
}
async function xoaDiaChi(nguoiDung: NguoiDungDangNhap, id) {
  return coSoDuLieu.giaoDich(async () => {
    await cacNguoiDung.layTheoId(nguoiDung.id, true);
    const diaChi = batBuocTonTai(
      await khoBanGhi.layTheoId('dia_chi_nguoi_dung', kiemTra.id(id), true),
    );
    baoDam(cungId(diaChi.nguoi_dung_id, nguoiDung.id), 403, 'Địa chỉ không thuộc tài khoản');
    const daCo = await cacNguoiDung.danhSachDiaChi(nguoiDung.id);
    baoDam(
      daCo.length > 1 || !(await cacNguoiDung.coCamKet(nguoiDung.id)),
      409,
      'Cần giữ ít nhất một địa chỉ khi đang tham gia đấu giá',
    );
    await khoBanGhi.xoa('dia_chi_nguoi_dung', id);
    if (diaChi.la_mac_dinh && daCo.length > 1)
      await khoBanGhi.capNhat('dia_chi_nguoi_dung', daCo.find((x) => !cungId(x.id, id)).id, {
        la_mac_dinh: 1,
      });
  });
}
async function guiXacMinh(nguoiDung: NguoiDungDangNhap, dauVao) {
  kiemTra.kiemTraNoiDung(dauVao, [
    'loai_giay_to',
    'so_giay_to',
    'anh_mat_truoc',
    'anh_mat_sau',
    'anh_selfie',
    'ten_ngan_hang',
    'so_tai_khoan',
    'chu_tai_khoan',
  ]);
  const duLieu = {
    loai_giay_to: kiemTra.giaTriLuaChon(
      dauVao.loai_giay_to,
      ['CCCD', 'HO_CHIEU', 'KHAC'],
      'Loại giấy tờ',
    ),
    so_giay_to: kiemTra.chuoi(dauVao.so_giay_to, 'Số giấy tờ', 50),
    ten_ngan_hang: kiemTra.chuoi(dauVao.ten_ngan_hang, 'Ngân hàng', 100),
    so_tai_khoan: kiemTra.chuoi(dauVao.so_tai_khoan, 'Số tài khoản', 50),
    chu_tai_khoan: kiemTra.chuoi(dauVao.chu_tai_khoan, 'Chủ tài khoản', 100),
  };
  for (const truong of ['anh_mat_truoc', 'anh_mat_sau', 'anh_selfie']) {
    if (truong === 'anh_mat_sau' && dauVao.loai_giay_to !== 'CCCD' && !dauVao[truong]) {
      duLieu[truong] = null;
      continue;
    }
    await require('./tai-tep').kiemTraTepSoHuu(dauVao[truong], 'verification', nguoiDung.id);
    duLieu[truong] = dauVao[truong];
  }
  return coSoDuLieu.giaoDich(async () => {
    const hienTai = batBuocTonTai(await cacNguoiDung.layTheoId(nguoiDung.id, true));
    baoDam(hienTai.vai_tro === 'NGUOI_DUNG', 403, 'Tài khoản quản trị không đăng ký bán');
    baoDam(
      ['CHUA_DANG_KY', 'TU_CHOI'].includes(hienTai.trang_thai_nguoi_ban),
      409,
      'Hồ sơ đã được gửi hoặc đã xác minh',
    );
    const id = await khoBanGhi.them('xac_minh_nguoi_ban', {
      ...duLieu,
      nguoi_dung_id: nguoiDung.id,
    });
    await khoBanGhi.capNhat('nguoi_dung', nguoiDung.id, { trang_thai_nguoi_ban: 'CHO_XU_LY' });
    await ghiNhatKy(nguoiDung.id, 'GUI_XAC_MINH', 'xac_minh_nguoi_ban', id);
    return khoBanGhi.layTheoId('xac_minh_nguoi_ban', id);
  });
}
async function duyetXacMinh(quanTri: NguoiDungDangNhap, id, dauVao) {
  kiemTra.kiemTraNoiDung(dauVao, ['trang_thai', 'ly_do_tu_choi']);
  const trangThai = kiemTra.giaTriLuaChon(
    dauVao.trang_thai,
    ['DA_XAC_MINH', 'TU_CHOI'],
    'Trạng thái',
  );
  const lyDo =
    trangThai === 'TU_CHOI' ? kiemTra.chuoi(dauVao.ly_do_tu_choi, 'Lý do từ chối', 500) : null;
  return coSoDuLieu.giaoDich(async () => {
    const banDau = batBuocTonTai(await khoBanGhi.layTheoId('xac_minh_nguoi_ban', kiemTra.id(id)));
    await cacNguoiDung.layTheoId(banDau.nguoi_dung_id, true);
    const banGhi = batBuocTonTai(await khoBanGhi.layTheoId('xac_minh_nguoi_ban', id, true));
    baoDam(banGhi.trang_thai === 'CHO_XU_LY', 409, 'Hồ sơ đã được xử lý');
    await khoBanGhi.capNhat('xac_minh_nguoi_ban', id, {
      trang_thai: trangThai,
      ly_do_tu_choi: lyDo,
      nguoi_duyet_id: quanTri.id,
      ngay_duyet: await coSoDuLieu.thoiGianHienTai(),
    });
    await khoBanGhi.capNhat('nguoi_dung', banGhi.nguoi_dung_id, {
      trang_thai_nguoi_ban: trangThai,
    });
    await ghiNhatKy(quanTri.id, 'DUYET_XAC_MINH', 'xac_minh_nguoi_ban', id, {
      trang_thai: trangThai,
    });
    await taoThongBao(
      banGhi.nguoi_dung_id,
      'XAC_MINH_NGUOI_BAN',
      'Kết quả xác minh người bán',
      lyDo || 'Hồ sơ của bạn đã được xác minh.',
      '/seller/verification',
    );
    return khoBanGhi.layTheoId('xac_minh_nguoi_ban', id);
  });
}
async function doiTrangThaiTaiKhoan(quanTri: NguoiDungDangNhap, id, duLieuNhap: unknown) {
  const dauVao = kiemTra.docSchema(trangThaiTaiKhoanSchema, duLieuNhap);
  const trangThai = kiemTra.giaTriLuaChon(
    dauVao.trang_thai_tai_khoan,
    ['HOAT_DONG', 'BI_KHOA', 'TAM_NGUNG'],
    'Trạng thái tài khoản',
  );
  const lyDo = kiemTra.chuoi(dauVao.ly_do, 'Lý do', 500);
  return coSoDuLieu.giaoDich(async () => {
    const banGhi = batBuocTonTai(await cacNguoiDung.layTheoId(kiemTra.id(id), true));
    baoDam(
      banGhi.vai_tro !== 'QUAN_TRI',
      403,
      'Không thay đổi trạng thái tài khoản quản trị qua API này',
    );
    await khoBanGhi.capNhat('nguoi_dung', id, { trang_thai_tai_khoan: trangThai });
    await ghiNhatKy(quanTri.id, 'DOI_TRANG_THAI_TAI_KHOAN', 'nguoi_dung', id, {
      trang_thai: trangThai,
      ly_do: lyDo,
    });
    return nguoiDungAnToan(await cacNguoiDung.layTheoId(id));
  });
}
export = {
  dangKy,
  dangNhap,
  hoSo,
  capNhatHoSo,
  luuDiaChi,
  xoaDiaChi,
  guiXacMinh,
  duyetXacMinh,
  doiTrangThaiTaiKhoan,
};
