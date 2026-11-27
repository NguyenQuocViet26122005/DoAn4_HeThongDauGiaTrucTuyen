import { expect, test } from '@playwright/test';
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

test('Web app có manifest, biểu tượng và cấu hình mở trên iPhone', async ({ page, request }) => {
  await page.goto('/');
  const manifestUrl = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(manifestUrl).toBeTruthy();
  const response = await request.get(manifestUrl!);
  expect(response.ok()).toBeTruthy();
  expect(response.headers()['content-type']).toContain('application/manifest+json');
  const manifest = await response.json();
  expect(manifest).toMatchObject({
    name: 'VietBid',
    display: 'standalone',
    start_url: '/',
    scope: '/',
  });
  expect(manifest.icons.length).toBeGreaterThanOrEqual(2);

  const appleIcon = await page.locator('link[rel="apple-touch-icon"]').getAttribute('href');
  const images = [...manifest.icons, { src: appleIcon, sizes: '180x180' }];
  for (const icon of images) {
    const dimensions = await page.evaluate(async (src: string) => {
      const image = new Image();
      image.src = src;
      await image.decode();

      return `${image.naturalWidth}x${image.naturalHeight}`;
    }, icon.src);
    expect(dimensions).toBe(icon.sizes);
  }

  await expect(page.locator('meta[name="apple-mobile-web-app-capable"]')).toHaveAttribute(
    'content',
    'yes',
  );
  const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
  expect(viewport).not.toMatch(/user-scalable\s*=\s*no|maximum-scale\s*=\s*1(?:\D|$)/);
});

test('Liên kết cài iPhone mở đúng hướng dẫn Safari', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Cài VietBid trên iPhone', exact: true }).click();
  const guide = page.getByRole('region', { name: 'VietBid trên màn hình chính iPhone' });
  await expect(guide).toBeVisible();
  await expect(guide.getByRole('heading')).toBeInViewport();
  await expect(guide.getByRole('listitem')).toHaveCount(3);
  await expect(guide).toContainText('Cần kết nối Internet');
  await expect(guide.getByRole('link', { name: 'Xem hướng dẫn của Apple' })).toHaveAttribute(
    'href',
    /^https:\/\/support\.apple\.com\//,
  );
  await kiemTraBoCuc(page);
});

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
