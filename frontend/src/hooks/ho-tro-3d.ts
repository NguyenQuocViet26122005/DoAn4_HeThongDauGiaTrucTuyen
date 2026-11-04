import { useEffect, useState } from 'react';

function coWebGL() {
  try {
    const canvas = document.createElement('canvas');

    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

// Chỉ bật cảnh 3D khi trình duyệt hỗ trợ WebGL và người dùng không chọn giảm chuyển động.
export function useHoTro3D() {
  const [coThe, datCoThe] = useState(false);
  const [dienThoai, datDienThoai] = useState(false);

  useEffect(() => {
    const giamChuyenDong = window.matchMedia('(prefers-reduced-motion: reduce)');
    const manHep = window.matchMedia('(max-width: 800px)');
    const capNhat = () => {
      datCoThe(coWebGL() && !giamChuyenDong.matches);
      datDienThoai(manHep.matches);
    };

    capNhat();
    giamChuyenDong.addEventListener('change', capNhat);
    manHep.addEventListener('change', capNhat);

    return () => {
      giamChuyenDong.removeEventListener('change', capNhat);
      manHep.removeEventListener('change', capNhat);
    };
  }, []);

  return { coThe, dienThoai };
}
