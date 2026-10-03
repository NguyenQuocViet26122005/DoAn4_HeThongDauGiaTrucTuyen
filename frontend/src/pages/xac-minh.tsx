import { Alert, App, Button, Descriptions, Form, Input, Select } from 'antd';
import { useSearchParams } from 'react-router-dom';
import { ChoDuLieu, PhanTrang, TepRiengTu, TieuDe, TrangThai } from '../components/dung-chung';
import BieuMauThaoTac from '../components/bieu-mau-thao-tac';
import GuiXacMinh from '../components/gui-xac-minh';
import { useDuLieu } from '../hooks/su-dung-du-lieu';
import { usePhienDangNhap } from '../store/phien-dang-nhap';
import { boNho, doc, gui } from '../services/api';
import { ngayGio, nhan } from '../utils/dinh-dang';
import type { HoSoXacMinh } from '../types/xac-minh';
import type { NguoiDung } from '../types/du-lieu';

function HoSo({ hoSo, quanTri }: { hoSo: HoSoXacMinh; quanTri: boolean }) {
  const { message } = App.useApp();
  const lamMoi = () =>
    boNho.invalidateQueries({
      predicate: ({ queryKey }) =>
        ['/admin/seller-verifications', '/seller-verifications/me'].includes(String(queryKey[0])),
    });

  return (
    <article className="tam-noi-dung thong-tin-don">
      <TrangThai giaTri={hoSo.trang_thai} />
      <h2>
        Hồ sơ #{hoSo.id}
        {hoSo.ho_ten ? ` · ${hoSo.ho_ten}` : ''}
      </h2>
      <Descriptions
        column={1}
        items={[
          ...(hoSo.email
            ? [
                {
                  key: 'email',
                  label: 'Email',
                  children: hoSo.email,
                },
              ]
            : []),
          {
            key: 'giay',
            label: 'Giấy tờ',
            children: `${nhan(hoSo.loai_giay_to)} · ${hoSo.so_giay_to}`,
          },
          {
            key: 'ngan-hang',
            label: 'Ngân hàng',
            children: hoSo.ten_ngan_hang,
          },
          {
            key: 'tai-khoan',
            label: 'Tài khoản',
            children: `${hoSo.so_tai_khoan} · ${hoSo.chu_tai_khoan}`,
          },
          {
            key: 'gui',
            label: 'Ngày gửi',
            children: ngayGio(hoSo.ngay_tao),
          },
          {
            key: 'duyet',
            label: 'Ngày xét duyệt',
            children: ngayGio(hoSo.ngay_duyet),
          },
        ]}
      />
      <div className="bo-loc-thong-bao">
        <TepRiengTu url={hoSo.anh_mat_truoc} ten="Xem mặt trước" />
        {hoSo.anh_mat_sau && <TepRiengTu url={hoSo.anh_mat_sau} ten="Xem mặt sau" />}
        <TepRiengTu url={hoSo.anh_selfie} ten="Xem ảnh chân dung" />
      </div>
      {hoSo.ly_do_tu_choi && (
        <Alert type="warning" title="Lý do từ chối" description={hoSo.ly_do_tu_choi} />
      )}
      {quanTri && hoSo.trang_thai === 'CHO_XU_LY' && (
        <div className="bo-loc-thong-bao">
          <BieuMauThaoTac<Record<string, never>>
            ten="Duyệt người bán"
            xacNhan={() => (
              <p>
                Xác nhận hồ sơ #{hoSo.id} hợp lệ và cấp quyền bán hàng cho {hoSo.ho_ten}.
              </p>
            )}
            onGui={async () => {
              try {
                await gui(
                  `/admin/seller-verifications/${hoSo.id}/review`,
                  { trang_thai: 'DA_XAC_MINH' },
                  'patch',
                );
                message.success('Đã xác minh người bán');
              } finally {
                await lamMoi();
              }
            }}
          >
            <p>Đối chiếu giấy tờ, ảnh chân dung và thông tin tài khoản trước khi duyệt.</p>
          </BieuMauThaoTac>
          <BieuMauThaoTac<{ ly_do_tu_choi: string }>
            ten="Từ chối hồ sơ"
            xacNhan={(duLieu) => <p className="van-ban-dai">{duLieu.ly_do_tu_choi}</p>}
            onGui={async (duLieu) => {
              try {
                await gui(
                  `/admin/seller-verifications/${hoSo.id}/review`,
                  { ...duLieu, trang_thai: 'TU_CHOI' },
                  'patch',
                );
                message.success('Đã gửi lý do từ chối');
              } finally {
                await lamMoi();
              }
            }}
          >
            <Form.Item
              name="ly_do_tu_choi"
              label="Lý do từ chối"
              rules={[
                {
                  required: true,
                  whitespace: true,
                  message: 'Nhập lý do từ chối',
                },
              ]}
            >
              <Input.TextArea rows={4} maxLength={500} />
            </Form.Item>
          </BieuMauThaoTac>
        </div>
      )}
    </article>
  );
}

