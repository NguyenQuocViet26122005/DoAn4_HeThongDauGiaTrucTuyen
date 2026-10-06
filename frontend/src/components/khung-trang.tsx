import { useState } from 'react';
import { Badge, Button, Drawer, Dropdown, Input } from 'antd';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BieuTuong } from './bieu-tuong';
import { useDuLieu } from '../hooks/su-dung-du-lieu';
import { usePhienDangNhap } from '../store/phien-dang-nhap';
import { boNho } from '../services/api';
import { useCapNhatThoiGianThuc } from '../hooks/cap-nhat-thoi-gian-thuc';

export function ThuongHieu() {
  return (
    <Link to="/" className="thuong-hieu" aria-label="VietBid, trang chủ">
      <span className="dau-an">
        <BieuTuong ten="kimCuong" size={26} />
      </span>
      <span>
        VietBid<small>ĐẤU GIÁ & SƯU TẦM</small>
      </span>
    </Link>
  );
}

export default function KhungTrang() {
  useCapNhatThoiGianThuc();

  const { nguoiDung, dangXuat } = usePhienDangNhap();
  const [mo, datMo] = useState(false);
  const diDen = useNavigate();
  const thongBao = useDuLieu<{ chua_doc: string }>(
    '/notifications/unread-count',
    undefined,
    !!nguoiDung,
    30000,
  );
  const cacMuc = [
    {
      key: 'ho-so',
      label: 'Tài khoản của tôi',
      onClick: () => diDen('/tai-khoan'),
    },
    {
      key: 'don-hang',
      label: 'Đơn hàng',
      onClick: () => diDen('/tai-khoan/don-hang'),
    },
    ...(nguoiDung?.vai_tro === 'QUAN_TRI'
      ? [
          {
            key: 'quan-tri',
            label: 'Trang quản trị',
            onClick: () => diDen('/quan-tri'),
          },
        ]
      : [
          {
            key: 'ban-hang',
            label: 'Kênh người bán',
            onClick: () => diDen('/nguoi-ban'),
          },
        ]),
    {
      key: 'dang-xuat',
      label: 'Đăng xuất',
      danger: true,
      onClick: () => {
        dangXuat();
        boNho.clear();
        diDen('/');
      },
    },
  ];
  const dieuHuong = (
    <>
      <NavLink to="/kham-pha" onClick={() => datMo(false)}>
        Khám phá
      </NavLink>
      <NavLink to="/huong-dan" onClick={() => datMo(false)}>
        Cách tham gia
      </NavLink>
      <NavLink to="/nguoi-ban" onClick={() => datMo(false)}>
        Bán đấu giá
      </NavLink>
    </>
  );

  return (
    <>
      <a href="#noi-dung" className="bo-qua-dieu-huong">
        Đến nội dung chính
      </a>
      <div className="thanh-thong-diep">
        <span>NHỮNG GIÁ TRỊ ĐẶC BIỆT, ĐANG CHỜ CHỦ NHÂN MỚI</span>
        <span>Đấu giá minh bạch · Theo dõi tiến trình giao dịch</span>
      </div>
      <header className="dau-trang">
        <div className="khung thanh-dieu-huong">
          <ThuongHieu />
          <nav className="menu-chinh" aria-label="Điều hướng chính">
            {dieuHuong}
          </nav>
          <div className="tim-kiem-dau-trang">
            <Input.Search
              aria-label="Tìm sản phẩm"
              placeholder="Tìm điều bạn yêu thích…"
              maxLength={100}
              onSearch={(q) => diDen(`/kham-pha?q=${encodeURIComponent(q.trim())}`)}
            />
          </div>
          <div className="tac-vu-dau-trang">
            {nguoiDung ? (
              <>
                <Link
                  className="nut-bieu-tuong"
                  to="/tai-khoan/theo-doi"
                  aria-label="Danh sách theo dõi"
                >
                  <BieuTuong ten="timYeu" />
                </Link>
                <Badge count={Number(thongBao.data?.chua_doc || 0)} size="small">
                  <Link className="nut-bieu-tuong" to="/tai-khoan/thong-bao" aria-label="Thông báo">
                    <BieuTuong ten="chuong" />
                  </Link>
                </Badge>
                <Dropdown menu={{ items: cacMuc }} trigger={['click']}>
                  <button className="nut-tai-khoan" aria-label="Mở tài khoản">
                    {nguoiDung.ho_ten.charAt(0).toUpperCase()}
                  </button>
                </Dropdown>
              </>
            ) : (
              <>
                <Link to="/dang-nhap" className="link-dang-nhap">
                  Đăng nhập
                </Link>
                <Link className="nut-vang nut-nho" to="/dang-ky">
                  Tham gia
                </Link>
              </>
            )}
            <Button
              className="nut-menu"
              type="text"
              aria-label="Mở menu"
              icon={<BieuTuong ten="menu" />}
              onClick={() => datMo(true)}
            />
          </div>
        </div>
      </header>
      <Drawer title="Khám phá VietBid" open={mo} onClose={() => datMo(false)} size={320}>
        <Input.Search
          aria-label="Tìm kiếm trong menu"
          placeholder="Tìm món đồ bạn thích…"
          maxLength={100}
          onSearch={(q) => {
            diDen(`/kham-pha?q=${encodeURIComponent(q.trim())}`);
            datMo(false);
          }}
        />
        <nav className="menu-di-dong">
          {dieuHuong}
          <NavLink to="/tai-khoan" onClick={() => datMo(false)}>
            Tài khoản của tôi
          </NavLink>
        </nav>
      </Drawer>
      <main id="noi-dung" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="chan-trang">
        <div className="khung">
          <div className="cot-chan-trang">
            <div>
              <ThuongHieu />
              <p>
                Nơi những món đồ có câu chuyện
                <br />
                tìm thấy người biết trân trọng.
              </p>
            </div>
            <div>
              <span className="nhan-nho">KHÁM PHÁ</span>
              <Link to="/kham-pha">Tất cả phiên đấu giá</Link>
              <Link to="/kham-pha?trang_thai=DA_LEN_LICH">Phiên sắp diễn ra</Link>
              <Link to="/tai-khoan/theo-doi">Danh sách theo dõi</Link>
            </div>
            <div>
              <span className="nhan-nho">ĐỒNG HÀNH CÙNG BẠN</span>
              <Link to="/huong-dan">Hướng dẫn đấu giá</Link>
              <Link to="/tai-khoan/xac-minh">Trở thành người bán</Link>
              <Link to="/tai-khoan/tranh-chap">Hỗ trợ giao dịch</Link>
            </div>
            <div className="cam-ket-chan-trang">
              <BieuTuong ten="khien" size={28} />
              <strong>An tâm trong từng giao dịch</strong>
              <p>
                Người bán được xác minh.
                <br />
                Theo dõi tiến trình từ thanh toán đến nhận hàng.
              </p>
            </div>
          </div>
          <div className="chan-cuoi">
            <span>© {new Date().getFullYear()} VietBid · Đồ án 4</span>
            <span>Đấu giá & sưu tầm</span>
            <span>Tiếng Việt / VND</span>
          </div>
        </div>
      </footer>
    </>
  );
}

