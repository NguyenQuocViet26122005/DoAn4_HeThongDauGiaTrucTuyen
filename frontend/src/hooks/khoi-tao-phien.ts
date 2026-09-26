import { useEffect, useState } from 'react';
import { boNho, doc, loiDeDoc } from '../services/api';
import { usePhienDangNhap } from '../store/phien-dang-nhap';
import type { NguoiDung } from '../types/du-lieu';

export function useKhoiTaoPhien() {
  const [loi, datLoi] = useState('');
  const [lanThu, datLanThu] = useState(0);

  useEffect(() => {
    let conHieuLuc = true;

    async function khoiTao() {
      if (!sessionStorage.getItem('lac-viet-token')) {
        usePhienDangNhap.getState().capNhat(null);

        return;
      }

      try {
        const nguoiDung = await doc<NguoiDung>('/users/me');

        if (conHieuLuc && sessionStorage.getItem('lac-viet-token')) {
          usePhienDangNhap.getState().capNhat(nguoiDung);
          datLoi('');
        }
      } catch (loiKhoiTao) {
        if (conHieuLuc) {
          datLoi(loiDeDoc(loiKhoiTao));
        }
      }
    }

    function hetPhien() {
      usePhienDangNhap.getState().dangXuat();
      boNho.clear();
    }

    window.addEventListener('het-phien-dang-nhap', hetPhien);
    void khoiTao();

    return () => {
      conHieuLuc = false;
      window.removeEventListener('het-phien-dang-nhap', hetPhien);
    };
  }, [lanThu]);

  return {
    loi,
    thuLai: () => {
      datLoi('');
      datLanThu((lan) => lan + 1);
    },
  };
}
