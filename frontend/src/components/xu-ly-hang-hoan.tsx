import { Alert, App, Form, Input, InputNumber, Select } from 'antd';
import { Link } from 'react-router-dom';
import BieuMauThaoTac from './bieu-mau-thao-tac';
import { gui, boNho } from '../services/api';
import { ngayGio, tien } from '../utils/dinh-dang';
import { usePhienDangNhap } from '../store/phien-dang-nhap';
import { vaiTroGiaoDich } from '../utils/vai-tro-giao-dich';
import type { DonHang } from '../types/don-hang';

const tenThaoTac: Record<string, string> = {
  KET_LUAN_TRACH_NHIEM: 'Kết luận trách nhiệm và chi phí phát sinh',
  DOI_SOAT_CHI_PHI: 'Xác nhận đã đối soát chi phí và bồi thường',
  KHOI_TAO: 'Bắt đầu xử lý hàng hoàn',
  DUNG_THU_HOI: 'Dừng yêu cầu thu hồi trước khi gửi hoàn',
  GUI_LAI_NGUOI_MUA: 'Gửi lại người mua sau đối chiếu',
  XAC_NHAN_GIAO_LAI: 'Xác nhận người mua đã nhận lại hàng',
  GUI_HOAN: 'Khai báo gửi hoàn về trung tâm',
  NHAN_LAI: 'Trung tâm xác nhận nhận lại',
  KIEM_KE: 'Ghi biên bản kiểm kê',
  THAT_LAC: 'Ghi nhận thất lạc',
  CHO_PHEP_BAN_LAI: 'Duyệt cho đấu giá lại',
  TRA_NGUOI_BAN: 'Gửi trả hàng cho người bán',
  XAC_NHAN_NHAN_LAI: 'Tôi đã nhận lại hàng',
  DANG_KY_LAI: 'Tạo hồ sơ đăng ký bán lại',
};
const tenTrangThai: Record<string, string> = {
  CHO_THU_HOI: 'Chờ gửi hoàn về trung tâm',
  DANG_HOAN_VE: 'Hàng đang hoàn về trung tâm',
  CHO_KIEM_KE: 'Trung tâm đang giữ hàng · chờ kiểm kê',
  DA_KIEM_KE: 'Đã kiểm kê · chờ quyết định',
  CAN_XU_LY: 'Hàng cần xử lý trước khi bán tiếp',
  KHONG_KHOP: 'Hàng không khớp · đang xác minh',
  THAT_LAC: 'Đã ghi nhận thất lạc · khóa bán',
  DU_DIEU_KIEN_BAN_LAI: 'Đủ điều kiện tạo phiên mới',
  DANG_TRA_NGUOI_BAN: 'Đã gửi trả · chờ người bán nhận',
  DA_TRA_NGUOI_BAN: 'Người bán đã nhận lại',
  DA_DUNG_THU_HOI: 'Đã dừng thu hồi · chờ quyết định tranh chấp',
  DA_GUI_LAI_NGUOI_MUA: 'Đang gửi lại cho người mua · tiền vẫn được giữ',
  DA_GIAO_LAI_NGUOI_MUA: 'Người mua đã nhận lại · chờ quyết định tranh chấp',
};
const batBuoc = [
  {
    required: true,
    whitespace: true,
    message: 'Vui lòng nhập thông tin',
  },
];

const nhanTruong: Record<string, string> = {
  ben_chiu_phi: 'Bên chịu phí hoàn',
  phi_hoan: 'Phí hoàn',
  ben_boi_thuong: 'Bên bồi thường',
  nguoi_nhan_boi_thuong: 'Bên nhận bồi thường',
  tien_boi_thuong: 'Tiền bồi thường ngoài đơn',
  ma_chung_tu: 'Mã chứng từ đối soát',
  don_vi_van_chuyen: 'Đơn vị vận chuyển',
  ma_van_don: 'Mã vận đơn',
  serial: 'Mã nhận dạng',
  so_kien: 'Số kiện',
  ket_qua: 'Kết quả',
  phu_kien: 'Phụ kiện',
  ghi_chu: 'Ghi chú và căn cứ',
};
const nhanKetQua: Record<string, string> = {
  NGUYEN_VEN: 'Nguyên vẹn, phù hợp hồ sơ',
  CAN_XU_LY: 'Cần xử lý trước khi bán tiếp',
  KHONG_KHOP: 'Không khớp nhận dạng, tiếp tục xác minh',
};
const benLienQuan: Record<string, string> = {
  NGUOI_MUA: 'Người mua',
  NGUOI_BAN: 'Người bán',
  TRUNG_TAM: 'Trung tâm',
  VAN_CHUYEN: 'Đơn vị vận chuyển',
  KHONG_PHAT_SINH: 'Không phát sinh',
};

