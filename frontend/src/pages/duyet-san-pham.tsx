import { useState } from 'react';
import { Alert, App, Button, Descriptions, Form, Input, Modal, Select, Tag } from 'antd';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AnhSanPham, ChoDuLieu, PhanTrang, TieuDe, TrangThai } from '../components/dung-chung';
import { useDuLieu, useDanhSachDuLieu } from '../hooks/su-dung-du-lieu';
import { gui, loiDeDoc } from '../services/api';
import { lamMoiDuyetVaKiemDinh, moHoSo } from '../services/kiem-dinh';
import type { DanhMuc, SanPham } from '../types/du-lieu';
import type { SanPhamTrongDanhSach } from '../types/san-pham';
import { ngayGio, nhan } from '../utils/dinh-dang';

export default function DuyetSanPham() {
  const [thamSo, datThamSo] = useSearchParams();
  const trang = Math.max(1, Number(thamSo.get('page')) || 1);
  const tuKhoa = thamSo.get('q') || '';
  const trangThai = thamSo.get('trang_thai') || 'CHO_XU_LY';
  const danhMuc = useDuLieu<DanhMuc[]>('/admin/categories');
  const sanPham = useDanhSachDuLieu<SanPhamTrongDanhSach[]>('/admin/products', {
    page: trang,
    limit: 12,
    q: tuKhoa,
    trang_thai: trangThai === 'TAT_CA' ? undefined : trangThai,
    danh_muc_id: thamSo.get('danh_muc_id') || undefined,
  });

  function loc(ten: string, giaTri?: string) {
    const moi = new URLSearchParams(thamSo);

    moi.delete('page');
    if (giaTri) {
      moi.set(ten, giaTri);
    } else {
      moi.delete(ten);
    }
    datThamSo(moi);
  }

  return (
    <>
      <TieuDe
        nhanNho="KIỂM SOÁT CHẤT LƯỢNG"
        ten="Duyệt sản phẩm"
        moTa="Xem nội dung, hình ảnh và hồ sơ kiểm định trước khi cho phép đưa sản phẩm lên sàn."
      />
      <div className="lo-trinh-san-pham">
        <span>
          <b>01</b> Xem hồ sơ
        </span>
        <span>
          <b>02</b> Kiểm định nếu cần
        </span>
        <span>
          <b>03</b> Quyết định duyệt
        </span>
        <span>
          <b>04</b> Người bán tạo phiên
        </span>
      </div>
      <div className="bo-loc-san-pham">
        <Input.Search
          key={tuKhoa}
          defaultValue={tuKhoa}
          maxLength={100}
          allowClear
          aria-label="Tìm sản phẩm cần duyệt"
          placeholder="Tìm tên sản phẩm…"
          onSearch={(giaTri) => loc('q', giaTri.trim())}
        />
        <Select
          aria-label="Trạng thái duyệt"
          value={trangThai}
          onChange={(giaTri) => loc('trang_thai', giaTri)}
          options={[
            { value: 'TAT_CA', label: 'Tất cả trạng thái' },
            ...['CHO_XU_LY', 'DA_DUYET', 'TU_CHOI', 'BAN_NHAP', 'LUU_TRU'].map((value) => ({
              value,
              label: nhan(value),
            })),
          ]}
        />
        <Select
          aria-label="Danh mục sản phẩm"
          placeholder="Tất cả danh mục"
          allowClear
          value={thamSo.get('danh_muc_id') || undefined}
          loading={danhMuc.isPending}
          onChange={(giaTri) => loc('danh_muc_id', giaTri)}
          options={danhMuc.data?.map((muc) => ({ value: String(muc.id), label: muc.ten }))}
        />
        <Button onClick={() => datThamSo({})}>Chờ xử lý</Button>
      </div>
      <ChoDuLieu
        truyVan={sanPham}
        rong={sanPham.data?.length === 0}
        thongDiepRong="Không có sản phẩm phù hợp với bộ lọc này."
      >
        <div className="danh-sach-san-pham-ban">
          {sanPham.data?.map((muc) => (
            <article className="dong-san-pham-ban" key={muc.id}>
              <Link to={`/quan-tri/san-pham/${muc.id}`} aria-label={`Xem ${muc.tieu_de}`}>
                <AnhSanPham src={muc.anh_chinh} ten={muc.tieu_de} />
              </Link>
              <div className="thong-tin-san-pham-ban">
                <small>
                  #{muc.id} · Người bán #{muc.nguoi_ban_id}
                </small>
                <h2>
                  <Link to={`/quan-tri/san-pham/${muc.id}`}>{muc.tieu_de}</Link>
                </h2>
                <p>{ngayGio(muc.ngay_tao)}</p>
              </div>
              <div className="hanh-dong-san-pham-ban">
                <TrangThai giaTri={muc.trang_thai_duyet} />
                <Link to={`/quan-tri/san-pham/${muc.id}`}>Xem & xét duyệt ↗</Link>
              </div>
            </article>
          ))}
        </div>
      </ChoDuLieu>
      {!sanPham.isPending && !sanPham.isError && (
        <PhanTrang
          trang={trang}
          datTrang={(so) => loc('page', String(so))}
          soLuong={sanPham.data?.length || 0}
          coTrangSau={sanPham.coTrangSau}
          dangTai={sanPham.isFetching}
        />
      )}
    </>
  );
}

