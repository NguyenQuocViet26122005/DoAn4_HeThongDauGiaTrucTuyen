import { useEffect, useState } from 'react';
import { Alert, Button, Descriptions, Skeleton } from 'antd';
import { Link } from 'react-router-dom';
import { ChoDuLieu, TrangThai } from './dung-chung';
import DatGia from './dat-gia';
import ThanhToanMoPhong from './thanh-toan-mo-phong';
import { noiDungDiaChi } from '../utils/dia-chi';
import { useDuLieu } from '../hooks/su-dung-du-lieu';
import { usePhienDangNhap } from '../store/phien-dang-nhap';
import { dangKyCoc, lamMoiThamGia } from '../services/tham-gia-phien';
import { loiDeDoc } from '../services/api';
import type { NguoiDung, Phien } from '../types/du-lieu';
import type { DatCoc as HoSoCoc, DiaChi, KetQuaThanhToan } from '../types/tham-gia-phien';
import { mocThoiGian, tien } from '../utils/dinh-dang';
import { soTienMuaNgay } from '../utils/tien-tham-gia';

function MuaNgay({
  phien,
  coc,
  diaChi,
  nguoiDung,
  khoa,
}: {
  phien: Phien;
  coc: HoSoCoc | null;
  diaChi?: DiaChi;
  nguoiDung: NguoiDung;
  khoa: boolean;
}) {
  const [ketQua, datKetQua] = useState<KetQuaThanhToan>();
  const gia = phien.gia_mua_ngay || '0';
  const tienCoc = coc?.trang_thai === 'DA_DAT_COC' ? coc.so_tien : '0';
  const soTien = soTienMuaNgay(gia, phien.phi_van_chuyen, phien.gia_mua_ngay ? tienCoc : '0');

  return (
    <section className="khoi-tham-gia">
      <h2>Mua ngay</h2>
      <p className="chu-mo">
        Không cần đặt cọc trước. Thanh toán mô phỏng thành công sẽ chốt phiên và tạo đơn chờ gửi
        hàng.
      </p>
      {ketQua && (
        <Alert
          type={ketQua.ket_qua_mo_phong === 'THANH_CONG' ? 'success' : 'warning'}
          title={
            ketQua.ket_qua_mo_phong === 'THANH_CONG'
              ? 'Mua ngay thành công'
              : 'Thanh toán mô phỏng thất bại'
          }
          description={
            ketQua.don_hang ? (
              <Link to={`/tai-khoan/don-hang/${ketQua.don_hang.id}`}>
                Xem đơn {ketQua.don_hang.ma_don_hang} →
              </Link>
            ) : (
              'Phiên chưa được chốt, cọc được giữ nguyên. Bạn có thể thực hiện một lần thanh toán mới nếu Mua ngay còn hiệu lực.'
            )
          }
        />
      )}
      <ThanhToanMoPhong
        nguoiDungId={nguoiDung.id}
        doiTuongId={phien.id}
        loai="mua-ngay"
        ten={phien.gia_mua_ngay ? `Mua ngay · ${tien(gia)}` : 'Phiên không bật Mua ngay'}
        khoa={khoa || !Number(phien.cho_phep_mua_ngay) || !phien.gia_mua_ngay}
        daXuLy={(phanHoi) => {
          datKetQua(phanHoi);
          void lamMoiThamGia(phien.id);
        }}
      >
        <Descriptions
          column={1}
          items={[
            {
              key: 'gia',
              label: 'Giá sản phẩm',
              children: tien(gia),
            },
            {
              key: 'phi',
              label: 'Phí vận chuyển',
              children: tien(phien.phi_van_chuyen),
            },
            {
              key: 'tong',
              label: 'Tổng đơn',
              children: tien(soTien.tong),
            },
            {
              key: 'coc',
              label: 'Cọc đã có được trừ',
              children: tien(tienCoc),
            },
            {
              key: 'thu',
              label: 'Thanh toán thêm',
              children: <strong>{tien(soTien.conLai)}</strong>,
            },
          ]}
        />
        {diaChi && (
          <p>
            Nhận hàng: {diaChi.ten_nguoi_nhan} · {diaChi.sdt_nguoi_nhan}
            <br />
            {noiDungDiaChi(diaChi)}
          </p>
        )}
        <p className="chu-mo">Tiền được giữ trung gian theo quy tắc giao dịch của VietBid.</p>
      </ThanhToanMoPhong>
    </section>
  );
}