function hienThiGiaTri(khoa: string, giaTri: unknown) {
  if (khoa === 'phi_hoan' || khoa === 'tien_boi_thuong') {
    return tien(String(giaTri));
  }
  if (khoa === 'ket_qua') {
    return nhanKetQua[String(giaTri)];
  }

  return benLienQuan[String(giaTri)] || String(giaTri ?? '');
}

export default function XuLyHangHoan({ don }: { don: DonHang }) {
  const nguoiDung = usePhienDangNhap((s) => s.nguoiDung);
  const { message } = App.useApp();
  const hoSo = don.xu_ly_hang;
  const quanTri = nguoiDung?.vai_tro === 'QUAN_TRI';
  const cacThaoTac = don.thao_tac_hang || [];

  if (!hoSo && !cacThaoTac.length) {
    return null;
  }

  return (
    <section className="tam-noi-dung thao-tac-don">
      <h2>Thu hồi, kiểm kê & bán lại</h2>
      <Alert
        type={hoSo?.trang_thai === 'DU_DIEU_KIEN_BAN_LAI' ? 'success' : 'info'}
        showIcon
        title={
          hoSo ? tenTrangThai[hoSo.trang_thai] || hoSo.trang_thai : 'Cần xác minh hàng đang ở đâu'
        }
        description="Quyết định tiền và việc nhận lại hàng được ghi riêng. Chỉ bán tiếp khi món hàng đã đủ điều kiện; lịch sử đơn cũ vẫn được giữ."
      />
      {hoSo && (
        <div className="thao-tac-don">
          <h3>Trách nhiệm và chi phí ngoài đơn</h3>
          <p className="chu-mo">
            Admin kết luận theo bằng chứng. Phí hoàn và bồi thường phát sinh được đối soát riêng với
            chứng từ, không tự khấu trừ tiền hoàn hoặc ghi thêm vào tổng đơn.
          </p>
          {hoSo.trach_nhiem ? (
            <>
              <p>
                Phí hoàn: <strong>{tien(hoSo.trach_nhiem.phi_hoan)}</strong> ·{' '}
                {benLienQuan[hoSo.trach_nhiem.ben_chiu_phi]}
              </p>
              <p>
                Bồi thường ngoài đơn: <strong>{tien(hoSo.trach_nhiem.tien_boi_thuong)}</strong>
                {Number(hoSo.trach_nhiem.tien_boi_thuong) > 0 && (
                  <>
                    {' '}
                    · {benLienQuan[hoSo.trach_nhiem.ben_boi_thuong]} →{' '}
                    {benLienQuan[hoSo.trach_nhiem.nguoi_nhan_boi_thuong]}
                  </>
                )}
              </p>
              <p className="van-ban-dai">{hoSo.trach_nhiem.ghi_chu}</p>
              <Alert
                type={hoSo.doi_soat_chi_phi ? 'success' : 'info'}
                title={
                  hoSo.doi_soat_chi_phi
                    ? `Đã đối soát · ${hoSo.doi_soat_chi_phi.ma_chung_tu}`
                    : [hoSo.trach_nhiem.phi_hoan, hoSo.trach_nhiem.tien_boi_thuong].some(
                          (soTien) => Number(soTien) > 0,
                        )
                      ? 'Khoản phát sinh chưa được xác nhận đối soát'
                      : 'Không phát sinh khoản đối soát ngoài đơn'
                }
                description={hoSo.doi_soat_chi_phi?.ghi_chu}
              />
            </>
          ) : (
            <p>Chưa có kết luận về trách nhiệm và phí phát sinh.</p>
          )}
        </div>
      )}
      {hoSo?.kiem_dinh_moi_id &&
        (quanTri || String(nguoiDung?.id) === String(don.nguoi_ban_id)) && (
          <Link
            className="link-vang"
            to={`/${quanTri ? 'quan-tri' : 'nguoi-ban'}/kiem-dinh/${hoSo.kiem_dinh_moi_id}`}
          >
            Xem lần kiểm định sau hoàn hàng #{hoSo.kiem_dinh_moi_id} →
          </Link>
        )}
      {quanTri && hoSo?.kiem_dinh_moi_id && (
        <Link className="link-vang" to={`/quan-tri/san-pham/${don.san_pham_id}`}>
          Duyệt lại sản phẩm sau khi kiểm định đạt →
        </Link>
      )}
      {hoSo?.trang_thai === 'DU_DIEU_KIEN_BAN_LAI' &&
        String(nguoiDung?.id) === String(don.nguoi_ban_id) && (
          <Link className="nut-vang" to={`/nguoi-ban/phien/moi?san_pham_id=${don.san_pham_id}`}>
            Tạo phiên đấu giá mới
          </Link>
        )}
      {hoSo?.san_pham_dang_lai_id &&
        (quanTri || String(nguoiDung?.id) === String(don.nguoi_ban_id)) && (
          <Link
            className="link-vang"
            to={`/${quanTri ? 'quan-tri' : 'nguoi-ban'}/san-pham/${hoSo.san_pham_dang_lai_id}`}
          >
            Mở hồ sơ đăng ký lại #{hoSo.san_pham_dang_lai_id} →
          </Link>
        )}
      {cacThaoTac.map((thaoTac) => (
        <BieuMauThaoTac<Record<string, unknown>>
          key={`${thaoTac}:${hoSo?.trang_thai}`}
          ten={tenThaoTac[thaoTac]}
          banDau={
            thaoTac === 'NHAN_LAI'
              ? { so_kien: 1 }
              : thaoTac === 'KET_LUAN_TRACH_NHIEM'
                ? {
                    phi_hoan: '0',
                    tien_boi_thuong: '0',
                    ben_chiu_phi: 'KHONG_PHAT_SINH',
                    ben_boi_thuong: 'KHONG_PHAT_SINH',
                    nguoi_nhan_boi_thuong: 'KHONG_PHAT_SINH',
                  }
                : {}
          }
          xacNhan={(duLieu) => (
            <>
              <p>
                {tenThaoTac[thaoTac]} cho đơn {don.ma_don_hang}.
              </p>
              {Object.entries(duLieu).map(([khoa, giaTri]) => (
                <p className="van-ban-dai" key={khoa}>
                  <strong>{nhanTruong[khoa]}:</strong> {hienThiGiaTri(khoa, giaTri)}
                </p>
              ))}
              <p>
                Thông tin được lưu vào lịch sử xử lý. Hãy xác nhận theo tình trạng hàng thực tế.
              </p>
            </>
          )}
          onGui={async (duLieu) => {
            await gui(`/orders/${don.id}/returned-item`, { ...duLieu, thao_tac: thaoTac });
            await boNho.invalidateQueries();
            message.success('Đã cập nhật xử lý hàng');
          }}
        >
          {thaoTac === 'KET_LUAN_TRACH_NHIEM' && (
            <>
              <Alert
                type="info"
                title="Kết luận theo bằng chứng, không tự thu thêm hoặc trừ tiền đơn"
                description="Đổi ý do người mua: xem xét người mua chịu phí. Hàng sai/lỗi: xác định lỗi seller, trung tâm hoặc vận chuyển theo hồ sơ. Thất lạc: ghi bên chịu trách nhiệm và khoản bồi thường đã xác định. Không có khoản phát sinh thì nhập 0 và chọn Không phát sinh."
              />
              {['ben_chiu_phi', 'ben_boi_thuong', 'nguoi_nhan_boi_thuong'].map((khoa) => (
                <Form.Item
                  key={khoa}
                  name={khoa}
                  label={nhanTruong[khoa]}
                  rules={[{ required: true }]}
                >
                  <Select
                    options={Object.entries(benLienQuan)
                      .filter(
                        ([value]) => khoa !== 'nguoi_nhan_boi_thuong' || value !== 'VAN_CHUYEN',
                      )
                      .map(([value, label]) => ({ value, label }))}
                  />
                </Form.Item>
              ))}
              {['phi_hoan', 'tien_boi_thuong'].map((khoa) => (
                <Form.Item
                  key={khoa}
                  name={khoa}
                  label={`${nhanTruong[khoa]} (đ)`}
                  rules={[{ required: true }]}
                >
                  <InputNumber<string> stringMode min="0" max="9999999999999" precision={0} />
                </Form.Item>
              ))}
            </>
          )}
          {thaoTac === 'DOI_SOAT_CHI_PHI' && (
            <>
              <Alert
                type="warning"
                title="Chỉ xác nhận khi đã kiểm tra chứng từ thanh toán thực tế của khoản phát sinh"
                description="Thao tác ghi nhận đối soát ngoài đơn, không thực hiện thu tiền hoặc chuyển tiền qua cổng thanh toán."
              />
              <Form.Item
                name="ma_chung_tu"
                label="Mã chứng từ/biên nhận đối soát"
                rules={[...batBuoc, { min: 6 }]}
              >
                <Input maxLength={150} />
              </Form.Item>
            </>
          )}
          {['GUI_HOAN', 'TRA_NGUOI_BAN', 'GUI_LAI_NGUOI_MUA'].includes(thaoTac) && (
            <>
              <Form.Item name="don_vi_van_chuyen" label="Đơn vị vận chuyển" rules={batBuoc}>
                <Input maxLength={100} />
              </Form.Item>
              <Form.Item name="ma_van_don" label="Mã vận đơn" rules={batBuoc}>
                <Input maxLength={100} />
              </Form.Item>
            </>
          )}
          {['NHAN_LAI', 'KIEM_KE'].includes(thaoTac) && (
            <Form.Item name="serial" label="Serial hoặc mã nhận dạng đối chiếu" rules={batBuoc}>
              <Input maxLength={150} />
            </Form.Item>
          )}
          {thaoTac === 'NHAN_LAI' && (
            <Form.Item name="so_kien" label="Số kiện thực nhận" rules={[{ required: true }]}>
              <InputNumber min={1} max={1000} precision={0} />
            </Form.Item>
          )}
          {thaoTac === 'KIEM_KE' && (
            <>
              <Form.Item name="ket_qua" label="Kết quả đối chiếu" rules={[{ required: true }]}>
                <Select
                  options={[
                    { value: 'NGUYEN_VEN', label: 'Nguyên vẹn, phù hợp hồ sơ' },
                    { value: 'CAN_XU_LY', label: 'Có vấn đề · cần trả người bán xử lý' },
                    { value: 'KHONG_KHOP', label: 'Không khớp nhận dạng · tiếp tục xác minh' },
                  ]}
                />
              </Form.Item>
              <Form.Item name="phu_kien" label="Đối chiếu phụ kiện và chứng từ" rules={batBuoc}>
                <Input.TextArea rows={3} maxLength={5000} />
              </Form.Item>
            </>
          )}
          <Form.Item
            name="ghi_chu"
            label={
              thaoTac === 'THAT_LAC'
                ? 'Căn cứ xác minh thất lạc (ít nhất 30 ký tự)'
                : thaoTac === 'KET_LUAN_TRACH_NHIEM'
                  ? 'Căn cứ kết luận trách nhiệm và chi phí (ít nhất 30 ký tự)'
                  : 'Ghi chú và căn cứ'
            }
            rules={
              [
                'CHO_PHEP_BAN_LAI',
                'XAC_NHAN_NHAN_LAI',
                'DANG_KY_LAI',
                'XAC_NHAN_GIAO_LAI',
              ].includes(thaoTac)
                ? []
                : [
                    ...batBuoc,
                    ...(['THAT_LAC', 'KET_LUAN_TRACH_NHIEM'].includes(thaoTac)
                      ? [{ min: 30, message: 'Căn cứ xác minh cần ít nhất 30 ký tự' }]
                      : thaoTac === 'DOI_SOAT_CHI_PHI'
                        ? [{ min: 20, message: 'Kết quả đối soát cần ít nhất 20 ký tự' }]
                        : []),
                  ]
            }
          >
            <Input.TextArea rows={4} maxLength={5000} />
          </Form.Item>
        </BieuMauThaoTac>
      ))}
      {!!hoSo?.lich_su.length && (
        <div className="lich-su-hang-hoan">
          <h3>Lịch sử xử lý hàng</h3>
          <ol>
            {hoSo.lich_su.map((muc, i) => (
              <li key={i}>
                <strong>{tenThaoTac[muc.thao_tac]}</strong> · {ngayGio(muc.thoi_gian)} ·{' '}
                {vaiTroGiaoDich(muc.nguoi_thuc_hien_id, don, nguoiDung?.id)}
                {muc.ghi_chu && <p className="van-ban-dai">{muc.ghi_chu}</p>}
                {muc.ma_van_don && (
                  <p>
                    {muc.don_vi_van_chuyen} · {muc.ma_van_don}
                  </p>
                )}
                {muc.serial && <p>Mã nhận dạng: {muc.serial}</p>}
                {muc.phu_kien && <p className="van-ban-dai">Phụ kiện: {muc.phu_kien}</p>}
                {muc.ket_qua && <p>Kết quả: {nhanKetQua[muc.ket_qua]}</p>}
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