function QuyetDinhSanPham({ sanPham }: { sanPham: SanPham }) {
  const { message, modal } = App.useApp();
  const chuyenTrang = useNavigate();
  const [dangLuu, datDangLuu] = useState(false);
  const [loi, datLoi] = useState('');
  const [moTuChoi, datMoTuChoi] = useState(false);
  const hoSo = sanPham.kiem_dinh_moi_nhat;
  const canKiemDinh = Boolean(sanPham.bat_buoc_kiem_dinh);
  const duKiemDinh =
    !canKiemDinh ||
    Boolean(
      hoSo?.ket_qua === 'DAT' &&
      hoSo.trang_thai === 'DANG_LUU_GIU' &&
      !hoSo.ngay_roi_trung_tam &&
      hoSo.co_bao_cao,
    );

  async function thucHien(congViec: () => Promise<void>) {
    datDangLuu(true);
    datLoi('');
    try {
      await congViec();
      await lamMoiDuyetVaKiemDinh();
    } catch (loi) {
      datLoi(loiDeDoc(loi));
    } finally {
      datDangLuu(false);
    }
  }

  async function duyet(trangThai: string, lyDo?: string) {
    await thucHien(async () => {
      await gui(
        `/admin/products/${sanPham.id}/review`,
        {
          trang_thai_duyet: trangThai,
          ...(lyDo ? { ly_do_tu_choi: lyDo.trim() } : {}),
        },
        'patch',
      );
      datMoTuChoi(false);
      message.success(trangThai === 'DA_DUYET' ? 'Đã duyệt sản phẩm' : 'Đã gửi lý do từ chối');
    });
  }

  return (
    <aside className="tam-noi-dung kiem-tra-gui-duyet">
      <span className="nhan-nho">KẾT QUẢ XÉT DUYỆT</span>
      <h2>Kiểm tra trước khi duyệt</h2>
      <TrangThai giaTri={sanPham.trang_thai_duyet} />
      <p>
        {canKiemDinh
          ? 'Sản phẩm này bắt buộc kiểm định đạt và được trung tâm lưu giữ.'
          : 'Sản phẩm này không bắt buộc kiểm định theo chính sách đã lưu.'}
      </p>
      {hoSo && (
        <>
          <p>
            Lần kiểm định {hoSo.lan_kiem_dinh}: <strong>{nhan(hoSo.trang_thai)}</strong>
          </p>
          <Link to={`/quan-tri/kiem-dinh/${hoSo.id}`}>Mở hồ sơ kiểm định ↗</Link>
        </>
      )}
      {sanPham.ly_do_tu_choi && (
        <Alert type="warning" title="Lý do từ chối" description={sanPham.ly_do_tu_choi} />
      )}
      {loi && <Alert type="error" showIcon title={loi} />}
      {sanPham.trang_thai_duyet === 'CHO_XU_LY' ? (
        <div className="cac-nut-kiem-dinh">
          {canKiemDinh && (!hoSo || hoSo.trang_thai === 'DA_TRA_NGUOI_BAN') && (
            <Button
              loading={dangLuu}
              onClick={() =>
                modal.confirm({
                  title: 'Mở hồ sơ kiểm định?',
                  content: 'Người bán sẽ nhận thông báo gửi đúng sản phẩm đến trung tâm.',
                  okText: 'Mở hồ sơ',
                  cancelText: 'Quay lại',
                  onOk: () =>
                    thucHien(async () => {
                      const moi = await moHoSo(sanPham.id);

                      message.success('Đã mở hồ sơ kiểm định');
                      chuyenTrang(`/quan-tri/kiem-dinh/${moi.id}`);
                    }),
                })
              }
            >
              Mở hồ sơ kiểm định
            </Button>
          )}
          {!duKiemDinh && <small className="chu-mo">Chưa đủ điều kiện kiểm định để duyệt.</small>}
          <Button
            type="primary"
            disabled={!duKiemDinh || dangLuu}
            onClick={() =>
              modal.confirm({
                title: 'Duyệt sản phẩm này?',
                content:
                  'Xác nhận nội dung và hình ảnh đã được kiểm tra. Kết quả kiểm định không thay thế việc duyệt nội dung.',
                okText: 'Duyệt sản phẩm',
                cancelText: 'Quay lại',
                onOk: () => duyet('DA_DUYET'),
              })
            }
          >
            Duyệt sản phẩm
          </Button>
          <Button danger disabled={dangLuu} onClick={() => datMoTuChoi(true)}>
            Từ chối và nêu lý do
          </Button>
        </div>
      ) : (
        <p>Chỉ xử lý sản phẩm đang chờ duyệt. Ngày xét duyệt: {ngayGio(sanPham.ngay_duyet)}.</p>
      )}
      <Modal
        open={moTuChoi}
        title="Lý do từ chối sản phẩm"
        onCancel={() => !dangLuu && datMoTuChoi(false)}
        footer={null}
        destroyOnHidden
        closable={!dangLuu}
        mask={{ closable: !dangLuu }}
      >
        <Form
          layout="vertical"
          disabled={dangLuu}
          onFinish={({ ly_do }) => duyet('TU_CHOI', ly_do)}
        >
          <Form.Item
            name="ly_do"
            label="Nội dung cần người bán chỉnh sửa"
            rules={[
              {
                required: true,
                whitespace: true,
                message: 'Vui lòng nêu lý do từ chối',
              },
            ]}
          >
            <Input.TextArea rows={4} maxLength={500} showCount />
          </Form.Item>
          {loi && <Alert type="error" title={loi} />}
          <Button danger type="primary" htmlType="submit" loading={dangLuu}>
            Xác nhận từ chối
          </Button>
        </Form>
      </Modal>
    </aside>
  );
}

