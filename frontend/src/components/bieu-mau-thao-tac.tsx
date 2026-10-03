import { useRef, useState, type ReactNode } from 'react';
import { Alert, Button, Form, Modal } from 'antd';
import { loiDeDoc } from '../services/api';

export default function BieuMauThaoTac<T extends object>({
  ten,
  children,
  xacNhan,
  onGui,
  banDau,
  khoa = false,
}: {
  ten: string;
  children: ReactNode;
  xacNhan: (duLieu: T) => ReactNode;
  onGui: (duLieu: T) => Promise<void>;
  banDau?: Partial<T>;
  khoa?: boolean;
}) {
  const [bieuMau] = Form.useForm<T>();
  const [mo, datMo] = useState(false);
  const [duLieu, datDuLieu] = useState<T>();
  const [dangGui, datDangGui] = useState(false);
  const [loi, datLoi] = useState('');
  const dangXuLy = useRef(false);

  async function gui() {
    if (!duLieu || khoa || dangXuLy.current) {
      return;
    }

    dangXuLy.current = true;
    datDangGui(true);
    datLoi('');

    try {
      await onGui(duLieu);
      datMo(false);
      datDuLieu(undefined);
      bieuMau.resetFields();
    } catch (loiGui) {
      datLoi(loiDeDoc(loiGui));
    } finally {
      dangXuLy.current = false;
      datDangGui(false);
    }
  }

  return (
    <>
      <Button
        disabled={khoa}
        onClick={() => {
          datLoi('');
          datMo(true);
        }}
      >
        {ten}
      </Button>
      <Modal
        title={ten}
        open={mo}
        onCancel={() => !dangGui && datMo(false)}
        closable={!dangGui}
        mask={{ closable: !dangGui }}
        footer={
          <>
            <Button
              disabled={dangGui}
              onClick={() => (duLieu ? datDuLieu(undefined) : datMo(false))}
            >
              {duLieu ? 'Sửa thông tin' : 'Đóng'}
            </Button>
            <Button
              type="primary"
              disabled={khoa}
              loading={dangGui}
              onClick={() => (duLieu ? void gui() : bieuMau.submit())}
            >
              {duLieu ? 'Xác nhận' : 'Tiếp tục'}
            </Button>
          </>
        }
      >
        <div hidden={!!duLieu}>
          <Form
            form={bieuMau}
            layout="vertical"
            initialValues={banDau}
            disabled={dangGui || khoa}
            onFinish={datDuLieu}
          >
            {children}
          </Form>
        </div>
        {duLieu && <div className="noi-dung-xac-nhan">{xacNhan(duLieu)}</div>}
        {loi && <Alert type="error" title={loi} />}
      </Modal>
    </>
  );
}
