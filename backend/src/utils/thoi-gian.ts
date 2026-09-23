import { cauHinh } from '../config/moi-truong';
import { baoDam } from './loi';
function doiThanhNgay(giaTri) {
  if (giaTri instanceof Date) return giaTri;
  return new Date(
    String(giaTri).replace(' ', 'T') +
      (/Z$|[+-]\d\d:\d\d$/.test(String(giaTri)) ? '' : cauHinh.dbTimezone),
  );
}
function ngaySQL(giaTri) {
  const d = doiThanhNgay(giaTri);
  const dau = cauHinh.dbTimezone[0] === '-' ? -1 : 1;
  const soPhut = Number(cauHinh.dbTimezone.slice(1, 3)) * 60 + Number(cauHinh.dbTimezone.slice(4));
  return new Date(d.getTime() + dau * soPhut * 60000).toISOString().slice(0, 19).replace('T', ' ');
}
function kiemTraNgayNhap(giaTri, nhan) {
  baoDam(
    typeof giaTri === 'string' &&
      /^\d{4}-\d\d-\d\dT\d\d:\d\d(:\d\d(\.\d{1,3})?)?(Z|[+-]\d\d:\d\d)$/.test(giaTri),
    400,
    `${nhan} phải là thời gian ISO có múi giờ`,
  );
  baoDam(Number.isFinite(new Date(giaTri).getTime()), 400, `${nhan} không hợp lệ`);
  return ngaySQL(new Date(giaTri));
}
const congGiay = (giaTri, soGiay) =>
  ngaySQL(new Date(doiThanhNgay(giaTri).getTime() + soGiay * 1000));
const daHetHan = (hanChot, thoiGianHienTai) =>
  hanChot != null && doiThanhNgay(hanChot).getTime() <= doiThanhNgay(thoiGianHienTai).getTime();
export = { doiThanhNgay, ngaySQL, kiemTraNgayNhap, congGiay, daHetHan };
