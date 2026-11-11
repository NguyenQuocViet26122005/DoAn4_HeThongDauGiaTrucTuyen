# VietBid — ứng dụng di động

App Expo cho người mua của hệ thống đấu giá VietBid. App dùng chung API với web trong `../backend`. Bán hàng, kiểm định, khiếu nại và quản trị vẫn làm trên web.

## Chạy app

Cần backend đang chạy trước (xem `../backend/HUONG-DAN.md`). Mở terminal trong thư mục `mobile`:

```powershell
npm install
```

**Xem nhanh trên trình duyệt** (backend chạy `npm run dev:local`, thêm `http://localhost:8081` vào `FRONTEND_URL` của backend):

```powershell
npx expo start --web
```

**Chạy trên điện thoại thật bằng Expo Go:**

1. Trong `backend`, chạy `npm run dev:lan`. Lệnh in ra địa chỉ dạng `http://192.168.x.x:5000/api`.
2. Trong `mobile`, đặt địa chỉ đó rồi khởi động:

   ```powershell
   $env:EXPO_PUBLIC_API_URL = 'http://192.168.x.x:5000/api'
   npx expo start
   ```

3. Mở Expo Go trên điện thoại (cùng mạng Wi-Fi với máy tính) và quét mã QR.

Biến tùy chọn `EXPO_PUBLIC_WEB_URL` là địa chỉ web VietBid cho nút "Mở VietBid trên web". Mặc định app lấy máy chủ của API và đổi sang cổng 5173.

## Kiểm tra code

```powershell
npm run check      # expo lint + tsc --noEmit
npx expo-doctor    # kiểm tra phiên bản thư viện và cấu hình
```

Lệnh `npm run check` ở thư mục gốc cũng chạy phần này. Thêm thư viện bằng `npx expo install <tên>` để lấy đúng phiên bản theo SDK.

## Cấu trúc

- `src/app/` — màn hình theo Expo Router:
  - `(tabs)/` — bốn tab Khám phá, Đơn hàng, Thông báo, Tài khoản;
  - `phien/[id]` — chi tiết phiên;
  - `don-hang/[id]` — chi tiết đơn;
  - `dang-nhap`, `dia-chi` — đăng nhập và sổ địa chỉ.
- `src/components/` — thẻ phiên, khối tham gia phiên, thành phần giao diện dùng chung.
- `src/lib/` — gọi API, phiên đăng nhập (token trong SecureStore), realtime Socket.IO, giờ máy chủ, định dạng tiền và thời gian, màu và phông.
- `assets/images/` — icon và màn chờ kim cương vàng.

Không tạo hoặc sửa tay thư mục `ios/`, `android/`. Cấu hình native đặt trong `app.json`.
