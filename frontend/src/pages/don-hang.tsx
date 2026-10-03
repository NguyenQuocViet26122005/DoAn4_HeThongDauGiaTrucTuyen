import { Button, Tag } from 'antd';
import { Link, useSearchParams } from 'react-router-dom';
import { ChoDuLieu, PhanTrang, TieuDe, TrangThai } from '../components/dung-chung';
import { useDuLieu } from '../hooks/su-dung-du-lieu';
import { usePhienDangNhap } from '../store/phien-dang-nhap';
import type { DonHang } from '../types/don-hang';
import { ngayGio, tien } from '../utils/dinh-dang';

export default function DonHangCuaToi({ khuVuc = 'tai-khoan' }: { khuVuc?: string }) {
  const [thamSo, datThamSo] = useSearchParams();
  const trang = Math.max(1, Math.floor(Number(thamSo.get('page')) || 1));
  const nguoiDung = usePhienDangNhap((s) => s.nguoiDung);
  const quanTri = khuVuc === 'quan-tri';
  const nguoiBan = khuVuc === 'nguoi-ban';
  const truyVan = useDuLieu<DonHang[]>(quanTri ? '/admin/orders' : '/orders', {
    page: trang,
    limit: 12,
    ...(nguoiBan ? { vai_tro: 'NGUOI_BAN' } : {}),
  });

  return (
    <>
      <TieuDe
        ten={quanTri ? 'Quản lý đơn hàng' : nguoiBan ? 'Đơn bán hàng' : 'Đơn hàng của tôi'}
        moTa={
          quanTri
            ? 'Theo dõi giao dịch, gửi hàng từ trung tâm và xử lý các đơn cần can thiệp.'
            : nguoiBan
              ? 'Đơn do bạn bán, mới nhất trước. Theo dõi thanh toán và trách nhiệm gửi hàng.'
              : 'Các đơn bạn mua hoặc bán, mới nhất trước.'
        }
      >
        <Button loading={truyVan.isFetching} onClick={() => void truyVan.refetch()}>
          Làm mới
        </Button>
      </TieuDe>
      <ChoDuLieu
        truyVan={truyVan}
        rong={truyVan.data?.length === 0}
        thongDiepRong="Chưa có đơn hàng ở trang này."
      >
        <div className="danh-sach-don">
          {truyVan.data?.map((don) => (
            <article className="tam-noi-dung the-don" key={don.id}>
              <div>
                <Tag>
                  {quanTri
                    ? don.nguon_gui_hang === 'TRUNG_TAM'
                      ? 'Gửi từ trung tâm'
                      : 'Người bán gửi'
                    : String(don.nguoi_mua_id) === String(nguoiDung?.id)
                      ? 'Bạn mua'
                      : 'Bạn bán'}
                </Tag>
                <TrangThai giaTri={don.trang_thai} />
                <h2>
                  <Link to={`/${khuVuc}/don-hang/${don.id}`}>
                    {don.tieu_de || `Phiên #${don.phien_dau_gia_id}`}
                  </Link>
                </h2>
                <p className="chu-mo">
                  {don.ma_don_hang} · {ngayGio(don.ngay_tao)}
                </p>
                {don.trang_thai === 'CHO_THANH_TOAN' && (
                  <p>Hạn thanh toán: {ngayGio(don.han_thanh_toan)}</p>
                )}
                {['CHO_GUI_HANG', 'DA_THANH_TOAN'].includes(don.trang_thai) && (
                  <p>Hạn gửi hàng: {ngayGio(don.han_nguoi_ban_gui_hang)}</p>
                )}
                {!!Number(don.can_admin_xu_ly) && <Tag color="orange">Cần Admin xử lý</Tag>}
              </div>
              <div className="tong-don">
                <span>Tổng đơn gồm phí</span>
                <strong>{tien(don.tong_tien)}</strong>
                <Link className="link-vang" to={`/${khuVuc}/don-hang/${don.id}`}>
                  Xem đơn hàng →
                </Link>
              </div>
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
