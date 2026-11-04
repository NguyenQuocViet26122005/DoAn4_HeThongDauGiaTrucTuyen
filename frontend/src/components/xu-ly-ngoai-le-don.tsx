import { Alert, App, Form, Input, Select } from 'antd';
import BieuMauThaoTac from './bieu-mau-thao-tac';
import { gui } from '../services/api';
import { lamMoiDon } from '../services/don-hang';
import { usePhienDangNhap } from '../store/phien-dang-nhap';
import type { DonHang } from '../types/don-hang';
import { ngayGio, tien } from '../utils/dinh-dang';

const ketQuaCoc = {
  BOI_HOAN_NGUOI_BAN: 'Bồi hoàn toàn bộ cọc cho người bán',
  HOAN_NGUOI_MUA: 'Hoàn toàn bộ cọc cho người mua theo ngoại lệ',
};
const loaiNgoaiLe: Record<string, string> = {
  LOI_HE_THONG: 'Lỗi hệ thống đã được xác minh',
  LOI_BEN_BAN: 'Lỗi bên bán làm giao dịch không thể thực hiện',
  SAI_THONG_TIN_PHIEN: 'Thông tin phiên sai đã được đối chiếu',
};
const quyTacLyDo = [
  {
    required: true,
    whitespace: true,
    message: 'Nhập căn cứ xử lý',
  },
  { min: 20, message: 'Căn cứ cần ít nhất 20 ký tự' },
];

