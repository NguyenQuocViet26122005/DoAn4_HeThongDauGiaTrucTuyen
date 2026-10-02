import { useState } from 'react';
import { Alert, App, Button, Modal, Tag } from 'antd';
import { Link, useSearchParams } from 'react-router-dom';
import { ChoDuLieu, TieuDe } from '../components/dung-chung';
import BieuMauDiaChi from '../components/bieu-mau-dia-chi';
import { noiDungDiaChi } from '../utils/dia-chi';
import { useDuLieu } from '../hooks/su-dung-du-lieu';
import { boNho, gui, loiDeDoc } from '../services/api';
import type { DiaChi } from '../types/tham-gia-phien';

export default function SoDiaChi() {
  const truyVan = useDuLieu<DiaChi[]>('/users/me/addresses');
  const { modal, message } = App.useApp();
  const [thamSo] = useSearchParams();
  const phienId = thamSo.get('phien');
  const [dangSua, datDangSua] = useState<DiaChi | null>();
  const [dangLuu, datDangLuu] = useState(false);
  const [dangXoa, datDangXoa] = useState(false);
  const [loi, datLoi] = useState('');

  function xoa(diaChi: DiaChi) {
    modal.confirm({
      title: 'Xóa địa chỉ nhận hàng này?',
      content: `${diaChi.ten_nguoi_nhan} — ${noiDungDiaChi(diaChi)}`,
      okText: 'Xóa địa chỉ',
      cancelText: 'Giữ lại',
      okButtonProps: { danger: true },
      async onOk() {
        datDangXoa(true);
        datLoi('');

        try {
          await gui(`/users/me/addresses/${diaChi.id}`, {}, 'delete');
          await boNho.invalidateQueries({ queryKey: ['/users/me/addresses'] });
          message.success('Đã xóa địa chỉ');
        } catch (loiXoa) {
          datLoi(loiDeDoc(loiXoa));
        } finally {
          datDangXoa(false);
        }
      },
    });
  }

  return (
    <>
      <TieuDe
        ten="Sổ địa chỉ"
        moTa="Địa chỉ mặc định được dùng khi chốt giao dịch. Đổi sổ địa chỉ không thay đổi đơn đã tạo."
      >
        <Button
          type="primary"
          disabled={dangXoa || (truyVan.data?.length || 0) >= 20}
          onClick={() => datDangSua(null)}
        >
          Thêm địa chỉ
        </Button>
      </TieuDe>
      {phienId && /^\d+$/.test(phienId) && (
        <Link className="link-vang" to={`/phien/${phienId}`}>
          ← Quay lại phiên đấu giá
        </Link>
      )}
      {loi && <Alert className="loi-bieu-mau" type="error" title={loi} />}
      <ChoDuLieu
        truyVan={truyVan}
        rong={truyVan.data?.length === 0}
        thongDiepRong="Thêm địa chỉ nhận hàng để tham gia đấu giá."
      >
        <div className="danh-sach-dia-chi">
          {truyVan.data?.map((diaChi, viTri) => (
            <section className="tam-noi-dung" key={diaChi.id}>
              <h2>
                {diaChi.ten_nguoi_nhan}{' '}
                {viTri === 0 && <Tag color="gold">Đang dùng để nhận hàng</Tag>}
              </h2>
              <p>{diaChi.sdt_nguoi_nhan}</p>
              <p>{noiDungDiaChi(diaChi)}</p>
              <div className="cac-nut-kiem-dinh">
                <Button disabled={dangXoa} onClick={() => datDangSua(diaChi)}>
                  Sửa địa chỉ
                </Button>
                <Button danger disabled={dangXoa} onClick={() => xoa(diaChi)}>
                  Xóa
                </Button>
              </div>
            </section>
          ))}
        </div>
      </ChoDuLieu>
      <Modal
        title={dangSua ? 'Sửa địa chỉ' : 'Thêm địa chỉ'}
        open={dangSua !== undefined}
        footer={null}
        destroyOnHidden
        closable={!dangLuu}
        mask={{ closable: !dangLuu }}
        onCancel={() => !dangLuu && datDangSua(undefined)}
      >
        <BieuMauDiaChi
          key={dangSua?.id || 'moi'}
          diaChi={dangSua || undefined}
          dangXuLy={datDangLuu}
          daLuu={() => {
            datDangSua(undefined);
            message.success('Đã lưu địa chỉ nhận hàng');
          }}
        />
      </Modal>
    </>
  );
}
