# VietBid — Đấu giá và sưu tầm

VietBid là đồ án xây dựng hệ thống đấu giá trực tuyến dành cho những món đồ có giá trị sưu tầm: đồng hồ, đồ cổ, tác phẩm nghệ thuật, máy ảnh, nhạc cụ vintage và các bộ sưu tập hiếm. Website và ứng dụng Android dùng chung giao diện responsive cho người mua, người bán và Admin theo quyền tài khoản.

**[Trải nghiệm website](https://vietbid.alwaysdata.net/)** · **[Tải app Android](https://github.com/NguyenQuocViet26122005/DoAn4_HeThongDauGiaTrucTuyen/releases/latest/download/VietBid.apk)** · **[Cài trên iPhone](https://vietbid.alwaysdata.net/huong-dan#cai-iphone)** · **[Các bản phát hành](https://github.com/NguyenQuocViet26122005/DoAn4_HeThongDauGiaTrucTuyen/releases)**

> Bản công khai phục vụ học tập và trải nghiệm. Hàng hóa, hồ sơ và giao dịch mẫu được ghi rõ là mô phỏng. Đặt cọc, thanh toán và vận chuyển trong đồ án không sử dụng tiền hoặc đơn giao hàng thực tế.

## VietBid hỗ trợ những gì?

### Người mua

- Khám phá phiên theo danh mục, tìm kiếm, lọc và lưu danh sách theo dõi.
- Xem ảnh, thuộc tính sản phẩm, hồ sơ kiểm định và lịch sử giá công khai.
- Đặt mức giá tối đa bí mật; hệ thống tự trả giá theo bước giá và cập nhật theo thời gian thực.
- Đặt cọc khi phiên yêu cầu, Mua ngay khi đủ điều kiện và theo dõi đơn sau đấu giá.
- Xác nhận nhận hàng, kiểm tra sản phẩm, mở tranh chấp và đánh giá giao dịch theo trạng thái cho phép.

### Người bán

- Đăng ký xác minh người bán, quản lý hồ sơ sản phẩm, ảnh và thuộc tính theo danh mục.
- Gửi duyệt, theo dõi kiểm định và tạo phiên cho sản phẩm đủ điều kiện.
- Quản lý phiên, đơn hàng, giao hàng, hàng hoàn và đăng bán lại theo nghiệp vụ.
- Nhận cảnh báo nội dung tin đăng, ảnh trùng và tham khảo giá khi đủ dữ liệu. Gợi ý đăng bán từ ảnh có thể bật khi đã cấu hình dịch vụ AI; người bán xác nhận thông tin trước khi dùng.

### Admin

- Xét hồ sơ người bán, duyệt tin đăng và quản lý quy trình kiểm định.
- Cấu hình bước giá, chính sách cọc và các thời hạn nghiệp vụ.
- Theo dõi tiền giữ trung gian, xử lý tranh chấp, quyết toán cọc và quản lý hàng hoàn.
- Tra cứu thông báo, nhật ký và trạng thái tác vụ tự động.

## Ứng dụng Android

APK được build từ **Expo/React Native trong thư mục `mobile`**, dùng WebView mở trực tiếp giao diện web responsive. Bố cục, trang, biểu mẫu và chức năng theo quyền tài khoản dùng cùng mã với website; không có một bộ giao diện native riêng cần đồng bộ lại. Bản chuyển sang WebView và miền `vietbid.alwaysdata.net` cần cài APK mới, có thể cài đè bản cũ.

1. Mở **[link tải APK mới nhất](https://github.com/NguyenQuocViet26122005/DoAn4_HeThongDauGiaTrucTuyen/releases/latest/download/VietBid.apk)** bằng điện thoại Android ARM64.
2. Mở tệp tải về và làm theo hướng dẫn cài đặt của Android.
3. Mở VietBid, đăng ký hoặc đăng nhập để trải nghiệm.

APK release được ký riêng và phát hành kèm [tệp SHA256](https://github.com/NguyenQuocViet26122005/DoAn4_HeThongDauGiaTrucTuyen/releases/latest/download/VietBid.apk.sha256). Ứng dụng kết nối tới hosting, hoạt động độc lập với máy phát triển.

## VietBid trên iPhone và iPad

Bản web app cài miễn phí từ Safari, dùng chung giao diện responsive, API, dữ liệu và quyền tài khoản với website. Đây là web app thêm vào màn hình chính, không phải bản IPA/App Store; không cần tài khoản Apple Developer để cài theo cách này.

1. Mở [website VietBid](https://vietbid.alwaysdata.net/) bằng **Safari**.
2. Mở **Chia sẻ → Thêm vào Màn hình chính** (Add to Home Screen). Nếu mục này chưa hiện, tìm trong **Sửa tác vụ**.
3. Bật **Mở dưới dạng ứng dụng web** (Open as Web App) nếu có, rồi chọn **Thêm**.
4. Chạm biểu tượng **VietBid** trên màn hình chính; đăng nhập lại nếu được yêu cầu.

Web app có manifest, biểu tượng riêng và vùng an toàn cho tai thỏ/thanh Home. Cần Internet; không lưu giao dịch hoặc API vào bộ nhớ đệm offline và không tự tải lại giữa thao tác. Giao diện mới xuất hiện khi mở/tải lại trang sau khi web triển khai. Chưa nghiệm thu cài đặt, bàn phím và vùng an toàn trên iPhone thật. Xem [hướng dẫn trong website](https://vietbid.alwaysdata.net/huong-dan#cai-iphone) hoặc [hướng dẫn Apple](https://support.apple.com/vi-vn/guide/iphone/iphea86e5236/ios).

## Dữ liệu trải nghiệm

Bộ mẫu bổ sung ngày **26/11/2026** có 30 sản phẩm thuộc 10 danh mục, 6 tài khoản người mua/người bán và các hồ sơ ở nhiều bước xử lý. Có 6 phiên mở ban đầu, 16 phiên lên lịch nối tiếp đến **26/03/2027** và 2 đơn Mua ngay mẫu để trải nghiệm bước sau đấu giá.

Trạng thái tiếp tục thay đổi theo thời gian và thao tác của người dùng. Ảnh có nguồn và giấy phép được ghi trong mô tả; tài liệu kiểm định mẫu không có giá trị giám định thực tế.

## Cập nhật khi push GitHub

- **Website:** push lên `main` kích hoạt kiểm tra, build và triển khai. Hệ thống kiểm tra phiên bản, CSDL và WebSocket sau khi chuyển bản; bản mới khởi động lỗi được khôi phục về bản trước.
- **Mobile:** thay đổi mã mobile kích hoạt build APK và phát hành gói cập nhật có chữ ký. Bản cập nhật tương thích được tải khi app khởi động và áp dụng ở lần mở tiếp theo. Thay đổi thư viện native hoặc cấu hình làm đổi runtime sẽ cần cài APK mới.
- **Giao diện trong APK:** tải trực tiếp từ website nên nhận bản web mới khi mở/tải lại trang. Không tự tải lại khi đang thao tác giao dịch.
- **Dữ liệu:** web và app dùng chung máy chủ, API và CSDL; quyền và quy tắc nghiệp vụ được kiểm tra tại Backend.

Xem tiến trình tại [GitHub Actions](https://github.com/NguyenQuocViet26122005/DoAn4_HeThongDauGiaTrucTuyen/actions).

## Công nghệ và mã nguồn

| Thành phần       | Công nghệ chính                                                        | Thư mục                           |
| ---------------- | ---------------------------------------------------------------------- | --------------------------------- |
| Website          | React, TypeScript, Vite, Ant Design, TanStack Query, Zustand           | [`frontend`](frontend/)           |
| API và nghiệp vụ | Node.js, Express, TypeScript, Zod, Socket.IO, mysql2                   | [`backend`](backend/)             |
| Ứng dụng di động | React Native, Expo, Expo Router, SecureStore, expo-updates             | [`mobile`](mobile/)               |
| CSDL             | MySQL; bản hosting dùng MariaDB tương thích đã kiểm tra cấu trúc       | [`co-so-du-lieu`](co-so-du-lieu/) |
| Triển khai       | GitHub Actions, alwaysdata, bộ quản lý phiên bản và cập nhật có chữ ký | [`deploy`](deploy/)               |

## Tài liệu dành cho người phát triển

- [Hướng dẫn backend và thiết lập CSDL](backend/HUONG-DAN.md).
- [Hướng dẫn frontend](frontend/README.md).
- [Hướng dẫn ứng dụng di động](mobile/README.md).
- [Triển khai hosting, APK và cập nhật tự động](deploy/README.md).
- [Đặc tả nghiệp vụ và công nghệ](TAI-LIEU-NGHIEP-VU-VA-CONG-NGHE.md).

Các đường dẫn website và APK phía trên là thông tin phát hành công khai. Mật khẩu tài khoản, cấu hình CSDL, khóa API, khóa SSH và khóa ký riêng không được đưa vào README.
