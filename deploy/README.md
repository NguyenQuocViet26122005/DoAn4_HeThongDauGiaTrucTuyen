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

## Tự triển khai khi push lên main

Workflow `.github/workflows/trien-khai.yml` chạy khi push lên `main` hoặc chọn **Actions → Triển khai VietBid → Run workflow** trên nhánh `main`. GitHub cài thư viện, kiểm tra backend/frontend và công cụ triển khai, build frontend với API cùng tên miền, rồi đóng gói backend cùng thư viện Linux. Mỗi lượt chỉ triển khai một bản; lượt đang triển khai được phép hoàn tất trước lượt tiếp theo.

Một lần thiết lập ban đầu:

1. Cấp một khóa SSH riêng cho GitHub Actions trong tài khoản hosting `vietbid-qviet2612`. Lưu khóa riêng trong **repository Actions Secret** tên `ALWAYSDATA_SSH_KEY`; không đưa vào tệp mã nguồn. Khóa SSH của tài khoản này có quyền truy cập tệp của hosting, vì vậy chỉ cấp cho repository do mình quản lý. Người có quyền sửa workflow trên `main` có thể sử dụng quyền triển khai này.
2. Cài các tệp `deploy/chay-alwaysdata.cjs`, `deploy/quan-ly-phat-hanh.cjs`, `deploy/phat_hanh.py`, `deploy/kiem-tra-websocket.cjs` đã kiểm tra vào thư mục dự án trên hosting. Khởi động lại site một lần để trình quản lý bản chạy có hiệu lực. Lệnh site vẫn là `node deploy/chay-alwaysdata.cjs`.
3. Đối chiếu host key SSH và tệp `deploy/alwaysdata_known_hosts`. Workflow kiểm tra host key nghiêm ngặt, không tự chấp nhận host key mới trong mỗi lượt chạy.
4. Chạy workflow đầu tiên và kiểm tra kết quả **DEPLOYED** cùng bước kiểm tra phiên bản/API/WebSocket. Khi chưa có Secret, workflow chỉ build và ghi rõ chưa triển khai trong bản tổng kết.

Máy chủ nhận gói vào `.incoming`, kiểm tra đường dẫn/kích thước gói, thư viện native và cấu trúc CSDL trước khi chuyển bản chạy. Các bản nằm trong `.releases`; con trỏ `backend/.local/current-release.json` được thay nguyên tử. Tiến trình quản lý dừng worker cũ theo cơ chế graceful shutdown rồi chạy worker của bản mới. Cấu hình MySQL/JWT và ảnh tiếp tục nằm trong vị trí lưu bền vững ban đầu, không đóng gói hay truyền qua GitHub.

Kiểm tra sau triển khai yêu cầu cả `/api/health` và `/version.json` khớp SHA của commit. Nếu bản mới không lên được, bộ nhận tự khôi phục con trỏ trước đó rồi kiểm tra lại. Chỉ giữ bản hiện tại và bản liền trước sau lượt triển khai thành công; bản cài đặt ban đầu vẫn có thể dùng khi chưa có con trỏ. Kết nối Socket.IO sẽ kết nối lại trong lúc đổi worker; có thể gián đoạn ngắn lúc cập nhật.

Thay đổi schema cần migration được kiểm tra và sao lưu riêng. Workflow không tự chạy SQL tạo mới hoặc migration trên CSDL đang có dữ liệu; cấu trúc không khớp sẽ chặn bản mới trước khi chuyển. Bộ quản lý/bootstrap tại thư mục `deploy` của hosting là phần vận hành cố định; khi nâng cấp chính bộ quản lý này, cần cập nhật nó và khởi động lại site có kiểm soát.

Tài liệu chính thức: [gói alwaysdata](https://www.alwaysdata.com/en/offers/), [cấu hình Node.js](https://help.alwaysdata.com/en/docs/web-hosting/languages/nodejs/configuration/), [WebSocket](https://help.alwaysdata.com/en/blog/2023-03-14-hold-on-to-your-socks-high-speed-data-stream-hosting-with-websockets/).

## Kết quả triển khai ngày 26/11/2026

- Website: [VietBid](https://vietbid-qviet2612.alwaysdata.net/). Node.js, MariaDB và ảnh tải lên đều ở hosting alwaysdata Free, chạy độc lập với máy phát triển và đường hầm demo trước đây.
- Bản mã ứng dụng triển khai: `ff4e5b8`. Site dùng Node.js 24, lệnh `node deploy/chay-alwaysdata.cjs`, thư mục `vietbid`, thời gian dừng khi không hoạt động đặt bằng `0`.
- CSDL MariaDB 11.8 đã khởi tạo và đối chiếu đủ 21 bảng, 324 cột, không thiếu cột/bảng, tất cả dùng InnoDB. Cấu hình và mật khẩu chỉ lưu ở tệp riêng trên máy chủ.
- Quản trị: `admin@vietbid.example`, mật khẩu do người vận hành tự đặt trong SSH. Không lưu mật khẩu trong tài liệu hoặc Git.
- Kiểm tra trực tiếp đã đạt: HTTPS, giao diện và đường dẫn React trực tiếp, API/danh mục, đăng ký/đăng nhập, chặn truy cập quản trị sai quyền, tải/đọc ảnh, bảo vệ tệp bằng chứng và WebSocket WSS. Đã khởi động lại site, đóng SSH rồi kiểm tra lại đăng nhập, ảnh và WSS thành công.
- Tác vụ nền bật, chạy mỗi 60 giây; lần đọc trạng thái sau khởi động lại trả `enabled=true`, `failed=0`. Bộ kiểm thử backend tại thời điểm triển khai đạt 33/33.
- Bản cloud dùng CSDL mới, có quản trị và một tài khoản kiểm tra tổng hợp được đánh dấu trong tên; chưa có sản phẩm hoặc phiên đấu giá. Không chuyển người dùng, hồ sơ hay giao dịch từ CSDL cá nhân. Các luồng cọc/trả giá/đơn hàng chưa được kiểm thử giao dịch đầy đủ trên bản cloud mới; các kết quả kiểm thử cục bộ trước đó không thay thế bước này.
- AI gọi API trả phí đang tắt. Thanh toán, đặt cọc và vận chuyển tiếp tục là mô phỏng. Đây là cấu hình cho đồ án cá nhân trong giới hạn gói Free; chưa kiểm thử tải và OCR với giới hạn RAM của hosting.