const mucTaiKhoan = [
  ['', 'nguoi', 'Hồ sơ của tôi'],
  ['dia-chi', 'diaChi', 'Sổ địa chỉ'],
  ['theo-doi', 'timYeu', 'Đang theo dõi'],
  ['da-dau-gia', 'bua', 'Phiên đã tham gia'],
  ['don-hang', 'hop', 'Đơn hàng'],
  ['de-nghi', 'the', 'Cơ hội mua tiếp'],
  ['thong-bao', 'chuong', 'Thông báo'],
  ['tranh-chap', 'khien', 'Hỗ trợ & tranh chấp'],
  ['vi-pham', 'thu', 'Vi phạm'],
  ['danh-gia', 'nguoi', 'Đánh giá về tôi'],
  ['xac-minh', 'nguoi', 'Xác minh người bán'],
];
const mucNguoiBan = [
  ['san-pham', 'luoi', 'Sản phẩm của tôi'],
  ['kiem-dinh', 'khien', 'Hồ sơ kiểm định'],
  ['phien', 'bua', 'Phiên đấu giá'],
  ['don-hang', 'hop', 'Đơn bán hàng'],
];
const mucQuanTri = [
  ['', 'bieuDo', 'Tổng quan'],
  ['nguoi-dung', 'nguoi', 'Người dùng'],
  ['xac-minh', 'khien', 'Xác minh người bán'],
  ['san-pham', 'hop', 'Duyệt sản phẩm'],
  ['kiem-dinh', 'khien', 'Kiểm định sản phẩm'],
  ['dat-coc', 'the', 'Quản lý đặt cọc'],
  ['phien', 'bua', 'Phiên & yêu cầu hủy'],
  ['danh-muc', 'luoi', 'Danh mục'],
  ['don-hang', 'the', 'Đơn hàng'],
  ['tranh-chap', 'thu', 'Tranh chấp'],
  ['vi-pham', 'khien', 'Vi phạm'],
  ['cau-hinh', 'dongHo', 'Cấu hình'],
  ['nhat-ky', 'thoiGian', 'Nhật ký hoạt động'],
];

export function KhungLamViec({ loai }: { loai: 'tai-khoan' | 'nguoi-ban' | 'quan-tri' }) {
  const nguoiDung = usePhienDangNhap((s) => s.nguoiDung);
  const muc = loai === 'quan-tri' ? mucQuanTri : loai === 'nguoi-ban' ? mucNguoiBan : mucTaiKhoan;

  return (
    <div className="khung khung-lam-viec">
      <aside className="thanh-ben">
        <div className="nguoi-dung-ben">
          <span className="anh-dai-dien-chu">{nguoiDung?.ho_ten.charAt(0)}</span>
          <strong>{nguoiDung?.ho_ten}</strong>
          <small>
            {loai === 'quan-tri'
              ? 'Không gian quản trị'
              : loai === 'nguoi-ban'
                ? 'Không gian người bán'
                : 'Tài khoản của bạn'}
          </small>
        </div>
        <nav>
          {muc.map(([duongDan, bieuTuong, ten]) => (
            <NavLink
              end={!['san-pham', 'kiem-dinh', 'phien'].includes(duongDan)}
              to={`/${loai}${duongDan ? `/${duongDan}` : ''}`}
              key={ten}
            >
              <BieuTuong ten={bieuTuong} size={18} />
              {ten}
            </NavLink>
          ))}
        </nav>
        <Link to="/kham-pha" className="link-ben">
          Tiếp tục khám phá <BieuTuong ten="muiTen" size={16} />
        </Link>
      </aside>
      <section className="noi-dung-lam-viec">
        <Outlet />
      </section>
    </div>
  );
}
