import type { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt = require('jsonwebtoken');
import { cauHinh } from '../config/moi-truong';
import cacNguoiDung = require('../repositories/nguoi-dung');
import { baoDam, LoiUngDung } from '../utils/loi';
import { nguoiDungAnToan } from '../utils/du-lieu-cong-khai';
async function xacThucToken(maTruyCap) {
  baoDam(typeof maTruyCap === 'string' && maTruyCap.length <= 4096, 401, 'Vui lòng đăng nhập');
  let noiDungToken;
  try {
    noiDungToken = jwt.verify(maTruyCap, cauHinh.jwtSecret, {
      algorithms: ['HS256'],
      issuer: 'doan4-daugia',
      audience: 'doan4-client',
    });
  } catch {
    throw new LoiUngDung(401, 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn');
  }
  baoDam(
    typeof noiDungToken.sub === 'string' && /^[1-9]\d{0,19}$/.test(noiDungToken.sub),
    401,
    'Phiên đăng nhập không hợp lệ',
  );
  const nguoiDung = await cacNguoiDung.layTheoId(noiDungToken.sub);
  baoDam(nguoiDung, 401, 'Tài khoản không tồn tại');
  baoDam(
    nguoiDung.trang_thai_tai_khoan === 'HOAT_DONG',
    403,
    'Tài khoản đang bị khóa hoặc tạm ngưng',
  );
  return nguoiDungAnToan(nguoiDung);
}
function yeuCauDangNhap(khongBatBuoc = false): RequestHandler {
  return async (yeuCau, phanHoi, tiepTheo) => {
    try {
      const tieuDeHTTP = yeuCau.headers.authorization;
      if (!tieuDeHTTP && khongBatBuoc) return tiepTheo();
      baoDam(
        typeof tieuDeHTTP === 'string' && /^Bearer \S+$/.test(tieuDeHTTP),
        401,
        'Vui lòng đăng nhập bằng Bearer token',
      );
      yeuCau.user = await xacThucToken(tieuDeHTTP.slice(7));
      tiepTheo();
    } catch (loi) {
      tiepTheo(loi);
    }
  };
}
function quanTri(yeuCau: Request, phanHoi: Response, tiepTheo: NextFunction) {
  try {
    baoDam(yeuCau.user?.vai_tro === 'QUAN_TRI', 403, 'Chỉ quản trị viên được thực hiện');
    tiepTheo();
  } catch (e) {
    tiepTheo(e);
  }
}
function nguoiBan(yeuCau: Request, phanHoi: Response, tiepTheo: NextFunction) {
  try {
    baoDam(
      yeuCau.user?.vai_tro === 'NGUOI_DUNG' && yeuCau.user.trang_thai_nguoi_ban === 'DA_XAC_MINH',
      403,
      'Cần được xác minh người bán',
    );
    tiepTheo();
  } catch (e) {
    tiepTheo(e);
  }
}
export = { yeuCauDangNhap, quanTri, nguoiBan, xacThucToken };
