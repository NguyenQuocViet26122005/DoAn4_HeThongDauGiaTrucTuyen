import { useState } from 'react';
import { Button, Form, Input, InputNumber, Select } from 'antd';
import { Link, useSearchParams } from 'react-router-dom';
import { ChoDuLieu, PhanTrang, TieuDe, TrangThai } from '../components/dung-chung';
import BieuMauThaoTac from '../components/bieu-mau-thao-tac';
import { useDuLieu } from '../hooks/su-dung-du-lieu';
import { boNho, gui } from '../services/api';
import { ngayGio, nhan } from '../utils/dinh-dang';

const loaiViPham = {
  KHONG_THANH_TOAN: 'Không thanh toán',
  GIAO_HANG_MUON: 'Giao hàng muộn',
  TU_DAU_GIA: 'Tự đấu giá',
  GIAN_LAN: 'Gian lận',
  LAM_DUNG: 'Lạm dụng',
  KHAC: 'Khác',
};
const hinhThucXuLy = {
  CHUA_XU_LY: 'Chưa xử lý',
  CANH_CAO: 'Cảnh cáo',
  TAM_NGUNG: 'Tạm ngừng tài khoản',
  KHOA_TAI_KHOAN: 'Khóa tài khoản',
  KHONG_VI_PHAM: 'Không vi phạm',
};

interface ViPham {
  id: string;
  nguoi_dung_id: string;
  phien_dau_gia_id: string | null;
  don_hang_id: string | null;
  loai_vi_pham: keyof typeof loaiViPham;
  mo_ta: string;
  diem_vi_pham: number;
  trang_thai: string;
  hinh_thuc_xu_ly: keyof typeof hinhThucXuLy;
  ly_do_xu_ly: string | null;
  ngay_tao: string;
  ngay_xu_ly: string | null;
  tieu_de_san_pham?: string | null;
}

interface BaoCaoSanPham {
  id: string;
  phien_dau_gia_id: string;
  mo_ta: string;
  trang_thai: string;
  ly_do_xu_ly: string | null;
  ngay_tao: string;
  ngay_xu_ly: string | null;
  tieu_de_san_pham: string;
}

async function lamMoi() {
  await boNho.invalidateQueries({
    predicate: ({ queryKey }) =>
      ['/admin/violations', '/violations/me', '/admin/users', '/notifications'].includes(
        String(queryKey[0]),
      ),
  });
}

function TaoViPham({ nguoiDungId }: { nguoiDungId: string }) {
  return (
    <BieuMauThaoTac<{
      nguoi_dung_id: string;
      loai_vi_pham: keyof typeof loaiViPham;
      mo_ta: string;
      diem_vi_pham: number;
      don_hang_id?: string;
      phien_dau_gia_id?: string;
    }>
      ten="Ghi nhận vi phạm"
      banDau={{ nguoi_dung_id: nguoiDungId || undefined, diem_vi_pham: 1 }}
      xacNhan={(giaTri) => (
        <>
          <p>
            Ghi nhận {loaiViPham[giaTri.loai_vi_pham]} cho tài khoản #{giaTri.nguoi_dung_id}?
          </p>
          <p>{giaTri.mo_ta}</p>
          <p>Điểm: {giaTri.diem_vi_pham}. Hồ sơ chờ xét duyệt, chưa tự khóa tài khoản.</p>
        </>
      )}
      onGui={async (giaTri) => {
        await gui('/admin/violations', giaTri);
        await lamMoi();
      }}
    >
      {[
        ['nguoi_dung_id', 'Mã người dùng', true],
        ['phien_dau_gia_id', 'Mã phiên liên quan', false],
        ['don_hang_id', 'Mã đơn liên quan', false],
      ].map(([ten, nhanTruong, batBuoc]) => (
        <Form.Item
          key={String(ten)}
          name={String(ten)}
          label={String(nhanTruong)}
          rules={[
            { required: Boolean(batBuoc), message: 'Nhập mã người dùng.' },
            { pattern: /^[1-9]\d*$/, message: 'Nhập mã số nguyên dương.' },
          ]}
        >
          <Input inputMode="numeric" maxLength={20} />
        </Form.Item>
      ))}
      <Form.Item
        name="loai_vi_pham"
        label="Loại vi phạm"
        rules={[{ required: true, message: 'Chọn loại vi phạm.' }]}
      >
        <Select options={Object.entries(loaiViPham).map(([value, label]) => ({ value, label }))} />
      </Form.Item>
      <Form.Item name="diem_vi_pham" label="Điểm vi phạm" rules={[{ required: true }]}>
        <InputNumber min={1} max={100} precision={0} />
      </Form.Item>
      <Form.Item
        name="mo_ta"
        label="Nội dung"
        rules={[
          {
            required: true,
            whitespace: true,
            message: 'Nhập nội dung vi phạm.',
          },
        ]}
      >
        <Input.TextArea rows={4} maxLength={1000} showCount />
      </Form.Item>
    </BieuMauThaoTac>
  );
}

