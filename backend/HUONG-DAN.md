# Backend — Đồ án 4: Hệ thống đấu giá trực tuyến

Backend TypeScript + Express + Zod (biên dịch sang CommonJS) dùng MySQL 8 `doan4_daugia`, đã đồng bộ cấu trúc 21 bảng. Mã nguồn chia theo Route → Controller → Service → Repository → MySQL. Tên tệp, hàm và biến nghiệp vụ dùng tiếng Việt không dấu; chú thích và thông báo dùng tiếng Việt có dấu. Tên thư mục kiến trúc, cú pháp TypeScript, API thư viện và hợp đồng HTTP/Socket.IO giữ quy ước kỹ thuật đang dùng.

## Chạy trên máy hiện tại

Mở terminal trong thư mục `backend`:

```powershell
npm install
npm run dev
```

Đã kiểm thử bằng Node.js 24.13.0. `npm run dev` chạy TypeScript bằng tsx. Khi chạy bản biên dịch, dùng `npm run build` rồi `npm start`. Điểm khởi động là `src/may-chu.ts`; cấu hình Express ở `src/ung-dung.ts`. Khi có lỗi `EADDRINUSE`, dừng phiên backend cũ đang dùng cổng 5000 trước khi chạy lại.

**Thử giao diện trên máy:** dùng `npm run dev:local`. Chế độ này chỉ lắng nghe `127.0.0.1`, dùng MySQL hiện có, cho phép API đầy đủ và luôn tắt jobs để không tự xử lý phiên mẫu quá hạn. Nếu thiếu `JWT_SECRET`, tạo khóa ngẫu nhiên 48 byte trong `backend/.local/jwt.key` (bỏ qua bởi Git), tái sử dụng khi khởi động lại; không xuất khóa ra log và không sửa `.env`. Khóa đã cấu hình được giữ nguyên, khóa quá ngắn bị từ chối. Lệnh từ chối `NODE_ENV=production`. Sau khi đổi mã backend, dừng và chạy lại. Chạy thông thường/production vẫn cần `JWT_SECRET` riêng; dùng `npm run dev` hoặc `npm start` với `JOBS_ENABLED` phù hợp khi cần tác vụ đúng lịch.

Ứng dụng tự nạp `backend/.env`. Không cần gửi nội dung tệp này cho người khác. Các tên cấu hình ứng dụng sử dụng:

- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`: dùng kết nối MySQL hiện có; tên database là `doan4_daugia`.
- `DB_PORT`: mặc định 3306.
- `JWT_SECRET`: cần được cấu hình riêng trên máy, tối thiểu 32 byte. Không có giá trị dự phòng trong mã nguồn.
- `PORT`: mặc định 5000.
- `FRONTEND_URL`: mặc định `http://localhost:5173`; nhiều nguồn được phân cách bằng dấu phẩy.
- `DB_TIMEZONE`: mặc định `+07:00`, cần khớp cách hiểu thời gian DATETIME hiện có.
- `JOBS_ENABLED`: mặc định bật; đặt `false` khi muốn tạm dừng tác vụ tự động lúc kiểm tra dữ liệu.

Các lệnh trên không tạo lại database, không chạy tệp SQL gốc và không thay schema. File SQL gốc hiện là bản khởi tạo 21 bảng cho database chưa tồn tại. Database trên máy đã chuyển xong; không cần chạy lại SQL. Xem `../co-so-du-lieu/HUONG-DAN-CSDL.md` để tra sơ đồ và bản sao.

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
- Kiểm định theo từng lần, biên bản tiếp nhận, báo cáo chuyên gia, trung tâm giữ/gửi hàng và phân quyền hồ sơ.
- Đăng ký/cọc theo phiên, hoàn cọc, chuyển cọc vào đơn, thu phần còn lại và giữ cọc quá hạn chờ Admin. Chính sách cọc tắt cho đến khi Admin cấu hình rồi bật.
- Chốt phiên, thanh toán mô phỏng, giữ tiền trung gian, giao/kiểm tra hàng, giải ngân và hoàn tiền. Mua ngay và chấp nhận Second Chance thu đủ trong cùng transaction trước khi hoàn tất.
- Second Chance theo giá trả công khai hợp lệ, đánh giá hai chiều, vi phạm, thông báo, thống kê và nhật ký quản trị.
- Tác vụ định kỳ mở/đóng phiên, xử lý hạn thanh toán/đề nghị/kiểm tra hàng, ghi nhận gửi hàng muộn.
- Tải ảnh/tài liệu bằng Multer, kiểm tra quyền sở hữu và quyền đọc giấy tờ/bằng chứng.

