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

## Duyệt sản phẩm và kiểm định

- Admin mở **Quản trị → Duyệt sản phẩm** tại `/quan-tri/san-pham`: tìm/lọc hồ sơ, xem chi tiết, duyệt hoặc từ chối có lý do.
- Với hàng bắt buộc kiểm định: **Mở hồ sơ → Tiếp nhận hàng → Bắt đầu kiểm định → Tải báo cáo → Ghi kết quả → Quay lại duyệt sản phẩm**. Kết quả đạt chưa tự duyệt nội dung.
- Danh sách Admin ở `/quan-tri/kiem-dinh`; người bán ở `/nguoi-ban/kiem-dinh`. Có tìm kiếm, bộ lọc trạng thái, phân trang và trang chi tiết.
- Người bán khai báo vận chuyển khi chờ gửi. Admin ghi tiếp nhận, kết quả, yêu cầu bổ sung hoặc trả hàng theo trạng thái API cho phép. Khi hồ sơ có nghĩa vụ giao dịch hoặc đã trả hàng, màn hình giải thích lý do chỉ xem.
- Tệp kiểm định nhận JPG/PNG/WebP/PDF tối đa 10 MiB. Gắn tệp lỗi có thể thử lại; tệp riêng được tải qua yêu cầu có xác thực. Thiếu báo cáo chưa ghi được kết quả.

## Tạo và quản lý phiên đấu giá

- **Bán đấu giá → Phiên đấu giá** tại `/nguoi-ban/phien`: danh sách của chính người bán, tìm tên, lọc trạng thái, phân trang và xem chi tiết.
- `/nguoi-ban/phien/moi`: chọn sản phẩm đã duyệt, đủ kiểm định/lưu giữ và chưa có phiên trùng; nhập giá khởi điểm, giá sàn/Mua ngay tùy chọn, phí vận chuyển và thời gian. Giao diện kiểm tra thứ tự giá/lịch và có xác nhận trước khi tạo qua API thật.
- Lịch nhập theo giờ Việt Nam (UTC+7); backend kiểm tra lại theo giờ MySQL. Chính sách cọc do Admin cấu hình, phiên chụp chính sách khi tạo; người bán không tự đặt tỷ lệ cọc.
- `/nguoi-ban/phien/:id`: xem giá công khai, lịch, kết quả, phí và cọc; gửi yêu cầu hủy có lý do, xem trạng thái/phản hồi mới nhất sau tải lại. Gửi yêu cầu không dừng phiên ngay. Khi có yêu cầu chờ xét hoặc phiên đã hết hạn/kết thúc, nút gửi bị khóa.
- Chưa sửa giá/lịch phiên đã tạo hoặc cập nhật realtime trên các trang này; có nút làm mới. API riêng không trả giá sàn hoặc mức tối đa của người tham gia.

## Còn phải triển khai

Các màn hình địa chỉ, xác minh, đơn hàng, thông báo, tranh chấp và những mục Admin ngoài duyệt sản phẩm/kiểm định còn là bố cục và lời giải thích. Đặt cọc, trả giá, Mua ngay, thanh toán, Second Chance và realtime chưa có luồng thao tác trên web. Các mục này không hiển thị số liệu hay nút thành công giả.

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

Ảnh bìa trang chủ là tài nguyên trang trí, không thay thế ảnh sản phẩm. Ảnh sản phẩm thật phải do người bán cung cấp. Đã bỏ các tài nguyên mẫu không còn dùng: `src/assets/hero.png`, `src/assets/react.svg`, `src/assets/vite.svg`, `public/icons.svg`; giữ ảnh bìa hiện tại và favicon VietBid.

## Kiểm tra giao diện bằng dữ liệu riêng

