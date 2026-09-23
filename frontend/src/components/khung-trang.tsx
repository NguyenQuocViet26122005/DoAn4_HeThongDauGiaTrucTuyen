import { useState } from 'react';
import { Badge, Button, Drawer, Dropdown, Input } from 'antd';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BieuTuong } from './bieu-tuong';
import { useDuLieu } from './dung-chung';
import { usePhienDangNhap } from '../store/phien-dang-nhap';
import { boNho } from '../services/api';

export function ThuongHieu() {
  return <Link to="/" className="thuong-hieu" aria-label="Lạc Việt Auctions, trang chủ"><span className="dau-an"><BieuTuong ten="kimCuong" size={26} /></span><span>LẠC VIỆT<small>AUCTIONS</small></span></Link>;
}

export default function KhungTrang() {
  const { nguoiDung, dangXuat } = usePhienDangNhap();
  const [mo, datMo] = useState(false);
  const diDen = useNavigate();
  const thongBao = useDuLieu<{chua_doc: string}>('/notifications/unread-count', undefined, !!nguoiDung);
  const cacMuc = [
    { key: 'ho-so', label: 'Tài khoản của tôi', onClick: () => diDen('/tai-khoan') },
    { key: 'don-hang', label: 'Đơn hàng', onClick: () => diDen('/tai-khoan/don-hang') },
    ...(nguoiDung?.vai_tro === 'QUAN_TRI' ? [{ key: 'quan-tri', label: 'Trang quản trị', onClick: () => diDen('/quan-tri') }] : [{ key: 'ban-hang', label: 'Kênh người bán', onClick: () => diDen('/nguoi-ban') }]),
    { key: 'dang-xuat', label: 'Đăng xuất', danger: true, onClick: () => { dangXuat(); boNho.clear(); diDen('/'); } },
  ];
  const dieuHuong = <><NavLink to="/kham-pha" onClick={() => datMo(false)}>Khám phá</NavLink><NavLink to="/huong-dan" onClick={() => datMo(false)}>Cách tham gia</NavLink><NavLink to="/nguoi-ban" onClick={() => datMo(false)}>Bán đấu giá</NavLink></>;
  return <><div className="thanh-thong-diep"><span>NHỮNG GIÁ TRỊ ĐẶC BIỆT, ĐANG CHỜ CHỦ NHÂN MỚI</span><span>Đấu giá minh bạch · Giao dịch có bảo vệ</span></div><header className="dau-trang"><div className="khung thanh-dieu-huong"><ThuongHieu /><nav className="menu-chinh">{dieuHuong}</nav><div className="tim-kiem-dau-trang"><Input.Search aria-label="Tìm sản phẩm" placeholder="Tìm điều bạn yêu thích…" onSearch={q => diDen(`/kham-pha?q=${encodeURIComponent(q)}`)} /></div><div className="tac-vu-dau-trang">{nguoiDung ? <><Link className="nut-bieu-tuong" to="/tai-khoan/theo-doi" aria-label="Danh sách theo dõi"><BieuTuong ten="timYeu" /></Link><Badge count={Number(thongBao.data?.chua_doc || 0)} size="small"><Link className="nut-bieu-tuong" to="/tai-khoan/thong-bao" aria-label="Thông báo"><BieuTuong ten="chuong" /></Link></Badge><Dropdown menu={{items: cacMuc}} trigger={['click']}><button className="nut-tai-khoan" aria-label="Mở tài khoản">{nguoiDung.ho_ten.charAt(0).toUpperCase()}</button></Dropdown></> : <><Link to="/dang-nhap" className="link-dang-nhap">Đăng nhập</Link><Link className="nut-vang nut-nho" to="/dang-ky">Tham gia</Link></>}<Button className="nut-menu" type="text" aria-label="Mở menu" icon={<BieuTuong ten="menu" />} onClick={() => datMo(true)} /></div></div></header><Drawer title="Khám phá Lạc Việt" open={mo} onClose={() => datMo(false)}><nav className="menu-di-dong">{dieuHuong}<NavLink to="/tai-khoan" onClick={() => datMo(false)}>Tài khoản của tôi</NavLink></nav></Drawer><main id="noi-dung"><Outlet /></main><footer className="chan-trang"><div className="khung"><div className="cot-chan-trang"><div><ThuongHieu /><p>Nơi những món đồ có câu chuyện<br />tìm thấy người biết trân trọng.</p></div><div><span className="nhan-nho">KHÁM PHÁ</span><Link to="/kham-pha">Tất cả phiên đấu giá</Link><Link to="/kham-pha?trang_thai=DA_LEN_LICH">Phiên sắp diễn ra</Link><Link to="/tai-khoan/theo-doi">Danh sách theo dõi</Link></div><div><span className="nhan-nho">ĐỒNG HÀNH CÙNG BẠN</span><Link to="/huong-dan">Hướng dẫn đấu giá</Link><Link to="/tai-khoan/xac-minh">Trở thành người bán</Link><Link to="/tai-khoan/tranh-chap">Hỗ trợ giao dịch</Link></div><div className="cam-ket-chan-trang"><BieuTuong ten="khien" size={28} /><strong>An tâm trong từng giao dịch</strong><p>Người bán được xác minh.<br />Tiền được giữ đến khi giao dịch hoàn tất.</p></div></div><div className="chan-cuoi"><span>© {new Date().getFullYear()} Lạc Việt Auctions · Đồ án 4</span><span>Thanh toán mô phỏng phục vụ học tập</span><span>Tiếng Việt / VND</span></div></div></footer></>;
}

