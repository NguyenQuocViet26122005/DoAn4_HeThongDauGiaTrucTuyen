import { lazy, Suspense, useEffect } from 'react';
import { Alert, Button, Result, Skeleton } from 'antd';
import { Link, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import KhungTrang, { KhungLamViec } from '../components/khung-trang';
import KhamPha, { TrangChu } from '../pages/kham-pha';
import { useKhoiTaoPhien } from '../hooks/khoi-tao-phien';
import { usePhienDangNhap } from '../store/phien-dang-nhap';

const DangNhapDangKy = lazy(() => import('../pages/dang-nhap-dang-ky'));
const HuongDan = lazy(() => import('../pages/huong-dan'));
const ChiTietPhien = lazy(() => import('../pages/chi-tiet-phien'));
const SoDiaChi = lazy(() => import('../pages/dia-chi'));
const BienNhanDon = lazy(() => import('../pages/bien-nhan-don'));
const DonHangCuaToi = lazy(() => import('../pages/don-hang'));
const ThongBao = lazy(() => import('../pages/thong-bao'));
const XacMinh = lazy(() => import('../pages/xac-minh'));
const DanhSachTranhChap = lazy(() => import('../pages/tranh-chap'));
const ChiTietTranhChap = lazy(() => import('../pages/chi-tiet-tranh-chap'));
const KhongGianNghiepVu = lazy(() => import('../pages/khong-gian-nghiep-vu'));
const SanPhamNguoiBan = lazy(() => import('../pages/san-pham-nguoi-ban'));
const BienTapSanPham = lazy(() => import('../pages/bien-tap-san-pham'));
const DuyetSanPham = lazy(() => import('../pages/duyet-san-pham'));
const ChiTietDuyetSanPham = lazy(() =>
  import('../pages/duyet-san-pham').then((muc) => ({ default: muc.ChiTietDuyetSanPham })),
);
const PhienNguoiBan = lazy(() => import('../pages/phien-nguoi-ban'));
const TaoPhien = lazy(() => import('../pages/tao-phien'));
const ChiTietPhienNguoiBan = lazy(() => import('../pages/chi-tiet-phien-nguoi-ban'));
const KiemDinh = lazy(() => import('../pages/kiem-dinh'));
const ChiTietKiemDinh = lazy(() => import('../pages/chi-tiet-kiem-dinh'));

function BaoVeTrang({ quanTri = false }: { quanTri?: boolean }) {
  const { nguoiDung, dangKhoiTao } = usePhienDangNhap();
  const viTri = useLocation();

  if (dangKhoiTao) {
    return (
      <div className="khung trang-noi-dung" role="status" aria-label="Đang kiểm tra đăng nhập">
        <Skeleton active />
      </div>
    );
  }

  if (!nguoiDung) {
    return (
      <Navigate
        replace
        to={`/dang-nhap?tiep=${encodeURIComponent(viTri.pathname + viTri.search)}`}
      />
    );
  }

  if (quanTri && nguoiDung.vai_tro !== 'QUAN_TRI') {
    return (
      <Result
        status="403"
        title="Bạn chưa có quyền truy cập"
        subTitle="Khu vực này dành cho quản trị viên."
        extra={
          <Link className="nut-vang" to="/tai-khoan">
            Về tài khoản
          </Link>
        }
      />
    );
  }

  return <Outlet />;
}

function ViTriTrang() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView();
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
}

