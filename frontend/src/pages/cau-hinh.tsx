import { Alert, Button, Form, InputNumber, Select, Switch } from 'antd';
import BieuMauThaoTac from '../components/bieu-mau-thao-tac';
import { ChoDuLieu, TieuDe } from '../components/dung-chung';
import { useDuLieu } from '../hooks/su-dung-du-lieu';
import { boNho, gui } from '../services/api';

interface CauHinh {
  khoa_cau_hinh: string;
  gia_tri_cau_hinh: string;
}
interface ChinhSachCoc {
  bat: boolean;
  kieu: 'TY_LE' | 'CO_DINH';
  gia_tri: number;
}
interface BuocGia {
  gia_tu: string;
  gia_den: string | null;
  muc_tang_gia: string;
}

const cacThoiHan: [string, string, number][] = [
  ['PAYMENT_DEADLINE_HOURS', 'Hạn thanh toán (giờ)', 48],
  ['SELLER_SHIP_DEADLINE_DAYS', 'Hạn gửi hàng (ngày)', 3],
  ['BUYER_INSPECTION_DAYS', 'Thời gian kiểm tra hàng (ngày)', 3],
  ['ANTI_SNIPE_THRESHOLD_SECONDS', 'Ngưỡng gia hạn cuối phiên (giây)', 60],
  ['ANTI_SNIPE_EXTENSION_SECONDS', 'Thời gian gia hạn thêm (giây)', 90],
  ['SECOND_CHANCE_EXPIRE_HOURS', 'Hạn đề nghị mua tiếp (giờ)', 24],
  ['BUYER_NON_RECEIPT_DAYS', 'Mốc khiếu nại chưa nhận hàng (ngày)', 7],
];

async function lamMoi() {
  await Promise.all([
    boNho.invalidateQueries({ queryKey: ['/admin/config'] }),
    boNho.invalidateQueries({ queryKey: ['/bid-increments'] }),
  ]);
}

function CauHinhCoc({ giaTri }: { giaTri: string | undefined }) {
  let chinhSach: ChinhSachCoc;

  try {
    chinhSach = JSON.parse(giaTri || 'null');
    if (
      !chinhSach ||
      typeof chinhSach.bat !== 'boolean' ||
      !['TY_LE', 'CO_DINH'].includes(chinhSach.kieu) ||
      !Number.isSafeInteger(chinhSach.gia_tri)
    ) {
      throw new Error('Cấu hình cọc không hợp lệ');
    }
  } catch {
    return (
      <Alert
        type="error"
        title="Chưa đọc được chính sách cọc hợp lệ. Hãy kiểm tra cấu hình backend trước khi thay đổi."
      />
    );
  }

  return (
    <section className="tam-noi-dung">
      <h2>Chính sách đặt cọc</h2>
      <p>
        {chinhSach.bat ? 'Đang bật' : 'Đang tắt'} · {chinhSach.gia_tri.toLocaleString('vi-VN')}{' '}
        {chinhSach.kieu === 'TY_LE' ? '% giá khởi điểm' : 'đồng'}
      </p>
      <p>Chỉ áp dụng cho phiên tạo sau khi lưu. Các phiên đã tạo giữ nguyên chính sách cọc.</p>
      <BieuMauThaoTac<ChinhSachCoc>
        key={giaTri}
        ten="Sửa chính sách cọc"
        banDau={chinhSach}
        xacNhan={(giaTriMoi) => (
          <p>
            {giaTriMoi.bat ? 'Bật' : 'Tắt'} cọc cho phiên mới; mức cọc{' '}
            {giaTriMoi.gia_tri.toLocaleString('vi-VN')}{' '}
            {giaTriMoi.kieu === 'TY_LE' ? '% giá khởi điểm' : 'đồng'}.
          </p>
        )}
        onGui={async (giaTriMoi) => {
          await gui('/admin/config/DEPOSIT_POLICY', { gia_tri_cau_hinh: giaTriMoi }, 'put');
          await lamMoi();
        }}
      >
        <Form.Item name="bat" label="Yêu cầu cọc cho phiên mới" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item name="kieu" label="Cách tính" rules={[{ required: true }]}>
          <Select
            options={[
              { value: 'TY_LE', label: 'Tỷ lệ giá khởi điểm (%)' },
              { value: 'CO_DINH', label: 'Số tiền cố định (đồng)' },
            ]}
          />
        </Form.Item>
        <Form.Item
          name="gia_tri"
          label="Giá trị"
          dependencies={['kieu']}
          rules={[
            { required: true, message: 'Nhập mức cọc.' },
            ({ getFieldValue }) => ({
              validator: (_, giaTriMoi) =>
                Number.isSafeInteger(giaTriMoi) &&
                giaTriMoi > 0 &&
                giaTriMoi <= (getFieldValue('kieu') === 'TY_LE' ? 100 : 9999999999999)
                  ? Promise.resolve()
                  : Promise.reject(new Error('Nhập số nguyên dương; tỷ lệ tối đa 100%.')),
            }),
          ]}
        >
          <InputNumber min={1} max={9999999999999} precision={0} />
        </Form.Item>
      </BieuMauThaoTac>
    </section>
  );
}