const mucTaiKhoan = [['', 'nguoi', 'Hồ sơ của tôi'], ['dia-chi', 'diaChi', 'Sổ địa chỉ'], ['theo-doi', 'timYeu', 'Đang theo dõi'], ['da-dau-gia', 'bua', 'Phiên đã tham gia'], ['don-hang', 'hop', 'Đơn hàng'], ['de-nghi', 'the', 'Cơ hội mua tiếp'], ['thong-bao', 'chuong', 'Thông báo'], ['tranh-chap', 'khien', 'Hỗ trợ & tranh chấp'], ['vi-pham', 'thu', 'Vi phạm'], ['xac-minh', 'nguoi', 'Xác minh người bán']];
const mucNguoiBan = [['', 'luoi', 'Sản phẩm của tôi'], ['phien', 'bua', 'Phiên đấu giá'], ['don-hang', 'hop', 'Đơn bán hàng']];
const mucQuanTri = [['', 'bieuDo', 'Tổng quan'], ['nguoi-dung', 'nguoi', 'Người dùng'], ['xac-minh', 'khien', 'Xác minh người bán'], ['san-pham', 'hop', 'Duyệt sản phẩm'], ['phien', 'bua', 'Phiên & yêu cầu hủy'], ['danh-muc', 'luoi', 'Danh mục'], ['don-hang', 'the', 'Đơn hàng'], ['tranh-chap', 'thu', 'Tranh chấp'], ['vi-pham', 'khien', 'Vi phạm'], ['cau-hinh', 'dongHo', 'Cấu hình'], ['nhat-ky', 'thoiGian', 'Nhật ký hoạt động']];

export function KhungLamViec({loai}: {loai: 'tai-khoan' | 'nguoi-ban' | 'quan-tri'}) {
  const nguoiDung = usePhienDangNhap(s => s.nguoiDung);
  const muc = loai === 'quan-tri' ? mucQuanTri : loai === 'nguoi-ban' ? mucNguoiBan : mucTaiKhoan;
  return <div className="khung khung-lam-viec"><aside className="thanh-ben"><div className="nguoi-dung-ben"><span className="anh-dai-dien-chu">{nguoiDung?.ho_ten.charAt(0)}</span><strong>{nguoiDung?.ho_ten}</strong><small>{loai === 'quan-tri' ? 'Không gian quản trị' : loai === 'nguoi-ban' ? 'Không gian người bán' : 'Tài khoản của bạn'}</small></div><nav>{muc.map(([duongDan, bieuTuong, ten]) => <NavLink end to={`/${loai}${duongDan ? `/${duongDan}` : ''}`} key={ten}><BieuTuong ten={bieuTuong} size={18} />{ten}</NavLink>)}</nav><Link to="/kham-pha" className="link-ben">Tiếp tục khám phá <BieuTuong ten="muiTen" size={16} /></Link></aside><section className="noi-dung-lam-viec"><Outlet /></section></div>;
}