function ThaoTacNguoiMua({ phien, nguoiDung }: { phien: Phien; nguoiDung: NguoiDung }) {
  const diaChi = useDuLieu<DiaChi[]>('/users/me/addresses');
  const coc = useDuLieu<HoSoCoc | null>(`/auctions/${phien.id}/deposit`, undefined, true, 10000);
  const [hienTai, datHienTai] = useState(Date.now);
  const [dangDangKy, datDangDangKy] = useState(false);
  const [loi, datLoi] = useState('');
  const [ketQuaCoc, datKetQuaCoc] = useState<KetQuaThanhToan>();

  useEffect(() => {
    const dem = setInterval(() => datHienTai(Date.now()), 1000);

    return () => clearInterval(dem);
  }, []);

  const conHieuLuc =
    ['DA_LEN_LICH', 'HOAT_DONG'].includes(phien.trang_thai) &&
    mocThoiGian(phien.thoi_gian_ket_thuc) > hienTai;
  const daBatDau = mocThoiGian(phien.thoi_gian_bat_dau) <= hienTai;
  const diaChiNhan = diaChi.data?.[0];
  const canCoc = !!Number(phien.yeu_cau_dat_coc);
  const duCoc =
    !canCoc ||
    (coc.data?.trang_thai === 'DA_DAT_COC' &&
      Number(coc.data.so_tien) === Number(phien.so_tien_dat_coc));
  const duocMua = !!diaChiNhan && conHieuLuc && daBatDau;
  const lyDo = !conHieuLuc
    ? 'Phiên đã hết giờ hoặc kết thúc, không nhận giao dịch mới.'
    : !diaChiNhan
      ? 'Bạn cần thêm địa chỉ nhận hàng trước khi tham gia.'
      : !daBatDau
        ? 'Phiên chưa bắt đầu. Bạn có thể đăng ký và đặt cọc trước nếu phiên yêu cầu.'
        : null;

  async function dangKy() {
    datDangDangKy(true);
    datLoi('');

    try {
      await dangKyCoc(phien.id);
      await lamMoiThamGia(phien.id);
    } catch (loiGui) {
      datLoi(loiDeDoc(loiGui));
    } finally {
      datDangDangKy(false);
    }
  }

  return (
    <ChoDuLieu truyVan={diaChi}>
      <ChoDuLieu truyVan={coc}>
        <div className="tham-gia-phien">
          {lyDo && <Alert type="info" title={lyDo} />}
          <div className="dia-chi-nhan">
            <strong>Địa chỉ nhận hàng</strong>
            {diaChiNhan && (
              <p>
                {diaChiNhan.ten_nguoi_nhan} · {diaChiNhan.sdt_nguoi_nhan}
                <br />
                {noiDungDiaChi(diaChiNhan)}
              </p>
            )}
            <Link className="link-vang" to={`/tai-khoan/dia-chi?phien=${phien.id}`}>
              {diaChiNhan ? 'Quản lý địa chỉ' : 'Thêm địa chỉ nhận hàng'} ↗
            </Link>
          </div>
          {canCoc && (
            <section className="khoi-tham-gia">
              <h2>Cọc tham gia · {tien(phien.so_tien_dat_coc)}</h2>
              <p className="chu-mo">
                Cọc hợp lệ mới được trả giá. Người không thắng được hoàn cọc; cọc của người thắng
                chuyển vào đơn. Không thanh toán đúng hạn có thể bị giữ cọc.
              </p>
              {coc.data && <TrangThai giaTri={coc.data.trang_thai} />}
              {coc.data?.ly_do_xu_ly && <p>{coc.data.ly_do_xu_ly}</p>}
              {loi && <Alert type="error" title={loi} />}
              {ketQuaCoc && (
                <Alert
                  type={ketQuaCoc.ket_qua_mo_phong === 'THANH_CONG' ? 'success' : 'warning'}
                  title={
                    ketQuaCoc.ket_qua_mo_phong === 'THANH_CONG'
                      ? 'Đã ghi nhận thanh toán cọc'
                      : 'Thanh toán cọc thất bại, có thể thử lần mới'
                  }
                />
              )}
              {!coc.data && (
                <Button
                  block
                  disabled={!diaChiNhan || !conHieuLuc}
                  loading={dangDangKy}
                  onClick={() => void dangKy()}
                >
                  Đăng ký tham gia phiên
                </Button>
              )}
              <ThanhToanMoPhong
                nguoiDungId={nguoiDung.id}
                doiTuongId={phien.id}
                loai="coc"
                ten={
                  coc.data?.trang_thai === 'DA_DAT_COC' ? 'Đã đặt cọc' : 'Thanh toán cọc mô phỏng'
                }
                khoa={
                  !diaChiNhan ||
                  !conHieuLuc ||
                  !coc.data ||
                  !['CHO_THANH_TOAN', 'THAT_BAI'].includes(coc.data.trang_thai)
                }
                daXuLy={(phanHoi) => {
                  datKetQuaCoc(phanHoi);
                  void lamMoiThamGia(phien.id);
                }}
              >
                <p>
                  Tiền cọc: <strong>{tien(phien.so_tien_dat_coc)}</strong>
                </p>
                <p>Khoản cọc này dành riêng cho phiên #{phien.id}.</p>
              </ThanhToanMoPhong>
            </section>
          )}
          {!duCoc && conHieuLuc && (
            <Alert type="warning" title="Hoàn tất đặt cọc để mở thao tác trả giá" />
          )}
          <DatGia phien={phien} khoa={!duocMua || !duCoc} />
          <MuaNgay
            phien={phien}
            coc={coc.data || null}
            diaChi={diaChiNhan}
            nguoiDung={nguoiDung}
            khoa={!duocMua}
          />
        </div>
      </ChoDuLieu>
    </ChoDuLieu>
  );
}

export default function ThamGiaPhien({ phien }: { phien: Phien }) {
  const { nguoiDung, dangKhoiTao } = usePhienDangNhap();

  if (dangKhoiTao) {
    return <Skeleton active />;
  }
  if (!nguoiDung) {
    return (
      <Link className="nut-vang" to={`/dang-nhap?tiep=${encodeURIComponent(`/phien/${phien.id}`)}`}>
        Đăng nhập để tham gia
      </Link>
    );
  }
  if (nguoiDung.vai_tro !== 'NGUOI_DUNG' || nguoiDung.trang_thai_tai_khoan !== 'HOAT_DONG') {
    return <Alert type="info" title="Tài khoản này không có quyền tham gia mua hoặc đấu giá" />;
  }
  if (String(nguoiDung.id) === String(phien.nguoi_ban_id)) {
    return (
      <Alert
        type="info"
        title="Đây là phiên của bạn"
        description={<Link to={`/nguoi-ban/phien/${phien.id}`}>Mở trang quản lý phiên →</Link>}
      />
    );
  }

  return (
    <ThaoTacNguoiMua key={`${phien.id}:${nguoiDung.id}`} phien={phien} nguoiDung={nguoiDung} />
  );
}
