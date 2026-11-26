# Triển khai VietBid trên cloud

Frontend, `/api` và `/socket.io` có thể chạy chung một tiến trình Node.js khi đặt `WEB_DIST` đến thư mục đã build của frontend. MySQL và ảnh tải lên phải được lưu bền vững. Tắt máy phát triển không ảnh hưởng đến bản đã triển khai trên hosting; đường hầm từ máy cá nhân vẫn phụ thuộc máy đó.

## alwaysdata Free

Hướng triển khai không cần thẻ được chọn ngày 26/11/2026. Gói Free dành cho sử dụng cá nhân có 1 GB dung lượng chung cho tệp và CSDL, RAM 256 MB và ¼ CPU. Cần kiểm tra giới hạn trên tài khoản tại thời điểm triển khai. Northflank đã yêu cầu phương thức thanh toán trong luồng đăng ký nên không dùng cho bản này.

1. Tạo tài khoản hosting Free và một database rỗng. alwaysdata hiện cấp MariaDB 11.8; dự án gốc dùng MySQL 8, vì vậy phải kiểm tra schema, trigger, JSON và các luồng giao dịch trên hosting trước khi xác nhận tương thích.
2. Build backend bằng `npm --prefix backend ci` rồi `npm --prefix backend run build`. Build frontend bằng `npm --prefix frontend ci` rồi `npm --prefix frontend run build`, với `VITE_API_URL=/api`. Có thể build trên máy phát triển rồi chuyển hai thư mục `dist` lên hosting để giảm tải RAM.
3. Cài dependencies backend cho Linux trên hosting bằng `npm --prefix backend ci --omit=dev`. Không chuyển `node_modules` của Windows lên Linux. Không cài dependencies của ứng dụng mobile lên hosting.
4. Tại thư mục dự án trên SSH, chạy `python3 deploy/cau-hinh-alwaysdata.py TEN_TAI_KHOAN`. Công cụ dùng database `TEN_TAI_KHOAN_auction`, hỏi mật khẩu MySQL bằng ô nhập kín, chỉ tiếp tục nếu kết nối thành công và database rỗng. Sau khi khởi tạo/kiểm tra schema, người vận hành đặt mật khẩu quản trị cho `admin@vietbid.example`. Bí mật được lưu trong `backend/.local/alwaysdata.json` với quyền `0600`, đã nằm ngoài Git. Công cụ không ghi đè cấu hình, không xóa CSDL và không nhận mật khẩu qua tham số dòng lệnh. Nếu schema lỗi giữa chừng, dừng để kiểm tra nguyên nhân trước khi xử lý; không tự chạy lại hoặc xóa bảng.
5. Trong **Web → Sites**, chọn Node.js 24, thư mục làm việc là thư mục dự án, lệnh `node deploy/chay-alwaysdata.cjs`. Trình chạy đọc cấu hình riêng và dùng `IP`/`PORT` do hosting cấp; cấu hình không chứa hai biến này. Chỉ công bố site sau khi công cụ khởi tạo báo `ALWAYSDATA_CONFIG_READY`.
6. Công cụ chỉ bật tác vụ nền sau khi đã kiểm tra schema và tạo quản trị. Dùng dữ liệu thử tổng hợp; không sao chép người dùng, địa chỉ, hồ sơ hoặc giao dịch cá nhân lên bản công khai. Kiểm tra thiết lập dừng site khi không hoạt động để tác vụ hết hạn phiên vẫn chạy.
7. Thử HTTPS `/api/health`, đường dẫn trực tiếp của React, đăng nhập, tải ảnh, đặt cọc, trả giá và Socket.IO. Khởi động lại site, kiểm tra lại MySQL và ảnh trước khi công bố hoàn tất.

OCR có thể cần nhiều RAM hơn mức gói Free. Cần đo trên hosting; chưa coi xử lý ảnh đã được xác nhận chỉ vì các luồng thông thường chạy được. AI trả phí mặc định tắt; đặt cọc, thanh toán và vận chuyển vẫn là mô phỏng của đồ án.

| Biến                                                      | Giá trị                                                       |
| --------------------------------------------------------- | ------------------------------------------------------------- |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Kết nối database riêng do hosting cấp                         |
| `FRONTEND_URL`                                            | URL HTTPS công khai, bỏ dấu `/` cuối                          |
| `JWT_SECRET`                                              | Chuỗi ngẫu nhiên riêng dài ít nhất 32 byte                    |
| `DB_TIMEZONE`                                             | `+07:00`                                                      |
| `WEB_DIST`                                                | Đường dẫn tuyệt đối đến `frontend/dist`                       |
| `UPLOAD_ROOT`                                             | Thư mục ảnh bền vững có quyền ghi                             |
| `JOBS_ENABLED`                                            | `false` lúc khởi tạo, `true` sau khi kiểm tra CSDL            |
| `AI_ENABLED`                                              | `false` cho bản không dùng API trả phí                        |
| `TRUST_PROXY_HOPS`                                        | Mặc định `0`; chỉ thay đổi khi đã xác minh đường đi qua proxy |

## Container trên nền tảng khác

`Dockerfile` tại gốc repo build frontend và backend thành dịch vụ HTTP cổng `8080`. Gắn volume có quyền ghi cho UID 1000 vào `/app/backend/uploads`, cung cấp MySQL bền vững và các biến bên trên. Trong container, chạy `node khoi-tao-mysql.cjs` một lần trước khi bật tác vụ nền. Docker image cần được build và kiểm tra trên môi trường có Docker; kiểm thử Node trên Windows không thay thế bước này.

Tài liệu chính thức: [gói alwaysdata](https://www.alwaysdata.com/en/offers/), [cấu hình Node.js](https://help.alwaysdata.com/en/docs/web-hosting/languages/nodejs/configuration/), [WebSocket](https://help.alwaysdata.com/en/blog/2023-03-14-hold-on-to-your-socks-high-speed-data-stream-hosting-with-websockets/).
