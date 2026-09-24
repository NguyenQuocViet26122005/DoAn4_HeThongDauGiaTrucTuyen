import type { NguoiDungDangNhap } from './nghiep-vu';
declare global {
  namespace Express {
    interface Request {
      user?: NguoiDungDangNhap;
    }
  }
}
export {};
