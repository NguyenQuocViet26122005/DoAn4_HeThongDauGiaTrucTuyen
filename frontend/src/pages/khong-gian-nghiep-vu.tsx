import { Button, Descriptions, Result } from 'antd';
import { Link, useParams } from 'react-router-dom';
import { ChoDuLieu, PhanTrang, TieuDe } from '../components/dung-chung';
import { usePhienDangNhap } from '../store/phien-dang-nhap';
import { useDanhSachDuLieu } from '../hooks/su-dung-du-lieu';
import { khuVucNghiepVu } from '../constants/khu-vuc-nghiep-vu';
import { nhan } from '../utils/dinh-dang';
import { ThePhien } from './kham-pha';
import type { Phien } from '../types/du-lieu';
import { useState } from 'react';
import SuaHoSo from '../components/sua-ho-so';
import TheoDoiPhien from '../components/theo-doi-phien';

function DanhSachPhienCaNhan({ url }: { url: string }) {
  const [trang, datTrang] = useState(1);
  const phien = useDanhSachDuLieu<Phien[]>(url, { page: trang, limit: 9 });

  return (
    <div className="danh-sach-phien-ca-nhan">
      <Button loading={phien.isFetching} onClick={() => void phien.refetch()}>
        Làm mới danh sách
      </Button>
      <ChoDuLieu truyVan={phien} rong={phien.data?.length === 0}>
        <div className="luoi-phien">
          {phien.data?.map((p) => (
            <div key={p.id}>
              <ThePhien phien={p} />
              {url === '/watchlist' && <TheoDoiPhien id={p.id} />}
            </div>
          ))}
        </div>
      </ChoDuLieu>
      {!phien.isPending && !phien.isError && (
        <PhanTrang
          trang={trang}
          datTrang={datTrang}
          soLuong={phien.data?.length || 0}
          coTrangSau={phien.coTrangSau}
          dangTai={phien.isFetching}
        />
      )}
    </div>
  );
}

export default function KhongGianNghiepVu({ loai }: { loai: string }) {
  const { muc = '' } = useParams();
  const nguoiDung = usePhienDangNhap((s) => s.nguoiDung);
  const thongTin = khuVucNghiepVu[loai][muc];

  if (!thongTin) {
    return (
      <Result
        status="404"
        title="Không tìm thấy mục này"
        extra={<Link to={`/${loai}`}>Về tổng quan</Link>}
      />
    );
  }

  const laHoSo = loai === 'tai-khoan' && !muc;
  const laDanhSachPhien = loai === 'tai-khoan' && ['theo-doi', 'da-dau-gia'].includes(muc);

  return (
    <>
      <TieuDe nhanNho="KHÔNG GIAN CỦA BẠN" ten={thongTin[0]} moTa={thongTin[1]} />
      {laHoSo ? (
        <>
          <section className="tam-noi-dung thong-tin-tai-khoan">
            <h2>Thông tin tài khoản</h2>
            <Descriptions
              column={1}
              items={[
                {
                  key: 'ten',
                  label: 'Họ và tên',
                  children: nguoiDung?.ho_ten,
                },
                {
                  key: 'email',
                  label: 'Email',
                  children: nguoiDung?.email,
                },
                {
                  key: 'sdt',
                  label: 'Điện thoại',
                  children: nguoiDung?.so_dien_thoai || 'Chưa cập nhật',
                },
                {
                  key: 'ban',
                  label: 'Xác minh người bán',
                  children: nhan(nguoiDung?.trang_thai_nguoi_ban),
                },
              ]}
            />
            {nguoiDung && (
              <SuaHoSo
                key={`${nguoiDung.ho_ten}:${nguoiDung.so_dien_thoai}`}
                nguoiDung={nguoiDung}
              />
            )}
          </section>
          <div className="luoi-loi-tat">
            <Link to="/tai-khoan/theo-doi">
              <strong>Đang theo dõi ↗</strong>
              <span>Quay lại những phiên bạn yêu thích.</span>
            </Link>
            <Link to="/tai-khoan/da-dau-gia">
              <strong>Phiên đã tham gia ↗</strong>
              <span>Xem giá công khai và kết quả phiên.</span>
            </Link>
          </div>
        </>
      ) : laDanhSachPhien ? (
        <DanhSachPhienCaNhan
          key={muc}
          url={muc === 'theo-doi' ? '/watchlist' : '/auctions/my-bids'}
        />
      ) : (
        <Result
          status="404"
          title="Không tìm thấy trang"
          extra={<Link to={`/${loai}`}>Về tổng quan</Link>}
        />
      )}
    </>
  );
}
