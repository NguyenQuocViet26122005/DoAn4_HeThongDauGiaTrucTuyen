import { create } from 'zustand';
import type { NguoiDung } from '../types/du-lieu';
interface PhienDangNhap {
  nguoiDung: NguoiDung | null;
  dangKhoiTao: boolean;
  capNhat: (nguoiDung: NguoiDung | null) => void;
  dangNhap: (token: string, nguoiDung: NguoiDung) => void;
  dangXuat: () => void;
}
export const usePhienDangNhap = create<PhienDangNhap>((dat) => ({
  nguoiDung: null,
  dangKhoiTao: !!sessionStorage.getItem('lac-viet-token'),
  capNhat: (nguoiDung) => dat({ nguoiDung, dangKhoiTao: false }),
  dangNhap: (token, nguoiDung) => { sessionStorage.setItem('lac-viet-token', token); dat({ nguoiDung, dangKhoiTao: false }); },
  dangXuat: () => { sessionStorage.removeItem('lac-viet-token'); dat({ nguoiDung: null, dangKhoiTao: false }); },
}));
