import { useState } from 'react';
import { Alert, Button, Descriptions } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import {
  AnhSanPham,
  ChoDuLieu,
  DemNguoc,
  PhanTrang,
  TrangThaiPhien,
} from '../components/dung-chung';
import { useDuLieu } from '../hooks/su-dung-du-lieu';
import { ngayGio, nhan, tien } from '../utils/dinh-dang';
import type { Phien, SanPham } from '../types/du-lieu';
import ThamGiaPhien from '../components/tham-gia-phien';
import TheoDoiPhien from '../components/theo-doi-phien';
import BaoCaoSanPham from '../components/bao-cao-san-pham';
import { doc } from '../services/api';
import { lamMoiThamGia } from '../services/tham-gia-phien';
import { usePhienDangNhap } from '../store/phien-dang-nhap';

interface LuotGia {
  id: string;
  nguoi_tra_gia: string;
  so_tien: string;
  ngay_tao: string;
}

interface KiemDinhCongKhai {
  ma_kiem_dinh: string;
  ket_qua: string;
  don_vi_kiem_dinh: string;
  ngay_kiem_dinh: string;
  ma_chung_nhan: string | null;
}

function NoiDungPhien({ phien }: { phien: Phien }) {
  const [anhChon, datAnhChon] = useState<string>();
  const [trang, datTrang] = useState(1);
  const nguoiDung = usePhienDangNhap((s) => s.nguoiDung);
  const sanPham = useDuLieu<SanPham>(`/products/${phien.san_pham_id}`);
  const kiemDinh = useDuLieu<KiemDinhCongKhai | null>(`/products/${phien.san_pham_id}/inspection`);
  const lichSu = useDuLieu<LuotGia[]>(
    `/auctions/${phien.id}/bids`,
    { page: trang, limit: 10 },
    true,
    ['DA_LEN_LICH', 'HOAT_DONG'].includes(phien.trang_thai) ? 10000 : false,
  );

  return (
    <>
      <div className="chi-tiet-phien">
        <section>
          <ChoDuLieu truyVan={sanPham}>
            <AnhSanPham
              src={anhChon || sanPham.data?.hinh_anh[0]?.duong_dan_anh}
              ten={phien.tieu_de}
              lon
            />
            <div className="anh-thu-nho">
              {sanPham.data?.hinh_anh.map((anh, i) => (
                <button
                  key={anh.id}
                  aria-label={`Xem ảnh ${i + 1}`}
                  aria-pressed={
                    (anhChon || sanPham.data?.hinh_anh[0]?.duong_dan_anh) === anh.duong_dan_anh
                  }
                  onClick={() => datAnhChon(anh.duong_dan_anh)}
                >
                  <AnhSanPham src={anh.duong_dan_anh} ten={phien.tieu_de} />
                </button>
              ))}
            </div>
          </ChoDuLieu>
        </section>
        <section className="thong-tin-phien">
          <span className="nhan-nho">PHIÊN #{phien.id}</span>
          <h1>{phien.tieu_de}</h1>
          <TrangThaiPhien phien={phien} />
          <TheoDoiPhien key={`${phien.id}:${nguoiDung?.id}`} id={phien.id} />
          <p>
            <Link to={`/nguoi-dung/${phien.nguoi_ban_id}/danh-gia`}>Xem đánh giá về người bán</Link>
          </p>
          <div className="gia-chi-tiet">
            <span>Giá trả công khai hiện tại</span>
            <strong>{tien(phien.gia_hien_tai)}</strong>
            <small>{phien.tong_luot_tra_gia} lượt trả giá</small>
          </div>
          <div className="thoi-gian-phien">
            <DemNguoc batDau={phien.thoi_gian_bat_dau} ketThuc={phien.thoi_gian_ket_thuc} />
            <span>Kết thúc: {ngayGio(phien.thoi_gian_ket_thuc)}</span>
          </div>
          <dl className="thong-so">
            <div>
              <dt>Giá khởi điểm</dt>
              <dd>{tien(phien.gia_khoi_diem)}</dd>
            </div>
            <div>
              <dt>Phí vận chuyển</dt>
              <dd>{tien(phien.phi_van_chuyen)}</dd>
            </div>
            <div>
              <dt>Đặt cọc trước khi trả giá</dt>
              <dd>
                {Number(phien.yeu_cau_dat_coc) ? tien(phien.so_tien_dat_coc) : 'Không yêu cầu'}
              </dd>
            </div>
            {!!Number(phien.cho_phep_mua_ngay) && phien.gia_mua_ngay && (
              <div>
                <dt>Giá Mua ngay</dt>
                <dd>{tien(phien.gia_mua_ngay)}</dd>
              </div>
            )}
          </dl>
          <Alert
            type={phien.nguoi_dan_dau === `ND-${nguoiDung?.id}` ? 'success' : 'info'}
            title={
              phien.nguoi_dan_dau
                ? `Người dẫn đầu: ${phien.nguoi_dan_dau === `ND-${nguoiDung?.id}` ? 'Bạn' : phien.nguoi_dan_dau}`
                : 'Chưa có người dẫn đầu'
            }
            description={
              !Number(phien.tong_luot_tra_gia)
                ? 'Phiên chưa có lượt trả giá.'
                : Number(phien.dat_gia_san)
                  ? 'Giá hiện tại đã đáp ứng điều kiện giá sàn (hoặc phiên không đặt giá sàn).'
                  : 'Giá hiện tại chưa đạt giá sàn. Dẫn đầu chưa đồng nghĩa với thắng phiên.'
            }
          />
          <Button onClick={() => void lamMoiThamGia(phien.id)}>Làm mới giá và trạng thái</Button>
          <ThamGiaPhien phien={phien} />
          <Link className="link-vang" to="/huong-dan">
            Xem quy tắc tham gia ↗
          </Link>
        </section>
      </div>
      <div className="chi-tiet-bo-sung">
        <section className="tam-noi-dung">
          <h2>Câu chuyện sản phẩm</h2>
          <ChoDuLieu truyVan={sanPham}>
            <p className="mo-ta-san-pham">{sanPham.data?.mo_ta}</p>
            <Descriptions
              column={1}
              items={[
                {
                  key: 'tinh-trang',
                  label: 'Tình trạng',
                  children: nhan(sanPham.data?.tinh_trang_san_pham),
                },
                {
                  key: 'thuong-hieu',
                  label: 'Thương hiệu',
                  children: sanPham.data?.thuong_hieu || 'Chưa cập nhật',
                },
                ...(sanPham.data?.thuoc_tinh || [])
                  .filter((t) => t.ten_thuoc_tinh.toLowerCase() !== 'thương hiệu')
                  .map((t) => ({
                    key: t.thuoc_tinh_id,
                    label: t.ten_thuoc_tinh,
                    children: `${t.gia_tri} ${t.don_vi || ''}`,
                  })),
              ]}
            />
            <BaoCaoSanPham phienId={phien.id} nguoiBanId={phien.nguoi_ban_id} />
          </ChoDuLieu>
        </section>
        <section className="tam-noi-dung">
          <h2>Thông tin kiểm định</h2>
          <ChoDuLieu
            truyVan={kiemDinh}
            rong={kiemDinh.data === null}
            thongDiepRong="Sản phẩm chưa có hồ sơ kiểm định công khai."
          >
            {kiemDinh.data && (
              <Descriptions
                column={1}
                items={[
                  {
                    key: 'ma',
                    label: 'Mã kiểm định',
                    children: kiemDinh.data.ma_kiem_dinh,
                  },
                  {
                    key: 'ket-qua',
                    label: 'Kết quả',
                    children: nhan(kiemDinh.data.ket_qua),
                  },
                  {
                    key: 'don-vi',
                    label: 'Đơn vị',
                    children: kiemDinh.data.don_vi_kiem_dinh,
                  },
                  {
                    key: 'ngay',
                    label: 'Ngày kiểm định',
                    children: ngayGio(kiemDinh.data.ngay_kiem_dinh),
                  },
                  {
                    key: 'chung-nhan',
                    label: 'Chứng nhận',
                    children: kiemDinh.data.ma_chung_nhan || 'Chưa cập nhật',
                  },
                ]}
              />
            )}
          </ChoDuLieu>
        </section>
      </div>
      <section className="tam-noi-dung khu-vuc">
        <div className="tieu-de-muc">
          <h2>Lịch sử trả giá</h2>
          <Button onClick={() => lichSu.refetch()} loading={lichSu.isFetching}>
            Cập nhật
          </Button>
        </div>
        <p className="chu-mo">
          Chỉ hiển thị giá trả công khai. Mức tối đa của người tham gia luôn được giữ kín.
        </p>
        <ChoDuLieu
          truyVan={lichSu}
          rong={lichSu.data?.length === 0}
          thongDiepRong="Phiên chưa có lượt trả giá."
        >
          <div className="bang-cuon">
            <table className="bang-du-lieu">
              <thead>
                <tr>
                  <th>Người tham gia</th>
                  <th>Giá công khai</th>
                  <th>Thời điểm</th>
                </tr>
              </thead>
              <tbody>
                {lichSu.data?.map((luot) => (
                  <tr key={luot.id}>
                    <td>{luot.nguoi_tra_gia}</td>
                    <td>{tien(luot.so_tien)}</td>
                    <td>{ngayGio(luot.ngay_tao)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChoDuLieu>
        {!lichSu.isPending && !lichSu.isError && (
          <PhanTrang
            trang={trang}
            datTrang={datTrang}
            soLuong={lichSu.data?.length || 0}
            gioiHan={10}
          />
        )}
      </section>
    </>
  );
}

export default function ChiTietPhien() {
  const { id } = useParams();
  const phien = useQuery({
    queryKey: [`/auctions/${id}`, undefined],
    queryFn: () => doc<Phien>(`/auctions/${id}`),
    refetchInterval: (truyVan) =>
      truyVan.state.data && ['DA_LEN_LICH', 'HOAT_DONG'].includes(truyVan.state.data.trang_thai)
        ? 10000
        : false,
  });

  return (
    <div className="khung trang-noi-dung">
      <div className="duong-dan">
        <Link to="/">Trang chủ</Link> / <Link to="/kham-pha">Khám phá</Link> / Chi tiết phiên
      </div>
      <ChoDuLieu truyVan={phien}>
        {phien.data && <NoiDungPhien key={id} phien={phien.data} />}
      </ChoDuLieu>
    </div>
  );
}
