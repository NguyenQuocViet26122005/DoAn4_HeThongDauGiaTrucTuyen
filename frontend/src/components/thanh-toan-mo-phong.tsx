import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';
import { Alert, Button, Modal, Radio } from 'antd';
import { gui, loiDeDoc } from '../services/api';
import { thanhToanDon } from '../services/don-hang';
import { docLanThanhToan, luuLanThanhToan, tenLanThanhToan } from '../services/lan-thanh-toan';
import type { KetQuaThanhToan, LanThanhToan } from '../types/tham-gia-phien';

export default function ThanhToanMoPhong({
  nguoiDungId,
  doiTuongId,
  loai,
  ten,
  khoa,
  children,
  daXuLy,
}: {
  nguoiDungId: string;
  doiTuongId: string;
  loai: 'coc' | 'mua-ngay' | 'don-hang';
  ten: string;
  khoa: boolean;
  children: ReactNode;
  daXuLy: (ketQua: KetQuaThanhToan) => void;
}) {
  const tenLuu = tenLanThanhToan(nguoiDungId, doiTuongId, loai);
  const [banDau] = useState(() => {
    try {
      return { lan: docLanThanhToan(tenLuu), loi: '' };
    } catch (loi) {
      return { lan: null, loi: loiDeDoc(loi) };
    }
  });
  const [lan, datLan] = useState<LanThanhToan | null>(banDau.lan);
  const [mo, datMo] = useState(false);
  const [dangGui, datDangGui] = useState(false);
  const [loi, datLoi] = useState(banDau.loi);
  const [ketQua, datKetQua] = useState<LanThanhToan['ket_qua_mo_phong']>('THANH_CONG');
  const dangXuLy = useRef(false);

  async function thanhToan() {
    if (dangXuLy.current || (!lan && khoa) || banDau.loi) {
      return;
    }

    dangXuLy.current = true;
    datDangGui(true);
    datLoi('');

    try {
      const lanGui = lan || { khoa_yeu_cau: crypto.randomUUID(), ket_qua_mo_phong: ketQua };

      luuLanThanhToan(tenLuu, lanGui);
      datLan(lanGui);

      const duongDan = loai === 'coc' ? 'deposit/pay' : 'buy-now';
      const phanHoi =
        loai === 'don-hang'
          ? await thanhToanDon(doiTuongId, lanGui)
          : await gui<KetQuaThanhToan>(`/auctions/${doiTuongId}/${duongDan}`, lanGui);

      sessionStorage.removeItem(tenLuu);
      datLan(null);
      datMo(false);
      daXuLy(phanHoi);
    } catch (loiGui) {
      const trangThai = axios.isAxiosError(loiGui) ? loiGui.response?.status : undefined;

      // Lỗi không có phản hồi hoặc lỗi máy chủ có thể xảy ra sau khi đã thu tiền.
      if (
        trangThai &&
        trangThai >= 400 &&
        trangThai < 500 &&
        ![401, 408, 429].includes(trangThai)
      ) {
        sessionStorage.removeItem(tenLuu);
        datLan(null);
      }

      datLoi(loiDeDoc(loiGui));
    } finally {
      dangXuLy.current = false;
      datDangGui(false);
    }
  }

  return (
    <>
      {banDau.loi && <Alert type="error" title={banDau.loi} />}
      {lan && (
        <Alert
          type="warning"
          title="Có lần thanh toán chưa nhận đủ phản hồi"
          description="Kiểm tra lại để nhận kết quả của lần trước. Hệ thống dùng lại cùng mã giao dịch để tránh thu trùng."
        />
      )}
      <Button
        type="primary"
        block
        disabled={!!banDau.loi || (khoa && !lan)}
        onClick={() => datMo(true)}
      >
        {lan ? 'Kiểm tra lần thanh toán trước' : ten}
      </Button>
      <Modal
        title={lan ? 'Kiểm tra kết quả thanh toán' : ten}
        open={mo}
        onCancel={() => !dangGui && datMo(false)}
        onOk={() => void thanhToan()}
        confirmLoading={dangGui}
        okText={lan ? 'Kiểm tra lại' : 'Xác nhận thanh toán mô phỏng'}
        cancelText="Đóng"
        okButtonProps={{ disabled: !!banDau.loi || (khoa && !lan) }}
        cancelButtonProps={{ disabled: dangGui }}
        closable={!dangGui}
        mask={{ closable: !dangGui }}
      >
        <Alert type="info" showIcon title="Thanh toán mô phỏng, không thu tiền thật" />
        {lan ? (
          <p>
            Kết quả mô phỏng đã chọn:{' '}
            {lan.ket_qua_mo_phong === 'THANH_CONG' ? 'Thành công' : 'Thất bại'}. Giữ nguyên lần thử
            khi kiểm tra lại.
          </p>
        ) : (
          <>
            <div className="xac-nhan-thanh-toan">{children}</div>
            <p>Kết quả thanh toán dùng để kiểm thử đồ án</p>
            <Radio.Group
              value={ketQua}
              onChange={(suKien) => datKetQua(suKien.target.value)}
              disabled={dangGui}
              options={[
                { value: 'THANH_CONG', label: 'Thành công' },
                { value: 'THAT_BAI', label: 'Thất bại' },
              ]}
            />
          </>
        )}
        {loi && <Alert className="loi-bieu-mau" type="error" title={loi} />}
      </Modal>
    </>
  );
}
