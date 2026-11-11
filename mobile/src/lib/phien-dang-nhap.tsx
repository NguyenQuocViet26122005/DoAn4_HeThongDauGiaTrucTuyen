import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { boNho, datToken, doc, gui, khiPhienHetHan } from './api';
import { docToken, luuToken } from './luu-tru';
import type { NguoiDung } from './kieu';

interface PhienDangNhap {
  nguoiDung: NguoiDung | null;
  dangKhoiTao: boolean;
  dangNhap: (email: string, matKhau: string) => Promise<void>;
  dangXuat: () => Promise<void>;
}

const NguCanh = createContext<PhienDangNhap | null>(null);

export function NhaCungCapDangNhap({ children }: { children: ReactNode }) {
  const [nguoiDung, datNguoiDung] = useState<NguoiDung | null>(null);
  const [dangKhoiTao, datDangKhoiTao] = useState(true);

  const dangXuat = useCallback(async () => {
    datToken(null);
    await luuToken(null);
    datNguoiDung(null);
    boNho.clear();
  }, []);

  // Khôi phục phiên đăng nhập đã lưu khi mở app; token hết hạn thì coi như chưa đăng nhập.
  useEffect(() => {
    khiPhienHetHan(() => void dangXuat());

    (async () => {
      const token = await docToken();

      if (token) {
        datToken(token);
        try {
          datNguoiDung(await doc<NguoiDung>('/users/me'));
        } catch {
          await dangXuat();
        }
      }
      datDangKhoiTao(false);
    })();

    return () => khiPhienHetHan(null);
  }, [dangXuat]);

  const dangNhap = useCallback(async (email: string, matKhau: string) => {
    const ketQua = await gui<{ token: string; user: NguoiDung }>('/auth/login', {
      email: email.trim(),
      mat_khau: matKhau,
    });

    datToken(ketQua.token);
    await luuToken(ketQua.token);
    datNguoiDung(ketQua.user);
    boNho.clear();
  }, []);

  const giaTri = useMemo(
    () => ({
      nguoiDung,
      dangKhoiTao,
      dangNhap,
      dangXuat,
    }),
    [nguoiDung, dangKhoiTao, dangNhap, dangXuat],
  );

  return <NguCanh.Provider value={giaTri}>{children}</NguCanh.Provider>;
}

export function usePhienDangNhap() {
  const giaTri = useContext(NguCanh);

  if (!giaTri) {
    throw new Error('Thiếu NhaCungCapDangNhap');
  }

  return giaTri;
}
