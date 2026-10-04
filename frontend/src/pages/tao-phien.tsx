import { useState } from 'react';
import { Alert, App, Button, Descriptions, Form, Input, InputNumber, Modal } from 'antd';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import ChonSanPhamPhien from '../components/chon-san-pham-phien';
import QuyenNguoiBan from '../components/quyen-nguoi-ban';
import { TieuDe } from '../components/dung-chung';
import { loiDeDoc } from '../services/api';
import { lamMoiPhienNguoiBan, taoPhien } from '../services/phien-nguoi-ban';
import type { BieuMauTaoPhien } from '../types/phien-nguoi-ban';
import type { SanPhamTrongDanhSach } from '../types/san-pham';
import { mocThoiGian, ngayGio, tien } from '../utils/dinh-dang';

const giaToiDa = 9999999999999;
const batBuoc = [{ required: true, message: 'Vui lòng nhập thông tin này' }];

function ngayNhapVietNam(moc: number) {
  return new Date(moc + 7 * 3600000).toISOString().slice(0, 16);
}

function TruongGiaVaThoiGian() {
  return (
    <>
      <section className="tam-noi-dung">
        <h2>2. Giá và vận chuyển</h2>
        <p className="chu-mo">Nhập số tiền VND nguyên. Bước giá do hệ thống cấu hình.</p>
        <div className="luoi-truong-san-pham">
          <Form.Item
            name="gia_khoi_diem"
            label="Giá khởi điểm"
            rules={[
              ...batBuoc,
              {
                type: 'number',
                min: 1,
                max: giaToiDa,
                message: 'Giá khởi điểm phải lớn hơn 0 và trong giới hạn cho phép',
              },
            ]}
          >
            <InputNumber min={1} max={giaToiDa} precision={0} suffix="₫" />
          </Form.Item>
          <Form.Item
            name="gia_san"
            label="Giá sàn (không bắt buộc)"
            dependencies={['gia_khoi_diem']}
            extra="Mức thấp nhất bạn chấp nhận bán; không công khai số tiền này."
            rules={[
              ({ getFieldValue }) => ({
                validator(_, giaTri) {
                  if (
                    giaTri != null &&
                    (giaTri <= 0 || giaTri < Number(getFieldValue('gia_khoi_diem')))
                  ) {
                    return Promise.reject(
                      new Error('Giá sàn phải dương và không thấp hơn giá khởi điểm'),
                    );
                  }

                  return Promise.resolve();
                },
              }),
            ]}
          >
            <InputNumber min={1} max={giaToiDa} precision={0} suffix="₫" />
          </Form.Item>
          <Form.Item
            name="gia_mua_ngay"
            label="Giá Mua ngay (không bắt buộc)"
            dependencies={['gia_khoi_diem', 'gia_san']}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, giaTri) {
                  const moc = getFieldValue('gia_san') ?? getFieldValue('gia_khoi_diem');

                  if (giaTri != null && (giaTri <= 0 || giaTri < Number(moc))) {
                    return Promise.reject(
                      new Error('Giá Mua ngay không thấp hơn giá sàn hoặc giá khởi điểm'),
                    );
                  }

                  return Promise.resolve();
                },
              }),
            ]}
          >
            <InputNumber min={1} max={giaToiDa} precision={0} suffix="₫" />
          </Form.Item>
          <Form.Item
            name="phi_van_chuyen"
            label="Phí vận chuyển cố định"
            extra="Nhập 0 nếu miễn phí vận chuyển."
            rules={[
              ...batBuoc,
              {
                type: 'number',
                min: 0,
                max: giaToiDa,
                message: 'Phí vận chuyển không được âm',
              },
            ]}
          >
            <InputNumber min={0} max={giaToiDa} precision={0} suffix="₫" />
          </Form.Item>
        </div>
      </section>
      <section className="tam-noi-dung">
        <h2>3. Lịch đấu giá</h2>
        <p className="chu-mo">Tất cả thời gian nhập theo giờ Việt Nam (UTC+7).</p>
        <div className="luoi-truong-san-pham">
          <Form.Item
            name="thoi_gian_bat_dau"
            label="Thời gian bắt đầu"
            rules={[
              ...batBuoc,
              {
                validator(_, giaTri: string) {
                  if (
                    giaTri &&
                    (!Number.isFinite(mocThoiGian(giaTri)) ||
                      mocThoiGian(giaTri) < Date.now() - 60000)
                  ) {
                    return Promise.reject(new Error('Chọn thời gian bắt đầu từ hiện tại trở đi'));
                  }

                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input type="datetime-local" step={60} />
          </Form.Item>
          <Form.Item
            name="thoi_gian_ket_thuc"
            label="Thời gian kết thúc"
            dependencies={['thoi_gian_bat_dau']}
            rules={[
              ...batBuoc,
              ({ getFieldValue }) => ({
                validator(_, giaTri: string) {
                  if (
                    giaTri &&
                    (!Number.isFinite(mocThoiGian(giaTri)) ||
                      mocThoiGian(giaTri) <= Date.now() ||
                      mocThoiGian(giaTri) <= mocThoiGian(getFieldValue('thoi_gian_bat_dau')))
                  ) {
                    return Promise.reject(
                      new Error('Kết thúc phải sau bắt đầu và chưa qua thời điểm hiện tại'),
                    );
                  }

                  return Promise.resolve();
                },
              }),
            ]}
          >
            <Input type="datetime-local" step={60} />
          </Form.Item>
        </div>
        <Alert
          type="info"
          showIcon
          title="Thời gian có thể được gia hạn"
          description="Lượt trả giá công khai hợp lệ trong khoảng cuối phiên sẽ kích hoạt gia hạn theo cấu hình được lưu lúc tạo phiên."
        />
      </section>
    </>
  );
}

function BieuMauPhien() {
  const dieuHuong = useNavigate();
  const [thamSo] = useSearchParams();
  const sanPhamIdUuTien = thamSo.get('san_pham_id') || undefined;
  const { message } = App.useApp();
  const [bieuMau] = Form.useForm<BieuMauTaoPhien>();
  const [sanPham, datSanPham] = useState<SanPhamTrongDanhSach>();
  const [xacNhan, datXacNhan] = useState<BieuMauTaoPhien>();
  const [dangTao, datDangTao] = useState(false);
  const [loi, datLoi] = useState('');
  const [banDau] = useState(() => ({
    san_pham_id: sanPhamIdUuTien,
    phi_van_chuyen: 0,
    thoi_gian_bat_dau: ngayNhapVietNam(Date.now() + 15 * 60000),
    thoi_gian_ket_thuc: ngayNhapVietNam(Date.now() + 24 * 3600000),
  }));

  async function luu() {
    if (!xacNhan || dangTao) {
      return;
    }
    datDangTao(true);
    datLoi('');

    try {
      const phien = await taoPhien(xacNhan);

      void lamMoiPhienNguoiBan();
      message.success('Đã tạo phiên đấu giá');
      dieuHuong(`/nguoi-ban/phien/${phien.id}`, { replace: true });
    } catch (loi) {
      datLoi(loiDeDoc(loi));
      datXacNhan(undefined);
    } finally {
      datDangTao(false);
    }
  }

  return (
    <>
      <Link className="link-vang quay-lai-kiem-dinh" to="/nguoi-ban/phien">
        ← Phiên đấu giá của tôi
      </Link>
      <TieuDe
        nhanNho="ĐƯA GIÁ TRỊ LÊN SÀN"
        ten="Tạo phiên đấu giá"
        moTa="Chọn sản phẩm, thiết lập mức giá và thời gian trước khi công bố phiên."
      />
      <Form<BieuMauTaoPhien>
        form={bieuMau}
        layout="vertical"
        initialValues={banDau}
        disabled={dangTao}
        className="tao-phien-ban"
        onFinish={(duLieu) => {
          datLoi('');
          datXacNhan(duLieu);
        }}
      >
        <div className="cot-tao-phien">
          <div className="cac-buoc-san-pham">
            <section className="tam-noi-dung">
              <h2>1. Chọn sản phẩm</h2>
              <Form.Item
                name="san_pham_id"
                rules={[{ required: true, message: 'Chọn một sản phẩm để tạo phiên' }]}
              >
                <ChonSanPhamPhien
                  onChon={datSanPham}
                  disabled={dangTao}
                  sanPhamIdUuTien={sanPhamIdUuTien}
                />
              </Form.Item>
            </section>
            <TruongGiaVaThoiGian />
          </div>
          <aside className="tam-noi-dung kiem-tra-gui-duyet">
            <span className="nhan-nho">TRƯỚC KHI CÔNG BỐ</span>
            <h2>{sanPham ? sanPham.tieu_de : 'Phiên mới của bạn'}</h2>
            {sanPham && (
              <Link to={`/nguoi-ban/san-pham/${sanPham.id}`}>Xem sản phẩm #{sanPham.id} ↗</Link>
            )}
            <ul>
              <li>
                Cọc tham gia theo chính sách Admin tại thời điểm tạo. Số tiền áp dụng được hiển thị
                sau khi lưu.
              </li>
              <li>Mức tối đa của người mua luôn bí mật. Bạn chỉ xem giá công khai.</li>
              <li>
                Phiên đã tạo không có thao tác sửa giá hoặc lịch. Nếu cần hủy, gửi yêu cầu để Admin
                xét duyệt.
              </li>
            </ul>
            <Button type="primary" htmlType="submit" block size="large" loading={dangTao}>
              Kiểm tra & tạo phiên
            </Button>
            {loi && (
              <Alert
                className="loi-bieu-mau"
                type="error"
                showIcon
                title={loi}
                description={
                  <span>
                    Thông tin đã nhập được giữ lại. Nếu mất kết nối khi tạo, hãy{' '}
                    <Link to="/nguoi-ban/phien">kiểm tra danh sách phiên</Link> trước khi gửi lại.
                  </span>
                }
              />
            )}
          </aside>
        </div>
      </Form>
      <Modal
        title="Xác nhận tạo phiên đấu giá"
        open={!!xacNhan}
        onCancel={() => !dangTao && datXacNhan(undefined)}
        onOk={luu}
        okText="Tạo phiên"
        cancelText="Kiểm tra lại"
        confirmLoading={dangTao}
        closable={!dangTao}
        mask={{ closable: !dangTao }}
        cancelButtonProps={{ disabled: dangTao }}
      >
        <p>{sanPham?.tieu_de}</p>
        <Descriptions
          column={1}
          items={
            xacNhan
              ? [
                  {
                    key: 'gia',
                    label: 'Khởi điểm',
                    children: tien(xacNhan.gia_khoi_diem),
                  },
                  {
                    key: 'san',
                    label: 'Giá sàn',
                    children: xacNhan.gia_san == null ? 'Không đặt' : tien(xacNhan.gia_san),
                  },
                  {
                    key: 'mua',
                    label: 'Mua ngay',
                    children:
                      xacNhan.gia_mua_ngay == null ? 'Không dùng' : tien(xacNhan.gia_mua_ngay),
                  },
                  {
                    key: 'phi',
                    label: 'Vận chuyển',
                    children: tien(xacNhan.phi_van_chuyen),
                  },
                  {
                    key: 'batDau',
                    label: 'Bắt đầu',
                    children: ngayGio(xacNhan.thoi_gian_bat_dau),
                  },
                  {
                    key: 'ketThuc',
                    label: 'Kết thúc',
                    children: ngayGio(xacNhan.thoi_gian_ket_thuc),
                  },
                ]
              : []
          }
        />
        <p className="chu-mo">Hệ thống kiểm tra lại điều kiện sản phẩm trước khi lưu phiên.</p>
      </Modal>
    </>
  );
}

export default function TaoPhien() {
  return (
    <QuyenNguoiBan>
      <BieuMauPhien />
    </QuyenNguoiBan>
  );
}