Sau `npm run test:prepare` (chỉ khi CSDL kiểm thử chưa tồn tại), chạy `node scripts/kiem-thu-giao-dien.js` trong backend. Máy chủ thử dùng cổng 5001, có tài khoản Admin/người bán/người mua và hai sản phẩm chờ duyệt (có/không bắt buộc kiểm định). Tài khoản thử được in ở terminal; ảnh minh họa chỉ dùng kiểm thử, tệp nằm riêng trong `backend/uploads-kiem-thu`. Mở terminal frontend khác, đặt `$env:VITE_API_URL='http://127.0.0.1:5001/api'` rồi chạy `npm run dev -- --port 5174`. Dùng `http://localhost:5174` để không tác động dữ liệu chính. Nhấn Enter ở terminal backend để đóng và rollback dữ liệu, dọn ảnh thử; sau đó dừng Vite thử.

Để thử luồng tạo phiên, thêm `--phien`: `node scripts/kiem-thu-giao-dien.js --phien`. Công cụ duyệt sẵn sản phẩm thử không bắt buộc kiểm định, vẫn giữ sản phẩm còn lại chờ xử lý. Phạm vi CSDL, cổng và cơ chế rollback giữ nguyên.

Đã kiểm tra trên trình duyệt ngày 26/09/2026: đăng nhập, danh sách rỗng, lỗi trường bắt buộc, lưu bản nháp khi thiếu thuộc tính, tải hai ảnh, đổi ảnh đại diện, nhập/lưu thuộc tính ngày và đúng/sai, gửi duyệt và khóa sửa, chặn người mua chưa xác minh. Danh sách và biểu mẫu không tràn ngang ở chiều rộng kiểm tra 424 px; bố cục PC là ưu tiên. Backend: 18 kiểm thử cơ bản và 54 tích hợp đạt; frontend build, lint và formatter đạt.

Đã kiểm tra luồng Admin trên trình duyệt ngày 30/09/2026: chặn duyệt khi thiếu kiểm định, mở hồ sơ, nhận hàng, bắt đầu kiểm định, chặn ghi kết quả thiếu báo cáo, tải/gắn ảnh báo cáo thử, ghi đạt và duyệt nội dung. Đã kiểm tra từ chối bắt buộc có lý do. Toàn bộ thao tác dùng CSDL kiểm thử riêng; không duyệt sản phẩm trong CSDL chính.

Đã kiểm tra luồng người bán trên trình duyệt ngày 01/10/2026: mở danh sách/hồ sơ kiểm định, báo lỗi khi bỏ trống thông tin gửi hàng, lưu đơn vị vận chuyển và mã vận đơn, chuyển sang đang gửi đến trung tâm. Người bán không có nút tiếp nhận, ghi kết quả hoặc tải báo cáo của Admin. Dữ liệu dùng riêng cho kiểm thử và được hoàn tác sau khi kiểm tra.

Đã kiểm tra luồng phiên người bán trên trình duyệt ngày 01/10/2026: chỉ chọn được sản phẩm đủ điều kiện; lỗi thiếu sản phẩm/giá, giá sàn thấp hơn khởi điểm, Mua ngay thấp hơn giá sàn, lịch kết thúc không hợp lệ; xác nhận và tạo phiên; tìm kiếm danh sách; gửi yêu cầu hủy và tải lại vẫn thấy chờ duyệt. Sản phẩm đã có phiên không xuất hiện trong bộ chọn. Bố cục PC đã kiểm tra; danh sách/biểu mẫu không tràn ngang ở vùng hiển thị 444 px.

Kiểm tra tổng cuối đợt ngày 01/10/2026: định dạng/kiểm tra kiểu/lint đạt; 18 kiểm thử cơ bản và 55 kiểm thử tích hợp đạt (bao phủ 104 API); bản build frontend thành công. Vite còn cảnh báo một gói dùng chung lớn hơn 500 kB, cần tối ưu dung lượng ở đợt hiệu năng. Đã dừng máy chủ thử, hoàn tác tài khoản/sản phẩm thử và dọn ảnh trong `backend/uploads-kiem-thu`. Máy chủ dùng CSDL chính chạy ở cổng 5000, giao diện ở 5173.
