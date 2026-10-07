import { Button } from 'antd';
import { BieuDoTrangThai } from '../components/bieu-do-tong-quan';
import '../styles/tong-quan-quan-tri.css';
import { Link } from 'react-router-dom';
import { ChoDuLieu, TieuDe } from '../components/dung-chung';
import { useDuLieu } from '../hooks/su-dung-du-lieu';
import { nhan, tien } from '../utils/dinh-dang';
import TrangThaiTacVuTuDong from '../components/trang-thai-tac-vu';

interface DongThongKe {
  trang_thai?: string;
  trang_thai_duyet?: string;
  trang_thai_tai_khoan?: string;
  vai_tro?: string;
  so_luong?: number | string;
  tong_gia_tri?: string;
  tong_tien?: string;
  dang_giu?: string;
}

const cacNhom = [
  ['nguoi_dung', 'Người dùng', 'nguoi-dung'],
  ['san_pham', 'Sản phẩm', 'san-pham'],
  ['phien_dau_gia', 'Phiên đấu giá', 'phien'],
  ['don_hang', 'Đơn hàng', 'don-hang'],
  ['thanh_toan_mo_phong', 'Thanh toán', 'don-hang'],
  ['giu_tien', 'Giữ tiền trung gian', 'don-hang'],
  ['tranh_chap', 'Tranh chấp', 'tranh-chap'],
];

export default function TongQuanQuanTri() {
  const truyVan = useDuLieu<Record<string, DongThongKe[]>>('/admin/statistics');

  return (
    <div className="tong-quan-quan-tri">
      <TieuDe
        ten="Tổng quan quản trị"
        moTa="Số liệu toàn hệ thống theo trạng thái hiện tại. Giá trị đơn và tiền đã thu không phải doanh thu của nền tảng."
      >
        <Button loading={truyVan.isFetching} onClick={() => void truyVan.refetch()}>
          Làm mới
        </Button>
      </TieuDe>
      <ChoDuLieu truyVan={truyVan}>
        <div className="tong-quan-chi-so" aria-label="Các chỉ số tổng quan">
          {cacNhom.slice(0, 4).map(([khoa, ten, duongDan]) => (
            <Link key={khoa} to={`/quan-tri/${duongDan}`}>
              <span>{ten}</span>
              <strong>
                {(truyVan.data?.[khoa] ?? [])
                  .reduce((tong, dong) => tong + Number(dong.so_luong || 0), 0)
                  .toLocaleString('vi-VN')}
              </strong>
              <small>Tất cả trạng thái ↗</small>
            </Link>
          ))}
        </div>
        <div className="tong-quan-bieu-do">
          <BieuDoTrangThai
            ten="Trạng thái phiên đấu giá"
            moTa="Phân bố các phiên trên toàn sàn ở thời điểm hiện tại."
            duLieu={truyVan.data?.phien_dau_gia ?? []}
            duongDan="/quan-tri/phien"
            dangVong
          />
          <BieuDoTrangThai
            ten="Tiến trình đơn hàng"
            moTa="Số đơn theo từng trạng thái xử lý."
            duLieu={truyVan.data?.don_hang ?? []}
            duongDan="/quan-tri/don-hang"
          />
          <BieuDoTrangThai
            ten="Duyệt sản phẩm"
            moTa="Phân bố sản phẩm theo kết quả duyệt."
            duLieu={truyVan.data?.san_pham ?? []}
            duongDan="/quan-tri/san-pham"
          />
        </div>
        <details className="tong-quan-bang-chi-tiet">
          <summary>Xem bảng số liệu chi tiết · tài khoản, giao dịch và giữ tiền</summary>
          {cacNhom.map(([khoa, ten, duongDan]) => (
            <section key={khoa} className="tam-noi-dung">
              <h2>
                <Link to={`/quan-tri/${duongDan}`}>{ten}</Link>
              </h2>
              {!truyVan.data?.[khoa]?.length ? (
                <p>Chưa có dữ liệu.</p>
              ) : (
                <div className="bang-cuon">
                  <table className="bang-du-lieu">
                    <thead>
                      <tr>
                        <th>Nhóm / trạng thái</th>
                        {khoa !== 'giu_tien' && <th>Số lượng</th>}
                        {['don_hang', 'thanh_toan_mo_phong', 'giu_tien'].includes(khoa) && (
                          <th>
                            {khoa === 'don_hang'
                              ? 'Giá trị đơn'
                              : khoa === 'giu_tien'
                                ? 'Tổng đã thu'
                                : 'Số tiền theo kết quả'}
                          </th>
                        )}
                        {khoa === 'giu_tien' && <th>Hiện đang giữ</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {truyVan.data?.[khoa].map((dong, viTri) => (
                        <tr key={viTri}>
                          <td>
                            {dong.vai_tro ? `${nhan(dong.vai_tro)} · ` : ''}
                            {dong.trang_thai_tai_khoan === 'HOAT_DONG'
                              ? 'Đang hoạt động'
                              : nhan(
                                  dong.trang_thai ||
                                    dong.trang_thai_duyet ||
                                    dong.trang_thai_tai_khoan,
                                )}
                          </td>
                          {khoa !== 'giu_tien' && <td>{dong.so_luong}</td>}
                          {['don_hang', 'thanh_toan_mo_phong', 'giu_tien'].includes(khoa) && (
                            <td>{tien(dong.tong_gia_tri ?? dong.tong_tien)}</td>
                          )}
                          {khoa === 'giu_tien' && <td>{tien(dong.dang_giu)}</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ))}
        </details>
      </ChoDuLieu>
      <TrangThaiTacVuTuDong />
    </div>
  );
}
