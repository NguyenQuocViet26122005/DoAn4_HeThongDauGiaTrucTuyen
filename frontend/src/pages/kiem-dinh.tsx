import { Button, Input, Select } from 'antd';
import { Link, useSearchParams } from 'react-router-dom';
import { ChoDuLieu, PhanTrang, TieuDe, TrangThai } from '../components/dung-chung';
import { useDuLieu } from '../hooks/su-dung-du-lieu';
import { trangThaiKiemDinh, type HoSoKiemDinh } from '../types/kiem-dinh';
import { ngayGio, nhan } from '../utils/dinh-dang';

export default function KiemDinh({ quanTri = false }: { quanTri?: boolean }) {
  const [thamSo, datThamSo] = useSearchParams();
  const trang = Math.max(1, Number(thamSo.get('page')) || 1);
  const tuKhoa = thamSo.get('q') || '';
  const goc = quanTri ? '/quan-tri' : '/nguoi-ban';
  const hoSo = useDuLieu<HoSoKiemDinh[]>(quanTri ? '/admin/inspections' : '/inspections', {
    page: trang,
    limit: 12,
    q: tuKhoa,
    trang_thai: thamSo.get('trang_thai') || undefined,
    san_pham_id: thamSo.get('san_pham_id') || undefined,
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
        nhanNho={quanTri ? 'TRUNG TÂM KIỂM ĐỊNH' : 'KHÔNG GIAN NGƯỜI BÁN'}
        ten="Hồ sơ kiểm định"
        moTa={
          quanTri
            ? 'Tiếp nhận hàng, lưu báo cáo chuyên gia và theo dõi sản phẩm tại trung tâm.'
            : 'Khai báo gửi hàng và theo dõi kết quả kiểm định sản phẩm của bạn.'
        }
      />
      <div className="bo-loc-kiem-dinh">
        <Input.Search
          key={tuKhoa}
          defaultValue={tuKhoa}
          maxLength={100}
          allowClear
          placeholder="Tên sản phẩm hoặc mã hồ sơ…"
          aria-label="Tìm hồ sơ kiểm định"
          onSearch={(giaTri) => loc('q', giaTri.trim())}
        />
        <Select
          aria-label="Trạng thái kiểm định"
          placeholder="Tất cả trạng thái"
          allowClear
          value={thamSo.get('trang_thai') || undefined}
          onChange={(giaTri) => loc('trang_thai', giaTri)}
          options={trangThaiKiemDinh.map((value) => ({ value, label: nhan(value) }))}
        />
        <Button onClick={() => datThamSo({})}>Bỏ lọc</Button>
      </div>
      {thamSo.get('san_pham_id') && (
        <p className="chu-mo">Đang xem hồ sơ của sản phẩm #{thamSo.get('san_pham_id')}.</p>
      )}
      <ChoDuLieu
        truyVan={hoSo}
        rong={hoSo.data?.length === 0}
        thongDiepRong="Chưa có hồ sơ phù hợp. Hồ sơ được Admin mở từ sản phẩm đang chờ duyệt."
      >
        <div className="danh-sach-kiem-dinh">
          {hoSo.data?.map((muc) => (
            <article className="dong-kiem-dinh" key={muc.id}>
              <div>
                <small className="chu-mo">
                  Lần {muc.lan_kiem_dinh} · Sản phẩm #{muc.san_pham_id}
                </small>
                <h2>
                  <Link to={`${goc}/kiem-dinh/${muc.id}`}>{muc.tieu_de}</Link>
                </h2>
                <p className="ma-kiem-dinh">{muc.ma_kiem_dinh}</p>
                <small className="chu-mo">Ngày mở: {ngayGio(muc.ngay_tao)}</small>
              </div>
              <div className="hanh-dong-san-pham-ban">
                <TrangThai giaTri={muc.trang_thai} />
                {muc.ngay_roi_trung_tam && <small>Hàng đã rời trung tâm</small>}
                <Link to={`${goc}/kiem-dinh/${muc.id}`}>Mở hồ sơ ↗</Link>
              </div>
            </article>
          ))}
        </div>
      </ChoDuLieu>
      {!hoSo.isPending && !hoSo.isError && (
        <PhanTrang
          trang={trang}
          datTrang={(so) => loc('page', String(so))}
          soLuong={hoSo.data?.length || 0}
          gioiHan={12}
        />
      )}
    </>
  );
}
