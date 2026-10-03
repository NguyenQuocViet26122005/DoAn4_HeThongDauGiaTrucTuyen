import { Button } from 'antd';
import { Link, useSearchParams } from 'react-router-dom';
import { ChoDuLieu, PhanTrang, TieuDe, TrangThai } from '../components/dung-chung';
import { useDuLieu } from '../hooks/su-dung-du-lieu';
import type { TranhChap } from '../types/tranh-chap';
import { ngayGio, nhan } from '../utils/dinh-dang';

export default function DanhSachTranhChap({ quanTri = false }: { quanTri?: boolean }) {
  const [thamSo, datThamSo] = useSearchParams();
  const trang = Math.max(1, Math.floor(Number(thamSo.get('page')) || 1));
  const truyVan = useDuLieu<TranhChap[]>(quanTri ? '/admin/disputes' : '/disputes', {
    page: trang,
    limit: 12,
  });
  const goc = quanTri ? '/quan-tri/tranh-chap' : '/tai-khoan/tranh-chap';

  return (
    <>
      <TieuDe
        ten={quanTri ? 'Quản lý tranh chấp' : 'Hỗ trợ & tranh chấp'}
        moTa="Theo dõi phản hồi, bằng chứng và quyết định xử lý giao dịch."
      >
        <Button loading={truyVan.isFetching} onClick={() => void truyVan.refetch()}>
          Làm mới
        </Button>
      </TieuDe>
      {!quanTri && (
        <p>
          Mở yêu cầu hỗ trợ từ{' '}
          <Link className="link-vang" to="/tai-khoan/don-hang">
            chi tiết đơn hàng
          </Link>{' '}
          khi đủ điều kiện.
        </p>
      )}
      <ChoDuLieu
        truyVan={truyVan}
        rong={truyVan.data?.length === 0}
        thongDiepRong="Chưa có hồ sơ tranh chấp ở trang này."
      >
        <div className="danh-sach-don">
          {truyVan.data?.map((hoSo) => (
            <article className="tam-noi-dung the-don" key={hoSo.id}>
              <div>
                <TrangThai giaTri={hoSo.trang_thai} />
                <h2>
                  <Link to={`${goc}/${hoSo.id}`}>
                    #{hoSo.id} · {nhan(hoSo.ly_do)}
                  </Link>
                </h2>
                <p>
                  Đơn #{hoSo.don_hang_id} · {ngayGio(hoSo.ngay_tao)}
                </p>
                <p className="tom-tat-tranh-chap">{hoSo.mo_ta}</p>
              </div>
              <Link className="link-vang" to={`${goc}/${hoSo.id}`}>
                Xem hồ sơ →
              </Link>
            </article>
          ))}
        </div>
      </ChoDuLieu>
      {!truyVan.isPending && !truyVan.isError && (
        <PhanTrang
          trang={trang}
          datTrang={(so) => datThamSo({ page: String(so) })}
          soLuong={truyVan.data?.length || 0}
          gioiHan={12}
        />
      )}
    </>
  );
}
