import { useState } from 'react';
import { Alert, Button, Select, Tag } from 'antd';
import { Link, useSearchParams } from 'react-router-dom';
import { ChoDuLieu, PhanTrang, TieuDe } from '../components/dung-chung';
import { useDuLieu } from '../hooks/su-dung-du-lieu';
import { usePhienDangNhap } from '../store/phien-dang-nhap';
import { boNho, gui, loiDeDoc } from '../services/api';
import { ngayGio } from '../utils/dinh-dang';
import { lienKetThongBao, noiDungThongBao } from '../utils/lien-ket-thong-bao';

interface ThongBao {
  id: string;
  tieu_de: string;
  noi_dung: string;
  duong_dan_lien_ket: string | null;
  da_doc: number;
  ngay_tao: string;
}

export default function TrangThongBao() {
  const [thamSo, datThamSo] = useSearchParams();
  const trang = Math.max(1, Math.floor(Number(thamSo.get('page')) || 1));
  const chuaDoc = thamSo.get('unread') === 'true';
  const truyVan = useDuLieu<ThongBao[]>('/notifications', {
    page: trang,
    limit: 12,
    unread: chuaDoc,
  });
  const quanTri = usePhienDangNhap((s) => s.nguoiDung?.vai_tro === 'QUAN_TRI');
  const [dangGui, datDangGui] = useState(false);
  const [loi, datLoi] = useState('');

  async function docThongBao(id?: string) {
    if (dangGui) {
      return;
    }
    datDangGui(true);
    datLoi('');
    try {
      await gui(id ? `/notifications/${id}/read` : '/notifications/read-all', {}, 'patch');
      await boNho.invalidateQueries({
        predicate: ({ queryKey }) =>
          typeof queryKey[0] === 'string' && queryKey[0].startsWith('/notifications'),
      });
    } catch (loiGui) {
      datLoi(loiDeDoc(loiGui));
    } finally {
      datDangGui(false);
    }
  }

  return (
    <>
      <TieuDe ten="Thông báo" moTa="Cập nhật về phiên đấu giá, đơn hàng và hồ sơ của bạn.">
        <Button loading={dangGui} onClick={() => void docThongBao()}>
          Đánh dấu tất cả đã đọc
        </Button>
      </TieuDe>
      <div className="bo-loc-thong-bao">
        <Select
          aria-label="Lọc thông báo"
          value={chuaDoc ? 'chua-doc' : 'tat-ca'}
          options={[
            { value: 'tat-ca', label: 'Tất cả thông báo' },
            { value: 'chua-doc', label: 'Chưa đọc' },
          ]}
          onChange={(giaTri) => datThamSo(giaTri === 'chua-doc' ? { unread: 'true' } : {})}
        />
        <Button onClick={() => void truyVan.refetch()} loading={truyVan.isFetching}>
          Làm mới
        </Button>
      </div>
      {loi && <Alert type="error" title={loi} />}
      <ChoDuLieu truyVan={truyVan} rong={truyVan.data?.length === 0}>
        <div className="danh-sach-don">
          {truyVan.data?.map((muc) => {
            const lienKet = lienKetThongBao(muc.duong_dan_lien_ket, quanTri);

            return (
              <article className="tam-noi-dung the-don" key={muc.id}>
                <div>
                  <Tag color={muc.da_doc ? undefined : 'gold'}>
                    {muc.da_doc ? 'Đã đọc' : 'Chưa đọc'}
                  </Tag>
                  <h2>{noiDungThongBao(muc.tieu_de)}</h2>
                  <p className="van-ban-dai">{noiDungThongBao(muc.noi_dung)}</p>
                  <small>{ngayGio(muc.ngay_tao)}</small>
                </div>
                <div className="thao-tac-don">
                  {lienKet && (
                    <Link className="link-vang" to={lienKet}>
                      Xem chi tiết →
                    </Link>
                  )}
                  {!muc.da_doc && (
                    <Button disabled={dangGui} onClick={() => void docThongBao(muc.id)}>
                      Đánh dấu đã đọc
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </ChoDuLieu>
      {!truyVan.isPending && !truyVan.isError && (
        <PhanTrang
          trang={trang}
          datTrang={(so) => datThamSo({ page: String(so), ...(chuaDoc ? { unread: 'true' } : {}) })}
          soLuong={truyVan.data?.length || 0}
          gioiHan={12}
        />
      )}
    </>
  );
}
