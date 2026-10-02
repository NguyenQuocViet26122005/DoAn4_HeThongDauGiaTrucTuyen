import { Alert, Button, Descriptions } from 'antd';
import { Link, useParams } from 'react-router-dom';
import { ChoDuLieu, TieuDe, TrangThai } from '../components/dung-chung';
import { useDuLieu } from '../hooks/su-dung-du-lieu';
import type { DonMua } from '../types/tham-gia-phien';
import { nhan, tien } from '../utils/dinh-dang';

export default function BienNhanDon() {
  const { id } = useParams();
  const truyVan = useDuLieu<DonMua>(`/orders/${id}`);
  const don = truyVan.data;

  return (
    <>
      <TieuDe ten="Thông tin đơn hàng" moTa="Số tiền và địa chỉ đã được ghi nhận từ giao dịch.">
        <Button loading={truyVan.isFetching} onClick={() => void truyVan.refetch()}>
          Làm mới
        </Button>
      </TieuDe>
      <ChoDuLieu truyVan={truyVan}>
        {don && (
          <section className="tam-noi-dung">
            <h2>{don.ma_don_hang}</h2>
            <TrangThai giaTri={don.trang_thai} />
            <Descriptions
              column={1}
              items={[
                {
                  key: 'gia',
                  label: 'Giá sản phẩm',
                  children: tien(don.gia_san_pham),
                },
                {
                  key: 'phi',
                  label: 'Phí vận chuyển',
                  children: tien(don.phi_van_chuyen),
                },
                {
                  key: 'tong',
                  label: 'Tổng đơn',
                  children: tien(don.tong_tien),
                },
                {
                  key: 'coc',
                  label: 'Cọc đã chuyển vào đơn',
                  children: tien(don.tien_coc_da_chuyen),
                },
                {
                  key: 'thu',
                  label: 'Tổng tiền đã thu (gồm cọc)',
                  children: tien(don.so_tien_da_thu),
                },
                {
                  key: 'giu',
                  label: 'Giữ tiền trung gian',
                  children: nhan(don.trang_thai_giu_tien),
                },
                {
                  key: 'nguoi',
                  label: 'Người nhận',
                  children: `${don.ten_nguoi_nhan} · ${don.sdt_nguoi_nhan}`,
                },
                {
                  key: 'dia-chi',
                  label: 'Địa chỉ đã lưu vào đơn',
                  children: don.dia_chi_giao_hang,
                },
              ]}
            />
            <Alert
              type="info"
              title="Giao dịch mô phỏng phục vụ đồ án"
              description="Đây là trang tra cứu đơn. Các thao tác thanh toán phần còn lại, vận chuyển và xác nhận nhận hàng sẽ được hoàn thiện ở đợt giao diện đơn hàng."
            />
            <Link className="link-vang" to={`/phien/${don.phien_dau_gia_id}`}>
              Quay lại phiên đấu giá →
            </Link>
          </section>
        )}
      </ChoDuLieu>
    </>
  );
}
