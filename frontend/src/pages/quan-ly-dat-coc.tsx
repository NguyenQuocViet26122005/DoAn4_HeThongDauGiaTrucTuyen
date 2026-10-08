import { useEffect, useState } from 'react';
import { Alert, Button } from 'antd';
import { Link } from 'react-router-dom';
import { ChoDuLieu, PhanTrang, TieuDe, TrangThai } from '../components/dung-chung';
import { useDanhSachDuLieu } from '../hooks/su-dung-du-lieu';
import { mocThoiGian, ngayGio, tien } from '../utils/dinh-dang';

interface Coc {
  id: string;
  phien_dau_gia_id: string;
  nguoi_dung_id: string;
  don_hang_id: string | null;
  so_tien: string;
  trang_thai: string;
  trang_thai_phien: string;
  thoi_gian_ket_thuc_phien: string;
  ngay_dat_coc: string | null;
  ngay_hoan: string | null;
  ngay_chuyen_vao_don: string | null;
  ngay_khong_hoan: string | null;
  ly_do_xu_ly: string | null;
}

function DonHangCuaKhoanCoc({ muc, hienTai }: { muc: Coc; hienTai: number }) {
  if (muc.don_hang_id) {
    return <Link to={`/quan-tri/don-hang/${muc.don_hang_id}`}>Đơn #{muc.don_hang_id}</Link>;
  }

  if (muc.trang_thai === 'DA_DAT_COC') {
    const phienDaQuaHan =
      ['DA_LEN_LICH', 'HOAT_DONG'].includes(muc.trang_thai_phien) &&
      mocThoiGian(muc.thoi_gian_ket_thuc_phien) <= hienTai;

    return phienDaQuaHan ? 'Hết giờ · chờ chốt kết quả' : 'Chờ phiên kết thúc';
  }

  if (muc.trang_thai === 'DA_HOAN_COC') {
    return 'Không tạo đơn · đã hoàn cọc';
  }

  if (muc.trang_thai === 'HET_HAN') {
    return 'Không tạo đơn · cọc hết hạn';
  }

  if (muc.trang_thai === 'KHONG_HOAN_COC') {
    return 'Cần Admin đối soát';
  }

  return 'Chưa phát sinh đơn';
}

export default function QuanLyDatCoc() {
  const [trang, datTrang] = useState(1);
  const [hienTai, datHienTai] = useState(0);
  const truyVan = useDanhSachDuLieu<Coc[]>(
    '/admin/deposits',
    { page: trang, limit: 12 },
    true,
    15000,
  );

  useEffect(() => {
    const capNhatThoiGian = () => datHienTai(Date.now());
    const boHenGio = setInterval(capNhatThoiGian, 10000);

    capNhatThoiGian();

    return () => clearInterval(boHenGio);
  }, []);

  return (
    <>
      <TieuDe
        ten="Quản lý đặt cọc"
        moTa="Đối soát cọc theo kết quả phiên và đơn hàng. Trạng thái được cập nhật bởi luồng giao dịch."
      >
        <Button loading={truyVan.isFetching} onClick={() => void truyVan.refetch()}>
          Làm mới
        </Button>
      </TieuDe>
      <Alert
        type="info"
        showIcon
        message="Cọc chỉ chuyển vào đơn của người thắng sau khi phiên được chốt. Các khoản cọc còn lại được hoàn; danh sách tự làm mới mỗi 15 giây."
      />
      <ChoDuLieu truyVan={truyVan} rong={truyVan.data?.length === 0}>
        <div className="bang-cuon">
          <table className="bang-du-lieu">
            <thead>
              <tr>
                <th>Khoản cọc</th>
                <th>Số tiền</th>
                <th>Trạng thái</th>
                <th>Các mốc xử lý</th>
                <th>Đơn hàng</th>
              </tr>
            </thead>
            <tbody>
              {truyVan.data?.map((muc) => (
                <tr key={muc.id}>
                  <td>
                    #{muc.id}
                    <p>Tài khoản #{muc.nguoi_dung_id}</p>
                    <Link to={`/phien/${muc.phien_dau_gia_id}`}>Phiên #{muc.phien_dau_gia_id}</Link>
                  </td>
                  <td>{tien(muc.so_tien)}</td>
                  <td>
                    <TrangThai giaTri={muc.trang_thai} />
                    <p>{muc.ly_do_xu_ly}</p>
                  </td>
                  <td>
                    {[
                      ['Đặt cọc', muc.ngay_dat_coc],
                      ['Hoàn cọc', muc.ngay_hoan],
                      ['Chuyển vào đơn', muc.ngay_chuyen_vao_don],
                      ['Không hoàn', muc.ngay_khong_hoan],
                    ]
                      .filter(([, ngay]) => ngay)
                      .map(([ten, ngay]) => (
                        <p key={ten}>
                          {ten}: {ngayGio(ngay)}
                        </p>
                      ))}
                  </td>
                  <td>
                    <DonHangCuaKhoanCoc muc={muc} hienTai={hienTai} />
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
          coTrangSau={truyVan.coTrangSau}
          dangTai={truyVan.isFetching}
        />
      )}
    </>
  );
}
