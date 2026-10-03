import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Modal } from 'antd';
import ThanhToanMoPhong from './thanh-toan-mo-phong';
import DiaChiDon from './dia-chi-don';
import { usePhienDangNhap } from '../store/phien-dang-nhap';
import { lamMoiDon, xacNhanDon } from '../services/don-hang';
import { loiDeDoc } from '../services/api';
import type { DonHang } from '../types/don-hang';
import type { KetQuaThanhToan } from '../types/tham-gia-phien';
import { duocHoanTatDon } from '../utils/don-hang';
import { mocThoiGian, ngayGio, tien } from '../utils/dinh-dang';

export default function ThaoTacDonHang({ don }: { don: DonHang }) {
  const nguoiDung = usePhienDangNhap((s) => s.nguoiDung);
  const [hienTai, datHienTai] = useState(Date.now);
  const [ketQua, datKetQua] = useState<KetQuaThanhToan>();
  const [thaoTac, datThaoTac] = useState<'delivered' | 'confirm'>();
  const [dangGui, datDangGui] = useState(false);
  const [loi, datLoi] = useState('');
  const [thongBao, datThongBao] = useState('');
  const dangXuLy = useRef(false);

  useEffect(() => {
    const dem = setInterval(() => datHienTai(Date.now()), 1000);

    return () => clearInterval(dem);
  }, []);

  const laNguoiMua = String(nguoiDung?.id) === String(don.nguoi_mua_id);
  const duocThaoTac =
    laNguoiMua &&
    nguoiDung?.vai_tro === 'NGUOI_DUNG' &&
    nguoiDung.trang_thai_tai_khoan === 'HOAT_DONG';
  const choThanhToan = don.trang_thai === 'CHO_THANH_TOAN';
  const conHan = !!don.han_thanh_toan && mocThoiGian(don.han_thanh_toan) > hienTai;
  const duocNhan = don.trang_thai === 'DA_GUI_HANG';
  const duocHoanTat = duocHoanTatDon(don);

  async function xacNhan() {
    if (
      !thaoTac ||
      dangXuLy.current ||
      !duocThaoTac ||
      (thaoTac === 'delivered' ? !duocNhan : !duocHoanTat)
    ) {
      return;
    }

    dangXuLy.current = true;
    datDangGui(true);
    datLoi('');
    datThongBao('');

    try {
      const daLuu = await xacNhanDon(don.id, thaoTac);

      datThongBao(
        daLuu.trang_thai === 'HOAN_THANH'
          ? 'Đơn đã hoàn tất; tiền đã được giải ngân.'
          : Number(daLuu.can_admin_xu_ly)
            ? 'Đơn cần Admin kiểm tra. Tiền chưa được giải ngân.'
            : 'Đã ghi nhận nhận hàng. Tiền vẫn đang giữ trong thời gian kiểm tra.',
      );
      datThaoTac(undefined);
    } catch (loiGui) {
      datLoi(loiDeDoc(loiGui));
    } finally {
      await lamMoiDon(don.id);
      dangXuLy.current = false;
      datDangGui(false);
    }
  }

  if (!duocThaoTac || !nguoiDung) {
    return (
      <Alert type="info" title="Chỉ người mua của đơn được thanh toán và xác nhận nhận hàng" />
    );
  }

  return (
    <section className="tam-noi-dung thao-tac-don">
      <h2>Thao tác của người mua</h2>
      {choThanhToan && (
        <>
          <Alert
            type={conHan ? 'info' : 'warning'}
            title={
              conHan
                ? `Thanh toán trước ${ngayGio(don.han_thanh_toan)}`
                : 'Đã hết hạn thanh toán, đang chờ hệ thống xử lý'
            }
            description="Thanh toán thất bại không kéo dài hạn. Sửa sổ địa chỉ không tự thay địa chỉ đã ghi trong đơn."
          />
          <DiaChiDon id={don.id} khoa={!conHan} />
        </>
      )}
      {ketQua && (
        <Alert
          type={ketQua.ket_qua_mo_phong === 'THANH_CONG' ? 'success' : 'warning'}
          title={
            ketQua.ket_qua_mo_phong === 'THANH_CONG'
              ? 'Đơn đã thanh toán đủ'
              : 'Thanh toán thất bại, tiền đã thu giữ nguyên'
          }
        />
      )}
      <ThanhToanMoPhong
        nguoiDungId={nguoiDung.id}
        doiTuongId={don.id}
        loai="don-hang"
        ten={choThanhToan ? 'Thanh toán phần còn lại' : 'Không còn khoản thanh toán mới'}
        khoa={!choThanhToan || !conHan}
        daXuLy={(phanHoi) => {
          datKetQua(phanHoi);
          void lamMoiDon(don.id);
        }}
      >
        <p>
          Tổng đơn: <strong>{tien(don.tong_tien)}</strong>
        </p>
        <p>Đã thu (gồm cọc): {tien(don.so_tien_da_thu)}</p>
        <p>
          Thanh toán thêm: <strong>{tien(don.so_tien_con_phai_thanh_toan)}</strong>
        </p>
        <p>
          Người nhận: {don.ten_nguoi_nhan} · {don.sdt_nguoi_nhan}
          <br />
          {don.dia_chi_giao_hang}
        </p>
        <p>Tiền được giữ trung gian sau khi thanh toán thành công.</p>
      </ThanhToanMoPhong>
      {thongBao && <Alert type="info" title={thongBao} />}
      {duocNhan && (
        <Button type="primary" onClick={() => datThaoTac('delivered')}>
          Tôi đã nhận hàng
        </Button>
      )}
      {['DA_GIAO', 'DANG_KIEM_TRA'].includes(don.trang_thai) && (
        <>
          <Alert
            type="info"
            title={`Kiểm tra hàng đến ${ngayGio(don.han_kiem_tra)}`}
            description="Nhận hàng chưa giải ngân. Chỉ hoàn tất nếu hàng phù hợp và bạn không còn khiếu nại. Hệ thống có thể tự hoàn tất sau hạn nếu đủ điều kiện."
          />
          <Button type="primary" disabled={!duocHoanTat} onClick={() => datThaoTac('confirm')}>
            Hàng phù hợp — hoàn tất
          </Button>
        </>
      )}
      <Modal
        title={thaoTac === 'delivered' ? 'Xác nhận đã nhận hàng' : 'Xác nhận hoàn tất giao dịch'}
        open={!!thaoTac}
        onCancel={() => !dangGui && datThaoTac(undefined)}
        onOk={() => void xacNhan()}
        okText={thaoTac === 'delivered' ? 'Đã nhận, bắt đầu kiểm tra' : 'Hoàn tất và giải ngân'}
        cancelText="Quay lại"
        confirmLoading={dangGui}
        okButtonProps={{ disabled: thaoTac === 'delivered' ? !duocNhan : !duocHoanTat }}
        cancelButtonProps={{ disabled: dangGui }}
        closable={!dangGui}
        mask={{ closable: !dangGui }}
      >
        <p>
          {thaoTac === 'delivered'
            ? 'Chỉ xác nhận khi bạn thực sự đã nhận hàng. Thời gian kiểm tra bắt đầu sau bước này; tiền vẫn được giữ trung gian.'
            : 'Xác nhận hàng phù hợp sẽ hoàn tất đơn và giải ngân toàn bộ tiền cho người bán. Không chọn nếu hàng có vấn đề cần khiếu nại.'}
        </p>
        {loi && <Alert type="error" title={loi} />}
      </Modal>
    </section>
  );
}
