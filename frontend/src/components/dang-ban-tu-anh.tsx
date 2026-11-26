import { useState } from 'react';
import { Alert, Button, Checkbox, Input } from 'antd';
import { useDuLieu } from '../hooks/su-dung-du-lieu';
import { loiDeDoc } from '../services/api';
import { chuanBiAnh, goiYAnh, type BanXemAnh, type GoiYAnh } from '../services/ho-tro-dang-ban';
import type { BieuMauSanPham, ThuocTinhDanhMuc } from '../types/san-pham';
import type { DanhMuc } from '../types/du-lieu';
import { nhan } from '../utils/dinh-dang';
import '../styles/ho-tro-dang-ban.css';

export default function DangBanTuAnh({
  disabled,
  apDung,
}: {
  disabled: boolean;
  apDung: (giaTri: Partial<BieuMauSanPham>) => void;
}) {
  const status = useDuLieu<{ ai_san_sang: boolean }>('/listing-support/status');
  const danhMuc = useDuLieu<DanhMuc[]>('/categories');
  const [files, datFiles] = useState<File[]>([]);
  const [preview, datPreview] = useState<BanXemAnh>();
  const [goiY, datGoiY] = useState<GoiYAnh>();
  const [ghiChu, datGhiChu] = useState('');
  const [dongY, datDongY] = useState(false);
  const [chon, datChon] = useState<string[]>([]);
  const [loi, datLoi] = useState('');
  const [dangTai, datDangTai] = useState(false);
  const thuocTinh = useDuLieu<ThuocTinhDanhMuc[]>(
    `/categories/${goiY?.danh_muc_id}/attributes`,
    undefined,
    !!goiY,
  );

  async function chay(congViec: () => Promise<void>) {
    datDangTai(true);
    datLoi('');
    try {
      await congViec();
    } catch (e) {
      datLoi(loiDeDoc(e));
    } finally {
      datDangTai(false);
    }
  }

  function tick(k: string, bat: boolean) {
    datChon((cu) => (bat ? [...cu, k] : cu.filter((x) => x !== k)));
  }

  const truong = goiY
    ? [
        {
          k: 'danh_muc_id',
          ten: 'Danh mục',
          value:
            danhMuc.data?.find((c) => String(c.id) === goiY.danh_muc_id)?.ten ?? goiY.danh_muc_id,
        },
        {
          k: 'tieu_de',
          ten: 'Tiêu đề',
          value: goiY.tieu_de,
        },
        {
          k: 'tinh_trang_san_pham',
          ten: 'Tình trạng',
          value: goiY.tinh_trang_san_pham ? nhan(goiY.tinh_trang_san_pham) : null,
        },
        {
          k: 'mo_ta',
          ten: 'Mô tả',
          value: goiY.mo_ta,
        },
        ...goiY.thuoc_tinh.map((t) => ({
          k: `tt:${t.thuoc_tinh_id}`,
          ten:
            thuocTinh.data?.find((dd) => String(dd.id) === t.thuoc_tinh_id)?.ten_thuoc_tinh ??
            'Thuộc tính',
          value: t.gia_tri,
        })),
      ].filter((t) => t.value)
    : [];

  return (
    <details className="dang-ban-tu-anh">
      <summary>Gợi ý hồ sơ từ 3–5 ảnh sản phẩm</summary>
      {!status.data?.ai_san_sang ? (
        <p>AI chưa được bật. Bạn vẫn điền hồ sơ và đăng bán bình thường.</p>
      ) : (
        <fieldset disabled={disabled || dangTai}>
          <p>
            Chọn ảnh sản phẩm không chứa người, giấy tờ, địa chỉ hoặc thông tin liên hệ. Ảnh được bỏ
            thông tin vị trí và che chữ trên máy chủ trước khi bạn xem lại.
          </p>
          <label>
            Ảnh để gợi ý (JPEG, PNG, WebP; tối đa 5 MB mỗi ảnh)
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) => {
                datFiles(Array.from(e.target.files ?? []));
                datPreview(undefined);
                datGoiY(undefined);
                datDongY(false);
                datChon([]);
              }}
            />
          </label>
          <Button
            disabled={
              files.length < 3 || files.length > 5 || files.some((f) => f.size > 5 * 1024 * 1024)
            }
            onClick={() =>
              void chay(async () => {
                datPreview(await chuanBiAnh(files));
                datGoiY(undefined);
                datDongY(false);
              })
            }
          >
            Chuẩn bị ảnh để xem lại
          </Button>
          {preview && (
            <>
              <Alert type="info" title={preview.thong_bao} />
              <div className="anh-da-che">
                {preview.anh.map((url, i) => (
                  <img key={i} src={url} alt={`Ảnh đã che chữ ${i + 1}`} />
                ))}
              </div>
              <label>
                Ghi chú ngắn về món đồ
                <Input.TextArea
                  value={ghiChu}
                  onChange={(e) => datGhiChu(e.target.value)}
                  maxLength={500}
                  rows={2}
                />
              </label>
              <Checkbox checked={dongY} onChange={(e) => datDongY(e.target.checked)}>
                Tôi đã kiểm tra từng ảnh và ghi chú, không còn thông tin cá nhân; đồng ý gửi bản ảnh
                đã che và ghi chú đến OpenAI.
              </Checkbox>
              <Button
                disabled={!dongY}
                onClick={() =>
                  void chay(async () => {
                    datGoiY(undefined);
                    datChon([]);

                    const q = await goiYAnh(preview.ma, ghiChu);

                    if (!q.goi_y) {
                      datLoi(q.thong_bao);
                    } else {
                      datGoiY(q.goi_y);
                    }
                  })
                }
              >
                Gợi ý hồ sơ từ ảnh đã kiểm tra
              </Button>
            </>
          )}
          {goiY && (
            <>
              <p>
                Chọn từng trường bạn đã kiểm tra. Để áp dụng thuộc tính, chọn cả danh mục tương ứng.
                Ô không chắc chắn vẫn cần bạn điền.
              </p>
              {truong.map((t) => (
                <div className="truong-goi-y" key={t.k}>
                  <Checkbox
                    checked={chon.includes(t.k)}
                    onChange={(e) => tick(t.k, e.target.checked)}
                  >
                    {t.ten}
                  </Checkbox>
                  <p>{t.value}</p>
                </div>
              ))}
              <ul>
                {goiY.can_bo_sung.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
              <Button
                type="primary"
                disabled={
                  !chon.length ||
                  thuocTinh.isPending ||
                  thuocTinh.isError ||
                  (chon.some((k) => k.startsWith('tt:')) && !chon.includes('danh_muc_id'))
                }
                onClick={() => {
                  const d: Partial<BieuMauSanPham> = {};

                  for (const k of [
                    'tieu_de',
                    'mo_ta',
                    'danh_muc_id',
                    'tinh_trang_san_pham',
                  ] as const) {
                    if (chon.includes(k) && goiY[k]) {
                      d[k] = goiY[k]!;
                    }
                  }
                  if (chon.includes('danh_muc_id')) {
                    d.gia_tri = Object.fromEntries(
                      goiY.thuoc_tinh
                        .filter((t) => chon.includes(`tt:${t.thuoc_tinh_id}`))
                        .map((t) => [t.thuoc_tinh_id, t.gia_tri]),
                    );
                  }
                  apDung(d);
                  datGoiY(undefined);
                }}
              >
                Điền các trường đã chọn vào form
              </Button>
              <small>
                Chưa lưu hồ sơ hoặc gửi duyệt. Sau khi lưu, thêm ảnh gốc trong bước Hình ảnh sản
                phẩm.
              </small>
            </>
          )}
        </fieldset>
      )}
      {dangTai && <p role="status">Đang xử lý ảnh và chuẩn bị gợi ý…</p>}
      {loi && <Alert type="warning" title={loi} />}
    </details>
  );
}
