import { useState } from 'react';
import { Alert, Button } from 'antd';
import { Link } from 'react-router-dom';
import { useDuLieu } from '../hooks/su-dung-du-lieu';
import { boNho, gui, loiDeDoc } from '../services/api';
import { usePhienDangNhap } from '../store/phien-dang-nhap';

export default function TheoDoiPhien({ id }: { id: string }) {
  const nguoiDung = usePhienDangNhap((s) => s.nguoiDung);
  const truyVan = useDuLieu<{ dang_theo_doi: boolean }>(`/watchlist/${id}`, undefined, !!nguoiDung);
  const [dangGui, datDangGui] = useState(false);
  const [loi, datLoi] = useState('');

  async function doiTheoDoi() {
    if (!truyVan.data || dangGui) {
      return;
    }

    datDangGui(true);
    datLoi('');
    try {
      await gui(`/watchlist/${id}`, {}, truyVan.data.dang_theo_doi ? 'delete' : 'post');
      await Promise.all([
        boNho.invalidateQueries({ queryKey: [`/watchlist/${id}`] }),
        boNho.invalidateQueries({ queryKey: ['/watchlist'] }),
      ]);
    } catch (loiGui) {
      datLoi(loiDeDoc(loiGui));
    } finally {
      datDangGui(false);
    }
  }

  if (!nguoiDung) {
    return (
      <p>
        <Link to={`/dang-nhap?tiep=${encodeURIComponent(`/phien/${id}`)}`}>
          Đăng nhập để theo dõi phiên
        </Link>
      </p>
    );
  }

  return (
    <div>
      <Button
        loading={dangGui || truyVan.isPending}
        disabled={
          truyVan.isError || !truyVan.data || nguoiDung.trang_thai_tai_khoan !== 'HOAT_DONG'
        }
        onClick={() => void doiTheoDoi()}
      >
        {truyVan.data?.dang_theo_doi ? 'Bỏ theo dõi' : 'Theo dõi phiên'}
      </Button>
      {truyVan.isError && (
        <Alert
          type="warning"
          title="Chưa đọc được trạng thái theo dõi"
          action={<Button onClick={() => void truyVan.refetch()}>Thử lại</Button>}
        />
      )}
      {loi && <Alert type="error" title={loi} />}
    </div>
  );
}
