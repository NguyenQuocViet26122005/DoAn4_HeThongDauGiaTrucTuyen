import { useState } from 'react';
import { Alert, Button, Form, Input, Switch } from 'antd';
import { boNho, loiDeDoc } from '../services/api';
import { luuDiaChi } from '../services/tham-gia-phien';
import type { BieuMauDiaChi, DiaChi } from '../types/tham-gia-phien';

const cacTruong = [
  ['ten_nguoi_nhan', 'Tên người nhận', 100],
  ['sdt_nguoi_nhan', 'Số điện thoại', 20],
  ['tinh_thanh', 'Tỉnh / thành phố', 100],
  ['quan_huyen', 'Quận / huyện hoặc khu vực', 100],
  ['phuong_xa', 'Phường / xã', 100],
  ['dia_chi_chi_tiet', 'Số nhà, đường và thông tin nhận hàng', 255],
] as const;

export default function BieuMauDiaChi({
  diaChi,
  daLuu,
  dangXuLy,
}: {
  diaChi?: DiaChi;
  daLuu: () => void;
  dangXuLy: (giaTri: boolean) => void;
}) {
  const [dangLuu, datDangLuu] = useState(false);
  const [loi, datLoi] = useState('');

  async function luu(duLieu: BieuMauDiaChi) {
    datDangLuu(true);
    dangXuLy(true);
    datLoi('');

    try {
      const daChuanHoa = { ...duLieu };

      for (const [khoa] of cacTruong) {
        daChuanHoa[khoa] = duLieu[khoa].trim();
      }

      await luuDiaChi(daChuanHoa, diaChi?.id);
      await boNho.invalidateQueries({ queryKey: ['/users/me/addresses'] });
      daLuu();
    } catch (loiLuu) {
      datLoi(loiDeDoc(loiLuu));
    } finally {
      datDangLuu(false);
      dangXuLy(false);
    }
  }

  return (
    <Form<BieuMauDiaChi>
      layout="vertical"
      initialValues={{ ...diaChi, la_mac_dinh: !!diaChi?.la_mac_dinh }}
      onFinish={luu}
      disabled={dangLuu}
    >
      <div className="luoi-truong-san-pham">
        {cacTruong.map(([ten, nhan, doDai]) => (
          <Form.Item
            key={ten}
            name={ten}
            label={nhan}
            rules={[
              {
                required: true,
                whitespace: true,
                max: doDai,
                message: `Vui lòng nhập ${nhan.toLowerCase()}, tối đa ${doDai} ký tự`,
              },
              ...(ten === 'sdt_nguoi_nhan'
                ? [
                    {
                      pattern: /^\+?[0-9 ()-]{8,20}$/,
                      message: 'Nhập số điện thoại hợp lệ, tối đa 20 ký tự',
                    },
                  ]
                : []),
            ]}
          >
            <Input maxLength={doDai} type={ten === 'sdt_nguoi_nhan' ? 'tel' : 'text'} />
          </Form.Item>
        ))}
      </div>
      <Form.Item name="la_mac_dinh" label="Dùng làm địa chỉ mặc định" valuePropName="checked">
        <Switch />
      </Form.Item>
      {loi && <Alert className="loi-bieu-mau" type="error" title={loi} />}
      <Button type="primary" htmlType="submit" loading={dangLuu}>
        Lưu địa chỉ
      </Button>
    </Form>
  );
}