Mức giá tối đa được lưu riêng để tính đấu giá. API và Socket.IO không trả trường này; nhật ký mới không ghi mức tối đa hoặc mật khẩu.

Ngày 02/10/2026, web đã nối thêm các API địa chỉ, đăng ký/cọc, đặt giá, Mua ngay và xem biên nhận đơn. Luồng thanh toán giữ khóa yêu cầu để lấy lại kết quả khi mất phản hồi; không đổi schema hoặc API nghiệp vụ trong đợt này. Toàn bộ số tiền và điều kiện giao dịch vẫn do backend kiểm tra trong transaction. Xem `../frontend/README.md` để chạy máy chủ giao diện kiểm thử riêng với các cờ `--nguoi-mua` và `--mat-phan-hoi`.

## Kiểm thử

Ngày 03/10/2026, web nối danh sách/chi tiết đơn, đổi địa chỉ đơn, thanh toán phần còn lại, xác nhận đã nhận và hoàn tất. Phản hồi `payments/simulate` là chi tiết đơn với `thanh_toan`, không phải đối tượng `ket_qua_mo_phong` của Mua ngay; web kiểm tra giao dịch đã ghi trước khi báo kết quả. Máy chủ thử hỗ trợ thêm `--don-hang`; dữ liệu và ảnh được hoàn tác/dọn khi nhấn Enter. Không đổi API hay schema trong đợt này.

Chạy trong `backend`:

```powershell
npm run check
npm test
npm run check:schema
npm run test:api
npm run test:integration
npm run format:check
```

`check` kiểm tra kiểu TypeScript và các đường dẫn import. `npm test` kiểm tra bộ tính giá và các phản hồi HTTP cơ bản. `check:schema` chỉ đọc cấu trúc MySQL, đối chiếu các cột đang được sử dụng và kiểm tra InnoDB. Kiểm thử tích hợp cần MySQL. Công cụ tự tạo JWT ngẫu nhiên chỉ cho tiến trình kiểm thử, không sửa khóa chạy ứng dụng. Các lệnh `test:api` và `test:integration` tự chọn database riêng `doan4_daugia_kiem_thu`, tắt jobs nền và không sửa `.env`. Sau khi dọn CSDL phụ, chạy `npm run test:prepare` một lần để tạo lại database kiểm thử từ SQL chính và cấu hình công khai. Không sao chép tài khoản/dữ liệu riêng tư. Nếu database kiểm thử đã tồn tại, công cụ dừng để tránh ghi đè.

Kiểm tra lại ngày 01/10/2026: 18 kiểm thử đơn vị/HTTP và 55 kiểm thử tích hợp đạt. 29 kiểm tra ràng buộc MySQL đã đạt ở đợt nâng cấp 21 bảng. Bộ tích hợp gồm các giao dịch được rollback, kiểm thử HTTP tải tệp và nhiều kết nối MySQL thật cùng thao tác. Ca nhiều kết nối tạo dữ liệu riêng có UUID, commit để các kết nối nhìn thấy nhau, rồi dọn đúng các bản ghi kiểm thử. Tệp tải lên trong kiểm thử cũng được dọn. Các dữ liệu mẫu có sẵn không bị xóa/reset; số tự tăng có thể có khoảng trống sau kiểm thử.

Riêng `npm run test:api` chạy hai bộ HTTP đối chiếu route thật: đủ 104/104 API có ít nhất một trường hợp thành công. Bộ nền gửi 180 yêu cầu (38 trường hợp lỗi), gồm đổi ảnh đại diện, không gắn ảnh trùng và khóa sửa; bộ còn lại kiểm tra thêm 16 API kiểm định/cọc và các nhánh sai quyền, thiếu báo cáo, sai số tiền, tệp riêng tư. Bộ test đối chiếu đường dẫn với route trong mã nguồn, kiểm tra dữ liệu phản hồi, phân quyền, bí mật đầu ra và các chuyển trạng thái nghiệp vụ. Kết quả này không thay thế kiểm thử tải hoặc chứng minh mọi tổ hợp đầu vào đều đúng. Tất cả thay đổi dữ liệu của bộ test API, kể cả cấu hình nghiệp vụ, nằm trong transaction được rollback; tệp tải lên được dọn sau đó.

