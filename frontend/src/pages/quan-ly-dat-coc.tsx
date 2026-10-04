import { useState } from 'react';
import { Button } from 'antd';
import { Link } from 'react-router-dom';
import { ChoDuLieu, PhanTrang, TieuDe, TrangThai } from '../components/dung-chung';
import { useDuLieu } from '../hooks/su-dung-du-lieu';
import { ngayGio, tien } from '../utils/dinh-dang';

interface Coc {
  id: string;
  phien_dau_gia_id: string;
  nguoi_dung_id: string;
  don_hang_id: string | null;
  so_tien: string;
  trang_thai: string;
  ngay_dat_coc: string | null;
  ngay_hoan: string | null;
  ngay_chuyen_vao_don: string | null;
  ngay_khong_hoan: string | null;
  ly_do_xu_ly: string | null;
}

export default function QuanLyDatCoc() {
  const [trang, datTrang] = useState(1);
  const truyVan = useDuLieu<Coc[]>('/admin/deposits', { page: trang, limit: 12 });

  return (
    <>
      <TieuDe
        ten="Quản lý đặt cọc"
        moTa="Đối soát cọc theo kết quả phiên và đơn hàng. Trạng thái được cập nhật bởi luồng giao dịch."
      >
        <Button loading={truyVan.isFetching} onClick={() => void truyVan.refetch()}>
          Làm mới
        </Button>
      </TieuDe>
      <ChoDuLieu truyVan={truyVan} rong={truyVan.data?.length === 0}>
        <div className="bang-cuon">
          <table className="bang-du-lieu">
            <thead>
              <tr>
                <th>Khoản cọc</th>
                <th>Số tiền</th>
                <th>Trạng thái</th>
                <th>Các mốc xử lý</th>
                <th>Đơn hàng</th>
              </tr>
            </thead>
            <tbody>
              {truyVan.data?.map((muc) => (
                <tr key={muc.id}>
                  <td>
                    #{muc.id}
                    <p>Tài khoản #{muc.nguoi_dung_id}</p>
                    <Link to={`/phien/${muc.phien_dau_gia_id}`}>Phiên #{muc.phien_dau_gia_id}</Link>
                  </td>
                  <td>{tien(muc.so_tien)}</td>
                  <td>
                    <TrangThai giaTri={muc.trang_thai} />
                    <p>{muc.ly_do_xu_ly}</p>
                  </td>
                  <td>
                    {[
                      ['Đặt cọc', muc.ngay_dat_coc],
                      ['Hoàn cọc', muc.ngay_hoan],
                      ['Chuyển vào đơn', muc.ngay_chuyen_vao_don],
                      ['Không hoàn', muc.ngay_khong_hoan],
                    ]
                      .filter(([, ngay]) => ngay)
                      .map(([ten, ngay]) => (
                        <p key={ten}>
                          {ten}: {ngayGio(ngay)}
                        </p>
                      ))}
                  </td>
                  <td>
                    {muc.don_hang_id ? (
                      <Link to={`/quan-tri/don-hang/${muc.don_hang_id}`}>
                        Đơn #{muc.don_hang_id}
                      </Link>
                    ) : (
                      'Chưa gắn đơn'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChoDuLieu>
      {!truyVan.isPending && !truyVan.isError && (
        <PhanTrang
          trang={trang}
          datTrang={datTrang}
          soLuong={truyVan.data?.length || 0}
          gioiHan={12}
        />
      )}
    </>
  );
}