function CauHinhBuocGia() {
  const truyVan = useDuLieu<BuocGia[]>('/bid-increments');

  return (
    <section className="tam-noi-dung">
      <h2>Bước giá</h2>
      <p>
        Chỉ được thay đổi khi không còn phiên chờ hoặc đang hoạt động. Các khoảng bắt đầu từ 0, liên
        tục và không chồng lấn; đầu khoảng kế tiếp bằng cuối khoảng trước cộng 0,01 đồng. Để trống
        giá đến của khoảng cuối.
      </p>
      <ChoDuLieu truyVan={truyVan}>
        <div className="bang-cuon">
          <table className="bang-du-lieu">
            <thead>
              <tr>
                <th>Giá từ (đồng)</th>
                <th>Giá đến (đồng)</th>
                <th>Bước tăng (đồng)</th>
              </tr>
            </thead>
            <tbody>
              {truyVan.data?.map((muc, viTri) => (
                <tr key={viTri}>
                  <td>{muc.gia_tu}</td>
                  <td>{muc.gia_den ?? 'Không giới hạn'}</td>
                  <td>{muc.muc_tang_gia}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {truyVan.data && (
          <BieuMauThaoTac<{ buoc_gia: BuocGia[] }>
            key={JSON.stringify(truyVan.data)}
            ten="Sửa bộ bước giá"
            banDau={{
              buoc_gia: truyVan.data.map(({ gia_tu, gia_den, muc_tang_gia }) => ({
                gia_tu,
                gia_den,
                muc_tang_gia,
              })),
            }}
            xacNhan={({ buoc_gia }) => (
              <>
                <p>Thay toàn bộ bước giá bằng {buoc_gia.length} khoảng:</p>
                {buoc_gia.map((muc, viTri) => (
                  <p key={viTri}>
                    {muc.gia_tu} → {muc.gia_den ?? 'Không giới hạn'}: tăng {muc.muc_tang_gia} đồng.
                  </p>
                ))}
              </>
            )}
            onGui={async ({ buoc_gia }) => {
              await gui(
                '/admin/bid-increments',
                { buoc_gia: buoc_gia.map((muc) => ({ ...muc, gia_den: muc.gia_den ?? null })) },
                'put',
              );
              await lamMoi();
            }}
          >
            <Form.List
              name="buoc_gia"
              rules={[
                {
                  validator: (_, giaTri) =>
                    giaTri?.length >= 1 && giaTri.length <= 50
                      ? Promise.resolve()
                      : Promise.reject(new Error('Cần từ 1 đến 50 khoảng.')),
                },
              ]}
            >
              {(cacTruong, { add, remove }, { errors }) => (
                <>
                  {cacTruong.map(({ key, name }) => (
                    <section className="tam-noi-dung" key={key}>
                      <Form.Item
                        name={[name, 'gia_tu']}
                        label="Giá từ (đồng)"
                        rules={[{ required: true, message: 'Nhập giá bắt đầu.' }]}
                      >
                        <InputNumber stringMode min="0" max="9999999999999.99" precision={2} />
                      </Form.Item>
                      <Form.Item name={[name, 'gia_den']} label="Giá đến (trống = không giới hạn)">
                        <InputNumber stringMode min="0" max="9999999999999.99" precision={2} />
                      </Form.Item>
                      <Form.Item
                        name={[name, 'muc_tang_gia']}
                        label="Bước tăng (đồng)"
                        rules={[{ required: true, message: 'Nhập bước tăng.' }]}
                      >
                        <InputNumber stringMode min="1" max="9999999999999" precision={0} />
                      </Form.Item>
                      <Button onClick={() => remove(name)}>Bỏ khoảng này</Button>
                    </section>
                  ))}
                  <Button disabled={cacTruong.length >= 50} onClick={() => add({ gia_den: null })}>
                    Thêm khoảng giá
                  </Button>
                  <Form.ErrorList errors={errors} />
                </>
              )}
            </Form.List>
          </BieuMauThaoTac>
        )}
      </ChoDuLieu>
    </section>
  );
}

export default function CauHinhHeThong() {
  const truyVan = useDuLieu<CauHinh[]>('/admin/config');

  return (
    <>
      <TieuDe
        ten="Cấu hình hệ thống"
        moTa="Các thay đổi được ghi nhật ký. Thời hạn đã lưu trên phiên và đơn không được tính lại khi sửa cấu hình."
      >
        <Button loading={truyVan.isFetching} onClick={() => void lamMoi()}>
          Làm mới
        </Button>
      </TieuDe>
      <ChoDuLieu truyVan={truyVan}>
        {truyVan.data && (
          <>
            <CauHinhCoc
              giaTri={
                truyVan.data.find((muc) => muc.khoa_cau_hinh === 'DEPOSIT_POLICY')?.gia_tri_cau_hinh
              }
            />
            <section className="tam-noi-dung">
              <h2>Thời hạn nghiệp vụ</h2>
              {cacThoiHan.map(([khoa, ten, macDinh]) => {
                const giaTri = Number(
                  truyVan.data?.find((muc) => muc.khoa_cau_hinh === khoa)?.gia_tri_cau_hinh ??
                    macDinh,
                );

                return (
                  <div className="tam-noi-dung" key={khoa}>
                    <p>
                      {ten}: <strong>{giaTri}</strong>
                    </p>
                    <BieuMauThaoTac<{ gia_tri_cau_hinh: number }>
                      key={giaTri}
                      ten={`Sửa ${ten.toLowerCase()}`}
                      banDau={{ gia_tri_cau_hinh: giaTri }}
                      xacNhan={(muc) => (
                        <p>
                          {ten}: đổi từ {giaTri} thành {muc.gia_tri_cau_hinh}?
                        </p>
                      )}
                      onGui={async (muc) => {
                        await gui(`/admin/config/${khoa}`, muc, 'put');
                        await lamMoi();
                      }}
                    >
                      <Form.Item name="gia_tri_cau_hinh" label={ten} rules={[{ required: true }]}>
                        <InputNumber min={1} max={87600} precision={0} />
                      </Form.Item>
                    </BieuMauThaoTac>
                  </div>
                );
              })}
            </section>
          </>
        )}
      </ChoDuLieu>
      <CauHinhBuocGia />
    </>
  );
}
