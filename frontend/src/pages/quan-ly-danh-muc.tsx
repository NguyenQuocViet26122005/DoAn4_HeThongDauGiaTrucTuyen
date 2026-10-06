import { useState } from 'react';
import { Button, Form, Input, InputNumber, Select, Switch } from 'antd';
import BieuMauThaoTac from '../components/bieu-mau-thao-tac';
import { ChoDuLieu, TieuDe } from '../components/dung-chung';
import { useDuLieu } from '../hooks/su-dung-du-lieu';
import { boNho, gui } from '../services/api';
import type { ThuocTinhDanhMuc } from '../types/san-pham';

interface DanhMucQuanTri {
  id: string;
  ten: string;
  danh_muc_cha_id: string | null;
  duong_dan: string;
  mo_ta: string | null;
  dang_hoat_dong: boolean | number;
  yeu_cau_kiem_dinh: boolean | number;
  thu_tu: number;
}
interface ThuocTinh extends ThuocTinhDanhMuc {
  khoa_thuoc_tinh: string;
  thu_tu: number;
}
type DuLieuDanhMuc = Omit<DanhMucQuanTri, 'id'>;
type DuLieuThuocTinh = Omit<ThuocTinh, 'id'>;

const cacKieu = {
  VAN_BAN: 'Văn bản',
  SO: 'Số',
  LUA_CHON: 'Danh sách lựa chọn',
  DUNG_SAI: 'Đúng / sai',
  NGAY: 'Ngày',
};

async function lamMoiDanhMuc(id?: string) {
  await Promise.all([
    boNho.invalidateQueries({ queryKey: ['/admin/categories'] }),
    boNho.invalidateQueries({ queryKey: ['/categories'] }),
    ...(id ? [boNho.invalidateQueries({ queryKey: [`/categories/${id}/attributes`] })] : []),
  ]);
}

function SuaDanhMuc({ muc, danhSach }: { muc?: DanhMucQuanTri; danhSach: DanhMucQuanTri[] }) {
  return (
    <BieuMauThaoTac<DuLieuDanhMuc>
      ten={muc ? 'Sửa danh mục' : 'Thêm danh mục'}
      banDau={
        muc
          ? {
              ten: muc.ten,
              danh_muc_cha_id: muc.danh_muc_cha_id == null ? null : String(muc.danh_muc_cha_id),
              duong_dan: muc.duong_dan,
              mo_ta: muc.mo_ta,
              thu_tu: muc.thu_tu,
              dang_hoat_dong: Boolean(muc.dang_hoat_dong),
              yeu_cau_kiem_dinh: Boolean(muc.yeu_cau_kiem_dinh),
            }
          : {
              danh_muc_cha_id: null,
              dang_hoat_dong: true,
              yeu_cau_kiem_dinh: false,
              thu_tu: 0,
            }
      }
      xacNhan={(giaTri) => (
        <>
          <p>
            VietBid chỉ nhận danh mục dành cho hàng hiếm, hàng sưu tầm hoặc tài sản có giá trị cao;
            không thêm hàng tiêu dùng phổ thông.
          </p>
          <p>
            Lưu danh mục “{giaTri.ten}” · {giaTri.dang_hoat_dong ? 'Đang sử dụng' : 'Ngừng sử dụng'}
            ?
          </p>
          <p>
            {giaTri.yeu_cau_kiem_dinh ? 'Yêu cầu kiểm định' : 'Không yêu cầu kiểm định'} khi gửi
            duyệt sản phẩm theo danh mục.
          </p>
        </>
      )}
      onGui={async (giaTri) => {
        await gui(
          muc ? `/admin/categories/${muc.id}` : '/admin/categories',
          { ...giaTri, danh_muc_cha_id: giaTri.danh_muc_cha_id ?? null },
          muc ? 'put' : 'post',
        );
        await lamMoiDanhMuc();
      }}
    >
      <Form.Item
        name="ten"
        label="Tên danh mục"
        rules={[
          {
            required: true,
            whitespace: true,
            message: 'Nhập tên danh mục.',
          },
        ]}
      >
        <Input maxLength={120} />
      </Form.Item>
      <Form.Item
        name="duong_dan"
        label="Tên trong đường dẫn"
        rules={[
          { required: true, message: 'Nhập tên đường dẫn.' },
          {
            pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
            message: 'Dùng chữ thường không dấu, số và gạch ngang.',
          },
        ]}
      >
        <Input maxLength={150} placeholder="dong-ho" />
      </Form.Item>
      <Form.Item name="danh_muc_cha_id" label="Danh mục cha">
        <Select
          allowClear
          placeholder="Không có danh mục cha"
          options={danhSach
            .filter((cha) => String(cha.id) !== String(muc?.id))
            .map((cha) => ({ value: String(cha.id), label: cha.ten }))}
        />
      </Form.Item>
      <Form.Item name="mo_ta" label="Mô tả">
        <Input.TextArea rows={3} maxLength={500} />
      </Form.Item>
      <Form.Item name="thu_tu" label="Thứ tự hiển thị" rules={[{ required: true }]}>
        <InputNumber min={0} precision={0} />
      </Form.Item>
      <Form.Item name="dang_hoat_dong" label="Sử dụng danh mục" valuePropName="checked">
        <Switch />
      </Form.Item>
      <Form.Item name="yeu_cau_kiem_dinh" label="Yêu cầu kiểm định" valuePropName="checked">
        <Switch />
      </Form.Item>
    </BieuMauThaoTac>
  );
}

