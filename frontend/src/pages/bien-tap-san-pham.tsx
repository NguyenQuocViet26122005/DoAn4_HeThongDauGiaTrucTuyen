import { useEffect, useState } from 'react';
import { Alert, App, Button, Form, Input, Result, Select } from 'antd';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChoDuLieu, TieuDe, TrangThai } from '../components/dung-chung';
import QuyenNguoiBan from '../components/quyen-nguoi-ban';
import ThuocTinhSanPham from '../components/thuoc-tinh-san-pham';
import AnhSanPhamNguoiBan from '../components/anh-san-pham-nguoi-ban';
import { useDuLieu } from '../hooks/su-dung-du-lieu';
import { usePhienDangNhap } from '../store/phien-dang-nhap';
import { boNho, loiDeDoc } from '../services/api';
import { capNhatSanPham, guiDuyetSanPham, luuSanPham } from '../services/san-pham';
import type { DanhMuc, SanPham } from '../types/du-lieu';
import type { BieuMauSanPham, ThuocTinhDanhMuc } from '../types/san-pham';
import { nhan } from '../utils/dinh-dang';

function BieuMauBienTap({
  sanPham,
  lamMoi,
}: {
  sanPham?: SanPham;
  lamMoi: () => Promise<unknown>;
}) {
  const { message, modal } = App.useApp();
  const diDen = useNavigate();
  const [bieuMau] = Form.useForm<BieuMauSanPham>();
  const [dangXuLy, datDangXuLy] = useState(false);
  const [chuaLuu, datChuaLuu] = useState(false);
  const [soAnhCho, datSoAnhCho] = useState(0);
  const [loi, datLoi] = useState('');
  const danhMuc = useDuLieu<DanhMuc[]>('/categories');
  const danhMucId = Form.useWatch('danh_muc_id', bieuMau) || sanPham?.danh_muc_id;
  const thuocTinh = useDuLieu<ThuocTinhDanhMuc[]>(
    `/categories/${danhMucId}/attributes`,
    undefined,
    !!danhMucId,
  );
  const coTheSua = !sanPham || sanPham.co_the_sua === true;
  const canLuu = chuaLuu || soAnhCho > 0 || dangXuLy;
  const batBuocKiemDinh =
    sanPham?.bat_buoc_kiem_dinh ||
    danhMuc.data?.find((muc) => String(muc.id) === String(danhMucId))?.yeu_cau_kiem_dinh;
  const thieuThuocTinh = thuocTinh.data?.filter(
    (muc) =>
      muc.bat_buoc &&
      !sanPham?.thuoc_tinh.some(
        (t) => String(t.thuoc_tinh_id) === String(muc.id) && t.gia_tri.trim(),
      ),
  );

  useEffect(() => {
    if (!canLuu) {
      return;
    }

    const canhBao = (suKien: BeforeUnloadEvent) => suKien.preventDefault();

    window.addEventListener('beforeunload', canhBao);

    return () => window.removeEventListener('beforeunload', canhBao);
  }, [canLuu]);

  async function luu(duLieu: BieuMauSanPham) {
    datDangXuLy(true);
    datLoi('');

    try {
      const ketQua = await luuSanPham(sanPham?.id, duLieu, thuocTinh.data || []);

      capNhatSanPham(ketQua);
      datChuaLuu(false);
      message.success('Đã lưu bản nháp');
      if (!sanPham) {
        diDen(`/nguoi-ban/san-pham/${ketQua.id}`, { replace: true });
      }
    } catch (loi) {
      datLoi(loiDeDoc(loi));
    } finally {
      datDangXuLy(false);
    }
  }

  async function guiDuyet() {
    if (!sanPham) {
      return;
    }
    datDangXuLy(true);
    datLoi('');

    try {
      const ketQua = await guiDuyetSanPham(sanPham.id);

      capNhatSanPham(ketQua);
      message.success('Đã gửi sản phẩm đến quản trị viên');
    } catch (loi) {
      datLoi(loiDeDoc(loi));
    } finally {
      datDangXuLy(false);
    }
  }

  function quayLai() {
    if (canLuu) {
      modal.confirm({
        title: 'Rời trang khi còn nội dung chưa lưu?',
        content: 'Các trường chưa lưu và ảnh đang chờ sẽ không được giữ lại.',
        okText: 'Rời trang',
        cancelText: 'Tiếp tục chỉnh sửa',
        onOk: () => diDen('/nguoi-ban/san-pham'),
      });

      return;
    }
    diDen('/nguoi-ban/san-pham');
  }

  return (
    <div className="bien-tap-san-pham">
      <Button type="text" className="quay-lai-san-pham" disabled={dangXuLy} onClick={quayLai}>
        ← Sản phẩm của tôi
      </Button>
      <TieuDe
        nhanNho={sanPham ? `SẢN PHẨM #${sanPham.id}` : 'BẮT ĐẦU ĐĂNG BÁN'}
        ten={sanPham ? 'Chi tiết sản phẩm' : 'Thêm sản phẩm'}
        moTa="Mô tả trung thực để người mua hiểu rõ món đồ của bạn."
      >
        {sanPham && <TrangThai giaTri={sanPham.trang_thai_duyet} />}
      </TieuDe>
      {sanPham?.ly_do_tu_choi && (
        <Alert type="warning" showIcon title="Lý do từ chối" description={sanPham.ly_do_tu_choi} />
      )}
      {!coTheSua && (
        <Alert
          type="info"
          showIcon
          title="Sản phẩm đang ở chế độ xem"
          description={sanPham?.ly_do_khong_the_sua}
        />
      )}
      {loi && <Alert type="error" showIcon title={loi} />}
      <div className="cot-bien-tap-san-pham">
        <div className="cac-buoc-san-pham">
          <section className="tam-noi-dung">
            <h2>01. Thông tin sản phẩm</h2>
            <Form<BieuMauSanPham>
              form={bieuMau}
              layout="vertical"
              disabled={!coTheSua || dangXuLy}
              initialValues={
                sanPham
                  ? {
                      ...sanPham,
                      danh_muc_id: String(sanPham.danh_muc_id),
                      gia_tri: Object.fromEntries(
                        sanPham.thuoc_tinh.map((t) => [
                          String(t.thuoc_tinh_id),
                          t.kieu_nhap === 'DUNG_SAI'
                            ? String(['1', 'true'].includes(t.gia_tri))
                            : t.gia_tri,
                        ]),
                      ),
                    }
                  : { tinh_trang_san_pham: 'DA_QUA_SU_DUNG_TOT' }
              }
              onValuesChange={(thayDoi) => {
                datChuaLuu(true);
                if ('danh_muc_id' in thayDoi) {
                  bieuMau.setFieldValue('gia_tri', {});
                }
              }}
              onFinish={luu}
              scrollToFirstError
            >
              <Form.Item
                name="tieu_de"
                label="Tên sản phẩm"
                rules={[
                  {
                    required: true,
                    whitespace: true,
                    message: 'Vui lòng nhập tên sản phẩm',
                  },
                  { max: 200, message: 'Tối đa 200 ký tự' },
                ]}
              >
                <Input
                  maxLength={200}
                  showCount
                  placeholder="Ví dụ: Đồng hồ Seiko Presage, mặt xanh"
                />
              </Form.Item>
              <div className="luoi-truong-san-pham">
                <Form.Item
                  name="danh_muc_id"
                  label="Danh mục"
                  rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
                >
                  <Select
                    placeholder="Chọn danh mục"
                    loading={danhMuc.isPending}
                    showSearch
                    optionFilterProp="label"
                    options={danhMuc.data?.map((muc) => ({
                      value: String(muc.id),
                      label: muc.ten,
                    }))}
                  />
                </Form.Item>
                <Form.Item
                  name="tinh_trang_san_pham"
                  label="Tình trạng"
                  rules={[{ required: true, message: 'Vui lòng chọn tình trạng' }]}
                >
                  <Select
                    options={[
                      'MOI',
                      'NHU_MOI',
                      'DA_QUA_SU_DUNG_TOT',
                      'DA_QUA_SU_DUNG',
                      'LAY_LINH_KIEN',
                    ].map((value) => ({ value, label: nhan(value) }))}
                  />
                </Form.Item>
              </div>
              {danhMuc.isError && (
                <Alert
                  type="error"
                  title="Chưa tải được danh mục"
                  action={<Button onClick={() => void danhMuc.refetch()}>Thử lại</Button>}
                />
              )}
              <Form.Item
                name="thuong_hieu"
                label="Thương hiệu"
                rules={[{ max: 100, message: 'Tối đa 100 ký tự' }]}
              >
                <Input maxLength={100} placeholder="Nếu có" />
              </Form.Item>
              <Form.Item
                name="mo_ta"
                label="Mô tả chi tiết"
                rules={[
                  {
                    required: true,
                    whitespace: true,
                    message: 'Vui lòng mô tả sản phẩm',
                  },
                  { max: 20000, message: 'Tối đa 20.000 ký tự' },
                ]}
                extra="Nêu nguồn gốc, thời gian sử dụng, phụ kiện đi kèm và khuyết điểm. Không đưa thông tin liên hệ hoặc giấy tờ cá nhân vào ảnh/mô tả công khai."
              >
                <Input.TextArea
                  rows={7}
                  maxLength={20000}
                  showCount
                  placeholder="Kể rõ tình trạng và những điểm đặc biệt của sản phẩm…"
                />
              </Form.Item>
              <h3>Thuộc tính theo danh mục</h3>
              {danhMucId ? (
                <ChoDuLieu truyVan={thuocTinh}>
                  {thuocTinh.data?.length ? (
                    <ThuocTinhSanPham key={String(danhMucId)} danhSach={thuocTinh.data} />
                  ) : (
                    <p>Danh mục này chưa yêu cầu thêm thuộc tính.</p>
                  )}
                </ChoDuLieu>
              ) : (
                <p>Chọn danh mục để xem các thông tin cần bổ sung.</p>
              )}
              {coTheSua && (
                <div className="nut-luu-san-pham">
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={dangXuLy}
                    disabled={
                      !danhMucId || thuocTinh.isPending || thuocTinh.isError || danhMuc.isError
                    }
                  >
                    Lưu bản nháp
                  </Button>
                  <span role="status">
                    {chuaLuu
                      ? 'Có thay đổi chưa lưu'
                      : sanPham
                        ? 'Thông tin đã lưu'
                        : 'Lưu trước để thêm ảnh'}
                  </span>
                </div>
              )}
            </Form>
          </section>
          {sanPham ? (
            <AnhSanPhamNguoiBan
              sanPhamId={sanPham.id}
              danhSach={sanPham.hinh_anh}
              coTheSua={coTheSua}
              dangXuLy={dangXuLy}
              datDangXuLy={datDangXuLy}
              datSoAnhCho={datSoAnhCho}
              lamMoi={lamMoi}
            />
          ) : (
            <section className="tam-noi-dung">
              <h2>02. Hình ảnh sản phẩm</h2>
              <p>Sau khi lưu bản nháp, bạn có thể tải ảnh thật từ máy tính và chọn ảnh đại diện.</p>
            </section>
          )}
        </div>
        <aside className="kiem-tra-gui-duyet tam-noi-dung">
          <span className="nhan-nho">TRƯỚC KHI ĐĂNG BÁN</span>
          <h2>Sẵn sàng gửi duyệt?</h2>
          <ul>
            <li>Lưu đầy đủ tên, mô tả và tình trạng.</li>
            <li>Thêm ít nhất một ảnh thật, tối đa 12 ảnh.</li>
            <li>Điền các thuộc tính bắt buộc của danh mục.</li>
          </ul>
          <p>Sản phẩm chỉ được tạo phiên đấu giá sau khi quản trị viên duyệt.</p>
          {!!batBuocKiemDinh && (
            <Alert
              type="info"
              showIcon
              title="Sản phẩm cần kiểm định"
              description="Quản trị viên sẽ kiểm tra hồ sơ và hướng dẫn gửi hàng về trung tâm. Ảnh sản phẩm không thay thế kết quả kiểm định."
            />
          )}
          {coTheSua && (
            <>
              {!!thieuThuocTinh?.length && (
                <p className="nhac-gui-duyet">
                  Còn thiếu: {thieuThuocTinh.map((t) => t.ten_thuoc_tinh).join(', ')}.
                </p>
              )}
              <Button
                block
                type="primary"
                size="large"
                disabled={
                  !sanPham ||
                  canLuu ||
                  !sanPham.hinh_anh.length ||
                  thuocTinh.isPending ||
                  thuocTinh.isError ||
                  !!thieuThuocTinh?.length
                }
                onClick={() =>
                  modal.confirm({
                    title: 'Gửi sản phẩm để xét duyệt?',
                    content:
                      'Thông tin và ảnh đã lưu sẽ được gửi đến quản trị viên. Bạn không thể chỉnh sửa trong thời gian chờ duyệt.',
                    okText: 'Gửi duyệt',
                    cancelText: 'Kiểm tra lại',
                    onOk: guiDuyet,
                  })
                }
              >
                Gửi duyệt sản phẩm
              </Button>
              {canLuu && (
                <small className="nhac-gui-duyet">
                  Lưu thay đổi và tải hoặc bỏ chọn ảnh đang chờ trước khi gửi duyệt.
                </small>
              )}
            </>
          )}
          <Link to="/huong-dan#nguoi-ban">Xem hướng dẫn bán hàng ↗</Link>
        </aside>
      </div>
    </div>
  );
}

