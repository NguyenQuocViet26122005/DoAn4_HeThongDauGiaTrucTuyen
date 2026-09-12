const { baoDam } = require('../utils/loi');
const { donViTienNho, chuoiTien } = require('../utils/tien');
function chuoi(giaTri, nhan, lonHon = 255, nhoHon = 1) {
  baoDam(typeof giaTri === 'string', 400, `${nhan} phải là chuỗi`);
  const ketQua = giaTri.trim();
  baoDam(
    ketQua.length >= nhoHon && ketQua.length <= lonHon,
    400,
    `${nhan} phải dài ${nhoHon}–${lonHon} ký tự`,
  );
  return ketQua;
}
function id(giaTri, nhan = 'ID') {
  baoDam(
    (typeof giaTri === 'string' || Number.isSafeInteger(giaTri)) &&
      /^[1-9]\d{0,19}$/.test(String(giaTri)),
    400,
    `${nhan} không hợp lệ`,
  );
  baoDam(BigInt(giaTri) <= 18446744073709551615n, 400, `${nhan} vượt giới hạn`);
  return String(giaTri);
}
function soNguyen(giaTri, nhan, nhoHon = 0, lonHon = 1000000) {
  baoDam(
    (typeof giaTri === 'number' || (typeof giaTri === 'string' && /^\d+$/.test(giaTri))) &&
      Number.isSafeInteger(Number(giaTri)),
    400,
    `${nhan} phải là số nguyên`,
  );
  const n = Number(giaTri);
  baoDam(n >= nhoHon && n <= lonHon, 400, `${nhan} ngoài giới hạn`);
  return n;
}
function giaTriLuaChon(giaTri, cacGiaTri, nhan) {
  baoDam(cacGiaTri.includes(giaTri), 400, `${nhan} không hợp lệ`);
  return giaTri;
}
function giaTriDungSai(giaTri, nhan) {
  baoDam([true, false, 0, 1].includes(giaTri), 400, `${nhan} phải là true/false`);
  return giaTri ? 1 : 0;
}
function kiemTraTien(giaTri, nhan, duong = false) {
  const n = donViTienNho(giaTri, nhan);
  baoDam(!duong || n > 0n, 400, `${nhan} phải lớn hơn 0`);
  return chuoiTien(n);
}
function kiemTraNoiDung(giaTri, duocPhep) {
  baoDam(
    giaTri && typeof giaTri === 'object' && !Array.isArray(giaTri),
    400,
    'Nội dung JSON không hợp lệ',
  );
  baoDam(
    Object.keys(giaTri).every((khoa) => duocPhep.includes(khoa)),
    400,
    'Nội dung có trường không được phép',
  );
  return giaTri;
}
function phanTrang(truyVan = {}) {
  const trang = soNguyen(truyVan.page ?? 1, 'page', 1, 100000);
  const gioiHan = soNguyen(truyVan.limit ?? 20, 'limit', 1, 100);
  return { page: trang, limit: gioiHan, offset: (trang - 1) * gioiHan };
}
function thuDienTu(giaTri) {
  const ketQua = chuoi(giaTri, 'Email', 150).toLowerCase();
  baoDam(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ketQua), 400, 'Email không hợp lệ');
  return ketQua;
}
function matKhau(giaTri) {
  baoDam(
    typeof giaTri === 'string' && giaTri.length >= 8 && Buffer.byteLength(giaTri) <= 72,
    400,
    'Mật khẩu cần ít nhất 8 ký tự và tối đa 72 byte',
  );
  return giaTri;
}
function soDienThoai(giaTri) {
  const ketQua = chuoi(giaTri, 'Số điện thoại', 20);
  baoDam(/^\+?[0-9 ()-]{8,20}$/.test(ketQua), 400, 'Số điện thoại không hợp lệ');
  return ketQua;
}
module.exports = {
  chuoi,
  id,
  soNguyen,
  giaTriLuaChon,
  giaTriDungSai,
  kiemTraTien,
  kiemTraNoiDung,
  phanTrang,
  thuDienTu,
  matKhau,
  soDienThoai,
};