export default function DinhTuyen() {
  const { search } = useLocation();
  const { loi, thuLai } = useKhoiTaoPhien();
  const dangKhoiTao = usePhienDangNhap((s) => s.dangKhoiTao);

  return (
    <>
      {loi && dangKhoiTao && (
        <Alert
          className="loi-khoi-tao"
          type="warning"
          showIcon
          title="Chưa khôi phục được phiên đăng nhập"
          description={loi}
          action={<Button onClick={thuLai}>Thử lại</Button>}
        />
      )}
      <Suspense
        fallback={
          <div className="khung trang-noi-dung" role="status" aria-label="Đang mở trang">
            <Skeleton active />
          </div>
        }
      >
        <ViTriTrang />
        <Routes>
          <Route element={<KhungTrang />}>
            <Route index element={<TrangChu />} />
            <Route path="kham-pha" element={<KhamPha key={search} />} />
            <Route path="phien/:id" element={<ChiTietPhien />} />
            <Route path="huong-dan" element={<HuongDan />} />
            <Route path="dang-nhap" element={<DangNhapDangKy key="dang-nhap" />} />
            <Route path="dang-ky" element={<DangNhapDangKy key="dang-ky" dangKy />} />
            <Route element={<BaoVeTrang />}>
              <Route path="tai-khoan" element={<KhungLamViec loai="tai-khoan" />}>
                <Route index element={<KhongGianNghiepVu loai="tai-khoan" />} />
                <Route path="dia-chi" element={<SoDiaChi />} />
                <Route path="thong-bao" element={<ThongBao />} />
                <Route path="xac-minh" element={<XacMinh />} />
                <Route path="don-hang/:id" element={<BienNhanDon />} />
                <Route path="don-hang" element={<DonHangCuaToi />} />
                <Route path="tranh-chap" element={<DanhSachTranhChap />} />
                <Route path="tranh-chap/:id" element={<ChiTietTranhChap />} />
                <Route path=":muc" element={<KhongGianNghiepVu loai="tai-khoan" />} />
              </Route>
              <Route path="nguoi-ban" element={<KhungLamViec loai="nguoi-ban" />}>
                <Route index element={<Navigate replace to="san-pham" />} />
                <Route path="san-pham" element={<SanPhamNguoiBan />} />
                <Route path="san-pham/moi" element={<BienTapSanPham />} />
                <Route path="san-pham/:id" element={<BienTapSanPham />} />
                <Route path="phien" element={<PhienNguoiBan />} />
                <Route path="phien/moi" element={<TaoPhien />} />
                <Route path="phien/:id" element={<ChiTietPhienNguoiBan />} />
                <Route path="kiem-dinh" element={<KiemDinh />} />
                <Route path="kiem-dinh/:id" element={<ChiTietKiemDinh />} />
                <Route path="don-hang" element={<DonHangCuaToi khuVuc="nguoi-ban" />} />
                <Route path="don-hang/:id" element={<BienNhanDon khuVuc="nguoi-ban" />} />
                <Route path=":muc" element={<KhongGianNghiepVu loai="nguoi-ban" />} />
              </Route>
            </Route>
            <Route element={<BaoVeTrang quanTri />}>
              <Route path="quan-tri" element={<KhungLamViec loai="quan-tri" />}>
                <Route index element={<KhongGianNghiepVu loai="quan-tri" />} />
                <Route path="san-pham" element={<DuyetSanPham />} />
                <Route path="san-pham/:id" element={<ChiTietDuyetSanPham />} />
                <Route path="kiem-dinh" element={<KiemDinh quanTri />} />
                <Route path="kiem-dinh/:id" element={<ChiTietKiemDinh quanTri />} />
                <Route path="don-hang" element={<DonHangCuaToi khuVuc="quan-tri" />} />
                <Route path="don-hang/:id" element={<BienNhanDon khuVuc="quan-tri" />} />
                <Route path="tranh-chap" element={<DanhSachTranhChap quanTri />} />
                <Route path="xac-minh" element={<XacMinh quanTri />} />
                <Route path="tranh-chap/:id" element={<ChiTietTranhChap quanTri />} />
                <Route path=":muc" element={<KhongGianNghiepVu loai="quan-tri" />} />
              </Route>
            </Route>
            <Route
              path="*"
              element={
                <Result
                  status="404"
                  title="Không tìm thấy trang"
                  subTitle="Đường dẫn này không tồn tại hoặc đã được thay đổi."
                  extra={
                    <Link className="nut-vang" to="/">
                      Về trang chủ
                    </Link>
                  }
                />
              }
            />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}
