# Các tệp đã tạo, sửa và đổi tên

Danh sách so với thời điểm bắt đầu audit: backend khi đó có ba tệp khởi tạo, package.json/package-lock.json và cấu hình kết nối. Các đường dẫn bên dưới tính từ thư mục backend.

## Tệp khởi tạo được sửa và đổi tên

- `src/app.js` → `src/ung-dung.js`: lắp route, CORS, phản hồi và xử lý lỗi.
- `src/server.js` → `src/may-chu.js`: HTTP, Socket.IO, tác vụ định kỳ và tắt kết nối có kiểm soát.
- `src/config/database.js` → `src/config/co-so-du-lieu.js`: nhóm kết nối mysql2, múi giờ và kiểu dữ liệu tiền/ID.
- `package.json`: điểm khởi động tiếng Việt, lệnh chạy/kiểm thử/định dạng, thêm Prettier vào devDependencies.
- `package-lock.json`: cập nhật tương ứng với cài Prettier. Những thay đổi trong node_modules do npm sinh ra, không phải mã ứng dụng.

## Tệp nguồn được bổ sung

Có 46 tệp JavaScript trong src, gồm ba tệp thay thế ở trên và các tệp bổ sung sau:

- `src/config/moi-truong.js`
- `src/controllers/danh-muc-san-pham.js`
- `src/controllers/dau-gia.js`
- `src/controllers/don-hang.js`
- `src/controllers/nguoi-dung.js`
- `src/controllers/tuong-tac.js`
- `src/controllers/xu-ly-http.js`
- `src/jobs/lich-chay.js`
- `src/middlewares/gioi-han-yeu-cau.js`
- `src/middlewares/xac-thuc.js`
- `src/middlewares/xu-ly-loi.js`
- `src/repositories/ban-ghi.js`
- `src/repositories/danh-muc-san-pham.js`
- `src/repositories/dau-gia.js`
- `src/repositories/don-hang.js`
- `src/repositories/he-thong.js`
- `src/repositories/ket-noi.js`
- `src/repositories/nguoi-dung.js`
- `src/repositories/tuong-tac.js`
- `src/routes/danh-muc-san-pham.js`
- `src/routes/dau-gia.js`
- `src/routes/don-hang.js`
- `src/routes/nguoi-dung.js`
- `src/routes/tai-tep.js`
- `src/routes/tuong-tac.js`
- `src/services/cau-hinh.js`
- `src/services/danh-muc-san-pham.js`
- `src/services/dau-gia.js`
- `src/services/de-nghi-mua-tiep.js`
- `src/services/don-hang.js`
- `src/services/nguoi-dung.js`
- `src/services/nhat-ky-thong-bao.js`
- `src/services/tai-tep.js`
- `src/services/tinh-gia-tu-dong.js`
- `src/services/tranh-chap.js`
- `src/services/tuong-tac.js`
- `src/sockets/ket-noi.js`
- `src/sockets/su-kien.js`
- `src/utils/du-lieu-cong-khai.js`
- `src/utils/loi.js`
- `src/utils/thoi-gian.js`
- `src/utils/tien.js`
- `src/validators/du-lieu-dau-vao.js`

## Kiểm tra, kiểm thử và định dạng

- `.gitignore`
- `.prettierignore`
- `.prettierrc.json`
- `scripts/kiem-tra-cau-truc.js`
- `scripts/kiem-tra.js`
- `tests/helpers/dong-ket-noi.js`
- `tests/helpers/du-lieu-mau.js`
- `tests/http.test.js`
- `tests/integration/api-day-du.test.js`
- `tests/integration/dong-thoi.test.js`
- `tests/integration/ket-qua-va-tac-vu.test.js`
- `tests/integration/nghiep-vu.test.js`
- `tests/integration/tep-va-san-pham.test.js`
- `tests/tinh-gia.test.js`

## Tài liệu và bộ yêu cầu mẫu

- `HUONG-DAN.md`
- `docs/danh-sach-api.md`
- `docs/doan4-dau-gia.postman_collection.json`
- `docs/huong-dan-postman.md`
- `docs/nghiep-vu-va-gioi-han.md`
- `docs/tep-da-thay-doi.md`

## Phạm vi đổi tên và bảo toàn dữ liệu

Các tên tiếng Anh tạm xuất hiện trong quá trình triển khai đã được thay bằng tên tiếng Việt tương ứng, đồng thời cập nhật mọi đường dẫn require và lệnh chạy. Không để lại hai bộ triển khai cũ/mới chạy song song. Thư mục kiến trúc (routes, controllers, services, repositories...) giữ tên để đúng cấu trúc đã chọn.

Không sửa frontend, tệp SQL gốc hoặc cấu trúc MySQL. Không đọc hoặc sửa nội dung .env; phần JWT_SECRET do chủ project tự bổ sung. Không xóa dữ liệu mẫu. Kiểm thử đăng nhập tài khoản mẫu có cập nhật thời điểm đăng nhập cuối như luồng đăng nhập bình thường. Dữ liệu tạo riêng cho kiểm thử được rollback hoặc dọn theo UUID của từng lần chạy.

Git có thể hiển thị file cũ là D và file mới là U trong quá trình đổi tên, hoặc ít file thay đổi hơn danh sách này nếu đã lưu một phần công việc vào Git giữa chừng. Danh sách trên mô tả kết quả của toàn bộ lần triển khai, không dùng trạng thái Git giữa chừng làm mốc audit.