function SuaThuocTinh({ muc, danhMucId }: { muc?: ThuocTinh; danhMucId: string }) {
  return (
    <BieuMauThaoTac<DuLieuThuocTinh>
      ten={muc ? `Sửa ${muc.ten_thuoc_tinh}` : 'Thêm thuộc tính'}
      banDau={
        muc
          ? {
              ten_thuoc_tinh: muc.ten_thuoc_tinh,
              khoa_thuoc_tinh: muc.khoa_thuoc_tinh,
              kieu_nhap: muc.kieu_nhap,
              don_vi: muc.don_vi,
              lua_chon_json: muc.lua_chon_json,
              bat_buoc: Boolean(muc.bat_buoc),
              thu_tu: muc.thu_tu,
            }
          : {
              kieu_nhap: 'VAN_BAN',
              bat_buoc: false,
              thu_tu: 0,
            }
      }
      xacNhan={(giaTri) => (
        <p>
          Lưu thuộc tính “{giaTri.ten_thuoc_tinh}”, kiểu {cacKieu[giaTri.kieu_nhap]},{' '}
          {giaTri.bat_buoc ? 'bắt buộc' : 'không bắt buộc'}?
        </p>
      )}
      onGui={async (giaTri) => {
        await gui(
          `/admin/categories/${danhMucId}/attributes${muc ? `/${muc.id}` : ''}`,
          {
            ...giaTri,
            lua_chon_json: giaTri.kieu_nhap === 'LUA_CHON' ? giaTri.lua_chon_json : null,
          },
          muc ? 'put' : 'post',
        );
        await lamMoiDanhMuc(danhMucId);
      }}
    >
      <Form.Item
        name="ten_thuoc_tinh"
        label="Tên thuộc tính"
        rules={[
          {
            required: true,
            whitespace: true,
            message: 'Nhập tên thuộc tính.',
          },
        ]}
      >
        <Input maxLength={100} />
      </Form.Item>
      <Form.Item
        name="khoa_thuoc_tinh"
        label="Khóa thuộc tính"
        rules={[
          { required: true, message: 'Nhập khóa thuộc tính.' },
          {
            pattern: /^[a-z][a-z0-9_]*$/,
            message: 'Bắt đầu bằng chữ thường, dùng chữ không dấu, số và dấu gạch dưới.',
          },
        ]}
      >
        <Input maxLength={100} placeholder="chat_lieu" />
      </Form.Item>
      <Form.Item name="kieu_nhap" label="Kiểu dữ liệu" rules={[{ required: true }]}>
        <Select options={Object.entries(cacKieu).map(([value, label]) => ({ value, label }))} />
      </Form.Item>
      <Form.Item noStyle shouldUpdate={(truoc, sau) => truoc.kieu_nhap !== sau.kieu_nhap}>
        {({ getFieldValue }) =>
          getFieldValue('kieu_nhap') === 'LUA_CHON' && (
            <Form.Item
              name="lua_chon_json"
              label="Các lựa chọn (nhập rồi nhấn Enter)"
              rules={[
                { required: true, message: 'Nhập ít nhất một lựa chọn.' },
                {
                  validator: (_, giaTri) =>
                    Array.isArray(giaTri) &&
                    giaTri.length > 0 &&
                    giaTri.length <= 100 &&
                    giaTri.every(
                      (muc) =>
                        typeof muc === 'string' && muc.trim().length > 0 && muc.length <= 100,
                    )
                      ? Promise.resolve()
                      : Promise.reject(
                          new Error('Từ 1 đến 100 lựa chọn, mỗi lựa chọn tối đa 100 ký tự.'),
                        ),
                },
              ]}
            >
              <Select mode="tags" />
            </Form.Item>
          )
        }
      </Form.Item>
      <Form.Item name="don_vi" label="Đơn vị">
        <Input maxLength={30} />
      </Form.Item>
      <Form.Item name="thu_tu" label="Thứ tự" rules={[{ required: true }]}>
        <InputNumber min={0} precision={0} />
      </Form.Item>
      <Form.Item name="bat_buoc" label="Bắt buộc nhập" valuePropName="checked">
        <Switch />
      </Form.Item>
    </BieuMauThaoTac>
  );
}