export function ChiTietDuyetSanPham() {
  const { id = '' } = useParams();
  const sanPham = useDuLieu<SanPham>(`/products/${id}`);

  return (
    <>
      <Link className="link-vang quay-lai-kiem-dinh" to="/quan-tri/san-pham">
        ← Danh sách sản phẩm
      </Link>
      <ChoDuLieu truyVan={sanPham}>
        {sanPham.data && (
          <>
            <TieuDe
              nhanNho={`SẢN PHẨM #${sanPham.data.id}`}
              ten={sanPham.data.tieu_de}
              moTa={`Hồ sơ gửi bởi người bán #${sanPham.data.nguoi_ban_id}`}
            />
            <div className="cot-bien-tap-san-pham">
              <div className="cac-buoc-san-pham">
                <section className="tam-noi-dung">
                  <h2>Thông tin & mô tả</h2>
                  <Descriptions
                    column={1}
                    items={[
                      {
                        key: 'tinh-trang',
                        label: 'Tình trạng',
                        children: nhan(sanPham.data.tinh_trang_san_pham),
                      },
                      {
                        key: 'hieu',
                        label: 'Thương hiệu',
                        children: sanPham.data.thuong_hieu || 'Chưa cung cấp',
                      },
                      ...sanPham.data.thuoc_tinh.map((muc) => ({
                        key: muc.thuoc_tinh_id,
                        label: muc.ten_thuoc_tinh,
                        children: `${muc.kieu_nhap === 'DUNG_SAI' ? (['true', '1'].includes(muc.gia_tri) ? 'Có' : 'Không') : muc.gia_tri} ${muc.don_vi || ''}`,
                      })),
                    ]}
                  />
                  <p className="van-ban-kiem-dinh">{sanPham.data.mo_ta}</p>
                </section>
                <section className="tam-noi-dung">
                  <h2>Hình ảnh sản phẩm</h2>
                  <div className="luoi-anh-nguoi-ban">
                    {sanPham.data.hinh_anh.map((anh, viTri) => (
                      <article key={anh.id}>
                        <AnhSanPham
                          src={anh.duong_dan_anh}
                          ten={`${sanPham.data.tieu_de} — ảnh ${viTri + 1}`}
                        />
                        {Boolean(anh.la_anh_chinh) && <Tag color="gold">Ảnh đại diện</Tag>}
                      </article>
                    ))}
                  </div>
                  {!sanPham.data.hinh_anh.length && (
                    <Alert type="warning" title="Sản phẩm chưa có ảnh" />
                  )}
                </section>
              </div>
              <QuyetDinhSanPham key={id} sanPham={sanPham.data} />
            </div>
          </>
        )}
      </ChoDuLieu>
    </>
  );
}
