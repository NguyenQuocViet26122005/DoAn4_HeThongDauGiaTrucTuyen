import { useState } from 'react';
import { Button, Form, Input, Select, Tabs } from 'antd';
import { Link } from 'react-router-dom';
import { ChoDuLieu, PhanTrang, TieuDe, TrangThai } from '../components/dung-chung';
import BieuMauThaoTac from '../components/bieu-mau-thao-tac';
import { useDanhSachDuLieu } from '../hooks/su-dung-du-lieu';
import { boNho, gui } from '../services/api';
import { ngayGio, nhan, tien } from '../utils/dinh-dang';
import type { Phien } from '../types/du-lieu';

interface YeuCauHuy {
  id: string;
  phien_dau_gia_id: string;
  tieu_de: string;
  ly_do: string;
  trang_thai: string;
  ngay_tao: string;
  ghi_chu_duyet: string | null;
}

function DanhSachPhien() {
  const [trang, datTrang] = useState(1);
  const [trangThai, datTrangThai] = useState<string>();
  const [tuKhoa, datTuKhoa] = useState('');
  const truyVan = useDanhSachDuLieu<Phien[]>(
    '/admin/auctions',
    {
      page: trang,
      limit: 12,
      trang_thai: trangThai,
      q: tuKhoa,
    },
    true,
    15000,
  );

  return (
    <>
      <Input.Search
        aria-label="Tìm phiên"
        placeholder="Tìm phiên đấu giá"
        allowClear
        maxLength={100}
        onSearch={(giaTri) => {
          datTuKhoa(giaTri.trim());
          datTrang(1);
        }}
      />
      <Select
        aria-label="Trạng thái phiên"
        placeholder="Tất cả trạng thái"
        allowClear
        value={trangThai}
        style={{ minWidth: 200 }}
        options={['DA_LEN_LICH', 'HOAT_DONG', 'DA_KET_THUC', 'THAT_BAI', 'DA_HUY'].map((value) => ({
          value,
          label: nhan(value),
        }))}
        onChange={(giaTri) => {
          datTrangThai(giaTri);
          datTrang(1);
        }}
      />
      <ChoDuLieu truyVan={truyVan} rong={truyVan.data?.length === 0}>
        <div className="bang-cuon">
          <table className="bang-du-lieu">
            <thead>
              <tr>
                <th>Phiên</th>
                <th>Trạng thái</th>
                <th>Giá công khai</th>
                <th>Kết thúc</th>
              </tr>
            </thead>
            <tbody>
              {truyVan.data?.map((muc) => (
                <tr key={muc.id}>
                  <td>
                    <Link to={`/phien/${muc.id}`}>
                      #{muc.id} · {muc.tieu_de}
                    </Link>
                  </td>
                  <td>
                    <TrangThai giaTri={muc.trang_thai} />
                  </td>
                  <td>{tien(muc.gia_hien_tai)}</td>
                  <td>{ngayGio(muc.thoi_gian_ket_thuc)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChoDuLieu>
      {!truyVan.isPending && !truyVan.isError && (
        <PhanTrang
          trang={trang}
          datTrang={datTrang}
          soLuong={truyVan.data?.length || 0}
          coTrangSau={truyVan.coTrangSau}
          dangTai={truyVan.isFetching}
        />
      )}
    </>
  );
}

function YeuCauHuyPhien() {
  const [trang, datTrang] = useState(1);
  const truyVan = useDanhSachDuLieu<YeuCauHuy[]>('/admin/cancellation-requests', {
    page: trang,
    limit: 12,
  });

  return (
    <>
      <Button loading={truyVan.isFetching} onClick={() => void truyVan.refetch()}>
        Làm mới yêu cầu
      </Button>
      <ChoDuLieu truyVan={truyVan} rong={truyVan.data?.length === 0}>
        {truyVan.data?.map((muc) => (
          <section key={muc.id} className="tam-noi-dung">
            <h2>
              <Link to={`/phien/${muc.phien_dau_gia_id}`}>{muc.tieu_de}</Link>
            </h2>
            <TrangThai giaTri={muc.trang_thai} />
            <p>{ngayGio(muc.ngay_tao)}</p>
            <p>{muc.ly_do}</p>
            {muc.ghi_chu_duyet && <p>Quyết định: {muc.ghi_chu_duyet}</p>}
            {muc.trang_thai === 'CHO_XU_LY' && (
              <BieuMauThaoTac<{ trang_thai: string; ghi_chu_duyet: string }>
                ten="Xử lý yêu cầu"
                xacNhan={(giaTri) => (
                  <>
                    <p>
                      {giaTri.trang_thai === 'DA_DUYET'
                        ? 'Hủy phiên và hoàn cọc theo quy tắc hệ thống'
                        : 'Từ chối yêu cầu hủy'}
                      : {muc.tieu_de}?
                    </p>
                    <p>{giaTri.ghi_chu_duyet}</p>
                  </>
                )}
                onGui={async (giaTri) => {
                  await gui(`/admin/cancellation-requests/${muc.id}/review`, giaTri, 'patch');
                  await boNho.invalidateQueries({
                    predicate: ({ queryKey }) =>
                      [
                        '/admin/cancellation-requests',
                        '/admin/auctions',
                        '/auctions',
                        `/auctions/${muc.phien_dau_gia_id}`,
                        '/admin/deposits',
                      ].includes(String(queryKey[0])),
                  });
                }}
              >
                <Form.Item
                  name="trang_thai"
                  label="Quyết định"
                  rules={[{ required: true, message: 'Chọn quyết định.' }]}
                >
                  <Select
                    options={[
                      { value: 'DA_DUYET', label: 'Duyệt hủy phiên' },
                      { value: 'TU_CHOI', label: 'Từ chối' },
                    ]}
                  />
                </Form.Item>
                <Form.Item
                  name="ghi_chu_duyet"
                  label="Lý do quyết định"
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
            )}
          </section>
        ))}
      </ChoDuLieu>
      {!truyVan.isPending && !truyVan.isError && (
        <PhanTrang
          trang={trang}
          datTrang={datTrang}
          soLuong={truyVan.data?.length || 0}
          coTrangSau={truyVan.coTrangSau}
          dangTai={truyVan.isFetching}
        />
      )}
    </>
  );
}

export default function QuanLyPhien() {
  return (
    <>
      <TieuDe
        ten="Phiên đấu giá và yêu cầu hủy"
        moTa="Phiên tiếp tục hoạt động cho đến khi có quyết định duyệt hủy."
      />
      <Tabs
        items={[
          {
            key: 'phien',
            label: 'Phiên đấu giá',
            children: <DanhSachPhien />,
          },
          {
            key: 'huy',
            label: 'Yêu cầu hủy',
            children: <YeuCauHuyPhien />,
          },
        ]}
      />
    </>
  );
}