Bộ `test:api` đã chạy lại thành công ngày 02/10/2026 khi nối giao diện người mua. Máy chủ kiểm thử giao diện cũng đã xác nhận thao tác lấy lại kết quả Mua ngay sau mất phản hồi và tải lại trang. Không thay đổi transaction hoặc quy tắc đấu giá/thanh toán trong backend ở đợt giao diện này.

Bộ API kiểm thử chạy ứng dụng trên cổng riêng rồi dừng. Để sử dụng cổng 5000, chạy `npm run dev`; không cần chạy lại SQL. Các tác vụ nền chỉ nên bật khi sẵn sàng cho hệ thống xử lý các phiên/đơn đã đến hạn.

Kiểm thử tác vụ chạy cả bộ lập lịch trong transaction rồi rollback, để xác nhận nghiệp vụ mà không lưu việc chuyển trạng thái của dữ liệu mẫu. Nên dừng backend đang chạy tác vụ tự động khi thực hiện bộ tích hợp để tránh một tiến trình bên ngoài kiểm thử cùng quét dữ liệu.

## Đọc mã nguồn

Bắt đầu từ `routes/dau-gia.ts` → `controllers/dau-gia.ts` → `services/dau-gia.ts`. Hàm `tinhKetQuaDauGia` trong `services/tinh-gia-tu-dong.ts` chỉ tính giá; service giữ khóa phiên và ghi kết quả. `repositories/ket-noi.ts` quản lý transaction, thử lại khi xung đột khóa và gửi sự kiện sau commit. Tất cả đường dẫn trên nằm dưới `src`.

Lệnh `npm run format` từ gốc, backend hoặc frontend đều dùng cùng cấu hình cho toàn dự án: thụt lề 2 khoảng trắng, một câu lệnh một dòng, dấu chấm phẩy và xuống dòng những lời gọi dài. Các truy vấn SQL dài được chia dòng trong repository.

## Các giới hạn cần biết

Thanh toán và giải ngân là mô phỏng; phí vận chuyển cố định được công bố từ phiên và chụp sang đơn. Chưa tích hợp đơn vị vận chuyển, cổng thanh toán thật, email/SMS, khôi phục mật khẩu hoặc refresh token. Frontend đã có trang công khai, đăng nhập/đăng ký, quản lý sản phẩm người bán, Admin duyệt sản phẩm, luồng kiểm định và người bán tạo/quản lý phiên, gửi yêu cầu hủy. Các màn hình tài khoản bổ sung, Admin xét yêu cầu hủy và giao dịch trên web còn phải hoàn thiện theo tài liệu nghiệp vụ.

Tác vụ chạy mỗi 60 giây và bắt đầu sau chu kỳ đầu tiên, nên chuyển trạng thái hiển thị có thể chậm khoảng một phút. API đặt giá/thanh toán vẫn tự kiểm tra giờ và trạng thái khi nhận yêu cầu.

Kiểm tra ngày 01/10/2026: `.env` và `node_modules` không còn được Git theo dõi ở phiên bản hiện tại; quy tắc ignore giữ chúng trên máy. Việc bỏ theo dõi không xóa nội dung khỏi lịch sử commit cũ. Không đưa tệp cấu hình riêng hoặc bản sao dữ liệu vào repository.

## Quy tắc trình bày chung

Chạy `npm run format` và `npm run format:check` tại gốc dự án. Công cụ kiểm tra ngoặc nhọn, xuống dòng object nhiều thuộc tính, khoảng cách giữa các nhóm bước và định dạng Prettier. Quy tắc lưu ở `../.cursor/rules/code-de-doc.mdc`; `.editorconfig` quy định thụt lề 2 khoảng trắng. Tách hàm và phân nhóm nghiệp vụ vẫn cần người viết đọc lại, không giao hoàn toàn cho formatter.

Mã nguồn nằm trong `src/*.ts`; `dist` là kết quả build, không sửa trực tiếp. `validations` chứa schema Zod và chuẩn hóa đầu vào; `types` chứa kiểu dùng chung. TypeScript đang được chuyển dần: vẫn cho phép implicit any và chưa bật strict null checks cho toàn bộ code cũ.
