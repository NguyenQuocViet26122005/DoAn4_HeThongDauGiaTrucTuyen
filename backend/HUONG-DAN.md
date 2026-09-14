# Backend — Đồ án 4: Hệ thống đấu giá trực tuyến

Backend Express/CommonJS dùng MySQL 8 `doan4_daugia`, bám 27 bảng hiện có. Mã nguồn chia theo Route → Controller → Service → Repository → MySQL. Tên tệp, hàm và biến nghiệp vụ dùng tiếng Việt không dấu; chú thích và thông báo dùng tiếng Việt có dấu. Tên thư mục kiến trúc, cú pháp JavaScript, API thư viện và hợp đồng HTTP/Socket.IO giữ quy ước kỹ thuật đang dùng.

## Chạy trên máy hiện tại

Mở terminal trong thư mục `backend`:

```powershell
npm install
npm run dev
```

Đã kiểm thử bằng Node.js 24.13.0. Lệnh `npm start` chạy không có nodemon. Điểm khởi động là `src/may-chu.js`; cấu hình Express ở `src/ung-dung.js`. Khi có lỗi `EADDRINUSE`, dừng phiên backend cũ đang dùng cổng 5000 trước khi chạy lại.

Ứng dụng tự nạp `backend/.env`. Không cần gửi nội dung tệp này cho người khác. Các tên cấu hình ứng dụng sử dụng:

- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`: dùng kết nối MySQL hiện có; tên database là `doan4_daugia`.
- `DB_PORT`: mặc định 3306.
- `JWT_SECRET`: giá trị bí mật đã thêm trên máy, tối thiểu 32 byte. Không có giá trị dự phòng trong mã nguồn.
- `PORT`: mặc định 5000.
- `FRONTEND_URL`: mặc định `http://localhost:5173`; nhiều nguồn được phân cách bằng dấu phẩy.
- `DB_TIMEZONE`: mặc định `+07:00`, cần khớp cách hiểu thời gian DATETIME hiện có.
- `JOBS_ENABLED`: mặc định bật; đặt `false` khi muốn tạm dừng tác vụ tự động lúc kiểm tra dữ liệu.

Các lệnh trên không tạo lại database, không chạy tệp SQL gốc và không thay schema. Không nhập lại toàn bộ SQL gốc vào database đang sử dụng: tệp đó có phần tạo lại database.

Kiểm tra `GET http://localhost:5000/api/health`: phải trả HTTP 200 và `data.database = "connected"`.

## Tài liệu để sử dụng và bảo vệ đồ án

- [Danh sách đầy đủ API và JSON mẫu](docs/danh-sach-api.md).
- [Hướng dẫn Postman theo từng kịch bản](docs/huong-dan-postman.md).
- [Bộ Postman có sẵn](docs/doan4-dau-gia.postman_collection.json).
- [Quy tắc nghiệp vụ, xử lý đồng thời và giới hạn](docs/nghiep-vu-va-gioi-han.md).
- [Các tệp đã tạo, sửa và đổi tên](docs/tep-da-thay-doi.md).

## Các phần đã có

- Đăng ký, đăng nhập bcrypt/JWT, hồ sơ, địa chỉ, trạng thái tài khoản và phân quyền Admin/người bán đã xác minh.
- Hồ sơ xác minh người bán, danh mục cha/con, thuộc tính động, sản phẩm, ảnh, gửi duyệt và Admin xét duyệt.
- Phiên đấu giá, bước giá từ MySQL, đấu giá tự động, ưu tiên người đặt trước, chống đặt giá phút chót, giá sàn, mua ngay, yêu cầu hủy, theo dõi và Socket.IO.
- Chốt phiên, tạo đơn, thanh toán mô phỏng, giữ tiền trung gian, gửi/giao hàng, kiểm tra hàng, giải ngân, tranh chấp và hoàn tiền.
- Second Chance theo giá trả công khai hợp lệ, đánh giá hai chiều, vi phạm, thông báo, thống kê và nhật ký quản trị.
- Tác vụ định kỳ mở/đóng phiên, xử lý hạn thanh toán/đề nghị/kiểm tra hàng, ghi nhận gửi hàng muộn và nhắc hạn.
- Tải ảnh/tài liệu bằng Multer, kiểm tra quyền sở hữu và quyền đọc giấy tờ/bằng chứng.

Mức giá tối đa được lưu riêng để tính đấu giá. API và Socket.IO không trả trường này; nhật ký mới không ghi mức tối đa hoặc mật khẩu.

## Kiểm thử

Chạy trong `backend`:

