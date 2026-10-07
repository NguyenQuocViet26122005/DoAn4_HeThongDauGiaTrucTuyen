import { Button, Input, Select } from 'antd';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AnhSanPham,
  ChoDuLieu,
  DemNguoc,
  PhanTrang,
  TieuDe,
  TrangThaiPhien,
} from '../components/dung-chung';
import QuyenNguoiBan from '../components/quyen-nguoi-ban';
import { useDanhSachDuLieu } from '../hooks/su-dung-du-lieu';
import type { Phien } from '../types/du-lieu';
import { ngayGio, nhan, tien } from '../utils/dinh-dang';

function DanhSachPhien() {
  const [thamSo, datThamSo] = useSearchParams();
  const trang = Math.max(1, Number(thamSo.get('page')) || 1);
  const tuKhoa = thamSo.get('q') || '';
  const trangThai = thamSo.get('trang_thai') || undefined;
  const phien = useDanhSachDuLieu<Phien[]>('/auctions/mine', {
    q: tuKhoa,
    trang_thai: trangThai,
    page: trang,
    limit: 12,
  });

  function loc(ten: string, giaTri?: string) {
    const moi = new URLSearchParams(thamSo);

    moi.delete('page');
    if (giaTri) {
      moi.set(ten, giaTri);
    } else {
      moi.delete(ten);
    }
    datThamSo(moi);
  }

  return (
    <>
      <TieuDe
        nhanNho="KHÔNG GIAN NGƯỜI BÁN"
        ten="Phiên đấu giá của tôi"
        moTa="Theo dõi lịch mở bán, giá công khai và kết quả từng phiên."
      >
        <Link className="nut-vang" to="/nguoi-ban/phien/moi">
          + Tạo phiên đấu giá
        </Link>
      </TieuDe>
      <div className="bo-loc-kiem-dinh">
        <Input.Search
          key={tuKhoa}
          defaultValue={tuKhoa}
          aria-label="Tìm phiên của tôi"
          placeholder="Tìm theo tên sản phẩm…"
          maxLength={100}
          allowClear
          onSearch={(giaTri) => loc('q', giaTri.trim())}
        />
        <Select
          aria-label="Trạng thái phiên"
          placeholder="Tất cả trạng thái"
          value={trangThai}
          allowClear
          onChange={(giaTri) => loc('trang_thai', giaTri)}
          options={['DA_LEN_LICH', 'HOAT_DONG', 'DA_KET_THUC', 'THAT_BAI', 'DA_HUY'].map(
            (value) => ({ value, label: nhan(value) }),
          )}
        />
        <Button onClick={() => datThamSo({})}>Bỏ lọc</Button>
      </div>
      <ChoDuLieu
        truyVan={phien}
        rong={phien.data?.length === 0}
        thongDiepRong="Chưa có phiên phù hợp. Tạo phiên từ sản phẩm đã được duyệt hoặc thử bỏ bộ lọc."
      >
        <div className="danh-sach-san-pham-ban">
          {phien.data?.map((muc) => (
            <article key={muc.id} className="dong-san-pham-ban dong-phien-ban">
              <Link to={`/nguoi-ban/phien/${muc.id}`} aria-label={`Quản lý ${muc.tieu_de}`}>
                <AnhSanPham src={muc.anh_chinh} ten={muc.tieu_de} />
              </Link>
              <div className="thong-tin-san-pham-ban">
                <small>
                  PHIÊN #{muc.id} · {muc.ten_danh_muc}
                </small>
                <h2>
                  <Link to={`/nguoi-ban/phien/${muc.id}`}>{muc.tieu_de}</Link>
                </h2>
                <div className="so-lieu-phien-ban">
                  <strong>{tien(muc.gia_hien_tai)}</strong>
                  <span>{muc.tong_luot_tra_gia} lượt trả giá</span>
                </div>
                <p>Bắt đầu {ngayGio(muc.thoi_gian_bat_dau)}</p>
                <p>Kết thúc {ngayGio(muc.thoi_gian_ket_thuc)}</p>
              </div>
              <div className="hanh-dong-san-pham-ban">
                <TrangThaiPhien phien={muc} />
                {['DA_LEN_LICH', 'HOAT_DONG'].includes(muc.trang_thai) && (
                  <DemNguoc batDau={muc.thoi_gian_bat_dau} ketThuc={muc.thoi_gian_ket_thuc} />
                )}
                <Link to={`/nguoi-ban/phien/${muc.id}`}>Quản lý phiên ↗</Link>
              </div>
            </article>
          ))}
        </div>
      </ChoDuLieu>
      {!phien.isPending && !phien.isError && (
        <PhanTrang
          trang={trang}
          datTrang={(so) => loc('page', String(so))}
          soLuong={phien.data?.length || 0}
          coTrangSau={phien.coTrangSau}
          dangTai={phien.isFetching}
        />
      )}
    </>
  );
}

export default function PhienNguoiBan() {
  return (
    <QuyenNguoiBan>
      <DanhSachPhien />
    </QuyenNguoiBan>
  );
}