function XetViPham({ muc }: { muc: ViPham }) {
  const laBaoCaoSanPham = muc.mo_ta.startsWith('[BAO CAO SAN PHAM]');

  return (
    <BieuMauThaoTac<{ ket_qua: keyof typeof hinhThucXuLy; ly_do_xu_ly: string }>
      ten="Xét vi phạm"
      xacNhan={(giaTri) => (
        <>
          <p>
            {laBaoCaoSanPham ? 'Báo cáo sản phẩm' : `Vi phạm #${muc.id}`} · Tài khoản #
            {muc.nguoi_dung_id}: {hinhThucXuLy[giaTri.ket_qua]}.
          </p>
          <p>{giaTri.ly_do_xu_ly}</p>
          <p>Quyết định được ghi nhận ngay sau khi xác nhận.</p>
        </>
      )}
      onGui={async (giaTri) => {
        await gui(
          `/admin/violations/${muc.id}/review`,
          {
            trang_thai: giaTri.ket_qua === 'KHONG_VI_PHAM' ? 'DA_HUY' : 'DA_XAC_NHAN',
            hinh_thuc_xu_ly: giaTri.ket_qua,
            ly_do_xu_ly: giaTri.ly_do_xu_ly,
          },
          'patch',
        );
        await lamMoi();
      }}
    >
      <Form.Item
        name="ket_qua"
        label="Quyết định"
        rules={[{ required: true, message: 'Chọn quyết định.' }]}
      >
        <Select
          options={Object.entries(hinhThucXuLy)
            .filter(([khoa]) => khoa !== 'CHUA_XU_LY')
            .map(([value, label]) => ({ value, label }))}
        />
      </Form.Item>
      <Form.Item
        name="ly_do_xu_ly"
        label="Lý do xử lý"
        rules={[
          {
            required: true,
            whitespace: true,
            message: 'Nhập lý do quyết định.',
          },
        ]}
      >
        <Input.TextArea rows={4} maxLength={1000} showCount />
      </Form.Item>
    </BieuMauThaoTac>
  );
}

function BaoCaoSanPhamDaGui() {
  const [trang, datTrang] = useState(1);
  const truyVan = useDuLieu<BaoCaoSanPham[]>('/product-reports/me', {
    page: trang,
    limit: 12,
  });

  return (
    <section className="khu-vuc">
      <div className="tieu-de-muc">
        <div>
          <h2>Báo cáo sản phẩm đã gửi</h2>
          <p className="chu-mo">Quản trị viên sẽ xem xét nội dung trước khi kết luận.</p>
        </div>
        <Button loading={truyVan.isFetching} onClick={() => void truyVan.refetch()}>
          Làm mới
        </Button>
      </div>
      <ChoDuLieu
        truyVan={truyVan}
        rong={truyVan.data?.length === 0}
        thongDiepRong="Bạn chưa gửi báo cáo sản phẩm nào."
      >
        {truyVan.data?.map((muc) => (
          <section className="tam-noi-dung" key={muc.id}>
            <h3>{muc.tieu_de_san_pham}</h3>
            <TrangThai giaTri={muc.trang_thai} />
            <p>{muc.mo_ta.replace(/^\[BAO CAO SAN PHAM\]\s*/, '')}</p>
            <p>Gửi lúc: {ngayGio(muc.ngay_tao)}</p>
            {muc.ly_do_xu_ly && <p>Kết quả: {muc.ly_do_xu_ly}</p>}
            {muc.ngay_xu_ly && <p>Đã xem xét: {ngayGio(muc.ngay_xu_ly)}</p>}
            <Link to={`/phien/${muc.phien_dau_gia_id}`}>Mở phiên liên quan ↗</Link>
          </section>
        ))}
      </ChoDuLieu>
      {!truyVan.isPending && !truyVan.isError && (
        <PhanTrang
          trang={trang}
          datTrang={datTrang}
          soLuong={truyVan.data?.length || 0}
          gioiHan={12}
        />
      )}
    </section>
  );
}