function SanPhamDaLuu({ id }: { id: string }) {
  const truyVan = useDuLieu<SanPham>(`/products/${id}`);
  const nguoiDung = usePhienDangNhap((s) => s.nguoiDung);

  async function lamMoi() {
    await boNho.invalidateQueries({ queryKey: ['/products/mine'] });

    return truyVan.refetch();
  }

  return (
    <ChoDuLieu truyVan={{ ...truyVan, isError: truyVan.isError && !truyVan.data }}>
      {truyVan.isError && truyVan.data && (
        <Alert
          type="warning"
          title="Chưa cập nhật được dữ liệu mới nhất"
          action={<Button onClick={() => void truyVan.refetch()}>Thử lại</Button>}
        />
      )}
      {truyVan.data &&
        (String(truyVan.data.nguoi_ban_id) === String(nguoiDung?.id) ? (
          <BieuMauBienTap key={id} sanPham={truyVan.data} lamMoi={lamMoi} />
        ) : (
          <Result status="403" title="Sản phẩm không thuộc tài khoản của bạn" />
        ))}
    </ChoDuLieu>
  );
}

export default function BienTapSanPham() {
  const { id } = useParams();

  return (
    <QuyenNguoiBan>
      {id ? (
        <SanPhamDaLuu key={id} id={id} />
      ) : (
        <BieuMauBienTap key="moi" lamMoi={async () => {}} />
      )}
    </QuyenNguoiBan>
  );
}
