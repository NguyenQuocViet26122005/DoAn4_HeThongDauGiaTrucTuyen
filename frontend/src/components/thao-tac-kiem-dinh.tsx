import { useState } from 'react';
import { Alert, App, Button, Form, Input, InputNumber, Modal, Select } from 'antd';
import dayjs from 'dayjs';
import { xuLyHoSo, lamMoiDuyetVaKiemDinh } from '../services/kiem-dinh';
import { loiDeDoc } from '../services/api';
import type { BanGhi } from '../types/du-lieu';
import type { HoSoKiemDinh } from '../types/kiem-dinh';
import { mocThoiGian, nhan } from '../utils/dinh-dang';

const batBuoc = [
  {
    required: true,
    whitespace: true,
    message: 'Vui lòng nhập thông tin này',
  },
];
const tenThaoTac: Record<string, string> = {
  shipping: 'Khai báo gửi hàng',
  received: 'Ghi nhận tiếp nhận',
  start: 'Bắt đầu kiểm định',
  result: 'Ghi kết quả kiểm định',
  return: 'Ghi nhận trả người bán',
};

function TruongKiemDinh({ thaoTac, hoSo }: { thaoTac: string; hoSo: HoSoKiemDinh }) {
  if (thaoTac === 'shipping') {
    return (
      <>
        <Form.Item name="don_vi_van_chuyen" label="Đơn vị vận chuyển" rules={batBuoc}>
          <Input maxLength={100} />
        </Form.Item>
        <Form.Item name="ma_van_don" label="Mã vận đơn đến trung tâm" rules={batBuoc}>
          <Input maxLength={100} />
        </Form.Item>
      </>
    );
  }
  if (thaoTac === 'received') {
    return (
      <>
        <Form.Item name="tinh_trang_khi_nhan" label="Tình trạng khi nhận" rules={batBuoc}>
          <Input.TextArea rows={3} maxLength={5000} showCount />
        </Form.Item>
        <div className="luoi-truong-san-pham">
          <Form.Item name="serial_khi_nhan" label="Serial / mã nhận dạng">
            <Input maxLength={150} />
          </Form.Item>
          <Form.Item
            name="so_kien"
            label="Số kiện"
            initialValue={1}
            rules={[
              {
                required: true,
                type: 'number',
                min: 1,
                max: 1000,
                message: 'Số kiện từ 1 đến 1.000',
              },
            ]}
          >
            <InputNumber min={1} max={1000} precision={0} />
          </Form.Item>
        </div>
        <Form.Item name="ghi_chu" label="Ghi chú tiếp nhận">
          <Input.TextArea rows={2} maxLength={5000} />
        </Form.Item>
        <Alert
          type="info"
          title="Sau khi tiếp nhận, hãy đính kèm biên bản và ảnh trong phần Tệp hồ sơ."
        />
      </>
    );
  }
  if (thaoTac === 'result') {
    return (
      <>
        <Alert
          type="warning"
          showIcon
          title="Kết quả phải khớp báo cáo đã đính kèm"
          description="Ghi đạt sẽ chuyển hàng sang lưu giữ tại trung tâm. Sản phẩm vẫn cần Admin duyệt nội dung; thay kết quả có thể đưa sản phẩm về chờ duyệt."
        />
        <Form.Item name="ket_qua" label="Kết quả" rules={batBuoc}>
          <Select
            options={['DAT', 'KHONG_DAT', 'CAN_BO_SUNG'].map((value) => ({
              value,
              label: nhan(value),
            }))}
          />
        </Form.Item>
        <div className="luoi-truong-san-pham">
          <Form.Item name="ten_chuyen_gia" label="Tên chuyên gia" rules={batBuoc}>
            <Input maxLength={150} />
          </Form.Item>
          <Form.Item name="don_vi_kiem_dinh" label="Đơn vị kiểm định" rules={batBuoc}>
            <Input maxLength={200} />
          </Form.Item>
        </div>
        <Form.Item
          name="ngay_kiem_dinh"
          label="Ngày, giờ kiểm định"
          rules={batBuoc}
          extra="Chọn từ thời điểm tiếp nhận đến hiện tại."
        >
          <Input
            type="datetime-local"
            step={1}
            min={
              hoSo.ngay_nhan_trung_tam
                ? dayjs(mocThoiGian(hoSo.ngay_nhan_trung_tam)).format('YYYY-MM-DDTHH:mm:ss')
                : undefined
            }
          />
        </Form.Item>
        <Form.Item name="ma_chung_nhan" label="Mã chứng nhận (nếu có)">
          <Input maxLength={150} />
        </Form.Item>
        <Form.Item name="nhan_xet" label="Nhận xét của chuyên gia" rules={batBuoc}>
          <Input.TextArea rows={4} maxLength={10000} showCount />
        </Form.Item>
      </>
    );
  }

  return (
    <Form.Item name="ly_do" label="Lý do trả hàng" rules={batBuoc}>
      <Input.TextArea rows={4} maxLength={1000} showCount />
    </Form.Item>
  );
}