export default function ViPhamTaiKhoan({ quanTri = false }: { quanTri?: boolean }) {
  const [thamSo, datThamSo] = useSearchParams();
  const nguoiDungId = quanTri ? thamSo.get('nguoi_dung_id') || '' : '';

  return (
    <DanhSachViPham
      key={`${quanTri}:${nguoiDungId}`}
      quanTri={quanTri}
      nguoiDungId={nguoiDungId}
      xoaLoc={() => datThamSo({})}
    />
  );
}

function DanhSachViPham({
  quanTri,
  nguoiDungId,
  xoaLoc,
}: {
  quanTri: boolean;
  nguoiDungId: string;
  xoaLoc: () => void;
}) {
  const [trang, datTrang] = useState(1);
  const truyVan = useDuLieu<ViPham[]>(quanTri ? '/admin/violations' : '/violations/me', {
    page: trang,
    limit: 12,
    ...(nguoiDungId ? { nguoi_dung_id: nguoiDungId } : {}),
  });

  return (
    <>
      <TieuDe
        ten="Vi phạm"
        moTa="Theo dõi hồ sơ và quyết định xử lý. Điểm vi phạm không tự động khóa tài khoản."
      >
        <Button loading={truyVan.isFetching} onClick={() => void truyVan.refetch()}>
          Làm mới
        </Button>
        {quanTri && <TaoViPham nguoiDungId={nguoiDungId} />}
      </TieuDe>
      {nguoiDungId && (
        <p>
          Đang xem tài khoản #{nguoiDungId}. <Button onClick={xoaLoc}>Xem tất cả</Button>
        </p>
      )}
      {!quanTri && <BaoCaoSanPhamDaGui />}
      <ChoDuLieu
        truyVan={truyVan}
        rong={truyVan.data?.length === 0}
        thongDiepRong="Chưa có hồ sơ vi phạm."
      >
        {truyVan.data?.map((muc) => (
          <section className="tam-noi-dung" key={muc.id}>
            <h2>
              #{muc.id} ·{' '}
              {muc.mo_ta.startsWith('[BAO CAO SAN PHAM]')
                ? 'Báo cáo sản phẩm'
                : loaiViPham[muc.loai_vi_pham] || nhan(muc.loai_vi_pham)}
            </h2>
            <TrangThai giaTri={muc.trang_thai} />
            {quanTri && <p>Tài khoản #{muc.nguoi_dung_id}</p>}
            {muc.tieu_de_san_pham && <p>Sản phẩm: {muc.tieu_de_san_pham}</p>}
            <p>{muc.mo_ta.replace(/^\[BAO CAO SAN PHAM\]\s*/, '')}</p>
            <p>
              {muc.mo_ta.startsWith('[BAO CAO SAN PHAM]') ? 'Điểm sau khi xác nhận' : 'Điểm'}:{' '}
              {muc.diem_vi_pham} · Ghi nhận: {ngayGio(muc.ngay_tao)}
            </p>
            {muc.phien_dau_gia_id && (
              <p>
                <Link to={`/phien/${muc.phien_dau_gia_id}`}>Phiên #{muc.phien_dau_gia_id}</Link>
              </p>
            )}
            {muc.don_hang_id && (
              <p>
                <Link to={`/${quanTri ? 'quan-tri' : 'tai-khoan'}/don-hang/${muc.don_hang_id}`}>
                  Đơn #{muc.don_hang_id}
                </Link>
              </p>
            )}
            <p>{hinhThucXuLy[muc.hinh_thuc_xu_ly] || nhan(muc.hinh_thuc_xu_ly)}</p>
            {muc.ly_do_xu_ly && (
              <p>
                {muc.ly_do_xu_ly} · {ngayGio(muc.ngay_xu_ly)}
              </p>
            )}
            {quanTri && muc.hinh_thuc_xu_ly === 'CHUA_XU_LY' && <XetViPham muc={muc} />}
          </section>
        ))}
      </ChoDuLieu>
      {!truyVan.isPending && !truyVan.isError && (
        <PhanTrang
          trang={trang}
          datTrang={datTrang}
          soLuong={truyVan.data?.length || 0}
          gioiHan={12}
        />
      )}
    </>
  );
}
