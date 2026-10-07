import { useEffect, useState } from 'react';
import { Alert, Button, Input, Select } from 'antd';
import { Link, useSearchParams } from 'react-router-dom';
import type { DanhMuc, Phien } from '../types/du-lieu';
import {
  AnhSanPham,
  ChoDuLieu,
  DemNguoc,
  PhanTrang,
  TieuDe,
  TrangThaiPhien,
} from '../components/dung-chung';
import { BieuTuong } from '../components/bieu-tuong';
import { bieuTuongDanhMuc } from '../utils/bieu-tuong';
import { useDuLieu, useDanhSachDuLieu } from '../hooks/su-dung-du-lieu';
import { mocThoiGian, tenGiaPhien, tien } from '../utils/dinh-dang';
import anhBia from '../assets/khong-gian-dau-gia.webp';

export function ThePhien({ phien }: { phien: Phien }) {
  return (
    <Link className="the-phien" to={`/phien/${phien.id}`}>
      <div className="anh-the">
        <AnhSanPham src={phien.anh_chinh} ten={`${phien.tieu_de} ${phien.ten_danh_muc || ''}`} />
        <div className="nhan-the">
          <TrangThaiPhien phien={phien} />
          <span className="so-phien">PHIÊN {String(phien.id).padStart(4, '0')}</span>
        </div>
        <span className="xem-phien">
          <BieuTuong ten="muiTen" />
        </span>
      </div>
      <div className="noi-dung-the">
        {phien.ten_danh_muc && <span className="danh-muc-the">{phien.ten_danh_muc}</span>}
        <h3>{phien.tieu_de}</h3>
        <div className="gia-the">
          <div>
            <small>{tenGiaPhien(phien)}</small>
            <strong>{tien(phien.gia_hien_tai)}</strong>
          </div>
          <small>{phien.tong_luot_tra_gia} lượt trả giá</small>
        </div>
        <div className="chan-the">
          <DemNguoc batDau={phien.thoi_gian_bat_dau} ketThuc={phien.thoi_gian_ket_thuc} />
          <span>Khám phá ↗</span>
        </div>
      </div>
    </Link>
  );
}

