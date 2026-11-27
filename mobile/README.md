# VietBid Android

App Expo SDK 58 dùng React Native WebView để mở trực tiếp [website VietBid](https://vietbid.alwaysdata.net/). APK và trình duyệt điện thoại tải cùng giao diện React/Vite responsive từ hosting, gồm các khu vực người mua, người bán và Admin theo quyền tài khoản. App không dựng lại trang bằng một bộ màn hình native khác.

## Cập nhật

- Push giao diện web lên `main`: GitHub Actions kiểm tra và triển khai; APK tải giao diện mới khi mở/tải lại trang. Không tự tải lại lúc người dùng đang đặt giá hoặc thanh toán.
- Đổi mã phần vỏ app: workflow xuất bundle có chữ ký và build APK. Bundle chỉ áp dụng cho runtime tương thích.
- Đổi thư viện native, miền cập nhật hoặc cấu hình: cần cài APK mới. Bản chuyển sang WebView ngày 27/11/2026 cần cài đè APK cũ.

[Tải APK mới nhất](https://github.com/NguyenQuocViet26122005/DoAn4_HeThongDauGiaTrucTuyen/releases/latest/download/VietBid.apk). APK release ARM64 dùng cùng mã ứng dụng `vn.vietbid.app` và khóa ký riêng, có tệp SHA256 đi kèm. Web, API, ảnh và CSDL nằm trên hosting nên máy phát triển tắt vẫn truy cập được; app cần kết nối mạng.

## Hành vi của app

Nội dung web chiếm màn hình trong vùng an toàn của Android, giữ nguyên bố cục và điều hướng responsive của website. Nút Back quay lại lịch sử WebView; ở trang đầu hệ thống xử lý Back bình thường. Lỗi tải hoặc tiến trình web bị dừng có màn thử lại, không tự gửi lại giao dịch. Liên kết HTTPS ngoài VietBid mở bằng trình duyệt hệ thống; URL có thông tin đăng nhập, giao thức tệp, JavaScript, intent và HTTP bị chặn.

Đăng nhập và kiểm tra quyền do website/Backend thực hiện. Token của phiên web nằm trong sessionStorage của WebView, không được chuyển từ SecureStore của app cũ hoặc đưa vào URL. Bộ điều hướng native không nhận lệnh thực thi hay dữ liệu giao dịch từ JavaScript trang web. Chứng chỉ HTTPS được kiểm tra bình thường; app không tải nội dung HTTP trộn trong trang HTTPS.

Các thành phần cọc, giá tối đa bí mật, chống gửi trùng, xác nhận giao dịch và Socket.IO dùng chính mã frontend web. AI có cùng trạng thái và điều kiện sẵn sàng với website; WebView không tự bật AI hoặc vượt quyền.

## Chạy và kiểm tra

```powershell
npm ci
npm run check
npx expo start
```

Mặc định app mở website đang chạy. Biến `EXPO_PUBLIC_WEB_URL` có thể chỉ định một website HTTPS khác cho môi trường phát triển; bản phát hành dùng `https://vietbid.alwaysdata.net`. Bản Expo Web chuyển trực tiếp sang website này để xem cùng giao diện, không tạo iframe hoặc bản giao diện thứ hai.

`npm run check` gồm lint, TypeScript và kiểm thử chính sách URL. Bộ kiểm thử bố cục điện thoại của frontend kiểm tra các trang công khai và khu vực của từng vai trò. Các kiểm tra bundle, chữ ký và hash không thay cho nghiệm thu APK trên thiết bị Android thật, đặc biệt thao tác Back, bàn phím, tải/chọn tệp và khôi phục sau mất mạng.

## Mã nguồn

- `src/app/_layout.tsx`: navigator không thêm header hay thanh tab lên nội dung web.
- `src/app/index.tsx`: mở website.
- `src/app/[...duongDan].tsx`: chuyển đường dẫn vào trang web tương ứng, gồm các liên kết từ app cũ.
- `src/components/trang-web.tsx`: WebView native, điều hướng, vùng an toàn và thử lại khi lỗi.
- `src/components/trang-web.web.tsx`: chuyển bản xem trước sang website.
- `src/lib/dieu-huong-web.ts`: miền cho phép và quy tắc liên kết.

Các thành phần màn hình native trước đây còn trong lịch sử Git; bộ route bốn tab đã được thay thế. Không sửa tay `ios/` hoặc `android/`; cấu hình native đặt trong `app.json` và `app.config.js`.
