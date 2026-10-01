import { useState } from 'react';
import { Button, Input } from 'antd';
import { Link } from 'react-router-dom';
import { AnhSanPham, ChoDuLieu, PhanTrang } from './dung-chung';
import { useDuLieu } from '../hooks/su-dung-du-lieu';
import type { SanPhamTrongDanhSach } from '../types/san-pham';

export default function ChonSanPhamPhien({
  value,
  onChange,
  onChon,
  disabled,
}: {
  value?: string;
  onChange?: (id: string) => void;
  onChon: (sanPham: SanPhamTrongDanhSach) => void;
  disabled: boolean;
}) {
  const [tuKhoa, datTuKhoa] = useState('');
  const [trang, datTrang] = useState(1);
  const sanPham = useDuLieu<SanPhamTrongDanhSach[]>('/products/mine', {
    du_dieu_kien_dau_gia: '1',
    q: tuKhoa,
    page: trang,
    limit: 6,
  });

  return (
    <div className="chon-san-pham-phien">
      <p className="chu-mo">
        Chỉ hiển thị sản phẩm đã duyệt, đủ điều kiện kiểm định và chưa có phiên đang chờ, đang chạy
        hoặc đã bán.
      </p>
      <Input.Search
        aria-label="Tìm sản phẩm đủ điều kiện"
        placeholder="Tìm sản phẩm đã được duyệt…"
        allowClear
        maxLength={100}
        disabled={disabled}
        onSearch={(giaTri) => {
          datTuKhoa(giaTri.trim());
          datTrang(1);
        }}
      />
      <ChoDuLieu
        truyVan={sanPham}
        rong={sanPham.data?.length === 0}
        thongDiepRong="Chưa có sản phẩm phù hợp. Hãy kiểm tra trạng thái duyệt và hồ sơ kiểm định."
      >
        <div className="luoi-chon-san-pham">
          {sanPham.data?.map((muc) => (
            <button
              type="button"
              className={`the-chon-san-pham ${String(value) === String(muc.id) ? 'da-chon' : ''}`}
              key={muc.id}
              aria-pressed={String(value) === String(muc.id)}
              disabled={disabled}
              onClick={() => {
                onChange?.(String(muc.id));
                onChon(muc);
              }}
            >
              <AnhSanPham src={muc.anh_chinh} ten={muc.tieu_de} />
              <span>
                <small>
                  #{muc.id} · {String(value) === String(muc.id) ? 'Đã chọn' : 'Chọn sản phẩm'}
                </small>
                <strong>{muc.tieu_de}</strong>
              </span>
            </button>
          ))}
        </div>
      </ChoDuLieu>
      {!sanPham.isPending && !sanPham.isError && (
        <PhanTrang
          trang={trang}
          datTrang={datTrang}
          soLuong={sanPham.data?.length || 0}
          gioiHan={6}
        />
      )}
      <div className="cac-nut-kiem-dinh">
        <Button disabled={disabled} onClick={() => sanPham.refetch()}>
          Làm mới sản phẩm
        </Button>
        <Link className="link-vang" to="/nguoi-ban/san-pham">
          Quản lý sản phẩm ↗
        </Link>
      </div>
    </div>
  );
}
