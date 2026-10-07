import { useEffect, useState } from 'react';
import { Alert, Button, Descriptions, Tag } from 'antd';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ChoDuLieu, PhanTrang, TieuDe, TrangThai } from '../components/dung-chung';
import PhanHoiDeNghi from '../components/phan-hoi-de-nghi';
import { useDuLieu, useDanhSachDuLieu } from '../hooks/su-dung-du-lieu';
import { usePhienDangNhap } from '../store/phien-dang-nhap';
import { lamMoiDeNghi } from '../services/de-nghi-mua-tiep';
import { mocThoiGian, ngayGio, tien } from '../utils/dinh-dang';
import type { DeNghiMuaTiep } from '../types/de-nghi-mua-tiep';

function useThoiGian() {
  const [hienTai, datHienTai] = useState(Date.now);

  useEffect(() => {
    const dem = setInterval(() => datHienTai(Date.now()), 1000);

    return () => clearInterval(dem);
  }, []);

  return hienTai;
}

function trangThai(deNghi: DeNghiMuaTiep, hienTai: number) {
  return deNghi.trang_thai === 'CHO_XU_LY' && mocThoiGian(deNghi.het_han_luc) <= hienTai
    ? 'HET_HAN'
    : deNghi.trang_thai;
}

export default function DanhSachDeNghi() {
  const [thamSo, datThamSo] = useSearchParams();
  const trang = Math.max(1, Math.floor(Number(thamSo.get('page')) || 1));
  const truyVan = useDanhSachDuLieu<DeNghiMuaTiep[]>('/second-chances', { page: trang, limit: 12 });
  const nguoiDung = usePhienDangNhap((s) => s.nguoiDung);
  const hienTai = useThoiGian();

  return (
    <>
      <TieuDe ten="Cơ hội mua tiếp" moTa="Các đề nghị bạn nhận được hoặc đã gửi từ phiên đấu giá.">
        <Button loading={truyVan.isFetching} onClick={() => void lamMoiDeNghi()}>
          Làm mới
        </Button>
      </TieuDe>
      <ChoDuLieu
        truyVan={truyVan}
        rong={truyVan.data?.length === 0}
        thongDiepRong="Chưa có đề nghị mua tiếp trong trang này."
      >
        <div className="danh-sach-don">
          {truyVan.data?.map((deNghi) => (
            <article className="tam-noi-dung the-don" key={deNghi.id}>
              <div>
                <Tag>
                  {String(deNghi.nguoi_tra_gia_id) === String(nguoiDung?.id)
                    ? 'Bạn nhận'
                    : 'Bạn gửi'}
                </Tag>
                <TrangThai giaTri={trangThai(deNghi, hienTai)} />
                <h2>{deNghi.tieu_de}</h2>
                <p>
                  Đề nghị #{deNghi.id} · Phiên #{deNghi.phien_dau_gia_id}
                </p>
                <p>
                  Giá đề nghị: <strong>{tien(deNghi.gia_de_nghi)}</strong> · Phí vận chuyển:{' '}
                  {tien(deNghi.phi_van_chuyen)}
                </p>
                <small>Hạn trả lời: {ngayGio(deNghi.het_han_luc)}</small>
              </div>
              <Link className="link-vang" to={`/tai-khoan/de-nghi/${deNghi.id}`}>
                Xem đề nghị →
              </Link>
            </article>
          ))}
        </div>
      </ChoDuLieu>
      {!truyVan.isPending && !truyVan.isError && (
        <PhanTrang
          trang={trang}
          datTrang={(so) => datThamSo({ page: String(so) })}
          soLuong={truyVan.data?.length || 0}
          coTrangSau={truyVan.coTrangSau}
          dangTai={truyVan.isFetching}
        />
      )}
    </>
  );
}

export function ChiTietDeNghi() {
  const { id } = useParams();
  const truyVan = useDuLieu<DeNghiMuaTiep>(`/second-chances/${id}`);
  const nguoiDung = usePhienDangNhap((s) => s.nguoiDung);
  const hienTai = useThoiGian();
  const deNghi = truyVan.data;
  const laNguoiNhan = String(deNghi?.nguoi_tra_gia_id) === String(nguoiDung?.id);
  const laNguoiBan = String(deNghi?.nguoi_ban_id) === String(nguoiDung?.id);
  const quanTri = nguoiDung?.vai_tro === 'QUAN_TRI';

  return (
    <>
      <TieuDe
        ten={`Đề nghị mua tiếp #${id}`}
        moTa="Giá đề nghị dựa trên lượt trả giá công khai hợp lệ."
      >
        <Button loading={truyVan.isFetching} onClick={() => void lamMoiDeNghi()}>
          Làm mới
        </Button>
      </TieuDe>
      <Link className="link-vang" to="/tai-khoan/de-nghi">
        ← Danh sách đề nghị
      </Link>
      <ChoDuLieu truyVan={truyVan}>
        {deNghi && (
          <div className="chi-tiet-don">
            <section className="tam-noi-dung thong-tin-don">
              <TrangThai giaTri={trangThai(deNghi, hienTai)} />
              <h2>{deNghi.tieu_de}</h2>
              <Descriptions
                column={1}
                items={[
                  {
                    key: 'gia',
                    label: 'Giá đề nghị',
                    children: tien(deNghi.gia_de_nghi),
                  },
                  {
                    key: 'phi',
                    label: 'Phí vận chuyển',
                    children: tien(deNghi.phi_van_chuyen),
                  },
                  {
                    key: 'ngay',
                    label: 'Ngày gửi',
                    children: ngayGio(deNghi.ngay_tao),
                  },
                  {
                    key: 'han',
                    label: 'Hạn trả lời',
                    children: ngayGio(deNghi.het_han_luc),
                  },
                  {
                    key: 'tra-loi',
                    label: 'Đã trả lời',
                    children: ngayGio(deNghi.ngay_phan_hoi),
                  },
                ]}
              />
              <Link className="link-vang" to={`/phien/${deNghi.phien_dau_gia_id}`}>
                Xem sản phẩm và phiên đấu giá →
              </Link>
              {(laNguoiBan || quanTri) && (
                <Link
                  className="link-vang"
                  to={`/${quanTri ? 'quan-tri' : 'nguoi-ban'}/don-hang/${deNghi.don_hang_goc_id}`}
                >
                  Xem đơn gốc để gửi đề nghị tiếp theo khi đủ điều kiện →
                </Link>
              )}
              {deNghi.don_hang_moi_id && (
                <Link
                  className="link-vang"
                  to={`/${quanTri ? 'quan-tri' : 'tai-khoan'}/don-hang/${deNghi.don_hang_moi_id}`}
                >
                  Xem đơn được tạo từ đề nghị →
                </Link>
              )}
              <p>Hệ thống không tự gửi đề nghị kế tiếp khi bị từ chối hoặc hết hạn.</p>
            </section>
            {laNguoiNhan && nguoiDung?.vai_tro === 'NGUOI_DUNG' ? (
              <PhanHoiDeNghi
                key={`${deNghi.id}:${nguoiDung.id}`}
                deNghi={deNghi}
                conHan={trangThai(deNghi, hienTai) === 'CHO_XU_LY'}
              />
            ) : (
              <Alert type="info" title="Chỉ người nhận đề nghị được chấp nhận hoặc từ chối." />
            )}
          </div>
        )}
      </ChoDuLieu>
    </>
  );
}
