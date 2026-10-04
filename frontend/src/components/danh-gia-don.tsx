import { Form, Input, Rate } from 'antd';
import { Link } from 'react-router-dom';
import BieuMauThaoTac from './bieu-mau-thao-tac';
import { boNho, gui } from '../services/api';
import { lamMoiDon } from '../services/don-hang';
import { usePhienDangNhap } from '../store/phien-dang-nhap';
import type { DonHang } from '../types/don-hang';
import { ngayGio } from '../utils/dinh-dang';

export default function DanhGiaDon({ don }: { don: DonHang }) {
  const nguoiDung = usePhienDangNhap((s) => s.nguoiDung);
  const laNguoiMua = String(nguoiDung?.id) === String(don.nguoi_mua_id);
  const laNguoiBan = String(nguoiDung?.id) === String(don.nguoi_ban_id);

  if (!laNguoiMua && !laNguoiBan) {
    return null;
  }

  const doiTacId = laNguoiMua ? don.nguoi_ban_id : don.nguoi_mua_id;
  const daGui = don.danh_gia_cua_toi;

  return (
    <section className="tam-noi-dung">
      <h2>Đánh giá giao dịch</h2>
      <Link className="link-vang" to={`/nguoi-dung/${doiTacId}/danh-gia`}>
        Xem đánh giá về {laNguoiMua ? 'người bán' : 'người mua'}
      </Link>
      {daGui ? (
        <>
          <p>Bạn đã đánh giá ngày {ngayGio(daGui.ngay_tao)}.</p>
          <Rate disabled value={Number(daGui.so_sao)} />
          <p>{daGui.nhan_xet || 'Không có nhận xét.'}</p>
        </>
      ) : don.trang_thai === 'HOAN_THANH' ? (
        <>
          <p>Mỗi bên được đánh giá đối tác một lần sau khi hoàn tất đơn hàng.</p>
          <BieuMauThaoTac<{ so_sao: number; nhan_xet?: string }>
            ten="Viết đánh giá"
            khoa={nguoiDung?.trang_thai_tai_khoan !== 'HOAT_DONG'}
            xacNhan={(giaTri) => (
              <>
                <p>
                  Gửi đánh giá {giaTri.so_sao} sao cho đối tác của đơn {don.ma_don_hang}?
                </p>
                <p>{giaTri.nhan_xet || 'Không có nhận xét.'}</p>
              </>
            )}
            onGui={async (giaTri) => {
              await gui(`/orders/${don.id}/reviews`, giaTri);
              await Promise.all([
                lamMoiDon(don.id),
                boNho.invalidateQueries({ queryKey: [`/users/${doiTacId}/reviews`] }),
              ]);
            }}
          >
            <Form.Item
              name="so_sao"
              label="Mức độ hài lòng"
              rules={[
                { required: true, message: 'Hãy chọn số sao.' },
                {
                  type: 'number',
                  min: 1,
                  max: 5,
                  message: 'Chọn từ 1 đến 5 sao.',
                },
              ]}
            >
              <Rate />
            </Form.Item>
            <Form.Item name="nhan_xet" label="Nhận xét">
              <Input.TextArea maxLength={1000} showCount rows={4} />
            </Form.Item>
          </BieuMauThaoTac>
        </>
      ) : (
        <p>Bạn có thể đánh giá khi đơn hàng đã hoàn tất.</p>
      )}
    </section>
  );
}
