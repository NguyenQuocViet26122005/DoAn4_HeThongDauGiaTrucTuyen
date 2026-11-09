import { expect, test } from '@playwright/test';
import { dangNhap, emailThu, MAT_KHAU_THU, moPhien } from './ho-tro';

// Các luồng ghi dữ liệu chỉ chạy ở cỡ máy tính; dữ liệu nằm trong transaction thử
// của backend và được hoàn tác khi máy chủ thử dừng.
test.describe.configure({ mode: 'serial' });

test('Đăng nhập bằng biểu mẫu đưa người dùng vào trang tài khoản', async ({ page }) => {
  await page.goto('/dang-nhap');
  await page.getByLabel('Email').fill(emailThu('a'));
  await page.getByLabel('Mật khẩu').fill(MAT_KHAU_THU);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();

  await expect(page).toHaveURL(/\/tai-khoan/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('Đặt giá: xác nhận mức tối đa và chỉ chính mình thấy mức đã đặt', async ({ page }) => {
  await dangNhap(page, 'a');
  await moPhien(page, 'Phiên kiểm thử không cọc');

  await page.getByLabel('Mức tối đa bí mật của bạn').fill('21000000');
  await page.getByRole('button', { name: 'Xem lại mức đặt' }).click();
  await page.getByRole('button', { name: 'Xác nhận đặt giá' }).click();

  await expect(page.getByText('Đã ghi nhận mức tối đa bí mật')).toBeVisible();
  await expect(page.locator('.muc-cua-toi')).toContainText('21.000.000');
  // Gợi ý mức tiếp theo phải cao hơn mức đã đặt.
  await expect(page.getByText(/Cần đặt từ 21\.000\.001/)).toBeVisible();
});

// Sự kiện socket chỉ phát sau khi commit, mà máy chủ thử không bao giờ commit (để hoàn tác),
// nên phần phát tới phòng danh sách được kiểm ở backend/tests/su-kien-phong.test.js.
test('Đặt cọc rồi mới mở được ô đặt giá; danh sách hiện lượt giá mới', async ({ page }) => {
  const ten = 'Phiên kiểm thử cọc không Mua ngay';

  await dangNhap(page, 'a');
  await moPhien(page, ten);
  await expect(page.getByText('Hoàn tất đặt cọc để mở thao tác trả giá')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Xem lại mức đặt' })).toBeDisabled();

  await page.getByRole('button', { name: 'Đăng ký tham gia phiên' }).click();
  await page.getByRole('button', { name: 'Thanh toán cọc' }).click();
  await page.getByRole('button', { name: 'Xác nhận thanh toán' }).click();
  await expect(page.getByText('Đã ghi nhận thanh toán cọc')).toBeVisible();

  await page.getByLabel('Mức tối đa bí mật của bạn').fill('20000000');
  await page.getByRole('button', { name: 'Xem lại mức đặt' }).click();
  await page.getByRole('button', { name: 'Xác nhận đặt giá' }).click();
  await expect(page.getByText('Đã ghi nhận mức tối đa bí mật')).toBeVisible();

  await page.goto(`/kham-pha?q=${encodeURIComponent(ten)}`);
  await expect(page.locator('.the-phien', { hasText: ten })).toContainText('1 lượt trả giá');
});

test('Thanh toán phần còn lại của đơn chuyển đơn sang chờ gửi hàng', async ({ page }) => {
  await dangNhap(page, 'a', '/tai-khoan/don-hang');

  const the = page.locator('.the-don', { hasText: 'Đơn thử thanh toán có cọc' });

  await expect(the.locator('.tien-trinh-don li[aria-current="step"]')).toHaveText('Thanh toán');
  await the.getByRole('link', { name: 'Xem đơn hàng' }).click();

  await page.getByRole('button', { name: 'Thanh toán phần còn lại' }).click();
  await page.getByRole('button', { name: 'Xác nhận thanh toán' }).click();

  await expect(page.locator('.thong-tin-don').first()).toContainText('Chờ gửi hàng');
  await expect(page.locator('.tien-trinh-don li[aria-current="step"]')).toHaveText('Gửi hàng');
});

test('Thông báo của người bán mở đúng khu người bán', async ({ page }) => {
  await dangNhap(page, 'seller', '/tai-khoan/thong-bao');

  const lienKet = page.getByRole('link', { name: 'Xem chi tiết' }).first();

  await expect(lienKet).toBeVisible();
  // Thông báo đơn/phiên gửi người bán phải dẫn về /nguoi-ban, không về khu người mua.
  const cacDich = await page
    .locator('a', { hasText: 'Xem chi tiết' })
    .evaluateAll((cac) => cac.map((a) => a.getAttribute('href') || ''));

  expect(cacDich.some((dich) => dich.startsWith('/nguoi-ban/'))).toBe(true);
  expect(cacDich.filter((dich) => /^\/tai-khoan\/don-hang\//.test(dich))).toEqual([]);
});
