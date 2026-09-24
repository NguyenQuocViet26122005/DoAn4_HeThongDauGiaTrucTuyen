import { useState } from 'react';
import { Button, Input, Select } from 'antd';
import { Link, useSearchParams } from 'react-router-dom';
import type { DanhMuc, Phien } from '../types/du-lieu';
import { AnhSanPham, ChoDuLieu, DemNguoc, PhanTrang, TieuDe, TrangThai, useDuLieu } from '../components/dung-chung';
import { BieuTuong, bieuTuongDanhMuc } from '../components/bieu-tuong';
import { tien } from '../utils/dinh-dang';
import anhBia from '../assets/khong-gian-dau-gia.png';

export function ThePhien({phien}: {phien: Phien}) {
  return <Link className="the-phien" to={`/phien/${phien.id}`}><div className="anh-the"><AnhSanPham src={phien.anh_chinh} ten={`${phien.tieu_de} ${phien.ten_danh_muc || ''}`} /><div className="nhan-the"><TrangThai giaTri={phien.trang_thai} /><span className="so-phien">LOT {String(phien.id).padStart(4, '0')}</span></div><span className="xem-phien"><BieuTuong ten="muiTen" /></span></div><div className="noi-dung-the"><span className="danh-muc-the">{phien.ten_danh_muc || 'Bộ sưu tập Lạc Việt'}</span><h3>{phien.tieu_de}</h3><div className="gia-the"><div><small>Giá hiện tại</small><strong>{tien(phien.gia_hien_tai)}</strong></div><small>{phien.tong_luot_tra_gia} lượt trả</small></div><div className="chan-the"><DemNguoc batDau={phien.thoi_gian_bat_dau} ketThuc={phien.thoi_gian_ket_thuc} /><span>Khám phá ↗</span></div></div></Link>;
}

export function TrangChu() {
  const phien = useDuLieu<Phien[]>('/auctions', {limit: 4, sap_xep: 'moi_nhat'});
  const danhMuc = useDuLieu<DanhMuc[]>('/categories');


  return <><div className="khung"><section className="anh-bia" style={{backgroundImage: `linear-gradient(90deg, rgba(10,11,10,.45), transparent), url(${anhBia})`}}><div className="noi-dung-bia"><span className="nhan-nho"><span className="duong-nhan" /> MỖI MÓN ĐỒ, MỘT GIÁ TRỊ</span><h1>Giá trị xứng tầm.<br /><em>Cơ hội trong tầm tay.</em></h1><p>Khám phá những món đồ đáng sở hữu.<br />Đặt giá theo cách của bạn, an tâm trên từng bước.</p><div className="nhom-nut"><Link className="nut-vang" to="/kham-pha">Khám phá đấu giá <BieuTuong ten="muiTen" size={18} /></Link><Link className="nut-trong" to="/huong-dan">Cách tham gia <span>↗</span></Link></div><div className="chi-tiet-bia"><span>01 / BỘ SƯU TẬP CẢM HỨNG</span><span>VẺ ĐẸP VƯỢT THỜI GIAN</span></div></div></section><div className="dai-cam-ket">{[['khien', 'Người bán được xác minh', 'Danh tính được kiểm tra trước khi bán'], ['bua', 'Đấu giá minh bạch', 'Giới hạn của bạn luôn được giữ kín'], ['the', 'Thanh toán có bảo vệ', 'Giữ tiền trung gian đến khi hoàn tất']].map(([icon, ten, phu]) => <div key={ten}><BieuTuong ten={icon} size={25} /><span><strong>{ten}</strong><small>{phu}</small></span></div>)}</div><section className="khu-vuc"><div className="tieu-de-muc"><div><span className="nhan-nho">THE AUCTION EDIT</span><h2>Những phiên đáng khám phá</h2></div><Link className="link-vang" to="/kham-pha">Xem tất cả <BieuTuong ten="muiTen" size={18} /></Link></div><ChoDuLieu truyVan={phien} rong={phien.data?.length === 0}><div className="luoi-phien">{phien.data?.map(p => <ThePhien key={p.id} phien={p} />)}</div></ChoDuLieu></section><section className="khu-vuc khu-danh-muc"><div className="tieu-de-muc"><div><span className="nhan-nho">TÌM ĐIỀU BẠN YÊU THÍCH</span><h2>Khám phá theo danh mục</h2></div><span className="chu-mo">Mỗi sở thích, một thế giới riêng.</span></div><ChoDuLieu truyVan={danhMuc} rong={danhMuc.data?.length === 0}><div className="luoi-danh-muc">{danhMuc.data?.map(d => <Link key={d.id} to={`/kham-pha?danh_muc_id=${d.id}`}><BieuTuong ten={bieuTuongDanhMuc(d.ten)} size={35} /><span>{d.ten}</span><span className="mui-ten-danh-muc">↗</span></Link>)}</div></ChoDuLieu></section><section className="cau-chuyen"><div><span className="nhan-nho">MỘT HÀNH TRÌNH ĐƠN GIẢN</span><h2>Từ lần đặt giá đầu tiên<br />đến món đồ của riêng bạn.</h2><Link className="link-vang" to="/huong-dan">Tìm hiểu cách đấu giá <BieuTuong ten="muiTen" size={18} /></Link></div><div className="cac-buoc">{[['01', 'Tìm món đồ bạn thích', 'Xem thông tin sản phẩm, người bán và lịch sử trả giá.'], ['02', 'Đặt mức giá của bạn', 'Hệ thống tự động trả giá trong giới hạn bí mật bạn chọn.'], ['03', 'Nhận hàng & trải nghiệm', 'Thanh toán, theo dõi vận chuyển và xác nhận khi hài lòng.']].map(([so, ten, moTa]) => <div key={so}><span>{so}</span><div><h3>{ten}</h3><p>{moTa}</p></div></div>)}</div></section><section className="loi-moi-ban"><BieuTuong ten="kimCuong" size={46} /><div><span className="nhan-nho">TRAO GIÁ TRỊ, NHẬN CƠ HỘI</span><h2>Món đồ của bạn xứng đáng được khám phá.</h2><p>Bắt đầu với hồ sơ người bán được xác minh.</p></div><Link className="nut-vang" to="/tai-khoan/xac-minh">Trở thành người bán <BieuTuong ten="muiTen" size={18} /></Link></section></div></>;
}