function CacThuocTinh({ muc }: { muc: DanhMucQuanTri }) {
  const truyVan = useDuLieu<ThuocTinh[]>(`/categories/${muc.id}/attributes`);

  return (
    <section className="tam-noi-dung">
      <h2>Thuộc tính: {muc.ten}</h2>
      <p>
        Thuộc tính đã được dùng trong sản phẩm có thể bị giới hạn chỉnh sửa để bảo toàn dữ liệu.
      </p>
      <SuaThuocTinh danhMucId={muc.id} />
      <ChoDuLieu
        truyVan={truyVan}
        rong={truyVan.data?.length === 0}
        thongDiepRong="Danh mục chưa có thuộc tính."
      >
        {truyVan.data?.map((thuocTinh) => (
          <div key={thuocTinh.id} className="tam-noi-dung">
            <strong>{thuocTinh.ten_thuoc_tinh}</strong>
            <p>
              {cacKieu[thuocTinh.kieu_nhap]} · {thuocTinh.bat_buoc ? 'Bắt buộc' : 'Tùy chọn'}{' '}
              {thuocTinh.don_vi ? `· ${thuocTinh.don_vi}` : ''}
            </p>
            {thuocTinh.lua_chon_json && <p>{thuocTinh.lua_chon_json.join(' · ')}</p>}
            <SuaThuocTinh key={JSON.stringify(thuocTinh)} muc={thuocTinh} danhMucId={muc.id} />
          </div>
        ))}
      </ChoDuLieu>
    </section>
  );
}

export default function QuanLyDanhMuc() {
  const truyVan = useDuLieu<DanhMucQuanTri[]>('/admin/categories');
  const [idChon, datIdChon] = useState<string>();
  const mucChon = truyVan.data?.find((muc) => muc.id === idChon);

  return (
    <>
      <TieuDe
        ten="Danh mục và thuộc tính"
        moTa="Quản lý nhóm sản phẩm và thông tin người bán cần cung cấp."
      >
        <Button loading={truyVan.isFetching} onClick={() => void lamMoiDanhMuc(idChon)}>
          Làm mới
        </Button>
        {truyVan.data && <SuaDanhMuc danhSach={truyVan.data} />}
      </TieuDe>
      <ChoDuLieu truyVan={truyVan} rong={truyVan.data?.length === 0}>
        <div className="bang-cuon">
          <table className="bang-du-lieu">
            <thead>
              <tr>
                <th>Danh mục</th>
                <th>Danh mục cha</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {truyVan.data?.map((muc) => (
                <tr key={muc.id}>
                  <td>
                    {muc.ten}
                    <p>{muc.yeu_cau_kiem_dinh ? 'Yêu cầu kiểm định' : 'Không yêu cầu kiểm định'}</p>
                  </td>
                  <td>
                    {truyVan.data?.find((cha) => String(cha.id) === String(muc.danh_muc_cha_id))
                      ?.ten || 'Danh mục gốc'}
                  </td>
                  <td>{muc.dang_hoat_dong ? 'Đang sử dụng' : 'Ngừng sử dụng'}</td>
                  <td>
                    <SuaDanhMuc key={JSON.stringify(muc)} muc={muc} danhSach={truyVan.data || []} />
                    <Button onClick={() => datIdChon(muc.id)}>Thuộc tính</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChoDuLieu>
      {mucChon && <CacThuocTinh key={mucChon.id} muc={mucChon} />}
    </>
  );
}
