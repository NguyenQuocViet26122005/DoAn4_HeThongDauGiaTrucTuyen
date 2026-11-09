import { expect, type Page } from '@playwright/test';

// Tài khoản do backend/scripts/kiem-thu-giao-dien.js tạo trong transaction thử.
export const MAT_KHAU_THU = 'KiemThuVietBid123!';
export type VaiTro = 'admin' | 'seller' | 'a' | 'b';
export const emailThu = (vaiTro: VaiTro) => `${vaiTro}-giao-dien@example.invalid`;

// Đăng nhập nhanh qua API rồi nạp lại trang; luồng đăng nhập bằng biểu mẫu có bài riêng.
export async function dangNhap(page: Page, vaiTro: VaiTro, dich = '/tai-khoan') {
  await page.goto('/');
  await page.evaluate(
    async ({ email, matKhau }) => {
      const phanHoi = await fetch('http://127.0.0.1:5001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, mat_khau: matKhau }),
      });
      const duLieu = await phanHoi.json();

      sessionStorage.setItem('lac-viet-token', duLieu.data.token);
    },
    { email: emailThu(vaiTro), matKhau: MAT_KHAU_THU },
  );
  await page.goto(dich);
}

// Đo bố cục: trang không cuộn ngang, không phần tử tràn khỏi màn hình,
// không khối chữ bị bóp vào cột quá hẹp (lỗi thẻ bị bóp cột từng gặp).
export async function kiemTraBoCuc(page: Page) {
  // Chờ hiệu ứng hiện trang chạy xong để đo đúng vị trí cuối.
  await page.waitForTimeout(700);

  const ketQua = await page.evaluate(() => {
    const rong = document.documentElement.clientWidth;
    const trongVungCuon = (el: Element) => {
      for (let cha = el.parentElement; cha; cha = cha.parentElement) {
        if (['auto', 'scroll', 'hidden'].includes(getComputedStyle(cha).overflowX)) {
          return true;
        }
      }

      return false;
    };
    const hep: string[] = [];
    const tran: string[] = [];

    for (const el of document.querySelectorAll('#root *')) {
      const khung = el.getBoundingClientRect();

      if (!khung.width || !khung.height) {
        continue;
      }

      const chu = [...el.childNodes]
        .filter((nut) => nut.nodeType === Node.TEXT_NODE)
        .map((nut) => nut.textContent?.trim() ?? '')
        .join(' ')
        .trim();

      if (chu.length > 20 && khung.width < 130 && khung.height > 70) {
        hep.push(`${el.tagName} ${Math.round(khung.width)}px "${chu.slice(0, 30)}"`);
      }
      if (
        khung.right > rong + 2 &&
        getComputedStyle(el).position !== 'fixed' &&
        !trongVungCuon(el)
      ) {
        tran.push(`${el.tagName}.${String(el.className).slice(0, 40)}`);
      }
    }

    return {
      cuonNgang: document.documentElement.scrollWidth > rong + 1,
      hep: hep.slice(0, 5),
      tran: [...new Set(tran)].slice(0, 5),
    };
  });

  expect(ketQua, `Bố cục ${page.url()}`).toEqual({ cuonNgang: false, hep: [], tran: [] });
}

// Mở phiên thử theo tên qua ô tìm kiếm của trang khám phá.
export async function moPhien(page: Page, ten: string) {
  await page.goto(`/kham-pha?q=${encodeURIComponent(ten)}`);
  await page.getByRole('heading', { name: ten, exact: true }).first().click();
  await expect(page.getByRole('heading', { level: 1, name: ten })).toBeVisible();
}
