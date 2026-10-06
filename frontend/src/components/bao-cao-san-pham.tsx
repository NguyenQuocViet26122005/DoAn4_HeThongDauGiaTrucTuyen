import { App, Form, Input, Select } from 'antd';
import { Link } from 'react-router-dom';
import BieuMauThaoTac from './bieu-mau-thao-tac';
import { boNho, gui } from '../services/api';
import { usePhienDangNhap } from '../store/phien-dang-nhap';

const cacLyDo = [
  { value: 'HANG_GIA', label: 'Nghi hàng giả hoặc sai nguồn gốc' },
  { value: 'THONG_TIN_SAI', label: 'Thông tin sản phẩm không chính xác' },
  { value: 'HANG_CAM', label: 'Sản phẩm thuộc danh mục bị cấm' },
  { value: 'QUYEN_SO_HUU', label: 'Nghi vấn quyền sở hữu hoặc bản quyền' },
  { value: 'KHAC', label: 'Lý do khác' },
];

interface DuLieuBaoCao {
  ly_do: string;
  mo_ta: string;
}

export default function BaoCaoSanPham({
  phienId,
  nguoiBanId,
}: {
  phienId: string;
  nguoiBanId: string;
}) {
  const { message } = App.useApp();
  const nguoiDung = usePhienDangNhap((trangThai) => trangThai.nguoiDung);

  if (nguoiDung?.vai_tro === 'QUAN_TRI' || nguoiDung?.id === nguoiBanId) {
    return null;
  }

  if (!nguoiDung) {
    return (
      <p>
        <Link to={`/dang-nhap?tiep=${encodeURIComponent(`/phien/${phienId}`)}`}>
          Đăng nhập để báo cáo sản phẩm
        </Link>
      </p>
    );
  }

  return (
    <BieuMauThaoTac<DuLieuBaoCao>
      ten="Báo cáo sản phẩm"
      banDau={{ ly_do: 'THONG_TIN_SAI' }}
      xacNhan={(duLieu) => (
        <>
          <p>Bạn đang gửi báo cáo về sản phẩm trong phiên #{phienId}.</p>
          <p>{cacLyDo.find((muc) => muc.value === duLieu.ly_do)?.label}</p>
          <p>{duLieu.mo_ta}</p>
          <p>Quản trị viên sẽ xem xét. Báo cáo không tự kết luận sản phẩm vi phạm.</p>
        </>
      )}
      onGui={async (duLieu) => {
        await gui(`/auctions/${phienId}/reports`, duLieu);
        await boNho.invalidateQueries({ queryKey: ['/product-reports/me'] });
        message.success('Đã gửi báo cáo sản phẩm');
      }}
    >
      <p className="chu-mo">
        Mỗi tài khoản chỉ gửi một báo cáo cho cùng sản phẩm, kể cả khi sản phẩm được đăng lại.
      </p>
      <p className="chu-mo">Quản trị viên xem xét nội dung; báo cáo không tự kết luận vi phạm.</p>
      <Form.Item
        name="ly_do"
        label="Lý do báo cáo"
        rules={[{ required: true, message: 'Chọn lý do báo cáo.' }]}
      >
        <Select options={cacLyDo} />
      </Form.Item>
      <Form.Item
        name="mo_ta"
        label="Thông tin giúp quản trị viên xem xét"
        rules={[
          {
            required: true,
            whitespace: true,
            message: 'Mô tả nội dung cần xem xét.',
          },
          { max: 850, message: 'Tối đa 850 ký tự.' },
        ]}
      >
        <Input.TextArea rows={4} maxLength={850} showCount />
      </Form.Item>
    </BieuMauThaoTac>
  );
}
