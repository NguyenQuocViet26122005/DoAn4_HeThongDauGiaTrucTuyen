import { useRef, useState } from 'react';
import { Alert, Button, Form, InputNumber, Modal } from 'antd';
import type { Phien } from '../types/du-lieu';
import { datGia, lamMoiThamGia } from '../services/tham-gia-phien';
import { loiDeDoc } from '../services/api';
import { tien } from '../utils/dinh-dang';
import { useDuLieu } from '../hooks/su-dung-du-lieu';

type BuocGia = { gia_tu: string; gia_den: string | null; muc_tang_gia: string };

// Mức thấp nhất để có lượt giá hợp lệ: khởi điểm khi chưa ai trả, sau đó giá hiện tại + bước giá.
function mucToiThieu(phien: Phien, cacBuoc: BuocGia[] = []) {
  const hienTai = Number(phien.gia_hien_tai);

  if (!Number(phien.tong_luot_tra_gia)) {
    return Math.max(Number(phien.gia_khoi_diem), 1);
  }

  const buoc = cacBuoc.find(
    (b) => hienTai >= Number(b.gia_tu) && (b.gia_den == null || hienTai <= Number(b.gia_den)),
  );

  return buoc ? hienTai + Number(buoc.muc_tang_gia) : undefined;
}

export default function DatGia({ phien, khoa }: { phien: Phien; khoa: boolean }) {
  const buocGia = useDuLieu<BuocGia[]>('/bid-increments');
  const toiThieu = mucToiThieu(phien, buocGia.data);
  const [bieuMau] = Form.useForm<{ muc_toi_da: number }>();
  const [mucXacNhan, datMucXacNhan] = useState<number>();
  const [dangGui, datDangGui] = useState(false);
  const [loi, datLoi] = useState('');
  const [daGhiNhan, datDaGhiNhan] = useState(false);
  const dangXuLy = useRef(false);

  async function guiGia() {
    if (mucXacNhan === undefined || khoa || dangXuLy.current) {
      return;
    }

    dangXuLy.current = true;
    datDangGui(true);
    datLoi('');
    datDaGhiNhan(false);

    try {
      await datGia(phien.id, mucXacNhan);

      bieuMau.resetFields();
      datDaGhiNhan(true);
    } catch (loiGui) {
      datLoi(loiDeDoc(loiGui));
    } finally {
      datMucXacNhan(undefined);
      datDangGui(false);
      dangXuLy.current = false;
      void lamMoiThamGia(phien.id);
    }
  }

  return (
    <section className="khoi-tham-gia">
      <h2>Đặt mức giá tối đa</h2>
      <p className="chu-mo">
        Hệ thống tự trả giá theo bước giá, trong phạm vi bạn cam kết. Hai mức tối đa bằng nhau:
        người đặt trước được ưu tiên. Bạn chỉ được nâng, không giảm hoặc rút mức đã đặt.
      </p>
      {daGhiNhan && (
        <Alert
          type="success"
          title="Đã ghi nhận mức tối đa bí mật"
          description="Ô nhập đã được xóa. Theo dõi giá công khai và người dẫn đầu bên trên; mức đã đặt không được đọc lại qua API."
        />
      )}
      {loi && (
        <Alert
          type="error"
          title={loi}
          description="Nếu mất kết nối, kiểm tra lại trạng thái phiên trước khi gửi tiếp. Hệ thống không tự gửi lại mức giá."
        />
      )}
      <Form
        form={bieuMau}
        layout="vertical"
        disabled={khoa || dangGui}
        onFinish={({ muc_toi_da }) => datMucXacNhan(muc_toi_da)}
      >
        <Form.Item
          name="muc_toi_da"
          label="Mức tối đa bí mật của bạn"
          extra={`${toiThieu ? `Mức tối thiểu hiện tại: ${tien(toiThieu)}. ` : ''}Chỉ nhập số tiền VND nguyên; không bao gồm phí vận chuyển.`}
          rules={[
            { required: true, message: 'Vui lòng nhập mức tối đa bạn chấp nhận' },
            {
              type: 'integer',
              min: 1,
              max: 9999999999999,
              message: 'Nhập số tiền nguyên dương trong giới hạn cho phép',
            },
          ]}
        >
          <InputNumber min={1} max={9999999999999} precision={0} suffix="₫" autoComplete="off" />
        </Form.Item>
        <Button type="primary" htmlType="submit" block loading={dangGui}>
          Xem lại mức đặt
        </Button>
      </Form>
      <Modal
        title="Xác nhận cam kết đấu giá"
        open={mucXacNhan !== undefined}
        onCancel={() => !dangGui && datMucXacNhan(undefined)}
        onOk={() => void guiGia()}
        okText="Xác nhận đặt giá"
        cancelText="Quay lại"
        confirmLoading={dangGui}
        okButtonProps={{ disabled: khoa }}
        cancelButtonProps={{ disabled: dangGui }}
        closable={!dangGui}
        mask={{ closable: !dangGui }}
        destroyOnHidden
      >
        <p>
          Mức tối đa bí mật: <strong>{tien(mucXacNhan)}</strong>
        </p>
        <p>Phí vận chuyển nếu thắng: {tien(phien.phi_van_chuyen)}.</p>
        <Alert
          type="warning"
          title="Cam kết này không thể giảm hoặc rút lại"
          description="Nếu thắng, bạn phải thanh toán đúng hạn. Giá phải trả được chốt từ giá công khai, có thể thấp hơn mức tối đa."
        />
      </Modal>
    </section>
  );
}
