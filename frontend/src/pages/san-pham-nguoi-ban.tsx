import { Button, Input, Select } from 'antd';
import { Link, useSearchParams } from 'react-router-dom';
import { AnhSanPham, ChoDuLieu, PhanTrang, TieuDe, TrangThai } from '../components/dung-chung';
import QuyenNguoiBan from '../components/quyen-nguoi-ban';
import { useDuLieu } from '../hooks/su-dung-du-lieu';
import type { SanPhamTrongDanhSach } from '../types/san-pham';
import type { DanhMuc } from '../types/du-lieu';
import { ngayGio, nhan } from '../utils/dinh-dang';

function DanhSachSanPham() {
  const [thamSo, datThamSo] = useSearchParams();
  const trang = Math.max(1, Number(thamSo.get('page')) || 1);
  const tuKhoa = thamSo.get('q') || '';
  const trangThai = thamSo.get('trang_thai') || undefined;
  const danhMucId = thamSo.get('danh_muc_id') || undefined;
  const danhMuc = useDuLieu<DanhMuc[]>('/categories');
  const sanPham = useDuLieu<SanPhamTrongDanhSach[]>('/products/mine', {
    page: trang,
    limit: 12,
    q: tuKhoa,
    trang_thai: trangThai,
    danh_muc_id: danhMucId,
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
        ten="Sản phẩm của tôi"
        moTa="Chăm chút thông tin và hình ảnh trước khi đưa món đồ của bạn lên sàn."
      >
        <Link className="nut-vang" to="/nguoi-ban/san-pham/moi">
          + Thêm sản phẩm
        </Link>
      </TieuDe>
      <div className="lo-trinh-san-pham" aria-label="Quy trình đăng bán">
        <span>
          <b>01</b> Tạo bản nháp
        </span>
        <span>
          <b>02</b> Bổ sung ảnh & thông tin
        </span>
        <span>
          <b>03</b> Gửi duyệt / kiểm định
        </span>
        <span>
          <b>04</b> Tạo phiên khi được duyệt
        </span>
      </div>
      <div className="bo-loc-san-pham">
        <Input.Search
          key={tuKhoa}
          defaultValue={tuKhoa}
          aria-label="Tìm sản phẩm của tôi"
          placeholder="Tìm theo tên sản phẩm…"
          maxLength={100}
          allowClear
          onSearch={(giaTri) => loc('q', giaTri.trim())}
        />
        <Select
          aria-label="Lọc trạng thái sản phẩm"
          placeholder="Tất cả trạng thái"
          value={trangThai}
          allowClear
          onChange={(giaTri) => loc('trang_thai', giaTri)}
          options={['BAN_NHAP', 'CHO_XU_LY', 'DA_DUYET', 'TU_CHOI', 'LUU_TRU'].map((value) => ({
            value,
            label: nhan(value),
          }))}
        />
        <Select
          aria-label="Lọc danh mục sản phẩm"
          placeholder="Tất cả danh mục"
          value={danhMucId}
          allowClear
          loading={danhMuc.isPending}
          onChange={(giaTri) => loc('danh_muc_id', giaTri)}
          options={danhMuc.data?.map((muc) => ({ value: String(muc.id), label: muc.ten }))}
        />
        <Button onClick={() => datThamSo({})}>Bỏ lọc</Button>
      </div>
      <ChoDuLieu
        truyVan={sanPham}
        rong={sanPham.data?.length === 0}
        thongDiepRong="Chưa có sản phẩm phù hợp. Bạn có thể bỏ lọc hoặc tạo bản nháp mới."
      >
        <div className="danh-sach-san-pham-ban">
          {sanPham.data?.map((muc) => (
            <article key={muc.id} className="dong-san-pham-ban">
              <Link to={`/nguoi-ban/san-pham/${muc.id}`} aria-label={`Xem ${muc.tieu_de}`}>
                <AnhSanPham src={muc.anh_chinh} ten={muc.tieu_de} />
              </Link>
              <div className="thong-tin-san-pham-ban">
                <small>
                  #{muc.id} · {nhan(muc.tinh_trang_san_pham)}
                </small>
                <h2>
                  <Link to={`/nguoi-ban/san-pham/${muc.id}`}>{muc.tieu_de}</Link>
                </h2>
                <p>
                  {danhMuc.data?.find((dm) => String(dm.id) === String(muc.danh_muc_id))?.ten ||
                    'Danh mục đã lưu'}{' '}
                  · {ngayGio(muc.ngay_tao)}
                </p>
              </div>
              <div className="hanh-dong-san-pham-ban">
                <TrangThai giaTri={muc.trang_thai_duyet} />
                <Link to={`/nguoi-ban/san-pham/${muc.id}`}>Xem chi tiết ↗</Link>
                {!!Number(muc.co_the_tao_phien) && (
                  <Link to={`/nguoi-ban/phien/moi?san_pham_id=${muc.id}`}>
                    {Number(muc.da_tung_dau_gia) ? 'Đăng lại sản phẩm' : 'Tạo phiên đấu giá'} ↗
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      </ChoDuLieu>
      {!sanPham.isPending && !sanPham.isError && (
        <PhanTrang
          trang={trang}
          datTrang={(so) => loc('page', String(so))}
          soLuong={sanPham.data?.length || 0}
          gioiHan={12}
        />
      )}
    </>
  );
}

export default function SanPhamNguoiBan() {
  return (
    <QuyenNguoiBan>
      <DanhSachSanPham />
    </QuyenNguoiBan>
  );
}
