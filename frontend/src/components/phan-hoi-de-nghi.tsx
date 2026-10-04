import { useState } from 'react';
import { Alert } from 'antd';
import { Link } from 'react-router-dom';
import { ChoDuLieu } from './dung-chung';
import BieuMauThaoTac from './bieu-mau-thao-tac';
import ThanhToanMoPhong from './thanh-toan-mo-phong';
import { useDuLieu } from '../hooks/su-dung-du-lieu';
import { usePhienDangNhap } from '../store/phien-dang-nhap';
import { lamMoiDeNghi, tuChoiDeNghi } from '../services/de-nghi-mua-tiep';
import { docLanThanhToan, tenLanThanhToan } from '../services/lan-thanh-toan';
import { tien } from '../utils/dinh-dang';
import { noiDungDiaChi } from '../utils/dia-chi';
import { soTienMuaNgay } from '../utils/tien-tham-gia';
import type { DeNghiMuaTiep } from '../types/de-nghi-mua-tiep';
import type { DiaChi, KetQuaThanhToan } from '../types/tham-gia-phien';

export default function PhanHoiDeNghi({
  deNghi,
  conHan,
}: {
  deNghi: DeNghiMuaTiep;
  conHan: boolean;
}) {
  const nguoiDung = usePhienDangNhap((s) => s.nguoiDung)!;
  const diaChi = useDuLieu<DiaChi[]>('/users/me/addresses');
  const [ketQua, datKetQua] = useState<KetQuaThanhToan>();
  const [coLanCho, datCoLanCho] = useState(false);
  const diaChiNhan = diaChi.data?.[0];
  const soTien = soTienMuaNgay(deNghi.gia_de_nghi, deNghi.phi_van_chuyen, '0');
  const hoatDong = nguoiDung.trang_thai_tai_khoan === 'HOAT_DONG';

  return (
    <section className="tam-noi-dung thao-tac-don">
      <h2>Trả lời đề nghị</h2>
      {!conHan && (
        <Alert type="info" title="Đề nghị đã xử lý hoặc hết hạn, không nhận thanh toán mới." />
      )}
      {ketQua && (
        <Alert
          type={ketQua.ket_qua_mo_phong === 'THANH_CONG' ? 'success' : 'warning'}
          title={
            ketQua.ket_qua_mo_phong === 'THANH_CONG'
              ? 'Đã chấp nhận đề nghị'
              : 'Thanh toán thất bại'
          }
          description={
            ketQua.don_hang ? (
              <Link to={`/tai-khoan/don-hang/${ketQua.don_hang.id}`}>
                Xem đơn {ketQua.don_hang.ma_don_hang} →
              </Link>
            ) : (
              'Chưa tạo đơn thành công. Bạn có thể thanh toán lại nếu đề nghị còn hạn.'
            )
          }
        />
      )}
      <ChoDuLieu truyVan={diaChi}>
        {diaChiNhan ? (
          <p>
            Nhận hàng: {diaChiNhan.ten_nguoi_nhan} · {diaChiNhan.sdt_nguoi_nhan}
            <br />
            {noiDungDiaChi(diaChiNhan)}
          </p>
        ) : (
          <Alert type="info" title="Bạn cần thêm địa chỉ nhận hàng trước khi chấp nhận." />
        )}
        <Link className="link-vang" to={`/tai-khoan/dia-chi?de_nghi=${deNghi.id}`}>
          Quản lý địa chỉ nhận hàng →
        </Link>
      </ChoDuLieu>
      <ThanhToanMoPhong
        nguoiDungId={nguoiDung.id}
        doiTuongId={deNghi.id}
        loai="de-nghi"
        ten="Chấp nhận và thanh toán"
        khoa={!conHan || !hoatDong || !diaChiNhan || diaChi.isError || diaChi.isPending}
        onLanCho={datCoLanCho}
        daXuLy={(phanHoi) => {
          datKetQua(phanHoi);
          void lamMoiDeNghi();
        }}
      >
        <p>{deNghi.tieu_de}</p>
        <p>Giá đề nghị: {tien(deNghi.gia_de_nghi)}</p>
        <p>Phí vận chuyển: {tien(deNghi.phi_van_chuyen)}</p>
        <p>
          Thanh toán toàn bộ: <strong>{tien(soTien.tong)}</strong>
        </p>
        <p>
          Không đặt cọc lại và không dùng lại cọc đã hoàn. Thanh toán thành công mới chấp nhận đề
          nghị, tạo đơn và giữ tiền trung gian.
        </p>
        {diaChiNhan && (
          <p>
            Nhận hàng: {diaChiNhan.ten_nguoi_nhan} · {diaChiNhan.sdt_nguoi_nhan}
            <br />
            {noiDungDiaChi(diaChiNhan)}
          </p>
        )}
      </ThanhToanMoPhong>
      {conHan && (
        <BieuMauThaoTac<Record<string, never>>
          ten="Từ chối đề nghị"
          khoa={coLanCho || !hoatDong}
          xacNhan={() => (
            <p>
              Xác nhận từ chối đề nghị #{deNghi.id}. Bạn không thể chấp nhận lại đề nghị này sau khi
              từ chối.
            </p>
          )}
          onGui={async () => {
            if (docLanThanhToan(tenLanThanhToan(nguoiDung.id, deNghi.id, 'de-nghi'))) {
              throw new Error('Hãy kiểm tra kết quả thanh toán trước khi từ chối đề nghị.');
            }
            await tuChoiDeNghi(deNghi.id);
            await lamMoiDeNghi();
          }}
        >
          <p>Từ chối không phát sinh thanh toán. Người bán có thể gửi đề nghị cho ứng viên khác.</p>
        </BieuMauThaoTac>
      )}
    </section>
  );
}
