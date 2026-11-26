import { test, expect } from '@playwright/test';
import { dangNhap } from './ho-tro';

test('Gợi ý từ ảnh: xem trước, xác nhận, chọn từng trường và chỉ điền vào form', async ({
  page,
}) => {
  const png =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a5l8AAAAASUVORK5CYII=';
  let daGoiAI = false;
  await page.route('**/api/listing-support/status', (r) =>
    r.fulfill({ json: { success: true, data: { ai_san_sang: true } } }),
  );
  await page.route('**/api/listing-support/photos/prepare', (r) =>
    r.fulfill({
      json: {
        success: true,
        data: {
          ma: 'test-preview',
          anh: Array(3).fill(`data:image/png;base64,${png}`),
          thong_bao: 'Kiểm tra ảnh đã che trước khi gửi.',
        },
      },
    }),
  );
  await page.route('**/api/listing-support/photos/suggest', (r) => {
    daGoiAI = true;
    return r.fulfill({
      json: {
        success: true,
        data: {
          goi_y: {
            danh_muc_id: '1',
            tieu_de: 'Bình gốm từ ảnh',
            mo_ta: 'Bình gốm màu sáng nhìn từ ba góc.',
            tinh_trang_san_pham: null,
            thuoc_tinh: [],
            can_bo_sung: ['Bạn tự xác nhận nguồn gốc và serial.'],
          },
          thong_bao: 'Bản gợi ý chưa lưu.',
        },
      },
    });
  });
  await dangNhap(page, 'seller', '/nguoi-ban/san-pham/moi');
  await page.getByText('Gợi ý hồ sơ từ 3–5 ảnh sản phẩm', { exact: true }).click();
  await page.locator('.dang-ban-tu-anh input[type=file]').setInputFiles(
    [0, 1, 2].map((i) => ({
      name: `photo-${i}.png`,
      mimeType: 'image/png',
      buffer: Buffer.from(png, 'base64'),
    })),
  );
  await page.getByRole('button', { name: 'Chuẩn bị ảnh để xem lại' }).click();
  await expect(page.getByAltText('Ảnh đã che chữ 1')).toBeVisible();
  expect(daGoiAI).toBe(false);
  const nutAI = page.getByRole('button', { name: 'Gợi ý hồ sơ từ ảnh đã kiểm tra' });
  await expect(nutAI).toBeDisabled();
  await page.getByRole('checkbox', { name: /Tôi đã kiểm tra từng ảnh/ }).check();
  await nutAI.click();
  await expect(page.getByText('Bình gốm từ ảnh', { exact: true })).toBeVisible();
  await page.screenshot({ path: 'test-results/goi-y-tu-anh.png', fullPage: true });
  await expect(page.getByLabel('Tên sản phẩm', { exact: true })).toHaveValue('');
  await page.getByRole('checkbox', { name: 'Tiêu đề', exact: true }).check();
  await page.getByRole('button', { name: 'Điền các trường đã chọn vào form' }).click();
  await expect(page.getByLabel('Tên sản phẩm', { exact: true })).toHaveValue('Bình gốm từ ảnh');
  await expect(page.getByLabel('Mô tả chi tiết', { exact: true })).toHaveValue('');
  await expect(page.getByText('Có thay đổi chưa lưu', { exact: true })).toBeVisible();
});

test('Thiếu AI vẫn dùng được form đăng bán và không hiện chatbot', async ({ page }) => {
  await page.route('**/api/listing-support/status', (r) =>
    r.fulfill({ json: { success: true, data: { ai_san_sang: false } } }),
  );
  await dangNhap(page, 'seller', '/nguoi-ban/san-pham/moi');
  await page.getByText('Gợi ý hồ sơ từ 3–5 ảnh sản phẩm', { exact: true }).click();
  await expect(
    page.getByText('AI chưa được bật. Bạn vẫn điền hồ sơ và đăng bán bình thường.'),
  ).toBeVisible();
  await expect(page.getByLabel('Tên sản phẩm', { exact: true })).toBeEditable();
  await expect(page.getByText('Hỏi trợ lý VietBid', { exact: true })).toHaveCount(0);
});