export default function KhamPha() {
  const [thamSo, datThamSo] = useSearchParams();
  const [tuKhoa, datTuKhoa] = useState(thamSo.get('q') || '');
  const trang = Math.max(1, Number(thamSo.get('page')) || 1);
  const danhMuc = useDuLieu<DanhMuc[]>('/categories');
  const phien = useDuLieu<Phien[]>('/auctions', {
...Object.fromEntries(thamSo), page: trang, limit: 12
});
  const doiLoc = (khoa: string, giaTri: string) => { const moi = new URLSearchParams(thamSo);

 if (giaTri) {
moi.set(khoa, giaTri);
} else {
moi.delete(khoa);
} if (khoa !== 'page') {
moi.delete('page');
} datThamSo(moi); };


  return <div className="khung trang-kham-pha"><div className="duong-dan"><Link to="/">Trang chủ</Link> / Khám phá</div><TieuDe nhanNho="TÌM KIẾM. KHÁM PHÁ. SỞ HỮU." ten="Thế giới những giá trị đặc biệt" moTa="Một món đồ vừa ý. Một mức giá của riêng bạn." /><div className="khung-kham-pha"><aside className="bo-loc"><h3>Bộ lọc <BieuTuong ten="luoi" size={18} /></h3><label>Tìm sản phẩm</label><Input.Search value={tuKhoa} onChange={e => datTuKhoa(e.target.value)} onSearch={q => doiLoc('q', q)} placeholder="Tên sản phẩm…" aria-label="Tìm sản phẩm" /><label>Danh mục</label><button className={!thamSo.get('danh_muc_id') ? 'muc-loc dang-chon' : 'muc-loc'} onClick={() => doiLoc('danh_muc_id', '')}>Tất cả danh mục <span>↗</span></button>{danhMuc.data?.map(d => <button key={d.id} className={thamSo.get('danh_muc_id') === String(d.id) ? 'muc-loc dang-chon' : 'muc-loc'} onClick={() => doiLoc('danh_muc_id', String(d.id))}>{d.ten}</button>)}<label>Trạng thái phiên</label><Select aria-label="Trạng thái phiên" value={thamSo.get('trang_thai') || ''} onChange={v => doiLoc('trang_thai', v)} options={[{value: '', label: 'Tất cả trạng thái'}, {value: 'HOAT_DONG', label: 'Đang diễn ra'}, {value: 'DA_LEN_LICH', label: 'Sắp diễn ra'}, {value: 'DA_KET_THUC', label: 'Đã kết thúc'}, {value: 'THAT_BAI', label: 'Không thành công'}]} /><Button type="text" onClick={() => {datThamSo({}); datTuKhoa('');}}>Xóa bộ lọc</Button><div className="goi-y-loc"><BieuTuong ten="khien" size={26} /><h4>An tâm đặt giá</h4><p>Mọi sản phẩm đều được duyệt trước khi lên phiên.</p><Link to="/huong-dan">Tìm hiểu thêm ↗</Link></div></aside><div className="ket-qua-kham-pha"><div className="thanh-ket-qua"><span>{thamSo.get('q') ? `Kết quả cho “${thamSo.get('q')}”` : 'Tất cả phiên đấu giá'}</span><Select aria-label="Sắp xếp phiên" value={thamSo.get('sap_xep') || 'moi_nhat'} onChange={v => doiLoc('sap_xep', v)} options={[{value: 'moi_nhat', label: 'Mới nhất'}, {value: 'sap_ket_thuc', label: 'Sắp kết thúc'}, {value: 'gia_tang', label: 'Giá thấp đến cao'}, {value: 'gia_giam', label: 'Giá cao đến thấp'}]} /></div><ChoDuLieu truyVan={phien} rong={phien.data?.length === 0}><div className="luoi-phien">{phien.data?.map(p => <ThePhien phien={p} key={p.id} />)}</div></ChoDuLieu><PhanTrang trang={trang} datTrang={v => doiLoc('page', String(v))} soLuong={phien.data?.length || 0} gioiHan={12} /></div></div></div>;
}
