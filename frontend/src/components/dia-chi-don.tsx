import { useState } from 'react';
import { Alert, Button, Modal, Radio } from 'antd';
import { Link } from 'react-router-dom';
import { ChoDuLieu } from './dung-chung';
import { useDuLieu } from '../hooks/su-dung-du-lieu';
import { doiDiaChiDon, lamMoiDon } from '../services/don-hang';
import { loiDeDoc } from '../services/api';
import type { DiaChi } from '../types/tham-gia-phien';
import { noiDungDiaChi } from '../utils/dia-chi';

export default function DiaChiDon({ id, khoa }: { id: string; khoa: boolean }) {
  const [mo, datMo] = useState(false);
  const [chon, datChon] = useState<string>();
  const [dangGui, datDangGui] = useState(false);
  const [loi, datLoi] = useState('');
  const diaChi = useDuLieu<DiaChi[]>('/users/me/addresses', undefined, mo);

  async function luu() {
    if (!chon || khoa || dangGui) {
      return;
    }

    datDangGui(true);
    datLoi('');

    try {
      await doiDiaChiDon(id, chon);
      datMo(false);
    } catch (loiGui) {
      datLoi(loiDeDoc(loiGui));
    } finally {
      await lamMoiDon(id);
      datDangGui(false);
    }
  }

  return (
    <>
      <Button disabled={khoa} onClick={() => datMo(true)}>
        Đổi địa chỉ của đơn
      </Button>
      <Modal
        title="Chọn địa chỉ cho đơn hàng"
        open={mo}
        onCancel={() => !dangGui && datMo(false)}
        onOk={() => void luu()}
        okText="Lưu địa chỉ vào đơn"
        cancelText="Đóng"
        confirmLoading={dangGui}
        okButtonProps={{ disabled: !chon || khoa }}
        cancelButtonProps={{ disabled: dangGui }}
        closable={!dangGui}
        mask={{ closable: !dangGui }}
      >
        <p>
          Chỉ đổi khi đơn đang chờ thanh toán và còn hạn. Thao tác này cập nhật địa chỉ riêng của
          đơn, không đổi sổ địa chỉ.
        </p>
        <ChoDuLieu
          truyVan={diaChi}
          rong={diaChi.data?.length === 0}
          thongDiepRong="Bạn chưa có địa chỉ để chọn."
        >
          <Radio.Group
            className="chon-dia-chi-don"
            value={chon}
            disabled={dangGui || khoa}
            onChange={(suKien) => datChon(suKien.target.value)}
          >
            {diaChi.data?.map((muc) => (
              <Radio key={muc.id} value={String(muc.id)}>
                <strong>
                  {muc.ten_nguoi_nhan} · {muc.sdt_nguoi_nhan}
                </strong>
                <p>{noiDungDiaChi(muc)}</p>
              </Radio>
            ))}
          </Radio.Group>
        </ChoDuLieu>
        <Link to="/tai-khoan/dia-chi">Quản lý sổ địa chỉ →</Link>
        {loi && <Alert type="error" className="loi-bieu-mau" title={loi} />}
      </Modal>
    </>
  );
}
