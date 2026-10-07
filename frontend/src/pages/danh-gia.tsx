import { useState } from 'react';
import { Rate } from 'antd';
import { useParams } from 'react-router-dom';
import { ChoDuLieu, PhanTrang, TieuDe } from '../components/dung-chung';
import { useDanhSachDuLieu } from '../hooks/su-dung-du-lieu';
import { usePhienDangNhap } from '../store/phien-dang-nhap';
import { ngayGio } from '../utils/dinh-dang';

interface DanhGia {
  id: string;
  ten_nguoi_danh_gia: string;
  so_sao: number;
  nhan_xet: string | null;
  ngay_tao: string;
}

export default function DanhGiaNguoiDung() {
  const { id } = useParams();
  const nguoiDung = usePhienDangNhap((s) => s.nguoiDung);
  const nguoiDungId = id || nguoiDung?.id;

  return <DanhSachDanhGia key={nguoiDungId} id={String(nguoiDungId)} />;
}

function DanhSachDanhGia({ id }: { id: string }) {
  const [trang, datTrang] = useState(1);
  const truyVan = useDanhSachDuLieu<DanhGia[]>(`/users/${id}/reviews`, { page: trang, limit: 12 });

  return (
    <div className="tam-noi-dung">
      <TieuDe
        ten="Đánh giá từ giao dịch"
        moTa="Nhận xét của đối tác sau những đơn hàng đã hoàn tất."
      />
      <ChoDuLieu
        truyVan={truyVan}
        rong={truyVan.data?.length === 0}
        thongDiepRong="Chưa có đánh giá."
      >
        {truyVan.data?.map((muc) => (
          <article key={muc.id} className="tam-noi-dung">
            <strong>{muc.ten_nguoi_danh_gia}</strong>
            <p>{ngayGio(muc.ngay_tao)}</p>
            <Rate disabled value={Number(muc.so_sao)} />
            <p>{muc.nhan_xet || 'Không có nhận xét.'}</p>
          </article>
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
    </div>
  );
}
