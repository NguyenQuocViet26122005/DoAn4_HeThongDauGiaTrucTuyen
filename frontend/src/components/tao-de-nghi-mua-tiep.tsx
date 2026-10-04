import { Link, useNavigate } from 'react-router-dom';
import BieuMauThaoTac from './bieu-mau-thao-tac';
import { usePhienDangNhap } from '../store/phien-dang-nhap';
import { lamMoiDeNghi, taoDeNghi } from '../services/de-nghi-mua-tiep';
import type { DonHang } from '../types/don-hang';

export default function TaoDeNghiMuaTiep({ don }: { don: DonHang }) {
  const nguoiDung = usePhienDangNhap((s) => s.nguoiDung);
  const diChuyen = useNavigate();

  if (
    nguoiDung?.vai_tro !== 'NGUOI_DUNG' ||
    nguoiDung.trang_thai_tai_khoan !== 'HOAT_DONG' ||
    nguoiDung.trang_thai_nguoi_ban !== 'DA_XAC_MINH' ||
    String(nguoiDung.id) !== String(don.nguoi_ban_id) ||
    don.trang_thai !== 'DA_HUY' ||
    don.ly_do_huy !== 'KHONG_THANH_TOAN'
  ) {
    return null;
  }

  return (
    <section className="tam-noi-dung thao-tac-don">
      <h2>Đề nghị mua tiếp</h2>
      <p>
        Người thắng không thanh toán. Bạn có thể đề nghị người trả giá hợp lệ tiếp theo mua sản
        phẩm.
      </p>
      <BieuMauThaoTac<Record<string, never>>
        ten="Gửi đề nghị mua tiếp"
        xacNhan={() => (
          <p>
            Xác nhận gửi một đề nghị cho ứng viên tiếp theo theo giá công khai hợp lệ. Hệ thống
            quyết định ứng viên và giá; bạn không nhập giá mới.
          </p>
        )}
        onGui={async () => {
          const deNghi = await taoDeNghi(don.id);

          await lamMoiDeNghi();
          diChuyen(`/tai-khoan/de-nghi/${deNghi.id}`);
        }}
      >
        <p>
          Mỗi phiên chỉ có một đề nghị chờ xử lý. Nếu người nhận từ chối hoặc hết hạn, bạn cần chủ
          động gửi đề nghị tiếp theo.
        </p>
        <p>Nếu đã gửi nhưng chưa nhận được phản hồi, hãy kiểm tra danh sách trước khi thử lại.</p>
      </BieuMauThaoTac>
      <Link className="link-vang" to="/tai-khoan/de-nghi">
        Xem đề nghị đã gửi và đã nhận →
      </Link>
    </section>
  );
}
