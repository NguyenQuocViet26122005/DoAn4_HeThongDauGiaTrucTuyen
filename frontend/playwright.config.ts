import { defineConfig, devices } from '@playwright/test';

// E2E chạy trên máy chủ kiểm thử giao diện của backend (cổng 5001, CSDL doan4_daugia_kiem_thu,
// mọi dữ liệu nằm trong một transaction được hoàn tác khi dừng), không chạm CSDL chính.
// Dùng Microsoft Edge có sẵn trên Windows nên không cần tải trình duyệt của Playwright.
export default defineConfig({
  testDir: './e2e',
  // Các bài dùng chung một transaction dữ liệu thử nên chạy tuần tự.
  workers: 1,
  fullyParallel: false,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5174',
    channel: 'msedge',
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'may-tinh',
      use: {
        ...devices['Desktop Edge'],
        channel: 'msedge',
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      // Điện thoại chỉ chạy bài kiểm tra bố cục, tránh lặp các luồng ghi dữ liệu.
      name: 'dien-thoai',
      testMatch: /bo-cuc\.spec\.ts/,
      use: { ...devices['Pixel 7'], channel: 'msedge' },
    },
  ],
  webServer: [
    {
      command: 'npm run build && node scripts/kiem-thu-giao-dien.js --nguoi-mua --don-hang',
      cwd: '../backend',
      url: 'http://127.0.0.1:5001/api/categories',
      timeout: 180_000,
      reuseExistingServer: false,
    },
    {
      command: 'npx vite --port 5174 --strictPort',
      url: 'http://localhost:5174',
      env: { VITE_API_URL: 'http://127.0.0.1:5001/api' },
      timeout: 60_000,
      reuseExistingServer: false,
    },
  ],
});