export default function XuLyNgoaiLeDon({ don }: { don: DonHang }) {
  const quanTri = usePhienDangNhap((s) => s.nguoiDung?.vai_tro === 'QUAN_TRI');
  const { message } = App.useApp();
  const coCanhBao = !!Number(don.can_admin_xu_ly);
  const quyetToan = don.quyet_toan_coc;
  const giaiToa = don.giai_toa_canh_bao;

  async function xuLy(duongDan: string, duLieu: object) {
    await gui(`/admin/orders/${don.id}/${duongDan}`, duLieu);
    await lamMoiDon(don.id);
    message.success('Đã lưu quyết định xử lý đơn');
  }

  if (!quyetToan && !giaiToa && !(quanTri && coCanhBao)) {
    return null;
  }

  return (
    <section className="tam-noi-dung thao-tac-don">
      <h2>Đối soát và xử lý ngoại lệ</h2>
      {quyetToan && (
        <Alert
          type="success"
          showIcon
          title={ketQuaCoc[quyetToan.ket_qua]}
          description={
            <>
              <p>
                Số tiền: <strong>{tien(quyetToan.so_tien)}</strong>
              </p>
              <p className="van-ban-dai">{quyetToan.ly_do}</p>
              {quyetToan.loai_ngoai_le && (
                <p>
                  {loaiNgoaiLe[quyetToan.loai_ngoai_le]} · Chứng cứ:{' '}
                  {quyetToan.tham_chieu_bang_chung}
                </p>
              )}
              <p>
                Admin #{quyetToan.nguoi_xu_ly_id} · {ngayGio(quyetToan.ngay_xu_ly)}
              </p>
              <p>Đơn vẫn bị hủy; quyết định này chỉ xử lý khoản cọc đã thu.</p>
            </>
          }
        />
      )}
      {giaiToa && (
        <Alert
          type="info"
          title="Biên bản kiểm tra cảnh báo đơn"
          description={
            <>
              <p className="van-ban-dai">{giaiToa.ly_do}</p>
              <p>
                Admin #{giaiToa.nguoi_xu_ly_id} · {ngayGio(giaiToa.ngay_xu_ly)}
              </p>
            </>
          }
        />
      )}
      {quanTri && don.co_the_quyet_toan_coc && (
        <BieuMauThaoTac<{
          ket_qua: keyof typeof ketQuaCoc;
          ly_do: string;
          loai_ngoai_le?: string;
          tham_chieu_bang_chung?: string;
        }>
          ten="Quyết toán cọc của người thắng không thanh toán"
          xacNhan={(duLieu) => (
            <>
              <p>
                <strong>{ketQuaCoc[duLieu.ket_qua]}</strong>: {tien(don.so_tien_dang_giu)}
              </p>
              <p className="van-ban-dai">{duLieu.ly_do}</p>
              {duLieu.ket_qua === 'HOAN_NGUOI_MUA' && (
                <p>
                  {loaiNgoaiLe[duLieu.loai_ngoai_le || '']} · Chứng cứ:{' '}
                  {duLieu.tham_chieu_bang_chung}
                </p>
              )}
              <p>
                Chỉ quyết toán một lần. Không thay đổi kết quả hủy đơn hoặc tạo giao dịch bán mới.
              </p>
            </>
          )}
          onGui={(duLieu) => xuLy('deposit-settlement', duLieu)}
        >
          <Alert
            type="warning"
            title={`Cọc đang giữ: ${tien(don.so_tien_dang_giu)}`}
            description="Xem xét vi phạm và chứng cứ trước khi chọn. Hủy vi phạm không tự hoàn cọc; quyết toán cọc cũng không tự thay quyết định vi phạm."
          />
          <Form.Item
            name="ket_qua"
            label="Quyết định"
            rules={[{ required: true, message: 'Chọn quyết định' }]}
          >
            <Select
              options={Object.entries(ketQuaCoc).map(([value, label]) => ({ value, label }))}
            />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(truoc, sau) => truoc.ket_qua !== sau.ket_qua}>
            {({ getFieldValue }) =>
              getFieldValue('ket_qua') === 'HOAN_NGUOI_MUA' ? (
                <>
                  <Alert
                    type="warning"
                    title="Không hoàn cọc chỉ vì đổi ý, thiếu tiền hoặc quên thanh toán"
                    description="Chỉ chọn ngoại lệ khi có bằng chứng đã xác minh, không do người mua tự ý bỏ nghĩa vụ. Mã hồ sơ được lưu để đối chiếu quyết định Admin."
                  />
                  <Form.Item
                    name="loai_ngoai_le"
                    label="Loại ngoại lệ đã xác minh"
                    preserve={false}
                    rules={[{ required: true, message: 'Chọn loại ngoại lệ' }]}
                  >
                    <Select
                      options={Object.entries(loaiNgoaiLe).map(([value, label]) => ({
                        value,
                        label,
                      }))}
                    />
                  </Form.Item>
                  <Form.Item
                    name="tham_chieu_bang_chung"
                    label="Mã hồ sơ / tham chiếu chứng cứ đã kiểm tra"
                    preserve={false}
                    rules={[
                      {
                        required: true,
                        whitespace: true,
                        message: 'Nhập tham chiếu chứng cứ',
                      },
                      { min: 6, message: 'Tham chiếu cần ít nhất 6 ký tự' },
                    ]}
                  >
                    <Input maxLength={200} />
                  </Form.Item>
                </>
              ) : null
            }
          </Form.Item>
          <Form.Item name="ly_do" label="Căn cứ quyết toán hoặc ngoại lệ" rules={quyTacLyDo}>
            <Input.TextArea rows={4} maxLength={1000} showCount />
          </Form.Item>
        </BieuMauThaoTac>
      )}
      {quanTri && coCanhBao && don.trang_thai !== 'DA_HUY' && (
        <>
          {don.ly_do_chua_giai_toa && (
            <Alert
              type="warning"
              title="Chưa thể giải tỏa cảnh báo"
              description={don.ly_do_chua_giai_toa}
            />
          )}
          <BieuMauThaoTac<{ ly_do: string }>
            ten="Xác nhận đã kiểm tra và giải tỏa cảnh báo"
            khoa={!!don.ly_do_chua_giai_toa}
            xacNhan={(duLieu) => (
              <>
                <p className="van-ban-dai">{duLieu.ly_do}</p>
                <p>
                  Tiền vẫn được giữ. Giữ nguyên thời hạn kiểm tra; người mua xác nhận hàng phù hợp
                  hoặc hệ thống hoàn tất khi hết hạn và đủ điều kiện.
                </p>
              </>
            )}
            onGui={(duLieu) => xuLy('clear-hold', duLieu)}
          >
            <p className="van-ban-dai">Cảnh báo hiện tại: {don.ly_do_can_xu_ly}</p>
            <Form.Item name="ly_do" label="Kết quả xác minh và căn cứ giải tỏa" rules={quyTacLyDo}>
              <Input.TextArea rows={4} maxLength={1000} showCount />
            </Form.Item>
          </BieuMauThaoTac>
        </>
      )}
    </section>
  );
}
