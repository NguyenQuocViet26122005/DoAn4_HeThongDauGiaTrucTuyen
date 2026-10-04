import { useState } from 'react';
import { Button } from 'antd';
import { ChoDuLieu, PhanTrang, TieuDe } from '../components/dung-chung';
import { useDuLieu } from '../hooks/su-dung-du-lieu';
import { ngayGio } from '../utils/dinh-dang';

interface NhatKy {
  id: string;
  nguoi_thuc_hien_id: string | null;
  hanh_dong: string;
  loai_doi_tuong: string;
  doi_tuong_id: string;
  ngay_tao: string;
}

export default function NhatKyHoatDong() {
  const [trang, datTrang] = useState(1);
  const truyVan = useDuLieu<NhatKy[]>('/admin/activity-logs', { page: trang, limit: 20 });

  return (
    <>
      <TieuDe
        ten="Nhật ký hoạt động"
        moTa="Lịch sử thao tác được hệ thống ghi nhận, sắp xếp mới nhất trước."
      >
        <Button loading={truyVan.isFetching} onClick={() => void truyVan.refetch()}>
          Làm mới
        </Button>
      </TieuDe>
      <ChoDuLieu truyVan={truyVan} rong={truyVan.data?.length === 0}>
        <div className="bang-cuon">
          <table className="bang-du-lieu">
            <thead>
              <tr>
                <th>Thời điểm</th>
                <th>Người thực hiện</th>
                <th>Hành động</th>
                <th>Đối tượng</th>
              </tr>
            </thead>
            <tbody>
              {truyVan.data?.map((muc) => (
                <tr key={muc.id}>
                  <td>{ngayGio(muc.ngay_tao)}</td>
                  <td>
                    {muc.nguoi_thuc_hien_id ? `Tài khoản #${muc.nguoi_thuc_hien_id}` : 'Hệ thống'}
                  </td>
                  <td>{muc.hanh_dong}</td>
                  <td>
                    {muc.loai_doi_tuong} #{muc.doi_tuong_id}
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
          gioiHan={20}
        />
      )}
    </>
  );
}
