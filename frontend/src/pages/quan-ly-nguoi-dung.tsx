import { useState } from 'react';
import { Button, Form, Input, Select } from 'antd';
import { Link } from 'react-router-dom';
import { ChoDuLieu, PhanTrang, TieuDe, TrangThai } from '../components/dung-chung';
import BieuMauThaoTac from '../components/bieu-mau-thao-tac';
import { useDuLieu } from '../hooks/su-dung-du-lieu';
import { boNho, gui } from '../services/api';
import { nhan } from '../utils/dinh-dang';

interface TaiKhoan {
  id: string;
  ho_ten: string;
  email: string;
  so_dien_thoai: string | null;
  vai_tro: string;
  trang_thai_nguoi_ban: string;
  trang_thai_tai_khoan: string;
}

export default function QuanLyNguoiDung() {
  const [tuKhoa, datTuKhoa] = useState('');
  const [trang, datTrang] = useState(1);
  const truyVan = useDuLieu<TaiKhoan[]>('/admin/users', {
    q: tuKhoa,
    page: trang,
    limit: 12,
  });

  return (
    <>
      <TieuDe ten="Quản lý người dùng" moTa="Tra cứu tài khoản và kiểm soát trạng thái truy cập.">
        <Button onClick={() => void truyVan.refetch()} loading={truyVan.isFetching}>
          Làm mới
        </Button>
      </TieuDe>
      <Input.Search
        placeholder="Tìm theo tên hoặc email"
        aria-label="Tìm người dùng"
        allowClear
        maxLength={100}
        onSearch={(giaTri) => {
          datTuKhoa(giaTri.trim());
          datTrang(1);
        }}
      />
      <ChoDuLieu truyVan={truyVan} rong={truyVan.data?.length === 0}>
        <div className="bang-cuon">
          <table className="bang-du-lieu">
            <thead>
              <tr>
                <th>Tài khoản</th>
                <th>Vai trò</th>
                <th>Quyền bán</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {truyVan.data?.map((muc) => (
                <tr key={muc.id}>
                  <td>
                    <strong>
                      #{muc.id} · {muc.ho_ten}
                    </strong>
                    <p>{muc.email}</p>
                    <p>{muc.so_dien_thoai}</p>
                  </td>
                  <td>{nhan(muc.vai_tro)}</td>
                  <td>
                    <TrangThai giaTri={muc.trang_thai_nguoi_ban} />
                  </td>
                  <td>
                    {muc.trang_thai_tai_khoan === 'HOAT_DONG' ? (
                      'Đang hoạt động'
                    ) : (
                      <TrangThai giaTri={muc.trang_thai_tai_khoan} />
                    )}
                  </td>
                  <td>
                    <BieuMauThaoTac<{ trang_thai_tai_khoan: string; ly_do: string }>
                      ten="Đổi trạng thái"
                      khoa={muc.vai_tro === 'QUAN_TRI'}
                      banDau={{ trang_thai_tai_khoan: muc.trang_thai_tai_khoan }}
                      xacNhan={(giaTri) => (
                        <>
                          <p>
                            Chuyển {muc.ho_ten} ({muc.email}) sang{' '}
                            {giaTri.trang_thai_tai_khoan === 'HOAT_DONG'
                              ? 'Đang hoạt động'
                              : nhan(giaTri.trang_thai_tai_khoan)}
                            ?
                          </p>
                          <p>{giaTri.ly_do}</p>
                        </>
                      )}
                      onGui={async (giaTri) => {
                        await gui(`/admin/users/${muc.id}/status`, giaTri, 'patch');
                        await boNho.invalidateQueries({ queryKey: ['/admin/users'] });
                      }}
                    >
                      <Form.Item
                        name="trang_thai_tai_khoan"
                        label="Trạng thái"
                        rules={[{ required: true }]}
                      >
                        <Select
                          options={['HOAT_DONG', 'TAM_NGUNG', 'BI_KHOA'].map((value) => ({
                            value,
                            label: value === 'HOAT_DONG' ? 'Đang hoạt động' : nhan(value),
                          }))}
                        />
                      </Form.Item>
                      <Form.Item
                        name="ly_do"
                        label="Lý do"
                        rules={[
                          {
                            required: true,
                            whitespace: true,
                            message: 'Nhập lý do thay đổi.',
                          },
                        ]}
                      >
                        <Input.TextArea rows={3} maxLength={500} showCount />
                      </Form.Item>
                    </BieuMauThaoTac>
                    <p>
                      <Link to={`/quan-tri/vi-pham?nguoi_dung_id=${muc.id}`}>Xem vi phạm</Link>
                    </p>
                    <Link to={`/nguoi-dung/${muc.id}/danh-gia`}>Xem đánh giá</Link>
                  </td>
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
          gioiHan={12}
        />
      )}
    </>
  );
}