export function TrangChu() {
  const [hienTai, datHienTai] = useState(Date.now);
  const phienDangDienRa = useDuLieu<Phien[]>(
    '/auctions',
    {
      trang_thai: 'HOAT_DONG',
      limit: 100,
    },
    true,
    60000,
  );
  const phienSapDienRa = useDuLieu<Phien[]>(
    '/auctions',
    {
      trang_thai: 'DA_LEN_LICH',
      limit: 100,
    },
    true,
    60000,
  );
  const danhMuc = useDuLieu<DanhMuc[]>('/categories');
  const cacPhienDangDienRa = (phienDangDienRa.data || [])
    .filter(
      (phien) =>
        mocThoiGian(phien.thoi_gian_bat_dau) <= hienTai &&
        mocThoiGian(phien.thoi_gian_ket_thuc) > hienTai,
    )
    .slice(0, 4);
  const cacPhienSapDienRa = (phienSapDienRa.data || [])
    .filter(
      (phien) =>
        mocThoiGian(phien.thoi_gian_bat_dau) > hienTai &&
        mocThoiGian(phien.thoi_gian_ket_thuc) > hienTai,
    )
    .slice(0, 4);
  const coNoiDungChuaTaiDuoc =
    (phienDangDienRa.isError && !phienDangDienRa.data) ||
    (phienSapDienRa.isError && !phienSapDienRa.data) ||
    (danhMuc.isError && !danhMuc.data);
  const dangTaiLai = phienDangDienRa.isFetching || phienSapDienRa.isFetching || danhMuc.isFetching;

  function taiLaiNoiDung() {
    void Promise.all([phienDangDienRa.refetch(), phienSapDienRa.refetch(), danhMuc.refetch()]);
  }

  useEffect(() => {
    const boDem = setInterval(() => datHienTai(Date.now()), 15000);

    return () => clearInterval(boDem);
  }, []);

  return (
    <>
      <div className="khung">
        <section
          className="anh-bia"
          style={{
            backgroundImage: `linear-gradient(90deg, rgba(10,11,10,.45), transparent), url(${anhBia})`,
          }}
        >
          <div className="noi-dung-bia">
            <span className="nhan-nho">
              <span className="duong-nhan" /> MỖI MÓN ĐỒ, MỘT GIÁ TRỊ
            </span>
            <h1>
              Giá trị xứng tầm.
              <br />
              <em>Cơ hội trong tầm tay.</em>
            </h1>
            <p>
              Khám phá những món đồ đáng sở hữu.
              <br />
              Đặt giá theo cách của bạn, an tâm trên từng bước.
            </p>
            <div className="nhom-nut">
              <Link className="nut-vang" to="/kham-pha">
                Khám phá đấu giá <BieuTuong ten="muiTen" size={18} />
              </Link>
              <Link className="nut-trong" to="/huong-dan">
                Cách tham gia <span>↗</span>
              </Link>
            </div>
            <div className="chi-tiet-bia">
              <span>01 / BỘ SƯU TẬP CẢM HỨNG</span>
              <span>VẺ ĐẸP VƯỢT THỜI GIAN</span>
            </div>
          </div>
        </section>
        <div className="dai-cam-ket">
          {[
            ['khien', 'Người bán được xác minh', 'Danh tính được kiểm tra trước khi bán'],
            ['bua', 'Đấu giá minh bạch', 'Giới hạn của bạn luôn được giữ kín'],
            ['the', 'Giao dịch theo từng bước', 'Theo dõi thanh toán, vận chuyển và nhận hàng'],
          ].map(([icon, ten, phu]) => (
            <div key={ten}>
              <BieuTuong ten={icon} size={25} />
              <span>
                <strong>{ten}</strong>
                <small>{phu}</small>
              </span>
            </div>
          ))}
        </div>
        {coNoiDungChuaTaiDuoc && (
          <Alert
            className="loi-noi-dung-trang-chu"
            type="warning"
            showIcon
            title="Một số nội dung chưa tải được"
            description="Kết nối dữ liệu đang gián đoạn. Bạn có thể thử tải lại các phiên và danh mục."
            action={
              <Button loading={dangTaiLai} onClick={taiLaiNoiDung}>
                Tải lại nội dung
              </Button>
            }
          />
        )}
        <section className="khu-vuc" hidden={phienDangDienRa.isError && !phienDangDienRa.data}>
          <div className="tieu-de-muc">
            <div>
              <span className="nhan-nho">ĐANG TRONG PHIÊN</span>
              <h2>Những phiên đang diễn ra</h2>
            </div>
            <Link className="link-vang" to="/kham-pha?trang_thai=HOAT_DONG">
              Xem phiên đang diễn ra <BieuTuong ten="muiTen" size={18} />
            </Link>
          </div>
          <ChoDuLieu
            truyVan={phienDangDienRa}
            rong={cacPhienDangDienRa.length === 0}
            thongDiepRong="Hiện chưa có phiên nào đang diễn ra. Hãy xem các phiên sắp mở."
          >
            <div className="luoi-phien">
              {cacPhienDangDienRa.map((p) => (
                <ThePhien key={p.id} phien={p} />
              ))}
            </div>
          </ChoDuLieu>
        </section>
        <section className="khu-vuc" hidden={phienSapDienRa.isError && !phienSapDienRa.data}>
          <div className="tieu-de-muc">
            <div>
              <span className="nhan-nho">SẮP ĐƯỢC MỞ</span>
              <h2>Đón phiên sắp bắt đầu</h2>
            </div>
            <Link className="link-vang" to="/kham-pha?trang_thai=DA_LEN_LICH">
              Xem lịch phiên <BieuTuong ten="muiTen" size={18} />
            </Link>
          </div>
          <ChoDuLieu
            truyVan={phienSapDienRa}
            rong={cacPhienSapDienRa.length === 0}
            thongDiepRong="Chưa có phiên nào được lên lịch."
          >
            <div className="luoi-phien">
              {cacPhienSapDienRa.map((p) => (
                <ThePhien key={p.id} phien={p} />
              ))}
            </div>
          </ChoDuLieu>
        </section>
        <section className="khu-vuc khu-danh-muc" hidden={danhMuc.isError && !danhMuc.data}>
          <div className="tieu-de-muc">
            <div>
              <span className="nhan-nho">TÌM ĐIỀU BẠN YÊU THÍCH</span>
              <h2>Khám phá theo danh mục</h2>
            </div>
            <span className="chu-mo">Mỗi sở thích, một thế giới riêng.</span>
          </div>
          <ChoDuLieu truyVan={danhMuc} rong={danhMuc.data?.length === 0}>
            <div className="luoi-danh-muc">
              {danhMuc.data?.map((d) => (
                <Link key={d.id} to={`/kham-pha?danh_muc_id=${d.id}`}>
                  <BieuTuong ten={bieuTuongDanhMuc(d.ten)} size={35} />
                  <span>{d.ten}</span>
                  <span className="mui-ten-danh-muc">↗</span>
                </Link>
              ))}
            </div>
          </ChoDuLieu>
        </section>
        <section className="cau-chuyen">
          <div>
            <span className="nhan-nho">MỘT HÀNH TRÌNH ĐƠN GIẢN</span>
            <h2>
              Từ lần đặt giá đầu tiên
              <br />
              đến món đồ của riêng bạn.
            </h2>
            <Link className="link-vang" to="/huong-dan">
              Tìm hiểu cách đấu giá <BieuTuong ten="muiTen" size={18} />
            </Link>
          </div>
          <div className="cac-buoc">
            {[
              [
                '01',
                'Tìm món đồ bạn thích',
                'Xem mô tả, kết quả kiểm định nếu có và chính sách cọc.',
              ],
              [
                '02',
                'Đặt mức giá của bạn',
                'Đặt cọc nếu phiên yêu cầu. Hệ thống trả giá theo mức tối đa bí mật.',
              ],
              [
                '03',
                'Nhận hàng & trải nghiệm',
                'Thanh toán, theo dõi vận chuyển và xác nhận khi hài lòng.',
              ],
            ].map(([so, ten, moTa]) => (
              <div key={so}>
                <span>{so}</span>
                <div>
                  <h3>{ten}</h3>
                  <p>{moTa}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="loi-moi-ban">
          <BieuTuong ten="kimCuong" size={46} />
          <div>
            <span className="nhan-nho">TRAO GIÁ TRỊ, NHẬN CƠ HỘI</span>
            <h2>Món đồ của bạn xứng đáng được khám phá.</h2>
            <p>Bắt đầu với hồ sơ người bán được xác minh.</p>
          </div>
          <Link className="nut-vang" to="/tai-khoan/xac-minh">
            Trở thành người bán <BieuTuong ten="muiTen" size={18} />
          </Link>
        </section>
      </div>
    </>
  );
}

export default function KhamPha() {
  const [thamSo, datThamSo] = useSearchParams();
  const tuKhoaTrenUrl = thamSo.get('q') || '';
  const trang = Math.max(1, Math.floor(Number(thamSo.get('page')) || 1));
  const danhMuc = useDuLieu<DanhMuc[]>('/categories');
  const phien = useDanhSachDuLieu<Phien[]>('/auctions', {
    q: thamSo.get('q') || undefined,
    danh_muc_id: thamSo.get('danh_muc_id') || undefined,
    trang_thai: thamSo.get('trang_thai') || undefined,
    page: trang,
    limit: 12,
  });

  const doiLoc = (khoa: string, giaTri: string) => {
    const moi = new URLSearchParams(thamSo);

    if (giaTri) {
      moi.set(khoa, giaTri);
    } else {
      moi.delete(khoa);
    }
    if (khoa !== 'page') {
      moi.delete('page');
    }
    datThamSo(moi);
  };

  return (
    <div className="khung trang-kham-pha">
      <div className="duong-dan">
        <Link to="/">Trang chủ</Link> / Khám phá
      </div>
      <TieuDe
        nhanNho="TÌM KIẾM. KHÁM PHÁ. SỞ HỮU."
        ten="Thế giới những giá trị đặc biệt"
        moTa="Một món đồ vừa ý. Một mức giá của riêng bạn."
      />
      <div className="khung-kham-pha">
        <aside className="bo-loc">
          <h3>
            Bộ lọc <BieuTuong ten="luoi" size={18} />
          </h3>
          <label htmlFor="tim-san-pham">Tìm sản phẩm</label>
          <Input.Search
            key={tuKhoaTrenUrl}
            defaultValue={tuKhoaTrenUrl}
            id="tim-san-pham"
            maxLength={100}
            onSearch={(q) => doiLoc('q', q.trim())}
            placeholder="Tên sản phẩm…"
            aria-label="Tìm sản phẩm"
          />
          <label>Danh mục</label>
          <button
            className={!thamSo.get('danh_muc_id') ? 'muc-loc dang-chon' : 'muc-loc'}
            onClick={() => doiLoc('danh_muc_id', '')}
          >
            Tất cả danh mục <span>↗</span>
          </button>
          <ChoDuLieu
            truyVan={danhMuc}
            rong={danhMuc.data?.length === 0}
            thongDiepRong="Chưa có danh mục"
          >
            {danhMuc.data?.map((d) => (
              <button
                key={d.id}
                className={
                  thamSo.get('danh_muc_id') === String(d.id) ? 'muc-loc dang-chon' : 'muc-loc'
                }
                onClick={() => doiLoc('danh_muc_id', String(d.id))}
              >
                {d.ten}
              </button>
            ))}
          </ChoDuLieu>
          <label>Trạng thái phiên</label>
          <Select
            aria-label="Trạng thái phiên"
            value={thamSo.get('trang_thai') || ''}
            onChange={(v) => doiLoc('trang_thai', v)}
            options={[
              { value: '', label: 'Tất cả trạng thái' },
              { value: 'HOAT_DONG', label: 'Đang diễn ra' },
              { value: 'DA_LEN_LICH', label: 'Sắp diễn ra' },
              { value: 'DA_KET_THUC', label: 'Đã kết thúc' },
              { value: 'THAT_BAI', label: 'Không thành công' },
              { value: 'DA_HUY', label: 'Đã hủy' },
            ]}
          />
          <Button
            type="text"
            onClick={() => {
              datThamSo({});
            }}
          >
            Xóa bộ lọc
          </Button>
          <div className="goi-y-loc">
            <BieuTuong ten="khien" size={26} />
            <h4>An tâm đặt giá</h4>
            <p>Mọi sản phẩm đều được duyệt trước khi lên phiên.</p>
            <Link to="/huong-dan">Tìm hiểu thêm ↗</Link>
          </div>
        </aside>
        <div className="ket-qua-kham-pha">
          <div className="thanh-ket-qua">
            <span>
              {thamSo.get('q') ? `Kết quả cho “${thamSo.get('q')}”` : 'Tất cả phiên đấu giá'}
            </span>
            <span className="chu-mo">Phiên mới nhất trước</span>
          </div>
          <ChoDuLieu
            truyVan={phien}
            rong={phien.data?.length === 0}
            thongDiepRong="Chưa tìm thấy phiên phù hợp. Hãy thử từ khóa khác hoặc xóa bộ lọc."
          >
            <div className="luoi-phien">
              {phien.data?.map((p) => (
                <ThePhien phien={p} key={p.id} />
              ))}
            </div>
          </ChoDuLieu>
          {!phien.isPending && !phien.isError && (
            <PhanTrang
              trang={trang}
              datTrang={(v) => doiLoc('page', String(v))}
              soLuong={phien.data?.length || 0}
              coTrangSau={phien.coTrangSau}
              dangTai={phien.isFetching}
            />
          )}
        </div>
      </div>
    </div>
  );
}
