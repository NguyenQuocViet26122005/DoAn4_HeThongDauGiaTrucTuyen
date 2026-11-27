# VietBid — ứng dụng di động

App Expo cho người mua của hệ thống đấu giá VietBid. App dùng chung API với web trong `../backend`. Bán hàng, kiểm định, khiếu nại và quản trị vẫn làm trên web.

## Đồng bộ giao diện với website

App lấy giao diện web trên điện thoại làm chuẩn: nền `#111310`, màu vàng `#d5b778`, chữ Be Vietnam Pro và tiêu đề Cormorant Garamond; thẻ bo 12, nút bo 6. Thẻ phiên giữ cùng thứ tự ảnh, danh mục, tiêu đề, giá, lượt trả giá và thời gian. Biểu mẫu, nhãn trạng thái, tiến trình đơn và các trang tài khoản dùng chung bộ thành phần trong `src/components/giao-dien.tsx` và màu trong `src/lib/giao-dien.ts`.

App giữ bốn tab và điều hướng native. Đây là sự thống nhất về hình thức và cách trình bày ở các màn hình hiện có; các chức năng bán hàng, kiểm định và quản trị tiếp tục mở trên web. Ảnh bản web Expo dùng để đối chiếu bố cục, không thay thế kiểm thử cài APK trên thiết bị Android.

## Bản Android dùng hosting

App mặc định kết nối `https://vietbid.alwaysdata.net/api` và mở web cùng hosting. Tài khoản, sản phẩm, phiên, đơn và thông báo dùng chung CSDL với website; điện thoại không cần chung Wi-Fi hay máy phát triển đang bật. Có thể đặt hai biến `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_WEB_URL` để phát triển với backend khác.

Sau khi hosting đổi tên từ `vietbid-qviet2612` sang `vietbid`, cần cài APK mới từ GitHub Releases. APK cũ chứa miền API và URL cập nhật cũ nên không thể dựa vào cập nhật từ xa để chuyển miền. Bản mới vẫn dùng cùng mã ứng dụng và khóa ký; có thể cài đè để cập nhật.

Workflow **APK và cập nhật Android** build APK release ARM64 khi thay đổi mã mobile trên `main` hoặc chạy thủ công. APK được ký bằng khóa riêng trong GitHub Actions Secrets, phát hành tại GitHub Releases kèm SHA256. Cài APK ngoài cửa hàng cần người dùng cho phép cài đặt và xác nhận; Android không cho app tự cài APK thay thế âm thầm.

`expo-updates` đã được cấu hình kiểm tra cập nhật khi khởi động, xác minh chữ ký bằng chứng chỉ công khai đóng trong APK. Runtime được tính từ dependency lockfile, cấu hình native, chứng chỉ và icon: thay đổi các phần này tạo runtime khác và cần APK mới. Mã JavaScript dùng runtime cũ có thể cập nhật từ xa; bản đã tải áp dụng vào lần mở app sau, không tự ngắt thao tác đặt giá/thanh toán đang diễn ra. Chi tiết triển khai máy chủ và kết quả kiểm tra được ghi trong tài liệu `deploy`.

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

Biến tùy chọn `EXPO_PUBLIC_WEB_URL` là địa chỉ web VietBid cho nút "Mở VietBid trên web". API HTTPS dùng web cùng hosting; khi phát triển bằng HTTP LAN thì mặc định đổi cổng API sang 5173.

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
