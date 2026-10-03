import { Alert, App, Button, Descriptions, Form, Input, Select } from 'antd';
import { Link, useParams } from 'react-router-dom';
import { ChoDuLieu, TepRiengTu, TieuDe, TrangThai } from '../components/dung-chung';
import BieuMauThaoTac from '../components/bieu-mau-thao-tac';
import BangChungTranhChap from '../components/bang-chung-tranh-chap';
import { useDuLieu } from '../hooks/su-dung-du-lieu';
import { usePhienDangNhap } from '../store/phien-dang-nhap';
import { lamMoiTranhChap, xuLyTranhChap } from '../services/tranh-chap';
import { tranhChapDangMo } from '../utils/giao-hang-tranh-chap';
import { ngayGio, nhan, tien } from '../utils/dinh-dang';
import type { ChiTietTranhChap } from '../types/tranh-chap';
import type { DonHang } from '../types/don-hang';

function NoiDungTranhChap({ hoSo }: { hoSo: ChiTietTranhChap }) {
  const nguoiDung = usePhienDangNhap((s) => s.nguoiDung);
  const don = useDuLieu<DonHang>(`/orders/${hoSo.don_hang_id}`);
  const { message } = App.useApp();
  const quanTri = nguoiDung?.vai_tro === 'QUAN_TRI';
  const dangMo = tranhChapDangMo(hoSo.trang_thai);
  const laNguoiBan =
    nguoiDung?.vai_tro === 'NGUOI_DUNG' && String(nguoiDung.id) === String(don.data?.nguoi_ban_id);
  const hoSoKiemDinh = hoSo.ho_so_kiem_dinh;

  async function xuLy(thaoTac: 'response' | 'take' | 'resolve', noiDung: unknown = {}) {
    try {
      await xuLyTranhChap(hoSo.id, thaoTac, noiDung);
      message.success(thaoTac === 'resolve' ? 'Đã ghi nhận quyết định xử lý' : 'Đã cập nhật hồ sơ');
    } finally {
      await lamMoiTranhChap();
    }
  }

  return (
    <div className="chi-tiet-don">
      <section className="tam-noi-dung thong-tin-don">
        <TrangThai giaTri={hoSo.trang_thai} />
        <h2>{nhan(hoSo.ly_do)}</h2>
        <p className="van-ban-dai">{hoSo.mo_ta}</p>
        <Descriptions
          column={1}
          items={[
            {
              key: 'mo',
              label: 'Ngày mở',
              children: ngayGio(hoSo.ngay_tao),
            },
            {
              key: 'nguoi',
              label: 'Người mở',
              children: `Tài khoản #${hoSo.nguoi_mo_id}`,
            },
            {
              key: 'xong',
              label: 'Ngày giải quyết',
              children: ngayGio(hoSo.ngay_giai_quyet),
            },
          ]}
        />
        <Link
          className="link-vang"
          to={`${quanTri ? '/quan-tri' : '/tai-khoan'}/don-hang/${hoSo.don_hang_id}`}
        >
          Xem đơn hàng #{hoSo.don_hang_id} →
        </Link>
        <h3>Phản hồi người bán</h3>
        <p className="van-ban-dai">{hoSo.phan_hoi_nguoi_ban || 'Chưa có phản hồi.'}</p>
        {hoSo.ket_qua_xu_ly && (
          <>
            <h3>Quyết định của Admin</h3>
            <p className="van-ban-dai">{hoSo.ket_qua_xu_ly}</p>
            <p>
              Tiền hoàn: <strong>{tien(hoSo.so_tien_hoan)}</strong>
            </p>
          </>
        )}
      </section>
      <section className="tam-noi-dung thao-tac-don">
        <h2>Xử lý hồ sơ</h2>
        <ChoDuLieu truyVan={don}>
          {don.data && (
            <>
              <Descriptions
                column={1}
                items={[
                  {
                    key: 'tong',
                    label: 'Tổng đơn',
                    children: tien(don.data.tong_tien),
                  },
                  {
                    key: 'giu',
                    label: 'Đang giữ',
                    children: tien(don.data.so_tien_dang_giu),
                  },
                  {
                    key: 'hoan',
                    label: 'Đã hoàn',
                    children: tien(don.data.so_tien_da_hoan),
                  },
                  {
                    key: 'giai-ngan',
                    label: 'Đã giải ngân',
                    children: tien(don.data.so_tien_da_giai_ngan),
                  },
                ]}
              />
              {dangMo && (
                <Alert
                  type="info"
                  title="Tiền được giữ trong thời gian xem xét"
                  description="Việc gửi phản hồi hoặc bằng chứng không tự hoàn tiền hay giải ngân."
                />
              )}
              {dangMo && laNguoiBan && (
                <BieuMauThaoTac<{ phan_hoi_nguoi_ban: string }>
                  ten="Gửi phản hồi người bán"
                  banDau={{ phan_hoi_nguoi_ban: hoSo.phan_hoi_nguoi_ban || '' }}
                  xacNhan={(duLieu) => <p className="van-ban-dai">{duLieu.phan_hoi_nguoi_ban}</p>}
                  onGui={(duLieu) => xuLy('response', duLieu)}
                >
                  <Form.Item
                    name="phan_hoi_nguoi_ban"
                    label="Nội dung phản hồi"
                    rules={[
                      {
                        required: true,
                        whitespace: true,
                        message: 'Nhập phản hồi của bạn',
                      },
                    ]}
                  >
                    <Input.TextArea rows={6} maxLength={20000} showCount />
                  </Form.Item>
                </BieuMauThaoTac>
              )}
              {dangMo && quanTri && (
                <>
                  {hoSo.trang_thai !== 'QUAN_TRI_DANG_XU_LY' && (
                    <BieuMauThaoTac<Record<string, never>>
                      ten="Tiếp nhận tranh chấp"
                      xacNhan={() => (
                        <p>Ghi nhận bạn đang xem xét hồ sơ này. Tiền tiếp tục được giữ.</p>
                      )}
                      onGui={() => xuLy('take')}
                    >
                      <p>Kiểm tra mô tả, phản hồi và bằng chứng trước khi ra quyết định.</p>
                    </BieuMauThaoTac>
                  )}
                  <BieuMauThaoTac<{ ket_qua: 'NGUOI_MUA' | 'NGUOI_BAN'; ket_qua_xu_ly: string }>
                    ten="Ra quyết định xử lý"
                    xacNhan={(duLieu) => (
                      <>
                        <Alert
                          type="warning"
                          title={
                            duLieu.ket_qua === 'NGUOI_MUA'
                              ? 'Hoàn toàn bộ cho người mua và hủy đơn'
                              : 'Giải ngân toàn bộ cho người bán và hoàn tất đơn'
                          }
                        />
                        <p>
                          Số tiền đang giữ: <strong>{tien(don.data!.so_tien_dang_giu)}</strong>, bao
                          gồm cọc đã chuyển vào đơn và phí vận chuyển.
                        </p>
                        <p className="van-ban-dai">{duLieu.ket_qua_xu_ly}</p>
                        <p>
                          Quyết định kết thúc tranh chấp. Hãy đối chiếu đầy đủ bằng chứng trước khi
                          xác nhận.
                        </p>
                      </>
                    )}
                    onGui={(duLieu) => xuLy('resolve', duLieu)}
                  >
                    <Form.Item
                      name="ket_qua"
                      label="Hướng giải quyết"
                      rules={[{ required: true, message: 'Chọn hướng giải quyết' }]}
                    >
                      <Select
                        options={[
                          { value: 'NGUOI_MUA', label: 'Hoàn toàn bộ cho người mua' },
                          { value: 'NGUOI_BAN', label: 'Giải ngân toàn bộ cho người bán' },
                        ]}
                      />
                    </Form.Item>
                    <Form.Item
                      name="ket_qua_xu_ly"
                      label="Căn cứ và quyết định xử lý"
                      rules={[
                        {
                          required: true,
                          whitespace: true,
                          message: 'Nhập căn cứ và quyết định',
                        },
                      ]}
                    >
                      <Input.TextArea rows={6} maxLength={20000} showCount />
                    </Form.Item>
                  </BieuMauThaoTac>
                </>
              )}
              {!dangMo && (
                <Alert
                  type="success"
                  title="Hồ sơ đã kết thúc"
                  description="Bạn có thể xem quyết định và bằng chứng đã lưu."
                />
              )}
            </>
          )}
        </ChoDuLieu>
      </section>
      <BangChungTranhChap key={hoSo.id} hoSo={hoSo} />
      {hoSoKiemDinh && (
        <section className="tam-noi-dung">
          <h2>Hồ sơ kiểm định liên quan</h2>
          <p>
            {hoSoKiemDinh.ma_kiem_dinh} · {nhan(hoSoKiemDinh.ket_qua)}
          </p>
          <p>
            Chuyên gia: {hoSoKiemDinh.ten_chuyen_gia || 'Chưa cập nhật'} ·{' '}
            {hoSoKiemDinh.don_vi_kiem_dinh}
          </p>
          <p className="van-ban-dai">{hoSoKiemDinh.nhan_xet}</p>
          <div className="tep-ho-so">
            {hoSoKiemDinh.tep_dinh_kem.map((tep) => (
              <article key={tep.id}>
                <span>{nhan(tep.loai_tep)}</span>
                <TepRiengTu url={tep.duong_dan_tep} ten={`Xem tệp kiểm định #${tep.id}`} />
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default function TrangChiTietTranhChap({ quanTri = false }: { quanTri?: boolean }) {
  const { id } = useParams();
  const truyVan = useDuLieu<ChiTietTranhChap>(`/disputes/${id}`);

  return (
    <>
      <TieuDe ten={`Hồ sơ tranh chấp #${id}`} moTa="Trao đổi và lưu bằng chứng để xử lý giao dịch.">
        <Button loading={truyVan.isFetching} onClick={() => void lamMoiTranhChap()}>
          Làm mới
        </Button>
      </TieuDe>
      <Link className="link-vang" to={quanTri ? '/quan-tri/tranh-chap' : '/tai-khoan/tranh-chap'}>
        ← Danh sách tranh chấp
      </Link>
      <ChoDuLieu truyVan={truyVan}>
        {truyVan.data && <NoiDungTranhChap key={id} hoSo={truyVan.data} />}
      </ChoDuLieu>
    </>
  );
}
