import { useState } from 'react';
import { Alert, App, Button, Form, Input } from 'antd';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { BieuTuong } from '../components/bieu-tuong';
import { boNho, gui, loiDeDoc } from '../services/api';
import { usePhienDangNhap } from '../store/phien-dang-nhap';
import type { NguoiDung } from '../types/du-lieu';

interface ThongTinDangNhap {
  email: string;
  mat_khau: string;
  ho_ten?: string;
  so_dien_thoai?: string;
}

export default function DangNhapDangKy({ dangKy = false }: { dangKy?: boolean }) {
  const [dangGui, datDangGui] = useState(false);
  const [loi, datLoi] = useState('');
  const { message } = App.useApp();
  const diDen = useNavigate();
  const [thamSo] = useSearchParams();
  const { nguoiDung, dangNhap } = usePhienDangNhap();
  const dich = thamSo.get('tiep') || '/tai-khoan';
  const dichAnToan =
    /^\/(?!\/|dang-nhap|dang-ky)/.test(dich) && !dich.includes('\\') ? dich : '/tai-khoan';
  const duoi = `?tiep=${encodeURIComponent(dichAnToan)}`;

  if (nguoiDung) {
    return <Navigate replace to={dichAnToan} />;
  }

  async function guiBieuMau(duLieu: ThongTinDangNhap) {
    datDangGui(true);
    datLoi('');

    try {
      const thongTin = { email: duLieu.email.trim(), mat_khau: duLieu.mat_khau };

      if (dangKy) {
        await gui('/auth/register', {
          ...thongTin,
          ho_ten: duLieu.ho_ten?.trim(),
          ...(duLieu.so_dien_thoai ? { so_dien_thoai: duLieu.so_dien_thoai.trim() } : {}),
        });
        message.success('Đã tạo tài khoản. Bạn có thể đăng nhập ngay.');
        diDen(`/dang-nhap${duoi}`, { replace: true });
      } else {
        const ketQua = await gui<{ token: string; user: NguoiDung }>('/auth/login', thongTin);

        boNho.clear();
        dangNhap(ketQua.token, ketQua.user);
        message.success('Đăng nhập thành công');
        diDen(dichAnToan, { replace: true });
      }
    } catch (loiGui) {
      datLoi(loiDeDoc(loiGui));
    } finally {
      datDangGui(false);
    }
  }

  return (
    <div className="khung trang-xac-thuc">
      <section className="cau-chuyen-xac-thuc">
        <span className="nhan-nho">VietBid · KHÔNG GIAN SƯU TẦM</span>
        <h1>
          Mỗi lựa chọn,
          <br />
          <em>một dấu ấn riêng.</em>
        </h1>
        <p>
          Khám phá những giá trị vượt thời gian. Bắt đầu hành trình sưu tầm của bạn cùng VietBid.
        </p>
        <div className="cam-ket-xac-thuc">
          <BieuTuong ten="khien" size={28} />
          <span>
            Giá tối đa được giữ kín.
            <br />
            Giao dịch được bảo vệ qua tiền giữ trung gian.
          </span>
        </div>
      </section>
      <section className="the-xac-thuc">
        <span className="nhan-nho">{dangKy ? 'BẮT ĐẦU HÀNH TRÌNH' : 'CHÀO MỪNG TRỞ LẠI'}</span>
        <h2>{dangKy ? 'Tạo tài khoản' : 'Đăng nhập'}</h2>
        <p>
          {dangKy
            ? 'Một tài khoản để khám phá, theo dõi và tham gia đấu giá.'
            : 'Tiếp tục khám phá những món đồ bạn yêu thích.'}
        </p>
        <Form
          layout="vertical"
          requiredMark="optional"
          onFinish={guiBieuMau}
          className="bieu-mau"
          disabled={dangGui}
          scrollToFirstError
        >
          {dangKy && (
            <Form.Item
              name="ho_ten"
              label="Họ và tên"
              rules={[
                {
                  required: true,
                  whitespace: true,
                  message: 'Vui lòng nhập họ và tên',
                },
              ]}
            >
              <Input autoComplete="name" maxLength={100} placeholder="Nguyễn Văn An" />
            </Form.Item>
          )}
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Địa chỉ email chưa hợp lệ' },
            ]}
          >
            <Input autoComplete="email" maxLength={150} placeholder="ban@example.com" />
          </Form.Item>
          {dangKy && (
            <Form.Item
              name="so_dien_thoai"
              label="Số điện thoại"
              rules={[{ pattern: /^\+?[0-9]{9,15}$/, message: 'Số điện thoại cần 9–15 chữ số' }]}
            >
              <Input
                autoComplete="tel"
                type="tel"
                maxLength={16}
                placeholder="Số điện thoại liên hệ"
              />
            </Form.Item>
          )}
          <Form.Item
            name="mat_khau"
            label="Mật khẩu"
            extra={dangKy ? 'Ít nhất 8 ký tự, tối đa 72 byte.' : undefined}
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu' },
              { min: dangKy ? 8 : 1, message: 'Mật khẩu cần ít nhất 8 ký tự' },
              {
                validator: (_, giaTri: string) =>
                  !giaTri || new TextEncoder().encode(giaTri).length <= 72
                    ? Promise.resolve()
                    : Promise.reject(new Error('Mật khẩu quá dài')),
              },
            ]}
          >
            <Input.Password
              autoComplete={dangKy ? 'new-password' : 'current-password'}
              placeholder="Nhập mật khẩu của bạn"
            />
          </Form.Item>
          {dangKy && (
            <Form.Item
              name="xac_nhan"
              label="Nhập lại mật khẩu"
              dependencies={['mat_khau']}
              rules={[
                { required: true, message: 'Vui lòng nhập lại mật khẩu' },
                ({ getFieldValue }) => ({
                  validator: (_, giaTri) =>
                    !giaTri || getFieldValue('mat_khau') === giaTri
                      ? Promise.resolve()
                      : Promise.reject(new Error('Mật khẩu chưa trùng khớp')),
                }),
              ]}
            >
              <Input.Password autoComplete="new-password" placeholder="Nhập lại mật khẩu" />
            </Form.Item>
          )}
          {loi && (
            <Alert
              role="alert"
              className="loi-bieu-mau"
              showIcon
              type="error"
              title="Chưa thể hoàn tất"
              description={loi}
            />
          )}
          <Button type="primary" htmlType="submit" block size="large" loading={dangGui}>
            {dangKy ? 'Tạo tài khoản' : 'Đăng nhập'} <BieuTuong ten="muiTen" size={18} />
          </Button>
        </Form>
        <p className="doi-xac-thuc">
          {dangKy ? 'Đã có tài khoản?' : 'Bạn chưa có tài khoản?'}{' '}
          <Link to={`${dangKy ? '/dang-nhap' : '/dang-ky'}${duoi}`}>
            {dangKy ? 'Đăng nhập' : 'Đăng ký ngay'}
          </Link>
        </p>
        {dangKy && (
          <small className="chu-mo">
            Để bán sản phẩm, bạn cần hoàn tất xác minh người bán sau khi đăng ký.
          </small>
        )}
      </section>
    </div>
  );
}
