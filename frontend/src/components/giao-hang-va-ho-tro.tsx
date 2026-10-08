import { useEffect, useState } from 'react';
import { Alert, App, Form, Input, Select } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import BieuMauThaoTac from './bieu-mau-thao-tac';
import { usePhienDangNhap } from '../store/phien-dang-nhap';
import { gui } from '../services/api';
import { lamMoiDon } from '../services/don-hang';
import { lamMoiTranhChap, moTranhChap } from '../services/tranh-chap';
import { duocGuiHang, lyDoDuocMo } from '../utils/giao-hang-tranh-chap';
import { ngayGio, nhan } from '../utils/dinh-dang';
import type { DonHang } from '../types/don-hang';

export default function GiaoHangVaHoTro({ don }: { don: DonHang }) {
  const nguoiDung = usePhienDangNhap((s) => s.nguoiDung);
  const [hienTai, datHienTai] = useState(Date.now);
  const chuyenTrang = useNavigate();
  const { message } = App.useApp();

  useEffect(() => {
    const dongHo = setInterval(() => datHienTai(Date.now()), 1000);

    return () => clearInterval(dongHo);
  }, []);

  if (!nguoiDung) {
    return null;
  }

  const quanTri = nguoiDung.vai_tro === 'QUAN_TRI';
  const gocTranhChap = quanTri ? '/quan-tri/tranh-chap' : '/tai-khoan/tranh-chap';
  const cacLyDo = lyDoDuocMo(don, nguoiDung, hienTai);
  const coTheBaoChuaNhan = !quanTri && cacLyDo.includes('CHUA_NHAN_HANG');
  const cacLyDoKhac = quanTri
    ? cacLyDo
    : cacLyDo.filter((lyDo) => lyDo !== 'CHUA_NHAN_HANG');
  const choGui = ['CHO_GUI_HANG', 'DA_THANH_TOAN'].includes(don.trang_thai);

  return (
    <section className="tam-noi-dung thao-tac-don">
      <h2>Gửi hàng & hỗ trợ giao dịch</h2>
      {choGui && (
        <Alert
          type="info"
          title={
            don.nguon_gui_hang === 'TRUNG_TAM'
              ? 'Trung tâm chịu trách nhiệm gửi hàng'
              : 'Người bán chịu trách nhiệm gửi hàng'
          }
          description={`Hạn gửi: ${ngayGio(don.han_nguoi_ban_gui_hang)}. Khai báo vận đơn chưa xác nhận người mua đã nhận hàng.`}
        />
      )}
      {duocGuiHang(don, nguoiDung) && (
        <BieuMauThaoTac<{ don_vi_van_chuyen: string; ma_van_don: string }>
          ten={
            don.nguon_gui_hang === 'TRUNG_TAM'
              ? 'Ghi nhận trung tâm gửi hàng'
              : 'Khai báo đã gửi hàng'
          }
          xacNhan={(duLieu) => (
            <>
              <p>Chỉ xác nhận sau khi đã bàn giao hàng cho đơn vị vận chuyển.</p>
              <p>
                <strong>{duLieu.don_vi_van_chuyen}</strong> · {duLieu.ma_van_don}
              </p>
              <p>
                Gửi đến: {don.ten_nguoi_nhan} · {don.dia_chi_giao_hang}
              </p>
            </>
          )}
          onGui={async (duLieu) => {
            try {
              await gui(`/orders/${don.id}/shipping`, duLieu);
              message.success('Đã ghi nhận gửi hàng');
            } finally {
              await lamMoiDon(don.id);
            }
          }}
        >
          <Form.Item
            name="don_vi_van_chuyen"
            label="Đơn vị vận chuyển"
            rules={[
              {
                required: true,
                whitespace: true,
                message: 'Nhập đơn vị vận chuyển',
              },
            ]}
          >
            <Input maxLength={100} />
          </Form.Item>
          <Form.Item
            name="ma_van_don"
            label="Mã vận đơn"
            rules={[
              {
                required: true,
                whitespace: true,
                message: 'Nhập mã vận đơn',
              },
            ]}
          >
            <Input maxLength={100} />
          </Form.Item>
        </BieuMauThaoTac>
      )}
      {quanTri && don.trang_thai === 'DA_GUI_HANG' && (
        <BieuMauThaoTac<Record<string, never>>
          ten="Ghi nhận hàng đã giao"
          xacNhan={() => (
            <p>
              Đã có xác nhận hàng tới người mua. Bước này bắt đầu thời gian kiểm tra, tiền tiếp tục
              được giữ.
            </p>
          )}
          onGui={async () => {
            try {
              await gui(`/orders/${don.id}/delivered`);
              message.success('Đã ghi nhận giao hàng, bắt đầu thời gian kiểm tra');
            } finally {
              await lamMoiDon(don.id);
            }
          }}
        >
          <p>Kiểm tra xác nhận giao hàng trước khi tiếp tục.</p>
        </BieuMauThaoTac>
      )}
      {don.tranh_chap.map((hoSo) => (
        <Link className="link-vang" key={hoSo.id} to={`${gocTranhChap}/${hoSo.id}`}>
          Tranh chấp #{hoSo.id} · {nhan(hoSo.trang_thai)} →
        </Link>
      ))}
      {coTheBaoChuaNhan && (
        <BieuMauThaoTac<{ mo_ta: string }>
          ten="Báo chưa nhận hàng"
          xacNhan={(duLieu) => (
            <>
              <p>
                <strong>Mã vận đơn:</strong> {don.ma_van_don || 'Chưa khai báo'}
              </p>
              <p className="van-ban-dai">{duLieu.mo_ta}</p>
              <p>
                Yêu cầu sẽ được chuyển cho Admin kiểm tra. Tiền vẫn được giữ trong lúc xử lý;
                thao tác này không gửi đề nghị Second Chance.
              </p>
            </>
          )}
          onGui={async (duLieu) => {
            try {
              const hoSo = await moTranhChap(don.id, {
                ...duLieu,
                ly_do: 'CHUA_NHAN_HANG',
              });

              chuyenTrang(`${gocTranhChap}/${hoSo.id}`);
            } finally {
              await lamMoiTranhChap();
            }
          }}
        >
          <p>
            Đã qua mốc khiếu nại nhưng bạn vẫn chưa nhận được hàng? Hãy gửi yêu cầu để Admin kiểm
            tra mã vận đơn.
          </p>
          <Form.Item
            name="mo_ta"
            label="Thông tin cần Admin kiểm tra"
            rules={[
              {
                required: true,
                whitespace: true,
                message: 'Mô tả tình trạng giao hàng',
              },
            ]}
          >
            <Input.TextArea rows={5} maxLength={20000} showCount />
          </Form.Item>
        </BieuMauThaoTac>
      )}
      {cacLyDoKhac.length > 0 ? (
        <BieuMauThaoTac<{ ly_do: string; mo_ta: string }>
          ten={quanTri ? 'Mở hồ sơ can thiệp' : 'Báo vấn đề với đơn hàng'}
          xacNhan={(duLieu) => (
            <>
              <p>
                <strong>{nhan(duLieu.ly_do)}</strong>
              </p>
              <p className="van-ban-dai">{duLieu.mo_ta}</p>
              <p>
                Tiền tiếp tục được giữ trong khi Admin xem xét. Bạn có thể bổ sung ảnh hoặc PDF sau
                khi mở hồ sơ.
              </p>
            </>
          )}
          onGui={async (duLieu) => {
            try {
              const hoSo = await moTranhChap(don.id, duLieu);

              chuyenTrang(`${gocTranhChap}/${hoSo.id}`);
            } finally {
              await lamMoiTranhChap();
            }
          }}
        >
          <Form.Item
            name="ly_do"
            label="Lý do yêu cầu hỗ trợ"
            rules={[
              { required: true, message: 'Chọn lý do' },
              {
                validator: (_, giaTri) =>
                  !giaTri || cacLyDoKhac.includes(giaTri)
                    ? Promise.resolve()
                    : Promise.reject(new Error('Lý do không còn phù hợp với trạng thái đơn')),
              },
            ]}
          >
            <Select options={cacLyDoKhac.map((value) => ({ value, label: nhan(value) }))} />
          </Form.Item>
          <Form.Item
            name="mo_ta"
            label="Mô tả vấn đề"
            rules={[
              {
                required: true,
                whitespace: true,
                message: 'Mô tả vấn đề cần giải quyết',
              },
            ]}
          >
            <Input.TextArea rows={5} maxLength={20000} showCount />
          </Form.Item>
        </BieuMauThaoTac>
      ) : cacLyDo.length === 0 ? (
        <p className="chu-mo">
          Mở tranh chấp trong thời gian kiểm tra hàng; nếu chưa nhận hàng, chờ đến mốc khiếu nại ghi
          trên đơn. Admin xem xét các trường hợp cần can thiệp khi tiền còn được giữ.
        </p>
      ) : null}
    </section>
  );
}
