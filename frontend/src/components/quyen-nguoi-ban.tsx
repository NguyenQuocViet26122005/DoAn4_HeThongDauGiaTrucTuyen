import type { ReactNode } from 'react';
import { Result } from 'antd';
import { Link } from 'react-router-dom';
import { usePhienDangNhap } from '../store/phien-dang-nhap';

export default function QuyenNguoiBan({ children }: { children: ReactNode }) {
  const nguoiDung = usePhienDangNhap((s) => s.nguoiDung);
  const daXacMinh =
    nguoiDung?.vai_tro === 'NGUOI_DUNG' &&
    nguoiDung.trang_thai_nguoi_ban === 'DA_XAC_MINH' &&
    nguoiDung.trang_thai_tai_khoan === 'HOAT_DONG';

  if (!daXacMinh) {
    return (
      <Result
        status="info"
        title="Khu vực dành cho người bán đã xác minh"
        subTitle={
          nguoiDung?.vai_tro === 'QUAN_TRI'
            ? 'Tài khoản quản trị không tham gia bán hàng. Hãy sử dụng tài khoản người bán.'
            : 'Tài khoản cần hoạt động và được quản trị viên xác minh trước khi đăng sản phẩm.'
        }
        extra={<Link to="/tai-khoan">Xem hồ sơ tài khoản</Link>}
      />
    );
  }

  return children;
}
