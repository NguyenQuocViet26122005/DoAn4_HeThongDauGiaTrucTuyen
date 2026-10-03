import { Alert, Descriptions, Result } from 'antd';
import { Link, useParams } from 'react-router-dom';
import { ChoDuLieu, PhanTrang, TieuDe } from '../components/dung-chung';
import { usePhienDangNhap } from '../store/phien-dang-nhap';
import { useDuLieu } from '../hooks/su-dung-du-lieu';
import { khuVucNghiepVu } from '../constants/khu-vuc-nghiep-vu';
import { nhan } from '../utils/dinh-dang';
import { ThePhien } from './kham-pha';
import type { Phien } from '../types/du-lieu';
import { useState } from 'react';
import SuaHoSo from '../components/sua-ho-so';

function DanhSachPhienCaNhan({ url }: { url: string }) {
  const [trang, datTrang] = useState(1);
  const phien = useDuLieu<Phien[]>(url, { page: trang, limit: 9 });

  return (
    <>
      <ChoDuLieu truyVan={phien} rong={phien.data?.length === 0}>
        <div className="luoi-phien">
          {phien.data?.map((p) => (
            <ThePhien key={p.id} phien={p} />
          ))}
        </div>
      </ChoDuLieu>
      {!phien.isPending && !phien.isError && (
        <PhanTrang
          trang={trang}
          datTrang={datTrang}
          soLuong={phien.data?.length || 0}
          gioiHan={9}
        />
      )}
    </>
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
          <section className="tam-noi-dung">
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
        <section className="tam-noi-dung">
          <Alert
            type="info"
            showIcon
            title="Giao diện chức năng đang được hoàn thiện"
            description="Đây là phần bố cục và điều hướng. Các biểu mẫu xử lý nghiệp vụ của mục này sẽ được bổ sung ở bước tiếp theo."
          />
          <h2>Quy trình liên quan</h2>
          <p>{thongTin[1]}</p>
          {loai === 'nguoi-ban' && nguoiDung?.trang_thai_nguoi_ban !== 'DA_XAC_MINH' && (
            <p>Bạn cần được Admin xác minh trước khi thực hiện thao tác bán hàng.</p>
          )}
          <Link className="link-vang" to={`/huong-dan${loai === 'nguoi-ban' ? '#nguoi-ban' : ''}`}>
            Xem hướng dẫn giao dịch ↗
          </Link>
        </section>
      )}
    </>
  );
}
