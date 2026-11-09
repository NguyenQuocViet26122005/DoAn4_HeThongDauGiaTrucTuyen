import { test } from '@playwright/test';
import { dangNhap, kiemTraBoCuc, type VaiTro } from './ho-tro';

// Chạy ở cả cỡ máy tính và điện thoại (xem playwright.config.ts).
const TRANG_CONG_KHAI = ['/', '/kham-pha', '/huong-dan', '/dang-nhap', '/dang-ky'];
const TRANG_THEO_VAI_TRO: [VaiTro, string[]][] = [
  [
    'a',
    [
      '/tai-khoan',
      '/tai-khoan/dia-chi',
      '/tai-khoan/thong-bao',
      '/tai-khoan/don-hang',
      '/tai-khoan/da-dau-gia',
      '/tai-khoan/de-nghi',
      '/tai-khoan/tranh-chap',
    ],
  ],
  ['seller', ['/nguoi-ban/san-pham', '/nguoi-ban/phien', '/nguoi-ban/don-hang']],
  ['admin', ['/quan-tri', '/quan-tri/don-hang', '/quan-tri/san-pham', '/quan-tri/nguoi-dung']],
];

test('Trang công khai không tràn, không bóp cột', async ({ page }) => {
  for (const duongDan of TRANG_CONG_KHAI) {
    await page.goto(duongDan);
    await page.locator('main').first().waitFor();
    await kiemTraBoCuc(page);
  }
});

for (const [vaiTro, cacTrang] of TRANG_THEO_VAI_TRO) {
  test(`Trang làm việc của ${vaiTro} không tràn, không bóp cột`, async ({ page }) => {
    await dangNhap(page, vaiTro, cacTrang[0]);

    for (const duongDan of cacTrang) {
      await page.goto(duongDan);
      await page.locator('.noi-dung-lam-viec h1').first().waitFor();
      await page.waitForLoadState('networkidle');
      await kiemTraBoCuc(page);
    }
  });
}
