import { Alert, Button, Descriptions } from 'antd';
import { Link, useParams } from 'react-router-dom';
import { ChoDuLieu, TieuDe, TrangThai } from '../components/dung-chung';
import { useDuLieu } from '../hooks/su-dung-du-lieu';
import type { DonHang } from '../types/don-hang';
import { ngayGio, nhan, tien } from '../utils/dinh-dang';
import ThaoTacDonHang from '../components/thao-tac-don-hang';
import GiaoHangVaHoTro from '../components/giao-hang-va-ho-tro';
import TaoDeNghiMuaTiep from '../components/tao-de-nghi-mua-tiep';
import DanhGiaDon from '../components/danh-gia-don';
import { lamMoiDon } from '../services/don-hang';
import { usePhienDangNhap } from '../store/phien-dang-nhap';

export default function BienNhanDon({ khuVuc = 'tai-khoan' }: { khuVuc?: string }) {
  const { id } = useParams();
  const truyVan = useDuLieu<DonHang>(`/orders/${id}`);
  const nguoiDung = usePhienDangNhap((s) => s.nguoiDung);
  const don = truyVan.data;

  return (
    <>
      <TieuDe ten="Thông tin đơn hàng" moTa="Số tiền và địa chỉ đã được ghi nhận từ giao dịch.">
        <Button loading={truyVan.isFetching} onClick={() => void lamMoiDon(id!)}>
          Làm mới
        </Button>
      </TieuDe>
      <Link className="link-vang" to={`/${khuVuc}/don-hang`}>
        ← Danh sách đơn hàng
      </Link>
      <ChoDuLieu truyVan={truyVan}>
        {don && (
          <div className="chi-tiet-don">
            <section className="tam-noi-dung thong-tin-don">
              <h2>{don.ma_don_hang}</h2>
              <TrangThai giaTri={don.trang_thai} />
              <Descriptions
                column={1}
                items={[
                  {
                    key: 'gia',
                    label: 'Giá sản phẩm',
                    children: tien(don.gia_san_pham),
                  },
                  {
                    key: 'phi',
                    label: 'Phí vận chuyển',
                    children: tien(don.phi_van_chuyen),
                  },
                  {
                    key: 'tong',
                    label: 'Tổng đơn',
                    children: tien(don.tong_tien),
                  },
                  {
                    key: 'coc',
                    label: 'Cọc đã chuyển vào đơn',
                    children: tien(don.tien_coc_da_chuyen),
                  },
                  {
                    key: 'thu',
                    label: 'Tổng tiền đã thu (gồm cọc)',
                    children: tien(don.so_tien_da_thu),
                  },
                  {
                    key: 'con-lai',
                    label: 'Còn phải thanh toán',
                    children: tien(don.so_tien_con_phai_thanh_toan),
                  },
                  {
                    key: 'dang-giu',
                    label: 'Số tiền đang giữ',
                    children: tien(don.so_tien_dang_giu),
                  },
                  {
                    key: 'da-hoan',
                    label: 'Đã hoàn',
                    children: tien(don.so_tien_da_hoan),
                  },
                  {
                    key: 'giai-ngan',
                    label: 'Đã giải ngân',
                    children: tien(don.so_tien_da_giai_ngan),
                  },
                  {
                    key: 'giu',
                    label: 'Giữ tiền trung gian',
                    children: nhan(don.trang_thai_giu_tien),
                  },
                  {
                    key: 'nguoi',
                    label: 'Người nhận',
                    children: `${don.ten_nguoi_nhan} · ${don.sdt_nguoi_nhan}`,
                  },
                  {
                    key: 'dia-chi',
                    label: 'Địa chỉ đã lưu vào đơn',
                    children: don.dia_chi_giao_hang,
                  },
                ]}
              />
              {!!Number(don.can_admin_xu_ly) && (
                <Alert
                  type="warning"
                  title="Đơn cần Admin xử lý"
                  description={don.ly_do_can_xu_ly}
                />
              )}
              {don.ly_do_huy && (
                <Alert type="warning" title="Lý do hủy đơn" description={don.ly_do_huy} />
              )}
              <Link className="link-vang" to={`/phien/${don.phien_dau_gia_id}`}>
                Quay lại phiên đấu giá →
              </Link>
            </section>
            <div className="thao-tac-don">
              {String(nguoiDung?.id) === String(don.nguoi_mua_id) && (
                <ThaoTacDonHang key={`${don.id}:${nguoiDung?.id}`} don={don} />
              )}
              <GiaoHangVaHoTro key={`ho-tro:${don.id}:${nguoiDung?.id}`} don={don} />
              <TaoDeNghiMuaTiep don={don} />
              <DanhGiaDon don={don} />
            </div>
            <section className="tam-noi-dung thong-tin-don">
              <h2>Giao hàng và kiểm tra</h2>
              <Descriptions
                column={1}
                items={[
                  {
                    key: 'nguon',
                    label: 'Gửi từ',
                    children:
                      don.nguon_gui_hang === 'TRUNG_TAM' ? 'Trung tâm kiểm định' : 'Người bán',
                  },
                  {
                    key: 'han-gui',
                    label: 'Hạn gửi hàng',
                    children: ngayGio(don.han_nguoi_ban_gui_hang),
                  },
                  {
                    key: 'don-vi',
                    label: 'Đơn vị vận chuyển',
                    children: don.don_vi_van_chuyen || 'Chưa khai báo',
                  },
                  {
                    key: 'van-don',
                    label: 'Mã vận đơn',
                    children: don.ma_van_don || 'Chưa khai báo',
                  },
                  {
                    key: 'gui',
                    label: 'Đã gửi',
                    children: ngayGio(don.ngay_gui_hang),
                  },
                  {
                    key: 'nhan',
                    label: 'Đã nhận hàng',
                    children: ngayGio(don.ngay_giao_hang),
                  },
                  {
                    key: 'han-kiem',
                    label: 'Hạn kiểm tra hàng',
                    children: ngayGio(don.han_kiem_tra),
                  },
                  {
                    key: 'khieu-nai',
                    label: 'Mốc khiếu nại chưa nhận',
                    children: ngayGio(don.moc_khieu_nai_chua_nhan),
                  },
                  {
                    key: 'xong',
                    label: 'Hoàn tất',
                    children: ngayGio(don.ngay_hoan_thanh),
                  },
                ]}
              />
              <p className="chu-mo">
                Mã vận đơn không tự xác nhận đã giao. Chỉ xác nhận nhận hàng khi hàng đã tới người
                mua.
              </p>
              {don.tranh_chap.length > 0 && (
                <Alert
                  type="warning"
                  title="Đơn có hồ sơ tranh chấp"
                  description={don.tranh_chap
                    .map((muc) => `#${muc.id}: ${nhan(muc.trang_thai)}`)
                    .join(' · ')}
                />
              )}
            </section>
            <section className="tam-noi-dung lich-su-thanh-toan">
              <h2>Lịch sử thanh toán</h2>
              {don.thanh_toan.length === 0 ? (
                <p>Chưa có lần thanh toán ngoài cọc.</p>
              ) : (
                <div className="bang-cuon">
                  <table className="bang-du-lieu">
                    <thead>
                      <tr>
                        <th>Thời điểm</th>
                        <th>Số tiền</th>
                        <th>Kết quả</th>
                      </tr>
                    </thead>
                    <tbody>
                      {don.thanh_toan.map((muc) => (
                        <tr key={muc.id}>
                          <td>{ngayGio(muc.ngay_thanh_toan || muc.ngay_tao)}</td>
                          <td>{tien(muc.so_tien)}</td>
                          <td>{nhan(muc.trang_thai)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}
      </ChoDuLieu>
    </>
  );
}
