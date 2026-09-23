import type { NguoiDungDangNhap } from '../types/nghiep-vu';
import tepTin = require('node:fs/promises');
import duongDan = require('node:path');
import { randomUUID as taoMaNgauNhien } from 'node:crypto';
import { cauHinh } from '../config/moi-truong';
import kiemTra = require('../validations/du-lieu-dau-vao');
import { baoDam, cungId } from '../utils/loi';
import khoDuLieu = require('../repositories/he-thong');
const cacNhom = ['avatar', 'product', 'verification', 'evidence'];
function nhanDangLoaiTep(boDem) {
  if (
    boDem.length >= 8 &&
    boDem.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    return { ext: 'png', mime: 'image/png' };
  if (boDem.length >= 3 && boDem[0] === 255 && boDem[1] === 216 && boDem[2] === 255)
    return { ext: 'jpg', mime: 'image/jpeg' };
  if (
    boDem.length >= 12 &&
    boDem.toString('ascii', 0, 4) === 'RIFF' &&
    boDem.toString('ascii', 8, 12) === 'WEBP'
  )
    return { ext: 'webp', mime: 'image/webp' };
  if (boDem.length >= 5 && boDem.toString('ascii', 0, 5) === '%PDF-')
    return { ext: 'pdf', mime: 'application/pdf' };
  return null;
}
function viTriTep(nhom, chuSoHuu, ten) {
  kiemTra.giaTriLuaChon(nhom, cacNhom, 'Nhóm tệp');
  kiemTra.id(chuSoHuu);
  baoDam(/^[0-9a-f-]{36}\.(png|jpg|webp|pdf)$/.test(ten), 400, 'Tên tệp không hợp lệ');
  return {
    url: `/api/uploads/files/${nhom}/${chuSoHuu}/${ten}`,
    absolute: duongDan.join(cauHinh.uploadRoot, nhom, String(chuSoHuu), ten),
  };
}
async function luu(nguoiDung: NguoiDungDangNhap, nhom, tep) {
  kiemTra.giaTriLuaChon(nhom, cacNhom, 'Nhóm tệp');
  baoDam(tep, 400, 'Cần gửi tệp ở trường file');
  if (nhom === 'product')
    baoDam(nguoiDung.trang_thai_nguoi_ban === 'DA_XAC_MINH', 403, 'Cần xác minh người bán');
  const loai = nhanDangLoaiTep(tep.buffer);
  baoDam(loai, 400, 'Chỉ hỗ trợ PNG, JPEG, WebP hoặc PDF');
  baoDam(loai.ext !== 'pdf' || nhom === 'evidence', 400, 'Nhóm này chỉ nhận ảnh');
  baoDam(tep.mimetype === loai.mime, 400, 'Nội dung tệp không khớp loại khai báo');
  baoDam(tep.size <= (nhom === 'evidence' ? 10 : 5) * 1024 * 1024, 413, 'Tệp quá lớn');
  const dich = viTriTep(nhom, nguoiDung.id, `${taoMaNgauNhien()}.${loai.ext}`);
  await tepTin.mkdir(duongDan.dirname(dich.absolute), { recursive: true });
  await tepTin.writeFile(dich.absolute, tep.buffer, { flag: 'wx' });
  return { duong_dan: dich.url, loai: loai.mime, kich_thuoc: tep.size };
}
async function kiemTraTepSoHuu(giaTri, nhom, nguoiDungId) {
  const giaTriTho = kiemTra.chuoi(giaTri, 'Đường dẫn tệp', 255);
  const tienTo = `/api/uploads/files/${nhom}/${nguoiDungId}/`;
  baoDam(giaTriTho.startsWith(tienTo), 403, 'Tệp phải do tài khoản này tải lên đúng nhóm');
  const dich = viTriTep(nhom, nguoiDungId, giaTriTho.slice(tienTo.length));
  try {
    baoDam((await tepTin.stat(dich.absolute)).isFile(), 400, 'Tệp không tồn tại');
  } catch (loi) {
    if (loi.code === 'ENOENT') baoDam(false, 400, 'Tệp không tồn tại');
    throw loi;
  }
  return dich;
}
async function taiTep(nguoiDung: NguoiDungDangNhap, nhom, chuSoHuu, ten) {
  const dich = viTriTep(nhom, chuSoHuu, ten);
  if (['verification', 'evidence'].includes(nhom)) {
    baoDam(nguoiDung, 401, 'Vui lòng đăng nhập để xem tệp');
    const duocPhep =
      nguoiDung.vai_tro === 'QUAN_TRI' ||
      cungId(nguoiDung.id, chuSoHuu) ||
      (nhom === 'evidence' && (await khoDuLieu.quyenXemBangChung(dich.url, nguoiDung.id)));
    baoDam(duocPhep, 403, 'Không có quyền xem tệp');
  }
  try {
    baoDam((await tepTin.stat(dich.absolute)).isFile(), 404, 'Không tìm thấy tệp');
  } catch (loi) {
    if (loi.code === 'ENOENT') baoDam(false, 404, 'Không tìm thấy tệp');
    throw loi;
  }
  return dich;
}
export = { luu, kiemTraTepSoHuu, taiTep, nhanDangLoaiTep };
