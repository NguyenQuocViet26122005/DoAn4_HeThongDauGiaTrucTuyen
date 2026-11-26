# VietBid — Đấu giá và sưu tầm

VietBid là đồ án xây dựng hệ thống đấu giá trực tuyến dành cho những món đồ có giá trị sưu tầm: đồng hồ, đồ cổ, tác phẩm nghệ thuật, máy ảnh, nhạc cụ vintage và các bộ sưu tập hiếm. Dự án có website cho người mua, người bán, Admin và ứng dụng Android dành cho người mua.

**[Trải nghiệm website](https://vietbid-qviet2612.alwaysdata.net/)** · **[Tải app Android](https://github.com/NguyenQuocViet26122005/DoAn4_HeThongDauGiaTrucTuyen/releases/latest/download/VietBid.apk)** · **[Các bản phát hành](https://github.com/NguyenQuocViet26122005/DoAn4_HeThongDauGiaTrucTuyen/releases)**

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

APK được build từ giao diện **React Native/Expo trong thư mục `mobile`**, gồm bốn tab **Khám phá, Đơn hàng, Thông báo, Tài khoản**. App dùng chung API và CSDL với website, nên tài khoản và dữ liệu giao dịch được đồng bộ. Các chức năng bán hàng, kiểm định và quản trị sử dụng trên web.

1. Mở **[link tải APK mới nhất](https://github.com/NguyenQuocViet26122005/DoAn4_HeThongDauGiaTrucTuyen/releases/latest/download/VietBid.apk)** bằng điện thoại Android ARM64.
2. Mở tệp tải về và làm theo hướng dẫn cài đặt của Android.
3. Mở VietBid, đăng ký hoặc đăng nhập để trải nghiệm.

APK release được ký riêng và phát hành kèm [tệp SHA256](https://github.com/NguyenQuocViet26122005/DoAn4_HeThongDauGiaTrucTuyen/releases/latest/download/VietBid.apk.sha256). Ứng dụng kết nối tới hosting, hoạt động độc lập với máy phát triển.

## Dữ liệu trải nghiệm

Bộ mẫu bổ sung ngày **26/11/2026** có 30 sản phẩm thuộc 10 danh mục, 6 tài khoản người mua/người bán và các hồ sơ ở nhiều bước xử lý. Có 6 phiên mở ban đầu, 16 phiên lên lịch nối tiếp đến **26/03/2027** và 2 đơn Mua ngay mẫu để trải nghiệm bước sau đấu giá.

Trạng thái tiếp tục thay đổi theo thời gian và thao tác của người dùng. Ảnh có nguồn và giấy phép được ghi trong mô tả; tài liệu kiểm định mẫu không có giá trị giám định thực tế.

## Cập nhật khi push GitHub

- **Website:** push lên `main` kích hoạt kiểm tra, build và triển khai. Hệ thống kiểm tra phiên bản, CSDL và WebSocket sau khi chuyển bản; bản mới khởi động lỗi được khôi phục về bản trước.
- **Mobile:** thay đổi mã mobile kích hoạt build APK và phát hành gói cập nhật có chữ ký. Bản cập nhật tương thích được tải khi app khởi động và áp dụng ở lần mở tiếp theo. Thay đổi thư viện native hoặc cấu hình làm đổi runtime sẽ cần cài APK mới.
- **Dữ liệu:** web và app dùng chung máy chủ. Thay đổi riêng giao diện web không tự thay giao diện React Native.

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