export default function ThaoTacKiemDinh({
  hoSo,
  quanTri,
  dangBan,
  datDangBan,
}: {
  hoSo: HoSoKiemDinh;
  quanTri: boolean;
  dangBan: boolean;
  datDangBan: (giaTri: boolean) => void;
}) {
  const { message, modal } = App.useApp();
  const [thaoTac, datThaoTac] = useState('');
  const [loi, datLoi] = useState('');
  const coBaoCao = hoSo.tep_dinh_kem.some((tep) => tep.loai_tep === 'BAO_CAO_KIEM_DINH');
  const cacThaoTac: string[] = [];

  if (quanTri) {
    if (['CHO_GUI_TRUNG_TAM', 'DANG_VAN_CHUYEN_DEN_TRUNG_TAM'].includes(hoSo.trang_thai)) {
      cacThaoTac.push('received');
    }
    if (['DA_NHAN_TAI_TRUNG_TAM', 'CAN_BO_SUNG'].includes(hoSo.trang_thai)) {
      cacThaoTac.push('start');
    }
    if (
      ['DANG_KIEM_DINH', 'CAN_BO_SUNG', 'DANG_LUU_GIU', 'KIEM_DINH_KHONG_DAT'].includes(
        hoSo.trang_thai,
      )
    ) {
      cacThaoTac.push('result');
    }
    if (['CAN_BO_SUNG', 'KIEM_DINH_KHONG_DAT'].includes(hoSo.trang_thai)) {
      cacThaoTac.push('return');
    }
  } else if (hoSo.trang_thai === 'CHO_GUI_TRUNG_TAM') {
    cacThaoTac.push('shipping');
  }

  async function luu(ten: string, duLieu: BanGhi = {}) {
    datDangBan(true);
    datLoi('');
    try {
      const noiDung =
        ten === 'result'
          ? {
              ...duLieu,
              ngay_kiem_dinh: dayjs(String(duLieu.ngay_kiem_dinh)).toISOString(),
            }
          : duLieu;

      await xuLyHoSo(hoSo.id, ten, noiDung);
      datThaoTac('');
      message.success('Đã cập nhật hồ sơ kiểm định');
      await lamMoiDuyetVaKiemDinh();
    } catch (loi) {
      datLoi(loiDeDoc(loi));
    } finally {
      datDangBan(false);
    }
  }

  return (
    <section className="tam-noi-dung">
      <h2>Bước xử lý tiếp theo</h2>
      {!hoSo.co_the_cap_nhat ? (
        <Alert
          type="info"
          showIcon
          title="Hồ sơ chỉ xem"
          description={hoSo.ly_do_khong_the_cap_nhat || 'Bạn không có quyền cập nhật hồ sơ này.'}
        />
      ) : (
        <>
          {loi && <Alert type="error" showIcon title={loi} />}
          <div className="cac-nut-kiem-dinh">
            {cacThaoTac.map((ten) => (
              <Button
                key={ten}
                type={ten === 'return' ? 'default' : 'primary'}
                danger={ten === 'return'}
                disabled={dangBan || (ten === 'result' && !coBaoCao)}
                onClick={() => {
                  datLoi('');
                  if (ten === 'start') {
                    modal.confirm({
                      title: 'Bắt đầu kiểm định?',
                      content: 'Xác nhận trung tâm đã tiếp nhận đúng sản phẩm.',
                      okText: 'Bắt đầu',
                      cancelText: 'Quay lại',
                      onOk: () => luu('start'),
                    });
                  } else {
                    datThaoTac(ten);
                  }
                }}
              >
                {tenThaoTac[ten]}
              </Button>
            ))}
          </div>
          {cacThaoTac.includes('result') && !coBaoCao && (
            <p className="chu-mo">Cần đính kèm báo cáo kiểm định trước khi ghi kết quả.</p>
          )}
          {!cacThaoTac.length && (
            <p className="chu-mo">Theo dõi cập nhật của trung tâm trong hồ sơ này.</p>
          )}
        </>
      )}
      <Modal
        open={Boolean(thaoTac)}
        title={tenThaoTac[thaoTac]}
        footer={null}
        width={640}
        destroyOnHidden
        closable={!dangBan}
        mask={{ closable: !dangBan }}
        onCancel={() => !dangBan && datThaoTac('')}
      >
        <Form
          key={thaoTac}
          layout="vertical"
          disabled={dangBan}
          onFinish={(duLieu) => luu(thaoTac, duLieu)}
          initialValues={
            thaoTac === 'result'
              ? {
                  ket_qua: ['DAT', 'KHONG_DAT', 'CAN_BO_SUNG'].includes(hoSo.ket_qua || '')
                    ? hoSo.ket_qua
                    : undefined,
                  ten_chuyen_gia: hoSo.ten_chuyen_gia || '',
                  don_vi_kiem_dinh: hoSo.don_vi_kiem_dinh || '',
                  ngay_kiem_dinh: dayjs().format('YYYY-MM-DDTHH:mm:ss'),
                  ma_chung_nhan: hoSo.ma_chung_nhan || '',
                  nhan_xet: hoSo.nhan_xet || '',
                }
              : undefined
          }
        >
          <TruongKiemDinh thaoTac={thaoTac} hoSo={hoSo} />
          {loi && <Alert type="error" showIcon title={loi} />}
          <Button
            className="nut-luu-kiem-dinh"
            type="primary"
            danger={thaoTac === 'return'}
            htmlType="submit"
            loading={dangBan}
            disabled={!hoSo.co_the_cap_nhat}
          >
            Xác nhận lưu hồ sơ
          </Button>
        </Form>
      </Modal>
    </section>
  );
}