export default function XacMinh({ quanTri = false }: { quanTri?: boolean }) {
  const [thamSo, datThamSo] = useSearchParams();
  const trang = Math.max(1, Math.floor(Number(thamSo.get('page')) || 1));
  const trangThai = ['CHO_XU_LY', 'DA_XAC_MINH', 'TU_CHOI'].includes(thamSo.get('trang_thai') || '')
    ? thamSo.get('trang_thai')!
    : 'CHO_XU_LY';
  const truyVan = useDuLieu<HoSoXacMinh[]>(
    quanTri ? '/admin/seller-verifications' : '/seller-verifications/me',
    quanTri
      ? {
          page: trang,
          limit: 10,
          trang_thai: trangThai,
        }
      : undefined,
  );
  const { nguoiDung, capNhat } = usePhienDangNhap();
  const { message } = App.useApp();

  async function lamMoi() {
    await truyVan.refetch();
    if (!quanTri) {
      capNhat(await doc<NguoiDung>('/users/me'));
    }
  }

  return (
    <>
      <TieuDe
        ten="Xác minh người bán"
        moTa={
          quanTri
            ? 'Đối chiếu hồ sơ và quyết định quyền bán hàng.'
            : 'Nộp hồ sơ và theo dõi kết quả xét duyệt trước khi đăng bán.'
        }
      >
        <Button
          loading={truyVan.isFetching}
          onClick={() =>
            void lamMoi().catch(() => message.error('Chưa cập nhật được hồ sơ. Vui lòng thử lại.'))
          }
        >
          Làm mới
        </Button>
      </TieuDe>
      {quanTri && (
        <div className="bo-loc-thong-bao">
          <Select
            aria-label="Trạng thái xác minh"
            value={trangThai}
            options={[
              { value: 'CHO_XU_LY', label: 'Chờ xét duyệt' },
              { value: 'DA_XAC_MINH', label: 'Đã xác minh' },
              { value: 'TU_CHOI', label: 'Đã từ chối' },
            ]}
            onChange={(giaTri) => datThamSo({ trang_thai: giaTri })}
          />
        </div>
      )}
      {!quanTri && (
        <Alert
          type="info"
          title="Giấy tờ chỉ được xem bởi chính bạn và Admin"
          description="Hồ sơ xác minh không công khai trên trang sản phẩm."
        />
      )}
      {!quanTri &&
        nguoiDung?.vai_tro === 'NGUOI_DUNG' &&
        ['CHUA_DANG_KY', 'TU_CHOI'].includes(nguoiDung.trang_thai_nguoi_ban) && (
          <div className="bo-loc-thong-bao">
            <GuiXacMinh
              daGui={async () => {
                await lamMoi();
                message.success('Đã gửi hồ sơ, vui lòng chờ Admin xét duyệt');
              }}
            />
          </div>
        )}
      <ChoDuLieu truyVan={truyVan} rong={truyVan.data?.length === 0}>
        <div className="danh-sach-don">
          {truyVan.data?.map((hoSo) => (
            <HoSo key={hoSo.id} hoSo={hoSo} quanTri={quanTri} />
          ))}
        </div>
      </ChoDuLieu>
      {quanTri && !truyVan.isPending && !truyVan.isError && (
        <PhanTrang
          trang={trang}
          datTrang={(so) => datThamSo({ page: String(so), trang_thai: trangThai })}
          soLuong={truyVan.data?.length || 0}
          gioiHan={10}
        />
      )}
    </>
  );
}
