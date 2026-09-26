import { useEffect, useState } from 'react';
import { App, Button, Empty, Tag } from 'antd';
import { AnhSanPham } from './dung-chung';
import type { AnhSanPham as DuLieuAnh } from '../types/san-pham';
import { loiDeDoc, taiTep } from '../services/api';
import { chonAnhChinh, ganAnh, xoaAnh } from '../services/san-pham';

interface TepCho {
  id: string;
  tep: File;
  url?: string;
  loi?: string;
}

export default function AnhSanPhamNguoiBan({
  sanPhamId,
  danhSach,
  coTheSua,
  dangXuLy,
  datDangXuLy,
  datSoAnhCho,
  lamMoi,
}: {
  sanPhamId: string;
  danhSach: DuLieuAnh[];
  coTheSua: boolean;
  dangXuLy: boolean;
  datDangXuLy: (giaTri: boolean) => void;
  datSoAnhCho: (so: number) => void;
  lamMoi: () => Promise<unknown>;
}) {
  const { message, modal } = App.useApp();
  const [tepCho, datTepCho] = useState<TepCho[]>([]);
  const [tienDo, datTienDo] = useState('');

  useEffect(() => {
    datSoAnhCho(tepCho.length);
  }, [tepCho.length, datSoAnhCho]);

  async function taiDanhSach() {
    datDangXuLy(true);

    try {
      for (const [viTri, muc] of tepCho.entries()) {
        datTienDo(`Đang tải ảnh ${viTri + 1}/${tepCho.length}…`);

        try {
          const url = muc.url || (await taiTep(muc.tep, 'product'));

          // Giữ URL đã tải để thử lại bước gắn ảnh mà không tạo thêm tệp.
          datTepCho((cu) =>
            cu.map((t) =>
              t.id === muc.id
                ? {
                    ...t,
                    url,
                    loi: undefined,
                  }
                : t,
            ),
          );
          await ganAnh(sanPhamId, url);
          datTepCho((cu) => cu.filter((t) => t.id !== muc.id));
        } catch (loi) {
          datTepCho((cu) => cu.map((t) => (t.id === muc.id ? { ...t, loi: loiDeDoc(loi) } : t)));
        }
      }

      await lamMoi();
    } finally {
      datTienDo('');
      datDangXuLy(false);
    }
  }

  async function suaAnh(thaoTac: () => Promise<unknown>) {
    datDangXuLy(true);

    try {
      await thaoTac();
      await lamMoi();
      message.success('Đã cập nhật ảnh sản phẩm');
    } catch (loi) {
      message.error(loiDeDoc(loi));
    } finally {
      datDangXuLy(false);
    }
  }

  return (
    <section className="tam-noi-dung anh-nguoi-ban">
      <div className="tieu-de-khoi-san-pham">
        <h2>02. Hình ảnh sản phẩm</h2>
        <span>{danhSach.length}/12 ảnh đã lưu</span>
      </div>
      <p>
        Chụp toàn cảnh, các góc chi tiết và điểm trầy xước nếu có. Ảnh đại diện sẽ xuất hiện trong
        danh sách sản phẩm.
      </p>
      {danhSach.length === 0 && (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có ảnh sản phẩm" />
      )}
      <div className="luoi-anh-nguoi-ban">
        {danhSach.map((anh, viTri) => (
          <article key={anh.id}>
            <AnhSanPham src={anh.duong_dan_anh} ten={`Ảnh sản phẩm ${viTri + 1}`} />
            <div className="hanh-dong-anh">
              {anh.la_anh_chinh ? (
                <Tag color="gold">Ảnh đại diện</Tag>
              ) : (
                coTheSua && (
                  <Button
                    size="small"
                    disabled={dangXuLy}
                    onClick={() => void suaAnh(() => chonAnhChinh(sanPhamId, anh.id))}
                  >
                    Đặt làm đại diện
                  </Button>
                )
              )}
              {coTheSua && (
                <Button
                  size="small"
                  danger
                  disabled={dangXuLy}
                  aria-label={`Bỏ ảnh ${viTri + 1}`}
                  onClick={() =>
                    modal.confirm({
                      title: 'Bỏ ảnh khỏi sản phẩm?',
                      content: 'Nếu bỏ ảnh đại diện, ảnh còn lại đầu tiên sẽ được chọn thay thế.',
                      okText: 'Bỏ ảnh',
                      cancelText: 'Giữ lại',
                      onOk: () => suaAnh(() => xoaAnh(sanPhamId, anh.id)),
                    })
                  }
                >
                  Bỏ ảnh
                </Button>
              )}
            </div>
          </article>
        ))}
      </div>
      {coTheSua && (
        <>
          <label className="chon-tep chon-anh-san-pham">
            <strong>+ Chọn ảnh từ máy tính</strong>
            <small>JPG, PNG hoặc WebP · tối đa 5 MB/ảnh · có thể chọn nhiều ảnh</small>
            <input
              type="file"
              multiple
              aria-label="Chọn ảnh sản phẩm"
              accept="image/png,image/jpeg,image/webp"
              disabled={dangXuLy || danhSach.length + tepCho.length >= 12}
              onChange={(suKien) => {
                const tep = Array.from(suKien.target.files || []);

                suKien.target.value = '';
                if (tep.length + danhSach.length + tepCho.length > 12) {
                  message.error('Mỗi sản phẩm tối đa 12 ảnh. Vui lòng chọn ít ảnh hơn.');

                  return;
                }

                const hopLe = tep.filter((t) => {
                  if (
                    !['image/png', 'image/jpeg', 'image/webp'].includes(t.type) ||
                    t.size === 0 ||
                    t.size > 5 * 1024 * 1024
                  ) {
                    message.error(`${t.name}: cần ảnh JPG, PNG hoặc WebP không quá 5 MB.`);

                    return false;
                  }

                  return true;
                });

                datTepCho((cu) => [
                  ...cu,
                  ...hopLe.map((tep) => ({ id: crypto.randomUUID(), tep })),
                ]);
              }}
            />
          </label>
          {tepCho.length > 0 && (
            <div className="tep-cho-tai">
              {tepCho.map((muc) => (
                <div key={muc.id}>
                  <span>
                    {muc.tep.name}
                    <small className={muc.loi ? 'loi-tep' : ''}>
                      {muc.loi || 'Chưa gắn vào sản phẩm'}
                    </small>
                  </span>
                  <Button
                    disabled={dangXuLy}
                    onClick={() => datTepCho((cu) => cu.filter((t) => t.id !== muc.id))}
                  >
                    Bỏ chọn
                  </Button>
                </div>
              ))}
              <Button type="primary" loading={dangXuLy} onClick={() => void taiDanhSach()}>
                Tải {tepCho.length} ảnh đã chọn
              </Button>
            </div>
          )}
          <div role="status" aria-live="polite">
            {tienDo}
          </div>
        </>
      )}
    </section>
  );
}
