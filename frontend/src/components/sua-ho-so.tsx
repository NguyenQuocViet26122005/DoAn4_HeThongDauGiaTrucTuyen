import { App, Form, Input } from 'antd';
import BieuMauThaoTac from './bieu-mau-thao-tac';
import { gui } from '../services/api';
import { usePhienDangNhap } from '../store/phien-dang-nhap';
import type { NguoiDung } from '../types/du-lieu';

export default function SuaHoSo({ nguoiDung }: { nguoiDung: NguoiDung }) {
  const { message } = App.useApp();
  const capNhat = usePhienDangNhap((s) => s.capNhat);

  return (
    <BieuMauThaoTac<{ ho_ten: string; so_dien_thoai?: string }>
      ten="Chỉnh sửa hồ sơ"
      banDau={{ ho_ten: nguoiDung.ho_ten, so_dien_thoai: nguoiDung.so_dien_thoai || '' }}
      xacNhan={(duLieu) => (
        <>
          <p>Họ tên: {duLieu.ho_ten}</p>
          <p>Điện thoại: {duLieu.so_dien_thoai || 'Giữ nguyên'}</p>
        </>
      )}
      onGui={async (duLieu) => {
        const daLuu = await gui<NguoiDung>(
          '/users/me',
          {
            ho_ten: duLieu.ho_ten,
            ...(duLieu.so_dien_thoai ? { so_dien_thoai: duLieu.so_dien_thoai } : {}),
          },
          'patch',
        );

        capNhat(daLuu);
        message.success('Đã cập nhật hồ sơ');
      }}
    >
      <Form.Item
        name="ho_ten"
        label="Họ và tên"
        rules={[
          {
            required: true,
            whitespace: true,
            message: 'Nhập họ và tên',
          },
        ]}
      >
        <Input maxLength={100} autoComplete="name" />
      </Form.Item>
      <Form.Item
        name="so_dien_thoai"
        label="Số điện thoại"
        rules={[{ pattern: /^\+?[0-9\s.-]{8,20}$/, message: 'Số điện thoại không hợp lệ' }]}
      >
        <Input maxLength={20} autoComplete="tel" />
      </Form.Item>
    </BieuMauThaoTac>
  );
}
