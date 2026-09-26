# VietBid — Giao diện web

Đặc tả chính: [Tài liệu nghiệp vụ và công nghệ](../TAI-LIEU-NGHIEP-VU-VA-CONG-NGHE.md). Thiết kế đen–vàng, tiếng Việt, ưu tiên PC. Không thay đổi CSDL trong đợt làm giao diện nền.

## Chạy trên máy

1. Trong `backend`, chạy `npm run dev:local` để dùng MySQL hiện có, đăng nhập/API đầy đủ và tắt tác vụ nền khi thử giao diện. Nếu thiếu khóa JWT, chế độ này tạo khóa ngẫu nhiên riêng trong `backend/.local/` đã bỏ qua bởi Git; không sửa `.env`. Xem `backend/HUONG-DAN.md` để chạy chế độ thông thường có tác vụ.
2. Trong thư mục `frontend`, chạy `npm run dev`.
3. Mở **http://localhost:5173**. Địa chỉ này khớp nguồn truy cập mặc định của backend. Vite chuyển `/api` và `/socket.io` tới `127.0.0.1:5000`.

Chạy `npm run build` để kiểm tra TypeScript và tạo bản xuất; `npm run lint` để kiểm tra code. Chạy `npm run format` từ gốc dự án để dùng formatter thống nhất.

Bản xuất `dist` cần máy chủ web trả `index.html` cho đường dẫn giao diện và chuyển API tới backend; proxy Vite chỉ phục vụ phát triển, không tự có trong bản xuất.

## Đã có ở đợt giao diện nền

- Trang chủ, khám phá với tìm kiếm/lọc/phân trang, xem chi tiết phiên/sản phẩm/kiểm định/lịch sử trả giá bằng API thật.
- Đăng nhập, đăng ký, kiểm tra biểu mẫu, trạng thái chờ gửi, lỗi API, khôi phục phiên và chặn trang cần đăng nhập/Admin.
- Hồ sơ chỉ xem, danh sách theo dõi và phiên đã tham gia.
- Trang hướng dẫn, trang không tìm thấy, bố cục người mua/người bán/Admin, menu màn hình nhỏ.
- Bảng màu, kiểu chữ, biểu mẫu, skeleton, dữ liệu rỗng, lỗi và ảnh dự phòng thống nhất. Các trang phụ được tải khi mở.
- Khu vực người bán `/nguoi-ban/san-pham`: tìm/lọc/phân trang, tạo/sửa bản nháp, thuộc tính động, nhiều ảnh thật, ảnh đại diện, bỏ ảnh và gửi duyệt. Người bán chưa xác minh/Admin không có thao tác đăng bán.

Để thêm ảnh: **Bán đấu giá → Thêm sản phẩm → Lưu bản nháp → Chọn ảnh từ máy tính → Tải ảnh đã chọn → Gửi duyệt**. Ảnh giới hạn 12 tệp, 5 MiB/tệp (JPG/PNG/WebP). Ảnh lỗi có thể thử lại hoặc bỏ chọn. Sản phẩm đang chờ duyệt/kiểm định hoặc đã có phiên sẽ khóa sửa theo phản hồi backend.

## Còn phải triển khai

Các màn hình địa chỉ, xác minh, kiểm định, tạo phiên, quản trị, đơn hàng, thông báo, tranh chấp… mới có bố cục và lời giải thích. Đặt cọc, trả giá, Mua ngay, thanh toán, Second Chance và realtime chưa có luồng thao tác trên web. Các mục này không hiển thị số liệu hay nút thành công giả.

Khóa phiên đang giữ tên lưu trữ `lac-viet-token` để tương thích phiên trước khi đổi thương hiệu; toàn bộ tên hiển thị là VietBid. Khóa nằm trong sessionStorage của tab, được xóa khi đăng xuất hoặc hết phiên. Không lưu mức tối đa bí mật của các thành viên khác.

Chế độ `dev:local` thay máy chủ xem trước chỉ đọc trước đây. Nó cho phép API ghi dữ liệu theo quyền tài khoản, nhưng không tự đóng phiên/xử lý quá hạn. Không dùng chế độ này để nghiệm thu đồng hồ/tác vụ đấu giá hoặc triển khai production.

## Tổ chức mã nguồn

- `routes/dinh-tuyen.tsx`: tuyến trang, tải trang khi cần và quyền truy cập.
- `components`: khung trang, biểu mẫu/thành phần dùng chung.
- `pages`: nội dung từng trang; không đặt SQL/nghiệp vụ tính giá trong component.
- `services/api.ts`: gọi API, bộ nhớ truy vấn, lỗi dễ hiểu, đường dẫn tệp.
- `hooks`, `store`: tải dữ liệu và quản lý phiên.
- `constants/khu-vuc-nghiep-vu.ts`: tên và mục đích từng khu vực theo đặc tả.
- `styles`: chia theo bố cục, khám phá, biểu mẫu và trang nội dung; `index.css` giữ các biến màu/kiểu chữ.

Ảnh trang trí bổ sung có prompt trong [PROMPT-ANH-VIETBID.md](PROMPT-ANH-VIETBID.md). Ảnh sản phẩm thật phải do người bán cung cấp.

## Kiểm tra giao diện sản phẩm bằng dữ liệu riêng

Sau `npm run test:prepare` (chỉ khi CSDL kiểm thử chưa tồn tại), chạy `node scripts/kiem-thu-giao-dien.js` trong backend. Máy chủ thử dùng cổng 5001, tài khoản thử được in ở terminal, tệp nằm riêng trong `backend/uploads-kiem-thu`. Mở terminal frontend khác, đặt `$env:VITE_API_URL='http://127.0.0.1:5001/api'` rồi chạy `npm run dev -- --port 5174`. Dùng `http://localhost:5174` để không tác động dữ liệu chính. Nhấn Enter ở terminal backend để đóng và rollback dữ liệu, dọn ảnh thử; sau đó dừng Vite thử.

Đã kiểm tra trên trình duyệt ngày 26/09/2026: đăng nhập, danh sách rỗng, lỗi trường bắt buộc, lưu bản nháp khi thiếu thuộc tính, tải hai ảnh, đổi ảnh đại diện, nhập/lưu thuộc tính ngày và đúng/sai, gửi duyệt và khóa sửa, chặn người mua chưa xác minh. Danh sách và biểu mẫu không tràn ngang ở chiều rộng kiểm tra 424 px; bố cục PC là ưu tiên. Backend: 18 kiểm thử cơ bản và 54 tích hợp đạt; frontend build, lint và formatter đạt.