```powershell
npm run check
npm test
npm run check:schema
npm run test:api
npm run test:integration
npm run format:check
```

`check` kiểm tra cú pháp và đường dẫn require. `npm test` kiểm tra bộ tính giá và các phản hồi HTTP cơ bản. `check:schema` chỉ đọc cấu trúc MySQL, đối chiếu các cột đang được sử dụng và kiểm tra InnoDB. Kiểm thử tích hợp cần MySQL và cấu hình JWT hiện có.

Kết quả ngày 12/09/2026: 17 kiểm thử đơn vị/HTTP và 27 kiểm thử tích hợp đạt. Bộ tích hợp gồm các giao dịch được rollback, kiểm thử HTTP tải tệp và nhiều kết nối MySQL thật cùng thao tác. Ca nhiều kết nối tạo dữ liệu riêng có UUID, commit để các kết nối nhìn thấy nhau, rồi dọn đúng các bản ghi kiểm thử. Tệp tải lên trong kiểm thử cũng được dọn. Các dữ liệu mẫu có sẵn không bị xóa/reset; số tự tăng có thể có khoảng trống sau kiểm thử.

Riêng `npm run test:api` gửi 155 yêu cầu HTTP đến ứng dụng Express trên một cổng kiểm thử riêng: đủ 86/86 API có ít nhất một trường hợp thành công và 28 yêu cầu sai trả đúng mã lỗi mong đợi. Bộ test đối chiếu đường dẫn với route trong mã nguồn, kiểm tra dữ liệu phản hồi, phân quyền, bí mật đầu ra và các chuyển trạng thái nghiệp vụ. Kết quả này không thay thế kiểm thử tải hoặc chứng minh mọi tổ hợp đầu vào đều đúng. Tất cả thay đổi dữ liệu của bộ test API, kể cả cấu hình nghiệp vụ, nằm trong transaction được rollback; tệp tải lên được dọn sau đó.

Đã chạy thử `npm run dev` trên cổng 5000: health, danh mục, sản phẩm, phiên và bước giá trả 200; sáu tài khoản mẫu đăng nhập thành công; người dùng thường gọi API quản trị nhận 403. Đã kiểm tra các API đọc quản trị và xác nhận tác vụ được bật. Phiên chạy thử đã được dừng sau kiểm tra; chạy lại lệnh trên để sử dụng. Trong môi trường công cụ hạn chế, nodemon cần quyền tạo tiến trình con; sau khi cấp quyền, lệnh chạy thành công.

Kiểm thử tác vụ chạy cả bộ lập lịch trong transaction rồi rollback, để xác nhận nghiệp vụ mà không lưu việc chuyển trạng thái của dữ liệu mẫu. Nên dừng backend đang chạy tác vụ tự động khi thực hiện bộ tích hợp để tránh một tiến trình bên ngoài kiểm thử cùng quét dữ liệu.

## Đọc mã nguồn

Bắt đầu từ `routes/dau-gia.js` → `controllers/dau-gia.js` → `services/dau-gia.js`. Hàm `tinhKetQuaDauGia` trong `services/tinh-gia-tu-dong.js` chỉ tính giá; service giữ khóa phiên và ghi kết quả. `repositories/ket-noi.js` quản lý transaction, thử lại khi xung đột khóa và gửi sự kiện sau commit. Tất cả đường dẫn trên nằm dưới `src`.

Sử dụng `npm run format` để định dạng mã nguồn và tài liệu: thụt lề 2 khoảng trắng, một câu lệnh một dòng, dấu chấm phẩy và xuống dòng những lời gọi dài. Các truy vấn SQL dài được chia dòng trong repository.

## Các giới hạn cần biết

Thanh toán và giải ngân là mô phỏng; phí vận chuyển hiện bằng 0. Chưa tích hợp đơn vị vận chuyển, cổng thanh toán thật, email/SMS, khôi phục mật khẩu hoặc refresh token. Frontend vẫn cần triển khai giao diện và kết nối các API này.

Tác vụ chạy mỗi 60 giây và bắt đầu sau chu kỳ đầu tiên, nên chuyển trạng thái hiển thị có thể chậm khoảng một phút. API đặt giá/thanh toán vẫn tự kiểm tra giờ và trạng thái khi nhận yêu cầu.

Git hiện đang theo dõi `backend/.env` và một phần `node_modules` từ trước; `.gitignore` không tự bỏ theo dõi các tệp đã được lưu vào Git. Công việc này không đọc nội dung `.env` và không tự thay đổi lịch sử/index Git. Cần xử lý việc theo dõi tệp này trước khi chia sẻ repository.