test('Cảnh báo chỉ từ AI vẫn hiện mức cảnh báo; lưu bản mới xóa kết quả quét cũ', async ({
  page,
}) => {
  await page.route('**/api/listing-support/status', (r) =>
    r.fulfill({ json: { success: true, data: { ai_san_sang: true } } }),
  );
  await dangNhap(
    page,
    'seller',
    `/nguoi-ban/san-pham?q=${encodeURIComponent('Sản phẩm kiểm thử duyệt trực tiếp')}`,
  );
  const lienKet = page.getByRole('link', {
    name: 'Sản phẩm kiểm thử duyệt trực tiếp',
    exact: true,
  });
  const duongDan = await lienKet.getAttribute('href');
  const id = duongDan!.split('/').at(-1);
  const coBan = { canh_bao: [], anh_chua_doi_chieu: 0 };
  let banDaLuu: Record<string, unknown>;
  await page.route(`**/api/products/${id}`, async (r) => {
    if (r.request().method() === 'PUT') {
      banDaLuu = {
        ...banDaLuu,
        tieu_de: r.request().postDataJSON().tieu_de,
        kiem_duyet_noi_dung: {
          ...coBan,
          canh_bao: [{ ma: 'LIEN_HE', noi_dung: 'Cảnh báo bản đã lưu mới' }],
        },
      };
      await r.fulfill({ json: { success: true, data: banDaLuu } });
      return;
    }
    const phanHoi = await r.fetch();
    const json = await phanHoi.json();
    json.data.co_the_sua = true;
    json.data.kiem_duyet_noi_dung = coBan;
    banDaLuu = json.data;
    await r.fulfill({ json });
  });
  await page.route(`**/api/listing-support/products/${id}/review`, (r) =>
    r.fulfill({
      json: {
        success: true,
        data: {
          ...coBan,
          canh_bao_ai: [{ ma: 'MAU_THUAN_THUOC_TINH', noi_dung: 'Cảnh báo AI của bản cũ' }],
        },
      },
    }),
  );
  await lienKet.click();
  await page.getByRole('button', { name: 'Nhờ AI rà soát thêm' }).click();
  const canhBao = page.locator('.kiem-duyet-tin');
  await expect(canhBao.locator('.ant-alert-warning')).toContainText(
    'Cần đối chiếu trước khi gửi hoặc duyệt',
  );
  await expect(canhBao).toContainText('Cảnh báo AI của bản cũ');
  // Chỉ đổi tiêu đề, giữ nguyên mô tả/số ảnh để kiểm tra không phụ thuộc key cũ.
  await page.getByLabel('Tên sản phẩm', { exact: true }).fill('Tin đăng mới có Zalo');
  await page.getByRole('button', { name: 'Lưu bản nháp', exact: true }).click();
  await expect(canhBao).toContainText('Cảnh báo bản đã lưu mới');
  await expect(canhBao).not.toContainText('Cảnh báo AI của bản cũ');
});

test('Tham khảo giá báo thiếu mẫu sau tải thành công và không hiện khi đang tải hoặc lỗi', async ({
  page,
}) => {
  await page.route('**/api/products/mine?**', (r) =>
    r.fulfill({
      json: {
        success: true,
        data: ['987601', '987602'].map((id) => ({
          id,
          tieu_de: `Sản phẩm tham khảo ${id}`,
          danh_muc_id: '1',
          anh_chinh: null,
          tinh_trang_san_pham: 'DA_QUA_SU_DUNG',
          trang_thai_duyet: 'DA_DUYET',
        })),
      },
    }),
  );
  let traKetQua!: () => void;
  const choKetQua = new Promise<void>((resolve) => {
    traKetQua = resolve;
  });
  await page.route('**/api/listing-support/products/987601/prices', async (r) => {
    await choKetQua;
    await r.fulfill({ json: { success: true, data: null } });
  });
  await page.route('**/api/listing-support/products/987602/prices', (r) =>
    r.fulfill({ status: 500, json: { success: false, message: 'Lỗi kiểm thử' } }),
  );
  await dangNhap(page, 'seller', '/nguoi-ban/phien/moi');
  const thongBao = page.getByText(
    'Chưa đủ 5 món cùng danh mục đã bán trong 12 tháng để tham khảo giá.',
    { exact: true },
  );
  const dangTai = page.waitForRequest('**/api/listing-support/products/987601/prices');
  await page.getByRole('button', { name: /Sản phẩm tham khảo 987601/ }).click();
  await dangTai;
  await expect(thongBao).toHaveCount(0);
  traKetQua();
  await expect(thongBao).toBeVisible();
  const loi = page.waitForResponse('**/api/listing-support/products/987602/prices');
  await page.getByRole('button', { name: /Sản phẩm tham khảo 987602/ }).click();
  await loi;
  await expect(thongBao).toHaveCount(0);
  await expect(page.getByText(/Giá thực bán tham khảo:/)).toHaveCount(0);
});
